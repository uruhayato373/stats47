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
| YouTube 通常動画を作りたい・投稿したい | `/publish-youtube-normal` | 「外国人のYouTube動画作って」 |
| SNS 投稿を作りたい | `/generate-all-sns` → `/render-sns-stills` | 「ランキングのSNS作って」 |
| ブログ記事のネタ探し | `/discover-trends-all` | 「トレンド調べて」 |
| ブログ記事を書きたい | `/plan-blog-articles` | 「記事の企画立てて」 |
| 記事を公開したい | `/publish-article` | 「この記事公開して」 |
| note 記事を作りたい | note-manager に委譲 | 「note書いて」 |
| X/TikTok/IG に投稿したい | `/publish-x` / `/publish-tiktok` / `/publish-instagram` | 「Xに投稿して」 |
| キャプション生成 | `/post-sns-captions` | 「キャプション作って」 |
| 動画をレンダリング | `/render-sns-stills` | 「動画レンダリングして」 |

### データ系 → data-pipeline / db-manager

| キーワード・文脈 | スキル | 例 |
|---|---|---|
| ランキングを登録したい | `/register-ranking` | 「出生率のランキング登録して」 |
| e-Stat からデータ取得 | `/search-estat` → `/fetch-estat-data` | 「e-Statで犯罪データ探して」 |
| DB を同期したい | `/pull-remote-d1` / `/sync-remote-d1` | 「DBを最新にして」 |
| 相関分析を実行 | `/run-correlation-batch` | 「相関分析やり直して」 |
| R2 にアップロード | `/push-r2` | 「R2にpushして」 |
| AI コンテンツ生成 | `/generate-ai-content` | 「AIコンテンツ作って」 |

### レビュー系 → strategy-advisor（review-router に委譲）

| キーワード・文脈 | スキル | 例 |
|---|---|---|
| レビューして・チェックして | `review-router` で判定 | 「レビューして」 |
| 週次計画・振り返り | `/weekly-plan` / `/weekly-review` | 「今週の計画立てて」 |
| 戦略を考えたい | `/growth-loops` / `/monetization-strategy` | 「収益化について考えて」 |

### 開発系 → devops-runner / code-reviewer

| キーワード・文脈 | スキル | 例 |
|---|---|---|
| テスト実行 | `/run-tests` | 「テスト走らせて」 |
| デプロイ | `/deploy` | 「デプロイして」 |
| コードレビュー | `/review-packages` / `/review-feature` | 「このコードレビューして」 |

### 分析系 → seo-auditor

| キーワード・文脈 | スキル | 例 |
|---|---|---|
| GSC/GA4 データ | `/fetch-gsc-data` / `/fetch-ga4-data` | 「検索データ見せて」 |
| SEO 監査 | `/seo-audit` | 「SEO状況教えて」 |
| YouTube/Instagram 指標 | `/fetch-youtube-data` / `/fetch-instagram-data` | 「YouTube再生数教えて」 |
| パフォーマンス | `/lighthouse-audit` / `/performance-report` | 「サイト速度計測して」 |

### テーマダッシュボード系 → theme-designer / theme-enhancer

| キーワード・文脈 | スキル | 例 |
|---|---|---|
| テーマページを作りたい | theme-designer | 「教育テーマを設計して」 |
| テーマのチャートを追加 | `/design-theme-charts` → `/insert-theme-components` | 「テーマにチャート追加して」 |

## 複合タスクの分解

1つの指示に複数のスキルが必要な場合、依存関係を解析して順序付けする。

例: 「新しいランキングを登録してSNS投稿まで全部やって」
1. data-pipeline: `/register-ranking`
2. db-manager: `/sync-remote-d1 --key <key>`
3. sns-producer: `/generate-all-sns`
4. sns-renderer: `/render-sns-stills`
5. sns-producer: `/publish-youtube-normal`
6. browser-publisher: `/publish-x`, `/publish-tiktok`

## 判断に迷った場合

ユーザーに確認する。カテゴリを提示：

```
何をしたいか確認させてください:
1. コンテンツ制作（ブログ・SNS・YouTube・note）
2. データ操作（ランキング登録・DB同期・e-Stat取得）
3. レビュー（コード・記事・UI・戦略）
4. 分析（SEO・アクセス・SNS指標）
5. 開発（テスト・デプロイ・パッケージ管理）
6. 戦略（週次計画・収益化・成長ループ）
```
