# Area ドメイン テスト戦略

## 概要

このドキュメントは、`src/features/area` ドメインの包括的なテスト戦略を定義します。
地域管理（都道府県・市区町村）機能の品質を保証し、継続的な改善を可能にするためのテストアプローチを規定します。

## 作成日

2025-11-02

## ドメインの責務

Areaドメインは以下の責務を持ちます：

1. **地域データ管理**: 都道府県・市区町村のマスターデータの提供
2. **地域コード変換・検証**: 地域コードの正規化、検証、変換処理
3. **地域ブロックマッピング**: 地域ブロック（北海道、東北など）と都道府県のマッピング
4. **地域データ取得**: R2ストレージからの地域データ取得とキャッシュ管理

## ディレクトリ構成とレイヤー

```
src/features/area/
├── types/                    # 型定義層
│   └── index.ts
├── utils/                    # ユーティリティ層（純粋関数）
│   ├── code-converter.ts     # 地域コード変換・検証
│   ├── region-mapping.ts     # 地域ブロックマッピング
│   └── index.ts
├── repositories/             # データアクセス層
│   ├── area-repository.ts    # R2ストレージアクセス
│   └── index.ts
├── services/                 # ビジネスロジック層
│   ├── prefecture-service.ts # 都道府県サービス
│   ├── city-service.ts       # 市区町村サービス
│   └── index.ts
├── actions/                  # Server Actions層
│   └── index.ts
├── components/               # UIコンポーネント層
│   ├── AreaNavigator.tsx
│   └── index.ts
└── index.ts
```

## テストツールとフレームワーク

### 単体テスト・統合テスト

- **Vitest**: テストランナー（高速、ESM対応）
- **@testing-library/react**: Reactコンポーネントのテスト
- **@testing-library/jest-dom**: DOMマッチャー
- **@testing-library/user-event**: ユーザーインタラクションのシミュレーション

### モック・スタブ

- **vi.mock()**: モジュールモック（Vitest組み込み）
- **MSW (Mock Service Worker)**: HTTPリクエストのモック（推奨）

### カバレッジ測定

- **Vitest Coverage**: c8ベースのカバレッジレポート

## テスト戦略（レイヤー別）

### 1. ユーティリティ層（utils/）

**対象ファイル**:
- `code-converter.ts` - 地域コード変換・検証（20+関数）
- `region-mapping.ts` - 地域ブロックマッピング

**テストアプローチ**: ユニットテスト（純粋関数）

**優先度**: 🔴 最高（Critical）

**理由**:
- 純粋関数で副作用がないため、テストが容易
- ドメインロジックの基盤となる重要な関数群
- バグが他の層に波及するリスクが高い

**カバレッジ目標**: 100%

#### テストすべき内容

##### code-converter.ts

1. **determineAreaType()**
   - 正常系: 全国・都道府県・市区町村コードの正しい判定
   - 異常系: 無効な形式（空文字列、null、undefined、無効な長さ）

2. **deriveParentPrefectureCode()**
   - 正常系: 市区町村コードから都道府県コードの抽出（5桁形式）
   - 異常系: 5桁未満のコード、空文字列

3. **normalizePrefectureCode()**
   - 正常系: 2桁→5桁変換、5桁はそのまま
   - 異常系: 空文字列、2桁・5桁以外の長さ

4. **extractPrefectureCode()**
   - 正常系: 5桁コードから2桁抽出、2桁コードはそのまま
   - 異常系: 2桁未満のコード

5. **validateAreaCode()**
   - 正常系: 国コード、都道府県コード、市区町村コード
   - 異常系: 範囲外（00、48-99）、非数字文字、空文字列

6. **normalizeAreaCode()**
   - 正常系: 全角→半角、空白除去、2桁→5桁変換
   - 異常系: 空文字列、無効な文字

7. **deriveDesignatedCityCode()**
   - 正常系: 政令指定都市の区（101-199）から市コード（100）を取得
   - 境界値: 100（政令市本体）、101（区の開始）、199（区の終了）、200（区外）
   - 異常系: 5桁未満、null、空文字列

8. **isDesignatedCityWard()**
   - 正常系: 区（101-199）の判定
   - 境界値: 100、101、199、200
   - 異常系: 5桁未満、null

9. **createAreaFilter()**
   - 正常系: prefecture、city、both各レベルのフィルタ関数生成
   - エッジケース: parentCode指定時の都道府県内市区町村フィルタ

10. **validateArea()**
    - 正常系: 全てのタイプの地域コード検証
    - 異常系: 全ての無効パターンのエラーメッセージ検証

11. **validatePrefectureCode() / validateCityCode()**
    - 正常系: 都道府県コード、市区町村コードの検証
    - 異常系: タイプ不一致のケース

12. **validatePrefectureName()**
    - 正常系: 都・道・府・県で終わる名称
    - 異常系: 長さ不正、末尾が都道府県でない

13. **validateAreaCodes() / areAllCodesValid()**
    - 正常系: 複数コードの一括検証
    - 異常系: 一部無効なコードが含まれる場合

**テストファイル例**:
```typescript
// src/features/area/utils/__tests__/code-converter.test.ts
import { describe, it, expect } from 'vitest';
import {
  determineAreaType,
  validateAreaCode,
  normalizeAreaCode,
  // ...
} from '../code-converter';

describe('code-converter', () => {
  describe('determineAreaType', () => {
    it('should return "national" for code 00000', () => {
      expect(determineAreaType('00000')).toBe('national');
    });

    it('should return "prefecture" for codes ending with 000', () => {
      expect(determineAreaType('13000')).toBe('prefecture');
      expect(determineAreaType('01000')).toBe('prefecture');
    });

    it('should return "city" for other 5-digit codes', () => {
      expect(determineAreaType('13113')).toBe('city');
      expect(determineAreaType('27100')).toBe('city');
    });

    it('should throw error for invalid codes', () => {
      expect(() => determineAreaType('')).toThrow('Invalid area code');
      expect(() => determineAreaType('123')).toThrow('Invalid area code format');
    });
  });

  describe('validateAreaCode', () => {
    it('should validate national code', () => {
      expect(validateAreaCode('00000')).toBe(true);
    });

    it('should validate prefecture codes (2-digit)', () => {
      expect(validateAreaCode('01')).toBe(true);
      expect(validateAreaCode('47')).toBe(true);
    });

    it('should validate prefecture codes (5-digit)', () => {
      expect(validateAreaCode('01000')).toBe(true);
      expect(validateAreaCode('47000')).toBe(true);
    });

    it('should validate city codes', () => {
      expect(validateAreaCode('13113')).toBe(true);
    });

    it('should invalidate out-of-range codes', () => {
      expect(validateAreaCode('00')).toBe(false);
      expect(validateAreaCode('48')).toBe(false);
      expect(validateAreaCode('99')).toBe(false);
    });

    it('should invalidate non-numeric codes', () => {
      expect(validateAreaCode('abc')).toBe(false);
      expect(validateAreaCode('1a000')).toBe(false);
    });
  });

  describe('normalizeAreaCode', () => {
    it('should convert full-width to half-width', () => {
      expect(normalizeAreaCode('１３')).toBe('13000');
    });

    it('should trim whitespace', () => {
      expect(normalizeAreaCode(' 13000 ')).toBe('13000');
    });

    it('should convert 2-digit to 5-digit', () => {
      expect(normalizeAreaCode('13')).toBe('13000');
    });

    it('should keep 5-digit as-is', () => {
      expect(normalizeAreaCode('13113')).toBe('13113');
    });
  });

  describe('deriveDesignatedCityCode', () => {
    it('should return parent city code for ward codes (101-199)', () => {
      expect(deriveDesignatedCityCode('14110')).toBe('14100'); // 横浜市港北区 → 横浜市
      expect(deriveDesignatedCityCode('27128')).toBe('27100'); // 大阪市○○区 → 大阪市
    });

    it('should return null for city code 100', () => {
      expect(deriveDesignatedCityCode('14100')).toBe(null);
    });

    it('should return null for codes 200+', () => {
      expect(deriveDesignatedCityCode('14201')).toBe(null);
    });

    it('should return null for invalid codes', () => {
      expect(deriveDesignatedCityCode('')).toBe(null);
      expect(deriveDesignatedCityCode('123')).toBe(null);
    });
  });
});
```

##### region-mapping.ts

1. **REGIONS定数**
   - 全8地域ブロックの定義確認
   - 都道府県コード（47都道府県）の網羅性確認

2. **PREFECTURE_TO_REGION_MAP**
   - 2桁・5桁コード両方のマッピング確認
   - 全都道府県コード（01-47）の網羅性確認

3. **getRegionByCode()**
   - 正常系: 全地域コードでの検索
   - 異常系: 存在しない地域コード

**テストファイル例**:
```typescript
// src/features/area/utils/__tests__/region-mapping.test.ts
import { describe, it, expect } from 'vitest';
import {
  REGIONS,
  PREFECTURE_TO_REGION_MAP,
  getRegionByCode,
} from '../region-mapping';

describe('region-mapping', () => {
  describe('REGIONS', () => {
    it('should have 8 regions', () => {
      expect(REGIONS).toHaveLength(8);
    });

    it('should cover all 47 prefectures', () => {
      const allPrefs = REGIONS.flatMap(r => r.prefectures);
      expect(allPrefs).toHaveLength(47);

      // 01000-47000まで全て存在するか確認
      for (let i = 1; i <= 47; i++) {
        const code = `${String(i).padStart(2, '0')}000`;
        expect(allPrefs).toContain(code);
      }
    });
  });

  describe('PREFECTURE_TO_REGION_MAP', () => {
    it('should map 2-digit codes to region', () => {
      expect(PREFECTURE_TO_REGION_MAP['13']).toBe('kanto');
      expect(PREFECTURE_TO_REGION_MAP['01']).toBe('hokkaido');
    });

    it('should map 5-digit codes to region', () => {
      expect(PREFECTURE_TO_REGION_MAP['13000']).toBe('kanto');
      expect(PREFECTURE_TO_REGION_MAP['01000']).toBe('hokkaido');
    });

    it('should have mapping for all 47 prefectures (both formats)', () => {
      // 2桁形式
      for (let i = 1; i <= 47; i++) {
        const code2 = String(i).padStart(2, '0');
        expect(PREFECTURE_TO_REGION_MAP[code2]).toBeDefined();
      }

      // 5桁形式
      for (let i = 1; i <= 47; i++) {
        const code5 = `${String(i).padStart(2, '0')}000`;
        expect(PREFECTURE_TO_REGION_MAP[code5]).toBeDefined();
      }
    });
  });

  describe('getRegionByCode', () => {
    it('should return region for valid code', () => {
      const kanto = getRegionByCode('kanto');
      expect(kanto).toBeDefined();
      expect(kanto?.regionName).toBe('関東地方');
    });

    it('should return undefined for invalid code', () => {
      expect(getRegionByCode('invalid')).toBeUndefined();
    });
  });
});
```

---

### 2. リポジトリ層（repositories/）

**対象ファイル**:
- `area-repository.ts` - R2ストレージからのデータ取得

**テストアプローチ**: 統合テスト + モック

**優先度**: 🟠 高（High）

**理由**:
- 外部依存（R2ストレージ、ファイルシステム）が多い
- キャッシュ戦略の検証が必要
- エラーハンドリングの検証が重要

**カバレッジ目標**: 90%

#### テストすべき内容

1. **fetchPrefectures()**
   - 正常系: R2からのデータ取得成功（本番環境想定）
   - 正常系: ローカルモックデータへのフォールバック（開発環境）
   - 異常系: R2接続失敗時のエラーハンドリング（本番環境）
   - 異常系: ローカルモックデータ読み込み失敗（開発環境）
   - 異常系: R2_PUBLIC_URL未設定
   - 異常系: レスポンスが配列でない
   - キャッシュ: 開発環境は`no-store`、本番環境は`force-cache`

2. **fetchCities()**
   - 上記と同様のテストケース

3. **assertServer()**
   - クライアントサイドからの呼び出しをブロック

**モック戦略**:
- `fetch()`: vi.spyOn(global, 'fetch')でモック
- `process.env.R2_PUBLIC_URL`: vi.stubEnvでモック
- `process.env.NODE_ENV`: 環境切り替え
- `fs.readFileSync`: vi.mockでモック

**テストファイル例**:
```typescript
// src/features/area/repositories/__tests__/area-repository.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPrefectures, fetchCities } from '../area-repository';

describe('area-repository', () => {
  beforeEach(() => {
    vi.stubEnv('R2_PUBLIC_URL', 'https://example.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('fetchPrefectures', () => {
    it('should fetch prefectures from R2 in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      const mockData = [
        { prefCode: '01000', prefName: '北海道' },
        { prefCode: '13000', prefName: '東京都' },
      ];

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await fetchPrefectures();

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://example.com/area/prefectures.json',
        expect.objectContaining({
          cache: 'force-cache',
          next: { revalidate: 86400, tags: ['area-prefectures'] },
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should use no-store cache in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');

      const mockData = [{ prefCode: '01000', prefName: '北海道' }];
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      await fetchPrefectures();

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cache: 'no-store',
          next: undefined,
        })
      );
    });

    it('should fallback to local mock in development when R2 fails', async () => {
      vi.stubEnv('NODE_ENV', 'development');

      // R2 fetch失敗をシミュレート
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      // fs.readFileSyncのモック（動的インポート対応）
      const mockLocalData = [{ prefCode: '01000', prefName: '北海道' }];
      vi.mock('fs', () => ({
        readFileSync: vi.fn(() => JSON.stringify(mockLocalData)),
      }));

      const result = await fetchPrefectures();
      expect(result).toEqual(mockLocalData);
    });

    it('should throw DataSourceError in production when R2 fails', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      await expect(fetchPrefectures()).rejects.toThrow('Failed to load data from R2 storage');
    });

    it('should throw error when R2_PUBLIC_URL is not set', async () => {
      vi.stubEnv('R2_PUBLIC_URL', '');

      await expect(fetchPrefectures()).rejects.toThrow('R2_PUBLIC_URL is not configured');
    });

    it('should throw error when response is not ok', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await expect(fetchPrefectures()).rejects.toThrow('Failed to fetch prefectures from R2: 404');
    });

    it('should throw error when response data is not array', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'data' }),
      } as Response);

      await expect(fetchPrefectures()).rejects.toThrow('Invalid data structure: expected array');
    });
  });

  describe('fetchCities', () => {
    // fetchPrefecturesと同様のテストケース
  });

  describe('assertServer', () => {
    it('should throw error when called from client', () => {
      // windowオブジェクトを一時的にモック
      global.window = {} as any;

      expect(() => {
        // assertServer()を直接テストするためにリポジトリ関数を呼び出し
      }).toThrow('AreaRepository is server-only');

      delete (global as any).window;
    });
  });
});
```

---

### 3. サービス層（services/）

**対象ファイル**:
- `prefecture-service.ts` - 都道府県サービス
- `city-service.ts` - 市区町村サービス

**テストアプローチ**: ユニットテスト + モック

**優先度**: 🟡 中（Medium）

**理由**:
- ビジネスロジックはシンプル（主にデータ変換とフィルタリング）
- リポジトリ層への依存をモック可能

**カバレッジ目標**: 85%

#### テストすべき内容

##### prefecture-service.ts

1. **listPrefectures()**
   - リポジトリからのデータ取得確認

2. **findPrefectureByCode()**
   - 正常系: 存在するコードでの検索
   - 異常系: 存在しないコードはnull

3. **getRegionKeyFromPrefectureCode()**
   - 正常系: 2桁・5桁コード両方で地域キー取得
   - 異常系: 範囲外コードは"unknown"

4. **buildRegionMapping() / listRegions()**
   - 地域マッピング生成の確認

**テストファイル例**:
```typescript
// src/features/area/services/__tests__/prefecture-service.test.ts
import { describe, it, expect, vi } from 'vitest';
import * as prefectureService from '../prefecture-service';
import * as areaRepository from '../../repositories/area-repository';

vi.mock('../../repositories/area-repository');

describe('prefecture-service', () => {
  const mockPrefectures = [
    { prefCode: '01000', prefName: '北海道' },
    { prefCode: '13000', prefName: '東京都' },
    { prefCode: '27000', prefName: '大阪府' },
  ];

  beforeEach(() => {
    vi.mocked(areaRepository.fetchPrefectures).mockResolvedValue(mockPrefectures);
  });

  describe('listPrefectures', () => {
    it('should return all prefectures', async () => {
      const result = await prefectureService.listPrefectures();
      expect(result).toEqual(mockPrefectures);
    });
  });

  describe('findPrefectureByCode', () => {
    it('should return prefecture for valid code', async () => {
      const result = await prefectureService.findPrefectureByCode('13000');
      expect(result).toEqual({ prefCode: '13000', prefName: '東京都' });
    });

    it('should return null for non-existent code', async () => {
      const result = await prefectureService.findPrefectureByCode('99000');
      expect(result).toBe(null);
    });
  });

  describe('getRegionKeyFromPrefectureCode', () => {
    it('should return region key for 5-digit code', () => {
      expect(prefectureService.getRegionKeyFromPrefectureCode('13000')).toBe('kanto');
    });

    it('should return region key for 2-digit code', () => {
      expect(prefectureService.getRegionKeyFromPrefectureCode('13')).toBe('kanto');
    });

    it('should return "unknown" for invalid code', () => {
      expect(prefectureService.getRegionKeyFromPrefectureCode('99000')).toBe('unknown');
    });
  });

  describe('buildRegionMapping', () => {
    it('should build region mapping', () => {
      const mapping = prefectureService.buildRegionMapping();
      expect(mapping).toHaveProperty('hokkaido');
      expect(mapping).toHaveProperty('kanto');
      expect(mapping.kanto).toContain('13000');
    });
  });
});
```

##### city-service.ts

1. **listMunicipalities()**
   - リポジトリからのデータ取得確認

2. **listMunicipalitiesByPrefecture()**
   - 正常系: 指定都道府県内の市区町村のフィルタリング
   - エッジケース: 該当なしの場合は空配列

3. **findMunicipalityByCode()**
   - 正常系: 存在するコードでの検索
   - 異常系: 存在しないコードはエラー

4. **searchMunicipalities() / searchMunicipalitiesInPrefecture()**
   - 正常系: 名称部分一致検索
   - エッジケース: 大文字小文字の区別なし

5. **lookupMunicipalityName()**
   - 正常系: コードから名称の逆引き
   - 異常系: 存在しないコードはnull

6. **buildMunicipalityStats()**
   - 統計情報生成の確認（総数、都道府県別カウント）

**テストファイル例**:
```typescript
// src/features/area/services/__tests__/city-service.test.ts
import { describe, it, expect, vi } from 'vitest';
import * as cityService from '../city-service';
import * as areaRepository from '../../repositories/area-repository';

vi.mock('../../repositories/area-repository');

describe('city-service', () => {
  const mockCities = [
    { cityCode: '13101', cityName: '千代田区', prefCode: '13000', level: '3' },
    { cityCode: '13113', cityName: '渋谷区', prefCode: '13000', level: '3' },
    { cityCode: '27100', cityName: '大阪市', prefCode: '27000', level: '2' },
  ];

  beforeEach(() => {
    vi.mocked(areaRepository.fetchCities).mockResolvedValue(mockCities);
  });

  describe('listMunicipalities', () => {
    it('should return all municipalities', async () => {
      const result = await cityService.listMunicipalities();
      expect(result).toEqual(mockCities);
    });
  });

  describe('listMunicipalitiesByPrefecture', () => {
    it('should filter cities by prefecture', async () => {
      const result = await cityService.listMunicipalitiesByPrefecture('13000');
      expect(result).toHaveLength(2);
      expect(result.every(c => c.prefCode === '13000')).toBe(true);
    });

    it('should return empty array for prefecture with no cities', async () => {
      const result = await cityService.listMunicipalitiesByPrefecture('99000');
      expect(result).toEqual([]);
    });
  });

  describe('findMunicipalityByCode', () => {
    it('should return city for valid code', async () => {
      const result = await cityService.findMunicipalityByCode('13113');
      expect(result.cityName).toBe('渋谷区');
    });

    it('should throw error for non-existent code', async () => {
      await expect(cityService.findMunicipalityByCode('99999')).rejects.toThrow('City not found: 99999');
    });
  });

  describe('searchMunicipalities', () => {
    it('should search cities by name (case-insensitive)', async () => {
      const result = await cityService.searchMunicipalities('区');
      expect(result).toHaveLength(2);
    });

    it('should handle uppercase query', async () => {
      const result = await cityService.searchMunicipalities('大阪');
      expect(result).toHaveLength(1);
      expect(result[0].cityName).toBe('大阪市');
    });
  });

  describe('lookupMunicipalityName', () => {
    it('should return name for valid code', async () => {
      const name = await cityService.lookupMunicipalityName('13113');
      expect(name).toBe('渋谷区');
    });

    it('should return null for non-existent code', async () => {
      const name = await cityService.lookupMunicipalityName('99999');
      expect(name).toBe(null);
    });
  });

  describe('buildMunicipalityStats', () => {
    it('should build statistics', async () => {
      const stats = await cityService.buildMunicipalityStats();
      expect(stats.total).toBe(3);
      expect(stats.byPrefecture['13000']).toBe(2);
      expect(stats.byPrefecture['27000']).toBe(1);
    });
  });
});
```

---

### 4. Server Actions層（actions/）

**対象ファイル**:
- `actions/index.ts` - Server Actions

**テストアプローチ**: 統合テスト + モック

**優先度**: 🟡 中（Medium）

**理由**:
- Next.js Server Actionsの動作確認
- リポジトリ層への依存をモック可能
- キャッシュ無効化のテスト

**カバレッジ目標**: 80%

#### テストすべき内容

1. **listPrefecturesAction()**
   - リポジトリからのデータ取得確認
   - "use cache"ディレクティブの動作確認

2. **listCitiesAction()**
   - 上記と同様

3. **revalidatePrefecturesAction() / revalidateCitiesAction()**
   - キャッシュタグの無効化確認

**テストファイル例**:
```typescript
// src/features/area/actions/__tests__/index.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  listPrefecturesAction,
  listCitiesAction,
  revalidatePrefecturesAction,
  revalidateCitiesAction,
} from '../index';
import * as areaRepository from '../../repositories/area-repository';
import { revalidateTag } from 'next/cache';

vi.mock('../../repositories/area-repository');
vi.mock('next/cache');

describe('area-actions', () => {
  describe('listPrefecturesAction', () => {
    it('should call fetchPrefectures', async () => {
      const mockData = [{ prefCode: '01000', prefName: '北海道' }];
      vi.mocked(areaRepository.fetchPrefectures).mockResolvedValue(mockData);

      const result = await listPrefecturesAction();
      expect(result).toEqual(mockData);
      expect(areaRepository.fetchPrefectures).toHaveBeenCalled();
    });
  });

  describe('listCitiesAction', () => {
    it('should call fetchCities', async () => {
      const mockData = [{ cityCode: '13113', cityName: '渋谷区', prefCode: '13000', level: '3' }];
      vi.mocked(areaRepository.fetchCities).mockResolvedValue(mockData);

      const result = await listCitiesAction();
      expect(result).toEqual(mockData);
      expect(areaRepository.fetchCities).toHaveBeenCalled();
    });
  });

  describe('revalidatePrefecturesAction', () => {
    it('should revalidate area-prefectures tag', async () => {
      await revalidatePrefecturesAction();
      expect(revalidateTag).toHaveBeenCalledWith('area-prefectures');
    });
  });

  describe('revalidateCitiesAction', () => {
    it('should revalidate area-cities tag', async () => {
      await revalidateCitiesAction();
      expect(revalidateTag).toHaveBeenCalledWith('area-cities');
    });
  });
});
```

---

### 5. UIコンポーネント層（components/）

**対象ファイル**:
- `AreaNavigator.tsx` - 地域選択ナビゲーター

**テストアプローチ**: コンポーネントテスト（RTL）

**優先度**: 🟡 中（Medium）

**理由**:
- ユーザーインタラクションが多い
- ルーティングロジックの確認が必要
- 状態管理の動作確認

**カバレッジ目標**: 75%

#### テストすべき内容

1. **レンダリング**
   - 初期表示（全国タブ選択状態）
   - 地域タイプタブの表示

2. **地域タイプ選択**
   - 全国タブ選択
   - 都道府県タブ選択 → 都道府県セレクター表示
   - 市区町村タブ選択 → 都道府県・市区町村セレクター表示

3. **都道府県選択**
   - セレクターからの選択
   - 選択値の状態更新

4. **市区町村選択**
   - 都道府県選択後に市区町村リストがフィルタリングされる
   - 都道府県変更時に市区町村選択がリセットされる

5. **送信ボタン**
   - 有効/無効の切り替え
   - 全国: 常に有効
   - 都道府県: 都道府県選択後に有効
   - 市区町村: 都道府県・市区町村両方選択後に有効

6. **ナビゲーション**
   - 送信時に正しいURLへ遷移（router.push）
   - 全国: `/[category]/[subcategory]/dashboard/00000`
   - 都道府県: `/[category]/[subcategory]/dashboard/[prefCode]`
   - 市区町村: `/[category]/[subcategory]/dashboard/[cityCode]`

7. **エラーハンドリング**
   - データ取得失敗時のエラーメッセージ表示

**テストファイル例**:
```typescript
// src/features/area/components/__tests__/AreaNavigator.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AreaNavigator } from '../AreaNavigator';
import * as areaActions from '../../actions';

// Next.jsのフックをモック
vi.mock('next/navigation', () => ({
  useParams: () => ({ category: 'agriculture', subcategory: 'rice' }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../../actions');

describe('AreaNavigator', () => {
  const mockPrefectures = [
    { prefCode: '13000', prefName: '東京都' },
    { prefCode: '27000', prefName: '大阪府' },
  ];

  const mockCities = [
    { cityCode: '13101', cityName: '千代田区', prefCode: '13000', level: '3' },
    { cityCode: '13113', cityName: '渋谷区', prefCode: '13000', level: '3' },
    { cityCode: '27100', cityName: '大阪市', prefCode: '27000', level: '2' },
  ];

  beforeEach(() => {
    vi.mocked(areaActions.listPrefecturesAction).mockResolvedValue(mockPrefectures);
    vi.mocked(areaActions.listCitiesAction).mockResolvedValue(mockCities);
  });

  it('should render area type tabs', async () => {
    render(<AreaNavigator />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '全国' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '都道府県' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '市区町村' })).toBeInTheDocument();
    });
  });

  it('should show prefecture selector when prefecture tab is selected', async () => {
    const user = userEvent.setup();
    render(<AreaNavigator />);

    const prefTab = await screen.findByRole('tab', { name: '都道府県' });
    await user.click(prefTab);

    expect(screen.getByLabelText('都道府県')).toBeInTheDocument();
  });

  it('should show both prefecture and city selectors when city tab is selected', async () => {
    const user = userEvent.setup();
    render(<AreaNavigator />);

    const cityTab = await screen.findByRole('tab', { name: '市区町村' });
    await user.click(cityTab);

    expect(screen.getAllByLabelText('都道府県')).toHaveLength(1);
    expect(screen.getByLabelText('市区町村')).toBeInTheDocument();
  });

  it('should filter cities when prefecture is selected', async () => {
    const user = userEvent.setup();
    render(<AreaNavigator />);

    // 市区町村タブを選択
    const cityTab = await screen.findByRole('tab', { name: '市区町村' });
    await user.click(cityTab);

    // 都道府県を選択
    const prefSelect = screen.getByLabelText('都道府県');
    await user.click(prefSelect);
    const tokyoOption = await screen.findByText('東京都');
    await user.click(tokyoOption);

    // 市区町村セレクターを開く
    const citySelect = screen.getByLabelText('市区町村');
    await user.click(citySelect);

    // 東京都の市区町村のみ表示される
    expect(await screen.findByText('千代田区')).toBeInTheDocument();
    expect(await screen.findByText('渋谷区')).toBeInTheDocument();
    expect(screen.queryByText('大阪市')).not.toBeInTheDocument();
  });

  it('should reset city selection when prefecture changes', async () => {
    const user = userEvent.setup();
    render(<AreaNavigator />);

    const cityTab = await screen.findByRole('tab', { name: '市区町村' });
    await user.click(cityTab);

    // 東京都を選択
    const prefSelect = screen.getByLabelText('都道府県');
    await user.click(prefSelect);
    await user.click(await screen.findByText('東京都'));

    // 市区町村を選択
    const citySelect = screen.getByLabelText('市区町村');
    await user.click(citySelect);
    await user.click(await screen.findByText('渋谷区'));

    // 都道府県を大阪府に変更
    await user.click(prefSelect);
    await user.click(await screen.findByText('大阪府'));

    // 市区町村の選択がリセットされる（プレースホルダーが表示される）
    expect(citySelect).toHaveTextContent('選択してください');
  });

  it('should enable submit button for national level', async () => {
    render(<AreaNavigator />);

    const submitButton = await screen.findByRole('button', { name: 'ダッシュボードへ' });
    expect(submitButton).toBeEnabled();
  });

  it('should enable submit button when prefecture is selected', async () => {
    const user = userEvent.setup();
    render(<AreaNavigator />);

    const prefTab = await screen.findByRole('tab', { name: '都道府県' });
    await user.click(prefTab);

    const submitButton = screen.getByRole('button', { name: 'ダッシュボードへ' });
    expect(submitButton).toBeDisabled();

    const prefSelect = screen.getByLabelText('都道府県');
    await user.click(prefSelect);
    await user.click(await screen.findByText('東京都'));

    expect(submitButton).toBeEnabled();
  });

  it('should navigate to correct URL on submit', async () => {
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush });

    const user = userEvent.setup();
    render(<AreaNavigator />);

    // 全国で送信
    const submitButton = await screen.findByRole('button', { name: 'ダッシュボードへ' });
    await user.click(submitButton);

    expect(mockPush).toHaveBeenCalledWith('/agriculture/rice/dashboard/00000');
  });

  it('should display error message when data loading fails', async () => {
    vi.mocked(areaActions.listPrefecturesAction).mockRejectedValue(new Error('Network error'));

    render(<AreaNavigator />);

    await waitFor(() => {
      expect(screen.getByText('地域データの読み込みに失敗しました')).toBeInTheDocument();
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

# 特定のファイルのみテスト
npm run test src/features/area/utils/__tests__/code-converter.test.ts

# ウォッチモード（開発時）
npm run test:watch

# UIモード（対話的なテスト実行）
npm run test:ui
```

### カバレッジ基準

以下のカバレッジ基準を満たすことを目標とします：

| レイヤー | 目標カバレッジ | 優先度 |
|---------|-------------|--------|
| ユーティリティ層（utils/） | 100% | 最高 |
| リポジトリ層（repositories/） | 90% | 高 |
| サービス層（services/） | 85% | 中 |
| Server Actions層（actions/） | 80% | 中 |
| コンポーネント層（components/） | 75% | 中 |

### CI/CDパイプライン統合

```yaml
# .github/workflows/test.yml
name: Test Area Domain

on:
  push:
    paths:
      - 'src/features/area/**'
  pull_request:
    paths:
      - 'src/features/area/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage -- src/features/area
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## テスト実装の優先順位

### フェーズ1: 基盤テスト（最優先）

1. ✅ **ユーティリティ層のテスト**
   - `code-converter.ts`: 全関数のユニットテスト
   - `region-mapping.ts`: データ整合性テスト

**理由**: ドメインロジックの基盤となる純粋関数群。他の層が依存するため最優先。

### フェーズ2: データ層テスト（高優先）

2. ✅ **リポジトリ層のテスト**
   - `area-repository.ts`: R2接続、キャッシュ、エラーハンドリング

**理由**: 外部依存が多く、障害発生時の影響が大きい。

### フェーズ3: ビジネスロジックテスト（中優先）

3. ✅ **サービス層のテスト**
   - `prefecture-service.ts`
   - `city-service.ts`

4. ✅ **Server Actions層のテスト**
   - `actions/index.ts`

**理由**: ビジネスロジックの正確性を保証。リポジトリ層をモック可能。

### フェーズ4: UIテスト（中優先）

5. ✅ **コンポーネント層のテスト**
   - `AreaNavigator.tsx`

**理由**: ユーザー体験に直結するが、手動テストでもカバー可能。

---

## モックデータの管理

### モックデータの配置

```
tests/
└── fixtures/
    └── area/
        ├── prefectures.json   # 都道府県モックデータ
        └── cities.json         # 市区町村モックデータ
```

### モックデータの内容例

**prefectures.json**:
```json
[
  { "prefCode": "01000", "prefName": "北海道" },
  { "prefCode": "13000", "prefName": "東京都" },
  { "prefCode": "27000", "prefName": "大阪府" },
  { "prefCode": "47000", "prefName": "沖縄県" }
]
```

**cities.json**:
```json
[
  { "cityCode": "13101", "cityName": "千代田区", "prefCode": "13000", "level": "3" },
  { "cityCode": "13113", "cityName": "渋谷区", "prefCode": "13000", "level": "3" },
  { "cityCode": "14100", "cityName": "横浜市", "prefCode": "14000", "level": "2" },
  { "cityCode": "14110", "cityName": "横浜市港北区", "prefCode": "14000", "level": "3" }
]
```

---

## テストのベストプラクティス

### 1. テスト命名規則

```typescript
// ✅ Good: 明確で読みやすい
describe('determineAreaType', () => {
  it('should return "prefecture" for codes ending with 000', () => {
    // ...
  });
});

// ❌ Bad: 曖昧で理解しづらい
describe('determineAreaType', () => {
  it('works', () => {
    // ...
  });
});
```

### 2. AAA（Arrange-Act-Assert）パターン

```typescript
it('should validate area code', () => {
  // Arrange（準備）
  const validCode = '13000';
  const invalidCode = 'abc';

  // Act（実行）
  const validResult = validateAreaCode(validCode);
  const invalidResult = validateAreaCode(invalidCode);

  // Assert（検証）
  expect(validResult).toBe(true);
  expect(invalidResult).toBe(false);
});
```

### 3. テストの独立性

```typescript
// ✅ Good: 各テストが独立
describe('prefecture service', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    vi.clearAllMocks();
  });

  it('test 1', () => { /* ... */ });
  it('test 2', () => { /* ... */ });
});

// ❌ Bad: テスト間で状態を共有
let sharedState;
it('test 1', () => {
  sharedState = 'foo'; // 次のテストに影響
});
it('test 2', () => {
  expect(sharedState).toBe('foo'); // test 1に依存
});
```

### 4. エッジケースのテスト

```typescript
describe('normalizeAreaCode', () => {
  it('should handle normal input', () => {
    expect(normalizeAreaCode('13')).toBe('13000');
  });

  // エッジケース
  it('should handle full-width characters', () => {
    expect(normalizeAreaCode('１３')).toBe('13000');
  });

  it('should handle whitespace', () => {
    expect(normalizeAreaCode(' 13 ')).toBe('13000');
  });

  it('should throw on empty string', () => {
    expect(() => normalizeAreaCode('')).toThrow();
  });
});
```

---

## 継続的な改善

### テストメトリクスの追跡

以下のメトリクスを定期的に確認・改善します：

- **コードカバレッジ**: 目標値の達成状況
- **テスト実行時間**: パフォーマンス劣化の検出
- **テスト失敗率**: 品質指標
- **テストメンテナンスコスト**: テストの保守性

### レビュープロセス

- 新機能追加時は必ずテストを含める
- PRレビュー時にテストカバレッジを確認
- 定期的なテストコードレビュー（月1回）

---

## 参考資料

- [Vitest公式ドキュメント](https://vitest.dev/)
- [Testing Library公式ドキュメント](https://testing-library.com/)
- [Next.js Testing Best Practices](https://nextjs.org/docs/testing)

---

## 更新履歴

| 日付 | 変更内容 | 担当者 |
|------|---------|--------|
| 2025-11-02 | 初版作成 | Claude |

---

## 付録: テストコマンド一覧

```bash
# 単体テスト
npm run test src/features/area/utils/__tests__/code-converter.test.ts
npm run test src/features/area/utils/__tests__/region-mapping.test.ts
npm run test src/features/area/repositories/__tests__/area-repository.test.ts
npm run test src/features/area/services/__tests__/prefecture-service.test.ts
npm run test src/features/area/services/__tests__/city-service.test.ts
npm run test src/features/area/actions/__tests__/index.test.ts
npm run test src/features/area/components/__tests__/AreaNavigator.test.tsx

# レイヤー別テスト
npm run test src/features/area/utils
npm run test src/features/area/repositories
npm run test src/features/area/services
npm run test src/features/area/actions
npm run test src/features/area/components

# ドメイン全体テスト
npm run test src/features/area

# カバレッジレポート生成
npm run test:coverage src/features/area

# ウォッチモード（開発時）
npm run test:watch src/features/area
```
