import { describe, expect, it } from "vitest";
import { KINDLE_BOOKS } from "../book-catalog";
import { KDP_PUBLICATION_PLAN } from "../kdp-publishing-policy";

describe("KDP publication plan", () => {
  it("separates the 32-book catalog from the evidence-gated 15-book publication target", () => {
    expect(KINDLE_BOOKS).toHaveLength(KDP_PUBLICATION_PLAN.registeredCatalogCount);
    expect(KDP_PUBLICATION_PLAN.activePublicationTargetCount).toBe(
      KDP_PUBLICATION_PLAN.approvedS1Count + KDP_PUBLICATION_PLAN.evidenceGatedPilotCount,
    );
  });

  it("publishes at most one new book per week and measures each cohort for four weeks", () => {
    expect(KDP_PUBLICATION_PLAN.maxNewPublicationsPerWeek).toBe(1);
    expect(KDP_PUBLICATION_PLAN.cohortMeasurementWeeks).toBe(4);
    expect(KDP_PUBLICATION_PLAN.currentGate.status).toBe("paused-until-measured");
  });
});
