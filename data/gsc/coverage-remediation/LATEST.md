# GSC カバレッジ是正 — 2026-W42 (2026-10-23)

> SSOT: `data/gsc/coverage-remediation/coverage-remediation-queue.json` / 正典: `.claude/skills/analytics/gsc-coverage-remediation/SKILL.md`
> 入力観測日: 2026-10-17 / 入力週齢: 0 週

## GSC カテゴリ別総件数 (UI export)

| カテゴリ | 件数 | 扱い |
|---|---:|---|
| 見つからない(404) | 12658 | 大半=意図的削除/旧URL。放置 |
| 登録済み | 6700 | 概要グラフの最新値。増やす対象 |
| robots ブロック | 4996 | 意図的(OGP/CSV)。放置 |
| noindex 除外 | 2299 | 意図的。放置 |
| リダイレクト | 1004 | 意図的301。放置 |
| 検出-未登録 | 977 | クロール待ち |
| 代替canonical | 833 | 正常 |
| robots-blocked-indexed | 584 |  |
| ソフト404 | 429 | live は content-check |
| クロール済-未登録 | 373 | Google判断。live は observe-after-fix |
| duplicate-no-user-canonical | 27 |  |
| サーバーエラー5xx | 20 | 実測で fix/解消判定 |
| redirect-error | 17 |  |
| duplicate-google-chose-other | 8 |  |

## 是正キュー (本番 HTTP 実測ベース)

- 追跡 URL: **2799** / 要対応 pending: **1023**
- URL Inspection で登録を確認して done にした URL: **133** (`--sync-inspection` が日次で更新。再び未登録と観測されたら pending に戻る)

| action | 分類総数 | pending | 意味 |
|---|---:|---:|---|
| observe-after-fix | 1156 | 1023 | 404/5xx→現在200=生きてる→sitemap/内部リンク整備後 URL Inspection で観測 |
| none | 1643 | 0 | 意図的/解消済=放置 |

- observe-after-fix CSV: `<週>/coverage-live-observe-urls.csv` (**1023 URL**) → 修正後に url-inspection-daily.cjs で観測

## 次サイクル

1. live (`observe-after-fix`) → sitemap/内部リンク/canonical を整備 → `url-inspection-daily.cjs` で coverageState を観測 (Indexing API 送信はしない・準拠是正 2026-07-23)
2. `content-check` (soft404) → gsc-analyst で薄さ/描画確認 → 補強 or noindex → 良ければ observe-after-fix に格上げ
3. `fix-5xx` → 実バグ修正
4. 次週 GSC 再 export → `ingest` + `build` で件数の減少と done の indexed 化を経過観測
