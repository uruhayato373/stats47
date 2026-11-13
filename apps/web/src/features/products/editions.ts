import type { StorefrontProduct } from './types';

/** 販売版を必ず残し、未公開の分析は別の版としてLP・note・テーマで共用する。 */
export function productEditions(product: StorefrontProduct, revision?: StorefrontProduct) {
  if (revision && revision.id !== product.id) throw Error(`商品の版が一致しません: ${product.id}`);
  const editions = [
    { key: 'published', label: '現在販売中の内容', product, preview: false },
    ...(revision ? [{ key: 'revision', label: '改訂案（未公開）', product: revision, preview: true }] : []),
  ];
  const anchors = editions.flatMap(edition => edition.product.showcase?.flatMap(section => section.id ? [section.id] : []) ?? []);
  if (new Set(anchors).size !== anchors.length) throw Error(`商品の作成例IDが重複しています: ${product.id}`);
  return editions;
}
