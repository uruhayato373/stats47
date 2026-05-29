---
type: migration-plan
date: 2026-05-29
status: active
parent: docs/02_実装計画/dbless-spec-2026-05-29.md
canonical: docs/01_技術設計/19_完全DBレス設計.md
method: 並列調査 workflow (dbless-rebuild-plan) — 6スクリプト深掘り → 統合
scope: Phase C 残り (Derived/multi-source 6スクリプト)。Phase E (page_components) は別途
tags: [architecture, dbless, migration, plan, rebuild]
---

# 完全DBレス 残スクリプト再構築プラン

## ★ 実装進捗 (2026-05-29 セッション、随時更新) — 再開時はここを最初に読む

すべて develop に commit + push 済。残りは §2/§3 の通り基盤を使う消費者改修。

| ステップ | 状態 | commit/メモ |
|---|---|---|
| 基盤2 categories git TS (`packages/data-configs/src/categories.ts`) | ✅ 完了 | 17件 配信中と key/name/順序一致・tsc PASS |
| 基盤1 `listRankingItemsWithTagsFromR2` (`packages/ranking/.../read-ranking-items-snapshot.ts`) | ✅ 完了 | per-key item.json 走査・1992件(known-keys一致)・tsc PASS。**build時は NODE_ENV=development** |
| 2.1 calculate-ranking-values | ✅ D1 query 除去 | `findRankingItemByKey`→`readRankingItemByKeyFromR2`。recompute突合は exporter 配線後 |
| 2.3 export-blog (S) | ✅ 完了 (commit 2011ff3e) | frontmatter 直読み。196/196 slug が seed と一致、published 118 (seed117+sewerage公開化の正当差分)。欠落していた `app/blog/all.json` 復旧 |
| 2.6 render-sns-all (S) | ✅ 完了 | item.json `.item.visualization` から viz 読み、better-sqlite3 削除。66 SNS dir 全 colorScheme 解決・tsc 0 err (既存23 errは無関係) |
| 2.5 export-port-statistics (S) | 🔶 ブロック中 | 本番 /ports は cloud all.json で正常稼働 (200, grades 描画) → 非緊急。ges ports.json は **administrator 欠落=不完全マスタ**。正しい修正は cloud all.json を1度読んで完全 port マスタ (administrator 含む) を git TS 化 + exporter 再配線。R2 読取り (SSD ミラーに all.json 無 / S3失効) 復旧が前提 |
| 2.4 generate-search-index (M) | ✅ 完了 | ranking=基盤1 (item.json, demo/norm 保全) + description は git TS getMetricConfig 補完 / blog=2.3 all.json / categories=基盤2。**現行 production は ranking 0件の壊れた index だったのを 1992件に復旧**。demo 221・norm 113 が破壊前 baseline と完全一致。検索動作確認済 (人口109/中絶 ranking+blog/商業 demo表示)。npm script に react-server 条件 + 0件時の既存保持ガード追加。※orphan categoryKey "port"(9)/"labor"(1) は D1 でも NULL の pre-existing データ品質問題 (別件) |
| 2.2 area-profile 都道府県 (M) | ✅ 完了 | exporter を「D1 areaProfiles 読み」→「R2 から compute(基盤1+listRankingValues+buildAreaProfileRows)→profile.json 直接書き」に再配線。中間 D1 完全バイパス。**47000 沖縄が 2026-05-23 baseline と byte-for-byte 完全一致** (S162/W524 差分0) + 5県自己検証パス。run-batch(D1書込)は superseded→Phase F 削除 |
| 2.2b area-profile 市区町村 (S) | ⬜ | city-profile-snapshot.ts も同パターン(D1 areaProfiles⋈cities⋈metrics→R2)。city values + cities master + buildCityProfileRows で DB レス化 |

**先行 Phase C 完了済 (別 commit)**: remotion exporter 群 (load-prefectures git TS化, master/d1-client 削除), ges port-projects (ports.json git TS化)。
**未着手の大物**: Phase E = page_components の R2 運用基盤 (本プラン scope 外)。

## 0. 結論サマリ

調査6本のうち**4本が D1 破損**（calculate-ranking-values / export-blog-snapshot / export-port-statistics-snapshot / render-sns-all）、2本（generate-search-index は D1 依存だが論理は健全、area-profile は破損）。**最大の発見: 値の読み取り経路はすでに DBレス化済み**——`packages/ranking/.../list-ranking-values.ts` 等はすべて `readStatsValues`（`@stats47/stats-r2`）経由で R2 `app/stats/<metric>/values.json` を読む（調査JSONの「listRankingValues は D1」記述は誤り）。残る D1 依存は「**ranking-item メタの取得**（`findRankingItemByKey` / `listRankingItemsWithTags` = `getDrizzle()`）」「**blog/port メタの取得**」「**search-index の metrics/categories 取得**」「**SNS visualization 取得**」の4種に集約される。共通基盤1つ（**R2 item.json を SSOT とする ranking-item リーダ**）を作れば calculate-ranking-values と area-profile の2本がまとめて片付く。総effort: **基盤 S + 6本（S×4, M×2）= 実質 1.5〜2日**。エフェメラル `:memory:` SQLite は**どの6本にも不要**——全て pure JS（R2 JSON 読み + 既存 pure util）で完結する。

## 1. 共通基盤（先に作るべきもの）

### 基盤1: ranking-item メタの R2 リーダ（`readRankingItemFromR2` / `listRankingItemsFromR2`）★最優先

- **提供するもの**: D1 `metrics` テーブルへの `getDrizzle()` 依存を持つ `findRankingItemByKey` / `listRankingItemsWithTags` の DBレス代替。R2 `app/ranking/<key>/item.json`（**2,205 ファイル実在を確認**）の `.item` フィールド（`rankingKey / areaType / calculation / visualization / categoryKey / latestYear / availableYears / isActive / tags / unit` を全保持）を読んで `RankingItem` 型に復元する。`listRankingItemsFromR2` は `ls app/ranking/` をイテレートし `isActive` でフィルタ。
- **使うスクリプト**: ① calculate-ranking-values（`getValues` の `findRankingItemByKey` 置換）、② area-profile run-batch（`listRankingItemsWithTags` 置換）。
- **実装方針**: pure JS。`item.json` は `{generatedAt, item:{...}}` 構造（`.item` にメタ。**top-level `.visualization` は null、メタは `.item.visualization`** に入る点に注意）。型は `packages/ranking/src/types` の `RankingItem` を再利用。ローカルは `.local/r2/app/ranking/<key>/item.json` 直読み、クラウドは `fetchFromR2AsJson` の2モード。
- **検証**: `listRankingItemsFromR2({isActive:true, areaType:"prefecture"}).length` が現行配信の active ranking 数と一致するか。

### 基盤2: git TS categories マスタ（`packages/data-configs/src/categories.ts`）

- **提供するもの**: `categoryKey → {name, displayOrder}` の単一 TS ソース。現状 categories は D1 schema のみ（R2 には `app/categories/svg/*.svg` 16件しか無く JSON 無しを確認）。完全DBレス正典 §3「運用エンティティ = git TS が SSOT」に従い TS 化。
- **使うスクリプト**: generate-search-index（`metrics LEFT JOIN categories` の categoryName 解決 + meta の displayOrder ソート）、area-profile / item.json 生成系で categoryName が要る箇所。
- **実装方針**: 既存 `public/search-index-meta.json` の `categories[]`（17件・displayOrder順を保持）を初期値として TS 化（逆読みではなく**確定値を TS に固定**）。
- **検証**: TS の categories 配列が現行 `search-index-meta.json` の categories と key/order 完全一致。

> **不要と判断した基盤**: エフェメラル `:memory:` SQLite ビルダーは6本いずれも JOIN/集計を要さない（ranking計算は pure util、area-profileは filter+sort、他はメタ整形）ため**作らない**。正典§6で許容されているが、本6本には適用対象なし。

## 2. スクリプト別 再構築仕様

### 2.1 calculate-ranking-values.ts（packages/ranking） — 破損 / effort M

- **現在読むもの（破損）**: `getValues()` が ① `listRankingValues`（**実は既に R2-native** = `readStatsValues`）→ ② `findRankingItemByKey`（**D1 `getDrizzle()` 依存・破損点**）→ ③ `fetchRankingValuesFromSource` + `cacheRankingValues`（後者 `upsertRankingValues` は**Phase 7 で no-op 化済**、warning log のみ）。
- **DBレス後の入力源**: 観測値 = R2 `app/stats/<metric>/values.json`（`readStatsValues` 既存・変更不要）。ranking-item メタ = **基盤1**（R2 item.json）。`per_capita` の分母 `total-population` も R2 から読む。
- **出力**: `RankingValue[]`（メモリ返却）。snapshot として永続化する場合は呼び出し側（exporter）が R2 `app/ranking/<key>/values.json`（`RankingValuesKeySnapshot` 構造、partitions[{yearCode,count,values[]}]）へ書く。
- **計算ロジック**: 3型（per_capita = 分子/total-population、ratio = 分子/分母、subtraction = 分子-分母）。すべて `computeCalculatedValues`（keyBy:"areaCode"）→ `rankByValue` の**既存 pure 関数**で完結。計算型の入れ子は `visited` Set で再帰（既存ロジック維持）。
- **推奨方式**: pure JS。`findRankingItemByKey` を基盤1に差し替えるのみ。③のオンデマンド e-Stat fallback は**削除**（DBレスでは observation populate は `/page-data-batch` に集約済、`upsertRankingValues` no-op が証拠）。
- **検証方法**: `calculation.isCalculated:true` の項目（実在確認: 例 `accountant-annual-income` formula="monthly*12+bonus"）から per_capita/ratio/subtraction 各1〜2件・計5件を再計算し、現行配信 `app/ranking/<key>/values.json` の partitions[].values[].rank と突合。**同順位タイブレークで ±1 rank の差は許容**、value は相対誤差 1e-6 以内。

### 2.2 area-profile-snapshot.ts + run-batch-area-profile.ts（packages/area-profile） — 破損 / effort M

- **現在読むもの（破損）**: run-batch が `listRankingItemsWithTags`（**D1 `getDrizzle()`・破損点**）+ `listRankingValues`（**既に R2**）。exporter が D1 `areaProfiles` / `metrics` テーブルを読んで R2 へ。city 版は `build-city-profile-rows` 経由で cities を要する。
- **DBレス後の入力源**: ranking-item = **基盤1**。観測値 = R2 `app/stats/<metric>/values.json`（`listRankingValues` 既存）。cities マスタ = git TS `packages/area/src/data/cities.json`（KEEP 部品）。
- **出力**: R2 `app/areas/<areaCode>/profile.json`（47件）+ `app/areas/<pref>/cities/<city>/profile.json`（city版）。現行配信は `app/areas/` に47県 + cities 実在（2026-05-23付）。
- **計算ロジック**: 47県×全 active 指標を `areaCode→AreaRankingData[]` に集約 → `extractStrengthsAndWeaknesses`（strength≤5位 / weakness≥43位、rank=0除外）→ `computePercentile((47-rank)/(47-1)*100)` → strengths rank昇順・weaknesses rank降順ソート（**全て既存 pure util**）。
- **推奨方式**: pure JS。exporter を「D1 areaProfiles 読み→R2書き」から「run-batch が組んだ `AreaProfileData` を直接 R2 へ saveToR2」に再配線（中間 D1 テーブル `areaProfiles` を経由しない）。
- **検証方法**: 新計算 vs 2026-05-23 baseline の構造 JSON diff。スポット5県（01000北海道 / 13000東京 / 27000大阪 / 34000広島 / 47000沖縄）で strength≤5位・weakness≤5位・rank=0除外を確認。指標数の差分は「データ更新由来」として許容（logic 差でなければ documented diff）。

### 2.3 export-blog-snapshot.ts（apps/web/scripts） — **破損（調査JSONの isBroken:false は誤り）** / effort S

- **現在読むもの（破損）**: 実コードは `BetterSqlite3` + `drizzle` で **D1 `schema.articles` を SELECT**（調査JSONが提示した「article.md frontmatter を読む版」は**現状ではなく提案コード**）。出力 R2 key = `BLOG_SNAPSHOT_KEY = "app/blog/all.json"`。
- **DBレス後の入力源**: R2 `.local/r2/app/blog/<slug>/article.{md,mdx}` の YAML frontmatter（**196 ディレクトリ実在を確認**、`app/blog/all.json` は**現状欠落**）。
- **出力**: R2 `app/blog/all.json`（`BlogSnapshot = {generatedAt, articles:SnapshotArticle[], tagMeta:SnapshotTagMeta[]}`）。
- **計算ロジック**: 各 slug の frontmatter を `js-yaml` で parse → `SnapshotArticle`（slug/title/seoTitle/description/published/publishedAt/tags/hasCharts 等）→ published 記事の tags 集計で `tagMeta` 生成・count降順。`tags` は `{tagKey}[]` 構造（既存 `SnapshotArticle` 型に合わせる、調査提案の `JSON.stringify` 文字列ではなく型準拠で）。
- **推奨方式**: pure JS。`BetterSqlite3`/`drizzle`/`LOCAL_DB_PATHS`/`schema` import を全削除、frontmatter 読みに置換。`saveToR2`（既存）維持。
- **検証方法**: 出力の `articles.length === 196`（実ディレクトリ数）、`published` 件数と `app/blog/<slug>/article.md` の frontmatter `published:true` 数が一致。生成後に `blog-snapshot-reader.ts` の `loadSnapshot()` が空配列 fallback せず読めること（=現在 `all.json` 欠落で本番 blog 一覧が空になっている可能性、本修正で復旧）。

### 2.4 generate-search-index.ts（apps/web/scripts） — D1依存（論理健全） / effort M

- **現在読むもの**: D1 `metrics LEFT JOIN categories`（isActive=true, areaType="prefecture"）+ D1 `articles`（published=true）。出力 = `public/search-index.json`（MiniSearch ~267KB）+ `public/search-index-meta.json`（categories/blogTags/blogYears、現状17 categories/79 blogTags/2 blogYears）。
- **DBレス後の入力源**: metrics = git TS `listAllMetrics()` + `getMetricMeta()`（**`@stats47/data-configs` から export 済を確認**、`isActive` + `entities.includes("prefecture")` でフィルタ、`availableYearsJson`→`getMetricMeta().latestYear` に置換）。articles = R2 `app/blog/all.json`（**2.3 の出力に依存**）。categories = **基盤2**。
- **出力**: 既存2ファイル形式不変（MiniSearch serialized + meta）。本番への可視化影響なし。
- **計算ロジック**: ranking docs（git TS）+ blog docs（R2 snapshot）を `SearchDocument` 化 → MiniSearch index（tokenize/fuzzy/prefix 既存設定維持）→ meta 構築。
- **推奨方式**: pure JS。`drizzle`/`createDatabaseClient`/`schema` 削除、`listAllMetrics`/`getMetricMeta`/`fetchFromR2AsJson`/基盤2 に置換。
- **検証方法**: ranking docs 件数 = `listAllMetrics().filter(active && entities.includes("prefecture")).length` が旧 D1 query 件数と一致。blog docs 件数 = snapshot published 数。meta categories の order が現行 `search-index-meta.json` と完全一致。ローカルでクライアント検索が機能すること（sample query で結果返却）。**依存ゲート: 2.3 → 本スクリプトの順**（all.json が無いと blog docs が空）。

### 2.5 export-port-statistics-snapshot.ts（apps/web/scripts） — 破損 / effort S

- **現在読むもの（破損）**: D1 `schema.ports`（メタ）+ **`schema.statsPort`（Phase 7 で DROP 済・破損点）**。出力 = `app/ports/all.json` / `app/port-statistics/years.json` / `by-year/<year>.json` / `by-port/<port>.json`。
- **DBレス後の入力源**: ports メタ = git TS `apps/ges/scripts/data/ports.json`（**699件・port_code/port_name/prefecture_code/prefecture_name/port_grade/latitude/longitude を確認**）。観測値 = R2 `app/port-statistics/by-year/*.json`（**2010-2023の14ファイル実在**）。
- **出力**: R2 `app/ports/all.json`（**現状欠落**）+ `app/port-statistics/years.json`（**現状欠落**）。`by-year`/`by-port`（699件実在）は**既存維持・再生成不要**。
- **計算ロジック**: ① ports.json を `fs.readFileSync`+`JSON.parse` → `PortMetaRow[]`（型 `snapshot-types.ts`）。② by-year/*.json をバッチ読みして year を降順集約 → `years.json`。③ `all.json` = `{generatedAt, ports[]}`。**D1 query 完全排除**。
- **推奨方式**: pure JS。`administrator` は ports.json に無い → `null`（型 nullable 既定義）。
- **検証方法**: ports.json 港数(699) = R2 `by-port` ファイル数(699・一致確認済)。`years.json` に `["2023"…"2010"]` 降順14件。フロント `load-port-data.ts` の `fetchFromR2AsJson` が `all.json`/`years.json` 取得成功。by-year/by-port は触らないので diff=0。

### 2.6 render-sns-all.ts（apps/remotion/scripts/pipeline） — 破損（degraded fallback あり） / effort S

- **現在読むもの（破損だが try/catch fallback 有）**: D1 `.data/` の SQLite を `findD1Database()` で探し `SELECT key, visualization_config_json FROM metrics`。**失敗時はデフォルトカラースキームで継続**（line 497 の catch、ハード停止はしない）。data.json/ranking_items.json/caption.json は `sns/ranking/<key>/` から既存読み。
- **DBレス後の入力源**: visualization = R2 `app/ranking/<key>/item.json` の **`.item.visualization`**（colorScheme/colorSchemeType/divergingMidpointValue）。**調査JSON提案コードの `item.visualization` 直参照は誤り**——実構造は `JSON.parse(item.json).item.visualization`（top-level `.visualization` は null を確認）。
- **出力**: 変更なし（PNG stills + MP4、Remotion renderer）。
- **計算ロジック**: JOIN 不要。item.json から viz オブジェクトを読み props にセット。
- **推奨方式**: pure JS（`fs.readFile` で `.local/r2/app/ranking/<key>/item.json` 直読み、他 exporter と同パターン）。`better-sqlite3`/`findD1Database`/`loadVizConfigMap` を削除。viz 欠落時は colorScheme デフォルト fallback（現行 catch と同等の挙動を維持）。
- **検証方法**: 任意 ranking key で `npm run pipeline:sns --key <key>` を実行し PNG/MP4 出力。`.item.visualization.colorScheme` が旧 D1 `visualization_config_json` と同値か数件 spot-check（D1 が壊れている今は item.json が新基準）。レンダリング自体は data.json 依存で不変。

## 3. 実装順（依存順）

| 順 | 作業 | 検証ゲート |
|---|---|---|
| 1 | **基盤2** git TS categories.ts | search-index-meta.json と key/order 一致 |
| 2 | **基盤1** R2 item.json ranking-item リーダ | active count が現行配信と一致、型 round-trip OK |
| 3 | **2.6 render-sns-all** + **2.5 export-port** + **2.3 export-blog**（基盤1/2 と独立・並行可） | 各々の出力 R2 key 生成・フロント fetch 成功 |
| 4 | **2.1 calculate-ranking-values**（基盤1 依存） | 代表5キー再計算が現行 values.json と rank ±1 一致 |
| 5 | **2.2 area-profile**（基盤1 依存） | 5県スポットが 2026-05-23 baseline と構造一致 |
| 6 | **2.4 generate-search-index**（基盤2 + 2.3 の all.json 依存） | ranking/blog docs 件数一致、クライアント検索動作 |

各ステップ完了時に `npx tsc --noEmit -p apps/web/tsconfig.json`（+ remotion/ranking/area-profile の該当 tsconfig）で型ゲートを通す。

## 4. 検証戦略

- **前提**: SSD 接続（`.local/r2` symlink モード = `scripts/dev/local-r2-mode.sh ssd`）。観測値・現行 snapshot がローカルに揃う。SSD 非接続時は `fetchFromR2` の S3 fallback で読めるが、突合は SSD 接続で実施。
- **突合の基本形**: 「**再計算結果 vs 現行配信 R2 snapshot**」のファイル単位 diff。旧 D1 経路は壊れているため git diff 0 は目標にしない（正典の owner 判断どおり「R2 配信中 snapshot を正とみなす」）。
- **許容差の考え方**:
  - ranking values: rank はタイブレーク順で ±1 許容、value は相対誤差 1e-6 以内。
  - area-profile: 構造（strength/weakness 件数・rank閾値・rank=0除外）一致が必須。指標数の差は「データ更新由来」として documented diff で許容。
  - port/blog/search-index メタ: 件数（699 / 196 / active metrics数）と key 集合の一致を必須。`generatedAt` 等メタのみの drift は許容。
- **新規 key（all.json / years.json / blog all.json）**: 現行欠落のため「突合相手なし」→ フロントリーダ（`load-port-data.ts` / `blog-snapshot-reader.ts`）が空 fallback せず読めることを成功条件にする。

## 5. リスク・未確定・設計判断が要る点

1. **【要判断】ranking-item SSOT を item.json にするか git TS にするか**: 正典§3では metrics は「Reference = TS registry 再生成」。だが `item.json` は `calculation`/`visualization`/`tags` まで含み**完全DBレスの実用 SSOT として即使える**（2,205件実在）。短期は item.json リーダ（基盤1）、中期は item.json 自体を git TS から生成する経路に寄せるのが正典整合。**この二択を確定する必要あり**。
2. **【調査JSON 誤り訂正】** ① `listRankingValues` は**既に R2-native**（D1 ではない）→ ranking 計算の破損点は `findRankingItemByKey` のみ。② export-blog-snapshot の `isBroken:false` は誤り、**実コードは D1 articles SELECT で破損**。③ render-sns viz は `.item.visualization`（top-level ではない）。
3. **calculate-ranking-values の e-Stat fallback 削除**: 非計算型で観測値欠落時に旧コードは e-Stat 直叩き→`upsertRankingValues`（no-op）。DBレスでは observation populate を `/page-data-batch` に委ねる前提で fallback を削除するが、「欠落キーは空配列で skip」する挙動が area-profile の `emptyValueCount` に出るため、**欠落許容かビルド失敗かのポリシー確認**が要る。
4. **city profile の cities 源**: 旧 city-profile は D1 cities テーブル。git TS `packages/area/src/data/cities.json` に置換可だが、city profile の strength/weakness 計算に必要な city 観測値（`app/stats/<metric>/cities.json`）の網羅性は metric 依存。MVP では prefecture profile を先行、city は後続フェーズが安全。
5. **categories SSOT 重複**: 基盤2（git TS）と D1 categories schema が併存。Phase E（運用エンティティ git TS 化）で D1 schema 側を type-only に降格する整理が別途必要。
6. **generate-search-index の依存連鎖**: blog docs が `app/blog/all.json` 依存のため、2.3 未実行だと検索から blog が消える。CI/ローカルの実行順を `prepare-data` 内で固定すること（export-blog → generate-search-index）。