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

```
gis/mlit-ksj/{dataId}/{version}/{scope}/
├── data.topojson
└── manifest.json
```

## ジオメトリ型別の実装パターン

| 型 | 既存実装例 | Leaflet コンポーネント |
|---|---|---|
| **point** | PortLeafletMap, FishingPortLeafletMap | CircleMarker + Tooltip |
| **line** | （新規） | GeoJSON + Polyline style |
| **polygon** | LeafletChoroplethMap, ChoroplethGeoJsonLayer | GeoJSON + fillColor/fillOpacity |
| **mesh** | （新規） | Canvas ヒートマップ or GeoJSON グリッド |

## モジュール構成

```
packages/gis/src/mlit-ksj/
├── types.ts           # KsjCodeConfig, KsjResolvedDataset, KsjPipelineOptions 等の型定義
├── datasets.ts        # ★メタ SSOT (git TS): 登録データセットのメタ + ranking 定義 (完全DBレス・2026-06-21)
├── registry.ts        # KSJ_CODE_CONFIG: 技術設定のみ (downloadUrlPattern/propertyMap/simplifyOptions)
├── property-map.ts    # KSJ 属性コード → 人間可読名マッピング（N02_001 → railwayType）
├── r2-path.ts         # R2 保存パス構築
├── downloader.ts      # zip ダウンロード・GeoJSON/Shapefile 抽出
├── mesh-discovery.ts  # 公式詳細ページから配布1次メッシュコードを決定的に抽出
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

- **CC BY 4.0 / 商用可**: stats47 で自由に利用可能
- **CC BY 4.0（一部制限）**: 個別に制限内容を確認
- **非商用**: public R2へ新規保存しない。ローカル利用に限定する
