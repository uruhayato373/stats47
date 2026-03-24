/**
 * MLIT サイバーポート（cyport）の係留施設データを港湾ごとに集約し、
 * 既存 ports テーブルの port_grade / administrator / cyport_code を更新する。
 *
 * Usage:
 *   npx tsx packages/database/scripts/import-cyport-ports.ts
 *   npx tsx packages/database/scripts/import-cyport-ports.ts --dry-run
 *   npx tsx packages/database/scripts/import-cyport-ports.ts --from-cache  # キャッシュ JSON を使用
 */

import Database from "better-sqlite3";
import { LOCAL_DB_PATHS } from "../src/config/local-db-paths";
import fs from "fs";
import path from "path";

// ── 定数 ──

const MLIT_API_KEY = process.env.MLIT_API_KEY || "A6m3-g1F1RAyau2jqRrjRiC6ehxo.Hrc";
const MLIT_BASE_URL = "https://www.mlit-data.jp/api/v1/";
const CACHE_PATH = "/tmp/cyport-berths-cache.json";
const BATCH_SIZE = 500;
const CONCURRENT_DETAIL_REQUESTS = 10;

// ── 引数パース ──

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fromCache = args.includes("--from-cache");

// ── MLIT GraphQL クライアント ──

async function mlitQuery(query: string): Promise<any> {
  const res = await fetch(MLIT_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: MLIT_API_KEY,
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`MLIT API error: ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data;
}

async function searchBerths(first: number, size: number): Promise<{ totalNumber: number; results: any[] }> {
  const query = `query {
    search(
      term: ""
      first: ${first}
      size: ${size}
      phraseMatch: true
      attributeFilter: { attributeName: "DPF:dataset_id", is: "berth" }
    ) {
      totalNumber
      searchResults {
        id
        title
        lat
        lon
      }
    }
  }`;
  const data = await mlitQuery(query);
  return {
    totalNumber: data.search.totalNumber,
    results: data.search.searchResults,
  };
}

async function getBerthDetail(dataId: string): Promise<any> {
  const query = `query {
    data(dataSetID: "berth", dataID: "${dataId}") {
      totalNumber
      getDataResults {
        id
        title
        metadata
      }
    }
  }`;
  const data = await mlitQuery(query);
  const results = data.data?.getDataResults;
  if (!results || results.length === 0) return null;
  return results[0].metadata;
}

// ── データ取得 ──

interface CyportPort {
  cyportCode: string;
  portName: string;
  portGrade: string;
  administrator: string;
  prefectureCode: string;
  prefectureName: string;
  berthCount: number;
}

async function fetchAllBerthIds(): Promise<string[]> {
  const ids: string[] = [];
  let offset = 0;
  while (true) {
    const { totalNumber, results } = await searchBerths(offset, BATCH_SIZE);
    for (const r of results) {
      ids.push(r.id);
    }
    console.log(`  Search: ${ids.length} / ${totalNumber}`);
    offset += BATCH_SIZE;
    if (offset >= totalNumber) break;
  }
  return ids;
}

async function fetchBerthDetails(ids: string[]): Promise<any[]> {
  const details: any[] = [];
  // Process in concurrent batches
  for (let i = 0; i < ids.length; i += CONCURRENT_DETAIL_REQUESTS) {
    const batch = ids.slice(i, i + CONCURRENT_DETAIL_REQUESTS);
    const results = await Promise.allSettled(batch.map((id) => getBerthDetail(id)));
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        details.push(r.value);
      }
    }
    if ((i + CONCURRENT_DETAIL_REQUESTS) % 100 === 0 || i + CONCURRENT_DETAIL_REQUESTS >= ids.length) {
      console.log(`  Details: ${details.length} / ${ids.length}`);
    }
  }
  return details;
}

function aggregatePorts(details: any[]): Map<string, CyportPort> {
  const portMap = new Map<string, CyportPort>();

  for (const m of details) {
    const cyportCode = m["CYP:classification_name_3_code"];
    const portName = m["CYP:classification_name_3_text"];
    if (!cyportCode || !portName) continue;

    if (!portMap.has(cyportCode)) {
      const portRate = m["CYP:port_rate"] || "";
      // Normalize grade to full name
      let grade = portRate;
      if (portRate === "国際戦略") grade = "国際戦略港湾";
      else if (portRate === "国際拠点") grade = "国際拠点港湾";
      else if (portRate === "重要") grade = "重要港湾";

      const prefCodes: number[] = m["DPF:prefecture_code"] || [];
      const prefNames: string[] = m["DPF:prefecture_name"] || [];

      portMap.set(cyportCode, {
        cyportCode,
        portName,
        portGrade: grade,
        administrator: m["CYP:admin_name_2_level2_text"] || "",
        prefectureCode: prefCodes.length > 0 ? String(prefCodes[0]).padStart(2, "0") : "",
        prefectureName: prefNames[0] || "",
        berthCount: 0,
      });
    }
    portMap.get(cyportCode)!.berthCount++;
  }

  return portMap;
}

// ── マッチング ──

function normalizePortName(name: string): string {
  return name
    .replace(/港$/, "")
    .replace(/\s+/g, "")
    .trim();
}

interface MatchResult {
  portCode: string;
  portName: string;
  prefectureCode: string;
  cyportCode: string;
  portGrade: string;
  administrator: string;
}

function matchPorts(
  cyportPorts: Map<string, CyportPort>,
  dbPorts: Array<{ port_code: string; port_name: string; prefecture_code: string }>
): { matched: MatchResult[]; unmatchedDb: typeof dbPorts; unmatchedCyport: CyportPort[] } {
  const matched: MatchResult[] = [];
  const matchedDbCodes = new Set<string>();
  const matchedCyportCodes = new Set<string>();

  // Build lookup: normalized name + pref_code → db port
  const dbLookup = new Map<string, (typeof dbPorts)[0]>();
  for (const p of dbPorts) {
    const key = `${normalizePortName(p.port_name)}|${p.prefecture_code}`;
    dbLookup.set(key, p);
  }

  // Match by name + prefecture
  for (const [cyCode, cyPort] of cyportPorts) {
    const key = `${normalizePortName(cyPort.portName)}|${cyPort.prefectureCode}`;
    const dbPort = dbLookup.get(key);
    if (dbPort) {
      matched.push({
        portCode: dbPort.port_code,
        portName: dbPort.port_name,
        prefectureCode: dbPort.prefecture_code,
        cyportCode: cyCode,
        portGrade: cyPort.portGrade,
        administrator: cyPort.administrator,
      });
      matchedDbCodes.add(dbPort.port_code);
      matchedCyportCodes.add(cyCode);
    }
  }

  const unmatchedDb = dbPorts.filter((p) => !matchedDbCodes.has(p.port_code));
  const unmatchedCyport = Array.from(cyportPorts.values()).filter(
    (p) => !matchedCyportCodes.has(p.cyportCode)
  );

  return { matched, unmatchedDb, unmatchedCyport };
}

// ── メイン ──

async function main() {
  console.log("=== cyport → ports テーブル インポート ===");
  if (dryRun) console.log("(dry-run モード)");
  console.log();

  // 1. cyport データ取得 or キャッシュ読み込み
  let details: any[];

  if (fromCache && fs.existsSync(CACHE_PATH)) {
    console.log(`キャッシュ読み込み: ${CACHE_PATH}`);
    details = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    console.log(`  ${details.length} 件のバース詳細を読み込み`);
  } else {
    console.log("1. 全バース ID を取得中...");
    const ids = await fetchAllBerthIds();
    console.log(`  ${ids.length} 件の ID を取得`);

    console.log("2. バース詳細を取得中...");
    details = await fetchBerthDetails(ids);
    console.log(`  ${details.length} 件の詳細を取得`);

    // キャッシュ保存
    fs.writeFileSync(CACHE_PATH, JSON.stringify(details, null, 2));
    console.log(`  キャッシュ保存: ${CACHE_PATH}`);
  }

  // 2. 港湾ごとに集約
  console.log("\n3. 港湾ごとに集約中...");
  const cyportPorts = aggregatePorts(details);
  console.log(`  ${cyportPorts.size} 港を検出`);

  // 3. 既存 DB の ports を取得
  const dbPath = LOCAL_DB_PATHS.STATIC.getPath();
  console.log(`\n4. ローカル D1 読み込み: ${dbPath}`);
  const db = new Database(dbPath);
  const dbPorts = db
    .prepare("SELECT port_code, port_name, prefecture_code FROM ports")
    .all() as Array<{ port_code: string; port_name: string; prefecture_code: string }>;
  console.log(`  ${dbPorts.length} 港を読み込み`);

  // 4. マッチング
  console.log("\n5. マッチング...");
  const { matched, unmatchedDb, unmatchedCyport } = matchPorts(cyportPorts, dbPorts);

  console.log(`\n=== マッチング結果 ===`);
  console.log(`  マッチ: ${matched.length} 港`);
  console.log(`  DB のみ (cyport に無い): ${unmatchedDb.length} 港`);
  console.log(`  cyport のみ (DB に無い): ${unmatchedCyport.length} 港`);

  // マッチ一覧
  console.log("\n--- マッチした港湾 ---");
  for (const m of matched.sort((a, b) => a.portCode.localeCompare(b.portCode))) {
    console.log(
      `  ${m.portCode} ${m.portName} → cyport:${m.cyportCode} 等級:${m.portGrade} 管理者:${m.administrator}`
    );
  }

  if (unmatchedCyport.length > 0) {
    console.log("\n--- cyport にあるが DB に無い港湾 ---");
    for (const p of unmatchedCyport.sort((a, b) => a.cyportCode.localeCompare(b.cyportCode))) {
      console.log(`  ${p.cyportCode} ${p.portName} (${p.prefectureName}) ${p.portGrade}`);
    }
  }

  // 5. DB 更新
  if (!dryRun && matched.length > 0) {
    console.log("\n6. DB 更新中...");
    const stmt = db.prepare(
      "UPDATE ports SET port_grade = ?, administrator = ?, cyport_code = ?, updated_at = CURRENT_TIMESTAMP WHERE port_code = ?"
    );

    const updateMany = db.transaction((items: MatchResult[]) => {
      for (const m of items) {
        stmt.run(m.portGrade, m.administrator, m.cyportCode, m.portCode);
      }
    });
    updateMany(matched);
    console.log(`  ${matched.length} 港を更新完了`);

    // 検証
    const updated = db
      .prepare("SELECT port_name, port_grade, administrator, cyport_code FROM ports WHERE port_grade IS NOT NULL LIMIT 5")
      .all();
    console.log("\n--- 更新サンプル ---");
    for (const r of updated as any[]) {
      console.log(`  ${r.port_name}: 等級=${r.port_grade} 管理者=${r.administrator} cyport=${r.cyport_code}`);
    }
  } else if (dryRun) {
    console.log("\n(dry-run: DB 更新をスキップ)");
  }

  db.close();
  console.log("\n完了");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
