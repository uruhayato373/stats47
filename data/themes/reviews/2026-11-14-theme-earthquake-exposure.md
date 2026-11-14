---
type: theme-catalog-review
date: 2026-11-14
status: implemented-pending-release
theme: earthquake-exposure
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 地震への備え (earthquake-exposure)

## 結論

最初の章は、検索語「耐震化率 都道府県別」に最も近い耐震改修工事実施率(2023年)を先頭に置き、割合どうしを並べるために登録済みの個別避難計画の作成率(2026年)を足した。古い総量の「耐震工事をした住宅数(持ち家)」は2003・2008年のため先頭の章から外し、1 章 1 指標になっていた持ち家の実績の章と保険の章を1つにまとめた(章は3から2に減る)。津波の避難施設は津波テーマが主指標として持っているため、ここには足さない。

THEME-PAGE-REVIEW-01 の段 4 (全 56 テーマの指標の見直し)。調査 (theme-researcher) と設計 (theme-designer) の結果を機械で検査し (実在しない指標・重複・取りこぼし・`validate:catalog`)、通った案をカタログへ適用した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 自分の県の住宅の耐震化はどれくらい進んでいるか(耐震化率を県別に比べたい) |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 85・クリック 2・クリック率 0%・平均順位 None (`data/themes/portfolio.json#earthquake-exposure/metricsAllRoutes28d`) |
| 進行中の実験 | なし |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 自分の県の住宅の耐震化はどれくらい進んでいるか(耐震化率を県別に比べたい) | 検索語「耐震化率 都道府県別」28日で表示9回・平均順位9.3位・クリック0(2026-W45 queries.csv)。現行の指標は耐震改修工事実施率(2023年1時点)のみ。 |
| 津波に備えた避難施設(タワー・ビル)は自分の県にどれくらいあるか、津波の危険度は県で違うか | 「津波」を含む検索語の表示回数合計104回(千葉県 津波 危険度 ランキング25回、神奈川県 津波 危険度 ランキング15回、津波避難タワー 数9回など。クリックは1件)。現行カタログに津波関連の指標はない。 |
| 地震保険に入っている人は県ごとにどれくらいか | 「地震保険 加入率 都 道府県 別」表示1回(2026-W45)。件数は少ない。現行は火災・地震保険料支出(県庁所在市の年額)のみで加入率ではない。 |
| 避難場所が近くにあるか、要支援者の避難計画は作られているか | 「個別避難計画 作成率」表示2回、「個別避難計画 策定率」17回、「個別避難計画」1回(2026-W45)。登録済み指標 individual-evacuation-plan-coverage-rate がまだカタログにない。 |
| 自分の県は地震が多い・危険なのか(地震の危険度ランキング) | 「神奈川 県 地震 危険 度 ランキング」表示1回、「長崎 地震 少ない」1回、「大分 地震」1回。件数は少なく傾向と言い切れない。カタログの説明にある震度帯別人口(embedded earthquake-population)が答えになりうる。 |

## 適用前の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 住宅の耐震化や改修工事は進んでいるか (`housing-earthquake-resistance`) | 耐震改修工事実施率 | — |
| 2 | 持ち家の耐震工事の実績はどれくらいあるか (`earthquake-retrofit-past-performance`) | 耐震工事をした住宅数（持ち家） | — |
| 3 | 地震や火災への金銭的な備えはどれくらいされているか (`fire-earthquake-insurance-spending`) | 火災・地震保険料支出（県庁所在市・二人以上世帯・年額） | — |

## 実装した構成 (カタログの現在の形)

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 自分の県は、住宅の耐震改修や避難の備えをどこまで進めているか (`housing-earthquake-resistance`) | 耐震改修工事実施率、個別避難計画の作成率 | — |
| 2 | 耐震工事の実績や保険の支出は、どれくらい積み上がってきたか (`earthquake-retrofit-past-performance`) | 耐震工事をした住宅数（持ち家）、火災・地震保険料支出（県庁所在市・二人以上世帯・年額） | — |

見せ方 (推移・数値・構成比) は `apply-design.ts` がデータの形 (年の数・単位) に合わせて決め直した。

## 足した指標 (登録済みの指標をカタログに載せた。role は secondary)

| 指標 | rankingKey | 年 | 答える問い |
|---|---|---|---|
| 個別避難計画の作成率 | `individual-evacuation-plan-coverage-rate` | 2026〜2026 | 「個別避難計画 作成率・策定率」と検索する読者の、要支援者の避難計画が自分の県でどこまで作られているかという問いに答える。 |

## 不採用・保留の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 津波避難タワー等数 | tsunami-evacuation-tower-count |  | 登録済 | isActive:true、47都道府県、2021〜2023年の2年(inventory.json)。単位は棟で総量。津波検索語104回に対応。統計表IDは行政報告で e-Stat 非由来のため定義上未設定。 |
| 津波避難ビル数 | tsunami-evacuation-building-count |  | 登録済 | isActive:true、単位は棟で総量。タワー等数と対にして津波の備えを示す。人口あたりの登録済み指標は探した範囲では見つからなかった。 |
| 緊急避難場所まで500m未満の世帯の割合 | evacuation-site-within-500m-household-ratio | 0004025597 | 登録済 | isActive:true、単位は％の割合で、総量でなく世帯割合。避難場所への近さという備えの別の角度を足す。年数は inventory に記録なし。 |
| 耐震改修工事をした持ち家数(2019年以降) | seismic-retrofit-owner-houses-since-2019 | 0000020208 | 登録済 | isActive:true。ただし単位は戸の総量で、割合は現行の earthquake-renovation-rate が同じ系統。人口あたり・世帯あたりの耐震化率の登録済み指標は grep で見つからなかったので優先度は低い。 |

## 確かめたこと・確かめていないこと (agent の申告)

- 確認済み: earthquake-renovation-rate は isActive: true、単位は％(割合)、years は 2023 のみ(data/metrics/earthquake-renovation-rate.ts と inventory.json)。
- 確認済み: individual-evacuation-plan-coverage-rate は isActive: true、単位は％、entities は prefecture、years は 2026 のみ(data/metrics/individual-evacuation-plan-coverage-rate.ts)。sourceUrl は定義ファイルの source.url をそのまま写した。
- 確認済み: earthquake-retrofit-housing は years が 2003・2008 の2年、単位は住宅(総量)、fire-earthquake-insurance-consumption-expenditure は inventory で 2007〜2025 の19年、単位は円。両方 trend の条件(2年以上)を満たし、1 ブロック 1 指標にした。
- 確認済み: 調査の候補 evacuation-site-within-500m-household-ratio と seismic-retrofit-owner-houses-since-2019 は定義ファイルの entities が city だけで prefecture を持たないため、県のテーマには足さない。
- 確認済み: tsunami-evacuation-tower-count / building-count は tsunami-exposure カタログで主指標(building-count が primary)なので、selection.json の owned-elsewhere 規則に従い足さない。個別避難計画の作成率は他テーマでは secondary のみ。
- 確認済み: 最初の章の先頭2ブロックは stat で、最新年が 2023 と 2026(2020年以降)。2015年以前の指標は先頭の章に無い。composition は使っていない。いまのカタログの3指標はいずれかのブロックに入り、同じ rankingKey は重複していない。
- 総量の指標が割合を伴わない点: 2章目の earthquake-retrofit-housing は総量。同じ章の保険支出は世帯あたりの年額で、人口あたりの登録済み指標は見つからなかったため総量のまま残した。定義ファイルに normalizationOptions(人口10万人あたり)があるが、ページがそれを使うかは未確認。
- 保険支出は定義ファイルの note どおり県庁所在市の二人以上世帯の値で、県全体の値ではない。この点は章の見出しに書かず、出典の注意に任せる。
- 未確認: 埋め込みの earthquake-population (震度帯別人口) の中身と、1章目に残るかどうか。設計案ではブロックに入れず、現行どおり1章目に置く前提。
- 未確認: 個別避難計画の作成率が地震の備えとして読者に自然に読まれるか(検索語は計約19回と少なく傾向とは言い切れない)。全災害共通の指標で、地震に限った値ではない。
- 未確認: /areas/<県>/earthquake-exposure の実ページ表示、evacuation-site-within-500m 以外の e-Stat 未登録の耐震化率・地震保険加入率の統計表。
- 調査の未確認: 耐震化率(住宅・建築物の耐震化率)や人口あたり・世帯あたりの地震関連の登録済み指標は、ファイル名の grep では見つからなかった。ファイル名に表れない key は未探索。
- 調査の未確認: e-Stat に未登録の統計表(住宅・土地統計調査の耐震化関連、地震保険加入率)は確認していない。
- 調査の未確認: evacuation-site-within-500m-household-ratio と seismic-retrofit-owner-houses-since-2019 は inventory.json の metricInfo に無く、年数・年次範囲は未確認。
- 調査の未確認: 津波避難施設・個別避難計画の統計表IDは定義ファイル上で未設定のため、e-Stat 由来かの確認はしていない。
- 調査の未確認: 検索語は28日・サイト全体で件数が小さく、傾向として確定できない。震度帯別人口(earthquake-population)の中身は読んでいない。
- 調査の未確認: /areas/<県>/earthquake-exposure の実ページ表示は確認していない。

## 採用決定

2026-11-14 オーナーの指示 (提案は基本的に承認する。出し直しが要る案は設計し直して自動で承認とする) により採用。
実装: `apply-design.ts --approved earthquake-exposure` でカタログへ適用し、`validate:catalog` は error 0・warning の増減なし。
公開日に実験を `metricScope: all-routes` で登録する。
