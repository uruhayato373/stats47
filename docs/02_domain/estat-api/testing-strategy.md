# e-Stat API ドメイン テスト戦略

## 概要

このドキュメントは、`src/features/estat-api` ドメインの包括的なテスト戦略を定義します。
e-Stat API統合機能の品質を保証し、外部API依存の複雑性に対処するためのテストアプローチを規定します。

## 作成日

2025-11-02

## ドメインの責務

e-Stat APIドメインは以下の責務を持ちます：

1. **外部API統合**: e-Stat APIへのHTTP通信とレスポンス処理
2. **データ変換**: e-Stat APIレスポンスの整形とアプリケーション内型への変換
3. **エラーハンドリング**: API エラー、ネットワークエラー、タイムアウトの統一的な処理
4. **キャッシュ管理**: R2ストレージを使用したAPI レスポンスのキャッシング
5. **統計データ取得**: 統計データ（stats-data）の取得と整形
6. **メタ情報取得**: 統計表メタ情報（meta-info）の取得と整形
7. **統計表一覧検索**: 統計表リスト（stats-list）の検索と表示
8. **ランキング変換**: e-Stat データからランキングデータへの変換

## ドメイン構成

### アーキテクチャ（DDD）

このドメインはDomain-Driven Design（DDD）の原則に従って設計されています：

- **core**: Shared Kernel（共通インフラ層）
- **meta-info, stats-data, stats-list, ranking-mappings**: Bounded Context（独立したサブドメイン）

### ディレクトリ構成

```
src/features/estat-api/
├── core/                           # 共通インフラ層（Shared Kernel）
│   ├── client/
│   │   └── http-client.ts          # HTTP通信（純粋関数）
│   ├── types/
│   │   └── common.ts               # 共通型定義
│   ├── errors/                     # エラー定義
│   ├── config/                     # 設定
│   └── constants/                  # 定数
│
├── stats-data/                     # 統計データ取得（Bounded Context）
│   ├── types/                      # 型定義
│   ├── services/
│   │   ├── fetcher.ts              # データ取得
│   │   └── formatter.ts            # データ整形（純粋関数）
│   ├── repositories/
│   │   └── statsdataR2CacheRepository.ts  # R2キャッシュ
│   ├── components/                 # UIコンポーネント
│   ├── hooks/                      # React hooks
│   ├── schemas/                    # Zodスキーマ
│   └── __tests__/                  # テスト
│
├── meta-info/                      # メタ情報取得（Bounded Context）
│   ├── services/
│   │   ├── fetcher.ts
│   │   └── formatter.ts
│   ├── components/
│   ├── hooks/
│   ├── actions/
│   └── __tests__/
│
├── stats-list/                     # 統計表一覧（Bounded Context）
│   ├── services/
│   │   ├── fetcher.ts
│   │   ├── formatter.ts
│   │   └── swr-fetcher.ts
│   ├── components/
│   └── hooks/
│
└── ranking-mappings/               # ランキングマッピング（Bounded Context）
    ├── services/
    │   ├── ranking-converter.ts    # ランキング変換
    │   ├── metadata-generator.ts   # メタデータ生成
    │   └── csv-importer.ts         # CSV インポート
    ├── repositories/
    │   ├── ranking-mappings-repository.ts
    │   └── rankingR2Repository.ts
    ├── components/
    └── actions/
```

## テストツールとフレームワーク

### 単体テスト・統合テスト

- **Vitest**: テストランナー（高速、ESM対応）
- **@testing-library/react**: Reactコンポーネントのテスト
- **@testing-library/jest-dom**: DOMマッチャー
- **@testing-library/user-event**: ユーザーインタラクションのシミュレーション

### モック・スタブ

- **vi.mock()**: モジュールモック（Vitest組み込み）
- **MSW (Mock Service Worker)**: HTTPリクエストのモック（**推奨**）
- **vi.spyOn(global, 'fetch')**: fetchのモック

### カバレッジ測定

- **Vitest Coverage**: c8ベースのカバレッジレポート

## テスト戦略（サブドメイン別）

### 1. Core層（共通インフラ）

**対象ファイル**:
- `core/client/http-client.ts` - HTTP通信（純粋関数）
- `core/types/common.ts` - 型定義、エラークラス
- `core/config/` - 設定
- `core/constants/` - 定数

**テストアプローチ**: ユニットテスト + モック

**優先度**: 🔴 最高（Critical）

**理由**:
- 全サブドメインが依存する基盤層
- HTTP通信の信頼性がドメイン全体に影響
- エラーハンドリングの正確性が重要

**カバレッジ目標**: 95%

#### テストすべき内容

##### http-client.ts

1. **executeHttpRequest()**
   - 正常系: APIリクエスト成功、レスポンスJSON解析
   - 正常系: URLパラメータの正しいエンコード
   - タイムアウト: 指定時間でAbortError
   - ネットワークエラー: ENOTFOUND（DNS解決失敗）
   - ネットワークエラー: ECONNREFUSED（接続拒否）
   - ネットワークエラー: ETIMEDOUT（接続タイムアウト）
   - HTTPエラー: 4xx, 5xxステータスコードでAPIResponseError
   - レスポンスログ: コンソールログの出力確認

2. **composeApiUrl()** (内部関数)
   - 正常系: ベースURL + エンドポイント + クエリパラメータ
   - エッジケース: undefinedやnullパラメータの除外
   - エッジケース: 空オブジェクトのパラメータ

3. **executeTimeoutFetch()** (内部関数)
   - 正常系: fetch成功
   - タイムアウト: AbortControllerによる中断
   - エラーハンドリング: clearTimeout確実に実行

4. **validateResponseStatus()** (内部関数)
   - 正常系: response.ok = true
   - 異常系: response.ok = false でAPIResponseError

5. **isNodeJsNetworkError()** (内部関数)
   - Node.jsネットワークエラーの判定
   - 通常のErrorとの区別

**テストファイル例**:
```typescript
// src/features/estat-api/core/client/__tests__/http-client.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeHttpRequest } from '../http-client';

describe('http-client', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('executeHttpRequest', () => {
    it('should successfully fetch and parse JSON', async () => {
      const mockData = { result: 'success' };
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await executeHttpRequest(
        'https://api.example.com',
        '/endpoint',
        { param1: 'value1' }
      );

      expect(result).toEqual(mockData);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('param1=value1'),
        expect.any(Object)
      );
    });

    it('should handle timeout', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 30000))
      );

      const promise = executeHttpRequest(
        'https://api.example.com',
        '/endpoint',
        {},
        5000
      );

      vi.advanceTimersByTime(5000);

      await expect(promise).rejects.toThrow('タイムアウトしました');
    });

    it('should handle ENOTFOUND error', async () => {
      const networkError = new Error('getaddrinfo ENOTFOUND api.example.com');
      (networkError as any).code = 'ENOTFOUND';
      (networkError as any).hostname = 'api.example.com';

      vi.spyOn(global, 'fetch').mockRejectedValue(networkError);

      await expect(
        executeHttpRequest('https://api.example.com', '/endpoint', {})
      ).rejects.toThrow('ネットワーク接続エラー');
    });

    it('should handle HTTP 404 error', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await expect(
        executeHttpRequest('https://api.example.com', '/endpoint', {})
      ).rejects.toThrow('HTTP error! status: 404');
    });

    it('should exclude undefined and null parameters', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await executeHttpRequest('https://api.example.com', '/endpoint', {
        param1: 'value1',
        param2: undefined,
        param3: null,
      });

      const calledUrl = fetchSpy.mock.calls[0][0];
      expect(calledUrl).toContain('param1=value1');
      expect(calledUrl).not.toContain('param2');
      expect(calledUrl).not.toContain('param3');
    });
  });
});
```

##### common.ts（エラークラス）

1. **EstatAPIError**
   - コンストラクタ: メッセージ、コード、ステータス、詳細情報
   - fromErrorCode(): エラーコードからエラー生成
   - エラーメッセージの生成（ERROR_MSG, URL含む）

2. **TransformError, APIResponseError, ConfigurationError, ValidationError**
   - 各エラークラスのコンストラクタ
   - フィールドの正しい設定

**テストファイル例**:
```typescript
// src/features/estat-api/core/types/__tests__/common.test.ts
import { describe, it, expect } from 'vitest';
import { EstatAPIError, EstatErrorCode } from '../common';

describe('EstatAPIError', () => {
  it('should create error with basic info', () => {
    const error = new EstatAPIError('Test error', EstatErrorCode.INVALID_APP_ID, 100);

    expect(error.message).toBe('Test error');
    expect(error.code).toBe(EstatErrorCode.INVALID_APP_ID);
    expect(error.status).toBe(100);
    expect(error.name).toBe('EstatAPIError');
  });

  it('should include ERROR_MSG in message', () => {
    const error = new EstatAPIError(
      'Test error',
      EstatErrorCode.INVALID_APP_ID,
      100,
      { ERROR_MSG: '詳細エラー' }
    );

    expect(error.message).toContain('詳細エラー');
  });

  it('should create error from error code', () => {
    const error = EstatAPIError.fromErrorCode(EstatErrorCode.INVALID_APP_ID);

    expect(error.code).toBe(EstatErrorCode.INVALID_APP_ID);
    expect(error.message).toBe('アプリケーションIDが指定されていません。');
  });
});
```

---

### 2. stats-data（統計データ取得）

**対象ファイル**:
- `services/fetcher.ts` - データ取得
- `services/formatter.ts` - データ整形（純粋関数、**最重要**）
- `repositories/statsdataR2CacheRepository.ts` - R2キャッシュ
- `schemas/stats-data-form.schema.ts` - Zodスキーマ

**テストアプローチ**: ユニットテスト + 統合テスト + モック

**優先度**: 🔴 最高（Critical）

**理由**:
- formatStatsData()は複雑なデータ変換ロジック（O(n)最適化済み）
- パフォーマンスが重要
- データ整合性がランキング機能に影響

**カバレッジ目標**: 90%

#### テストすべき内容

##### formatter.ts

1. **formatStatsData()**
   - 正常系: 完全なレスポンスデータの整形
   - 正常系: 全次元対応（area, time, tab, cat01-15）
   - 正常系: 特殊文字（"-", "***", "…"）のnull変換
   - 正常系: 数値変換（parseEstatValue）
   - 異常系: TABLE_INF未存在でエラー
   - 異常系: STATISTICAL_DATA未存在でエラー
   - パフォーマンス: 大量データでのO(n)複雑度確認
   - ログ出力: デバッグログの確認

2. **次元マッピングの構築**
   - area, time, tab, cat01-15の全次元
   - 階層構造（level, parentCode）の処理
   - 単位（unit）の処理

3. **値データの変換**
   - 数値文字列の正しい変換
   - 特殊文字のnull変換
   - DataNote（注釈）の処理

**テストファイル例**:
```typescript
// src/features/estat-api/stats-data/services/__tests__/formatter.test.ts
import { describe, it, expect } from 'vitest';
import { formatStatsData } from '../formatter';
import { mockStatsDataResponse } from '../../../__mocks__/stats-data-response';

describe('formatStatsData', () => {
  it('should format complete stats data response', () => {
    const result = formatStatsData(mockStatsDataResponse);

    expect(result).toHaveProperty('tableInfo');
    expect(result).toHaveProperty('metadata');
    expect(result).toHaveProperty('values');
    expect(result.values).toBeInstanceOf(Array);
  });

  it('should handle all dimensions (area, time, tab, cat01-15)', () => {
    const result = formatStatsData(mockStatsDataResponse);

    expect(result.metadata).toHaveProperty('area');
    expect(result.metadata).toHaveProperty('time');
    expect(result.metadata).toHaveProperty('tab');
  });

  it('should convert special characters to null', () => {
    const responseWithSpecialChars = {
      ...mockStatsDataResponse,
      GET_STATS_DATA: {
        STATISTICAL_DATA: {
          ...mockStatsDataResponse.GET_STATS_DATA.STATISTICAL_DATA,
          DATA_INF: {
            VALUE: [
              { $: '-', '@area': '01', '@time': '2020' },
              { $: '***', '@area': '02', '@time': '2020' },
              { $: '…', '@area': '03', '@time': '2020' },
            ],
          },
        },
      },
    };

    const result = formatStatsData(responseWithSpecialChars);

    expect(result.values[0].value).toBe(null);
    expect(result.values[1].value).toBe(null);
    expect(result.values[2].value).toBe(null);
  });

  it('should parse numeric values correctly', () => {
    const responseWithNumbers = {
      ...mockStatsDataResponse,
      GET_STATS_DATA: {
        STATISTICAL_DATA: {
          ...mockStatsDataResponse.GET_STATS_DATA.STATISTICAL_DATA,
          DATA_INF: {
            VALUE: [
              { $: '12345', '@area': '01', '@time': '2020' },
              { $: '123.45', '@area': '02', '@time': '2020' },
            ],
          },
        },
      },
    };

    const result = formatStatsData(responseWithNumbers);

    expect(result.values[0].value).toBe(12345);
    expect(result.values[1].value).toBe(123.45);
  });

  it('should throw error when TABLE_INF is missing', () => {
    const invalidResponse = {
      GET_STATS_DATA: {
        STATISTICAL_DATA: {},
      },
    };

    expect(() => formatStatsData(invalidResponse as any)).toThrow(
      'TABLE_INFが見つかりません'
    );
  });

  it('should handle large datasets efficiently', () => {
    const startTime = Date.now();
    const largeResponse = createLargeResponse(10000); // 10,000 records

    formatStatsData(largeResponse);

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(1000); // 1秒以内に処理完了
  });
});
```

##### fetcher.ts

1. **fetchStatsData()**
   - HTTP通信のモック
   - パラメータの正しい渡し方
   - キャッシュの利用確認

##### statsdataR2CacheRepository.ts

1. **キャッシュの読み書き**
   - R2ストレージへの保存
   - R2ストレージからの読み込み
   - キャッシュキーの生成

---

### 3. meta-info（メタ情報取得）

**対象ファイル**:
- `services/fetcher.ts` - メタ情報取得
- `services/formatter.ts` - メタ情報整形（純粋関数）
- `actions/saveMetaInfoAction.ts` - メタ情報保存
- `hooks/useMetaInfoSave.ts` - 保存フック

**テストアプローチ**: ユニットテスト + モック

**優先度**: 🟠 高（High）

**理由**:
- メタ情報はランキングマッピングに使用される
- データ整形ロジックが複雑
- stats-dataと類似の構造

**カバレッジ目標**: 85%

#### テストすべき内容

1. **formatMetaInfo()**
   - 正常系: メタ情報レスポンスの整形
   - 次元情報（CLASS_OBJ）の変換
   - 階層構造の処理

2. **fetchMetaInfo()**
   - HTTP通信のモック
   - パラメータ検証

3. **saveMetaInfoAction()**
   - Server Actionの実行
   - データベース保存の確認

---

### 4. stats-list（統計表一覧）

**対象ファイル**:
- `services/fetcher.ts` - 統計表一覧取得
- `services/formatter.ts` - 統計表整形（純粋関数）
- `services/swr-fetcher.ts` - SWR用fetcher
- `hooks/useStatsListSearch.ts` - 検索フック

**テストアプローチ**: ユニットテスト + モック

**優先度**: 🟡 中（Medium）

**理由**:
- 検索機能の品質が重要
- ページネーション処理の確認が必要
- SWRとの統合テスト

**カバレッジ目標**: 80%

#### テストすべき内容

1. **formatStatsList()**
   - 正常系: 統計表リストの整形
   - ページネーション情報の処理
   - 統計表項目の変換

2. **fetchStatsList()**
   - パラメータの構築
   - HTTP通信のモック

3. **useStatsListSearch()**
   - SWRの動作確認
   - ローディング状態の管理
   - エラーハンドリング

---

### 5. ranking-mappings（ランキングマッピング）

**対象ファイル**:
- `services/ranking-converter.ts` - ランキング変換（**最重要**）
- `services/metadata-generator.ts` - メタデータ生成
- `services/csv-importer.ts` - CSVインポート
- `repositories/ranking-mappings-repository.ts` - D1データベース
- `repositories/rankingR2Repository.ts` - R2キャッシュ

**テストアプローチ**: ユニットテスト + 統合テスト + モック

**優先度**: 🔴 最高（Critical）

**理由**:
- ランキング変換ロジックが複雑
- データ整合性が最重要
- CSV インポートのエラーハンドリング

**カバレッジ目標**: 95%

#### テストすべき内容

##### ranking-converter.ts

1. **convertToRankingData()**
   - 正常系: e-StatデータからRankingDataへの変換
   - 地域コード（area）の正規化
   - 時間コード（time）の処理
   - 値（value）の変換
   - エッジケース: null値の処理

2. **地域コード変換**
   - 都道府県コード（2桁→5桁）
   - 市区町村コード（5桁）
   - 全国コード（"00000"）

##### metadata-generator.ts

1. **generateMetadata()**
   - メタデータの生成
   - 統計表情報の抽出

##### csv-importer.ts

1. **importCSV()**
   - CSV解析
   - バリデーション
   - エラーハンドリング

**テストファイル例**:
```typescript
// src/features/estat-api/ranking-mappings/services/__tests__/ranking-converter.test.ts
import { describe, it, expect } from 'vitest';
import { convertToRankingData } from '../ranking-converter';

describe('ranking-converter', () => {
  describe('convertToRankingData', () => {
    it('should convert e-Stat data to RankingData', () => {
      const estatData = {
        values: [
          {
            area: '13',
            time: '2020',
            tab: '001',
            cat01: '01',
            value: 12345,
          },
        ],
        metadata: {
          area: {
            '13': { code: '13', name: '東京都' },
          },
          time: {
            '2020': { code: '2020', name: '2020年' },
          },
        },
      };

      const result = convertToRankingData(estatData);

      expect(result).toHaveLength(1);
      expect(result[0].areaCode).toBe('13000'); // 2桁→5桁変換
      expect(result[0].timeCode).toBe('2020');
      expect(result[0].value).toBe(12345);
    });

    it('should handle null values', () => {
      const estatData = {
        values: [
          {
            area: '13',
            time: '2020',
            tab: '001',
            cat01: '01',
            value: null,
          },
        ],
        metadata: { area: {}, time: {} },
      };

      const result = convertToRankingData(estatData);

      expect(result[0].value).toBe(null);
    });

    it('should normalize area codes correctly', () => {
      const testCases = [
        { input: '01', expected: '01000' }, // 北海道
        { input: '13', expected: '13000' }, // 東京都
        { input: '13113', expected: '13113' }, // 渋谷区
        { input: '00', expected: '00000' }, // 全国
      ];

      testCases.forEach(({ input, expected }) => {
        const data = {
          values: [{ area: input, time: '2020', value: 100 }],
          metadata: { area: {}, time: {} },
        };

        const result = convertToRankingData(data);
        expect(result[0].areaCode).toBe(expected);
      });
    });
  });
});
```

---

## テスト実行とCI/CD統合

### テスト実行コマンド

```bash
# 全テスト実行
npm run test

# カバレッジ付き実行
npm run test:coverage

# サブドメイン別テスト
npm run test src/features/estat-api/core
npm run test src/features/estat-api/stats-data
npm run test src/features/estat-api/meta-info
npm run test src/features/estat-api/stats-list
npm run test src/features/estat-api/ranking-mappings

# ドメイン全体テスト
npm run test src/features/estat-api

# ウォッチモード（開発時）
npm run test:watch
```

### カバレッジ基準

以下のカバレッジ基準を満たすことを目標とします：

| サブドメイン | 目標カバレッジ | 優先度 |
|------------|-------------|--------|
| core（共通インフラ） | 95% | 最高 |
| stats-data（データ整形） | 90% | 最高 |
| ranking-mappings（変換） | 95% | 最高 |
| meta-info | 85% | 高 |
| stats-list | 80% | 中 |

### CI/CDパイプライン統合

```yaml
# .github/workflows/test.yml
name: Test e-Stat API Domain

on:
  push:
    paths:
      - 'src/features/estat-api/**'
  pull_request:
    paths:
      - 'src/features/estat-api/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage -- src/features/estat-api
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## テスト実装の優先順位

### フェーズ1: 基盤テスト（最優先）

1. ✅ **Core層のテスト**
   - HTTP通信（http-client.ts）
   - エラークラス（common.ts）

**理由**: 全サブドメインが依存する基盤層。バグの影響が甚大。

### フェーズ2: データ変換テスト（最優先）

2. ✅ **stats-data formatter のテスト**
   - formatStatsData()（複雑なデータ変換、パフォーマンス重要）

3. ✅ **ranking-converter のテスト**
   - convertToRankingData()（ランキング機能の中核）

**理由**: データ整合性とパフォーマンスが重要。

### フェーズ3: ビジネスロジックテスト（高優先）

4. ✅ **ranking-mappings リポジトリのテスト**
   - D1データベース、R2キャッシュ

5. ✅ **meta-info formatter のテスト**
   - formatMetaInfo()

**理由**: ランキング機能に直結。

### フェーズ4: その他機能テスト（中優先）

6. ✅ **stats-list のテスト**
   - 統計表一覧、SWR連携

7. ✅ **hooks, components のテスト**
   - React hooks、UIコンポーネント

---

## モック戦略

### 外部API（e-Stat API）のモック

**推奨: MSW (Mock Service Worker)**

```typescript
// src/features/estat-api/__mocks__/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData', () => {
    return HttpResponse.json({
      GET_STATS_DATA: {
        RESULT: {
          STATUS: 0,
          ERROR_MSG: '正常に終了しました。',
          DATE: '2024-01-01T00:00:00.000+09:00',
        },
        STATISTICAL_DATA: {
          // モックデータ
        },
      },
    });
  }),
];
```

### D1データベースのモック

```typescript
// src/features/estat-api/__mocks__/d1.ts
export const mockD1 = {
  prepare: vi.fn().mockReturnThis(),
  bind: vi.fn().mockReturnThis(),
  run: vi.fn(),
  first: vi.fn(),
  all: vi.fn(),
};
```

### R2ストレージのモック

```typescript
// src/features/estat-api/__mocks__/r2.ts
export const mockR2 = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
};
```

---

## テストのベストプラクティス

### 1. 純粋関数のテスト優先

データ整形関数（formatter）は純粋関数なので、テストが容易でメリットが大きい。

```typescript
// ✅ Good: 純粋関数のテスト
it('should format data correctly', () => {
  const input = { /* ... */ };
  const result = formatStatsData(input);
  expect(result).toEqual(expectedOutput);
});

// ❌ Bad: 副作用を含むテスト
it('should save and then format data', async () => {
  await saveData(data); // 副作用
  const result = formatStatsData(data);
  // ...
});
```

### 2. パフォーマンステスト

大量データを扱うため、パフォーマンステストを含める。

```typescript
it('should format 10,000 records within 1 second', () => {
  const startTime = Date.now();
  const largeData = createLargeDataset(10000);

  formatStatsData(largeData);

  const elapsed = Date.now() - startTime;
  expect(elapsed).toBeLessThan(1000);
});
```

### 3. エラーケースの網羅

e-Stat APIのエラーコードを網羅的にテスト。

```typescript
describe('EstatAPIError', () => {
  const errorCodes = [
    EstatErrorCode.INVALID_APP_ID,
    EstatErrorCode.INVALID_STATS_DATA_ID,
    EstatErrorCode.SYSTEM_ERROR,
    // ... 全エラーコード
  ];

  errorCodes.forEach(code => {
    it(`should handle error code ${code}`, () => {
      const error = EstatAPIError.fromErrorCode(code);
      expect(error.code).toBe(code);
      expect(error.message).toBeDefined();
    });
  });
});
```

### 4. 特殊文字処理のテスト

e-Stat APIは特殊文字（"-", "***", "…"）を返すため、これらの処理をテスト。

```typescript
it('should convert special characters to null', () => {
  const specialChars = ['-', '***', '…', '－', '＊＊＊'];

  specialChars.forEach(char => {
    const result = parseEstatValue(char);
    expect(result).toBe(null);
  });
});
```

---

## モックデータの管理

### モックデータの配置

```
tests/
└── fixtures/
    └── estat-api/
        ├── stats-data-response.json      # 統計データレスポンス
        ├── meta-info-response.json       # メタ情報レスポンス
        ├── stats-list-response.json      # 統計表一覧レスポンス
        └── ranking-mapping.json          # ランキングマッピング
```

### モックデータの内容例

**stats-data-response.json**:
```json
{
  "GET_STATS_DATA": {
    "RESULT": {
      "STATUS": 0,
      "ERROR_MSG": "正常に終了しました。",
      "DATE": "2024-01-01T00:00:00.000+09:00"
    },
    "STATISTICAL_DATA": {
      "TABLE_INF": {
        "@id": "0003410379",
        "STAT_NAME": { "$": "人口推計" },
        "TITLE": { "$": "都道府県別人口" }
      },
      "CLASS_INF": {
        "CLASS_OBJ": [
          {
            "@id": "area",
            "@name": "地域",
            "CLASS": [
              { "@code": "01000", "@name": "北海道" },
              { "@code": "13000", "@name": "東京都" }
            ]
          }
        ]
      },
      "DATA_INF": {
        "VALUE": [
          { "$": "5224614", "@area": "01000", "@time": "2020" },
          { "$": "13960000", "@area": "13000", "@time": "2020" }
        ]
      }
    }
  }
}
```

---

## 既知の問題と改善提案

### 1. エラーハンドリングの一貫性

**現状**: 各サブドメインでエラーハンドリングが微妙に異なる。

**改善案**: core層で統一的なエラーハンドリング関数を提供。

### 2. キャッシュキーの管理

**現状**: キャッシュキーの生成ロジックが分散。

**改善案**: core層で統一的なキャッシュキー生成関数を提供。

### 3. レスポンスのバリデーション

**現状**: レスポンスデータの型チェックが不十分。

**改善案**: Zodスキーマでレスポンスをバリデーション。

---

## 継続的な改善

### テストメトリクスの追跡

以下のメトリクスを定期的に確認・改善します：

- **コードカバレッジ**: 目標値の達成状況
- **テスト実行時間**: パフォーマンス劣化の検出
- **外部API障害対応**: モックの活用状況
- **テストメンテナンスコスト**: テストの保守性

### レビュープロセス

- 新機能追加時は必ずテストを含める
- PRレビュー時にテストカバレッジを確認
- e-Stat API仕様変更時のテスト更新
- 定期的なテストコードレビュー（月1回）

---

## 参考資料

- [Vitest公式ドキュメント](https://vitest.dev/)
- [MSW公式ドキュメント](https://mswjs.io/)
- [e-Stat API仕様書](https://www.e-stat.go.jp/api/api-info/e-stat-manual3-0)

---

## 更新履歴

| 日付 | 変更内容 | 担当者 |
|------|---------|--------|
| 2025-11-02 | 初版作成 | Claude |

---

## 付録: テストコマンド一覧

```bash
# Core層
npm run test src/features/estat-api/core/client/__tests__/http-client.test.ts
npm run test src/features/estat-api/core/types/__tests__/common.test.ts

# stats-data
npm run test src/features/estat-api/stats-data/services/__tests__/formatter.test.ts
npm run test src/features/estat-api/stats-data/services/__tests__/fetcher.test.ts

# meta-info
npm run test src/features/estat-api/meta-info/services/__tests__/formatter.test.ts
npm run test src/features/estat-api/meta-info/services/__tests__/fetcher.test.ts

# stats-list
npm run test src/features/estat-api/stats-list/services/__tests__/formatter.test.ts
npm run test src/features/estat-api/stats-list/hooks/__tests__/useStatsListSearch.test.ts

# ranking-mappings
npm run test src/features/estat-api/ranking-mappings/services/__tests__/ranking-converter.test.ts
npm run test src/features/estat-api/ranking-mappings/services/__tests__/csv-importer.test.ts

# サブドメイン別
npm run test src/features/estat-api/core
npm run test src/features/estat-api/stats-data
npm run test src/features/estat-api/meta-info
npm run test src/features/estat-api/stats-list
npm run test src/features/estat-api/ranking-mappings

# ドメイン全体
npm run test src/features/estat-api

# カバレッジ
npm run test:coverage src/features/estat-api
```
