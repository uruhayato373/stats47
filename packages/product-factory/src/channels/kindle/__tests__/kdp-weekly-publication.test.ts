import { describe, expect, it } from "vitest";
import { buildKdpWeeklyDecision, type KdpWeeklyListing } from "../kdp-weekly-publication";
import type { SalesCoverage, SalesObservation } from "../../../sales/types";

const S1_IDS = Array.from({ length: 12 }, (_, index) => `K-S1-${String(index + 1).padStart(2, "0")}`);

function s1Listings(overrides: Readonly<Record<string, KdpWeeklyListing>> = {}): Record<string, KdpWeeklyListing> {
  return Object.fromEntries(
    S1_IDS.map((id) => [id, { id, title: id, status: "listed", kdpStatus: "live", salesStartedAt: "2026-08-30", ...overrides[id] }]),
  );
}

const verified = (id: string): KdpWeeklyListing => ({ id, title: id, status: "draft", kdpStatus: "draft", publicationStage: "verified" });
const liveSince = (id: string, salesStartedAt: string): KdpWeeklyListing => ({ id, title: id, status: "listed", kdpStatus: "live", salesStartedAt });

function observation(productId: string, periodStart: string, periodEnd: string, positive = true): SalesObservation {
  return {
    id: `obs-${productId}-${periodStart}`,
    channel: "kdp",
    productId,
    periodStart,
    periodEnd,
    orders: positive ? 1 : 0,
    units: positive ? 1 : 0,
    netRevenueYen: positive ? 300 : 0,
    refunds: 0,
    kenpRead: 0,
    evidencePath: ".local/product-sales-evidence/report.csv",
    evidenceSha256: "a".repeat(64),
    recordedAt: "2027-01-20T00:00:00.000Z",
  };
}

function coverage(periodStart: string, periodEnd: string, productIds: readonly string[]): SalesCoverage {
  return { channel: "kdp", periodStart, periodEnd, productIds, evidencePath: ".local/kdp/report.json", evidenceSha256: "b".repeat(64), recordedAt: "2027-02-05T00:00:00.000Z" };
}

function decide(
  listings: Record<string, KdpWeeklyListing>,
  options: { week?: string; generatedAt?: string; observations?: SalesObservation[]; coverage?: SalesCoverage[] } = {},
) {
  return buildKdpWeeklyDecision({
    week: options.week ?? "2026-W47",
    generatedAt: options.generatedAt ?? "2026-11-16T00:00:00.000Z",
    listings,
    observations: options.observations ?? [],
    coverage: options.coverage ?? [],
  });
}

describe("KDP weekly publication gate (型ごとに複数冊・8 週)", () => {
  it("S1 が販売中に揃っていなければ止める", () => {
    const result = decide({ ...s1Listings({ "K-S1-12": { kdpStatus: "in_review" } }), "K-S3-01": verified("K-S3-01") });
    expect(result.status).toBe("hold");
    expect(result.blockers).toContain("K-S1-12:in_review");
    expect(result.publishCommand).toBeNull();
  });

  it("検証済みの本が無ければ、まだ出ていない型を挙げて次の本を作らせる", () => {
    const result = decide(s1Listings());
    expect(result.status).toBe("prepare");
    expect(result.nextAction).toMatch(/1県1章のガイド/);
    expect(result.candidate).toBeNull();
  });

  it("[旧方針の否定] 既刊の売上が未計測でも、検証済みの本は承認待ちにできる", () => {
    const result = decide({ ...s1Listings(), "K-S3-01": verified("K-S3-01") });
    expect(result.status).toBe("ready-for-owner-approval");
    expect(result.candidate?.id).toBe("K-S3-01");
    expect(result.publishCommand).toContain("--owner-approved K-S3-01 --commit");
  });

  it("[旧方針の否定] 検証済みの本が複数あっても止めず、全冊を承認の候補に並べる", () => {
    const result = decide({ ...s1Listings(), "K-S4-01": verified("K-S4-01"), "K-S3-02": verified("K-S3-02"), "K-S3-01": verified("K-S3-01") });
    expect(result.status).toBe("ready-for-owner-approval");
    expect(result.eligibleCandidateIds).toEqual(["K-S3-01", "K-S3-02", "K-S4-01"]);
    expect(result.formats.find((format) => format.id === "prefecture-guide")?.verifiedBookIds).toEqual(["K-S3-01", "K-S3-02"]);
  });

  it("[旧方針の否定] 審査中の本があっても、次の本の承認を止めない", () => {
    const result = decide({
      ...s1Listings(),
      "K-S3-01": { ...verified("K-S3-01"), kdpStatus: "in_review", status: "listed", lastSubmittedAt: "2026-11-15T03:00:00.000Z" },
      "K-S3-02": verified("K-S3-02"),
    });
    expect(result.status).toBe("ready-for-owner-approval");
    expect(result.portfolio.pilotInReview).toBe(1);
    expect(result.eligibleCandidateIds).toEqual(["K-S3-02"]);
  });

  it("出版停止した旧版と、方針の開始日より前に出た本は数えない", () => {
    const result = decide({
      ...s1Listings(),
      "K-S2-03": { ...liveSince("K-S2-03", "2026-08-13"), status: "withdrawn", kdpStatus: "draft", withdrawal: { requestedAt: "2026-09-19", reason: "x" } },
      "K-S2-04": liveSince("K-S2-04", "2026-09-01"),
    });
    expect(result.portfolio.pilotLive).toBe(0);
    expect(result.cohortMeasurement).toBeNull();
  });

  it("計測窓は公開日から 8 週。窓の途中は判定に進めない", () => {
    const result = decide({ ...s1Listings(), "K-S3-01": liveSince("K-S3-01", "2026-11-20") }, { generatedAt: "2026-12-20T00:00:00.000Z", week: "2026-W51" });
    expect(result.cohortMeasurement?.requiredPeriodByBook["K-S3-01"]).toEqual({ start: "2026-11-20", end: "2027-01-14" });
    expect(result.cohortMeasurement?.windowStillOpenBookIds).toEqual(["K-S3-01"]);
    expect(result.formats.find((format) => format.id === "prefecture-guide")?.readyForJudgement).toBe(false);
  });

  it("8 週の窓が閉じて計測が揃った型は判定に進め、需要のあった本を挙げる", () => {
    const result = decide(
      { ...s1Listings(), "K-S3-01": liveSince("K-S3-01", "2026-11-20"), "K-S3-02": liveSince("K-S3-02", "2026-11-20") },
      {
        week: "2027-W03",
        generatedAt: "2027-01-20T00:00:00.000Z",
        observations: [observation("K-S3-01", "2026-12-01", "2026-12-31")],
        coverage: [coverage("2026-11-20", "2027-01-14", ["K-S3-01", "K-S3-02"])],
      },
    );
    const guide = result.formats.find((format) => format.id === "prefecture-guide");
    expect(guide?.measuredBookIds).toEqual(["K-S3-01", "K-S3-02"]);
    expect(guide?.demandBookIds).toEqual(["K-S3-01"]);
    expect(guide?.readyForJudgement).toBe(true);
    expect(result.nextAction).toMatch(/prefecture-guide/);
  });

  it("[mutation] 範囲が窓の一部しか無い本は未計測のまま (欠測を 0 にしない)", () => {
    const result = decide(
      { ...s1Listings(), "K-S4-01": liveSince("K-S4-01", "2026-11-20") },
      { generatedAt: "2027-01-20T00:00:00.000Z", week: "2027-W03", coverage: [coverage("2026-11-20", "2026-12-31", ["K-S4-01"])] },
    );
    expect(result.cohortMeasurement?.missingBookIds).toEqual(["K-S4-01"]);
    expect(result.formats.find((format) => format.id === "surprising-first")?.readyForJudgement).toBe(false);
  });
});
