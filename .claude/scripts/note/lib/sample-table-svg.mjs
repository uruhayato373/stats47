/**
 * note 記事用「データのサンプル」表画像 (SVG) の共通描画。
 * デザインは .claude/skills/note/generate-note-charts/reference/design-system.md (CSV サンプル = テーブル形式) に従う。
 * 使う側: build-kakei-dataset-sample-images.mjs / build-csv-sample-image.mjs
 */
export const FONT = "'Hiragino Sans', 'Noto Sans JP', sans-serif";
export const COLORS = {
  title: "#1e293b", sub: "#475569", axis: "#64748b", faint: "#94a3b8",
  bg: "#fafafa", plot: "white", border: "#e2e8f0", grid: "#f1f5f9",
  blue: "#3b82f6", red: "#ef4444", gray: "#cbd5e1", zebra: "#f8fafc",
};
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function svgDoc(w, h, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<style>text{font-family:${FONT};}</style>
<rect width="${w}" height="${h}" fill="${COLORS.bg}"/>
${inner}
</svg>
`;
}

/** 文字数からおおまかな列幅 (px) を決める。全角 1 字 ≈ 11px、半角 ≈ 6.5px + 余白。 */
export function estimateWidth(values, { min = 44, max = 200 } = {}) {
  const px = (s) => [...String(s)].reduce((a, ch) => a + (/[　-鿿＀-￯]/.test(ch) ? 11 : 6.5), 0);
  const w = Math.max(...values.map(px)) + 16;
  return Math.max(min, Math.min(max, Math.ceil(w)));
}

/** テーブル画像。cols=[{label,w,align}] rows=string[][] */
export function tableSvg({ title, subtitle, cols, rows, footer, fileName }) {
  const C = COLORS;
  const pad = 12, rowH = 26, headH = 30;
  const w = pad * 2 + cols.reduce((a, c) => a + c.w, 0);
  const top = 64;
  const tableH = headH + rowH * rows.length;
  const h = top + tableH + 56;
  let x = pad;
  const xs = cols.map((c) => { const cx = x; x += c.w; return cx; });
  const parts = [];
  parts.push(`<text x="${pad}" y="24" font-size="15" font-weight="700" fill="${C.title}">${esc(title)}</text>`);
  if (subtitle) parts.push(`<text x="${pad}" y="44" font-size="11" fill="${C.sub}">${esc(subtitle)}</text>`);
  parts.push(`<rect x="${pad}" y="${top}" width="${w - pad * 2}" height="${tableH}" fill="${C.plot}" stroke="${C.border}"/>`);
  parts.push(`<rect x="${pad}" y="${top}" width="${w - pad * 2}" height="${headH}" fill="#f1f5f9"/>`);
  cols.forEach((c, i) => {
    const tx = c.align === "end" ? xs[i] + c.w - 6 : xs[i] + 6;
    parts.push(`<text x="${tx}" y="${top + 19}" font-size="10.5" font-weight="700" fill="${C.sub}" text-anchor="${c.align === "end" ? "end" : "start"}">${esc(c.label)}</text>`);
  });
  rows.forEach((r, ri) => {
    const y = top + headH + rowH * ri;
    if (ri % 2 === 1) parts.push(`<rect x="${pad}" y="${y}" width="${w - pad * 2}" height="${rowH}" fill="${C.zebra}"/>`);
    parts.push(`<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="${C.grid}"/>`);
    cols.forEach((c, i) => {
      const tx = c.align === "end" ? xs[i] + c.w - 6 : xs[i] + 6;
      parts.push(`<text x="${tx}" y="${y + 17}" font-size="11" fill="${C.title}" text-anchor="${c.align === "end" ? "end" : "start"}">${esc(r[i] ?? "")}</text>`);
    });
  });
  if (footer) parts.push(`<text x="${pad}" y="${top + tableH + 22}" font-size="10.5" fill="${C.axis}">${esc(footer)}</text>`);
  if (fileName) parts.push(`<text x="${w - pad}" y="${h - 14}" font-size="10" fill="${C.faint}" text-anchor="end">${esc(fileName)}</text>`);
  return svgDoc(w, h, parts.join("\n"));
}
