---
paths:
  - "apps/web/src/features/tsunami-exposure/**"
  - "packages/data-configs/src/theme-catalog/tsunami-exposure-*.ts"
  - ".claude/scripts/themes/{ingest-tsunami-exposure.mjs,lib/tsunami-*.mjs,__tests__/tsunami-*.test.mjs}"
  - "apps/web/src/features/earthquake-exposure/**"
  - "packages/data-configs/src/theme-catalog/earthquake-exposure-*.ts"
  - ".claude/scripts/themes/{ingest-earthquake-exposure.mjs,lib/earthquake-dbf.mjs,__tests__/earthquake-exposure.test.mjs}"
  - "apps/web/src/{app/geo,features/geo-analysis}/**"
  - "apps/remotion/src/features/geo-x/**"
  - "packages/gis/src/geo-analysis/**"
  - ".claude/{skills/gis,state/geo-scope,skills/sns/operate-geo-content}/**"
  - ".claude/agents/geo-analysis-curator.md"
---
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

## 商用公開Gate

- 全`calculation-input`を`datasets.ts`または各providerのライセンスSSOTへ解決する
- KSJは`license-policy.ts`で、元データpublic mirrorと公開構造化artifactの両方が許可された入力だけを使う
- `cc-by-4.0-partial`、`non-commercial`、未判定は、書面許諾IDまたは商用可ソースへの置換が無ければ
  `item.json / manifest.json / pref/*.json`、有料note、広告付きページ、SNS生成を停止する
- 公開ページと有料成果物にデータ名、提供者、個別ページURL、取得日、加工主体、適用限界を継承する
- 旧取得分に日時記録が無い場合は「初回取得日時未記録」と明記し、固定版・URL・SHAと今回の検証日時を別に示す。生成日・変換日・mtimeを取得日と偽らない。以後の取得処理は実取得日時を記録する。

`non-commercial`の非データベース空間演算結果には利用余地があるが、Geo bundleは県別JSONとlineageを
公開するため自動許可しない。画面だけを公開する設計へ縮退する場合も、事務局の書面回答を証跡化してから行う。

### J-SHIS県別加工集計の限定契約

`earthquake-population-exposure`は、NIED J-SHIS Y2024 / AVR / TTL_MTTLの
30年超過確率3%計測震度とKSJ m250r6-24の人口総数を直接結合する。
承認済み原典URL・版・SHA・bytesは`theme-catalog/earthquake-exposure-source.ts`で固定する。
J-SHIS利用規約§5により、原典そのまま・形式変換だけの再配布を行わず、原典ZIP/CSV・
メッシュ別地震動・結合行をpublic R2外に保つ。公開lineageは原典URL、版、SHA、実取得日時、
決定的処理、47県の震度帯人口と保存則を示す。既存KSJのpublic mirror Gateを緩和しない。

この分析の公開契約は`restricted-source-prefecture-aggregate`に限定する。
`app/geo/earthquake-population-exposure/{item,manifest,verification,pref/NN}.json`は
専用のstrict parserで47県、版、地域同一性、6震度帯、未接続人口、全国合計、source集合、
中間・最終SHAを検証する。未知のfield・raw mesh/geometry・原典public keyを拒否する。
県境では`県+SHICODE+MESH_ID`を人口行の同一性とし、格子番号のみの重複排除をしない。

読者の着地は既存テーマ`/themes/earthquake-exposure#earthquake-population`とし、
共通県選択に連動する順位なしの県別震度帯人口表と検算・再現情報を示す。
J-SHIS原図のブラウザ再現、県平均ハザード、安全順位、住宅曝露の完了扱いはしない。
この限定契約を既存のrank必須Geo snapshotへ偽の順位で押し込まない。
地図主体の汎用Geo契約への追加は、別途原典利用条件と再現可能な表示範囲を審査する。
正準取込は`node --import tsx .claude/scripts/themes/ingest-earthquake-exposure.mjs`。
`--write-local`は50個の検証済み公開集計artifactだけをlocal R2へ書き、外部書込みを行わない。

### 津波想定のファイル単位・部分地域契約

`tsunami-scenario-exposure`は`licensed-subset-scenario-exposure`契約に限定する。
`theme-catalog/tsunami-exposure-source.ts`の明示的な入力allowlistのURL・版・SHA・bytes・公開keyだけを許可し、
hazard入力は`redistributionAllowed: true`と`licenseEvidence[{url,sha256}]`を必須とし、`source.evidence`の原典receiptへ完全一致で接続する。
A40全体の`cc-by-4.0-partial`判定は変更しない。静岡のA40-16は当該版の公式ページとZIP内条件、
徳島2025-09-12は県公式個別datasetのCC BY表示に基づく。条件の異なる県・版の追加は再審査する。
各県の固定版・沿岸ごとの想定を別シナリオとして保持する。全国の共通地震・県安全順位へ集約しない。
原典内の最大包絡だけを使い、新旧版の重複は単純な最大深度で混合しない。

公開は`app/geo/tsunami-scenario-exposure/{item,manifest,verification,pref/<approved-pref>}.json`、
source.scenariosに登録し原典検証した県途中artifactと承認済み入力key、既存テーマ`/themes/tsunami-exposure#tsunami-scenario-exposure`をcanonical着地とする。
途中artifactは県+SHICODE+MESH_IDの人口行とP05原典順施設ID、代表点、深度帯判定を保持し、
県ごとの原表深度帯、原典非該当、明示的な未対象・未判定を原典総数へ保存する。人口は原典小数4桁を整数化して集計する。
全国選択は利用可能範囲の入口とし、未集計県の理由を0へ変換しない。
人口250m格子中心の近似、原典の秘匿合算、施設2022年、徳島の10m格子復元・時点間地殻変動補正なしを明記する。
津波避難施設数の既存カードとP05施設曝露を別母集団として扱う。PDF地図は複製せず公式リンクで参照する。
浸水深は県の原表区分を保持し、1〜3mを1〜2mと2〜3mへ推測配分しない。兵庫の南北沿岸は原典範囲の非重複を検査して結合し、2023年度以降のKSJ統合版は旧版との最大値合成をしない。東京都は島しょ11島の限定想定で、本土等の未対象と対象9町村内の非該当・未判定を別区分で保存する。9町村全域がモデル化されているとは扱わない。
未提供・参照対象外・事前連絡・許諾/版表示の不一致を県別coverageに保持し、未計算県や未対象域を0や安全判定へ置換しない。
この契約を既存rank必須Geoへ偽の順位で入れず、汎用Geo explorerの全県完了と判定しない。

### 土砂災害指定区域の県別許可契約

`population-landslide-exposure`はA33-25の許可済み46県に限定する。
`theme-catalog/landslide-exposure-source.ts`で県別原典SHA、版、許可一覧XLSXのSHAを固定し、
`assertLandslideSourcePublication`で一致する原典だけを採用する。京都府は商用利用不可のため
元データの取得・公開を行わず、県別行と詳細は対象外・nullを保持する。A33全体の
`cc-by-4.0-partial`規則は変更しない。全国表示の分母は「対象46県計（京都府除外）」とする。

2025年度版の指定面（県別更新日は原典に従う）、2020年調整済み人口、2022年P05施設を結合する。
原典人口の県・SHICODE・MESH_IDを保持し、県境を越える区域も探索する。人口中心包含、
格子全体包含・一部交差、行政施設・公的集会施設の包含を別々に計算する。現象間は和集合で
二重計上を避け、特別警戒面が警戒面の内側とは仮定しない。指定前区域と線だけの指定は
面演算から除外し件数を記録する。3箇所の形状修復と重複原典行の保持も証跡に残す。

正準取込は`.claude/scripts/themes/ingest-landslide-exposure.mjs`。`--write-local`時は
全原典の再計算、独立地点照合、47詳細（46観測・1対象外）、保存則とSHAの検証を必須とする。
表示用の簡略化・分割は演算後に行い、原典境界表示は対象viewportの全パートを取得する。
12パート・12MB上限を超えたら拡大を促し、先頭だけ表示して完全な境界と誤認させない。
施設地図段階は本分析にも許可する。配信736ファイル（596派生・140原典）は専用release gateで固定する。

## 公開ページの責務

原典GISの単体地図は `/geo/datasets/<dataId>`。公開判定は `datasets.ts` + `license-policy.ts` をreaderでも照合する。入口 `app/geo/layers/items.json` は軽量索引、配布ファイル一覧は `app/geo/datasets/<dataId>/item.json` に分離し、ブラウザには選択したファイルだけを渡す。原典の公開条件と実R2一覧から `export-geo-source-catalog.ts` で生成する。描画上限を超える地物は表示を間引いた旨と拡大操作を示し、未描画を不存在と扱わない。A31bの表示分割は `build-flood-view-files.ts` が原典SHA・想定最大規模entry・地物数保存を検証し、形状と属性を変更しない。公開済み元データとローカル生成物の本番反映は別に検証する。

GIS一覧と単体ページは `GeoSourceNavigation` を共有する。右レールには公開対象の全データを分野別の連番リストで掲載し、現在のGISと地図準備中を区別する。狭い画面では本文上部の開閉式一覧に置き換え、本文末尾に重複表示しない。データ取得失敗を「準備中」と誤表示しない。個別ページのURLを先に用意し、表示データが検証できたものから同じURLで地図を提供する。

単体GISの読み方・対象時点・範囲・注意点・属性の単位は `packages/data-configs/src/business-plan/geo-source-pages.ts` を版付き正典とする。進捗は `node --import tsx apps/web/scripts/audit-geo-source-pages.ts --ids <カンマ区切りID>` で `.claude/state/geo/source-pages.json` に記録し、人向け一覧を `.local/geo-source-pages/progress.html` に生成する。代表ファイルの応答・地物数・文字化け・属性・320/1440pxの描画と横はみ出しを検証し、内容や描画コードの変更後は古い確認済み判定を無効化する。ローカル確認は全区画保証や本番確認と扱わない。次の着手順と未完了条件は backlog の `GEO-SOURCE-PAGES-01` に置き、50件の状態をMarkdownへ複製しない。

`/geo/layers` は単体GISの入口。閲覧可能な表現は `packages/data-configs/src/business-plan/geo-layers.ts` が正典で、`/geo/layers/<layerSlug>` から県・属性・出典を確認し、同じ県の重ね合わせ分析へ進む。人口・住宅地抽出・駅代表点は検証済み県bundleから必要な項目だけを投影し、重ね合わせ判定を混入させない。登録メタ一覧は閲覧可能・商用公開可能を意味しない。洪水メッシュ判定を原典の浸水区域ポリゴンの代用として単体公開しない。

### 住宅地点×人口の契約

`population-land-price`は地価地点を同じ県の1km人口メッシュへ包含結合する。
`pointMeshIds`を元地点と同じ順序で保持し、未接続はnull。境界は配信用小数6桁座標で
`[西,東)×[南,北)`とする。新設標準地の対前年変動率は欠測。メッシュの2020年人口が正で
地価前年比がある地点だけを比較可能な分母にする。
主指標は「地価上昇かつメッシュ人口減少の地点数 / 比較可能地点数」。人口割合ではなく、
同じメッシュに複数地点があっても人口を重複加算しない。地価2025→2026と人口2020→2050の
期間差を明記し、将来地価・徒歩圏・投資適性を推定しない。
`source → source → spatial-operation → aggregate`の空間段階と地点対応を外すmutationで公開を拒否する。

### 洪水入力の完全性

ZIP名の河川区分（10=洪水予報河川・水位周知河川、20=その他の河川）と、ZIP内部の
災害規模（20=想定最大規模）は別の軸。両河川区分を必須とし、公式一覧と
`packages/gis/src/geo-analysis/flood-inputs.ts`の承認済み入力集合を完全一致で照合する。
件数だけ・県数だけ・保存則だけでは欠落を検出できない。入力集合、source段階の出力集合、
同メッシュ別区分の保存先衝突を生成・artifact監査・Web parserで拒否する。
重複区域は包含の和集合と最大深度区分で処理し、人口を二重加算しない。
巨大GeoJSONは`flood-source-reader.ts`で地物ごとに処理し、全体のbuffer化・JSON.parseをしない。
正準再生成は`npm run geo:build-flood-analysis`。原典取得・逐次解析の失敗時は配信bundleを書かない。

### 公共施設への距離

`population-public-facility-access`は2022年4月のP05-22全47県施設を対象に、行政施設（1〜3）と公的集会施設（4〜5）の最近傍を別々に求める。県境の外も探索し、同距離は原典ID順で固定する。人口は1kmメッシュ番号から復元した小数6桁格子中心を使用し、簡略化TopoJSONの退化形状から中心を求めない。
距離帯は500m以下、1km以下、3km以下、5km以下、5km超。各群内の人口合計を2020年・2050年ごとに保存する。500m帯は1kmメッシュによる粗い近似で、徒歩時間・利用資格・2050年の施設存続は推定しない。施設数は県内原典の件数、距離判定では県外の最寄りも含む。
施設の原典段階は`source/<NN>.json`、距離判定は`pref/<NN>.json`。Web共通explorerの`facilities`段階はこの分析だけに許可する。配信JSONのSHAは既存canonical形式（itemは2スペース、他はcompact、どちらも末尾改行）と一致させる。

### 読者の操作と導線

一覧`/geo`は問いと実データの地図カードを先に置く。プレビューは既存のmanifest・県別データ検証を通し、東京都本土（島しょ除外）を共通範囲でサーバー側の静的SVGへ変換する。境界は既存のNII/KSJ TopoJSONを再利用し、地名は検証済み駅データの奥多摩・八王子・新宿から取得する。境界と地名は位置の補助であり計算入力に追加しない。出典・版・加工・ライセンスを一覧に表示する。地図タイルを画像へ焼き込まず、取得失敗時は代替表示と分析リンクを残す。表示例の県・範囲・凡例を明記し、カードから同じ県の重ね合わせへ接続する。`PageShell`の右レールはxl以上で関連情報を表示し、狭幅では本文後へ積む。県別比較の入口は狭幅でも本文上部に残す。

共通`GeoSpatialEvidenceExplorer`で全分析の県選択、人口・重ね合わせ・検算を扱う。
Geo本文にはランキング用コロプレスを置かず、地点・メッシュ地図を主表示にする。県別表・比較は後段の補助とし、全国1位・47位を冒頭の結論にしない。
背景地図は`geo-basemap.ts`の地理院淡色タイルをリアルタイム取得する。計算入力・R2配布bundleには含めず、地理院出典リンク・重ね合わせ加工・小縮尺VMAP0出典を表示する。静止商品への焼き込みは別の利用手続判定が必要。
洪水地図は原典ポリゴンではなくメッシュ中心点の包含結果と明記し、原典の範囲形状と混同させない。
比較ページは別々の空間演算結果を県単位で並べる入口であり、住宅・洪水・駅の同時交差を示さない。
出典カタログは実際の分析入力・版・利用条件に限定し、取得在庫とライセンス是正台帳は管理用カタログへ置く。

`/geo/<analysis-slug>`をcanonical着地ページとし、次の順で構成する。

1. 問いと結論
2. 入力レイヤーの途中地図
3. 空間演算後の重ね合わせ地図
4. 保存則・coverage・手法の検算
5. 最終集計表・比較
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

- authored分析定義: `packages/data-configs/src/business-plan/geo-analyses.ts`の`GEO_ANALYSES`。サイトの分析追加と、`m1.ts`のSNS・有料商品キャンペーン対象は独立して管理する。
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
- 入力ライセンス未解決、public mirror禁止、公開構造化artifact禁止では生成・R2反映を停止する
- 地図は県別遅延読込、凡例、単位、判定方法、誤読防止注記を必須とする

駅アクセスの正準コマンド:

```bash
npm run geo:build-station-access
npm run geo:audit-analysis
```

公共施設の正準生成・監査は`npm run geo:build-public-facility-access`と`npm run geo:audit-public-facility-access`。後者は原典94入力SHA、79,532施設の変換、全177,791メッシュ×2群の全国最近傍、県・全国保存則を再検算する。Web配信は`GEO_ARTIFACT_ROOT=../../.local/r2/app/geo npm run test:run --workspace apps/web -- src/features/geo-analysis/lib/__tests__/geo-public-facility.integration.test.ts`で確認する。

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
