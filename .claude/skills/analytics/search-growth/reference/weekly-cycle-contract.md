---
type: agent-reference
date: 2026-07-29
status: active
owners: [gsc-analyst]
tags: [search-growth, weekly, gsc, ga4, measurement]
---

# Search Growth Weekly Cycle Contract

## 1. SSOTと用途

検索改善の週次サイクルを「計測 → 診断 → 人間承認 → 小さく実行 → 14/28/56日判定」で回す。

- 期間導出の機械SSOT: `.claude/scripts/metrics/lib/periods.mjs`
- 集計・履歴・LATEST描画: `.claude/scripts/metrics/lib/weekly-summary.mjs`
- candidate・承認操作: `.claude/scripts/search-growth/lib/triage.mjs`
- 運用入口: `../SKILL.md`
- 未完了のCI/live確認: `.claude/todo/05_機能バックログ.md` の `SEARCH-OBSERVABILITY-RELEASE-01`
- 改善サイクルの効果状態: `.claude/todo/04_改善バックログ.md#SEARCH-GROWTH-CYCLE-01`

本書は期間と承認の恒常契約だけを持ち、週ごとの数値や進捗を複製しない。

## 2. 計測契約

| 用途 | 正式名 | 期間 | 比較 | 主な利用先 |
|---|---|---|---|---|
| KPI・フェーズゲート | `finalized7d` | 取得遅延を考慮した連続7日 | 直前の重複しない`previous7d` | weekly-review、weekly-plan |
| 機会発見 | `rolling28d` | 最新の連続28日 | 前snapshot差をWoWと呼ばない | page/query/device候補 |
| GA4週次KPI | `jpFinalized7d` | Japan-onlyの連続7日 | 直前の重複しない7日 | users/sessions/PV/engagement |
| 施策効果 | `effectWindow` | 14/28/56日 | baseline・対照・交絡を明記 | `search-growth:measure` |

summary/snapshotは最低限、次を保存する。

```json
{
  "periodStart": "YYYY-MM-DD",
  "periodEnd": "YYYY-MM-DD",
  "windowDays": 7,
  "isFinalized": true,
  "generatedAt": "ISO-8601",
  "source": "gsc|ga4",
  "limitations": []
}
```

## 3. 期間の不変条件

- GSCは原則3日、GA4は原則1日の取得遅延を考慮する。
- 遅延日数とJST境界は`periods.mjs`を正本とし、snapshot metadataへ残す。
- `weekId`は実行・保存のcadence keyであり、期間の代用ではない。
- 過去week/as-ofは、その基準日から期間を決定的に再現する。再現できなければ失敗させる。
- 日別行の欠損を0補完しない。`partial` / `missing`と欠損日を記録し、
  KPI比較・WoW・フェーズゲートを停止する。
- GA4 KPIはJapan-only clean sliceを使う。rawのoverseas / `(not set)`は汚染監視に残し、
  clean KPIへ混ぜない。
- `LATEST.md`と履歴列名には`確定7日`または`ローリング28日`を明記し、曖昧な「今週」を使わない。
- rolling28d同士は21日重複するため、その差をWoWと呼ばない。

## 4. 標準フロー

```text
fetch-metrics-weekly
  1. GSC / GA4 raw snapshot取得
  2. finalized7d + previous7d summary生成
  3. rolling28d discovery slice生成
  4. period metadata / freshness / missing判定
        ↓
search-growth-weekly
  5. normalize → analyze → report
        ↓
weekly-review
  6. finalized7dでKPI・ゲート・前週差を判定
  7. rolling28dでpage/query/device候補を読む
  8. due施策を14/28/56日でmeasure
        ↓
human triage
  9. 候補を最大3件まで証拠付きで審査
        ↓
weekly-plan
 10. 承認済みを最大1〜2件だけMust/Shouldへ昇格
```

workflowは候補生成までを自動化し、改善バックログへの追加やサイト変更を自動化しない。
weekly-review単独依頼時にweekly-planを勝手に実行しない。

## 5. 候補選別と承認

- 週次triageは最大3件。原則としてtechnical/blocker、acquisition/content、measurementを各1件。
- 人間承認は最大2件/週、全active施策のWIPは5以下。
- URL/query、期間、sample size、期待レバー、guardrail、過去effect、freshnessを確認する。
- 証拠不足は`insufficient-data`とし、承認へ昇格しない。
- CTR候補はpage×query、現在のtitle/content、過去の`effect/none` / `effect/adverse`を確認する。
- サイト横断の大量title rewriteを行わない。
- 新規記事は実query需要があるものを優先し、元rankingのimpressionsを別テーマの記事需要へ流用しない。
- 一般候補は人間承認後にだけ`.claude/todo/04_改善バックログ.md`へ追加する。
- 承認lifecycleはcandidate再構築で巻き戻さない。

## 6. 効果判定

- 実装前にbaseline period、期待metric、guardrail、交絡を記録する。
- `search-growth:measure -- --candidate <id>`で14/28/56日の判定予定と証拠を確認する。
- 期間未到達、sample不足、source欠損は`insufficient-data`とし、効果なしへ倒さない。
- `effect/*`判定は`.claude/rules/evidence-based-judgment.md`に従う。
- snapshot生成やcandidate提示だけでサイト変更・deployを承認したことにしない。

## 7. 検証

```bash
npm run metrics:test
npm run search-growth:test
npm run metrics:check-period-contract -- --max-age-weeks 1
```

CI初回実走やcredential依存sourceの確認状況はTODOへ記録し、本書へ週次状態を追記しない。
