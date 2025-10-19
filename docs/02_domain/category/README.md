---
title: カテゴリ管理ドメイン
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/category
  - README.md
---

# カテゴリ管理ドメイン

## 概要

カテゴリ管理ドメインは、統計全体で共通のカテゴリ・サブカテゴリ管理機能を提供するドメインです。統計データの分類、ナビゲーション、検索の基盤となる重要なドメインです。

## ドキュメント構成

### 📋 仕様書 (specifications/)

- [ドメイン概要](./specifications/overview.md) - ドメインの目的、責任、価値
- [データ構造](./specifications/data-structure.md) - 型定義、JSON 構造、整合性ルール
- [API 仕様](./specifications/api-specification.md) - CategoryService の詳細な API 仕様

### 🚀 実装ガイド (implementation/)

- [はじめに](./implementation/getting-started.md) - 基本的な使用方法とセットアップ
- [ナビゲーション機能](./implementation/navigation.md) - ナビゲーション用の便利関数
- [ベストプラクティス](./implementation/best-practices.md) - 推奨される実装パターン
- [使用例](./implementation/examples.md) - 具体的な実装例

### 🔄 リファクタリング (refactoring/)

- [移行ガイド](./refactoring/migration-guide.md) - 既存コードからの移行手順

## クイックスタート

### 1. 基本的な使用

```typescript
import { CategoryService } from "@/lib/category";

// 全カテゴリを取得
const categories = CategoryService.getAllCategories();

// 特定のカテゴリを取得
const category = CategoryService.getCategoryById("tech");

// サブカテゴリを取得
const result = CategoryService.getSubcategoryById("programming");
```

### 2. 検索・フィルタリング

```typescript
// カテゴリ名で検索
const searchResults = CategoryService.getAllCategories({
  query: "テクノロジー",
  includeSubcategories: true,
});

// フィルタリング
const filtered = CategoryService.getAllCategories({
  hasSubcategories: true,
  field: "name",
  order: "asc",
});
```

### 3. ナビゲーション機能

```typescript
import { getCategoriesForSidebar } from "@/lib/category";

// サイドバー用のカテゴリデータを取得
const categories = getCategoriesForSidebar();

// ナビゲーション表示用のカテゴリ一覧を取得
const navigationCategories = getNavigationCategories();
```

### 4. バリデーション

```typescript
// カテゴリIDのバリデーション
const validation = CategoryService.validateCategoryId("tech");
if (!validation.isValid) {
  console.error("エラー:", validation.errors);
}
```

## 主要機能

### ✅ カテゴリ管理

- カテゴリ・サブカテゴリの取得
- ID による検索
- 階層構造の管理

### 🧭 ナビゲーション機能

- サイドバー用データの取得
- ナビゲーション表示用データの取得
- 表示順序でのソート
- サブカテゴリ情報の変換

### 🔍 検索・フィルタリング

- カテゴリ名での検索
- サブカテゴリ名での検索
- 条件によるフィルタリング
- 複数条件の組み合わせ

### 📊 ソート・表示制御

- 名前、表示順序、ID でのソート
- 昇順・降順の指定
- 表示順序の管理

### ✅ バリデーション

- カテゴリ・サブカテゴリ ID の検証
- 詳細なエラーメッセージ
- 型安全性の確保

### 📈 統計情報

- カテゴリ数の統計
- サブカテゴリ数の統計
- 利用状況の分析

## アーキテクチャ

```
categories.json
    ↓
CategoryService
    ↓
型安全なAPI
    ↓
UI Components
```

## データソース

- **設定ファイル**: `src/config/categories.json`
- **型定義**: `src/lib/category/types/`
- **サービス**: `src/lib/category/category-service.ts`

## 関連ドメイン

- **統計データドメイン**: カテゴリに分類される統計データ
- **ダッシュボードドメイン**: カテゴリを表示する UI
- **認証ドメイン**: ユーザー認証（必要に応じて）

## パフォーマンス

- **応答時間**: 基本操作 1ms 以下、検索 10ms 以下
- **メモリ使用量**: 全データ最大 1MB
- **スケーラビリティ**: 最大 100 カテゴリ、1000 サブカテゴリ

## セキュリティ

- 入力値の検証
- 型安全性の確保
- 読み取り専用データの保護

## テスト

- 単体テスト: `src/lib/category/__tests__/`
- テストカバレッジ: 90%以上
- モックデータによるテスト

## 更新履歴

### v1.0.0 (2024-01-XX)

- 初回リリース
- 基本的なカテゴリ管理機能
- 検索・フィルタリング・ソート機能
- バリデーション機能
- 統計情報機能

## サポート

- ドキュメント: このディレクトリ内の各ファイル
- 実装例: `implementation/examples.md`
- トラブルシューティング: `implementation/best-practices.md`

## ライセンス

このプロジェクトの一部として、同じライセンスが適用されます。
