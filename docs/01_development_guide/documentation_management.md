---
title: ドキュメント管理ルール
created: 2025-10-16
updated: 2025-10-16
tags:
  - development-guide
---

# ドキュメント管理ルール

## 概要

stats47 プロジェクトのドキュメント管理に関する統一的なルールとガイドラインを定義します。プロジェクトの品質向上、保守性の確保、チーム内での知識共有を目的とします。

## ドキュメント構造

### ディレクトリ命名規則

#### 1. トップレベルディレクトリ

```
docs/
├── 00_project_overview/     # プロジェクト概要・要件
├── 01_development_guide/    # 開発ガイド・規約
├── 02_domain/              # ドメイン別ドキュメント
├── 03_features/            # 機能別ドキュメント
├── 04_content_planning/    # コンテンツ計画
├── 05_resources/           # リソース・素材
├── 99_inbox/              # 一時的なドキュメント
└── INDEX.md               # ドキュメントインデックス
```

#### 2. ドメイン別ディレクトリ（02_domain/）

**共通ルール**: 全てのドメインは以下の 4 つのディレクトリを必ず作成する

```
02_domain/
├── {domain_name}/
│   ├── README.md              # ドメイン概要（必須）
│   ├── specifications/        # 仕様書（必須）
│   ├── implementation/        # 実装ガイド（必須）
│   ├── refactoring/          # リファクタリング（必須）
│   └── testing/              # テスト関連（必須）
```

**各ディレクトリの役割:**

- **README.md**: ドメインの概要、責任、価値、関連ドメイン
- **specifications/**: 機能仕様、API 仕様、データ構造、ビジネスルール
- **implementation/**: 実装ガイド、使用例、ベストプラクティス
- **refactoring/**: リファクタリング計画、移行ガイド、改善提案
- **testing/**: テスト戦略、テストケース、テストデータ

**例:**

```
02_domain/
├── category/
│   ├── README.md
│   ├── specifications/
│   │   ├── overview.md
│   │   ├── data-structure.md
│   │   └── api-specification.md
│   ├── implementation/
│   │   └── getting-started.md
│   ├── refactoring/
│   │   └── migration-guide.md
│   └── testing/
│       └── unit-testing.md
```

### ファイル命名規則

#### 1. 基本ルール

- **小文字とハイフン**: `documentation-management.md`
- **日本語ファイル名**: 使用禁止（英語のみ）
- **番号プレフィックス**: 順序が重要な場合は使用
- **ファイル名の長さ**: 50 文字以内を推奨

#### 2. ファイル名パターン

| 用途             | パターン                   | 例                        | 日本語ファイル名（禁止例）    |
| ---------------- | -------------------------- | ------------------------- | ----------------------------- |
| 概要             | `overview.md`              | `overview.md`             | `概要.md`                     |
| 仕様書           | `{feature}.md`             | `api.md`                  | `API仕様書.md`                |
| 実装ガイド       | `{action}-guide.md`        | `getting-started.md`      | `はじめに.md`                 |
| リファクタリング | `{feature}-refactoring.md` | `category-refactoring.md` | `カテゴリリファクタリング.md` |
| テスト           | `{feature}-testing.md`     | `unit-testing.md`         | `単体テスト.md`               |

#### 3. 番号プレフィックス

順序が重要な場合のみ使用：

```
01_overview.md
02_architecture.md
03_implementation.md
```

**概要ファイルの命名規則**:

- **全ての概要ファイル**: `overview.md` を使用
- **番号プレフィックス付き**: `01_overview.md` を使用
- **README.md**: 使用禁止（`overview.md` に統一）

#### 4. ファイル命名のベストプラクティス

**推奨**:

- 英語の小文字とハイフンを使用
- 意味が明確で簡潔な名前
- 一貫した命名パターン

**禁止**:

- 日本語ファイル名（`カテゴリ管理.md` など）
- スペースを含む名前（`category management.md` など）
- 特殊文字（`@`, `#`, `%` など）
- 大文字のみの名前（`CATEGORY.md` など）
- README.md の使用（`overview.md` に統一）

**例**:

```bash
# 良い例
overview.md                           # ドメイン概要
api.md                               # 仕様書
category-management.md               # 仕様書
getting-started-guide.md            # 実装ガイド
database-refactoring-plan.md        # リファクタリング計画
01_overview.md                       # 番号付き概要

# 悪い例
README.md                            # README.md の使用禁止
api-specification.md                 # -specification は不要
概要.md                              # 日本語ファイル名
カテゴリ管理仕様書.md                # 日本語ファイル名
API実装ガイド.md                     # 日本語ファイル名
データベースリファクタリング計画.md  # 日本語ファイル名
```

## ドキュメント作成・更新ルール

### 1. 新規作成時の手順

#### 1.1 ドキュメントの種類を決定

- **仕様書**: 機能の詳細な仕様を定義
- **実装ガイド**: 開発者向けの実装手順
- **リファクタリング**: 既存コードの改善計画
- **テスト**: テスト戦略・手順

#### 1.2 適切なディレクトリに配置

```bash
# ドメイン別ドキュメントの場合
docs/02_domain/{domain_name}/specifications/    # 仕様書
docs/02_domain/{domain_name}/implementation/    # 実装ガイド
docs/02_domain/{domain_name}/refactoring/      # リファクタリング
docs/02_domain/{domain_name}/testing/          # テスト関連

# 開発ガイドの場合
docs/01_development_guide/

# 機能別ドキュメントの場合
docs/03_features/{feature_name}/
```

**注意**: 新規ドメイン作成時は、必ず 4 つのディレクトリ（specifications, implementation, refactoring, testing）を同時に作成すること

#### 1.3 テンプレートを使用

各ドキュメントタイプに応じたテンプレートを使用：

```markdown
# {ドキュメントタイトル}

## 概要

{ドキュメントの目的と概要}

## 前提条件

{必要な前提知識や環境}

## 詳細内容

{メインの内容}

## 使用例

{具体的な使用例}

## 参考資料

{関連するドキュメントやリンク}
```

#### 1.4 メタデータの追加（フロントマター）

**重要**: 全ての Markdown ドキュメントには、Obsidian 用の YAML フロントマターを必ず記載すること

##### 必須フィールド

```yaml
---
title: ドキュメントタイトル
created: 2024-01-01
updated: 2024-01-01
status: draft
tags:
  - stats47
  - domain/category
  - type/specification
author: 作成者名
---
```

##### フィールド定義

| フィールド | 必須 | 説明                          | 例                                            |
| ---------- | ---- | ----------------------------- | --------------------------------------------- |
| `title`    | ✅   | ドキュメントのタイトル        | `"カテゴリ管理システム仕様書"`                |
| `created`  | ✅   | 作成日（YYYY-MM-DD 形式）     | `2024-01-15`                                  |
| `updated`  | ✅   | 最終更新日（YYYY-MM-DD 形式） | `2024-01-20`                                  |
| `status`   | ✅   | ドキュメントの状態            | `draft`, `in-review`, `published`, `archived` |
| `tags`     | ✅   | タグのリスト                  | 下記タグ規則参照                              |
| `author`   | ✅   | 作成者名                      | `"開発チーム"`                                |
| `version`  | ❌   | バージョン番号                | `"1.0.0"`                                     |
| `aliases`  | ❌   | ドキュメントの別名            | `["カテゴリ管理", "Category System"]`         |
| `related`  | ❌   | 関連ドキュメントのリンク      | `["[[API仕様]]", "[[実装ガイド]]"]`           |

##### ステータスの定義

- **draft**: 作成中・下書き状態
- **in-review**: レビュー中
- **published**: 公開済み・使用可能
- **archived**: アーカイブ済み・非推奨

##### タグ規則

**階層構造を使用**: Obsidian のタグ階層機能を活用

```yaml
tags:
  - stats47 # プロジェクト名（必須）
  - domain/category # ドメイン名
  - type/specification # ドキュメントタイプ
  - tech/typescript # 技術スタック
  - priority/high # 優先度
```

**ドメインタグ**:

- `domain/auth` - 認証ドメイン
- `domain/blog` - ブログドメイン
- `domain/category` - カテゴリ管理ドメイン
- `domain/dashboard` - ダッシュボードドメイン
- `domain/database` - データベースドメイン
- `domain/estat-api` - e-Stat API ドメイン
- `domain/ranking` - ランキングドメイン
- `domain/visualization` - 可視化ドメイン

**タイプタグ**:

- `type/specification` - 仕様書
- `type/implementation` - 実装ガイド
- `type/refactoring` - リファクタリング
- `type/testing` - テスト関連
- `type/guide` - ガイド
- `type/reference` - リファレンス

**技術スタックタグ**:

- `tech/typescript` - TypeScript
- `tech/react` - React
- `tech/nextjs` - Next.js
- `tech/d3js` - D3.js
- `tech/cloudflare` - Cloudflare

**優先度タグ**:

- `priority/high` - 高優先度
- `priority/medium` - 中優先度
- `priority/low` - 低優先度

##### ドメイン別フロントマター例

**仕様書の場合**:

```yaml
---
title: カテゴリ管理API仕様書
created: 2024-01-15
updated: 2024-01-20
status: published
tags:
  - stats47
  - domain/category
  - type/specification
  - tech/typescript
author: 開発チーム
version: 1.0.0
related:
  - "[[カテゴリ管理システム概要]]"
  - "[[実装ガイド]]"
---
```

**実装ガイドの場合**:

```yaml
---
title: カテゴリ管理実装ガイド
created: 2024-01-15
updated: 2024-01-20
status: published
tags:
  - stats47
  - domain/category
  - type/implementation
  - tech/typescript
  - tech/react
author: 開発チーム
aliases:
  - "カテゴリ実装"
  - "Category Implementation"
related:
  - "[[API仕様書]]"
  - "[[ベストプラクティス]]"
---
```

### 2. 更新時の手順

#### 2.1 フロントマターの更新

ドキュメントを更新する際は、必ずフロントマターも更新すること：

```yaml
---
title: ドキュメントタイトル
created: 2024-01-01
updated: 2024-01-20 # ← 更新日を変更
status: published # ← 必要に応じてステータス変更
tags:
  - stats47
  - domain/category
  - type/specification
author: 開発チーム
version: 1.1.0 # ← バージョンアップ
---
```

#### 2.2 更新理由の記録

```markdown
## 更新履歴

### v1.1.0 (2024-01-15)

- 新機能追加: 検索機能の実装
- 既存機能改善: パフォーマンス最適化

### v1.0.0 (2024-01-01)

- 初回作成
```

#### 2.3 関連ドキュメントの更新

- 影響を受ける他のドキュメントを特定
- リンク切れの確認と修正
- 整合性の確保
- フロントマターの`related`フィールドを更新

### 3. レビュープロセス

#### 3.1 自己レビュー

- [ ] フロントマターが正しく記載されている
- [ ] 必須フィールド（title, created, updated, status, tags, author）が全て記入されている
- [ ] タグが規則に従っている（stats47, domain/_, type/_）
- [ ] ファイル名が英語のみで命名されている
- [ ] 内容の正確性
- [ ] 文章の読みやすさ
- [ ] コード例の動作確認
- [ ] リンクの有効性（Obsidian のリンク形式 `[[]]` を使用）

#### 3.2 チームレビュー

- [ ] 技術的正確性
- [ ] プロジェクト方針との整合性
- [ ] 他のドキュメントとの整合性
- [ ] 実用性

## 品質管理

### 1. ドキュメントの品質基準

#### 1.1 内容の品質

- **正確性**: 技術的に正確であること
- **完全性**: 必要な情報が網羅されていること
- **一貫性**: 用語や表記が統一されていること
- **最新性**: 現在の実装と一致していること

#### 1.2 文章の品質

- **明確性**: 読み手が理解しやすい文章
- **簡潔性**: 必要十分な情報量
- **構造化**: 適切な見出しと段落構成
- **視覚的**: 表、図、コードブロックの適切な使用

#### 1.3 技術的品質

- **コード例**: 動作するコード例の提供
- **リンク**: 有効なリンクの維持
- **バージョン**: 適切なバージョン情報の記載

### 2. レビュー項目

#### 2.1 基本項目

- [ ] タイトルが内容を適切に表現している
- [ ] 概要が明確に記載されている
- [ ] 前提条件が明記されている
- [ ] 手順が順序立てて記載されている
- [ ] 使用例が実用的である
- [ ] 参考資料が適切に記載されている

#### 2.2 技術項目

- [ ] コード例が動作する
- [ ] 型定義が正確である
- [ ] API 仕様が最新である
- [ ] エラーハンドリングが記載されている
- [ ] パフォーマンス考慮事項が記載されている

#### 2.3 プロジェクト項目

- [ ] プロジェクト方針に沿っている
- [ ] 既存のドキュメントと整合性がある
- [ ] 適切なディレクトリに配置されている
- [ ] ファイル名が規則に従っている（英語のみ、小文字とハイフン）
- [ ] 日本語ファイル名が使用されていない
- [ ] ドメイン別ドキュメントの場合、4 つのディレクトリ（specifications, implementation, refactoring, testing）が存在する

### 3. 承認プロセス

#### 3.1 承認者

- **技術ドキュメント**: 技術リーダー
- **仕様書**: プロダクトオーナー
- **実装ガイド**: シニア開発者
- **リファクタリング**: アーキテクト

#### 3.2 承認基準

- 品質基準を満たしている
- レビュー項目が全てクリアしている
- プロジェクト方針に沿っている
- 実用性が確認されている

## メンテナンス

### 1. 定期更新のルール

#### 1.1 更新頻度

- **仕様書**: 機能変更時
- **実装ガイド**: ライブラリ更新時
- **API 仕様**: API 変更時
- **README**: プロジェクト変更時

#### 1.2 更新チェックリスト

- [ ] 内容の最新性確認
- [ ] リンクの有効性確認
- [ ] コード例の動作確認
- [ ] 関連ドキュメントの整合性確認

### 2. 廃止・アーカイブの手順

#### 2.1 廃止基準

- 機能が削除された
- 技術が古くなった
- 代替手段が確立された
- プロジェクト方針が変更された

#### 2.2 廃止手順

1. **廃止予告**: 1 ヶ月前に通知
2. **代替案提示**: 新しいドキュメントへのリンク
3. **移行期間**: 段階的な廃止
4. **アーカイブ**: `docs/99_archive/`に移動

#### 2.3 アーカイブ構造

```
docs/99_archive/
├── 2024/
│   ├── 01/
│   │   └── old-documentation.md
│   └── 02/
└── README.md
```

### 3. バージョン管理

#### 3.1 バージョニング規則

- **メジャー**: 大幅な変更・新機能追加
- **マイナー**: 機能追加・改善
- **パッチ**: バグ修正・軽微な修正

#### 3.2 バージョン表記

```markdown
## バージョン履歴

### v2.1.0 (2024-01-15)

- 新機能: 検索機能の追加
- 改善: パフォーマンス最適化

### v2.0.0 (2024-01-01)

- 破壊的変更: API 仕様の変更
- 新機能: 認証システムの統合

### v1.2.1 (2023-12-15)

- バグ修正: リンク切れの修正
```

## ツール・自動化

### 1. 推奨ツール

#### 1.1 エディタ

- **VSCode**: 推奨エディタ
- **拡張機能**:
  - Markdown All in One
  - markdownlint
  - Prettier

#### 1.2 リンクチェック

```bash
# リンク切れチェック
npx markdown-link-check docs/**/*.md

# 内部リンクチェック
npx markdown-link-check --config .markdownlinkcheck.json docs/**/*.md
```

#### 1.3 文章チェック

```bash
# 文章品質チェック
npx textlint docs/**/*.md

# スペルチェック
npx cspell "docs/**/*.md"
```

### 2. 自動化スクリプト

#### 2.1 ドキュメント生成

```bash
# API仕様書の自動生成
npm run docs:generate-api

# 型定義の自動生成
npm run docs:generate-types
```

#### 2.2 品質チェック

```bash
# 全ドキュメントの品質チェック
npm run docs:check

# リンクチェック
npm run docs:check-links
```

## ベストプラクティス

### 1. ドキュメント作成

#### 1.1 読み手を意識する

- **初心者**: 前提知識を明記
- **経験者**: 詳細な技術情報
- **管理者**: 意思決定に必要な情報

#### 1.2 構造化する

- 見出しの階層を適切に使用
- 箇条書きで情報を整理
- 表や図で視覚的に表現

#### 1.3 実用的にする

- 動作するコード例を提供
- よくある問題と解決策を記載
- トラブルシューティングを充実

#### 1.4 ドメイン別ドキュメントの作成

- **新規ドメイン作成時**: 必ず 4 つのディレクトリ（specifications, implementation, refactoring, testing）を同時に作成
- **README.md**: ドメインの概要、責任、価値を明確に記載
- **specifications/**: 機能仕様、API 仕様、データ構造を詳細に定義
- **implementation/**: 実装ガイド、使用例、ベストプラクティスを提供
- **refactoring/**: リファクタリング計画、移行ガイドを準備
- **testing/**: テスト戦略、テストケース、テストデータを整備

#### 1.5 Obsidian 特有の記法活用

**内部リンク**:

```markdown
[[ドキュメント名]]
[[ドキュメント名|表示名]]
[[ドキュメント名#見出し]]
```

**タグ**:

```markdown
#stats47 #domain/category #type/specification
```

**バックリンク**:

- 関連ドキュメント間で双方向リンクを活用
- フロントマターの `related` フィールドでも明示的に記載

**エイリアス**:

```yaml
aliases:
  - "カテゴリ管理"
  - "Category Management"
```

**埋め込み**:

```markdown
![[別のドキュメント]]
![[別のドキュメント#特定のセクション]]
```

**グラフビュー活用**:

- タグとリンクを適切に設定することで、Obsidian のグラフビューで関連性を可視化
- ドメイン間の依存関係や関連性を視覚的に把握

### 2. メンテナンス

#### 2.1 定期的な見直し

- 月次でドキュメントの確認
- 四半期で全体の見直し
- 年次でアーカイブの整理

#### 2.2 フィードバックの収集

- 開発者からのフィードバック
- ユーザーからのフィードバック
- 品質改善の提案

### 3. チーム連携

#### 3.1 役割分担

- **作成者**: ドキュメントの作成・更新
- **レビュアー**: 品質の確認・承認
- **メンテナー**: 定期的な見直し・更新

#### 3.2 コミュニケーション

- ドキュメント変更時の通知
- 定期的な品質レビュー
- ベストプラクティスの共有

## トラブルシューティング

### よくある問題

#### 1. リンク切れ

**問題**: 内部リンクが切れている

**解決策**:

```bash
# リンクチェックツールの実行
npx markdown-link-check docs/**/*.md

# 相対パスの確認
# 正: [リンク](../02_domain/category/README.md)
# 誤: [リンク](category/README.md)
```

#### 2. 画像の表示エラー

**問題**: 画像が表示されない

**解決策**:

- パスの確認（相対パスで記述）
- ファイルの存在確認
- ファイル形式の確認（PNG, JPG, SVG 推奨）

#### 3. コード例の動作エラー

**問題**: コード例が動作しない

**解決策**:

- 実際にコードを実行して確認
- 依存関係の明記
- バージョン情報の記載

#### 4. ドキュメントの重複

**問題**: 同じ内容が複数箇所に記載

**解決策**:

- 共通部分は別ドキュメントに分離
- 相互参照リンクの設定
- 定期的な重複チェック

## 参考資料

### 内部ドキュメント

- [プロジェクト概要](../00_project_overview/01_overview.md)
- [コーディング規約](./01_coding_standards.md)
- [コンポーネントガイド](./02_component_guide.md)

### 外部リソース

- [Markdown 記法](https://www.markdownguide.org/)
- [技術文書の書き方](https://developers.google.com/tech-writing)
- [ドキュメント設計のベストプラクティス](https://diataxis.fr/)

### ツール

- [markdownlint](https://github.com/DavidAnson/markdownlint)
- [textlint](https://textlint.github.io/)
- [markdown-link-check](https://github.com/tcort/markdown-link-check)
