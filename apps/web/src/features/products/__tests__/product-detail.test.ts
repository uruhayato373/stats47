import { afterEach, describe, expect, it, vi } from "vitest";

import { ANALYSIS_PREVIEWS } from "../analysis-previews.generated";
import { productEditions } from "../editions";
import { isPublishedAnalysisRevision, resolveProductDetail } from "../product-detail";
import { STOREFRONT_PRODUCTS } from "../storefront";

afterEach(() => vi.unstubAllEnvs());

describe("商品LPの表示版", () => {
  it("サイトの商品名はLP台帳の名称を使い、販売先の古い数量を流用しない", () => {
    for (const product of STOREFRONT_PRODUCTS.filter(item => item.channel === 'note')) {
      expect(product.title).toBe(product.displayTitle);
      expect(product.listingTitle).toBeTruthy();
    }
  });
  it("開発中も販売版を残し、同じ商品IDの改訂案を別に表示する", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(ANALYSIS_PREVIEWS.length).toBeGreaterThan(0);
    for (const revision of ANALYSIS_PREVIEWS) {
      const published = STOREFRONT_PRODUCTS.find((product) => product.id === revision.id)!;
      if (isPublishedAnalysisRevision(published, revision)) {
        expect(await resolveProductDetail(published.slug)).toEqual({ product: published, preview: false });
        continue;
      }
      expect(await resolveProductDetail(published.slug)).toEqual({ product: published, revision, preview: true });
      const editions = productEditions(published, revision);
      expect(editions.map(edition => edition.product)).toEqual([published, revision]);
      expect(editions.map(edition => edition.preview)).toEqual([false, true]);
    }
  });

  it('note確認済みで掲載した同じ分析版を開発中に二重掲載しない', () => {
    const revision = ANALYSIS_PREVIEWS.find(product => product.id === 'P-01')!;
    const published = STOREFRONT_PRODUCTS.find(product => product.id === revision.id)!;
    const analysisVersion = revision.slug.slice(published.slug.length + 1);
    expect(isPublishedAnalysisRevision({ ...published, analysisVersion }, revision)).toBe(true);
    expect(isPublishedAnalysisRevision({ ...published, analysisVersion: 'different-version' }, revision)).toBe(false);
  });

  it("別商品の改訂案や重複した作成例へのリンクを拒否する", () => {
    const published = STOREFRONT_PRODUCTS.find(product => product.id === 'P-04')!;
    const revision = ANALYSIS_PREVIEWS.find(product => product.id === published.id)!;
    expect(() => productEditions(published, { ...revision, id: 'wrong' })).toThrow('一致');
    expect(() => productEditions(published, { ...revision, showcase: published.showcase })).toThrow('重複');
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
