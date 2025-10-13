import * as fs from "fs";
import * as path from "path";
import { createD1Database } from "../src/lib/d1-client";

// .env.localファイルを手動で読み込み
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const [key, ...valueParts] = trimmedLine.split("=");
        if (key && valueParts.length > 0) {
          process.env[key] = valueParts.join("=");
        }
      }
    }
  }
}

// 環境変数を読み込み
loadEnvFile();

interface MappingRow {
  stats_data_id: string;
  cat01: string;
  item_name: string;
  item_code: string;
  unit: string;
}

// 主要な統計データIDのホワイトリスト
const ALLOWED_STATS_IDS = [
  "0000010101", // 人口・世帯
  "0000010103", // 自然環境
  "0000010104", // 経済基盤
  "0000010105", // 行政基盤
  "0000010106", // 教育
  "0000010107", // 労働
  "0000010108", // 居住
  "0000010109", // 健康・医療
  "0000010110", // 福祉・社会保障
  "0000010204", // 地方財政
  "0000010210", // 社会福祉
];

function parseCSV(csvContent: string): MappingRow[] {
  const lines = csvContent.trim().split("\n");
  const headers = lines[0].split(",");
  const records: MappingRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values.length >= 5) {
      records.push({
        stats_data_id: values[0],
        cat01: values[1],
        item_name: values[2],
        item_code: values[3],
        unit: values[4],
      });
    }
  }

  return records;
}

async function migrateRankingKeysRemote() {
  console.log("🚀 リモートD1へのランキングキー移行開始...\n");

  try {
    // 1. CSVファイル読み込み
    const csvPath = path.join(process.cwd(), "src/data/mapping.csv");
    console.log(`📁 CSVファイル読み込み: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSVファイルが見つかりません: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");

    // 2. CSV解析
    const allRecords: MappingRow[] = parseCSV(csvContent);

    // 3. フィルタリング
    const filteredRecords = allRecords.filter((record) =>
      ALLOWED_STATS_IDS.includes(record.stats_data_id)
    );

    console.log(`📊 データ統計:`);
    console.log(`  全レコード数: ${allRecords.length}`);
    console.log(`  フィルタ後: ${filteredRecords.length}`);
    console.log(`  除外: ${allRecords.length - filteredRecords.length}\n`);

    // 4. リモートD1データベース接続
    console.log("🔗 リモートD1データベース接続中...");
    const db = await createD1Database();

    // 5. バッチ更新
    let updated = 0;
    let notFound = 0;
    let errors = 0;

    console.log("📝 ランキングキー更新開始...\n");

    for (let i = 0; i < filteredRecords.length; i++) {
      const record = filteredRecords[i];

      try {
        const result = await db
          .prepare(
            `
          UPDATE estat_metainfo 
          SET ranking_key = ?
          WHERE stats_data_id = ? AND cat01 = ?
        `
          )
          .bind(
            record.item_code, // item_codeをranking_keyに設定
            record.stats_data_id,
            record.cat01
          )
          .run();

        if (result.success) {
          updated++;
          if (updated % 100 === 0) {
            console.log(
              `  処理中... ${updated}/${filteredRecords.length} (${Math.round(
                (updated / filteredRecords.length) * 100
              )}%)`
            );
          }
        } else {
          notFound++;
        }
      } catch (error) {
        console.error(
          `❌ エラー: ${record.stats_data_id}, ${record.cat01}`,
          error
        );
        errors++;
      }
    }

    // 6. 結果レポート
    console.log(`\n✅ 移行完了:\n`);
    console.log(`  処理レコード数: ${filteredRecords.length}`);
    console.log(`  更新成功: ${updated}`);
    console.log(`  該当なし: ${notFound}`);
    console.log(`  エラー: ${errors}`);

    // 7. サンプル確認
    console.log("\n🔍 更新結果サンプル:");
    try {
      const sampleResult = await db
        .prepare(
          `
        SELECT stats_data_id, cat01, ranking_key, item_name 
        FROM estat_metainfo 
        WHERE ranking_key IS NOT NULL 
        LIMIT 5
      `
        )
        .all();

      console.table(sampleResult.results);
    } catch (error) {
      console.error("サンプル確認エラー:", error);
    }
  } catch (error) {
    console.error("❌ 移行エラー:", error);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  migrateRankingKeysRemote().catch(console.error);
}

export { migrateRankingKeysRemote };
