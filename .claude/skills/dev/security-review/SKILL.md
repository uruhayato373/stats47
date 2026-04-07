---
name: security-review
description: セキュリティレビューを実施する（OWASP Top 10 + D1/R2/Cloudflare 固有チェック）。Use when user says "セキュリティレビュー", "security-review", "脆弱性チェック". 自動修正オプション付き.
disable-model-invocation: true
---

コード変更に対するセキュリティレビューを実施する。OWASP Top 10 + stats47 固有のチェックリストで脆弱性を検出する。

## 用途

- 認証・認可の実装時
- ユーザー入力を処理するコード変更時
- API エンドポイントの追加・変更時
- 環境変数・シークレットの取り扱い変更時
- `/deploy` 前の最終セキュリティチェック
- 外部 API（e-Stat、GA4、AdSense 等）との連携コード変更時

## 引数

| 引数 | 必須 | デフォルト | 説明 |
|---|---|---|---|
| `--scope` | × | `diff` | `diff`（git diff のみ）/ `full`（全コードベース） |
| `--fix` | × | false | 検出した問題を自動修正する |

## 手順

### Phase 1: シークレット・環境変数チェック

```bash
# ハードコードされたシークレットの検出
rg -n "(sk-|api_key|password|secret|token).*['\"][a-zA-Z0-9]" apps/ packages/ --glob '!*.test.*' --glob '!node_modules'

# .env ファイルのコミット検出
git diff --cached --name-only | grep -E '\.env(\.|$)'

# console.log でのシークレット出力検出
rg -n "console\.(log|info|debug).*\b(key|token|secret|password|apiKey)\b" apps/web/src/ --glob '*.{ts,tsx}'
```

**チェック項目:**
- [ ] ハードコードされた API キー・トークン・パスワードがない
- [ ] すべてのシークレットが環境変数経由
- [ ] `.env.local` が `.gitignore` に含まれている
- [ ] `console.log` でシークレットが出力されていない
- [ ] e-Stat API キー（`ESTAT_API_KEY`）が client bundle に含まれていない

### Phase 2: 入力バリデーション

**チェック項目:**
- [ ] ユーザー入力が Zod スキーマ等で検証されている
- [ ] Server Actions の引数が型安全
- [ ] URL パラメータ（`searchParams`）がサニタイズされている
- [ ] ファイルアップロード（R2 連携）にサイズ・型チェックがある

### Phase 3: SQL インジェクション防止（D1）

```bash
# Drizzle ORM 外の生 SQL を検出
rg -n "sql\`.*\$\{" packages/ apps/ --glob '*.ts' | grep -v "correlationAnalysis\|rankingItems\|table\."
```

**チェック項目:**
- [ ] Drizzle ORM のパラメータ化クエリを使用
- [ ] `sql` テンプレートリテラル内のユーザー入力が `sql.placeholder` 経由
- [ ] `better-sqlite3` の直接実行で文字列結合がない

### Phase 4: XSS 防止

**チェック項目:**
- [ ] `dangerouslySetInnerHTML` を使用していない（または DOMPurify でサニタイズ済み）
- [ ] ユーザー生成コンテンツが React のエスケープ機構を経由
- [ ] ブログ記事の Markdown レンダリングが `react-markdown` 経由（raw HTML 無効）
- [ ] 外部リンクに `rel="noopener noreferrer"` がある

### Phase 5: Cloudflare Pages / R2 固有

**チェック項目:**
- [ ] R2 パブリック URL（`storage.stats47.jp`）経由で非公開データが露出していない
- [ ] Cloudflare Pages の環境変数が `NEXT_PUBLIC_` プレフィックスで適切に分離
- [ ] Server Component からのみアクセスすべきデータが Client Component に漏洩していない
- [ ] middleware.ts でのリクエストヘッダー検証が適切

### Phase 6: 依存関係

```bash
npm audit --json 2>/dev/null | head -20
```

**チェック項目:**
- [ ] `npm audit` で critical/high の脆弱性がない
- [ ] サードパーティスクリプト（AdSense、GA4、A8.net）が最新

## 出力フォーマット

```markdown
## セキュリティレビュー結果

| 重大度 | カテゴリ | ファイル | 行 | 内容 | 対応 |
|---|---|---|---|---|---|
| CRITICAL | シークレット露出 | src/lib/api.ts | 42 | API キーがハードコード | 環境変数に移動 |
| HIGH | SQLi | packages/db/query.ts | 15 | 文字列結合で SQL 構築 | Drizzle パラメータ化 |
| MEDIUM | XSS | src/features/blog/md.tsx | 88 | dangerouslySetInnerHTML | DOMPurify 適用 |

### サマリー
- CRITICAL: N 件
- HIGH: N 件
- MEDIUM: N 件
- 全チェック項目: N/N 通過
```

## 関連スキル

- `/run-tests` — テスト実行
- `/verification-loop` — 6 段階品質ゲート
- `/deploy` — デプロイ前チェック
