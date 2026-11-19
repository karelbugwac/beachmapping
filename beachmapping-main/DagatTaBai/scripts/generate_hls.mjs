import { execSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';

const inputVideo = path.join(process.cwd(), 'public', 'beach1.mp4');
const outputDir = path.join(process.cwd(), 'public', 'videos', 'beach-hero');
const posterPath = path.join(process.cwd(), 'public', 'images', 'beach-hero-poster.webp');

console.log('Generating poster webp...');
execSync(`"${ffmpegPath}" -ss 00:00:01 -i "${inputVideo}" -vframes 1 -vf "scale=1280:-1" -c:v libwebp -quality 75 "${posterPath}" -y`, { stdio: 'inherit' });

console.log('Generating HLS variants (360p, 720p, 1080p)...');

const renditions = [
  { name: '360p', width: 640, height: 360, bitrate: '800k', maxrate: '856k', bufsize: '1200k' },
  { name: '720p', width: 1280, height: 720, bitrate: '2000k', maxrate: '2140k', bufsize: '3000k' },
  { name: '1080p', width: 1920, height: 1080, bitrate: '4000k', maxrate: '4280k', bufsize: '6000k' },
];

for (const r of renditions) {
  const rendDir = path.join(outputDir, r.name);
  if (!fs.existsSync(rendDir)) {
    fs.mkdirSync(rendDir, { recursive: true });
  }

  console.log(`Encoding ${r.name}...`);
  // Use standard TS segments for universal HLS compatibility without init.mp4 lookup issues
  const cmd = `"${ffmpegPath}" -i "${inputVideo}" -vf "scale=w=${r.width}:h=${r.height}:force_original_aspect_ratio=decrease,pad=${r.width}:${r.height}:(ow-iw)/2:(oh-ih)/2" -c:a aac -ar 48000 -c:v h264 -profile:v main -crf 23 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod -b:v ${r.bitrate} -maxrate ${r.maxrate} -bufsize ${r.bufsize} -b:a 96k -hls_segment_filename "${rendDir}/segment_%03d.ts" "${rendDir}/index.m3u8" -y`;
  execSync(cmd, { stdio: 'inherit' });
}

// Master playlist
const masterPlaylist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720
720p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=4000000,RESOLUTION=1920x1080
1080p/index.m3u8
`;

fs.writeFileSync(path.join(outputDir, 'master.m3u8'), masterPlaylist);
console.log('HLS generation complete!');
