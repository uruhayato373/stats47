/**
 * アフィリエイト在庫 棚卸し (決定的 audit)。
 *
 * SSOT = apps/web/scripts/affiliate-ads-data.ts の AFFILIATE_ADS[] を読み、
 *   - categoryKey 別の枠数 (17 軸の欠落カテゴリ = impression 機会損失) を可視化
 *   - locationCode / adType 別の偏り
 *   - ページ種別 → 描画 location のカバレッジ
 * を Markdown でレポートし、JSON snapshot を .claude/state/ads/ に書き出す。
 *
 * 実行: npx tsx .claude/scripts/ads/audit-affiliate-inventory.ts
 *   (JSON のみ: --json / 特定日付スナップショット名: --date YYYY-MM-DD)
 *
 * これは「最適化ループ」(/affiliate-improvement) の入力。GA4 計測 (affiliate_click /
 * ad_impression) と突き合わせて弱い枠を特定するための在庫側の真実源。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { AFFILIATE_ADS } from "../../../apps/web/scripts/affiliate-ads-data";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "../../..");

// SSOT: packages/data-configs/src/types.ts の CATEGORY_KEYS (17 軸)。
// e-Stat 機械分類の backbone。ここを直 import すると重い依存を引くため複製 (ズレたら lint で気付く)。
const CATEGORY_KEYS = [
  "landweather",
  "population",
  "laborwage",
  "agriculture",
  "miningindustry",
  "commercial",
  "economy",
  "construction",
  "energy",
  "tourism",
  "educationsports",
  "administrativefinancial",
  "safetyenvironment",
  "socialsecurity",
  "international",
  "infrastructure",
  "ict",
] as const;

// ページ種別 → 実際に描画される location/adType のカバレッジ (apps/web/src/app 実装ベース)。
// impression は「そのページ種別にトラフィックがあり、かつ枠が描画される」ときだけ発生する。
const PAGE_COVERAGE: Array<{
  pageType: string;
  route: string;
  component: string;
  servesLocation: string;
  adType: string;
}> = [
  {
    pageType: "ブログ記事",
    route: "/blog/[slug]",
    component: "ArticleAffiliateBanner",
    servesLocation: "categoryKey 一致 banner (記事末尾)",
    adType: "banner",
  },
  {
    pageType: "ランキング詳細",
    route: "/ranking/[rankingKey]",
    component: "AffiliateAdSlot",
    servesLocation: "sidebar-bottom text → fallback AdSense",
    adType: "text",
  },
  {
    pageType: "エリア(都道府県)",
    route: "/areas/[areaCode]",
    component: "AreaBannerAd",
    servesLocation: "area-sidebar banner",
    adType: "banner",
  },
  {
    pageType: "市区町村",
    route: "/areas/[areaCode]/cities/[cityCode]",
    component: "AreaBannerAd",
    servesLocation: "area-sidebar banner",
    adType: "banner",
  },
  {
    pageType: "カテゴリ一覧",
    route: "/category/[categoryKey]",
    component: "(枠なし?)",
    servesLocation: "未配置の可能性",
    adType: "-",
  },
];

function tally<T extends string>(values: T[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
}

function sortedEntries(rec: Record<string, number>): Array<[string, number]> {
  return Object.entries(rec).sort((a, b) => b[1] - a[1]);
}

function main(): void {
  const args = process.argv.slice(2);
  const jsonOnly = args.includes("--json");
  const dateArg = args[args.indexOf("--date") + 1];
  const date =
    args.includes("--date") && dateArg
      ? dateArg
      : new Date().toISOString().slice(0, 10);

  const active = AFFILIATE_ADS.filter((a) => a.isActive);
  const byCategory = tally(active.map((a) => a.categoryKey ?? "(null)"));
  const byLocation = tally(active.map((a) => a.locationCode ?? "(null)"));
  const byAdType = tally(active.map((a) => a.adType ?? "(null)"));
  const uniqueTitles = new Set(active.map((a) => a.title)).size;

  const coveredCategories = CATEGORY_KEYS.filter((k) => (byCategory[k] ?? 0) > 0);
  const gapCategories = CATEGORY_KEYS.filter((k) => !(byCategory[k] ?? 0));
  const thinCategories = CATEGORY_KEYS.filter(
    (k) => (byCategory[k] ?? 0) > 0 && (byCategory[k] ?? 0) <= 2,
  );

  const snapshot = {
    generatedAt: new Date().toISOString(),
    date,
    totals: {
      entries: AFFILIATE_ADS.length,
      active: active.length,
      uniqueAdvertisers: uniqueTitles,
    },
    byCategory,
    byLocation,
    byAdType,
    coverage: {
      categoriesCovered: coveredCategories.length,
      categoriesTotal: CATEGORY_KEYS.length,
      gapCategories,
      thinCategories,
    },
  };

  // JSON snapshot を .claude/state/ads/ に書き出す (機械向け / ループの入力)
  const stateDir = resolve(PROJECT_ROOT, ".claude/state/ads");
  mkdirSync(stateDir, { recursive: true });
  for (const name of [`inventory-${date}.json`, "inventory-latest.json"]) {
    writeFileSync(resolve(stateDir, name), JSON.stringify(snapshot, null, 2));
  }

  if (jsonOnly) {
    process.stdout.write(JSON.stringify(snapshot, null, 2) + "\n");
    return;
  }

  const lines: string[] = [];
  lines.push(`# アフィリエイト在庫 棚卸し (${date})`);
  lines.push("");
  lines.push(
    `総枠数 **${snapshot.totals.entries}** / active **${snapshot.totals.active}** / 実広告主 **${snapshot.totals.uniqueAdvertisers}** 社`,
  );
  lines.push("");

  lines.push("## カテゴリ別 (17 軸カバレッジ)");
  lines.push("");
  lines.push(
    `カバー **${coveredCategories.length}/${CATEGORY_KEYS.length}** 軸。`,
  );
  lines.push("");
  lines.push("| categoryKey | 枠数 | 状態 |");
  lines.push("|---|---|---|");
  for (const k of CATEGORY_KEYS) {
    const n = byCategory[k] ?? 0;
    const state = n === 0 ? "❌ ゼロ (機会損失)" : n <= 2 ? "⚠ 手薄" : "✅";
    lines.push(`| ${k} | ${n} | ${state} |`);
  }
  lines.push("");
  if (gapCategories.length) {
    lines.push(
      `> **広告ゼロの軸 (${gapCategories.length})**: ${gapCategories.join(", ")} — 該当カテゴリのランキング/記事に広告が出ず impression を取りこぼす。`,
    );
    lines.push("");
  }

  lines.push("## 配置 (locationCode) 別");
  lines.push("");
  lines.push("| locationCode | 枠数 |");
  lines.push("|---|---|");
  for (const [loc, n] of sortedEntries(byLocation)) {
    lines.push(`| ${loc} | ${n} |`);
  }
  lines.push("");

  lines.push("## adType 別");
  lines.push("");
  lines.push("| adType | 枠数 |");
  lines.push("|---|---|");
  for (const [t, n] of sortedEntries(byAdType)) {
    lines.push(`| ${t} | ${n} |`);
  }
  lines.push("");

  lines.push("## ページ種別 → 描画カバレッジ");
  lines.push("");
  lines.push("| ページ種別 | route | component | 描画 location | adType |");
  lines.push("|---|---|---|---|---|");
  for (const c of PAGE_COVERAGE) {
    lines.push(
      `| ${c.pageType} | \`${c.route}\` | ${c.component} | ${c.servesLocation} | ${c.adType} |`,
    );
  }
  lines.push("");
  lines.push(
    "> impression を増やすには (a) ゼロ軸の在庫補充 と (b) 高トラフィック page type への枠描画 の両方が要る。",
  );
  lines.push("");

  process.stdout.write(lines.join("\n") + "\n");
  process.stderr.write(
    `\n[audit] JSON snapshot → .claude/state/ads/inventory-${date}.json (+ latest)\n`,
  );
}

main();
