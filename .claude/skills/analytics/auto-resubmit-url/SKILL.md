---
name: auto-resubmit-url
description: GSC URL Inspection 結果から未 INDEXED な URL を抽出し、Indexing API で URL_UPDATED 通知を自動再送信。quota 200/day 管理 + 7 日以内重複防止。Use when user says "Indexing API 再送信", "auto-resubmit", "URL 再クロール促進".
---

GSC Coverage Drilldown CSV から未 INDEXED な URL を抽出し、Google Indexing API (`URL_UPDATED`) で再クロール要請を自動送信する。quota 200/day と 7 日以内重複防止の運用ガードを内蔵。Phase 2 (観測短サイクル化) における Drilldown 未登録削減の補助手段。

## 注意 (公式仕様の引用必須)

> Indexing API は Google 公式で「ジョブポスト・ライブ動画」推奨。汎用ページへの効果は限定的 (公式: <https://developers.google.com/search/apis/indexing-api>, アクセス日 2026-05-18)。汎用ページの再送信は Drilldown 未登録削減の補助手段として位置づけ、Sitemap 整備・コンテンツ改善等の本質施策とセットで運用する。

`evidence-based-judgment.md` に従い、本スキルで effect/full を付ける場合は URL Inspection API の再クロール観測値を併記すること。

## 引数

```
$ARGUMENTS — [flags...]
  --dry-run         (default) 送信予定 URL を出力するのみ、API 非呼び出し
  --execute         実際に Indexing API へ送信 (dry-run を override)
  --max N           1 回の実行で送信する URL 数上限 (default 200)
  --input <path>    入力 CSV を明示指定 (省略時は最新の drilldown CSV を自動検出)
```

## 動作

1. **入力 CSV 特定**: `--input` 指定なしなら `.claude/state/metrics/gsc/coverage-drilldown/{YYYY-Www}/{category}-urls.csv` の最新ファイル (mtime 最新) を選択。`indexed-submitted-urls.csv` は INDEXED 済のため対象外
2. **URL 抽出**: CSV 1 列目 (URL) を抽出。ファイル名から coverageState 相当のカテゴリを推定 (例: `crawled-not-indexed-urls.csv` → `crawled-not-indexed`)
3. **履歴 dedup**: `.claude/state/metrics/gsc/resubmit-history.json` を読み、各 URL の最終 success 再送信日が 7 日以内なら除外
4. **quota 計算**: 当日 JST の `status=success` 件数を集計 → `min(filtered, 200-todayCount, --max)` が今日の送信件数
5. **dry-run 出力**: `URL | coverageState | last_resubmit | will_send` 形式の表
6. **実送信**: `google.indexing({version:'v3'}).urlNotifications.publish({url, type:'URL_UPDATED'})` を 1 件ずつ呼び出し、間に 200ms 待機。結果を `resubmit-history.json` に append
7. **集計報告**: `ok=N, fail=N, remaining_quota=N/200`

## 使用例

```bash
# Step 1: dry-run で候補確認 (必須)
node .claude/scripts/gsc/auto-resubmit.mjs --dry-run

# Step 2: 件数を制限してテスト送信
node .claude/scripts/gsc/auto-resubmit.mjs --execute --max 5

# Step 3: 通常運用 (人手承認後)
node .claude/scripts/gsc/auto-resubmit.mjs --execute --max 50

# 任意 CSV を入力に
node .claude/scripts/gsc/auto-resubmit.mjs \
  --input .claude/state/metrics/gsc/coverage-drilldown/2026-W20/crawled-not-indexed-urls.csv \
  --dry-run
```

## 前提

- サービスアカウント鍵: リポジトリルートの `stats47-f6b5dae19196.json` または `stats47-31b18ee67144.json`
- サービスアカウントが GSC プロパティ `sc-domain:stats47.jp` の **オーナー** として登録済 (Indexing API 仕様)
- Google Cloud Console で Indexing API が有効化済
- npm パッケージ `googleapis` インストール済 (root に存在)
- 日次クォータ **200 URL/day/project** (超過時 quota エラー)

## 入出力

- 入力: `.claude/state/metrics/gsc/coverage-drilldown/{YYYY-Www}/{category}-urls.csv`
- 履歴: `.claude/state/metrics/gsc/resubmit-history.json`
  - 形式: `[{ timestamp, url, status: "success"|"error", coverageState, error? }]`
- ログ: stdout (再送信成功 / 失敗 / 残 quota)

## 検証方法

1. dry-run 必須: `node .claude/scripts/gsc/auto-resubmit.mjs --dry-run`
2. 候補 URL 数と quota 残数を確認
3. `--execute --max 5` で小規模テスト送信
4. 数日後に `node .claude/scripts/gsc/url-inspection-daily.cjs --limit 5` で `lastCrawlTime` 更新確認 (`/Users/minamidaisuke/stats47/.claude/scripts/gsc/url-inspection-daily.cjs` を参照)
5. 効果判定は `evidence-based-judgment.md` のチェックリストに従う

## 関連

- 認証実装の参考: `.claude/scripts/gsc/url-inspection-daily.cjs`
- 既存類似スキル: `.claude/skills/analytics/indexing-api-submit/SKILL.md` (手動 1 件 / batch 用、本スキルは drilldown 全件自動)
- 改善ログ記入先: `docs/05_改善ログ/gsc.md` + `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md`
