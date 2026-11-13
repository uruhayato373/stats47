---
name: sync-snapshots-task-names
description: sync-snapshots の only= は task 名で、カテゴリ一覧(app/category/<key>/items.json)を作るのは master。ranking-items ではない
metadata:
  type: feedback
---

カテゴリ・調査・トップの一覧 (`app/category/<key>/items.json` など) を作り直すのは `sync-snapshots.yml` の `only=master` (`export-master-snapshots.ts`)。`only=ranking-items` はランキング本体 (`app/ranking-items/all.json` と per-key の item/values) を送り直すだけで、一覧は変わらない。

**Why:** 2026-11-11 に economy の `*-budget-share-kakei` 9 件が一覧に入っていなかった際、名前の近さから `only=ranking-items` を本実行し、2,731 ファイルを不要に送り直したうえで一覧は 1,013 件のまま変わらなかった。`.claude/skills/db/sync-snapshots/SKILL.md` の task 表に正しい対応が書いてあったのに、起動前に読まなかった。

**How to apply:** R2 を書く workflow を起動する前に、SKILL.md の task 表で「何を作る task か」を確かめ、承認を得た対象と一致するか照合してから本実行する。取り違えを機械で拾うのは `audit-ranking-data-integrity.ts` の「所属漏れ」(all.json で有効なのに category の items.json に無いキーを数える)。週次の `ranking-integrity` が毎週回す。[[ranking-publish-pipeline-gap]] も参照。
