/**
 * theme-dashboard の client-safe な公開 API。
 *
 * `server.ts` は `import "server-only"` を持つため他 feature の client component からは
 * 使えない。テーマページに埋め込まれる section (migration-flow / commute-flow) が
 * 選択中の都道府県に追従するために必要な hook だけをここから公開する。
 */
export {
  useThemePrefecture,
  ThemePrefectureProvider,
} from "./components/ThemePrefectureContext";
