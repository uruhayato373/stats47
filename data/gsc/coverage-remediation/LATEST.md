# GSC カバレッジ是正 — 2026-W44 (2026-11-07)

> SSOT: `data/gsc/coverage-remediation/coverage-remediation-queue.json` / 正典: `.claude/skills/analytics/gsc-coverage-remediation/SKILL.md`
> 入力観測日: 2026-10-31 / 入力週齢: 1 週

## GSC カテゴリ別総件数 (UI export)

| カテゴリ | 件数 | 扱い |
|---|---:|---|
| 見つからない(404) | 12653 | 大半=意図的削除/旧URL。放置 |
| 登録済み | 7069 | 概要グラフの最新値。増やす対象 |
| robots ブロック | 4837 | 意図的(OGP/CSV)。放置 |
| noindex 除外 | 2414 | 意図的。放置 |
| クロール済-未登録 | 2068 | Google判断。live は observe-after-fix |
| 代替canonical | 1226 | 正常 |
| リダイレクト | 1148 | 意図的301。放置 |
| 検出-未登録 | 834 | クロール待ち |
| robots-blocked-indexed | 586 |  |
| ソフト404 | 413 | live は content-check |
| duplicate-no-user-canonical | 22 |  |
| redirect-error | 17 |  |
| サーバーエラー5xx | 17 | 実測で fix/解消判定 |
| duplicate-google-chose-other | 10 |  |

## 是正キュー (本番 HTTP 実測ベース)

- 追跡 URL: **3264** / 要対応 pending: **1802**
- URL Inspection で登録を確認して done にした URL: **8** (`--sync-inspection` が日次で更新。再び未登録と観測されたら pending に戻る)

| action | 分類総数 | pending | 意味 |
|---|---:|---:|---|
| observe-after-fix | 852 | 844 | 404/5xx→現在200=生きてる→sitemap/内部リンク整備後 URL Inspection で観測 |
| sitemap-gap | 958 | 958 | 現在200で未登録なのに sitemap に無い→sitemap へ載せるか noindex にするかを決める |
| none | 1454 | 0 | 意図的/解消済=放置 |

- observe-after-fix CSV: `<週>/coverage-live-observe-urls.csv` (**844 URL**) → 修正後に url-inspection-daily.cjs で観測

## 次サイクル

1. live (`observe-after-fix`) → sitemap/内部リンク/canonical を整備 → `url-inspection-daily.cjs` で coverageState を観測 (Indexing API 送信はしない・準拠是正 2026-07-23)
2. `content-check` (soft404) → gsc-analyst で薄さ/描画確認 → 補強 or noindex → 良ければ observe-after-fix に格上げ
3. `fix-5xx` → 実バグ修正
4. 次週 GSC 再 export → `ingest` + `build` で件数の減少と done の indexed 化を経過観測
