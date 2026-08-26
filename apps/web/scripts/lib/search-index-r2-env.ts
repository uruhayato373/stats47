type MutableEnvironment = Record<string, string | undefined>;

const PUBLIC_R2_BASE_URL = "https://storage.stats47.jp";

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

  // PR build / E2E はR2 secretを持たない。検索index生成processだけに公開read URLを補い、
  // ranking/blogが0件の壊れたindexを生成しない。process.envの変更はnpmのprebuild子process内に
  // 閉じるため、後続のNext buildへR2接続を渡して全routeを列挙させることはない。
  if (
    !env.R2_ACCESS_KEY_ID &&
    !env.R2_SECRET_ACCESS_KEY &&
    !env.R2_S3_ENDPOINT &&
    !env.R2_PUBLIC_FETCH_URL &&
    !env.NEXT_PUBLIC_R2_PUBLIC_URL &&
    (env.CI === "true" || env.GITHUB_ACTIONS === "true")
  ) {
    env.R2_PUBLIC_FETCH_URL = PUBLIC_R2_BASE_URL;
  }
}

interface SearchIndexSourceCounts {
  rankingCount: number;
  blogCount: number;
}

interface RankingSnapshotLike<T> {
  count: number;
  items: T[];
}

/** 単一snapshotの件数契約を検証し、検索対象の公開都道府県itemだけを返す。 */
export function selectSearchRankingItems<
  T extends { areaType: string; isActive: boolean },
>(snapshot: RankingSnapshotLike<T> | null): T[] {
  if (!snapshot || !Array.isArray(snapshot.items)) {
    throw new Error("ranking-items snapshot が取得できませんでした");
  }
  if (!Number.isInteger(snapshot.count) || snapshot.count !== snapshot.items.length) {
    throw new Error(
      `ranking-items snapshot の件数が不一致です: count=${snapshot.count} items=${snapshot.items.length}`,
    );
  }
  return snapshot.items.filter(
    (item) => item.isActive === true && item.areaType === "prefecture",
  );
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
