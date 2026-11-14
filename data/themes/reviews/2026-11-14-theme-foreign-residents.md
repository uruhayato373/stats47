---
type: theme-catalog-review
date: 2026-11-14
status: proposal-ready
theme: foreign-residents
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 外国人 (foreign-residents)

## 結論

**いまは実装しない。** このテーマには測定中の実験 (`THEME-COPY-20261112-foreign-residents` (d56 = 2027-01-07)) があり、章や指標を変えると測定に混ざる。実験の判定が出た後 (2027-01-07 以降) に、その結果を踏まえてこの案を見直してから実装する。

機械で一括に組み直す方法 (`apply-design.ts --approved`) は、このテーマには使わない。同じ日に実験のある 5 テーマへ試したところ、人が作り込んだ図・埋め込みの節・章の構成を固定するテストが落ちた (カタログの検査 1 件・テスト 6 件。変更は取り消した)。実装するときは、提案の採否を 1 項目ずつ決めて手で直す (`theme-proposal-format.md` の手順)。

設計の agent の案: 検索語の最上位「外国人が少ない県・多い県」に人口10万人当たりで答える章を先頭に残し、2番目の問い「外国人労働者が多い県」の章を国籍別の前に上げた。単独1指標だった労働者数と事業所数の2章は1章にまとめ、先頭章には最新年が2024年の在留外国人数を2つ目の stat として足した。国籍別章には登録済みのアジアと南アメリカ出身の在留外国人数を足した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 外国人が少ない県・多い県はどこか (人口あたりで見るとどうなるか) |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 1652・クリック 19・クリック率 1.1%・平均順位 11.73 (`data/themes/portfolio.json#foreign-residents/metricsAllRoutes28d`) |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 外国人が少ない県・多い県はどこか (人口あたりで見るとどうなるか) | GSC 2026-W45 queries.csv: 「外国人が少ない県」13回/157表示、「外国人が少ない 県 ランキング」8回/67、「外国人 少ない県」5回/48、「外国人が少ない都道府県」3回/43、「外国人が一番多い県」1回/7、「外国人」19回/736 |
| 外国人労働者が多い県はどこか | GSC 2026-W45: 「外国人労働者 多い県」4回/23表示、「外国人労働者 県 別 ランキング」2回/18、「外国人労働者 都道府県 ランキング」1回/21、「外国人労働者が多い県」1回/13 |
| 自分の県・市で外国人は人口の何%か (割合) | GSC 2026-W45: 「千葉県 外国人 割合」1回/3表示、「中国 外国人 割合」0回/21、「北海道 外国人 割合」0回/2、「三重県 外国人 割合」0回/1、「川口 外国人 割合」1回/1、「徳島県 外国人 人口」1回/13、「香川県 外国人 人口」0回/9 |
| 訪日外国人・外国人観光客と住んでいる外国人は別か (観光系の問い) | GSC 2026-W45: 「訪日 外国人 都 道府県 別ランキング」7回/45表示、「外国人観光客 ランキング 都 道府県」6回/145、「訪日外国人 都道府県別」4回/38。カタログは外宿泊を total-overnight-guests-foreign で観光へ誘導済み |
| 在留外国人の最新統計はどうなっているか・国籍(出身地域)別の内訳は | GSC 2026-W45: 「在留外国人統計 最新」1回/1表示、「在留外国人」0回/2、「在留中国人数」0回/3 (表示は少ない)。棚卸し: resident-foreigner-population は 2012-2024 の 13 年 |

最初の章についての調査の所見: 最初の章は検索語の最上位「外国人が少ない県 / 多い県」に直接答える都道府県別の外国人人口 (人口10万人当たり、foreign-resident-count-per-100k) のままにし、直後に「外国人労働者が多い県」(foreign-worker-count) を置いて、労働の問いを後ろの章ではなく早めに拾うのがよい。ただし現行の foreign-resident-count-per-100k は棚卸し上 1980-2020 の国勢調査 9 年で、最新の在留外国人 (2012-2024) との基準の違いを章冒頭の注記で示すこと。

## 現行の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 居住する外国人人口 (`residents`) | 外国人人口（人口10万人当たり） | theme-foreign-total-trend |
| 2 | 国籍別の違い (`nationality`) | 中国籍人口（人口10万人当たり）・韓国・朝鮮籍人口（人口10万人当たり） | theme-foreign-nationality-trend |
| 3 | 地域の産業で働く外国人労働者の規模はどれくらいか (`foreign-workers`) | 外国人労働者数（雇用届出） | — |
| 4 | 外国人を雇用する事業所の受け入れ基盤は整っているか (`foreign-employing-establishments`) | 外国人を雇用する事業所数 | — |

## 提案する章とカード (未実装)

| 順 | 章 (key) | 見出し | 答える悩み | カード (見せ方) |
|---|---|---|---|---|
| 1 | `residents` | 外国人は人口10万人あたり何人住んでいるか | 外国人が少ない県・多い県はどこか、自分の県では人口に対してどれくらいかが気になります。 | 外国人人口（人口10万人当たり） (数値)、在留外国人 (数値) |
| 2 | `foreign-workers` | 外国人労働者はどれくらい働いているか | 外国人労働者が多い県はどこか、地域の事業所にどれだけ受け入れが進んでいるかが気になります。 | 外国人労働者数（雇用届出） (数値)、外国人を雇用する事業所数 (数値) |
| 3 | `nationality` | どの国籍・出身地域の人が多いか | 中国・韓国・米国など国籍別や出身地域別に、どんな違いがあるかが気になります。 | 中国籍人口（人口10万人当たり）・韓国・朝鮮籍人口（人口10万人当たり）・米国籍人口（人口10万人当たり） (推移)、在留外国人（アジア） (数値)、在留外国人（南アメリカ） (数値) |

## 足す案の指標 (登録済み・未実装)

| 指標 | rankingKey | 年 | 答える問い | 機械の検査 |
|---|---|---|---|---|
| 在留外国人（アジア） | `resident-foreigner-asia` | 2012〜2024 | 「在留中国人数」など国籍・出身地域別の問いに、国勢調査の中国・韓国・米国だけでは足りない出身地域の規模で答える。 | 通過 |
| 在留外国人（南アメリカ） | `resident-foreigner-south-america` | 2012〜2024 | 「外国人が多い県」の地域差が出身地域でどう変わるかを、アジアと対比できる最新年(2024)の指標で示す。 | 通過 |

## 調査のその他の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 在留外国人数（ヨーロッパ） | resident-foreigner-europe | 0000010101 | 登録済 | data/metrics に定義あり・isActive: true。国籍別章の欠けている地域区分を埋める。カタログ未掲載 |
| 外国人人口（人口10万人当たり・別統計） | foreign-population-per-100k | 0000020301 | 登録済 | data/metrics に定義あり・isActive: true だが entities が city のみ。都道府県ページでは使えないので、/areas 市区町村側や「川口 外国人 割合」型の検索への受け皿候補。県別テーマ章へは載せない |
| 日本語指導が必要な児童生徒数 | students-requiring-japanese-instruction |  | 要呼び元検証 | data/metrics に定義はあるが isActive: false、年は 2025 のみ。statsDataId を今回確認していない。有効化の可否は呼び元で判断。採用推奨ではない |

## 確かめたこと・確かめていないこと (agent の申告)

- 確認: catalogs/foreign-residents.json の metrics 12件と sections 4章を読んだ。非 context の primary 1件と secondary 4件は、すべてブロックに入れた。
- 確認: inventory.json の metricInfo で foreign-resident-count-per-100k は 1980-2020 の 9 年、resident-foreigner-population は 2012-2024、foreign-worker-count と foreign-employing-establishment-count は 2025 の 1 年。先頭章の stat 2つの最新年は 2020 と 2024 で、2015 年以前の指標は先頭章に無い。
- 確認: data/metrics の resident-foreigner-asia と resident-foreigner-south-america は isActive: true、years 2012-2024、出典 URL は https://www.stat.go.jp/data/ssds/index.htm、statsDataId 0000010101(A3201・A3204)。
- 確認: trend は国籍別の1ブロック(3指標・同じ単位)だけで、3指標とも inventory 上 9 年ある(usa-per-100k は metricInfo で 1980-2020)。2025年の1年分の指標と stat 以外の指標を折れ線に入れていない。同じ rankingKey を2つのブロックに入れていない。
- 確認: 章は現行4章から3章に減った。1章1指標だけの章は無く、章 key は residents・nationality・foreign-workers を再利用した。foreign-employing-establishments は foreign-workers に統合した。
- 確認: 先頭章の per-100k(国勢調査・2020)と在留外国人数(在留統計・2024)は基準が違うので、章の注記で区別を示す必要がある。在留外国人数は人口10万人あたりに換算できる設定(normalizationOptions)が定義にあるが、換算後の値は確認していない。
- 確認: 登録済みの指標に外国人労働者数や事業所数の人口あたり・割合の指標は無く、労働者の章は総量のまま(foreign-worker-count と foreign-employing-establishment-count は2025年の1年分で、説明にある届出ベースの注記は定義ファイルの note に書かれている)。先頭章に per-100k があるので総量だけの章にはしていない。
- 確認: composition は使っていない。アジア・南アメリカなど出身地域の区分が足すと全体になるかは統計表で確かめていない。
- 未確認: resident-foreigner-asia と resident-foreigner-south-america の R2 上の実際の年数と47県の値。確認したのは定義ファイルの years だけ。
- 未確認: foreign-population-per-100k は entities が city のみなので入れていない。students-requiring-japanese-instruction は isActive: false なので入れていない。
- 未確認: 先頭章の 2 つ目の stat が trend ではなく stat であることを、既存の注記や章の説明でどう読ませるか(カタログ側の description は空文字)。
- 起票候補: なし
- 調査の未確認: 割合 (外国人の人口比 %) の登録済み都道府県別指標は見つからなかった。foreign-resident-count-per-100k は 10万人当たりで %表記ではない。foreign-population-per-100k は city 限定。
- 調査の未確認: 「割合」系の問い (千葉県 外国人 割合 等) は表示回数が 1〜21 と少なく、需要は小さい。
- 調査の未確認: resident-foreigner-asia/europe/south-america の years は grep 出力が数値を拾えず未確認。inventory.json の metricInfo にも無かった。
- 調査の未確認: foreign-resident-count-per-100k の inventory 上の単位は「人」で、人口10万人当たりの値かは metric 定義の分母指定を読んでいない。
- 調査の未確認: data/themes/viewpoints/selection.json は件数のみ確認し、内容を読んでいない。
- 調査の未確認: 技能実習・特定技能・留学生・帰化・国際結婚等の語は W45 queries.csv に該当なし。出入国在留管理庁の在留資格別統計など未登録の統計表は調べていない。
- 調査の未確認: /areas/<県>/foreign-residents の実ページ構成は見ていない。e-Stat API・WebFetch は使っていない。
- 調査の未確認: 起票候補: なし

## 採用決定

ユーザー承認待ち。判断が要る点:

1. 実験の判定 (2027-01-07 以降) を見てから、章の順と見出しをこの案へ寄せるか。
2. 足す案の指標のうち、どれを載せるか (機械の検査を通ったものに限る)。
3. 人が作り込んだ図・埋め込みの節・テストで固定した構成のうち、変えてよいものはどれか。
