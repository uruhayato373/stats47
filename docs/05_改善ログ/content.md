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

## [CONTENT-NOTE-01] note A-laborwage 5 本連続投稿 (令和7年賃金構造基本統計)

- **status**: pending
- **tier**: 2
- **target_metric**: note-followers / note-views / external-referral-to-stats47
- **owner**: uruhayato373
- **deployed_at**: (未公開、draft 完成済)
- **due**: 2026-05-24 (W21 内)
- **related_plan**: `docs/03_週次運用/週次計画/2026-W21.md` Should「note A-laborwage 5本投稿（優先 S、準備済）」

### 背景

令和7年（2025年）賃金構造基本統計調査が e-Stat で公開（statsDataId=0003445758）。職種別年収・初任給・産業別賃金など 47 都道府県データが揃ったため、note で連載化して stats47 への外部リンクを獲得する。

### 施策

5 本の note 記事 draft を `/Users/minamidaisuke/stats47/docs/31_note原稿/A-laborwage-*/` に準備済:

1. A-laborwage-01: 47 都道府県の初任給ランキング
2. A-laborwage-02: 産業別賃金格差 (1-5 位 vs 43-47 位)
3. A-laborwage-03: 職種別年収ランキング (上位 20 職種)
4. A-laborwage-04: 男女賃金格差の都道府県別分析
5. A-laborwage-05: 求人倍率と賃金水準の相関

### 想定効果

- note フォロワー: 1 本あたり +20-30 (5 本で +100-150)
- note → stats47 外部流入: 1 本あたり +50-100 sessions/週 (5 本で +250-500/週)
- GA4 外部参照 (referrer=note.com) で計測

### 検証

- **検証コマンド**:
  ```
  /fetch-ga4-data last7d sessionSourceMedium snapshot 2026-W22
  # → "note.com / referral" 行を確認
  ```
- **検証期日**: 2026-06-07 (W23, 公開 2 週後)
- **期日後の判定**:
  - 5 本合計で note→stats47 sessions ≥ 250/週 → effect/full
  - 100-250/週 → effect/partial
  - < 100/週 → effect/none。次の検証: note タイトル・冒頭文の CTR を測定

### 移行元

`docs/50_Issues/automation-backlog.md` での記載なし。`docs/03_週次運用/週次計画/2026-W21.md` Should からの転載。

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
