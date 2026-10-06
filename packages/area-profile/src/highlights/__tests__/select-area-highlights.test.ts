import { describe, expect, it } from "vitest";

import type { DatabookMetricValue } from "../../types/databook-snapshot";
import {
  collectHighlightCandidateKeys,
  computeMargin,
  familyKeyOf,
  highlightTone,
  listAreaHighlightCandidates,
  selectAreaHighlights,
  selectCityHighlights,
} from "../select-area-highlights";

type MetricOverrides = Partial<Omit<DatabookMetricValue, "highlight">> & {
  highlight?: Partial<NonNullable<DatabookMetricValue["highlight"]>>;
};

let seq = 0;
function metric(overrides: MetricOverrides = {}): DatabookMetricValue {
  seq += 1;
  const { highlight, ...rest } = overrides;
  return {
    value: 100,
    rank: 1,
    year: "2023年",
    unit: "人",
    nationalAvg: 50,
    ...rest,
    highlight: {
      label: `指標${seq}`,
      category: `cat${seq}`,
      source: "社会・人口統計体系",
      isKakei: false,
      margin: 1,
      prominence: 0,
      polarity: null,
      published: true,
      rankedCount: 47,
      rankDirection: "desc",
      ...highlight,
    },
  };
}

const book = (metrics: Record<string, DatabookMetricValue>) => ({ metrics });

describe("selectAreaHighlights", () => {
  it("上位は 10 位以内、下位は 38 位以下だけを候補にし、中位は入れない", () => {
    const result = listAreaHighlightCandidates(
      book({ a: metric({ rank: 10 }), b: metric({ rank: 11 }), c: metric({ rank: 37 }), d: metric({ rank: 38 }) }),
    );
    expect(result.top.map((h) => h.rankingKey)).toEqual(["a"]);
    expect(result.bottom.map((h) => h.rankingKey)).toEqual(["d"]);
  });

  it("順位の極端さ → 掲載価値 → 新しさ → 決定力の順に並べる", () => {
    const result = selectAreaHighlights(
      book({
        rank2: metric({ rank: 2, highlight: { prominence: 0.9 } }),
        lowProm: metric({ rank: 1, highlight: { prominence: 0.1 } }),
        highProm: metric({ rank: 1, highlight: { prominence: 0.5 } }),
        older: metric({ rank: 1, year: "2020年", highlight: { prominence: 0.5 } }),
        smallMargin: metric({ rank: 1, highlight: { prominence: 0.5, margin: 0.5 } }),
      }),
      { perGroup: 5 },
    );
    expect(result.top.map((h) => h.rankingKey)).toEqual(["highProm", "smallMargin", "older", "lowProm", "rank2"]);
  });

  it("分野の重複は片側ごとに禁止し、上位と下位では同じ分野を使える", () => {
    const result = selectAreaHighlights(
      book({
        t1: metric({ rank: 1, highlight: { category: "economy" } }),
        t2: metric({ rank: 2, highlight: { category: "economy" } }),
        b1: metric({ rank: 47, highlight: { category: "economy" } }),
      }),
      { perGroup: 4 },
    );
    expect(result.top.map((h) => h.rankingKey)).toEqual(["t1"]);
    expect(result.bottom.map((h) => h.rankingKey)).toEqual(["b1"]);
  });

  it("表示ラベルと家族キーの重複はカード全体で禁止する", () => {
    const result = selectAreaHighlights(
      book({
        "sandals-consumption-expenditure": metric({ rank: 1 }),
        "sandals-consumption-quantity": metric({ rank: 47 }),
        x: metric({ rank: 2, highlight: { label: "同じ" } }),
        y: metric({ rank: 46, highlight: { label: "同じ" } }),
      }),
      { perGroup: 4 },
    );
    const keys = [...result.top, ...result.bottom].map((h) => h.rankingKey);
    expect(keys).toEqual(["sandals-consumption-expenditure", "x"]);
  });

  it("古い年・非公開・部分集計・除外指標・旧版 databook は候補にしない", () => {
    const result = listAreaHighlightCandidates(
      book({
        old: metric({ rank: 1, year: "2014年度" }),
        unpublished: metric({ rank: 1, highlight: { published: false } }),
        partial: metric({ rank: 1, highlight: { rankedCount: 44 } }),
        "suicide-rate-per-100k": metric({ rank: 1 }),
        legacy: { value: 1, rank: 1, year: "2023年", unit: "人", nationalAvg: 1 },
        ok: metric({ rank: 1 }),
      }),
    );
    expect(result.top.map((h) => h.rankingKey)).toEqual(["ok"]);
  });

  it("家計調査は 1 グループ 2 件まで", () => {
    const result = selectAreaHighlights(
      book({
        k1: metric({ rank: 1, highlight: { isKakei: true } }),
        k2: metric({ rank: 2, highlight: { isKakei: true } }),
        k3: metric({ rank: 3, highlight: { isKakei: true } }),
        n: metric({ rank: 4 }),
      }),
      { perGroup: 4 },
    );
    expect(result.top.map((h) => h.rankingKey)).toEqual(["k1", "k2", "n"]);
  });

  it("件数は引数で決まり、databook が無ければ空", () => {
    const b = book({ a: metric({ rank: 1 }), c: metric({ rank: 2 }) });
    expect(selectAreaHighlights(b, { perGroup: 1 }).top).toHaveLength(1);
    expect(selectAreaHighlights(null, { perGroup: 4 })).toEqual({ top: [], bottom: [] });
  });
});

describe("highlightTone", () => {
  it("極性が確定した指標だけ色を付け、未確定・neutral は neutral", () => {
    expect(highlightTone("top", { polarity: "higher-is-better", rankDirection: "desc" })).toBe("positive");
    expect(highlightTone("bottom", { polarity: "higher-is-better", rankDirection: "desc" })).toBe("negative");
    expect(highlightTone("top", { polarity: "higher-is-worse", rankDirection: "desc" })).toBe("negative");
    expect(highlightTone("bottom", { polarity: "higher-is-worse", rankDirection: "desc" })).toBe("positive");
    // 1 位が最小値の順位付けでは向きが反転する
    expect(highlightTone("top", { polarity: "higher-is-worse", rankDirection: "asc" })).toBe("positive");
    expect(highlightTone("top", { polarity: null, rankDirection: "desc" })).toBe("neutral");
    expect(highlightTone("bottom", { polarity: "neutral", rankDirection: "desc" })).toBe("neutral");
  });
});

describe("焼き込み・市区町村の補助関数", () => {
  it("computeMargin は中央側の隣接順位と比べる", () => {
    const values = Array.from({ length: 47 }, (_, i) => ({ rank: i + 1, value: 100 - i }));
    expect(computeMargin(values, 1)).toBeCloseTo(100 / 99);
    expect(computeMargin(values, 47)).toBeCloseTo(55 / 54);
    expect(computeMargin(values, 99)).toBe(0);
  });

  it("familyKeyOf は測定量の接尾辞を剥がす", () => {
    expect(familyKeyOf("nurse-annual-income")).toBe(familyKeyOf("nurse-salary"));
  });

  it("collectHighlightCandidateKeys は単一値ブロックだけを集め、除外指標を落とす", () => {
    const keys = collectHighlightCandidateKeys({
      sections: [
        {
          blocks: [
            { blockType: "ranked-kpi-grid", metrics: [{ rankingKey: "a" }, { rankingKey: "public-assistance-x" }] },
            { blockType: "gender-paired-kpi", pairs: [{ maleKey: "m", femaleKey: "f" }] },
            { blockType: "chart" },
          ],
        },
      ],
    });
    expect(keys).toEqual(["a", "m", "f"]);
  });

  it("selectCityHighlights は県内 5 位以内を順位順に、同じ表示名を 1 件にして返す", () => {
    const item = (rankingKey: string, rank: number, indicator = rankingKey) => ({
      rankingKey, rank, indicator, year: "2020年度", value: 1, unit: "人",
    });
    const picked = selectCityHighlights([item("c", 6), item("b", 2), item("a", 1), item("a2", 3, "a")], { limit: 5 });
    expect(picked.map((p) => p.rankingKey)).toEqual(["a", "b"]);
  });

  it("selectCityHighlights は値が 0 の指標 (同率 0 で付いた上位順位) を特徴に出さない", () => {
    const item = (rankingKey: string, rank: number, value: number) => ({
      rankingKey, rank, indicator: rankingKey, year: "2020年度", value, unit: "施設",
    });
    const picked = selectCityHighlights([item("zero", 1, 0), item("real", 2, 3)], { limit: 5 });
    expect(picked.map((p) => p.rankingKey)).toEqual(["real"]);
  });
});
