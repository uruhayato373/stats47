---
type: theme-catalog-review
date: 2026-11-14
status: implemented-pending-release
theme: education-culture
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 教育・文化 (education-culture)

## 結論

いまの 8 章 (旧型の「学校の配置と規模」「高等教育」「文化・社会教育」と新型の 5 章が重なっていた) を 7 章にまとめ、検索需要の大きい順に、児童生徒数と学校 (表示1220回)、教員・大学教授の年収 (表示1588回)、図書館 (2026-W45 queries.csv)、進学、統廃合・教育費、文化、文化財と並べた。先頭の章は割合・密度 (教員1人当たり児童数、可住地100km²当たり小学校数、いずれも最新2024年) を先に置き、総量の児童数・生徒数は推移の折れ線で同じ章に添えた。スポーツ行動者率はスポーツ参加のテーマの主指標、読書行動者率は文化参加のテーマの指標なので、このテーマには足していない。

THEME-PAGE-REVIEW-01 の段 4 (全 56 テーマの指標の見直し)。調査 (theme-researcher) と設計 (theme-designer) の結果を機械で検査し (実在しない指標・重複・取りこぼし・`validate:catalog`)、通った案をカタログへ適用した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 自分の県・市の小学校・中学校の児童生徒数は多いのか、順位はどうか |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 203・クリック 4・クリック率 2.0%・平均順位 8.49 (`data/themes/portfolio.json#education-culture/metricsAllRoutes28d`) |
| 進行中の実験 | なし |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 自分の県・市の小学校・中学校の児童生徒数は多いのか、順位はどうか | 2026-W45 queries.csv で「児童数」「生徒数」を含む語の表示回数の合計は1220回。例: 「小学校 児童数 ランキング」は表示44回、「福岡市 小学校 児童数ランキング」は30回。県名つきの語が多い |
| 教員・大学教授の年収は他の職種や県と比べてどうか | 同 queries.csv で「教員・教授・教諭・先生」を含む語の表示回数の合計は1588回。「高校教員 年収」は189回、「私立大学教授 年収ランキング」は93回、「教員 年収ランキング」は38回 |
| 不登校（長期欠席）が多い県はどこか | 同 queries.csv で「不登校」を含む語の表示回数の合計は33回。「不登校が多い県ランキング」19回、「不登校 都道府県ランキング」8回。順位は9〜21位で、ほぼクリックされていない |
| 図書館の蔵書数・貸出冊数や読書率は県ごとにどう違うか | 同 queries.csv で「図書館 蔵書数 ランキング」85回、「図書館 蔵書数」61回、「図書館 貸出冊数 ランキング」28回、「図書館 貸出 ランキング 全国」25回、「読書率 都道府県」14回 |
| スポーツが強い・盛んな県はどこか | 同 queries.csv で「スポーツ」を含む語の表示回数の合計は79回。「スポーツが強い県」23回、「スポーツが盛んな県」17回、「スポーツが強い県ランキング」10回。クリックは0回 |

## 適用前の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 学校の配置と規模 (`schools`) | 小学校数（可住地100km²当たり）・中学校数（可住地100km²当たり）・高等学校数（可住地100km²当たり）、教員1人当たり小学校児童数 | — |
| 2 | 高等教育へどう進むか (`higher-education`) | 県内大学入学割合（同県出身入学者中） | theme-edu-higher-education-trend、theme-edu-higher-education-trend-attainment |
| 3 | 文化・社会教育の施設 (`culture`) | 図書館数（人口100万人当たり）・公民館数（人口100万人当たり）、演芸・演劇・舞踊鑑賞の行動者率（10歳以上） | — |
| 4 | 身近な学校環境や小中学校の統廃合リスクはどう推移しているか (`school-environment-and-closures`) | 公立学校廃校発生数（2004〜2023年度累計）、小学校教育費 | — |
| 5 | 地元での進学機会や大学の選択肢は十分にあるか (`higher-education-and-advancement`) | 高等学校卒業者の進学率、大学数（人口10万人当たり） | — |
| 6 | 図書館や公民館など身近な生涯学習の環境は整っているか (`lifelong-learning-and-libraries`) | 図書館蔵書数・図書館貸出冊数、商業実務・ビジネス関係の学習行動者率 | — |
| 7 | 博物館や美術鑑賞など文化・芸術に触れる機会はあるか (`cultural-facilities-and-arts`) | 登録博物館の入館者数・指定施設の入館者数・博物館類似施設の入館者数、博物館総数、美術博物館数 | education-culture-cultural-facilities-and-arts-composition-1 |
| 8 | 地域の歴史的文化財の保護や専門体制は維持されているか (`cultural-property-preservation`) | 県指定等文化財件数、県政府の文化財保護経費、埋蔵文化財専門職員数 | — |

## 実装した構成 (カタログの現在の形)

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 自分の県の小・中学校と児童生徒数は、ほかと比べて多いのか (`schools`) | 教員1人当たり小学校児童数、小学校数（可住地100km²当たり）、小学校児童数・中学校生徒数、中学校数（可住地100km²当たり）・高等学校数（可住地100km²当たり） | theme-edu-higher-education-trend-attainment |
| 2 | 小中学校の教員や大学教授の年収は、どのくらいなのか (`teacher-and-professor-pay`) | 小中学校教員の平均年収、大学教授の平均年収 | — |
| 3 | 図書館や公民館など身近に学べる場所は整っているか (`lifelong-learning-and-libraries`) | 図書館数（人口100万人当たり）、図書館蔵書数・図書館貸出冊数、公民館数（人口100万人当たり）、商業実務・ビジネス関係の学習行動者率 | — |
| 4 | 地元で進学できる大学や進学の機会は十分にあるか (`higher-education-and-advancement`) | 県内大学入学割合（同県出身入学者中）、高等学校卒業者の進学率、大学数（人口10万人当たり） | theme-edu-higher-education-trend |
| 5 | 学校の統廃合や児童1人当たりの教育費はどうなっているか (`school-environment-and-closures`) | 小学校教育費、公立学校廃校発生数（2004〜2023年度累計） | — |
| 6 | 博物館や演劇鑑賞など文化・芸術に触れる機会はあるか (`cultural-facilities-and-arts`) | 演芸・演劇・舞踊鑑賞の行動者率（10歳以上）、博物館総数、登録博物館の入館者数、指定施設の入館者数、博物館類似施設の入館者数 | education-culture-cultural-facilities-and-arts-composition-1 |
| 7 | 地域の文化財を守る体制は維持されているか (`cultural-property-preservation`) | 県指定等文化財件数、県政府の文化財保護経費、埋蔵文化財専門職員数 | — |

見せ方 (推移・数値・構成比) は `apply-design.ts` がデータの形 (年の数・単位) に合わせて決め直した。

## 足した指標 (登録済みの指標をカタログに載せた。role は secondary)

| 指標 | rankingKey | 年 | 答える問い |
|---|---|---|---|
| 小学校児童数 | `elementary-school-children-count` | 1975〜2024 | 「小学校 児童数 ランキング」「福岡市 小学校 児童数ランキング」など児童数の検索 (2026-W45 queries.csv で児童数・生徒数系の表示1220回) に答え、いまのカタログに無い児童数そのものを載せる。 |
| 中学校生徒数 | `junior-high-school-students-count` | 1975〜2024 | 児童数と対にして「中学校の生徒数は多いのか・減っているのか」(生徒数の検索) に答え、小中の人数の推移を同じ章の折れ線で見せる。 |
| 小中学校教員の平均年収 | `school-teacher-annual-income` | 2020〜2023 | 「教員 年収ランキング」など教員・教授・教諭の年収の検索 (表示1588回) に答える。 |
| 大学教授の平均年収 | `university-professor-annual-income` | 2020〜2023 | 「私立大学教授 年収ランキング」(表示93回) など大学教授の年収の検索に答える。 |

## 不採用・保留の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 小学校長期欠席児童比率（児童千人当たり、30日以上の全体） | elementary-school-long-absence-ratio-over-30days-per-1000 | 0000010205 | 登録済 | data/metrics に定義があり isActive: true、単位は児童千対で割合の指標。いまのカタログには『不登校による30日以上欠席』版だけが載っていて、理由を問わない欠席全体の版は載っていない。不登校系の検索に答えるが、需要は表示33回と小さい |
| スポーツの年間行動者率（10歳以上） | sports-annual-participation-rate-10plus | 0000010207 | 登録済 | data/metrics に定義があり isActive: true。年は1996〜2021（6年）、単位は％、47都道府県。「スポーツが強い県・盛んな県」系の検索に答える（表示79回、強さそのものは測らず、行動者率で盛んさを測る）。読書の行動者率（hobby-participation-rate-reading、2021年のみ・％）も同じ形で、読書率の検索（表示14回）に答える |

## 確かめたこと・確かめていないこと (agent の申告)

- 確認済み: 追加した4指標 (elementary-school-children-count / junior-high-school-students-count / school-teacher-annual-income / university-professor-annual-income) は data/metrics/<key>.ts に定義があり isActive: true。年は児童数・生徒数が1975〜2024、年収2指標が2020〜2023 (定義ファイルの years)。sourceUrl は各定義の source.url をそのまま写した
- 確認済み: いまのカタログの指標 (context 以外) 29件は、7章のブロックのどれか1つに入り、同じ rankingKey を2つのブロックに入れていない。drop は空 (primary は全て章に残る)
- 確認済み: 先頭の章の先頭2ブロックは stat で、教員1人当たり小学校児童数と小学校数 (可住地100km²当たり) の最新年はどちらも2024年。2015年以前が最新の指標は先頭の章に置いていない (博物館総数は2015年だが文化の章)
- 確認済み: trend は2指標の2ブロックのみ。児童数と生徒数は単位が人で50年分、中学校数と高等学校数 (可住地100km²当たり) は単位が校で50年分、図書館蔵書数 (2005〜2021年、6年) と貸出冊数 (2007〜2020年、5年) は冊で2年以上。単年の指標は trend に入れていない。1指標のみの年数が長い指標 (教育費、進学率) は、apply-design.ts の規則で1指標の trend が stat になるため stat と書いた
- 確認済み: 博物館の入館者数3指標は composition にしていない。登録博物館の定義 (provenance.verification) には「登録+指定=博物館総数」と書かれているが、博物館類似施設を含めた3つの合計が全体になるとは定義から読み取れなかったため stat にした
- 確認済み: 総量の指標しかない章は文化財の章 (件数・経費・専門職員数、いずれも総量)。data/metrics で文化財に関わる定義 (prefecture-designated-cultural-property-count、prefectural-cultural-property-protection-expenditure、buried-cultural-property-specialist-count) に人口あたり・割合の版は見つからなかったため、総量のまま載せた。博物館入館者数 (総量) の章は演劇鑑賞行動者率 (割合) と同じ章に置いた
- 確認済み: school-teacher-annual-income の定義 (note) に、公立学校の教員だけの統計ではなく標本が小さく県別の順位は公立学校教員の給与水準を表さない、という注意がある。章では推移でなく stat にして、推移から傾向を読ませないようにした。注意が画面に出る経路は未確認
- 確認済み: sports-annual-participation-rate-10plus は sports-participation の primary、school-teacher と university-professor は occupation-salary の secondary、hobby-participation-rate-reading は cultural-participation の context (他カタログの JSON で確認)。スポーツは主指標なので足さず、教員・教授の年収は secondary の重複であることを承知のうえで足した
- 未確認: data/themes/viewpoints/selection.json の rules は読んだが、薄い選定根拠 (selection) や、追加した4指標に定義文 (description) があるかの検査 (theme-metric-description-regression) の結果は確かめていない。elementary-school-children-count と junior-high-school-students-count の定義ファイルには description が無かった
- 未確認: 追加した指標の R2 の実データ (県別の値が47県そろっているか)、/themes/education-culture と /areas/<県>/education-culture の実表示、e-Stat の統計表そのものの実在照合 (statsDataId と cdCat01 は定義ファイルから読んだ値)
- 未確認: 旧「higher-education」章に付いていた chartKeys (theme-edu-higher-education-trend など) と、cultural-facilities-and-arts の composition 図 (登録・指定・類似の3指標) を、apply-design.ts が新しい章へどう移すか。composition 図は構成比にならない可能性があり、実行時に外れるかは確かめていない
- 未確認: 不登校 (表示33回) は context の「不登校による欠席」版だけが載っていて、長期欠席全体の版 (elementary-school-long-absence-ratio-over-30days-per-1000) は足していない。需要が小さく、どちらが検索語に合うかも確かめていない
- 調査の未確認: data/themes/viewpoints/selection.json は件数を数えただけで、中身は読んでいない
- 調査の未確認: e-Stat の統計表そのものは WebFetch で確認していない。statsDataId と cdCat01 は data/metrics の定義から読んだ値で、e-Stat での実在照合はしていない
- 調査の未確認: school-teacher-annual-income と university-professor-annual-income の cdCat01 は、grep で拾えた欄に出てこなかったため空にしている
- 調査の未確認: 「児童数」系の検索の都道府県別の内訳は集計していない。県名つきの語が多いことだけ確認した
- 調査の未確認: /areas/<県>/education-culture ページの実表示は見ていない。検索語の記録はサイト全体の28日分で、テーマ専用ではない
- 調査の未確認: 起票候補: 不登校の需要は小さいが、カタログに載る『不登校による欠席』と『30日以上の長期欠席』のどちらが検索語に合うかは未確認

## 採用決定

2026-11-14 オーナーの指示 (提案は基本的に承認する。出し直しが要る案は設計し直して自動で承認とする) により採用。
実装: `apply-design.ts --approved education-culture` でカタログへ適用し、`validate:catalog` は error 0・warning の増減なし。
公開日に実験を `metricScope: all-routes` で登録する。
