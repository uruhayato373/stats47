---
type: index
updated: 2026-06-13
---

# 04_レビュー — レビュー・監査・週報

批判的レビュー / 事前検死 / コード監査 / パフォーマンス / 収益化分析 / SEO 監査 / SNS 週報 / コスト月報 を置く。
人間が振り返り・思考整理に使う文書。**サブディレクトリは廃止し、フラット構成**にした (2026-06-13)。

## 命名規則 (フラット)

```
docs/04_レビュー/<YYYY-MM-DD>-<topic-slug>.md      (日付つきレビュー)
docs/04_レビュー/<YYYY-Www>-<topic-slug>.md        (週次。例: 2026-W22-sns-weekly.md)
```

- 日付を先頭にして時系列でソートされるようにする。
- `<topic-slug>` でカテゴリ/主題がわかるようにする (例: `-monetization` / `-code-audit` / `-pre-mortem-<x>` / `-sns-weekly` / `-blog-quality-<x>` / `-performance-report` / `-cloudflare-cost`)。
- 機械的な絞り込みは frontmatter の `type:` (critical-review / performance-report / pre-mortem / sns-weekly-report / blog-winning-patterns 等) で行う (Obsidian Bases / Dataview)。

## 現在の文書 (カテゴリ別)

### 批判的レビュー (`type: critical-review`)
- [2026-06-13-monetization-career.md](2026-06-13-monetization-career.md) — 収益化戦略分析。転職アフィリエイト特化・ユニットエコノミクス
- [2026-06-01-codebase-optimization.md](2026-06-01-codebase-optimization.md) — スケール前のコード負債棚卸し (重複/SSOT散逸/DBレス取り残し)。deferred リファクタの生きた backlog

### パフォーマンス / コード監査 (`type: performance-report`)
- [2026-06-13-code-audit.md](2026-06-13-code-audit.md) — 全コード監査 (PSI悪化要因→是正)。実施状況つき。**TODO 真実源は `docs/todo/01_改善バックログ.md` PERF-***

### ブログ品質 (`type: blog-quality / blog-winning-patterns`)
- [2026-06-08-blog-winning-patterns.md](2026-06-08-blog-winning-patterns.md) — GSC 実測 × 構造特徴の勝ち要因分析 (順位交絡統制つき)

### SNS 週報 (`type: sns-weekly-report`)
- [2026-W22-sns-weekly.md](2026-W22-sns-weekly.md) — SNS 週次メトリクス (2026-05-25〜31)

## 関連

- 記録先の判定: `.claude/rules/docs-vs-issues.md` / `.claude/rules/data-storage.md`
- 改善施策の TODO 真実源: `docs/todo/01_改善バックログ.md`
- 週次計画・レビュー: `docs/03_週次運用/`
