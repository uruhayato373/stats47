---
type: theme-catalog-review
date: 2026-11-14
status: implemented-pending-release
theme: community-participation
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 市民参加と地域活動 (community-participation)

## 結論

検索需要は図書館 (蔵書数・貸出冊数) と投票率に集中している一方、選挙の最新年は2019年で先頭章の条件 (2020年以降) を満たさないため、最新年が2021年の図書館章を先頭に置き、先頭は人口100万人当たりの図書館数と蔵書数の2つの stat にした。選挙章は知事選に市区町村長選・県議選を足して厚くし、ボランティア章は需要が弱いので最後に回した (章は3つのまま、増やしていない)。登録済み5指標を足し、既存4指標はすべてどれかのブロックに入れた。

THEME-PAGE-REVIEW-01 の段 4 (全 56 テーマの指標の見直し)。調査 (theme-researcher) と設計 (theme-designer) の結果を機械で検査し (実在しない指標・重複・取りこぼし・`validate:catalog`)、通った案をカタログへ適用した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 知事選・市長選の投票率は県ごとにどれくらい違い、どこが高い・低いのか |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 224・クリック 14・クリック率 6.2%・平均順位 6.47 (`data/themes/portfolio.json#community-participation/metricsAllRoutes28d`) |
| 進行中の実験 | なし |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 知事選・市長選の投票率は県ごとにどれくらい違い、どこが高い・低いのか | 2026-W45 queries.csv: 「島根 知事 選挙 過去の投票率」表示13回・クリック6、「知事選 投票率 ランキング」11回、「市長選挙 投票率 ランキング」7回、「県知事選 投票率 全国」3回、「知事選 投票率」5回 |
| 図書館の蔵書数・貸出冊数は県別でどう並ぶか(総量でなく利用の厚み) | queries.csv: 「図書館 蔵書数 ランキング」85回、「図書館 蔵書数」61回、「図書館 貸出冊数 ランキング」28回、「図書館 貸出 ランキング 全国」25回、「図書館 蔵書数ランキング」13回、「図書館 ランキング 蔵書数」12回 |
| 自治会・町内会の加入率は県別でどうか | queries.csv: 「自治会加入率 都 道府県 別」表示4回・クリック1。ただし該当の登録指標は data/metrics の grep では見つからず(未確認) |
| ボランティア活動をしている人の割合は地域でどう違うか | queries.csv: 「ボランティア」4回、「ボランティア活動 一覧」1回など。表示数は少なく需要は弱い |

## 適用前の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 地域でのボランティアや社会貢献活動は活発に行われているか (`volunteer-and-community-activities`) | ボランティア年間行動者率（10歳以上）、まちづくり活動の年間行動者率（10歳以上） | — |
| 2 | 地域の政治や自治に対する住民の関心は高いか (`civic-engagement-and-elections`) | 都道府県知事選挙投票率 | — |
| 3 | 身近な生涯学習や文化施設の利用は進んでいるか (`library-and-cultural-participation`) | 図書館登録者数 | — |

## 実装した構成 (カタログの現在の形)

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 身近な図書館は、県によってどれだけそろい、使われているか (`library-and-cultural-participation`) | 図書館蔵書数、図書館館外貸出冊数・図書館登録者数 | — |
| 2 | 知事選・市長選の投票率は、県によってどれだけ違うか (`civic-engagement-and-elections`) | 都道府県知事選挙投票率、市区町村長選挙投票率・都道府県議会議員選挙投票率 | — |
| 3 | ボランティアやまちづくりに参加する人は、県によってどれだけ違うか (`volunteer-and-community-activities`) | ボランティア年間行動者率（10歳以上）、まちづくり活動の年間行動者率（10歳以上） | — |

見せ方 (推移・数値・構成比) は `apply-design.ts` がデータの形 (年の数・単位) に合わせて決め直した。

## 足した指標 (登録済みの指標をカタログに載せた。role は secondary)

| 指標 | rankingKey | 年 | 答える問い |
|---|---|---|---|
| 図書館数（人口100万人当たり） | `library-count-per-million` | 1975〜2021 | 「図書館 蔵書数 ランキング」など図書館の検索語に対し、人口の多さで偏らない人口あたりの図書館数で県を比べられる。 |
| 図書館蔵書数 | `library-books` | 2005〜2021 | 「図書館 蔵書数 ランキング」(週85回表示) の中心の問いに直接答える。 |
| 図書館館外貸出冊数 | `library-lending-books` | 2007〜2020 | 「図書館 貸出冊数 ランキング」に答え、蔵書がどれだけ使われているかを登録者数と並べて見せる。 |
| 市区町村長選挙投票率 | `voter-turnout-mayor` | 2007〜2019 | 「市長選挙 投票率 ランキング」に答え、知事選との関心の差を比べられる。 |
| 都道府県議会議員選挙投票率 | `voter-turnout-pref-assembly` | 2007〜2019 | 「知事選 投票率 ランキング」を見る人が、県議選の投票率も知事選と並べて比べられる。 |

## 不採用・保留の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| (なし) | | | | |

## 確かめたこと・確かめていないこと (agent の申告)

- data/themes/catalogs/community-participation.json を読み、metrics 4件 (primary 1・secondary 3)、章 3つ、charts 空を確認した
- addMetrics 5件 (library-count-per-million, library-books, library-lending-books, voter-turnout-mayor, voter-turnout-pref-assembly) は data/metrics/<key>.ts が実在し isActive: true であることを grep で確認した
- 出典 URL は5件とも定義ファイルの source.url (https://www.stat.go.jp/data/ssds/index.htm) をそのまま写した
- years は定義ファイルで確認した。library-count-per-million 1975〜2021、library-books 2005〜2021、library-lending-books 2007〜2020、voter-turnout-mayor と voter-turnout-pref-assembly 2007〜2019
- 既存指標の最新年は inventory と定義で確認した。voter-turnout-governor 2007〜2019、library-registered-users 2007〜2020、volunteer 10歳以上 2001〜2021 (5年分)、community-building 2021 のみ (1年なので trend にせず stat)
- 制約1: 先頭章の先頭 stat は library-count-per-million (2021) と library-books (2021) で、どちらも2020年以降
- 制約2: 先頭章の stat の先頭は人口100万人当たりの図書館数 (人口あたり)。library-books・library-lending-books・library-registered-users は総量で、登録済みの人口あたり版は無いため総量のまま載せ、同じ章に人口あたりの指標を並べた。総量の指標には e-Stat 側に per_population 換算オプションがあるが、これはカタログの指標として別登録ではない
- 制約3: composition は使っていない。足すと全体になる組は確かめていない
- 制約4: 既存4指標は各1ブロックで重複なし。trend は3ブロック全て2指標・2年以上・単位2種以内 (冊と人、％のみ)
- 制約5: 章は3つのまま、各章に2〜3ブロック、各章に指標が2個以上
- drop は空。primary のボランティア指標を含め、既存4指標は外していない
- 未確認: 自治会加入率の登録済み指標は存在を確かめていない (grep では見つからず、検索語の需要も表示4回と弱い)
- 未確認: 市区町村長選・県議選・図書館の指標の検索需要は前段の queries.csv の集計をそのまま用いた。2026-W45 の1週分で、テーマ別には絞っていない
- 未確認: ボランティア15歳以上版 (volunteer-activity-annual-participation-rate-15plus) と10歳以上版の重複は判断していない。今回は足していない
- 未確認: selection.json の規則 (owned-elsewhere など) を機械検査にかけていない。議員・首長選の投票率が administrativefinancial カテゴリの指標で、他テーマの primary でないかは確認していない
- 未確認: library-count-per-million の entities に city が含まれる点が、都道府県の比較表示にどう影響するかは見ていない
- 調査の未確認: data/themes/viewpoints/selection.json は読んでいない
- 調査の未確認: 自治会加入率の登録済み指標は grep で見つけられなかった。e-Stat 側も調べていない
- 調査の未確認: library-books の statsDataId と isActive は未確認
- 調査の未確認: 検索語はサイト全体の 2026-W45 の1週分だけで、テーマ別の需要を絞り込めていない
- 調査の未確認: 図書館の人口あたり蔵書数・貸出数にあたる登録済み指標は探していない
- 調査の未確認: ボランティア15歳以上版 (volunteer-activity-annual-participation-rate-15plus) は存在するが、10歳以上版との重複を判断していない

## 採用決定

2026-11-14 オーナーの指示 (提案は基本的に承認する。出し直しが要る案は設計し直して自動で承認とする) により採用。
実装: `apply-design.ts --approved community-participation` でカタログへ適用し、`validate:catalog` は error 0・warning の増減なし。
公開日に実験を `metricScope: all-routes` で登録する。
