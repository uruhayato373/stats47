# コーディング標準

CLAUDE.md の既存規約（UI コンポーネント規約、e-Stat API データ取得規約、melta-ui デザインシステム）を補完するコーディング標準。

## TypeScript

### Immutability

```typescript
// GOOD: スプレッド演算子で新オブジェクト作成
const updated = { ...user, name: "New" };
const appended = [...items, newItem];

// BAD: 直接変更
user.name = "New";
items.push(newItem);
```

### Early Return

```typescript
// GOOD
if (!user) return;
if (!user.isActive) return;
// 処理

// BAD: 深いネスト
if (user) {
  if (user.isActive) {
    // 処理
  }
}
```

### 型安全

- `any` 禁止 — `unknown` + 型ガード or 具体的な型を使う
- `as` キャスト最小化 — 型推論が効く設計を優先
- `??` / `?.` を活用 — `||` による falsy 値の誤処理を防ぐ

### 命名規則

- 関数: 動詞 + 名詞（`fetchRankingData`, `calculateRegression`）
- boolean: `is/has/should` プレフィックス（`isActive`, `hasPermission`）
- 定数: SCREAMING_SNAKE_CASE（`MAX_RETRIES`, `DEFAULT_LIMIT`）
- magic number 禁止 — 名前付き定数に抽出

## React / Next.js

### Server / Client 分離

- デフォルトは Server Component（`"use client"` なし）
- `useState`, `useEffect`, イベントハンドラがある場合のみ `"use client"`
- Server Component から Client Component にシリアライズ可能なデータのみ渡す

### Dynamic Import

```typescript
// 重いコンポーネント: next/dynamic で遅延ロード
const HeavyChart = dynamic(
  () => import("@stats47/visualization/d3/BarChart").then((m) => m.BarChart),
  { ssr: false }
);
```

### 条件付きレンダリング

```typescript
// GOOD: 短絡評価
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}

// BAD: 三項演算子のネスト
{isLoading ? <Spinner /> : error ? <Error /> : data ? <Data /> : null}
```

## パフォーマンス

### 並列実行

```typescript
// GOOD: 独立したクエリは Promise.all
const [items, count, stats] = await Promise.all([
  fetchItems(),
  fetchCount(),
  fetchStats(),
]);

// BAD: 不必要な逐次実行
const items = await fetchItems();
const count = await fetchCount();
```

### DB クエリ

- `SELECT *` 禁止 — 必要なカラムのみ指定
- `LIMIT` を常に指定（一覧取得時）
- インデックスが効くカラムで WHERE

## テスト

### AAA パターン

```typescript
test("正しくランクを計算する", () => {
  // Arrange
  const values = [100, 200, 300];

  // Act
  const ranks = rankByValue(values);

  // Assert
  expect(ranks).toEqual([3, 2, 1]);
});
```

### テスト命名

```typescript
// GOOD: 振る舞いを記述
test("クエリが空の場合に空配列を返す", () => {});
test("API キーが未設定の場合にエラーをスローする", () => {});

// BAD: 曖昧
test("動作する", () => {});
test("テスト", () => {});
```
