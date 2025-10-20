---
title: Geoshapeデータソース仕様書
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/visualization
  - specifications
  - geoshape
  - topojson
  - geojson
  - administrative-boundaries
---

# Geoshape データソース仕様書

## 概要

国立情報学研究所（NII）が提供する Geoshape リポジトリの歴史的行政区域データセットを、stats47 プロジェクトの地図可視化機能に統合するためのデータソース仕様を定義します。高品質な行政区域ポリゴンデータを活用し、都道府県・市区町村レベルのコロプレス地図を実現します。

## Geoshape データセットについて

### データソース情報

- **提供元**: 国立情報学研究所 人文学オープンデータ共同利用センター
- **URL**: https://geoshape.ex.nii.ac.jp/city/choropleth/
- **データ形式**: GeoJSON/TopoJSON
- **対象範囲**: 日本全国 47 都道府県、約 1,900 市区町村
- **時系列**: 1889 年以前～ 2023 年（歴史的データを含む）
- **最終更新**: 2024 年 3 月 31 日

### データの特徴

1. **2 階層構造**: 都道府県レベルと市区町村レベルの行政区域データ
2. **政令指定都市対応**: 政令指定都市統合版も提供
3. **高品質データ**: 複数の出典データを統合した精度の高いポリゴンデータ
4. **標準地域コード**: e-Stat 互換の地域コード体系
5. **歴史的データ**: 過去の行政区域変遷データを含む

## 利用可能なデータタイプ

### 1. 都道府県レベルデータ

```typescript
interface PrefectureData {
  id: string; // コロプレスID（例: "jp_pref"）
  title: string; // タイトル（例: "日本 都道府県"）
  polygonCount: number; // ポリゴン件数（47）
  format: "topojson" | "geojson";
  url: string; // データURL
}
```

**利用可能なデータ**:

- `jp_pref`: 日本全国都道府県（47 都道府県）

### 2. 市区町村レベルデータ

```typescript
interface MunicipalityData {
  id: string; // コロプレスID（例: "13_city"）
  title: string; // タイトル（例: "東京都 市区町村"）
  polygonCount: number; // ポリゴン件数
  prefectureCode: string; // 都道府県コード（例: "13"）
  format: "topojson" | "geojson";
  url: string; // データURL
}
```

**利用可能なデータ**:

- `01_city` ～ `47_city`: 各都道府県の市区町村データ
- `jp_city`: 日本全国市区町村（統合版）

### 3. 政令指定都市統合版

```typescript
interface MergedMunicipalityData {
  id: string; // コロプレスID（例: "13_city_dc"）
  title: string; // タイトル（例: "東京都 市区町村（政令指定都市統合版）"）
  polygonCount: number; // ポリゴン件数
  prefectureCode: string; // 都道府県コード
  format: "topojson" | "geojson";
  url: string; // データURL
}
```

**利用可能なデータ**:

- `01_city_dc` ～ `47_city_dc`: 各都道府県の政令指定都市統合版
- `jp_city_dc`: 日本全国市区町村（政令指定都市統合版）

## データ形式の比較

### TopoJSON vs GeoJSON

| 項目               | TopoJSON     | GeoJSON      |
| ------------------ | ------------ | ------------ |
| **ファイルサイズ** | 約 70%削減   | 基準         |
| **読み込み速度**   | 高速         | 標準         |
| **変換処理**       | 必要         | 不要         |
| **互換性**         | 変換後は標準 | 標準         |
| **推奨用途**       | 本番環境     | 開発・テスト |

### TopoJSON の利点

1. **ファイルサイズ削減**: 座標の重複を排除し、約 70%のサイズ削減
2. **読み込み速度向上**: ネットワーク転送時間の短縮
3. **メモリ効率**: ブラウザでのメモリ使用量削減
4. **キャッシュ効率**: CDN でのキャッシュ効率向上

## データ取得方法

### 1. 直接ダウンロード

```typescript
// 都道府県データの取得
const prefectureData = await fetch(
  "https://geoshape.ex.nii.ac.jp/city/choropleth/jp_pref.topojson"
);

// 市区町村データの取得（東京都の例）
const municipalityData = await fetch(
  "https://geoshape.ex.nii.ac.jp/city/choropleth/13_city.topojson"
);
```

### 2. CDN 経由での取得

```typescript
// CDN URLの構築
const buildCDNUrl = (
  dataId: string,
  format: "topojson" | "geojson" = "topojson"
) => {
  const baseUrl = "https://geoshape.ex.nii.ac.jp/city/choropleth";
  return `${baseUrl}/${dataId}.${format}`;
};

// 使用例
const url = buildCDNUrl("jp_pref", "topojson");
```

### 3. 段階的読み込み

```typescript
// 必要な都道府県データのみ読み込み
const loadPrefectureData = async (prefectureCode: string) => {
  const dataId = `${prefectureCode.padStart(2, "0")}_city`;
  const url = buildCDNUrl(dataId, "topojson");

  try {
    const response = await fetch(url);
    const topojsonData = await response.json();
    return topojsonData;
  } catch (error) {
    console.error(
      `Failed to load prefecture data for ${prefectureCode}:`,
      error
    );
    throw error;
  }
};
```

## キャッシュ戦略

### 1. ブラウザキャッシュ

```typescript
// Service Workerでのキャッシュ管理
const CACHE_NAME = "geoshape-data-v1";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7日

const cacheGeoshapeData = async (url: string, data: any) => {
  const cache = await caches.open(CACHE_NAME);
  const response = new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "max-age=604800", // 7日
    },
  });
  await cache.put(url, response);
};
```

### 2. ローカルストレージ

```typescript
// ローカルストレージでのキャッシュ
const CACHE_PREFIX = "geoshape_";

const saveToLocalStorage = (key: string, data: any) => {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const cacheData = {
    data,
    timestamp: Date.now(),
    version: "2024.03.31",
  };
  localStorage.setItem(cacheKey, JSON.stringify(cacheData));
};

const loadFromLocalStorage = (key: string) => {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const cached = localStorage.getItem(cacheKey);

  if (!cached) return null;

  const cacheData = JSON.parse(cached);
  const isExpired = Date.now() - cacheData.timestamp > CACHE_DURATION;

  return isExpired ? null : cacheData.data;
};
```

### 3. 更新チェック

```typescript
// バージョン情報の確認
const checkDataVersion = async () => {
  try {
    const response = await fetch(
      "https://geoshape.ex.nii.ac.jp/city/choropleth/version.json"
    );
    const versionInfo = await response.json();

    const localVersion = localStorage.getItem("geoshape_version");
    if (localVersion !== versionInfo.version) {
      // データ更新が必要
      await clearCache();
      localStorage.setItem("geoshape_version", versionInfo.version);
    }
  } catch (error) {
    console.warn("Failed to check data version:", error);
  }
};
```

## ライセンスと利用規約

### 出典データのライセンス

1. **国土数値情報「行政区域データ」** (1920 年～ 2023 年)

   - 提供元: 国土交通省
   - ライセンス: 出典明記が必要

2. **筑波大学「行政界変遷データベース」** (1889 年～ 1968 年)

   - 提供元: 筑波大学
   - ライセンス: CC BY 4.0

3. **『日本歴史地名大系』行政地名変遷データセット** (1889 年以前)

   - 提供元: 平凡社
   - ライセンス: 各出典のライセンスに従う

4. **『Geoshape 市区町村 ID データセット』**
   - 提供元: CODH
   - ライセンス: CC BY 4.0

### 利用時の出典表記

```typescript
// 出典情報の定義
const GEOSHAPE_ATTRIBUTION = {
  title: "Geoshape 歴史的行政区域データセット",
  sources: [
    "国土数値情報「行政区域データ」（国土交通省）",
    "筑波大学「行政界変遷データベース」",
    "『日本歴史地名大系』行政地名変遷データセット（平凡社）",
    "『Geoshape市区町村IDデータセット』（CODH）",
  ],
  provider: "国立情報学研究所 人文学オープンデータ共同利用センター",
  url: "https://geoshape.ex.nii.ac.jp/city/choropleth/",
  license: "CC BY 4.0",
  version: "2024.03.31",
};
```

## データ品質と出典情報

### データ品質指標

```typescript
interface DataQualityMetrics {
  accuracy: "high" | "medium" | "low"; // 精度
  completeness: number; // 完全性（%）
  consistency: "high" | "medium" | "low"; // 一貫性
  timeliness: string; // 最新性
  sourceCount: number; // 出典数
}
```

### 品質保証

1. **精度**: 複数の出典データを統合し、相互検証を実施
2. **完全性**: 日本全国の行政区域を網羅
3. **一貫性**: 統一された座標系（JGD2000）と地域コード体系
4. **最新性**: 定期的な更新（年 1 回程度）
5. **検証**: 学術機関による品質検証

## e-Stat 地域コードとの対応関係

### 地域コード体系

```typescript
interface AreaCodeMapping {
  estatCode: string; // e-Stat地域コード（例: "13000"）
  geoshapeId: string; // Geoshape ID（例: "13_001"）
  name: string; // 地域名（例: "東京都"）
  level: "prefecture" | "municipality"; // レベル
  parentCode?: string; // 親地域コード
}
```

### コード変換マッピング

```typescript
// 地域コード変換テーブル
const AREA_CODE_MAPPING: Record<string, AreaCodeMapping> = {
  // 都道府県レベル
  "13000": {
    estatCode: "13000",
    geoshapeId: "13",
    name: "東京都",
    level: "prefecture",
  },

  // 市区町村レベル
  "13101": {
    estatCode: "13101",
    geoshapeId: "13_001",
    name: "千代田区",
    level: "municipality",
    parentCode: "13000",
  },
};
```

### 変換ユーティリティ

```typescript
// e-Stat地域コードからGeoshape IDへの変換
export const convertEstatToGeoshape = (estatCode: string): string => {
  const mapping = AREA_CODE_MAPPING[estatCode];
  return mapping?.geoshapeId || estatCode;
};

// Geoshape IDからe-Stat地域コードへの変換
export const convertGeoshapeToEstat = (geoshapeId: string): string => {
  const mapping = Object.values(AREA_CODE_MAPPING).find(
    (m) => m.geoshapeId === geoshapeId
  );
  return mapping?.estatCode || geoshapeId;
};
```

## データ取得 API 仕様

### GeoshapeDataService

```typescript
export class GeoshapeDataService {
  private static readonly BASE_URL =
    "https://geoshape.ex.nii.ac.jp/city/choropleth";
  private static readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7日

  // 都道府県データの取得
  static async getPrefectureData(): Promise<TopoJSON.Topology> {
    const cacheKey = "jp_pref";
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const url = `${this.BASE_URL}/jp_pref.topojson`;
    const data = await this.fetchTopoJSON(url);
    this.saveToCache(cacheKey, data);
    return data;
  }

  // 市区町村データの取得
  static async getMunicipalityData(
    prefectureCode: string
  ): Promise<TopoJSON.Topology> {
    const cacheKey = `${prefectureCode}_city`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const paddedCode = prefectureCode.padStart(2, "0");
    const url = `${this.BASE_URL}/${paddedCode}_city.topojson`;
    const data = await this.fetchTopoJSON(url);
    this.saveToCache(cacheKey, data);
    return data;
  }

  // 政令指定都市統合版の取得
  static async getMergedMunicipalityData(
    prefectureCode: string
  ): Promise<TopoJSON.Topology> {
    const cacheKey = `${prefectureCode}_city_dc`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const paddedCode = prefectureCode.padStart(2, "0");
    const url = `${this.BASE_URL}/${paddedCode}_city_dc.topojson`;
    const data = await this.fetchTopoJSON(url);
    this.saveToCache(cacheKey, data);
    return data;
  }

  private static async fetchTopoJSON(url: string): Promise<TopoJSON.Topology> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch TopoJSON from ${url}: ${response.statusText}`
      );
    }
    return response.json();
  }

  private static getFromCache(key: string): TopoJSON.Topology | null {
    const cached = localStorage.getItem(`geoshape_${key}`);
    if (!cached) return null;

    const cacheData = JSON.parse(cached);
    const isExpired = Date.now() - cacheData.timestamp > this.CACHE_DURATION;
    return isExpired ? null : cacheData.data;
  }

  private static saveToCache(key: string, data: TopoJSON.Topology): void {
    const cacheData = {
      data,
      timestamp: Date.now(),
      version: "2024.03.31",
    };
    localStorage.setItem(`geoshape_${key}`, JSON.stringify(cacheData));
  }
}
```

## エラーハンドリング

### エラー種別

```typescript
enum GeoshapeErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  PARSE_ERROR = "PARSE_ERROR",
  CACHE_ERROR = "CACHE_ERROR",
  VERSION_ERROR = "VERSION_ERROR",
  DATA_NOT_FOUND = "DATA_NOT_FOUND",
}

interface GeoshapeError extends Error {
  type: GeoshapeErrorType;
  url?: string;
  dataId?: string;
  retryable: boolean;
}
```

### エラーハンドリング実装

```typescript
export const handleGeoshapeError = (error: GeoshapeError): void => {
  switch (error.type) {
    case GeoshapeErrorType.NETWORK_ERROR:
      console.error("Network error while fetching Geoshape data:", error.url);
      // リトライロジック
      break;

    case GeoshapeErrorType.PARSE_ERROR:
      console.error("Failed to parse TopoJSON data:", error.url);
      // フォールバック処理
      break;

    case GeoshapeErrorType.CACHE_ERROR:
      console.warn("Cache error, falling back to network:", error.dataId);
      // キャッシュクリア
      break;

    case GeoshapeErrorType.DATA_NOT_FOUND:
      console.error("Geoshape data not found:", error.dataId);
      // デフォルトデータの使用
      break;

    default:
      console.error("Unknown Geoshape error:", error);
  }
};
```

## まとめ

Geoshape データソースの統合により、以下の効果が期待されます：

1. **高品質な行政区域データ**: NII が整備した精度の高いポリゴンデータ
2. **e-Stat 統合**: 統計データと地理データのシームレスな連携
3. **パフォーマンス向上**: TopoJSON によるデータサイズ削減とキャッシュ戦略
4. **歴史的分析**: 過去の行政区域変遷の可視化
5. **標準化**: 複数の出典データを統合した標準的な地理データ

この仕様に基づいて、stats47 プロジェクトに Geoshape データを統合し、高品質なコロプレス地図機能を実現します。

---

**作成日**: 2025-10-16  
**最終更新日**: 2025-10-16  
**バージョン**: 1.0.0  
**承認者**: 開発チーム  
**ステータス**: 承認済み
