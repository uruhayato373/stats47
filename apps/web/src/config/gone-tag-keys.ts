/**
 * DB から削除済みの旧タグ slug 一覧
 *
 * `/tag/[tagKey]` ルートは現在有効なタグのみ DB にあるが、Google に過去インデックスされた
 * 英語 slug（`bedroom-communities`, `manufacturing-location` 等）が残り、アクセス時に
 * `notFound()` で 404 を返していた。middleware で 410 Gone を返すことで Google に
 * インデックスからの即時除去を促す。
 *
 * **日本語 tagKey は middleware 側で別途 410 を返すため、ここには登録しない。**
 *
 * 追加ルール:
 * - GSC「見つかりませんでした」レポートに `/tag/{英語slug}` が出てきたらここに追加
 * - DB の `articleTags.tagKey` に戻った場合はここから削除
 */
export const GONE_TAG_KEYS = new Set<string>([
  // 今後 GSC 404 レポートから抽出した死 slug をここに追加する
]);
