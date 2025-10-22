---
title: Hono 非採用理由
created: 2025-01-20
updated: 2025-01-20
tags:
  - ADR
  - インフラストラクチャ
  - Hono
---

# Hono 非採用理由

## ステータス
rejected

## 背景

stats47 プロジェクトでは、バックエンドフレームワークの選定において、以下の要件を満たす必要がありました：

1. **既存実装との整合性**: 現在Next.js API Routesで実装済み
2. **移行コスト**: 既存APIの書き直しコスト
3. **Next.js統合**: Next.jsエコシステムとの統合
4. **アーキテクチャの一貫性**: 4層アーキテクチャとの整合性

## 決定

**Hono** を採用しない

## 理由

### 1. 既存実装との競合
- **Next.js API Routes実装済み**: `/api/rankings/data/route.ts`, `/api/estat-api/stats-data/route.ts`
- **移行コスト**: 既存のAPI Routesを書き直す必要がある
- **アーキテクチャ変更**: 4層アーキテクチャの再設計が必要

### 2. Next.js統合の喪失
- **ISR機能**: Next.jsのIncremental Static Regenerationが使用できない
- **Middleware**: Next.jsのmiddlewareとの統合が弱くなる
- **エコシステム**: Next.jsの豊富なエコシステムとの統合が制限される

### 3. 移行コストの高さ
- **全APIの書き直し**: 既存のAPI RoutesをHonoに移行
- **アーキテクチャ再設計**: 4層アーキテクチャの見直し
- **テストの再作成**: 既存のAPIテストの書き直し

## Honoの評価

### メリット
- ✅ **軽量・高速**: Edge環境に最適化
- ✅ **TypeScript完全対応**: 型安全なAPI開発
- ✅ **Cloudflare Workers対応**: Cloudflare D1との親和性
- ✅ **ミドルウェアシステム**: 認証、ログ、エラーハンドリングの統一

### デメリット
- ❌ **Next.js API Routesとの競合**: 既存実装との重複
- ❌ **移行コスト**: 既存APIの書き直しが必要
- ❌ **Next.js統合の喪失**: エコシステムとの統合が弱くなる
- ⚠️ **アーキテクチャの変更**: 4層アーキテクチャの再設計が必要

## 代替案の検討

### Next.js API Routes（現行・維持）
**メリット:**
- 既存実装済み
- Next.jsエコシステムとの完全統合
- ISR、Middleware等の機能活用
- 4層アーキテクチャとの整合性

**デメリット:**
- Edge環境での最適化が限定的
- パフォーマンスがHonoより劣る可能性

**結論:** 現行のNext.js API Routesを維持

### Express.js
**メリット:**
- 成熟したエコシステム
- 豊富なミドルウェア
- 学習コストが低い

**デメリット:**
- Next.js統合の喪失
- 移行コストが大きい
- Edge環境での最適化が困難

**結論:** Next.js統合を考慮し不採用

### Fastify
**メリット:**
- 高速なパフォーマンス
- TypeScript対応
- 軽量

**デメリット:**
- Next.js統合の喪失
- 移行コストが大きい
- エコシステムが限定的

**結論:** Next.js統合を考慮し不採用

## 結果

この決定により以下の効果が得られます：

### 1. 開発効率の維持
- 既存実装の維持
- 移行コストの回避
- 開発リソースの有効活用

### 2. Next.jsエコシステムの活用
- ISR機能の継続使用
- Middleware機能の活用
- 豊富なエコシステムの利用

### 3. アーキテクチャの一貫性
- 4層アーキテクチャの維持
- ドキュメントとの整合性
- チーム内の理解の統一

## 今後の方針

### 1. Next.js API Routesの最適化
- パフォーマンスの監視と改善
- エラーハンドリングの統一
- ログ機能の強化

### 2. 4層アーキテクチャの維持
- 既存のアーキテクチャの継続
- 必要に応じて機能拡張
- ドキュメントの更新

### 3. 将来の検討事項
- Cloudflare Workersでの別途API構築時はHonoを検討
- パフォーマンス要件の変化に応じた再評価
- 新規プロジェクトでのHono採用検討

## 参考資料

- [Hono公式ドキュメント](https://hono.dev/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [4層アーキテクチャドキュメント](../02_ドメイン設計/e-Stat API/architecture.md)
