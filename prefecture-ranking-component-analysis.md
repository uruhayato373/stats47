# estat/prefecture-rankingコンポーネント構成分析レポート

**作成日:** 2025-10-13
**対象:** `src/components/estat/prefecture-ranking`
**目的:** コンポーネント分離とフォルダ構成の適切性を評価し、metainfoと同様の改善を提案

---

## エグゼクティブサマリー

### 総合評価: **C+ (70/100点)**

**良い点 ✅**
- 機能別にコンポーネントが分かれている
- EstatPrefectureRankingPageHeaderは小さくて適切
- VisualizationSettingsPanelは責務が明確

**改善が必要な点 ⚠️**
- 非常に大きなコンポーネントが存在（395行）
- ビジネスロジックがUI層に混在
- フォルダ構造が不統一（一部フォルダあり、一部ファイルのみ）
- テストとStorybookが完全に欠如
- 命名規則が冗長（"EstatPrefecture"プレフィックスが重複）
- カスタムフックが未使用（すべてのロジックがコンポーネント内）

**metainfoとの比較:**
- metainfoの総合評価: **B+ (75点)** vs prefecture-ranking: **C+ (70点)**
- metainfoは一部テストあり、こちらは完全になし
- prefecture-rankingの方が大きなコンポーネントが多い（最大395行 vs 280行）

---

## 現在の構造

```
src/components/estat/prefecture-ranking/
├── index.ts
├── PrefectureRankingSidebar.tsx                [224行 - XLサイズ] ⚠️
├── SavedPrefectureRankingList.tsx              [215行 - XLサイズ] ⚠️
│
├── EstatPrefectureDataTable/                   [244行 - XLサイズ] ⚠️
│   ├── EstatPrefectureDataTable.types.ts
│   └── index.tsx                               (244行)
│
├── EstatPrefectureRankingDisplay/              [395行 - XXLサイズ] ❌
│   ├── EstatPrefectureRankingDisplay.types.ts
│   └── index.tsx                               (395行) ← 巨大
│
├── EstatPrefectureRankingFetcher/              [135行 - Lサイズ] ✅
│   └── index.tsx                               (135行)
│
├── EstatPrefectureRankingPageHeader/           [58行 - Sサイズ] ✅
│   ├── Header.tsx                              (58行)
│   └── index.ts
│
└── VisualizationSettingsPanel/                 [154行 - Lサイズ] ✅
    └── index.tsx                               (154行)
```

### サイズ統計

| サイズ | 行数 | 評価 | コンポーネント数 |
|--------|------|------|------------------|
| S（小） | ~80行 | ✅ 適切 | 1個 |
| M（中） | 81-120行 | ✅ 適切 | 0個 |
| L（大） | 121-200行 | ⚠️ 分割検討 | 2個 |
| XL（特大） | 201-300行 | ❌ 分割推奨 | 3個 |
| XXL（巨大） | 300行以上 | ❌ 分割必須 | 1個 |

**総評:**
- **分割必須**: 1個（Display - 395行）
- **分割推奨**: 3個（Sidebar - 224行、List - 215行、DataTable - 244行）
- **metainfoとの比較**: prefecture-rankingの方が問題が深刻（XXLサイズが1個存在）

---

## 詳細分析

### 1. 最重大問題: EstatPrefectureRankingDisplay.tsx (395行) ❌

**現在の責務（複数混在）:**
1. データの整形とフィルタリング（36-215行）
2. 年次選択の管理（42-72行）
3. 地図可視化オプション管理（44-98行）
4. 可視化設定のCRUD（50-165行）
5. API呼び出し（75-113行、115-165行）
6. UI表示（234-394行）

**具体的な問題点:**

```typescript
// 問題1: データ変換ロジックがコンポーネント内に直接記述（36-39行）
const formattedData: FormattedEstatData | null = useMemo(() => {
  if (!data) return null;
  return EstatStatsDataService.formatStatsData(data);
}, [data]);

// 問題2: API呼び出しロジックが直接記述（75-113行、115-165行）
const loadSettings = async () => {
  // 50行以上のAPI呼び出しとエラーハンドリング
};

const saveSettings = async () => {
  // 50行以上の保存処理
};

// 問題3: 複雑なフィルタリングロジック（169-215行）
const filteredData = useMemo(() => {
  // 47行のフィルタリングと変換ロジック
}, [formattedData, selectedYear, params, visualizationSettings, editableSettings]);

// 問題4: 統計計算ロジック（217-232行）
const validDataPoints = filteredData.filter(...);
const values = validDataPoints.map(...);
const summary = { ... }; // 複雑な計算
```

**テスト困難な理由:**
- API呼び出し、データ変換、UI表示が分離されていない
- 依存関係が複雑（5つのuseEffectと3つのuseMemo）
- モック化が困難

**推奨アクション:**
- **最優先** - カスタムフックに分離（395行 → 100行以下に削減）
- 以下のフックを作成：
  1. `useVisualizationSettings` - 設定のCRUD
  2. `usePrefectureRankingData` - データ整形とフィルタリング
  3. `useMapOptions` - 地図オプション管理
  4. `useYearSelection` - 年次選択管理

---

### 2. PrefectureRankingSidebar.tsx (224行) ⚠️

**現在の責務:**
1. 保存済みデータの表示
2. 統計表選択UI
3. 項目名一覧の表示
4. API呼び出し（2箇所）

**問題点:**

```typescript
// 問題1: API呼び出しがコンポーネント内に直接記述（37-56行）
const fetchSavedData = async () => {
  setLoading(true);
  try {
    const response = await fetch("/api/estat/metainfo/stats-list?limit=100");
    // ...
  } catch (error) {
    // ...
  } finally {
    setLoading(false);
  }
};

// 問題2: 別のAPI呼び出しも直接記述（62-83行）
const fetchItemNames = async (statsDataId: string) => {
  // 20行以上のAPI呼び出し
};
```

**推奨アクション:**
- `hooks/useSavedMetadata.ts` を作成してAPI呼び出しロジックを分離
- `hooks/useItemNames.ts` を作成
- コンポーネントは100行以下に削減

---

### 3. EstatPrefectureDataTable/index.tsx (244行) ⚠️

**現在の責務:**
1. データのソート（21-69行）
2. テーブル表示（99-242行）
3. 統計計算（204-241行）

**問題点:**

```typescript
// 問題: ソートロジックとUI表示が混在
const sortedData = useMemo(() => {
  // 35行のソートロジック
}, [data, sortField, sortDirection, rankingDirection]);

const handleSort = (field: SortField) => {
  // ソート処理
};

const getSortIcon = (field: SortField) => {
  // アイコン選択ロジック
};
```

**推奨アクション:**
- `hooks/useTableSort.ts` を作成してソートロジックを分離
- 統計計算を `utils/tableStats.ts` に移動
- コンポーネントは150行以下に削減

---

### 4. SavedPrefectureRankingList.tsx (215行) ⚠️

**現在の構造:**
- `SavedPrefectureRankingItem` コンポーネント（30-139行）
- `SavedPrefectureRankingList` コンポーネント（141-215行）

**問題点:**
- 2つのコンポーネントが1ファイルに混在
- リストアイテムが100行以上で大きい

**推奨アクション:**
- `components/SavedPrefectureRankingItem.tsx` として分離
- フォルダ構造を統一

---

### 5. フォルダ構造の不統一

#### 現状の問題

**パターンA: フォルダあり（一部のみ）**
```
EstatPrefectureDataTable/
├── EstatPrefectureDataTable.types.ts
└── index.tsx
```

**パターンB: ファイルのみ（大半）**
```
PrefectureRankingSidebar.tsx
SavedPrefectureRankingList.tsx
```

**問題:**
- 一貫性がない
- テストファイルの配置場所が不明確
- スケールしにくい

---

### 6. 命名規則の冗長性

**現在の命名:**
```
src/components/estat/prefecture-ranking/
├── EstatPrefectureRankingDisplay/      ← "Estat" + "Prefecture" が重複
├── EstatPrefectureRankingFetcher/      ← 同上
├── EstatPrefectureRankingPageHeader/   ← 同上
└── EstatPrefectureDataTable/           ← 同上
```

**問題:**
- パス自体が `estat/prefecture-ranking` なので、プレフィックスが冗長
- ファイル名が長すぎる
- インポート時に可読性が低下

```typescript
// 現在（冗長）
import EstatPrefectureRankingDisplay from "@/components/estat/prefecture-ranking/EstatPrefectureRankingDisplay";

// 推奨（簡潔）
import RankingDisplay from "@/components/estat/prefecture-ranking/Display";
```

---

### 7. テストとStorybookの完全欠如

**現状:**
- テストファイル: **0個** ❌
- Storybookファイル: **0個** ❌

**metainfoとの比較:**
- metainfo: 1フォルダ（Actions）にテスト・Storybookあり
- prefecture-ranking: 完全になし

**リスク:**
- 395行のDisplayコンポーネントはテスト不可能に近い
- リグレッションのリスクが非常に高い
- リファクタリングが困難

---

## 改善提案

### 優先度1: EstatPrefectureRankingDisplay の分割（最重要・必須）

#### 現在の構造（395行）

```typescript
export default function EstatPrefectureRankingDisplay({
  data, loading, error, params
}) {
  // データ整形（50行）
  // 年次選択管理（30行）
  // 地図オプション管理（50行）
  // 設定CRUD（90行）
  // フィルタリング（50行）
  // 統計計算（20行）
  // レンダリング（160行）
}
```

#### 提案: カスタムフックへの分離

**新しい構造:**
```
EstatPrefectureRankingDisplay/
├── Display.tsx                          (120行) ← UIのみ
├── Display.test.tsx                     (80行) ← 追加
├── Display.stories.tsx                  (40行) ← 追加
├── hooks/
│   ├── useVisualizationSettings.ts      (80行) ← 設定CRUD
│   ├── useVisualizationSettings.test.ts (60行) ← 追加
│   ├── usePrefectureRankingData.ts      (70行) ← データ整形
│   ├── usePrefectureRankingData.test.ts (50行) ← 追加
│   ├── useMapOptions.ts                 (30行) ← 地図オプション
│   ├── useYearSelection.ts              (20行) ← 年次選択
│   └── index.ts                         (10行) ← エクスポート
├── types.ts
└── index.ts
```

#### 実装例

**`hooks/useVisualizationSettings.ts`:**
```typescript
import { useState, useEffect } from "react";
import {
  VisualizationSettings,
  VisualizationSettingsService,
} from "@/lib/ranking/visualization-settings";

interface UseVisualizationSettingsOptions {
  statsDataId?: string;
  categoryCode?: string;
}

export function useVisualizationSettings({
  statsDataId,
  categoryCode,
}: UseVisualizationSettingsOptions) {
  const [settings, setSettings] = useState<VisualizationSettings | null>(null);
  const [editableSettings, setEditableSettings] = useState<
    Partial<VisualizationSettings>
  >({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 設定の読み込み
  useEffect(() => {
    const loadSettings = async () => {
      if (!statsDataId || !categoryCode) return;

      setLoading(true);
      try {
        const response = await VisualizationSettingsService.fetchSettings(
          statsDataId,
          categoryCode
        );

        if (response.success) {
          setSettings(response.settings);
          setEditableSettings(response.settings);
        } else {
          const defaultSettings =
            VisualizationSettingsService.getDefaultSettings(
              statsDataId,
              categoryCode
            );
          setEditableSettings(defaultSettings);
        }
      } catch (error) {
        console.error("Failed to load visualization settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [statsDataId, categoryCode]);

  // 設定の保存
  const saveSettings = async (
    settingsToSave: Partial<VisualizationSettings>
  ) => {
    if (!statsDataId || !categoryCode) {
      throw new Error("統計表IDとカテゴリコードが必要です");
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      const result = await VisualizationSettingsService.saveSettings(
        settingsToSave
      );

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);

        // 設定を再読み込み
        const response = await VisualizationSettingsService.fetchSettings(
          statsDataId,
          categoryCode
        );
        if (response.success) {
          setSettings(response.settings);
          setEditableSettings(response.settings);
        }

        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      return { success: false, error: "設定の保存に失敗しました" };
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    editableSettings,
    setEditableSettings,
    loading,
    saving,
    saveSuccess,
    saveSettings,
  };
}
```

**`hooks/usePrefectureRankingData.ts`:**
```typescript
import { useMemo } from "react";
import { FormattedEstatData } from "@/lib/estat/types";
import { EstatStatsDataService } from "@/lib/estat/statsdata";
import { VisualizationSettings, VisualizationSettingsService } from "@/lib/ranking/visualization-settings";

interface UsePrefectureRankingDataOptions {
  data: any;
  selectedYear: string;
  categoryCode?: string;
  settings?: Partial<VisualizationSettings> | null;
}

export function usePrefectureRankingData({
  data,
  selectedYear,
  categoryCode,
  settings,
}: UsePrefectureRankingDataOptions) {
  // データの整形
  const formattedData = useMemo(() => {
    if (!data) return null;
    return EstatStatsDataService.formatStatsData(data);
  }, [data]);

  // データのフィルタリングと変換
  const filteredData = useMemo(() => {
    if (!formattedData || !selectedYear) return formattedData?.values || [];

    const filtered = formattedData.values.filter((value) => {
      const basicFilter =
        value.timeCode === selectedYear && value.areaCode !== "00000";

      if (categoryCode) {
        const categoryCodes = categoryCode.split(",").map((code) => code.trim());
        return basicFilter && categoryCodes.includes(value.categoryCode);
      }

      return basicFilter;
    });

    // 単位変換を適用
    if (settings) {
      return filtered.map((value) => ({
        ...value,
        numericValue: value.numericValue
          ? VisualizationSettingsService.applyConversion(
              value.numericValue,
              settings.conversion_factor || 1,
              settings.decimal_places || 0
            )
          : value.numericValue,
      }));
    }

    return filtered;
  }, [formattedData, selectedYear, categoryCode, settings]);

  // 統計情報の計算
  const summary = useMemo(() => {
    const validDataPoints = filteredData.filter(
      (value) => value.numericValue !== null && value.numericValue !== 0
    );
    const values = validDataPoints.map((value) => value.numericValue!);

    return {
      totalCount: filteredData.length,
      validCount: validDataPoints.length,
      min: values.length > 0 ? Math.min(...values) : null,
      max: values.length > 0 ? Math.max(...values) : null,
      average:
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : null,
    };
  }, [filteredData]);

  return {
    formattedData,
    filteredData,
    summary,
  };
}
```

**`Display.tsx`（簡潔版 - 120行）:**
```typescript
"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Database, Save, Check, Settings } from "lucide-react";
import { ChoroplethMap } from "@/components/estat/visualization";
import YearSelector from "@/components/common/YearSelector";
import EstatDataSummary from "@/components/estat/visualization/EstatDataSummary";
import ColorSchemeSelector from "@/components/common/ColorSchemeSelector";
import EstatPrefectureDataTable from "@/components/estat/prefecture-ranking/EstatPrefectureDataTable";
import VisualizationSettingsPanel from "../VisualizationSettingsPanel";
import { EstatPrefectureRankingDisplayProps } from "./types";
import {
  useVisualizationSettings,
  usePrefectureRankingData,
  useMapOptions,
  useYearSelection,
} from "./hooks";

export default function Display({
  data,
  loading,
  error,
  params,
}: EstatPrefectureRankingDisplayProps) {
  // カスタムフックでロジックを分離
  const {
    settings,
    editableSettings,
    setEditableSettings,
    saving,
    saveSuccess,
    saveSettings,
  } = useVisualizationSettings({
    statsDataId: params?.statsDataId,
    categoryCode: params?.categoryCode,
  });

  const { mapOptions, setMapOptions } = useMapOptions({
    initialColorScheme: settings?.map_color_scheme,
    initialDivergingMidpoint: settings?.map_diverging_midpoint,
  });

  const { formattedData, filteredData, summary } = usePrefectureRankingData({
    data,
    selectedYear: selectedYear,
    categoryCode: params?.categoryCode,
    settings: editableSettings,
  });

  const { selectedYear, setSelectedYear } = useYearSelection({
    years: formattedData?.years || [],
  });

  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  const handleSaveSettings = async () => {
    const settingsToSave = {
      ...editableSettings,
      stats_data_id: params?.statsDataId,
      cat01: params?.categoryCode,
      map_color_scheme: mapOptions.colorScheme,
      map_diverging_midpoint: mapOptions.divergingMidpoint,
    };

    await saveSettings(settingsToSave);
  };

  // ローディング・エラー状態
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data) return <EmptyState />;
  if (!formattedData) return null;

  return (
    <div className="space-y-6">
      <div className="p-4">
        {/* 年次セレクター */}
        <YearSelector
          years={formattedData.years}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          className="mb-4"
        />

        {/* カラースキーマと設定ボタン */}
        <div className="flex items-end gap-4 mb-4">
          <ColorSchemeSelector
            options={mapOptions}
            onOptionsChange={setMapOptions}
          />
          <SettingsButtons
            showSettingsPanel={showSettingsPanel}
            onToggleSettings={() => setShowSettingsPanel(!showSettingsPanel)}
            onSave={handleSaveSettings}
            saving={saving}
            saveSuccess={saveSuccess}
          />
        </div>

        {/* 詳細設定パネル */}
        {showSettingsPanel && (
          <VisualizationSettingsPanel
            editableSettings={editableSettings}
            visualizationSettings={settings}
            params={params}
            onSettingsChange={setEditableSettings}
          />
        )}

        {/* データサマリー */}
        <EstatDataSummary {...summary} />

        {/* 地図 */}
        <ChoroplethMap
          data={filteredData}
          width={800}
          height={600}
          options={mapOptions}
        />

        {/* テーブル */}
        <EstatPrefectureDataTable
          data={filteredData}
          rankingDirection={
            editableSettings.ranking_direction ||
            settings?.ranking_direction ||
            "desc"
          }
        />
      </div>
    </div>
  );
}
```

**メリット:**
- ✅ コンポーネントが395行 → 120行に削減（70%削減）
- ✅ ビジネスロジックが完全に分離
- ✅ 各フックが独立してテスト可能
- ✅ 再利用性が向上
- ✅ 可読性が大幅に向上

---

### 優先度2: フォルダ構造の統一と命名規則の改善

#### 現在の構造（不統一）

```
src/components/estat/prefecture-ranking/
├── PrefectureRankingSidebar.tsx                    ← ファイルのみ
├── SavedPrefectureRankingList.tsx                  ← ファイルのみ
├── EstatPrefectureDataTable/                       ← フォルダあり
├── EstatPrefectureRankingDisplay/                  ← フォルダあり
├── EstatPrefectureRankingFetcher/                  ← フォルダあり
├── EstatPrefectureRankingPageHeader/               ← フォルダあり
└── VisualizationSettingsPanel/                     ← フォルダあり
```

#### 推奨: 統一された構造

```
src/components/estat/prefecture-ranking/
├── Sidebar/                              ← 命名簡潔化
│   ├── Sidebar.tsx                       (100行) ← 簡潔化
│   ├── Sidebar.test.tsx                  ← 追加
│   ├── Sidebar.stories.tsx               ← 追加
│   ├── hooks/
│   │   ├── useSavedMetadata.ts           (50行) ← API呼び出し分離
│   │   ├── useSavedMetadata.test.ts      ← 追加
│   │   ├── useItemNames.ts               (40行) ← API呼び出し分離
│   │   └── useItemNames.test.ts          ← 追加
│   ├── types.ts
│   └── index.ts
│
├── SavedList/                            ← 命名簡潔化
│   ├── SavedList.tsx                     (80行) ← 簡潔化
│   ├── SavedList.test.tsx                ← 追加
│   ├── SavedList.stories.tsx             ← 追加
│   ├── components/
│   │   ├── SavedListItem.tsx             (80行) ← 分離
│   │   ├── SavedListItem.test.tsx        ← 追加
│   │   └── index.ts
│   ├── types.ts
│   └── index.ts
│
├── DataTable/                            ← "EstatPrefecture"削除
│   ├── DataTable.tsx                     (120行) ← 簡潔化
│   ├── DataTable.test.tsx                ← 追加
│   ├── DataTable.stories.tsx             ← 追加
│   ├── hooks/
│   │   ├── useTableSort.ts               (60行) ← ソートロジック分離
│   │   ├── useTableSort.test.ts          ← 追加
│   │   └── index.ts
│   ├── utils/
│   │   ├── tableStats.ts                 (40行) ← 統計計算
│   │   ├── tableStats.test.ts            ← 追加
│   │   └── index.ts
│   ├── types.ts
│   └── index.ts
│
├── Display/                              ← "EstatPrefectureRanking"削除
│   ├── Display.tsx                       (120行) ← フック化で簡潔に
│   ├── Display.test.tsx                  ← 追加
│   ├── Display.stories.tsx               ← 追加
│   ├── hooks/
│   │   ├── useVisualizationSettings.ts   (80行)
│   │   ├── useVisualizationSettings.test.ts
│   │   ├── usePrefectureRankingData.ts   (70行)
│   │   ├── usePrefectureRankingData.test.ts
│   │   ├── useMapOptions.ts              (30行)
│   │   ├── useYearSelection.ts           (20行)
│   │   └── index.ts
│   ├── types.ts
│   └── index.ts
│
├── Fetcher/                              ← "EstatPrefectureRanking"削除
│   ├── Fetcher.tsx                       (135行) ← 変更なし（適切なサイズ）
│   ├── Fetcher.test.tsx                  ← 追加
│   ├── Fetcher.stories.tsx               ← 追加
│   ├── types.ts
│   └── index.ts
│
├── Header/                               ← "PageHeader"削除
│   ├── Header.tsx                        (58行) ← 変更なし（適切なサイズ）
│   ├── Header.test.tsx                   ← 追加
│   ├── Header.stories.tsx                ← 追加
│   └── index.ts
│
├── SettingsPanel/                        ← "Visualization"削除（文脈で明白）
│   ├── SettingsPanel.tsx                 (154行) ← 変更なし（適切なサイズ）
│   ├── SettingsPanel.test.tsx            ← 追加
│   ├── SettingsPanel.stories.tsx         ← 追加
│   ├── types.ts
│   └── index.ts
│
└── index.ts                              ← ルートエクスポート
```

#### インポート文の改善

**現在（冗長）:**
```typescript
import EstatPrefectureRankingDisplay from "@/components/estat/prefecture-ranking/EstatPrefectureRankingDisplay";
import EstatPrefectureDataTable from "@/components/estat/prefecture-ranking/EstatPrefectureDataTable";
import EstatPrefectureRankingFetcher from "@/components/estat/prefecture-ranking/EstatPrefectureRankingFetcher";
```

**改善後（簡潔）:**
```typescript
import { Display, DataTable, Fetcher } from "@/components/estat/prefecture-ranking";

// または個別インポート
import Display from "@/components/estat/prefecture-ranking/Display";
import DataTable from "@/components/estat/prefecture-ranking/DataTable";
import Fetcher from "@/components/estat/prefecture-ranking/Fetcher";
```

**メリット:**
- ✅ ファイル名が短くなり可読性向上
- ✅ 一貫性のあるフォルダ構造
- ✅ テストファイルの配置が明確
- ✅ スケーラブル
- ✅ インポート文が簡潔

---

### 優先度3: テストとStorybookの追加（必須）

#### 現状

| フォルダ | テスト | Storybook | 評価 |
|---------|--------|-----------|------|
| すべて | ❌ | ❌ | ⭐（最低） |

**metainfoとの比較:**
- metainfo: 1/6フォルダにテストあり（17%）
- prefecture-ranking: 0/7フォルダ（0%）← **より深刻**

#### 推奨: 全コンポーネントにテスト追加

**優先順位:**
1. **Display** - 最も複雑で重要（フック含む）
2. **DataTable** - ソートロジックが重要
3. **Sidebar** - API呼び出しをモック化
4. **SavedList** - 展開/折りたたみ機能
5. **Fetcher** - フォーム検証
6. **Header** - UIのみ（簡単）
7. **SettingsPanel** - UIのみ（簡単）

#### テンプレート例

**`Display/hooks/useVisualizationSettings.test.ts`:**
```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useVisualizationSettings } from "./useVisualizationSettings";
import { VisualizationSettingsService } from "@/lib/ranking/visualization-settings";

// モック
vi.mock("@/lib/ranking/visualization-settings", () => ({
  VisualizationSettingsService: {
    fetchSettings: vi.fn(),
    saveSettings: vi.fn(),
    getDefaultSettings: vi.fn(),
  },
}));

describe("useVisualizationSettings", () => {
  it("should load settings on mount", async () => {
    const mockSettings = {
      id: 1,
      stats_data_id: "0003448368",
      cat01: "01",
      ranking_direction: "desc",
      conversion_factor: 1,
      decimal_places: 0,
    };

    vi.mocked(VisualizationSettingsService.fetchSettings).mockResolvedValue({
      success: true,
      settings: mockSettings,
    });

    const { result } = renderHook(() =>
      useVisualizationSettings({
        statsDataId: "0003448368",
        categoryCode: "01",
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings).toEqual(mockSettings);
    expect(result.current.editableSettings).toEqual(mockSettings);
  });

  it("should save settings successfully", async () => {
    vi.mocked(VisualizationSettingsService.saveSettings).mockResolvedValue({
      success: true,
    });

    vi.mocked(VisualizationSettingsService.fetchSettings).mockResolvedValue({
      success: true,
      settings: {},
    });

    const { result } = renderHook(() =>
      useVisualizationSettings({
        statsDataId: "0003448368",
        categoryCode: "01",
      })
    );

    const saveResult = await result.current.saveSettings({
      ranking_direction: "asc",
    });

    expect(saveResult.success).toBe(true);
    expect(result.current.saveSuccess).toBe(true);
  });

  it("should handle save error", async () => {
    vi.mocked(VisualizationSettingsService.saveSettings).mockResolvedValue({
      success: false,
      error: "Failed to save",
    });

    const { result } = renderHook(() =>
      useVisualizationSettings({
        statsDataId: "0003448368",
        categoryCode: "01",
      })
    );

    const saveResult = await result.current.saveSettings({});

    expect(saveResult.success).toBe(false);
    expect(saveResult.error).toBe("Failed to save");
  });
});
```

**`DataTable/hooks/useTableSort.test.ts`:**
```typescript
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useTableSort } from "./useTableSort";

describe("useTableSort", () => {
  const mockData = [
    { rank: 1, areaName: "東京都", numericValue: 1000 },
    { rank: 2, areaName: "大阪府", numericValue: 800 },
    { rank: 3, areaName: "愛知県", numericValue: 700 },
  ];

  it("should sort by rank in ascending order by default", () => {
    const { result } = renderHook(() => useTableSort(mockData));

    expect(result.current.sortedData[0].rank).toBe(1);
    expect(result.current.sortField).toBe("rank");
    expect(result.current.sortDirection).toBe("asc");
  });

  it("should toggle sort direction when clicking same field", () => {
    const { result } = renderHook(() => useTableSort(mockData));

    act(() => {
      result.current.handleSort("rank");
    });

    expect(result.current.sortDirection).toBe("desc");

    act(() => {
      result.current.handleSort("rank");
    });

    expect(result.current.sortDirection).toBe("asc");
  });

  it("should sort by prefecture name", () => {
    const { result } = renderHook(() => useTableSort(mockData));

    act(() => {
      result.current.handleSort("prefecture");
    });

    expect(result.current.sortedData[0].areaName).toBe("愛知県");
    expect(result.current.sortedData[2].areaName).toBe("東京都");
  });

  it("should sort by value in descending order", () => {
    const { result } = renderHook(() => useTableSort(mockData));

    act(() => {
      result.current.handleSort("value");
    });

    expect(result.current.sortedData[0].numericValue).toBe(1000);
    expect(result.current.sortDirection).toBe("desc");
  });
});
```

**`Display/Display.stories.tsx`:**
```typescript
import type { Meta, StoryObj } from "@storybook/react";
import Display from "./Display";

const meta: Meta<typeof Display> = {
  title: "estat/prefecture-ranking/Display",
  component: Display,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Display>;

export const Default: Story = {
  args: {
    data: {
      // モックデータ
    },
    loading: false,
    error: null,
    params: {
      statsDataId: "0003448368",
      categoryCode: "01",
    },
  },
};

export const Loading: Story = {
  args: {
    data: null,
    loading: true,
    error: null,
    params: null,
  },
};

export const Error: Story = {
  args: {
    data: null,
    loading: false,
    error: "データの取得に失敗しました",
    params: null,
  },
};

export const EmptyData: Story = {
  args: {
    data: null,
    loading: false,
    error: null,
    params: null,
  },
};
```

---

### 優先度4: DataTableのソートロジック分離

#### 現在の問題（244行）

```typescript
// ソートロジックがコンポーネント内に直接記述
const [sortField, setSortField] = useState<SortField>("rank");
const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

const sortedData = useMemo(() => {
  // 35行のソートロジック
}, [data, sortField, sortDirection, rankingDirection]);

const handleSort = (field: SortField) => {
  // ソート処理
};
```

#### 提案: `useTableSort` フックに分離

**`DataTable/hooks/useTableSort.ts`:**
```typescript
import { useState, useMemo } from "react";
import { SortField, SortDirection, DataTableItem } from "../types";

interface UseTableSortOptions {
  rankingDirection?: "asc" | "desc";
}

export function useTableSort(
  data: DataTableItem[],
  options: UseTableSortOptions = {}
) {
  const { rankingDirection = "desc" } = options;
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // ランキング計算
    const validData = data.filter(
      (item) => item.numericValue !== null && item.numericValue !== 0
    );
    const rankedData = [...validData]
      .sort((a, b) => {
        const diff = (a.numericValue || 0) - (b.numericValue || 0);
        return rankingDirection === "asc" ? diff : -diff;
      })
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    // ユーザー指定のソートを適用
    return rankedData.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case "rank":
          compareValue = a.rank - b.rank;
          break;
        case "prefecture":
          compareValue = (a.areaName || "").localeCompare(b.areaName || "");
          break;
        case "value":
          compareValue = (a.numericValue || 0) - (b.numericValue || 0);
          break;
      }

      return sortDirection === "asc" ? compareValue : -compareValue;
    });
  }, [data, sortField, sortDirection, rankingDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "rank" ? "asc" : "desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return "neutral"; // ArrowUpDown
    }
    return sortDirection === "asc" ? "up" : "down";
  };

  return {
    sortedData,
    sortField,
    sortDirection,
    handleSort,
    getSortIcon,
  };
}
```

**`DataTable/DataTable.tsx`（簡潔版 - 120行）:**
```typescript
"use client";

import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Table as TableIcon } from "lucide-react";
import { EstatPrefectureDataTableProps } from "./types";
import { useTableSort } from "./hooks/useTableSort";
import { formatNumber } from "./utils/tableStats";

export default function DataTable({
  data,
  className = "",
  rankingDirection = "desc",
}: EstatPrefectureDataTableProps) {
  const { sortedData, handleSort, getSortIcon } = useTableSort(data, {
    rankingDirection,
  });

  const renderSortIcon = (field) => {
    const icon = getSortIcon(field);
    if (icon === "neutral") return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    if (icon === "up") return <ArrowUp className="w-4 h-4 text-indigo-600" />;
    return <ArrowDown className="w-4 h-4 text-indigo-600" />;
  };

  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <TableHeader itemCount={sortedData.length} />
      <TableBody
        data={sortedData}
        onSort={handleSort}
        renderSortIcon={renderSortIcon}
      />
      <TableFooter data={sortedData} />
    </div>
  );
}
```

**メリット:**
- ✅ コンポーネントが244行 → 120行に削減（50%削減）
- ✅ ソートロジックが独立してテスト可能
- ✅ 他のテーブルでも再利用可能
- ✅ 可読性が向上

---

### 優先度5: Sidebarのロジック分離

#### 現在の問題（224行）

```typescript
// API呼び出しがコンポーネント内に直接記述
const fetchSavedData = async () => {
  // 20行のAPI呼び出し
};

const fetchItemNames = async (statsDataId: string) => {
  // 20行のAPI呼び出し
};
```

#### 提案: カスタムフックに分離

**`Sidebar/hooks/useSavedMetadata.ts`:**
```typescript
import { useState, useEffect } from "react";

export interface SavedMetadataItem {
  id: number;
  stats_data_id: string;
  stat_name: string;
  title: string;
  cat01?: string;
  item_name?: string;
  unit?: string;
  updated_at: string;
  created_at: string;
}

export function useSavedMetadata() {
  const [data, setData] = useState<SavedMetadataItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/estat/metainfo/stats-list?limit=100");
      if (response.ok) {
        const result = await response.json();
        setData(result.items || []);
      } else {
        console.error("Failed to fetch stats list:", response.status);
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch stats list:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    refetch: fetchData,
  };
}
```

**`Sidebar/hooks/useItemNames.ts`:**
```typescript
import { useState } from "react";

export function useItemNames() {
  const [itemNames, setItemNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItemNames = async (statsDataId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/estat/metainfo/items?statsDataId=${statsDataId}`
      );
      if (response.ok) {
        const data = await response.json();
        setItemNames(data.itemNames || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to fetch item names:", response.status, errorData);
        setItemNames([]);
      }
    } catch (error) {
      console.error("Failed to fetch item names:", error);
      setItemNames([]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setItemNames([]);
  };

  return {
    itemNames,
    loading,
    fetchItemNames,
    reset,
  };
}
```

**`Sidebar/Sidebar.tsx`（簡潔版 - 100行）:**
```typescript
"use client";

import { useState } from "react";
import { TrendingUp, RefreshCw, Info } from "lucide-react";
import { useSavedMetadata } from "./hooks/useSavedMetadata";
import { useItemNames } from "./hooks/useItemNames";
import { PrefectureRankingSidebarProps } from "./types";

export default function Sidebar({
  className = "",
  onDataSelect,
}: PrefectureRankingSidebarProps) {
  const [selectedStatsId, setSelectedStatsId] = useState<string>("");
  const { data: savedData, loading, refetch } = useSavedMetadata();
  const { itemNames, loading: itemNamesLoading, fetchItemNames } = useItemNames();

  const handleStatsIdChange = (statsDataId: string) => {
    setSelectedStatsId(statsDataId);
    if (statsDataId) {
      const selectedItem = savedData.find(
        (item) => item.stats_data_id === statsDataId
      );
      if (selectedItem && onDataSelect) {
        onDataSelect(selectedItem);
      }
      fetchItemNames(statsDataId);
    } else {
      resetItemNames();
    }
  };

  return (
    <div className={`w-full xl:w-80 bg-white ${className}`}>
      <SidebarHeader loading={loading} onRefresh={refetch} />
      <StatsSelector
        savedData={savedData}
        selectedStatsId={selectedStatsId}
        onChange={handleStatsIdChange}
      />
      {selectedStatsId && (
        <>
          <SelectedStatsInfo
            statsDataId={selectedStatsId}
            savedData={savedData}
          />
          <ItemNamesList
            itemNames={itemNames}
            loading={itemNamesLoading}
          />
        </>
      )}
    </div>
  );
}
```

**メリット:**
- ✅ コンポーネントが224行 → 100行に削減（55%削減）
- ✅ API呼び出しロジックが独立してテスト可能
- ✅ 他のコンポーネントでも再利用可能
- ✅ 可読性が大幅に向上

---

## 実装ロードマップ

### フェーズ1: 命名規則の統一とフォルダ構造の整備（2日）

**作業内容:**
- [ ] フォルダ名を簡潔化（"EstatPrefecture"プレフィックス削除）
- [ ] すべてのコンポーネントをフォルダ構造に統一
- [ ] インポート文を更新
- [ ] エクスポート文を整備

**コマンド:**
```bash
# ディレクトリ名変更
cd src/components/estat/prefecture-ranking
mv EstatPrefectureRankingDisplay Display
mv EstatPrefectureRankingFetcher Fetcher
mv EstatPrefectureDataTable DataTable
mv EstatPrefectureRankingPageHeader Header
mv VisualizationSettingsPanel SettingsPanel

# ファイル名変更とフォルダ作成
mkdir -p Sidebar SavedList
mv PrefectureRankingSidebar.tsx Sidebar/Sidebar.tsx
mv SavedPrefectureRankingList.tsx SavedList/SavedList.tsx

# インポート文の一括置換
find . -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  's/EstatPrefectureRankingDisplay/Display/g'
```

**優先順位:** **中**

---

### フェーズ2: Display の分割（最優先・3-5日）

**作業内容:**
- [ ] `hooks/useVisualizationSettings.ts` を作成
- [ ] `hooks/usePrefectureRankingData.ts` を作成
- [ ] `hooks/useMapOptions.ts` を作成
- [ ] `hooks/useYearSelection.ts` を作成
- [ ] `Display.tsx` を簡潔化（395行 → 120行）
- [ ] 各フックのテストを追加

**優先順位:** **最高**

---

### フェーズ3: Sidebar とDataTableの改善（2-3日）

**作業内容:**
- [ ] `Sidebar/hooks/useSavedMetadata.ts` を作成
- [ ] `Sidebar/hooks/useItemNames.ts` を作成
- [ ] `Sidebar/Sidebar.tsx` を簡潔化（224行 → 100行）
- [ ] `DataTable/hooks/useTableSort.ts` を作成
- [ ] `DataTable/utils/tableStats.ts` を作成
- [ ] `DataTable/DataTable.tsx` を簡潔化（244行 → 120行）
- [ ] テストを追加

**優先順位:** **高**

---

### フェーズ4: SavedListの分割（1日）

**作業内容:**
- [ ] `SavedList/components/SavedListItem.tsx` を作成
- [ ] `SavedList/SavedList.tsx` を簡潔化（215行 → 80行）
- [ ] テストを追加

**優先順位:** **中**

---

### フェーズ5: テストとStorybookの追加（4-6日）

**作業内容:**
- [ ] Display のテスト・Storybookを追加（フック含む）
- [ ] DataTable のテスト・Storybookを追加
- [ ] Sidebar のテスト・Storybookを追加
- [ ] SavedList のテスト・Storybookを追加
- [ ] Fetcher のテスト・Storybookを追加
- [ ] Header のテスト・Storybookを追加
- [ ] SettingsPanel のテスト・Storybookを追加

**目標カバレッジ:** 80%以上

**優先順位:** **高**

---

### フェーズ6: パフォーマンス最適化（オプション、1-2日）

**作業内容:**
- [ ] 不要な再レンダリングの防止（React.memo）
- [ ] 大きなリストの仮想化検討
- [ ] useMemoとuseCallbackの最適化
- [ ] パフォーマンステストの追加

**優先順位:** **低**

---

## metainfoとの比較と統一提案

### 現状の違い

| 項目 | metainfo | prefecture-ranking |
|------|----------|-------------------|
| 総合評価 | B+ (75点) | C+ (70点) |
| 最大コンポーネントサイズ | 280行 | 395行 |
| テストカバレッジ | 17%（1/6） | 0%（0/7） |
| フォルダ構造 | 部分的に統一 | 不統一 |
| 命名規則 | Metainfo vs MetaInfo | 冗長なプレフィックス |
| カスタムフック使用 | なし | なし |

### 統一推奨事項

両ディレクトリに共通して適用すべきパターン:

#### 1. フォルダ構造のテンプレート

```
ComponentName/
├── ComponentName.tsx           (100行以下)
├── ComponentName.test.tsx
├── ComponentName.stories.tsx
├── hooks/                      (必要に応じて)
│   ├── useComponentLogic.ts
│   ├── useComponentLogic.test.ts
│   └── index.ts
├── components/                 (必要に応じて)
│   ├── SubComponent.tsx
│   ├── SubComponent.test.tsx
│   └── index.ts
├── utils/                      (必要に応じて)
│   ├── helpers.ts
│   ├── helpers.test.ts
│   └── index.ts
├── types.ts
└── index.ts
```

#### 2. コンポーネントサイズガイドライン

- **S（小）:** ~80行 - ✅ 理想的
- **M（中）:** 81-120行 - ✅ 許容範囲
- **L（大）:** 121-200行 - ⚠️ 分割を検討
- **XL（特大）:** 201-300行 - ❌ 分割推奨
- **XXL（巨大）:** 300行以上 - ❌ 分割必須

#### 3. 命名規則

- フォルダ名: PascalCase（例: `Display`, `Sidebar`）
- ファイル名: フォルダ名と同じ（例: `Display/Display.tsx`）
- 冗長なプレフィックスは避ける（パスで文脈が明白）
- 一貫性を保つ

#### 4. テストとStorybookの必須化

- すべての新規コンポーネントにテストを追加
- 公開コンポーネントにはStorybookを追加
- カスタムフックも必ずテスト
- カバレッジ目標: 80%以上

#### 5. カスタムフックの積極的な利用

**DO（推奨）:**
```typescript
// hooks/useComponentLogic.ts
export function useComponentLogic() {
  // ビジネスロジックのみ
  return { data, loading, error, actions };
}

// Component.tsx
export default function Component() {
  const { data, loading, error, actions } = useComponentLogic();
  // UIロジックのみ
  return <div>...</div>;
}
```

**DON'T（非推奨）:**
```typescript
export default function Component() {
  // ビジネスロジックとUIロジックが混在（テスト困難）
  const [data, setData] = useState();
  const fetchData = async () => { /* API呼び出し */ };
  useEffect(() => { fetchData(); }, []);
  return <div>...</div>;
}
```

---

## ベストプラクティス

### DO（推奨）

✅ **1. コンポーネントは100行以下を目指す**
```typescript
// 良い例: 小さくて焦点が明確
function DataTable({ data }: DataTableProps) {
  const { sortedData, handleSort } = useTableSort(data);
  return <table>...</table>;
}
```

✅ **2. ビジネスロジックはカスタムフックに分離**
```typescript
// hooks/useVisualizationSettings.ts
export function useVisualizationSettings(options) {
  // ロジックのみ
}
```

✅ **3. すべてのコンポーネント・フックにテストを追加**
```typescript
// Component.test.tsx
describe("Component", () => {
  it("should render correctly", () => {
    // テストコード
  });
});
```

✅ **4. 命名規則を統一（簡潔に）**
```typescript
// 良い例
Display.tsx
DataTable.tsx
Sidebar.tsx
```

✅ **5. フォルダ構造を統一**
```
ComponentName/
├── ComponentName.tsx
├── ComponentName.test.tsx
├── hooks/
└── index.ts
```

---

### DON'T（非推奨）

❌ **1. 大きなコンポーネントを作らない（200行以上）**
```typescript
// 悪い例: 395行のコンポーネント
export default function Display({ ... }) {
  // 395行...
}
```

❌ **2. UI層にビジネスロジックを書かない**
```typescript
// 悪い例: コンポーネント内でAPI呼び出し
const handleSave = async () => {
  const response = await fetch("/api/...");
  // 複雑なロジック...
};
```

❌ **3. 冗長な命名を避ける**
```typescript
// 悪い例
EstatPrefectureRankingDisplay.tsx  // パスで文脈が明白なので冗長
```

❌ **4. テストなしでコンポーネントを作らない**
```typescript
// 悪い例: テストファイルがない
ComponentName.tsx  ← これだけ
```

❌ **5. フォルダ構造を不統一にしない**
```
├── Component1.tsx           ← ファイルのみ
├── Component2/              ← フォルダあり
│   └── index.tsx
```

---

## チェックリスト

### 実装前の確認

- [ ] 現在のコンポーネントサイズを測定
- [ ] 依存関係を把握
- [ ] バックアップを作成
- [ ] git ブランチを作成（例: `refactor/prefecture-ranking`）
- [ ] metainfoの改善案も確認（統一性のため）

### 実装中の確認

- [ ] コンポーネントは100行以下か
- [ ] ビジネスロジックが分離されているか（カスタムフック）
- [ ] 命名規則が統一されているか（簡潔）
- [ ] フォルダ構造が統一されているか
- [ ] テストが追加されているか
- [ ] 型定義が適切か
- [ ] インポート文が更新されているか

### 実装後の確認

- [ ] すべてのテストが通るか
- [ ] Storybookが動作するか
- [ ] 既存機能が壊れていないか（E2Eテスト）
- [ ] パフォーマンスが維持されているか
- [ ] ドキュメントが更新されているか
- [ ] コードレビューを受ける

---

## まとめ

### 現状評価

**総合評価: C+ (70/100点)**

- ⚠️ metainfoより問題が深刻（最大395行、テスト0%）
- ⚠️ 命名規則が冗長
- ⚠️ フォルダ構造が不統一
- ⚠️ ビジネスロジックがUI層に混在
- ❌ テストとStorybookが完全に欠如

### 主な改善点（優先順位順）

1. **EstatPrefectureRankingDisplay の分割**（最優先）
   - 395行 → 120行に削減
   - 4つのカスタムフックに分離
   - テストを追加

2. **命名規則とフォルダ構造の統一**
   - "EstatPrefecture"プレフィックス削除
   - すべてをフォルダ構造に統一
   - インポート文を簡潔化

3. **Sidebar とDataTableの改善**
   - API呼び出しロジックをフックに分離
   - ソートロジックをフックに分離
   - 224行 → 100行、244行 → 120行に削減

4. **テストとStorybookの追加**（必須）
   - すべてのコンポーネントにテスト
   - カスタムフックにもテスト
   - カバレッジ目標: 80%以上

### 期待される効果

- 🚀 **保守性の向上** - 小さなコンポーネントは理解しやすい
- 🧪 **テスタビリティ向上** - ロジックが分離されテスト可能
- 🔄 **再利用性向上** - フックが独立して再利用可能
- 📚 **可読性向上** - 命名が簡潔でフォルダ構造が統一
- 👥 **チーム開発向上** - 一貫したパターン
- 🐛 **バグ削減** - テストによる品質保証

### metainfoとの統一による追加効果

- 📦 **一貫性** - 両ディレクトリで同じパターン
- 🎯 **学習コスト削減** - 開発者が迷わない
- 🔧 **メンテナンス性向上** - 予測可能な構造
- 🚀 **開発速度向上** - テンプレートの再利用

---

**作成日:** 2025-10-13
**バージョン:** 1.0
**次回レビュー:** リファクタリング完了後
**関連ドキュメント:** `metainfo-component-analysis.md`
