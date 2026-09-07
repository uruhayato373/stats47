---
slug: miscellaneous-school-students-prefecture-gap
reviewer: blog-critic
mode: delta
verdict: PASS
date: 2026-09-07
---
## 評価サマリ
前回指摘の blocker (下位県の順位誤り) と major (断定表現) はいずれも修正済みであることを確認した。下位5県の記述はデータと完全一致し、専門学校集積の解釈も仮説として明示的にヘッジされている。変更箇所以外の意味的品質は前回 full レビューの評価を維持する。

## 指摘
- なし (前回指摘 2 件はいずれも解消を確認)

## 判定理由
data/miscellaneous-school-students-prefecture-gap-prefecture-rankings.json を実データと突合した結果、43位徳島県80人・44位秋田県62人・45位山形県36人・46位鹿児島県36人・47位宮崎県35人という記事本文の記述は rank/areaName/value のすべてで一致しており、前回 blocker だった「山形県と鹿児島県がともに36人で45位」という誤記は「山形県が36人で45位、鹿児島県が36人で46位」に修正され、同着扱いの誤りは解消されている。また major で指摘した「専門学校や職業教育のための施設が多く立地してきた地域でもあります」という断定は、「地域でもあると考えられます[仮説]」へ改められ、根拠のない因果的断定から仮説の明示に変わっている。他の数値主張 (上位5県・6〜9位・富山/石川の6-7位) も data と一致しており、変更範囲に新たな blocker は見当たらない。verdict PASS とする。

## 2026-09-07 delta審査（同順位・限定定義是正）

判定: **PASS（今回の差分に限定）**。比較基準は `0ee9ed359`、審査対象は `article.md` の変更hunkと対応入力です。本文・データは変更していません。上記の過去レビューは記録として保持し、今回明記した点以外の指摘が現在も該当するか・解消済みかは再判定していません。未変更の主張を新たに全面PASSとしたものではありません。

### 差分の確認と判定理由

山形県・鹿児島県はともに36人で同率45位です。両県を異なる順位とした旧記述を解消しており、各種学校の在籍者数を比較する本文の意味は変わりません。

順位は正典 `packages/ranking/src/scripts/generate-ranking-values.ts` の降順競争順位（1, 2, 2, 4）に従い、`1 + 自分より値が大きい行数` で独立再計算しました。値・単位・対象の不変性と変更文の意味を照合し、今回新しいBLOCK/MAJORは認めません。今回の順位記載と上記の旧記録に差がある場合、このdeltaの確認結果を優先します。

機械フロアは対象記事で再実行しPASS、blocker 0件、warning 0件でした。warningはありません。

### 再検証用SHA256

- `article.md`: `14411467190e735ed86ebce4cbc86ca9946d4fa40a3375c614627c8180c82dca`
- `data/miscellaneous-school-students-prefecture-gap-map.json`: `b2193de635be426645ed56dd297dffa418c1dc09a36b39ed6a3fa3365c80b40e`
- `data/miscellaneous-school-students-prefecture-gap-prefecture-rankings.json`: `569304c2845464738627e66d7b83f3fbc237f7a4cc0ed3b2e01b105f147d8c5c`

SHAはこの時点の入力を識別するための記録です。時系列・地図を含む未変更入力のSHA掲載は、それらを全件再監査したという意味ではありません。
