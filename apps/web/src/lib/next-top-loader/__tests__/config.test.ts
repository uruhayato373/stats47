import { describe, it, expect } from "vitest";

import { nextTopLoaderConfig } from "../config";

describe("nextTopLoaderConfig", () => {
  it("color が設定されている", () => {
    expect(nextTopLoaderConfig.color).toBe("#2299DD");
  });

  it("height が正の数", () => {
    expect(nextTopLoaderConfig.height).toBeGreaterThan(0);
  });

  it("showSpinner が無効", () => {
    expect(nextTopLoaderConfig.showSpinner).toBe(false);
  });

  it("crawl が有効", () => {
    expect(nextTopLoaderConfig.crawl).toBe(true);
  });
});
