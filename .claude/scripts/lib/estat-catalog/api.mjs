// Catalog adapters retain their public shapes; transport and credentials use the ingestion entry.
import { createRequire } from "node:module";
import { ProxyAgent } from "undici";
const require = createRequire(import.meta.url);
const { require: tsRequire } = require("tsx/cjs/api");
const { createEstatRequestClient, resolveEstatAppId } = tsRequire("../../../../packages/estat-api/src/ingest.ts", import.meta.url);
export { ESTAT_STATS_LIST_URL, ESTAT_META_INFO_URL, ESTAT_STATS_DATA_URL } from "./endpoints.cjs";
export const getAppId = resolveEstatAppId;
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const LIST_BATCH_SIZE = 10000;
let proxyAgent;
function request(appId) {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (proxyUrl) proxyAgent ??= new ProxyAgent(proxyUrl);
  return createEstatRequestClient({ appId, fetch: (url, options) =>
    globalThis.fetch(url, { ...options, ...(proxyUrl ? { dispatcher: proxyAgent } : {}) }) });
}

export async function fetchStatsListPage(collectArea, startPosition, appId = getAppId()) {
  const json = await request(appId)("GET_STATS_LIST", { lang: "J", limit: LIST_BATCH_SIZE,
    startPosition, ...(collectArea == null ? {} : { collectArea: String(collectArea) }) });
  const root = json?.GET_STATS_LIST;
  if (Number(root?.RESULT?.STATUS) === 1) return { tables: [], total: 0, nextKey: null };
  const datalist = root?.DATALIST_INF;
  if (Number(root?.RESULT?.STATUS) !== 0 || !datalist) throw new Error("Invalid getStatsList response");
  const raw = datalist.TABLE_INF;
  return { tables: raw ? (Array.isArray(raw) ? raw : [raw]) : [],
    total: datalist.NUMBER, nextKey: datalist.RESULT_INF?.NEXT_KEY ?? null };
}

/**
 * getStatsList を全ページ収集する。1 ページごとに onPage を呼ぶ (呼び出し側で delay を挟める)。
 * @param {string|number|null} collectArea null なら全表
 * @param {{ delayMs?: number, onPage?: (info: any) => unknown }} [options]
 * @returns {Promise<{ rows: object[], total: number | null }>} 生の TABLE_INF 行 (未正規化) と、最初のページが示した総件数 (NUMBER)
 */
export async function listAllTables(collectArea, { delayMs = 300, onPage } = {}) {
  const rows = [];
  let total = null;
  let startPosition = 1;
  while (true) {
    const page = await fetchStatsListPage(collectArea, startPosition);
    const { tables, nextKey } = page;
    if (total === null && page.total != null) total = Number(page.total);
    rows.push(...tables);
    if (onPage) onPage({ collectArea, count: rows.length, page: tables.length });
    if (tables.length === 0 || !nextKey) break;
    const next = Number(nextKey);
    if (!Number.isSafeInteger(next) || next <= startPosition) throw new Error("Invalid/non-advancing NEXT_KEY");
    startPosition = next;
    await sleep(delayMs);
  }
  return { rows, total };
}

export async function fetchMetaInfo(statsDataId, appId = getAppId()) {
  const json = await request(appId)("GET_META_INFO", { lang: "J", statsDataId });
  if (Number(json?.GET_META_INFO?.RESULT?.STATUS) !== 0 || !json?.GET_META_INFO?.METADATA_INF) {
    throw new Error("Invalid getMetaInfo response");
  }
  return json;
}

/** Page adapter: existing callers that paginate retain their NEXT_KEY contract. */
export async function fetchStatsData(params, appId = getAppId()) {
  const json = await request(appId)("GET_STATS_DATA", { lang: "J", ...params });
  if (Number(json?.GET_STATS_DATA?.RESULT?.STATUS) !== 0 || !json?.GET_STATS_DATA?.STATISTICAL_DATA) {
    throw new Error("Invalid getStatsData response");
  }
  return json;
}
