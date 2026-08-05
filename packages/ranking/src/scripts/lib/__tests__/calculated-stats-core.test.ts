import { describe, expect, it } from "vitest";

import type { MetricConfig } from "@stats47/data-configs";
import type { SingleEntityRow } from "@stats47/stats-r2";

import {
  CalculatedStatsError,
  buildCalculatedPayload,
  deriveCalculatedRows,
  expectedCalculatedYears,
  inYearRange,
} from "../calculated-stats-core";

function config(overrides: Partial<MetricConfig> = {}): MetricConfig {
  return {
    key: "test-calc",
    title: "テスト計算指標",
    unit: "円",
    category: "economy",
    source: { kind: "external", fetcherKey: "calculated", config: {} },
    entities: ["prefecture"],
    years: { from: 2007, to: 2024 },
    ...overrides,
  };
}

function row(
  areaCode: string,
  yearCode: string,
  value: number | null,
  areaName = `area-${areaCode}`,
): SingleEntityRow {
  return { areaCode, areaName, yearCode, yearName: `${yearCode}年度`, value, unit: "円" };
}

describe("expectedCalculatedYears — generator と監査が共有する年の定義", () => {
  it("分子・分母の積集合を config.years で切る", () => {
    expect(
      expectedCalculatedYears(
        config({ years: { from: 2013, to: 2024 } }),
        ["2010", "2013", "2020", "2024", "2025"],
        ["2013", "2020", "2024", "2025"],
      ),
    ).toEqual(["2013", "2020", "2024"]);
  });

  it("片側にしか無い年は落ちる (2010 は分母が無い)", () => {
    expect(expectedCalculatedYears(config(), ["2010", "2011"], ["2011"])).toEqual(["2011"]);
  });

  it("重複入力でも一意・昇順", () => {
    expect(expectedCalculatedYears(config(), ["2011", "2011", "2010"], ["2010", "2011"])).toEqual([
      "2010",
      "2011",
    ]);
  });
});

describe("inYearRange", () => {
  it("from/to の内外を判定する", () => {
    const c = config({ years: { from: 2007, to: 2024 } });
    expect(inYearRange("2007", c)).toBe(true);
    expect(inYearRange("2024", c)).toBe(true);
    expect(inYearRange("2006", c)).toBe(false);
    expect(inYearRange("2025", c)).toBe(false);
  });

  it("years:'all' は全通し・数値でない年は落とす", () => {
    expect(inYearRange("1975", config({ years: "all" }))).toBe(true);
    expect(inYearRange("abcd", config({ years: "all" }))).toBe(false);
  });

  it("列挙形式にも対応する", () => {
    expect(inYearRange("2020", config({ years: { years: [2018, 2020] } }))).toBe(true);
    expect(inYearRange("2019", config({ years: { years: [2018, 2020] } }))).toBe(false);
  });
});

describe("deriveCalculatedRows — subtraction の期間換算", () => {
  const subtractionConfig = config({
    display: { decimalPlaces: 0 },
    calculation: {
      isCalculated: true,
      type: "subtraction",
      numeratorKey: "income",
      denominatorKey: "rent",
      periodAlign: { numerator: "monthly", denominator: "annual", result: "monthly" },
    },
  });

  // 実データ: 東京 2024 の可処分所得 637,958 円/月 と 民営家賃 175,694 円/年
  const numerator = [row("13000", "2024", 637958), row("06000", "2024", 545206 + 21311 / 12)];
  const denominator = [row("13000", "2024", 175694), row("06000", "2024", 21311)];

  it("★年額の分母を 1/12 にしてから引く", () => {
    const rows = deriveCalculatedRows({
      config: subtractionConfig,
      numeratorRows: numerator,
      denominatorRows: denominator,
    });
    const tokyo = rows.find((r) => r.areaCode === "13000");
    // 637,958 − 175,694/12 = 623,316.8… → 桁 0 で四捨五入
    expect(tokyo?.value).toBe(623317);
  });

  it("★換算が無いと 12 倍過大になる (この差が本件の欠陥そのもの)", () => {
    const withoutAlign = deriveCalculatedRows({
      config: config({
        display: { decimalPlaces: 0 },
        calculation: {
          isCalculated: true,
          type: "subtraction",
          numeratorKey: "income",
          denominatorKey: "rent",
        },
      }),
      numeratorRows: numerator,
      denominatorRows: denominator,
    });
    expect(withoutAlign.find((r) => r.areaCode === "13000")?.value).toBe(462264);
  });

  it("★期間換算の結果、順位が入れ替わる (東京が 1 位)", () => {
    const rows = deriveCalculatedRows({
      config: subtractionConfig,
      numeratorRows: numerator,
      denominatorRows: denominator,
    });
    expect(rows.find((r) => r.rank === 1)?.areaCode).toBe("13000");
  });

  it("月額の分子・年額の結果なら分子を 12 倍する", () => {
    const rows = deriveCalculatedRows({
      config: config({
        display: { decimalPlaces: 0 },
        calculation: {
          isCalculated: true,
          type: "subtraction",
          numeratorKey: "income",
          denominatorKey: "rent",
          periodAlign: { numerator: "monthly", denominator: "annual", result: "annual" },
        },
      }),
      numeratorRows: [row("13000", "2024", 637958)],
      denominatorRows: [row("13000", "2024", 175694)],
    });
    expect(rows[0].value).toBe(637958 * 12 - 175694);
  });
});

describe("deriveCalculatedRows — ratio と scaleFactor", () => {
  const ratioConfig = config({
    unit: "％",
    display: { decimalPlaces: 1 },
    calculation: {
      isCalculated: true,
      type: "ratio",
      numeratorKey: "food",
      denominatorKey: "total",
      scaleFactor: 100,
    },
  });

  it("★scaleFactor 100 で百分率になり、桁 1 で丸める (engel 実測 24.1 の再現)", () => {
    const rows = deriveCalculatedRows({
      config: ratioConfig,
      numeratorRows: [row("01000", "2007", 869_000)],
      denominatorRows: [row("01000", "2007", 3_605_000)],
    });
    // 869000 / 3605000 = 0.24105… → ×100 → 24.105… → 24.1
    expect(rows[0].value).toBe(24.1);
    expect(rows[0].unit).toBe("％");
  });

  it("scaleFactor 無しなら比のまま (既定 1・既存 metric の挙動を変えない)", () => {
    const rows = deriveCalculatedRows({
      config: config({
        display: { decimalPlaces: 4 },
        calculation: { isCalculated: true, type: "ratio", numeratorKey: "a", denominatorKey: "b" },
      }),
      numeratorRows: [row("01000", "2007", 1)],
      denominatorRows: [row("01000", "2007", 4)],
    });
    expect(rows[0].value).toBe(0.25);
  });

  it("分母 0 の行は落とす (ゼロ除算を書かない)", () => {
    const rows = deriveCalculatedRows({
      config: ratioConfig,
      numeratorRows: [row("01000", "2007", 100), row("02000", "2007", 100)],
      denominatorRows: [row("01000", "2007", 0), row("02000", "2007", 200)],
    });
    expect(rows.map((r) => r.areaCode)).toEqual(["02000"]);
  });
});

describe("deriveCalculatedRows — 行の契約 (page-data-batch と同一)", () => {
  const c = config({
    display: { decimalPlaces: 0 },
    calculation: {
      isCalculated: true,
      type: "subtraction",
      numeratorKey: "a",
      denominatorKey: "b",
    },
  });

  it("同値は同順位・次は繰り下がる (競争順位)", () => {
    const rows = deriveCalculatedRows({
      config: c,
      numeratorRows: [row("01000", "2024", 30), row("02000", "2024", 30), row("03000", "2024", 10)],
      denominatorRows: [row("01000", "2024", 0), row("02000", "2024", 0), row("03000", "2024", 0)],
    });
    const byArea = Object.fromEntries(rows.map((r) => [r.areaCode, r.rank]));
    expect(byArea).toEqual({ "01000": 1, "02000": 1, "03000": 3 });
  });

  it("rank は年ごとに独立して付く", () => {
    const rows = deriveCalculatedRows({
      config: c,
      numeratorRows: [row("01000", "2023", 10), row("01000", "2024", 5)],
      denominatorRows: [row("01000", "2023", 0), row("01000", "2024", 0)],
    });
    expect(rows.every((r) => r.rank === 1)).toBe(true);
  });

  it("★全国行 (00000) は分子・分母どちらから来ても除外する", () => {
    const rows = deriveCalculatedRows({
      config: c,
      numeratorRows: [row("00000", "2024", 999), row("01000", "2024", 10)],
      denominatorRows: [row("00000", "2024", 1), row("01000", "2024", 1)],
    });
    expect(rows.map((r) => r.areaCode)).toEqual(["01000"]);
  });

  it("行は yearCode 昇順 → areaCode 昇順で並ぶ", () => {
    const rows = deriveCalculatedRows({
      config: c,
      numeratorRows: [row("02000", "2024", 1), row("01000", "2024", 2), row("02000", "2023", 3)],
      denominatorRows: [row("02000", "2024", 0), row("01000", "2024", 0), row("02000", "2023", 0)],
    });
    expect(rows.map((r) => `${r.yearCode}/${r.areaCode}`)).toEqual([
      "2023/02000",
      "2024/01000",
      "2024/02000",
    ]);
  });

  it("片側に行が無い年・null 値は落とす", () => {
    const rows = deriveCalculatedRows({
      config: c,
      numeratorRows: [row("01000", "2024", 10), row("01000", "2023", 10), row("02000", "2024", null)],
      denominatorRows: [row("01000", "2024", 1)],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].yearCode).toBe("2024");
  });

  it("config.years の外は落とす", () => {
    const rows = deriveCalculatedRows({
      config: config({
        years: { from: 2024, to: 2024 },
        display: { decimalPlaces: 0 },
        calculation: { isCalculated: true, type: "subtraction", numeratorKey: "a", denominatorKey: "b" },
      }),
      numeratorRows: [row("01000", "2023", 10), row("01000", "2024", 10)],
      denominatorRows: [row("01000", "2023", 1), row("01000", "2024", 1)],
    });
    expect(rows.map((r) => r.yearCode)).toEqual(["2024"]);
  });

  it("areaName / yearName は分子行から引き継ぐ", () => {
    const rows = deriveCalculatedRows({
      config: c,
      numeratorRows: [row("13000", "2024", 10, "東京都")],
      denominatorRows: [row("13000", "2024", 1, "東京都(分母側)")],
    });
    expect(rows[0]).toMatchObject({ areaName: "東京都", yearName: "2024年度", unit: "円" });
  });
});

describe("deriveCalculatedRows — fail-closed (書かせない条件)", () => {
  const c = config({
    calculation: { isCalculated: true, type: "subtraction", numeratorKey: "a", denominatorKey: "b" },
  });

  it("★計算できた行が 0 なら throw (空で R2 を上書きしない)", () => {
    expect(() =>
      deriveCalculatedRows({ config: c, numeratorRows: [row("01000", "2024", 1)], denominatorRows: [] }),
    ).toThrow(CalculatedStatsError);
  });

  it("★有限数にならない値は throw (読み側が throw する前に止める)", () => {
    expect(() =>
      deriveCalculatedRows({
        config: config({
          calculation: { isCalculated: true, type: "subtraction", numeratorKey: "a", denominatorKey: "b" },
        }),
        numeratorRows: [row("01000", "2024", Number.POSITIVE_INFINITY)],
        denominatorRows: [row("01000", "2024", 1)],
      }),
    ).toThrow(CalculatedStatsError);
  });

  it("isCalculated でない / type が未知なら throw", () => {
    expect(() =>
      deriveCalculatedRows({
        config: config({ calculation: { isCalculated: false } }),
        numeratorRows: [row("01000", "2024", 1)],
        denominatorRows: [row("01000", "2024", 1)],
      }),
    ).toThrow(CalculatedStatsError);
    expect(() =>
      deriveCalculatedRows({
        config: config({ calculation: { isCalculated: true, type: "nope", numeratorKey: "a" } }),
        numeratorRows: [row("01000", "2024", 1)],
        denominatorRows: [row("01000", "2024", 1)],
      }),
    ).toThrow(CalculatedStatsError);
  });
});

describe("buildCalculatedPayload", () => {
  it("meta を行から導出する", () => {
    const rows = [row("01000", "2007", 1), row("02000", "2007", 2), row("01000", "2024", 3)];
    const payload = buildCalculatedPayload(
      config(),
      rows,
      { kind: "external", derived: true, configHash: "abc123" },
      "2026-08-05T00:00:00.000Z",
    );
    expect(payload.meta).toEqual({
      rowCount: 3,
      yearRange: ["2007", "2024"],
      areaCount: 2,
      generatedAt: "2026-08-05T00:00:00.000Z",
      recipe: { kind: "external", derived: true, configHash: "abc123" },
    });
    expect(payload.entityKind).toBe("prefecture");
  });
});
