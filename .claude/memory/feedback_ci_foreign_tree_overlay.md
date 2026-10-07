---
name: feedback-ci-foreign-tree-overlay
description: "CI が main で生成し /tmp 経由で develop へコピーすると、main の遅れの分だけ develop の state を古い版へ戻す。run は success のまま。見分け方は blob が run の headSha と一致するか"
metadata:
  node_type: memory
  type: feedback
---

**別 ref の作業ツリーで作ったファイルを develop へコピーしてはいけない。** コピー元には、develop にしか無い
他 workflow の更新が入っていない。

## 実測した被害 (2026-10-05 発見)

- `fetch-metrics-weekly` は main を checkout して計測し、当時の旧置き場 `.claude/state/metrics/` 全体を /tmp へ退避して develop へ上書きコピーしていた。W40 (e45f5a0ee) は main が develop より 77 コミット遅れていたため、15 ファイル (page-quality 週次監査・KSJ 月次記録など) を main の版へ戻した。main と develop がそろっていた W37〜W39 は 0 件。
- 同じ形の `psi-audit-daily` / `cloudflare-usage-daily` は、前日以前の history 行を毎日失っていた。psi の history は 4 月以降 55 日分が欠けていた。
- どの run も success で、DG084 (月次ジョブ記録の欠落) で全員のコミットが止まって初めて気づいた。

## 見分け方

巻き戻しを疑うファイルについて、コミット後の blob を `gh run list` の `headSha` (= run が checkout した版) の blob と比べる。一致し、かつ親コミットでの最終更新がその版に含まれていなければ、上書きコピーによる巻き戻しと判定できる。rebase の解決ミスであれば、run の checkout 版と blob が一致することはない。

## How to apply

- develop へ commit-back する workflow は develop を checkout し、その上で生成する。main で何かを判定する必要があるなら、判定にだけ使い、develop へ切り替えてから生成し直す (`deploy-workers` の improvement-log)。
- 契約は `.claude/scripts/lib/workflow-commit-back-core.cjs` の `findForeignTreeRestore`。
- schedule は main 上の workflow 定義で動くので、workflow の修正は develop→main マージまで効かない。

関連: [[feedback_sync_snapshots_checks_out_main]] [[feedback-hand-synced-duplication]]
