---
title: EstatStatsListService
created: 2025-10-14
updated: 2025-10-16
tags:
  - domain/estat-api
  - specifications
---

# EstatStatsListService

## 概要

`EstatStatsListService` は、e-Stat APIから統計データリスト（統計表の一覧）を取得し、整形するためのサービスクラスです。

**ファイルパス**: `src/lib/estat/statslist/EstatStatsListService.ts`

## 主な機能

1. 統計データリストの取得（生データ）
2. 統計データリストの整形
3. 検索とフィルタリング
4. ページネーション

## メソッド一覧

### パブリックメソッド

| メソッド名 | 戻り値 | 説明 |
|-----------|--------|------|
| `getAndFormatStatsList()` | `Promise<FormattedStatListItem[]>` | 統計データリストを取得して整形 |
| `getStatsListRaw()` | `Promise<EstatStatsListResponse>` | 統計データリストを取得（生データ） |
| `formatStatsList()` | `FormattedStatListItem[]` | 統計データリストレスポンスを整形 |

### プライベートメソッド

| メソッド名 | 戻り値 | 説明 |
|-----------|--------|------|
| `cleanString()` | `string` | 文字列をクリーンアップ |

## 詳細仕様

### 1. getAndFormatStatsList()

統計データリストを取得して整形する最も一般的なメソッドです。

#### シグネチャ

```typescript
static async getAndFormatStatsList(
  options: {
    searchWord?: string;
    searchKind?: "1" | "2" | "3";
    startPosition?: number;
    limit?: number;
  } = {}
): Promise<FormattedStatListItem[]>
```

#### パラメータ

- `options.searchWord` (string, optional): 検索キーワード
- `options.searchKind` ("1" | "2" | "3", optional): 検索種別
  - `"1"`: 政府統計名で検索（デフォルト）
  - `"2"`: 統計表題で検索
  - `"3"`: 項目名で検索
- `options.startPosition` (number, optional): データ開始位置（デフォルト: 1）
- `options.limit` (number, optional): 取得件数（デフォルト: 20）

#### 戻り値

`FormattedStatListItem[]` - 統計データリスト項目の配列

```typescript
{
  id: string;              // 統計表ID
  statName: string;        // 政府統計名
  title: string;           // 統計表題名
  govOrg: string;          // 作成機関名
  statisticsName: string;  // 提供統計名
  surveyDate: string;      // 調査年月
  updatedDate: string;     // 更新日
  description?: string;    // 説明（任意）
}
```

#### 使用例

```typescript
// 基本的な使用（デフォルト設定）
const list = await EstatStatsListService.getAndFormatStatsList();

console.log(`取得件数: ${list.length}`);
list.forEach(item => {
  console.log(`${item.id}: ${item.title}`);
});
```

```typescript
// キーワード検索
const searchResults = await EstatStatsListService.getAndFormatStatsList({
  searchWord: '人口',
  searchKind: '1',  // 政府統計名で検索
  limit: 50
});

searchResults.forEach(item => {
  console.log(`統計名: ${item.statName}`);
  console.log(`表題: ${item.title}`);
  console.log(`更新日: ${item.updatedDate}`);
  console.log('---');
});
```

```typescript
// ページネーション
const page2 = await EstatStatsListService.getAndFormatStatsList({
  startPosition: 21,  // 21件目から取得
  limit: 20           // 20件取得
});
```

### 2. getStatsListRaw()

整形前の生データを取得します。

#### シグネチャ

```typescript
static async getStatsListRaw(
  options: {
    searchWord?: string;
    searchKind?: "1" | "2" | "3";
    startPosition?: number;
    limit?: number;
  } = {}
): Promise<EstatStatsListResponse>
```

#### 使用例

```typescript
const rawList = await EstatStatsListService.getStatsListRaw({
  searchWord: '人口',
  limit: 10
});

console.log(rawList.GET_STATS_LIST?.DATALIST_INF);
```

### 3. formatStatsList()

生のAPIレスポンスを整形します。

#### シグネチャ

```typescript
static formatStatsList(
  response: EstatStatsListResponse
): FormattedStatListItem[]
```

#### 使用例

```typescript
const rawList = await EstatStatsListService.getStatsListRaw();
const formattedList = EstatStatsListService.formatStatsList(rawList);
```

## データ整形の仕組み

### レスポンスのパース

APIレスポンスから必要な情報を抽出し、統一された形式に変換します。

**入力**: `EstatStatsListResponse`

```typescript
{
  GET_STATS_LIST: {
    DATALIST_INF: {
      LIST_INF: {
        TABLE_INF: [
          {
            "@id": "0000010101",
            STAT_NAME: { $: "国勢調査" },
            TITLE: { $: "人口等基本集計" },
            GOV_ORG: { $: "総務省" },
            STATISTICS_NAME: "人口・世帯数",
            SURVEY_DATE: "2020",
            UPDATED_DATE: "2021-11-30"
          },
          // ...
        ]
      }
    }
  }
}
```

**出力**: `FormattedStatListItem[]`

```typescript
[
  {
    id: "0000010101",
    statName: "国勢調査",
    title: "人口等基本集計",
    govOrg: "総務省",
    statisticsName: "人口・世帯数",
    surveyDate: "2020",
    updatedDate: "2021-11-30"
  },
  // ...
]
```

### 配列の正規化

APIレスポンスは、1件の場合はオブジェクト、複数件の場合は配列として返されるため、常に配列として扱えるように正規化します。

```typescript
const tableArray = Array.isArray(tables) ? tables : [tables];
```

### 文字列のクリーンアップ

取得した文字列データは `trim()` で前後の空白を削除し、`cleanString()` で整形します。

## 検索機能の詳細

### searchKind パラメータ

検索対象を指定します。

| 値 | 検索対象 | 説明 |
|----|---------|------|
| `"1"` | 政府統計名 | 統計の名称（例: 国勢調査、労働力調査） |
| `"2"` | 統計表題 | 個別の統計表のタイトル |
| `"3"` | 項目名 | 統計項目の名称 |

#### 使用例

```typescript
// 政府統計名で検索
const byStatName = await EstatStatsListService.getAndFormatStatsList({
  searchWord: '国勢調査',
  searchKind: '1'
});

// 統計表題で検索
const byTitle = await EstatStatsListService.getAndFormatStatsList({
  searchWord: '人口等基本集計',
  searchKind: '2'
});

// 項目名で検索
const byItem = await EstatStatsListService.getAndFormatStatsList({
  searchWord: '総人口',
  searchKind: '3'
});
```

## ページネーション

大量のデータを分割して取得するためのページネーション機能を提供します。

### 基本的な使い方

```typescript
const limit = 20;
const totalPages = 5;

for (let page = 1; page <= totalPages; page++) {
  const startPosition = (page - 1) * limit + 1;

  const list = await EstatStatsListService.getAndFormatStatsList({
    startPosition,
    limit
  });

  console.log(`Page ${page}:`, list.length, '件');

  // データ処理
  processData(list);
}
```

### ヘルパー関数の実装例

```typescript
async function fetchAllPages(
  searchWord: string,
  maxPages: number = 10
): Promise<FormattedStatListItem[]> {
  const allResults: FormattedStatListItem[] = [];
  const limit = 100;

  for (let page = 0; page < maxPages; page++) {
    const startPosition = page * limit + 1;

    const results = await EstatStatsListService.getAndFormatStatsList({
      searchWord,
      startPosition,
      limit
    });

    if (results.length === 0) {
      break; // データがなくなったら終了
    }

    allResults.push(...results);
  }

  return allResults;
}

// 使用例
const allStats = await fetchAllPages('人口');
console.log(`総件数: ${allStats.length}`);
```

## 実用的な使用例

### 1. 最新の統計表を取得

```typescript
const recentStats = await EstatStatsListService.getAndFormatStatsList({
  limit: 10
});

// 更新日でソート
recentStats.sort((a, b) =>
  new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime()
);

console.log('最新の統計表:');
recentStats.forEach(stat => {
  console.log(`${stat.title} (更新: ${stat.updatedDate})`);
});
```

### 2. 特定の省庁の統計を検索

```typescript
const allStats = await EstatStatsListService.getAndFormatStatsList({
  limit: 100
});

// 総務省の統計のみをフィルタ
const somuStats = allStats.filter(stat =>
  stat.govOrg.includes('総務省')
);

console.log(`総務省の統計: ${somuStats.length}件`);
```

### 3. 統計表IDのリストを作成

```typescript
const stats = await EstatStatsListService.getAndFormatStatsList({
  searchWord: '人口',
  limit: 50
});

// 統計表IDのみを抽出
const statsIds = stats.map(stat => stat.id);

console.log('統計表ID一覧:', statsIds);

// 各統計表のデータを取得
for (const id of statsIds) {
  const data = await EstatStatsDataService.getAndFormatStatsData(id);
  // データ処理...
}
```

### 4. 統計情報のサマリー作成

```typescript
const stats = await EstatStatsListService.getAndFormatStatsList({
  limit: 200
});

// 作成機関別の集計
const orgCounts = stats.reduce((acc, stat) => {
  acc[stat.govOrg] = (acc[stat.govOrg] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('作成機関別統計表数:');
Object.entries(orgCounts)
  .sort(([, a], [, b]) => b - a)
  .forEach(([org, count]) => {
    console.log(`${org}: ${count}件`);
  });
```

### 5. 調査年別の統計数

```typescript
const stats = await EstatStatsListService.getAndFormatStatsList({
  limit: 200
});

// 調査年別の集計
const yearCounts = stats.reduce((acc, stat) => {
  const year = stat.surveyDate.substring(0, 4); // YYYYを抽出
  acc[year] = (acc[year] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('調査年別統計表数:');
Object.entries(yearCounts)
  .sort(([a], [b]) => b.localeCompare(a))
  .forEach(([year, count]) => {
    console.log(`${year}年: ${count}件`);
  });
```

## エラーハンドリング

メソッドは、エラー発生時に詳細な情報をログに出力し、わかりやすいエラーメッセージを含む例外をスローします。

```typescript
try {
  const list = await EstatStatsListService.getAndFormatStatsList({
    searchWord: '人口'
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('統計リストの取得に失敗:', error.message);
  }
}
```

## パフォーマンスに関する注意事項

### 1. limit の適切な設定

一度に大量のデータを取得すると処理時間が長くなります。適切な `limit` 値を設定してください。

```typescript
// 推奨: 適切な件数を指定
const list = await EstatStatsListService.getAndFormatStatsList({
  limit: 50
});
```

### 2. 検索条件の活用

無駄なデータ取得を避けるため、検索条件を活用してください。

```typescript
// 良い例: 検索条件で絞り込み
const list = await EstatStatsListService.getAndFormatStatsList({
  searchWord: '国勢調査',
  searchKind: '1'
});

// 悪い例: すべて取得してから絞り込み
const all = await EstatStatsListService.getAndFormatStatsList({
  limit: 1000
});
const filtered = all.filter(item => item.statName.includes('国勢調査'));
```

## API制限に関する注意

e-Stat APIには利用制限があります。連続して多数のリクエストを送信する場合は、適切な間隔を空けてください。

```typescript
async function fetchWithDelay(
  requests: Array<{ searchWord: string }>,
  delayMs: number = 1000
): Promise<FormattedStatListItem[][]> {
  const results: FormattedStatListItem[][] = [];

  for (const req of requests) {
    const data = await EstatStatsListService.getAndFormatStatsList(req);
    results.push(data);

    // 次のリクエストまで待機
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  return results;
}
```

## 関連ドキュメント

- [型定義: FormattedStatListItem](types.md#formattedstatlistitem)
- [EstatStatsDataService](stats-data-service.md)
- [使用例](examples.md#estatstatslistservice)
- [ライブラリ概要](02_domain/estat-api/specifications/overview.md)
