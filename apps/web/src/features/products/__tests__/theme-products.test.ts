import { afterEach, describe, expect, it, vi } from 'vitest';

import { productEditions } from '../editions';
import { resolveProductDetail } from '../product-detail';
import { STOREFRONT_PRODUCTS } from '../storefront';
import { collectThemeProducts, loadThemeProducts } from '../theme-products';

afterEach(() => vi.unstubAllEnvs());

describe('商品とテーマの双方向参照', () => {
  it.each(['production', 'development'] as const)('%s: テーマからの行き先がLPの表示版・作成例に必ず戻る', async environment => {
    vi.stubEnv('NODE_ENV', environment);
    const entries = await Promise.all(STOREFRONT_PRODUCTS.map(async item => ({ ...(await resolveProductDetail(item.slug))!, slug: item.slug })));
    const themes = new Set(entries.flatMap(entry => productEditions(entry.product, entry.revision).flatMap(edition => edition.product.showcase?.flatMap(example => example.themeRefs?.map(ref => ref.themeKey) ?? []) ?? [])));
    expect(themes.size).toBeGreaterThan(10);
    for (const themeKey of themes) {
      const chapters = collectThemeProducts(themeKey, entries);
      for (const [sectionKey, links] of Object.entries(chapters)) {
        expect(new Set(links.map(link => link.product.id)).size).toBe(links.length);
        for (const link of links) {
          const displayed = await resolveProductDetail(link.product.slug);
          const editions = productEditions(displayed!.product, displayed!.revision);
          for (const example of link.examples) {
            const id = example.href.split('#example-')[1];
            const edition = editions.find(item => item.product.showcase?.some(section => section.id === id));
            const target = edition?.product.showcase!.find(item => item.id === id);
            if (example === link.examples[0]) expect(edition?.preview).toBe(link.preview);
            expect(target?.heading).toBe(example.heading);
            expect(target?.themeRefs).toEqual(expect.arrayContaining([expect.objectContaining({ themeKey, sectionKey })]));
          }
        }
      }
    }
  });
  it('財政商品の都道府県と市区町村の作成例を両方残す', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const chapters = await loadThemeProducts('local-finance');
    const fiscal = Object.values(chapters).flat().filter(entry => entry.product.id === 'P-04');
    const headings = fiscal.flatMap(entry => entry.examples.map(example => example.heading));
    const detail = (await resolveProductDetail('data-p-04'))!;
    for (const edition of productEditions(detail.product, detail.revision)) {
      for (const section of edition.product.showcase ?? []) {
        if (section.kind === 'chart') expect(headings).toContain(section.heading);
      }
    }
  });
  it('高齢世帯の分析例は公開状態に応じて販売版またはローカルの改訂案として案内する', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const published = Boolean((await resolveProductDetail('data-p-01'))?.product.analysisVersion);
    expect((await loadThemeProducts('aging-society'))['elderly-households']?.some(entry => entry.product.id === 'P-01') ?? false).toBe(published);
    vi.stubEnv('NODE_ENV', 'development');
    const population = (await loadThemeProducts('aging-society'))['elderly-households'].find(entry => entry.product.id === 'P-01');
    expect(population?.preview).toBe(!published);
    expect(population?.examples).toHaveLength(3);
    expect(population?.examples.every(example => example.href.startsWith('/products/data-p-01#example-'))).toBe(true);
  });
  it('関係のないテーマに商品を出さない', async () => {
    expect(await loadThemeProducts('unknown-theme')).toEqual({});
  });
  it('公開済の同じ分析版はテーマからも一度だけ参照する', () => {
    const section = { id: 'extra', kind: 'chart' as const, heading: '推移', lead: '比較', figures: [{ file: 'extra.png', alt: '推移' }],
      themeRefs: [{ themeKey: 'test-theme', sectionKey: 'test-section', title: 'テーマ', sectionTitle: '章', href: '/themes/test-theme#theme-section-test-section' }] };
    const original = STOREFRONT_PRODUCTS.find(product => product.id === 'P-01')!;
    const product = { ...original, analysisVersion: 'analysis-test', showcase: [section] };
    const revision = { ...product, slug: `${product.slug}-analysis-test` };
    expect(collectThemeProducts('test-theme', [{ product, revision, slug: product.slug, preview: false }])['test-section'][0].examples).toHaveLength(1);
  });
});
