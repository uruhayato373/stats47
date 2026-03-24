# metadataディレクトリの責務

## 概要

`lib/metadata/`ディレクトリは、**ドメイン非依存のメタデータ生成ユーティリティ**を提供します。

## 基本原則

### 配置すべきもの

- **ドメイン非依存のメタデータ生成**: 入力が文字列や汎用的な型のみで、ドメイン固有のロジックを含まない関数
- **汎用的なOGP生成**: `og-generator.ts`のように、任意のタイトル・説明文からOGPメタデータを生成する関数
- **汎用的なcanonical URL生成**: `canonical-generator.ts`のように、任意のURLからcanonical URLを生成する関数

### 配置すべきでないもの

- **ドメイン固有のメタデータ生成**: ドメイン型（`Tag`, `RankingItem`など）に依存するメタデータ生成
  - 正しい配置先: `features/{domain}/utils/`
  - 例: タグページのメタデータ生成 → `features/tags/utils/tag-metadata.ts`
  - 例: ランキングページのメタデータ生成 → `features/ranking/utils/generate-meta-data.ts`

## 判断フローチャート

メタデータ生成関数を追加する場合：

```
┌───────────────────────────────┐
│ ドメイン固有の型やロジックが必要？ │
└──────────────┬────────────────┘
               │
     ┌─────────┴─────────┐
     │ Yes               │ No
     ▼                   ▼
┌─────────────────┐  ┌─────────────────┐
│ features/       │  │ lib/metadata/   │
│ {domain}/utils/ │  │                 │
│ に配置          │  │ に配置          │
└─────────────────┘  └─────────────────┘
```

## 現在の構成

```
lib/metadata/
├── og-generator.ts        ✅ ドメイン非依存（OK）
├── canonical-generator.ts ✅ ドメイン非依存（OK）
└── README.md
```

## 例

### ✅ Good: ドメイン非依存のメタデータ生成

```typescript
// lib/metadata/og-generator.ts
export function generateOpenGraph({
  title,
  description,
  imageUrl,
}: {
  title: string;
  description: string;
  imageUrl?: string;
}): Metadata {
  // 汎用的なOGP生成
}
```

### ❌ Bad: ドメイン固有のメタデータ生成

```typescript
// ❌ lib/metadata/tag-metadata.ts（誤り）
import type { Tag } from "@/features/tags/types/tag";
export function generateTagMetadata(tag: Tag): Metadata {
  // タグドメイン固有のロジック
}
```

**正しい配置先**: `features/tags/utils/tag-metadata.ts`

## 関連ドキュメント

- [lib層とfeatures層の責務分担](../../../../docs/01_技術設計/01_システム概要/06_lib層とfeatures層の責務分担.md)
