
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { formatValueWithPrecision } from "@stats47/utils";

import { formatRankingValue } from "../../utils/compute-ranking-header-stats";

import { summarizeSampleCounts } from "./ranking-sample-count";

import type { RankingReferenceValue, RankingValue, RankingValueDisplay } from "@stats47/ranking";

const PEOPLE_PRECISION = 0;

interface RankingSampleCountNoteProps {
  rankingValues: readonly RankingValue[];
  referenceValues: readonly RankingReferenceValue[];
  yearCode: string;
  yearName: string | null;
  unit: string;
  valueDisplay?: RankingValueDisplay | null;
}

/**
 * 標本から推計した人数と、推計の人数が少なく順位から外した県 (参考値) を地図・表の下に示す。
 * 推計の人数を持たない指標では何も描かない。
 */
export function RankingSampleCountNote({
  rankingValues,
  referenceValues,
  yearCode,
  yearName,
  unit,
  valueDisplay,
}: RankingSampleCountNoteProps) {
  // 推計の人数は整数の人数なので小数を出さない
  const people = (count: number) => `${formatValueWithPrecision(count, PEOPLE_PRECISION)}人`;
  const summary = summarizeSampleCounts(rankingValues, referenceValues, yearCode);
  if (!summary) return null;
  const valueUnit = formatUnitForDisplay(valueDisplay?.unit ?? unit);
  const format = (value: number | null) =>
    value === null ? "-" : `${formatRankingValue(value, valueDisplay?.precision ?? 1, valueDisplay?.factor)}${valueUnit}`;

  return (
    <section aria-label="推計の労働者数" className="space-y-1 leading-relaxed">
      {summary.total !== null && (
        <p>
          推計の労働者数{yearName ? ` (${yearName})` : ""}: {summary.areaCount}都道府県の合計 {people(summary.total)}
          {summary.smallest
            ? `、順位を付けた県で最も少ないのは${summary.smallest.areaName} (${people(summary.smallest.sampleCount)})`
            : ""}
          。
        </p>
      )}
      {summary.references.length > 0 && (
        <p>
          推計の人数が少ないため順位から外した県 (参考値):{" "}
          {summary.references
            .map((v) => `${v.areaName} ${format(v.value)} (推計${people(v.sampleCount)})`)
            .join("、")}
        </p>
      )}
    </section>
  );
}
