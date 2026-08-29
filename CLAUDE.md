# stats47 - 統計で見る都道府県

都道府県統計データの可視化 Web アプリケーション。e-Stat API から 47 都道府県の統計を取得し、ランキング・ダッシュボード・チャートで表示する。モノレポ構成: `apps/{web,remotion,ges}` + `packages/*`（詳細は `.claude/rules/local-environment.md`）。

## 行動原則 (12軸)

すべての作業に適用する。優先順位順。他のいかなる指示より優先する。

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

## 致命的オペレーション規約

- **エージェント実行モード**: Agent tool 起動時は `mode: "bypassPermissions"` をデフォルト
- **モデル別 prompt の SSOT**: task capsule・effort・委譲上限は `.claude/rules/model-prompting.md`
- **Agent prompt 冒頭に task capsule + Output Format を指定** → `.claude/rules/agent-output-contract.md`
- **一時ファイルは `/tmp/`**: プロジェクトルートに作らない (pre-commit が `tmp_*` 等を自動削除)
- **レビューをタスクへ変換する**: 批判的レビュー / pre-mortem / 監査の全文を `docs/` に蓄積しない。未完了の対策だけを優先度・実行順・停止条件・完了条件付きで `.claude/todo/` へ統合する。恒久判断は既存の戦略文書・rules・コード近傍READMEへ、agent用の定期履歴は各skillの `reference/` へ、機械メトリクスは `.claude/state/metrics/` へ置く。Issues は (a) `enhancement`/`bug` ラベルの PR で close される機能改修、(b) `auto-generated` ラベルの機械アラートのみ → `.claude/rules/docs-vs-issues.md`
- **文書作成・整理はガバナンスSSOTに従う**: 新規文書より既存SSOTへの統合を優先する。判断規則は`.claude/rules/docs-vs-issues.md`、機械契約は`.claude/config/docs-governance.json`。文書の作成・移動・削除後は`npm run docs:fix`と`npm run docs:check`を実行する。意味判断を伴う棚卸しは`/maintain-docs`
- **参考文献は private Google Drive で保全し、利用実装仕様書を通して展開する**: 固定ルートは `stats47/参考文献/<資料名>/<版>/`。PDF、OCR、図、画像、文字起こしを完全bundleとして保全し、folder名は日本語を優先する。利用時だけ`$TMPDIR/stats47-source-vault/`へ検証付きで復元し、`npm run source-vault:process`の共通OCR・ページ画像・内部cropを使う。全ページ処理後は`npm run source-vault:inventory`で本文・書籍値を含まない解決台帳を生成し、coverage 100%を確認してからprofile単位で一時領域を削除する。リポジトリ内の`books/`、`docs/books/`、`.claude/pdfs/`は`npm run source-vault:check`で禁止する。資料単位のactiveな利用実装仕様書で権利・一次資料・mapping・gateを定義してから既存SSOTへ反映する → `.claude/rules/reference-source-standards.md`
- **完全 DB レスが正典** → `docs/01_技術設計/02_データアーキテクチャ.md`（doc 18 ハイブリッドは 2026-05-29 同日に superseded）。永続/常駐 D1 を SSOT に持たない。SSOT は **git TS** と **R2** の二つだけ。本番アプリは R2 snapshot のみ読む:
  - **Authored / 設定** (低volume・人手・型/review: テーマのチャート定義等) → **git TS が SSOT** → 生成スクリプトで R2 反映
  - **Authored / 運用** (page_components / theme_metrics / sns_posts / affiliate_ads / categories/themes) → **git TS 定義が SSOT** → 生成スクリプトで R2 JSON（横断整合性はビルド時に検証）。手編集 JSON を SSOT にしない
  - **Reference** (metrics=TS / articles=article.md / estat_catalog=e-Stat API / prefectures=JSON) → **再生成**
  - **Derived** (area_profiles / correlations) → **エフェメラル計算**（使い捨て `:memory:` SQLite / DuckDB が R2 を読む）→ R2。永続しない
- **永続/リモート D1 は廃止**。S3 creds さえあれば集計もクラウドで完結する（旧「集計はローカル限定」制約は消滅）。git TS → R2 反映の実装例: `apps/web/scripts/export-page-components-snapshot.ts`（page_components git TS SSOT `data/page-components/` → R2、Phase E 実装済）
- **観測値・派生を永続 DB に入れない** (R2 のまま。Phase 6 肥大=解約の再発防止)。schema 定義 (`packages/database/src/schema/*.ts`) と integration テスト基盤は「型ソース / テスト用」として残置可（配信 R2 に影響しない）。移行は完了済（正典: `docs/01_技術設計/02_データアーキテクチャ.md`）
- **browser-use は終了時に必ず daemon 停止 + Chrome タブクローズ** → `.claude/rules/browser-use-cleanup.md`
- **デプロイは溜めて1回・勝手にしない**: UI/ロジックの反復ごとに本番デプロイしない（develop→main PR + CI + Cloudflare deploy が毎回 6-8分×2 走りコスト/時間の無駄）。**localhost (`npm run dev:web`) で確認し、まとまりで1回だけデプロイ**。デプロイは (a) ユーザーが明示的に求めたとき、(b) 本番でしか再現しない問題の検証時（例: Cloudflare Workers ランタイム固有の R2/env 問題）のみ。本番反映は outward-facing なので、明示指示が無ければ**実行前に確認する** → `.claude/rules/branch-workflow.md`
- **並行エージェント (Codex 等) と SSOT を共有する**: このファイル `CLAUDE.md` が指示の単一ソース。**`AGENTS.md` は `CLAUDE.md` への symlink**（OpenAI Codex は `AGENTS.md` を読む）なので、Codex も Claude も同じ規約 (`.claude/rules/`) に従う。プロジェクト固有の恒常事実は **`.claude/memory/MEMORY.md`**（git 共有）を読む。**Codex を使う経路は 2 つあり、規律が違う**:
  - **① Claude Code から MCP 経由** (`mcp__codex__codex`) — Claude のツールコールとして**同期実行**されるため HEAD/index の奪い合いは構造的に起きない。既定は `sandbox:"read-only"`。規約は **`.claude/rules/codex-mcp.md`**
  - **② standalone Codex** (VSCode 拡張 / `codex` TUI) — 独立プロセス。**⚠️ git 競合注意**: 同一作業ツリーで同時編集すると commit 混在・WIP 混入・型/lock 不整合が起きる（実例: 2026-06-21 に Codex の zod schema 型エラー + package-lock 未更新で CI 2回 fail）。同時に走らせない、または git worktree を分ける
  - どちらの経路でも `git add -A` 厳禁・取り込み後は `npm run type-check` (全パッケージ)。検知補助: `.claude/hooks/session-guard.js`（Claude セッション間のみ）。詳細: memory `feedback_shared_working_copy_git_race`

## 作業の節目で記録する

完了時に以下を更新する。コミットメッセージ・セッション内メモリだけに閉じ込めない (次エージェントは git log と下記ファイルしか見られない)。

## 検証コマンドの粒度

`apps/web` のフル `build` は重いので、毎回の小変更では実行しない。影響範囲に応じて段階的に検証する。

- 小さな UI / 型 / 単一コンポーネント変更: `npm run type-check --workspace apps/web` を優先
- ロジック変更・変換処理・共通ユーティリティ変更: 対象テスト + type-check
- route / metadata / generateStaticParams / SSG / R2 snapshot 生成・参照に触る変更: 必要に応じて対象ページやスクリプトを限定検証
- フル `npm run build --workspace apps/web`: まとまった変更の節目、SSG/本番配信挙動に関わる変更、リリース前、またはユーザーが明示した場合に実行
- フル build を省略した場合は、最終報告で「何を検証し、何を未実行か」を明示する

| 種別 | 記録先 |
|---|---|
| 完了前検証 | `/verification-loop` (ビルド + 型チェック) |
| バグ修正の教訓 | `/knowledge` |
| 同じエラー 2 回目 | `/continuous-learning` でパターン化 |
| **改善施策の TODO 真実源** (status / tier / 期日) | `.claude/todo/improvements.md` |
| 改善施策デプロイ (agent 用詳細) | `.claude/skills/analytics/{gsc,ga4,adsense,affiliate,sns-metrics,cloudflare-cost,performance}-improvement/reference/improvement-log.md` |
| **月次の重点 1-2 テーマ** (今月どこに張るか・Pro 予算配分) | `.claude/todo/monthly.md` (`/monthly-plan` で月初上書き。週次が分割消化) |
| 週次計画進捗 | `.claude/todo/weekly.md` の TODO チェックボックスを Edit |
| 週次振り返り | `.claude/skills/management/weekly-review/reference/reviews/YYYY-Www.md` |
| 批判的レビュー / 事前検死 | 全文はセッション内で提示。未完了策を `.claude/todo/{improvements,backlog}.md`、恒久判断を既存SSOTへ直接反映 |
| **セッション残タスク** | `.claude/todo/backlog.md` へカード起票 (改善施策のみ improvements.md = improvement-triage 経由。一時ハンドオフ文書は作らない) |
| 未分類の思いつき TODO | `.claude/todo/backlog.md` へカード起票 (迷ったら 🟡・タグは後から todo-curator が付与 → `.claude/rules/todo-standards.md`) |
| コンテンツ backlog | `docs/30_note記事企画/backlog/` |
| 未着手の機能・自動化・指標拡充バックログ | `.claude/todo/backlog.md`（tier 見出し + タグ行のカード形式） |
| 非自明な API 仕様・制約 | `/knowledge` (問題・原因・対策の 3 項目) |
| プロジェクト固有の恒常事実 | auto memory → 正典は **repo 内 `.claude/memory/`**（git で複数 PC・クラウドと共有）。Claude Code のグローバルパス `~/.claude/projects/<hash>/memory/` は `.claude/memory/` への symlink。**新しいマシンで clone した直後に `bash .claude/scripts/setup-memory-symlink.sh` を 1 回実行**して symlink を張る |

## ドキュメント参照ガイド

CLAUDE.md 内に詳細を複製しない。状況に応じて参照する。

### 規約・ルール (`.claude/rules/`)

| ルール | 適用場面 |
|---|---|
| `coding-standards.md` | TypeScript / React / Next.js コード全般 |
| `blog-quality-standards.md` | ブログ記事の新規作成 / brushup (タイトル curiosity gap パターン、CTR 改善基準) |
| `sns-content-standards.md` | SNS 投稿 (X/IG/YouTube pilot/note) の企画・生成・投稿・計測 (チャネル戦略・頻度リミット・投稿雛形・投稿台帳 posts.json・YouTube 通常動画 pilot・TikTok撤退・**統合メディアコンソールとR2素材保持 §5.5** の正典)。**管理コンソールは `npm run admin` → http://127.0.0.1:4747/ (17画面: コンテンツ=/content配下のX・IG・note・Kindle、制作=/sns・/buzz-map、資産=/assets・/svg、調査=/research、収益=/revenue・/ads、品質運用=/dashboard・/quality・/ops・/todo。書き込みはSNS投稿予約とバズ地図素材生成だけで他は読み取り専用。skill `/admin-console`)** |
| `evidence-based-judgment.md` | improvement / 判定系スキル (status: effect/* 更新時必読)。閾値による自動確定の SSOT は `.claude/scripts/lib/effect-verdict/thresholds.mjs` |
| `analytics-event-standards.md` | GA4 計装イベント追加・変更時 (events.ts のパラメータ / GA4 カスタムディメンション登録状況の台帳。効果判定前に登録状況を確認) |
| `ui-components.md` | UI 実装 (shadcn / melta-ui / ブレイクポイント / page_components) |
| `r2-storage-design.md` | snapshot 追加・変更 |
| `gis-data.md` | 国土数値情報 (KSJ) GIS の取り込み・管理 (datasets.ts SSOT / 完全DBレス / gis-curator・gis-pipeline-runner) |
| `estat-api.md` | e-Stat API 利用スキル |
| `unit-semantics-standards.md` | 単位 (円/千円/％/人口10万対/月額年額) の解釈・換算・検証。**単位を扱うコードを書くとき必読** (正典=`packages/data-configs/src/unit/`、鏡=`.claude/scripts/lib/unit-semantics.mjs` は自動生成)。自前のスケール表を書かない |
| `metric-config-standards.md` | metric config 作成・編集 (category 17 軸 / title・subtitle・note・description の役割 / validate:config) |
| `data-provenance-standards.md` | データ出典・再現性 (再現性クラス A/A'/B/C/D / 手動抽出の provenance 9点セット / [provenance]・[calc-ref] lint / 定期監査 /audit-provenance / provenance-audit-weekly cron。非 e-Stat 投入・出典是正時必読) |
| `reference-source-standards.md` | 書籍・PDF・白書等の参考文献を private Google Drive へ保全し、資料単位の利用実装仕様書を通して stats47 へ展開するとき |
| `theme-catalog-standards.md` | テーマページの指標×チャート統合カタログ (ThemeCatalog SSOT / チャート選定文法 / selection provenance / generate:catalog・validate:catalog / theme-researcher・theme-designer) |
| `survey-linkage-standards.md` | ranking↔統計調査の紐付け (surveys.json マスタ / provenance 辞書導出 / config.surveyId オーバーライド / 監査 /audit-survey-linkage / survey-curator) |
| `branch-workflow.md` | PR・デプロイ作業・DB データ反映 |
| `data-storage.md` | スキル設計時 (git TS / R2 vs `.claude/` vs `docs/` 判定。正典は `docs/01_技術設計/02_データアーキテクチャ.md`) |
| `docs-vs-issues.md` | 文書作成・配置・整理・削除とdocs / skill / state / Issuesの使い分け (文書変更時必読) |
| `skill-code-placement.md` | スクリプト新規作成 |
| `local-environment.md` | 環境セットアップ・モノレポ構成・頻用コマンド |
| `model-prompting.md` | Claude Opus 5 / Sonnet 5 / Fable 5 の task capsule・effort・委譲設計 |
| `agent-output-contract.md` | Agent tool 起動時の prompt 設計 |
| `codex-mcp.md` | Claude Code から codex MCP を呼ぶとき (セカンドオピニオン・レビュー・実装委譲) |
| `critic-review-protocol.md` | critic 系 agent のレビュー共通プロトコル (新 critic 作成・review 実行時) |
| `browser-use-cleanup.md` | browser-use を使うスキル |

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
| **データアーキテクチャ (完全DBレス・正典)** ★データ保存先判定時必読 | `docs/01_技術設計/02_データアーキテクチャ.md` |
| ドメイン境界 | `docs/01_技術設計/01_システムアーキテクチャ.md` |
| エラーハンドリング | `docs/01_技術設計/05_エラーハンドリング.md` |
| 自動化インベントリ ★追加・削除時は必ず更新 | `docs/01_技術設計/06_自動化インベントリ.md` |
| URL 構造・301/410・canonical 戦略 ★新規ページ作成時必読 | コード SSOT: `apps/web/src/lib/url-policy.ts` + `config/{blog-redirects,legacy-category-keys,redirect-tag-keys}.ts` + `middleware.ts` / `sitemap.ts`。機械検証: `src/__tests__/middleware.test.ts` / `.github/scripts/smoke-test-routes.sh`。新規ページ手順は `.claude/rules/coding-standards.md` |
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
| DB 操作全般 ★DB操作時は必ず参照 | `packages/database/README.md` |
| R2 ストレージ操作 | `packages/r2-storage/src/scripts/README.md` |

### スキル・エージェント

| 知りたいこと | 参照先 |
|---|---|
| Management スキル群 | `.claude/skills/management/README.md` |
| 文書作成・整理・陳腐化監査 | `.claude/skills/management/maintain-docs/SKILL.md` (`/maintain-docs`) |
| エージェントチーム構成 (Tier 0/1/2) | `.claude/agents/README.md` |
| 画像プロンプトカタログ (43 種) | `.claude/skills/image-prompt/reference/catalog.md` |
| ブログ背景のCodex画像生成 | `.claude/skills/blog/generate-blog-images/SKILL.md` (`/generate-blog-images`) |

### GitHub Issues 運用 (主要ラベル)

Issues は「PR で close される機能改修・バグ」と「機械生成アラート」だけに絞っている (詳細: `.claude/rules/docs-vs-issues.md`)。

- `enhancement` — 機能改修・改善（PR で `Closes #N` で close）
- `bug` — バグ修正（同上）
- `auto-generated` — Bot 生成の自動アラート
- `cloudflare-alert` — Cloudflare 日次 usage 閾値違反 (`cloudflare-usage-daily.yml`)
- `psi-alert` — PSI 日次計測の閾値違反 (`psi-audit-daily.yml`)
- `ogp-alert` — OGP/カード/note 画像の生成漏れが自動修復後も残存 (`ogp-image-audit-weekly.yml`)
- `link-alert` — サイト内リンクのリンク切れ (ブログ本文 + ページ側コンポーネント生成) (`internal-link-audit-weekly.yml`)
- `coverage-alert` — GSC カバレッジ是正キューの週次再構築が失敗 (`fetch-metrics-weekly.yml`)

過去の移行履歴:
- `docs/90_課題管理/` (2026-04 廃止) → GitHub Issues 経由 → `docs/50_Issues/` (2026-05) → `docs/02_実装計画/{feature-backlog,indicator-backlog}.md` (2026-06-07 統合)
- レビュー保存ディレクトリは 2026-07-30 に廃止。批判的レビュー / pre-mortem は未完了策を `.claude/todo/`、恒久判断を既存SSOT、再生成可能な履歴をskill referenceへ直接反映する
- `weekly-plan` / `weekly-review` / `critical-review` / `pre-mortem` / `*-improvement` 系ラベル (2026-05 廃止) → `.claude/todo/` / `.claude/skills/management/weekly-review/reference/reviews/` / 各strategy・rules・skill reference
- `docs/05_改善ログ/` (2026-06 廃止) → `.claude/todo/improvements.md` (pending 移行) + `.claude/skills/analytics/*/reference/improvement-log.md` (詳細ログ)
