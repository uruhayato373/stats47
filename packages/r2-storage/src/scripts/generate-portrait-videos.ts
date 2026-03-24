import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

/**
 * 横型動画 (1920x1080) から 縦型動画 (1080x1920) を生成する
 * 
 * 変換ルール:
 * 1. 1920x1080 の中心を 607.5x1080 (9:16比率) でクロップ
 * 2. 1080x1920 にスケーリング
 */

const SOURCE_DIR = path.resolve(process.cwd(), ".local/r2/ges/1920-1080");
const TARGET_DIR = path.resolve(process.cwd(), ".local/r2/ges/1080-1920");

async function generatePortraits() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    return;
  }

  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith(".mp4"));

  console.log(`Generating portrait videos for ${files.length} prefectures...`);

  for (const file of files) {
    const inputPath = path.join(SOURCE_DIR, file);
    const outputPath = path.join(TARGET_DIR, file);

    console.log(`Converting: ${file} ...`);

    // FFmpeg フィルタ:
    // crop=608:1080:656:0  (1920-608)/2 = 656
    // scale=1080:1920
    const vf = "crop=608:1080:(in_w-608)/2:0,scale=1080:1920,format=yuv420p";
    const command = `ffmpeg -y -i "${inputPath}" -vf "${vf}" -vcodec libx264 -crf 18 -pix_fmt yuv420p "${outputPath}"`;

    try {
      execSync(command, { stdio: "ignore" });
      console.log(`✅ Success: ${file}`);
    } catch (error) {
      console.error(`❌ Failed: ${file}`, error);
    }
  }

  console.log("Done!");
}

generatePortraits();
