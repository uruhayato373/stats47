import "server-only";

import fs from "node:fs";
import path from "node:path";

import { externalIdOf, getById, loadAll, type Post, type PostApproval, type PostAsset } from "./posts-store";
import { projectRoot } from "./project-root";

/**
 * 投稿 1 件 (posts.json の id) から、台本・状態・承認・外部 ID・素材・観測値・関連投稿をまとめて返す。
 * 確認画面 /sns/<id> の read model。契約の正典は .claude/rules/sns-content-standards.md §3。
 * 書き込みはしない (管理画面は読み取り専用)。
 */

export interface MetricPoint {
  fetchedAt: string;
  impressions: string;
  reach: string;
  views: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  quotes: string;
}

export interface ScriptChapter {
  start: string;
  title: string;
  narration?: string;
}

export interface LongScript {
  post_id: number;
  title: string;
  description: string;
  chapters?: ScriptChapter[];
  narration?: string;
  sources: Array<{ url: string; metric_key?: string | null; survey_id?: string | null; note?: string | null }>;
}

export type PostScript =
  | { kind: "caption"; text: string | null }
  | { kind: "file"; path: string; script: LongScript | null };

export interface TracedAsset extends PostAsset {
  /** 管理画面の配信 URL (/sns-asset/<id>/<ファイル名>)。保全していない素材は null */
  url: string | null;
}

export interface PostTrace {
  post: Post;
  externalId: string | null;
  approval: PostApproval;
  script: PostScript;
  /** null = まだ Drive へ保全していない */
  assets: TracedAsset[] | null;
  metrics: MetricPoint[];
  related: { parent: Post | null; children: Post[]; sameContent: Post[] };
}

interface MetricsStore {
  readByRange(start: string, end: string): Array<Record<string, string>>;
}

// sns-metrics-store.cjs は自身の __dirname から保存先を解決するので、posts-store.ts と同じく
// webpack にバンドルさせず実行時の素の require で読む
let cachedMetrics: MetricsStore | null = null;
function metricsStore(): MetricsStore {
  if (cachedMetrics) return cachedMetrics;
  // sns-metrics-store.cjs は保存先を process.cwd() 基準で決める。管理画面の cwd は apps/admin なので、
  // 既存の上書き口 SNS_METRICS_REPO_ROOT で repo root を指す (未設定のときだけ)
  process.env.SNS_METRICS_REPO_ROOT ??= projectRoot();
  const abs = path.join(projectRoot(), ".claude/scripts/lib/sns-metrics-store.cjs");
  const nativeRequire = eval("require") as NodeRequire;
  cachedMetrics = nativeRequire(abs) as MetricsStore;
  return cachedMetrics;
}

const SCRIPT_PATH = /^data\/sns\/scripts\/[0-9]+\.json$/;

function readScript(post: Post): PostScript {
  if (!post.script_path) return { kind: "caption", text: post.caption };
  if (!SCRIPT_PATH.test(post.script_path)) return { kind: "file", path: post.script_path, script: null };
  const file = path.join(projectRoot(), post.script_path);
  const script = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as LongScript) : null;
  return { kind: "file", path: post.script_path, script };
}

export function assetUrl(id: number, asset: PostAsset): string | null {
  if (asset.state !== "archived" || !asset.drive_path) return null;
  return `/sns-asset/${id}/${encodeURIComponent(path.posix.basename(asset.drive_path))}`;
}

export function buildPostTrace(id: number): PostTrace | null {
  const post = getById(id);
  if (!post) return null;
  const all = loadAll();
  const metrics = metricsStore()
    .readByRange("0000-00-00", "9999-12-31")
    .filter((m) => m.sns_post_id === String(id))
    .map((m) => ({
      fetchedAt: m.fetched_at,
      impressions: m.impressions,
      reach: m.reach,
      views: m.views,
      likes: m.likes,
      comments: m.comments,
      shares: m.shares,
      saves: m.saves,
      quotes: m.quotes,
    }))
    .sort((a, b) => b.fetchedAt.localeCompare(a.fetchedAt));
  const parentId = typeof post.parent_post_id === "number" ? post.parent_post_id : Number(post.parent_post_id ?? NaN);
  return {
    post,
    externalId: externalIdOf(post),
    approval: post.approval ?? { state: "pending" },
    script: readScript(post),
    assets: Array.isArray(post.assets) ? post.assets.map((a) => ({ ...a, url: assetUrl(id, a) })) : null,
    metrics,
    related: {
      parent: Number.isInteger(parentId) ? (all.find((p) => p.id === parentId) ?? null) : null,
      children: all.filter((p) => Number(p.parent_post_id) === id),
      sameContent: post.content_key
        ? all.filter((p) => p.id !== id && p.content_key === post.content_key && p.domain === post.domain)
        : [],
    },
  };
}
