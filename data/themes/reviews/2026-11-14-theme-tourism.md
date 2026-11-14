---
type: theme-catalog-review
date: 2026-11-14
status: proposal-ready
theme: tourism
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 観光 (tourism)

## 結論

**いまは実装しない。** このテーマには測定中の実験 (`THEME-STRUCTURE-20261008-tourism` (d56 = 2026-12-03)、`THEME-COPY-20261112-tourism` (d56 = 2027-01-07)) があり、章や指標を変えると測定に混ざる。実験の判定が出た後 (2027-01-07 以降) に、その結果を踏まえてこの案を見直してから実装する。

機械で一括に組み直す方法 (`apply-design.ts --approved`) は、このテーマには使わない。同じ日に実験のある 5 テーマへ試したところ、人が作り込んだ図・埋め込みの節・章の構成を固定するテストが落ちた (カタログの検査 1 件・テスト 6 件。変更は取り消した)。実装するときは、提案の採否を 1 項目ずつ決めて手で直す (`theme-proposal-format.md` の手順)。

設計の agent の案: 検索語の中心は外国人観光客なので、章 inbound-visitors-status を先頭に移し、次に観光消費額、その次に宿泊需要の順に並べ直した。宿泊需要の章には、1 指標だけになる「客室稼働率」章と「空路」章を統合した (章は 5 から 3 に減る)。登録済みの指標で検索語に答えるものはすでにカタログにあるため、足す指標は無い。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 外国人観光客・インバウンドが多い県と少ない県はどこか(都道府県ランキング) |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 1207・クリック 25・クリック率 2.1%・平均順位 9.05 (`data/themes/portfolio.json#tourism/metricsAllRoutes28d`) |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 外国人観光客・インバウンドが多い県と少ない県はどこか(都道府県ランキング) | W45 queries.csv: 「外国人」19 回・「外国人が少ない県」13 回・「外国人 少ない県」5 回・「外国人観光客 ランキング 都 道府県」145 回・「訪日 外国人 都 道府県 別ランキング」45 回・「インバウンド 県別 ランキング」14 回(いずれも表示回数)。 |
| 観光客数・観光客が多い県はどこか | 「観光客数 ランキング 都 道府県」52 回・「都道府県 観光客数 ランキング」29 回・「観光客 都道府県 ランキング」11 回・「観光客が少ない県 ランキング」3 回(表示回数)。 |
| 観光消費額が大きい県はどこか | 「観光消費額 都 道府県 ランキング」43 回・「観光消費額 都道府県別」24 回(表示回数)。 |
| 外国人が少ない県を比べるとき、人口に対する割合ではどうなるか(外国人人口・外国人労働者との取り違えを含む) | 「外国人労働者 都道府県 ランキング」21 回・「外国人労働者 多い県」23 回・「千葉県 外国人 割合」3 回(表示回数)。観光ではなく在留外国人の意図が混じる。 |

最初の章についての調査の所見: 最初の章には、検索語の中心である外国人観光客(訪日外国人の都道府県別訪問者数と外国人延べ宿泊者数)を置く。現在は延べ宿泊者数が先頭で外国人の章は 3 番目なので、「外国人観光客が多い県・少ない県」を先頭に移し、観光消費額を次にするのがよい。

## 現行の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 宿泊需要はどれくらいか (`stays`) | 延べ宿泊者数（総数）・外国人延べ宿泊者数、実宿泊者数 | — |
| 2 | 客室稼働率と宿泊供給の参考 (`accommodation`) | 客室稼働率 | theme-tourism-hotel-supply-trend |
| 3 | 外国人観光客の訪問や宿泊は拡大しているか (`inbound-visitors-status`) | 訪日外国人の訪問者数（推計） | — |
| 4 | 観光客は地域でどれくらいお金を使っているか (`tourism-consumption`) | 日本人旅行者の県内消費額、訪日外国人旅行者の県内消費額 | — |
| 5 | 空路を利用した観光客の流入は定着しているか (`air-transport-access`) | 航空旅客 | — |

## 提案する章とカード (未実装)

| 順 | 章 (key) | 見出し | 答える悩み | カード (見せ方) |
|---|---|---|---|---|
| 1 | `inbound-visitors-status` | 外国人観光客が多い県・少ない県はどこか | 外国人観光客がどの県に訪れ、どの県に泊まっているかを知りたい。 | 訪日外国人の訪問者数（推計） (数値)、外国人延べ宿泊者数 (数値) |
| 2 | `tourism-consumption` | 観光消費額が大きい県はどこか | 日本人旅行者と外国人旅行者が、県内でそれぞれどれくらいお金を使っているかを知りたい。 | 日本人旅行者の県内消費額 (数値)、訪日外国人旅行者の県内消費額 (数値) |
| 3 | `stays` | 宿泊する人が多い県・客室が埋まっている県はどこか | 宿泊需要の大きさと客室の埋まり具合、空路での来訪の足を、この県について知りたい。 | 客室稼働率 (数値)、延べ宿泊者数（総数）・実宿泊者数 (推移)、航空旅客 (推移) |

## 足す案の指標 (登録済み・未実装)

| 指標 | rankingKey | 年 | 答える問い | 機械の検査 |
|---|---|---|---|---|
| (なし) | | | | |

## 調査のその他の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 国立・国定公園利用者数 | national-quasi-national-park-visits |  | 登録済 | data/metrics に定義があり isActive: true、単位は千人、年は 2024 のみ。観光客数の検索語に近い「訪れる人の数」の代替。単年のため推移は不可。 |
| 宿泊料消費支出額(家計調査) | accommodation-consumption-expenditure | 0004023605 | 登録済 | isActive: true、2000〜2025 年。住民側の宿泊支出で、観光消費額の検索需要に対する住民視点の補助。受入側ではない点に注意。 |
| 指定施設の入館者数 | designated-museum-visitors |  | 登録済 | isActive: true、単位は人。観光地の集客の補助だが、カタログ未掲載で観光ページとの関連は要判断。 |
| 外国人人口(人口10万人当たり) | foreign-resident-count-per-100k | 0000010201 | 登録済 | isActive: true。「外国人 割合」の検索語に合うが在留外国人であり観光客ではない。観光ページには載せず人口テーマへの導線にとどめる。 |

## 確かめたこと・確かめていないこと (agent の申告)

- 確認: tourism.json の章は stays・accommodation・inbound-visitors-status・tourism-consumption・air-transport-access の 5 つ。先頭は延べ宿泊者数の章で、外国人の章は 3 番目だった。
- 確認: 先頭章の 2 ブロックは stat で、最新年は inbound-visitors-by-destination が 2025、total-overnight-guests-foreign が 2024 (inventory.json の metricInfo と定義ファイル)。2015 年以前の指標は置いていない。
- 確認: 先頭章の 2 指標はどちらも総量。割合・人口あたりの指標は、登録済みのうち外国人の来訪に対応するものが見つからなかったため、総量のままにした (全指標を中身まで grep してはいない)。total-overnight-guests-foreign の定義には人口10万人あたりへの換算 (normalizationOptions) があるが、stat のカードがそれを表示するかは未確認。
- 確認: 消費額の章も総量 2 指標だけ。登録済みの指標に消費額の人口あたりは見つからなかったため総量のまま。割合の客室稼働率 (room-utilization-rate) は、宿泊の章で先頭のブロックに置いた。
- 確認: composition は使っていない。外国人延べ宿泊者数は総数の内数 (評価の根拠は evidenceTopics の summary と各定義の note) で、足すと全体になる組が確かめられなかった。
- 確認: trend は total-overnight-guests と actual-overnight-guests (どちらも 2009〜2024、単位は人泊と人の 2 種) と air-passenger-transport (1975〜2023)。3 指標・2 単位以内。単年の指標は trend に入れていない。
- 確認: カタログの context 以外の指標 7 件 (total-overnight-guests, room-utilization-rate, total-overnight-guests-foreign, actual-overnight-guests, inbound-visitors-by-destination, domestic-travel-consumption-by-destination, inbound-travel-consumption-by-destination) はすべてブロックに入れた。同じ rankingKey を 2 つのブロックに入れていない。
- 確認: jr-passenger-transport は rejectedCandidates に理由があり (railway の主指標)、ブロックに入れていない。air-passenger-transport は context だが現行カタログでカードの組に入っているため、推移として残した。
- 確認: W45 の検索語に「空港」を含むものが 134 行あるが、多くは空港の有無・数に関する語で、航空旅客数の語は目視した範囲では見つからなかった。空路の章を独立させる根拠にはならないと判断した。
- 確認しなかったため足さなかった候補: national-quasi-national-park-visits (国立・国定公園の延べ利用で観光客数の代わりにならない)、designated-museum-visitors (観光ページとの関連が未判断)、accommodation-consumption-expenditure (県庁所在市の住民の支出で受入側の観光消費額ではない)、foreign-resident-count-per-100k (在留外国人で観光客ではない)。
- 未確認: 章を 5 から 3 に減らすため、accommodation 章に付いていた図 theme-tourism-hotel-supply-trend と、埋め込みの節 tourism-seasonality・airport-traffic の付け替え先。stays 章に付ける前提だが、apply 側で未配置・未知参照にならないかは確かめていない。
- 未確認: theme-catalog の検査 (validate:catalog) と、章の並びの表示は実行していない (読み取りだけの依頼)。
- 調査の未確認: 割合・人口あたり・世帯あたりの観光指標(外国人宿泊者の比率、人口あたり延べ宿泊者数など)は、data/metrics のファイル名検索では登録済みのものを見つけられなかった。中身の全件 grep はしていないので、無いとは断定しない。
- 調査の未確認: 訪日外国人・観光客数の指標は inbound-visitors-by-destination が 2025 年の 1 年分だけで推移が出せない。長い系列の候補は未調査。
- 調査の未確認: national-quasi-national-park-visits と designated-museum-visitors の statsDataId・cdCat01 は確認していない。
- 調査の未確認: tourism-resource-count は isActive: false なので候補にしなかった。
- 調査の未確認: 2026-W45 以外の週の検索語、および e-Stat への直接照会は行っていない。

## 採用決定

ユーザー承認待ち。判断が要る点:

1. 実験の判定 (2027-01-07 以降) を見てから、章の順と見出しをこの案へ寄せるか。
2. 足す案の指標のうち、どれを載せるか (機械の検査を通ったものに限る)。
3. 人が作り込んだ図・埋め込みの節・テストで固定した構成のうち、変えてよいものはどれか。
