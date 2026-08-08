# データ出典・再現性 (provenance) 棚卸し (LATEST)

棚卸し日時: 2026-08-08T19:22:18.923Z
正典: `.claude/rules/data-provenance-standards.md`

## metric 再現性クラス分布
- A (statsDataId 再取得可): **2239**
- A' (機械ID付き external): **30**
- B (fetcher依存・出典薄): **14**
- C (手動抽出・provenance): **12**
- D (出典不明・要是正): **0**

## 是正対象 (C欠落 + D): **0 件**


## blog SVG lineage: total 1056 / 状態 {"both":932,"jsonOnly":0,"neither":124}

是正は `/audit-provenance` skill 参照。fetcher コードから出典復元 → config backfill → `validate:config` 再実行。