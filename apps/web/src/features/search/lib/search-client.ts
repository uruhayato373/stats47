import MiniSearch from "minisearch";
import type {
    SearchDocument,
    SearchOptions,
    SearchResponse,
} from "../types/search.types";
import { buildSearchResponse, MINISEARCH_OPTIONS, STORE_FIELDS } from "./search-core";
import { tokenize } from "./tokenize";

const SEARCH_INDEX_URL = "/search-index.json";

let miniSearchInstance: MiniSearch<SearchDocument> | null = null;

/**
 * 検索インデックスを取得する（シングルトン）。初回は fetch して復元する。
 */
export async function getSearchInstance(): Promise<MiniSearch<SearchDocument>> {
  if (miniSearchInstance) return miniSearchInstance;

  const res = await fetch(SEARCH_INDEX_URL);
  if (!res.ok) {
    throw new Error(`検索インデックスの取得に失敗しました: ${res.status}`);
  }
  const json = await res.json();

  miniSearchInstance = MiniSearch.loadJS(json, {
    ...MINISEARCH_OPTIONS,
    storeFields: STORE_FIELDS,
    tokenize,
  });

  return miniSearchInstance;
}

/**
 * クエリでドキュメントを検索し、オプションでタイプ・カテゴリ・サブカテゴリでフィルタする。
 */
export async function searchDocuments(
  query: string,
  options?: SearchOptions
): Promise<SearchResponse> {
  if (!query.trim()) {
    return { results: [], total: 0, query, options };
  }

  const ms = await getSearchInstance();
  const rawResults = ms.search(query, { prefix: true, fuzzy: 0.2 });

  return buildSearchResponse(rawResults, query, options);
}
