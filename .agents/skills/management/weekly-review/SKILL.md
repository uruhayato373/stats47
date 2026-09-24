---
name: weekly-review
description: 週次レビューを生成する。決定的な実績収集、計画差分、成果・課題・学びを記録する。Use when user says "週次レビュー", "今週の振り返り", "週次まとめ".
primary_agent: strategy-advisor
---

# weekly-review

当週の計画と実測を突合し、`.claude/skills/management/weekly-review/reference/reviews/YYYY-Www.md`
へ週次レビューを保存する。詳細なfield定義と出力templateは`reference/runbook.md`を必要なsectionだけ読む。

## 引数

`$ARGUMENTS`は`YYYY-Www`。省略時は現在のISO週。未来週は受け付けない。

## Phase 0: NSM snapshot

```bash
node .claude/scripts/snapshot-weekly-metrics.mjs [YYYY-Www]
```

同じ週次証拠として事業計画stateを検証・記録する。

```bash
npm run business-plan:check
npm run business-plan:build-state -- --snapshot
```

`.claude/state/business-plan/latest.json` の `sourceFreshness`、`eventCounts`、`nextActions` を読み、
未計測を0にせず、開始ゲート未達の施策を実行済みと扱わない。

既存snapshotがあれば再生成しない。上書きが必要な根拠がある時だけ`--force`を使う。

続けてGSC入力契約を検査する。

```bash
node .claude/scripts/gsc/audit-operations-cycle.mjs --stage review-input --week [YYYY-Www]
```

FAIL項目はレビュー本文の`Blockers`へ転記する。レビュー作成前なので、この段階ではreview/planの欠落自体は検査しない。

## Phase 1: 実績収集

収集専用subagentは起動せず、以下のtrackを同一セッションの並列tool callで読む。

| Track | SSOT / command |
|---|---|
| 開発 | `git log --since`、`git status --short` |
| コンテンツ | R2 blog/ranking snapshot、topic/remediation queue |
| 性能・流入 | GSC / GA4の確定7日summary、SNSの最新snapshot |
| 検索成長 | `npm run search-growth:status`、`npm run search-growth:next -- --limit 10` |
| NSM実験 | `.claude/skills/management/nsm-experiment/reference/` |
| 週次収益 (NSM) | `node .claude/scripts/metrics/generate-weekly-metrics-issue.mjs --week <YYYY-Www>` の「週次収益 (NSM)」節。欠測は 0 円ではなく「判定不能」。AdSense は恒久停止で ¥0 固定 |
| 認証付き計測 | `npm run measurement:status` + `.claude/state/metrics/authenticated/latest.json`。48時間超・取得失敗・status-only・成果未取得をBlockersへ分離する。生データはprivate R2、現在の収集状態を過去週の実測にしない |
| 計測→記録→改善サイクル | `.claude/state/metrics/measurement-cycle/{LATEST.md,triage-latest.json}`（週次メトリクス Issue の「🔁」節と同じ）。state の週が当週と違う・ゲート fail・無人記録の未実行は Blockers、未登録 custom dimension の登録と再ログインはオーナー作業として申し送る。個別の再照会は `node .claude/scripts/metrics/ga4-query.mjs` |
| 計画差分 | `.claude/todo/weekly.md` |
| 事業計画 | `.claude/state/business-plan/latest.json` + `packages/data-configs/src/business-plan/` |
| Kindle | `.claude/config/kdp-listings.json` + `.claude/state/products/{sales-ledger,kdp-weekly-publication}.json` |

各snapshotの期間、取得日、freshnessを保持する。行が無い場合を推測の0へ変換せず、
`not-measured` / `not-instrumented` / `insufficient-data`を区別する。

GSC/GA4は次の用途を混在させない。

- `finalized7d` と直前の重複しない `previous7d`: KPI、WoW、フェーズゲート。
- `rolling28d`: page/query/deviceの機会発見。前回snapshotとの差をWoWと呼ばない。
- GA4のKPI: Japan-only clean slice。rawは汚染監視だけに使う。

詳細なcommand、field、backlog/alert対応は`reference/runbook.md`のPhase 0〜2だけを参照する。

Kindleの販売対象15冊（S1 12冊 + 実測ゲート付きパイロット3冊）は、週次レビューで次の順に判定する。

```bash
# draft / in_review がある週はKDP本棚をread-backしてから判定する（書き込みは状態同期だけ、公開しない）
node .claude/scripts/kdp/kdp-batch.mjs --phase status --ids K-S1-01,K-S1-02,K-S1-03,K-S1-04,K-S1-05,K-S1-06,K-S1-07,K-S1-08,K-S1-09,K-S1-10,K-S1-11,K-S1-12

# listings + sales-ledger から週次ゲートを決定的に再生成
npm run kdp:weekly -- --week [YYYY-Www] --write
```

本棚同期がログイン・2FA・UI変更で失敗した場合は、古い状態をfreshとみなさず`Blockers`へ記録する。
`.claude/state/products/kdp-weekly-publication.json`の`status`をレビューに転載し、未計測を0需要へ変換しない。
`ready-for-owner-approval`でもレビュー単独では公開しない。公開はPhase 4で週次計画まで依頼され、かつ対象IDを
オーナーがその場で明示承認した場合だけ`/weekly-plan`の公開工程へ渡す。

## Phase 2: 差分分析

1. current-weekのcheckboxとgit/R2/snapshot証拠を突合する。
2. Must / Should / Couldごとに完了・未完了・計画外を分ける。
3. KPI変化は同じ定義・同じ期間のsnapshotだけで比較する。
4. effect判定が必要な施策は`.claude/rules/evidence-based-judgment.md`に従う。
5. 未完了は削除せず、次週へ渡す理由とownerを記録する。
6. search-growth候補は最大3件（technical/blocker、acquisition/content、measurementを原則各1件）だけ審査する。
7. CTR候補はpage×query、現行title/content、past effectを確認する。大量title書換えを提案しない。
8. 候補は人間承認前に改善バックログへ追加しない。active施策のWIPは5以下を守る。
9. gsc/coverage/inspectionがfreshで候補がある週は、最大3件を審査し、最低1件を`search-growth:approve`または`search-growth:dismiss`で記録する。採用を強制せず、採用しない場合もdismiss理由を残す。

## Phase 3: 記録

`reference/runbook.md`の「出力フォーマット」を使い、次を含める。

- 計画 vs 実績
- 成果ハイライト
- 開発・コンテンツ実績
- NSM（週次収益）/ GA4 / GSC / SNS
- 計測→記録→改善サイクル（回遊率・業務文脈の着地・無人記録で閉じた/更新した施策・オーナー作業）
- search-growth候補（期間・証拠・制約・承認待ちを明記）
- 課題、繰り返しパターン、学び
- 来週への申し送り
- 参照したsnapshot / backlog ID / file
- 事業計画のready/in-progress、開始ゲート、計測欠損、Go/Pivot/Stop判断
- KDP公開ゲート（S1 live数、4週販売/KENP計測、需要シグナル、当週候補、停止理由）

恒久的な失敗知見だけを`/knowledge`へ渡す。改善施策statusの更新は`improvement-triage`へ渡す。
`.claude/todo/weekly.md`はレビュー中に書き換えない。

保存後に接続ゲートを実行する。

```bash
node .claude/scripts/gsc/audit-operations-cycle.mjs --stage review --week [YYYY-Www] --write --strict
```

FAILが残る場合はレビューを「完了」と報告せず、出力された次アクションをBlockersに残す。

## Phase 4: 次週計画

レビュー保存後、ユーザーの依頼範囲に週次計画が含まれる場合だけ`/weekly-plan`を実行する。
レビュー単独依頼で計画まで勝手に作らない。

## Gate

- review fileのweek、snapshot期間、参照pathが一致する。
- KPIはfinalized7d、候補はrolling28dという用途が明記されている。
- 実測の無い数値・効果・完了を記録していない。
- search-growth候補は最大3件で、未承認候補を`.claude/todo/improvements.md`へ自動追加していない。
- current-weekの未完了項目を申し送りへ反映している。
- 事業計画stateが当週に生成され、未計測・手動・部分計測を区別している。
- KDP週次stateが当週に生成され、未計測と計測済み0を区別し、候補が最大1冊である。
- KDPの実公開を週次レビュー単独の副作用として実行していない。
- GSC証拠がfreshで候補がある場合、approve/dismissが最低1件記録されている。
- 保存先が`reference/reviews/YYYY-Www.md`である。

## Output Contract

chatは`Week | Saved review | Key result | Blockers | Unmeasured`の1表、各セル2行以内。
