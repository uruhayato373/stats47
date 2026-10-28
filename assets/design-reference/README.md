# design-reference

公開サイトが寄せる見本 ([demos.shadcndashboard.dev](https://demos.shadcndashboard.dev/)) の撮影と、部品ごとの実測値。
仕様の本体は `docs/01_技術設計/04_デザインシステム.md` の「見本の実測値と部品の仕様」。ここはその根拠の保存場所。

| 置き場 | 中身 |
|---|---|
| `shadcndashboard/<日付>/screens/` | 見本 12 画面 × 1440・390px の全体の撮影 (webp 品質 80) |
| `shadcndashboard/<日付>/measurements/` | 同じ画面の部品 (`data-slot`) ごとの計算後スタイルの集計・文字・格子・区切り |
| `shadcndashboard/<日付>/pages.json` | 測った画面の一覧 (stats47 のどの部品の見本か) |
| `stats47-baseline/<日付>/` | 同じ方法で測った stats47 (手元の本番ビルド) の起点 |

測り直すとき:

```bash
node scripts/ui-theme/measure-design-reference.mjs .local/design-reference --measure
node scripts/ui-theme/measure-design-reference.mjs .local/stats47 --measure http://127.0.0.1:3200 assets/design-reference/stats47-baseline/2026-10-28/pages.json
node scripts/ui-theme/compare-design-slots.mjs assets/design-reference/shadcndashboard/2026-10-28/measurements .local/stats47 1440
```

見本サイトは更新されるので、測り直したら新しい日付の置き場に保存し、古い日付は残す (比べられるように)。
