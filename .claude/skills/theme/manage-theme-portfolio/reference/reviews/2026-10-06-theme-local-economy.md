---
type: theme-catalog-review
date: 2026-10-06
status: proposal-ready
theme: local-economy
supersedes: 2026-07-11-theme-local-economy.md
tags: [theme-catalog, regional-economy, prefectural-accounts, industry]
---

# テーマレビュー: local-economy（地域経済） 2026-10-06

## 結論

このテーマの中心は「県の経済の規模と所得」だが、現行ページは県内総生産 (GDP) を 1 枚も出していない。
主役の 1人当たり県民所得も 2020〜2021 年の 2 年分しか登録されていない。e-Stat の同じ表には県内総生産額 (平成27年基準) が
2011〜2021 年、1人当たり県民所得 (平成27年基準) が 2012〜2021 年あり、登録済みの指標の `years` を広げれば 10 年前後の推移になる
(2026-10-06 に `getStatsData` で確認)。県内総生産額を主役に加え、2 指標の年を広げる。

あわせて、カードと同じ指標の図、2014 年までの事業所数だけの章、章の説明をそのまま繰り返す「数値を比較するときの注意」を外す。
1 年分しかない特化係数 3 件・付加価値 2 件は、指標 1 件ずつの別カードから、年を固定した比較カード
(`comparisonYear`。表・棒グラフ・タイル地図で 47 都道府県を見せる既存部品) にまとめる。新しい描画型は要らない。

2026-07-11 版 (`2026-07-11-theme-local-economy.md`) の主問と「GDP がコアに無い」という指摘は引き継ぐ。
その後の章の導入と 2026-09-09 の章追加 (特化係数・付加価値) を前提にしていないため、本書が置き換える。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主読者 | 「県民所得 ランキング」「都道府県 GDP ランキング」で探す人。自分の県の経済の大きさと所得の水準を全国と比べたい人 |
| 主問 | この県の経済はどれくらいの規模で、どの産業が支え、住民 1 人当たりの所得はどの水準か |
| 比較軸 | 地域差 (都道府県順位) と時系列 (県内総生産 2011〜、県民所得 2012〜、就業者比率 1975〜)。内訳は産業別の就業者・特化係数・付加価値 |
| 誤読リスク | 県内総生産は人口の多い県ほど大きい。1人当たり県民所得は企業の所得なども含み、個人の給与ではない。課税対象所得は納税者 1 人当たりで、全住民の平均ではない。基準年の違う系列 (平成17年・23年・27年基準) をつながない。特化係数・付加価値は 1 年分の比較 |
| baseline (GSC 2026-W40, 28 日) | `/themes/local-economy`: クリック 3、表示 179、CTR 1.68%、平均掲載順位 8.40 (`data/gsc/snapshots/2026-W40/pages.csv`) |

検索需要の補足 (同 snapshot の `queries.csv`): 「県民所得」を含む 22 クエリで計 229 表示 (「県民所得 ランキング」93 表示・順位 11.76 など)。
「gdp」または「県内総生産」を含む 81 クエリで計 247 表示 (「都道府県gdpランキング2026」「東京 一人当たりgdp」など。国全体の GDP の検索も含みうる)。
現行ページはどちらにも正面から答えていない。「可処分所得」を含む 15 クエリ計 388 表示は real-income テーマの主指標が受ける。

## 現行の構成 (2026-10-06、`data/themes/catalogs/local-economy.json`)

| 順 | 章 (key) | カード (metricGroups) | チャート |
|---|---|---|---|
| 1 | 所得形成の水準 (`income`) | 1人当たり県民所得 / 課税対象所得 (各 1 枚) | — |
| 2 | どの産業で働いているか (`industry`) | 「第1次産業就業者比率・第2次産業就業者比率」(中身は第1〜3次の 3 指標) / 農業産出額 | 産業別就業者比率の推移 (同じ 3 指標) |
| 3 | 事業所基盤の過去参考 (`establishments`) | — | 全産業事業所数の推移 (2009・2014 年の 2 点) |
| 4 | 産業別の雇用構成と特化係数 (`candidate-16`) | 特化係数 3 件 (各 1 枚、2021 年のみ) | 埋め込み「産業特化」 |
| 5 | 企業の付加価値と地域への配分 (`candidate-18`) | 付加価値 2 件 (各 1 枚、2020 年のみ) | — |
| 6 | 読み方と関連する仕事・財政 (`reading`) | — | 数値を比較するときの注意 / よくある質問 |

指標 19 件 (primary 1・secondary 10・context 8)。

## 表 1: 現行指標

| rankingKey | 現行 | 提案 | 年 | 理由 |
|---|---|---|---|---|
| `total-production-in-the-prefecture` (県内総生産額) | (テーマ外) | **追加 → primary** | 登録 2021 のみ。e-Stat は 2011〜2021 | 主問の中心。7 月版の最大の指摘。どのテーマにも入っていない |
| `per-capita-prefectural-income-h27` | primary | keep。**`years` を 2012〜2021 に広げる** | 登録 2020〜2021。e-Stat は 2012〜2021 | 同じ「1人当たり県民所得（平成27年基準）」の系列で 10 年分ある。設定の絞り込みを広げるだけで値は作らない |
| `per-taxpayer-taxable-income` | secondary | keep | 1985〜2024 | 所得の水準を別の分母で示す (章の注記どおり) |
| `minimum-wage-by-region` | context | **remove** | 2024 のみ | labor-wages の primary。地域経済の規模の主問から外れる |
| `active-job-opening-ratio` | context | **remove** | 2022 のみ | labor-mobility の primary |
| `unemployment-rate` | context | **remove** | 2000〜2020 (5 回) | labor-mobility の secondary |
| `fiscal-strength-index-prefecture` | context | **remove** | 1981〜2022 | local-finance の primary。自治体財政は別の主問 |
| `disposable-income-worker-households` | context | **remove** | 1975〜2024 | real-income の primary。世帯の手取りは別の主問 |
| `number-of-establishments-economic-census-basic-survey` | context | keep (context) | 2009・2014 | 章と図は外すが、全指標の一覧とランキングへの導線は残す |

外す 5 指標はどれも別テーマに主担当がある (上の「理由」)。このテーマの全指標の一覧から消えるだけで、ランキングページと主担当テーマには残る。
県内総生産額の `selection` は、実装時に内閣府「県民経済計算」の公式ページを開き、backfill の gate を通して書く。

## 表 2: 現行チャート・カード・章

### チャート

| componentKey | 提案 | 理由 / 実装差分 |
|---|---|---|
| `theme-industry-structure` | **remove** | 直上の就業者比率カードと同じ 3 指標の折れ線 (規約 §9) |
| `theme-le-establishments-trend` | **remove** | 2009・2014 年の 2 点だけの折れ線で、章の説明自身が「過去参考」と書いている |
| `md-local-economy-discussion` | **remove** | 本文 3 段落が、所得・産業・事業所の 3 章の説明文と一字一句同じ |
| `md-local-economy-faq` | keep | 本文は変えない (見直しは別作業) |

外す図は evidenceTopics の `relatedChartKeys` からも外す。UI はこの参照を読まない。

### カード (metricGroups)

| key | 提案 | 内容 |
|---|---|---|
| (新) `gdp` | **new** | 題「県内総生産額」。1 指標。年を広げたあとは 2011〜2021 年の推移を描く |
| `industry-1` | revise | 題を中身に合わせて「第1次・第2次・第3次産業の就業者比率」にする |
| `candidate-16-1〜3` | **merge** | 1 枚の年固定比較カード (key `candidate-16-1`、題「産業別の従業者特化係数（2021年）」、`comparisonYear: "2021"`) にまとめる。単位はどれも「倍」 |
| `candidate-18-1〜2` | **merge** | 1 枚の年固定比較カード (key `candidate-18-1`、題「全産業の純付加価値（2020年）」、`comparisonYear: "2020"`) にまとめる。単位はどれも「百万円」 |

### 章

| 順 | 章 | 提案 |
|---|---|---|
| 1 | 経済の規模と所得の水準 (`income`、旧「所得形成の水準」) | 改題。カード `gdp`・`income-1`・`income-2`。説明に「県内総生産額は県内で生まれた付加価値の合計で、人口の多い県ほど大きくなります。1人当たり県民所得は企業の所得なども含み、個人の給与ではありません。」を足す (現行の分母の注記は残す) |
| 2 | どの産業で働いているか (`industry`) | 重複図を外す |
| — | 事業所基盤の過去参考 (`establishments`) | **章を外す** (中身が上の図 1 枚だけ) |
| 3 | 産業別の雇用構成と特化係数 (`candidate-16`) | カードを 1 枚にまとめる。説明・埋め込みは現行のまま |
| 4 | 企業の付加価値と地域への配分 (`candidate-18`) | カードを 1 枚にまとめる。説明は現行のまま |
| 5 | 読み方と関連する仕事・財政 (`reading`) | FAQ だけにする |

## 表 3: 不採用候補

| rankingKey / 候補 | reason | reconsider condition |
|---|---|---|
| `per-capita-kenmin-shotoku-h17` / `-h23` (平成17年・23年基準の 1人当たり県民所得) | 基準年が違い、平成27年基準の系列とつなぐと水準が段差になる | 同じ基準で遡った系列が公表されたとき |
| `gross-prefectural-income-growth-rate-nominal-h23` など旧基準の成長率 | 2018 年までで、平成27年基準の現行系列と基準が違う | 平成27年基準の成長率が複数年登録されたとき |
| `gdp-growth-rate-pref-h27` (県内総生産の対前年増加率、平成27年基準) | `isActive: false` で 2020 年のみ | 有効化され複数年が登録されたとき |
| 1人当たり県内総生産 | rankingKey が無い。県内総生産額 ÷ 人口で作ると、県民所得と別の概念をもう 1 つ増やす | 公式の 1 人当たり系列を登録したとき |
| 外す 5 指標 (最低賃金・有効求人倍率・失業率・財政力指数・可処分所得) | 主担当のテーマがある (表 1) | このテーマの主問が雇用・財政を含む形に変わったとき |

rankingKey が実在する候補は、実装時に catalog の `rejectedCandidates` にも記録する。

## 想定実装差分と検証

- 編集: `data/themes/catalogs/local-economy.json` と、年を広げる 2 指標の metric config
  (`packages/data-configs/src/metrics/{total-production-in-the-prefecture,per-capita-prefectural-income-h27}.ts` の `years`)。
- metric config の年を広げても、R2 の観測値は自動では増えない。値の再取得と R2 反映 (data-refresh) が要り、これは本番反映と同じ承認で行う。
  反映まではカードが登録済みの年だけ (県内総生産は 2021 年の 1 点) を描く。
- 図を 2 つ外すので、件数を固定した検査 (baseline・依存ミラー・調査の紐付け ratchet) を同じ変更で合わせる。ratchet は `themeBaselineFollowUps` に記録する。
- 検証: `generate:catalog --check`、`validate:catalog` (error 0、warning を増やさない)、`validate:years`、`validate:config`、対象テスト、型検査、
  `npm run preflight:pr`、localhost の 5 幅確認。
- デプロイ: local-economy も 9 月の実験 `THEME-STRUCTURE-20260908-local-economy` (d56 = 2026-11-06) が進行中なので、
  ほかの 2 テーマと同じく d56 の観測後に、R2 の page-components・観測値と同時に出す (`THEME-CATALOG-OPT-RELEASE-01` に含める)。

## 採用決定

**現状: ユーザー承認待ち。** 承認前に catalog と metric config を編集しない。判断が要る点は次の 2 つ。

1. 表 1〜3 の変更 (特に、県内総生産額を primary に加えること、雇用・財政などの 5 指標を外すこと、事業所数の章と重複図を外すこと)
2. 県内総生産額と 1人当たり県民所得の `years` を広げる metric config の変更を、この PR に含めること (値の R2 反映はデプロイ時)
