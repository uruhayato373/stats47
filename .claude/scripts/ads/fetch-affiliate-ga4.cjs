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
const PROPERTY_ID = process.env.GA4_PROPERTY_ID || "463218070";
const KEY_CANDIDATES = ["stats47-f6b5dae19196.json", "stats47-31b18ee67144.json"];
// ★ 2026-07-28 に impression イベントを `ad_impression` → `affiliate_impression` へ改名した。
//   旧名は GA4 の AdSense 連携が自動生成する名前と同じで、取得しても AdSense 分しか返らず
//   CTR の分母にならなかった (直近 7 日 3,346 件が全件 AdSense 由来・残余ゼロ)。
//   改名日より前の窓を指定しても affiliate_impression は 0 件になる (それが正しい挙動)。
const IMPRESSION_EVENT = "affiliate_impression";
const CLICK_EVENT = "affiliate_click";
const EVENTS = [IMPRESSION_EVENT, CLICK_EVENT];

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

// 取得を試みる dimension の tier (richest → 最小)。未登録 custom dimension があると runReport が
// 失敗するため、上から順に試し最初に成功した tier を使う。
const DIM_TIERS = [
  // 最上位: 広告 1 件単位 (ad_id) × vertical × position。ad_id custom dimension 登録後に案件別 CTR が取れる。
  [
    "eventName",
    "customEvent:ad_id",
    "customEvent:affiliate_vertical",
    "customEvent:link_position",
  ],
  [
    "eventName",
    "customEvent:affiliate_vertical",
    "customEvent:affiliate_category",
    "customEvent:link_position",
    "customEvent:experiment_id",
    "customEvent:variant_id",
    "customEvent:creative_size",
  ],
  [
    "eventName",
    "customEvent:affiliate_vertical",
    "customEvent:link_position",
  ],
  ["eventName", "customEvent:affiliate_category", "customEvent:link_position"],
  ["eventName"],
];

const shortName = (apiName) => apiName.replace(/^customEvent:/, "");

/**
 * dimNames[0] は eventName。残りを複合キーにして impression/click を集計し CTR を出す。
 * 各 value dimension は短縮名 (affiliate_category 等) のフィールドとして row に展開する。
 */
function pivot(rows, dimNames) {
  const valueDims = dimNames.slice(1);
  const map = new Map();
  for (const r of rows) {
    const dims = (r.dimensionValues || []).map((d) => d.value);
    const event = dims[0];
    const fields = {};
    valueDims.forEach((dn, i) => {
      fields[shortName(dn)] = dims[i + 1] || "(unset)";
    });
    const key = valueDims.length
      ? valueDims.map((_, i) => dims[i + 1] || "(unset)").join("|")
      : "(all)";
    const count = Number((r.metricValues || [])[0]?.value || 0);
    const cur = map.get(key) || { ...fields, impressions: 0, clicks: 0 };
    if (event === IMPRESSION_EVENT) cur.impressions += count;
    else if (event === CLICK_EVENT) cur.clicks += count;
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

  let usedDims = null;
  let rows = null;
  for (const tier of DIM_TIERS) {
    try {
      rows = await runReport(analyticsdata, tier);
      usedDims = tier;
      break;
    } catch (e) {
      process.stderr.write(
        `[warn] dims=[${tier.join(", ")}] 取得失敗 → 次の tier にフォールバック: ${e.message}\n`,
      );
    }
  }
  if (!rows || !usedDims) throw new Error("GA4 取得失敗 (全 dimension tier)");

  const valueDimNames = usedDims.slice(1).map(shortName);
  const hasVerticalDims = valueDimNames.includes("affiliate_vertical");
  const hasCategoryDims =
    hasVerticalDims || valueDimNames.includes("affiliate_category");
  const hasVariantDims = valueDimNames.includes("variant_id");

  const pivoted = pivot(rows, usedDims).sort((a, b) => b.impressions - a.impressions);
  const totalImp = pivoted.reduce((s, v) => s + v.impressions, 0);
  const totalClick = pivoted.reduce((s, v) => s + v.clicks, 0);
  const date = new Date().toISOString().slice(0, 10);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    date,
    days: Number(process.argv[2] || 28),
    dimensions: valueDimNames,
    hasVerticalBreakdown: hasVerticalDims,
    hasCategoryBreakdown: hasCategoryDims,
    hasVariantBreakdown: hasVariantDims,
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
  if (!hasCategoryDims) {
    out.push(
      "> ⚠ custom dimension `affiliate_vertical` / `affiliate_category` / `link_position` 未登録のため内訳なし (総数のみ)。GA4 管理画面で登録してください (手順: `.claude/rules/affiliate-ads-standards.md` §GA4計測)。",
    );
    out.push("");
  } else if (!hasVerticalDims) {
    out.push(
      "> ⚠ canonical dimension `affiliate_vertical` (10 軸) 未登録。旧 `affiliate_category` で内訳表示中。GA4 管理画面で `affiliate_vertical` を登録すると意図軸で集計できます。",
    );
    out.push("");
  } else if (!hasVariantDims) {
    out.push(
      "> ⚠ A/B variant 用 custom dimension (`experiment_id` / `variant_id` / `creative_size`) 未登録。variant 別 CTR を取るには GA4 管理画面で登録してください。",
    );
    out.push("");
  }
  out.push(
    `総 impression **${totalImp}** / click **${totalClick}** / CTR **${pct(snapshot.totals.ctr)}**`,
  );
  out.push("");

  // 列順 (登録済みの dimension のみ)
  const COL_ORDER = [
    "affiliate_vertical",
    "affiliate_category",
    "link_position",
    "experiment_id",
    "variant_id",
    "creative_size",
  ].filter((c) => valueDimNames.includes(c));

  const headerCols = [...COL_ORDER, "impressions", "clicks", "CTR"];
  const align = COL_ORDER.map(() => "---").concat(["---:", "---:", "---:"]);
  out.push(`| ${headerCols.join(" | ")} |`);
  out.push(`|${align.join("|")}|`);
  for (const v of pivoted) {
    const cells = COL_ORDER.map((c) => v[c] ?? "(all)");
    cells.push(String(v.impressions), String(v.clicks), pct(v.ctr));
    out.push(`| ${cells.join(" | ")} |`);
  }

  // variant 別の experiment サマリ (登録済みのとき)
  if (hasVariantDims) {
    out.push("");
    out.push("## experiment 別 variant CTR (勝敗判定の入力)");
    out.push("");
    out.push(
      "> 停止ルール: 各 variant imp ≥ 1,000 (or 4 週)、勝者 CTR が次点比 +20% かつ 95% 有意で採用。",
    );
  }

  process.stdout.write(out.join("\n") + "\n");
  process.stderr.write(
    `\n[ga4] snapshot → .claude/state/ads/ga4-affiliate-${date}.json (dims: ${valueDimNames.join(",") || "none"})\n`,
  );
}

main().catch((e) => {
  process.stderr.write(`[error] ${e.message}\n`);
  process.exit(1);
});
