/**
 * データベースマイグレーション検証スクリプト
 * 作成日: 2025-01-13
 * 目的: データ移行の整合性を検証
 */

import { createD1Database } from "../src/lib/db";

interface VerificationResult {
  tableName: string;
  oldCount: number;
  newCount: number;
  isConsistent: boolean;
}

interface SampleData {
  rankingKey: string;
  label: string;
  statsDataId?: string;
  cdCat01?: string;
}

async function verifyMigration() {
  console.log("🔍 データベースマイグレーション検証を開始...");

  const db = await createD1Database();
  const results: VerificationResult[] = [];

  try {
    // 1. ranking_items の件数チェック
    console.log("\n📊 件数チェック...");

    const oldRankingItemsCount = (await db
      .prepare("SELECT COUNT(*) as count FROM ranking_items")
      .first()) as { count: number };

    const newRankingItemsCount = (await db
      .prepare("SELECT COUNT(*) as count FROM ranking_items_new")
      .first()) as { count: number };

    results.push({
      tableName: "ranking_items",
      oldCount: oldRankingItemsCount.count,
      newCount: newRankingItemsCount.count,
      isConsistent: oldRankingItemsCount.count === newRankingItemsCount.count,
    });

    console.log(
      `✓ ranking_items: ${oldRankingItemsCount.count} → ${newRankingItemsCount.count}`
    );

    // 2. estat_ranking_values の件数チェック
    const oldRankingValuesCount = (await db
      .prepare("SELECT COUNT(*) as count FROM estat_ranking_values")
      .first()) as { count: number };

    const newRankingValuesCount = (await db
      .prepare("SELECT COUNT(*) as count FROM ranking_values")
      .first()) as { count: number };

    results.push({
      tableName: "ranking_values",
      oldCount: oldRankingValuesCount.count,
      newCount: newRankingValuesCount.count,
      isConsistent: oldRankingValuesCount.count === newRankingValuesCount.count,
    });

    console.log(
      `✓ ranking_values: ${oldRankingValuesCount.count} → ${newRankingValuesCount.count}`
    );

    // 3. ranking_key の一致確認
    console.log("\n🔑 ranking_key の一致確認...");

    const oldKeys = (await db
      .prepare("SELECT ranking_key FROM ranking_items ORDER BY ranking_key")
      .all()) as { ranking_key: string }[];

    const newKeys = (await db
      .prepare("SELECT ranking_key FROM ranking_items_new ORDER BY ranking_key")
      .all()) as { ranking_key: string }[];

    const oldKeySet = new Set(oldKeys.map((k) => k.ranking_key));
    const newKeySet = new Set(newKeys.map((k) => k.ranking_key));

    const missingKeys = [...oldKeySet].filter((key) => !newKeySet.has(key));
    const extraKeys = [...newKeySet].filter((key) => !oldKeySet.has(key));

    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log("✓ ranking_key が完全に一致しています");
    } else {
      console.log("❌ ranking_key の不一致を発見:");
      if (missingKeys.length > 0) {
        console.log(`  - 不足: ${missingKeys.join(", ")}`);
      }
      if (extraKeys.length > 0) {
        console.log(`  - 余分: ${extraKeys.join(", ")}`);
      }
    }

    // 4. data_source_metadata の内容確認
    console.log("\n📋 data_source_metadata の内容確認...");

    const metadataSamples = (await db
      .prepare(
        `
        SELECT 
          ri.ranking_key,
          ri.label,
          json_extract(dsm.metadata, '$.stats_data_id') as stats_data_id,
          json_extract(dsm.metadata, '$.cd_cat01') as cd_cat01
        FROM ranking_items_new ri
        JOIN data_source_metadata dsm ON ri.id = dsm.ranking_item_id
        WHERE dsm.data_source_id = 'estat'
        ORDER BY ri.ranking_key
        LIMIT 5
      `
      )
      .all()) as SampleData[];

    console.log("✓ data_source_metadata サンプル:");
    metadataSamples.forEach((sample) => {
      console.log(
        `  - ${sample.ranking_key}: ${sample.label} (${sample.stats_data_id}/${sample.cdCat01})`
      );
    });

    // 5. subcategory_ranking_items の関係確認
    console.log("\n🔗 subcategory_ranking_items の関係確認...");

    const relationshipCount = (await db
      .prepare("SELECT COUNT(*) as count FROM subcategory_ranking_items")
      .first()) as { count: number };

    console.log(
      `✓ subcategory_ranking_items: ${relationshipCount.count} 件の関係`
    );

    // 6. 外部キー制約の確認
    console.log("\n🔒 外部キー制約の確認...");

    const foreignKeyViolations = (await db
      .prepare(
        `
        SELECT COUNT(*) as count 
        FROM subcategory_ranking_items sri
        LEFT JOIN subcategory_configs sc ON sri.subcategory_id = sc.id
        WHERE sc.id IS NULL
      `
      )
      .first()) as { count: number };

    if (foreignKeyViolations.count === 0) {
      console.log("✓ 外部キー制約に違反はありません");
    } else {
      console.log(`❌ 外部キー制約違反: ${foreignKeyViolations.count} 件`);
    }

    // 7. 総合結果
    console.log("\n📈 検証結果サマリー:");
    const allConsistent = results.every((r) => r.isConsistent);

    results.forEach((result) => {
      const status = result.isConsistent ? "✅" : "❌";
      console.log(
        `${status} ${result.tableName}: ${result.oldCount} → ${result.newCount}`
      );
    });

    if (allConsistent) {
      console.log("\n🎉 すべての検証が成功しました！");
      return true;
    } else {
      console.log("\n⚠️  一部の検証で問題が発見されました。");
      return false;
    }
  } catch (error) {
    console.error("❌ 検証中にエラーが発生しました:", error);
    return false;
  }
}

// スクリプト実行
if (require.main === module) {
  verifyMigration()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ スクリプト実行エラー:", error);
      process.exit(1);
    });
}

export { verifyMigration };
