# e-Stat API 開始ガイド

## 概要

このガイドでは、e-Stat APIライブラリの基本的な使用方法から、実際のデータ取得までを段階的に説明します。

## 前提条件

### 必要な環境

- Node.js 18以上
- TypeScript 4.5以上
- Next.js 13以上（App Router対応）

### 必要な依存関係

```bash
npm install @types/node
```

## セットアップ

### 1. 環境変数の設定

`.env.local`ファイルを作成し、e-Stat APIのアプリケーションIDを設定します。

```bash
# .env.local
NEXT_PUBLIC_ESTAT_APP_ID=your-actual-app-id
```

### 2. アプリケーションIDの取得

1. [e-Stat API](https://www.e-stat.go.jp/api/)にアクセス
2. ユーザー登録（無料）
3. アプリケーション登録
4. アプリケーションIDを取得

### 3. ライブラリのインポート

```typescript
import {
  EstatStatsDataService,
  EstatStatsListService,
  EstatMetaInfoService
} from '@/lib/estat';
```

## 基本的な使用方法

### 1. 統計リストの取得

利用可能な統計表を検索します。

```typescript
// 統計表を検索
const statsList = await EstatStatsListService.getAndFormatStatsList({
  searchWord: '人口',
  limit: 10
});

console.log('検索結果:', statsList);
```

**レスポンス例**:
```typescript
{
  list: [
    {
      statsDataId: "0000010101",
      title: "人口推計",
      description: "都道府県別人口推計",
      updatedAt: "2024-01-01"
    }
  ],
  totalCount: 100,
  startPosition: 1,
  limit: 10
}
```

### 2. 統計データの取得

統計表から実際のデータを取得します。

```typescript
// 統計データを取得
const statsData = await EstatStatsDataService.getAndFormatStatsData(
  '0000010101', // 統計表ID
  {
    categoryFilter: 'A1101', // 総人口
    yearFilter: '2023',      // 2023年
    areaFilter: '13000'      // 東京都
  }
);

console.log('取得したデータ:', statsData);
```

**レスポンス例**:
```typescript
{
  values: [
    {
      areaCode: "13000",
      areaName: "東京都",
      value: 14000000,
      unit: "人",
      categoryCode: "A1101",
      categoryName: "総人口",
      timeCode: "2023",
      timeName: "2023年"
    }
  ],
  areas: [...],
  categories: [...],
  years: [...]
}
```

### 3. メタ情報の取得

統計表の構造情報を取得します。

```typescript
// メタ情報を取得
const metaInfo = await EstatMetaInfoService.getMetaInfo('0000010101');

console.log('メタ情報:', metaInfo);
```

**レスポンス例**:
```typescript
{
  categories: [
    {
      code: "A1101",
      name: "総人口",
      level: 1
    }
  ],
  areas: [
    {
      code: "13000",
      name: "東京都",
      level: 1
    }
  ],
  years: [
    {
      code: "2023",
      name: "2023年"
    }
  ]
}
```

## 実践的な使用例

### 1. 都道府県別人口ランキングの作成

```typescript
async function createPrefecturePopulationRanking() {
  try {
    // 1. 統計データを取得
    const data = await EstatStatsDataService.getAndFormatStatsData(
      '0000010101', // 人口推計の統計表ID
      {
        categoryFilter: 'A1101', // 総人口
        yearFilter: '2023'       // 2023年
      }
    );

    // 2. 都道府県データのみを抽出
    const prefectureData = data.values.filter(item => 
      item.areaCode !== '00000' && // 全国データを除外
      item.areaCode.length === 5   // 都道府県コード（5桁）
    );

    // 3. 人口順でソート
    const ranking = prefectureData
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .map((item, index) => ({
        rank: index + 1,
        prefecture: item.areaName,
        population: item.value,
        unit: item.unit
      }));

    console.log('都道府県別人口ランキング:', ranking);
    return ranking;

  } catch (error) {
    console.error('ランキング作成エラー:', error);
    throw error;
  }
}
```

### 2. 複数年度のデータ比較

```typescript
async function comparePopulationByYear() {
  try {
    const years = ['2020', '2021', '2022', '2023'];
    const results = [];

    for (const year of years) {
      const data = await EstatStatsDataService.getAndFormatStatsData(
        '0000010101',
        {
          categoryFilter: 'A1101',
          yearFilter: year,
          areaFilter: '13000' // 東京都
        }
      );

      if (data.values.length > 0) {
        results.push({
          year,
          population: data.values[0].value,
          unit: data.values[0].unit
        });
      }
    }

    console.log('東京都の人口推移:', results);
    return results;

  } catch (error) {
    console.error('年度比較エラー:', error);
    throw error;
  }
}
```

### 3. 利用可能な年度の取得

```typescript
async function getAvailableYears(statsDataId: string) {
  try {
    const years = await EstatStatsDataService.getAvailableYears(statsDataId);
    console.log('利用可能な年度:', years);
    return years;
  } catch (error) {
    console.error('年度取得エラー:', error);
    throw error;
  }
}

// 使用例
const years = await getAvailableYears('0000010101');
```

## エラーハンドリング

### 基本的なエラーハンドリング

```typescript
async function safeDataFetch(statsDataId: string) {
  try {
    const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
    return { success: true, data };
  } catch (error) {
    console.error('データ取得エラー:', error);
    
    // エラーの種類に応じた処理
    if (error instanceof EstatApiError) {
      return { 
        success: false, 
        error: 'APIエラー: ' + error.message 
      };
    } else if (error instanceof ValidationError) {
      return { 
        success: false, 
        error: 'バリデーションエラー: ' + error.message 
      };
    } else {
      return { 
        success: false, 
        error: '予期しないエラーが発生しました' 
      };
    }
  }
}
```

### リトライ機能の実装

```typescript
async function fetchWithRetry(
  fetchFunction: () => Promise<any>,
  maxRetries: number = 3,
  delay: number = 1000
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFunction();
    } catch (error) {
      console.warn(`試行 ${attempt}/${maxRetries} 失敗:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 指数バックオフで待機
      await new Promise(resolve => 
        setTimeout(resolve, delay * Math.pow(2, attempt - 1))
      );
    }
  }
}

// 使用例
const data = await fetchWithRetry(
  () => EstatStatsDataService.getAndFormatStatsData('0000010101')
);
```

## パフォーマンス最適化

### 1. 並列処理

```typescript
async function fetchMultipleStatsData(statsDataIds: string[]) {
  try {
    // 並列で複数の統計データを取得
    const promises = statsDataIds.map(id =>
      EstatStatsDataService.getAndFormatStatsData(id)
    );
    
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => ({
      statsDataId: statsDataIds[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
    
  } catch (error) {
    console.error('並列取得エラー:', error);
    throw error;
  }
}
```

### 2. キャッシュの活用

```typescript
class DataCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5分

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

const cache = new DataCache();

async function getCachedStatsData(statsDataId: string, options: any) {
  const cacheKey = `${statsDataId}-${JSON.stringify(options)}`;
  
  // キャッシュをチェック
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('キャッシュから取得');
    return cached;
  }
  
  // データを取得してキャッシュに保存
  const data = await EstatStatsDataService.getAndFormatStatsData(
    statsDataId, 
    options
  );
  cache.set(cacheKey, data);
  
  return data;
}
```

## デバッグとログ

### デバッグログの有効化

```typescript
// 環境変数でデバッグモードを制御
const DEBUG = process.env.NODE_ENV === 'development';

function debugLog(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, data);
  }
}

// 使用例
async function debugDataFetch(statsDataId: string) {
  debugLog('統計データ取得開始', { statsDataId });
  
  try {
    const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
    debugLog('統計データ取得完了', { 
      statsDataId, 
      valueCount: data.values.length 
    });
    return data;
  } catch (error) {
    debugLog('統計データ取得エラー', { statsDataId, error });
    throw error;
  }
}
```

### パフォーマンス測定

```typescript
async function measurePerformance<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await operation();
    const end = performance.now();
    console.log(`${name} 実行時間: ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`${name} エラー (${(end - start).toFixed(2)}ms):`, error);
    throw error;
  }
}

// 使用例
const data = await measurePerformance(
  '統計データ取得',
  () => EstatStatsDataService.getAndFormatStatsData('0000010101')
);
```

## 次のステップ

- [API統合ガイド](api-integration.md)
- [データ取得実装](data-fetching.md)
- [データ整形実装](data-formatting.md)
- [エラーハンドリング実装](error-handling.md)
- [ベストプラクティス](best-practices.md)

## トラブルシューティング

### よくある問題

#### 1. APIキーエラー

**症状**: `401 Unauthorized` エラー

**解決方法**:
- 環境変数 `NEXT_PUBLIC_ESTAT_APP_ID` が正しく設定されているか確認
- APIキーが有効か確認
- アプリケーション登録が完了しているか確認

#### 2. データが見つからない

**症状**: 空のレスポンスまたは `404 Not Found`

**解決方法**:
- 統計表IDが正しいか確認
- フィルタ条件が適切か確認
- 年度や地域コードが存在するか確認

#### 3. レート制限エラー

**症状**: `429 Too Many Requests` エラー

**解決方法**:
- リクエスト頻度を下げる
- キャッシュを活用する
- バッチ処理でまとめて取得する

### サポート

問題が解決しない場合は、以下を確認してください：

1. [API仕様](apis/)でパラメータを確認
2. [エラーハンドリングガイド](error-handling.md)でエラー処理を確認
3. [ベストプラクティス](best-practices.md)で推奨事項を確認
