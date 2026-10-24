---
name: feedback_codex_mcp_model_override
description: Codex MCP (0.153.0) は ~/.codex/config.toml の既定 gpt-6-sol だと「ChatGPT アカウントでは未対応」で 400。呼び出しごとに model を gpt-6-astra で上書きすると画像生成が通る (2026-10-23)
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8c27aa2c-cd8e-406f-8c90-55eb08fb8c97
  modified: 2026-10-23T04:23:40.831Z
---

`mcp__codex__codex` を引数 model なしで呼ぶと、`~/.codex/config.toml` の `model = "gpt-6-sol"` が使われ、
`The 'gpt-6-sol' model is not supported when using Codex with a ChatGPT account.` (400) で落ちる。`gpt-5.5` も同じ 400。
呼び出しの `model: "gpt-6-astra"` で上書きすると built-in imagegen が通った (ブログ背景 1 枚)。

**Why:** CLI 本体は 0.162.1 だが MCP は `.mcp.json` で 0.153.0 に固定 ([[codex-mcp]] の規約)。古い MCP サーバーが新しいモデル名を ChatGPT 経路で扱えないとみられる (原因は未確認)。

**How to apply:** ブログ背景・note カバーなど Codex MCP の画像生成で 400「not supported when using Codex with a ChatGPT account」が出たら、config.toml を書き換えずに呼び出しの `model` を `gpt-6-astra` にする。それでも落ちたら `~/.codex/sessions/` の直近の `"model":"…"` から通ったモデル名を探す。
