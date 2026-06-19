---
name: feedback_d1_path
description: ローカル D1 SQLite の実際のパスは miniflare サブディレクトリにある（ルート直下の .sqlite は 0 バイトダミー）
type: feedback
---

ローカル D1 の SQLite ファイルは `.local/d1/*.sqlite`（ルート直下）ではなく、`.local/d1/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite` にある。ルート直下の `.sqlite` ファイルは 0 バイトのダミーなので絶対に参照してはならない。

**Why:** `.local/d1/*.sqlite` を確認して「データがない」と誤判断し、ユーザーに不正確な報告をした。実際には 1.2GB のデータベースが miniflare サブディレクトリに存在していた。

**How to apply:**
- D1 パスは CLAUDE.md に記載の固定パスを使う。推測しない
- `better-sqlite3` は間違ったパスで空ファイルを自動作成するため、パスの試行錯誤は厳禁
- 存在確認は `find .local/d1 -name "*.sqlite" -size +0` で実ファイルを検索。`ls .local/d1/*.sqlite` だけで判断しない
