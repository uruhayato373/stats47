import "server-only";

/**
 * `/themes` 一覧が使う最小 entrypoint。
 *
 * `./server` は `ThemePageLayout` / `ThemeIndicatorCatalogSection` / `loadThemeData`
 * (テーマ詳細ページ一式) も export するため、一覧が `ALL_THEMES` だけを欲しくても
 * 詳細ページの依存グラフごと dev bundle に取り込まれていた。
 * 一覧は詳細の描画・データ取得を必要としないので、ここだけを見る。
 *
 * root barrel (`./server`) は互換性のため残す。
 */
export { ALL_THEMES } from "./config/all-themes";
