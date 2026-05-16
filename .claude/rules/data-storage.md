# 記録先の統一原則 (D1 vs `.claude/`)

データの性質で保存先を厳格に分ける。**スキル実装・エージェントは以下の分類に従うこと**。

## D1（Cloudflare D1 SQLite）に置くもの — 「運用データ」

**判定軸**: `apps/web` / 投稿スキルが CRUD する、ドメインモデルの主要エンティティ。

- `articles`, `indicators`, `observations`, `ai_content`, `page_components` — コンテンツ実体
- `categories`, `subcategories`, `area_profiles` — マスタ
- `sns_posts` — SNS 投稿本体（最新メトリクスの cache カラムも含む。時系列履歴はファイル側）
- `correlations` — 相関分析バッチ結果
- その他、ランキング・テーマダッシュボード・検索が依存するテーブル

## `.claude/` 配下のファイルに置くもの — 「計測・改善の蓄積」

**判定軸**: アプリは読まない。人間とエージェントが時系列で振り返るためのログ・スナップショット・実験状態。

| データ | 保存先 |
|---|---|
| GSC/GA4/AdSense 週次 snapshot (CSV) + budget 閾値 | `.claude/skills/analytics/{gsc,ga4,adsense}-improvement/reference/`（生 CSV + budgets.json、GitHub Actions が日曜 JST 20:00 に自動更新） |
| GSC/GA4/AdSense/PSI の週次集約履歴（前週比・人間向け LATEST.md） | `.claude/state/metrics/{gsc,ga4,adsense,psi}/{history.csv,LATEST.md}`（GitHub Actions が自動更新、人間は LATEST.md を見れば 10 秒で把握） |
| PSI 日次計測（19 URL × mobile/desktop） | `.claude/state/metrics/psi/psi-batch-*.json`（GitHub Actions 日次 JST 02:00、閾値違反時 `[PSI Alert]` 自動起票）/ URL リスト: `.claude/config/psi-urls.txt` / 閾値: `.claude/skills/analytics/performance-improvement/budgets.json` |
| Cloudflare 月次 snapshot JSON + budget 閾値 | `.claude/skills/analytics/cloudflare-cost-improvement/reference/`（※施策・観測ログは GitHub Issues `cost-*` ラベル側） |
| Cloudflare 日次 usage（D1/Workers/R2） | `.claude/state/metrics/cloudflare/{snapshots/YYYY-MM-DD.json,history.csv,LATEST.md}`（GitHub Actions 日次 JST 02:30、閾値違反時 `[Cloudflare Alert]` 自動起票）/ 閾値: `.claude/skills/analytics/cloudflare-cost-improvement/reference/budgets-daily.json` |
| SNS 投稿メトリクス時系列 | `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv`（書き込み: `.claude/scripts/lib/sns-metrics-store.cjs`） |
| NSM 週次 JSON snapshot | `.claude/skills/management/nsm-experiment/reference/weekly-snapshots/YYYY-Www.json` |
| 実験 state（PDCA） | `.claude/state/experiments.json` |
| RemoteTrigger 記録 | `.claude/state/triggers.json` |

## 新規スキル設計時の判断

- 「アプリが読む or 1 行あたりの FK 結合が本質的か？」 → **YES なら D1**
- 「append-only の時系列ログ／設定／実験記録か？」 → **NO なら `.claude/` 配下のファイル**
- 迷う場合は `.claude/` を優先。D1 は本当に必要な時だけ追加する

## 本原則の根拠

- `.claude/` は git 管理されるため、履歴が自動的に残る（改善サイクルと相性が良い）
- 計測データを D1 に入れるとテーブルが肥大化し、スキーマ変更コストが増える
- エージェントが Read/Write/Grep で扱えるほうが、スキル横断の連携がしやすい
