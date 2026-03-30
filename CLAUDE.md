# stats47 - 統計で見る都道府県

都道府県統計データの可視化 Web アプリケーション。e-Stat API から 47 都道府県の統計を取得し、ランキング・ダッシュボード・チャートで表示する。

## モノレポ構成

```
apps/
  web/       Next.js (Cloudflare Pages) — 公開サイト
  remotion/  Remotion — 動画・OGP・サムネイル生成
  ges/       Google Earth Studio — 47都道府県旋回動画の生成・自動化
packages/
  database/  Drizzle ORM + Cloudflare D1 スキーマ・シード
  types/     共通型定義
  visualization/  D3.js チャートコンポーネント
  components/     shadcn/ui ベース共通 UI
  estat-api/      e-Stat API クライアント
  ranking/        ランキング計算ロジック
  r2-storage/     Cloudflare R2 アクセス
  utils/          汎用ユーティリティ
```

## ドキュメント参照ガイド

状況に応じて以下を参照すること。CLAUDE.md 内に詳細を複製しない。

| 知りたいこと | 参照先 |
|---|---|
| docs 全体の構成・運用ルール | `docs/INDEX.md` |
| プロジェクト概要・要件 | `docs/00_プロジェクト管理/01_概要/` |
| 実装ロードマップ・進捗管理 | `docs/02_実装計画/01_実装ロードマップ.md` |
| システム構成・技術スタック | `docs/01_技術設計/` |
| DDD ドメイン分類 | `docs/01_技術設計/04_DDDドメイン分類.md` |
| 批判的レビュー（意思決定の検証記録） | `docs/03_レビュー/` |
| Management スキルの使い方（NSM・成長ループ・収益化・週次運用） | `.claude/skills/management/README.md` |
| 実装計画・課題・アイデア | `docs/90_課題管理/` |
| 各 feature の設計 | 各 `apps/*/src/features/*/README.md` |
| DB 操作全般（スキーマ・データ変更・シード） | `packages/database/README.md` ★DB操作時は必ず参照 |
| R2 ストレージ・同期 | `packages/r2-storage/src/scripts/README.md` |
| 国土数値情報 GIS データ（データセット一覧・パイプライン・ライセンス） | `docs/01_技術設計/08_国土数値情報GISデータ.md` |
| 国土交通データプラットフォーム（MCP・カタログ一覧・ツール） | `docs/01_技術設計/09_国土交通データプラットフォーム.md` |
| CI/CD・デプロイ | `.github/workflows/README.md` |
| Pre-commit フック | `.husky/README.md` |
| エラーハンドリング規約 | `docs/01_技術設計/05_エラーハンドリング規約.md` |
| テスト構成・追加指針 | `apps/web/tests/README.md` |
| デザインシステム（melta-ui 準拠） | `.claude/design-system/README.md` |
| コーディング標準（TypeScript/React/Next.js） | `.claude/rules/coding-standards.md` |

## エージェントチーム

`.claude/agents/` に定義されたサブエージェント群。Agent tool の `subagent_type` または直接起動で利用する。

### Tier 1: Orchestrator（統括）

| エージェント | 役割 | 委譲先 |
|---|---|---|
| `content-orchestrator` | コンテンツ制作ワークフローの統括 | blog-editor, sns-producer, sns-renderer, note-manager, browser-publisher, data-pipeline |
| `strategy-advisor` | 戦略・PDCA・レビュールーティング | code-reviewer, ui-reviewer, seo-auditor |

### Tier 2: Specialist（専門）

| エージェント | スキル数 | 担当ドメイン |
|---|---|---|
| `theme-designer` | 6 | テーマダッシュボード設計（データ発見→指標選定→IndicatorSet 生成） |
| `theme-enhancer` | 4 | テーマダッシュボード強化（最適化分析→監査→チャート設計→DB投入） |
| `data-pipeline` | 8 | e-Stat API → ランキング登録 → AI コンテンツ |
| `db-manager` | 10 | DB/R2 インフラ（同期・マイグレーション・バックアップ） |
| `blog-editor` | 17 | ブログ記事ライフサイクル（トレンド発見→企画→レビュー→公開） |
| `sns-producer` | 12 | SNS コンテンツ生成（data.json・キャプション・UTM） |
| `sns-renderer` | 9 | Remotion レンダリング・プレビュー |
| `browser-publisher` | 4 | ブラウザ自動投稿（X, TikTok, Instagram, note） |
| `note-manager` | 8 | note.com 記事制作（企画→執筆→編集→チャート） |
| `seo-auditor` | 7 | SEO 監査・アナリティクスデータ収集 |
| `code-reviewer` | 8 | コード品質レビュー（feature, packages, types, tests, security） |
| `ui-reviewer` | 2 | melta-ui 準拠・UI/UX パネルレビュー |
| `devops-runner` | 5 | テスト・デプロイ・Git 操作 |
| `tdd-guide` | 2 | テスト駆動開発ガイド（Red-Green-Refactor・モック戦略） |

### チーム連携パターン

| シナリオ | エージェント連携 |
|---|---|
| ランキング追加→SNS一式 | data-pipeline → db-manager → sns-producer → sns-renderer → browser-publisher |
| トレンド→ブログ記事 | blog-editor → db-manager(/sync-articles) |
| note 記事制作→投稿 | note-manager → browser-publisher |
| 週次 PDCA | strategy-advisor（内部で5並列サブエージェント） |
| コード変更→レビュー→デプロイ | code-reviewer → devops-runner |
| テーマダッシュボード設計 | theme-designer → data-pipeline（未登録指標登録）→ ui-reviewer |
| テーマチャート強化 | theme-enhancer（audit→design→insert）→ ui-reviewer |

## スキル一覧

### theme — テーマ強化

| スキル | 用途 | 定義 |
|---|---|---|
| `/optimize-themes` | テーマダッシュボードの継続最適化（GSC/GA4 + 競合調査 + ギャップ分析 → 優先度付きアクション） | `.claude/skills/theme/optimize-themes/SKILL.md` |
| `/audit-theme-components` | テーマダッシュボードの現状監査（page_components vs IndicatorSet ギャップ分析） | `.claude/skills/theme/audit-theme-components/SKILL.md` |
| `/design-theme-charts` | テーマ用チャート設計（chart_key, componentType, componentProps JSON 生成） | `.claude/skills/theme/design-theme-charts/SKILL.md` |
| `/insert-theme-components` | 設計済みチャートの page_components + assignments への INSERT 実行 | `.claude/skills/theme/insert-theme-components/SKILL.md` |

### db — データベース・ストレージ

| スキル | 用途 | 定義 |
|---|---|---|
| `/sync-remote-d1` | ローカル D1 → リモート D1 同期（`--key` で差分同期対応） | `.claude/skills/db/sync-remote-d1/SKILL.md` |
| `/pull-remote-d1` | リモート D1 → ローカル D1 同期（wrangler export + better-sqlite3） | `.claude/skills/db/pull-remote-d1/SKILL.md` |
| `/diff-d1` | ローカル D1 とリモート D1 のキーベース差分検知・同期 | `.claude/skills/db/diff-d1/SKILL.md` |
| `/sync-articles` | `.local/r2/blog/` の状態を DB に反映（削除済み記事を DB から除去） | `.claude/skills/db/sync-articles/SKILL.md` |
| `/push-r2` | `.local/r2/` 全体をリモート R2 へアップロード | `.claude/skills/db/push-r2/SKILL.md` |
| `/pull-r2` | リモート R2 から `.local/r2/` へダウンロード | `.claude/skills/db/pull-r2/SKILL.md` |
| `/r2-du` | リモート R2 のディレクトリ別容量調査（du 相当） | `.claude/skills/db/r2-du/SKILL.md` |
| `/purge-cache-r2` | R2 キャッシュバケット（stats47-cache）の全オブジェクト削除 | `.claude/skills/db/purge-cache-r2/SKILL.md` |
| `/populate-all-rankings` | 全ランキングの全年度データを DB に一括投入（e-Stat API → ranking_data） | `.claude/skills/db/populate-all-rankings/SKILL.md` |
| `/register-ranking` | 新規ランキングキーを ranking_items に登録し e-Stat API からデータ投入 | `.claude/skills/db/register-ranking/SKILL.md` |
| `/run-correlation-batch` | 相関分析バッチを実行しリモート同期（ローカルに残さない） | `.claude/skills/db/run-correlation-batch/SKILL.md` |
| `/reset-migrations` | Drizzle マイグレーションを1本にリセット（10本超 or 不整合時） | `.claude/skills/db/reset-migrations/SKILL.md` |

### estat — e-Stat API

| スキル | 用途 | 定義 |
|---|---|---|
| `/search-estat` | e-Stat API 統計表検索（statsDataId 特定） | `.claude/skills/estat/search-estat/SKILL.md` |
| `/inspect-estat-meta` | e-Stat API メタデータ調査（カテゴリ・年・地域の構造把握） | `.claude/skills/estat/inspect-estat-meta/SKILL.md` |
| `/fetch-estat-data` | e-Stat API からランキング形式データ取得 | `.claude/skills/estat/fetch-estat-data/SKILL.md` |

### blog — ブログ記事

| スキル | 用途 | 定義 |
|---|---|---|
| `/update-blog-plan` | ブログ記事の企画管理ファイルを最新状態に更新（公開記事数・企画進捗の反映） | `.claude/skills/blog/update-blog-plan/SKILL.md` |
| `/plan-blog-articles` | カテゴリ別ブログ記事企画の自動生成（データインベントリ・トレンド調査・構成案） | `.claude/skills/blog/plan-blog-articles/SKILL.md` |
| `/plan-blog-trends` | トレンド起点のブログ記事企画（トレンド検出→データマッチング→企画生成を一括実行） | `.claude/skills/blog/plan-blog-trends/SKILL.md` |
| `/plan-blog-affiliate` | アフィリエイト収益直結のブログ記事企画（商材×統計データで行動喚起する記事設計） | `.claude/skills/blog/plan-blog-affiliate/SKILL.md` |
| `/discover-trends` | Google Trends からトレンドキーワードを取得し、stats47 の統計データとマッチングしてブログ記事候補を提案 | `.claude/skills/blog/discover-trends/SKILL.md` |
| `/discover-trends-hatena` | はてなブックマーク Hot Entry からトレンドを取得し、stats47 の統計データとマッチング | `.claude/skills/blog/discover-trends-hatena/SKILL.md` |
| `/discover-trends-news` | Google News RSS からニューストレンドを取得し、stats47 の統計データとマッチング | `.claude/skills/blog/discover-trends-news/SKILL.md` |
| `/discover-trends-yahoo` | Yahoo!ニュース トピックス RSS からニューストレンドを取得し、stats47 の統計データとマッチング | `.claude/skills/blog/discover-trends-yahoo/SKILL.md` |
| `/discover-trends-gsc` | Google Search Console の急上昇クエリを検出し、コンテンツギャップからブログ記事候補を提案 | `.claude/skills/blog/discover-trends-gsc/SKILL.md` |
| `/discover-trends-note` | note.com のトレンド記事から話題のテーマを取得し、stats47 の統計データとマッチング | `.claude/skills/blog/discover-trends-note/SKILL.md` |
| `/discover-trends-all` | 全トレンドソースを一括実行し統合レポート生成（クロスソースヒット優先） | `.claude/skills/blog/discover-trends-all/SKILL.md` |
| `/generate-article-charts` | 記事用 JSON データから SVG チャートを生成（折れ線・タイルマップ・散布図等） | `.claude/skills/blog/generate-article-charts/SKILL.md` |
| `/md-syntax` | ブログ記事で使えるマークダウン記法一覧（コールアウト・チャート等） | `.claude/skills/blog/md-syntax/SKILL.md` |
| `/expert-review` | ブログ記事を専門家視点でレビュー（データ正確性・統計的妥当性・誤解リスク） | `.claude/skills/blog/expert-review/SKILL.md` |
| `/panel-review` | ブログ記事企画を10人のパネリストとして評価 | `.claude/skills/blog/panel-review/SKILL.md` |
| `/proofread-article` | ブログ記事の公開前チェック（フロントマター・チャート・データ注記・末尾サイト内リンク） | `.claude/skills/blog/proofread-article/SKILL.md` |
| `/publish-article` | 下書き記事を公開フォルダへコピーし publishedAt を設定（→ `/sync-articles` で DB 反映） | `.claude/skills/blog/publish-article/SKILL.md` |

### content — ランキングページ向けコンテンツ

| スキル | 用途 | 定義 |
|---|---|---|
| `/generate-ai-content` | ランキングページ向け AI コンテンツ（FAQ・分析）を Gemini CLI で生成 → DB 保存 | `.claude/skills/content/generate-ai-content/SKILL.md` |
| `/generate-csv` | ランキングデータ CSV を生成 → ローカル R2 に保存 | `.claude/skills/content/generate-csv/SKILL.md` |

### note — note.com 記事

| スキル | 用途 | 定義 |
|---|---|---|
| `/post-note-ranking` | note ランキング記事（A シリーズ）を DB から自動生成（量産型） | `.claude/skills/note/post-note-ranking/SKILL.md` |
| `/validate-note-idea` | note 記事（B/C/D シリーズ）のアイデアを需要・独自性・信頼性の3軸で検証 | `.claude/skills/note/validate-note-idea/SKILL.md` |
| `/investigate-note-data` | note 記事（B/C/D シリーズ）のデータ調査・分析（相関・地域パターン・チャート候補決定） | `.claude/skills/note/investigate-note-data/SKILL.md` |
| `/design-note-structure` | note 記事の構成設計（B/C/D シリーズ別テンプレート適用・stats47誘導設計） | `.claude/skills/note/design-note-structure/SKILL.md` |
| `/write-note-section` | note 記事を構成に沿って執筆（B/C/D シリーズ対応・一括執筆） | `.claude/skills/note/write-note-section/SKILL.md` |
| `/edit-note-draft` | note 記事の原稿チェック・品質検証・公開準備（必ず別チャットで実行） | `.claude/skills/note/edit-note-draft/SKILL.md` |
| `/generate-note-charts` | note 記事用チャートを SVG 生成→ PNG 変換（棒グラフ・タイルマップ・散布図等） | `.claude/skills/note/generate-note-charts/SKILL.md` |
| `/generate-kakei-charts` | a-kakei 記事用チャート一括生成（大分類比率 + 特徴品目の横棒グラフ） | `.claude/skills/note/generate-kakei-charts/SKILL.md` |
| `/publish-note` | browser-use CLI で note.com エディタを自動操作し下書き保存・予約投稿（テキスト・画像・タグ） | `.claude/skills/note/publish-note/SKILL.md` |

### sns — SNS 投稿

| スキル | 用途 | 定義 |
|---|---|---|
| `/generate-all-sns` | 指定ランキングキーの全 SNS コンテンツ（data.json → キャプション → 動画・画像）を一括生成 | `.claude/skills/sns/generate-all-sns/SKILL.md` |
| `/post-sns-captions` | 全 SNS（Instagram/X/YouTube/TikTok）のキャプションを一括生成 → ローカル保存 | `.claude/skills/sns/post-sns-captions/SKILL.md` |
| `/post-bar-chart-race-captions` | Bar Chart Race 動画の全 SNS キャプションを一括生成 → ローカル保存 | `.claude/skills/sns/post-bar-chart-race-captions/SKILL.md` |
| `/post-x` | X (Twitter) 投稿用テキストを生成 → ローカル保存 | `.claude/skills/sns/post-x/SKILL.md` |
| `/post-instagram` | Instagram 投稿用キャプションを生成 → ローカル保存（画像は `/render-sns-stills` で別途生成） | `.claude/skills/sns/post-instagram/SKILL.md` |
| `/post-youtube` | YouTube 投稿用タイトル・説明を生成 → ローカル保存 | `.claude/skills/sns/post-youtube/SKILL.md` |
| `/post-tiktok` | TikTok 投稿用キャプションを生成 → ローカル保存 | `.claude/skills/sns/post-tiktok/SKILL.md` |
| `/generate-utm-url` | SNS・note 記事の stats47.jp リンクに付与する UTM パラメータ生成ルール | `.claude/skills/sns/generate-utm-url/SKILL.md` |
| `/render-sns-stills` | Remotion で SNS 用静止画・動画を生成 → ローカル保存（Chrome 必須） | `.claude/skills/sns/render-sns-stills/SKILL.md` |
| `/find-quote-rt` | X のバズツイートを browser-use で検索し、stats47 データと照合して引用RT候補を提示 | `.claude/skills/sns/find-quote-rt/SKILL.md` |
| `/publish-x` | browser-use CLI で X の予約投稿を自動設定（テキスト・画像・予約日時） | `.claude/skills/sns/publish-x/SKILL.md` |
| `/publish-tiktok` | browser-use CLI で TikTok Studio の予約投稿を自動設定（動画・キャプション・予約日時） | `.claude/skills/sns/publish-tiktok/SKILL.md` |
| `/publish-instagram` | browser-use CLI で Meta Business Suite から Instagram の予約投稿を自動設定（カルーセル・リール） | `.claude/skills/sns/publish-instagram/SKILL.md` |
| `/mark-sns-posted` | 投稿済み SNS コンテンツの DB ステータス更新 → ローカル・リモート R2 から削除 | `.claude/skills/sns/mark-sns-posted/SKILL.md` |
| `/publish-youtube-normal` | YouTube 通常動画の制作→アップロード→DB記録パイプライン | `.claude/skills/sns/publish-youtube-normal/SKILL.md` |
| `/update-sns-metrics` | browser-use CLI (X/IG/TT) + YouTube API でメトリクスを一括取得 → DB (`sns_metrics`) 蓄積 | `.claude/skills/sns/update-sns-metrics/SKILL.md` |
| `/sns-weekly-report` | DB から週次パフォーマンスレポートを生成 | `.claude/skills/sns/sns-weekly-report/SKILL.md` |
| `/preview-remotion` | 実データで Remotion Studio プレビューデータを上書き（ranking） | `.claude/skills/sns/preview-remotion/SKILL.md` |
| `/generate-bar-chart-race` | D1 → Bar Chart Race 用 config.json + data.json 生成（`.local/r2/sns/bar-chart-race/`） | `.claude/skills/sns/generate-bar-chart-race/SKILL.md` |
| `/generate-compare` | D1 → 2地域比較 data.json 生成（テーマプリセット対応） | `.claude/skills/sns/generate-compare/SKILL.md` |
| `/post-compare-captions` | 2地域比較の全 SNS キャプションを一括生成 → ローカル保存 | `.claude/skills/sns/post-compare-captions/SKILL.md` |
| `/preview-remotion-bar-chart-race` | Bar Chart Race の config.json + data.json → Remotion Studio プレビューを上書き | `.claude/skills/sns/preview-remotion-bar-chart-race/SKILL.md` |
| `/render-bar-chart-race` | Bar Chart Race 動画を一括レンダリング（YouTube/Instagram/TikTok） | `.claude/skills/sns/render-bar-chart-race/SKILL.md` |
| `/preview-remotion-comparison` | 実データで Remotion Studio 比較プレビューを上書き | `.claude/skills/sns/preview-remotion-comparison/SKILL.md` |
| `/preview-remotion-correlation` | 実データで Remotion Studio 相関散布図プレビューを上書き | `.claude/skills/sns/preview-remotion-correlation/SKILL.md` |
| `/preview-remotion-area-profile` | 実データで Remotion Studio 地域プロファイルプレビューを上書き | `.claude/skills/sns/preview-remotion-area-profile/SKILL.md` |
| `/preview-remotion-blog` | 実データで Remotion Studio ブログ OGP プレビューを上書き | `.claude/skills/sns/preview-remotion-blog/SKILL.md` |

### analytics — サイト分析

| スキル | 用途 | 定義 |
|---|---|---|
| `/fetch-gsc-data` | Google Search Console API から検索パフォーマンスデータを取得（クエリ・ページ・デバイス別） | `.claude/skills/analytics/fetch-gsc-data/SKILL.md` |
| `/fetch-ga4-data` | Google Analytics 4 Data API からアクセスデータを取得（PV・流入経路・デバイス別） | `.claude/skills/analytics/fetch-ga4-data/SKILL.md` |
| `/fetch-youtube-data` | YouTube Data API v3 からチャンネル・動画の公開データを取得（再生数・いいね数等） | `.claude/skills/analytics/fetch-youtube-data/SKILL.md` |
| `/fetch-instagram-data` | Instagram Graph API からインサイトデータを取得（リーチ・エンゲージメント・投稿別分析） | `.claude/skills/analytics/fetch-instagram-data/SKILL.md` |
| `/fetch-x-data` | X (Twitter) API v2 からツイートデータを取得（インプレッション・いいね・RT・投稿別分析） | `.claude/skills/analytics/fetch-x-data/SKILL.md` |
| `/seo-audit` | SEO 総合監査（GSC/GA4 実データ + サイト構造 + DB → 優先度付きアクションリスト） | `.claude/skills/analytics/seo-audit/SKILL.md` |
| `/lighthouse-audit` | Lighthouse CLI でパフォーマンス測定（スコア・CWV・リソース → DB 蓄積） | `.claude/skills/analytics/lighthouse-audit/SKILL.md` |
| `/performance-report` | パフォーマンス総合レポート（トレンド・バジェット監査・ページ種別比較・改善提案） | `.claude/skills/analytics/performance-report/SKILL.md` |

### ads — 広告・アフィリエイト

| スキル | 用途 | 定義 |
|---|---|---|
| `/register-affiliate-banner` | A8.net 等のバナー広告を登録（タグベース自動表示 / 記事内手動配置） | `.claude/skills/ads/register-affiliate-banner/SKILL.md` |

### ui — UI/UX レビュー

| スキル | 用途 | 定義 |
|---|---|---|
| `/design-review` | melta-ui デザインシステム準拠レビュー（7カテゴリ走査・重大度判定） | `.claude/skills/ui/design-review/SKILL.md` |
| `/ui-panel-review` | Web ページの UI/UX を 10 人の専門家パネルとして評価（Playwright MCP 連携対応） | `.claude/skills/ui/panel-review/SKILL.md` |

### ranking / management / dev

| スキル | 用途 | 定義 |
|---|---|---|
| `/render-ranking-images` | 全ランキングの OGP・サムネイルを一括生成 → ローカル R2 に保存 | `.claude/skills/ranking/render-ranking-images/SKILL.md` |
| `/knowledge` | 過去の失敗と学びを参照・追記（バグ解決時に実行） | `.claude/skills/management/knowledge/SKILL.md` |
| `/critical-review` | 設計書・計画書に対する批判的レビューを作成（連続起業家・プロPM視点） | `.claude/skills/management/critical-review/SKILL.md` |
| `/pre-mortem` | Pre-Mortem（事前検死）を実施。1年後に完全失敗した想定で具体的シナリオを生成 | `.claude/skills/management/pre-mortem/SKILL.md` |
| `review-router` | 「レビューして」で文脈から適切なレビュースキルを自動選択（自動参照・非ユーザー呼出し） | `.claude/skills/management/review-router/SKILL.md` |
| `/weekly-plan` | 週次計画を生成（並列サブエージェントで収集→戦略分析→批判的レビュー→計画出力） | `.claude/skills/management/weekly-plan/SKILL.md` |
| `/weekly-review` | 週次レビューを生成（実績収集→計画差分分析→成果・課題・学びを記録） | `.claude/skills/management/weekly-review/SKILL.md` |
| `/growth-loops` | 持続的成長ループ（フライホイール）を設計・評価 | `.claude/skills/management/growth-loops/SKILL.md` |
| `/monetization-strategy` | 収益化戦略を 3-5 案ブレインストーム（適合度・リスク・検証実験） | `.claude/skills/management/monetization-strategy/SKILL.md` |
| `/north-star-metric` | North Star Metric と Input Metrics を定義 | `.claude/skills/management/north-star-metric/SKILL.md` |
| `/deploy` | Feature → develop → main マージ＆デプロイ（テスト・型チェック・ビルド付き） | `.claude/skills/dev/deploy/SKILL.md` |
| `/reset-git-history` | Git 履歴リセット（`.git` 肥大化時に実行） | `.claude/skills/dev/reset-git-history/SKILL.md` |
| `/run-tests` | テスト実行（ユニット / E2E / 型チェック） | `.claude/skills/dev/run-tests/SKILL.md` |
| `/review-tests` | コード変更に対応するテストの確認・作成・更新 | `.claude/skills/dev/review-tests/SKILL.md` |
| `/review-packages` | packages/ のコード品質を8人の専門家パネルでレビュー（単体/横断） | `.claude/skills/dev/review-packages/SKILL.md` |
| `/review-types` | プロジェクト全体の型安全性レビュー（tsc エラー修正・any/as 検出・テスト型整合性） | `.claude/skills/dev/review-types/SKILL.md` |
| `/review-ui-consistency` | ページ横断の UI 一貫性レビュー（アイコン・色・コンポーネント・レスポンシブ・状態パターン） | `.claude/skills/dev/review-ui-consistency/SKILL.md` |
| `/review-feature` | features/ の feature ドメインコードを専門家パネルでレビュー（ドメイン固有パネリスト自動追加） | `.claude/skills/dev/review-feature/SKILL.md` |
| `/review-ads` | ads ドメインのコードレビュー（収益最適化・法務・広告計測の専門パネリスト付き） | `.claude/skills/dev/review-ads/SKILL.md` |
| `/review-app` | App Router 層（ルーティング・SEO・メタデータ・エラー境界）を7人の専門家パネルでレビュー | `.claude/skills/dev/review-app/SKILL.md` |
| `create-skill` | スキル作成時の設計ガイド（自動参照・`user-invocable: false`） | `.claude/skills/dev/create-skill/SKILL.md` |
| `/security-review` | セキュリティレビュー（OWASP Top 10 + D1/R2/Cloudflare 固有チェック） | `.claude/skills/dev/security-review/SKILL.md` |
| `/verification-loop` | 6段階品質ゲート（ビルド→型→lint→テスト→セキュリティ→diff） | `.claude/skills/dev/verification-loop/SKILL.md` |
| `/continuous-learning` | セッション中のパターン抽出・learned/ への自動保存 | `.claude/skills/dev/continuous-learning/SKILL.md` |
| `/strategic-compact` | 長時間セッション向けコンテキスト管理ガイド | `.claude/skills/dev/strategic-compact/SKILL.md` |

## ローカル開発環境

- **ローカル D1/R2 は `.local/d1/` に統一。** `wrangler.toml` の `persist_to = "../../.local/d1"` と `next.config.ts` の `initOpenNextCloudflareForDev({ persist: { path: "../../.local/d1" } })` で、`pull:d1` スクリプトと dev server が同じデータを参照する。**`apps/web/.wrangler/state/` は使わない。**
- **ローカル D1**: `.local/d1/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite`（wrangler/miniflare が自動生成する長いハッシュ名）。**`.local/d1/*.sqlite`（ルート直下）は 0 バイトのダミーファイルなので参照しないこと。**
- **ローカル R2**: `.local/r2/` 配下にシードデータ・ランキングデータ・ブログ記事を配置。R2 キャッシュ（e-Stat API レスポンス等）も `.local/d1/v3/r2/` 配下に保存される
- **プロキシ制約**: 企業ネットワークで S3 API が HTTP 407/503 でブロックされる場合あり。`/push-r2` スキルが wrangler CLI フォールバックを案内する
- **新規テーブルの pull**: リモート D1 にあるがローカルにないテーブルは `/pull-remote-d1` でスキップされる。先にリモートの `CREATE TABLE` 文を取得し、ローカルに `better-sqlite3` でテーブルを作成してから pull すること

## 複数 PC での DB 同期ルール

複数 PC で作業する場合、リモート D1 を **single source of truth** とする。

**原則**: 作業開始時に `/pull-remote-d1`、変更後に `/sync-remote-d1`。

### テーブルオーナーシップ

主な更新元を意識し、他 PC で更新されたテーブルを古いデータで上書きしないこと。

| テーブル | 主な更新元 | 備考 |
|---|---|---|
| `ranking_ai_content` | Gemini CLI（自宅PC） | `/generate-ai-content` で一括生成 |
| `ranking_page_cards` | Gemini CLI（自宅PC） | AI コンテンツと同時生成 |
| `articles` | Claude Code（どのPCでも） | `/sync-articles` で R2 から同期 |
| `ranking_items`, `ranking_data` | Claude Code（どのPCでも） | `/register-ranking` で追加 |
| `sns_posts`, `sns_metrics` | Claude Code（どのPCでも） | SNS スキルで更新 |
| `correlation_analysis` | Claude Code（どのPCでも） | 相関分析バッチ |
| その他マスタ系 | 低頻度・どのPCでも | `categories`, `subcategories` 等 |

`/sync-remote-d1` 実行前に、対象テーブルのオーナーシップを確認すること。自分が主管でないテーブルは push しない or `/pull-remote-d1` で最新化してから作業する。

## ブランチ運用ルール

```
feature/* → develop → main（デプロイ）
```

- **main**: 本番デプロイブランチ。develop からのマージのみ。直接コミットしない
- **develop**: 統合ブランチ。feature ブランチからのマージを受け入れる
- **feature/***: 機能ブランチ。develop から分岐し develop にマージ後削除
- デプロイは `/deploy` スキルで実行（develop → main マージ + push）

## 行動原則

以下の 3 原則をすべての作業で適用する。

### 1. 考えてから動く
- 非自明なタスクは実装前にアプローチを 2-3 案比較し、最もシンプルな案を選ぶ
- ハック的修正（TODO付き一時回避策、型を `any` にする等）は禁止。今の知識で一番きれいな解を選ぶ
- 既存パターンの拡張を優先し、新しい抽象化は最終手段。ただし過剰設計も NG

### 2. 検証してから完了
- 変更は必要最小限。無関係なファイルを巻き込まない
- 作業完了前に `/verification-loop` の Phase 1-2（ビルド＋型チェック）を実行する
- 一時的な誤魔化し（テストの skip、エラーの握りつぶし等）は禁止

### 3. ミスから学ぶ
- バグ修正完了時は `/knowledge` で教訓を記録する
- 同じエラーを 2 回解決した場合は `/continuous-learning` でパターン化する
- DB マイグレーション・デプロイ・API 連携の作業開始時は `/knowledge` の関連エントリを確認する

## 作業規約

- **一時ファイルはプロジェクトルートではなく `/tmp/` に作成すること。** やむを得ずルートに作成した場合は作業完了時に必ず削除する。pre-commit フックが `tmp_*`, `*.db` 等を自動削除するが、スキル側でも責任を持つ
- `docs/90_課題管理/` の計画書・手順書は、実装完了後に削除すること（`docs/INDEX.md` のライフサイクルルール）
- **DB データを変更する場合はローカル D1 SQLite を直接操作すること。** リモートへの反映は `/sync-remote-d1` スキルを使用する。
- **ローカル D1 のパスは以下の固定値を使うこと。推測してパスを作らない。**
  ```
  .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite
  ```
  `better-sqlite3` は存在しないパスで `new Database()` すると**空ファイルを自動作成する**ため、パスを間違えると `.local/d1/` にゴミファイルが増殖する。絶対に上記の正しいパス以外で D1 を開かないこと。

## e-Stat API データ取得規約

- **`cdTimeFrom`/`cdTimeTo`（年度範囲指定）を使わない。** 全年度を一括取得し、必要な年度はメモリ上で `yearCode` フィルタする。理由:
  - R2 キャッシュキーが `statsDataId` + `cdCat01` 等で決まるため、年度範囲パラメータの違いでキャッシュが分断され、同じデータが複数キャッシュされる
  - 全年度取得→メモリフィルタの方がキャッシュヒット率が高く、API 呼び出し回数を最小化できる
- **`cdArea`（地域コード指定）を使わない。** 全都道府県を一括取得し、`areaCode` でフィルタする。理由は同上（47都道府県でキャッシュを共有）
- **地域コードは5桁（`01000`〜`47000`）に統一。** 2桁→5桁の正規化は不要な設計とする

## UI コンポーネント規約

- **`@stats47/components` の shadcn ベースコンポーネントを優先使用する。**
  Table / Card / Accordion / Select / Button 等が揃っている。素の HTML 要素（`<table>`, `<select>`, `<button>` 等）で実装せず、まず `packages/components/src/` に該当コンポーネントがないか確認すること。

- **ページ見出し（h1）は `text-2xl font-bold` に統一する。** `text-3xl` 以上は使わない。

- **melta-ui デザインシステム準拠（主要禁止パターン）：**
  詳細は `.claude/design-system/prohibited.md` を参照。以下は特に重要な項目:
  - `text-black` 禁止 → `text-slate-900` or `text-foreground`
  - `shadow-lg` / `shadow-2xl` 禁止 → `shadow-sm`（デフォルト）/ `shadow-md`（hover）
  - `tracking-tight` 禁止 → 日本語の可読性低下のため削除
  - カラーバー（`border-t-4`, `border-l-4` + 色付き）禁止 → 全周 `border` で統一
  - `text-gray-400` を本文に使用禁止 → `text-muted-foreground` or `text-slate-500`
  - カード hover: `hover:shadow-md` まで（`hover:shadow-lg` 禁止）
  - デザインレビュー: `/design-review` スキルで違反チェック可能

- **レスポンシブブレイクポイントの使い分け：**

  | 対象 | 使うべきブレイクポイント | 理由 |
  |---|---|---|
  | ページレイアウト（2カラム/1カラム、サイドバー表示） | `lg:` (ビューポート 1024px) | サイドバーの有無はビューポート依存 |
  | テキスト・ボタンのサイズ調整 | `sm:` / `md:` (ビューポート) | デバイスサイズで決まる |
  | ダッシュボードカードグリッド | `@sm:` / `@md:` / `@lg:` (コンテナクエリ) | 親コンテナ幅が可変（サイドバー有無で変動）のため |

  コンテナクエリのブレイクポイントは `tailwind.config.ts` でカスタム定義（`@sm: 480px`, `@md: 768px`, `@lg: 1024px`）。プラグインのデフォルト値とは異なるので注意。ビューポートブレイクポイントとコンテナクエリの混在は意図的な設計。カードグリッドをビューポートの `md:` に変えるとサイドバーあり画面で幅不足になるため、必ずコンテナクエリを使うこと。

- **ダッシュボードコンポーネント（KPI・チャート等）は `page_components` テーブルで管理する。** コード内にチャート定義をハードコードしない。新規追加は DB への INSERT のみ。詳細は `.claude/design-system/page-components.md` を参照。

## 頻用コマンド

```bash
# 型チェック（ワークスペース別）
npx tsc --noEmit -p apps/web/tsconfig.json
cd apps/remotion && npx tsc --noEmit

# D1 バックアップ（リモート D1 → R2）
npm run backup:d1 --workspace=packages/database -- --env production
```
