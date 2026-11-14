---
type: theme-catalog-review
date: 2026-11-14
status: implemented-pending-release
theme: safety
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 安全 (safety)

## 結論

いまの 9 章のうち、警察官数・高齢者事故・消費生活相談の 3 章は 1 指標だけの章で、同じ話題の章 (犯罪・交通・火災と救急) が前後に二重にあったため、近い章へ統合して 5 章にした (章は増えていない)。章の順は検索需要の大きさ (警察官数・火災死者・救急到着時間が上位、避難計画・津波避難タワーが続く) に合わせ、犯罪、火災と救急、交通、避難、自然災害の被害の順にした。先頭の章は人口千人当たり・検挙率・人口千人当たりの警察官数 (いずれも最新年が 2023〜2024 年) を stat にし、救急車の到着時間への検索 (表示 60 回超) に答える登録済みの ambulance-hospital-arrival-time だけを足した。

THEME-PAGE-REVIEW-01 の段 4 (全 56 テーマの指標の見直し)。調査 (theme-researcher) と設計 (theme-designer) の結果を機械で検査し (実在しない指標・重複・取りこぼし・`validate:catalog`)、通った案をカタログへ適用した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 救急車が呼んでから病院に着くまで何分かかる県はどこか |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 266・クリック 5・クリック率 1.9%・平均順位 8.38 (`data/themes/portfolio.json#safety/metricsAllRoutes28d`) |
| 進行中の実験 | なし |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 救急車が呼んでから病院に着くまで何分かかる県はどこか | GSC 2026-W45 queries.csv で「救急車 到着 時間 ランキング」表示48回(クリック2)、「救急車 到着 時間 都 道府県 別」5回、「救急車 到着時間 ランキング」7回。登録済み ambulance-hospital-arrival-time(isActive true)はカタログ未掲載。 |
| 火災で亡くなる人が多い県はどこか | 「火災 死者数 ランキング 日本」表示57回(クリック6)、「火災 死亡 者 ランキング」24回。fire-deaths-per-100k は掲載済み。 |
| 警察官は人口に対して何人いるか、負担率の高い県はどこか | 「警察官 人口負担率 ランキング」66回、「警察官 人数 ランキング」91回、「警察官 人数」72回、「全国 警察 人数 ランキング」46回など。police-officer-count-per-population は掲載済み。 |
| 個別避難計画は進んでいるか、津波避難タワーはどこに多いか | 「個別避難計画 作成率」表示20回(クリック2)、「個別避難計画 策定率」17回、「津波避難タワー」8回/「津波避難タワー 数」9回。両指標とも掲載済み。 |
| 交通事故が少ない県はどこか(人口あたり・発生率) | 「交通事故 死亡 ランキング」12回、「人口10万人あたりの交通事故発生件数 ランキング」9回、「交通事故 市町村 ランキング」3回(いずれもクリック0・平均順位が低い語あり)。 |

## 適用前の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 犯罪の認知と検挙 (`crime`) | 刑法犯認知件数（人口千人当たり）、検挙率 | crime-count-arrest-rate-trend、safety-crime-types-donut |
| 2 | 交通事故の発生と人的被害 (`traffic`) | 交通事故死者数（人口10万人当たり）・交通事故負傷者数（人口10万人当たり）、交通事故発生件数（人口10万人当たり） | traffic-accident-deaths-trend |
| 3 | 火災と救急需要 (`fire-emergency`) | 火災出火件数（人口10万人当たり）・救急出動件数（人口千人当たり）、火災死者 | fire-emergency-trend、fire-emergency-trend-fire、safety-fire-casualties-donut |
| 4 | 地域の治安や犯罪の取り締まり状況はどうなっているか (`crime-safety`) | 警察官数（人口千人当たり） | — |
| 5 | 交通事故の発生率や死傷者の危険性は高いか (`traffic-safety`) | 高齢者事故 | — |
| 6 | 火災のリスクや消防・救急の態勢は十分か (`fire-and-emergency`) | 救急自動車数（人口10万人当たり）、消防吏員数（人口10万人当たり）・消防ポンプ自動車等現有数（人口10万人当たり）、消防水利数 | — |
| 7 | 自然災害による人的・物的被害や復旧費用はどれくらいか (`natural-disaster-impact`) | 自然災害による死者数・自然災害による行方不明者数・自然災害による負傷者数、自然災害による全壊住家棟数・自然災害による半壊住家棟数・自然災害による一部破損住家棟数、災害被害額（人口1人当たり）、災害復旧費（都道府県財政）・災害救助費 | safety-natural-disaster-impact-composition-1、safety-natural-disaster-impact-composition-2 |
| 8 | 災害時の避難体制や要支援者の個別避難計画は整備されているか (`evacuation-and-disaster-prevention`) | 個別避難計画の作成率、避難行動要支援者名簿の掲載人数、個別避難計画が作成された人数、津波避難ビル数・津波避難タワー等数 | — |
| 9 | 悪質商法や詐欺などの消費者トラブルの相談窓口は活用されているか (`consumer-trouble-safety`) | 消費生活相談受付件数（年度） | — |

## 実装した構成 (カタログの現在の形)

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 自分の県は犯罪や詐欺の被害に遭いやすいか、警察は足りているか (`crime`) | 刑法犯認知件数（人口千人当たり）、検挙率、警察官数（人口千人当たり）、消費生活相談受付件数（年度） | crime-count-arrest-rate-trend、traffic-accident-deaths-trend、safety-crime-types-donut |
| 2 | 火災で亡くなる人は多いか、救急や消防の態勢は十分か (`fire-emergency`) | 火災出火件数（人口10万人当たり）、火災死者、救急搬送の病院収容所要時間、救急出動件数（人口千人当たり）・救急自動車数（人口10万人当たり）、消防吏員数（人口10万人当たり）・消防ポンプ自動車等現有数（人口10万人当たり）、消防水利数 | fire-emergency-trend、fire-emergency-trend-fire、safety-fire-casualties-donut |
| 3 | 交通事故で死傷する危険は高いか (`traffic`) | 交通事故死者数（人口10万人当たり）、交通事故負傷者数（人口10万人当たり）・交通事故発生件数（人口10万人当たり）、高齢者事故 | — |
| 4 | 災害のとき逃げる備えは整っているか (`evacuation-and-disaster-prevention`) | 個別避難計画の作成率、個別避難計画が作成された人数、津波避難ビル数・津波避難タワー等数 | — |
| 5 | 自然災害でどれくらいの被害や費用が出ているか (`natural-disaster-impact`) | 災害被害額（人口1人当たり）、自然災害による死者数、自然災害による行方不明者数、自然災害による負傷者数、自然災害による全壊住家棟数、自然災害による半壊住家棟数、自然災害による一部破損住家棟数、災害救助費 | safety-natural-disaster-impact-composition-1、safety-natural-disaster-impact-composition-2 |

見せ方 (推移・数値・構成比) は `apply-design.ts` がデータの形 (年の数・単位) に合わせて決め直した。

## 足した指標 (登録済みの指標をカタログに載せた。role は secondary)

| 指標 | rankingKey | 年 | 答える問い |
|---|---|---|---|
| 救急搬送の病院収容所要時間 | `ambulance-hospital-arrival-time` | 2024〜2024 | 「救急車 到着 時間 ランキング」「救急車 到着時間 都道府県別」の検索に、救急要請から病院収容までの平均分数で答える。 |

## 不採用・保留の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 交通事故発生件数(道路1000km当たり) | traffic-accident-count-per-1000-km | 0000010211 | 登録済 | isActive true・1975-2023。カタログ未掲載。人口あたりと別に道路延長あたりの事故密度で、人口あたり指標の偏りを補う。検索需要は直接は確認できず。 |
| 消防機関出動回数(人口10万人当たり) | fire-department-dispatch-count-per-100-thousand-people | 0000010211 | 登録済 | isActive true。カタログ未掲載(掲載は救急出動と建物火災件数)。消防体制の負荷を人口比で示す。検索需要は未確認。 |
| 建物火災損害額(人口当たり) | building-fire-damage-amount-per-person | 0000010211 | 登録済 | isActive true。カタログ未掲載。火災を人的被害(死者)と別に物的被害の人口比で見せる。検索需要は未確認。 |
| 交通事故死傷者数(事故100件当たり) | traffic-accident-casualties-per-100-accidents | 0000010211 | 登録済 | isActive true。カタログ未掲載(死者の100件当たり版は掲載済み)。事故1件あたりの重さを示し、発生件数と被害の重さを分ける。検索需要は未確認。 |

## 確かめたこと・確かめていないこと (agent の申告)

- 確認: safety.json の metrics 46 件のうち context を除く全指標が、いずれか 1 つのブロックにだけ入っている (drop は空)。context のうち disaster-recovery-expenses-prefecture だけは災害復旧費として trend に入れ、他の context はカードに出さない。
- 確認: 先頭の章 crime の先頭 2 ブロック (penal-code-offenses-recognized-per-1000 と criminal-arrest-rate) は stat で、inventory の最新年はどちらも 2023 年。人口千人当たりと割合で、総量だけの指標は先頭にない。
- 確認: trend に入れた 5 ブロックはすべて 2 本・単位 2 種以内で、各指標の登録年数は inventory で 2 年以上 (tsunami 系は 2021〜2023 年の 2 年)。単年の指標 (自然災害の人的・住家被害、個別避難計画、消費生活相談、救急搬送時間) は stat にした。
- 確認: ambulance-hospital-arrival-time は data/metrics に定義があり isActive: true、years は 2024〜2024、出典 URL は https://www.fdma.go.jp/publication/rescue/post-7.html。healthcare カタログでは secondary で、主指標ではないので他テーマの主指標の抱え込みにはあたらない。
- 確認: 総量の指標 (高齢者の交通事故死傷者数・個別避難計画が作成された人数・自然災害の人的/住家被害・災害復旧費・災害救助費・消費生活相談件数) は、同じ章に人口あたりまたは割合の指標 (交通事故死者数/10万人・個別避難計画の作成率・人口1人当たりの災害被害額・人口千人当たり刑法犯) を置いている。
- 確認: composition は使っていない。自然災害の死者・行方不明者・負傷者と、全壊・半壊・一部破損の住家が足して全体になる組かを定義ファイル (description に内訳の定義なし) から確かめられなかったため stat にした。現行の composition-chart と donut 2 種の扱いは、この設計案では blocks に含めていない。
- 確認: 章を 9 から 5 に減らしたので 1 章 1 指標だけの章は無い。ただし現行の embeddedSectionKeys の shelter-applicability や charts の扱いは今回見ていない。
- 未確認: 自殺率 (suicide-rate-per-100k、検索表示が最大級) は context のまま置いていない。テーマ内の位置づけと、カードに出す役割の変更は読者の問いの調査で決めきれていない。
- 未確認: traffic-accident-count-per-1000-km・fire-department-dispatch-count-per-100-thousand-people・building-fire-damage-amount-per-person・traffic-accident-casualties-per-100-accidents は検索需要の根拠がなく、章の指標も十分なので足していない。data/metrics での isActive は grep で true を確認したが、years は一部しか読んでいない。
- 未確認: 検索語の表示回数は調査の結果 (前段) を使い、GSC の元データを自分では読み直していない。selection.json の rules は先頭部分しか読んでいない。
- 調査の未確認: selection.json(指標を選ぶ視点)は候補の採否に使えるほど読み込めていない(grep で一致なしを確認しただけ)
- 調査の未確認: GSC 検索語はサイト全体の28日分で、テーマ別の絞り込み精度は語の grep に依存。2026-W45 以外の週は未確認
- 調査の未確認: ambulance-hospital-arrival-time は e-Stat 外の手入力で statsDataId がなく、単年(2024)のみのため時系列チャートには向かない
- 調査の未確認: 候補4・5と交通事故密度の検索需要は未確認(需要根拠なし、データの空白埋めとしての候補)
- 調査の未確認: e-Stat の API・Web での統計表の実在照合は行っていない。statsDataId は data/metrics の定義にある値のみ
- 調査の未確認: 自殺関連は検索表示が最大級だが、safety カタログには掲載済みのためテーマ内の位置づけは未検証
- 調査の未確認: 検索語の評価は表示回数ベース。クリック0の語が多く、実際の流入価値は未評価

## 採用決定

2026-11-14 オーナーの指示 (提案は基本的に承認する。出し直しが要る案は設計し直して自動で承認とする) により採用。
実装: `apply-design.ts --approved safety` でカタログへ適用し、`validate:catalog` は error 0・warning の増減なし。
公開日に実験を `metricScope: all-routes` で登録する。
