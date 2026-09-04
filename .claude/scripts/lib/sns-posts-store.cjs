/**
 * SNS 投稿台帳ストア (完全DBレス doc12 Phase E)。
 *
 * sns_posts は「書込専用の運用ログ」(投稿のたびに append、指標を後から UPDATE) であり、
 * authored config と性質が違うため git TS ではなく **エージェント用 state** として
 * `.claude/state/sns/posts.json` に置く (doc12 §3 / data-storage.md の `.claude/` カテゴリ)。
 * 永続/リモート D1・ローカル SQLite は使わない。
 *
 * 全 SNS 自動化スクリプト (publish-x / post-instagram / generate-schedule / delete-* /
 * weekly-report / metrics 等) はこのストア経由で読み書きする。直接 SQLite を開かない。
 *
 * レコードは snake_case (旧 sns_posts カラム名と同一): id / platform / post_type / domain /
 * content_key / caption / post_url / quote_url / media_path / thumbnail_path / has_link /
 * utm_url / status / scheduled_at / posted_at / impressions / likes / reposts / replies /
 * bookmarks / metrics_updated_at / deleted_at / template / metric_keys / parent_post_id /
 * source_timecode / survey_ids / provenance_urls / created_at / updated_at
 */

const fs = require("node:fs");
const path = require("node:path");

const STORE_PATH = path.resolve(__dirname, "../../state/sns/posts.json");
const LOG_PATH = path.resolve(__dirname, "../../state/sns/post-log.md");

const PLATFORM_LABEL = {
  instagram: "📸 Instagram",
  x: "𝕏 X",
  youtube: "▶️ YouTube",
  tiktok: "🎵 TikTok",
  note: "📝 note",
};

function regenerateLog(posts) {
  const posted = posts
    .filter((p) => p.status === "posted")
    .sort((a, b) => (b.posted_at || "").localeCompare(a.posted_at || ""));
  const latestDate = posted[0]?.posted_at?.slice(0, 10) ?? "—";
  const rows = posted.map((p) => {
    const date = (p.posted_at || "").slice(0, 10) || "—";
    const platform = PLATFORM_LABEL[p.platform] || p.platform || "—";
    const topic = `${p.domain || ""}/${p.content_key || ""}`;
    const cap = (p.caption || "").replace(/\n/g, " ").replace(/\|/g, "｜").slice(0, 60) +
      ((p.caption || "").length > 60 ? "…" : "");
    const url = p.post_url ? `[🔗](${p.post_url})` : "—";
    return `| ${date} | ${platform} | ${topic} | ${cap} | ${url} |`;
  });
  const md = [
    "# SNS 投稿ログ\n",
    "投稿済み全件。`posted_at` 降順。",
    "スクリプトで自動生成 — 手編集しない (`sns-posts-store.cjs` が `insert()`/`updateById()` のたびに再生成)。\n",
    `**${posted.length} 件** (最終更新: ${latestDate})\n`,
    "| 日付 | 媒体 | コンテンツ | キャプション | URL |",
    "|---|---|---|---|---|",
    ...rows,
  ].join("\n");
  fs.writeFileSync(LOG_PATH, md + "\n");
}

function maxId(posts) {
  return posts.reduce((m, p) => Math.max(m, p.id || 0), 0);
}

function isVerifiedXPostUrl(postUrl) {
  return /^https:\/\/(?:x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/\d+(?:[/?#]|$)/.test(
    postUrl || "",
  );
}

function assertRecordIntegrity(record) {
  if (
    record.platform === "x" &&
    record.status === "posted" &&
    !record.deleted_at &&
    !isVerifiedXPostUrl(record.post_url)
  ) {
    throw new Error(
      `X の posted レコードには確認済み post_url が必要です (id=${record.id ?? "new"})`,
    );
  }
}

function read() {
  try {
    const data = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    if (!Array.isArray(data.posts)) data.posts = [];
    if (!data._meta) data._meta = {};
    return data;
  } catch (e) {
    if (e && e.code === "ENOENT") return { _meta: { nextId: 1 }, posts: [] };
    throw e;
  }
}

function write(data) {
  data._meta = data._meta || {};
  data._meta.count = data.posts.length;
  data._meta.nextId = Math.max(data._meta.nextId || 1, maxId(data.posts) + 1);
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  const tmp = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
  fs.renameSync(tmp, STORE_PATH);
  regenerateLog(data.posts); // post-log.md を常に最新に保つ
}

/** 全レコード (配列)。呼び出し側で JS フィルタする。 */
function loadAll() {
  return read().posts;
}

/** predicate でフィルタした配列を返す。 */
function query(predicate) {
  return read().posts.filter(predicate);
}

/** id で 1 件取得 (無ければ null)。 */
function getById(id) {
  return read().posts.find((p) => p.id === id) ?? null;
}

/**
 * 新規レコードを追加し、採番した id 付きで返す (旧 INSERT INTO sns_posts 相当)。
 * created_at / updated_at が未指定なら現在時刻 (UTC ISO) を補完する。
 */
function insert(record) {
  const data = read();
  // _meta.nextId が stale (store 非経由の直接編集等) でも既存 id と衝突しないよう
  // maxId+1 との大きい方を採番する (2026-07-07: nextId=575 固着で id 575 重複が実発生)
  const id = Math.max(data._meta.nextId || 1, maxId(data.posts) + 1);
  const now = new Date().toISOString();
  const row = {
    id,
    status: "draft",
    created_at: now,
    updated_at: now,
    ...record,
  };
  assertRecordIntegrity(row);
  data.posts.push(row);
  data._meta.nextId = id + 1;
  write(data);
  return row;
}

/**
 * id で 1 件更新 (旧 UPDATE sns_posts SET ... WHERE id=? 相当)。patch をマージし
 * updated_at を補完。更新後レコードを返す (無ければ null)。
 */
function updateById(id, patch) {
  const data = read();
  const row = data.posts.find((p) => p.id === id);
  if (!row) return null;
  const next = {
    ...row,
    ...patch,
    updated_at: patch.updated_at ?? new Date().toISOString(),
  };
  assertRecordIntegrity(next);
  Object.assign(row, next);
  write(data);
  return row;
}

module.exports = {
  STORE_PATH,
  loadAll,
  query,
  getById,
  isVerifiedXPostUrl,
  assertRecordIntegrity,
  insert,
  updateById,
};
