import { PREFECTURE_AREA_CODES } from "@stats47/area";
import { describe, expect, it } from "vitest";

import {
  packIndicatorDataMap,
  packRankingValues,
  unpackIndicatorDataMap,
  unpackRankingValues,
} from "../indicator-transport";

import type { ThemeIndicatorData } from "../../types";
import type { RankingValue } from "@stats47/ranking";

const row = (i: number, overrides: Partial<RankingValue> = {}): RankingValue =>
  ({
    metricKey: "dining-out-consumption-expenditure",
    areaType: "prefecture",
    areaCode: PREFECTURE_AREA_CODES[i],
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
    const values = PREFECTURE_AREA_CODES.map((_, i) => row(i));
    expect(unpackRankingValues(packRankingValues(values))).toEqual(values);
  });

  it("全行で同じ項目だけを 1 回にまとめ、行ごとに違う項目は行に残す", () => {
    const values = PREFECTURE_AREA_CODES.map((_, i) => row(i));
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

  describe("availableYears の二重 (PERF-THEME-HTML-SIZE-01)", () => {
    const years = Array.from({ length: 12 }, (_, i) => ({ yearCode: String(2024 - i), yearName: `${2024 - i}年` }));
    const indicator = (n: number, overrides: Partial<ThemeIndicatorData> = {}): ThemeIndicatorData => ({
      rankingItem: {
        rankingKey: `metric-${n}`,
        title: `指標${n}`,
        latestYear: years[0],
        availableYears: years,
      } as unknown as ThemeIndicatorData["rankingItem"],
      rankingValues: PREFECTURE_AREA_CODES.map((_, i) => row(i, { metricKey: `metric-${n}` })),
      availableYears: years,
      ...overrides,
    });
    // 代表テーマ = 指標 40 件 (household-food-spending は 189 件)
    const theme = Object.fromEntries(Array.from({ length: 40 }, (_, n) => [`metric-${n}`, indicator(n)]));

    it("同じ年度の一覧を 2 回持たず、戻すと元と同じになる", () => {
      const packed = packIndicatorDataMap(theme);
      expect(packed["metric-0"].rankingItem).not.toHaveProperty("availableYears");
      expect(packed["metric-0"].availableYears).toEqual(years);
      expect(unpackIndicatorDataMap(packed)).toEqual(theme);
    });

    it("転送データの JSON の長さが、二重だった分だけ減る", () => {
      // 年度の一覧以外は同じにするため、値の行は詰めた形のまま、年度だけを 2 回持つ形を基準にする
      const before = JSON.stringify(
        Object.fromEntries(
          Object.entries(theme).map(([k, d]) => [k, { ...d, rankingValues: packRankingValues(d.rankingValues) }]),
        ),
      ).length;
      const after = JSON.stringify(packIndicatorDataMap(theme)).length;
      const saved = before - after;
      console.info(`[PERF-THEME-HTML-SIZE-01] 転送 JSON ${before} → ${after} 文字 (-${saved})`);
      // 戻すための印 (約 30 文字 / 指標) を差し引いても、二重だった年度の一覧のほぼ全部が減る
      expect(saved).toBeGreaterThan((JSON.stringify(years).length - 50) * Object.keys(theme).length);
    });

    it("中身が違うとき・片方が無いときは落とさず、そのまま持つ", () => {
      const differing = indicator(0, { availableYears: years.slice(0, 3) });
      const noItemYears = indicator(1, {
        rankingItem: { rankingKey: "metric-1", title: "指標1" } as unknown as ThemeIndicatorData["rankingItem"],
      });
      const noYears = indicator(2, { availableYears: undefined });
      const map = { a: differing, b: noItemYears, c: noYears };
      const packed = packIndicatorDataMap(map);
      expect(packed.a.rankingItem).toHaveProperty("availableYears");
      expect(unpackIndicatorDataMap(packed)).toEqual(map);
    });
  });
});
