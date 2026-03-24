/**
 * Cloudflare D1 APIを使用したリモートD1データベース接続
 */

import { logger } from "@stats47/logger";
import {
    asD1Database,
    type D1Adapter,
    type D1PreparedStatementAdapter
} from "../types";
import { err, ok, type Result } from "../utils/result";

import type { D1Database } from "@cloudflare/workers-types";

// Helper for dev environment check (since we are in a package, use process.env directly)
const isDevelopment = () => process.env.NODE_ENV === "development";

/**
 * 環境別のデータベースIDを取得
 */
function getDatabaseId(
  environment: "production"
): string {
  const envVarName = "CLOUDFLARE_D1_STATIC_DATABASE_ID_PRODUCTION";

  const databaseId = process.env[envVarName];

  if (!databaseId) {
    const error = `${envVarName}環境変数が設定されていません`;
    logger.error(
      {
        environment,
        envVarName,
        hasEnvVar: !!process.env[envVarName],
      },
      error
    );
    throw new Error(error);
  }

  return databaseId;
}

/**
 * Cloudflare D1 APIのクエリエンドポイント
 */
function getQueryEndpoint(accountId: string, databaseId: string): string {
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
}

/**
 * Cloudflare D1 APIを使用してSQLクエリを実行
 */
async function executeQuery(
  sql: string,
  params: unknown[],
  environment: "production"
): Promise<Result<unknown[], Error>> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    const errorMessage = "Cloudflare API credentials missing (CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN)";
    logger.error({ environment }, errorMessage);
    return err(new Error(errorMessage));
  }

  let databaseId: string;
  try {
    databaseId = getDatabaseId(environment);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }

  const url = getQueryEndpoint(accountId, databaseId);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sql,
        params: params.length > 0 ? params : undefined,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, errorText }, "D1 API Request Failed");
      return err(new Error(`D1 API request failed: ${response.status} ${response.statusText}`));
    }

    const data: any = await response.json();

    // Parse response logic (simplified from original for brevity but keeping core logic)
    let results: unknown[] = [];
    let success = false;

    if (Array.isArray(data)) {
      if (data.length > 0 && data[0]?.results) {
        results = data[0].results;
        success = data[0].success ?? true;
      }
    } else if (data && typeof data === "object") {
       if (data.result) {
         // Standard API response wrapper
         const inner = data.result;
         if (Array.isArray(inner) && inner[0]?.results) {
            results = inner[0].results;
         } else if (inner.results) {
            results = inner.results;
         }
         success = data.success;
       } else if (data.results) {
         results = data.results;
         success = data.success ?? true;
       }
    }

    if (!success) {
      return err(new Error(`Query failed: ${JSON.stringify(data).substring(0, 200)}`));
    }

    return ok(results);

  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return err(new Error("Request timeout (30s)"));
    }
    logger.error({ error }, "D1 API Execution Error");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * リモートD1データベース接続を作成
 */
export function createRemoteD1(
  environment: "production"
): D1Database {
  const createStmt = (sql: string, ...boundArgs: unknown[]): D1PreparedStatementAdapter => {
    return {
      all: async <T = Record<string, unknown>>() => {
        const result = await executeQuery(sql, boundArgs, environment);
        if (result.success) {
          return {
            results: result.data as T[],
            success: true,
            columns: [],
            meta: { changes: 0, last_insert_rowid: 0, duration: 0, served_by: "remote-d1", rows_read: 0, rows_written: 0 }
          };
        } else {
           throw result.error;
        }
      },
      first: async <T = Record<string, unknown>>() => {
        const result = await executeQuery(sql, boundArgs, environment);
        if (result.success && result.data.length > 0) {
          return (result.data[0] as T) || null;
        }
        return null;
      },
      run: async () => {
        const result = await executeQuery(sql, boundArgs, environment);
        if (result.success) {
          return {
            success: true,
            meta: { changes: 0, last_insert_rowid: 0 },
            results: []
          };
        } else {
           throw result.error;
        }
      },
      bind: (...args: unknown[]): D1PreparedStatementAdapter => {
        return createStmt(sql, ...boundArgs, ...args);
      },
      raw: async <T = unknown>() => {
         const result = await executeQuery(sql, boundArgs, environment);
         if (result.success) return Object.values(result.data) as any[]; // Simplistic
         throw result.error;
      }
    };
  };

  const adapter: D1Adapter = {
    prepare: (sql: string) => createStmt(sql),
    exec: async () => { throw new Error("exec() not supported remotely"); },
    dump: async () => { throw new Error("dump() not supported remotely"); },
    batch: async () => { throw new Error("batch() not supported remotely"); }
  };

  return asD1Database(adapter);
}
