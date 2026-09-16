---
name: project-note-ins-img-heading-placement-bug
description: editor-helpers.shのins_imgは見出し直前の段落をアンカーにすると画像が見出し直後にずれる未解決バグ。盲目的な修正は悪化させた実例あり
metadata: 
  node_type: memory
  type: project
  originSessionId: 902b7af2-f468-4f78-a3e6-254dd9831f7e
  modified: 2026-09-16T00:28:57.636Z
---

`.claude/scripts/note/editor-helpers.sh`の`ins_img`は、アンカー文字列を含む段落の
「次の`<p id=>`/`<li>`」を探して画像挿入位置にする実装のため、アンカー段落の直後が
見出し(`<h2>`/`<h3>`)だと見出しを読み飛ばし、次セクション先頭の段落の前に画像を置く
(画像が意図した位置より1ブロック先=見出しの直後にずれる)。

**Why**: 2026-09-16、b-kakei-*記事8本の画像復元で発覚。`audit-note-figure-split.mjs`の
misplaced件数で7/8本・計14枚が該当(内容自体は正しい画像で欠落・誤情報ではない)。

**試して失敗した修正**: アンカー段落自身をクリックし段落末尾へキャレットを置いてEnterする
(旧: 次の段落の先頭でEnter+ArrowUp)に変更したところ、`b-kakei-necktie-decline`で
misplacedが1→2に悪化した。原因未特定のまま撤回・元に戻した。おそらく`BU state`
(browser-use)が出すaccessibility treeダンプの実際のフォーマット(`<p id=>`とテキストが
同一行か別行か等)についての推測が外れている。

**How to apply**: この関数を触るときは、必ず実際の`BU state`ダンプ(`/tmp/ns.txt`)を
見出し前後の段落で目視してから修正すること。ライブDOMを見ずに正規表現だけを
推測で直すと逆方向に悪化しうる(今回がその実例)。バックログ
`[NOTE-INS-IMG-HEADING-PLACEMENT-01]`に詳細と次のアクションを記録済み。

**関連**: [[feedback_note_product_card_ssot]]
