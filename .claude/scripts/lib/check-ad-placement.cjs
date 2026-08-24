#!/usr/bin/env node
/**
 * recurrence guard: 広告枠と右レールの配置崩れ
 *
 * 2026-07-29 の全 23 ルート棚卸しで、面ごとに次の崩れが混入していた:
 *   - `/ranking` `/themes` `/survey` `/tag` で記事内広告とフッター広告が「間にコンテンツ 0」で隣接
 *   - `/tag` `/survey/[surveyKey]` は間が条件付きブロックだけで、在庫ゼロの日に実行時 2 連になる
 *   - `/areas/[areaCode]` が右レール専用の RailAdSlot を本文カラム (840px) に配置
 *   - `/areas` `/blog/tags` `/search` が slot 部品を通さず AdSenseAd を直叩き
 *     (`/areas` は ranking 詳細用の定数を流用していた)
 *   - `COMPARE_PAGE_SIDEBAR` が参照ゼロのまま残存
 *   - 右レールに独立スクロールと独自テキスト PR が入り、本文と別操作になっていた
 *
 * 規約自体は既にあった (InContentAdSlot の docstring / docs/01_技術設計/04_デザインシステム.md /
 * .claude/rules/affiliate-ads-standards.md) が、コードで強制されていなかったため少しずつ崩れた。
 *
 * ★広告隣接検査の対象は「app 配下のページファイルに直接書かれた広告」だけ。
 *   右レール契約は共有 shell / widget と既知の ranking / blog rail を別途ファイル横断で検査する。
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

const RIGHT_RAIL_FILES = {
  articleShell: "apps/web/src/components/layout/ArticleShell.tsx",
  sharedWidgets: "apps/web/src/components/rail/RightRailWidgets.tsx",
  areaProfile: "apps/web/src/features/area-profile/components/AreaProfileSidebar.tsx",
  ranking: "apps/web/src/features/ranking/components/RankingKeyPage/RankingPageSidebarSection.tsx",
  blog: "apps/web/src/app/blog/[slug]/page.tsx",
  affiliateSlot: "apps/web/src/features/ads/components/AffiliateAdSlot.tsx",
  promoBanner: "apps/web/src/features/ads/components/SidebarPromoBanner.tsx",
};

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
 * RailAdSlot は右レール (316px) 前提の SurfaceCard 枠で、本文カラムに置くと枠だけレール幅で浮く。
 * 追加するときは「そのファイルのどの要素が rail か」を 1 行コメントで添えること。
 */
const RAIL_SLOT_ALLOWLIST = new Set([
  // home の左レール (aside)。lg 以上で 264px / xl で 280px のカラム。
  "apps/web/src/app/page.tsx",
  // category の左レール (aside)。home と同じ 264px / 280px の2ペイン構成。
  "apps/web/src/app/category/[categoryKey]/page.tsx",
  // blog 詳細の ArticleShell 右レール (316px)。
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

function readRequiredSource(rel) {
  const abs = path.join(PROJECT_ROOT, rel);
  if (!fs.existsSync(abs)) {
    errors.push(`${rel}\n   右レール契約の検査対象ファイルが見つからない。移動時は guard も更新すること。`);
    return "";
  }
  return fs.readFileSync(abs, "utf8");
}

function checkForbiddenPatterns(rel, src, patterns) {
  for (const { pattern, message } of patterns) {
    if (pattern.test(src)) errors.push(`${rel}\n   ${message}`);
  }
}

function findPromotionalTags(src) {
  return [
    ...src.matchAll(
      /<([A-Z][A-Za-z0-9]*(?:Promo|Affiliate|Furusato|TextAd)[A-Za-z0-9]*)\b/g,
    ),
  ].map((match) => match[1]);
}

function checkAllowedPromotionalTags(rel, src, allowed) {
  const invalid = [...new Set(findPromotionalTags(src))].filter(
    (name) => !allowed.has(name),
  );
  if (invalid.length > 0) {
    errors.push(
      `${rel}\n   右レールに画像バナー契約外の PR component がある: ${invalid.join(", ")}。\n` +
        "   PR は SidebarPromoBanner / bannerOnly の AffiliateAdSlot を使うこと。",
    );
  }
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
      `${rel}\n   RailAdSlot を rail 以外で使っている。右レール (316px) 前提の枠なので本文カラムに\n` +
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
// 検査 5-6: 右レールはページ scroll + 画像 PR のみ
// ---------------------------------------------------------------------------
const noIndependentScroll = [
  {
    pattern: /overflow-y-(?:auto|scroll)/,
    message:
      "右レールに overflow-y-auto/scroll がある。ページ本体の scroll だけで全内容へ到達させること。",
  },
  {
    pattern: /max-h-\[(?:calc\(100vh|40vh)/,
    message:
      "右レールに viewport 高さ制限がある。独立 scroll の再導入につながるため自然高にすること。",
  },
];

const articleShell = stripComments(readRequiredSource(RIGHT_RAIL_FILES.articleShell));
const sharedWidgets = stripComments(readRequiredSource(RIGHT_RAIL_FILES.sharedWidgets));
const areaProfile = stripComments(readRequiredSource(RIGHT_RAIL_FILES.areaProfile));
const rankingRail = stripComments(readRequiredSource(RIGHT_RAIL_FILES.ranking));
const blogPage = readRequiredSource(RIGHT_RAIL_FILES.blog);
const affiliateSlot = stripComments(readRequiredSource(RIGHT_RAIL_FILES.affiliateSlot));
const promoBanner = stripComments(readRequiredSource(RIGHT_RAIL_FILES.promoBanner));

checkForbiddenPatterns(RIGHT_RAIL_FILES.articleShell, articleShell, noIndependentScroll);
checkForbiddenPatterns(RIGHT_RAIL_FILES.sharedWidgets, sharedWidgets, noIndependentScroll);
checkForbiddenPatterns(RIGHT_RAIL_FILES.areaProfile, areaProfile, noIndependentScroll);

if (!/<SidebarPromoBanner\b/.test(sharedWidgets)) {
  errors.push(
    `${RIGHT_RAIL_FILES.sharedWidgets}\n   共通右レールに登録済み画像バナー SidebarPromoBanner がない。`,
  );
}
checkAllowedPromotionalTags(
  RIGHT_RAIL_FILES.sharedWidgets,
  sharedWidgets,
  new Set(["SidebarPromoBanner"]),
);

if (!/<SidebarPromoBanner\b/.test(rankingRail)) {
  errors.push(`${RIGHT_RAIL_FILES.ranking}\n   ranking 右レールに画像バナーがない。`);
}
if (!/<AffiliateAdSlot[\s\S]*?\bbannerOnly\b[\s\S]*?\/>/.test(rankingRail)) {
  errors.push(
    `${RIGHT_RAIL_FILES.ranking}\n   AffiliateAdSlot に bannerOnly がない。テキスト広告へ戻さないこと。`,
  );
}
checkAllowedPromotionalTags(
  RIGHT_RAIL_FILES.ranking,
  rankingRail,
  new Set(["SidebarPromoBanner", "AffiliateAdSlot"]),
);

const blogRailStart = blogPage.indexOf("const rail = (");
const blogRailEnd = blogPage.indexOf("// レール末尾", blogRailStart);
if (blogRailStart < 0 || blogRailEnd <= blogRailStart) {
  errors.push(
    `${RIGHT_RAIL_FILES.blog}\n   blog 右レールの静的範囲を特定できない。構造変更時は guard も更新すること。`,
  );
} else {
  const blogRail = stripComments(blogPage.slice(blogRailStart, blogRailEnd));
  if (!/<SidebarPromoBanner\b/.test(blogRail)) {
    errors.push(`${RIGHT_RAIL_FILES.blog}\n   blog 右レールに画像バナーがない。`);
  }
  checkAllowedPromotionalTags(
    RIGHT_RAIL_FILES.blog,
    blogRail,
    new Set(["SidebarPromoBanner"]),
  );
}

if (!/\bbannerOnly\?: boolean/.test(affiliateSlot) || !/if \(!bannerOnly\)/.test(affiliateSlot)) {
  errors.push(
    `${RIGHT_RAIL_FILES.affiliateSlot}\n   bannerOnly の型または text fallback guard がない。`,
  );
}
if (!/<BannerAd\b/.test(promoBanner)) {
  errors.push(
    `${RIGHT_RAIL_FILES.promoBanner}\n   SidebarPromoBanner が BannerAd を描画していない。`,
  );
}

// ---------------------------------------------------------------------------
// 検査 7: 参照ゼロの slot 定数
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
  "✓ ad placement guard: 広告配置・右レール画像/scroll契約・slot 定数に違反なし",
);
