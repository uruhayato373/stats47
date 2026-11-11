import data from '../../../../data/site/url-history/gone-ranking-keys.json';

/**
 * 退役した ranking キー (410 Gone を返す)。
 *
 * 記録の正本は台帳 `site.gone-ranking-keys` (data/site/url-history/gone-ranking-keys.json)。ここは読み込み口。
 * 退役の日付・理由と追加の規律は台帳の Schema (config/schema/site.gone-ranking-keys.schema.json) に書いてある。
 */
export const GONE_RANKING_KEYS = new Set<string>(data.keys.map(({ key }) => key));
