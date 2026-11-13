import { hrefFor } from '@stats47/data-configs/content/href';

import { productEditions } from './editions';
import { resolveProductDetail, isPublishedAnalysisRevision } from './product-detail';
import { STOREFRONT_PRODUCTS } from './storefront';

import type { StorefrontProduct } from './types';

interface DisplayedProduct { product: StorefrontProduct; revision?: StorefrontProduct; preview: boolean; slug: string }
export interface ThemeProductLink {
  product: Pick<StorefrontProduct, 'id' | 'slug' | 'title' | 'externalUrl'>;
  preview: boolean;
  examples: { href: string; heading: string }[];
}

/** 販売版と改訂案の作成例を逆引き。同じ商品・章の案内を一つにまとめる。 */
export function collectThemeProducts(themeKey: string, products: readonly DisplayedProduct[]) {
  const chapters: Record<string, ThemeProductLink[]> = {};
  for (const { product, revision, slug } of products) {
    for (const edition of productEditions(product, revision && !isPublishedAnalysisRevision(product, revision) ? revision : undefined)) {
      for (const example of edition.product.showcase ?? []) {
        if (example.kind !== 'chart' || !example.id) continue;
        for (const ref of example.themeRefs ?? []) {
          if (ref.themeKey !== themeKey) continue;
          const entries = chapters[ref.sectionKey] ??= [];
          let entry = entries.find(item => item.product.id === product.id);
          if (!entry) {
            entry = { product: { id: product.id, slug, title: product.displayTitle ?? product.title, externalUrl: product.externalUrl }, preview: edition.preview, examples: [] };
            entries.push(entry);
          }
          entry.examples.push({ href: `${hrefFor('product', { slug })}#example-${example.id}`, heading: example.heading });
        }
      }
    }
  }
  return chapters;
}

/** サーバーで絞り、商品カタログ全体をテーマのブラウザへ送らない。LPと同じ版選択を使う。 */
export async function loadThemeProducts(themeKey: string) {
  const entries = await Promise.all(STOREFRONT_PRODUCTS.map(async published => {
    const detail = await resolveProductDetail(published.slug);
    if (!detail) throw Error(`商品LPの参照がありません: ${published.id}`);
    return { ...detail, slug: published.slug };
  }));
  return collectThemeProducts(themeKey, entries);
}
