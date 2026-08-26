import { describe, expect, it } from "vitest";

import type { ChartColorRole } from "../chart-color-role";
import { THEME_CATALOGS } from "../index";
import {
  parseStatSeriesRefs,
  type StatSeriesRef,
  validateChartProps,
  validateMigratedSeriesRefContract,
  validateStatSeriesRefAlignment,
} from "../stat-series-ref";
import { CATALOG_COMPONENT_TYPES } from "../types";

/**
 * WP1 — chart data 参照の型を単一定義化。
 *
 * ★2 方向を固定する:
 *   ① 現行の全 chart は種別ごとの props 検証を**通る** (validator が実データと整合)。
 *   ② 必須フィールドを 1 つ壊す / 未知種別を渡すと**必ず error** (validator が盲目でない)。
 *   さらに全 9 componentType が StatSeriesRef モデルで表せることを representative fixture で示す
 *   (WP6 の R2 参照移行の受け入れ基準)。
 */

describe("① 現行の全 chart が props 検証を通る (誤検知ゼロ)", () => {
  it("THEME_CATALOGS の全 chart が 0 error", () => {
    const failures: string[] = [];
    for (const cat of Object.values(THEME_CATALOGS)) {
      for (const ch of cat.charts) {
        const errs = validateChartProps(
          ch.componentType,
          ch.componentProps as Record<string, unknown>,
        );
        if (errs.length) failures.push(`${cat.key}/${ch.componentKey}: ${errs.join("; ")}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("検査対象は 9 componentType を網羅する (switch の exhaustive を実データで担保)", () => {
    const seen = new Set<string>();
    for (const cat of Object.values(THEME_CATALOGS)) {
      for (const ch of cat.charts) seen.add(ch.componentType);
    }
    // 実データに現れる型はすべて既知 (未知種別 error を出さない)。
    for (const t of seen) {
      expect(CATALOG_COMPONENT_TYPES).toContain(t);
    }
  });
});

describe("② 必須フィールドを壊すと error (陰性対照)", () => {
  const cases: Array<{ name: string; type: string; props: Record<string, unknown> }> = [
    { name: "line-chart: estatParams 欠落", type: "line-chart", props: { labels: ["a"] } },
    { name: "line-chart: estatParams が空配列", type: "line-chart", props: { estatParams: [] } },
    { name: "line-chart: statsDataId 欠落", type: "line-chart", props: { estatParams: [{ cdCat01: "A" }] } },
    { name: "line-chart: filter が非 string", type: "line-chart", props: { estatParams: [{ statsDataId: "X", cdCat01: 1 }] } },
    { name: "line-chart: 未知 field", type: "line-chart", props: { estatParams: [{ statsDataId: "X" }], mystery: true } },
    { name: "mixed-chart: lineParams 欠落", type: "mixed-chart", props: { columnParams: [{ statsDataId: "X" }] } },
    { name: "composition-chart: segments 欠落", type: "composition-chart", props: { statsDataId: "X" } },
    { name: "composition-chart: statsDataId 欠落", type: "composition-chart", props: { segments: [{ code: "A", label: "b" }] } },
    { name: "donut-chart: categories の color 欠落", type: "donut-chart", props: { statsDataId: "X", categories: [{ code: "A", label: "b" }] } },
    { name: "cpi-profile: statsDataId 欠落", type: "cpi-profile", props: { year: "2024" } },
    { name: "markdown-section: markdown 欠落", type: "markdown-section", props: { subtitle: "x" } },
    { name: "markdown-section: FAQ 書式不正", type: "markdown-section", props: { displayMode: "faq", markdown: "本文だけ" } },
    { name: "markdown-section: displayMode 不正", type: "markdown-section", props: { displayMode: "accordion", markdown: "本文" } },
  ];
  for (const c of cases) {
    it(`★${c.name}`, () => {
      expect(validateChartProps(c.type, c.props).length).toBeGreaterThan(0);
    });
  }

  it("★未知の componentType は skip せず error", () => {
    const errs = validateChartProps("bar-chart-race", { estatParams: [{ statsDataId: "X" }] });
    expect(errs.some((e) => e.includes("未知の componentType"))).toBe(true);
  });

  it("★StatSeriesRef の未登録 metricKey を拒否する", () => {
    expect(parseStatSeriesRefs([{ metricKey: "not-in-metrics-registry" }])).toBeNull();
  });
});

describe("② 正常系は error を出さない", () => {
  const ok: Array<{ type: string; props: Record<string, unknown> }> = [
    { type: "line-chart", props: { estatParams: [{ statsDataId: "X", cdCat01: "#A0160102" }] } },
    { type: "mixed-chart", props: { columnParams: [{ statsDataId: "X" }], lineParams: [{ statsDataId: "Y" }] } },
    { type: "composition-chart", props: { statsDataId: "X", segments: [{ code: "A", label: "b", color: "#22c55e" }] } },
    { type: "donut-chart", props: { statsDataId: "X", categories: [{ code: "A", label: "b", color: "#22c55e" }] } },
    { type: "cpi-heatmap", props: { statsDataId: "X" } },
    { type: "kpi-card", props: { estatParams: { statsDataId: "X", cdCat01: "D2101" } } },
    { type: "kpi-card", props: {} }, // ranking 駆動 kpi-card は estatParams なしでも可
    { type: "markdown-section", props: { markdown: "本文" } },
    { type: "markdown-section", props: { displayMode: "faq", markdown: "### Q1: 質問\n\n回答" } },
    { type: "pyramid-chart", props: {} },
  ];
  for (const c of ok) {
    it(`${c.type} 正常`, () => {
      expect(validateChartProps(c.type, c.props)).toEqual([]);
    });
  }
});

describe("StatSeriesRef — 全 9 型が参照モデルで表せる (WP6 移行の受け入れ基準)", () => {
  // 各 componentType が「どの StatSeriesRef 系列に対応するか」の代表 fixture。
  // 変換式・生 e-Stat コード・色コードを持たず metricKey + colorRole で表す。
  const fixture: Record<string, StatSeriesRef[]> = {
    "line-chart": [
      { metricKey: "crude-birth-rate", label: "出生率", colorRole: "series-1" },
      { metricKey: "crude-death-rate", label: "死亡率", colorRole: "danger" },
    ],
    "mixed-chart": [
      { metricKey: "manufacturing-shipment-amount", label: "出荷額", colorRole: "count" },
      { metricKey: "value-added-rate", label: "付加価値率", colorRole: "improve" },
    ],
    "composition-chart": [
      { metricKey: "young-population", label: "年少", colorRole: "improve" },
      { metricKey: "working-age-population", label: "生産年齢", colorRole: "population" },
      { metricKey: "elderly-population", label: "老年", colorRole: "count" },
    ],
    "donut-chart": [
      { metricKey: "primary-industry-workers", label: "第1次", colorRole: "improve" },
    ],
    "cpi-profile": [{ metricKey: "cpi-composite", label: "CPI" }],
    "cpi-heatmap": [{ metricKey: "cpi-composite", label: "CPI" }],
    "kpi-card": [{ metricKey: "fiscal-strength-index-prefecture", label: "財政力指数" }],
    "pyramid-chart": [{ metricKey: "total-population", area: "prefecture" }],
    "markdown-section": [], // 系列を持たない (考察テキスト)
  };

  it("9 componentType すべてに fixture がある", () => {
    for (const t of CATALOG_COMPONENT_TYPES) {
      expect(Object.keys(fixture)).toContain(t);
    }
  });

  it("StatSeriesRef は変換式フィールドを持たない (型の芯)", () => {
    const ref: StatSeriesRef = { metricKey: "x" };
    // metricKey / year / area / label / colorRole 以外のキーを持たない。
    const allowed = new Set(["metricKey", "year", "area", "label", "colorRole"]);
    expect(Object.keys(ref).every((k) => allowed.has(k))).toBe(true);
    const role: ChartColorRole = "neutral";
    expect(role).toBe("neutral");
  });
});

describe("StatSeriesRef — line-chart の R2 参照移行契約", () => {
  const refs = [
    { metricKey: "doctor-annual-income", label: "医師", colorRole: "population" },
    { metricKey: "nurse-annual-income", label: "看護師", colorRole: "improve" },
  ] satisfies StatSeriesRef[];

  it("seriesRefs だけで line-chart を表せる", () => {
    expect(validateChartProps("line-chart", { seriesRefs: refs })).toEqual([]);
  });

  it("seriesRefs と生 estatParams の二重指定を拒否する", () => {
    expect(
      validateChartProps("line-chart", {
        seriesRefs: refs,
        estatParams: [{ statsDataId: "0003445758" }],
      }),
    ).toContain("line-chart: seriesRefs と estatParams は同時指定できない");
  });

  it("seriesRefs と relatedRankingKeys の順序・件数ドリフトを拒否する", () => {
    expect(
      validateStatSeriesRefAlignment(
        { seriesRefs: refs },
        ["nurse-annual-income", "doctor-annual-income"],
        new Map([
          ["doctor-annual-income", "医師"],
          ["nurse-annual-income", "看護師"],
        ]),
      ),
    ).toEqual(expect.arrayContaining([expect.stringContaining("系列1") , expect.stringContaining("系列2")]));
  });

  it("表示ラベルがテーマ指標の shortLabel とずれたら拒否する", () => {
    const errors = validateStatSeriesRefAlignment(
      {
        seriesRefs: [
          {
            metricKey: "disposable-income-worker-households",
            label: "課税所得（勤労者世帯）",
            colorRole: "population",
          },
        ],
      },
      ["disposable-income-worker-households"],
      new Map([
        [
          "disposable-income-worker-households",
          "可処分所得（二人以上の世帯のうち勤労者世帯）",
        ],
      ]),
    );
    expect(errors).toEqual([expect.stringContaining("shortLabel")]);
  });

  it.each([
    "labor-wages-gender-gap",
    "theme-occ-medical-trend",
    "theme-economy-income-wage",
  ])("移行済み %s は生レシピへ戻せない", (componentKey) => {
    expect(
      validateMigratedSeriesRefContract(componentKey, {
        estatParams: [{ statsDataId: "0003445758" }],
      }),
    ).toEqual([expect.stringContaining("seriesRefs")]);
  });
});
