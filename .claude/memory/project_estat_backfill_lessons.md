---
name: project-estat-backfill-lessons
description: e-Stat の観測値を取り直すときの教訓 — 置き換えではなく合流 (UPSERT) で書く。全置換は別の取り込み元から入った年度を消す
metadata: 
  node_type: memory
  type: project
  originSessionId: 521ef46b-9eea-425e-b32c-98d91abfa696
---

e-Stat の観測値を取り直す (backfill・再取り込み) ときは、既存の値を丸ごと置き換えず、(指標・地域・年) の単位で合流させる。

**Why**: 2026-05-27、旧 `backfill-stats-prefecture.cjs` (ローカル SQLite の `stats_prefecture` に書いていた。2026-11-21 にスクリプトごと削除) が DELETE+INSERT で書き、`marriages` / `divorces` の 2023〜2024 年を失った。e-Stat SSDS は 2022 年までしか持たず、その 2 年は別の取り込み元から入っていた。いまの観測値の正本は R2 の `app/stats/<metric>/values.json` なので、同じ形の事故は「取り直した年の範囲で values.json を作り直す」ときに起きる。

**How to apply**:
- 取り直しの前に、既存の値の年と出典 (取り込み元) を並べ、取り直す範囲に無い年を残す
- 削除が本当に要るときは、出典を横断して確かめてからにする
- e-Stat の時間コード (`YYYYMM00` など) は 4 桁の年に正規化してから合流させる (形が混ざると同じ年が 2 行になる)。年の切り出しは `packages/estat-api/mirror/year-code.mjs` の共通の部品を使う
- `cdTimeFrom`/`cdTimeTo` で年の範囲を絞らない。全年度を 1 回で取り、メモリで絞る (`.claude/rules/estat-api.md`)
