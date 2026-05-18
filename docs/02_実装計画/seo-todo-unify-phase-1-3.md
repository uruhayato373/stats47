---
type: implementation-plan
created: 2026-05-18
updated: 2026-05-18
status: phase-2-deployed
target_weeks: 2026-W21 - 2026-W26
phases:
  - { id: 1, status: completed, week: W21, pr: 308 }
  - { id: 2, status: completed, week: W21-pre, pr: 310, note: "本来 W23-W24 予定を agent 並列で W21 内に前倒し実装" }
  - { id: 3, status: partial, week: W21-pre, pr: pending, note: "CTR 自動抽出 + fetch-article-data 実装 + CWV candidate スクリプトを agent 並列で前倒し実装。Routine 有効化と LLM PR 起票は別フェーズ" }
related_files:
  - .claude/scripts/lib/scan-pending-improvements.mjs
  - .claude/scripts/lib/triage-matrix.mjs
  - .claude/scripts/gsc/auto-resubmit.mjs
  - .claude/scripts/blog/generate-article-charts.mjs
  - .github/workflows/improvement-log-reminder-weekly.yml
  - .github/workflows/generate-article-charts.yml
  - docs/05_改善ログ/{content,indexing,ga4}.md
  - .claude/state/triggers.json
---

# SEO 向上 × TODO 一元化 × 自動化拡張プラン (W21-W26)

> このファイルは `~/.claude/plans/docs-gsc-ga4-seo-todo-g-rosy-hamming.md` のプロジェクト内コピー。
> Plan モードで作成された設計が別セッションから辿れるよう、`docs/02_実装計画/` 配下に複製している。
> **元 plan ファイルを更新したら、本ファイルも合わせて更新すること。**

## Phase 進捗 (2026-05-18 時点)

| Phase | 期間 | Status | PR | 主要成果物 |
|---|---|---|---|---|
| **Phase 1** | W21-W22 | ✅ deployed | [#308](https://github.com/uruhayato373/stats47/pull/308) | 3 metric 新設 (content/indexing/ga4)、scan-pending-improvements.mjs、improvement-log-reminder-weekly.yml、weekly-plan SKILL.md 改修 |
| **Phase 2** | W21 前倒し | ✅ deployed | PR pending | `/draft-from-trend`, `/triage-improvement-log` + triage-matrix.mjs, `/auto-resubmit-url` + auto-resubmit.mjs, generate-article-charts.mjs + workflow |
| **Phase 3** | W25-W26 | 🟡 partial | — | triggers.json に `stats47-daily-trend-pipeline` entry 追加 (disabled)、billing 設定後に有効化。CTR/CWV 半自動改善は未着手 |

## 次セッション開始時のフックポイント

別セッションでこの計画を引き継ぐ場合の起点:

1. **Phase 進捗確認**: 本ファイルの上記 frontmatter `phases:` を見る
2. **改善ログ pending 一覧**: `node .claude/scripts/lib/scan-pending-improvements.mjs --format markdown`
3. **今週着手対象**: `node .claude/scripts/lib/scan-pending-improvements.mjs --due-before $(date -u -d 'next sunday' +%Y-%m-%d) --tier 1,2`
4. **W22 動作検証宿題**: `docs/05_改善ログ/ga4.md` の `[GA4-CLEAN-01]` 残作業 #3
5. **Phase 2 着手**: 下記「3. 自動化ロードマップ」の Phase 2 を参照

---

## Context

stats47 は 2026-05 時点で計測基盤 (15 GitHub Actions + 1 launchd + 1 Routine) と実行スキル 70+ が整い、GSC W20 でクリック +29.2%・PV +44.4% と上昇局面に入った。一方で:

- **SEO ボトルネックが明確**: Coverage Drilldown 未登録 16.6k、PSI Mobile LCP 5-10 秒、CLS 0.14+ URL あり
- **pending 施策が 8 件以上滞留**: T0-DECAY-01 / T1-PSI-LCP-02 / T2-CWV-04 / BLOG-CTR-02 / EXP-005 など、判定期日が来ても次アクションが流れない
- **TODO が 4 箇所に散在**: `docs/03_週次運用/週次計画/`・`docs/05_改善ログ/`・`docs/50_Issues/`・記事内 `{TODO:...}` 記号 (A-laborwage 等 45 箇所)。状態定義もバラバラ
- **ブログ自動化はトレンド検出のみ**: 「発見 → 企画 → 執筆 → 校正 → 公開」11 ステップのうち 9 が手動

このプランは (1) **SEO 改善を 4 軸 × 期日のマトリクスで W21-W26 にスケジュール**、(2) **`docs/05_改善ログ/` を TODO の単一真実源に再編**、(3) **トレンド記事を「下書き自動 → 人手 1 回レビュー → 公開」の半自動パイプライン化** の三層で攻める。新規スキルは 3 個に絞り、既存資源を最大活用する。

## ゴール (KPI と期日)

| 軸 | 現状 (W20) | 目標 (W26 = 2026-06-28) |
|---|---|---|
| A. Indexing 未登録 | 10.8k | **1.4k (-87%)** by W24 |
| C. CWV LCP (mobile) | 5.2-10.3s | **< 3.5s** by W23 |
| C. CWV CLS (主要 5 URL) | 0.14+ | **< 0.1** by W23 |
| B. GSC CTR | 2.50% | **3.8%** by W25 |
| B. GSC Avg Position | 8.64 | **7.5** by W25 |
| D. 新規公開記事 (内トレンド) | — | **12 本 (内 4 本)** by W26 |
| TODO 一元化 | 4 箇所散在 | `docs/05_改善ログ/` 1 箇所、Tier 確定 backlog section = 0 by W22 |
| 半自動 PR review→merge median | — | **≤ 30 min** by W26 |

## 1. SEO 4 軸ロードマップ (優先順: A → C → B → D)

| 軸 | Tier | 担当施策 (既存) | 期日 | 検証コマンド |
|---|---|---|---|---|
| **A. Indexing** | 1 | T0-DECAY-01 (Drilldown 監視 + Indexing API URL_DELETED) | **W24 (6/14)** | `node .claude/scripts/gsc/url-inspection-daily.cjs --limit 1500` |
| **C. CWV** | 1 | T1-PSI-LCP-02 (Leaflet tile preload), T2-CWV-04 (/areas /search CLS), EXP-005 (LCP 要素特定) | **W23 (6/7)** | `curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://stats47.jp/<path>&strategy=mobile"` × 3 中央値 |
| **B. CTR** | 2 | BLOG-CTR-02 (16 件改修 5/17 deploy) の W22 中間判定 → W25 確定 | **W25 (6/21)** | `/fetch-gsc-data last28d page snapshot 2026-W25` |
| **D. Content** | 2-3 | トレンド記事半自動 (Phase 3)、note A-laborwage 5 本、SNS 再開 Sprint1 | **W26 (6/28)** | `find .local/r2/blog/ -name article.md -newer ...` |

## 2. TODO 単一ソース化の設計 (Phase 1 で完了)

### 真実源の定義

| 場所 | 役割 | 更新主体 |
|---|---|---|
| `docs/05_改善ログ/<metric>.md` | **唯一の TODO 真実源**。全 SEO/性能/コスト/コンテンツ施策の status / tier / 期日を section frontmatter で管理 (append-only) | 人間 + improvement 系スキル |
| `docs/03_週次運用/週次計画/YYYY-Www.md` | **当週ビュー**。改善ログから Tier/期日でフィルタした抽出ビュー (Routine 生成) | `/weekly-plan` |
| `docs/50_Issues/{feature,automation,ui-improvements}-backlog.md` | **未着手アイデア倉庫**。Tier 未確定段階。Tier 確定後は改善ログへ移行・section 削除 | 人間 |
| `.claude/skills/analytics/<metric>-improvement/reference/improvement-log.md` | **agent 専用詳細ログ** (現状維持)。検証コマンド・rubric 保持 | 各 `*-improvement` skill |
| GitHub Issues (`enhancement`/`bug`/`auto-generated`) | PR で close されるチケットと日次アラートのみ (現状維持) | gh CLI / Actions |

### section frontmatter テンプレ

```yaml
- **id**: T1-PSI-LCP-02           # Tier-Metric-Counter (角括弧 [] でも可)
- **status**: pending | in-progress | effect/full | effect/partial | effect/none | effect/adverse | blocked
- **tier**: 1                      # 1=NSM 直結, 2=UX/CTR, 3=experiment
- **target_metric**: psi-lcp
- **owner**: claude | uruhayato373
- **deployed_at**: 2026-05-17
- **due**: 2026-06-07              # 効果判定期日 (YYYY-MM-DD 形式、補足は () で)
- **verification_command**: "curl ..."
- **related_pr**: 308
```

### 新設 metric (3 ファイル, Phase 1 で deployed)

現状 5 metric (`gsc / ga4 / psi / adsense / cloudflare-cost`) に追加:

- `docs/05_改善ログ/content.md` — ブログ/note/YouTube 公開・更新タスク。記事内 `{TODO:...}` 45 件をここへ集約予定、原稿側は「改善ログ参照」のみに簡素化
- `docs/05_改善ログ/indexing.md` — Coverage Drilldown / sitemap / Indexing API
- `docs/05_改善ログ/ga4.md` — GA4 NSM / bounce / bot 除外

### 自動進捗反映 (Phase 1 で deployed)

`.github/workflows/improvement-log-reminder-weekly.yml` を毎週日曜 22:00 JST に実行:
- `deployed_at` から 14 日以上経過した `status: pending|in-progress` を抽出
- `[Improvement Triage] YYYY-Www` Issue を起票し、各エントリへの deep link 一覧を本文に
- 人間レビュー → 判定後に改善ログを Edit → Issue close

scan は `node .claude/scripts/lib/scan-pending-improvements.mjs` を使用 (JSON/markdown 両対応、--due-before / --tier / --status / --overdue-days でフィルタ可能)。

## 3. 自動化ロードマップ

### Phase 1 (W21-W22, ✅ deployed in PR #308)

| 自動化 | 構成 |
|---|---|
| ✅ 改善ログ 3 metric 新設 + 既存 backlog 移行 | content/indexing/ga4.md 新設、automation-backlog #289 を indexing.md に移行 |
| ✅ 改善ログ triage 週次 Issue | `.github/workflows/improvement-log-reminder-weekly.yml` + `.claude/scripts/lib/scan-pending-improvements.mjs` |
| ✅ 週次計画の改善ログ連動 + 前週残転載 | `.claude/skills/management/weekly-plan/SKILL.md` 改修 |
| ✅ GA4 bot 除外併記 | `.claude/skills/analytics/fetch-ga4-data/SKILL.md` (既に snapshot モード実装済) + `ga4-improvement/SKILL.md` observe 改修 |
| ⏸ PSI 日次違反 → 改善ログ自動 append | Skip (triage で違反検出はカバー済、psi.md 肥大化リスクを避ける) |

### Phase 2 (W23-W24, 📋 planned)

| 新規ファイル | 役割 |
|---|---|
| `.claude/skills/blog/draft-from-trend/SKILL.md` | トレンドキーワード + indicator key から `docs/21_ブログ記事原稿/<slug>/article.md` 下書きを自動生成 (md-syntax 準拠、chart placeholder、H2 8-12 sections) |
| `.claude/skills/management/triage-improvement-log/SKILL.md` | 全改善ログを走査し Tier × 期日 × status マトリクスを生成、週次計画候補出力 (scan-pending-improvements.mjs のラッパー) |
| `.claude/skills/analytics/auto-resubmit-url/SKILL.md` + `.claude/scripts/gsc/auto-resubmit.mjs` | URL Inspection 結果から未 INDEXED を抽出 → Indexing API 再送信、quota 200/day 管理 |
| `.github/workflows/generate-article-charts.yml` | PR push 時にチャート画像自動生成 → PR にコメント (Mac 依存解消) |

### Phase 3 (W25-W26, 📋 planned)

| 自動化 | 構成 | ゲート |
|---|---|---|
| **トレンド記事半自動公開** | Claude Routine `stats47-daily-trend-pipeline` (新規): discover → plan → draft → PR 起票 | 人手 PR レビュー 1 回 (~15 min) |
| CTR 半自動改善 | 月次で position 5-15 帯 × CTR < 業界平均 のクエリを抽出 → `/brushup-blog-article` で seoTitle 改訂案 PR 化 | 人手レビュー 1 回 |
| CWV 自動 alert → 修正提案 | `psi-audit-daily.yml` で閾値違反検知 → 該当 component の git blame → `/performance-improvement` で改修案 PR 起票 | 人手レビュー 1 回 |

## 4. トレンド記事「半自動化」フロー (Phase 3 で実装)

```
[毎日 07:23 JST: launchd]
  /discover-trends --source all  →  .claude/skills/blog/trends-snapshots/*.md
        ↓
[毎日 09:00 JST: Routine "stats47-daily-trend-pipeline"]
  ① trends.json + indicator マッチ抽出 (top 3)
  ② /plan-blog-trends で 3 件の企画フォーマット出力
  ③ /draft-from-trend (新規) で各 slug の article.md 下書き生成
       - md-syntax 準拠、chart placeholder、H2 8-12 sections
  ④ generate-article-charts (Actions) でチャート画像生成
  ⑤ feature/trend-YYYY-MM-DD branch に commit + draft PR 起票
        ↓
[GATE 1: 人手レビュー (~15 min)]
  - PR diff 確認、独自性 (AI 生成感、E-E-A-T) チェック
  - 数値・出典の正確性、不採用なら close
        ↓
[PR merge → develop → main]
  ⑥ post-deploy-smoke.yml で本番 200 確認
  ⑦ /publish-bulk-articles で .local/r2/blog/ → R2 同期
  ⑧ /submit-sitemap で Google 再通知
  ⑨ /auto-resubmit-url で新 URL Indexing API 送信
        ↓
[GATE 2: 1 週後の効果測定 (自動)]
  fetch-metrics-weekly.yml が GSC clicks/impressions 取得
  → docs/05_改善ログ/content.md に section auto-append (status: pending)
```

### 人手レビュー最小化の工夫

- 下書き frontmatter に `quality_score` (lint-article.cjs ベース) を付与、< 70 なら自動 close
- PR description に「変更ファイル一覧 / indicator key / 想定 search intent / 競合 3 行」を Routine が自動生成 → review 5-10 分
- 月 5-7 本ペース上限 (採用率 50% 想定で 10-14 trends 試行)

## 5. 新規/改修ファイル一覧

| パス | 種別 | 用途 | Phase |
|---|---|---|---|
| `docs/05_改善ログ/content.md` | 新規 docs | コンテンツ施策 TODO 真実源 | ✅ 1 |
| `docs/05_改善ログ/indexing.md` | 新規 docs | Indexing/sitemap/Drilldown 真実源 | ✅ 1 |
| `docs/05_改善ログ/ga4.md` | 新規 docs | GA4 NSM/bounce/bot 施策真実源 | ✅ 1 |
| `.claude/scripts/lib/scan-pending-improvements.mjs` | 新規 script | pending エントリ抽出 | ✅ 1 |
| `.github/workflows/improvement-log-reminder-weekly.yml` | 新規 Actions | 週次 triage Issue 起票 | ✅ 1 |
| `.claude/skills/management/weekly-plan/SKILL.md` | 改修 | 前週残転載 + 改善ログ自動抽出 | ✅ 1 |
| `.claude/skills/analytics/{fetch-,}ga4{-improvement,}/SKILL.md` | 改修 | Japan-only clean 値併記 + observe 連動 | ✅ 1 |
| `docs/01_技術設計/10_自動化インベントリ.md` | 改修 | 新規 Actions を追記 | ✅ 1 |
| `docs/50_Issues/automation-backlog.md` | 改修 | #285/288/290 を [in-progress]、#289 を indexing.md に移行 | ✅ 1 |
| `.claude/skills/blog/draft-from-trend/SKILL.md` | 新規 skill | トレンド企画 → 下書き自動生成 | 📋 2 |
| `.claude/skills/management/triage-improvement-log/SKILL.md` | 新規 skill | 改善ログ横断 triage | 📋 2 |
| `.claude/skills/analytics/auto-resubmit-url/SKILL.md` | 新規 skill | Indexing API 自動再送信 | 📋 2 |
| `.claude/scripts/gsc/auto-resubmit.mjs` | 新規 script | quota 管理付き再送信 | 📋 2 |
| `.github/workflows/generate-article-charts.yml` | 新規 Actions | PR チャート自動生成 (Mac 依存解消) | 📋 2 |
| `.claude/state/triggers.json` | 改修 | `stats47-daily-trend-pipeline` Routine 追加 | 📋 3 |

## 6. 実行スケジュール (W21-W26)

| 週 | Phase | Status | 主要タスク |
|---|---|---|---|
| **W21 (5/18-5/24)** | Phase 1 | ✅ deployed | 改善ログ 3 metric 新設 + backlog 移行、`scan-pending-improvements.mjs` 実装、`improvement-log-reminder-weekly.yml` 起動 |
| **W22 (5/25-5/31)** | Phase 1 検証 | 📋 | W22 自動 snapshot で clean ファイル生成確認、BLOG-CTR-02 中間判定 |
| **W23 (6/1-6/7)** | Phase 2 前半 | 📋 | `/draft-from-trend` skill 実装、CWV (LCP < 3.5s / CLS < 0.1) 達成、EXP-005 完了 |
| **W24 (6/8-6/14)** | Phase 2 後半 | 📋 | `/auto-resubmit-url` skill + script 実装、`generate-article-charts.yml` 稼働、Indexing 1.4k 達成 |
| **W25 (6/15-6/21)** | Phase 3 前半 | 📋 | `stats47-daily-trend-pipeline` Routine 起動、トレンド記事 2 本公開、CTR 3.8% 確定判定 |
| **W26 (6/22-6/28)** | Phase 3 完了 | 📋 | 累計トレンド 4 本 / 新規 12 本、半自動 review→merge ≤ 30 min 達成、KPI 全軸検証 |

## 7. 検証方法

各 KPI は実証ベース判定ルール (`.claude/rules/evidence-based-judgment.md`) に従い、effect/* 付与前に必ず:

1. 検証コマンド実測値を section に併記
2. 想定値の根拠を明示 (例: Indexing -87% = 10.8k × 87% = 9.4k 削減)
3. 80% 未達なら次の検証コマンドを section 末尾に追記

```bash
# A. Indexing 達成判定
node /Users/minamidaisuke/stats47/.claude/scripts/gsc/url-inspection-daily.cjs --limit 1500

# C. CWV 達成判定 (主要 5 URL × mobile × 3 中央値)
for url in / /ranking/area-population /areas/47000 /search /survey; do
  curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://stats47.jp${url}&strategy=mobile&category=performance"
done

# B. CTR 達成判定
/fetch-gsc-data last28d page snapshot 2026-W25

# D. 新規公開記事カウント
find /Users/minamidaisuke/stats47/.local/r2/blog/ -name article.md -newer <W21開始日>

# TODO 一元化達成判定
grep -c "^## #" /Users/minamidaisuke/stats47/docs/50_Issues/*.md  # → 0 目標

# 自動化稼働率
gh pr list --label trend-auto --json createdAt,state | jq '...'

# 半自動 review 時間
gh pr list --label trend-auto --json createdAt,mergedAt | jq '...'
```

## 8. リスクと対応

| リスク | 対応 |
|---|---|
| AI 生成記事の独自性低下 (E-E-A-T 評価ダウン) | `quality_score` < 70 自動 close、人手 GATE 1 で独自性確認、月 5-7 本上限 |
| Indexing API quota 枯渇 (200/day) | `auto-resubmit-url` skill で quota tracker 実装、超過時は次日繰越 |
| CWV 改修で他ページ regression | EXP-005 で LCP 要素特定後に実装、`psi-audit-daily.yml` で全 URL 監視 |
| TODO 移行漏れで真実源が二重化 | W22 末に `grep -c "^## #" docs/50_Issues/*.md` = 0 を完了判定に組込み |
| Routine が AI コスト膨張 | `/draft-from-trend` 1 回実行 = 1 記事下書きに制限、月 10-14 試行で頭打ち |
