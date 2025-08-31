# stats47 - 日本の地域統計データ可視化システム

e-Stat API を使用して日本の地域統計データを可視化する Web アプリケーションです。Next.js 15 と React 19 を使用して構築されています。

## 🚀 主要機能

- **地域統計データの可視化**: e-Stat API から取得したデータをグラフやチャートで表示
- **地域選択**: 都道府県・市区町村レベルの詳細な地域選択
- **カテゴリ別データ表示**: 人口、経済、社会などの分野別統計情報
- **ダークモード対応**: 自動システム設定検出と手動切り替え
- **認証システム**: Cloudflare D1 を使用したユーザー管理
- **メタ情報管理**: e-Stat API データの効率的な保存・検索
- **統合データベース**: 認証、メタデータ、履歴管理を一元化
- **共通 UI コンポーネント**: 再利用可能な Message コンポーネント
- **Storybook 統合**: コンポーネント開発・テスト環境
- **統一されたスタイル管理**: useStyles カスタムフックによる一貫性

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **スタイリング**: Tailwind CSS 4, カスタムスタイルフック
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
│   ├── main.ts             # Storybookメイン設定
│   ├── preview.tsx         # プレビュー設定
│   └── storybook.css       # Storybook用スタイル
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
│   ├── components/         # React コンポーネント
│   │   ├── common/        # 共通コンポーネント
│   │   │   └── Message.tsx # メッセージ表示コンポーネント
│   │   ├── estat/         # e-Stat関連コンポーネント
│   │   ├── layout/        # レイアウトコンポーネント
│   │   └── dashboard/     # ダッシュボードコンポーネント
│   ├── contexts/           # React Context
│   ├── hooks/              # カスタムフック
│   │   └── useStyles.ts   # スタイル管理フック
│   ├── lib/                # ユーティリティライブラリ
│   ├── services/           # API サービス
│   └── types/              # TypeScript 型定義
├── doc/                     # プロジェクトドキュメント
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

- [アーキテクチャ](./doc/architecture.md) - システム設計とアーキテクチャ
- [コンポーネント設計](./doc/component-design.md) - React コンポーネントの設計原則
- [API 設計](./doc/api-design.md) - バックエンド API 仕様
- [配色システム設計](./doc/color-system.md) - UI/UX の配色システムとデザインガイドライン
- [開発者ガイド](./doc/development-guide.md) - 開発環境と手順
- [e-Stat 統合ガイド](./doc/estat-integration.md) - e-Stat API 統合の詳細

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
   cp env.example .env.local
   # .env.localファイルを編集して必要な値を設定
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

### 必須環境変数

開発環境でも Cloudflare D1 を使用するため、以下の環境変数が必要です：

```bash
# .env.local ファイルを作成
cp env.example .env.local

# 以下の値を設定
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_D1_DATABASE_ID=your_database_id_here
```

### Cloudflare D1 設定の取得方法

1. **API Token**: [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) で作成
2. **Account ID**: [Cloudflare Dashboard](https://dash.cloudflare.com/) の右サイドバーに表示
3. **Database ID**: `npx wrangler d1 list` で確認

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

- **2024-12-19**: データベース管理システムの実装
- **2024-12-19**: e-Stat API 統合の実装
- **2024-12-19**: 認証システムの実装
- **2024-12-19**: ダークモード機能の実装
- **2024-12-19**: Message 共通コンポーネントの実装
- **2024-12-19**: Storybook 統合の実装
- **2024-12-19**: useStyles カスタムフックによるスタイル管理の実装
- **2024-12-19**: D1 データベースへの e-Stat データ保存機能の実装
