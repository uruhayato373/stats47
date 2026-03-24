国土数値情報（MLIT KSJ）のデータセットをダウンロードし、TopoJSON に変換して R2 に保存する。

## 用途

- GIS 機能拡充のためのデータ取得
- ランキングページへのレイヤーオーバーレイ用データ準備
- 防災マップ・施設マップ・交通マップ用データ取得

## 引数

| 引数 | 必須 | 説明 | 例 |
|---|---|---|---|
| `dataId` | ○ | KSJ データセット ID | `N02`, `S12`, `P04` |
| `--pref` | △ | 都道府県コード（県別データの場合） | `13`（東京） |
| `--version` | △ | バージョン指定（デフォルト: latestVersion） | `22` |
| `--all` | △ | 全登録データセットを一括取得 | — |
| `--list` | △ | 登録済みデータセット一覧表示 | — |
| `--category` | △ | カテゴリ単位で一括取得 | `transport` |

## 手順

### 単一データセット取得

```bash
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts <DATA_ID> [options]
```

**例:**

```bash
# 鉄道（全国）
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts N02

# 駅別乗降客数（全国）
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts S12

# 医療機関（東京のみ）
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts P04 --pref 13

# データセット一覧
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts --list
```

### 県別データセットの全県取得

県別データセット（coverage: "prefecture"）の全47都道府県を取得する場合:

```bash
for pref in $(seq -w 1 47); do
  npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts P04 --pref $pref
done
```

### カテゴリ単位一括取得

```bash
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts --category transport
```

## 出力先

```
.local/r2/gis/mlit-ksj/{dataId}/{version}/
├── _meta.json           # メタデータ（ライセンス・出典・ファイル情報）
├── national.topojson    # 全国データ（coverage: national の場合）
├── {prefCode}.topojson  # 県別データ（coverage: prefecture の場合）
└── {filename}.topojson  # zip 内に複数ファイルがある場合は元名を踏襲
```

## パイプライン処理

```
MLIT zip ダウンロード → /tmp/ に保存
  → UTF-8/ ディレクトリから .geojson 抽出
  → プロパティ名リマップ（KSJ コード → 人間可読名）
  → TopoJSON 変換 + 簡略化（topojson-server + topojson-simplify）
  → .local/r2/gis/mlit-ksj/ に保存
  → _meta.json 生成
  → /tmp/ クリーンアップ
```

## 新規データセット追加

`packages/gis/src/mlit-ksj/registry.ts` にデータセット定義を追加する。

必要な情報:
- `dataId`: KSJ データ ID（例: `N02`）
- `downloadUrlPattern`: ダウンロード URL テンプレート（`{VERSION}` `{PREF}` プレースホルダ）
- `geojsonDirInZip`: zip 内の GeoJSON 格納ディレクトリ（`"UTF-8/"` or `""`）
- `simplifyOptions`: ジオメトリ型に応じた簡略化パラメータ

プロパティマッピングは `packages/gis/src/mlit-ksj/property-map.ts` に追加。
参照: https://nlftp.mlit.go.jp/ksj/gml/codelist/shape_property_table2.xlsx

## 計画書

詳細な全体計画は `docs/90_課題管理/mlit-ksj-gis-integration.md` を参照。

## 留意事項

- 非商用データも取得するが、公開時はライセンスを確認すること
- 大容量データ（N03 行政区域 ~600MB）はダウンロードに時間がかかる
- GeoJSON 非同梱の古いデータセットは ogr2ogr（GDAL）が必要（`brew install gdal`）
- 一時ファイルは /tmp/ に作成し、パイプライン完了後に自動削除される
