import { describe, expect, it } from "vitest";

import {
  validateEvidenceSources,
  validateEvidenceTopics,
} from "../../scripts/validate-theme-catalog";
import type { EvidenceSourceKey } from "../theme-catalog/evidence-lenses";
import type { ThemeCatalog } from "../theme-catalog/types";

const ACTIVE_RANKING = "library-count-per-million";

function catalog(over: Partial<ThemeCatalog> = {}): ThemeCatalog {
  return {
    key: "education-culture",
    title: "教育・文化",
    description: "テスト",
    category: "education",
    usage: "theme",
    metrics: [],
    charts: [
      {
        componentKey: "chart-a",
        componentType: "line-chart",
        title: "A",
        componentProps: {},
        sortOrder: 0,
      },
    ],
    evidenceTopics: [
      {
        key: "facility-access",
        lensKey: "regional-access",
        title: "施設アクセス",
        question: "地域差はあるか",
        summary: "人口と面積を分けて読みます。",
        sourceKeys: ["mext-whitepaper-2024"],
        relatedRankingKeys: [ACTIVE_RANKING],
        relatedChartKeys: ["chart-a"],
        relatedThemeKeys: ["population-dynamics"],
      },
    ],
    ...over,
  };
}

function run(c: ThemeCatalog) {
  const errors: string[] = [];
  const warns: string[] = [];
  validateEvidenceTopics(
    c,
    new Set(["education-culture", "population-dynamics"]),
    errors,
    warns,
  );
  return { errors, warns };
}

describe("validateEvidenceTopics", () => {
  it("実在する出典・ランキング・チャート・関連テーマを通す", () => {
    expect(run(catalog())).toEqual({ errors: [], warns: [] });
  });

  it("出典台帳にない sourceKey を弾く", () => {
    const c = catalog();
    c.evidenceTopics![0].sourceKeys = ["ghost-source" as EvidenceSourceKey];
    expect(run(c).errors.some((e) => e.startsWith("[evidence-source]"))).toBe(true);
  });

  it("存在しないランキング・チャート・テーマを弾く", () => {
    const c = catalog();
    c.evidenceTopics![0].relatedRankingKeys = ["ghost-ranking"];
    c.evidenceTopics![0].relatedChartKeys = ["ghost-chart"];
    c.evidenceTopics![0].relatedThemeKeys = ["ghost-theme"];
    const { errors } = run(c);
    expect(errors.some((e) => e.startsWith("[evidence-ranking]"))).toBe(true);
    expect(errors.some((e) => e.startsWith("[evidence-chart]"))).toBe(true);
    expect(errors.some((e) => e.startsWith("[evidence-theme]"))).toBe(true);
  });

  it("内部導線がない論点を warn する", () => {
    const c = catalog();
    c.evidenceTopics![0].relatedRankingKeys = [];
    c.evidenceTopics![0].relatedThemeKeys = [];
    expect(run(c).warns.some((w) => w.startsWith("[evidence-no-route]"))).toBe(true);
  });
});

describe("validateEvidenceSources", () => {
  it("登録済み出典は https の公式URLを持つ", () => {
    const errors: string[] = [];
    validateEvidenceSources(errors);
    expect(errors).toEqual([]);
  });
});
