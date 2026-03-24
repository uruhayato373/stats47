/**
 * 環境変数のバリデーション
 *
 * アプリケーションで必須の環境変数のバリデーションを一元管理する。
 * 環境変数が未設定の場合はエラーをthrowし、アプリケーションの起動を防ぐ。
 *
 * 環境変数の取得については、`@/lib/env`を参照してください。
 *
 * @module lib/env-validation
 */

import { logger } from "./logger";

/**
 * 必須環境変数の定義
 */
const REQUIRED_ENV_VARS = [
  {
    name: "NEXT_PUBLIC_BASE_URL",
    description: "メタデータ、OGPタグ、構造化データで使用",
  },
  {
    name: "NEXT_PUBLIC_ESTAT_APP_ID",
    description: "e-Stat APIで使用",
  },
] as const;

/**
 * 必須環境変数の検証
 *
 * アプリケーション起動前に必須環境変数が設定されているかを検証します。
 * 不足している環境変数がある場合、エラーをthrowします。
 *
 * @throws {Error} 必須環境変数が不足している場合、具体的な不足変数を示すエラーをthrow
 *
 * @example
 * ```typescript
 * import { validateRequiredEnvVars } from '@/lib/env-validation';
 *
 * // アプリケーション起動前
 * validateRequiredEnvVars();
 * ```
 */
export function validateRequiredEnvVars(): void {
  const missingVars: string[] = [];
  const emptyVars: string[] = [];

  // 必須環境変数の検証
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.name];
    if (!value) {
      missingVars.push(envVar.name);
    } else if (value.trim() === "") {
      emptyVars.push(envVar.name);
    }
  }

  // AdSense設定の検証
  if (process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED === "true") {
    const adSenseClientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
    if (!adSenseClientId) {
      missingVars.push("NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID");
    } else if (adSenseClientId.trim() === "") {
      emptyVars.push("NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID");
    }
  }

  // 不足している環境変数がある場合
  if (missingVars.length > 0 || emptyVars.length > 0) {
    const errorDetails: string[] = [];
    if (missingVars.length > 0) {
      errorDetails.push(
        `未設定: ${missingVars
          .map((name) => {
            const envVar = REQUIRED_ENV_VARS.find((v) => v.name === name);
            return `${name} (${envVar?.description || ""})`;
          })
          .join(", ")}`
      );
    }
    if (emptyVars.length > 0) {
      errorDetails.push(
        `空文字列: ${emptyVars
          .map((name) => {
            const envVar = REQUIRED_ENV_VARS.find((v) => v.name === name);
            return `${name} (${envVar?.description || ""})`;
          })
          .join(", ")}`
      );
    }

    // CI環境かどうかを判定
    const isCI =
      process.env.CI === "true" ||
      process.env.GITHUB_ACTIONS === "true" ||
      Boolean(process.env.CI);

    let errorMessage = `必須環境変数が不足しています:\n${errorDetails.join("\n")}\n\n`;
    
    if (isCI) {
      errorMessage +=
        "CI環境では、環境変数はGitHub Secretsから設定されます。\n" +
        "GitHub Actionsのワークフローで必要な環境変数が設定されているか確認してください。\n" +
        "必要な環境変数: NEXT_PUBLIC_BASE_URL, NEXT_PUBLIC_ESTAT_APP_ID";
    } else {
      errorMessage +=
        ".env.localファイルに必要な環境変数を設定してください。\n" +
        "詳細は env.local.example を参照してください。";
    }

    logger.error(
      {
        missingVars,
        emptyVars,
        isCI,
        suggestion: isCI
          ? "GitHub Actionsのワークフローで環境変数を設定してください。"
          : ".env.localファイルに必要な環境変数を設定してください。",
      },
      "環境変数の検証に失敗しました"
    );

    throw new Error(errorMessage);
  }

  logger.info(
    {
      validatedVars: REQUIRED_ENV_VARS.map((v) => v.name),
    },
    "環境変数の検証に成功しました"
  );
}
