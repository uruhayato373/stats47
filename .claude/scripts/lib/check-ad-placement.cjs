#!/usr/bin/env node
/**
 * recurrence guard: AdSense 広告枠の配置崩れ
 *
 * 2026-07-29 の全 23 ルート棚卸しで、面ごとに次の崩れが混入していた:
 *   - `/ranking` `/themes` `/survey` `/tag` で記事内広告とフッター広告が「間にコンテンツ 0」で隣接
 *   - `/tag` `/survey/[surveyKey]` は間が条件付きブロックだけで、在庫ゼロの日に実行時 2 連になる
 *   - `/areas/[areaCode]` が右レール専用の RailAdSlot を本文カラム (840px) に配置
 *   - `/areas` `/blog/tags` `/search` が slot 部品を通さず AdSenseAd を直叩き
 *     (`/areas` は ranking 詳細用の定数を流用していた)
 *   - `COMPARE_PAGE_SIDEBAR` が参照ゼロのまま残存
 *
 * 規約自体は既にあった (InContentAdSlot の docstring / docs/01_技術設計/04_デザインシステム.md /
 * .claude/rules/affiliate-ads-standards.md) が、コードで強制されていなかったため少しずつ崩れた。
 *
 * ★対象は「app 配下のページファイルに直接書かれた広告」だけ。RightRailWidgets / ThemePageLayout /
 *   CityPageFooter 経由で間接的に入る広告はファイル横断なので静的には追えない。
 *   ページ単位の完全な検査が要るなら、レンダリング後の `.ad-container` を数える e2e に上げること
 *   (プレースホルダーも本番と同じ `.ad-container` を出すので dev でも数えられる)。
 *
 * 正典: .claude/rules/ui-components.md / docs/01_技術設計/04_デザインシステム.md
 *
 * Usage: node .claude/scripts/lib/check-ad-placement.cjs
 * Exit: 違反があれば 1。
 */
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "../../..");
const APP_DIR = path.join(PROJECT_ROOT, "apps/web/src/app");
const SRC_DIR = path.join(PROJECT_ROOT, "apps/web/src");
const CONSTANTS_FILE = path.join(SRC_DIR, "lib/google-adsense/constants.ts");

/** 広告枠を描画するコンポーネント。隣接判定の対象。 */
const AD_COMPONENTS = [
  "InContentAdSlot",
  "FooterAdSlot",
  "RailAdSlot",
  "AdSenseAdWrapper",
  "AdSenseAd",
];

/**
 * RailAdSlot を使ってよい app 配下のファイル。
 * RailAdSlot は右レール (360px) 前提の SurfaceCard 枠で、本文カラムに置くと枠だけレール幅で浮く。
 * 追加するときは「そのファイルのどの要素が rail か」を 1 行コメントで添えること。
 */
const RAIL_SLOT_ALLOWLIST = new Set([
  // home の左レール (aside)。lg 以上で 264px / xl で 280px のカラム。
  "apps/web/src/app/page.tsx",
  // blog 詳細の ArticleShell 右レール (360px)。
  "apps/web/src/app/blog/[slug]/page.tsx",
]);

const errors = [];

// ---------------------------------------------------------------------------
// 準備: slot 定数 → format の対応表
// ---------------------------------------------------------------------------
function readSlotFormats() {
  const src = fs.readFileSync(CONSTANTS_FILE, "utf8");
  const formats = new Map();
  const re =
    /export\s+const\s+([A-Z0-9_]+)\s*:\s*AdSlotConfig\s*=\s*\{[\s\S]*?format:\s*"([a-z]+)"/g;
  let m;
  while ((m = re.exec(src)) !== null) formats.set(m[1], m[2]);
  return formats;
}

function listFiles(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(abs, ext, out);
    else if (entry.name.endsWith(ext)) out.push(abs);
  }
  return out;
}

/** コメントを除去する。JSX コメント `{/* ... *\/}` は `{}` が残るだけで括弧は釣り合う。 */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * JSX 子要素として「無条件に」描画される開始タグの数を数える。
 *
 * `{cond && <X/>}` や `{list.map(...)}` は在庫ゼロ・空配列で何も描画しないので、
 * 広告どうしを隔てるものとして数えない。判定は波括弧の深さで行い、深さ 0 の `<Tag` だけ数える。
 */
function countUnconditionalTags(text) {
  let depth = 0;
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth = Math.max(0, depth - 1);
    else if (ch === "<" && depth === 0 && /[A-Za-z]/.test(text[i + 1] ?? "")) count++;
  }
  return count;
}

/** ファイル内の広告コンポーネント出現位置を、記述順に返す。 */
function findAdUsages(src) {
  const usages = [];
  for (const name of AD_COMPONENTS) {
    const re = new RegExp(`<${name}\\b`, "g");
    let m;
    while ((m = re.exec(src)) !== null) {
      // AdSenseAdWrapper は AdSenseAd の接頭辞に一致しないよう \b で切っている
      usages.push({ name, index: m.index, end: m.index + m[0].length });
    }
  }
  return usages.sort((a, b) => a.index - b.index);
}

const slotFormats = readSlotFormats();
if (slotFormats.size === 0) {
  console.error("❌ constants.ts から slot 定数を 1 件も読めなかった。パターンが変わった可能性がある。");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 検査 1-4: app 配下のページファイル
// ---------------------------------------------------------------------------
for (const abs of listFiles(APP_DIR, ".tsx")) {
  const rel = path.relative(PROJECT_ROOT, abs);
  const raw = fs.readFileSync(abs, "utf8");
  const src = stripComments(raw);

  // 1. 生 AdSenseAd の直叩き禁止
  if (/\bAdSenseAd\b/.test(src)) {
    errors.push(
      `${rel}\n   AdSenseAd を直接使っている。slot 部品 (InContentAdSlot / FooterAdSlot / RailAdSlot) を\n` +
        "   経由すること。直叩きはラベル表記と slotId 未発行時の非描画を迂回する。",
    );
  }

  // 3. RailAdSlot は rail を持つファイルだけ
  if (/<RailAdSlot\b/.test(src) && !RAIL_SLOT_ALLOWLIST.has(rel)) {
    errors.push(
      `${rel}\n   RailAdSlot を rail 以外で使っている。右レール (360px) 前提の枠なので本文カラムに\n` +
        "   置くと枠だけレール幅で浮く。本文末尾なら FooterAdSlot を使うこと。",
    );
  }

  // 4. fluid (記事内) の枠はページ 1 枠まで
  const fluidSlots = [...src.matchAll(/<InContentAdSlot\s+slot=\{([A-Z0-9_]+)\}/g)]
    .map((m) => m[1])
    .filter((name) => slotFormats.get(name) === "article");
  if (fluidSlots.length > 1) {
    errors.push(
      `${rel}\n   記事内 (fluid) 広告が ${fluidSlots.length} 枠ある: ${fluidSlots.join(", ")}。\n` +
        "   fluid はページ 1 枠まで (docs/01_技術設計/04_デザインシステム.md)。",
    );
  }

  // 2. 広告どうしの隣接禁止
  const usages = findAdUsages(src);
  for (let i = 0; i + 1 < usages.length; i++) {
    const between = src.slice(usages[i].end, usages[i + 1].index);
    if (countUnconditionalTags(between) === 0) {
      errors.push(
        `${rel}\n   ${usages[i].name} と ${usages[i + 1].name} の間に無条件のコンテンツが無い。\n` +
          "   条件付きブロック ({cond && ...} / .map()) は在庫ゼロで消えるため隔てるものに数えない。\n" +
          "   必ず描画されるセクションを間に挟むか、片方の枠を落とすこと。",
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 検査 5: 参照ゼロの slot 定数
// ---------------------------------------------------------------------------
const srcFiles = listFiles(SRC_DIR, ".ts").concat(listFiles(SRC_DIR, ".tsx"));
for (const [name] of slotFormats) {
  const referenced = srcFiles.some((abs) => {
    if (abs === CONSTANTS_FILE) return false;
    return new RegExp(`\\b${name}\\b`).test(fs.readFileSync(abs, "utf8"));
  });
  if (!referenced) {
    errors.push(
      `apps/web/src/lib/google-adsense/constants.ts\n   ${name} が参照ゼロ。使わない slot 定数は削除すること\n` +
        "   (残すと slotId の取り違えや重複の温床になる)。",
    );
  }
}

if (errors.length > 0) {
  for (const e of errors) console.error(`❌ ${e}`);
  console.error("");
  console.error(`ad placement guard: ${errors.length} 件違反。`);
  process.exit(1);
}
console.log(
  "✓ ad placement guard: 広告の隣接・rail 部品誤用・生 AdSenseAd・死んだ slot 定数なし",
);
