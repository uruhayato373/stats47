---
type: improvement-log
metric: indexing
created: 2026-05-18
updated: 2026-05-18
---

# Indexing 改善ログ

Coverage Drilldown / sitemap / Indexing API のインデックスカバレッジ施策。施策ベースで append-only。新しい施策は最新を上に追加。判定が変わったら section 末尾に追記。

このログに記録する対象:
- Coverage Drilldown の未登録 URL 削減 (現状 16.6k → 1.4k 目標)
- sitemap.xml の構造変更・分割
- Indexing API による URL_DELETED / URL_UPDATED 送信
- middleware で 410 化・noindex 付与による削除

このログに記録しない対象:
- ページ単位の SEO 改修 (CTR・タイトル) → `gsc.md` の BLOG-CTR-* 系
- robots.txt / OGP 等のクロール経路 → `gsc.md`

## [INDEXING-AUTO-01] Indexing API による問題 URL の自動再送信 (Phase 2 で実装)

- **status**: in-progress
- **tier**: 1
- **target_metric**: gsc-index-coverage
- **owner**: claude
- **deployed_at**: 2026-05-18
- **due**: 2026-06-14
- **related_plan**: `docs/02_実装計画/seo-todo-unify-phase-1-3.md` Phase 2
- **verification_command**: `node .claude/scripts/gsc/auto-resubmit.mjs --dry-run`

### 進捗 (2026-05-18)

Phase 2 前倒し実装で `.claude/skills/analytics/auto-resubmit-url/SKILL.md` と `.claude/scripts/gsc/auto-resubmit.mjs` を作成。dry-run で coverage-drilldown CSV → 候補 URL 抽出 + quota 表示 + 7 日以内 dedup を動作確認済。

残作業:
- `--execute` 本番送信 (人手承認後、初回は --max 5 程度で検証)
- 効果測定: 送信 1 週後に `url-inspection-daily.cjs` で coverageState=INDEXED 件数変化を確認
- 想定: drilldown 未登録 10.8k → 1.4k 削減 (-87%) のうち本施策の寄与は 20-30%

### 背景

`[PSI Alert]` で 404 検出 + GSC URL Inspection で `crawlState != INDEXED` の URL を、現状は `/gsc-improvement` 実行時に人間が判断して Indexing API で再送信している。GSC が反映するまで時間がかかるため、検出から再送信までを自動化する。

automation-backlog #289 (`docs/50_Issues/automation-backlog.md` から移行)。

### 施策

1. 既存 `.github/workflows/gsc-url-inspection-daily.yml` の末尾に「自動再送信」ステップ追加
2. 新規スクリプト `.claude/scripts/gsc/auto-resubmit.mjs`
   - 当日の URL Inspection 結果から `coverageState != SUBMITTED_AND_INDEXED` の URL を抽出
   - `.claude/state/metrics/gsc/resubmit-history.json` で「直近 7 日以内に再送信したか」確認
   - 再送信していなければ Indexing API (`URL_UPDATED` event) を実行
   - 結果を resubmit-history.json に追記
3. quota 制限: 200 URLs/day（公式上限）— `.claude/skills/analytics/gsc-improvement/reference/budgets.json` に閾値追加
4. 新規 skill `.claude/skills/analytics/auto-resubmit-url/SKILL.md` で手動実行も可能に

### 想定効果

- 想定: 未登録 URL の自動再送信で、Indexing 反映の lead time を 14-21 日 → 3-7 日に短縮
- 根拠: Indexing API の公式仕様 (developers.google.com/search/apis/indexing-api、アクセス日 2026-05-18) では「再クロール優先度を上げる」と記載。汎用ページへの効果は限定的 (公式推奨はジョブポスト・ライブ動画) なので、Coverage Drilldown 全体 -87% 目標のうち本施策の寄与は 20-30% 見込み

### 検証

- **検証コマンド**:
  ```
  node /Users/minamidaisuke/stats47/.claude/scripts/gsc/auto-resubmit.mjs --dry-run
  # → quota 残数 + 当日送信予定 URL 数を出力
  node /Users/minamidaisuke/stats47/.claude/scripts/gsc/url-inspection-daily.cjs --limit 1500
  # → coverageState=INDEXED 件数を週次集計
  ```
- **検証期日**: 2026-06-14 (W24, Phase 2 完了時)
- **期日後の判定**:
  - Coverage Drilldown 未登録 ≤ 1.4k → effect/full
  - 1.4k-5k → effect/partial
  - > 5k → effect/none。次の検証: 「sitemap 第 3 段階削減」「個別 URL の noindex 付与」に切り替え

### 移行元

`docs/50_Issues/automation-backlog.md` #289 (本施策へ移行・元 section 削除)。

## [INDEXING-DRILLDOWN-01] Coverage Drilldown 週次記録 + 収束観測 + Indexing API URL_DELETED (旧 T0-DECAY-01)

- **status**: in-progress
- **tier**: 1
- **target_metric**: gsc-index-coverage
- **owner**: claude
- **deployed_at**: 2026-04-21
- **due**: 2026-06-09 (W24 FINAL 判定)
- **related_issue**: #43 (closed)
- **migrated_from**: `docs/05_改善ログ/gsc.md` T0-DECAY-01 (2026-05-18 移行)

### 目的

既存の 404/5xx 対策（middleware 410 化群）が Google の再クロールを経て実際に GSC 報告値を減少させるかを **週次で実測** し、予測カーブとの乖離を検知する。

### 背景

2026-04-21 時点の curl 検証で、以下のパターンは本番で正しく **410** を返している:
- `/blog/tags/*`, `/dashboard/*`, `/areas/{invalid}`, `/areas/{prefCode}/cities/*`, `/themes/{unknown}`, `/ranking/{unknown}`, `/stats/*`, `/correlation/{slug}`

それでも GSC 報告値が下がらないのは **Google の再クロール遅延（1-2 週間+α）** が原因。本施策では以下で加速 + 観測する:
1. `/indexing-api-submit` スキルで `URL_DELETED` を能動送信
2. 毎週 `/gsc-improvement observe` 時に本 section へ実測値追記

関連施策 Issue (close 済):
- #16 T1-MW-01 middleware 404/410（effect/full）
- #17 T1-SRC-01 ソフト404/5xx 発生源除去（effect/partial）
- #18 T1-CRAWL-01 クロール予算回復（effect/partial）
- #21 T0-RKG-200-01-v3 未知 ranking 410（effect/pending、2026-04-17 デプロイ）
- #22 #31 #32 #34（全て effect/full）
- #36 T0-TAG-UNKNOWN-01（Phase 1 で known-tag-keys 新設）

### ターゲット指標

- [x] Index Coverage（404 / 5xx / soft-404 / crawled-not-indexed の合算）
- [x] Clicks（間接的指標、インデックス除外による影響）
- [x] Impressions

### ベースライン（2026-W17, 2026-04-21 取得）

| 指標 | W17 ベースライン | 目標 (W24) |
|---|---|---|
| 404 (見つかりませんでした) | **5,919** | ≤ 600 (-90%) |
| 5xx (サーバーエラー) | **2,041** | ≤ 200 (-90%) |
| soft-404 | **497** | ≤ 100 (-80%) |
| crawled-not-indexed | **2,322** | ≤ 500 (-80%) |
| **非インデックス合計** | **10,779** | ≤ 1,400 |

### 予測収束カーブ

Indexing API 導入（本施策開始時）＋自然再クロールを仮定:

| 週 | 404 予測 | 5xx 予測 | soft-404 予測 | crawled-not-indexed 予測 | 合計 |
|---|---|---|---|---|---|
| W17 (ベースライン) | 5,919 | 2,041 | 497 | 2,322 | 10,779 |
| W18 (-10%) | 5,327 | 1,837 | 447 | 2,090 | 9,701 |
| W19 (-30%) | 4,143 | 1,429 | 348 | 1,625 | 7,545 |
| W20 (-50%) | 2,960 | 1,021 | 249 | 1,161 | 5,391 |
| W22 (-75%) | 1,480 | 510 | 124 | 580 | 2,694 |
| W24 (-90%) | 592 | 204 | 50 | 232 | 1,078 |

**根拠**:
- Indexing API で日次 180 URL を送信 → 7 週間で約 1,260 URL（主に 404 の上位）
- 自然クロールで残り 3,500 URL 前後が W20-W24 にかけて逐次消化
- soft-404 は Google 側の再判定で W19-W21 に急減する傾向

### 運用ルール

#### 毎週の観測（`/gsc-improvement observe` 実行時に自動 + 手動追記）

1. その週の `[GSC Snapshot]` Issue で最新値を取得
2. 本 section にコメント追記:
   ```
   ## W{N} 実測 (YYYY-MM-DD)
   - 404: X (予測 Y / 差 ±Z)
   - 5xx: ...
   - 非インデックス合計: ...
   - 今週の /indexing-api-submit 送信件数: N 件
   - 乖離判定: OK / WARNING / CRITICAL
   ```

#### 乖離判定ルール

- **OK**: 予測の ±20% 以内
- **WARNING**: 予測の +20% 超過 → 送信対象 URL を見直し（drilldown の別カテゴリを追加）
- **CRITICAL**: W20 で -30% 未満 → 深層調査（新規 404 発生源の特定、sitemap の再点検）

### 想定効果値

- 非インデックス URL **10,779 → 1,400 (-87%)** を 7 週間（W17→W24）で達成
- Organic Clicks は **第二段階効果** として W22 以降に回復見込み（直接関係は弱い）

### 観測予定日

- **W18 観測**: 2026-04-28 (初回判定)
- **W20 MID 判定**: 2026-05-12 (-50% 必達)
- **W22**: 2026-05-26
- **W24 FINAL 判定**: 2026-06-09 (-90% 目標)

### 非対象

- 新規発生する 404（アプリケーションの新しいバグ）は別 section
- ブログ記事削除 or 統計データ更新に伴う意図的な URL 廃止は、本施策と独立して行う

### 関連 (連携施策)

- [INDEXING-AUTO-01] Indexing API による問題 URL の自動再送信 (Phase 2 で deployed) — 本施策の Indexing API 送信を自動化
- agent 用詳細ログ: `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md` の T0-DECAY-01 詳細

## [INDEXING-TEMPLATE] 新規施策テンプレ

新しい施策を追加するとき以下をコピーして埋める。

```markdown
## [INDEXING-XXX] タイトル (期間)

- **status**: pending | in-progress | effect/full | effect/partial | effect/none | effect/adverse | blocked
- **tier**: 1 | 2 | 3
- **target_metric**: gsc-index-coverage | sitemap-size | drilldown-not-indexed
- **owner**: claude | uruhayato373
- **deployed_at**: YYYY-MM-DD
- **due**: YYYY-MM-DD
- **related_pr**: #N

### 背景

### 施策

### 想定効果

### 検証

- **検証コマンド**:
- **検証期日**:
- **期日後の判定**:
```
