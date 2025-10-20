---
title: 既存コード移行計画
created: 2025-01-16
updated: 2025-01-16
status: published
tags:
  - stats47
  - domain/area
  - type/refactoring
author: 開発チーム
version: 1.0.0
related:
  - "[[地域ドメイン概要]]"
  - "[[API仕様]]"
---

# 既存コード移行計画

## 概要

既存の分散した地域関連コードを新しい Area ドメインに統合する移行計画です。段階的に移行を行い、既存機能への影響を最小限に抑えます。

## 移行対象ファイル

### 削除対象

| ファイル                                   | 理由     | 移行先                                        |
| ------------------------------------------ | -------- | --------------------------------------------- |
| `src/lib/prefecture.ts`                    | 機能重複 | `src/lib/area/services/prefecture-service.ts` |
| `src/lib/ranking/utils/area-code-utils.ts` | 機能重複 | `src/lib/area/utils/code-converter.ts`        |

### 更新対象

| ファイル                                              | 更新内容       | 影響度 |
| ----------------------------------------------------- | -------------- | ------ |
| `src/types/models/prefecture.ts`                      | 型定義の統合   | 低     |
| `src/components/d3/ChoroplethMap.tsx`                 | インポート変更 | 中     |
| `src/types/visualization/topojson.ts`                 | インポート変更 | 低     |
| `src/components/subcategories/PrefectureSelector.tsx` | インポート変更 | 中     |
| `src/lib/ranking/calculators/ranking-calculator.ts`   | インポート変更 | 中     |
| `src/lib/ranking/adapters/estat/estat-transformer.ts` | インポート変更 | 中     |

## 移行フェーズ

### フェーズ 1: 準備（完了済み）

- [x] Area ドメインの実装
- [x] 型定義の作成
- [x] サービスクラスの実装
- [x] テストの作成
- [x] ドキュメントの作成

### フェーズ 2: 段階的移行

#### 2.1 インポートの更新

**対象ファイル**: 全コンポーネント・サービス

**変更前**:

```typescript
import {
  prefList,
  PREFECTURE_MAP,
  getPrefectureNameFromCode,
} from "@/lib/prefecture";
import {
  getAreaType,
  validateAreaCode,
} from "@/lib/ranking/utils/area-code-utils";
```

**変更後**:

```typescript
import {
  PrefectureService,
  AreaService,
  getAreaType,
  validateAreaCode,
} from "@/lib/area";
```

#### 2.2 関数呼び出しの更新

**都道府県関連**:

```typescript
// 変更前
const prefectures = prefList;
const prefName = PREFECTURE_MAP[code];
const pref = getPrefectureByName("東京都");

// 変更後
const prefectures = PrefectureService.getAllPrefectures();
const prefName = PrefectureService.getPrefectureNameFromCode(code);
const pref = PrefectureService.getPrefectureByName("東京都");
```

**地域コード関連**:

```typescript
// 変更前
const areaType = getAreaType(code);
const isValid = validateAreaCode(code);

// 変更後
const areaType = AreaService.getAreaType(code);
const isValid = validateAreaCode(code); // 同じ関数名でインポート先のみ変更
```

#### 2.3 型定義の統合

**変更前**:

```typescript
import type { Prefecture } from "@/types/models/prefecture";
```

**変更後**:

```typescript
import type { Prefecture } from "@/lib/area";
```

### フェーズ 3: 旧ファイルの削除

#### 3.1 段階的削除

1. **Step 1**: 旧ファイルを非推奨としてマーク
2. **Step 2**: 全ての参照を新しいドメインに移行
3. **Step 3**: 旧ファイルを削除

#### 3.2 削除前の確認

- [ ] 全インポートが新しいドメインに移行済み
- [ ] テストが全て成功
- [ ] ビルドエラーがない
- [ ] 機能テストが完了

## 詳細移行手順

### 1. ChoroplethMap.tsx の移行

**ファイル**: `src/components/d3/ChoroplethMap.tsx`

**変更前**:

```typescript
import { PREFECTURE_MAP } from "@/lib/prefecture";
```

**変更後**:

```typescript
import { PrefectureService } from "@/lib/area";

// 使用箇所の変更
const prefName = PrefectureService.getPrefectureNameFromCode(code);
```

### 2. PrefectureSelector.tsx の移行

**ファイル**: `src/components/subcategories/PrefectureSelector.tsx`

**変更前**:

```typescript
import { prefList } from "@/lib/prefecture";
```

**変更後**:

```typescript
import { PrefectureService } from "@/lib/area";

// 使用箇所の変更
const prefectures = PrefectureService.getAllPrefectures();
```

### 3. ranking-calculator.ts の移行

**ファイル**: `src/lib/ranking/calculators/ranking-calculator.ts`

**変更前**:

```typescript
import { getPrefectureName } from "@/lib/ranking/utils/area-code-utils";
```

**変更後**:

```typescript
import { PrefectureService } from "@/lib/area";

// 使用箇所の変更
const prefName = PrefectureService.getPrefectureNameFromCode(code);
```

### 4. estat-transformer.ts の移行

**ファイル**: `src/lib/ranking/adapters/estat/estat-transformer.ts`

**変更前**:

```typescript
import { getPrefectureName } from "@/lib/ranking/utils/area-code-utils";
```

**変更後**:

```typescript
import { PrefectureService } from "@/lib/area";

// 使用箇所の変更
const prefName = PrefectureService.getPrefectureNameFromCode(code);
```

## 互換性レイヤー（オプション）

移行期間中に既存コードとの互換性を保つため、一時的な互換性レイヤーを作成することも可能です。

### 互換性レイヤーの例

```typescript
// src/lib/prefecture-compat.ts
import { PrefectureService } from "@/lib/area";

// 既存の関数名で新しいサービスをラップ
export const prefList = PrefectureService.getAllPrefectures();
export const PREFECTURE_MAP = PrefectureService.getPrefectureMap();
export const getPrefectureNameFromCode =
  PrefectureService.getPrefectureNameFromCode;
```

**注意**: 互換性レイヤーは一時的なもので、最終的には削除する必要があります。

## テスト戦略

### 移行前テスト

- [ ] 既存機能の動作確認
- [ ] 既存テストの実行
- [ ] パフォーマンステスト

### 移行中テスト

- [ ] 段階的移行後のテスト実行
- [ ] 機能回帰テスト
- [ ] パフォーマンス比較

### 移行後テスト

- [ ] 全テストの実行
- [ ] 統合テスト
- [ ] エンドツーエンドテスト

## ロールバック計画

### 移行失敗時の対応

1. **即座のロールバック**: Git で前のコミットに戻す
2. **段階的ロールバック**: 問題のある部分のみを元に戻す
3. **互換性レイヤーの活用**: 一時的に互換性レイヤーを使用

### ロールバック手順

```bash
# 完全ロールバック
git revert <migration-commit-hash>

# 部分ロールバック
git checkout <previous-commit> -- src/lib/prefecture.ts
```

## パフォーマンス影響

### 期待される改善

- **メモリ使用量**: 重複データの削除により約 20% 削減
- **初期化時間**: 単一データソースにより約 30% 短縮
- **検索性能**: 最適化されたデータ構造により約 50% 向上

### 監視項目

- アプリケーション起動時間
- メモリ使用量
- 地域検索のレスポンス時間
- バンドルサイズ

## 移行スケジュール

### 週 1: 準備・計画

- [x] Area ドメインの実装
- [x] 移行計画の策定
- [x] テスト環境の準備

### 週 2: 段階的移行

- [ ] インポートの更新（50%）
- [ ] 関数呼び出しの更新（50%）
- [ ] 中間テストの実行

### 週 3: 完了・検証

- [ ] 残りの移行作業
- [ ] 旧ファイルの削除
- [ ] 最終テストの実行
- [ ] パフォーマンス検証

## リスク管理

### 高リスク項目

1. **ChoroplethMap.tsx**: 複雑な地図表示ロジック
2. **ranking-calculator.ts**: ランキング計算の核心部分
3. **estat-transformer.ts**: データ変換の重要部分

### リスク軽減策

1. **段階的移行**: 一度に全てを変更せず、段階的に移行
2. **十分なテスト**: 各段階で十分なテストを実行
3. **ロールバック準備**: 問題発生時の迅速なロールバック準備

## 移行後のメンテナンス

### 定期的な確認項目

- [ ] パフォーマンスの監視
- [ ] エラーログの確認
- [ ] ユーザーフィードバックの収集

### 今後の改善

- [ ] 地域データの更新（年 1 回）
- [ ] パフォーマンスの最適化
- [ ] 新機能の追加

## 参考資料

- [地域ドメイン概要](../overview.md)
- [API 仕様](../specifications/api.md)
- [基本的な使い方](../implementation/getting-started.md)
