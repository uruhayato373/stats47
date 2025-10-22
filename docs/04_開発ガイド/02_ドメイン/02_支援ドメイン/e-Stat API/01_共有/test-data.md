---
title: テストデータ管理ガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/estat-api
  - testing
  - test-data
---

# テストデータ管理ガイド

## 概要

e-Stat API ライブラリのテストで使用するテストデータの管理方法について説明します。テストデータの作成、管理、再利用について詳述します。

## テストデータの目的

### 1. テストの安定性

- 一貫したテスト結果
- 外部依存の排除
- 再現可能なテスト環境

### 2. テストケースの充実

- 様々なデータパターンのテスト
- エッジケースの検証
- 境界値テストの実装

### 3. 開発効率の向上

- テストデータの再利用
- テストの高速化
- メンテナンスの簡素化

## テストデータの分類

### 1. 正常系データ

- 標準的な API レスポンス
- 一般的な使用ケース
- 期待される動作の検証

### 2. 異常系データ

- エラーレスポンス
- 無効なデータ形式
- 例外ケースの検証

### 3. 境界値データ

- 最小値・最大値
- 空データ・NULL 値
- 特殊な文字列・数値

## テストデータの構造

### 1. ディレクトリ構成

```
src/test/
├── data/
│   ├── meta-info/
│   │   ├── valid/
│   │   ├── invalid/
│   │   └── edge-cases/
│   ├── stats-data/
│   │   ├── valid/
│   │   ├── invalid/
│   │   └── edge-cases/
│   └── stats-list/
│       ├── valid/
│       ├── invalid/
│       └── edge-cases/
├── fixtures/
│   ├── meta-info/
│   ├── stats-data/
│   └── stats-list/
└── factories/
    ├── meta-info-factory.ts
    ├── stats-data-factory.ts
    └── stats-list-factory.ts
```

### 2. ファイル命名規則

```
{domain}-{type}-{scenario}.{extension}
```

**例:**

- `meta-info-valid-basic.json`
- `stats-data-invalid-missing-fields.json`
- `stats-list-edge-case-empty.json`

## テストデータの作成

### 1. 基本的なテストデータ

`src/test/data/meta-info/valid/basic.json`

```json
{
  "GET_META_INFO": {
    "RESULT": {
      "STATUS": 0,
      "ERROR_MSG": null,
      "DATE": "2024-01-01T00:00:00+09:00"
    },
    "METADATA_INF": {
      "CLASS_INF": {
        "CLASS_OBJ": [
          {
            "@id": "cat01",
            "@name": "分類",
            "CLASS": [
              {
                "@code": "A1101",
                "@name": "総人口",
                "@level": "1"
              },
              {
                "@code": "A1102",
                "@name": "男性人口",
                "@level": "1"
              }
            ]
          },
          {
            "@id": "area",
            "@name": "地域",
            "CLASS": [
              {
                "@code": "13000",
                "@name": "東京都",
                "@level": "1"
              },
              {
                "@code": "27000",
                "@name": "大阪府",
                "@level": "1"
              }
            ]
          },
          {
            "@id": "time",
            "@name": "時間",
            "CLASS": [
              {
                "@code": "2020",
                "@name": "2020年"
              },
              {
                "@code": "2021",
                "@name": "2021年"
              },
              {
                "@code": "2022",
                "@name": "2022年"
              }
            ]
          }
        ]
      }
    }
  }
}
```

### 2. エラーケースのテストデータ

`src/test/data/meta-info/invalid/api-error.json`

```json
{
  "GET_META_INFO": {
    "RESULT": {
      "STATUS": 1,
      "ERROR_MSG": "Invalid appId",
      "DATE": "2024-01-01T00:00:00+09:00"
    },
    "METADATA_INF": null
  }
}
```

### 3. 境界値のテストデータ

`src/test/data/meta-info/edge-cases/empty-classes.json`

```json
{
  "GET_META_INFO": {
    "RESULT": {
      "STATUS": 0,
      "ERROR_MSG": null,
      "DATE": "2024-01-01T00:00:00+09:00"
    },
    "METADATA_INF": {
      "CLASS_INF": {
        "CLASS_OBJ": []
      }
    }
  }
}
```

## テストデータファクトリ

### 1. 基本的なファクトリ

`src/test/factories/meta-info-factory.ts`

```typescript
export interface MetaInfoFactoryOptions {
  categories?: Array<{
    code: string;
    name: string;
    level: number;
  }>;
  areas?: Array<{
    code: string;
    name: string;
    level: number;
  }>;
  years?: Array<{
    code: string;
    name: string;
  }>;
  status?: number;
  errorMsg?: string | null;
}

export class MetaInfoFactory {
  static create(options: MetaInfoFactoryOptions = {}) {
    const {
      categories = [
        { code: "A1101", name: "総人口", level: 1 },
        { code: "A1102", name: "男性人口", level: 1 },
      ],
      areas = [
        { code: "13000", name: "東京都", level: 1 },
        { code: "27000", name: "大阪府", level: 1 },
      ],
      years = [
        { code: "2020", name: "2020年" },
        { code: "2021", name: "2021年" },
      ],
      status = 0,
      errorMsg = null,
    } = options;

    return {
      GET_META_INFO: {
        RESULT: {
          STATUS: status,
          ERROR_MSG: errorMsg,
          DATE: "2024-01-01T00:00:00+09:00",
        },
        METADATA_INF:
          status === 0
            ? {
                CLASS_INF: {
                  CLASS_OBJ: [
                    {
                      "@id": "cat01",
                      "@name": "分類",
                      CLASS: categories.map((cat) => ({
                        "@code": cat.code,
                        "@name": cat.name,
                        "@level": cat.level.toString(),
                      })),
                    },
                    {
                      "@id": "area",
                      "@name": "地域",
                      CLASS: areas.map((area) => ({
                        "@code": area.code,
                        "@name": area.name,
                        "@level": area.level.toString(),
                      })),
                    },
                    {
                      "@id": "time",
                      "@name": "時間",
                      CLASS: years.map((year) => ({
                        "@code": year.code,
                        "@name": year.name,
                      })),
                    },
                  ],
                },
              }
            : null,
      },
    };
  }

  static createWithSingleCategory() {
    return this.create({
      categories: [{ code: "A1101", name: "総人口", level: 1 }],
    });
  }

  static createWithMultipleCategories() {
    return this.create({
      categories: [
        { code: "A1101", name: "総人口", level: 1 },
        { code: "A1102", name: "男性人口", level: 1 },
        { code: "A1103", name: "女性人口", level: 1 },
      ],
    });
  }

  static createWithEmptyData() {
    return this.create({
      categories: [],
      areas: [],
      years: [],
    });
  }

  static createWithError(message: string) {
    return this.create({
      status: 1,
      errorMsg: message,
    });
  }
}
```

### 2. 統計データファクトリ

`src/test/factories/stats-data-factory.ts`

```typescript
export interface StatsDataFactoryOptions {
  values?: Array<{
    area: string;
    category: string;
    time: string;
    value: string | null;
  }>;
  areas?: Array<{
    code: string;
    name: string;
  }>;
  categories?: Array<{
    code: string;
    name: string;
  }>;
  years?: Array<{
    code: string;
    name: string;
  }>;
  status?: number;
  errorMsg?: string | null;
}

export class StatsDataFactory {
  static create(options: StatsDataFactoryOptions = {}) {
    const {
      values = [
        { area: "13000", category: "A1101", time: "2023", value: "14000000" },
        { area: "27000", category: "A1101", time: "2023", value: "8800000" },
      ],
      areas = [
        { code: "13000", name: "東京都" },
        { code: "27000", name: "大阪府" },
      ],
      categories = [{ code: "A1101", name: "総人口" }],
      years = [{ code: "2023", name: "2023年" }],
      status = 0,
      errorMsg = null,
    } = options;

    return {
      GET_STATS_DATA: {
        RESULT: {
          STATUS: status,
          ERROR_MSG: errorMsg,
          DATE: "2024-01-01T00:00:00+09:00",
        },
        STATISTICAL_DATA:
          status === 0
            ? {
                DATA_INF: {
                  VALUE: values.map((val) => ({
                    "@area": val.area,
                    "@cat01": val.category,
                    "@time": val.time,
                    $: val.value,
                  })),
                },
                CLASS_INF: {
                  CLASS_OBJ: [
                    {
                      "@id": "area",
                      "@name": "地域",
                      CLASS: areas.map((area) => ({
                        "@code": area.code,
                        "@name": area.name,
                      })),
                    },
                    {
                      "@id": "cat01",
                      "@name": "分類",
                      CLASS: categories.map((cat) => ({
                        "@code": cat.code,
                        "@name": cat.name,
                      })),
                    },
                    {
                      "@id": "time",
                      "@name": "時間",
                      CLASS: years.map((year) => ({
                        "@code": year.code,
                        "@name": year.name,
                      })),
                    },
                  ],
                },
              }
            : null,
      },
    };
  }

  static createWithNullValues() {
    return this.create({
      values: [
        { area: "13000", category: "A1101", time: "2023", value: null },
        { area: "27000", category: "A1101", time: "2023", value: "8800000" },
      ],
    });
  }

  static createWithLargeDataset() {
    const values = [];
    const areas = [];
    const years = [];

    // 47都道府県のデータを生成
    for (let i = 1; i <= 47; i++) {
      const code = i.toString().padStart(2, "0") + "000";
      areas.push({
        code,
        name: `都道府県${i}`,
      });
      values.push({
        area: code,
        category: "A1101",
        time: "2023",
        value: (1000000 + i * 100000).toString(),
      });
    }

    // 10年間のデータを生成
    for (let year = 2014; year <= 2023; year++) {
      years.push({
        code: year.toString(),
        name: `${year}年`,
      });
    }

    return this.create({ values, areas, years });
  }

  static createWithError(message: string) {
    return this.create({
      status: 1,
      errorMsg: message,
    });
  }
}
```

### 3. 統計一覧ファクトリ

`src/test/factories/stats-list-factory.ts`

```typescript
export interface StatsListFactoryOptions {
  items?: Array<{
    id: string;
    statName: string;
    title: string;
    cycle: string;
    surveyDate: string;
    govOrg: string;
    mainCategory: string;
    subCategory: string;
    updatedDate: string;
  }>;
  totalCount?: number;
  status?: number;
  errorMsg?: string | null;
}

export class StatsListFactory {
  static create(options: StatsListFactoryOptions = {}) {
    const {
      items = [
        {
          id: "0000010101",
          statName: "人口推計",
          title: "都道府県別人口",
          cycle: "年次",
          surveyDate: "2023年",
          govOrg: "総務省",
          mainCategory: "人口・世帯",
          subCategory: "人口",
          updatedDate: "2024-01-01",
        },
        {
          id: "0000010102",
          statName: "人口推計",
          title: "市区町村別人口",
          cycle: "年次",
          surveyDate: "2023年",
          govOrg: "総務省",
          mainCategory: "人口・世帯",
          subCategory: "人口",
          updatedDate: "2024-01-01",
        },
      ],
      totalCount = items.length,
      status = 0,
      errorMsg = null,
    } = options;

    return {
      GET_STATS_LIST: {
        RESULT: {
          STATUS: status,
          ERROR_MSG: errorMsg,
          DATE: "2024-01-01T00:00:00+09:00",
        },
        DATALIST_INF:
          status === 0
            ? {
                NUMBER: totalCount,
                RESULT: {
                  INF: items.map((item) => ({
                    "@id": item.id,
                    STAT_NAME: item.statName,
                    TITLE: item.title,
                    CYCLE: item.cycle,
                    SURVEY_DATE: item.surveyDate,
                    GOV_ORG: item.govOrg,
                    STATISTICS_NAME: item.statName,
                    TITLE_SPEC: item.title,
                    CYCLE_SPEC: item.cycle,
                    SURVEY_DATE_SPEC: item.surveyDate,
                    GOV_ORG_SPEC: item.govOrg,
                    COLLECT_AREA: "全国",
                    MAIN_CATEGORY: item.mainCategory,
                    SUB_CATEGORY: item.subCategory,
                    OVERALL_TOTAL_NUMBER: 1,
                    UPDATED_DATE: item.updatedDate,
                  })),
                },
              }
            : null,
      },
    };
  }

  static createWithSingleItem() {
    return this.create({
      items: [
        {
          id: "0000010101",
          statName: "人口推計",
          title: "都道府県別人口",
          cycle: "年次",
          surveyDate: "2023年",
          govOrg: "総務省",
          mainCategory: "人口・世帯",
          subCategory: "人口",
          updatedDate: "2024-01-01",
        },
      ],
    });
  }

  static createWithMultipleCategories() {
    return this.create({
      items: [
        {
          id: "0000010101",
          statName: "人口推計",
          title: "都道府県別人口",
          cycle: "年次",
          surveyDate: "2023年",
          govOrg: "総務省",
          mainCategory: "人口・世帯",
          subCategory: "人口",
          updatedDate: "2024-01-01",
        },
        {
          id: "0000020101",
          statName: "経済統計",
          title: "GDP統計",
          cycle: "年次",
          surveyDate: "2023年",
          govOrg: "内閣府",
          mainCategory: "経済",
          subCategory: "GDP",
          updatedDate: "2024-01-01",
        },
        {
          id: "0000030101",
          statName: "労働統計",
          title: "就業者数統計",
          cycle: "月次",
          surveyDate: "2023年12月",
          govOrg: "厚生労働省",
          mainCategory: "労働",
          subCategory: "就業",
          updatedDate: "2024-01-01",
        },
      ],
    });
  }

  static createWithEmptyResult() {
    return this.create({
      items: [],
      totalCount: 0,
    });
  }

  static createWithError(message: string) {
    return this.create({
      status: 1,
      errorMsg: message,
    });
  }
}
```

## テストデータの管理

### 1. データの読み込み

`src/test/helpers/data-loader.ts`

```typescript
import fs from "fs";
import path from "path";

export class DataLoader {
  static loadJsonData(filePath: string) {
    const fullPath = path.resolve(__dirname, "../data", filePath);
    const data = fs.readFileSync(fullPath, "utf-8");
    return JSON.parse(data);
  }

  static loadMetaInfoData(scenario: string) {
    return this.loadJsonData(`meta-info/valid/${scenario}.json`);
  }

  static loadStatsDataData(scenario: string) {
    return this.loadJsonData(`stats-data/valid/${scenario}.json`);
  }

  static loadStatsListData(scenario: string) {
    return this.loadJsonData(`stats-list/valid/${scenario}.json`);
  }

  static loadErrorData(domain: string, scenario: string) {
    return this.loadJsonData(`${domain}/invalid/${scenario}.json`);
  }

  static loadEdgeCaseData(domain: string, scenario: string) {
    return this.loadJsonData(`${domain}/edge-cases/${scenario}.json`);
  }
}
```

### 2. データの検証

`src/test/helpers/data-validator.ts`

```typescript
export class DataValidator {
  static validateMetaInfoData(data: any): boolean {
    return (
      data &&
      data.GET_META_INFO &&
      data.GET_META_INFO.RESULT &&
      typeof data.GET_META_INFO.RESULT.STATUS === "number"
    );
  }

  static validateStatsDataData(data: any): boolean {
    return (
      data &&
      data.GET_STATS_DATA &&
      data.GET_STATS_DATA.RESULT &&
      typeof data.GET_STATS_DATA.RESULT.STATUS === "number"
    );
  }

  static validateStatsListData(data: any): boolean {
    return (
      data &&
      data.GET_STATS_LIST &&
      data.GET_STATS_LIST.RESULT &&
      typeof data.GET_STATS_LIST.RESULT.STATUS === "number"
    );
  }

  static validateAllData(data: any): boolean {
    return (
      this.validateMetaInfoData(data) ||
      this.validateStatsDataData(data) ||
      this.validateStatsListData(data)
    );
  }
}
```

### 3. データの変換

`src/test/helpers/data-converter.ts`

```typescript
export class DataConverter {
  static convertToFormattedMetaInfo(rawData: any) {
    // 生データをフォーマット済みデータに変換
    // 実際の実装はEstatMetaInfoFormatterを参照
    return {
      categories: {},
      areas: {},
      timeAxis: {
        formattedYears: [],
        timeAxis: [],
      },
    };
  }

  static convertToFormattedStatsData(rawData: any) {
    // 生データをフォーマット済みデータに変換
    // 実際の実装はEstatStatsDataFormatterを参照
    return {
      values: [],
      areas: [],
      categories: [],
      years: [],
    };
  }

  static convertToFormattedStatsList(rawData: any) {
    // 生データをフォーマット済みデータに変換
    // 実際の実装はEstatStatsListFormatterを参照
    return {
      statsList: [],
      totalCount: 0,
    };
  }
}
```

## テストでの使用例

### 1. ファクトリの使用

```typescript
import { describe, it, expect } from "vitest";
import { MetaInfoFactory } from "../factories/meta-info-factory";
import { EstatMetaInfoFetcher } from "../../meta-info/fetcher";

describe("EstatMetaInfoFetcher", () => {
  it("基本的なメタ情報を取得できる", async () => {
    const mockData = MetaInfoFactory.create();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const fetcher = new EstatMetaInfoFetcher();
    const result = await fetcher.fetchMetaInfo("0000010101");

    expect(result).toBeDefined();
  });

  it("エラーケースを正しく処理できる", async () => {
    const mockData = MetaInfoFactory.createWithError("Invalid appId");

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const fetcher = new EstatMetaInfoFetcher();

    await expect(fetcher.fetchMetaInfo("0000010101")).rejects.toThrow();
  });
});
```

### 2. データファイルの使用

```typescript
import { describe, it, expect } from "vitest";
import { DataLoader } from "../helpers/data-loader";
import { EstatMetaInfoFetcher } from "../../meta-info/fetcher";

describe("EstatMetaInfoFetcher with File Data", () => {
  it("ファイルから読み込んだデータでテストできる", async () => {
    const mockData = DataLoader.loadMetaInfoData("basic");

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const fetcher = new EstatMetaInfoFetcher();
    const result = await fetcher.fetchMetaInfo("0000010101");

    expect(result).toBeDefined();
  });
});
```

## ベストプラクティス

### 1. データの設計原則

- **一貫性**: 同じ形式でデータを管理
- **再利用性**: 複数のテストで使用可能
- **保守性**: 変更が容易で理解しやすい

### 2. データの命名規則

- **明確性**: 目的が分かりやすい名前
- **階層性**: ディレクトリ構造で整理
- **バージョン管理**: 変更履歴を追跡

### 3. データの管理

- **中央集権**: 一箇所でデータを管理
- **バリデーション**: データの整合性を確認
- **ドキュメント化**: データの説明を記載

## 関連ドキュメント

- [テスト戦略](testing-strategy.md)
- [統合テスト](integration-testing.md)
- [モック作成ガイド](mocking-guide.md)
- [meta-info 単体テスト](../meta-info/testing/unit-testing.md)
- [stats-data 単体テスト](04_ドメイン設計/e-Stat%20API/04_統計データ/testing/unit-testing.md)
- [stats-list 単体テスト](04_ドメイン設計/e-Stat%20API/02_統計表リスト/unit-testing.md)
