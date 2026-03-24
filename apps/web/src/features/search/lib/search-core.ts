import type {
  SearchDocument,
  SearchOptions,
  SearchResponse,
  SearchResult,
} from "../types/search.types";

export const STORE_FIELDS: string[] = [
  "id",
  "title",
  "description",
  "type",
  "url",
  "category",
  "categoryKey",
  "tags",
  "subtitle",
  "demographicAttr",
  "normalizationBasis",
  "latestYear",
  "publishedAt",
  "updatedAt",
];

export const MINISEARCH_OPTIONS = {
  fields: ["title", "description"] as string[],
  searchOptions: {
    boost: { title: 3 },
    fuzzy: 0.2,
    prefix: true,
  },
};

type RawResult = SearchDocument & {
  score?: number;
  subtitle?: string;
  demographicAttr?: string;
  normalizationBasis?: string;
  latestYear?: string;
  tags?: string[];
};

/**
 * MiniSearch の生結果をフィルタリング・ページネーション・マッピングして SearchResponse を返す。
 * search-client / search-server の共通ロジック。
 */
export function buildSearchResponse(
  rawResults: unknown[],
  query: string,
  options?: SearchOptions,
): SearchResponse {
  let filtered = rawResults as RawResult[];

  if (options?.type) {
    filtered = filtered.filter((r) => r.type === options.type);
  }
  if (options?.category) {
    filtered = filtered.filter((r) => r.categoryKey === options.category);
  }
  if (options?.tags && options.tags.length > 0) {
    filtered = filtered.filter((r) => {
      if (!r.tags) return false;
      return options.tags!.some((t) => r.tags!.includes(t));
    });
  }
  if (options?.year) {
    filtered = filtered.filter(
      (r) => r.publishedAt?.slice(0, 4) === options.year,
    );
  }
  if (options?.month) {
    filtered = filtered.filter((r) => {
      if (!r.publishedAt) return false;
      return (
        String(Number.parseInt(r.publishedAt.slice(5, 7), 10)) === options.month
      );
    });
  }

  const limit = options?.limit ?? filtered.length;
  const offset = options?.offset ?? 0;
  const paginated = filtered.slice(offset, offset + limit);

  const results: SearchResult[] = paginated.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    type: r.type,
    url: r.url,
    category: r.category,
    tags: r.tags,
    subtitle: r.subtitle,
    demographicAttr: r.demographicAttr,
    normalizationBasis: r.normalizationBasis,
    latestYear: r.latestYear,
    score: r.score,
    publishedAt: r.publishedAt,
    updatedAt: r.updatedAt,
  }));

  return { results, total: filtered.length, query, options };
}
