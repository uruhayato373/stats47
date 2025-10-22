---
title: Area Management ドメイン
created: 2025-01-20
updated: 2025-01-20
tags:
  - ドメイン駆動設計
  - 支援ドメイン
  - Area Management
---

# Area Management ドメイン

## 概要

Area Management ドメインは、stats47 プロジェクトの支援ドメインの一つで、日本の行政区画の階層構造と地理データを管理します。都道府県・市区町村の階層構造、地域コードの検証と変換、地理形状データの管理など、地域に関するすべての情報と操作を担当します。

### ビジネス価値

- **地域データの一元管理**: 日本の行政区画データを統一的に管理し、一貫性を保つ
- **階層構造の活用**: 都道府県→市区町村の階層関係を活用した効率的なデータ検索
- **歴史的変遷の管理**: 合併・分割等の行政区域の変遷を適切に管理
- **地理データの統合**: 複数のデータソースからの地理データを統合管理

## 責務

- 都道府県・市区町村の階層構造管理
- 地域コードの検証と変換
- 地理形状データ（GeoJSON/TopoJSON）管理
- 地域検索・フィルタリング
- 市区町村 ID と標準地域コードのマッピング管理
- 歴史的行政区域の変遷管理
- データソース別の地理データ管理

## 主要エンティティ

### Prefecture（都道府県）

都道府県の基本情報を管理するエンティティ。

**属性:**
- `code`: 都道府県コード（5 桁）
- `name`: 都道府県名
- `region`: 地方区分
- `municipalities`: 所属市区町村のリスト
- `population`: 人口
- `area`: 面積

### Municipality（市区町村）

市区町村の基本情報を管理するエンティティ。

**属性:**
- `code`: 市区町村コード（5 桁）
- `name`: 市区町村名
- `prefectureCode`: 所属都道府県コード
- `type`: 市区町村タイプ（市/町/村/特別区）
- `population`: 人口
- `area`: 面積
- `establishedDate`: 設置日

### AreaHierarchy（地域階層）

地域の階層構造を管理するエンティティ。

**属性:**
- `level`: 階層レベル（国/地方/都道府県/市区町村）
- `parent`: 親地域
- `children`: 子地域のリスト
- `depth`: 階層の深さ

### GeoShape（地理形状データ）

地理形状データとそのメタデータを管理するエンティティ。

**属性:**
- `areaCode`: 地域コード
- `geoJson`: GeoJSON データ
- `topoJson`: TopoJSON データ
- `boundingBox`: バウンディングボックス
- `centroid`: 重心座標
- `area`: 面積（平方キロメートル）

### AreaCodeMapping（地域コードマッピング）

異なるデータソース間の地域コードマッピングを管理するエンティティ。

**属性:**
- `municipalityId`: 市区町村 ID（歴史的行政区域データセット）
- `standardAreaCode`: 標準地域コード（e-Stat）
- `name`: 地域名
- `prefectureName`: 都道府県名
- `validFrom`: 有効開始日
- `validTo`: 有効終了日
- `dataSource`: データソース

### HistoricalArea（歴史的行政区域）

歴史的行政区域の変遷を管理するエンティティ。

**属性:**
- `areaCode`: 地域コード
- `name`: 地域名
- `year`: 年度
- `parentAreaCode`: 親地域コード
- `changes`: 変更履歴（合併、分割等）
- `changeType`: 変更タイプ
- `changeDate`: 変更日

## 値オブジェクト

### AreaCode（地域コード）

地域コードを表現する値オブジェクト。

```typescript
export class AreaCode {
  private constructor(private readonly value: string) {}

  static create(code: string): Result<AreaCode> {
    if (!/^\d{5}$/.test(code)) {
      return Result.fail("Area code must be 5 digits");
    }
    return Result.ok(new AreaCode(code));
  }

  isPrefecture(): boolean {
    return this.value.endsWith("000");
  }

  isMunicipality(): boolean {
    return !this.isPrefecture();
  }

  getPrefectureCode(): AreaCode {
    if (this.isPrefecture()) {
      return this;
    }
    const prefCode = this.value.substring(0, 2) + "000";
    return new AreaCode(prefCode);
  }

  toString(): string {
    return this.value;
  }

  equals(other: AreaCode): boolean {
    return this.value === other.value;
  }
}
```

### AreaLevel（地域レベル）

地域の階層レベルを表現する値オブジェクト。

```typescript
export class AreaLevel {
  private constructor(private readonly value: string) {}

  static readonly COUNTRY = new AreaLevel("country");
  static readonly REGION = new AreaLevel("region");
  static readonly PREFECTURE = new AreaLevel("prefecture");
  static readonly MUNICIPALITY = new AreaLevel("municipality");

  static create(value: string): Result<AreaLevel> {
    const validLevels = ["country", "region", "prefecture", "municipality"];
    if (!validLevels.includes(value)) {
      return Result.fail(`Invalid area level: ${value}`);
    }
    return Result.ok(new AreaLevel(value));
  }

  getValue(): string {
    return this.value;
  }

  isHigherThan(other: AreaLevel): boolean {
    const levels = ["municipality", "prefecture", "region", "country"];
    return levels.indexOf(this.value) > levels.indexOf(other.value);
  }
}
```

### Region（地方区分）

地方区分を表現する値オブジェクト。

```typescript
export class Region {
  private constructor(
    private readonly code: string,
    private readonly name: string
  ) {}

  static readonly HOKKAIDO = new Region("01", "北海道");
  static readonly TOHOKU = new Region("02", "東北");
  static readonly KANTO = new Region("03", "関東");
  static readonly CHUBU = new Region("04", "中部");
  static readonly KANSAI = new Region("05", "関西");
  static readonly CHUGOKU = new Region("06", "中国");
  static readonly SHIKOKU = new Region("07", "四国");
  static readonly KYUSHU = new Region("08", "九州");

  static create(code: string): Result<Region> {
    const regionMap = {
      "01": Region.HOKKAIDO,
      "02": Region.TOHOKU,
      "03": Region.KANTO,
      "04": Region.CHUBU,
      "05": Region.KANSAI,
      "06": Region.CHUGOKU,
      "07": Region.SHIKOKU,
      "08": Region.KYUSHU,
    };

    const region = regionMap[code as keyof typeof regionMap];
    if (!region) {
      return Result.fail(`Invalid region code: ${code}`);
    }
    return Result.ok(region);
  }

  getCode(): string {
    return this.code;
  }

  getName(): string {
    return this.name;
  }
}
```

## ドメインサービス

### AreaService

地域データの基本操作を実装するドメインサービス。

```typescript
export class AreaService {
  constructor(
    private readonly areaRepository: AreaRepository,
    private readonly geoShapeRepository: GeoShapeRepository
  ) {}

  async getPrefecture(code: AreaCode): Promise<Prefecture | null> {
    if (!code.isPrefecture()) {
      return null;
    }
    return await this.areaRepository.findPrefectureByCode(code);
  }

  async getMunicipalities(prefectureCode: AreaCode): Promise<Municipality[]> {
    if (!prefectureCode.isPrefecture()) {
      throw new Error("Code must be a prefecture code");
    }
    return await this.areaRepository.findMunicipalitiesByPrefecture(prefectureCode);
  }

  async getAreaHierarchy(areaCode: AreaCode): Promise<AreaHierarchy> {
    const area = await this.areaRepository.findByCode(areaCode);
    if (!area) {
      throw new Error(`Area not found: ${areaCode.toString()}`);
    }

    const parent = await this.getParentArea(areaCode);
    const children = await this.getChildAreas(areaCode);

    return AreaHierarchy.create({
      level: area.isPrefecture() ? AreaLevel.PREFECTURE : AreaLevel.MUNICIPALITY,
      parent,
      children,
    }).getValue();
  }

  async searchAreas(query: string, level?: AreaLevel): Promise<Area[]> {
    return await this.areaRepository.search(query, level);
  }

  private async getParentArea(areaCode: AreaCode): Promise<Area | null> {
    if (areaCode.isPrefecture()) {
      return null; // 都道府県の親は国レベル
    }
    return await this.getPrefecture(areaCode.getPrefectureCode());
  }

  private async getChildAreas(areaCode: AreaCode): Promise<Area[]> {
    if (areaCode.isPrefecture()) {
      return await this.getMunicipalities(areaCode);
    }
    return []; // 市区町村の子はなし
  }
}
```

### AreaCodeMappingService

地域コードマッピングの管理を実装するドメインサービス。

```typescript
export class AreaCodeMappingService {
  constructor(
    private readonly mappingRepository: AreaCodeMappingRepository
  ) {}

  async convertToStandardAreaCode(municipalityId: string): Promise<Result<string>> {
    const mapping = await this.mappingRepository.findByMunicipalityId(municipalityId);
    if (!mapping) {
      return Result.fail(`No mapping found for municipality ID: ${municipalityId}`);
    }

    if (!mapping.isValid()) {
      return Result.fail("Mapping is not valid for current date");
    }

    return Result.ok(mapping.getStandardAreaCode());
  }

  async convertToMunicipalityId(standardAreaCode: string): Promise<Result<string>> {
    const mapping = await this.mappingRepository.findByStandardAreaCode(standardAreaCode);
    if (!mapping) {
      return Result.fail(`No mapping found for standard area code: ${standardAreaCode}`);
    }

    if (!mapping.isValid()) {
      return Result.fail("Mapping is not valid for current date");
    }

    return Result.ok(mapping.getMunicipalityId());
  }

  async getValidMappings(date?: Date): Promise<AreaCodeMapping[]> {
    const targetDate = date || new Date();
    return await this.mappingRepository.findValidMappings(targetDate);
  }

  async updateMapping(mapping: AreaCodeMapping): Promise<void> {
    await this.mappingRepository.save(mapping);
  }
}
```

### HistoricalAreaService

歴史的行政区域の管理を実装するドメインサービス。

```typescript
export class HistoricalAreaService {
  constructor(
    private readonly historicalAreaRepository: HistoricalAreaRepository
  ) {}

  async getAreaAtYear(areaCode: string, year: number): Promise<HistoricalArea | null> {
    return await this.historicalAreaRepository.findByAreaCodeAndYear(areaCode, year);
  }

  async getAreaChanges(areaCode: string): Promise<HistoricalArea[]> {
    return await this.historicalAreaRepository.findChangesByAreaCode(areaCode);
  }

  async findAreasByChangeType(changeType: string, year: number): Promise<HistoricalArea[]> {
    return await this.historicalAreaRepository.findByChangeTypeAndYear(changeType, year);
  }

  async getMergedAreas(areaCode: string): Promise<HistoricalArea[]> {
    return await this.historicalAreaRepository.findMergedAreas(areaCode);
  }

  async getSplitAreas(areaCode: string): Promise<HistoricalArea[]> {
    return await this.historicalAreaRepository.findSplitAreas(areaCode);
  }
}
```

## リポジトリ

### AreaRepository

地域データの永続化を抽象化するリポジトリインターフェース。

```typescript
export interface AreaRepository {
  findPrefectureByCode(code: AreaCode): Promise<Prefecture | null>;
  findMunicipalityByCode(code: AreaCode): Promise<Municipality | null>;
  findMunicipalitiesByPrefecture(prefectureCode: AreaCode): Promise<Municipality[]>;
  findByCode(code: AreaCode): Promise<Area | null>;
  search(query: string, level?: AreaLevel): Promise<Area[]>;
  findAllPrefectures(): Promise<Prefecture[]>;
  findAllMunicipalities(): Promise<Municipality[]>;
  save(area: Area): Promise<void>;
  delete(code: AreaCode): Promise<void>;
  exists(code: AreaCode): Promise<boolean>;
}
```

### GeoShapeRepository

地理形状データの永続化を抽象化するリポジトリインターフェース。

```typescript
export interface GeoShapeRepository {
  findByAreaCode(areaCode: string): Promise<GeoShape | null>;
  findByAreaType(areaType: string): Promise<GeoShape[]>;
  findByBoundingBox(boundingBox: BoundingBox): Promise<GeoShape[]>;
  save(geoShape: GeoShape): Promise<void>;
  delete(areaCode: string): Promise<void>;
  exists(areaCode: string): Promise<boolean>;
}
```

## ディレクトリ構造

```
src/domain/area/
├── entities/
│   ├── Prefecture.ts
│   ├── Municipality.ts
│   ├── AreaHierarchy.ts
│   ├── GeoShape.ts
│   ├── AreaCodeMapping.ts
│   └── HistoricalArea.ts
├── value-objects/
│   ├── AreaCode.ts
│   ├── AreaLevel.ts
│   ├── AreaType.ts
│   ├── Region.ts
│   ├── MunicipalityId.ts
│   └── StandardAreaCode.ts
├── services/
│   ├── AreaService.ts
│   ├── AreaHierarchyService.ts
│   ├── GeoShapeService.ts
│   ├── AreaCodeMappingService.ts
│   └── HistoricalAreaService.ts
├── repositories/
│   ├── AreaRepository.ts
│   ├── GeoShapeRepository.ts
│   ├── AreaCodeMappingRepository.ts
│   └── HistoricalAreaRepository.ts
└── specifications/
    ├── PrefectureSpecification.ts
    └── MunicipalitySpecification.ts
```

## DDDパターン実装例

### エンティティ実装例

```typescript
// src/domain/area/entities/Prefecture.ts
export class Prefecture {
  private constructor(
    private readonly code: AreaCode,
    private readonly name: string,
    private readonly region: Region,
    private municipalities: Municipality[],
    private readonly population: number,
    private readonly area: number
  ) {}

  static create(props: {
    code: AreaCode;
    name: string;
    region: Region;
    population: number;
    area: number;
  }): Result<Prefecture> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail("Prefecture name cannot be empty");
    }
    if (props.population < 0) {
      return Result.fail("Population must be non-negative");
    }
    if (props.area <= 0) {
      return Result.fail("Area must be positive");
    }

    return Result.ok(
      new Prefecture(
        props.code,
        props.name,
        props.region,
        [],
        props.population,
        props.area
      )
    );
  }

  addMunicipality(municipality: Municipality): Result<void> {
    if (!municipality.getPrefectureCode().equals(this.code)) {
      return Result.fail("Municipality does not belong to this prefecture");
    }

    const exists = this.municipalities.some(m => 
      m.getCode().equals(municipality.getCode())
    );
    if (exists) {
      return Result.fail("Municipality already exists");
    }

    this.municipalities.push(municipality);
    return Result.ok();
  }

  getCode(): AreaCode {
    return this.code;
  }

  getName(): string {
    return this.name;
  }

  getRegion(): Region {
    return this.region;
  }

  getMunicipalities(): ReadonlyArray<Municipality> {
    return this.municipalities;
  }

  getPopulation(): number {
    return this.population;
  }

  getArea(): number {
    return this.area;
  }

  getPopulationDensity(): number {
    return this.population / this.area;
  }
}
```

### 仕様実装例

```typescript
// src/domain/area/specifications/PrefectureSpecification.ts
export class PrefectureSpecification {
  static isLargePrefecture(prefecture: Prefecture): boolean {
    return prefecture.getPopulation() > 1000000; // 100万人以上
  }

  static isDenselyPopulated(prefecture: Prefecture): boolean {
    return prefecture.getPopulationDensity() > 1000; // 1000人/km²以上
  }

  static hasManyMunicipalities(prefecture: Prefecture): boolean {
    return prefecture.getMunicipalities().length > 50; // 50市区町村以上
  }

  static isInRegion(prefecture: Prefecture, region: Region): boolean {
    return prefecture.getRegion().equals(region);
  }
}
```

## ベストプラクティス

### 1. データ整合性の維持

- 地域コードの一意性保証
- 階層関係の整合性チェック
- 歴史的データの時系列整合性

### 2. パフォーマンス最適化

- 階層構造の効率的な検索
- 地理データの適切なキャッシュ戦略
- インデックスの最適化

### 3. データソース統合

- 複数データソースの統合管理
- データ品質の統一基準
- マッピング情報の適切な管理

### 4. 歴史的変遷の管理

- 合併・分割の正確な記録
- 時系列でのデータ整合性
- 過去データへの適切なアクセス

## 関連ドメイン

- **Analytics ドメイン**: 地域別統計データの分析
- **Visualization ドメイン**: 地理データの可視化
- **Data Integration ドメイン**: 地域データの取得と統合

---

**更新履歴**:

- 2025-01-20: 初版作成
