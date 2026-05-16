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
| 週次計画・週次レビュー | `docs/03_週次運用/週次{計画,レビュー}/YYYY-Www.md` |
| 週次メトリクス自動生成 | `docs/03_週次運用/メトリクス/YYYY-Www.md` |
| 批判的レビュー・事前検死・SEO 監査・SNS 週報・パフォーマンスレポート・コスト月報 | `docs/04_レビュー/<subcategory>/YYYY-MM-DD.md` |
| 改善施策の人間向け要約 (gsc / ga4 / adsense / psi / cloudflare-cost) | `docs/05_改善ログ/<metric>.md` (append-only) |
| YouTube 実験・回復 | `docs/15_実験ログ/youtube/EXP-NNN.md` / `recovery-YYYY-MM-DD.md` |
| ブログ / note / YouTube コンテンツ backlog | `docs/{20_ブログ記事企画,22_YouTube企画,30_note記事企画}/backlog/` |
| 機能 / 自動化 / UI 改善 backlog (未着手) | `docs/50_Issues/{feature,automation,ui-improvements}-backlog.md` |

### GitHub Issues に置くもの

| データ | ラベル | 起票方法 |
|---|---|---|
| 機能改修・実装タスク (PR で close される) | `enhancement` | 人間が `gh issue create` |
| バグ修正 | `bug` | 人間が `gh issue create` |
| Cloudflare 日次 usage 閾値違反 | `cloudflare-alert,auto-generated` | `.github/workflows/cloudflare-usage-daily.yml` |
| PSI 日次計測の閾値違反 | `psi-alert,auto-generated` | `.github/workflows/psi-audit-daily.yml` |
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

## 改善施策の 2 層構造

improvement 系スキル (gsc / ga4 / adsense / cloudflare-cost / psi / sns-metrics) は 2 層で記録する:

| 層 | 場所 | 内容 |
|---|---|---|
| 人間向け要約 | `docs/05_改善ログ/<metric>.md` | section 単位で施策を append-only。frontmatter `status:` で pending / effect/full / effect/partial / effect/none / effect/adverse 管理 |
| agent 用詳細 | `.claude/skills/analytics/<metric>-improvement/reference/improvement-log.md` | 検証コマンド・仮説・期日・URL inspection 結果など、agent が深掘り参照する詳細 |

人間は docs/ を読み、agent (week-plan / weekly-review / *-improvement) は両方を読む。

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

- PR 本文に「対応: `docs/05_改善ログ/psi.md#T1-PSI-LCP-02`」のような相対リンクを貼る
- improvement-log の section の `deployed_at` / `verification_command` を PR 内で更新
- Issue ベースの `Closes #N` フローは `enhancement` ラベルの Issue でのみ使用

## 過去の移行履歴

- 2026-04: `docs/90_課題管理/` 廃止 → GitHub Issues (`enhancement` ラベル)
- 2026-04-21: `docs/03_レビュー/` 廃止 → GitHub Issues (`critical-review` 等ラベル)
- 2026-05-16: GitHub Issues 集約 → `docs/03_週次運用/` `docs/04_レビュー/` `docs/05_改善ログ/` `docs/50_Issues/` に移行。`weekly-plan` / `weekly-review` / `critical-review` / `pre-mortem` / `*-improvement` / `cost-snapshot` / `tier-*` / `effect/*` / `metric/*` / `content/*` 等のラベルを廃止 ([Phase A-E 詳細](../../plans/issu-close-cryptic-rabin.md))
