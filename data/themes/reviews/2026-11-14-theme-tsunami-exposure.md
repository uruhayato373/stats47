---
type: theme-catalog-review
date: 2026-11-14
status: implemented-pending-release
theme: tsunami-exposure
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 津波と沿岸防災 (tsunami-exposure)

## 結論

いまの 2 章は各 1 指標で、どちらも棟数の総量だけです。そのため、率の指標である個別避難計画の作成率 (2026 年、47 県) を 1 件足し、先頭の stat に置きました。1 章 1 指標の章を作らない制約から、避難ビルとタワーを 1 章にまとめました。章の key は、津波の浸水想定の節を埋め込んでいる tsunami-evacuation-building を残しています。

THEME-PAGE-REVIEW-01 の段 4 (全 56 テーマの指標の見直し)。調査 (theme-researcher) と設計 (theme-designer) の結果を機械で検査し (実在しない指標・重複・取りこぼし・`validate:catalog`)、通った案をカタログへ適用した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 自分の県は津波が来たとき危険か。津波の危険度で県を比べたい |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 313・クリック 2・クリック率 0.6%・平均順位 9.13 (`data/themes/portfolio.json#tsunami-exposure/metricsAllRoutes28d`) |
| 進行中の実験 | なし |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 自分の県は津波が来たとき危険か。津波の危険度で県を比べたい | GSC 2026-W45 queries.csv: 「千葉県 津波 危険度 ランキング」表示25回、「神奈川県 津波 危険度 ランキング」15回、「神奈川県 津波危険度ランキング」2回、「津波が 起こり やすい 県ランキング」4回、「津波が多い県」2回。現カタログは施設数だけで危険度の指標は無い |
| 津波避難タワーは何基あるか、どこにあるか | 「津波避難タワー 数」9回、「津波避難タワー」8回、「高知県 津波避難タワー 数」2回、「津波避難タワー 高さ」「津波避難タワー 問題点」各1回。クリックは「津波避難タワー 数」「津波避難タワー」で各1回 |
| 個別避難計画の作成率は県でどれだけ違うか | 「個別避難計画 作成率」20回(クリック2・平均順位4.85)、「個別避難計画 策定率」17回、「個別避難計画」1回。同テーマ外の防災語だが需要はテーマ内で最大級 |
| 県名で津波を調べる人は、その県の津波の備え・想定を知りたい(県ページ) | 「岐阜県 津波」7回、「滋賀県 津波」6回、「兵庫県 津波」3回、「香川 津波」2回、「滋賀県津波」2回、「長崎 津波」1回など。海なし県の検索も含まれるため、対象外県を0件と扱わない説明の需要がある |
| 津波が来ない県はあるか、浸水想定区域はどこまでか | 「津波が来ない県」3回(順位3.00)、「千葉 津波 どこまで」2回、「浸水想定区域 東京都」1回 |

## 適用前の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 津波発生時に駆け込める避難ビルは確保されているか (`tsunami-evacuation-building`) | 津波避難ビル整備数 | — |
| 2 | 高台や高層ビルのない沿岸部で避難タワーの整備は進んでいるか (`tsunami-evacuation-tower`) | 津波避難タワー等整備数 | — |

## 実装した構成 (カタログの現在の形)

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 津波に備える避難の体制は県ごとにどれだけ違うか (`tsunami-evacuation-building`) | 個別避難計画の作成率、津波避難ビル整備数、津波避難タワー等整備数 | — |

見せ方 (推移・数値・構成比) は `apply-design.ts` がデータの形 (年の数・単位) に合わせて決め直した。

## 足した指標 (登録済みの指標をカタログに載せた。role は secondary)

| 指標 | rankingKey | 年 | 答える問い |
|---|---|---|---|
| 個別避難計画の作成率 | `individual-evacuation-plan-coverage-rate` | 2026〜2026 | 「個別避難計画 作成率」「個別避難計画 策定率」の検索に答え、棟数だけの現カタログに率の指標を足す。 |

## 不採用・保留の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 緊急避難場所まで500m未満の世帯の割合 | evacuation-site-within-500m-household-ratio | 0004025597 | 登録済 | data/metrics に定義があり isActive: true、単位％、年は2023の1年のみ。世帯あたりの割合で、避難ビル棟数を補う。ただし定義の entities が city のみで、都道府県の値があるかは未確認(inventory.json の metricInfo にも無い) |
| 耐震改修工事実施率(持ち家) | earthquake-renovation-rate | 0004025528 | 登録済 | isActive: true、単位％、年は2023の1年のみ、47都道府県。津波そのものではなく地震への備えの割合指標のため関連度は中。津波の危険度ランキング需要には直接答えない |
| 自然災害による死者数 | natural-disaster-deaths |  | 登録済 | isActive: true、単位は人で総量。津波に限らず自然災害全体のため、載せるなら人口あたりの別指標を探す必要があり優先度は低い |
| 災害被害額(人口1人当たり) | disaster-damage-amount-per-person | 0000010211 | 登録済 | isActive: true、単位は円、人口あたりの指標。津波に限らない災害全般の被害で、危険度の代理には使えない。補助的な文脈用 |

## 確かめたこと・確かめていないこと (agent の申告)

- 確認済み: tsunami-exposure.json の指標は避難ビル数 (primary) とタワー等数 (secondary) の 2 件で、どちらも棟の総量。章は 2 つで各 1 指標
- 確認済み: inventory.json の metricInfo で、避難ビル数は 2021〜2023 の 2 年・47 県・棟。個別避難計画の作成率は 2026 の 1 年・47 県・％。data/metrics/tsunami-evacuation-tower-count.ts の years は 2021 と 2023
- 確認済み: data/metrics/individual-evacuation-plan-coverage-rate.ts は存在し isActive: true、entities は prefecture、出典 URL は定義の source.url をそのまま写した
- 確認済み: 作成率の分母は避難行動要支援者名簿の掲載人数で、作成率は実際の避難成功率ではないと定義の note にある。津波に限った指標ではなく、避難体制の備えの率として置いた
- 確認済み: individual-evacuation-plan-coverage-rate は safety テーマに secondary として載っている。他テーマの primary ではない
- 確認済み: 避難ビルとタワーの定義の note に、40 県が調査対象で対象外 7 県は数値なしとある。ranking ブロックの説明で 0 件扱いをしない前提を保つ
- 確認済み: composition ブロックは使っていない。trend も使っていない (タワーは 2 年あるが、2023 年は洪水用施設を除いた自治体があり推移の解釈が難しいため ranking にした)
- 確認済み: 登録済みの津波専用指標は総量の 2 件だけで、割合・人口あたりの津波指標は data/metrics のファイル名検索 (tsunami・evacuat・disaster・hazard・flood など) では見つからなかった。このため津波の棟数は総量のまま、同じ章に作成率を並べた
- 未確認: evacuation-site-within-500m-household-ratio は定義の entities が city のみで、都道府県の値があるか確認していない。このため追加しなかった
- 未確認: earthquake-renovation-rate (47 県・2023 年・％) は津波への備えを直接表さないため追加していない。需要の根拠は GSC 2026-W45 の 28 日分だけで小さい
- 未確認: 章を 1 つにまとめた結果、いまの節にある embeddedSectionKeys (tsunami-scenario-exposure) との対応は変わらない見込みだが、生成物での表示は確かめていない
- 調査の未確認: 津波の浸水想定人口・浸水域人口・海岸線延長など、津波の危険度そのものを表す登録済み指標は data/metrics のファイル名検索では見つからなかった。未登録の候補は e-Stat や官公庁資料を調べておらず、statsDataId を確認できていないため候補に入れていない
- 調査の未確認: evacuation-site-within-500m-household-ratio は entities が city のみで、都道府県別の値があるか確認していない
- 調査の未確認: individual-evacuation-plan-coverage-rate の statsDataId・出典調査名は定義の該当行まで確認していない
- 調査の未確認: data/themes/viewpoints/selection.json の中身は読んでおらず、grep でヒットが出なかっただけ
- 調査の未確認: GSC は2026-W45の28日分だけで、津波の語の表示回数は小さい(最大25回)ため需要の根拠は弱い
- 調査の未確認: 人口あたり・面積あたりの津波避難ビル・タワー数が登録済みかは、ファイル名の grep では見つからなかった(tsunami 名のファイルは総量の2件のみ)

## 採用決定

2026-11-14 オーナーの指示 (提案は基本的に承認する。出し直しが要る案は設計し直して自動で承認とする) により採用。
実装: `apply-design.ts --approved tsunami-exposure` でカタログへ適用し、`validate:catalog` は error 0・warning の増減なし。
公開日に実験を `metricScope: all-routes` で登録する。
