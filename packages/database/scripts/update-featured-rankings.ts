/**
 * 注目のランキング自動更新スクリプト
 *
 * GA4 API から過去N日間のランキングページ日次 PV を取得し、
 * ranking_page_views テーブルに蓄積した上で、PV 上位を注目ランキングに設定する。
 *
 * Phase 1: GA4 API → 日次 PV データ取得
 * Phase 2: ranking_page_views に UPSERT 保存
 * Phase 3: ranking_page_views から集計 → カテゴリ分散 → ranking_items 更新
 *
 * Usage:
 *   npx tsx scripts/update-featured-rankings.ts
 *   npx tsx scripts/update-featured-rankings.ts --limit 8
 *   npx tsx scripts/update-featured-rankings.ts --days 14
 *   npx tsx scripts/update-featured-rankings.ts --dry-run
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// ── 設定 ──────────────────────────────────────────────
const LOCAL_D1_PATH = path.resolve(
  __dirname,
  "../../../.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);

const GA4_PROPERTY = "properties/463218070";
const KEY_CANDIDATES = ["stats47-f6b5dae19196.json", "stats47-31b18ee67144.json"];

const DEFAULT_LIMIT = 8;
const DEFAULT_DAYS = 7;
const MAX_SAME_CATEGORY = 2; // 同カテゴリ最大枠数

// ── 型定義 ──────────────────────────────────────────────
interface DailyPV {
  rankingKey: string;
  date: string; // "2026-03-23"
  pageViews: number;
  activeUsers: number;
}

// ── 引数パース ──────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  let limit = DEFAULT_LIMIT;
  let days = DEFAULT_DAYS;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--days" && args[i + 1]) {
      days = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  return { limit, days, dryRun };
}

// ── Phase 1: GA4 API から日次 PV を取得 ──────────────────
async function fetchRankingDailyPageViews(days: number): Promise<DailyPV[]> {
  const { google } = await import("googleapis");

  const rootDir = path.resolve(__dirname, "../../..");
  const keyFile = KEY_CANDIDATES.map((f) => path.join(rootDir, f)).find((f) =>
    fs.existsSync(f)
  );
  if (!keyFile) {
    throw new Error(
      `サービスアカウント鍵が見つかりません: ${KEY_CANDIDATES.join(" / ")}`
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });

  // 期間: N+1日前 〜 1日前（GA4は前日までのデータ）
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days - 1);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const response = await analyticsdata.properties.runReport({
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges: [{ startDate: fmt(startDate), endDate: fmt(endDate) }],
      dimensions: [{ name: "pagePath" }, { name: "date" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: {
            matchType: "BEGINS_WITH",
            value: "/ranking/",
          },
        },
      },
      orderBys: [
        { metric: { metricName: "screenPageViews" }, desc: true },
      ],
      limit: 5000,
    },
  });

  // GA4 date は "YYYYMMDD" 形式 → "YYYY-MM-DD" に変換
  const formatGA4Date = (d: string) =>
    `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;

  // ranking_key + date ごとに集計（同キーの複数パスを合算）
  const dailyMap = new Map<string, DailyPV>();
  const rows = response.data.rows || [];

  for (const row of rows) {
    const pagePath = row.dimensionValues?.[0]?.value;
    const rawDate = row.dimensionValues?.[1]?.value;
    const pv = parseInt(row.metricValues?.[0]?.value || "0", 10);
    const users = parseInt(row.metricValues?.[1]?.value || "0", 10);
    if (!pagePath || !rawDate || pv === 0) continue;

    const match = pagePath.match(/^\/ranking\/([^/?#]+)/);
    if (!match) continue;
    const rankingKey = match[1];
    const date = formatGA4Date(rawDate);
    const key = `${rankingKey}|${date}`;

    const existing = dailyMap.get(key);
    if (existing) {
      existing.pageViews += pv;
      existing.activeUsers += users;
    } else {
      dailyMap.set(key, { rankingKey, date, pageViews: pv, activeUsers: users });
    }
  }

  return [...dailyMap.values()];
}

// ── Phase 2: ranking_page_views に UPSERT 保存 ──────────
function savePageViewsToDB(db: Database.Database, dailyPVs: DailyPV[]): number {
  const upsertStmt = db.prepare(`
    INSERT INTO ranking_page_views (ranking_key, date, page_views, active_users, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT (ranking_key, date) DO UPDATE SET
      page_views = excluded.page_views,
      active_users = excluded.active_users,
      updated_at = datetime('now')
  `);

  const transaction = db.transaction(() => {
    let count = 0;
    for (const pv of dailyPVs) {
      upsertStmt.run(pv.rankingKey, pv.date, pv.pageViews, pv.activeUsers);
      count++;
    }
    return count;
  });

  return transaction();
}

// ── Phase 3: DB から集計して featured 更新 ────────────────
function aggregatePageViews(db: Database.Database, days: number): Map<string, number> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days - 1);
  const dateStr = startDate.toISOString().slice(0, 10);

  const rows = db
    .prepare(
      `SELECT ranking_key, SUM(page_views) as total_pv
       FROM ranking_page_views
       WHERE date >= ?
       GROUP BY ranking_key
       ORDER BY total_pv DESC`
    )
    .all(dateStr) as { ranking_key: string; total_pv: number }[];

  return new Map(rows.map((r) => [r.ranking_key, r.total_pv]));
}

// ── カテゴリ分散フィルタ ──────────────────────────────────
function applyCategoryDiversification(
  ranked: { rankingKey: string; pv: number }[],
  categoryMap: Map<string, string | null>,
  limit: number
): { rankingKey: string; pv: number }[] {
  const result: { rankingKey: string; pv: number }[] = [];
  const categoryCounts = new Map<string, number>();

  for (const item of ranked) {
    if (result.length >= limit) break;
    const category = categoryMap.get(item.rankingKey) || "__none__";
    const count = categoryCounts.get(category) || 0;

    if (count >= MAX_SAME_CATEGORY) continue;

    result.push(item);
    categoryCounts.set(category, count + 1);
  }

  return result;
}

// ── メイン ────────────────────────────────────────────
async function main() {
  const { limit, days, dryRun } = parseArgs();

  // ── Phase 1: GA4 から日次 PV 取得 ──
  console.log(`📊 Phase 1: GA4 から過去${days}日間の日次 PV を取得中...`);
  const dailyPVs = await fetchRankingDailyPageViews(days);

  const uniqueKeys = new Set(dailyPVs.map((d) => d.rankingKey));
  const uniqueDates = new Set(dailyPVs.map((d) => d.date));
  console.log(`   ${uniqueKeys.size} キー × ${uniqueDates.size} 日 = ${dailyPVs.length} レコード`);

  if (dailyPVs.length === 0) {
    console.log("⚠️  PV データが取得できませんでした。更新をスキップします。");
    return;
  }

  // ローカル D1 を開く
  if (!fs.existsSync(LOCAL_D1_PATH)) {
    throw new Error(`ローカル D1 が見つかりません: ${LOCAL_D1_PATH}`);
  }
  const db = new Database(LOCAL_D1_PATH);

  // ── Phase 2: ranking_page_views に保存 ──
  console.log(`\n💾 Phase 2: ranking_page_views に UPSERT 保存中...`);
  const savedCount = savePageViewsToDB(db, dailyPVs);
  console.log(`   ${savedCount} 件を保存しました。`);

  // ── Phase 3: 集計して featured 更新 ──
  console.log(`\n🏆 Phase 3: PV 集計 → 注目ランキング更新`);

  // DB から集計
  const pvMap = aggregatePageViews(db, days);

  // PV 降順でソート
  const ranked = [...pvMap.entries()]
    .map(([rankingKey, pv]) => ({ rankingKey, pv }))
    .sort((a, b) => b.pv - a.pv);

  console.log(`\n📈 PV 上位（全${ranked.length}件）:`);
  ranked.slice(0, 20).forEach((item, i) => {
    console.log(`   ${String(i + 1).padStart(2)}. ${item.rankingKey} (${item.pv} PV)`);
  });

  // ranking_items からカテゴリ情報を取得
  const itemRows = db
    .prepare(
      `SELECT ranking_key, category_key FROM ranking_items WHERE area_type = 'prefecture' AND is_active = 1`
    )
    .all() as { ranking_key: string; category_key: string | null }[];

  const categoryMap = new Map(itemRows.map((r) => [r.ranking_key, r.category_key]));
  const activeKeys = new Set(itemRows.map((r) => r.ranking_key));

  // DB に存在するキーのみ残す
  const validRanked = ranked.filter((item) => activeKeys.has(item.rankingKey));

  // カテゴリ分散を適用
  const featured = applyCategoryDiversification(validRanked, categoryMap, limit);

  console.log(`\n🎯 注目のランキング（${featured.length}件）:`);
  featured.forEach((item, i) => {
    const cat = categoryMap.get(item.rankingKey) || "-";
    console.log(
      `   ${i + 1}. ${item.rankingKey} (${item.pv} PV, カテゴリ: ${cat})`
    );
  });

  if (dryRun) {
    console.log("\n🔍 --dry-run: ranking_items の更新をスキップしました（PV データは保存済み）。");
    db.close();
    return;
  }

  // ranking_items 更新（トランザクション）
  const updateTransaction = db.transaction(() => {
    // 全件の is_featured をリセット
    db.prepare(
      `UPDATE ranking_items SET is_featured = 0, featured_order = 0 WHERE area_type = 'prefecture'`
    ).run();

    // 選ばれたキーに is_featured と featured_order をセット
    const updateStmt = db.prepare(
      `UPDATE ranking_items SET is_featured = 1, featured_order = ?, updated_at = datetime('now') WHERE ranking_key = ? AND area_type = 'prefecture'`
    );
    let order = 1;
    for (const item of featured) {
      updateStmt.run(order, item.rankingKey);
      order++;
    }

    return featured.length;
  });

  const updated = updateTransaction();
  console.log(`\n✅ ${updated} 件の注目ランキングを更新しました。`);
  console.log(`   → /sync-remote-d1 --key ranking_items でリモートに反映してください。`);
  console.log(`   → /sync-remote-d1 --table ranking_page_views で PV データも反映できます。`);

  db.close();
}

main().catch((error) => {
  console.error("❌ エラー:", error);
  process.exit(1);
});
