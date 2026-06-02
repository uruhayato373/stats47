/**
 * 地方財政ダッシュボード (都道府県) の Page1 推移カード用データを R2 公開 URL から読む。
 *
 * 完全DBレス: ランキング values.json (app/ranking/<key>/values.json) の partitions
 * (年次分割) を都道府県×年次の時系列にピボットする。データ取込は不要 (既存 R2 を読むだけ)。
 *
 * 出典: 総務省「地方財政状況調査」。stats47 保有の最新年は 2022 年度。
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
  /** 表示単位 ("%" or "") */
  unit: string;
  /** 小数桁 */
  decimals: number;
  /** 値が高いほど良い指標か (カードの補助色用) */
  higherIsBetter: boolean;
}

export interface FinanceTrendData {
  metrics: FinanceMetricMeta[];
  /** series[metricKey][pref2桁] = 年次昇順の推移 */
  series: Record<string, Record<string, TrendPoint[]>>;
  /** 全指標を通じた最新年 */
  latestYear: number;
}

/** Page1 KPI カードの指標定義 (順序が表示順) */
const METRICS: FinanceMetricMeta[] = [
  { key: "fiscal-strength-index-prefecture", label: "財政力指数", unit: "", decimals: 2, higherIsBetter: true },
  { key: "current-balance-ratio", label: "経常収支比率", unit: "%", decimals: 1, higherIsBetter: false },
  { key: "real-public-debt-service-ratio", label: "実質公債費比率", unit: "%", decimals: 1, higherIsBetter: false },
  { key: "future-burden-ratio", label: "将来負担比率", unit: "%", decimals: 1, higherIsBetter: false },
  { key: "real-balance-ratio", label: "実質収支比率", unit: "%", decimals: 1, higherIsBetter: true },
];

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

/** 直近 N 年に絞る (PBI は 5 年表示) */
const MAX_YEARS = 8;

async function fetchMetricSeries(
  key: string,
): Promise<{ key: string; byPref: Record<string, TrendPoint[]>; latest: number }> {
  const empty = { key, byPref: {} as Record<string, TrendPoint[]>, latest: 0 };
  try {
    const res = await fetch(`${R2_BASE}/app/ranking/${key}/values.json`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return empty;
    const json = (await res.json()) as ValuesJson;
    const partitions = (json.partitions ?? [])
      .map((p) => ({ year: Number(p.yearCode), values: p.values }))
      .filter((p) => Number.isFinite(p.year))
      .sort((a, b) => a.year - b.year);
    if (partitions.length === 0) return empty;

    const latest = partitions[partitions.length - 1].year;
    const recent = partitions.slice(-MAX_YEARS);

    const byPref: Record<string, TrendPoint[]> = {};
    for (const part of recent) {
      for (const v of part.values) {
        const pref2 = String(v.areaCode).slice(0, 2);
        if (pref2 === "00") continue; // 全国は除外
        (byPref[pref2] ??= []).push({ year: part.year, value: v.value, rank: v.rank });
      }
    }
    return { key, byPref, latest };
  } catch {
    return empty;
  }
}

export async function loadFinanceTrends(): Promise<FinanceTrendData> {
  const results = await Promise.all(METRICS.map((m) => fetchMetricSeries(m.key)));
  const series: Record<string, Record<string, TrendPoint[]>> = {};
  let latestYear = 0;
  for (const r of results) {
    series[r.key] = r.byPref;
    if (r.latest > latestYear) latestYear = r.latest;
  }
  return { metrics: METRICS, series, latestYear };
}
