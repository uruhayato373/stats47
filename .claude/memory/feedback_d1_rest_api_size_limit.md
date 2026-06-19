---
name: D1 REST API SQL statement size limit
description: D1 REST API の SQL 文サイズ上限は約 100KB。INSERT バルクサイズの目安と既知の地雷
type: feedback
originSessionId: db55c163-a67c-4669-bcab-936297545c56
---
D1 REST API (`/d1/database/<id>/raw`) の SQL 文サイズ上限は **約 100KB** で、SQLite 既定の 1MB より厳しい。超えると `errors.code=7500 message="statement too long: SQLITE_TOOBIG"` を返す。

**Why:** 2026-04-26 に correlation_analysis sync (1.67M 行) で全 chunks が SILENT に失敗（fail counter 増加だけで詳細出力なし）。500 rows × 2.6KB = 1.4MB SQL、200/100/50 行も全て fail。30 行 (84KB) で初めて成功。同じ上限が ranking_ai_content (2.5KB/row + escape で膨張) でも発生し、20 行 (~50KB) すら fail、5 行 (~12KB) で成功。

**How to apply:**
- バルク INSERT スクリプトを書くときは **chunk SQL サイズを 60-80KB 以下に抑える**（マージン込み 100KB の手前で止める）
- correlation_analysis: CHUNK=20 / PARALLEL=10 で 90,000 rows/min
- ranking_ai_content: CHUNK=5 / PARALLEL=10 で 1,922 rows を 6 秒
- スクリプトは fail 時のレスポンス本文を必ず最初の数 chunk について **直接出力**（counter だけだと診断不能になる）
- `escSql` が単純な `replace(/'/g, "''")` だと、JSON 内のエスケープ済み `\"` 等は問題ないが、**サイズはエンコード後で評価**すること（生データの倍程度に膨れる場合あり）
