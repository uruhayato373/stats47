#!/usr/bin/env node
/**
 * 投稿台帳の過去分を「1 id から全部たどれる」形へ一度だけ補完する (2026-10-09)。dry-run 既定、--apply で書く。
 *
 *   1. 承認: approval の無い行に { state: "unrecorded" } (承認された証拠が無いので approved にしない)
 *   2. YouTube の予約行 (post_url あり): oEmbed で公開を確認し、watch ページの公開日時を posted_at にして posted へ
 *   3. YouTube の URL の無い posted 行: 指標の時系列に残る未知の動画 ID の説明欄にある stats47.jp/ranking/<key> が
 *      行の content_key と 1 対 1 に一致したものだけ post_url を入れる (推定はしない。残りは一覧で報告)
 *   4. 指標の時系列に動画 ID だけが残り、現在も公開中で台帳に行が無い動画を行として追加する。content_key は説明欄の
 *      stats47.jp/ranking/<key> から取り、無ければ YOUTUBE_KEY_OVERRIDES、それも無ければ空にして報告する
 *   5. 指標の時系列: YouTube は動画 ID → 台帳 id、台帳に無い id を指す行は platform+domain+content_key が
 *      台帳の 1 行だけに一致し、その行の投稿日以降の計測であれば結び付け直す
 *
 * X の予約時刻経過分は verify-x-posted.cjs --apply、Threads の補充分は publish-threads.ts --sync-ledger で別に反映する。
 * Instagram の media_id は CI (sns-metrics-weekly.yml → link-ig-media.cjs) が結び付ける。
 *
 * usage: node .claude/scripts/sns/backfill-post-trace.mjs [--apply] [--skip-network]
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const store = require("../lib/sns-posts-store.cjs");
const metricsStore = require("../lib/sns-metrics-store.cjs");

const APPLY = process.argv.includes("--apply");
const SKIP_NETWORK = process.argv.includes("--skip-network");
const CACHE_DIR = path.join(os.tmpdir(), "sns-backfill-cache");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36";

/** 説明欄に ranking の URL が無い公開動画の domain / content_key (既存の 47 県まとめ動画 id 484 と同じ形) */
const YOUTUBE_KEY_OVERRIDES = {
  XsXqyy9GGwk: { domain: "migration-flow", content_key: "migration-flow-47" },
};

const watchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;

async function cachedText(key, url) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, key.replace(/[^A-Za-z0-9_.-]/g, "_"));
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "ja" } });
  const text = res.ok ? await res.text() : "";
  fs.writeFileSync(file, text);
  await new Promise((r) => setTimeout(r, 300));
  return text;
}

/** 公開状態 (oEmbed が返るか)・公開日時・タイトル・説明欄 */
async function youtubeInfo(videoId) {
  const oembed = await cachedText(`oembed-${videoId}`, `https://www.youtube.com/oembed?url=${watchUrl(videoId)}&format=json`);
  const html = await cachedText(`watch-${videoId}`, watchUrl(videoId));
  const publishDate = html.match(/"publishDate":"([^"]+)"/)?.[1] ?? null;
  const rawDesc = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/)?.[1];
  const description = rawDesc ? JSON.parse(`"${rawDesc}"`) : "";
  let title = null;
  try {
    title = oembed ? JSON.parse(oembed).title : null;
  } catch {
    title = null;
  }
  return { isPublic: Boolean(title), title, publishDate: publishDate ? new Date(publishDate).toISOString() : null, description };
}

const posts = store.loadAll();
const patches = new Map();
const patch = (id, fields) => patches.set(id, { ...(patches.get(id) ?? {}), ...fields });
const report = {};

// 1. 承認
let unrecorded = 0;
for (const row of posts) {
  if (!row.approval) {
    patch(row.id, { approval: { state: "unrecorded" } });
    unrecorded++;
  }
}
report["承認を unrecorded にした行"] = unrecorded;

const inserts = [];
if (!SKIP_NETWORK) {
  // 2. YouTube の予約行
  const scheduled = posts.filter((p) => p.platform === "youtube" && p.status === "scheduled" && p.post_url);
  const notConfirmed = [];
  for (const row of scheduled) {
    const info = await youtubeInfo(store.externalIdOf(row));
    if (info.isPublic && info.publishDate) patch(row.id, { status: "posted", posted_at: info.publishDate });
    else notConfirmed.push(row.id);
  }
  report["YouTube 予約→posted (oEmbed で公開を確認)"] = scheduled.length - notConfirmed.length;
  report["YouTube 予約のまま (公開を確認できない)"] = notConfirmed.join(", ") || 0;

  // 3. URL の無い YouTube posted 行
  const knownIds = new Set(posts.filter((p) => p.platform === "youtube").map(store.externalIdOf).filter(Boolean));
  const metricRows = metricsStore.readByRange("0000-00-00", "9999-12-31");
  const unknownIds = [...new Set(metricRows.filter((r) => r.platform === "youtube").map((r) => r.content_key))]
    .filter((k) => /^[A-Za-z0-9_-]{11}$/.test(k) && !knownIds.has(k));
  const noUrlRows = posts.filter((p) => p.platform === "youtube" && !p.post_url && p.status === "posted");
  const claims = new Map(); // 台帳 id → 動画 ID の候補
  const publicUnknown = [];
  for (const videoId of unknownIds) {
    const info = await youtubeInfo(videoId);
    if (info.isPublic) publicUnknown.push({ videoId, info });
    const keys = new Set([...info.description.matchAll(/stats47\.jp\/ranking\/([a-z0-9-]+)/g)].map((m) => m[1]));
    const candidates = noUrlRows.filter((r) => keys.has(r.content_key));
    if (candidates.length === 1) claims.set(candidates[0].id, [...(claims.get(candidates[0].id) ?? []), videoId]);
  }
  report["指標にだけ残る動画 ID (台帳に無い)"] = unknownIds.length;
  report["  うち現在も公開中"] = publicUnknown.length;
  let recovered = 0;
  for (const [id, videoIds] of claims) {
    if (videoIds.length !== 1) continue; // 同じ key の動画が複数あると取り違えるので推定しない
    patch(id, { post_url: watchUrl(videoIds[0]) });
    recovered++;
  }
  report["URL の無い YouTube posted 行"] = noUrlRows.length;
  report["  うち説明欄の ranking key で URL を復元"] = recovered;
  report["  復元できず (オーナーが Studio で確認)"] = noUrlRows.filter((r) => !patches.get(r.id)?.post_url).map((r) => r.id).join(", ");

  // 4. 台帳に無い公開動画 (3 で URL を復元した動画は除く)
  const recoveredIds = new Set([...patches.values()].map((p) => p.post_url).filter(Boolean));
  for (const { videoId, info } of publicUnknown) {
    if (recoveredIds.has(watchUrl(videoId))) continue;
    const rankingKey = info.description.match(/stats47\.jp\/ranking\/([a-z0-9-]+)/)?.[1] ?? null;
    const key = YOUTUBE_KEY_OVERRIDES[videoId] ?? { domain: "ranking", content_key: rankingKey };
    inserts.push({
      platform: "youtube",
      post_type: /#Shorts/i.test(info.title) ? "short" : "original",
      domain: key.domain,
      content_key: key.content_key,
      caption: info.title,
      post_url: watchUrl(videoId),
      status: "posted",
      posted_at: info.publishDate,
      approval: { state: "unrecorded" },
      created_at: info.publishDate,
      updated_at: new Date().toISOString(),
    });
  }
  report["台帳に追加する公開動画"] = inserts.length;
  report["  うち content_key を決められない (オーナー確認)"] =
    inserts.filter((r) => !r.content_key).map((r) => r.post_url).join(", ") || 0;
}

console.log(`${APPLY ? "APPLY" : "dry-run"}: 台帳の更新 ${patches.size} 行 / 追加 ${inserts.length} 行`);
for (const [k, v] of Object.entries(report)) console.log(`  ${k}: ${v}`);

if (APPLY) {
  store.updateMany([...patches].map(([id, p]) => ({ id, patch: p })));
  for (const row of inserts) store.insert(row);
}

// 5. 指標の時系列 (台帳の更新後の状態で結び付ける)
const after = APPLY ? store.loadAll() : posts.map((p) => ({ ...p, ...(patches.get(p.id) ?? {}) }));
const ids = new Set(after.map((p) => String(p.id)));
const ytByVideo = new Map(after.filter((p) => p.platform === "youtube").map((p) => [store.externalIdOf(p), p]).filter(([k]) => k));
const byKey = new Map();
for (const p of after) {
  const key = `${p.platform}|${p.domain}|${p.content_key}`;
  byKey.set(key, [...(byKey.get(key) ?? []), p]);
}
const notBefore = (row, metric) => !row.posted_at || String(metric.fetched_at).slice(0, 10) >= String(row.posted_at).slice(0, 10);
const resolve = (m) => {
  if (m.platform === "youtube" && !m.sns_post_id) {
    const row = ytByVideo.get(m.content_key);
    return row ? row.id : null;
  }
  if (m.sns_post_id && !ids.has(m.sns_post_id)) {
    const rows = byKey.get(`${m.platform}|${m.domain}|${m.content_key}`) ?? [];
    return rows.length === 1 && notBefore(rows[0], m) ? rows[0].id : null;
  }
  return null;
};
if (APPLY) {
  const { relinked, skippedDuplicate } = metricsStore.relinkPostIds(resolve);
  console.log(`  指標行の結び付け: ${relinked} 行 (重複のため見送り ${skippedDuplicate} 行)`);
} else {
  const rows = metricsStore.readByRange("0000-00-00", "9999-12-31");
  console.log(`  指標行の結び付け (見込み): ${rows.filter((m) => resolve(m) != null).length} 行`);
}
