import data from '../../../../data/site/url-history/gone-tag-keys.json';

const keys: readonly { readonly key: string }[] = data.keys;

/**
 * 削除済みの旧タグ slug 一覧 (middleware が 410 Gone を返す)
 *
 * 記録の正本は台帳 `site.gone-tag-keys` (data/site/url-history/gone-tag-keys.json)。ここは読み込み口。
 * 日本語 tagKey は middleware 側で別途 410 を返すため、ここには登録しない。
 */
export const GONE_TAG_KEYS = new Set<string>(keys.map(({ key }) => key));
