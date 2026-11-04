---
name: feedback_r2_write_pending_replaced
description: concurrency r2-write の順番待ちは 1 本だけ。後から入った run が待機中の run を cancelled にするので、前の run の完了を待ってから次を起動する
metadata:
  node_type: memory
  type: feedback
  originSessionId: eb4958fe-f37c-428f-bbfd-1dd7c7637ab6
  modified: 2026-11-04T06:43:39.317Z
---

`r2-write` の concurrency を使う workflow (regenerate-blog-svgs・blog-auto-publish など) は、実行中 1 本・待機 1 本しか持てない。待機中に別の run が入ると、前の待機は黙って `cancelled` になる。

**Why:** 2026-11-04 に source-repair を起動した直後に記事を push し、blog-auto-publish が入って repair が cancelled になった。`cancel-in-progress: false` でも待機中の run は守られない。

**How to apply:** R2 に書く run を続けて起動するときは、前の run の完了を確かめてから次を起動する。develop への `contents/blog` の push も run を起動する。結果が `cancelled` なら失敗ではなく取り消しとして、ログを読まずに起動し直す。[[feedback_ci_cancelled_looks_like_failure]]
