import "server-only";

import {
  correlations,
  getDrizzle,
  metrics,
} from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { aliasedTable, and, eq, inArray, or, sql } from "drizzle-orm";

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

    // まず rankingKey から metric_id を取得 (prefecture 仮定)
    const subjectRows = await drizzleDb
      .select({ id: metrics.id })
      .from(metrics)
      .where(and(eq(metrics.key, rankingKey), eq(metrics.areaType, "prefecture")))
      .limit(1);
    const subjectId = subjectRows[0]?.id;
    if (!subjectId) return ok([]);

    const ix = aliasedTable(metrics, "ix");
    const iy = aliasedTable(metrics, "iy");

    const FETCH_MULTIPLIER = 3;
    const rawRows = await drizzleDb
      .select({
        rankingKeyX: ix.key,
        rankingKeyY: iy.key,
        pearsonR: correlations.pearsonR,
        partialRPopulation: correlations.partialRPopulation,
        partialRArea: correlations.partialRArea,
        partialRAging: correlations.partialRAging,
        partialRDensity: correlations.partialRDensity,
        scatterData: correlations.scatterDataJson,
      })
      .from(correlations)
      .innerJoin(ix, eq(correlations.metricXId, ix.id))
      .innerJoin(iy, eq(correlations.metricYId, iy.id))
      .where(
        or(
          eq(correlations.metricXId, subjectId),
          eq(correlations.metricYId, subjectId)
        )
      )
      .orderBy(sql`ABS(${correlations.pearsonR}) DESC`)
      .limit(limit * FETCH_MULTIPLIER);

    // counterpart key で重複排除
    const seen = new Set<string>();
    const rows = rawRows.filter((row) => {
      const key = row.rankingKeyX === rankingKey ? row.rankingKeyY : row.rankingKeyX;
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
        ranking_key: metrics.key,
        title: metrics.title,
        subtitle: metrics.subtitle,
        unit: metrics.unit,
      })
      .from(metrics)
      .where(
        and(inArray(metrics.key, counterpartKeys), eq(metrics.areaType, "prefecture"))
      );

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
