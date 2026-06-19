---
name: backlog-ranking-key
description: "docs/22_YouTube企画/backlog/ の `関連 ranking_key:` 行は AI 自動生成名のまま実在 metric と乖離するケースあり。執筆 → 制作前に必ず metrics.key 実在チェック"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 69ea2f2c-4744-4552-b09e-e35323e5abc5
---

2026-05-17 の audit で、14 ファイル中 14 ファイルで `関連 ranking_key:` が `metrics.key` に不在だった。

**Why**: backlog は AI が自動生成しがちで、それっぽい英語 key を作るが実在の metric_key と一致しない (例: `aging-rate` 不在 / 正解は `aging-index`、`average-annual-income` 不在 / 近似は `per-capita-kenmin-shotoku-h27`)。`/publish-youtube-normal <key>` 実行時に `metric not found` で即死する。

**How to apply**:
- 新規 backlog 作成時、または既存 backlog を実行する前に必ず:
  ```bash
  sqlite3 .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite \
    "SELECT 1 FROM metrics WHERE key='<KEY>';"
  ```
- 不在の場合は近似テーマで `WHERE title LIKE '%<keyword>%' OR key LIKE '%<pattern>%'` 検索で代替を探す
- 適切な代替が無い場合は `TODO: ranking_key 要見直し` 注釈を追加 (本 audit で 4 件 = 半導体 / 地震頻度 / 大学進学率 / インバウンド)
- backlog ファイル一括チェッカ:
  ```bash
  for f in docs/22_YouTube企画/backlog/*.md; do
    key=$(grep -E "^- \*\*関連 ranking_key" "$f" | sed 's/.*: //' | tr -d ' `*')
    [ -z "$key" ] && continue
    exists=$(sqlite3 .local/d1/v3/d1/... "SELECT 1 FROM metrics WHERE key='$key';")
    [ -z "$exists" ] && echo "❌ $(basename $f) → $key"
  done
  ```
- 2026-05-17 audit で 10/14 を実在 key へ修正、4/14 に TODO 注釈追加 (commit `669f9293`)

**関連**: [[feedback_skill_schema_drift]]
