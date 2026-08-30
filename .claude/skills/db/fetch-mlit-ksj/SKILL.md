---
name: fetch-mlit-ksj
description: 国土数値情報（MLIT KSJ）のデータセットをダウンロードし TopoJSON に変換して R2 に保存する。Use when user says "国土数値情報", "KSJデータ", "fetch-mlit-ksj". GIS レイヤーオーバーレイ用.
disable-model-invocation: true
primary_agent: gis-pipeline-runner
---

国土数値情報（MLIT KSJ）のデータセットをダウンロードし、TopoJSON に変換して R2 に保存する。

> **★完全DBレス (2026-06-21)**: 登録データセットのメタ + ranking 定義の SSOT は git TS
> `packages/gis/src/mlit-ksj/datasets.ts`、技術設定は `registry.ts`。pipelineは両方を直接読み、
> 取得状態は実R2一覧から導出する。SQLiteのstatus/file_countは取得済み判定に使わない。
> 規約: `.claude/rules/gis-data.md`。
> 管理 agent: `gis-curator` (SSOT) / `gis-pipeline-runner` (本スキル実行)。

## 用途

- GIS 機能拡充のためのデータ取得
- ランキングページへのレイヤーオーバーレイ用データ準備
- 防災マップ・施設マップ・交通マップ用データ取得

## 引数

| 引数 | 必須 | 説明 | 例 |
|---|---|---|---|
| `dataId` | ○ | KSJ データセット ID | `N02`, `S12`, `P04` |
| `--pref` | △ | 都道府県コード（県別データの場合） | `13`（東京） |
| `--all-prefs` | △ | 県別配布を全47都道府県取得 | — |
| `--mesh` | △ | 1次メッシュコード | `5339` |
| `--all-meshes` | △ | 公式ページ掲載の全1次メッシュ取得 | — |
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
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts P04 --all-prefs
```

### 1次メッシュ配布の全区画取得

公式詳細ページから対象版の4桁メッシュコードを抽出し、重複排除して全件取得する。

```bash
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts G04-a --all-meshes
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts L03-a --all-meshes
```

### カテゴリ単位一括取得

```bash
npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts --category transport
```

### 公式ページ探索型の公開対象を全件取得

```bash
npm run audit:public-ksj-manifests --workspace packages/gis
npm run acquire:public-ksj --workspace packages/gis -- --apply
npm run check:data-catalog --workspace packages/gis
```

各公式アーカイブにつき `data.topojson` と `manifest.json` をR2へ保存する。完了判定は
`official-policy.ts` の期待アーカイブ数とR2 `manifest.json` 数の一致であり、部分アップロードは未完了。

## 出力先

```
.local/r2/gis/mlit-ksj/{dataId}/{version}/
├── _meta.json           # メタデータ（ライセンス・出典・ファイル情報）
├── _meta/{scope}.json   # 県別・1次メッシュ別provenance
├── national.topojson    # 全国データ（coverage: national の場合）
├── {prefCode}.topojson  # 県別データ（coverage: prefecture の場合）
├── {meshCode}.topojson  # 1次メッシュ配布データ
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

`datasets.ts` にメタ、`registry.ts` に取得設定を追加する。

必要な情報:
- `dataId`: KSJ データ ID（例: `N02`）
- `downloadUrlPattern`: ダウンロード URL テンプレート（`{VERSION}` `{PREF}` プレースホルダ）
- `sourcePageUrl` / `latestVersion`: 公式詳細ページと対象版
- `candidateAliases`: 候補カタログ側のIDが異なる場合
- `geojsonDirInZip`: zip 内の GeoJSON 格納ディレクトリ（`"UTF-8/"` or `""`）
- `simplifyOptions`: ジオメトリ型に応じた簡略化パラメータ

プロパティマッピングは `packages/gis/src/mlit-ksj/property-map.ts` に追加。
参照: https://nlftp.mlit.go.jp/ksj/gml/codelist/shape_property_table2.xlsx

## 留意事項

- 非商用データはローカル取得と公開を分離し、新規public R2反映を止める
- 完了判定は `npm run geo:check-data-catalog`（公式アーカイブ数 = R2完了manifest数、URL・版・alias）
- 大容量データ（N03 行政区域 ~600MB）はダウンロードに時間がかかる
- GeoJSON 非同梱の古いデータセットは ogr2ogr（GDAL）が必要（`brew install gdal`）
- 一時ファイルは /tmp/ に作成し、パイプライン完了後に自動削除される
