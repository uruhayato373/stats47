import { PREFECTURE_LIST_2DIGIT } from "@stats47/area";
import { describe, expect, it } from "vitest";

import { getPrefectureStatisticsEntry, PREFECTURE_STATISTICS_CATALOG } from "..";

describe("県の統計ポータルの台帳 (open-data.prefecture-statistics) と読み込み口", () => {
  it("47県を県コード順に出し、県名は県のマスタで結ぶ", () => {
    expect(PREFECTURE_STATISTICS_CATALOG.map((entry) => entry.prefectureCode)).toEqual(
      PREFECTURE_LIST_2DIGIT.map((prefecture) => prefecture.code),
    );
    for (const prefecture of PREFECTURE_LIST_2DIGIT) {
      expect(getPrefectureStatisticsEntry(prefecture.code)?.prefectureName).toBe(prefecture.name);
    }
  });

  it("各県に statistics-portal を1件持ち、IDは県コードで始まる", () => {
    for (const entry of PREFECTURE_STATISTICS_CATALOG) {
      expect(entry.resources, entry.prefectureCode).toHaveLength(1);
      expect(entry.resources[0].id).toBe(`${entry.prefectureCode}-statistics-portal`);
      expect(entry.resources[0].type).toBe("statistics-portal");
    }
    expect(getPrefectureStatisticsEntry("99")).toBeUndefined();
  });
});
