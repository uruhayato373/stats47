---
name: D1 sync の落とし穴（diff-d1 バグ・id 競合・REST API 変数上限）
description: ローカル D1 → リモート D1 同期時に判明したバグ集と復旧手順。diff-d1 が chunk 失敗を握りつぶす、ranking_data.id 採番ズレ、D1 REST API の SQL 変数上限が低いなど。
type: project
originSessionId: c8f7304c-235d-4e27-ad61-b3075b33f5a5
---
# D1 sync の落とし穴

2026-04-25 に `/diff-d1 --execute` で本番 D1 を同期した際に複数の不具合と復旧パターンが判明。再発時の調査時間を大幅に短縮するための記録。

## 1. /diff-d1 --execute は chunk 失敗を握りつぶす ⚠️

**Why:** REST API の bulk push で chunk が失敗しても「Pushed N rows」と成功風に表示される。今回 `ranking_data.total-population` が **500 行欠損**（ローカル 15,763 / リモート 15,263）、`ranking_tags` も full sync で **923 行欠損**（3,638 → 2,715）した。原因は (a) ID UNIQUE 制約違反による部分失敗、(b) full sync の DELETE → INSERT の途中失敗。

**How to apply:** `/diff-d1 --execute` 実行後は **必ず行数検証** する。
```bash
# 影響を受けたテーブル / キーで local vs remote の COUNT(*) を比較
# 特に ranking_data はキー単位 (WHERE category_code=...) でも確認
```
失敗 chunk があれば、対象キーを特定して下記 §3 の復旧手順を実行する。修正候補としてスクリプト側（`packages/database/scripts/d1-diff-report.ts:368-490`）に「失敗時に exit code 1」or「リトライ」を入れるべき。

## 2. ranking_data.id はローカル/リモートで採番がズレている ⚠️

**Why:** `ranking_data.id` には PRIMARY KEY (UNIQUE) 制約がある。ローカルとリモートで自動採番のタイミング/順序が違うため、ローカルの id をそのまま INSERT すると「他 category の行と id 衝突」して `UNIQUE constraint failed: ranking_data.id` で失敗する。今回 `total-population` の id 範囲 4,901,625〜5,310,790 のうち 500 個が他 category と被って失敗。

**How to apply:** ranking_data を REST API で push する時は **必ずリモート MAX(id)+1 からリナンバリング** する。`sync-remote-d1` スキルの 3a 手順にも明記されているが、`/diff-d1 --execute` の単一キー push パス（`d1-diff-report.ts:344` 周辺の `executePushKey`）はリナンバリングしていない可能性が高い。要修正。

## 3. 復旧手順テンプレ（ranking_data の単一キー再 sync）

```javascript
// /tmp/resync-<key>.cjs として作る（NODE_PATH 不要のためフルパス require）
const Database = require("/Users/minamidaisuke/stats47/node_modules/better-sqlite3");
// 1. リモート DELETE FROM ranking_data WHERE category_code=?
// 2. SELECT MAX(id) FROM ranking_data → startId = max+1
// 3. ローカル全行を取得し r.id = startId + i にリナンバリング
// 4. 500 行/chunk × 5 並列で REST API に POST
// 5. COUNT(*) で検証
```
正常動作した完全版は git log の本コミット直前のセッションを参照（一時ファイルなので削除済み）。

## 4. D1 REST API の SQL 変数上限は低い

**Why:** parameterized クエリの `?` 数の上限が低く、`INSERT INTO t (13 cols) VALUES (?,?,…),(?,?,…)…` を 50 行で送ったら 650 変数で `too many SQL variables at offset 368: SQLITE_ERROR` エラー。

**How to apply:** 既存の `packages/database/scripts/d1-rest-api.ts` と同じく **値を直接 SQL リテラルとして埋め込む** こと（parameterized は使わない）。エスケープは `'` → `''`、改行は `' || char(10) || '` 連結、NULL/数値はリテラル。500 行/chunk × 5 並列が安定動作。

## 5. ranking_items の偽差分（複合主キー対応漏れ）

**Why:** `ranking_items` の PRIMARY KEY は `(ranking_key, area_type)` の複合キーだが、`/diff-d1` は `ranking_key` 単位で `MAX(updated_at)` を比較するため、片方の area_type だけ更新するとキー全体が「ローカルが新しい」判定になる。push 後も同じ判定が出続けるが、サンプル比較すると実データは一致。

**How to apply:** `ranking_items` で 100 件以上の差分が出ても焦らない。サンプルキーで `(ranking_key, area_type, updated_at, ...)` を local/remote で比較し、一致していれば偽陽性。本質修正は diff スクリプトを複合キー対応にすること。

## 6. 同期前に Time Travel ブックマークを必ず取得

```bash
cd apps/web && npx wrangler d1 time-travel info stats47_static --env production
# `The current bookmark is '...'` を控える
# 失敗時の復旧: npx wrangler d1 time-travel restore stats47_static --env production --bookmark <id>
```

スキル `sync-remote-d1` の Step 0 にあるが、`/diff-d1 --execute` 実行時にも徹底すること。
