/**
 * ランキングの「掲載価値スコア」(prominence) を計算する純関数。
 *
 * 索引面 (/ranking 6 件・ヘッダー 4 件・カテゴリ代表・関連ランキング) とホーム注目 8 件が
 * **共通で引く単一のスコア**。これ以前は 9 個の選定機構が別々の規則で動いていた
 * (`isFeatured` は 2,295 件中 8 件しか設定されず実質死んでいた)。
 *
 * 主軸は「ページとしての厚み」で、検索需要は副次項に留める。需要を主軸にすると
 * GSC 露出のある 53% に内部リンクが集中し、残り 47% は発見されないまま固定されるため
 * (索引の目的は発見なので、既に人が来ているものを優先しすぎない)。
 *
 * このモジュールは METRICS_REGISTRY を import しない。入力は呼び出し側が渡す。
 */
import { normalizeTitleForDedup, normalizeTitleForHook } from "./normalize-title";

/**
 * 各項の重み。
 *
 * **2026-07-29 に「厚み主軸 (depth 0.30 / demand 0.15)」から改訂した。**
 * 当初は厚みを主軸に据えたが、実データで判別力が無いことが判明したため:
 *
 * | 項 | 満点の件数 (全 2,208 件中) |
 * |---|---|
 * | clarity | 1,992 (90%) |
 * | uniqueness | 1,818 (82%) |
 * | freshness | 1,599 (72%) |
 * | depth | 491 (22%) |
 * | **4 項すべて満点** | **293 (13%)** |
 *
 * 上位帯に 293 件の同点集団ができ、その中の順位は需要の粗いバケットと rankingKey 昇順で
 * 決まっていた。結果、GSC で 1,431 表示ある「平均身長」が 1,600 位、総人口が 794 位に沈み、
 * 索引の先頭には「自然公園面積」「公衆電話設置台数」が並んだ。
 *
 * そこで需要を主軸に、厚みを**同需要帯の中での並べ替え**に回す。
 * 当初懸念した rich-get-richer (露出のあるページに内部リンクが集中し、露出ゼロの 47% が
 * 発見されない) は、**索引がカテゴリ別**であることで緩和される — 各カテゴリが必ず 6 件出すので、
 * 露出の薄いカテゴリ (鉱工業 10 件など) でも枠は埋まり、その中は厚み順に並ぶ。
 *
 * この配分も実測の裏付けがある初期値ではない。デプロイ後 4 週の GSC で
 * 索引経由の /ranking/* 表示回数を見て調整する。根拠なく動かさない。
 */
export const PROMINENCE_WEIGHTS = {
  demand: 0.45,
  depth: 0.2,
  freshness: 0.15,
  clarity: 0.1,
  uniqueness: 0.1,
} as const;

/** この年数ぶんの時系列があれば depth 満点。 */
const DEPTH_SATURATION_YEARS = 20;
/** これ以内の年次なら freshness 満点。 */
const FRESHNESS_FRESH_AGE = 2;
/** これ以上古いと freshness ゼロ。 */
const FRESHNESS_STALE_AGE = 10;
/** この文字数までは clarity 満点。超えると線形に減衰する。 */
const CLARITY_IDEAL_TITLE_LENGTH = 16;
/** この文字数で clarity ゼロ。 */
const CLARITY_WORST_TITLE_LENGTH = 32;
/** 括弧つき・記号ありのタイトルに課す減点。 */
const CLARITY_PARENTHETICAL_PENALTY = 0.2;
const CLARITY_SYMBOL_PENALTY = 0.3;
/** 同義タイトル群の代表でないときの uniqueness。0 にはしない (存在自体は価値があるため)。 */
const NON_REPRESENTATIVE_UNIQUENESS = 0.3;
/**
 * 年次が不明なとき (`years: "all"`) の中立値。
 * 0 にすると不当に埋もれ、1 にすると不当に持ち上がるので中間を置く。
 */
const UNKNOWN_NEUTRAL = 0.5;

/**
 * 需要バケットの上限。**半桁 (√10 ≒ 3.16 倍) 刻み**で 0〜8 の 9 段。
 *
 * 1 桁刻み (5 段) では粗すぎ、表示回数 100 と 999 が同点になっていた。
 * 半桁なら分解能が倍になり、かつ週次の表示回数の揺れ (±10% 程度) では
 * 境界を跨がないので生成物が毎週変わることもない。
 */
const DEMAND_MAX_BUCKET = 8;

export interface ProminenceInput {
  readonly rankingKey: string;
  readonly title: string;
  readonly categoryKey: string;
  /**
   * 観測年の本数。`years: {from,to}` なら to-from+1、`years: [...]` なら要素数。
   * `years: "all"` のように不明なら null。
   */
  readonly yearSpan: number | null;
  /** 最新の観測年 (4 桁)。不明なら null。 */
  readonly latestYear: number | null;
  /** GSC 表示回数。露出なしは 0。 */
  readonly impressions: number;
}

export interface ProminenceBreakdown {
  readonly depth: number;
  readonly freshness: number;
  readonly clarity: number;
  readonly uniqueness: number;
  readonly demand: number;
}

export interface ProminenceResult extends ProminenceBreakdown {
  readonly rankingKey: string;
  readonly categoryKey: string;
  readonly title: string;
  readonly score: number;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** 時系列の長さ。1 年しかない指標は推移が見せられないので 0。 */
export function computeDepth(yearSpan: number | null): number {
  if (yearSpan === null) return UNKNOWN_NEUTRAL;
  if (yearSpan <= 1) return 0;
  return clamp01(Math.log(yearSpan) / Math.log(DEPTH_SATURATION_YEARS));
}

/** データの新しさ。直近 2 年なら満点、10 年以上前で 0。 */
export function computeFreshness(
  latestYear: number | null,
  currentYear: number,
): number {
  if (latestYear === null) return UNKNOWN_NEUTRAL;
  const age = currentYear - latestYear;
  if (age <= FRESHNESS_FRESH_AGE) return 1;
  if (age >= FRESHNESS_STALE_AGE) return 0;
  return clamp01(
    (FRESHNESS_STALE_AGE - age) / (FRESHNESS_STALE_AGE - FRESHNESS_FRESH_AGE),
  );
}

/**
 * タイトルの自明さ。短く記号がないほど代表として据えやすい、という**仮説**に基づく代理指標。
 * 実測で外れていたら override ではなく重みで直す。
 */
export function computeClarity(title: string): number {
  const normalized = normalizeTitleForHook(title);
  const length = [...normalized].length;
  const lengthScore =
    length <= CLARITY_IDEAL_TITLE_LENGTH
      ? 1
      : clamp01(
          (CLARITY_WORST_TITLE_LENGTH - length) /
            (CLARITY_WORST_TITLE_LENGTH - CLARITY_IDEAL_TITLE_LENGTH),
        );

  let penalty = 0;
  if (/[（(]/.test(normalized)) penalty += CLARITY_PARENTHETICAL_PENALTY;
  if (/[／/【】[\]＜＞<>|｜＝=]/.test(normalized)) penalty += CLARITY_SYMBOL_PENALTY;

  return clamp01(lengthScore - penalty);
}

/**
 * 需要。**半桁で量子化する**ので、週次の表示回数の揺れでは順位が動かない。
 * 0 / 1-3 / 4-9 / 10-31 / 32-99 / 100-316 / 317-999 / 1000-3161 / 3162+ の 9 段。
 */
export function computeDemand(impressions: number): number {
  if (!Number.isFinite(impressions) || impressions <= 0) return 0;
  const bucket = Math.min(
    DEMAND_MAX_BUCKET,
    Math.floor(Math.log10(impressions) * 2) + 1,
  );
  return bucket / DEMAND_MAX_BUCKET;
}

/**
 * 同義タイトル群 (年・調査名違い) の代表を 1 本だけ選ぶ。
 *
 * 優先順位は **需要 → 最新年 → rankingKey 昇順**。
 * 旧 `pickRepresentativeRankings` は「最新年が新しい方」だけで決めていたが、それだと
 * 読者が実際に到達しているキーが非代表に落ちる (実測: 表示回数 1,431 の「平均身長」が
 * 別バージョンに代表を奪われて 266 位に沈んだ)。索引の代表は「人が来ている方」を採る。
 */
function selectDedupRepresentatives(
  inputs: readonly ProminenceInput[],
): ReadonlySet<string> {
  const bestByTitle = new Map<string, ProminenceInput>();
  for (const input of inputs) {
    const key = normalizeTitleForDedup(input.title);
    const current = bestByTitle.get(key);
    if (!current || isBetterRepresentative(input, current)) {
      bestByTitle.set(key, input);
    }
  }
  return new Set([...bestByTitle.values()].map((i) => i.rankingKey));
}

function isBetterRepresentative(
  candidate: ProminenceInput,
  incumbent: ProminenceInput,
): boolean {
  const candidateDemand = computeDemand(candidate.impressions);
  const incumbentDemand = computeDemand(incumbent.impressions);
  if (candidateDemand !== incumbentDemand) return candidateDemand > incumbentDemand;

  const candidateYear = candidate.latestYear ?? 0;
  const incumbentYear = incumbent.latestYear ?? 0;
  if (candidateYear !== incumbentYear) return candidateYear > incumbentYear;

  return candidate.rankingKey < incumbent.rankingKey;
}

/**
 * 全件のスコアを計算する。
 *
 * `uniqueness` は他の項目との関係で決まるため、1 件ずつではなく集合で受け取る。
 * 出力は入力と同じ順序 (並べ替えは呼び出し側の責務)。
 */
export function computeProminenceScores(
  inputs: readonly ProminenceInput[],
  options: { readonly currentYear: number },
): ProminenceResult[] {
  const representatives = selectDedupRepresentatives(inputs);

  return inputs.map((input) => {
    const breakdown: ProminenceBreakdown = {
      depth: computeDepth(input.yearSpan),
      freshness: computeFreshness(input.latestYear, options.currentYear),
      clarity: computeClarity(input.title),
      uniqueness: representatives.has(input.rankingKey)
        ? 1
        : NON_REPRESENTATIVE_UNIQUENESS,
      demand: computeDemand(input.impressions),
    };

    const score =
      breakdown.depth * PROMINENCE_WEIGHTS.depth +
      breakdown.freshness * PROMINENCE_WEIGHTS.freshness +
      breakdown.clarity * PROMINENCE_WEIGHTS.clarity +
      breakdown.uniqueness * PROMINENCE_WEIGHTS.uniqueness +
      breakdown.demand * PROMINENCE_WEIGHTS.demand;

    return {
      rankingKey: input.rankingKey,
      categoryKey: input.categoryKey,
      title: input.title,
      score,
      ...breakdown,
    };
  });
}

/** スコア降順・同点は rankingKey 昇順の決定的な比較子。 */
export function compareByProminence(a: ProminenceResult, b: ProminenceResult): number {
  if (b.score !== a.score) return b.score - a.score;
  return a.rankingKey < b.rankingKey ? -1 : a.rankingKey > b.rankingKey ? 1 : 0;
}

/** 枠が埋まらなかったときに、制約を無視して候補順に補う。 */
function topUp(
  picked: ProminenceResult[],
  sorted: readonly ProminenceResult[],
  limit: number,
): ProminenceResult[] {
  if (picked.length >= limit) return picked;
  const pickedKeys = new Set(picked.map((r) => r.rankingKey));
  for (const result of sorted) {
    if (picked.length >= limit) break;
    if (pickedKeys.has(result.rankingKey)) continue;
    picked.push(result);
  }
  return picked;
}

/**
 * 同義タイトルの重複を**候補から外して**上位 N 件までを選ぶ。
 *
 * uniqueness の減点 (0.3) だけでは畳めない。実測では「製造品出荷額等」が
 * 同一カテゴリの代表 6 件に 3 回並んだ (完全同名グループが 184 件ある)。
 *
 * **枠が埋まらなくても非代表で補わない。** 索引の役割は「このカテゴリに何があるか」を
 * 見せることなので、`在留外国人数（韓国）/（中国）/（アジア）/（ヨーロッパ）` と並べるより、
 * ユニークな 3 件 +「全 8 件 →」の方が伝わる (実測: 国際カテゴリで発生した)。
 * 枠が固定のホーム注目とは要件が違うので、そちらだけ `selectHomeFeatured` が補う。
 */
export function selectRepresentatives(
  results: readonly ProminenceResult[],
  limit: number,
): ProminenceResult[] {
  // 畳むのは**渡された範囲の中**で行う。スコアの `uniqueness` は全カテゴリ横断で決めた
  // 代表かどうかなので、これで絞ると「別カテゴリの同名指標に代表を奪われたキー」が
  // 自カテゴリからも消える (実測: 国際カテゴリが 1 件になった)。
  const seenTitles = new Set<string>();
  const picked: ProminenceResult[] = [];
  for (const result of [...results].sort(compareByProminence)) {
    if (picked.length >= limit) break;
    const titleKey = normalizeTitleForDedup(result.title);
    if (seenTitles.has(titleKey)) continue;
    seenTitles.add(titleKey);
    picked.push(result);
  }
  return picked;
}

/**
 * ホーム注目の選定。スコア降順に取りつつ **1 カテゴリあたり上限**を設け、
 * 同義タイトルの重複も候補から外す。
 *
 * 上限が無いと、指標数の多いカテゴリ (economy = 817 件) が枠を独占する。
 * 制約で埋まらなければ、制約を無視して不足分を補う (カード枠を空けない)。
 */
export function selectHomeFeatured(
  results: readonly ProminenceResult[],
  options: { readonly limit: number; readonly maxPerCategory: number },
): ProminenceResult[] {
  const sorted = [...results].sort(compareByProminence);
  const perCategory = new Map<string, number>();
  const picked: ProminenceResult[] = [];

  for (const result of sorted) {
    if (picked.length >= options.limit) break;
    if (result.uniqueness !== 1) continue;
    const used = perCategory.get(result.categoryKey) ?? 0;
    if (used >= options.maxPerCategory) continue;
    perCategory.set(result.categoryKey, used + 1);
    picked.push(result);
  }

  return topUp(picked, sorted, options.limit);
}
