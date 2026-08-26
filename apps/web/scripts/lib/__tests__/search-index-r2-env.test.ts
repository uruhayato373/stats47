import { describe, expect, it } from "vitest";

import {
  assertCompleteSearchIndexSources,
  configureSearchIndexR2Environment,
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
