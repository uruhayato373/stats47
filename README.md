# stats47 - 日本の地域統計データ可視化システム

e-Stat API を使用して日本の地域統計データを可視化する Web アプリケーションです。Next.js 15 と React 19 を使用して構築されています。

## 🚀 主要機能

- **地域統計データの可視化**: e-Stat API から取得したデータをグラフやチャートで表示
- **地域選択**: 都道府県・市区町村レベルの詳細な地域選択
- **カテゴリ別データ表示**: 人口、経済、社会などの分野別統計情報
- **ダークモード対応**: 自動システム設定検出と手動切り替え
- **認証システム**: Cloudflare D1 を使用したユーザー管理
- **メタ情報管理**: e-Stat API データの効率的な保存・検索

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **スタイリング**: Tailwind CSS 4
- **データ可視化**: Recharts, D3.js
- **データベース**: Cloudflare D1 (SQLite)
- **認証**: JWT, bcryptjs
- **API**: e-Stat API 統合 (`@estat/` パッケージ)
- **開発・ビルド**: Turbopack, ESLint

## 📦 プロジェクト構成

```
stats47/
├── README.md                 # このファイル
├── .cursorrules             # Cursor AI のルール設定
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
│   ├── contexts/           # React Context
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
# データベース初期化
./database/manage.sh init

# 状態確認
./database/manage.sh status
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

4. **e-Stat API 統合パッケージのインストール**

   ```bash
   npm install @estat/types @estat/client @estat/utils
   ```

5. **データベースの初期化**

   ```bash
   ./database/manage.sh init
   ```

6. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

## 🔑 環境変数

以下の環境変数を `.env.local` に設定してください：

```bash
# e-Stat API
NEXT_PUBLIC_ESTAT_APP_ID=your_estat_app_id

# JWT認証
JWT_SECRET=your_jwt_secret

# Cloudflare設定
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_D1_DATABASE_ID=your_d1_database_id

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_measurement_id
```

## 📊 e-Stat API 統合

このプロジェクトでは、e-Stat API の型安全性と使いやすさを向上させるために、以下のパッケージを使用しています：

### 利用可能なパッケージ

- **`@estat/types`**: e-Stat API の型定義
- **`@estat/client`**: API クライアントとデータ取得
- **`@estat/utils`**: データ変換とユーティリティ

### 主要機能

- **型安全な API 呼び出し**: TypeScript による完全な型サポート
- **効率的なデータ処理**: 自動データ変換と正規化
- **エラーハンドリング**: 構造化されたエラー処理
- **パフォーマンス最適化**: キャッシュとバッチ処理

## 🧪 テスト

```bash
# ユニットテストの実行
npm test

# テストカバレッジの確認
npm run test:coverage
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
4. **デプロイ**

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
