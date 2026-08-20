---
name: reference-scan-pending-improvements
description: scan-pending-improvements.mjs の使い方 (改善バックログから active 施策を抽出する CLI、weekly-plan と triage-matrix が共用)
metadata: 
  node_type: memory
  type: reference
  originSessionId: dfcc7188-5af9-45c9-a74d-624210d4acd3
---

`.claude/scripts/lib/scan-pending-improvements.mjs` は **`.claude/todo/improvements.md` の
マークダウンテーブル**を走査し、`status: pending | in-progress | effect/pending` の行を Tier 順に
抽出する CLI ツール。旧 `docs/05_改善ログ/*.md` 走査版は廃止済 (2026-06-06 のバックログ統合)。

## 主要オプション

```bash
# 全 active 施策を Markdown table 表示
node .claude/scripts/lib/scan-pending-improvements.mjs --format markdown

# 今週末まで due の Tier 1/2 (weekly-plan が呼ぶパターン)
node .claude/scripts/lib/scan-pending-improvements.mjs --due-before 2026-05-24 --tier 1,2

# deployed_at から 14 日以上経過した行 (triage が呼ぶパターン・2026-07-30 実装)
node .claude/scripts/lib/scan-pending-improvements.mjs --overdue-days 14

# JSON 出力 (デフォルト、agent 用)
node .claude/scripts/lib/scan-pending-improvements.mjs
```

## パーサーの挙動

- 表の列は `| ID | タイトル | Status | Due | Owner | Metric |` 固定。6 列未満の行は無視
- Tier は直前の `## Tier N` 見出しから継承
- `due` は先頭の `YYYY-MM-DD` のみ取る (`-` は null)
- **`deployed_at`**: タイトルから `deployed|デプロイ済|実装済 + YYYY-MM-DD` を抽出
  (実装は `.claude/scripts/lib/effect-verdict/engine.mjs` の `extractDeployDate`。
  「未デプロイ」「slotId を記入」等の未稼働表現は null)
- **`overdue_days`**: `deployed_at` からの経過日数。`deployed_at` が無ければ **null** (0 にしない)
- `parseBacklog(path, today)` は export 済 (`write-past-effects.mjs` が同じパーサを再利用)
- `IMPROVEMENT_BACKLOG_PATH` env でバックログのパスを差し替えられる (fixture 検証用)

## triage-matrix の「超過」バケットについて (2026-07-30 実測)

`triage-matrix.mjs` の 超過 判定は `status === "pending" && overdue_days >= 14`。
`overdue_days` を出すようにしても、**実バックログでは deploy 日を持つ 5 行がすべて
`effect/pending` のため 超過 は 0 のまま**だった。`effect/pending` を含めるか (triage-matrix 側の
変更) か、バックログの status 運用を変えるかはオーナー判断が必要 (2026-07-30 時点で未決)。
フィールド側の動作は fixture で検証済 (`.claude/scripts/lib/__tests__/write-past-effects.test.mjs`
の「triage-matrix の超過バケットが 0 以外になる」)。

## 関連

- バックログ: `.claude/todo/improvements.md`
- 可視化: `.claude/scripts/lib/triage-matrix.mjs` (`--format matrix|csv`)
- 台帳 writer: `.claude/scripts/lib/write-past-effects.mjs` (同じ `parseBacklog` を使う)
- triage workflow: `.github/workflows/improvement-log-reminder-weekly.yml` (日曜 22:00 JST)
- weekly-plan: `.claude/skills/management/weekly-plan/SKILL.md` Phase 1 Agent D で呼ばれる
- 設計履歴: Git 履歴の旧 SEO TODO 統合計画
- 関連プロジェクト: [[project-seo-todo-unify-phase-1]]
