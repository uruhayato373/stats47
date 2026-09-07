---
slug: nuclear-power-plant-count-prefecture-gap
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-09-07
---

## 評価サマリ

PASSです。エネルギー統計の対象・単位を監査する立場で、記事全文、集計入力、47都道府県の値、図、原典PDFの冊子86・87ページを独立確認しました。既設炉33基を15発電所・12道県へまとめる手順と、福島県の0が廃止措置中施設の不在を意味しない説明は正確です。福井4発電所8基と新潟1発電所7基の対比が、数え方によって比較の意味が変わることを具体化しています。

## 指摘

- 残存指摘なし。末尾の「件数・容量・発電量はそれぞれ…定義を確認してください」という反復1文の削除をdelta確認しました。具体例と必要な限界説明は保たれています。

## 判定理由

初回の独立full審査で見つけた同順位表示のBLOCKは、著者の修正後にdelta確認して解消しました。横長・縦長カードとも1か所を同率2、0か所を同率13と表示し、タイルマップの北海道・青森も同率2になっています。横長カードと地図を実画像で再確認し、値・県名・順位・見切れに問題はありません。category: energy、タグ、subtitleの補完も確認しました。再実行したquality-gateはblocker・warningとも0です。

原典の既設炉33行とexisting-reactors.jsonの設備番号を目視突合しました。東海第二を「2号機」とせず発電所名として扱う点も一致しています。設置者・発電所名の組合せ15件を県別に再集計し、ランキング・地図両JSONの47値と競争順位が全件一致しました。35都府県の0、福井4/15=26.666…%、福井8基・新潟7基を再計算しました。冊子87ページに福島第一・第二が廃止措置中として載ることも確認しています。

タイトルの問いには福島第一・第二という具体例で答え、calloutは既設と稼働の違い、防災への誤適用を防いでいます。常体混在、因果の断定、安全性の推定、広告過多、図と重複する表は確認しませんでした。立地原因を解明するA型ではなく、集計対象・単位の違いを読む比較記事として審査しています。未検証の立地原因を追加する必要はありません。内部リンク3本は県別ページと実在カテゴリに限り、旧ランキングへの誘導はありません。

原典は[静岡県公式PDF](https://www.pref.shizuoka.jp/_res/projects/default_project/_page_/001/030/334/zentair7.pdf)です。[県の著作権説明](https://www.pref.shizuoka.jp/about/link.html)は包括的な商用転載許諾ではありません。今回の成果物は発電所名・設置者・県・設備番号という事実の独自集計と自作図であり、原表のレイアウト・文章・写真・地図は含みません。第三者図版の利用可否や現在の稼働状態を、この審査で保証したものではありません。

### 検証対象のSHA256

- article.md: `2430eea32fb2ae1091bfa77b935f84552b371ef42a005c4d2b23c7337436114b`
- existing-reactors.json: `fd7c5c5ecc0aaaadff3790b86bb8ab8533fde3225020f43bb7d8674ea0a3c7e0`
- 原典PDF: `b77b85a1416b4c5a00fe6f926aa39e970788b8f95489aa8ae2892ba84c05bff9`
- prefecture-rankings.json: `5c61005afb4df7c321913cfef0c2204da982ecef1ddc8a2d7c75e8e2fcf8f82f`
- map.json: `39a0587097cbf3c4d2162df01b8f3a077d5d6f5e021550a09f2bb708b64add35`
- prefecture-rankings.svg: `ad96f856899cc586ae570802b6cdaf46f458d1fdad9a7332d5bd83c52887a965`
- prefecture-rankings-ig.svg: `570f4243fe6896cee09aa0251cd699e75f8ed1b5616a654baf33322d1a01ab22`
- map.svg: `3c1a227dca2d625a32bea87617e26cd34326c89acb66d4ff5dd45212d0f01ddd`
