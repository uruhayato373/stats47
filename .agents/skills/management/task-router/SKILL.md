---
name: task-router
description: ユーザーの自然言語指示から最適なエージェント・スキルを自動判定して実行する汎用ディスパッチャー
user-invocable: false
---

ユーザーの指示を受け取り、文脈・キーワード・対象から最適なエージェントとスキルを判定して委譲する。「何をしたいか」だけ言えば、適切な担当が動く。

## ルーティングルール

### コンテンツ制作系 → content-orchestrator

| キーワード・文脈 | スキル | 例 |
|---|---|---|
| SNS を今週まわしたい | `/sns-weekly-plan` | 「今週のSNS」「SNS運用まわして」 |
| SNS 投稿を作りたい (X) | `/post-x` → `/publish-x` | 「ランキングのX投稿作って」 |
| SNS 投稿を作りたい (IG) | `/generate-instagram-schedule` / `/post-ig-6angles` | 「Instagram作って」 |
| ブログ記事のネタ探し | `/discover-trends --source all` | 「トレンド調べて」 |
| ブログ記事を書きたい | `/draft-from-trend` | 「記事の企画立てて」 |
| 記事を公開したい | `/publish-article` | 「この記事公開して」 |
| note 記事を作りたい | note-manager に委譲 | 「note書いて」 |
| X/IG に投稿したい | `/publish-x` / `/post-instagram` | 「Xに投稿して」 |
| SNS 競合を調べたい | `/competitor-scan` | 「競合調べて」 |
| 動画/静止画をレンダリング | `/render-sns-stills` (BCR は `/bar-chart-race`) | 「動画レンダリングして」 |

### データ系 → data-ingester / snapshot-exporter / r2-publisher

| キーワード・文脈 | スキル | 例 |
|---|---|---|
| ランキングを登録したい | TS-config 追加 + `/sync-metrics-cache` + `/page-data-batch` | 「出生率のランキング登録して」 |
| e-Stat からデータ取得 | `/search-estat` → `/fetch-estat-data` | 「e-Statで犯罪データ探して」 |
| メトリクスデータ更新 | `/page-data-batch` | 「データ更新して」 |
| スナップショット更新・本番反映 | `/sync-snapshots` | 「データ反映して」「スナップショット更新して」 |
| 相関分析を実行 | `/recompute-correlations` (実装済: build-correlation-snapshot.ts) | 「相関分析やり直して」 |
| R2 にアップロード | `/push-r2` | 「R2にpushして」 |
| AI コンテンツ生成 | `/generate-ai-content` | 「AIコンテンツ作って」 |

### レビュー系 → strategy-advisor（review-router に委譲）

| キーワード・文脈 | スキル | 例 |
|---|---|---|
| レビューして・チェックして | `review-router` で判定 | 「レビューして」 |
| 週次計画・振り返り | `/weekly-plan` / `/weekly-review` | 「今週の計画立てて」 |
| ドキュメント作成・整理・統合・削除 | `/maintain-docs` | 「docsを整理して」「設計書を作成して」 |
| 戦略を考えたい | `/growth-loops` / `/monetization-strategy` | 「収益化について考えて」 |

### 開発系 → devops-runner / code-reviewer

| キーワード・文脈 | スキル | 例 |
|---|---|---|
| テスト実行 | `/run-tests` | 「テスト走らせて」 |
| デプロイ | `/deploy` | 「デプロイして」 |
| コードレビュー | `/review-feature` (`--scope` で対象指定) | 「このコードレビューして」 |

### 分析系 → gsc-analyst / ga4-analyst / performance-auditor / sns-metrics-sync

| キーワード・文脈 | スキル | 例 |
|---|---|---|
| GSC/GA4 データ | `/fetch-gsc-data` / `/fetch-ga4-data` | 「検索データ見せて」 |
| SEO 監査 | `/seo-audit` | 「SEO状況教えて」 |
| Instagram 指標 | `/fetch-instagram-data` | 「Instagramのインプレッション教えて」 |
| パフォーマンス | `/lighthouse-audit` / `/performance-report` | 「サイト速度計測して」 |

### テーマダッシュボード系 → theme-designer / theme-component-builder

| キーワード・文脈 | スキル | 例 |
|---|---|---|
| テーマページを作りたい | theme-designer | 「教育テーマを設計して」 |
| テーマのチャートを追加 | `/design-theme-charts` → `/insert-theme-components` | 「テーマにチャート追加して」 |

## 複合タスクの分解

1つの指示に複数のスキルが必要な場合、依存関係を解析して順序付けする。

例: 「新しいランキングを登録してSNS投稿まで全部やって」
1. data-ingester: TS-config 追加 + `/sync-metrics-cache --apply` + `/page-data-batch --metric <key>`
2. snapshot-exporter + r2-publisher: `/sync-snapshots`
3. SNS: X は `/post-x` → `/publish-x`、IG は `/generate-instagram-schedule`、動画は `/bar-chart-race` (週次は `/sns-weekly-plan`)
4. sns-renderer: `/render-sns-stills`
5. browser-publisher: `/publish-x`, `/publish-tiktok`

## 判断に迷った場合

ユーザーに確認する。カテゴリを提示：

```
何をしたいか確認させてください:
1. コンテンツ制作（ブログ・SNS・note）
2. データ操作（ランキング登録・DB同期・e-Stat取得）
3. レビュー（コード・記事・UI・戦略）
4. 分析（SEO・アクセス・SNS指標）
5. 開発（テスト・デプロイ・パッケージ管理）
6. 戦略（週次計画・収益化・成長ループ）
```
