# Area 実装ガイド

## 概要

Area ドメインの実装ガイドです。既存の環境設定（`NEXT_PUBLIC_ENV`）を活用した mock 環境での R2 データ管理、リポジトリパターン、データ準備方法を詳細に記載します。

### 実装目的

- **値オブジェクト設計**: 地域データを不変オブジェクトとして管理
- **R2 ストレージ採用**: 静的データの効率的な配信
- **環境別データソース**: mock 環境ではローカルファイル、本番環境では R2

### 設計方針

- **環境判断**: `NEXT_PUBLIC_ENV=mock`で判断（追加の環境変数不要）
- **フォルダ構成**: `data/mock/r2/areas/`に mock データを配置
- **リポジトリパターン**: インターフェースで抽象化、環境別実装

## フォルダ構成

### ソースコード構成

```
src/lib/area/
├── model/
│   ├── Prefecture.ts          # 都道府県値オブジェクト
│   ├── Municipality.ts        # 市区町村値オブジェクト
│   ├── AreaCode.ts            # 地域コード値オブジェクト
│   └── AreaLevel.ts           # 地域レベル値オブジェクト
├── repository/
│   ├── AreaRepository.ts      # リポジトリインターフェース
│   ├── MockAreaRepository.ts  # Mock 実装
│   └── R2AreaRepository.ts    # R2 実装
├── service/
│   └── AreaService.ts         # ドメインサービス
└── factory/
    └── createAreaRepository.ts # ファクトリー関数
```

### データファイル構成

```
# ソースデータ
src/config/areas/
├── prefectures.json
└── municipalities.json

# Mock 環境用データ
data/mock/r2/areas/
├── prefectures.json
└── municipalities.json
```

## 値オブジェクトの実装

### Prefecture

```typescript
// src/lib/area/model/Prefecture.ts
export class Prefecture {
  constructor(public readonly code: AreaCode, public readonly name: string) {}

  static fromJson(json: any): Prefecture {
    return new Prefecture(new AreaCode(json.prefCode), json.prefName);
  }

  equals(other: Prefecture): boolean {
    return this.code.equals(other.code);
  }

  toString(): string {
    return `${this.code}: ${this.name}`;
  }
}
```

### Municipality

```typescript
// src/lib/area/model/Municipality.ts
export class Municipality {
  constructor(
    public readonly code: AreaCode,
    public readonly name: string,
    public readonly level: number,
    public readonly parentCode: AreaCode
  ) {}

  static fromJson(json: any): Municipality {
    return new Municipality(
      new AreaCode(json["@code"]),
      json["@name"],
      parseInt(json["@level"], 10),
      new AreaCode(json["@parentCode"])
    );
  }
}
```

## リポジトリの実装

### インターフェース

```typescript
// src/lib/area/repository/AreaRepository.ts
export interface AreaRepository {
  getPrefectures(): Promise<Prefecture[]>;
  getMunicipalities(): Promise<Municipality[]>;
  getPrefectureByCode(code: string): Promise<Prefecture | null>;
  getMunicipalitiesByPrefecture(prefCode: string): Promise<Municipality[]>;
  searchByName(query: string): Promise<Area[]>;
}
```

### Mock 実装

```typescript
// src/lib/area/repository/MockAreaRepository.ts
export class MockAreaRepository implements AreaRepository {
  private prefecturesCache: Prefecture[] | null = null;
  private municipalitiesCache: Municipality[] | null = null;

  async getPrefectures(): Promise<Prefecture[]> {
    if (!this.prefecturesCache) {
      // data/mock/r2/areas/prefectures.json から読み込み
      const data = await import("@/data/mock/r2/areas/prefectures.json");
      this.prefecturesCache = data.prefectures.map(Prefecture.fromJson);
    }
    return this.prefecturesCache;
  }

  async getMunicipalities(): Promise<Municipality[]> {
    if (!this.municipalitiesCache) {
      // data/mock/r2/areas/municipalities.json から読み込み
      const data = await import("@/data/mock/r2/areas/municipalities.json");
      this.municipalitiesCache = data.map(Municipality.fromJson);
    }
    return this.municipalitiesCache;
  }

  async getPrefectureByCode(code: string): Promise<Prefecture | null> {
    const prefs = await this.getPrefectures();
    return prefs.find((p) => p.code.toString() === code) || null;
  }

  async getMunicipalitiesByPrefecture(
    prefCode: string
  ): Promise<Municipality[]> {
    const municipalities = await this.getMunicipalities();
    return municipalities.filter((m) => m.parentCode.toString() === prefCode);
  }

  async searchByName(query: string): Promise<Area[]> {
    const [prefs, municipalities] = await Promise.all([
      this.getPrefectures(),
      this.getMunicipalities(),
    ]);

    const all = [...prefs, ...municipalities];
    return all.filter((area) => area.name.includes(query));
  }
}
```

### R2 実装

```typescript
// src/lib/area/repository/R2AreaRepository.ts
export class R2AreaRepository implements AreaRepository {
  private prefecturesCache: Prefecture[] | null = null;
  private municipalitiesCache: Municipality[] | null = null;

  constructor(private r2Bucket: R2Bucket) {}

  async getPrefectures(): Promise<Prefecture[]> {
    if (!this.prefecturesCache) {
      // Cloudflare R2 から読み込み
      const object = await this.r2Bucket.get("areas/prefectures.json");
      if (!object) {
        throw new Error("Prefectures data not found in R2");
      }
      const data = await object.json();
      this.prefecturesCache = data.prefectures.map(Prefecture.fromJson);
    }
    return this.prefecturesCache;
  }

  async getMunicipalities(): Promise<Municipality[]> {
    if (!this.municipalitiesCache) {
      // Cloudflare R2 から読み込み
      const object = await this.r2Bucket.get("areas/municipalities.json");
      if (!object) {
        throw new Error("Municipalities data not found in R2");
      }
      const data = await object.json();
      this.municipalitiesCache = data.map(Municipality.fromJson);
    }
    return this.municipalitiesCache;
  }

  // getPrefectureByCode, getMunicipalitiesByPrefecture, searchByName は同様の実装
}
```

### ファクトリー

```typescript
// src/lib/area/factory/createAreaRepository.ts
export function createAreaRepository(): AreaRepository {
  const env = process.env.NEXT_PUBLIC_ENV;

  if (env === "mock") {
    return new MockAreaRepository();
  }

  // development, staging, production では R2 を使用
  const r2Bucket = getR2Bucket();
  return new R2AreaRepository(r2Bucket);
}

// Cloudflare Workers 環境で R2 バケットを取得
function getR2Bucket(): R2Bucket {
  // Cloudflare Workers の context から R2 バケットを取得
  // 実装は環境により異なる
  return globalThis.STATS47_R2_BUCKET;
}
```

## サービス層の実装

```typescript
// src/lib/area/service/AreaService.ts
export class AreaService {
  constructor(private repository: AreaRepository) {}

  async getPrefectures(): Promise<Prefecture[]> {
    return await this.repository.getPrefectures();
  }

  async getMunicipalities(): Promise<Municipality[]> {
    return await this.repository.getMunicipalities();
  }

  async getPrefectureByCode(code: string): Promise<Prefecture | null> {
    return await this.repository.getPrefectureByCode(code);
  }

  async getMunicipalitiesByPrefecture(
    prefCode: string
  ): Promise<Municipality[]> {
    return await this.repository.getMunicipalitiesByPrefecture(prefCode);
  }

  async searchAreas(query: string): Promise<Area[]> {
    return await this.repository.searchByName(query);
  }
}
```

## 使用例

### Server Component

```typescript
// app/areas/page.tsx
import { createAreaRepository } from "@/lib/area/factory/createAreaRepository";
import { AreaService } from "@/lib/area/service/AreaService";

export default async function AreasPage() {
  const repository = createAreaRepository();
  const service = new AreaService(repository);

  const prefectures = await service.getPrefectures();

  return (
    <div>
      <h1>都道府県一覧</h1>
      <ul>
        {prefectures.map((pref) => (
          <li key={pref.code.toString()}>{pref.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### API Route

```typescript
// app/api/areas/prefectures/route.ts
import { NextResponse } from "next/server";
import { createAreaRepository } from "@/lib/area/factory/createAreaRepository";
import { AreaService } from "@/lib/area/service/AreaService";

export async function GET() {
  const repository = createAreaRepository();
  const service = new AreaService(repository);

  const prefectures = await service.getPrefectures();

  return NextResponse.json({
    prefectures: prefectures.map((p) => ({
      code: p.code.toString(),
      name: p.name,
    })),
  });
}
```

### Client Component（SWR）

```typescript
// components/AreaSelector.tsx
"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AreaSelector() {
  const { data, error, isLoading } = useSWR(
    "/api/areas/prefectures",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 3600000 } // 1時間
  );

  if (isLoading) return <div>読み込み中...</div>;
  if (error) return <div>エラーが発生しました</div>;

  return (
    <select>
      {data.prefectures.map((pref: any) => (
        <option key={pref.code} value={pref.code}>
          {pref.name}
        </option>
      ))}
    </select>
  );
}
```

## データ準備

### Mock 環境用データの準備

```bash
# src/config/areas/ から data/mock/r2/areas/ へコピー
mkdir -p data/mock/r2/areas
cp src/config/areas/prefectures.json data/mock/r2/areas/
cp src/config/areas/municipalities.json data/mock/r2/areas/
```

### R2 へのアップロード（本番環境）

```typescript
// scripts/upload-areas-to-r2.ts
import fs from "fs/promises";
import { R2Bucket } from "@cloudflare/workers-types";

async function uploadAreasToR2(r2Bucket: R2Bucket) {
  // prefectures.json をアップロード
  const prefectures = await fs.readFile(
    "src/config/areas/prefectures.json",
    "utf-8"
  );
  await r2Bucket.put("areas/prefectures.json", prefectures, {
    httpMetadata: {
      contentType: "application/json",
    },
  });

  // municipalities.json をアップロード
  const municipalities = await fs.readFile(
    "src/config/areas/municipalities.json",
    "utf-8"
  );
  await r2Bucket.put("areas/municipalities.json", municipalities, {
    httpMetadata: {
      contentType: "application/json",
    },
  });

  console.log("Areas data uploaded to R2 successfully!");
}
```

## テスト

### 単体テスト

```typescript
// src/lib/area/repository/__tests__/MockAreaRepository.test.ts
import { MockAreaRepository } from "../MockAreaRepository";

describe("MockAreaRepository", () => {
  let repository: MockAreaRepository;

  beforeEach(() => {
    repository = new MockAreaRepository();
  });

  it("should return 47 prefectures", async () => {
    const prefectures = await repository.getPrefectures();
    expect(prefectures).toHaveLength(47);
  });

  it("should find prefecture by code", async () => {
    const pref = await repository.getPrefectureByCode("01000");
    expect(pref).not.toBeNull();
    expect(pref?.name).toBe("北海道");
  });

  it("should search areas by name", async () => {
    const results = await repository.searchByName("東京");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.name.includes("東京"))).toBe(true);
  });
});
```

### 統合テスト

```typescript
// src/lib/area/service/__tests__/AreaService.integration.test.ts
import { AreaService } from "../AreaService";
import { MockAreaRepository } from "../../repository/MockAreaRepository";

describe("AreaService Integration Test", () => {
  let service: AreaService;

  beforeEach(() => {
    const repository = new MockAreaRepository();
    service = new AreaService(repository);
  });

  it("should get prefectures successfully", async () => {
    const prefectures = await service.getPrefectures();
    expect(prefectures).toHaveLength(47);
  });

  it("should get municipalities by prefecture", async () => {
    const municipalities = await service.getMunicipalitiesByPrefecture("01000");
    expect(municipalities.length).toBeGreaterThan(0);
    expect(
      municipalities.every((m) => m.parentCode.toString() === "01000")
    ).toBe(true);
  });
});
```

## トラブルシューティング

### データが読み込めない

**原因**: mock データファイルが存在しない

**解決方法**:

```bash
# データファイルの存在確認
ls -la data/mock/r2/areas/

# ファイルがない場合はコピー
mkdir -p data/mock/r2/areas
cp src/config/areas/*.json data/mock/r2/areas/
```

### 環境判断が正しく動作しない

**原因**: `NEXT_PUBLIC_ENV`が設定されていない

**解決方法**:

```bash
# .env.mock の確認
cat .env.mock

# 起動コマンドの確認
npm run dev:mock
```

## ベストプラクティス

1. **メモリキャッシュの活用**: 一度読み込んだデータをキャッシュ
2. **遅延ロード**: 必要になったタイミングでデータを読み込む
3. **並列処理**: 複数のデータを同時に取得
4. **エラーハンドリング**: データが存在しない場合の適切な処理

## 関連ドキュメント

- [Area ドメイン設計](../../01_技術設計/03_ドメイン設計/02_支援ドメイン/01_Area.md) - ドメイン設計の詳細
- [R2 ストレージ設計](../../01_技術設計/04_インフラ設計/02_R2ストレージ設計.md) - R2 バケット構造とアクセスパターン
- [キャッシュ戦略](../../01_技術設計/04_インフラ設計/03_キャッシュ戦略.md) - 3 層キャッシュアーキテクチャ
- [ストレージ選択ガイド](../../01_技術設計/04_インフラ設計/04_ストレージ選択ガイド.md) - D1 vs R2 の判断基準
- [環境設定ガイド](./02_環境設定ガイド.md) - 環境別の設定方法

## 更新履歴

- 2025-01-20: 初版作成
