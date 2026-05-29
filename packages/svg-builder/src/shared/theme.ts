/**
 * SVG ダークモード対応の共通スタイルブロック
 *
 * ## なぜ必要か
 * ブログのチャート SVG は markdown `![](data/x.svg)` 経由で `<img>` として描画される。
 * `<img>` 内の SVG はサンドボックス化され、親ページの `.dark` クラス（next-themes の
 * class ベーストグル）を参照できない。そのため SVG 内部に
 * `@media (prefers-color-scheme: dark)` を持つ `<style>` を埋め込み、OS レベルの
 * ダークモードに追従させる。
 *
 * ## 制約（既知）
 * - OS 設定が真実源。サイトの手動トグル（OS と逆方向に切り替えた場合）には追従しない。
 *   これは `<img>` 埋め込みの構造的制約で、完全追従にはインライン SVG 化が必要。
 * - 大多数のユーザーは OS=dark → サイト=dark のため、本方式で実用上カバーできる。
 *
 * ## 使い方
 * `<svg ...>` 直後（`<title>`/`<desc>` の後）に `svgThemeStyle()` を挿入し、
 * 色を持つ要素には inline `fill`/`stroke` の代わりに以下の class を付与する:
 *
 * | class | 用途 | light | dark |
 * |---|---|---|---|
 * | `svg-bg`          | 背景 rect          | #ffffff | #0f172a |
 * | `svg-plot`        | プロットエリア塗り  | #f9fafb | #1e293b |
 * | `svg-plot-border` | プロットエリア枠線  | #d1d5db | #334155 |
 * | `svg-title`       | タイトル文字        | #1f2937 | #e2e8f0 |
 * | `svg-axis`        | 軸ラベル文字        | #374151 | #cbd5e1 |
 * | `svg-tick`        | 目盛り・凡例文字    | #6b7280 | #94a3b8 |
 * | `svg-grid`        | グリッド線          | #e5e7eb | #334155 |
 *
 * データ色（棒・ドット・地方ブロック色）はライト/ダーク両方で視認できる vivid 色のため、
 * 従来どおり inline `fill` で指定してよい（テーマ非依存）。
 *
 * CSS presentation 属性（`fill="..."`）は CSS class より優先度が低いため、
 * class を付ければ inline fill が残っていても上書きされる。ただし可読性のため
 * テーマ依存要素では inline fill を削除して class のみにすることを推奨。
 */
export function svgThemeStyle(): string {
  return `  <style>
    .svg-bg{fill:#ffffff}
    .svg-plot{fill:#f9fafb}
    .svg-plot-border{stroke:#d1d5db}
    .svg-title{fill:#1f2937}
    .svg-axis{fill:#374151}
    .svg-tick{fill:#6b7280}
    .svg-grid{stroke:#e5e7eb}
    @media (prefers-color-scheme:dark){
    .svg-bg{fill:#0f172a}
    .svg-plot{fill:#1e293b}
    .svg-plot-border{stroke:#334155}
    .svg-title{fill:#e2e8f0}
    .svg-axis{fill:#cbd5e1}
    .svg-tick{fill:#94a3b8}
    .svg-grid{stroke:#334155}
    }
  </style>`;
}
