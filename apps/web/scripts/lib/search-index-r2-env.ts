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

interface SearchIndexSourceCounts {
  rankingCount: number;
  blogCount: number;
}

/**
 * 本番検索は ranking / blog の両方を一つのindexへ統合する。
 * 片方だけ取得できた状態で書き出すと、そのcontent typeが検索結果から消えるため
 * prebuildをfail-closedにする。
 */
export function assertCompleteSearchIndexSources({
  rankingCount,
  blogCount,
}: SearchIndexSourceCounts): void {
  const missingSources: string[] = [];
  if (rankingCount <= 0) missingSources.push("ranking");
  if (blogCount <= 0) missingSources.push("blog");

  if (missingSources.length > 0) {
    throw new Error(
      `検索インデックスの必須データ源が空です: ${missingSources.join(", ")} ` +
        `(ranking=${rankingCount}, blog=${blogCount})`,
    );
  }
}
