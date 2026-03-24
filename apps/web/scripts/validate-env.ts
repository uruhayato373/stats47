#!/usr/bin/env tsx
/**
 * 環境変数検証スクリプト
 *
 * アプリケーション起動前に必須環境変数が設定されているかを検証します。
 * 不足している環境変数がある場合、エラーメッセージを表示してプロセスを終了します。
 *
 * 使用方法:
 *   npx tsx scripts/validate-env.ts
 */

import { resolve } from "path";

import { config } from "dotenv";

import { validateRequiredEnvVars } from "../src/lib/env-validation";

const MONOREPO_ROOT = resolve(__dirname, "..", "..", "..");

/**
 * CI環境かどうかを判定
 */
function isCIEnvironment(): boolean {
  return (
    process.env.CI === "true" ||
    process.env.GITHUB_ACTIONS === "true" ||
    Boolean(process.env.CI)
  );
}

// .env.localファイルを読み込む（CI環境ではスキップ）
if (!isCIEnvironment()) {
  config({ path: resolve(MONOREPO_ROOT, ".env.local") });
}

/**
 * メイン処理
 */
async function main() {
  try {
    validateRequiredEnvVars();
    console.log("✓ 環境変数の検証に成功しました");
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("\n❌ 環境変数の検証に失敗しました:");
    console.error(errorMessage);

    if (isCIEnvironment()) {
      console.error("\nCI環境では、環境変数はGitHub Secretsから設定されます。");
      console.error(
        "GitHub Actionsのワークフローで必要な環境変数が設定されているか確認してください。"
      );
      console.error(
        "必要な環境変数: NEXT_PUBLIC_BASE_URL, NEXT_PUBLIC_ESTAT_APP_ID\n"
      );
      console.error(
        "AdSenseを有効にする場合: NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID, NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED\n"
      );
    } else {
      console.error("\n.env.localファイルに必要な環境変数を設定してください。");
      console.error("詳細は env.local.example を参照してください。\n");
    }
    process.exit(1);
  }
}

// スクリプト実行
main().catch((error) => {
  console.error("予期しないエラー:", error);
  process.exit(1);
});
