# 記録先の統一原則 (D1 vs `.claude/` vs `docs/`)

データの性質で保存先を厳格に分ける。**スキル実装・エージェントは以下の分類に従うこと**。

判定軸: (a) 誰が読むか (app / agent / 人間)、(b) 何のために (CRUD / 振り返り / 計測ログ)。

## D1（Cloudflare D1 SQLite）に置くもの — 「運用データ」

**判定軸**: `apps/web` / 投稿スキルが CRUD する、ドメインモデルの主要エンティティ。

- `articles`, `indicators`, `observations`, `ai_content`, `page_components` — コンテンツ実体
- `categories`, `subcategories`, `area_profiles` — マスタ
- `sns_posts` — SNS 投稿本体（最新メトリクスの cache カラムも含む。時系列履歴はファイル側）
- `correlations` — 相関分析バッチ結果
- その他、ランキング・テーマダッシュボード・検索が依存するテーブル

## `docs/` に置くもの — 「人間が読み返す文書」

**判定軸**: 人間が振り返り・思考整理に使う長文・計画・レビュー・施策ログ・コンテンツ backlog。Obsidian で開く前提。

| データ | 保存先 |
|---|---|
| プロジェクト戦略・要件・ペルソナ | `docs/00_プロジェクト管理/` (4 ファイル固定) |
| 技術設計・アーキテクチャ | `docs/01_技術設計/` |
| 週次計画・週次レビュー | `docs/03_週次運用/週次{計画,レビュー}/YYYY-Www.md` |
| 週次メトリクスサマリ（自動生成） | `docs/03_週次運用/メトリクス/YYYY-Www.md` |
| 批判的レビュー・事前検死・SEO 監査・SNS 週報・パフォーマンス・コスト月報 | `docs/04_レビュー/<subcategory>/{YYYY-MM-DD,YYYY-Www,YYYY-MM}.md` |
| 改善施策の人間向け要約 | `docs/05_改善ログ/{gsc,ga4,adsense,psi,cloudflare-cost}.md` (append-only) |
| YouTube 実験 (1 実験 1 ファイル) | `docs/15_実験ログ/youtube/EXP-NNN.md` |
| コンテンツ backlog | `docs/{20_ブログ記事企画,22_YouTube企画,30_note記事企画}/backlog/` |
| 未着手の機能・自動化・UI 改善 backlog | `docs/50_Issues/{feature,automation,ui-improvements}-backlog.md` |

詳細: [`docs-vs-issues.md`](./docs-vs-issues.md)

## `.claude/` 配下のファイルに置くもの — 「計測・改善の蓄積（エージェント用）」

**判定軸**: アプリは読まない。エージェントが時系列で深掘り参照するためのログ・スナップショット・実験状態。人間は基本的に直接読まない (LATEST.md など要約ファイルは除く)。

| データ | 保存先 |
|---|---|
| GSC/GA4/AdSense 週次 snapshot (CSV) + budget 閾値 | `.claude/skills/analytics/{gsc,ga4,adsense}-improvement/reference/`（生 CSV + budgets.json、GitHub Actions が日曜 JST 20:00 に自動更新） |
| GSC/GA4/AdSense/PSI の週次集約履歴（前週比・人間向け LATEST.md） | `.claude/state/metrics/{gsc,ga4,adsense,psi}/{history.csv,LATEST.md}`（GitHub Actions が自動更新、人間は LATEST.md を見れば 10 秒で把握） |
| 改善施策の agent 用詳細ログ (検証コマンド・仮説・期日) | `.claude/skills/analytics/<metric>-improvement/reference/improvement-log.md` (2 層構造の下層) |
| PSI 日次計測（19 URL × mobile/desktop） | `.claude/state/metrics/psi/psi-batch-*.json`（GitHub Actions 日次 JST 02:00、閾値違反時 `[PSI Alert]` Issues 起票）/ URL リスト: `.claude/config/psi-urls.txt` / 閾値: `.claude/skills/analytics/performance-improvement/budgets.json` |
| Cloudflare 月次 snapshot JSON + budget 閾値 | `.claude/skills/analytics/cloudflare-cost-improvement/reference/`（人間向け要約は `docs/04_レビュー/cloudflare-cost/YYYY-MM.md` と `docs/05_改善ログ/cloudflare-cost.md`） |
| Cloudflare 日次 usage（D1/Workers/R2） | `.claude/state/metrics/cloudflare/{snapshots/YYYY-MM-DD.json,history.csv,LATEST.md}`（GitHub Actions 日次 JST 02:30、閾値違反時 `[Cloudflare Alert]` Issues 起票）/ 閾値: `.claude/skills/analytics/cloudflare-cost-improvement/reference/budgets-daily.json` |
| SNS 投稿メトリクス時系列 | `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv`（書き込み: `.claude/scripts/lib/sns-metrics-store.cjs`） |
| NSM 週次 JSON snapshot | `.claude/skills/management/nsm-experiment/reference/weekly-snapshots/YYYY-Www.json` |
| 実験 state（PDCA） | `.claude/state/experiments.json` |
| RemoteTrigger 記録 | `.claude/state/triggers.json` |

## GitHub Issues に置くもの — 「PR 連携・自動アラート」

詳細: [`docs-vs-issues.md`](./docs-vs-issues.md)

- `enhancement` / `bug` — PR で `Closes #N` で close される機能改修・バグ
- `cloudflare-alert` / `psi-alert` + `auto-generated` — 日次 cron の閾値違反通知

## 新規スキル設計時の判断

```
スキルが生成するデータの本質は？
  ├─ アプリが CRUD するエンティティ           → D1
  ├─ 人間が読み返す計画・レビュー・改善ログ    → docs/
  ├─ エージェントが参照する詳細ログ・state    → .claude/
  └─ PR/Issue 連携が本質                     → GitHub Issues (enhancement/bug)
```

迷う場合は **docs/ または .claude/ を優先**。D1 は本当に必要な時だけ追加する。

## 2 層構造（improvement 系）

改善施策スキル (gsc / ga4 / adsense / cloudflare-cost / psi / sns-metrics) は **必ず 2 層** で記録:

| 層 | 場所 | 用途 |
|---|---|---|
| 人間向け要約 | `docs/05_改善ログ/<metric>.md` | section 単位の施策一覧 + status (pending/effect/full等) |
| agent 用詳細 | `.claude/skills/analytics/<metric>-improvement/reference/improvement-log.md` | 検証コマンド・仮説・URL inspection 結果など |

## 本原則の根拠

- `.claude/` と `docs/` は git 管理されるため、履歴が自動的に残る（改善サイクルと相性が良い）
- 計測データを D1 に入れるとテーブルが肥大化し、スキーマ変更コストが増える
- エージェントが Read/Write/Grep で扱えるほうが、スキル横断の連携がしやすい
- 人間が Obsidian で振り返るには `docs/` のファイルベース構造が最適
