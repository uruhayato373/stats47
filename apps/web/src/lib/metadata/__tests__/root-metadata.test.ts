import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getRequiredBaseUrl: vi.fn(() => "https://stats47.jp"),
}));

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { generateRootMetadata } from "../root-metadata";

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
  it("AdSense のクライアント ID があれば広告表示の可否と独立に所有権確認の meta を出す", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID", "ca-pub-0000000000000000");

    const metadata = generateRootMetadata();

    expect(metadata.other).toEqual({ "google-adsense-account": "ca-pub-0000000000000000" });
    vi.unstubAllEnvs();
  });

  it("AdSense のクライアント ID が無ければ meta を出さない", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID", "");

    const metadata = generateRootMetadata();

    expect(metadata.other).toBeUndefined();
    vi.unstubAllEnvs();
  });

  // ads.txt と本番 build の client ID は手で同期しているため、食い違うと審査・配信が別口座を指す
  it("ads.txt のパブリッシャー ID が本番 build の AdSense クライアント ID と一致する", () => {
    const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
    const adsTxt = readFileSync(resolve(repoRoot, "apps/web/public/ads.txt"), "utf8");
    const deployWorkflow = readFileSync(
      resolve(repoRoot, ".github/workflows/deploy-workers.yml"),
      "utf8",
    );

    const adsTxtPublisherId = adsTxt.match(/google\.com, (pub-\d+), DIRECT/)?.[1];
    const buildClientId = deployWorkflow.match(
      /NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID: "ca-(pub-\d+)"/,
    )?.[1];

    expect(adsTxtPublisherId).toBeDefined();
    expect(adsTxtPublisherId).toBe(buildClientId);
  });
});
