---
name: feedback-improvement-log-as-source-of-truth
description: TODO 真実源は docs/05_改善ログ/<metric>.md。週次計画と docs/50_Issues/ は派生ビュー
metadata: 
  node_type: memory
  type: feedback
  originSessionId: dfcc7188-5af9-45c9-a74d-624210d4acd3
---

stats47 の **改善施策 TODO の真実源は `docs/05_改善ログ/<metric>.md`** (PR #308 で確定)。

**Why**: 2026-05 時点で TODO が 4 箇所 (週次計画 / improvement-log / docs/50_Issues / 記事内 TODO 記号) に散在し、判定期日が来ても次アクションが流れず pending 施策が 8 件以上滞留していた。施策の status / tier / 期日を 1 箇所で管理する必要があった。

**How to apply**:
- 新規施策を提案するときは、**該当 metric の改善ログに section 追加**を最初に提案する (Issue ではない、週次計画でもない)
- section frontmatter は `- **status**:` `- **tier**:` `- **target_metric**:` `- **deployed_at**:` `- **due**:` `- **owner**:` `- **verification_command**:` `- **related_pr**:` のリスト形式
- 既存 5 metric (`gsc / ga4 / psi / adsense / cloudflare-cost`) + 新設 3 metric (`content / indexing / ga4`) の計 7 metric。INDEX は `docs/05_改善ログ/INDEX.md`
- `docs/03_週次運用/週次計画/YYYY-Www.md` は改善ログから抽出した「当週ビュー」 (`/weekly-plan` が自動生成)
- `docs/50_Issues/{feature,automation,ui-improvements}-backlog.md` は **未着手アイデア倉庫** (Tier 未確定段階)。Tier 確定したら改善ログに移行・section 削除
- GitHub Issues は `enhancement`/`bug`/`auto-generated` のみ (PR で close されるチケットと日次アラート)
- 効果判定 (effect/full / effect/partial / effect/none / effect/adverse) は **実証ベース判定ルール** (`.claude/rules/evidence-based-judgment.md`) に従い、検証コマンド実測値必須

**例外**:
- 検証コマンド・仮説などの詳細ログは `.claude/skills/analytics/<metric>-improvement/reference/improvement-log.md` (2 層構造の下層、agent 用)
- どちらも append-only。過去判定の改竄禁止

**関連**:
- 全体プラン: `docs/02_実装計画/seo-todo-unify-phase-1-3.md`
- scan tool: [[reference-scan-pending-improvements]]
- プロジェクト記録: [[project-seo-todo-unify-phase-1]]
- 関連ルール: `.claude/rules/data-storage.md` (2 層構造定義), `.claude/rules/docs-vs-issues.md` (docs vs Issues 判定)
