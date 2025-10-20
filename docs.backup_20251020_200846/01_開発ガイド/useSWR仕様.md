---
title: useSWR 仕様・ガイドライン
created: 2025-01-18
updated: 2025-01-18
tags:
  - development-guide
  - useswr-specification
  - data-fetching
  - performance
---

# useSWR 仕様・ガイドライン

## 概要

このドキュメントでは、Stats47 プロジェクトにおける useSWR の共通的な仕様とガイドラインを定義します。プロジェクト全体で一貫したデータフェッチング戦略を実装するための標準化されたアプローチを提供します。

## 基本方針

### 1. 統一されたデータフェッチング戦略

- **手動状態管理の排除**: `useState` + `fetch` の組み合わせを避ける
- **自動キャッシュ管理**: useSWR による重複リクエストの自動排除
- **統一されたエラーハンドリング**: プロジェクト全体での一貫したエラー処理
- **パフォーマンス最適化**: バックグラウンド更新とメモ化の活用

### 2. 責務の分離

- **データ取得**: useSWR カスタムフック
- **キャッシュキー生成**: 専用のユーティリティ関数
- **フェッチャー関数**: API 呼び出しの抽象化
- **UI 表示**: コンポーネントは表示のみに集中

## アーキテクチャパターン

### 1. 標準的なファイル構成

```
src/
├── lib/
│   └── [domain]/
│       ├── cache-key.ts      # キャッシュキー生成
│       ├── swr-fetcher.ts    # SWR用フェッチャー
│       └── index.ts          # エクスポート
├── hooks/
│   └── [domain]/
│       └── use[Domain]Data.ts # カスタムフック
└── components/
    └── [domain]/
        └── [Component].tsx   # UIコンポーネント
```

### 2. キャッシュキー生成パターン

**ファイル**: `src/lib/[domain]/cache-key.ts`

```typescript
/**
 * キャッシュキー生成の標準パターン
 */

export function generateCacheKey(params: DomainParams | null): string | null {
  // 1. 必須パラメータの検証
  if (!params || !isValidParams(params)) {
    return null; // リクエストを無効化
  }

  // 2. パラメータの正規化
  const normalized = normalizeParams(params);

  // 3. 一意のキーを生成
  const queryParams = new URLSearchParams();
  Object.keys(normalized)
    .sort() // キーの順序を統一
    .forEach((key) => {
      const value = normalized[key as keyof DomainParams];
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, String(value));
      }
    });

  return `/api/[domain]?${queryParams.toString()}`;
}

/**
 * パラメータの正規化
 */
function normalizeParams(params: DomainParams): DomainParams {
  const normalized: DomainParams = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      normalized[key as keyof DomainParams] = value;
    }
  });

  return normalized;
}

/**
 * パラメータの検証
 */
function isValidParams(params: DomainParams): boolean {
  // 必須フィールドの検証
  return !!(params.requiredField1 && params.requiredField2);
}
```

### 3. SWR フェッチャーパターン

**ファイル**: `src/lib/[domain]/swr-fetcher.ts`

```typescript
/**
 * SWR用フェッチャーの標準パターン
 */

import { parseCacheKey } from "./cache-key";
import { DomainFetcher } from "./fetcher";
import { DomainFormatter } from "./formatter";

export async function domainFetcher(cacheKey: string): Promise<DomainResponse> {
  console.log("🔵 SWR Fetcher: 開始", cacheKey);

  // 1. キャッシュキーからパラメータを復元
  const params = parseCacheKey(cacheKey);
  if (!params) {
    throw new Error(`Invalid cache key: ${cacheKey}`);
  }

  // 2. 適切なフェッチャーメソッドを選択
  let response;
  if (params.searchType === "keyword") {
    response = await DomainFetcher.searchByKeyword(params);
  } else if (params.searchType === "id") {
    response = await DomainFetcher.searchById(params);
  } else {
    response = await DomainFetcher.fetchDefault(params);
  }

  // 3. 結果をフォーマット
  const formattedResult = DomainFormatter.format(response);

  console.log("✅ SWR Fetcher: 完了", {
    dataCount: formattedResult.items?.length || 0,
  });

  return formattedResult;
}

/**
 * エラーハンドリング付きフェッチャー
 */
export async function domainFetcherWithErrorHandling(
  cacheKey: string
): Promise<DomainResponse> {
  try {
    return await domainFetcher(cacheKey);
  } catch (error) {
    console.error("❌ Domain Fetcher Error:", error);
    throw new Error(`データの取得に失敗しました: ${error.message}`);
  }
}
```

### 4. カスタムフックパターン

**ファイル**: `src/hooks/[domain]/use[Domain]Data.ts`

```typescript
/**
 * useSWRカスタムフックの標準パターン
 */

import useSWR from "swr";
import { generateCacheKey } from "@/lib/[domain]/cache-key";
import { domainFetcherWithErrorHandling } from "@/lib/[domain]/swr-fetcher";

interface UseDomainDataReturn {
  data: DomainResponse | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useDomainData(
  params: DomainParams | null
): UseDomainDataReturn {
  // 1. キャッシュキー生成
  const cacheKey = useMemo(() => {
    return params ? generateCacheKey(params) : null;
  }, [params]);

  // 2. useSWRでデータ取得
  const { data, error, isLoading, mutate } = useSWR<DomainResponse>(
    cacheKey,
    domainFetcherWithErrorHandling,
    {
      revalidateOnFocus: false, // データは頻繁に変わらない
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5分間キャッシュ
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      onSuccess: (data) => {
        console.log("✅ useDomainData: データ取得成功", data);
      },
      onError: (error) => {
        console.error("❌ useDomainData: データ取得エラー", error);
      },
    }
  );

  // 3. クライアントサイド処理（必要に応じて）
  const processedData = useMemo(() => {
    if (!data) return null;

    // フィルタ・ソート処理
    return processData(data);
  }, [data, filters, sortConditions]);

  return {
    data: processedData,
    error: error,
    isLoading,
    refetch: mutate,
  };
}
```

## 設定仕様

### 1. 標準 SWR 設定

```typescript
const standardSWRConfig = {
  revalidateOnFocus: false, // フォーカス時の再検証は無効
  revalidateOnReconnect: true, // ネットワーク再接続時は再取得
  dedupingInterval: 300000, // 5分間は同じリクエストを共有
  errorRetryCount: 3, // エラー時は3回までリトライ
  errorRetryInterval: 5000, // リトライ間隔は5秒
};
```

### 2. ドメイン別設定

```typescript
// 頻繁に更新されるデータ
const realtimeConfig = {
  ...standardSWRConfig,
  revalidateOnFocus: true,
  dedupingInterval: 30000, // 30秒
};

// 静的データ
const staticConfig = {
  ...standardSWRConfig,
  revalidateOnFocus: false,
  dedupingInterval: 3600000, // 1時間
};
```

## キャッシュ戦略

### 1. キャッシュキー設計原則

- **一意性**: 同じ条件では必ず同じキーを生成
- **正規化**: 不要なパラメータは除去
- **ソート**: キーの順序を統一して一意性を保証
- **無効化**: 無効な条件では null を返してリクエストを無効化

### 2. キャッシュの効果

- **重複排除**: 同じ条件での重複リクエストを自動排除
- **メモリ効率**: useSWR による効率的なメモリ管理
- **バックグラウンド更新**: ネットワーク再接続時の自動再取得

## エラーハンドリング

### 1. 統一されたエラー処理

```typescript
// フェッチャー関数でのエラーハンドリング
export async function fetcherWithErrorHandling(cacheKey: string) {
  try {
    return await fetcher(cacheKey);
  } catch (error) {
    console.error("❌ Fetcher Error:", error);

    // ユーザーフレンドリーなエラーメッセージ
    if (error.status === 404) {
      throw new Error("データが見つかりません");
    } else if (error.status === 500) {
      throw new Error("サーバーエラーが発生しました");
    } else {
      throw new Error(`データの取得に失敗しました: ${error.message}`);
    }
  }
}
```

### 2. コンポーネントでのエラー表示

```typescript
// エラー状態の表示パターン
if (error) {
  return (
    <div className="error-container">
      <p className="error-message">{error.message}</p>
      <button onClick={refetch}>再試行</button>
    </div>
  );
}
```

## パフォーマンス最適化

### 1. useMemo の活用

```typescript
// 重い計算処理の最適化
const processedData = useMemo(() => {
  if (!data) return null;

  return data.items
    .filter((item) => item.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name));
}, [data, filters, sortConditions]);
```

### 2. 条件付きレンダリング

```typescript
// 不要な再レンダリングを防止
const shouldRender = useMemo(() => {
  return !isLoading && !error && data;
}, [isLoading, error, data]);

if (!shouldRender) {
  return <LoadingSpinner />;
}
```

## ベストプラクティス

### 1. 命名規則

- **キャッシュキー関数**: `generate[Domain]CacheKey`
- **フェッチャー関数**: `[domain]Fetcher`
- **カスタムフック**: `use[Domain]Data`
- **型定義**: `[Domain]Params`, `[Domain]Response`

### 2. ファイル構成

- **責務の分離**: 各ファイルは単一の責務を持つ
- **再利用性**: 他のドメインでも利用可能な汎用的な設計
- **保守性**: 変更時の影響範囲を最小限に

### 3. テスト戦略

```typescript
// キャッシュキー生成のテスト
describe("generateCacheKey", () => {
  it("should generate unique keys for different params", () => {
    const key1 = generateCacheKey({ id: "1", type: "A" });
    const key2 = generateCacheKey({ id: "2", type: "A" });
    expect(key1).not.toBe(key2);
  });

  it("should return null for invalid params", () => {
    const key = generateCacheKey(null);
    expect(key).toBeNull();
  });
});
```

## 移行ガイド

### 1. 既存コードからの移行手順

1. **キャッシュキー生成関数を作成**
2. **SWR フェッチャー関数を作成**
3. **カスタムフックを作成**
4. **コンポーネントを更新**
5. **テストを追加**

### 2. 下位互換性の確保

- **既存 API**: 従来のフェッチャー関数は引き続き使用可能
- **型定義**: 既存の型定義は変更なし
- **コンポーネント**: 段階的な移行が可能

## トラブルシューティング

### 1. よくある問題

#### キャッシュが更新されない

```typescript
// デバッグログを確認
console.log("Cache Key:", generateCacheKey(params));
```

#### エラーが発生する

```typescript
// エラーログを確認
const { data, error } = useSWR(cacheKey, fetcher, {
  onError: (error) => {
    console.error("SWR Error:", error);
  },
});
```

#### データが取得されない

```typescript
// パラメータが正しく設定されているか確認
const cacheKey = useMemo(() => {
  if (!params || !params.requiredField) {
    return null; // リクエストを無効化
  }
  return generateCacheKey(params);
}, [params]);
```

## 関連ドキュメント

- [データフェッチング戦略](./data-fetching-strategy.md)
- [e-Stat API ドメイン概要](../02_domain/estat-api/specifications/)
- [useSWR 公式ドキュメント](https://swr.vercel.app/)

---

**最終更新**: 2025 年 1 月 18 日  
**バージョン**: 1.0.0  
**作成者**: Stats47 開発チーム
