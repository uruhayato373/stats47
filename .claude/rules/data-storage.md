---
paths:
  - "data/**"
  - "assets/**"
  - "config/**"
  - ".claude/{skills,state,todo,config}/**"
  - "docs/**"
  - "apps/web/scripts/export-*.ts"
  - ".claude/agents/**"
---
# 記録先の統一原則 (git TS + R2 vs `.claude/` vs `docs/`)

> **⚠️ 2026-05-29 更新: データ層は「完全DBレス」が正典 → [`docs/01_技術設計/02_データアーキテクチャ.md`](../../docs/01_技術設計/02_データアーキテクチャ.md)。**
> 永続/リモート D1 を SSOT に持たない。アプリが読むデータの SSOT は形で選ぶ: **設定/運用エンティティ=git TS** /
> **観測値=R2** / **配信=R2 snapshot** / **Derived(集計)=エフェメラル計算 → R2**。
> `.claude/` と `docs/` の使い分け（本ファイルの主眼）は不変。

データの性質で保存先を厳格に分ける。**スキル実装・エージェントは以下の分類に従うこと**。

判定軸: (a) 誰が読むか (app / agent / 人間)、(b) 何のために (CRUD / 振り返り / 計測ログ)。

**note画像の運用台帳は例外として `data/note/` のgit管理JSON + JSON Schemaを採用する
(2026-10-02 オーナー決定)。** 生成版・採用版・公開版と共有ストレージの所在を一元管理する。
記事メタTSや監査履歴と二重に書かず、専用validatorとwriter/readerの切替を一組で実装する。
詳細と移行状況は [note-image-assets.md](note-image-assets.md)。画像バイナリは台帳へ埋め込まない。

**テーマの指標・チャート定義 (ThemeCatalog) も例外として `data/themes/catalogs/<key>.json` のgit管理JSON + JSON Schema
を正本とする (2026-10-06 オーナー決定)。** アプリは `@stats47/data-configs` 経由でこの JSON を読む。
規約は [theme-catalog-standards.md](theme-catalog-standards.md) §1。

## git で管理するファイルの置き場 (2026-10-06 確定)

ページ・タグIDと回遊契約も例外として `data/content/{routes,tags,navigation}.json` + JSON Schemaを正本にする
（2026-10-08 オーナー指示）。`entities.json` と `pages/*.json` は既存の定義とR2記事からの分割生成物で、手編集しない。
全ルートのID網羅と参照整合は `npm run content:check`。観測値・本文・Geo途中artifactは従来の正本に残す。

`.claude/` はエージェント運用の置き場で、事業の台帳・記録・素材を置かない。git で管理するファイルは次の 6 つに分ける
(`config/`・`data/` は doboku-note と同じ区分)。アプリが読む配信データは従来どおり git TS → R2 で、これとは別である。

| 置き場 | 置くもの | 判断の目安 |
|---|---|---|
| `config/` | 事業の台帳と設定。人またはオペレーター用スクリプトが判断して変える値 | 出品台帳とアカウント、ASP の接続設定、管理画面の領域 (`domains.json`)、PSI の計測対象、端末資源、参考文献 vault、note の承認済みハッシュタグ (`note-hashtags/`)、ココナラのプロフィール文面と画像 (`coconala/assets/`) |
| `data/<取得元>/` | 事業の記録 — 計測の生データと集約、追記で増える台帳、改善ログ、レビュー、監査・是正のキューと最新の検査結果 | エージェントの運用をやめても事業として見返すもの。取得元・対象ごとに 1 ディレクトリ (下の表)。CI が書き戻すのもここ |
| `assets/<用途>/` | 画像などの素材の原本 — 生成の入力・出力の原本と、その生成の説明・マニフェスト | ブログ・OGP の背景、特産品イラスト、ヒーロー画像の原本、note の背景・見出し・表紙、バナー |
| `contents/<媒体>/` | 公開待ちの原稿 (outbox)。公開すると CI が消し、公開した記事の正本は R2 に置く | ブログ記事の原稿と図のデータ (`contents/blog/<slug>/`。2026-10-08 に `docs/` から移した。note の原稿は `docs/31_note記事原稿/` のまま) |
| `.claude/state/` | エージェント運用の状態だけ (下の「`.claude/state/` に置いてよいもの」の許可リスト) | エージェントの運用をやめたら不要になるもの。バックログ自動処理の台帳、整合性監査の印、Claude のトークン実績・モデル使用量・プロンプト評価、RemoteTrigger の記録 |
| `.claude/config/` | 品質ゲートの基準・許可リスト・閾値、エージェント運用の方針 | `*-baseline.json`、`quality-gates.json`、計測値の警告閾値 (`budgets/<施策>/`) |

`data/` の中は取得元・対象で分ける (2026-10-06 に `.claude/state/` の計測・記録・キュー・監査の結果と、
各分析スキルの `reference/` から移した)。

| ディレクトリ | 中身 |
|---|---|
| `data/gsc/` `data/ga4/` `data/psi/` `data/cloudflare/` `data/adsense/` | 各取得元の週次生 CSV (`snapshots/<週>/`)・集約 (`history*.csv`)・要約 (`LATEST.md`)。GSC はカバレッジ是正キュー (`coverage-remediation/`) と運用サイクルの監査も持つ。AdSense は 2026-09-20 停止後の凍結記録 |
| `data/affiliate/` | A8・もしも・楽天の成果、提携台帳、アフィリエイト実験の台帳と推移、GA4 のアフィリエイト実測、在庫・compliance の監査結果 |
| `data/sns/` `data/note/` `data/products/` | 投稿台帳 (`posts.json`)・投稿の指標・Instagram の予約表と二重投稿防止ログ、note のダッシュボード指標・カバー台帳・下書き索引・運用の証跡 (`evidence/`)、商品の販売台帳・受領記録と生成・販売準備の状態 |
| `data/measurement-cycle/` `data/authenticated/` `data/nsm/` | 週次の計測→記録→改善のまとめ、認証付き CI の売上計測、週次収益 (NSM) |
| `data/improvement/<施策>/` `data/effect-verdict/` `data/business/` | 改善施策の詳細ログ、効果判定、実験 (PDCA) の台帳 |
| `data/reviews/{weekly,monthly}/` | 週次・月次レビュー |
| `data/seo/` `data/search-growth/` `data/blog/` `data/ai-content/` `data/ai-content-staging/` | キーワード改善サイクル、検索成長の候補と計測、ブログの監査・是正キューと推移、AI 解説の推移と是正キュー (`remediation/`)、AI 解説の公開待ち |
| `data/ranking/` `data/provenance/` `data/page-quality/` `data/site/` `data/ogp/` | ランキングの整合監査、出典の是正キュー、ページ品質の週次監査 (`metrics/`) と UI 指摘キュー、サイト内リンク監査、OGP 画像の在庫 |
| `data/estat/` `data/data-quality/` `data/surveys/` `data/themes/` `data/geo/` `data/municipalities/` `data/source-inventory/` | e-Stat の探索結果と年カバレッジ監査 (`year-coverage/`)、データ品質の検査、調査・テーマ・Geo のポートフォリオと監査 (テーマはアプリが読む指標・チャート定義 `catalogs/<key>.json` + JSON Schema も持つ。上の例外)、市区町村の拡充調査、参考文献の解決台帳 |
| `data/ci/` `data/releases/` `data/content-operations/` | workflow の健全性・R2 の鮮度・月次ジョブ、リリースの検証証跡、コンテンツ公開の運用記録 |
| `data/business-plan/` `data/goals/` | 事業計画の状態と KPI ツリー、目標の進捗 |

### `.claude/state/` に置いてよいもの (許可リスト)

判断の基準は「**エージェントの運用をやめたら不要になるか**」。是正キューや監査の結果は、エージェントが作って読むものでも、
エージェントをやめたあとも事業として見返すので `data/` に置く (2026-10-06 オーナー決定)。

| データ | 置き場 | 台帳 id |
|---|---|---|
| バックログ自動処理の実行台帳 (completion gate の証拠) | `.claude/state/backlog-loop/ledger.json` | `agent.backlog-loop` |
| 整合性監査の印 (Stop hook が読む) | `.claude/state/consistency/audited.json` | `agent.consistency` |
| RemoteTrigger の記録 | `.claude/state/triggers.json` | `agent.triggers` |
| obsidian の mail-triage がメールから拾ったイベントの受信箱 (書き手と置き場はリポ外の cron が決める) | `.claude/state/inbox/mail-events.json` | `agent.mail-inbox` |
| Claude routine のトークン実績・モデル使用量と canary・プロンプト評価 | `.claude/state/metrics/{claude-usage,model-usage,prompt-evals}/` | `claude.*` |
| (git 管理外) セッションロック・実行間隔の記録 | `.claude/state/{session-locks,cadence}/` | — |

許可リストの正本は台帳 `config/datasets.mjs` の `AGENT_STATE` (id → 置く理由)。`.claude/state/` を指す台帳の行が
`AGENT_STATE` に無いと `npm run check-datasets` が止める。足すときは上の基準を満たす理由を書く。

### 画像の置き場

画像は `config/datasets.mjs` の `IMAGE_ROOTS` の中にだけ置く。外にある追跡画像は `npm run check-datasets` が止める。

| 置き場 | 置くもの |
|---|---|
| `assets/<用途>/` | 素材の原本。配信用に変換したもの (webp・リサイズ) は下の配信先か R2 に置き、原本はここに残す |
| `apps/*/public/` | アプリがそのまま配信する画像 (コードと一緒にデプロイされる) |
| `packages/*/src/`・`packages/*/data/` | パッケージに同梱する画像・図形 (コードが import する) |
| `config/coconala/assets/` | ココナラのプロフィール・商品画像 (出品台帳と一緒に人が判断して変える) |
| `.claude/skills/**/examples/` | スキルの説明に使う作例 (Codex 用ミラー `.agents/` を含む) |
| `contents/blog/`・`docs/31_note記事原稿/` | 公開待ちの原稿 outbox (公開後に CI が消す) |

公開する画像の正本は R2 (ブログの図・OGP・特産品イラスト)。生成した派生 PNG を git に足さない
(`note-image-assets.md`・`ogp-image-standards.md`)。

### 台帳と検査

- どのファイルが何のデータで、どこに置くかは台帳 `config/datasets.mjs` が持つ (1 行 1 データセット・種類・領域・本来の置き場)。
  `npm run check-datasets` (pre-commit・PR CI) が次を止める。
  - 対象範囲 (`config/`・`data/`・`assets/`・`.claude/state/`・`.claude/config/budgets/`、および旧置き場) の追跡ファイルが、
    台帳のちょうど 1 行に当たらない (未宣言・重なり)。どの行にも当たらない台帳の行
  - 移した旧置き場 (`RETIRED`) がコード・workflow・package.json と、Markdown (手順書・作業カード `.claude/todo`・`docs/`・
    memory・README) と Codex 用の agent 定義に残っている。当時のパスを残す履歴 (`data/`・`.claude/state/`・スキルの
    `reference/` の監査とレビュー・原稿の outbox) は対象外。コードのコメント行と、文書で「旧置き場」「旧パス」と書いた
    経緯の行は除く (2026-10-07 に手順書から全 Markdown へ広げた。作業カードの完了条件が旧パスを指したまま残っていたため)
  - 画像が `IMAGE_ROOTS` の外にある
  - `.claude/state/` を指す行が許可リスト `AGENT_STATE` に無い
  - コード (ts・tsx・mjs・cjs・js) が台帳の `data/` のパスを直書きしている。テスト・コメント行・import 行と、
    `DATA_LITERAL_EXEMPT` に理由付きで載せたファイル (web の実行時バンドルに入る `packages/data-configs/src` など) は除く
- 新しい記録・素材は、先に台帳へ 1 行足してから書く。日付付きファイルの寿命は `prune-state-snapshots.mjs` の
  `RETENTION_POLICIES` だけが数値を持ち、台帳は名前で参照する。
- コードは置き場を直書きせず、台帳の id で引く (`datasetPath(id)` / `datasetDir(id)`)。`.cjs` からは
  `require("…/config/datasets.mjs")` で読む (require(esm)。Node 20.19 / 22.12 以降)。`config/` の設定は
  `config/paths.mjs` の定数を import する。workflow と shell は直書きでよいが、旧置き場は上の検査が止める。
  - テストの fixture が実物のスクリプトを一時ディレクトリへコピーして動かすときは、`config/datasets.mjs` と
    `config/paths.mjs` もコピーする (`apps/admin/tests/helpers/fixture-root.ts`)
  - `config/` のファイルの直書き (部品に分けた `path.join(".claude", "config", "x.json")` の形も含む) と定数の実在は
    `packages/product-factory/tests/config-paths.test.ts` が検査する。
- `.claude/config/` を `.claude/` の下に残すのは、そこが Claude Code の保護パスだからである。無人 run
  (`--permission-mode dontAsk`) の Claude は `.claude/` に書き込めないので、エージェントが自分の品質ゲートを
  黙って緩められない (2026-09-24 に計測サイクルの無人 run で書き込み拒否を実測)。

### 置き場を移す手順

1. 台帳の行の `path` を新しい置き場に書き換え、`git mv` で移す (中身は変えない)。
2. 旧置き場を `RETIRED` に `{ from, to, since }` で宣言する。コードと文書 (作業カード・memory を含む) の直書きは検査が拾う。
   部品に分けた形 (`path.join(ROOT, "state", "ads", ...)`・`resolve(STATE_DIR, "x.json")`) と、スキルの場所を基準にした
   相対パス (`reference/improvement-log.md`) は検査に掛からないので、別に探して直す。
3. workflow の書き戻し (`git add`)・`RETENTION_POLICIES` の `directory`・品質検査の baseline のパスを同じ差分で変える。
4. **develop への push から main のマージまでを数十分に収める。** 定期実行は main の workflow 定義で動き、中で develop を
   checkout して develop のスクリプトを使う。develop だけ先に変わると、新しい置き場に書いた記録を main の定義が
   `git add` せず (旧パスが無ければ `fatal: pathspec` で step ごと落ち、差分で判定する workflow は「変更なし」と黙って抜ける)、
   その run の記録が失われる。GitHub の cron は数時間遅れて発火するので「定期実行が無い時間帯」は当てにできない。
   - push の前に `npm run preflight:pr` とローカルの検査を通し、push したら PR の CI が通り次第すぐマージする。
   - マージ後、push からマージまでの間に動いた run を一覧し (`/actions/runs?created=>=<push 時刻>`)、記録の欠落を
     run のログから補う。最後に workflow を手動起動して新しい置き場へ書くことを確かめる。
   - 実例 (2026-10-06): develop に入れてから main のマージまで約 12 時間空き、Instagram の投稿記録 (投稿は出たが
     投稿台帳と二重投稿防止ログが残らず、次の run が同じ投稿を繰り返す状態になった)・Threads の投稿確認・
     認証付き計測の 3 run が記録を落とした。
5. 改善ログ・レビュー・state の json など、当時のパスを記録した履歴は書き換えない。

## アプリが読むデータ (git TS が SSOT → R2 配信) — 「設定 + 運用エンティティ」

> **注**: 旧 docs / skill が「D1」「ローカルビルド DB」と呼んでいた層は **SSOT ではない**。
> Cloudflare D1 サービスではなく、再生成可能な使い捨てビルドキャッシュ / エフェメラル集計エンジン。
> SSOT は git TS と R2 のみ。用語と決定表: [`packages/database/README.md`](../../packages/database/README.md) / 正典: doc 12。

Phase 6 (2026-05-27) で観測値・相関結果を R2 へ移行、Phase F (2026-05-30) で運用エンティティの SSOT も
git TS 化し永続 D1 を全廃した。アプリが読む各データの真実源:

### Authored / 設定 (git TS が SSOT → 生成スクリプトで R2)
- metric メタ — **SSOT は `packages/data-configs/src/metrics/<key>.ts`**
- 各種カタログ定義 — git TS → R2 反映 (冪等スクリプト)。テーマの指標・チャート定義だけは上の例外で `data/themes/catalogs/` の JSON

### Authored / 運用 (git TS 定義が SSOT → 生成スクリプトで R2 JSON)
- `page_components` / `theme_metrics` / `categories` / `themes` / `surveys`
- `affiliate_ads`
- 横断整合性 (参照整合・キー重複・孤立参照) は **生成スクリプト内でビルド時に検証**する

> **注**: `sns_posts` はここに置かない。投稿台帳は「書込専用の運用ログ」(投稿のたび append・指標を後から UPDATE) で
> authored config と性質が違うため **`data/sns/posts.json` が SSOT** (下記「`.claude/` 配下」参照)。
> git TS でも配信 R2 でもない。書込口は `.claude/scripts/lib/sns-posts-store.cjs` / `/mark-sns-posted` のみ。

### Reference (外部に真実源 → 再生成)
- `articles` (article.md) / `estat_catalog` (e-Stat API) / `prefectures`・`cities` (JSON) / `ports`・`fishing_ports`・`gis_datasets`

### Derived (エフェメラル計算 → R2、永続しない)
- `area_profiles` (県別 strength/weakness) / correlations
- 使い捨て `:memory:` SQLite / DuckDB が R2 観測値を読んで集計 → R2 へ書き出す

### R2 (観測値の SSOT + 配信 snapshot)
- 観測値 → `app/stats/<metric>/values.json` (都道府県) / `cities.json` / `ports.json` / `migration-flow-<year>.json`
- 相関 → `app/correlation/top-pairs.json` (エフェメラル計算で生成)

## 配信 snapshot (再生成可能) — 手編集禁止

**判定軸**: git TS / R2 観測値を入力に生成スクリプトで作られる、再生成可能な JSON / SVG / 動画素材。手で編集してはならない。

| 派生先 | 用途 | 生成 |
|---|---|---|
| `.local/r2/app/<route>/<file>.json` → Cloudflare R2 | Web app SSR / SSG が fetch | `/sync-snapshots` + `/push-r2` |
| `apps/remotion/public/<feature>/*.json` | Remotion build 時に `staticFile()` で読み込み | git TS / R2 → static export |
| `packages/area/src/data/{prefectures,cities}.json` | npm パッケージ静的 export | master export |

派生 JSON は git tracked でも commit して良い (履歴で差分追跡)。ただし **真実源は git TS / R2** で、生成物を手で編集すると乖離が起きる。

詳細: [`packages/database/README.md`](../../packages/database/README.md)

## `docs/` に置くもの — 「人間が読み返す文書」

**判定軸**: 人間が振り返り・思考整理に使う長文・計画・レビュー・施策ログ・コンテンツ backlog。Obsidian で開く前提。

| データ | 保存先 |
|---|---|
| プロジェクト戦略・要件・ペルソナ | `docs/00_プロジェクト管理/` (4 ファイル固定) |
| 技術設計・アーキテクチャ | `docs/01_技術設計/` |
| 現在の月次・週次計画 | `.claude/todo/{monthly,weekly}.md` |
| agent用週次レビュー | `data/reviews/weekly/YYYY-Www.md` |
| 週次メトリクス | `data/<取得元>/`（既存 history / LATEST を読む） |
| 批判的レビュー・事前検死・監査の未完了策 | `.claude/todo/` の該当バックログ。全文は保存せず、恒久判断は既存SSOTへ直接統合 |
| 改善施策の一覧・TODO | `.claude/todo/improvements.md` |
| 未分類の思いつき TODO (受信箱) | `.claude/todo/backlog.md` |
| セッション残タスク | `.claude/todo/` の適切なバックログへ直接反映（一時ハンドオフ文書は作らない） |
| コンテンツ backlog | `docs/30_note記事企画/backlog/` |
| 未着手の機能・自動化・指標拡充 backlog | `.claude/todo/backlog.md` |

詳細: [`docs-vs-issues.md`](./docs-vs-issues.md)

## 記録と作業状態の一覧 — `data/` と `.claude/state/`

**判定軸**: アプリは読まない。`data/` は事業の記録 (計測・台帳・改善ログ・レビュー・監査と是正のキュー)、`.claude/state/` は
エージェント運用の状態だけ (上の許可リスト)。人間は基本的に要約 (`LATEST.md`) だけを読む。
1 行 1 データセットの正本は台帳 `config/datasets.mjs` で、この表は主なものの案内である。

**寿命を宣言せずに日付名で増やさない (2026-09-14)**: git に置く生 snapshot は `.claude/scripts/lib/prune-state-snapshots.mjs` の `RETENTION_POLICIES` に置き場と keep 件数を持つものだけ (週次 `fetch-metrics-weekly.yml` が commit 直前に削除する)。release の検証証跡は `data/releases/<date>-<name>.json` (keep 8)、実行時の生 artifact は `.local/verification/` (30 日でローカル掃除) か CI artifact (≤30 日)。`.claude/state/metrics` 直下の日付名 JSON は `check-repo-hygiene.cjs` の `DATED_STATE_ARTIFACT` が止め、`prune-state-snapshots.test.mjs` が「追跡中の日付名 state は policy / 恒久宣言 / baseline のどれかに属する」ことを固定する。

| データ | 保存先 |
|---|---|
| GSC / GA4 週次 snapshot (生 CSV) | `data/{gsc,ga4}/snapshots/<YYYY-Www>/`（GitHub Actions が日曜 JST 20:00 に自動更新。26 週を保持）。`data/adsense/snapshots/` は 2026-09-20 の恒久停止に伴う凍結記録 |
| GSC / GA4 の週次集約と要約 | `data/{gsc,ga4}/{history.csv,history-finalized7d.csv,LATEST.md}`（人間は LATEST.md を見れば 10 秒で把握） |
| GSC カバレッジ | ドリルダウン `data/gsc/coverage-drilldown/<YYYY-Www>/`、件数推移 `data/gsc/coverage-totals-history.csv`、URL Inspection `data/gsc/url-inspection/`（日次 7 件を保持）。是正キュー (状態) は `data/gsc/coverage-remediation/{coverage-remediation-queue.json,LATEST.md}`（`build-coverage-queue.mjs` が生成。正典 `/gsc-coverage-remediation`） |
| PSI 日次計測（19 URL × mobile/desktop） | `data/psi/{psi-batch-*.json,history.csv,LATEST.md}`（生 JSON は最新 1 件。日次 JST 02:00、閾値違反時 `[PSI Alert]` Issue）/ URL リスト `config/psi-urls.txt` / 閾値 `.claude/skills/analytics/performance-improvement/budgets.json` |
| Cloudflare 日次 usage と月次・週次コスト | `data/cloudflare/{snapshots/YYYY-MM-DD.json,history.csv,LATEST.md}`（生 JSON は 30 件。日次 JST 02:30、閾値違反時 `[Cloudflare Alert]` Issue）、`data/cloudflare/{monthly,weekly}-snapshots/` / 閾値 `.claude/config/budgets/cloudflare-cost-improvement/` |
| （凍結記録）AdSense | `data/adsense/`。2026-09-20 の恒久停止で更新されない。週次収益は NSM（`generate-weekly-metrics-issue.mjs` の「週次収益 (NSM)」節）を見る |
| アフィリエイトの成果・提携・実験 | `data/affiliate/`（A8・もしも・楽天の成果、提携台帳 `{a8,affiliate}-catalog.json`、実験台帳 `experiments.json` (書込は `/manage-affiliate-experiment` のみ)、GA4 実測の週次集約 `ga4-affiliate-history.csv`）。GA4 実測の生 snapshot は 2026-09-14 から R2 `state/ads/ga4-affiliate/` (ローカルは `npm run state:pull -- ads/ga4-affiliate`)。在庫棚卸し・compliance などの最新状態は `data/affiliate/{inventory-*,*-latest}.json` |
| **SNS 投稿台帳 (投稿履歴の SSOT)** | `data/sns/posts.json`（書き込み: `.claude/scripts/lib/sns-posts-store.cjs` / `/mark-sns-posted` / IG cron は `.claude/scripts/instagram/record-posted.cjs`（内部で store を呼ぶ）。全 SNS 自動化スクリプトはこのストア経由。`ig-posted-log.jsonl` は二重投稿防止用で SSOT ではない）。形は `posts.schema.json`、長尺の台本は `data/sns/scripts/<id>.json`、画像・動画の実体は Google Drive `stats47/SNS素材/` (台帳は相対パス・sha256 だけ。契約 `sns-content-standards.md` §3-1) |
| SNS 投稿メトリクス時系列 | `data/sns/metric-snapshots/YYYY-MM-DD/metrics.csv`（書き込み: `.claude/scripts/lib/sns-metrics-store.cjs`） |
| 商品の販売台帳・受領記録・生成と販売準備の状態 | `data/products/`（状態は `*-status.json`） |
| 計測→記録→改善サイクルの週次まとめ | `data/measurement-cycle/{latest.json,LATEST.md,history.csv,triage-latest.json}`（`build-measurement-cycle.mjs` が日曜の `fetch-metrics-weekly.yml` と月曜の `improvement-cycle-weekly.yml` で作る。週次メトリクス Issue と `/weekly-review` が読む） |
| 改善施策の詳細ログ・効果判定・実験 | `data/improvement/<施策>/improvement-log.md`、`data/effect-verdict/verdicts-<week>.json`、`data/business/experiments.json` |
| NSM 週次 JSON snapshot・レビュー | `data/nsm/weekly-snapshots/YYYY-Www.json`、`data/reviews/{weekly,monthly}/` |
| e-Stat 年カバレッジ監査キュー | `data/estat/year-coverage/{queue.json,LATEST.md}`（`estat-year-coverage-audit-weekly.yml` が週次で巡回生成） |
| 整合性監査マーカー | `.claude/state/consistency/audited.json`（`check-agent-skill-consistency.cjs --mark-audited` が記録。Stop hook がこのハッシュと現在の変更を比較） |
| **Claude routine のトークン実績** (日次生成 1 run 1 行) | `.claude/state/metrics/claude-usage/history.csv`（書込: `.claude/scripts/lib/record-claude-usage.mjs` のみ・追記専用。**4 種を合計しない** — cache_read は割引されるため。`token_source=none` は 0 ではなく未取得。読み方は同ディレクトリの README） |
| **モデル使用量と最適化提案** | `.claude/state/metrics/model-usage/{local-<platform>.json,latest.json,canary/*.json}`（`local-*` は transcript から集計した値だけで prompt・本文は書かない。正典 `.claude/rules/model-prompting.md`「継続最適化サイクル」） |
| RemoteTrigger 記録 | `.claude/state/triggers.json` |

## GitHub Issues に置くもの — 「PR 連携・自動アラート」

詳細: [`docs-vs-issues.md`](./docs-vs-issues.md)

- `enhancement` / `bug` — PR で `Closes #N` で close される機能改修・バグ
- `cloudflare-alert` / `psi-alert` + `auto-generated` — 日次 cron の閾値違反通知

## 新規スキル設計時の判断

```
スキルが生成するデータの本質は？
  ├─ アプリが読む Authored エンティティ (設定 / 運用)  → git TS が SSOT → 生成スクリプトで R2 JSON
  │      （詳細・判定は 02_データアーキテクチャ.md「データ分類」/ packages/database/README.md）
  ├─ 観測値から計算できる集計 (Derived)              → エフェメラル計算 → R2 (永続しない)
  ├─ 現在の計画・未完了タスク                        → .claude/todo/
  ├─ 恒久的な戦略・要件                             → docs/ の既存固定SSOT
  ├─ 計測・台帳・改善ログ・レビュー・監査と是正のキュー → data/<取得元>/ (台帳に 1 行足してから)
  ├─ 画像などの素材の原本                           → assets/<用途>/
  ├─ エージェントの運用をやめたら不要になる状態だけ   → .claude/state/ (AGENT_STATE に理由を足してから)
  └─ PR/Issue 連携が本質                            → GitHub Issues (enhancement/bug)
```

レビュー全文は新規保存しない。迷う場合は未完了の行動か、恒久判断か、再生成可能な履歴かで分ける。
アプリが読む配信データは常に **R2 JSON**（上流 SSOT は git TS、永続 DB は持たない）。

## 改善施策の記録構造 (1 層構造)

改善施策スキル (gsc / ga4 / adsense / affiliate / cloudflare-cost / psi / sns-metrics) は以下の構造で記録:

| 場所 | 用途 |
|---|---|
| `.claude/todo/improvements.md` | 全施策の一覧 (簡易表)。**TODO 真実源**。status / Tier / 期日を管理 |
| `data/improvement/<metric>-improvement/improvement-log.md` | agent 用詳細ログ。検証コマンド・仮説・URL inspection 結果など |

## 本原則の根拠

- `.claude/` と `docs/` は git 管理されるため、履歴が自動的に残る（改善サイクルと相性が良い）
- 計測データを D1 に入れるとテーブルが肥大化し、スキーマ変更コストが増える
- エージェントが Read/Write/Grep で扱えるほうが、スキル横断の連携がしやすい
- 人間が Obsidian で振り返るには `docs/` のファイルベース構造が最適
