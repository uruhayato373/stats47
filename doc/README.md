# プロジェクトドキュメント

このディレクトリには、stats47 プロジェクトの設計書と開発者向けドキュメントが含まれています。

## 📚 ドキュメント構成

このプロジェクトのドキュメントは、以下の4つのコアドキュメントに統合されています：

### 🏗️ [アーキテクチャ設計書](architecture.md)

システム全体のアーキテクチャと技術構成の完全ガイド

**内容:**
- システム構成とディレクトリ構造
- 技術スタック（Next.js 15, Cloudflare, D1）
- **API設計** - エンドポイント仕様とデータフロー
- **データベース設計** - D1スキーマと地図可視化設定
- データフローとキャッシング戦略

### 🎨 [デザインガイド](design-guide.md)

UI/UXデザインシステムの統合ガイド

**内容:**
- **配色システム** - カラーパレットとカテゴリー配色
- **フォント色システム** - 統一された色階層とアクセシビリティ
- **アクセシビリティ** - WCAG 2.1準拠の要件と実装

### 🧩 [コンポーネントガイド](component-guide.md)

全Reactコンポーネントの設計と実装ガイド

**内容:**
- **ページコンポーネント** - カテゴリー・サブカテゴリーページ
- **レイアウトパターン** - 2カラム、サマリーカード、1カラム
- **共通コンポーネント** - Header, Sidebar, データ表示
- **コロプレス地図** - 地図可視化コンポーネントの設計

### 🛠️ [開発者ガイド](development-guide.md)

開発環境のセットアップと開発手順の完全ガイド

**内容:**
- 開発環境のセットアップ
- **e-Stat API統合** - API利用方法とデータ取得
- **データベース開発** - D1のローカル開発とマイグレーション
- コーディング規約とテスト
- デプロイ手順

## 🔄 ドキュメントの更新ルール

### コード変更時

- **アーキテクチャ変更**: `architecture.md` を更新
- **API仕様変更**: `architecture.md` のAPI設計セクションを更新
- **DB構造変更**: `architecture.md` のDB設計セクションを更新

### UI/UX変更時

- **配色変更**: `design-guide.md` の配色システムセクションを更新
- **フォント色変更**: `design-guide.md` のフォント色システムセクションを更新
- **アクセシビリティ追加**: `design-guide.md` のアクセシビリティセクションを更新

### コンポーネント変更時

- **新規ページ追加**: `component-guide.md` のページコンポーネントセクションを更新
- **共通コンポーネント変更**: `component-guide.md` の該当セクションを更新
- **レイアウトパターン追加**: `component-guide.md` に新しいパターンを追加

### 開発環境変更時

- **依存関係更新**: `development-guide.md` の環境セットアップを更新
- **e-Stat連携変更**: `development-guide.md` のe-Stat統合セクションを更新
- **デプロイ手順変更**: `development-guide.md` のデプロイセクションを更新

## 📝 ドキュメントの書き方

- Markdown 形式で記述
- コード例は適切なシンタックスハイライトを使用
- 図表は必要に応じて Mermaid や PlantUML を使用
- セクションごとに更新履歴を記録
- 関連する他のドキュメントへのリンクを明記

## 🚀 クイックスタート

### 初めての方

1. **[開発者ガイド](development-guide.md)** から開始
2. **[アーキテクチャ設計書](architecture.md)** でシステム全体を把握
3. **[コンポーネントガイド](component-guide.md)** でUI構造を理解
4. **[デザインガイド](design-guide.md)** でデザインシステムを確認

### 機能追加・修正時

1. 該当する設計書を確認
2. 実装
3. 関連するドキュメントを更新
4. テストとレビュー

## 🔗 参考資料

### フレームワーク・ライブラリ

- [Next.js Documentation](https://nextjs.org/docs) - Reactフレームワーク
- [React Documentation](https://react.dev/) - UIライブラリ
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - CSSフレームワーク

### インフラストラクチャ

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/) - ホスティング
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/) - SQLiteデータベース

### データソース

- [e-Stat API Documentation](https://www.e-stat.go.jp/api/) - 政府統計API
- [e-Stat API 仕様](https://www.e-stat.go.jp/api/api-info/api-spec) - 詳細仕様

### アクセシビリティ

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - アクセシビリティガイドライン
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - コントラストチェッカー

---

**最終更新**: 2025-10-01
**ドキュメント構成**: 4つのコアドキュメント（architecture, design-guide, component-guide, development-guide）
