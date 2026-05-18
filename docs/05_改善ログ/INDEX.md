---
type: improvement-log-index
created: 2026-05-18
updated: 2026-05-18
---

# 改善ログ INDEX

stats47 の **全 SEO / 性能 / コスト / コンテンツ施策の TODO 真実源**。各 metric ファイルに section frontmatter (`- **status**:` `- **tier**:` `- **due**:` 等) を付けて施策を append-only で記録し、週次計画と triage workflow がここを読みに来る。

設計詳細: `docs/02_実装計画/seo-todo-unify-phase-1-3.md`

## 全 metric 一覧

| metric | 対象 | 主要施策の例 |
|---|---|---|
| [gsc.md](./gsc.md) | GSC 検索流入 (CTR / position / Indexing カバレッジ) | BLOG-CTR-02 (SEO タイトル改修)、T0-DECAY-01 (Drilldown 監視)、T3-SNS-01 |
| [ga4.md](./ga4.md) | GA4 計測精度 / NSM / bounce / bot 除外 | GA4-CLEAN-01 (Japan-only クリーン値併記) |
| [psi.md](./psi.md) | Core Web Vitals (LCP / CLS / FCP) | T1-PSI-LCP-02 (Leaflet preload)、T2-CWV-04 (/areas /search CLS) |
| [adsense.md](./adsense.md) | AdSense 収益 | (未作成、施策発生時に新規) |
| [cloudflare-cost.md](./cloudflare-cost.md) | Cloudflare コスト | Phase 9 (D1 read 0 監視) |
| [content.md](./content.md) | ブログ / note / YouTube 公開・更新 | CONTENT-NOTE-01 (note A-laborwage 5 本) |
| [indexing.md](./indexing.md) | Coverage Drilldown / sitemap / Indexing API | INDEXING-AUTO-01 (Indexing API 自動再送信)、INDEXING-DRILLDOWN-01 |
| [ai-content.md](./ai-content.md) | ranking_key の ai_content リライト (NotebookLM 補強、CTR 改善目的) | AICONTENT-001 (wheat-flour-consumption-quantity 初回リライト) |

## どこに何を書くか

| データ | 場所 |
|---|---|
| 個別施策 (1 PR / 1 デプロイ単位) | 該当 metric の `## [ID] タイトル` section |
| 詳細な検証コマンド・仮説 (agent 用) | `.claude/skills/analytics/<metric>-improvement/reference/improvement-log.md` (2 層構造の下層) |
| 当週ビュー (Must/Should/Could) | `docs/03_週次運用/週次計画/YYYY-Www.md` (改善ログから自動抽出) |
| 未着手アイデア (Tier 未確定) | `docs/50_Issues/{feature,automation,ui-improvements}-backlog.md` |
| PR で close される機能改修・バグ | GitHub Issues (`enhancement` / `bug` ラベル) |

## section frontmatter 規約

各 section の H2 ヘッダ直下に以下のリストを置く (空欄不可項目: status / tier)。

```markdown
## [ID-NN] タイトル (期間など補足)

- **status**: pending | in-progress | effect/full | effect/partial | effect/none | effect/adverse | blocked
- **tier**: 1 | 2 | 3
- **target_metric**: <metric サブ key>
- **owner**: claude | uruhayato373
- **deployed_at**: YYYY-MM-DD
- **due**: YYYY-MM-DD  (補足は `2026-06-07 (W23)` のように OK、scan は冒頭の YYYY-MM-DD のみ取る)
- **verification_command**: <copy-pasteable>
- **related_pr**: #N
```

注: 既存 section が H3 (`### 施策 ID` など) に `- **Tier**: T2 (...)` のような重複定義を持つ場合、scan-pending-improvements.mjs は **H2 直下の最初の出現のみ採用** するので影響なし。

## scan-pending-improvements.mjs の使い方

`docs/05_改善ログ/*.md` を走査して pending エントリを抽出する CLI ツール。

```bash
# 全 pending / in-progress を Tier 順に Markdown table で表示
node .claude/scripts/lib/scan-pending-improvements.mjs --format markdown

# 今週末まで due の Tier 1/2 のみ (weekly-plan 用)
node .claude/scripts/lib/scan-pending-improvements.mjs \
  --due-before 2026-05-24 --tier 1,2 --format markdown

# deployed_at から 14 日以上経過した pending (triage 用)
node .claude/scripts/lib/scan-pending-improvements.mjs --overdue-days 14

# JSON 出力 (デフォルト、agent 用)
node .claude/scripts/lib/scan-pending-improvements.mjs
```

各エントリには `metric / section_id / status / tier / target_metric / deployed_at / due / owner / overdue_days / deep_link` が含まれる。

## 自動 triage (週次)

`.github/workflows/improvement-log-reminder-weekly.yml` が **毎週日曜 22:00 JST** に走り、`--overdue-days 14` でフィルタした結果を `[Improvement Triage] YYYY-Www` Issue (label: `improvement-log-triage`, `auto-generated`) として起票する。

人間レビュー → 判定後に改善ログを Edit → Issue close、のフロー。

## 関連

- 設計 plan: `docs/02_実装計画/seo-todo-unify-phase-1-3.md`
- 実証ベース判定ルール: `.claude/rules/evidence-based-judgment.md` (effect/* 付与前必須)
- データ保存ルール: `.claude/rules/data-storage.md` (2 層構造)
- docs と Issues の使い分け: `.claude/rules/docs-vs-issues.md`
- 週次計画スキル: `.claude/skills/management/weekly-plan/SKILL.md`
