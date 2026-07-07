/**
 * svg-to-png.cjs — SVG → PNG 変換の共通ライブラリ (SNS / note 共用)
 *
 * 旧 `.claude/skills/note/generate-note-charts/scripts/svg-to-png.js` を lib へ昇格。
 * quick-still.ts (SNS 静止画) と note チャートが同一実装を共有する。
 *
 * ★重要: sharp が使えない場合は **throw する** (旧 quick-still の「成功時のみ PNG」= サイレント
 * スキップは、publish-x が media 不在に気付けず投稿事故につながるため廃止)。呼び出し側は
 * PNG が必須なら try/catch せずに失敗させる。
 *
 * density 規則 (旧 note 版を踏襲):
 *   - viewBox 論理幅 < 1280 : density 288 (Retina 2x)。カード/チャート
 *   - viewBox 論理幅 >= 1280: density 72  (等倍)。カバー
 *
 * API:
 *   svgToPng(svgPath, pngPath) → { pngPath, width, height, bytes }   (throw on failure)
 *   svgDirToPng(dir)           → 上記の配列
 *
 * CLI:
 *   node .claude/scripts/lib/svg-to-png.cjs <images-dir>   # ディレクトリ内の *.svg を一括変換
 *   node .claude/scripts/lib/svg-to-png.cjs <in.svg> <out.png>
 */

const fs = require("node:fs");
const path = require("node:path");

function loadSharp() {
  try {
    return require("sharp");
  } catch (e) {
    throw new Error(
      `[svg-to-png] sharp が読み込めません (PNG 生成不可): ${e.message}. ` +
        `\`npm i sharp\` を確認してください。`,
    );
  }
}

function densityForSvg(svg) {
  const match = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  const logicalW = match ? parseFloat(match[1]) : 680;
  return logicalW >= 1280 ? 72 : 288;
}

/** 1 ファイルを変換。sharp 不在・変換失敗は throw。 */
async function svgToPng(svgPath, pngPath) {
  const sharp = loadSharp();
  const svg = fs.readFileSync(svgPath, "utf8");
  const density = densityForSvg(svg);
  const info = await sharp(Buffer.from(svg), { density }).png().toFile(pngPath);
  const bytes = fs.statSync(pngPath).size;
  return { pngPath, width: info.width, height: info.height, bytes };
}

/** ディレクトリ内の *.svg を一括変換。sharp 不在は throw。 */
async function svgDirToPng(dir) {
  const abs = path.resolve(dir);
  const files = fs.readdirSync(abs).filter((f) => f.endsWith(".svg"));
  const results = [];
  for (const file of files) {
    const svgPath = path.join(abs, file);
    const pngPath = svgPath.replace(/\.svg$/, ".png");
    results.push(await svgToPng(svgPath, pngPath));
  }
  return results;
}

module.exports = { svgToPng, svgDirToPng, densityForSvg };

// ---------- CLI ----------
if (require.main === module) {
  (async () => {
    const [a, b] = process.argv.slice(2);
    if (!a) {
      console.error(
        "usage: svg-to-png.cjs <images-dir> | svg-to-png.cjs <in.svg> <out.png>",
      );
      process.exit(1);
    }
    try {
      if (b) {
        const r = await svgToPng(a, b);
        console.log(
          `${path.basename(a)} → ${path.basename(r.pngPath)}  ${r.width}×${r.height}  ${(r.bytes / 1024).toFixed(0)} KB`,
        );
      } else {
        const stat = fs.statSync(a);
        if (!stat.isDirectory()) {
          console.error(`[svg-to-png] ディレクトリではありません: ${a} (out.png を指定するか dir を渡す)`);
          process.exit(1);
        }
        const results = await svgDirToPng(a);
        if (results.length === 0) {
          console.log("No SVG files found in", a);
          process.exit(0);
        }
        for (const r of results) {
          console.log(
            `→ ${path.basename(r.pngPath)}  ${r.width}×${r.height}  ${(r.bytes / 1024).toFixed(0)} KB`,
          );
        }
      }
      process.exit(0);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  })();
}
