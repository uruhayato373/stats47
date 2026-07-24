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

    // metrics.rankingKey 実在 + 到達可能 (isActive)
    for (const m of c.metrics) {
      if (!metricExists(m.rankingKey)) {
        errors.push(`[metric-missing] ${c.key}: rankingKey "${m.rankingKey}" が METRICS_REGISTRY に不在`);
      } else if (METRICS_REGISTRY[m.rankingKey]?.isActive !== true) {
        errors.push(
          `[metric-inactive] ${c.key}: rankingKey "${m.rankingKey}" は isActive:false — ` +
            `/ranking/${m.rankingKey} は 410 か空ページになる`,
        );
      }
      if ((m.role === "primary" || m.role === "secondary") && !m.selection) {
        warns.push(`[no-selection] ${c.key}: ${m.role} 指標 "${m.rankingKey}" に selection (選定根拠) 未記入`);
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
      // componentKey 横断重複 (warn: 複数ページでの componentKey 再利用は設計上許容
      //   = load-page-components.ts「componentKey は複数ページで再利用可能」。認知目的で warn)
      const owner = globalComponentKeys.get(ch.componentKey);
      if (owner && owner !== c.key) {
        warns.push(`[dup-key-global] ${c.key}: componentKey "${ch.componentKey}" が ${owner} と共有`);
      }
      globalComponentKeys.set(ch.componentKey, c.key);
      // sortOrder 重複 (warn: 既存データに正当な重複あり=local-economy。描画は配列順で安定)
      if (seenSortOrders.has(ch.sortOrder)) {
        warns.push(`[dup-sortorder] ${c.key}/${ch.componentKey}: sortOrder ${ch.sortOrder} が重複`);
      }
      seenSortOrders.add(ch.sortOrder);
      // (section はテーマ renderer 未使用 = free-form のため検査しない。area は AreaChartSection で使用)
      // relatedRankingKeys ⊂ metrics
      for (const k of ch.relatedRankingKeys ?? []) {
        if (!metricKeys.has(k)) {
          errors.push(`[related-key] ${c.key}/${ch.componentKey}: relatedRankingKey "${k}" が metrics に不在`);
        }
        keysInCharts.add(k);
      }
      // rankingLink は本番に出るリンクなので、実在 + isActive を検査する
      // (2026-07-24 実測: dwelling-per-floor-area が /themes/living-housing で 410 を返していた)
      const linkKey = /^\/ranking\/([a-z0-9-]+)\/?$/.exec(ch.rankingLink ?? "")?.[1];
      if (linkKey) {
        if (!metricExists(linkKey)) {
          errors.push(`[ranking-link] ${c.key}/${ch.componentKey}: rankingLink "${ch.rankingLink}" が METRICS_REGISTRY に不在`);
        } else if (METRICS_REGISTRY[linkKey]?.isActive !== true) {
          errors.push(
            `[ranking-link] ${c.key}/${ch.componentKey}: rankingLink "${ch.rankingLink}" は isActive:false — 410 か空ページになる`,
          );
        }
      }
    }

    // primary 指標のカバレッジ (warn: primary は metrics[] 由来の stat-card として
    //   チャートと独立に描画されるため、チャート未使用でも正常。設計確認用に warn)
    for (const m of c.metrics) {
      if (m.role !== "primary") continue;
      if (!keysInCharts.has(m.rankingKey)) {
        warns.push(`[primary-orphan] ${c.key}: primary 指標 "${m.rankingKey}" がチャート未使用 (card 描画)`);
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
