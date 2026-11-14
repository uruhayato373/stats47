---
type: theme-catalog-review
date: 2026-11-14
status: implemented-pending-release
theme: real-income
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 実質収入・購買力 (real-income)

## 結論

検索需要が最大の「可処分所得の県別」を先頭に残し、物価補正後と家賃差引後は別章にせず 1 章にまとめ、物価の章の次に需要の大きいエンゲル係数・生活費の章を置いた(消費支出とジニを末尾に残す順は維持)。登録済みの指標のうちエンゲル係数・平均貯蓄率・物価変化率の 3 件を足し、章は 6 から 5 に減らした。章の骨格(手取り→購買力→物価→生活費→格差)は現行と同じで変更は小さいが、現行カタログの 1 指標だけの章(家賃差引後)を統合し、末尾に埋もれていた生活費の読者の問いを前に出した。

THEME-PAGE-REVIEW-01 の段 4 (全 56 テーマの指標の見直し)。調査 (theme-researcher) と設計 (theme-designer) の結果を機械で検査し (実在しない指標・重複・取りこぼし・`validate:catalog`)、通った案をカタログへ適用した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 都道府県別の可処分所得ランキングはどうなっているか(手取りが多い県はどこか) |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 216・クリック 2・クリック率 0.9%・平均順位 9.73 (`data/themes/portfolio.json#real-income/metricsAllRoutes28d`) |
| 進行中の実験 | なし |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 都道府県別の可処分所得ランキングはどうなっているか(手取りが多い県はどこか) | 2026-W45 queries.csv で「可処分所得」を含む語の合計が表示 513 回・クリック 51。最大は「可処分所得 都道府県」(171 回・18 クリック)、次いで「可処分所得 都道府県 ランキング」(65 回・11 クリック)。 |
| エンゲル係数は県でどれだけ違うか(食費の重さ) | 「エンゲル」を含む語の合計が表示 86 回・クリック 13。「エンゲル係数 ランキング」21 回、「エンゲル係数ランキング 日本」20 回、「エンゲル係数 都道府県ランキング」14 回。 |
| 生活費や物価が高い県・低い県はどこか | 「物価」を含む語の合計が表示 756 回・クリック 8(「山梨県 物価」15 回、「都道府県 物価指数」8 回、「都 道府県 別 物価 ランキング」7 回)。「生活費」を含む語の合計は表示 102 回・クリック 10(「生活費 ランキング 都 道府県」15 回、「都道府県 生活費 ランキング」11 回)。 |
| 世帯年収・県民所得は県でいくらか | 「県民所得 ランキング」31 回(3 クリック)、「世帯年収 都道府県 ランキング」4 回、「神奈川県 世帯年収ランキング」6 回。 |
| 最低賃金は県ごとにどう推移してきたか | 「最低賃金」を含む語の合計が表示 145 回・クリック 8。「佐賀 最低賃金 推移」5 回、「高知 最低賃金 推移」4 回など、県名と推移を組み合わせた語が複数。 |

## 適用前の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 控除前後の月収 (`household-income`) | 実収入（勤労者世帯・1世帯当たり月額）、可処分所得 | theme-real-income-actual-vs-disposable、real-income-household-composition |
| 2 | 物価補正後の購買力 (`purchasing-power`) | 実質可処分所得 | — |
| 3 | 家賃を差し引いた手残り (`after-rent`) | 家賃差引後の参考月額 | — |
| 4 | 物価条件を詳しく見る (`prices`) | — | real-income-cpi-breakdown、real-income-cpi-breakdown-expenses |
| 5 | 毎月の生活費や消費支出はどれくらいかかっているか (`household-consumption-expenditure`) | 消費支出（全費目） | — |
| 6 | 地域内の所得や金融資産の格差は大きいか (`income-and-asset-inequality`) | 等価可処分所得ジニ係数（総世帯）、等価金融資産残高ジニ係数（総世帯） | — |

## 実装した構成 (カタログの現在の形)

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 手取りの月収は県でいくらか (`household-income`) | 可処分所得、実収入（勤労者世帯・1世帯当たり月額）、平均貯蓄率 | real-income-household-composition、real-income-cpi-breakdown、real-income-cpi-breakdown-expenses、theme-real-income-actual-vs-disposable |
| 2 | 物価と家賃を考えると手取りはどれだけ残るか (`purchasing-power`) | 実質可処分所得、家賃差引後の参考月額 | — |
| 3 | 物価は県でどれだけ違い、どれだけ上がったか (`prices`) | 物価上昇率(総合) | — |
| 4 | 食費の重さと毎月の生活費は県でどれだけ違うか (`household-consumption-expenditure`) | 消費支出（全費目） | — |
| 5 | 地域内の所得や金融資産の格差は大きいか (`income-and-asset-inequality`) | 等価可処分所得ジニ係数（総世帯）、等価金融資産残高ジニ係数（総世帯） | — |

見せ方 (推移・数値・構成比) は `apply-design.ts` がデータの形 (年の数・単位) に合わせて決め直した。

## 足した指標 (登録済みの指標をカタログに載せた。role は secondary)

| 指標 | rankingKey | 年 | 答える問い |
|---|---|---|---|
| 平均貯蓄率 | `avg-savings-rate-worker-households` | 1975〜2024 | 「可処分所得 都道府県」で手取りを調べる読者に、その手取りのうち貯蓄に回る割合を、既にある平均消費性向と並べて見せる。 |
| 物価上昇率(総合) | `cpi-change-rate-total` | 1976〜2024 | 「物価 都道府県」「生活費 ランキング」の検索に対し、いまの物価の地域差指数に足りない「前年からどれだけ上がったか」を県別に示す。 |

足さなかった指標 (機械の検査で外した): `engel-coefficient` (出典の URL を定義ファイルで確かめられない)

## 不採用・保留の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| エンゲル係数 | engel-coefficient |  | 登録済 | data/metrics に定義があり isActive: true、2007〜2025 年・47 地域・単位 %。割合の指標で、現カタログに未掲載。検索「エンゲル」計 86 回表示。statsDataId は算出型(fetcherKey: calculated)のため metric 定義上は空で、e-Stat の表 ID は未確認。 |
| 地域別最低賃金 | minimum-wage-by-region | 0000010106 | 登録済 | isActive: true、2010〜2024 年・47 地域・単位 円(時間額のため総量でなく水準比較)。検索「最低賃金 推移」が県名ごとに出ている。なお labor-wages テーマにも掲載済みなので重複配置の扱いは呼び元判断。 |
| 貯蓄現在高(県庁所在市・二人以上世帯) | household-savings-balance | 0002210008 | 登録済 | isActive: true、2002〜2025 年・47 地域・単位 万円(1世帯当たり)。手取り後の蓄えを読む補足。household-assets-debt テーマにも掲載済みなので重複配置の扱いは呼び元判断。 |

## 確かめたこと・確かめていないこと (agent の申告)

- 確認: catalog JSON の指標・章・チャートを読み、現行の非 context 指標 7 件(可処分所得・実収入・実質可処分所得・家賃差引後・消費支出・ジニ 2 件)をすべて章のブロックに入れた。drop は無し。
- 確認: addMetrics 3 件は data/metrics/<key>.ts に実在し isActive: true。years は engel 2007-2025、savings-rate 1975-2024、cpi-change-rate-total 1976-2024(定義ファイルの years.from/to)。
- 確認: 3 件はほかのテーマで primary ではない(engel-coefficient は household-food-spending、avg-savings-rate は household-assets-debt の secondary、cpi-change-rate-total は他テーマに未掲載)。selection.json の owned-elsewhere に当たらない。
- 確認: 先頭章の先頭 2 ブロックは stat で、最新年は可処分所得 2025、実収入 2024(inventory.json の range)。いずれも 2020 年以降で、世帯当たりの値。最新年が 2015 年以前の指標は先頭章に無い。
- 確認: trend ブロック 3 つはいずれも 2 年以上あり、指標 2 件・単位が揃っている(割合 %、地域差指数)。章あたりブロック 2〜3 件、同じ rankingKey の重複なし。章数は 6 から 5。
- 確認: composition は使わなかった。消費支出 10 費目はカタログの構成比チャートに残る。台帳 sets.json に登録済みで、指摘は too-many-parts のみ。ただし 10 費目の合計が消費支出になることを統計表では確かめていないので、ブロックにはしなかった。
- 確認: エンゲル係数の定義ファイルは出典 URL を持たない算出型(fetcherKey: calculated)のため sourceUrl は空文字にした。
- 未確認: 検索語とテーマの対応は前段の調査による推定で、/themes/real-income に絞った実測ではない。
- 未確認: 最低賃金(minimum-wage-by-region)と貯蓄現在高(household-savings-balance)は labor-wages と household-assets-debt の掲載が既にあるため足さなかった。そちらでの主担当の role は読んでいない。
- 未確認: 現行の chartKeys(CPI 総合の折れ線など)と stat カードの重複(card-chart-duplicate)は今回検査していない。章の chartKeys 配置は設計案の範囲外として扱った。
- 未確認: 実質可処分所得と家賃差引後の算出方法・分母の違い(章の注意書き)は現行 description をそのまま引き継ぐ前提で、定義ファイルは読んでいない。
- 調査の未確認: data/themes/viewpoints/selection.json は読んでいない(指標を選ぶ視点との照合は未実施)。
- 調査の未確認: 検索語の記録はサイト全体で、/areas/<県>/real-income と /themes/real-income に絞れない。語とテーマの対応は語の意味による推定で、実測ではない。
- 調査の未確認: engel-coefficient の statsDataId は metric 定義が算出型で空のため、e-Stat の元表は未確認。cpi-change-rate-total と各候補の years の完全な値は未確認(inventory.json に無かった分)。
- 調査の未確認: e-Stat や公式サイトへの WebFetch は行っていないので、出典 URL は書いていない。候補はすべて登録済みの metric 定義に基づく。
- 調査の未確認: 「実質賃金」「手取り」「世帯年収」の語は上の集計では件数が少なく、実質賃金そのものの登録済み指標(都道府県別)は探した範囲では見つからなかった。

## 採用決定

2026-11-14 オーナーの指示 (提案は基本的に承認する。出し直しが要る案は設計し直して自動で承認とする) により採用。
実装: `apply-design.ts --approved real-income` でカタログへ適用し、`validate:catalog` は error 0・warning の増減なし。
公開日に実験を `metricScope: all-routes` で登録する。
