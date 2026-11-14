---
type: theme-catalog-review
date: 2026-11-14
status: implemented-pending-release
theme: construction-industry
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 建設業 (construction-industry)

## 結論

検索語で最も多い大工などの年収を先頭に出し、次に住宅着工と公共工事、完成工事高の順に、読者の問いの順へ並べ直した。登録済みの割合・人口あたり指標が無いので総量は残したが、先頭には県で比べて意味を持つ年収(平均値)を置き、担い手の章は年齢の構成比で割合の見方を足した。元の7章は近い章を統合して4章に減らし、重複していた従業者・就業者の章は担い手の章へ集めた。

THEME-PAGE-REVIEW-01 の段 4 (全 56 テーマの指標の見直し)。調査 (theme-researcher) と設計 (theme-designer) の結果を機械で検査し (実在しない指標・重複・取りこぼし・`validate:catalog`)、通った案をカタログへ適用した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 自分の県で大工や電気工事の人の年収はいくらか。建築技術者以外の職種も見たい |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 495・クリック 32・クリック率 6.5%・平均順位 8.7 (`data/themes/portfolio.json#construction-industry/metricsAllRoutes28d`) |
| 進行中の実験 | なし |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 自分の県で大工や電気工事の人の年収はいくらか。建築技術者以外の職種も見たい | 2026-W45 queries.csv 「大工 年収」表示11回(クリック3)、「大工 給料」7、「大工 年収ランキング」2、「大工 年収 平均」0クリック16回ほか大工関連が多数。サイト全体28日 |
| 都道府県別の住宅着工数はどこが多いか、ハウスメーカー別・市町村別も知りたい | 「都 道府県 別住宅着工数ランキング」2回、「住宅着工戸数」「住宅着工件数」「住宅着工統計 市町村別」「ハウス メーカー 着工 数 ランキング」各1〜2回(W45 queries.csv) |
| 県ごとの建設業の完工高・事業規模のランキングを知りたい(県名つき) | 「岩手県建設業 完工 高ランキング」3回、「山梨県 建設業 ランキング」2回、「建設業 一人当たり売上高 平均」1回、「建設業 就業者数」1回(W45 queries.csv) |
| 建設業の労働災害は県別でどうか | 「建設業 労働災害 ランキング」3回(W45 queries.csv)。登録済みの労災指標は産業横断のもの(occupational-accident-frequency-rate)で建設業限定は未確認 |
| 土木費・建設費は県でどれだけかかるか | 「土木費」170回表示・「土木費とは」30回・「建設費ランキング 日本」16回(W45 queries.csv)。ただしクリックはほぼ0で、意図は財政用語の可能性あり |

## 適用前の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 建設業の事業規模はどこで大きいか (`construction-output`) | 元請完成工事高・下請完成工事高 | — |
| 2 | 建設業の担い手はどこに多いか (`construction-businesses`) | 許可業者数 | — |
| 3 | 建設業で働く人はどこに多いか (`construction-workers`) | 従業者数 | — |
| 4 | 公共工事や地域内の建設需要はどのように推移しているか (`construction-demand`) | 公共工事の請負契約件数（施工地別）・公共工事の請負契約額（施工地別） | — |
| 5 | 建設業を支える技術者や職人の高齢化は進んでいるか (`workforce-demographics`) | 30歳未満の建設業就業者・30〜54歳の建設業就業者・55歳以上の建設業就業者、女性の建設業就業者 | construction-industry-workforce-demographics-composition-1 |
| 6 | 地域の建設業者数や就業者規模は維持されているか (`business-base-and-workers`) | 建設業就業者総数（常住地別） | — |
| 7 | 建設技術者の給与や処遇水準は改善されているか (`architect-wages`) | 建築技術者の推計年収（2022年） | — |

## 実装した構成 (カタログの現在の形)

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 自分の県の大工・電気工事・建築技術者の年収はいくらか (`architect-wages`) | 大工の平均年収、電気工事従事者の平均年収、建築技術者の推計年収（2022年） | — |
| 2 | 住宅や公共工事の需要は県でどれだけあるか (`construction-demand`) | 着工新設住宅戸数、公共工事の請負契約件数（施工地別）・公共工事の請負契約額（施工地別） | — |
| 3 | 県の建設業者はどれだけの工事を請け負っているか (`construction-output`) | 元請完成工事高、許可業者数 | — |
| 4 | 建設業の担い手は高齢化していないか、どの県に多いか (`workforce-demographics`) | 30歳未満の建設業就業者・55歳以上の建設業就業者、女性の建設業就業者、建設業就業者総数（常住地別）、従業者数 | construction-industry-workforce-demographics-composition-1 |

見せ方 (推移・数値・構成比) は `apply-design.ts` がデータの形 (年の数・単位) に合わせて決め直した。

## 足した指標 (登録済みの指標をカタログに載せた。role は secondary)

| 指標 | rankingKey | 年 | 答える問い |
|---|---|---|---|
| 大工の平均年収 | `carpenter-annual-income` | 2020〜2023 | 「大工 年収」「大工 給料」など、サイトで表示回数が最も多い大工の年収の検索語に、県別の値で答える。 |
| 電気工事従事者の平均年収 | `electrician-annual-income` | 2020〜2023 | 建築技術者以外の建設職種の年収も見たいという問いに、大工と同じ調査・同じ単位で並べて答える。 |
| 着工新設住宅戸数 | `new-housing-starts` | 1975〜2024 | 「都道府県別 住宅着工数ランキング」などの検索語に、2024年まで50年の県別の値で答え、公共工事だけだった需要の章に民間の住宅需要を足す。 |

## 不採用・保留の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 建設業 売上金額(民営) | construction-private-sales | 0000020203 | 登録済 | 「一人当たり売上高」の検索に対し、従業者数との比で1人あたりを示せる素材。isActive: true。年数はinventory未収録で未確認 |
| 建設業 事業所数(民営) | construction-private-establishments | 0000020203 | 登録済 | 従業者数との比で1事業所あたり規模を示せ、総量だけの章を正規化できる。isActive: true。年数は未確認 |

## 確かめたこと・確かめていないこと (agent の申告)

- 確認済み: data/metrics に carpenter-annual-income / electrician-annual-income / new-housing-starts が実在し isActive: true、entities に prefecture を含む (年: 2020-2023 / 2020-2023 / 1975-2024)
- 確認済み: 先頭章の3指標 (carpenter / electrician / architect) の最新年はすべて2023年で、2020年以降。単位は万円の平均値で、県の比較に使える
- 確認済み: 他テーマでの役割は carpenter が occupation-salary の secondary、electrician と architect が同 context、new-housing-starts が living-housing の secondary。primary を抱え込んでいない
- 確認済み: construction-private-sales / construction-private-establishments は entities が city のみで都道府県ランキングに使えないため addMetrics から外した。調査結果の推奨 (1事業所あたり・1人あたり売上) は県別では作れない
- 確認済み: いまのカタログの context 以外の指標11件はすべてどれかのブロックに入り、同じ rankingKey は1つのブロックにだけ置いた。subcontractor-completed-construction と construction-employed-age30to54 は context。後者は composition に入れ、前者はどのブロックにも入れていない
- 確認済み: trend は public-construction-contract-count/amount (2014-2024・件と百万円の2種) と construction-industry-count (2000-2023) だけで、いずれも2年以上ある。年が1年の指標は trend にしていない
- 確認済み: 章は7から4に減り、すべての章に2ブロック以上ある。construction-business 系・construction-workers・business-base-and-workers の3章は統合した
- 確認済み (部分的): composition の3指標は各定義ファイルの axisSum が cat02 の 01-03 / 04-08 / 09-18 で、コードが途切れず続く。年齢不詳が別の区分にあるかは統計表のコード表を引いて確かめていない。未確認: 3指標の合計が就業者総数 (construction-employed-residents) と一致するか
- 割合・人口あたりの登録済み指標 (rankingKey) は建設関連に無かったため、完成工事高・業者数・従業者数・就業者数・住宅着工戸数・公共工事は総量のまま。総量の章 (construction-demand / construction-output) は先頭にしていない。各 metric の calculation にある per_population は別の rankingKey ではないので使っていない
- 未確認: 建設業に限った労働災害の県別指標は見つからず、occupational-accident-frequency-rate は産業横断の値なので足していない。土木費・建設費は財政の指標に近く意図も確かめられていないので足していない
- 注意: architect-annual-income の shortLabel と既存の指標群の見出しに「2022年」とあるが、定義ファイルの years は2020-2023。新しい見出しには年を入れていない。shortLabel の直しは別の作業
- 未確認: 検索回数 (2026-W45 queries.csv) と e-Stat の statsDataId は調査の結果を引いたもので、この設計では再取得していない。view の stat / ranking が画面で何を描くか (県選択時の表示など) は theme-catalog-standards.md §3 を読み直しておらず、データの形から選んだ
- 調査の未確認: 割合・人口あたりの登録済み指標(建設業就業者比率など)は data/metrics のファイル名と grep では見つからず、new-housing-starts などの10万人あたり換算に頼る形になった。ほかの比率指標が無いと確かめ切れてはいない
- 調査の未確認: construction-private-sales と construction-private-establishments は inventory の metricInfo に無く、年数・期間は未確認
- 調査の未確認: data/themes/viewpoints/selection.json は読んでいない
- 調査の未確認: 建設業の労働災害の県別指標は、建設業限定のものを見つけられなかった(産業横断の occupational-accident-frequency-rate は存在するが中身は未確認)
- 調査の未確認: 土木費は財政側の指標(ordinary-construction-expenses 系)に近く、クリックが0で意図を確かめられなかったため候補から外した
- 調査の未確認: 年収系の e-Stat statsDataId は metrics 定義の記載値で、e-Stat API での再照合はしていない

## 採用決定

2026-11-14 オーナーの指示 (提案は基本的に承認する。出し直しが要る案は設計し直して自動で承認とする) により採用。
実装: `apply-design.ts --approved construction-industry` でカタログへ適用し、`validate:catalog` は error 0・warning の増減なし。
公開日に実験を `metricScope: all-routes` で登録する。
