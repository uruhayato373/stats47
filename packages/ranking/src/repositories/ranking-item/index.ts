// 完全DBレス (Phase F): D1 metrics を引く ranking-item repository は全削除。
// runtime / 生成器は R2 item.json リーダ (read-ranking-items-snapshot) のみを使う。
// CategoryRankingItem 型は types/ranking-item へ relocate 済。
export {
  listRankingItemsWithTagsFromR2,
  readActiveKeysForSitemapFromR2,
  readActiveRankingKeysFromR2,
  readFeaturedRankingItemsFromR2,
  readFirstKeyByTagFromR2,
  readLatestYearForAreaTypeFromR2,
  readRankingItemByKeyAndAreaTypeFromR2,
  readRankingItemByKeyFromR2,
  readRankingItemFromR2,
  readRankingItemsByAreaTypeFromR2,
  readRankingItemsByCategoryFromR2,
  readRankingItemsByGroupKeyFromR2,
  readRankingItemsBySurveyFromR2,
  readRankingItemsByTagFromR2,
  readTagsForItemFromR2,
} from "./read-ranking-items-snapshot";
export type { GroupRankingItem } from "./read-ranking-items-snapshot";
