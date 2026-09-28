import type { NoteArticle } from './types';

/** カバーの役割で記事を分類する。note の series / vertical とは別軸。 */
export const NOTE_COVER_CATEGORIES = [
  { key: 'intro', label: '自己紹介' },
  { key: 'household', label: '県別家計' },
  { key: 'ranking-question', label: '問い型ランキング' },
  { key: 'ranking-story', label: '比較型ランキング' },
  { key: 'explainer', label: '統計解説' },
  { key: 'dataset-geo', label: 'データセット・Geo' },
  { key: 'practitioner', label: '自治体実務' },
  { key: 'palette', label: '配色・可視化' },
] as const;

export type NoteCoverCategory = (typeof NOTE_COVER_CATEGORIES)[number]['key'];

const PALETTE_KEYS = new Set([
  'paid-n823d76c5cbac', 'paid-n66ffb10aa41b', 'paid-n79fefdbd4d4c',
  'paid-n02da130aae01', 'paid-nfe2c65e669a8', 'paid-nf80da34b28c3',
]);

/** 回収記事の一部は vertical が stats47-note のままなので、内容で補正する。 */
const PRACTITIONER_KEYS = new Set([
  'paid-n8558c1a6503a', 'paid-ncab0d7b04228', 'paid-n2c2df066e865',
  'paid-nfd3ab8213e1f', 'paid-n68eafab07946', 'paid-nbead1fe772c7',
  'paid-n2207f3039fd3', 'paid-naf942acdbe59', 'paid-nf0c82ce9cee0',
  'recovered-nddd927386fce', 'recovered-n03e45e40d3a7',
]);

const EXPLAINER_KEYS = new Set([
  'recovered-n68f5e09c8d62', 'recovered-n03844512d58a',
  'recovered-n3908e5981967', 'recovered-n144d350fc14e',
  'recovered-n023501038bd5', 'recovered-nded2d34fc978',
]);

export function noteCoverCategory(article: Pick<NoteArticle, 'key' | 'title' | 'vertical'>): NoteCoverCategory {
  if (article.key === 'pinned-intro') return 'intro';
  if (article.key.startsWith('a-kakei-')) return 'household';
  if (article.key.startsWith('b-') || EXPLAINER_KEYS.has(article.key)) return 'explainer';
  if (article.key.startsWith('d-') || article.key === 'paid-n92b846280d1a') return 'dataset-geo';
  if (PALETTE_KEYS.has(article.key)) return 'palette';
  if (article.vertical.startsWith('koumuin') || PRACTITIONER_KEYS.has(article.key)) return 'practitioner';
  if (/[？?]\s*1位は/.test(article.title)) return 'ranking-question';
  if (/ランキング|格差|1位|トップ|最下位|ワースト|全国|救急車を最も呼ぶ|教育費、和歌山は/.test(article.title))
    return 'ranking-story';
  throw new Error(`note cover category missing: ${article.key}`);
}
