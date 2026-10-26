---
name: project-measurement-cycle-ci
description: 計測→記録→改善サイクル。2026-10-26から土曜02:00にCIが前週を計測、07:00にMacが認証付き計測、レビューの中でstate作り直し・improvement-triage・週次要約。CIの無人triageと週次要約workflowは撤去。scheduleはmainの定義で動く
metadata:
  node_type: memory
  type: project
  originSessionId: cfc716c2-3e72-4829-9d06-bc9944616b5a
  modified: 2026-10-26T01:40:00.000000Z
---

GA4 実測で止まっていた判定待ちを処理した手順 (計測→improvements.md へ記録→計測基盤の改善) を 2026-09-24 に CI 化し、
2026-10-26 に記録の段を土曜の週次レビューへ戻した (CI 整理の第 2 段階)。GSC 施策は行に `[gsc-page: /path]`・`デプロイ済 YYYY-MM-DD`・
`[target: +N clicks]` が揃ったものだけ閾値エンジンの `gsc-improvement` adapter が機械判定する。

- **曜日**: 前週 (月〜日) を土曜に計測し、同じ土曜にレビュー・来週の計画を書く (2026-10-10 に金曜計測・土曜レビューを決め、2026-10-26 に計測も土曜の朝へ寄せた)。
  レビューの期限は `review-wiring.json` (`dueWeekday: 6`・`graceDays: 1`) が正本で、土曜当日は催促、日曜の朝から review-cadence-guard が Issue にする。
- 計測: 土曜 02:00 JST `fetch-metrics-weekly.yml` が前週の GA4 / GSC / AdSense snapshot と、
  `refresh-measurement-cycle.sh` → `build-measurement-cycle.mjs` で `data/measurement-cycle/{latest.json,LATEST.md,history.csv}` を作る。
  PSI / Cloudflare / SNS も同じ state に入る。
- 記録: 土曜の `/weekly-review` Phase 0b。Mac が 07:00 に取った認証付き計測を入れるため state をローカルで作り直し、
  `improvement-triage` agent が期日超過と閾値エンジンの確定分を台帳に直接書く。週次要約 (`generate-weekly-metrics-issue.mjs`) もレビューで出す。
  撤去したもの: `improvement-cycle-weekly.yml` (無人 Claude + 提案 JSON + `verify-improvement-cycle-run.mjs` のゲート)・`weekly-metrics-issue.yml`・`triage-latest.json`。
  無人 run の実績は 1 回 $0.2〜$2・処理 0〜8 件で、10-16 は提案 0 件のまま期日超過を処理しなかった。

**Why:** ログインが要る計測を土曜に寄せると、認証付き計測 (07:00) の後に記録する必要があり、CI で順序を保つより
オーナーが居るレビューの中で行うほうが単純だった。無人 Claude は `.claude/` (保護パス) に書けず、提案 JSON を経由する回り道が要っていた。

**How to apply:**
- ローカルで `refresh-measurement-cycle.sh` を動かすとき、GA4 Admin 監査は `GA4_PROPERTY_ID` が要る。Mac の `.env.local` には無いので、
  スクリプトが CI の外に限って `site-config.cjs` の値を使う (CI は既定値に頼らず設定漏れで止める)。無いと custom dimension の行が `unreadable` に落ちる。
- `fetch-metrics-weekly.yml` の schedule は **main の定義で動く**。曜日を変えたら main 反映後の最初の土曜に `latest.json` の week が前週か確かめる。
- Status 列に effect/full|partial|none|adverse を付けない。effect の確定は閾値エンジンだけ。
- GA4 Admin 監査 state (`.claude/state/metrics/google-admin/`) は README の規約で commit しない。
- **`.claude/` を Claude に直接編集させる無人 workflow は保護パスの罠に当たる** (dontAsk なら拒否、bypassPermissions は Bash 許可リストが効かない)。
  2026-09-24 の初回 run 35996605022 は Edit 3 回拒否のまま「変更 0 件・gate pass」で success になった。
