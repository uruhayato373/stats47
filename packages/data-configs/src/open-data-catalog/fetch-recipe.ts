import type { GeographicLevel } from "./types";

type OpenDataFetch =
  | { readonly type: "http-file"; readonly urls: readonly string[] }
  | { readonly type: "http-index"; readonly indexUrl: string; readonly linkPattern: string; readonly maxFiles: number }
  | { readonly type: "ckan"; readonly baseUrl: string; readonly packageId: string; readonly formats: readonly string[] }
  /** 1-based pages, pageSize query parameter; apiKeySecret names a Bearer-token environment variable. */
  | { readonly type: "api-paged"; readonly url: string; readonly pageParam: string; readonly pageSize: number; readonly maxPages: number; readonly apiKeySecret?: string }
  | { readonly type: "skip"; readonly reason: "huge" | "web-only" | "tile-service" | "needs-api-key" | "terms-forbid" | "no-machine-access" | "other"; readonly note: string };

interface OpenDataAreaColumn {
  readonly column: string;
  readonly width?: number;
  /** Capture group 1, then mapping/name resolution, then zero padding. */
  readonly capture?: string;
  readonly prefectureName?: boolean;
  readonly mapping?: { readonly values: Readonly<Record<string, string>>; readonly note: string };
}

/** One column, or ordered components (e.g. prefecture 2 digits + municipality 3 digits). */
type OpenDataNormalizeArea = { readonly level: GeographicLevel } & (
  | (OpenDataAreaColumn & { readonly compose?: never })
  | { readonly compose: readonly (OpenDataAreaColumn & { readonly width: number })[]; readonly column?: never; readonly width?: never }
);

/** CSV/XLSX columns are exact header names; each area emits the same table at that level. */
interface OpenDataNormalizeTable {
  readonly table: string;
  readonly filePattern: string;
  readonly encoding?: "auto" | "utf-8" | "shift_jis";
  readonly xlsx?: {
    /** Exact name or 1-based position; arrays join sheets with identical headers. Row numbers are 1-based. */
    readonly sheet: string | number | readonly (string | number)[];
    /** Multiple rows join distinct nonempty header parts with '/'. */
    readonly headerRow: number | readonly number[];
    readonly dataStartRow: number;
    /** Explicit 1-based column positions for layouts without unique headers. */
    readonly columns?: Readonly<Record<string, number>>;
    /** Repeating blocks: select every nth physical row, beginning at dataStartRow. */
    readonly rowStep?: number;
    /** Inclusive; omitted means the last worksheet row. */
    readonly dataEndRow?: number;
    /** Stop before the first row with a blank cell in this header's column. */
    readonly stopOnBlankColumn?: string;
  };
  /** Non-numeric value cells: skip the observation (after unpivot) at every level, or error (default). */
  readonly nonNumeric?: "skip" | "error";
  readonly areas: readonly OpenDataNormalizeArea[];
  readonly time: string;
  /** Source observation date/year, overriding the fixed time when provided. */
  readonly timeColumn?: string;
  readonly metadataColumns?: Readonly<Record<string, {
    readonly source: "filename" | "sheet";
    readonly pattern: string;
    readonly group?: number;
  }>>;
  /** Applied per source/sheet before row filters and unpivot. */
  readonly fillDown?: readonly string[];
  /** All predicates must match; filters run before unpivot. */
  readonly where?: readonly ({ readonly column: string } & (
    | { readonly equals: string; readonly notEquals?: never; readonly matches?: never }
    | { readonly notEquals: string; readonly equals?: never; readonly matches?: never }
    | { readonly matches: string; readonly equals?: never; readonly notEquals?: never }
  ))[];
  /** Turn selected wide region columns into observations before grouping. */
  readonly unpivot?: {
    readonly columns: Readonly<Record<string, string>>;
    readonly areaColumn: string;
    readonly valueColumn: string;
  };
  readonly dims?: Readonly<Record<string, string | { readonly value: string }>>;
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
