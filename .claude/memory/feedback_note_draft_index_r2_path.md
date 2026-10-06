---
name: feedback_note_draft_index_r2_path
description: note-draft-index.json に新規ドラフトを登録するとき r2_path を入れると sync-note-r2.yml が「移送済み」と見なし R2 へ移さない
metadata:
  node_type: memory
  type: feedback
  originSessionId: 9f8ea632-e928-4ff0-8f91-4bb1c4096ec9
  modified: 2026-09-29T08:19:32.302Z
---

新規 note ドラフトを `data/note/note-draft-index.json` に登録する際、既存エントリを真似て `r2_path` を入れると、`sync-note-r2.yml` の pending 判定 (`!v.r2_path && docs/31 に実在`) から外れ、R2 へ移送されず docs/31 に残る。run は success・pending 0 で終わるので失敗に見えない (2026-09-29、財政 note #12/#13 で発生。R2 は 404)。

**Why:** `r2_path` は「R2 に移送済み」の印として sync が使っている。登録時に書くと未移送なのに移送済み扱いになる。

**補足 (同日判明):** 有料ドラフトは `r2_path` が無くても `sync-drafts-r2.mjs` が「paid draft must not be uploaded to public R2」で拒否するため、公開までは docs/31 (git) に残る。原稿が参照する派生 PNG は git に入れない規則 (DERIVED_PNG_TRACKED) なので、PNG の無い環境では MISSING_REFERENCE で pre-commit と PR 検査が止まる。公開→private R2 移送までは `.claude/config/asset-policy-baseline.json` に該当参照を仮登録し、移送時に外す。

**How to apply:** R2 へ移したい新規ドラフトは `r2_path` なしで登録し、push 後に R2 の実体 (storage.stats47.jp で 200) を確認する。git に残す運用で良い場合は、公開時に `restore-from-r2.sh` を使わず git pull で取得する。関連: stats47 は PUBLIC リポジトリで、有料 note 原稿を commit すると有料部分が GitHub 上で読める ([[project_note_publish_flow_2026_06]])。
