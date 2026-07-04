/**
 * validate-theme-catalog — ThemeCatalog の内整合を検証する lint。
 *
 * 規約の正典: `.claude/rules/theme-catalog-standards.md`
 *
 * error (exit 1 / CI・pre-commit をブロック):
 *   - metrics.rankingKey / relatedRankingKeys が METRICS_REGISTRY / metrics に不在
 *   - componentType が union 外 (TS でもブロックされるが runtime backstop)
 *   - componentKey 重複 (テーマ内 + 全テーマ横断)
 *   - primary 指標がどのチャートにも panelTab にも現れない
 *   - chart.section が panelTabs.label に不在 (null は許容)
 *   - sortOrder 重複 (テーマ内)
 *   - panelTabs.rankingKeys ⊄ metrics
 * warn (exit 0 / 表示のみ, --strict で error):
 *   - primary/secondary の selection 未記入
 *
 * 使い方:
 *   npx tsx packages/data-configs/scripts/validate-theme-catalog.ts
 *   npx tsx packages/data-configs/scripts/validate-theme-catalog.ts --strict
 */
import { METRICS_REGISTRY } from "../src/registry";
import { listThemeCatalogs, CATALOG_COMPONENT_TYPES } from "../src/theme-catalog";

const STRICT = process.argv.includes("--strict");
const VALID_TYPES = new Set<string>(CATALOG_COMPONENT_TYPES);

function metricExists(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(METRICS_REGISTRY, key);
}

function tally(list: string[]): string {
  const counts = list.reduce<Record<string, number>>((acc, m) => {
    const tag = m.match(/^\[([a-z-]+)\]/)?.[1] ?? "other";
    acc[tag] = (acc[tag] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
}

function main() {
  const catalogs = listThemeCatalogs();
  const errors: string[] = [];
  const warns: string[] = [];

  const globalComponentKeys = new Map<string, string>(); // componentKey → theme

  for (const c of catalogs) {
    const metricKeys = new Set(c.metrics.map((m) => m.rankingKey));
    const tabLabels = new Set((c.panelTabs ?? []).map((t) => t.label));
    const keysInTabs = new Set(
      (c.panelTabs ?? []).flatMap((t) => t.rankingKeys),
    );

    // metrics.rankingKey 実在
    for (const m of c.metrics) {
      if (!metricExists(m.rankingKey)) {
        errors.push(`[metric-missing] ${c.key}: rankingKey "${m.rankingKey}" が METRICS_REGISTRY に不在`);
      }
      if ((m.role === "primary" || m.role === "secondary") && !m.selection) {
        warns.push(`[no-selection] ${c.key}: ${m.role} 指標 "${m.rankingKey}" に selection (選定根拠) 未記入`);
      }
    }

    // panelTabs.rankingKeys ⊂ metrics
    for (const t of c.panelTabs ?? []) {
      for (const k of t.rankingKeys) {
        if (!metricKeys.has(k)) {
          errors.push(`[tab-key] ${c.key}: panelTab "${t.label}" の "${k}" が metrics に不在`);
        }
      }
    }

    // charts
    const seenComponentKeys = new Set<string>();
    const seenSortOrders = new Set<number>();
    const keysInCharts = new Set<string>();
    for (const ch of c.charts) {
      if (!VALID_TYPES.has(ch.componentType)) {
        errors.push(`[component-type] ${c.key}/${ch.componentKey}: 無効な componentType "${ch.componentType}"`);
      }
      // componentKey 重複 (テーマ内)
      if (seenComponentKeys.has(ch.componentKey)) {
        errors.push(`[dup-key-theme] ${c.key}: componentKey "${ch.componentKey}" がテーマ内で重複`);
      }
      seenComponentKeys.add(ch.componentKey);
      // componentKey 重複 (横断)
      const owner = globalComponentKeys.get(ch.componentKey);
      if (owner && owner !== c.key) {
        errors.push(`[dup-key-global] ${c.key}: componentKey "${ch.componentKey}" が ${owner} と重複`);
      }
      globalComponentKeys.set(ch.componentKey, c.key);
      // sortOrder 重複
      if (seenSortOrders.has(ch.sortOrder)) {
        errors.push(`[dup-sortorder] ${c.key}/${ch.componentKey}: sortOrder ${ch.sortOrder} が重複`);
      }
      seenSortOrders.add(ch.sortOrder);
      // section が tab に存在
      if (ch.section != null && !tabLabels.has(ch.section)) {
        errors.push(`[section] ${c.key}/${ch.componentKey}: section "${ch.section}" が panelTabs.label に不在`);
      }
      // relatedRankingKeys ⊂ metrics
      for (const k of ch.relatedRankingKeys ?? []) {
        if (!metricKeys.has(k)) {
          errors.push(`[related-key] ${c.key}/${ch.componentKey}: relatedRankingKey "${k}" が metrics に不在`);
        }
        keysInCharts.add(k);
      }
    }

    // primary 指標のカバレッジ (チャート or タブ)
    for (const m of c.metrics) {
      if (m.role !== "primary") continue;
      if (!keysInCharts.has(m.rankingKey) && !keysInTabs.has(m.rankingKey)) {
        errors.push(`[primary-orphan] ${c.key}: primary 指標 "${m.rankingKey}" がどのチャートにも panelTab にも現れない`);
      }
    }
  }

  console.log(
    `theme-catalog 検証: ${catalogs.length} themes / error ${errors.length} / warn ${warns.length}`,
  );
  if (warns.length > 0) {
    console.log("⚠️  warn 内訳:", tally(warns));
    for (const w of warns.slice(0, 30)) console.log("   " + w);
    if (warns.length > 30) console.log(`   … 他 ${warns.length - 30} 件`);
  }
  if (errors.length > 0) {
    console.error(`\n❌ theme-catalog 検証: ${errors.length} 件の error`);
    console.error("   内訳:", tally(errors));
    for (const e of errors.slice(0, 50)) console.error("   " + e);
    if (errors.length > 50) console.error(`   … 他 ${errors.length - 50} 件`);
    console.error("   規約: .claude/rules/theme-catalog-standards.md");
    process.exit(1);
  }
  if (STRICT && warns.length > 0) {
    console.error(`\n❌ --strict: warn ${warns.length} 件を error 扱い`);
    process.exit(1);
  }
  console.log("✅ theme-catalog 検証: error なし");
  process.exit(0);
}

main();
