// e-Stat API (getStatsList / getMetaInfo) の薄い fetch 層。
// 素 fetch + 独自ヘルパーで完結させる (packages/estat-api は logger/R2 依存が重く
// .claude/scripts では避ける方針 — 既存の fetch-estat-meta.mjs 等と同じ)。
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ProxyAgent } from "undici";

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), "..", "..", "..", "..");

config({ path: path.join(PROJECT_ROOT, ".env.local") });

const LIST_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList";
const META_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo";
const LIST_BATCH_SIZE = 10000;
const RETRY_COUNT = 3;
const RETRY_BASE_DELAY_MS = 1000;

export function getAppId() {
  const appId = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
  if (!appId) {
    throw new Error("NEXT_PUBLIC_ESTAT_APP_ID が未設定 (ローカル: .env.local / CI: vars)");
  }
  return appId;
}

function fetchOpts() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  return proxyUrl ? { dispatcher: new ProxyAgent(proxyUrl) } : {};
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, label) {
  let lastErr;
  for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < RETRY_COUNT) await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }
  throw new Error(`${label} failed after ${RETRY_COUNT} attempts: ${lastErr?.message ?? lastErr}`);
}

/** getStatsList を 1 ページ取得する。生の TABLE_INF 配列と NEXT_KEY を返す */
export async function fetchStatsListPage(collectArea, startPosition, appId = getAppId()) {
  return withRetry(async () => {
    const params = new URLSearchParams({
      appId,
      lang: "J",
      collectArea: String(collectArea),
      limit: String(LIST_BATCH_SIZE),
      startPosition: String(startPosition),
    });
    const res = await fetch(`${LIST_URL}?${params.toString()}`, fetchOpts());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const datalist = json?.GET_STATS_LIST?.DATALIST_INF;
    if (!datalist) {
      const errMsg = json?.GET_STATS_LIST?.RESULT?.ERROR_MSG;
      if (errMsg && /該当するデータが存在しません|該当データはありませんでした/.test(errMsg)) {
        return { tables: [], total: 0, nextKey: null };
      }
      throw new Error(`unexpected response: ${JSON.stringify(json).slice(0, 200)}`);
    }
    const raw = datalist.TABLE_INF;
    const tables = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
    return { tables, total: datalist.NUMBER, nextKey: datalist.RESULT_INF?.NEXT_KEY ?? null };
  }, `getStatsList(collectArea=${collectArea}, startPosition=${startPosition})`);
}

/**
 * getStatsList を全ページ収集する。1 ページごとに onPage を呼ぶ (呼び出し側で delay を挟める)。
 * @returns {Promise<object[]>} 生の TABLE_INF 行の配列 (未正規化)
 */
export async function listAllTables(collectArea, { delayMs = 300, onPage } = {}) {
  const rows = [];
  let startPosition = 1;
  while (true) {
    const { tables, nextKey } = await fetchStatsListPage(collectArea, startPosition);
    rows.push(...tables);
    if (onPage) onPage({ collectArea, count: rows.length, page: tables.length });
    if (tables.length === 0 || !nextKey) break;
    startPosition = nextKey;
    await sleep(delayMs);
  }
  return rows;
}

/** getMetaInfo を 1 件取得する。エラー時は例外を投げる (呼び出し側で manifest.failed に記録する) */
export async function fetchMetaInfo(statsDataId, appId = getAppId()) {
  return withRetry(async () => {
    const params = new URLSearchParams({ appId, lang: "J", statsDataId });
    const res = await fetch(`${META_URL}?${params.toString()}`, fetchOpts());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const result = json?.GET_META_INFO?.RESULT;
    if (result && Number(result.STATUS) !== 0 && !json?.GET_META_INFO?.METADATA_INF) {
      throw new Error(result.ERROR_MSG ?? `STATUS ${result.STATUS}`);
    }
    if (!json?.GET_META_INFO?.METADATA_INF) throw new Error("no METADATA_INF in response");
    return json;
  }, `getMetaInfo(${statsDataId})`);
}
