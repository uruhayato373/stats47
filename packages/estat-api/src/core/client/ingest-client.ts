/** Node-only bulk ingestion entry. No cache writes and no import-time credentials/network. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ESTAT_API, ESTAT_ENDPOINTS } from "../config/index";
import { EstatApiError } from "../errors/index";
import { executeWithRetry } from "../utils/retry";
import { buildRequestParams } from "../../stats-data/repositories/api/build-request-params";
import type { EstatStatsDataResponse, EstatValue, GetStatsDataParams } from "../../stats-data/types";

export const ESTAT_PAGE_LIMIT = 100_000;
export const ESTAT_MAX_CONCURRENCY = 4;
const ENV_FILE = fileURLToPath(new URL("../../../../../apps/web/.env.development", import.meta.url));

export function resolveEstatAppId(env: NodeJS.ProcessEnv = process.env, envFile = ENV_FILE): string {
  if (env.NEXT_PUBLIC_ESTAT_APP_ID?.trim()) return env.NEXT_PUBLIC_ESTAT_APP_ID.trim();
  let text: string;
  try { text = readFileSync(envFile, "utf8"); } catch { throw new Error("NEXT_PUBLIC_ESTAT_APP_ID is absent from env and apps/web/.env.development"); }
  const match = text.match(/^\s*(?:export\s+)?NEXT_PUBLIC_ESTAT_APP_ID\s*=\s*(?:"([^"\r\n]*)"|'([^'\r\n]*)'|([^#\r\n]*))/m);
  const id = (match?.[1] ?? match?.[2] ?? match?.[3])?.trim();
  if (!id) throw new Error("NEXT_PUBLIC_ESTAT_APP_ID is absent from apps/web/.env.development");
  return id;
}

// Shared across clients, including retry attempts. A released slot is handed directly to its waiter.
let active = 0;
const waiters: (() => void)[] = [];
async function withRequestSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (active < ESTAT_MAX_CONCURRENCY) active++;
  else await new Promise<void>((resolve) => waiters.push(resolve));
  try { return await fn(); } finally {
    const next = waiters.shift();
    if (next) next(); else active--;
  }
}

type ObjectValue = Record<string, unknown>;
function record(value: unknown): ObjectValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Malformed e-Stat response");
  return value as ObjectValue;
}
function integer(value: unknown, name: string): number {
  if (value === null || value === undefined || value === "") throw new Error(`Missing ${name}`);
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error(`Invalid ${name}`);
  return n;
}

/** API may echo appId in PARAMETER. Never persist credentials, even in an error body. */
function removeCredentials(value: unknown, appId: string): unknown {
  if (typeof value === "string") return value.split(appId).join("[REDACTED]");
  if (Array.isArray(value)) return value.map((v) => removeCredentials(v, appId));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !/^(app_?id|application_?id)$/i.test(key))
    .map(([key, child]) => [key, removeCredentials(child, appId)]));
}

export interface IngestResult {
  params: GetStatsDataParams;
  response: EstatStatsDataResponse | null;
  rowCount: number;
  requestCount: number;
}
export interface EstatIngestClient {
  fetchAll(params: GetStatsDataParams): Promise<IngestResult>;
}

export function createEstatIngestClient(options: {
  appId?: string;
  fetch?: typeof fetch;
  maxRetries?: number;
  initialDelay?: number;
} = {}): EstatIngestClient {
  const appId = options.appId ?? resolveEstatAppId();
  if (!appId.trim()) throw new Error("Empty e-Stat app ID");
  const transport = options.fetch ?? globalThis.fetch;
  const endpoint = `${ESTAT_API.BASE_URL}${ESTAT_ENDPOINTS.GET_STATS_DATA}`;

  return {
    async fetchAll(input) {
      if (!/^\d{10}$/.test(input.statsDataId)) throw new Error("Invalid statsDataId");
      if (input.startPosition !== undefined && input.startPosition !== 1) throw new Error("fetchAll must start at 1");
      const limit = Math.min(input.limit ?? ESTAT_PAGE_LIMIT, ESTAT_PAGE_LIMIT);
      if (!Number.isInteger(limit) || limit < 1) throw new Error("Invalid page limit");
      const params: GetStatsDataParams = { ...input, limit, startPosition: 1, metaGetFlg: "Y", cntGetFlg: "N",
        explanationGetFlg: "Y", annotationGetFlg: "Y", replaceSpChars: "0", lang: input.lang ?? "J" };
      // Reject accidental runtime credentials/unknown options instead of serializing them into envelopes.
      for (const key of Object.keys(params)) {
        if (!/^(statsDataId|limit|startPosition|lang|metaGetFlg|cntGetFlg|explanationGetFlg|annotationGetFlg|replaceSpChars|(?:cd|lv)(?:Tab|Area|Time|Cat\d+)(?:From|To)?)$/.test(key)) {
          throw new Error("Unknown e-Stat ingestion parameter");
        }
      }
      let first: EstatStatsDataResponse | undefined;
      const values: EstatValue[] = [];
      let expectedTotal: number | undefined;
      let startPosition = 1;
      let requestCount = 0;
      const seen = new Set<number>();
      while (true) {
        if (seen.has(startPosition)) throw new Error("Repeated NEXT_KEY");
        seen.add(startPosition);
        const page = await executeWithRetry(() => withRequestSlot(async () => {
          const requestParams = buildRequestParams({ ...params, startPosition }, appId);
          const url = new URL(endpoint);
          for (const [key, value] of Object.entries(requestParams)) if (value !== undefined) url.searchParams.set(key, String(value));
          let response: Response;
          requestCount++;
          try { response = await transport(url, { method: "GET", redirect: "error", signal: AbortSignal.timeout(120_000) }); }
          catch { throw new EstatApiError("e-Stat network/timeout failure", "NETWORK"); }
          if (!response.ok) throw new EstatApiError(`e-Stat HTTP ${response.status}`, "HTTP", undefined, response.status);
          let raw: unknown;
          try { raw = await response.json(); } catch { throw new Error("Malformed e-Stat JSON"); }
          return record(removeCredentials(raw, appId));
        }), {
          maxRetries: options.maxRetries ?? 3, initialDelay: options.initialDelay ?? 2000,
          isRetryable: (error) => error instanceof EstatApiError &&
            (error.code === "NETWORK" || error.statusCode === 429 || (error.statusCode !== undefined && error.statusCode >= 500)),
        });
        const root = record(page.GET_STATS_DATA);
        const status = integer(record(root.RESULT).STATUS, "STATUS");
        if (status === 1 && !first) return { params, response: null, rowCount: 0, requestCount };
        if (status !== 0) throw new Error(`e-Stat STATUS=${status}`);
        const data = record(root.STATISTICAL_DATA);
        const table = record(data.TABLE_INF);
        if (table["@id"] !== input.statsDataId) throw new Error("Response table mismatch");
        const info = record(data.RESULT_INF);
        const total = integer(info.TOTAL_NUMBER, "TOTAL_NUMBER");
        if (expectedTotal !== undefined && total !== expectedTotal) throw new Error("TOTAL_NUMBER changed during pagination");
        expectedTotal = total;
        if (first && first.GET_STATS_DATA.STATISTICAL_DATA.TABLE_INF.UPDATED_DATE !== table.UPDATED_DATE) throw new Error("Table version changed during pagination");
        const value = record(data.DATA_INF).VALUE;
        const rows = value == null ? [] : Array.isArray(value) ? value : [value];
        for (const row of rows) if (typeof record(row).$ !== "string") throw new Error("Malformed VALUE row");
        if (rows.length > limit) throw new Error("API exceeded requested page limit");
        if (integer(info.FROM_NUMBER, "FROM_NUMBER") !== startPosition || integer(info.TO_NUMBER, "TO_NUMBER") !== startPosition + rows.length - 1) throw new Error("Inconsistent page positions");
        // Shape checked above; preserve all original metadata and VALUE attributes.
        const typed = page as unknown as EstatStatsDataResponse;
        first ??= typed;
        for (const row of rows as EstatValue[]) values.push(row);
        const next = info.NEXT_KEY;
        if (next === undefined || next === null || next === "") break;
        const n = integer(next, "NEXT_KEY");
        if (!rows.length || n !== startPosition + rows.length || n > total) throw new Error("Invalid/non-advancing NEXT_KEY");
        startPosition = n;
      }
      if (!first || values.length !== expectedTotal) throw new Error(`Incomplete table: ${values.length}/${expectedTotal ?? "unknown"}`);
      const original = first.GET_STATS_DATA.STATISTICAL_DATA;
      const response: EstatStatsDataResponse = { ...first, GET_STATS_DATA: { ...first.GET_STATS_DATA,
        STATISTICAL_DATA: { ...original, RESULT_INF: { TOTAL_NUMBER: values.length, FROM_NUMBER: 1, TO_NUMBER: values.length },
          DATA_INF: { ...original.DATA_INF, VALUE: values } } } };
      return { params, response, rowCount: values.length, requestCount };
    },
  };
}
