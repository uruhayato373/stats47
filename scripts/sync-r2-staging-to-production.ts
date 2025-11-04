/**
 * R2ストレージ同期スクリプト: ステージング環境 → 本番環境
 * 
 * ステージング環境のR2バケットから本番環境のR2バケットへ同期します。
 * 
 * 使用方法:
 *   npm run sync:r2:staging-to-prod
 *   npm run sync:r2:staging-to-prod:dry  (ドライラン)
 * 
 * 環境変数:
 *   CLOUDFLARE_ACCOUNT_ID: Cloudflare Account ID
 *   CLOUDFLARE_R2_ACCESS_KEY_ID: R2 Access Key ID
 *   CLOUDFLARE_R2_SECRET_ACCESS_KEY: R2 Secret Access Key
 * 
 * 同期対象:
 *   - area/ (地域マスタデータ)
 *   - geoshape/ (地理データ)
 *   - content/blog/ (ブログコンテンツ)
 * 
 * 注意:
 *   本番環境への同期は慎重に行ってください。事前にドライランで確認することを推奨します。
 */

import { syncR2Buckets } from "./sync-r2-buckets";
import { getR2S3Config } from "../src/infrastructure/storage/s3-client";

/**
 * ステージング環境から本番環境への同期
 */
async function syncStagingToProduction() {
  const dryRun = process.argv.includes("--dry-run");

  console.log("🚀 ステージング環境から本番環境へのR2同期を開始します\n");

  if (!dryRun) {
    console.log("⚠️  本番環境への同期を実行します。続行しますか？");
    console.log("   ドライランで確認する場合は --dry-run オプションを使用してください。\n");
  }

  // 環境変数から設定を取得
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.error("❌ 環境変数が設定されていません:");
    console.error("   - CLOUDFLARE_ACCOUNT_ID");
    console.error("   - CLOUDFLARE_R2_ACCESS_KEY_ID");
    console.error("   - CLOUDFLARE_R2_SECRET_ACCESS_KEY");
    process.exit(1);
  }

  // バケット設定
  const sourceConfig = {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName: "stats47-staging",
  };

  const targetConfig = {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName: "stats47",
  };

  // 同期対象のプレフィックス
  const prefixes = ["area/", "geoshape/", "content/blog/"];

  // 同期実行
  const result = await syncR2Buckets(sourceConfig, targetConfig, prefixes, {
    dryRun,
    verbose: true,
  });

  console.log();

  if (result.success && result.failedObjects === 0) {
    console.log("✅ 同期が正常に完了しました");
    process.exit(0);
  } else {
    console.error("❌ 同期中にエラーが発生しました");
    process.exit(1);
  }
}

// スクリプト実行
syncStagingToProduction().catch((error) => {
  console.error("❌ 同期処理で致命的なエラーが発生しました:");
  console.error(error);
  process.exit(1);
});

