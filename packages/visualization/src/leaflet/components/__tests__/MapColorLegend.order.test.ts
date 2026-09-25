/**
 * 地図の凡例の色の向き (2026-09-25)。
 *
 * 凡例は左端に最小値のラベルを付ける。色は data の配列順で取っていたため、
 * ランキング順 (1 位 = 最大値が先頭) のデータでは左端に最大値の色が来て、
 * 地図は「濃い = 大きい」なのに凡例は「濃い = 小さい」と読ませていた。
 */
import { describe, expect, it } from "vitest";

import { sortByValueAscending } from "../MapColorLegend";

describe("sortByValueAscending", () => {
  it("ランキング順 (降順) のデータを値の小さい順に並べ直す", () => {
    const ranked = [
      { areaCode: "47000", value: 41 },
      { areaCode: "46000", value: 30 },
      { areaCode: "13000", value: 19 },
    ];
    expect(sortByValueAscending(ranked).map((d) => d.areaCode)).toEqual(["13000", "46000", "47000"]);
  });

  it("値の無い県は凡例の色の候補から外す", () => {
    const data = [
      { areaCode: "01000", value: 5 },
      { areaCode: "02000", value: Number.NaN },
      { areaCode: "03000", value: 1 },
    ];
    expect(sortByValueAscending(data).map((d) => d.areaCode)).toEqual(["03000", "01000"]);
  });

  it("元の配列を並べ替えない (地図の描画側が同じ配列を使う)", () => {
    const data = [
      { areaCode: "a", value: 2 },
      { areaCode: "b", value: 1 },
    ];
    sortByValueAscending(data);
    expect(data.map((d) => d.areaCode)).toEqual(["a", "b"]);
  });
});
