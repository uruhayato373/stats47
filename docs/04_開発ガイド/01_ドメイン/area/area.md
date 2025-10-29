# Area（地域）ドメイン開発ガイド

## 概要

このドキュメントは、Areaドメインの**実装済み機能**の使い方を説明する実践的な開発ガイドです。設計の詳細は[技術設計ドキュメント](../../../01_技術設計/03_ドメイン設計/01_area.md)を参照してください。

## クイックスタート

### 基本的なインポート

```typescript
import {
  // 都道府県サービス
  listPrefectures,
  findPrefectureByCode,
  // 市区町村サービス
  listMunicipalities,
  listMunicipalitiesByPrefecture,
  findMunicipalityByCode,
  // コード変換ユーティリティ
  validateAreaCode,
  normalizeAreaCode,
  extractPrefectureCode,
} from "@/features/area";
```

### 型定義のインポート

```typescript
import type { Prefecture, City, Region, AreaType } from "@/features/area";
```

## 実装済み機能

### ✅ 都道府県管理

#### 全都道府県を取得

```typescript
const prefectures = await listPrefectures();
console.log(prefectures.length); // 47
console.log(prefectures[0]);
// { prefCode: "01000", prefName: "北海道" }
```

#### 都道府県コードで検索

```typescript
// 5桁コードで検索
const tokyo = await findPrefectureByCode("13000");
console.log(tokyo?.prefName); // "東京都"

// 2桁コードでも検索可能（自動正規化）
const hokkaido = await findPrefectureByCode("01");
console.log(hokkaido?.prefName); // "北海道"
```

#### 地域ブロック管理

```typescript
import { listRegions, getRegionKeyFromPrefectureCode } from "@/features/area";

// 地域ブロック一覧を取得
const regions = await listRegions();
console.log(regions);
// {
//   "hokkaido-tohoku": ["01000", "02000", ...],
//   "kanto": ["08000", "09000", ...],
//   ...
// }

// 都道府県コードから地域ブロックキーを取得
const regionKey = getRegionKeyFromPrefectureCode("13000");
console.log(regionKey); // "kanto"
```

### ✅ 市区町村管理

#### 全市区町村を取得

```typescript
const cities = await listMunicipalities();
console.log(cities.length); // 約1900
```

#### 市区町村コードで検索

```typescript
const chiyoda = await findMunicipalityByCode("13101");
console.log(chiyoda);
// {
//   cityCode: "13101",
//   cityName: "千代田区",
//   prefCode: "13000",
//   level: "3"
// }
```

#### 都道府県別の市区町村を取得

```typescript
// 東京都の全市区町村を取得
const tokyoCities = await listMunicipalitiesByPrefecture("13000");
console.log(tokyoCities.length); // 62

// 市区町村名を表示
tokyoCities.forEach((city) => {
  console.log(city.cityName);
});
// "千代田区"
// "中央区"
// ...
```

#### 市区町村名で検索

```typescript
import { searchMunicipalities } from "@/features/area";

// 部分一致検索
const results = await searchMunicipalities("中央");
console.log(results.length);
// "中央区"が含まれる市区町村のリスト
```

#### 特定都道府県内で市区町村名を検索

```typescript
import { searchMunicipalitiesInPrefecture } from "@/features/area";

// 東京都内で"中央"を検索
const results = await searchMunicipalitiesInPrefecture("13000", "中央");
console.log(results);
// [{ cityCode: "13102", cityName: "中央区", ... }]
```

### ✅ コード検証・変換

#### 地域コードを検証

```typescript
import { validateAreaCode, validatePrefectureCode } from "@/features/area";

// 地域コードの包括的な検証
const result = validateAreaCode("13000");
console.log(result);
// {
//   isValid: true,
//   areaType: "prefecture",
//   message: "Valid prefecture code"
// }

// 無効なコード
const invalid = validateAreaCode("99999");
console.log(invalid.isValid); // false
console.log(invalid.message); // "Prefecture code must be between 01 and 47"
```

#### 地域コードを正規化

```typescript
import { normalizeAreaCode, normalizePrefectureCode } from "@/features/area";

// 都道府県コードを5桁に正規化
const normalized = normalizePrefectureCode("13");
console.log(normalized); // "13000"

// 地域コードを正規化（2桁→5桁）
const code = normalizeAreaCode("01");
console.log(code); // "01000"
```

#### 都道府県コードを抽出

```typescript
import { extractPrefectureCode } from "@/features/area";

// 市区町村コードから都道府県コードを抽出
const prefCode = extractPrefectureCode("13101");
console.log(prefCode); // "13"

// 都道府県コードから抽出（2桁を返す）
const prefCode2 = extractPrefectureCode("13000");
console.log(prefCode2); // "13"
```

#### 政令指定都市判定

```typescript
import { isDesignatedCityWard, getDesignatedCityCode } from "@/features/area";

// 政令指定都市の区かどうか判定
const isWard = isDesignatedCityWard("13101");
console.log(isWard); // false（東京特別区のため）

const isSapporoWard = isDesignatedCityWard("01101");
console.log(isSapporoWard); // true（札幌市中央区）

// 政令指定都市のコードを取得
const cityCode = getDesignatedCityCode("01101");
console.log(cityCode); // "01100"（札幌市）
```

## 実践的なユースケース

### ユースケース1: ドロップダウンで都道府県選択

```typescript
// Server Component
import { listPrefectures } from "@/features/area";

export default async function PrefectureSelector() {
  const prefectures = await listPrefectures();

  return (
    <select name="prefecture">
      <option value="">都道府県を選択</option>
      {prefectures.map((pref) => (
        <option key={pref.prefCode} value={pref.prefCode}>
          {pref.prefName}
        </option>
      ))}
    </select>
  );
}
```

### ユースケース2: 都道府県選択に応じて市区町村を表示

```typescript
// Client Component
"use client";

import { useEffect, useState } from "react";
import { listMunicipalitiesByPrefecture, type City } from "@/features/area";

export function CitySelector({ prefCode }: { prefCode: string }) {
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    if (!prefCode) return;

    listMunicipalitiesByPrefecture(prefCode).then(setCities);
  }, [prefCode]);

  return (
    <select name="city">
      <option value="">市区町村を選択</option>
      {cities.map((city) => (
        <option key={city.cityCode} value={city.cityCode}>
          {city.cityName}
        </option>
      ))}
    </select>
  );
}
```

### ユースケース3: APIルートで地域データを提供

```typescript
// app/api/areas/prefectures/route.ts
import { NextResponse } from "next/server";
import { listPrefectures } from "@/features/area";

export async function GET() {
  try {
    const prefectures = await listPrefectures();
    return NextResponse.json(prefectures);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch prefectures" },
      { status: 500 }
    );
  }
}
```

### ユースケース4: 地域コードの妥当性チェック

```typescript
import { validateAreaCode } from "@/features/area";

function processAreaData(areaCode: string) {
  const validation = validateAreaCode(areaCode);

  if (!validation.isValid) {
    throw new Error(`Invalid area code: ${validation.message}`);
  }

  // areaTypeに応じた処理
  switch (validation.areaType) {
    case "prefecture":
      // 都道府県の処理
      break;
    case "city":
      // 市区町村の処理
      break;
  }
}
```

### ユースケース5: 統計情報の構築

```typescript
import { buildMunicipalityStats } from "@/features/area";

// 市区町村の統計情報を取得
const stats = await buildMunicipalityStats();
console.log(stats);
// {
//   total: 1913,
//   byPrefecture: {
//     "01000": 179,  // 北海道の市区町村数
//     "13000": 62,   // 東京都の市区町村数
//     ...
//   }
// }
```

## データアクセス戦略

### サーバーサイドとクライアントサイド

#### サーバーサイド（Server Components, API Routes）

```typescript
// R2公開URLから直接取得（開発環境ではローカルフォールバック）
import { fetchPrefectures } from "@/features/area/repositories/area-repository";

const prefectures = await fetchPrefectures();
// → R2から取得（失敗時は開発環境のみローカルファイル）
```

#### クライアントサイド（Client Components）

```typescript
// APIルート経由で取得
const response = await fetch("/api/area/prefectures");
const prefectures = await response.json();
```

### キャッシュ戦略

**サーバーサイド**: Next.js Fetch APIキャッシュ（24時間）
**クライアントサイド**: SWRまたはTanStack Queryでキャッシュ

```typescript
// SWRを使用したクライアントサイドキャッシュ
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function usePrefectures() {
  const { data, error, isLoading } = useSWR("/api/area/prefectures", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000, // 1時間
  });

  return {
    prefectures: data,
    isLoading,
    error,
  };
}
```

## エラーハンドリング

### DataSourceError

```typescript
import { DataSourceError } from "@/features/area";

try {
  const prefectures = await listPrefectures();
} catch (error) {
  if (error instanceof DataSourceError) {
    console.error("データソースエラー:", error.message);
    console.error("ソース:", error.context?.source);
  }
}
```

### 市区町村が見つからない場合

```typescript
try {
  const city = await findMunicipalityByCode("99999");
} catch (error) {
  console.error("市区町村が見つかりません:", error);
  // エラーハンドリング
}
```

## パフォーマンス最適化

### メモリ使用量

| データ   | 件数 | サイズ/件 | 合計サイズ |
| -------- | ---- | --------- | ---------- |
| 都道府県 | 47   | 100B      | 4.7KB      |
| 市区町村 | 1913 | 150B      | 287KB      |
| **合計** | -    | -         | **293KB**  |

### アクセスパターンと最適化

1. **頻繁なアクセス（都道府県）**
   - Next.js Fetch APIキャッシュ（24時間）
   - SWRでクライアントサイドキャッシュ

2. **中頻度アクセス（市区町村）**
   - 都道府県選択後にオンデマンドで取得
   - 選択された都道府県のみ取得

3. **低頻度アクセス（地域ブロック）**
   - 静的データとしてインメモリキャッシュ

## トラブルシューティング

### R2接続エラー

**症状**: `Failed to fetch prefectures from R2: 500`

**原因**: R2_PUBLIC_URL環境変数が未設定、またはR2が利用不可

**解決策**:
1. `.env`ファイルで`R2_PUBLIC_URL`を設定
2. 開発環境では自動的にローカルファイルにフォールバック

### 市区町村が見つからない

**症状**: `City not found: 99999`

**原因**: 存在しない市区町村コード

**解決策**:
1. コードの妥当性を事前に`validateAreaCode()`で確認
2. try-catchでエラーハンドリング

### クライアントサイドで直接fetchできない

**症状**: CORS エラー

**原因**: クライアントサイドからR2公開URLへ直接アクセス

**解決策**: APIルート (`/api/area/prefectures`) 経由でアクセス

## 実装されていない機能

以下の機能は設計されていますが、まだ実装されていません。必要な場合は[技術設計ドキュメント](../../../01_技術設計/03_ドメイン設計/01_area.md#将来の拡張計画)を参照して実装してください。

- ❌ 階層構造管理（親地域・子地域の取得）
- ❌ 階層パス取得（国 → 都道府県 → 市区町村）
- ❌ AreaHierarchyエンティティ
- ❌ 完全名称生成（都道府県名を含む市区町村名）
- ❌ 地域タイプ別の高度な検索

## 関連ドキュメント

- [技術設計ドキュメント](../../../01_技術設計/03_ドメイン設計/01_area.md) - 設計思想、アーキテクチャ、将来の拡張計画
- [R2ストレージガイド](../../03_インフラ/データベース/03_R2ストレージガイド.md) - R2の使い方
- [コーディング規約](../../02_コーディング規約/) - コーディングスタイル

## 更新履歴

- **v3.0.0** (2025-10-29): 実装済み機能のみに絞り込み、実用的な開発ガイドに再構成
- **v2.0.0** (2025-10-26): 初版作成
