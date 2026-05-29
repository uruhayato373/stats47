/**
 * 有効な ranking キー一覧（prefecture, isActive）
 *
 * 実体は完全DBレスの key SSOT として `@stats47/ranking/config` に移設済み
 * (基盤1 `listRankingItemsWithTagsFromR2` の git 列挙フォールバックと共有するため)。
 * 本ファイルは後方互換の re-export。importer は従来どおり `@/config/known-ranking-keys` で可。
 *
 * 生成: `cd apps/web && R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
 *        NODE_OPTIONS='--conditions react-server' npx tsx scripts/generate-known-ranking-keys.ts`
 *        → packages/ranking/src/config/known-ranking-keys.ts に出力される。
 */
export { KNOWN_RANKING_KEYS } from "@stats47/ranking/config";
