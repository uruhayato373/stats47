---
type: agent-reference
date: 2026-07-29
status: active
owners: [gsc-analyst]
tags: [search-growth, weekly, gsc, ga4, measurement]
---

# Search Growth Weekly Cycle Contract

## 1. SSOTと用途

横断的な技術改善は「計測 → 診断 → 承認 → 実行 → 14/28/56日判定」、キーワード順位の改善は末尾の確定7日サイクルで回す。順位差を因果的なeffectラベルへ自動変換しない。

- 期間導出の機械SSOT: `.claude/scripts/metrics/lib/periods.mjs`
- 集計・履歴・LATEST描画: `.claude/scripts/metrics/lib/weekly-summary.mjs`
- candidate・承認操作: `.claude/scripts/search-growth/lib/triage.mjs`
- 運用入口: `../SKILL.md`
- 未完了のCI/live確認: `.claude/todo/backlog.md` の `SEARCH-OBSERVABILITY-RELEASE-01`
- 改善サイクルの効果状態: `.claude/todo/improvements.md#SEARCH-GROWTH-CYCLE-01`

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

`search-growth-weekly.yml`は横断候補の生成までを自動化し、改善バックログへの追加やサイト変更を自動化しない。キーワードの小変更は別の`seo-keyword-cycle-daily.yml`が下書きPRとして準備する。
weekly-review単独依頼時にweekly-planを勝手に実行しない。

## 5. 候補選別と承認

- 週次triageは最大3件。原則としてtechnical/blocker、acquisition/content、measurementを各1件。
- 人間承認は最大2件/週、全active施策のWIPは5以下。
- URL/query、期間、sample size、期待レバー、guardrail、過去effect、freshnessを確認する。
- 証拠不足は`insufficient-data`とし、承認へ昇格しない。
- CTR候補はpage×query、現在のtitle/content、過去の`effect/none` / `effect/adverse`を確認する。
- サイト横断の大量title rewriteを行わない。
- 新規記事は実query需要があるものを優先し、元rankingのimpressionsを別テーマの記事需要へ流用しない。
- 一般候補は人間承認後にだけ`.claude/todo/improvements.md`へ追加する。
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

## 8. キーワード順位サイクル

- 正典: `data/seo/keywords.json`（手動の追跡対象・priority）、`improvement-log.json`（active/observing/achieved・actions・reviews）、`rank-history.json`（追記専用の日別観測manifest）。日別観測は`rank-history/`、当日の選択は`selections/`へ不変保存し、すべてGitにコミットする。一般施策TODOの複製は作らない。
- GSCは`query × page`の確定7日と、その直前の重複しない7日を取得する。サイトは`sc-domain:stats47.jp`固定、平均順位は丸めず保持する。日別欠測・古い入力・API失敗は停止し、未報告queryを順位0へ変換しない。
- `nextReviewDate <= 今日`のobservingだけを判定する。平均順位1.0以下はachieved、改善したが未達ならactive、改善なし・悪化もactive。後者は前回と異なるmethodを必須とする。順位差と因果効果を混同しない。
- 公開日翌日以降の確定データが7日揃っていなければ、期限が来てもobservingを維持し、理由をreviewsへ保存する。GSCの3日遅延により、7日目には判定できない場合がある。最初の`nextReviewDate`は公開日+7日を保ち、翌日のCIで再判定する。
- 1回1キーワード、かつ同日に別キーワードへ切り替えない。observing/achievedを除外し、観察中と公開待ちの同一ページも保護する。順序は登録済みの①1位未達〜10位で表示あり（1位に近い順）、②10位超〜20位（表示が多い順）、③改善したが未達/改善なし、④高優先度でrank未取得、⑤GSCの有望な未登録クエリ。GSCは小数順位なので1.01〜1.99も1位未達として①へ含める。
- 改善前に検索ニーズを1〜2文で定義し、WebSearchと上位1〜3ページ・対象ページのWebFetch記録を必須とする。SERPを独自取得しない。不足がない場合はno-change。文字数増加自体を目的にしない。
- 自動適用はranking/themeのページ別TSとsurveyの対象オブジェクト内の既存文言。ASTで文字列だけを置換し、構造・noindex・他ページを変更しない。新規データや内部リンク等の追加実装が必要なら、担当owner/既存CLI/必要な資料/完了条件を持つdraft PRとして引き継ぎ、文字列置換で無理に代用しない。noindex・大きな構造変更はユーザー承認を要する。
- 未解決のキーワードPRがある間は次の改善PRを作らない。draft PRやGitへの保存時点では観察を始めず、成功した本番deployのSHA・変更ファイルhash・公開HTML内の変更文言の3点を確認してからobservingへ進める。R2反映が必要な変更や確認不能は公開待ちを維持する。過去deployの再確認には当日の保存済みGSCを使い、存在しなければ基準値を捏造しない。
- 日次reportには大きな順位変動（3順位以上、表示回数併記）、効果判定、対象と理由、観察期限を表示する。検索意図・比較・実施内容は`latest-review.json`とPRへ残す。予測順位や未公開の改善効果は記録しない。

Google APIの定義: [Search Analytics query](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)（2026-09-12確認）。`dataState=final`、`rows[].position`は平均掲載順位。非表示のクエリ・上位行制約があるため、未報告を検索需要の不存在と扱わない。
