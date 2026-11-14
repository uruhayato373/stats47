---
type: theme-catalog-review
date: 2026-11-14
status: implemented-pending-release
theme: railway
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 鉄道 (railway)

## 結論

検索語の回数は駅の数・主要駅 (140 回ほか) が輸送人員 (12 回) より多いので、駅の章を先頭に移し、輸送人員を 2 番目にした。1 指標だけだった貨物の章は輸送の章にまとめて章を 3 のままにし、「電車通勤 割合」「定期代」に答える登録済みの 3 指標を新しい最後の章に足した。駅の数は 2024 年、乗降客数は 2023 年が最新で、先頭の stat 2 つは 2020 年以降を満たす。

THEME-PAGE-REVIEW-01 の段 4 (全 56 テーマの指標の見直し)。調査 (theme-researcher) と設計 (theme-designer) の結果を機械で検査し (実在しない指標・重複・取りこぼし・`validate:catalog`)、通った案をカタログへ適用した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 駅の数が多い都道府県はどこか。人口や面積あたりではどうか |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 37・クリック 3・クリック率 0%・平均順位 None (`data/themes/portfolio.json#railway/metricsAllRoutes28d`) |
| 進行中の実験 | なし |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 駅の数が多い都道府県はどこか。人口や面積あたりではどうか | 2026-W45 queries.csv: 「日本 駅の数 ランキング」31回、「日本で最も 駅数が多い都道府県は」20回、「全国 駅の数」6回、「北海道 駅数」6回、「東京都 駅数」5回。railway-station-count は 2024 の 1 年のみ (inventory) |
| 乗降客数が多い主要駅・都道府県はどこか | 「47 都 道府県 主要駅大きさランキング」140回、同系の表記ゆれ 49・36・10 回、「jr 乗降客数」2回、「単独駅 乗降客数 ランキング」1回、「国土数値情報 駅別乗降客数データ」1回 |
| 鉄道の輸送人員が多い県はどこか。JR と民鉄のどちらが主か | 「鉄道 輸送人員 ランキング」12回 (クリック1)。jr-passenger-transport と private-railway-passenger-transport は 2005-2023 の 19 年 |
| 通勤・通学に電車をどれだけ使うか。定期代はいくらか | 「電車通勤 割合」6回、「通勤人口」1回、「定期代 平均」3回、「通勤定期 値段」1回。commute-by-train は 2010・2020 の 2 年、人数のみで割合ではない |
| 道の駅の数は鉄道駅と混同されやすい (別指標への迷い込み) | 「北海道 道の駅 数」系が多数 (例 15・12・9 回)。鉄道駅の問いと取り違える流入があり、テーマ内で鉄道駅と道の駅を区別して見せる必要がある |

## 適用前の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | JRと民鉄の旅客利用 (`passengers`) | JR輸送人員・民鉄輸送人員 | railway-passenger-trend、railway-passenger-trend-jr |
| 2 | 駅の数と利用 (`stations`) | 鉄道駅数、鉄道駅乗降客数 | — |
| 3 | 貨物輸送 (`freight`) | — | railway-freight-trend |

## 実装した構成 (カタログの現在の形)

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 駅の数と主要駅の利用規模は都道府県でどう違うか (`stations`) | 鉄道駅数、鉄道駅乗降客数 | railway-freight-trend |
| 2 | 鉄道はどれだけの人と貨物を運んでいるか (`passengers`) | JR輸送人員・民鉄輸送人員 | railway-passenger-trend、railway-passenger-trend-jr |
| 3 | 通勤・通学での鉄道の使われ方と家計の負担は (`commute-cost`) | 鉄道・電車通勤通学者数、鉄道通勤定期代・鉄道運賃 | — |

見せ方 (推移・数値・構成比) は `apply-design.ts` がデータの形 (年の数・単位) に合わせて決め直した。

## 足した指標 (登録済みの指標をカタログに載せた。role は secondary)

| 指標 | rankingKey | 年 | 答える問い |
|---|---|---|---|
| 鉄道・電車通勤通学者数 | `commute-by-train` | 2010〜2020 | 「電車通勤 割合」「通勤人口」の問いに、自宅外へ鉄道・電車で通勤・通学する人の数 (2020 年) で答える。 |
| 鉄道通勤定期代 | `train-commuter-pass-consumption-expenditure` | 2000〜2025 | 「定期代 平均」「通勤定期 値段」の問いに、家計調査の世帯あたりの年間支出額 (県庁所在市の値) で答える。 |
| 鉄道運賃 | `train-fare-consumption-expenditure` | 2000〜2025 | 鉄道に払う運賃の世帯あたりの年間支出額 (県庁所在市の値) で、総量中心のテーマに暮らしの負担の視点を足し、定期代の問いと並べて答える。 |

## 不採用・保留の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 駅まで1km未満の世帯の割合 (駅への近さ。総量でなく割合) | station-within-1km-household-ratio | 0004025593 | 登録済 | data/metrics に定義あり・isActive true・2023 の 1 年。現カタログ未掲載。総量だけの駅数を、住民の利用しやすさで補える |
| 鉄道駅数・輸送人員の人口あたり表示 (既存指標の派生単位) | railway-station-count |  | 登録済 | 定義に 駅/10万人・駅/100km² の派生単位があり、jr・民鉄にも 千人/10万人・千人/100km² がある。新規指標でなく表示の切替として載せられるかは呼び元で要判断。駅数は 2024 の 1 年のみ |

## 確かめたこと・確かめていないこと (agent の申告)

- 確認: railway.json の指標 5 件の role と、章 3 つ・チャート 3 つ・metricGroups を読んだ
- 確認: addMetrics の 3 件は data/metrics に定義があり isActive: true。commute-by-train は years が [2010, 2020]、定期代・運賃は 2000-2025。sourceUrl は各定義ファイルの source.url をそのまま写した
- 確認: 先頭の章の railway-station-count (最新 2024) と railway-passengers (最新 2023) はどちらも 2020 年以降で、2015 年以前の指標は先頭に無い
- 確認: いまの context を除く 4 指標 (railway-passengers, jr-passenger-transport, private-railway-passenger-transport, railway-station-count) は各 1 ブロックだけに入り、drop は空。trend は 2 年以上ある指標だけで、1 ブロック 2 指標・単位 1 種
- 確認: composition は使っていない (足すと全体になる組を確かめられなかったため)
- 確認: 駅数・乗降客数のどちらも entities は prefecture を含む。ただし定期代・運賃の値は都道府県庁所在市 (二人以上世帯) の年間値で、定義の note に県全体でないと書かれている。見出しには県全体とは書いていない
- 制約 2 について: 先頭の章は駅数・乗降客数の総量だけで、同じ章に並べられる割合・人口あたりの登録指標が見つからなかった。railway-station-count の定義には 駅/10万人・駅/100km² の派生単位があるが、画面で切り替えて出せるかは未確認
- station-within-1km-household-ratio (割合、2023) は entities が city だけで prefecture を含まないため、都道府県の章に置かなかった。市区町村のページ向けに別途検討する余地がある
- 未確認: jr-freight-shipment は role が context で、context はカードに出さない規則がある。貨物のブロックとして載せてよいかは呼び元で要判断 (載せない場合は輸送の章の 2 つ目のブロックを外すだけでよい)
- 未確認: commute-by-train は 2 年だけなので stat にした。人数であって割合ではない (派生単位 人/10万人 はある)
- 未確認: railway-passengers の 1 件の意味 (駅ごとの合計か県の合計か)。見出しは「乗降客数」とだけ書いた
- 未確認: e-Stat API や Web での統計表の実在、data/themes/viewpoints/selection.json の規則の全文、geographic-access カタログとの指標の重なりの扱い (railway-station-count と railway-passengers は geographic-access にも載っている)
- 調査の未確認: selection.json の視点の中身は詳しく読んでいない (grep のみ)
- 調査の未確認: e-Stat API・Web での統計表の実在確認はしていない。ID は data/metrics の定義ファイルの記載をそのまま書いた
- 調査の未確認: station-passengers-annual-total は isActive false のため候補から外した。公開してよいかは未確認
- 調査の未確認: railway-passengers の年の数は 5 (2019-2023) だが、駅別を県に集計する方法は未確認
- 調査の未確認: 検索語の表示回数はサイト全体の記録で、テーマ・県別ページへの流入とは限らない。railway-station-count の派生単位が実際に画面で出るかは未確認
- 調査の未確認: general-project-investment-railway は 1975-2006 で古いため候補から外した

## 採用決定

2026-11-14 オーナーの指示 (提案は基本的に承認する。出し直しが要る案は設計し直して自動で承認とする) により採用。
実装: `apply-design.ts --approved railway` でカタログへ適用し、`validate:catalog` は error 0・warning の増減なし。
公開日に実験を `metricScope: all-routes` で登録する。
