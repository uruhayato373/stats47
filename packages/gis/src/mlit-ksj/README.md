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
> `npx tsx packages/gis/src/mlit-ksj/scripts/seed-from-registry.ts --dry-run`

## 使い方

```bash
# データセット一覧 (使い捨て SQLite の gis_datasets、status + 統計値マージ表示)
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts --list
npx tsx packages/gis/src/mlit-ksj/scripts/list-datasets.ts
npx tsx packages/gis/src/mlit-ksj/scripts/list-datasets.ts --status=imported
npx tsx packages/gis/src/mlit-ksj/scripts/list-datasets.ts --status=available
npx tsx packages/gis/src/mlit-ksj/scripts/list-datasets.ts --category=transport

# datasets.ts (git TS SSOT) → 使い捨て SQLite を再 seed
npx tsx packages/gis/src/mlit-ksj/scripts/seed-from-registry.ts

# 単一データセット取得（全国）
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts N02

# 県別データセット（単県 / 全47都道府県）
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts P04 --pref 13
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts P04 --all-prefs

# カテゴリ内の全国データを一括取得
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts --category transport
```

## パイプライン処理

```
MLIT zip ダウンロード → /tmp/ に保存
  → GeoJSON 抽出（UTF-8/ ディレクトリ優先）
  → GeoJSON 未検出時は Shapefile から自動変換（shapefile ライブラリ使用）
  → プロパティ名リマップ（KSJ コード → 人間可読名）
  → TopoJSON 変換 + 簡略化（topojson-server + topojson-simplify）
  → .local/r2/gis/mlit-ksj/{dataId}/{version}/ に保存
  → _meta.json 生成（出典・ライセンス・ファイル情報）
  → /tmp/ クリーンアップ
```

## 出力先

```
.local/r2/gis/mlit-ksj/
├── {dataId}/
│   └── {version}/
│       ├── _meta.json           # メタデータ
│       ├── national.topojson    # 全国データ（ファイル1つの場合）
│       ├── {元ファイル名}.topojson  # 複数ファイルの場合
│       └── {prefCode}.topojson  # 県別データの場合
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
├── converter.ts       # GeoJSON → TopoJSON 変換（簡略化含む）
├── pipeline.ts        # オーケストレーター
├── prefecture-assign.ts # ★feature → 都道府県の帰属 (属性 → 空間結合。推測しない)
├── ksj-stats-core.ts  # 県別集計 → app/stats payload の純関数
├── index.ts           # Public API エクスポート
├── adapters/
│   └── fetch-ksj-from-local.ts  # ローカル R2 から TopoJSON 読み込み
└── scripts/
    ├── run-pipeline.ts          # パイプライン CLI。使い捨て SQLite (status='registered'/'imported') を読む
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
   - build state (r2_version / file_count 等) は書かない（pipeline 実行で SQLite に再生成）

2. **registry.ts (`KSJ_CODE_CONFIG`) に技術設定を追加**:
   - `dataId`, `downloadUrlPattern`, `geojsonDirInZip`, `propertyMap`, `simplifyOptions`（省略可）
   - URL パターンは https://jpksj-api.kmproj.com/datasets/{ID}.json で確認可能

3. **property-map.ts** にプロパティマッピングを追加（任意）:
   - 属性定義の参照: https://nlftp.mlit.go.jp/ksj/gml/codelist/shape_property_table2.xlsx

4. **使い捨て SQLite を git TS から再 seed**（手動 INSERT の代替）:
   ```bash
   npx tsx packages/gis/src/mlit-ksj/scripts/seed-from-registry.ts   # datasets.ts → SQLite に UPSERT
   ```

5. **パイプライン実行**（SQLite の build state が status='imported' に更新される）:
   ```bash
   npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts {新DATA_ID}
   ```

## ライセンスと出典表示

公開ページで使用する場合は以下の出典表示が必要:

> 出典: 国土交通省「国土数値情報（{データ名}）」

- **CC BY 4.0 / 商用可**: stats47 で自由に利用可能
- **CC BY 4.0（一部制限）**: 個別に制限内容を確認
- **非商用**: R2 に保存するが、公開可否は別途判断
