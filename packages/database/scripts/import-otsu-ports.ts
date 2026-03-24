/**
 * 乙種港湾マスタデータ投入スクリプト
 *
 * e-Stat API メタデータから乙種港湾のポートコード・港名・都道府県を取得し、
 * ports テーブルに port_class='乙種' として投入する。
 *
 * Usage:
 *   npx tsx packages/database/scripts/import-otsu-ports.ts
 *   npx tsx packages/database/scripts/import-otsu-ports.ts --dry-run
 */

import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(__dirname, "../../../.env.local") });
import Database from "better-sqlite3";
import { LOCAL_DB_PATHS } from "../src/config/local-db-paths";

const API_KEY = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
if (!API_KEY) {
  console.error("NEXT_PUBLIC_ESTAT_APP_ID が未設定です");
  process.exit(1);
}

const META_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo";

// 乙種港湾 入港船舶表（最も港湾数が多い: 583件）
const STATS_DATA_ID = "0003130816";

const isDryRun = process.argv.includes("--dry-run");

/** 都道府県コード → 名前マッピング */
const PREFECTURE_NAMES: Record<string, string> = {
  "01": "北海道", "02": "青森県", "03": "岩手県", "04": "宮城県",
  "05": "秋田県", "06": "山形県", "07": "福島県", "08": "茨城県",
  "09": "栃木県", "10": "群馬県", "11": "埼玉県", "12": "千葉県",
  "13": "東京都", "14": "神奈川県", "15": "新潟県", "16": "富山県",
  "17": "石川県", "18": "福井県", "19": "山梨県", "20": "長野県",
  "21": "岐阜県", "22": "静岡県", "23": "愛知県", "24": "三重県",
  "25": "滋賀県", "26": "京都府", "27": "大阪府", "28": "兵庫県",
  "29": "奈良県", "30": "和歌山県", "31": "鳥取県", "32": "島根県",
  "33": "岡山県", "34": "広島県", "35": "山口県", "36": "徳島県",
  "37": "香川県", "38": "愛媛県", "39": "高知県", "40": "福岡県",
  "41": "佐賀県", "42": "長崎県", "43": "熊本県", "44": "大分県",
  "45": "宮崎県", "46": "鹿児島県", "47": "沖縄県",
};

interface PortMeta {
  portCode: string;
  portName: string;
  prefectureCode: string;
  prefectureName: string;
}

/** e-Stat メタデータから乙種港湾一覧を取得 */
async function fetchOtsuPortMeta(): Promise<PortMeta[]> {
  const url = `${META_URL}?appId=${API_KEY}&statsDataId=${STATS_DATA_ID}&lang=J`;
  console.log(`メタデータ取得: statsDataId=${STATS_DATA_ID}`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  const classObjs = json.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ;
  if (!classObjs) throw new Error("CLASS_INF が見つかりません");

  // cat03 が乙種港湾のディメンション
  const cat03 = Array.isArray(classObjs)
    ? classObjs.find((c: any) => c["@id"] === "cat03")
    : classObjs["@id"] === "cat03" ? classObjs : null;

  if (!cat03) throw new Error("cat03（乙種港湾）ディメンションが見つかりません");

  const classes: any[] = Array.isArray(cat03.CLASS) ? cat03.CLASS : [cat03.CLASS];
  console.log(`  メタデータ CLASS 件数: ${classes.length}`);

  const ports: PortMeta[] = [];

  for (const cls of classes) {
    const code = cls["@code"] as string;
    const name = cls["@name"] as string;

    // 全国計 (00500) や都道府県計 (XX000) を除外
    if (code.endsWith("000") || code.startsWith("00")) continue;
    if (!/^\d{5}$/.test(code)) continue;

    const prefCode = code.substring(0, 2);
    const prefName = PREFECTURE_NAMES[prefCode] || "";

    // 名前フォーマット: "都道府県名_港名" → 港名部分を抽出
    let portName = name;
    const underscoreIdx = name.indexOf("_");
    if (underscoreIdx >= 0) {
      portName = name.substring(underscoreIdx + 1);
    }

    ports.push({
      portCode: code,
      portName,
      prefectureCode: prefCode,
      prefectureName: prefName,
    });
  }

  return ports;
}

async function main() {
  console.log("=== 乙種港湾マスタデータ投入 ===");
  if (isDryRun) console.log("【DRY RUN】\n");

  const otsuPorts = await fetchOtsuPortMeta();
  console.log(`\n乙種港湾: ${otsuPorts.length} 港を取得\n`);

  // DB 接続
  const dbPath = LOCAL_DB_PATHS.STATIC.getPath();
  console.log(`DB: ${dbPath}`);
  const db = new Database(dbPath);

  // 既存の港湾コードを取得
  const existingPorts = db
    .prepare("SELECT port_code, port_class FROM ports")
    .all() as Array<{ port_code: string; port_class: string }>;
  const existingCodes = new Map(existingPorts.map((p) => [p.port_code, p.port_class]));
  console.log(`既存の港: ${existingCodes.size} 件 (甲種: ${existingPorts.filter(p => p.port_class === "甲種").length}, 乙種: ${existingPorts.filter(p => p.port_class === "乙種").length})`);

  // 重複チェック & 新規港湾抽出
  const newPorts: PortMeta[] = [];
  const duplicates: Array<{ code: string; existingClass: string }> = [];

  for (const p of otsuPorts) {
    const existingClass = existingCodes.get(p.portCode);
    if (existingClass) {
      duplicates.push({ code: p.portCode, existingClass });
    } else {
      newPorts.push(p);
    }
  }

  if (duplicates.length > 0) {
    console.log(`\n重複スキップ: ${duplicates.length} 件`);
    for (const d of duplicates.slice(0, 5)) {
      console.log(`  ${d.code} (既存: ${d.existingClass})`);
    }
    if (duplicates.length > 5) console.log(`  ... 他 ${duplicates.length - 5} 件`);
  }

  console.log(`\n新規投入対象: ${newPorts.length} 港`);

  if (!isDryRun && newPorts.length > 0) {
    const stmt = db.prepare(`
      INSERT INTO ports (port_code, port_name, prefecture_code, prefecture_name, port_class)
      VALUES (?, ?, ?, ?, '乙種')
    `);

    const txn = db.transaction(() => {
      for (const p of newPorts) {
        stmt.run(p.portCode, p.portName, p.prefectureCode, p.prefectureName);
      }
    });
    txn();
    console.log(`${newPorts.length} 港を投入完了`);
  }

  // サマリー表示
  const byClass = db
    .prepare("SELECT port_class, COUNT(*) as cnt FROM ports GROUP BY port_class")
    .all() as Array<{ port_class: string; cnt: number }>;
  const total = db.prepare("SELECT COUNT(*) as cnt FROM ports").get() as { cnt: number };

  console.log(`\n=== ports テーブル ===`);
  console.log(`合計: ${total.cnt} 港`);
  for (const r of byClass) {
    console.log(`  ${r.port_class}: ${r.cnt}`);
  }

  // 都道府県別の乙種港湾数を表示
  if (newPorts.length > 0) {
    const byPref = db
      .prepare(
        "SELECT prefecture_name, COUNT(*) as cnt FROM ports WHERE port_class = '乙種' GROUP BY prefecture_code ORDER BY prefecture_code"
      )
      .all() as Array<{ prefecture_name: string; cnt: number }>;
    console.log(`\n乙種港湾 都道府県別:`);
    for (const r of byPref) {
      console.log(`  ${r.prefecture_name}: ${r.cnt}`);
    }
  }

  db.close();
  console.log("\n完了");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
