/**
 * Stub file for EstatStatsListManager
 * This file provides type definitions for routes that are currently using mock data
 * TODO: Implement actual StatsListManager functionality
 */

import { GetStatsListParams } from "@/lib/estat/types";

export type StatsListParams = GetStatsListParams;

export interface BulkFetchResult {
  totalFetched: number;
  successCount: number;
  failureCount: number;
  totalRecords: number;
  results: Array<{
    params: Partial<StatsListParams>;
    success: boolean;
    recordCount: number;
    error?: string;
  }>;
  error?: string;
}

export class EstatStatsListManager {
  constructor() {
    throw new Error("EstatStatsListManager is not implemented yet");
  }
}
