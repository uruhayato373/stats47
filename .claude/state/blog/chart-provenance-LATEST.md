# ブログチャート出典 (source.json) 再取得可能性 (LATEST)

検査対象: 994 件 (source.json を持つチャート)

## 判定
- `restorable`: **928**
- `out-of-scope`: **66**

**欠陥計: 0 件**

## 判定の意味
- `restorable` — kind ごとに必要な参照があり、参照先 rankingKey も R2 に実在する
- `out-of-scope` — `kind: "authored"` (記事本文由来)。SSOT 指標ではないので再取得不能が正しい
- `self-declared-incomplete` — source.json 自身が `incomplete: true` で「出自不明」と申告している
- `missing-reference` — kind が要求する参照フィールドが無い
- `dead-reference` — 参照している rankingKey が R2 に存在しない (指標の廃止/改名)
- `dead-estat-reference` — 参照している statsDataId が e-Stat API で取得できない
- `unknown-kind` — 語彙のドリフト。`.claude/scripts/lib/chart-provenance.mjs` の共有定義に追加する

## 欠陥一覧
なし

真実源: `.claude/state/blog/chart-provenance-queue.json` / 正典: `.claude/rules/blog-data-schema.md §1.5`
