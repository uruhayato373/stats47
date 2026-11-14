---
type: theme-catalog-review
date: 2026-11-14
status: implemented-pending-release
theme: roads
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 道路 (roads)

## 結論

検索語の中心は道路密度・舗装率・高速や国道の長さ、トンネル・橋、交通事故なので、先頭の章を「県の広さあたりの道路の長さ・舗装率」(割合 2 本ずつの stat 2 ブロック、最新年 2023) に作り直し、総延長と高速の推移は同じ章に畳み込んだ(高速道路だけの 1 指標章を解消し章は 5 から 4)。需要の大きい橋・トンネルは 2・3 番目に前倒しし、旧い「整備水準と利用状況」は、交通量に道路あたりの事故件数を足した最後の章にした。橋・トンネルの III・IV 件数は診断済総数の一部で足しても全体にならないため、composition ではなく stat にした。

THEME-PAGE-REVIEW-01 の段 4 (全 56 テーマの指標の見直し)。調査 (theme-researcher) と設計 (theme-designer) の結果を機械で検査し (実在しない指標・重複・取りこぼし・`validate:catalog`)、通った案をカタログへ適用した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | トンネルや橋が多い都道府県はどこか |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 44・クリック 5・クリック率 0%・平均順位 None (`data/themes/portfolio.json#roads/metricsAllRoutes28d`) |
| 進行中の実験 | なし |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| トンネルや橋が多い都道府県はどこか | queries.csv(2026-W45): 「トンネルが多い県ランキング」表示26回(クリック1)、「トンネルが多い 県 ランキング」8、「トンネルの数 日本一」5、「橋が多い都道府県」9、「橋の数」8 |
| 交通事故が多い・少ない県はどこか(人口あたり・道路あたり) | queries.csv: 「交通事故 死亡 ランキング」12回(平均掲載25位)、「人口10万人あたりの交通事故発生件数 ランキング」9回、「交通事故が少ない県」3、「交通事故 率 都 道府県 ランキング」1 |
| 高速道路・国道の長さの順位はどうか | queries.csv: 「高速道路長さランキング」11回、「国道 総延長 ランキング」6回(クリック1)、「国道ランキング」6、「九州の高速道路網」7 |
| 道路の整備率・舗装率の順位はどうか | queries.csv: 「道路舗装率 ランキング」25回(クリック1)、「道路整備率 ランキング」24回(クリック1) |
| ガソリンや自動車の使われ方(消費量・自動車の持ち方)は地域でどう違うか | queries.csv: 「ガソリン消費量 日本」15、「ガソリン 消費量」29、「ガソリン使用量」10、「ガソリンスタンド数 都 道府県 ランキング」11。自動車生産系(「自動車 生産 量 ランキング 都 道府県」187回)は生産の話で道路テーマの対象外の可能性が高い |

## 適用前の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 道路ストックの規模と密度 (`road-stock`) | 道路実延長(高速含む)、道路実延長（総面積1km²当たり） | roads-length-trend |
| 2 | 高速道路ネットワーク (`expressways`) | 高速道路延長 | — |
| 3 | 整備水準と利用状況 (`condition-use`) | 主要道路舗装率、道路平均交通量（昼間12時間） | — |
| 4 | 老朽化した道路橋の点検や修繕対策は追いついているか (`road-bridge-maintenance`) | 道路橋の診断済総数、道路橋の早期措置段階（Ⅲ）・道路橋の緊急措置段階（Ⅳ） | roads-road-bridge-maintenance-composition-2 |
| 5 | トンネルの点検状況や危険な状態の施設はどのくらいあるか (`road-tunnel-maintenance`) | トンネルの診断済総数、トンネルの早期措置段階（Ⅲ）・トンネルの緊急措置段階（Ⅳ） | roads-road-tunnel-maintenance-composition-2 |

## 実装した構成 (カタログの現在の形)

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 道路は県の広さに対してどれだけあり、どこまで舗装されているか (`road-stock`) | 道路実延長（総面積1km²当たり）、主要道路実延長（総面積1km²当たり）、主要道路舗装率、市町村道舗装率、道路実延長(高速含む)・高速道路延長 | roads-length-trend |
| 2 | 老朽化した道路橋の点検や修繕対策は追いついているか (`road-bridge-maintenance`) | 道路橋の診断済総数、道路橋の早期措置段階（Ⅲ）、道路橋の緊急措置段階（Ⅳ） | roads-road-bridge-maintenance-composition-2 |
| 3 | トンネルの点検状況や危険な状態の施設はどのくらいあるか (`road-tunnel-maintenance`) | トンネルの診断済総数、トンネルの早期措置段階（Ⅲ）、トンネルの緊急措置段階（Ⅳ） | roads-road-tunnel-maintenance-composition-2 |
| 4 | 道路は多く使われているか、道路あたりの事故は多いか (`condition-use`) | 交通事故発生件数（道路1000km当たり）、道路平均交通量（昼間12時間） | — |

見せ方 (推移・数値・構成比) は `apply-design.ts` がデータの形 (年の数・単位) に合わせて決め直した。

## 足した指標 (登録済みの指標をカタログに載せた。role は secondary)

| 指標 | rankingKey | 年 | 答える問い |
|---|---|---|---|
| 主要道路実延長（総面積1km²当たり） | `main-road-length-per-km2` | 1975〜2023 | 「国道・高速など幹線の長さの順位」に、全道路の密度とは別に幹線だけの密度で答える。 |
| 市町村道舗装率 | `municipal-road-paving-rate` | 1975〜2023 | 「道路舗装率 ランキング」に対し、主要道路の舗装率だけでなく身近な市町村道の舗装率も並べて答える。 |
| 交通事故発生件数（道路1000km当たり） | `traffic-accident-count-per-1000-km` | 1975〜2023 | 「交通事故が多い・少ない県はどこか」に、道路の長さで割った事故件数で答え、総量だけの章に割合を加える。 |

## 不採用・保留の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 交通事故死者数(人口10万人当たり) | traffic-accident-deaths-per-100k | 0000010211 | 登録済 | isActive:true・1975〜2024年(inventory確認、47地域)。検索「交通事故 死亡 ランキング」12回、「交通事故死者数 都道府県 ランキング」に対応。roads.jsonに未掲載 |
| 立体横断施設数(道路実延長千km当たり) | grade-separated-pedestrian-crossings-per-1000-km | 0000010211 | 登録済 | isActive:true・1975〜2023年。道路あたりの歩行者安全施設で、道路延長を分母にした割合。検索需要の直接の根拠は今回の語では未確認、roads.jsonに未掲載 |

## 確かめたこと・確かめていないこと (agent の申告)

- roads.json の metrics 16 件と metricGroups・sections・charts を読み、context 6 件(総延長・国道・主要地方道・市町村道・道の駅など)を除く 10 件が章のブロックに全て入り、重複していないことを確認した。
- inventory.json の metricInfo で road-length-per-km2・main-road-length-per-km2・main-road-paving-rate は 1975〜2023 年・47 地域、road-total-length-with-expressway・road-expressway-length は 2005〜2023 年(19 年)、average-road-traffic-volume は 2005〜2020 年(4 年)、橋・トンネルは 2025 年の 1 年だけであることを確認した。
- 最初の章の先頭 2 ブロックは stat で、road-length-per-km2・main-road-length-per-km2・main-road-paving-rate・municipal-road-paving-rate は定義の years が 2023 まで(2015 年以前ではない)であることを確認した。
- addMetrics 3 件は data/metrics/<key>.ts に実在し isActive: true、years は 1975〜2023、sourceUrl は定義の source.url(https://www.stat.go.jp/data/ssds/index.htm)を写したものであることを確認した。
- traffic-accident-deaths-per-100k は safety.json で primary のため、ほかのテーマの主指標を抱え込まない規則に従い roads には足さなかった。grade-separated-pedestrian-crossings-per-1000-km は検索需要の根拠が未確認なので足さなかった。
- road-bridge-condition-iii-count の定義の検証欄で「Ⅰ+Ⅱ+Ⅲ+Ⅳ=診断済総数」と書かれており、Ⅲ+Ⅳは全体にならないため、既存の composition-chart 2 枚は構成比にしない設計とした(カタログ側でこの 2 枚を外す・差し替えが必要)。
- 橋・トンネルの指標は登録済みの中に道路延長や橋の総数あたりの割合・人口あたりが無いため、総量(診断済総数・区分Ⅲ・Ⅳの件数)のまま 2・3 番目の章に置いた(制約 2 の例外)。
- 未確認: traffic-accident-count-per-1000-km と municipal-road-paving-rate の年数・47 県の充足(inventory の metricInfo に無く、定義の years のみ確認)。
- 未確認: 既存の埋め込み節(highway・bridge-inspection-age)と図 roads-length-trend の扱いは出力形式に無いため見ていない。章を畳んだ後の割り当てはカタログ側で別途確認が要る。
- 未確認: 検索語は 28 日分・サイト全体で表示回数が小さく、橋・トンネルの需要が最大という前段の見立ては県別・roads 限定では区別できない。
- 調査の未確認: selection.json(指標を選ぶ視点)は読んでいない
- 調査の未確認: 検索語は28日・サイト全体の記録で、表示回数が1桁〜20台と少なく需要の差は小さい。「地域×roads」の語は区別できない
- 調査の未確認: traffic-accident-count-per-1000-kmとmunicipal-road-paving-rate等はinventory.jsonのmetricInfoに無く、年数・47地域の充足は未確認(metrics定義のyears範囲のみ確認)
- 調査の未確認: e-Stat APIそのものへは問い合わせていない(statsDataIdとcdCat01はdata/metrics定義の記載)
- 調査の未確認: 橋・トンネルの数が県別にどの単位で載っているか(道路延長あたりの割合の有無)は未調査
- 調査の未確認: ガソリン・自動車保有系の候補(gasoline-consumption-quantity等)はファイル名の存在のみ確認、定義未読で候補から外した

## 採用決定

2026-11-14 オーナーの指示 (提案は基本的に承認する。出し直しが要る案は設計し直して自動で承認とする) により採用。
実装: `apply-design.ts --approved roads` でカタログへ適用し、`validate:catalog` は error 0・warning の増減なし。
公開日に実験を `metricScope: all-routes` で登録する。
