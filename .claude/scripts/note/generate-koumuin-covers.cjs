#!/usr/bin/env node
/**
 * 公務員 note シリーズ (koumuin-claude-code 33 + koumuin-estat-claude-code 12 = 計 45) の
 * cover を一括生成する。**共通のキャッチーな背景 + 中央ボックスにタイトルを重ねる**新デザイン。
 *
 * 設計 (2026-07-09 再設計):
 *   - 背景  : `.claude/scripts/note/assets/koumuin-cover-bg.png` (Codex 作の共通ダーク背景)。
 *             無い場合はプログラム生成のダークグラデ背景にフォールバックする。
 *   - トーン: 記事の category ごとにアクセント色を変える (グロー + ピル + ディバイダ + ボックス枠)。
 *   - 前景  : 中央の半透明ボックスに [番号・カテゴリ] / タイトル(中央) / シリーズ・フッター /
 *             無料・有料バッジ を重ねる。
 *   - 合成  : 背景(bitmap) の上に 前景(SVG) を sharp で composite → PNG。
 *             ⇒ tracked SVG に背景 base64 を焼かない (git 肥大回避)。SVG は前景のみ (透過ベース)。
 *
 * メタ情報の SSOT は各記事の `draft.md` frontmatter (vertical / category / title / is_paid) と
 * ディレクトリ名の番号接頭辞 (NN-)。
 *
 * 出力: docs/31_note記事原稿/<vertical>/<NN-slug>/images/cover-1280x670.{svg,png}
 *   ※ docs/31 は ephemeral outbox。実行前に対象を復元する:
 *        bash .claude/scripts/note/restore-from-r2.sh <slug>
 *
 * Usage:
 *   node .claude/scripts/note/generate-koumuin-covers.cjs                 # 全 45 本
 *   node .claude/scripts/note/generate-koumuin-covers.cjs --slug 01-...   # 1 本
 *   node .claude/scripts/note/generate-koumuin-covers.cjs --vertical koumuin-estat-claude-code
 *   node .claude/scripts/note/generate-koumuin-covers.cjs --svg-only      # PNG 合成をスキップ
 */
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const DRAFT_ROOT = path.join(PROJECT_ROOT, "docs/31_note記事原稿");
const BG_PATH = path.join(__dirname, "assets/koumuin-cover-bg.png");
const MAG_BG_PATH = path.join(__dirname, "assets/koumuin-magazine-bg.png"); // マガジン用の別背景

const VERTICALS = ["koumuin-claude-code", "koumuin-estat-claude-code"];

// マガジン表紙 (シリーズ 1 枚) の定義。記事カバーと同デザイン言語 (中央ボックス) + 別背景。
// 出力: .claude/skills/note/<vertical>/magazine-cover-1280x670.{svg,png}
const MAGAZINES = {
  "koumuin-claude-code": {
    outDir: path.resolve(PROJECT_ROOT, ".claude/skills/note/koumuin-claude-code"),
    eyebrow: "JICHITAI × AI SERIES",
    title: "公務員 × Claude Code 実務活用ガイド",
    tagline: "環境構築・議事録・議会答弁・セキュリティ・データ活用・組織導入まで",
    count: "全 33 本 ・ 無料 10 + 有料 23",
    price: "買い切り ¥1,980",
    footer: "元自治体職員 × stats47.jp 運営者の実務ガイド",
    accent: "#fbbf24", // gold (flagship)
  },
  "koumuin-estat-claude-code": {
    outDir: path.resolve(PROJECT_ROOT, ".claude/skills/note/koumuin-estat-claude-code"),
    eyebrow: "JICHITAI × STATISTICS × AI",
    title: "公務員 × e-Stat × Claude Code 実務ガイド",
    tagline: "47 都道府県データを 1 コマンドで取得・整形・出力",
    count: "全 12 本 ・ 無料 3 + 有料 9",
    price: "買い切り ¥1,480",
    footer: "自治体職員のための統計データ実務",
    accent: "#fbbf24", // gold (flagship)
  },
};

const W = 1280;
const H = 670;

// ============================================================
// カテゴリ別トーン (アクセント色 + 短いラベル)
// ダーク背景に映えるよう、やや明度の高いビビッド寄りを採用する。
// ============================================================
const TONE = {
  // koumuin-claude-code
  intro:        { accent: "#38bdf8", label: "INTRO" },
  basics:       { accent: "#2dd4bf", label: "BASICS" },
  setup:        { accent: "#3b82f6", label: "SETUP" },
  documents:    { accent: "#34d399", label: "DOCUMENTS" },
  security:     { accent: "#f87171", label: "SECURITY" },
  data:         { accent: "#a78bfa", label: "DATA" },
  pr:           { accent: "#fb923c", label: "PR" },
  automation:   { accent: "#22d3ee", label: "AUTOMATION" },
  organization: { accent: "#818cf8", label: "ORGANIZATION" },
  career:       { accent: "#fbbf24", label: "CAREER" },
  // koumuin-estat-claude-code
  search:       { accent: "#c084fc", label: "SEARCH" },
  fetch:        { accent: "#22d3ee", label: "FETCH" },
  excel:        { accent: "#34d399", label: "EXCEL" },
  output:       { accent: "#fb923c", label: "OUTPUT" },
  analysis:     { accent: "#818cf8", label: "ANALYSIS" },
  mcp:          { accent: "#f472b6", label: "MCP" },
  skills:       { accent: "#fbbf24", label: "SKILLS" },
  default:      { accent: "#818cf8", label: "GUIDE" },
};

// シリーズ (vertical) ごとのアイブロウ / フッター
const SERIES = {
  "koumuin-claude-code": {
    eyebrow: "公務員 × Claude Code 実務活用",
    footer: "公務員のための Claude Code 活用術 ・ stats47.jp",
  },
  "koumuin-estat-claude-code": {
    eyebrow: "公務員 × e-Stat × Claude Code",
    footer: "公務員のための e-Stat 活用術 ・ stats47.jp",
  },
};

// ============================================================
// util
// ============================================================
function escapeXml(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// CJK=1, space=0.5, other=0.55 でラフに文字幅を測る
function cjkLen(s) {
  let n = 0;
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (
      (code >= 0x3040 && code <= 0x30ff) ||
      (code >= 0x3400 && code <= 0x9fff) ||
      (code >= 0xff00 && code <= 0xffef)
    ) {
      n += 1;
    } else if (ch === " ") {
      n += 0.5;
    } else {
      n += 0.55;
    }
  }
  return n;
}

// カバー用タイトル: 主見出し (最初の em-dash — / ― の前) を採用する。
// 記事タイトルの「主見出し — 詳細」構造から詳細を落として簡潔にする (記事本文の title は不変)。
// 主見出しが極端に短い (< 8 CJK) 場合は情報不足なので全体を使う。
function coverTitleOf(fullTitle) {
  const head = fullTitle.split(/\s*[—―]\s*/)[0].trim();
  return cjkLen(head) >= 8 ? head : fullTitle.trim();
}

// 禁則処理: 行頭に置かない / 行末に置かない文字。
const NO_LINE_START = new Set([")", "）", "」", "』", "。", "、", "・", "：", ":", "〜", "！", "？", "／", "/"]);
const NO_LINE_END = new Set(["(", "（", "「", "『", "／", "/"]);

// テキストを分割不可の atom 列にする。
// 英数字・記号連結 (Claude / e-Stat / Excel/CSV / .claude/skills / D3) は 1 atom で分割しない。
// CJK は 1 文字 = 1 atom (任意位置で折れる)。空白は直前 atom の後の space フラグ。
function atomize(text) {
  const atoms = [];
  const latin = /[A-Za-z0-9][A-Za-z0-9./#+_\-]*/y;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === " " || ch === "　") {
      if (atoms.length) atoms[atoms.length - 1].space = true;
      i++;
      continue;
    }
    latin.lastIndex = i;
    const m = latin.exec(text);
    if (m && m.index === i) {
      atoms.push({ s: m[0], w: cjkLen(m[0]), space: false });
      i += m[0].length;
    } else {
      atoms.push({ s: ch, w: cjkLen(ch), space: false });
      i++;
    }
  }
  return atoms;
}

function canBreak(atoms, k) {
  // atom k と k+1 の間で折れるか (禁則)
  if (k < 0 || k >= atoms.length - 1) return false;
  if (NO_LINE_END.has(atoms[k].s)) return false;
  if (NO_LINE_START.has(atoms[k + 1].s)) return false;
  return true;
}

function lineWidthCjk(lineAtoms) {
  let w = 0;
  for (let i = 0; i < lineAtoms.length; i++) {
    w += lineAtoms[i].w;
    if (i < lineAtoms.length - 1 && lineAtoms[i].space) w += 0.5;
  }
  return w;
}

function atomsToStr(lineAtoms) {
  let s = "";
  for (let i = 0; i < lineAtoms.length; i++) {
    s += lineAtoms[i].s;
    if (i < lineAtoms.length - 1 && lineAtoms[i].space) s += " ";
  }
  return s.trim();
}

// 幅 maxCjk 以内で貪欲折返し (禁則違反時は直近の合法な折れ位置まで戻す)。
function packGreedy(atoms, maxCjk) {
  const lines = [];
  let start = 0;
  let w = 0;
  let lastBreak = -1; // 直近で「ここで折れる」= 次行が atom lastBreak から始まる
  for (let k = start; k < atoms.length; k++) {
    const sep = k > start && atoms[k - 1].space ? 0.5 : 0;
    w += sep + atoms[k].w;
    if (w > maxCjk && k > start) {
      let bp = lastBreak > start ? lastBreak : k; // 合法な折れ位置が無ければ強制的に k で折る
      lines.push(atoms.slice(start, bp));
      start = bp;
      w = 0;
      for (let t = start; t <= k; t++) {
        w += (t > start && atoms[t - 1].space ? 0.5 : 0) + atoms[t].w;
      }
      lastBreak = -1;
    }
    if (canBreak(atoms, k)) lastBreak = k + 1;
  }
  if (start < atoms.length) lines.push(atoms.slice(start));
  return lines;
}

// タイトルをボックス内に自動フィット + 均等バランス折返し。
// フォントを段階縮小して行数・幅・高さに収め、行幅を二分探索で揃えて孤立行を防ぐ。
function layoutTitle(text) {
  const maxW = 870; // ボックス内側幅 (px)
  const availH = 240; // タイトル領域の縦幅 (px)
  const atoms = atomize(text);
  for (const font of [50, 46, 42, 38, 34, 30]) {
    const maxCjk = maxW / font;
    const maxLines = font >= 42 ? 3 : 4;
    let lines = packGreedy(atoms, maxCjk);
    if (lines.length > maxLines) continue;
    const L = Math.max(lines.length, 1);
    // L 行に収まる最小の行幅を二分探索 → 各行を均等化 (短い孤立行を防ぐ)
    let lo = 0,
      hi = maxCjk;
    for (let it = 0; it < 26; it++) {
      const mid = (lo + hi) / 2;
      const cand = packGreedy(atoms, mid);
      if (cand.length <= L) {
        lines = cand;
        hi = mid;
      } else {
        lo = mid;
      }
    }
    const lineH = font + 16;
    const widest = Math.max(...lines.map(lineWidthCjk));
    if (lines.length * lineH <= availH && widest <= maxCjk + 0.6) {
      return { lines: lines.map(atomsToStr), font, lineH };
    }
  }
  // フォールバック: 最小フォントで 4 行に切り詰め
  const font = 30;
  let lines = packGreedy(atoms, maxW / font);
  if (lines.length > 4) lines = lines.slice(0, 4);
  return { lines: lines.map(atomsToStr), font, lineH: font + 16 };
}

// frontmatter (最初の --- ブロック) を素朴にパース
function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split("\n")) {
    const mm = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!mm) continue;
    let v = mm[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[mm[1]] = v;
  }
  return out;
}

// ============================================================
// 背景 (フォールバック用プログラム生成 SVG)。Codex bg が無いとき使う。
// ============================================================
function fallbackBgSvg(accent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0f1c"/>
      <stop offset="55%" stop-color="#0d1526"/>
      <stop offset="100%" stop-color="#111b30"/>
    </linearGradient>
    <radialGradient id="glow" cx="18%" cy="12%" r="55%">
      <stop offset="0%" stop-color="${escapeXml(accent)}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${escapeXml(accent)}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="88%" cy="92%" r="50%">
      <stop offset="0%" stop-color="${escapeXml(accent)}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${escapeXml(accent)}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="46" height="46" patternUnits="userSpaceOnUse">
      <path d="M46 0H0V46" fill="none" stroke="#9db4d8" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>
</svg>`;
}

// ============================================================
// 前景 SVG (透過ベース)。scrim + トーン + 中央ボックス + テキスト。
// ============================================================
function makeOverlaySvg({ num, category, title, isPaid, series }) {
  const tone = TONE[category] || TONE.default;
  const accent = tone.accent;
  const catLabel = tone.label;

  // 中央ボックス
  const bx = 150,
    by = 125,
    bw = 980,
    bh = 420;
  const bRight = bx + bw;
  const bBottom = by + bh;
  const cx = bx + bw / 2; // 640

  // タイトル: 主見出しを採用し、ボックス内に自動フィット (中央寄せ)
  const coverTitle = coverTitleOf(title);
  const { lines: titleLines, font: titleFont, lineH } = layoutTitle(coverTitle);
  const titleCenterY = by + bh / 2 + 8; // ボックス中央よりわずかに下
  const titleStartY = titleCenterY - ((titleLines.length - 1) * lineH) / 2;

  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="${cx}" y="${titleStartY + i * lineH}" text-anchor="middle" font-size="${titleFont}" font-weight="800" fill="#f8fafc">${escapeXml(line)}</text>`,
    )
    .join("\n  ");

  // 上段左: 番号 + カテゴリ ピル
  const chipText = `${num ? "#" + num + "  " : ""}${catLabel}`;
  const chipW = chipText.length * 11 + 40;
  const chipX = bx + 40;
  const chipY = by + 40;

  // 上段右: 無料 / 有料 ピル
  const paidText = isPaid ? "有料" : "無料";
  const paidBg = isPaid ? "#f59e0b" : "#22c55e";
  const paidW = 78;
  const paidX = bRight - 40 - paidW;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="tone" cx="16%" cy="14%" r="60%">
      <stop offset="0%" stop-color="${escapeXml(accent)}" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="${escapeXml(accent)}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- コントラスト確保のスクリム (背景を暗く沈める) -->
  <rect width="${W}" height="${H}" fill="#060a13" opacity="0.44"/>
  <!-- カテゴリトーン (左上グロー) -->
  <rect width="${W}" height="${H}" fill="url(#tone)"/>
  <!-- 上下のアクセント極細ライン -->
  <rect x="0" y="0" width="${W}" height="5" fill="${escapeXml(accent)}" opacity="0.9"/>

  <!-- 中央ボックス -->
  <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="22"
    fill="#0b1220" fill-opacity="0.62"
    stroke="${escapeXml(accent)}" stroke-opacity="0.55" stroke-width="1.5"/>

  <!-- 上段左: 番号+カテゴリ -->
  <rect x="${chipX}" y="${chipY}" width="${chipW}" height="40" rx="20"
    fill="${escapeXml(accent)}" fill-opacity="0.16"
    stroke="${escapeXml(accent)}" stroke-opacity="0.6" stroke-width="1"/>
  <text x="${chipX + chipW / 2}" y="${chipY + 27}" text-anchor="middle"
    font-size="17" font-weight="700" letter-spacing="1.5"
    font-family="'Arial','Helvetica',sans-serif" fill="${escapeXml(accent)}">${escapeXml(chipText)}</text>

  <!-- 上段右: 無料/有料 -->
  <rect x="${paidX}" y="${chipY}" width="${paidW}" height="40" rx="20" fill="${paidBg}"/>
  <text x="${paidX + paidW / 2}" y="${chipY + 27}" text-anchor="middle"
    font-size="18" font-weight="800" fill="#0b1220">${escapeXml(paidText)}</text>

  <!-- タイトル (中央) -->
  <style>text{font-family:'Hiragino Kaku Gothic ProN','Yu Gothic','Noto Sans JP',sans-serif;}</style>
  ${titleSvg}

  <!-- アクセントディバイダ -->
  <rect x="${cx - 34}" y="${bBottom - 96}" width="68" height="4" rx="2" fill="${escapeXml(accent)}"/>

  <!-- 下段: シリーズ + フッター -->
  <text x="${cx}" y="${bBottom - 52}" text-anchor="middle" font-size="19" font-weight="600" fill="#cbd5e1" opacity="0.92">${escapeXml(series.eyebrow)}</text>
  <text x="${cx}" y="${bBottom - 24}" text-anchor="middle" font-size="15" font-weight="500" fill="#94a3b8" opacity="0.8">${escapeXml(series.footer)}</text>
</svg>`;
}

// ============================================================
// マガジン表紙 前景 SVG (透過ベース)。scrim + 金トーン + 中央ボックス + シリーズ情報。
// ============================================================
function makeMagazineSvg(mag) {
  const accent = mag.accent;
  const bx = 140,
    by = 112,
    bw = 1000,
    bh = 446;
  const bRight = bx + bw;
  const bBottom = by + bh;
  const cx = bx + bw / 2; // 640

  // タイトル (自動フィット・中央)
  const { lines: titleLines, font: titleFont, lineH } = layoutTitle(mag.title);
  const titleCenterY = 300;
  const titleStartY = titleCenterY - ((titleLines.length - 1) * lineH) / 2;
  const titleBottom = titleStartY + (titleLines.length - 1) * lineH;
  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="${cx}" y="${titleStartY + i * lineH}" text-anchor="middle" font-size="${titleFont}" font-weight="800" fill="#f8fafc">${escapeXml(line)}</text>`,
    )
    .join("\n  ");

  // MAGAZINE チップ (左上)
  const chipText = "MAGAZINE";
  const chipW = chipText.length * 11 + 40;
  const chipX = bx + 40;
  const chipY = by + 38;

  // 価格ピル (右上・目立たせる = ソリッド金)
  const priceW = Math.round(cjkLen(mag.price) * 19 + 40);
  const priceX = bRight - 40 - priceW;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="mtone" cx="16%" cy="16%" r="62%">
      <stop offset="0%" stop-color="${escapeXml(accent)}" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="${escapeXml(accent)}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="#0a0510" opacity="0.42"/>
  <rect width="${W}" height="${H}" fill="url(#mtone)"/>
  <rect x="0" y="0" width="${W}" height="6" fill="${escapeXml(accent)}" opacity="0.92"/>

  <!-- 中央ボックス -->
  <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="24"
    fill="#100913" fill-opacity="0.60"
    stroke="${escapeXml(accent)}" stroke-opacity="0.55" stroke-width="1.5"/>

  <!-- MAGAZINE チップ (左上) -->
  <rect x="${chipX}" y="${chipY}" width="${chipW}" height="40" rx="20"
    fill="${escapeXml(accent)}" fill-opacity="0.16"
    stroke="${escapeXml(accent)}" stroke-opacity="0.6" stroke-width="1"/>
  <text x="${chipX + chipW / 2}" y="${chipY + 27}" text-anchor="middle"
    font-size="17" font-weight="700" letter-spacing="2"
    font-family="'Arial','Helvetica',sans-serif" fill="${escapeXml(accent)}">${escapeXml(chipText)}</text>

  <!-- 価格ピル (右上) -->
  <rect x="${priceX}" y="${chipY - 2}" width="${priceW}" height="44" rx="22" fill="${escapeXml(accent)}"/>
  <text x="${priceX + priceW / 2}" y="${chipY + 26}" text-anchor="middle"
    font-size="19" font-weight="800" fill="#1a1206">${escapeXml(mag.price)}</text>

  <style>text{font-family:'Hiragino Kaku Gothic ProN','Yu Gothic','Noto Sans JP',sans-serif;}</style>

  <!-- アイブロウ -->
  <text x="${cx}" y="${by + 108}" text-anchor="middle" font-size="19" font-weight="600" letter-spacing="3"
    font-family="'Arial','Helvetica',sans-serif" fill="${escapeXml(accent)}" opacity="0.85">${escapeXml(mag.eyebrow)}</text>

  <!-- タイトル -->
  ${titleSvg}

  <!-- タグライン -->
  <text x="${cx}" y="${titleBottom + 54}" text-anchor="middle" font-size="21" font-weight="500" fill="#e2e8f0" opacity="0.9">${escapeXml(mag.tagline)}</text>

  <!-- ディバイダ -->
  <rect x="${cx - 40}" y="${bBottom - 96}" width="80" height="4" rx="2" fill="${escapeXml(accent)}"/>

  <!-- 本数 + フッター -->
  <text x="${cx}" y="${bBottom - 54}" text-anchor="middle" font-size="20" font-weight="700" fill="#f8fafc">${escapeXml(mag.count)}</text>
  <text x="${cx}" y="${bBottom - 24}" text-anchor="middle" font-size="15" font-weight="500" fill="#94a3b8" opacity="0.85">${escapeXml(mag.footer)} ・ stats47.jp</text>
</svg>`;
}

// ============================================================
// 記事の列挙 (frontmatter 駆動)
// ============================================================
function collectArticles(filterSlug, filterVertical) {
  const out = [];
  for (const vertical of VERTICALS) {
    if (filterVertical && vertical !== filterVertical) continue;
    const dir = path.join(DRAFT_ROOT, vertical);
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      const slugDir = path.join(dir, entry);
      if (!fs.statSync(slugDir).isDirectory()) continue;
      if (filterSlug && !entry.includes(filterSlug)) continue;
      const draftPath = path.join(slugDir, "draft.md");
      if (!fs.existsSync(draftPath)) continue;
      const fm = parseFrontmatter(fs.readFileSync(draftPath, "utf8"));
      const num = (entry.match(/^(\d{2,})/) || [])[1] || fm.related_idea_no || "";
      out.push({
        vertical,
        slugDir,
        entry,
        num,
        category: fm.category || "default",
        title: fm.title || entry,
        isPaid: String(fm.is_paid).toLowerCase() === "true",
      });
    }
  }
  return out;
}

// ============================================================
// マガジン表紙の生成 (シリーズ 2 枚)
// ============================================================
async function generateMagazines(svgOnly) {
  const hasBg = fs.existsSync(MAG_BG_PATH);
  let sharp = null;
  if (!svgOnly) {
    try {
      sharp = require("sharp");
    } catch (e) {
      console.warn(`[warn] sharp 不在 → PNG 合成をスキップ (SVG のみ): ${e.message}`);
    }
  }
  console.log(
    `マガジン背景: ${hasBg ? "Codex 別背景 (assets/koumuin-magazine-bg.png)" : "フォールバック"}`,
  );
  const bgBuffer = hasBg ? fs.readFileSync(MAG_BG_PATH) : null;

  let ok = 0,
    png = 0,
    fail = 0;
  for (const [vertical, mag] of Object.entries(MAGAZINES)) {
    try {
      fs.mkdirSync(mag.outDir, { recursive: true });
      const overlaySvg = makeMagazineSvg(mag);
      const svgPath = path.join(mag.outDir, "magazine-cover-1280x670.svg");
      fs.writeFileSync(svgPath, overlaySvg);
      ok++;
      if (sharp) {
        const baseBuffer = hasBg
          ? await sharp(bgBuffer).resize(W, H, { fit: "cover" }).toBuffer()
          : await sharp(Buffer.from(fallbackBgSvg(mag.accent)), { density: 72 })
              .resize(W, H)
              .toBuffer();
        const overlayPng = await sharp(Buffer.from(overlaySvg), { density: 72 })
          .resize(W, H)
          .png()
          .toBuffer();
        const pngPath = path.join(mag.outDir, "magazine-cover-1280x670.png");
        await sharp(baseBuffer)
          .composite([{ input: overlayPng, top: 0, left: 0 }])
          .png()
          .toFile(pngPath);
        png++;
      }
      console.log(`OK  ${vertical}/magazine-cover-1280x670`);
    } catch (e) {
      console.error(`FAIL ${vertical}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\nマガジン SVG ${ok} / PNG ${png} / FAIL ${fail}`);
}

// ============================================================
// main
// ============================================================
async function main() {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const filterSlug = getArg("--slug");
  const filterVertical = getArg("--vertical");
  const svgOnly = args.includes("--svg-only");
  const magazineMode = args.includes("--magazine");

  if (magazineMode) {
    return generateMagazines(svgOnly);
  }

  const hasBg = fs.existsSync(BG_PATH);
  let sharp = null;
  if (!svgOnly) {
    try {
      sharp = require("sharp");
    } catch (e) {
      console.warn(`[warn] sharp 不在 → PNG 合成をスキップ (SVG のみ): ${e.message}`);
    }
  }
  console.log(
    `背景: ${hasBg ? "Codex bg (assets/koumuin-cover-bg.png)" : "フォールバック (プログラム生成ダーク背景)"}`,
  );

  const articles = collectArticles(filterSlug, filterVertical);
  if (!articles.length) {
    console.error("対象記事なし (docs/31 に復元済みか確認: restore-from-r2.sh)");
    process.exit(1);
  }

  let ok = 0,
    png = 0,
    fail = 0;
  const bgBuffer = hasBg ? fs.readFileSync(BG_PATH) : null;

  for (const a of articles) {
    try {
      const imagesDir = path.join(a.slugDir, "images");
      fs.mkdirSync(imagesDir, { recursive: true });
      const series = SERIES[a.vertical] || SERIES["koumuin-claude-code"];
      const tone = TONE[a.category] || TONE.default;

      const overlaySvg = makeOverlaySvg({
        num: a.num,
        category: a.category,
        title: a.title,
        isPaid: a.isPaid,
        series,
      });

      // SVG は前景のみを書き出す (背景 base64 を焼かない)。
      const svgPath = path.join(imagesDir, "cover-1280x670.svg");
      fs.writeFileSync(svgPath, overlaySvg);
      ok++;

      if (sharp) {
        // 背景 (bitmap or フォールバック SVG) の上に 前景 SVG を合成
        const baseBuffer = hasBg
          ? await sharp(bgBuffer).resize(W, H, { fit: "cover" }).toBuffer()
          : await sharp(Buffer.from(fallbackBgSvg(tone.accent)), { density: 72 })
              .resize(W, H)
              .toBuffer();
        const overlayPng = await sharp(Buffer.from(overlaySvg), { density: 72 })
          .resize(W, H)
          .png()
          .toBuffer();
        const pngPath = path.join(imagesDir, "cover-1280x670.png");
        await sharp(baseBuffer)
          .composite([{ input: overlayPng, top: 0, left: 0 }])
          .png()
          .toFile(pngPath);
        png++;
      }
      console.log(`OK  ${a.vertical}/${a.entry}  [${a.category}] ${a.isPaid ? "有料" : "無料"}`);
    } catch (e) {
      console.error(`FAIL ${a.entry}: ${e.message}`);
      fail++;
    }
  }

  console.log(`\nSVG ${ok} / PNG ${png} / FAIL ${fail} (計 ${articles.length} 本)`);
}

main();
