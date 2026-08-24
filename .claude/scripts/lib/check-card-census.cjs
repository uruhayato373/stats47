#!/usr/bin/env node
/**
 * recurrence guard: カード系コンポーネントの「増殖」を抑える census
 *
 * 背景: surface / charts / stat-charts / 各 feature に *Card が 23 種散在し、
 * 共通化(SurfaceCard / ChartPanel / ChartCard 等)で表現できるはずの新規カード枠が
 * feature ごとに増え続けていた (= スパゲッティ化の主要因)。doc 15 は「外枠だけ違う
 * 専用カードを増やす」を既に禁止しているが、コードでの強制が無かった。
 *
 * 本ガードは「`export function/const <Name>Card` の集合がベースラインを超えて増えたら」失敗する。
 * 新しい *Card を足す前に、まず既存の共有カードで表現できないか検討すること。どうしても
 * 必要な場合のみ、下の BASELINE に理由コメント付きで追加する (= 意識的な許可を強制)。
 *
 * 正典: docs/01_技術設計/04_デザインシステム.md (Surface / Card)
 *       .claude/rules/ui-components.md (コンポーネント配置の 3 tier)
 *
 * Usage: node .claude/scripts/lib/check-card-census.cjs
 * Exit: ベースライン外の新規 *Card が見つかれば 1。
 */
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const SCAN_DIRS = ["apps/web/src/components", "apps/web/src/features"];

// 既知のカード系コンポーネント (2026-06-23 census = 22 種)。
// ★増やす前に必ず: 既存の SurfaceCard / SurfaceLinkCard / ChartPanel / ChartCard / RailCard /
//   KpiCard で表現できないか検討する。Phase 0-1 はこの集合を「減らす」方向に進める。
// 新規追加は「なぜ既存で表現できないか」を 1 行コメントで添えること。
const BASELINE = new Set([
  "AiInsightCard",
  "AreaRelatedRankingsCard",
  // 記事系ページ (reading zone) の本文カード。角丸なし + shadow-sm +
  // モバイルフルブリード。ArticleShell と対で使う (2026-07-11 Soft Editorial 移植)。
  "ArticleCard",
  // blog 一覧/詳細の右レール専用プロフィール。SurfaceCard を外枠に使い、
  // 経歴・note CTA・アイコンSNSを一体で提供する feature composite。
  "BlogAuthorProfileCard",
  "ChartCard",
  "ChartLoadingCard",
  "CitiesNavCard",
  "DataUsageCard",
  "DefinitionsCard",
  "FeaturedRankingCard",
  "KeyMetricsTableCard",
  "KpiCard",
  "MultiStatCard",
  // OperatorPromoCard からプロフィール部だけ切り出した home 用省スペースカード
  // (SurfaceCard ベース、アフィリエイト非同梱)。
  "OperatorProfileCard",
  // home ポータル (doc 38) の発見カード。SurfaceCard/SurfaceLinkCard ベースだが trackNavClick 計装 +
  // icon/label/description の portal 固有レイアウトを持つ home-portal feature 専用。
  "PortalBlogCard",
  "PortalNavCard",
  "PortStatisticsMapCard",
  "RailCard",
  "RankingDefinitionCard",
  "RankingSourceCard",
  "SurfaceCard",
  "SurfaceLinkCard",
  "SurveyCard",
  // 調査taxonomyの解決結果を ranking/category/theme/blog の各surfaceへ共通表示し、
  // 導線計測も一元化するfeature composite。外枠は RailCard / SurfaceSection を再利用する。
  "SurveyTaxonomyCard",
  // home-featured-v1 の計測ラッパー (doc 28 §9)。カード枠を描画しない (impression/click 計測の
  // ための div ラップのみ)。表示は children (EditorialFeaturedCard / FeaturedRankingCard) に委譲。
  "TrackedFeaturedRankingCard",
]);

const DEF_RE = /export\s+(?:function|const)\s+([A-Z][A-Za-z0-9]*Card)\b/g;
const EXT = new Set([".ts", ".tsx"]);

/** @param {string} absDir @param {(rel:string)=>void} onFile */
function walk(absDir, onFile) {
  if (!fs.existsSync(absDir)) return;
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const abs = path.join(absDir, entry.name);
    if (entry.isDirectory()) walk(abs, onFile);
    else if (EXT.has(path.extname(entry.name))) onFile(abs);
  }
}

/** name -> file (最初に見つかった定義位置) */
const found = new Map();
for (const dir of SCAN_DIRS) {
  walk(path.join(PROJECT_ROOT, dir), (abs) => {
    const src = fs.readFileSync(abs, "utf8");
    let m;
    DEF_RE.lastIndex = 0;
    while ((m = DEF_RE.exec(src)) !== null) {
      if (!found.has(m[1])) found.set(m[1], path.relative(PROJECT_ROOT, abs));
    }
  });
}

const added = [...found.keys()].filter((n) => !BASELINE.has(n)).sort();
const removed = [...BASELINE].filter((n) => !found.has(n)).sort();

if (removed.length) {
  // 減少は是正の成果なので失敗にはしない。BASELINE を更新するよう促すのみ。
  console.log(
    `ℹ️  card census: ${removed.length} 種が削除済み (BASELINE を縮小してください): ${removed.join(", ")}`,
  );
}

if (added.length) {
  console.error("❌ card census failed: ベースライン外の新規 *Card が追加されています。");
  for (const name of added) {
    console.error(`  - ${name}  (${found.get(name)})`);
  }
  console.error(
    "\n  まず既存の共有カード (SurfaceCard / ChartPanel / ChartCard / RailCard / KpiCard) で\n" +
      "  表現できないか検討してください。どうしても必要なら理由コメント付きで\n" +
      "  .claude/scripts/lib/check-card-census.cjs の BASELINE に追加してください。\n" +
      "  正典: docs/01_技術設計/04_デザインシステム.md / .claude/rules/ui-components.md",
  );
  process.exit(1);
}

console.log(`✅ card census passed (${found.size} 種, ベースライン超過なし)`);
