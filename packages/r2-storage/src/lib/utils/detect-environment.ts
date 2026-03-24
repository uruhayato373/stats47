
/**
 * 実行環境を判定する
 *
 * S3認証情報がある場合はS3クライアントを優先し、
 * ない場合はCloudflare Workers R2バインディングにフォールバックする。
 *
 * @returns 判定結果
 */
export function detectEnvironment() {
  const isDevelopment = process.env.NODE_ENV === "development";

  const hasS3Credentials = !!(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  );

  // 本番環境では常にCloudflare Workers R2バインディングを使用
  const isCloudflareWorkers = !isDevelopment;

  return {
    isDevelopment,
    hasS3Credentials,
    isCloudflareWorkers,
  };
}

