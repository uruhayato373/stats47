import type { GeographicLevel } from "./types";

export type OpenDataFetch =
  | { readonly type: "http-file"; readonly urls: readonly string[] }
  | { readonly type: "http-index"; readonly indexUrl: string; readonly linkPattern: string; readonly maxFiles: number }
  | { readonly type: "ckan"; readonly baseUrl: string; readonly packageId: string; readonly formats: readonly string[] }
  /** 1-based pages, pageSize query parameter; apiKeySecret names a Bearer-token environment variable. */
  | { readonly type: "api-paged"; readonly url: string; readonly pageParam: string; readonly pageSize: number; readonly maxPages: number; readonly apiKeySecret?: string }
  | { readonly type: "skip"; readonly reason: "huge" | "web-only" | "tile-service" | "needs-api-key" | "terms-forbid" | "no-machine-access" | "other"; readonly note: string };

export interface OpenDataAreaColumn {
  readonly column: string;
  readonly width?: number;
}

/** One column, or ordered components (e.g. prefecture 2 digits + municipality 3 digits). */
export type OpenDataNormalizeArea = { readonly level: GeographicLevel } & (
  | (OpenDataAreaColumn & { readonly compose?: never })
  | { readonly compose: readonly (OpenDataAreaColumn & { readonly width: number })[]; readonly column?: never; readonly width?: never }
);

/** CSV columns are exact header names; each area declaration emits the same table at that level. */
export interface OpenDataNormalizeTable {
  readonly table: string;
  readonly filePattern: string;
  readonly encoding?: "auto" | "utf-8" | "shift_jis";
  readonly areas: readonly OpenDataNormalizeArea[];
  readonly time: string;
  readonly dims?: Readonly<Record<string, string>>;
  readonly aggregation: "count" | "sum";
  readonly valueColumn?: string;
  readonly unit: string;
}

export interface OpenDataFetchRecipe {
  readonly datasetId: string;
  readonly fetch: OpenDataFetch;
  /** latest-published-at resolves strictly from the catalog, never the clock. */
  readonly version: string;
  readonly maxBytes?: number;
  readonly normalize?: { readonly tables: readonly OpenDataNormalizeTable[] };
}
