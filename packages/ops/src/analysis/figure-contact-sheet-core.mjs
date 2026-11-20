/**
 * 図の SVG を縮小し、ファイル名のラベルつきの格子 1 枚にする (figure-contact-sheet.mjs が使う)。
 * 審査役が 20 枚前後の図を 1 回の画像入力で見るためのもの。
 */
import sharp from "sharp";

export const CELL_WIDTH = 270;
export const CELL_HEIGHT = 338;
export const LABEL_HEIGHT = 24;
export const COLUMNS = 4;
const BACKGROUND = { r: 255, g: 255, b: 255, alpha: 1 };

/** 一覧に載せる SVG か (ダーク・モバイル・Instagram の派生版は除く) */
export function isPrimaryFigure(name) {
  return name.endsWith(".svg") && !/-(?:dark|mobile|ig)(?:[-.]|$)/.test(name.replace(/\.svg$/, ""));
}

/** n 枚を並べたときの全体の寸法 */
export function sheetSize(count, columns = COLUMNS) {
  const rows = Math.max(1, Math.ceil(count / columns));
  return { width: CELL_WIDTH * Math.min(columns, Math.max(1, count)), height: CELL_HEIGHT * rows, rows };
}

const escapeXml = (s) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

function labelSvg(text) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL_WIDTH}" height="${LABEL_HEIGHT}">` +
      `<rect width="100%" height="100%" fill="#f1f1f1"/>` +
      `<text x="6" y="16" font-family="sans-serif" font-size="12" fill="#222">${escapeXml(text)}</text></svg>`,
  );
}

/** figures: [{ name, svg: Buffer }]。PNG の Buffer を返す */
export async function renderContactSheet(figures, columns = COLUMNS) {
  const { width, height } = sheetSize(figures.length, columns);
  const imageHeight = CELL_HEIGHT - LABEL_HEIGHT;
  const tiles = await Promise.all(
    figures.map(async ({ name, svg }, i) => {
      const left = (i % columns) * CELL_WIDTH;
      const top = Math.floor(i / columns) * CELL_HEIGHT;
      const image = await sharp(svg, { density: 72 })
        .resize(CELL_WIDTH, imageHeight, { fit: "contain", background: BACKGROUND })
        .flatten({ background: BACKGROUND })
        .png()
        .toBuffer();
      return [
        { input: image, left, top },
        { input: labelSvg(name), left, top: top + imageHeight },
      ];
    }),
  );
  return sharp({ create: { width, height, channels: 4, background: BACKGROUND } })
    .composite(tiles.flat())
    .png()
    .toBuffer();
}
