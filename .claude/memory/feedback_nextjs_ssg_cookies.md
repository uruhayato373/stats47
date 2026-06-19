---
name: feedback-nextjs-ssg-cookies
description: Next.js App Router で layout または layout 配下の Server Component で cookies()/headers()/draftMode() を呼ぶと SSG が崩れて Cloudflare Workers 上で 500 になる。LCP 改善で同じ罠を 2 度踏んだので絶対禁止。
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 644c49b6-fef4-4a1f-b765-303d48c503f4
---

`apps/web/src/app/layout.tsx` または layout から render される Server Component で **`cookies()` / `headers()` / `draftMode()` を呼んではならない**。呼ぶと Next.js が全 route segment を force-dynamic 化し、`ranking/[rankingKey]` 等の SSG ページが Cloudflare Workers 上で 500 を返す。

**Why:** 2026-05-10 EXP-004 で `layout.tsx` を async 化して `cookies()` を呼んだら全 ranking 詳細が 500 で落ち、commit `ebad87c2` で revert された。そのコミットメッセージは詳細だったが、固定ルールとして CLAUDE.md / `.claude/rules/` に書かれていなかったため、2026-05-16 EXP-005 で「今度は layout は sync のまま async Server Component (`CookieConsentBanner`) 側で `cookies()` を呼ぶ」というほぼ同じパターンを再実装してしまった（コミット前に発覚して回避）。「sync layout + async Server Component の cookies()」も dynamic-ness は親に伝播するため EXP-004 と等価。

**How to apply:**
- layout に Server Component を追加する前に `.claude/rules/nextjs-ssg-preservation.md` のチェックリストを通す
- 改善策カタログ §3.A.A1 (Cookie banner SSR + visibility:hidden 切替) は **server で cookie を読まない** 実装（Client component の `useEffect` で document.cookie を見て visibility 切替）を採用する
- "Server で cookie を読んで完全に消す" は GDPR 上必須ではない。Client での visibility:hidden だけで LCP candidate scoring からは除外される
- `next build` 出力で SSG ページが `○ Static` のままか確認する（`ƒ Dynamic` に変わっていたら本ルール違反）
- 関連: [[feedback-lcp-optimization]] (LCP 要素特定の重要性)
