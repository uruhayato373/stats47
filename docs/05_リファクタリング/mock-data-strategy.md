# モックデータ戦略: 画面設計・開発用

## 概要

画面設計や開発時に、e-Stat APIに依存せずに作業を進めるためのモックデータ戦略とStorybookでの設定方法を説明します。

## 目的

1. **API依存の排除**: APIキーやネットワーク接続なしで開発可能
2. **開発速度の向上**: API制限を気にせず高速に反復開発
3. **再現性の確保**: 同じデータで一貫したテストとレビューが可能
4. **オフライン開発**: ネットワーク環境に依存しない開発
5. **コスト削減**: 開発中のAPI呼び出しコストを削減

## データ格納戦略

### ディレクトリ構造

```
stats47/
├── .gitignore
├── .storybookignore
├── data/                          # データルートディレクトリ
│   ├── README.md                  # データディレクトリの説明
│   ├── .gitkeep                   # 空ディレクトリをGit管理
│   ├── mock/                      # モックデータ（デプロイ対象外）
│   │   ├── README.md              # モックデータの取得方法
│   │   ├── estat/                 # e-Statモックデータ
│   │   │   ├── raw/               # 生APIレスポンス
│   │   │   │   ├── 0000010101.json
│   │   │   │   ├── 0000010102.json
│   │   │   │   └── ...
│   │   │   ├── formatted/         # 整形済みデータ
│   │   │   │   ├── 0000010101.json
│   │   │   │   ├── 0000010102.json
│   │   │   │   └── ...
│   │   │   └── catalog.json       # データカタログ
│   │   └── fixtures/              # テスト用フィクスチャ
│   │       ├── minimal.json       # 最小限のデータ
│   │       ├── complete.json      # 完全なデータ
│   │       └── edge-cases.json    # エッジケース
│   └── public/                    # 公開データ（デプロイ対象）
│       └── sample/                # サンプルデータ（小さいデータのみ）
│           └── demo.json
├── src/
│   ├── lib/
│   │   └── mock-data/             # モックデータローダー
│   │       ├── loader.ts          # データ読み込みユーティリティ
│   │       ├── provider.tsx       # Reactコンテキストプロバイダー
│   │       └── types.ts           # 型定義
│   └── stories/                   # Storybook ストーリー
│       └── mock-data.ts           # Storybook用モックデータ
└── .storybook/
    ├── main.ts
    ├── preview.tsx
    └── webpack.config.js          # モックデータのエイリアス設定
```

### .gitignore の設定

```gitignore
# モックデータ（デプロイ対象外、容量が大きいため）
data/mock/estat/raw/*.json
data/mock/estat/formatted/*.json

# ただし、catalog.jsonとREADME.mdは追跡する
!data/mock/estat/catalog.json
!data/mock/README.md

# フィクスチャは追跡する（小さいため）
!data/mock/fixtures/*.json

# 環境ごとの設定ファイル
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### .vercel/vercel.json の設定（デプロイ除外）

Vercelなどのホスティングサービスでデプロイ対象から除外：

```json
{
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  },
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./src ./public",
  "installCommand": "npm ci",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### Next.js の設定（next.config.js）

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 本番ビルドではdata/mockを除外
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // 本番ビルド時にmockデータへの参照を削除
      config.resolve.alias['@/data/mock'] = false;
    }
    return config;
  },

  // 環境変数で制御
  env: {
    USE_MOCK_DATA: process.env.NODE_ENV === 'development' ? 'true' : 'false',
  },
};

module.exports = nextConfig;
```

## データカタログの作成

### data/mock/estat/catalog.json

```json
{
  "version": "1.0.0",
  "generatedAt": "2025-10-14T10:30:00Z",
  "datasets": [
    {
      "id": "0000010101",
      "title": "Ａ　人口・世帯",
      "statName": "社会・人口統計体系",
      "govOrg": "総務省",
      "files": {
        "raw": "data/mock/estat/raw/0000010101.json",
        "formatted": "data/mock/estat/formatted/0000010101.json"
      },
      "metadata": {
        "updatedDate": "2025-06-30",
        "recordCount": 2400,
        "size": {
          "raw": "1.2MB",
          "formatted": "850KB"
        }
      },
      "tags": ["人口", "都道府県", "時系列"]
    },
    {
      "id": "0000010102",
      "title": "Ｂ　自然環境",
      "statName": "社会・人口統計体系",
      "govOrg": "総務省",
      "files": {
        "raw": "data/mock/estat/raw/0000010102.json",
        "formatted": "data/mock/estat/formatted/0000010102.json"
      },
      "metadata": {
        "updatedDate": "2025-06-30",
        "recordCount": 1200,
        "size": {
          "raw": "600KB",
          "formatted": "400KB"
        }
      },
      "tags": ["環境", "都道府県"]
    }
  ],
  "fixtures": [
    {
      "name": "minimal",
      "description": "最小限のデータ（1地域、1年度、1カテゴリ）",
      "file": "data/mock/fixtures/minimal.json",
      "useCase": "単体テスト、最小構成の確認"
    },
    {
      "name": "complete",
      "description": "完全なデータ（47都道府県、50年分、複数カテゴリ）",
      "file": "data/mock/fixtures/complete.json",
      "useCase": "統合テスト、パフォーマンステスト"
    },
    {
      "name": "edge-cases",
      "description": "エッジケース（NULL値、特殊文字、異常値）",
      "file": "data/mock/fixtures/edge-cases.json",
      "useCase": "エラーハンドリング、バリデーションテスト"
    }
  ]
}
```

### data/mock/README.md

```markdown
# モックデータディレクトリ

## 概要

このディレクトリには、開発・テスト用のモックデータが格納されます。

## 注意事項

⚠️ **このディレクトリのJSONファイルはGitで追跡されません**

- データサイズが大きいため、`.gitignore`で除外されています
- 各開発者が個別にデータをダウンロードする必要があります

## データの取得方法

### 方法1: CLIコマンドでダウンロード

```bash
# 単一のデータセットをダウンロード
npm run mock:download -- 0000010101

# 複数のデータセットをダウンロード
npm run mock:download -- 0000010101 0000010102 0000010103

# カタログからすべてダウンロード
npm run mock:download-all
```

### 方法2: 手動ダウンロード

1. e-Stat APIから直接データを取得
2. `data/mock/estat/raw/` にJSONファイルを保存
3. フォーマットスクリプトを実行

```bash
npm run mock:format -- 0000010101
```

### 方法3: 既存のバックアップから復元

```bash
# チーム共有のストレージから取得
npm run mock:restore
```

## ディレクトリ構造

- `estat/raw/` - e-Stat APIから取得した生データ
- `estat/formatted/` - 整形済みデータ
- `fixtures/` - テスト用の小さなデータセット（Git追跡対象）

## データの更新

```bash
# 特定のデータセットを更新
npm run mock:update -- 0000010101

# すべてのデータセットを更新
npm run mock:update-all
```
```

## モックデータローダーの実装

### src/lib/mock-data/loader.ts

```typescript
import fs from 'fs/promises';
import path from 'path';
import { FormattedEstatData } from '@/lib/estat/types';

/**
 * モックデータのベースディレクトリ
 */
const MOCK_DATA_DIR = path.join(process.cwd(), 'data', 'mock', 'estat');

/**
 * モックデータローダー
 * 開発環境でのみ使用される
 */
export class MockDataLoader {
  /**
   * 整形済みデータを読み込む
   */
  static async loadFormatted(statsDataId: string): Promise<FormattedEstatData> {
    const filePath = path.join(MOCK_DATA_DIR, 'formatted', `${statsDataId}.json`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(
        `モックデータが見つかりません: ${statsDataId}\n` +
        `パス: ${filePath}\n` +
        `データをダウンロードしてください: npm run mock:download -- ${statsDataId}`
      );
    }
  }

  /**
   * 生データを読み込む
   */
  static async loadRaw(statsDataId: string): Promise<any> {
    const filePath = path.join(MOCK_DATA_DIR, 'raw', `${statsDataId}.json`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`生データが見つかりません: ${statsDataId}`);
    }
  }

  /**
   * フィクスチャを読み込む
   */
  static async loadFixture(fixtureName: string): Promise<FormattedEstatData> {
    const filePath = path.join(
      process.cwd(),
      'data',
      'mock',
      'fixtures',
      `${fixtureName}.json`
    );

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`フィクスチャが見つかりません: ${fixtureName}`);
    }
  }

  /**
   * カタログを読み込む
   */
  static async loadCatalog(): Promise<any> {
    const filePath = path.join(MOCK_DATA_DIR, 'catalog.json');

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error('カタログが見つかりません');
    }
  }

  /**
   * 利用可能なデータセットIDのリストを取得
   */
  static async listAvailableDatasets(): Promise<string[]> {
    const catalog = await this.loadCatalog();
    return catalog.datasets.map((ds: any) => ds.id);
  }

  /**
   * データが存在するかチェック
   */
  static async exists(statsDataId: string, type: 'raw' | 'formatted' = 'formatted'): Promise<boolean> {
    const filePath = path.join(MOCK_DATA_DIR, type, `${statsDataId}.json`);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
```

### src/lib/mock-data/provider.tsx

```typescript
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FormattedEstatData } from '@/lib/estat/types';

interface MockDataContextValue {
  useMockData: boolean;
  setUseMockData: (use: boolean) => void;
  mockData: Record<string, FormattedEstatData>;
  loadMockData: (statsDataId: string) => Promise<void>;
}

const MockDataContext = createContext<MockDataContextValue | undefined>(undefined);

export function MockDataProvider({ children }: { children: React.ReactNode }) {
  const [useMockData, setUseMockData] = useState(
    process.env.NODE_ENV === 'development'
  );
  const [mockData, setMockData] = useState<Record<string, FormattedEstatData>>({});

  const loadMockData = async (statsDataId: string) => {
    if (mockData[statsDataId]) {
      return; // 既にロード済み
    }

    try {
      // クライアントサイドでは、APIルート経由で取得
      const response = await fetch(`/api/mock-data/${statsDataId}`);
      if (!response.ok) {
        throw new Error(`Failed to load mock data: ${response.statusText}`);
      }

      const data = await response.json();
      setMockData(prev => ({ ...prev, [statsDataId]: data }));
    } catch (error) {
      console.error('Failed to load mock data:', error);
      throw error;
    }
  };

  return (
    <MockDataContext.Provider
      value={{ useMockData, setUseMockData, mockData, loadMockData }}
    >
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(MockDataContext);
  if (!context) {
    throw new Error('useMockData must be used within MockDataProvider');
  }
  return context;
}
```

### src/app/api/mock-data/[id]/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { MockDataLoader } from '@/lib/mock-data/loader';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 開発環境でのみ許可
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Mock data API is only available in development' },
      { status: 403 }
    );
  }

  try {
    const { id } = params;
    const data = await MockDataLoader.loadFormatted(id);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to load mock data:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load mock data'
      },
      { status: 404 }
    );
  }
}
```

## Storybookの設定

### .storybook/main.ts

```typescript
import type { StorybookConfig } from '@storybook/nextjs';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  webpackFinal: async (config) => {
    // モックデータへのパスエイリアスを設定
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/data/mock': path.resolve(__dirname, '../data/mock'),
      };
    }

    return config;
  },
  staticDirs: ['../public', '../data/mock/fixtures'],
};

export default config;
```

### .storybook/preview.tsx

```typescript
import type { Preview } from '@storybook/react';
import { MockDataProvider } from '../src/lib/mock-data/provider';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <MockDataProvider>
        <Story />
      </MockDataProvider>
    ),
  ],
};

export default preview;
```

### src/stories/mock-data.ts

```typescript
import { FormattedEstatData } from '@/lib/estat/types';

/**
 * Storybook用のモックデータ
 * フィクスチャから読み込むか、インラインで定義
 */

export const minimalMockData: FormattedEstatData = {
  tableInfo: {
    id: '0000010101',
    title: 'Ａ　人口・世帯',
    statName: '社会・人口統計体系',
    govOrg: '総務省',
    statisticsName: '都道府県データ 基礎データ',
    totalNumber: 1,
    fromNumber: 1,
    toNumber: 1,
  },
  areas: [
    {
      areaCode: '13000',
      areaName: '東京都',
      level: '2',
    },
  ],
  categories: [
    {
      categoryCode: 'A1101',
      categoryName: 'A1101_総人口',
      displayName: '総人口',
      unit: '人',
    },
  ],
  years: [
    {
      timeCode: '2020100000',
      timeName: '2020年度',
    },
  ],
  values: [
    {
      value: 13921000,
      unit: '人',
      areaCode: '13000',
      areaName: '東京都',
      categoryCode: 'A1101',
      categoryName: '総人口',
      timeCode: '2020100000',
      timeName: '2020年度',
    },
  ],
  metadata: {
    processedAt: '2025-10-14T10:30:00Z',
    totalRecords: 1,
    validValues: 1,
    nullValues: 0,
  },
};

export const completeMockData: FormattedEstatData = {
  // 完全なデータを定義（または外部ファイルから読み込む）
  // ...
};

/**
 * モックデータのバリエーション
 */
export const mockDataVariants = {
  minimal: minimalMockData,
  complete: completeMockData,
  withNullValues: {
    // NULL値を含むデータ
  },
  largeDataset: {
    // 大量データ
  },
};
```

## コンポーネントのStory例

### src/stories/RankingTable.stories.tsx

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { RankingTable } from '@/components/RankingTable';
import { minimalMockData, completeMockData } from './mock-data';

const meta = {
  title: 'Components/RankingTable',
  component: RankingTable,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RankingTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// 最小限のデータ
export const Minimal: Story = {
  args: {
    data: minimalMockData,
  },
};

// 完全なデータ
export const Complete: Story = {
  args: {
    data: completeMockData,
  },
};

// ローディング状態
export const Loading: Story = {
  args: {
    data: undefined,
    isLoading: true,
  },
};

// エラー状態
export const Error: Story = {
  args: {
    data: undefined,
    error: 'データの取得に失敗しました',
  },
};

// NULL値を含むデータ
export const WithNullValues: Story = {
  args: {
    data: {
      ...minimalMockData,
      values: minimalMockData.values.map((v, i) => ({
        ...v,
        value: i % 2 === 0 ? v.value : 0, // 半分をNULLに
      })),
    },
  },
};
```

## CLIコマンドの実装

### scripts/download-mock-data.ts

```typescript
#!/usr/bin/env tsx

import { EstatStatsDataService } from '@/lib/estat';
import fs from 'fs/promises';
import path from 'path';

async function downloadMockData(statsDataId: string) {
  console.log(`📥 ダウンロード中: ${statsDataId}`);

  try {
    // 生データを取得
    const rawData = await EstatStatsDataService.getStatsDataRaw(statsDataId);
    const rawPath = path.join(
      process.cwd(),
      'data',
      'mock',
      'estat',
      'raw',
      `${statsDataId}.json`
    );
    await fs.writeFile(rawPath, JSON.stringify(rawData, null, 2));
    console.log(`✅ 生データ保存完了: ${rawPath}`);

    // 整形済みデータを生成
    const formattedData = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
    const formattedPath = path.join(
      process.cwd(),
      'data',
      'mock',
      'estat',
      'formatted',
      `${statsDataId}.json`
    );
    await fs.writeFile(formattedPath, JSON.stringify(formattedData, null, 2));
    console.log(`✅ 整形済みデータ保存完了: ${formattedPath}`);

    return { success: true, statsDataId };
  } catch (error) {
    console.error(`❌ エラー: ${statsDataId}`, error);
    return { success: false, statsDataId, error };
  }
}

async function main() {
  const ids = process.argv.slice(2);

  if (ids.length === 0) {
    console.error('使用方法: npm run mock:download -- <statsDataId1> [statsDataId2] ...');
    process.exit(1);
  }

  console.log(`🚀 ${ids.length}件のデータをダウンロードします`);

  for (const id of ids) {
    await downloadMockData(id);
    // API制限対策で少し待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('🎉 すべてのダウンロードが完了しました');
}

main().catch(console.error);
```

### package.json（スクリプト追加）

```json
{
  "scripts": {
    "mock:download": "tsx scripts/download-mock-data.ts",
    "mock:download-all": "tsx scripts/download-all-mock-data.ts",
    "mock:update": "tsx scripts/update-mock-data.ts",
    "mock:update-all": "tsx scripts/update-all-mock-data.ts",
    "mock:format": "tsx scripts/format-mock-data.ts",
    "mock:restore": "tsx scripts/restore-mock-data.ts"
  }
}
```

## ベストプラクティス

### 1. データのバージョン管理

```typescript
// catalog.jsonにバージョン情報を含める
{
  "version": "1.0.0",
  "datasets": [
    {
      "id": "0000010101",
      "dataVersion": "2025-06-30", // データのバージョン
      "schemaVersion": "1.0.0"      // スキーマのバージョン
    }
  ]
}
```

### 2. データの検証

```typescript
// データの整合性を検証
import Ajv from 'ajv';

const ajv = new Ajv();
const schema = {
  type: 'object',
  required: ['tableInfo', 'areas', 'categories', 'years', 'values'],
  properties: {
    tableInfo: { type: 'object' },
    areas: { type: 'array' },
    // ...
  },
};

const validate = ajv.compile(schema);

export function validateMockData(data: any): boolean {
  const valid = validate(data);
  if (!valid) {
    console.error('Validation errors:', validate.errors);
  }
  return valid;
}
```

### 3. データの圧縮

大きなデータは圧縮して保存：

```bash
# gzipで圧縮
gzip data/mock/estat/raw/*.json

# 使用時に解凍
gunzip -k data/mock/estat/raw/0000010101.json.gz
```

### 4. 環境変数での制御

```typescript
// .env.local
USE_MOCK_DATA=true
MOCK_DATA_PATH=/path/to/mock/data

// 使用例
const useMockData = process.env.USE_MOCK_DATA === 'true';
```

## トラブルシューティング

### Q1: モックデータが見つからないエラー

```
Error: モックデータが見つかりません: 0000010101
```

**解決策**:
```bash
npm run mock:download -- 0000010101
```

### Q2: Storybookでデータが読み込めない

**確認事項**:
1. `.storybook/main.ts` のwebpack設定が正しいか
2. モックデータのパスが正しいか
3. Storybookを再起動したか

### Q3: デプロイ時にモックデータがビルドに含まれる

**解決策**:
1. `next.config.js` でwebpack aliasをfalseに設定
2. `.gitignore` に追加されているか確認
3. 環境変数で制御

## まとめ

### メリット

✅ **開発速度の向上**: API依存なしで高速開発
✅ **コスト削減**: 開発中のAPI呼び出しコストを削減
✅ **オフライン開発**: ネットワーク不要で開発可能
✅ **再現性**: 同じデータで一貫したテスト
✅ **Storybookとの統合**: 画面設計とレビューが容易

### デメリットと対策

❌ **データの陳腐化** → 定期的な更新スクリプトを用意
❌ **データサイズ** → Git LFSや圧縮を活用
❌ **データの同期** → カタログファイルで管理

この戦略により、効率的な画面設計・開発が可能になります。
