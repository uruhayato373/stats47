/**
 * 乙種港湾の緯度経度を国土数値情報 C02 (港湾データ) から投入するスクリプト
 *
 * C02 Shapefile (PortAndHarbor) を読み込み、DB の ports テーブルで
 * latitude IS NULL の港湾に対して名称マッチングで座標を登録する。
 *
 * Usage:
 *   # 事前: C02 データをダウンロード・展開
 *   curl -sL "https://nlftp.mlit.go.jp/ksj/gml/data/C02/C02-14/C02-14_GML.zip" -o /tmp/c02-gml.zip
 *   unzip -o /tmp/c02-gml.zip -d /tmp/c02-gml
 *
 *   npx tsx packages/database/scripts/update-port-latlng.ts
 *   npx tsx packages/database/scripts/update-port-latlng.ts --dry-run
 */

import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(__dirname, "../../../.env.local") });
import Database from "better-sqlite3";
import { LOCAL_DB_PATHS } from "../src/config/local-db-paths";
import * as shapefile from "shapefile";

const SHP_PATH = "/tmp/c02-gml/C02-14_GML/C02-14-g_PortAndHarbor.shp";
const DBF_PATH = "/tmp/c02-gml/C02-14_GML/C02-14-g_PortAndHarbor.dbf";

const isDryRun = process.argv.includes("--dry-run");

// C02 フィールドマッピング
// C02_001: 港湾種別 (1=甲種, 2=乙種, 3=56条港湾)
// C02_002: 都道府県コード (01-47)
// C02_003: 港湾コード (5桁)
// C02_004: 名称コード
// C02_005: 港湾名
// C02_007: 管理者名
// C02_008: 緯度 (文字列)
// C02_009: 経度 (文字列)

interface C02Feature {
  portCode: string;
  prefCode: string;
  portName: string;
  portType: string;
  lat: number;
  lng: number;
}

async function loadC02Data(): Promise<C02Feature[]> {
  const features: C02Feature[] = [];
  const source = await shapefile.open(SHP_PATH, DBF_PATH, { encoding: "shift_jis" });

  let result = await source.read();
  while (!result.done) {
    const props = result.value.properties;
    const geom = result.value.geometry;

    if (geom && geom.type === "Point" && props) {
      const portCode = (props.C02_004 || "").trim(); // e-Stat 港コード
      const prefCode = portCode.substring(0, 2);    // 港コードの先頭2桁 = 都道府県
      const portName = (props.C02_005 || "").trim();
      const portType = (props.C02_001 || "").trim();
      // Shapefile coordinates: [lng, lat]
      const [lng, lat] = geom.coordinates;

      if (portCode && lat && lng) {
        features.push({ portCode, prefCode, portName, portType, lat, lng });
      }
    }
    result = await source.read();
  }

  return features;
}

/** 名称正規化: 「港」「湾」末尾を除去、空白除去 */
function normalize(name: string): string {
  return name
    .replace(/[　\s]+/g, "")
    .replace(/[港湾]$/, "")
    .replace(/[（(].+[）)]$/, "");
}

async function main() {
  const dbPath = LOCAL_DB_PATHS.STATIC.getPath();
  const db = new Database(dbPath);
  console.log(`DB: ${dbPath}`);
  if (isDryRun) console.log("【DRY RUN】");

  // 1. C02 データ読み込み
  console.log(`\nC02 Shapefile: ${SHP_PATH}`);
  const c02Features = await loadC02Data();
  console.log(`C02 港湾数: ${c02Features.length}`);

  // 2. lat/lng が NULL の港湾を取得
  const nullPorts = db
    .prepare("SELECT port_code, port_name, prefecture_code, port_class FROM ports WHERE latitude IS NULL")
    .all() as any[];
  console.log(`lat/lng NULL の港湾: ${nullPorts.length}`);

  // 3. マッチング
  const updateStmt = db.prepare(
    "UPDATE ports SET latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP WHERE port_code = ?"
  );

  // C02 を都道府県ごとにグループ化
  const c02ByPref = new Map<string, C02Feature[]>();
  for (const f of c02Features) {
    const key = f.prefCode;
    if (!c02ByPref.has(key)) c02ByPref.set(key, []);
    c02ByPref.get(key)!.push(f);
  }

  // C02 を港コードでインデックス化
  const c02ByCode = new Map<string, C02Feature>();
  for (const f of c02Features) {
    c02ByCode.set(f.portCode, f);
  }

  let matched = 0;
  let unmatched = 0;
  const unmatchedPorts: any[] = [];

  const txn = db.transaction(() => {
    for (const port of nullPorts) {
      // 戦略1: 港コード完全一致
      let c02 = c02ByCode.get(port.port_code);

      // 戦略2: 同一都道府県内で名称完全一致
      if (!c02) {
        const samePref = c02ByPref.get(port.prefecture_code) || [];
        c02 = samePref.find((f) => f.portName === port.port_name);
      }

      // 戦略3: 正規化名称マッチ
      if (!c02) {
        const samePref = c02ByPref.get(port.prefecture_code) || [];
        const normTarget = normalize(port.port_name);
        c02 = samePref.find((f) => normalize(f.portName) === normTarget);
      }

      if (c02) {
        if (!isDryRun) {
          updateStmt.run(c02.lat, c02.lng, port.port_code);
        }
        matched++;
      } else {
        unmatched++;
        unmatchedPorts.push(port);
      }
    }
  });

  txn();

  console.log(`\n=== 結果 ===`);
  console.log(`マッチ成功: ${matched} / ${nullPorts.length}`);
  console.log(`マッチ失敗: ${unmatched}`);

  if (unmatchedPorts.length > 0 && unmatchedPorts.length <= 100) {
    console.log(`\n未マッチ港湾一覧:`);
    for (const p of unmatchedPorts) {
      const candidates = (c02ByPref.get(p.prefecture_code) || [])
        .map((f) => `  ${f.portCode}:${f.portName}`)
        .join(", ");
      console.log(`  ${p.port_code} ${p.port_name} (${p.prefecture_code}) → 候補: ${candidates || "なし"}`);
    }
  } else if (unmatchedPorts.length > 100) {
    console.log(`\n未マッチ港湾（先頭20件）:`);
    for (const p of unmatchedPorts.slice(0, 20)) {
      console.log(`  ${p.port_code} ${p.port_name} (${p.prefecture_code})`);
    }
    console.log(`  ... 他 ${unmatchedPorts.length - 20} 件`);
  }

  // 最終統計
  const stats = db
    .prepare(
      "SELECT port_class, COUNT(*) as total, SUM(CASE WHEN latitude IS NOT NULL THEN 1 ELSE 0 END) as with_coords FROM ports GROUP BY port_class"
    )
    .all() as any[];
  console.log(`\n港湾座標登録状況:`);
  for (const s of stats) {
    console.log(`  ${s.port_class}: ${s.with_coords}/${s.total} (${((s.with_coords / s.total) * 100).toFixed(1)}%)`);
  }

  db.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
