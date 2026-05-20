#!/usr/bin/env node
/**
 * note は Markdown 表 (`| ... |`) を表示できないため、draft.md 内の表を
 * SVG -> PNG の画像に変換し、表本体を画像埋め込みに置換する。
 *
 * 対象: docs/31_note記事原稿/koumuin-claude-code/<NN-slug>/draft.md
 * 出力: 各記事の images/table-<N>.svg / table-<N>.png（N は記事内の出現順）
 *
 * 冪等: 表を画像埋め込みに置換するため、再実行しても残った表だけ処理する。
 * コードフェンス (``` ... ```) 内の `|` 行は表として扱わない。
 *
 * Usage: node .claude/scripts/note/render-md-tables.cjs
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SERIES = path.resolve(
  __dirname,
  "../../../docs/31_note記事原稿/koumuin-claude-code",
);

const FS = 15;
const PADH = 14;
const PADV = 10;
const LH = 23;
const MAXCOLW = 340;
const MINCOLW = 72;

function cjkW(ch) {
  const c = ch.codePointAt(0);
  if (
    (c >= 0x3000 && c <= 0x9fff) ||
    (c >= 0xff00 && c <= 0xffef) ||
    (c >= 0x3040 && c <= 0x30ff)
  ) return FS * 1.0;
  if (ch === " ") return FS * 0.3;
  return FS * 0.56;
}
function textW(s) {
  let w = 0;
  for (const ch of s) w += cjkW(ch);
  return w;
}

function stripMd(s) {
  return s
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<br\s*\/?>/gi, "\n")
    .trim();
}
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrap(s, maxW) {
  const out = [];
  for (const para of String(s).split("\n")) {
    if (para === "") { out.push(""); continue; }
    let line = "";
    let lw = 0;
    for (const ch of para) {
      const cw = cjkW(ch);
      if (lw + cw > maxW && line !== "") {
        out.push(line);
        line = ch;
        lw = cw;
      } else {
        line += ch;
        lw += cw;
      }
    }
    if (line !== "") out.push(line);
  }
  return out.length ? out : [""];
}

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => stripMd(c));
}

function parseTables(lines) {
  const isRow = (l) => /^\s*\|.*\|\s*$/.test(l);
  const isSep = (l) => /^\s*\|[\s:|-]+\|\s*$/.test(l) && l.includes("-");
  const tables = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (isRow(lines[i]) && i + 1 < lines.length && isSep(lines[i + 1])) {
      const headers = splitRow(lines[i]);
      let j = i + 2;
      const rows = [];
      while (j < lines.length && isRow(lines[j]) && !isSep(lines[j])) {
        rows.push(splitRow(lines[j]));
        j++;
      }
      tables.push({ start: i, end: j - 1, headers, rows });
      i = j - 1;
    }
  }
  return tables;
}

function renderSVG(headers, rows) {
  const ncol = headers.length;
  const all = [headers, ...rows].map((r) => {
    const c = r.slice(0, ncol);
    while (c.length < ncol) c.push("");
    return c;
  });

  const colW = [];
  for (let c = 0; c < ncol; c++) {
    let nat = MINCOLW;
    for (const r of all) {
      const longest = r[c]
        .split("\n")
        .reduce((m, s) => Math.max(m, textW(s)), 0);
      nat = Math.max(nat, longest + 2 * PADH);
    }
    colW.push(Math.min(nat, MAXCOLW));
  }

  const wrapped = [];
  const rowH = [];
  for (const r of all) {
    const cells = [];
    let maxLines = 1;
    for (let c = 0; c < ncol; c++) {
      const ls = wrap(r[c], colW[c] - 2 * PADH);
      cells.push(ls);
      maxLines = Math.max(maxLines, ls.length);
    }
    wrapped.push(cells);
    rowH.push(maxLines * LH + 2 * PADV);
  }

  const W = colW.reduce((a, b) => a + b, 0);
  const H = rowH.reduce((a, b) => a + b, 0);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="'Hiragino Kaku Gothic ProN','Yu Gothic','Noto Sans JP',sans-serif">`;
  svg += `<rect width="${W}" height="${H}" fill="#ffffff"/>`;
  let y = 0;
  for (let r = 0; r < wrapped.length; r++) {
    const head = r === 0;
    const bg = head ? "#1e293b" : r % 2 === 0 ? "#f8fafc" : "#ffffff";
    let x = 0;
    for (let c = 0; c < ncol; c++) {
      svg += `<rect x="${x}" y="${y}" width="${colW[c]}" height="${rowH[r]}" fill="${bg}" stroke="#e2e8f0" stroke-width="1"/>`;
      const ls = wrapped[r][c];
      const color = head ? "#ffffff" : "#1e293b";
      const weight = head ? "700" : "400";
      let ty = y + (rowH[r] - ls.length * LH) / 2 + LH - 7;
      for (const ln of ls) {
        if (ln) {
          svg += `<text x="${x + PADH}" y="${ty.toFixed(1)}" font-size="${FS}" font-weight="${weight}" fill="${color}">${esc(ln)}</text>`;
        }
        ty += LH;
      }
      x += colW[c];
    }
    y += rowH[r];
  }
  svg += `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>`;
  svg += `</svg>`;
  return { svg, W };
}

async function processArticle(dir) {
  const draftPath = path.join(SERIES, dir, "draft.md");
  if (!fs.existsSync(draftPath)) return 0;
  const lines = fs.readFileSync(draftPath, "utf8").split("\n");
  const tables = parseTables(lines);
  if (tables.length === 0) return 0;

  const imagesDir = path.join(SERIES, dir, "images");
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  for (let t = tables.length - 1; t >= 0; t--) {
    const tbl = tables[t];
    const n = t + 1;
    const { svg, W } = renderSVG(tbl.headers, tbl.rows);
    fs.writeFileSync(path.join(imagesDir, `table-${n}.svg`), svg);
    const density = W > 1100 ? 150 : 240;
    await sharp(Buffer.from(svg), { density })
      .png()
      .toFile(path.join(imagesDir, `table-${n}.png`));
    const label = tbl.headers.filter(Boolean).join(" / ");
    const embed = [
      `![表: ${label.slice(0, 60)}](./images/table-${n}.png)`,
      `<!-- SVG: table | ${label.slice(0, 40)} -->`,
    ];
    lines.splice(tbl.start, tbl.end - tbl.start + 1, ...embed);
  }
  fs.writeFileSync(draftPath, lines.join("\n"));
  return tables.length;
}

(async () => {
  const dirs = fs
    .readdirSync(SERIES)
    .filter((d) => /^\d{2}-/.test(d))
    .sort();
  let total = 0;
  for (const d of dirs) {
    const n = await processArticle(d);
    if (n > 0) {
      console.log(`OK   ${d}: ${n} 表を画像化`);
      total += n;
    }
  }
  console.log(`\n合計 ${total} 表を画像化`);
})();
