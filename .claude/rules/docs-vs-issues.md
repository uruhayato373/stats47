# docs/ と GitHub Issues の使い分け

新規スキル設計・新規記録時に、出力先を `docs/` にすべきか GitHub Issues にすべきかの判定原則。

## 基本方針 (2026-05 以降)

> **「人間が読み返す文書は docs/、PR で close されるチケットと自動アラートだけ Issues」**

Obsidian で振り返り・思考整理する習慣を支えるため、ファイルベースの蓄積を最優先する。

## 判定軸

### docs/ に置くもの

| データ | 配置先 |
|---|---|
| 戦略・要件・ペルソナ・ロードマップ | `docs/00_プロジェクト管理/` `docs/02_実装計画/` |
| 技術設計・アーキテクチャ | `docs/01_技術設計/` |
| 現在の月次・週次計画 | `docs/todo/current-{month,week}.md`（上書き。履歴はgit） |
| agent用週次レビュー | `.claude/skills/management/weekly-review/reference/reviews/YYYY-Www.md` |
| 週次メトリクス | `.claude/state/metrics/`（機械状態。人手Markdownを複製しない） |
| 批判的レビュー・事前検死・SEO 監査・SNS 週報・パフォーマンスレポート・コスト月報 | `docs/04_レビュー/{YYYY-MM-DD,YYYY-Www,YYYY-MM}-<topic-slug>.md`（フラット。日付先頭・slug に種別を含める例 `-monetization` / `-pre-mortem-<x>` / `-sns-weekly` / `-performance-report` / `-cloudflare-cost`。種別絞り込みは frontmatter `type:`） |
| 改善施策の一覧・TODO (gsc / ga4 / adsense / psi / affiliate / cloudflare-cost 等) | `docs/todo/01_改善バックログ.md` |
| 未分類の思いつき TODO (受信箱) | `docs/todo/inbox.md` (triage で各バックログへ → `docs/todo/README.md`) |
| セッション残タスク | `docs/todo/{01_改善,02_機能,03_指標バックログ}.md` へ直接反映。未分類のみ `docs/todo/inbox.md`（2026-07-22 に一時ハンドオフ文書を廃止） |
| YouTube 実験・回復 | `docs/15_実験ログ/youtube/EXP-NNN.md` / `recovery-YYYY-MM-DD.md` |
| **テーマ関連のレビュー・監査・運用設計 (例外)** | `.claude/skills/theme/manage-theme-portfolio/reference/{reviews,audits}/` + `テーマポートフォリオ運用.md` — テーマ群は agent (theme-portfolio-manager) 主導で継続改善するため docs に置かない (2026-07-13 オーナー判断。旧 docs/04_レビュー/\*-theme-\*.md / docs/02_実装計画/25 から移設) |
| **survey 関連のレビュー・監査・運用設計 (例外)** | `.claude/skills/survey/manage-survey-portfolio/reference/{reviews,audits}/` + `surveyポートフォリオ運用.md` — survey 群は agent (survey-curator) 主導で継続改善するため docs に置かない (2026-07-13 オーナー判断。旧 docs/04_レビュー/\*-survey-\*.md から移設。最新状態は `.claude/state/surveys/portfolio.json`) |
| **アフィリエイト運用の台帳・監査・実験仕様 (例外)** | 広告在庫・直接配置 = git TS (`apps/web/scripts/affiliate-{ads,direct-placements}-data.ts`)、規約 = `.claude/rules/affiliate-ads-standards.md`、手順 = `.claude/skills/ads/*/SKILL.md`、機械状態 = `.claude/state/ads/*.json`、詳細履歴 = `.claude/skills/analytics/affiliate-improvement/reference/` — agent (affiliate-manager) 主導のため docs に置かない (2026-07-15。旧 `docs/40_アフィリエイト管理/` を廃止・移行仕様は `docs/02_実装計画/25_アフィリエイト運用SSOT移行仕様.md`) |
| ブログ / note コンテンツ backlog | `docs/30_note記事企画/backlog/` |
| 機能 / 自動化 backlog (未着手) | `docs/todo/02_機能バックログ.md`（指標拡充候補は `docs/todo/03_指標バックログ.md`） |

### GitHub Issues に置くもの

| データ | ラベル | 起票方法 |
|---|---|---|
| 機能改修・実装タスク (PR で close される) | `enhancement` | 人間が `gh issue create` |
| バグ修正 | `bug` | 人間が `gh issue create` |
| Cloudflare 日次 usage 閾値違反 | `cloudflare-alert,auto-generated` | `.github/workflows/cloudflare-usage-daily.yml` |
| PSI 日次計測の閾値違反 | `psi-alert,auto-generated` | `.github/workflows/psi-audit-daily.yml` |
| OGP/カード/note 画像の生成漏れ (自動修復後も残存) | `ogp-alert,auto-generated` | `.github/workflows/ogp-image-audit-weekly.yml` |
| ブログ内部リンクのリンク切れ (soft 404 / 410 含む) | `link-alert,auto-generated` | `.github/workflows/internal-link-audit-weekly.yml` |
| YouTube シャドウバン pause 期限リマインダー | (個別) | `.claude/scripts/youtube/check-pause-events.mjs` |

### 判定フロー

```
新規記録を保存したい
  ↓
PR で close される単発タスクか？
  ├─ YES → Issues (enhancement / bug)
  └─ NO → 自動 cron で生成される閾値違反アラートか？
          ├─ YES → Issues (auto-generated + *-alert)
          └─ NO → docs/ 配下に Markdown ファイル
```

## 改善施策の記録構造 (1 層構造)

improvement 系スキル (gsc / ga4 / adsense / affiliate / cloudflare-cost / psi / sns-metrics) は以下の 1 層構造で記録する:

| 場所 | 内容 |
|---|---|
| `docs/todo/01_改善バックログ.md` | 全施策の一覧 (簡易表)。status (pending / effect/full / effect/partial / effect/none / effect/adverse) + Tier + 期日を管理。**TODO 真実源** |
| `.claude/skills/analytics/<metric>-improvement/reference/improvement-log.md` | agent 用詳細ログ。検証コマンド・仮説・期日・URL inspection 結果など、agent が深掘り参照する詳細 |

人間は `docs/todo/01_改善バックログ.md` を読み、agent (*-improvement / weekly-review) は両方を読む。

## frontmatter 規約

docs/ 配下の自動生成ファイルは frontmatter を必ず付与する。Obsidian Bases / Dataview で絞り込み可能にする。

```yaml
---
type: weekly-plan | weekly-review | critical-review | pre-mortem | improvement-log | youtube-experiment | ...
week: 2026-Www       # 週次系のみ
date: 2026-MM-DD
status: draft | active | pending | completed | archived | effect/full | effect/partial | ...
tier: 1 | 2 | 3      # 改善施策のみ
target_metric: <metric>  # 改善施策のみ
related_issue: 274   # 元 Issue がある場合のみ
tags: []
---
```

## PR と docs/ の連携

PR で機能改修を行う場合、関連する docs/ ファイル (改善ログ等) を同 PR で更新する規約:

- PR 本文に「対応: `docs/todo/01_改善バックログ.md#T1-PSI-LCP-02`」のような相対リンクを貼る
- improvement-log の section の `deployed_at` / `verification_command` を PR 内で更新
- Issue ベースの `Closes #N` フローは `enhancement` ラベルの Issue でのみ使用

## 過去の移行履歴

- 2026-04: `docs/90_課題管理/` 廃止 → GitHub Issues (`enhancement` ラベル)
- 2026-04-21: `docs/03_レビュー/` 廃止 → GitHub Issues (`critical-review` 等ラベル)
- 2026-05-16: GitHub Issues の週次・レビュー系ラベルをファイル運用へ移行。2026-07-15 に現在計画=`docs/todo/`、agent週次レビュー=skill reference、メトリクス=`.claude/state/metrics/`へ再整理。
- 2026-06-06: `docs/05_改善ログ/` 廃止 → `docs/todo/01_改善バックログ.md` に統合 (1 層構造化)
- 2026-06-07: `docs/50_Issues/` 廃止 → `docs/todo/02_機能バックログ.md`（機能+自動化）/ `03_指標バックログ.md`（指標拡充）に統合。ui-improvements は対応済みで削除
