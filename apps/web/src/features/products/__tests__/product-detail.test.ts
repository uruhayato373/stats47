import { afterEach, describe, expect, it, vi } from "vitest";

import { ANALYSIS_PREVIEWS } from "../analysis-previews.generated";
import { resolveProductDetail } from "../product-detail";
import { STOREFRONT_PRODUCTS } from "../storefront";

afterEach(() => vi.unstubAllEnvs());

describe("商品LPの表示版", () => {
  it("サイトの商品名はLP台帳の名称を使い、販売先の古い数量を流用しない", () => {
    for (const product of STOREFRONT_PRODUCTS.filter(item => item.channel === 'note')) {
      expect(product.title).toBe(product.displayTitle);
      expect(product.listingTitle).toBeTruthy();
    }
  });
  it("開発中は通常URLの商品IDに対応する改訂案を表示する", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(ANALYSIS_PREVIEWS.length).toBeGreaterThan(0);
    for (const revision of ANALYSIS_PREVIEWS) {
      const published = STOREFRONT_PRODUCTS.find((product) => product.id === revision.id)!;
      expect(await resolveProductDetail(published.slug)).toEqual({ product: revision, preview: true });
    }
  });

  it("改訂案がない商品は開発中も販売版を表示する", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const unchanged = STOREFRONT_PRODUCTS.filter((product) => !ANALYSIS_PREVIEWS.some((revision) => revision.id === product.id));
    expect(unchanged.length).toBeGreaterThan(0);
    for (const product of unchanged) {
      expect(await resolveProductDetail(product.slug)).toEqual({ product, preview: false });
    }
  });

  it.each(["production", "test"] as const)("%s は必ず固定販売版を表示し、改訂URLを解決しない", async (environment) => {
    vi.stubEnv("NODE_ENV", environment);
    for (const product of STOREFRONT_PRODUCTS) {
      expect(await resolveProductDetail(product.slug)).toEqual({ product, preview: false });
    }
    for (const revision of ANALYSIS_PREVIEWS) expect(await resolveProductDetail(revision.slug)).toBeNull();
  });

  it("未登録の商品は表示しない", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(await resolveProductDetail("missing-product")).toBeNull();
  });
});
