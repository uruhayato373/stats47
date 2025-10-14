# e-Stat API フォーマッター分析レポート

**分析日時**: 2025-10-15
**対象ファイル**: `src/lib/estat-api/stats-data/formatter.ts`
**参照ドキュメント**: `docs/estat/e-Stat API GET_STATS_DATA 完全ガイド.md`

---

## 📋 エグゼクティブサマリー

`EstatStatsDataFormatter`の実装を詳細に分析した結果、基本的な機能は正しく実装されているものの、**重大なパフォーマンス問題**と**機能的な制限**が発見されました。

### 総合評価

| 評価項目           | スコア | 状態 |
| ------------------ | ------ | ---- |
| 機能の正確性       | 60/100 | ⚠️   |
| パフォーマンス     | 40/100 | 🔴   |
| 型安全性           | 50/100 | ⚠️   |
| エラーハンドリング | 70/100 | 🟡   |
| コードの保守性     | 65/100 | 🟡   |
| **総合スコア**     | **57/100** | ⚠️   |

---

## 🔴 重大な問題（Critical Issues）

### 1. パフォーマンス問題：O(n×m)の計算量

**場所**: `formatter.ts:297-323` (`formatValues`メソッド)

#### 問題の詳細

```typescript
static formatValues(
  values: EstatValue[],
  areas: FormattedArea[],
  categories: FormattedCategory[],
  years: FormattedYear[]
): FormattedValue[] {
  return values.map((value) => {
    // 🔴 問題: 各valueに対してfind()を実行
    const area = areas.find((a) => a.areaCode === areaCode);
    const category = categories.find((c) => c.categoryCode === categoryCode);
    const year = years.find((y) => y.timeCode === timeCode);
    // ...
  });
}
```

#### パフォーマンスへの影響

現在の計算量: **O(n × (a + c + y))**

- `values`: n件（例: 10,000件）
- `areas`: a件（例: 47都道府県）
- `categories`: c件（例: 10カテゴリ）
- `years`: y件（例: 10年分）

**実際の比較回数**: 10,000 × (47 + 10 + 10) = **670,000回**

ガイドによると、`limit`パラメータの最大値は**100,000件**（完全ガイド line 99）。最悪の場合：
- 100,000 × 67 = **6,700,000回の比較** 🔴

#### 推奨される解決策

**Map（ハッシュマップ）を使用してO(n)に削減**:

```typescript
static formatValues(
  values: EstatValue[],
  areas: FormattedArea[],
  categories: FormattedCategory[],
  years: FormattedYear[]
): FormattedValue[] {
  // ✅ O(a + c + y)で事前にMapを構築
  const areaMap = new Map(areas.map(a => [a.areaCode, a]));
  const categoryMap = new Map(categories.map(c => [c.categoryCode, c]));
  const yearMap = new Map(years.map(y => [y.timeCode, y]));

  // ✅ O(n)でデータ変換
  return values.map((value) => {
    const areaCode = value["@area"] || "";
    const categoryCode = value["@cat01"] || "";
    const timeCode = value["@time"] || "";

    // O(1)のマップ検索
    const area = areaMap.get(areaCode);
    const category = categoryMap.get(categoryCode);
    const year = yearMap.get(timeCode);

    return {
      areaCode,
      areaName: area?.areaName || "",
      categoryCode,
      categoryName: category?.categoryName || "",
      timeCode,
      timeName: year?.timeName || "",
      value: parseFloat(value.$ || "0") || 0,
      unit: value["@unit"] || null,
    };
  });
}
```

**改善効果**:
- 10,000件のデータ: 670,000回 → **10,067回** (約66分の1)
- 100,000件のデータ: 6,700,000回 → **100,067回** (約67分の1)

---

### 2. 機能的な制限：cat01のみの処理

**場所**: `formatter.ts:242-261` (`formatCategories`メソッド)

#### 問題の詳細

```typescript
static formatCategories(classInfo: unknown[]): FormattedCategory[] {
  // 🔴 問題: cat01のみを処理
  const categoryClass = classInfo.find(
    (cls) => (cls as Record<string, unknown>)["@id"] === "cat01"
  ) as Record<string, unknown>;
  // ...
}
```

#### API仕様との不整合

e-Stat API仕様（完全ガイド line 220-239、types/stats-data.ts line 221-239）によると、以下の分類IDが存在：

- **`tab`**: 表章項目（**必須**、完全ガイド line 333）
- **`cat01` ～ `cat15`**: 分類事項01～15
- **`area`**: 地域
- **`time`**: 時間軸

現在の実装では：
- ✅ `area`と`time`は正しく処理
- 🔴 **`tab`（表章項目）が完全に無視される**
- 🔴 **`cat02`～`cat15`が無視される**

#### 実際の影響

多くの統計表は複数の分類軸を持つ：

```json
// 例: 国勢調査（性別×年齢階級×都道府県×年次）
{
  "CLASS_INF": {
    "CLASS_OBJ": [
      { "@id": "tab", "@name": "人口" },       // 🔴 無視される
      { "@id": "cat01", "@name": "男女" },     // ✅ 処理される
      { "@id": "cat02", "@name": "年齢階級" }, // 🔴 無視される
      { "@id": "area", "@name": "地域" },      // ✅ 処理される
      { "@id": "time", "@name": "時間軸" }     // ✅ 処理される
    ]
  }
}
```

**結果**:
- cat02（年齢階級）のデータが失われる
- 表章項目（tab）が取得できない
- データの意味が不完全になる

#### 推奨される解決策

**全ての分類を動的に処理**:

```typescript
/**
 * 全てのカテゴリ（tab, cat01-cat15）を整形
 */
static formatAllCategories(classInfo: EstatClassObject[]): Map<string, FormattedCategory[]> {
  const categoryMap = new Map<string, FormattedCategory[]>();

  // tab, cat01～cat15を全て処理
  const categoryIds = ['tab', ...Array.from({length: 15}, (_, i) => `cat${String(i + 1).padStart(2, '0')}`)];

  for (const id of categoryIds) {
    const categoryClass = classInfo.find(cls => cls["@id"] === id);
    if (!categoryClass?.CLASS) continue;

    const categories = Array.isArray(categoryClass.CLASS)
      ? categoryClass.CLASS
      : [categoryClass.CLASS];

    categoryMap.set(id, categories.map(cat => ({
      categoryCode: cat["@code"],
      categoryName: cat["@name"],
      displayName: cat["@name"],
      unit: cat["@unit"] || null,
    })));
  }

  return categoryMap;
}

/**
 * データ値の整形（改善版）
 */
static formatValues(
  values: EstatValue[],
  areas: FormattedArea[],
  categoryMap: Map<string, FormattedCategory[]>,
  years: FormattedYear[]
): FormattedValue[] {
  // Mapを構築
  const areaMap = new Map(areas.map(a => [a.areaCode, a]));
  const yearMap = new Map(years.map(y => [y.timeCode, y]));

  // 各カテゴリのMapも構築
  const catMaps = new Map<string, Map<string, FormattedCategory>>();
  categoryMap.forEach((cats, id) => {
    catMaps.set(id, new Map(cats.map(c => [c.categoryCode, c])));
  });

  return values.map((value) => {
    // 全てのカテゴリコードを抽出
    const dimensions: Record<string, any> = {};

    // tab
    if (value["@tab"]) {
      const tabCode = value["@tab"];
      dimensions.tab = {
        code: tabCode,
        name: catMaps.get("tab")?.get(tabCode)?.categoryName || "",
      };
    }

    // cat01～cat15
    for (let i = 1; i <= 15; i++) {
      const catKey = `@cat${String(i).padStart(2, '0')}` as keyof EstatValue;
      if (value[catKey]) {
        const catCode = value[catKey] as string;
        const catId = `cat${String(i).padStart(2, '0')}`;
        dimensions[catId] = {
          code: catCode,
          name: catMaps.get(catId)?.get(catCode)?.categoryName || "",
        };
      }
    }

    // area, time
    const areaCode = value["@area"] || "";
    const timeCode = value["@time"] || "";

    return {
      value: parseFloat(value.$ || "0") || 0,
      unit: value["@unit"] || null,
      areaCode,
      areaName: areaMap.get(areaCode)?.areaName || "",
      timeCode,
      timeName: yearMap.get(timeCode)?.timeName || "",
      dimensions, // 全ての分類次元を含む
    };
  });
}
```

---

## ⚠️ 重要な問題（Important Issues）

### 3. 型安全性の問題：unknown型の過度な使用

**場所**: `formatter.ts:215-233, 242-261, 269-285`

#### 問題の詳細

```typescript
// 🔴 問題: unknown型として受け取り、型アサーションを多用
static formatAreas(classInfo: unknown[]): FormattedArea[] {
  const areaClass = classInfo.find(
    (cls) => (cls as Record<string, unknown>)["@id"] === "area"
  ) as Record<string, unknown>;
  // ...
}
```

#### なぜ問題か

- `EstatClassObject[]`型は既に定義されている（types/stats-data.ts line 220-248）
- `unknown`型を使うとTypeScriptの型チェックの恩恵を受けられない
- ランタイムエラーのリスクが増加
- IDEの補完機能が働かない

#### 推奨される解決策

```typescript
// ✅ 適切な型を使用
static formatAreas(classInfo: EstatClassObject[]): FormattedArea[] {
  const areaClass = classInfo.find(cls => cls["@id"] === "area");
  if (!areaClass?.CLASS) return [];

  const areas = Array.isArray(areaClass.CLASS)
    ? areaClass.CLASS
    : [areaClass.CLASS];

  return areas.map(area => ({
    areaCode: area["@code"],
    areaName: area["@name"],
    level: area["@level"],
    parentCode: area["@parentCode"],
  }));
}
```

---

### 4. データ品質の問題：特殊文字の不適切な処理

**場所**: `formatter.ts:304`

#### 問題の詳細

```typescript
// 🔴 問題: 特殊文字が0に変換される
const numericValue = parseFloat(value.$ || "0");
```

#### API仕様との不整合

完全ガイド（line 299-307）によると、e-Stat APIは以下の特殊文字を返す：

| 文字  | 意味           |
| ----- | -------------- |
| `***` | 調査対象外     |
| `-`   | データなし     |
| `X`   | 秘匿           |
| `0`   | 単位未満       |

現在の実装では：
```typescript
parseFloat("***") // → NaN → 0に変換
parseFloat("-")   // → NaN → 0に変換
parseFloat("X")   // → NaN → 0に変換
```

**結果**:
- 「調査対象外」と「0」が区別できない
- データの意味が失われる
- 統計処理で誤った結果が生成される

#### 推奨される解決策

```typescript
/**
 * e-Stat APIの値を適切に変換
 * 特殊文字はnullとして扱う
 */
function parseEstatValue(rawValue: string): number | null {
  // 空文字列チェック
  if (!rawValue || rawValue.trim() === "") {
    return null;
  }

  // 特殊文字チェック
  const specialChars = ["***", "-", "X", "…"];
  if (specialChars.includes(rawValue.trim())) {
    return null;
  }

  // 数値変換
  const num = parseFloat(rawValue);
  return isNaN(num) ? null : num;
}

// 使用例
static formatValues(
  values: EstatValue[],
  // ...
): FormattedValue[] {
  return values.map((value) => {
    const parsedValue = parseEstatValue(value.$);

    return {
      // ...
      value: parsedValue,
      unit: value["@unit"] || null,
      // 特殊文字の記録
      annotation: value["@annotation"] || null,
      isSpecialValue: parsedValue === null,
    };
  });
}
```

---

## 🟡 改善が望ましい点（Nice to Have）

### 5. メタデータの品質スコアの不正確さ

**場所**: `formatter.ts:162-164`

```typescript
// 🟡 問題: 特殊文字が0に変換されているため、スコアが不正確
const completenessScore = Math.round(
  (validValues / values.length) * 100 || 0
);
```

**改善案**: 特殊文字を適切に処理した後で計算する

```typescript
const metadata: FormattedMetadata = {
  // ...
  stats: {
    totalRecords: values.length,
    validValues: values.filter(v => v.value !== null).length,
    nullValues: values.filter(v => v.value === null).length,
    specialCharValues: values.filter(v => v.isSpecialValue).length,
    nullPercentage: /* 計算 */,
  },
  quality: {
    completenessScore: Math.round(
      (stats.validValues / stats.totalRecords) * 100
    ),
  },
};
```

---

### 6. 本番環境でのログ出力

**場所**: `formatter.ts:26-27, 201-205`

```typescript
// 🟡 問題: 本番環境でもconsole.logが実行される
console.log("🔵 Formatter: formatStatsData 開始");
console.log(`✅ Formatter: formatStatsData 完了 (${Date.now() - startTime}ms)`);
```

**改善案**: 環境変数またはロガーライブラリを使用

```typescript
// 開発環境のみログ出力
if (process.env.NODE_ENV === 'development') {
  console.log("🔵 Formatter: formatStatsData 開始");
}
```

---

### 7. エラーメッセージの不足

**場所**: `formatter.ts:29-32`

```typescript
if (!data) {
  throw new Error("統計データが見つかりません"); // 🟡 汎用的すぎる
}
```

**改善案**: より詳細なエラーメッセージ

```typescript
if (!data) {
  throw new Error(
    "統計データが見つかりません。" +
    `レスポンス構造: ${JSON.stringify(response, null, 2)}`
  );
}

// または、カスタムエラークラス
class EstatDataNotFoundError extends Error {
  constructor(
    message: string,
    public response: EstatStatsDataResponse
  ) {
    super(message);
    this.name = 'EstatDataNotFoundError';
  }
}
```

---

## ✅ 正しく実装されている点

### 1. 配列/単一オブジェクトの適切な処理

```typescript
// ✅ 配列または単一オブジェクトを適切に処理
const rawValues = data.DATA_INF?.VALUE || [];
const valuesArray = Array.isArray(rawValues) ? rawValues : [rawValues];
```

完全ガイド（line 286-292）の仕様に準拠。

### 2. Optional Chainingによる安全なアクセス

```typescript
// ✅ 安全なプロパティアクセス
const data = response.GET_STATS_DATA?.STATISTICAL_DATA;
const classInfo = data.CLASS_INF?.CLASS_OBJ || [];
```

### 3. 基本的なエラーハンドリング

```typescript
// ✅ 基本的なnullチェック
if (!data) {
  throw new Error("統計データが見つかりません");
}
```

### 4. 拡張メタデータの計算

```typescript
// ✅ 詳細な統計情報を計算
const metadata: FormattedMetadata = {
  stats: {
    totalRecords: values.length,
    validValues,
    nullValues,
    nullPercentage,
  },
  range: {
    years: { min, max, count },
    areas: { count, prefectureCount, hasNational },
    categories: { count },
  },
  quality: { completenessScore },
};
```

### 5. NOTE（注記）の処理

```typescript
// ✅ 注記情報を適切に処理
const notes: DataNote[] = data.DATA_INF?.NOTE
  ? (Array.isArray(data.DATA_INF.NOTE)
      ? data.DATA_INF.NOTE
      : [data.DATA_INF.NOTE])
  : [];
```

---

## 📊 パフォーマンステスト結果（予測）

### 現在の実装

| データ件数 | areas | categories | years | 総比較回数 | 推定処理時間 |
| ---------- | ----- | ---------- | ----- | ---------- | ------------ |
| 100        | 47    | 10         | 10    | 6,700      | ~1ms         |
| 1,000      | 47    | 10         | 10    | 67,000     | ~10ms        |
| 10,000     | 47    | 10         | 10    | 670,000    | ~100ms       |
| 100,000    | 47    | 10         | 10    | 6,700,000  | ~1000ms 🔴   |

### 改善後の実装（Map使用）

| データ件数 | areas | categories | years | 総比較回数 | 推定処理時間 |
| ---------- | ----- | ---------- | ----- | ---------- | ------------ |
| 100        | 47    | 10         | 10    | 167        | ~0.2ms       |
| 1,000      | 47    | 10         | 10    | 1,067      | ~1ms         |
| 10,000     | 47    | 10         | 10    | 10,067     | ~5ms         |
| 100,000    | 47    | 10         | 10    | 100,067    | ~15ms ✅     |

**パフォーマンス改善**: 約**67倍**高速化

---

## 🎯 推奨される実装計画

### Phase 1: 緊急対応（Critical）

**優先度**: 🔴 最高

1. **formatValuesの最適化**
   - Map構造への変更
   - 予測される改善: 67倍高速化
   - 実装時間: 1-2時間
   - 影響範囲: 大

2. **全カテゴリの処理**
   - tab, cat01～cat15の対応
   - データの完全性の確保
   - 実装時間: 3-4時間
   - 影響範囲: 大

### Phase 2: 重要な改善（Important）

**優先度**: ⚠️ 高

3. **型安全性の向上**
   - unknown型の削除
   - 適切な型の使用
   - 実装時間: 1-2時間
   - 影響範囲: 中

4. **特殊文字の適切な処理**
   - null値としての扱い
   - データ品質の向上
   - 実装時間: 1-2時間
   - 影響範囲: 中

### Phase 3: 品質向上（Nice to Have）

**優先度**: 🟡 中

5. **メタデータの改善**
   - 正確な品質スコア
   - 実装時間: 30分
   - 影響範囲: 小

6. **ログ管理の改善**
   - 環境別ログ出力
   - 実装時間: 30分
   - 影響範囲: 小

7. **エラーメッセージの改善**
   - 詳細なエラー情報
   - 実装時間: 1時間
   - 影響範囲: 小

---

## 📝 実装例：完全な改善版

```typescript
import {
  EstatStatsDataResponse,
  EstatValue,
  EstatClassObject
} from "../types";
import {
  FormattedArea,
  FormattedCategory,
  FormattedYear,
  FormattedValue,
  FormattedEstatData,
  FormattedTableInfo,
  FormattedMetadata,
  DataNote,
} from "../types/stats-data";

/**
 * e-Stat値のパーサー
 */
function parseEstatValue(rawValue: string): number | null {
  if (!rawValue || rawValue.trim() === "") {
    return null;
  }

  const specialChars = ["***", "-", "X", "…"];
  if (specialChars.includes(rawValue.trim())) {
    return null;
  }

  const num = parseFloat(rawValue);
  return isNaN(num) ? null : num;
}

/**
 * 開発環境のみログ出力
 */
function devLog(message: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(message);
  }
}

/**
 * e-STAT統計データフォーマッター（改善版）
 */
export class EstatStatsDataFormatter {
  /**
   * 統計データレスポンスを整形
   */
  static formatStatsData(response: EstatStatsDataResponse): FormattedEstatData {
    devLog("🔵 Formatter: formatStatsData 開始");
    const startTime = Date.now();

    const data = response.GET_STATS_DATA?.STATISTICAL_DATA;
    if (!data) {
      throw new Error(
        "統計データが見つかりません。" +
        `STATUS: ${response.GET_STATS_DATA?.RESULT?.STATUS}`
      );
    }

    const tableInf = data.TABLE_INF;
    if (!tableInf) {
      throw new Error("TABLE_INFが見つかりません");
    }

    // テーブル情報（既存の実装を維持）
    const tableInfo: FormattedTableInfo = {
      // ... 既存の実装
    };

    // クラス情報
    const classInfo = data.CLASS_INF?.CLASS_OBJ || [];
    const areas = this.formatAreas(classInfo);
    const categoryMap = this.formatAllCategories(classInfo);
    const years = this.formatYears(classInfo);

    // データ値
    const rawValues = data.DATA_INF?.VALUE || [];
    const valuesArray = Array.isArray(rawValues) ? rawValues : [rawValues];
    const values = this.formatValues(valuesArray, areas, categoryMap, years);

    // 注記情報（既存の実装を維持）
    const notes: DataNote[] = /* ... */;

    // メタデータ計算（改善版）
    const validValues = values.filter(v => v.value !== null).length;
    const nullValues = values.length - validValues;
    const nullPercentage = values.length > 0
      ? (nullValues / values.length) * 100
      : 0;

    const metadata: FormattedMetadata = {
      processedAt: new Date().toISOString(),
      dataSource: "e-stat",
      stats: {
        totalRecords: values.length,
        validValues,
        nullValues,
        nullPercentage: Math.round(nullPercentage * 100) / 100,
      },
      // ... その他のメタデータ
    };

    const result: FormattedEstatData = {
      tableInfo,
      areas,
      categories: Array.from(categoryMap.values()).flat(),
      years,
      values,
      metadata,
      notes,
    };

    devLog(
      `✅ Formatter: formatStatsData 完了 (${Date.now() - startTime}ms) - ${values.length}件の値`
    );

    return result;
  }

  /**
   * 地域情報を整形（型安全版）
   */
  static formatAreas(classInfo: EstatClassObject[]): FormattedArea[] {
    const areaClass = classInfo.find(cls => cls["@id"] === "area");
    if (!areaClass?.CLASS) return [];

    const areas = Array.isArray(areaClass.CLASS)
      ? areaClass.CLASS
      : [areaClass.CLASS];

    return areas.map(area => ({
      areaCode: area["@code"],
      areaName: area["@name"],
      level: area["@level"],
      parentCode: area["@parentCode"],
    }));
  }

  /**
   * 全てのカテゴリを整形（tab, cat01～cat15）
   */
  static formatAllCategories(
    classInfo: EstatClassObject[]
  ): Map<string, FormattedCategory[]> {
    const categoryMap = new Map<string, FormattedCategory[]>();

    // tab, cat01～cat15を全て処理
    const categoryIds = [
      'tab',
      ...Array.from({length: 15}, (_, i) => `cat${String(i + 1).padStart(2, '0')}`)
    ];

    for (const id of categoryIds) {
      const categoryClass = classInfo.find(cls => cls["@id"] === id);
      if (!categoryClass?.CLASS) continue;

      const categories = Array.isArray(categoryClass.CLASS)
        ? categoryClass.CLASS
        : [categoryClass.CLASS];

      categoryMap.set(id, categories.map(cat => ({
        categoryCode: cat["@code"],
        categoryName: cat["@name"],
        displayName: cat["@name"],
        unit: cat["@unit"] || null,
      })));
    }

    return categoryMap;
  }

  /**
   * 年次情報を整形（型安全版）
   */
  static formatYears(classInfo: EstatClassObject[]): FormattedYear[] {
    const timeClass = classInfo.find(cls => cls["@id"] === "time");
    if (!timeClass?.CLASS) return [];

    const years = Array.isArray(timeClass.CLASS)
      ? timeClass.CLASS
      : [timeClass.CLASS];

    return years.map(year => ({
      timeCode: year["@code"],
      timeName: year["@name"],
    }));
  }

  /**
   * データ値を整形（最適化版）
   * O(n×m) → O(n)に改善
   */
  static formatValues(
    values: EstatValue[],
    areas: FormattedArea[],
    categoryMap: Map<string, FormattedCategory[]>,
    years: FormattedYear[]
  ): FormattedValue[] {
    // ✅ O(a + c + y)で事前にMapを構築
    const areaMap = new Map(areas.map(a => [a.areaCode, a]));
    const yearMap = new Map(years.map(y => [y.timeCode, y]));

    // 各カテゴリのMapも構築
    const catMaps = new Map<string, Map<string, FormattedCategory>>();
    categoryMap.forEach((cats, id) => {
      catMaps.set(id, new Map(cats.map(c => [c.categoryCode, c])));
    });

    // ✅ O(n)でデータ変換
    return values.map((value) => {
      const areaCode = value["@area"] || "";
      const timeCode = value["@time"] || "";

      // cat01を優先的に取得（後方互換性）
      const categoryCode = value["@cat01"] || "";

      // O(1)のマップ検索
      const area = areaMap.get(areaCode);
      const category = catMaps.get("cat01")?.get(categoryCode);
      const year = yearMap.get(timeCode);

      // 特殊文字を適切に処理
      const parsedValue = parseEstatValue(value.$ || "");

      return {
        areaCode,
        areaName: area?.areaName || "",
        categoryCode,
        categoryName: category?.categoryName || "",
        timeCode,
        timeName: year?.timeName || "",
        value: parsedValue,
        unit: value["@unit"] || null,
      };
    });
  }
}
```

---

## 📚 参考資料

1. **e-Stat API 完全ガイド**
   - パス: `docs/estat/e-Stat API GET_STATS_DATA 完全ガイド.md`
   - セクション: 4.4 CLASS_INF（分類情報）, 4.5 DATA_INF（数値データ）

2. **型定義**
   - パス: `src/lib/estat-api/types/stats-data.ts`
   - 重要な型: `EstatClassObject`, `EstatValue`, `FormattedEstatData`

3. **パフォーマンス最適化**
   - 完全ガイド セクション8: パフォーマンス最適化
   - 推奨: Mapの使用、並列処理

---

## ✅ チェックリスト

### 実装時の確認事項

- [ ] formatValuesをMapベースに変更
- [ ] tab, cat01～cat15の全カテゴリに対応
- [ ] unknown型を適切な型に変更
- [ ] 特殊文字をnullとして処理
- [ ] メタデータの品質スコアを修正
- [ ] 環境別ログ出力に変更
- [ ] 詳細なエラーメッセージを追加
- [ ] ユニットテストを追加
- [ ] パフォーマンステストを実施
- [ ] ドキュメントを更新

### テスト項目

- [ ] 単一値/配列値の両方で動作確認
- [ ] 10,000件以上のデータで性能測定
- [ ] 特殊文字（***、-、X）の処理確認
- [ ] 複数カテゴリを持つ統計表で確認
- [ ] エラーケースのハンドリング確認

---

**分析完了日**: 2025-10-15
**次回レビュー推奨日**: Phase 1実装後
