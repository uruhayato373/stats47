# docs/todo/ — TODO の単一の入口

stats47 の「次に何をやるか」はすべてここから辿れる。散在防止のため、**TODO 系ファイルはこのディレクトリの 4 ファイルに固定**する（新規ファイル追加禁止）。

## 構成（4 層 pull 方式）

```
inbox.md（受信箱・未分類）
  ↓ triage（月初の /monthly-plan または随時）
01_改善バックログ.md / 02_機能バックログ.md / 03_指標バックログ.md（真実源）
  ↓ 月初 pull
docs/03_週次運用/月次計画/YYYY-MM.md（今月の重点 1-2 テーマ・/monthly-plan が生成）
  ↓ 週初 pull
docs/03_週次運用/週次計画/YYYY-Www.md（/weekly-plan が生成・チェックボックス消化）
```

| ファイル | 内容 | 書式・機械参照 |
|---|---|---|
| `inbox.md` | セッション中に出た未分類の TODO。溜めない | 表に 1 行 append → triage で行削除 |
| `01_改善バックログ.md` | 改善施策の **TODO 真実源** (SEO/性能/コスト/収益)。status (pending/effect/*)・Tier・期日を管理 | `scan-pending-improvements.mjs` / gallery `/dashboard` がパース。effect/* 判定は `evidence-based-judgment.md` 準拠・書き込みは improvement-triage が排他 |
| `02_機能バックログ.md` | 未着手の機能・自動化 | gallery `/dashboard` がパース。section 単位で追加、完了 section は削除（記録は git 履歴） |
| `03_指標バックログ.md` | 指標拡充候補（e-Stat 調査結果の受け皿） | `parse-backlog.cjs` が表をパース |

## ルール

- **完了したものは消す**: 機能・指標は行/セクション削除（git 履歴が記録）。改善施策のみ effect/* ラベルの実測サイクルがあるため status 更新で管理し、effect 確定から 1 ヶ月経過したら削除してよい。
- **完了サマリー・経緯をここに書かない**: 知見は `.claude/memory/`、レビューは `docs/04_レビュー/` へ。
- 表の列構造を変えるときはパーサ (`scan-pending-improvements.mjs` / `parse-backlog.cjs` / `dashboard-data.mjs`) の追従が必要。
- PR で閉じる単発の改修・バグはここではなく GitHub Issues (`enhancement`/`bug`) → `.claude/rules/docs-vs-issues.md`。
