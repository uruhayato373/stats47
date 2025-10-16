# e-Stat API ライブラリ テスト戦略

## 概要

このドキュメントでは、`src/lib/estat-api` および関連ライブラリのテスト戦略とベストプラクティスを定義します。

## テストの目的

1. **正確性の保証**: データ変換・整形ロジックが正しく動作することを保証
2. **回帰の防止**: 将来の変更で既存機能が壊れないことを保証
3. **ドキュメント**: テストがコードの使い方の実例となる
4. **リファクタリングの支援**: 安心してコードを改善できる環境を提供
5. **バグの早期発見**: 本番環境に到達する前に問題を検出

## テストピラミッド

```
        /\
       /  \
      / E2E \          少ない（遅い、コストが高い）
     /______\
    /        \
   /  統合    \        中程度（適度な速度）
  /___________\
 /             \
/   単体テスト  \      多い（高速、安価）
/_______________\
```

### 推奨割合

- **単体テスト（Unit Tests）**: 70%

  - 個別の関数やクラスのテスト
  - モックを使用して外部依存を排除

- **統合テスト（Integration Tests）**: 20%

  - 複数のモジュールの連携をテスト
  - 実際のモックデータを使用

- **E2E テスト（End-to-End Tests）**: 10%
  - ユーザーシナリオ全体のテスト
  - 実際の API を使用（または本物に近いモック）

## テストファイルの配置

### 原則: コロケーション（Co-location）

テストファイルはテスト対象のファイルと同じディレクトリに配置します。

```
src/lib/estat-api/
├── client/
│   ├── api-client.ts
│   ├── api-client.test.ts
│   ├── error-handler.ts
│   ├── error-handler.test.ts
│   ├── http-client.ts
│   ├── http-client.test.ts
│   ├── response-parser.ts
│   ├── response-parser.test.ts
│   └── index.ts
├── metainfo/
│   ├── formatter.ts
│   ├── formatter.test.ts
│   ├── fetcher.ts
│   ├── fetcher.test.ts
│   ├── batch-processor.ts
│   ├── batch-processor.test.ts
│   ├── id-utils.ts
│   ├── id-utils.test.ts
│   ├── types.ts
│   └── index.ts
├── statsdata/
│   ├── formatter.ts
│   ├── formatter.test.ts
│   ├── fetcher.ts
│   ├── fetcher.test.ts
│   ├── filter.ts
│   ├── filter.test.ts
│   ├── csv-converter.ts
│   ├── csv-converter.test.ts
│   ├── types.ts
│   └── index.ts
├── statslist/
│   ├── formatter.ts
│   ├── formatter.test.ts
│   ├── fetcher.ts
│   ├── fetcher.test.ts
│   ├── types.ts
│   └── index.ts
├── types/
│   ├── index.ts
│   └── types.test.ts                 # 型のテスト
└── __tests__/                        # 統合テスト専用
    ├── integration/
    │   ├── api-client.integration.test.ts
    │   └── formatters.integration.test.ts
    └── e2e/
        └── full-flow.e2e.test.ts
```

### 命名規則

| テストの種類 | ファイル名              | 配置                     |
| ------------ | ----------------------- | ------------------------ |
| 単体テスト   | `*.test.ts`             | コンポーネントと同階層   |
| 統合テスト   | `*.integration.test.ts` | `__tests__/integration/` |
| E2E テスト   | `*.e2e.test.ts`         | `__tests__/e2e/`         |

## テストフレームワークとツール

### 推奨スタック

```json
{
  "devDependencies": {
    "@jest/globals": "^29.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "msw": "^2.0.0", // モックサーバー
    "nock": "^13.0.0", // HTTPモック
    "vitest": "^1.0.0" // Vite使用の場合
  }
}
```

### jest.config.js

```javascript
/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.tsx",
    "!src/**/__tests__/**",
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};

module.exports = config;
```

### jest.setup.js

```javascript
// カスタムマッチャー
import "@testing-library/jest-dom";

// グローバルなモック設定
global.fetch = jest.fn();

// タイムアウト設定
jest.setTimeout(10000);
```

## 単体テストのベストプラクティス

### 1. データ変換ロジックのテスト

**例: formatter.test.ts**

```typescript
import { describe, it, expect, beforeEach } from "@jest/globals";
import { EstatMetaInfoFormatter } from "./formatter";
import { EstatMetaInfoResponse } from "../types";

describe("EstatMetaInfoFormatter", () => {
  describe("extractTableInfo", () => {
    let mockResponse: EstatMetaInfoResponse;

    beforeEach(() => {
      // モックデータの準備
      mockResponse = {
        GET_META_INFO: {
          METADATA_INF: {
            TABLE_INF: {
              "@id": "0000010101",
              STAT_NAME: { $: "国勢調査" },
              TITLE: { $: "人口等基本集計" },
              GOV_ORG: { $: "総務省" },
              STATISTICS_NAME: "国勢調査",
              CYCLE: "10年",
              SURVEY_DATE: "2020年10月1日",
              OPEN_DATE: "2021年6月25日",
              SMALL_AREA: "0",
              COLLECT_AREA: "全国",
              MAIN_CATEGORY: { "@code": "A", $: "人口・世帯" },
              SUB_CATEGORY: { "@code": "A1", $: "人口" },
              OVERALL_TOTAL_NUMBER: 1000,
              UPDATED_DATE: "2021-06-25",
            },
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  "@id": "cat01",
                  "@name": "男女",
                  CLASS: [
                    {
                      "@code": "A1101",
                      "@name": "A1101_総人口",
                      "@unit": "人",
                    },
                    {
                      "@code": "A1301",
                      "@name": "A1301_男性人口",
                      "@unit": "人",
                    },
                  ],
                },
              ],
            },
          },
        },
      };
    });

    it("統計表の基本情報を正しく抽出する", () => {
      const result = EstatMetaInfoFormatter.extractTableInfo(mockResponse);

      expect(result).toEqual({
        id: "0000010101",
        statName: "国勢調査",
        organization: "総務省",
        statisticsName: "国勢調査",
        title: "人口等基本集計",
        cycle: "10年",
        surveyDate: "2020年10月1日",
        openDate: "2021年6月25日",
        smallArea: "0",
        collectArea: "全国",
        mainCategory: {
          code: "A",
          name: "人口・世帯",
        },
        subCategory: {
          code: "A1",
          name: "人口",
        },
        totalRecords: 1000,
        updatedDate: "2021-06-25",
      });
    });

    it("メタ情報が不足している場合はエラーをスローする", () => {
      const invalidResponse = {
        GET_META_INFO: {
          METADATA_INF: {
            // TABLE_INF なし
            CLASS_INF: {
              CLASS_OBJ: [],
            },
          },
        },
      };

      expect(() => {
        EstatMetaInfoFormatter.extractTableInfo(invalidResponse as any);
      }).toThrow("統計表情報が見つかりません");
    });
  });

  describe("extractCategories", () => {
    let mockResponse: EstatMetaInfoResponse;

    beforeEach(() => {
      mockResponse = {
        GET_META_INFO: {
          METADATA_INF: {
            TABLE_INF: {
              "@id": "0000010101",
              STAT_NAME: { $: "国勢調査" },
              TITLE: { $: "人口等基本集計" },
            },
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  "@id": "cat01",
                  "@name": "男女",
                  CLASS: [
                    {
                      "@code": "A1101",
                      "@name": "A1101_総人口",
                      "@unit": "人",
                    },
                  ],
                },
              ],
            },
          },
        },
      };
    });

    it("分類項目を正しく抽出する", () => {
      const result = EstatMetaInfoFormatter.extractCategories(mockResponse);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "cat01",
        name: "男女",
        items: [
          {
            code: "A1101",
            name: "A1101_総人口",
            unit: "人",
            level: undefined,
            parentCode: undefined,
          },
        ],
      });
    });

    it("CLASS_OBJが存在しない場合は空配列を返す", () => {
      const invalidResponse = {
        GET_META_INFO: {
          METADATA_INF: {
            TABLE_INF: {
              "@id": "0000010101",
              STAT_NAME: { $: "国勢調査" },
              TITLE: { $: "人口等基本集計" },
            },
            CLASS_INF: {
              CLASS_OBJ: [],
            },
          },
        },
      };

      const result = EstatMetaInfoFormatter.extractCategories(invalidResponse);
      expect(result).toEqual([]);
    });
  });
});
```

### 2. API クライアントのテスト（モック使用）

**例: api-client.test.ts**

```typescript
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { EstatAPIClient } from "./api-client";

// fetchをモック化
global.fetch = jest.fn();

describe("EstatAPIClient", () => {
  let client: EstatAPIClient;
  const mockAppId = "test-app-id";

  beforeEach(() => {
    client = new EstatAPIClient(mockAppId);
    jest.clearAllMocks();
  });

  describe("getStatsData", () => {
    it("正常なレスポンスを返す", async () => {
      const mockResponse = {
        GET_STATS_DATA: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: "正常に終了しました。",
          },
          STATISTICAL_DATA: {
            // モックデータ
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getStatsData({
        statsDataId: "0000010101",
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("appId=test-app-id"),
        expect.any(Object)
      );
    });

    it("APIエラーの場合は例外をスローする", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      });

      await expect(
        client.getStatsData({ statsDataId: "0000010101" })
      ).rejects.toThrow("HTTP error! status: 400");
    });

    it("ネットワークエラーの場合は例外をスローする", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      await expect(
        client.getStatsData({ statsDataId: "0000010101" })
      ).rejects.toThrow("Network error");
    });

    it("パラメータが正しくURLエンコードされる", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await client.getStatsData({
        statsDataId: "0000010101",
        cdCat01: "A1101,A1301", // カンマ区切り
      });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain("cdCat01=A1101%2CA1301");
    });
  });
});
```

### 3. テストデータの管理

**テストフィクスチャの作成**

```typescript
// src/lib/estat-api/__tests__/fixtures/index.ts

export const fixtures = {
  metaInfoResponse: {
    minimal: {
      GET_META_INFO: {
        METADATA_INF: {
          TABLE_INF: {
            "@id": "0000010101",
            STAT_NAME: { $: "テスト統計" },
            TITLE: { $: "テスト表題" },
          },
          CLASS_INF: {
            CLASS_OBJ: [
              {
                "@id": "cat01",
                CLASS: [
                  {
                    "@code": "A1101",
                    "@name": "総人口",
                    "@unit": "人",
                  },
                ],
              },
            ],
          },
        },
      },
    },
    complete: {
      // 完全なデータ
    },
    invalid: {
      // 不正なデータ
    },
  },

  statsDataResponse: {
    minimal: {
      // 最小限のデータ
    },
  },
};

// ファクトリー関数
export function createMetaInfoResponse(overrides = {}) {
  return {
    ...fixtures.metaInfoResponse.minimal,
    ...overrides,
  };
}
```

**使用例**

```typescript
import { fixtures, createMetaInfoResponse } from "./__tests__/fixtures";

describe("MyTest", () => {
  it("フィクスチャを使用", () => {
    const response = fixtures.metaInfoResponse.minimal;
    // テスト
  });

  it("カスタマイズしたデータを使用", () => {
    const response = createMetaInfoResponse({
      GET_META_INFO: {
        METADATA_INF: {
          TABLE_INF: {
            "@id": "custom-id",
          },
        },
      },
    });
    // テスト
  });
});
```

## 統合テストのベストプラクティス

### MSW（Mock Service Worker）を使用

**setup-msw.ts**

```typescript
import { setupServer } from "msw/node";
import { rest } from "msw";

export const handlers = [
  rest.get(
    "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData",
    (req, res, ctx) => {
      const statsDataId = req.url.searchParams.get("statsDataId");

      // モックレスポンスを返す
      return res(
        ctx.status(200),
        ctx.json({
          GET_STATS_DATA: {
            RESULT: {
              STATUS: 0,
              ERROR_MSG: "正常に終了しました。",
            },
            STATISTICAL_DATA: {
              // モックデータ
            },
          },
        })
      );
    }
  ),

  rest.get(
    "https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo",
    (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          GET_META_INFO: {
            // モックデータ
          },
        })
      );
    }
  ),
];

export const server = setupServer(...handlers);
```

**統合テスト例**

```typescript
// __tests__/integration/api-client.integration.test.ts

import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  afterAll,
} from "@jest/globals";
import { server } from "../setup-msw";
import { estatAPI } from "@/lib/estat-api";

describe("EstatAPIClient Integration", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("実際のAPIフローをテスト", async () => {
    // 1. メタ情報を取得
    const metaInfo = await estatAPI.getMetaInfo({
      statsDataId: "0000010101",
    });

    expect(metaInfo.GET_META_INFO).toBeDefined();

    // 2. 統計データを取得
    const statsData = await estatAPI.getStatsData({
      statsDataId: "0000010101",
    });

    expect(statsData.GET_STATS_DATA).toBeDefined();
  });

  it("エラーハンドリングが正しく動作する", async () => {
    // エラーレスポンスをモック
    server.use(
      rest.get(
        "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData",
        (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              GET_STATS_DATA: {
                RESULT: {
                  STATUS: 1,
                  ERROR_MSG: "パラメータエラー",
                },
              },
            })
          );
        }
      )
    );

    await expect(
      estatAPI.getStatsData({ statsDataId: "invalid" })
    ).rejects.toThrow();
  });
});
```

## E2E テストのベストプラクティス

### 実際の API を使用（慎重に）

```typescript
// __tests__/e2e/full-flow.e2e.test.ts

import { describe, it, expect } from "@jest/globals";
import { estatAPI } from "@/lib/estat-api";
import { EstatMetaInfoFormatter } from "@/lib/estat-api/metainfo";

describe("E2E: Full Data Flow", () => {
  // E2Eテストは時間がかかるためスキップ可能にする
  const skipE2E = process.env.SKIP_E2E === "true";

  it.skipIf(skipE2E)(
    "実際のAPIからデータを取得して変換する",
    async () => {
      // 1. メタ情報を取得
      const metaInfo = await estatAPI.getMetaInfo({
        statsDataId: "0000010101",
      });

      expect(metaInfo.GET_META_INFO).toBeDefined();

      // 2. メタ情報を解析
      const parsedMetaInfo =
        EstatMetaInfoFormatter.parseCompleteMetaInfo(metaInfo);

      expect(parsedMetaInfo.tableInfo).toBeDefined();
      expect(parsedMetaInfo.dimensions.categories.length).toBeGreaterThan(0);

      // 3. 統計データを取得
      const statsData = await estatAPI.getStatsData({
        statsDataId: "0000010101",
        cdCat01:
          parsedMetaInfo.dimensions.categories[0]?.items[0]?.code || "A1101",
        limit: 10,
      });

      expect(statsData.GET_STATS_DATA).toBeDefined();
    },
    30000
  ); // 30秒のタイムアウト
});
```

## カバレッジの目標

### 最低限のカバレッジ

```javascript
coverageThresholds: {
  global: {
    branches: 70,    // 分岐カバレッジ
    functions: 70,   // 関数カバレッジ
    lines: 70,       // 行カバレッジ
    statements: 70,  // ステートメントカバレッジ
  },
}
```

### ファイル別の重要度

| ファイル           | 目標カバレッジ | 理由                   |
| ------------------ | -------------- | ---------------------- |
| データ変換ロジック | 90%+           | ビジネスロジックの中核 |
| API クライアント   | 80%+           | 外部依存があるが重要   |
| 型定義             | -              | 実行時にテストできない |
| ユーティリティ     | 85%+           | 再利用されるため       |

## テスト実行のベストプラクティス

### package.json スクリプト

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern='\\.test\\.ts$'",
    "test:integration": "jest --testPathPattern='integration\\.test\\.ts$'",
    "test:e2e": "jest --testPathPattern='e2e\\.test\\.ts$'",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

### CI/CD 設定（GitHub Actions）

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

      # E2Eテストは必要に応じて実行
      - name: Run E2E tests
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        env:
          ESTAT_APP_ID: ${{ secrets.ESTAT_APP_ID }}
        run: npm run test:e2e
```

## テスト作成のチェックリスト

新しいテストを作成する際のチェックリスト：

### 単体テスト

- [ ] 正常系のテストケース
- [ ] 異常系のテストケース
- [ ] エッジケースのテスト
- [ ] NULL/undefined のハンドリング
- [ ] 空配列/空文字列のハンドリング
- [ ] 型の検証
- [ ] エラーメッセージの検証
- [ ] モックが適切に設定されている

### 統合テスト

- [ ] 複数モジュールの連携が正しい
- [ ] データフローが正しい
- [ ] エラーハンドリングが適切
- [ ] パフォーマンスが許容範囲内

### E2E テスト

- [ ] 実際のユースケースをカバー
- [ ] エラー時の挙動が正しい
- [ ] タイムアウトが適切に設定されている
- [ ] CI 環境で実行可能

## アンチパターン（避けるべきこと）

### ❌ 1. テストが実装に依存しすぎる

```typescript
// 悪い例: 内部実装の詳細をテストしている
it("内部の変数が正しく設定される", () => {
  const formatter = new Formatter();
  expect(formatter._internalVariable).toBe("value");
});

// 良い例: 公開APIの挙動をテストする
it("正しい結果を返す", () => {
  const result = formatter.format(input);
  expect(result).toEqual(expectedOutput);
});
```

### ❌ 2. テスト間の依存関係

```typescript
// 悪い例: テストの順序に依存
let sharedData;

it("データを作成", () => {
  sharedData = createData();
});

it("データを使用", () => {
  processData(sharedData); // 前のテストに依存
});

// 良い例: 各テストは独立
it("データを処理", () => {
  const data = createData();
  const result = processData(data);
  expect(result).toBeDefined();
});
```

### ❌ 3. 実際の API を単体テストで呼び出す

```typescript
// 悪い例: 実際のAPIを呼び出している
it("APIからデータを取得", async () => {
  const data = await fetch("https://api.e-stat.go.jp/...");
  expect(data).toBeDefined();
});

// 良い例: モックを使用
it("APIからデータを取得", async () => {
  global.fetch = jest.fn().mockResolvedValue({ json: () => mockData });
  const data = await fetchData();
  expect(data).toEqual(mockData);
});
```

### ❌ 4. 曖昧なアサーション

```typescript
// 悪い例: 何をテストしているか不明確
it("動作する", () => {
  const result = doSomething();
  expect(result).toBeTruthy();
});

// 良い例: 具体的なアサーション
it("有効なデータオブジェクトを返す", () => {
  const result = doSomething();
  expect(result).toEqual({
    id: "0000010101",
    name: "国勢調査",
    items: expect.any(Array),
  });
});
```

## まとめ

### ベストプラクティス

✅ **テストファイルはコンポーネントと同階層に配置**
✅ **外部 API はモック化する**
✅ **テストフィクスチャを再利用する**
✅ **単体・統合・E2E のバランスを保つ**
✅ **カバレッジ 70%以上を目指す**
✅ **CI/CD に統合する**
✅ **公開 API の挙動をテストする**
✅ **各テストは独立させる**

### テスト作成の優先順位

1. **高**: データ変換ロジック（ビジネスロジックの中核）
2. **高**: API クライアント（外部依存の管理）
3. **中**: ユーティリティ関数
4. **中**: エラーハンドリング
5. **低**: 型定義（TypeScript で保証）

この戦略に従うことで、信頼性の高い保守しやすいテストスイートが構築できます。
