# Pre-commitフックガイド

## 概要

本プロジェクトでは、コード品質の維持とセキュリティ確保のため、`husky` と `apps/web/scripts/pre-commit-checks.sh` を使用したコミット前チェックを導入しています。

変更ファイル一覧は3種類の差分条件ごとに一度だけ取得します。共通の静的検査7件は
`preflight-commit.mjs --commit-static` に集約し、最大2件を同時実行して各検査の所要時間を表示します。
型・文書・コンテンツの条件付き検査は引き続きcommit hookが実行します。
`npm audit` は依存manifest・lock変更時だけローカル実行し、PRと週次の `security-scan.yml` でも検査します。

commit hook は終了時に、段ごとの所要時間を重い順に表示します (0.1 秒未満の段は 1 行にまとめます)。
段は `apps/web/scripts/pre-commit-stage-timer.sh` の `stage "名前"` で切ります。検査を足すときは
段も足してください。1 つの段で `node` / `npm run` / `npx` を 2 本起動すると
`pre-commit-guard-paths.test.cjs` が落ちます。

## チェック項目

コミット（`git commit`）時に自動的に実行される項目は以下の通りです。

| チェック | コマンド・内容 | 重要度 | エラー時の動作 |
|---------|---------|-------|---------|
| TypeScript型チェック | `PRECOMMIT_FULL_TYPECHECK=1` の明示時のみ `npm run type-check` | 致命的 | 通常commitは高速化のため省略し、main PR CI・週次CIで必須実行 |
| ファイルサイズチェック | 1MB以上のファイルの検出 | 警告 | ⚠️ 継続可能だが推奨されない |
| 命名規則（大文字検出） | ファイル名の大文字を検出 | 警告 | ⚠️ 継続可能だが推奨されない |
| 依存関係の脆弱性 | `npm audit` | 警告 | ⚠️ 継続可能（開発時のみ） |
| シークレット漏洩検知 | キーやトークンの検出 | 警告 | ⚠️ 警告のみ（要手動確認） |

## トラブルシューティング

### フックが実行されない場合

以下のコマンドを実行して、実行権限と設定を確認してください。

```bash
# 実行権限の付与
chmod +x .husky/pre-commit
chmod +x apps/web/scripts/pre-commit-checks.sh

# huskyの再初期化（必要な場合）
npx husky init
```

### チェックをスキップしたい場合

緊急時（Hotfixなど）に限り、一時的にチェックをスキップできます。**ただし、品質低下やシークレット漏洩のリスクがあるため、常用は避けてください。**

```bash
git commit --no-verify -m "message"
```

## メンテナンス

新しいチェック項目を追加する場合は、`apps/web/scripts/pre-commit-checks.sh` を編集してください。

`core.hooksPath` は本体の `.husky` の絶対パスなので、worktree の commit でも本体の `.husky/pre-commit` が走ります。本体の版は、commit する作業ツリーの `.husky/pre-commit` が自分と違えばそちらへ委ねるので、作業ツリー側の変更もその作業ツリーの commit で効きます (`husky-worktree-hook.test.cjs`)。委ねる処理そのものは、本体の作業ツリーに届いてから効きます。

---

## 関連ドキュメント

- [CI/CD ガイド](../.github/workflows/README.md)

## pre-push

`pre-push` は変更に関係するテストだけを走らせる (`.claude/scripts/lib/pre-push-tests.mjs`)。全件は CI が持つ。CI では動かない。飛ばすときは `git push --no-verify`。

`core.hooksPath` は本体の `.husky` の絶対パスなので、このフックは他の worktree の push でも動く。push する作業ツリーにスクリプトが無いとき (スクリプトを持たないブランチの worktree) は、何もせず通す。
