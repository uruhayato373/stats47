#!/usr/bin/env node
/**
 * YouTube 投稿前の多層重複ガード。
 *
 * 5 つのレイヤーで重複を検出する:
 *   L1 (D1):  sns_posts の caption (タイトル) 正規化一致 — 直近 60 日 → ERROR
 *   L2 (D1):  sns_posts の thumbnail_path basename 一致 — 直近 60 日 → ERROR
 *   L3 (D1):  sns_posts の content_key 一致 — 直近 60 日 → WARN
 *   L4 (API): YouTube channel API の playlist タイトル一致 — 直近 60 日 (D1 漏れの保険) → ERROR
 *   L5 (D1):  sns_posts の template + metric_keys 完全一致 — 直近 60 日 → WARN
 *             「同データを同テンプレで再生成」= 視覚的に酷似した動画になる可能性大
 *
 * 2026-03 に同タイトル/同サムネ再アップロードが頻発し、YouTube が duplicate-content と判定して
 * シャドウバンを引いたインシデント（2026-04-24, Issue #88）の再発防止。
 *
 * Usage:
 *   node .claude/scripts/lib/check-youtube-duplicate.cjs --title "<タイトル>" \
 *     [--thumbnail <path>] [--content-key <key>] \
 *     [--template <composition-id>] [--metric-keys '<json-array>']
 *
 * Bypass:
 *   --allow-duplicate  重複検出時も warning として通す (緊急用、推奨しない)
 *
 * 呼び出し元:
 *   - .claude/scripts/youtube/upload.js main() 内 (guard 1 の直後)
 */

const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const CHANNEL_ID = "UCdRiwDSX1aUd0dSd7Cs08Kg";
const LOOKBACK_DAYS = 60;
const API_MAX_FETCH = 100;
const D1_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);

function fail(msg) {
  console.error(`[check-youtube-duplicate] ${msg}`);
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    title: null,
    thumbnail: null,
    contentKey: null,
    template: null,
    metricKeys: null,
    allowDuplicate: false,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--title") opts.title = args[++i];
    else if (args[i] === "--thumbnail") opts.thumbnail = args[++i];
    else if (args[i] === "--content-key") opts.contentKey = args[++i];
    else if (args[i] === "--template") opts.template = args[++i];
    else if (args[i] === "--metric-keys") opts.metricKeys = args[++i];
    else if (args[i] === "--allow-duplicate") opts.allowDuplicate = true;
  }
  return opts;
}

// metric_keys の正規化: JSON 配列を sort + JSON.stringify することで順序ゆらぎを吸収
function normalizeMetricKeys(s) {
  if (!s) return null;
  try {
    const arr = JSON.parse(s);
    if (!Array.isArray(arr)) return null;
    return JSON.stringify([...arr].map(String).sort());
  } catch {
    return null;
  }
}

function normalizeTitle(s) {
  if (!s) return "";
  return s
    .replace(/#\S+/g, "")
    .replace(/【.+?】/g, "")
    .replace(/\(.+?\)|\（.+?\）/g, "")
    .replace(/[📊🚗🚨💅🎯❗️!？?？「」｜|]/g, "")
    .replace(/[\s　]+/g, " ")
    .normalize("NFKC")
    .trim()
    .toLowerCase();
}

function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, ".env.local");
  if (!fs.existsSync(envPath)) fail(`.env.local not found at ${envPath}`);
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

// ── L1-L3: D1 sns_posts チェック ──

function checkD1(opts, allowDuplicate) {
  if (!fs.existsSync(D1_PATH)) {
    console.warn("[check-youtube-duplicate] D1 not found, skipping D1 check (API のみで判定)");
    return { titleHits: [], thumbHits: [], contentKeyHits: [] };
  }

  const Database = require("better-sqlite3");
  const db = new Database(D1_PATH, { readonly: true, fileMustExist: true });
  try {
    const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const rows = db
      .prepare(
        `SELECT id, content_key, caption, thumbnail_path, post_url, posted_at, scheduled_at, status, deleted_at, template, metric_keys
         FROM sns_posts
         WHERE platform = 'youtube'
           AND deleted_at IS NULL
           AND status IN ('posted', 'scheduled')
           AND COALESCE(posted_at, scheduled_at) >= ?`,
      )
      .all(cutoff);

    const newTitleNorm = normalizeTitle(opts.title);
    const titleHits = rows.filter((r) => normalizeTitle(r.caption) === newTitleNorm);

    const newThumbBase = opts.thumbnail ? path.basename(opts.thumbnail) : null;
    const thumbHits = newThumbBase
      ? rows.filter((r) => r.thumbnail_path && path.basename(r.thumbnail_path) === newThumbBase)
      : [];

    const contentKeyHits = opts.contentKey
      ? rows.filter((r) => r.content_key === opts.contentKey)
      : [];

    // L5: template + metric_keys 完全一致 (両方とも指定がある場合のみ)
    const newMetricsNorm = normalizeMetricKeys(opts.metricKeys);
    const templateMetricsHits =
      opts.template && newMetricsNorm
        ? rows.filter(
            (r) =>
              r.template === opts.template && normalizeMetricKeys(r.metric_keys) === newMetricsNorm,
          )
        : [];

    return { titleHits, thumbHits, contentKeyHits, templateMetricsHits, totalChecked: rows.length };
  } finally {
    db.close();
  }
}

// ── L4: YouTube API チェック (D1 漏れの保険) ──

async function checkAPI(opts) {
  const env = loadEnv();
  if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET || !env.GOOGLE_OAUTH_REFRESH_TOKEN) {
    console.warn("[check-youtube-duplicate] GOOGLE_OAUTH_* not set, skipping API check");
    return [];
  }
  const { google } = require("googleapis");
  const oauth2 = new google.auth.OAuth2(env.GOOGLE_OAUTH_CLIENT_ID, env.GOOGLE_OAUTH_CLIENT_SECRET);
  oauth2.setCredentials({ refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN });
  const yt = google.youtube({ version: "v3", auth: oauth2 });

  const ch = await yt.channels.list({ part: "contentDetails", id: CHANNEL_ID });
  if (!ch.data.items?.[0]) return [];
  const uploads = ch.data.items[0].contentDetails.relatedPlaylists.uploads;

  const items = [];
  let pageToken;
  do {
    const r = await yt.playlistItems.list({
      part: "snippet,contentDetails",
      playlistId: uploads,
      maxResults: 50,
      pageToken,
    });
    for (const it of r.data.items) {
      items.push({
        videoId: it.contentDetails.videoId,
        publishedAt: it.contentDetails.videoPublishedAt || it.snippet.publishedAt,
        title: it.snippet.title,
      });
      if (items.length >= API_MAX_FETCH) break;
    }
    pageToken = r.data.nextPageToken;
  } while (pageToken && items.length < API_MAX_FETCH);

  const cutoff = Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const recent = items.filter((v) => {
    const t = new Date(v.publishedAt).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });

  const newNorm = normalizeTitle(opts.title);
  return recent.filter((v) => normalizeTitle(v.title) === newNorm);
}

// ── main ──

async function main() {
  const opts = parseArgs();
  if (!opts.title) fail("--title <new-video-title> is required");

  const allowDup = opts.allowDuplicate;
  const { titleHits, thumbHits, contentKeyHits, templateMetricsHits, totalChecked } = checkD1(opts, allowDup);

  // L1: 同タイトル → ERROR
  if (titleHits.length > 0) {
    const lines = titleHits.slice(0, 3).map((r) => {
      const ts = (r.posted_at || r.scheduled_at || "").slice(0, 10);
      return `  - ${ts} [${r.status}] ${r.post_url || ""} ${r.caption}`;
    });
    const msg = [
      `[L1] D1 で同タイトルを検出（直近 ${LOOKBACK_DAYS} 日 / ${titleHits.length} 件）:`,
      `  新規: "${opts.title}"`,
      "  既存:",
      ...lines,
      "",
      "  YouTube が duplicate-content / reupload spam と判定する典型ケースです。",
      "  対応: タイトル変更 / テーマ変更 / 既存動画を削除（旧動画の sns_posts.deleted_at もマーク）",
      "  緊急バイパス: --allow-duplicate（推奨しません）",
    ].join("\n");
    if (allowDup) console.warn(`[check-youtube-duplicate] WARNING (--allow-duplicate L1): ${msg}`);
    else fail(msg);
  }

  // L2: 同サムネ → ERROR
  if (thumbHits.length > 0) {
    const lines = thumbHits.slice(0, 3).map((r) => {
      const ts = (r.posted_at || r.scheduled_at || "").slice(0, 10);
      return `  - ${ts} ${r.post_url || ""} thumb=${path.basename(r.thumbnail_path)} title="${r.caption?.slice(0, 40) ?? ""}"`;
    });
    const msg = [
      `[L2] D1 で同サムネを検出（直近 ${LOOKBACK_DAYS} 日 / ${thumbHits.length} 件）:`,
      `  新規 thumb: ${path.basename(opts.thumbnail)}`,
      "  既存:",
      ...lines,
      "",
      "  同じサムネ画像の再利用は duplicate-content 判定リスク。サムネを差別化してください。",
    ].join("\n");
    if (allowDup) console.warn(`[check-youtube-duplicate] WARNING (--allow-duplicate L2): ${msg}`);
    else fail(msg);
  }

  // L3: 同 content_key → WARNING のみ (テーマ重複だがタイトル差別化されていれば許容)
  if (contentKeyHits.length > 0) {
    console.warn(
      `[L3 WARN] D1 で同 content_key を検出（直近 ${LOOKBACK_DAYS} 日 / ${contentKeyHits.length} 件、content_key=${opts.contentKey}）:`,
    );
    for (const r of contentKeyHits.slice(0, 3)) {
      const ts = (r.posted_at || r.scheduled_at || "").slice(0, 10);
      console.warn(`  - ${ts} ${r.post_url || ""} "${r.caption?.slice(0, 50) ?? ""}"`);
    }
    console.warn("  同テーマの連投は SUGGESTED_VIDEO 評価を下げる可能性。本当に必要か再確認してください。");
  }

  // L5: 同 template + 同 metric_keys → WARNING (視覚的に酷似)
  if (templateMetricsHits.length > 0) {
    console.warn(
      `[L5 WARN] D1 で同 template + metric_keys の組み合わせを検出（直近 ${LOOKBACK_DAYS} 日 / ${templateMetricsHits.length} 件）:`,
    );
    console.warn(`  template=${opts.template}, metric_keys=${opts.metricKeys}`);
    for (const r of templateMetricsHits.slice(0, 3)) {
      const ts = (r.posted_at || r.scheduled_at || "").slice(0, 10);
      console.warn(`  - ${ts} ${r.post_url || ""} "${r.caption?.slice(0, 50) ?? ""}"`);
    }
    console.warn("  同データを同テンプレで再生成 = 視覚的に酷似した動画になります。テンプレを変えるか metric を差し替えてください。");
  }

  // L4: API チェック (D1 漏れ・古い記録の保険)
  let apiHits = [];
  try {
    apiHits = await checkAPI(opts);
  } catch (err) {
    console.warn(`[check-youtube-duplicate] API check 失敗 (D1 のみで判定): ${err.message}`);
  }
  // D1 の post_url で既にカバーされている動画は除外
  const d1Urls = new Set(titleHits.map((r) => r.post_url).filter(Boolean));
  const apiOnlyHits = apiHits.filter((v) => !d1Urls.has(`https://www.youtube.com/watch?v=${v.videoId}`));
  if (apiOnlyHits.length > 0) {
    const lines = apiOnlyHits.slice(0, 3).map((v) => `  - ${v.publishedAt.slice(0, 10)} ${v.videoId} ${v.title}`);
    const msg = [
      `[L4] YouTube API で同タイトルを検出 (D1 未記録、${apiOnlyHits.length} 件):`,
      `  新規: "${opts.title}"`,
      "  既存:",
      ...lines,
      "",
      "  D1 inventory に存在しない動画です。`/sync-youtube-inventory` で同期してから判断してください。",
    ].join("\n");
    if (allowDup) console.warn(`[check-youtube-duplicate] WARNING (--allow-duplicate L4): ${msg}`);
    else fail(msg);
  }

  console.log(
    `[check-youtube-duplicate] OK (D1 ${totalChecked ?? 0} 件 + API ${apiHits.length} 件 を ${LOOKBACK_DAYS} 日範囲で確認、重複なし)`,
  );
}

main().catch((err) => fail(`unexpected error: ${err.message}`));
