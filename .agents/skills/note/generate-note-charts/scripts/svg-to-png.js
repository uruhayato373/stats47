/**
 * SVG → PNG 一括変換 (note 用 CLI シム)
 *
 * 実装は `.claude/scripts/lib/svg-to-png.cjs` に一本化済み (SNS/note 共用)。
 * 本ファイルは後方互換のための薄いラッパー。既存の note スキルは
 *   node .claude/skills/note/generate-note-charts/scripts/svg-to-png.js <images-dir>
 * の呼び出し規約をそのまま使える。
 *
 * density 規則: チャート(幅<1280)=288 / カバー(幅>=1280)=72 は lib 側に踏襲。
 */
const path = require("node:path");
const { svgDirToPng } = require(
  path.resolve(__dirname, "../../../../scripts/lib/svg-to-png.cjs"),
);

const dir = path.resolve(process.argv[2] || ".");

(async () => {
  try {
    const results = await svgDirToPng(dir);
    if (results.length === 0) {
      console.log("No SVG files found in", dir);
      process.exit(0);
    }
    for (const r of results) {
      console.log(
        `→ ${path.basename(r.pngPath)}  ${r.width}×${r.height}  ${(r.bytes / 1024).toFixed(0)} KB`,
      );
    }
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
