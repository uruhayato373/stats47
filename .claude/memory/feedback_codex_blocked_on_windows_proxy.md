---
name: feedback_codex_blocked_on_windows_proxy
description: 会社の Windows PC では Codex MCP が chatgpt.com をプロキシに止められ 503。ブログの題名を変えると背景を作れず公開が skip される
metadata:
  node_type: memory
  type: feedback
  originSessionId: eb4958fe-f37c-428f-bbfd-1dd7c7637ab6
  modified: 2026-11-05T00:57:48.426Z
---

会社の Windows PC では `mcp__codex__codex` が社内プロキシの警告ページ (503) で止まり、画像を生成できない (2026-11-05)。迂回しない。

**Why:** ブログの AI 背景の promptHash は題名から計算するので、題名を変えた記事は固有背景が無いと公開時に skip される。`quality-gate.mjs` は Windows では `npx` の spawn が失敗して背景の検査を warning に落とすので、push 後に初めて気づく。

**How to apply:** 記事の題名を変える前に `npx tsx apps/web/scripts/check-blog-background.ts --article <path>` で確かめる。背景を作れない環境では題名を保ち、新しい訴求は seoTitle に置く。背景を作るなら Mac で行う。[[feedback_blog_background_codex_only]]
