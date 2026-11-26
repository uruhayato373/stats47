/**
 * 関連付けから出す短いリンク (ランキングの「市区町村別を見る」) のボタンの配色。
 * サイトの主色 (primary) は黒に近く、塗りのボタンにしても色として目立たなかった (2026-11-26 オーナー判断で青にする)。
 * 生の Tailwind パレット色は *.palette.ts にだけ置く (check-design-system: no-raw-palette-color)。
 * 白い文字は blue-600 の上で約 5.2:1 (小さい文字の基準 4.5:1 を満たす)。暗い地でも同じ地の色にする。
 */
export const SHORT_LINK_BUTTON_TONE = "bg-blue-600 text-white hover:bg-blue-700" as const;
