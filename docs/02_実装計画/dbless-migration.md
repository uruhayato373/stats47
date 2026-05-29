---
type: migration-plan
date: 2026-05-29
status: active
canonical: docs/01_技術設計/19_完全DBレス設計.md
scope: 完全DBレス移行。Phase C(消費者/基盤)+SSD非依存=完了 / Phase B・E・F 残
tags: [architecture, dbless, migration]
---

# 完全DBレス移行 (統合)

> 2026-05-29 統合: 棚卸し(inventory) / 実行スペック(spec) / 残スクリプト再構築(rebuild) の3計画を1ファイルに集約。
> 正典アーキテクチャは `docs/01_技術設計/19_完全DBレス設計.md`。
> **現況**: Phase C(全消費者+基盤のDBレス化)+SSD非依存化は完了。**Phase B(正典改訂)/E(page_components)/F(server.ts削除・schema最終確定)が残**。
> 各セクション冒頭の `<!-- 元ファイル -->` で出自を保持。


---

<!-- 元ファイル: dbless-rebuild-plan-2026-05-29.md -->


## 完全DBレス 残スクリプト再構築プラン

### ★ 実装進捗 (2026-05-29 セッション、随時更新) — 再開時はここを最初に読む

すべて develop に commit + push 済。**全消費者 + 基盤 が DB レス完了** (2.1/2.2-pref/2.2b/2.3/2.4/2.5/2.6 + 基盤1/2)。
**さらに SSD 非依存化を完遂** (別プラン `quiet-forging-flurry.md` 柱1-3): 公開 R2 URL `storage.stats47.jp`
を突破口に、ビルド/再生成を **SSD・S3認証なし**で実行可能に。残デファーは無し (Phase E のみ別 scope)。

- 柱1: r2-storage に公開URL fetch tier (commit c738f4fc)
- 柱2: list 依存を git 列挙フォールバックに置換 (known-ranking-keys を packages/ranking へ移設, 7a3fd844)
- 2.2b city: 削除済 run-batch-city を R2 から再構築。6 spot city が cloud baseline と完全一致 (141e656c)
- 2.5 port: git TS master (administrator 込み) + R2 stats。years/by-port/by-year が baseline 完全一致 (f02e358a)
- 2.1 recompute: 計算可能な全計算型 ranking で rank 完全一致を検証 (b2324f2e)
- 柱3: wrangler push helper + SSD非依存 deploy 経路 (5ca45fed)

| ステップ | 状態 | commit/メモ |
|---|---|---|
| 基盤2 categories git TS (`packages/data-configs/src/categories.ts`) | ✅ 完了 | 17件 配信中と key/name/順序一致・tsc PASS |
| 基盤1 `listRankingItemsWithTagsFromR2` (`packages/ranking/.../read-ranking-items-snapshot.ts`) | ✅ 完了 | per-key item.json 走査・1992件(known-keys一致)・tsc PASS。**build時は NODE_ENV=development** |
| 2.1 calculate-ranking-values | ✅ D1 query 除去 | `findRankingItemByKey`→`readRankingItemByKeyFromR2`。recompute突合は exporter 配線後 |
| 2.3 export-blog (S) | ✅ 完了 (commit 2011ff3e) | frontmatter 直読み。196/196 slug が seed と一致、published 118 (seed117+sewerage公開化の正当差分)。欠落していた `app/blog/all.json` 復旧 |
| 2.6 render-sns-all (S) | ✅ 完了 | item.json `.item.visualization` から viz 読み、better-sqlite3 削除。66 SNS dir 全 colorScheme 解決・tsc 0 err (既存23 errは無関係) |
| 2.5 export-port-statistics (S) | ✅ 完了 (f02e358a) | port master を git TS 化 (`packages/area/src/data/ports.json`, 699件 administrator 込み, cloud all.json 由来) + port stats を R2 `app/stats/port-*/ports.json` から読む。D1 撤廃。**years.json (2010-2023) / by-port 01001 稚内 175行 / by-year 2023 2900行 が cloud baseline と完全一致**。throttle 撤廃で高速化。ヘッダコメントの `port-*/` が `*/` で早期コメント終了する bug も解消 (esbuild で検出, scripts は tsconfig 外) |
| 2.4 generate-search-index (M) | ✅ 完了 | ranking=基盤1 (item.json, demo/norm 保全) + description は git TS getMetricConfig 補完 / blog=2.3 all.json / categories=基盤2。**現行 production は ranking 0件の壊れた index だったのを 1992件に復旧**。demo 221・norm 113 が破壊前 baseline と完全一致。検索動作確認済 (人口109/中絶 ranking+blog/商業 demo表示)。npm script に react-server 条件 + 0件時の既存保持ガード追加。※orphan categoryKey "port"(9)/"labor"(1) は D1 でも NULL の pre-existing データ品質問題 (別件) |
| 2.2 area-profile 都道府県 (M) | ✅ 完了 | exporter を「D1 areaProfiles 読み」→「R2 から compute(基盤1+listRankingValues+buildAreaProfileRows)→profile.json 直接書き」に再配線。中間 D1 完全バイパス。**47000 沖縄が 2026-05-23 baseline と byte-for-byte 完全一致** (S162/W524 差分0) + 5県自己検証パス。run-batch(D1書込)は superseded→Phase F 削除 |
| 2.2b area-profile 市区町村 (M+) | ✅ 完了 (141e656c) | 削除済 `run-batch-city.ts` を R2 から再構築。city metric=`listMetricKeysByEntity("city")` / 観測値=R2 `app/stats/<m>/cities.json` (readStatsValues, prefectureCode 込み) / **rankPref=prefectureCode で group→全国 rank 昇順で県内連番** (削除済サービスを代替) / buildCityProfileRows (不変)。**6 spot city (札幌7/千代田4/大阪6/那覇3/横浜7/金沢9) が cloud baseline と完全一致**。壊れていた npm batch:city を export:city に置換 |

**先行 Phase C 完了済 (別 commit)**: remotion exporter 群 (load-prefectures git TS化, master/d1-client 削除), ges port-projects (ports.json git TS化)。
**未着手の大物**: Phase E = page_components の R2 運用基盤 (本プラン scope 外)。

### 0. 結論サマリ

調査6本のうち**4本が D1 破損**（calculate-ranking-values / export-blog-snapshot / export-port-statistics-snapshot / render-sns-all）、2本（generate-search-index は D1 依存だが論理は健全、area-profile は破損）。**最大の発見: 値の読み取り経路はすでに DBレス化済み**——`packages/ranking/.../list-ranking-values.ts` 等はすべて `readStatsValues`（`@stats47/stats-r2`）経由で R2 `app/stats/<metric>/values.json` を読む（調査JSONの「listRankingValues は D1」記述は誤り）。残る D1 依存は「**ranking-item メタの取得**（`findRankingItemByKey` / `listRankingItemsWithTags` = `getDrizzle()`）」「**blog/port メタの取得**」「**search-index の metrics/categories 取得**」「**SNS visualization 取得**」の4種に集約される。共通基盤1つ（**R2 item.json を SSOT とする ranking-item リーダ**）を作れば calculate-ranking-values と area-profile の2本がまとめて片付く。総effort: **基盤 S + 6本（S×4, M×2）= 実質 1.5〜2日**。エフェメラル `:memory:` SQLite は**どの6本にも不要**——全て pure JS（R2 JSON 読み + 既存 pure util）で完結する。

### 1. 共通基盤（先に作るべきもの）

#### 基盤1: ranking-item メタの R2 リーダ（`readRankingItemFromR2` / `listRankingItemsFromR2`）★最優先

- **提供するもの**: D1 `metrics` テーブルへの `getDrizzle()` 依存を持つ `findRankingItemByKey` / `listRankingItemsWithTags` の DBレス代替。R2 `app/ranking/<key>/item.json`（**2,205 ファイル実在を確認**）の `.item` フィールド（`rankingKey / areaType / calculation / visualization / categoryKey / latestYear / availableYears / isActive / tags / unit` を全保持）を読んで `RankingItem` 型に復元する。`listRankingItemsFromR2` は `ls app/ranking/` をイテレートし `isActive` でフィルタ。
- **使うスクリプト**: ① calculate-ranking-values（`getValues` の `findRankingItemByKey` 置換）、② area-profile run-batch（`listRankingItemsWithTags` 置換）。
- **実装方針**: pure JS。`item.json` は `{generatedAt, item:{...}}` 構造（`.item` にメタ。**top-level `.visualization` は null、メタは `.item.visualization`** に入る点に注意）。型は `packages/ranking/src/types` の `RankingItem` を再利用。ローカルは `.local/r2/app/ranking/<key>/item.json` 直読み、クラウドは `fetchFromR2AsJson` の2モード。
- **検証**: `listRankingItemsFromR2({isActive:true, areaType:"prefecture"}).length` が現行配信の active ranking 数と一致するか。

#### 基盤2: git TS categories マスタ（`packages/data-configs/src/categories.ts`）

- **提供するもの**: `categoryKey → {name, displayOrder}` の単一 TS ソース。現状 categories は D1 schema のみ（R2 には `app/categories/svg/*.svg` 16件しか無く JSON 無しを確認）。完全DBレス正典 §3「運用エンティティ = git TS が SSOT」に従い TS 化。
- **使うスクリプト**: generate-search-index（`metrics LEFT JOIN categories` の categoryName 解決 + meta の displayOrder ソート）、area-profile / item.json 生成系で categoryName が要る箇所。
- **実装方針**: 既存 `public/search-index-meta.json` の `categories[]`（17件・displayOrder順を保持）を初期値として TS 化（逆読みではなく**確定値を TS に固定**）。
- **検証**: TS の categories 配列が現行 `search-index-meta.json` の categories と key/order 完全一致。

> **不要と判断した基盤**: エフェメラル `:memory:` SQLite ビルダーは6本いずれも JOIN/集計を要さない（ranking計算は pure util、area-profileは filter+sort、他はメタ整形）ため**作らない**。正典§6で許容されているが、本6本には適用対象なし。

### 2. スクリプト別 再構築仕様

#### 2.1 calculate-ranking-values.ts（packages/ranking） — 破損 / effort M

- **現在読むもの（破損）**: `getValues()` が ① `listRankingValues`（**実は既に R2-native** = `readStatsValues`）→ ② `findRankingItemByKey`（**D1 `getDrizzle()` 依存・破損点**）→ ③ `fetchRankingValuesFromSource` + `cacheRankingValues`（後者 `upsertRankingValues` は**Phase 7 で no-op 化済**、warning log のみ）。
- **DBレス後の入力源**: 観測値 = R2 `app/stats/<metric>/values.json`（`readStatsValues` 既存・変更不要）。ranking-item メタ = **基盤1**（R2 item.json）。`per_capita` の分母 `total-population` も R2 から読む。
- **出力**: `RankingValue[]`（メモリ返却）。snapshot として永続化する場合は呼び出し側（exporter）が R2 `app/ranking/<key>/values.json`（`RankingValuesKeySnapshot` 構造、partitions[{yearCode,count,values[]}]）へ書く。
- **計算ロジック**: 3型（per_capita = 分子/total-population、ratio = 分子/分母、subtraction = 分子-分母）。すべて `computeCalculatedValues`（keyBy:"areaCode"）→ `rankByValue` の**既存 pure 関数**で完結。計算型の入れ子は `visited` Set で再帰（既存ロジック維持）。
- **推奨方式**: pure JS。`findRankingItemByKey` を基盤1に差し替えるのみ。③のオンデマンド e-Stat fallback は**削除**（DBレスでは observation populate は `/page-data-batch` に集約済、`upsertRankingValues` no-op が証拠）。
- **検証方法**: `calculation.isCalculated:true` の項目（実在確認: 例 `accountant-annual-income` formula="monthly*12+bonus"）から per_capita/ratio/subtraction 各1〜2件・計5件を再計算し、現行配信 `app/ranking/<key>/values.json` の partitions[].values[].rank と突合。**同順位タイブレークで ±1 rank の差は許容**、value は相対誤差 1e-6 以内。

#### 2.2 area-profile-snapshot.ts + run-batch-area-profile.ts（packages/area-profile） — 破損 / effort M

- **現在読むもの（破損）**: run-batch が `listRankingItemsWithTags`（**D1 `getDrizzle()`・破損点**）+ `listRankingValues`（**既に R2**）。exporter が D1 `areaProfiles` / `metrics` テーブルを読んで R2 へ。city 版は `build-city-profile-rows` 経由で cities を要する。
- **DBレス後の入力源**: ranking-item = **基盤1**。観測値 = R2 `app/stats/<metric>/values.json`（`listRankingValues` 既存）。cities マスタ = git TS `packages/area/src/data/cities.json`（KEEP 部品）。
- **出力**: R2 `app/areas/<areaCode>/profile.json`（47件）+ `app/areas/<pref>/cities/<city>/profile.json`（city版）。現行配信は `app/areas/` に47県 + cities 実在（2026-05-23付）。
- **計算ロジック**: 47県×全 active 指標を `areaCode→AreaRankingData[]` に集約 → `extractStrengthsAndWeaknesses`（strength≤5位 / weakness≥43位、rank=0除外）→ `computePercentile((47-rank)/(47-1)*100)` → strengths rank昇順・weaknesses rank降順ソート（**全て既存 pure util**）。
- **推奨方式**: pure JS。exporter を「D1 areaProfiles 読み→R2書き」から「run-batch が組んだ `AreaProfileData` を直接 R2 へ saveToR2」に再配線（中間 D1 テーブル `areaProfiles` を経由しない）。
- **検証方法**: 新計算 vs 2026-05-23 baseline の構造 JSON diff。スポット5県（01000北海道 / 13000東京 / 27000大阪 / 34000広島 / 47000沖縄）で strength≤5位・weakness≤5位・rank=0除外を確認。指標数の差分は「データ更新由来」として許容（logic 差でなければ documented diff）。

#### 2.3 export-blog-snapshot.ts（apps/web/scripts） — **破損（調査JSONの isBroken:false は誤り）** / effort S

- **現在読むもの（破損）**: 実コードは `BetterSqlite3` + `drizzle` で **D1 `schema.articles` を SELECT**（調査JSONが提示した「article.md frontmatter を読む版」は**現状ではなく提案コード**）。出力 R2 key = `BLOG_SNAPSHOT_KEY = "app/blog/all.json"`。
- **DBレス後の入力源**: R2 `.local/r2/app/blog/<slug>/article.{md,mdx}` の YAML frontmatter（**196 ディレクトリ実在を確認**、`app/blog/all.json` は**現状欠落**）。
- **出力**: R2 `app/blog/all.json`（`BlogSnapshot = {generatedAt, articles:SnapshotArticle[], tagMeta:SnapshotTagMeta[]}`）。
- **計算ロジック**: 各 slug の frontmatter を `js-yaml` で parse → `SnapshotArticle`（slug/title/seoTitle/description/published/publishedAt/tags/hasCharts 等）→ published 記事の tags 集計で `tagMeta` 生成・count降順。`tags` は `{tagKey}[]` 構造（既存 `SnapshotArticle` 型に合わせる、調査提案の `JSON.stringify` 文字列ではなく型準拠で）。
- **推奨方式**: pure JS。`BetterSqlite3`/`drizzle`/`LOCAL_DB_PATHS`/`schema` import を全削除、frontmatter 読みに置換。`saveToR2`（既存）維持。
- **検証方法**: 出力の `articles.length === 196`（実ディレクトリ数）、`published` 件数と `app/blog/<slug>/article.md` の frontmatter `published:true` 数が一致。生成後に `blog-snapshot-reader.ts` の `loadSnapshot()` が空配列 fallback せず読めること（=現在 `all.json` 欠落で本番 blog 一覧が空になっている可能性、本修正で復旧）。

#### 2.4 generate-search-index.ts（apps/web/scripts） — D1依存（論理健全） / effort M

- **現在読むもの**: D1 `metrics LEFT JOIN categories`（isActive=true, areaType="prefecture"）+ D1 `articles`（published=true）。出力 = `public/search-index.json`（MiniSearch ~267KB）+ `public/search-index-meta.json`（categories/blogTags/blogYears、現状17 categories/79 blogTags/2 blogYears）。
- **DBレス後の入力源**: metrics = git TS `listAllMetrics()` + `getMetricMeta()`（**`@stats47/data-configs` から export 済を確認**、`isActive` + `entities.includes("prefecture")` でフィルタ、`availableYearsJson`→`getMetricMeta().latestYear` に置換）。articles = R2 `app/blog/all.json`（**2.3 の出力に依存**）。categories = **基盤2**。
- **出力**: 既存2ファイル形式不変（MiniSearch serialized + meta）。本番への可視化影響なし。
- **計算ロジック**: ranking docs（git TS）+ blog docs（R2 snapshot）を `SearchDocument` 化 → MiniSearch index（tokenize/fuzzy/prefix 既存設定維持）→ meta 構築。
- **推奨方式**: pure JS。`drizzle`/`createDatabaseClient`/`schema` 削除、`listAllMetrics`/`getMetricMeta`/`fetchFromR2AsJson`/基盤2 に置換。
- **検証方法**: ranking docs 件数 = `listAllMetrics().filter(active && entities.includes("prefecture")).length` が旧 D1 query 件数と一致。blog docs 件数 = snapshot published 数。meta categories の order が現行 `search-index-meta.json` と完全一致。ローカルでクライアント検索が機能すること（sample query で結果返却）。**依存ゲート: 2.3 → 本スクリプトの順**（all.json が無いと blog docs が空）。

#### 2.5 export-port-statistics-snapshot.ts（apps/web/scripts） — 破損 / effort S

- **現在読むもの（破損）**: D1 `schema.ports`（メタ）+ **`schema.statsPort`（Phase 7 で DROP 済・破損点）**。出力 = `app/ports/all.json` / `app/port-statistics/years.json` / `by-year/<year>.json` / `by-port/<port>.json`。
- **DBレス後の入力源**: ports メタ = git TS `apps/ges/scripts/data/ports.json`（**699件・port_code/port_name/prefecture_code/prefecture_name/port_grade/latitude/longitude を確認**）。観測値 = R2 `app/port-statistics/by-year/*.json`（**2010-2023の14ファイル実在**）。
- **出力**: R2 `app/ports/all.json`（**現状欠落**）+ `app/port-statistics/years.json`（**現状欠落**）。`by-year`/`by-port`（699件実在）は**既存維持・再生成不要**。
- **計算ロジック**: ① ports.json を `fs.readFileSync`+`JSON.parse` → `PortMetaRow[]`（型 `snapshot-types.ts`）。② by-year/*.json をバッチ読みして year を降順集約 → `years.json`。③ `all.json` = `{generatedAt, ports[]}`。**D1 query 完全排除**。
- **推奨方式**: pure JS。`administrator` は ports.json に無い → `null`（型 nullable 既定義）。
- **検証方法**: ports.json 港数(699) = R2 `by-port` ファイル数(699・一致確認済)。`years.json` に `["2023"…"2010"]` 降順14件。フロント `load-port-data.ts` の `fetchFromR2AsJson` が `all.json`/`years.json` 取得成功。by-year/by-port は触らないので diff=0。

#### 2.6 render-sns-all.ts（apps/remotion/scripts/pipeline） — 破損（degraded fallback あり） / effort S

- **現在読むもの（破損だが try/catch fallback 有）**: D1 `.data/` の SQLite を `findD1Database()` で探し `SELECT key, visualization_config_json FROM metrics`。**失敗時はデフォルトカラースキームで継続**（line 497 の catch、ハード停止はしない）。data.json/ranking_items.json/caption.json は `sns/ranking/<key>/` から既存読み。
- **DBレス後の入力源**: visualization = R2 `app/ranking/<key>/item.json` の **`.item.visualization`**（colorScheme/colorSchemeType/divergingMidpointValue）。**調査JSON提案コードの `item.visualization` 直参照は誤り**——実構造は `JSON.parse(item.json).item.visualization`（top-level `.visualization` は null を確認）。
- **出力**: 変更なし（PNG stills + MP4、Remotion renderer）。
- **計算ロジック**: JOIN 不要。item.json から viz オブジェクトを読み props にセット。
- **推奨方式**: pure JS（`fs.readFile` で `.local/r2/app/ranking/<key>/item.json` 直読み、他 exporter と同パターン）。`better-sqlite3`/`findD1Database`/`loadVizConfigMap` を削除。viz 欠落時は colorScheme デフォルト fallback（現行 catch と同等の挙動を維持）。
- **検証方法**: 任意 ranking key で `npm run pipeline:sns --key <key>` を実行し PNG/MP4 出力。`.item.visualization.colorScheme` が旧 D1 `visualization_config_json` と同値か数件 spot-check（D1 が壊れている今は item.json が新基準）。レンダリング自体は data.json 依存で不変。

### 3. 実装順（依存順）

| 順 | 作業 | 検証ゲート |
|---|---|---|
| 1 | **基盤2** git TS categories.ts | search-index-meta.json と key/order 一致 |
| 2 | **基盤1** R2 item.json ranking-item リーダ | active count が現行配信と一致、型 round-trip OK |
| 3 | **2.6 render-sns-all** + **2.5 export-port** + **2.3 export-blog**（基盤1/2 と独立・並行可） | 各々の出力 R2 key 生成・フロント fetch 成功 |
| 4 | **2.1 calculate-ranking-values**（基盤1 依存） | 代表5キー再計算が現行 values.json と rank ±1 一致 |
| 5 | **2.2 area-profile**（基盤1 依存） | 5県スポットが 2026-05-23 baseline と構造一致 |
| 6 | **2.4 generate-search-index**（基盤2 + 2.3 の all.json 依存） | ranking/blog docs 件数一致、クライアント検索動作 |

各ステップ完了時に `npx tsc --noEmit -p apps/web/tsconfig.json`（+ remotion/ranking/area-profile の該当 tsconfig）で型ゲートを通す。

### 4. 検証戦略

- **前提**: SSD 接続（`.local/r2` symlink モード = `scripts/dev/local-r2-mode.sh ssd`）。観測値・現行 snapshot がローカルに揃う。SSD 非接続時は `fetchFromR2` の S3 fallback で読めるが、突合は SSD 接続で実施。
- **突合の基本形**: 「**再計算結果 vs 現行配信 R2 snapshot**」のファイル単位 diff。旧 D1 経路は壊れているため git diff 0 は目標にしない（正典の owner 判断どおり「R2 配信中 snapshot を正とみなす」）。
- **許容差の考え方**:
  - ranking values: rank はタイブレーク順で ±1 許容、value は相対誤差 1e-6 以内。
  - area-profile: 構造（strength/weakness 件数・rank閾値・rank=0除外）一致が必須。指標数の差は「データ更新由来」として documented diff で許容。
  - port/blog/search-index メタ: 件数（699 / 196 / active metrics数）と key 集合の一致を必須。`generatedAt` 等メタのみの drift は許容。
- **新規 key（all.json / years.json / blog all.json）**: 現行欠落のため「突合相手なし」→ フロントリーダ（`load-port-data.ts` / `blog-snapshot-reader.ts`）が空 fallback せず読めることを成功条件にする。

### 5. リスク・未確定・設計判断が要る点

1. **【要判断】ranking-item SSOT を item.json にするか git TS にするか**: 正典§3では metrics は「Reference = TS registry 再生成」。だが `item.json` は `calculation`/`visualization`/`tags` まで含み**完全DBレスの実用 SSOT として即使える**（2,205件実在）。短期は item.json リーダ（基盤1）、中期は item.json 自体を git TS から生成する経路に寄せるのが正典整合。**この二択を確定する必要あり**。
2. **【調査JSON 誤り訂正】** ① `listRankingValues` は**既に R2-native**（D1 ではない）→ ranking 計算の破損点は `findRankingItemByKey` のみ。② export-blog-snapshot の `isBroken:false` は誤り、**実コードは D1 articles SELECT で破損**。③ render-sns viz は `.item.visualization`（top-level ではない）。
3. **calculate-ranking-values の e-Stat fallback 削除**: 非計算型で観測値欠落時に旧コードは e-Stat 直叩き→`upsertRankingValues`（no-op）。DBレスでは observation populate を `/page-data-batch` に委ねる前提で fallback を削除するが、「欠落キーは空配列で skip」する挙動が area-profile の `emptyValueCount` に出るため、**欠落許容かビルド失敗かのポリシー確認**が要る。
4. **city profile の cities 源**: 旧 city-profile は D1 cities テーブル。git TS `packages/area/src/data/cities.json` に置換可だが、city profile の strength/weakness 計算に必要な city 観測値（`app/stats/<metric>/cities.json`）の網羅性は metric 依存。MVP では prefecture profile を先行、city は後続フェーズが安全。
5. **categories SSOT 重複**: 基盤2（git TS）と D1 categories schema が併存。Phase E（運用エンティティ git TS 化）で D1 schema 側を type-only に降格する整理が別途必要。
6. **generate-search-index の依存連鎖**: blog docs が `app/blog/all.json` 依存のため、2.3 未実行だと検索から blog が消える。CI/ローカルの実行順を `prepare-data` 内で固定すること（export-blog → generate-search-index）。


---

<!-- 元ファイル: dbless-spec-2026-05-29.md -->


## 完全DBレス 実行スペック (実参照検証済)

> 本スペックは棚卸し計画 `docs/02_実装計画/dbless-migration-plan-2026-05-29.md` の §2(DELETE)/§3(EDIT/MOVE)/§7(INVESTIGATE) を、`rg`/`grep` による実参照確認で検証・訂正した結果のみで構成する。推測値は含まない。SSOT = git TS(設定+運用エンティティ) + R2(観測値・配信)。Derived = エフェメラル計算(`:memory:` SQLite/DuckDB で R2 読み)→R2。永続/リモート D1 なし。schema 定義 `.ts` とエフェメラル計算の足場(adapter/client)は型ソースとして残置。

### 0. 検証で訂正された計画ミス

実参照確認の結果、計画の分類が誤っていた item を冒頭にまとめる。これらは計画文をそのまま実行すると CI 破壊・ランタイム失敗を招く。

| パス | 旧 verdict → 新 verdict | 訂正理由(実参照) |
|---|---|---|
| `packages/database/wrangler.toml` | DELETE → **KEEP** | `vitest.config.integration.ts:9` が `configPath: "./wrangler.toml"` で参照。integration test 基盤に必須。計画の「無効な test-db」は誤り(test-db binding 妥当性は別問題だが wrangler.toml 自体は削除不可)。**実参照確認済: configPath 1 件** |
| `.claude/skills/db/run-correlation-batch/SKILL.md` | DELETE(参照なし) → **DELETE(参照元 EDIT 必須)** | 計画の「参照なし」は誤り。`snapshot-exporter.md:15,25` が担当範囲/担当スキル表に明記、`recompute-correlations/SKILL.md:32` が旧 skill として言及。コード実参照は 0(docs のみ)だが、削除時は snapshot-exporter.md の改修を伴う |
| `.claude/agents/snapshot-exporter.md` | (未訂正) → **EDIT(Phase A で先行)** | 上記 run-correlation-batch 削除の参照元。`:15` 担当範囲行、`:25` 担当スキル表行の 2 箇所を recompute-correlations に置換する必要あり |
| `packages/area-profile/src/repositories/get-area-profile.ts` 他 area-profile repo 群 | DELETE → **KEEP(Phase C で exporter ごとエフェメラル化)** | 単純 DELETE 不可。exporter (`area-profile-snapshot.ts` 等) が getDrizzle 経由で参照。D1 read を `:memory:` 計算へ転換する責務分離が必要 |
| `packages/gis/src/mlit-ksj/scripts/register-ksj-rankings.ts` | INVESTIGATE → **EDIT(Phase E)** | D1 `gis_datasets` から `ranking_config` 読込後、metrics+stats を直書き。git TS migration 未実装。blast radius = GIS pipeline。計画は blast radius 明示不足 |
| `packages/estat-api/src/meta-info/repositories/d1/find-by-stats-id.ts` | INVESTIGATE → **EDIT(Phase D, 設計決定待ち)** | 実装が R2 移行途上。コメントと実装が矛盾(コメント「D1 は基本情報のみ」だが実装は D1 query)。R2 primary 化方針なら D1 query 削除可だが `estat_metainfo` table と連動確認必須 |
| `apps/web/scripts/export-affiliate-ads-snapshot.ts` / `export-themes-snapshot.ts` | EDIT(remote D1 対応 or DELETE) → **DELETE(Phase B 改訂待ち, 暫定 PENDING)** | 該当 6 エンティティが §3 で「リモート D1 SSOT」規定。Phase B(正典18改訂)未達なら git TS→R2→DBレス は不能。改訂確定まで EDIT(remote D1 対応)に倒れる |
| `.github/workflows/pr-quality-check.yml` (D1 Import Gate) | EDIT(gate 削除/限定) → **KEEP(変更不要)** | 現 gate 実装は既に正しい(`apps/web/src` に getDrizzle import 0 件を担保)。完全DBレス採用後のみ gate 削除可 |
| `package.json` (root) / `turbo.json` | (検証) → **KEEP(変更不要)** | root scripts に `db:` prefix なし(`db:studio` のみ drizzle-kit、他は `r2:`)。turbo.json に D1 task なし。**実参照確認済: D1 依存 0** |

**第3の発見(計画の過小評価)**: `packages/database/src/server.ts` 削除危険度。計画は「batch/exporter/test 依存のみ」と記載したが、実参照は **6 パッケージ(ai-content/area-profile/category/ranking/estat-api/database) 約 50 ファイル**が getDrizzle import 中。`apps/web/src` は 0 件(正)だが、全 exporter 層の D1 read が生きている。Phase C(exporter エフェメラル化)完全完了まで削除禁止。

### 1. INVESTIGATE の決着

実コードを読んで確定した結論。

| 問い | 結論(根拠) | 確定 verdict |
|---|---|---|
| **metrics SSOT は git TS registry か D1 か?** | `packages/data-configs/src/registry.ts`(AUTOGEN by `scripts/build-registry.ts`)+ `metric-meta.ts`(派生メタ)が SSOT。年範囲・entity list は全て TS enumeration(build-time)で確定。D1 `metrics` テーブルは read-only cache で置換不要。`findMetricByKeyAndAreaType` の **packages/ranking 外部呼び出し 0 件(実参照確認済)**。statistical values(observations)は R2(e-Stat→R2 direct)別系統。 | **metrics SSOT = git TS registry.ts。`find-metric-by-key-and-area-type.ts` は DELETE 確定(Phase D)** |
| **schema/migration(`drizzle/*.sql` 54 件)は schema `.ts` と一緒に削除か残置か?** | schema `.ts` を git 型ソースとして残す方針なら、drizzle.config.ts が schema から生成する migration は drizzle-kit coherence のため残置必須。integration test が migration 経由で schema 検証。blanket 削除は desync リスク。 | **CONDITIONAL_KEEP — §7 schema 残置決定に従う。schema `.ts` 残置なら migration も KEEP(Phase F で最終確定)** |
| **server.ts 削除は独立進行可か Phase D 完了が前提か?** | getDrizzle に約 50 の実 caller。Phase D/C が全 site の D1 依存を除去した後でなければ、削除はそれら module を runtime failure させる。 | **PHASE_DEPENDENCY 確定 — Phase C(exporter エフェメラル化)+ D 完了が server.ts 削除(Phase F)の前提** |
| **`apps/web/src` は本番実行時 D1 import が本当に 0 件か?** | `rg "getDrizzle\|@stats47/database/server" apps/web/src` = **0 件(実参照確認済)**。schema 型 import(ArticleRow 等)のみ。CI gate(pr-quality-check.yml)が担保。 | **CONFIRMED — apps/web/src 実行時 D1 import 0 件** |
| **e-Stat metadata(estat_metainfo)= API 再取得か D1 cache か?** | `find-by-stats-id.ts` の実装が R2 移行途上(コメントと実装が矛盾)。Reference meta は R2 primary 化推奨だが、当該ファイルの役割再定義必須。 | **e-Stat metadata = R2 primary。D1 cache は短期 KEEP→R2 完全移行後 DELETE。現状は find-by-stats-id を改修(R2 read 追加)、即削除見送り** |
| **GIS pipeline(ports/fishing_ports/gis_datasets)= SSOT か Reference か?** | `gis_datasets`(D1)= reference metadata(name/category/geometry_type/ranking_config)。`register-ksj-rankings.ts` が metrics+stats 直書き(廃止対象)。メタは git TS registry 化可能、観測値は R2。 | **GIS metadata = git TS registry 化予定(Phase E)。観測値は R2 直行** |
| **ports/fishing_ports snapshot(観測値 vs reference)?** | `export-port-statistics-snapshot.ts` が `stats`(entity_type=port)観測値を R2 化。ports/fishing_ports メタは Reference。script は package.json scripts 未記載(不活性化中)。`apps/ges/scripts/generate-port-projects.ts` が ports table(port_code/name/grade/lat/lng)を読む。 | **ports observation snapshot = MOVE_TO_EPHEMERAL(Phase C)。metadata table 保持。GES の ports SSOT 定義は別途確認(MLIT KSJ API が座標真実源か)** |
| **CI の db:pull/db:push は Phase C/D で削除可か?** | `data-refresh.yml:71,95` が「R2 から SQLite pull→e-Stat fetch→snapshot 再生成→push」のローカルビルド DB パイプラインに依存。R2+エフェメラルへ置換には全 Derived exporter のエフェメラル化が前提。 | **EDIT は Phase D 終了後(Phase E 手前)。現段階 KEEP** |
| **正典18改訂は全段階の前提か?** | 計画 §1 で「完全DBレス却下・6 エンティティはリモート D1 SSOT」明記。Phase E 関連全項目が contradictsCanonical=true。 | **CONFIRMED — Phase B(正典18改訂)がゲート。改訂なき場合 §1 該当項目は全て KEEP/EDIT(remote D1 対応)に倒れる** |

### 2. Phase別 実行スペック

DELETE は `confirmedDead=true`(実参照 0)のみ「即削除可」。参照ありの DELETE は「参照元改修を伴う EDIT」として分離する。

#### Phase A — 死蔵除去

| パス | finalVerdict | confirmedDead | realReferences | 検証コマンド |
|---|---|---|---|---|
| `.claude/skills/db/run-correlation-batch/SKILL.md` | DELETE(参照元 EDIT 必須) | コード=true, docs=参照あり | `snapshot-exporter.md:15,25` / `recompute-correlations/SKILL.md:32` のみ(コード実参照 0) | `rg 'run-correlation-batch' --glob '!**/node_modules/**' -l` → 結果が docs のみ確認済 |
| `.claude/agents/snapshot-exporter.md` | EDIT(先行) | false | `:15`(担当範囲)`:25`(担当スキル表)。run-correlation-batch を recompute-correlations に置換 | `grep -n 'run-correlation-batch\|recompute-correlations' .claude/agents/snapshot-exporter.md` |
| `.claude/hooks/check-local-db.js` | DELETE(即削除可) | **true** | **実参照 0 件**(plan doc のみ。settings.json hookup 未登録) | `rg 'check-local-db' --glob '!**/node_modules/**'` → plan doc のみ確認済 |
| `.claude/agents/r2-publisher.md` | KEEP | false | devops-runner/snapshot-exporter/data-ingester/README/sync-snapshots run.sh。DBレス後も R2 I/O 必須 | `grep -c 'r2-publisher' .claude/agents/README.md` |

**Phase A 完了ゲート**: `rg 'run-correlation-batch\|check-local-db' --glob '!**/docs/**' --glob '!**/node_modules/**'` が 0 件。snapshot-exporter.md の担当スキル表に run-correlation-batch が残らないこと。

#### Phase C — Derived エフェメラル化(`:memory:` SQLite/DuckDB で R2 読み→R2)

| パス | finalVerdict | confirmedDead | realReferences | 検証コマンド |
|---|---|---|---|---|
| `packages/area-profile/src/exporters/area-profile-snapshot.ts` | MOVE_TO_EPHEMERAL | false | `:28` getDrizzle 呼び出し。blast radius=snapshot build pipeline | `grep -n 'getDrizzle' packages/area-profile/src/exporters/area-profile-snapshot.ts` |
| `packages/area-profile/src/repositories/get-area-profile.ts`(+ list/replace 群) | KEEP→exporter ごと改修 | false | exporter から参照。fallback/batch 用途で単純 DELETE 不可 | `rg 'from.*@stats47/database/server' packages/area-profile/src -l` |
| `packages/ranking/src/services/calculate-ranking-values.ts` | MOVE_TO_EPHEMERAL | false | `server.ts` export, `fetch-ranking-values-on-demand.ts` で observation 参照 | `grep -n 'getDrizzle\|FROM observations\|FROM ranking_values' packages/ranking/src/services/calculate-ranking-values.ts` |
| `apps/web/scripts/export-blog-snapshot.ts` | MOVE_TO_EPHEMERAL | false | D1 articles(line 11 drizzle/better-sqlite3)→R2。md が真実源、再生成可 | `grep -n 'drizzle.*better-sqlite3' apps/web/scripts/export-blog-snapshot.ts` |
| `apps/web/scripts/export-ranking-page-cards-snapshot.ts` | MOVE_TO_EPHEMERAL | false | D1 ranking_items(line 13)→R2。metric registry + R2 ranking-value で計算可 | `grep -n 'const rows = await db' apps/web/scripts/export-ranking-page-cards-snapshot.ts` |
| `apps/web/scripts/generate-search-index.ts` | MOVE_TO_EPHEMERAL | false | D1 metrics/articles(line 13)→MiniSearch JSON。git TS registry + R2 article meta で再生成可 | `grep -n 'drizzle.*d1' apps/web/scripts/generate-search-index.ts` |
| `apps/web/scripts/export-port-statistics-snapshot.ts` | MOVE_TO_EPHEMERAL | false | ports table(line 21)+ stats entity_type=port(line 31)読み。呼び出し元なし(package.json 未記載) | `grep -r 'export-port-statistics' package.json` |
| `apps/remotion/scripts/exporters/_shared/d1-client.ts` | DELETE(4 exporter 改修後) | false | **4 exporter import 実参照確認済**: station-passengers/migration-flow/population-yoy-47/master | `rg 'd1-client\|openD1' apps/remotion/scripts/exporters -l` → 5 件(client 本体 + 4 importer) |
| `apps/remotion/scripts/exporters/station-passengers.ts` | MOVE_TO_EPHEMERAL | false | `openD1()` + `loadPrefectures(db)` + `readLocalStatsValues()` | `grep -n 'loadPrefectures.*db' apps/remotion/scripts/exporters/station-passengers.ts` |
| `apps/remotion/scripts/exporters/population-yoy-47.ts` | MOVE_TO_EPHEMERAL | false | `openD1()` + prefectures table + `readLocalStatsValues()` | `grep -n 'loadPrefectures' apps/remotion/scripts/exporters/population-yoy-47.ts` |
| `apps/remotion/scripts/exporters/migration-flow.ts` | MOVE_TO_EPHEMERAL | false | `openD1()` + `loadPrefectures(db)` + `readLocalMigrationFlow`/`readLocalStatsValues` | `grep -n 'openD1\|loadPrefectures' apps/remotion/scripts/exporters/migration-flow.ts` |
| `apps/remotion/scripts/exporters/master.ts` | MOVE_TO_EPHEMERAL | false | `openD1()` prefectures 直 SELECT。cities.json scope 外コメントは残置可 | `grep -n 'db.prepare.*prefectures' apps/remotion/scripts/exporters/master.ts` |
| `apps/ges/scripts/generate-port-projects.ts` | MOVE_TO_EPHEMERAL(要 INVESTIGATE) | false | `new Database`(line 130)+ DB_PATH(line 32-35)。ports SSOT 定義未確認 | `grep -n 'new Database' apps/ges/scripts/generate-port-projects.ts` |

**Phase C 完了ゲート**: `cd apps/remotion && npx tsc --noEmit` green。全 exporter が `:memory:`/R2 read 化され `rg 'getDrizzle\|openD1\|new Database' apps/*/scripts apps/remotion/scripts/exporters` がエフェメラルアダプタ経由のみ。各 exporter 出力 JSON の diff が改修前後で一致。

#### Phase D — 観測値 metric の D1 除去(git TS registry 化)

| パス | finalVerdict | confirmedDead | realReferences | 検証コマンド |
|---|---|---|---|---|
| `packages/ranking/src/repositories/metric/find-metric-by-key-and-area-type.ts` | DELETE | **true** | `metric/index.ts:1` export 定義のみ。**packages/ranking 外部呼び出し 0 件(実参照確認済)** | `rg 'findMetricByKeyAndAreaType' --glob '!**/packages/ranking/**' --glob '!**/docs/**' --glob '!**/node_modules/**'` → 0 件確認済 |
| `packages/data-configs/src/metric-meta.ts` | KEEP | false | `data-configs/src/index.ts` export。getMetricMeta/listMetricKeysByEntity 複数呼び出し。metrics SSOT 基盤 | `grep -r 'getMetricMeta\|listMetricKeysByEntity' packages/ --include='*.ts'` |
| `.claude/skills/db/sync-metrics-cache/SKILL.md` + `packages/data-configs/scripts/sync-metrics-cache.ts` | DELETE(参照元 EDIT) | false | `data-ingester.md` §1/§3 担当スキル。impl は registry.ts walk→D1 upsert(SSOT が TS なら不要) | `grep -n 'populate-component-data\|sync-metrics-cache' .claude/agents/data-ingester.md` |
| `.claude/skills/db/generate-known-ranking-keys/SKILL.md` + `apps/web/scripts/generate-known-ranking-keys.ts` | EDIT | false | 出力 `apps/web/src/config/known-ranking-keys.ts` を `url-policy.ts`/`indexable-ranking-keys.ts` が参照(実参照確認済)。DELETE 不可 | `rg 'known-ranking-keys' apps/web/src -l` → url-policy.ts/config 2 ファイル確認済 |
| `.claude/scripts/db/verify-d1-integrity.mjs` | EDIT | false | `verify-d1-integrity/SKILL.md` から呼び出し。検証 tool 必要。better-sqlite3 直読→registry walk + R2 sampling へ | `grep -l 'verify-d1-integrity.mjs' .claude/skills/ --include='*.md'` |
| `packages/estat-api/src/meta-info/repositories/d1/find-by-stats-id.ts` | EDIT(設計決定待ち) | false | `estat_metainfo` table 連動。R2 移行途上。R2 read 追加で改修 | `rg 'findMetaInfoByStatsId\|FROM estat_metainfo' packages/ --glob '!**/docs/**'` |
| `.github/workflows/data-refresh.yml`(db:pull/push) | EDIT(Phase D 終了後) | false | `:71` db:pull, `:95` db:push。SQLite パイプライン依存。全 Derived エフェメラル化が前提 | `grep -n 'db:pull\|db:push' .github/workflows/data-refresh.yml` |

**Phase D 完了ゲート**: `find-metric-by-key-and-area-type.ts` 削除後 `npx tsc --noEmit -p apps/web/tsconfig.json` green。`generate-known-ranking-keys.ts` を registry walk 化後、出力 `known-ranking-keys.ts` の diff が 0。metrics 関連 D1 query が registry/R2 経由のみ。

#### Phase E — 運用 6 エンティティの D1 除去(Phase B 正典18改訂が前提)

> 全項目 contradictsCanonical=true。Phase B(オーナー正典18改訂判断)が未達なら、これらは KEEP/EDIT(remote D1 対応)に倒れる。改訂確定後に DELETE+registry 化を実行。

| パス | finalVerdict | confirmedDead | realReferences | 検証コマンド |
|---|---|---|---|---|
| `apps/web/scripts/seed-theme-page-components.ts` | DELETE(Phase B 後) | false | 実参照 0(直 import/呼び出しなし)。内部で `./theme-page-component-additions.ts` 参照 | `rg 'seed-theme-page-components' apps/web --glob '*.ts'` |
| `apps/web/scripts/seed-local-finance-page-components.ts` | DELETE | **true** | 実参照 0。手動 seed 専用 | `grep -r 'seed-local-finance' . --glob '!node_modules' --glob '!dist'` |
| `apps/web/scripts/export-page-components-snapshot.ts` | DELETE(統合) | false | 直 import 0(手動起動 script)。git TS→R2 の sync-theme-additions-to-r2.ts に統合 | `rg 'export-page-components-snapshot' . --glob '*.{ts,tsx,md}'` |
| `apps/web/scripts/export-affiliate-ads-snapshot.ts` | DELETE(改訂後)/EDIT(改訂なし) | false | 直 import 0。`AFFILIATE_ADS_SNAPSHOT_KEY` を `affiliate-ad-snapshot.ts:19-20` が参照。affiliate_ads が §3 リモート D1 SSOT 規定 | `rg 'AFFILIATE_ADS_SNAPSHOT_KEY\|affiliateAds' apps/web/src -A 2` |
| `apps/web/scripts/export-themes-snapshot.ts` | DELETE(改訂後)/EDIT(改訂なし) | false | 直 import 0。themes/theme_metrics が §3 リモート D1 SSOT 規定 | `rg 'themeConfigKeyPath' apps/web/src` |
| `.claude/skills/db/populate-component-data/SKILL.md` | DELETE(参照元 EDIT) | false | `data-ingester.md` §1/§3 のみ。component_data table 廃止に連動 | `rg 'populate-component-data' apps/web packages/ .claude --include='*.ts' --include='*.md'` |
| `.claude/skills/db/verify-component-data/SKILL.md` | DELETE(参照元 EDIT) | false | `snapshot-exporter.md` §3 表のみ(primary_agent)。hard code dep なし | `rg 'verify-component-data' .claude/ apps/ packages/` |
| `.claude/agents/data-ingester.md` | EDIT | false | §1/§3 に populate-component-data・sync-metrics-cache。devops-runner/README/estat-researcher 参照 | `grep -n 'populate-component-data\|sync-metrics-cache' .claude/agents/data-ingester.md` |
| `packages/gis/src/mlit-ksj/scripts/register-ksj-rankings.ts` | EDIT | false | `:33-40` D1 から is_ranking_target=1 取得・ranking_config 展開後 metrics+stats 直書き | `grep -n 'getDrizzle\|INSERT INTO metrics\|INSERT INTO stats' packages/gis/src/mlit-ksj/scripts/register-ksj-rankings.ts` |

**Phase E 完了ゲート**: page_components/themes/theme_metrics/affiliate_ads/categories/component_data の **R2 運用基盤(新規実装)**が稼働し、各 page が R2 から component config を fetch して SSR 成功。`next build` で該当ダッシュボードページが正常生成。seed:* / export-*-snapshot 削除後も R2 snapshot が git TS→R2 直接反映で再生成可能。

#### Phase F — schema/CI/docs 最終整理(完全DBレス確定後の最終段)

| パス | finalVerdict | confirmedDead | realReferences | 検証コマンド |
|---|---|---|---|---|
| `packages/database/src/server.ts` | DELETE(Phase C+D 完了後) | false | **約 50 ファイル × 6 パッケージ**で getDrizzle import(実参照確認済)。apps/web/src は 0 | `rg '@stats47/database/server\|getDrizzle' --glob '!**/node_modules/**' --glob '!**/.next/**' -l \| cut -d: -f1 \| sort -u` |
| `packages/database/src/index.ts` | EDIT | false | package.json `./server` export, server.ts re-export。schema export は残す | `grep -E 'export.*server\|export.*index' packages/database/src/index.ts packages/database/src/server.ts` |
| `packages/database/package.json` | EDIT | false | `./server` export, seed:* scripts, better-sqlite3/drizzle-kit devDeps。エフェメラル `:memory:` 設計確認後に判定 | `grep -A10 '"scripts"' packages/database/package.json \| grep seed` |
| `packages/database/drizzle/*.sql` (54 件) | CONDITIONAL_KEEP | false | drizzle.config.ts 生成、integration test が migration 経由 schema 検証。schema .ts 残置なら KEEP | `ls packages/database/drizzle/*.sql \| wc -l` |
| `packages/database/scripts/migrate-local.ts` | KEEP | false | package.json `db:migrate:local`。エフェメラル `:memory:` SQLite 使用時に必要 | `npm run db:migrate:local --workspace=packages/database` |
| `packages/database/seed/README.md` | KEEP(archives/ 移動可) | false | doc のみ、code import 0。canonical 確定後 archive | `find . -name '*.ts' \| xargs grep 'seed/README'` |
| `packages/database/wrangler.toml` | KEEP | false | `vitest.config.integration.ts:9` configPath(実参照確認済)。test 基盤 | `npm run test:integration --workspace=packages/database` |
| `apps/web/wrangler.toml` | KEEP | false | `:19` d1_databases(ローカル開発), `:73-78` 本番 binding 削除済コメント(実参照確認済)。バッチ実行に必要 | `grep -n 'd1_databases' apps/web/wrangler.toml` |
| `.github/workflows/pr-quality-check.yml`(D1 Import Gate) | KEEP→完全DBレス後 DELETE | false | `:39-65` apps/web/src D1 import 0 を担保。現実装は正しい | `grep -A20 'D1 Import Gate' .github/workflows/pr-quality-check.yml` |
| `.github/workflows/deploy-workers.yml` | KEEP→最終段で D1 権限除去 | false | `:84` D1 Edit 権限。本番 D1 削除済だが除去は最終段延期 | `grep -n 'D1' .github/workflows/deploy-workers.yml \| head -10` |
| `.claude/agents/db-schema-manager.md` | DELETE | false | devops-runner/README/blog-editor 参照。Phase F で担当 roles 全廃。参照元同時更新必須 | `rg 'db-schema-manager' .claude/agents/ .claude/commands/ --include='*.md'` |
| `.claude/rules/data-storage.md` | EDIT | false | `:3-6` 2026-05-29 ハイブリッド注記済(実参照確認済)。本体 D1 用語の読み替えが残る | `grep -n 'D1\|エフェメラル' .claude/rules/data-storage.md` |
| `.claude/rules/data-sqlite-ssot.md` / `local-environment.md` / `branch-workflow.md` | EDIT | false | data-storage.md/CLAUDE.md から参照。用語統一・エフェメラル読み替え | (各 grep) |
| `docs/01_技術設計/17_リモートD1ハイブリッド設計.md` | DELETE(archives/) | false | plan doc のみ参照(実参照確認済)。`18_データ層ハイブリッド設計.md` に統合済 | `rg '17_リモートD1' --glob '!**/node_modules/**'` |
| `docs/01_技術設計/14_Phase6_deprecation_log.md` | EDIT | false | plan doc のみ参照。Phase 7-10 残課題を本計画に置換 | `head -100 docs/01_技術設計/14_Phase6_deprecation_log.md` |

**Phase F 完了ゲート**: 全 workspace `npx tsc --noEmit`(apps/web/tsconfig.json + remotion + 各 package)green。`next build` で全 SSG ページ `○ Static` 維持(`.claude/rules/nextjs-ssg-preservation.md` 準拠)。`npm run test:integration --workspace=packages/database` green。`rg 'getDrizzle' --glob '!**/node_modules/**' -l` が schema/型ソース範囲のみ。

### 3. 実行順と依存

```
A (死蔵除去) ──▶ C (Derived エフェメラル化) ──▶ D (観測値 metric D1 除去) ──▶ [B: 正典18改訂判断] ──▶ E (運用6エンティティ D1 除去) ──▶ F (schema/CI/docs 最終整理)
```

- **A は独立先行可**: `check-local-db.js`(参照 0, 即削除可)、`run-correlation-batch`(コード参照 0, snapshot-exporter.md EDIT 同時)。リスク最小。
- **C が全体の律速**: server.ts に約 50 caller が getDrizzle import。C(全 exporter エフェメラル化)+ D を完了しないと F の server.ts 削除は runtime failure。remotion `d1-client.ts` 削除は 4 exporter 改修(prefectures→git TS, stats→R2 read)が前提で、順序は ① prefectures を `packages/area/src/data` or registry 化 → ② 各 exporter で git TS loader 置換 → ③ d1-client 削除。
- **D は metrics SSOT 確定済**(git TS registry.ts)で実行可能。`find-metric-by-key-and-area-type.ts` は外部呼び出し 0 で安全削除。CI の db:pull/push 改修は D 終了後(全 Derived エフェメラル化完了後)。
- **B(正典18改訂)が E のゲート**: E 全項目が contradictsCanonical=true。改訂なき場合、E 対象は全て KEEP/EDIT(remote D1 対応)に倒れる。
- **E は最大の新規実装を要する**: page_components/themes/theme_metrics/affiliate_ads/categories/component_data の **R2 での運用基盤(authoring→git TS→R2 配信、特に page_components のダッシュボード config 運用)**を新規構築する必要がある。単純な exporter 削除では完結しない。
- **F は最終段**: server.ts 削除・db-schema-manager agent 削除・docs 用語統一。schema `.ts` + migration + wrangler.toml(×2) + integration test 基盤は型ソース/テスト基盤として残置。

### 4. リスクと未確定

#### confirmedDead=false の DELETE 候補(参照元改修が必須、即削除不可)

- `run-correlation-batch/SKILL.md` — snapshot-exporter.md:15,25 を先に EDIT。
- `seed-theme-page-components.ts` / `export-page-components-snapshot.ts` / `export-affiliate-ads-snapshot.ts` / `export-themes-snapshot.ts` — Phase B 改訂が前提、改訂なしは EDIT(remote D1 対応)に変更。
- `populate-component-data` / `verify-component-data` SKILL — data-ingester.md / snapshot-exporter.md の担当表から削除。
- `db-schema-manager.md` agent — devops-runner/README/blog-editor の参照を同時更新。
- `packages/database/src/server.ts` — **約 50 caller(6 パッケージ)**。Phase C+D 完了が絶対前提。最大の削除リスク。
- `apps/remotion/scripts/exporters/_shared/d1-client.ts` — 4 exporter のエフェメラル化完了が前提。

#### 新規実装が要る項目

- **Phase C 全 exporter のエフェメラル計算基盤**: `:memory:` SQLite/DuckDB で R2 stats を読み込み JOIN→R2 出力。area-profile-snapshot(D1 JOIN)、calculate-ranking-values、blog/page-cards/search-index/port-statistics、remotion 4 exporter が対象。
- **Phase E の R2 運用基盤(最大)**: page_components のダッシュボード config を R2 で authoring/配信する仕組み。現在 D1 INSERT で管理されるチャート config を git TS→R2 直接反映へ転換する設計が未実装。
- **prefectures master の git TS 化**: remotion exporter が D1 prefectures を読むため、`packages/area/src/data` または registry への移行が必要。
- **register-ksj-rankings.ts の git TS migration**: GIS metadata(gis_datasets/ranking_config)の registry 化が未実装(Phase E)。

#### Mac/Cloudflare 認証が要る項目(ローカル実行/検証で必要)

- `npm run test:integration --workspace=packages/database` — vitest pool-workers が miniflare temp DB を起動(wrangler.toml KEEP 検証)。
- `data-refresh.yml` の db:pull/push 改修検証 — R2 S3 認証(`.env.local`)。SSD 非接続時は cloud fallback。
- `/push-r2` による R2 snapshot 反映 — Cloudflare R2 token(プロキシ制約時は wrangler CLI fallback)。
- remotion exporter の出力 diff 検証 — ローカル D1(Mac 内蔵)+ R2(SSD or cloud)両方へのアクセス。

#### 設計決定待ち(コードだけでは決着不能)

- e-Stat metadata(`estat_metainfo` / `find-by-stats-id.ts`)— R2 primary 化の最終判断(実装が移行途上で矛盾状態)。
- GES ports SSOT — `generate-port-projects.ts` の ports 座標真実源が MLIT KSJ API か D1 table か(`packages/gis/src/mlit-ksj` 確認要)。
- schema `.ts` + migration(54 件)の最終要否 — §7 の schema 残置決定に従う(残置なら migration も KEEP)。
- 正典18改訂(Phase B)— オーナー判断。これが E 全体のゲート。

---

### 5. セッション実行追記 (2026-05-29、実機検証)

実行時に判明した、spec 生成時点では未検出の事実。次セッションはこれを前提にすること。

#### 実行済 (feature/dbless-migration)
- **Phase B**: doc19 を新正典化、doc18 を superseded、CLAUDE.md §4 更新 (commit `9306daac`)。
- **Phase A**: `run-correlation-batch` skill 削除 + `snapshot-exporter.md` 参照を `/recompute-correlations` に置換。
- **Phase D (partial)**: `packages/ranking/src/repositories/metric/`(find-metric-by-key-and-area-type + index)をディレクトリごと削除。外部参照0・型チェック PASS。

#### ⚠️ 新発見: `generate-known-ranking-keys.ts` は既に壊れている
- 現行スクリプトは `SELECT ... FROM stats_prefecture` を実行するが、**`stats_prefecture` は Phase 6 で DROP 済**(local D1 の全テーブル確認で stats_* は存在しない)。つまりこのスクリプトは**今実行するとエラー**。コミット済 `apps/web/src/config/known-ranking-keys.ts` (1969 件) は 2026-05-22 の stale な生成物。
- **件数の乖離**: registry で `prefecture` を宣言する metric = **2169 件**、現行 known-keys = **1969 件**。差 200 = 「宣言あり・観測値未投入」。
- **DBレス版の正しい実装**: `listMetricKeysByEntity('prefecture')` ∩ `R2 app/stats/<key>/values.json` 実在、で観測値ありに絞る。単純な registry walk(2169件)に置換すると観測値なし 200 URL が 410 されず**空ページ/ソフト404 の SEO リスク**。
- **ブロッカー (重要・2026-05-29 実機確認)**: 検証に R2 stats データが要るが **R2 読み取りの両経路が断たれている**:
  - ローカル: **SSD 未接続**(`.local/r2` symlink が dangling、`app/stats` = 0 件)。
  - cloud: **S3 API が 401 Unauthorized**(`.env.local` の `R2_ACCESS_KEY_ID`(32桁)/`R2_SECRET_ACCESS_KEY`(64桁) は形式正常・endpoint も正常だが**トークン失効/無効**)。
  - → known-keys 再生成・Phase C の diff 検証・Phase E の検証は **R2 アクセス復旧まで実行不能**。復旧手段: (a) SSD 接続、または (b) Cloudflare で R2 S3 API トークン再発行 → `.env.local` 更新。
- **意味判断**: 旧クエリの `is_active=1` フィルタは registry に対応フィールドが無い。DBレスでは「R2 観測値の実在」を唯一の基準にする想定 (is_active は廃止)。

#### Phase D の進捗 (2026-05-29、SSD 接続後)
- ✅ **known-ranking-keys: 完了**。SSD 接続で R2 アクセス回復 → `generate-known-ranking-keys.ts` を DBレス版
  (R2 `app/ranking/<key>/item.json` の areaType=prefecture & isActive、generateStaticParams と同源)に書換・再生成。
  **1969 → 1992 件** (+24: stale で 410 されていた有効ページ復活 / -1: per-taxpayer-taxable-income は
  areaType=city に変更済で prefecture ルート不可)。tsc PASS。commit 済。
- ⚠️ **known-tag-keys: 保留 (taxonomy 設計判断が必要)**。`generate-known-tag-keys.ts` も破損
  (`SELECT tag_key FROM tags` だが `tags`/`taggings` テーブルは D1 に存在しない)。known-ranking-keys と違い
  **R2 にタグ snapshot が無く**(`app/tag*` なし)、旧 D1 `tags` マスタ (327件) の DBレス上の置き場が未定。
  article.md frontmatter の `tags:` は空の記事もあり単純なユニオン源にならない。
  → タグマスタを git TS taxonomy にするか article+ranking 由来の derived にするかの**設計決定が前提**。
  現行 `known-tag-keys.ts` (327件) は stale だが 410 ゲートとしては動作するため当面据置 (クラッシュはしない)。
- `sync-metrics-cache` の扱いは Phase C と entangled (exporter が D1 metrics を読む間は維持)。即削除は不可。
- `data-refresh.yml` db:pull/push は全 Derived エフェメラル化 (Phase C) 後。

#### Phase C の進捗 (2026-05-29、SSD 接続後)

調査で 13 exporter は均一でなく **3 グループ**と判明 (多くは「使い捨て計算」不要で master の参照先付替えで済む):
1. **既に R2 から stats 読み** (remotion 3本): 残る D1 依存は prefecture 名称引きのみ。
2. **既存 master テーブル読み**: master(prefectures)/ges(ports)/blog(articles)/page-cards(pageComponents)/search-index(metrics+articles+categories) → git TS/R2 master へ repoint。
3. **真の Derived / 破損**: area-profile(area_profiles)/ export-port-statistics(**DROP済 stats_port 読みで破損**)/ ranking-values・normalization(純関数=DB読みなし)。

- ✅ **remotion exporter 群 D1 一掃: 完了** (commit 後続)。`load-prefectures.ts` を git TS master
  (packages/area prefectures.json) 読みに変更 (D1 と code/name/順序 47件完全一致を検証)。
  station-passengers / population-yoy-47 / migration-flow から openD1 除去、`master.ts`(prefectures.json を
  D1 から再生成する exporter)+ `d1-client.ts` 削除、`_shared/paths.ts` に REMOTION_PUBLIC 移設。
  **検証**: orchestrator --feature all で migration-flow 48 / population-yoy 1 ファイル生成、
  `git diff apps/remotion/public = 0` (出力バイト同一=挙動保全)。station-passengers は R2 に
  `station-passengers-annual-total/values.json` 未投入で skip (既存データ欠損、コードは正常動作)。
- ⚠️ **新発見**: `apps/remotion/scripts/pipeline/render-sns-all.ts` に別の `better-sqlite3` 直 import あり
  (data exporter ではなく render pipeline)。別スコープとして Phase C 残作業に追加。
- ⚠️ remotion tsconfig は `include:["src"]` のみで **scripts/ は tsc 対象外**。scripts 検証は tsx 実行で行う。
#### Phase C 残作業の精査 (2026-05-29、各候補を実調査 → クリーンな単独変換は無し)

remotion 群が唯一クリーンに移行できた理由 = **git TS master (prefectures.json) が既存**だったため。
残り 7 項目はいずれも「前提作業」が要る (= 即変換できない)。次セッションはこの前提を満たしてから着手:

| 項目 | 実調査の結論 | 前提 / 必要作業 |
|---|---|---|
| `calculate-ranking-values.ts` / `compute-normalization.ts` | **純関数ではない**。`listRankingValues`(stats D1=DROP済) / `findRankingItemByKey` に依存 | ranking value 計算チェーン全体 (list-ranking-values → R2 reader 化) の再設計。最も絡む |
| ~~`apps/ges/scripts/generate-port-projects.ts`~~ | ✅ **完了** (2026-05-29)。ports master を git TS 化 (`apps/ges/scripts/data/ports.json`, D1 699件) → fetchPorts を JSON 読み+JS filter/sort に。D1 旧SQL とデフォルト grade 22港が完全一致、tsx 実行 exit 0 で検証 | 済 |
| `apps/web/scripts/export-ranking-page-cards-snapshot.ts` | `page_components` を読む | **Phase E と重複** (page_components は運用6エンティティ)。E の git TS 化で一括対応 |
| `apps/web/scripts/export-blog-snapshot.ts` | D1 `articles` を読む。articles は Reference (SSOT=article.md) | R2 blog `article.md` frontmatter から D1 articles と同形を再構成 (190記事パース) |
| `apps/web/scripts/generate-search-index.ts` | D1 metrics+articles+categories | metrics→git TS registry / articles→R2 / categories→git TS の 3 源統合 |
| `apps/web/scripts/export-port-statistics-snapshot.ts` | **破損** (DROP済 `stats_port` 読み)。かつ package.json 未記載=不活性 | R2 port 観測値の置き場確定後に R2 reader 化 (または削除判断) |
| `apps/remotion/scripts/pipeline/render-sns-all.ts` | better-sqlite3 直 import (render pipeline) | 読む対象の特定 → 対応する git TS/R2 源へ |
| area-profile / city-profile snapshot | `area_profiles` テーブル (本来 Derived) を読む。area_profiles 自体の compute (run-batch-area-profile) は stats JOIN=DROP済で別途破損の可能性 | Derived の 2 段 (compute→snapshot) をエフェメラル化。深い |

**結論**: 残 Phase C は「git TS master 新設 (ports 等)」「Derived 計算チェーン再設計 (ranking-values/area-profile)」
「Phase E (page_components)」の前提作業に分解される。クリーンに着手できる最小単位は **ports master の git TS 化 → ges 変換**。


---

<!-- 元ファイル: dbless-migration-plan-2026-05-29.md -->


## 完全DBレス移行・削除計画 (read-only棚卸し結果)

### 0. 結論サマリ

- **完全DBレスは「技術的には9割方可能、ただし正典18と正面衝突する」**。本番app実行時はすでにR2 readerのみで永続D1を読んでおらず（Phase 8でD1 binding削除済み、CI gateで再発防止）、配信層は変更不要。残る永続D1依存は「オーサリング・運用エンティティ（page_components/themes/theme_metrics/sns_posts/affiliate_ads/categories）」「Derived集計（area_profiles/correlations）」「seed/exporterパイプライン」の3塊。
- **消す**: 観測値D1書き込み系（`upsert-ranking-values`等stats書込）、相関D1バッチ（実装は既に廃止）、リモートD1seed runbook、無効な`packages/database/wrangler.toml`（解約済`test-db`を指す）、ローカルseed投入スクリプト群。
- **直す**: Derivedをエフェメラル計算化（area_profile/correlation/ranking-value/normalization/search-index/remotion 4 exporter）、metricsをgit TS registry直読みに、exporter群のD1 readを剥がす。
- **残す**: R2 reader（@stats47/stats-r2, correlation reader, ranking-value-from-r2等）、git TS定義（data-configs registry, theme-page-component-additions.ts）、R2 I/O skill（push/pull/r2-du/page-data-batch）、Drizzle schema定義（git版管理の型ソースとして）。
- **最大の障壁 = 正典18**: 2026-05-29採択の正典18が**完全DBレス化を明示的に却下**し、上記6エンティティを「リモートD1がSSOT」と規定。これを覆さない限り、該当エンティティのD1経路削除は規約違反になる。**先にオーナーが正典18を改訂するか否かを決めることが、全DELETE/MOVEの前提条件**。

### 1. 正典18との矛盾 (オーナー判断が必要)

棚卸しJSONで `contradictsCanonical=true` が立った全項目。これらは正典18を改訂しない限り実行できない。

| パス | verdict | 正典18は何と言うか | 完全DBレスでどうなるか | 判断ポイント |
|---|---|---|---|---|
| `docs/01_技術設計/18_データ層ハイブリッド設計.md` | EDIT | 自身が「完全DBレス却下」「6エンティティはリモートD1 SSOT」(§3決定表) を規定 | 全面改訂が必要。リモートD1の位置づけを削除しgit TS+R2+エフェメラルに置換 | **これを改訂するか否かが全ての起点**。改訂しないなら以下のtrue項目は全てKEEP/EDIT(remote D1対応)に倒れる |
| `CLAUDE.md` | EDIT | §4「データ層はハイブリッド…リモートD1がSSOT」「D1セットアップ・CRUDはローカル(Mac)」 | 「リモートD1不要」「クラウド/ローカル共にgit TS+R2直接で完結」に書換 | プロジェクト憲法の変更。全agent/skill/開発者の行動に波及 |
| `apps/web/scripts/seed-theme-page-components.ts` | DELETE | §5標準フロー②「seed→D1(ローカルで冪等投入)」 | seedパイプライン廃止。git TS→R2直接反映(`sync-theme-additions-to-r2.ts`)に一本化 | page_componentsの「関係・横断クエリ」をR2 JSONで運用できるか |
| `apps/web/scripts/seed-local-finance-page-components.ts` | DELETE | 同上(page_components seed) | 同上 | 同上 |
| `apps/web/scripts/export-page-components-snapshot.ts` | DELETE | §5標準フロー③「D1→R2 export」 | D1 exporter廃止。git TS→R2直接反映へ統一 | page_componentsの再現可能性を「D1冪等seed」ではなく「git TS」だけで担保できるか |
| `apps/web/scripts/export-affiliate-ads-snapshot.ts` | EDIT | §3「affiliate_ads = リモートD1 SSOT」 | DELETE(完全DBレス) or remote D1 exporter化(ハイブリッド維持) | affiliate_adsの位置/ターゲティングCRUDをどこで行うか(git TS昇格 or R2直接オーサリングUI) |
| `apps/web/scripts/export-themes-snapshot.ts` | EDIT | §3「themes/theme_metrics = リモートD1 SSOT」 | DELETE or remote D1 exporter化 | テーマ設定オーサリングの代替経路 |
| `.claude/skills/db/populate-component-data/SKILL.md` | DELETE | §3 component系=リモートD1。component_dataは「Tier B=リモートのみ」(SKILL.md確認済、schema未定義) | component_data自体を廃止し、component_propsをgit TS定義 or R2 cache JSON化 | composition-chartのデータ源をどこにするか |
| `.claude/skills/db/verify-component-data/SKILL.md` | DELETE | 同上(component_data前提) | git TS schema↔R2値の整合チェックに置換 | 同上 |
| `wrangler.toml D1 bindings (apps/web ローカルbinding)` | EDIT | §4「ローカルbindingはバッチ実行に必要」 | リモートD1廃止時は削除、正典18維持時は保留 | 本番bindingは削除済み。ローカルbinding削除は開発自由度低下 |

**注**: 棚卸しJSONには同一subsystemで `packages/database/src/schema/page_components.ts` 等を「KEEP / contradictsCanonical=false」(schemaはgit版管理ソース)とした項目と、「EDIT / contradictsCanonical=true」とした項目が混在する。**schema定義ファイル自体の保持は矛盾しない**(型・version control用)。矛盾するのは「D1経路(seed/exporter/CRUD)の削除」のみ。両者を混同しないこと。

### 2. 削除対象 (DELETE)

正典18を改訂する前提で完全DBレス化する場合のファイル単位リスト。`contradictsCanonical=true` のものは§1の判断後にのみ実行可。

| パス | 役割 | 削除理由 | blast radius |
|---|---|---|---|
| `packages/ai-content/src/repositories/upsert-ranking-ai-content.ts` | AI content D1 write | DBレスではgit TS or R2直接write | 呼び出し元をgit TS/R2 writeに移行要 |
| `packages/area-profile/src/repositories/get-area-profile-count.ts` | area profile D1 query | R2 snapshot cardinalityで代替 | profile count参照箇所 |
| `packages/area-profile/src/repositories/get-area-profile.ts` | area profile D1 query | R2 snapshot読みのみに | 個別profile取得 |
| `packages/area-profile/src/repositories/list-area-profile-rankings.ts` | D1 query | R2 reader代替 | ranking一覧 |
| `packages/area-profile/src/repositories/list-area-profile-summaries.ts` | D1集計query | precomputed R2 snapshot使用 | summary endpoint |
| `packages/area-profile/src/repositories/replace-area-profile-rankings.ts` | D1 write | Derivedはエフェメラル/batch計算 | admin/batch更新 |
| `packages/area-profile/src/repositories/replace-city-profile-rankings.ts` | D1 write | 同上 | city profile更新 |
| `packages/ranking/src/repositories/metric/find-metric-by-key-and-area-type.ts` | metric D1 query | git TS registry/R2で代替 | metric lookup |
| `packages/ranking/src/repositories/ranking-item/find-ranking-item.ts` | D1 query | R2 snapshot reader代替 | 個別ranking item |
| `packages/ranking/src/repositories/ranking-value/list-ranking-values.ts` | stats D1 query | observationsはR2のみ | ranking value一覧 |
| `packages/ranking/src/repositories/ranking-value/upsert-ranking-values.ts` | stats D1 write | **正典18 §8「観測値は二度と永続DBに入れない」**。R2書込のみ | 全stats書込経路 |
| `packages/stats-r2/src/scripts/export-stats-to-r2.ts` | D1→R2 stats exporter | observationsはR2-native化(e-Stat→R2直行)後は一回限り移行ツール | stats export(代替=page-data-batch) |
| `.claude/skills/db/populate-component-data/SKILL.md` | リモートD1 component投入 | §1 (contradicts) | composition-chart data |
| `.claude/skills/db/verify-component-data/SKILL.md` | component_data検証 | §1 (contradicts) | freshness監視 |
| `.claude/skills/db/sync-metrics-cache/SKILL.md` | TS→D1 metrics cache同期 | git TS registryがSSOTで十分、cache不要 | metric discovery高速化(cache層喪失) |
| `.claude/agents/db-schema-manager.md` | Drizzle schema↔D1管理 | D1スキーマ運用自体が廃止 | migration pipeline, local dev DB setup |
| `.claude/hooks/check-local-db.js` | ローカルSQLite存在チェックhook | DBレスでローカルSQLite不要(エフェメラル時のみ一時) | session起動メッセージ(開発UX) |
| `apps/remotion/scripts/exporters/_shared/d1-client.ts` | remotion D1接続util | remotion exporterのエフェメラル化に伴い不要 | remotion全exporterが依存→同時改修 |
| `apps/web/scripts/seed-theme-page-components.ts` | page_components seed | §1 (contradicts) | テーマ投入フロー |
| `apps/web/scripts/seed-local-finance-page-components.ts` | page_components seed | §1 (contradicts) | local-finance投入 |
| `apps/web/scripts/export-page-components-snapshot.ts` | page_components D1→R2 | §1 (contradicts) | page_components配信経路 |
| `docs/01_技術設計/17_リモートD1ハイブリッド設計.md` | 旧正典(superseded) | 正典18に統合済で廃止。セットアップ手順は要なら`archives/`へ | リンク参照のみ |
| `packages/database/seed/README.md` | リモートD1 seed runbook | リモートD1解約済(2026-04-29)。誤セットアップリスク削減 | 開発者runbook(要なら`archives/`) |
| `packages/database/wrangler.toml` | DB scripts用binding(`test-db`) | 解約済の存在しない`test-db`を指す(確認済)。無用 | packages/database CI/test実行方法 |
| `packages/database/drizzle/*.sql` (migrations 52本) | D1 migration履歴 | 永続D1廃止で全廃 | D1管理pipeline全廃 ※schema定義保持時は要再検討(下記注) |
| `.claude/skills/db/run-correlation-batch/SKILL.md` | 相関batch(D1) | Phase 7で実装削除済・correlationsテーブルDROP済(歴史記録のみ残存) | なし(既に廃止) |

**DELETE時の注意（棚卸しの矛盾点を明示）**: `packages/database/drizzle/*.sql` を「DELETE」とした項目がある一方、別subsystemは同migration群を「KEEP(schema再現性に必須)」としている。**schema定義(`src/schema/*.ts`)をgit型ソースとして残す方針なら、migrationもdrizzle-kitの整合性維持のため残すべき**。完全に消すのは「D1永続を一切建てない(local SQLiteも使わない)」を確定した後。§7で再確認。

### 3. 改修対象 (EDIT / MOVE_TO_GIT_TS / MOVE_TO_EPHEMERAL)

| パス | verdict | 何をどう変えるか | blast radius |
|---|---|---|---|
| `packages/area-profile/src/exporters/area-profile-snapshot.ts` | MOVE_TO_EPHEMERAL | D1 JOINを`:memory:` SQLite/DuckDBでR2観測値読み込み計算→R2書出に | area profile snapshot生成 |
| `packages/area-profile/src/exporters/city-profile-snapshot.ts` | MOVE_TO_EPHEMERAL | 同上(city rankings) | city profile pipeline |
| `packages/ranking/src/services/calculate-ranking-values.ts` | MOVE_TO_EPHEMERAL | ranking value計算をエフェメラルSQL(R2読み)→R2に | ranking value計算 |
| `packages/ranking/src/services/compute-normalization.ts` | MOVE_TO_EPHEMERAL | normalization計算をエフェメラル化 | normalization pipeline |
| `apps/web/scripts/export-blog-snapshot.ts` | MOVE_TO_EPHEMERAL | articles(Reference, md再生成可)をエフェメラル計算化 | blog snapshot生成 |
| `apps/web/scripts/export-ranking-page-cards-snapshot.ts` | MOVE_TO_EPHEMERAL | ranking_items(Reference)をエフェメラル化 | ranking card snapshot |
| `apps/web/scripts/generate-search-index.ts` | MOVE_TO_EPHEMERAL | static bundle生成をエフェメラルSQL/registry読みに | 検索インデックス生成 |
| `apps/remotion/scripts/exporters/migration-flow.ts` | MOVE_TO_EPHEMERAL | observationsからR2+in-memory計算 | remotion migration動画 |
| `apps/remotion/scripts/exporters/station-passengers.ts` | MOVE_TO_EPHEMERAL | observationsから計算 | remotion station動画 |
| `apps/remotion/scripts/exporters/population-yoy-47.ts` | MOVE_TO_EPHEMERAL | observationsから計算 | remotion population動画 |
| `apps/remotion/scripts/exporters/master.ts` | MOVE_TO_EPHEMERAL | master registry(git TS)から計算 | remotion master |
| `apps/ges/scripts/generate-port-projects.ts` | MOVE_TO_EPHEMERAL | ports(Reference)をR2+in-memory化 | GESプロジェクト生成 |
| `apps/web/scripts/generate-known-ranking-keys.ts` | MOVE_TO_GIT_TS | D1 SELECT→metrics registry walkで生成 | middleware Fix 6(410 guard), routing |
| `apps/web/scripts/generate-known-tag-keys.ts` | MOVE_TO_GIT_TS | D1 SELECT→categories registryで生成 | tag key SSOT |
| `.claude/skills/db/generate-known-ranking-keys/SKILL.md` | EDIT | git TS registry walkerに改修(CI環境でもgit TS利用可) | middleware Fix 6, dynamic routing |
| `packages/database/seed/*.json` | MOVE_TO_GIT_TS | articlesはmdがSSOT。seed不要化 | seed pipeline廃止 |
| `apps/remotion/scripts/export-d1-to-remotion-static.ts` | EDIT | 各exporterのエフェメラル化に伴い入出力シグネチャ変更 | remotion全pipelineインターフェース |
| `.claude/skills/db/export-d1-to-remotion-static/SKILL.md` | EDIT | prefectures/cities masterをgit TS/R2 JSON化、エフェメラルD1 rebuildで動作 | remotion動画レンダリング |
| `.claude/skills/db/sync-snapshots/SKILL.md` | EDIT | 各exporterのD1 read廃止(git TS+R2値直読)。orchestrationは残す | 全snapshot更新, ISR refresh |
| `.claude/skills/db/sync-articles/SKILL.md` | EDIT | D1 articlesテーブル廃止、R2 frontmatterのみで運用 | blog routing, article metadata |
| `.claude/skills/db/verify-d1-integrity/SKILL.md` | EDIT | D1メタ層検証廃止→git TS registry↔R2観測値検証に(Phase 7計画済) | pre-snapshot validation, weekly audit |
| `.claude/scripts/db/verify-d1-integrity.mjs` | EDIT | better-sqlite3直読→git TS walker+R2 samplerに | CI pre-snapshot checks |
| `.claude/agents/data-ingester.md` | EDIT | metrics cache役割廃止。責務を「R2値投入+verification」に集約 | metric indexing/discovery(cache喪失) |
| `.claude/agents/snapshot-exporter.md` | EDIT | 各exporterのD1 read廃止→git TS+R2値直読。orchestration層はR2 validatorに | snapshot build pipeline |
| `packages/ai-content/src/exporters/ranking-ai-content-snapshot.ts` | EDIT | D1 JOIN→git TS/R2読みに | snapshot生成pipeline |
| `packages/ai-content/src/repositories/find-ranking-ai-content.ts` | EDIT | D1 query→R2 reader pattern | client fallback |
| `packages/category/src/exporters/categories-snapshot.ts` | EDIT | git TS seed fallback対応(またはremote D1維持) | categories snapshot |
| `packages/ranking/src/exporters/surveys-snapshot.ts` | EDIT | sources/surveys。git TS seed維持 or git TS直読 | surveys snapshot |
| `packages/ranking/src/exporters/ranking-items-snapshot.ts` | EDIT | metrics(git TS SSOT想定)→registry読みでD1依存除去 | ranking items snapshot |
| `packages/ranking/src/exporters/ranking-items-per-url-snapshot.ts` | EDIT | metrics registry読みに | per-URL snapshot |
| `packages/database/src/server.ts` | DELETE/EDIT | apps/web import 0件(CI gate確認済)。batch/exporter/test依存のみ。完全DBレスでgetDrizzle不要化 | `@stats47/database/server` import先(依存グラフ確認必須) |
| `packages/database/src/index.ts` | EDIT | schema exportsは残置、server.ts削除に伴うexport削除 | package exports全体 |
| `packages/database/package.json` | EDIT | seed:*スクリプト削除。better-sqlite3/drizzle-kit/miniflareはlocal/型生成で要否判定 | install size, build時schema access |
| `packages/database/scripts/* (seed-*/dump/extract/sync)` | MOVE_TO_EPHEMERAL/DELETE | seed投入系削除、migrate-local(schema初期化)は残置可、dump-tables不要化、extract/sync-articlesはR2直接なら残置 | 開発者手動ワークフロー |
| `apps/web/wrangler.toml (ローカルbinding)` | EDIT(§1判断後) | リモートD1廃止確定後にローカルbinding削除可 | ローカルbatch/SSR |
| CI: `.github/workflows/pr-quality-check.yml (D1 Import Gate)` | EDIT | gate削除 or 検索対象をgit-committed Drizzle schemaに限定 | CI gate, Phase 10完了条件 |
| CI: `.github/workflows/data-refresh.yml` | EDIT | `db:pull`/`db:push`削除、e-Stat→R2直行+Derivedエフェメラル→R2に。metric cache行は廃止 | 月次データ更新の中核 |
| CI: `.github/workflows/deploy-workers.yml` | EDIT | 行84のD1権限言及・遺産コメント除去(本番binding削除済) | デプロイCIノイズ除去 |
| docs: `data-storage.md` / `data-sqlite-ssot.md` / `local-environment.md` / `branch-workflow.md` | EDIT | 「ローカルビルドDB」「リモートD1→exporter→R2」前提を git TS+R2+エフェメラルに読み替え | 新規skill設計ガイド, デプロイ手順 |
| `docs/01_技術設計/14_Phase6_deprecation_log.md` | EDIT | Phase 7残課題(A-D)が完全DBレスのメインタスクに。新Phase定義で組み直し | 記録ドキュメント |

### 4. 維持 (KEEP) の要点

DBレス後も中核として残るものをカテゴリ単位で。

- **R2 reader（配信の心臓）**: `packages/stats-r2/src/readers/`, `packages/correlation/src/repositories/read-correlation-{snapshot,by-key}.ts`, `packages/ranking/src/repositories/ranking-value/read-ranking-values-from-r2.ts`, `packages/ranking/src/repositories/survey/read-surveys-snapshot.ts`。すべてD1結合なし、既にDBレス。
- **app実行時コード**: `apps/web/src/features/*/server.ts` はR2 readerのみでD1 query 0件（確認済）。**変更不要**。
- **git TS定義（SSOT）**: `packages/data-configs/src/{metric-meta.ts,registry.ts}`, `apps/web/scripts/theme-page-component-additions.ts`（定義は永続化不要）, `apps/web/scripts/sync-theme-additions-to-r2.ts`（git TS→R2直接反映＝DBレス時の主経路）。
- **R2 I/O skill / agent**: `/page-data-batch`（e-Stat→R2直行）, `/pull-r2`, `/push-r2`, `/r2-du`, `/fetch-mlit-ksj`, `r2-publisher` agent, `packages/r2-storage/src/index.ts`。すべてS3 APIのみ。
- **Drizzle schema定義（型/version control用）**: `packages/database/src/schema/*.ts` は「git TSの一種」として保持（配信R2に影響しない）。エフェメラル計算でtemp tableを建てる際の型ソースにもなる。
- **エフェメラル計算の足場**: `local-adapter.ts`/`noop-adapter.ts`/`client.ts`/`d1-context.ts`/`drizzle.ts` は、Derivedのエフェメラル(`:memory:`)計算に再利用可能。完全に消すと使い捨てDB計算の足場を失うため、**MOVE_TO_EPHEMERALの受け皿として残す**判断が妥当（棚卸しでも全てKEEP）。

### 5. 段階的移行プラン (Phase順)

build/型チェックでgateし「壊さない順」に並べる。各Phaseは独立PR=ロールバック単位。

#### Phase A — 死蔵・無効物の除去（最小リスク、矛盾なし）
- **目的**: 既に廃止済/無効な資産を消し、混乱源を断つ。
- **対象**: `packages/database/wrangler.toml`(無効`test-db`), `packages/database/seed/README.md`(解約済runbook→`archives/`), `docs/01_技術設計/17_*.md`(superseded→`archives/`), `.claude/skills/db/run-correlation-batch/`(実装削除済), Phase 7-D orphan scripts(`ingest-migration-flow.ts`/`populate-port-statistics.ts`/`seed-city-ranking-items.ts`)。
- **検証**: `npx tsc --noEmit -p apps/web/tsconfig.json` / `cd apps/remotion && npx tsc --noEmit` / `npm run build`(web)。grepで削除ファイルへの参照0件確認。
- **ロールバック**: ファイル単位revert。
- **リスク**: 低（active呼び出し元なし）。

#### Phase B — オーナー判断ゲート（正典18）
- **目的**: §1のtrue項目を進められるか確定。**ここを通過しない限りPhase D以降の該当項目は着手不可**。
- **対象**: `docs/01_技術設計/18_*.md` を改訂（完全DBレス採用）or 据置（ハイブリッド継続）の意思決定。決定をCLAUDE.md §4に反映。
- **検証**: ドキュメントレビューのみ（コード変更なし）。
- **ロールバック**: ドキュメントrevert。
- **リスク**: 設計判断。誤ると後続全Phaseの方向が変わる。

#### Phase C — Derivedのエフェメラル計算化（矛盾なし、正典18 §6が許容）
- **目的**: area_profile/correlation/ranking-value/normalizationを`:memory:` SQLite or DuckDB（R2観測値読み）→R2に。観測値書込は一切しない（§8遵守）。
- **対象**: §3のMOVE_TO_EPHEMERAL全件（area-profile/city-profile exporter, calculate-ranking-values, compute-normalization, blog/ranking-page-cards/search-index, remotion 4 exporter, ges port）+ `/recompute-correlations`実装。
- **検証**: 各exporterを単体実行しR2出力をdiff（旧D1 JOIN出力と一致確認）。`npm run build`。Remotionは`preview-remotion`でレンダリング確認。
- **ロールバック**: exporter単位（旧D1版を温存し並走→切替）。
- **リスク**: エフェメラル計算結果がD1 JOIN結果と乖離する可能性→**新旧出力のdiff検証を必須gate**にする。

#### Phase D — 観測値・metric D1経路の除去（矛盾なし）
- **目的**: stats書込/metric queryのD1依存を剥がす。
- **対象**: §2の `upsert-ranking-values`/`list-ranking-values`/`find-metric-by-key-and-area-type`/`find-ranking-item`/area-profile repositories、`export-stats-to-r2.ts`（移行完了後）、`/sync-metrics-cache`、`generate-known-ranking-keys`/`generate-known-tag-keys`のregistry化。
- **検証**: CI `pr-quality-check.yml` のD1 Import Gateで`apps/web/src`のD1 import 0件維持。`npx tsc --noEmit`全workspace。
- **ロールバック**: repository単位（reader fallback確認後に削除）。
- **リスク**: 削除前にR2 reader代替が全呼び出し元で動くこと確認（呼び出し元未移行で削除するとruntime失敗）。

#### Phase E — Authored/運用エンティティのD1経路除去【Phase B=完全DBレス採用時のみ】
- **目的**: page_components/themes/affiliate_ads/categories/component_dataのseed/exporter/CRUDを廃し、git TS→R2直接反映に一本化。
- **対象**: §1のtrue項目（seed-theme-page-components, seed-local-finance, export-page-components/themes/affiliate-ads snapshot, populate-component-data, verify-component-data, 関連skill/CRUD repos）。
- **検証**: `sync-theme-additions-to-r2.ts`経路でR2反映→該当ページのISR確認（`curl`でHTTP 200 + 内容確認）。`npm run build`。
- **ロールバック**: エンティティ単位。**Phase B据置(ハイブリッド維持)ならこのPhaseは丸ごとスキップ**し、該当exporterをremote D1対応に改修(EDIT)するのみ。
- **リスク**: page_componentsの「関係・横断クエリ」をR2 JSONで運用する新規実装の負担（正典18が懸念した点）。

#### Phase F — schema/migration/CI/docsの最終クリーンアップ
- **目的**: 永続D1を完全に建てない確定後、残骸を除去。
- **対象**: `packages/database/src/server.ts`削除（依存グラフ確認後）、`index.ts`/`package.json`調整、`db-schema-manager` agent / `check-local-db.js` hook削除、CI(data-refresh `db:pull/push`削除、D1 Import Gate撤去、deploy-workers遺産除去)、docs(data-storage/data-sqlite-ssot/local-environment/branch-workflow/14_Phase6_log)改訂。schema定義・migrationの最終要否は§7で確定。
- **検証**: フルCI green（`pr-quality-check.yml`）。`npm run build`全workspace。Cloudflare Pagesデプロイ。
- **ロールバック**: develop→main PR単位（CI gateで最終確認）。
- **リスク**: `@stats47/database/server` importの取りこぼし→**削除前に依存グラフ全走査必須**。

### 6. ローカル(Mac)/Cloudflare認証が必要な作業

クラウド完結できず、ローカルMac（wrangler認証/Cloudflare account）が必要な項目（正典18 §4の作業分担に基づく）:

- **D1インスタンスの解約**（Phase 10）: Time Travel 30日窓経過後、Cloudflareダッシュボード or `wrangler`でD1 database削除。クラウドagent不可。
- **本番デプロイ後のCDNパージ**: `/purge-cdn`（Cloudflare API）。CI/手動。
- **エフェメラル計算をローカルで走らせる場合**: 正典18 §4表で「集計のJOINはローカル」。ただしエフェメラル(`:memory:`/DuckDB+R2読み)化すれば「△クラウド可」になる（Phase Cのゴール）。S3 creds(`.env.local`)があればクラウドでも計算可能に。
- **`packages/database/scripts/migrate-local.ts`等**: ローカルSQLite/エフェメラルDB初期化（残置する場合）。
- **wrangler.toml binding削除後のデプロイ検証**: ローカル`next build`で`○ Static`維持確認（`.claude/rules/nextjs-ssg-preservation.md`）。

**クラウドで完結できるもの**（参考）: git TS編集、R2 push/pull（S3直接）、R2 snapshot生成、`sync-theme-additions-to-r2.ts`（git TS→R2直接）。

### 7. 残る未決定事項

`INVESTIGATE` 項目とオーナー確認事項:

- **【最重要】正典18の方針**: 完全DBレス化を採用して正典18を改訂するか、ハイブリッド維持か。これが§1全項目とPhase E実行可否を決める。**他の全判断の前提**。
- **schema定義・migrationの最終要否**: `src/schema/*.ts` を「git型ソース」として残すなら `drizzle/*.sql` migrationも整合性のため残すべき（棚卸しで KEEP/DELETE が割れている）。「永続D1もlocal SQLiteも一切建てない」を確定してから消す。
- **`@stats47/database/server` の依存グラフ**: `getDrizzle`等の実import元（batch/exporter/test）を全走査してからserver.ts削除（apps/webは0件確認済だが他workspace未確認）。
- **e-Stat metadata の分類**: `packages/estat-api/src/meta-info/repositories/d1/{find-by-stats-id,save}.ts`, `warm-cache.ts` — コメントは「R2が真実源」だがコードはD1 query。Reference(API再取得)かD1 cacheか不明。`estat_metainfo`/`estat_catalog`の位置づけ確定要。
- **GIS pipeline**: `packages/gis/src/mlit-ksj/{pipeline.ts,scripts/register-ksj-rankings.ts}` — D1にmetrics+stats書込。git TS metric定義+R2 stats直書きに変えるか要設計。
- **港湾/漁港データ**: `apps/web/scripts/export-{port-statistics,fishing-ports}-snapshot.ts`, `ports`/`fishing_ports`テーブル — SSOT vs Reference の役割未確定。
- **ranking metrics設計の曖昧さ**: metricsが「git TS SSOT」か「D1 SSOT」かが正典18内でも揺れる(§3はReference=TS registryと記載)。git TS確定なら多数のranking repository/exporterがDELETE可、D1維持ならEDIT止まり。
- **ai-content生成スクリプト**: `generate-parallel.ts`/`list-pending.ts`, `ranking-tag/sync-ranking-tags.ts`, `auto-attach-normalization.ts`, `export-master-snapshots.ts`, `sync-ranking-export.ts` — git TS化 or エフェメラル化のどちらに倒すか、上のmetrics設計確定後に判断。
- **`data-configs/scripts/{export-from-d1,sync-metrics-cache}.ts`**: metricsがTS-first確定なら旧D1→TS移行ツールとして役割終了→削除可。
