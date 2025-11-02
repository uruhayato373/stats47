# Issue #12: ranking_items データベース更新エラーの調査結果

## 問題の概要

URL: `http://localhost:3000/agriculture/agricultural-household/ranking/agricultural-income-ratio`

ranking_itemsテーブルのデータを編集フォームから更新しようとすると、エラーが発生する。

## 調査日時

2025-11-02

## 影響範囲

- ランキング項目の編集機能全般
- 管理画面でのランキング設定更新

## 根本原因の分析

コードレビューの結果、以下の3つの重大な問題を特定しました。

### 1. UPDATE文の設計問題

**ファイル**: `src/features/ranking/shared/repositories/ranking-queries.ts:67-82`

現在のUPDATE文は全てのフィールドを常に更新する設計になっています：

```sql
UPDATE ranking_items
SET
  label = ?,
  ranking_name = ?,
  annotation = ?,
  unit = ?,
  is_active = ?,
  map_color_scheme = ?,
  map_diverging_midpoint = ?,
  ranking_direction = ?,
  conversion_factor = ?,
  decimal_places = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE ranking_key = ? AND area_type = ?
```

**問題点**:
- 部分更新ができない
- 更新したくないフィールドも強制的に更新される
- 値を渡さないフィールドはnullになってしまう可能性がある

### 2. バインド値の処理問題

**ファイル**: `src/features/ranking/shared/repositories/ranking-repository.ts:283-299`

バインド処理で `||` 演算子を使用しているため、falsyな値（0、空文字列など）が正しく処理されません：

```typescript
.bind(
  updates.label || null,                    // 空文字列の場合nullになる
  updates.name || null,                     // 空文字列の場合nullになる
  updates.annotation || null,               // 空文字列の場合nullになる
  updates.unit || null,                     // 空文字列の場合nullになる
  updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : null,
  updates.mapColorScheme || null,           // 空文字列の場合nullになる
  updates.mapDivergingMidpoint || null,     // 空文字列の場合nullになる
  updates.rankingDirection || null,         // 空文字列の場合nullになる
  updates.conversionFactor || null,         // 0の場合nullになる ← 重大な問題！
  updates.decimalPlaces || null,            // 0の場合nullになる ← 重大な問題！
  rankingKey,
  areaType
)
```

**問題となる具体的なケース**:

1. **数値フィールドで0を設定したい場合**
   - `conversionFactor: 0` → `0 || null` → `null` に変換されてしまう
   - `decimalPlaces: 0` → `0 || null` → `null` に変換されてしまう
   - これらのフィールドは`NOT NULL DEFAULT`なので、スキーマ定義によりデフォルト値（1と0）に戻ってしまう可能性がある

2. **空文字列を設定したい場合**
   - `label: ""` → `"" || null` → `null` に変換
   - labelは`NOT NULL`なのでSQLエラーになる可能性がある

3. **部分更新の際**
   - 更新したくないフィールドを`undefined`で渡すと、`undefined || null` で `null` になる
   - NOT NULL制約のあるフィールドでエラーになる

### 3. データベーススキーマとの不整合

**スキーマ定義** (`database/schemas/main.sql:129-149`):

```sql
CREATE TABLE IF NOT EXISTS ranking_items (
  ranking_key TEXT NOT NULL,
  area_type TEXT NOT NULL,
  label TEXT NOT NULL,           -- NOT NULL
  ranking_name TEXT NOT NULL,    -- NOT NULL
  annotation TEXT,               -- NULL許可
  unit TEXT NOT NULL,            -- NOT NULL
  group_key TEXT,
  display_order_in_group INTEGER DEFAULT 0,
  map_color_scheme TEXT DEFAULT 'interpolateBlues',
  map_diverging_midpoint TEXT DEFAULT 'zero',
  ranking_direction TEXT DEFAULT 'desc',
  conversion_factor REAL DEFAULT 1,        -- DEFAULT 1
  decimal_places INTEGER DEFAULT 0,        -- DEFAULT 0
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ranking_key, area_type),
  ...
);
```

**問題点**:
- `label`, `ranking_name`, `unit`はNOT NULL制約があるため、nullを設定しようとするとエラーになる
- `conversion_factor`のデフォルト値は1だが、0を設定しようとすると現在のロジックではnullになり、デフォルト値の1に戻ってしまう可能性がある
- `decimal_places`のデフォルト値は0だが、意図的に0を設定しようとすると正しく処理されない

## 解決策

### 解決策1: UPDATE文を動的に構築する（推奨）

更新するフィールドのみをSET句に含めるよう、UPDATE文を動的に構築します。

**変更ファイル**: `src/features/ranking/shared/repositories/ranking-repository.ts`

```typescript
async updateRankingItem(
  rankingKey: string,
  areaType: "prefecture" | "city" | "national",
  updates: {
    label?: string;
    name?: string;
    annotation?: string;
    unit?: string;
    isActive?: boolean;
    mapColorScheme?: string;
    mapDivergingMidpoint?: string;
    rankingDirection?: "asc" | "desc";
    conversionFactor?: number;
    decimalPlaces?: number;
  }
): Promise<boolean> {
  try {
    // 更新するフィールドのみを抽出
    const setClauses: string[] = [];
    const bindValues: any[] = [];

    if (updates.label !== undefined) {
      setClauses.push("label = ?");
      bindValues.push(updates.label);
    }
    if (updates.name !== undefined) {
      setClauses.push("ranking_name = ?");
      bindValues.push(updates.name);
    }
    if (updates.annotation !== undefined) {
      setClauses.push("annotation = ?");
      bindValues.push(updates.annotation || null);
    }
    if (updates.unit !== undefined) {
      setClauses.push("unit = ?");
      bindValues.push(updates.unit);
    }
    if (updates.isActive !== undefined) {
      setClauses.push("is_active = ?");
      bindValues.push(updates.isActive ? 1 : 0);
    }
    if (updates.mapColorScheme !== undefined) {
      setClauses.push("map_color_scheme = ?");
      bindValues.push(updates.mapColorScheme);
    }
    if (updates.mapDivergingMidpoint !== undefined) {
      setClauses.push("map_diverging_midpoint = ?");
      bindValues.push(updates.mapDivergingMidpoint);
    }
    if (updates.rankingDirection !== undefined) {
      setClauses.push("ranking_direction = ?");
      bindValues.push(updates.rankingDirection);
    }
    if (updates.conversionFactor !== undefined) {
      setClauses.push("conversion_factor = ?");
      bindValues.push(updates.conversionFactor);
    }
    if (updates.decimalPlaces !== undefined) {
      setClauses.push("decimal_places = ?");
      bindValues.push(updates.decimalPlaces);
    }

    // 更新するフィールドがない場合はエラー
    if (setClauses.length === 0) {
      throw new Error("No fields to update");
    }

    // updated_atは常に更新
    setClauses.push("updated_at = CURRENT_TIMESTAMP");

    // 動的にUPDATE文を構築
    const query = `
      UPDATE ranking_items
      SET ${setClauses.join(", ")}
      WHERE ranking_key = ? AND area_type = ?
    `;

    // WHERE句のパラメータを追加
    bindValues.push(rankingKey, areaType);

    const result = await this.db
      .prepare(query)
      .bind(...bindValues)
      .run();

    return result.success;
  } catch (error) {
    console.error("Failed to update ranking item:", error);
    throw error;
  }
}
```

**メリット**:
- 部分更新が可能
- 0や空文字列を正しく処理できる
- 更新したくないフィールドはそのまま保持される
- 型安全性を保ちながら柔軟な更新が可能

**デメリット**:
- コードが長くなる
- SQLクエリが動的に生成されるため、デバッグがやや複雑

### 解決策2: COALESCE関数を使用する（代替案）

既存のUPDATE文を保持しつつ、COALESCE関数を使って値がnullの場合は既存の値を保持します。

**変更ファイル**: `src/features/ranking/shared/repositories/ranking-queries.ts`

```sql
updateRankingItem: `
  UPDATE ranking_items
  SET
    label = COALESCE(?, label),
    ranking_name = COALESCE(?, ranking_name),
    annotation = ?,
    unit = COALESCE(?, unit),
    is_active = COALESCE(?, is_active),
    map_color_scheme = COALESCE(?, map_color_scheme),
    map_diverging_midpoint = COALESCE(?, map_diverging_midpoint),
    ranking_direction = COALESCE(?, ranking_direction),
    conversion_factor = COALESCE(?, conversion_factor),
    decimal_places = COALESCE(?, decimal_places),
    updated_at = CURRENT_TIMESTAMP
  WHERE ranking_key = ? AND area_type = ?
`,
```

**変更ファイル**: `src/features/ranking/shared/repositories/ranking-repository.ts`

```typescript
.bind(
  updates.label !== undefined ? updates.label : null,
  updates.name !== undefined ? updates.name : null,
  updates.annotation !== undefined ? (updates.annotation || null) : null,
  updates.unit !== undefined ? updates.unit : null,
  updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : null,
  updates.mapColorScheme !== undefined ? updates.mapColorScheme : null,
  updates.mapDivergingMidpoint !== undefined ? updates.mapDivergingMidpoint : null,
  updates.rankingDirection !== undefined ? updates.rankingDirection : null,
  updates.conversionFactor !== undefined ? updates.conversionFactor : null,
  updates.decimalPlaces !== undefined ? updates.decimalPlaces : null,
  rankingKey,
  areaType
)
```

**メリット**:
- 既存のクエリ構造を維持できる
- コード変更が比較的小さい
- 0や空文字列を正しく処理できる

**デメリット**:
- 全てのフィールドを常に評価する必要がある
- annotationのようにnullを明示的に設定したい場合に問題が生じる可能性がある

## 推奨される実装手順

### ステップ1: 解決策1（動的UPDATE文）を実装

1. `src/features/ranking/shared/repositories/ranking-repository.ts`の`updateRankingItem`メソッドを上記のコードに置き換える
2. 既存の`QUERIES.updateRankingItem`は使用しないため、削除するか非推奨マークを付ける

### ステップ2: テストを実行

1. 開発サーバーを起動
2. `http://localhost:3000/agriculture/agricultural-household/ranking/agricultural-income-ratio`にアクセス
3. 編集ボタンをクリックして編集モーダルを開く
4. 以下のケースをテスト：
   - 全てのフィールドを更新
   - 一部のフィールドのみを更新
   - `decimalPlaces`に0を設定
   - `conversionFactor`に0を設定（もし許可する場合）
   - 空の`annotation`を設定

### ステップ3: ログを確認

編集フォームには詳細なログが既に仕込まれているため、以下を確認：
- フォームのバリデーション結果
- 送信される値
- サーバーサイドのレスポンス
- データベース更新の成功/失敗

## 関連ファイル

- `src/features/ranking/items/actions/updateRankingItem.ts:21-38` - Server Action
- `src/features/ranking/items/components/admin/EditRankingItemButton.tsx:28-93` - ボタンとハンドラー
- `src/features/ranking/items/components/admin/EditRankingItemModal.tsx:50-72` - モーダルのsubmit処理
- `src/features/ranking/items/components/admin/forms/EditRankingItemForm.tsx:113-184` - フォームのsubmit処理とバリデーション
- `src/features/ranking/shared/repositories/ranking-repository.ts:266-306` - リポジトリの更新メソッド
- `src/features/ranking/shared/repositories/ranking-queries.ts:67-82` - SQLクエリ定義
- `database/schemas/main.sql:129-149` - テーブルスキーマ

## 追加の推奨事項

1. **エラーハンドリングの改善**
   - NOT NULL制約違反などのデータベースエラーを適切にキャッチしてユーザーフレンドリーなメッセージを表示
   - バリデーションエラーとデータベースエラーを区別

2. **型定義の統一**
   - `RankingItemDB`の`ranking_name`と、アプリケーション層の`RankingItem`の`name`の対応関係を明確化
   - コンバーターでの変換ロジックを確認

3. **テストの追加**
   - ランキング項目更新機能のユニットテスト
   - 境界値テスト（0、空文字列、nullなど）

## 次のアクション

- [ ] 解決策1を実装する
- [ ] テストを実行して動作確認
- [ ] エラーハンドリングを改善
- [ ] 型定義を見直す
- [ ] テストコードを追加
