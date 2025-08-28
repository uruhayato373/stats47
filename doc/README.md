# 地域統計ダッシュボード プロジェクト

## 概要

このプロジェクトは、e-Stat API を使用して日本の地域統計データを可視化する Web アプリケーションです。Next.js 15 と React 19 を使用して構築されており、地域別の人口、GDP、失業率などの統計情報をグラフやチャートで表示します。

## プロジェクト情報

- **プロジェクト名**: stats47
- **フレームワーク**: Next.js 15.5.2
- **React バージョン**: 19.1.0
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **グラフライブラリ**: Recharts
- **API**: e-Stat API

## ドキュメント構成

```
doc/
├── README.md                    # このファイル（プロジェクト概要）
├── architecture.md              # システムアーキテクチャ
├── api-design.md                # API設計仕様
├── component-design.md          # コンポーネント設計
├── database-design.md           # データ設計
├── deployment.md                # デプロイメント手順
├── development-guide.md         # 開発者ガイド
└── user-manual.md               # ユーザーマニュアル
```

## 主要機能

- **地域選択**: 都道府県別のデータ表示
- **統計可視化**: 人口推移、GDP 指数、失業率のグラフ表示
- **データ取得**: e-Stat API からの自動データ取得
- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **サンプルデータ**: API キーがない場合のフォールバック機能

## 技術スタック

### フロントエンド

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

### データ可視化

- Recharts
- D3.js

### 開発・ビルド

- Turbopack
- ESLint
- PostCSS

## 開発環境

- **Node.js**: 18.x 以上
- **npm**: 9.x 以上
- **ポート**: 3000 (デフォルト)

## クイックスタート

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# 本番サーバーの起動
npm start
```

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 貢献

プロジェクトへの貢献を歓迎します。Issue や Pull Request をお気軽にお送りください。

## 連絡先

プロジェクトに関する質問や提案がある場合は、GitHub の Issue を作成してください。
