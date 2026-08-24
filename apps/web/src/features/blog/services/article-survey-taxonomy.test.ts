import { describe, expect, it, vi } from "vitest";

import {
  extractArticleChartBases,
  resolveArticleSurveyTaxonomy,
} from "./article-survey-taxonomy";

describe("article survey taxonomy", () => {
  it("本文が参照する SVG base を重複排除する", () => {
    expect(extractArticleChartBases("[a](data/x.svg)\n![b](data/x.svg)\n![c](data/y.svg?v=1)"))
      .toEqual(["x", "y"]);
  });

  it("source.json の rankingKey から survey を解決する", async () => {
    const fetcher = vi.fn(async () => ({
      kind: "ranking",
      rankingKey: "grilled-eel-consumption-expenditure",
    }));
    const surveys = await resolveArticleSurveyTaxonomy(
      { slug: "article", content: "![chart](data/chart.svg)" },
      fetcher,
    );
    expect(surveys.map((survey) => survey.id)).toEqual(["kakei-chousa"]);
    expect(fetcher).toHaveBeenCalledWith("app/blog/article/data/chart.source.json");
  });

  it("snapshot surveyIds があれば source を再読しない", async () => {
    const fetcher = vi.fn();
    const surveys = await resolveArticleSurveyTaxonomy(
      { slug: "article", content: "![chart](data/chart.svg)", snapshotSurveyIds: ["census"] },
      fetcher,
    );
    expect(surveys.map((survey) => survey.id)).toEqual(["census"]);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
