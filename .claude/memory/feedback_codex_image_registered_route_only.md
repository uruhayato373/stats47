---
name: feedback-codex-image-registered-route-only
description: Codex で画像を作るのは試作でも config/image-generation-routes.json に登録した経路だけ。MCP 直呼びは検査で止まらない
metadata:
  node_type: memory
  type: feedback
  originSessionId: 18228b29-cd09-4a83-9c8d-9dba5e3375f0
  modified: 2026-11-06T08:15:06.177Z
---

Codex の画像生成は、試作でも `config/image-generation-routes.json` に登録済みの経路だけを使う。新しい用途は先に経路を登録してから作る。`mcp__codex__codex` に手書きプロンプトを渡して済ませない。

**Why:** 2026-11-06 に経路を一本化した当日、ランキングカードの絵の試作で未登録のまま Codex を直接呼び、オーナーに止められた。`check-image-generation-routes.mjs` は画像 API を直接呼ぶコードを止めるもので、会話からの MCP 呼び出しは止めないので、機械では気づけない。

**How to apply:** Codex を呼ぶ前に、用途が `routes` にあるか確かめる。無ければ呼ばずに、経路の登録をオーナーに諮る。「スクラッチパッドだけだから例外」と判断しない。関連: [[feedback-blog-background-codex-only]]
