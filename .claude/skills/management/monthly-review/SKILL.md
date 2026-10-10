---
name: monthly-review
domain: strategy
description: 月次レビューを生成する。前月の週次レビュー・計測サイクルの履歴・効果判定・KPI ツリーを集約し、前月の重点の判定と来月への申し送りを記録する。Use when user says "月次レビュー", "先月の振り返り", "月次の振り返り".
primary_agent: strategy-advisor
---

# monthly-review

前月を締める振り返り。週次レビュー 4〜5 本と計測→記録→改善サイクルの state を集約し、
`data/reviews/monthly/YYYY-MM.md` へ保存する。
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
| 前月の週次レビュー | `data/reviews/weekly` のうち、木曜が対象月に入る ISO 週。各本の「計画 vs 実績」の Must 比、「KPI ツリー」、「来週への申し送り」 |
| 前月の月次計画 | `.claude/todo/monthly.md`。既に今月分へ上書きされていれば `git log -1 --format=%H --before=<今月>-01 -- .claude/todo/monthly.md` の版を `git show <sha>:.claude/todo/monthly.md` で読む |
| 計測サイクルの週次履歴 | `data/measurement-cycle/history.csv` の対象月の週。KPI の値はここを正典にし、週次レビュー本文の数値を再集計しない |
| 効果判定 | `data/effect-verdict` の対象月の週の `verdicts-YYYY-Www.json`。判定と `guards` をそのまま使う |
| KPI ツリー | `data/business-plan/kpi-tree.json` (重点レーンの駆動 KPI とガードレール) |
| 楽天アフィリエイト成果 | `data/affiliate/rakuten-results.json` の対象月の行。`observedAt` が月をまたいだ後なら確定として扱う。収集が止まっていれば判定不能と書く |
| 改善施策 | `.claude/todo/improvements.md` の active 施策と上限 |
| 収益 (楽天以外) | `data/affiliate/a8-results.json`・`data/affiliate/moshimo-results.json` (afb は認証付き計測の `afb`)、商品は `data/products/sales-ledger.json`、KDP は月次レポート (`kdp-monthly-reports.mjs` の出力)。各週の合計は `node .claude/scripts/metrics/generate-weekly-metrics-issue.mjs --week <YYYY-Www>` の「週次収益 (NSM)」節 |
| NSM 改善実験 | `data/business/experiments.json` の `status` と `next_check_date`。対象月までに期日が来た running / proposed |
| 事業計画 | `data/business-plan/latest.json` の `nextActions` と開始ゲート |
| 月次の自動処理 | `data/ci/monthly-jobs` の各ジョブ (`ksj-catalog`・`estat-catalog`・`ctr-improvement`・`cloudflare-snapshot`) の対象月の記録。`status` (ok / skipped / failed)・`runUrl`・`summary` (CTR は改善候補の本文) を読む。Cloudflare の費用の中身は `data/cloudflare/monthly-snapshots` (請求サイクル開始月の名前) |
| 月次の定点観測 | `/competitor-scan` の `.claude/skills/sns/competitor-scan/reference/reports` (対象月の日付のレポート)、X の勝ちパターンの月次レポート |
| 開いているアラート | `gh issue list --label auto-generated --state open` (横断監視 #763 を含む) |
| GSC の月次接続 | `node .claude/scripts/gsc/audit-operations-cycle.mjs --stage monthly` |

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
5. **収益の締め**: 収益源ごと (楽天・A8・もしも・afb・商品・KDP) に対象月の発生と確定を表にする。値が無い源は
   「判定不能」と書き理由 (認証切れ・未計測) を添える。合計は判定できた源だけで出し、判定不能を 0 円と足さない。
6. **実験の判定**: 期日が来た実験ごとに、継続・終了・延長 (延長理由と次の期日) を書く。判定の更新は `/nsm-experiment` に渡す。
7. **点検と Issue**: 開いている `auto-generated` Issue を 1 件 1 行で、振り分け (カード ID / 定常 / 見送り) を付ける。
   月次の自動処理 (Cloudflare・CTR・カタログ) と定点観測 (競合・X) が対象月に走ったかもここに書く。走っていなければ課題・ブロッカーへ。
8. **計測→記録→改善サイクル**: 対象月の各週で、計測 state の生成・無人 triage のゲート・週次レビューの有無が揃ったかを表にし、
   止まった段と週を書く (週次メトリクス Issue の「サイクルの健全性」節と同じ段の名前を使う)。

## Phase 3: 記録

`data/reviews/monthly/YYYY-MM.md` に次の形で保存する。見出しは `review-wiring.json` の `requiredSections` と一致させる。

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

## 収益の締め
| 収益源 | 発生 | 確定 | 状態 (判定済み / 判定不能と理由) |

## 施策の効果判定
| 判定 | 件数 | 施策 ID |

## 実験の判定
| 実験 | 期日 | 判定 (継続 / 終了 / 延長) | 根拠 |

## 計測→記録→改善サイクル
| 週 | 計測 state | 無人 triage | 週次レビュー | 止まった段 |

## 点検と Issue
| Issue / 自動処理 | 状態 | 振り分け |

## 課題・ブロッカー

## 来月への申し送り
- <やること> → 振り分け: <カード ID / EXP-NNN / #Issue / 定常 / 見送り (理由)>

## 参照
<読んだ state・レビュー・コミットのパス>
```

「点検と Issue」は、各アラート Issue のコメントに付いた「→ 振り分け:」を写す (振り分けの正本は Issue のコメント)。
振り分けの無いアラートは、このとき Issue にコメントで付けてから表に載せる。検査:

```bash
node .claude/scripts/management/check-alert-triage.mjs
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

- 保存先が `data/reviews/monthly/YYYY-MM.md` で、必須見出しがすべてある。
- 申し送りのすべての項目に実在する行き先がある。
- KPI の数値は計測 state の値で、判定不能を 0 にしていない。
- 効果判定を新しく下していない (エンジンと improvement-triage の判定を写しただけ)。
- 収益の締めで判定不能の源を 0 円にしていない。期日の来た実験すべてに判定か延長理由がある。
- 開いている `auto-generated` Issue と月次の自動処理がすべて「点検と Issue」で振り分けられている。
- `check-review-cadence.mjs` が error 0。

## Output Contract

chat は `Month | Saved review | Focus verdict | Blockers | Handoff routed` の 1 表、各セル 2 行以内。
