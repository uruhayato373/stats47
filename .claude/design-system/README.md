# stats47 デザインシステム入口

このディレクトリは Claude Code 向けの互換入口です。デザインシステムの正典は docs 配下の 1 文書に集約しました。

## 正典

| 知りたいこと                        | 参照先                                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| UI 判断ルール全般                   | `docs/01_技術設計/04_デザインシステム.md`（`SSOT.md` は同ファイルへの互換 symlink） |
| 見た目の 5 原則                     | 同「見た目の 5 原則」                                                               |
| 禁止パターン (class・部品の水準)    | 同「禁止パターン」                                                                  |
| 部品の書き方の早見                  | 同「部品の書き方の早見」                                                            |
| 横幅・レール・PageShell・PageHeader | 同「レイアウト」                                                                    |
| page_components の設計契約          | 同「page_components の設計契約」                                                    |
| ページ責務・page_components 配置    | `docs/01_技術設計/03_情報設計.md`                                                   |

旧 `principles.md` / `quick-reference.md` / `prohibited.md` / `page-components.md` は 2026-11-25 に `04_デザインシステム.md` へ統合して削除した。内容を確かめるときは `git log --diff-filter=D -- .claude/design-system/` で復元できる。

## エージェント運用

UI 変更時に `CLAUDE.md` へルール全文を複製しないでください。必要なときだけ正典の該当節を読んでください。

## 関連スキル

- `/design-review` — デザインレビュー
- `/ui-panel-review` — UI/UX 評価
