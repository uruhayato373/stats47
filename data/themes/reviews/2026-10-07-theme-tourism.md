---
type: theme-catalog-review
date: 2026-10-07
status: implemented-pending-release
theme: tourism
supersedes: 2026-07-12-theme-tourism.md
tags: [theme-catalog, tourism, accommodation, inbound, occupancy, consumption]
---

# テーマレビュー: tourism（観光） 2026-10-07

## 結論

このテーマの一番大きい変更は、客室稼働率を 2009〜2014 年と 2024 年の 7 点から、e-Stat に実在する 2009〜2024 年の 16 年分へ広げ、
延べ宿泊者数と並ぶ 2 本目の primary にすることである。延べ宿泊者数は人泊の総数で、人口や観光地の多い県ほど大きくなる
(2024 年は東京都 91,633,100 人泊、徳島県 1,701,370 人泊)。率の指標を主役に置けば、総数だけが主役になる読み違いを防げる。
稼働率の登録年が 2015〜2023 年だけ欠けているのは設定の絞り込みによるもので、e-Stat には 47 都道府県そろって 2015〜2023 年がある
(2026-10-07 に `getStatsData` で確認。2020〜2022 年の落ち込みも見える)。

あわせて、同じ指標を二度見せている箇所を外す。延べ宿泊者数と外国人延べ宿泊者数の図は、すぐ上のカードと同じ 2 指標の折れ線である。
航空旅客の図も、同じ章のカード「航空輸送人員」と同じ 1 指標である。客室稼働率・外国人延べ宿泊者数・延べ宿泊者数は、
`candidate-25`・`candidate-26`・`candidate-28` の章に、上の章とまったく同じカードがもう 1 枚ずつある。
これらを外すと、図は 3 枚から 1 枚、章は 8 つから 6 つになる。

1 年分しかない指標のカードは、推移を描けない。2025 年だけの訪問者数と旅行消費額 2 枚は、年を固定した比較カード
(`comparisonYear`。既存部品) にする。2007 年の国土数値情報の空港数は、同じ章の 2025 年の空港別取扱い (埋め込み) が同じ問いに答えるため、
カードを外して context にする。ほかのテーマ (railway) の主指標である JR 旅客は、一覧からも外す。

2026-07-12 版 (`2026-07-12-theme-tourism.md`) の主問と「延べ宿泊者数は人泊で実人数ではない」「総数と外国人は包含関係」という指摘は引き継ぐ。
その後の 2026-09-09 の章追加 (訪問・消費・季節性・空港) を前提にしていないため、本書が置き換える。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主読者 | 「訪日外国人 都道府県別」「観光消費額 都道府県」「外国人観光客 ランキング」で探す人。自分の県や行き先の宿泊需要・外国人の来訪・消費を全国と比べたい人 |
| 主問 | その県にどれくらいの宿泊需要があり、外国人はどれくらい来て、宿泊施設はどの程度埋まり、旅行者は県内でいくら使うか |
| 比較軸 | 地域差 (都道府県順位) と時系列 (延べ宿泊者数 2009〜2024、客室稼働率 2009〜2024)。訪問・消費は 2025 年の 1 年比較 |
| 誤読リスク | 延べ宿泊者数は人泊で実人数ではない。総数は外国人を含み、足すと重複する。総数・訪問者数・消費額は人口や観光地の多い県ほど大きい。訪問者数は複数県に計上され合算できない。航空旅客は観光以外の移動を含む。稼働率は 2020〜2022 年に大きく下がる。2010 年から従業者 9 人以下の施設が調査対象に入った (7 月版の指摘で、今回は出典を再確認していない) |
| baseline (GSC 2026-W40, 28 日) | `/themes/tourism`: クリック 4、表示 147、CTR 2.72%、平均掲載順位 7.29 (`data/gsc/snapshots/2026-W40/pages.csv`) |

検索需要の補足 (同 snapshot の `queries.csv`。サイト全体のクエリで、ページ単位ではない): 「インバウンド」「訪日」「外国人観光客」を含む 21 クエリで計 44 表示・2 クリック
(「訪日 外国人 都 道府県 別ランキング」13 表示・順位 6.46、「訪日外国人 都道府県別」8 表示・順位 15.13 など)。
「観光消費」「旅行消費」「消費動向」を含む 10 クエリで計 60 表示・1 クリック (「観光消費額 都道府県別」12 表示・順位 6.50 など。
「観光消費動向調査」だけの語は調査名の検索で、調査のハブが受ける)。「観光客数」「観光統計」を含む 9 クエリで計 26 表示・0 クリック。
このテーマは観光入込客数を持たないため、この需要には答えていない (表 3)。「宿泊」を含むクエリは 2 件・4 表示と少ない。

## 現行の構成 (2026-10-07、`data/themes/catalogs/tourism.json`)

| 順 | 章 (key) | カード (metricGroups) | チャート |
|---|---|---|---|
| 1 | 宿泊需要はどれくらいか (`stays`) | 「宿泊需要はどれくらいか」(延べ宿泊者数・外国人延べ宿泊者数) | 延べ宿泊者数の推移（総数・外国人） (`theme-tourism-stay-trend`) |
| 2 | 客室稼働率と宿泊供給の参考 (`accommodation`) | 客室稼働率 (`accommodation`) | 宿泊施設数と客室数の推移 (`theme-tourism-hotel-supply-trend`) |
| 3 | アクセスの背景 (`transport`) | — | 航空旅客輸送量の比較 (`theme-tourism-transport-trend`) |
| 4 | 宿泊市場と稼働率 (`candidate-25`) | 客室稼働率 (`candidate-25-1`、順 2 と同じ指標) | — |
| 5 | 外国人旅行者の訪問・宿泊・消費 (`candidate-26`) | 訪問者数 (2025 のみ) / 県別回答数 (2025 のみ) / 外国人延べ宿泊者数 (順 1 と同じ指標) | — |
| 6 | 訪問先の旅行消費額 (`candidate-27`) | 日本人の県内消費額 (2025 のみ) / 外国人の県内消費額 (2025 のみ) | — |
| 7 | 宿泊の規模と季節性 (`candidate-28`) | 年間の延べ宿泊者数 (順 1 と同じ指標) | 埋め込み「宿泊の季節性」 |
| 8 | 空港と航空交通 (`candidate-85`) | 空港数 (2007 のみ) / 航空輸送人員 | 埋め込み「空港別旅客」 |

指標 17 件 (primary 1・secondary 8・context 8)。

## 表 1: 現行指標

年は config の登録年。e-Stat の実在年は 2026-10-07 に `getStatsData` を 47 都道府県の `cdArea` で呼び、年ごとの欠測でない値の件数を数えて確かめた
(下の「年を広げる 2 指標」は 47 件そろう年のみ)。R2 の公開値 (`https://storage.stats47.jp/app/stats/<key>/values.json`) の年も同日に GET で見た。

| rankingKey | 現行 | 提案 | 年 | 理由 |
|---|---|---|---|---|
| `total-overnight-guests` | primary | keep。選定根拠に採用基準を足す | 登録 2009〜2024 (R2 も 16 年、各 47 件) | 主問の見出し。総数なので章の説明に「人口の多い県ほど大きい」を足す (`scale-vs-rate`)。`selection-evidence` の該当 1 件 |
| `room-utilization-rate` | secondary | **primary に変更。`years` を 2009〜2024 に広げる** | 登録 2009〜2014・2024 の 7 点。e-Stat (`0000010207` / `#G04308`) は 2009〜2024 の 16 年すべて 47 件 | 総数の primary に対する率の primary (`scale-vs-rate`)。登録年の欠け (2015〜2023) は設定の絞り込みで、値は作らない。`selection-evidence` の該当 1 件 |
| `total-overnight-guests-foreign` | secondary | keep。選定根拠に採用基準を足す | 登録 2009〜2024 | 外国人の宿泊需要。総数の内数。foreign-residents には context で入っているだけで主担当ではない |
| `actual-overnight-guests` (実宿泊者数。新規) | (テーマ外) | **追加 → secondary** | 登録なし。e-Stat (`0000010107` / `G7103`) は 2009〜2024 の 16 年すべて 47 件 | 「延べ宿泊者数は人泊で実人数ではない」という最大の誤読リスクに、実人数の指標で答える。どのテーマにも未登録 (`metrics` 内の cdCat01 を検索して見つからなかった)。判断の要る点 1 |
| `air-passenger-transport` | secondary | keep | 登録 1975〜2023。e-Stat (`C3706`) も 1975〜2023 の各 47 件で、広げる年は無い | 空港の章のカード。観光以外の移動を含む注記は章の説明に移す |
| `jr-passenger-transport` | context | **remove** | 2005〜2023 | railway の primary (`owned-elsewhere`)。観光目的を識別できない。railway に残る |
| `inbound-visitors-by-destination` | secondary | keep。年固定の比較カードにする | 2025 のみ (R2 も 2025 の 47 件) | 外国人の来訪の見出し (`single-year-as-trend`)。選定根拠に採用基準を足す |
| `inbound-visit-sample-by-destination` | secondary | **role 変更 → context。カードを外す** | 2025 のみ | 重み付け前の標本数で、読者の比較対象ではなく訪問者数の精度の目安。説明文に注記があり、一覧とランキングには残る |
| `domestic-travel-consumption-by-destination` | secondary | keep。比較カードにまとめる | 2025 のみ | 旅行者が県内で使った金額 (`single-year-as-trend`)。総額なので説明に注記 (`scale-vs-rate`) |
| `inbound-travel-consumption-by-destination` | secondary | keep。同上 | 2025 のみ | 同上 |
| `airport-count` | secondary | **role 変更 → context。カードを外す** | 2007 のみ (R2 も 2007 の 47 件) | 国土数値情報の 2007 年版で 19 年前。同じ章の 2025 年の空港別取扱い (埋め込み) が同じ問いに答える |
| `number-of-hotel-facilities` | context | keep。**`years` を 1997〜2017 に広げる** | 登録 1997〜2008・2017。e-Stat (`0000010103` / `C3803`) は 1997〜2017 の 21 年すべて 47 件 | 推移の図の欠け (2009〜2016) を埋める。客室数は登録済みの 1997〜2017 と年がそろう。2017 年で止まる点は変わらない |
| `number-of-hotel-rooms` | context | keep | 1997〜2017 | 同上 |
| `number-of-simple-lodging-facilities` | context | keep | 1997〜2018・2023 | 宿泊供給の補足。民泊の届出住宅とは別 |
| `travel-participation-rate-domestic-tourism` | context | keep | 2021 のみ | 住民の旅行行動率で目的地の需要ではない。2021 年はコロナ禍。検索需要 (「旅行に行きたくない 県 ランキング」9 表示) があるので一覧には残す |
| `travel-participation-rate-overseas` / `-overnight` / `-day-trip` | context | keep | 2021 のみ | 同上 |

年を広げる 2 指標 (`room-utilization-rate`・`number-of-hotel-facilities`) は、config の `years` を変えるだけで値は作らない。
R2 の観測値は自動では増えないため、再取得はデプロイと同じ承認で行う。

実装時の再確認 (2026-10-08): 3 指標 (`room-utilization-rate`・`number-of-hotel-facilities`・`actual-overnight-guests`) の実在年は
全都道府県で取り直して `data/estat/year-coverage/queue.json` に記録した (`scope: "all-prefectures"`、年ごとの都道府県数つき)。
実宿泊者数の定義は観光庁「宿泊旅行統計調査 用語の解説」(`https://www.mlit.go.jp/kankocho/content/001983218.pdf`、同日 GET で 200) の
「実宿泊者数とは、各月における宿泊手続をした人数をいい、子供や乳幼児も 1 人とした。」に合わせた。

## 表 2: 現行チャート・カード・章

### チャート

| componentKey | 提案 | 理由 / 実装差分 |
|---|---|---|
| `theme-tourism-stay-trend` | **remove** | 描く 2 指標がどちらも直上のカード「宿泊需要はどれくらいか」にある (`card-chart-duplicate`)。注記「総数には外国人を含みます。両系列を足すと外国人分が重複します。延べ宿泊者数は人泊で、実人数ではありません。」は図と一緒に消えないよう `stays` 章の説明へ移す。evidenceTopics `domestic-and-inbound-stays` の `relatedChartKeys` からも外す |
| `theme-tourism-transport-trend` | **remove** | 描く 1 指標が同じ章のカード「航空輸送人員」と同じ (`card-chart-duplicate`)。章 `transport` は図 1 枚だけなので章ごと外す (下) |
| `theme-tourism-hotel-supply-trend` | keep | 年を広げた施設数 (1997〜2017) と客室数の 2 系列。単位が違う 2 指標だが、軸は左右 2 本まで認められる (規約 §metricGroups の単位) ので 1 枚でよい。どのカードにも入っていない指標で重複しない |

外す図 2 枚は、調査と紐付いた図かを実装時に確かめる (調査の紐付け ratchet の下限を下げる必要があるため)。

### カード (metricGroups)

| key | 提案 | 内容 |
|---|---|---|
| `candidate-25-1` | **remove** | 客室稼働率。`accommodation` のカードと同じ指標 |
| `candidate-26-1` | revise | 題「訪日外国人の訪問者数（推計）」に `comparisonYear: "2025"` を付けた比較カードにする |
| `candidate-26-2` | **remove** | 県別回答数。指標は context に下げ、一覧とランキングに残す |
| `candidate-26-3` | **remove** | 外国人延べ宿泊者数。`stays` のカードと同じ指標 |
| `candidate-27-1〜2` | **merge** | 1 枚の年固定比較カード (key `candidate-27-1`、題「訪問先での旅行消費額（2025年）」、`comparisonYear: "2025"`) にまとめる。単位はどちらも「億円」。異なる調査の推計なので、章の説明に「並べて見るが足したり差を取ったりしない」と書く |
| `candidate-28-1` | **remove** | 年間の延べ宿泊者数。`stays` のカードと同じ指標。章は埋め込み「宿泊の季節性」だけになる |
| `candidate-85-1` | **remove** | 空港数 (2007)。指標は context に下げる |
| (新) `stays-actual` | **new** | 題「実宿泊者数」。1 指標 (`actual-overnight-guests`)。`stays` 章に置き、延べ宿泊者数との違い (1 人が複数泊すると延べは泊数分) を章の説明で示す |

### 章

| 順 | 章 | 提案 |
|---|---|---|
| 1 | 宿泊需要はどれくらいか (`stays`) | 図を外す。説明を次の文にする: 「延べ宿泊者数は宿泊日数を含むため、訪問した実人数ではありません。総数には外国人を含み、両者を足すと重複します。総数は人口や観光地の多い県ほど大きくなります。」。カード `stays`・`stays-actual` |
| 2 | 宿泊の季節性 (`candidate-28`) | 順 7 から 2 番目へ移し、改題。カードを外し、埋め込みと既存の説明 (月別値の読み方) だけにする |
| 3 | 客室稼働率と宿泊供給の参考 (`accommodation`) | 説明に「稼働率は 2020〜2022 年に大きく下がります」を足す。施設・客室数が 2017 年までの過去参考である文は残す |
| — | 宿泊市場と稼働率 (`candidate-25`) | **章を外す** (カードが上の章と同じ指標 1 枚だけ) |
| 4 | 外国人旅行者の訪問・宿泊・消費 (`candidate-26`) | カードを 1 枚にする。説明の「訪問回答数は重み付け前の標本で…」は、回答数がランキングページにある旨に直す |
| 5 | 訪問先の旅行消費額 (`candidate-27`) | カードを 1 枚にまとめる。説明に「消費額は総額で、旅行者が多い県ほど大きくなります」を足す (`scale-vs-rate`) |
| 6 | 空港と航空交通 (`candidate-85`) | カードを航空輸送人員 1 枚にする。説明に旧 `transport` 章の「航空旅客数は観光以外の移動も含みます。観光客数の代わりにはなりません。」を足す |
| — | アクセスの背景 (`transport`) | **章を外す** (中身が上の図 1 枚だけ。説明は上の空港章へ移す) |

章は 8 つから 6 つになる。

## 表 3: 不採用候補

| rankingKey / 候補 | reason | reconsider condition |
|---|---|---|
| `jr-passenger-transport` (JR 旅客) | railway の primary で、観光目的を識別できない。観光の主問から外れる | このテーマが鉄道アクセスを含む形に主問を変えたとき |
| 県外・県内の延べ宿泊者数 (`0000010107` の `G710101`・`G710102`、2009〜2024 で 47 件) | 総数の内訳で、図やカードに 2 本足すと「総数＋外国人＋県外」の包含関係が増え、誤読リスクが上がる。比率の指標は rankingKey が無い | 県外比率を公式の系列または検証済みの算出指標として登録したとき |
| 定員稼働率 (`G7104`、2009〜2024) | 客室稼働率と同じ「宿泊施設の使われ方」を別の分母で示すだけで、読者の比較に新しい角度を足さない | 客室稼働率と定員稼働率の差を主問に立てるとき |
| 観光入込客数 (共通基準の観光入込客統計) | 検索需要はある (「観光客数」「観光統計」9 クエリ 26 表示) が、7 月版は未導入県と年度の不一致を指摘している。今回は公表状況を再確認していない | 47 都道府県が同じ年度でそろうと一次資料で確認できたとき |
| 住宅宿泊事業 (民泊) の届出住宅の宿泊実績 | 旅館業法上の簡易宿所と混ぜられず、指標が未登録 | 公式の都道府県別系列を登録したとき |

rankingKey が実在する候補 (`jr-passenger-transport` の主担当 railway、`airport-count` は 2007 のみで context) は、実装時に catalog の `rejectedCandidates` にも記録する。

## 想定実装差分と検証

- 編集: `data/themes/catalogs/tourism.json` と、年を広げる 2 指標の metric config
  (`data/metrics/{room-utilization-rate,number-of-hotel-facilities}.ts` の `years`)。
  `actual-overnight-guests` を採用する場合は `data/metrics/actual-overnight-guests.ts` を新規に作る
  (`statsDataId: "0000010107"`・`cdCat01: "G7103"`・単位「人」・category `tourism`・`years` 2009〜2024)。
- metric config の年を広げても、R2 の観測値は自動では増えない。新規指標の投入と既存 2 指標の再取得 (`data-refresh.yml` または `/page-data-batch`) は
  本番反映と同じ承認で行う。反映まではカードが登録済みの年だけ (稼働率は 7 点) を描く。
- 選定根拠は `/backfill-theme-selection` の gate を通して書く。現行の `sourceUrl` は総務省統計局の社会・人口統計体系の入口で、
  稼働率と延べ宿泊者数の一次資料 (観光庁「宿泊旅行統計調査」`https://www.mlit.go.jp/kankocho/tokei_hakusyo/shukuhakutokei.html`、
  訪日外国人は同「インバウンド消費動向調査」`https://www.mlit.go.jp/kankocho/tokei_hakusyo/gaikokujinshohidoko.html`。どちらも 2026-10-07 に GET で 200 を確認) ではない。
  `[no-adoption-criteria]` の該当は現在 8 件 (延べ宿泊者数・外国人・稼働率・航空・訪問者数・回答数・2 種の消費額・空港数のうち primary・secondary)。
  context に下げる 2 件を除く 6 件 + 新規 1 件に採用基準を書く。
- 件数を固定した検査を同じ変更で合わせる: 調査の紐付け ratchet (`.claude/config/survey-taxonomy-ratchet.json`) の現在の下限は
  指標カード 446・図 53。カード 5 枚を外し 2 枚を 1 枚にまとめ 1 枚を足すので 446 → 441 を見込み、図 2 枚を外すので 53 → 51 を見込む
  (実装時の base の値で再計算し、`themeBaselineFollowUps` に外した key と理由を記録する)。baseline (`update-theme-catalog-baseline.ts`)・
  依存ミラー (`generate-theme-dependency-mirror.ts --check`) も合わせる。
- 機械で数えた該当 (2026-10-07、`evaluateSelectionViewpoints` を tourism だけに絞って実行): `card-chart-duplicate` 2 件、
  `single-year-as-trend` 5 件 (`candidate-26-1`・`26-2`・`27-1`・`27-2`・`85-1`)、`owned-elsewhere` 1 件 (JR 旅客)、`selection-evidence` 8 件。
  本書の実装後は `card-chart-duplicate` 0、`single-year-as-trend` 0 (比較カード化と card 外しで)、`owned-elsewhere` 0、`selection-evidence` 0 を目標にする。
- 検証: `npm run generate:catalog` / `validate:catalog` (error 0、warning を増やさない) / `validate:years` / `validate:config` / 対象テスト / 型検査 /
  `npm run preflight:pr` / localhost の 5 幅確認 (`node .claude/scripts/themes/capture-theme-page.mjs tourism`)。
- デプロイ: tourism は 9 月の実験 `THEME-STRUCTURE-20260908-tourism` (changeType structure、開始 2026-09-11、d28 = 2026-10-09、d56 = 2026-11-06) が進行中。
  図 2 枚と章 2 つを外す構成変更はこの実験の観測を混ぜるので、local-economy などと同じく d56 の観測後に、R2 の page-components・観測値と同時に出す
  (`THEME-CATALOG-OPT-RELEASE-01` に含める)。それまでは localhost で確認するだけにとどめる。

## 採用決定

**2026-10-07 にオーナーが承認した** (判断点 1〜7 はすべて推奨どおり。判断点 7 は「判定日を待たずに出す」に変更)。
実装は develop (PR [#1100](https://github.com/uruhayato373/stats47/pull/1100)、develop → main)。

- 指標: 客室稼働率を primary にして 2009〜2024 年へ、ホテル営業施設数を 1997〜2017 年へ広げた。実宿泊者数 (`actual-overnight-guests`) を新規に登録して secondary にした。
  訪問回答数と空港数は context に下げ、JR 旅客は外して `rejectedCandidates` に残した。実在年の記録は `data/estat/year-coverage/queue.json`。
- 図・カード・章: 図 3 → 1、カード 11 → 6、章 8 → 6 (表 2 のとおり)。客室稼働率の説明に、2010 年 4 月からの調査対象の拡大
  (観光庁「宿泊旅行統計調査の概要」で確認) と 2020〜2022 年の落ち込み (都道府県の中央値 2019 年 66.2％ → 2020 年 42.3％、e-Stat で確認) を書いた。
- 選定根拠: primary・secondary の 8 指標を `/backfill-theme-selection` の gate (引用の逐語一致・URL の 200) に通して書いた (8 件すべて通過)。
  出典は観光白書・観光立国推進基本計画 (第5次)・宿泊旅行統計調査・インバウンド消費動向調査・旅行・観光消費動向調査。
  role の推奨 2 件は `reference/audits/2026-10-08-selection-backfill.md` に残し、変えていない。
- 件数基準: `theme-catalog-baseline.json` の図 68 → 65 (2 テーマ計)、調査紐付けの下限は metric groups 446 → 441・図 53 → 51
  (`survey-taxonomy-ratchet.json` の `themeBaselineFollowUps` に外した key と理由を記録)。`no-adoption-criteria` の warning は 2 テーマ計で 267 → 250。
- 公開: main へのマージ後に page-components を R2 へ反映し、年を広げた 2 指標と新規指標の観測値を `data-refresh` で取り込む。
