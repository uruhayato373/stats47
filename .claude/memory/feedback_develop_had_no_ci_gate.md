---
name: feedback-develop-had-no-ci-gate
description: develop への push は長らく無検査で、壊れは次にマージする人が払っていた。2026-08-20 に develop-quality-gate.yml と npm run preflight で是正済み
metadata: 
  node_type: memory
  type: project
  originSessionId: 42a8bf29-b5cd-4361-ade3-b0eede130715
  modified: 2026-08-20T10:38:09.922Z
---

**2026-08-20 以前**: `pr-quality-check.yml` のトリガーは `pull_request: branches: [main]` だけで、
**develop への push は一切検査されていなかった**。pre-commit を通っていない変更がそのまま着地し、
壊れは「次に develop をマージする人」が払う構造だった。

実測 (commit `621131d6c` の一括同期): `MetricFocusCharts.tsx:63` の
react-hooks/set-state-in-effect 違反・未登録 env 4 件 (`PWSH_PATH` / `R2_DEV_GATEWAY*`)・
maintenance debt 1 件が origin/develop に入ったまま残り、マージ担当が 3 サイクル・
十数分を検査待ちに費やした。

**How to apply (現在の姿):**

- develop への push で `develop-quality-gate.yml` が 3 ゲート
  (ESLint / env registry / maintenance debt) を走らせる。job 全体は実測 104 秒
  (大半は npm ci)。
  **ここに重い検査を足さない** — push が詰まると `--no-verify` を誘発して元に戻る。
- commit 前に `npm run preflight` で同じ 3 つを**並列**実行できる (実測 2.7〜11.6 秒)。
  pre-commit は直列 all-or-nothing で 2 分超なので、blocker を 1 つずつ潰すと
  1 個につき 1 サイクル待つことになる。
- **マージ中に落ちたゲートは、まず「継承か自作か」を切り分ける**。
  `git show origin/develop:<file>` で origin 側に既に違反があるかを見れば即座に分かる。

正典: `.claude/rules/branch-workflow.md`「develop への push も高速ゲートを通る」。
注入経路 (Windows で hook が動かなかったのか `--no-verify` か) は特定していないが、
**ゲートは原因に依らず着地点で捕まえる**設計なので特定は不要。

関連: [[feedback-shared-working-copy-git-race]] / [[feedback-mutation-test-passes-wrongly]]
