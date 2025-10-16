# カテゴリ管理ドメイン - データ構造

## 概要

カテゴリ管理ドメインで使用されるデータ構造の詳細仕様です。

## 基本データ構造

### Category（カテゴリ）

統計データの主要な分類を表すエンティティです。

```typescript
interface Category {
  id: string; // カテゴリID（一意）
  name: string; // カテゴリ名（表示用）
  icon?: string; // アイコン（絵文字またはアイコン名）
  color?: string; // 色（Tailwind CSSの色名）
  description?: string; // 説明文
  displayOrder?: number; // 表示順序（数値が小さいほど上位）
  subcategories?: Subcategory[]; // サブカテゴリ一覧
}
```

#### フィールド詳細

| フィールド      | 型              | 必須 | 説明                           | 例                                   |
| --------------- | --------------- | ---- | ------------------------------ | ------------------------------------ |
| `id`            | `string`        | ✅   | カテゴリの一意識別子           | `"tech"`, `"lifestyle"`              |
| `name`          | `string`        | ✅   | ユーザーに表示される名前       | `"テクノロジー"`, `"ライフスタイル"` |
| `icon`          | `string`        | ❌   | アイコン（絵文字推奨）         | `"💻"`, `"🏠"`                       |
| `color`         | `string`        | ❌   | 色の識別子                     | `"blue"`, `"green"`                  |
| `description`   | `string`        | ❌   | カテゴリの説明文               | `"技術関連の統計データ"`             |
| `displayOrder`  | `number`        | ❌   | 表示順序（デフォルト: 配列順） | `1`, `2`, `3`                        |
| `subcategories` | `Subcategory[]` | ❌   | サブカテゴリの配列             | `[{...}, {...}]`                     |

### Subcategory（サブカテゴリ）

カテゴリの下位分類を表すエンティティです。

```typescript
interface Subcategory {
  id: string; // サブカテゴリID（一意）
  categoryId: string; // 親カテゴリのID
  name: string; // サブカテゴリ名（表示用）
  href?: string; // リンク先URL
  displayOrder?: number; // 表示順序
  dashboardComponent?: string; // ダッシュボードコンポーネント名
}
```

#### フィールド詳細

| フィールド           | 型       | 必須 | 説明                                 | 例                                 |
| -------------------- | -------- | ---- | ------------------------------------ | ---------------------------------- |
| `id`                 | `string` | ✅   | サブカテゴリの一意識別子             | `"programming"`, `"gadgets"`       |
| `categoryId`         | `string` | ✅   | 親カテゴリの ID                      | `"tech"`                           |
| `name`               | `string` | ✅   | ユーザーに表示される名前             | `"プログラミング"`, `"ガジェット"` |
| `href`               | `string` | ❌   | サブカテゴリページの URL             | `"/tech/programming"`              |
| `displayOrder`       | `number` | ❌   | 表示順序（デフォルト: 配列順）       | `1`, `2`                           |
| `dashboardComponent` | `string` | ❌   | 使用するダッシュボードコンポーネント | `"ProgrammingDashboard"`           |

## 設定データ構造

### categories.json

カテゴリ・サブカテゴリの設定を格納する JSON ファイルです。

```json
[
  {
    "id": "tech",
    "name": "テクノロジー",
    "icon": "💻",
    "color": "blue",
    "subcategories": [
      {
        "id": "programming",
        "name": "プログラミング",
        "href": "/tech/programming",
        "dashboardComponent": "ProgrammingDashboard",
        "displayOrder": 1
      },
      {
        "id": "gadgets",
        "name": "ガジェット",
        "href": "/tech/gadgets",
        "dashboardComponent": "GadgetsDashboard",
        "displayOrder": 2
      }
    ]
  }
]
```

#### JSON 構造の制約

1. **配列形式**: ルート要素は配列である必要があります
2. **一意性**: 各カテゴリ・サブカテゴリの ID は一意である必要があります
3. **階層関係**: サブカテゴリの`categoryId`は親カテゴリの`id`と一致する必要があります
4. **必須フィールド**: `id`と`name`は必須です

## 検索・フィルタリング用データ構造

### CategorySearchOptions（検索オプション）

```typescript
interface CategorySearchOptions {
  query?: string; // 検索クエリ
  includeSubcategories?: boolean; // サブカテゴリも検索対象に含めるか
}
```

### CategoryFilterOptions（フィルタオプション）

```typescript
interface CategoryFilterOptions {
  hasSubcategories?: boolean; // サブカテゴリを持つカテゴリのみ
  categoryIds?: string[]; // 特定のカテゴリIDのみ
}
```

### CategorySortOptions（ソートオプション）

```typescript
interface CategorySortOptions {
  field: "name" | "displayOrder" | "id"; // ソート対象フィールド
  order: "asc" | "desc"; // ソート順序
}
```

## 検索結果データ構造

### CategorySearchResult（検索結果）

```typescript
interface CategorySearchResult {
  categories: Category[]; // マッチしたカテゴリ
  subcategories: Subcategory[]; // マッチしたサブカテゴリ
  totalCount: number; // 総件数
}
```

### SubcategorySearchResult（サブカテゴリ検索結果）

```typescript
interface SubcategorySearchResult {
  category: Category; // 親カテゴリ
  subcategory: Subcategory; // サブカテゴリ
}
```

## バリデーション結果データ構造

### CategoryValidationResult（バリデーション結果）

```typescript
interface CategoryValidationResult {
  isValid: boolean; // バリデーション成功フラグ
  errors: string[]; // エラーメッセージの配列
}
```

## 統計情報データ構造

### CategoryStats（カテゴリ統計）

```typescript
interface CategoryStats {
  totalCategories: number; // 総カテゴリ数
  totalSubcategories: number; // 総サブカテゴリ数
  categoriesWithSubcategories: number; // サブカテゴリを持つカテゴリ数
  categoriesWithoutSubcategories: number; // サブカテゴリを持たないカテゴリ数
}
```

## データの整合性ルール

### 1. ID の一意性

- カテゴリ ID は全体で一意である必要があります
- サブカテゴリ ID は全体で一意である必要があります
- カテゴリ ID とサブカテゴリ ID が重複してはいけません

### 2. 階層関係の整合性

- サブカテゴリの`categoryId`は存在するカテゴリの`id`と一致する必要があります
- カテゴリが削除される場合、そのサブカテゴリも削除される必要があります

### 3. 表示順序の整合性

- `displayOrder`が指定されている場合、重複してはいけません
- 未指定の場合は配列の順序が使用されます

### 4. 必須フィールドの存在

- `id`と`name`は空文字列や null であってはいけません
- 文字列フィールドは適切な長さである必要があります

## データの拡張性

### 将来の拡張予定フィールド

```typescript
interface Category {
  // 既存フィールド...

  // 将来追加予定
  parentId?: string; // 親カテゴリID（階層の深さ拡張用）
  tags?: string[]; // タグ（検索・フィルタ用）
  isActive?: boolean; // アクティブ状態
  createdAt?: string; // 作成日時
  updatedAt?: string; // 更新日時
  metadata?: Record<string, any>; // メタデータ（拡張用）
}

interface Subcategory {
  // 既存フィールド...

  // 将来追加予定
  tags?: string[]; // タグ
  isActive?: boolean; // アクティブ状態
  metadata?: Record<string, any>; // メタデータ
}
```

## パフォーマンス考慮事項

### 1. データサイズの制限

- カテゴリ数: 最大 100 件
- サブカテゴリ数: カテゴリあたり最大 50 件
- 総サブカテゴリ数: 最大 1000 件

### 2. 検索パフォーマンス

- インデックス: `id`、`name`フィールドにインデックス
- キャッシュ: 頻繁にアクセスされるデータはキャッシュ
- 遅延読み込み: 必要に応じてサブカテゴリを遅延読み込み

### 3. メモリ使用量

- 全データのメモリ使用量: 最大 1MB
- 個別カテゴリのメモリ使用量: 最大 10KB
