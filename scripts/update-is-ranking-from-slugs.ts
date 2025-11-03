#!/usr/bin/env tsx
/**
 * slugs.csvに基づいてestat_ranking_mappingsのis_rankingを1に設定するスクリプト
 *
 * slugs.csvのslugと一致するitem_codeを持つestat_ranking_mappingsのレコードで、
 * area_type = 'prefecture'のもののis_rankingを1に設定します。
 *
 * 使用方法:
 *   npx tsx scripts/update-is-ranking-from-slugs.ts
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * CSVの行をパース（ダブルクォート対応）
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // エスケープされたダブルクォート
        currentField += '"';
        i++; // 次の文字をスキップ
      } else {
        // クォートの開始/終了
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // フィールドの区切り
      fields.push(currentField);
      currentField = "";
    } else {
      currentField += char;
    }
  }
  fields.push(currentField); // 最後のフィールド

  return fields;
}

/**
 * slugs.csvからslug一覧を読み込む（ユニークなslugのみ）
 */
function getSlugsFromCSV(csvPath: string): Set<string> {
  console.log(`📄 ${csvPath}からslugを読み込み中...\n`);

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ ファイルが見つかりません: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    console.error("❌ CSVファイルにデータがありません");
    process.exit(1);
  }

  const slugs = new Set<string>();

  // ヘッダーをスキップしてデータ行を処理
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCsvLine(line);

    if (fields.length >= 2) {
      const slug = fields[1]; // slug列
      slugs.add(slug);
    }
  }

  console.log(`✅ ${slugs.size}件のユニークなslugを読み込みました\n`);
  return slugs;
}

/**
 * item_codeがslugと一致するestat_ranking_mappingsのレコードを取得
 */
function getMatchingRecords(slugs: Set<string>): Array<{
  stats_data_id: string;
  cat01: string;
  item_code: string;
}> {
  console.log("📊 データベースからマッチするレコードを取得中...\n");

  const slugsArray = Array.from(slugs);
  const matchingRecords: Array<{
    stats_data_id: string;
    cat01: string;
    item_code: string;
  }> = [];

  // バッチ処理（SQLのIN句に渡せる件数に制限があるため、分割）
  const batchSize = 100;

  for (let i = 0; i < slugsArray.length; i += batchSize) {
    const batch = slugsArray.slice(i, i + batchSize);
    const placeholders = batch.map(() => "?").join(",");
    const values = batch.map((slug) => `'${slug.replace(/'/g, "''")}'`).join(",");

    const command = `npx wrangler d1 execute stats47 --local --command="SELECT stats_data_id, cat01, item_code FROM estat_ranking_mappings WHERE item_code IN (${values}) AND area_type = 'prefecture'" --json`;

    try {
      const output = execSync(command, { encoding: "utf-8", cwd: process.cwd() });
      const result = JSON.parse(output.trim());

      if (Array.isArray(result) && result.length > 0) {
        const firstResult = result[0];
        if (firstResult.results && Array.isArray(firstResult.results)) {
          for (const row of firstResult.results) {
            matchingRecords.push({
              stats_data_id: String(row.stats_data_id),
              cat01: String(row.cat01),
              item_code: String(row.item_code),
            });
          }
        }
      }
    } catch (error) {
      console.error(`❌ バッチ ${Math.floor(i / batchSize) + 1} の取得に失敗しました:`, error);
    }
  }

  console.log(`✅ ${matchingRecords.length}件のマッチするレコードを取得しました\n`);
  return matchingRecords;
}

/**
 * is_rankingを1に更新
 */
function updateIsRanking(
  stats_data_id: string,
  cat01: string
): boolean {
  const command = `npx wrangler d1 execute stats47 --local --command="UPDATE estat_ranking_mappings SET is_ranking = 1, updated_at = CURRENT_TIMESTAMP WHERE stats_data_id = '${stats_data_id.replace(/'/g, "''")}' AND cat01 = '${cat01.replace(/'/g, "''")}'" --json`;

  try {
    const output = execSync(command, { encoding: "utf-8", cwd: process.cwd() });
    const result = JSON.parse(output.trim());

    if (Array.isArray(result) && result.length > 0) {
      const firstResult = result[0];
      return firstResult.success === true;
    }
    return false;
  } catch (error) {
    console.error(`❌ 更新エラー (stats_data_id=${stats_data_id}, cat01=${cat01}):`, error);
    return false;
  }
}

/**
 * メイン処理
 */
async function updateIsRankingFromSlugs(): Promise<void> {
  console.log("🔄 slugs.csvに基づいてestat_ranking_mappingsのis_rankingを更新します\n");
  console.log("📋 条件: area_type = 'prefecture'のみ更新\n");

  try {
    // slugs.csvからslugを読み込む
    const csvPath = path.join(process.cwd(), "slugs.csv");
    const slugs = getSlugsFromCSV(csvPath);

    // マッチするレコードを取得
    const matchingRecords = getMatchingRecords(slugs);

    if (matchingRecords.length === 0) {
      console.log("✅ 更新対象のレコードがありません");
      return;
    }

    console.log("📊 更新対象レコード:");
    for (const record of matchingRecords.slice(0, 10)) {
      console.log(`  - ${record.item_code} (${record.stats_data_id}, ${record.cat01})`);
    }
    if (matchingRecords.length > 10) {
      console.log(`  ... 他 ${matchingRecords.length - 10}件\n`);
    } else {
      console.log();
    }

    // 各レコードのis_rankingを1に更新
    console.log("🔄 is_rankingを1に更新中...\n");

    let successCount = 0;
    let errorCount = 0;

    for (const record of matchingRecords) {
      const success = updateIsRanking(record.stats_data_id, record.cat01);
      if (success) {
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`  ✅ ${successCount}件更新完了...`);
        }
      } else {
        errorCount++;
        console.error(`  ❌ 更新失敗: ${record.item_code} (${record.stats_data_id}, ${record.cat01})`);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ 更新処理が完了しました");
    console.log("=".repeat(50));
    console.log(`📊 更新対象レコード数: ${matchingRecords.length}件`);
    console.log(`✅ 成功: ${successCount}件`);
    if (errorCount > 0) {
      console.log(`❌ エラー: ${errorCount}件`);
    }
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ エラーが発生しました:");
    if (error instanceof Error) {
      console.error(error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      console.error(String(error));
    }
    process.exit(1);
  }
}

// メイン処理を実行
updateIsRankingFromSlugs().catch((error) => {
  console.error("❌ 予期しないエラーが発生しました:", error);
  process.exit(1);
});

