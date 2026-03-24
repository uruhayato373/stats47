# Molecules コンポーネント

## 概要

Moleculesは、アトミックデザインにおける第2階層のコンポーネントです。複数のAtomsを組み合わせて、単一の機能を持つ小さなコンポーネントとして定義されます。

```
Atoms（原子） → Molecules（分子） → Organisms（生物） → Templates → Pages
```

## 定義

Moleculesは、複数のAtomsを組み合わせた**単一の機能に特化した**再利用可能なコンポーネントです。

### 特徴

- **単一の責務**: 1つの機能に特化している
- **高い再利用性**: 様々な場所で使用できる汎用的なコンポーネント
- **独立性**: 他のコンポーネントに依存しない
- **表示ロジック**: データやビジネスロジックに依存しない
- **Props駆動**: Propsで制御可能で、内部状態は最小限

## 配置すべき判断基準

以下の条件を**すべて満たす**場合、Moleculesに配置すべきです：

- [ ] 複数のAtomsを組み合わせている
- [ ] 単一の機能に特化している（例: 統計値の表示、エラーメッセージの表示）
- [ ] 様々な場所で再利用できる（汎用的）
- [ ] データやビジネスロジックに依存しない（表示ロジックのみ）
- [ ] Propsで制御可能で、内部状態が最小限（`useState`は最小限）
- [ ] 他のコンポーネントに依存しない（独立性が高い）
- [ ] ルーティングやナビゲーションロジックを含まない
- [ ] データ取得（API呼び出し、データベースアクセス）を含まない

## 実例

### StatCard

統計値の表示に特化したコンポーネント。

```tsx
// molecules/stat-card.tsx
<StatCard 
  label="人口" 
  value="1400万人" 
  icon={<Users />}
  variant="info"
/>
```

**特徴:**
- 単一機能: 統計値の表示
- 汎用的: 様々な統計値に使用可能
- Props駆動: データはPropsで受け取る
- ビジネスロジックなし: 表示のみ

### ErrorMessage

エラーメッセージの表示に特化したコンポーネント。

```tsx
// molecules/ErrorMessage/ErrorMessage.tsx
<ErrorMessage
  title="データの読み込みに失敗しました"
  message="通信エラーが発生しました。"
  onRetry={() => refetch()}
/>
```

**特徴:**
- 単一機能: エラーメッセージの表示
- 汎用的: 様々なエラー表示に使用可能
- Props駆動: メッセージとコールバックをPropsで受け取る

### DonutChart

チャートの表示に特化したコンポーネント。

```tsx
// molecules/charts または @stats47/visualization/d3
<DonutChart
  chartData={data}
  title="人口構成"
  config={config}
/>
```

**特徴:**
- 単一機能: チャートの表示
- 汎用的: 様々なデータに使用可能
- Props駆動: データはPropsで受け取る

### NotFoundMessage

404メッセージの表示に特化したコンポーネント。

```tsx
// molecules/NotFoundMessage/NotFoundMessage.tsx
<NotFoundMessage
  title="カテゴリが見つかりません"
  message="指定されたカテゴリは存在しません。"
  buttonHref="/"
/>
```

**特徴:**
- 単一機能: 404メッセージの表示
- 汎用的: 様々な「見つからない」ケースに使用可能
- Props駆動: メッセージとリンクをPropsで受け取る

## 配置すべきでない場合

以下の場合は、Moleculesではなく**Organisms**に配置すべきです：

### 複数の機能を統合している場合

```tsx
// ❌ Moleculesに配置すべきでない例
// 複数の機能（検索、ナビゲーション、テーマ切り替え）を統合
export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toggleTheme } = useTheme();
  // ... 複数の機能を統合
}
// → organisms/layout/Header/Header.tsx に配置すべき
```

### データ取得やビジネスロジックを含む場合

```tsx
// ❌ Moleculesに配置すべきでない例
export async function CategoryList() {
  const categories = await listCategories(); // データ取得
  // ...
}
// → organisms/category/CategoryList.tsx に配置すべき
```

### 複雑な状態管理を含む場合

```tsx
// ❌ Moleculesに配置すべきでない例
export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { setPageType } = usePageTypeStore(); // 複数のストア
  const { areaCode } = useAreaCodeStore();
  // ... 複雑な状態管理
}
// → organisms/layout/Navigation/Navigation.tsx に配置すべき
```

### 特定のページやセクションで使用される場合

```tsx
// ❌ Moleculesに配置すべきでない例
// ホームページ専用のナビゲーションカード
export function HomeNavigationCards() {
  // ホームページ固有のロジック
}
// → organisms/home/HomeNavigationCards.tsx に配置すべき
```

## 関連ディレクトリ

### 上位レイヤー: Atoms

MoleculesはAtomsを組み合わせて作成します。

```
@stats47/components/atoms/ui/button
@stats47/components/atoms/ui/input
@stats47/components/atoms/ui/card
```

### 下位レイヤー: Organisms

MoleculesはOrganismsから使用されます。

```
components/organisms/layout/Header/Header.tsx
  → @stats47/visualization/d3 のチャートコンポーネントを使用
```

## ディレクトリ構造

```
molecules/
├── charts/          # チャート関連のMolecules
│   ├── d3/
│   └── ui/
├── data-table/      # データテーブル関連のMolecules
├── ErrorMessage/    # エラーメッセージ表示
├── NotFoundMessage/ # 404メッセージ表示
├── stat-card.tsx    # 統計カード
└── README.md        # このファイル
```

## 参考

- [アトミックデザイン公式サイト](https://atomicdesign.bradfrost.com/)
- [Organisms README](../organisms/README.md)
