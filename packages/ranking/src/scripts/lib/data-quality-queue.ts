/**
 * データ品質キューの判定 (純粋関数)。DATA-QUALITY-LOOP-01 ①②。
 *
 * 既存の週次監査 (ranking-integrity = 配信年 / estat-year-coverage = e-Stat 実在年) の結果を
 * 全 active metric について 1 つのキューへまとめ、上から最初に当てはまる処置を付ける。
 *
 *   1 誤り     — 年・年度の表記の誤り (時点統計なのに yearFormat: "fiscal")
 *   2 更新     — e-Stat に config より多くの年が実在する / 最新年が公表周期 1 回分以上遅れている
 *   3 調査終了 — 遅れが大きく (周期 3 回分かつ 10 年以上) 新しい年が出ていない「候補」
 *   4 noindex候補 — 観測 1〜2 年かつ需要が観測されていない (RANK-THIN-01 と同じ基準で人が判断)
 *
 * 2〜4 は配信年から推定した候補で、公式の最新公表を照会した結論ではない (basis に明記する)。
 * 年表記の判定は「公式表記を確認済みの調査」だけを対象にし、それ以外は unknown に留める。
 */

/**
 * 公式表記が「年」(時点・暦年) と確認済みの調査。原典名は SSDS の cdcat01-sources の表記。
 * 確認日 2026-09-27: 統計局「令和2年国勢調査」・人口推計「2026年（令和8年）4月1日現在」・
 * 厚労省「令和○年人口動態統計」・住宅・土地統計調査「令和5年10月1日現在」・
 * 社会生活基本調査「令和3年10月20日現在」。ここに無い調査は推測せず unknown にする。
 */
export const CALENDAR_CONFIRMED_SOURCES: readonly string[] = [
  "国勢調査報告",
  "人口推計",
  "人口動態統計",
  "住宅・土地統計調査報告",
  "社会生活基本調査報告",
];

/** surveys.json の id で同じ 5 調査を表したもの (SSDS 以外の config が surveyId を持つ場合)。 */
export const CALENDAR_CONFIRMED_SURVEY_IDS: readonly string[] = [
  "census",
  "population-estimates",
  "vital-statistics",
  "housing-land-survey",
  "social-life-basic-survey",
];

export type YearLabelVerdict = "error" | "ok" | "unknown";

export function classifyYearLabel(params: {
  yearFormat: string | undefined;
  sources: string[] | null; // null = 原典不明
  surveyId?: string | null;
}): YearLabelVerdict {
  const { yearFormat, sources, surveyId } = params;
  let calendarConfirmed = false;
  if (sources && sources.length > 0) {
    calendarConfirmed = sources.every((s) => CALENDAR_CONFIRMED_SOURCES.includes(s));
  } else if (surveyId) {
    calendarConfirmed = CALENDAR_CONFIRMED_SURVEY_IDS.includes(surveyId);
  }
  if (!calendarConfirmed) return "unknown";
  return yearFormat === "fiscal" ? "error" : "ok";
}

/** 観測年の間隔の最小値 (公表周期の推定)。1〜10 年に丸める。観測 1 年なら null。 */
export function estimateCadence(years: number[]): number | null {
  const sorted = [...new Set(years)].sort((a, b) => a - b);
  if (sorted.length < 2) return null;
  let min = Infinity;
  for (let i = 1; i < sorted.length; i++) min = Math.min(min, sorted[i] - sorted[i - 1]);
  return Math.max(1, Math.min(10, min));
}

/** 調査年から公表までの遅れの想定 (年)。これを超えて周期 1 回分遅れていたら「古い」。 */
export const PUBLICATION_LAG_YEARS = 2;
/** 調査終了候補の下限: 周期 3 回分かつ 10 年以上の遅れ。 */
export const ENDED_MIN_CYCLES = 3;
export const ENDED_MIN_LAG_YEARS = 10;
/** noindex 候補の需要上限 (GSC 表示)。null (未観測) も候補に含め、demandKnown で区別する。 */
export const THIN_DEMAND_MAX_IMPRESSIONS = 10;

export type FreshnessVerdict = "fresh" | "stale" | "ended-candidate" | "unknown";

export function classifyFreshness(params: {
  years: number[];
  currentYear: number;
}): { verdict: FreshnessVerdict; latest: number | null; cadence: number | null; lagCycles: number | null } {
  const { years, currentYear } = params;
  if (years.length === 0) return { verdict: "unknown", latest: null, cadence: null, lagCycles: null };
  const latest = Math.max(...years);
  // 観測 1 年は周期が分からないので毎年公表と仮定する (過小評価より検出を優先)
  const cadence = estimateCadence(years) ?? 1;
  const lag = currentYear - PUBLICATION_LAG_YEARS - latest;
  const lagCycles = Math.floor(lag / cadence);
  let verdict: FreshnessVerdict = "fresh";
  if (lag >= cadence) verdict = "stale";
  if (lag >= cadence * ENDED_MIN_CYCLES && lag >= ENDED_MIN_LAG_YEARS) verdict = "ended-candidate";
  return { verdict, latest, cadence, lagCycles: Math.max(0, lagCycles) };
}

export type Treatment = 1 | 2 | 3 | 4 | null;

export interface QueueEntry {
  key: string;
  treatment: Treatment;
  reason: string;
  yearLabel: YearLabelVerdict;
  yearFormat: string | null;
  sources: string[] | null;
  freshness: FreshnessVerdict;
  latestYear: number | null;
  observedYears: number;
  cadence: number | null;
  estatExtendCandidate: boolean;
  demand: number | null;
}

export function classifyQueueEntry(params: {
  key: string;
  yearFormat: string | undefined;
  sources: string[] | null;
  surveyId?: string | null;
  years: number[];
  currentYear: number;
  estatExtendCandidate: boolean;
  demand: number | null;
}): QueueEntry {
  const yearLabel = classifyYearLabel(params);
  const f = classifyFreshness({ years: params.years, currentYear: params.currentYear });
  let treatment: Treatment = null;
  let reason = "";
  if (yearLabel === "error") {
    treatment = 1;
    reason = `時点統計 (${(params.sources ?? [params.surveyId]).join("・")}) なのに yearFormat: fiscal`;
  } else if (params.estatExtendCandidate) {
    treatment = 2;
    reason = "e-Stat に config より多くの年が実在 (estat-year-coverage)";
  } else if (f.verdict === "stale") {
    treatment = 2;
    reason = `最新 ${f.latest} 年・推定周期 ${f.cadence} 年に対し ${f.lagCycles} 周期遅れ (推定)`;
  } else if (f.verdict === "ended-candidate") {
    treatment = 3;
    reason = `最新 ${f.latest} 年で ${f.lagCycles} 周期遅れ。調査終了か要確認 (推定)`;
  } else if (
    params.years.length > 0 &&
    params.years.length <= 2 &&
    (params.demand === null || params.demand <= THIN_DEMAND_MAX_IMPRESSIONS)
  ) {
    treatment = 4;
    reason = `観測 ${params.years.length} 年・GSC 表示 ${params.demand ?? "未観測"}`;
  }
  return {
    key: params.key,
    treatment,
    reason,
    yearLabel,
    yearFormat: params.yearFormat ?? null,
    sources: params.sources,
    freshness: f.verdict,
    latestYear: f.latest,
    observedYears: new Set(params.years).size,
    cadence: f.cadence,
    estatExtendCandidate: params.estatExtendCandidate,
    demand: params.demand,
  };
}

/** 処置の番号順 → 需要の多い順 (未観測は最後) → key。 */
export function sortQueue(entries: QueueEntry[]): QueueEntry[] {
  return [...entries].sort((a, b) => {
    const ta = a.treatment ?? 9;
    const tb = b.treatment ?? 9;
    if (ta !== tb) return ta - tb;
    const da = a.demand ?? -1;
    const db = b.demand ?? -1;
    if (da !== db) return db - da;
    return a.key.localeCompare(b.key);
  });
}

export type CdcatEntry = { kind?: string; formula?: string; sources?: string[] };

/**
 * 指標 (#コード) の原典一覧は分母 (人口など) しか載っていないことがある。式に出てくる基礎項目の原典も
 * 合わせ、どれか 1 つでも原典不明 (空) なら全体を不明 (null) にする。分子の原典を見ずに
 * 「人口推計・国勢調査だけだから暦年」と判定すると、預金残高 (C360111) 1 人当たりなどを誤って誤りに数える (2026-09-27)。
 */
export function resolveSources(cdcat: Record<string, CdcatEntry>, cd: string): string[] | null {
  const entry = cdcat[cd] ?? cdcat[`#${cd.replace(/^#/, "")}`];
  if (!entry?.sources) return null;
  const all = new Set(entry.sources);
  for (const token of entry.formula?.match(/[A-Z]\d{3,}/g) ?? []) {
    const base = cdcat[token];
    if (!base?.sources || base.sources.length === 0) return null;
    for (const src of base.sources) all.add(src);
  }
  return all.size > 0 ? [...all] : null;
}
