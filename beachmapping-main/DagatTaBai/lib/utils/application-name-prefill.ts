export interface ApplicationNameSource {
  profileName?: string | null;
  metadataName?: string | null;
  currentValue?: string;
  dirty?: boolean;
  hasSavedDraft?: boolean;
}

export function normalizeApplicationName(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ');
}

export function getAccountApplicationName({
  profileName,
  metadataName,
}: ApplicationNameSource) {
  return normalizeApplicationName(profileName || metadataName || '');
}

export function getApplicationNamePrefill({
  profileName,
  metadataName,
  currentValue = '',
  dirty = false,
  hasSavedDraft = false,
}: ApplicationNameSource) {
  if (dirty || hasSavedDraft || currentValue) return null;
  return getAccountApplicationName({ profileName, metadataName }) || null;
}
