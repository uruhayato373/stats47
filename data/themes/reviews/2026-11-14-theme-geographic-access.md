---
type: theme-catalog-review
date: 2026-11-14
status: implemented-pending-release
theme: geographic-access
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 交通空白と生活アクセス (geographic-access)

## 結論

いまの 3 章は 1 章 1 指標で、先頭の鉄道駅数は総量だけ、バス事業者数は 2013 年で止まっているため、章の数は変えずに指標を足して並べ直した。検索需要の大きい空港・道の駅・駅の供給を最初に置き、先頭には面積あたりの道路の長さ(2023 年)を置いて総量だけの章にしないようにした。バスと空港は 2 章に、車通勤の章には車とバスを同じ単位で並べた推移と割合の指標を置いた。

THEME-PAGE-REVIEW-01 の段 4 (全 56 テーマの指標の見直し)。調査 (theme-researcher) と設計 (theme-designer) の結果を機械で検査し (実在しない指標・重複・取りこぼし・`validate:catalog`)、通った案をカタログへ適用した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 空港がない都道府県・空港が多い県はどこか |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 302・クリック 12・クリック率 4.0%・平均順位 7.52 (`data/themes/portfolio.json#geographic-access/metricsAllRoutes28d`) |
| 進行中の実験 | なし |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 空港がない都道府県・空港が多い県はどこか | 2026-W45 queries.csv: 「九州 空港 ない 県」17回、「岐阜 空港」93回、「岐阜県 空港」54回、「空港がない都道府県」45回、「一番空港が多い都道府県」6回 |
| 道の駅が多い県・少ない県はどこか | 「道の駅数 全国 ランキング」98回、「道の駅 数 ランキング」91回、「道の駅 多い県」71回、「道の駅が多い県」68回、「東京都 道の駅 数」58回 |
| 駅数・主要駅の多さで県を比べると | 「47 都道府県 主要駅大きさランキング」140回(掲載順位1.71)、「47都道府県 主要駅 大きさランキング」36回、「東京都 駅数」5回 |
| 車通勤の割合はどの県で高いか | 「車通勤 割合」15回、「東京 車通勤 割合」9回 |
| 高速道路・道路整備(舗装率など)の県別差は | 「道路舗装率 ランキング」25回、「道路整備率 ランキング」24回、「高速道路長さランキング」11回 |

## 適用前の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 地域の鉄道駅や鉄道網は移動手段として機能しているか (`railway-access`) | 鉄道駅数 | — |
| 2 | 日常の移動を支える路線バスや事業者は維持されているか (`bus-transportation`) | バス事業者数 | — |
| 3 | 通勤・通学における自家用車依存や車に乗れない人の移動環境はどうか (`car-dependent-commute`) | 自家用車通勤・通学者数 | — |

## 実装した構成 (カタログの現在の形)

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 駅・道の駅・道路は身近にどれだけあるか (`railway-access`) | 鉄道駅数、道の駅数 | — |
| 2 | バス事業者や空港はどれだけあるか (`bus-transportation`) | バス事業者数、空港数 | — |
| 3 | 通勤・通学は車と公共交通のどちらで動いているか (`car-dependent-commute`) | 他市区町村への通勤者比率、自家用車通勤・通学者数・乗合バス通勤・通学者数 | — |

見せ方 (推移・数値・構成比) は `apply-design.ts` がデータの形 (年の数・単位) に合わせて決め直した。

## 足した指標 (登録済みの指標をカタログに載せた。role は secondary)

| 指標 | rankingKey | 年 | 答える問い |
|---|---|---|---|
| 道の駅数 | `roadside-station-count` | 2026〜2026 | 「道の駅 多い県」「道の駅数 全国 ランキング」(週 70〜98 回) と検索される、道の駅がどの県に多いかに答える。 |
| 空港数 | `airport-count` | 2007〜2007 | 「空港がない都道府県」「九州 空港 ない 県」「岐阜 空港」と検索される、空港のない県・多い県はどこかに答える。 |
| 乗合バス通勤・通学者数 | `commute-by-bus` | 2010〜2020 | 「車通勤 割合」を知りたい読者が、車の通勤者数と乗合バスの通勤者数を同じ 2010・2020 年で並べて公共交通との差を見られるようにする。 |
| 他市区町村への通勤者比率 | `commuter-ratio-to-other-municipalities` | 1975〜2020 | 「車通勤 割合」「東京 車通勤 割合」を調べる読者に、通勤・通学の章で総量ではなく割合として、他の市区町村へ移動して働く人の比率を示す。 |

足さなかった指標 (機械の検査で外した): `road-length-per-km2` (「道路」テーマの主指標なので抱え込まない)

## 不採用・保留の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 駅まで1km未満の世帯の割合 | station-within-1km-household-ratio | 0004025593 | 登録済 | 単位%・isActive true。総量のみの鉄道章に割合のアクセス指標を足せる(年数は未確認) |
| 道路実延長(可住地・面積あたり系) | road-length-per-km2 | 0000010208 | 登録済 | isActive true、1975-2023の49時点。道路整備の検索(舗装率25回・整備率24回)に対応。ただし棚卸しの単位はkmで、面積あたりか総量かは未確認 |

## 確かめたこと・確かめていないこと (agent の申告)

- 確認: いまのカタログは metrics 3 件 (railway-station-count primary、bus-operators と commute-by-car が secondary)・charts 0 件・章 3 つ (各 1 グループ 1 指標) で、全 3 指標を章のブロックに入れ、drop は空にした
- 確認: addMetrics の 5 指標は data/metrics/<key>.ts に実在し isActive: true。sourceUrl は各定義ファイルの url を写した(roadside-station-count は定義内の https://www.mlit.go.jp/road/Michi-no-Eki/list.html)
- 確認: 最新年は road-length-per-km2 が 2023、railway-station-count が 2024 で、先頭章の先頭 2 ブロックは stat。先頭章に 2015 年以前の指標はない
- 確認: trend は bus-operators (1975-2013 の 39 年)、commute-by-car と commute-by-bus (2010・2020 の 2 時点、単位は人 1 種) で、どれも 2 年以上あり 1 ブロック 2 指標まで。composition は使っていない
- 確認: 同じ rankingKey を 2 つのブロックに入れていない。章は 3 つのままで増やしていない。1 章 1 指標だけの章はない
- 未確認: road-length-per-km2 は ranking_items で road 系テーマ (roads) の primary。「面積 1km² あたり」の密度を駅の少ない地域の車の移動網として置く理由はあるが、owned-elsewhere の確認 (理由が通るか) は人の判断
- 未確認: road-length-per-km2 は面積あたりで、人口あたり・世帯あたり・割合ではない。割合の指標で先頭にできるものは登録済みの中に見つからなかった (main-road-paving-rate は舗装の割合だが、アクセスの問いとは遠い)
- 総量のまま: bus-operators、airport-count、commute-by-car、commute-by-bus、railway-station-count、roadside-station-count は総量で、各定義に人口 10 万人あたり・面積 100km² あたりの normalizationOptions があるが、テーマの画面がそれを使うかは確認していない。2 章は総量だけの章
- 注意: airport-count は 2007 年の 1 時点 (定義の years)、bus-operators は 2013 年までで、どちらも古い。先頭章には置かず、章の注記で年を示す必要がある
- 未確認: station-within-1km-household-ratio (駅まで 1km 未満の世帯の割合) は定義の entities が city のみで都道府県の値があるか確かめられず、年も 2023 の 1 時点なので今回は使っていない。県のページで出せるなら先頭章に置く候補
- 未確認: commuter-ratio-to-other-municipalities は市区町村間の通勤の割合で、車通勤の割合そのものではない。車通勤を通勤者総数で割った割合の登録指標は見つからなかった
- 未確認: 検索回数は前段の調査結果の数字を使い、queries.csv は読み直していない。e-Stat 側の統計表の実在確認はしていない
- 調査の未確認: 道の駅・空港・駅数の検索は多いが、現カタログの最初の章に空港と道の駅が無い
- 調査の未確認: station-within-1km-household-ratio の年数・期間は inventory.json に無く未確認
- 調査の未確認: airport-count と roadside-station-count の statsDataId は metric 定義の先頭部分を確認できず空欄
- 調査の未確認: road-length-per-km2 が面積あたりか総量かは未確認
- 調査の未確認: commute-by-car を通勤者総数で割った割合の登録指標は見つからなかった
- 調査の未確認: e-Stat 側の実在確認は WebFetch 等では行わず、登録済みの定義のみ確認

## 採用決定

2026-11-14 オーナーの指示 (提案は基本的に承認する。出し直しが要る案は設計し直して自動で承認とする) により採用。
実装: `apply-design.ts --approved geographic-access` でカタログへ適用し、`validate:catalog` は error 0・warning の増減なし。
公開日に実験を `metricScope: all-routes` で登録する。
