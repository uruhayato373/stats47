import { describe, expect, it } from "vitest";

import {
  assertCompleteSearchIndexSources,
  configureSearchIndexR2Environment,
  selectSearchRankingItems,
} from "../search-index-r2-env";

describe("configureSearchIndexR2Environment", () => {
  it("deploy用Cloudflare名を検索index readerの正規名へ写す", () => {
    const env = {
      CLOUDFLARE_ACCOUNT_ID: "account-id",
      CLOUDFLARE_R2_ACCESS_KEY_ID: "access-key",
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: "secret-key",
    };

    configureSearchIndexR2Environment(env);

    expect(env).toMatchObject({
      R2_ACCESS_KEY_ID: "access-key",
      R2_SECRET_ACCESS_KEY: "secret-key",
      R2_S3_ENDPOINT: "https://account-id.r2.cloudflarestorage.com",
    });
  });

  it("明示された正規名を上書きしない", () => {
    const env = {
      CLOUDFLARE_ACCOUNT_ID: "cloudflare-account",
      CLOUDFLARE_R2_ACCESS_KEY_ID: "cloudflare-access",
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: "cloudflare-secret",
      R2_ACCESS_KEY_ID: "explicit-access",
      R2_SECRET_ACCESS_KEY: "explicit-secret",
      R2_S3_ENDPOINT: "https://explicit.example.com",
    };

    configureSearchIndexR2Environment(env);

    expect(env).toMatchObject({
      R2_ACCESS_KEY_ID: "explicit-access",
      R2_SECRET_ACCESS_KEY: "explicit-secret",
      R2_S3_ENDPOINT: "https://explicit.example.com",
    });
  });

  it("secretを持たないCIでは検索index子processだけに公開read URLを補う", () => {
    const env: Record<string, string | undefined> = {
      CI: "true",
      R2_PUBLIC_FETCH_URL: "",
    };

    configureSearchIndexR2Environment(env);

    expect(env.R2_PUBLIC_FETCH_URL).toBe("https://storage.stats47.jp");
  });

  it("ローカル環境には公開read URLを暗黙設定しない", () => {
    const env: Record<string, string | undefined> = {};

    configureSearchIndexR2Environment(env);

    expect(env.R2_PUBLIC_FETCH_URL).toBeUndefined();
  });

  it("CIでもS3資格情報が揃う場合は公開URLを設定しない", () => {
    const env: Record<string, string | undefined> = {
      GITHUB_ACTIONS: "true",
      R2_ACCESS_KEY_ID: "access",
      R2_SECRET_ACCESS_KEY: "secret",
      R2_S3_ENDPOINT: "https://example.r2.cloudflarestorage.com",
    };

    configureSearchIndexR2Environment(env);

    expect(env.R2_PUBLIC_FETCH_URL).toBeUndefined();
  });
});

describe("selectSearchRankingItems", () => {
  it("activeな都道府県itemだけを返す", () => {
    const items = selectSearchRankingItems({
      count: 3,
      items: [
        { rankingKey: "active", areaType: "prefecture", isActive: true },
        { rankingKey: "inactive", areaType: "prefecture", isActive: false },
        { rankingKey: "city", areaType: "city", isActive: true },
      ],
    });

    expect(items).toEqual([
      { rankingKey: "active", areaType: "prefecture", isActive: true },
    ]);
  });

  it("snapshotのcount不一致を拒否する", () => {
    expect(() =>
      selectSearchRankingItems({
        count: 2,
        items: [{ areaType: "prefecture", isActive: true }],
      }),
    ).toThrow(/件数が不一致/);
  });

  it("snapshot欠落を拒否する", () => {
    expect(() => selectSearchRankingItems(null)).toThrow(/取得できませんでした/);
  });
});

describe("assertCompleteSearchIndexSources", () => {
  it("accepts an index containing both required content types", () => {
    expect(() =>
      assertCompleteSearchIndexSources({ rankingCount: 1800, blogCount: 120 }),
    ).not.toThrow();
  });

  it.each([
    { rankingCount: 0, blogCount: 120, missing: "ranking" },
    { rankingCount: 1800, blogCount: 0, missing: "blog" },
    { rankingCount: 0, blogCount: 0, missing: "ranking, blog" },
  ])("rejects an incomplete index: $missing", ({ rankingCount, blogCount, missing }) => {
    expect(() => assertCompleteSearchIndexSources({ rankingCount, blogCount })).toThrow(
      `検索インデックスの必須データ源が空です: ${missing}`,
    );
  });
});
