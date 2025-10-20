---
title: 大規模プロジェクト実装手順ガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - development-guide
---

# 大規模プロジェクト実装手順ガイド

## 概要

このガイドは、stats47 プロジェクトのような大規模な Next.js + React アプリケーションにおける効率的な実装手順をまとめたものです。プロジェクト全体の構造を理解し、一貫性のある開発を進めるための指針として活用してください。

## プロジェクト全体の理解

### 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **スタイリング**: Tailwind CSS 4
- **データ可視化**: Recharts, D3.js
- **開発・ビルド**: Turbopack, ESLint

### アーキテクチャパターン

- **ドメイン駆動設計**: 機能ごとにディレクトリを分離
- **3 層アーキテクチャ**: データ層 → ビジネスロジック層 → UI 層
- **Server/Client 分離**: Next.js App Router の特性を活用

### ディレクトリ構造

```
src/
├── app/                    # ルーティング層（Server Components）
├── components/             # UI層（Client Components）
├── lib/                    # ビジネスロジック層
│   ├── [domain]/          # ドメイン別機能
│   │   ├── types/         # 型定義
│   │   ├── fetcher.ts     # データ取得
│   │   ├── formatter.ts   # データ変換
│   │   └── utils.ts       # ユーティリティ
├── hooks/                  # カスタムフック
└── types/                  # 共通型定義
```

## 推奨実装手順

### 1. 設計フェーズ（最優先） 📋

新機能実装前に必ず実施する設計作業：

#### a) 要件整理

```
docs/03_要件定義/
└── 新機能の要件を明文化
    - 機能要件（何を実現するか）
    - 非機能要件（性能、UX、SEO）
    - 制約条件
    - 既存システムとの連携
```

#### b) アーキテクチャ設計

```
docs/04_仕様/
└── 以下を定義
    - データフロー図
    - API設計（型定義）
    - コンポーネント構成図
    - データベーススキーマ（必要な場合）
    - 環境別データソース戦略
```

#### c) 既存システムとの整合性確認

- `docs/01_概要/02_アーキテクチャ.md`を確認
- 既存のパターンを踏襲（例: Fetcher/Formatter/Display パターン）
- 共通コンポーネントの再利用可能性を検討

### 2. 型定義から実装（Type-First） 🎯

#### なぜ型定義が最初か？

- TypeScript の恩恵を最大化
- インターフェース契約が明確になる
- 複数人で並行開発しやすい
- リファクタリング時の安全性向上

#### 実装順序：

```typescript
// ステップ1: src/lib/[domain]/types/
export interface NewFeatureParams {
  id: string;
  options?: NewFeatureOptions;
}

export interface NewFeatureResponse {
  data: NewFeatureData[];
  metadata: NewFeatureMetadata;
}

// ステップ2: src/lib/[domain]/fetcher.ts
export class NewFeatureFetcher {
  static async fetch(params: NewFeatureParams): Promise<NewFeatureResponse>;
}

// ステップ3: src/lib/[domain]/formatter.ts
export class NewFeatureFormatter {
  static format(data: NewFeatureResponse): FormattedData;
}
```

### 3. データ層 → ビジネスロジック層 → UI 層 📚

このプロジェクトの実装順序：

#### ① データアクセス層（最下層）

```
src/lib/[domain]/
├── types/          # 型定義
├── client/         # API/DB通信
├── fetcher.ts      # データ取得
└── formatter.ts    # データ変換
```

#### ② ビジネスロジック層（中間層）

```
src/lib/[domain]/
├── helpers.ts      # ユーティリティ
├── validation.ts   # バリデーション
└── utils.ts        # 共通処理
```

#### ③ UI 層（最上層）

```
src/components/[domain]/
├── [Feature]Fetcher.tsx    # データ取得UI
├── [Feature]Display.tsx    # データ表示
└── [Feature]Page.tsx       # ページ統合
```

#### ④ ルーティング層（最終）

```
src/app/[route]/
└── page.tsx                # Server Component
```

## プロジェクト特有のパターン

### パターン 1: Server/Client 分離

```typescript
// Server Component (データ取得)
src/app/[route]/page.tsx
  ↓ props
// Client Component (インタラクション)
src/components/[domain]/[Feature]Page.tsx
```

### パターン 2: 環境別データソース

```typescript
// 環境検出
getEnvironmentConfig()
  ↓
// mock: JSONファイル
// development: ローカルD1
// staging/production: リモートD1
```

### パターン 3: Fetcher/Formatter/Display

```
Fetcher (データ取得)
  ↓
Formatter (データ整形)
  ↓
Display (データ表示)
```

### パターン 4: カスタムフックによる状態管理

```typescript
// 複雑な状態管理をカスタムフックに集約
src / hooks / [domain] / use[Feature].ts;
```

## 具体的な実装ステップ

### 新機能追加時の詳細手順

**例: 新しい統計表示機能を追加する場合**

#### ステップ 1: 設計書作成（1-2 時間）

```
docs/04_仕様/新機能設計.md
├── 要件定義
├── データフロー図
├── コンポーネント構成図
└── API設計
```

#### ステップ 2: 型定義（30 分）

```typescript
src/lib/new-feature/types/index.ts
├── リクエスト型
├── レスポンス型
├── フォーマット済み型
└── エラー型
```

#### ステップ 3: データ層実装（2-3 時間）

```typescript
src/lib/new-feature/
├── fetcher.ts      # API呼び出し
├── formatter.ts    # データ変換
└── client/         # HTTPクライアント
```

#### ステップ 4: テスト用モックデータ作成（1 時間）

```
src/data/mock/new-feature/
└── sample-data.json
```

#### ステップ 5: カスタムフック（1 時間）

```typescript
src/hooks/new-feature/useNewFeature.ts
├── 状態管理
├── データ取得ロジック
└── エラーハンドリング
```

#### ステップ 6: UI コンポーネント（3-4 時間）

```typescript
src/components/new-feature/
├── NewFeatureFetcher.tsx    # データ取得UI
├── NewFeatureDisplay.tsx    # データ表示
├── NewFeaturePage.tsx       # ページ統合
└── index.ts                 # エクスポート
```

#### ステップ 7: ルーティング統合（30 分）

```typescript
src/app/new-feature/page.tsx
└── Server Component
```

#### ステップ 8: テスト & ドキュメント更新（1-2 時間）

```
__tests__/new-feature/
├── fetcher.test.ts
├── formatter.test.ts
└── components.test.tsx

docs/02_開発/
└── 関連ドキュメント更新
```

### 各ステップの所要時間目安

| ステップ             | 所要時間 | 重要度 |
| -------------------- | -------- | ------ |
| 設計書作成           | 1-2 時間 | ★★★★★  |
| 型定義               | 30 分    | ★★★★★  |
| データ層実装         | 2-3 時間 | ★★★★☆  |
| モックデータ作成     | 1 時間   | ★★★☆☆  |
| カスタムフック       | 1 時間   | ★★★★☆  |
| UI コンポーネント    | 3-4 時間 | ★★★☆☆  |
| ルーティング統合     | 30 分    | ★★☆☆☆  |
| テスト・ドキュメント | 1-2 時間 | ★★★★☆  |

## 避けるべき落とし穴

### ❌ NG: いきなりコンポーネントから書き始める

**問題**: 型定義がないと後で大幅な修正が必要
**解決策**: 必ず型定義から始める

### ❌ NG: 1 つのファイルに全て詰め込む

**問題**: 責任分離の原則に反する
**解決策**: 単一責任の原則に従って分割

### ❌ NG: 既存パターンを無視

**問題**: プロジェクトの一貫性が失われる
**解決策**: 既存の Fetcher/Formatter/Display パターンを踏襲

### ❌ NG: Server/Client 境界を曖昧にする

**問題**: パフォーマンス低下、SEO 問題
**解決策**: 明確な境界を設ける（データ取得=Server、インタラクション=Client）

### ❌ NG: 環境別設定を考慮しない

**問題**: 本番環境でエラー
**解決策**: 最初から環境別データソース戦略を設計

## 並行開発時の優先順位

### 1. 型定義を先に全部決める（最重要）

- 依存関係を明確化
- インターフェース契約の統一
- 並行開発の基盤となる

### 2. データ層は 1 つずつ完成させる

- 他の層の基盤となる
- 並行開発は避ける
- 品質を重視

### 3. UI は並行開発可能

- 型が決まっていれば安全
- コンポーネント単位で分割
- 統合テストで検証

### 4. 統合・テストは最後に集中

- 個別機能の完成後
- 統合テストで全体検証
- パフォーマンステスト実施

## 品質保証のベストプラクティス

### コード品質

- ESLint ルールの遵守
- TypeScript の strict mode 活用
- 単一責任の原則

### テスト戦略

- 単体テスト（lib 層）
- 統合テスト（UI 層）
- E2E テスト（重要フロー）

### パフォーマンス

- Server Component の活用
- 不要な再レンダリングの回避
- 画像最適化

### セキュリティ

- 入力値のバリデーション
- XSS 対策
- CSRF 対策

## トラブルシューティング

### よくある問題と解決策

#### 1. 型エラーが多発する

**原因**: 型定義が不十分
**解決策**: 型定義を最初にしっかり設計

#### 2. データが表示されない

**原因**: Server/Client 境界の問題
**解決策**: データフローを再確認

#### 3. パフォーマンスが悪い

**原因**: 不要な再レンダリング
**解決策**: useMemo, useCallback の活用

#### 4. 本番環境でエラー

**原因**: 環境別設定の不備
**解決策**: 環境変数の確認

## まとめ

大規模プロジェクトでは、**設計フェーズの重要性**と**段階的な実装**が成功の鍵です。

1. **設計を疎かにしない** - 後戻りを避ける
2. **型定義から始める** - 品質と効率を両立
3. **既存パターンを踏襲** - 一貫性を保つ
4. **小さく作って拡張** - リスクを最小化

このガイドを参考に、効率的で保守性の高い開発を進めてください。

---

## 関連ドキュメント

- [アーキテクチャ設計書](../01_概要/02_アーキテクチャ.md)
- [コーディング規約](./01_コーディング規約.md)
- [コンポーネントガイド](./02_コンポーネントガイド.md)
- [テストガイド](./04_テストガイド.md)
- [パフォーマンス最適化ガイド](./08_パフォーマンス最適化ガイド.md)
