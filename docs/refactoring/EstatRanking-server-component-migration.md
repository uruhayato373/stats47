# EstatRankingコンポーネント サーバーコンポーネント化リファクタリング計画

## 概要

現在クライアントコンポーネントとして実装されている`EstatRanking`を、Next.js App Routerの特性を活かしてサーバーコンポーネント化し、e-stat APIからのデータ取得をサーバー側で実行するようにリファクタリングします。

**作成日**: 2025-10-10
**更新日**: 2025-10-10
**対象ファイル**: `src/components/ranking/EstatRanking/EstatRanking.tsx`

### 🔑 重要な設計判断

**年度変更の実装方法**: **URLパラメータ（SearchParams）** を採用

- ❌ **Server Actionsは不要** - フィルタリングにはURLパラメータが適切
- ✅ **URLで状態管理** - `?year=2023`のようにURLで年度を管理
- ✅ **ブラウザ履歴が機能** - 戻る/進むボタンが正常に動作
- ✅ **URLを共有可能** - 特定の年度のランキングをURLで共有できる

詳細は「[年度変更の実装アプローチ比較](#年度変更の実装アプローチ比較)」セクションを参照してください。

---

## 現在の構成と課題

### 現在の実装（クライアントコンポーネント）

```tsx
// src/components/ranking/EstatRanking/EstatRanking.tsx
"use client";

export const EstatRanking: React.FC<EstatRankingProps> = ({...}) => {
  const [formattedValues, setFormattedValues] = useState<FormattedValue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");

  // ステップ1: 年度一覧を取得（クライアント側）
  useEffect(() => {
    const fetchAvailableYears = async () => {
      const years = await EstatStatsDataService.getAvailableYears(...);
      setAvailableYears(years);
    };
    fetchAvailableYears();
  }, [...]);

  // ステップ2: 選択年度のデータを取得（クライアント側）
  useEffect(() => {
    const fetchData = async () => {
      const prefectureValues = await EstatStatsDataService.getPrefectureDataByYear(...);
      setFormattedValues(prefectureValues);
    };
    fetchData();
  }, [selectedYear, ...]);

  return (
    // UI rendering...
  );
};
```

### 課題

1. **データ取得がクライアント側で実行される**
   - 初回レンダリング時にローディング状態が表示される
   - ページロード後にAPIリクエストが発生するため、表示が遅延する
   - SEOの観点から不利（初期HTMLにデータが含まれない）

2. **e-stat APIへの直接アクセス**
   - クライアント側からe-stat APIを直接呼び出している
   - APIキーがクライアント側に露出する可能性
   - CORS制約がある

3. **ウォーターフォール型のデータ取得**
   - 年度一覧の取得 → 完了後にデータ取得
   - 並列化できていない

4. **キャッシュの未活用**
   - Next.js 15のServer Actionsやキャッシング機能を活用できていない

---

## リファクタリングの目標

### 達成したいこと

1. ✅ **サーバー側でのデータ取得**
   - 初回レンダリング時に既にデータが取得されている状態にする
   - e-stat APIへのアクセスをサーバー側に集約する

2. ✅ **SEO改善**
   - 初期HTMLにデータを含める
   - クローラーがデータを適切に認識できるようにする

3. ✅ **パフォーマンス向上**
   - データ取得の並列化
   - Next.jsのキャッシング機能を活用
   - 不要なローディング状態の削減

4. ✅ **アーキテクチャの改善**
   - Server ComponentとClient Componentの適切な分離
   - 責務の明確化

---

## アーキテクチャ設計

### コンポーネント分離戦略

```
┌─────────────────────────────────────────────────────────────┐
│ EstatRankingServerWrapper (Server Component)                │
│ - データ取得（年度一覧、初期年度のデータ）                 │
│ - e-stat API呼び出し                                        │
│ - エラーハンドリング                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Props経由でデータを渡す
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ EstatRankingClient (Client Component)                       │
│ - 年度選択UI                                                 │
│ - 地図表示（ChoroplethMap）                                  │
│ - データテーブル（PrefectureDataTableClient）                │
│ - 年度変更時のデータ再取得                                   │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ↓                                       ↓
┌──────────────────┐                  ┌──────────────────┐
│ ChoroplethMap    │                  │ PrefectureData   │
│ (Client)         │                  │ TableClient      │
│ - D3.js地図描画  │                  │ (Client)         │
│ - ツールチップ   │                  │ - ソート機能     │
└──────────────────┘                  └──────────────────┘
```

### データフロー（URLパラメータアプローチ）

```
1. 初回レンダリング（サーバー側）
   ┌─────────────────────────────────────────┐
   │ Server Component (EstatRankingServer)   │
   │                                         │
   │ 1. URLパラメータから年度を取得         │
   │    searchParams.year || defaultYear     │
   │                                         │
   │ 2. 年度一覧を取得                       │
   │    await getAvailableYears(...)         │
   │                                         │
   │ 3. 選択年度のデータを取得               │
   │    await getPrefectureData(..., year)   │
   │                                         │
   │ 4. データをClient Componentに渡す       │
   └─────────────────────────────────────────┘
                    │
                    │ data, availableYears, currentYear
                    ↓
   ┌─────────────────────────────────────────┐
   │ Client Component (EstatRankingClient)   │
   │                                         │
   │ - データで即座にレンダリング            │
   │ - ローディング状態なし                  │
   └─────────────────────────────────────────┘

2. 年度変更時（クライアント→サーバー）
   ┌─────────────────────────────────────────┐
   │ Client Component                        │
   │                                         │
   │ 1. ユーザーが年度セレクトを変更        │
   │    onChange={(e) => handleYearChange()} │
   │                                         │
   │ 2. URLパラメータを更新してルーター遷移  │
   │    router.push("?year=2023")            │
   └─────────────────────────────────────────┘
                    │
                    │ URL遷移（ソフトナビゲーション）
                    ↓
   ┌─────────────────────────────────────────┐
   │ Server Component (再レンダリング)      │
   │                                         │
   │ 1. 新しいURLパラメータから年度を取得   │
   │ 2. 新しい年度のデータを取得             │
   │ 3. Client Componentに新データを渡す     │
   └─────────────────────────────────────────┘
                    │
                    │ 新しいデータ
                    ↓
   ┌─────────────────────────────────────────┐
   │ Client Component (再レンダリング)      │
   │                                         │
   │ - 新しいデータで再レンダリング          │
   │ - Next.jsがスムーズに遷移               │
   └─────────────────────────────────────────┘
```

**メリット**:
- ✅ URLが状態を表現（`/ranking?year=2023`）
- ✅ ブラウザの戻る/進むボタンが機能
- ✅ URLを共有・ブックマーク可能
- ✅ Server Actionsが不要でシンプル

---

## 年度変更の実装アプローチ比較

### ❓ なぜServer Actionsが必要なのか？

実は、**年度選択のようなフィルタリング機能では、Server Actionsは必須ではありません**。

Next.jsでは、年度変更時のデータ再取得に複数のアプローチがあり、それぞれにメリット・デメリットがあります：

### アプローチ1: URLパラメータ（SearchParams）★ 推奨

```typescript
// Server Component
async function EstatRankingServer({
  params,
  searchParams
}: {
  searchParams: { year?: string }
}) {
  const selectedYear = searchParams.year || availableYears[0];
  const data = await getPrefectureData(..., selectedYear);

  return <EstatRankingClient data={data} />;
}

// Client Component
function YearSelector({ currentYear, availableYears }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleYearChange = (year: string) => {
    router.push(`${pathname}?year=${year}`);
  };
}
```

**メリット**:
- ✅ URLでフィルタ状態を管理（例: `/ranking?year=2023`）
- ✅ ブラウザの戻る/進むボタンが機能する
- ✅ URLを共有・ブックマークできる
- ✅ サーバーコンポーネントの利点を最大限活用
- ✅ Server Actionsは不要

**デメリット**:
- ⚠️ URL遷移が発生する（ただしNext.jsはソフトナビゲーション）
- ⚠️ ページ全体が再レンダリングされる

---

### アプローチ2: Server Actions

```typescript
// Server Action
'use server';
export async function getPrefectureDataAction(year: string) {
  return await getPrefectureData(..., year);
}

// Client Component
function EstatRankingClient() {
  const handleYearChange = async (year: string) => {
    const data = await getPrefectureDataAction(year);
    setData(data);
  };
}
```

**メリット**:
- ✅ URLが変わらない
- ✅ 部分的な更新のみ
- ✅ `useTransition`でスムーズな遷移

**デメリット**:
- ❌ URLにフィルタ状態が反映されない
- ❌ ブラウザの戻る/進むボタンが機能しない
- ❌ URLを共有できない
- ❌ Server Actionsは主にミューテーション（POST/PUT/DELETE）用

**使用ケース**: フォーム送信、いいね機能、カート追加など

---

### アプローチ3: Route Handler（API Routes）

```typescript
// app/api/estat/ranking/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const data = await getPrefectureData(..., year);
  return Response.json(data);
}

// Client Component
const handleYearChange = async (year: string) => {
  const res = await fetch(`/api/estat/ranking?year=${year}`);
  const data = await res.json();
  setData(data);
};
```

**メリット**:
- ✅ 従来のREST API的なアプローチ
- ✅ 外部クライアントからもアクセス可能

**デメリット**:
- ❌ Server Actionsより冗長
- ❌ 型安全性が低い
- ❌ Server Componentsの利点を活用できない

---

### アプローチ4: クライアント側のみ（ハイブリッド）

```typescript
// Server Component（初回のみ）
async function EstatRankingServer() {
  const initialData = await getPrefectureData(...);
  return <EstatRankingClient initialData={initialData} />;
}

// Client Component（年度変更はクライアント側）
function EstatRankingClient({ initialData }) {
  const handleYearChange = async (year: string) => {
    // EstatStatsDataServiceを直接呼び出し
    const data = await EstatStatsDataService.getPrefectureDataByYear(...);
    setData(data);
  };
}
```

**メリット**:
- ✅ 実装が簡単
- ✅ 初回はサーバー側で取得

**デメリット**:
- ❌ クライアント側からe-stat APIを直接呼び出す
- ❌ APIキーの露出リスク

---

### 🎯 推奨アプローチ: URLパラメータ（SearchParams）

**理由**:
1. **UX**: ブラウザの戻る/進むボタンが機能する
2. **共有性**: URLを他の人と共有できる
3. **SEO**: 各年度が個別のURLとしてインデックスされる
4. **Next.jsベストプラクティス**: Server Componentsの利点を最大限活用

**実装例**:
```typescript
// app/[category]/[subcategory]/ranking/page.tsx
export default async function RankingPage({
  params,
  searchParams
}: {
  params: { category: string; subcategory: string };
  searchParams: { year?: string };
}) {
  const subcategory = getSubcategoryById(params.subcategory);

  // サーバー側でデータ取得
  const availableYears = await getAvailableYears(...);
  const selectedYear = searchParams.year || availableYears[0];
  const data = await getPrefectureData(..., selectedYear);

  return (
    <EstatRankingClient
      data={data}
      availableYears={availableYears}
      currentYear={selectedYear}
    />
  );
}
```

---

## 実装計画（修正版）

### Phase 1: Server Component用のデータ取得関数作成

**ファイル**: `src/lib/estat/statsdata/server.ts` （新規作成）

```typescript
import { EstatStatsDataService } from "./EstatStatsDataService";
import { FormattedValue } from "../types/formatted";
import { cache } from "react";

/**
 * 年度一覧を取得（サーバー専用）
 * cache()でリクエストの重複を防ぐ
 */
export const getAvailableYears = cache(
  async (statsDataId: string, categoryCode: string): Promise<string[]> => {
    return await EstatStatsDataService.getAvailableYears(
      statsDataId,
      categoryCode
    );
  }
);

/**
 * 都道府県データを取得（サーバー専用）
 */
export const getPrefectureData = cache(
  async (
    statsDataId: string,
    categoryCode: string,
    yearCode: string,
    limit: number = 100000
  ): Promise<FormattedValue[]> => {
    return await EstatStatsDataService.getPrefectureDataByYear(
      statsDataId,
      categoryCode,
      yearCode,
      limit
    );
  }
);
```

**ポイント**:
- `cache()`を使用してリクエストの重複を防ぐ
- Server Actionsではなく、通常の関数
- サーバーコンポーネントからのみ呼び出される

---

### Phase 2: Server Componentラッパーの作成

**ファイル**: `src/components/ranking/EstatRanking/EstatRankingServer.tsx` （新規作成）

```typescript
import React from "react";
import { EstatRankingClient } from "./EstatRankingClient";
import { getAvailableYears, getPrefectureData } from "@/lib/estat/statsdata/server";
import { GetStatsDataParams } from "@/lib/estat/types/parameters";
import { SubcategoryData } from "@/types/choropleth";
import { AlertCircle } from "lucide-react";

export interface EstatRankingServerProps {
  params: Omit<GetStatsDataParams, "appId">;
  subcategory: SubcategoryData;
  title?: string;
  options?: {
    colorScheme?: string;
    divergingMidpoint?: "zero" | "mean" | "median" | number;
  };
  mapWidth?: number;
  mapHeight?: number;
  className?: string;
  searchParams?: { year?: string }; // URLパラメータから年度を受け取る
}

/**
 * サーバーコンポーネント版のEstatRanking
 * URLパラメータに基づいてサーバー側でデータ取得
 */
export async function EstatRankingServer({
  params,
  subcategory,
  title,
  options,
  mapWidth = 800,
  mapHeight = 600,
  className = "",
  searchParams,
}: EstatRankingServerProps) {
  try {
    if (!params.cdCat01) {
      throw new Error("カテゴリコードが指定されていません");
    }

    // 年度一覧を取得
    const availableYears = await getAvailableYears(
      params.statsDataId,
      params.cdCat01
    );

    // URLパラメータまたはデフォルトの年度を選択
    const selectedYear =
      searchParams?.year ||
      params.cdTime ||
      availableYears[0] ||
      "";

    if (!selectedYear) {
      throw new Error("利用可能な年度が見つかりません");
    }

    // 選択された年度のデータを取得
    const data = await getPrefectureData(
      params.statsDataId,
      params.cdCat01,
      selectedYear,
      params.limit || 100000
    );

    // クライアントコンポーネントにデータを渡す
    return (
      <EstatRankingClient
        data={data}
        availableYears={availableYears}
        currentYear={selectedYear}
        subcategory={subcategory}
        title={title}
        options={options}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
        className={className}
      />
    );
  } catch (error) {
    // エラーUIの表示
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
              データの取得に失敗しました
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm">
              {error instanceof Error ? error.message : "不明なエラー"}
            </p>
          </div>
        </div>
      </div>
    );
  }
}
```

**ポイント**:
- `async`コンポーネントとしてサーバー側でデータ取得
- URLパラメータ（`searchParams`）から年度を受け取る
- エラーハンドリングをサーバー側で完結
- Server Actionsは使用せず、通常の関数を呼び出す

---

### Phase 3: Client Componentのリファクタリング

**ファイル**: `src/components/ranking/EstatRanking/EstatRankingClient.tsx` （新規作成）

```typescript
"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChoroplethMap } from "@/components/d3/ChoroplethMap";
import { PrefectureDataTableClient } from "@/components/choropleth/PrefectureDataTableClient";
import { StatisticsSummary } from "@/components/common/DataTable";
import { FormattedValue } from "@/lib/estat/types/formatted";
import { SubcategoryData } from "@/types/choropleth";

export interface EstatRankingClientProps {
  data: FormattedValue[];
  availableYears: string[];
  currentYear: string;
  subcategory: SubcategoryData;
  title?: string;
  options?: {
    colorScheme?: string;
    divergingMidpoint?: "zero" | "mean" | "median" | number;
  };
  mapWidth?: number;
  mapHeight?: number;
  className?: string;
}

/**
 * クライアントコンポーネント版のEstatRanking
 * 年度選択UIとデータ表示を担当
 */
export function EstatRankingClient({
  data,
  availableYears,
  currentYear,
  subcategory,
  title,
  options,
  mapWidth = 800,
  mapHeight = 600,
  className = "",
}: EstatRankingClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  // 年度変更ハンドラー - URL遷移を使用
  const handleYearChange = (year: string) => {
    // URLパラメータを更新してサーバーコンポーネントを再レンダリング
    const params = new URLSearchParams();
    params.set("year", year);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className={className}>
      {/* タイトルと年度選択UI */}
      <div className="px-4 mb-4 flex items-center justify-between gap-4">
        {title && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
        )}
        <div className={`flex items-center gap-2 ${title ? "" : "ml-auto"}`}>
          <label
            htmlFor="year-select"
            className="text-sm text-gray-600 dark:text-neutral-400"
          >
            年度:
          </label>
          <select
            id="year-select"
            value={currentYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
          >
            {availableYears.map((yearCode) => {
              const displayYear = yearCode.substring(0, 4);
              return (
                <option key={yearCode} value={yearCode}>
                  {displayYear}年
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* 地図とデータテーブル */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden px-4 gap-4">
        {/* 地図表示エリア */}
        <div className="flex-1 flex flex-col overflow-hidden gap-4">
          {/* 地図 */}
          <div>
            <ChoroplethMap
              data={data}
              options={{
                colorScheme:
                  options?.colorScheme ||
                  subcategory.colorScheme ||
                  "interpolateBlues",
                divergingMidpoint: options?.divergingMidpoint || "zero",
              }}
              width={mapWidth}
              height={mapHeight}
            />
          </div>

          {/* 統計サマリー */}
          <div>
            <StatisticsSummary
              data={data}
              unit={subcategory.unit || ""}
            />
          </div>
        </div>

        {/* データテーブルエリア */}
        <div className="flex-shrink-0">
          <PrefectureDataTableClient
            data={data}
            subcategory={subcategory}
          />
        </div>
      </div>
    </div>
  );
}
```

**ポイント**:
- データを`props`で受け取る → ローディング状態不要
- `useRouter`と`usePathname`を使用してURL遷移
- Server Actionsや`useTransition`は不要（Next.jsがソフトナビゲーションを自動処理）
- シンプルで理解しやすいコード

---

### Phase 4: エクスポートの更新

**ファイル**: `src/components/ranking/EstatRanking/index.ts` （更新）

```typescript
// デフォルトはサーバーコンポーネント版
export { EstatRankingServer as EstatRanking } from "./EstatRankingServer";

// 必要に応じてクライアント版も公開
export { EstatRankingClient } from "./EstatRankingClient";

// 従来のクライアント版を残す（後方互換性）
export { EstatRanking as EstatRankingLegacy } from "./EstatRanking";
```

---

### Phase 5: 既存のランキングコンポーネントの更新

**影響を受けるファイル**:
- `src/components/subcategories/population/basic-population/BasicPopulationRanking.tsx`
- その他65個のランキングコンポーネント

**変更方針**:

既存のランキングコンポーネントは**クライアントコンポーネントのまま**でも問題ありません。
重要なのは、`EstatRanking`コンポーネント自体がサーバーコンポーネント化されることです。

#### オプション1: 既存コンポーネントをそのまま使用（推奨）

```typescript
// Before
"use client";
import { EstatRanking } from "@/components/ranking";

export const BasicPopulationRanking = ({ category, subcategory }) => {
  const [activeTab, setActiveTab] = useState("totalPopulation");

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* タブUI */}
      <EstatRanking
        params={{ statsDataId: "...", cdCat01: "..." }}
        subcategory={subcategory}
      />
    </SubcategoryLayout>
  );
};

// After - ほぼ変更なし！
// EstatRankingがサーバー版になるだけで、このコンポーネントは変更不要
```

**ポイント**: クライアントコンポーネントの中でサーバーコンポーネントを使用可能

#### オプション2: ページレベルで`searchParams`を扱う（より最適）

親ページコンポーネント（`page.tsx`）で`searchParams`を受け取り、ランキングコンポーネントに渡す：

```typescript
// app/[category]/[subcategory]/ranking/page.tsx
export default async function RankingPage({
  params,
  searchParams
}: {
  params: { category: string; subcategory: string };
  searchParams: { year?: string };
}) {
  const RankingComponent = getRankingComponent(params.subcategory);

  return (
    <RankingComponent
      category={category}
      subcategory={subcategory}
      searchParams={searchParams} // 追加
    />
  );
}

// BasicPopulationRanking.tsx
export const BasicPopulationRanking = ({
  category,
  subcategory,
  searchParams
}) => {
  return (
    <EstatRankingServer
      params={{ ... }}
      subcategory={subcategory}
      searchParams={searchParams} // 渡す
    />
  );
};
```

**段階的な移行**:
1. ✅ まず`EstatRankingServer`を実装
2. ✅ デフォルトエクスポートをサーバー版に変更
3. ✅ 既存のランキングコンポーネントで動作確認（ほぼ変更不要）
4. ⚠️ 必要に応じて個別に`searchParams`対応

---

## テスト計画

### テストケース

1. **初回レンダリング**
   - ✅ サーバー側でデータが正しく取得される
   - ✅ 初期HTMLにデータが含まれる
   - ✅ ローディング状態が表示されない
   - ✅ デフォルト年度が正しく選択される

2. **年度変更（URL遷移）**
   - ✅ 年度セレクトが正しく動作する
   - ✅ URL遷移が発生する（`?year=2023`）
   - ✅ サーバーコンポーネントが再レンダリングされる
   - ✅ 新しい年度のデータが正しく表示される
   - ✅ ブラウザの戻る/進むボタンが機能する
   - ✅ エラーが適切にハンドリングされる

3. **URL直接アクセス**
   - ✅ `/ranking?year=2023`に直接アクセスできる
   - ✅ 指定された年度のデータが表示される
   - ✅ 不正な年度パラメータ時にデフォルトにフォールバック

4. **エラーハンドリング**
   - ✅ APIエラー時に適切なメッセージが表示される
   - ✅ タイムアウト時の挙動
   - ✅ 不正なパラメータ時の挙動
   - ✅ データが存在しない年度の処理

5. **パフォーマンス**
   - ✅ `cache()`によるリクエストの重複防止
   - ✅ Next.jsのソフトナビゲーションが機能
   - ✅ 適切なキャッシング戦略

6. **後方互換性**
   - ✅ 既存のランキングコンポーネントが正常に動作する
   - ✅ クライアントコンポーネント内でサーバーコンポーネントが機能する

---

## 実装スケジュール

### Week 1
- [x] プロジェクト調査
- [x] リファクタリング計画の作成
- [ ] Phase 1: サーバー専用データ取得関数の実装とテスト

### Week 2
- [ ] Phase 2: Server Componentラッパーの実装
- [ ] Phase 3: Client Componentのリファクタリング
- [ ] 単体テストの作成

### Week 3
- [ ] Phase 4: エクスポートの更新
- [ ] Phase 5: 既存コンポーネントの段階的移行
- [ ] 統合テスト

### Week 4
- [ ] パフォーマンステスト
- [ ] バグ修正
- [ ] ドキュメント更新

---

## リスクと対策

### リスク1: 既存コンポーネントへの影響
**対策**:
- デフォルトエクスポートをサーバー版に変更する前に、Legacy版を残す
- 段階的に移行できるようにする
- 後方互換性を保つ

### リスク2: URL遷移によるパフォーマンス
**対策**:
- Next.jsのソフトナビゲーションを活用（自動的に最適化される）
- `cache()`を使用してリクエストの重複を防ぐ
- 必要に応じてprefetch機能を検討

### リスク3: e-stat APIのレート制限
**対策**:
- React `cache()`を使用してリクエストの重複を防ぐ
- Next.js 15のキャッシング戦略を活用
- エラーハンドリングを強化
- リトライ機能の実装を検討

### リスク4: searchParamsの変更による再レンダリング
**対策**:
- Client Componentを適切に分離してレンダリング範囲を最小化
- 必要に応じてReact.memoを使用
- パフォーマンステストで検証

---

## パフォーマンス改善の期待値

### Before（クライアントコンポーネント）
```
ページロード
  ↓
クライアント側でReactハイドレーション (300ms)
  ↓
年度一覧取得APIリクエスト (500ms)
  ↓
データ取得APIリクエスト (800ms)
  ↓
レンダリング (100ms)
────────────────────────────
Total: 1700ms
```

### After（サーバーコンポーネント）
```
ページロード（サーバー側で並列処理）
  ├─ 年度一覧取得 (500ms)
  └─ データ取得 (800ms)
  ↓
初期HTML生成 (800ms, 並列実行の最大値)
  ↓
クライアント側でReactハイドレーション (300ms)
  ↓
即座にレンダリング (0ms, データは既にある)
────────────────────────────
Total: 1100ms (-35%)
```

**期待される改善**:
- 初期表示速度: **約35%向上**
- Time to Interactive: **約600ms短縮**
- SEO: **大幅改善**（初期HTMLにデータ含まれる）

---

## 参考資料

- [Next.js App Router - Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js - Server Actions and Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React - useTransition](https://react.dev/reference/react/useTransition)
- [e-STAT API仕様書](https://www.e-stat.go.jp/api/)

---

## まとめ

### 🎯 採用アプローチ: URLパラメータ（SearchParams）

年度選択のようなフィルタリング機能では、**Server Actionsは不要**です。代わりに：

1. **URLパラメータで状態管理**
   - 年度を`?year=2023`のようにURLで管理
   - ブラウザの戻る/進むボタンが機能
   - URLを共有・ブックマーク可能

2. **Server Componentでデータ取得**
   - `searchParams`から年度を取得
   - サーバー側でe-stat APIを呼び出し
   - `cache()`でリクエストの重複を防ぐ

3. **Client ComponentでUI**
   - `useRouter`で年度変更時にURL遷移
   - Next.jsがソフトナビゲーションで最適化

### ✅ 期待されるメリット

1. **パフォーマンス向上**: 初期表示速度が約35%向上
2. **SEO改善**: 初期HTMLにデータが含まれる、各年度が個別のURLに
3. **UX向上**: ブラウザの戻る/進むボタンが機能、URLを共有可能
4. **アーキテクチャ改善**: Server/Client Componentの適切な分離
5. **セキュリティ向上**: APIキーをサーバー側に隠蔽
6. **保守性向上**: 責務が明確化され、シンプルで理解しやすいコード
7. **シンプル**: Server Actions不要で実装が簡潔

### 📚 Next.jsベストプラクティスに準拠

- **Server Components**: データ取得に使用
- **Client Components**: インタラクティブなUIに使用
- **URL State**: フィルタや選択状態はURLで管理
- **Server Actions**: フォーム送信やミューテーション（POST/PUT/DELETE）に使用

段階的に移行することで、既存機能への影響を最小限に抑えながら、モダンなNext.jsアプリケーションへと進化させることができます。
