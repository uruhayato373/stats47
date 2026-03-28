import "server-only";

/**
 * サーバーサイド検索ユーティリティ
 *
 * ビルド時に生成された search-index.json を静的インポートし、
 * Server Component から MiniSearch 検索を実行する。
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

// Static imports — bundled at build time
 
// eslint-disable-next-line @typescript-eslint/no-require-imports
const searchIndexMetaJson = require("../../../../public/search-index-meta.json");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const searchIndexJson = require("../../../../public/search-index.json");

let cachedInstance: MiniSearch<SearchDocument> | null = null;

function getServerSearchInstance(): MiniSearch<SearchDocument> {
  if (cachedInstance) return cachedInstance;
  cachedInstance = MiniSearch.loadJS(searchIndexJson, {
    ...MINISEARCH_OPTIONS,
    storeFields: STORE_FIELDS,
    tokenize,
  });
  return cachedInstance;
}

/**
 * サーバーサイドでドキュメントを検索する
 */
export function searchDocumentsServer(
  query: string,
  options?: SearchOptions
): SearchResponse {
  if (!query.trim()) {
    return { results: [], total: 0, query, options };
  }

  const ms = getServerSearchInstance();
  const rawResults = ms.search(query, { prefix: true, fuzzy: 0.2 });

  return buildSearchResponse(rawResults, query, options);
}

/**
 * フィルタ用メタデータを取得する
 */
export function getSearchIndexMeta(): SearchIndexMeta {
  return searchIndexMetaJson as SearchIndexMeta;
}
