---
name: monthly-review
domain: strategy
description: 月次レビューを生成する。前月の週次レビュー・計測サイクルの履歴・効果判定・KPI ツリーを集約し、前月の重点の判定と来月への申し送りを記録する。Use when user says "月次レビュー", "先月の振り返り", "月次の振り返り".
primary_agent: strategy-advisor
---

# monthly-review

前月を締める振り返り。週次レビュー 4〜5 本と計測→記録→改善サイクルの state を集約し、
`.claude/skills/management/monthly-review/reference/reviews/YYYY-MM.md` へ保存する。
**今月の重点を決めるのは `/monthly-plan` の仕事**で、月次計画はこのレビューを読んでから作る。

配線の正本は `.claude/config/review-wiring.json` の `cadences.monthly` (保存先・必須見出し・入力・期限)。
毎月 3 日から前月分が必須になり、欠けると Stop hook と `review-cadence-guard.yml` (毎朝 Issue) が知らせる。

## 引数

```
/monthly-review [YYYY-MM]
```

- 月 (任意): 省略時は前月。

## Phase 0: 状態確認

```bash
node .claude/scripts/management/check-review-cadence.mjs
```

対象月の週次レビューが欠けていれば先に `/weekly-review` で埋める。週次の欠落を月次で推測して補わない。

## Phase 1: 集約 (read-only。並列の重い agent は起動しない)

同一セッションの並列 tool call で次を読む。

| 入力 | 読み方 |
|---|---|
| 前月の週次レビュー | `.claude/skills/management/weekly-review/reference/reviews` のうち、木曜が対象月に入る ISO 週。各本の「計画 vs 実績」の Must 比、「KPI ツリー」、「来週への申し送り」 |
| 前月の月次計画 | `.claude/todo/monthly.md`。既に今月分へ上書きされていれば `git log -1 --format=%H --before=<今月>-01 -- .claude/todo/monthly.md` の版を `git show <sha>:.claude/todo/monthly.md` で読む |
| 計測サイクルの週次履歴 | `.claude/state/metrics/measurement-cycle/history.csv` の対象月の週。KPI の値はここを正典にし、週次レビュー本文の数値を再集計しない |
| 効果判定 | `.claude/state/effect-verdict` の対象月の週の `verdicts-YYYY-Www.json`。判定と `guards` をそのまま使う |
| KPI ツリー | `.claude/state/business-plan/kpi-tree.json` (重点レーンの駆動 KPI とガードレール) |
| 楽天アフィリエイト成果 | `.claude/state/metrics/affiliate/rakuten-results.json` の対象月の行。`observedAt` が月をまたいだ後なら確定として扱う。収集が止まっていれば判定不能と書く |
| 改善施策 | `.claude/todo/improvements.md` の active 施策と上限 |

## Phase 2: 判定

1. **前月の重点の判定**: 前月の月次計画の `focus_themes` ごとに、ゴールに対して達成・一部・未達を書く。未達は原因
   (粒度が大きすぎた・依存待ち・予算不足・計測の欠落) を証拠付きで 1 つに絞る。
2. **KPI ツリーの判定**: 重点レーンの駆動 KPI について、月内の週次推移と、4 週前 (窓が重ならない週) との比較を書き、
   動いた・動かなかったを 1 文で判定する。値が `not-connected` / `missing` / `stale` / `degraded` の KPI は 0 と読まず、
   理由を書いて「課題・ブロッカー」へ入れる。NSM (週次収益) の判定不能週を 0 円と書かない。
   領域表 (収益化戦略 §5) の「構えを変える条件」を満たした領域があれば、来月への申し送りに改訂提案として書く。
3. **週次レビューの総括**: 週ごとの Must 達成比、2 週以上続いた未達、週次の申し送りがカード ID に結ばれた割合
   (`check-review-cadence.mjs --json` の `reviews.weekly[].routed`) を表にする。
4. **施策の効果判定**: 対象月の verdict を full / partial / none / adverse / pending ごとに数え、pending は効いている
   ガード (`insufficient-sample` など) を書く。新しい判定をこのスキルで下さない (`.claude/rules/evidence-based-judgment.md`。
   判定の更新は `improvement-triage` へ渡す)。active 施策が上限を超えていれば申し送りに降格候補を書く。
5. **計測→記録→改善サイクル**: 対象月の各週で、計測 state の生成・無人 triage のゲート・週次レビューの有無が揃ったかを表にし、
   止まった段と週を書く (週次メトリクス Issue の「サイクルの健全性」節と同じ段の名前を使う)。

## Phase 3: 記録

`reference/reviews/YYYY-MM.md` に次の形で保存する。見出しは `review-wiring.json` の `requiredSections` と一致させる。

```markdown
# 月次レビュー YYYY-MM

作成日: YYYY-MM-DD / 対象: YYYY-MM-01〜YYYY-MM-末日 (ISO 週 YYYY-Wnn〜YYYY-Wmm)

## サマリー
<前月を 3 文で。最初の文で重点が達成されたかを答える>

## 前月の重点の判定
| 重点 | ゴール | 結果 | 証拠 | 原因 |

## KPI ツリーの判定
| KPI | 月内の推移 | 4 週前比 | 判定 |

## 週次レビューの総括
| 週 | Must | 未達の主 ID | 申し送りの振り分け |

## 施策の効果判定
| 判定 | 件数 | 施策 ID |

## 計測→記録→改善サイクル
| 週 | 計測 state | 無人 triage | 週次レビュー | 止まった段 |

## 課題・ブロッカー

## 来月への申し送り
- <やること> → 振り分け: <カード ID / EXP-NNN / #Issue / 定常 / 見送り (理由)>

## 参照
<読んだ state・レビュー・コミットのパス>
```

「来月への申し送り」の各項目は末尾に `→ 振り分け:` と行き先を必ず書く。カード ID は backlog / improvements に
実在するもの。行き先が無い項目は先にカードを起票する (未分類なら 🟡 で起票してよい)。

保存後に検査を流す。error が残る間はレビューを完了と報告しない。

```bash
node .claude/scripts/management/check-review-cadence.mjs
```

## Phase 4: 月次計画

ユーザーの依頼に月次計画が含まれる場合だけ `/monthly-plan` を実行する。レビュー単独の依頼で計画まで作らない。

## Gate

- 保存先が `reference/reviews/YYYY-MM.md` で、必須見出しがすべてある。
- 申し送りのすべての項目に実在する行き先がある。
- KPI の数値は計測 state の値で、判定不能を 0 にしていない。
- 効果判定を新しく下していない (エンジンと improvement-triage の判定を写しただけ)。
- `check-review-cadence.mjs` が error 0。

## Output Contract

chat は `Month | Saved review | Focus verdict | Blockers | Handoff routed` の 1 表、各セル 2 行以内。
