#!/usr/bin/env tsx
/**
 * 国土数値情報 (KSJ) の全データセット (現在 126 件) を D1 gis_datasets に
 * status='available' で INSERT し、stats47 未登録の候補も含めて網羅する。
 *
 * Phase 3 of GIS dataset management refactor (plan: stateless-stargazing-teapot).
 *
 * 取得源:
 *   1. https://jpksj-api.kmproj.com/datasets.json (third-party、プライマリ)
 *   2. packages/database/seed/ksj-catalog.json (リポジトリ内、フォールバック)
 *
 * 動作:
 *   - jpksj-api を fetch → fallback JSON を更新 (snapshot)
 *   - 各エントリを `INSERT ... ON CONFLICT (data_id) DO NOTHING` で D1 に投入
 *     既存 status='registered'/'imported'/'deprecated' は絶対に変更しない
 *   - KSJ 側で削除されたデータセットがあれば WARN を出す (auto-deprecate しない)
 *
 * jpksj-api レスポンス shape:
 *   { id, name, description, category1_name, category2_name, source_url }
 *
 * geometry_type / coverage / license / latest_version は jpksj-api からは取れないため
 * 'unknown' で登録。新規取り込み時に手動で UPDATE する。
 *
 * Usage:
 *   npx tsx packages/gis/src/mlit-ksj/scripts/seed-ksj-catalog.ts
 *   npx tsx packages/gis/src/mlit-ksj/scripts/seed-ksj-catalog.ts --dry-run
 *   npx tsx packages/gis/src/mlit-ksj/scripts/seed-ksj-catalog.ts --offline   # JSON のみ使用
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";

const LOCAL_D1_PATH =
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";

const JPKSJ_API_URL = "https://jpksj-api.kmproj.com/datasets.json";
const FALLBACK_JSON_PATH = "packages/database/seed/ksj-catalog.json";
const ATTRIBUTION = "国土交通省国土数値情報ダウンロードサイト";

interface JpKsjEntry {
  id: string;
  name: string;
  description: string;
  category1_name: string;
  category2_name: string;
  source_url: string;
}

const CATEGORY_MAP: Record<string, string> = {
  "国土(水・土地)": "land",
  "国土（水・土地）": "land", // 全角括弧
  政策区域: "policy",
  施設: "facility",
  交通: "transport",
  各種統計: "statistics",
};

function mapCategory(category1Name: string): string {
  return CATEGORY_MAP[category1Name] ?? "other";
}

function findProjectRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(dir, "package.json"), "utf-8"),
      );
      if (pkg.workspaces || pkg.name === "stats47") return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error("Could not find project root");
}

async function fetchCatalog(
  projectRoot: string,
  offline: boolean,
): Promise<JpKsjEntry[]> {
  const fallbackPath = path.join(projectRoot, FALLBACK_JSON_PATH);

  if (!offline) {
    try {
      console.log(`📡 fetching ${JPKSJ_API_URL} ...`);
      const res = await fetch(JPKSJ_API_URL, {
        headers: { "User-Agent": "stats47-gis-pipeline/1.0" },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const data = (await res.json()) as JpKsjEntry[];
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Empty or invalid response");
      }
      // snapshot を更新
      fs.writeFileSync(fallbackPath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`   ✓ ${data.length} entries fetched, snapshot saved to ${FALLBACK_JSON_PATH}`);
      return data;
    } catch (err) {
      console.warn(
        `⚠ jpksj-api fetch 失敗 (${err instanceof Error ? err.message : String(err)})、fallback JSON を使用`,
      );
    }
  }

  if (!fs.existsSync(fallbackPath)) {
    throw new Error(
      `Fallback JSON not found: ${fallbackPath}。--offline を使う場合は事前に snapshot が必要です`,
    );
  }
  const data = JSON.parse(
    fs.readFileSync(fallbackPath, "utf-8"),
  ) as JpKsjEntry[];
  console.log(`📁 fallback: ${data.length} entries from ${FALLBACK_JSON_PATH}`);
  return data;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const offline = process.argv.includes("--offline");

  const projectRoot = findProjectRoot();
  const dbPath = path.join(projectRoot, LOCAL_D1_PATH);
  if (!fs.existsSync(dbPath)) {
    console.error(`ローカル D1 SQLite が見つかりません: ${dbPath}`);
    process.exit(1);
  }

  const catalog = await fetchCatalog(projectRoot, offline);

  // 重複 ID 警告
  const idCounts = new Map<string, number>();
  for (const e of catalog) idCounts.set(e.id, (idCounts.get(e.id) ?? 0) + 1);
  const dupes = [...idCounts.entries()].filter(([, n]) => n > 1);
  if (dupes.length > 0) {
    console.warn(`⚠ 重複 id: ${dupes.map(([id, n]) => `${id}×${n}`).join(", ")}`);
  }

  const db = new Database(dbPath);

  const existingIds = new Set<string>();
  const existingByStatus: Record<string, string[]> = {
    available: [],
    registered: [],
    imported: [],
    deprecated: [],
  };
  for (const row of db
    .prepare("SELECT data_id, status FROM gis_datasets")
    .all() as Array<{ data_id: string; status: string }>) {
    existingIds.add(row.data_id);
    if (existingByStatus[row.status]) {
      existingByStatus[row.status].push(row.data_id);
    }
  }

  const apiIds = new Set(catalog.map((e) => e.id));
  const newCandidates = catalog.filter((e) => !existingIds.has(e.id));
  const missingFromApi = [...existingIds].filter((id) => !apiIds.has(id));

  console.log(`\n=== seed-ksj-catalog ===`);
  console.log(`  カタログ: ${catalog.length} 件`);
  console.log(`  既存 D1: ${existingIds.size} 件`);
  console.log(`    - registered: ${existingByStatus.registered.length}`);
  console.log(`    - imported:   ${existingByStatus.imported.length}`);
  console.log(`    - available:  ${existingByStatus.available.length}`);
  console.log(`    - deprecated: ${existingByStatus.deprecated.length}`);
  console.log(`  新規候補 (status='available' で INSERT): ${newCandidates.length}`);
  if (missingFromApi.length > 0) {
    console.log(
      `  ⚠ jpksj-api にない既存 dataId (要確認、deprecate 候補): ${missingFromApi.join(", ")}`,
    );
  }

  if (dryRun) {
    console.log(`\n(dry-run) 以下が INSERT される予定:`);
    for (const e of newCandidates.slice(0, 10)) {
      console.log(`  ${e.id.padEnd(10)} ${e.name} [${e.category1_name}]`);
    }
    if (newCandidates.length > 10) {
      console.log(`  ... (他 ${newCandidates.length - 10} 件)`);
    }
    db.close();
    return;
  }

  // INSERT ON CONFLICT DO NOTHING で既存行を保護
  const insertStmt = db.prepare(`
    INSERT INTO gis_datasets (
      data_id, name, name_en, category, geometry_type, coverage, license,
      status, attribution, memo, created_at, updated_at
    ) VALUES (
      @data_id, @name, @name_en, @category, @geometry_type, @coverage, @license,
      'available', @attribution, @memo,
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    )
    ON CONFLICT (data_id) DO NOTHING
  `);

  let inserted = 0;
  db.transaction(() => {
    for (const e of newCandidates) {
      const result = insertStmt.run({
        data_id: e.id,
        name: e.name,
        name_en: "", // jpksj-api 提供なし、後で手動補完
        category: mapCategory(e.category1_name),
        geometry_type: "unknown",
        coverage: "unknown",
        license: "unknown",
        // attribution は出典表記なので固定文言。source_url は memo に残す。
        attribution: ATTRIBUTION,
        memo: [
          e.description,
          `category2: ${e.category2_name}`,
          `source_url: ${e.source_url}`,
        ]
          .filter(Boolean)
          .join("\n"),
      });
      if (result.changes === 1) inserted++;
    }
  })();

  const totalAfter = (
    db.prepare("SELECT COUNT(*) AS n FROM gis_datasets").get() as { n: number }
  ).n;
  const availableAfter = (
    db
      .prepare("SELECT COUNT(*) AS n FROM gis_datasets WHERE status='available'")
      .get() as { n: number }
  ).n;

  db.close();

  console.log(`\n✅ seed 完了`);
  console.log(`   INSERT: ${inserted} 件`);
  console.log(`   D1 行数: ${existingIds.size} → ${totalAfter}`);
  console.log(`   status='available': ${availableAfter}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
