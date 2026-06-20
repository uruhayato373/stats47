# ブログSVGデータ系譜 復元キュー (LATEST)

棚卸し対象: 238 記事 / SVG 612 枚

## 系譜の整備状況
- ✅ both (json+source・系譜完全): **326** (53%)
- 🟡 jsonOnly (再生成可・出典無): **22** (4%)
- 🔴 neither (元データ消失・再生成不可): **264** (43%)

## 復元手法別 (restoreMethod)
- `done`: 326
- `ssot-restore-new`: 142
- `manual`: 76
- `ssot-restore`: 46
- `source-backfill`: 22

## 復元順 (軽い順)
1. `source-backfill` (22): 既存 json を SSOT に対応付け source.json 後付け
2. `ssot-restore` (46): regenerate-tile-maps.ts / regenerate-ranking-cards.mjs で SSOT復元
3. `ssot-restore-new` (142): scatter/line/findings の復元手法を新規実装
4. `manual` (76): 無意味名・型不明 → 個別手当て

真実源: `.claude/state/blog/svg-lineage-queue.json` / 正典: `.claude/rules/blog-data-schema.md §1.7`
