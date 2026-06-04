#!/usr/bin/env node
/**
 * GA4 から アフィリエイト計測イベント (ad_impression / affiliate_click) を取得し、
 * (affiliate_category × link_position) 別の impression / click / CTR を集計する。
 *
 * /affiliate-improvement の observe モードのデータ源。
 *
 * 前提 (★クラウド実行環境では鍵が無いため未テスト。ローカル / CI で実行):
 *   1. GA4 サービスアカウント鍵 stats47-*.json がリポジトリルートに存在 (gitignored)
 *   2. GA4 管理画面で カスタムディメンション `affiliate_category` / `link_position`
 *      (イベントスコープ) を登録済み。未登録なら eventName 単位の総数のみ取得しフォールバック。
 *
 * 実行: node .claude/scripts/ads/fetch-affiliate-ga4.cjs [days]
 *   days: 集計日数 (デフォルト 28)
 *
 * 出力: 標準出力に Markdown テーブル + .claude/state/ads/ga4-affiliate-<date>.json
 */
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const PROPERTY_ID = "463218070";
const KEY_CANDIDATES = ["stats47-f6b5dae19196.json", "stats47-31b18ee67144.json"];
const EVENTS = ["ad_impression", "affiliate_click"];

function resolveKey() {
  for (const name of KEY_CANDIDATES) {
    const p = path.join(PROJECT_ROOT, name);
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `GA4 鍵が見つかりません (${KEY_CANDIDATES.join(" / ")})。ローカル / CI で実行してください。`,
  );
}

async function runReport(analyticsdata, dimensions) {
  const days = Number(process.argv[2] || 28);
  const { data } = await analyticsdata.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: dimensions.map((name) => ({ name })),
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: { values: EVENTS },
        },
      },
      limit: 10000,
    },
  });
  return data.rows || [];
}

function pivot(rows, hasCustomDims) {
  // key = category|position, value = { impressions, clicks }
  const map = new Map();
  for (const r of rows) {
    const dims = (r.dimensionValues || []).map((d) => d.value);
    const event = dims[0];
    const category = hasCustomDims ? dims[1] || "(unset)" : "(all)";
    const position = hasCustomDims ? dims[2] || "(unset)" : "(all)";
    const count = Number((r.metricValues || [])[0]?.value || 0);
    const key = `${category}|${position}`;
    const cur = map.get(key) || { category, position, impressions: 0, clicks: 0 };
    if (event === "ad_impression") cur.impressions += count;
    else if (event === "affiliate_click") cur.clicks += count;
    map.set(key, cur);
  }
  return [...map.values()].map((v) => ({
    ...v,
    ctr: v.impressions > 0 ? v.clicks / v.impressions : null,
  }));
}

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: resolveKey(),
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });

  let hasCustomDims = true;
  let rows;
  try {
    rows = await runReport(analyticsdata, [
      "eventName",
      "customEvent:affiliate_category",
      "customEvent:link_position",
    ]);
  } catch (e) {
    // カスタムディメンション未登録時は eventName のみで再取得 (内訳なし)
    process.stderr.write(
      `[warn] custom dimension 取得失敗 → eventName 単位にフォールバック: ${e.message}\n`,
    );
    hasCustomDims = false;
    rows = await runReport(analyticsdata, ["eventName"]);
  }

  const pivoted = pivot(rows, hasCustomDims).sort(
    (a, b) => b.impressions - a.impressions,
  );
  const totalImp = pivoted.reduce((s, v) => s + v.impressions, 0);
  const totalClick = pivoted.reduce((s, v) => s + v.clicks, 0);
  const date = new Date().toISOString().slice(0, 10);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    date,
    days: Number(process.argv[2] || 28),
    hasCustomDimensions: hasCustomDims,
    totals: {
      impressions: totalImp,
      clicks: totalClick,
      ctr: totalImp > 0 ? totalClick / totalImp : null,
    },
    rows: pivoted,
  };

  const dir = path.join(PROJECT_ROOT, ".claude/state/ads");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `ga4-affiliate-${date}.json`),
    JSON.stringify(snapshot, null, 2),
  );

  // Markdown 出力
  const pct = (n) => (n == null ? "—" : (n * 100).toFixed(2) + "%");
  const out = [];
  out.push(`# アフィリエイト GA4 実測 (${date}, 直近 ${snapshot.days} 日)`);
  out.push("");
  if (!hasCustomDims) {
    out.push(
      "> ⚠ カスタムディメンション未登録のため内訳なし (総数のみ)。GA4 管理画面で `affiliate_category` / `link_position` を登録してください。",
    );
    out.push("");
  }
  out.push(
    `総 impression **${totalImp}** / click **${totalClick}** / CTR **${pct(snapshot.totals.ctr)}**`,
  );
  out.push("");
  out.push("| category | position | impressions | clicks | CTR |");
  out.push("|---|---|---:|---:|---:|");
  for (const v of pivoted) {
    out.push(
      `| ${v.category} | ${v.position} | ${v.impressions} | ${v.clicks} | ${pct(v.ctr)} |`,
    );
  }
  process.stdout.write(out.join("\n") + "\n");
  process.stderr.write(
    `\n[ga4] snapshot → .claude/state/ads/ga4-affiliate-${date}.json\n`,
  );
}

main().catch((e) => {
  process.stderr.write(`[error] ${e.message}\n`);
  process.exit(1);
});
