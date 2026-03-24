import "server-only";

import {
  correlationAnalysis,
  getDrizzle,
  rankingItems,
} from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { eq, or, sql } from "drizzle-orm";

export interface CorrelatedItem {
  rankingKey: string;
  title: string;
  subtitle: string | null;
  unit: string;
  pearsonR: number;
  partialRPopulation: number | null;
  partialRArea: number | null;
  partialRAging: number | null;
  partialRDensity: number | null;
  scatterData: Array<{
    areaCode: string;
    areaName: string;
    x: number;
    y: number;
  }>;
}

export async function findHighlyCorrelated(
  rankingKey: string,
  limit = 5,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<CorrelatedItem[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    // 年コードフォーマット違いで同一ペアが複数行存在しうるため、多めに取得して重複排除する
    const FETCH_MULTIPLIER = 3;
    const rawRows = await drizzleDb
      .select({
        rankingKeyX: correlationAnalysis.rankingKeyX,
        rankingKeyY: correlationAnalysis.rankingKeyY,
        pearsonR: correlationAnalysis.pearsonR,
        partialRPopulation: correlationAnalysis.partialRPopulation,
        partialRArea: correlationAnalysis.partialRArea,
        partialRAging: correlationAnalysis.partialRAging,
        partialRDensity: correlationAnalysis.partialRDensity,
        scatterData: correlationAnalysis.scatterData,
      })
      .from(correlationAnalysis)
      .where(
        or(
          eq(correlationAnalysis.rankingKeyX, rankingKey),
          eq(correlationAnalysis.rankingKeyY, rankingKey)
        )
      )
      .orderBy(sql`ABS(${correlationAnalysis.pearsonR}) DESC`)
      .limit(limit * FETCH_MULTIPLIER);

    // counterpart key で重複排除（ABS(pearsonR) DESC ソート済みなので最初の出現が最強相関）
    const seen = new Set<string>();
    const rows = rawRows.filter((row) => {
      const key =
        row.rankingKeyX === rankingKey ? row.rankingKeyY : row.rankingKeyX;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, limit);

    if (rows.length === 0) return ok([]);

    const counterpartKeys = rows.map((row) =>
      row.rankingKeyX === rankingKey ? row.rankingKeyY : row.rankingKeyX
    );

    const itemRows = await drizzleDb
      .select({
        ranking_key: rankingItems.rankingKey,
        title: rankingItems.title,
        subtitle: rankingItems.subtitle,
        unit: rankingItems.unit,
      })
      .from(rankingItems)
      .where(or(...counterpartKeys.map((key) => eq(rankingItems.rankingKey, key))));

    const itemMap = new Map(itemRows.map((item) => [item.ranking_key, item]));

    const results: CorrelatedItem[] = [];
    for (const row of rows) {
      const counterpartKey =
        row.rankingKeyX === rankingKey ? row.rankingKeyY : row.rankingKeyX;
      const item = itemMap.get(counterpartKey);
      if (!item) continue;

      let scatter: CorrelatedItem["scatterData"];
      try {
        const parsed = JSON.parse(row.scatterData) as Array<{
          areaCode: string;
          areaName: string;
          x: number;
          y: number;
        }>;
        if (row.rankingKeyX === rankingKey) {
          scatter = parsed;
        } else {
          scatter = parsed.map((p) => ({
            areaCode: p.areaCode,
            areaName: p.areaName,
            x: p.y,
            y: p.x,
          }));
        }
      } catch {
        scatter = [];
      }

      results.push({
        rankingKey: counterpartKey,
        title: item.title,
        subtitle: item.subtitle,
        unit: item.unit,
        pearsonR: row.pearsonR,
        partialRPopulation: row.partialRPopulation,
        partialRArea: row.partialRArea,
        partialRAging: row.partialRAging,
        partialRDensity: row.partialRDensity,
        scatterData: scatter,
      });
    }

    return ok(results);
  } catch (error) {
    logger.error({ error, rankingKey }, "findHighlyCorrelated: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
