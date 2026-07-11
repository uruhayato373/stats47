---
name: project_docs_reorg_todo_handoffs
description: docs/ 再編 (2026-07-11・doboku-note式)。TODO 真実源は docs/todo/ の 4 ファイル固定、セッション引き継ぎは docs/handoffs/ (抽出→削除・貯めない)。完了文書はアーカイブせず git rm
metadata:
  type: project
---

docs/ を doboku-note プロジェクトのパターンに倣って再編した (2026-07-11、feature/docs-todo-handoffs-reorg)。

**TODO の単一の入口 = `docs/todo/`** (4 ファイル固定・新規ファイル追加禁止):
- `inbox.md` — 未分類の思いつき受信箱 (旧 `docs/03_週次運用/TODOインボックス.md`)。triage で行削除
- `01_改善バックログ.md` (旧 `02_実装計画/03_改善バックログ.md`) — scan-pending-improvements.mjs / gallery dashboard がパース
- `02_機能バックログ.md` (旧 `02_実装計画/04_機能バックログ.md`)
- `03_指標バックログ.md` (旧 `02_実装計画/05_指標バックログ.md`) — parse-backlog.cjs がパース
- 運用ルール正典: `docs/todo/README.md`。pull 式: inbox → backlog → 月次計画 → 週次計画 (03_週次運用 は現行維持)

**セッション引き継ぎ = `docs/handoffs/YYYY-MM-DD-<topic>.md`** (旧 `docs/04_レビュー/*-session-handoff-*`):
- ライフサイクルは一方向: 書く → 次セッションが消化 → 抽出 (残タスク→todo / 知見→memory / 手順→rules) → git rm
- 削除前に外部実体 (PR マージ・デプロイ・ファイル実在) を検証。未確認は削除しない。正典: `docs/handoffs/README.md`

**削除ポリシー**: 完了・消化済み文書は `archive/` に移さず git rm (復元は `git log --diff-filter=D`)。週次系 (計画/レビュー/メトリクス) は概ね 4 週より古いものを削除。

**このとき削除したもの**: 22_Instagram企画/ (企画生産ゼロ)、00_プロジェクト管理/05_コンテンツ企画マスター.md (gallery /dashboard が代替)、blog-brushup-plan.md (superseded)、W23 以前の週次系、archive/ 2 箇所。`02_実装計画/16_家計調査論点カタログ.md` は番号衝突解消で `17_` にリネーム。

**Why**: TODO が 4 箇所・ハンドオフがレビューに混在して散在し「次に何をやるか」の入口が不明瞭だった。参照約 100 ファイル (rules/agents/skills/scripts) は新パスへ一括更新済み。

**How to apply**: 施策・タスクの追加/検索はまず `docs/todo/README.md` の表から。旧パス `docs/02_実装計画/0[345]_*バックログ.md` への参照を新規に書かない。関連 [[project_note_publish_flow_2026_06]]
