import { describe, expect, it } from "vitest";

import {
  validateAdoptionCriteria,
  validateChartSelectionMeta,
  validateChartTemporalFit,
  validateHarmRelevance,
} from "../../scripts/validate-theme-catalog";
import { METRICS_REGISTRY } from "../registry";
import type { CatalogChart, ThemeCatalog } from "../theme-catalog/types";

/**
 * HARM該当・採用基準(adoptionCriteria)・チャート選定メタ(comparisonBasis/visualizationRationale)
 * の検査契約。
 *
 * 守りたいのは「分類だけの空欄記録を弾く」ことと「根拠不足の未記入は許す (warn に留め、
 * 定型文での穴埋めを強制しない)」ことの両立。
 */

function catalog(overrides: Partial<ThemeCatalog>): ThemeCatalog {
  return {
    key: "test-theme",
    title: "テスト",
    description: "テスト",
    category: "economy",
    usage: "theme",
    metrics: [],
    charts: [],
    ...overrides,
  };
}

/** registry から年数条件に合う実在キーを探す (固定キー名に依存せず将来のconfig変更に頑健にする)。 */
function findMetricByYearSpan(predicate: (span: number) => boolean): string {
  const hit = Object.entries(METRICS_REGISTRY).find(([, m]) => {
    const y = m.years as { from?: number; to?: number; years?: number[] } | "all";
    if (y === "all" || !y) return false;
    if (Array.isArray(y.years)) return predicate(y.years.length);
    if (typeof y.from === "number" && typeof y.to === "number") {
      return predicate(y.to - y.from + 1);
    }
    return false;
  });
  if (!hit) throw new Error("該当する年数条件の metric が registry に無い");
  return hit[0];
}

const SINGLE_YEAR_KEY = findMetricByYearSpan((n) => n === 1);
const MULTI_YEAR_KEY = findMetricByYearSpan((n) => n > 5);

function chart(overrides: Partial<CatalogChart>): CatalogChart {
  return {
    componentKey: "test-chart",
    componentType: "line-chart",
    title: "テスト",
    componentProps: {},
    sortOrder: 10,
    ...overrides,
  };
}

describe("validateHarmRelevance", () => {
  it("未指定なら何も言わない", () => {
    const errors: string[] = [];
    validateHarmRelevance(catalog({}), errors);
    expect(errors).toEqual([]);
  });

  it("正しい axis + reason はエラーなし", () => {
    const errors: string[] = [];
    validateHarmRelevance(
      catalog({
        harmRelevance: [{ axis: "money", reason: "家計の可処分所得を比較する読者の意思決定に関連する。" }],
      }),
      errors,
    );
    expect(errors).toEqual([]);
  });

  it("不正な axis を拒否する", () => {
    const errors: string[] = [];
    validateHarmRelevance(
      catalog({
        harmRelevance: [{ axis: "wealth" as never, reason: "理由あり" }],
      }),
      errors,
    );
    expect(errors.some((e) => e.includes("[harm-axis]"))).toBe(true);
  });

  it("reason が空欄なら拒否する (分類だけの記録を禁止)", () => {
    const errors: string[] = [];
    validateHarmRelevance(
      catalog({ harmRelevance: [{ axis: "health", reason: "  " }] }),
      errors,
    );
    expect(errors.some((e) => e.includes("[harm-reason]"))).toBe(true);
  });

  it("同一 axis の重複を拒否する", () => {
    const errors: string[] = [];
    validateHarmRelevance(
      catalog({
        harmRelevance: [
          { axis: "ambition", reason: "理由1" },
          { axis: "ambition", reason: "理由2" },
        ],
      }),
      errors,
    );
    expect(errors.some((e) => e.includes("[harm-axis-dup]"))).toBe(true);
  });
});

describe("validateAdoptionCriteria", () => {
  it("selection が無ければ何も言わない (context 指標や未整備の指標を強制しない)", () => {
    const errors: string[] = [];
    const warns: string[] = [];
    validateAdoptionCriteria(
      catalog({
        metrics: [{ rankingKey: "k1", shortLabel: "k1", role: "context" }],
      }),
      errors,
      warns,
    );
    expect(errors).toEqual([]);
    expect(warns).toEqual([]);
  });

  it("primary/secondary で selection はあるが adoptionCriteria 未記入なら warn (error にしない)", () => {
    const errors: string[] = [];
    const warns: string[] = [];
    validateAdoptionCriteria(
      catalog({
        metrics: [
          {
            rankingKey: "k1",
            shortLabel: "k1",
            role: "primary",
            selection: {
              proposedBy: "x",
              surveyedAt: "2026-09-15",
              rationale: "理由",
            },
          },
        ],
      }),
      errors,
      warns,
    );
    expect(errors).toEqual([]);
    expect(warns.some((w) => w.includes("[no-adoption-criteria]"))).toBe(true);
  });

  it("不正な adoptionCriteria 値を error で拒否する", () => {
    const errors: string[] = [];
    const warns: string[] = [];
    validateAdoptionCriteria(
      catalog({
        metrics: [
          {
            rankingKey: "k1",
            shortLabel: "k1",
            role: "primary",
            selection: {
              proposedBy: "x",
              surveyedAt: "2026-09-15",
              rationale: "理由",
              adoptionCriteria: ["popularity" as never],
            },
          },
        ],
      }),
      errors,
      warns,
    );
    expect(errors.some((e) => e.includes("[adoption-criteria]"))).toBe(true);
  });

  it("正しい adoptionCriteria は warn/error どちらも出さない", () => {
    const errors: string[] = [];
    const warns: string[] = [];
    validateAdoptionCriteria(
      catalog({
        metrics: [
          {
            rankingKey: "k1",
            shortLabel: "k1",
            role: "primary",
            selection: {
              proposedBy: "x",
              surveyedAt: "2026-09-15",
              rationale: "理由",
              adoptionCriteria: ["representativeness", "readerValue"],
            },
          },
        ],
      }),
      errors,
      warns,
    );
    expect(errors).toEqual([]);
    expect(warns).toEqual([]);
  });
});

describe("validateChartSelectionMeta", () => {
  it("comparisonBasis / visualizationRationale 未指定はエラーなし", () => {
    const errors: string[] = [];
    validateChartSelectionMeta(catalog({ charts: [chart({})] }), errors);
    expect(errors).toEqual([]);
  });

  it("空文字の comparisonBasis を拒否する", () => {
    const errors: string[] = [];
    validateChartSelectionMeta(
      catalog({ charts: [chart({ comparisonBasis: "  " })] }),
      errors,
    );
    expect(errors.some((e) => e.includes("[comparison-basis]"))).toBe(true);
  });

  it("空文字の visualizationRationale を拒否する", () => {
    const errors: string[] = [];
    validateChartSelectionMeta(
      catalog({ charts: [chart({ visualizationRationale: "" })] }),
      errors,
    );
    expect(errors.some((e) => e.includes("[visualization-rationale]"))).toBe(true);
  });

  it("記入済みの値はエラーなし", () => {
    const errors: string[] = [];
    validateChartSelectionMeta(
      catalog({
        charts: [
          chart({
            comparisonBasis: "全国平均との差",
            visualizationRationale: "時系列の傾き比較に折れ線が適するため",
          }),
        ],
      }),
      errors,
    );
    expect(errors).toEqual([]);
  });
});

describe("validateChartTemporalFit", () => {
  it("line-chart 以外は年数を問わない", () => {
    const warns: string[] = [];
    validateChartTemporalFit(
      chart({ componentType: "donut-chart", relatedRankingKeys: [SINGLE_YEAR_KEY] }),
      "where",
      warns,
    );
    expect(warns).toEqual([]);
  });

  it("line-chart が単年しかない指標を参照すると warn (推移を描けない)", () => {
    const warns: string[] = [];
    validateChartTemporalFit(
      chart({ componentType: "line-chart", relatedRankingKeys: [SINGLE_YEAR_KEY] }),
      "theme/chart",
      warns,
    );
    expect(warns.some((w) => w.includes("[chart-temporal-fit]") && w.includes(SINGLE_YEAR_KEY))).toBe(
      true,
    );
  });

  it("line-chart が複数年の指標を参照すれば warn しない", () => {
    const warns: string[] = [];
    validateChartTemporalFit(
      chart({ componentType: "line-chart", relatedRankingKeys: [MULTI_YEAR_KEY] }),
      "theme/chart",
      warns,
    );
    expect(warns).toEqual([]);
  });

  it("実在しない rankingKey は無視する (実在チェックは別関数の責務)", () => {
    const warns: string[] = [];
    validateChartTemporalFit(
      chart({ componentType: "line-chart", relatedRankingKeys: ["__does-not-exist__"] }),
      "theme/chart",
      warns,
    );
    expect(warns).toEqual([]);
  });
});
