---
name: feedback_sticky_aside_max_h
description: "CSS Grid 内の sticky aside には max-h-[calc(100vh-5.5rem)] が必須。削除するとフッターが非表示になる。2度踏んだ。"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3b4ff446-9fde-41ae-93aa-d891c10a0201
---

CSS Grid (`items-start`) 内で `sticky` を使う aside には **`max-h-[calc(100vh-5.5rem)] overflow-hidden/auto` を必ず付ける**。

**Why:** Grid の行高 = 最長列が決める。aside に `max-h` がないと aside の自然高で行高が決まり、本文カラムの末尾でスクロールが終わってもフッターに届かない。subagent が「不要な長いクラス」と判断して除去しやすい箇所。2026-06-06 に commit `5d9afb24` で除去 → revert `a2c76216`・`b18be52a` で修正（blog + category + RightRailWidgets の3箇所）。

**How to apply:** blog/category/ranking の aside を編集するとき、または新規 3カラムページを作るとき、max-h が存在するか確認する。ルール正典: `.claude/rules/ui-components.md`「Sticky aside の max-h 必須ルール」。
