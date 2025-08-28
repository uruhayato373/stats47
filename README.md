# 地域統計ダッシュボード (stats47)

## 概要

このプロジェクトは、e-Stat API を使用して日本の地域統計データを可視化する Web アプリケーションです。Next.js 15 と React 19 を使用して構築されており、地域別の人口、GDP、失業率などの統計情報をグラフやチャートで表示します。

## 🚀 クイックスタート

```bash
# リポジトリのクローン
git clone https://github.com/uruhayato373/stats47.git
cd stats47

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスして動作確認。

## 📚 ドキュメント

プロジェクトの詳細な設計書と開発ガイドは以下のドキュメントをご覧ください：

### 📋 [プロジェクト概要](./doc/README.md)

- プロジェクトの概要と主要機能
- 技術スタックと開発環境
- クイックスタートガイド

### 🏗️ [システムアーキテクチャ](./doc/architecture.md)

- システム全体のアーキテクチャ設計
- 技術スタックの詳細説明
- データフローとパフォーマンス最適化

### 🔌 [API 設計仕様](./doc/api-design.md)

- e-Stat API の使用方法
- データ取得フローとエラーハンドリング
- セキュリティ考慮事項

### 🧩 [コンポーネント設計](./doc/component-design.md)

- React コンポーネントの設計詳細
- コンポーネント階層と責任分担
- パフォーマンス最適化とテスト戦略

### 👨‍💻 [開発者ガイド](./doc/development-guide.md)

- 開発環境のセットアップ
- コーディング規約と開発ワークフロー
- デバッグとトラブルシューティング

## ✨ 主要機能

- **地域選択**: 都道府県別のデータ表示
- **統計可視化**: 人口推移、GDP 指数、失業率のグラフ表示
- **データ取得**: e-Stat API からの自動データ取得
- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **サンプルデータ**: API キーがない場合のフォールバック機能

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **スタイリング**: Tailwind CSS 4
- **データ可視化**: Recharts, D3.js
- **開発・ビルド**: Turbopack, ESLint

## 🔧 開発環境

- **Node.js**: 18.x 以上
- **npm**: 9.x 以上
- **ポート**: 3000 (デフォルト)

## 📁 プロジェクト構造

```
stats47/
├── doc/                    # 📚 プロジェクト設計書
├── src/                    # 💻 ソースコード
│   ├── app/               # Next.js App Router
│   ├── components/         # Reactコンポーネント
│   └── config/             # 設定ファイル
├── public/                 # 🌐 静的ファイル
└── README.md               # 📖 このファイル
```

## 🚀 利用可能なスクリプト

```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run start        # 本番サーバー起動
npm run lint         # コード品質チェック
```

## 🔑 環境変数

`.env.local`ファイルを作成して以下の環境変数を設定してください：

```bash
# e-Stat APIキー（オプション）
NEXT_PUBLIC_ESTAT_APP_ID=your-actual-app-id
```

## 🤝 貢献

プロジェクトへの貢献を歓迎します！

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 📞 サポート

- **Issue**: [GitHub Issues](https://github.com/uruhayato373/stats47/issues)
- **ドキュメント**: [doc/](./doc/) ディレクトリ内の各ドキュメント
- **開発ガイド**: [開発者ガイド](./doc/development-guide.md)

## 🔗 関連リンク

- [e-Stat API](https://www.e-stat.go.jp/api/) - 統計データ API
- [Next.js](https://nextjs.org/) - React フレームワーク
- [React](https://react.dev/) - UI ライブラリ
- [Tailwind CSS](https://tailwindcss.com/) - CSS フレームワーク

---

**💡 ヒント**: プロジェクトの詳細な設計や開発方法については、[doc/](./doc/) ディレクトリ内の各ドキュメントをご参照ください！
