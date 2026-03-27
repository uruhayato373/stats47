import "server-only";

import {
  correlationAnalysis,
  getDrizzle,
} from "@stats47/database/server";
import { count, sql } from "drizzle-orm";

/**
 * 相関分析結果の件数を取得する
 */
export async function countCorrelationAnalysis(): Promise<number> {
  const { total } = await countCorrelationStats();
  return total;
}

/**
 * 強い相関（|pearson_r| >= 0.7）の件数を取得する
 */
export async function countStrongCorrelations(): Promise<number> {
  const { strong } = await countCorrelationStats();
  return strong;
}

/**
 * 全件数と強い相関の件数を 1 クエリで取得する
 */
export async function countCorrelationStats(): Promise<{
  total: number;
  strong: number;
}> {
  const db = getDrizzle();
  const result = await db
    .select({
      total: count(),
      strong:
        sql<number>`SUM(CASE WHEN ABS(${correlationAnalysis.pearsonR}) >= 0.7 THEN 1 ELSE 0 END)`,
    })
    .from(correlationAnalysis);
  return {
    total: result[0]?.total ?? 0,
    strong: result[0]?.strong ?? 0,
  };
}
