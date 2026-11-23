import { describe, expect, it } from "vitest";

import { packRankingValues, unpackRankingValues } from "../indicator-transport";

import type { RankingValue } from "@stats47/ranking";

const row = (i: number, overrides: Partial<RankingValue> = {}): RankingValue =>
  ({
    metricKey: "dining-out-consumption-expenditure",
    areaType: "prefecture",
    areaCode: `${String(i + 1).padStart(2, "0")}000`,
    areaName: `県${i + 1}`,
    yearCode: "2025",
    yearName: "2025年",
    value: 1000 - i,
    unit: "円",
    rank: i + 1,
    ...overrides,
  }) as RankingValue;

describe("indicator-transport (テーマのページがブラウザへ渡す値の行)", () => {
  it("詰めて戻すと元の行と同じになる", () => {
    const values = Array.from({ length: 47 }, (_, i) => row(i));
    expect(unpackRankingValues(packRankingValues(values))).toEqual(values);
  });

  it("全行で同じ項目だけを 1 回にまとめ、行ごとに違う項目は行に残す", () => {
    const values = Array.from({ length: 47 }, (_, i) => row(i));
    const packed = packRankingValues(values);
    expect(packed.shared).toEqual({
      metricKey: "dining-out-consumption-expenditure",
      areaType: "prefecture",
      yearCode: "2025",
      yearName: "2025年",
      unit: "円",
    });
    expect(Object.keys(packed.rows[0]).sort()).toEqual(["areaCode", "areaName", "rank", "value"]);
    // 2026-11-23 の本番では値の行が HTML の 1.5MB を占めていた。まとめた分だけ小さくなる
    expect(JSON.stringify(packed).length).toBeLessThan(JSON.stringify(values).length * 0.6);
  });

  it("1 行だけ違う値・欠けた項目・null は落とさない", () => {
    const values = [
      row(0),
      row(1, { yearCode: "2024", yearName: "2024年" }),
      row(2, { rank: null as unknown as number }),
    ];
    const { unit: _unit, ...withoutUnit } = row(3);
    values.push(withoutUnit as RankingValue);
    const packed = packRankingValues(values);
    expect(packed.shared.yearCode).toBeUndefined();
    expect(packed.shared.unit).toBeUndefined();
    expect(unpackRankingValues(packed)).toEqual(values);
  });

  it("空と 1 行の指標もそのまま戻る", () => {
    expect(unpackRankingValues(packRankingValues([]))).toEqual([]);
    expect(unpackRankingValues(packRankingValues([row(0)]))).toEqual([row(0)]);
  });
});
