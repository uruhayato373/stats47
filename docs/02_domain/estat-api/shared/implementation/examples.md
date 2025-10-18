---
title: 使用例
created: 2025-10-14
updated: 2025-10-16
tags:
  - domain/estat-api
  - implementation
---

# 使用例

## 概要

このドキュメントでは、e-Stat ライブラリの実践的な使用例を紹介します。

## 目次

1. [基本的な使い方](#基本的な使い方)
2. [統計データの取得](#統計データの取得)
3. [統計リストの取得](#統計リストの取得)
4. [メタ情報の管理](#メタ情報の管理)
5. [データの加工と分析](#データの加工と分析)
6. [エラーハンドリング](#エラーハンドリング)
7. [実践的なユースケース](#実践的なユースケース)

## 基本的な使い方

### インポート

```typescript
import {
  EstatStatsDataService,
  EstatStatsListService,
  EstatMetaInfoService,
  FormattedEstatData,
  FormattedValue,
} from "@/lib/estat";
```

### 最小限の例

```typescript
// 統計データを取得
const data = await EstatStatsDataService.getAndFormatStatsData("0000010101");

console.log(`統計表: ${data.tableInfo.title}`);
console.log(`データ件数: ${data.values.length}`);
```

## 統計データの取得

### 例 1: 基本的なデータ取得

```typescript
async function fetchBasicData() {
  const statsDataId = "0000010101";

  const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);

  console.log("=== 統計表情報 ===");
  console.log(`ID: ${data.tableInfo.id}`);
  console.log(`タイトル: ${data.tableInfo.title}`);
  console.log(`政府統計名: ${data.tableInfo.statName}`);
  console.log(`作成機関: ${data.tableInfo.govOrg}`);

  console.log("\n=== データ概要 ===");
  console.log(`地域数: ${data.areas.length}`);
  console.log(`カテゴリ数: ${data.categories.length}`);
  console.log(`年度数: ${data.years.length}`);
  console.log(`データ件数: ${data.values.length}`);
  console.log(`有効な値: ${data.metadata.validValues}`);
  console.log(`NULL値: ${data.metadata.nullValues}`);

  return data;
}
```

### 例 2: フィルタリングを使用したデータ取得

```typescript
async function fetchFilteredData() {
  const statsDataId = "0000010101";

  // 東京都の総人口（2020年）のデータを取得
  const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId, {
    categoryFilter: "A1101", // 総人口
    yearFilter: "2020", // 2020年
    areaFilter: "13000", // 東京都
    limit: 100,
  });

  console.log("=== フィルタ条件 ===");
  console.log("カテゴリ: 総人口");
  console.log("年度: 2020年");
  console.log("地域: 東京都");

  console.log("\n=== 取得データ ===");
  data.values.forEach((value) => {
    console.log(
      `${value.areaName} (${value.timeName}): ${value.value?.toLocaleString()}${
        value.unit
      }`
    );
  });

  return data;
}
```

### 例 3: 都道府県別データの取得

```typescript
async function fetchPrefectureData() {
  const statsDataId = "0000010101";
  const categoryCode = "A1101"; // 総人口
  const yearCode = "2020";

  const prefectureData = await EstatStatsDataService.getPrefectureDataByYear(
    statsDataId,
    categoryCode,
    yearCode
  );

  console.log(`=== ${yearCode}年 都道府県別人口 ===`);

  // 人口順にソート
  const sorted = prefectureData.sort((a, b) => (b.value || 0) - (a.value || 0));

  // Top 10を表示
  console.log("\nTop 10:");
  sorted.slice(0, 10).forEach((data, index) => {
    console.log(
      `${index + 1}. ${data.areaName}: ${data.value?.toLocaleString()}${
        data.unit
      }`
    );
  });

  return prefectureData;
}
```

### 例 4: 利用可能な年度の取得

```typescript
async function fetchAvailableYears() {
  const statsDataId = "0000010101";
  const categoryCode = "A1101";

  const years = await EstatStatsDataService.getAvailableYears(
    statsDataId,
    categoryCode
  );

  console.log("=== 利用可能な年度 ===");
  years.forEach((year) => {
    console.log(`- ${year}`);
  });

  return years;
}
```

### 例 5: 複数年度のデータを取得

```typescript
async function fetchMultipleYearsData() {
  const statsDataId = "0000010101";
  const categoryCode = "A1101";
  const areaCode = "13000"; // 東京都

  // 利用可能な年度を取得
  const years = await EstatStatsDataService.getAvailableYears(
    statsDataId,
    categoryCode
  );

  console.log("=== 東京都の人口推移 ===");

  // 各年度のデータを取得
  for (const year of years) {
    const data = await EstatStatsDataService.getAndFormatStatsData(
      statsDataId,
      {
        categoryFilter: categoryCode,
        yearFilter: year,
        areaFilter: areaCode,
      }
    );

    const value = data.values.find((v) => v.areaCode === areaCode);
    if (value) {
      console.log(`${year}年: ${value.value?.toLocaleString()}${value.unit}`);
    }

    // API制限を考慮して待機
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
```

## 統計リストの取得

### 例 6: 統計リストの基本的な取得

```typescript
async function fetchStatsList() {
  const list = await EstatStatsListService.getAndFormatStatsList({
    limit: 20,
  });

  console.log("=== 統計リスト ===");

  list.forEach((item, index) => {
    console.log(`\n${index + 1}. ${item.title}`);
    console.log(`   ID: ${item.id}`);
    console.log(`   政府統計名: ${item.statName}`);
    console.log(`   作成機関: ${item.govOrg}`);
    console.log(`   調査年月: ${item.surveyDate}`);
    console.log(`   更新日: ${item.updatedDate}`);
  });

  return list;
}
```

### 例 7: キーワード検索

```typescript
async function searchStats(keyword: string) {
  const results = await EstatStatsListService.getAndFormatStatsList({
    searchWord: keyword,
    searchKind: "1", // 政府統計名で検索
    limit: 50,
  });

  console.log(`=== "${keyword}" の検索結果 ===`);
  console.log(`${results.length}件見つかりました\n`);

  results.forEach((item, index) => {
    console.log(`${index + 1}. ${item.statName}`);
    console.log(`   ${item.title}`);
    console.log(`   更新: ${item.updatedDate}\n`);
  });

  return results;
}

// 使用例
await searchStats("人口");
await searchStats("労働力");
await searchStats("家計");
```

### 例 8: 統計表 ID のリストを作成

```typescript
async function createStatsIdList(keyword: string) {
  const results = await EstatStatsListService.getAndFormatStatsList({
    searchWord: keyword,
    limit: 100,
  });

  // 統計表IDのリストを作成
  const statsIds = results.map((item) => ({
    id: item.id,
    title: item.title,
    statName: item.statName,
  }));

  console.log(`=== "${keyword}" の統計表ID一覧 ===`);
  console.log(`総数: ${statsIds.length}件\n`);

  statsIds.forEach((stat) => {
    console.log(`${stat.id}: ${stat.title} (${stat.statName})`);
  });

  return statsIds;
}
```

## メタ情報の管理

### 例 9: メタ情報の取得と保存

```typescript
async function saveMetaInfo(db: D1Database, statsDataId: string) {
  const metaService = new EstatMetaInfoService(db);

  console.log(`=== メタ情報の取得と保存: ${statsDataId} ===`);

  const result = await metaService.processAndSaveMetaInfo(statsDataId);

  if (result.success) {
    console.log(
      `✅ 成功: ${result.entriesProcessed}件のメタ情報を保存しました`
    );
  } else {
    console.error(`❌ 失敗: ${result.error}`);
  }

  return result;
}
```

### 例 10: 複数の統計表のメタ情報を一括取得

```typescript
async function bulkSaveMetaInfo(db: D1Database) {
  const metaService = new EstatMetaInfoService(db);

  const statsIds = [
    "0000010101", // 国勢調査
    "0003109687", // 労働力調査
    "0003103532", // 家計調査
    "0003348423", // 消費者物価指数
    "0003410379", // 景気動向指数
  ];

  console.log("=== メタ情報の一括取得開始 ===");
  console.log(`対象: ${statsIds.length}件\n`);

  const result = await metaService.processBulkMetaInfo(statsIds, {
    batchSize: 5,
    delayMs: 1000,
  });

  console.log("\n=== 処理結果 ===");
  console.log(`総処理数: ${result.totalProcessed}`);
  console.log(`成功: ${result.successCount}`);
  console.log(`失敗: ${result.failureCount}`);

  // 失敗したIDを表示
  const failures = result.results.filter((r) => !r.success);
  if (failures.length > 0) {
    console.log("\n=== 失敗したID ===");
    failures.forEach((f) => {
      console.error(`${f.statsDataId}: ${f.error}`);
    });
  }

  return result;
}
```

### 例 11: メタ情報の検索

```typescript
async function searchMetaInfo(db: D1Database, keyword: string) {
  const metaService = new EstatMetaInfoService(db);

  console.log(`=== "${keyword}" でメタ情報を検索 ===`);

  const result = await metaService.searchMetaInfo(keyword, {
    searchType: "full",
    limit: 50,
  });

  console.log(`${result.totalCount}件が見つかりました\n`);

  result.entries.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.item_name || "(名前なし)"}`);
    console.log(`   統計名: ${entry.stat_name}`);
    console.log(`   カテゴリ: ${entry.cat01}`);
    console.log(`   単位: ${entry.unit || "(なし)"}\n`);
  });

  return result;
}
```

### 例 12: サマリー情報の取得

```typescript
async function getMetaSummary(db: D1Database) {
  const metaService = new EstatMetaInfoService(db);

  const summary = await metaService.getMetaInfoSummary();

  console.log("=== メタ情報サマリー ===");
  console.log(`総エントリ数: ${summary.totalEntries.toLocaleString()}件`);
  console.log(`統計表数: ${summary.uniqueStats.toLocaleString()}件`);
  console.log(`最終更新: ${summary.lastUpdated || "(未更新)"}`);

  console.log("\n=== カテゴリ別Top 10 ===");
  summary.categories.slice(0, 10).forEach((cat, index) => {
    console.log(`${index + 1}. ${cat.name} (${cat.code}): ${cat.count}件`);
  });

  return summary;
}
```

## データの加工と分析

### 例 13: データの CSV 出力

```typescript
import * as fs from "fs";

async function exportToCSV(statsDataId: string, outputPath: string) {
  const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);

  // CSVヘッダー
  const headers = [
    "地域コード",
    "地域名",
    "カテゴリコード",
    "カテゴリ名",
    "年度コード",
    "年度名",
    "値",
    "単位",
  ];

  // CSVデータ
  const rows = data.values.map((v) => [
    v.areaCode,
    v.areaName,
    v.categoryCode,
    v.categoryName,
    v.timeCode,
    v.timeName,
    v.value?.toString() || "",
    v.unit || "",
  ]);

  // CSV文字列を生成
  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
    "\n"
  );

  // ファイルに書き込み
  fs.writeFileSync(outputPath, csv, "utf-8");

  console.log(`CSVファイルを出力しました: ${outputPath}`);
  console.log(`データ件数: ${rows.length}件`);
}

// 使用例
await exportToCSV("0000010101", "./output.csv");
```

### 例 14: ランキングの作成

```typescript
async function createRanking() {
  const statsDataId = "0000010101";
  const categoryCode = "A1101"; // 総人口
  const yearCode = "2020";

  const data = await EstatStatsDataService.getPrefectureDataByYear(
    statsDataId,
    categoryCode,
    yearCode
  );

  // 降順にソート
  const ranked = data
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

  console.log(`=== ${yearCode}年 都道府県別人口ランキング ===\n`);

  ranked.forEach((item) => {
    console.log(
      `${item.rank}位: ${item.areaName} - ${item.value?.toLocaleString()}${
        item.unit
      }`
    );
  });

  return ranked;
}
```

### 例 15: 統計量の計算

```typescript
function calculateStatistics(values: FormattedValue[]) {
  const validValues = values
    .map((v) => v.value)
    .filter((v): v is number => v !== null);

  if (validValues.length === 0) {
    return null;
  }

  // ソート
  const sorted = [...validValues].sort((a, b) => a - b);

  // 基本統計量
  const count = validValues.length;
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  // 中央値
  const midIndex = Math.floor(count / 2);
  const median =
    count % 2 === 0
      ? (sorted[midIndex - 1] + sorted[midIndex]) / 2
      : sorted[midIndex];

  // 標準偏差
  const variance =
    validValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  return {
    count,
    sum,
    mean,
    median,
    min,
    max,
    variance,
    stdDev,
  };
}

// 使用例
async function analyzeData() {
  const data = await EstatStatsDataService.getAndFormatStatsData("0000010101");
  const stats = calculateStatistics(data.values);

  if (stats) {
    console.log("=== 統計量 ===");
    console.log(`データ数: ${stats.count}`);
    console.log(`合計: ${stats.sum.toLocaleString()}`);
    console.log(`平均: ${stats.mean.toLocaleString()}`);
    console.log(`中央値: ${stats.median.toLocaleString()}`);
    console.log(`最小値: ${stats.min.toLocaleString()}`);
    console.log(`最大値: ${stats.max.toLocaleString()}`);
    console.log(`標準偏差: ${stats.stdDev.toLocaleString()}`);
  }
}
```

## エラーハンドリング

### 例 16: 基本的なエラーハンドリング

```typescript
async function fetchDataWithErrorHandling(statsDataId: string) {
  try {
    console.log(`データ取得開始: ${statsDataId}`);

    const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);

    console.log("✅ データ取得成功");
    console.log(`データ件数: ${data.values.length}`);

    return data;
  } catch (error) {
    console.error("❌ データ取得失敗");

    if (error instanceof Error) {
      console.error(`エラーメッセージ: ${error.message}`);
      console.error(`スタックトレース: ${error.stack}`);
    } else {
      console.error("不明なエラー:", error);
    }

    return null;
  }
}
```

### 例 17: リトライ機能付きデータ取得

```typescript
async function fetchDataWithRetry(
  statsDataId: string,
  maxRetries: number = 3,
  delayMs: number = 1000
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`試行 ${attempt}/${maxRetries}: データ取得中...`);

      const data = await EstatStatsDataService.getAndFormatStatsData(
        statsDataId
      );

      console.log("✅ 成功");
      return data;
    } catch (error) {
      console.error(`❌ 試行 ${attempt} 失敗:`, error);

      if (attempt < maxRetries) {
        console.log(`${delayMs}ms待機後、再試行します...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error("すべての試行が失敗しました");
        throw error;
      }
    }
  }
}
```

## 実践的なユースケース

### 例 18: 都道府県別人口データの可視化用データ作成

```typescript
async function createVisualizationData() {
  const statsDataId = "0000010101";
  const categoryCode = "A1101";
  const years = ["2000", "2005", "2010", "2015", "2020"];

  const result = [];

  for (const year of years) {
    const data = await EstatStatsDataService.getPrefectureDataByYear(
      statsDataId,
      categoryCode,
      year
    );

    result.push({
      year,
      data: data.map((item) => ({
        prefCode: item.areaCode,
        prefName: item.areaName,
        population: item.value,
      })),
    });

    // API制限を考慮
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("=== 可視化用データ ===");
  console.log(JSON.stringify(result, null, 2));

  return result;
}
```

### 例 19: ダッシュボード用データの作成

```typescript
async function createDashboardData(db: D1Database) {
  const metaService = new EstatMetaInfoService(db);

  // サマリー情報
  const summary = await metaService.getMetaInfoSummary();

  // 最新の統計表
  const recentStats = await metaService.getStatsList({
    orderBy: "last_updated",
  });

  // 人気カテゴリTop 5
  const topCategories = summary.categories.slice(0, 5);

  const dashboard = {
    overview: {
      totalEntries: summary.totalEntries,
      uniqueStats: summary.uniqueStats,
      lastUpdated: summary.lastUpdated,
    },
    recentStats: recentStats.slice(0, 10).map((stat) => ({
      id: stat.stats_data_id,
      name: stat.stat_name,
      title: stat.title,
      itemCount: stat.item_count,
      lastUpdated: stat.last_updated,
    })),
    topCategories: topCategories.map((cat) => ({
      code: cat.code,
      name: cat.name,
      count: cat.count,
    })),
  };

  console.log("=== ダッシュボードデータ ===");
  console.log(JSON.stringify(dashboard, null, 2));

  return dashboard;
}
```

### 例 20: API Route での使用例（Next.js App Router）

```typescript
// app/api/stats/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { EstatStatsDataService } from "@/lib/estat";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;

    // クエリパラメータを取得
    const categoryFilter = searchParams.get("category") || undefined;
    const yearFilter = searchParams.get("year") || undefined;
    const areaFilter = searchParams.get("area") || undefined;
    const limit = parseInt(searchParams.get("limit") || "1000");

    // データを取得
    const data = await EstatStatsDataService.getAndFormatStatsData(id, {
      categoryFilter,
      yearFilter,
      areaFilter,
      limit,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
```

### 例 21: Cloudflare Workers での使用例

```typescript
// worker.ts
import { EstatStatsDataService, EstatMetaInfoService } from "@/lib/estat";

export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // メタ情報の検索
      if (path.startsWith("/api/meta/search")) {
        const query = url.searchParams.get("q") || "";
        const metaService = new EstatMetaInfoService(env.DB);

        const result = await metaService.searchMetaInfo(query, {
          limit: 50,
        });

        return Response.json({
          success: true,
          data: result,
        });
      }

      // 統計データの取得
      if (path.startsWith("/api/stats/")) {
        const statsDataId = path.split("/").pop() || "";
        const category = url.searchParams.get("category") || undefined;
        const year = url.searchParams.get("year") || undefined;

        const data = await EstatStatsDataService.getAndFormatStatsData(
          statsDataId,
          {
            categoryFilter: category,
            yearFilter: year,
          }
        );

        return Response.json({
          success: true,
          data,
        });
      }

      return new Response("Not Found", { status: 404 });
    } catch (error) {
      return Response.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  },
};
```

## まとめ

このドキュメントでは、e-Stat ライブラリの様々な使用例を紹介しました。実際のアプリケーション開発では、これらの例を組み合わせて使用することで、効率的に e-Stat データを活用できます。

## 関連ドキュメント

- [ライブラリ概要](../overview.md)
- [API 統合ガイド](api-integration.md)
- [データ取得実装](data-fetching.md)
- [ベストプラクティス](best-practices.md)
- [開始ガイド](getting-started.md)
