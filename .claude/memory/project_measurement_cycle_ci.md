---
name: project-measurement-cycle-ci
description: 計測→記録→改善サイクルのCI自動化(2026-09-24)。日曜計測→月曜06:00無人triage→09:00週次Issue。main反映まで日曜側は動かない。無人Claudeは.claude/を書けない(保護パス)ので提案JSON→決定的適用
metadata:
  node_type: memory
  type: project
  originSessionId: cfc716c2-3e72-4829-9d06-bc9944616b5a
  modified: 2026-09-24T11:08:38.797Z
---

GA4 実測で止まっていた判定待ちを処理した手順 (計測→improvements.md へ記録→計測基盤の改善) を 2026-09-24 に CI 化した
(コミット 3ea0fece3 / d297ef217 / df5395859 / e6c716f76。main 反映は PR #1022)。GSC も同じ形:
`gsc-query.mjs` と閾値エンジンの `gsc-improvement` adapter。GSC 施策は行に `[gsc-page: /path]`・`デプロイ済 YYYY-MM-DD`・
`[target: +N clicks]` が揃ったものだけ機械判定される。2026-W38 時点は 10 件中 0 件 (全件目印なし)。

- 計測: 日曜 20:00 JST `fetch-metrics-weekly.yml` が GA4 snapshot (internal-transitions / landing-context / event-volume) と
  `refresh-measurement-cycle.sh` → `build-measurement-cycle.mjs` → `.claude/state/metrics/measurement-cycle/{latest.json,LATEST.md,history.csv}`。
  PSI / Cloudflare / SNS も同じ state に入る (閾値は各 source の既存判定を再利用: PSI は history.csv の violations_*、
  Cloudflare は threshold-check.mjs の evaluateRules、SNS は sns-metrics-store.readByRange)。
  **月曜 06:00 にも作り直す**: sns-metrics-weekly は fetch-metrics-weekly より後に終わる (2026-09-20: 14:33Z → 14:47Z) ため。
  PSI の空スコア行は計測失敗 (0 点扱いしない)、Instagram は impressions が 0 で reach / views に値が入る。
- 記録: 月曜 06:00 JST `improvement-cycle-weekly.yml` が improvement-triage を Claude Code (sonnet) で無人実行。
  個別の内訳は `ga4-query.mjs` / `gsc-query.mjs`。**Claude は台帳を編集せず `.local/ci/improvement-cycle/proposal.json` に提案を書き**、
  `verify-improvement-cycle-run.mjs` が決定的に適用 → ゲートを通った差分だけ develop へ push、失敗は `improvement-cycle-alert`。
  理由: `.claude/` は Claude Code の保護パスで `--permission-mode dontAsk` では allow ルールがあっても書き込みが必ず拒否される
  (公式 permission-modes#protected-paths、2026-09-24 参照)。初回の無人 run 35996605022 は Edit 3 回拒否のまま「変更 0 件・gate pass」で
  success になった。今は書き込み拒否・提案ファイル欠落をゲートが fail にする。提案と最終メッセージは artifact `improvement-cycle-evidence`。
  修正後の初回 run 35999010240 (2026-09-24、W38) で初めて台帳に反映された: 期日超過 3 件のうち COVERAGE-LOOP-01 を削除 (gsc 詳細ログへ判定)、
  TOKEN-AICONTENT-01 / THEME-EXPANSION-EFFECT-01 を更新。数値 3 点を実データと照合して一致 (billing 開始日を 09-01 と書いたが実際は 08-31 の軽微なずれのみ)。
  残った権限拒否 3 件は `cat` と `node -e` の探索 (禁止どおり) で、書き込み拒否ではない。1 run $1.82 相当・46 ターン。
  **同じ構成で `.claude/` を Claude に直接編集させる他の無人 workflow も同じ罠に当たる** (dontAsk なら拒否、bypassPermissions は Bash 許可リストが効かなくなる)。
  目標値は根拠 (過去事例か計算式) が行か詳細ログにあるときだけ書く指示。無人 run が目標値を捏造していないかは初回数回の差分を人が見る。
- 表示: 月曜 09:00 JST 週次メトリクス Issue の「🔁 計測→記録→改善サイクル」節と `/weekly-review` Phase 1。

**Why:** 判定待ちが「GA4 creds のある環境で再試行」のまま期限を越えていた。原因は施策固有の内訳を取る手段が CI に無かったこと。

**How to apply:**
- `fetch-metrics-weekly.yml` の取得段と新 workflow の schedule は **main の定義で動く**。develop だけでは日曜の計測 state も月曜の無人記録も生成されない
  (週次 Issue 生成だけは develop で動く)。main 反映後の最初の日曜で `measurement-cycle/latest.json` の week を確認する。
- 無人 run は Status 列に effect/full|partial|none|adverse を付けられない (ゲートで拒否)。effect の確定は閾値エンジンだけ。
- GA4 Admin 監査 state は README の規約で commit しない。/tmp 経由で派生値 (未登録パラメータ × 発火量) だけを残す。
- 無人 Claude は対話と同じ Max 枠を使う。`claude-usage/history.csv` の `workflow=improvement-cycle` 行で費用対効果を見て、割に合わなければ workflow を止める
  (日次生成ループは歩留まりで 2026-08-21 に削除された前例がある)。
- 自動化できないオーナー作業: custom dimension 登録 (今は home_featured の card_variant/slot/experiment_variant だけが発火量十分)、ASP/KDP 再ログイン、本番デプロイ承認。

関連: [[feedback-ga4-journey-referrer-over-navclick]] [[project_monetization_contract]]
