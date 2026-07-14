# docs/todo/ — 未完了と現在計画の単一入口

stats47 の「次に何をやるか」はすべてここから辿れる。バックログを正典とし、月次・週次計画はそこから選んだ現在の実行ビューとする。

## 構成（pull方式）

```
inbox.md（受信箱・未分類）
  ↓ triage（月初の /monthly-plan または随時）
01_改善バックログ.md / 02_機能バックログ.md / 03_指標バックログ.md（真実源）
  ↓ 月初 pull
current-month.md（今月の重点 1-2 テーマ・/monthly-plan が上書き）
  ↓ 週初 pull
current-week.md（今週の実行量・/weekly-plan が上書き）
```

| ファイル | 内容 | 書式・機械参照 |
|---|---|---|
| `inbox.md` | セッション中に出た未分類の TODO。溜めない | 表に 1 行 append → triage で行削除 |
| `01_改善バックログ.md` | 改善施策の **TODO 真実源** (SEO/性能/コスト/収益)。status (pending/effect/*)・Tier・期日を管理 | `scan-pending-improvements.mjs` / gallery `/dashboard` がパース。effect/* 判定は `evidence-based-judgment.md` 準拠・書き込みは improvement-triage が排他 |
| `02_機能バックログ.md` | 未着手の機能・自動化 | gallery `/dashboard` がパース。section 単位で追加、完了 section は削除（記録は git 履歴） |
| `03_指標バックログ.md` | 指標拡充候補（e-Stat 調査結果の受け皿） | `parse-backlog.cjs` が表をパース |
| `current-month.md` | 今月選んだ重点と配分。TODOの状態は持たない | `/monthly-plan` が月初に上書き |
| `current-week.md` | 今週の実行単位とチェックボックス | `/weekly-plan` が週初に上書き、`/weekly-review` が参照 |

## ルール

- **完了したものは消す**: 機能・指標は行/セクション削除（git 履歴が記録）。改善施策のみ effect/* ラベルの実測サイクルがあるため status 更新で管理し、effect 確定から 1 ヶ月経過したら削除してよい。
- **計画履歴を複製しない**: `current-month.md` / `current-week.md` は上書きする。週次レビューは `.claude/skills/management/weekly-review/reference/reviews/`、変更履歴は git に残る。
- **状態を二重管理しない**: current files に status / due / owner のコピーを持たせず、バックログIDを参照する。
- **完了サマリー・経緯をここに書かない**: 知見は `.claude/memory/`、レビューは `docs/04_レビュー/` へ。
- 表の列構造を変えるときはパーサ (`scan-pending-improvements.mjs` / `parse-backlog.cjs` / `dashboard-data.mjs`) の追従が必要。
- PR で閉じる単発の改修・バグはここではなく GitHub Issues (`enhancement`/`bug`) → `.claude/rules/docs-vs-issues.md`。
