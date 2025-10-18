---
title: EstatMetainfoPage R2保存機能実装ガイド
created: 2025-10-18
updated: 2025-10-18
tags:
  - domain/estat-api
  - implementation
---

# EstatMetainfoPage R2 保存機能実装ガイド

**作成日**: 2025-10-18
**最終更新**: 2025-10-18 (v1.0)
**対象コンポーネント**: `src/components/pages/EstatMetainfoPage/EstatMetainfoPage.tsx`
**目的**: e-Stat APIから取得したメタ情報を R2 ストレージに JSON 形式で保存する機能の追加

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

- **保存対象**: e-Stat API `GET_META_INFO` レスポンス（メタ情報全体）
- **保存先**: Cloudflare R2 オブジェクトストレージ
- **保存形式**: JSON 形式
- **ファイルパス**: `estat_metainfo/{statsDataId}/meta.json`
- **トリガー**: ユーザーが「R2に保存」ボタンをクリックした時

### 1.2 データ構造

#### EstatMetaInfoResponse 型（保存対象）

```typescript
// src/lib/estat-api/types.ts
export interface EstatMetaInfoResponse {
  GET_META_INFO: {
    METADATA_INF: {
      TABLE_INF: {
        "@id": string;
        TITLE: { $: string };
        STAT_NAME: { $: string };
        GOV_ORG: { $: string };
        SURVEY_DATE: string | number;
        UPDATED_DATE: string;
        // ... その他メタ情報フィールド
      };
    };
  };
}
```

#### R2 保存形式

```json
{
  "version": "1.0",
  "stats_data_id": "0003448738",
  "saved_at": "2025-10-18T12:00:00Z",
  "meta_info_response": {
    "GET_META_INFO": {
      // ... 完全なe-Stat APIレスポンス
    }
  },
  "summary": {
    "table_title": "人口推計",
    "stat_name": "人口推計",
    "organization": "総務省",
    "survey_date": "2023100000",
    "updated_date": "2024-01-15"
  }
}
```

### 1.3 ファイル構成

```
プロジェクトルート/
├── src/
│   ├── components/
│   │   └── pages/
│   │       └── EstatMetainfoPage/
│   │           └── EstatMetainfoPage.tsx              # 更新対象
│   ├── app/
│   │   └── api/
│   │       └── estat-api/
│   │           └── metainfo-cache/
│   │               └── save/
│   │                   └── route.ts                   # 新規作成（APIエンドポイント）
│   ├── lib/
│   │   └── estat-api/
│   │       └── meta-info/
│   │           └── EstatMetaInfoR2Service.ts          # 新規作成（R2操作）
│   └── types/
│       └── models/
│           └── r2/
│               └── estat-metainfo-cache.ts            # 新規作成（型定義）
├── wrangler.toml                                       # 更新（R2バケット設定）
└── docs/
    └── 02_domain/
        └── estat-api/
            └── implementation/
                └── estat-metainfo-r2-save-implementation.md  # このファイル
```

---

## 2. データフロー

### 2.1 保存フロー

```
┌──────────────────────────────────────────────────────────────┐
│ 1. ユーザーアクション                                         │
│    EstatMetainfoPage.tsx                                     │
│    「R2に保存」ボタンクリック                                │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ metaInfo (EstatMetaInfoResponse)
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. APIリクエスト                                              │
│    POST /api/estat-api/metainfo-cache/save                   │
│    {                                                          │
│      statsDataId: string,                                    │
│      metaInfoResponse: EstatMetaInfoResponse                 │
│    }                                                          │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. APIルートハンドラー                                        │
│    src/app/api/estat-api/metainfo-cache/save/route.ts        │
│    - リクエストバリデーション                                │
│    - データ整形                                               │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. R2キャッシュサービス                                       │
│    EstatMetaInfoR2Service.saveMetaInfo()                     │
│    - サマリー情報抽出                                         │
│    - JSON生成                                                 │
│    - R2保存                                                   │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Cloudflare R2                                             │
│    estat_metainfo/{statsDataId}/meta.json                    │
│    JSONファイルとして保存                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. 実装ステップ

### ステップ 1: R2 バケット設定（5 分）

**ファイル**: `wrangler.toml`

```toml
# 既存の設定...

# R2ストレージ（e-Statメタ情報キャッシュ用）
[[r2_buckets]]
binding = "METAINFO_BUCKET"
bucket_name = "stats47-metainfo"
preview_bucket_name = "stats47-metainfo-preview"
```

**バケット作成コマンド**:

```bash
# 本番環境用バケット作成
npx wrangler r2 bucket create stats47-metainfo

# プレビュー環境用バケット作成
npx wrangler r2 bucket create stats47-metainfo-preview
```

### ステップ 2: 型定義の作成（10 分）

**ファイル**: `src/types/models/r2/estat-metainfo-cache.ts` (新規作成)

```typescript
/**
 * R2に保存されるe-Statメタ情報キャッシュの型定義
 */

/**
 * R2保存用のメタ情報データ
 */
export interface MetaInfoCacheDataR2 {
  version: string; // バージョン情報
  stats_data_id: string; // 統計表ID
  saved_at: string; // 保存日時（ISO 8601）

  // e-Stat API レスポンス全体を保存
  meta_info_response: Record<string, any>;

  // 検索・フィルタ用サマリー情報
  summary: {
    table_title: string;
    stat_name: string;
    organization: string;
    survey_date: string | number;
    updated_date: string;
  };
}

/**
 * R2保存APIのリクエストボディ
 */
export interface SaveMetaInfoCacheRequest {
  statsDataId: string;
  metaInfoResponse: Record<string, any>;
}

/**
 * R2保存APIのレスポンス
 */
export interface SaveMetaInfoCacheResponse {
  success: boolean;
  message: string;
  data?: {
    key: string; // R2オブジェクトキー
    size: number; // ファイルサイズ（bytes）
    statsDataId: string;
  };
  error?: string;
}
```

### ステップ 3: R2 キャッシュサービスの作成（30 分）

**ファイル**: `src/lib/estat-api/meta-info/EstatMetaInfoR2Service.ts` (新規作成)

```typescript
/**
 * e-StatメタインフォメーションR2キャッシュサービス
 * e-Stat APIから取得したメタ情報をR2でキャッシュ管理
 */

import { EstatMetaInfoResponse } from "../types";
import { MetaInfoCacheDataR2 } from "@/types/models/r2/estat-metainfo-cache";

export class EstatMetaInfoR2Service {
  /**
   * e-Statメタ情報を保存
   *
   * @param env - Cloudflare環境変数（R2バケット含む）
   * @param statsDataId - 統計表ID
   * @param metaInfo - EstatMetaInfoResponse形式のデータ
   */
  static async saveMetaInfo(
    env: { METAINFO_BUCKET: R2Bucket },
    statsDataId: string,
    metaInfo: EstatMetaInfoResponse
  ): Promise<{ key: string; size: number }> {
    // サマリー情報を抽出
    const tableInf = metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF;
    if (!tableInf) {
      throw new Error("統計表情報が見つかりません");
    }

    // R2保存用データ構造に変換
    const r2Data: MetaInfoCacheDataR2 = {
      version: "1.0",
      stats_data_id: statsDataId,
      saved_at: new Date().toISOString(),
      meta_info_response: metaInfo,
      summary: {
        table_title: tableInf.TITLE?.$ || "",
        stat_name: tableInf.STAT_NAME?.$ || "",
        organization: tableInf.GOV_ORG?.$ || "",
        survey_date: tableInf.SURVEY_DATE || "",
        updated_date: tableInf.UPDATED_DATE || "",
      },
    };

    // R2オブジェクトキー生成
    const key = `estat_metainfo/${statsDataId}/meta.json`;

    // JSONに変換
    const jsonString = JSON.stringify(r2Data, null, 2);
    const jsonBuffer = new TextEncoder().encode(jsonString);

    // R2に保存
    await env.METAINFO_BUCKET.put(key, jsonBuffer, {
      httpMetadata: {
        contentType: "application/json",
      },
      customMetadata: {
        "stats-data-id": statsDataId,
        "saved-at": r2Data.saved_at,
        "table-title": r2Data.summary.table_title,
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.log(
        `R2メタ情報キャッシュ保存完了: ${key} (${jsonBuffer.byteLength}バイト)`
      );
    }

    return {
      key,
      size: jsonBuffer.byteLength,
    };
  }

  /**
   * e-Statメタ情報を取得
   *
   * @param env - Cloudflare環境変数（R2バケット含む）
   * @param statsDataId - 統計表ID
   * @returns EstatMetaInfoResponse | null
   */
  static async getMetaInfo(
    env: { METAINFO_BUCKET: R2Bucket },
    statsDataId: string
  ): Promise<EstatMetaInfoResponse | null> {
    try {
      const key = `estat_metainfo/${statsDataId}/meta.json`;
      const object = await env.METAINFO_BUCKET.get(key);

      if (!object) {
        if (process.env.NODE_ENV === "development") {
          console.log(`R2メタ情報キャッシュミス: ${key}`);
        }
        return null;
      }

      const jsonText = await object.text();
      const cacheData: MetaInfoCacheDataR2 = JSON.parse(jsonText);

      if (process.env.NODE_ENV === "development") {
        console.log(`R2メタ情報キャッシュヒット: ${key}`);
      }

      return cacheData.meta_info_response as EstatMetaInfoResponse;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("R2メタ情報キャッシュ取得エラー:", error);
      }
      return null;
    }
  }

  /**
   * キャッシュを削除
   *
   * @param env - Cloudflare環境変数（R2バケット含む）
   * @param statsDataId - 統計表ID
   */
  static async deleteCache(
    env: { METAINFO_BUCKET: R2Bucket },
    statsDataId: string
  ): Promise<void> {
    try {
      const key = `estat_metainfo/${statsDataId}/meta.json`;
      await env.METAINFO_BUCKET.delete(key);

      if (process.env.NODE_ENV === "development") {
        console.log(`R2メタ情報キャッシュ削除: ${key}`);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("R2メタ情報キャッシュ削除エラー:", error);
      }
      throw error;
    }
  }

  /**
   * すべてのキャッシュを一覧取得
   *
   * @param env - Cloudflare環境変数（R2バケット含む）
   * @returns statsDataId の配列
   */
  static async listAllCaches(
    env: { METAINFO_BUCKET: R2Bucket }
  ): Promise<string[]> {
    try {
      const prefix = `estat_metainfo/`;
      const list = await env.METAINFO_BUCKET.list({ prefix });

      const statsDataIds = list.objects
        .map((obj) => {
          // "estat_metainfo/{statsDataId}/meta.json" から statsDataId を抽出
          const match = obj.key.match(/estat_metainfo\/([^/]+)\/meta\.json$/);
          return match ? match[1] : null;
        })
        .filter((id): id is string => id !== null);

      return statsDataIds;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("R2メタ情報キャッシュ一覧取得エラー:", error);
      }
      return [];
    }
  }
}
```

### ステップ 4: API エンドポイントの作成（20 分）

**ファイル**: `src/app/api/estat-api/metainfo-cache/save/route.ts` (新規作成)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { EstatMetaInfoR2Service } from "@/lib/estat-api/meta-info/EstatMetaInfoR2Service";
import { EstatMetaInfoResponse } from "@/lib/estat-api";
import {
  SaveMetaInfoCacheRequest,
  SaveMetaInfoCacheResponse,
} from "@/types/models/r2/estat-metainfo-cache";

/**
 * e-StatメタインフォメーションをR2に保存するAPIエンドポイント
 * POST /api/estat-api/metainfo-cache/save
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SaveMetaInfoCacheResponse>> {
  try {
    // リクエストボディのパース
    const body: SaveMetaInfoCacheRequest = await request.json();

    // バリデーション
    if (!body.statsDataId || !body.metaInfoResponse) {
      return NextResponse.json(
        {
          success: false,
          message: "必須パラメータが不足しています",
          error: "statsDataId, metaInfoResponse は必須です",
        },
        { status: 400 }
      );
    }

    // 環境変数からR2バケットを取得
    // @ts-expect-error - Cloudflare環境でのみ利用可能
    const env = process.env as unknown as { METAINFO_BUCKET: R2Bucket };

    if (!env.METAINFO_BUCKET) {
      return NextResponse.json(
        {
          success: false,
          message: "R2バケットが設定されていません",
          error: "環境変数METAINFO_BUCKETが見つかりません",
        },
        { status: 500 }
      );
    }

    // R2に保存
    const result = await EstatMetaInfoR2Service.saveMetaInfo(
      env,
      body.statsDataId,
      body.metaInfoResponse as EstatMetaInfoResponse
    );

    return NextResponse.json({
      success: true,
      message: `メタ情報を保存しました（${Math.round(result.size / 1024)}KB）`,
      data: {
        key: result.key,
        size: result.size,
        statsDataId: body.statsDataId,
      },
    });
  } catch (error) {
    console.error("R2メタ情報保存エラー:", error);

    return NextResponse.json(
      {
        success: false,
        message: "メタ情報の保存に失敗しました",
        error: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    );
  }
}
```

### ステップ 5: フロントエンドの更新（30 分）

**ファイル**: `src/components/pages/EstatMetainfoPage/EstatMetainfoPage.tsx`

#### 5.1 必要なインポートを追加

```typescript
// 既存のインポートの下に追加
import { RefreshCw, BarChart3, Save, Check, AlertCircle } from "lucide-react";
import { SaveMetaInfoCacheRequest } from "@/types/models/r2/estat-metainfo-cache";
```

#### 5.2 状態管理を追加

```typescript
// 既存の状態管理の下に追加
/** R2保存状態管理 */
const [isSaving, setIsSaving] = useState(false);
const [saveStatus, setSaveStatus] = useState<{
  type: "success" | "error" | null;
  message: string;
}>({ type: null, message: "" });
```

#### 5.3 R2 保存関数を追加

```typescript
/**
 * メタ情報をR2に保存する
 */
const handleSaveToR2 = async () => {
  if (!metaInfo || !currentStatsId) {
    setSaveStatus({
      type: "error",
      message: "保存するメタ情報がありません",
    });
    return;
  }

  setIsSaving(true);
  setSaveStatus({ type: null, message: "" });

  try {
    const requestBody: SaveMetaInfoCacheRequest = {
      statsDataId: currentStatsId,
      metaInfoResponse: metaInfo,
    };

    const response = await fetch("/api/estat-api/metainfo-cache/save", {
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
      // 3秒後にステータスメッセージを消す
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
      message: "保存中にエラーが発生しました",
    });
  } finally {
    setIsSaving(false);
  }
};
```

#### 5.4 UI ボタンを追加

```typescript
// EstatAPIPageLayoutのactionsプロップを更新
actions={
  currentStatsId && (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={loading}
        className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        {loading ? "更新中..." : "更新"}
      </button>
      <button
        type="button"
        onClick={handleSaveToR2}
        disabled={loading || isSaving || !metaInfo}
        className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border border-blue-200 bg-blue-500 text-white shadow-xs hover:bg-blue-600 focus:outline-hidden focus:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSaving ? (
          <RefreshCw className="w-3 h-3 animate-spin" />
        ) : saveStatus.type === "success" ? (
          <Check className="w-3 h-3" />
        ) : (
          <Save className="w-3 h-3" />
        )}
        {isSaving ? "保存中..." : "R2に保存"}
      </button>
    </div>
  )
}
```

#### 5.5 ステータスメッセージ表示を追加

```typescript
// EstatMetaInfoFetcherの前に追加
{/* ステータスメッセージ表示 */}
{saveStatus.type && (
  <div
    className={`mb-4 p-3 rounded-lg border ${
      saveStatus.type === "success"
        ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
        : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
    }`}
  >
    <div className="flex items-center gap-2">
      {saveStatus.type === "success" ? (
        <Check className="w-4 h-4" />
      ) : (
        <AlertCircle className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">{saveStatus.message}</span>
    </div>
  </div>
)}
```

---

## 4. 詳細実装

### 4.1 キャッシュ戦略

#### キャッシュキー設計

```
estat_metainfo/{statsDataId}/meta.json
```

**例**:
```
estat_metainfo/0003448738/meta.json
```

#### メタデータ設計

R2オブジェクトのカスタムメタデータ:

```typescript
{
  "stats-data-id": "0003448738",
  "saved-at": "2025-10-18T12:00:00Z",
  "table-title": "人口推計"
}
```

### 4.2 エラーハンドリング

#### クライアント側エラーハンドリング

```typescript
try {
  const response = await fetch("/api/estat-api/metainfo-cache/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "保存に失敗しました");
  }

  // 成功処理
} catch (error) {
  console.error("R2保存エラー:", error);
  setSaveStatus({
    type: "error",
    message: error instanceof Error ? error.message : "不明なエラー",
  });
}
```

#### サーバー側エラーハンドリング

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    if (!body.statsDataId) {
      return NextResponse.json(
        { success: false, error: "statsDataIdは必須です" },
        { status: 400 }
      );
    }

    // R2保存処理
    const result = await EstatMetaInfoR2Service.saveMetaInfo(/*...*/);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("R2保存エラー:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 5. テスト方法

### 5.1 ローカル開発環境での動作確認

#### ステップ 1: R2 バケットの作成

```bash
# 本番用バケット作成
npx wrangler r2 bucket create stats47-metainfo

# プレビュー用バケット作成
npx wrangler r2 bucket create stats47-metainfo-preview
```

#### ステップ 2: 開発サーバー起動

```bash
npm run dev:mock
```

#### ステップ 3: ページアクセス

1. ブラウザで`http://localhost:3000/estat-api/meta-info`にアクセス
2. 統計表IDを入力してメタ情報を取得
3. データが表示されたら「R2に保存」ボタンをクリック
4. 保存成功メッセージが表示されることを確認

#### ステップ 4: R2 の確認

```bash
# 保存されたファイルの確認
npx wrangler r2 object list stats47-metainfo --prefix="estat_metainfo/"

# 特定ファイルの内容確認
npx wrangler r2 object get stats47-metainfo/estat_metainfo/0003448738/meta.json
```

### 5.2 保存データの検証

#### JSON構造検証

```json
{
  "version": "1.0",
  "stats_data_id": "0003448738",
  "saved_at": "2025-10-18T12:34:56.789Z",
  "meta_info_response": {
    "GET_META_INFO": {
      "METADATA_INF": {
        "TABLE_INF": {
          "@id": "0003448738",
          "TITLE": { "$": "人口推計" },
          "STAT_NAME": { "$": "人口推計" },
          "GOV_ORG": { "$": "総務省" }
        }
      }
    }
  },
  "summary": {
    "table_title": "人口推計",
    "stat_name": "人口推計",
    "organization": "総務省",
    "survey_date": "2023100000",
    "updated_date": "2024-01-15"
  }
}
```

**確認項目**:

- ✅ `version`が"1.0"
- ✅ `stats_data_id`が正しく設定されている
- ✅ `meta_info_response`にe-Stat APIレスポンス全体が含まれている
- ✅ `summary`に検索用サマリー情報が含まれている
- ✅ `saved_at`がISO 8601形式

---

## 6. トラブルシューティング

### 問題 1: R2 バケットが見つからない

**エラーメッセージ**:

```
環境変数METAINFO_BUCKETが見つかりません
```

**原因**:

- `wrangler.toml`にMETAINFO_BUCKET設定が追加されていない
- バケット名が間違っている

**解決方法**:

```bash
# バケットの存在確認
npx wrangler r2 bucket list

# wrangler.tomlを確認
cat wrangler.toml | grep -A 3 "METAINFO_BUCKET"
```

### 問題 2: メタ情報が保存されない

**原因**:
- APIレスポンス構造が不正
- 統計表情報が見つからない

**解決方法**:

```typescript
// デバッグログを追加
console.log("metaInfo:", JSON.stringify(metaInfo, null, 2));
console.log("tableInf:", metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF);

// バリデーション追加
if (!metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF) {
  throw new Error("統計表情報が見つかりません");
}
```

### 問題 3: TypeScript エラーが出る

**エラー例**:

```
Cannot find module '@/types/models/r2/estat-metainfo-cache'
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

- [x] R2バケット作成（`stats47-metainfo`, `stats47-metainfo-preview`）
- [x] `wrangler.toml`にMETAINFO_BUCKET設定追加
- [x] 型定義ファイル作成（`src/types/models/r2/estat-metainfo-cache.ts`）
- [x] R2サービスクラス作成（`src/lib/estat-api/meta-info/EstatMetaInfoR2Service.ts`）
- [x] APIエンドポイント作成（`src/app/api/estat-api/metainfo-cache/save/route.ts`）
- [x] フロントエンド更新（`EstatMetainfoPage.tsx`）
- [ ] ローカル環境でテスト
- [ ] 保存されたJSONの検証
- [ ] 本番環境にデプロイ
- [ ] 本番環境でテスト

### 推定作業時間

| タスク                 | 時間          |
| ---------------------- | ------------- |
| R2バケット設定         | 5分           |
| 型定義作成             | 10分          |
| R2サービス作成         | 30分          |
| APIエンドポイント作成  | 20分          |
| フロントエンド更新     | 30分          |
| テスト                 | 30分          |
| **合計**               | **約2時間**   |

### 次のステップ（オプション）

1. **R2からの読み取り機能追加**
   - `GET /api/estat-api/metainfo-cache/get` エンドポイント
   - キャッシュヒット時はR2から取得、ミス時はe-Stat APIから取得

2. **キャッシュ管理画面**
   - 保存済みメタ情報一覧表示
   - 削除機能
   - 更新日時表示

3. **自動キャッシュ更新**
   - Cron Triggerで定期的にメタ情報を更新

4. **TTL設定**
   - キャッシュの有効期限設定（例: 24時間）
   - 期限切れデータの自動削除

---

**文書バージョン**: 1.0
**最終更新日**: 2025-10-18
**作成者**: Claude Code
