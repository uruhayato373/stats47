---
name: review-types
description: プロジェクト全体の型安全性をレビューする。Use when user says "型レビュー", "review-types", "tsc エラー直して". any/as キャスト検出・型推論改善.
disable-model-invocation: true
---

プロジェクト全体を型ファーストの観点でレビューし、型エラーの修正と型安全性の改善を行う。

## 引数

```
$ARGUMENTS — レビュー対象（以下のいずれか）
  - "fix":     tsc エラーを全て修正する（デフォルト）
  - "audit":   型安全性の監査レポートを生成する（修正はしない）
  - "strict":  fix + audit を両方実行
  - パス指定:  特定ディレクトリに絞ってレビュー（例: "features/ranking"）
```

## 手順

### Phase 1: tsc エラー収集

```bash
NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit -p apps/web/tsconfig.json 2>&1
```

Remotion がある場合は並列で:
```bash
cd apps/remotion && npx tsc --noEmit 2>&1
```

エラーを以下のカテゴリに分類する:

| カテゴリ | 例 | 優先度 |
|----------|-----|--------|
| 型不一致 | TS2345, TS2322 (型の代入互換性エラー) | 高 |
| 未定義参照 | TS2304, TS2552 (名前が見つからない) | 高 |
| プロパティ欠落 | TS2741, TS2339 (プロパティが存在しない) | 高 |
| 暗黙的 any | TS7006, TS7009, TS7031 (型が推論できない) | 中 |
| Import 解決 | TS2307 (モジュールが見つからない) | 中 |
| Unused | TS6133 (未使用変数) | 低 |

### Phase 2: エラー修正

各エラーについて:

1. **エラー箇所のコードを実際に読む**（推測で修正しない）
2. **根本原因を特定する**:
   - 型定義が古い（スキーマ変更に追従していない）
   - 型注釈が不足（推論が不正確）
   - import のシャドウイング（ローカル名が組み込み型を隠蔽）
   - テストの型がプロダクションコードと乖離
   - `as` キャストで型を握りつぶしている
3. **修正方針を決める**:
   - 型定義の追加・修正が最優先
   - `as any` は絶対に使わない
   - `as unknown as T` も可能な限り避ける
   - 明示的な return type 注釈の追加
   - ジェネリクスの型パラメータ明示

### Phase 3: 型安全性監査（"audit" or "strict" モード）

以下の観点で Grep/Glob でコードを走査する:

#### 3-1. `any` の使用

```bash
# any 型の使用箇所
grep -rn ': any' --include='*.ts' --include='*.tsx' apps/web/src/
grep -rn 'as any' --include='*.ts' --include='*.tsx' apps/web/src/
```

各 `any` について:
- **許容**: 外部ライブラリの型定義が不完全な場合
- **要修正**: ビジネスロジック内の any、関数パラメータの any

#### 3-2. 型アサーション (`as`)

```bash
grep -rn ' as [A-Z]' --include='*.ts' --include='*.tsx' apps/web/src/
```

各アサーションについて:
- **許容**: `as const`、定数リテラル型
- **要検討**: `as T` でダウンキャスト
- **要修正**: `as unknown as T` のダブルキャスト

#### 3-3. 非 null アサーション (`!`)

```bash
grep -rn '\w!' --include='*.ts' --include='*.tsx' apps/web/src/
```

- **許容**: DOM 参照（`ref.current!`）、確実に初期化済みの変数
- **要修正**: ビジネスロジック内の `!`（null チェックに置き換え）

#### 3-4. テストの型整合性

テストファイル内のモック・ヘルパーの型が実際の型と一致しているか:

```bash
grep -rn 'vi.fn()' --include='*.test.ts' --include='*.test.tsx' apps/web/src/
grep -rn 'as .* Mock' --include='*.test.ts' --include='*.test.tsx' apps/web/src/
```

#### 3-5. import シャドウイング

グローバル組み込み型（`Map`, `Set`, `Error`, `Response` 等）をローカル import でシャドウイングしていないか。

### Phase 4: レポート出力

修正を適用した後、再度 `tsc --noEmit` を実行して 0 エラーであることを確認。

"audit" / "strict" モードの場合、レポートを生成:

```
## 型安全性レビュー

実施日: YYYY-MM-DD
対象: {scope}
tsc エラー: {before} → {after}

### 修正した型エラー

| ファイル | エラー | 原因 | 修正内容 |
|----------|--------|------|----------|

### any 使用箇所

| ファイル | 行 | コード | 判定 | 備考 |
|----------|-----|--------|------|------|

### 型アサーション

| ファイル | 行 | コード | 判定 | 備考 |
|----------|-----|--------|------|------|

### テスト型整合性

| テストファイル | 問題 | 提案 |
|----------------|------|------|

### 改善提案（優先度順）

1. ...
2. ...
```

## 典型的な修正パターン

### Map コンストラクタのシャドウイング

lucide-react の `Map` アイコンがグローバル `Map` を隠蔽する:
```ts
// NG
import { Map } from "lucide-react";
new Map(entries); // TS7009: 'new' expression, whose target lacks a construct signature

// OK
import { Map as MapIcon } from "lucide-react";
```

### Drizzle ORM の型推論

`$inferSelect` から型を取得する:
```ts
// 明示的な return type で null を含める
export type MyRow = typeof myTable.$inferSelect;
export async function findOne(): Promise<MyRow | null> {
  const result = await db.select().from(myTable).limit(1);
  return result[0] ?? null;
}
```

### vitest モックの型

`vi.mock()` でファクトリを使うと型推論が壊れる場合がある:
```ts
// NG: ファクトリ内の vi.fn() は型を持たない
vi.mock("./module", () => ({ fn: vi.fn() }));

// OK: オートモックで型を保持
vi.mock("./module");
const mock = vi.mocked(fn);
```

### DB スキーマとの型同期

スキーマにカラム追加時、`toXxx()` 変換関数で新カラムをマッピングし忘れる:
```ts
// articles スキーマに seoTitle カラム追加後
function toArticle(row: ArticleRow): Article {
  return {
    ...row,        // スプレッドなら漏れない
    seoTitle: row.seoTitle,  // 明示マッピングなら追加必須
    content: "",
    frontmatter,
  };
}
```

## 注意

- **コードを実際に読んでから修正する。推測で修正しない**
- `as any` は絶対に使わない。型が合わない場合は根本原因を解決する
- テストファイルの型エラーも等しく重要。テストの型がプロダクションコードと乖離していると、テストの信頼性が下がる
- 修正は最小限に。型エラーの修正に付随するリファクタリングは行わない
- packages/ のコードの型エラーは `apps/web/tsconfig.json` では検出されない場合がある。`cd packages/{name} && npx tsc --noEmit` で個別確認
