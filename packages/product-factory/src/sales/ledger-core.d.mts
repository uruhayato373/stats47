import type { SalesChannel, SalesLedger, SalesObservation } from "./types";

export interface KdpMonthlyRecord {
  readonly id: string;
  readonly asin: string;
  readonly month: string;
  readonly marketplace: string;
  readonly currency: string;
  readonly amount: number;
  readonly kind: "monthly-ebook-royalty" | "monthly-kenp-royalty";
  readonly orders?: number;
  readonly refunds?: number;
  readonly netUnits?: number;
  readonly pages?: number;
}

export interface KdpMonthlyReport {
  readonly scope: string;
  readonly finality: string;
  readonly period: { readonly month: string; readonly start: string; readonly end: string };
  readonly records: readonly KdpMonthlyRecord[];
  readonly coverage: { readonly complete: boolean };
}

export interface KdpMonthlyExclusion {
  readonly productId: string;
  readonly reason: "non-jpy-currency" | "negative-net-units" | "negative-net-revenue";
  readonly kind?: string;
  readonly marketplace?: string;
  readonly currency?: string;
}

export interface SalesMergeEntry {
  readonly productId: string;
  readonly periodStart: string;
  readonly existingId: string;
  readonly candidateId?: string;
}

export declare function validateSalesLedger(value: unknown): SalesLedger;
export declare function salesObservationId(
  channel: SalesChannel,
  productId: string,
  periodStart: string,
  periodEnd: string,
  evidenceSha256: string,
): string;
export declare function kdpMonthlyRecordsSha256(report: KdpMonthlyReport): string;
export declare function kdpMonthlyObservations(
  report: KdpMonthlyReport,
  options: { readonly vaultKey: string; readonly recordedAt: string },
): { observations: SalesObservation[]; excluded: KdpMonthlyExclusion[] };
export declare function mergeSalesObservations(
  ledger: unknown,
  candidates: readonly SalesObservation[],
): {
  ledger: SalesLedger;
  added: string[];
  skipped: SalesMergeEntry[];
  conflicts: SalesMergeEntry[];
};
