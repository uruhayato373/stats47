---
title: Payload CMS 検討結果
created: 2025-01-20
updated: 2025-01-20
tags:
  - ADR
  - UIコンポーネント
  - Payload CMS
---

# Payload CMS 検討結果

## ステータス
in-review

## 背景

stats47 プロジェクトでは、ブログ機能の実装において、以下の要件を満たすコンテンツ管理システムが必要でした：

1. **ブログ機能**: 現在ブログ仕様が策定されているが未実装
2. **管理画面**: コンテンツ編集UIの提供
3. **TypeScript対応**: 型安全なコンテンツ管理
4. **Cloudflare D1対応**: 既存のデータベースとの統合
5. **MDXサポート**: 既存のブログ仕様との整合性

## 決定

**Payload CMS** の導入を検討する価値あり（ただし、MDXサポートの課題あり）

## 理由

### 1. ブログ機能の実装
- **仕様策定済み**: `docs/02_ドメイン設計/ブログ/specifications/`で詳細仕様あり
- **管理画面提供**: コンテンツ編集UIが提供される
- **TypeScript完全対応**: 型安全なコンテンツ管理

### 2. 既存システムとの統合
- **Cloudflare D1対応**: 既存のデータベースと統合可能
- **柔軟性**: カスタムフィールド、リレーションシップ、認証統合
- **拡張性**: 将来のコンテンツ管理要件への対応

### 3. 開発効率の向上
- **管理画面**: 非技術者もコンテンツ編集可能
- **API提供**: 自動的なAPI生成
- **認証統合**: 既存の認証システムとの統合

## MDXサポートの課題

### 問題点
- **ネイティブサポートなし**: Payload CMSはデフォルトでSlate Editor（リッチテキストエディタ）を使用
- **MDX形式の直接サポートなし**: カスタムフィールドを作成してMDXパーサーを統合する必要
- **追加開発工数**: カスタムMDXフィールドの実装が必要
- **メンテナンスコスト**: カスタム実装のメンテナンスが必要

### 代替案の比較

| アプローチ | 開発工数 | 機能 | メンテナンス性 | 推奨度 |
|------------|----------|------|----------------|--------|
| MDXベース | 小 | 基本的 | 高 | ✅ 推奨 |
| Payload CMS + カスタムMDX | 大 | 管理画面あり | 中 | ⚠️ 検討 |
| ハイブリッド | 中 | 柔軟 | 中 | ⚠️ 検討 |

## 代替案の検討

### MDXベース実装（推奨）
**メリット:**
- シンプルな実装
- 既存仕様に適合
- 開発者フレンドリー
- 型安全
- 軽量

**デメリット:**
- 非技術者が編集しにくい
- 管理画面なし

**実装方法:**
```typescript
// Contentlayer または next-mdx-remote を使用
import { allPosts } from 'contentlayer/generated';
import { MDXRemote } from 'next-mdx-remote';
```

### Payload CMS + カスタムMDX統合
**メリット:**
- 管理画面でコンテンツ編集
- 非技術者も編集可能
- 豊富な機能

**デメリット:**
- 複雑な実装
- メンテナンスコスト
- バンドルサイズ増加

**実装方法:**
```typescript
// カスタムMDXフィールドの実装
const mdxField = {
  name: 'content',
  type: 'text',
  admin: {
    components: {
      Field: MDXEditor
    }
  }
};
```

## 推奨アプローチ

### Phase 1: シンプルなMDXベース実装（推奨）
```typescript
1. Contentlayer または next-mdx-remote を使用
2. 既存のブログ仕様（docs/02_ドメイン設計/ブログ/）に基づく実装
3. Frontmatter検証にValibot使用
4. 管理画面は将来のPhase 2で検討
```

### Phase 2（将来）: 管理画面の追加
```typescript
選択肢A: カスタム管理画面を構築（Next.jsベース）
選択肢B: Payload CMSを管理画面として統合（複雑）
選択肢C: TinaCMS等のMDXネイティブサポートCMSを検討
```

## 結果

この検討により以下の方針が決定されました：

### 1. 短期方針（Phase 1）
- **MDXベース実装を優先**: シンプルで効率的
- **既存仕様に準拠**: 策定済みのブログ仕様に基づく
- **Valibot統合**: Frontmatter検証にValibot使用

### 2. 長期方針（Phase 2）
- **管理画面の検討**: 必要に応じて追加
- **Payload CMS再評価**: MDXサポートの改善を待つ
- **代替CMS検討**: TinaCMS等のMDXネイティブサポートCMS

### 3. 将来の検討事項
- Payload CMSのMDXサポート改善
- 新規CMSの登場
- コンテンツ管理要件の変化

## 参考資料

- [Payload CMS公式ドキュメント](https://payloadcms.com/)
- [Contentlayer公式ドキュメント](https://www.contentlayer.dev/)
- [next-mdx-remote](https://github.com/hashicorp/next-mdx-remote)
- [TinaCMS公式ドキュメント](https://tina.io/)
