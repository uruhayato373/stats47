import { randomUUID } from 'node:crypto';

const escapeHtml = (text) => String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Resolve the current selling channel from the pack mapping and article ledger, never from an old shop URL. */
export function resolvePaidProduct(article, source) {
  const magazine = source.magazines.find((item) => item.key === article.magazine);
  if (!magazine?.paidProductId || article.isPaid) return null;
  const product = source.productNotes?.find((item) => item.productId === magazine.paidProductId);
  const target = source.articles.find((item) => item.key === product?.canonicalSlug);
  if (!target?.isPaid || !target.noteUrl || !/^https:\/\/note\.com\/stats47\/n\/n[a-f0-9]{12}$/.test(target.noteUrl)) {
    throw Error(`${magazine.key}: published paid note missing for ${magazine.paidProductId}`);
  }
  return { productId: product.productId, noteUrl: target.noteUrl, title: target.title };
}

/** Replace only old product figures and their adjacent sales lead in the navigation footer. */
export function rewriteProductCards(body, product) {
  if (!product) return body;
  const footer = body.search(/<h[23]\b[^>]*>次に読む<\/h[23]>/);
  if (footer < 0) return body;
  const head = body.slice(0, footer);
  let tail = body.slice(footer);
  tail = tail.replace(/(<p\b[^>]*>)<strong>このテーマをまとめて読む・使う<\/strong>(?:(?!<p\b)[\s\S])*?<\/p>\s*(<figure\b[^>]*data-src="https:\/\/stats47\.jp\/products\/[^" ]+"[^>]*>)[\s\S]*?<\/figure>/g, (_block, opening, figure) => {
    const attrs = figure.replace(/\s+(?:data-src|data-identifier|embedded-service|embedded-content-key)="[^"]*"/g, '').replace(/>$/, '');
    return `${opening}<strong>このテーマのデータを手元で使う</strong><br>「${escapeHtml(product.title)}」で、収録内容・サンプル・価格を確認できます。</p>${attrs} data-src="${escapeHtml(product.noteUrl)}" data-identifier="${product.noteUrl.split('/').pop()}" embedded-service="note" embedded-content-key="pending${randomUUID().replaceAll('-', '')}"></figure>`;
  });
  return head + tail;
}
