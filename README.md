# stats47 - 日本の地域統計データ可視化システム

e-Stat API を使用して日本の地域統計データを可視化する Web アプリケーションです。Next.js 15 と React 19 を使用して構築されています。

## 🚀 主要機能

### 📊 データ可視化

- **コロプレス地図表示**: 都道府県別データの地図可視化（D3.js + TopoJSON）
- **カテゴリー別ページ**: 16 の統計カテゴリーへの整理されたアクセス
- **サブカテゴリー専用ページ**: カテゴリーごとに最適化されたレイアウト
- **ダッシュボード・ランキング分離**: ダッシュボード（全国・都道府県別）とランキング（都道府県比較）を独立したページで提供
- **柔軟なレイアウト**: 2 カラム、サマリーカード付き、1 カラムなど多様なパターン

### 🗂️ ナビゲーション

- **動的ルーティング**: `/[category]/[subcategory]/dashboard/[areaCode]` と `/[category]/[subcategory]/ranking` による階層的なページ構造
- **サイドバーナビゲーション**: 全カテゴリーへの素早いアクセス
- **パンくずナビゲーション**: 現在位置の明確な表示
- **ビュー切り替え**: ダッシュボードとランキングのタブ切り替え

### 🎨 デザインシステム

- **ダークモード対応**: 自動システム設定検出と手動切り替え
- **統一されたスタイル**: useStyles カスタムフックによる一貫性
- **カテゴリーカラーシステム**: 各カテゴリー固有の色による視覚的識別
- **レスポンシブデザイン**: デスクトップ、タブレット、モバイル対応

### 📊 ダッシュボードコンポーネント

- **EstatRanking**: コロプレス地図、統計サマリー、都道府県別データテーブルを統合したコンポーネント
  - サブカテゴリーページでの標準コンポーネント
  - 地図とランキングテーブルの一体化による直感的なデータ表示
  - カスタマイズ可能な配色スキームと発散型中点設定
- **StatisticsMetricCard**: 重要な統計値を強調表示するカード型コンポーネント
- **EstatMultiLineChart**: 複数系列の時系列データを比較表示するグラフコンポーネント
- **EstatPopulationPyramid**: 年齢別人口構成を視覚化するピラミッドチャート
- **EstatGenderDonutChart**: 男女比率を表示するドーナツチャート

### 🔧 開発基盤

- **認証システム**: Cloudflare D1 を使用したユーザー管理
- **メタ情報管理**: e-Stat API メタ情報の効率的な保存・検索
- **統合データベース**: 認証、メタ情報、履歴管理を一元化
- **共通 UI コンポーネント**: 再利用可能な Message、DataTable、InputField
- **Storybook 統合**: コンポーネント開発・テスト環境

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **スタイリング**: Tailwind CSS 4, カスタムスタイルフック
- **状態管理**: Jotai (アトミックな状態管理)
- **データ可視化**: Recharts, D3.js
- **データベース**: Cloudflare D1 (SQLite)
- **認証**: JWT, bcryptjs
- **API**: e-Stat API 統合
- **開発・ビルド**: Turbopack, ESLint, Storybook
- **コンポーネント開発**: Storybook 9.1.3

## 📦 プロジェクト構成

```
stats47/
├── README.md                 # このファイル
├── .cursorrules             # Cursor AI のルール設定
├── .storybook/              # Storybook設定
├── database/                # データベース管理
│   ├── README.md           # データベース管理の基本
│   ├── RULES.md            # データベース管理ルール
│   ├── DEVELOPER_GUIDE.md  # 開発者向けガイドライン
│   ├── manage.sh           # データベース管理スクリプト
│   ├── schemas/            # スキーマ定義
│   ├── migrations/         # マイグレーションファイル
│   └── backups/            # バックアップファイル
├── src/                     # ソースコード
│   ├── app/                # Next.js App Router
│   │   ├── [category]/     # カテゴリーページ
│   │   │   ├── page.tsx    # カテゴリーページ
│   │   │   └── [subcategory]/  # サブカテゴリーページ
│   │   ├── api/            # API エンドポイント
│   │   ├── choropleth/     # コロプレス地図ページ
│   │   └── estat/          # e-Stat関連ページ
│   ├── atoms/              # Jotai アトム（状態管理）
│   ├── components/         # React コンポーネント
│   │   ├── subcategories/  # サブカテゴリー専用コンポーネント
│   │   │   ├── SubcategoryLayout.tsx  # 共通レイアウト
│   │   │   ├── landweather/  # 国土・気象カテゴリー
│   │   │   ├── population/   # 人口・世帯カテゴリー
│   │   │   ├── laborwage/    # 労働・賃金カテゴリー
│   │   │   └── [16カテゴリー]/
│   │   ├── choropleth/     # コロプレス地図コンポーネント
│   │   ├── common/         # 共通コンポーネント
│   │   │   ├── Message/    # メッセージ表示
│   │   │   ├── DataTable/  # データテーブル
│   │   │   └── InputField/ # 入力フィールド
│   │   ├── estat/          # e-Stat関連コンポーネント
│   │   ├── layout/         # レイアウトコンポーネント
│   │   └── dashboard/      # ダッシュボードコンポーネント
│   ├── config/             # 設定ファイル
│   │   └── categories.json # カテゴリー定義
│   ├── contexts/           # React Context
│   ├── providers/          # プロバイダー（Jotai）
│   ├── hooks/              # カスタムフック
│   │   └── useStyles.ts    # スタイル管理フック
│   ├── lib/                # ユーティリティライブラリ
│   │   ├── choropleth/     # コロプレス地図関連
│   │   ├── estat/          # e-Stat API関連
│   │   └── ranking/        # ランキング関連
│   ├── services/           # API サービス
│   └── types/              # TypeScript 型定義
├── doc/                     # プロジェクトドキュメント
│   ├── README.md           # ドキュメント目次
│   ├── architecture.md     # アーキテクチャ設計書
│   ├── category-page-design.md  # カテゴリーページ設計書
│   ├── subcategory-page-component-design.md  # サブカテゴリー設計書
│   └── [その他の設計書]
├── docs/                    # プロジェクトドキュメント
│   ├── 01_概要/              # プロジェクト概要とアーキテクチャ
│   ├── 02_開発/              # 開発ガイドライン
│   │   ├── README.md         # 開発ガイド目次
│   │   ├── 01_コーディング規約.md
│   │   ├── 02_コンポーネントガイド.md
│   │   ├── 03_スタイリングガイド.md
│   │   ├── 04_テストガイド.md
│   │   ├── 05_Storybookガイド.md
│   │   └── [その他の開発ガイド]
│   ├── 03_要件定義/          # 要件定義書
│   ├── 04_仕様/              # システム仕様書
│   └── 05_リファクタリング/  # リファクタリング記録
├── public/                  # 静的ファイル
└── package.json             # 依存関係とスクリプト
```

## 🗄️ データベース管理

データベース操作を行う前に、必ず以下のドキュメントを読んでください：

- **[データベース管理ルール](./database/RULES.md)** - 必須ルールとガイドライン
- **[開発者向けガイド](./database/DEVELOPER_GUIDE.md)** - 実践的な操作方法
- **[基本使用方法](./database/README.md)** - 基本的な使用方法

### クイックスタート

```bash
# データベーススキーマの適用（ローカル環境）
./database/manage.sh schema

# または、手動でローカルD1にスキーマを適用
npx wrangler d1 execute stats47 --local --file=./database/schemas/main.sql

# リモート環境へのスキーマ適用
npx wrangler d1 execute stats47 --remote --file=./database/schemas/main.sql

# 開発サーバー起動
npm run dev
```

## 📚 ドキュメント

### 設計書

- [アーキテクチャ](./doc/architecture.md) - システム設計とアーキテクチャ
- [カテゴリーページ設計](./doc/category-page-design.md) - カテゴリーページの設計と実装
- [サブカテゴリーページ設計](./doc/subcategory-page-component-design.md) - サブカテゴリーコンポーネントの設計
- [コンポーネント設計](./doc/component-design.md) - React コンポーネントの設計原則
- [API 設計](./doc/api-design.md) - バックエンド API 仕様

### 管理ガイド

- [開発ガイド](./docs/02_開発/README.md) - 開発ガイドラインとベストプラクティス
- [Storybook ガイド](./docs/02_開発/05_Storybookガイド.md) - Storybook 開発ガイドとベストプラクティス
- [開発者ガイド](./doc/development-guide.md) - 開発環境のセットアップと開発手順
- [e-Stat 統合ガイド](./doc/estat-integration.md) - e-Stat API 統合の詳細
- [配色システム](./doc/color-system.md) - UI/UX の配色システムとデザインガイドライン

### その他

- [ドキュメント目次](./doc/README.md) - 全ドキュメントの一覧

## 🚀 セットアップ

### 前提条件

- Node.js 18.x 以上
- npm 9.x 以上
- Cloudflare アカウント（D1 データベース用）

### インストール

1. **リポジトリのクローン**

   ```bash
   git clone <repository-url>
   cd stats47
   ```

2. **依存関係のインストール**

   ```bash
   npm install
   ```

3. **環境変数の設定**

   ```bash
   # 開発環境用
   cp env.development.example .env.development
   
   # モック環境用（デザイン検証）
   cp env.mock.example .env.mock
   
   # 各ファイルを編集して必要な値を設定
   ```

4. **データベースの初期化**

   ```bash
   # D1データベースの作成
   npx wrangler d1 create estat-db

   # ローカル開発用のD1インスタンスを起動
   npx wrangler d1 execute estat-db --local --file=./database/schemas/main.sql
   ```

5. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

## 環境設定

### 環境別設定ファイル

プロジェクトでは複数の環境をサポートしています：

```bash
# 開発環境（API接続あり）
cp env.development.example .env.development

# モック環境（API非接続、デザイン検証用）
cp env.mock.example .env.mock

# ステージング環境
cp env.staging.example .env.staging

# 本番環境
cp env.production.example .env.production
```

### 必須環境変数

各環境で必要な環境変数は以下の通りです：

#### 開発環境
```bash
# e-Stat API設定
ESTAT_API_KEY=your-dev-api-key

# Cloudflare設定
CLOUDFLARE_D1_DATABASE_ID=dev-db-id
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-dev-api-token

# 環境設定
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_USE_MOCK=false
```

#### モック環境
```bash
# 環境設定
NEXT_PUBLIC_ENV=mock
NEXT_PUBLIC_USE_MOCK=true
```

### Cloudflare D1 設定の取得方法

1. **API Token**: [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) で作成
2. **Account ID**: [Cloudflare Dashboard](https://dash.cloudflare.com/) の右サイドバーに表示
3. **Database ID**: `npx wrangler d1 list` で確認

### 環境切り替え

```bash
# 開発環境で起動
npm run dev --env-file=.env.development

# モック環境で起動（デザイン検証用）
npm run dev --env-file=.env.mock
```

## データ保存

### 開発環境での動作

- **データ保存先**: Cloudflare D1（本番環境と同じ）
- **処理方式**: チャンク分割処理（API 制限対策）
- **チャンクサイズ**: 50 件ずつ処理
- **待機時間**: チャンク間で 200ms 待機

### 本番環境での動作

- **データ保存先**: Cloudflare D1
- **処理方式**: チャンク分割処理（API 制限対策）
- **スケーラビリティ**: 大量リクエスト対応
- **グローバル配信**: 世界中からのアクセス対応

## 🔄 状態管理

このプロジェクトでは、効率的な状態管理のために **Jotai** を使用しています。

### テーマ管理

ライトモード/ダークモードの状態管理は Jotai を使って実装されています：

```tsx
import { useTheme } from "@/hooks/useTheme";

export default function MyComponent() {
  const { theme, mounted, toggleTheme } = useTheme();

  return (
    <div className="bg-white dark:bg-neutral-800">
      <button onClick={toggleTheme}>現在のテーマ: {theme}</button>
    </div>
  );
}
```

### 特徴

- **アトミックな状態管理**: 必要な部分のみ再レンダリング
- **永続化**: localStorage との自動同期
- **システム連携**: OS のカラーテーマ設定を自動検出
- **型安全性**: TypeScript による完全なサポート
- **SSR/SSG 対応**: ハイドレーションエラーを防ぐ仕組み

### 利用可能なアトム

- `themeAtom`: テーマ状態の保存・取得
- `effectiveThemeAtom`: 実際に適用されるテーマの計算
- `toggleThemeAtom`: テーマ切り替えのアクション
- `mountedAtom`: クライアントサイドでの初期化状態

## 🎨 スタイル管理

このプロジェクトでは、統一されたスタイル管理のために`useStyles`カスタムフックを使用しています。

### 特徴

- **一元管理**: 全スタイルを一箇所で管理
- **一貫性**: アプリケーション全体で統一されたデザイン
- **再利用性**: コンポーネント間でスタイルを共有
- **保守性**: スタイル変更時の影響範囲を最小化

### 使用方法

```tsx
import { useStyles } from "@/hooks/useStyles";

export default function MyComponent() {
  const styles = useStyles();

  return (
    <div className={styles.card.base}>
      <h2 className={styles.heading.lg}>タイトル</h2>
      <button className={styles.button.primary}>ボタン</button>
    </div>
  );
}
```

## 📊 ダッシュボードコンポーネントの使用

### EstatRanking コンポーネント

サブカテゴリーページでは、`EstatRanking`コンポーネントを使用してデータを表示します。このコンポーネントは、コロプレス地図、統計サマリー、都道府県別データテーブルを一体化した標準コンポーネントです。

```tsx
import { EstatRanking } from "@/components/ranking";

export const MySubcategoryPage = ({ category, subcategory }) => {
  const statsDataId = "0000010101";
  const categoryCode = "A1101";

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: categoryCode,
        }}
        subcategory={subcategory}
        options={{
          colorScheme: "interpolateBlues",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </SubcategoryLayout>
  );
};
```

### 主な props

- `params`: e-Stat API パラメータ（statsDataId, cdCat01 など）
- `subcategory`: サブカテゴリーデータ（名前、単位、配色などの情報）
- `options`: 地図の可視化オプション（配色スキーム、発散型中点）
- `mapWidth` / `mapHeight`: 地図のサイズ

## 🧪 テスト・開発

### Storybook

```bash
# Storybook起動
npm run storybook

# ブラウザで http://localhost:6006 にアクセス
```

### 利用可能なスタイル

- **Input**: `styles.input.base`, `styles.input.disabled`
- **Button**: `styles.button.primary`, `styles.button.secondary`, `styles.button.small`
- **Card**: `styles.card.base`, `styles.card.compact`
- **Message**: `styles.message.success`, `styles.message.error`, `styles.message.info`, `styles.message.warning`
- **Layout**: `styles.layout.section`, `styles.layout.row`, `styles.layout.grid`

## 📊 e-Stat API 統合

このプロジェクトでは、e-Stat API の型安全性と使いやすさを向上させるために、以下の機能を実装しています：

### 主要機能

- **型安全な API 呼び出し**: TypeScript による完全な型サポート
- **効率的なデータ処理**: 自動データ変換と正規化
- **エラーハンドリング**: 構造化されたエラー処理
- **D1 データベース統合**: Cloudflare D1 への自動保存
- **共通 UI コンポーネント**: Message コンポーネントによる一貫した表示

## 🧪 テスト

```bash
# ユニットテストの実行
npm test

# テストカバレッジの確認
npm run test:coverage

# Storybookでのコンポーネントテスト
npm run storybook
```

## 📦 ビルド

```bash
# 本番ビルド
npm run build

# 静的エクスポート
npm run export
```

## 🚀 デプロイ

### Cloudflare Pages

1. **Cloudflare Pages でプロジェクトを作成**
2. **ビルド設定**
   - ビルドコマンド: `npm run build`
   - 出力ディレクトリ: `out`
3. **環境変数の設定**
4. **D1 データベースの設定**
5. **デプロイ**

### その他のプラットフォーム

- **Vercel**: `npm run build` でビルド
- **Netlify**: `npm run build` でビルド
- **自前サーバー**: `npm run export` で静的ファイルを生成

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 📞 サポート

問題が発生した場合や質問がある場合は、以下を確認してください：

1. **[データベース管理ガイド](./database/DEVELOPER_GUIDE.md)** - トラブルシューティング
2. **[e-Stat 統合ガイド](./doc/estat-integration.md)** - API 関連の問題
3. **[開発者ガイド](./doc/development-guide.md)** - 開発環境の問題

## 🔄 更新履歴

### 2025 年 10 月

- **2025-10-01**: カテゴリーページ（`/[category]`）の実装
- **2025-10-01**: サブカテゴリーコンポーネントのカテゴリー別ディレクトリ構造への再編成
- **2025-10-01**: サイドバーナビゲーションにカテゴリーリンクを追加
- **2025-10-01**: 3 種類のサブカテゴリーレイアウトパターンの実装（2 カラム、サマリーカード付き、1 カラム）
- **2025-10-01**: コンポーネントマッピングシステムの実装

### 2024 年 12 月

- **2024-12-19**: データベース管理システムの実装
- **2024-12-19**: e-Stat API 統合の実装
- **2024-12-19**: 認証システムの実装
- **2024-12-19**: ダークモード機能の実装
- **2024-12-19**: Message 共通コンポーネントの実装
- **2024-12-19**: Storybook 統合の実装
- **2024-12-19**: useStyles カスタムフックによるスタイル管理の実装
- **2024-12-19**: D1 データベースへの e-Stat メタ情報保存機能の実装
- **2024-12-19**: EstatDataDisplay コンポーネント群の構造化と Storybook・テスト統合
