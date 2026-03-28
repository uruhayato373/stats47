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
});
