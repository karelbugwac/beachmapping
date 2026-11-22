import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { once } from 'node:events';
import { compressImageBuffer } from '../lib/server/imagecompression';
import { IMAGE_UPLOAD_CONFIG } from '../lib/utils/image-upload-config';
import { detectImageMime } from '../lib/utils/image-validation';
import type { Database } from '../lib/supabase/types';

interface ProfileRow {
  id: string;
  profileimageurl: string | null;
}

interface MigrationResult {
  userid: string;
  status: 'pending' | 'migrated' | 'skipped' | 'failed' | 'restored' | 'rolled_back';
  storagepath?: string;
  new_url?: string;
  original_hash?: string;
  error?: string;
}

type MigrationClient = SupabaseClient<Database>;

const BATCH_SIZE = 25;
const outputDirectory = path.resolve('.local-migrations');
const mode = process.argv[2];
const isApply = mode === '--apply';
const isRollback = mode === '--rollback';
const isDryRun = !mode;

function getSupabaseClient() {
  const target = process.env.SUPABASE_PROFILE_MIGRATION_TARGET;
  if (target !== 'local' && target !== 'staging') {
    throw new Error('Set SUPABASE_PROFILE_MIGRATION_TARGET to local or staging. Production targets are not supported.');
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.');
  }
  if (target === 'local' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(url)) {
    throw new Error('The local migration target must use a localhost Supabase URL.');
  }
  if (target === 'staging') {
    const stagingProjectRef = process.env.SUPABASE_PROFILE_MIGRATION_STAGING_PROJECT_REF;
    if (!stagingProjectRef || new URL(url).hostname !== `${stagingProjectRef}.supabase.co`) {
      throw new Error('For staging, set the exact staging project ref and use its matching Supabase URL.');
    }
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function forEachProfileBatch(
  client: MigrationClient,
  visit: (rows: ProfileRow[]) => Promise<void> | void
) {
  for (let from = 0; ; from += BATCH_SIZE) {
    const { data, error } = await client
      .from('profiles')
      .select('id, profileimageurl')
      .ilike('profileimageurl', 'data:image/%')
      .order('id')
      .range(from, from + BATCH_SIZE - 1);
    if (error) throw error;
    const batch = (data || []) as ProfileRow[];
    await visit(batch);
    if (batch.length < BATCH_SIZE) return;
  }
}

function estimateDataUrlBytes(value: string): number {
  const encoded = value.slice(value.indexOf(',') + 1);
  const padding = encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor(encoded.length * 3 / 4) - padding);
}

function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function decodeImageDataUrl(value: string): Buffer {
  const match = /^data:image\/(?:jpeg|jpg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(value);
  if (!match) throw new Error('Unsupported or malformed image data URL.');
  const bytes = Buffer.from(match[1], 'base64');
  if (!detectImageMime(bytes.subarray(0, 12))) {
    throw new Error('Image data does not contain a supported image format.');
  }
  return bytes;
}

async function writeJsonLine(stream: ReturnType<typeof createWriteStream>, value: unknown) {
  if (!stream.write(`${JSON.stringify(value)}\n`)) await once(stream, 'drain');
}

async function runDryRun(client: MigrationClient) {
  let count = 0;
  await forEachProfileBatch(client, (rows) => {
    for (const row of rows) {
      count += 1;
      if (typeof row.profileimageurl !== 'string') continue;
      const inputBytes = estimateDataUrlBytes(row.profileimageurl);
      console.log(
        `${row.id}: approximately ${inputBytes} bytes -> avatars/${row.id}/avatar.webp (400x400, WebP, target < 102400 bytes)`
      );
    }
  });
  console.log(`Profile rows containing data:image values: ${count}`);
  console.log('Dry run only: no uploads or database writes were made.');
}

async function writeBackup(client: MigrationClient, backupPath: string) {
  const stream = createWriteStream(backupPath, { flags: 'wx', encoding: 'utf8' });
  const hashes = new Map<string, string>();
  const finished = once(stream, 'finish');
  try {
    await forEachProfileBatch(client, async (rows) => {
      for (const row of rows) {
        if (typeof row.profileimageurl !== 'string') continue;
        await writeJsonLine(stream, { userid: row.id, original_value: row.profileimageurl });
        hashes.set(row.id, hashValue(row.profileimageurl));
      }
    });
    stream.end();
    await finished;
    return hashes;
  } catch (error) {
    stream.destroy();
    throw error;
  }
}

async function runApply(client: MigrationClient) {
  await mkdir(outputDirectory, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(outputDirectory, `profile-images-${timestamp}.jsonl`);
  const reportPath = path.join(outputDirectory, `profile-images-${timestamp}-rollback-report.json`);

  const originalHashes = await writeBackup(client, backupPath);
  const ids = [...originalHashes.keys()];
  const results: MigrationResult[] = ids.map((id) => ({
    userid: id,
    status: 'pending',
    original_hash: originalHashes.get(id),
  }));
  const writeReport = () => writeFile(
    reportPath,
    JSON.stringify({ createdat: new Date().toISOString(), backup_path: backupPath, results }, null, 2),
    { flag: 'wx' }
  );
  await writeReport();

  console.log(`Backed up ${ids.length} profile values to ${backupPath}`);
  console.log(`Rollback report created at ${reportPath}`);
  const resultById = new Map(results.map((result) => [result.userid, result]));
  const storage = client.storage.from('avatars');

  for (let offset = 0; offset < ids.length; offset += BATCH_SIZE) {
    const batchIds = ids.slice(offset, offset + BATCH_SIZE);
    const { data: batchRows, error: batchError } = await client
      .from('profiles')
      .select('id, profileimageurl')
      .in('id', batchIds);
    if (batchError) throw batchError;

    const rowById = new Map(((batchRows || []) as ProfileRow[]).map((row) => [row.id, row]));
    for (const id of batchIds) {
      const row = rowById.get(id);
      const result = resultById.get(id)!;
      if (!row) {
        result.status = 'skipped';
        result.error = 'Profile row was removed after the backup was created.';
        continue;
      }

      let storagePath: string | undefined;
      try {
        if (typeof row.profileimageurl !== 'string' || hashValue(row.profileimageurl) !== result.original_hash) {
          result.status = 'skipped';
          result.error = 'Profile changed after the backup was created.';
          continue;
        }
        const { data: current, error: readError } = await client
          .from('profiles')
          .select('profileimageurl')
          .eq('id', row.id)
          .maybeSingle();
        if (readError) throw readError;
        if (!current || current.profileimageurl !== row.profileimageurl) {
          result.status = 'skipped';
          result.error = 'Profile changed before the image could be uploaded.';
          continue;
        }

        const source = decodeImageDataUrl(row.profileimageurl);
        const compressed = await compressImageBuffer(source, 'profile');
        storagePath = `${row.id}/avatar.${compressed.extension}`;
        const { error: uploadError } = await storage.upload(storagePath, compressed.buffer, {
          cacheControl: '3600',
          contentType: compressed.mimeType,
          upsert: true,
        });
        if (uploadError) throw uploadError;

        const { data: object, error: downloadError } = await storage.download(storagePath);
        if (downloadError) throw downloadError;
        if (
          !object ||
          object.size !== compressed.buffer.byteLength ||
          object.size > IMAGE_UPLOAD_CONFIG.storage.avatarsMaxBytes
        ) {
          throw new Error('Uploaded avatar verification failed (missing or unexpected size).');
        }

        const newUrl = storage.getPublicUrl(storagePath).data.publicUrl;
        const { data: updated, error: updateError } = await client
          .from('profiles')
          .update({ profileimageurl: newUrl })
          .eq('id', row.id)
          .eq('profileimageurl', row.profileimageurl)
          .select('id')
          .maybeSingle();
        if (updateError) throw updateError;
        if (!updated) throw new Error('Profile changed before the image URL could be updated.');

        result.status = 'migrated';
        result.storagepath = storagePath;
        result.new_url = newUrl;
        console.log(`${row.id}: uploaded ${storagePath} (${object.size} bytes)`);
      } catch (error) {
        result.status = 'failed';
        result.error = error instanceof Error ? error.message : 'Unknown migration failure.';
        if (storagePath) {
          const { error: cleanupError } = await storage.remove([storagePath]);
          if (cleanupError) {
            result.error += ` Storage cleanup failed: ${cleanupError.message}`;
          }
        }
        console.error(`${row.id}: ${result.error}`);
      } finally {
        await writeFile(
          reportPath,
          JSON.stringify({ createdat: new Date().toISOString(), backup_path: backupPath, results }, null, 2)
        );
      }
    }
  }

  console.log(`Migration completed. Keep both files for rollback: ${backupPath} and ${reportPath}`);
}

async function runRollback(client: MigrationClient) {
  const backupPath = process.argv[3];
  const reportPath = process.argv[4];
  if (!backupPath || !reportPath) {
    throw new Error('Usage: --rollback <backup.jsonl> <rollback-report.json>');
  }

  const backupLines = (await readFile(backupPath, 'utf8')).split(/\r?\n/).filter(Boolean);
  const report = JSON.parse(await readFile(reportPath, 'utf8')) as {
    backup_path?: string;
    results: MigrationResult[];
  };
  const originals = backupLines.map((line) => JSON.parse(line) as {
    userid: string;
    original_value: string;
  });
  const resultById = new Map(report.results.map((result) => [result.userid, result]));
  const storage = client.storage.from('avatars');

  for (let offset = 0; offset < originals.length; offset += BATCH_SIZE) {
    for (const backup of originals.slice(offset, offset + BATCH_SIZE)) {
      const result = resultById.get(backup.userid);
      if (!result || !result.new_url || !['migrated', 'restored'].includes(result.status)) continue;

      if (result.status === 'migrated') {
        const { data: restored, error: restoreError } = await client
          .from('profiles')
          .update({ profileimageurl: backup.original_value })
          .eq('id', backup.userid)
          .eq('profileimageurl', result.new_url)
          .select('id')
          .maybeSingle();
        if (restoreError || !restored) {
          result.error = restoreError?.message || 'Current profile URL changed; original value was not restored.';
          console.error(`${backup.userid}: ${result.error}`);
          await writeFile(reportPath, JSON.stringify(report, null, 2));
          continue;
        }
        result.status = 'restored';
        await writeFile(reportPath, JSON.stringify(report, null, 2));
      }

      if (result.storagepath) {
        const { error: removeError } = await storage.remove([result.storagepath]);
        if (removeError) {
          result.error = `Profile restored, but Storage cleanup failed: ${removeError.message}`;
          console.error(`${backup.userid}: ${result.error}`);
          await writeFile(reportPath, JSON.stringify(report, null, 2));
          continue;
        }
      }
      result.status = 'rolled_back';
      result.error = undefined;
      console.log(`${backup.userid}: restored original profile value`);
      await writeFile(reportPath, JSON.stringify(report, null, 2));
    }
  }
}

async function main() {
  if (!isDryRun && !isApply && !isRollback) {
    throw new Error('Use no flag for dry-run, --apply to migrate, or --rollback <backup.jsonl> <rollback-report.json>.');
  }

  const client = getSupabaseClient();
  if (isDryRun) await runDryRun(client);
  if (isApply) await runApply(client);
  if (isRollback) await runRollback(client);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
