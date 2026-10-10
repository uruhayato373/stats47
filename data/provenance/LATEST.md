# データ出典・再現性 (provenance) 棚卸し (LATEST)

棚卸し日時: 2026-10-10T22:08:12.514Z
正典: `.claude/rules/data-provenance-standards.md`

## metric 再現性クラス分布
- A (statsDataId 再取得可): **2395**
- A' (機械ID付き external): **29**
- B (fetcher依存・出典薄): **13**
- C (手動抽出・provenance): **202**
- D (出典不明・要是正): **0**

## 是正対象 (C欠落 + D): **0 件**


## blog SVG lineage: total 1617 / 状態 {"both":1533,"jsonOnly":0,"neither":84}

是正は `/audit-provenance` skill 参照。fetcher コードから出典復元 → config backfill → `validate:config` 再実行。