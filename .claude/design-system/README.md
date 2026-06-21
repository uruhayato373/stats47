# stats47 デザインシステム入口

このディレクトリは Claude Code 向けの互換入口・レビュー補助です。デザインシステムの正典は docs 配下に移しました。

## 正典

| 知りたいこと | 参照先 |
|---|---|
| UI 判断ルール全般 | `SSOT.md` → `docs/01_技術設計/15_デザインシステムSSOT.md` |
| 横幅・レール・PageShell・PageHeader | `docs/01_技術設計/13_統一レイアウト設計.md` |
| ページ責務・page_components 配置 | `docs/01_技術設計/07_情報設計.md` |

このディレクトリ内の `principles.md` / `quick-reference.md` / `prohibited.md` は、過去の melta-ui 由来ルールを残した参考資料です。内容が正典と食い違う場合は、常に `SSOT.md` を優先してください。

## エージェント運用

UI 変更時に `CLAUDE.md` へルール全文を複製しないでください。必要なときだけ `SSOT.md` の該当節を読んでください。

## 関連スキル

- `/design-review` — デザインレビュー
- `/ui-panel-review` — UI/UX 評価
