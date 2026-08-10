# ブログSVGデータ系譜 復元キュー (LATEST)

棚卸し対象: 423 記事 / SVG 1062 枚

## 系譜の整備状況
- ✅ both (json+source・系譜完全): **938** (88%)
- 🟡 jsonOnly (再生成可・出典無): **0** (0%)
- 🔴 neither (元データ消失・再生成不可): **124** (12%)

## 復元手法別 (restoreMethod)
- `done`: 938
- `ssot-restore-new`: 55
- `manual`: 43
- `ssot-restore`: 26

## 復元順 (軽い順)
1. `source-backfill` (0): 既存 json を SSOT に対応付け source.json 後付け
2. `ssot-restore` (26): regenerate-tile-maps.ts / regenerate-ranking-cards.mjs で SSOT復元
3. `ssot-restore-new` (55): scatter/line/findings の復元手法を新規実装
4. `manual` (43): 無意味名・型不明 → 個別手当て

真実源: `.claude/state/blog/svg-lineage-queue.json` / 正典: `.claude/rules/blog-data-schema.md §1.7`
