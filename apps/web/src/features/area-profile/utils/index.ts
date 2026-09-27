/**
 * area-profile ドメインのユーティリティ Barrel。
 * ドメイン内 (components 等) からは必ずこの Barrel 経由で import する
 * (`no-restricted-imports` ルール: `../utils` からインポートする)。
 *
 * ここに集約するのは `/areas` 県選択ハブが使う純ユーティリティ (client-safe)。
 * 既存の generate-* 系 (server 用) は feature ルート index から個別に export される。
 */
export {
  buildAreaDirectoryData,
  type AreaDirectoryData,
  type AreaTile,
  type AreaRegionGroup,
} from "./build-area-directory-data";
export { matchPrefectures, prefectureShortName } from "./match-prefectures";
