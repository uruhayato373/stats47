---
title: ドキュメントインデックス
created: 2024-10-14
updated: 2024-10-14
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

詳細なプロジェクト説明は、[00_project_overview/01_overview.md](./00_project_overview/01_overview.md)を参照してください。

## 📖 ドキュメント構成

### 00_project_overview

プロジェクトの全体像と基本情報

- [01_overview.md](./00_project_overview/01_overview.md) - プロジェクト概要とドキュメントマップ
- [02_project_requirements.md](./00_project_overview/02_project_requirements.md) - プロジェクト要件
- [03_functional_requirements.md](./00_project_overview/03_functional_requirements.md) - 機能要件
- [04_non_functional_requirements.md](./00_project_overview/04_non_functional_requirements.md) - 非機能要件
- [05_architecture.md](./00_project_overview/05_architecture.md) - システムアーキテクチャ
- [06_roadmap.md](./00_project_overview/06_roadmap.md) - プロジェクトロードマップ
- [07_monetization_strategy.md](./00_project_overview/07_monetization_strategy.md) - 収益化戦略
- [08_reference_links.md](./00_project_overview/08_reference_links.md) - 参考リンク集

### 01_development_guide

開発ガイドラインとベストプラクティス

- [README.md](./01_development_guide/README.md) - 開発ガイド概要
- [01_coding_standards.md](./01_development_guide/01_coding_standards.md) - コーディング規約
- [02_component_guide.md](./01_development_guide/02_component_guide.md) - コンポーネント設計ガイド
- [03_styling_guide.md](./01_development_guide/03_styling_guide.md) - スタイリングガイド
- [04_testing_guide.md](./01_development_guide/04_testing_guide.md) - テストガイド
- [05_seo_guide.md](./01_development_guide/05_seo_guide.md) - SEO ガイド
- [06_storybook_guide.md](./01_development_guide/06_storybook_guide.md) - Storybook ガイド
- [07_d3js_choropleth_guide.md](./01_development_guide/07_d3js_choropleth_guide.md) - D3.js コロプレス地図ガイド
- [08_deployment_guide.md](./01_development_guide/08_deployment_guide.md) - デプロイメントガイド
- [09_environment_variables.md](./01_development_guide/09_environment_variables.md) - 環境変数設定ガイド
- [10_performance_optimization.md](./01_development_guide/10_performance_optimization.md) - パフォーマンス最適化ガイド
- [11_engagement_features.md](./01_development_guide/11_engagement_features.md) - エンゲージメント機能ガイド
- [12_documentation_management.md](./01_development_guide/12_documentation_management.md) - ドキュメント管理ルール
- [13_large_scale_implementation.md](./01_development_guide/13_large_scale_implementation.md) - 大規模プロジェクト実装ガイド

### 02_domain

ドメイン駆動設計に基づく機能別ドキュメント

#### 認証ドメイン (auth)

- [README.md](./02_domain/auth/README.md) - 認証ドメイン概要
- [specifications/authentication-system.md](./02_domain/auth/specifications/authentication-system.md) - 認証システム仕様
- [refactoring/](./02_domain/auth/refactoring/) - 認証システムリファクタリング

#### ブログドメイン (blog)

- [README.md](./02_domain/blog/README.md) - ブログドメイン概要
- [specifications/](./02_domain/blog/specifications/) - ブログ機能仕様

#### カテゴリ管理ドメイン (category)

- [README.md](./02_domain/category/README.md) - カテゴリ管理ドメイン概要
- [specifications/](./02_domain/category/specifications/) - カテゴリ管理仕様
- [implementation/](./02_domain/category/implementation/) - カテゴリ管理実装ガイド

#### ダッシュボードドメイン (dashboard)

- [README.md](./02_domain/dashboard/README.md) - ダッシュボードドメイン概要
- [specifications/](./02_domain/dashboard/specifications/) - ダッシュボード仕様
- [implementation/](./02_domain/dashboard/implementation/) - ダッシュボード実装ガイド
- [components/](./02_domain/dashboard/components/) - ダッシュボードコンポーネント

#### データベースドメイン (database)

- [README.md](./02_domain/database/README.md) - データベースドメイン概要
- [specifications/](./02_domain/database/specifications/) - データベース仕様
- [refactoring/](./02_domain/database/refactoring/) - データベースリファクタリング

#### e-Stat API ドメイン (estat-api)

- [README.md](./02_domain/estat-api/README.md) - e-Stat API ドメイン概要
- [specifications/](./02_domain/estat-api/specifications/) - e-Stat API 仕様
- [implementation/](./02_domain/estat-api/implementation/) - e-Stat API 実装ガイド
- [testing/](./02_domain/estat-api/testing/) - e-Stat API テスト

#### ランキングドメイン (ranking)

- [README.md](./02_domain/ranking/README.md) - ランキングドメイン概要
- [specifications/](./02_domain/ranking/specifications/) - ランキング仕様
- [implementation/](./02_domain/ranking/implementation/) - ランキング実装ガイド
- [refactoring/](./02_domain/ranking/refactoring/) - ランキングリファクタリング

#### 可視化ドメイン (visualization)

- [README.md](./02_domain/visualization/README.md) - 可視化ドメイン概要
- [specifications/](./02_domain/visualization/specifications/) - 可視化仕様
- [implementation/](./02_domain/visualization/implementation/) - 可視化実装ガイド
- [refactoring/](./02_domain/visualization/refactoring/) - 可視化リファクタリング

### 03_features

機能別ドキュメント

- [comments/](./03_features/comments/) - コメント機能
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
- [画像サンプル](./05_resources/) - ランキング画像サンプル

### 99_inbox

一時的なドキュメント・メモ

- [useswr-refactoring-analysis.md](./99_inbox/useswr-refactoring-analysis.md) - useSWR リファクタリング分析
- [メモ.md](./99_inbox/メモ.md) - 開発メモ
- [レスポンシブデザイン.md](./99_inbox/レスポンシブデザイン.md) - レスポンシブデザインメモ
- [画像生成.md](./99_inbox/画像生成.md) - 画像生成メモ

## 🎯 ドキュメントの使い方

### 新規参加者向け

1. まず [00_project_overview/01_overview.md](./00_project_overview/01_overview.md) でプロジェクト全体像を把握
2. [00_project_overview/02_project_requirements.md](./00_project_overview/02_project_requirements.md) でプロジェクトの目的を理解
3. [01_development_guide/01_coding_standards.md](./01_development_guide/01_coding_standards.md) で開発環境をセットアップ

### 開発者向け

- **コンポーネント開発**: [01_development_guide/02_component_guide.md](./01_development_guide/02_component_guide.md)
- **スタイリング**: [01_development_guide/03_styling_guide.md](./01_development_guide/03_styling_guide.md)
- **テスト実装**: [01_development_guide/04_testing_guide.md](./01_development_guide/04_testing_guide.md)
- **SEO 対応**: [01_development_guide/05_seo_guide.md](./01_development_guide/05_seo_guide.md)
- **ドキュメント管理**: [01_development_guide/12_documentation_management.md](./01_development_guide/12_documentation_management.md)

### ドメイン別開発

- **カテゴリ管理**: [02_domain/category/README.md](./02_domain/category/README.md)
- **e-Stat API**: [02_domain/estat-api/README.md](./02_domain/estat-api/README.md)
- **ダッシュボード**: [02_domain/dashboard/README.md](./02_domain/dashboard/README.md)
- **認証システム**: [02_domain/auth/README.md](./02_domain/auth/README.md)

### 機能仕様確認

- **プロジェクト要件**: [00_project_overview/02_project_requirements.md](./00_project_overview/02_project_requirements.md)
- **機能要件**: [00_project_overview/03_functional_requirements.md](./00_project_overview/03_functional_requirements.md)
- **非機能要件**: [00_project_overview/04_non_functional_requirements.md](./00_project_overview/04_non_functional_requirements.md)
- **アーキテクチャ**: [00_project_overview/05_architecture.md](./00_project_overview/05_architecture.md)

### リファクタリング・改善

- **パフォーマンス**: [01_development_guide/10_performance_optimization.md](./01_development_guide/10_performance_optimization.md)
- **大規模実装**: [01_development_guide/13_large_scale_implementation.md](./01_development_guide/13_large_scale_implementation.md)
- **ドメイン別リファクタリング**: [02_domain/](./02_domain/) 内の各ドメインの refactoring ディレクトリ

## 📝 ドキュメントの更新

ドキュメントを追加・更新した際は、この INDEX.md も併せて更新してください。

### 更新履歴

- 2024-01-XX: ドメイン駆動設計に基づく構成に更新、カテゴリ管理ドメイン追加
- 2024-10-14: INDEX.md 作成

---

**プロジェクト**: 統計で見る都道府県 (stats47)
**最終更新**: 2024 年 10 月 14 日
