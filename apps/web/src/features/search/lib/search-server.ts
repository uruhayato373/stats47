import "server-only";

/**
 * サーバーサイド検索ユーティリティ
 *
 * 検索インデックス (search-index.json / search-index-meta.json) は public 静的
 * アセットとして配信され、クライアント (search-client) も同じ URL を fetch する。
 * 旧来はサーバーで `require()` して 1.35MB を Worker サーバーバンドルに焼き込んでいたが、
 * Worker サイズ / cold-start 削減のため **runtime fetch + isolate キャッシュ** に変更した。
 * 同一オリジンの CDN 配信アセットを取得するだけなので追加コストは isolate ごと 1 回。
 */
import MiniSearch from "minisearch";

import { buildSearchResponse, MINISEARCH_OPTIONS, STORE_FIELDS } from "./search-core";
import { tokenize } from "./tokenize";

import type {
  SearchDocument,
  SearchIndexMeta,
  SearchOptions,
  SearchResponse,
} from "../types/search.types";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.jp";
const SEARCH_INDEX_URL = `${BASE_URL}/search-index.json`;
const SEARCH_INDEX_META_URL = `${BASE_URL}/search-index-meta.json`;

const EMPTY_META: SearchIndexMeta = { categories: [], blogTags: [], blogYears: [] };

// MiniSearch instance は tokenizer closure を含み JSON 直列化不可のため Next.js の
// unstable_cache は使えない。fetch + deserialize を isolate 単位で 1 回に抑えるため
// Promise をモジュールスコープにキャッシュする (index は deploy ごとに不変、isolate は
// deploy ごとに作り直されるため stale にならない)。fetch 失敗時はサーバー検索を degrade
// し (results 空 / meta 空)、クライアント側検索が補完する — クラッシュさせない。
let instancePromise: Promise<MiniSearch<SearchDocument> | null> | null = null;
let metaPromise: Promise<SearchIndexMeta> | null = null;

async function loadServerSearchInstance(): Promise<MiniSearch<SearchDocument> | null> {
  try {
    const res = await fetch(SEARCH_INDEX_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return MiniSearch.loadJS(json, {
      ...MINISEARCH_OPTIONS,
      storeFields: STORE_FIELDS,
      tokenize,
    });
  } catch {
    return null;
  }
}

function getServerSearchInstance(): Promise<MiniSearch<SearchDocument> | null> {
  if (!instancePromise) instancePromise = loadServerSearchInstance();
  return instancePromise;
}

/**
 * サーバーサイドでドキュメントを検索する
 */
export async function searchDocumentsServer(
  query: string,
  options?: SearchOptions
): Promise<SearchResponse> {
  if (!query.trim()) {
    return { results: [], total: 0, query, options };
  }

  const ms = await getServerSearchInstance();
  if (!ms) {
    // index fetch 失敗時はサーバー検索を degrade (クライアント側検索が補完)
    return { results: [], total: 0, query, options };
  }
  const rawResults = ms.search(query, { prefix: true, fuzzy: 0.2 });

  return buildSearchResponse(rawResults, query, options);
}

/**
 * フィルタ用メタデータを取得する
 */
export async function getSearchIndexMeta(): Promise<SearchIndexMeta> {
  if (!metaPromise) {
    metaPromise = (async () => {
      try {
        const res = await fetch(SEARCH_INDEX_META_URL, { cache: "no-store" });
        if (!res.ok) return EMPTY_META;
        return (await res.json()) as SearchIndexMeta;
      } catch {
        return EMPTY_META;
      }
    })();
  }
  return metaPromise;
}
