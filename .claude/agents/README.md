# エージェントチーム

`.claude/agents/` に定義されたサブエージェント群。Agent tool の `subagent_type` または直接起動で利用する。

**現在54体（READMEを除く実ファイル数）**。ドメイン × フェーズで責務を分け、各agentに
`name` / `description` / `model` / `Output Contract`を必須化している。件数とprompt契約は
`check-agent-skill-consistency.cjs`が機械検査する。

## 設計思想

- **逐次が既定**: 子agentは既定0、必要なら1、独立したfile boundaryがある広い作業でも最大3
- **3 軸の明示**: 各 agent.md は (a) 担当 skills (b) 必読 rules (c) 触る state/snapshots を冒頭に記述
- **モデル振り分け**: Opusは判断密度の高いreview/strategy、Sonnetは明確な実装・運用、Haikuは決定的I/O
- **共通契約を複製しない**: `.claude/rules/model-prompting.md` と
  `.claude/rules/agent-output-contract.md` をSSOTとする

## Tier 0: Dispatcher (1 skill)

`task-router` は agent ファイルではなく **skill** (`.claude/skills/management/task-router/SKILL.md`)。 Claude が内部参照 (`user-invocable: false`) で agent / skill 選択に利用。 全 agent から呼ばれる dispatcher なので Tier 0 として明示する。

## Tier 1: Strategy / Planning (7 体)

| agent | role | 派生元 |
|---|---|---|
| `strategy-advisor` | 週次 PDCA・NSM・批判的 review (knowledge / triage は分離) | 既存縮退 |
| `backlog-processor` 🆕 | `.claude/todo/{05,06,01}` を分類して処理し、**機械ゲートを通ったものだけ**行削除する消化ループの主体。証拠は `.claude/state/backlog-loop/ledger.json` に残り、gate 無しの削除は verify が exit 1 で止める。04 は触らない (improvement-triage の排他 write)。正典 `.claude/rules/backlog-loop.md`、skill `/process-backlog` | 2026-08-17 新設 |
| `backlog-solver-hard` 🆕 | backlog-loop の難物 (impl-large / indicator-expansion / sonnet が失敗した案件) を **1 起動 1 件**で解く。CI の run 本体は sonnet 固定なので、上位モデル (fable) は本 agent への委譲でのみ使う | 2026-08-17 新設 |
| `knowledge-curator` 🆕 | 失敗・学びの記録 + auto memory 整理 | strategy-advisor 分離 |
| `improvement-triage` 🆕 | 改善バックログ整理 + status 更新 (`.claude/todo/04_改善バックログ.md` 排他 append) | strategy-advisor 分離 |
| `blog-seo-strategist` 🆕 | ブログSEO拡充戦略の戦略ハブ (施策 done/todo 台帳 + 型配分 + 四半期再学習)。真実源 `.claude/state/blog/seo-strategy.json`。実行は trend-scout(記事)/ranking-expander(ランキング)/gsc-analyst(KPI)/improvement-triage(effect) に委譲。戦略全文は本 agent §戦略コンテキスト (旧 docs/02 doc 15 を統合し SSOT を .claude に一本化) | 2026-07-12 新設 |
| `theme-portfolio-manager` 🆕 | テーマ群 (22) のポートフォリオ管理ハブ (blog-seo-strategist のテーマ版)。テーマ別 GSC/GA4/データ品質を評価し keep/improve/merge/split/rename/retire を実測根拠つきで判定、実験 baseline/効果測定を台帳管理。真実源 `.claude/state/themes/{portfolio,experiments}.json` (validator: `.claude/scripts/themes/validate-theme-state.mjs`)。実行は theme-researcher(調査)/theme-designer(カタログ設計)/improvement-triage(effect ラベル・排他 writer) に委譲。判定基準の正典 = `.claude/skills/theme/manage-theme-portfolio/reference/theme-taxonomy-reorganization.md`、運用設計 = `.claude/skills/theme/manage-theme-portfolio/reference/テーマポートフォリオ運用.md` | 2026-07-13 新設 |

## Tier 2: Data / Infra

| agent | role | 派生元 |
|---|---|---|
| `estat-researcher` 🆕 | e-Stat / MLIT DPF 探索・メタ確認 (DB には触らない) | data-pipeline 分割 |
| `open-data-curator` 🆕 | e-Stat外の政府・自治体データ源をsource/dataset単位で棚卸しし、取得方式・粒度・GIS・ライセンス・更新性・stats47適合性のgit TSカタログを排他管理。**+ provenance 監査オーナー** (全 metric の出典・再現性を `/audit-provenance` で棚卸し、クラス B/C/D を是正。正典 data-provenance-standards.md)。実取得・投入は既存ownerへ委譲 | 2026-07-18 新設・2026-07-19 provenance 監査追加 |
| `data-ingester` 🆕 | metrics 登録 + stats_* 投入 + 47県カバレッジ検証 (GIS は gis-* に委譲)。**非 e-Stat 投入時は provenance 9点セット必須** (data-provenance-standards.md) | data-pipeline + db-manager 分割 |
| `db-schema-manager` 🆕 | スキーマ・migration・reset 専任 | db-manager 分割 |
| `snapshot-exporter` 🆕 | git TS / R2 source → snapshot / Remotion 派生 JSON 生成 | db-manager 分割 |
| `r2-publisher` 🆕 | R2 push / pull / du 専任 | db-manager 分割 |
| `ranking-publisher` 🆕 | ranking 公開多段 (generate-ranking-items / KNOWN・SITEMAP・INDEXABLE 再生成 / deploy / purge / 本番実測) のオーケストレーション。観測値=data-ingester、push=r2-publisher、deploy=devops-runner に委譲 | 2026-06-21 新設 |
| `ranking-expander` 🆕 | SSDS ランキング拡充ループ (計測ゲート付き需要ファースト): 候補キュレーション + config 生成 (gen-ssds-configs) + キュー状態管理 (build-expansion-queue)。投入=data-ingester、公開=ranking-publisher、計測=gsc-analyst に委譲。skill `/expand-rankings`。旧 expand-indicators 再構築 | 2026-07-12 新設 |
| `gis-curator` 🆕 | KSJ GIS メタ SSOT (datasets.ts / registry.ts) 管理・dataset lifecycle・メタ整合。完全DBレス (git TS=SSOT)。pipeline は gis-pipeline-runner、push は r2-publisher に委譲 | 2026-06-21 新設 (GIS DBレス化) |
| `gis-pipeline-runner` 🆕 | KSJ GIS パイプライン実行 (seed → download → TopoJSON → R2 → build state)。SSOT 編集は gis-curator、push は r2-publisher に委譲 | 2026-06-21 新設 (GIS DBレス化) |
| `survey-curator` 🆕 | ranking↔統計調査の紐付けメタ SSOT (surveys.json / provenance 辞書 / config.surveyId) 管理・監査 (/audit-survey-linkage)・未分類回収 + survey 編集情報 (survey-editorial.ts) + **survey ポートフォリオ管理** (75 survey の需要/在庫/編集品質評価・編集ハブ化の優先順位・実験台帳。真実源 `.claude/state/surveys/{portfolio,experiments}.json`、validator `.claude/scripts/surveys/validate-survey-portfolio.ts`、skill `/manage-survey-portfolio`)。正典 survey-linkage-standards.md + survey-content-standards.md + surveyポートフォリオ運用.md。投入=data-ingester、push=r2-publisher、公開=ranking-publisher、計測=gsc/ga4-analyst、effect=improvement-triage に委譲 | 2026-07-06 新設 → 2026-07-13 ポートフォリオ管理へ拡張 |

## Tier 3: Content - Blog / Note / Ranking (9 体)

| agent | role | 派生元 |
|---|---|---|
| `trend-scout` 🆕 | トレンド発見 (GSC / NotebookLM / 外部ソース) | blog-editor 分割 |
| `blog-editor` | 公開 / 一括公開 / brushup (企画と review は分離) | 既存縮退 |
| `article-writer` | 1 metric → 1 記事 (並列起動量産単位) | 既存 |
| `chart-author` 🆕 | SVG / Remotion チャート生成 (blog / note 共通) | blog-editor + note-manager 分離 |
| `blog-critic` 🆕 | expert review / panel review | blog-editor 分割 |
| `note-manager` | note.com 公開LC / 公開URLトラッキング (完全DBレス: D1 note_articles 廃止、SSOT=R2 `note/<vertical>/<slug>/`。docs/31 は ephemeral outbox。chart は chart-author に委譲) | 既存縮退 |
| `note-critic` 🆕 | note 記事 (A/B/C/D シリーズ) の意味レビュー専任。read-only、verdict を review.md に書き出す。blog-critic の note 版 | 2026-06-22 新設 |
| `ranking-content-author` 🆕 | ranking ページの ai-content (考察/地域傾向/FAQ/県別解説) 生成・是正 + 決定的ゲート (audit-ai-content.mjs)。生成は image-prompt-curator/data-ingester から移管 | 2026-06-21 新設 |
| `ranking-content-critic` 🆕 | ranking ai-content の意味レビュー (重複/読者価値/トーン)。read-only、修正は author に委譲。blog-critic の ranking 版 | 2026-06-21 新設 |

## Tier 4: SNS (primary 4 体 + trend-scout / strategy-advisor が SNS 責務を兼務)

> SNS 実行規約の正典は `.claude/rules/sns-content-standards.md` (チャネル戦略・頻度・雛形・投稿台帳)。
> 現行チャネル: **IG (主力・10K)** / **X (自動化 1-2K)** / **note (衛星)**。TikTok・YouTube は撤退恒久。

| agent | role | 派生元 |
|---|---|---|
| `x-strategist` | X 投稿・キャプション・引用RT・分析 (`/post-x` `/publish-x` `/find-quote-rt` `/react-to-news`) | 既存 |
| `instagram-strategist` | IG 投稿・カルーセル・リール (主力。`/generate-instagram-schedule` `/post-ig-6angles` `/post-instagram`) | 既存 |
| `sns-renderer` | Remotion レンダリング入口 (静止画/動画=`/render-sns-stills`、BCR=`/bar-chart-race --step render`、バズ地図=`/buzz-map`、`/preview-remotion`=プレビュー専用) | 既存縮退 |
| `sns-metrics-sync` | メトリクス同期・posted 印付け・週次レポート (caption 生成は各 strategist に返上) | sns-renderer + 各 strategist 分離 |
| `trend-scout` | SNS 競合の定点観測 (`/competitor-scan`) + X バズ投稿の型・画像リサーチ (`/x-viral-research`) も担当 | 既存拡張 |
| `strategy-advisor` | SNS 週次運用ルーチン (`/sns-weekly-plan`) の orchestrator | 既存拡張 |

## Tier 5: SEO / Analytics / Monetization

| agent | role | 派生元 |
|---|---|---|
| `gsc-analyst` 🆕 | GSC 専任 (fetch + inspect + improvement + indexing) | seo-auditor 分割 |
| `ga4-analyst` 🆕 | GA4 専任 | seo-auditor 分割 |
| `performance-auditor` 🆕 | PSI / Lighthouse / Cloudflare cost | seo-auditor 分割 |
| `adsense-analyst` 🆕 | AdSense 収益計測 + アフィ収益の計測協働 (在庫管理は affiliate-manager に移管) | seo-auditor 分割 + new |
| `affiliate-manager` 🆕 | アフィリエイト一元管理 (SSOT=`affiliate-{ads,direct-placements}-data.ts` 在庫 CRUD / サイズ・プログラム規約 / priority 整合 / compliance 監査 `/audit-affiliate-compliance` / 実験 `/manage-affiliate-experiment` / 集約 state `affiliate-operations-latest.json` / publish 段取り / A8 自動 scout の register 段=SSOT 排他 writer)。計測は adsense/ga4、effect は improvement-triage、A8 ブラウザ操作は asp-scout に委譲。必読 `.claude/rules/affiliate-ads-standards.md` | 2026-06-30 新設 (adsense-analyst 分離)・2026-07-15 運用 SSOT 移行で拡張 |
| `asp-scout` 🆕 | A8.net ブラウザ操作専任 (Playwright: scout/apply/check-approval/harvest)。高単価案件を scoreAndRank→自動申請 (週次上限機械強制)→承認再走査→広告コード取得→parse。判定は決定的コード、意味判断は pending-vertical 解決と UI 変化診断のみ。SSOT 追記・commit/push は affiliate-manager に委譲。skill `/scout-asp`・cron `scout-asp-weekly` (ローカル限定・Mac/Windows 両対応、launchd cron は Mac のみ)。必読 `.claude/rules/affiliate-ads-standards.md` §10 | 2026-07-19 新設 |
| `a8-report-collector` 🆕 | A8 の**成果レポート CSV 収集** (`fetch-a8-ui-csv` → `normalize-a8-csv` → 成果 SSOT `.claude/state/metrics/affiliate/`)。A8 にサイト切替が無いため口座 (mediaId) を assert し、分離はレポート単位 (site-rows のみ stats47 単独と言える)。品質採点は a8-csv-auditor に分離。skill `/a8-report` | 2026-07-28 新設 (doboku-note から移植) |
| `a8-csv-auditor` 🆕 | 収集した A8 CSV の**データ品質だけ**を検査する Evaluator (行数/sha256/encoding/rejects/重複/サイト帰属/共用プログラム/取りこぼし)。audit-only・ネットワーク不可。収集者が自分の成果物を採点しないための分離 | 2026-07-28 新設 (doboku-note から移植) |
| `affiliate-operator` 🆕 | 3 ASP (A8 / もしも / afb) 横断の**提携運用** (状態照合 `affiliate-status` / 申請 `affiliate-apply` dry-run→commit / afb 走査 `afb-scan` / ASP 間比較 / 台帳 `affiliate-catalog.json`)。3 ASP とも stats47 と doboku-note が同一口座に同居するため全操作でサイト帰属 assert (不一致は例外停止)。案件開拓は asp-scout、SSOT 追記は affiliate-manager、成果 CSV は a8-report-collector に委譲。skill `/affiliate-operate`。必読 `.claude/rules/affiliate-ads-standards.md` §11 | 2026-07-28 新設 (doboku-note から移植) |
| `coconala-product-manager` 🆕 | ココナラ商品ファクトリー (`packages/product-factory`) 単一所有。型付きカタログ (テーマ別 13 パック P-01〜P-13・旧 A-01〜L-07 174件を 2026-07-23 に縮約) / ジェネレータ (pptx custGeom地図・xlsx RANK数式・pdf/csv/svg/png) / 生成 (`products:generate --all/--id`) / 検証 (`catalog --check`) / 台帳 (`.claude/state/products/catalog-status.json`) / 出品前チェック (READINESS)。SSOT=git TS 定義 + R2→スナップショット実データ、生成物=`.local` (git管理外)。実データ接続済みパックのみ出品可 (validator が誇大表示を弾く・当面 P-01)。実データ投入=data-ingester、e-Stat 実在=estat-researcher、実機検証=人間、ココナラ出品操作=coconala-operator に委譲。必読 `.claude/rules/coconala-product-standards.md` | 2026-07-18 新設 |
| `coconala-operator` 🆕 | ココナラ出品の**フォーム操作自動化** (Playwright: 新規出品/内容修正/価格反映/下書き掃除)。出品内容 SoT=`.claude/config/coconala-listings.json` を product-factory 商品から 1 商品ずつ書き起こし出品。安全弁=account assert (★dobokunote と別アカウント・別プロファイル `.local/playwright-coconala-profile`) / draft-first + `--commit` gate + オーナー承認。商品生成=coconala-product-manager に委譲。skill `/coconala-publish`・`.claude/scripts/coconala/`。必読 `.claude/rules/coconala-product-standards.md` §6。doboku-note から移植 | 2026-07-23 新設 |
| `kindle-publisher` 🆕 | Kindle 出版ファクトリー (`packages/product-factory` の kindle チャネル) 単一所有。書籍カタログ SSOT=`src/channels/kindle/book-catalog.ts` (S1 論点/S2 テーマ/S3 地域/S4 大全・32 冊) / EPUB3 生成器 `src/generators/epub.ts` (jszip・図表は SVG→PNG 同梱・カバー satori) / 書き下ろし章 `manuscripts/<id>/*.md` (freshFile) / 検証 (`products:kindle:validate`) / 生成 (`--id/--all-manuscript`) / 書き下ろし比率 30% ゲート / 台帳 `.claude/state/products/kindle-status.json`。本文素材=R2 ブログ・ai-content。**PDF は使わず EPUB**。書き下ろし起草=article-writer、意味レビュー=blog-critic、素材=blog-editor、KDP 出品操作=kdp-operator に委譲。必読 `.claude/rules/coconala-product-standards.md` §8 | 2026-07-23 新設 |
| `kdp-operator` 🆕 | Amazon KDP (★**kdp.amazon.co.jp** — .com ではアカウントが見つからない) 出品の**フォーム操作自動化** (Playwright: 下書き作成/内容修正/公開)。出品内容 SoT=`.claude/config/kdp-listings.json` を KINDLE_BOOKS/EPUB から生成し 1 冊ずつ出品。安全弁=account assert (★別アカウント取り違え防止) / ログイン・2FA・税務情報 (Tax interview)・銀行口座は人間工程 (代行しない) / draft-first + `--commit` gate + オーナー承認 / KDP は React SPA で `--probe` 構造 dump→セレクタ調整。書籍生成・カタログ=kindle-publisher に委譲。skill `/kdp-publish`・`.claude/scripts/kdp/`。coconala-operator から移植。必読 `.claude/rules/coconala-product-standards.md` §8 | 2026-07-23 新設 |

## Tier 6: Theme / UI

| agent | role | 派生元 |
|---|---|---|
| `theme-researcher` 🆕 | テーマ指標×チャート候補を白書(NotebookLM)/Web/競合/GSC から調査し provenance 付き提案を 03_指標バックログ へ (read-only)。採択は theme-designer に委譲 | 2026-07-04 新設 |
| `theme-designer` | テーマ → 統合カタログ (ThemeCatalog) 設計 (どの指標を載せるか)。カタログ駆動テーマは `packages/data-configs/src/theme-catalog/` が SSOT | 既存 |
| `theme-component-builder` | page_components 監査・編集 (旧 theme-enhancer)。カタログ駆動テーマは catalog TS の charts[] を編集 | リネーム |
| `theme-ui-manager` 🆕 | テーマページ UI 層の統一・監査・是正 (レイアウト/見出し/セレクタ/カード構成/コピー)。重複セレクタ・古い「地図」コピー等のドリフトを管理 | 2026-06-20 新設 |
| `ranking-ui-manager` 🆕 | ランキングページ (/ranking/*) UI 層の統一・監査・是正 (レイアウト/見出し/パンくず/サイドバー/SEO構造化データ/コピー)。theme-ui-manager の ranking 版。データ=data-ingester、公開=ranking-publisher に委譲 | 2026-06-21 新設 |
| `site-ux-manager` 🆕 | サイト横断 UI/IA の統一・監査・是正 (ヘッダー/ナビ IA・モバイルドロワー・ホーム・ブログ/タグ一覧カード・共通 shell・リンクカード taxonomy・右レール構成・UX 計装配線)。ページ内部は各 page manager、GA4 台帳は ga4-analyst に委譲。site-content-layout ベンチマーク駆動 | 2026-07-20 新設 |
| `chart-component-builder` | shadcn UI + D3.js チャートコンポーネント実装・カタログ管理 (chart-component-standards.md が SSoT)。静的 SVG の chart-author とは別物 (React/D3 実装専任) | 既存 (2026-07-03 Tier 表へ追記・棚卸し漏れ是正) |
| `ui-reviewer` | melta-ui 準拠 + UI panel review | 既存 |
| `image-prompt-curator` 🆕 | 画像prompt SSOT + Codex MCPブログ背景生成 (`/generate-blog-images`) + 画像資産監査 (`/audit-ogp-images`) | sns-renderer + note-manager 分離 |

## Tier 7: Code Quality / DevOps (4 体)

| agent | role | 派生元 |
|---|---|---|
| `code-reviewer` | feature / packages / types / app コード review (UI 一貫性は分離) | 既存縮退 |
| `ui-consistency-reviewer` 🆕 | ページ横断 UI 一貫性 review | code-reviewer `--scope ui-consistency` 分離 |
| `tdd-guide` | TDD 設計・テスト品質 (Red-Green-Refactor) | 既存 |
| `devops-runner` | テスト・デプロイ・Git・CDN 実行 | 既存 |

## 並行衝突回避マトリクス

| 同時起動シナリオ | 各 agent の file boundary |
|---|---|
| `trend-scout` + `gsc-analyst` + `ga4-analyst` | `state/blog/` vs `state/metrics/gsc/` vs `state/metrics/ga4/` |
| `article-writer × 最大3` + `chart-author` | `.local/r2/app/blog/<slug>/` を slug 単位排他、chart-author は `docs/21_ブログ記事原稿/<slug>/` を読むのみ |
| `data-ingester` → `snapshot-exporter` → `r2-publisher` | git TS / API → `.local/r2/app/` → R2 push の一方向。同ranking_keyは逐次 |
| `x-strategist` + `instagram-strategist` | API / state / metrics サブディレクトリが完全分離 |
| `gsc-analyst` + `improvement-triage` | gsc-analyst → `.claude/state/metrics/gsc/` write、triage → `.claude/todo/04_改善バックログ.md` 排他 append |
| `code-reviewer` + 必要な専門reviewer 1体 | 同じdiffの重複reviewはせず、UIまたはtest設計がscopeにある時だけ追加 |
| `ranking-ui-manager` + `ranking-publisher` | `features/ranking/**` (UI) vs `config/*-ranking-keys.ts` + 公開 scripts (publish) で非重複 |
| `ranking-content-author` + `ranking-content-critic` | author=`app/ranking/<key>/ai-content.json` write (key単位) vs critic=read-only。非衝突 |

**禁則**:
- 同じworking treeで複数writerを並行起動しない。並行writerが必要ならfile boundaryに加えてworktreeを分ける
- `.claude/todo/04_改善バックログ.md` への書き込みは `improvement-triage` のみ。analyst 系は `.claude/state/` にしか書かない

## チーム連携パターン (新体制版)

| シナリオ | エージェント連携 |
|---|---|
| ランキング追加 → SNS 一式 | estat-researcher → data-ingester → snapshot-exporter → r2-publisher → ranking-publisher (公開確定) → x/IG-strategist (2 並列) |
| ランキング本番公開 (isActive→200) | ranking-publisher (orchestrator) → data-ingester (観測値確認) → devops-runner (deploy) → /purge-cdn → 本番実測 |
| ランキング UI ドリフト是正 | ranking-ui-manager (監査 → 外科的是正 → localhost 確認、デプロイは ranking-publisher) |
| ranking ai-content 生成 → 公開 | ranking-content-author (生成 → audit-ai-content.mjs) → ranking-content-critic (意味レビュー) → r2-publisher (R2 反映) |
| GSC 中位クエリ → 量産 | gsc-analyst → trend-scout → article-writer (slug分離・最大3) → chart-author → blog-editor (publish) |
| 週次 PDCA | strategy-advisorがsnapshot/scriptを同一セッションで並列収集 → improvement-triage |
| トレンド → ブログ記事 | trend-scout → article-writer (metric→R2直執筆) → chart-author → blog-critic → blog-editor (publish) |
| SNS 週次運用 | strategy-advisor (/sns-weekly-plan) → sns-metrics-sync (先週計測) → trend-scout (題材) → x/instagram-strategist (生成・予約) |
| トレンド → IG リール | trend-scout → sns-renderer (/bar-chart-race --step render) → instagram-strategist |
| バズ地図 → SNS | gis-curator (KSJ geometryType) / data-ingester (e-Stat 観測値) → sns-renderer (/buzz-map 型A〜E 生成+R2) → x/instagram-strategist (配信。draft 止まりが既定) |
| SNS 競合調査 | trend-scout (`/competitor-scan`) → skill reference、未完了策は改善バックログ |
| コード変更 → デプロイ | code-reviewer → scopeにUI/testを含む時だけ対応reviewerを1体追加 → devops-runner |
| テーマダッシュボード設計 | theme-designer → data-ingester → theme-component-builder → ui-reviewer |

## 移行ステータス

**Phase 1-5 完了 (2026-05-28)**: 新 18 agent 追加 → 既存 8 agent 縮退記述 → 136 SKILL.md に `primary_agent` frontmatter 付与 (task-router のみ意図的 skip) → 縮退 agent への primary 参照 28 件を精査し責務に応じて 4 件移動・24 件維持 (Session B) → 並行運用検証 (Session 5-1/5-2/5-3) 実施済。L3-1 統合は Cluster 1 (blog-review) + Cluster 7 (brushup-blog) のみ実装、Cluster 2/3/4/5/6 は KEEP-SKIP 判定 (各 Cluster の責務分離が既に適切なため、形式統合より現状維持が CLAUDE.md 行動原則「シンプル最優先」に整合)。判定詳細: `.claude/todo/04_改善バックログ.md` AGENT-L3-CONSOLIDATE-01。

| 旧 agent | 状態 | 移行先 |
|---|---|---|
| `data-pipeline` | **削除済 (2026-05-28)** | `estat-researcher` + `data-ingester` |
| `db-manager` | **削除済 (2026-05-28)** | `db-schema-manager` + `snapshot-exporter` + `r2-publisher` + `data-ingester` |
| `blog-editor` | 縮退予定 (Phase 3、publish 系のみ保持) | + `trend-scout` + `chart-author` + `blog-critic` (企画は article-writer に統合) |
| `seo-auditor` | **削除済 (2026-07-03)** | `gsc-analyst` + `ga4-analyst` + `performance-auditor` + `adsense-analyst` (skill 参照の差し替え完了) |
| `sns-renderer` | 役割縮退 (render 専任) | `sns-metrics-sync`, `image-prompt-curator` に分離 |
| `theme-enhancer` | **リネーム済** | `theme-component-builder` |
| `code-reviewer` | 役割縮退 (review-feature / security 専任) | `ui-consistency-reviewer` 分離 |
| `note-manager` | 役割縮退 (note.com 専任) | `chart-author` に chart 委譲 |
| `strategy-advisor` | 役割縮退 (NSM / 週次専任) | `knowledge-curator`, `improvement-triage` 分離 |

## 各 agent の詳細

担当 skills / 必読 rules / 触る state / Output Contract / file boundary は各 `.claude/agents/<name>.md` を参照。

新 agent ファイルの構成テンプレ:
- **frontmatter**: `name`, `description`, `model`, `tools`
- **担当範囲**: 役割の詳細記述 (1 段落)
- **担当 skills**: `.claude/skills/<category>/<name>/` の path リスト (表形式)
- **担当外**: 委譲先の agent 名と理由
- **必読 rules**: `.claude/rules/<name>.md` の path リスト
- **触る state**: `.claude/state/` や `docs/` の path リスト
- **Output Contract**: `agent-output-contract.md` に沿った Output Format (Template A/B/C)
- **File Boundary**: 同時並行する agent との書き込み境界

## 旧 README 互換 (Tier 1-3 表記)

過去のドキュメント / commit メッセージ参照のため、旧 Tier 表記との対応:
- 旧 Tier 1 (主力 4 体): x/youtube/instagram-strategist + seo-auditor → 新 Tier 4-5 に分散 (youtube-strategist は 2026-07-27 の YouTube 撤退で廃止)
- 旧 Tier 2 (Specialist 12 体): theme / data / db / blog / sns / note / code / ui / devops / tdd / strategy → 新 Tier 1-7 に分散
- 旧 Tier 3 (Worker 1 体): article-writer → 新 Tier 3 維持
