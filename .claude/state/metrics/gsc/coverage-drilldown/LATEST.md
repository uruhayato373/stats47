# GSC Coverage Drilldown — 2026-W17

**取得日**: 2026-04-25 / **ソース**: gcsエラー

## カテゴリ別件数（前週比）

| カテゴリ | 今週 | 前週 | 変化 |
|---|---:|---:|---|
| 見つかりませんでした (404) | 1000 | — | — |
| サーバーエラー (5xx) | 1000 | — | — |
| ページにリダイレクトがあります | 1000 | — | — |
| 代替ページ (canonical 適切) | 885 | — | — |
| 重複 (user canonical なし) | 534 | — | — |
| ソフト 404 | 500 | — | — |
| **合計** | **4919** | — | — |

## 注意

- 各カテゴリの件数は **GSC export の上限 1000 件サンプル**。実数（GSC UI 集計値）は `summary.json.full_count_estimate_total` に手入力で併記する
- 「前回のクロール」が古い URL は Google が再クロールしていない兆候。Phase 6 の URL Inspection API（個別 URL 観測）と併読

## 詳細

- 今週の URL リスト: `2026-W17/` 配下 6 CSV
- 時系列集約: `history.csv`
- 取得手順: GSC UI → カバレッジ → エラーカテゴリ → ドリルダウン → エクスポート
- 解析コマンド: `node .claude/scripts/gsc/parse-coverage-drilldown.cjs`
