#!/usr/bin/env node
/**
 * a-kakei 記事用 SVG チャートを chart-data.json から生成する。
 *
 * Usage:
 *   node generate-charts.js <slug>     # 1記事分
 *   node generate-charts.js --all      # 全 a-kakei-* 一括
 *
 * Output:
 *   docs/31_note記事原稿/<slug>/images/category-ratio.svg
 *   docs/31_note記事原稿/<slug>/images/extreme-items.svg
 */
const fs = require("fs");
const path = require("path");

const ARTICLE_DIR = path.join(process.cwd(), "docs/31_note記事原稿");

// --- Design system constants ---
const FONT = "'Hiragino Sans', 'Noto Sans JP', sans-serif";
const BG = "#fafafa";
const TITLE_COLOR = "#1e293b";
const SUBTITLE_COLOR = "#475569";
const LABEL_COLOR = "#64748b";
const GRID_COLOR = "#f1f5f9";
const BLUE = "#3b82f6";
const RED = "#ef4444";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function px(n) {
  return Math.round(n * 10) / 10;
}

// =========================================================================
// Chart 1: Category Ratio — Diverging horizontal bar centered at 1.0
// =========================================================================
function generateCategoryRatioSvg(data) {
  const { _meta, categoryBreakdown } = data;
  const cats = categoryBreakdown.slice(0, 10);

  const W = 600;
  const rowH = 32;
  const barH = 22;
  const topMargin = 62;
  const bottomMargin = 25;
  const labelW = 108;
  const barLeft = labelW + 8;
  const barRight = W - 12;
  const barAreaW = barRight - barLeft;
  const centerX = barLeft + barAreaW / 2;
  const H = topMargin + cats.length * rowH + bottomMargin;

  const maxDev = Math.max(...cats.map((c) => Math.abs(c.ratio - 1.0)), 0.05);
  const scale = maxDev * 1.25; // padding

  const lines = [];
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(_meta.prefName)}の大分類別支出比率">`,
    `<style>text{font-family:${FONT}}</style>`,
    `<rect width="${W}" height="${H}" fill="${BG}" rx="6"/>`,
    // Title
    `<text x="${W / 2}" y="24" text-anchor="middle" font-size="15" font-weight="bold" fill="${TITLE_COLOR}">大分類別 \u2014 全国平均との比率</text>`,
    `<text x="${W / 2}" y="44" text-anchor="middle" font-size="11" fill="${SUBTITLE_COLOR}">${esc(_meta.prefName)}\uFF08${esc(_meta.cityName)}\uFF09${_meta.year}\u5E74</text>`,
    // Center reference line
    `<line x1="${px(centerX)}" y1="${topMargin - 4}" x2="${px(centerX)}" y2="${px(topMargin + cats.length * rowH - 4)}" stroke="${LABEL_COLOR}" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>`,
    `<text x="${px(centerX)}" y="${topMargin - 8}" text-anchor="middle" font-size="9" fill="${LABEL_COLOR}">1.0\u500D</text>`
  );

  cats.forEach((cat, i) => {
    const y = topMargin + i * rowH;
    const barY = y + (rowH - barH) / 2;
    const dev = cat.ratio - 1.0;
    const barW = Math.max((Math.abs(dev) / scale) * (barAreaW / 2), 2);
    const above = dev >= 0;
    const color = above ? BLUE : RED;
    const barX = above ? centerX : centerX - barW;

    // Grid line
    if (i > 0)
      lines.push(
        `<line x1="${barLeft}" y1="${px(y)}" x2="${barRight}" y2="${px(y)}" stroke="${GRID_COLOR}" stroke-width="0.5"/>`
      );
    // Bar
    lines.push(
      `<rect x="${px(barX)}" y="${px(barY)}" width="${px(barW)}" height="${barH}" fill="${color}" rx="2" opacity="0.85"/>`
    );
    // Category label
    lines.push(
      `<text x="${labelW}" y="${px(y + rowH / 2 + 4)}" text-anchor="end" font-size="12" fill="${TITLE_COLOR}">${esc(cat.catName)}</text>`
    );
    // Value label
    const valX = above ? centerX + barW + 5 : centerX - barW - 5;
    const anchor = above ? "start" : "end";
    lines.push(
      `<text x="${px(valX)}" y="${px(y + rowH / 2 + 4)}" text-anchor="${anchor}" font-size="11" font-weight="bold" fill="${color}">${cat.ratio.toFixed(2)}\u500D</text>`
    );
  });

  lines.push("</svg>");
  return lines.join("\n");
}

// =========================================================================
// Chart 2: Extreme Items — 2-column layout (ranking-table.mjs pattern)
// =========================================================================

/**
 * 1列分のランキングを描画する（ranking-table.mjs 準拠）
 */
function renderColumn(col, n, rowH, startY, colX, colW) {
  const centerX = colX + colW / 2;
  const circleR = 17;
  const nameFontSize = 14;
  const valueFontSize = 13;
  const circleFontSize = 14;
  const barStartX = colX + colW * 0.52;
  const barMaxW = colW * 0.44;
  const valueEndX = barStartX - 10;
  const barH = 16;
  const FONT_COL = "'Noto Sans JP', sans-serif";

  let svg = "";

  // Header
  svg += `  <rect x="${colX}" y="${startY - 44}" width="${colW}" height="40" rx="8" fill="${col.color}"/>`;
  svg += `  <text x="${centerX}" y="${startY - 18}" text-anchor="middle" font-family="${FONT_COL}" font-size="14" font-weight="bold" fill="#ffffff">${esc(col.label)}</text>\n`;

  col.items.forEach((item, i) => {
    const y = startY + i * rowH;
    const cy = y + rowH / 2;
    const bg = i % 2 === 0 ? (col.bgColor || "#f9fafb") : "#ffffff";

    // Row background
    svg += `  <rect x="${colX}" y="${y}" width="${colW}" height="${rowH}" rx="6" fill="${bg}"/>\n`;
    // Rank circle
    svg += `  <circle cx="${colX + 28}" cy="${cy}" r="${circleR}" fill="${col.color}"/>`;
    svg += `  <text x="${colX + 28}" y="${cy + circleFontSize * 0.36}" text-anchor="middle" font-family="${FONT_COL}" font-size="${circleFontSize}" font-weight="bold" fill="#ffffff">${item.rank}</text>\n`;
    // Item name
    svg += `  <text x="${colX + 28 + circleR + 8}" y="${cy + nameFontSize * 0.36}" font-family="${FONT_COL}" font-size="${nameFontSize}" font-weight="bold" fill="#1f2937">${esc(item.name)}</text>\n`;
    // Value
    svg += `  <text x="${valueEndX}" y="${cy + valueFontSize * 0.36}" text-anchor="end" font-family="${FONT_COL}" font-size="${valueFontSize}" fill="${col.color}" font-weight="600">${item.label}</text>\n`;
    // Bar
    const barY = cy - barH / 2;
    svg += `  <rect x="${barStartX}" y="${barY}" width="${px(item.barW * barMaxW)}" height="${barH}" rx="4" fill="${col.barColor || col.color}" opacity="0.8"/>\n`;
  });

  return svg;
}

function generateExtremeItemsSvg(data) {
  const { _meta, topRatioItems, bottomRatioItems } = data;
  const filteredBottom = bottomRatioItems.filter((i) => i.ratio > 0);
  const N = 5;
  const tops = topRatioItems.slice(0, N);
  const bots = filteredBottom.slice(0, N);

  const W = 960;
  const COL_W = 432;
  const LEFT_X = 30;
  const RIGHT_X = 498;
  const rowH = 56;
  const headerY = 80;
  const startY = headerY + 44;
  const contentH = N * rowH;
  const noteArea = 50;
  const H = startY + contentH + noteArea;

  // Compute bar widths
  const maxTopRatio = Math.max(...tops.map((i) => i.ratio));
  const minBotRatio = Math.min(...bots.map((i) => i.ratio));
  const maxBotDev = 1.0 - minBotRatio;

  const leftItems = tops.map((item, i) => ({
    rank: i + 1,
    name: item.name,
    label: `${item.ratio.toFixed(2)}\u500D`,
    barW: Math.max(0.02, item.ratio / maxTopRatio),
  }));

  const rightItems = bots.map((item, i) => ({
    rank: i + 1,
    name: item.name,
    label: `${item.ratio.toFixed(2)}\u500D`,
    barW: Math.max(0.02, (1.0 - item.ratio) / (maxBotDev || 1)),
  }));

  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(_meta.prefName)}\u306E\u7279\u5FB4\u7684\u306A\u652F\u51FA\u54C1\u76EE">`;
  svg += `\n  <title>${esc(_meta.prefName)}\u306E\u7279\u5FB4\u7684\u306A\u652F\u51FA\u54C1\u76EE</title>`;
  svg += `\n  <rect width="${W}" height="${H}" fill="#f9fafb"/>\n`;

  // Title
  svg += `  <text x="${W / 2}" y="36" text-anchor="middle" font-family="'Noto Sans JP',sans-serif" font-size="20" font-weight="bold" fill="#1f2937">\u5168\u56FD\u5E73\u5747\u3068\u6BD4\u3079\u3066\u7279\u5FB4\u7684\u306A\u54C1\u76EE</text>\n`;
  svg += `  <text x="${W / 2}" y="58" text-anchor="middle" font-family="'Noto Sans JP',sans-serif" font-size="13" fill="#6b7280">${esc(_meta.prefName)}\uFF08${esc(_meta.cityName)}\uFF09${_meta.year}\u5E74</text>\n`;

  // Left column — top items
  svg += renderColumn(
    { label: "\u5168\u56FD\u5E73\u5747\u3088\u308A\u591A\u3044", color: "#1565c0", barColor: "#42a5f5", bgColor: "#e3f2fd", items: leftItems },
    N, rowH, startY, LEFT_X, COL_W
  );

  // Right column — bottom items
  svg += renderColumn(
    { label: "\u5168\u56FD\u5E73\u5747\u3088\u308A\u5C11\u306A\u3044", color: "#b71c1c", barColor: "#ef5350", bgColor: "#fef2f2", items: rightItems },
    N, rowH, startY, RIGHT_X, COL_W
  );

  // Note
  svg += `  <text x="${W / 2}" y="${startY + contentH + 25}" text-anchor="middle" font-family="'Noto Sans JP',sans-serif" font-size="11" fill="#6b7280">\u51FA\u5178\uFF1A\u7DCF\u52D9\u7701\u300C\u5BB6\u8A08\u8ABF\u67FB\u300D${_meta.year}\u5E74\u3000\u5168\u56FD\u5E73\u5747\u3068\u306E\u6BD4\u7387</text>\n`;

  svg += `</svg>`;
  return svg;
}

// =========================================================================
// Main
// =========================================================================
function processSlug(slug) {
  const dir = path.join(ARTICLE_DIR, slug);
  const dataPath = path.join(dir, "chart-data.json");

  if (!fs.existsSync(dataPath)) {
    console.error(`SKIP: ${slug} \u2014 chart-data.json not found`);
    return false;
  }

  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  if (!data.categoryBreakdown || !data.topRatioItems || !data.bottomRatioItems) {
    console.error(`SKIP: ${slug} \u2014 required fields missing in chart-data.json`);
    return false;
  }

  const imagesDir = path.join(dir, "images");
  fs.mkdirSync(imagesDir, { recursive: true });

  fs.writeFileSync(
    path.join(imagesDir, "category-ratio.svg"),
    generateCategoryRatioSvg(data)
  );
  fs.writeFileSync(
    path.join(imagesDir, "extreme-items.svg"),
    generateExtremeItemsSvg(data)
  );

  console.log(`OK: ${slug} \u2014 2 SVGs generated`);
  return true;
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node generate-charts.js <slug> | --all");
  process.exit(1);
}

if (args[0] === "--all") {
  const slugs = fs
    .readdirSync(ARTICLE_DIR)
    .filter(
      (d) =>
        d.startsWith("a-kakei-") &&
        fs.statSync(path.join(ARTICLE_DIR, d)).isDirectory()
    )
    .sort();
  let ok = 0;
  for (const slug of slugs) {
    if (processSlug(slug)) ok++;
  }
  console.log(`\nDone: ${ok}/${slugs.length} articles processed`);
} else {
  if (!processSlug(args[0])) process.exit(1);
}
