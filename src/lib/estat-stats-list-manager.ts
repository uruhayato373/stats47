/**
 * Stub file for EstatStatsListManager
 * This file provides type definitions for routes that are currently using mock data
 * TODO: Implement actual StatsListManager functionality
 */

import { GetStatsListParams } from "@/types/models/estat";

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

export interface StatsListSummary {
  totalTables: number;
  uniqueStats: number;
  categories: Array<{
    code: string;
    name: string;
    count: number;
  }>;
  governmentOrgs: Array<{
    code: string;
    name: string;
    count: number;
  }>;
  dateRange: {
    earliest: string;
    latest: string;
  };
  lastUpdated: string;
}

export interface StatsListSearchResult {
  success: boolean;
  recordsProcessed: number;
  totalAvailable: number;
  message: string;
  data?: Array<{
    statsDataId: string;
    title: string;
    statName: string;
    govOrg: string;
    surveyDate: string;
  }>;
}

export class EstatStatsListManager {
  constructor() {
    throw new Error("EstatStatsListManager is not implemented yet");
  }
}
