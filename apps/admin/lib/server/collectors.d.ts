/**
 * Ambient 型宣言: 共有 collector (.claude/scripts/lib/*.mjs) の必要 export のみ型付け。
 * これらは ESM・__dirname 非依存の純関数で、削除禁止 (CI 静的ギャラリーと共用)。
 *
 * import 側 (collectors.ts) は projectRoot 相対 (apps/admin/lib/server → root は "../../../..")
 * の 4 階層上を参照する。パスは相対 import と一致させる。
 */

interface AssetImage {
  variant: string;
  url: string | null;
  local?: boolean;
}

interface AssetEntry {
  key: string;
  label: string;
  pageUrl: string | null;
  images: AssetImage[];
  [key: string]: unknown;
}

interface TabResult {
  source: string;
  aspect: string;
  r2KeyPattern: string;
  entries: AssetEntry[];
  [key: string]: unknown;
}

interface BuildTabOpts {
  limit?: number | null;
  all?: boolean;
  site: string;
  r2: string;
  rankingSample?: number;
  projectRoot?: string;
}

interface NoteCover {
  slug: string;
  status: string;
  noteUrl: string | null;
  r2Path: string;
}

interface ProbeResult {
  ok: boolean;
  status: number;
  ct: string;
}

declare module "*/gallery-collectors.mjs" {
  export function buildTab(tab: string, opts: BuildTabOpts): Promise<TabResult>;
  export function enumerateBlogSlugs(r2: string): Promise<string[]>;
  export function enumerateNoteCovers(projectRoot: string): NoteCover[];
  export function enumerateNoteImages(
    projectRoot: string,
    r2: string,
    opts?: { limit?: number | null; concurrency?: number },
  ): Promise<TabResult>;
  export function enumerateVideoMasters(projectRoot: string, r2: string): TabResult;
  export function probe(url: string): Promise<ProbeResult>;
  export function pMap<T, R>(
    items: T[],
    fn: (item: T, i: number) => Promise<R> | R,
    concurrency?: number,
  ): Promise<R[]>;
  export function fetchText(url: string): Promise<string>;
  export function readJsonSafe(p: string): unknown;
}

interface SvgCatalogDef {
  key: string;
  label: string;
  desc: string;
}

interface SvgInspect {
  viewBox: string | null;
  hasTheme: boolean;
  hasViewBox: boolean;
}

declare module "*/svg-classify.mjs" {
  export const CATALOGS: SvgCatalogDef[];
  export function classify(file: string, svg: string): string;
  export function inspectSvg(svg: string): SvgInspect;
}
