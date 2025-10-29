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
- [R2ストレージガイド](03_R2ストレージガイド.md) - R2の使い方
- [コーディング規約](../../02_コーディング規約/) - コーディングスタイル

## 更新履歴

- **v3.0.0** (2025-10-29): 実装済み機能のみに絞り込み、実用的な開発ガイドに再構成
- **v2.0.0** (2025-10-26): 初版作成
# Area（地域管理）ドメイン技術設計

## 概要

Area（地域管理）ドメインは、stats47 プロジェクトの支援ドメインの一つで、日本の行政区画の階層構造を管理します。都道府県・市区町村の階層構造、地域コードの検証と変換、地域検索・フィルタリングなど、行政区画に関するすべての情報と操作を担当します。

### ドメインの責務と目的

1. **都道府県データの管理**: 47 都道府県の基本情報の提供
2. **市区町村データの管理**: 全国約 1,900 の市区町村情報の提供
3. **地域階層の管理**: 国 → 都道府県 → 市区町村の親子関係の管理（設計中）
4. **地域コードの検証**: 地域コードの妥当性検証と正規化
5. **地域検索機能**: 名前・コードによる地域検索
6. **地域ブロック管理**: 北海道・東北、関東・中部などの地域区分管理

### ビジネス価値

- **行政区画の一元管理**: 日本の行政区画データを統一的に管理し、一貫性を保つ
- **階層構造の活用**: 都道府県 → 市区町村の階層関係を活用した効率的なデータ検索
- **地域コードの統一**: 異なるデータソース間の地域コードマッピング管理
- **地域検索の最適化**: 効率的な地域検索・フィルタリング機能
- **統計データの地域軸**: 全ての統計データは地域コードで分類される
- **ユーザビリティ向上**: 地域名での検索・フィルタリングが可能
- **データ整合性**: 単一データソースにより地域データの一貫性を保証

### 実装状況

**実装済み**:
- 都道府県・市区町村の基本CRUD操作
- 地域コード検証・変換ユーティリティ
- R2ストレージからのデータ取得（フォールバック付き）
- 地域ブロック管理

**未実装**:
- 階層構造管理（親子関係、階層パス取得）
- AreaHierarchyエンティティ
- 高度な検索機能（複合条件、地域タイプ別）

## アーキテクチャ

### サービスレイヤー構成

```
src/features/area/
├── repositories/
│   └── area-repository.ts        # データアクセス層（純粋な関数）
├── services/
│   ├── prefecture-service.ts     # 都道府県サービス（純粋な関数）
│   └── city-service.ts           # 市区町村サービス（純粋な関数）
├── utils/
│   └── code-converter.ts         # コード変換ユーティリティ
├── validators/
│   └── code-validator.ts         # コード検証
├── types/
│   └── index.ts                  # 型定義
└── index.ts                      # 統一エクスポート
```

### データソース

```
data/mock/
├── prefectures.json      # 都道府県マスターデータ (4KB)
└── cities.json           # 市区町村マスターデータ (220KB)
```

**特徴**:

- 静的 JSON ファイルとして管理
- ビルド時に最適化・圧縮
- オフライン対応可能
- 高速アクセス

## 設計判断

### 値オブジェクトとして設計

**理由**:

- **不変性**: 行政区画コードと名称は変更されない
- **識別性不要**: `prefCode` や `municipalityCode` 自体が識別子
- **比較可能**: コードによる等価性判定が可能
- **軽量**: シンプルなデータ構造

**エンティティが不適切な理由**:

- ライフサイクル管理が不要
- 履歴管理が不要
- 複雑な状態遷移がない

### R2 ストレージ（静的 JSON）を採用

**理由**:

- **更新頻度が低い**: 年に数回の市町村合併程度
- **全件取得が主**: ドロップダウン選択、コード → 名称変換
- **シンプル**: JSON 形式でそのまま利用可能
- **パフォーマンス**: CDN 配信で高速アクセス
- **コスト**: 読み取り無料

**D1 を採用しない理由**:

- 複雑な SQL クエリは不要
- JavaScript 配列の `filter` で十分高速
- データベース管理のオーバーヘッドが不要

## データソースとストレージ

### データ配置戦略

```
data/mock/area/          # ローカル開発用
├── prefectures.json     # 都道府県マスターデータ
└── cities.json          # 市区町村マスターデータ

Cloudflare R2 (本番)     # 本番環境
└── area/
    ├── prefectures.json # 都道府県マスターデータ（公開URL）
    └── cities.json      # 市区町村マスターデータ（公開URL）
```

### データアクセス戦略

**サーバーサイド**: R2公開URL → ローカルフォールバック（開発環境のみ）
**クライアントサイド**: API Route経由 (`/api/area/prefectures`, `/api/area/cities`)

### データ構造

#### prefectures.json（配列形式）

```json
[
  {
    "prefCode": "01000",
    "prefName": "北海道"
  },
  {
    "prefCode": "02000",
    "prefName": "青森県"
  }
]
```

**フィールド定義**:
- `prefCode` (string): 都道府県コード（5桁、末尾000）
- `prefName` (string): 都道府県名

#### cities.json（配列形式）

```json
[
  {
    "cityCode": "01101",
    "cityName": "札幌市中央区",
    "prefCode": "01000",
    "level": "3"
  },
  {
    "cityCode": "01202",
    "cityName": "函館市",
    "prefCode": "01000",
    "level": "2"
  }
]
```

**フィールド定義**:
- `cityCode` (string): 市区町村コード（5桁）
- `cityName` (string): 市区町村名
- `prefCode` (string): 都道府県コード（5桁）
- `level` (string): 地域レベル（"2": 市、"3": 区）

### 地域コード体系

#### 都道府県コード
- **形式**: `XX000`（XX = 01-47）
- **例**: `01000`（北海道）、`13000`（東京都）

#### 市区町村コード
- **形式**: `XXXXX`（5桁）
- **上位2桁**: 都道府県コード
- **下位3桁**: 市区町村識別コード
  - `000`: 都道府県全体
  - `100`: 政令指定都市
  - `101-199`: 政令指定都市の区
  - `201-999`: 一般市町村

**例**:
- `13000`: 東京都
- `13101`: 千代田区
- `01100`: 札幌市
- `01101`: 札幌市中央区

## リポジトリ実装方針

```typescript
// 静的 JSON からの読み込み
export class AreaRepository {
  private prefecturesCache: Prefecture[] | null = null;
  private municipalitiesCache: Municipality[] | null = null;

  async getPrefectures(): Promise<Prefecture[]> {
    if (!this.prefecturesCache) {
      // ビルド時: 静的 import
      const data = await import("@/config/areas/prefectures.json");
      this.prefecturesCache = data.prefectures.map(Prefecture.fromJson);
    }
    return this.prefecturesCache;
  }

  async getMunicipalities(): Promise<Municipality[]> {
    if (!this.municipalitiesCache) {
      const data = await import("@/data/mock/cities.json");
      this.municipalitiesCache = data.map(Municipality.fromJson);
    }
    return this.municipalitiesCache;
  }

  async searchByName(query: string): Promise<Area[]> {
    const all = await this.getAllAreas();
    return all.filter((area) => area.name.includes(query));
  }
}
```

## モデル設計

### 実装済みエンティティ

#### Prefecture（都道府県）

都道府県の基本情報を管理するインターフェース。

```typescript
interface Prefecture {
  /** 都道府県コード（5桁） */
  prefCode: string;
  /** 都道府県名 */
  prefName: string;
}
```

**実装ファイル**: `src/features/area/types/index.ts`

#### City（市区町村）

市区町村の基本情報を管理するインターフェース。

```typescript
interface City {
  /** 市区町村コード（5桁） */
  cityCode: string;
  /** 市区町村名 */
  cityName: string;
  /** 都道府県コード（5桁） */
  prefCode: string;
  /** 地域レベル（"2": 都道府県・政令指定都市, "3": 市区町村） */
  level: string;
}
```

**実装ファイル**: `src/features/area/types/index.ts`

#### Region（地域ブロック）

地域ブロックの定義。

```typescript
interface Region {
  /** 地域ブロックコード */
  regionCode: string;
  /** 地域ブロック名 */
  regionName: string;
  /** 都道府県リスト */
  prefectures: string[];
}
```

**実装ファイル**: `src/features/area/types/index.ts`

### 設計中のエンティティ（未実装）

#### AreaHierarchy（地域階層）

地域の階層構造を管理するエンティティ（将来実装予定）。

```typescript
interface AreaHierarchy {
  /** 地域コード */
  areaCode: string;
  /** 地域名 */
  areaName: string;
  /** 地域タイプ */
  areaType: AreaType;
  /** 地域階層レベル */
  areaLevel: AreaLevel;
  /** 親地域コード */
  parentCode?: string;
  /** 子地域コードリスト */
  children?: string[];
}
```

**目的**: 親子関係、階層パス取得など高度な階層管理機能

### 型定義

#### AreaType

```typescript
type AreaType = "national" | "prefecture" | "city";
```

**実装状況**: ✅ 実装済み

#### AreaValidationResult

地域コード検証結果。

```typescript
interface AreaValidationResult {
  isValid: boolean;
  areaType?: AreaType;
  message: string;
  details?: {
    code: string;
    expectedFormat: string;
    actualFormat: string;
  };
}
```

**実装状況**: ✅ 実装済み

## 階層構造設計（将来実装）

### 基本階層

```
日本（00000）
├── 北海道（01000）
│   ├── 札幌市（01100）
│   │   ├── 中央区（01101）
│   │   ├── 北区（01102）
│   │   └── ...
│   ├── 函館市（01202）
│   └── ...
├── 青森県（02000）
└── ...
```

### 階層レベル定義

| レベル | 名称     | コード形式 | 例    |
| ------ | -------- | ---------- | ----- |
| 0      | 国       | 00000      | 00000 |
| 1      | 都道府県 | XX000      | 13000 |
| 2      | 市区町村 | XXXXX      | 13101 |

### 親子関係の設計方針

- **都道府県 → 市区町村**: `prefCode`による関連
- **政令指定都市 → 区**: コード体系による判定（100番台）
- **検索最適化**: インデックス構造の活用

## 実装パターン

### 基本的な使い方

```typescript
import {
  listPrefectures,
  findPrefectureByCode,
  listMunicipalities,
  findMunicipalityByCode,
} from "@/features/area";

// 都道府県を取得
const tokyo = await findPrefectureByCode("13");
console.log(tokyo?.prefName); // "東京都"

// 市区町村を取得
const chiyoda = await findMunicipalityByCode("13101");
console.log(chiyoda?.name); // "千代田区"

// 都道府県リストを取得
const prefectures = await listPrefectures();
console.log(prefectures.length); // 47

// 市区町村リストを取得
const municipalities = await listMunicipalities();
console.log(municipalities.length); // 約1900
```

### 地域検索

```typescript
import {
  searchPrefectures,
  searchMunicipalities,
  listPrefecturesByRegion,
  listMunicipalitiesByType,
} from "@/features/area";

// 都道府県検索
const prefectures = await searchPrefectures("東京");
console.log(prefectures); // 東京都を含む都道府県

// 市区町村検索
const municipalities = await searchMunicipalities("千代田");
console.log(municipalities); // 千代田を含む市区町村

// 地域ブロック別都道府県取得
const kantoPrefectures = await listPrefecturesByRegion("kanto");
console.log(kantoPrefectures.length); // 関東地方の都道府県数

// タイプ別市区町村取得
const cities = await listMunicipalitiesByType("city");
console.log(cities.length); // 市の数
```

### 階層構造の構築

```typescript
import {
  listMunicipalitiesByPrefecture,
  lookupPrefectureName,
  lookupMunicipalityName,
} from "@/features/area";

// 都道府県内の市区町村取得
const tokyoMunicipalities = await listMunicipalitiesByPrefecture("13");
console.log(tokyoMunicipalities.length); // 東京都内の市区町村数

// 都道府県名の取得
const prefName = await lookupPrefectureName("13");
console.log(prefName); // "東京都"

// 市区町村名の取得
const muniName = await lookupMunicipalityName("13101");
console.log(muniName); // "千代田区"
```

## ドメインサービス

### AreaRepository（データアクセス層）

地域データの基本操作を実装するリポジトリ層。

- **責務**: 外部データソース（JSON、R2）からのデータ取得、キャッシュ管理
- **主要関数**:
  - `fetchPrefectures()`: 都道府県データの取得
  - `fetchMunicipalities()`: 市区町村データの取得
  - `findPrefectureByCode(code)`: 都道府県コードによる検索
  - `findMunicipalityByCode(code)`: 市区町村コードによる検索
  - `clearAreaCache()`: キャッシュのクリア
  - `buildAreaCacheStatus()`: キャッシュ状態の構築

### PrefectureService（都道府県サービス）

都道府県データの操作を実装するサービス層。

- **責務**: 都道府県データの取得、検索、地域ブロック管理
- **主要関数**:
  - `listPrefectures()`: 全都道府県の取得
  - `findPrefectureByCode(code)`: 都道府県コードによる検索
  - `searchPrefectures(query)`: 都道府県名による検索
  - `listPrefecturesByRegion(regionKey)`: 地域ブロック別取得
  - `listRegions()`: 地域ブロック一覧の取得
  - `lookupPrefectureName(prefCode)`: 都道府県名の取得

### MunicipalityService（市区町村サービス）

市区町村データの操作を実装するサービス層。

- **責務**: 市区町村データの取得、検索、階層管理
- **主要関数**:
  - `listMunicipalities()`: 全市区町村の取得
  - `listMunicipalitiesByPrefecture(prefCode)`: 都道府県別市区町村取得
  - `findMunicipalityByCode(code)`: 市区町村コードによる検索
  - `searchMunicipalities(query)`: 市区町村名による検索
  - `listMunicipalitiesByType(type)`: タイプ別市区町村取得
  - `lookupMunicipalityName(code)`: 市区町村名の取得
  - `buildMunicipalityStats()`: 統計情報の構築

## リポジトリ

### AreaRepository

地域データの永続化を抽象化するリポジトリインターフェース。

- **責務**: 都道府県・市区町村データの CRUD 操作、階層構造の検索、地域コードによる検索
- **主要メソッド**:
  - `findPrefectureByCode(code)`: 都道府県コードによる検索
  - `findMunicipalityByCode(code)`: 市区町村コードによる検索
  - `findMunicipalitiesByPrefecture(prefectureCode)`: 都道府県配下の市区町村取得
  - `search(query, level)`: 地域名による検索
  - `findAllPrefectures()` / `findAllMunicipalities()`: 全データの取得
  - `save(area)` / `delete(code)`: データの保存・削除

## パフォーマンス

### メモリ使用量

| データ       | 件数  | サイズ/件 | 合計サイズ |
| ------------ | ----- | --------- | ---------- |
| 都道府県     | 47    | 100B      | 4.7KB      |
| 市区町村     | 1,913 | 150B      | 287KB      |
| 地域ブロック | 5     | 200B      | 1KB        |
| **合計**     | -     | -         | **293KB**  |

### 圧縮後サイズ

- **gzip 圧縮**: 約 60KB
- **brotli 圧縮**: 約 50KB

### アクセスパターン

1. **都道府県**: 頻繁（ランキング、ダッシュボード）
2. **市区町村**: 中頻度（詳細表示、検索）
3. **地域ブロック**: 低頻度（フィルタリング）

## GeoShape統合とR2キャッシング戦略

### 背景と課題

#### 現状の問題点
1. **デプロイサイズの肥大化**
   - 都道府県47個 + 市区町村データ（47×2ファイル）= 約95ファイル
   - TopoJSON合計サイズ: 40-50MB
   - Next.jsビルドに含めるとビルド時間・デプロイサイズが増大

2. **外部URL依存のリスク**
   - GeoShape公式サーバーのレスポンス速度: 500-800ms
   - 可用性への依存
   - 帯域幅の制約

### 解決策：ハイブリッドアプローチ

```
┌─────────────────────────────────────────┐
│ レベル1: 静的データ（ビルド含む）      │
│ → src/data/geoshape/prefectures/       │
│   - jp_pref.topojson（都道府県境界）    │
│   サイズ: ~2-3MB                        │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ レベル2: 動的データ（R2自動キャッシュ）│
│ → Cloudflare R2 + CDN                   │
│   - 市区町村データ（オンデマンド）      │
│   - 初回: 外部URL → 自動でR2に保存     │
│   - 2回目以降: R2から高速配信          │
│   サイズ: ~40-50MB                      │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ レベル3: フォールバック                 │
│ → 外部URL（GeoShape公式）               │
│   - R2障害時の自動フォールバック        │
└─────────────────────────────────────────┘
```

### パフォーマンス指標

| 指標                   | 目標     | 測定方法        |
| ---------------------- | -------- | --------------- |
| 初回ロード（外部URL）  | < 1000ms | Performance API |
| 2回目以降（R2）        | < 100ms  | Performance API |
| キャッシュヒット率     | > 95%    | ログ分析        |
| R2レスポンス時間       | < 50ms   | CDN Analytics   |

### コスト試算（Cloudflare R2）

| 項目                     | 料金       | 想定使用量 | 月額コスト     |
| ------------------------ | ---------- | ---------- | -------------- |
| ストレージ               | $0.015/GB  | 0.05 GB    | $0.00075       |
| Class A操作（書き込み）  | $4.50/百万 | 100回      | $0.00045       |
| Class B操作（読み取り）  | $0.36/百万 | 10,000回   | $0.0036        |
| データ転送（外向き）     | 無料       | -          | $0             |
| **合計**                 |            |            | **< $0.01/月** |

### 行政区域データ管理

#### ディレクトリ構造
```
src/data/geoshape/
├── prefectures/
│   ├── jp_pref.topojson          # 都道府県境界（TopoJSON）
│   └── jp_pref.geojson           # 都道府県境界（GeoJSON）
├── municipalities/               # 市区町村（R2キャッシュ）
│   ├── 01_city.topojson
│   ├── 13_city.topojson
│   └── ...
└── metadata/
    ├── version.json              # バージョン情報
    └── area-code-mapping.json    # 地域コードマッピング
```

#### データバージョン管理
- **メジャーバージョン**: 年単位（例: 2024）
- **マイナーバージョン**: 月単位（例: 03）
- **パッチバージョン**: 日単位（例: 31）

### e-Stat地域コードとの統合

地域コードマッピングにより、e-Stat API の地域コードと GeoShape の ID を相互変換可能。

## ベストプラクティス

### 1. データ整合性の維持

- 地域コードの一意性保証
- 階層関係の整合性チェック
- マッピング情報の適切な管理
- e-Stat APIとのコード互換性維持

### 2. パフォーマンス最適化

- R2キャッシュの効果的活用
- Next.js Fetch APIキャッシュの活用（24時間）
- クライアント・サーバー両方での最適化
- フォールバック戦略の実装

### 3. データソース統合

- R2 → ローカルモックの段階的フォールバック
- 開発環境と本番環境の透過的な切り替え
- エラーハンドリングとログ出力

## 他ドメインとの関係性

### 依存するドメイン

なし（最も基盤的なドメイン）

### 依存されるドメイン

- **Ranking ドメイン**: 都道府県・市区町村別ランキングで使用
- **EstatAPI ドメイン**: e-Stat API から取得したデータの地域コード解決
- **Visualization ドメイン**: ダッシュボードの地域フィルタリング、コロプレス地図での地域表示
- **Geoshape ドメイン**: 地理データの管理（TopoJSON）
- **DataIntegration ドメイン**: 地域データの取得と統合

## 将来の拡張計画

### フェーズ1（完了）
- ✅ 基本的な都道府県・市区町村CRUD
- ✅ 地域コード検証ユーティリティ
- ✅ R2ストレージ統合
- ✅ 地域ブロック管理

### フェーズ2（計画中）
- ⬜ AreaHierarchyエンティティの実装
- ⬜ 階層パス取得機能
- ⬜ 親子関係ナビゲーション
- ⬜ 高度な検索機能（複合条件）

### フェーズ3（検討中）
- ⬜ 市町村合併履歴管理
- ⬜ 時系列での地域コード変換
- ⬜ GeoShapeとの完全統合

## 関連ドキュメント

### 技術設計
- [DDD ドメイン分類](../../01_システム概要/04_DDDドメイン分類.md#支援ドメイン)
- [システムアーキテクチャ](../../01_システム概要/システムアーキテクチャ.md)
- [R2 ストレージガイド](03_R2ストレージガイド.md)

### 開発ガイド
- [Areaドメイン開発ガイド](area.md)

## 更新履歴

- **v3.0.0** (2025-10-29): 技術設計と開発ガイドを分離、実装状況を明確化
- **v2.0.0** (2025-10-26): GeoShape統合戦略とR2キャッシング設計を追加
- **v1.0.0** (2025-01-16): 初版作成
