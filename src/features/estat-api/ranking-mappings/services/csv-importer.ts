import "server-only";

/**
 * CSVインポート機能
 *
 * CSVファイルをパースして`estat_ranking_mappings`テーブルにインポートする機能を提供します。
 */

import { bulkUpsertRankingMappings } from "../repositories/ranking-mappings-repository";

import type { CsvRow, EstatRankingMappingInput } from "../types";

/**
 * CSV行をパース（カンマ区切り、クォート対応）
 *
 * @param line - CSV行文字列
 * @returns パースされた値の配列
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

  // 最後の値
  result.push(current.trim());
  return result;
}

/**
 * CSVファイルをパース
 *
 * @param filePath - CSVファイルのパス
 * @returns パースされたCSV行の配列
 */
export async function parseCsvFile(filePath: string): Promise<CsvRow[]> {
  try {
    // 動的インポートでfsモジュールを使用（サーバーサイドのみ）
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const path = require("path");

    // ファイルパスの解決
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : join(process.cwd(), filePath);

    // ファイルを読み込む
    const content = readFileSync(fullPath, "utf-8");
    const lines = content.trim().split(/\r?\n/);

    if (lines.length < 2) {
      throw new Error("CSVファイルにはヘッダー行とデータ行が必要です");
    }

    // ヘッダー行を取得
    const headers = parseCsvLine(lines[0]);

    // 期待されるヘッダー
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

    // ヘッダーの検証
    if (headers.length !== expectedHeaders.length) {
      throw new Error(
        `CSVヘッダーが不正です。期待: ${expectedHeaders.length}カラム、実際: ${headers.length}カラム`
      );
    }

    for (let i = 0; i < headers.length; i++) {
      if (headers[i] !== expectedHeaders[i]) {
        throw new Error(
          `CSVヘッダーが不正です。期待: ${expectedHeaders[i]}、実際: ${headers[i]}`
        );
      }
    }

    // データ行をパース
    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        continue; // 空行をスキップ
      }

      const values = parseCsvLine(line);
      if (values.length !== headers.length) {
        console.warn(
          `[parseCsvFile] 行 ${i + 1} のカラム数が不正です。スキップします:`,
          values
        );
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
  } catch (error) {
    console.error("[parseCsvFile] CSVパースエラー:", error);
    throw error;
  }
}

/**
 * CSV行をEstatRankingMappingInputに変換
 *
 * @param row - CSV行
 * @returns EstatRankingMappingInput
 */
function convertCsvRowToInput(row: CsvRow): EstatRankingMappingInput {
  return {
    stats_data_id: row.stats_data_id,
    cat01: row.cat01,
    item_name: row.item_name,
    item_code: row.item_code,
    unit: row.unit || null,
    dividing_value: row.dividing_value || null,
    new_unit: row.new_unit || null,
    ascending: row.ascending.toLowerCase() === "true",
    is_ranking: false, // デフォルトでfalse（CSVインポート時は更新しない）
  };
}

/**
 * CSVデータをデータベースにインポート
 *
 * @param filePath - CSVファイルのパス
 * @returns インポートされた件数
 */
export async function importCsvToDatabase(
  filePath: string
): Promise<number> {
  try {
    console.log(`[importCsvToDatabase] CSVファイルを読み込み中: ${filePath}`);

    // CSVファイルをパース
    const rows = await parseCsvFile(filePath);
    console.log(`[importCsvToDatabase] ${rows.length}件の行をパースしました`);

    if (rows.length === 0) {
      console.warn("[importCsvToDatabase] インポートするデータがありません");
      return 0;
    }

    // CSV行をEstatRankingMappingInputに変換
    const inputs: EstatRankingMappingInput[] = rows.map(convertCsvRowToInput);

    // バルクアップサートを実行
    const processed = await bulkUpsertRankingMappings(inputs);
    console.log(
      `[importCsvToDatabase] ${processed}件のデータをインポートしました`
    );

    return processed;
  } catch (error) {
    console.error("[importCsvToDatabase] CSVインポートエラー:", error);
    throw error;
  }
}

/**
 * CSV文字列（ファイルアップロード用）をパース
 *
 * @param csvContent - CSV文字列
 * @returns パースされたCSV行の配列
 */
export async function parseCsvContent(csvContent: string): Promise<CsvRow[]> {
  try {
    const lines = csvContent.trim().split(/\r?\n/);

    if (lines.length < 2) {
      throw new Error("CSVにはヘッダー行とデータ行が必要です");
    }

    // ヘッダー行を取得
    const headers = parseCsvLine(lines[0]);

    // 期待されるヘッダー
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

    // ヘッダーの検証
    if (headers.length !== expectedHeaders.length) {
      throw new Error(
        `CSVヘッダーが不正です。期待: ${expectedHeaders.length}カラム、実際: ${headers.length}カラム`
      );
    }

    for (let i = 0; i < headers.length; i++) {
      if (headers[i] !== expectedHeaders[i]) {
        throw new Error(
          `CSVヘッダーが不正です。期待: ${expectedHeaders[i]}、実際: ${headers[i]}`
        );
      }
    }

    // データ行をパース
    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        continue; // 空行をスキップ
      }

      const values = parseCsvLine(line);
      if (values.length !== headers.length) {
        console.warn(
          `[parseCsvContent] 行 ${i + 1} のカラム数が不正です。スキップします:`,
          values
        );
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
  } catch (error) {
    console.error("[parseCsvContent] CSVパースエラー:", error);
    throw error;
  }
}

/**
 * CSV文字列をデータベースにインポート
 *
 * @param csvContent - CSV文字列
 * @returns インポートされた件数
 */
export async function importCsvContentToDatabase(
  csvContent: string
): Promise<number> {
  try {
    console.log(`[importCsvContentToDatabase] CSVコンテンツをパース中`);

    // CSV文字列をパース
    const rows = await parseCsvContent(csvContent);
    console.log(`[importCsvContentToDatabase] ${rows.length}件の行をパースしました`);

    if (rows.length === 0) {
      console.warn(
        "[importCsvContentToDatabase] インポートするデータがありません"
      );
      return 0;
    }

    // CSV行をEstatRankingMappingInputに変換
    const inputs: EstatRankingMappingInput[] = rows.map(convertCsvRowToInput);

    // バルクアップサートを実行
    const processed = await bulkUpsertRankingMappings(inputs);
    console.log(
      `[importCsvContentToDatabase] ${processed}件のデータをインポートしました`
    );

    return processed;
  } catch (error) {
    console.error("[importCsvContentToDatabase] CSVインポートエラー:", error);
    throw error;
  }
}

