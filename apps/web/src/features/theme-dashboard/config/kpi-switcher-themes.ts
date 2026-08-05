/**
 * KPI タイル切替チャート (`MetricSwitcherPanel`) を出すテーマ。
 *
 * ★これはパイロット用の一時フラグ。GA4 で labor-wages の平均エンゲージメント時間
 * (before: 37 秒 / 2026-08-04 実測) とタイル操作率 (`nav_click` の
 * `nav_surface=theme_kpi_switcher`) を 2 週間観測し、改善が確認できたら
 * **全テーマへ展開してこのファイルごと削除する**。悪化していれば集合を空にして
 * 旧カードグリッドへ即時ロールバックできる。
 *
 * 判定は themeKey なので、将来 MAP_VISIBLE_THEMES にテーマが入って
 * hideMap でないレイアウトを通る場合でも影響を受けない。
 */
export const KPI_SWITCHER_THEMES: ReadonlySet<string> = new Set(["labor-wages"]);
