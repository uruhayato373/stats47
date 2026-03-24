/**
 * ランキング表 SVG ビルダー
 *
 * 左右2列のランキング表を生成する。
 * 各行: 順位サークル ＋ 都道府県名 ＋ 数値 ＋ 横バー
 *
 * 使い方:
 *   import { genRanking5, genRanking10 } from "./ranking-table.mjs";
 *   const svg = genRanking5({ title, subtitle, left, right, maxBarValue });
 *
 * left / right の構造:
 *   {
 *     label: "空き家比率が高い県",      // ヘッダーテキスト
 *     color: "#dc2626",                // テーマ色（ヘッダー背景・順位サークル）
 *     barColor: "#ef4444",             // バー色
 *     bgColor: "#fef2f2",             // 奇数行の背景色
 *     items: [
 *       { rank: 1, name: "徳島県", value: 21.3, label: "21.3％" },
 *       ...
 *     ]
 *   }
 */

const FONT = "'Noto Sans JP',sans-serif";
const W = 960;
const COL_W = 432;
const LEFT_X = 30;
const RIGHT_X = 498;

/**
 * 1列分のランキングを生成
 */
function renderColumn(col, n, rowH, startY, colX) {
  const centerX = colX + COL_W / 2;
  const circleR = n <= 5 ? 17 : 14;
  const nameFontSize = n <= 5 ? 15 : 13;
  const valueFontSize = n <= 5 ? 14 : 12;
  const circleFontSize = n <= 5 ? 14 : 12;
  const barStartX = colX + COL_W * 0.49;
  const barMaxW = COL_W * 0.47;
  const valueEndX = barStartX - 12;

  let svg = "";

  // ヘッダー
  svg += `  <rect x="${colX}" y="${startY - 44}" width="${COL_W}" height="40" rx="8" fill="${col.color}"/>`;
  svg += `  <text x="${centerX}" y="${startY - 18}" text-anchor="middle" font-family="${FONT}" font-size="15" font-weight="bold" fill="#ffffff">${col.label}</text>\n`;

  col.items.forEach((item, i) => {
    const y = startY + i * rowH;
    const cy = y + rowH / 2;
    const bg = i % 2 === 0 ? (col.bgColor || "#f9fafb") : "#ffffff";

    // 行背景
    svg += `  <rect x="${colX}" y="${y}" width="${COL_W}" height="${rowH}" rx="6" fill="${bg}"/>\n`;

    // 順位サークル
    svg += `  <circle cx="${colX + 30}" cy="${cy}" r="${circleR}" fill="${col.color}"/>`;
    svg += `  <text x="${colX + 30}" y="${cy + circleFontSize * 0.36}" text-anchor="middle" font-family="${FONT}" font-size="${circleFontSize}" font-weight="bold" fill="#ffffff">${item.rank}</text>\n`;

    // 都道府県名
    svg += `  <text x="${colX + 30 + circleR + 10}" y="${cy + nameFontSize * 0.36}" font-family="${FONT}" font-size="${nameFontSize}" font-weight="bold" fill="#1f2937">${item.name}</text>\n`;

    // 値
    svg += `  <text x="${valueEndX}" y="${cy + valueFontSize * 0.36}" text-anchor="end" font-family="${FONT}" font-size="${valueFontSize}" fill="${col.color}" font-weight="600">${item.label}</text>\n`;

    // バー
    const barH = n <= 5 ? 18 : 14;
    const barY = cy - barH / 2;
    svg += `  <rect x="${barStartX}" y="${barY}" width="${item.barW * barMaxW}" height="${barH}" rx="4" fill="${col.barColor || col.color}" opacity="0.8"/>\n`;
  });

  return svg;
}

/**
 * ランキング表SVGを生成する共通関数
 *
 * @param {object} opts
 * @param {string} opts.title - メインタイトル
 * @param {string} opts.subtitle - サブタイトル（年度・出典など）
 * @param {object} opts.left - 左列の設定
 * @param {object} opts.right - 右列の設定
 * @param {number} opts.maxBarValue - バー長の最大値（左右共通スケール）
 * @param {number} n - 件数（5 or 10）
 * @param {string} [opts.note] - 注釈テキスト（下部に表示）
 * @param {string} [opts.noteSecondary] - 二次注釈テキスト
 */
function genRankingN(opts, n) {
  const rowH = n <= 5 ? 56 : 44;
  const headerY = 80;
  const startY = headerY + 44;
  const contentH = n * rowH;
  const noteArea = 60;
  const H = startY + contentH + noteArea;

  // バー幅の計算（maxBarValue に対する比率）
  const maxVal = opts.maxBarValue;
  for (const col of [opts.left, opts.right]) {
    for (const item of col.items) {
      item.barW = Math.max(0.02, Math.abs(item.value) / maxVal);
    }
  }

  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${opts.title}">`;
  svg += `\n  <title>${opts.title}</title>`;
  svg += `\n  <rect width="${W}" height="${H}" fill="#f9fafb"/>\n`;

  // タイトル
  svg += `  <text x="${W / 2}" y="38" text-anchor="middle" font-family="${FONT}" font-size="20" font-weight="bold" fill="#1f2937">${opts.title}</text>\n`;
  svg += `  <text x="${W / 2}" y="60" text-anchor="middle" font-family="${FONT}" font-size="13" fill="#6b7280">${opts.subtitle}</text>\n`;

  // 左列
  svg += renderColumn(opts.left, n, rowH, startY, LEFT_X);

  // 右列
  svg += renderColumn(opts.right, n, rowH, startY, RIGHT_X);

  // 注釈
  const noteY = startY + contentH + 25;
  if (opts.note) {
    svg += `  <text x="${W / 2}" y="${noteY}" text-anchor="middle" font-family="${FONT}" font-size="11" fill="#6b7280">${opts.note}</text>\n`;
  }
  if (opts.noteSecondary) {
    svg += `  <text x="${W / 2}" y="${noteY + 20}" text-anchor="middle" font-family="${FONT}" font-size="10" fill="#9ca3af">${opts.noteSecondary}</text>\n`;
  }

  svg += `</svg>`;
  return svg;
}

/**
 * 5件版ランキング表（960×540 付近）
 */
export function genRanking5(opts) {
  return genRankingN(opts, 5);
}

/**
 * 10件版ランキング表（960×高さ自動計算）
 */
export function genRanking10(opts) {
  return genRankingN(opts, 10);
}
