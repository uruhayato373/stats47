type MutableEnvironment = Record<string, string | undefined>;

/**
 * deploy prebuildの子processだけで、GitHub secret名をR2 readerの正規名へ写す。
 * 親のNext buildへR2_*を渡すとgenerateStaticParamsが全rankingを列挙するため、
 * workflow全体のenvではなく検索index生成process内に限定する。
 */
export function configureSearchIndexR2Environment(env: MutableEnvironment): void {
  if (!env.R2_ACCESS_KEY_ID && env.CLOUDFLARE_R2_ACCESS_KEY_ID) {
    env.R2_ACCESS_KEY_ID = env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  }
  if (!env.R2_SECRET_ACCESS_KEY && env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
    env.R2_SECRET_ACCESS_KEY = env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  }
  if (!env.R2_S3_ENDPOINT && env.CLOUDFLARE_ACCOUNT_ID) {
    env.R2_S3_ENDPOINT = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }
}
