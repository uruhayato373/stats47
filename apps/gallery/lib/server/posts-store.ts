import "server-only";

import path from "node:path";

import { projectRoot } from "./project-root";

/**
 * SNS 投稿台帳ストア (.claude/scripts/lib/sns-posts-store.cjs) への typed adapter。
 *
 * ★ webpack にバンドルさせない: `.cjs` は `__dirname` 相対で STORE_PATH
 * (.claude/state/sns/posts.json) を解決するため、bundle されると __dirname が
 * .next の出力先になり STORE_PATH が壊れる。createRequire で実行時に絶対パス require し、
 * webpack の静的解析対象から外す。かつ書込は必ずこの store 経由で行う (SSOT 規約:
 * data-storage.md の `.claude/` カテゴリ / sns-content-standards.md §3)。
 */
export interface Post {
  id: number;
  platform: string;
  post_type: string | null;
  domain: string | null;
  content_key: string | null;
  caption: string | null;
  post_url: string | null;
  quote_url: string | null;
  media_path: string | null;
  thumbnail_path: string | null;
  has_link: number | boolean | null;
  utm_url: string | null;
  status: string;
  scheduled_at: string | null;
  posted_at: string | null;
  impressions: number | null;
  likes: number | null;
  reposts: number | null;
  replies: number | null;
  bookmarks: number | null;
  metrics_updated_at: string | null;
  deleted_at: string | null;
  template: string | null;
  metric_keys: string | null;
  created_at: string;
  updated_at: string;
  // store は任意の追加フィールドを保持しうる
  [key: string]: unknown;
}

interface Store {
  STORE_PATH: string;
  loadAll(): Post[];
  query(predicate: (p: Post) => boolean): Post[];
  getById(id: number): Post | null;
  insert(record: Partial<Post>): Post;
  updateById(id: number, patch: Partial<Post>): Post | null;
}

// .cjs を実行時の素の Node require で読み込む。`createRequire(...)(path)` や `require(path)` を
// 直接書くと webpack が require 依存として静的解析し webpackEmptyContext にバンドル → ランタイムで
// MODULE_NOT_FOUND になる (実測)。`eval("require")` で得た native require は webpack の解析対象外に
// なるため、.cjs は自身の __dirname 相対で STORE_PATH (.claude/state/sns/posts.json) を正しく解決する。
// Next の server bundle は CommonJS で実行されるため require は実行時に必ず存在する。path は
// projectRoot (name 検証済) 起点の固定文字列連結のみで、任意コード実行の余地はない。
let cachedStore: Store | null = null;
function store(): Store {
  if (cachedStore) return cachedStore;
  const abs = path.join(projectRoot(), ".claude/scripts/lib/sns-posts-store.cjs");
  const nativeRequire = eval("require") as NodeRequire;
  cachedStore = nativeRequire(abs) as Store;
  if (!cachedStore) throw new Error(`sns-posts-store.cjs を読み込めません: ${abs}`);
  return cachedStore;
}

export function storePath(): string {
  return store().STORE_PATH;
}

export function loadAll(): Post[] {
  return store().loadAll();
}

export function query(predicate: (p: Post) => boolean): Post[] {
  return store().query(predicate);
}

export function getById(id: number): Post | null {
  return store().getById(id);
}

export function insert(record: Partial<Post>): Post {
  return store().insert(record);
}

export function updateById(id: number, patch: Partial<Post>): Post | null {
  return store().updateById(id, patch);
}
