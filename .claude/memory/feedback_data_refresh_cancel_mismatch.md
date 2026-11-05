---
name: feedback-data-refresh-cancel-mismatch
description: Data Refresh を派生の最終同期中に止めると item.json だけ新しい年になり、ランキングが「データがありません」になる
metadata:
  type: feedback
---

全範囲の Data Refresh は `ranking-items` の item.json を途中で先に R2 へ上げ、values.json は最後の差分同期で上げる。2026-11-05 に最終同期 3,416/17,474 で取り消したら、24 指標が「item は新しい年・values は古い年」になり、本番で最新年を選んだ画面が「データがありません」になった。キャッシュ削除と公開データ監査も走らない。

**Why:** 工程の残り時間を過去の総所要時間から推定して「残り10分」と伝えたが、実際は約35分残っていた。

**How to apply:** 止める提案の前にログの Progress で残件を読む。止めたら `npm run audit:public-data-contract` を実行し、`[year]` の指標を `snapshot_scope=ranking` で作り直す。あわせて [[feedback-r2-write-pending-replaced]] も確認する。
