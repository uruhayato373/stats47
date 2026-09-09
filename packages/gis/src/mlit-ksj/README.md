# MLIT KSJ（国土数値情報）モジュール

国土交通省「国土数値情報ダウンロードサービス」の GIS データを、ダウンロード → TopoJSON 変換 → R2 保存する
パイプライン。**このファイルがモジュールの設計・使い方の正典**であり、旧横断設計の内容もここへ統合済み。

- **ソース**: https://nlftp.mlit.go.jp/ksj/index.html
- **スキル**: `/fetch-mlit-ksj`
- **規約 (SSOT・追加規約・DBレス integrity)**: `.claude/rules/gis-data.md`（正典）
- **メタ SSOT (登録データセット一覧の真実源)**: `datasets.ts`（git TS）
- **管理 agent**: `gis-curator`（SSOT 管理）+ `gis-pipeline-runner`（pipeline 実行）
- **完全DBレス**: `docs/01_技術設計/02_データアーキテクチャ.md`

> **登録データセットの一覧は `datasets.ts` が真実源**。旧 doc 04 の自動生成表（`generate-docs.ts`）は
> datasets.ts と重複するため 2026-07-12 に廃止。件数・構造の確認は下記で行う:
> `npm run geo:check-data-catalog`

## 使い方

```bash
# 登録データセット一覧 (git TS SSOT)
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts --list

# 単一データセット取得（全国）
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts N02

# 県別データセット（単県 / 全47都道府県）
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts P04 --pref 13
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts P04 --all-prefs

# 1次メッシュ配布（単区画 / 公式ページ掲載の全区画）
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts G04-a --mesh 5339
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts G04-a --all-meshes

# カテゴリ内の全国データを一括取得
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts --category transport

# 公式ページ探索型の公開利用可能29系統を一括取得・R2保存
npm run acquire:public-ksj --workspace packages/gis -- --apply

# 公式最新版の対象件数がSSOTと一致するか監査
npm run audit:public-ksj-manifests --workspace packages/gis
```

## パイプライン処理

### 単体GISページの原典修復

`scripts/rebuild-source-page-data.ts --data-id P04|C28|N08 --source-dir <公式ZIP保存先>` は、
P04/20の全47県、C28/07の4レイヤー、N08/21の区域・標点をローカルR2へ再生成する。
ZIPは公式配布名のまま一時領域へ保存し、実行はリポジトリルートから `node --import tsx` を付ける。
出典URL・元ZIP SHA・出力SHA・地物数は `app/geo/datasets/<ID>/repair.json` に記録する。
R2への転送はこのスクリプトでは行わない。

P04の属性対応は `property-map.ts` が正典。施設名は002、分類は001、診療科目は004〜006、
開設者分類は007、病床数は008であり、診療科目を県コードとして扱わない。
C28/07のDBFはCP932。N08/21では公式GeoJSONとDBFの備考1件が途中で切れているため、
同梱UTF-8 GMLの関係ID・設置期間・変遷IDを照合して復元する。ZIPのSHAが変われば停止する。
一般の再デコードや名称からの推測では修復しない。

単体ページの確認状況は `.claude/state/geo/source-pages.json`、残作業は
`.claude/todo/backlog.md` の `GEO-SOURCE-PAGES-01` を参照する。

### 単体GISのカード画像

リポジトリルートで `node --import tsx apps/web/scripts/generate-geo-source-thumbnails.ts` を実行する。
入力はローカルの公開catalog/itemと原典GIS（ローカル優先、無ければR2）。
`R2_PUBLIC_FETCH_URL` はWindowsの開発gatewayなどの読み込み先を指定できる。
`--ids L01,N02` で対象を限定できる。出力は `.local/image-staging/geo-thumbnails/`、
機械進捗は `.claude/state/geo/source-thumbnails.json`。元データは変更しない。

表示範囲・版・配布ファイル・表示例ラベルの正典は
`apps/web/src/features/geo-analysis/lib/geo-source-thumbnail.ts`。
全国分布は空港などの疎な地点、詳細は都道府県または地域抜粋で表す。
島しょを除く場合や配布ファイルの一部を使う場合は表示例に明記し、収録範囲と混同しない。
横長16:9（640×360）と正方形1:1（256×256）を同じ地理範囲から各々生成し、
追加のOGP・SNS比率は消費先ができるまで作らない。描画は北上のMercator、地物の間引きなし。
密な流動線は明示した発着地の属性条件で抜粋し、条件と対象地物数をmanifestへ記録する。
全国の空港は原典の標点、狭い保存地区は地域拡大を使う。メッシュの線が色を覆う縮尺では格子線を省く。
標高は固定5段階、100m等の土地利用は原典区分、1km土地利用は最多面積の区分で色分けする。
元GISの形状・属性は保持し、詳細ページの青色表示と色の役割が異なることを一覧で説明する。

`node --import tsx apps/web/scripts/audit-geo-source-thumbnails.ts --browser` で全画像の寸法・SHA・
版/入力系譜・色の付いた画素を確認し、320/390/768/1280/1440pxのカード・検索・リンクを検査する。
画像見本とスクリーンショットは `.local/geo-source-thumbnails/`、検証結果は
`.claude/state/geo/source-thumbnails-audit.json`。本番公開とは別のローカル検証である。
本番反映時は生成に `--plan` を付けてremoteを照合し、
`packages/r2-storage/src/scripts/push-generated-image-set.ts --plan .local/image-generation-publish-plan-geo-thumbnails.json`
へ渡す（2時間有効の共通plan）。既定のローカル生成はアップロード可能なplanを作らない。

別PCの表示では、開発用preview APIがローカルstagingを優先し、ファイルが無ければR2へ転送する。
画像を使うだけなら原典GISの取得や再生成は不要。画像本体とmanifestはR2、生成設定・検証記録はGitで管理する。

ローカルにS3認証が無い場合は、生成・目視確認済みの画像を次の手順で既存CIへ渡す。
1. `node --import tsx apps/web/scripts/sync-geo-source-thumbnails.ts --export /tmp/geo-thumbnails.json`。
   Git上の生成fingerprint・版・入力キーと画像SHAを照合した150objectだけを出力する。
2. bundle全体のSHA256を取り、`geo-thumbnail-transfer-<SHA先頭12桁>` の一時draft releaseへ
   `geo-thumbnails.json` として添付する。画像bundleをGitへcommitしない。
3. `generate-ogp-images.yml` を対象作業ブランチで手動実行する。
   `type=geo-thumbnails`、`staged_asset_id=<添付ファイルのasset ID>`、`staged_sha256=<SHA全体>`、
   `apply=true` を指定する。CIは対象・SHA検証→S3照合→共通publisher dry-run→反映→
   全画像・manifestのS3/public GETによるSHA照合を行う。サイト本体はデプロイしない。
4. artifact `geo-thumbnail-publication` のJSONを
   `.claude/state/geo/source-thumbnails-publication.json` へ取り込み、一時draft releaseを削除する。
   反映失敗時は未完了として残し、再実行時はremote照合からやり直す。

受け渡しでは生成したPCのrendererHashをGitの生成記録で固定し、別OSで再描画しない。
CIは既定でcontents:read。private draftの添付取得はread権限では403になるため、
オーナーの明示承認を得た同期1回だけ画像同期jobにcontents:writeを設定し、終了後に必ずreadへ戻す。
checkoutはpersist-credentials:falseのままにする。添付asset IDを直接指定し、draft自体は公開しない。
CIが参照する設定とfingerprintが変わったbundleは拒否する。R2画像の照合成功と、
GIS索引・原データ・ページ本体の本番公開確認は別の状態として管理する。


```
MLIT zip ダウンロード → /tmp/ に保存
  → GeoJSON 抽出（UTF-8/ ディレクトリ優先）
  → GeoJSON 未検出時は Shapefile から自動変換（shapefile ライブラリ使用）
  → プロパティ名リマップ（KSJ コード → 人間可読名）
  → TopoJSON 変換 + 簡略化（topojson-server + topojson-simplify）
  → .local/r2/gis/mlit-ksj/{dataId}/{version}/ に保存
  → _meta.json または _meta/{prefCode|meshCode}.json 生成（出典URL・版・件数）
  → /tmp/ クリーンアップ
```

## 出力先

```
.local/r2/gis/mlit-ksj/
├── {dataId}/
│   └── {version}/
│       ├── _meta.json           # メタデータ
│       ├── _meta/{scope}.json   # 県別・1次メッシュ別provenance
│       ├── national.topojson    # 全国データ（ファイル1つの場合）
│       ├── {元ファイル名}.topojson  # 複数ファイルの場合
│       └── {prefCode}.topojson  # 県別データの場合
│       └── {meshCode}.topojson  # 1次メッシュ配布の場合
```

公式ページ探索型はR2へ直接、次の単位で保存する。TopoJSONは転送時gzip、`manifest.json` は
元zip URL・sha256・座標系変換・feature数を保持する。公式アーカイブ数とmanifest数が一致した場合だけ取得完了。
再実行ではmanifest宣言objectを照合し、欠損scopeは全再取得、manifest外の旧・partial objectはexact削除する。

```
gis/mlit-ksj/{dataId}/{version}/{scope}/
├── data.topojson
└── manifest.json
```

### 洪水Geo分析の保存先

洪水Geo分析の原典ZIPは例外として`gis/mlit-ksj/A31b/25/source/{riverClass}/{mesh}.zip`に保持する。
`source/_meta.json`はURL・河川区分・メッシュ・SHA・bytesを記録する。旧`source/{mesh}.zip`は
片区分専用のため上書きせず、URL/SHA一致時だけ区分20の新キーへコピーする。
配信結果は`app/geo/population-flood-risk/{item,manifest}.json`と`pref/{NN}.json`。
逐次読込ライブラリの対応環境に合わせ、洪水再生成はNode.js 22以上で実行する。
入力集合と演算の契約は`.claude/rules/geo-analysis-standards.md`を参照する。

## ジオメトリ型別の実装パターン

| 型          | 既存実装例                                   | Leaflet コンポーネント                  |
| ----------- | -------------------------------------------- | --------------------------------------- |
| **point**   | PortLeafletMap, FishingPortLeafletMap        | CircleMarker + Tooltip                  |
| **line**    | （新規）                                     | GeoJSON + Polyline style                |
| **polygon** | LeafletChoroplethMap, ChoroplethGeoJsonLayer | GeoJSON + fillColor/fillOpacity         |
| **mesh**    | （新規）                                     | Canvas ヒートマップ or GeoJSON グリッド |

## モジュール構成

```
packages/gis/src/mlit-ksj/
├── types.ts           # KsjCodeConfig, KsjResolvedDataset, KsjPipelineOptions 等の型定義
├── datasets.ts        # ★メタ SSOT (git TS): 登録データセットのメタ + ranking 定義 (完全DBレス・2026-06-21)
├── registry.ts        # KSJ_CODE_CONFIG: 技術設定のみ (downloadUrlPattern/propertyMap/simplifyOptions)
├── license-policy.ts  # 元データ公開 / 商用成果物 / 公開構造化データのfail-closed判定
├── property-map.ts    # KSJ 属性コード → 人間可読名マッピング（N02_001 → railwayType）
├── r2-path.ts         # R2 保存パス構築
├── downloader.ts      # zip ダウンロード・GeoJSON/Shapefile 抽出
├── mesh-discovery.ts  # 公式詳細ページから配布1次メッシュコードを決定的に抽出
├── published-scope.ts # manifest commit markerとR2 scope完全性の純関数
├── converter.ts       # GeoJSON → TopoJSON 変換（簡略化含む）
├── pipeline.ts        # オーケストレーター
├── prefecture-assign.ts # ★feature → 都道府県の帰属 (属性 → 空間結合。推測しない)
├── ksj-stats-core.ts  # 県別集計 → app/stats payload の純関数
├── index.ts           # Public API エクスポート
├── adapters/
│   └── fetch-ksj-from-local.ts  # ローカル R2 から TopoJSON 読み込み
└── scripts/
    ├── run-pipeline.ts          # パイプライン CLI。datasets.tsを直接読む
    ├── build-data-catalog.ts    # git TS + 実R2 + open-data-catalog → 取得カタログ
    ├── list-datasets.ts         # gis_datasets (使い捨て SQLite) 一覧 CLI (status 集計付き)
    ├── seed-from-registry.ts    # ★datasets.ts (git TS SSOT) → 使い捨て SQLite を決定的に UPSERT 再構築
    ├── seed-ksj-catalog.ts      # 候補 126 件 (ksj-catalog.json) を status='available' で SQLite に投入
    └── generate-ksj-stats-values.ts # ★KSJ topojson → app/stats/<key>/values.json (配信の正典)
```

> **`register-ksj-rankings.ts` は 2026-08-17 に削除した。** 使い捨て SQLite にしか書かないため
> 配信に届かず、しかも県の帰属を最寄りの県庁所在地で決めていて系統的に取り違えていた
> (原子炉の無い京都府に 8 基、八丈島の地熱が神奈川県、秋田・福島が 0)。
> 後継は `generate-ksj-stats-values.ts` で、SQLite を経由せず `app/stats` を直接作る。

> SQLite (`packages/database/.data/stats47.sqlite`) は git TS から再生成可能な**使い捨てビルドキャッシュ**で
> SSOT ではない。永続/リモート D1 ではない。SSOT は **datasets.ts (メタ) + registry.ts (技術設定) + R2 (配信)**。

## ジオメトリの目視確認

旧 `/gis/[dataId]` ビューア（2026-05 削除）の代替として、変換後 TopoJSON を確認する場合:

- `.local/r2/gis/mlit-ksj/{dataId}/{version}/*.topojson` を [geojson.io](https://geojson.io) にドラッグ＆ドロップ
- VS Code の GeoJSON プレビュー拡張で開く
- TopoJSON → GeoJSON 変換が必要な場合は `npx topo2geo` 等

## 新しいデータセットの追加方法

完全DBレス (2026-06-21〜): メタの真実源は **git TS `datasets.ts`**。ローカル SQLite への手動 INSERT は廃止。
新規データセットは以下の順序で追加します（規約の正典: `.claude/rules/gis-data.md` / 担当 agent: `gis-curator`）。

1. **`datasets.ts` の `GIS_DATASETS` にエントリを追加**（メタ + ranking 定義）:

   ```ts
   { dataId: "X99", name: "新データセット名", category: "land", geometryType: "point",
     coverage: "national", license: "cc-by-4.0", stats47Category: "population",
     isRankingTarget: false /* ranking 化するなら true + rankingConfig:[...] */ },
   ```
   - `name_en` は KSJ API 非提供のため不要（seed が空でセット・display 専用）
   - 取得状態やfile_countは書かない（実R2一覧からカタログ生成時に導出）

2. **registry.ts (`KSJ_CODE_CONFIG`) に技術設定を追加**:
   - `dataId`, `downloadUrlPattern`, `geojsonDirInZip`, `propertyMap`, `simplifyOptions`（省略可）
   - URL パターンは https://jpksj-api.kmproj.com/datasets/{ID}.json で確認可能

3. **property-map.ts** にプロパティマッピングを追加（任意）:
   - 属性定義の参照: https://nlftp.mlit.go.jp/ksj/gml/codelist/shape_property_table2.xlsx

4. **パイプライン実行**（取得状態はR2実体から後で導出する）:
   ```bash
   npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts {新DATA_ID}
   # officialPageDiscovery の場合
   npm run acquire:public-ksj --workspace packages/gis -- --data-id {新DATA_ID} --apply
   npm run geo:check-data-catalog
   ```

互換用の旧一覧scriptが必要な場合だけ `seed-from-registry.ts` で使い捨てSQLiteを再構築する。
pipeline本体と取得完了判定には不要。

## ライセンスと出典表示

公開ページで使用する場合は以下の出典表示が必要:

> 出典: 国土交通省「国土数値情報（{データ名}）」

- **CC BY 4.0 / 商用可**: 出典、個別ページURL、取得日、stats47による加工を表示すれば商用利用・公開構造化データに利用可能
- **CC BY 4.0（一部制限）**: 個別条件を確認し、確認完了までpublic R2・公開JSON・有料成果物を止める
- **非商用**: 元データ/TopoJSONはpublic R2へ置かずローカル限定。旧約款上の「非データベースのGIS空間演算結果」は
  出典・加工者表示付きで利用余地があるが、公開JSON/CSV、販売物、広告付きページへの適用は書面確認または商用可ソースへの置換まで止める

判定は`license-policy.ts`を必ず使う。`build-data-catalog.ts check`はpublic R2にlocal-onlyデータを見つけると失敗し、
`generate-ksj-stats-values.ts`とGeo bundle生成は公開構造化データを許可しない入力で書き込み前に停止する。
