---
type: theme-catalog-review
date: 2026-11-14
status: implemented-pending-release
theme: sports-participation
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: スポーツ施設と利用 (sports-participation)

## 結論

変更は小さい。章は 3 つのまま、いまの章 key と順序を使い、先頭の章はもともと割合 (スポーツ年間行動者率 2021 年) と 2024 年の歩数が先頭に来ていて条件を満たしている。検索需要が最大のゴルフ (行動者率 = 既存の context、ゴルフ場数 = 追加) と運動公園・民間施設の問いに答えるため、ゴルフの行動者率を先頭の章に出し、施設の章に面積あたりの運動公園数・民間体育施設数・ゴルフ場数を足した。体育館設置箇所数は総量だけだが、同じ章の先頭に人口あたりの社会体育施設数があるので残した。

THEME-PAGE-REVIEW-01 の段 4 (全 56 テーマの指標の見直し)。調査 (theme-researcher) と設計 (theme-designer) の結果を機械で検査し (実在しない指標・重複・取りこぼし・`validate:catalog`)、通った案をカタログへ適用した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | ゴルフ場が多い都道府県はどこか。人口や面積あたりではどうか |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 474・クリック 14・クリック率 2.9%・平均順位 6.69 (`data/themes/portfolio.json#sports-participation/metricsAllRoutes28d`) |
| 進行中の実験 | なし |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| ゴルフ場が多い都道府県はどこか。人口や面積あたりではどうか | 2026-W45 queries.csv 28日: 「ゴルフ場 数 ランキング」51回、「ゴルフ場数ランキング 都 道府県」46回、「ゴルフ場 数 都道府県」37回、「ゴルフ場が多い都道府県」17回。クリックはいずれも0 |
| スポーツが盛んな県・強い県はどこか | 「スポーツが強い県」23回、「スポーツが盛んな県」17回、「スポーツが強い県ランキング」10回、「運動能力 都 道府県 ランキング」7回、「都道府県別 運動時間」9回(掲載順位1.78)、「全国体力・運動能力、運動習慣等調査」4回 |
| 体育・スポーツ施設は都道府県でどれだけ整備されているか | 「体育・スポーツ施設現況調査」20回(平均順位5.90)。カタログは社会体育施設・体育館・プール等を既に載せている |
| 一人当たりの公園面積・公園数はどの県が多いか(運動公園との関係) | 「都市公園等整備現況調査」23回、「一人当たりの公園面積」12回、「全国 公園の数ランキング」10回、「公園が多い都道府県ランキング」5回、「都道府県別一人当たり都市公園等整備現況」5回 |

## 適用前の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 住民の運動習慣や日常の歩数は十分か (`resident-exercise-habits`) | スポーツ年間行動者率（10歳以上）、男性の歩数（20〜64歳・年齢調整）、女性の歩数（20〜64歳・年齢調整） | — |
| 2 | 地域内で利用できるスポーツ施設は充実しているか (`sports-facilities-environment`) | 社会体育施設数（人口100万人当たり）、運動公園数、小学校体育館設置箇所数、中学校体育館設置箇所数 | — |
| 3 | 子どもの運動時間と体力水準は保たれているか (`children-fitness-and-exercise`) | 小学5年男子の週420分以上運動割合、小学5年女子の週420分以上運動割合、小学5年男子の体力合計点、小学5年女子の体力合計点 | — |

## 実装した構成 (カタログの現在の形)

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 運動やスポーツをしている人は多いか。ゴルフなど種目別や歩数はどうか (`resident-exercise-habits`) | スポーツ年間行動者率（10歳以上）、男性の歩数（20〜64歳・年齢調整）、女性の歩数（20〜64歳・年齢調整） | — |
| 2 | 地域内で利用できるスポーツ施設は充実しているか。ゴルフ場や運動公園はどうか (`sports-facilities-environment`) | 社会体育施設数（人口100万人当たり）、運動公園数（可住地面積100km²当たり）、ゴルフ場数（公共）・民間体育施設数、小学校体育館設置箇所数、中学校体育館設置箇所数 | — |
| 3 | 子どもの運動時間と体力水準は保たれているか (`children-fitness-and-exercise`) | 小学5年男子の週420分以上運動割合、小学5年女子の週420分以上運動割合、小学5年男子の体力合計点、小学5年女子の体力合計点 | — |

見せ方 (推移・数値・構成比) は `apply-design.ts` がデータの形 (年の数・単位) に合わせて決め直した。

## 足した指標 (登録済みの指標をカタログに載せた。role は secondary)

| 指標 | rankingKey | 年 | 答える問い |
|---|---|---|---|
| ゴルフ場数（公共） | `golf-course-public` | 1996〜2021 | 「ゴルフ場 数 ランキング」「ゴルフ場が多い都道府県」(2026-W45 の 28 日で合計約 150 回表示) に答える施設の指標で、ランキング側で人口 10 万人あたり・面積 100km2 あたりに切り替えられる。 |
| 民間体育施設数 | `private-sports-facility` | 1996〜2021 | 「体育・スポーツ施設は都道府県でどれだけ整備されているか」(「体育・スポーツ施設現況調査」20 回) に対し、いまの公共施設中心の章に欠けている民間 (ジムなど) の供給を足す。 |
| 運動公園数（可住地面積100km²当たり） | `sports-park-count-per-100km2` | 1975〜2023 | 運動公園数の実数 (context) は総量だけなので、面積あたりの登録済み指標を足して「公園が多い都道府県」「運動できる場所は身近にあるか」の問いに県の比較で答える。 |

## 不採用・保留の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 都市公園面積(1人当たり) | urban-park-area-per-person | 0000010208 | 登録済 | isActive true、1975年から。「一人当たりの公園面積」12回ほか公園系の検索が複数。運動公園の実数を人口あたりの文脈で補う |
| 公立小学校屋内運動場設置率 | public-elementary-school-gym-installation-rate | 0000010205 | 登録済 | isActive true、単位は%。カタログの小・中体育館設置箇所数は総量のみなので割合の指標に差し替える候補 |

## 確かめたこと・確かめていないこと (agent の申告)

- 確認: sports-participation-rate-golf・sports-annual-participation-rate-10plus は inventory の metricInfo で最新 2021 年、steps は 2024 年なので、先頭の章の先頭 2 ブロックは stat で 2020 年以降 (制約 1)
- 確認: 先頭に置いた sports-annual-participation-rate-10plus は単位が％で割合、sports-participation-rate-golf も行動者率 (制約 2)
- 確認: 追加 3 指標 (golf-course-public / private-sports-facility / sports-park-count-per-100km2) は data/metrics に実在し isActive: true。years は golf・private が 1996〜2021 の 9 年 (3 年おき)、sports-park-count-per-100km2 は from 1975 to 2023
- 確認: sourceUrl は 3 件とも定義ファイルの source.url (https://www.stat.go.jp/data/ssds/index.htm) をそのまま写した
- 確認: 現カタログの context 以外の指標 (participation・社会体育施設数・歩数 男女・小中体育館・体力合計点・運動割合 男女) はすべてブロックに入れ、同じ rankingKey は 1 回しか使っていない。trend は 2 指標・同じ単位 (施設) で 2 年以上ある
- 確認: composition は使っていない (構成比になると確かめた組が無い)
- 確認: 公立小学校屋内運動場設置率 (public-elementary-school-gym-installation-rate) は年が 1975〜2006 で古く、先頭ではなくても割合の差し替え候補として採らなかった
- 確認: 都市公園面積 (urban-park-area-per-person) は category が landweather で運動に直結せず、スポーツのテーマには入れていない (需要は公園の検索だが運動公園は面積あたりの指標で足りる)
- 確認: 他テーマのカタログ (data/themes/catalogs/*.json) に追加 3 指標は載っておらず、owned-elsewhere に当たらない
- 総量のままの指標: golf-course-public・private-sports-facility・小中体育館設置箇所数は定義上は総量 (ランキング側で人口あたり・面積あたりに切り替えられる option は golf・private にある)。登録済みの人口あたりの指標は見つからなかったので、施設の章は人口あたりの社会体育施設数と面積あたりの運動公園数を先頭に置いて総量と並べた
- 未確認: golf-course-public の「公共」が民間ゴルフ場を含むか。見出しに「ゴルフ場が多い」とは書かず、指標名どおり「ゴルフ場数（公共）」としている
- 未確認: sports-participation-rate-golf は context なので、ブロックに入れたときカード表示される扱いか (apply-design.ts の処理は読んでいない)。されない場合は先頭 2 ブロックを participation と steps の sex にする代替が必要
- 未確認: sports-park-count-per-100km2 の分母が可住地面積 100km2 当たりであること以上の定義 (e-Stat API 照合はしていない。定義ファイルの subtitle のみ)
- 未確認: data/themes/viewpoints/selection.json の rules は先頭 2500 字までしか読んでおらず、card-answers-one-question 以降は未読
- 未確認: 「スポーツが強い県」の検索 (競技成績の問い) は既存の体力・部活動指標で答えられるか。今回は答えを設計に入れていない
- 未確認: 先頭の章に置く steps の sex は 1 年だけの指標で、sex view が単年を許容するかは theme-catalog-standards §3.0 の記述からの判断で、実装は読んでいない
- 調査の未確認: カタログ全体(rankingKey一覧は確認、33件)のうち末尾の一部のselectionは出力が途中で切れて読み切っていない
- 調査の未確認: inventory.jsonのmetricInfo(年数・期間)は確認していない。候補の年次はdata/metricsのyearsのみ
- 調査の未確認: 候補のe-Stat実在はdata/metricsの定義(statsDataId・cdCat01)を読んだだけで、API照合はしていない
- 調査の未確認: GSCはW45の1週分のみ。クリックは全件0で、需要は表示回数のみで判断した
- 調査の未確認: selection.jsonの視点は読んでいない
- 調査の未確認: 「スポーツが強い県」は競技成績の問いで、既存指標(体力・部活動)で答えられるかは未検証
- 調査の未確認: 公共ゴルフ場数が民間を含むかは未確認

## 採用決定

2026-11-14 オーナーの指示 (提案は基本的に承認する。出し直しが要る案は設計し直して自動で承認とする) により採用。
実装: `apply-design.ts --approved sports-participation` でカタログへ適用し、`validate:catalog` は error 0・warning の増減なし。
公開日に実験を `metricScope: all-routes` で登録する。
