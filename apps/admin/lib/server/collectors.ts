import "server-only";

/**
 * 共有 collector (.claude/scripts/lib/gallery-collectors.mjs / svg-classify.mjs) への adapter。
 *
 * これらは ESM・__dirname 非依存の純関数で、CI 静的ギャラリー (build-image-gallery.mjs /
 * build-svg-gallery-tabbed.mjs) と共用のため削除・変更禁止。
 *
 * apps/admin/lib/server から monorepo root は 4 階層上 ("../../../.."):
 *   apps/admin/lib/server/collectors.ts → apps → gallery → lib → server の逆で
 *   ../ ×4 で monorepo root。そこから .claude/scripts/lib/*.mjs を参照する。
 *
 * まず相対静的 import を試す (ambient .d.ts で型付け)。webpack が .mjs 取り込みで失敗する
 * 場合は下の lazyImport fallback (webpackIgnore + pathToFileURL) に切り替える。
 */
import {
  buildTab as _buildTab,
  enumerateBlogSlugs as _enumerateBlogSlugs,
  enumerateNoteCovers as _enumerateNoteCovers,
  enumerateNoteImages as _enumerateNoteImages,
  enumerateVideoMasters as _enumerateVideoMasters,
  probe as _probe,
  pMap as _pMap,
  fetchText as _fetchText,
  readJsonSafe as _readJsonSafe,
} from "../../../../.claude/scripts/lib/gallery-collectors.mjs";
import {
  CATALOGS as _CATALOGS,
  classify as _classify,
  inspectSvg as _inspectSvg,
} from "../../../../.claude/scripts/lib/svg-classify.mjs";

export interface AssetImage {
  variant: string;
  url: string | null;
  local?: boolean;
}

export interface AssetEntry {
  key: string;
  label: string;
  pageUrl: string | null;
  images: AssetImage[];
  [key: string]: unknown;
}

export interface TabResult {
  source: string;
  aspect: string;
  r2KeyPattern: string;
  entries: AssetEntry[];
  [key: string]: unknown;
}

export interface BuildTabOpts {
  limit?: number | null;
  all?: boolean;
  site: string;
  r2: string;
  rankingSample?: number;
  projectRoot?: string;
}

export interface NoteCover {
  slug: string;
  status: string;
  noteUrl: string | null;
  r2Path: string;
}

export interface ProbeResult {
  ok: boolean;
  status: number;
  ct: string;
}

export interface SvgCatalogDef {
  key: string;
  label: string;
  desc: string;
}

export interface SvgInspect {
  viewBox: string | null;
  hasTheme: boolean;
  hasViewBox: boolean;
}

export const buildTab = _buildTab as (tab: string, opts: BuildTabOpts) => Promise<TabResult>;
export const enumerateBlogSlugs = _enumerateBlogSlugs as (r2: string) => Promise<string[]>;
export const enumerateNoteCovers = _enumerateNoteCovers as (projectRoot: string) => NoteCover[];
export const enumerateNoteImages = _enumerateNoteImages as (
  projectRoot: string,
  r2: string,
  opts?: { limit?: number | null; concurrency?: number },
) => Promise<TabResult>;
export const enumerateVideoMasters = _enumerateVideoMasters as (
  projectRoot: string,
  r2: string,
) => TabResult;
export const probe = _probe as (url: string) => Promise<ProbeResult>;
export const pMap = _pMap as <T, R>(
  items: T[],
  fn: (item: T, i: number) => Promise<R> | R,
  concurrency?: number,
) => Promise<R[]>;
export const fetchText = _fetchText as (url: string) => Promise<string>;
export const readJsonSafe = _readJsonSafe as (p: string) => unknown;

export const CATALOGS = _CATALOGS as SvgCatalogDef[];
export const classify = _classify as (file: string, svg: string) => string;
export const inspectSvg = _inspectSvg as (svg: string) => SvgInspect;
