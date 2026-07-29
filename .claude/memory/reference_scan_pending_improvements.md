---
name: reference-scan-pending-improvements
description: scan-pending-improvements.mjs の使い方 (改善ログから pending 抽出する CLI、weekly-plan と triage workflow が共用)
metadata: 
  node_type: memory
  type: reference
  originSessionId: dfcc7188-5af9-45c9-a74d-624210d4acd3
---

`.claude/scripts/lib/scan-pending-improvements.mjs` は `docs/05_改善ログ/*.md` を走査し、`status: pending | in-progress` のエントリを Tier 順に抽出する CLI ツール (Phase 1 = PR #308 で deployed)。

## 主要オプション

```bash
# 全 pending / in-progress を Markdown table 表示
node .claude/scripts/lib/scan-pending-improvements.mjs --format markdown

# 今週末まで due の Tier 1/2 (weekly-plan が呼ぶパターン)
node .claude/scripts/lib/scan-pending-improvements.mjs --due-before 2026-05-24 --tier 1,2

# deployed_at から 14 日以上経過した pending (triage が呼ぶパターン)
node .claude/scripts/lib/scan-pending-improvements.mjs --overdue-days 14

# JSON 出力 (デフォルト、agent 用)
node .claude/scripts/lib/scan-pending-improvements.mjs
```

## パーサーの挙動

- ID 抽出: 角括弧 `[BLOG-CTR-02]` 優先、なければインライン `T2-CWV-04: ...` パターン
- TEMPLATE section は自動除外 (`-XXX` 末尾 or `タイトル (期間)` を含むもの)
- frontmatter は H2 直下のみ採用、H3 (`### 施策 ID` 等) 配下の `- **Tier**:` などは無視 (重複定義対策)
- due / deployed_at は冒頭の `YYYY-MM-DD` のみ取り、補足 (`(W23)` など) は別途扱い
- owner が `|` を含むとテンプレ残りと判定し null

## 関連

- 現行バックログ: `docs/todo/04_改善バックログ.md`
- triage workflow: `.github/workflows/improvement-log-reminder-weekly.yml` (日曜 22:00 JST)
- weekly-plan: `.claude/skills/management/weekly-plan/SKILL.md` Phase 1 Agent D で呼ばれる
- 設計履歴: Git 履歴の旧 SEO TODO 統合計画
- 関連プロジェクト: [[project-seo-todo-unify-phase-1]]
