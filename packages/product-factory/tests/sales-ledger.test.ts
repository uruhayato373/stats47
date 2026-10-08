import { describe, expect, it } from "vitest";

import { summarizeSalesLedger, validateSalesLedger } from "../src/sales";
import {
  kdpMonthlyObservations,
  kdpMonthlyRecordsSha256,
  mergeSalesObservations,
  salesObservationId,
  type KdpMonthlyRecord,
  type KdpMonthlyReport,
} from "../src/sales/ledger-core.mjs";

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

// 2026-10-07 に手入力した 8 月分 (`products:sales -- record`)。自動記録の導入後も有効なまま残す
const MANUAL_AUGUST_ROW = {
  id: "223344e97e9b72ad496f",
  channel: "kdp",
  productId: "K-S1-02",
  periodStart: "2026-08-01",
  periodEnd: "2026-08-31",
  orders: 1,
  units: 1,
  netRevenueYen: 254,
  refunds: 0,
  evidencePath: ".local/product-sales-evidence/kdp/kdp-monthly-2026-08.json",
  evidenceSha256: "819ad765457036c000a496b60f1daf1a6419ee2cdb637dfde36ff703cf99a275",
  recordedAt: "2026-10-07T21:57:23.008Z",
} as const;

function augustReport(records: readonly KdpMonthlyRecord[]): KdpMonthlyReport {
  return {
    scope: "stats47-exact-asin",
    finality: "finalized-monthly-royalty",
    period: { month: "2026-08", start: "2026-08-01", end: "2026-08-31" },
    coverage: { complete: true },
    records,
  };
}

const AUGUST_EBOOK: KdpMonthlyRecord = {
  id: "K-S1-02",
  asin: "B0HF1N51T8",
  month: "2026-08",
  marketplace: "Amazon.co.jp",
  currency: "JPY",
  amount: 254,
  kind: "monthly-ebook-royalty",
  orders: 1,
  refunds: 0,
  netUnits: 1,
};
const VAULT = { vaultKey: "kdp/monthly/month-19", recordedAt: "2026-10-08T00:00:00.000Z" };

describe("sales ledger の証拠参照", () => {
  it("手入力の 8 月行 (.local の証拠) は自動記録の導入後も有効で、id も同じ式で再現できる", () => {
    const row = MANUAL_AUGUST_ROW;
    expect(() => validateSalesLedger({ schemaVersion: 1, observations: [row] })).not.toThrow();
    expect(salesObservationId(row.channel, row.productId, row.periodStart, row.periodEnd, row.evidenceSha256)).toBe(row.id);
  });

  it("保管庫の KDP 月次キーを証拠として受け付け、範囲外・別キー・別チャネルは拒否する", () => {
    const vaultRow = { ...MANUAL_AUGUST_ROW, id: "vault", evidencePath: "vault:kdp/monthly/month-19", evidenceSha256: SHA };
    expect(() => validateSalesLedger({ schemaVersion: 1, observations: [vaultRow] })).not.toThrow();
    for (const bad of [
      { ...vaultRow, evidencePath: "vault:kdp/monthly/month-24" },
      { ...vaultRow, evidencePath: "vault:kdp/session" },
      { ...vaultRow, evidencePath: "vault:../kdp/monthly/month-1" },
      { ...vaultRow, channel: "coconala" },
    ]) {
      expect(() => validateSalesLedger({ schemaVersion: 1, observations: [bad] })).toThrow(/evidencePath/);
    }
  });
});

describe("KDP 月次レポートから販売台帳への変換", () => {
  it("8 月相当 (K-S1-02 の 1 行 ¥254) から書籍 1 冊・1 か月の観測をちょうど 1 件作る", () => {
    const report = augustReport([AUGUST_EBOOK]);
    const { observations, excluded } = kdpMonthlyObservations(report, VAULT);

    expect(excluded).toEqual([]);
    expect(observations).toHaveLength(1);
    expect(observations[0]).toMatchObject({
      channel: "kdp",
      productId: "K-S1-02",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      orders: 1,
      units: 1,
      refunds: 0,
      netRevenueYen: 254,
      evidencePath: "vault:kdp/monthly/month-19",
      evidenceSha256: kdpMonthlyRecordsSha256(report),
    });
    expect(observations[0]).not.toHaveProperty("kenpRead");
  });

  it("同じレポートを何度流しても台帳は 1 行のまま (2 回目は追加 0 件)", () => {
    const { observations } = kdpMonthlyObservations(augustReport([AUGUST_EBOOK]), VAULT);
    const first = mergeSalesObservations({ schemaVersion: 1, observations: [] }, observations);
    const rerun = kdpMonthlyObservations(augustReport([AUGUST_EBOOK]), { ...VAULT, recordedAt: "2026-10-09T00:00:00.000Z" });
    const second = mergeSalesObservations(first.ledger, rerun.observations);

    expect(first.added).toHaveLength(1);
    expect(second.added).toEqual([]);
    expect(second.skipped).toHaveLength(1);
    expect(second.ledger.observations).toEqual(first.ledger.observations);
  });

  it("手入力済みの月は二重に数えず、値が同じなら記録済みとして飛ばす", () => {
    const { observations } = kdpMonthlyObservations(augustReport([AUGUST_EBOOK]), VAULT);
    const merged = mergeSalesObservations({ schemaVersion: 1, observations: [MANUAL_AUGUST_ROW] }, observations);

    expect(merged.added).toEqual([]);
    expect(merged.conflicts).toEqual([]);
    expect(merged.skipped).toEqual([{ productId: "K-S1-02", periodStart: "2026-08-01", existingId: MANUAL_AUGUST_ROW.id }]);
    expect(merged.ledger.observations).toEqual([MANUAL_AUGUST_ROW]);
  });

  it("既存行と数値が食い違う月は上書きも追加もせず conflicts に返す", () => {
    const { observations } = kdpMonthlyObservations(augustReport([{ ...AUGUST_EBOOK, amount: 300 }]), VAULT);
    const merged = mergeSalesObservations({ schemaVersion: 1, observations: [MANUAL_AUGUST_ROW] }, observations);

    expect(merged.added).toEqual([]);
    expect(merged.conflicts).toHaveLength(1);
    expect(merged.ledger.observations).toEqual([MANUAL_AUGUST_ROW]);
  });

  it("KENP は円の行だけを書籍ごとに合計し、円以外の行は合算せず理由付きで除外する", () => {
    const kenp: KdpMonthlyRecord = {
      id: "K-S1-02",
      asin: "B0HF1N51T8",
      month: "2026-08",
      marketplace: "Amazon.co.jp",
      currency: "JPY",
      amount: 3.004217196,
      kind: "monthly-kenp-royalty",
      pages: 10,
    };
    const usd: KdpMonthlyRecord = { ...AUGUST_EBOOK, marketplace: "Amazon.com", currency: "USD", amount: 2.5 };
    const { observations, excluded } = kdpMonthlyObservations(augustReport([AUGUST_EBOOK, kenp, usd]), VAULT);

    expect(observations).toHaveLength(1);
    expect(observations[0]).toMatchObject({ orders: 1, units: 1, netRevenueYen: 257, kenpRead: 10 });
    expect(excluded).toEqual([
      { productId: "K-S1-02", kind: "monthly-ebook-royalty", marketplace: "Amazon.com", currency: "USD", reason: "non-jpy-currency" },
    ]);
  });

  it("返金で実質注文数が負になった書籍は台帳の型で表せないので除外理由を残す", () => {
    const refund: KdpMonthlyRecord = { ...AUGUST_EBOOK, orders: 0, refunds: 1, netUnits: -1, amount: -35 };
    const { observations, excluded } = kdpMonthlyObservations(augustReport([refund]), VAULT);

    expect(observations).toEqual([]);
    expect(excluded).toEqual([{ productId: "K-S1-02", reason: "negative-net-units" }]);
  });

  it("確定前のレポートや月次以外の保管庫キーでは観測を作らない", () => {
    expect(() => kdpMonthlyObservations({ ...augustReport([AUGUST_EBOOK]), finality: "provisional" }, VAULT)).toThrow(
      /monthly_report_not_ledger_ready/,
    );
    expect(() => kdpMonthlyObservations(augustReport([AUGUST_EBOOK]), { ...VAULT, vaultKey: "kdp/session" })).toThrow(
      /vault_invalid_key/,
    );
  });
});
