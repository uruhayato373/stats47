# e-STAT統計ダッシュボード プロジェクト設計書

## 1. プロジェクト概要

### 1.1 目的
e-STAT APIを活用し、日本の統計データを視覚的に表現する統計ダッシュボードおよびブログシステムを構築する。

### 1.2 主要機能
- 統計ダッシュボード（グリッドレイアウトでコンポーネント配置）
- 都道府県ランキングのMDXブログ記事
- コロプレス地図による地域別データ可視化
- ランキングデータのブログ記事自動生成
- レスポンシブデザイン対応

### 1.3 技術スタック
- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **状態管理**: Jotai
- **スタイリング**: Tailwind CSS + shadcn/ui
- **データ可視化**: D3.js, Recharts
- **APIクライアント**: TanStack Query
- **MDX処理**: next-mdx-remote
- **デプロイ**: Cloudflare Pages
- **CI/CD**: GitHub Actions

## 2. ディレクトリ構造

```
project-root/
├── app/                          # Next.js App Router
│   ├── api/                     # API Routes
│   │   ├── estat/              # e-STAT APIプロキシ
│   │   │   ├── population/
│   │   │   │   ├── total/route.ts
│   │   │   │   ├── by-prefecture/route.ts
│   │   │   │   └── trend/route.ts
│   │   │   ├── gdp/
│   │   │   └── employment/
│   │   └── cache/              # キャッシュ管理
│   ├── dashboard/              # ダッシュボードページ
│   │   ├── page.tsx           # グリッドレイアウト表示
│   │   └── layout.tsx
│   ├── rankings/               # ランキングページ
│   │   ├── page.tsx           # ランキング一覧
│   │   └── [slug]/
│   │       └── page.tsx       # MDXブログ記事表示
│   ├── map/                    # 地図表示ページ
│   │   └── page.tsx
│   ├── layout.tsx              # ルートレイアウト
│   └── page.tsx                # ホームページ
├── components/                  # Reactコンポーネント
│   ├── ui/                     # 基本UIコンポーネント
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── skeleton.tsx
│   │   ├── grid.tsx           # グリッドレイアウト
│   │   └── table.tsx
│   ├── dashboard/              # ダッシュボードコンポーネント
│   │   ├── DashboardGrid.tsx  # グリッドコンテナ
│   │   ├── GridItem.tsx       # グリッドアイテム
│   │   ├── KPICard.tsx        # KPI表示カード
│   │   ├── ChartWidget.tsx    # チャートウィジェット
│   │   └── WidgetHeader.tsx   # ウィジェットヘッダー
│   ├── charts/                 # チャートコンポーネント
│   │   ├── D3BarChart.tsx
│   │   ├── D3LineChart.tsx
│   │   ├── D3PieChart.tsx
│   │   └── DeviationChart.tsx
│   ├── maps/                   # 地図コンポーネント
│   │   ├── PrefectureMap.tsx
│   │   ├── ChoroplethMap.tsx  # コロプレス地図
│   │   └── MapLegend.tsx      # 地図凡例
│   ├── rankings/               # ランキングコンポーネント
│   │   ├── RankingTable.tsx
│   │   ├── RankingCard.tsx
│   │   └── RankingChart.tsx
│   └── mdx/                    # MDX用コンポーネント
│       ├── MDXProvider.tsx
│       └── MDXComponents.tsx  # MDX内で使用するコンポーネント
├── lib/                         # ライブラリ・ユーティリティ
│   ├── estat/                  # e-STAT API関連
│   │   ├── client.ts          # APIクライアント
│   │   ├── constants.ts       # 定数（統計表ID等）
│   │   └── transformer.ts     # データ変換
│   ├── ranking/                # ランキング処理
│   │   └── dataProcessor.ts
│   ├── blog/                   # ブログ記事生成
│   │   └── articleGenerator.ts
│   ├── mdx/                    # MDX処理
│   │   └── mdxProcessor.ts
│   ├── cache.ts               # キャッシュ処理
│   └── utils.ts               # 汎用ユーティリティ
├── store/                       # Jotai状態管理
│   ├── atoms/                  # Atom定義
│   │   ├── dashboard.ts       # ダッシュボード状態
│   │   ├── filters.ts         # フィルター状態
│   │   ├── map.ts             # 地図状態
│   │   └── ui.ts              # UI状態
│   ├── hooks/                  # Jotaiカスタムフック
│   │   ├── useDashboard.ts
│   │   └── useFilters.ts
│   └── providers.tsx          # Jotaiプロバイダー
├── hooks/                       # カスタムフック
│   ├── useEstatData.ts
│   ├── useResponsiveGrid.ts
│   └── usePrefectureData.ts
├── types/                       # TypeScript型定義
│   ├── estat.ts
│   ├── dashboard.ts
│   ├── ranking.ts
│   └── map.ts
├── data/                        # 静的データ・生成データ
│   ├── rankings/               # ランキングJSONデータ
│   └── prefectures.json       # 都道府県マスタデータ
├── content/                     # MDXコンテンツ
│   └── rankings/               # ランキング記事（MDX形式）
│       ├── population.mdx
│       ├── gdp.mdx
│       └── employment.mdx
├── public/                      # 静的アセット
│   └── images/
├── scripts/                     # ビルドスクリプト
│   └── generateRankings.ts    # ランキングデータ生成
├── styles/                      # グローバルスタイル
│   └── globals.css
├── .env.local                   # 環境変数（ローカル）
├── .env.example                 # 環境変数サンプル
├── next.config.js              # Next.js設定
├── wrangler.toml               # Cloudflare Workers設定
├── tailwind.config.ts          # Tailwind CSS設定
├── tsconfig.json               # TypeScript設定
└── package.json                # 依存関係

```

## 3. 状態管理（Jotai）

### 3.1 Atom設計

```typescript
// store/atoms/dashboard.ts
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// ダッシュボードレイアウト状態
export const dashboardLayoutAtom = atomWithStorage('dashboardLayout', {
  columns: 12,
  rowHeight: 100,
  gap: 16,
});

// ウィジェット配置状態
export const widgetsAtom = atom<DashboardWidget[]>([
  {
    id: 'kpi-population',
    type: 'kpi',
    gridArea: { x: 0, y: 0, w: 3, h: 1 },
    title: '総人口',
  },
  {
    id: 'chart-trend',
    type: 'chart',
    gridArea: { x: 0, y: 1, w: 6, h: 3 },
    title: '人口推移',
  },
  {
    id: 'map-density',
    type: 'map',
    gridArea: { x: 6, y: 1, w: 6, h: 4 },
    title: '人口密度マップ',
  },
]);

// フィルター状態
export const selectedYearAtom = atom<number>(2024);
export const selectedPrefectureAtom = atom<string | null>(null);
export const selectedCategoryAtom = atom<string>('population');

// ダッシュボード編集モード
export const isEditModeAtom = atom(false);
```

### 3.2 派生状態

```typescript
// store/atoms/dashboard.ts
import { atom } from 'jotai';

// フィルター適用済みデータ
export const filteredDataAtom = atom((get) => {
  const year = get(selectedYearAtom);
  const prefecture = get(selectedPrefectureAtom);
  const category = get(selectedCategoryAtom);
  
  // フィルタリングロジック
  return filterData({ year, prefecture, category });
});

// グリッドレスポンシブ設定
export const responsiveGridAtom = atom((get) => {
  const layout = get(dashboardLayoutAtom);
  const windowWidth = get(windowWidthAtom);
  
  if (windowWidth < 640) return { ...layout, columns: 4 };
  if (windowWidth < 1024) return { ...layout, columns: 8 };
  return layout;
});
```

## 4. ダッシュボードページ設計

### 4.1 グリッドレイアウト実装

```typescript
// app/dashboard/page.tsx
'use client';

import { useAtom } from 'jotai';
import { widgetsAtom, dashboardLayoutAtom } from '@/store/atoms/dashboard';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default function DashboardPage() {
  const [widgets] = useAtom(widgetsAtom);
  const [layout] = useAtom(dashboardLayoutAtom);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <DashboardGrid
          widgets={widgets}
          columns={layout.columns}
          rowHeight={layout.rowHeight}
          gap={layout.gap}
        />
      </main>
    </div>
  );
}
```

### 4.2 グリッドコンポーネント

```typescript
// components/dashboard/DashboardGrid.tsx
import { useAtom } from 'jotai';
import { isEditModeAtom } from '@/store/atoms/dashboard';
import { GridItem } from './GridItem';

interface DashboardGridProps {
  widgets: DashboardWidget[];
  columns: number;
  rowHeight: number;
  gap: number;
}

export function DashboardGrid({ widgets, columns, rowHeight, gap }: DashboardGridProps) {
  const [isEditMode] = useAtom(isEditModeAtom);

  return (
    <div
      className={`dashboard-grid ${isEditMode ? 'edit-mode' : ''}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridAutoRows: `${rowHeight}px`,
        gap: `${gap}px`,
      }}
    >
      {widgets.map((widget) => (
        <GridItem key={widget.id} widget={widget}>
          {renderWidget(widget)}
        </GridItem>
      ))}
    </div>
  );
}
```

## 5. ランキングページ（MDX）設計

### 5.1 MDXブログレイアウト

```typescript
// app/rankings/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getRankingBySlug, getAllRankings } from '@/lib/mdx/mdxProcessor';
import { ChoroplethMap } from '@/components/maps/ChoroplethMap';
import { RankingTable } from '@/components/rankings/RankingTable';
import { DeviationChart } from '@/components/charts/DeviationChart';

// MDX内で使用可能なコンポーネント
const components = {
  ChoroplethMap,
  RankingTable,
  DeviationChart,
  h1: (props: any) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
  h2: (props: any) => <h2 className="text-2xl font-semibold mt-6 mb-3" {...props} />,
  p: (props: any) => <p className="text-gray-700 mb-4 leading-relaxed" {...props} />,
};

export async function generateStaticParams() {
  const rankings = await getAllRankings();
  return rankings.map((ranking) => ({
    slug: ranking.slug,
  }));
}

export default async function RankingPage({ params }: { params: { slug: string } }) {
  const ranking = await getRankingBySlug(params.slug);

  if (!ranking) {
    notFound();
  }

  return (
    <article className="max-w-7xl mx-auto px-4 py-8">
      <div className="prose prose-lg max-w-none">
        <MDXRemote source={ranking.content} components={components} />
      </div>
    </article>
  );
}
```

### 5.2 MDXコンテンツ例

```mdx
---
title: 都道府県別人口ランキング 2024年版
date: 2024-01-15
category: population
tags: [人口, 統計, 都道府県]
description: 2024年最新の都道府県別人口ランキングと詳細分析
---

# 都道府県別人口ランキング 2024年版

## 概要

2024年の日本の総人口は約1億2,400万人となり、前年比で0.5%の減少を記録しました。
本記事では、最新の統計データを基に都道府県別の人口ランキングを詳しく分析します。

## 人口分布マップ

<ChoroplethMap
  dataUrl="/api/estat/population/by-prefecture?year=2024"
  colorScheme="blues"
  title="都道府県別人口分布（2024年）"
  showLegend={true}
  interactive={true}
/>

## ランキングTOP10

<RankingTable
  dataUrl="/api/estat/population/ranking?year=2024&limit=10"
  columns={['rank', 'name', 'population', 'change', 'deviation']}
  showTrend={true}
/>

## 統計分析

### 偏差値分布

<DeviationChart
  dataUrl="/api/estat/population/deviation?year=2024"
  height={400}
  showAverage={true}
/>

### 地域別傾向

東京都を筆頭とする首都圏への人口集中が続いている一方で、
地方都市では人口減少が加速しています。

## まとめ

- 東京都の人口は1,400万人を超え、全国の11.3%を占める
- 上位3都府県（東京、大阪、神奈川）で全国人口の約30%
- 偏差値60以上は8都道府県のみ
```

## 6. Cloudflareデプロイ設定

### 6.1 next.config.js設定

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 静的エクスポート for Cloudflare Pages
  images: {
    unoptimized: true, // Cloudflare Pages用
  },
  experimental: {
    mdxRs: true,
  },
};

module.exports = nextConfig;
```

### 6.2 wrangler.toml設定

```toml
# wrangler.toml
name = "estat-dashboard"
compatibility_date = "2024-01-15"

[site]
bucket = "./out"

[env.production]
workers_dev = false
route = "estat-dashboard.example.com/*"

[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

[vars]
ESTAT_API_KEY = "your-api-key"
```

### 6.3 Cloudflare Functions（API Routes代替）

```typescript
// functions/api/estat/population/total.ts
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const year = url.searchParams.get('year') || '2024';
  
  // KVキャッシュチェック
  const cacheKey = `population:total:${year}`;
  const cached = await env.CACHE.get(cacheKey);
  
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // e-STAT APIコール
  const estatResponse = await fetch(
    `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${env.ESTAT_API_KEY}&statsDataId=0003448237&cdTime=${year}`
  );
  
  const data = await estatResponse.json();
  const transformed = transformData(data);
  
  // KVに保存（1時間TTL）
  await env.CACHE.put(cacheKey, JSON.stringify(transformed), {
    expirationTtl: 3600,
  });
  
  return new Response(JSON.stringify(transformed), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### 6.4 GitHub Actions（Cloudflareデプロイ）

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0' # 週次更新

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate ranking data
        run: npm run generate:rankings
        env:
          ESTAT_API_KEY: ${{ secrets.ESTAT_API_KEY }}
      
      - name: Build project
        run: npm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: estat-dashboard
          directory: out
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

## 7. コロプレス地図コンポーネント

### 7.1 実装

```typescript
// components/maps/ChoroplethMap.tsx
'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useAtom } from 'jotai';
import { selectedPrefectureAtom } from '@/store/atoms/dashboard';
import { usePrefectureData } from '@/hooks/usePrefectureData';

interface ChoroplethMapProps {
  dataUrl?: string;
  data?: PrefectureData[];
  colorScheme?: 'blues' | 'reds' | 'greens' | 'purples';
  title?: string;
  showLegend?: boolean;
  interactive?: boolean;
  width?: number;
  height?: number;
  onPrefectureClick?: (prefecture: string) => void;
}

export function ChoroplethMap({
  dataUrl,
  data: propData,
  colorScheme = 'blues',
  title,
  showLegend = true,
  interactive = false,
  width = 800,
  height = 600,
  onPrefectureClick,
}: ChoroplethMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedPrefecture, setSelectedPrefecture] = useAtom(selectedPrefectureAtom);
  const { data: fetchedData, loading } = usePrefectureData(dataUrl);
  
  const data = propData || fetchedData;
  
  useEffect(() => {
    if (!data || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    // 日本地図のTopoJSON読み込み
    d3.json('/data/japan.topojson').then((topology: any) => {
      const geojson = topojson.feature(topology, topology.objects.prefectures);
      
      // カラースケール設定
      const colorScale = d3.scaleSequential()
        .domain(d3.extent(data, d => d.value))
        .interpolator(d3[`interpolate${colorScheme.charAt(0).toUpperCase()}${colorScheme.slice(1)}`]);
      
      // 地図投影法
      const projection = d3.geoMercator()
        .center([138, 38])
        .scale(1500)
        .translate([width / 2, height / 2]);
      
      const path = d3.geoPath().projection(projection);
      
      // 都道府県描画
      const prefectures = svg.append('g')
        .selectAll('path')
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', (d: any) => {
          const prefData = data.find(p => p.code === d.properties.code);
          return prefData ? colorScale(prefData.value) : '#ccc';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('class', 'prefecture-path');
      
      // インタラクティブ機能
      if (interactive) {
        prefectures
          .style('cursor', 'pointer')
          .on('mouseover', function(event, d: any) {
            d3.select(this)
              .attr('stroke', '#333')
              .attr('stroke-width', 2);
            
            // ツールチップ表示
            const prefData = data.find(p => p.code === d.properties.code);
            if (prefData) {
              showTooltip(event, prefData);
            }
          })
          .on('mouseout', function() {
            d3.select(this)
              .attr('stroke', '#fff')
              .attr('stroke-width', 0.5);
            hideTooltip();
          })
          .on('click', (event, d: any) => {
            setSelectedPrefecture(d.properties.code);
            onPrefectureClick?.(d.properties.code);
          });
      }
      
      // 凡例表示
      if (showLegend) {
        const legendWidth = 200;
        const legendHeight = 10;
        
        const legendScale = d3.scaleLinear()
          .domain(colorScale.domain())
          .range([0, legendWidth]);
        
        const legendAxis = d3.axisBottom(legendScale)
          .ticks(5)
          .tickFormat(d3.format('.0f'));
        
        const legend = svg.append('g')
          .attr('transform', `translate(${width - legendWidth - 20}, ${height - 40})`);
        
        // グラデーション定義
        const gradient = svg.append('defs')
          .append('linearGradient')
          .attr('id', 'legend-gradient');
        
        gradient.selectAll('stop')
          .data(d3.range(0, 1.01, 0.01))
          .enter()
          .append('stop')
          .attr('offset', d => `${d * 100}%`)
          .attr('stop-color', d => colorScale(legendScale.invert(d * legendWidth)));
        
        legend.append('rect')
          .attr('width', legendWidth)
          .attr('height', legendHeight)
          .style('fill', 'url(#legend-gradient)');
        
        legend.append('g')
          .attr('transform', `translate(0, ${legendHeight})`)
          .call(legendAxis);
      }
    });
  }, [data, colorScheme, width, height, interactive, showLegend]);
  
  if (loading) {
    return <div>Loading map...</div>;
  }
  
  return (
    <div className="choropleth-map-container">
      {title && <h3 className="text-xl font-semibold mb-4">{title}</h3>}
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
}
```

## 8. 開発環境セットアップ

### 8.1 パッケージインストール

```json
{
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "jotai": "^2.6.2",
    "d3": "^7.8.5",
    "recharts": "^2.10.3",
    "@tanstack/react-query": "^5.17.9",
    "next-mdx-remote": "^4.4.1",
    "axios": "^1.6.5",
    "tailwindcss": "^3.4.1",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.309.0",
    "tailwind-merge": "^2.2.0",
    "topojson-client": "^3.1.0",
    "gray-matter": "^4.0.3"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.48",
    "@types/d3": "^7.4.3",
    "@types/topojson-client": "^3.1.4",
    "typescript": "^5.3.3",
    "eslint": "^8.56.0",
    "prettier": "^3.2.4",
    "wrangler": "^3.22.4"
  }
}
```

### 8.2 プロジェクト初期化コマンド

```bash
# プロジェクト作成
npx create-next-app@latest estat-dashboard \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd estat-dashboard

# 依存関係インストール
npm install jotai d3 recharts @tanstack/react-query \
  next-mdx-remote axios topojson-client gray-matter \
  @radix-ui/react-dialog @radix-ui/react-select \
  @radix-ui/react-tabs lucide-react \
  class-variance-authority clsx tailwind-merge

# 開発用パッケージ
npm install -D @types/d3 @types/topojson-client wrangler

# Cloudflare CLI
npm install -D wrangler

# shadcn/ui初期化
npx shadcn-ui@latest init
```

## 9. パフォーマンス最適化

### 9.1 Cloudflare最適化

- **Edge Caching**: KV Namespaceでデータキャッシュ
- **Image Optimization**: Cloudflare Polish使用
- **Auto Minify**: HTML/CSS/JS自動圧縮
- **Brotli Compression**: 自動圧縮有効化

### 9.2 Next.js最適化

```javascript
// next.config.js
module.exports = {
  output: 'export',
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

## 10. 環境変数

```env
# .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ESTAT_API_KEY=your_estat_api_key

# Cloudflare
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_KV_NAMESPACE_ID=your_kv_namespace_id

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 11. テスト戦略

### 11.1 コンポーネントテスト

```typescript
// __tests__/components/ChoroplethMap.test.tsx
import { render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { ChoroplethMap } from '@/components/maps/ChoroplethMap';

describe('ChoroplethMap', () => {
  it('renders map with title', () => {
    render(
      <Provider>
        <ChoroplethMap title="Test Map" data={mockData} />
      </Provider>
    );
    expect(screen.getByText('Test Map')).toBeInTheDocument();
  });
});
```

### 11.2 Jotai状態テスト

```typescript
// __tests__/store/dashboard.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAtom } from 'jotai';
import { Provider } from 'jotai';
import { widgetsAtom, isEditModeAtom } from '@/store/atoms/dashboard';

describe('Dashboard atoms', () => {
  it('toggles edit mode', () => {
    const { result } = renderHook(() => useAtom(isEditModeAtom), {
      wrapper: Provider,
    });
    
    expect(result.current[0]).toBe(false);
    
    act(() => {
      result.current[1](true);
    });
    
    expect(result.current[0]).toBe(true);
  });
});
```

## 12. MDX記事生成スクリプト

### 12.1 自動生成スクリプト

```typescript
// scripts/generateRankings.ts
import fs from 'fs/promises';
import path from 'path';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface RankingConfig {
  id: string;
  title: string;
  statsDataId: string;
  year: string;
  category: string;
  tags: string[];
}

const RANKING_CONFIGS: RankingConfig[] = [
  {
    id: 'population-2024',
    title: '都道府県別人口ランキング 2024年版',
    statsDataId: '0003448237',
    year: '2024',
    category: 'population',
    tags: ['人口', '統計', '都道府県', '2024年'],
  },
  {
    id: 'gdp-2024',
    title: '都道府県別GDP ランキング 2024年版',
    statsDataId: '0003448238',
    year: '2024',
    category: 'economy',
    tags: ['GDP', '経済', '都道府県', '2024年'],
  },
  {
    id: 'employment-2024',
    title: '都道府県別就業率ランキング 2024年版',
    statsDataId: '0003448239',
    year: '2024',
    category: 'employment',
    tags: ['就業率', '雇用', '都道府県', '2024年'],
  },
];

async function generateMDXContent(config: RankingConfig): Promise<string> {
  const currentDate = format(new Date(), 'yyyy-MM-dd');
  
  return `---
title: ${config.title}
date: ${currentDate}
category: ${config.category}
tags: [${config.tags.join(', ')}]
description: ${config.title}の詳細分析とインタラクティブマップ
statsDataId: ${config.statsDataId}
year: ${config.year}
---

# ${config.title}

## 📊 概要

${config.year}年の最新統計データに基づく都道府県別ランキングを、インタラクティブなビジュアライゼーションと共にお届けします。

## 🗾 インタラクティブマップ

下記の地図は、色の濃淡で各都道府県のデータを表現しています。マウスオーバーで詳細情報を確認でき、クリックすると該当都道府県の詳細ページに遷移します。

<ChoroplethMap
  dataUrl="/api/estat/${config.category}/by-prefecture?year=${config.year}"
  colorScheme="blues"
  title="${config.title.replace('ランキング', 'マップ')}"
  showLegend={true}
  interactive={true}
  width={900}
  height={600}
/>

## 📈 ランキングTOP10

<RankingTable
  dataUrl="/api/estat/${config.category}/ranking?year=${config.year}&limit=10"
  columns={['rank', 'name', 'value', 'change', 'deviation']}
  showTrend={true}
  highlightTop={3}
/>

## 📊 統計分析

### 偏差値分布グラフ

偏差値による分布を可視化し、全国平均との比較が一目でわかります。

<DeviationChart
  dataUrl="/api/estat/${config.category}/deviation?year=${config.year}"
  height={400}
  showAverage={true}
  showDistribution={true}
/>

### 地域別集計

<div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
  <div>
    <h4 className="font-semibold mb-3">関東地方</h4>
    <RankingChart
      dataUrl="/api/estat/${config.category}/regional?region=kanto&year=${config.year}"
      type="bar"
      compact={true}
    />
  </div>
  <div>
    <h4 className="font-semibold mb-3">関西地方</h4>
    <RankingChart
      dataUrl="/api/estat/${config.category}/regional?region=kansai&year=${config.year}"
      type="bar"
      compact={true}
    />
  </div>
</div>

## 📝 詳細分析

### 上位都道府県の特徴

1位から3位までの都道府県に共通する特徴として、以下の点が挙げられます：

- 大都市圏への集中傾向
- インフラ整備の充実度
- 産業構造の多様性

### 変化率ランキング

前年からの変化率が大きい都道府県：

<RankingTable
  dataUrl="/api/estat/${config.category}/change-rate?year=${config.year}&limit=5"
  columns={['rank', 'name', 'changeRate', 'previousYear', 'currentYear']}
  title="変化率TOP5"
/>

## 💡 考察とインサイト

### トレンド分析

過去5年間のトレンドを見ると、以下の傾向が明らかになっています：

<LineChart
  dataUrl="/api/estat/${config.category}/trend?years=5"
  title="5年間のトレンド"
  height={300}
  showLegend={true}
/>

### 今後の展望

- 都市部への集中は継続する見込み
- 地方創生施策の効果測定が重要
- DX推進による地域格差の解消可能性

## 📚 データソース

- **出典**: e-Stat（政府統計の総合窓口）
- **統計表ID**: ${config.statsDataId}
- **更新日**: ${format(new Date(), 'yyyy年MM月dd日', { locale: ja })}
- **データ年度**: ${config.year}年

## 🔗 関連リンク

- [e-Stat公式サイト](https://www.e-stat.go.jp/)
- [統計データAPI仕様書](https://www.e-stat.go.jp/api/)

---

*このランキングは定期的に更新されます。最新情報はブックマークしてご確認ください。*
`;
}

async function generateAllRankings() {
  const contentDir = path.join(process.cwd(), 'content', 'rankings');
  await fs.mkdir(contentDir, { recursive: true });
  
  for (const config of RANKING_CONFIGS) {
    console.log(`Generating ${config.id}...`);
    
    const content = await generateMDXContent(config);
    const filePath = path.join(contentDir, `${config.id}.mdx`);
    
    await fs.writeFile(filePath, content);
    console.log(`✅ Generated: ${filePath}`);
  }
  
  // インデックスファイル生成
  const indexContent = generateIndexFile(RANKING_CONFIGS);
  await fs.writeFile(
    path.join(contentDir, 'index.json'),
    JSON.stringify(indexContent, null, 2)
  );
}

function generateIndexFile(configs: RankingConfig[]) {
  return configs.map(config => ({
    slug: config.id,
    title: config.title,
    category: config.category,
    tags: config.tags,
    year: config.year,
    createdAt: new Date().toISOString(),
  }));
}

// 実行
if (require.main === module) {
  generateAllRankings()
    .then(() => console.log('✅ All rankings generated successfully'))
    .catch(console.error);
}
```

## 13. Cloudflare KVキャッシュ戦略

### 13.1 KV Namespace設計

```typescript
// lib/cache/cloudflare-kv.ts
export class CloudflareKVCache {
  constructor(private kv: KVNamespace) {}
  
  // キャッシュキー生成
  private generateKey(type: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join(':');
    return `${type}:${sortedParams}`;
  }
  
  // データ取得（キャッシュ優先）
  async get<T>(
    type: string,
    params: Record<string, any>,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    const key = this.generateKey(type, params);
    
    // キャッシュチェック
    const cached = await this.kv.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // データ取得
    const data = await fetcher();
    
    // キャッシュ保存
    await this.kv.put(key, JSON.stringify(data), {
      expirationTtl: ttl,
    });
    
    return data;
  }
  
  // キャッシュ削除
  async invalidate(type: string, params?: Record<string, any>): Promise<void> {
    if (params) {
      const key = this.generateKey(type, params);
      await this.kv.delete(key);
    } else {
      // 型に一致するすべてのキーを削除
      const list = await this.kv.list({ prefix: `${type}:` });
      for (const key of list.keys) {
        await this.kv.delete(key.name);
      }
    }
  }
}
```

### 13.2 Cloudflare Functions実装

```typescript
// functions/api/[[catchall]].ts
import { CloudflareKVCache } from '@/lib/cache/cloudflare-kv';
import { EstatAPIClient } from '@/lib/estat/client';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = params.catchall as string[];
  
  // KVキャッシュ初期化
  const cache = new CloudflareKVCache(env.CACHE);
  
  // ルーティング
  if (path[0] === 'estat') {
    const estatClient = new EstatAPIClient(env.ESTAT_API_KEY);
    
    switch (path.join('/')) {
      case 'estat/population/by-prefecture':
        return handlePrefecturePopulation(url, cache, estatClient);
      case 'estat/gdp/by-prefecture':
        return handlePrefectureGDP(url, cache, estatClient);
      default:
        return new Response('Not Found', { status: 404 });
    }
  }
  
  return new Response('Not Found', { status: 404 });
};

async function handlePrefecturePopulation(
  url: URL,
  cache: CloudflareKVCache,
  client: EstatAPIClient
): Promise<Response> {
  const year = url.searchParams.get('year') || '2024';
  
  const data = await cache.get(
    'population:prefecture',
    { year },
    async () => {
      const rawData = await client.fetchData({
        statsDataId: '0003448237',
        cdTime: year,
      });
      return transformPrefectureData(rawData);
    },
    3600 // 1時間キャッシュ
  );
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
```

## 14. 監視とログ

### 14.1 Cloudflare Analytics統合

```typescript
// lib/analytics/cloudflare-analytics.ts
export class CloudflareAnalytics {
  static track(event: string, properties?: Record<string, any>) {
    if (typeof window !== 'undefined' && window.zaraz) {
      window.zaraz.track(event, properties);
    }
  }
  
  static pageView(path: string) {
    this.track('page_view', { path });
  }
  
  static apiCall(endpoint: string, duration: number, success: boolean) {
    this.track('api_call', {
      endpoint,
      duration,
      success,
    });
  }
}
```

### 14.2 エラーログ

```typescript
// lib/logging/error-logger.ts
export class ErrorLogger {
  static async log(error: Error, context?: Record<string, any>) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...context,
    };
    
    // Cloudflare Logpush or Workers Analytics
    if (process.env.NODE_ENV === 'production') {
      await fetch('/api/logs/error', {
        method: 'POST',
        body: JSON.stringify(errorData),
      });
    } else {
      console.error('Error logged:', errorData);
    }
  }
}
```

## 15. コスト最適化

### 15.1 Cloudflare無料プラン活用

| リソース | 無料枠 | 推奨設定 |
|---------|--------|---------|
| Pages | 500デプロイ/月 | 週次デプロイ |
| Workers | 100,000リクエスト/日 | KVキャッシュで削減 |
| KV Storage | 100,000読み取り/日 | 1時間TTL設定 |
| 帯域幅 | 無制限 | 画像最適化で削減 |

### 15.2 最適化戦略

```javascript
// cloudflare-optimization.config.js
export const optimizationConfig = {
  // 画像最適化
  images: {
    format: 'auto', // WebP/AVIF自動選択
    quality: 85,
    polish: 'lossless',
  },
  
  // キャッシュ設定
  cache: {
    'api/*': 3600,        // API: 1時間
    'static/*': 86400,    // 静的: 1日
    'rankings/*': 604800, // ランキング: 1週間
  },
  
  // 圧縮
  compression: {
    brotli: true,
    gzip: true,
    minify: {
      html: true,
      css: true,
      js: true,
    },
  },
};
```

## 16. 今後の拡張計画

### Phase 1（MVP - 1ヶ月）
- ✅ 基本ダッシュボード
- ✅ コロプレス地図
- ✅ MDXランキング記事
- ✅ Cloudflareデプロイ

### Phase 2（2-3ヶ月）
- ダッシュボードカスタマイズ機能
- データエクスポート（CSV/PDF）
- 複数年度比較機能
- お気に入り都道府県機能

### Phase 3（4-6ヶ月）
- AIによる統計分析レポート
- 予測モデル実装
- リアルタイムデータ対応
- ユーザー投稿型インサイト

## 17. まとめ

本プロジェクトは、e-STAT APIを活用した統計ダッシュボードとブログシステムです。

**技術的特徴:**
- Jotaiによる効率的な状態管理
- Cloudflare Pagesによる高速配信
- MDXによる柔軟なコンテンツ管理
- D3.jsによるインタラクティブな可視化

**コスト面:**
- Cloudflare無料プランで運用可能
- 月額コスト: 0円
- スケーラビリティ確保

この設計に従って実装することで、高品質な統計ビジュアライゼーションプラットフォームを構築できます。