# Geo分析コンテンツ標準

`/geo/*`、GeoAI、GIS掛け合わせ、空間分析を名乗るサイト・X・noteコンテンツの共通契約。
単一指標の都道府県順位をGeoへ言い換えず、**入力から結論までの空間的な根拠を読者が辿れること**を価値とする。

## 必須の証拠階段

Geo分析は次の順を欠かさない。最終ランキングだけを作って完了にしない。

1. `calculation-input`: 公式の入力レイヤーと版、地域粒度、SHA-256
2. `derived`: 代表点化、距離判定、包含判定など決定的な空間演算
3. `context-only`: 理解を助けるが計算に使わない補助レイヤー
4. `aggregate`: 途中artifactから導いた県別・市区町村別の結論
5. `conservation`: 途中artifactとaggregateの件数・合計・比率の一致

`context-only`は`usedInCalculation:false`を必須とし、本文・地図・管理画面で「計算不使用」と明記する。
AI/LLMは問い、説明、限界、導線だけを作り、距離・交差・集計・順位を計算しない。

## 公開ページの責務

`/geo/<analysis-slug>`をcanonical着地ページとし、次の順で構成する。

1. 問いと結論
2. 入力レイヤーの途中地図
3. 空間演算後の重ね合わせ地図
4. 保存則・coverage・手法の検算
5. 最終集計地図・表・比較
6. 補助レイヤー（計算不使用を表示）
7. 方法、一次資料、限界、関連分析

都道府県別の途中データは県単位で遅延読み込みし、全国の巨大GeoJSONを初期表示へ載せない。
Xは必ず該当stageを示す`/geo/<slug>/<NN>/<stage>`へ着地させる。ページ内の切替状態は
`/geo/<slug>?pref=<NN>&stage=<stage>`で共有できる。
一覧ハブ`/geo`や無関係なランキングへ直接着地させない。

## コンテンツの役割分担

| 媒体 | 責務 | 禁止 |
|---|---|---|
| Geoページ | 地図、途中artifact、検算、最終結論のcanonical | 最終順位だけ |
| ブログ | 問いの背景、読み方、地域差の解説 | Geoページの表を丸ごと複製 |
| note有料 | 再現手順、判断テンプレート、加工済みdeliverable | 公開ページの言い換えだけ |
| X | 1つの空間的発見からcanonicalへ送客 | ranking-card流用、`/geo`着地 |

有料化は「隠した結論」ではなく、再利用できる工程・テンプレート・データ辞書・判断支援に対して行う。

## SSOTとR2

- authored分析定義: `packages/data-configs/src/business-plan/m1.ts`等のgit TS
- 原典GIS: `gis/<provider>/<dataset>/<version>/...`
- 最終集計: `app/geo/<slug>/item.json`
- lineage: `app/geo/<slug>/manifest.json`
- 県別途中artifact: `app/geo/<slug>/pref/<NN>.json`
- 投稿台帳: `.claude/state/sns/posts.json`（store/agent経由のみ）

manifestは入力key・版・SHA・bytes、stage、出力SHA・件数、coverage、保存則結果を持つ。
手編集JSON、永続D1、管理画面独自stateをSSOTにしない。

## 機械Gate

- `spatial-cross`は計算入力2層以上、かつ都道府県より細かいgeometryを1つ以上持つ
- 47県分析はdetail/aggregateとも47/47。欠損を0で埋めない
- 入力・出力SHA、bytes、重複ID、座標範囲、artifact上限を検査する
- 距離境界、入力非破壊、保存則を純関数テストで固定する
- manifestなし、保存則不一致、context混入、canonical不在では公開・SNS生成を停止する
- 地図は県別遅延読込、凡例、単位、判定方法、誤読防止注記を必須とする

駅アクセスの正準コマンド:

```bash
npm run geo:build-station-access
npm run geo:audit-analysis
```

## 管理画面とagent境界

管理画面`/strategy`は分析定義、入力/補助レイヤー、stage、47県artifact、保存則、最大bytesを読み取り表示する。
生成、編集、投稿、予約、R2 push、子プロセス起動は持たない。

| owner | 責務 |
|---|---|
| `gis-curator` | 公式GISデータセットのメタ・版・geometry |
| `gis-pipeline-runner` | 原典取得・変換 |
| `geo-analysis-curator` | 分析定義、stage、lineage、保存則、サイト接続 |
| `r2-publisher` | 検証済みexact keyのR2反映 |
| `x-strategist` / `sns-renderer` | Geo専用draft・画像。計算しない |

正準skillは`/build-geo-analysis`、配信draftは`/operate-geo-content`とする。
