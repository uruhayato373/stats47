---
type: theme-catalog-review
date: 2026-11-14
status: implemented-pending-release
theme: innovation-patents
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 研究開発と特許 (innovation-patents)

## 結論

変更は小さい。章の順 (特許→意匠→商標) と key、意匠・商標の推移ブロックはそのままにし、先頭の特許の章だけ、「特許出願件数ランキング」「富山・神奈川の特許」といった検索語に合わせ、出願・登録・発明者数を 3 枚の stat に並べ直した (旧: 出願と発明者の推移 + 登録 1 枚)。登録済みの指標に割合・人口あたりの特許指標が無く、他テーマが主指標に持つ開業率などは抱え込まないため、指標は足していない。

THEME-PAGE-REVIEW-01 の段 4 (全 56 テーマの指標の見直し)。調査 (theme-researcher) と設計 (theme-designer) の結果を機械で検査し (実在しない指標・重複・取りこぼし・`validate:catalog`)、通った案をカタログへ適用した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 都道府県別の特許出願件数ランキングは? |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 59・クリック 2・クリック率 0%・平均順位 None (`data/themes/portfolio.json#innovation-patents/metricsAllRoutes28d`) |
| 進行中の実験 | なし |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 都道府県別の特許出願件数ランキングは? | GSC 2026-W45 queries.csv: 「特許出願数」9回、「特許出願件数」4回(1クリック)、「特許出願件数 ランキング」2回。 |
| 自分の県(富山・神奈川)の特許出願・調査はどうなっているか | 「富山 特許 出願 調査」5回、「富山 特許」4回、「富山 国際特許 調査」3回、「富山 特許 出願」2回、「特許 神奈川」6回。県別ページの需要を示す。 |
| 特許の公式な年次動向(行政年次報告書)と県別の違いは? | 「特許行政年次報告書」1回、「特許」2回(順位65.5)。 |
| 件数が多いのは人口や企業が多いからではないか(規模を除いた比較) | 検索語に直接の記録なし。カタログは件数のみで人口あたりが無く、読者の自然な疑問として提起(推測)。表示回数の裏付けなし。 |

## 適用前の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 地域での技術開発や特許出願は活発に行われているか (`patent-creation-and-inventors`) | 特許出願件数（筆頭出願人住所）・出願に記載された延べ発明者数、特許登録件数（筆頭出願人住所） | — |
| 2 | 製品デザインや意匠の開発・権利化は進んでいるか (`design-rights-and-innovation`) | 意匠出願件数・意匠登録件数 | — |
| 3 | 地域ブランドや新規事業の商標登録・権利保護は盛んか (`trademark-creation-and-branding`) | 商標出願件数・商標登録件数 | — |

## 実装した構成 (カタログの現在の形)

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 自分の県の特許出願・登録・発明者数は、どれだけあるか (`patent-creation-and-inventors`) | 特許出願件数（筆頭出願人住所）、特許登録件数（筆頭出願人住所）、出願に記載された延べ発明者数 | — |
| 2 | 製品デザイン（意匠）の出願と登録は増えているか (`design-rights-and-innovation`) | 意匠出願件数・意匠登録件数 | — |
| 3 | 商標の出願と登録は増えているか (`trademark-creation-and-branding`) | 商標出願件数・商標登録件数 | — |

見せ方 (推移・数値・構成比) は `apply-design.ts` がデータの形 (年の数・単位) に合わせて決め直した。

## 不採用・保留の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 開業率(新規事業の活発さ) | business-opening-rate |  | 登録済 | isActive:true、単位%、2022-2024の3年・47県(inventory)。事業化の側面を補う割合指標。年数が少ない。statsDataIdは未確認。 |
| 情報通信業事業所数(民営) | information-private-establishments | 0000010103 | 登録済 | isActive:true、2011-2021の4年・47県。技術系産業の厚み。総量で割合ではない。 |
| 大学数(10万人あたり表記のkey) | university-count-per-100k | 0000010205 | 登録済 | isActive:true、1975-2024の50年。研究基盤の背景。title「大学数」・単位「校」でkey名(per-100k)と不一致の疑いがあり採用前に定義確認が必要。 |
| 研究者の平均年収 | researcher-annual-income | 0003445758 | 登録済 | isActive:true、2020-2023の4年・47県、単位万円。研究人材の処遇。研究者数・研究開発費そのものではない。 |
| 人口あたり・出願人あたりの特許出願件数 | — |  | 要呼び元検証 | patent/trademark/design の割合・人口あたり指標を data/metrics で探したが登録済みは見つからなかった。既存の出願件数÷人口で派生するか新規登録の判断が必要。statsDataIdは未確認のため不採用扱い。 |

## 確かめたこと・確かめていないこと (agent の申告)

- data/themes/catalogs/innovation-patents.json を読み、metrics 7 件・section 3 章・metricGroups 4 組を確認した。7 件すべてをいずれかの章のブロックに 1 回ずつ入れ、drop は空にした。
- inventory.json の metricInfo と data/metrics/*.ts の years を読み、特許出願・登録は 2013-2024、発明者数は 2016-2024 (2013-2015 は PCT 国内移行を含まない定義変更で除外)、意匠・商標の出願と登録は 2013-2024 で、いずれも 47 県・isActive: true と確認した。先頭の章の 3 ブロックはすべて stat で最新年が 2024。
- trend ブロックは意匠・商標の各 2 指標 (単位は件の 1 種、12 年分) で、2 年以上・3 指標以内・単位 2 種以内を満たす。
- composition は使っていない。出願件数と登録件数は足しても全体にならず、統計表 (statsDataId 0003398336/0003398337/0003398338) で内訳の関係を確かめていない。
- 割合・人口あたりの特許指標は data/metrics のファイル名と grep で探して見つからなかったため、先頭の章は総量のまま。件数は人口や企業数の多い県ほど大きくなる点を、章の説明か注記で補う必要がある (制約 2 の例外)。
- business-opening-rate は data/themes/catalogs/business-demography.json で primary であり、2022-2024 の 3 年しかなく特許への直接の答えでもないので追加しなかった。information-private-establishments は information-industry の primary、university-count-per-100k は education-culture の secondary で、いずれも抱え込まない。researcher-annual-income は occupation-salary の context で、特許の量を答える指標ではないため採らなかった。
- 未確認: data/themes/viewpoints/selection.json の全文 (先頭 80 行のみ読んだ)。
- 未確認: 章タイトルの検索需要。GSC の表示回数は調査の前段が最大 9 回と報告しており、需要の裏付けは弱い。
- 未確認: stat ブロックに複数 rankingKey を入れたときの描画。安全のため 1 ブロック 1 指標にした。
- 未確認: 全国の公式系列 (app/japan) の有無と、実際の描画結果。
- 調査の未確認: data/themes/viewpoints/selection.json は読んでいない
- 調査の未確認: e-Stat・白書・競合ページ・Web は調べていない(読み取りのみ・ローカルのみ)
- 調査の未確認: 検索語は特許関連のみ少数(表示回数が最大9)で、需要の裏付けは弱い。商標・意匠の検索語は見つからなかった
- 調査の未確認: business-opening-rate の statsDataId は grep で取れず未確認
- 調査の未確認: 人口あたり・割合の特許指標は登録済みに見つからず、新規登録の可否は未検証
- 調査の未確認: university-count-per-100k の key 名と title/単位の不一致は定義の詳細を読んで確認していない

## 採用決定

2026-11-14 オーナーの指示 (提案は基本的に承認する。出し直しが要る案は設計し直して自動で承認とする) により採用。
実装: `apply-design.ts --approved innovation-patents` でカタログへ適用し、`validate:catalog` は error 0・warning の増減なし。
公開日に実験を `metricScope: all-routes` で登録する。
