#!/usr/bin/env node
/**
 * docs/31_note記事原稿/ の未生成 cover を一括生成する。
 *
 * 対象:
 *   - A-laborwage-* 5 本 (労働・賃金シリーズ)
 *   - koumuin-shigoto-kouritsuka-ai (公務員 × AI 単発)
 *   - pinned-intro (自己紹介・固定記事)
 */
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const DRAFT_ROOT = path.join(PROJECT_ROOT, "docs/31_note記事原稿");

const W = 1280;
const H = 670;

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ===== A-laborwage シリーズ共通テンプレ (5 本) =====

const LABORWAGE_ARTICLES = [
  {
    slug: "A-laborwage-commute-time-prefecture",
    eyebrow: "労働・賃金 ランキング",
    headline: "平均通勤時間",
    subhead: "首都圏 vs 地方で\nどれくらい違うのか？",
    accent: "#0ea5e9",
    accentBg: "#e0f2fe",
    iconGlyph: "分",
    iconUnit: "min",
    metricLabel: "首都圏は片道 1 時間超が当たり前",
  },
  {
    slug: "A-laborwage-job-opening-ratio-prefecture",
    eyebrow: "労働・賃金 ランキング",
    headline: "有効求人倍率",
    subhead: "「売り手市場」の県は\n意外にも地方？",
    accent: "#16a34a",
    accentBg: "#dcfce7",
    iconGlyph: "倍",
    iconUnit: "ratio",
    metricLabel: "求人 ÷ 求職者 = 倍率",
  },
  {
    slug: "A-laborwage-paid-leave-utilization-prefecture",
    eyebrow: "労働・賃金 ランキング",
    headline: "有給休暇取得率",
    subhead: "休める県・休めない県\n業種構造で差が出る",
    accent: "#f59e0b",
    accentBg: "#fef3c7",
    iconGlyph: "%",
    iconUnit: "rate",
    metricLabel: "製造業比率が取得率を左右",
  },
  {
    slug: "A-laborwage-starting-salary-by-prefecture",
    eyebrow: "労働・賃金 ランキング",
    headline: "大卒初任給",
    subhead: "新卒が最も稼げる県は？\n月 2 万円超の差",
    accent: "#7c3aed",
    accentBg: "#ede9fe",
    iconGlyph: "¥",
    iconUnit: "JPY",
    metricLabel: "賃金構造基本統計調査より",
  },
  {
    slug: "A-laborwage-wages-by-industry-prefecture",
    eyebrow: "労働・賃金 ランキング",
    headline: "産業別平均賃金",
    subhead: "稼げる業界は\n地域でどう違うのか？",
    accent: "#dc2626",
    accentBg: "#fee2e2",
    iconGlyph: "業",
    iconUnit: "sector",
    metricLabel: "高付加価値産業の集積が決め手",
  },
];

function generateLaborwageSvg(a) {
  const subheadLines = a.subhead.split("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>
  text { font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Noto Sans JP', sans-serif; }
</style>

<!-- Background -->
<rect width="${W}" height="${H}" fill="#ffffff"/>
<rect x="0" y="0" width="${W}" height="14" fill="${a.accent}"/>

<!-- Decorative ring (right) -->
<circle cx="1080" cy="420" r="240" fill="${a.accentBg}" opacity="0.6"/>
<circle cx="1080" cy="420" r="170" fill="none" stroke="${a.accent}" stroke-width="2" opacity="0.3"/>

<!-- Eyebrow -->
<text x="80" y="120" font-size="20" font-weight="600" fill="${a.accent}" letter-spacing="2">${escapeXml(a.eyebrow)}</text>
<text x="80" y="158" font-size="14" font-weight="500" fill="#94a3b8" letter-spacing="3">47 PREFECTURES SERIES</text>

<!-- Headline (huge) -->
<text x="80" y="290" font-size="92" font-weight="900" fill="#0f172a">${escapeXml(a.headline)}</text>
<text x="80" y="335" font-size="28" font-weight="700" fill="${a.accent}">47 都道府県ランキング</text>

<!-- Sub headline (lead copy) -->
${subheadLines
  .map(
    (l, i) =>
      `<text x="80" y="${410 + i * 42}" font-size="32" font-weight="500" fill="#334155">${escapeXml(l)}</text>`,
  )
  .join("\n")}

<!-- Icon (right circle, SVG-native glyph) -->
<text x="1080" y="465" text-anchor="middle" font-size="200" font-weight="900" fill="${a.accent}" opacity="0.9">${escapeXml(a.iconGlyph)}</text>
<text x="1080" y="540" text-anchor="middle" font-size="18" font-weight="600" fill="${a.accent}" letter-spacing="3" opacity="0.7">${escapeXml(a.iconUnit)}</text>

<!-- Metric label chip -->
<rect x="80" y="540" width="${10 + a.metricLabel.length * 18}" height="38" rx="19" fill="${a.accentBg}"/>
<text x="${90 + (a.metricLabel.length * 18) / 2 - 5}" y="565" text-anchor="middle" font-size="15" font-weight="600" fill="${a.accent}">${escapeXml(a.metricLabel)}</text>

<!-- Footer -->
<line x1="80" y1="612" x2="${W - 80}" y2="612" stroke="#e2e8f0" stroke-width="1"/>
<text x="80" y="645" font-size="15" fill="#64748b">統計で見る都道府県 — 元県庁職員が解説</text>
<text x="${W - 80}" y="645" text-anchor="end" font-size="15" font-weight="500" fill="#94a3b8">stats47.jp</text>
</svg>
`;
}

// ===== koumuin-shigoto-kouritsuka-ai (単発) =====

function generateKoumuinShigotoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>
  text { font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Noto Sans JP', sans-serif; }
</style>

<!-- Background -->
<rect width="${W}" height="${H}" fill="#0f172a"/>
<rect x="0" y="0" width="${W}" height="14" fill="#38bdf8"/>

<!-- Decorative grid (subtle) -->
<g opacity="0.06" stroke="#ffffff" stroke-width="1">
  <line x1="0" y1="200" x2="${W}" y2="200"/>
  <line x1="0" y1="400" x2="${W}" y2="400"/>
  <line x1="400" y1="14" x2="400" y2="${H}"/>
  <line x1="880" y1="14" x2="880" y2="${H}"/>
</g>

<!-- Eyebrow -->
<text x="80" y="100" font-size="18" font-weight="600" fill="#38bdf8" letter-spacing="3">PUBLIC SECTOR × AI</text>
<line x1="80" y1="118" x2="240" y2="118" stroke="#38bdf8" stroke-width="2"/>

<!-- Big headline (4 lines) -->
<text x="80" y="210" font-size="52" font-weight="900" fill="#f8fafc">公務員の事務作業、</text>
<text x="80" y="288" font-size="74" font-weight="900" fill="#38bdf8">「半日仕事」が</text>
<text x="80" y="370" font-size="74" font-weight="900" fill="#fbbf24">「数分」になる時代</text>

<!-- Sub copy -->
<text x="80" y="450" font-size="22" font-weight="500" fill="#cbd5e1">47 都道府県統計を 1 人で動かす運営者が、</text>
<text x="80" y="482" font-size="22" font-weight="500" fill="#cbd5e1">Claude Code で集計を自動化した実例。</text>

<!-- Highlight tags -->
<rect x="80" y="520" width="120" height="36" rx="18" fill="#1e293b" stroke="#38bdf8" stroke-width="1"/>
<text x="140" y="544" text-anchor="middle" font-size="15" font-weight="600" fill="#38bdf8">実例ベース</text>

<rect x="212" y="520" width="160" height="36" rx="18" fill="#1e293b" stroke="#fbbf24" stroke-width="1"/>
<text x="292" y="544" text-anchor="middle" font-size="15" font-weight="600" fill="#fbbf24">公務員に応用可</text>

<rect x="384" y="520" width="160" height="36" rx="18" fill="#1e293b" stroke="#a78bfa" stroke-width="1"/>
<text x="464" y="544" text-anchor="middle" font-size="15" font-weight="600" fill="#a78bfa">331 ランキング</text>

<!-- Footer -->
<line x1="80" y1="612" x2="${W - 80}" y2="612" stroke="#1e293b" stroke-width="1"/>
<text x="80" y="645" font-size="15" fill="#64748b">stats47.jp 運営者が書く</text>
<text x="${W - 80}" y="645" text-anchor="end" font-size="15" font-weight="500" fill="#94a3b8">stats47.jp</text>
</svg>
`;
}

// ===== pinned-intro (自己紹介・固定記事) =====

function generatePinnedIntroSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>
  text { font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Noto Sans JP', sans-serif; }
</style>

<!-- Background gradient -->
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ffffff"/>
    <stop offset="100%" stop-color="#f1f5f9"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>

<!-- Brand accent bars -->
<rect x="0" y="0" width="${W}" height="14" fill="#2563eb"/>
<rect x="0" y="${H - 14}" width="${W}" height="14" fill="#2563eb"/>

<!-- Decorative dots (japan map abstract) -->
<g opacity="0.18">
  <circle cx="1020" cy="220" r="48" fill="#2563eb"/>
  <circle cx="1110" cy="280" r="32" fill="#3b82f6"/>
  <circle cx="970" cy="320" r="24" fill="#60a5fa"/>
  <circle cx="1080" cy="380" r="40" fill="#2563eb"/>
  <circle cx="980" cy="430" r="28" fill="#3b82f6"/>
  <circle cx="1150" cy="200" r="20" fill="#93c5fd"/>
  <circle cx="1190" cy="350" r="36" fill="#3b82f6"/>
</g>

<!-- Eyebrow -->
<text x="80" y="110" font-size="20" font-weight="600" fill="#2563eb" letter-spacing="2">自己紹介 — stats47 とは</text>
<line x1="80" y1="128" x2="240" y2="128" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>

<!-- Main headline -->
<text x="80" y="232" font-size="58" font-weight="900" fill="#0f172a">元県庁職員がつくった</text>
<text x="80" y="312" font-size="80" font-weight="900" fill="#2563eb">都道府県統計サイト</text>
<text x="80" y="380" font-size="58" font-weight="900" fill="#0f172a">「stats47」</text>

<!-- Subtitle -->
<text x="80" y="448" font-size="22" font-weight="500" fill="#334155">年収・人口・焼肉消費量まで、1,800 以上の統計を</text>
<text x="80" y="480" font-size="22" font-weight="500" fill="#334155">47 都道府県でランキング・可視化。</text>

<!-- Stats chips -->
<g>
  <rect x="80" y="528" width="200" height="48" rx="8" fill="#dbeafe"/>
  <text x="180" y="548" text-anchor="middle" font-size="13" fill="#1e40af" font-weight="500">統計指標</text>
  <text x="180" y="568" text-anchor="middle" font-size="18" fill="#1e40af" font-weight="800">1,800+</text>

  <rect x="296" y="528" width="200" height="48" rx="8" fill="#dcfce7"/>
  <text x="396" y="548" text-anchor="middle" font-size="13" fill="#15803d" font-weight="500">ランキング</text>
  <text x="396" y="568" text-anchor="middle" font-size="18" fill="#15803d" font-weight="800">800+</text>

  <rect x="512" y="528" width="200" height="48" rx="8" fill="#fef3c7"/>
  <text x="612" y="548" text-anchor="middle" font-size="13" fill="#92400e" font-weight="500">相関ペア</text>
  <text x="612" y="568" text-anchor="middle" font-size="18" fill="#92400e" font-weight="800">12 万</text>
</g>

<!-- Footer -->
<text x="80" y="618" font-size="15" fill="#64748b">あなたの県は何位？</text>
<text x="${W - 80}" y="618" text-anchor="end" font-size="15" font-weight="500" fill="#94a3b8">stats47.jp</text>
</svg>
`;
}

function writeCover(slug, svg) {
  const imagesDir = path.join(DRAFT_ROOT, slug, "images");
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  const outPath = path.join(imagesDir, "cover-1280x670.svg");
  fs.writeFileSync(outPath, svg);
  console.log(`OK   ${slug}/images/cover-1280x670.svg`);
}

function main() {
  for (const a of LABORWAGE_ARTICLES) {
    writeCover(a.slug, generateLaborwageSvg(a));
  }
  writeCover("koumuin-shigoto-kouritsuka-ai", generateKoumuinShigotoSvg());
  writeCover("pinned-intro", generatePinnedIntroSvg());

  console.log("\nGenerated 7 cover SVGs.");
}

main();
