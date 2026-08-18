---
name: project_docs_reorg_todo_handoffs
description: docs/ 再編。TODO 真実源は .claude/todo/ の4ファイル固定。2026-07-22に一時ハンドオフ文書を廃止し、残タスクはバックログへ直接反映。完了文書はアーカイブせずgit rm
metadata:
  type: project
---

docs/ を doboku-note プロジェクトのパターンに倣って再編した (2026-07-11、feature/docs-todo-handoffs-reorg)。

**TODO の単一の入口 = `.claude/todo/`** (4 ファイル固定・新規ファイル追加禁止):
- `01_未整理タスク.md` — 未分類の思いつき受信箱。triage で行削除
- `04_改善バックログ.md` (旧 `02_実装計画/03_改善バックログ.md`) — scan-pending-improvements.mjs / gallery dashboard がパース
- `05_機能バックログ.md` (旧 `02_実装計画/04_機能バックログ.md`)
- `06_指標バックログ.md` (旧 `02_実装計画/05_指標バックログ.md`) — parse-backlog.cjs がパース
- 運用ルール正典: `.claude/todo/00_運用ガイド.md`。pull 式: inbox → backlog → current-month → current-week

**2026-07-30 更新**: 一時ハンドオフとレビュー全文の保存は廃止。セッションの未完了事項は
`.claude/todo/` の適切なバックログへ直接反映し、恒常知見はmemory、手順はrules、agent用定期履歴は
skill referenceへ保存する。完了経緯だけの文書は作らずGit履歴を参照する。

**削除ポリシー**: 完了・消化済み文書は `archive/` に移さず git rm (復元は `git log --diff-filter=D`)。週次系 (計画/レビュー/メトリクス) は概ね 4 週より古いものを削除。

**このとき削除したもの**: 22_Instagram企画/ (企画生産ゼロ)、00_プロジェクト管理/05_コンテンツ企画マスター.md (gallery /dashboard が代替)、blog-brushup-plan.md (superseded)、W23 以前の週次系、archive/ 2 箇所。`02_実装計画/16_家計調査論点カタログ.md` は番号衝突解消で `17_` にリネーム。

**Why**: TODO が 4 箇所・ハンドオフがレビューに混在して散在し「次に何をやるか」の入口が不明瞭だった。参照約 100 ファイル (rules/agents/skills/scripts) は新パスへ一括更新済み。

**How to apply**: 施策・タスクの追加/検索はまず `.claude/todo/00_運用ガイド.md` の表から。旧パス `docs/02_実装計画/0[345]_*バックログ.md` への参照を新規に書かない。関連 [[project_note_publish_flow_2026_06]]
