/**
 * 地方財政ダッシュボード (都道府県) のチャートデータを R2 公開 URL から読む。
 *
 * 完全DBレス: ランキング values.json (app/ranking/<key>/values.json) の partitions
 * (年次分割) を都道府県×年次の時系列にピボットする。データ取込は不要 (既存 R2 を読むだけ)。
 *
 * 総務省「地方財政状況調査 / 社会・人口統計体系」。PBI Japan Dashboard Page1 構成を再現:
 *   三キーチャート (上段): 実質収支比率(折れ線) / 積立金現在高(棒) / 地方債現在高(棒)
 *   財政指標 (下段4): 財政力指数 / 経常収支比率 / 実質公債費比率 / 将来負担比率 (折れ線+全国平均破線)
 */

const R2_BASE = "https://storage.stats47.jp";

export interface TrendPoint {
  year: number;
  value: number;
  rank: number;
}

export interface FinanceMetricMeta {
  key: string;
  label: string;
  /** 表示単位 ("%" / "億円" / "") */
  unit: string;
  /** 小数桁 */
  decimals: number;
  /** チャート種別 */
  chartType: "line" | "bar";
  /** 生値→表示値の倍率 (千円→億円 = 1/100000、比率は 1) */
  scale: number;
  /** 折れ線で全国平均の破線を描くか */
  showAverage: boolean;
}

export interface FinanceTrendData {
  /** 上段「三キーチャート」 */
  topMetrics: FinanceMetricMeta[];
  /** 下段「財政指標」4 折れ線 */
  ratioMetrics: FinanceMetricMeta[];
  /** series[metricKey][pref2桁] = 年次昇順の推移 (生値) */
  series: Record<string, Record<string, TrendPoint[]>>;
  /** nationalAvg[metricKey][year] = 全国平均 (生値、折れ線の破線用) */
  nationalAvg: Record<string, Record<number, number>>;
  /** 全指標を通じた最新年 */
  latestYear: number;
}

const OKU = 1 / 100000; // 千円 → 億円

const TOP_METRICS: FinanceMetricMeta[] = [
  { key: "real-balance-ratio", label: "実質収支比率", unit: "%", decimals: 1, chartType: "line", scale: 1, showAverage: true },
  { key: "reserve-funds-prefecture", label: "積立金現在高", unit: "億円", decimals: 0, chartType: "bar", scale: OKU, showAverage: false },
  { key: "local-debt-current", label: "地方債現在高", unit: "億円", decimals: 0, chartType: "bar", scale: OKU, showAverage: false },
];

const RATIO_METRICS: FinanceMetricMeta[] = [
  { key: "fiscal-strength-index-prefecture", label: "財政力指数", unit: "", decimals: 2, chartType: "line", scale: 1, showAverage: true },
  { key: "current-balance-ratio", label: "経常収支比率", unit: "%", decimals: 1, chartType: "line", scale: 1, showAverage: true },
  { key: "real-public-debt-service-ratio", label: "実質公債費比率", unit: "%", decimals: 1, chartType: "line", scale: 1, showAverage: true },
  { key: "future-burden-ratio", label: "将来負担比率", unit: "%", decimals: 1, chartType: "line", scale: 1, showAverage: true },
];

const ALL_METRICS = [...TOP_METRICS, ...RATIO_METRICS];

interface RankingValue {
  areaCode: string;
  value: number;
  rank: number;
}
interface Partition {
  yearCode: string;
  values: RankingValue[];
}
interface ValuesJson {
  partitions: Partition[];
}

/** 直近 N 年分の partition に絞る (データが疎なため available 年から最大 N) */
const MAX_YEARS = 6;

interface MetricResult {
  key: string;
  byPref: Record<string, TrendPoint[]>;
  avg: Record<number, number>;
  latest: number;
}

async function fetchMetricSeries(key: string): Promise<MetricResult> {
  const empty: MetricResult = { key, byPref: {}, avg: {}, latest: 0 };
  try {
    const res = await fetch(`${R2_BASE}/app/ranking/${key}/values.json`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return empty;
    const json = (await res.json()) as ValuesJson;
    const partitions = (json.partitions ?? [])
      .map((p) => ({ year: Number(p.yearCode), values: p.values }))
      .filter((p) => Number.isFinite(p.year))
      .sort((a, b) => a.year - b.year)
      .slice(-MAX_YEARS);
    if (partitions.length === 0) return empty;

    const latest = partitions[partitions.length - 1].year;
    const byPref: Record<string, TrendPoint[]> = {};
    const avg: Record<number, number> = {};

    for (const part of partitions) {
      let sum = 0;
      let n = 0;
      for (const v of part.values) {
        const pref2 = String(v.areaCode).slice(0, 2);
        if (pref2 === "00") continue; // 全国は除外
        (byPref[pref2] ??= []).push({ year: part.year, value: v.value, rank: v.rank });
        sum += v.value;
        n += 1;
      }
      if (n > 0) avg[part.year] = sum / n;
    }
    return { key, byPref, avg, latest };
  } catch {
    return empty;
  }
}

export async function loadFinanceTrends(): Promise<FinanceTrendData> {
  const results = await Promise.all(ALL_METRICS.map((m) => fetchMetricSeries(m.key)));
  const series: Record<string, Record<string, TrendPoint[]>> = {};
  const nationalAvg: Record<string, Record<number, number>> = {};
  let latestYear = 0;
  for (const r of results) {
    series[r.key] = r.byPref;
    nationalAvg[r.key] = r.avg;
    if (r.latest > latestYear) latestYear = r.latest;
  }
  return { topMetrics: TOP_METRICS, ratioMetrics: RATIO_METRICS, series, nationalAvg, latestYear };
}
