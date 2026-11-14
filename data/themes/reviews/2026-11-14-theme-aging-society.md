---
type: theme-catalog-review
date: 2026-11-14
status: proposal-ready
theme: aging-society
supersedes: null
tags: [theme-catalog, proposal, theme-page-review]
---

# テーマ改善の提案: 少子高齢化 (aging-society)

## 結論

**いまは実装しない。** このテーマには測定中の実験 (`THEME-STRUCTURE-20261007-aging-society` (d56 = 2026-12-02)、`THEME-COPY-20261112-aging-society` (d56 = 2027-01-07)) があり、章や指標を変えると測定に混ざる。実験の判定が出た後 (2027-01-07 以降) に、その結果を踏まえてこの案を見直してから実装する。

機械で一括に組み直す方法 (`apply-design.ts --approved`) は、このテーマには使わない。同じ日に実験のある 5 テーマへ試したところ、人が作り込んだ図・埋め込みの節・章の構成を固定するテストが落ちた (カタログの検査 1 件・テスト 6 件。変更は取り消した)。実装するときは、提案の採否を 1 項目ずつ決めて手で直す (`theme-proposal-format.md` の手順)。

設計の agent の案: 検索需要の大きい高齢化率・合計特殊出生率を最初の章の先頭 2 つの stat に置き、続けて一人暮らし割合の章を置いた。指標が 1 つだけだった結婚の章と就業・介護の章は近い章にまとめて章の数を減らし、検索表示が最も多かった健康寿命(男女)を登録済みの指標から足して、就業・老人ホームと同じ章に並べた。年齢構造の章は検索語が少ないので最後に回した。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主問 | 高齢者の一人暮らしは自分の県でどれくらいの割合か |
| baseline (全ルート込み・GSC 2026-10-09〜2026-11-05) | 表示 2487・クリック 32・クリック率 1.3%・平均順位 7.91 (`data/themes/portfolio.json#aging-society/metricsAllRoutes28d`) |

### 読者の問い (調査の結果)

| 問い | 根拠 |
|---|---|
| 高齢者の一人暮らしは自分の県でどれくらいの割合か | queries.csv(2026-W45): 「高齢者 一人暮らし 割合 最新」101回(4クリック)、「高齢者 一人暮らし 割合」85回、「一人暮らしの高齢者 割合」25回、「一人暮らし 高齢者 割合」23回と9回ほか表記ゆれ。カタログに elderly-living-alone-rate(1980-2020、9年)あり |
| 健康寿命の都道府県ランキング(長生きではなく健康な期間)はどうなっているか | queries.csv: 「健康寿命 都道府県 ランキング 最新」133回(5クリック)、「健康寿命ランキング 都道府県」48回、「都道府県 健康寿命 ランキング」16回、「健康寿命 県別ランキング」31回、「健康寿命 ランキング 都道府県」20回ほか多数。healthy-life-expectancy-male/female は登録済みだがカタログに未掲載 |
| 少子高齢化が進んでいる県はどこか(県別の高齢化率・出生率の順位) | queries.csv: 「少子高齢化ランキング」40回、「少子高齢化 ランキング」31回、「少子高齢化 都道府県 ランキング」20回、「少子高齢化が進んでいる県」18回、「都道府県 高齢化率 ランキング」20回、「鳥取県 高齢化率」33回、「合計特殊出生率 ランキング」43回、「合計特殊出生率 2023」47回 |
| 介護施設・介護サービスは足りているか、介護が必要な人はどれくらいいるか | queries.csv: 「介護サービス施設・事業所調査」410回、「介護サービス施設 事業所調査」80回、「介護サービス施設事業所調査」114回、「介護 施設 数」「介護施設 不足」各1回、「介護人材不足 2040年」8回、「介護認定者数」1回(クリック0)。カタログには老人ホーム定員(nursing-home-capacity-per-1000-65plus)のみ |
| 後期高齢者の医療・事業状況は地域でどう違うか | queries.csv: 「後期高齢者医療事業状況報告」25回、「後期高齢者医療事業年報」15回。カタログに late-elderly-medical-expense-per-insured あり。ただし元は公表資料名を探す検索で、指標の問いとしては弱い |

最初の章についての調査の所見: 最初の章は、検索需要が最も大きい「高齢化率・合計特殊出生率の県別順位」を置き、その直後に「高齢者の一人暮らし割合」を続ける。健康寿命は新しい章(健康な老後)として世帯の章の後ろに足すのがよい。

## 現行の構成

| 順 | 章 (key) | カード | チャート |
|---|---|---|---|
| 1 | 出生と高齢化の現在地 (`birth-aging`) | 高齢化率、合計特殊出生率 | — |
| 2 | 年齢構造と支え手の比率 (`age-structure`) | 老年人口指数（15～64歳人口100人当たり）・年少人口指数（15～64歳人口100人当たり） | theme-age-composition、theme-population-pyramid |
| 3 | 高齢者はどの世帯で暮らすか (`elderly-households`) | 65歳以上世帯割合・高齢者の一人暮らしの割合・高齢単独世帯（一般世帯に対して）・高齢夫婦のみの世帯の割合 | — |
| 4 | 医療・介護の受け皿と費用 (`elderly-care`) | 老人ホーム定員（65歳以上千人当たり） | theme-late-elderly-medical-expense-trend |
| 5 | 結婚や出産は減少しているか (`birth-and-marriage`) | 婚姻率（人口千人） | — |
| 6 | 高齢者の就業や介護の受け皿は確保されているか (`elderly-work-and-care`) | 高齢就業者割合 | — |
| 7 | 読み方 (`reading`) | — | md-aging-discussion、md-aging-faq |

## 提案する章とカード (未実装)

| 順 | 章 (key) | 見出し | 答える悩み | カード (見せ方) |
|---|---|---|---|---|
| 1 | `birth-aging` | 自分の県の少子高齢化はどこまで進んでいるか | 高齢化率や出生率が自分の県でどの水準か、結婚は減っていないかを知りたい。 | 高齢化率 (数値)、合計特殊出生率 (数値)、婚姻率（人口千人） (推移) |
| 2 | `elderly-households` | 高齢者の一人暮らしはどれくらいか | 高齢者が一人で暮らす割合や、高齢者のいる世帯の形が自分の県でどうなっているかを知りたい。 | 高齢者の一人暮らしの割合 (数値)、65歳以上世帯割合 (数値)、高齢単独世帯（一般世帯に対して）・高齢夫婦のみの世帯の割合 (推移) |
| 3 | `elderly-care` | 高齢になっても健康に暮らし続けられるか | 健康に過ごせる期間、働く高齢者の割合、老人ホームの受け皿が自分の県でどうかを知りたい。 | 健康寿命（男性）・健康寿命（女性） (男女)、高齢就業者割合 (数値)、老人ホーム定員（65歳以上千人当たり） (数値) |
| 4 | `age-structure` | 子どもと高齢者は現役世代に対してどう変わってきたか | 現役世代に対する高齢者と子どもの比がどう動いてきたかを知りたい。 | 老年人口指数（15～64歳人口100人当たり）・年少人口指数（15～64歳人口100人当たり） (推移) |

## 足す案の指標 (登録済み・未実装)

| 指標 | rankingKey | 年 | 答える問い | 機械の検査 |
|---|---|---|---|---|
| 健康寿命（男性） | `healthy-life-expectancy-male` | 2019〜2022 | 「健康寿命 都道府県 ランキング」系の検索(最新週で133回ほか多数)に答える、日常生活に制限のない期間(年)の指標で、女性と並べて男女差を見せる。 | 不可: 出典の URL を定義ファイルで確かめられない |
| 健康寿命（女性） | `healthy-life-expectancy-female` | 2019〜2022 | 男性と対にして、同じ「健康寿命 ランキング」の検索に答え、男女差を読めるようにする。 | 不可: 出典の URL を定義ファイルで確かめられない |

## 調査のその他の候補

| 候補 | rankingKey | statsDataId | 確認の状態 | 理由 |
|---|---|---|---|---|
| 要支援・要介護認定者数 | long-term-care-certified-persons |  | 登録済 | isActive: true・2024年の1年分のみ・47県。「介護認定者数」の検索あり(1回)。総量なので割合・人口あたりの指標が登録済みか探したが、認定率などの名前のファイルは data/metrics に見つからなかった。比較には65歳以上人口で割る作りが必要 |
| 介護老人福祉施設(特別養護老人ホーム)定員数 | special-nursing-home-capacity | 0000020210 | 登録済 | isActive: true。介護施設の受け皿の需要(介護施設 不足など)に答える。ただし単位は人の総量で、65歳以上人口あたりの老人ホーム定員(nursing-home-capacity-per-1000-65plus)が既に載っているため重複しやすい |
| 生活保護被保護高齢者数(65歳以上人口千人当たり) | elderly-on-public-assistance-per-1000-65plus | 0000010210 | 登録済 | isActive: true・人口あたりの形。高齢者の暮らしの厳しさを県別に比べる指標で、カタログに未掲載。検索需要の裏付けは見つけていないので優先度は低い。cdCat01は確認していない |

## 確かめたこと・確かめていないこと (agent の申告)

- 確認済み: 追加した healthy-life-expectancy-male / female は data/metrics に実在し、isActive: true、単位は年、years は 2019〜2022。sourceUrl は定義が使う HEALTHY_LIFE_RELEASE.sourceUrl (厚生労働省の PDF) をそのまま写した。他テーマでは healthcare の secondary で、primary ではない
- 確認済み: 最初の章の stat は ratio-65-plus(最新 2025)と total-fertility-rate(最新 2023)で、どちらも割合・率の指標。2015 年以前が最新の指標は先頭の章に無い
- 確認済み: いまのカタログの context 以外の指標 11 件 (ratio-65-plus, total-fertility-rate, household-ratio-with-65plus, marriages-per-total-population, single-person-household-old-population-ratio, elderly-living-alone-rate, elderly-couple-only-household-ratio, young-population-index, old-population-index, nursing-home-capacity-per-1000-65plus, elderly-workers-ratio) は全て 1 つのブロックに入れ、重複なし。trend の 3 ブロックは全て 2 年以上で単位 1 種、3 指標以下 (inventory の years で確認)
- 確認済み: 章は 4 つ (いまは読み方の章を含め 7 つ) で増えていない。age-structure の章はブロックが 1 つだが指標は 2 つ。章キー birth-aging / age-structure / elderly-households / elderly-care は現行を再利用した
- 確認済み: long-term-care-certified-persons は long-term-care テーマの primary で総量・1 年のみ、定義に「認定率ではない」とあるため足さない。special-nursing-home-capacity は定義の entities が city で都道府県の指標ではないため足さない。elderly-on-public-assistance-per-1000-65plus は定義上は 1975〜2022 の 65 歳以上人口千人当たりだが、検索需要の裏付けが無いため足さない
- 確認済み: composition は、足すと全体になると確かめた組が無いので使っていない。ranking は章が 1 地域の答えなので使っていない
- 未確認: 読み方の章 (md-aging-discussion / md-aging-faq は markdown-section でブロックを持てない) は本案に含めていない。いまのまま残す前提。同様に図 (theme-age-composition / theme-population-pyramid / theme-late-elderly-medical-expense-trend) と埋め込みの節 (depopulated-settlements / depopulation-medical) が、章キーを再利用すれば元の章に付いたままになるかは apply 側の処理を読んでいない。birth-and-marriage / elderly-work-and-care の旧キーが不要になる扱いも未確認
- 未確認: 健康寿命の原資料 (厚労省 PDF) の中身は開いておらず、定義ファイルの記述までしか見ていない。世帯系の指標の分母の定義も inventory の title 以上は読んでいない
- 未確認: data/themes/viewpoints/selection.json は規則の一覧を読んだが、catalog の selection や rejectedCandidates との機械照合 (owned-elsewhere など) は実行していない。inventory の years は定義の値で、R2 に 47 県そろっているかは見ていない。検索需要は前段調査(2026-W45 の 1 週分)の引用のままで、再集計していない
- 調査の未確認: data/themes/viewpoints/selection.json は行数を数えただけで中身を読んでいない
- 調査の未確認: healthy-life-expectancy の2ファイルは statsDataId・cdCat01 を取得できていない(grep に該当行が出なかった)。出典統計の名前も未確認
- 調査の未確認: 要介護認定率や75歳以上人口割合のような割合の指標は、ファイル名の検索では見つからなかった。population-aged-75-plus は総人口(人)で、割合ではない
- 調査の未確認: 検索語は1週のスナップショット(2026-W45)のみで、28日分の表示回数の合計は出していない。個々の検索語の行を引用した
- 調査の未確認: e-Stat への問い合わせ(WebFetch・catalog.mjs)は実行していない

## 採用決定

ユーザー承認待ち。判断が要る点:

1. 実験の判定 (2027-01-07 以降) を見てから、章の順と見出しをこの案へ寄せるか。
2. 足す案の指標のうち、どれを載せるか (機械の検査を通ったものに限る)。
3. 人が作り込んだ図・埋め込みの節・テストで固定した構成のうち、変えてよいものはどれか。
