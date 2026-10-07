/**
 * buzz-map landing router 用 inventory reader コアモジュール。
 *
 * router が「既存 ranking / blog / theme が存在するか」を判定するための在庫読み取り層。
 * 純粋関数 (Set 化・存在判定・URL 生成) と、実 IO を注入可能な薄いローダーを分離する。
 *
 * 純粋関数はテスト対象、ローダーは実 FS / ネットワークに触るためテストではモックを注入する。
 */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { R2_PUBLIC_BASE_URL } from "../../lib/site-config.cjs";
import { datasetDir } from "../../../../config/datasets.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/** project root (.claude/scripts/sns/lib → 4 階層上)。 */
const PROJECT_ROOT = resolve(__dirname, "../../../..");

const KNOWN_RANKING_KEYS_PATH = resolve(
  PROJECT_ROOT,
  "packages/ranking/src/config/known-ranking-keys.ts",
);
/** テーマ定義 (1 テーマ 1 ファイル `<slug>.json`)。規約: .claude/rules/theme-catalog-standards.md §1 */
const THEMES_DATA_DIR = resolve(PROJECT_ROOT, datasetDir("themes.catalogs"));
const THEMES_APP_DIR = resolve(PROJECT_ROOT, "apps/web/src/app/themes");
const BLOG_ALL_JSON_URL = `${R2_PUBLIC_BASE_URL}/app/blog/all.json`;

// ---------------------------------------------------------------------------
// 純粋関数
// ---------------------------------------------------------------------------

/**
 * 配列を Set 化して正規化した在庫集合を組み立てる純粋関数。
 * @param {{ rankingKeys?: string[], blogSlugs?: string[], blogTagsByslug?: Record<string,string[]>, themeSlugs?: string[] }} input
 * @returns {{ rankingKeys: Set<string>, blogSlugs: Set<string>, blogTags: Set<string>, themeSlugs: Set<string> }}
 */
export function buildInventory({
  rankingKeys = [],
  blogSlugs = [],
  blogTagsByslug = {},
  themeSlugs = [],
} = {}) {
  const blogTags = new Set();
  for (const tags of Object.values(blogTagsByslug)) {
    if (!Array.isArray(tags)) continue;
    for (const tag of tags) {
      if (typeof tag === "string" && tag.length > 0) blogTags.add(tag);
    }
  }
  return {
    rankingKeys: toStringSet(rankingKeys),
    blogSlugs: toStringSet(blogSlugs),
    blogTags,
    themeSlugs: toStringSet(themeSlugs),
  };
}

/** @param {ReturnType<typeof buildInventory>} inventory @param {string} key */
export function hasRanking(inventory, key) {
  return inventory.rankingKeys.has(key);
}

/** @param {ReturnType<typeof buildInventory>} inventory @param {string} slug */
export function hasBlog(inventory, slug) {
  return inventory.blogSlugs.has(slug);
}

/** @param {ReturnType<typeof buildInventory>} inventory @param {string} slug */
export function hasTheme(inventory, slug) {
  return inventory.themeSlugs.has(slug);
}

/** @param {string} key → クリーン ranking URL */
export function rankingUrlFor(key) {
  return `/ranking/${key}`;
}

/** @param {string} slug → クリーン blog URL */
export function blogUrlFor(slug) {
  return `/blog/${slug}`;
}

/** @param {string} slug → クリーン theme URL */
export function themeUrlFor(slug) {
  return `/themes/${slug}`;
}

// ---------------------------------------------------------------------------
// ローダー (実 IO・注入可能・throw しない)
// ---------------------------------------------------------------------------

/**
 * known-ranking-keys.ts から ranking キー配列を抽出する。
 * TS を import せず正規表現でキーを抽出する (DBレス・ビルド非依存)。
 * @param {(path: string, enc: string) => string} [readFileImpl]
 * @returns {string[]}
 */
export function loadRankingKeysFromSource(readFileImpl = defaultReadFile) {
  let source;
  try {
    source = readFileImpl(KNOWN_RANKING_KEYS_PATH, "utf8");
  } catch (err) {
    warn(`loadRankingKeysFromSource: ${KNOWN_RANKING_KEYS_PATH} を読めません`, err);
    return [];
  }
  return extractQuotedArrayKeys(source);
}

/**
 * R2 公開 blog 一覧 (all.json) を fetch し slug / tag を抽出する。
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<{ slugs: string[], tagsBySlug: Record<string,string[]> }>}
 */
export async function loadPublishedBlogs(fetchImpl = globalThis.fetch) {
  const empty = { slugs: [], tagsBySlug: {} };
  let json;
  try {
    const res = await fetchImpl(BLOG_ALL_JSON_URL);
    if (!res || !res.ok) {
      warn(`loadPublishedBlogs: HTTP ${res ? res.status : "no-response"}`);
      return empty;
    }
    json = await res.json();
  } catch (err) {
    warn("loadPublishedBlogs: fetch 失敗", err);
    return empty;
  }
  const articles = Array.isArray(json?.articles) ? json.articles : [];
  const slugs = [];
  const tagsBySlug = {};
  for (const a of articles) {
    if (!a || typeof a.slug !== "string") continue;
    slugs.push(a.slug);
    const tags = Array.isArray(a.tags)
      ? a.tags
          .map((t) => (typeof t === "string" ? t : t?.tagKey))
          .filter((t) => typeof t === "string" && t.length > 0)
      : [];
    tagsBySlug[a.slug] = tags;
  }
  return { slugs, tagsBySlug };
}

/**
 * data/themes/catalogs の定義ファイル + apps/web/src/app/themes/ のディレクトリから実在 theme slug を集める。
 * @param {(path: string, opts?: object) => import("node:fs").Dirent[]} [readdirImpl]
 * @returns {string[]}
 */
export function loadThemeSlugs(readdirImpl = defaultReaddir) {
  const slugs = new Set();

  // data/themes/catalogs/<slug>.json (カタログ駆動テーマ)
  try {
    for (const ent of readdirImpl(THEMES_DATA_DIR, { withFileTypes: true })) {
      if (ent.isFile() && ent.name.endsWith(".json")) {
        slugs.add(ent.name.slice(0, -".json".length));
      }
    }
  } catch (err) {
    warn(`loadThemeSlugs: ${THEMES_DATA_DIR} を読めません`, err);
  }

  // apps/web/src/app/themes/ の実ディレクトリ (bespoke 含む)
  try {
    const entries = readdirImpl(THEMES_APP_DIR, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const name = ent.name;
      // dynamic route ([themeSlug]) / 非テーマは除外
      if (name.startsWith("[") || name.startsWith(".")) continue;
      slugs.add(name);
    }
  } catch (err) {
    warn(`loadThemeSlugs: ${THEMES_APP_DIR} を読めません`, err);
  }

  return [...slugs];
}

/**
 * 3 ローダーを束ねて inventory を返す。すべて注入可能。
 * @param {{ readFileImpl?: Function, fetchImpl?: typeof fetch, readdirImpl?: Function }} [deps]
 * @returns {Promise<ReturnType<typeof buildInventory>>}
 */
export async function loadInventory({ readFileImpl, fetchImpl, readdirImpl } = {}) {
  const rankingKeys = loadRankingKeysFromSource(readFileImpl);
  const { slugs: blogSlugs, tagsBySlug: blogTagsByslug } = await loadPublishedBlogs(fetchImpl);
  const themeSlugs = loadThemeSlugs(readdirImpl);
  return buildInventory({ rankingKeys, blogSlugs, blogTagsByslug, themeSlugs });
}

// ---------------------------------------------------------------------------
// 内部ヘルパー
// ---------------------------------------------------------------------------

/** @param {unknown} arr → 文字列だけの Set */
function toStringSet(arr) {
  const set = new Set();
  if (!Array.isArray(arr)) return set;
  for (const v of arr) {
    if (typeof v === "string" && v.length > 0) set.add(v);
  }
  return set;
}

/**
 * `["a", "b", ...]` 形式の配列リテラルからクォート文字列を抽出する。
 * export const KNOWN_RANKING_KEYS = [ "..." , '...' ] を想定。
 * @param {string} source
 * @returns {string[]}
 */
function extractQuotedArrayKeys(source) {
  // 配列リテラル部分を切り出す (最初の [ から対応する ] まで簡易抽出)。
  const start = source.indexOf("[");
  const end = source.lastIndexOf("]");
  const body = start >= 0 && end > start ? source.slice(start, end + 1) : source;
  const keys = [];
  const re = /["'`]([^"'`\n]+)["'`]/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    keys.push(m[1]);
  }
  return keys;
}

/** @type {(path: string, enc: string) => string} */
function defaultReadFile(path, enc) {
  return readFileSync(path, enc);
}

/** @type {(path: string, opts?: object) => import("node:fs").Dirent[]} */
function defaultReaddir(path, opts) {
  return readdirSync(path, opts);
}

function warn(msg, err) {
  const detail = err instanceof Error ? ` (${err.message})` : "";
  // eslint-disable-next-line no-console
  console.warn(`[buzz-map-inventory] ${msg}${detail}`);
}
