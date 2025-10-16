---
title: 単体テストガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/estat-api
  - testing
---

# 単体テストガイド

## 概要

e-Stat APIライブラリの単体テストの実装方法について説明します。テスト戦略、モックの作成、テストケースの設計について詳述します。

## テスト環境のセットアップ

### 1. 必要な依存関係

```bash
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev jest-environment-jsdom
```

### 2. Jest設定

`jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts']
};
```

### 3. テストセットアップ

`src/test/setup.ts`

```typescript
// 環境変数の設定
process.env.NEXT_PUBLIC_ESTAT_APP_ID = 'test-app-id';

// コンソールログの抑制（テスト時）
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (args[0]?.includes?.('Warning:')) {
    return;
  }
  originalConsoleError(...args);
};

// タイマーのモック
jest.useFakeTimers();
```

## サービスクラスのテスト

### 1. EstatStatsDataService のテスト

`src/lib/estat/statsdata/__tests__/EstatStatsDataService.test.ts`

```typescript
import { EstatStatsDataService } from '../EstatStatsDataService';
import { EstatApiClient } from '@/services/estat-api';

// モック
jest.mock('@/services/estat-api');
const mockEstatApiClient = EstatApiClient as jest.Mocked<typeof EstatApiClient>;

describe('EstatStatsDataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAndFormatStatsData', () => {
    it('正常に統計データを取得・整形できる', async () => {
      // モックデータの設定
      const mockRawData = {
        GET_STATS_DATA: {
          RESULT: {
            STATUS: 0,
            ERROR_MSG: null,
            DATE: '2024-01-01T00:00:00+09:00'
          },
          STATISTICAL_DATA: {
            DATA_INF: {
              VALUE: [
                {
                  '@area': '13000',
                  '@cat01': 'A1101',
                  '@time': '2023',
                  '$': '14000000'
                }
              ]
            },
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  '@id': 'area',
                  '@name': '地域',
                  CLASS: [
                    {
                      '@code': '13000',
                      '@name': '東京都'
                    }
                  ]
                },
                {
                  '@id': 'cat01',
                  '@name': '分類',
                  CLASS: [
                    {
                      '@code': 'A1101',
                      '@name': '総人口'
                    }
                  ]
                },
                {
                  '@id': 'time',
                  '@name': '時間',
                  CLASS: [
                    {
                      '@code': '2023',
                      '@name': '2023年'
                    }
                  ]
                }
              ]
            }
          }
        }
      };

      mockEstatApiClient.getStatsData.mockResolvedValue(mockRawData);

      // テスト実行
      const result = await EstatStatsDataService.getAndFormatStatsData('0000010101');

      // アサーション
      expect(mockEstatApiClient.getStatsData).toHaveBeenCalledWith({
        appId: 'test-app-id',
        statsDataId: '0000010101',
        metaGetFlg: 'Y',
        cntGetFlg: 'N'
      });

      expect(result).toEqual({
        values: [
          {
            areaCode: '13000',
            areaName: '東京都',
            value: 14000000,
            unit: null,
            categoryCode: 'A1101',
            categoryName: '総人口',
            timeCode: '2023',
            timeName: '2023年'
          }
        ],
        areas: [
          {
            code: '13000',
            name: '東京都',
            level: 1
          }
        ],
        categories: [
          {
            code: 'A1101',
            name: '総人口',
            level: 1
          }
        ],
        years: [
          {
            code: '2023',
            name: '2023年'
          }
        ]
      });
    });

    it('フィルタリングオプションが正しく適用される', async () => {
      const mockRawData = {
        GET_STATS_DATA: {
          RESULT: { STATUS: 0, ERROR_MSG: null, DATE: '2024-01-01T00:00:00+09:00' },
          STATISTICAL_DATA: {
            DATA_INF: { VALUE: [] },
            CLASS_INF: { CLASS_OBJ: [] }
          }
        }
      };

      mockEstatApiClient.getStatsData.mockResolvedValue(mockRawData);

      await EstatStatsDataService.getAndFormatStatsData('0000010101', {
        categoryFilter: 'A1101',
        yearFilter: '2023',
        areaFilter: '13000',
        limit: 100
      });

      expect(mockEstatApiClient.getStatsData).toHaveBeenCalledWith({
        appId: 'test-app-id',
        statsDataId: '0000010101',
        metaGetFlg: 'Y',
        cntGetFlg: 'N',
        cdCat01: 'A1101',
        cdTime: '2023',
        cdArea: '13000',
        limit: 100
      });
    });

    it('APIエラー時に適切なエラーを投げる', async () => {
      const mockError = new Error('API Error');
      mockEstatApiClient.getStatsData.mockRejectedValue(mockError);

      await expect(
        EstatStatsDataService.getAndFormatStatsData('0000010101')
      ).rejects.toThrow('API Error');
    });

    it('無効な統計表IDでエラーを投げる', async () => {
      await expect(
        EstatStatsDataService.getAndFormatStatsData('invalid-id')
      ).rejects.toThrow();
    });
  });

  describe('getAvailableYears', () => {
    it('利用可能な年度を正しく取得できる', async () => {
      const mockRawData = {
        GET_STATS_DATA: {
          RESULT: { STATUS: 0, ERROR_MSG: null, DATE: '2024-01-01T00:00:00+09:00' },
          STATISTICAL_DATA: {
            DATA_INF: { VALUE: [] },
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  '@id': 'time',
                  '@name': '時間',
                  CLASS: [
                    { '@code': '2020', '@name': '2020年' },
                    { '@code': '2021', '@name': '2021年' },
                    { '@code': '2022', '@name': '2022年' },
                    { '@code': '2023', '@name': '2023年' }
                  ]
                }
              ]
            }
          }
        }
      };

      mockEstatApiClient.getStatsData.mockResolvedValue(mockRawData);

      const years = await EstatStatsDataService.getAvailableYears('0000010101');

      expect(years).toEqual(['2020', '2021', '2022', '2023']);
    });
  });

  describe('getPrefectureData', () => {
    it('都道府県データを正しく取得できる', async () => {
      const mockRawData = {
        GET_STATS_DATA: {
          RESULT: { STATUS: 0, ERROR_MSG: null, DATE: '2024-01-01T00:00:00+09:00' },
          STATISTICAL_DATA: {
            DATA_INF: {
              VALUE: [
                { '@area': '01000', '@cat01': 'A1101', '@time': '2023', '$': '5200000' },
                { '@area': '13000', '@cat01': 'A1101', '@time': '2023', '$': '14000000' }
              ]
            },
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  '@id': 'area',
                  '@name': '地域',
                  CLASS: [
                    { '@code': '01000', '@name': '北海道' },
                    { '@code': '13000', '@name': '東京都' }
                  ]
                }
              ]
            }
          }
        }
      };

      mockEstatApiClient.getStatsData.mockResolvedValue(mockRawData);

      const prefectureData = await EstatStatsDataService.getPrefectureData(
        '0000010101',
        { yearFilter: '2023' }
      );

      expect(prefectureData).toHaveLength(2);
      expect(prefectureData[0]).toMatchObject({
        areaCode: '01000',
        areaName: '北海道',
        value: 5200000
      });
    });
  });
});
```

### 2. EstatMetaInfoService のテスト

`src/lib/estat/metainfo/__tests__/EstatMetaInfoService.test.ts`

```typescript
import { EstatMetaInfoService } from '../EstatMetaInfoService';
import { EstatApiClient } from '@/services/estat-api';

// モック
jest.mock('@/services/estat-api');
const mockEstatApiClient = EstatApiClient as jest.Mocked<typeof EstatApiClient>;

// D1Databaseのモック
const mockD1Database = {
  prepare: jest.fn(),
  exec: jest.fn()
};

describe('EstatMetaInfoService', () => {
  let service: EstatMetaInfoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EstatMetaInfoService(mockD1Database as any);
  });

  describe('processAndSaveMetaInfo', () => {
    it('メタ情報を正しく処理・保存できる', async () => {
      const mockMetaInfo = {
        GET_META_INFO: {
          RESULT: { STATUS: 0, ERROR_MSG: null, DATE: '2024-01-01T00:00:00+09:00' },
          METADATA_INF: {
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  '@id': 'cat01',
                  '@name': '分類',
                  CLASS: [
                    {
                      '@code': 'A1101',
                      '@name': '総人口',
                      '@level': '1'
                    }
                  ]
                }
              ]
            }
          }
        }
      };

      mockEstatApiClient.getMetaInfo.mockResolvedValue(mockMetaInfo);
      mockD1Database.prepare.mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockResolvedValue({ success: true })
      });

      const result = await service.processAndSaveMetaInfo('0000010101');

      expect(mockEstatApiClient.getMetaInfo).toHaveBeenCalledWith({
        appId: 'test-app-id',
        statsDataId: '0000010101',
        metaGetFlg: 'Y',
        cntGetFlg: 'N'
      });

      expect(result).toMatchObject({
        statsDataId: '0000010101',
        processedCount: 1,
        success: true
      });
    });

    it('データベースエラー時に適切にハンドリングする', async () => {
      const mockMetaInfo = {
        GET_META_INFO: {
          RESULT: { STATUS: 0, ERROR_MSG: null, DATE: '2024-01-01T00:00:00+09:00' },
          METADATA_INF: { CLASS_INF: { CLASS_OBJ: [] } }
        }
      };

      mockEstatApiClient.getMetaInfo.mockResolvedValue(mockMetaInfo);
      mockD1Database.prepare.mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockRejectedValue(new Error('Database Error'))
      });

      await expect(
        service.processAndSaveMetaInfo('0000010101')
      ).rejects.toThrow('Database Error');
    });
  });

  describe('getSavedMetadataByStatsId', () => {
    it('保存されたメタ情報を正しく取得できる', async () => {
      const mockMetadata = [
        {
          stats_data_id: '0000010101',
          stat_name: '人口推計',
          title: '都道府県別人口',
          cat01: 'A1101',
          item_name: '総人口',
          unit: '人'
        }
      ];

      mockD1Database.prepare.mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue(mockMetadata)
      });

      const result = await service.getSavedMetadataByStatsId('0000010101');

      expect(result).toEqual(mockMetadata);
      expect(mockD1Database.prepare).toHaveBeenCalledWith(
        'SELECT * FROM estat_metainfo WHERE stats_data_id = ?'
      );
    });
  });
});
```

## ユーティリティ関数のテスト

### 1. データ変換関数のテスト

`src/lib/estat/utils/__tests__/formatters.test.ts`

```typescript
import { formatAreas, formatCategories, formatYears, formatValues } from '../formatters';

describe('Data Formatters', () => {
  describe('formatAreas', () => {
    it('地域データを正しく整形できる', () => {
      const rawAreas = [
        {
          '@id': 'area',
          '@name': '地域',
          CLASS: [
            {
              '@code': '13000',
              '@name': '東京都',
              '@level': '1'
            },
            {
              '@code': '27000',
              '@name': '大阪府',
              '@level': '1'
            }
          ]
        }
      ];

      const result = formatAreas(rawAreas);

      expect(result).toEqual([
        { code: '13000', name: '東京都', level: 1 },
        { code: '27000', name: '大阪府', level: 1 }
      ]);
    });

    it('空のデータを正しく処理できる', () => {
      const result = formatAreas([]);
      expect(result).toEqual([]);
    });
  });

  describe('formatValues', () => {
    it('値データを正しく整形できる', () => {
      const rawValues = [
        {
          '@area': '13000',
          '@cat01': 'A1101',
          '@time': '2023',
          '$': '14000000'
        }
      ];

      const areas = [{ code: '13000', name: '東京都', level: 1 }];
      const categories = [{ code: 'A1101', name: '総人口', level: 1 }];
      const years = [{ code: '2023', name: '2023年' }];

      const result = formatValues(rawValues, areas, categories, years);

      expect(result).toEqual([
        {
          areaCode: '13000',
          areaName: '東京都',
          value: 14000000,
          unit: null,
          categoryCode: 'A1101',
          categoryName: '総人口',
          timeCode: '2023',
          timeName: '2023年'
        }
      ]);
    });

    it('NULL値を正しく処理できる', () => {
      const rawValues = [
        {
          '@area': '13000',
          '@cat01': 'A1101',
          '@time': '2023',
          '$': null
        }
      ];

      const areas = [{ code: '13000', name: '東京都', level: 1 }];
      const categories = [{ code: 'A1101', name: '総人口', level: 1 }];
      const years = [{ code: '2023', name: '2023年' }];

      const result = formatValues(rawValues, areas, categories, years);

      expect(result[0].value).toBeNull();
    });
  });
});
```

## エラーハンドリングのテスト

### 1. エラー型のテスト

`src/lib/estat/types/__tests__/errors.test.ts`

```typescript
import { EstatApiError, ValidationError, DatabaseError } from '../errors';

describe('Error Types', () => {
  describe('EstatApiError', () => {
    it('正しいエラー情報を持つ', () => {
      const error = new EstatApiError('API Error', '0000010101');
      
      expect(error.message).toBe('API Error');
      expect(error.statsDataId).toBe('0000010101');
      expect(error.name).toBe('EstatApiError');
    });
  });

  describe('ValidationError', () => {
    it('バリデーションエラーの詳細を持つ', () => {
      const error = new ValidationError('Invalid parameter', {
        field: 'statsDataId',
        value: 'invalid',
        expected: '10-digit number'
      });
      
      expect(error.message).toBe('Invalid parameter');
      expect(error.details).toEqual({
        field: 'statsDataId',
        value: 'invalid',
        expected: '10-digit number'
      });
    });
  });

  describe('DatabaseError', () => {
    it('データベースエラーの詳細を持つ', () => {
      const originalError = new Error('Connection failed');
      const error = new DatabaseError('Database operation failed', originalError);
      
      expect(error.message).toBe('Database operation failed');
      expect(error.originalError).toBe(originalError);
    });
  });
});
```

## 統合テスト

### 1. サービス間の連携テスト

`src/lib/estat/__tests__/integration.test.ts`

```typescript
import { EstatStatsDataService } from '../statsdata/EstatStatsDataService';
import { EstatMetaInfoService } from '../metainfo/EstatMetaInfoService';
import { EstatApiClient } from '@/services/estat-api';

// モック
jest.mock('@/services/estat-api');
const mockEstatApiClient = EstatApiClient as jest.Mocked<typeof EstatApiClient>;

describe('Estat Services Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('統計データとメタ情報を連携して取得できる', async () => {
    // 統計データのモック
    const mockStatsData = {
      GET_STATS_DATA: {
        RESULT: { STATUS: 0, ERROR_MSG: null, DATE: '2024-01-01T00:00:00+09:00' },
        STATISTICAL_DATA: {
          DATA_INF: { VALUE: [] },
          CLASS_INF: { CLASS_OBJ: [] }
        }
      }
    };

    // メタ情報のモック
    const mockMetaInfo = {
      GET_META_INFO: {
        RESULT: { STATUS: 0, ERROR_MSG: null, DATE: '2024-01-01T00:00:00+09:00' },
        METADATA_INF: { CLASS_INF: { CLASS_OBJ: [] } }
      }
    };

    mockEstatApiClient.getStatsData.mockResolvedValue(mockStatsData);
    mockEstatApiClient.getMetaInfo.mockResolvedValue(mockMetaInfo);

    // 統計データを取得
    const statsData = await EstatStatsDataService.getAndFormatStatsData('0000010101');
    
    // メタ情報を取得
    const mockDb = { prepare: jest.fn() };
    const metaService = new EstatMetaInfoService(mockDb as any);
    mockDb.prepare.mockReturnValue({
      bind: jest.fn().mockReturnThis(),
      run: jest.fn().mockResolvedValue({ success: true })
    });
    
    const metaResult = await metaService.processAndSaveMetaInfo('0000010101');

    expect(statsData).toBeDefined();
    expect(metaResult.success).toBe(true);
  });
});
```

## テストデータの管理

### 1. テストデータファクトリ

`src/test/factories/statsDataFactory.ts`

```typescript
export class StatsDataFactory {
  static createRawStatsData(overrides: any = {}) {
    return {
      GET_STATS_DATA: {
        RESULT: {
          STATUS: 0,
          ERROR_MSG: null,
          DATE: '2024-01-01T00:00:00+09:00',
          ...overrides.RESULT
        },
        STATISTICAL_DATA: {
          DATA_INF: {
            VALUE: [
              {
                '@area': '13000',
                '@cat01': 'A1101',
                '@time': '2023',
                '$': '14000000'
              }
            ],
            ...overrides.DATA_INF
          },
          CLASS_INF: {
            CLASS_OBJ: [
              {
                '@id': 'area',
                '@name': '地域',
                CLASS: [
                  {
                    '@code': '13000',
                    '@name': '東京都'
                  }
                ]
              }
            ],
            ...overrides.CLASS_INF
          }
        }
      }
    };
  }

  static createFormattedStatsData(overrides: any = {}) {
    return {
      values: [
        {
          areaCode: '13000',
          areaName: '東京都',
          value: 14000000,
          unit: null,
          categoryCode: 'A1101',
          categoryName: '総人口',
          timeCode: '2023',
          timeName: '2023年'
        }
      ],
      areas: [
        {
          code: '13000',
          name: '東京都',
          level: 1
        }
      ],
      categories: [
        {
          code: 'A1101',
          name: '総人口',
          level: 1
        }
      ],
      years: [
        {
          code: '2023',
          name: '2023年'
        }
      ],
      ...overrides
    };
  }
}
```

### 2. テストヘルパー

`src/test/helpers/testHelpers.ts`

```typescript
export class TestHelpers {
  static async waitForAsync() {
    await new Promise(resolve => setImmediate(resolve));
  }

  static createMockD1Database() {
    return {
      prepare: jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockResolvedValue({ success: true }),
        all: jest.fn().mockResolvedValue([]),
        first: jest.fn().mockResolvedValue(null)
      }),
      exec: jest.fn().mockResolvedValue({ success: true })
    };
  }

  static createMockEstatApiClient() {
    return {
      getStatsData: jest.fn(),
      getMetaInfo: jest.fn(),
      getStatsList: jest.fn()
    };
  }
}
```

## テスト実行

### 1. テストコマンド

```bash
# 全テスト実行
npm test

# 特定のファイルのテスト
npm test EstatStatsDataService.test.ts

# カバレッジ付きテスト
npm run test:coverage

# ウォッチモード
npm run test:watch
```

### 2. 継続的インテグレーション

`.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

## 関連ドキュメント

- [テスト戦略](testing-strategy.md)
- [統合テスト](integration-testing.md)
- [モック作成ガイド](mocking-guide.md)
- [テストデータ管理](test-data.md)
