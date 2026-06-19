---
name: CI で remote D1 にクエリしたい場合は wrangler d1 execute --remote --json を直接使う
description: pull-remote-d1.ts は CI で動かない (better-sqlite3 がローカルディレクトリを開けない)
type: feedback
originSessionId: c8f7304c-235d-4e27-ad61-b3075b33f5a5
---
CI で D1 データを参照するスクリプトを書くときは、`packages/database/scripts/pull-remote-d1.ts` 経由（`npm run pull:d1`）を使ってはいけない。

**Why**: pull-remote-d1.ts は better-sqlite3 でローカル `.local/d1/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite` を開く設計。CI 環境にはこのディレクトリが存在せず `TypeError: Cannot open database because the directory does not exist` で即死。mkdir で作っても schema が無いので INSERT もできない。

**How to apply**: CI では `npx wrangler d1 execute stats47_static --remote --env production --json --command "<SQL>"` で remote D1 を直接クエリし、結果 JSON を Node.js で parse する。実例: `apps/web/scripts/sync-known-keys-from-remote.ts`（Phase 9 P2-A、2026-04-26 新設）。

ローカル開発スクリプト（`apps/web/scripts/generate-known-{ranking,tag}-keys.ts`）はそのまま better-sqlite3 を使い続けて OK（ローカル dev のほうが速い）。
