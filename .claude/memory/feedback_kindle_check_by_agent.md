---
name: feedback_kindle_check_by_agent
description: Kindle の表示確認はオーナーに頼まず、エージェントが capture-pages.mjs --all で全ページを撮って目で確かめる (2026-11-04 指摘)
metadata:
  type: feedback
---

本の表示確認は `node .claude/scripts/kdp/capture-pages.mjs <id> --version <版> --all` を先に回す。Kindle Previewer の確認をオーナーへ頼まない。

**Why:** 規約に手順があるのに飛ばしてオーナーへ頼んだ。実際に回すと、県名の折り返しと、図が 0 点の本に図の見方の定型文が入っている不具合が見つかった。はみ出しの数だけでは見つからず、画像を見て見つけた。

**How to apply:** 数字の検査が通っても、表の章と前付けの画像を必ず読む。「検査 0 件」は検査の対象を確かめてから信じる (全県表の見出しだけを探していて表 0 件と出た)。関連: [[project_kindle_publishing_factory]]
