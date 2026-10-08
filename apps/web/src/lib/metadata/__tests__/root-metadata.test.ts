import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE } from "@stats47/types";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getRequiredBaseUrl: vi.fn(() => "https://stats47.jp"),
}));

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { generateRootMetadata } from "../root-metadata";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../..");

describe("generateRootMetadata", () => {
  it("metadataBase を設定する", () => {
    const metadata = generateRootMetadata();

    expect(metadata.metadataBase?.toString()).toBe("https://stats47.jp/");
  });

  it("title テンプレートを設定する", () => {
    const metadata = generateRootMetadata();
    const title = metadata.title as { template: string; default: string };

    expect(title.template).toContain("統計で見る都道府県");
    expect(title.default).toContain("統計で見る都道府県");
  });

  it("description を設定する", () => {
    const metadata = generateRootMetadata();

    expect(metadata.description).toContain("都道府県");
    expect(metadata.description).toContain("ランキング");
  });

  it("keywords を含む", () => {
    const metadata = generateRootMetadata();

    expect(metadata.keywords).toContain("統計");
    expect(metadata.keywords).toContain("都道府県");
  });

  it("openGraph と twitter を含む", () => {
    const metadata = generateRootMetadata();

    expect(metadata.openGraph).toBeDefined();
    expect(metadata.twitter).toBeDefined();
  });

  it("robots 設定を含む", () => {
    const metadata = generateRootMetadata();

    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
    });
  });

  // AdSense 審査中は広告コードを出さず、所有権確認の meta だけを出す (ADSENSE-RESTART-01)
  it("広告表示の可否や環境変数と独立に、正本のパブリッシャー ID で所有権確認の meta を出す", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED", "");

    const metadata = generateRootMetadata();

    expect(metadata.other).toEqual({ "google-adsense-account": SITE.adsenseClientId });
    expect(SITE.adsenseClientId).toMatch(/^ca-pub-\d{16}$/);
    vi.unstubAllEnvs();
  });

  // パブリッシャー ID の正本は site.json だけ。ads.txt と食い違うと審査・配信が別口座を指す
  it("ads.txt のパブリッシャー ID が正本 (SITE.adsenseClientId) と一致する", () => {
    const adsTxt = readFileSync(resolve(REPO_ROOT, "apps/web/public/ads.txt"), "utf8");

    const adsTxtPublisherId = adsTxt.match(/google\.com, (pub-\d+), DIRECT/)?.[1];

    expect(adsTxtPublisherId).toBeDefined();
    expect(`ca-${adsTxtPublisherId}`).toBe(SITE.adsenseClientId);
  });

  // 2026-10-08 に env から site.json へ移した。env を戻すと正本が二つになり、片方だけ更新されて食い違う
  it("本番 build と Workers の設定にパブリッシャー ID の環境変数を戻さない", () => {
    for (const file of [".github/workflows/deploy-workers.yml", "apps/web/wrangler.toml"]) {
      const text = readFileSync(resolve(REPO_ROOT, file), "utf8");
      expect(text, file).not.toContain("NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID");
    }
  });
});
