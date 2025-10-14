# e-Stat データフォーマット改善提案

## 概要

現在の `formatStatsData` メソッドでは、e-Stat APIから取得した統計データの一部の情報のみを変換しています。
CMS（コンテンツ管理システム）やWebサイト構築で活用するために、追加の情報を含めた改善を提案します。

## 現在の問題点

### 不足している情報

CMS Dashboard Data.jsonには以下の重要な情報が含まれていますが、現在のフォーマットでは欠落しています：

1. **更新管理に関する情報**
   - `UPDATED_DATE`: 更新日（サイトの鮮度表示に必須）
   - `OPEN_DATE`: 公開日
   - `SURVEY_DATE`: 調査年月

2. **データ特性に関する情報**
   - `CYCLE`: 提供周期（年度次、月次など）
   - `SMALL_AREA`: 小地域属性
   - `COLLECT_AREA`: 集計地域区分
   - `OVERALL_TOTAL_NUMBER`: 全体の総件数

3. **分類・カテゴリ情報**
   - `MAIN_CATEGORY`: 分野（大分類）
   - `SUB_CATEGORY`: 分野（小分類）
   - `STATISTICS_NAME_SPEC`: 提供統計名の詳細仕様

4. **メタデータ**
   - `DESCRIPTION`: 説明・解説文
   - `NOTE`: データの注記情報（特殊文字の意味）

## 改善された型定義

### EnhancedFormattedEstatData

```typescript
/**
 * CMS・Webサイト構築向け拡張統計データ
 */
export interface EnhancedFormattedEstatData {
  // 基本情報（拡張版）
  tableInfo: EnhancedTableInfo;

  // データ構造
  areas: FormattedArea[];
  categories: FormattedCategory[];
  years: FormattedYear[];
  values: FormattedValue[];

  // メタデータ（拡張版）
  metadata: EnhancedMetadata;

  // 注記情報
  notes?: DataNote[];
}

/**
 * 拡張版テーブル情報
 */
export interface EnhancedTableInfo {
  // 既存フィールド
  id: string;                          // 統計表ID
  title: string;                       // 統計表題名
  statName: string;                    // 政府統計名
  statCode: string;                    // 政府統計コード（追加）
  govOrg: string;                      // 作成機関名
  govOrgCode: string;                  // 作成機関コード（追加）
  statisticsName: string;              // 提供統計名

  // データ範囲情報
  totalNumber: number;                 // 総データ件数
  fromNumber: number;                  // 開始番号
  toNumber: number;                    // 終了番号
  overallTotalNumber?: number;         // 全体の総件数（追加）

  // 日付情報（追加）
  dates: {
    surveyDate: number | string;       // 調査年月
    openDate: string;                  // 公開日
    updatedDate: string;               // 更新日（重要）
  };

  // データ特性（追加）
  characteristics: {
    cycle: string;                     // 提供周期（年度次、月次など）
    smallArea: number;                 // 小地域属性（0,1,2）
    collectArea: string;               // 集計地域区分
  };

  // 分類情報（追加）
  classification: {
    mainCategory: {
      code: string;
      name: string;
    };
    subCategory: {
      code: string;
      name: string;
    };
  };

  // 提供統計名詳細（追加）
  statisticsNameSpec?: {
    tabulationCategory: string;        // 集計カテゴリ
    tabulationSubCategory1?: string;   // 集計サブカテゴリ1
    tabulationSubCategory2?: string;   // 集計サブカテゴリ2
    tabulationSubCategory3?: string;   // 集計サブカテゴリ3
  };

  // 説明（追加）
  description?: {
    tabulationCategoryExplanation?: string;  // 集計カテゴリの説明
    general?: string;                         // 一般的な説明
  };
}

/**
 * 拡張版メタデータ
 */
export interface EnhancedMetadata {
  // 処理情報
  processedAt: string;                 // 処理日時
  dataSource: 'e-stat';                // データソース
  apiVersion?: string;                 // APIバージョン

  // データ統計
  stats: {
    totalRecords: number;              // 総レコード数
    validValues: number;               // 有効な値の数
    nullValues: number;                // NULL値の数
    nullPercentage: number;            // NULL値の割合（追加）
  };

  // データ範囲
  range?: {
    years: {
      min: string;                     // 最古の年度
      max: string;                     // 最新の年度
      count: number;                   // 年度数
    };
    areas: {
      count: number;                   // 地域数
      prefectureCount: number;         // 都道府県数（level=2）
      hasNational: boolean;            // 全国データの有無
    };
    categories: {
      count: number;                   // カテゴリ数
    };
  };

  // データ品質
  quality?: {
    completenessScore: number;         // 完全性スコア（0-100）
    lastVerified?: string;             // 最終検証日時
  };
}

/**
 * データ注記
 */
export interface DataNote {
  char: string;                        // 注記文字（***, -, X など）
  description: string;                 // 説明
}
```

## 改善版 formatStatsData の実装イメージ

```typescript
/**
 * 統計データレスポンスを拡張フォーマットに整形
 */
static formatStatsDataEnhanced(
  response: EstatStatsDataResponse
): EnhancedFormattedEstatData {
  const data = response.GET_STATS_DATA?.STATISTICAL_DATA;
  if (!data) {
    throw new Error("統計データが見つかりません");
  }

  const tableInf = data.TABLE_INF;

  // 拡張版テーブル情報
  const tableInfo: EnhancedTableInfo = {
    // 基本情報
    id: tableInf?.["@id"] || "",
    title: tableInf?.TITLE?.$ || "",
    statName: tableInf?.STAT_NAME?.$ || "",
    statCode: tableInf?.STAT_NAME?.["@code"] || "",
    govOrg: tableInf?.GOV_ORG?.$ || "",
    govOrgCode: tableInf?.GOV_ORG?.["@code"] || "",
    statisticsName: tableInf?.STATISTICS_NAME || "",

    // データ範囲
    totalNumber: parseInt(tableInf?.TOTAL_NUMBER || "0"),
    fromNumber: parseInt(tableInf?.FROM_NUMBER || "0"),
    toNumber: parseInt(tableInf?.TO_NUMBER || "0"),
    overallTotalNumber: tableInf?.OVERALL_TOTAL_NUMBER
      ? parseInt(tableInf.OVERALL_TOTAL_NUMBER)
      : undefined,

    // 日付情報
    dates: {
      surveyDate: tableInf?.SURVEY_DATE || 0,
      openDate: tableInf?.OPEN_DATE || "",
      updatedDate: tableInf?.UPDATED_DATE || "",
    },

    // データ特性
    characteristics: {
      cycle: tableInf?.CYCLE || "",
      smallArea: tableInf?.SMALL_AREA || 0,
      collectArea: tableInf?.COLLECT_AREA || "",
    },

    // 分類情報
    classification: {
      mainCategory: {
        code: tableInf?.MAIN_CATEGORY?.["@code"] || "",
        name: tableInf?.MAIN_CATEGORY?.$ || "",
      },
      subCategory: {
        code: tableInf?.SUB_CATEGORY?.["@code"] || "",
        name: tableInf?.SUB_CATEGORY?.$ || "",
      },
    },

    // 提供統計名詳細
    statisticsNameSpec: tableInf?.STATISTICS_NAME_SPEC ? {
      tabulationCategory: tableInf.STATISTICS_NAME_SPEC.TABULATION_CATEGORY || "",
      tabulationSubCategory1: tableInf.STATISTICS_NAME_SPEC.TABULATION_SUB_CATEGORY1,
      tabulationSubCategory2: tableInf.STATISTICS_NAME_SPEC.TABULATION_SUB_CATEGORY2,
      tabulationSubCategory3: tableInf.STATISTICS_NAME_SPEC.TABULATION_SUB_CATEGORY3,
    } : undefined,

    // 説明
    description: tableInf?.DESCRIPTION ? {
      tabulationCategoryExplanation:
        tableInf.DESCRIPTION.TABULATION_CATEGORY_EXPLANATION,
      general: tableInf.DESCRIPTION.$,
    } : undefined,
  };

  // データ整形（既存のロジック）
  const areas = this.formatAreas(data);
  const categories = this.formatCategories(data);
  const years = this.formatYears(data);
  const values = this.formatValues(data, areas, categories, years);

  // 注記情報
  const notes: DataNote[] = data.DATA_INF?.NOTE
    ? (Array.isArray(data.DATA_INF.NOTE)
        ? data.DATA_INF.NOTE
        : [data.DATA_INF.NOTE]
      ).map(note => ({
        char: note["@char"] || "",
        description: note.$ || "",
      }))
    : [];

  // 拡張メタデータ計算
  const validValues = values.filter((v) => v.value !== null).length;
  const nullValues = values.length - validValues;
  const nullPercentage = values.length > 0
    ? (nullValues / values.length) * 100
    : 0;

  // 年度範囲
  const yearCodes = years.map(y => y.timeCode).sort();
  const yearRange = yearCodes.length > 0 ? {
    min: yearCodes[0],
    max: yearCodes[yearCodes.length - 1],
    count: yearCodes.length,
  } : undefined;

  // 地域範囲
  const prefectures = areas.filter(a => a.level === "2" && a.areaCode !== "00000");
  const hasNational = areas.some(a => a.areaCode === "00000");
  const areaRange = {
    count: areas.length,
    prefectureCount: prefectures.length,
    hasNational,
  };

  // カテゴリ範囲
  const categoryRange = {
    count: categories.length,
  };

  // 完全性スコア計算（簡易版）
  const completenessScore = Math.round(
    ((validValues / values.length) * 100) || 0
  );

  const metadata: EnhancedMetadata = {
    processedAt: new Date().toISOString(),
    dataSource: 'e-stat',

    stats: {
      totalRecords: values.length,
      validValues,
      nullValues,
      nullPercentage: Math.round(nullPercentage * 100) / 100,
    },

    range: yearRange ? {
      years: yearRange,
      areas: areaRange,
      categories: categoryRange,
    } : undefined,

    quality: {
      completenessScore,
      lastVerified: new Date().toISOString(),
    },
  };

  return {
    tableInfo,
    areas,
    categories,
    years,
    values,
    metadata,
    notes,
  };
}
```

## CMS/Webサイトでの活用例

### 1. データ鮮度の表示

```typescript
// データの更新日を表示
const updatedDate = data.tableInfo.dates.updatedDate;
console.log(`最終更新: ${updatedDate}`);

// データの鮮度をチェック
const daysSinceUpdate = Math.floor(
  (Date.now() - new Date(updatedDate).getTime()) / (1000 * 60 * 60 * 24)
);

if (daysSinceUpdate > 365) {
  console.warn('このデータは1年以上更新されていません');
}
```

### 2. データ品質インジケーター

```typescript
// 完全性スコアに基づく品質表示
const score = data.metadata.quality?.completenessScore || 0;

if (score >= 90) {
  return <Badge color="green">高品質データ</Badge>;
} else if (score >= 70) {
  return <Badge color="yellow">標準品質</Badge>;
} else {
  return <Badge color="red">欠損値多数</Badge>;
}
```

### 3. メタデータの表示

```typescript
// データセット情報カード
<Card>
  <h2>{data.tableInfo.title}</h2>
  <dl>
    <dt>政府統計名</dt>
    <dd>{data.tableInfo.statName}</dd>

    <dt>作成機関</dt>
    <dd>{data.tableInfo.govOrg}</dd>

    <dt>提供周期</dt>
    <dd>{data.tableInfo.characteristics.cycle}</dd>

    <dt>データ期間</dt>
    <dd>
      {data.metadata.range?.years.min} 〜 {data.metadata.range?.years.max}
      （{data.metadata.range?.years.count}年分）
    </dd>

    <dt>対象地域</dt>
    <dd>
      {data.metadata.range?.areas.hasNational && '全国 + '}
      都道府県{data.metadata.range?.areas.prefectureCount}件
    </dd>

    <dt>最終更新</dt>
    <dd>{data.tableInfo.dates.updatedDate}</dd>
  </dl>
</Card>
```

### 4. データ注記の表示

```typescript
// 特殊文字の凡例を表示
<div className="data-notes">
  <h3>データ記号の意味</h3>
  <ul>
    {data.notes?.map(note => (
      <li key={note.char}>
        <code>{note.char}</code>: {note.description}
      </li>
    ))}
  </ul>
</div>
```

### 5. SEO最適化

```typescript
// 構造化データ（JSON-LD）の生成
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": data.tableInfo.title,
  "description": data.tableInfo.description?.tabulationCategoryExplanation,
  "creator": {
    "@type": "Organization",
    "name": data.tableInfo.govOrg
  },
  "datePublished": data.tableInfo.dates.openDate,
  "dateModified": data.tableInfo.dates.updatedDate,
  "temporalCoverage": `${data.metadata.range?.years.min}/${data.metadata.range?.years.max}`,
  "spatialCoverage": {
    "@type": "Place",
    "name": data.tableInfo.characteristics.collectArea
  }
};
```

## 保存形式の推奨

### ファイル構造

```
data/
├── formatted/
│   ├── 0000010101.json           # 整形済みデータ
│   ├── 0000010102.json
│   └── ...
├── metadata/
│   ├── index.json                 # 全データセットの一覧
│   └── catalog.json               # カタログ情報
└── cache/
    └── last-updated.json          # 最終更新情報
```

### index.json の構造

```typescript
interface DatasetIndex {
  datasets: Array<{
    id: string;
    title: string;
    statName: string;
    updatedDate: string;
    filePath: string;
    stats: {
      totalRecords: number;
      completenessScore: number;
    };
  }>;
  generatedAt: string;
}
```

## 実装の優先順位

### Phase 1: 必須項目（即座に実装）
- ✅ 更新日時（UPDATED_DATE）
- ✅ 公開日（OPEN_DATE）
- ✅ 提供周期（CYCLE）
- ✅ データ注記（NOTE）

### Phase 2: 重要項目（次の実装）
- ✅ 政府統計コード・作成機関コード
- ✅ 分野情報（MAIN_CATEGORY, SUB_CATEGORY）
- ✅ 年度・地域範囲の計算
- ✅ 完全性スコア

### Phase 3: 拡張項目（余裕があれば）
- ✅ 提供統計名詳細仕様
- ✅ 説明文
- ✅ 小地域属性
- ✅ APIバージョン情報

## 後方互換性

既存の `FormattedEstatData` を使用しているコードに影響を与えないよう、以下のアプローチを推奨：

1. **新しいメソッドを追加**: `formatStatsDataEnhanced()` として別メソッドを作成
2. **既存メソッドは維持**: `formatStatsData()` はそのまま残す
3. **段階的移行**: 新しいコードから徐々に `Enhanced` 版を使用

## まとめ

この改善により、以下のメリットが得られます：

1. **サイトの信頼性向上**: 更新日時の表示でデータの鮮度を明示
2. **ユーザー体験の向上**: データ品質や範囲の可視化
3. **SEO最適化**: 構造化データによる検索エンジン対応
4. **開発効率の向上**: 必要な情報が整理されたフォーマット
5. **保守性の向上**: メタデータによるデータセット管理の容易化

次のステップとして、この改善提案に基づいて `EstatStatsDataService.ts` の実装を更新することをお勧めします。
