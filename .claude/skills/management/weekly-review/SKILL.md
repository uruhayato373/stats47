---
name: weekly-review
domain: strategy
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
| 楽天アフィリエイト成果 | 認証付き収集の `rakuten` (毎日。`rakuten-report.mjs` が管理画面の JSON から当月・前月の発生と確定を読み `.claude/state/metrics/affiliate/rakuten-results.json` へ) を週次 Issue の「週次収益 (NSM)」の楽天行で確認する。収集が失敗・10 日超なら判定不能として Blockers へ。**収集が止まっている週だけ**、オーナーに管理画面の成果レポートを見てもらい `npm run rakuten:record -- --month <YYYY-MM> --orders <件> --estimated-yen <円> [--confirmed-yen <円>]` で記録する。値を推測で入れない |
| 認証付き計測 | `npm run measurement:status` + `.claude/state/metrics/authenticated/latest.json`。48時間超・取得失敗・status-only・成果未取得をBlockersへ分離する。生データはprivate R2、現在の収集状態を過去週の実測にしない |
| 計測→記録→改善サイクル | `.claude/state/metrics/measurement-cycle/{LATEST.md,triage-latest.json}`（週次メトリクス Issue の「🔁」節と同じ。GA4 回遊・GSC 判定目印・PSI / Cloudflare / SNS の週次要約を含む）。state の週が当週と違う・ゲート fail・無人記録の未実行は Blockers、未登録 custom dimension の登録と再ログインはオーナー作業として申し送る。個別の再照会は `node .claude/scripts/metrics/ga4-query.mjs` |
| データ品質キュー | `.claude/state/data/data-quality/{LATEST.md,queue.json}`（`ranking-integrity-audit-weekly` が毎週生成。`npx tsx packages/ranking/src/scripts/build-data-quality-queue.ts` で再生成）。処置 1 誤り〜4 noindex 候補の件数を前週と比べ、「新規検出 ≤ 処置件数」かを書く (DATA-QUALITY-LOOP-01)。2〜4 は配信年からの推定候補で、公式の最新公表は未照会 |
| 計画差分 | `.claude/todo/weekly.md` |
| note画像資産 | `npm run note:images:audit -- --json` の `summary` (追跡PNG枚数・容量、再生成元なしの内訳、ランキング記事のデータ契約違反数)。`findings` が1件でもあれば原因を `.claude/rules/note-image-assets.md` の契約番号で示す。追跡PNGが前週より増えていれば理由を確認する(予算は縮小専用)。週次CIの結果は `note-circulation-audit` artifact の `note-image-assets.json` |
| noteカード表示 | `npm run note:cards:audit -- --browser-verify --previous .claude/state/metrics/note/card-visibility-latest.json --output .claude/state/metrics/note/card-visibility-latest.json` の `summary`。公開HTMLで空の候補はブラウザ描画で確定し、カード前の余分な空段落も検出。ブラウザ検証失敗があれば `--retry-unknown-from <直前report> --output <同report>` で失敗記事だけ再確認。取得・検証失敗は0件扱いしない。スクショは異常時だけ `--screenshots /tmp/note-card-screenshots --max-screenshots 3` で一時取得 |
| ページUI週次確認 | `.claude/state/metrics/page-quality/ui-review-latest.json` (`page-quality-audit-weekly` が毎週日曜に更新)。`auditGeneratedAt` が当週か、`reviewStatus`、`readCoverage` の読んだ切り出し / 読むべき枚数、agent 指摘件数 (`findings`)、新規の機械検出件数 (`newViolationCount`) を書く。監査が当週に無い・`reviewStatus` が `not-run`/`blocked`・読み残し (`readCoverage.unreadScreens`) がある週は Blockers へ。読み残したページは確認済みに数えない。正典 `.claude/rules/page-quality-standards.md` |
| 事業計画 | `.claude/state/business-plan/latest.json` + `packages/data-configs/src/business-plan/` |
| モデル使用量 | `npm run model-usage:collect && npm run model-usage:report` → `.claude/state/metrics/model-usage/latest.json` の `proposals` / `canary`。提案は採否だけ決め、frontmatter・workflow は canary 合格を見てから変える (`.claude/rules/model-prompting.md`「継続最適化サイクル」)。canary 未実施で費用の大きい提案は今週の Should に 1 件まで |
| Kindle | `config/kdp-listings.json` + `.claude/state/products/{sales-ledger,kdp-weekly-publication}.json` |

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
5. 未完了は削除せず、次週へ渡す理由とownerを記録する。Mustの達成数は「Must N/M」の形で書く（週次メトリクスIssueの連続未達計測がこの形を読む）。Mustの結果表は1行1件で「| Must N | <タスク> `<主ID>` | <S/M/L> | **未達** / 完了 | <証拠> |」の形にする（DG082が未達行の主IDを読み、次週計画の再掲を止める）。2週連続で残ったMustは、申し送りに分割案か降格を書く。申し送りの各項目は末尾に「→ 振り分け: <カード ID / EXP-NNN / #Issue / 定常 / 見送り (理由)>」を書く（2026-W40 から必須。正本 `.claude/config/review-wiring.json`。カード ID は backlog / improvements に実在するもの、行き先が無ければ先にカードを起票する）。
6. search-growth候補は最大3件（technical/blocker、acquisition/content、measurementを原則各1件）だけ審査する。
7. CTR候補はpage×query、現行title/content、past effectを確認する。大量title書換えを提案しない。
8. 候補は人間承認前に改善バックログへ追加しない。search-growth候補のWIP（approved / in-progress）は5以下を守る（`triage.mjs` の `WIP_LIMIT`。improvements.md全体の上限10件とは別）。
9. gsc/coverage/inspectionがfreshで候補がある週は、最大3件を審査し、最低1件を`search-growth:approve`または`search-growth:dismiss`で記録する。採用を強制せず、採用しない場合もdismiss理由を残す。
10. KPIツリーを判定する（`LATEST.md` の「KPI ツリー」節、正典は収益化戦略 §1.1）。今月の重点レーンのKPI（★）は、今週の値・4週前（窓が重ならない週）との比較・ぶら下がる施策を書き、動いた/動かなかったを1文で判定する。値が `not-connected` / `missing` / `stale` / `degraded` のKPIは0と読まず、理由を書いてBlockersに入れる。ガードレールが悪化した週は、重点に関係なく是正を次週Mustの候補にする。
11. 施策の配線を確認する。「重点レーンのKPIなのに施策が0件」「KPI未接続」「active上限超過」が出ていれば、申し送りに対処（施策の起票・降格・判定）とIDを書く。
12. 🔴 の着手順を確認する。週次メトリクス Issue の「サイクルの健全性」節 (DG083 の行) で、🔴 の上位 3 枚 (オーナー作業を除く) がこの週の Must に入り、どこまで進んだかを 1 枚 1 行で書く。
    上位が 2 週続けて進まなければ、申し送りに「分割する・順番を入れ替える・🟡 へ下げる」のどれかを理由付きで書く (並び替え自体は月次計画か、オーナーの判断)。

## Phase 3: 記録

`reference/runbook.md`の「出力フォーマット」を使い、次を含める。

- 計画 vs 実績
- 成果ハイライト
- 開発・コンテンツ実績
- NSM（週次収益）/ GA4 / GSC / SNS
- KPIツリー（重点KPIの今週値・非重複比較・判定、ガードレールの悪化、判定不能のKPIと理由、施策の配線状況）
- 🔴 の着手順（上位 3 枚の今週の進み具合と、止まっている理由）
- 計測→記録→改善サイクル（回遊率・業務文脈の着地・無人記録で閉じた/更新した施策・オーナー作業）
- search-growth候補（期間・証拠・制約・承認待ちを明記）
- 課題、繰り返しパターン、学び
- 来週への申し送り
- 参照したsnapshot / backlog ID / file
- 事業計画のready/in-progress、開始ゲート、計測欠損、Go/Pivot/Stop判断
- KDP公開ゲート（S1 live数、4週販売/KENP計測、需要シグナル、当週候補、停止理由）
- note画像資産（追跡PNGの枚数・容量と前週差、再生成元を持たない追跡PNGの内訳、ランキング記事のデータ契約違反数。違反があれば契約番号と該当記事を示す。正典 `.claude/rules/note-image-assets.md`）
- noteカード表示（検査記事数・ブラウザで確定した空白カード数・余分な空段落数・未確認カード数・影響記事数・取得/ブラウザ検証失敗数・新規/継続/解消。検証失敗があれば解消数は判定不能として扱う。詳細は `.claude/state/metrics/note/card-visibility-latest.json`）
- ページUI週次確認（監査日、レビュー状態、読んだ切り出し / 読むべき枚数と読み残し画面、agent 指摘件数、新規の機械検出件数。詳細は `.claude/state/metrics/page-quality/ui-review-latest.json`）

恒久的な失敗知見だけを`/knowledge`へ渡す。改善施策statusの更新は`improvement-triage`へ渡す。
`.claude/todo/weekly.md`はレビュー中に書き換えない。

保存後に接続ゲートを実行する。

```bash
node .claude/scripts/gsc/audit-operations-cycle.mjs --stage review --week [YYYY-Www] --write --strict
```

FAILが残る場合はレビューを「完了」と報告せず、出力された次アクションをBlockersに残す。

続けてレビューの契約 (必須見出し・申し送りの振り分け・期限) を検査する。同じ検査が docs:check (DG084) と
毎朝の `review-cadence-guard.yml` でも走る。error が残る間は完了と報告しない。

```bash
node .claude/scripts/management/check-review-cadence.mjs
```

## Phase 4: 次週計画

レビュー保存後、ユーザーの依頼範囲に週次計画が含まれる場合だけ`/weekly-plan`を実行する。
レビュー単独依頼で計画まで勝手に作らない。

## Gate

- review fileのweek、snapshot期間、参照pathが一致する。
- KPIはfinalized7d、候補はrolling28dという用途が明記されている。
- 重点レーンのKPIすべてに判定か判定不能の理由があり、rolling28dを隣接週と比べていない。
- 実測の無い数値・効果・完了を記録していない。
- search-growth候補は最大3件で、未承認候補を`.claude/todo/improvements.md`へ自動追加していない。
- current-weekの未完了項目を申し送りへ反映している。
- 事業計画stateが当週に生成され、未計測・手動・部分計測を区別している。
- KDP週次stateが当週に生成され、未計測と計測済み0を区別し、候補が最大1冊である。
- KDPの実公開を週次レビュー単独の副作用として実行していない。
- GSC証拠がfreshで候補がある場合、approve/dismissが最低1件記録されている。
- 保存先が`reference/reviews/YYYY-Www.md`である。
- `check-review-cadence.mjs` が error 0 (必須見出し・申し送りの振り分けを含む)。

## Output Contract

chatは`Week | Saved review | Key result | Blockers | Unmeasured`の1表、各セル2行以内。
