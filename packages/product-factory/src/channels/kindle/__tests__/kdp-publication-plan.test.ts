import { describe, expect, it } from "vitest";
import { KINDLE_BOOKS } from "../book-catalog";
import { KDP_PORTFOLIO_POLICY, KDP_PUBLICATION_PLAN } from "../kdp-publishing-policy";

describe("KDP publication plan (2026-11-14 オーナー決定)", () => {
  it("企画カタログの冊数は KINDLE_BOOKS と一致する (出版目標ではない)", () => {
    expect(KINDLE_BOOKS).toHaveLength(KDP_PUBLICATION_PLAN.registeredCatalogCount);
  });

  it("各冊を公開日から 8 週で計測し、週の冊数上限を持たない", () => {
    expect(KDP_PUBLICATION_PLAN.cohortMeasurementWeeks).toBe(8);
    expect(KDP_PUBLICATION_PLAN).not.toHaveProperty("maxNewPublicationsPerWeek");
    expect(KDP_PORTFOLIO_POLICY.mode).toBe("active");
  });

  it("型の接頭辞は重ならず、カタログの本に実在する", () => {
    const prefixes = KDP_PUBLICATION_PLAN.formats.map((format) => format.bookIdPrefix);
    expect(new Set(prefixes).size).toBe(prefixes.length);
    for (const prefix of prefixes) expect(KINDLE_BOOKS.some((book) => book.id.startsWith(prefix)), prefix).toBe(true);
    expect(prefixes).not.toContain("K-S1-");
  });

  it("1 冊ずつの明示承認は止める条件に残っている", () => {
    expect(KDP_PUBLICATION_PLAN.stopConditions.some((condition) => condition.includes("明示承認"))).toBe(true);
  });
});
