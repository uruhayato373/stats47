---
title: Storybook 開発ガイド
created: 2025-10-14
updated: 2025-10-16
tags:
  - development-guide
---

# Storybook 開発ガイド

## 概要

このドキュメントでは、stats47プロジェクトにおけるStorybookの開発ガイドラインとベストプラクティスを定義します。

## ディレクトリ構造

### 推奨構成

```
stats47/
├── .storybook/                        # Storybook設定ディレクトリ
│   ├── main.ts                        # メイン設定
│   ├── preview.tsx                    # プレビュー設定（グローバルデコレーター等）
│   ├── manager.ts                     # マネージャー設定（UI カスタマイズ）
│   ├── theme.ts                       # カスタムテーマ
│   └── test-runner.ts                 # テストランナー設定
│
├── src/
│   ├── components/                    # コンポーネント
│   │   ├── ui/                        # 基本UIコンポーネント
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.stories.tsx    # 同階層にストーリー
│   │   │   │   ├── Button.test.tsx       # 同階層にテスト
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Input.stories.tsx
│   │   │   │   └── index.ts
│   │   │   └── ...
│   │   │
│   │   ├── features/                  # 機能別コンポーネント
│   │   │   ├── RankingTable/
│   │   │   │   ├── RankingTable.tsx
│   │   │   │   ├── RankingTable.stories.tsx
│   │   │   │   └── index.ts
│   │   │   └── ...
│   │   │
│   │   └── layouts/                   # レイアウトコンポーネント
│   │       ├── Header/
│   │       │   ├── Header.tsx
│   │       │   ├── Header.stories.tsx
│   │       │   └── index.ts
│   │       └── ...
│   │
│   └── stories/                       # ストーリー専用ディレクトリ
│       ├── Introduction.mdx           # イントロダクション
│       ├── DesignSystem.mdx           # デザインシステム
│       ├── Colors.stories.tsx         # カラーパレット
│       ├── Typography.stories.tsx     # タイポグラフィ
│       ├── Spacing.stories.tsx        # スペーシング
│       ├── mock-data.ts               # モックデータ
│       ├── decorators.tsx             # カスタムデコレーター
│       └── pages/                     # ページレベルのストーリー
│           ├── HomePage.stories.tsx
│           ├── RankingPage.stories.tsx
│           └── ...
│
└── public/
    └── storybook-assets/              # Storybook専用アセット
        ├── images/
        └── fonts/
```

## ファイル配置の方針

### 原則1: コロケーション（Co-location）

**コンポーネントと同じディレクトリにストーリーを配置**

```
✅ 推奨
components/ui/Button/
├── Button.tsx
├── Button.stories.tsx      # 同じディレクトリ
├── Button.test.tsx
└── index.ts

❌ 非推奨
components/ui/Button/
├── Button.tsx
└── index.ts

stories/
└── Button.stories.tsx      # 別ディレクトリ
```

**理由**:
- コンポーネントとストーリーの関連性が明確
- ファイルの検索・編集が容易
- コンポーネント削除時にストーリーも一緒に削除される
- インポートパスが短くなる

### 原則2: 階層的な整理

Storybookのサイドバーは階層構造で表示されるため、論理的に整理します。

```
Storybook サイドバー:
├── 📖 Introduction
├── 🎨 Design System
│   ├── Colors
│   ├── Typography
│   └── Spacing
├── 🧱 UI Components
│   ├── Button
│   ├── Input
│   ├── Card
│   └── ...
├── ⚙️ Features
│   ├── RankingTable
│   ├── ChartViewer
│   └── ...
├── 📄 Layouts
│   ├── Header
│   ├── Footer
│   └── Sidebar
└── 📱 Pages
    ├── HomePage
    ├── RankingPage
    └── ...
```

## ストーリーファイルの命名規則

### ファイル名

```typescript
// パターン1: コンポーネント名.stories.tsx（推奨）
Button.stories.tsx
RankingTable.stories.tsx

// パターン2: コンポーネント名.stories.mdx（ドキュメント重視）
Button.stories.mdx
```

**命名ルール**:
- PascalCase を使用
- `.stories.tsx` または `.stories.mdx` で終わる
- コンポーネント名と一致させる

### ストーリーの階層（title）

```typescript
// UIコンポーネント
export default {
  title: 'UI Components/Button',
  component: Button,
} satisfies Meta<typeof Button>;

// 機能コンポーネント
export default {
  title: 'Features/RankingTable',
  component: RankingTable,
} satisfies Meta<typeof RankingTable>;

// ページ
export default {
  title: 'Pages/HomePage',
  component: HomePage,
} satisfies Meta<typeof HomePage>;
```

**命名ルール**:
- `/` でカテゴリを区切る
- 最大3階層まで（深すぎると見づらい）
- カテゴリ名は複数形（例: Components, Features, Pages）

## ストーリーファイルのテンプレート

### 基本テンプレート

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

// メタデータ（コンポーネント全体の設定）
const meta = {
  title: 'UI Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'ボタンコンポーネントの説明をここに記述',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline'],
      description: 'ボタンのバリエーション',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'ボタンのサイズ',
    },
    disabled: {
      control: 'boolean',
      description: '無効状態',
    },
    onClick: {
      action: 'clicked',
      description: 'クリックイベント',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ストーリー（個別の状態）
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
    size: 'md',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    children: 'Small Button',
    variant: 'primary',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    variant: 'primary',
    size: 'lg',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    variant: 'primary',
    disabled: true,
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <IconPlus /> Button with Icon
      </>
    ),
    variant: 'primary',
  },
};
```

### 複雑なストーリー（デコレーター使用）

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { RankingTable } from './RankingTable';
import { MockDataProvider } from '@/lib/mock-data/provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const meta = {
  title: 'Features/RankingTable',
  component: RankingTable,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => {
      const queryClient = new QueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <MockDataProvider>
            <div style={{ padding: '2rem' }}>
              <Story />
            </div>
          </MockDataProvider>
        </QueryClientProvider>
      );
    },
  ],
} satisfies Meta<typeof RankingTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    statsDataId: '0000010101',
    categoryCode: 'A1101',
    yearCode: '2020',
  },
};

export const Loading: Story = {
  args: {
    statsDataId: '0000010101',
    categoryCode: 'A1101',
    yearCode: '2020',
  },
  parameters: {
    mockData: {
      loading: true,
    },
  },
};

export const Error: Story = {
  args: {
    statsDataId: '0000010101',
    categoryCode: 'A1101',
    yearCode: '2020',
  },
  parameters: {
    mockData: {
      error: 'データの取得に失敗しました',
    },
  },
};
```

### MDXストーリー（ドキュメント重視）

```mdx
import { Meta, Canvas, Story, Controls } from '@storybook/blocks';
import { Button } from './Button';

<Meta title="UI Components/Button" component={Button} />

# Button

ボタンコンポーネントは、ユーザーのアクションを実行するための主要なインタラクティブ要素です。

## 使用例

### 基本的な使い方

<Canvas>
  <Story
    name="Basic"
    args={{
      children: 'Click me',
      variant: 'primary',
    }}
  >
    {(args) => <Button {...args} />}
  </Story>
</Canvas>

### バリエーション

<Canvas>
  <div style={{ display: 'flex', gap: '1rem' }}>
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
  </div>
</Canvas>

### サイズ

<Canvas>
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
  </div>
</Canvas>

## Props

<Controls />

## デザインガイドライン

- Primary: 最も重要なアクション（フォーム送信など）
- Secondary: 補助的なアクション（キャンセルなど）
- Outline: 控えめなアクション

## アクセシビリティ

- キーボード操作が可能（Enter/Space）
- フォーカスインジケーターを表示
- aria-label を適切に設定
```

## .storybook/ 設定ファイル

### .storybook/main.ts

```typescript
import type { StorybookConfig } from '@storybook/nextjs';
import path from 'path';

const config: StorybookConfig = {
  // ストーリーファイルのパス
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],

  // アドオン
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',              // アクセシビリティ
    '@storybook/addon-themes',            // テーマ切り替え
    'storybook-dark-mode',                // ダークモード
  ],

  framework: {
    name: '@storybook/nextjs',
    options: {},
  },

  docs: {
    autodocs: 'tag',                      // @docs タグで自動ドキュメント生成
  },

  // Webpack設定のカスタマイズ
  webpackFinal: async (config) => {
    // パスエイリアス
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../src'),
        '@/data/mock': path.resolve(__dirname, '../data/mock'),
      };
    }

    return config;
  },

  // 静的ファイル
  staticDirs: [
    '../public',
    '../data/mock/fixtures',
  ],

  // TypeScript設定
  typescript: {
    check: false,                         // 型チェックを無効化（高速化）
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
```

### .storybook/preview.tsx

```typescript
import type { Preview } from '@storybook/react';
import { MockDataProvider } from '../src/lib/mock-data/provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../src/styles/globals.css';

// グローバルなQueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',                   // デフォルトレイアウト
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
        },
      },
    },
  },

  // グローバルデコレーター
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MockDataProvider>
          <Story />
        </MockDataProvider>
      </QueryClientProvider>
    ),
  ],

  // グローバルタグ
  tags: ['autodocs'],
};

export default preview;
```

### .storybook/manager.ts

```typescript
import { addons } from '@storybook/manager-api';
import { themes } from '@storybook/theming';
import customTheme from './theme';

addons.setConfig({
  theme: customTheme,
  panelPosition: 'right',               // パネルを右側に配置
  selectedPanel: 'controls',            // デフォルトで表示するパネル
  enableShortcuts: true,                // キーボードショートカットを有効化
  showToolbar: true,                    // ツールバーを表示
  sidebar: {
    showRoots: true,                    // ルート階層を表示
    collapsedRoots: ['Design System'],  // デフォルトで折りたたむ階層
  },
});
```

### .storybook/theme.ts

```typescript
import { create } from '@storybook/theming/create';

export default create({
  base: 'light',

  // ブランディング
  brandTitle: 'Stats47 Storybook',
  brandUrl: 'https://stats47.example.com',
  brandImage: '/logo.svg',
  brandTarget: '_self',

  // カラー
  colorPrimary: '#3b82f6',
  colorSecondary: '#10b981',

  // UI
  appBg: '#f9fafb',
  appContentBg: '#ffffff',
  appBorderColor: '#e5e7eb',
  appBorderRadius: 8,

  // テキスト
  textColor: '#1f2937',
  textInverseColor: '#ffffff',

  // ツールバー
  barTextColor: '#6b7280',
  barSelectedColor: '#3b82f6',
  barBg: '#ffffff',

  // フォーム
  inputBg: '#ffffff',
  inputBorder: '#d1d5db',
  inputTextColor: '#1f2937',
  inputBorderRadius: 6,
});
```

## ストーリーの分類とベストプラクティス

### 1. UIコンポーネント（Atomic Design）

```
UI Components/
├── Atoms/              # 最小単位（Button, Input, Icon）
├── Molecules/          # 複合（InputWithLabel, SearchBox）
└── Organisms/          # 複雑（Form, Card）
```

**ストーリーに含めるバリエーション**:
- ✅ デフォルト状態
- ✅ すべてのバリアント（primary, secondary, etc.）
- ✅ すべてのサイズ（sm, md, lg）
- ✅ インタラクティブ状態（hover, active, focus）
- ✅ 無効状態（disabled）
- ✅ ローディング状態
- ✅ エラー状態
- ✅ 空状態（empty）

### 2. 機能コンポーネント

```
Features/
├── RankingTable/
├── ChartViewer/
└── DataFilter/
```

**ストーリーに含めるシナリオ**:
- ✅ 正常なデータ表示
- ✅ ローディング中
- ✅ エラー発生時
- ✅ データなし（空状態）
- ✅ 大量データ
- ✅ ユーザーインタラクション（ソート、フィルター等）

### 3. レイアウトコンポーネント

```
Layouts/
├── Header/
├── Footer/
└── Sidebar/
```

**ストーリーに含めるパターン**:
- ✅ デスクトップ表示
- ✅ タブレット表示
- ✅ モバイル表示
- ✅ ログイン前/後

### 4. ページコンポーネント

```
Pages/
├── HomePage/
├── RankingPage/
└── AboutPage/
```

**ストーリーに含める内容**:
- ✅ 初期表示
- ✅ データロード後
- ✅ 各種状態遷移
- ✅ レスポンシブ対応

## 共通パターンとヘルパー

### src/stories/decorators.tsx

```typescript
import { Decorator } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * ページレイアウト用デコレーター
 */
export const withPageLayout: Decorator = (Story) => (
  <div style={{ minHeight: '100vh', padding: '2rem', background: '#f9fafb' }}>
    <Story />
  </div>
);

/**
 * 中央配置デコレーター
 */
export const withCentered: Decorator = (Story) => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <Story />
  </div>
);

/**
 * React Query デコレーター
 */
export const withReactQuery: Decorator = (Story) => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  );
};

/**
 * ダークモードデコレーター
 */
export const withDarkMode: Decorator = (Story) => (
  <div className="dark">
    <Story />
  </div>
);
```

### src/stories/mock-data.ts

```typescript
import { FormattedEstatData } from '@/lib/estat/types';

/**
 * 共通のモックデータ
 */
export const mockDataSets = {
  minimal: {
    // 最小限のデータ
  },
  complete: {
    // 完全なデータ
  },
  loading: null,
  error: null,
};

/**
 * モックデータ生成ヘルパー
 */
export function createMockData(overrides?: Partial<FormattedEstatData>): FormattedEstatData {
  return {
    tableInfo: {
      id: '0000010101',
      title: 'テスト統計',
      ...overrides?.tableInfo,
    },
    // ...
  };
}
```

## ドキュメント作成のベストプラクティス

### 1. 自動ドキュメント（autodocs）を活用

```typescript
export default {
  title: 'UI Components/Button',
  component: Button,
  tags: ['autodocs'],  // 自動でドキュメント生成
} satisfies Meta<typeof Button>;
```

### 2. コンポーネントの説明を追加

```typescript
export default {
  title: 'UI Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: `
ボタンコンポーネントは、ユーザーのアクションを実行するための
主要なインタラクティブ要素です。

## 使用上の注意
- Primary は1ページに1つまで
- 破壊的なアクションには Secondary を使用
        `,
      },
    },
  },
} satisfies Meta<typeof Button>;
```

### 3. 各ストーリーに説明を追加

```typescript
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
  parameters: {
    docs: {
      description: {
        story: 'もっとも重要なアクションに使用します。1ページに1つまで。',
      },
    },
  },
};
```

### 4. アクセシビリティテストを含める

```typescript
export default {
  title: 'UI Components/Button',
  component: Button,
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
} satisfies Meta<typeof Button>;
```

## インタラクションテスト

### .storybook/test-runner.ts

```typescript
import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  async postRender(page, context) {
    // インタラクションテストの実行
    const elementHandler = await page.$('#root');
    const innerHTML = await elementHandler?.innerHTML();
    expect(innerHTML).toBeTruthy();
  },
};

export default config;
```

### インタラクションテストの例

```typescript
import { expect } from '@storybook/jest';
import { userEvent, within } from '@storybook/testing-library';

export const WithInteraction: Story = {
  args: {
    children: 'Click me',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /click me/i });

    // ボタンをクリック
    await userEvent.click(button);

    // アクションが呼ばれたことを確認
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  },
};
```

## ディレクトリ別の責務

### src/components/*/  (コンポーネントと同階層)
**責務**: 個別コンポーネントのストーリー
- コンポーネントの全バリエーション
- 状態の網羅
- インタラクション例

### src/stories/  (専用ディレクトリ)
**責務**: プロジェクト全体に関わるストーリー
- デザインシステム（Colors, Typography, Spacing）
- イントロダクション
- ページレベルのストーリー
- 共通のモックデータ・デコレーター

## ベストプラクティスまとめ

### ✅ DO（推奨）

1. **コンポーネントと同じディレクトリにストーリーを配置**
   ```
   components/Button/Button.stories.tsx
   ```

2. **階層的にタイトルを設定**
   ```typescript
   title: 'UI Components/Button'
   ```

3. **すべての状態をカバー**
   - Default, Loading, Error, Empty, Disabled

4. **autodocs を活用**
   ```typescript
   tags: ['autodocs']
   ```

5. **モックデータを一元管理**
   ```typescript
   import { mockDataSets } from '@/stories/mock-data';
   ```

6. **デコレーターで環境を整える**
   ```typescript
   decorators: [withReactQuery, withPageLayout]
   ```

7. **アクセシビリティテストを含める**
   ```typescript
   parameters: { a11y: { config: { rules: [...] } } }
   ```

### ❌ DON'T（非推奨）

1. **別のディレクトリにストーリーを分離しない**
   ```
   ❌ components/Button/Button.tsx
   ❌ stories/Button.stories.tsx
   ```

2. **過度に深い階層を作らない**
   ```
   ❌ title: 'Components/UI/Buttons/Primary/Large'
   ```

3. **ハードコードされたモックデータを使わない**
   ```typescript
   ❌ args: { data: { id: 1, name: 'test', ... } }
   ```

4. **実際のAPIを呼び出さない**
   ```typescript
   ❌ await fetch('/api/data')
   ```

5. **環境依存のコードを含めない**
   ```typescript
   ❌ if (process.env.NODE_ENV === 'production')
   ```

## チェックリスト

新しいストーリーを作成する際のチェックリスト：

- [ ] コンポーネントと同じディレクトリに配置
- [ ] 適切な title を設定（最大3階層）
- [ ] meta 設定に parameters を含める
- [ ] autodocs タグを追加
- [ ] デフォルトストーリーを作成
- [ ] 主要な状態をカバー（Loading, Error, Empty）
- [ ] すべてのバリアントをカバー
- [ ] インタラクティブな要素は play 関数でテスト
- [ ] アクセシビリティを考慮
- [ ] モックデータは共通ファイルから読み込み
- [ ] 必要に応じてデコレーターを使用
- [ ] ドキュメントの説明を追加

## まとめ

このベストプラクティスに従うことで：

✅ **一貫性**: プロジェクト全体で統一されたストーリー構造
✅ **保守性**: コンポーネントとストーリーが常に同期
✅ **発見性**: 論理的な階層で目的のストーリーを素早く発見
✅ **品質**: すべての状態とバリエーションをカバー
✅ **ドキュメント**: 自動生成された包括的なドキュメント

効率的なコンポーネント開発とデザインレビューが可能になります。
