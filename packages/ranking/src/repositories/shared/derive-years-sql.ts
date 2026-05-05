import "server-only";

import { metrics } from "@stats47/database/server";
import { sql, type SQL } from "drizzle-orm";

/**
 * metrics.key を使い、stats から
 * latest_year / available_years JSON を動的計算する SQL fragment を返す。
 *
 * yearName は "年度" で統一。10-char e-Stat 生コード ("2023100000") は
 * substr で 4-char に正規化する。
 *
 * 旧 metrics.latest_year / available_years_json (cache 列) の置換。
 */
export const latestYearSql: SQL<string | null> = sql<string | null>`(
  SELECT CASE WHEN COUNT(*) = 0 THEN NULL ELSE json_object(
    'yearCode', substr(MAX(year_code), 1, 4),
    'yearName', substr(MAX(year_code), 1, 4) || '年度'
  ) END
  FROM stats_prefecture WHERE metric_key = ${metrics.key}
)`;

export const availableYearsSql: SQL<string | null> = sql<string | null>`(
  SELECT json_group_array(json_object(
    'yearCode', year_code_4,
    'yearName', year_code_4 || '年度'
  ))
  FROM (
    SELECT DISTINCT substr(year_code, 1, 4) AS year_code_4
    FROM stats_prefecture WHERE metric_key = ${metrics.key}
    ORDER BY year_code_4 DESC
  )
)`;
