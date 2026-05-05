import "server-only";

import { metricTexts, getDrizzle, metrics } from "@stats47/database/server";
import { eq } from "drizzle-orm";

import type { AiContentSnapshotRow } from "../types/snapshot";

export async function findRankingAiContent(
  rankingKey: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<AiContentSnapshotRow | null> {
  const drizzleDb = db ?? getDrizzle();

  const rows = await drizzleDb
    .select({
      rankingKey: metrics.key,
      yearCode: metricTexts.yearCode,
      faq: metricTexts.faq,
      regionalAnalysis: metricTexts.regionalAnalysis,
      insights: metricTexts.insights,
      createdAt: metricTexts.createdAt,
      updatedAt: metricTexts.updatedAt,
    })
    .from(metricTexts)
    .innerJoin(metrics, eq(metricTexts.metricKey, metrics.key))
    .where(eq(metrics.key, rankingKey))
    .limit(1);

  return rows[0] ?? null;
}
