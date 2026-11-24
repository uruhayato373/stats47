# stats47 - 統計で見る都道府県

**共通事業方針**: 企画・収益化・事業の週次/月次計画とレビューの着手前に [共通方針](.claude/shared-policy/POLICY.md) と [このプロジェクトへの適用](.claude/shared-policy/application.json) を読む(管理画面は「戦略・収益化」→「共通事業方針」)。方針内の判断契約を出力へ反映する。`npm run policy:check` で配布状態を確認する。正本はこのリポジトリではなく **Obsidian vault** の `.claude/共通事業方針SSOT.md`。変更は正本側で行い `npm run policy:sync` で配布する。写しは手編集しない。詳細は `.claude/rules/shared-business-policy.md`。

都道府県統計データの可視化 Web アプリケーション。e-Stat API から 47 都道府県の統計を取得し、ランキング・ダッシュボード・チャートで表示する。モノレポ構成: `apps/{web,remotion,ges}` + `packages/*`（詳細は `.claude/rules/local-environment.md`）。

## 行動原則 (12軸)

すべての作業に適用する。上ほど優先度が高い。ユーザーの明示指示があればそちらに従う。

1. **証拠を取ってから判断する** — 不確かな事実は tool / SSOT で解決し、成果を変える前提だけを明示する
2. **シンプル最優先** — 必要最小限のコードで解決する。不要な機能・抽象化を加えない
3. **外科的変更** — 必要な箇所だけ触る。周辺コードを勝手に改善しない
4. **ゴール駆動** — 手順より成功条件を定義し、検証できるまで反復する
5. **モデルは判断時のみ** — ルーティング・リトライ・ステータス処理など決定的なものはコードで処理する
6. **トークン予算を守る** — 一定量を超えそうなら要約して切り替える
7. **混在しない** — 複数パターンが共存する場合、どちらを採用するか明示する
8. **書く前に読む** — 既存 exports・呼び出し元・共通ユーティリティを確認してから書く
9. **テストは意図を検証する** — 「動くか」だけでなく「なぜ必要か」まで検証する
10. **長い作業だけチェックポイントを置く** — 完了・未完了・次の一手を正典へ短く残す
11. **コードベースの規約を優先** — 自分の好みより既存の命名・構成・設計思想に合わせる
12. **失敗を隠さない** — 未検証部分・スキップ箇所は「完了」と言わず明示する

## 運用規約

- **rules は `paths:` 条件付き読み込み**: 常時は `agent-output-contract.md` / `evidence-based-judgment.md` の 2 本のみ (CLAUDE.md 込み 600 行上限・DG070)。新規 rule は必ず `paths:` を付ける。チャット直打ちの git push / R2 push / SNS 投稿は `pre-bash-safety.js` の advisory が要約を返す → `docs-vs-issues.md`「rules の読み込み条件」
- **モデル別 prompt の SSOT**: task capsule・effort・委譲上限は `.claude/rules/model-prompting.md`
- **Agent prompt 冒頭に task capsule + Output Format を指定** → `.claude/rules/agent-output-contract.md`
- **「以前から落ちている」を通過の理由にしない**: 失敗したテスト・検査を「今回の変更と無関係」として素通りさせない。その場で直すか、失敗の出力と再現コマンドを書いたカードを `.claude/todo/backlog.md` に起票してから進む (既にカードがあれば観測日を追記する)。継承か自作かの切り分けは `.claude/rules/branch-workflow.md`「マージ中にゲートが落ちたら」
- **一時ファイルは `/tmp/`**: プロジェクトルートに作らない (pre-commit が `tmp_*` 等を自動削除)
- **作ったら消す・ローカルを正本にしない**: スキル・エージェント・メインとも、作業で作ったファイルは最後に消す。残すものは git・R2・Google Drive (`drive-archive.mjs`) へ移してから消す。`.local/<名前>` の新しい置き場は `config/local-resources.json` に寿命か理由を付けて登録する (`check-local-registry.mjs` が PR で止める) → `.claude/rules/local-environment.md`「ローカルに残さない」
- **レビューをタスクへ変換する**: 批判的レビュー / pre-mortem / 監査の全文を `docs/` に蓄積しない。未完了の対策だけを優先度・実行順・停止条件・完了条件付きで `.claude/todo/` へ統合する。恒久判断は既存の戦略文書・rules・コード近傍READMEへ、定期のレビュー・監査の全文と計測・是正キューの記録は `data/<取得元>/` へ置く (skill の `reference/` は手順・契約・テンプレだけ。`.claude/state/` はエージェント運用の状態だけ。判断は `.claude/rules/data-storage.md`)。Issues は (a) `enhancement`/`bug` ラベルの PR で close される機能改修、(b) `auto-generated` ラベルの機械アラートのみ → `.claude/rules/docs-vs-issues.md`
- **文書作成・整理はガバナンスSSOTに従う**: 新規文書より既存SSOTへの統合を優先する。判断規則は`.claude/rules/docs-vs-issues.md`、機械契約は`.claude/config/docs-governance.json`。文書の作成・移動・削除後は`npm run docs:fix`と`npm run docs:check`を実行する。意味判断を伴う棚卸しは`/maintain-docs`
- **参考文献は private Google Drive で保全し、利用実装仕様書を通して展開する**: 固定ルートは `stats47/参考文献/<資料名>/<版>/` (1 資料 1 版 = 1 directory。PDF・`pages/`・`md/`・`figures/` を展開したまま置き、tar bundle にしない)。folder名は日本語を優先する。ローカルマウントから`$TMPDIR/stats47-source-vault/`へ検証付きで復元し、`npm run source-vault:process`の共通OCR・ページ画像・内部cropを使う。全ページ処理後は`npm run source-vault:inventory`で本文・書籍値を含まない解決台帳を生成し、coverage 100%を確認してからprofile単位で一時領域を削除する。リポジトリ内の`books/`、`docs/books/`、`.claude/pdfs/`は`npm run source-vault:check`で禁止する。資料単位のactiveな利用実装仕様書で権利・一次資料・mapping・gateを定義してから既存SSOTへ反映する → `.claude/rules/reference-source-standards.md`
- **完全 DB レスが正典** → `.claude/rules/data-storage.md` (置き場の正本は機械の台帳 2 つ: git は `npm run check-datasets -- --er`・R2 は `npm run r2:classes`)。永続/常駐 D1 を SSOT に持たない。SSOT は **git の `data/`** と **R2** の二つだけ。本番アプリは R2 snapshot のみ読む:
  - **DB (マスタと台帳)** → **`data/<領域>/` の JSON + Schema が SSOT**。カタログ `config/datasets.mjs` に登録し、関係は ID と `refs` で結ぶ。`config/` はシステムの設定だけ、`packages/`・`apps/` は型・読み込み・検査とアプリだけ (2026-11-10 オーナー決定。守らせるのは `npm run check-datasets` → `.claude/rules/data-storage.md`)。指標の定義だけは型が要るので `data/metrics/<key>.ts`
  - **配信** → DB と R2 の観測値から生成スクリプトで R2 JSON にする（横断整合性はビルド時に検証）。生成物を手で編集しない
  - **Reference** (metrics=TS / articles=article.md / estat_catalog=e-Stat API / prefectures=JSON) → **再生成**
  - **Derived** (area_profiles / correlations) → **エフェメラル計算**（使い捨て `:memory:` SQLite / DuckDB が R2 を読む）→ R2。永続しない
- **永続/リモート D1 は使わない**。S3 creds があれば集計もクラウドで完結する。R2 反映の実装例: `apps/web/scripts/export-page-components-snapshot.ts`
- **観測値・派生を永続 DB に入れない** (DB 肥大で解約に至った経緯があるため R2 に置く)。ローカルの SQLite 層 (旧 `packages/database` の schema・migration と、それを開くスクリプト) は 2026-11-21 に廃止した。正典: `.claude/rules/data-storage.md`
- **Geo分析は結論だけ作らない**: Geo/GIS掛け合わせコンテンツは、計算入力・決定的空間演算・補助レイヤー・県別途中artifact・保存則・最終集計を同じcanonical着地で辿れることを必須とする。X・ブログ・noteもこのlineageへ接続し、単一指標ランキングと混在させない → `.claude/rules/geo-analysis-standards.md`
- **browser-use は終了時に必ず daemon 停止 + Chrome タブクローズ** → `.claude/rules/browser-use-cleanup.md`
- **ログインが要る計測値はブラウザで取りに行かない**: A8・楽天・note・KDP・GSC/GA4/AdSense の画面の数字は、毎週土曜の週次レビューの最初に Mac で取得 (`npm run weekly:collect`) して記録した `data/` から読む。読むための管理画面と読み取りスクリプトは hook が止める (例外はオーナーが会話で頼んだときだけ) → `.claude/rules/recorded-measurement-first.md`
- **main へのマージは本番反映の判断・勝手にしない**: オーナーの明示の指示なしに develop→main の PR を開かず、マージしない (hook が止める)。作業が終わったら `npm run release:status` を報告して止まる。本番に効く変更はまとめて 1 日 1 回、急ぐ障害の修正だけその場で出す。UI/ロジックの反復は localhost (`npm run dev:web`) で確認する。PR が開いている間は develop へ push しない → `.claude/rules/branch-workflow.md`
- **並行エージェント (Codex 等) と SSOT を共有する**: このファイル `CLAUDE.md` が指示の単一ソース。**`AGENTS.md` は `CLAUDE.md` への symlink**（OpenAI Codex は `AGENTS.md` を読む）なので、Codex も Claude も同じ規約 (`.claude/rules/`) に従う。プロジェクト固有の恒常事実は **`.claude/memory/MEMORY.md`**（git 共有）を読む。**Codex を使う経路は 2 つあり、規律が違う**:
  - **① Claude Code から MCP 経由** (`mcp__codex__codex`) — Claude のツールコールとして**同期実行**されるため HEAD/index の奪い合いは構造的に起きない。既定は `sandbox:"read-only"`。規約は **`.claude/rules/codex-mcp.md`**
  - **② standalone Codex** (VSCode 拡張 / `codex` TUI) — 独立プロセス。**⚠️ git 競合注意**: 同一作業ツリーで同時編集すると commit 混在・WIP 混入・型/lock 不整合が起きる（実例: 2026-06-21 に Codex の zod schema 型エラー + package-lock 未更新で CI 2回 fail）。同時に走らせない、または git worktree を分ける
  - **編集開始前に `npm run agent:session -- --status`** で共通の作業状況を確認し、`--register` / 節目の `--note` / 完了時の `--release` を使う。引数と保持条件は `.claude/rules/local-environment.md`「Codex / Claude の作業共有」。
  - どちらの経路でも `git add -A` 厳禁・取り込み後は `npm run type-check` (全パッケージ)。検知補助: `.claude/hooks/session-guard.js`（Claude セッション間のみ）。詳細: memory `feedback_shared_working_copy_git_race`

## 作業の節目で記録する

完了時に以下を更新する。コミットメッセージ・セッション内メモリだけに閉じ込めない (次エージェントは git log と下記ファイルしか見られない)。
検証コマンドの粒度 (変更規模に応じた検査範囲・重複回避・依存関係操作の排他) は `.claude/rules/local-environment.md`「検証コマンドの粒度」が正典。詳細をここに複製しない。

| 種別 | 記録先 |
|---|---|
| 完了前検証 | 変更の規模に応じて選ぶ (`.claude/rules/local-environment.md`「検証コマンドの粒度」)。全体の検査は CI が持つ |
| バグ修正の教訓 | `/knowledge` |
| 同じエラー 2 回目 | `/continuous-learning` でパターン化 |
| **改善施策の TODO 真実源** (status / tier / 期日) | `.claude/todo/improvements.md` |
| 改善施策デプロイ (agent 用詳細) | `data/improvement/{gsc,ga4,adsense,affiliate,sns-metrics,cloudflare-cost,performance}-improvement/improvement-log.md` |
| **月次の重点 1-2 テーマ** (今月どこに張るか・Pro 予算配分) | `.claude/todo/monthly.md` (`/monthly-plan` で月初上書き。週次が分割消化) |
| 週次計画進捗 | `.claude/todo/weekly.md` の TODO チェックボックスを Edit |
| 週次振り返り | `data/reviews/weekly/YYYY-Www.md` |
| 批判的レビュー / 事前検死 | 全文はセッション内で提示。未完了策を `.claude/todo/{improvements,backlog}.md`、恒久判断を既存SSOTへ直接反映 |
| **セッション残タスク** | `.claude/todo/backlog.md` へカード起票 (改善施策のみ improvements.md = improvement-triage 経由。一時ハンドオフ文書は作らない) |
| 未分類の思いつき TODO | `.claude/todo/backlog.md` へカード起票 (迷ったら 🟡・タグは後から todo-curator が付与 → `.claude/rules/todo-standards.md`) |
| コンテンツ backlog | `docs/30_note記事企画/backlog/` |
| 未着手の機能・自動化・指標拡充バックログ | `.claude/todo/backlog.md`（tier 見出し + タグ行のカード形式） |
| 非自明な API 仕様・制約 | `/knowledge` (問題・原因・対策の 3 項目) |
| プロジェクト固有の恒常事実 | auto memory → 正典は **repo 内 `.claude/memory/`**（git で複数 PC・クラウドと共有）。Claude Code のグローバルパス `~/.claude/projects/<hash>/memory/` は `.claude/memory/` への symlink (Windows は junction)。**新しいマシンで clone した直後に `node .claude/scripts/lib/setup-memory-symlink.mjs` を 1 回実行**して張る (`--check` で確認。純 Node なので Windows / Mac 共通) |

## ドキュメント参照ガイド

CLAUDE.md 内に詳細を複製しない。状況に応じて参照する。

### 規約・ルール (`.claude/rules/`)

読み込みは 2 種。**常時** = 起動時に必ず載る (CLAUDE.md 込みで合計 600 行上限・DG070)。**条件付き** = frontmatter `paths:` の対象ファイルを Read したときだけ載る (Write / Bash 直打ちでは載らない)。新規 rule は必ず `paths:` を付ける → `docs-vs-issues.md`「rules の読み込み条件」。
常時は `agent-output-contract.md` (Agent の prompt 設計) と `evidence-based-judgment.md` (判定・仕様主張・原因推定) の 2 本。**全 rule の適用場面と読み込み条件の一覧は `docs-vs-issues.md`「rules の一覧」** (DG072 が一覧と実物の一致を検査する)。

### コアドキュメント

| 知りたいこと | 参照先 |
|---|---|
| docs 全体構成・運用ルール | `docs/INDEX.md` |
| プロジェクト概要・要件 | `docs/00_プロジェクト管理/01_プロジェクト定義.md` |
| ターゲット・ペルソナ | `docs/00_プロジェクト管理/04_ターゲットペルソナ.md` |
| 実装計画 INDEX / 現在地 | `docs/02_実装計画/00_INDEX.md` |
| **収益化戦略 (収益モデル・チャネル・広告配置の SSOT)** ★収益関連の判断時必読 | `docs/00_プロジェクト管理/02_収益化戦略.md` |
| 改善バックログ (TODO 真実源) | `.claude/todo/improvements.md` ★施策追加時必読 |
| システム構成・技術スタック・モノレポ構造 | `docs/01_技術設計/01_システムアーキテクチャ.md` |
| **データの置き場 (完全DBレス・正典)** ★保存先判定時必読 | `.claude/rules/data-storage.md` と台帳の一覧 `npm run check-datasets -- --er` / `npm run r2:classes` |
| ドメイン境界 | `docs/01_技術設計/01_システムアーキテクチャ.md` |
| エラーハンドリング | `docs/01_技術設計/05_エラーハンドリング.md` |
| 自動化インベントリ ★追加・削除時は必ず更新 | `docs/01_技術設計/06_自動化インベントリ.md` |
| URL 構造・301/410・canonical 戦略 ★新規ページ作成時必読 | コード SSOT: `apps/web/src/lib/url-policy.ts` + `config/{blog-redirects,legacy-category-keys,redirect-tag-keys}.ts` + `middleware.ts` / `sitemap.ts`。転送・410 の記録の正本は台帳 `data/site/url-history/` (`config/` の同名 TS はその読み込み口)。機械検証: `src/__tests__/middleware.test.ts` / `.github/scripts/smoke-test-routes.sh`。新規ページ手順は `.claude/rules/coding-standards.md` |
| **情報設計 (ページ責務・3タクソノミー・ファネル役割)** ★page_components配置/分類軸追加/ページKPI判定時必読 | `docs/01_技術設計/03_情報設計.md` |
| **デザインシステム** (横幅/レール/Surface/フォント/ナビ) ★UI実装時必読 | `docs/01_技術設計/04_デザインシステム.md` |
| Playwright 認証プロファイル | `docs/01_技術設計/07_Playwright認証プロファイル.md` |
| 国土数値情報 GIS データ | `.claude/rules/gis-data.md` / `packages/gis/src/mlit-ksj/README.md` |
| 国土交通データプラットフォーム | `.claude/skills/estat/search-mlit-dpf/` (SKILL + `reference/mlit-dpf-catalog.md`・旧 docs/01/05) |
| Pre-commit フック | `.husky/README.md` |
| CI/CD・デプロイ | `.github/workflows/README.md` |
| テスト構成・追加指針 | `apps/web/tests/README.md` |
| 各 feature の設計 | `apps/*/src/features/*/README.md` |
| デザインシステム | `.claude/design-system/README.md` |
| R2 ストレージ操作 | `packages/r2-storage/src/scripts/README.md` |

### スキル・エージェント

| 知りたいこと | 参照先 |
|---|---|
| Management スキル群 | `.claude/skills/management/README.md` |
| 文書作成・整理・陳腐化監査 | `.claude/skills/management/maintain-docs/SKILL.md` (`/maintain-docs`) |
| エージェントチーム構成 (Tier 0/1/2) | `.claude/agents/README.md` |
| Geo分析生成・途中artifact監査 | `.claude/skills/gis/build-geo-analysis/SKILL.md` (`/build-geo-analysis`) |
| Geo企画のサイト・ブログ・X・note一括公開 | `.claude/skills/gis/publish-geo-portfolio/SKILL.md` (`/publish-geo-portfolio`) |
| 画像プロンプトカタログ (43 種) | `.claude/skills/image-prompt/reference/catalog.md` |
| ブログ背景のCodex画像生成 | `.claude/skills/blog/generate-blog-images/SKILL.md` (`/generate-blog-images`) |

### GitHub Issues 運用 (主要ラベル)

Issues は「PR で close される機能改修・バグ」と「機械生成アラート」だけに絞っている (詳細: `.claude/rules/docs-vs-issues.md`)。

- `enhancement` — 機能改修・改善（PR で `Closes #N` で close）
- `bug` — バグ修正（同上）
- `auto-generated` — Bot 生成の自動アラート
- `cloudflare-alert` — Cloudflare 日次 usage 閾値違反 (`cloudflare-usage-daily.yml`)
- `psi-alert` — PSI 週次計測の閾値違反 (`fetch-metrics-weekly.yml` の psi job)
- `ogp-alert` — OGP/カード/note 画像の生成漏れが自動修復後も残存 (`quality-suite-weekly.yml` の ogp-images job)
- `coverage-alert` — GSC カバレッジ是正キューの週次再構築が失敗 (`fetch-metrics-weekly.yml`)
