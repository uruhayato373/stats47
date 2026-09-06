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

export interface SalesLedger {
  readonly schemaVersion: 1;
  readonly observations: readonly SalesObservation[];
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
