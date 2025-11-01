/**
 * estat_ranking_mappings テーブルをCSVファイルに書き出すスクリプト
 *
 * ローカルD1データベースからestat_ranking_mappingsテーブルのデータを取得し、
 * CSV形式でファイルに書き出します。
 */

import * as fs from "fs";
import * as path from "path";

/**
 * CSV値のエスケープ処理
 */
function escapeCsvValue(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);
  
  // カンマ、ダブルクォート、改行を含む場合はダブルクォートで囲む
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    // ダブルクォートをエスケープ
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * ローカルSQLiteデータベースへのアクセス
 */
function getLocalD1Database() {
  const Database = require("better-sqlite3");

  // ローカルD1データベースのパスを検索
  const possiblePaths = [
    ".wrangler/state/v3/d1/miniflare-D1DatabaseObject",
    ".wrangler/state/v3/d1",
  ].filter(Boolean);

  let dbPath: string | null = null;

  for (const basePath of possiblePaths) {
    if (!fs.existsSync(basePath)) continue;

    // ディレクトリ内の.sqliteファイルを検索
    const files = fs.readdirSync(basePath, { recursive: true });
    const sqliteFile = files.find((file: string) =>
      typeof file === "string" && file.endsWith(".sqlite")
    );

    if (sqliteFile) {
      dbPath = path.join(basePath, sqliteFile);
      break;
    }

    // ディレクトリ自体が.sqliteファイルの場合
    if (basePath.endsWith(".sqlite")) {
      dbPath = basePath;
      break;
    }
  }

  if (!dbPath || !fs.existsSync(dbPath)) {
    throw new Error("ローカルSQLiteデータベースが見つかりません");
  }

  return new Database(dbPath, { readonly: true });
}

/**
 * estat_ranking_mappingsテーブルからデータを取得
 */
function fetchRankingMappings() {
  console.log("📊 データベースからestat_ranking_mappingsデータを取得中...");

  const db = getLocalD1Database();

  try {
    const rows = db
      .prepare(
        `SELECT 
          stats_data_id,
          cat01,
          item_name,
          item_code,
          unit,
          area_type,
          is_ranking,
          created_at,
          updated_at
        FROM estat_ranking_mappings
        ORDER BY stats_data_id, cat01`
      )
      .all();

    console.log(`✅ ${rows.length}件のレコードを取得しました`);
    return rows as Array<{
      stats_data_id: string;
      cat01: string;
      item_name: string;
      item_code: string;
      unit: string | null;
      area_type: string;
      is_ranking: number;
      created_at: string;
      updated_at: string;
    }>;
  } finally {
    db.close();
  }
}

/**
 * CSVファイルに書き出し
 */
function exportToCsv(
  rows: Array<{
    stats_data_id: string;
    cat01: string;
    item_name: string;
    item_code: string;
    unit: string | null;
    area_type: string;
    is_ranking: number;
    created_at: string;
    updated_at: string;
  }>,
  outputPath: string
) {
  console.log(`📝 CSVファイルに書き出し中: ${outputPath}`);

  // CSVヘッダー
  const headers = [
    "stats_data_id",
    "cat01",
    "item_name",
    "item_code",
    "unit",
    "area_type",
    "is_ranking",
    "created_at",
    "updated_at",
  ];

  // CSV行を生成
  const csvRows: string[] = [];

  // ヘッダー行
  csvRows.push(headers.map((h) => escapeCsvValue(h)).join(","));

  // データ行
  for (const row of rows) {
    const csvRow = [
      escapeCsvValue(row.stats_data_id),
      escapeCsvValue(row.cat01),
      escapeCsvValue(row.item_name),
      escapeCsvValue(row.item_code),
      escapeCsvValue(row.unit),
      escapeCsvValue(row.area_type),
      escapeCsvValue(row.is_ranking ? "1" : "0"),
      escapeCsvValue(row.created_at),
      escapeCsvValue(row.updated_at),
    ];
    csvRows.push(csvRow.join(","));
  }

  // ファイルに書き出し
  fs.writeFileSync(outputPath, csvRows.join("\n"), "utf-8");

  console.log(`✅ CSVファイルを作成しました: ${outputPath}`);
  console.log(`   レコード数: ${rows.length}件`);
}

/**
 * メイン処理
 */
async function main() {
  try {
    // 出力ファイルパス（コマンドライン引数から取得、なければデフォルト）
    const outputPath =
      process.argv[2] || "data/estat_ranking_mappings_export.csv";

    // 出力ディレクトリを作成
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 出力ディレクトリを作成しました: ${outputDir}`);
    }

    // データ取得
    const rows = fetchRankingMappings();

    if (rows.length === 0) {
      console.log("⚠️  データが存在しません");
      return;
    }

    // CSV書き出し
    exportToCsv(rows, outputPath);

    console.log("\n✅ 処理が完了しました");
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// スクリプト実行
main();

