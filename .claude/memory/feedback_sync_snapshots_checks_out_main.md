---
name: feedback_sync_snapshots_checks_out_main
description: sync-snapshots.yml は --ref を渡しても常に main を checkout する。develop の変更は main へマージするまで R2 に反映されない
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 047c9ca7-dd4a-41c7-abc9-9f2060053de2
  modified: 2026-07-24T02:17:28.655Z
---

`sync-snapshots.yml` は checkout ステップが `ref: main` 固定。**`gh workflow run sync-snapshots.yml --ref develop` と
指定しても、実際に読むのは main のファイル**（`--ref` は「どのブランチの workflow 定義を使うか」にしか効かない）。

**Why:** 2026-07-24 に page-components の是正（theme の `rankingLink` / area 47 県）を develop に commit した直後、
マージ前に sync を 2 回実行して無駄にした。両方とも `conclusion: success` / 「453 ファイル push」/
`verify-page-components-snapshot.ts` も「✅ 117/117 一致」と報告するため、**失敗に見えない**のが厄介だった。
実際には main の旧ファイルを push し、旧 vs 旧を比較して「一致」と言っていただけ。R2 は旧内容のまま。
main へマージ後に 3 回目を実行して初めて反映された。

**How to apply:**
- **git TS → R2 の反映は develop→main のマージ後に実行する。** マージ前に走らせても no-op（かつ success を返す）。
- R2 反映の確認は workflow の conclusion ではなく **`npx tsx apps/web/scripts/verify-page-components-snapshot.ts`
  をローカル（= develop の最新ファイル）から実行**して判定する。CI 内の verify は checkout した main と比較するため、
  develop の変更が反映されているかの判定には使えない。
- 「push 成功なのに R2 が旧内容」に見えたら、まず `.github/workflows/<wf>.yml` の checkout `ref:` を疑う。
  CDN キャッシュや `saveToR2` / `diff-push-r2` の順序を疑う前にここを見る（今回そこで時間を使った）。

関連: [[project_r2_writes_ci_only]] / [[feedback_fetch_origin_before_implementing]]
