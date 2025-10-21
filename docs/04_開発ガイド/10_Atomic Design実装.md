---
title: Atomic Design 実装ガイド
created: 2025-01-15
updated: 2025-01-15
tags:
  - Atomic Design
  - コンポーネント設計
  - React
---

# Atomic Design 実装ガイド

## 1. Atomic Design とは

### 1.1 概念説明

Atomic Design は、Brad Frost によって提唱された UI コンポーネントの設計手法です。化学の原子・分子・有機体の概念を UI デザインに適用し、コンポーネントを階層的に整理します。

**5 つの階層:**

1. **Atoms（原子）**: 最小単位の UI 要素
2. **Molecules（分子）**: Atoms を組み合わせた小さな機能単位
3. **Organisms（生体）**: Molecules を組み合わせた複雑な UI パターン
4. **Templates（テンプレート）**: ページレイアウトの骨組み
5. **Pages（ページ）**: 実際のコンテンツが入った完成形

### 1.2 stats47 での適用方針

**ディレクトリ構造:**

```
src/components/
├── atoms/           # 原子コンポーネント
├── molecules/       # 分子コンポーネント
├── organisms/       # 生体コンポーネント
├── templates/       # テンプレートコンポーネント
└── pages/           # ページコンポーネント
```

**命名規則:**

- ファイル名: PascalCase（例: `Button.tsx`）
- コンポーネント名: PascalCase（例: `Button`）
- ディレクトリ名: kebab-case（例: `button/`）

## 2. Atoms（原子）

### 2.1 定義と責務

Atoms は、UI の最小単位となるコンポーネントです。これ以上分割できない、単一の機能を持つ要素です。

**特徴:**

- 単一の責任を持つ
- 他のコンポーネントに依存しない
- 再利用性が高い
- スタイルが固定されている

### 2.2 実装例

#### Button コンポーネント

```tsx
// src/components/atoms/Button/Button.tsx
interface ButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  children,
  onClick,
  className = "",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 disabled:bg-indigo-300",
    secondary:
      "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300",
    outline:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
    ghost:
      "text-gray-700 hover:bg-gray-100 focus:ring-indigo-500 dark:text-neutral-300 dark:hover:bg-neutral-700",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
```

#### Input コンポーネント

```tsx
// src/components/atoms/Input/Input.tsx
interface InputProps {
  type?: "text" | "email" | "password" | "number";
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  className = "",
}) => {
  return (
    <div className="w-full">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border rounded-lg shadow-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-200
          dark:focus:ring-indigo-400 dark:focus:border-indigo-400
          ${
            error
              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300"
          }
          ${className}
        `}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};
```

#### Icon コンポーネント

```tsx
// src/components/atoms/Icon/Icon.tsx
interface IconProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const iconMap = {
    search: SearchIcon,
    user: UserIcon,
    home: HomeIcon,
    // ... 他のアイコン
  };

  const IconComponent = iconMap[name as keyof typeof iconMap];

  if (!IconComponent) {
    return null;
  }

  return <IconComponent className={`${sizeClasses[size]} ${className}`} />;
};
```

#### Text コンポーネント

```tsx
// src/components/atoms/Text/Text.tsx
interface TextProps {
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body" | "caption";
  color?: "primary" | "secondary" | "tertiary" | "muted";
  children: React.ReactNode;
  className?: string;
}

export const Text: React.FC<TextProps> = ({
  variant = "body",
  color = "primary",
  children,
  className = "",
}) => {
  const variantClasses = {
    h1: "text-3xl font-bold",
    h2: "text-2xl font-semibold",
    h3: "text-xl font-medium",
    h4: "text-lg font-medium",
    h5: "text-base font-medium",
    h6: "text-sm font-medium",
    body: "text-base",
    caption: "text-sm",
  };

  const colorClasses = {
    primary: "text-gray-900 dark:text-neutral-200",
    secondary: "text-gray-700 dark:text-neutral-300",
    tertiary: "text-gray-600 dark:text-neutral-400",
    muted: "text-gray-500 dark:text-neutral-500",
  };

  const Component = variant.startsWith("h")
    ? (variant as keyof JSX.IntrinsicElements)
    : "p";

  return (
    <Component
      className={`${variantClasses[variant]} ${colorClasses[color]} ${className}`}
    >
      {children}
    </Component>
  );
};
```

### 2.3 命名規則

**Atoms の命名規則:**

- ファイル名: `[ComponentName].tsx`
- ディレクトリ名: `[component-name]/`
- コンポーネント名: `[ComponentName]`
- プロップス名: camelCase
- クラス名: kebab-case

**例:**

```
src/components/atoms/
├── button/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   └── Button.stories.tsx
├── input/
│   ├── Input.tsx
│   ├── Input.test.tsx
│   └── Input.stories.tsx
└── icon/
    ├── Icon.tsx
    ├── Icon.test.tsx
    └── Icon.stories.tsx
```

## 3. Molecules（分子）

### 3.1 定義と責務

Molecules は、複数の Atoms を組み合わせて作られる小さな機能単位です。特定の機能を提供するが、まだ独立したコンポーネントとして使用できるレベルです。

**特徴:**

- 複数の Atoms を組み合わせる
- 特定の機能を提供する
- 再利用可能
- ビジネスロジックを含む場合がある

### 3.2 実装例

#### SearchForm コンポーネント

```tsx
// src/components/molecules/SearchForm/SearchForm.tsx
interface SearchFormProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  placeholder = "検索...",
  className = "",
}) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex space-x-2 ${className}`}>
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={setQuery}
        className="flex-1"
      />
      <Button type="submit" variant="primary">
        <Icon name="search" size="sm" />
        検索
      </Button>
    </form>
  );
};
```

#### CategoryCard コンポーネント

```tsx
// src/components/molecules/CategoryCard/CategoryCard.tsx
interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
    subcategoryCount?: number;
  };
  onClick?: () => void;
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onClick,
  className = "",
}) => {
  return (
    <div
      className={`bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-6 hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.color}`}
        >
          <Icon name={category.icon} size="md" />
        </div>
        <div className="flex-1">
          <Text variant="h6" className="text-gray-900 dark:text-neutral-200">
            {category.name}
          </Text>
          {category.subcategoryCount && (
            <Text variant="caption" color="tertiary">
              {category.subcategoryCount}個のサブカテゴリー
            </Text>
          )}
        </div>
        <Icon name="chevron-right" size="sm" className="text-gray-400" />
      </div>
    </div>
  );
};
```

#### MetricCard コンポーネント

```tsx
// src/components/molecules/MetricCard/MetricCard.tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
  };
  icon?: string;
  color?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  color = "indigo",
  className = "",
}) => {
  const changeColor =
    change?.type === "increase"
      ? "text-green-600"
      : change?.type === "decrease"
      ? "text-red-600"
      : "text-gray-600";

  return (
    <div
      className={`bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <Text variant="caption" color="tertiary" className="mb-1">
            {title}
          </Text>
          <Text variant="h4" className="text-gray-900 dark:text-neutral-200">
            {typeof value === "number" ? value.toLocaleString() : value}
          </Text>
          {change && (
            <div className="flex items-center mt-1">
              <Icon
                name={change.type === "increase" ? "arrow-up" : "arrow-down"}
                size="sm"
                className={changeColor}
              />
              <Text variant="caption" className={`ml-1 ${changeColor}`}>
                {Math.abs(change.value)}%
              </Text>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${color}-100 dark:bg-${color}-900/20`}
          >
            <Icon
              name={icon}
              size="lg"
              className={`text-${color}-600 dark:text-${color}-400`}
            />
          </div>
        )}
      </div>
    </div>
  );
};
```

### 3.3 Atoms との組み合わせ

**組み合わせの原則:**

1. **単一責任**: 各 Molecule は一つの明確な機能を持つ
2. **再利用性**: 異なるコンテキストで使用可能
3. **柔軟性**: プロップスでカスタマイズ可能
4. **一貫性**: デザインシステムに従う

**例: SearchForm の組み合わせ**

```tsx
// Atomsの組み合わせ
SearchForm = Input + Button + Icon;
CategoryCard = Icon + Text + レイアウト;
MetricCard = Text + Icon + レイアウト;
```

## 4. Organisms（生体）

### 4.1 定義と責務

Organisms は、複数の Molecules や Atoms を組み合わせて作られる複雑な UI パターンです。ページの特定のセクションを構成する大きなコンポーネントです。

**特徴:**

- 複数の Molecules と Atoms を組み合わせる
- 複雑なビジネスロジックを含む
- ページの特定のセクションを構成
- 状態管理を含む場合がある

### 4.2 実装例

#### Header コンポーネント

```tsx
// src/components/organisms/Header/Header.tsx
interface HeaderProps {
  user?: {
    name: string;
    avatar?: string;
  };
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Icon name="chart-bar" size="lg" className="text-indigo-600" />
              <Text
                variant="h5"
                className="text-gray-900 dark:text-neutral-200"
              >
                Stats47
              </Text>
            </Link>
          </div>

          {/* ナビゲーション */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-gray-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              ダッシュボード
            </Link>
            <Link
              href="/categories"
              className="text-gray-700 hover:text-gray-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              カテゴリー
            </Link>
            <Link
              href="/about"
              className="text-gray-700 hover:text-gray-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              について
            </Link>
          </nav>

          {/* ユーザーメニュー */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 dark:text-neutral-300 dark:hover:text-neutral-100"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <Icon name="user" size="md" />
                  )}
                  <Text variant="body">{user.name}</Text>
                  <Icon name="chevron-down" size="sm" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-700">
                    <div className="py-1">
                      <button
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      >
                        ログアウト
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  ログイン
                </Button>
                <Button variant="primary" size="sm">
                  サインアップ
                </Button>
              </div>
            )}

            {/* モバイルメニューボタン */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              <Icon name="menu" size="md" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
```

#### Sidebar コンポーネント

```tsx
// src/components/organisms/Sidebar/Sidebar.tsx
interface SidebarProps {
  categories: Category[];
  currentPath?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  currentPath,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <aside className="w-64 bg-white dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 h-full overflow-y-auto">
      <div className="p-4">
        <Text variant="h6" className="text-gray-900 dark:text-neutral-200 mb-4">
          カテゴリー
        </Text>

        <nav className="space-y-2">
          {categories.map((category) => (
            <div key={category.id}>
              <button
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-neutral-700 ${
                  currentPath === `/${category.id}`
                    ? "bg-indigo-100 dark:bg-indigo-900/20"
                    : ""
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon name={category.icon} size="sm" />
                  <Text
                    variant="body"
                    className="text-gray-700 dark:text-neutral-300"
                  >
                    {category.name}
                  </Text>
                </div>
                <Icon
                  name={
                    expandedCategories.includes(category.id)
                      ? "chevron-down"
                      : "chevron-right"
                  }
                  size="sm"
                  className="text-gray-400"
                />
              </button>

              {expandedCategories.includes(category.id) &&
                category.subcategories && (
                  <div className="ml-4 mt-1 space-y-1">
                    {category.subcategories.map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        href={`/${category.id}/${subcategory.id}`}
                        className={`block p-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-neutral-700 ${
                          currentPath === `/${category.id}/${subcategory.id}`
                            ? "bg-indigo-100 dark:bg-indigo-900/20"
                            : ""
                        }`}
                      >
                        <Text
                          variant="caption"
                          className="text-gray-600 dark:text-neutral-400"
                        >
                          {subcategory.name}
                        </Text>
                      </Link>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};
```

#### Dashboard コンポーネント

```tsx
// src/components/organisms/Dashboard/Dashboard.tsx
interface DashboardProps {
  data: DashboardData;
  areaCode?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, areaCode }) => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* 統計カード群 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.metrics.map((metric) => (
          <MetricCard
            key={metric.id}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            icon={metric.icon}
            color={metric.color}
            onClick={() => setSelectedMetric(metric.id)}
          />
        ))}
      </div>

      {/* チャートセクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <Text
            variant="h6"
            className="text-gray-900 dark:text-neutral-200 mb-4"
          >
            時系列チャート
          </Text>
          {/* チャートコンポーネント */}
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <Text
            variant="h6"
            className="text-gray-900 dark:text-neutral-200 mb-4"
          >
            分布チャート
          </Text>
          {/* チャートコンポーネント */}
        </div>
      </div>

      {/* データテーブル */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
          <Text variant="h6" className="text-gray-900 dark:text-neutral-200">
            詳細データ
          </Text>
        </div>
        <div className="overflow-x-auto">{/* テーブルコンポーネント */}</div>
      </div>
    </div>
  );
};
```

### 4.3 複雑な UI パターン

**Organisms の特徴:**

- **状態管理**: useState、useReducer などの状態管理
- **データ取得**: API 呼び出しやデータ変換
- **イベント処理**: 複雑なユーザーインタラクション
- **レイアウト**: 複数の Molecules の配置

## 5. Templates & Pages

### 5.1 Templates（テンプレート）

Templates は、ページのレイアウトの骨組みを定義します。実際のコンテンツは含まず、構造のみを提供します。

#### CategoryPageTemplate

```tsx
// src/components/templates/CategoryPageTemplate.tsx
interface CategoryPageTemplateProps {
  children: React.ReactNode;
  category: Category;
}

export const CategoryPageTemplate: React.FC<CategoryPageTemplateProps> = ({
  children,
  category,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* ヘッダー */}
      <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* パンくずナビゲーション */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-neutral-400 mb-4">
            <Link
              href="/"
              className="hover:text-gray-700 dark:hover:text-neutral-300"
            >
              統計データ
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-neutral-200">
              {category.name}
            </span>
          </nav>

          {/* タイトルとアイコン */}
          <div className="flex items-center space-x-4">
            <Icon
              name={category.icon}
              className="w-12 h-12 text-gray-600 dark:text-neutral-400"
            />
            <Text variant="h1" className="text-gray-900 dark:text-neutral-100">
              {category.name}
            </Text>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
```

#### DashboardTemplate

```tsx
// src/components/templates/DashboardTemplate.tsx
interface DashboardTemplateProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  children,
  sidebar,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="flex">
        {/* サイドバー */}
        {sidebar && (
          <aside className="w-64 bg-white dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700">
            {sidebar}
          </aside>
        )}

        {/* メインコンテンツ */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};
```

### 5.2 Pages（ページ）

Pages は、Templates に実際のコンテンツを配置した完成形です。

#### CategoryPage

```tsx
// src/components/pages/CategoryPage.tsx
interface CategoryPageProps {
  category: Category;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ category }) => {
  return (
    <CategoryPageTemplate category={category}>
      {category.subcategories && category.subcategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {category.subcategories.map((subcategory) => (
            <CategoryCard
              key={subcategory.id}
              category={{
                id: subcategory.id,
                name: subcategory.name,
                icon: category.icon,
                color: category.color,
                subcategoryCount: subcategory.itemCount,
              }}
              onClick={() => {
                // ナビゲーション処理
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Icon
            name={category.icon}
            className="w-16 h-16 text-gray-400 dark:text-neutral-500 mx-auto mb-4"
          />
          <Text variant="body" color="tertiary">
            このカテゴリーにはサブカテゴリーがありません
          </Text>
        </div>
      )}
    </CategoryPageTemplate>
  );
};
```

### 5.3 レイアウトシステム

**レスポンシブレイアウト:**

```tsx
// グリッドシステム
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* コンテンツ */}
</div>

// フレックスレイアウト
<div className="flex flex-col lg:flex-row gap-6">
  <div className="flex-1">
    {/* メインコンテンツ */}
  </div>
  <div className="lg:w-80">
    {/* サイドバー */}
  </div>
</div>
```

**コンテナシステム:**

```tsx
// 最大幅コンテナ
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* コンテンツ */}
</div>

// フル幅コンテナ
<div className="w-full px-4 sm:px-6 lg:px-8">
  {/* コンテンツ */}
</div>
```

## 6. 実装のベストプラクティス

### 6.1 コンポーネント設計

**単一責任の原則:**

```tsx
// ❌ 悪い例: 複数の責任
const BadComponent = () => {
  // データ取得
  // データ変換
  // UI表示
  // イベント処理
};

// ✅ 良い例: 単一責任
const DataDisplay = ({ data }) => {
  // UI表示のみ
};

const DataFetcher = ({ onData }) => {
  // データ取得のみ
};
```

**プロップスの設計:**

```tsx
// 適切なプロップス設計
interface ComponentProps {
  // 必須プロップス
  title: string;
  data: DataType[];

  // オプショナルプロップス
  onSelect?: (item: DataType) => void;
  className?: string;

  // デフォルト値を持つプロップス
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}
```

### 6.2 状態管理

**ローカル状態:**

```tsx
// コンポーネント内の状態
const [isOpen, setIsOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<string | null>(null);
```

**グローバル状態:**

```tsx
// Context API の使用
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 6.3 パフォーマンス最適化

**メモ化:**

```tsx
// useMemo の使用
const expensiveValue = useMemo(() => {
  return data.map((item) => expensiveCalculation(item));
}, [data]);

// useCallback の使用
const handleClick = useCallback(
  (id: string) => {
    onItemClick(id);
  },
  [onItemClick]
);

// React.memo の使用
const MemoizedComponent = React.memo(({ data }) => {
  return <div>{/* レンダリング */}</div>;
});
```

**遅延読み込み:**

```tsx
// 動的インポート
const LazyComponent = lazy(() => import("./LazyComponent"));

// Suspense でラップ
<Suspense fallback={<div>Loading...</div>}>
  <LazyComponent />
</Suspense>;
```

## 7. テスト戦略

### 7.1 単体テスト

**Atoms のテスト:**

```tsx
// src/components/atoms/Button/__tests__/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../Button";

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

**Molecules のテスト:**

```tsx
// src/components/molecules/SearchForm/__tests__/SearchForm.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchForm } from "../SearchForm";

describe("SearchForm", () => {
  it("calls onSearch with input value when form is submitted", () => {
    const handleSearch = jest.fn();
    render(<SearchForm onSearch={handleSearch} />);

    const input = screen.getByPlaceholderText("検索...");
    const button = screen.getByRole("button", { name: /検索/i });

    fireEvent.change(input, { target: { value: "test query" } });
    fireEvent.click(button);

    expect(handleSearch).toHaveBeenCalledWith("test query");
  });
});
```

### 7.2 Storybook での開発

**Atoms の Story:**

```tsx
// src/components/atoms/Button/Button.stories.tsx
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
      options: ["primary", "secondary", "outline", "ghost"],
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Button",
  },
};
```

**Molecules の Story:**

```tsx
// src/components/molecules/SearchForm/SearchForm.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { SearchForm } from "./SearchForm";

const meta: Meta<typeof SearchForm> = {
  title: "Molecules/SearchForm",
  component: SearchForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSearch: (query: string) => console.log("Search:", query),
    placeholder: "検索...",
  },
};
```

## 9. shadcn/uiとAtomic Designの統合

### 9.1 統合戦略

shadcn/uiコンポーネントをAtomic Designの階層構造に自然に組み込むことで、既存のアーキテクチャを維持しながら高品質なUIコンポーネントを活用できます。

**統合の原則:**
- 既存のAtomic Design構造を維持
- shadcn/uiコンポーネントを適切な階層に配置
- 既存コンポーネントとの使い分けを明確化
- 完全なコードコントロールを維持

### 9.2 ディレクトリ構造の拡張

```
src/components/
├── atoms/
│   ├── ui/              # shadcn/ui Atoms
│   │   ├── button/
│   │   ├── switch/
│   │   ├── checkbox/
│   │   ├── slider/
│   │   ├── input/
│   │   └── label/
│   └── Button/          # 既存コンポーネント
├── molecules/
│   ├── ui/              # shadcn/ui Molecules
│   │   ├── dialog/
│   │   ├── dropdown-menu/
│   │   ├── popover/
│   │   ├── tooltip/
│   │   ├── alert/
│   │   └── form/
│   └── DataTable/       # 既存コンポーネント
└── organisms/
    ├── ui/              # shadcn/ui Organisms
    │   ├── navigation-menu/
    │   ├── command/
    │   └── sheet/
    └── layout/          # 既存コンポーネント
```

### 9.3 shadcn/uiコンポーネントの分類

#### Atoms（原子）

**shadcn/ui Atoms:**
- `button` - ボタン要素
- `switch` - スイッチ要素
- `checkbox` - チェックボックス要素
- `slider` - スライダー要素
- `input` - 入力要素
- `label` - ラベル要素

**実装例:**
```typescript
// src/components/atoms/ui/button/Button.tsx
export { Button } from "@/components/ui/button"

// src/components/atoms/ui/switch/Switch.tsx
export { Switch } from "@/components/ui/switch"
```

#### Molecules（分子）

**shadcn/ui Molecules:**
- `dialog` - ダイアログ（モーダル）
- `dropdown-menu` - ドロップダウンメニュー
- `popover` - ポップオーバー
- `tooltip` - ツールチップ
- `alert` - アラート
- `form` - フォーム要素

**実装例:**
```typescript
// src/components/molecules/ui/dialog/ConfirmDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/atoms/ui/button/Button"

interface ConfirmDialogProps {
  title: string
  description: string
  onConfirm: () => void
  children: React.ReactNode
}

export function ConfirmDialog({ title, description, onConfirm, children }: ConfirmDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline">キャンセル</Button>
          <Button onClick={onConfirm}>確認</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

#### Organisms（有機体）

**shadcn/ui Organisms:**
- `navigation-menu` - ナビゲーションメニュー
- `command` - コマンドパレット
- `sheet` - サイドシート

**実装例:**
```typescript
// src/components/organisms/ui/navigation/NavigationMenu.tsx
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu"

export function NavigationMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>統計データ</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink>ランキング</NavigationMenuLink>
            <NavigationMenuLink>ダッシュボード</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
```

### 9.4 既存コンポーネントとの使い分け

#### 使い分けガイドライン

| 用途 | 使用するコンポーネント | 理由 |
|------|----------------------|------|
| **基本的なボタン** | 既存の`Button` | プロジェクト固有のスタイルと機能 |
| **対話的コンポーネント** | shadcn/ui `Dialog`, `DropdownMenu` | アクセシビリティとUXの向上 |
| **フォーム要素** | 既存の`Input`, `Select` | 既存のバリデーション統合 |
| **データ表示** | 既存の`DataTable` | プロジェクト固有の機能とスタイル |
| **レイアウト** | 既存の`Header`, `Sidebar` | プロジェクト固有の構造 |

#### 統合例

```typescript
// src/components/molecules/EstatDataForm.tsx
import { FormField } from "@/components/molecules/ui/form/FormField"
import { Button } from "@/components/atoms/Button" // 既存コンポーネント
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog" // shadcn/ui

export function EstatDataForm() {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>統計データ検索</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <FormField label="都道府県" placeholder="都道府県を選択" />
          <FormField label="統計項目" placeholder="統計項目を選択" />
          <div className="flex justify-end space-x-2">
            <Button variant="outline">キャンセル</Button>
            <Button>検索</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 9.5 カスタマイズ戦略

#### 1. プロジェクト固有のラッパーコンポーネント

```typescript
// src/components/atoms/ui/button/CustomButton.tsx
import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CustomButtonProps extends ButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "primary"
}

export function CustomButton({ className, variant = "default", ...props }: CustomButtonProps) {
  return (
    <Button
      className={cn(
        // 既存のカスタムクラスを追加
        "font-medium transition-all duration-200",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
      variant={variant === "primary" ? "default" : variant}
      {...props}
    />
  )
}
```

#### 2. テーマシステムとの統合

```typescript
// src/lib/theme.ts
export const themeConfig = {
  light: {
    background: "hsl(0 0% 100%)",
    foreground: "hsl(222.2 84% 4.9%)",
    primary: "hsl(220 14% 96%)", // 既存のプライマリカラー
    primaryForeground: "hsl(220 9% 46%)",
  },
  dark: {
    background: "hsl(222.2 84% 4.9%)",
    foreground: "hsl(210 40% 98%)",
    primary: "hsl(220 9% 46%)",
    primaryForeground: "hsl(220 14% 96%)",
  }
}
```

### 9.6 導入フェーズ

#### Phase 1: 基盤構築
- Dialog、DropdownMenu、Popover、Tooltip
- 対話的コンポーネントの基盤を構築

#### Phase 2: Atomic Design統合
- `src/components/atoms/ui/`、`src/components/molecules/ui/`、`src/components/organisms/ui/`
- 既存のAtomic Design構造に自然に組み込み

#### Phase 3: 段階的拡張
- 必要なコンポーネントを順次追加
- 既存コンポーネントとの使い分けを明確化

### 9.7 ベストプラクティス

#### 1. インポート規約

```typescript
// ✅ 良い例：明確なインポートパス
import { Button } from "@/components/atoms/ui/button/Button"
import { Dialog } from "@/components/molecules/ui/dialog/Dialog"

// ❌ 悪い例：直接的なインポート
import { Button } from "@/components/ui/button"
```

#### 2. 命名規則

```typescript
// shadcn/uiコンポーネントはui/プレフィックスを使用
src/components/atoms/ui/button/
src/components/molecules/ui/dialog/
src/components/organisms/ui/navigation-menu/
```

#### 3. テスト戦略

```typescript
// shadcn/uiコンポーネントのテスト
// src/components/molecules/ui/dialog/__tests__/ConfirmDialog.test.tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { ConfirmDialog } from "../ConfirmDialog"

describe("ConfirmDialog", () => {
  it("確認ボタンクリック時にonConfirmが呼ばれる", () => {
    const mockOnConfirm = jest.fn()
    render(
      <ConfirmDialog title="テスト" description="説明" onConfirm={mockOnConfirm}>
        <button>開く</button>
      </ConfirmDialog>
    )
    
    fireEvent.click(screen.getByText("開く"))
    fireEvent.click(screen.getByText("確認"))
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })
})
```

### 9.8 参考資料

- [shadcn/ui統合ガイド](./11_shadcn-ui統合ガイド.md) - 詳細なセットアップと使用方法
- [技術選定評価_2025.md](技術選定評価_2025.md) - shadcn/ui選定理由
- [スタイルガイド](../02_デザインシステム/01_スタイルガイド.md) - 既存デザインシステムとの統合

Atomic Design は、UI コンポーネントを階層的に整理し、再利用性と保守性を向上させる優れた設計手法です。stats47 プロジェクトでは、以下の原則に従って実装しています：

### 8.1 実装の原則

1. **階層の明確化**: Atoms → Molecules → Organisms → Templates → Pages
2. **単一責任**: 各コンポーネントは一つの明確な責任を持つ
3. **再利用性**: 異なるコンテキストで使用可能
4. **一貫性**: デザインシステムに従う
5. **型安全性**: TypeScript の型定義を活用

### 8.2 開発フロー

1. **Atoms の作成**: 最小単位の UI 要素
2. **Molecules の作成**: Atoms を組み合わせた機能単位
3. **Organisms の作成**: 複雑な UI パターン
4. **Templates の作成**: ページレイアウトの骨組み
5. **Pages の作成**: 完成形のページ

### 8.3 品質保証

- **単体テスト**: 各コンポーネントの動作確認
- **Storybook**: コンポーネントの分離開発
- **型チェック**: TypeScript による型安全性
- **アクセシビリティ**: WCAG 準拠の実装

## 関連ドキュメント

- [コンポーネントアーキテクチャ](../03_技術設計/コンポーネントアーキテクチャ.md) - 設計原則とアーキテクチャパターン
- [コンポーネント実装ガイド](./09_コンポーネント実装ガイド.md) - 具体的な実装手順
- [スタイルガイド](../02_デザインシステム/01_スタイルガイド.md) - 視覚的デザインシステム
- [コーディング規約](./01_コーディング規約.md) - コーディング規約とベストプラクティス
