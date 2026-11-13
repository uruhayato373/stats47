---
name: feedback_note_profile_launch
description: note の専用プロファイルは素の Chrome で開かない。CDP が要るときは Playwright 経由で起動する
metadata:
  type: feedback
---
`.local/playwright-note-profile` は Playwright が鍵を差し替えて保存している。2026-11-04 に素の Chrome で `--remote-debugging-port` 付きで開いた直後、Cookies に note.com の行が 1 つも無くなり 401 になった (開く前の状態は未確認で、素の起動が原因かは断定できない)。`.local/playwright-note-state.json` の Cookie を入れ直して `stats47` で復旧した。

**Why:** ここが切れると土曜の認証付き計測と note の公開の両方が止まる。
**How to apply:** `NOTE_BU_CDP` を使うときは `node .claude/scripts/note/launch-note-cdp.mjs` で起動する (Playwright の `launchPersistentContext` に `--remote-debugging-port` を渡し、ダイアログの競合で落ちない保護とアカウントの照合を持つ。手書きの起動スクリプトを作らない)。ログインが無ければパスワードを入れず、保存済みセッションの有無を見てからオーナーに頼む。
