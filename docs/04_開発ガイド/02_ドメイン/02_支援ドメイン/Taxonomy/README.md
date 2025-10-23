---
title: Taxonomy ドメイン開発ガイド
created: 2025-10-23
updated: 2025-10-23
tags:
  - domain/taxonomy
  - development-guide
---

# Taxonomy ドメイン開発ガイド

## 概要

Taxonomy（分類管理）ドメインは、統計データの分類体系を管理する支援ドメインです。カテゴリ・サブカテゴリの管理、ナビゲーション機能、データ正規化・バリデーション機能を提供します。

## ドキュメント構成

### 📋 実装ガイド

- [Category 実装ガイド](./Category実装ガイド.md) - CategoryService の使用方法とベストプラクティス
- [CategoryAPI リファレンス](./CategoryAPIリファレンス.md) - 全メソッドの詳細仕様

### 🏗️ アーキテクチャ

- [ドメイン設計](../../../01_技術設計/03_ドメイン設計/02_支援ドメイン/02_Taxonomy.md) - ドメインの設計思想とエンティティ定義

## サブドメイン

### Category（カテゴリ）✅ 実装済み

統計データの分類管理を担当するサブドメイン。

**主要機能:**

- カテゴリ・サブカテゴリの CRUD 操作
- 検索・フィルタリング・ソート機能
- ナビゲーション用データ提供
- データ正規化・バリデーション

**実装構造:**

```
src/lib/taxonomy/category/
├── types/
│   └── index.ts           # 型定義
├── service/
│   └── category.ts        # CategoryService（全機能を集約）
└── index.ts               # エクスポート管理
```

### Tag（タグ）🚧 未実装

統計データのタグ付け機能を提供するサブドメイン。

**予定機能:**

- タグの管理
- タグベースの検索・フィルタリング
- タグクラウド表示

### Filtering（フィルタリング）🚧 未実装

高度なフィルタリング機能を提供するサブドメイン。

**予定機能:**

- 複数条件の組み合わせ検索
- 動的フィルター生成
- フィルター結果の管理

## クイックスタート

### 基本的な使用

```typescript
import { CategoryService } from "@/lib/taxonomy/category";

// 全カテゴリを取得
const categories = CategoryService.getAllCategories();

// 特定のカテゴリを取得
const category = CategoryService.getCategoryById("population");

// サブカテゴリを取得
const result = CategoryService.getSubcategoryById("basic-population");
```

### ナビゲーション用データの取得

```typescript
import { getSidebarCategories } from "@/lib/taxonomy/category";

// サイドバー用のカテゴリデータを取得
const categories = getSidebarCategories();
```

### バリデーション

```typescript
import { validateSubcategoryOrThrow } from "@/lib/taxonomy/category";

// サブカテゴリのバリデーション（無効な場合は404エラー）
const subcategoryData = validateSubcategoryOrThrow(
  "population",
  "basic-population"
);
```

## 主要な型定義

```typescript
// カテゴリ
interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  displayOrder?: number;
  subcategories?: Subcategory[];
}

// サブカテゴリ
interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  href?: string;
  displayOrder?: number;
}

// 検索オプション
interface CategorySearchOptions {
  query?: string;
  includeSubcategories?: boolean;
}
```

## パフォーマンス

- **応答時間**: 基本操作 1ms 以下、検索 10ms 以下
- **メモリ使用量**: 全データ最大 1MB
- **スケーラビリティ**: 最大 100 カテゴリ、1000 サブカテゴリ

## セキュリティ

- 入力値の検証
- 型安全性の確保
- 読み取り専用データの保護

## テスト

- 単体テスト: `src/lib/taxonomy/category/__tests__/`
- テストカバレッジ: 90%以上
- モックデータによるテスト

## 移行ガイド

### 旧パスからの移行

**変更前:**

```typescript
import { CategoryService } from "@/lib/category";
import { getSidebarCategories } from "@/lib/category/server-navigation";
```

**変更後:**

```typescript
import { CategoryService, getSidebarCategories } from "@/lib/taxonomy/category";
```

### 削除された機能

- `color-mapping.ts` - カラーマッピング機能は削除されました
- `navigation.ts` - 機能は`CategoryService`に統合されました
- `server-navigation.ts` - 機能は`CategoryService`に統合されました

## トラブルシューティング

### よくある問題

1. **インポートエラー**

   - 旧パス`@/lib/category`から新パス`@/lib/taxonomy/category`に変更してください

2. **型エラー**

   - 型定義は`src/lib/taxonomy/category/types/index.ts`に移動しました

3. **色機能のエラー**
   - カラーマッピング機能は削除されました。代替のスタイリング手法を使用してください

## 更新履歴

### v2.0.0 (2025-10-23)

- **BREAKING CHANGE**: `src/lib/category`から`src/lib/taxonomy/category`に移行
- **BREAKING CHANGE**: カラーマッピング機能を削除
- **改善**: 全機能を`CategoryService`に統合
- **改善**: より明確な DDD 的な構造に再編

### v1.0.0 (2024-01-XX)

- 初回リリース
- 基本的なカテゴリ管理機能
- 検索・フィルタリング・ソート機能
- バリデーション機能

## サポート

- ドキュメント: このディレクトリ内の各ファイル
- 実装例: [Category 実装ガイド](./Category実装ガイド.md)
- API 仕様: [CategoryAPI リファレンス](./CategoryAPIリファレンス.md)
