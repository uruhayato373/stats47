コード変更後の 6 段階品質ゲートを順次実行する。各フェーズの結果をマークダウンテーブルで報告する。

## 用途

- 大規模リファクタリング後の品質確認
- `/deploy` 前の最終チェック（Step 2 の代替）
- PR 作成前の self-review
- 15 分ごとの定期チェック（長時間セッション時）

## 引数

| 引数 | 必須 | デフォルト | 説明 |
|---|---|---|---|
| `--skip` | × | なし | スキップするフェーズ（例: `--skip lint`） |
| `--fix` | × | false | 自動修正可能な問題を修正 |

## 手順

### Phase 1: ビルド検証（ゲーティング）

```bash
npx turbo run build --filter=web
```

**ビルドが失敗した場合は即停止。** 他のフェーズに進まない。

### Phase 2: 型チェック

```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```

エラー数を記録。CRITICAL エラー（型不一致）がある場合は警告。

### Phase 3: Lint

```bash
cd apps/web && npx eslint src/ --ext .ts,.tsx --max-warnings 0
```

ESLint config は `apps/web/eslint.config.mjs` にあるため、`apps/web` ディレクトリから実行すること。

### Phase 4: テスト実行

```bash
cd apps/web && npx vitest run --reporter=verbose 2>&1
```

- テスト数・通過数・失敗数を記録
- 失敗テストがある場合は詳細を報告

### Phase 5: セキュリティスキャン

```bash
# シークレットパターンの検出
rg -c "(sk-[a-zA-Z0-9]{20,}|api_key\s*[:=]\s*['\"][^'\"]+|password\s*[:=]\s*['\"][^'\"]+)" apps/web/src/ packages/ --glob '!*.test.*' 2>/dev/null

# client bundle へのサーバーシークレット漏洩チェック
rg -c "process\.env\.(ESTAT_|D1_|DB_|SECRET)" apps/web/src/ --glob '!*server*' --glob '!*action*' 2>/dev/null

# console.log のシークレット出力
rg -c "console\.(log|info).*\b(key|token|secret|password)\b" apps/web/src/ 2>/dev/null
```

### Phase 6: Git diff レビュー

```bash
git diff --stat HEAD
git diff --numstat HEAD | awk '{added+=$1; deleted+=$2} END {print "+" added " / -" deleted}'
```

- 変更ファイル数・追加行数・削除行数を記録
- 1 ファイル 500 行超の変更がある場合は分割を推奨

## 出力フォーマット

```markdown
## Verification Loop 結果

| Phase | 項目 | 結果 | 詳細 |
|---|---|---|---|
| 1 | ビルド | PASS/FAIL | — |
| 2 | 型チェック | PASS/WARN(N件) | エラー内容 |
| 3 | Lint | PASS/SKIP/WARN | — |
| 4 | テスト | PASS(N/N) | 失敗テスト一覧 |
| 5 | セキュリティ | PASS/WARN(N件) | 検出パターン |
| 6 | Diff | INFO | +N / -N, Nファイル |

### PR Ready: YES / NO
- YES: Phase 1-5 すべて PASS
- NO: FAIL または CRITICAL WARN がある場合
```

## 関連スキル

- `/deploy` — デプロイフロー（Step 2 をこのスキルで置換可能）
- `/security-review` — 詳細セキュリティレビュー
- `/run-tests` — テスト実行（Phase 4 の詳細版）
