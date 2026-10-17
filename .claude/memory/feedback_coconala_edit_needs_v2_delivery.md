---
name: feedback_coconala_edit_needs_v2_delivery
description: ココナラ P-* の --commit 編集は販売中の納品版 v2-20260906-r1 が .local にある PC でしか通らない。Mac で v1 から再生成してもハッシュ不一致
metadata:
  node_type: memory
  type: feedback
  originSessionId: e96f5ae7-0e96-4585-a1e6-08eb7889a557
  modified: 2026-10-17T02:26:41.378Z
---

`coconala-edit.mjs --service P-XX --commit` は公開前に `inspectPack` で `_delivery.artifactDirectory` (`.local/coconala-products/P-XX/v2-20260906-r1/`) の manifest ハッシュを照合する。2026-10-17 の Mac にはこの版が無く (v1 と note 用 v3 だけ)、`rebuild-pack-deliveries.mjs --build` で v1 から作り直しても manifest SHA が記録値と一致しなかった (xlsx/pptx の zip に生成時刻が入る)。

**Why:** 出品文と実際の納品物の食い違いを防ぐ不変ゲート。作り直した版で通すと、売っている物と違う物を根拠に公開することになる。

**How to apply:** ココナラの文面反映は、v2 を生成した PC (Windows と推定) で行うか、オーナー判断の例外にする。Mac で作り直した v2 は残さない (同名の不変版と混同する)。あわせて、ココナラのプロファイルは普通の Chrome でログインするため、Playwright で開くときは `--password-store=basic` / `--use-mock-keychain` を外す (`launchContext` で対応済み。[[native_chrome_session_export]])。
