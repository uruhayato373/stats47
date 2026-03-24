/**
 * SVG → PNG 一括変換スクリプト
 *
 * 使い方:
 *   node svg-to-png.js <images-dir>
 *
 * - チャート SVG (viewBox 幅 < 1280): density 288 (Retina 2x)
 * - カバー SVG  (viewBox 幅 >= 1280): density 72  (等倍 1280×670)
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = path.resolve(process.argv[2] || '.');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

if (files.length === 0) {
  console.log('No SVG files found in', dir);
  process.exit(0);
}

(async () => {
  for (const file of files) {
    const svgPath = path.join(dir, file);
    const pngPath = svgPath.replace(/\.svg$/, '.png');
    const svg = fs.readFileSync(svgPath, 'utf8');

    // viewBox から論理幅を取得してカバー画像か判定
    const match = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    const logicalW = match ? parseInt(match[1]) : 680;
    const isCover = logicalW >= 1280;
    const density = isCover ? 72 : 288;

    const info = await sharp(Buffer.from(svg), { density })
      .png()
      .toFile(pngPath);

    const size = fs.statSync(pngPath).size;
    console.log(
      `${file} → ${path.basename(pngPath)}  ${info.width}×${info.height}  ` +
      `${(size / 1024).toFixed(0)} KB  (density: ${density})`
    );
  }
})();
