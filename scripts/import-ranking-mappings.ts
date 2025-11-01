/**
 * e-StatランキングマッピングCSVインポートスクリプト
 * 
 * mapping.csvのデータをestat_ranking_mappingsテーブルに投入します
 * 
 * 使用方法:
 *   npx tsx scripts/import-ranking-mappings.ts <CSVファイルパス> [area_type]
 * 
 * 引数:
 *   CSVファイルパス: インポートするCSVファイルのパス（必須）
 *   area_type: 全てのレコードに適用する地域タイプ（オプション）
 *              'prefecture' | 'city' | 'national'
 *              指定しない場合は、CSV内のarea_typeカラム、またはデフォルトの'prefecture'を使用
 * 
 * 例:
 *   npx tsx scripts/import-ranking-mappings.ts mapping.csv
 *   npx tsx scripts/import-ranking-mappings.ts mapping_city.csv city
 */

import { readFileSync } from "fs";
import { getD1 } from "../src/features/estat-api/db/d1";

interface CsvRow {
  stats_data_id: string;
  cat01: string;
  item_name: string;
  item_code: string;
  unit: string;
  dividing_value?: string;
  new_unit?: string;
  ascending?: string;
  area_type?: string;
}

/**
 * CSV行をパース（カンマ区切り、クォート対応）
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * CSVファイルをパース
 */
function parseCsvFile(filePath: string): CsvRow[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.trim().split(/\r?\n/);

  if (lines.length < 2) {
    throw new Error("CSVファイルにはヘッダー行とデータ行が必要です");
  }

  const headers = parseCsvLine(lines[0]);
  
  // 最小限の必須ヘッダー
  const requiredHeaders = [
    "stats_data_id",
    "cat01",
    "item_name",
    "item_code",
    "unit",
  ];

  // 必須ヘッダーの検証
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      throw new Error(`CSVヘッダーに必須カラムがありません: ${required}`);
    }
  }

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      continue;
    }

    const values = parseCsvLine(line);
    
    // ヘッダーと値の対応を取得
    const getValueByHeader = (headerName: string): string => {
      const index = headers.indexOf(headerName);
      return index >= 0 && index < values.length ? values[index] || "" : "";
    };

    const rowData: CsvRow = {
      stats_data_id: getValueByHeader("stats_data_id"),
      cat01: getValueByHeader("cat01"),
      item_name: getValueByHeader("item_name"),
      item_code: getValueByHeader("item_code"),
      unit: getValueByHeader("unit"),
    };
    
    // オプションカラム（area_type等）がある場合は追加
    const areaType = getValueByHeader("area_type");
    if (areaType) {
      rowData.area_type = areaType;
    }
    
    rows.push(rowData);
  }

  return rows;
}

/**
 * メイン処理
 */
async function main() {
  const csvFilePath =
    process.argv[2] ||
    "/Users/minamidaisuke/stats47-blog/_backend/e_stat/mapping/mapping.csv";
  
  // コマンドライン引数からarea_typeを取得（オプション）
  const commandLineAreaType = process.argv[3];
  
  // area_typeが指定されている場合は有効な値か検証
  const validAreaTypes = ["prefecture", "city", "national"];
  if (commandLineAreaType && !validAreaTypes.includes(commandLineAreaType)) {
    console.error(
      `[import-ranking-mappings] ❌ 無効なarea_type: ${commandLineAreaType}`
    );
    console.error(
      `[import-ranking-mappings] 有効な値: ${validAreaTypes.join(", ")}`
    );
    process.exit(1);
  }

  console.log(`[import-ranking-mappings] CSVインポート開始: ${csvFilePath}`);
  if (commandLineAreaType) {
    console.log(`[import-ranking-mappings] area_typeを強制設定: ${commandLineAreaType}`);
  }

  try {
    // CSVファイルをパース
    const rows = parseCsvFile(csvFilePath);
    console.log(`[import-ranking-mappings] ${rows.length}件の行をパースしました`);

    if (rows.length === 0) {
      console.warn("[import-ranking-mappings] インポートするデータがありません");
      process.exit(0);
    }

    // データベースに接続
    const db = getD1();
    const now = new Date().toISOString();

    // バッチ処理で実行（最大100件ずつ）
    const batchSize = 100;
    let totalProcessed = 0;

    const stmt = db.prepare(
      `INSERT INTO estat_ranking_mappings (
        stats_data_id, cat01, item_name, item_code,
        unit, area_type, is_ranking,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(stats_data_id, cat01) 
        DO UPDATE SET
          item_name = excluded.item_name,
          item_code = excluded.item_code,
          unit = excluded.unit,
          area_type = excluded.area_type,
          updated_at = excluded.updated_at
        -- is_rankingは既存の値を保持（CSVインポート時は更新しない）
      `
    );

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      for (const row of batch) {
        try {
          // 優先順位: コマンドライン引数 > CSV内の値 > デフォルト
          const areaType = commandLineAreaType || row.area_type || "prefecture";
          
          const result = await stmt
            .bind(
              row.stats_data_id,
              row.cat01,
              row.item_name,
              row.item_code,
              row.unit || null,
              areaType,
              0, // is_rankingは全てfalse
              now,
              now
            )
            .run();

          if (result.success) {
            totalProcessed++;
          }
        } catch (error) {
          console.error(
            `[import-ranking-mappings] 行 ${i + 1} のインポートエラー:`,
            error
          );
        }
      }

      if (i % 1000 === 0) {
        console.log(
          `[import-ranking-mappings] 進捗: ${i}/${rows.length}件処理済み`
        );
      }
    }

    console.log(
      `[import-ranking-mappings] ✅ ${totalProcessed}件のデータをインポートしました`
    );
    process.exit(0);
  } catch (error) {
    console.error("[import-ranking-mappings] ❌ CSVインポートエラー:", error);
    process.exit(1);
  }
}

main();
