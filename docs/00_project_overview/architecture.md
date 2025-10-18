---
title: システムアーキテクチャ
created: 2024-10-14
updated: 2024-10-14
tags:
  - stats47
  - アーキテクチャ
  - 技術スタック
  - データベース
  - API設計
  - ダッシュボード
---

# システムアーキテクチャ

## 概要

地域統計ダッシュボードは、Next.js 15 の App Router を使用したフルスタック Web アプリケーションです。

クライアントサイドレンダリング（CSR）とサーバーサイドレンダリング（SSR）を組み合わせて、高速でユーザーフレンドリーな体験を提供します。
e-Stat API との統合には、自前で実装した型安全な API クライアント（`src/lib/estat/`, `src/services/estat-api.ts`）を使用しています。

## データベースアーキテクチャ

### 環境別データ取得戦略

stats47 プロジェクトでは、4 つの環境に応じて適切なデータソースを自動選択するアーキテクチャを採用しています。

#### 環境別データソース

| 環境            | データソース  | 接続方法                    | 用途                      |
| --------------- | ------------- | --------------------------- | ------------------------- |
| **mock**        | JSON ファイル | `data/mock/database/*.json` | オフライン開発、Storybook |
| **development** | ローカル D1   | `.wrangler/state/v3/d1`     | ローカル開発              |
| **staging**     | リモート D1   | Cloudflare D1 API           | 本番前テスト              |
| **production**  | リモート D1   | Cloudflare D1 API           | 本番運用                  |

#### データフロー

```
[Server Component]
        ↓
[Data Access Layer (自動環境判定)]
        ↓
    ┌───┴───┬────────┬──────────┐
    ↓       ↓        ↓          ↓
  [Mock] [Local D1] [Remote D1] [Remote D1]
  (JSON)  (SQLite)  (Staging)   (Production)
```

### Cloudflare D1 データベース

stats47 プロジェクトでは、Cloudflare D1 を基盤とした統合データベース設計を採用しています。

#### 主要テーブル構成

- **認証・ユーザー管理**: `users`
- **e-Stat メタデータ**: `estat_metainfo`, `estat_data_history`
- **ランキング設定管理**: `subcategory_configs`, `ranking_items`
- **地図可視化設定**: `ranking_visualizations`

#### 環境設定

- **開発環境**: ローカル D1（SQLite）
- **ステージング環境**: リモート D1（stats47_staging）
- **本番環境**: リモート D1（stats47）
- **バインディング**: `STATS47_DB` (wrangler.toml)
- **スキーマ管理**: 統合スキーマによる一元管理

詳細なテーブル設計については、[データベース設計](../04_仕様/データベース設計.md)を参照してください。

## 技術スタック詳細

### フロントエンドフレームワーク

#### Next.js 15

- **App Router**: ファイルベースのルーティング
- **Turbopack**: 高速な開発ビルド
- **TypeScript**: 型安全性の確保
- **Tailwind CSS 4**: ユーティリティファースト CSS

#### React 19

- **Hooks**: useState, useEffect, useCallback
- **Server Components**: パフォーマンス最適化
- **Concurrent Features**: 非同期レンダリング

### e-Stat API 統合

#### @estat/パッケージ

- **@estat/types**: e-Stat API の完全な型定義
- **@estat/client**: e-Stat API クライアントライブラリ
- **@estat/utils**: データ処理と変換ユーティリティ

#### 型安全性の特徴

- **完全な API 対応**: e-Stat API の全エンドポイントに対応
- **自動型推論**: TypeScript による厳密な型チェック
- **開発体験向上**: IntelliSense とエラー検出
- **保守性**: 最新の API 仕様への自動対応

### データ可視化

#### Recharts

- **LineChart**: 時系列データの表示
- **BarChart**: カテゴリ別データの表示
- **PieChart**: 比率データの表示
- **ResponsiveContainer**: レスポンシブ対応

#### D3.js

- **データ操作**: 統計データの前処理
- **カスタムチャート**: 特殊な可視化ニーズ

### 状態管理

#### React State

- **Local State**: コンポーネント固有の状態
- **Lifted State**: 親子間での状態共有
- **Context API**: グローバル状態の管理

## ディレクトリ構造

### アトミックデザインによるコンポーネント設計

stats47 プロジェクトでは、アトミックデザインの原則に基づいてコンポーネントを階層化し、再利用性と保守性を向上させています。

```
src/
├── app/                    # Next.js App Router。ルーティングとページの定義
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # ホームページ
│   ├── [category]/        # カテゴリページ（動的ルーティング）
│   │   └── [subcategory]/ # サブカテゴリページ
│   │       ├── page.tsx   # → dashboard にリダイレクト
│   │       ├── dashboard/ # ダッシュボードページ
│   │       │   ├── page.tsx # → dashboard/00000 にリダイレクト
│   │       │   └── [areaCode]/page.tsx # ダッシュボード（全国・都道府県）
│   │       └── ranking/page.tsx # ランキングページ
│   ├── choropleth/        # コロプレスマップ表示ページ
│   └── estat/             # e-Stat関連の各機能ページ
├── components/             # Reactコンポーネント（アトミックデザイン）
│   ├── atoms/             # アトム（最小単位のコンポーネント）
│   │   ├── Button/        # ボタンコンポーネント
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── Input/         # 入力フィールドコンポーネント
│   │   ├── Icon/          # アイコンコンポーネント
│   │   ├── Badge/         # バッジコンポーネント
│   │   ├── Card/          # カードコンポーネント
│   │   ├── Loading/       # ローディングコンポーネント
│   │   └── Tooltip/       # ツールチップコンポーネント
│   ├── molecules/         # モレキュール（アトムの組み合わせ）
│   │   ├── SearchBox/     # 検索ボックス
│   │   │   ├── SearchBox.tsx
│   │   │   ├── SearchBox.stories.tsx
│   │   │   └── index.ts
│   │   ├── DataTable/     # データテーブル
│   │   ├── Chart/         # チャートコンポーネント
│   │   ├── FormField/     # フォームフィールド
│   │   ├── Navigation/    # ナビゲーション
│   │   ├── Filter/        # フィルターコンポーネント
│   │   └── ExportButton/  # エクスポートボタン
│   ├── organisms/         # オルガニズム（ドメイン別に管理）
│   │   ├── auth/          # 認証ドメイン
│   │   │   ├── LoginForm/
│   │   │   ├── UserMenu/
│   │   │   └── AuthGuard/
│   │   ├── area/          # 地域ドメイン
│   │   │   ├── RegionSelector/
│   │   │   ├── PrefectureSelector/
│   │   │   └── MunicipalitySelector/
│   │   ├── estat-api/     # e-Stat API ドメイン
│   │   │   ├── EstatDataTable/
│   │   │   ├── EstatChart/
│   │   │   └── EstatMetadata/
│   │   ├── ranking/       # ランキングドメイン
│   │   │   ├── RankingTable/
│   │   │   ├── RankingCard/
│   │   │   └── RankingFilter/
│   │   ├── visualization/ # 可視化ドメイン
│   │   │   ├── ChoroplethMap/
│   │   │   ├── StatisticsCard/
│   │   │   ├── LineChart/
│   │   │   └── BarChart/
│   │   ├── dashboard/     # ダッシュボードドメイン
│   │   │   ├── Dashboard/
│   │   │   ├── StatisticsOverview/
│   │   │   └── DataSummary/
│   │   ├── category/      # カテゴリドメイン
│   │   │   ├── CategorySelector/
│   │   │   ├── SubcategoryList/
│   │   │   └── CategoryFilter/
│   │   ├── export/        # エクスポートドメイン
│   │   │   ├── ExportPanel/
│   │   │   ├── DataExporter/
│   │   │   └── ExportSettings/
│   │   └── common/        # 共通オルガニズム
│   │       ├── Header/
│   │       ├── Sidebar/
│   │       ├── Navigation/
│   │       └── Footer/
│   ├── templates/         # テンプレート（ページレイアウト）
│   │   ├── DashboardLayout/    # ダッシュボードレイアウト
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── index.ts
│   │   ├── RankingLayout/      # ランキングレイアウト
│   │   ├── CategoryLayout/     # カテゴリレイアウト
│   │   └── AuthLayout/         # 認証レイアウト
│   └── pages/             # ページ（テンプレート + データ）
│       ├── HomePage/      # ホームページ
│       │   ├── HomePage.tsx
│       │   └── index.ts
│       ├── CategoryPage/  # カテゴリページ
│       ├── DashboardPage/ # ダッシュボードページ
│       └── RankingPage/   # ランキングページ
├── atoms/                  # Jotaiのatom定義
├── config/                 # 設定ファイル (例: カテゴリ定義)
│   └── categories.json
├── contexts/               # React Context
│   └── ThemeContext.tsx   # テーマ状態管理
├── hooks/                  # カスタムフック
├── lib/                    # ユーティリティ関数、クライアントライブラリ
├── providers/              # アプリケーション全体で利用するプロバイダー
├── services/               # 外部APIとの通信サービス
├── types/                  # TypeScriptの型定義
├── middleware.ts           # Next.jsのミドルウェア
└── worker.ts               # Cloudflare Workerのエントリーポイント
```

### アトミックデザインの階層構造

#### 1. Atoms（アトム）

最小単位のコンポーネント。それ以上分割できない基本的な UI 要素。

**特徴**:

- 単一の責任を持つ
- 他のコンポーネントに依存しない
- 再利用性が高い
- プロパティでカスタマイズ可能

**例**:

- `Button`: ボタンコンポーネント
- `Input`: 入力フィールド
- `Icon`: アイコン表示
- `Badge`: バッジ表示
- `Card`: カードコンテナ

#### 2. Molecules（モレキュール）

複数のアトムを組み合わせて作られる、機能的にまとまったコンポーネント。

**特徴**:

- 2-3 個のアトムを組み合わせ
- 特定の機能を持つ
- 再利用可能
- **ドメイン知識を保有しない**（純粋な UI コンポーネント）
- **ビジネスロジックを含まない**
- プロパティを通じて外部から制御される

**例**:

- `SearchBox`: 検索入力 + 検索ボタン（検索ロジックは外部から注入）
- `DataTable`: テーブル + ページネーション（データの処理は外部で実行）
- `FormField`: ラベル + 入力 + エラーメッセージ（バリデーションロジックは外部から注入）
- `ExportButton`: ボタン + アイコン + ローディング状態（エクスポート処理は外部で実行）

#### 3. Organisms（オルガニズム）

複数のモレキュールを組み合わせて作られる、複雑な UI セクション。

**特徴**:

- 複数のモレキュールを組み合わせ
- 特定の機能領域を担当
- **ドメイン知識を含む**（ビジネスロジックを実装）
- ページの主要セクションを構成
- データの取得・変換・表示を統合

**例**:

- `organisms/auth/LoginForm`: 認証フォーム + バリデーション（認証ロジック）
- `organisms/area/RegionSelector`: 地域選択 + 階層表示（地域データの管理）
- `organisms/estat-api/EstatDataTable`: データテーブル + フィルター（e-Stat データの処理）
- `organisms/estat-api/EstatMetaInfoPageHeader`: e-Stat メタ情報ページ専用ヘッダー
- `organisms/ranking/RankingTable`: ランキング表示 + ソート（ランキングロジック）
- `organisms/visualization/ChoroplethMap`: 地図 + 凡例（地理データの可視化）
- `organisms/dashboard/Dashboard`: 統計カード + チャート（ダッシュボードロジック）
- `organisms/common/Header`: ロゴ + ナビゲーション（共通レイアウト）

#### 4. Templates（テンプレート）

ページのレイアウト構造を定義するコンポーネント。データを含まない。

**特徴**:

- ページの骨組みを定義
- オルガニズムの配置を管理
- データを含まない
- 再利用可能なレイアウト

**例**:

- `DashboardLayout`: ヘッダー + サイドバー + メインコンテンツ
- `RankingLayout`: ヘッダー + フィルター + ランキングテーブル
- `AuthLayout`: ロゴ + 認証フォーム + フッター

#### 5. Pages（ページ）

テンプレートに実際のデータを流し込んだ最終的なページ。

**特徴**:

- テンプレート + データ
- 特定の URL に対応
- ビジネスロジックを含む
- ユーザーが実際に見る画面

**例**:

- `HomePage`: ホームテンプレート + 統計データ
- `DashboardPage`: ダッシュボードテンプレート + 地域データ
- `RankingPage`: ランキングテンプレート + ランキングデータ

### ページ固有コンポーネントの配置ルール

ページ専用のヘッダーやコンテナなど、特定のページでのみ使用されるコンポーネントであっても、
**ドメイン知識とビジネスロジックを持つ場合は Organism**として配置します。

**正しい配置**:

- `organisms/estat-api/EstatMetaInfoPageHeader/` - e-Stat メタ情報ページのヘッダー
- `organisms/ranking/RankingSettingsHeader/` - ランキング設定ページのヘッダー

**誤った配置**:

- `estat-api/meta-info/Header/` - 機能ディレクトリ内の Header（アトミック階層が不明確）
- `pages/*/Header/` - ページディレクトリ内のコンポーネント（再利用性の欠如）

**判断基準**:

1. **ドメイン知識を持つか** - 特定のビジネス領域の知識を含む
2. **ビジネスロジックを含むか** - データの処理や状態管理を行う
3. **複数の Molecule を組み合わせているか** - 複雑な UI 構造を持つ
4. **ページの主要セクションを構成するか** - ページの重要な部分を担当する

これらの条件を満たす場合は、たとえ特定のページでのみ使用されるコンポーネントであっても、
アトミックデザインの Organism レイヤーに配置し、適切な命名規則に従います。

## 型定義アーキテクチャ

### 概要

stats47 プロジェクトでは、ドメイン駆動設計（DDD）の原則に基づいて型定義を管理し、コードの保守性と型安全性を向上させています。

### 設計原則

#### コロケーション原則による型の配置

型定義は「ドメインロジックと共に配置する」（Co-location with Domain Logic）原則に従い、以下のように配置されています：

1. **共有型（Shared Types）**: 真に複数のドメインで共有される汎用的な型のみ
2. **ドメイン型（Domain Types）**: 特定のドメインに特化した型（各ドメイン内で管理）
3. **外部型拡張（External Type Extensions）**: 外部ライブラリの型拡張

### 推奨ディレクトリ構造

```
src/
├── types/                      # 共有型（真に共有される汎用型のみ）
│   ├── shared/                 # 複数ドメインで共有される汎用型
│   │   ├── primitives.ts      # ID, Timestamp, Status等の基本型
│   │   ├── pagination.ts      # Page, Sort, Filter等のUI共通型
│   │   ├── table.ts           # 汎用テーブル型
│   │   └── utility.ts         # 型ユーティリティ
│   ├── external/              # 外部ライブラリの型拡張
│   │   └── next-auth.d.ts
│   └── index.ts               # 再エクスポート
│
└── lib/                        # ドメイン固有の型（各ドメイン内で管理）
    ├── area/
    │   └── types/             # Prefecture, Municipality, Region
    ├── auth/
    │   └── types/             # User, Session, AuthConfig
    ├── category/
    │   └── types/             # Category, Subcategory
    ├── estat-api/
    │   └── types/             # EstatMetaInfo, StatsData, StatsListItem
    ├── ranking/
    │   └── types/             # RankingItem, RankingConfig, RankingValue
    ├── database/
    │   └── estat/
    │       └── types/         # SavedMetadata, CacheData
    └── visualization/
        └── types/             # ChoroplethConfig, ChartConfig
```

### 型定義の配置ルール

#### 共有型（src/types/shared/）

真に複数のドメインで使用される汎用的な型のみを配置します。

**配置基準**:

- 3 つ以上のドメインで使用される型
- 特定のドメインに依存しない汎用型
- プリミティブ型の拡張

**例**:

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

**インポート**:

```typescript
import { ID, Timestamp, Page } from "@/types/shared";
// または
import { ID, Timestamp } from "@/types"; // src/types/index.ts経由
```

#### ドメイン型（lib/domain/types/）

各ドメイン固有の型を、そのドメインのロジックと共に配置します。

**配置基準**:

- 特定のドメインでのみ使用される型
- ドメインロジックに密接に関連する型
- ビジネス概念を表現する型

**例**:

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

**インポート**:

```typescript
import { EstatMetaInfo } from "@/lib/estat-api/types";
import { RankingItem } from "@/lib/ranking/types";
```

#### 外部型拡張（src/types/external/）

外部ライブラリの型を拡張する型を配置します。

**例**:

```typescript
// src/types/external/next-auth.d.ts
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
    };
  }
}
```

### 型定義のベストプラクティス

#### 1. 型の命名規則

```typescript
// ✅ 良い例: 明確で説明的な名前
export interface EstatMetaInfo { ... }
export interface RankingItem { ... }
export type AreaType = 'prefecture' | 'municipality';

// ❌ 悪い例: 曖昧で短すぎる名前
export interface Item { ... }
export interface Meta { ... }
export type AT = 'p' | 'm';
```

#### 2. 型の分割

```typescript
// ✅ 良い例: 関連する型をファイルごとにグループ化
// src/lib/ranking/types/item.ts
export interface RankingItem { ... }
export interface RankingValue { ... }
export interface RankingOption<T> { ... }

// ❌ 悪い例: すべての型を1つのファイルに
// src/lib/ranking/types/index.ts
export interface RankingItem { ... }
export interface EstatMetaInfo { ... } // 異なるドメイン
export interface PaginationParams { ... } // 共有型
```

#### 3. 型の再利用

```typescript
// ✅ 良い例: 既存の型を拡張
export interface RankingItemDB extends RankingItem {
  created_at: string;
  updated_at: string;
}

// ❌ 悪い例: 重複した型定義
export interface RankingItemDB {
  id: string;
  subcategoryId: string;
  // ... すべてのフィールドを再定義
  created_at: string;
  updated_at: string;
}
```

#### 4. 型のドキュメント

````typescript
// ✅ 良い例: JSDocでドキュメント化
/**
 * ランキングアイテム
 *
 * @remarks
 * サブカテゴリーごとのランキングデータを表します。
 * データベースから取得した生データと、
 * 表示用にフォーマットされたデータの両方を含みます。
 *
 * @example
 * ```typescript
 * const item: RankingItem = {
 *   id: "tokyo-population-2023",
 *   subcategoryId: "basic-population",
 *   areaCode: "13000",
 *   value: 14000000,
 *   rank: 1
 * };
 * ```
 */
export interface RankingItem {
  id: string;
  subcategoryId: string;
  areaCode: string;
  value: number;
  rank: number;
}
````

### 型定義の移行履歴

#### 移行前の構造（レガシー）

```
src/types/
├── models/
│   ├── ranking.ts              # ランキング型
│   └── r2/
│       └── estat-metainfo-cache.ts # R2キャッシュ型
├── ranking/
│   └── unified.ts              # 統一ランキングデータ型
├── visualization/
│   └── ranking-options.ts      # ランキング可視化オプション型
└── common/                     # 共通型
    ├── pagination.ts
    └── table.ts
```

**問題点**:

- 型定義がドメインロジックから分離されている
- 同じドメインの型が複数の場所に散在
- インポートパスが複雑で保守が困難

#### 移行後の構造（現在）

```
src/
├── types/shared/               # 共有型（統合）
│   ├── pagination.ts
│   └── table.ts
├── lib/ranking/types/          # ランキングドメイン型
│   ├── item.ts                # 旧: models/ranking.ts
│   ├── unified.ts             # 旧: ranking/unified.ts
│   └── visualization.ts       # 旧: visualization/ranking-options.ts
└── lib/database/estat/types/   # e-Statデータベース型
    └── r2-cache.ts            # 旧: models/r2/estat-metainfo-cache.ts
```

**改善点**:

- ドメインロジックと型定義が同じ場所に配置
- 型のインポートパスが明確で一貫性がある
- ドメインごとに型が整理され保守性が向上

### 関連ドキュメント

- [型定義ガイド](../01_development_guide/type-definitions-guide.md) - 型定義の詳細ガイド
- [コーディング規約](../02_開発/01_コーディング規約.md) - TypeScript コーディング規約

## e-Stat API 統合アーキテクチャ

### データフロー概要（拡張版）

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  ユーザー    │───►│ コンポーネント │───►│ estat-api   │───►│  e-Stat    │
│  インターフェース│    │             │    │ クライアント │    │    API     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐    ┌─────────────┐
                    │  サービス層  │    │  生API      │
                    │  (lib/estat) │    │  レスポンス  │
                    └─────────────┘    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ 拡張データ   │
                    │ フォーマッター │
                    │ (statsdata.ts)│
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  可視化     │
                    │  コンポーネント │
                    │ (品質表示含む) │
                    └─────────────┘
```

#### 拡張データフロー

1. **データ取得**: e-Stat API から生データを取得
2. **データ変換**: `EstatStatsDataFormatter.formatStatsData()`で拡張フォーマットに変換
3. **メタデータ追加**: 日付情報、データ品質、分類情報、注記を追加
4. **可視化**: 拡張されたメタデータを活用した UI 表示

### e-Stat API 統合の実装

stats47 プロジェクトでは、e-Stat API との統合を独自に実装しています。

#### アーキテクチャ

- **API クライアント** (`src/services/estat-api.ts`): HTTP 通信、エラーハンドリング、リトライ処理
- **サービス層** (`src/lib/estat/`): ビジネスロジック、データ変換、キャッシュ管理
- **型定義** (`src/lib/estat/types/`): TypeScript による完全な型安全性

#### サービス構成

1. **EstatMetaInfoService**: メタ情報の取得・処理
2. **EstatStatsDataService**: 統計データの取得・処理
3. **EstatStatsListService**: 統計リストの取得・処理
4. **EstatRelationalCacheService**: リレーショナルキャッシュ管理

#### 主要機能

- **型安全な API 呼び出し**: TypeScript による完全な型サポート
- **効率的なデータ処理**: 自動データ変換と正規化
- **エラーハンドリング**: 構造化されたエラー処理
- **D1 データベース統合**: Cloudflare D1 への自動保存

詳細な API 設計については、[API 設計](../04_仕様/API設計.md)を参照してください。

## 認証・セキュリティ

### Cloudflare D1

- **SQLite ベース**: エッジで動作するデータベースとして、アプリケーションのデータを保存します。

### セキュリティ設計

#### API 保護

- **CORS 設定**: 適切なオリジンからのリクエストのみを許可するように設定されています。

#### データ保護

- **プリペアドステートメント**: Cloudflare D1 へのクエリは、SQL インジェクションを防ぐためにプリペアドステートメントを利用することが推奨されます。
- **入力バリデーション**: フロントエンドとバックエンドの両方で、予期せぬ入力からシステムを保護するためのバリデーションが実装されています。
- **HTTPS 通信**: 本番環境では、通信はすべて HTTPS で暗号化され、データの盗聴や改ざんを防ぎます。

## パフォーマンス・スケーラビリティ

### フロントエンド最適化

- **コード分割**: 動的インポートによる遅延読み込み
- **画像最適化**: Next.js Image コンポーネント
- **キャッシュ戦略**: 静的データの効率的な提供

### バックエンド最適化

- **Cloudflare Workers**: エッジでの高速処理
- **D1 データベース**: エッジでのデータアクセス
- **非同期処理**: 並行処理による応答時間短縮

### スケーラビリティ

- **Cloudflare Workers**: 自動的なスケーリング
- **D1 データベース**: グローバル分散
- **CDN**: 静的アセットの高速配信

## 開発・デプロイ

### 開発環境

- **TypeScript**: 型安全性と開発体験の向上
- **ESLint**: コード品質の維持
- **Tailwind CSS**: 効率的なスタイリング

### ビルド・デプロイ

- **Next.js**: 最適化されたビルド
- **Cloudflare Pages**: エッジでのデプロイ
- **環境変数**: 適切な設定管理

## 監視・ログ

### フロントエンド監視

- **Core Web Vitals**: ユーザー体験の測定
- **エラー追跡**: クラッシュレポートの収集
- **パフォーマンス測定**: 読み込み時間の監視

### バックエンド監視

- **API 応答時間**: バックエンド処理の監視
- **エラー率**: システムの健全性確認
- **リソース使用量**: メモリ・CPU 使用率の監視

## API 設計概要

### e-Stat API 統合

- **ベース URL**: `https://api.e-stat.go.jp/rest/3.0/app/json`
- **認証**: アプリケーション ID（API キー）
- **データ形式**: JSON
- **制限**: 1 日あたりのリクエスト数制限あり

### 内部 API エンドポイント

- **ランキング取得 API**: カテゴリ一覧、ランキング一覧、検索機能
- **可視化設定 API**: 設定取得・保存、テンプレート管理
- **データ取得 API**: ランキングデータ、比較データ、時系列データ

### 主要機能

- **データ変換・処理**: API データの正規化、単位変換ロジック
- **パフォーマンス最適化**: キャッシュ戦略、バッチ処理
- **セキュリティ**: API キーの保護、入力検証

詳細な API 設計については、[API 設計](../04_仕様/API設計.md)を参照してください。

## ダッシュボードコンポーネントアーキテクチャ

### 概要

stats47 プロジェクトでは、全 67 個のダッシュボードコンポーネントに「複数コンポーネント + コンポーネント解決」パターンを適用した新しいアーキテクチャを採用しています。このアーキテクチャにより、全国用と都道府県用のダッシュボードを明確に分離し、それぞれに最適化された UI/UX を提供できます。

### 設計原則

#### 単一責任の原則

各ダッシュボードコンポーネントは、特定の地域レベル（全国または都道府県）に特化した責任を持ちます。

- **NationalDashboard**: 全国レベルの統計概要と分析
- **PrefectureDashboard**: 都道府県固有の詳細データと比較分析

#### 明確な分離

全国用と都道府県用のコンポーネントは完全に分離され、それぞれ独立して開発・保守できます。

#### 動的解決

`areaCode`パラメータに基づいて、実行時に適切なコンポーネントが動的に選択されます。

#### 後方互換性

既存の単一コンポーネントアーキテクチャとの互換性を維持し、段階的な移行を可能にします。

### アーキテクチャパターン

#### 複数コンポーネント + コンポーネント解決

```
┌─────────────────────────┐
│ /[category]/[subcategory]│
│ /dashboard/[areaCode]   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ getDashboardComponentByArea │
│ - areaCode判定          │
│ - categories.jsonから解決 │
└───────┬─────────────────┘
        │
        ├─ areaCode=00000 ─► NationalDashboard
        │                    - 全国統計概要
        │                    - 政策動向分析
        │                    - 全国トレンド
        │
        └─ areaCode≠00000 ─► PrefectureDashboard
                             - 都道府県詳細
                             - 全国比較
                             - 周辺地域比較
```

#### コンポーネント解決フロー

1. **URL 解析**: `/[category]/[subcategory]/dashboard/[areaCode]`
2. **areaCode 判定**: `areaCode === "00000"`で全国/都道府県を判定
3. **設定参照**: `categories.json`から適切なコンポーネント名を取得
4. **コンポーネント解決**: `componentMap`から実際のコンポーネントを取得
5. **レンダリング**: 解決されたコンポーネントをレンダリング

### コンポーネント解決システム

#### 解決関数

```typescript
// src/components/subcategories/index.tsx
export const getDashboardComponentByArea = (
  subcategoryId: string,
  areaCode: string,
  categoryId?: string
): React.ComponentType<SubcategoryDashboardPageProps> => {
  const subcategory = getSubcategoryInfo(subcategoryId, categoryId);

  if (!subcategory) {
    return DefaultDashboardPage;
  }

  const isNational = areaCode === "00000";

  // 新しいアーキテクチャ: 地域別コンポーネント
  if (isNational && subcategory.nationalDashboardComponent) {
    return (
      componentMap[subcategory.nationalDashboardComponent] ||
      DefaultDashboardPage
    );
  }

  if (!isNational && subcategory.prefectureDashboardComponent) {
    return (
      componentMap[subcategory.prefectureDashboardComponent] ||
      DefaultDashboardPage
    );
  }

  // フォールバック: 従来の単一コンポーネント
  if (subcategory.dashboardComponent) {
    return componentMap[subcategory.dashboardComponent] || DefaultDashboardPage;
  }

  return DefaultDashboardPage;
};
```

#### 設定ファイル構造

```json
{
  "id": "basic-population",
  "name": "基本人口",
  "href": "/basic-population",
  "dashboardComponent": "BasicPopulationNationalDashboard",
  "nationalDashboardComponent": "BasicPopulationNationalDashboard",
  "prefectureDashboardComponent": "BasicPopulationPrefectureDashboard",
  "displayOrder": 1
}
```

#### コンポーネントマッピング

```typescript
// src/components/subcategories/index.tsx
const componentMap: Record<string, React.ComponentType<any>> = {
  // 全国用ダッシュボード
  BasicPopulationNationalDashboard: BasicPopulationNationalDashboard,
  LandAreaNationalDashboard: LandAreaNationalDashboard,
  // ... 他の全国用コンポーネント

  // 都道府県用ダッシュボード
  BasicPopulationPrefectureDashboard: BasicPopulationPrefectureDashboard,
  LandAreaPrefectureDashboard: LandAreaPrefectureDashboard,
  // ... 他の都道府県用コンポーネント
};
```

### 実装ガイドライン

#### 命名規則

- **ファイル名**: `[Name]NationalDashboard.tsx`, `[Name]PrefectureDashboard.tsx`
- **コンポーネント名**: `[Name]NationalDashboard`, `[Name]PrefectureDashboard`
- **エクスポート名**: コンポーネント名と同じ

#### ディレクトリ構造

```
src/components/subcategories/[category]/[subcategory]/
├── [Name]NationalDashboard.tsx      # 全国用ダッシュボード
├── [Name]PrefectureDashboard.tsx    # 都道府県用ダッシュボード
└── index.tsx                        # エクスポート
```

#### プロパティインターフェース

```typescript
interface SubcategoryDashboardPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  areaCode: string;
}
```

#### 実装テンプレート

**NationalDashboard**

```tsx
"use client";

import React from "react";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const [Name]NationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="dashboard"
      areaCode={areaCode}
    >
      {/* 全国専用の統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* 統計カード */}
        </div>
      </div>

      {/* 全国専用の分析セクション */}
      <div className="px-4 pb-4">
        {/* 全国レベルの詳細分析 */}
      </div>
    </SubcategoryLayout>
  );
};
```

**PrefectureDashboard**

```tsx
"use client";

import React from "react";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const [Name]PrefectureDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="dashboard"
      areaCode={areaCode}
    >
      {/* 都道府県専用の統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* 統計カード */}
        </div>
      </div>

      {/* 都道府県詳細セクション */}
      <div className="px-4 pb-4">
        {/* 都道府県固有の詳細分析 */}
      </div>

      {/* 全国との比較セクション */}
      <div className="px-4 pb-4">
        {/* 全国平均との比較グラフ */}
      </div>
    </SubcategoryLayout>
  );
};
```

### メリット・デメリット

#### メリット

**明確な分離**

- 全国用と都道府県用で異なる UI/UX を提供
- 各コンポーネントが単一責任を持つ
- コードの可読性と保守性が向上

**拡張性**

- 新しい地域レベル（市区町村等）の追加が容易
- 各コンポーネントが独立して開発可能
- 段階的な機能追加が可能

**型安全性**

- TypeScript による厳密な型チェック
- コンパイル時のエラー検出
- 開発体験の向上

**パフォーマンス**

- 必要なコンポーネントのみをロード
- バンドルサイズの最適化
- レンダリング効率の向上

#### デメリット

**複雑性の増加**

- コンポーネント数の増加（2 倍）
- 設定ファイルの複雑化
- 学習コストの増加

**重複コード**

- 共通部分の重複実装
- メンテナンスコストの増加
- 一貫性の維持が困難

**移行コスト**

- 既存コンポーネントの移行作業
- テストケースの追加
- ドキュメントの更新

### 移行履歴

#### 移行対象コンポーネント

全 67 個のダッシュボードコンポーネントを以下のカテゴリーに分けて移行：

1. **landweather** (1 個)

   - `LandAreaDashboard` → `LandAreaNationalDashboard` + `LandAreaPrefectureDashboard`

2. **population** (1 個)

   - `BasicPopulationDashboard` → `BasicPopulationNationalDashboard` + `BasicPopulationPrefectureDashboard`

3. **laborwage** (8 個)

   - `WagesWorkingConditionsDashboard`
   - `LaborForceStructureDashboard`
   - `IndustrialStructureDashboard`
   - `CommutingEmploymentDashboard`
   - `LaborDisputesDashboard`
   - `JobSeekingPlacementDashboard`
   - `IndustryOccupationDashboard`
   - `EmploymentTypeDashboard`

4. **construction** (7 個)

   - `ConstructionManufacturingDashboard`
   - `HousingFacilitiesDashboard`
   - `HousingOwnershipDashboard`
   - `HousingStatisticsDashboard`
   - `HousingStructureDashboard`
   - `LivingEnvironmentDashboard`
   - `WelfareFacilitiesDashboard`

5. **economy** (6 個)

   - `EconomicIndicatorsDashboard`
   - `BusinessConditionsDashboard`
   - `TradeBalanceDashboard`
   - `PriceIndexDashboard`
   - `FinancialMarketsDashboard`
   - `EconomicGrowthDashboard`

6. **educationsports** (10 個)

   - `SchoolEnrollmentDashboard`
   - `EducationalFacilitiesDashboard`
   - `EducationalExpenditureDashboard`
   - `SportsFacilitiesDashboard`
   - `SportsParticipationDashboard`
   - `CulturalFacilitiesDashboard`
   - `LibraryServicesDashboard`
   - `MuseumServicesDashboard`
   - `EducationalAchievementDashboard`
   - `TeacherStaffDashboard`

7. **energy** (4 個)

   - `EnergyProductionDashboard`
   - `EnergyConsumptionDashboard`
   - `RenewableEnergyDashboard`
   - `EnergyEfficiencyDashboard`

8. **safetyenvironment** (5 個)

   - `EnvironmentalPollutionDashboard`
   - `AirQualityDashboard`
   - `WaterQualityDashboard`
   - `NoisePollutionDashboard`
   - `EnvironmentalProtectionDashboard`

9. **socialsecurity** (4 個)

   - `HealthInsuranceDashboard`
   - `MedicalFacilitiesDashboard`
   - `PublicHealthDashboard`
   - `SocialWelfareDashboard`

10. **administrativefinancial** (6 個)

    - `AdministrativeExpensesDashboard`
    - `FinancialManagementDashboard`
    - `PublicDebtDashboard`
    - `TaxRevenueDashboard`
    - `BudgetAllocationDashboard`
    - `GovernmentEfficiencyDashboard`

11. **infrastructure** (1 個)

    - `RoadsDashboard`

12. **international** (1 個)

    - `ForeignPopulationDashboard`

13. **tourism** (1 個)

    - `TourismAccommodationDashboard`

14. **agriculture** (1 個)

    - `AgriculturalHouseholdDashboard`

15. **miningindustry** (1 個)

    - `ManufacturingDashboard`

16. **commercial** (2 個)
    - `CommerceServiceIndustryDashboard`
    - `CommercialFacilitiesDashboard`

#### 移行手順

各コンポーネントに対して以下の手順で移行：

1. **NationalDashboard 作成**

   - 既存の`isNational`条件分岐の全国用部分を抽出
   - 全国専用の分析セクションを追加
   - 適切な命名規則でファイル作成

2. **PrefectureDashboard 作成**

   - 既存の`isNational`条件分岐の都道府県用部分を抽出
   - 都道府県固有の分析セクションを追加
   - 全国比較機能を強化

3. **エクスポート更新**

   - サブカテゴリーレベルの`index.tsx`
   - カテゴリーレベルの`index.tsx`
   - 全体の`index.tsx`

4. **設定ファイル更新**

   - `categories.json`に`nationalDashboardComponent`と`prefectureDashboardComponent`を追加

5. **旧コンポーネント削除**

   - 元の`*Dashboard.tsx`ファイルを削除

6. **テスト実行**
   - 全国表示テスト（`/dashboard/00000`）
   - 都道府県表示テスト（`/dashboard/13000`）
   - リンターエラーチェック

#### 移行完了

- **移行日**: 2025 年 1 月
- **移行コンポーネント数**: 67 個
- **新規作成ファイル数**: 134 個（67 × 2）
- **削除ファイル数**: 67 個
- **更新ファイル数**: 201 個（各カテゴリーの index.tsx + categories.json）

### よくある質問

#### Q1: なぜ単一コンポーネントから複数コンポーネントに移行したのですか？

**A**: 以下の理由から移行しました：

1. **明確な分離**: 全国用と都道府県用で異なる UI/UX を提供するため
2. **保守性向上**: 各コンポーネントが単一責任を持つため
3. **拡張性**: 新しい地域レベルの追加が容易なため
4. **型安全性**: TypeScript による厳密な型チェックのため

#### Q2: 既存の単一コンポーネントはどうなりますか？

**A**: 後方互換性を維持するため、`getDashboardComponentByArea`関数でフォールバック機能を提供しています。移行が完了していないコンポーネントは従来通り動作します。

#### Q3: 新しいサブカテゴリーを追加する際の手順は？

**A**: 以下の手順で追加してください：

1. `[Name]NationalDashboard.tsx`と`[Name]PrefectureDashboard.tsx`を作成
2. 各レベルの`index.tsx`にエクスポートを追加
3. `categories.json`に設定を追加
4. テストを実行

#### Q4: パフォーマンスへの影響はありますか？

**A**: 以下の理由でパフォーマンスが向上します：

1. **必要なコンポーネントのみロード**: 全国用と都道府県用で不要なコードをロードしない
2. **バンドルサイズ最適化**: 各コンポーネントが独立してバンドルされる
3. **レンダリング効率向上**: 条件分岐が不要になり、レンダリングが高速化

#### Q5: エラーが発生した場合の対処法は？

**A**: 以下の手順で対処してください：

1. **コンポーネント解決エラー**: `categories.json`の設定を確認
2. **エクスポートエラー**: 各レベルの`index.tsx`のエクスポートを確認
3. **型エラー**: `SubcategoryDashboardPageProps`の型定義を確認
4. **レンダリングエラー**: ブラウザの開発者ツールでエラーを確認

### トラブルシューティング

#### コンポーネントが解決されない

**症状**: ダッシュボードページでコンポーネントが表示されない

**原因**:

- `categories.json`の設定が正しくない
- コンポーネントマッピングに登録されていない
- エクスポートが正しくない

**対処法**:

1. `categories.json`の`nationalDashboardComponent`と`prefectureDashboardComponent`を確認
2. `src/components/subcategories/index.tsx`の`componentMap`を確認
3. 各レベルの`index.tsx`のエクスポートを確認

#### 型エラーが発生する

**症状**: TypeScript で型エラーが発生する

**原因**:

- `SubcategoryDashboardPageProps`の型定義が正しくない
- プロパティの型が一致しない

**対処法**:

1. `src/types/subcategory.ts`の型定義を確認
2. コンポーネントのプロパティ型を確認
3. インポート文を確認

#### レンダリングエラーが発生する

**症状**: ブラウザでエラーが表示される

**原因**:

- コンポーネントの実装に問題がある
- 依存関係が正しくない
- データの取得に失敗している

**対処法**:

1. ブラウザの開発者ツールでエラーを確認
2. コンポーネントの実装を確認
3. データの取得処理を確認

#### パフォーマンスが低下する

**症状**: ページの読み込みが遅い

**原因**:

- 不要なコンポーネントがロードされている
- データの取得が非効率
- レンダリングが重い

**対処法**:

1. ネットワークタブでリクエストを確認
2. パフォーマンスタブでボトルネックを特定
3. コンポーネントの最適化を実施

## アトミックデザインの実装ガイドライン

### コンポーネント作成ルール

#### 1. ディレクトリ構造

各コンポーネントは独立したディレクトリに配置し、以下のファイルを含める：

```
components/
├── atoms/
│   └── Button/
│       ├── Button.tsx          # メインコンポーネント
│       ├── Button.stories.tsx  # Storybook用ストーリー
│       ├── Button.test.tsx     # テストファイル
│       ├── Button.types.ts     # 型定義
│       └── index.ts            # エクスポート
```

#### 2. 命名規則

- **ディレクトリ名**: PascalCase（例: `Button`, `SearchBox`）
- **ファイル名**: PascalCase（例: `Button.tsx`）
- **コンポーネント名**: PascalCase（例: `Button`）
- **プロパティ**: camelCase（例: `onClick`, `isLoading`）

#### 3. エクスポート規則

```typescript
// index.ts
export { Button } from "./Button";
export type { ButtonProps } from "./Button.types";
```

#### 4. 型定義

```typescript
// Button.types.ts
export interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}
```

#### 5. Storybook ストーリー

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Atoms/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["primary", "secondary", "outline"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Button",
  },
};
```

### 階層間の依存関係

#### 依存関係のルール

1. **Atoms**: 他のコンポーネントに依存しない
2. **Molecules**: Atoms のみに依存（**ドメイン知識を持たない**）
3. **Organisms**: Molecules と Atoms に依存（**ドメイン知識を含む**）
4. **Templates**: Organisms、Molecules、Atoms に依存（**レイアウトのみ**）
5. **Pages**: Templates、Organisms、Molecules、Atoms に依存（**データとロジックを統合**）

#### ドメイン知識の分離

- **Atoms & Molecules**: 純粋な UI コンポーネント（ドメイン知識なし）
- **Organisms**: ドメイン知識を含む（ビジネスロジックを実装）
- **Templates**: レイアウト構造のみ（データを含まない）
- **Pages**: データとロジックを統合（最終的なページ）

#### インポート例

```typescript
// molecules/SearchBox/SearchBox.tsx（ドメイン知識なし）
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";

// organisms/auth/LoginForm/LoginForm.tsx（認証ドメイン）
import { SearchBox } from "@/components/molecules/SearchBox";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/atoms/Button";
import { useAuth } from "@/hooks/auth/useAuth"; // 認証ドメイン知識

// organisms/estat-api/EstatDataTable/EstatDataTable.tsx（e-Stat API ドメイン）
import { DataTable } from "@/components/molecules/DataTable";
import { Filter } from "@/components/molecules/Filter";
import { useEstatData } from "@/hooks/estat-api/useEstatData"; // e-Stat API ドメイン知識

// organisms/common/Header/Header.tsx（共通オルガニズム）
import { SearchBox } from "@/components/molecules/SearchBox";
import { Navigation } from "@/components/molecules/Navigation";
import { Logo } from "@/components/atoms/Logo";
```

#### ドメイン知識の分離例

```typescript
// ❌ 悪い例: molecules にドメイン知識を含む
const SearchBox = ({ data, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // ドメイン知識: 検索ロジック
  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  return (
    <div>
      <Input value={searchTerm} onChange={setSearchTerm} />
      <Button onClick={() => onSearch(filteredData)}>検索</Button>
    </div>
  );
};

// ✅ 良い例: molecules は純粋な UI コンポーネント
const SearchBox = ({ searchTerm, onSearchTermChange, onSearch }) => {
  return (
    <div>
      <Input
        value={searchTerm}
        onChange={onSearchTermChange}
        placeholder="検索..."
      />
      <Button onClick={onSearch}>検索</Button>
    </div>
  );
};

// ✅ 良い例: organisms でドメイン知識を管理（ドメイン別ディレクトリ）
// organisms/estat-api/EstatDataTable/EstatDataTable.tsx
const EstatDataTable = ({ statsDataId, areaCode }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isLoading, error } = useEstatData(statsDataId, areaCode);

  // ドメイン知識: e-Stat データの検索ロジック
  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((item) =>
      item.areaName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <SearchBox
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onSearch={() => {}} // リアルタイム検索の場合は不要
      />
      <DataTable data={filteredData} />
    </div>
  );
};
```

### コンポーネント設計のベストプラクティス

#### 1. 単一責任の原則

各コンポーネントは一つの責任のみを持つ。

```typescript
// ❌ 悪い例: 複数の責任を持つ
const UserCard = ({ user, onEdit, onDelete, showActions }) => {
  // ユーザー情報表示 + アクション処理 + 条件分岐
};

// ✅ 良い例: 単一責任
const UserCard = ({ user }) => {
  // ユーザー情報表示のみ
};

const UserActions = ({ onEdit, onDelete }) => {
  // アクション処理のみ
};
```

#### 2. プロパティの設計

必要最小限のプロパティを定義し、デフォルト値を適切に設定。

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  className = "",
}) => {
  // 実装
};
```

#### 3. コンポーネントの分割

大きすぎるコンポーネントは適切に分割する。

```typescript
// ❌ 悪い例: 大きすぎるコンポーネント
const Dashboard = () => {
  // ヘッダー、サイドバー、メインコンテンツ、フッターすべてを含む
};

// ✅ 良い例: 適切に分割
const Dashboard = () => {
  return (
    <DashboardLayout>
      <Header />
      <Sidebar />
      <MainContent>
        <StatisticsCards />
        <Charts />
        <DataTable />
      </MainContent>
    </DashboardLayout>
  );
};
```

#### 4. カスタムフックの活用

ロジックをコンポーネントから分離し、再利用可能にする。

```typescript
// hooks/useSearch.ts（ドメイン知識）
export const useSearch = (data: any[], searchTerm: string) => {
  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  return { filteredData };
};

// molecules/SearchBox/SearchBox.tsx（純粋な UI コンポーネント）
const SearchBox = ({ searchTerm, onSearchTermChange, onSearch }) => {
  return (
    <div>
      <Input
        value={searchTerm}
        onChange={onSearchTermChange}
        placeholder="検索..."
      />
      <Button onClick={onSearch}>検索</Button>
    </div>
  );
};

// organisms/SearchableDataTable/SearchableDataTable.tsx（ドメイン知識を含む）
const SearchableDataTable = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { filteredData } = useSearch(data, searchTerm);

  return (
    <div>
      <SearchBox
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onSearch={() => {}} // リアルタイム検索の場合は不要
      />
      <DataTable data={filteredData} />
    </div>
  );
};
```

### テスト戦略

#### 1. ユニットテスト

各コンポーネントに対してユニットテストを実装。

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

#### 2. 統合テスト

コンポーネント間の連携をテスト。

```typescript
// SearchBox.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBox } from "./SearchBox";

describe("SearchBox", () => {
  it("filters data when typing", async () => {
    const mockData = [
      { id: 1, name: "Tokyo" },
      { id: 2, name: "Osaka" },
    ];
    const onSearch = jest.fn();

    render(<SearchBox data={mockData} onSearch={onSearch} />);

    fireEvent.change(screen.getByPlaceholderText("検索..."), {
      target: { value: "Tokyo" },
    });

    expect(onSearch).toHaveBeenCalledWith([{ id: 1, name: "Tokyo" }]);
  });
});
```

### パフォーマンス最適化

#### 1. React.memo の活用

不要な再レンダリングを防ぐ。

```typescript
const Button = React.memo<ButtonProps>(({ children, onClick, ...props }) => {
  return (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  );
});
```

#### 2. useCallback の活用

関数の再作成を防ぐ。

```typescript
const SearchBox = ({ data, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = useCallback(
    (term: string) => {
      const filtered = data.filter((item) =>
        item.name.toLowerCase().includes(term.toLowerCase())
      );
      onSearch(filtered);
    },
    [data, onSearch]
  );

  return (
    <Input
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value);
        handleSearch(e.target.value);
      }}
    />
  );
};
```

#### 3. 遅延読み込み

大きなコンポーネントは遅延読み込みする。

```typescript
const LazyChoroplethMap = lazy(() => import("./ChoroplethMap"));

const Dashboard = () => {
  return (
    <Suspense fallback={<Loading />}>
      <LazyChoroplethMap />
    </Suspense>
  );
};
```

## 今後の拡張予定

### 機能拡張

- **ソーシャルログイン**: 利便性の向上
- **権限管理**: ロールベースアクセス制御
- **API 制限**: レート制限の実装
- **比較・分析機能**: 複数ランキング比較、時系列分析、相関分析
- **ユーザー体験向上**: 検索・フィルタ機能、お気に入り機能、共有機能

### 技術的拡張

- **GraphQL**: 効率的なデータ取得
- **WebSocket**: リアルタイムデータ更新
- **PWA**: オフライン対応とネイティブアプリ体験
- **新しいデータソース**: 他の統計 API、リアルタイムデータ、民間データ
- **データ形式の拡張**: CSV/Excel エクスポート、JSON-LD、GraphQL

### アトミックデザインの拡張

- **デザインシステム**: 統一されたデザイントークン
- **コンポーネントライブラリ**: 再利用可能なコンポーネント集
- **Storybook**: コンポーネントのドキュメント化
- **ビジュアルリグレッションテスト**: デザインの一貫性確保

## 関連ドキュメント

### プロジェクト理解

- [プロジェクト概要](01_概要.md) - プロジェクトの全体像
- [ロードマップ](./03_ロードマップ.md) - 開発計画とマイルストーン

### 要件定義

- [プロジェクト要件定義書](../03_要件定義/01_プロジェクト要件.md) - プロジェクトの背景、目的、技術スタック
- [機能要件定義書](../03_要件定義/02_機能要件.md) - 実装する機能の詳細
- [非機能要件定義書](../03_要件定義/03_非機能要件.md) - パフォーマンス、セキュリティ要件

### 技術詳細

- [データベース設計](../04_仕様/データベース設計.md) - データベーススキーマの詳細
- [API 設計](../04_仕様/API設計.md) - エンドポイントと実装の詳細
- [型定義](../04_仕様/型定義.md) - TypeScript 型定義
- [認証システム](../04_仕様/認証システム.md) - 認証システムの仕様

### 開発ガイド

- [コーディング規約](../02_開発/01_コーディング規約.md) - 開発標準
- [コンポーネントガイド](../02_開発/02_コンポーネントガイド.md) - コンポーネント設計方針
- [パフォーマンス最適化ガイド](../02_開発/08_パフォーマンス最適化ガイド.md) - 高速ページ読み込み実装方法

### ビジネス戦略

- [マネタイズ戦略](../08_ビジネス計画/01_マネタイズ戦略.md) - 収益化戦略

## 更新履歴

- **2024-01-XX**: 初版作成
- **2024-01-XX**: e-Stat API 統合の追加
- **2024-01-XX**: @estat/パッケージ統合の追加
- **2024-01-XX**: 認証機能の実装
- **2024-01-XX**: アーキテクチャ図の更新
- **2025-10-01**: API 設計と地図可視化設定データベース設計を統合
- **2025-10-14**: ドキュメント構成整理、相互参照の追加
- **2025-10-17**: アトミックデザインによるコンポーネント設計を追加
