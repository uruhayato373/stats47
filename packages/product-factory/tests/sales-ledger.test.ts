import { describe, expect, it } from "vitest";

import { summarizeSalesLedger, validateSalesLedger } from "../src/sales";

const SHA = "a".repeat(64);

describe("sales ledger", () => {
  it("空台帳を未計測として集計し、0円の実測と混同しない", () => {
    const summary = summarizeSalesLedger({ schemaVersion: 1, observations: [] });

    expect(summary.observationCount).toBe(0);
    expect(summary.measuredChannels).toEqual([]);
    expect(summary.latestPeriodEnd).toBeNull();
  });

  it("証拠付き0円観測は計測済みチャネルとして残す", () => {
    const ledger = validateSalesLedger({
      schemaVersion: 1,
      observations: [
        {
          id: "obs-1",
          channel: "kdp",
          productId: "K-S1-06",
          periodStart: "2026-09-01",
          periodEnd: "2026-09-06",
          orders: 0,
          units: 0,
          netRevenueYen: 0,
          refunds: 0,
          evidencePath: ".local/product-sales-evidence/kdp.csv",
          evidenceSha256: SHA,
          recordedAt: "2026-09-06T00:00:00.000Z",
        },
      ],
    });

    expect(summarizeSalesLedger(ledger)).toMatchObject({
      observationCount: 1,
      measuredChannels: ["kdp"],
      netRevenueYen: 0,
      latestPeriodEnd: "2026-09-06",
    });
  });

  it("期間逆転・負数・証拠hashなしを拒否する", () => {
    expect(() =>
      validateSalesLedger({
        schemaVersion: 1,
        observations: [
          {
            id: "bad",
            channel: "coconala",
            productId: "P-04",
            periodStart: "2026-09-07",
            periodEnd: "2026-09-06",
            orders: -1,
            units: 0,
            netRevenueYen: 0,
            refunds: 0,
            evidencePath: "evidence.csv",
            evidenceSha256: "",
            recordedAt: "2026-09-06T00:00:00.000Z",
          },
        ],
      }),
    ).toThrow();
  });

  it("git管理外の証拠保管先を強制する", () => {
    expect(() =>
      validateSalesLedger({
        schemaVersion: 1,
        observations: [
          {
            id: "bad-path",
            channel: "kdp",
            productId: "K-S1-06",
            periodStart: "2026-09-01",
            periodEnd: "2026-09-06",
            orders: 0,
            units: 0,
            netRevenueYen: 0,
            refunds: 0,
            evidencePath: "docs/private-sales.csv",
            evidenceSha256: SHA,
            recordedAt: "2026-09-06T00:00:00.000Z",
          },
        ],
      }),
    ).toThrow("must be inside .local/product-sales-evidence");
  });
});
