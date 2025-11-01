/**
 * e-StatランキングマッピングCSVインポートスクリプト
 * 
 * mapping.csvのデータをestat_ranking_mappingsテーブルに投入します
 */

import { readFileSync } from "fs";
import { getD1 } from "../src/features/estat-api/db/d1";

interface CsvRow {
  stats_data_id: string;
  cat01: string;
  item_name: string;
  item_code: string;
  unit: string;
  dividing_value: string;
  new_unit: string;
  ascending: string;
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
  const expectedHeaders = [
    "stats_data_id",
    "cat01",
    "item_name",
    "item_code",
    "unit",
    "dividing_value",
    "new_unit",
    "ascending",
  ];

  if (headers.length !== expectedHeaders.length) {
    throw new Error(
      `CSVヘッダーが不正です。期待: ${expectedHeaders.length}カラム、実際: ${headers.length}カラム`
    );
  }

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      continue;
    }

    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      console.warn(`行 ${i + 1} のカラム数が不正です。スキップします:`, values);
      continue;
    }

    rows.push({
      stats_data_id: values[0] || "",
      cat01: values[1] || "",
      item_name: values[2] || "",
      item_code: values[3] || "",
      unit: values[4] || "",
      dividing_value: values[5] || "",
      new_unit: values[6] || "",
      ascending: values[7] || "",
    });
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

  console.log(`[import-ranking-mappings] CSVインポート開始: ${csvFilePath}`);

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
        unit, dividing_value, new_unit, ascending, is_ranking,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(stats_data_id, cat01, item_code) 
      DO UPDATE SET
        item_name = excluded.item_name,
        unit = excluded.unit,
        dividing_value = excluded.dividing_value,
        new_unit = excluded.new_unit,
        ascending = excluded.ascending,
        updated_at = excluded.updated_at
      -- is_rankingは既存の値を保持（CSVインポート時は更新しない）
      `
    );

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      for (const row of batch) {
        try {
          const result = await stmt
            .bind(
              row.stats_data_id,
              row.cat01,
              row.item_name,
              row.item_code,
              row.unit || null,
              row.dividing_value || null,
              row.new_unit || null,
              row.ascending.toLowerCase() === "true" ? 1 : 0,
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
