import { describe, expect, it } from "vitest";

import { buildRankingSummary } from "../build-ranking-summary";

import type { RankingValue } from "@stats47/ranking";

/**
 * テスト用ヘルパー: RankingValue を作成
 */
function makeRankingValue(
  areaCode: string,
  areaName: string,
  value: number,
  rank: number,
): RankingValue {
  return {
    metricKey: "A01",
    areaCode,
    areaName,
    yearCode: "2023",
    yearName: "2023年",
    value,
    rank,
    unit: "人",
  };
}

const sampleData: RankingValue[] = [
  makeRankingValue("00000", "全国", 125000, 0),
  makeRankingValue("13", "東京都", 14000, 1),
  makeRankingValue("14", "神奈川県", 9200, 2),
  makeRankingValue("27", "大阪府", 8800, 3),
  makeRankingValue("23", "愛知県", 7500, 4),
];

describe("buildRankingSummary", () => {
  it("上位3都道府県の名前をカンマ区切りで返す", () => {
    const result = buildRankingSummary(sampleData, "万人");

    expect(result).not.toBeNull();
    expect(result!.top1Name).toBe("東京都");
    expect(result!.top3Names).toBe("東京都、神奈川県、大阪府");
  });

  it("1位の値と単位を結合したテキストを返す", () => {
    const result = buildRankingSummary(sampleData, "万人");

    expect(result).not.toBeNull();
    expect(result!.top1ValueText).toBe("14000万人");
  });

  it("公表の全国値 (00000) があれば単純平均ではなく「全国値」を出す", () => {
    const result = buildRankingSummary(sampleData, "万人");

    expect(result).not.toBeNull();
    // 4 県の合計 39,500 と一致しないので総数ではなく全国値として扱う
    expect(result!.avgText).toBe("全国値125000万人");
  });

  it("全国値が無ければ県だけの単純平均を母数付きで出す (「全国平均」と呼ばない)", () => {
    const result = buildRankingSummary(
      sampleData.filter((v) => v.areaCode !== "00000"),
      "万人",
    );

    // (14000+9200+8800+7500)/4 = 9875
    expect(result!.avgText).toBe("4都道府県の単純平均9875万人");
    expect(result!.avgText).not.toContain("全国平均");
  });

  it("空配列の場合は null を返す", () => {
    const result = buildRankingSummary([], "万人");

    expect(result).toBeNull();
  });
});
