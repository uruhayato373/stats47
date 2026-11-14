# docs ディレクトリ INDEX

> **方針**: 人間が判断する戦略・設計は `docs/`、現在計画とバックログは `.claude/todo/`、計測・改善ログ・レビューなど事業の記録は `data/<取得元>/`、エージェント運用の状態だけ `.claude/state/` に置く (置き場の判断は [`../.claude/rules/data-storage.md`](../.claude/rules/data-storage.md))。レビュー全文は蓄積せず、未完了策を `.claude/todo/`、恒久判断を既存SSOTへ直接反映する。GitHub Issues は (a) PR で close される `enhancement`/`bug`、(b) `auto-generated`の機械アラートのみ残す。詳細: [`../.claude/rules/docs-vs-issues.md`](../.claude/rules/docs-vs-issues.md)
>
> **2026-07-22 更新**: TODO とセッション残タスクは `.claude/todo/` に集約。一時ハンドオフ文書は廃止した。完了・消化済みドキュメントはアーカイブせず削除し、記録は git 履歴に委ねる。
>
> **機械ガード**: 文書変更後は`npm run docs:fix`で生成INDEXを同期し、`npm run docs:check`を通す。
> 許可パス・固定構成は`.claude/config/docs-governance.json`、判断規則は
> [`.claude/rules/docs-vs-issues.md`](../.claude/rules/docs-vs-issues.md)が正典。

## まずここから

| 知りたいこと                                       | 場所                                                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **次に何をやるか (TODO)**                          | `.claude/todo/` — 固定 4 ファイル（backlog、improvements、monthly、weekly）。構文は [`todo-standards.md`](../.claude/rules/todo-standards.md) |
| **前セッションからの残タスク**                     | `.claude/todo/backlog.md` — カードとして起票する                                               |
| 今月・今週の計画                                   | `.claude/todo/monthly.md` `.claude/todo/weekly.md`                                             |
| 収益化の正典                                       | `00_プロジェクト管理/02_収益化戦略.md`                                                         |
| ターゲット・ペルソナ                               | [`00_プロジェクト管理/04_ターゲットペルソナ.md`](00_プロジェクト管理/04_ターゲットペルソナ.md) |
| SNS 自動化のログイン保持 (Playwright プロファイル) | [`01_技術設計/07_Playwright認証プロファイル.md`](01_技術設計/07_Playwright認証プロファイル.md) |

## 01\_技術設計/ の固定構成

```
01_技術設計/
├── 01_システムアーキテクチャ.md
├── 03_情報設計.md
├── 04_デザインシステム.md
├── 05_エラーハンドリング.md
├── 06_自動化インベントリ.md
└── 07_Playwright認証プロファイル.md
```

設計判断はこの6文書へ統合 (データの置き場の正本は文書でなく、機械の台帳 `config/datasets.mjs` と `r2-key-classes.ts`。`.claude/rules/data-storage.md`)する。実装に密結合するコマンド、schema、component API、運用手順はコード近傍の README または `.claude/rules/` を正典とし、技術設計へ複製しない。

## ドキュメント分類

| ディレクトリ           | 役割                                                                                                                                            | 運用                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `.claude/todo/` (docs の外) | **TODO と現在計画の単一入口**                                                                                                              | 固定 4 ファイル。完了は削除、月次・週次計画は上書き (`.claude/rules/todo-standards.md`)            |
| `00_プロジェクト管理/` | プロジェクトの基盤文書（定義・収益化・マーケ・ペルソナ）                                                                                        | 固定 4 ファイル。内容更新のみ・新規ファイル追加禁止                                                 |
| `01_技術設計/`         | システム・データ・情報・UI・エラー・自動化・認証の横断設計                                                                                      | 上記7ファイル固定。新規ファイルではなく既存文書へ統合                                               |
| `02_実装計画/`         | 戦略・領域別実行計画                                                                                                                            | 連番ファイルのみのフラット構成。完了・superseded は git 履歴へ                                      |
| `10_SNS戦略/`          | SNS コンテンツ設計 (実行規約の正典は `.claude/rules/sns-content-standards.md`)                                                                  | 内容更新が中心                                                                                      |
| `30_note記事企画/`     | note 記事の企画・戦略 (+ backlog)。チャート無しのアイデア段階                                                                                   | 蓄積                                                                                                |
| `31_note記事原稿/`     | note 記事を編集する**作業場** (git は README だけを追跡する)。本文・画像の正本は R2、所在と SHA は `data/note/articles.json`                    | `npm run note:article -- checkout / save` で取り出して戻す                                          |

ブログ記事の公開待ち原稿は docs/ ではなく `contents/blog/` に置く (R2 が正典。公開すると CI が消す outbox。2026-10-08 に docs/ から移した)。

## 00\_プロジェクト管理/ の固定構成

```
00_プロジェクト管理/
├── 01_プロジェクト定義.md
├── 02_収益化戦略.md
├── 03_マーケティング戦略.md
└── 04_ターゲットペルソナ.md
```

戦略文書はこの 4 ファイルに統合管理。日付サフィックス付きファイル (`-YYYY-MM-DD.md`) は禁止。更新は同名ファイルへの上書きで行う。

## 配置の判断基準（docs/ vs .claude/ vs Issues）

| 対象                                               | 置き場所                                     | 例                                                       |
| -------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------- |
| やること (未着手タスク・受信箱)                    | `.claude/todo/`                                 | 改善施策、機能、指標拡充、思いつき                       |
| セッション残タスク                                 | `.claude/todo/`                                 | 未完了事項を該当バックログへ直接反映                     |
| 人間が意思決定に使う恒久文書                       | `docs/` 各分類                               | プロジェクト定義、現在計画、戦略・要件                   |
| 人間が編集する企画                                 | `docs/`                                      | note 企画 (原稿の正本は R2、ブログの公開待ちは `contents/blog/`) |
| 計測・改善ログ・レビュー・監査と是正のキュー       | `data/<取得元>/`                             | `data/gsc/`、`data/improvement/*/improvement-log.md`、`data/reviews/weekly/` |
| エージェント運用の状態                             | `.claude/state/`                             | バックログ自動処理の実行台帳、モデル使用量               |
| PR で close する機能改修 / バグ                    | GitHub Issues (`enhancement` / `bug`)        | UI バグ、API 追加、リファクタ                            |
| 日次自動アラート                                   | GitHub Issues (`*-alert` + `auto-generated`) | 閾値違反通知のみ                                         |

迷ったら判定フロー (`../.claude/rules/docs-vs-issues.md#判定フロー`) を参照。

## ドキュメント運用ルール

### 新規記録の追加先

1. **やることを思いついた** → `.claude/todo/backlog.md` へカードを起票 (タグは後から足してよい)
2. **セッションの残タスクを記録する** → `.claude/todo/backlog.md` へカードを起票
3. **戦略・要件の変更** → `00_プロジェクト管理/` 該当ファイルを Edit (新規ファイル追加禁止)
4. **月次計画** → `/monthly-plan` スキルが `.claude/todo/monthly.md` を上書き（月初）
5. **週次計画・レビュー** → `/weekly-plan` は `.claude/todo/weekly.md` を上書き、`/weekly-review` は `data/reviews/weekly/YYYY-Www.md` に保存
6. **改善施策の記録** → active 中だけ `.claude/todo/improvements.md` の行を追加・更新し、効果判定後は詳細ログ (`data/improvement/*/improvement-log.md`) へ結果を残して行を削除
7. **機能改修 / バグ** → `gh issue create --label enhancement` で Issues 起票
8. **レビュー / 事前検死 / 監査** → 全文は保存せず、未完了策を該当TODOへ、恒久判断を既存の戦略・rules・READMEへ反映
9. **文書の作成・移動・削除後** → `npm run docs:fix && npm run docs:check`

### lifecycle（アーカイブしない・削除する）

```
新規作成 → docs/<適切なパス> または Issues (enhancement/bug)
  ↓ 実装完了・消化
docs/: git rm で削除（記録は git 履歴。archive/ ディレクトリは作らない）
Issues: PR で close
```

- 復元・振り返りは `git log --diff-filter=D -- docs/<path>` から。
- レビュー・監査の記録が必要な定期処理は `data/<取得元>/` に置き（カタログ `config/datasets.mjs` に行を足す）、完了履歴はGitから復元する。

### docs 外のドキュメント

コードに密結合するドキュメントは、対象の隣に README.md として配置する。

| ドキュメント              | 配置先                                                                        |
| ------------------------- | ----------------------------------------------------------------------------- |
| DB 操作・スキーマ・シード | `packages/database/README.md`                                                 |
| R2 ストレージ             | `packages/r2-storage/README.md` / `packages/r2-storage/src/scripts/README.md` |
| CI/CD・デプロイ           | `.github/workflows/README.md`                                                 |
| Pre-commit フック         | `.husky/README.md`                                                            |
| 各 feature の設計         | `apps/*/src/features/*/README.md`                                             |

### やってはいけないこと

- `00_プロジェクト管理/` に戦略文書を追加する (固定 4 ファイルへの Edit で対応)
- `.claude/todo/` に固定 4 ファイル (backlog・improvements・monthly・weekly) 以外を追加する (`.claude/rules/todo-standards.md`)
- 日付サフィックス付きファイル (`*-YYYY-MM-DD.md`) を `00_/` `01_/` `02_/` の上書き型ディレクトリに置く
- `archive/` ディレクトリを作る (削除して git 履歴に委ねる)
- weekly / review / improvement 系スキルから一般的な改善候補を `gh issue create` する（未完了策は `.claude/todo/` へ）

## frontmatter 規約

`00_プロジェクト管理`、`01_技術設計`、`02_実装計画`、`todo`は
`title`、`type`、`status`、`updated`を必須とする。

```yaml
---
title: 文書名
type: strategy | technical-design | implementation-spec | monthly-plan | ...
status: active
updated: 2026-MM-DD
---
```

完了・廃止状態の文書は残さない。月次の`month`、週次の`week`、activeな実装計画の
`related_backlog`など種別固有fieldと詳細は
[`../.claude/rules/docs-vs-issues.md`](../.claude/rules/docs-vs-issues.md)を参照する。

## 自動検査

```bash
npm run docs:report     # error・warningを機械可読JSONで確認
npm run docs:fix        # 実装計画INDEXの生成範囲だけを同期
npm run docs:check      # 構造 + 新規リンク切れ
npm run docs:check:all  # テスト + 鮮度 + orphan候補を含む完全棚卸し
```

文書関連差分はpre-commitとPRでも検査される。週次監査は鮮度超過を通知するが、
内容統合・削除は`/maintain-docs`が証拠を確認して判断する。
