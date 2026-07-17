#!/usr/bin/env node
/**
 * buzz-map-attribution.mjs — GA4 から buzz-map campaign 別の landing attribution を取得する (§7.3)。
 *
 * SNS (utm_campaign=buzz-map-<ideaId>) → landing session / engaged / pageView / cta_click を集計し、
 * §7.4 KPI と §11 Phase 5 の score 還流入力を作って state へ書く。build-buzz-map-catalog の measured 補正入力。
 *
 * 純粋集計は lib/buzz-map-attribution-core.mjs、GA4 fetch はここ (既存 fetch-affiliate-ga4 の流儀に準拠)。
 *
 * 前提 (クラウド/CI では鍵が無いため degrade):
 *   1. GA4 サービスアカウント鍵 stats47-*.json がリポジトリルートに存在 (gitignored)
 *   2. cta_click custom dimension (content_id / target_type) 登録済みなら deep-click も取れる。未登録は session のみ。
 *
 * 実行: node .claude/scripts/sns/buzz-map-attribution.mjs [days]   (既定 28)
 * 出力: stdout に集計 JSON サマリ + .claude/state/sns/buzz-map-attribution-latest.json
 *       (+ 日付版 buzz-map-attribution-<date>.json)。投稿 0 の現在は campaign 0 件 = 正常 (異常終了しない)。
 * 鍵が無い環境では exit 0 で skipped と表示し state を書かない (CI/cloud を止めない)。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import {
  aggregateSessionsByIdea,
  aggregateCtaByIdea,
  computeKpis,
  buildScoreFeedback,
} from "./lib/buzz-map-attribution-core.mjs";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const PROPERTY_ID = process.env.GA4_PROPERTY_ID || "463218070";
const KEY_CANDIDATES = ["stats47-f6b5dae19196.json", "stats47-31b18ee67144.json"];
const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/sns");

const store = require(path.join(PROJECT_ROOT, ".claude/scripts/lib/sns-posts-store.cjs"));

function resolveKey() {
  for (const name of KEY_CANDIDATES) {
    const p = path.join(PROJECT_ROOT, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** posts.json の buzz-map 投稿から ideaId → { impressions, attribution } を作る (SNS CTR 分母判定用)。 */
function impByIdeaFromPosts() {
  const out = {};
  let posts = [];
  try {
    posts = store.query((p) => p.domain === "buzz-map");
  } catch {
    return out;
  }
  for (const p of posts) {
    const ideaId = p.content_key;
    if (!ideaId) continue;
    // §7.1: 投稿レコードの attribution を優先。無ければ channel から導出 (x=direct / ig=profile)。
    const attr = p.attribution ?? (p.platform === "x" ? "direct" : "profile");
    if (!out[ideaId]) out[ideaId] = { impressions: 0, attribution: attr };
    out[ideaId].impressions += Number(p.impressions) || 0;
    if (attr === "direct") out[ideaId].attribution = "direct";
  }
  return out;
}

async function main() {
  const days = Number(process.argv[2] || 28);
  const keyPath = resolveKey();
  if (!keyPath) {
    console.log("[buzz-map-attribution] skipped (no GA4 key — cloud/CI。ローカルで実行してください)");
    process.exit(0);
  }

  const { google } = require("googleapis");
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });

  const sessionRows = await runSessionReport(analyticsdata, days);
  const sessionsByIdea = aggregateSessionsByIdea(sessionRows);

  let ctaByIdea = {};
  let ctaMeasured = false;
  try {
    const ctaRows = await runCtaReport(analyticsdata, days);
    ctaByIdea = aggregateCtaByIdea(ctaRows);
    ctaMeasured = true;
  } catch {
    console.log(
      "[buzz-map-attribution] cta_click は session KPI のみ " +
        "(content_id/target_type の custom dimension が GA4 未登録 → 登録後に deep-click 取得)。",
    );
  }

  const impByIdea = impByIdeaFromPosts();
  const kpisByIdea = computeKpis({ sessionsByIdea, ctaByIdea, impByIdea });
  const feedback = buildScoreFeedback(kpisByIdea);

  const payload = {
    fetchedAt: new Date().toISOString(),
    days,
    property: PROPERTY_ID,
    ctaMeasured,
    ideaCount: Object.keys(kpisByIdea).length,
    kpisByIdea,
    feedback,
  };
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(STATE_DIR, `buzz-map-attribution-${date}.json`), JSON.stringify(payload, null, 2) + "\n");
  fs.writeFileSync(path.join(STATE_DIR, "buzz-map-attribution-latest.json"), JSON.stringify(payload, null, 2) + "\n");

  console.log(JSON.stringify({ ideaCount: payload.ideaCount, ctaMeasured, kpisByIdea, feedback }, null, 2));
  console.log(`\nstate: ${path.join(STATE_DIR, "buzz-map-attribution-latest.json")}`);
}

async function runSessionReport(analyticsdata, days) {
  const { data } = await analyticsdata.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "sessionCampaignName" }, { name: "sessionSource" }],
      metrics: [{ name: "sessions" }, { name: "engagedSessions" }, { name: "screenPageViews" }],
      dimensionFilter: {
        filter: {
          fieldName: "sessionCampaignName",
          stringFilter: { matchType: "BEGINS_WITH", value: "buzz-map-" },
        },
      },
      limit: 10000,
    },
  });
  return (data.rows || []).map((row) => ({
    campaign: row.dimensionValues?.[0]?.value ?? "",
    source: row.dimensionValues?.[1]?.value ?? "",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
    engagedSessions: Number(row.metricValues?.[1]?.value ?? 0),
    pageViews: Number(row.metricValues?.[2]?.value ?? 0),
  }));
}

async function runCtaReport(analyticsdata, days) {
  const { data } = await analyticsdata.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "customEvent:content_id" }, { name: "customEvent:target_type" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: "cta_click" } },
      },
      limit: 10000,
    },
  });
  return (data.rows || []).map((row) => ({
    contentId: row.dimensionValues?.[0]?.value ?? "",
    targetType: row.dimensionValues?.[1]?.value ?? "",
    eventCount: Number(row.metricValues?.[0]?.value ?? 0),
  }));
}

main().catch((e) => {
  console.error(`[buzz-map-attribution] error: ${e.message}`);
  process.exit(1);
});
