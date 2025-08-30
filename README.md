# 地域統計ダッシュボード (Stats47)

日本の地域統計データを可視化する Web アプリケーションです。e-Stat API を使用して都道府県別の統計データを取得し、インタラクティブなグラフとチャートで表示します。

## 主要機能

- 🗾 **地域選択**: 都道府県別の統計データ表示
- 📊 **データ可視化**: 人口推移、GDP 指数、失業率などをグラフで表示
- 🌍 **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応
- 🔄 **リアルタイムデータ**: e-Stat API から最新データを取得
- 🔓 **基本機能**: ログインなしでもダッシュボードの基本機能を利用可能
- 🔐 **プレミアム機能**: ログインで CSV ダウンロード、高度なチャート等を利用
- 🎨 **テーマ切り替え**: ライト・ダークモード対応
- 🚀 **エッジコンピューティング**: Cloudflare Workers で高速な API 処理

## 技術スタック

### フロントエンド

- **Next.js 15.5.2** - React フレームワーク (App Router 使用)
- **React 19.1.0** - UI ライブラリ
- **TypeScript** - 型安全な開発
- **Tailwind CSS 4** - ユーティリティファースト CSS

### バックエンド・API

- **Next.js API Routes** - サーバーサイド API
- **bcryptjs** - パスワードハッシュ化
- **jsonwebtoken** - JWT 認証
- **e-Stat API** - 政府統計データ取得

### データベース・インフラ

- **Cloudflare D1** - SQLite ベースのエッジデータベース
- **Cloudflare Workers** - エッジサーバーレス実行環境

### 型定義・ライブラリ

- **@estat/types** - e-Stat API の型定義パッケージ
- **@estat/client** - e-Stat API クライアントライブラリ
- **@estat/utils** - e-Stat データ処理ユーティリティ

## プロジェクト構成

```
stats47/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/         # 認証関連API
│   │   │   │   ├── login/    # ログインAPI
│   │   │   │   ├── logout/   # ログアウトAPI
│   │   │   │   ├── register/ # ユーザー登録API
│   │   │   │   └── me/       # ユーザー情報取得API
│   │   │   └── data/         # データ関連API
│   │   │       └── export/   # データエクスポートAPI
│   │   │           └── csv/  # CSVダウンロードAPI
│   │   ├── auth/             # 認証ページ
│   │   │   ├── login/        # ログインページ
│   │   │   └── register/     # 登録ページ
│   │   ├── dashboard/        # ダッシュボード（認証不要）
│   │   ├── layout.tsx        # ルートレイアウト
│   │   └── page.tsx          # ホームページ
│   ├── components/            # Reactコンポーネント
│   │   ├── auth/             # 認証関連コンポーネント
│   │   │   ├── LoginForm.tsx # ログインフォーム
│   │   │   ├── RegisterForm.tsx # 登録フォーム
│   │   │   ├── AuthGuard.tsx # 認証ガード
│   │   │   └── UserMenu.tsx  # ユーザーメニュー
│   │   ├── dashboard/        # ダッシュボード関連
│   │   │   ├── PublicDashboard/      # 認証不要な基本ダッシュボード
│   │   │   ├── AuthRequiredFeatures/ # 認証が必要な高度な機能
│   │   │   │   ├── CSVDownloadButton.tsx # CSVダウンロードボタン
│   │   │   │   └── AuthRequiredFeatures.tsx # プレミアム機能一覧
│   │   │   └── DataVisualization/    # データ可視化
│   │   ├── atoms/            # アトムコンポーネント
│   │   │   └── RegionSelector/ # 地域選択
│   │   ├── molecules/        # モレキュールコンポーネント
│   │   │   └── StatisticsDisplay/ # 統計表示
│   │   ├── organisms/        # オーガニズムコンポーネント
│   │   │   └── EstatDataFetcher/ # e-Statデータ取得
│   │   └── layout/           # レイアウト関連
│   │       └── Header/       # ヘッダー
│   ├── contexts/             # React Context
│   │   ├── AuthContext.tsx   # 認証状態管理
│   │   └── ThemeContext.tsx  # テーマ状態管理
│   ├── types/                # 型定義
│   │   └── estat/           # e-Stat API型定義（@estat/パッケージ使用）
│   └── worker/               # Cloudflare Worker
│       └── index.ts          # D1データベース操作API
├── doc/                      # プロジェクトドキュメント
├── data/                     # データファイル
├── schema.sql               # データベーススキーマ
├── wrangler.toml           # Cloudflare Workers設定
└── env.example             # 環境変数サンプル
```

## 機能レベル

### 🟢 基本機能（認証不要）

- **統計データの閲覧**: 地域別の基本統計情報
- **グラフ・チャート表示**: 基本的なデータ可視化
- **地域選択**: 都道府県別のデータ表示
- **レスポンシブ対応**: モバイル・デスクトップ対応
- **ダークモード**: テーマ切り替え

### 🔒 プレミアム機能（認証必要）

- **CSV データダウンロード**: 統計データの CSV 形式エクスポート
- **高度なチャート**: 3D チャート、インタラクティブグラフ
- **データエクスポート**: PDF、Excel 形式でのエクスポート
- **カスタムレポート**: 独自の分析レポート作成
- **API アクセス**: プログラムによるデータ取得
- **優先サポート**: 専任サポートチーム

## セットアップ

### 必要な環境

- **Node.js 18+**
- **npm 9+**
- **Cloudflare アカウント** (D1 データベース使用時)

### インストールと起動

```bash
# リポジトリのクローン
git clone <repository-url>
cd stats47

# 依存関係のインストール
npm install

# e-Stat関連パッケージのインストール
npm install @estat/types @estat/client @estat/utils

# 環境変数の設定
cp env.example .env.local
# .env.localファイルを編集して必要な値を設定

# 開発サーバーの起動
npm run dev
```

開発サーバーが起動したら、[http://localhost:3000](http://localhost:3000) でアプリケーションにアクセスできます。

### e-Stat API 設定

```bash
# e-Stat APIキーの取得
# https://www.e-stat.go.jp/api/ でアプリケーションIDを取得

# 環境変数の設定
echo "NEXT_PUBLIC_ESTAT_APP_ID=your-estat-api-app-id" >> .env.local
```

### Cloudflare D1 データベースの設定

1. **Cloudflare アカウントの作成**

   - [Cloudflare](https://cloudflare.com)でアカウントを作成

2. **D1 データベースの作成**

   ```bash
   # Wrangler CLIのインストール
   npm install -g wrangler

   # Cloudflareにログイン
   wrangler login

   # D1 データベースの作成
   wrangler d1 create stats47-auth-db

   # データベースIDを取得してwrangler.tomlに設定
   ```

3. **データベーススキーマの適用**

   ```bash
   # スキーマの適用
   wrangler d1 execute stats47-auth-db --file=./schema.sql
   ```

4. **環境変数の設定**
   ```env
   CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
   CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
   CLOUDFLARE_D1_DATABASE_ID=your-d1-database-id
   JWT_SECRET=your-super-secret-jwt-key-here
   ```

### 本番ビルド

```bash
# 本番用ビルド
npm run build

# 本番サーバーの起動
npm start
```

## 環境変数の設定

### 認証関連

```env
# JWT認証用のシークレットキー
JWT_SECRET=your-super-secret-jwt-key-here

# Cloudflare D1 データベース設定
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_D1_DATABASE_ID=your-d1-database-id
```

### e-Stat API

```env
# e-Stat API設定
NEXT_PUBLIC_ESTAT_APP_ID=your-estat-api-app-id
```

## e-Stat API 統合

### 型定義の利用

このプロジェクトでは、e-Stat API の型安全性を確保するために`@estat/`パッケージを使用しています：

```typescript
import { EstatResponse, EstatParameter } from "@estat/types";

// e-Stat APIレスポンスの型安全な処理
const handleEstatResponse = (response: EstatResponse) => {
  // 型安全なデータアクセス
  const data = response.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF;
  // ...
};
```

### 利用可能なパッケージ

- **@estat/types**: e-Stat API の完全な型定義
- **@estat/client**: e-Stat API クライアントライブラリ
- **@estat/utils**: データ処理と変換ユーティリティ

### 型定義の特徴

- **完全な API 対応**: e-Stat API の全エンドポイントに対応
- **型安全性**: TypeScript による厳密な型チェック
- **自動更新**: 最新の API 仕様に対応
- **開発体験**: IntelliSense とエラー検出の向上

## 認証機能

### ユーザー登録

- メールアドレス、ユーザー名、パスワードでアカウント作成
- パスワードは bcrypt でハッシュ化して保存
- 重複チェック（メールアドレス・ユーザー名）

### ログイン・ログアウト

- JWT トークンによる認証
- セッション管理（Cloudflare D1）
- 自動ログアウト（トークン期限切れ）

### 認証ガード

- 保護されたページへのアクセス制御
- 未認証ユーザーの自動リダイレクト
- ローディング状態の管理

## CSV ダウンロード機能

### 使用方法

1. **ログイン**: アカウントにログイン
2. **データ選択**: ダウンロードしたいデータを選択
3. **CSV ダウンロード**: CSV ダウンロードボタンをクリック
4. **ファイル保存**: ブラウザで CSV ファイルが自動ダウンロード

### 対応データ形式

- 地域統計データ
- 人口・経済指標
- カスタムデータセット
- テーブル形式のデータ

### セキュリティ

- JWT トークンによる認証
- ユーザー別のアクセス制御
- 不正アクセスの防止

## 開発

### コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm start        # 本番サーバー起動
npm run lint     # ESLint実行
```

### アーキテクチャ

このプロジェクトは以下の設計原則に従って構築されています：

- **コンポーネントベース設計**: 再利用可能な React コンポーネント
- **関心の分離**: ビジネスロジックとプレゼンテーション層の分離
- **型安全性**: TypeScript による厳密な型チェック
- **レスポンシブデザイン**: モバイルファーストアプローチ
- **エッジファースト**: Cloudflare Workers による高速な API 処理
- **セキュリティ**: JWT 認証とパスワードハッシュ化
- **段階的機能提供**: 基本機能は無料、高度な機能は認証必要
- **e-Stat 統合**: @estat/パッケージによる型安全な API 統合

詳細は[doc/architecture.md](./doc/architecture.md)を参照してください。

## セキュリティ

- **パスワードハッシュ化**: bcrypt（salt rounds: 12）
- **JWT 認証**: 7 日間の有効期限
- **CORS 設定**: 適切なオリジン制御
- **SQL インジェクション対策**: プリペアドステートメント使用
- **API 保護**: 認証が必要な機能の適切な制御

## ドキュメント

- [アーキテクチャ](./doc/architecture.md) - システム設計とアーキテクチャ
- [コンポーネント設計](./doc/component-design.md) - React コンポーネントの設計原則
- [API 設計](./doc/api-design.md) - バックエンド API 仕様
- [配色システム設計](./doc/color-system.md) - UI/UX の配色システムとデザインガイドライン
- [開発者ガイド](./doc/development-guide.md) - 開発環境と手順
- [e-Stat 統合ガイド](./doc/estat-integration.md) - e-Stat API 統合の詳細

## 貢献

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## お問い合わせ

プロジェクトに関する質問や提案がある場合は、GitHub の Issue を作成してください。
