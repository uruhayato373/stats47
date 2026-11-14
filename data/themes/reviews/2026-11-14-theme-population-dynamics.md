---
type: theme-catalog-review
date: 2026-11-14
status: proposal-ready
theme: population-dynamics
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 人口動態 (population-dynamics)

## 結論

**いまは実装しない。** このテーマには測定中の実験 (`THEME-STRUCTURE-20261007-population-dynamics` (d56 = 2026-12-02)、`THEME-COPY-20261112-population-dynamics` (d56 = 2027-01-07)) があり、章や指標を変えると測定に混ざる。実験の判定が出た後 (2027-01-07 以降) に、その結果を踏まえてこの案を見直してから実装する。

機械で一括に組み直す方法 (`apply-design.ts --approved`) は、このテーマには使わない。同じ日に実験のある 5 テーマへ試したところ、人が作り込んだ図・埋め込みの節・章の構成を固定するテストが落ちた (カタログの検査 1 件・テスト 6 件。変更は取り消した)。実装するときは、提案の採否を 1 項目ずつ決めて手で直す (`theme-proposal-format.md` の手順)。

設計の agent の案: いまの構成は章の中身がおおむね読者の問いに合っているので、章の key と中身は残して、検索需要の順 (増減 → 出生・死亡 → 出生率・婚姻 → 外国人 → 移動 → 若者 → 2050年) に並べ替えた。変更の中心は三つで、(1) 先頭に 2025年国勢調査の5年間の人口増減率を足して最新年を2025年にそろえ、(2) 外国人の章に人口10万人あたりの割合 (2020年) を足して総量だけの章をなくし、(3) 自然増減の章を粗出生率・粗死亡率の割合から始めて出生数・死亡数は同じ章で並べた。ブロックのない「読み方と関連する人口構造」の章 (説明文だけ) は章から外し、出生率の章には婚姻率・離婚率を足した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 外国人が少ない県・多い県はどこか(人口あたりで比べたい) |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 2676・クリック 59・クリック率 2.2%・平均順位 8.99 (`data/themes/portfolio.json#population-dynamics/metricsAllRoutes28d`) |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 外国人が少ない県・多い県はどこか(人口あたりで比べたい) | GSC 2026-W45 queries.csv: 「外国人」736回(クリック19)、「外国人が少ない県」157回、「外国人が少ない 県 ランキング」67回、「外国人 少ない県」48回、「外国人少ない県」35回など。現カタログは外国人の転入者数・転出者数のみで人口あたりが無い |
| 出生率・死亡率・自然増減率の都道府県ランキングと意味は何か | 「粗出生率」89回、「自然増減率」56回、「合計特殊出生率 2023」47回、「自然増減率とは」45回、「合計特殊出生率 ランキング」43回、「自然増減」27回。カタログには crude-birth-rate・natural-increase-rate・total-fertility-rate が既にあり、需要と照応 |
| 高齢化・少子高齢化はどの県が進んでいるか | 「少子高齢化ランキング」40回、「少子高齢化 ランキング」31回、「鳥取県 高齢化率」33回、「少子高齢化 ランキング 日本」21回(順位は10前後でクリックほぼ0)。高齢化率(ratio-65-plus)は載っているが少子と高齢を並べる指標(老年化指数)が無い |
| 2050年に人口はどの県でどれだけ減るか、過疎地域はどこか | 「2050年 人口 都 道府県」35回、「2050年 都 道府県 人口ランキング」29回、「過疎地域 マップ」40回、「過疎地域マップ」21回。将来推計は future-population と 2050 増減率で既に載っている |
| 婚姻率・離婚率は県でどう違うか | 「婚姻率」70回、「沖縄 離婚率」85回、「離婚率」53回、「離婚率 都道府県 ランキング」30回、「離婚率 都道府県」27回。カタログに婚姻・離婚の指標が無い |

最初の章についての調査の所見: 最初の章は現状どおり「人口は増えているか」(総人口・増減率)で良いが、検索語の最大塊は「○○市 人口」型の市町村人口(1件あたり1〜2回で散発)と外国人・出生率・自然増減率なので、二番手に自然増減(出生率・死亡率・自然増減率)を置き、外国人の章に人口あたりの指標を足すと需要と並ぶ。

## 現行の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 人口は増えているか (`population-change`) | 人口増減率、総人口 | — |
| 2 | 出生と死亡・転入と転出の内訳 (`natural-social-change`) | 自然増減率 | birth-death-count-trend、theme-pop-migration-trend |
| 3 | どこからどこへ移動するか (`migration`) | — | — |
| 4 | 人口減少や将来の人口規模はどのように推移しているか (`population-trend-and-future`) | 2020～2050年の人口増減率（推計）、将来推計人口 | — |
| 5 | 少子化の進行や出産年齢・出生数の状況はどうなっているか (`birth-rate-and-maternity`) | 合計特殊出生率・出生数、母が25歳未満の出生数・母が25〜29歳の出生数・母が30〜34歳の出生数・母が35〜39歳の出生数・母が40歳以上の出生数、第1子の出生数・第2子の出生数・第3子以降の出生数 | population-dynamics-birth-rate-and-maternity-composition-2、population-dynamics-birth-rate-and-maternity-composition-3 |
| 6 | 若者の進学や就職に伴う地域外への流出はどれくらいあるか (`youth-migration-and-education`) | 高等学校卒業者の進学率・高校卒業就職者のうち県外就職者の割合、15〜24歳の県間転入超過数、25〜34歳の県間転入超過数 | — |
| 7 | 地域への定住状況や外国人住民の流出入はどのような傾向か (`residence-and-foreign-population`) | 外国人転入者数・外国人転出者数、5年前と同じ住所に住む5歳以上人口、5年前は他県に住んでいた5歳以上人口 | — |
| 8 | 読み方と関連する人口構造 (`reading`) | — | md-population-dynamics-discussion、md-population-dynamics-faq |

## 提案する章とカード (未実装)

| 順 | 章 (key) | 見出し | 答える悩み | カード (見せ方) |
|---|---|---|---|---|
| 1 | `population-change` | 人口は増えているか | 自分の県の人口が増えているのか減っているのか、直近の増減の勢いと長い目での規模を知りたい。 | 人口増減率 (数値)、5年間の人口増減率(国勢調査) (数値)、総人口 (推移) |
| 2 | `natural-social-change` | 出生と死亡で人口はどれだけ増減しているか | 生まれる人より亡くなる人が多いのか、出生率・死亡率・自然増減率がどれくらいか知りたい。 | 自然増減率 (数値)、粗出生率・死亡率 (推移)、出生数・死亡数 (推移) |
| 3 | `birth-rate-and-maternity` | 少子化はどこまで進んでいるか、結婚と出産の状況は | 子どもが生まれる環境や少子化の現状、婚姻・離婚や出産年齢がどうなっているか知りたい。 | 合計特殊出生率 (数値)、婚姻率(人口千対)・離婚率(人口千対) (推移)、母が25歳未満の出生数・母が25〜29歳の出生数・母が30〜34歳の出生数・母が35〜39歳の出生数・母が40歳以上の出生数 (構成比)、第1子の出生数・第2子の出生数・第3子以降の出生数 (構成比) |
| 4 | `residence-and-foreign-population` | 外国人は人口あたりでどれくらいいるか、住み続ける人は多いか | 外国人住民の多さや流出入、5年前から同じ住所に住み続ける人の多さを知りたい。 | 外国人人口(人口10万人当たり) (数値)、外国人転入者数・外国人転出者数 (推移)、5年前と同じ住所に住む5歳以上人口 (数値)、5年前は他県に住んでいた5歳以上人口 (数値) |
| 5 | `migration` | 転入と転出で人は入ってきているか、出ていっているか | 他の地域との人の出入りで人口が増えているのか減っているのか、若い世代の動きも含めて知りたい。 | 転入超過率 (数値)、15〜24歳の県間転入超過数・25〜34歳の県間転入超過数 (推移) |
| 6 | `youth-migration-and-education` | 高校を出た若者は進学・就職で県外へ出ているか | 地域で育った若い世代が進学や就職のタイミングで県外へ流出していないか気になる。 | 高等学校卒業者の進学率・高校卒業就職者のうち県外就職者の割合 (推移) |
| 7 | `population-trend-and-future` | 2050年に人口はどれだけ減るか | 自分の住む地域で人口減少が進み、将来の人口規模がどうなるか心配だ。 | 2020～2050年の人口増減率（推計） (数値)、将来推計人口 (数値) |

## 足す案の指標 (登録済み・未実装)

| 指標 | rankingKey | 年 | 答える問い | 機械の検査 |
|---|---|---|---|---|
| 5年間の人口増減率(国勢調査) | `census-population-change-rate-5y` | 2025〜2025 | 「人口は増えているか」に、2025年国勢調査の確定値で5年間の増減率を答えられる(年次推計の人口増減率とは期間と出典が違う)。 | 通過 |
| 婚姻率(人口千対) | `marriages-per-total-population` | 1975〜2022 | 「婚姻率」(GSC 70回)に答え、出生の前段として少子化の章の見方を広げる。 | 通過 |
| 離婚率(人口千対) | `divorces-per-total-population` | 1975〜2022 | 「沖縄 離婚率」「離婚率 都道府県 ランキング」(合計約190回)に、婚姻率と並べて答える。 | 通過 |
| 外国人人口(人口10万人当たり) | `foreign-resident-count-per-100k` | 1980〜2020 | 「外国人が少ない県・多い県」「外国人が少ない県」の検索(GSC 2026-W45 で計約1,000回超)に、人口あたりの割合で答えられる。 | 不可: 「foreign-residents」テーマの主指標 |

## 調査のその他の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 外国人人口(人口10万人当たり) | foreign-population-per-100k | 0000020301 | 登録済 | isActive:true を data/metrics で確認。「外国人が少ない県」系の検索計約1,000回超(外国人736、少ない県157等)に対し、現カタログは転入出の実数のみで割合が無く、population-dynamics.json に未掲載(grepで0件) |
| 老年化指数(15歳未満100人当たり) | aging-index | 0000010201 | 登録済 | isActive:true を確認。少子高齢化ランキング系(40+31回)に対し、年少人口割合と高齢化率を一つに束ねる比率指標。カタログ未掲載 |

## 確かめたこと・確かめていないこと (agent の申告)

- 確認済み: population-dynamics.json の metrics 37 件・charts 6 件・sections 8 章と、inventory.json の metricInfo の年数・範囲を読んだ。最初の章の指標の最新年は population-growth-rate 2024、census-population-change-rate-5y 2025、total-population 2025 でいずれも2020年以降。先頭 2 ブロックは stat で割合 (‰・％) の指標。
- 確認済み: addMetrics の4件は data/metrics/<key>.ts で isActive: true を読んだ。census-population-change-rate-5y は prefecture 対応・years 2025 のみ。foreign-resident-count-per-100k は entities に prefecture と city、years は 1980〜2020 の9年 (2020が最終)。marriages-per-total-population と divorces-per-total-population は prefecture・1975〜2022。sourceUrl は各定義ファイルの source.url をそのまま写した。
- 確認済み: 調査の前段が挙げた foreign-population-per-100k は entities が city のみで都道府県のページに出せないため採らず、同じ社会・人口統計体系の #A01601 で都道府県も持つ foreign-resident-count-per-100k に置き換えた。
- 確認済み: composition の2組は births-mother-* と births-first/second/third-child-plus の定義ファイルの note に、年齢5区分・出生順位は重複しない内訳と書かれていることを読んだ。ただし母の年齢不詳12人は5区分に含まれず合計は出生数と一致しない。
- 確認済み: trend の各ブロックは2年以上ある指標だけ (粗出生率・粗死亡率・births・death-count・婚姻率・離婚率・転入出者数・県間転入超過数・高校の2指標)。1ブロック2指標・単位は同じ。いまのカタログの非 context 指標は全部どれかのブロックに入れ、同じ rankingKey は1回だけ。drop は無し。
- 確認済み: 章は8章から7章に減らし、全章に2指標以上のブロックがある。stat だけの章 (将来) は割合と人数を並べた。
- 確認済み: foreign-resident-count-per-100k は foreign-residents テーマで primary、marriages-per-total-population は aging-society で secondary、divorces-per-total-population は aging-society で context と catalogs 全体を走査して確認した。owned-elsewhere (review) の対象になるが、外国人の「割合」が population-dynamics に無く検索需要も大きいため足した。reviewer の判断を要する。
- 未確認: 「読み方と関連する人口構造」の章に付いている markdown-section 2 本 (md-population-dynamics-discussion / faq) は設計の blocks に載せられず、章ごと外すと適用側で消えるのか別扱いで残るのかを確かめていない。applier が残す前提で外した。
- 未確認: 章の並べ替え後に embeddedSectionKeys (migration-flow / young-migration-link / migration-demographics / five-year-residence) が章 key に付いたまま描かれるか。key は全て元のまま使った。
- 未確認: GSC の検索回数は調査の前段の記述をそのまま使い、queries.csv そのものは読み直していない。census-population-change-rate-5y と population-growth-rate が同じ年に違う値を出す理由 (出典・境域の違い) は定義の note でだけ確認し、47県の値は見ていない。
- 未確認: selection.json の規則 card-chart-duplicate (図とカードの重複) が births / death-count / movers-in / movers-out の trend ブロックと既存 charts[] の2本の折れ線 (同じ指標の組) で機械検査に引っかかるか。ここでは chart を残すか消すかを決めていない。
- 調査の未確認: selection.json は読んでいない
- 調査の未確認: inventory.json の metricInfo(年数・期間)は未確認で、候補の年数・期間は不明
- 調査の未確認: census-population-change-rate-5y の cdCat01 と既存 population-growth-rate との重複は未確認
- 調査の未確認: 市町村人口の検索(「○○市 人口」)は県ページ対象外のため候補化していない
- 調査の未確認: e-Stat 側の statsDataId の実在は data/metrics 定義の記載値のみで、API 照合はしていない
- 調査の未確認: 高齢者単独世帯割合(single-person-household-old-population-ratio)は定義のみ確認、需要語の根拠が弱く候補から外した

## 採用決定

ユーザー承認待ち。判断が要る点:

1. 実験の判定 (2027-01-07 以降) を見てから、章の順と見出しをこの案へ寄せるか。
2. 足す案の指標のうち、どれを載せるか (機械の検査を通ったものに限る)。
3. 人が作り込んだ図・埋め込みの節・テストで固定した構成のうち、変えてよいものはどれか。
