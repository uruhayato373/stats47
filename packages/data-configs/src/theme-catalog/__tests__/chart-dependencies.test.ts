import { describe, expect, it } from "vitest";

import {
  buildThemeDependencyMirror,
  collectChartDependencies,
  collectThemeDataDependencies,
  collectThemeDataDependenciesWithProvenance,
  requestKey,
} from "../chart-dependencies";
import { THEME_CATALOGS } from "../index";
import { enumeratePyramidCategoryCodes, PYRAMID_STATS_DATA_ID } from "../population-pyramid-deps";
import type { CatalogChart } from "../types";

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
    expect(live.totalRequests).toBe(253);
    expect(live.distinctRequests.length).toBe(187);
  });

  it("pyramid は props 空でも 34 request/chart を列挙 (旧監査で漏れていた)", () => {
    const pyr = live.perChart.filter((p) => p.componentType === "pyramid-chart");
    expect(pyr.length).toBeGreaterThan(0);
    for (const p of pyr) expect(p.requests.length).toBe(34);
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

  it("CPI: statsDataId を落とすと request が 0 になる (top-level param の陰性対照)", () => {
    expect(collectChartDependencies(chart("cpi-profile", { statsDataId: "S" })).requests.length).toBe(1);
    expect(collectChartDependencies(chart("cpi-profile", { year: "2024" })).requests.length).toBe(0);
  });

  it("pyramid: SSOT の code 数と request 数が一致する (code を減らせば request も減る)", () => {
    const dep = collectChartDependencies(chart("pyramid-chart", {}));
    expect(dep.requests.length).toBe(enumeratePyramidCategoryCodes().length);
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

  it("pyramid の 34 request が provenance 付きで含まれる (旧 live 監査で漏れていた)", () => {
    const pyr = prov.distinct.filter((d) => d.componentType === "pyramid-chart");
    expect(pyr.length).toBe(34);
    for (const d of pyr) expect(d.request.statsDataId).toBe(PYRAMID_STATS_DATA_ID);
  });
});

describe("⑤ 依存ミラー — 決定的・正典と byte 一致する形 (audit が読む鏡)", () => {
  it("buildThemeDependencyMirror は distinct を key 昇順で並べ件数を一致させる", () => {
    const mirror = buildThemeDependencyMirror(THEME_CATALOGS);
    expect(mirror.totalRequests).toBe(253);
    expect(mirror.distinctRequests).toBe(187);
    expect(mirror.requests.length).toBe(187);
    const keys = mirror.requests.map((r) => r.key);
    expect(keys).toEqual([...keys].sort());
    // 各 request は audit が e-Stat に送れる形 (statsDataId + filters)
    for (const r of mirror.requests) {
      expect(typeof r.statsDataId).toBe("string");
      expect(r.statsDataId.length).toBeGreaterThan(0);
      expect(typeof r.filters).toBe("object");
    }
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
