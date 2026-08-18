---
name: project-seo-todo-unify-phase-1
description: "W21-W26 SEO 向上プラン Phase 1 + Phase 2 を 2026-05-18 に連続 deployed (Phase 2 は本来 W23-W24 予定を agent 並列で前倒し)。Phase 3 は triggers.json に Routine entry を disabled 追加済"
metadata: 
  node_type: memory
  type: project
  originSessionId: dfcc7188-5af9-45c9-a74d-624210d4acd3
---

W21-W26 にかけての SEO 向上 × TODO 一元化 × 自動化拡張プラン (3 Phase 構成) のうち **Phase 1 + Phase 2 が 2026-05-18 に連続 deployed (Phase 2 は本来 W23-W24 予定を agent 並列で前倒し)**。

**Why**: pending 施策が 8 件以上滞留し、TODO が 4 箇所 (週次計画 / improvement-log / docs/50_Issues / 記事内 TODO 記号) に散在していたため、判定期日が来ても次アクションが流れない状態を解消する必要があった。

**How to apply**:
- 現行の TODO 真実源は **`.claude/todo/04_改善バックログ.md`**。metric 別の agent 用詳細は `.claude/skills/analytics/*/reference/improvement-log.md`
- 旧 SEO TODO 統合計画は完了後に削除済み。必要な履歴は Git 履歴で参照する
- 元 plan ファイル: `~/.claude/plans/docs-gsc-ga4-seo-todo-g-rosy-hamming.md` (更新時は両方同期)

**Phase 1 で deployed (✅)**:
- 3 metric 新設: `docs/05_改善ログ/{content,indexing,ga4}.md`
- scan-pending-improvements.mjs ([[reference-scan-pending-improvements]] 参照)
- `.github/workflows/improvement-log-reminder-weekly.yml` (日曜 22:00 JST、`[Improvement Triage] YYYY-Www` Issue 起票)
- `weekly-plan/SKILL.md` Agent D 改修 (改善ログ自動抽出 + 前週残転載)
- `ga4-improvement/SKILL.md` observe に raw/clean/pollution 3 系統併記指示
- automation-backlog #285/#288/#290 に `[in-progress]` マーク、#289 を indexing.md に移行

**Phase 2 で deployed (✅ 2026-05-18 前倒し)**:
- `/draft-from-trend` skill (`.claude/skills/blog/draft-from-trend/SKILL.md`、orchestrator)
- `/triage-improvement-log` skill + `.claude/scripts/lib/triage-matrix.mjs` (markdown/csv/matrix 3 モード)
- `/auto-resubmit-url` skill + `.claude/scripts/gsc/auto-resubmit.mjs` (Indexing API、--dry-run default、quota 200/day)
- `.claude/scripts/blog/generate-article-charts.mjs` + `.github/workflows/generate-article-charts.yml` (PR trigger SVG validate)
- 注: draft-from-trend が前提とする `fetch-article-data` SKILL.md は未実装、orchestrator は将来実装を想定して記述

**Phase 3 (W25-W26) 残作業**:
- triggers.json に `trig_seo_phase3_trend_pipeline` 追加済 (`enabled: false`)、billing 設定後に W25 で有効化
- CTR / CWV の半自動改善 PR 起票 (未着手)

**KPI (W26 = 2026-06-28 目標)**:
- Indexing 未登録: 10.8k → 1.4k (-87%) by W24
- CWV LCP mobile: 5-10s → < 3.5s by W23
- GSC CTR: 2.50% → 3.8% by W25
- 新規公開記事: 12 本 (内トレンド 4 本) by W26

**W22 (2026-05-25-31) 動作検証宿題**（`.claude/skills/analytics/ga4-improvement/reference/improvement-log.md` の GA4-CLEAN-01 残作業 #3）:
- 自動 snapshot で `overview-clean.csv` / `channels-clean.csv` / `pollution-summary.csv` 生成確認
- W20 6d 想定値 (sessions 911, engaged 513) と整合確認
