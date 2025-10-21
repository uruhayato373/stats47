---
title: App Router URL構成最適化
created: 2025-01-15
updated: 2025-01-15
tags:
  - App Router
  - URL設計
  - Next.js
  - ルーティング
---

# App Router URL 構成最適化

## 1. 概要

### 1.1 背景

stats47 プロジェクトの現在の URL 構成には以下の課題があります：

- **過度なリダイレクト**: 3 階層の自動リダイレクトが SEO と UX に悪影響
- **深すぎる階層構造**: 4-5 階層の URL は長すぎる
- **機能分離の不十分**: ranking と dashboard の機能分離が不十分
- **SEO 最適化の未実装**: メタデータとパフォーマンス最適化が未実装

リリース前のため、SEO 損失を考慮せず理想的な構造に変更可能です。

### 1.2 最適化の目標

- URL 構造の簡素化と直感性の向上
- リダイレクトの削減によるパフォーマンス向上
- 機能別レイアウトの分離による保守性向上
- SEO 最適化と静的生成の実装
- エラーハンドリングとローディング状態の改善

## 2. 新しい URL 構成

### 2.1 URL 構造の変更

#### 現在の構造

```
/{category}/{subcategory}/ranking            # → ranking/{defaultKey} にリダイレクト
/{category}/{subcategory}/ranking/{rankingKey}
/{category}/{subcategory}/dashboard          # → dashboard/00000 にリダイレクト
/{category}/{subcategory}/dashboard/{areaCode}

# e-Stat API関連ページ（独立）
/estat-api/stats-data                        # 統計データ取得UI
/estat-api/stats-list                        # 統計リスト取得UI
/estat-api/meta-info                         # メタ情報管理UI

# 管理画面
/admin                                       # 管理画面トップ
/admin/geoshape-cache                       # 地図データキャッシュ管理
/admin/visualization-settings               # 可視化設定管理
```

#### 新しい構造（推奨案採用）

```
# 統計データページ
/{category}/{subcategory}                    # サブカテゴリトップ（統合ビュー）
/{category}/{subcategory}/ranking/{rankingKey}  # ランキング詳細
/{category}/{subcategory}/area/{areaCode}       # 地域別ダッシュボード

# e-Stat API関連ページ（管理画面配下に移動）
/admin/dev-tools/estat-api/stats-data          # 統計データ取得ツール
/admin/dev-tools/estat-api/stats-list          # 統計リスト取得ツール
/admin/dev-tools/estat-api/meta-info           # メタ情報管理ツール

# 管理画面（拡張）
/admin                                         # 管理画面トップ
/admin/geoshape-cache                         # 地図データキャッシュ管理
/admin/visualization-settings                 # 可視化設定管理
/admin/dev-tools/                             # 開発ツールセクション
```

#### 主な変更点

1. **dashboard → area に変更**: より直感的で地域性を表現
2. **リダイレクト削除**: サブカテゴリトップで統合ビュー表示
3. **全国ダッシュボード**: `/area/00000` でアクセス
4. **機能名の保持**: `ranking/` と `area/` で明確な区別
5. **e-Stat API 関連ページの移動**: 管理画面配下に移動してセキュリティ向上
6. **開発ツールセクションの追加**: 管理画面内に開発ツールを集約

### 2.2 URL マッピング例

| 現在の URL                                              | 新しい URL                                              | 説明                             |
| ------------------------------------------------------- | ------------------------------------------------------- | -------------------------------- |
| `/population/basic-population/ranking`                  | `/population/basic-population`                          | 統合ビュー表示                   |
| `/population/basic-population/ranking/total-population` | `/population/basic-population/ranking/total-population` | 変更なし                         |
| `/population/basic-population/dashboard/00000`          | `/population/basic-population/area/00000`               | 全国ダッシュボード               |
| `/population/basic-population/dashboard/13000`          | `/population/basic-population/area/13000`               | 東京都ダッシュボード             |
| `/estat-api/stats-data`                                 | `/admin/dev-tools/estat-api/stats-data`                 | 統計データ取得ツール（認証必須） |
| `/estat-api/stats-list`                                 | `/admin/dev-tools/estat-api/stats-list`                 | 統計リスト取得ツール（認証必須） |
| `/estat-api/meta-info`                                  | `/admin/dev-tools/estat-api/meta-info`                  | メタ情報管理ツール（認証必須）   |

## 3. ディレクトリ構造（ルートグループ活用）

### 3.1 全体構造

```
src/app/
├── (public)/                           # 公開ページグループ
│   ├── layout.tsx                     # 共通レイアウト
│   ├── page.tsx                       # トップページ
│   ├── about/
│   └── blog/
│
├── (stats)/                            # 統計データグループ
│   ├── layout.tsx                     # 統計ページ共通レイアウト
│   ├── metadata.ts                    # SEOメタデータ設定
│   ├── error.tsx                      # エラーハンドリング
│   └── [category]/
│       ├── page.tsx                   # カテゴリページ
│       ├── layout.tsx                 # カテゴリ共通レイアウト
│       └── [subcategory]/
│           ├── page.tsx               # サブカテゴリトップ（統合ビュー）
│           ├── layout.tsx             # サブカテゴリ共通
│           ├── loading.tsx            # ローディング状態
│           ├── ranking/               # ランキング機能
│           │   ├── layout.tsx         # ランキング専用レイアウト
│           │   ├── page.tsx           # ランキング一覧
│           │   └── [rankingKey]/
│           │       ├── page.tsx
│           │       └── loading.tsx
│           └── area/                  # 地域別ダッシュボード
│               ├── layout.tsx         # エリア専用レイアウト
│               ├── page.tsx           # 全国ダッシュボード
│               └── [areaCode]/
│                   ├── page.tsx
│                   └── loading.tsx
│
├── admin/                              # 管理画面（認証必須）
│   ├── layout.tsx                     # 管理画面レイアウト
│   ├── middleware.ts                  # 認証チェック
│   ├── page.tsx                       # 管理画面トップ
│   ├── geoshape-cache/                # 地図データキャッシュ管理
│   ├── visualization-settings/        # 可視化設定管理
│   └── dev-tools/                     # 開発ツールセクション
│       ├── layout.tsx                 # 開発ツール共通レイアウト
│       ├── page.tsx                   # 開発ツールトップ
│       └── estat-api/                 # e-Stat API関連ツール
│           ├── layout.tsx             # e-Stat API共通レイアウト
│           ├── stats-data/
│           │   └── page.tsx
│           ├── stats-list/
│           │   └── page.tsx
│           └── meta-info/
│               └── page.tsx
│
└── api/                                # APIルート
    └── ...
```

### 3.2 ルートグループの利点

- **レイアウトの分離**: 各機能ごとに異なるレイアウトを適用
- **メタデータの個別化**: 機能別の SEO 設定
- **エラーハンドリングの分離**: 機能別のエラー表示
- **コードの整理**: 関連ファイルのグループ化
- **アクセス制御の分離**: 管理画面と一般ページの認証制御を分離
- **セキュリティの向上**: e-Stat API 関連ページを管理画面配下に配置

## 4. 実装詳細

### 4.1 e-Stat API 関連ページの管理画面統合

#### admin/dev-tools/layout.tsx

```typescript
import { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s | 開発ツール | 統計で見る都道府県" },
  description: "開発・管理用ツール",
  robots: {
    index: false, // 検索エンジンにインデックスしない
    follow: false,
  },
};

export default function DevToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dev-tools-layout">
      <DevToolsNav />
      <main className="dev-tools-content">{children}</main>
    </div>
  );
}
```

#### admin/dev-tools/estat-api/layout.tsx

```typescript
import { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s | e-Stat API | 開発ツール" },
  description: "e-Stat API関連の開発・管理ツール",
};

export default function EstatAPILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="estat-api-layout">
      <EstatAPINav />
      <main>{children}</main>
    </div>
  );
}
```

#### admin/middleware.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 管理画面全体の認証チェック
  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // 開発ツールは開発環境のみアクセス可能
    if (pathname.startsWith("/admin/dev-tools/")) {
      const env = process.env.NODE_ENV;
      if (env === "production" && !token.isDeveloper) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

### 4.2 ルートグループの作成

#### (stats)/layout.tsx

```typescript
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | 統計で見る都道府県",
    default: "統計で見る都道府県",
  },
  description: "日本の都道府県統計データを可視化",
  openGraph: {
    type: "website",
    siteName: "統計で見る都道府県",
  },
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="stats-layout">
      <StatsHeader />
      {children}
      <StatsFooter />
    </div>
  );
}
```

#### (stats)/error.tsx

```typescript
"use client";

export default function StatsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-container">
      <h2>統計データの読み込みに失敗しました</h2>
      <p>{error.message}</p>
      <button onClick={reset}>再試行</button>
    </div>
  );
}
```

### 4.2 サブカテゴリトップページの改善

#### [category]/[subcategory]/page.tsx

```typescript
import { Metadata } from "next";
import { validateSubcategoryOrThrow } from "@/lib/category/subcategory-validator";
import { SubcategoryOverview } from "@/components/templates/SubcategoryOverview";

interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, subcategory } = await params;
  const subcategoryData = validateSubcategoryOrThrow(category, subcategory);

  return {
    title: subcategoryData.subcategory.name,
    description: subcategoryData.subcategory.description,
    openGraph: {
      title: subcategoryData.subcategory.name,
      description: subcategoryData.subcategory.description,
      type: "article",
    },
  };
}

export default async function SubcategoryPage({ params }: PageProps) {
  const { category, subcategory } = await params;
  const subcategoryData = validateSubcategoryOrThrow(category, subcategory);

  return (
    <SubcategoryOverview
      category={subcategoryData.category}
      subcategory={subcategoryData.subcategory}
    />
  );
}
```

#### [category]/[subcategory]/loading.tsx

```typescript
export default function Loading() {
  return (
    <div className="loading-container">
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
        <div className="h-64 w-full bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
```

### 4.3 ランキングレイアウトの分離

#### [category]/[subcategory]/ranking/layout.tsx

```typescript
import { RankingProvider } from "@/contexts/RankingContext";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s ランキング | 統計で見る都道府県" },
  openGraph: {
    type: "article",
  },
};

export default function RankingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ category: string; subcategory: string }>;
}) {
  return (
    <RankingProvider>
      <div className="ranking-layout">
        <RankingToolbar />
        <div className="ranking-content">
          <RankingSidebar />
          <main>{children}</main>
        </div>
      </div>
    </RankingProvider>
  );
}
```

#### [category]/[subcategory]/ranking/[rankingKey]/page.tsx

```typescript
import { Metadata } from "next";
import { validateSubcategoryOrThrow } from "@/lib/category/subcategory-validator";
import { SubcategoryRankingPage } from "@/components/templates/SubcategoryRankingPage";

interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
    rankingKey: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, subcategory, rankingKey } = await params;
  const subcategoryData = validateSubcategoryOrThrow(category, subcategory);

  return {
    title: `${subcategoryData.subcategory.name} - ${rankingKey} ランキング`,
    description: `${subcategoryData.subcategory.name}の${rankingKey}に関する都道府県ランキング`,
  };
}

export async function generateStaticParams() {
  const categories = await getAllCategories();
  const params = [];

  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      const rankings = await getRankingKeys(subcategory.id);
      for (const ranking of rankings) {
        params.push({
          category: category.id,
          subcategory: subcategory.id,
          rankingKey: ranking.key,
        });
      }
    }
  }

  return params;
}

export const revalidate = 3600; // 1時間ごとに再生成

export default async function RankingItemPage({ params }: PageProps) {
  const { category, subcategory, rankingKey } = await params;
  const subcategoryData = validateSubcategoryOrThrow(category, subcategory);

  return (
    <SubcategoryRankingPage
      category={subcategoryData.category}
      subcategory={subcategoryData.subcategory}
      rankingKey={rankingKey}
    />
  );
}
```

### 4.4 エリアレイアウトの分離

#### [category]/[subcategory]/area/layout.tsx

```typescript
import { AreaProvider } from "@/contexts/AreaContext";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s 地域別ダッシュボード | 統計で見る都道府県" },
  openGraph: {
    type: "website",
  },
};

export default function AreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AreaProvider>
      <div className="area-layout">
        <AreaSelector />
        <TimeRangeSelector />
        <main>{children}</main>
      </div>
    </AreaProvider>
  );
}
```

#### [category]/[subcategory]/area/[areaCode]/page.tsx

```typescript
import { Metadata } from "next";
import { validateSubcategoryOrThrow } from "@/lib/category/subcategory-validator";
import { AreaDashboardPage } from "@/components/templates/AreaDashboardPage";

interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
    areaCode: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, subcategory, areaCode } = await params;
  const subcategoryData = validateSubcategoryOrThrow(category, subcategory);
  const areaName = getAreaName(areaCode);

  return {
    title: `${areaName} - ${subcategoryData.subcategory.name} ダッシュボード`,
    description: `${areaName}の${subcategoryData.subcategory.name}に関する統計ダッシュボード`,
  };
}

export async function generateStaticParams() {
  const categories = await getAllCategories();
  const areaCodes = ["00000", "01000", "02000" /* ... 全47都道府県 */];
  const params = [];

  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      for (const areaCode of areaCodes) {
        params.push({
          category: category.id,
          subcategory: subcategory.id,
          areaCode,
        });
      }
    }
  }

  return params;
}

export const revalidate = 1800; // 30分ごとに再生成

export default async function AreaDashboardPage({ params }: PageProps) {
  const { category, subcategory, areaCode } = await params;
  const subcategoryData = validateSubcategoryOrThrow(category, subcategory);

  return (
    <AreaDashboardPage
      category={subcategoryData.category}
      subcategory={subcategoryData.subcategory}
      areaCode={areaCode}
    />
  );
}
```

## 5. メリット

### 5.1 URL 構造の改善

- **直感性の向上**: `area/` で地域性を明確に表現
- **リダイレクト削除**: パフォーマンス向上と SEO 改善
- **統合ビュー**: サブカテゴリトップで概要を表示

### 5.2 開発体験の向上

- **レイアウト分離**: 機能ごとに最適化されたレイアウト
- **コード整理**: ルートグループによる関連ファイルのグループ化
- **型安全性**: 各ページで適切な型定義

### 5.3 SEO 最適化

- **メタデータ生成**: 各ページに適切なタイトルと説明
- **静的生成**: `generateStaticParams`による事前生成
- **OGP 対応**: ソーシャルメディアでの表示最適化

### 5.4 パフォーマンス向上

- **静的生成**: ビルド時の事前生成
- **再生成設定**: データ更新頻度に応じた再生成
- **ローディング状態**: ユーザー体験の向上

## 6. 実装順序

### Phase 1: 基盤整備（1-2 週間）

1. **ルートグループ作成**

   - `(stats)`, `(admin)`, `(public)` ディレクトリ作成
   - 各グループの `layout.tsx` 実装

2. **レイアウトファイル実装**
   - 統計ページ共通レイアウト
   - ランキング専用レイアウト
   - エリア専用レイアウト

### Phase 2: ページリファクタリング（2-3 週間）

3. **ページファイルの移動とリファクタリング**

   - 既存ページの新しい構造への移動
   - リダイレクト削除と統合ビュー実装

4. **メタデータ生成の実装**
   - `generateMetadata` 関数の実装
   - SEO 最適化の設定

### Phase 3: 最適化（1-2 週間）

5. **静的生成パラメータの実装**

   - `generateStaticParams` 関数の実装
   - 再生成設定の最適化

6. **エラーハンドリングとローディング状態**

   - 機能別エラー表示の実装
   - ローディング状態の改善

7. **型定義の更新**
   - `PageProps`, `LayoutProps` の型更新
   - 型安全性の向上

## 7. テスト計画

### 7.1 機能テスト

- **URL 動作確認**: 全ルートパスの動作テスト
- **リダイレクト確認**: 旧 URL からの適切なリダイレクト
- **レイアウト確認**: 各機能のレイアウト表示

### 7.2 SEO テスト

- **メタデータ確認**: 各ページのタイトルと説明
- **OGP 確認**: ソーシャルメディアでの表示
- **構造化データ**: 検索エンジン最適化

### 7.3 パフォーマンステスト

- **静的生成確認**: ビルド時の生成状況
- **再生成確認**: データ更新時の動作
- **ローディング時間**: ページ表示速度の測定

## 8. 移行戦略

### 8.1 段階的移行

1. **Phase 1**: 新構造の実装（旧 URL は維持）
2. **Phase 2**: 旧 URL からのリダイレクト設定
3. **Phase 3**: 旧 URL の段階的削除

### 8.2 リダイレクト設定

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 旧URLから新URLへのリダイレクト
  if (pathname.includes("/dashboard/")) {
    const newPath = pathname.replace("/dashboard/", "/area/");
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // e-Stat API関連ページのリダイレクト
  if (pathname.startsWith("/estat-api/")) {
    const newPath = pathname.replace(
      "/estat-api/",
      "/admin/dev-tools/estat-api/"
    );
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  return NextResponse.next();
}
```

### 8.3 e-Stat API 関連ページの移行

#### 移行手順

1. **ディレクトリ作成**

   ```bash
   mkdir -p src/app/admin/dev-tools/estat-api/{stats-data,stats-list,meta-info}
   ```

2. **ファイル移動**

   ```bash
   # 既存のe-Stat APIページを移動
   mv src/app/estat-api/stats-data/page.tsx src/app/admin/dev-tools/estat-api/stats-data/
   mv src/app/estat-api/stats-list/page.tsx src/app/admin/dev-tools/estat-api/stats-list/
   mv src/app/estat-api/meta-info/page.tsx src/app/admin/dev-tools/estat-api/meta-info/
   ```

3. **レイアウトファイル作成**

   - `admin/dev-tools/layout.tsx`
   - `admin/dev-tools/estat-api/layout.tsx`

4. **アクセス制御設定**

   - `admin/middleware.ts` の実装
   - 認証チェックの追加

5. **リダイレクト設定**
   - 旧 URL から新 URL へのリダイレクト
   - 認証が必要な旨のメッセージ表示

## 9. メリット・デメリット比較

### 9.1 e-Stat API 関連ページの配置方針

#### 採用案: 管理画面配下に移動

**メリット:**

- ✅ **セキュリティの向上**: 認証必須化により不正アクセスを防止
- ✅ **機能の明確化**: 開発・管理ツールとして位置づけ
- ✅ **一般ユーザーとの分離**: 不要な機能へのアクセスを防止
- ✅ **環境別のアクセス制御**: 本番環境では開発者のみアクセス可能
- ✅ **SEO 最適化**: 検索エンジンにインデックスしない設定が容易

**デメリット:**

- ⚠️ **URL 変更**: 既存リンクの更新が必要
- ⚠️ **開発中のアクセス**: 認証が必要になる
- ⚠️ **移行作業**: ファイル移動とレイアウト設定の作業

#### 代替案との比較

| 項目             | 管理画面配下（採用） | 独立セクション維持 | ルートグループ分離 |
| ---------------- | -------------------- | ------------------ | ------------------ |
| **セキュリティ** | ✅ 高                | ❌ 低              | ⚠️ 中              |
| **移行コスト**   | ⚠️ 中                | ✅ なし            | ⚠️ 中              |
| **アクセス制御** | ✅ 容易              | ❌ 困難            | ⚠️ 複雑            |
| **機能の明確化** | ✅ 明確              | ❌ 不明確          | ⚠️ やや明確        |
| **開発効率**     | ⚠️ 認証必要          | ✅ 素早い          | ✅ 素早い          |

### 9.2 総合評価

**採用理由:**

1. **セキュリティ**: 本番環境での不正アクセス防止
2. **保守性**: 機能の明確な分離
3. **スケーラビリティ**: 将来的な開発ツールの追加が容易
4. **コンプライアンス**: データ管理ツールの適切な保護

## 10. 関連ドキュメント

- [Next.js App Router 公式ドキュメント](https://nextjs.org/docs/app)
- [ルーティングとナビゲーション](https://nextjs.org/docs/app/building-your-application/routing)
- [メタデータ API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [静的生成](https://nextjs.org/docs/app/building-your-application/rendering/static-and-dynamic)
- [ミドルウェア](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

**最終更新**: 2025 年 1 月 15 日  
**作成者**: 開発チーム  
**関連ドキュメント**: [システムアーキテクチャ.md](./01_アーキテクチャ/システムアーキテクチャ.md)
