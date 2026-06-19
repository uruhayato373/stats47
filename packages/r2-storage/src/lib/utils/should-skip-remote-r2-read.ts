function hasR2S3Credentials(): boolean {
  return !!(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_S3_ENDPOINT
  );
}

function hasExplicitPublicR2FetchUrl(): boolean {
  return !!process.env.R2_PUBLIC_FETCH_URL;
}

function isCiEnvironment(): boolean {
  return process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
}

/**
 * ローカルの build / スクリプト実行では R2 を読まない運用。
 * CI/CD・Workers・明示的な R2_PUBLIC_FETCH_URL/S3 指定がある場合だけ remote read を許可する。
 * NEXT_PUBLIC_R2_PUBLIC_URL は配信用の公開値なので、ローカル server read の opt-in には使わない。
 */
export function shouldSkipRemoteR2Read(): boolean {
  if (process.env.CLOUDFLARE_WORKERS === "true") return false;
  if (isCiEnvironment()) return false;
  if (hasR2S3Credentials()) return false;
  if (hasExplicitPublicR2FetchUrl()) return false;
  return true;
}
