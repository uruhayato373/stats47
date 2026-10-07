---
type: theme-catalog-review
date: 2026-10-07
status: proposal-ready
theme: consumer-prices
supersedes: 2026-07-11-theme-consumer-prices.md
tags: [theme-catalog, consumer-prices, regional-price-index, years-extension, cpi-heatmap]
---

# テーマレビュー: consumer-prices（物価・消費） 2026-10-07

## 結論

12 費目の物価地域差指数のうち 9 指標が 2024 年の 1 年分しか登録されていないが、e-Stat の同じ表には 2013〜2024 年の 12 年分がある。
9 指標の `years` を 2013〜2024 に広げ、いま「総合」1 本の折れ線を描いているだけの図 `theme-cpi-heatmap` を、
選んだ県の 12 費目 × 12 年を並べる本物の `cpi-heatmap` に作り替える。
2013〜2024 年は 2026-10-07 に `getStatsData` で確かめた (12 コードとも北海道で 12 年、うち 3 コードは 47 都道府県そろって 12 年)。

現行ページの文言は「単年の費目別指数は過去へ延長しません」と書いているが、これは e-Stat の実在年と合わない。
食料・住居・総合は R2 にすでに 12 年あり (2026-10-07 に `values.json` を数えた)、未登録の 9 指標が同じ表の同じ年を持つのに登録だけ漏れている。
`cpi-heatmap` は全系列に共通する年だけを描く仕様なので (`fetchR2CpiHeatmapData`)、context の 7 指標も含めて 9 指標すべてを広げないと 2024 年の 1 列にしかならない。

あわせて、カードと同じ指標を繰り返す箇所を外す。三つの章の説明を一字一句なぞるだけの「数値を比較するときの注意」、
「何の費目が高いか」カードと同じ食料・光熱・水道の指数を再掲する 2 枚のカード、
そして climate の主指標である年平均気温を外す。光熱と食料の二つの章は、家計支出額だけの 1 章「物価指数と家計の支出額」にまとめる。
指標は 15 件から 14 件、図は 4 件から 3 件、カードは 7 枚から 4 枚、章は 6 から 5 になる。

2026-07-11 版 (`2026-07-11-theme-consumer-prices.md`) の主問 (同じ年の全国平均と比べて何が高い・低いか)、
地域差指数と前年比を分ける方針、不採用の判断は引き継ぐ。その後の 2026-09-09 の章追加 (光熱・食料の家計支出と気温) と
2026-09-08 の章構成を前提にしていないため、本書が置き換える。7 月版の「家賃除く総合を primary にする」は取り下げる (表 1)。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主読者 | 「〇〇県 物価」「生活費が高い県」で探す人。自分の県の物価が全国平均より高いのか、どの費目が効いているのかを知りたい人 |
| 主問 | 同じ年の全国平均 (=100) と比べて、その県では何が相対的に高い・低いか。その差は近年どう動いたか |
| 比較軸 | 地域差 (都道府県順位、全国=100) と費目 (総合・家賃除く総合・食料・住居・光熱水道ほか 12 費目)。時系列は 2013〜2024 (現在の登録は総合・食料・住居のみ) |
| 誤読リスク | 地域差指数は水準の比較で前年比の物価上昇率ではない。費目別指数を足しても生活費総額にはならない。指数 1 ポイントを円額に換算できない。家計支出 (全国家計構造調査) は二人以上世帯の 10〜11 月の月平均で、物価指数と単位も対象も違う |
| baseline (GSC 2026-W40, 28 日) | `/themes/consumer-prices`: クリック 2、表示 140、CTR 1.43%、平均掲載順位 9.26 (`data/gsc/snapshots/2026-W40/pages.csv`) |

検索需要の補足 (同 snapshot の `queries.csv`。この CSV は `query` 列のみでページ列が無く、サイト全体の値である。このテーマのページに来たクエリとは限らない):
「物価」を含む 46 クエリで計 154 表示・5 クリック。うち県名つき (「北海道 物価」21 表示、「埼玉 物価」10、「山梨 物価」10、「富山 物価」9 など) が目立ち、県を選んで見る使い方に合う。
「消費者物価地域差指数」を含むクエリは「消費者物価地域差指数 ランキング」21 表示・順位 6.81 など。
「生活費」を含む 17 クエリで計 218 表示・62 クリック (「生活費が高い県ランキング」59 表示・33 クリック・順位 1.86 など) は、
ページ列が無いためこのテーマへの流入かどうか分からず、物価地域差指数ではなく家計の支出額を指す語でもある。ここでは需要の根拠に使わない。

## 現行の構成 (2026-10-07、`data/themes/catalogs/consumer-prices.json`)

| 順 | 章 (key) | カード (metricGroups) | チャート |
|---|---|---|---|
| 1 | 総合水準と家賃の影響 (`overall`) | 総合 / 家賃除く総合 (2 指標・1 枚) | — |
| 2 | 何の費目が高いか (`expenses`) | 食料 / 住居 / 光熱・水道 (3 指標・1 枚) | 物価プロファイル (`theme-cpi-profile`、12 費目の最新年) |
| 3 | 地域差の構造は変わったか (`historical-change`) | — | 物価地域差指数（総合）の推移 (`theme-cpi-heatmap`、実体は総合 1 本の折れ線) |
| 4 | 光熱価格・家計支出と気温 (`candidate-75`) | 光熱・水道物価地域差指数 / 光熱・水道支出 / 年平均気温 (各 1 枚) | — |
| 5 | 食料価格と家計の食料支出 (`candidate-76`) | 食料物価地域差指数 / 食料支出 (各 1 枚) | — |
| 6 | 読み方と実質収入 (`reading`) | — | 数値を比較するときの注意 / よくある質問 |

指標 15 件 (primary 1・secondary 7・context 7)。図は 4 件、カードは 7 枚。

視点の機械判定 (`evaluateSelectionViewpoints`、2026-10-07 に実行) の該当は 11 件:
`card-chart-duplicate` 1 (`theme-cpi-heatmap`)、`single-year-as-trend` 1 (`candidate-75-1`)、`owned-elsewhere` 1 (`average-temperature`)、
`selection-evidence` 8 (primary・secondary の 8 指標すべてに `adoptionCriteria` が無い)。
週次の履歴 `data/themes/viewpoint-history.csv` は 2026-W41 の全テーマ集計だけで、テーマ別の件数は持たない。

## 表 1: 現行指標

登録年は metric config の `years`。e-Stat の実在年は `getStatsData` (統計表 `0000010212`) で 2026-10-07 に確かめた範囲で、
`cdArea=01000` (北海道) を全 12 コードで、全 47 都道府県を `#L04415`・`#L04418`・`#L04425` の 3 コードで見た。ほかの 9 コードの 47 県分は見ていない。

| rankingKey | 現行 | 提案 | 年 | 理由 |
|---|---|---|---|---|
| `consumer-price-difference-index-overall` | primary | keep | 登録 2013〜2024、R2 に 12 年 (各 47 県)。e-Stat も 2013〜2024 | 主問に直接答える見出し指標。広げる必要はない |
| `consumer-price-difference-index-overall-excl-rent` | secondary | keep (secondary)。**`years` を 2013〜2024 に拡張** | 登録 2024 のみ。e-Stat は 2013〜2024 (47 県そろいを確認) | 総合との差で家賃の影響を読む対照軸。年を広げると「overall」カードが 2 本の推移を描ける。7 月版の primary 化は、同じカードに並ぶので見た目が変わらないため取り下げる |
| `consumer-price-difference-index-food` | secondary | keep | 登録 2013〜2024、R2 に 12 年 | 必需費目の地域差 |
| `consumer-price-difference-index-housing` | secondary | keep | 登録 2013〜2024、R2 に 12 年 | 総合差の主要因を読む。家賃の詳細は living-housing の主問 |
| `consumer-price-difference-index-utilities` | secondary | keep。**`years` を 2013〜2024 に拡張** | 登録 2024 のみ。e-Stat は 2013〜2024 (47 県そろいを確認) | 気候・料金体系の差を読む費目。広げると `single-year-as-trend` の該当が消える |
| `consumer-price-difference-index-education` | context | keep (context)。**`years` を 2013〜2024 に拡張** | 登録 2024 のみ。e-Stat は 2013〜2024 (北海道のみ確認) | 図に残す全 12 費目のうちの 1 つ。`cpi-heatmap` は全系列の共通年だけを描くため、context でも広げる必要がある |
| `consumer-price-difference-index-culture-recreation` | context | keep (context)。**`years` 拡張** | 同上 (北海道のみ確認) | 同上 |
| `consumer-price-difference-index-transport-communication` | context | keep (context)。**`years` 拡張** | 同上 (北海道のみ確認) | 同上 |
| `consumer-price-difference-index-healthcare` | context | keep (context)。**`years` 拡張** | 同上 (北海道のみ確認) | 同上 |
| `consumer-price-difference-index-clothing-footwear` | context | keep (context)。**`years` 拡張** | 同上 (北海道のみ確認) | 同上 |
| `consumer-price-difference-index-furniture-household` | context | keep (context)。**`years` 拡張** | 同上 (北海道のみ確認) | 同上 |
| `consumer-price-difference-index-miscellaneous` | context | keep (context)。**`years` 拡張** | 同上。47 県そろいを確認 | 同上 |
| `household-survey-utilities-expenditure` | secondary | keep | 登録 2019・2024。e-Stat も同じ 2 年 (北海道で確認) | 物価指数とは別の「支出額」を示す。全国家計構造調査は 5 年に 1 回で 2 点が上限 |
| `household-survey-food-expenditure` | secondary | keep | 登録 2019・2024。e-Stat も同じ 2 年 (北海道で確認) | 同上 |
| `average-temperature` | secondary | **remove** | 登録 1975〜2024 | climate の primary を抱え込んでいる (視点 `owned-elsewhere`)。章の説明自身が「県全域の気温や通年の光熱費ではない」と断っており、物価の主問に要る理由が示せない。理由は「判断の要る点」1 |

実装時の再確認 (2026-10-08): 年を広げる 9 指標の実在年は全都道府県で取り直して `data/estat/year-coverage/queue.json` に記録した
(`scope: "all-prefectures"`、年ごとの都道府県数つき)。上の表の「北海道のみ確認」の分も、この記録で全都道府県を見ている。

外す 1 指標は climate に主担当があり、このテーマの指標一覧から消えるだけでランキングページと climate には残る。
`selection-evidence` の 8 件は、残る primary・secondary の 7 指標の選定根拠を `/backfill-theme-selection` の gate 越しに書き直す
(現行の根拠は定型文で、`sourceUrl` は統計局の総合ページ `https://www.stat.go.jp/data/ssds/index.htm`、household の 2 指標は `sourceUrl` が無い)。
根拠にする一次資料は、7 月版が挙げた統計局「小売物価統計調査（構造編）」の公式ページ `https://www.stat.go.jp/data/kouri/kouzou/index.html` と、
全国家計構造調査の公式ページを実装時に開いて逐語引用する。この提案の時点では、どちらの URL も 200 を確かめていない。

## 表 2: 現行チャート・カード・章

### チャート

| componentKey | 提案 | 理由 / 実装差分 |
|---|---|---|
| `theme-cpi-profile` | keep | 選んだ県の 12 費目を全国=100 の基準線つきで 1 年分見せる。本書の年の拡張後も、共通年の最新 (2024) を描く (`props.year` 未指定時) |
| `theme-cpi-heatmap` | **revise** | `componentType` を `line-chart` から `cpi-heatmap` に変える。`seriesRefs` は `theme-cpi-profile` と同じ 12 費目。題は「費目別の物価地域差指数の推移」。`annotation` (「単年の費目別指数は…」) は外す。現行は総合 1 本の折れ線で、同じ指標がすぐ上の「総合水準と家賃の影響」カードにすべて入っているため重複 (視点 `card-chart-duplicate`)。componentKey は変えない。`relatedRankingKeys` は 12 費目。依存: 9 指標の `years` 拡張が先 |
| `md-cpi-discussion` | **remove** | 本文 3 段落が、章 `overall`・`expenses`・`historical-change` の説明文と一字一句同じ。`sourceName` に経済財政白書・男女共同参画白書を挙げるが、本文にそれらの記述は無い |
| `md-cpi-faq` | keep (本文は変えない) | 見直しは別作業。`sourceName` から毎月勤労統計調査・経済財政白書を外し、小売物価統計調査（構造編）だけにする (本文に賃金の記述が無い) |

外す図 `md-cpi-discussion` は `sections[reading].chartKeys` から外す。`evidenceTopics` の `relatedChartKeys` は、
`overall-price-level-and-rent` に `theme-cpi-heatmap` を足す (総合と家賃除く総合の推移を読む根拠に使える)。

### カード (metricGroups)

| key | 提案 | 内容 |
|---|---|---|
| `overall` | keep | 総合・家賃除く総合の 2 本。年の拡張後は県を選ぶと 2013〜2024 の推移を 2 本で描く |
| `expenses` | keep | 食料・住居・光熱・水道の 3 指標。光熱・水道の年が広がるので、3 指標とも推移を描ける |
| `candidate-75-1` | **remove** | 光熱・水道の指数 1 本。`expenses` カードに同じ指標があり、二度見せている |
| `candidate-75-2` | keep (章を統合) | 「光熱・水道支出（二人以上世帯・10〜11月の月平均）」。2019・2024 の 2 点 |
| `candidate-75-3` | **remove** | 年平均気温。指標を外すため |
| `candidate-76-1` | **remove** | 食料の指数 1 本。`expenses` カードと重複 |
| `candidate-76-2` | keep (章を統合) | 「食料支出（二人以上世帯・10〜11月の月平均）」。2019・2024 の 2 点 |

### 章

| 順 | 章 | 提案 |
|---|---|---|
| 1 | 総合水準と家賃の影響 (`overall`) | keep (説明は現行のまま) |
| 2 | 何の費目が高いか (`expenses`) | keep (説明は現行のまま) |
| 3 | 地域差の構造は変わったか (`historical-change`) | 題は残す。説明の「単年の費目別指数は過去へ延長しません」を外し、「選んだ県の費目別指数を年ごとに並べます。どの年も、その年の全国平均を100とした比較で、年どうしの差は前年比の物価上昇率ではありません。」に改める。図は revise した `theme-cpi-heatmap` |
| 4 | 光熱価格・家計支出と気温 (`candidate-75`) と 食料価格と家計の食料支出 (`candidate-76`) | **1 章に統合**。題「物価指数と家計の支出額」(key は `candidate-75` を残し `candidate-76` を外す)。カードは `candidate-75-2` と `candidate-76-2`。説明は「家計支出は県全域の二人以上世帯について、2019・2024年の10〜11月を平均した月額です。物価地域差指数とは単位と対象が異なり、支出額の差だけで同じ商品の価格差とは判断できません。光熱・水道と食料の物価地域差指数は『何の費目が高いか』で見られます。」(現行の 2 章の説明から気温の記述を除いて合わせた) |
| 5 | 読み方と実質収入 (`reading`) | FAQ だけにする (`md-cpi-discussion` を外す)。題と説明は現行のまま |

## 表 3: 不採用候補

| rankingKey / 候補 | reason | reconsider condition |
|---|---|---|
| `average-temperature` | climate の primary。光熱価格の差を気温で説明する因果の読みを、代表観測地点の年平均気温では支えられない (章の説明自身が注記している) | このテーマの主問に光熱費の気候要因を含め、県全域を代表する気温の系列が使えるとき |
| 総合と家賃除く総合の差 (派生指標) | 新しい派生指標を 1 件増やす割に、「overall」カードの 2 本の推移で差は読める | 家賃の寄与を円ではなくポイントで一覧する需要が確認できたとき |
| 家賃・家賃の詳細 | 7 月版のテーマ境界で living-housing の責務 | living-housing に当たる指標が無くなったとき |
| 全国 CPI の前年同月比・上昇率 | 地域差指数は水準の比較で、前年比は別の問い (7 月版の不採用を継続) | 時系列の物価を別の章・別の図として切り分ける主問ができたとき |
| 7 月版の「家賃除く総合を primary に」 | 同じ 1 枚のカードに並ぶので、primary にしても見た目が変わらない | カードを分けるか、primary が先頭タブ・既定の指標を決める画面に変わったとき |
| 小売物価統計調査の費目以外の分類 (品目別など) | 調べていない。この提案では候補の探索をしていない | 次の見直しで統計局の公開表を調べるとき |

rankingKey が実在する `average-temperature` は、実装時に catalog の `rejectedCandidates` にも記録する (主担当は `climate`)。

## 想定実装差分と検証

- 編集: `data/themes/catalogs/consumer-prices.json` と、`years` を `{from: 2013, to: 2024}` に広げる 9 つの metric config
  (`packages/data-configs/src/metrics/consumer-price-difference-index-{overall-excl-rent,utilities,education,culture-recreation,transport-communication,healthcare,clothing-footwear,furniture-household,miscellaneous}.ts`)。
  `yearFormat` はこの変更では触らない (判断 3)。
- R2 に影響するもの: ① `page-components/theme/consumer-prices.json` (図 `theme-cpi-heatmap` の型変更・`md-cpi-discussion` の削除)。
  ② 9 指標の観測値は、metric config の年を広げても自動では増えない。再取得 (`data-refresh.yml`) と R2 反映が要る。
  反映するまで `theme-cpi-heatmap` は共通年が 2024 の 1 列にしかならず、描画できない可能性がある (`data.length !== years × series` なら `null`)。
  アプリだけ先に出すと空の図になるので、R2 と同時に出す。
- 件数基準の更新: 図 4 → 3、カード 7 → 4、章 6 → 5、指標 15 → 14。
  `update-theme-catalog-baseline.ts` の基準、`survey-taxonomy-ratchet.json` の下限 (外す図・カードが調査と紐付く分だけ下げ、`themeBaselineFollowUps` に外した key と理由を記録)、
  `generate-theme-dependency-mirror.ts` の依存ミラーを同じ変更で合わせる。`validate:catalog` の warning は `[no-adoption-criteria]` の分だけ減らす方向で、増やさない。
- 検証: `generate:catalog`、`validate:catalog` (error 0)、`generate:catalog --check`、`validate:years`、`validate:config`、
  `audit-survey-taxonomy.ts --offline --check`、対象テスト、型検査、`npm run preflight:pr`、`capture-theme-page.mjs consumer-prices` の 5 幅確認
  (特に 12 費目 × 12 年の heatmap のスマホ幅)。
- 選定根拠は `/backfill-theme-selection` の gate (引用の逐語一致・URL の 200) を通してから書く。
- デプロイ: consumer-prices も 9 月の実験 `THEME-STRUCTURE-20260908-consumer-prices` (changeType `structure`、d56 = 2026-11-06、verdict pending) が進行中。
  先に出すと d56 の観測にこの変更が混ざるので、ほかの 3 テーマと同じく d56 の観測が `experiments.json` に記録されたあとに、
  R2 の page-components・9 指標の観測値の再取得と同時に出す。`THEME-REVIEW-TOURISM-CPI-01` の実装・公開と `THEME-CATALOG-OPT-RELEASE-01` の便に合わせる。
  新しい実験は同じテーマ × changeType の pending が 1 件までのため、今は登録できない。
- 年の表記: 現在の R2 値は CPI 地域差指数の `yearName` を「2013年度」と返す (`consumer-price-difference-index-overall`、2026-10-07 に確認)。
  年の拡張で heatmap の軸に 12 個並ぶので、年度か暦年かの確定は `METRIC-YEARFORMAT-KAKEI-01` (2026-10-07 追記に当指標が含まれる) で行い、本提案では新しい不具合を起票しない。

## 採用決定

**ユーザー承認待ち。** 承認前は `data/themes/catalogs/` と metric config を編集しない。判断が要る点は次のとおり。

1. `average-temperature` を外す (推奨) か、光熱・水道の読みに要るものとして残すか。残す場合は理由を `selection` に書き、章「物価指数と家計の支出額」に気温のカードを戻す。
2. 9 指標の `years` を 2013〜2024 に広げ、`theme-cpi-heatmap` を `cpi-heatmap` に作り替える (推奨)。広げた観測値の再取得と R2 反映はデプロイと同じ承認で行い、公開は d56 (2026-11-06) の観測後でよいか。
3. 年の表記 (年度か暦年か) を、この提案の公開前に `METRIC-YEARFORMAT-KAKEI-01` で確定させるか、現行の「年度」表記のまま出して後で直すか。推奨は、統計局の集計期間を一次資料で確かめてから `yearFormat` を直す順で、確かめるまでは触らない。
4. 7 月版の「家賃除く総合を primary にする」を取り下げ、secondary のまま残してよいか。
5. 光熱・食料の 2 章を「物価指数と家計の支出額」の 1 章にまとめ、`expenses` と重複するカード 2 枚を外してよいか。

実装後は、承認日・branch / PR・選定根拠の出典・warning の増減・件数基準と調査紐付け ratchet の変更をここに追記する。
