# GSC カバレッジ是正 — 2026-W38 (2026-09-25)

> SSOT: `.claude/state/gsc/coverage-remediation-queue.json` / 正典: `.claude/skills/analytics/gsc-coverage-remediation/SKILL.md`
> 入力観測日: 2026-09-20 / 入力週齢: 0 週

## GSC カテゴリ別総件数 (UI export)

| カテゴリ | 件数 | 扱い |
|---|---:|---|
| 見つからない(404) | 12428 | 大半=意図的削除/旧URL。放置 |
| robots ブロック | 4735 | 意図的(OGP/CSV)。放置 |
| noindex 除外 | 2115 | 意図的。放置 |
| クロール済-未登録 | 1180 | Google判断。live は observe-after-fix |
| 検出-未登録 | 785 | クロール待ち |
| リダイレクト | 687 | 意図的301。放置 |
| ソフト404 | 445 | live は content-check |
| robots-blocked-indexed | 201 |  |
| 代替canonical | 159 | 正常 |
| redirect-error | 24 |  |
| duplicate-no-user-canonical | 21 |  |
| サーバーエラー5xx | 19 | 実測で fix/解消判定 |
| duplicate-google-chose-other | 6 |  |

## 是正キュー (本番 HTTP 実測ベース)

- 追跡 URL: **3235** / 要対応 pending: **1037**
- URL Inspection で登録を確認して done にした URL: **71** (`--sync-inspection` が日次で更新。再び未登録と観測されたら pending に戻る)

| action | 分類総数 | pending | 意味 |
|---|---:|---:|---|
| fix-5xx | 2 | 2 | probeで5xx分類。pendingなら実バグ(最優先) |
| observe-after-fix | 1102 | 1032 | 404/5xx→現在200=生きてる→sitemap/内部リンク整備後 URL Inspection で観測 |
| content-check | 5 | 2 | soft404→現在200=薄さ/描画 未判定 |
| enrich | 23 | 0 | 全国テンプレ重複(area×cat)/未公開md→県別補強・公開 |
| verify-intent | 4 | 1 | 現在も404=公開漏れ or 死亡の判別 |
| none | 2099 | 0 | 意図的/解消済=放置 |

- observe-after-fix CSV: `<週>/coverage-live-observe-urls.csv` (**1032 URL**) → 修正後に url-inspection-daily.cjs で観測

## 次サイクル

1. live (`observe-after-fix`) → sitemap/内部リンク/canonical を整備 → `url-inspection-daily.cjs` で coverageState を観測 (Indexing API 送信はしない・準拠是正 2026-07-23)
2. `content-check` (soft404) → gsc-analyst で薄さ/描画確認 → 補強 or noindex → 良ければ observe-after-fix に格上げ
3. `fix-5xx` → 実バグ修正
4. 次週 GSC 再 export → `ingest` + `build` で件数の減少と done の indexed 化を経過観測
