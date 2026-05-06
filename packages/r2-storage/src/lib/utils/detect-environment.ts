
/**
 * 実行環境を判定する
 */
export function detectEnvironment() {
  const isDevelopment = process.env.NODE_ENV === "development";

  const hasCloudflareApi = !!(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_API_TOKEN
  );

  // 本番環境では常にCloudflare Workers R2バインディングを使用
  const isCloudflareWorkers = !isDevelopment;

  return {
    isDevelopment,
    hasCloudflareApi,
    isCloudflareWorkers,
  };
}
