# GSC カバレッジ是正 — 2026-W25 (2026-06-16)

> SSOT: `.claude/state/gsc/coverage-remediation-queue.json` / 正典: `docs/02_実装計画/12_GSCカバレッジ是正ループ.md`

## GSC カテゴリ別総件数 (UI export)

| カテゴリ | 件数 | 扱い |
|---|---:|---|
| 見つからない(404) | 8378 | 大半=意図的削除/旧URL。放置 |
| クロール済-未登録 | 2937 | Google判断。live は resubmit |
| robots ブロック | 2651 | 意図的(OGP/CSV)。放置 |
| noindex 除外 | 1434 | 意図的。放置 |
| リダイレクト | 1277 | 意図的301。放置 |
| 検出-未登録 | 414 | クロール待ち |
| ソフト404 | 383 | live は content-check |
| サーバーエラー5xx | 200 | 実測で fix/解消判定 |
| 代替canonical | 194 | 正常 |
| duplicate-google-chose-other | 23 |  |
| redirect-error | 2 |  |
| other-4xx | 0 |  |
| duplicate-no-user-canonical | 0 |  |
| robots-blocked-indexed | 0 |  |

## 是正キュー (本番 HTTP 実測ベース)

- 追跡 URL: **3583** / 要対応 pending: **158**

| action | 件数 | 意味 |
|---|---:|---|
| fix-5xx | 1 | 現在も5xx=実バグ(最優先) |
| resubmit | 91 | 404/5xx→現在200=生きてる→Indexing API再送信 |
| deactivate | 32 | config/データ無しの空200 ranking→KNOWN除去で404/410化 |
| noindex | 13 | 空テンプレ/検索/未公開blog→noindex or 410 |
| enrich | 46 | 全国テンプレ重複(area×cat)/未公開md→県別補強・公開 |
| verify-intent | 7 | 現在も404=公開漏れ or 死亡の判別 |
| none | 3393 | 意図的/解消済=放置 |

- curated 再送信 CSV: `<週>/coverage-live-resubmit-urls.csv` (**91 URL**) → auto-resubmit.mjs が拾う

## 次サイクル

1. live (`resubmit`) → CI `gsc-auto-resubmit-daily.yml` が curated CSV を Indexing API 送信
2. `content-check` (soft404) → gsc-analyst で薄さ/描画確認 → 補強 or noindex → 良ければ resubmit に格上げ
3. `fix-5xx` → 実バグ修正
4. 次週 GSC 再 export → `ingest` + `build` で件数の減少と done の indexed 化を経過観測
