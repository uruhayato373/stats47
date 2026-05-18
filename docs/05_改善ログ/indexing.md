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

## [INDEXING-AUTO-01] Indexing API による問題 URL の自動再送信 (Phase 2 着手予定)

- **status**: pending (W23-W24 実装予定、Phase 2)
- **tier**: 1
- **target_metric**: gsc-index-coverage
- **owner**: claude
- **deployed_at**: (未着手)
- **due**: 2026-06-14 (W24)
- **related_plan**: `/Users/minamidaisuke/.claude/plans/docs-gsc-ga4-seo-todo-g-rosy-hamming.md` Phase 2

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

## [INDEXING-DRILLDOWN-01] Coverage Drilldown 監視 + Indexing API URL_DELETED (T0-DECAY-01 継続)

- **status**: in-progress
- **tier**: 1
- **target_metric**: gsc-index-coverage
- **owner**: claude
- **deployed_at**: 2026-04-21
- **due**: 2026-06-14 (W24)

### 背景

GSC で「クロール済み - インデックス未登録」16.6k 件を削減するため、`gsc.md` の T0-DECAY-01 として施策を進めている。詳細は `gsc.md` の "GSC 未登録 1.6 万件打開" section を参照。

このファイル (indexing.md) は新設のため、既存の T0-DECAY-01 section の本体は `gsc.md` に残し、ここではポインタのみとする。次回 effect 判定時に本ファイルへ完全移行する。

### 参照

- `docs/05_改善ログ/gsc.md` の "GSC 未登録 1.6 万件打開 — 観測短サイクル化 + sitemap 第 2 段階削減 (W17-W18)" section
- `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md` の T0-DECAY-01 詳細

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
