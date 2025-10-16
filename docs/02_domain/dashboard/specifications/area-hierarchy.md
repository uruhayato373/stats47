# 地域階層システム

## 概要

地域階層システムは、全国・都道府県・市区町村の3階層構造を管理し、地域間の親子関係、ナビゲーション、データ取得を効率的に行うためのシステムです。

## 地域コード体系

### 基本構造

```
地域コード（5桁）
├── 上位2桁: 都道府県コード（01-47）
├── 下位3桁: 市区町村コード（000-999）
└── 特殊コード: 00000（全国）
```

### コード体系詳細

#### 全国レベル
- **コード**: `00000`
- **説明**: 日本全国の統計データ
- **親地域**: なし（最上位）
- **子地域**: 47都道府県

#### 都道府県レベル
- **パターン**: `XX000` (XX: 01-47)
- **説明**: 特定の都道府県の統計データ
- **親地域**: 全国（00000）
- **子地域**: 当該都道府県内の市区町村

| 都道府県コード | 都道府県名 | 地域コード |
|-------------|----------|----------|
| 01 | 北海道 | 01000 |
| 02 | 青森県 | 02000 |
| 03 | 岩手県 | 03000 |
| ... | ... | ... |
| 13 | 東京都 | 13000 |
| ... | ... | ... |
| 47 | 沖縄県 | 47000 |

#### 市区町村レベル
- **パターン**: `XXXXX` (5桁の詳細コード)
- **説明**: 特定の市区町村の統計データ
- **親地域**: 当該都道府県
- **子地域**: なし（最下位）

| 市区町村コード | 市区町村名 | 都道府県コード | 地域コード |
|-------------|----------|-------------|----------|
| 13101 | 千代田区 | 13 | 13101 |
| 13102 | 中央区 | 13 | 13102 |
| 13103 | 港区 | 13 | 13103 |
| ... | ... | ... | ... |
| 27100 | 大阪市 | 27 | 27100 |
| 27101 | 都島区 | 27 | 27101 |
| ... | ... | ... | ... |

## 地域階層管理

### 階層関係の定義

```typescript
interface AreaHierarchy {
  areaCode: string;
  areaName: string;
  areaLevel: 'national' | 'prefecture' | 'municipality';
  parentCode?: string;
  children: string[];
  prefectureCode?: string;
  municipalityCode?: string;
}

// 階層関係の例
const hierarchy: AreaHierarchy[] = [
  {
    areaCode: '00000',
    areaName: '全国',
    areaLevel: 'national',
    children: ['01000', '02000', '03000', /* ... 47都道府県 */]
  },
  {
    areaCode: '13000',
    areaName: '東京都',
    areaLevel: 'prefecture',
    parentCode: '00000',
    prefectureCode: '13',
    children: ['13101', '13102', '13103', /* ... 東京都内市区町村 */]
  },
  {
    areaCode: '13101',
    areaName: '千代田区',
    areaLevel: 'municipality',
    parentCode: '13000',
    prefectureCode: '13',
    municipalityCode: '13101',
    children: []
  }
];
```

### 地域レベル判定

```typescript
export function determineAreaLevel(areaCode: string): AreaLevel {
  // 全国レベル
  if (areaCode === '00000') {
    return 'national';
  }
  
  // 都道府県レベル（XX000形式）
  if (areaCode.match(/^[0-4][0-9]000$/)) {
    return 'prefecture';
  }
  
  // 市区町村レベル（XXXXX形式）
  if (areaCode.match(/^[0-4][0-9][0-9][0-9][0-9]$/)) {
    return 'municipality';
  }
  
  throw new Error(`Invalid area code: ${areaCode}`);
}
```

### 親子関係の取得

```typescript
export function getParentAreaCode(areaCode: string): string | null {
  const areaLevel = determineAreaLevel(areaCode);
  
  switch (areaLevel) {
    case 'national':
      return null; // 全国は最上位
    case 'prefecture':
      return '00000'; // 都道府県の親は全国
    case 'municipality':
      // 市区町村の親は都道府県
      return areaCode.substring(0, 2) + '000';
    default:
      throw new Error(`Invalid area level: ${areaLevel}`);
  }
}

export function getChildAreaCodes(areaCode: string): string[] {
  const areaLevel = determineAreaLevel(areaCode);
  
  switch (areaLevel) {
    case 'national':
      // 全国の子は47都道府県
      return Array.from({ length: 47 }, (_, i) => 
        String(i + 1).padStart(2, '0') + '000'
      );
    case 'prefecture':
      // 都道府県の子は当該都道府県内の市区町村
      return getMunicipalitiesInPrefecture(areaCode);
    case 'municipality':
      return []; // 市区町村は最下位
    default:
      throw new Error(`Invalid area level: ${areaLevel}`);
  }
}
```

## 地域情報管理

### 地域名の取得

```typescript
// 地域名データベース（実際は外部データソースから取得）
const areaNames: Record<string, string> = {
  '00000': '全国',
  '01000': '北海道',
  '02000': '青森県',
  // ... 他の都道府県
  '13000': '東京都',
  // ... 他の都道府県
  '13101': '千代田区',
  '13102': '中央区',
  // ... 他の市区町村
};

export function getAreaName(areaCode: string): string {
  return areaNames[areaCode] || '不明な地域';
}
```

### 都道府県コードの抽出

```typescript
export function getPrefectureCodeFromArea(areaCode: string): string {
  const areaLevel = determineAreaLevel(areaCode);
  
  switch (areaLevel) {
    case 'national':
      throw new Error('National level has no prefecture code');
    case 'prefecture':
      return areaCode.substring(0, 2);
    case 'municipality':
      return areaCode.substring(0, 2);
    default:
      throw new Error(`Invalid area level: ${areaLevel}`);
  }
}

export function getPrefectureCodeFromMunicipality(municipalityCode: string): string {
  if (municipalityCode.length !== 5) {
    throw new Error(`Invalid municipality code: ${municipalityCode}`);
  }
  
  return municipalityCode.substring(0, 2) + '000';
}
```

### 市区町村コードの抽出

```typescript
export function getMunicipalityCodeFromArea(areaCode: string): string | null {
  const areaLevel = determineAreaLevel(areaCode);
  
  switch (areaLevel) {
    case 'national':
    case 'prefecture':
      return null;
    case 'municipality':
      return areaCode;
    default:
      throw new Error(`Invalid area level: ${areaLevel}`);
  }
}
```

## 階層ナビゲーション

### ブレッドクラム生成

```typescript
interface BreadcrumbItem {
  name: string;
  href: string;
  areaCode: string;
  areaLevel: AreaLevel;
}

export function generateBreadcrumbs(
  category: string,
  subcategory: string,
  areaCode: string
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'ホーム', href: '/', areaCode: '', areaLevel: 'national' },
    { name: '統計ダッシュボード', href: '/dashboard', areaCode: '', areaLevel: 'national' },
    { name: getCategoryName(category), href: `/${category}`, areaCode: '', areaLevel: 'national' },
    { name: getSubcategoryName(subcategory), href: `/${category}/${subcategory}`, areaCode: '', areaLevel: 'national' }
  ];
  
  const areaLevel = determineAreaLevel(areaCode);
  
  if (areaLevel === 'prefecture') {
    breadcrumbs.push({
      name: getAreaName(areaCode),
      href: `/${category}/${subcategory}/dashboard/${areaCode}`,
      areaCode,
      areaLevel: 'prefecture'
    });
  } else if (areaLevel === 'municipality') {
    const prefectureCode = getPrefectureCodeFromMunicipality(areaCode);
    breadcrumbs.push(
      {
        name: getAreaName(prefectureCode),
        href: `/${category}/${subcategory}/dashboard/${prefectureCode}`,
        areaCode: prefectureCode,
        areaLevel: 'prefecture'
      },
      {
        name: getAreaName(areaCode),
        href: `/${category}/${subcategory}/dashboard/${areaCode}`,
        areaCode,
        areaLevel: 'municipality'
      }
    );
  }
  
  return breadcrumbs;
}
```

### 階層ナビゲーションコンポーネント

```typescript
interface HierarchyNavigationProps {
  currentAreaCode: string;
  category: string;
  subcategory: string;
}

export function HierarchyNavigation({
  currentAreaCode,
  category,
  subcategory
}: HierarchyNavigationProps) {
  const areaLevel = determineAreaLevel(currentAreaCode);
  const parentCode = getParentAreaCode(currentAreaCode);
  const childCodes = getChildAreaCodes(currentAreaCode);
  
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-neutral-400">
      {/* 親地域へのリンク */}
      {parentCode && (
        <Link
          href={`/${category}/${subcategory}/dashboard/${parentCode}`}
          className="hover:text-blue-600 dark:hover:text-blue-400"
        >
          ← {getAreaName(parentCode)}
        </Link>
      )}
      
      {/* 現在の地域 */}
      <span className="font-medium text-gray-900 dark:text-white">
        {getAreaName(currentAreaCode)}
      </span>
      
      {/* 子地域へのリンク（最大5件） */}
      {childCodes.length > 0 && (
        <div className="relative group">
          <button className="hover:text-blue-600 dark:hover:text-blue-400">
            子地域 ↓
          </button>
          <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            {childCodes.slice(0, 5).map(childCode => (
              <Link
                key={childCode}
                href={`/${category}/${subcategory}/dashboard/${childCode}`}
                className="block px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700"
              >
                {getAreaName(childCode)}
              </Link>
            ))}
            {childCodes.length > 5 && (
              <div className="px-3 py-2 text-xs text-gray-500">
                他 {childCodes.length - 5} 件...
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
```

## 地域選択UI

### 都道府県選択コンポーネント

```typescript
interface PrefectureSelectorProps {
  selectedPrefecture: string;
  onPrefectureChange: (prefectureCode: string) => void;
  category: string;
  subcategory: string;
}

export function PrefectureSelector({
  selectedPrefecture,
  onPrefectureChange,
  category,
  subcategory
}: PrefectureSelectorProps) {
  const prefectures = getPrefectures();
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">
        都道府県を選択
      </label>
      <select
        value={selectedPrefecture}
        onChange={(e) => onPrefectureChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
      >
        <option value="">都道府県を選択してください</option>
        {prefectures.map(prefecture => (
          <option key={prefecture.code} value={prefecture.code}>
            {prefecture.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### 市区町村選択コンポーネント

```typescript
interface MunicipalitySelectorProps {
  prefectureCode: string;
  selectedMunicipality: string;
  onMunicipalityChange: (municipalityCode: string) => void;
  category: string;
  subcategory: string;
}

export function MunicipalitySelector({
  prefectureCode,
  selectedMunicipality,
  onMunicipalityChange,
  category,
  subcategory
}: MunicipalitySelectorProps) {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (prefectureCode) {
      setLoading(true);
      getMunicipalitiesInPrefecture(prefectureCode)
        .then(setMunicipalities)
        .finally(() => setLoading(false));
    } else {
      setMunicipalities([]);
    }
  }, [prefectureCode]);
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">
        市区町村を選択
      </label>
      <select
        value={selectedMunicipality}
        onChange={(e) => onMunicipalityChange(e.target.value)}
        disabled={!prefectureCode || loading}
        className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-white disabled:opacity-50"
      >
        <option value="">
          {loading ? '読み込み中...' : '市区町村を選択してください'}
        </option>
        {municipalities.map(municipality => (
          <option key={municipality.code} value={municipality.code}>
            {municipality.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### 統合地域選択コンポーネント

```typescript
interface AreaSelectorProps {
  currentAreaCode: string;
  onAreaChange: (areaCode: string) => void;
  category: string;
  subcategory: string;
}

export function AreaSelector({
  currentAreaCode,
  onAreaChange,
  category,
  subcategory
}: AreaSelectorProps) {
  const [selectedPrefecture, setSelectedPrefecture] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  
  const areaLevel = determineAreaLevel(currentAreaCode);
  
  useEffect(() => {
    if (areaLevel === 'prefecture') {
      setSelectedPrefecture(currentAreaCode);
    } else if (areaLevel === 'municipality') {
      const prefectureCode = getPrefectureCodeFromMunicipality(currentAreaCode);
      setSelectedPrefecture(prefectureCode);
      setSelectedMunicipality(currentAreaCode);
    }
  }, [currentAreaCode, areaLevel]);
  
  const handlePrefectureChange = (prefectureCode: string) => {
    setSelectedPrefecture(prefectureCode);
    setSelectedMunicipality('');
    onAreaChange(prefectureCode);
  };
  
  const handleMunicipalityChange = (municipalityCode: string) => {
    setSelectedMunicipality(municipalityCode);
    onAreaChange(municipalityCode);
  };
  
  return (
    <div className="space-y-4">
      <PrefectureSelector
        selectedPrefecture={selectedPrefecture}
        onPrefectureChange={handlePrefectureChange}
        category={category}
        subcategory={subcategory}
      />
      
      {selectedPrefecture && (
        <MunicipalitySelector
          prefectureCode={selectedPrefecture}
          selectedMunicipality={selectedMunicipality}
          onMunicipalityChange={handleMunicipalityChange}
          category={category}
          subcategory={subcategory}
        />
      )}
    </div>
  );
}
```

## 地域検索機能

### 地域検索API

```typescript
interface AreaSearchResult {
  areaCode: string;
  areaName: string;
  areaLevel: AreaLevel;
  prefectureName?: string;
  fullPath: string;
}

export async function searchAreas(query: string): Promise<AreaSearchResult[]> {
  const results: AreaSearchResult[] = [];
  
  // 都道府県検索
  const prefectures = getPrefectures().filter(pref => 
    pref.name.includes(query)
  );
  
  results.push(...prefectures.map(pref => ({
    areaCode: pref.code,
    areaName: pref.name,
    areaLevel: 'prefecture' as AreaLevel,
    fullPath: pref.name
  })));
  
  // 市区町村検索
  const municipalities = getAllMunicipalities().filter(muni => 
    muni.name.includes(query)
  );
  
  results.push(...municipalities.map(muni => ({
    areaCode: muni.code,
    areaName: muni.name,
    areaLevel: 'municipality' as AreaLevel,
    prefectureName: getPrefectureName(muni.prefectureCode),
    fullPath: `${getPrefectureName(muni.prefectureCode)} ${muni.name}`
  })));
  
  return results.sort((a, b) => a.areaName.localeCompare(b.areaName));
}
```

### 地域検索コンポーネント

```typescript
interface AreaSearchProps {
  onAreaSelect: (areaCode: string) => void;
  category: string;
  subcategory: string;
}

export function AreaSearch({ onAreaSelect, category, subcategory }: AreaSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AreaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const searchResults = await searchAreas(searchQuery);
      setResults(searchResults);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const debouncedSearch = useMemo(
    () => debounce(handleSearch, 300),
    [handleSearch]
  );
  
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);
  
  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="地域名で検索..."
        className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
      />
      
      {query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">検索中...</div>
          ) : results.length > 0 ? (
            results.map(result => (
              <button
                key={result.areaCode}
                onClick={() => {
                  onAreaSelect(result.areaCode);
                  setQuery('');
                  setResults([]);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-neutral-700"
              >
                <div className="font-medium">{result.areaName}</div>
                <div className="text-sm text-gray-500">{result.fullPath}</div>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">該当する地域が見つかりません</div>
          )}
        </div>
      )}
    </div>
  );
}
```

## データ取得の階層対応

### 階層別データ取得戦略

```typescript
export async function fetchDataByAreaLevel(
  statsDataId: string,
  areaCode: string,
  areaLevel: AreaLevel
) {
  switch (areaLevel) {
    case 'national':
      return await fetchNationalData(statsDataId, areaCode);
    case 'prefecture':
      return await fetchPrefectureData(statsDataId, areaCode);
    case 'municipality':
      return await fetchMunicipalityData(statsDataId, areaCode);
    default:
      throw new Error(`Invalid area level: ${areaLevel}`);
  }
}

async function fetchNationalData(statsDataId: string, areaCode: string) {
  // 全国データの取得
  return await EstatStatsDataService.getAndFormatStatsData(statsDataId, {
    areaFilter: '00000' // 全国
  });
}

async function fetchPrefectureData(statsDataId: string, areaCode: string) {
  // 都道府県データの取得
  return await EstatStatsDataService.getAndFormatStatsData(statsDataId, {
    areaFilter: areaCode
  });
}

async function fetchMunicipalityData(statsDataId: string, areaCode: string) {
  // 市区町村データの取得
  return await EstatStatsDataService.getAndFormatStatsData(statsDataId, {
    areaFilter: areaCode
  });
}
```

## パフォーマンス最適化

### 地域データのキャッシュ

```typescript
class AreaDataCache {
  private cache = new Map<string, any>();
  private ttl = 24 * 60 * 60 * 1000; // 24時間
  
  async getAreaData(areaCode: string) {
    const cached = this.cache.get(areaCode);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    const data = await this.fetchAreaData(areaCode);
    this.cache.set(areaCode, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
  
  private async fetchAreaData(areaCode: string) {
    // 実際のデータ取得処理
  }
}
```

### 遅延読み込み

```typescript
// 市区町村データの遅延読み込み
export function useMunicipalityData(prefectureCode: string) {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (prefectureCode) {
      setLoading(true);
      getMunicipalitiesInPrefecture(prefectureCode)
        .then(setMunicipalities)
        .finally(() => setLoading(false));
    }
  }, [prefectureCode]);
  
  return { municipalities, loading };
}
```

## まとめ

地域階層システムは、3階層の地域データを効率的に管理するための包括的なシステムです。主な特徴は以下の通りです：

1. **明確な階層構造**: 全国・都道府県・市区町村の3階層を明確に定義
2. **柔軟なナビゲーション**: ブレッドクラム、階層ナビゲーション、検索機能
3. **直感的なUI**: 地域選択、検索、階層移動のためのユーザーフレンドリーなインターフェース
4. **パフォーマンス最適化**: キャッシュ、遅延読み込み、効率的なデータ取得
5. **拡張性**: 新しい地域レベルの追加や機能拡張が容易

このシステムにより、ユーザーは直感的に地域を選択し、階層を移動しながら統計データを閲覧することができます。
