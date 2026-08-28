import { describe, expect, it, vi } from "vitest";

import * as registry from "../../registry";

import {
  buildThemeDependencyMirror,
  collectChartDependencies,
  collectThemeDataDependencies,
  collectThemeDataDependenciesWithProvenance,
  requestKey,
} from "../chart-dependencies";
import { THEME_CATALOGS } from "../index";
import {
  buildPopulationPyramidSeriesRefs,
  enumeratePyramidCategoryCodes,
} from "../population-pyramid-deps";
import type { CatalogChart } from "../types";
import migrationContract from "./fixtures/series-ref-migration-contract.json";

/**
 * WP4 — 依存抽出の共通 collector。
 *
 * ★狙い (WP0 で先送りした donut/CPI/pyramid の陰性対照をここで実装):
 *   ① 全 catalog の期待依存集合が機械列挙できる (pyramid 34/chart や composition/donut 展開も含む)。
 *   ② componentType の switch は exhaustive。未知種別は throw (取りこぼしを緑にしない)。
 *   ③ donut の category / composition の segment / CPI の statsDataId / pyramid の code を
 *      1 つ落とすと request 数が減る (監査が中身を見ている証明)。
 */

function chart(componentType: string, componentProps: Record<string, unknown>): CatalogChart {
  return {
    componentKey: "k",
    componentType: componentType as CatalogChart["componentType"],
    title: "t",
    componentProps,
    sortOrder: 0,
  };
}

const live = collectThemeDataDependencies(Object.values(THEME_CATALOGS));

describe("① 期待依存集合が完全に列挙できる (baseline lock)", () => {
  it("総 request / distinct request を固定 (移行で動いたら更新)", () => {
    expect(live.totalRequests).toBe(0);
    expect(live.distinctRequests).toEqual([]);
    expect(live.totalMetricRefs).toBe(267);
    expect(live.distinctMetricKeys).toHaveLength(192);
  });

  it("R2へ移行済みの系列も metricKey 依存として列挙する", () => {
    const preexisting = [
      "care-worker-annual-income",
      "current-balance-ratio",
      "disposable-income-worker-households",
      "doctor-annual-income",
      "gender-wage-gap",
      "minimum-wage-by-region",
      "nurse-annual-income",
    ];
    const expected = [
      ...new Set([...preexisting, ...migrationContract.flatMap((row) => row.metricKeys)]),
    ].sort();
    expect(live.totalMetricRefs).toBe(267);
    for (const key of expected) expect(live.distinctMetricKeys).toContain(key);
    expect(
      live.perChart.find((chart) => chart.componentKey === "theme-occ-medical-trend")
        ?.metricRefs,
    ).toHaveLength(3);
    expect(
      live.perChart.find((chart) => chart.componentKey === "kpi-lf-current-balance")
        ?.metricRefs,
    ).toEqual([{ metricKey: "current-balance-ratio" }]);
  });

  it("pyramid は34の型付きR2 metric/chartを列挙する", () => {
    const pyr = live.perChart.filter((p) => p.componentType === "pyramid-chart");
    expect(pyr.length).toBeGreaterThan(0);
    for (const p of pyr) {
      expect(p.requests).toEqual([]);
      expect(p.metricRefs).toHaveLength(34);
    }
  });
});

describe("② exhaustive switch — 未知種別は throw", () => {
  it("未知の componentType は skip せず throw", () => {
    expect(() =>
      collectChartDependencies(chart("bar-chart-race", { estatParams: [{ statsDataId: "X" }] })),
    ).toThrow(/未知の componentType/);
  });
});

describe("③ 陰性対照 — 依存を 1 つ落とすと request が減る", () => {
  it("line/kpi の estatParams を文字列 filter だけに正規化し、不正な request は除外する", () => {
    const line = collectChartDependencies(
      chart("line-chart", {
        estatParams: [
          { statsDataId: "S2", cdTab: "2", ignoredNumber: 1 },
          { statsDataId: "S1", cdCat01: "A" },
          { statsDataId: "", cdCat01: "skip" },
          { cdCat01: "skip" },
          null,
        ],
      }),
    );
    const kpi = collectChartDependencies(
      chart("kpi-card", { estatParams: { statsDataId: "K", cdCat01: "C" } }),
    );
    expect(line.requests).toEqual([
      { statsDataId: "S2", filters: { cdTab: "2" } },
      { statsDataId: "S1", filters: { cdCat01: "A" } },
    ]);
    expect(kpi.requests).toEqual([
      { statsDataId: "K", filters: { cdCat01: "C" } },
    ]);
  });

  it("donut: category を 1 つ落とすと request が 1 減る", () => {
    const three = collectChartDependencies(
      chart("donut-chart", {
        statsDataId: "S",
        categories: [
          { code: "A", label: "a", color: "#111" },
          { code: "B", label: "b", color: "#222" },
          { code: "C", label: "c", color: "#333" },
        ],
      }),
    );
    const two = collectChartDependencies(
      chart("donut-chart", {
        statsDataId: "S",
        categories: [
          { code: "A", label: "a", color: "#111" },
          { code: "B", label: "b", color: "#222" },
        ],
      }),
    );
    expect(three.requests.length).toBe(3);
    expect(two.requests.length).toBe(2);
  });

  it("composition: segment + totalCode を展開する", () => {
    const dep = collectChartDependencies(
      chart("composition-chart", {
        statsDataId: "S",
        segments: [
          { code: "A", label: "a" },
          { code: "B", label: "b" },
        ],
        totalCode: "T",
      }),
    );
    expect(dep.requests.map((r) => r.filters.cdCat01).sort()).toEqual(["A", "B", "T"]);
  });

  it("CPI typed refs は全metricを列挙し、生requestを残さない", () => {
    const dep = collectChartDependencies(
      chart("cpi-profile", {
        seriesRefs: [
          { metricKey: "consumer-price-difference-index-food" },
          { metricKey: "consumer-price-difference-index-housing" },
        ],
      }),
    );
    expect(dep.metricRefs.map((ref) => ref.metricKey)).toEqual([
      "consumer-price-difference-index-food",
      "consumer-price-difference-index-housing",
    ]);
    expect(dep.requests).toEqual([]);
  });

  it("CPI: statsDataId を落とすと request が 0 になる (top-level param の陰性対照)", () => {
    expect(collectChartDependencies(chart("cpi-profile", { statsDataId: "S" })).requests.length).toBe(1);
    expect(collectChartDependencies(chart("cpi-profile", { year: "2024" })).requests.length).toBe(0);
  });

  it("pyramid: SSOT の系列を1つ落とすとmetric依存も1つ減る", () => {
    const refs = buildPopulationPyramidSeriesRefs();
    const full = collectChartDependencies(chart("pyramid-chart", { seriesRefs: refs }));
    const missing = collectChartDependencies(
      chart("pyramid-chart", { seriesRefs: refs.slice(1) }),
    );
    expect(full.metricRefs).toHaveLength(enumeratePyramidCategoryCodes().length);
    expect(missing.metricRefs).toHaveLength(full.metricRefs.length - 1);
  });

  it("markdown-section は依存 0", () => {
    expect(collectChartDependencies(chart("markdown-section", { markdown: "x" })).requests.length).toBe(0);
  });
});

describe("④ provenance 付き collector — 監査母集団の単一ソース (WP4 residual)", () => {
  const prov = collectThemeDataDependenciesWithProvenance(THEME_CATALOGS);

  it("distinct 件数と total が set-only collector と一致 (二重実装しない)", () => {
    expect(prov.totalRequests).toBe(live.totalRequests);
    expect(prov.distinct.map((d) => d.key)).toEqual(live.distinctRequests);
  });

  it("各 distinct request に実在する themeKey が付く (監査で失敗箇所を報告できる)", () => {
    const themes = Object.keys(THEME_CATALOGS);
    for (const d of prov.distinct) {
      expect(themes).toContain(d.themeKey);
    }
  });

  it("pyramid の34 R2 metricがprovenance付きで含まれる", () => {
    const pyr = prov.distinctMetricRefs.filter((d) => d.componentType === "pyramid-chart");
    expect(pyr.length).toBe(34);
    for (const d of pyr) expect(d.metricKey).toMatch(/^theme-population-pyramid-/);
  });

  it("生 request も重複排除し、key 昇順で最初の由来を保持する", () => {
    const fixture = {
      z: {
        charts: [chart("line-chart", {
          estatParams: [
            { statsDataId: "S2", cdCat01: "B" },
            { statsDataId: "S1", cdCat01: "A" },
          ],
        })],
      },
      a: {
        charts: [chart("line-chart", {
          estatParams: [
            { statsDataId: "S1", cdCat01: "A" },
            { statsDataId: "S3", cdCat01: "C" },
          ],
        })],
      },
    };
    const setOnly = collectThemeDataDependencies(Object.values(fixture));
    const withProvenance = collectThemeDataDependenciesWithProvenance(fixture);
    expect(setOnly.totalRequests).toBe(4);
    expect(setOnly.distinctRequests).toEqual(["S1?cdCat01=A", "S2?cdCat01=B", "S3?cdCat01=C"]);
    expect(withProvenance.totalRequests).toBe(4);
    expect(withProvenance.distinct.map((row) => row.key)).toEqual(setOnly.distinctRequests);
    expect(withProvenance.distinct[0]?.themeKey).toBe("z");
  });
});

describe("⑤ 依存ミラー — 決定的・正典と byte 一致する形 (audit が読む鏡)", () => {
  it("buildThemeDependencyMirror は distinct を key 昇順で並べ件数を一致させる", () => {
    const mirror = buildThemeDependencyMirror(THEME_CATALOGS);
    expect(mirror.totalRequests).toBe(0);
    expect(mirror.distinctRequests).toBe(0);
    expect(mirror.requests).toEqual([]);
    expect(mirror.totalMetricRefs).toBe(267);
    expect(mirror.distinctMetricRefs).toBe(192);
    expect(mirror.metrics).toHaveLength(192);
    const keys = mirror.requests.map((r) => r.key);
    expect(keys).toEqual([...keys].sort());
    // 各 request は audit が e-Stat に送れる形 (statsDataId + filters)
    for (const r of mirror.requests) {
      expect(typeof r.statsDataId).toBe("string");
      expect(r.statsDataId.length).toBeGreaterThan(0);
      expect(typeof r.filters).toBe("object");
    }
    const metricKeys = mirror.metrics.map((metric) => metric.metricKey);
    expect(metricKeys).toEqual([...metricKeys].sort());
    for (const metric of mirror.metrics) {
      expect(metric.expectedUnit.length).toBeGreaterThan(0);
      expect(metric.expectedConfigHash).toMatch(/^[0-9a-f]{16}$/);
    }
  });

  it("生 request をミラーへ写し、未登録 metric 参照は黙って落とさない", () => {
    const fixture = {
      fixture: {
        charts: [chart("line-chart", {
          seriesRefs: [{ metricKey: "current-balance-ratio" }],
          estatParams: { statsDataId: "S", cdCat01: "A" },
        })],
      },
    };
    expect(buildThemeDependencyMirror(fixture).requests).toEqual([{
      key: "S?cdCat01=A",
      statsDataId: "S",
      filters: { cdCat01: "A" },
      themeKey: "fixture",
      componentKey: "k",
      componentType: "line-chart",
    }]);
    const config = registry.getMetricConfig("current-balance-ratio");
    const getMetricConfig = vi.spyOn(registry, "getMetricConfig")
      .mockReturnValueOnce(config)
      .mockReturnValueOnce(undefined);
    expect(() => buildThemeDependencyMirror({
      broken: {
        charts: [chart("line-chart", {
          seriesRefs: [{ metricKey: "current-balance-ratio" }],
        })],
      },
    })).toThrow(/未登録 metric/);
    getMetricConfig.mockRestore();
  });
});

describe("requestKey — request identity", () => {
  it("statsDataId + filters を正規化 (フィルタ順に依存しない)", () => {
    expect(requestKey({ statsDataId: "S", filters: { cdCat01: "A", cdTab: "1" } })).toBe(
      requestKey({ statsDataId: "S", filters: { cdTab: "1", cdCat01: "A" } }),
    );
    expect(requestKey({ statsDataId: "S", filters: {} })).toBe("S");
  });
});
