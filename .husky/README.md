# Pre-commitフックガイド

## 概要

本プロジェクトでは、コード品質の維持とセキュリティ確保のため、`husky` と `apps/web/scripts/pre-commit-checks.sh` を使用したコミット前チェックを導入しています。

変更ファイル一覧は3種類の差分条件ごとに一度だけ取得します。共通の静的検査7件は
`preflight-commit.mjs --commit-static` に集約し、最大2件を同時実行して各検査の所要時間を表示します。
型・文書・コンテンツの条件付き検査は引き続きcommit hookが実行します。
`npm audit` は依存manifest・lock変更時だけローカル実行し、PRと週次の `security-scan.yml` でも検査します。

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

---

## 関連ドキュメント

- [CI/CD ガイド](../.github/workflows/README.md)
