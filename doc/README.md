# プロジェクトドキュメント

このディレクトリには、stats47 プロジェクトの設計書と開発者向けドキュメントが含まれています。

## ドキュメント構成

### 📋 設計書

- **[アーキテクチャ設計書](architecture.md)** - システム全体のアーキテクチャと技術構成（データベース設計含む）
- **[API 設計書](api-design.md)** - API エンドポイントとデータフローの設計
- **[コンポーネント設計書](component-design.md)** - React コンポーネントの設計原則と構造
- **[配色システム設計書](color-system.md)** - UI/UX の配色システムとデザインガイドライン
- **[フォント色統一システム](design-system.md)** - 統一されたフォント色階層の仕様書

### 🛠️ 開発者向け

- **[開発者ガイド](development-guide.md)** - 開発環境のセットアップと開発手順
- **[e-Stat API 統合ガイド](estat-integration.md)** - e-Stat API の統合方法と使用方法
- **[フォント色統一ガイド](font-color-unification-guide.md)** - 統一フォント色システムの使用方法
- **[アクセシビリティガイド](accessibility.md)** - WCAG 2.1準拠のアクセシビリティ要件

## ドキュメントの更新ルール

1. **コード変更時**: 関連するドキュメントも必ず更新する
2. **新機能追加時**: 適切な設計書に記載を追加する
3. **API 仕様変更時**: `api-design.md`を更新する
4. **コンポーネント追加・変更時**: `component-design.md`を更新する
5. **配色・UI 変更時**: `color-system.md`を更新する
6. **フォント色変更時**: `design-system.md`と`font-color-unification-guide.md`を更新する

## ドキュメントの書き方

- Markdown 形式で記述
- コード例は適切なシンタックスハイライトを使用
- 図表は必要に応じて Mermaid や PlantUML を使用
- 更新履歴を記録する

## 参考資料

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [e-Stat API Documentation](https://www.e-stat.go.jp/api/)
