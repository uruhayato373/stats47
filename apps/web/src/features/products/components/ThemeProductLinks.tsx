import { TrackedProductLink } from './TrackedProductLink';

import type { ThemeProductLink } from '../theme-products';

/** テーマの該当章の末尾だけに、同じ台帳から解決した商品の作成例を案内する。 */
export function ThemeProductLinks({ entries }: { readonly entries: readonly ThemeProductLink[] }) {
  if (!entries.length) return null;
  return <aside aria-label="関連するデータ商品" data-theme-product-links className="flex min-w-0 flex-col gap-3 p-4 text-sm">
    <p className="font-medium">このテーマを自分の資料で分析する</p>
    <ul className="flex flex-col gap-3">
      {entries.map(({ product, preview, examples }) => <li key={product.id} className="min-w-0">
        <TrackedProductLink href={examples[0].href} label={`${product.id}:${examples[0].heading}`}
          surface="theme_product" product={product}
          className="inline-flex min-h-11 items-center text-primary hover:underline">
          {product.title}の作成例を見る →
        </TrackedProductLink>
        <p className="text-muted-foreground">{examples[0].heading}{examples.length > 1 ? ' ほか' : ''}
          {preview ? '（未公開の改訂案）' : ''}</p>
      </li>)}
    </ul>
  </aside>;
}
