---
title: ドキュメントインデックス
created: 2024-10-14
updated: 2025-10-17
tags:
  - stats47
  - index
  - ドキュメント構成
---

# 統計で見る都道府県 ドキュメントインデックス

## プロジェクト概要

**ブランド名**: 統計で見る都道府県  
**技術名**: stats47  
**キャッチフレーズ**: データで知る、地域の今

「統計で見る都道府県」は、日本の地域統計データを可視化する Web アプリケーションです。e-Stat API を中心に、政府統計、自治体データ、民間統計など多様なデータソースから 47 都道府県の統計データを取得し、直感的なグラフとチャートで表示します。

詳細なプロジェクト説明は、[00_project_overview/overview.md](./00_project_overview/overview.md)を参照してください。

## 📖 ドキュメント構成

### 00_project_overview

プロジェクトの全体像と基本情報

- [overview.md](./00_project_overview/overview.md) - プロジェクト概要
- [project_requirements.md](./00_project_overview/project_requirements.md) - プロジェクト要件
- [functional_requirements.md](./00_project_overview/functional_requirements.md) - 機能要件
- [non_functional_requirements.md](./00_project_overview/non_functional_requirements.md) - 非機能要件
- [architecture.md](./00_project_overview/architecture.md) - システムアーキテクチャ
- [roadmap.md](./00_project_overview/roadmap.md) - プロジェクトロードマップ
- [monetization_strategy.md](./00_project_overview/monetization_strategy.md) - 収益化戦略
- [growth-and-monetization-strategy-2025.md](./00_project_overview/growth-and-monetization-strategy-2025.md) - 2025 年成長・収益化戦略
- [implementation-priority-guide.md](./00_project_overview/implementation-priority-guide.md) - 実装優先度ガイド
- [development-sequence-best-practices.md](./00_project_overview/development-sequence-best-practices.md) - 開発順序ベストプラクティスガイド
- [comprehensive-data-integration-design.md](./00_project_overview/comprehensive-data-integration-design.md) - 統合データプラットフォーム包括的設計書
- [comprehensive-design-specification.md](./00_project_overview/comprehensive-design-specification.md) - 都道府県ランキング可視化アプリケーション設計仕様書
- [japan-statistics-api-integration-plan.md](./00_project_overview/japan-statistics-api-integration-plan.md) - 日本統計 API 統合計画
- [world-statistics-integration-plan.md](./00_project_overview/world-statistics-integration-plan.md) - 世界統計統合計画
- [reference_links.md](./00_project_overview/reference_links.md) - 参考リンク集

### 01_development_guide

開発ガイドラインとベストプラクティス

- [coding_standards.md](./01_development_guide/coding_standards.md) - コーディング規約
- [component_guide.md](./01_development_guide/component_guide.md) - コンポーネント設計ガイド
- [styling_guide.md](./01_development_guide/styling_guide.md) - スタイリングガイド
- [testing_guide.md](./01_development_guide/testing_guide.md) - テストガイド
- [seo_guide.md](./01_development_guide/seo_guide.md) - SEO ガイド
- [storybook_guide.md](./01_development_guide/storybook_guide.md) - Storybook ガイド
- [d3js_choropleth_guide.md](./02_domain/visualization/implementation/d3js/d3js_choropleth_guide.md) - D3.js コロプレス地図ガイド
- [deployment_guide.md](./01_development_guide/deployment_guide.md) - デプロイメントガイド
- [environment_variables.md](./01_development_guide/environment_variables.md) - 環境変数設定ガイド
- [performance_optimization.md](./01_development_guide/performance_optimization.md) - パフォーマンス最適化ガイド
- [responsive-design-guide.md](./01_development_guide/responsive-design-guide.md) - レスポンシブデザイン実装ガイド
- [tabnavigation-testing-analysis.md](./01_development_guide/tabnavigation-testing-analysis.md) - TabNavigation テスト分析
- [engagement-features-guide.md](./02_domain/blog/features/engagement-features-guide.md) - エンゲージメント機能ガイド
- [documentation_management.md](./01_development_guide/documentation_management.md) - ドキュメント管理ルール
- [large_scale_implementation.md](./01_development_guide/large_scale_implementation.md) - 大規模プロジェクト実装ガイド
- [data-fetching-strategy.md](./01_development_guide/data-fetching-strategy.md) - データフェッチング戦略（e-Stat API useSWR 最適化完了）

### 02_domain

ドメイン駆動設計に基づく機能別ドキュメント

#### アーキテクチャドメイン (architecture)

システム全体のアーキテクチャ設計とリファクタリング計画

- [data-fetching-refactoring-plan.md](./02_domain/architecture/data-fetching-refactoring-plan.md) - データフェッチングリファクタリング計画
- [providers-architecture.md](./02_domain/architecture/providers-architecture.md) - Providers アーキテクチャ
- [providers-refactoring-report.md](./02_domain/architecture/providers-refactoring-report.md) - Providers リファクタリングレポート
- [refactoring-roadmap.md](./02_domain/architecture/refactoring-roadmap.md) - リファクタリングロードマップ
- [state-management-consolidation.md](./02_domain/architecture/state-management-consolidation.md) - 状態管理統合
- [technical-specifications.md](./02_domain/architecture/technical-specifications.md) - 技術仕様書
- [theme-fouc-resolution.md](./02_domain/architecture/theme-fouc-resolution.md) - テーマ FOUC 問題解決
- [useswr-refactoring-analysis.md](./02_domain/architecture/useswr-refactoring-analysis.md) - useSWR リファクタリング分析

#### 認証ドメイン (auth)

ユーザー認証・認可システム

- [specifications/authentication-system.md](./02_domain/auth/specifications/authentication-system.md) - 認証システム仕様
- [refactoring/authentication-analysis-and-improvement.md](./02_domain/auth/refactoring/authentication-analysis-and-improvement.md) - 認証システム分析と改善
- [refactoring/authentication-system-audit.md](./02_domain/auth/refactoring/authentication-system-audit.md) - 認証システム監査

#### 地域ドメイン (area)

地域データ管理と GeoShape データ処理

- [overview.md](./02_domain/area/overview.md) - 地域ドメイン概要
- [specifications/administrative-boundary-data.md](./02_domain/area/specifications/administrative-boundary-data.md) - 行政境界データ仕様
- [specifications/api.md](./02_domain/area/specifications/api.md) - 地域 API 仕様
- [specifications/data-structure.md](./02_domain/area/specifications/data-structure.md) - データ構造仕様
- [specifications/geoshape-auto-cache-specification.md](./02_domain/area/specifications/geoshape-auto-cache-specification.md) - GeoShape 自動キャッシュ仕様
- [specifications/hierarchy.md](./02_domain/area/specifications/hierarchy.md) - 地域階層仕様
- [implementation/getting-started.md](./02_domain/area/implementation/getting-started.md) - 地域管理実装ガイド
- [refactoring/migration-plan.md](./02_domain/area/refactoring/migration-plan.md) - 地域管理リファクタリング
- [testing/test-strategy.md](./02_domain/area/testing/test-strategy.md) - 地域管理テスト

#### ブログドメイン (blog)

ブログ機能とコンテンツ管理

- [specifications/overview.md](./02_domain/blog/specifications/overview.md) - ブログドメイン概要
- [specifications/content-structure.md](./02_domain/blog/specifications/content-structure.md) - コンテンツ構造仕様
- [specifications/mdx-architecture.md](./02_domain/blog/specifications/mdx-architecture.md) - MDX アーキテクチャ
- [specifications/frontmatter-schema.md](./02_domain/blog/specifications/frontmatter-schema.md) - Frontmatter スキーマ
- [specifications/component-integration.md](./02_domain/blog/specifications/component-integration.md) - コンポーネント統合
- [specifications/related-post.md](./02_domain/blog/specifications/related-post.md) - 関連記事機能
- [specifications/seo-strategy.md](./02_domain/blog/specifications/seo-strategy.md) - SEO 戦略

#### カテゴリ管理ドメイン (category)

統計カテゴリの管理と分類

- [README.md](./02_domain/category/README.md) - カテゴリ管理ドメイン概要
- [specifications/overview.md](./02_domain/category/specifications/overview.md) - カテゴリ管理仕様概要
- [specifications/api-specification.md](./02_domain/category/specifications/api-specification.md) - カテゴリ API 仕様
- [specifications/data-structure.md](./02_domain/category/specifications/data-structure.md) - カテゴリデータ構造
- [implementation/getting-started.md](./02_domain/category/implementation/getting-started.md) - カテゴリ管理実装ガイド

#### ダッシュボードドメイン (dashboard)

データ可視化ダッシュボード

- [components/choropleth-maps.md](./02_domain/dashboard/components/choropleth-maps.md) - コロプレス地図コンポーネント
- [components/comparison-charts.md](./02_domain/dashboard/components/comparison-charts.md) - 比較チャートコンポーネント
- [components/statistics-cards.md](./02_domain/dashboard/components/statistics-cards.md) - 統計カードコンポーネント
- [components/time-series-charts.md](./02_domain/dashboard/components/time-series-charts.md) - 時系列チャートコンポーネント
- [implementation/](./02_domain/dashboard/implementation/) - ダッシュボード実装ガイド
- [refactoring/adapter-migration-plan.md](./02_domain/dashboard/refactoring/adapter-migration-plan.md) - アダプタ移行計画
- [specifications/](./02_domain/dashboard/specifications/) - ダッシュボード仕様

#### データベースドメイン (database)

データベース設計と管理

- [specifications/](./02_domain/database/specifications/) - データベース仕様
  - [database-design.md](./02_domain/database/specifications/database-design.md) - データベース設計書
  - [schema-reference.md](./02_domain/database/specifications/schema-reference.md) - スキーマリファレンス
  - [migration-guide.md](./02_domain/database/specifications/migration-guide.md) - マイグレーションガイド
- [implementation/](./02_domain/database/implementation/) - データベース実装
  - [development-setup.md](./02_domain/database/implementation/development-setup.md) - 開発環境セットアップ
  - [query-patterns.md](./02_domain/database/implementation/query-patterns.md) - クエリパターン集
  - [best-practices.md](./02_domain/database/implementation/best-practices.md) - ベストプラクティス
- [operations/](./02_domain/database/operations/) - データベース運用
  - [backup-restore.md](./02_domain/database/operations/backup-restore.md) - バックアップ・リストアガイド
  - [troubleshooting.md](./02_domain/database/operations/troubleshooting.md) - トラブルシューティングガイド
- [refactoring/](./02_domain/database/refactoring/) - データベースリファクタリング

#### e-Stat API ドメイン (estat-api)

政府統計データ API 統合

- [specifications/](./02_domain/estat-api/specifications/) - e-Stat API 仕様
- [implementation/](./02_domain/estat-api/implementation/) - e-Stat API 実装ガイド
  - [useswr-optimization.md](./02_domain/estat-api/implementation/useswr-optimization.md) - useSWR 最適化実装ガイド
- [refactoring/](./02_domain/estat-api/refactoring/) - e-Stat API リファクタリング
- [testing/](./02_domain/estat-api/testing/) - e-Stat API テスト

#### エクスポートドメイン (export)

データエクスポート機能

- [specifications/csv-export-specification.md](./02_domain/export/specifications/csv-export-specification.md) - CSV エクスポート機能詳細仕様書
- [implementation/csv-export-implementation-guide.md](./02_domain/export/implementation/csv-export-implementation-guide.md) - CSV エクスポート実装ガイド

#### ランキングドメイン (ranking)

統計ランキング機能

- [specifications/](./02_domain/ranking/specifications/) - ランキング仕様
- [implementation/](./02_domain/ranking/implementation/) - ランキング実装ガイド
- [refactoring/](./02_domain/ranking/refactoring/) - ランキングリファクタリング

#### 可視化ドメイン (visualization)

データ可視化とチャート機能

- [specifications/](./02_domain/visualization/specifications/) - 可視化仕様
- [implementation/](./02_domain/visualization/implementation/) - 可視化実装ガイド
- [patterns/](./02_domain/visualization/patterns/) - 可視化パターン
- [refactoring/](./02_domain/visualization/refactoring/) - 可視化リファクタリング

### 03_features

機能別ドキュメント

- [comments-guide.md](./02_domain/blog/features/comments-guide.md) - コメント機能
- [image-generation/](./03_features/image-generation/) - 画像生成機能
- [related-articles/](./03_features/related-articles/) - 関連記事機能
- [sns/](./03_features/sns/) - SNS 連携機能

### 04_content_planning

コンテンツ戦略と記事計画

- [01\_ランキング記事/](./04_content_planning/01_ランキング記事/) - ランキング記事の計画
- [02\_ダッシュボード/](./04_content_planning/02_ダッシュボード/) - ダッシュボードコンテンツ計画
- [03\_ブログ記事/](./04_content_planning/03_ブログ記事/) - ブログ記事計画

### 05_resources

リソース・素材

- [design.png](./05_resources/design.png) - デザイン素材
- [instagram.md](./05_resources/instagram.md) - Instagram 関連リソース
- [x.md](./05_resources/x.md) - X (Twitter)関連リソース
- [sns-image-sizes.md](./05_resources/sns-image-sizes.md) - SNS 画像サイズ一覧
- [ランキング画像サンプル](./05_resources/) - ランキング画像サンプル

## 🎯 ドキュメントの使い方

### 新規参加者向け

1. まず [00_project_overview/overview.md](./00_project_overview/overview.md) でプロジェクト全体像を把握
2. [00_project_overview/project_requirements.md](./00_project_overview/project_requirements.md) でプロジェクトの目的を理解
3. [01_development_guide/coding_standards.md](./01_development_guide/coding_standards.md) で開発環境をセットアップ

### 開発者向け

- **コンポーネント開発**: [01_development_guide/component_guide.md](./01_development_guide/component_guide.md)
- **スタイリング**: [01_development_guide/styling_guide.md](./01_development_guide/styling_guide.md)
- **テスト実装**: [01_development_guide/testing_guide.md](./01_development_guide/testing_guide.md)
- **SEO 対応**: [01_development_guide/seo_guide.md](./01_development_guide/seo_guide.md)
- **ドキュメント管理**: [01_development_guide/documentation_management.md](./01_development_guide/documentation_management.md)

### ドメイン別開発

- **カテゴリ管理**: [02_domain/category/README.md](./02_domain/category/README.md)
- **e-Stat API**: [02_domain/estat-api/specifications/](./02_domain/estat-api/specifications/)
- **ダッシュボード**: [02_domain/dashboard/components/](./02_domain/dashboard/components/)
- **認証システム**: [02_domain/auth/specifications/authentication-system.md](./02_domain/auth/specifications/authentication-system.md)
- **エクスポート機能**: [02_domain/export/specifications/csv-export-specification.md](./02_domain/export/specifications/csv-export-specification.md)

### 機能仕様確認

- **プロジェクト要件**: [00_project_overview/project_requirements.md](./00_project_overview/project_requirements.md)
- **機能要件**: [00_project_overview/functional_requirements.md](./00_project_overview/functional_requirements.md)
- **非機能要件**: [00_project_overview/non_functional_requirements.md](./00_project_overview/non_functional_requirements.md)
- **アーキテクチャ**: [00_project_overview/architecture.md](./00_project_overview/architecture.md)
- **統合データプラットフォーム**: [00_project_overview/comprehensive-data-integration-design.md](./00_project_overview/comprehensive-data-integration-design.md)

### リファクタリング・改善

- **パフォーマンス**: [01_development_guide/performance_optimization.md](./01_development_guide/performance_optimization.md)
- **大規模実装**: [01_development_guide/large_scale_implementation.md](./01_development_guide/large_scale_implementation.md)
- **アーキテクチャ改善**: [02_domain/architecture/](./02_domain/architecture/)
- **ドメイン別リファクタリング**: [02_domain/](./02_domain/) 内の各ドメインの refactoring ディレクトリ

## 📝 ドキュメントの更新

ドキュメントを追加・更新した際は、この INDEX.md も併せて更新してください。

### 更新履歴

- 2025-01-18: e-Stat API useSWR 最適化完了、65%コード削減、パフォーマンス大幅向上
- 2025-10-18: ドキュメント整理完了、99_inbox 廃止、重複ドキュメント統合、適切な場所への移動
- 2025-10-17: ドキュメント構造大幅更新、architecture・export ドメイン追加、包括的設計書追加
- 2024-10-14: ドメイン駆動設計に基づく構成に更新、カテゴリ管理ドメイン追加
- 2024-10-14: INDEX.md 作成

---

**プロジェクト**: 統計で見る都道府県 (stats47)  
**最終更新**: 2025 年 1 月 18 日
