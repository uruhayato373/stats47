#!/usr/bin/env node
/**
 * Instagram メトリクス取得（CI 用）
 *
 * GitHub Actions から実行する。INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_BUSINESS_ACCOUNT_ID
 * を env から読み込み、全投稿のメトリクスを取得して SNS metrics CSV に記録する。
 * D1 DB への書き込みは行わない（sns_post_id = "" でも CSV に記録可能）。
 *
 * 使い方:
 *   INSTAGRAM_ACCESS_TOKEN=xxx INSTAGRAM_BUSINESS_ACCOUNT_ID=yyy node fetch-metrics-ci.cjs
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const store = require(path.join(PROJECT_ROOT, ".claude/scripts/lib/sns-metrics-store.cjs"));

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

if (!TOKEN || !IG_USER_ID) {
  console.error("Error: INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_BUSINESS_ACCOUNT_ID が未設定");
  process.exit(1);
}

const BASE_URL = "https://graph.instagram.com/v21.0";
const FETCHED_AT = new Date().toISOString();

async function fetchJson(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(`Graph API: ${data.error.message} (code=${data.error.code})`);
  return data;
}

async function fetchAllMedia() {
  const all = [];
  let url = `${BASE_URL}/${IG_USER_ID}/media?fields=id,caption,permalink,timestamp,like_count,comments_count&limit=100&access_token=${TOKEN}`;
  while (url) {
    const data = await fetchJson(url);
    all.push(...(data.data || []));
    url = data.paging?.next || null;
    if (url) await new Promise((r) => setTimeout(r, 500));
  }
  return all;
}

async function fetchInsights(mediaId) {
  try {
    const data = await fetchJson(
      `${BASE_URL}/${mediaId}/insights?metric=reach,saved,shares,views&access_token=${TOKEN}`,
    );
    const result = {};
    for (const item of data.data || []) {
      result[item.name] = item.values?.[0]?.value ?? item.value ?? 0;
    }
    return result;
  } catch {
    return {};
  }
}

async function main() {
  console.log("Instagram メトリクス取得開始...");
  const media = await fetchAllMedia();
  console.log(`取得: ${media.length} 件`);

  let saved = 0;
  for (const m of media) {
    const insights = await fetchInsights(m.id);
    store.upsertMetric({
      sns_post_id: "",
      platform: "instagram",
      domain: "ranking",
      content_key: m.id, // media_id をプロキシとして使用
      fetched_at: FETCHED_AT,
      impressions: "",
      reach: insights.reach || "",
      views: insights.views || "",
      likes: m.like_count || 0,
      comments: m.comments_count || 0,
      shares: insights.shares || "",
      saves: insights.saved || "",
      quotes: "",
    });
    saved++;
    if (saved % 10 === 0) console.log(`  ${saved}/${media.length} 件処理済み`);
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`✅ Instagram メトリクス記録完了: ${saved} 件`);
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
