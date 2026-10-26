import { randomUUID } from 'node:crypto';
import { cardEntries, unregisteredCards } from './native-cards.mjs';
import { applyNavigationFooter } from './navigation-footer.mjs';

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

/** Native note cards store their title in the embed, not an inline strong element. */
export function inspectPaidProductCard(body, embeddedContents, product) {
  const cards = cardEntries(body);
  const target = cards.find((card) => card.url === product.noteUrl && card.service === 'note');
  if (!target) return { ok: false, detail: `有料noteカードがない: ${product.noteUrl}` };
  if (cards.some((card) => /^https:\/\/(?:stats47\.jp\/products\/|coconala\.com\/)/.test(card.url))) {
    return { ok: false, detail: '旧商品カードが残っている' };
  }
  if (unregisteredCards(body, embeddedContents).some((card) => card.key === target.key)) {
    return { ok: false, detail: '有料noteカードが未登録' };
  }
  return { ok: true, detail: `公開済み有料noteと登録情報が一致: ${product.title}`, expectedNoteUrl: product.noteUrl };
}

/** Replace only old product figures and their adjacent sales lead in the navigation footer. */
export function rewriteProductCards(body, product) {
  if (!product) return body;
  const footer = body.search(/<h[23]\b[^>]*>次に読む<\/h[23]>/);
  const head = footer < 0 ? '' : body.slice(0, footer);
  let tail = footer < 0 ? body : body.slice(footer);
  tail = tail.replace(/(<p\b[^>]*>)<strong>このテーマ[^<]*<\/strong>(?:(?!<p\b)[\s\S])*?<\/p>\s*(<figure\b[^>]*data-src="https:\/\/stats47\.jp\/products\/[^" ]+"[^>]*>)[\s\S]*?<\/figure>/g, (_block, opening, figure) => {
    const attrs = figure.replace(/\s+(?:data-src|data-identifier|embedded-service|embedded-content-key)="[^"]*"/g, '').replace(/>$/, '');
    return `${opening}<strong>このテーマのデータを手元で使う</strong><br>「${escapeHtml(product.title)}」で、収録内容・サンプル・価格を確認できます。</p>${attrs} data-src="${escapeHtml(product.noteUrl)}" data-identifier="${product.noteUrl.split('/').pop()}" embedded-service="note" embedded-content-key="pending${randomUUID().replaceAll('-', '')}"></figure>`;
  });
  // Native editor HTML may omit the inline sales lead. Replace its figure independently.
  tail = tail.replace(/<figure\b[^>]*data-src="https:\/\/(?:stats47\.jp\/products\/|coconala\.com\/)[^" ]+"[^>]*>[\s\S]*?<\/figure>/g, (figure) => {
    const opening = figure.slice(0, figure.indexOf('>'));
    const attrs = opening.replace(/\s+(?:data-src|data-identifier|embedded-service|embedded-content-key)="[^"]*"/g, '');
    return `${attrs} data-src="${escapeHtml(product.noteUrl)}" data-identifier="${product.noteUrl.split('/').pop()}" embedded-service="note" embedded-content-key="pending${randomUUID().replaceAll('-', '')}"></figure>`;
  });
  return applyNavigationFooter(head + tail, {
    productNoteUrl: product.noteUrl,
    productDescription: `「${product.title}」で、収録内容・サンプル・価格を確認できます。`,
  }).body;
}
