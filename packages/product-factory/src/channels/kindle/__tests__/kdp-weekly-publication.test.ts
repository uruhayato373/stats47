import { describe, expect, it } from "vitest";
import { buildKdpWeeklyDecision, type KdpWeeklyListing } from "../kdp-weekly-publication";
import type { SalesObservation } from "../../../sales/types";

const S1_IDS = Array.from({ length: 12 }, (_, index) => `K-S1-${String(index + 1).padStart(2, "0")}`);

function listings(overrides: Readonly<Record<string, KdpWeeklyListing>> = {}): Record<string, KdpWeeklyListing> {
  return Object.fromEntries(
    S1_IDS.map((id) => [id, { id, title: id, status: "listed", kdpStatus: "live", salesStartedAt: "2026-08-30", ...overrides[id] }]),
  );
}

function observation(productId: string, positive = true): SalesObservation {
  return {
    id: `obs-${productId}`,
    channel: "kdp",
    productId,
    periodStart: "2026-08-30",
    periodEnd: "2026-09-27",
    orders: positive ? 1 : 0,
    units: positive ? 1 : 0,
    netRevenueYen: positive ? 500 : 0,
    refunds: 0,
    kenpRead: 0,
    evidencePath: ".local/product-sales-evidence/report.csv",
    evidenceSha256: "a".repeat(64),
    recordedAt: "2026-09-27T00:00:00.000Z",
  };
}

function decide(
  rows: Record<string, KdpWeeklyListing>,
  observations: readonly SalesObservation[],
  week = "2026-W40",
  generatedAt = "2026-09-28T00:00:00.000Z",
) {
  return buildKdpWeeklyDecision({ week, generatedAt, listings: rows, observations });
}

describe("KDP weekly publication gate", () => {
  it("holds while any S1 title is not live", () => {
    const rows = listings({ "K-S1-12": { kdpStatus: "in_review" } });
    const result = decide(rows, S1_IDS.map((id) => observation(id)));
    expect(result.status).toBe("hold");
    expect(result.blockers).toContain("K-S1-12:in_review");
  });

  it("does not treat an empty sales ledger as zero demand", () => {
    const result = decide(listings(), []);
    expect(result.status).toBe("measure");
    expect(result.cohortMeasurement?.missingBookIds).toHaveLength(12);
  });

  it("waits for the full four-week window before asking for sales data", () => {
    const result = decide(listings(), [], "2026-W38", "2026-09-20T00:00:00.000Z");
    expect(result.status).toBe("observe");
    expect(result.cohortMeasurement?.windowStillOpenBookIds).toHaveLength(12);
  });

  it("stops expansion only after measured zero demand", () => {
    const result = decide(listings(), S1_IDS.map((id) => observation(id, false)));
    expect(result.status).toBe("stop-no-demand");
    expect(result.cohortMeasurement?.complete).toBe(true);
  });

  it("prepares exactly one pilot after positive four-week evidence", () => {
    const result = decide(listings(), S1_IDS.map((id) => observation(id)));
    expect(result.status).toBe("prepare-one");
    expect(result.nextPilot?.ordinal).toBe(1);
    expect(result.candidate).toBeNull();
  });

  it("exposes one verified draft only as owner-approval ready", () => {
    const rows = {
      ...listings(),
      "K-S4-01": { id: "K-S4-01", title: "Pilot", status: "draft", kdpStatus: "draft" as const, publicationStage: "verified" },
    };
    const result = decide(rows, S1_IDS.map((id) => observation(id)), "2026-W41");
    expect(result.status).toBe("ready-for-owner-approval");
    expect(result.candidate?.id).toBe("K-S4-01");
    expect(result.publishCommand).toContain("--owner-approved K-S4-01 --commit");
  });

  it("fails closed when multiple verified drafts exist", () => {
    const rows = {
      ...listings(),
      "K-S3-01": { id: "K-S3-01", status: "draft", kdpStatus: "draft" as const, publicationStage: "verified" },
      "K-S4-01": { id: "K-S4-01", status: "draft", kdpStatus: "draft" as const, publicationStage: "verified" },
    };
    const result = decide(rows, S1_IDS.map((id) => observation(id)), "2026-W41");
    expect(result.status).toBe("hold");
    expect(result.eligibleCandidateIds).toEqual(["K-S3-01", "K-S4-01"]);
  });

  it("requires four-week evidence for a live pilot before exposing the next one", () => {
    const rows = {
      ...listings(),
      "K-S4-01": {
        id: "K-S4-01",
        title: "Pilot one",
        status: "listed",
        kdpStatus: "live" as const,
        salesStartedAt: "2026-10-05",
      },
      "K-S3-01": {
        id: "K-S3-01",
        title: "Pilot two",
        status: "draft",
        kdpStatus: "draft" as const,
        publicationStage: "verified",
      },
    };
    const result = decide(rows, S1_IDS.map((id) => observation(id)), "2026-W43", "2026-10-19T00:00:00.000Z");
    expect(result.status).toBe("observe");
    expect(result.cohortMeasurement?.cohort).toBe("latest-pilot");
  });
});
