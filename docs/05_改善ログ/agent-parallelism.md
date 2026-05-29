---
type: improvement-log
target_metric: agent-parallelism
date: 2026-05-28
status: effect/full
tier: 1
tags: [agent, phase-5, parallel-verification]
---

# Agent 並行運用検証ログ (Phase 5)

`.claude/agents/` の Tier 0-7 細分化 (commit `13105c23`) 後、新 18 agent + 既存 8 agent (うち 2 体は Phase 6.7 で削除済) の並列起動で write 衝突が起きないか実証する。`.claude/agents/README.md` の「並行衝突回避マトリクス」に記載された file boundary が実機で守られるか確認。

## [AGENT-PARA-01] Session 5-3: gsc-analyst + improvement-triage 並列 read/append

- **デプロイ日**: 2026-05-28
- **想定効果**: 並列起動時に `.claude/state/metrics/gsc/` と `docs/05_改善ログ/` への write が衝突しない (boundary 分離) [根拠: README L92]
- **検証コマンド**: 同一 message 内で 2 つの Agent tool 並列起動 (gsc-analyst + improvement-triage)
- **実測**:
  - gsc-analyst write: `.claude/state/metrics/gsc/_phase5-3-test.txt` (50 bytes, mtime 07:07)
  - improvement-triage write: `docs/05_改善ログ/_phase5-3-test.md` (57 bytes, mtime 07:07)
  - 両 agent から衝突報告なし
- **判定**: effect/full [根拠: 同秒並列 write 成功、boundary 違反なし]
- **未確定 / 仮説**: なし

## [AGENT-PARA-02] Session 5-1 + 5-2: article-writer + data-ingester 並列 write (異 subpath)

- **デプロイ日**: 2026-05-28
- **想定効果**: `.local/r2/app/blog/` と `.local/r2/app/stats/` の異 subpath 並列 write 成功 [根拠: README L89-90]
- **検証コマンド**: 同一 message 内で 2 つの Agent tool 並列起動 (article-writer + data-ingester、ともに test marker のみ書込)
- **実測**:
  - article-writer write: `.local/r2/app/blog/test-phase5-1/marker.txt` (68 bytes, mtime 07:08)
  - data-ingester write: `.local/r2/app/stats/test-phase5-2/marker.txt` (66 bytes, mtime 07:08)
  - 両 agent から衝突報告なし
- **判定**: effect/full [根拠: 同秒並列 write 成功、異 subpath で boundary 違反なし]
- **未確定 / 仮説**:
  - [仮説] 同一 slug への article-writer × N 並列起動は frontmatter `slug:` 衝突を起こす可能性。検証コマンド: 同 slug 引数で 2 並列起動して `git diff` で frontmatter 確認。検証期日: Session B 完了後

## 検証範囲外 (Phase 5 では実走せず別 issue)

- 同 D1 write 並列 (`data-ingester` × 2 同 metric) — SQLITE_BUSY リスク既知、README L96 で禁則化済
- 同 slug への article-writer × N 並列 — 上記 [仮説] 参照、要別検証
- 本格的記事生成 (article-writer の `/draft-from-trend` フル実行) — 5-15 分の所要時間ゆえ本検証では skip

## [AGENT-REMAP-01] Session B: 縮退 agent への primary_agent 参照を精査・移動 (4 件)

- **デプロイ日**: 2026-05-28
- **想定効果**: 縮退 agent (note-manager / sns-renderer / blog-editor / seo-auditor) への primary 参照を実態に合わせて整理 [根拠: README「縮退記述」の責務分担]
- **検証コマンド**: `node .claude/scripts/lib/update-skill-primary-agent.cjs` + `grep -rl "primary_agent: <縮退 agent>" .claude/skills/`
- **実測**:
  - 28 件中 4 件のみ移動 (fetch-note-metrics → sns-metrics-sync, sns-weekly-report → sns-metrics-sync, auto-brushup-batch → article-writer, weekly-review → strategy-advisor)
  - 残り 24 件は責務上正しいため維持 (strategy-advisor 10 / note-manager 7 / sns-renderer 5 / blog-editor 2)
  - seo-auditor は 0 件に縮退完了
- **判定**: effect/full [根拠: 設計 (README L114-126 縮退記述) と実装の一致を達成]
- **未確定 / 仮説**: なし

## [AGENT-L3-CONSOLIDATE-01] L3-1 Cluster 2/3/4/5/6 KEEP-SKIP 判定

L3-1 統合は Cluster 1 (blog-review, 既存 commit `649dd0c4` 経由) + Cluster 7 (brushup-blog, commit `8a9c5bc3`) で完結。残り Cluster 2/3/4/5/6 はすべて KEEP-SKIP 判定が妥当 (Phase 6.7 で 5 は消滅、6 は data-sqlite-ssot 中核で KEEP-SKIP 確定済)。Cluster 2/3/4 を本セッションで再評価:

- **Cluster 2 (chart-generation)**: `generate-article-charts` (498L blog) と `generate-note-charts` (140L note) を `--target blog|note` で統合する案を検証。データソース (`data/` vs `_data/` or D1) / 出力形式 (SVG 埋め込み vs SVG+PNG ファイル) / SVG 規約 (詳細 vs 外部参照) / 同梱スクリプト (note のみ scatter.js / cover-template.js / svg-to-png.js) すべて異なるため、`--target` 1 引数では吸収不能。8 通り (`--target` × `--source` × `--output`) の分岐が必要となり、保守性が現状の責務分離より低下。 **KEEP-SKIP**。
- **Cluster 3 (SNS post-captions)**: `post-sns-captions` (127L) が既に domain dispatch 役 (`ranking|compare|correlation` で分岐) を担当。`post-bar-chart-race-captions` (168L) と `post-compare-captions` (257L) は specialized で、独自データ構造 (config.json vs data.json) とテンプレート (versus / question) を持つ。`--domain` 統合は形式的で行数削減効果が小さく、合計 552L → 600L+ 巨大化を招く。dispatch 役 + specialized 役の現状責務分離が綺麗。 **KEEP-SKIP**。
- **Cluster 4 (plan-blog-*)**: 4 つの企画 skill (trends 175L / articles 265L / affiliate 225L / from-gsc 135L、合計 800L) は **データソースが完全に異なる** (discover-trends / e-Stat+DB / AFFILIATE_LINKS+DB / GSC snapshots)。統合すると Phase 1 (データ取得) が 4 分岐 (450L)、Phase 2-3 (企画生成) のみ共通化可で削減効果 -150L (-19%) のみ。1 skill が 650L+ に肥大化し、シンプルさが損なわれる。primary_agent は既に 4 件すべて `blog-planner` で責務統一済。 **KEEP-SKIP**。
- **Cluster 5 (db-populate)**: Phase 6.7 cleanup で対象 skill (populate-all-rankings / populate-city-rankings / populate-component-data) のうち 2 つが削除済。残った populate-component-data は単独で完結しているため統合対象が消滅。 **既に消滅**。
- **Cluster 6 (db-sync)**: sync-snapshots (orchestration) / sync-articles (transaction) / export-d1-to-remotion-static (export) は本質的に異なるパラダイム。data-sqlite-ssot.md 中核機構で統合すると保守性低下。 **KEEP-SKIP 確定済** (task ledger #13)。

判定根拠: CLAUDE.md 行動原則「2. シンプル最優先」「3. 外科的変更」に基づき、形式的な skill 数削減よりも責務分離の維持を優先。L3-1 統合は Cluster 1/7 で必要十分。

## 関連

- 親 plan: `~/.claude/plans/goal-stateful-stallman.md` (Phase 5 仕様)
- agent file boundary 仕様: `.claude/agents/README.md` (並行衝突回避マトリクス)
- 実証ベース判定ルール: `.claude/rules/evidence-based-judgment.md`
