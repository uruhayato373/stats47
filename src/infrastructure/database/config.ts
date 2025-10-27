/**
 * データベース・ストレージ接続設定
 *
 * Cloudflare D1、R2への接続に必要な設定を管理
 */

export interface CloudflareConfig {
  d1: string | undefined;
  r2: string | undefined;
  accountId: string | undefined;
  apiToken: string | undefined;
}

export const databaseConfig = {
  cloudflare: {
    d1: process.env.CLOUDFLARE_D1_DATABASE_ID,
    r2: process.env.CLOUDFLARE_R2_BUCKET,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
  },
} as const;

/**
 * Cloudflare設定を取得
 */
export function getCloudflareConfig(): CloudflareConfig {
  return databaseConfig.cloudflare;
}
