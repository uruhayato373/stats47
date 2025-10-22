---
title: Valibot 採用理由
created: 2025-01-20
updated: 2025-01-20
tags:
  - ADR
  - バリデーション
  - Valibot
---

# Valibot 採用理由

## ステータス
accepted

## 背景

stats47 プロジェクトでは、以下の要件を満たすバリデーションライブラリが必要でした：

1. **パフォーマンス**: e-Stat API レスポンス検証で高速な処理が必要
2. **軽量性**: バンドルサイズの最小化
3. **TypeScript対応**: 型安全なバリデーション
4. **既存実装との統合**: 現在Zodベースのバリデーションが存在

## 決定

**Valibot** を部分的に採用

## 理由

### 1. パフォーマンスの優位性
- **軽量**: Zodより約10倍軽量（~600bytes vs ~8KB）
- **高速実行**: 実行速度がZodより速い
- **Tree-shakeable**: 使用する部分のみバンドルに含まれる

### 2. モダンなAPI
- Zodと似たAPIで移行が比較的容易
- 学習コストが低い
- TypeScript完全対応

### 3. 段階的導入が可能
- 既存のZodバリデーションを段階的に移行可能
- 新規バリデーションから導入開始

## 使用箇所

### 1. e-Stat API レスポンス検証（最優先）
```typescript
// パフォーマンスが重要な箇所
const estatResponseSchema = object({
  GET_STATS_DATA: object({
    RESULT: object({
      STATUS: number(),
      ERROR_MSG: optional(string()),
      // ...
    })
  })
});
```

### 2. 新規バリデーション全般
```typescript
// 新規実装ではValibotを優先使用
const userInputSchema = object({
  region: string(),
  category: string(),
  period: string()
});
```

### 3. 既存Zodバリデーションの段階的移行
```typescript
// 既存のZodスキーマを段階的にValibotに移行
// 優先度: 低 → 中 → 高
```

## 代替案の検討

### Zod（現行）
**メリット:**
- 既存実装済み
- 成熟したエコシステム
- 豊富なサードパーティ統合

**デメリット:**
- バンドルサイズが大きい
- パフォーマンスが劣る
- 全機能をバンドルに含む

**結論:** 既存実装は維持し、新規・重要箇所でValibotを併用

### 他のバリデーションライブラリ
**Yup、Joi等:**
- パフォーマンス面でValibotに劣る
- 学習コストが高い
- 移行コストが大きい

**結論:** 検討対象外

## 結果

この決定により以下の効果が期待されます：

### 1. パフォーマンス向上
- e-Stat APIレスポンス検証の高速化
- バンドルサイズの削減

### 2. 開発効率の向上
- 新規バリデーションの迅速な実装
- 型安全性の向上

### 3. 段階的移行
- 既存システムへの影響を最小化
- リスクの分散

## 実装方針

### Phase 1: 重要箇所への導入（1-2週間）
- e-Stat APIレスポンス検証にValibot導入
- パフォーマンス測定と比較

### Phase 2: 新規バリデーション（2-3週間）
- 新規機能のバリデーションにValibot使用
- 既存Zodスキーマとの共存

### Phase 3: 段階的移行（3-4週間）
- 低優先度のZodスキーマから移行開始
- パフォーマンス測定と最適化

## 参考資料

- [Valibot公式ドキュメント](https://valibot.dev/)
- [Valibot vs Zod比較](https://valibot.dev/guides/valibot-vs-zod)
- [パフォーマンスベンチマーク](https://github.com/fabian-hiller/valibot/tree/main/benchmarks)