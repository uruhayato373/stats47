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

既存snapshotがあれば再生成しない。上書きが必要な根拠がある時だけ`--force`を使う。

## Phase 1: 実績収集

収集専用subagentは起動せず、以下5trackを同一セッションの並列tool callで読む。

| Track | SSOT / command |
|---|---|
| 開発 | `git log --since`、`git status --short` |
| コンテンツ | R2 blog/ranking snapshot、topic/remediation queue |
| 性能・流入 | GSC / GA4 / AdSense / SNSの最新snapshot |
| NSM実験 | `.claude/skills/management/nsm-experiment/reference/` |
| 計画差分 | `docs/todo/current-week.md` |

各snapshotの期間、取得日、freshnessを保持する。行が無い場合を推測の0へ変換せず、
`not-measured` / `not-instrumented` / `insufficient-data`を区別する。

詳細なcommand、field、Issue対応は`reference/runbook.md`のPhase 0〜2だけを参照する。

## Phase 2: 差分分析

1. current-weekのcheckboxとgit/R2/snapshot証拠を突合する。
2. Must / Should / Couldごとに完了・未完了・計画外を分ける。
3. KPI変化は同じ定義・同じ期間のsnapshotだけで比較する。
4. effect判定が必要な施策は`.claude/rules/evidence-based-judgment.md`に従う。
5. 未完了は削除せず、次週へ渡す理由とownerを記録する。

## Phase 3: 記録

`reference/runbook.md`の「出力フォーマット」を使い、次を含める。

- 計画 vs 実績
- 成果ハイライト
- 開発・コンテンツ実績
- NSM / GA4 / GSC / AdSense / SNS
- 課題、繰り返しパターン、学び
- 来週への申し送り
- 参照したsnapshot / Issue / file

恒久的な失敗知見だけを`/knowledge`へ渡す。改善施策statusの更新は`improvement-triage`へ渡す。
`docs/todo/current-week.md`はレビュー中に書き換えない。

## Phase 4: 次週計画

レビュー保存後、ユーザーの依頼範囲に週次計画が含まれる場合だけ`/weekly-plan`を実行する。
レビュー単独依頼で計画まで勝手に作らない。

## Gate

- review fileのweek、snapshot期間、参照pathが一致する。
- 実測の無い数値・効果・完了を記録していない。
- current-weekの未完了項目を申し送りへ反映している。
- 保存先が`reference/reviews/YYYY-Www.md`である。

## Output Contract

chatは`Week | Saved review | Key result | Blockers | Unmeasured`の1表、各セル2行以内。
