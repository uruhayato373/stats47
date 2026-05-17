# エージェントチーム

`.claude/agents/` に定義されたサブエージェント群。Agent tool の `subagent_type` または直接起動で利用する。

## Tier 0: Dispatcher（自動振り分け）

| スキル | 役割 |
|---|---|
| `task-router` | ユーザーの自然言語指示から最適なエージェント・スキルを自動判定（`user-invocable: false`、Claude が内部参照） |

## Tier 1: 主力エージェント

| エージェント | スキル数 | 担当 |
|---|---|---|
| `x-strategist` | 6 | X 投稿・分析・パフォーマンス最適化 |
| `youtube-strategist` | 7 | YouTube 企画→制作→公開→分析の全工程 |
| `instagram-strategist` | 7 | Instagram 投稿・分析（Graph API 経由、画像/カルーセル/リール） |
| `seo-auditor` | 5 | サイト SEO・パフォーマンス・検索最適化 |

## Tier 2: Specialist（専門）

| エージェント | スキル数 | 担当ドメイン |
|---|---|---|
| `theme-designer` | 6 | テーマダッシュボード設計（データ発見→指標選定→IndicatorSet 生成） |
| `theme-enhancer` | 4 | テーマダッシュボード強化（最適化分析→監査→チャート設計→DB投入） |
| `data-pipeline` | 8 | e-Stat API → ランキング登録 → AI コンテンツ |
| `db-manager` | 10 | DB/R2 インフラ（同期・マイグレーション・バックアップ） |
| `blog-editor` | 13 | ブログ記事ライフサイクル（トレンド/GSC→企画→レビュー→公開／一括公開） |
| `sns-renderer` | 4 | Remotion レンダリング・プレビュー |
| `note-manager` | 8 | note.com 記事制作（企画→執筆→編集→チャート） |
| `code-reviewer` | 3 | コード品質レビュー（review-feature の `--scope` で feature/app/packages/types/ui-consistency 切替、tests, security） |
| `ui-reviewer` | 2 | melta-ui 準拠・UI/UX パネルレビュー |
| `devops-runner` | 5 | テスト・デプロイ・Git 操作 |
| `tdd-guide` | 2 | テスト駆動開発ガイド（Red-Green-Refactor・モック戦略） |
| `strategy-advisor` | 9 | 週次 PDCA・戦略立案・NSM 実験管理・批判的レビュー |

## Tier 3: Worker（単機能・並列起動向き）

| エージェント | 役割 |
|---|---|
| `article-writer` | 1 metric × 1 記事を完結（並列起動で量産。`Agent(subagent_type="article-writer")` × N） |

## チーム連携パターン

| シナリオ | エージェント連携 |
|---|---|
| ランキング追加→SNS一式 | data-pipeline → db-manager → x-strategist + youtube-strategist + instagram-strategist |
| トレンド→X投稿 | blog-editor(discover-trends) → x-strategist |
| トレンド→Instagram投稿 | blog-editor(discover-trends) → sns-renderer(/render-sns-stills) → instagram-strategist(/push-r2 + /post-instagram) |
| YouTube動画制作 | youtube-strategist → sns-renderer |
| bar-chart-race → リール | sns-renderer(/render-bar-chart-race) → instagram-strategist(/post-instagram --type reels) |
| トレンド→ブログ記事 | blog-editor → db-manager(/sync-articles) |
| **GSC 中位クエリ→量産** | blog-editor(/plan-blog-from-gsc) → article-writer × N 並列 → blog-editor(/publish-bulk-articles) |
| 週次 PDCA | strategy-advisor |
| コード変更→デプロイ | code-reviewer → devops-runner |
| テーマダッシュボード設計 | theme-designer → data-pipeline → ui-reviewer |
