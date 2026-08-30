---
title: GeoAI事業M1実装仕様
type: implementation-spec
date: 2026-08-29
updated: 2026-08-30
status: active
related_backlog: null
tags: [geo, gis, population, x, note, analytics, admin]
---

# GeoAI事業M1実装仕様

## 0. 位置づけ

本書は、2026年9月（M1）に実際に動かす範囲を固定する実装契約である。戦略を増やす文書ではない。
型付きの実行正典は `packages/data-configs/src/business-plan/m1.ts`、運用確認はローカル管理画面
`/strategy`、公開サイトの実装は `apps/web/src/app/geo/` とする。

本書の自動承認範囲はローカル実装・テスト・投稿draft登録までである。初回3分析のR2 writeは
2026年8月29日のオーナー明示指示に基づき完了した。Geo X固有画像15枚のexact R2 writeは、画像是正の
明示指示に基づき2026年8月30日に完了した。本番deploy、X投稿、note公開、GA4 Admin設定は対象と
検証結果を提示し、対象差分ごとの明示承認後に行う。

## 1. M1の成功条件

| 面     | 成功条件                                                                 | 機械的な確認先                       |
| ------ | ------------------------------------------------------------------------ | ------------------------------------ |
| サイト | `/geo` と4分析が実装され、各分析で47都道府県の実データを表示             | `apps/web` test / type-check / build |
| 分析   | 入力地図、重ね合わせ、保存則、最終集計、県比較、出典、限界を1画面に持つ | `geo-analysis` test + artifact audit + ローカル表示 |
| X      | 15投稿がlintを通り、投稿の主張と一致する固有Geo画像・予定日時つきdraftとして台帳に存在 | `.claude/state/sns/posts.json`       |
| note   | 15商品が価格・記事key・本文有無・公開条件つきでカタログに存在            | note catalog validate                |
| 計測   | 閲覧、地図操作、県選択、比較追加を別イベントとして送る                   | analytics unit test + GA4台帳        |
| 管理   | 計画数と実登録数の差、本文有無、GA4登録待ち、公開ゲートを表示            | `http://127.0.0.1:4747/strategy`     |

## 2. 公開サイト

### 2.1 URLと検索露出

| URL                                   | 責務                                         | M1の検索状態      |
| ------------------------------------- | -------------------------------------------- | ----------------- |
| `/geo`                                | 4分析を束ねる地域分析ハブ                    | `noindex, follow` |
| `/geo/2050-population`                | 2050年人口分析の問い、地図、比較、方法       | `noindex, follow` |
| `/geo/population-land-price`          | 人口変化と住宅地地価の都道府県比較           | `noindex, follow` |
| `/geo/population-flood-risk`          | 人口メッシュと洪水浸水想定区域の重なり       | `noindex, follow` |
| `/geo/population-station-access`      | 駅800m圏と将来人口の都道府県比較             | `noindex, follow` |

4本の実分析は揃った。GA4登録・反映とthin-content監査が揃うまでは、グローバルナビとsitemapへ追加しない。
M1では直URLで品質を確認できる実画面を成果とし、検索indexを成果に数えない。

### 2.2 2050年人口分析

- 問い: 2020年から2050年の人口増減率には、どれくらいの地域差があるか。
- 指標: `future-population-change-rate-2050`。
- 粒度: 都道府県のみ。47件が揃わない場合は欠損を0にせず警告する。
- 出典: 国立社会保障・人口問題研究所「日本の地域別将来推計人口（令和5年推計）」。
- 表示: 正負の県数、全国中央値、最大差、地図、上位5、下位5、最大3県比較。
- 限界: 推計は将来保証ではない。人口規模と増減率を混同しない。県内の市区町村差は表さない。

2026年8月27日生成snapshotの照合では、東京都+2.50%、秋田県-41.59%、最大差44.09ポイント、
プラス1都、マイナス46道府県だった。画面の集計値はこの文章を固定値として使わず、R2値から毎回決定的に算出する。

### 2.3 横断分析3本

| 分析 | 配信snapshot | 検証済み入力 |
| ---- | ------------ | ------------ |
| 人口×地価 | `app/geo/population-land-price/item.json` | 人口のある1kmメッシュ177,791件、住宅地標準地点17,890件 |
| 人口×洪水 | `app/geo/population-flood-risk/item.json` | A31b原典ZIP 94件、洪水ポリゴン3,819,352件 |
| 人口×駅 | `app/geo/population-station-access/item.json` | 駅グループ9,080件、駅800m圏をメッシュ中心点で近似 |

3snapshotは47都道府県のcoverageを必須とし、欠損・重複・入力不足では画面をfail-closedにする。
原典GISとSHA-256 manifestは`gis/mlit-ksj/`、配信用の小さい分析結果は`app/geo/`へ分離した。

### 2.4 人口×駅の証拠階段（縦断実装）

`/geo/population-station-access`は、最終の都道府県ランキングだけでなく次の工程を同じ着地ページで公開する。

1. 都道府県を選び、2020年・2050年の1km人口メッシュを表示する。
2. S12駅形状から決定的に作った9,080駅代表点と、中心点が800m以内のメッシュを重ねる。
3. 県別のメッシュ数、人口合計、駅圏人口、比率を表示し、最終aggregateとの保存則を確認する。
4. その後に47都道府県の最終集計地図・表・比較を置く。
5. 駅別乗降客数は補助レイヤーとして表示するが、800m圏判定には使わない。

R2は`app/geo/population-station-access/item.json`（最終集計）、`manifest.json`（入力SHA・stage・quality）、
`pref/<NN>.json`（県別途中artifact）に分離する。47県artifactは合計約12MB、最大1.31MBで県単位に遅延読込する。
2026年8月30日の生成では人口メッシュ177,791件、駅圏メッシュ13,945件、保存則47/47がPASSした。

```bash
npm run geo:build-station-access
npm run geo:audit-analysis
```

Xは`/geo/population-station-access/<NN>/population|overlap|audit`へ着地させ、投稿で示した工程を初期表示する。
ブログは背景と読み方、note有料商品は再現手順・判断テンプレート・加工済みdeliverableを担当し、公開地図の
言い換えだけでは商品化しない。恒久契約は`.claude/rules/geo-analysis-standards.md`を正典とする。

### 2.5 市区町村・1kmメッシュの扱い

現行の指標configが提供するのは都道府県値だけである。M1画面で市区町村や1kmメッシュを表示したように見せない。
地域コード、境界年、coverage、集約方法、一次資料の利用条件が揃った後、別の品質ゲートで昇格する。

## 3. データモデル

`BusinessPlanM1ExecutionPlan` が次の関係を単一管理する。

```text
M1
├── routes[5]          /geo のURL・検索状態・受入条件
├── analyses[4]        kind・sourceLayers・spatialOperations・metricKeys・R2 key・caveat
├── xPosts[15]         Geo role・analysisIds・claimMetric・caption・UTM・Geo画像仕様
├── noteProducts[15]   articleKey・価格・読者成果・deliverable・公開条件
├── eventIds[4]        事業イベントから実装イベントへの参照
├── tasks[]            owner・成果物パス・完了条件
└── releaseGates[]     外部公開前に満たす条件
```

各`sourceLayer`は`calculation-input`または`context-only`を宣言し、`usedInCalculation`と矛盾できない。
途中artifactを持つ分析は`evidenceManifestKey`と`detailR2KeyPattern`を両方持ち、片方だけの定義をvalidatorが拒否する。

Authored設定はgit TS、ランキング観測値はR2、X投稿実績は`.claude/state/sns/posts.json`、
note本文はR2という既存境界を維持する。管理画面用の第三の台帳や永続DBは作らない。

## 4. X初回15投稿

15件の本文、型、予定日時、画像種別、UTM campaignは`BUSINESS_PLAN_M1_X_POSTS`で確定する。
ランキング投稿への退行を防ぐため、構成を`baseline=3 / spatial cross=9 / method=2 / decision=1`に固定する。
baselineは単一指標の入口、crossは人口×地価・人口×洪水・人口×駅を各3件、methodは空間演算と限界、
decisionは3分析の統合判断を担当する。一般の`post-x-batch`候補選定へGeoを混ぜない。
生成・検証・登録は次の順序を固定する。

```bash
npm run business-plan:render-m1-x-geo
node .claude/skills/sns/post-x-batch/scripts/lint-x-captions.cjs \
  --in .local/r2/sns/_queue/business-plan-m1-x.json
npm run business-plan:audit-m1-x-geo
node .claude/skills/sns/post-x-batch/scripts/register-drafts.cjs \
  --in .local/r2/sns/_queue/business-plan-m1-x.json --sync-draft
```

登録はdraftまでで、投稿ではない。各件は`geo-001-x-01`〜`geo-001-x-15`の固有keyを持つ。
画像は`GeoX-InsightCard`で1080×1350（4:5、Xフィード既定）として投稿別に生成する。地図を主役にし、
`GEO BASELINE / SPATIAL CROSS / METHOD / DECISION`、source layer、空間演算、claim metric、公式出典を
画像上で識別できるようにする。共通ranking-card、単純tile-map、未生成画像、47県coverage未達、2層未満の
spatial crossは失敗とする。隣接`source.json`に観測値snapshot SHAと画像SHAを記録し、監査時に再計算する。

2026年8月30日時点で15件すべてがlint PASSし、15個の固有Geo画像、`content_key`、予定日時、UTMを持つ
`draft`として登録済みである。管理画面でも15件すべてを`domain=geo`・role・analysis ID・claim metricつきで識別できる。外部への予約・投稿は
行っていない。

## 5. note商品15件

15商品は `.claude/scripts/note/catalog/data/stats47-note.ts` に有料draftとして登録する。
価格、記事key、読者成果、必要deliverable、制作開始条件はM1カタログで管理する。

`r2Body: false` は「商品企画と記事枠は登録済みだが、本文は未作成」を意味する。管理画面はこれを公開可能と
表示してはならない。本文、図、一次資料、再現テスト、公開前レビューが揃った商品だけ`r2Body: true`へ進める。
M1で本文制作を進める先頭2件は「IPSS将来人口を市区町村地図にする」と「地域コード結合の完全チェックリスト」。
ただし市区町村データ自体の品質ゲートを迂回しない。

2026年8月29日時点で15商品のカタログ登録と検証は完了し、本文は15件とも未作成である。
本文なしは管理画面で明示し、需要・データ・一次資料のgateを通らない13商品を一括量産しない。

## 6. 計測イベント

| 事業イベント      | GA4イベント           | 主要パラメータ                                              |
| ----------------- | --------------------- | ----------------------------------------------------------- |
| `geo-view`        | `geo_analysis_view`   | `analysis_id`, `analysis_slug`, `geography`, `data_version` |
| `map-interaction` | `geo_map_interaction` | 共通4項目, `interaction_type`, `area_code`                  |
| `region-search`   | `geo_region_select`   | 共通4項目, `area_code`                                      |
| `compare-add`     | `geo_compare_add`     | 共通4項目, `area_code`, `comparison_size`                   |

検索語や自由入力は送らない。コードとunit testが通っても、GA4カスタムディメンションの登録と24〜48時間後の
反映確認が終わるまでは`partially-measured`とし、未計測を0件として報告しない。
途中工程のタブ切替は`interaction_type=stage-population|stage-overlap|stage-audit`で既存イベントへ送る。

## 7. 管理画面

`/strategy` のM1実行ボードは、計画の自己申告ではなく次を実体と突合する。

- route: `apps/web/src/app/geo/**/page.tsx` の存在。
- X: `posts.json`の`platform=x`かつM1 `content_key`の状態別件数。
- Geo契約: role 3/9/2/1、source layers、spatial operations、claim metric、canonical landing、違反一覧。
- 証拠階段: 計算入力/補助レイヤー、manifest有無、stage、県別artifact数、保存則、最大artifact bytes。
- note: `NOTE_ARTICLES`にあるM1 `articleKey`、`r2Body`、`status`。
- event: 4事業イベントの`canonicalEvent`と`measurementStatus`。
- release: type-check/build、draft登録、本文gate、GA4登録、明示承認。

管理画面はローカル読み取りビューである。表示のために別stateへコピーせず、各SSOTを直接照合する。
API routeはGETだけとし、caption編集、draft登録、予約、即時投稿、dry-run、レンダ、R2 push、再生成、
子プロセス起動を持たない。実行は`/operate-geo-content`と各owner agent/skillに限定する。
M1ボードでは4分析、X 15件、note 15件、4イベントを個別行で確認し、ローカルPASSと外部操作待ちを分けて表示する。

## 8. 公開判定

M1ローカル完了後も、自動的に本番公開へ進まない。次をすべて満たし、差分と検証結果をオーナーへ提示する。

1. Web対象test、type-check、buildがPASS。2026年8月29日にローカル確認済み。
2. X 15件がlint PASSかつdraft登録済み。予約・投稿は未実行。ローカル確認済み。
3. note 15件がカタログ登録済み。本文なし商品は公開不可表示。ローカル確認済み。
4. GA4の登録待ち項目と、反映後に確認すべき探索条件が明示されている。外部設定待ち。
5. deploy、X投稿、note公開をどこまで行うかの明示承認がある。外部承認待ち。
