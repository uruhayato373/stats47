# Geoshape（地理データ管理）ドメイン

日本の地理空間データ（歴史的行政区域データセット）を管理する支援ドメイン。TopoJSON 形式の地理データを外部 API および R2 キャッシュから取得し、アプリケーションに提供する。

## 責務

| 責務 | 説明 |
|------|------|
| 地理データ取得 | 外部 API / R2 から TopoJSON を取得 |
| キャッシュ戦略 | R2 → 外部 API のフォールバック |
| データ提供 | `fetchPrefectureTopology` 等の公開 API |
| データ検証 | TopoJSON の構造検証（`validateTopojson`） |

## レイヤー構造

```
Service (fetchPrefectureTopology, fetchMunicipalityTopology, ...)
  → Repository (fetchTopology)
  → Adapters (fetchTopologyFromR2, fetchFromExternalAPI)
  → R2 / 外部 API
```

- **Service**: 取得順（R2 優先 → 外部 API）と検証を担当。
- **Repository**: 単一ソース（外部 API）からの取得。
- **Adapters**: `fetchTopologyFromR2`（R2）、`fetchFromExternalAPI`（geoshape.ex.nii.ac.jp）。

## データソース

### 外部 API（NII Geoshape）

- 都道府県: `https://geoshape.ex.nii.ac.jp/city/topojson/20230101/jp_pref.l.topojson`
- 市区町村: 同ベース + `{prefCode}/{prefCode}_city_dc.i.topojson`（統合） / `_city.i.topojson`（分割）

パスは `buildGeoshapePathSegment(options)` で一元管理し、`buildGeoshapeExternalUrl(options)` で完全 URL を生成。

### R2 ストレージ構造

外部 API と同一のパス表現（jp_pref.l / city_dc.i 等）で R2 のオブジェクトキーを管理。`buildGeoshapeR2Path(options)` = `"gis/geoshape/" + buildGeoshapePathSegment(options)`。

```
gis/geoshape/
├── 20230101/
│   ├── jp_pref.l.topojson              # 都道府県（低解像度）
│   ├── jp_city_dc.i.topojson           # 全国市区町村（統合版）
│   ├── jp_city.i.topojson              # 全国市区町村（分割版）
│   └── {prefCode2}/
│       ├── {prefCode2}_city_dc.i.topojson  # 都道府県別（統合版）
│       └── {prefCode2}_city.i.topojson     # 都道府県別（分割版）
```

- 環境変数: `NEXT_PUBLIC_R2_GEOSHAPE_URL` または `NEXT_PUBLIC_R2_PUBLIC_URL` / `R2_PUBLIC_URL` をベース URL に使用。

## ドメインモデル（要約）

- **TopoJSONTopology**: `type: "Topology"`, `objects`, `arcs`（`@stats47/types`）
- **GeoshapeOptions**: `areaType`（national / prefecture / city）, `prefCode?`, `wardMode?`（merged / split）
- **DesignatedCityWardMode**: `"merged"`（政令指定都市統合） / `"split"`（区単位）

## 公開 API（@stats47/gis/geoshape）

| 関数 | 説明 |
|------|------|
| `fetchPrefectureTopology(logger?)` | 都道府県 TopoJSON（R2 → 外部 API） |
| `fetchMunicipalityTopology(prefCode, wardMode?, logger?)` | 都道府県別市区町村 TopoJSON |
| `fetchTopologyFromR2(options)` | R2 から直接取得（adapter） |
| `buildGeoshapeExternalUrl(options)` | 外部 API の完全 URL |
| `validateTopojson(data)` | TopoJSON 型ガード |

## 解像度

| 用途 | 記号 | ファイル例 |
|------|------|------------|
| 都道府県 | `l` | jp_pref.l.topojson |
| 市区町村 | `i` | jp_city_dc.i.topojson |

## 関連

- **Area ドメイン**: 地域コード（`extractPrefectureCode` 等）の利用
- 地図表示: apps 側の `PrefectureMapChart` / `RankingMapChart` 等が本ドメインの取得 API を利用
