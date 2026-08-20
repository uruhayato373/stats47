---
name: feedback-improvement-log-as-source-of-truth
description: 改善施策 TODO を一元化した経緯。現行の真実源は .claude/todo/improvements.md
metadata: 
  node_type: memory
  type: feedback
  originSessionId: dfcc7188-5af9-45c9-a74d-624210d4acd3
---

PR #308 時点では改善施策 TODO を旧改善ログへ集約した。その後の再整理により、現行の真実源は **`.claude/todo/improvements.md`**、agent 用の詳細履歴は `.claude/skills/analytics/*/reference/improvement-log.md` となった。

**Why**: 2026-05 時点で TODO が 4 箇所 (週次計画 / improvement-log / docs/50_Issues / 記事内 TODO 記号) に散在し、判定期日が来ても次アクションが流れず pending 施策が 8 件以上滞留していた。施策の status / tier / 期日を 1 箇所で管理する必要があった。

**How to apply**:
- 新規施策は `.claude/todo/improvements.md` に一意な ID で追加し、該当 metric の詳細ログへ参照を置く
- section frontmatter は `- **status**:` `- **tier**:` `- **target_metric**:` `- **deployed_at**:` `- **due**:` `- **owner**:` `- **verification_command**:` `- **related_pr**:` のリスト形式
- metric ごとの詳細履歴は `.claude/skills/analytics/*/reference/improvement-log.md`
- `.claude/todo/weekly.md` は改善ログから抽出した「当週ビュー」 (`/weekly-plan` が上書き)
- `docs/50_Issues/{feature,automation,ui-improvements}-backlog.md` は **未着手アイデア倉庫** (Tier 未確定段階)。Tier 確定したら改善ログに移行・section 削除
- GitHub Issues は `enhancement`/`bug`/`auto-generated` のみ (PR で close されるチケットと日次アラート)
- 効果判定 (effect/full / effect/partial / effect/none / effect/adverse) は **実証ベース判定ルール** (`.claude/rules/evidence-based-judgment.md`) に従い、検証コマンド実測値必須

**例外**:
- 検証コマンド・仮説などの詳細ログは `.claude/skills/analytics/<metric>-improvement/reference/improvement-log.md` (2 層構造の下層、agent 用)
- どちらも append-only。過去判定の改竄禁止

**関連**:
- 現行バックログ: `.claude/todo/improvements.md`（旧 SEO TODO 統合計画は Git 履歴）
- scan tool: [[reference-scan-pending-improvements]]
- プロジェクト記録: [[project-seo-todo-unify-phase-1]]
- 関連ルール: `.claude/rules/data-storage.md` (2 層構造定義), `.claude/rules/docs-vs-issues.md` (docs vs Issues 判定)
