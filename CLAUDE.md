# stats47 - 統計で見る都道府県

都道府県統計データの可視化 Web アプリケーション。e-Stat API から 47 都道府県の統計を取得し、ランキング・ダッシュボード・チャートで表示する。

## エージェント実行モード

Agent tool でサブエージェントを起動する際は `mode: "bypassPermissions"` をデフォルトとする。ユーザーへの確認なしで最後まで処理を完了すること。

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
| プロジェクト概要・要件 | `docs/00_プロジェクト管理/01_プロジェクト定義.md` |
| 実装ロードマップ・進捗管理 | `docs/02_実装計画/01_実装ロードマップ.md` |
| システム構成・技術スタック | `docs/01_技術設計/` |
| DDD ドメイン分類 | `docs/01_技術設計/04_DDDドメイン分類.md` |
| 週次計画・レビュー・批判的レビュー・Pre-Mortem・月次レポート等 | GitHub Issues（ラベル `weekly-plan` / `weekly-review` / `critical-review` / `pre-mortem` / `performance-report` / `youtube-experiment` / `dev-review` / `blog-review` / `sns-weekly-report` / `seo-audit` / `archive`）★過去: `docs/03_レビュー/` は 2026-04-21 に Issues へ全移行して廃止 |
| Management スキルの使い方（NSM・成長ループ・収益化・週次運用） | `.claude/skills/management/README.md` |
| 実装計画・課題・アイデア | **GitHub Issues**（粒度: 記事 1 本・動画企画 1 本 = 1 issue。ラベル: `content/note` `content/youtube-regular` `content/youtube-shorts` `enhancement` 等。過去: `docs/90_課題管理/` は 2026-04 に Issues へ全移行して廃止） |
| 各 feature の設計 | 各 `apps/*/src/features/*/README.md` |
| PSI / GSC / GA4 / AdSense の計測と改善（2026-04-24 以降 GitHub Actions 化） | **[Weekly Metrics] YYYY-Www** Issue に週次集約（ラベル `weekly-metrics` / `auto-generated`）+ 施策 Issue は `{gsc,ga4,adsense,psi}-improvement` ラベルを継続使用。PSI の閾値違反時のみ `[PSI Alert] YYYY-MM-DD` Issue を日次自動起票（`psi-snapshot,auto-generated`）。生データ: `.claude/skills/analytics/{gsc,ga4,adsense}-improvement/reference/snapshots/YYYY-Www/*.csv` + `.claude/state/metrics/{psi,gsc,ga4,adsense}/{history.csv,LATEST.md}`。★過去: 個別 `[GSC/GA4/AdSense Snapshot]` Issue と `{gsc,ga4,adsense}-snapshot` ラベルは 2026-04-24 に `[Weekly Metrics]` へ統合して廃止 |
| Cloudflare 月次コスト・施策の蓄積（計測と改善） | GitHub Issues（ラベル `cost-snapshot` / `cost-improvement`）★請求書到着時に `/cloudflare-cost-improvement invoice`、snapshot と施策は Issue、生データ JSON は `.claude/skills/analytics/cloudflare-cost-improvement/reference/weekly-snapshots/` |
| DB 操作全般（スキーマ・データ変更・シード） | `packages/database/README.md` ★DB操作時は必ず参照 |
| R2 ストレージ・同期 | `packages/r2-storage/src/scripts/README.md` |
| 国土数値情報 GIS データ（データセット一覧・パイプライン・ライセンス） | `docs/01_技術設計/08_国土数値情報GISデータ.md` |
| 国土交通データプラットフォーム（MCP・カタログ一覧・ツール） | `docs/01_技術設計/09_国土交通データプラットフォーム.md` |
| CI/CD・デプロイ | `.github/workflows/README.md` |
| 自動化インベントリ（GitHub Actions / launchd / Claude Routine の全一覧） | `docs/01_技術設計/10_自動化インベントリ.md` ★新規追加・削除時は必ず更新 |
| Pre-commit フック | `.husky/README.md` |
| エラーハンドリング規約 | `docs/01_技術設計/05_エラーハンドリング規約.md` |
| テスト構成・追加指針 | `apps/web/tests/README.md` |
| デザインシステム（melta-ui 準拠） | `.claude/design-system/README.md` |
| コーディング標準（TypeScript/React/Next.js） | `.claude/rules/coding-standards.md` |
| 画像生成 3 方式の使い分け（Satori / Remotion / 外部 AI） | `docs/01_技術設計/ogp_default_design.md` |
| note / X / ブログ hero の画像プロンプトテンプレート（43 種） | `.claude/skills/image-prompt/reference/catalog.md` ★`/image-prompt` で呼び出し |

## エージェントチーム

`.claude/agents/` に定義されたサブエージェント群。Agent tool の `subagent_type` または直接起動で利用する。

### Tier 0: Dispatcher（自動振り分け）

| スキル | 役割 |
|---|---|
| `task-router` | ユーザーの自然言語指示から最適なエージェント・スキルを自動判定（`user-invocable: false`、Claude が内部参照） |

### Tier 1: 主力エージェント

| エージェント | スキル数 | 担当 |
|---|---|---|
| `x-strategist` | 6 | X 投稿・分析・パフォーマンス最適化 |
| `youtube-strategist` | 7 | YouTube 企画→制作→公開→分析の全工程 |
| `instagram-strategist` | 7 | Instagram 投稿・分析（Graph API 経由、画像/カルーセル/リール） |
| `seo-auditor` | 5 | サイト SEO・パフォーマンス・検索最適化 |

### Tier 2: Specialist（専門）

| エージェント | スキル数 | 担当ドメイン |
|---|---|---|
| `theme-designer` | 6 | テーマダッシュボード設計（データ発見→指標選定→IndicatorSet 生成） |
| `theme-enhancer` | 4 | テーマダッシュボード強化（最適化分析→監査→チャート設計→DB投入） |
| `data-pipeline` | 8 | e-Stat API → ランキング登録 → AI コンテンツ |
| `db-manager` | 10 | DB/R2 インフラ（同期・マイグレーション・バックアップ） |
| `blog-editor` | 17 | ブログ記事ライフサイクル（トレンド発見→企画→レビュー→公開） |
| `sns-renderer` | 9 | Remotion レンダリング・プレビュー |
| `note-manager` | 8 | note.com 記事制作（企画→執筆→編集→チャート） |
| `code-reviewer` | 8 | コード品質レビュー（feature, packages, types, tests, security） |
| `ui-reviewer` | 2 | melta-ui 準拠・UI/UX パネルレビュー |
| `devops-runner` | 5 | テスト・デプロイ・Git 操作 |
| `tdd-guide` | 2 | テスト駆動開発ガイド（Red-Green-Refactor・モック戦略） |
| `strategy-advisor` | 9 | 週次 PDCA・戦略立案・NSM 実験管理・批判的レビュー |

### チーム連携パターン

| シナリオ | エージェント連携 |
|---|---|
| ランキング追加→SNS一式 | data-pipeline → db-manager → x-strategist + youtube-strategist + instagram-strategist |
| トレンド→X投稿 | blog-editor(discover-trends) → x-strategist |
| トレンド→Instagram投稿 | blog-editor(discover-trends) → sns-renderer(/render-sns-stills) → instagram-strategist(/push-r2 + /post-instagram) |
| YouTube動画制作 | youtube-strategist → sns-renderer |
| bar-chart-race → リール | sns-renderer(/render-bar-chart-race) → instagram-strategist(/post-instagram --type reels) |
| トレンド→ブログ記事 | blog-editor → db-manager(/sync-articles) |
| 週次 PDCA | strategy-advisor |
| コード変更→デプロイ | code-reviewer → devops-runner |
| テーマダッシュボード設計 | theme-designer → data-pipeline → ui-reviewer |

## スキル一覧

各スキルの詳細は SKILL.md の frontmatter description を参照。`/スキル名` で実行。

### 自動有効（31個）
| カテゴリ | スキル |
|---|---|
| analytics | fetch-gsc-data, fetch-ga4-data, fetch-youtube-data, fetch-x-data, seo-audit, performance-report |
| blog | discover-trends-all, expert-review, panel-review, proofread-article, plan-blog-articles, plan-blog-trends, update-blog-plan, generate-article-charts, md-syntax |
| dev | run-tests, review-tests, verification-loop, continuous-learning, strategic-compact |
| estat | search-estat, inspect-estat-meta, fetch-estat-data |
| management | critical-review, weekly-plan, weekly-review, nsm-experiment |
| note | validate-note-idea, design-note-structure |
| 背景知識 | knowledge, task-router, review-router |

### ユーザー呼出し（88個）
`/deploy`, `/publish-*`, `/generate-*`, `/render-*`, `/post-*`, `/register-*`, `/sync-*`, `/pull-*`, `/push-*` 等。
全スキルの一覧は `.claude/skills/` 配下の各 SKILL.md frontmatter を参照。

## 記録先の統一原則（D1 vs .claude/）

データの性質で保存先を厳格に分ける。**スキル実装・エージェントは以下の分類に従うこと**。

### D1（Cloudflare D1 SQLite）に置くもの — 「運用データ」

**判定軸**: `apps/web` / 投稿スキルが CRUD する、ドメインモデルの主要エンティティ。

- `articles`, `ranking_items`, `ranking_data`, `ranking_ai_content`, `ranking_page_cards` — コンテンツ実体
- `categories`, `subcategories`, `area_profiles` — マスタ
- `sns_posts` — SNS 投稿本体（最新メトリクスの cache カラムも含む。時系列履歴はファイル側）
- `correlation_analysis` — 相関分析バッチ結果
- その他、ランキング・テーマダッシュボード・検索が依存するテーブル

### `.claude/` 配下のファイルに置くもの — 「計測・改善の蓄積」

**判定軸**: アプリは読まない。人間とエージェントが時系列で振り返るためのログ・スナップショット・実験状態。

| データ | 保存先 |
|---|---|
| GSC/GA4/AdSense 週次 snapshot (CSV) + budget 閾値 | `.claude/skills/analytics/{gsc,ga4,adsense}-improvement/reference/`（生 CSV + budgets.json、GitHub Actions が日曜 JST 20:00 に自動更新） |
| GSC/GA4/AdSense/PSI の週次集約履歴（前週比・人間向け LATEST.md） | `.claude/state/metrics/{gsc,ga4,adsense,psi}/{history.csv,LATEST.md}`（GitHub Actions が自動更新、人間は LATEST.md を見れば 10 秒で把握） |
| PSI 日次計測（19 URL × mobile/desktop） | `.claude/state/metrics/psi/psi-batch-*.json`（GitHub Actions 日次 JST 02:00、閾値違反時 `[PSI Alert]` 自動起票）/ URL リスト: `.claude/config/psi-urls.txt` / 閾値: `.claude/skills/analytics/performance-improvement/budgets.json` |
| Cloudflare 月次 snapshot JSON + budget 閾値 | `.claude/skills/analytics/cloudflare-cost-improvement/reference/`（※施策・観測ログは GitHub Issues `cost-*` ラベル側） |
| SNS 投稿メトリクス時系列 | `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv`（書き込み: `.claude/scripts/lib/sns-metrics-store.cjs`） |
| NSM 週次 JSON snapshot | `.claude/skills/management/nsm-experiment/reference/weekly-snapshots/YYYY-Www.json` |
| 実験 state（PDCA） | `.claude/state/experiments.json` |
| RemoteTrigger 記録 | `.claude/state/triggers.json` |

### 新規スキル設計時の判断

- 「アプリが読む or 1 行あたりの FK 結合が本質的か？」 → **YES なら D1**
- 「append-only の時系列ログ／設定／実験記録か？」 → **NO なら `.claude/` 配下のファイル**
- 迷う場合は `.claude/` を優先。D1 は本当に必要な時だけ追加する

### 本原則の根拠

- `.claude/` は git 管理されるため、履歴が自動的に残る（改善サイクルと相性が良い）
- 計測データを D1 に入れるとテーブルが肥大化し、スキーマ変更コストが増える
- エージェントが Read/Write/Grep で扱えるほうが、スキル横断の連携がしやすい

## スキル利用コードの配置原則

**スキル（SKILL.md）から呼ばれるユーティリティ・ヘルパースクリプトは `.claude/` 配下に置く**。`scripts/` 直下には置かない。

### 配置ルール

| 対象 | 置き場所 |
|---|---|
| 複数スキルから共有されるユーティリティ（YouTube / GA4 / GSC 等ドメイン単位） | `.claude/scripts/<domain>/` 例: `.claude/scripts/youtube/`, `.claude/scripts/lib/` |
| 特定スキル専用の長大スクリプト | `.claude/skills/<skill>/scripts/` |
| スキルが参照するデータ・テンプレ（非実行） | `.claude/skills/<skill>/reference/` |
| launchd 等の OS 統合用シェルラッパー | `scripts/scheduled/`（唯一の例外、`.claude/` 外でよい） |
| アプリのビルド・デプロイ用スクリプト | `packages/*/scripts/` or `apps/*/scripts/` |

### `scripts/` 直下に置いてよいもの

- `scripts/scheduled/` のような OS 統合（launchd plist から呼ばれる shell）のみ
- 一時的な作業スクリプトは作らない（`/tmp/` で完結させる）

### 判断フロー

```
スクリプトを新規作成する
  ↓
SKILL.md から `node <path>` で呼ばれる？
  ├─ YES → .claude/scripts/<domain>/ または .claude/skills/<skill>/scripts/
  └─ NO → OS から直接起動される？
          ├─ YES → scripts/scheduled/
          └─ NO → packages/*/scripts/ or /tmp/（使い捨て）
```

### 内部パス解決の注意

`.claude/scripts/<domain>/` に置くスクリプトから project root を参照するときは `__dirname, "..", "..", ".."`（3 階層上）になる。`require("path").resolve(__dirname, "../../..")` を `PROJECT_ROOT` として冒頭で宣言すると保守性が上がる。

## ローカル開発環境

- **ローカル D1/R2 は `.local/d1/` に統一。** `wrangler.toml` の `persist_to = "../../.local/d1"` と `next.config.ts` の `initOpenNextCloudflareForDev({ persist: { path: "../../.local/d1" } })` で、`pull:d1` スクリプトと dev server が同じデータを参照する。**`apps/web/.wrangler/state/` は使わない。**
- **ローカル D1**: `.local/d1/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite`（wrangler/miniflare が自動生成する長いハッシュ名）。**`.local/d1/*.sqlite`（ルート直下）は 0 バイトのダミーファイルなので参照しないこと。**
- **ローカル R2**: `.local/r2/` 配下にシードデータ・ランキングデータ・ブログ記事を配置。R2 キャッシュ（e-Stat API レスポンス等）も `.local/d1/v3/r2/` 配下に保存される
- **プロキシ制約**: 企業ネットワークで S3 API が HTTP 407/503 でブロックされる場合あり。`/push-r2` スキルが wrangler CLI フォールバックを案内する
- **新規テーブルの pull**: リモート D1 にあるがローカルにないテーブルは `/pull-remote-d1` でスキップされる。先にリモートの `CREATE TABLE` 文を取得し、ローカルに `better-sqlite3` でテーブルを作成してから pull すること

## DB 同期フロー

**単一 PC 運用前提**。ローカル D1 が編集元、リモート D1 が本番配信先という一方向の関係。

```
ローカル D1（編集元）──/sync-remote-d1──▶ リモート D1（本番配信）
```

- 作業後は `/sync-remote-d1` でローカル → リモートに push
- 差分確認は `/diff-d1`（変更なしで dry-run 可能）
- **ロールバックは Cloudflare D1 Time Travel** を使う（過去 30 日の任意時点に復元可能、追加設定不要）:
  ```bash
  cd apps/web
  # 現在のブックマークを取得（sync 前に控えておく）
  npx wrangler d1 time-travel info stats47_static --env production
  # ブックマーク指定で復元（精度が高い）
  npx wrangler d1 time-travel restore stats47_static --env production --bookmark <bookmark-id>
  # ブックマークがなければ ISO-8601 タイムスタンプで復元
  npx wrangler d1 time-travel restore stats47_static --env production --timestamp <ISO-8601>
  ```
  R2 への手動バックアップ（`npm run backup:d1`）は sync フローに組み込まない。Time Travel で賄えない CF アカウント障害等の災害復旧が必要な場合にのみ、sync と切り離して実行する。
- `/pull-remote-d1` は routine では実行しない。用途は以下の 3 ケースに限定:
  1. 新規 PC のセットアップ
  2. PC 障害からの復旧
  3. Cloudflare ダッシュボード等でリモートを直接編集した場合の取り込み

  routine な pull はローカルの作業中データを失うリスクがあるため行わない。

## ブランチ運用ルール

```
feature/* ──(PR 必須)──▶ develop ──(直接 merge)──▶ main（デプロイ）
```

- **feature/***: 機能ブランチ。develop から分岐し、**PR 経由でのみ develop にマージ**する。マージ後は削除
- **develop**: 統合ブランチ。feature/* からの PR を受け入れる。**develop 直接 push は禁止**。`gh pr create --base develop` で PR を出し、`.github/workflows/pr-quality-check.yml` の CI が pass してからマージ
- **main**: 本番デプロイブランチ。develop からの直接 merge のみ（Cloudflare Pages トリガー）。直接コミット・push しない
- デプロイは `/deploy` スキルで実行（feature push → PR → develop → main マージ + push → 必要なら `/purge-cdn`）

## 行動原則

以下の 4 原則をすべての作業で適用する。

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

### 4. 記録してから終える
次セッション / 他エージェントが文脈をゼロから再構築しなくて済むよう、作業完了時に以下を更新する。

| 記録対象 | 置き場所 |
|---|---|
| SEO / GSC / GA4 / PSI / SNS-metrics の施策デプロイ | `.claude/skills/analytics/{gsc,ga4,performance,sns-metrics}-improvement/reference/improvement-log.md` に施策 ID 付きで追記 |
| 週次計画の進捗（完了済タスク・残タスク） | `[Weekly Plan] YYYY-Www` Issue の TODO チェックボックスをチェック、または `gh issue comment` で実績を追記 |
| 非自明な API 仕様・制約（誤解の種になる挙動） | `/knowledge` に「問題・原因・対策」3 項目で追記 |
| 本プロジェクト固有の恒常事実（DB パス・採用アーキテクチャ等） | auto memory（`~/.claude/projects/-Users-minamidaisuke-stats47/memory/`） |

**原則**: 作業完了時に 1 セッションで複数の改修・議論が起きた場合、**最重要な判断理由・デプロイ結果・残ブロッカーを必ず上記のいずれかに固定化してから終わる**。コミットメッセージ・セッション内メモリだけに閉じ込めない（次エージェントは git log と上記ファイルしか見られない）。

## 作業規約

- **一時ファイルはプロジェクトルートではなく `/tmp/` に作成すること。** やむを得ずルートに作成した場合は作業完了時に必ず削除する。pre-commit フックが `tmp_*`, `*.db` 等を自動削除するが、スキル側でも責任を持つ
- 計画書・課題・アイデアは **GitHub Issues** に書く。**`docs/90_課題管理/` ディレクトリは廃止**（2026-04 移行）。過去参照がドキュメント内に残っていることがあるが新規作成はしない
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
