import "server-only";

import { logger } from "@stats47/logger/server";
import { z } from "zod";

import type { RankingValue } from "../../types";
import type { RankingValuesKeySnapshot } from "../../types/snapshot";

const AreaTypeSchema = z.enum(["national", "prefecture", "city", "port"]);

export const RankingValueSchema = z.object({
  metricKey: z.string().min(1),
  areaType: AreaTypeSchema.optional(),
  areaCode: z.string(),
  areaName: z.string(),
  yearCode: z.string().min(1),
  yearName: z.string(),
  value: z.number().finite().nullable(),
  unit: z.string(),
  rank: z.number().finite(),
}).passthrough();

export const RankingValuesKeySnapshotSchema = z.object({
  generatedAt: z.string().min(1),
  rankingKey: z.string().min(1),
  areaType: z.string().min(1),
  partitions: z.array(z.object({
    yearCode: z.string().min(1),
    count: z.number().int().nonnegative(),
    values: z.array(RankingValueSchema),
  })),
}).passthrough();

export function parseRankingValue(data: unknown): RankingValue {
  try {
    return RankingValueSchema.parse(data) as RankingValue;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error({ error: error.issues }, "ランキング値データのバリデーションエラー");
      const errorMessages = error.issues.map((e) => e.message).join(", ");
      throw new Error(`ランキング値データが不正です: ${errorMessages}`);
    }
    throw error;
  }
}

export function parseRankingValuesKeySnapshot(data: unknown): RankingValuesKeySnapshot {
  try {
    return RankingValuesKeySnapshotSchema.parse(data) as RankingValuesKeySnapshot;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error({ error: error.issues }, "ランキング値スナップショットのバリデーションエラー");
      const errorMessages = error.issues.map((e) => e.message).join(", ");
      throw new Error(`ランキング値スナップショットが不正です: ${errorMessages}`);
    }
    throw error;
  }
}
