# 記録先の統一原則 (git TS + R2 vs `.claude/` vs `docs/`)

> **⚠️ 2026-05-29 更新: データ層は「完全DBレス」が正典 → [`docs/01_技術設計/02_データアーキテクチャ.md`](../../docs/01_技術設計/02_データアーキテクチャ.md)。**
> 永続/リモート D1 を SSOT に持たない。アプリが読むデータの SSOT は形で選ぶ: **設定/運用エンティティ=git TS** /
> **観測値=R2** / **配信=R2 snapshot** / **Derived(集計)=エフェメラル計算 → R2**。
> `.claude/` と `docs/` の使い分け（本ファイルの主眼）は不変。

データの性質で保存先を厳格に分ける。**スキル実装・エージェントは以下の分類に従うこと**。

判定軸: (a) 誰が読むか (app / agent / 人間)、(b) 何のために (CRUD / 振り返り / 計測ログ)。

## アプリが読むデータ (git TS が SSOT → R2 配信) — 「設定 + 運用エンティティ」

> **注**: 旧 docs / skill が「D1」「ローカルビルド DB」と呼んでいた層は **SSOT ではない**。
> Cloudflare D1 サービスではなく、再生成可能な使い捨てビルドキャッシュ / エフェメラル集計エンジン。
> SSOT は git TS と R2 のみ。用語と決定表: [`data-sqlite-ssot.md`](./data-sqlite-ssot.md) / 正典: doc 12。

Phase 6 (2026-05-27) で観測値・相関結果を R2 へ移行、Phase F (2026-05-30) で運用エンティティの SSOT も
git TS 化し永続 D1 を全廃した。アプリが読む各データの真実源:

### Authored / 設定 (git TS が SSOT → 生成スクリプトで R2)
- metric メタ — **SSOT は `packages/data-configs/src/metrics/<key>.ts`**
- テーマのチャート定義など各種カタログ定義 — git TS → R2 反映 (冪等スクリプト)

### Authored / 運用 (git TS 定義が SSOT → 生成スクリプトで R2 JSON)
- `page_components` / `theme_metrics` / `categories` / `themes` / `surveys`
- `affiliate_ads`
- 横断整合性 (参照整合・キー重複・孤立参照) は **生成スクリプト内でビルド時に検証**する

> **注**: `sns_posts` はここに置かない。投稿台帳は「書込専用の運用ログ」(投稿のたび append・指標を後から UPDATE) で
> authored config と性質が違うため **`.claude/state/sns/posts.json` が SSOT** (下記「`.claude/` 配下」参照)。
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

詳細: [`data-sqlite-ssot.md`](./data-sqlite-ssot.md)

## `docs/` に置くもの — 「人間が読み返す文書」

**判定軸**: 人間が振り返り・思考整理に使う長文・計画・レビュー・施策ログ・コンテンツ backlog。Obsidian で開く前提。

| データ | 保存先 |
|---|---|
| プロジェクト戦略・要件・ペルソナ | `docs/00_プロジェクト管理/` (4 ファイル固定) |
| 技術設計・アーキテクチャ | `docs/01_技術設計/` |
| 現在の月次・週次計画 | `.claude/todo/{02_今月の重点,03_今週の計画}.md` |
| agent用週次レビュー | `.claude/skills/management/weekly-review/reference/reviews/YYYY-Www.md` |
| 週次メトリクス | `.claude/state/metrics/`（既存history/LATESTを読む） |
| 批判的レビュー・事前検死・監査の未完了策 | `.claude/todo/` の該当バックログ。全文は保存せず、恒久判断は既存SSOTへ直接統合 |
| 改善施策の一覧・TODO | `.claude/todo/04_改善バックログ.md` |
| 未分類の思いつき TODO (受信箱) | `.claude/todo/01_未整理タスク.md` |
| セッション残タスク | `.claude/todo/` の適切なバックログへ直接反映（一時ハンドオフ文書は作らない） |
| コンテンツ backlog | `docs/30_note記事企画/backlog/` |
| 未着手の機能・自動化 backlog | `.claude/todo/05_機能バックログ.md`（指標拡充候補は `.claude/todo/06_指標バックログ.md`） |

詳細: [`docs-vs-issues.md`](./docs-vs-issues.md)

## `.claude/` 配下のファイルに置くもの — 「計測・改善の蓄積（エージェント用）」

**判定軸**: アプリは読まない。エージェントが時系列で深掘り参照するためのログ・スナップショット・実験状態。人間は基本的に直接読まない (LATEST.md など要約ファイルは除く)。

| データ | 保存先 |
|---|---|
| GSC/GA4/AdSense 週次 snapshot (CSV) + budget 閾値 | `.claude/skills/analytics/{gsc,ga4,adsense}-improvement/reference/`（生 CSV + budgets.json、GitHub Actions が日曜 JST 20:00 に自動更新） |
| GSC/GA4/AdSense/PSI の週次集約履歴（前週比・人間向け LATEST.md） | `.claude/state/metrics/{gsc,ga4,adsense,psi}/{history.csv,LATEST.md}`（GitHub Actions が自動更新、人間は LATEST.md を見れば 10 秒で把握） |
| AdSense デバイス別履歴 + 施策 before/after（RPM レバー分解） | `.claude/state/metrics/adsense/{history-devices.csv,impact-LATEST.md}`（`metrics:digest` がデバイス別 history と LATEST.md の退行アラートを、`metrics:adsense-impact` が施策 before/after を自動生成。判定は improvement-triage） |
| 改善施策の agent 用詳細ログ (検証コマンド・仮説・期日) | `.claude/skills/analytics/<metric>-improvement/reference/improvement-log.md` |
| GSC カバレッジ是正キュー (404/soft404/5xx の A/B 分類・状態保持) | `.claude/state/gsc/{coverage-remediation-queue.json,LATEST.md,coverage-totals-history.csv}`（`build-coverage-queue.mjs` が生成。生 export は `coverage-drilldown/YYYY-Www/{category}-drilldown.csv`。正典 `.claude/skills/analytics/gsc-coverage-remediation/SKILL.md`、skill `/gsc-coverage-remediation`） |
| 整合性監査マーカー (agent/skill/script ドリフトの監査済み記録) | `.claude/state/consistency/audited.json`（`check-agent-skill-consistency.cjs --mark-audited` が記録。Stop hook `check-consistency-on-stop.js` がこのハッシュと現在の変更を比較してゲート判定。skill `/audit-consistency`） |
| PSI 日次計測（19 URL × mobile/desktop） | `.claude/state/metrics/psi/psi-batch-*.json`（最新1件を保持。長期履歴は `history.csv`、過去の生JSONはGit履歴から復元。GitHub Actions 日次 JST 02:00、閾値違反時 `[PSI Alert]` Issues 起票）/ URL リスト: `.claude/config/psi-urls.txt` / 閾値: `.claude/skills/analytics/performance-improvement/budgets.json` |
| Cloudflare 月次 snapshot JSON + budget 閾値・要約 | `.claude/skills/analytics/cloudflare-cost-improvement/reference/`（施策一覧は `.claude/todo/04_改善バックログ.md`） |
| GSC URL Inspection 日次詳細 | `.claude/state/metrics/gsc/url-inspection/YYYY-MM-DD.csv`（最新7件を保持。長期集計は同ディレクトリの `history.csv`） |
| Cloudflare 日次 usage（D1/Workers/R2） | `.claude/state/metrics/cloudflare/{snapshots/YYYY-MM-DD.json,history.csv,LATEST.md}`（生JSONは最新30件を保持。GitHub Actions 日次 JST 02:30、閾値違反時 `[Cloudflare Alert]` Issues 起票）/ 閾値: `.claude/skills/analytics/cloudflare-cost-improvement/reference/budgets-daily.json` |
| **SNS 投稿台帳 (投稿履歴の SSOT)** | `.claude/state/sns/posts.json`（書き込み: `.claude/scripts/lib/sns-posts-store.cjs` / `/mark-sns-posted` / IG cron は `.claude/scripts/instagram/record-posted.cjs`（内部で store を呼ぶ）。全 SNS 自動化スクリプトはこのストア経由。`ig-posted-log.jsonl` は二重投稿防止用で SSOT ではない。完全DBレス・永続 D1 なし） |
| SNS 投稿メトリクス時系列 | `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv`（書き込み: `.claude/scripts/lib/sns-metrics-store.cjs`） |
| アフィリエイト運用 state (在庫棚卸し / GA4 実測 / compliance / 実験 registry / **集約状態**) | `.claude/state/ads/{inventory-*.json,ga4-affiliate-*.json,compliance-latest.json,experiments.json,affiliate-operations-latest.json}`（`affiliate-dashboard-refresh.yml` / `affiliate-ga4-weekly.yml` が生成・commit-back。実験 registry の書込は `/manage-affiliate-experiment` のみ。dashboard HTML は `/tmp` 生成の派生物で git 管理しない） |
| NSM 週次 JSON snapshot | `.claude/skills/management/nsm-experiment/reference/weekly-snapshots/YYYY-Www.json` |
| **Claude routine のトークン実績** (日次生成 1 run 1 行) | `.claude/state/metrics/claude-usage/history.csv`（書込: `.claude/scripts/lib/record-claude-usage.mjs` のみ・追記専用。件数を上げる判断の実測根拠。**4 種を合計しない** — cache_read は割引されるため。`token_source=none` は 0 ではなく未取得。読み方は同ディレクトリの README） |
| 実験 state（PDCA） | `.claude/state/experiments.json` |
| RemoteTrigger 記録 | `.claude/state/triggers.json` |

## GitHub Issues に置くもの — 「PR 連携・自動アラート」

詳細: [`docs-vs-issues.md`](./docs-vs-issues.md)

- `enhancement` / `bug` — PR で `Closes #N` で close される機能改修・バグ
- `cloudflare-alert` / `psi-alert` + `auto-generated` — 日次 cron の閾値違反通知

## 新規スキル設計時の判断

```
スキルが生成するデータの本質は？
  ├─ アプリが読む Authored エンティティ (設定 / 運用)  → git TS が SSOT → 生成スクリプトで R2 JSON
  │      （詳細・判定は 02_データアーキテクチャ.md「データ分類」/ data-sqlite-ssot.md）
  ├─ 観測値から計算できる集計 (Derived)              → エフェメラル計算 → R2 (永続しない)
  ├─ 現在の計画・未完了タスク                        → .claude/todo/
  ├─ 恒久的な戦略・要件                             → docs/ の既存固定SSOT
  ├─ エージェントが参照する定期履歴・詳細ログ・state → .claude/
  └─ PR/Issue 連携が本質                            → GitHub Issues (enhancement/bug)
```

レビュー全文は新規保存しない。迷う場合は未完了の行動か、恒久判断か、再生成可能な履歴かで分ける。
アプリが読む配信データは常に **R2 JSON**（上流 SSOT は git TS、永続 DB は持たない）。

## 改善施策の記録構造 (1 層構造)

改善施策スキル (gsc / ga4 / adsense / affiliate / cloudflare-cost / psi / sns-metrics) は以下の構造で記録:

| 場所 | 用途 |
|---|---|
| `.claude/todo/04_改善バックログ.md` | 全施策の一覧 (簡易表)。**TODO 真実源**。status / Tier / 期日を管理 |
| `.claude/skills/analytics/<metric>-improvement/reference/improvement-log.md` | agent 用詳細ログ。検証コマンド・仮説・URL inspection 結果など |

## 本原則の根拠

- `.claude/` と `docs/` は git 管理されるため、履歴が自動的に残る（改善サイクルと相性が良い）
- 計測データを D1 に入れるとテーブルが肥大化し、スキーマ変更コストが増える
- エージェントが Read/Write/Grep で扱えるほうが、スキル横断の連携がしやすい
- 人間が Obsidian で振り返るには `docs/` のファイルベース構造が最適
