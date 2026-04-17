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
| 批判的レビュー（意思決定の検証記録） | `docs/03_レビュー/` |
| Management スキルの使い方（NSM・成長ループ・収益化・週次運用） | `.claude/skills/management/README.md` |
| 実装計画・課題・アイデア | `docs/90_課題管理/` |
| 各 feature の設計 | 各 `apps/*/src/features/*/README.md` |
| GSC/GA4 の週次メトリクス snapshot と改善施策記録 | `.claude/skills/analytics/{gsc,ga4}-improvement/reference/` ★週次レビュー時に全件 CSV を git で積む |
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
| ランキング追加→SNS一式 | data-pipeline → db-manager → x-strategist + youtube-strategist |
| トレンド→X投稿 | blog-editor(discover-trends) → x-strategist |
| YouTube動画制作 | youtube-strategist → sns-renderer |
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
- `sns_posts`, `sns_metrics` — SNS 投稿と定点観測（FK 結合の運用データ）
- `correlation_analysis` — 相関分析バッチ結果
- その他、ランキング・テーマダッシュボード・検索が依存するテーブル

### `.claude/` 配下のファイルに置くもの — 「計測・改善の蓄積」

**判定軸**: アプリは読まない。人間とエージェントが時系列で振り返るためのログ・スナップショット・実験状態。

| データ | 保存先 |
|---|---|
| GSC 週次 snapshot (CSV) + 改善ログ | `.claude/skills/analytics/gsc-improvement/reference/` |
| GA4 週次 snapshot (CSV) + 改善ログ | `.claude/skills/analytics/ga4-improvement/reference/` |
| PSI / Lighthouse スコア履歴 | `.claude/skills/analytics/performance-improvement/reference/` |
| PSI 閾値（budgets） | `.claude/skills/analytics/performance-improvement/budgets.json` |
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
