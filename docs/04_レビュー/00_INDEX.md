---
type: index
updated: 2026-07-11
---

# 04_レビュー — レビュー・監査・週報

批判的レビュー / 事前検死 / コード監査 / パフォーマンス / 収益化分析 / SEO 監査 / SNS 週報 / コスト月報 を置く。
人間が振り返り・思考整理に使う文書。**サブディレクトリは廃止し、フラット構成** (2026-06-13)。

> **保持ポリシー (2026-07-11)**: レビューは書きっぱなしで溜めない。未対応の提言・TODO は `docs/todo/` に抽出し、
> 抽出済みで被参照のないレビューは git rm する (復元は git 履歴)。残すのは (a) コード/バックログ/現役 handoff が
> 参照する正典、(b) 一次分析として振り返り価値が高いもの。セッション引き継ぎは `docs/handoffs/` へ (ここには置かない)。

## 命名規則 (フラット)

```
docs/04_レビュー/<YYYY-MM-DD>-<topic-slug>.md      (日付つきレビュー)
docs/04_レビュー/<YYYY-Www>-<topic-slug>.md        (週次。例: 2026-W22-sns-weekly.md)
```

- 日付を先頭にして時系列でソートされるようにする。
- `<topic-slug>` でカテゴリ/主題がわかるようにする (例: `-monetization` / `-code-audit` / `-pre-mortem-<x>` / `-sns-weekly` / `-blog-quality-<x>` / `-performance-report` / `-cloudflare-cost`)。
- 機械的な絞り込みは frontmatter の `type:` (critical-review / performance-report / pre-mortem / sns-weekly-report / blog-winning-patterns 等) で行う (Obsidian Bases / Dataview)。

## 現在の文書 (残す理由つき)

| ファイル | 内容 | 残す理由 |
|---|---|---|
| [2026-07-11-design-readiness-codebase-audit.md](2026-07-11-design-readiness-codebase-audit.md) | デザイン改修前の全体監査。課題・修正方針・完了条件・PR 分割 | **現役**。改修着手前の必須ゲート (todo/inbox.md に DR-AUDIT 転記済) |
| [2026-07-07-stp-analysis.md](2026-07-07-stp-analysis.md) | STP ゼロベース分析 (S1 雑学 / S2 生活意思決定) | gallery `/dashboard` (dashboard-data.mjs) が STP 戦略として読む正典 |
| [2026-07-03-claude-code-setup-audit.md](2026-07-03-claude-code-setup-audit.md) | Claude Code 環境監査。§6 モデル配分ポリシー | `build-remediation-queue.mjs` / `build-ai-content-queue.mjs` が §6 を正典参照 |
| [2026-06-13-monetization-career.md](2026-06-13-monetization-career.md) | 転職アフィリエイト戦略 (医療クラスタ・§A 提携リスト) | 現役 handoff `handoffs/2026-06-13-monetization-affiliate.md` が §A を参照。handoff 消化時に一緒に削除 |
| [2026-06-08-blog-winning-patterns.md](2026-06-08-blog-winning-patterns.md) | GSC 実測 × 構造特徴の勝ち要因分析 (順位交絡統制つき) | 天井ループの一次分析。定性裏取りの参照元 |

## 2026-07-11 に削除したもの (残タスクは抽出済み・復元は git 履歴)

- codebase-optimization (06-01) / code-audit (06-13) — deferred は改善バックログ PERF-AUDIT-DEFER と機能バックログで追跡
- theme-chart-management (06-19) — ThemeCatalog SSOT 化 (rules/theme-catalog-standards.md) で解決済
- r2-storage-audit (06-21) — incremental-cache 17 世代 17.38GB 削除を実施済
- operations-automation-review (07-03) — G2-G6 の機械化残を todo/inbox.md に転記
- sns-weekly W22〜W26 — 自動生成の派生物 (生データ正典は `.claude/skills/analytics/sns-metrics-improvement/snapshots/`、再生成可)

## 関連

- 記録先の判定: `.claude/rules/docs-vs-issues.md` / `.claude/rules/data-storage.md`
- 改善施策の TODO 真実源: `docs/todo/01_改善バックログ.md`
- セッション引き継ぎ: `docs/handoffs/`
- 週次計画・レビュー: `docs/03_週次運用/`
