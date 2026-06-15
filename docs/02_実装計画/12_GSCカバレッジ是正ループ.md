---
type: implementation-plan
date: 2026-06-16
status: active
tags: [gsc, indexing, coverage, remediation, seo]
---

# GSC カバレッジ是正ループ (404 / soft404 / 5xx を計画的に順次解消する仕組み)

GSC「ページ」インデックスカバレッジの問題 (見つからない404・ソフト404・サーバーエラー5xx・クロール済未登録) を、
**週次で少しずつ・実証ベースで是正**する閉ループ。ブログ品質是正ループ ([`06_ブログ品質是正ループ.md`](./06_ブログ品質是正ループ.md)) と同型。
「次に何を直すか・何をやったか・効いたか」を **1 つの状態付きキュー** (`coverage-remediation-queue.json`) で追える。

> **本ファイルが運用ループの正典。** 実行は `/gsc-coverage-remediation` スキル、判定ルールは
> [`evidence-based-judgment.md`](../../.claude/rules/evidence-based-judgment.md)、export 手順は
> `USER_EXPORT_GUIDE.md`。

## クイックスタート

```bash
# 1. GSC UI から export (インデックス作成 > ページ → 各カテゴリ右上エクスポート) → ~/Downloads
# 2. 取り込み (cp932 zip を正規化)
python3 .claude/scripts/gsc/ingest-gsc-export.py
# 3. キュー構築 (本番 HTTP を Googlebot UA で実測 → A/B 分類 → SSOT 更新)
node .claude/scripts/gsc/build-coverage-queue.mjs
# 4. 次にやる actionable を確認
node .claude/scripts/gsc/build-coverage-queue.mjs --next 20
cat .claude/state/gsc/LATEST.md
```

## 設計背景 — なぜこのループが要るか (2026-06-16 診断)

GSC「ページ」レポートで未登録が ~17,900 件 (登録済 ~2,600) ある。だが内訳を実 URL で精査すると **大半は是正対象ではない**:

| GSC カテゴリ | 件数 (2026-06-16) | 実態 | 扱い |
|---|---:|---|---|
| 見つからない(404) | 8,378 | サンプル1000 の ~70% が `/areas/{code}/{カテゴリ}` (廃止済) + 410(GSC は404に束ねる) + `/tmp/*` `/.local/*` 等の旧内部パス | **意図的・放置** (0 にできない) |
| クロール済-未登録 | 2,937 | Google 判断。live は再送信余地 | 一部 actionable |
| robots ブロック | 2,651 | `/ranking/*/opengraph-image`(535) + `/api/*/download` (CSV) | **意図的・正常** |
| noindex 除外 | 1,434 | thin metric 等 | **意図的** |
| リダイレクト | 1,277 | 旧カテゴリ slug ルートの 301 | **意図的・正常** (エラーではない) |
| 検出-未登録 | 414 | クロール待ち | 放置 |
| ソフト404 | 383 | 旧 dashboard/category ルートは既に 410 化済 (stale)。live は ranking/blog | **一部 actionable** |
| サーバーエラー5xx | 200 | `/correlation/*`(115) は現在 410、`/ranking/*`(58) は現在 200 = **発生源修正済** | **ほぼ解消済** |

**結論: 8,378 や 17,900 を 0 にするのは不可能で目標でもない。** Google は 410 も「404」に束ね、再クロールは週〜月単位。
**実際に直すべきは「サイトが参照しているのに 404/soft404/5xx = 生きてるのに誤登録された URL」だけ**。2026-06-16 の本番実測では:

- **resubmit (85件)**: 404/5xx だが現在 200 = 生きている → Indexing API 再送信で再クロール促進 (例: `ranking/income-per-capita`・`birthrate-total`)。`project_ranking_publish_pipeline_gap` の解消分を含む。
- **content-check (97件)**: soft404 だが現在 200 = Google が薄いと判定 → 薄さ/描画確認。十分なら resubmit、thin なら補強 or noindex。
- **fix-5xx (1件)**: 現在も 5xx = 実バグ (`/opengraph-image?…` 500)。
- **verify-intent (7件)**: 現在も 404 の旧内部パス (`/tmp/*.json`・`/.local/d1`・`/docs/estat-api` 等)。死亡が正 → 放置確定。

トレンド: 登録済 1,371(5/05底)→**2,604**(6/12) と回復、未登録ピーク 20,239(6/05)→**17,893**(6/12) と減少。既存 indexing 施策は効いている。

## ループ全体図

```
[1] ユーザー GSC UI export (週次10分)            ──▶ ~/Downloads に zip (cp932)
[2] ingest-gsc-export.py                          ──▶ coverage-drilldown/<週>/<category>-drilldown.csv + category-totals.json + coverage-trend.csv
[3] build-coverage-queue.mjs (本番HTTP実測でA/B)  ──▶ coverage-remediation-queue.json(SSOT) + LATEST.md + coverage-totals-history.csv + coverage-live-resubmit-urls.csv(curated)
[4] 是正  resubmit→CI送信 / content-check→gsc-analyst / fix-5xx→PR / verify-intent→放置確定
[5] 記録  improvement-log[COVERAGE-LOOP-01] + 改善バックログ status + build --mark-done
[6] 経過観測  次週 export→ingest+build で件数減・登録済増・indexed化 を totals-history で追う
```
①〜⑥ が閉じ、「次に何を直すか」「何件やったか」「効いたか」が 1 キューで追える。

## A/B 分類ロジック (build-coverage-queue.mjs)

actionable カテゴリ (404/soft404/5xx/crawled/discovered) の URL を本番実測し、現在のステータスで分類:

| 現在 HTTP | 元カテゴリ | verdict | action |
|---|---|---|---|
| 200 | soft404 | live-soft404 | **content-check** |
| 200 | 404/5xx/crawled/discovered | live-misflagged | **resubmit** |
| 410 | * | now-gone | none (放置・発生源修正済) |
| 3xx | * | now-redirect | none (放置) |
| 5xx | * | still-5xx | **fix-5xx** (最優先) |
| 404 | * | still-404 | **verify-intent** (旧URL/公開漏れ判別) |
| 0 | * | recheck | recheck |

意図的カテゴリ (redirect/robots/noindex/alt-canonical/duplicate) は実測せず `resolved-by-design` で放置。

## 真実源とファイル

| 役割 | パス |
|---|---|
| **状態付きキュー (SSOT・機械)** | `.claude/state/gsc/coverage-remediation-queue.json` |
| 人間向け要約 | `.claude/state/gsc/LATEST.md` |
| 経過観測 (週次カテゴリ件数) | `.claude/state/gsc/coverage-totals-history.csv` |
| 取り込み済 drilldown / 集計 / 推移 | `.claude/state/metrics/gsc/coverage-drilldown/<週>/` |
| curated 再送信入力 (auto-resubmit が読む) | `…/coverage-drilldown/<週>/coverage-live-resubmit-urls.csv` |
| agent 用詳細ログ | `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md` `[COVERAGE-LOOP-01]` |
| TODO 真実源 | `docs/02_実装計画/03_改善バックログ.md` `COVERAGE-LOOP-01` |

## 命名規約 (auto-resubmit との安全な統合)

`auto-resubmit.mjs` は `coverage-drilldown/**/*-urls.csv` を**全て未INDEXED**として Indexing API 送信する。
GSC UI export には死んだ URL (404=8,378) が含まれるため、そのまま `-urls.csv` で置くと **quota(200/日) を死んだ URL に浪費**する。

- **生 drilldown は `<category>-drilldown.csv`** (auto-resubmit は拾わない)。
- build が本番実測で live を選別し **`coverage-live-resubmit-urls.csv`** (= `-urls.csv`、curated) に書き出す → これだけ送信される。
- `content-check` (soft404) は **resubmit に格上げするまで送らない** (薄いまま再送信すると再フラグされるため)。

## cadence

- 週次: `/weekly-review` 前にユーザー export → `/gsc-coverage-remediation` で取り込み・是正・記録。
- 自動 (CI・既存): `gsc-url-inspection-daily.yml` (個別URL状態) + `gsc-auto-resubmit-daily.yml` (curated 送信) が毎日稼働。
  手動アームは「UI export でしか取れない総件数・未把握URL」を補完する (Search Console API は自サイト視点のみで未把握URLを列挙不能)。

## 効果判定 (実証必須)

[`evidence-based-judgment.md`](../../.claude/rules/evidence-based-judgment.md) に従う。effect/* を付ける前に:
- 再送信した URL が**次週 indexed 化したか** (URL Inspection API / GSC) を実測。
- `coverage-totals-history.csv` で **404・soft404 総件数の減少**と**登録済の増加**を確認。
- 想定の 80% 未満なら未達理由の仮説と次の検証コマンドを書く。
推測で「浸透待ち」と放置しない (期日と検証コマンドをセットで)。

## 関連
- 実行スキル: `.claude/skills/analytics/gsc-coverage-remediation/SKILL.md`
- 同型ループ: [`06_ブログ品質是正ループ.md`](./06_ブログ品質是正ループ.md)
- agent: `gsc-analyst` (実行) / `improvement-triage` (status 更新)
- 既存インフラ: `gsc-url-inspection-daily.yml` / `gsc-auto-resubmit-daily.yml` / `auto-resubmit.mjs`
