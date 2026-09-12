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

import {
  AFFILIATE_VERTICALS,
  adVertical,
} from "../../../apps/web/src/features/ads/constants/affiliate-category";
import { AFFILIATE_ADS } from "../../../apps/web/scripts/affiliate-ads-data";
import { isAffiliateActive } from "../../../apps/web/src/features/ads/constants/affiliate-delivery-policy";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "../../..");

// canonical サイズ (affiliate-ads-standards.md §サイズ)。banner はこの 3 種のみ (text はサイズなし)。
const CANONICAL_BANNER_SIZES = new Set(["300x250", "250x250", "320x100"]);
// 既存一点物 (grandfathering)。新規はこれらも不可 (canonical に寄せる)。段階的に 0 へ。
const KNOWN_LEGACY_SIZES = new Set([
  "336x280",
  "160x600",
  "120x600",
  "165x120",
  "300x300",
  "320x250",
]);

interface SizeViolation {
  id: string;
  size: string;
  tier: "legacy" | "error";
}

/** banner のサイズ規約違反を検出する。legacy=既存許容 / error=新規混入 (canonical にも legacy にも無い)。 */
function lintSizes(): SizeViolation[] {
  const violations: SizeViolation[] = [];
  for (const ad of AFFILIATE_ADS) {
    if (!ad.isActive || ad.adType !== "banner") continue;
    const size = `${ad.width ?? "?"}x${ad.height ?? "?"}`;
    if (CANONICAL_BANNER_SIZES.has(size)) continue;
    violations.push({ id: ad.id, size, tier: KNOWN_LEGACY_SIZES.has(size) ? "legacy" : "error" });
  }
  return violations;
}

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

  const checkSize = args.includes("--check-size");
  const active = AFFILIATE_ADS.filter((ad) => isAffiliateActive(ad));
  const byCategory = tally(active.map((a) => a.categoryKey ?? "(null)"));
  const byVertical = tally(active.map((a) => adVertical(a) ?? "(unresolved)"));
  const byLocation = tally(active.map((a) => a.locationCode ?? "(null)"));
  const byAdType = tally(active.map((a) => a.adType ?? "(null)"));
  const uniqueTitles = new Set(active.map((a) => a.title)).size;
  const uniquePrograms = new Set(active.flatMap((ad) => ad.programRef ? [ad.programRef] : [])).size;

  const coveredCategories = CATEGORY_KEYS.filter((k) => (byCategory[k] ?? 0) > 0);
  const gapCategories = CATEGORY_KEYS.filter((k) => !(byCategory[k] ?? 0));
  const thinCategories = CATEGORY_KEYS.filter(
    (k) => (byCategory[k] ?? 0) > 0 && (byCategory[k] ?? 0) <= 2,
  );

  // 意図軸 (10 vertical) カバレッジ — 広告解決の実軸。ページ意図に合う在庫があるか。
  const coveredVerticals = AFFILIATE_VERTICALS.filter((v) => (byVertical[v] ?? 0) > 0);
  const gapVerticals = AFFILIATE_VERTICALS.filter((v) => !(byVertical[v] ?? 0));
  const thinVerticals = AFFILIATE_VERTICALS.filter(
    (v) => (byVertical[v] ?? 0) > 0 && (byVertical[v] ?? 0) <= 2,
  );

  // ★ adType 別カバレッジ (2026-07-28 追加)。vertical 総数だけを見ると
  //   「banner はあるが text がゼロ」を検出できない。banner 解決は locationCode を無視するのに対し
  //   text 解決は locationCode で絞るため、text がゼロの vertical はブログ本文・サイドバーの
  //   テキスト枠が埋まらない (economy へフォールバックして文脈が外れる)。
  const countBy = (adType: string) => {
    const m: Record<string, number> = {};
    for (const a of active) {
      if (a.adType !== adType) continue;
      const v = adVertical(a);
      if (v) m[v] = (m[v] ?? 0) + 1;
    }
    return m;
  };
  const byVerticalText = countBy("text");
  const byVerticalBanner = countBy("banner");
  const textGapVerticals = AFFILIATE_VERTICALS.filter((v) => !(byVerticalText[v] ?? 0));
  const bannerGapVerticals = AFFILIATE_VERTICALS.filter((v) => !(byVerticalBanner[v] ?? 0));

  const sizeViolations = lintSizes();
  const sizeErrors = sizeViolations.filter((v) => v.tier === "error");

  const snapshot = {
    generatedAt: new Date().toISOString(),
    date,
    totals: {
      entries: AFFILIATE_ADS.length,
      active: active.length,
      uniqueAdvertisers: uniqueTitles,
      uniqueTitles,
      uniquePrograms,
      programRefMissing: active.filter((ad) => !ad.programRef).length,
    },
    byCategory,
    byVertical,
    byLocation,
    byAdType,
    coverage: {
      categoriesCovered: coveredCategories.length,
      categoriesTotal: CATEGORY_KEYS.length,
      gapCategories,
      thinCategories,
      verticalsCovered: coveredVerticals.length,
      verticalsTotal: AFFILIATE_VERTICALS.length,
      gapVerticals,
      thinVerticals,
      // adType 別。text がゼロの vertical はテキスト枠が埋まらず economy へフォールバックする。
      byVerticalText,
      byVerticalBanner,
      textGapVerticals,
      bannerGapVerticals,
    },
    sizeViolations,
  };

  // JSON snapshot を .claude/state/ads/ に書き出す (機械向け / ループの入力)
  const stateDir = resolve(PROJECT_ROOT, ".claude/state/ads");
  mkdirSync(stateDir, { recursive: true });
  for (const name of [`inventory-${date}.json`, "inventory-latest.json"]) {
    writeFileSync(resolve(stateDir, name), JSON.stringify(snapshot, null, 2));
  }

  if (jsonOnly) {
    process.stdout.write(JSON.stringify(snapshot, null, 2) + "\n");
    if (checkSize && sizeErrors.length > 0) process.exitCode = 1;
    return;
  }

  const lines: string[] = [];
  lines.push(`# アフィリエイト在庫 棚卸し (${date})`);
  lines.push("");
  lines.push(
    `総枠数 **${snapshot.totals.entries}** / active **${snapshot.totals.active}** / 登録案件 **${snapshot.totals.uniquePrograms}** 件 (広告主の社数ではない)`,
  );
  lines.push("");

  lines.push("## 旧categoryKey別の在庫数 (参考。掲載可否ではない)");
  lines.push("");
  lines.push(
    `カバー **${coveredCategories.length}/${CATEGORY_KEYS.length}** 軸。`,
  );
  lines.push("");
  lines.push("| categoryKey | 枠数 | 状態 |");
  lines.push("|---|---|---|");
  for (const k of CATEGORY_KEYS) {
    const n = byCategory[k] ?? 0;
    const state = n === 0 ? "直接指定なし" : n <= 2 ? "少数" : "在庫あり";
    lines.push(`| ${k} | ${n} | ${state} |`);
  }
  lines.push("");
  if (gapCategories.length) {
    lines.push(
      `> **旧categoryKey指定なし (${gapCategories.length})**: ${gapCategories.join(", ")} — 配信はvertical・内容・対象keyで解決するため、掲載漏れや機会損失を意味しない。`,
    );
    lines.push("");
  }

  lines.push("## 意図軸 (10 vertical) カバレッジ ★広告解決の実軸");
  lines.push("");
  lines.push(`カバー **${coveredVerticals.length}/${AFFILIATE_VERTICALS.length}** 軸。`);
  lines.push("");
  lines.push("| vertical | 枠数 | 状態 |");
  lines.push("|---|---|---|");
  for (const v of AFFILIATE_VERTICALS) {
    const n = byVertical[v] ?? 0;
    const state = n === 0 ? "在庫なし" : n <= 2 ? "少数" : "在庫あり";
    lines.push(`| ${v} | ${n} | ${state} |`);
  }
  lines.push("");
  if (gapVerticals.length) {
    lines.push(
      `> **在庫ゼロの vertical (${gapVerticals.length})**: ${gapVerticals.join(", ")} — この意図のページ (ranking/theme/blog) に意図一致広告が出ない。/register-affiliate-banner propose の対象。`,
    );
    lines.push("");
  }

  lines.push("## サイズ規約 (canonical: 300x250 / 250x250 / 320x100 / text)");
  lines.push("");
  if (sizeViolations.length === 0) {
    lines.push("✅ 全 banner が canonical サイズ。");
  } else {
    lines.push("| id | size | 判定 |");
    lines.push("|---|---|---|");
    for (const v of sizeViolations) {
      lines.push(`| ${v.id} | ${v.size} | ${v.tier === "error" ? "❌ 非canonical (新規禁止)" : "⚠ legacy (段階移行)"} |`);
    }
    lines.push("");
    if (sizeErrors.length) {
      lines.push(
        `> ❌ **canonical/legacy いずれにも無いサイズ ${sizeErrors.length} 件** — 新規混入。300x250 素材で再取得するか isActive:false にする (\`--check-size\` で exit 1)。`,
      );
    }
  }
  lines.push("");

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

  lines.push("## ページ別の配置確認");
  lines.push("");
  lines.push("共有resolver・配信条件で生成する placement-map-latest.json を参照。検索需要の母数と実表示は別。全ページの表示確認済みとはみなさない。");
  lines.push(
    "> 在庫数だけで枠を増やさない。文脈・掲載条件・viewable impression・成果の証拠を確認する。人口/医療等には明示対象keyのゲートがある。",
  );
  lines.push("");

  process.stdout.write(lines.join("\n") + "\n");
  process.stderr.write(
    `\n[audit] JSON snapshot → .claude/state/ads/inventory-${date}.json (+ latest)\n`,
  );

  // pre-commit / CI ゲート: --check-size 指定時は非 canonical・非 legacy サイズがあれば exit 1。
  if (checkSize && sizeErrors.length > 0) {
    process.stderr.write(
      `\n[audit] ❌ サイズ規約違反 (新規混入) ${sizeErrors.length} 件: ${sizeErrors.map((v) => `${v.id}(${v.size})`).join(", ")}\n`,
    );
    process.exitCode = 1;
  }
}

main();
