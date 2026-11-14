---
type: theme-catalog-review
date: 2026-11-14
status: implemented-pending-release
theme: childcare-services
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 保育の需給 (childcare-services)

## 結論

いまの先頭章は申込者数（総量・2025年の1年だけ）1指標のみで、県比較に意味を持つ割合・人口あたりの指標が先頭にないため、人口あたりの施設数と利用率を先頭に置く章へ並べ替えた。申込者数は章を移し、同じ章に就業率（割合）を並べて総量だけの章にならないようにした。章の数は3のまま、保育士の章に年収を足して1章1指標を避けた。待機児童の検索需要には対応したいが、待機児童率は市区町村のみの指標で県ページに出せず、待機児童数は context の総量のため今回は章に入れていない。

THEME-PAGE-REVIEW-01 の段 4 (全 56 テーマの指標の見直し)。調査 (theme-researcher) と設計 (theme-designer) の結果を機械で検査し (実在しない指標・重複・取りこぼし・`validate:catalog`)、通った案をカタログへ適用した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 子育てしやすい県・子育て支援が手厚い県はどこか(都道府県ランキング) |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 303・クリック 9・クリック率 3.0%・平均順位 6.52 (`data/themes/portfolio.json#childcare-services/metricsAllRoutes28d`) |
| 進行中の実験 | なし |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 子育てしやすい県・子育て支援が手厚い県はどこか(都道府県ランキング) | 2026-W45 queries.csv: 「子育てしやすい県ランキング」59回、「子育てしやすい都道府県ランキング」14回、「子育てしやすい都道府県」9回、「子育てしやすい県」8回、「子育て支援 都道府県 ランキング」8回 |
| 待機児童は県別にどれだけいるか、多い県はどこか | queries.csv: 「東京都 待機児童数」1回、「神奈川県 待機児童」1回、「待機児童 ランキング」0回(4表示)、「全国 待機児童 ランキング」0回。表示は少ないが県名指定の語が複数ある |
| 保育士の年収・給料は県でどう違うか | queries.csv: 「保育士 年収ランキング」2回(17表示)、「保育士 給料 全国 ランキング」0回(12表示)、「保育士 給料 高い 県」0回(8表示) |
| 保育園・幼稚園に通う子の割合、保育所等の数・利用状況はどうか | queries.csv: 「幼稚園 割合」0回(12表示)、「保育園 割合」0回(1表示)、「保育所等関連状況取りまとめ」0回(57表示)。厚労省の取りまとめ資料を探す語 |

## 適用前の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 保育所等の利用申し込みや需要の状況はどうか (`childcare-demand`) | 保育所等利用申込者数（4月1日時点） | — |
| 2 | 保育施設や定員の確保状況は十分か (`facility-capacity-and-utilization`) | 保育所等数（0～5歳人口10万人当たり）・保育所等利用率（在所児数／定員数）、認定こども園数（0～5歳人口10万人当たり） | — |
| 3 | 保育士の配置状況や保育の質は保たれているか (`childcare-quality-and-staffing`) | 保育所等在所児数（保育士1人当たり） | — |

## 実装した構成 (カタログの現在の形)

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 近くに預け先は十分あり、空きに余裕はあるか (`facility-capacity-and-utilization`) | 保育所等数（0～5歳人口10万人当たり）、保育所等利用率（在所児数／定員数）、認定こども園数（0～5歳人口10万人当たり） | — |
| 2 | 保育を必要とする家庭はどれくらいあるか (`childcare-demand`) | 育児をしている人の就業率、保育所等利用申込者数（4月1日時点） | — |
| 3 | 保育士は足りているか、年収はどうか (`childcare-quality-and-staffing`) | 保育所等在所児数（保育士1人当たり）、保育士の平均年収 | — |

見せ方 (推移・数値・構成比) は `apply-design.ts` がデータの形 (年の数・単位) に合わせて決め直した。

## 足した指標 (登録済みの指標をカタログに載せた。role は secondary)

| 指標 | rankingKey | 年 | 答える問い |
|---|---|---|---|
| 育児をしている人の就業率 | `childcare-employment-rate` | 2022〜2022 | 「子育てしやすい県」を知りたい読者に、共働きで預けたい家庭が多いかという保育需要の背景を割合で示す。 |
| 保育士の平均年収 | `nursery-teacher-annual-income` | 2020〜2023 | 「保育士 年収ランキング」「保育士 給料 高い 県」の検索に答え、保育士の配置状況と並べて見られるようにする。 |

## 不採用・保留の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 保育所等利用待機児童率(申込者数に対する割合) | nursery-waiting-children-rate | 未確認(定義ファイルから取得できず) | 登録済 | data/metrics に定義があり isActive: true。単位は％で、カタログに載っている待機児童数(総量)を割合にできる。カタログ未掲載(catalogs を grep して0件) |
| 保育所まで500m未満の子育て世帯の割合 | nursery-within-500m-young-child-household-ratio | 0004025628 | 登録済 | isActive: true、単位は％。「子育てしやすい県」の問いに答える利用しやすさの指標で、施設数でなく近さを割合で示す。カタログ未掲載 |
| 公営保育所等割合 | public-nursery-ratio | 0000010205 | 登録済 | isActive: true、単位は％。保育園・幼稚園の割合を探す検索語「幼稚園 割合」「保育園 割合」に近い。対になる幼稚園側は public-kindergarten-ratio、kindergarten-count-per-100k-3-5 が登録済 |

## 確かめたこと・確かめていないこと (agent の申告)

- 確認: nursery-count-per-100k-0-5 は棚卸しで 1975〜2020 の26年・47都道府県、nursery-utilization-rate は 1975〜2020 の46年、certified-childcare-center-count-per-100k-0-5 は 2015〜2024 の10年。先頭章の3ブロックはすべて最新年が2020年以降の stat
- 確認: childcare-applicants は 2025年の1年だけ・総量（人）。同じ章に割合の childcare-employment-rate（％）を置いた
- 確認: childcare-employment-rate は data/metrics で isActive: true・entities prefecture・years 2022〜2022（1年だけなので stat）。nursery-teacher-annual-income は isActive: true・prefecture・2020〜2023の4年（trend可）
- 確認: nursery-teacher-annual-income は occupation-salary で secondary（primary ではない）。ほかのカタログの primary を抱え込んでいない
- 確認: nursery-waiting-children-rate は isActive: true だが entities が city のみで都道府県の値が無いため追加しなかった。nursery-within-500m-young-child-household-ratio も entities が city のみで追加しなかった
- 確認: public-nursery-ratio は prefecture・1975〜2020で登録済みだが、公営保育所の割合であり「保育園に通う子の割合」の問いには答えないため追加しなかった
- 確認: composition は使っていない（足して全体になる組は確かめていない）。trend は各ブロック1指標・同一単位。既存の非 context 指標5件はすべてブロックに入り、重複なし。drop は空
- 確認: addMetrics の sourceUrl は各定義ファイルの source.url の値をそのまま写した
- 未確認: childcare-employment-rate の統計表の中身（cdCat 軸の意味）は定義ファイルの subtitle と axisRatio までで、表そのものは e-Stat で見ていない
- 未確認: nursery-children-per-nursery-teacher と nursery-count-per-100k-0-5 の定義の説明文（description）は読んでいない。標題と単位と年数だけを根拠にした
- 未確認: 検索語の表示回数はサイト全体の28日分で、このテーマのページに限った需要ではない。学童・病児保育の登録済み指標は未調査
- 未確認: nursery-waiting-children-count（context）は章に入れていない。県ページで待機児童の問いを前面に出すかは、率（県別）の指標が登録されてから再検討が必要
- 調査の未確認: selection.json (指標を選ぶ視点) は読んでいない
- 調査の未確認: 候補の cdCat01 と調査名は確認していない。e-Stat へ問い合わせていない
- 調査の未確認: nursery-waiting-children-rate・public-nursery-ratio など5件のうち棚卸しの metricInfo に無いものは、年の数・期間を確認できていない
- 調査の未確認: nursery-teacher-annual-income 以外の候補は期間を確認していない
- 調査の未確認: 検索語はサイト全体の28日分で、このテーマのページに限った表示回数ではない。学童・放課後児童クラブ・病児保育の登録済み指標は grep で見つからず、未調査の未登録候補として残る

## 採用決定

2026-11-14 オーナーの指示 (提案は基本的に承認する。出し直しが要る案は設計し直して自動で承認とする) により採用。
実装: `apply-design.ts --approved childcare-services` でカタログへ適用し、`validate:catalog` は error 0・warning の増減なし。
公開日に実験を `metricScope: all-routes` で登録する。
