---
type: improvement-log
metric: content
created: 2026-05-18
updated: 2026-05-18
---

# Content 改善ログ

ブログ / note / YouTube のコンテンツ公開・更新タスク。施策ベースで append-only。新しい施策は最新を上に追加。判定が変わったら section 末尾に追記。

このログに記録する対象:
- 新規記事公開 (公開後の clicks / impressions 効果測定を含む)
- 既存記事のリライト・brushup
- note / YouTube の連載投稿
- コンテンツ撤回・noindex 化

このログに記録しない対象:
- SEO タイトル/description のみの改修 → `gsc.md` の BLOG-CTR-* 系
- インデックスカバレッジ対策 → `indexing.md`
- パフォーマンス改善 → `psi.md`

## [CONTENT-DRAFT-01] /draft-from-trend skill 実装 (Phase 2 → Phase 3 での稼働)

- **status**: in-progress
- **tier**: 2
- **target_metric**: content-publish-rate
- **owner**: claude
- **deployed_at**: 2026-05-18
- **due**: 2026-06-28 (W26)
- **related_plan**: `docs/02_実装計画/seo-todo-unify-phase-1-3.md` Phase 2/3

### 進捗 (2026-05-18)

Phase 2 前倒し実装で `.claude/skills/blog/draft-from-trend/SKILL.md` を作成 (既存 5 スキル orchestrator)。trend snapshot 読込 → 企画化 → article.md 雛形 → チャート生成までの 6 ステップを明記。

残作業:
- ✅ `fetch-article-data` SKILL.md を 2026-05-18 追加 (commit 5b0d0139) → orchestrator 5 スキル全揃え
- ✅ `fetch-article-data` 実スクリプトを 2026-05-18 Phase 3 sprint で追加 (`.claude/scripts/blog/fetch-article-data.mjs`、新 DDD schema metrics+stats_prefecture 対応)
- Phase 3 で Claude Routine `stats47-daily-trend-pipeline` (triggers.json に `enabled: false` で追加済) を有効化してパイプライン稼働 (billing 設定後 W25)
- 実スクリプト (D1 クエリ + e-Stat 取得の自動化) は Phase 3 着手時に作成 (現状は SKILL.md = 仕様文書のみ)

### 想定効果

- 月 5-7 本ペースのトレンド記事公開 (採用率 50% 想定で 10-14 trends 試行)
- GSC 流入: 1 記事あたり +5-15 clicks/月 (新規記事の position 立ち上がりベース)

## [CONTENT-TEMPLATE] 新規施策テンプレ

新しい施策を追加するとき以下をコピーして埋める。

```markdown
## [CONTENT-XXX] タイトル (期間)

- **status**: pending | in-progress | effect/full | effect/partial | effect/none | effect/adverse | blocked
- **tier**: 1 | 2 | 3
- **target_metric**: <metric_key>
- **owner**: claude | uruhayato373
- **deployed_at**: YYYY-MM-DD
- **due**: YYYY-MM-DD
- **related_pr**: #N
- **related_plan**: `docs/03_週次運用/週次計画/YYYY-Www.md`

### 背景

### 施策

### 想定効果

### 検証

- **検証コマンド**:
- **検証期日**:
- **期日後の判定**:
```
