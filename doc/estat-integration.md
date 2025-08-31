# e-Stat API 統合ガイド

このドキュメントでは、地域統計ダッシュボードでの e-Stat API 統合について詳しく説明します。

## 概要

e-Stat API は、日本の政府統計データにアクセスするための公式 API です。このプロジェクトでは、型安全性と開発体験を向上させるために`@estat/`パッケージを使用しています。

## @estat/パッケージの概要

### 利用可能なパッケージ

- **@estat/types**: e-Stat API の完全な型定義
- **@estat/client**: e-Stat API クライアントライブラリ
- **@estat/utils**: データ処理と変換ユーティリティ

### インストール

```bash
npm install @estat/types @estat/client @estat/utils
```

## 型定義の利用

### 基本的な型のインポート

```typescript
import {
  EstatResponse,
  EstatParameter,
  EstatCatalogResponse,
  EstatListResponse,
} from "@estat/types";
```

### API レスポンスの型安全な処理

```typescript
// 統計データ取得APIのレスポンス処理
const handleEstatResponse = (response: EstatResponse) => {
  try {
    // 型安全なデータアクセス
    const statisticalData = response.GET_STATS_DATA.STATISTICAL_DATA;
    const dataInf = statisticalData.DATA_INF;

    if (dataInf && Array.isArray(dataInf)) {
      return dataInf.map((item) => ({
        value: item.VALUE,
        area: item.AREA,
        time: item.TIME,
        category: item.CAT01,
      }));
    }

    return [];
  } catch (error) {
    console.error("e-Statレスポンス処理エラー:", error);
    return [];
  }
};
```

### パラメータの型安全な設定

```typescript
import { EstatParameter } from "@estat/types";

const createEstatParameter = (): EstatParameter => ({
  appId: process.env.NEXT_PUBLIC_ESTAT_APP_ID || "",
  lang: "J",
  statsDataId: "0003109941",
  metaGetFlg: "Y",
  cntGetFlg: "N",
  startPosition: 1,
  limit: 100,
  searchWord: "",
  searchOption: 1,
  tabIndex: 1,
  categoryTabIndex: 1,
  dataType: 1,
  dataFormat: "json",
});
```

## API クライアントの利用

### 基本的な API 呼び出し

```typescript
import { EstatClient } from "@estat/client";

const estatClient = new EstatClient({
  appId: process.env.NEXT_PUBLIC_ESTAT_APP_ID || "",
});

// 統計データの取得
const fetchStatisticalData = async (statsDataId: string) => {
  try {
    const response = await estatClient.getStatsData({
      statsDataId,
      metaGetFlg: "Y",
      cntGetFlg: "N",
    });

    return response;
  } catch (error) {
    console.error("e-Stat API呼び出しエラー:", error);
    throw error;
  }
};
```

### カタログ情報の取得

```typescript
// 統計データのカタログ情報を取得
const fetchCatalogInfo = async (statsDataId: string) => {
  try {
    const response = await estatClient.getStatsDataCatalog({
      statsDataId,
      lang: "J",
    });

    return response;
  } catch (error) {
    console.error("カタログ情報取得エラー:", error);
    throw error;
  }
};
```

### メタデータの取得

```typescript
// 統計データのメタデータを取得
const fetchMetaData = async (statsDataId: string) => {
  try {
    const response = await estatClient.getStatsDataMeta({
      statsDataId,
      lang: "J",
    });

    return response;
  } catch (error) {
    console.error("メタデータ取得エラー:", error);
    throw error;
  }
};
```

## データ処理ユーティリティ

### データの変換と整形

```typescript
import {
  transformEstatData,
  formatEstatValue,
  parseEstatTime,
} from "@estat/utils";

// e-Statデータの変換
const processEstatData = (rawData: any[]) => {
  return rawData.map((item) => ({
    ...item,
    value: formatEstatValue(item.VALUE),
    time: parseEstatTime(item.TIME),
    area: transformEstatData(item.AREA),
  }));
};
```

### 地域コードの変換

```typescript
import { convertAreaCode, getAreaName } from "@estat/utils";

// 地域コードから地域名への変換
const getRegionInfo = (areaCode: string) => {
  const areaName = getAreaName(areaCode);
  const convertedCode = convertAreaCode(areaCode);

  return {
    code: convertedCode,
    name: areaName,
    originalCode: areaCode,
  };
};
```

## エラーハンドリング

### 型安全なエラー処理

```typescript
import { EstatError, EstatErrorCode } from "@estat/types";

const handleEstatError = (error: unknown) => {
  if (error instanceof EstatError) {
    switch (error.code) {
      case EstatErrorCode.INVALID_APP_ID:
        return "アプリケーションIDが無効です";
      case EstatErrorCode.INVALID_STATS_DATA_ID:
        return "統計データIDが無効です";
      case EstatErrorCode.API_LIMIT_EXCEEDED:
        return "API利用制限に達しました";
      default:
        return `e-Stat APIエラー: ${error.message}`;
    }
  }

  return "予期しないエラーが発生しました";
};
```

## 実装例

### EstatDataFetcher コンポーネントでの利用

```typescript
import React, { useEffect, useState } from "react";
import { EstatClient } from "@estat/client";
import { EstatResponse, EstatParameter } from "@estat/types";

interface EstatDataFetcherProps {
  regionCode: string;
  onDataUpdate: (data: any) => void;
  onLoadingChange: (loading: boolean) => void;
  children: (
    data: any,
    loading: boolean,
    error: string | null
  ) => React.ReactNode;
}

export const EstatDataFetcher: React.FC<EstatDataFetcherProps> = ({
  regionCode,
  onDataUpdate,
  onLoadingChange,
  children,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!regionCode) return;

      setLoading(true);
      setError(null);
      onLoadingChange(true);

      try {
        const estatClient = new EstatClient({
          appId: process.env.NEXT_PUBLIC_ESTAT_APP_ID || "",
        });

        const parameter: EstatParameter = {
          appId: process.env.NEXT_PUBLIC_ESTAT_APP_ID || "",
          lang: "J",
          statsDataId: "0003109941", // 人口統計の例
          metaGetFlg: "Y",
          cntGetFlg: "N",
          startPosition: 1,
          limit: 100,
        };

        const response: EstatResponse = await estatClient.getStatsData(
          parameter
        );

        // 型安全なデータ処理
        const processedData = processEstatResponse(response, regionCode);

        setData(processedData);
        onDataUpdate(processedData);
      } catch (err) {
        const errorMessage = handleEstatError(err);
        setError(errorMessage);
        console.error("e-Statデータ取得エラー:", err);
      } finally {
        setLoading(false);
        onLoadingChange(false);
      }
    };

    fetchData();
  }, [regionCode, onDataUpdate, onLoadingChange]);

  return <>{children(data, loading, error)}</>;
};

// レスポンス処理関数
const processEstatResponse = (response: EstatResponse, regionCode: string) => {
  try {
    const statisticalData = response.GET_STATS_DATA.STATISTICAL_DATA;
    const dataInf = statisticalData.DATA_INF;

    if (!dataInf || !Array.isArray(dataInf)) {
      return null;
    }

    // 指定された地域のデータをフィルタリング
    const regionData = dataInf.filter(
      (item) => item.AREA && item.AREA.includes(regionCode)
    );

    return regionData.map((item) => ({
      value: item.VALUE,
      area: item.AREA,
      time: item.TIME,
      category: item.CAT01,
      unit: item.UNIT,
    }));
  } catch (error) {
    console.error("レスポンス処理エラー:", error);
    return null;
  }
};
```

## 環境変数の設定

### 必要な環境変数

```env
# e-Stat API設定
NEXT_PUBLIC_ESTAT_APP_ID=your-estat-api-app-id
```

### e-Stat API キーの取得

1. [e-Stat API](https://www.e-stat.go.jp/api/)にアクセス
2. アカウントを作成またはログイン
3. アプリケーション ID を申請
4. 承認後に API キーを取得

## ベストプラクティス

### 1. 型安全性の確保

- 常に`@estat/types`から型をインポート
- 型ガードを使用してランタイムエラーを防止
- 適切なエラーハンドリングを実装

### 2. パフォーマンスの最適化

- 必要最小限のデータのみを取得
- キャッシュ戦略の実装
- 非同期処理の適切な管理

### 3. エラーハンドリング

- ユーザーフレンドリーなエラーメッセージ
- ログ出力によるデバッグ支援
- フォールバックデータの提供

### 4. セキュリティ

- API キーの適切な管理
- 環境変数での機密情報保護
- 入力値の検証とサニタイゼーション

## トラブルシューティング

### よくある問題と解決方法

#### 1. 型定義が見つからない

```bash
# パッケージの再インストール
npm install @estat/types @estat/client @estat/utils

# TypeScriptの再起動
# VS Codeの場合: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

#### 2. API 呼び出しエラー

- API キーが正しく設定されているか確認
- ネットワーク接続を確認
- e-Stat API の利用制限を確認

#### 3. データが取得できない

- 統計データ ID が正しいか確認
- パラメータの設定を確認
- API レスポンスの構造を確認

## 参考資料

- [e-Stat API 公式ドキュメント](https://www.e-stat.go.jp/api/)
- [@estat/パッケージドキュメント](https://github.com/estat-org/estat-packages)
- [TypeScript 公式ドキュメント](https://www.typescriptlang.org/docs/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## 更新履歴

- **2024-01-XX**: 初版作成
- **2024-01-XX**: @estat/パッケージ統合の追加
- **2024-01-XX**: 実装例とベストプラクティスの追加
- **2024-01-XX**: データ変換ロジックの詳細説明を追加
  - EstatDataTransformer クラスの説明
  - item_name 抽出ロジックの詳細
  - データ変換例と使用例の追加
