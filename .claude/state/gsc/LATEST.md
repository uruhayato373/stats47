# GSC カバレッジ是正 — 2026-W32 (2026-08-16)

> SSOT: `.claude/state/gsc/coverage-remediation-queue.json` / 正典: `.claude/skills/analytics/gsc-coverage-remediation/SKILL.md`

## GSC カテゴリ別総件数 (UI export)

| カテゴリ | 件数 | 扱い |
|---|---:|---|
| 見つからない(404) | 8110 | 大半=意図的削除/旧URL。放置 |
| robots ブロック | 3761 | 意図的(OGP/CSV)。放置 |
| クロール済-未登録 | 3352 | Google判断。live は observe-after-fix |
| noindex 除外 | 1656 | 意図的。放置 |
| リダイレクト | 700 | 意図的301。放置 |
| 検出-未登録 | 440 | クロール待ち |
| ソフト404 | 407 | live は content-check |
| 代替canonical | 81 | 正常 |
| サーバーエラー5xx | 49 | 実測で fix/解消判定 |
| redirect-error | 11 |  |
| robots-blocked-indexed | 4 |  |
| duplicate-google-chose-other | 2 |  |
| duplicate-no-user-canonical | 0 |  |

## 是正キュー (本番 HTTP 実測ベース)

- 追跡 URL: **2456** / 要対応 pending: **419**

| action | 件数 | 意味 |
|---|---:|---|
| observe-after-fix | 347 | 404/5xx→現在200=生きてる→sitemap/内部リンク整備後 URL Inspection で観測 |
| deactivate | 31 | config/データ無しの空200 ranking→KNOWN除去で404/410化 |
| noindex | 13 | 空テンプレ/検索/未公開blog→noindex or 410 |
| content-check | 13 | soft404→現在200=薄さ/描画 未判定 |
| enrich | 27 | 全国テンプレ重複(area×cat)/未公開md→県別補強・公開 |
| verify-intent | 19 | 現在も404=公開漏れ or 死亡の判別 |
| none | 2006 | 意図的/解消済=放置 |

- observe-after-fix CSV: `<週>/coverage-live-observe-urls.csv` (**347 URL**) → 修正後に url-inspection-daily.cjs で観測

## 次サイクル

1. live (`observe-after-fix`) → sitemap/内部リンク/canonical を整備 → `url-inspection-daily.cjs` で coverageState を観測 (Indexing API 送信はしない・準拠是正 2026-07-23)
2. `content-check` (soft404) → gsc-analyst で薄さ/描画確認 → 補強 or noindex → 良ければ observe-after-fix に格上げ
3. `fix-5xx` → 実バグ修正
4. 次週 GSC 再 export → `ingest` + `build` で件数の減少と done の indexed 化を経過観測
