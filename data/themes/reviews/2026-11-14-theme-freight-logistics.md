---
type: theme-catalog-review
date: 2026-11-14
status: implemented-pending-release
theme: freight-logistics
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 物流と貨物輸送 (freight-logistics)

## 結論

先頭の章を、総量だけだったトラック事業者・貨物車の章から、面積あたりの道路密度(主要道路実延長)を先頭に置いた章へ組み替え、トラック事業者は同じ章に総量として並べた。検索需要が大きい港・空港の問いは、現カタログに無かった海運(海上出入貨物・港数)と空港数を登録済みの指標から足して、鉄道貨物の章を「港と鉄道」、航空の章を「空港と航空貨物」に広げ、章数は3のまま増やしていない。貨物車数は最新年が2008年で止まり、先頭の章に置けず他の章にも属さないため、カードから外して一覧だけに残した。

THEME-PAGE-REVIEW-01 の段 4 (全 56 テーマの指標の見直し)。調査 (theme-researcher) と設計 (theme-designer) の結果を機械で検査し (実在しない指標・重複・取りこぼし・`validate:catalog`)、通った案をカタログへ適用した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 港が多い都道府県・港湾の貨物取扱量が多い県はどこか |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 306・クリック 23・クリック率 7.5%・平均順位 5.8 (`data/themes/portfolio.json#freight-logistics/metricsAllRoutes28d`) |
| 進行中の実験 | なし |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 港が多い都道府県・港湾の貨物取扱量が多い県はどこか | W45 queries.csv: 「港が多い都道府県」45回、「港湾 取扱貨物量ランキング 日本」8回、「港の数 ランキング」24回(1クリック)、「港の数」6回。いずれも現カタログに港・海運の指標が無い |
| 空港がない県はどこで、なぜないのか(航空貨物の拠点はどこか) | W45 queries.csv: 「空港がない都道府県」45回、「空港ない 県」10回、「空港がない県 理由」8回、「空港が ない 県 なぜ」8回。航空貨物輸送量は載っているが空港数は無い |
| 高速道路・道路の長さや密度は県でどれだけ違うか(トラック輸送の基盤) | W45 queries.csv: 「高速道路長さランキング」11回、「道路実延長とは」27回、「道路密度」8回、「道路整備率 ランキング」24回。道路基盤の指標は現カタログに無い |
| 貨物輸送が県の規模に対して多いのか(人口あたり・面積あたりで見るとどうか) | 物流語の検索は小さく、確認できた直接語は「貨物取扱量ランキング 日本」1回など。現カタログ4指標は総量(トン・kg・両・者)のみ。登録済み4指標とも data/metrics に人口・面積あたりの派生単位(トン/10万人 等)がある |
| トラック事業者や貨物車は減っているのか(2024年問題・ドライバー不足) | 検索語では「タクシードライバー 年収」2回など直接語は少なく需要は未確認。カタログの section 文言が2024年問題を掲げ、truck-operators は 1975〜2023 の49年分あるが number-of-freight-cars は 1975〜2008 で止まる(inventory.json) |

## 適用前の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | トラック事業者や貨物車両の供給体制は維持されているか (`road-freight-and-operators`) | トラック事業者、貨物車数 | — |
| 2 | モーダルシフトを支える鉄道貨物輸送の利用は進んでいるか (`rail-freight-transport`) | JR貨物発送量 | — |
| 3 | 緊急・高付加価値品を運ぶ航空貨物輸送の拠点機能はあるか (`air-cargo-transportation`) | 航空貨物輸送量 | — |

## 実装した構成 (カタログの現在の形)

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | トラックが走る道路の密度と事業者数は県でどれだけ違うか (`road-freight-and-operators`) | 主要道路実延長(面積あたり)、トラック事業者 | — |
| 2 | 港と鉄道の貨物拠点はどこにあるか (`rail-freight-transport`) | 港湾の対象港数、海上出入貨物、JR貨物発送量 | — |
| 3 | 空港はあるか、航空貨物はどれだけ扱っているか (`air-cargo-transportation`) | 空港数、航空貨物輸送量 | — |

見せ方 (推移・数値・構成比) は `apply-design.ts` がデータの形 (年の数・単位) に合わせて決め直した。

## 足した指標 (登録済みの指標をカタログに載せた。role は secondary)

| 指標 | rankingKey | 年 | 答える問い |
|---|---|---|---|
| 主要道路実延長(面積あたり) | `main-road-length-per-km2` | 1975〜2023 | 「道路密度」「道路実延長とは」など道路基盤の検索に対し、トラック輸送の基盤を総面積1km²あたりの密度で県どうし比べられる。 |
| 海上出入貨物 | `maritime-import-export-cargo` | 2005〜2023 | 「港湾 取扱貨物量ランキング 日本」「港が多い都道府県」に答える海運の貨物量で、現カタログに無い海の輸送を足す。 |
| 港湾の対象港数 | `port-count` | 2025〜2025 | 「港が多い都道府県」「港の数 ランキング」に直接答える県別の港数を示す。 |
| 空港数 | `airport-count` | 2007〜2007 | 「空港がない都道府県」「空港がない県 理由」に答える県別の空港数を示し、航空貨物量の背景にする。 |

## 不採用・保留の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 道路平均交通量(台/12h) | average-road-traffic-volume | 0000010103 | 登録済 | isActive:true、2005〜2020の4時点。トラック輸送の通行量の基盤。検索需要は道路語(道路密度8回など)で間接的 |
| 運輸業・郵便業の事業所数 | number-of-establishments-transport-post | 0000010103 | 登録済 | isActive:true、年数は未確認(inventory に項目なし)。トラック事業者以外も含む物流業全体の厚み。人口あたり版を探す際の候補 |

## 確かめたこと・確かめていないこと (agent の申告)

- data/themes/catalogs/freight-logistics.json を読み、現在の指標4件(jr-freight-shipment が primary、他3件が secondary)と3章の構成、charts が空であることを確認した
- main-road-length-per-km2 は data/metrics に実在し isActive:true、years 1975〜2023、subtitle が「総面積1km2当たり」の密度指標で、どのテーマの指標にも載っていないことを grep で確認した
- maritime-import-export-cargo(2005〜2023, ports で context)、port-count(2025のみ, isActive:true, ports で context)、airport-count(2007のみ, isActive:true, tourism で context)は data/metrics に実在し isActive:true を確認した。他テーマで primary のものは足していない(road-length-per-km2 は roads の primary なので避けた)
- jr-freight-shipment 2005〜2023・air-cargo-transport 1985〜2023・truck-operators 1975〜2023 は inventory.json で2年以上あることを確認した。trend ブロックは1ブロック1指標のみで、3指標・単位2種の上限内
- 先頭の章の stat 2ブロックは最新年2023(main-road-length-per-km2、truck-operators)で、2015年以前の指標は置いていない。number-of-freight-cars(最新年2008)は drop
- 主要道路実延長は密度なので割合系を先頭にできた。一方、港と鉄道の章と空港の章は総量・個数のみ。登録済みの指標に割合・人口あたりを独立した指標として持つものは無く、truck-operators・jr-freight-shipment・air-cargo-transport・海上出入貨物・port-count・airport-count には data/metrics に人口10万人あたり・100km²あたりの換算単位が定義されているだけなので、総量のままにした。画面でその換算を選べるかは未確認
- composition は使っていない。足して全体になるかを確かめた組が無いため
- airport-count は2007年の1年のみで古い。stat ブロックに置くが、推移にはしていない。port-count は2025年の1年のみで、これも stat のみ
- 未確認: e-Stat API への statsDataId の照合(data/metrics の記載のみ)、maritime-import-export-cargo の cdCat01、freight-od 埋め込み節を新構成でどの章に残すか、章 key rail-freight-transport と air-cargo-transportation を内容が広がった後も維持してよいか
- 未確認: 先頭を港の章にする案(検索需要は港が大きい)は、登録済みの港・海運の指標が総量のみで制約2を満たせず採用しなかった。人口あたりの港湾貨物が必要なら、換算単位を指標として独立させる案が別途要る
- 起票候補: 港・海運・空港の指標に人口あたり・面積あたりを独立した指標として登録するか、テーマ側で換算を選べるようにする案(今回の設計で総量のみの章が2つ残った)
- 調査の未確認: e-Stat の statsDataId の実在は data/metrics の記載値(0000010103)を読んだだけで、API では照合していない。cdCat01 は全候補で未確認
- 調査の未確認: port-count の isActive・出典は data/metrics を読んでいない
- 調査の未確認: 人口あたり・面積あたりの派生値は、登録済みの 4 指標すべてで data/metrics に単位が記載されていることだけ確認した。画面に出る組み込みかどうかは未確認
- 調査の未確認: data/themes/viewpoints/selection.json は読んでいない
- 調査の未確認: freight-od(発着県別の貨物流動)の中身は確認していない
- 調査の未確認: 物流語の検索は検索語ファイル 1 週分(W45)の grep のみ。トラック・宅配系の需要は少ないと見えるが網羅は未確認
- 調査の未確認: 起票候補: なし

## 採用決定

2026-11-14 オーナーの指示 (提案は基本的に承認する。出し直しが要る案は設計し直して自動で承認とする) により採用。
実装: `apply-design.ts --approved freight-logistics` でカタログへ適用し、`validate:catalog` は error 0・warning の増減なし。
公開日に実験を `metricScope: all-routes` で登録する。
