import * as fs from "fs";
import * as path from "path";

/**
 * ローカルSQLiteデータベースへのアクセス
 */
function getLocalD1Database() {
  const Database = require("better-sqlite3");
  const fs = require("fs");

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

  return new Database(dbPath, { readonly: false });
}

/**
 * item_codeを生成（分類コードからスネークケースに変換）
 */
function generateItemCode(code: string): string {
  // 分類コードをそのまま使用（例: "A1101" -> "a1101"）
  return code.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

/**
 * JSONファイルからestat_ranking_mappingsにインポート
 */
async function importFromMetaInfoJson(filePath: string): Promise<void> {
  try {
    console.log(`[importFromMetaInfoJson] JSONファイルを読み込み中: ${filePath}`);

    // JSONファイルを読み込む
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    // statsDataIdを取得
    const statsDataId = data.statsDataId || data.metaInfo?.GET_META_INFO?.PARAMETER?.STATS_DATA_ID;
    if (!statsDataId) {
      throw new Error("statsDataIdが見つかりません");
    }

    console.log(`[importFromMetaInfoJson] statsDataId: ${statsDataId}`);

    // cat01の分類情報を取得
    const classInf = data.metaInfo?.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ;
    if (!classInf || !Array.isArray(classInf)) {
      throw new Error("CLASS_INFが見つかりません");
    }

    // cat01の分類オブジェクトを探す
    const cat01Obj = classInf.find((obj: any) => obj["@id"] === "cat01");
    if (!cat01Obj || !cat01Obj.CLASS || !Array.isArray(cat01Obj.CLASS)) {
      throw new Error("cat01の分類情報が見つかりません");
    }

    console.log(`[importFromMetaInfoJson] ${cat01Obj.CLASS.length}件の分類を検出`);

    // estat_ranking_mappingsに投入するデータを作成
    const inputs: Array<{
      stats_data_id: string;
      cat01: string;
      item_name: string;
      item_code: string;
      unit: string | null;
      area_type: string;
      is_ranking: number;
    }> = cat01Obj.CLASS.map((cls: any) => {
      const code = cls["@code"] || "";
      const name = cls["@name"] || "";
      const unit = cls["@unit"] || "";

      // item_codeを生成（分類コードをベースに）
      const itemCode = generateItemCode(code);

      return {
        stats_data_id: statsDataId,
        cat01: code,
        item_name: name,
        item_code: itemCode,
        unit: unit || null,
        area_type: "prefecture", // デフォルトで都道府県
        is_ranking: 0, // デフォルトでfalse
      };
    });

    console.log(`[importFromMetaInfoJson] ${inputs.length}件のデータを投入準備完了`);

    // 重複チェック（item_codeの重複を確認）
    const itemCodeCounts = new Map<string, number>();
    inputs.forEach((input) => {
      const count = itemCodeCounts.get(input.item_code) || 0;
      itemCodeCounts.set(input.item_code, count + 1);
    });

    const duplicates = Array.from(itemCodeCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([code]) => code);

    if (duplicates.length > 0) {
      console.warn(
        `[importFromMetaInfoJson] ⚠️ item_codeの重複が検出されました: ${duplicates.join(", ")}`
      );
      console.warn(
        "[importFromMetaInfoJson] 重複を解決するために、stats_data_idとcat01を含めたitem_codeを生成します"
      );

      // 重複を解決：stats_data_idとcat01を含めたitem_codeを生成
      inputs.forEach((input) => {
        if (duplicates.includes(input.item_code)) {
          input.item_code = `${generateItemCode(input.stats_data_id)}-${input.item_code}-${generateItemCode(input.cat01)}`;
        }
      });
    }

    // データベースに接続
    const db = getLocalD1Database();
    const now = new Date().toISOString();

    // バッチ処理で実行（最大100件ずつ）
    const batchSize = 100;
    let totalProcessed = 0;

    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);

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
        `
      );

      for (const input of batch) {
        try {
          const result = stmt.run(
            input.stats_data_id,
            input.cat01,
            input.item_name,
            input.item_code,
            input.unit ?? null,
            input.area_type,
            input.is_ranking,
            now,
            now
          );

          if (result.changes > 0) {
            totalProcessed++;
          }
        } catch (error) {
          console.error(`[importFromMetaInfoJson] 行の挿入エラー:`, error);
        }
      }
    }

    db.close();

    console.log(
      `[importFromMetaInfoJson] ✅ ${totalProcessed}件のデータをインポートしました`
    );
  } catch (error) {
    console.error("[importFromMetaInfoJson] ❌ JSONインポート失敗:", error);
    throw error;
  }
}

/**
 * メイン処理
 */
async function main() {
  const filePath =
    process.argv[2] ||
    "/Users/minamidaisuke/Downloads/CMS Dashboard Metainfo Nov 1 2025.json";

  try {
    // JSONファイルからインポート
    await importFromMetaInfoJson(filePath);
  } catch (error) {
    console.error("[importFromMetaInfoJson] エラー:", error);
    process.exit(1);
  }
}

main();
