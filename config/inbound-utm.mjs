/**
 * 自分の商品 (Kindle の本・note の記事) からサイトへ戻るリンクの UTM 規約 (単一ソース)。
 * サイトから商品への送客 (GA4 `product_click`) の逆向きで、商品がサイトへどれだけ読者を返すかを流入元で数える。
 *
 * | 出どころ | utm_source | utm_medium | utm_campaign | utm_content |
 * |---|---|---|---|---|
 * | Kindle の本 | kindle | ebook | 書籍 ID の小文字 (例 k-s1-02) | 置き場所 (sources = 出典ページの元記事 / latest = 最新値の案内) |
 * | note の記事の本文リンク | note | referral | note_article | note の記事キー (n…) |
 *
 * - Kindle の campaign を ASIN にしないのは、EPUB を作る時点では ASIN が無い (出版後に付く) ため。
 *   書籍 ID と ASIN は data/products/kdp/listings.json が 1 対 1 で対応させる。
 * - note のリンクカード (data-src を持つ figure) には付けない。note はカードの URL に query があると
 *   カードを作れないので、商品カードは clean path `/products/<slug>/from/note/<noteKey>`
 *   (サイト側で utm_campaign=note_product へ転送) を使い、ページへのカードは参照元 note.com で数える。
 * - SNS の UTM は `.claude/scripts/lib/sns-utm.cjs` が別に持つ (utm_medium=social)。
 * TS からも読むため、型は隣の `inbound-utm.d.mts` に置く。
 */

const SITE_HOSTS = new Set(["stats47.jp", "www.stats47.jp"]);
const BOOK_ID = /^K-S\d+-\d+$/;
const NOTE_KEY = /^n[0-9a-f]+$/i;
export const KINDLE_UTM_CONTENTS = Object.freeze(["sources", "latest"]);

function withUtm(rawUrl, params) {
  const url = new URL(rawUrl);
  if (!SITE_HOSTS.has(url.hostname)) throw new Error(`inbound-utm: stats47.jp 以外の URL: ${rawUrl}`);
  for (const key of [...url.searchParams.keys()]) if (key.startsWith("utm_")) url.searchParams.delete(key);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

/** Kindle の本からサイトへのリンク。bookId は K-S1-02 の形、content は KINDLE_UTM_CONTENTS のどれか */
export function kindleInboundUrl(rawUrl, bookId, content) {
  if (!BOOK_ID.test(bookId)) throw new Error(`inbound-utm: 書籍 ID の形が違う: ${bookId}`);
  if (!KINDLE_UTM_CONTENTS.includes(content)) throw new Error(`inbound-utm: 未知の置き場所: ${content}`);
  return withUtm(rawUrl, { utm_source: "kindle", utm_medium: "ebook", utm_campaign: bookId.toLowerCase(), utm_content: content });
}

/** note の記事の本文 (テキストリンク) からサイトへのリンク */
export function noteInboundUrl(rawUrl, noteKey) {
  if (!NOTE_KEY.test(noteKey)) throw new Error(`inbound-utm: note の記事キーの形が違う: ${noteKey}`);
  return withUtm(rawUrl, { utm_source: "note", utm_medium: "referral", utm_campaign: "note_article", utm_content: noteKey });
}
