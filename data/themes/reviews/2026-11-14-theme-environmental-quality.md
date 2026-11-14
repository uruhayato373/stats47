---
type: theme-catalog-review
date: 2026-11-14
status: implemented-pending-release
theme: environmental-quality
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 大気と水環境 (environmental-quality)

## 結論

最初の章は検索需要が最大の PM2.5 達成率(割合・最新2024年)を先頭に維持し、局数は達成率の中身と分母の補足として後ろに回した。BOD と COD を別章に 1 指標ずつ置く構成は「1章1指標」にあたるため水質の章に統合し(章は3から2に減る)、割合・人口あたりの公害苦情と下水道普及率を足して総量だけの章にならないようにした。ごみは waste-recycling テーマと重複するため足していない。

THEME-PAGE-REVIEW-01 の段 4 (全 56 テーマの指標の見直し)。調査 (theme-researcher) と設計 (theme-designer) の結果を機械で検査し (実在しない指標・重複・取りこぼし・`validate:catalog`)、通った案をカタログへ適用した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 日本で一番空気が悪い県・大気汚染ランキングはどこか |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 271・クリック 4・クリック率 1.5%・平均順位 7.87 (`data/themes/portfolio.json#environmental-quality/metricsAllRoutes28d`) |
| 進行中の実験 | なし |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 日本で一番空気が悪い県・大気汚染ランキングはどこか | GSC 2026-W45 queries.csv: 「大気汚染 ランキング 都 道府県」表示41回、「日本で一番空気が悪い県」3回、「日本で1番空気が悪い県」9回、「日本で一番空気が汚い県」5回、「日本 大気汚染ランキング」2回、「pm2.5 多い地域」6回 (表示回数は列順 clicks,impressions,ctr,position の2列目) |
| PM2.5 は地域でどれくらい違い、環境基準を満たしているか | 「pm2.5」11回、「pm2.5 多い地域」6回、「pm2.5とは」7回、「北海道の大気環境」5回、「環境基準達成率」4回。現カタログの PM2.5 達成率は有効測定局ベースで、濃度そのものではない点に注意 |
| 水質汚濁・水質汚濁物質の排出量は県でどう違うか | 「水質汚濁物質排出量総合調査」6回、「水質汚濁物質排出量の違い」5回、「水質 汚濁 グラフ」1回。BOD/COD 汚濁負荷量は2011-2019の5時点で、新しさに限界 |
| ごみ排出量は県別・1人あたりでどう違うか | 「ごみ排出量 ランキング 市町村」35回、「ごみ排出量 ランキング」43回、「1人1日当たりのごみ排出量 ランキング」7回、「ごみ 排出量」4回。ただしごみは別テーマ waste-recycling が存在し重複の判断が要る |
| 海洋汚染・身近な環境の苦情はどうか | 「海洋汚染」8回、「大気汚染防止法施行状況調査」3回。公害苦情は未掲載 |

## 適用前の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 地域の空気は安全でPM2.5の環境基準を満たしているか (`air-quality-and-pm25`) | PM2.5環境基準達成率（一般局）、PM2.5総測定局数（一般局）・PM2.5環境基準達成局数（一般局） | — |
| 2 | 河川の水質汚濁や有機物による環境負荷はどれくらいか (`river-water-quality`) | BOD汚濁負荷量 | — |
| 3 | 湖沼や海域の水質保全や汚濁負荷の状況はどうなっているか (`lake-sea-water-quality`) | COD汚濁負荷量 | — |

## 実装した構成 (カタログの現在の形)

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 空気は汚れていないか。PM2.5の環境基準を満たしているか (`air-quality-and-pm25`) | PM2.5環境基準達成率（一般局）、PM2.5環境基準達成局数（一般局）、PM2.5総測定局数（一般局） | — |
| 2 | 川や海の水は汚れていないか。身近な公害苦情はどれくらいか (`river-water-quality`) | 公害苦情受付件数(人口10万人当たり)、下水道処理人口普及率、BOD汚濁負荷量・COD汚濁負荷量・SS汚濁負荷量 | — |

見せ方 (推移・数値・構成比) は `apply-design.ts` がデータの形 (年の数・単位) に合わせて決め直した。

## 足した指標 (登録済みの指標をカタログに載せた。role は secondary)

| 指標 | rankingKey | 年 | 答える問い |
|---|---|---|---|
| 公害苦情受付件数(人口10万人当たり) | `pollution-complaints-received-per-100k` | 1975〜2023 | 「公害苦情」「身近な環境」の問いに、人口あたりの長い系列(1975-2023)で県の違いと増減を答える。 |
| SS汚濁負荷量 | `ss-pollution-load` | 2011〜2019 | 「水質汚濁物質排出量総合調査」「水質汚濁物質排出量の違い」の検索語に、BOD・COD と同じ表で SS を並べて答える。 |
| 下水道処理人口普及率 | `sewerage-coverage-rate` | 2023〜2023 | 汚濁負荷量(総量)の背景として、生活排水対策がどこまで進んでいるかを割合で示し、水質の章に割合の指標を置く。 |

## 不採用・保留の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 1人1日当たりのごみ排出量 | waste-per-capita-per-day | 0000020208 | 登録済 | isActive:true、2005-2023、1人あたり。「1人1日当たりのごみ排出量 ランキング」の検索需要あり。ただし waste-recycling テーマと重複するため置き場は要判断 |
| ごみのリサイクル率 | waste-recycling-rate | 0000010208 | 登録済 | isActive:true、1999-2023 の 25 年の系列、割合指標。環境への負荷を減らす側の指標。同じく waste-recycling テーマとの重複に注意 |

## 確かめたこと・確かめていないこと (agent の申告)

- 確認済み: カタログ metrics 6 件と sections 3 件・metricGroups 4 件を読み、charts は 0 件だった
- 確認済み: pollution-complaints-received-per-100k / ss-pollution-load / sewerage-coverage-rate の定義ファイルが data/metrics に存在し isActive: true、years は 1975-2023 / 2011-2019 (隔年5時点) / 2023-2023
- 確認済み: pm25-general-station-compliance-rate の years は 2022-2024、棚卸し上 3 年・47県。先頭章の先頭2ブロックは最新2024年の stat
- 確認済み: sewerage-coverage-rate は water-services で secondary (primary ではない) なので、owned-elsewhere の対象外。ss/complaints は他テーマに登録なし
- 確認済み: composition は使っていない(足して全体になる組を確かめていないため)。trend は 1 ブロック 3 指標以内・単位は kg/日で 1 種
- 確認済み: 既存の指標6件のうち context の pm25-valid-general-station-count 以外は全てブロックに入り、同じ rankingKey の重複は無い。pm25-valid-general-station-count (context) は未配置
- 制約2の注記: BOD/COD/SS の汚濁負荷量は総量のまま。定義ファイルに per_population の normalizationOptions はあるが、人口あたりを独立した登録指標としては確認できず、同じ章に割合・人口あたりの苦情件数と下水道普及率を並べた
- 未確認: pollution-complaints-received-per-100k の title は「公害苦情受付件数」で unit は「件」、subtitle のみ「人口10万人当たり」。実際の値の単位が人口10万人当たりかは R2 の値で確認していない(SEO文は1位愛知58.9件・最下位富山12.6件で率の値に見える)
- 未確認: PM2.5 達成率の分母が有効測定局であることはカタログ説明と定義文(有効な一般環境大気測定局に占める割合)から読んだが、stats表の突合はしていない
- 未確認: selection.json の機械規則(single-year-as-trend 等)を実行して通したわけではない。sewerage-coverage-rate は 1 年のみのため stat にした
- 未確認: 大気の濃度そのもの(PM2.5年平均濃度など)や、ごみ指標を waste-recycling テーマとどう分けるかは、探索範囲外で判断していない
- 調査の未確認: data/themes/viewpoints/selection.json は環境語の grep で該当確認のみ(出力なし)で、視点の中身は読んでいない
- 調査の未確認: e-Stat API で statsDataId の実在照合はしていない(data/metrics の定義の記載のみ)
- 調査の未確認: noise-regulation-rate は isActive:false・2016の1年のみのため候補から除外
- 調査の未確認: 大気汚染の濃度そのもの(PM2.5年平均濃度、光化学オキシダント注意報日数)の登録済み指標は data/metrics のファイル名検索では見つからず、未探索分は残る
- 調査の未確認: PM2.5の人口あたり・面積あたりの指標、BOD/COD負荷量の人口あたり値は登録済みの定義を確認できていない
- 調査の未確認: 検索語の表示回数はサイト全体・28日でテーマ単位ではない。クリックは 0 が大半

## 採用決定

2026-11-14 オーナーの指示 (提案は基本的に承認する。出し直しが要る案は設計し直して自動で承認とする) により採用。
実装: `apply-design.ts --approved environmental-quality` でカタログへ適用し、`validate:catalog` は error 0・warning の増減なし。
公開日に実験を `metricScope: all-routes` で登録する。
