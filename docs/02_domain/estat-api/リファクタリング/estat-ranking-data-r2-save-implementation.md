# EstatRankingDataContainer R2保存機能実装ガイド

**作成日**: 2025-10-13
**最終更新**: 2025-10-13 (v1.1 - FormattedValue型定義の簡素化対応)
**対象コンポーネント**: `src/components/estat/ranking-settings/containers/EstatRankingDataContainer.tsx`
**目的**: `formattedData`をR2ストレージにJSON形式で年度ごとに保存する機能の追加

---

## 目次

1. [概要](#1-概要)
2. [データフロー](#2-データフロー)
3. [実装ステップ](#3-実装ステップ)
4. [詳細実装](#4-詳細実装)
5. [テスト方法](#5-テスト方法)
6. [トラブルシューティング](#6-トラブルシューティング)

---

## 1. 概要

### 1.1 要件

- **保存対象**: `formattedData` (FormattedValue[])
- **保存先**: Cloudflare R2 オブジェクトストレージ
- **保存形式**: JSON形式
- **ファイルパス**: `estat_cache/{statsDataId}/{categoryCode}/{timeCode}.json`
- **トリガー**: ユーザーが「R2に保存」ボタンをクリックした時

### 1.2 データ構造（v1.1更新）

#### FormattedValue型（保存対象）

```typescript
// src/lib/estat/types/formatted.ts
export interface FormattedValue {
  value: number;                // 数値データ（簡素化）
  unit: string | null;          // 単位
  areaCode: string;             // 地域コード
  areaName: string;             // 地域名
  categoryCode: string;         // カテゴリコード
  categoryName: string;         // カテゴリ名
  timeCode: string;             // 時系列コード
  timeName: string;             // 時系列名
  rank?: number;                // ランク（オプショナル）
}
```

**変更点（v1.1）**:
- ✅ `value`が`string`から`number`に変更
- ✅ `numericValue`フィールドが削除（valueに統合）
- ✅ `displayValue`フィールドが削除（表示時にフォーマット）

#### R2保存形式

```json
{
  "version": "1.1",
  "stats_data_id": "0003448738",
  "category_code": "A1101",
  "category_name": "総人口",
  "time_code": "2023100000",
  "time_name": "2023年",
  "unit": "人",
  "saved_at": "2025-10-13T12:00:00Z",
  "total_count": 47,
  "values": [
    {
      "area_code": "01",
      "area_name": "北海道",
      "value": 5224614,
      "rank": 8
    },
    {
      "area_code": "13",
      "area_name": "東京都",
      "value": 14047594,
      "rank": 1
    }
    // ... 残り45都道府県
  ]
}
```

**変更点（v1.1）**:
- ✅ `numeric_value`フィールドが削除（valueに統合）
- ✅ `display_value`フィールドが削除

### 1.3 ファイル構成

```
プロジェクトルート/
├── src/
│   ├── components/
│   │   └── estat/
│   │       └── ranking-settings/
│   │           └── containers/
│   │               └── EstatRankingDataContainer.tsx  # 更新対象
│   ├── app/
│   │   └── api/
│   │       └── estat/
│   │           └── cache/
│   │               └── save/
│   │                   └── route.ts                  # 新規作成（APIエンドポイント）
│   ├── lib/
│   │   └── estat/
│   │       └── cache/
│   │           ├── EstatR2CacheService.ts             # 新規作成（R2操作）
│   │           └── index.ts                           # 新規作成（エクスポート）
│   └── types/
│       └── models/
│           └── r2/
│               └── estat-cache.ts                     # 新規作成（型定義）
├── wrangler.toml                                      # 更新（R2バケット設定）
└── doc/
    └── estat-ranking-data-r2-save-implementation.md   # このファイル
```

---

## 2. データフロー

### 2.1 保存フロー

```
┌──────────────────────────────────────────────────────────────┐
│ 1. ユーザーアクション                                         │
│    EstatRankingDataContainer.tsx                             │
│    「R2に保存」ボタンクリック                                │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ formattedData + メタデータ
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. APIリクエスト                                              │
│    POST /api/estat-api/cache/save                                │
│    {                                                          │
│      statsDataId, categoryCode, timeCode,                    │
│      values: formattedData                                   │
│    }                                                          │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. APIルートハンドラー                                        │
│    src/app/api/estat-api/cache/save/route.ts                     │
│    - リクエストバリデーション                                │
│    - データ整形                                               │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. R2キャッシュサービス                                       │
│    EstatR2CacheService.saveRankingData()                     │
│    - ランク計算                                               │
│    - JSON生成                                                 │
│    - R2保存                                                   │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Cloudflare R2                                             │
│    estat_cache/{statsDataId}/{categoryCode}/{timeCode}.json  │
│    JSONファイルとして保存                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. 実装ステップ

### ステップ1: R2バケット設定（5分）

**ファイル**: `wrangler.toml`

```toml
# 既存の設定...

# R2バケット設定を追加
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "stats47-cache"
preview_bucket_name = "stats47-cache-preview"

# ローカル環境用設定
[[env.local.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "stats47-cache-local"
```

**バケット作成コマンド**:
```bash
# 本番環境用バケット作成
npx wrangler r2 bucket create stats47-cache

# プレビュー環境用バケット作成
npx wrangler r2 bucket create stats47-cache-preview

# ローカル環境用バケット作成
npx wrangler r2 bucket create stats47-cache-local
```

### ステップ2: 型定義の作成（10分）

**ファイル**: `src/types/models/r2/estat-cache.ts` (新規作成)

```typescript
/**
 * R2に保存されるe-Statキャッシュデータの型定義
 * FormattedValue v1.1対応版
 */

/**
 * R2保存用のランキング値データ
 */
export interface EstatCacheValueR2 {
  area_code: string;
  area_name: string;
  value: number;      // v1.1: 直接数値を保存
  rank?: number;
}

/**
 * R2に保存されるe-Statキャッシュデータ全体
 */
export interface EstatCacheDataR2 {
  version: string;
  stats_data_id: string;
  category_code: string;
  category_name: string;
  time_code: string;
  time_name: string;
  unit: string | null;
  saved_at: string;
  total_count: number;
  values: EstatCacheValueR2[];
}

/**
 * R2保存APIのリクエストボディ
 */
export interface SaveEstatCacheRequest {
  statsDataId: string;
  categoryCode: string;
  categoryName: string;
  timeCode: string;
  timeName: string;
  unit: string | null;
  values: Array<{
    areaCode: string;
    areaName: string;
    value: number;    // v1.1: 直接数値を受け取る
    rank?: number;
  }>;
}

/**
 * R2保存APIのレスポンス
 */
export interface SaveEstatCacheResponse {
  success: boolean;
  message: string;
  data?: {
    key: string;
    size: number;
    count: number;
  };
  error?: string;
}
```

### ステップ3: R2キャッシュサービスの作成（30分）

**ファイル**: `src/lib/estat/cache/EstatR2CacheService.ts` (新規作成)

```typescript
/**
 * e-StatデータR2キャッシュサービス
 * e-Stat APIから取得したデータをR2でキャッシュ管理
 * FormattedValue v1.1対応版
 */

import { FormattedValue } from "@/lib/estat/types";
import {
  EstatCacheDataR2,
  EstatCacheValueR2,
} from "@/types/models/r2/estat-cache";

export class EstatR2CacheService {
  /**
   * e-Statランキングデータを保存
   *
   * @param env - Cloudflare環境変数（R2バケット含む）
   * @param statsDataId - 統計表ID
   * @param categoryCode - カテゴリコード
   * @param categoryName - カテゴリ名
   * @param timeCode - 時系列コード
   * @param timeName - 時系列名
   * @param data - FormattedValue[]形式のデータ
   */
  static async saveRankingData(
    env: { R2_BUCKET: R2Bucket },
    statsDataId: string,
    categoryCode: string,
    categoryName: string,
    timeCode: string,
    timeName: string,
    data: FormattedValue[]
  ): Promise<{ key: string; size: number; count: number }> {
    if (data.length === 0) {
      throw new Error("保存するデータがありません");
    }

    // ランキング順位を計算（valueの降順）
    const sortedData = [...data].sort((a, b) => {
      const aValue = a.value ?? 0;
      const bValue = b.value ?? 0;
      return bValue - aValue; // 降順ソート
    });

    // ランキング順位を設定
    const rankedData = sortedData.map((record, index) => ({
      ...record,
      rank: index + 1, // 1から始まるランキング
    }));

    // R2保存用データ構造に変換
    const r2Data: EstatCacheDataR2 = {
      version: "1.1",
      stats_data_id: statsDataId,
      category_code: categoryCode,
      category_name: categoryName,
      time_code: timeCode,
      time_name: timeName,
      unit: data[0]?.unit || null,
      saved_at: new Date().toISOString(),
      total_count: rankedData.length,
      values: rankedData.map(
        (record): EstatCacheValueR2 => ({
          area_code: record.areaCode,
          area_name: record.areaName,
          value: record.value,        // v1.1: 直接数値を保存
          rank: record.rank,
        })
      ),
    };

    // R2オブジェクトキー生成
    const key = `estat_cache/${statsDataId}/${categoryCode}/${timeCode}.json`;

    // JSONに変換
    const jsonString = JSON.stringify(r2Data, null, 2);
    const jsonBuffer = new TextEncoder().encode(jsonString);

    // R2に保存
    await env.R2_BUCKET.put(key, jsonBuffer, {
      httpMetadata: {
        contentType: "application/json",
      },
      customMetadata: {
        "stats-data-id": statsDataId,
        "category-code": categoryCode,
        "time-code": timeCode,
        "saved-at": r2Data.saved_at,
        "total-count": String(r2Data.total_count),
      },
    });

    console.log(
      `R2キャッシュ保存完了: ${key} (${rankedData.length}件, ${jsonBuffer.byteLength}バイト)`
    );

    return {
      key,
      size: jsonBuffer.byteLength,
      count: rankedData.length,
    };
  }

  /**
   * e-Statランキングデータを取得
   *
   * @param env - Cloudflare環境変数（R2バケット含む）
   * @param statsDataId - 統計表ID
   * @param categoryCode - カテゴリコード
   * @param timeCode - 時系列コード
   * @returns FormattedValue[] | null
   */
  static async getRankingData(
    env: { R2_BUCKET: R2Bucket },
    statsDataId: string,
    categoryCode: string,
    timeCode: string
  ): Promise<FormattedValue[] | null> {
    try {
      const key = `estat_cache/${statsDataId}/${categoryCode}/${timeCode}.json`;
      const object = await env.R2_BUCKET.get(key);

      if (!object) {
        console.log(`R2キャッシュミス: ${key}`);
        return null;
      }

      const jsonText = await object.text();
      const cacheData: EstatCacheDataR2 = JSON.parse(jsonText);

      // FormattedValue[]に変換
      const formattedValues: FormattedValue[] = cacheData.values.map(
        (v) => ({
          value: v.value,                    // v1.1: 直接数値を使用
          unit: cacheData.unit,
          areaCode: v.area_code,
          areaName: v.area_name,
          categoryCode: cacheData.category_code,
          categoryName: cacheData.category_name,
          timeCode: cacheData.time_code,
          timeName: cacheData.time_name,
          rank: v.rank,
        })
      );

      console.log(
        `R2キャッシュヒット: ${key} (${formattedValues.length}件)`
      );

      return formattedValues;
    } catch (error) {
      console.error("R2キャッシュ取得エラー:", error);
      return null;
    }
  }

  /**
   * 利用可能な年度一覧を取得
   *
   * @param env - Cloudflare環境変数（R2バケット含む）
   * @param statsDataId - 統計表ID
   * @param categoryCode - カテゴリコード
   * @returns string[] - 時系列コードの配列（降順）
   */
  static async getAvailableYears(
    env: { R2_BUCKET: R2Bucket },
    statsDataId: string,
    categoryCode: string
  ): Promise<string[]> {
    try {
      const prefix = `estat_cache/${statsDataId}/${categoryCode}/`;
      const list = await env.R2_BUCKET.list({ prefix });

      const years = list.objects
        .map((obj) => {
          // "estat_cache/{statsDataId}/{categoryCode}/{timeCode}.json" から timeCode を抽出
          const match = obj.key.match(/\/([^/]+)\.json$/);
          return match ? match[1] : null;
        })
        .filter((year): year is string => year !== null)
        .sort()
        .reverse();

      return years;
    } catch (error) {
      console.error("年度一覧取得エラー:", error);
      return [];
    }
  }

  /**
   * キャッシュを削除
   *
   * @param env - Cloudflare環境変数（R2バケット含む）
   * @param statsDataId - 統計表ID
   * @param categoryCode - カテゴリコード
   * @param timeCode - 時系列コード（省略時は全年度）
   */
  static async deleteCache(
    env: { R2_BUCKET: R2Bucket },
    statsDataId: string,
    categoryCode: string,
    timeCode?: string
  ): Promise<void> {
    try {
      if (timeCode) {
        // 特定年度のみ削除
        const key = `estat_cache/${statsDataId}/${categoryCode}/${timeCode}.json`;
        await env.R2_BUCKET.delete(key);
        console.log(`R2キャッシュ削除: ${key}`);
      } else {
        // 全年度削除
        const prefix = `estat_cache/${statsDataId}/${categoryCode}/`;
        const list = await env.R2_BUCKET.list({ prefix });

        for (const obj of list.objects) {
          await env.R2_BUCKET.delete(obj.key);
          console.log(`R2キャッシュ削除: ${obj.key}`);
        }
      }
    } catch (error) {
      console.error("R2キャッシュ削除エラー:", error);
      throw error;
    }
  }
}
```

**ファイル**: `src/lib/estat/cache/index.ts` (新規作成)

```typescript
export { EstatR2CacheService } from "./EstatR2CacheService";
```

### ステップ4: APIエンドポイントの作成（20分）

**ファイル**: `src/app/api/estat-api/cache/save/route.ts` (新規作成)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { EstatR2CacheService } from "@/lib/estat/cache";
import { FormattedValue } from "@/lib/estat/types";
import {
  SaveEstatCacheRequest,
  SaveEstatCacheResponse,
} from "@/types/models/r2/estat-cache";

/**
 * e-StatランキングデータをR2に保存するAPIエンドポイント
 * POST /api/estat-api/cache/save
 * FormattedValue v1.1対応版
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SaveEstatCacheResponse>> {
  try {
    // リクエストボディのパース
    const body: SaveEstatCacheRequest = await request.json();

    // バリデーション
    if (!body.statsDataId || !body.categoryCode || !body.timeCode) {
      return NextResponse.json(
        {
          success: false,
          message: "必須パラメータが不足しています",
          error: "statsDataId, categoryCode, timeCode は必須です",
        },
        { status: 400 }
      );
    }

    if (!body.values || body.values.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "保存するデータがありません",
          error: "values配列が空です",
        },
        { status: 400 }
      );
    }

    // FormattedValue[]に変換
    const formattedValues: FormattedValue[] = body.values.map((v) => ({
      value: v.value,              // v1.1: 直接数値を使用
      unit: body.unit,
      areaCode: v.areaCode,
      areaName: v.areaName,
      categoryCode: body.categoryCode,
      categoryName: body.categoryName,
      timeCode: body.timeCode,
      timeName: body.timeName,
      rank: v.rank,
    }));

    // 環境変数からR2バケットを取得
    // @ts-expect-error - Cloudflare環境でのみ利用可能
    const env = process.env as unknown as { R2_BUCKET: R2Bucket };

    if (!env.R2_BUCKET) {
      return NextResponse.json(
        {
          success: false,
          message: "R2バケットが設定されていません",
          error: "環境変数R2_BUCKETが見つかりません",
        },
        { status: 500 }
      );
    }

    // R2に保存
    const result = await EstatR2CacheService.saveRankingData(
      env,
      body.statsDataId,
      body.categoryCode,
      body.categoryName,
      body.timeCode,
      body.timeName,
      formattedValues
    );

    return NextResponse.json({
      success: true,
      message: `データを保存しました（${result.count}件、${Math.round(result.size / 1024)}KB）`,
      data: result,
    });
  } catch (error) {
    console.error("R2保存エラー:", error);

    return NextResponse.json(
      {
        success: false,
        message: "データの保存に失敗しました",
        error: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    );
  }
}
```

### ステップ5: フロントエンドの更新（30分）

**ファイル**: `src/components/estat/ranking-settings/containers/EstatRankingDataContainer.tsx`

#### 5.1 必要なインポートを追加

```typescript
// 既存のインポートの下に追加（16行目付近）
import { Save, Check, AlertCircle } from "lucide-react"; // Settings の下に追加
import { SaveEstatCacheRequest } from "@/types/models/r2/estat-cache";
```

#### 5.2 状態管理を追加

```typescript
// 既存の状態管理（57行目付近）の下に追加
const [isSaving, setIsSaving] = useState(false);
const [saveStatus, setSaveStatus] = useState<{
  type: "success" | "error" | null;
  message: string;
}>({ type: null, message: "" });
```

#### 5.3 R2保存関数を追加

```typescript
// useMemoの後、return文の前に追加（160行目付近）
/**
 * R2にデータを保存
 */
const handleSaveToR2 = async () => {
  if (!formattedData || formattedData.length === 0) {
    setSaveStatus({
      type: "error",
      message: "保存するデータがありません",
    });
    return;
  }

  setIsSaving(true);
  setSaveStatus({ type: null, message: "" });

  try {
    // 最初のデータからメタ情報を取得
    const firstData = formattedData[0];

    const requestBody: SaveEstatCacheRequest = {
      statsDataId: statsDataId,
      categoryCode: categoryCode,
      categoryName: firstData.categoryName,
      timeCode: firstData.timeCode,
      timeName: firstData.timeName,
      unit: firstData.unit,
      values: formattedData.map((v) => ({
        areaCode: v.areaCode,
        areaName: v.areaName,
        value: v.value,        // v1.1: 直接数値を送信
        rank: v.rank,
      })),
    };

    const response = await fetch("/api/estat-api/cache/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (result.success) {
      setSaveStatus({
        type: "success",
        message: result.message,
      });
      // 3秒後にメッセージをクリア
      setTimeout(() => {
        setSaveStatus({ type: null, message: "" });
      }, 3000);
    } else {
      setSaveStatus({
        type: "error",
        message: result.message || "保存に失敗しました",
      });
    }
  } catch (error) {
    console.error("R2保存エラー:", error);
    setSaveStatus({
      type: "error",
      message:
        error instanceof Error ? error.message : "保存中にエラーが発生しました",
    });
  } finally {
    setIsSaving(false);
  }
};
```

#### 5.4 UIボタンを追加

```typescript
// RankingHeaderのactionsプロップを更新（209行目付近）
actions={
  <div className="flex gap-2">
    {/* R2保存ボタン */}
    <button
      onClick={handleSaveToR2}
      disabled={isSaving || formattedData.length === 0}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
      title="R2ストレージに保存"
    >
      {isSaving ? (
        <>
          <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
          <span>保存中...</span>
        </>
      ) : saveStatus.type === "success" ? (
        <>
          <Check className="w-4 h-4 text-green-600" />
          <span>保存完了</span>
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          <span>R2に保存</span>
        </>
      )}
    </button>

    {/* 詳細設定ボタン（既存） */}
    {onSettingsChange && (
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="p-2 rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-none focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
        title="詳細設定"
      >
        <Settings className="w-4 h-4" />
      </button>
    )}
  </div>
}
```

#### 5.5 ステータスメッセージ表示を追加

```typescript
// RankingHeaderの直後に追加（221行目付近）
{/* 保存ステータスメッセージ */}
{saveStatus.type && (
  <div
    className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
      saveStatus.type === "success"
        ? "bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
        : "bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
    }`}
  >
    {saveStatus.type === "success" ? (
      <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
    ) : (
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
    )}
    <div className="flex-1">
      <p className="font-medium">
        {saveStatus.type === "success" ? "保存成功" : "保存失敗"}
      </p>
      <p className="text-sm mt-1">{saveStatus.message}</p>
    </div>
    <button
      onClick={() => setSaveStatus({ type: null, message: "" })}
      className="text-current opacity-60 hover:opacity-100"
    >
      ×
    </button>
  </div>
)}
```

---

## 4. 詳細実装

### 4.1 完全なコード差分

#### EstatRankingDataContainer.tsx（更新箇所のみ）

```diff
"use client";

import React, { useState, useEffect, useMemo } from "react";
-import { EstatStatsDataResponse, FormattedYear } from "@/lib/estat/types";
+import { EstatStatsDataResponse } from "@/lib/estat/types";
import { ChoroplethMap } from "@/components/d3/ChoroplethMap";
import { StatisticsSummary } from "@/components/ranking/ui/StatisticsSummary";
-import { YearSelector } from "@/components/common";
+import { EstatYearSelector } from "@/components/estat/EstatYearSelector";
import { RankingHeader } from "@/components/ranking/ui/RankingHeader";
import { PrefectureDataTableClient } from "@/components/ranking/ui/PrefectureDataTableClient";
import { RankingVisualizationOptions } from "@/types/visualization/ranking-options";
import { Modal } from "@/components/common/Modal/Modal";
import {
  RankingItemSettings,
  RankingItemSettingsData,
} from "@/components/ranking-settings";
-import { Settings } from "lucide-react";
+import { Settings, Save, Check, AlertCircle } from "lucide-react";
import { EstatStatsDataService } from "@/lib/estat/statsdata/EstatStatsDataService";
import { RankingItem } from "@/types/models/ranking";
+import { SaveEstatCacheRequest } from "@/types/models/r2/estat-cache";

// ... (interfaceとpropsは同じ)

export const EstatRankingDataContainer: React.FC<
  EstatRankingDataContainerProps
> = ({
  rawData,
  rankingKey,
  rankingItem,
  statsDataId,
  categoryCode,
  onSettingsChange,
}) => {
  // ... (既存のコード)

  // ===== 状態管理 =====
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
+  const [isSaving, setIsSaving] = useState(false);
+  const [saveStatus, setSaveStatus] = useState<{
+    type: "success" | "error" | null;
+    message: string;
+  }>({ type: null, message: "" });

  // ... (データ変換コードは同じ)

+  /**
+   * R2にデータを保存
+   */
+  const handleSaveToR2 = async () => {
+    if (!formattedData || formattedData.length === 0) {
+      setSaveStatus({
+        type: "error",
+        message: "保存するデータがありません",
+      });
+      return;
+    }
+
+    setIsSaving(true);
+    setSaveStatus({ type: null, message: "" });
+
+    try {
+      const firstData = formattedData[0];
+
+      const requestBody: SaveEstatCacheRequest = {
+        statsDataId: statsDataId,
+        categoryCode: categoryCode,
+        categoryName: firstData.categoryName,
+        timeCode: firstData.timeCode,
+        timeName: firstData.timeName,
+        unit: firstData.unit,
+        values: formattedData.map((v) => ({
+          areaCode: v.areaCode,
+          areaName: v.areaName,
+          value: v.value,
+          rank: v.rank,
+        })),
+      };
+
+      const response = await fetch("/api/estat-api/cache/save", {
+        method: "POST",
+        headers: {
+          "Content-Type": "application/json",
+        },
+        body: JSON.stringify(requestBody),
+      });
+
+      const result = await response.json();
+
+      if (result.success) {
+        setSaveStatus({
+          type: "success",
+          message: result.message,
+        });
+        setTimeout(() => {
+          setSaveStatus({ type: null, message: "" });
+        }, 3000);
+      } else {
+        setSaveStatus({
+          type: "error",
+          message: result.message || "保存に失敗しました",
+        });
+      }
+    } catch (error) {
+      console.error("R2保存エラー:", error);
+      setSaveStatus({
+        type: "error",
+        message:
+          error instanceof Error ? error.message : "保存中にエラーが発生しました",
+      });
+    } finally {
+      setIsSaving(false);
+    }
+  };

  // ... (ローディング状態は同じ)

  return (
    <div>
      <RankingHeader
        title={`${subcategory.name}ランキング`}
        yearSelector={
-          <YearSelector
-            years={availableYears}
+          <EstatYearSelector
+            years={formattedEstatData.years}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
        }
        actions={
+          <div className="flex gap-2">
+            <button
+              onClick={handleSaveToR2}
+              disabled={isSaving || formattedData.length === 0}
+              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
+              title="R2ストレージに保存"
+            >
+              {isSaving ? (
+                <>
+                  <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
+                  <span>保存中...</span>
+                </>
+              ) : saveStatus.type === "success" ? (
+                <>
+                  <Check className="w-4 h-4 text-green-600" />
+                  <span>保存完了</span>
+                </>
+              ) : (
+                <>
+                  <Save className="w-4 h-4" />
+                  <span>R2に保存</span>
+                </>
+              )}
+            </button>
+
-            onSettingsChange && (
+            {onSettingsChange && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-none focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
                title="詳細設定"
              >
                <Settings className="w-4 h-4" />
              </button>
-            )
+            )}
+          </div>
        }
      />

+      {saveStatus.type && (
+        <div
+          className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
+            saveStatus.type === "success"
+              ? "bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
+              : "bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
+          }`}
+        >
+          {saveStatus.type === "success" ? (
+            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
+          ) : (
+            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
+          )}
+          <div className="flex-1">
+            <p className="font-medium">
+              {saveStatus.type === "success" ? "保存成功" : "保存失敗"}
+            </p>
+            <p className="text-sm mt-1">{saveStatus.message}</p>
+          </div>
+          <button
+            onClick={() => setSaveStatus({ type: null, message: "" })}
+            className="text-current opacity-60 hover:opacity-100"
+          >
+            ×
+          </button>
+        </div>
+      )}

      {/* ... (残りのコードは同じ) */}
    </div>
  );
};
```

### 4.2 型定義のエクスポート

**ファイル**: `src/types/models/r2/index.ts` (新規作成)

```typescript
export * from "./estat-cache";
```

---

## 5. テスト方法

### 5.1 ローカル開発環境での動作確認

#### ステップ1: R2バケットの作成

```bash
# ローカル用バケット作成
npx wrangler r2 bucket create stats47-cache-local
```

#### ステップ2: 開発サーバー起動

```bash
npm run dev
```

#### ステップ3: ページアクセス

1. ブラウザで`http://localhost:3000/ranking-settings`にアクセス
2. e-Stat統計表IDとカテゴリコードを入力してデータ取得
3. データが表示されたら「R2に保存」ボタンをクリック
4. 保存成功メッセージが表示されることを確認

#### ステップ4: R2の確認

```bash
# 保存されたファイルの確認
npx wrangler r2 object list stats47-cache-local --prefix="estat_cache/"

# 特定ファイルの内容確認
npx wrangler r2 object get stats47-cache-local/estat_cache/0003448738/A1101/2023100000.json
```

### 5.2 保存データの検証

#### 手動検証

```bash
# R2から取得したJSONを確認
npx wrangler r2 object get stats47-cache-local/estat_cache/{statsDataId}/{categoryCode}/{timeCode}.json

# 期待される内容:
# - version: "1.1"
# - total_count: 47 (都道府県数)
# - values配列に47件のデータ
# - valueが数値型
# - rank が1から47まで正しく設定されている
```

#### JSONスキーマ検証

```json
{
  "version": "1.1",
  "stats_data_id": "0003448738",
  "category_code": "A1101",
  "category_name": "総人口",
  "time_code": "2023100000",
  "time_name": "2023年",
  "unit": "人",
  "saved_at": "2025-10-13T12:34:56.789Z",
  "total_count": 47,
  "values": [
    {
      "area_code": "13",
      "area_name": "東京都",
      "value": 14047594,
      "rank": 1
    }
  ]
}
```

**確認項目**:
- ✅ `value`が数値型（文字列ではない）
- ✅ `numeric_value`と`display_value`フィールドが存在しない
- ✅ `rank`が正しく計算されている（降順）

---

## 6. トラブルシューティング

### 問題1: R2バケットが見つからない

**エラーメッセージ**:
```
環境変数R2_BUCKETが見つかりません
```

**原因**:
- `wrangler.toml`にR2バケット設定が追加されていない
- バケット名が間違っている

**解決方法**:
```bash
# バケットの存在確認
npx wrangler r2 bucket list

# wrangler.tomlを確認
cat wrangler.toml | grep -A 3 "r2_buckets"
```

### 問題2: 型エラー「value is string but should be number」

**原因**:
古いFormattedValue定義を使用している

**解決方法**:
```typescript
// src/lib/estat/types/formatted.ts を確認
export interface FormattedValue {
  value: number;  // ← string ではなく number であることを確認
  // ...
}
```

### 問題3: 保存されたJSONでvalueが文字列になっている

**原因**:
データマッピング時に`String()`で変換している

**解決方法**:
```typescript
// ❌ 間違い
values: formattedData.map(v => ({
  value: String(v.value),  // 文字列に変換している
}))

// ✅ 正しい
values: formattedData.map(v => ({
  value: v.value,  // 数値のまま
}))
```

### 問題4: TypeScriptエラーが出る

**エラー例**:
```
Cannot find module '@/types/models/r2/estat-cache'
```

**解決方法**:
```bash
# 型定義ファイルの確認
ls -la src/types/models/r2/

# TypeScriptサーバー再起動（VS Code）
Cmd+Shift+P > "TypeScript: Restart TS Server"
```

---

## 7. まとめ

### 実装チェックリスト

- [ ] R2バケット作成（`stats47-cache`, `stats47-cache-preview`, `stats47-cache-local`）
- [ ] `wrangler.toml`にR2設定追加
- [ ] 型定義ファイル作成（`src/types/models/r2/estat-cache.ts`）
- [ ] R2サービスクラス作成（`src/lib/estat/cache/EstatR2CacheService.ts`）
- [ ] APIエンドポイント作成（`src/app/api/estat-api/cache/save/route.ts`）
- [ ] フロントエンド更新（`EstatRankingDataContainer.tsx`）
- [ ] ローカル環境でテスト
- [ ] 保存されたJSONの検証（`value`が数値型であることを確認）
- [ ] 本番環境にデプロイ
- [ ] 本番環境でテスト

### 推定作業時間

| タスク | 時間 |
|--------|------|
| R2バケット設定 | 5分 |
| 型定義作成 | 10分 |
| R2サービス作成 | 30分 |
| APIエンドポイント作成 | 20分 |
| フロントエンド更新 | 30分 |
| テスト | 30分 |
| **合計** | **約2時間** |

### v1.1での主要変更点

1. **FormattedValue構造の簡素化**
   - `value: number` に統一
   - `numericValue`, `displayValue` フィールド削除

2. **R2保存形式の簡素化**
   - `value: number` のみ保存
   - `numeric_value`, `display_value` フィールド削除

3. **コード量の削減**
   - 変換ロジックが簡潔に
   - 保守性の向上

### 次のステップ（オプション）

1. **R2からの読み取り機能追加**
   - `GET /api/estat-api/cache/get` エンドポイント
   - キャッシュヒット時はR2から取得、ミス時はe-Stat APIから取得

2. **キャッシュ管理画面**
   - 保存済みデータ一覧表示
   - 削除機能
   - 更新日時表示

3. **自動キャッシュ更新**
   - Cron Triggerで定期的にデータを更新

4. **R2完全移行**
   - 「ランキング値R2移行計画書」（`doc/ranking-values-r2-migration-plan.md`）に従って完全移行

---

**文書バージョン**: 1.1
**最終更新日**: 2025-10-13
**変更内容**: FormattedValue v1.1（値の簡素化）対応
**作成者**: Claude Code
