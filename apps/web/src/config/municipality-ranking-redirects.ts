import data from '../../../../data/site/url-history/municipality-ranking-redirects.json';

/**
 * 公開をやめた市区町村ランキング key の恒久転送先 (/municipalities/ranking/<key> と県別の /<県コード> だけに効く)。
 *
 * 都道府県ランキング (/ranking/<key>) の転送は RANKING_SLUG_REDIRECTS が持つ。転送元の都道府県ページが公開中のことが
 * あるので、2 つを混ぜない。転送先が公開中で転送元が非公開であることはテストで固定する。
 * 記録の正本は台帳 `site.municipality-ranking-redirects` (data/site/url-history/municipality-ranking-redirects.json)。ここは読み込み口。
 */
export const MUNICIPALITY_RANKING_SLUG_REDIRECTS: Readonly<Record<string, string>> = Object.fromEntries(
  data.redirects.map(({ from, to }) => [from, to]),
);
