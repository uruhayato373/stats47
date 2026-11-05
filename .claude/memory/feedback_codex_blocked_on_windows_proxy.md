---
name: feedback_codex_blocked_on_windows_proxy
description: 会社の Windows PC の Codex MCP は chatgpt.com への接続が一時的に社内プロキシの 503 になることがある。再試行で通る。ブログの題名を変えると背景が要る
metadata:
  node_type: memory
  type: feedback
  originSessionId: eb4958fe-f37c-428f-bbfd-1dd7c7637ab6
  modified: 2026-11-05T01:14:45.170Z
---

会社の Windows PC の `mcp__codex__codex` は、社内プロキシの警告ページ (503) で止まることがある。2026-11-05 は 2 回止まり、約 40 分後の再試行で 2 枚とも生成できた。1 回の 503 で「使えない」と結論しない (オーナーの指示で再試行して通った)。プロキシの迂回はしない。

**Why:** ブログの AI 背景の promptHash は題名から計算するので、題名を変えた記事は固有背景が無いと公開時に skip される。`quality-gate.mjs` は Windows では `npx` の spawn が失敗して背景の検査を warning に落とすので、push 後に初めて気づく。

**How to apply:** 記事の題名を変える前に `npx tsx apps/web/scripts/check-blog-background.ts --article <path>` で確かめ、背景を先に作る。[[feedback_blog_background_codex_only]]
