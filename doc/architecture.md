# システムアーキテクチャ

## 概要

地域統計ダッシュボードは、Next.js 15 の App Router を使用したフルスタック Web アプリケーションです。クライアントサイドレンダリング（CSR）とサーバーサイドレンダリング（SSR）を組み合わせて、高速でユーザーフレンドリーな体験を提供します。e-Stat API との統合には、型安全性と開発体験を向上させる`@estat/`パッケージを使用しています。

## アーキテクチャ図

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   クライアント    │    │   Next.js App   │    │   e-Stat API    │
│   (ブラウザ)     │◄──►│     Router      │◄──►│   (外部API)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   React 19      │
                       │   Components    │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   @estat/       │    │   Recharts      │
                       │   Packages      │    │   (グラフ表示)   │
                       └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   TypeScript    │
                       │   Type Safety   │
                       └─────────────────┘
```

## データベースアーキテクチャ

### Cloudflare D1 データベース

#### 統合データベース設計

- **データベース名**: `stats47`
- **統合スキーマ**: `database/schemas/main.sql`
- **テーブル構成**:
  - `users`: ユーザー認証・管理
  - `estat_metainfo`: e-Stat メタデータ
  - `estat_data_history`: データ変更履歴

#### 環境別設定

- **ローカル開発**: `.wrangler/state/v3/d1/` 内のローカルインスタンス
- **本番環境**: Cloudflare D1 のリモートインスタンス
- **バインディング**: `STATS47_DB` (wrangler.toml)

#### スキーマ管理

- **統合スキーマ**: 認証、メタデータ、履歴管理を一元化
- **自動適用**: `./database/manage.sh schema` でローカル環境に適用
- **本番適用**: `npx wrangler d1 execute stats47 --remote --file=./database/schemas/main.sql`

## 技術スタック詳細

### フロントエンドフレームワーク

#### Next.js 15

- **App Router**: ファイルベースのルーティング
- **Turbopack**: 高速な開発ビルド
- **TypeScript**: 型安全性の確保
- **Tailwind CSS 4**: ユーティリティファースト CSS

#### React 19

- **Hooks**: useState, useEffect, useCallback
- **Server Components**: パフォーマンス最適化
- **Concurrent Features**: 非同期レンダリング

### e-Stat API 統合

#### @estat/パッケージ

- **@estat/types**: e-Stat API の完全な型定義
- **@estat/client**: e-Stat API クライアントライブラリ
- **@estat/utils**: データ処理と変換ユーティリティ

#### 型安全性の特徴

- **完全な API 対応**: e-Stat API の全エンドポイントに対応
- **自動型推論**: TypeScript による厳密な型チェック
- **開発体験向上**: IntelliSense とエラー検出
- **保守性**: 最新の API 仕様への自動対応

### データ可視化

#### Recharts

- **LineChart**: 時系列データの表示
- **BarChart**: カテゴリ別データの表示
- **PieChart**: 比率データの表示
- **ResponsiveContainer**: レスポンシブ対応

#### D3.js

- **データ操作**: 統計データの前処理
- **カスタムチャート**: 特殊な可視化ニーズ

### 状態管理

#### React State

- **Local State**: コンポーネント固有の状態
- **Lifted State**: 親子間での状態共有
- **Context API**: グローバル状態の管理

## ディレクトリ構造

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # ルートレイアウト（ヘッダー・フッター含む）
│   ├── page.tsx           # ホームページ
│   └── dashboard/         # ダッシュボード（カテゴリベース）
│       ├── page.tsx       # カテゴリ一覧ページ
│       ├── [categoryId]/  # カテゴリ詳細ページ
│       │   ├── page.tsx
│       │   └── [subcategoryId]/  # サブカテゴリ詳細ページ
│       │       └── page.tsx
├── components/             # Reactコンポーネント（アトミックデザイン）
│   ├── atoms/             # 最小単位のコンポーネント
│   │   ├── RegionSelector.tsx
│   │   └── ...
│   ├── molecules/          # atomsを組み合わせたコンポーネント
│   │   ├── StatisticsDisplay.tsx
│   │   └── ...
│   ├── organisms/          # moleculesを組み合わせた大きなコンポーネント
│   │   ├── EstatDataFetcher.tsx
│   │   └── ...
│   ├── templates/          # ページレイアウトのテンプレート
│   ├── pages/              # 特定のページ用のコンポーネント
│   ├── layout/             # グローバルレイアウト
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── charts/             # チャート関連コンポーネント
│   ├── maps/               # マップ関連コンポーネント
│   └── ui/                 # UI関連コンポーネント
├── config/                 # 設定ファイル
│   └── categories.json    # カテゴリ定義
├── types/                  # TypeScript型定義
│   └── estat/             # e-Stat API型定義（@estat/パッケージ使用）
│       ├── index.ts       # 型定義のエクスポート
│       ├── raw-response.ts # 生APIレスポンス型
│       ├── processed.ts   # 処理済みデータ型
│       ├── parameters.ts  # APIパラメータ型
│       └── errors.ts      # エラー型定義
├── contexts/               # React Context
│   ├── AuthContext.tsx    # 認証状態管理
│   └── ThemeContext.tsx   # テーマ状態管理
├── worker/                 # Cloudflare Worker
│   └── index.ts           # D1データベース操作API
└── lib/                    # ユーティリティ関数
    └── estat/             # e-Stat関連ユーティリティ
        ├── client.ts      # APIクライアント設定
        ├── transformers.ts # データ変換関数
        └── validators.ts  # データ検証関数
```

## e-Stat API 統合アーキテクチャ

### データフロー

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  ユーザー    │───►│ コンポーネント │───►│ @estat/     │───►│  e-Stat    │
│  インターフェース│    │             │    │ クライアント │    │    API     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐    ┌─────────────┐
                    │  型安全な    │    │  生API      │
                    │  データ処理  │    │  レスポンス  │
                    └─────────────┘    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  可視化     │
                    │  コンポーネント │
                    └─────────────┘
```

### 型定義の階層

```
@estat/types
├── EstatResponse          # 基本APIレスポンス型
├── EstatParameter         # APIパラメータ型
├── EstatCatalogResponse   # カタログ情報レスポンス型
├── EstatListResponse      # リスト情報レスポンス型
├── EstatMetaResponse      # メタデータレスポンス型
└── EstatError            # エラー型定義

src/types/estat/
├── index.ts              # 型定義のエクスポート
├── raw-response.ts       # 生APIレスポンス型（@estat/typesから拡張）
├── processed.ts          # 処理済みデータ型
├── parameters.ts         # APIパラメータ型（@estat/typesから拡張）
├── errors.ts             # エラー型定義（@estat/typesから拡張）
└── map-data.ts           # マップデータ型
```

### API クライアントの実装

```typescript
// src/lib/estat/client.ts
import { EstatClient } from "@estat/client";
import { EstatParameter, EstatResponse } from "@estat/types";

export class EstatApiClient {
  private client: EstatClient;

  constructor() {
    this.client = new EstatClient({
      appId: process.env.NEXT_PUBLIC_ESTAT_APP_ID || "",
    });
  }

  async getStatisticalData(parameter: EstatParameter): Promise<EstatResponse> {
    try {
      return await this.client.getStatsData(parameter);
    } catch (error) {
      throw new EstatApiError("統計データの取得に失敗しました", error);
    }
  }

  async getCatalogInfo(statsDataId: string): Promise<EstatCatalogResponse> {
    try {
      return await this.client.getStatsDataCatalog({
        statsDataId,
        lang: "J",
      });
    } catch (error) {
      throw new EstatApiError("カタログ情報の取得に失敗しました", error);
    }
  }
}
```

## 認証・セキュリティ

### JWT 認証

- **トークンベース認証**: セッション管理
- **bcrypt**: パスワードハッシュ化（salt rounds: 12）
- **自動ログアウト**: 7 日間の有効期限

#### Cloudflare D1

- **SQLite ベース**: エッジデータベース
- **ユーザー管理**: アカウント情報の保存
- **セッション管理**: アクティブセッションの追跡

### セキュリティ設計

#### API 保護

- **認証ガード**: 保護されたページへのアクセス制御
- **JWT 検証**: トークンの有効性確認
- **CORS 設定**: 適切なオリジン制御

#### データ保護

- **プリペアドステートメント**: SQL インジェクション対策
- **入力バリデーション**: フロントエンド・バックエンド両方
- **HTTPS 通信**: 本番環境での暗号化通信

## パフォーマンス・スケーラビリティ

### フロントエンド最適化

- **コード分割**: 動的インポートによる遅延読み込み
- **画像最適化**: Next.js Image コンポーネント
- **キャッシュ戦略**: 静的データの効率的な提供

### バックエンド最適化

- **Cloudflare Workers**: エッジでの高速処理
- **D1 データベース**: エッジでのデータアクセス
- **非同期処理**: 並行処理による応答時間短縮

### スケーラビリティ

- **Cloudflare Workers**: 自動的なスケーリング
- **D1 データベース**: グローバル分散
- **CDN**: 静的アセットの高速配信

## 開発・デプロイ

### 開発環境

- **TypeScript**: 型安全性と開発体験の向上
- **ESLint**: コード品質の維持
- **Tailwind CSS**: 効率的なスタイリング

### ビルド・デプロイ

- **Next.js**: 最適化されたビルド
- **Cloudflare Pages**: エッジでのデプロイ
- **環境変数**: 適切な設定管理

## 監視・ログ

### フロントエンド監視

- **Core Web Vitals**: ユーザー体験の測定
- **エラー追跡**: クラッシュレポートの収集
- **パフォーマンス測定**: 読み込み時間の監視

### バックエンド監視

- **API 応答時間**: バックエンド処理の監視
- **エラー率**: システムの健全性確認
- **リソース使用量**: メモリ・CPU 使用率の監視

## 今後の拡張予定

### 機能拡張

- **ソーシャルログイン**: 利便性の向上
- **権限管理**: ロールベースアクセス制御
- **API 制限**: レート制限の実装

### 技術的拡張

- **GraphQL**: 効率的なデータ取得
- **WebSocket**: リアルタイムデータ更新
- **PWA**: オフライン対応とネイティブアプリ体験

## 更新履歴

- **2024-01-XX**: 初版作成
- **2024-01-XX**: e-Stat API 統合の追加
- **2024-01-XX**: @estat/パッケージ統合の追加
- **2024-01-XX**: 認証機能の実装
- **2024-01-XX**: アーキテクチャ図の更新
