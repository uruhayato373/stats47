# Organisms コンポーネント

## 概要

Organismsは、アトミックデザインにおける第3階層のコンポーネントです。複数のMoleculesやAtomsを組み合わせて、複雑な機能を持つ大きなコンポーネントとして定義されます。

```
Atoms（原子） → Molecules（分子） → Organisms（生物） → Templates → Pages
```

## 定義

Organismsは、複数のMoleculesやAtomsを組み合わせた**複数の機能を統合した**ページ固有のコンポーネントです。

### 特徴

- **複数の責務**: 複数の機能を統合している
- **ページ固有**: 特定のページやセクションで使用される
- **データ依存**: データ取得やビジネスロジックを含む
- **状態管理**: 複雑な状態管理（複数のhooks、ストア）を含む
- **ルーティング**: ルーティングやナビゲーションロジックを含む
- **Server Component**: Next.js App RouterのServer Componentとしてデータ取得を行う場合がある

## 配置すべき判断基準

以下の条件の**いずれかを満たす**場合、Organismsに配置すべきです：

- [ ] 複数のMoleculesやAtomsを組み合わせ、複数の機能を統合している
- [ ] 特定のページやセクションで使用される（ページ固有）
- [ ] データ取得（API呼び出し、データベースアクセス）を含む
- [ ] ビジネスロジックを含む
- [ ] 複雑な状態管理（複数のhooks、ストア）を含む
- [ ] ルーティングやナビゲーションロジックを含む
- [ ] Server Componentとしてデータ取得を行う
- [ ] 複数のMoleculesを組み合わせた複合的なUI（例: ヘッダー、サイドバー、フッター）

## 実例

### AppSidebar / SiteHeader / Footer (ルートレイアウトの骨組み)

テンプレート (shadcndashboard) のサイドバー型の骨組み (2026-10-27)。`app/layout.tsx` が
`SidebarProvider` の中に `AppSidebar` と `SidebarInset` を兄弟で置き、`SidebarInset` の中に
`SiteHeader`・ページで唯一の `main#main-content`・`Footer` を並べる。

```tsx
// organisms/AppSidebar/index.tsx (Server Component)
export function AppSidebar() {
  const groups = getSidebarNavGroups(); // 主要ナビ・カテゴリ・テーマ
  return (
    <Sidebar>
      <SidebarActiveProvider hrefs={...}>   {/* 現在地の判定だけが client */}
        <SidebarNavContent>...<SidebarNavLink href label>...</SidebarNavLink></SidebarNavContent>
      </SidebarActiveProvider>
    </Sidebar>
  );
}
```

**特徴:**
- リンクはすべて Server Component が組み立て、SSR の HTML に a[href] で出す
- 現在地の判定・Sheet を閉じる処理・導線名 (`sidebar` / `sidebar-mobile`) だけを `AppSidebarClient.tsx` に閉じ込める
- 項目とラベルの正本は `AppSidebar/site-navigation.ts`。`Footer` も同じ項目を常に出す (lg 未満で Sheet に替わったときの SEO 対策)
- `SiteHeader` は開閉ボタン・検索・配色の切り替えだけを持つ client 部品
- どれも `cookies()` / `headers()` を呼ばない (契約テスト `src/__tests__/layout-ssg-contract.test.ts`)

### HomeNavigationCards

複数のナビゲーションカードとルーティングロジックを統合したホームページ用コンポーネント。

```tsx
// organisms/home/HomeNavigationCards.tsx
export function HomeNavigationCards() {
  const router = useRouter();
  const areaCode = useAreaCodeStore((state) => state.areaCode);
  
  const handleDashboardClick = (e: React.MouseEvent) => {
    // ルーティングロジック
  };
  // ... 複数のカードを管理
}
```

**特徴:**
- 複数機能: 複数のナビゲーションカードを統合
- ルーティング: ルーティングロジックを含む
- 状態管理: Zustandストアを使用
- ページ固有: ホームページ専用

### FeaturedRankings

注目ランキングを表示するコンポーネント。

```tsx
// organisms/home/FeaturedRankings.tsx
export async function FeaturedRankings() {
  // TODO: Fetch from API/DB
  const rankings = FEATURED_RANKINGS;
  // ... データ取得と表示を統合
}
```

**特徴:**
- データ取得: Server Componentとしてデータ取得を行う（予定）
- ページ固有: ホームページ専用
- 複合UI: 複数のランキングカードを統合

## 配置すべきでない場合

以下の場合は、Organismsではなく**Molecules**に配置すべきです：

### 単一の機能に特化している場合

```tsx
// ❌ Organismsに配置すべきでない例
// 単一機能: 統計値の表示のみ
export function StatCard({ label, value }: Props) {
  return (
    <div>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
// → molecules/stat-card.tsx に配置すべき
```

### 汎用的で様々な場所で使用できる場合

```tsx
// ❌ Organismsに配置すべきでない例
// 汎用的: 様々なエラー表示に使用可能
export function ErrorMessage({ title, message }: Props) {
  return <div>{title}: {message}</div>;
}
// → molecules/ErrorMessage/ErrorMessage.tsx に配置すべき
```

### データやビジネスロジックに依存しない場合

```tsx
// ❌ Organismsに配置すべきでない例
// 表示ロジックのみ: Propsでデータを受け取る
export function DonutChart({ chartData, title }: Props) {
  return <Chart data={chartData} />;
}
// → molecules/charts または @stats47/visualization/d3 のチャートコンポーネントに配置すべき
```

## ディレクトリ構造

Organismsは、機能やページごとにサブディレクトリに分類されます。

```
organisms/
├── AppSidebar/      # サイト全体のナビ (サイドバー)
├── SiteHeader/      # ヘッダー (開閉ボタン・検索・配色)
├── Footer/          # フッター
├── home/            # ホームページ固有のOrganisms
│   ├── HeroSearch.tsx
│   ├── HomeNavigationCards.tsx
│   └── FeaturedRankings.tsx
├── category/        # カテゴリ関連のOrganisms
├── ui/              # UI関連のOrganisms
└── README.md        # このファイル
```

## 関連ディレクトリ

### 下位レイヤー: Molecules

OrganismsはMoleculesを組み合わせて作成します。

```
components/organisms/SiteHeader/SiteHeader.tsx
  → @stats47/components/atoms/ui/sidebar の SidebarTrigger を使用
  → @stats47/components/atoms/ui/button を使用
```

### 上位レイヤー: Pages / Templates

OrganismsはPagesやTemplatesから使用されます。

```
app/(public)/page.tsx
  → organisms/home/HomeNavigationCards.tsx を使用
  → organisms/home/FeaturedRankings.tsx を使用
```

## 実装パターン

### Server Componentパターン

データ取得を行うOrganismsは、Server Componentとして実装します。

```tsx
// organisms/layout/Sidebar/Sidebar.tsx
export async function Sidebar() {
  const categories = await listCategories();
  return <SidebarClient categories={categories} />;
}
```

### Presentationalパターン

Storybook対応のため、データ取得とUI表示を分離します。

```tsx
// Server Component: データ取得
export async function Sidebar() {
  const categories = await listCategories();
  return <SidebarClient categories={categories} />;
}

// Client Component: UI表示
"use client";
export function SidebarClient({ categories }: Props) {
  // UI表示ロジック
}
```

## 参考

- [アトミックデザイン公式サイト](https://atomicdesign.bradfrost.com/)
- [Molecules README](../molecules/README.md)
