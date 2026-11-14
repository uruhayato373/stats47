---
name: feedback-codex-delegation-token-saving
description: Claude のトークンを節約したいとき、読み取りの確認や調査は Codex MCP に分担させる
metadata:
  type: feedback
---

オーナーは Claude (クラウド) のトークンを節約したいので、Codex などに分業させながら進めてほしいと指示した (2026-11-14)。

**Why:** Claude の利用枠を、判断と実装の中心に残したい。

**How to apply:** 差分のレビュー・既存コードの経路調査など読み取りで済む作業は `mcp__codex__codex` (sandbox: read-only) に頼み、結論だけを受け取る。待ちの長い処理は CI に任せ、ログは grep で必要な行だけ読む。書き込みは本体が行う (同じ作業ツリーで複数の書き手を走らせない。[[feedback-shared-working-copy-git-race]])。2026-11-14 の実例では Codex のレビューが出典の補完の変更判定の抜けを見つけた。
