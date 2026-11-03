export type SalesChannel = "kdp" | "coconala";

export interface SalesObservation {
  readonly id: string;
  readonly channel: SalesChannel;
  readonly productId: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly orders: number;
  readonly units: number;
  readonly netRevenueYen: number;
  readonly refunds: number;
  readonly kenpRead?: number;
  readonly evidencePath: string;
  readonly evidenceSha256: string;
  readonly recordedAt: string;
}

/**
 * 計測の範囲。この期間の完全なレポートが数えた商品。範囲に入っていて観測の無い商品は「計測済み・0 件」、
 * 範囲の外は未計測 (欠測を 0 にしない)。
 */
export interface SalesCoverage {
  readonly channel: SalesChannel;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly productIds: readonly string[];
  readonly evidencePath: string;
  readonly evidenceSha256: string;
  readonly recordedAt: string;
}

export interface SalesLedger {
  readonly schemaVersion: 1;
  readonly observations: readonly SalesObservation[];
  readonly coverage?: readonly SalesCoverage[];
}

export interface SalesSummary {
  readonly observationCount: number;
  readonly measuredChannels: readonly SalesChannel[];
  readonly orders: number;
  readonly units: number;
  readonly netRevenueYen: number;
  readonly refunds: number;
  readonly kenpRead: number;
  readonly latestPeriodEnd: string | null;
}
