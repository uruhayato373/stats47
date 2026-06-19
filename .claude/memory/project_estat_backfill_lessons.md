---
name: project-estat-backfill-lessons
description: e-Stat backfill 実装時の教訓 — UPSERT 必須、DELETE+INSERT は他ソース年度を喪失する。year_code 形式正規化も必要
metadata: 
  node_type: memory
  type: project
  originSessionId: 521ef46b-9eea-425e-b32c-98d91abfa696
---

e-Stat backfill 実装時の必須注意点 (2026-05-27 教訓)。

## 原則: 必ず UPSERT で書く

`stats_prefecture` への backfill は **INSERT ON CONFLICT(metric_key, area_code, year_code) DO UPDATE** で実装する。

**Why**: 2026-05-27、`backfill-stats-prefecture.cjs` の DELETE+INSERT 実装で `marriages` / `divorces` の 2023-2024 年 (e-Stat SSDS 公開範囲外、別ソース由来) を喪失した。SSDS は 2022 年までしか持たないが、D1 元データは別の取り込みパスから 2024 まで持っていた。

**How to apply**:
- 新規 backfill スクリプト: UPSERT 一択
- 既存 `backfill-stats-prefecture.cjs` は UPSERT 化リファクタ未対応 (要対応)
- リカバリ実装 `restore-from-r2-cache.cjs` が UPSERT の正しい実例
- DELETE が真に必要な場合は対象 metric の `SELECT DISTINCT year_code, source_id FROM stats_prefecture WHERE metric_key = ?` で source 横断確認してから

## 関連注意: year_code 形式の正規化

e-Stat の time code は `YYYYMM00` (例: "1975100000")、R2 cache 既存データは `YYYY` (例: "1975")。
両方混在すると `(metric_key, area_code, year_code)` の重複行になる。
backfill 後に正規化必要:
```sql
UPDATE stats_prefecture SET year_code = SUBSTR(year_code, 1, 4)
WHERE metric_key IN (...) AND LENGTH(year_code) > 4;
```

## 関連注意: e-Stat 全年度取得規約

`cdTimeFrom`/`cdTimeTo` で年度範囲指定 **しない**。全年度を 1 リクエストで取得 → メモリで `yearCode` フィルタ。
R2 キャッシュキーが `statsDataId` + `cdCat01` で決まるため、年度範囲パラメータで分割するとキャッシュが断片化する。
詳細: `.claude/rules/estat-api.md`

## 関連

- [[feedback-d1-rest-api-size-limit]] — D1 REST API の SQL サイズ上限
- [[feedback-d1-query-in-ci]] — CI での D1 クエリ方法
- [[project-d1-sync-pitfalls]] — D1 sync の落とし穴
- knowledge: `.claude/skills/management/knowledge/SKILL.md` (本件のエントリ追記済)
- script: `.claude/scripts/estat/backfill-stats-prefecture.cjs` / `restore-from-r2-cache.cjs`
