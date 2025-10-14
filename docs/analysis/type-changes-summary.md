# 型定義の変更点まとめ

**作成日**: 2025-10-15
**関連ファイル**:
- `docs/analysis/improved-types.ts` - 改善版型定義
- `src/lib/estat-api/types/stats-data.ts` - 既存型定義

---

## 📋 変更概要

改善版フォーマッターに対応するため、以下の型定義を追加・変更します。

| 変更種別 | 影響度 | 破壊的変更 |
|---------|--------|----------|
| 新規型の追加 | 中 | なし |
| 既存型の拡張 | 高 | **あり** |
| ユーティリティ型の追加 | 低 | なし |

---

## 🔴 破壊的変更（Breaking Changes）

### 1. `FormattedValue.value` の型変更

#### 変更前
```typescript
export interface FormattedValue {
  value: number;  // 常にnumber型
  // ...
}
```

#### 変更後
```typescript
export interface FormattedValue {
  value: number | null;  // nullを許容
  // ...
}
```

#### 影響範囲
```typescript
// ❌ 変更前: 安全にアクセス可能
const sum = values.reduce((acc, v) => acc + v.value, 0);

// ✅ 変更後: nullチェックが必要
const sum = values.reduce((acc, v) => acc + (v.value ?? 0), 0);

// または型ガードを使用
const validValues = values.filter(isValidValue);
const sum = validValues.reduce((acc, v) => acc + v.value, 0);
```

#### マイグレーション戦略

**戦略A: 段階的移行（推奨）**
```typescript
// 過渡期の型定義（両方サポート）
export interface FormattedValue {
  value: number | null;

  // 追加: 後方互換性用のヘルパー
  get valueOrZero(): number {
    return this.value ?? 0;
  }
}
```

**戦略B: 型アサーションによる暫定対応**
```typescript
// 既存コードを一時的に維持
const sum = values.reduce((acc, v) => acc + (v.value as number), 0);

// 警告: 実行時エラーのリスクあり
```

**戦略C: オプトイン方式**
```typescript
// フォーマッターオプションで挙動を制御
const options: FormatterOptions = {
  treatSpecialCharsAsZero: true  // 特殊文字を0として扱う（後方互換）
};

const formatted = formatter.formatStatsData(response, options);
```

---

## ✅ 非破壊的変更（Additive Changes）

### 2. `FormattedValue` への新規フィールド追加

```typescript
export interface FormattedValue {
  // 既存フィールド（変更なし）
  value: number | null;
  unit: string | null;
  areaCode: string;
  areaName: string;
  categoryCode: string;
  categoryName: string;
  timeCode: string;
  timeName: string;
  rank?: number;

  // 🆕 新規フィールド（オプション）
  rawValue: string;              // 元の文字列値
  status: ValueStatus;           // 値の状態
  specialChar?: EstatSpecialChar; // 特殊文字
  annotation?: string;           // 注釈記号
  dimensions: DimensionInfo[];   // 全次元情報
}
```

#### 後方互換性
- 既存フィールドは変更なし（`value`の型変更を除く）
- 新規フィールドはオプション or 配列（空配列でも可）
- 既存コードは影響を受けない

```typescript
// 既存コード: 引き続き動作
const areaName = value.areaName;  // ✅ OK

// 新機能: 必要に応じて使用
if (value.status === 'special_char') {
  console.log(`特殊文字: ${value.specialChar}`);
}
```

---

### 3. `FormattedCategory` への新規フィールド追加

```typescript
export interface FormattedCategory {
  // 既存フィールド
  categoryCode: string;
  categoryName: string;
  displayName: string;
  unit: string | null;

  // 🆕 新規フィールド
  classId: CategoryId;      // 分類ID（tab, cat01-15）
  level?: string;           // 階層レベル
  parentCode?: string;      // 親コード
  description?: string;     // 説明
}
```

#### 後方互換性
- 既存フィールドは変更なし
- 新規フィールドは全てオプション
- 既存コードは影響を受けない

---

### 4. `FormattedMetadata.stats` の拡張

```typescript
// 変更前
export interface FormattedMetadata {
  stats: {
    totalRecords: number;
    validValues: number;
    nullValues: number;
    nullPercentage: number;
  };
}

// 変更後
export interface FormattedMetadata {
  stats: DataStats;  // 拡張版の型
}

export interface DataStats {
  totalRecords: number;
  validValues: number;
  nullValues: number;
  nullPercentage: number;

  // 🆕 新規フィールド
  specialCharValues: number;      // 特殊文字の数
  specialCharPercentage: number;  // 特殊文字の割合
}
```

#### 後方互換性
- 既存フィールドは変更なし
- 新規フィールドを追加
- 既存コードは影響を受けない

---

### 5. `FormattedEstatData` への新規フィールド追加

```typescript
export interface FormattedEstatData {
  // 既存フィールド
  tableInfo: FormattedTableInfo;
  areas: FormattedArea[];
  categories: FormattedCategory[];  // 全カテゴリ（tab, cat01-15）
  years: FormattedYear[];
  values: FormattedValue[];
  metadata: FormattedMetadata;
  notes?: DataNote[];

  // 🆕 新規フィールド
  categoryMap?: CategoryMap;  // 高速検索用Map（オプション）
}
```

---

## 🆕 新規型定義

### 6. ユーティリティ型

```typescript
// カテゴリID型
export type CategoryId =
  | "tab"
  | "cat01" | "cat02" | "cat03" | "cat04" | "cat05"
  | "cat06" | "cat07" | "cat08" | "cat09" | "cat10"
  | "cat11" | "cat12" | "cat13" | "cat14" | "cat15";

// 次元ID型
export type DimensionId = CategoryId | "area" | "time";

// 特殊文字型
export type EstatSpecialChar = "***" | "-" | "X" | "…";

// 値の状態
export type ValueStatus =
  | "valid"         // 有効な数値
  | "null"          // null値
  | "special_char"  // 特殊文字
  | "error";        // パースエラー
```

### 7. Map型（高速検索用）

```typescript
// カテゴリマップ
export type CategoryMap = Map<CategoryId, FormattedCategory[]>;

// カテゴリコードマップ（O(1)検索用）
export type CategoryCodeMap = Map<CategoryId, Map<string, FormattedCategory>>;
```

### 8. 次元情報

```typescript
export interface DimensionInfo {
  id: DimensionId;
  code: string;
  name: string;
}
```

### 9. エラークラス

```typescript
export class EstatDataNotFoundError extends Error {
  constructor(
    message: string,
    public response?: any,
    public statusCode?: number
  ) { /* ... */ }
}

export class EstatParseError extends Error {
  constructor(
    message: string,
    public field: string,
    public rawValue: any
  ) { /* ... */ }
}
```

### 10. オプション型

```typescript
export interface FormatterOptions {
  treatSpecialCharsAsZero?: boolean;
  enableDebugLog?: boolean;
  enablePerformanceMetrics?: boolean;
  maxCategories?: number;
}

export interface PerformanceMetrics {
  totalTime: number;
  parseTime: number;
  mapBuildTime: number;
  transformTime: number;
  recordsProcessed: number;
  recordsPerSecond: number;
}
```

### 11. 型ガード

```typescript
// 有効な数値かどうかを判定
export function isValidValue(
  value: FormattedValue
): value is FormattedValue & { value: number } {
  return value.value !== null && value.status === 'valid';
}

// 特殊文字値かどうかを判定
export function isSpecialCharValue(
  value: FormattedValue
): value is FormattedValue & { specialChar: EstatSpecialChar } {
  return value.status === 'special_char' && value.specialChar !== undefined;
}

// null値かどうかを判定
export function isNullValue(value: FormattedValue): boolean {
  return value.value === null;
}
```

---

## 📊 変更の影響分析

### 影響を受けるファイル

```
src/lib/estat-api/
├── stats-data/
│   ├── formatter.ts          🔴 大幅な変更が必要
│   ├── fetcher.ts            🟡 軽微な変更が必要
│   └── filter.ts             🟡 軽微な変更が必要
├── types/
│   └── stats-data.ts         🔴 型定義の更新が必要
└── ... (その他のファイル)     🟢 影響なし
```

### 使用側のコード例

#### ケース1: 単純な値の使用（影響あり）

```typescript
// 変更前
function calculateSum(values: FormattedValue[]): number {
  return values.reduce((sum, v) => sum + v.value, 0);  // ❌ コンパイルエラー
}

// 変更後（オプション1: nullチェック）
function calculateSum(values: FormattedValue[]): number {
  return values.reduce((sum, v) => sum + (v.value ?? 0), 0);  // ✅
}

// 変更後（オプション2: 型ガード）
function calculateSum(values: FormattedValue[]): number {
  const validValues = values.filter(isValidValue);
  return validValues.reduce((sum, v) => sum + v.value, 0);  // ✅
}
```

#### ケース2: オブジェクトの参照（影響なし）

```typescript
// 変更前・変更後ともに動作
function getAreaNames(values: FormattedValue[]): string[] {
  return values.map(v => v.areaName);  // ✅ OK
}
```

#### ケース3: 新機能の活用（オプション）

```typescript
// 特殊文字の処理
function analyzeValues(values: FormattedValue[]): void {
  const valid = values.filter(isValidValue);
  const special = values.filter(isSpecialCharValue);

  console.log(`有効値: ${valid.length}件`);
  console.log(`特殊文字: ${special.length}件`);

  special.forEach(v => {
    console.log(`  ${v.specialChar}: ${v.rawValue}`);
  });
}

// 全次元情報の活用
function printDimensions(value: FormattedValue): void {
  console.log("次元情報:");
  value.dimensions.forEach(dim => {
    console.log(`  ${dim.id}: ${dim.name} (${dim.code})`);
  });
}
```

---

## 🛠️ マイグレーションガイド

### Phase 1: 型定義の更新（Breaking）

```bash
# 1. 改善版型定義をコピー
cp docs/analysis/improved-types.ts src/lib/estat-api/types/stats-data-v2.ts

# 2. 既存の型定義と共存させる（段階的移行）
# src/lib/estat-api/types/index.ts に追加
export * from './stats-data';      # 既存型（非推奨）
export * from './stats-data-v2';   # 改善型（推奨）
```

### Phase 2: フォーマッターの更新（Breaking）

```typescript
// src/lib/estat-api/stats-data/formatter-v2.ts

import { FormattedValue, FormattedEstatData } from '../types/stats-data-v2';

export class EstatStatsDataFormatterV2 {
  static formatStatsData(
    response: EstatStatsDataResponse,
    options?: FormatterOptions
  ): FormattedEstatData {
    // 改善版の実装
  }
}
```

### Phase 3: 使用側のコード更新

```typescript
// 段階的に移行
import { EstatStatsDataFormatterV2 } from '@/lib/estat-api/stats-data/formatter-v2';

const formatted = EstatStatsDataFormatterV2.formatStatsData(response);
```

### Phase 4: 既存コードの修正

```bash
# TypeScriptコンパイルエラーを修正
npm run type-check

# nullチェックを追加
# v.value → (v.value ?? 0)
# または
# values.filter(isValidValue)
```

---

## ✅ チェックリスト

### 実装前の確認

- [ ] 既存コードへの影響範囲を調査
- [ ] マイグレーション戦略を決定（A/B/C）
- [ ] 後方互換性の維持方法を決定
- [ ] テストケースを準備

### 実装中の確認

- [ ] 改善版型定義ファイルを作成
- [ ] 既存型定義と共存できることを確認
- [ ] フォーマッターを改善版に更新
- [ ] ユニットテストを実装
- [ ] TypeScriptコンパイルエラーを解消

### 実装後の確認

- [ ] 既存機能が動作することを確認
- [ ] 新機能が正しく動作することを確認
- [ ] パフォーマンステストを実施
- [ ] ドキュメントを更新
- [ ] マイグレーションガイドを提供

---

## 📚 関連資料

1. **型定義ファイル**
   - `docs/analysis/improved-types.ts` - 改善版型定義
   - `src/lib/estat-api/types/stats-data.ts` - 既存型定義

2. **分析レポート**
   - `docs/analysis/formatter-analysis.md` - フォーマッター分析

3. **e-Stat API仕様**
   - `docs/estat/e-Stat API GET_STATS_DATA 完全ガイド.md`

---

## 🎯 推奨アプローチ

### 最小限の変更で段階的に移行

1. **Phase 1**: 新規型定義を別ファイルで追加（既存コードに影響なし）
2. **Phase 2**: フォーマッターV2を実装（既存フォーマッターと共存）
3. **Phase 3**: 新規開発では改善版を使用
4. **Phase 4**: 既存コードを段階的に移行
5. **Phase 5**: 旧版を非推奨化 → 削除

### タイムライン

- **Week 1-2**: Phase 1-2（型定義 + フォーマッターV2）
- **Week 3-4**: Phase 3（新規開発で使用）
- **Month 2-3**: Phase 4（既存コードの移行）
- **Month 4**: Phase 5（旧版削除）

---

**最終更新**: 2025-10-15
