---
type: theme-catalog-review
date: 2026-10-06
status: implemented-pending-release
theme: fishery-marine
supersedes: 2026-07-13-theme-fishery-marine.md
tags: [theme-catalog, fishery, aquaculture, metrics, charts, sections]
---

# テーマレビュー: fishery-marine（漁業・水産業） 2026-10-06

## 結論

現行ページの図 5 枚のうち 4 枚は、直上の指標カードと同じ指標を描き直している。カードはチェックした指標の推移を折れ線で描く
(1 指標のカードも推移の小さな折れ線を持つ) ので、この 4 枚を外しても読める情報は減らない。
代わりに、量のカードを「合計」「海面」「内水面」の 3 段に分け、合計とその内数を同じ折れ線に重ねない形にする。
産出額の「（新）」「（旧）」という表示名を、対象と期間が分かる名前に変える。

検索需要の中心は魚種別 (とくにカツオ) だが、魚種別 12 指標は 2015 年で止まっている。e-Stat には 2017〜2023 年の
都道府県別・魚種別の表があるので、データを更新してから魚種の章を作る (この提案では章を作らず、更新を backlog に起こす)。
新しい描画型と新しい指標の投入は要らない。

2026-07-13 版 (`2026-07-13-theme-fishery-marine.md`) の対象範囲の論点 (合計と内数、内陸県の対象外、産出額の系列断層、
就業者の 5 年周期、魚種の鮮度) は引き継ぐ。章とカードの導入後の構成を前提にしていないため、本書が置き換える。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主読者 | 「漁業が盛んな県」「漁獲量 ランキング 都道府県 最新」で探す人。自分の県や旅行先の水産業の規模を全国と比べたい人 |
| 主問 | この県の水産業は、捕る漁業と育てる漁業 (養殖) のどちらで、海と川・湖のどこで、どれだけの量と金額を生み、担い手はどう変わってきたか |
| 比較軸 | 地域差 (都道府県順位) と時系列 (1975〜2023)。内訳は漁獲/養殖 × 海面/内水面 |
| 誤読リスク | 合計と内数を同じ折れ線に重ねると二重に見える。海のない県の海面の値は対象外で 0 ではない。産出額は名目額で魚価を含み、2016 年までと 2017 年からで対象が違う。漁業就業者は 2003 年まで毎年、以後は 5 年ごとの漁業センサス。魚種別は 2015 年まで |
| baseline (GSC 2026-W40, 28 日) | `/themes/fishery-marine`: クリック 1、表示 199、CTR 0.50%、平均掲載順位 8.52 (`gsc-improvement/reference/snapshots/2026-W40/pages.csv`) |

検索需要の補足 (同 snapshot の `queries.csv`): テーマの主問に近いのは「漁業 が 盛ん な 県 ランキング」(表示 103、順位 9.68)、
「漁獲量 ランキング 都 道府県 最新」(41、10.07)。カツオ関連は 121 クエリで計 2,077 表示あり、主な着地は 2015 年データの
ブログ `blog/bonito-catch-prefecture` (表示 5,880)。魚種ランキングのページはサンマ 612・イワシ 530・サバ 426・カツオ 214・
マグロ 202・スケトウダラ 149 表示。どれも 2015 年の値を見せている。

## 現行の構成 (2026-10-06、`data/themes/catalogs/fishery-marine.json`)

| 順 | 章 (key) | カード (metricGroups) | チャート |
|---|---|---|---|
| 1 | 漁獲と養殖の供給 (`catch`) | 漁獲量・養殖収獲量・海面漁獲量 (1 枚) | 漁獲量と海面漁業漁獲量の推移 |
| 2 | 養殖の海面・内水面構造 (`aquaculture`) | 海面養殖・内水面養殖 (1 枚) | 海面・内水面養殖収獲量の推移 (二軸) |
| 3 | 産出額と担い手 (`output-workers`) | 「産出額（新）」/「漁業就業者」(各 1 枚) | 産出額（新）の推移 / 海面漁業産出額の長期推移 / 漁業就業者数の推移 |

指標 23 件 (primary 2・secondary 5・context 16)。primary・secondary の `selection` は 7 件とも定型文で、一次資料の裏付けが無い。

## 表 1: 現行指標

role・表示名を変えるものだけを書く。ここに無い指標は現状維持 (keep)。

| rankingKey | 現行 | 提案 | 年 | 理由 |
|---|---|---|---|---|
| `inland-fishery-catch` | context | **change-role → secondary** | 2000〜2023 | 新しい「内水面」カードに入れる。内水面養殖と対にして、川・湖の生産を海と分けて読む |
| `marine-fishery-aquaculture-output-value` | primary「産出額（新）」 | keep。**表示名 →「海面漁業・養殖業産出額」** | 2017〜2023 | 「新」は読者に意味が通じない。対象 (海面漁業 + 海面養殖業) を名前で示す |
| `fishery-output-value` | context「産出額（旧）」 | keep。**表示名 →「漁業産出額（2016年まで）」** | 1975〜2016 | 2016 年で終わった系列であることを名前で示す |
| 魚種別 12 指標 (`fishery-species-catch-*`) | context | keep (context) | 1956〜2015 | 2015 年で止まっているので、カードや図に出さない。データ更新後に「主な魚種」の章で扱う (backlog) |
| primary・secondary 8 件 | 定型文の selection | **selection を一次資料で記入** | — | 海面漁業生産統計調査・内水面漁業生産統計調査・漁業産出額・漁業センサスの公式ページを開き、backfill の gate (`selection-backfill.mjs apply`) を通して書く。資料が見つからない指標は定型文のまま残す |

secondary は 5 → 6 件 (目安 3〜8)。

## 表 2: 現行チャート・カード・章

### チャート

| componentKey | 提案 | 理由 / 実装差分 |
|---|---|---|
| `theme-fishery-catch-trend` | **remove** | 漁獲量 (合計) と海面漁獲量 (その内数) の折れ線。直上のカードと同じ指標で、合計と内数を重ねる形でもある |
| `theme-fishery-aquaculture-mix` | **remove** | 海面養殖と内水面養殖の二軸図。同じ 2 指標が直上のカードにあり、二軸は規模の差を読み違えやすい |
| `theme-fishery-output-trend` | **remove** | 「産出額（新）」1 指標の折れ線。直上の 1 指標カードが同じ推移を描く |
| `theme-fishery-half-century` | **remove** | 漁業就業者 1 指標の折れ線。直上の 1 指標カードが同じ推移を描く |
| `theme-fishery-output-trend-marine` | keep | 海面漁業産出額の 1975〜2023 年。カードに無い長期の系列で、唯一残る図。sortOrder 50 → 10 |

外す 4 枚は evidenceTopics の `relatedChartKeys` からも外す (`aquaculture-supply-shift` / `fishery-workforce-continuity`)。
UI はこの参照を読まない。

### カード (metricGroups)

| key | 提案 | 内容 |
|---|---|---|
| `catch` | revise | 題「漁獲と養殖の供給」→「漁獲量と養殖収獲量」。rankingKeys から海面漁獲量を外し、漁獲量・養殖収獲量の 2 件にする (捕る/育てるの合計どうし) |
| (新) `marine` | **new** | 題「海の漁獲と養殖」。海面漁業漁獲量・海面養殖業収獲量。2 件とも初期チェック |
| (新) `inland` | **new** | 題「川・湖の漁獲と養殖」。内水面漁業漁獲量・内水面養殖業収獲量。2 件とも初期チェック |
| `aquaculture` | remove | 中身を `marine` / `inland` に分ける |
| `output-workers-1` | revise | 題「産出額（新）」→「海面漁業・養殖業産出額」 |
| `output-workers-2` | keep | 漁業就業者。章を移す |

どのカードも単位は 1 種 (トン・百万円・人) で、2 軸にならない。

### 章

| 順 | 章 | 提案 |
|---|---|---|
| 1 | 漁獲量と養殖収獲量 (`catch`、旧「漁獲と養殖の供給」) | 改題。カード `catch` のみ。説明は現行 (海のない県の値を 0 にしない) を残す |
| 2 | 海と川・湖の内訳 (`aquaculture`、旧「養殖の海面・内水面構造」) | 改題。カード `marine` と `inland`。説明「海面は海、内水面は川と湖の漁業・養殖です。海のない県は海面の対象外で、0 ではありません。」 |
| 3 | 漁業・養殖業の産出額 (`output-workers`、旧「産出額と担い手」) | 改題。カード `output-workers-1` と長期図。説明「海面漁業・養殖業産出額は 2017 年から、海面漁業だけの産出額は 1975 年からの系列で、対象が違います。どちらも名目の金額で、魚の価格の変動を含みます。」 |
| 4 | 漁業の担い手 (新 `workers`) | **新設**。カード `output-workers-2`。説明「漁業就業者数は 2003 年まで毎年、2008 年からは 5 年ごとの漁業センサスの値です。間の年は補っていません。」 |

章の key は変えない (ページ内リンクの anchor)。読み方・FAQ の章は現行に無く、本文を新しく書く必要があるので、この提案には含めない。

## 表 3: 不採用候補

| rankingKey / 候補 | reason | reconsider condition |
|---|---|---|
| `fishery-workers-coastal-offshore` | 沿岸・沖合・遠洋別の就業者だが 2003 年の 1 年だけ | 2008 年以降の漁業センサスの同じ区分が登録されたとき |
| `number-of-individual-fishery-management` | 個人漁業経営体数。1981〜2003 年で止まっている | 漁業センサスの経営体数 (2008 年以降) が登録されたとき |
| `fishing-port-count-by-type` | 漁港の種類別の数。2003 年の 1 年だけ | 水産庁の最新の漁港一覧から都道府県別の値が登録されたとき |
| `port-entry-vessel-count` | 漁港の入港実漁船隻数。2003 年の 1 年だけ | 同じ統計の新しい年が登録されたとき |
| 魚種別 12 指標をカード・図に出す | 2015 年で止まり、現在の水産業を表さない。値のある県も少ない (ホタテ 3 県・コンブ 4 県など) | 2017〜2023 年の魚種別データを登録したとき (backlog で起こす) |
| 漁獲量と就業者を 1 枚の図に重ねる | 単位と桁が違う (7 月版と同じ判断) | — |
| 産出額の 2016 年までと 2017 年からを 1 本につなぐ | 対象 (海面養殖を含むか) が違う (7 月版と同じ判断) | 同じ対象の系列が 1975 年から取れたとき |

rankingKey が実在する 4 件は catalog の `rejectedCandidates` にも記録した。

## 想定実装差分と検証

- 編集: `data/themes/catalogs/fishery-marine.json` だけ。生成物は `generate:catalog` で更新し、手編集しない。
- 生成物への影響: 図 4 枚の削除と sortOrder で `page-components/theme/fishery-marine.json` が、role・表示名の変更で
  `indicator-sets/fishery-marine.ts` が変わる。章とカードは generator を通らない。
- 図を外すので、件数を固定した検査 (baseline・依存ミラー・移行契約の fixture・調査の紐付け ratchet) を同じ変更で合わせる。
  ratchet は aging-society と同じく `themeBaselineFollowUps` に外した 4 図と理由を足す (調査の紐付けがある図だけ件数が動く)。
- 検証: `generate:catalog --check`、`validate:catalog` (fishery-marine の error 0、全体 warning を増やさない)、data-configs・web・ranking の対象テスト、
  型検査、`npm run preflight:pr`。localhost で 375 / 768 / 1024 / 1280 / 1440px を確認する。
- デプロイ: fishery-marine も 9 月の実験 `THEME-STRUCTURE-20260908-fishery-marine` (d56 = 2026-11-06) が進行中なので、
  aging-society と同じく d56 の観測後に、R2 の page-components と同時に出す (`THEME-CATALOG-OPT-RELEASE-01` に含める)。

## 採用決定

**2026-10-06 ユーザーが全項目を承認し、同日 branch `claude/theme-catalog-optimization` (PR #1085) に実装した (未デプロイ)。**

- 表 1〜3 のとおり実装した。primary・secondary 8 件の selection は backfill の gate を通して書いた
  (出典: 海面漁業生産統計調査・内水面漁業生産統計調査の概要、漁業センサスの概要、水産白書 参考資料 2-5)。
  fishery-marine の `[no-adoption-criteria]` warning は 7 件から 0 件になり、warning の基準値を 275 → 268 に下げた。
- 外した 4 図はどれも調査と紐付いた図なので、調査の紐付けの ratchet の下限を 59 → 55 にし、`themeBaselineFollowUps` に記録した。
- 魚種別データの更新は backlog `FISHERY-SPECIES-REFRESH-01`。デプロイは aging-society と一緒に `THEME-CATALOG-OPT-RELEASE-01`。
