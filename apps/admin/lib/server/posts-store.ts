import "server-only";

import path from "node:path";
import { createHash } from "node:crypto";

import type { PostPlanning } from "../contracts/types";

import { projectRoot } from "./project-root";

/**
 * SNS 投稿台帳ストア (.claude/scripts/lib/sns-posts-store.cjs) への typed adapter。
 *
 * ★ webpack にバンドルさせない: `.cjs` は `__dirname` 相対で STORE_PATH
 * (data/sns/posts.json) を解決するため、bundle されると __dirname が
 * .next の出力先になり STORE_PATH が壊れる。createRequire で実行時に絶対パス require し、
 * webpack の静的解析対象から外す。書込は下書き本文の保存だけを公開する。
 */
export interface Post {
  material_keys?: string[];
  planning?: PostPlanning;
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
  /** 承認 (契約: data/sns/posts.schema.json)。unrecorded = 承認の記録を始める前の行 */
  approval?: PostApproval;
  /** Instagram の media_id (post_url から導出できない外部 ID だけを保存する) */
  external_id?: string | null;
  /** 長尺投稿の台本 (data/sns/scripts/<id>.json) */
  script_path?: string | null;
  /** Google Drive へ保全した素材。未保全の行は undefined */
  assets?: PostAsset[];
  // store は任意の追加フィールドを保持しうる
  [key: string]: unknown;
}

export interface PostApproval {
  state: "pending" | "approved" | "rejected" | "unrecorded";
  by?: string | null;
  at?: string | null;
  via?: string | null;
  note?: string | null;
}

export interface PostAsset {
  role: "image" | "slide" | "video" | "thumbnail";
  order: number;
  state: "archived" | "missing";
  drive_path?: string;
  r2?: { bucket: string; key: string };
  sha256?: string;
  bytes?: number;
  mime?: string;
  width?: number;
  height?: number;
  source?: string | null;
  reason?: string;
}

interface Store {
  STORE_PATH: string;
  loadAll(): Post[];
  query(predicate: (p: Post) => boolean): Post[];
  getById(id: number): Post | null;
  externalIdOf(p: Post): string | null;
  updateById(id: number, patch: Partial<Post>): Post | null;
}

// .cjs を実行時の素の Node require で読み込む。`createRequire(...)(path)` や `require(path)` を
// 直接書くと webpack が require 依存として静的解析し webpackEmptyContext にバンドル → ランタイムで
// MODULE_NOT_FOUND になる (実測)。`eval("require")` で得た native require は webpack の解析対象外に
// なるため、.cjs は自身の __dirname 相対で STORE_PATH (data/sns/posts.json) を正しく解決する。
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

/** 外部 (各媒体側) の投稿 ID。導出規則は sns-posts-store.cjs の externalIdOf が正本 */
export function externalIdOf(p: Post): string | null {
  return store().externalIdOf(p);
}

/** 秒単位の updated_at が同じでも変更を検出する、投稿全体の版。台帳には保存しない。 */
export function postRevision(post: Post): string {
  return createHash("sha256").update(JSON.stringify(post)).digest("hex");
}

export class DraftEditError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

/** ユーザー操作による唯一の書込。外部予約・公開の状態や素材は変更しない。 */
export function saveDraftCaption(id: number, caption: string, revision: string): Post {
  const post = getById(id);
  if (!post || post.deleted_at || post.status === "deleted") {
    throw new DraftEditError("投稿が見つかりません。", 404);
  }
  if (post.status !== "draft" || post.scheduled_at || post.posted_at || post.post_url || post.external_id) {
    throw new DraftEditError("編集できるのは未予約・未公開の下書きだけです。", 409);
  }
  if (postRevision(post) !== revision) {
    throw new DraftEditError("別の操作で更新されています。入力内容を控え、再読込してから保存してください。", 409);
  }
  if (!caption.trim() || caption.length > 10000) {
    throw new DraftEditError("本文は1〜10,000文字で入力してください。", 400);
  }
  if (caption === post.caption) return post;
  // 検査から保存までは同期処理。投稿条件と版を再読込してから、既存の唯一の writer を使う。
  const updated = store().updateById(id, {
    caption,
    approval: { state: "pending", note: "管理画面で本文を変更したため再承認待ち" },
  });
  if (!updated) throw new DraftEditError("投稿が見つかりません。", 404);
  return updated;
}
