/**
 * 財政フロー Sankey 用の per-prefecture 派生 JSON を生成する。
 *
 * 既存の R2 観測値(歳入金額・歳出総額・目的別歳出比率)を読み、47 県 × 最新共通年度で
 * `apps/web/public/finance-flow/{NN}.json` を組み立てる(完全DBレス: R2 を入力に再生成可能な派生 snapshot)。
 *
 * 実行:
 *   R2_PUBLIC_FETCH_URL=https://storage.stats47.jp NODE_OPTIONS='--conditions react-server' \
 *     npx tsx apps/web/scripts/generate-finance-flow.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { readStatsValues } from "@stats47/stats-r2/readers";

const OUT_DIR = resolve(__dirname, "../public/finance-flow");

/** 歳入の財源 (金額メトリクス) */
const REVENUE: ReadonlyArray<{ metric: string; name: string }> = [
  { metric: "local-tax-prefecture", name: "地方税" },
  { metric: "local-allocation-tax-prefecture", name: "地方交付税" },
  { metric: "national-treasury-disbursement-prefecture", name: "国庫支出金" },
  { metric: "local-bonds-prefecture", name: "地方債" },
  { metric: "local-assigned-tax-prefecture", name: "地方譲与税" },
  { metric: "local-special-grant-prefecture", name: "地方特例交付金" },
  { metric: "traffic-safety-special-grant-prefecture", name: "交通安全交付金" },
];

/** 目的別歳出 (構成比% メトリクス → 金額 = 比率 × 歳出総額 / 100) */
const EXPENDITURE: ReadonlyArray<{ metric: string; name: string }> = [
  { metric: "welfare-expenditure-ratio-pref-finance", name: "民生費" },
  { metric: "education-expenditure-ratio-pref-finance", name: "教育費" },
  { metric: "public-works-expenditure-ratio-pref-finance", name: "土木費" },
  { metric: "sanitation-expenditure-ratio-pref-finance", name: "衛生費" },
  { metric: "police-expenditure-ratio-pref-finance", name: "警察費" },
  { metric: "commerce-industry-expenditure-ratio-pref-finance", name: "商工費" },
  { metric: "agriculture-forestry-fisheries-expenditure-ratio-pref-finance", name: "農林水産業費" },
  { metric: "labor-expenditure-ratio-pref-finance", name: "労働費" },
  { metric: "disaster-recovery-expenditure-ratio-pref-finance", name: "災害復旧費" },
];

const TOTAL_REVENUE = "total-revenue-prefecture";
const TOTAL_EXPENDITURE = "total-expenditure-prefecture";

interface Row {
  areaCode: string;
  areaName: string;
  yearCode: string;
  value: number;
}

/** metric → (areaCode → (yearCode → value)) と areaName */
type MetricIndex = Map<string, Map<string, number>>;

function indexRows(rows: Row[]): { byArea: MetricIndex; names: Map<string, string> } {
  const byArea: MetricIndex = new Map();
  const names = new Map<string, string>();
  for (const r of rows) {
    if (!byArea.has(r.areaCode)) byArea.set(r.areaCode, new Map());
    byArea.get(r.areaCode)!.set(String(r.yearCode), r.value);
    if (r.areaName) names.set(r.areaCode, r.areaName);
  }
  return { byArea, names };
}

/** year(完全一致) → 無ければ year 以下の最新 */
function valueAt(perYear: Map<string, number> | undefined, year: string): number | null {
  if (!perYear) return null;
  if (perYear.has(year)) return perYear.get(year)!;
  const le = [...perYear.keys()].filter((y) => y <= year).sort();
  return le.length ? perYear.get(le[le.length - 1])! : null;
}

async function loadAll(metrics: string[]): Promise<Map<string, ReturnType<typeof indexRows>>> {
  const out = new Map<string, ReturnType<typeof indexRows>>();
  for (const m of metrics) {
    const payload = await readStatsValues(m, "prefecture");
    if (!payload) {
      console.warn(`  ⚠️ no data: ${m}`);
      out.set(m, indexRows([]));
      continue;
    }
    out.set(m, indexRows(payload.rows as Row[]));
  }
  return out;
}

async function main(): Promise<void> {
  const allMetrics = [
    TOTAL_REVENUE,
    TOTAL_EXPENDITURE,
    ...REVENUE.map((r) => r.metric),
    ...EXPENDITURE.map((e) => e.metric),
  ];
  console.log(`reading ${allMetrics.length} metrics from R2…`);
  const idx = await loadAll(allMetrics);

  mkdirSync(OUT_DIR, { recursive: true });
  const trIdx = idx.get(TOTAL_REVENUE)!;
  const teIdx = idx.get(TOTAL_EXPENDITURE)!;

  let written = 0;
  for (let i = 1; i <= 47; i++) {
    const code = String(i).padStart(2, "0");
    const areaCode = `${code}000`;
    const trYears = trIdx.byArea.get(areaCode);
    const teYears = teIdx.byArea.get(areaCode);
    if (!trYears || !teYears) {
      console.warn(`  ⚠️ skip ${areaCode}: missing total revenue/expenditure`);
      continue;
    }
    // 最新共通年度
    const common = [...trYears.keys()].filter((y) => teYears.has(y)).sort();
    if (!common.length) {
      console.warn(`  ⚠️ skip ${areaCode}: no common year`);
      continue;
    }
    const year = common[common.length - 1];
    const totalRevenue = trYears.get(year)!;
    const totalExpenditure = teYears.get(year)!;
    const focusName = trIdx.names.get(areaCode) ?? teIdx.names.get(areaCode) ?? areaCode;

    // 歳入財源
    const revenue: { name: string; value: number }[] = [];
    for (const { metric, name } of REVENUE) {
      const v = valueAt(idx.get(metric)!.byArea.get(areaCode), year);
      if (v && v > 0) revenue.push({ name, value: v });
    }
    const revSum = revenue.reduce((s, n) => s + n.value, 0);
    const otherRev = totalRevenue - revSum;
    if (otherRev > 0) revenue.push({ name: "その他財源", value: otherRev });

    // 目的別歳出 (比率 × 総額)
    const expenditure: { name: string; value: number }[] = [];
    for (const { metric, name } of EXPENDITURE) {
      const pct = valueAt(idx.get(metric)!.byArea.get(areaCode), year);
      if (pct && pct > 0) {
        const amt = Math.round((totalExpenditure * pct) / 100);
        if (amt > 0) expenditure.push({ name, value: amt });
      }
    }
    const expSum = expenditure.reduce((s, n) => s + n.value, 0);
    const otherExp = totalExpenditure - expSum;
    if (otherExp > 0) expenditure.push({ name: "その他歳出", value: otherExp });

    revenue.sort((a, b) => b.value - a.value);
    expenditure.sort((a, b) => b.value - a.value);

    const payload = {
      focusCode: code,
      focusName,
      year: Number(year),
      source: `地方財政状況調査 (${year}年度)`,
      revenue,
      expenditure,
      totals: { revenue: totalRevenue, expenditure: totalExpenditure },
    };
    writeFileSync(resolve(OUT_DIR, `${code}.json`), JSON.stringify(payload));
    written++;
  }
  console.log(`✅ wrote ${written} files to ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
