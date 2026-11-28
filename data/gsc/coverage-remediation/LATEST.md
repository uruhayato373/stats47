# GSC カバレッジ是正 — 2026-W47 (2026-11-28)

> SSOT: `data/gsc/coverage-remediation/coverage-remediation-queue.json` / 正典: `.claude/skills/analytics/gsc-coverage-remediation/SKILL.md`
> 入力観測日: 2026-11-21 / 入力週齢: 1 週

## GSC カテゴリ別総件数 (UI export)

| カテゴリ | 件数 | 扱い |
|---|---:|---|
| 見つからない(404) | 11734 | 大半=意図的削除/旧URL。放置 |
| 登録済み | 8611 | 概要グラフの最新値。増やす対象 |
| 代替canonical | 4688 | 正常 |
| noindex 除外 | 4603 | 意図的。放置 |
| クロール済-未登録 | 4280 | Google判断。live は observe-after-fix |
| robots ブロック | 3596 | 意図的(OGP/CSV)。放置 |
| リダイレクト | 3269 | 意図的301。放置 |
| 検出-未登録 | 692 | クロール待ち |
| ソフト404 | 209 | live は content-check |
| duplicate-no-user-canonical | 80 |  |
| robots-blocked-indexed | 17 |  |
| サーバーエラー5xx | 13 | 実測で fix/解消判定 |
| redirect-error | 8 |  |
| duplicate-google-chose-other | 8 |  |

## 是正キュー (本番 HTTP 実測ベース)

- 追跡 URL: **2914** / 要対応 pending: **1609**
- URL Inspection で登録を確認して done にした URL: **0** (`--sync-inspection` が日次で更新。再び未登録と観測されたら pending に戻る)

| action | 分類総数 | pending | 意味 |
|---|---:|---:|---|
| observe-after-fix | 682 | 682 | 404/5xx→現在200=生きてる→sitemap/内部リンク整備後 URL Inspection で観測 |
| sitemap-gap | 927 | 927 | 現在200で未登録なのに sitemap に無い→sitemap へ載せるか noindex にするかを決める |
| none | 1305 | 0 | 意図的/解消済=放置 |

- observe-after-fix CSV: `<週>/coverage-live-observe-urls.csv` (**682 URL**) → 修正後に url-inspection-daily.cjs で観測

## 次サイクル

1. live (`observe-after-fix`) → sitemap/内部リンク/canonical を整備 → `url-inspection-daily.cjs` で coverageState を観測 (Indexing API 送信はしない・準拠是正 2026-07-23)
2. `content-check` (soft404) → gsc-analyst で薄さ/描画確認 → 補強 or noindex → 良ければ observe-after-fix に格上げ
3. `fix-5xx` → 実バグ修正
4. 次週 GSC 再 export → `ingest` + `build` で件数の減少と done の indexed 化を経過観測
