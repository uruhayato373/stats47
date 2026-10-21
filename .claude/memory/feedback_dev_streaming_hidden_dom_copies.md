---
name: feedback-dev-streaming-hidden-dom-copies
description: "localhost の DOM 検査では本文が hidden の `body > div[id^=\"S:\"]` にもう 1 組残り、h1・表の行・リンクが 2 倍に数えられる。数える前に可視の木 (`body > div.relative`) に絞る"
metadata:
  node_type: memory
  type: feedback
  originSessionId: d3c7e2bb-de58-44a0-94f7-7f3ab787b91e
  modified: 2026-10-21T10:17:49.138Z
---

`npm run dev:web` (Next 15 + Turbopack) で描いたページは、ストリーミングの途中結果が `body` 直下の
`<div hidden id="S:2">` などに残り、本文の h1・表・リンクがもう 1 組 DOM に入っている。
`document.querySelectorAll('main table tbody tr')` などをそのまま数えると 2 倍になる
(2026-10-21: 市区町村ページの表 171 行が 342 行、h1 が 2 個に見えた。県ページ `/areas/37000` でも同じで、変更による重複ではなかった)。

**Why:** 件数の倍増を「本文を 2 回描いている不具合」と誤認して原因を探しに行きかけた。

**How to apply:** localhost の画面検査で件数を数えるときは、可視の木 `document.querySelector('body > div.relative')` を root にする。
重複を疑ったら、写しの祖先が `body > div[hidden][id^="S:"]` か (`hidden` 属性・高さ 0) を先に確かめ、同じ現象が既存ページにもあるかを比べる。
関連: [[feedback-dev-server-web-only]]
