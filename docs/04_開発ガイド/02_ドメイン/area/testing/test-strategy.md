---
title: テスト戦略
created: 2025-01-16
updated: 2025-01-16
status: published
tags:
  - stats47
  - domain/area
  - type/testing
author: 開発チーム
version: 1.0.0
related:
  - "[[地域ドメイン概要]]"
  - "[[API仕様]]"
---

# テスト戦略

## 概要

地域ドメインの包括的なテスト戦略を定義します。単体テスト、統合テスト、パフォーマンステストの各レベルでのテスト方針を説明します。

## テストピラミッド

```
        E2E Tests
       ┌─────────┐
      │   少数   │
     └───────────┘
    Integration Tests
   ┌─────────────────┐
  │      中程度      │
 └───────────────────┘
  Unit Tests
 ┌─────────────────────┐
│        多数          │
└─────────────────────┘
```

### テスト分布

- **単体テスト**: 80% - 各サービスクラスの全メソッド
- **統合テスト**: 15% - サービス間の連携
- **E2E テスト**: 5% - ユーザーシナリオ

## 単体テスト

### テスト対象

#### PrefectureService

- [x] `getAllPrefectures()` - 全 47 都道府県の取得
- [x] `getPrefectureByCode()` - コードによる取得（2 桁・5 桁）
- [x] `getPrefectureByName()` - 名前による取得
- [x] `getPrefectureNameFromCode()` - コード → 名前変換
- [x] `getPrefectureCodeFromName()` - 名前 → コード変換
- [x] `getAllRegions()` - 全地域ブロック取得
- [x] `getRegionByKey()` - キーによる地域ブロック取得
- [x] `getRegionByPrefecture()` - 都道府県の地域ブロック取得
- [x] `getPrefecturesByRegion()` - 地域ブロック内の都道府県取得
- [x] `searchPrefectures()` - 都道府県検索
- [x] `existsPrefecture()` - 存在確認
- [x] `getPrefectureMap()` - マップ取得
- [x] `getPrefectureNameToCodeMap()` - 名前 → コードマップ取得

#### MunicipalityService

- [ ] `getAllMunicipalities()` - 全市区町村取得
- [ ] `getMunicipalityByCode()` - コードによる取得
- [ ] `getMunicipalityByName()` - 名前による取得
- [ ] `getMunicipalitiesByPrefecture()` - 都道府県別取得
- [ ] `getMunicipalitiesByType()` - タイプ別取得
- [ ] `getMunicipalitiesByPrefectureAndType()` - 都道府県 × タイプ取得
- [ ] `searchMunicipalities()` - 市区町村検索
- [ ] `existsMunicipality()` - 存在確認
- [ ] `getDesignatedCityWards()` - 政令指定都市の区取得
- [ ] `getParentCity()` - 親市取得
- [ ] `getCount()` - 件数取得
- [ ] `getCountByPrefecture()` - 都道府県別件数
- [ ] `getCountByType()` - タイプ別件数

#### AreaService

- [ ] `getAreaByCode()` - 地域情報取得
- [ ] `getAreaType()` - 地域タイプ判定
- [ ] `getParentArea()` - 親地域取得
- [ ] `getChildAreas()` - 子地域取得
- [ ] `getHierarchyPath()` - 階層パス取得
- [ ] `getFullAreaName()` - 完全名称取得
- [ ] `searchAreas()` - 地域検索
- [ ] `getHierarchyLevel()` - 階層レベル取得
- [ ] `getCommonAncestor()` - 共通祖先取得
- [ ] `isDescendantOf()` - 子孫関係確認
- [ ] `getStatistics()` - 統計取得

#### バリデーション関数

- [ ] `validateArea()` - 地域コード検証
- [ ] `validatePrefectureCode()` - 都道府県コード検証
- [ ] `validateMunicipalityCode()` - 市区町村コード検証
- [ ] `validatePrefectureName()` - 都道府県名検証
- [ ] `validateAreaCodes()` - 一括検証
- [ ] `areAllCodesValid()` - 全コード有効性確認

#### ユーティリティ関数

- [ ] `getAreaType()` - 地域タイプ判定
- [ ] `getParentPrefectureCode()` - 親都道府県コード取得
- [ ] `normalizePrefectureCode()` - 都道府県コード正規化
- [ ] `extractPrefectureCode()` - 都道府県コード抽出
- [ ] `validateAreaCode()` - 地域コード検証
- [ ] `normalizeAreaCode()` - 地域コード正規化
- [ ] `getDesignatedCityCode()` - 政令指定都市コード取得
- [ ] `isDesignatedCityWard()` - 政令指定都市の区判定

### テストケース設計

#### 正常系テスト

```typescript
describe("正常系", () => {
  it("有効な都道府県コードで都道府県を取得できる", () => {
    const pref = PrefectureService.getPrefectureByCode("13");
    expect(pref).not.toBeNull();
    expect(pref?.prefName).toBe("東京都");
  });
});
```

#### 異常系テスト

```typescript
describe("異常系", () => {
  it("無効な都道府県コードでnullを返す", () => {
    const pref = PrefectureService.getPrefectureByCode("99");
    expect(pref).toBeNull();
  });
});
```

#### 境界値テスト

```typescript
describe("境界値", () => {
  it("最小の都道府県コード（01）で北海道を取得できる", () => {
    const pref = PrefectureService.getPrefectureByCode("01");
    expect(pref?.prefName).toBe("北海道");
  });

  it("最大の都道府県コード（47）で沖縄県を取得できる", () => {
    const pref = PrefectureService.getPrefectureByCode("47");
    expect(pref?.prefName).toBe("沖縄県");
  });
});
```

#### エッジケーステスト

```typescript
describe("エッジケース", () => {
  it("空文字列でnullを返す", () => {
    const pref = PrefectureService.getPrefectureByCode("");
    expect(pref).toBeNull();
  });

  it("nullでnullを返す", () => {
    const pref = PrefectureService.getPrefectureByCode(null as any);
    expect(pref).toBeNull();
  });
});
```

### テストデータ

#### 都道府県テストデータ

```typescript
const TEST_PREFECTURES = [
  { code: "01", name: "北海道", region: "hokkaido-tohoku" },
  { code: "13", name: "東京都", region: "kanto-chubu" },
  { code: "27", name: "大阪府", region: "kinki" },
  { code: "47", name: "沖縄県", region: "kyushu-okinawa" },
];
```

#### 市区町村テストデータ

```typescript
const TEST_MUNICIPALITIES = [
  { code: "13101", name: "千代田区", prefCode: "13", type: "ward" },
  { code: "01100", name: "札幌市", prefCode: "01", type: "city" },
  {
    code: "01101",
    name: "中央区",
    prefCode: "01",
    parentCode: "01100",
    type: "ward",
  },
];
```

## 統合テスト

### サービス間連携テスト

#### 都道府県 → 市区町村連携

```typescript
describe("都道府県→市区町村連携", () => {
  it("都道府県の市区町村を正しく取得できる", () => {
    const prefecture = PrefectureService.getPrefectureByCode("13");
    const municipalities =
      MunicipalityService.getMunicipalitiesByPrefecture("13");

    expect(prefecture).not.toBeNull();
    expect(municipalities.length).toBeGreaterThan(0);
    expect(municipalities.every((m) => m.prefCode === "13")).toBe(true);
  });
});
```

#### 階層関係テスト

```typescript
describe("階層関係", () => {
  it("市区町村から都道府県への階層関係が正しい", () => {
    const municipality = MunicipalityService.getMunicipalityByCode("13101");
    const parentArea = AreaService.getParentArea("13101");

    expect(municipality?.prefCode).toBe("13");
    expect(parentArea?.areaCode).toBe("13000");
    expect(parentArea?.areaName).toBe("東京都");
  });
});
```

### データ整合性テスト

#### 都道府県データ整合性

```typescript
describe("都道府県データ整合性", () => {
  it("全47都道府県が存在する", () => {
    const prefectures = PrefectureService.getAllPrefectures();
    expect(prefectures).toHaveLength(47);
  });

  it("都道府県コードが一意である", () => {
    const prefectures = PrefectureService.getAllPrefectures();
    const codes = prefectures.map((p) => p.prefCode);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });
});
```

#### 市区町村データ整合性

```typescript
describe("市区町村データ整合性", () => {
  it("全ての市区町村が有効な都道府県に属する", () => {
    const municipalities = MunicipalityService.getAllMunicipalities();
    const prefectureCodes = new Set(
      PrefectureService.getAllPrefectures().map((p) =>
        p.prefCode.substring(0, 2)
      )
    );

    municipalities.forEach((munic) => {
      expect(prefectureCodes.has(munic.prefCode)).toBe(true);
    });
  });
});
```

## パフォーマンステスト

### レスポンス時間テスト

```typescript
describe("パフォーマンス", () => {
  it("都道府県取得が1ms以内で完了する", () => {
    const start = performance.now();
    PrefectureService.getAllPrefectures();
    const end = performance.now();

    expect(end - start).toBeLessThan(1);
  });

  it("市区町村検索が10ms以内で完了する", () => {
    const start = performance.now();
    MunicipalityService.searchMunicipalities({ query: "中央", limit: 10 });
    const end = performance.now();

    expect(end - start).toBeLessThan(10);
  });
});
```

### メモリ使用量テスト

```typescript
describe("メモリ使用量", () => {
  it("初期化後のメモリ使用量が300KB以内", () => {
    const before = process.memoryUsage().heapUsed;
    PrefectureService.getAllPrefectures();
    MunicipalityService.getAllMunicipalities();
    const after = process.memoryUsage().heapUsed;

    const used = after - before;
    expect(used).toBeLessThan(300 * 1024); // 300KB
  });
});
```

### 負荷テスト

```typescript
describe("負荷テスト", () => {
  it("1000回の検索が1秒以内で完了する", () => {
    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      PrefectureService.searchPrefectures({ query: "北" });
    }

    const end = performance.now();
    expect(end - start).toBeLessThan(1000); // 1秒
  });
});
```

## E2E テスト

### ユーザーシナリオテスト

#### 地域選択シナリオ

```typescript
describe("地域選択シナリオ", () => {
  it("都道府県選択→市区町村選択の流れが正常に動作する", async () => {
    // 1. 都道府県リストを表示
    const prefectures = PrefectureService.getAllPrefectures();
    expect(prefectures.length).toBe(47);

    // 2. 東京都を選択
    const tokyo = PrefectureService.getPrefectureByCode("13");
    expect(tokyo?.prefName).toBe("東京都");

    // 3. 東京都の市区町村を表示
    const municipalities =
      MunicipalityService.getMunicipalitiesByPrefecture("13");
    expect(municipalities.length).toBeGreaterThan(0);

    // 4. 千代田区を選択
    const chiyoda = MunicipalityService.getMunicipalityByCode("13101");
    expect(chiyoda?.name).toBe("千代田区");
  });
});
```

#### 検索シナリオ

```typescript
describe("検索シナリオ", () => {
  it("地域名検索が正常に動作する", async () => {
    // 1. "中央"で検索
    const results = AreaService.searchAreas({ query: "中央", limit: 10 });
    expect(results.length).toBeGreaterThan(0);

    // 2. 結果の詳細を確認
    results.forEach((result) => {
      expect(result.name).toContain("中央");
      expect(result.code).toBeDefined();
      expect(result.type).toBeDefined();
    });
  });
});
```

## テスト環境

### テストツール

- **テストフレームワーク**: Vitest
- **アサーション**: Vitest built-in
- **モック**: Vitest built-in
- **カバレッジ**: @vitest/coverage-v8

### テスト設定

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/config/test.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/", "**/*.d.ts", "**/*.config.*"],
    },
  },
});
```

### テストデータ管理

```typescript
// src/test/fixtures/area-data.ts
export const MOCK_PREFECTURES = [
  { prefCode: "01000", prefName: "北海道" },
  { prefCode: "13000", prefName: "東京都" },
];

export const MOCK_MUNICIPALITIES = [
  { code: "13101", name: "千代田区", prefCode: "13", type: "ward" },
];
```

## テスト実行

### 開発時

```bash
# 全テスト実行
npm test

# ウォッチモード
npm test -- --watch

# カバレッジ付き実行
npm run test:coverage
```

### CI/CD

```bash
# 本番ビルド前のテスト
npm run test:run

# カバレッジレポート生成
npm run test:coverage
```

### テスト結果

#### カバレッジ目標

- **行カバレッジ**: 95% 以上
- **分岐カバレッジ**: 90% 以上
- **関数カバレッジ**: 100%

#### パフォーマンス目標

- **都道府県取得**: < 1ms
- **市区町村検索**: < 10ms
- **階層パス取得**: < 5ms
- **メモリ使用量**: < 300KB

## テストメンテナンス

### 定期的な確認

- [ ] 月 1 回: テストカバレッジの確認
- [ ] 四半期 1 回: パフォーマンステストの実行
- [ ] 年 1 回: テスト戦略の見直し

### テストデータ更新

- [ ] 市区町村データ更新時: テストデータの同期
- [ ] 新機能追加時: 対応するテストの追加
- [ ] バグ修正時: 回帰テストの追加

## 参考資料

- [地域ドメイン概要](../overview.md)
- [API 仕様](../specifications/api.md)
- [基本的な使い方](../implementation/getting-started.md)
