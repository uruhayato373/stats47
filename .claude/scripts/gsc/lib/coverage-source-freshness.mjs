import { isoWeekEnd, isoWeekOf } from "../../lib/effect-verdict/iso-week.mjs";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export const MAX_COVERAGE_SOURCE_AGE_WEEKS = 1;

/**
 * GSC coverage export の週と実行日から、入力の鮮度を決定的に算出する。
 * @param {{ sourceWeek: string, today: string, sourceObservedAt?: string | null, maxAgeWeeks?: number }} input
 */
export function getCoverageSourceFreshness({
  sourceWeek,
  today,
  sourceObservedAt = null,
  maxAgeWeeks = MAX_COVERAGE_SOURCE_AGE_WEEKS,
}) {
  const currentWeek = isoWeekOf(today);
  const sourceWeekEnd = isoWeekEnd(sourceWeek);
  const currentWeekEnd = isoWeekEnd(currentWeek);
  const ageWeeks = Math.round(
    (Date.parse(`${currentWeekEnd}T00:00:00Z`) - Date.parse(`${sourceWeekEnd}T00:00:00Z`)) /
      MS_PER_WEEK
  );

  if (!Number.isInteger(maxAgeWeeks) || maxAgeWeeks < 0) {
    throw new Error(`maxAgeWeeks は 0 以上の整数が必要: ${maxAgeWeeks}`);
  }

  return {
    sourceWeek,
    currentWeek,
    sourceObservedAt: sourceObservedAt ?? sourceWeekEnd,
    ageWeeks,
    maxAgeWeeks,
  };
}

/**
 * 古い入力を今日の日付で再生成し、最新に見せる事故を fail-closed で止める。
 */
export function assertFreshCoverageSource(input) {
  const freshness = getCoverageSourceFreshness(input);

  if (input.sourceObservedAt) {
    const observedWeek = isoWeekOf(input.sourceObservedAt);
    if (observedWeek !== freshness.sourceWeek) {
      throw new Error(
        `GSC coverage 入力日の週 ${observedWeek} と保存先週 ${freshness.sourceWeek} が一致しません`
      );
    }
    if (Date.parse(input.sourceObservedAt) > Date.parse(input.today)) {
      throw new Error(
        `GSC coverage 入力日 ${input.sourceObservedAt} は実行日 ${input.today} より未来です`
      );
    }
  }

  if (freshness.ageWeeks < 0) {
    throw new Error(
      `GSC coverage 入力週 ${freshness.sourceWeek} は実行週 ${freshness.currentWeek} より未来です`
    );
  }
  if (freshness.ageWeeks > freshness.maxAgeWeeks) {
    throw new Error(
      `GSC coverage 入力週 ${freshness.sourceWeek} は ${freshness.ageWeeks} 週古いです` +
        `（許容 ${freshness.maxAgeWeeks} 週）。最新の GSC「ページ」export を取り込んでください`
    );
  }

  return freshness;
}
