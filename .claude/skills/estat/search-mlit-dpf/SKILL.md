---
name: search-mlit-dpf
description: 国土交通データプラットフォーム MCP でデータを検索・取得する。Use when user says "国土交通データ", "search-mlit-dpf", "MLIT検索". 36カタログ対応の GIS/統計/インフラデータ.
disable-model-invocation: true
---

国土交通データプラットフォーム MCP サーバー（mlit-dpf-mcp）を使ってデータを検索・取得する。

## 概要

国土交通省が運営する「国土交通データプラットフォーム」(https://data-platform.mlit.go.jp/) の API に MCP 経由でアクセスし、GIS データ・統計データ・インフラデータを検索・取得する。

MCP サーバー: `.mcp.json` の `mlit-dpf-mcp`
API ドキュメント: `/Users/minamidaisuke/mlit-dpf-mcp/README.md`

## 利用可能なカタログ（36カタログ）

### stats47 と親和性の高いカタログ

| カタログ ID | 名称 | データセット数 | 主な内容 |
|---|---|---|---|
| `nlni_ksj` | 国土数値情報 | 63 | 地価公示、鉄道、道路、学校、医療機関、災害区域等（`/fetch-mlit-ksj` と同一ソース）|
| `dpf_statistical_data` | 統計データ（人口・世帯） | 1 | 令和2年国勢調査 |
| `dpf_area_data` | 行政区域データ | 1 | 行政区域 |
| `ipf` | 社会資本情報 | 10 | 空港、官庁施設、公園、河川ダム、砂防 |
| `msil` | 海洋状況表示システム（海しる） | 5 | 港湾、漁港、灯台 |
| `dhb` | ダム便覧 | 1 | ダム情報 |
| `hwq` | 水文水質データベース | 2 | 雨量、水位 |
| `ffd` | 訪日外国人流動データ | 8 | 年度別インバウンド流動 |
| `qol` | 都市QOLデータ | 2 | 都市圏・都道府県 QOL 指標 |
| `gtfs` | GTFSデータリポジトリ | 1 | 公共交通時刻表データ |
| `rdpf` | 道路データプラットフォーム | 2 | 都道府県間OD交通量 |

### インフラ・建設系カタログ

| カタログ ID | 名称 | データセット数 |
|---|---|---|
| `rsdb` | 全国道路施設点検データベース | 7（橋梁・トンネル・シェッド等） |
| `mlit_plateau` | 3D都市モデル（PLATEAU） | 6 |
| `rtc` | 道路交通センサス | 2 |
| `ngi` | 国土地盤情報データベース | 1 |
| `ndm` | 自然災害伝承碑 | 1 |
| `sip4d` | 基盤的防災情報流通ネットワーク | 4（雨量・降雨強度） |
| `cyport` | サイバーポート（港湾インフラ） | 1 |

### その他

| カタログ ID | 名称 | データセット数 |
|---|---|---|
| `karte` | 事業評価カルテシステム | 2 |
| `mcc` | 地方公共団体の工事データ | 1 |
| `lpfs` | 全国幹線旅客純流動調査 | 12 |
| `dimaps` | DiMAPS（災害情報） | 4 |
| `alpc` | 静岡県航空レーザ点群 | 2 |
| `ntrack` | 航空機騒音監視測定 | 9 |
| `psc` | 災害緊急撮影（斜め写真） | 2 |
| `crtc` | 工事実績情報（コリンズデータ） | 1 |
| `nvpf` | 歩行空間ナビゲーション | 1 |
| `mms` | MMS三次元点群データ | 1 |
| `imm` | インフラみらいマップ | 1 |
| `jyubunpc` | 重要文化財点群データ | 1 |
| `kkd` | 熊本県施設管理データベース | 7 |
| `nxc` | 高速道路会社の工事図面データ | 1 |

## MCP ツール一覧

### 検索系

| ツール | 用途 | 主なパラメータ |
|---|---|---|
| `search` | キーワード検索 | `term`, `first`, `size`, `sort_attribute_name`, `sort_order`, `phrase_match`, `minimal` |
| `search_by_location_rectangle` | 矩形範囲で空間検索 | `north`, `south`, `east`, `west`, `term`, `size` |
| `search_by_location_point_distance` | 地点+半径で空間検索 | `lat`, `lon`, `distance`, `term`, `size` |
| `search_by_attribute` | 属性で検索 | `attribute_name`, `attribute_value`, `term`, `size` |

### データ取得系

| ツール | 用途 |
|---|---|
| `get_data` | データの詳細情報を取得 |
| `get_data_summary` | データの基本情報（ID・タイトル等） |
| `get_data_catalog` | カタログ・データセットの詳細 |
| `get_data_catalog_summary` | カタログの基本情報 |
| `get_all_data` | 条件一致する大量データの一括取得 |
| `get_count_data` | 条件一致するデータ件数 |
| `get_suggest` | キーワード候補 |
| `get_mesh` | メッシュデータ取得 |

### ダウンロード系

| ツール | 用途 |
|---|---|
| `get_file_download_urls` | ファイルのダウンロード URL 取得（有効期限60秒） |
| `get_zipfile_download_url` | ZIP ダウンロード URL 取得（有効期限60秒） |
| `get_thumbnail_urls` | サムネイル画像の URL 取得 |

### マスター系

| ツール | 用途 |
|---|---|
| `get_prefecture_data` | 都道府県名・コード一覧 |
| `get_municipality_data` | 市区町村名・コード一覧 |
| `normalize_codes` | 都道府県・市区町村コードの正規化 |

## 手順

### 基本的な使い方

MCP ツールが接続されている場合は、直接ツールを呼び出す:

```
# キーワード検索
search(term="橋梁", size=10, minimal=true)

# 東京都のデータを検索
search_by_attribute(attribute_name="DPF:prefecture_code", attribute_value="13", term="", size=10)

# 特定地点周辺のデータ
search_by_location_point_distance(lat=35.68, lon=139.77, distance=1000, term="", size=10)

# カタログ一覧
get_data_catalog_summary()

# データダウンロード URL
get_file_download_urls(files=[{dataset_id: "...", data_id: "...", file_id: "..."}])
```

### MCP が接続されていない場合

Python スクリプトで直接 API を呼び出す:

```bash
cd /Users/minamidaisuke/mlit-dpf-mcp && \
MLIT_API_KEY="..." MLIT_BASE_URL="https://www.mlit-data.jp/api/v1/" \
.venv/bin/python -c "
import asyncio, json
from src.client import MLITClient

async def main():
    client = MLITClient()
    q = client.build_search(term='鉄道', first=0, size=10, phrase_match=False)
    r = await client.post_query(q)
    print(json.dumps(r, ensure_ascii=False, indent=2))
    await client.close()

asyncio.run(main())
"
```

### 属性フィルタで使える属性名

| 属性名 | 説明 | 例 |
|---|---|---|
| `DPF:catalog_id` | カタログ ID | `nlni_ksj` |
| `DPF:dataset_id` | データセット ID | `nlni_ksj-p04` |
| `DPF:prefecture_code` | 都道府県コード | `13`（東京） |
| `DPF:municipality_code` | 市区町村コード | `13101`（千代田区） |
| `DPF:year` | 年度 | `2024` |
| `DPF:title` | タイトル | `東京タワー` |
| `DPF:updated_at` | 更新日（ソート用） | — |

## `/fetch-mlit-ksj` との関係

- `/fetch-mlit-ksj`: 国土数値情報の Shapefile/GeoJSON を **ダウンロード→TopoJSON 変換→R2 保存** するパイプライン
- `/search-mlit-dpf`: 国土交通データプラットフォーム全体（36カタログ）を **検索・メタデータ取得** する MCP ツール

国土数値情報（`nlni_ksj`）は両方からアクセス可能。MCP 経由では検索・メタデータ取得が便利で、`/fetch-mlit-ksj` は実データの一括ダウンロード・変換に特化。

## 参照

- MCP サーバー: `/Users/minamidaisuke/mlit-dpf-mcp/`
- MCP 設定: `.mcp.json` の `mlit-dpf-mcp`
- API キー: `.mcp.json` 内にハードコード
- 国土交通データプラットフォーム: https://data-platform.mlit.go.jp/
- GIS パイプライン: `docs/01_技術設計/08_国土数値情報GISデータ.md`
