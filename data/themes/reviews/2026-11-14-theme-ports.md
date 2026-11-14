---
type: theme-catalog-review
date: 2026-11-14
status: implemented-pending-release
theme: ports
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 港湾 (ports)

## 結論

検索語ではコンテナ取扱量が貨物量より圧倒的に多いため、先頭の章をコンテナ個数 → 海上出入貨物量の順にし、「港の規模」を 1 章にまとめた。1 指標だけだった「船舶と旅客の利用」は入港船舶隻数 1 件になり、context の旅客船輸送人員・総トン数はカードに出ないので、章を増やさず規模の章へ統合し章を 3 から 2 に減らした。登録済みのコンテナ取扱トン数と移入・移出を足し、「輸出入だけが港の貨物」という誤読を防ぐ章を作った。

THEME-PAGE-REVIEW-01 の段 4 (全 56 テーマの指標の見直し)。調査 (theme-researcher) と設計 (theme-designer) の結果を機械で検査し (実在しない指標・重複・取りこぼし・`validate:catalog`)、通った案をカタログへ適用した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | コンテナ取扱量が多い県・港はどこか(日本のコンテナ港ランキング) |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 17・クリック 0・クリック率 0%・平均順位 None (`data/themes/portfolio.json#ports/metricsAllRoutes28d`) |
| 進行中の実験 | なし |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| コンテナ取扱量が多い県・港はどこか(日本のコンテナ港ランキング) | queries.csv(2026-W45): 「コンテナ取扱量ランキング 日本」161回(クリック2)、「コンテナ取扱量ランキング」22回、「コンテナ取扱量 日本」16回、「コンテナ港 ランキング 日本」7回、「コンテナ 取扱量 ランキング」5回。表記ゆれ込みで約210回超 |
| 港湾の取扱貨物量が多い県はどこか(貨物量ランキング・港湾統計そのもの) | 「港湾 取扱貨物量ランキング 日本」8回、「港湾統計」4回、「北海道 港 ランキング」2回、「日本の貿易港 ランキング2025」1回 |
| 港が多い県はどこか(港の数) | 「港の数 ランキング」24回(クリック1)。港湾調査の対象港数は載っているが、年は2025の1年のみ |
| 輸出入の港湾の規模はどう比べるか | 「日本 港 貿易額 ランキング」1回。表示回数は少なく、トン数ベースの輸出入貨物量が既存で載っている程度の需要 |
| (範囲外の注意)漁港・空港の検索が港の語で混ざる | 「漁港が多い県」682回、「漁港 数 ランキング」82回、「岐阜 空港」93回など。港湾テーマの問いではなく別テーマ(水産・空港)の需要で、ports に載せない |

## 適用前の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 港湾の取扱規模 (`cargo`) | 海上出入貨物量、コンテナ個数 | — |
| 2 | 輸出と輸入 (`trade`) | 輸出貨物量・輸入貨物量 | ports-cargo-trend |
| 3 | 船舶と旅客の利用 (`ships-passengers`) | 入港船舶隻数 | — |

## 実装した構成 (カタログの現在の形)

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | コンテナと貨物は、どの県の港でどれだけ扱われているか (`cargo`) | コンテナ個数、海上出入貨物量、入港船舶隻数 | — |
| 2 | 輸出入と国内の海上輸送は、それぞれどれだけか (`trade`) | 輸出貨物量・輸入貨物量 | ports-cargo-trend |

見せ方 (推移・数値・構成比) は `apply-design.ts` がデータの形 (年の数・単位) に合わせて決め直した。

足さなかった指標 (機械の検査で外した): `port-cargo-coastal-in` (出典の調査に紐付いていない)、`port-cargo-coastal-out` (出典の調査に紐付いていない)、`port-container-tonnage` (出典の調査に紐付いていない)

## 不採用・保留の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| コンテナ取扱トン数 | port-container-tonnage | 0003130745 | 登録済 | data/metricsでisActive:true、2010-2023年、単位トン。コンテナ個数(TEU)と貨物量(トン)の中間で、検索需要のあるコンテナ取扱量を別の尺度で補う。cdCat02=100(甲種)。カタログ未掲載 |
| 移入貨物トン数(国内の入り) | port-cargo-coastal-in | 0003130803 | 登録済 | isActive:true、2010-2023年。輸出入だけでなく国内の海上輸送(移入)を足し、「港の貨物量=外貿」の誤読を防ぐ。カタログ未掲載 |
| 移出貨物トン数(国内の出) | port-cargo-coastal-out | 0003130803 | 登録済 | isActive:true、2010-2023年。移入とセットで内航の流れを読む。カタログ未掲載 |
| フェリー輸送車両(県別) | port-vehicle-ferry | 0003130796 | 登録済 | isActive:true、2009-2023年(都道府県集計版、cdCat01はmetricファイルで未確認のため空)。旅客以外の海上交通の利用を足す。検索需要は今回の記録に無く優先度は低い |
| 人口あたり・面積あたりの貨物量(port-cargo-total / port-container-count の派生) | port-cargo-total | 0003130738 | 登録済 | metric定義に「人口10万人あたり(トン/10万人)」「100km2あたり」の派生が登録済み(port-container-countも同様、TEU/10万人)。総量だけのテーマに割合系の視点を足せるが、港湾貨物は県の産業構造・立地の影響が大きく、読み方の注意書きが必要。テーマに出す形(表示切替か別指標か)は未確認 |

## 確かめたこと・確かめていないこと (agent の申告)

- data/themes/catalogs/ports.json を読み、いまの章 (cargo / trade / ships-passengers) と指標 (primary 2・secondary 4・context 4) を確認した
- inventory.json の metricInfo で port-cargo-total / port-container-count / port-cargo-export / port-cargo-import / port-inbound-ships の期間 2005〜2023 を確認した。いまのカタログで先頭に置く指標の最新年はすべて 2023 で、2020 年以降を満たす
- 追加 3 指標 (port-container-tonnage / port-cargo-coastal-in / port-cargo-coastal-out) は data/metrics/<key>.ts で isActive: true・years 2010〜2023・source.url を確認し、sourceUrl に写した。inventory の metricInfo には載っていなかったため年は定義ファイルから読んだ
- port-vehicle-ferry は isActive: true・2009〜2023 だが source.url が無く、検索需要の記録も無いため追加しなかった
- 割合・人口あたりの指標は rankingKey として登録されていない (port-cargo-total などの定義に人口10万人あたり・100km2あたりの normalizationOptions があるのみで、独立した指標ではない)。そのため先頭の章は総量のままにした。制約 2 の例外として明記する
- composition は使っていない。port-cargo-total の定義 (axisSum cat03 の 110・120・130) と移入 (cdCat01 140) の関係が、輸出・輸入・移出・移入の合計と一致するか確かめていないため
- trend ブロックは 1 ブロック 2 指標以内・同じ単位のみ (トン)。追加指標・既存指標とも years が 2 年以上あることを定義ファイルで確認した
- 同じ rankingKey を 2 つのブロックに入れていない。context の指標 (maritime-import-export-cargo / port-ships-tonnage / passenger-ship-transport / port-count) は章に入れず、drop も空にした
- 既存の chart ports-cargo-trend (輸出・輸入の折れ線) は trade 章の trend ブロックと同じ指標を描くため、描画側でカードに寄せられる想定。未確認: generate:catalog / validate:catalog は走らせていない (読み取りだけの制約)
- 未確認: e-Stat 上の統計表の実在・内陸 7 県を除く 47 県の対象範囲 (inventory では areas 39〜40)。章の見出しの「どの県の港で」は県ごとの比較ではなく指標の定義に基づく表現で、順位は書いていない
- 調査の未確認: e-Stat APIやWebでの外部確認は行っていない。statsDataIdとcdCat01はdata/metricsの定義から読んだ値で、e-Stat上の実在は呼び元で未検証
- 調査の未確認: port-vehicle-ferryのcdCat01はmetricファイルの抜粋では確認できず空欄
- 調査の未確認: port-passengers-totalはisActive:falseのため候補から外した。港湾旅客数としてカタログには旅客船輸送人員(passenger-ship-transport)が既にある
- 調査の未確認: 検索語の記録はサイト全体の28日分で、港湾テーマに特化した流入や/areas/<県>/portsページ別の需要は未確認。コンテナの検索表示約210回超は表記ゆれの単純合算(重複の可能性あり)
- 調査の未確認: selection.jsonは冒頭のみ読み、採用基準の全文(読者への有用性など)とのスコア判定はしていない
- 調査の未確認: 派生指標(人口あたり)がテーマ上でどう表示できるか(カタログの指標として載せられるか)は未確認

## 採用決定

2026-11-14 オーナーの指示 (提案は基本的に承認する。出し直しが要る案は設計し直して自動で承認とする) により採用。
実装: `apply-design.ts --approved ports` でカタログへ適用し、`validate:catalog` は error 0・warning の増減なし。
公開日に実験を `metricScope: all-routes` で登録する。
