---
name: feedback_content_four_types
description: 全コンテンツは参照型・教科書型・論文型・作り方型のどれかに属する。未分類で作らず、機械の止めを緩めない
metadata:
  type: feedback
---

コンテンツを作るときは必ず 4 型のどれかに決める。正本は `data/content/content-types.json`、正典は `.claude/rules/content-type-standards.md`。

**Why:** 2026-11-06 にオーナーが「今後コンテンツを作成するときは必ずこの 4 つの型に当てはまるように」と指示した。量産の前に、型ごとの展開と止まりを見えるようにするため。

**How to apply:** 新しい記事・note・投稿は `npm run content-types:check` を通す。題名の「なぜ」だけで論文型にしない (1 指標の順位の紹介は参照型)。URL の形で仮に決めた型は本文の信号と突き合わせる。公開済みの本文を型に合わせて書き換えるときは `/content/fit`を通す。クリック 0 を撤去の根拠にする前に公開日と計測の窓を比べる (2026-11-06 に公開直後の 11 本を撤去の案にした)。関連 [[feedback_business_vs_content_issues]]。
