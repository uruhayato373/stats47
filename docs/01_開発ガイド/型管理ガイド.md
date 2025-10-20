---
title: 型管理ガイド
created: 2025-01-19
updated: 2025-01-19
tags:
  - development-guide
  - types
  - architecture
---

# 型管理ガイド

## 1. 概要

このドキュメントでは、Stats47 プロジェクトにおける TypeScript 型定義の管理方針を説明します。ドメイン駆動設計（DDD）の原則に基づき、型定義を適切に配置し、保守性とスケーラビリティを向上させることを目的としています。

### 基本理念

- **コロケーション原則**: 型定義は、それを使用するコードの近くに配置する
- **ドメイン境界の明確化**: 各ドメインの型は独立して管理する
- **依存関係の方向性**: 上位ドメインから下位ドメインへの一方向依存を維持する

## 2. 基本方針

### 2.1 コロケーション原則

型定義は、それを使用するドメインロジックと同じディレクトリ内に配置します。これにより、以下のメリットが得られます：

- **発見しやすさ**: ドメインコードと型が同じ場所にある
- **保守性**: 型を変更する際、影響範囲が明確
- **テスト容易性**: ドメイン単位でのテストが可能

### 2.2 ドメイン駆動設計との整合性

型定義の配置は、ドメインの境界と一致させます：

- 各ドメインは独立した型定義を持つ
- ドメイン間の型の依存は最小限に抑制
- 共有型は明確に分離して管理

### 2.3 依存関係の方向性

```
src/types/shared/ (最上位)
    ↓
lib/domain/types/ (ドメイン固有)
    ↓
lib/domain/ (実装)
```

## 3. ディレクトリ構造

### 3.1 推奨構造

```
src/
├── types/                    # 真に共有される汎用型のみ
│   ├── shared/              # 複数ドメインで使用される基本型
│   │   ├── primitives.ts    # ID, Timestamp, Status等
│   │   ├── pagination.ts    # Page, Sort, Filter等
│   │   ├── table.ts         # 汎用テーブル型
│   │   └── utility.ts       # 型ユーティリティ
│   ├── external/            # 外部ライブラリの型拡張
│   │   └── next-auth.d.ts
│   └── index.ts             # 再エクスポート
│
└── lib/                     # ドメイン固有の型
    ├── area/
    │   └── types/           # Prefecture, Municipality, Region
    ├── auth/
    │   └── types/           # User, Session, AuthConfig
    ├── category/
    │   └── types/           # Category, Subcategory
    ├── estat-api/
    │   └── types/           # EstatMetaInfo, StatsData, StatsListItem
    ├── ranking/
    │   └── types/           # RankingItem, RankingConfig, RankingValue
    ├── database/
    │   └── estat/
    │       └── types/       # SavedMetadata, CacheData
    └── visualization/
        └── types/           # ChoroplethConfig, ChartConfig
```

### 3.2 src/types（共有型）

真に複数のドメインで共有される汎用型のみを配置します。

#### 配置基準

- **複数ドメインで使用**: 3 つ以上のドメインで使用される
- **汎用性**: 特定のドメインに依存しない
- **基本性**: 他の型の基盤となる

#### 例

```typescript
// src/types/shared/primitives.ts
export type ID = string;
export type Timestamp = string;
export type Status = "active" | "inactive" | "pending";

// src/types/shared/pagination.ts
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
```

### 3.3 lib/domain/types（ドメイン型）

各ドメイン固有の型定義を配置します。

#### 配置基準

- **ドメイン固有**: 特定のドメインでのみ使用される
- **ビジネスロジック**: ドメインの概念を表現する
- **実装詳細**: ドメインの実装に密接に関連

#### 例

```typescript
// lib/estat-api/types/meta-info.ts
export interface EstatMetaInfo {
  statsDataId: string;
  title: string;
  organization: string;
  surveyDate: string;
}

// lib/ranking/types/item.ts
export interface RankingItem {
  id: string;
  name: string;
  value: number;
  rank: number;
}
```

## 4. 型の分類

### 4.1 共有型（Shared Types）

複数のドメインで使用される汎用型です。

**配置場所**: `src/types/shared/`

**例**:

- 基本型: `ID`, `Timestamp`, `Status`
- UI 共通型: `Page`, `Sort`, `Filter`
- ユーティリティ型: `Optional`, `DeepPartial`

### 4.2 ドメイン型（Domain Types）

特定のドメインで使用される型です。

**配置場所**: `lib/domain/types/`

**例**:

- エンティティ型: `User`, `Prefecture`, `RankingItem`
- 値オブジェクト型: `Email`, `Address`, `Money`
- サービス型: `AuthService`, `RankingService`

### 4.3 外部型拡張（External Type Extensions）

外部ライブラリの型を拡張する型です。

**配置場所**: `src/types/external/`

**例**:

- Next.js 型拡張: `next-auth.d.ts`
- サードパーティ型拡張: `@types/custom-package.d.ts`

## 5. 命名規則

### 5.1 型名の命名

#### 基本規則

- **PascalCase**: 型名は PascalCase を使用
- **説明的**: 型の用途が明確に分かる名前
- **一貫性**: 同じ概念は同じ名前を使用

#### 例

```typescript
// ✅ 良い例
interface EstatMetaInfo {}
type UserStatus = "active" | "inactive";
interface RankingItem {}

// ❌ 悪い例
interface metaInfo {} // camelCase
type user_status = "active" | "inactive"; // snake_case
interface Item {} // 曖昧
```

### 5.2 ファイル名の命名

#### 基本規則

- **kebab-case**: ファイル名は kebab-case を使用
- **型名と一致**: 主要な型名とファイル名を一致させる
- **複数形**: 複数の型を含む場合は複数形を使用

#### 例

```typescript
// ✅ 良い例
// primitives.ts -> Primitives型群
// estat-meta-info.ts -> EstatMetaInfo型
// ranking-items.ts -> RankingItem型群

// ❌ 悪い例
// Primitives.ts  // PascalCase
// estatMetaInfo.ts  // camelCase
// item.ts  // 単数形（複数型を含む場合）
```

### 5.3 ディレクトリ構造

#### 基本規則

- **kebab-case**: ディレクトリ名は kebab-case
- **単数形**: ドメイン名は単数形を使用
- **階層化**: 必要に応じてサブディレクトリを作成

#### 例

```typescript
// ✅ 良い例
lib/estat-api/types/
lib/ranking/types/
lib/database/estat/types/

// ❌ 悪い例
lib/estatApi/types/  // camelCase
lib/rankings/types/  // 複数形
lib/database/Estat/types/  // PascalCase
```

## 6. import/export 規則

### 6.1 型のインポート方法

#### 基本規則

- **明示的インポート**: 必要な型のみを明示的にインポート
- **型専用インポート**: 型のみの場合は`import type`を使用
- **パスエイリアス**: `@/`エイリアスを使用

#### 例

```typescript
// ✅ 良い例
import type { EstatMetaInfo } from "@/lib/estat-api/types";
import { Page, Sort } from "@/types/shared";

// ❌ 悪い例
import { EstatMetaInfo } from "@/lib/estat-api/types"; // 型専用インポートではない
import * as Types from "@/types"; // 全体インポート
```

### 6.2 型の再エクスポート

#### 基本規則

- **index.ts 使用**: 各ディレクトリに index.ts を配置
- **再エクスポート**: 必要な型のみを再エクスポート
- **グループ化**: 関連する型をグループ化してエクスポート

#### 例

```typescript
// lib/estat-api/types/index.ts
export type { EstatMetaInfo } from "./meta-info";
export type { StatsData, StatsListItem } from "./stats-data";
export type { StatsListRequest, StatsListResponse } from "./stats-list";

// src/types/index.ts
export * from "./shared";
export * from "./external";
```

### 6.3 循環参照の回避

#### 基本規則

- **依存関係の方向性**: 上位から下位への一方向依存を維持
- **共通型の分離**: 複数ドメインで使用される型は共有型に分離
- **インターフェース使用**: 実装ではなくインターフェースに依存

#### 例

```typescript
// ✅ 良い例
// lib/ranking/types/item.ts
import type { ID } from "@/types/shared";

export interface RankingItem {
  id: ID;
  name: string;
}

// ❌ 悪い例
// 循環参照の例
// lib/estat-api/types/meta-info.ts
import type { RankingItem } from "@/lib/ranking/types";

// lib/ranking/types/item.ts
import type { EstatMetaInfo } from "@/lib/estat-api/types";
```

## 7. 移行ガイド

### 7.1 段階的移行アプローチ

#### Phase 1: 新規開発への適用

- 新規作成するドメインから方針を適用
- 既存コードは変更せず、新規コードのみ適用

#### Phase 2: 明確な重複の解消

- `src/types`と`lib`内で明確に重複している型を移動
- 例: `src/types/areas/` → `lib/area/types/`

#### Phase 3: ドメイン固有型の移動

- `src/types/models/`内の型を適切なドメインに移動
- 例: `src/types/models/user.ts` → `lib/auth/types/`

#### Phase 4: 共有型の整理

- `src/types`を真に共有される型のみに整理
- 不要な型定義を削除

#### Phase 5: ドキュメント更新

- 移行完了後にドキュメントを更新
- チーム内での方針共有

### 7.2 チェックリスト

#### 移行前の確認

- [ ] 対象型の使用箇所を特定
- [ ] 依存関係を確認
- [ ] テストの影響範囲を確認
- [ ] チーム内での合意を取得

#### 移行作業

- [ ] 新しい場所に型定義を移動
- [ ] import 文を更新
- [ ] テストを実行して動作確認
- [ ] 古い型定義を削除

#### 移行後の確認

- [ ] ビルドエラーがないことを確認
- [ ] テストが全て通ることを確認
- [ ] ドキュメントを更新
- [ ] チームに変更を通知

### 7.3 トラブルシューティング

#### よくある問題

**Q: 循環参照エラーが発生する**

A: 依存関係の方向性を確認し、共通型を`src/types/shared/`に分離してください。

**Q: 型が見つからないエラーが発生する**

A: import 文のパスが正しいか確認し、必要に応じて`index.ts`で再エクスポートしてください。

**Q: ビルドが遅くなる**

A: 不要な型の再エクスポートを削除し、必要な型のみをインポートしてください。

## 8. ベストプラクティス

### 8.1 型設計

- **単一責任**: 1 つの型は 1 つの責任を持つ
- **不変性**: 可能な限り不変な型を設計
- **明確性**: 型名から用途が明確に分かる

### 8.2 型配置

- **コロケーション**: 型は使用するコードの近くに配置
- **階層化**: 必要に応じてサブディレクトリを作成
- **一貫性**: プロジェクト全体で一貫した配置ルールを適用

### 8.3 型管理

- **定期的な見直し**: 定期的に型定義を見直し、整理
- **ドキュメント化**: 複雑な型はコメントで説明
- **テスト**: 型の変更時はテストを実行

## 9. よくある質問

### Q: どの型を`src/types`に配置すべきですか？

A: 3 つ以上のドメインで使用され、特定のドメインに依存しない汎用型のみを配置してください。

### Q: ドメイン間で型を共有したい場合はどうすればよいですか？

A: 共通型を`src/types/shared/`に分離し、各ドメインからインポートしてください。

### Q: 既存の型定義を移動する際の注意点は？

A: 段階的に移動し、各段階でテストを実行して動作確認を行ってください。

### Q: 型の命名で迷った場合は？

A: プロジェクト内の既存の命名パターンを参考にし、チーム内で相談してください。

## 10. 参考資料

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Colocation](https://kentcdodds.com/blog/colocation)

---

## 更新履歴

| 日付       | 更新者       | 更新内容 |
| ---------- | ------------ | -------- |
| 2025-01-19 | AI Assistant | 初版作成 |
