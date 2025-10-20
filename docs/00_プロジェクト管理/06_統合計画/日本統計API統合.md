# 日本の統計API統合計画 - e-Stat以外のデータソース

## 📋 目次

1. [概要](#概要)
2. [調査したAPIサービス](#調査したapiサービス)
3. [API比較表](#api比較表)
4. [実行可能性評価](#実行可能性評価)
5. [推奨API](#推奨api)
6. [統合アーキテクチャ設計](#統合アーキテクチャ設計)
7. [実装例](#実装例)
8. [データベース設計](#データベース設計)
9. [実装ロードマップ](#実装ロードマップ)
10. [リスクと対策](#リスクと対策)
11. [結論](#結論)

---

## 概要

### 目的

このプロジェクト（stats47）に、**e-Stat API以外の日本の統計データソース**を統合し、**様々な統計を一元化**することを目指します。

### 背景

現在、プロジェクトはe-Stat APIを使用して日本の公式統計データを取得していますが、以下のような追加データソースが存在します：

1. **気象データ**: 気象庁の天気予報・過去の気象データ
2. **地域経済データ**: RESAS（地域経済分析システム）
3. **地理空間データ**: 国土交通省の国土数値情報
4. **交通事故統計**: 警察庁のオープンデータ
5. **医療・福祉統計**: 厚生労働省のNDBオープンデータ
6. **環境データ**: 環境省の大気汚染データ
7. **農業データ**: 農林水産省のオープンAPI
8. **地方自治体データ**: 東京都などのオープンデータAPI

### 期待される効果

- **データの多様性**: 気象、経済、環境など多角的な統計を提供
- **リアルタイム性**: 天気予報、大気汚染などのリアルタイムデータ
- **地域詳細度**: 市区町村レベルの詳細データ
- **ユーザー価値の向上**: より豊富なデータによる深い洞察
- **統計の一元化**: 複数のデータソースを1つのプラットフォームで提供

---

## 調査したAPIサービス

### 1. 気象庁 天気予報・気象データ

**概要**: 気象庁が提供する天気予報・過去の気象データ（非公式API）

**公式サイト**:
- 気象データ高度利用ポータル: https://www.data.jma.go.jp/developer/index.html
- 天気予報JSON: https://www.jma.go.jp/bosai/

**主要機能**:
- 天気予報データ（JSON形式）
- AMeDAS観測データ
- 予報区データ
- 気象警報・注意報

**データ形式**: JSON

**認証**: 不要

**利用条件**: 政府標準利用規約に準拠（完全無料）

**レート制限**: 明記なし

**エンドポイント例**:
```
# エリアコード取得
https://www.jma.go.jp/bosai/common/const/area.json

# 天気予報データ
https://www.jma.go.jp/bosai/forecast/data/forecast/{area_code}.json

# AMeDASデータ
https://www.jma.go.jp/bosai/amedas/data/map/{YYYYMMDDHH0000}.json
```

**データ例**:
- 天気予報（3日間）
- 気温、降水確率
- 風向、風速
- 週間天気予報

**注意事項**:
⚠️ **非公式API**: 気象庁は「APIではない」と明示（仕様の継続性を保証しない）
✅ **実用性**: 2021年以降安定して稼働、多数の利用事例あり

**実行可能性**: ⭐⭐⭐⭐ (高い - ただし仕様変更リスクあり)

---

### 2. RESAS API（地域経済分析システム）❌ **サービス終了**

**概要**: 経済産業省・内閣官房が提供する地域経済データAPI

**公式サイト**:
- RESAS API: https://opendata.resas-portal.go.jp/
- RESAS Portal: https://resas-portal.go.jp/

**⚠️ 重要: サービス終了情報**:
- **新規登録停止**: 2024年10月31日
- **完全サービス終了**: 2025年3月24日
- **RESAS本体（Webサイト）**: 継続運用中
- **理由**: データプロバイダーからのダウンロード機能拡充のため

**主要機能**:
- 人口構成データ
- 産業構造データ
- 企業活動データ
- 観光データ（700万事業所、12万件の観光資源）
- 地域経済循環図

**データ形式**: JSON

**認証**: 必要（APIキー）

**利用条件**:
- 無料（利用者登録が必要）
- 登録後、メールでAPIキーが発行される

**レート制限**: 明記なし（適切な使用を推奨）

**データ例**:
- 都道府県別・市区町村別の人口推移
- 産業別の企業数・売上
- 観光入込客数
- 地域間の経済循環

**更新**: 2025年3月に新システム稼働（描画速度向上、スマホ対応）

**実行可能性**: ❌ **利用不可**（2025年3月24日に終了）

**代替案**: 国土交通省DPF GraphQL API（後述）

---

### 3. 国土交通省 国土数値情報 API

**概要**: 国土数値情報のオープンデータとWeb API

**公式サイト**:
- ダウンロードサイト: https://nlftp.mlit.go.jp/ksj/
- API仕様書: http://nlftp.mlit.go.jp/ksj/api/specification_api_ksj.pdf

**主要機能**:
- 行政区域データ
- 道路、鉄道、河川データ
- 土地利用データ
- 防災関連データ
- 公共施設データ

**データ形式**: Shapefile, XML, GeoJSON, JPGIS2.1

**認証**: 不要

**利用条件**: 無料（商用利用は個別確認推奨）

**レート制限**: 明記なし

**データ例**:
- 都道府県界、市区町村界
- 道路網、鉄道路線
- 河川、湖沼
- 土地利用区分
- ハザードマップ

**実行可能性**: ⭐⭐⭐⭐ (高い)

**注意事項**:
- データサイズが大きい（GISデータ）
- Shapefileの処理が必要

---

### 4. 警察庁 交通事故統計オープンデータ

**概要**: 全国の交通事故統計データ

**公式サイト**:
- 警察庁: https://www.npa.go.jp/publications/statistics/koutsuu/opendata/index_opendata.html
- API: https://opendataapi.jp/data/providers/npa/datasets/traffic_accident/latest/

**主要機能**:
- 事故発生地点データ
- 事故類型別統計
- 都道府県別・市区町村別統計
- 時間帯別・曜日別統計

**データ形式**: CSV, JSON (API経由)

**認証**: 不要（API経由の場合）

**利用条件**: 政府標準利用規約（無料）

**レート制限**: 明記なし

**データ年度**: 2019年～2024年（2025年は年度末に公開予定）

**データ例**:
- 事故件数、死傷者数
- 事故地点の緯度経度
- 事故原因、事故類型
- 年齢層別統計

**実行可能性**: ⭐⭐⭐⭐ (高い)

---

### 5. 厚生労働省 NDBオープンデータ

**概要**: 医療・介護の統計データ（National Database）

**公式サイト**:
- NDBオープンデータ: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000177182.html
- 介護サービス情報: https://www.mhlw.go.jp/stf/kaigo-kouhyou_opendata.html

**主要機能**:
- レセプト（診療報酬）データ
- 特定健診データ
- 介護サービス施設データ
- 医療施設統計

**データ形式**: CSV

**認証**: 不要（ダウンロード形式）

**利用条件**: 無料、商用・非商用問わず利用可

**更新頻度**: 年1～2回（最新: 2025年5月30日）

**データ例**:
- 診療行為別の件数・点数
- 都道府県別の医療費
- 年齢階級別の受診状況
- 介護サービス事業所情報

**実行可能性**: ⭐⭐⭐ (中程度 - API形式ではない、CSVダウンロード)

**注意事項**:
- リアルタイムAPIではない（定期更新のCSV）
- データサイズが非常に大きい

---

### 6. 環境省 大気汚染データ（そらまめ君）

**概要**: 全国の大気汚染物質の測定データ

**公式サイト**:
- そらまめ君: http://soramame.env.go.jp/
- 国立環境研究所: https://tenbou.nies.go.jp/gis/realtime/

**主要機能**:
- PM2.5濃度
- PM10濃度
- NO2, SO2, CO, O3など
- リアルタイム観測データ
- 大気汚染予測

**データ形式**: JSON（非公式スクレイピング）

**認証**: 不要

**利用条件**: 政府標準利用規約（無料）

**レート制限**: 明記なし（スクレイピングは控えめに）

**データ例**:
- 測定局別のPM2.5濃度
- 時間別の大気汚染指数（AQI）
- 都道府県別の大気質

**実行可能性**: ⭐⭐⭐ (中程度 - 公式APIなし、スクレイピング必要)

**注意事項**:
⚠️ 公式APIは存在しない
✅ サードパーティAPI（aqicn.org）が利用可能

---

### 7. 農林水産省 オープンAPI

**概要**: 農業データのオープンAPI

**公式サイト**:
- オープンAPI: https://www.maff.go.jp/j/kanbo/smart/openapi.html
- WAGRI: https://wagri.naro.go.jp/

**主要機能**:
- 農産物卸売市場データ
- 畜産物卸売市場データ
- 市場価格情報
- 農業機械データ連携

**データ形式**: JSON

**認証**: 不要（一部APIは要登録）

**利用条件**: 無料

**レート制限**: 明記なし

**データ例**:
- 野菜・果物の市場価格
- 畜産物（豚肉・牛肉）の卸売価格
- 農産物の取引量

**実行可能性**: ⭐⭐⭐⭐ (高い)

---

### 8. 東京都オープンデータ API

**概要**: 東京都が提供するオープンデータAPI

**公式サイト**:
- オープンデータカタログ: https://portal.data.metro.tokyo.lg.jp/
- APIカタログ: https://spec.api.metro.tokyo.lg.jp/spec/search

**主要機能**:
- 約35,000件のCSVファイルをAPI化
- 新型コロナウイルス統計
- 公共交通情報
- 社会福祉施設データ
- 避難所データ
- デジタルツイン3D点群データ

**データ形式**: JSON, XML

**認証**: 不要

**利用条件**: クリエイティブ・コモンズライセンス（無料）

**レート制限**: 明記なし

**データ例**:
- 都内の人口統計
- 施設データ（公園、図書館など）
- 公共交通の運行情報
- 防災関連データ

**実行可能性**: ⭐⭐⭐⭐⭐ (非常に高い)

**特徴**:
- **ユーザー登録不要**
- すぐに使えるAPI
- JSON/XML形式で出力
- カラムフィルタリング、日付範囲指定可能

---

### 9. e-Govデータポータル（旧DATA.GO.JP）

**概要**: 政府全体のオープンデータカタログ

**公式サイト**:
- e-Govデータポータル: https://data.e-gov.go.jp/
- API情報: https://www.data.go.jp/for-developer/for-developer/

**主要機能**:
- 各府省庁のオープンデータへのリンク
- CKAN APIによるメタデータ取得
- 全文検索機能
- カテゴリー別検索

**データ形式**: JSON（メタデータ）、各データセットは個別形式

**認証**: 不要

**利用条件**: 無料

**レート制限**: 明記なし

**データ例**:
- データセットのメタデータ
- 府省庁別のデータカタログ
- カテゴリー別の統計データ

**実行可能性**: ⭐⭐⭐ (中程度 - カタログのみ、実データは各APIから取得)

**注意事項**:
- データカタログの役割（実データは各府省庁のAPIから取得）
- CKAN APIを使用

---

### 10. 不動産情報ライブラリ API

**概要**: 国土交通省の不動産取引価格・地価データAPI

**公式サイト**: https://www.reinfolib.mlit.go.jp/

**主要機能**:
- 不動産取引価格情報
- 地価公示・地価調査
- 国土数値情報
- 都道府県・市区町村一覧

**データ形式**: JSON, XML

**認証**: 不要

**利用条件**: 無料

**レート制限**: 明記なし

**データ例**:
- 不動産取引価格（土地、建物）
- 地価公示価格
- 市区町村コード

**実行可能性**: ⭐⭐⭐⭐ (高い)

---

### 11. 国土交通省DPF（Data Platform for Society）GraphQL API

**概要**: 国土交通省が提供する新しいデータプラットフォームのGraphQL API

**公式サイト**:
- 国土交通省DPF: https://www.mlit-data.jp/
- API仕様書: https://www.mlit-data.jp/api_docs/

**⚠️ 重要**: RESAS API終了に伴う推奨代替APIです。

**主要機能**:
- 都道府県・市区町村コードAPI
- 建設・建築データ
- 道路・交通データ
- GTFS公共交通データ
- PLATEAU 3D都市モデルデータ
- 地域経済データ（RESAS代替）

**データ形式**: GraphQL（JSON）

**認証**: 必要（アカウント登録）
- 登録手順: 2ステップで簡単登録
- アカウント作成後、APIキー発行

**利用条件**: 無料

**レート制限**: 明記なし

**データ例**:
- 都道府県・市区町村マスタデータ
- 建設工事情報
- 道路交通センサスデータ
- 公共交通オープンデータ（GTFS）
- 3D都市モデル（PLATEAU）

**最新バージョン**: v3.3（2025年3月26日リリース）

**実行可能性**: ⭐⭐⭐⭐ (高い)

**特徴**:
- **GraphQL採用**: 必要なデータのみ効率的に取得可能
- **RESAS代替**: 地域経済データを含む包括的なプラットフォーム
- **継続的な更新**: 定期的なバージョンアップと機能追加
- **公式API**: 国土交通省が正式に提供・運用

**エンドポイント例**:
```graphql
# 都道府県一覧取得
query {
  prefectures {
    code
    name
    region
  }
}

# 市区町村データ取得
query {
  cities(prefectureCode: "13") {
    code
    name
    population
  }
}
```

---

## API比較表

| API名 | 無料 | 認証 | データ形式 | リアルタイム性 | 都道府県データ | 市区町村データ | 実行可能性 | 備考 |
|-------|------|------|----------|-------------|------------|-----------|-----------|------|
| **気象庁（天気予報）** | ✅ | 不要 | JSON | ⭐⭐⭐⭐⭐ | ✅ | ✅ | ⭐⭐⭐⭐ | 非公式API、仕様変更リスク |
| **~~RESAS~~** | ✅ | 要 | JSON | ⭐⭐ | ✅ | ✅ | ❌ | **2025年3月24日サービス終了** |
| **国土交通省DPF** | ✅ | 要 | GraphQL | ⭐⭐⭐ | ✅ | ✅ | ⭐⭐⭐⭐ | RESAS代替、GraphQL |
| **国土数値情報** | ✅ | 不要 | Shapefile/GeoJSON | ⭐ | ✅ | ✅ | ⭐⭐⭐⭐ | GISデータ、大容量 |
| **警察庁（交通事故）** | ✅ | 不要 | CSV/JSON | ⭐⭐ | ✅ | ✅ | ⭐⭐⭐⭐ | 年度単位更新 |
| **厚労省（NDB）** | ✅ | 不要 | CSV | ⭐ | ✅ | 部分的 | ⭐⭐⭐ | CSV大容量、API無し |
| **環境省（そらまめ君）** | ✅ | 不要 | JSON | ⭐⭐⭐⭐⭐ | ✅ | ✅ | ⭐⭐⭐ | 公式APIなし |
| **農水省（オープンAPI）** | ✅ | 不要 | JSON | ⭐⭐⭐ | ✅ | - | ⭐⭐⭐⭐ | 農業・市場価格 |
| **東京都オープンデータ** | ✅ | 不要 | JSON/XML | ⭐⭐⭐ | - | ✅ | ⭐⭐⭐⭐⭐ | 東京都のみ、非常に使いやすい |
| **e-Govデータポータル** | ✅ | 不要 | JSON | - | - | - | ⭐⭐⭐ | カタログのみ |
| **不動産情報ライブラリ** | ✅ | 不要 | JSON/XML | ⭐⭐ | ✅ | ✅ | ⭐⭐⭐⭐ | 不動産・地価データ |

### 評価基準

- **リアルタイム性**: データの更新頻度と即時性
  - ⭐⭐⭐⭐⭐: リアルタイム～数時間
  - ⭐⭐⭐⭐: 日次更新
  - ⭐⭐⭐: 週次～月次更新
  - ⭐⭐: 四半期～半年更新
  - ⭐: 年次更新

- **実行可能性**: 実装の容易さと信頼性
  - ⭐⭐⭐⭐⭐: 非常に高い（公式API、ドキュメント充実、認証不要）
  - ⭐⭐⭐⭐: 高い（公式API、認証必要または一部制約）
  - ⭐⭐⭐: 中程度（API形式でない、または非公式API）
  - ⭐⭐: 低い（実装に工夫が必要）
  - ⭐: 非常に低い（推奨しない）

---

## 実行可能性評価

### ✅ 実行可能なAPI（優先度順）

#### 🥇 Phase 1: 最優先（すぐに統合すべき）

1. **国土交通省DPF GraphQL API** ⭐⭐⭐⭐
   - **理由**: 公式API、地域経済データが豊富、RESAS代替、GraphQL採用
   - **統合価値**: e-Statでカバーできない地域経済・建設・交通データ
   - **技術的難易度**: 中（GraphQL、認証必要）
   - **実装工数**: 60時間（1.5週間）
   - **注意**: RESAS API終了に伴う推奨代替API

2. **東京都オープンデータAPI** ⭐⭐⭐⭐⭐
   - **理由**: 認証不要、使いやすいAPI、データ豊富
   - **統合価値**: 東京都の詳細データ（他の自治体も同様のパターンで拡張可能）
   - **技術的難易度**: 低い（RESTful JSON API）
   - **実装工数**: 40時間（1週間）

3. **気象庁 天気予報API** ⭐⭐⭐⭐
   - **理由**: 気象データは統計可視化に有用、データ取得が容易
   - **統合価値**: e-Statにない気象データ、リアルタイム性
   - **技術的難易度**: 中（非公式APIのため仕様変更リスク）
   - **実装工数**: 40時間（1週間）

4. **不動産情報ライブラリAPI** ⭐⭐⭐⭐
   - **理由**: 公式API、不動産・地価データが充実
   - **統合価値**: e-Statでカバーできない不動産取引の詳細データ
   - **技術的難易度**: 低い（RESTful JSON API）
   - **実装工数**: 40時間（1週間）

#### 🥈 Phase 2: 高優先（追加機能として統合）

5. **国土交通省 国土数値情報API** ⭐⭐⭐⭐
   - **理由**: 地理空間データが豊富、公式API
   - **統合価値**: GIS統合、地図の高度化
   - **技術的難易度**: 中（GISデータ処理が必要）
   - **実装工数**: 80時間（2週間）

6. **警察庁 交通事故統計** ⭐⭐⭐⭐
   - **理由**: 安全・防災カテゴリーのデータ充実
   - **統合価値**: 地域の安全性評価
   - **技術的難易度**: 低い（CSV/JSON）
   - **実装工数**: 40時間（1週間）

7. **農林水産省 オープンAPI** ⭐⭐⭐⭐
   - **理由**: 農業・市場価格データ
   - **統合価値**: 農業統計の強化
   - **技術的難易度**: 低い（RESTful JSON API）
   - **実装工数**: 40時間（1週間）

#### 🥉 Phase 3: 中優先（特定用途向け）

8. **環境省 そらまめ君（大気汚染）** ⭐⭐⭐
   - **理由**: リアルタイム環境データ、健康関連統計
   - **統合価値**: 環境・健康カテゴリーの充実
   - **技術的難易度**: 中～高（公式APIなし、スクレイピングまたはサードパーティAPI）
   - **実装工数**: 60時間（1.5週間）

9. **厚生労働省 NDBオープンデータ** ⭐⭐⭐
   - **理由**: 医療・介護の詳細データ
   - **統合価値**: 健康・医療カテゴリーの強化
   - **技術的難易度**: 高（大容量CSV、API形式でない）
   - **実装工数**: 100時間（2.5週間）

#### ❌ Phase X: 保留（統合優先度低い）

10. **e-Govデータポータル** ⭐⭐⭐
    - **理由**: カタログのみ、実データは各APIから取得
    - **統合価値**: 低い（メタデータ検索用途）
    - **技術的難易度**: 低い
    - **実装工数**: 20時間（0.5週間）

---

### 実行可能性の根拠

#### 技術的実行可能性

1. **既存インフラとの互換性**:
   - 現在のe-Stat API統合パターンを再利用可能
   - TypeScript型定義、HTTPクライアント、データフォーマッターが流用可能
   - Next.js 15 + React 19のアーキテクチャと完全互換

2. **認証の簡便性**:
   - 大半のAPIが認証不要または簡単な登録（RESASのみAPIキー必要）
   - APIキー管理は環境変数で対応可能

3. **データ形式の標準性**:
   - ほぼすべてのAPIがJSON形式をサポート
   - CSVデータもパース可能
   - GISデータは専用ライブラリで処理可能

#### コスト面の実行可能性

- すべてのAPIが**完全無料**
- 追加のインフラコスト不要（Cloudflare D1で対応可能）
- レート制限がほぼ明記なし = 寛容な利用条件

#### データ品質の実行可能性

- すべてのAPIが**政府機関・公的機関**が提供
- データの信頼性が高い
- 更新頻度が適切（リアルタイム～年次）

---

## 推奨API

### ~~最優先: RESAS API~~（❌ サービス終了）

**⚠️ 重要**: RESAS APIは2025年3月24日にサービス終了しました。代替として**国土交通省DPF GraphQL API**を推奨します。

---

### 最優先: 国土交通省DPF GraphQL API

**選定理由**:

1. **公式API**: 国土交通省が正式に提供・運用
2. **RESAS代替**: 地域経済データを含む包括的なデータプラットフォーム
3. **GraphQL採用**: 必要なデータのみ効率的に取得可能
4. **データの豊富さ**: 建設、交通、地域経済、3D都市モデルなど多角的
5. **地域詳細度**: 都道府県・市区町村レベルのデータ
6. **無料利用**: アカウント登録のみで完全無料
7. **継続的な更新**: 定期的なバージョンアップ（最新: v3.3）

**基本的なAPI呼び出し構造**:

```
POST https://www.mlit-data.jp/api/graphql
```

**例**:
```graphql
# 都道府県一覧取得
query {
  prefectures {
    code
    name
    region
  }
}

# 市区町村データ取得
query {
  cities(prefectureCode: "13") {
    code
    name
    population
  }
}

# 建設工事データ取得
query {
  constructionProjects(prefectureCode: "13", year: 2024) {
    projectName
    budget
    startDate
    endDate
  }
}
```

**データカテゴリー**:
- 行政区画: 都道府県・市区町村マスタデータ
- 建設: 建設工事情報、建築データ
- 交通: 道路交通センサス、公共交通（GTFS）
- 地域経済: 人口、産業構造（RESAS代替）
- 都市: PLATEAU 3D都市モデル

---

## 統合アーキテクチャ設計

### 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                     フロントエンド                        │
│  (Next.js 15 + React 19 + TypeScript + Tailwind CSS 4)  │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │          既存コンポーネント                          │   │
│  │  - EstatRanking                                │   │
│  │  - ChoroplethMap                               │   │
│  │  - SubcategoryLayout                           │   │
│  └─────────────────────────────────────────────────┘   │
│                          ↓                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │          新規コンポーネント                          │   │
│  │  - WeatherWidget (気象データ)                    │   │
│  │  - ResasEconomyDashboard (経済データ)            │   │
│  │  - TrafficAccidentMap (交通事故データ)           │   │
│  │  - RealEstateChart (不動産データ)                │   │
│  │  - EnvironmentalQualityCard (環境データ)         │   │
│  └─────────────────────────────────────────────────┘   │
│                          ↓                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │           データフェッチ層（useSWR）                │   │
│  │  - useEstatData() (既存)                        │   │
│  │  - useResasData() (新規)                        │   │
│  │  - useWeatherData() (新規)                      │   │
│  │  - useTrafficAccidentData() (新規)              │   │
│  │  - useRealEstateData() (新規)                   │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      Next.js API Routes                 │
│  /api/estat/* (既存)                                    │
│  /api/resas/* (新規)                                     │
│  /api/weather/* (新規)                                   │
│  /api/traffic-accidents/* (新規)                         │
│  /api/real-estate/* (新規)                               │
│  /api/environment/* (新規)                               │
│  /api/agriculture/* (新規)                               │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │        統合APIクライアント                           │   │
│  │  - EstatClient (既存)                           │   │
│  │  - MlitDpfGraphQLClient (新規) ← RESAS代替      │   │
│  │  - JmaWeatherClient (新規)                      │   │
│  │  - NpaTrafficClient (新規)                      │   │
│  │  - MlitRealEstateClient (新規)                  │   │
│  │  - EnvAirQualityClient (新規)                   │   │
│  │  - MaffAgricultureClient (新規)                 │   │
│  └─────────────────────────────────────────────────┘   │
│                          ↓                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │           データフォーマッター                       │   │
│  │  - 各APIのレスポンスを統一形式に変換                │   │
│  │  - MlitDpfFormatter (RESAS代替)                 │   │
│  │  - WeatherFormatter                             │   │
│  │  - TrafficFormatter                             │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Cloudflare D1 Database                │
│                                                           │
│  既存テーブル:                                             │
│  - estat_meta_info                                       │
│  - estat_data_cache                                      │
│  - users                                                 │
│                                                           │
│  新規テーブル:                                             │
│  - api_data_cache (統合キャッシュ)                        │
│  - mlit_dpf_data (RESAS代替)                             │
│  - weather_data                                          │
│  - traffic_accident_data                                 │
│  - real_estate_data                                      │
│  - environment_data                                      │
│  - agriculture_data                                      │
│                                                           │
└───────────────────────────┬─────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                     外部API                              │
│                                                           │
│  既存:                                                    │
│  - e-Stat API                                            │
│                                                           │
│  新規:                                                    │
│  - 国土交通省DPF GraphQL API (RESAS代替)                  │
│  - 気象庁 天気予報JSON                                    │
│  - 警察庁 交通事故統計API                                 │
│  - 国土交通省 不動産情報ライブラリAPI                       │
│  - 国土交通省 国土数値情報API                             │
│  - 環境省 そらまめ君 (サードパーティAPI)                  │
│  - 農林水産省 オープンAPI                                 │
│  - 東京都 オープンデータAPI                               │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

### ディレクトリ構造

```
stats47/
├── src/
│   ├── app/
│   │   ├── [category]/            # 既存カテゴリーページ
│   │   │   └── [subcategory]/
│   │   ├── weather/               # 新規: 気象データページ
│   │   │   ├── page.tsx
│   │   │   └── [prefecture]/
│   │   │       └── page.tsx
│   │   ├── economy/               # 新規: 地域経済ページ（RESAS）
│   │   │   ├── page.tsx
│   │   │   └── [prefecture]/
│   │   │       └── page.tsx
│   │   ├── safety/                # 新規: 安全・交通事故ページ
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── estat/             # 既存
│   │       ├── mlit-dpf/        # 新規: 国土交通省DPF (RESAS代替)
│   │       │   ├── prefectures/
│   │       │   │   └── route.ts
│   │       │   ├── cities/
│   │       │   │   └── route.ts
│   │       │   └── construction/
│   │       │       └── route.ts
│   │       ├── weather/
│   │       │   ├── forecast/
│   │       │   │   └── route.ts
│   │       │   └── amedas/
│   │       │       └── route.ts
│   │       ├── traffic-accidents/
│   │       │   └── route.ts
│   │       ├── real-estate/
│   │       │   └── route.ts
│   │       └── agriculture/
│   │           └── route.ts
│   │
│   ├── lib/
│   │   ├── estat-api/             # 既存
│   │   ├── mlit-dpf-api/          # 新規: 国土交通省DPF (RESAS代替)
│   │   │   ├── client/
│   │   │   │   ├── mlit-dpf-client.ts
│   │   │   │   └── graphql-client.ts
│   │   │   ├── formatter/
│   │   │   │   └── mlit-dpf-formatter.ts
│   │   │   ├── cache/
│   │   │   │   └── cache-manager.ts
│   │   │   ├── types/
│   │   │   │   ├── prefecture.ts
│   │   │   │   ├── city.ts
│   │   │   │   └── construction.ts
│   │   │   └── constants.ts
│   │   ├── weather-api/           # 新規
│   │   │   ├── client/
│   │   │   │   └── jma-client.ts
│   │   │   ├── formatter/
│   │   │   │   └── weather-formatter.ts
│   │   │   └── types/
│   │   │       └── weather.ts
│   │   ├── traffic-api/           # 新規
│   │   │   └── client/
│   │   │       └── npa-client.ts
│   │   ├── real-estate-api/       # 新規
│   │   │   └── client/
│   │   │       └── mlit-client.ts
│   │   ├── environment-api/       # 新規
│   │   │   └── client/
│   │   │       └── env-client.ts
│   │   └── agriculture-api/       # 新規
│   │       └── client/
│   │           └── maff-client.ts
│   │
│   ├── components/
│   │   ├── subcategories/         # 既存
│   │   ├── weather/               # 新規: 気象コンポーネント
│   │   │   ├── WeatherWidget.tsx
│   │   │   ├── ForecastCard.tsx
│   │   │   └── AmedasChart.tsx
│   │   ├── economy/               # 新規: 経済コンポーネント
│   │   │   ├── ResasEconomyDashboard.tsx
│   │   │   ├── PopulationPyramid.tsx
│   │   │   ├── IndustryStructureChart.tsx
│   │   │   └── TourismDataCard.tsx
│   │   ├── safety/                # 新規: 安全コンポーネント
│   │   │   ├── TrafficAccidentMap.tsx
│   │   │   └── AccidentStatisticsCard.tsx
│   │   ├── real-estate/           # 新規: 不動産コンポーネント
│   │   │   ├── RealEstateChart.tsx
│   │   │   └── LandPriceMap.tsx
│   │   └── environment/           # 新規: 環境コンポーネント
│   │       ├── AirQualityCard.tsx
│   │       └── PM25Chart.tsx
│   │
│   ├── hooks/
│   │   ├── estat/                 # 既存
│   │   ├── mlit-dpf/              # 新規: 国土交通省DPF (RESAS代替)
│   │   │   ├── useMlitDpfPrefectures.ts
│   │   │   ├── useMlitDpfCities.ts
│   │   │   └── useMlitDpfConstruction.ts
│   │   ├── weather/               # 新規
│   │   │   ├── useWeatherForecast.ts
│   │   │   └── useAmedasData.ts
│   │   ├── traffic/               # 新規
│   │   │   └── useTrafficAccidents.ts
│   │   ├── real-estate/           # 新規
│   │   │   └── useRealEstateData.ts
│   │   └── environment/           # 新規
│   │       └── useAirQuality.ts
│   │
│   └── types/
│       ├── estat.ts               # 既存
│       ├── mlit-dpf.ts            # 新規: 国土交通省DPF (RESAS代替)
│       ├── weather.ts             # 新規
│       ├── traffic.ts             # 新規
│       ├── real-estate.ts         # 新規
│       └── environment.ts         # 新規
│
├── database/
│   ├── schemas/
│   │   ├── main.sql               # 既存
│   │   └── japan-stats-apis.sql  # 新規
│   └── migrations/
│       └── 2025XXXX_add_japan_stats_api_tables.sql
│
└── docs/
    └── 00_project_overview/
        ├── world-statistics-api-integration-plan.md  # 既存
        └── japan-statistics-api-integration-plan.md  # このドキュメント
```

---

## 実装例

### 1. 国土交通省DPF GraphQL API クライアント（RESAS代替）

```typescript
// src/lib/mlit-dpf-api/client/mlit-dpf-client.ts

import { graphqlClient } from './graphql-client';
import type {
  Prefecture,
  City,
  ConstructionProject
} from '../types';

const GRAPHQL_ENDPOINT = 'https://www.mlit-data.jp/api/graphql';
const API_KEY = process.env.MLIT_DPF_API_KEY || '';

export class MlitDpfClient {
  /**
   * 都道府県一覧を取得
   */
  async getPrefectures(): Promise<Prefecture[]> {
    const query = `
      query {
        prefectures {
          code
          name
          region
          population
        }
      }
    `;

    const response = await graphqlClient.request<{ prefectures: Prefecture[] }>(
      GRAPHQL_ENDPOINT,
      query,
      {},
      {
        'Authorization': `Bearer ${API_KEY}`,
      }
    );

    return response.prefectures;
  }

  /**
   * 市区町村データを取得
   * @param prefectureCode - 都道府県コード（01～47）
   */
  async getCities(prefectureCode: string): Promise<City[]> {
    const query = `
      query GetCities($prefectureCode: String!) {
        cities(prefectureCode: $prefectureCode) {
          code
          name
          population
          area
          latitude
          longitude
        }
      }
    `;

    const response = await graphqlClient.request<{ cities: City[] }>(
      GRAPHQL_ENDPOINT,
      query,
      { prefectureCode },
      {
        'Authorization': `Bearer ${API_KEY}`,
      }
    );

    return response.cities;
  }

  /**
   * 建設工事データを取得
   * @param prefectureCode - 都道府県コード
   * @param year - 年度
   */
  async getConstructionProjects(
    prefectureCode: string,
    year: number
  ): Promise<ConstructionProject[]> {
    const query = `
      query GetConstructionProjects($prefectureCode: String!, $year: Int!) {
        constructionProjects(prefectureCode: $prefectureCode, year: $year) {
          id
          projectName
          budget
          startDate
          endDate
          location
          category
        }
      }
    `;

    const response = await graphqlClient.request<{
      constructionProjects: ConstructionProject[]
    }>(
      GRAPHQL_ENDPOINT,
      query,
      { prefectureCode, year },
      {
        'Authorization': `Bearer ${API_KEY}`,
      }
    );

    return response.constructionProjects;
  }
}

// シングルトンインスタンス
export const mlitDpfClient = new MlitDpfClient();
```

---

### 2. 気象庁 天気予報クライアント

```typescript
// src/lib/weather-api/client/jma-client.ts

import { httpClient } from './http-client';
import type {
  JmaAreaCodeResponse,
  JmaForecastResponse,
  JmaAmedasResponse
} from '../types/weather';

const BASE_URL = 'https://www.jma.go.jp/bosai';

export class JmaWeatherClient {
  /**
   * エリアコード一覧を取得
   */
  async getAreaCodes(): Promise<JmaAreaCodeResponse> {
    const url = `${BASE_URL}/common/const/area.json`;
    return await httpClient.get<JmaAreaCodeResponse>(url);
  }

  /**
   * 天気予報データを取得
   * @param areaCode - エリアコード（例: 130000 = 東京都）
   */
  async getForecast(areaCode: string): Promise<JmaForecastResponse> {
    const url = `${BASE_URL}/forecast/data/forecast/${areaCode}.json`;
    return await httpClient.get<JmaForecastResponse>(url);
  }

  /**
   * 天気概要を取得
   * @param areaCode - エリアコード
   */
  async getOverviewForecast(areaCode: string): Promise<any> {
    const url = `${BASE_URL}/forecast/data/overview_forecast/${areaCode}.json`;
    return await httpClient.get(url);
  }

  /**
   * AMeDAS観測データを取得
   * @param datetime - 日時（YYYYMMDDHHmm00形式）
   */
  async getAmedasData(datetime: string): Promise<JmaAmedasResponse> {
    const url = `${BASE_URL}/amedas/data/map/${datetime}.json`;
    return await httpClient.get<JmaAmedasResponse>(url);
  }

  /**
   * 最新のAMeDASデータを取得
   */
  async getLatestAmedasData(): Promise<JmaAmedasResponse> {
    // 現在時刻から10分刻みの最新時刻を計算
    const now = new Date();
    const minutes = Math.floor(now.getMinutes() / 10) * 10;
    now.setMinutes(minutes);
    now.setSeconds(0);
    now.setMilliseconds(0);

    const datetime = this.formatDatetime(now);
    return this.getAmedasData(datetime);
  }

  /**
   * 日時をYYYYMMDDHHmm00形式にフォーマット
   */
  private formatDatetime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${year}${month}${day}${hour}${minute}00`;
  }
}

// シングルトンインスタンス
export const jmaWeatherClient = new JmaWeatherClient();
```

---

### 3. 型定義

```typescript
// src/lib/mlit-dpf-api/types/index.ts

/**
 * 都道府県
 */
export interface Prefecture {
  code: string;
  name: string;
  region: string;
  population?: number;
}

/**
 * 市区町村
 */
export interface City {
  code: string;
  name: string;
  population?: number;
  area?: number;
  latitude?: number;
  longitude?: number;
}

/**
 * 建設工事プロジェクト
 */
export interface ConstructionProject {
  id: string;
  projectName: string;
  budget: number;
  startDate: string;
  endDate: string;
  location: string;
  category: string;
}
```

```typescript
// src/lib/weather-api/types/weather.ts

/**
 * エリアコードレスポンス
 */
export interface JmaAreaCodeResponse {
  centers: {
    [key: string]: {
      name: string;
      enName: string;
      officeName: string;
      children: string[];
    };
  };
  offices: {
    [key: string]: {
      name: string;
      enName: string;
      officeName: string;
      parent: string;
      children: string[];
    };
  };
  class10s: {
    [key: string]: {
      name: string;
      enName: string;
      parent: string;
      children: string[];
    };
  };
  class15s: {
    [key: string]: {
      name: string;
      enName: string;
      parent: string;
    };
  };
  class20s: {
    [key: string]: {
      name: string;
      enName: string;
      parent: string;
      children: string[];
    };
  };
}

/**
 * 天気予報レスポンス
 */
export interface JmaForecastResponse {
  publishingOffice: string;
  reportDatetime: string;
  timeSeries: Array<{
    timeDefines: string[];
    areas: Array<{
      area: {
        name: string;
        code: string;
      };
      weatherCodes?: string[];
      weathers?: string[];
      winds?: string[];
      waves?: string[];
      pops?: string[];  // 降水確率
      temps?: string[]; // 気温
    }>;
  }>;
}

/**
 * AMeDAS観測データレスポンス
 */
export interface JmaAmedasResponse {
  [stationCode: string]: {
    temp?: [number, number];      // [気温, 品質情報]
    humidity?: [number, number];  // [湿度, 品質情報]
    snow?: [number, number];      // [積雪深, 品質情報]
    sun1h?: [number, number];     // [日照時間, 品質情報]
    precipitation1h?: [number, number];  // [降水量, 品質情報]
    precipitation10m?: [number, number]; // [10分降水量, 品質情報]
    wind?: [number, number, number];     // [風向, 風速, 品質情報]
  };
}
```

---

### 4. カスタムフック

```typescript
// src/hooks/resas/useResasPopulation.ts

import useSWR from 'swr';
import type { ResasPopulationResponse } from '@/types/resas';

interface UseResasPopulationOptions {
  prefCode: string;
  cityCode?: string;
  enabled?: boolean;
}

/**
 * RESAS人口データ取得フック
 */
export function useResasPopulation({
  prefCode,
  cityCode,
  enabled = true,
}: UseResasPopulationOptions) {
  const params = new URLSearchParams({
    prefCode,
    ...(cityCode && { cityCode }),
  });

  const { data, error, isLoading, mutate } = useSWR<ResasPopulationResponse>(
    enabled ? `/api/resas/population?${params}` : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch RESAS population data');
      }
      return response.json();
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 3600000, // 1時間キャッシュ
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}
```

```typescript
// src/hooks/weather/useWeatherForecast.ts

import useSWR from 'swr';
import type { JmaForecastResponse } from '@/types/weather';

interface UseWeatherForecastOptions {
  areaCode: string;
  enabled?: boolean;
}

/**
 * 天気予報データ取得フック
 */
export function useWeatherForecast({
  areaCode,
  enabled = true,
}: UseWeatherForecastOptions) {
  const { data, error, isLoading, mutate } = useSWR<JmaForecastResponse>(
    enabled ? `/api/weather/forecast/${areaCode}` : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch weather forecast');
      }
      return response.json();
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 3600000, // 1時間ごとに自動更新
      dedupingInterval: 600000,  // 10分間は重複リクエストを防ぐ
    }
  );

  return {
    forecast: data,
    error,
    isLoading,
    mutate,
  };
}
```

---

### 5. UIコンポーネント例

```typescript
// src/components/weather/WeatherWidget.tsx

'use client';

import { useWeatherForecast } from '@/hooks/weather/useWeatherForecast';
import { useStyles } from '@/hooks/useStyles';

interface WeatherWidgetProps {
  areaCode: string;
  areaName: string;
}

export function WeatherWidget({ areaCode, areaName }: WeatherWidgetProps) {
  const { forecast, isLoading, error } = useWeatherForecast({ areaCode });
  const styles = useStyles();

  if (isLoading) {
    return (
      <div className={styles.card.base}>
        <p className={styles.message.info}>天気予報を読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.card.base}>
        <p className={styles.message.error}>天気予報の取得に失敗しました</p>
      </div>
    );
  }

  if (!forecast) {
    return null;
  }

  // 今日・明日・明後日の予報を取得
  const todayForecast = forecast.timeSeries[0]?.areas[0];
  const timeDefines = forecast.timeSeries[0]?.timeDefines;

  return (
    <div className={styles.card.base}>
      <h3 className={styles.heading.md}>{areaName} の天気予報</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        発表: {new Date(forecast.reportDatetime).toLocaleString('ja-JP')}
      </p>

      {/* 天気予報カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {todayForecast?.weathers?.map((weather, index) => (
          <div
            key={index}
            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <div className="text-sm font-semibold mb-2">
              {new Date(timeDefines[index]).toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
                weekday: 'short',
              })}
            </div>
            <div className="text-lg mb-2">{weather}</div>
            {todayForecast.pops?.[index] && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                降水確率: {todayForecast.pops[index]}%
              </div>
            )}
            {todayForecast.temps?.[index] && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                気温: {todayForecast.temps[index]}°C
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

```typescript
// src/components/economy/ResasEconomyDashboard.tsx

'use client';

import { useResasPopulation } from '@/hooks/resas/useResasPopulation';
import { useResasIndustry } from '@/hooks/resas/useResasIndustry';
import { useStyles } from '@/hooks/useStyles';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ResasEconomyDashboardProps {
  prefCode: string;
  prefName: string;
  cityCode?: string;
  cityName?: string;
}

export function ResasEconomyDashboard({
  prefCode,
  prefName,
  cityCode,
  cityName,
}: ResasEconomyDashboardProps) {
  const { data: populationData, isLoading: popLoading } = useResasPopulation({
    prefCode,
    cityCode,
  });

  const { data: industryData, isLoading: indLoading } = useResasIndustry({
    prefCode,
    cityCode,
  });

  const styles = useStyles();

  if (popLoading || indLoading) {
    return <div className={styles.message.info}>データを読み込み中...</div>;
  }

  // 人口推移データの整形
  const populationChartData = populationData?.result.data[0]?.data.map((item) => ({
    year: item.year,
    population: item.value,
  })) || [];

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className={styles.card.base}>
        <h2 className={styles.heading.lg}>
          {cityName || prefName} の地域経済データ
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          出典: RESAS（地域経済分析システム）
        </p>
      </div>

      {/* 人口推移グラフ */}
      {populationChartData.length > 0 && (
        <div className={styles.card.base}>
          <h3 className={styles.heading.md}>人口推移</h3>
          <div className="w-full overflow-x-auto">
            <LineChart
              width={800}
              height={400}
              data={populationChartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="population"
                stroke="#3b82f6"
                name="総人口"
                strokeWidth={2}
              />
            </LineChart>
          </div>
        </div>
      )}

      {/* 人口構成 */}
      {populationData && (
        <div className={styles.card.base}>
          <h3 className={styles.heading.md}>人口構成</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {populationData.result.data.slice(1).map((category) => {
              const latestData = category.data[category.data.length - 1];
              return (
                <div
                  key={category.label}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {category.label}
                  </div>
                  <div className="text-2xl font-bold">
                    {latestData.value.toLocaleString()}人
                  </div>
                  {latestData.rate && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {latestData.rate.toFixed(1)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 6. Next.js API Route

```typescript
// src/app/api/resas/population/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { resasClient } from '@/lib/resas-api/client/resas-client';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const prefCode = searchParams.get('prefCode');
    const cityCode = searchParams.get('cityCode');

    if (!prefCode) {
      return NextResponse.json(
        { error: 'prefCode parameter is required' },
        { status: 400 }
      );
    }

    // RESAS APIからデータ取得
    const data = await resasClient.getPopulationComposition(
      prefCode,
      cityCode || undefined
    );

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching RESAS population data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch population data' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/weather/forecast/[areaCode]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jmaWeatherClient } from '@/lib/weather-api/client/jma-client';

export const runtime = 'edge';

interface RouteContext {
  params: {
    areaCode: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { areaCode } = params;

    if (!areaCode) {
      return NextResponse.json(
        { error: 'areaCode is required' },
        { status: 400 }
      );
    }

    // 気象庁APIからデータ取得
    const forecast = await jmaWeatherClient.getForecast(areaCode);

    return NextResponse.json(forecast, {
      headers: {
        // 1時間キャッシュ
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather forecast' },
      { status: 500 }
    );
  }
}
```

---

## データベース設計

### マイグレーションSQL

```sql
-- database/migrations/2025XXXX_add_japan_stats_api_tables.sql

-- 統合APIデータキャッシュテーブル
CREATE TABLE IF NOT EXISTS api_data_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_source TEXT NOT NULL,              -- 'resas', 'weather', 'traffic', etc.
  endpoint TEXT NOT NULL,                -- APIエンドポイント
  params_hash TEXT NOT NULL,             -- パラメータのハッシュ
  response_data TEXT NOT NULL,           -- JSONレスポンス
  cached_at INTEGER NOT NULL,            -- キャッシュ日時
  expires_at INTEGER NOT NULL,           -- 有効期限
  UNIQUE(api_source, endpoint, params_hash)
);

-- RESASデータテーブル
CREATE TABLE IF NOT EXISTS resas_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_type TEXT NOT NULL,               -- 'population', 'industry', 'tourism'
  pref_code TEXT NOT NULL,               -- 都道府県コード
  city_code TEXT,                        -- 市区町村コード
  year TEXT NOT NULL,                    -- 年
  value REAL NOT NULL,                   -- データ値
  category TEXT,                         -- カテゴリー
  metadata TEXT,                         -- JSON形式のメタデータ
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(data_type, pref_code, city_code, year, category)
);

-- 天気予報データテーブル
CREATE TABLE IF NOT EXISTS weather_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  area_code TEXT NOT NULL,               -- エリアコード
  area_name TEXT NOT NULL,               -- エリア名
  forecast_date TEXT NOT NULL,           -- 予報対象日
  weather TEXT,                          -- 天気
  weather_code TEXT,                     -- 天気コード
  temp_max REAL,                         -- 最高気温
  temp_min REAL,                         -- 最低気温
  pop INTEGER,                           -- 降水確率
  wind TEXT,                             -- 風
  wave TEXT,                             -- 波
  published_at TEXT NOT NULL,            -- 発表日時
  created_at INTEGER NOT NULL,
  UNIQUE(area_code, forecast_date, published_at)
);

-- 交通事故データテーブル
CREATE TABLE IF NOT EXISTS traffic_accident_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pref_code TEXT NOT NULL,               -- 都道府県コード
  city_code TEXT,                        -- 市区町村コード
  year TEXT NOT NULL,                    -- 年
  accident_count INTEGER,                -- 事故件数
  death_count INTEGER,                   -- 死者数
  injury_count INTEGER,                  -- 負傷者数
  latitude REAL,                         -- 緯度
  longitude REAL,                        -- 経度
  accident_type TEXT,                    -- 事故類型
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(pref_code, city_code, year, accident_type)
);

-- 不動産データテーブル
CREATE TABLE IF NOT EXISTS real_estate_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pref_code TEXT NOT NULL,               -- 都道府県コード
  city_code TEXT,                        -- 市区町村コード
  year TEXT NOT NULL,                    -- 年
  quarter TEXT,                          -- 四半期
  land_price REAL,                       -- 地価（円/m2）
  transaction_price REAL,                -- 取引価格（円）
  property_type TEXT,                    -- 物件種別
  area REAL,                             -- 面積（m2）
  latitude REAL,                         -- 緯度
  longitude REAL,                        -- 経度
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 環境データテーブル
CREATE TABLE IF NOT EXISTS environment_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_code TEXT NOT NULL,            -- 測定局コード
  station_name TEXT NOT NULL,            -- 測定局名
  pref_code TEXT NOT NULL,               -- 都道府県コード
  measured_at TEXT NOT NULL,             -- 測定日時
  pm25 REAL,                             -- PM2.5濃度（μg/m3）
  pm10 REAL,                             -- PM10濃度（μg/m3）
  no2 REAL,                              -- NO2濃度（ppm）
  so2 REAL,                              -- SO2濃度（ppm）
  co REAL,                               -- CO濃度（ppm）
  o3 REAL,                               -- O3濃度（ppm）
  aqi INTEGER,                           -- 大気質指数
  latitude REAL,                         -- 緯度
  longitude REAL,                        -- 経度
  created_at INTEGER NOT NULL,
  UNIQUE(station_code, measured_at)
);

-- 農業データテーブル
CREATE TABLE IF NOT EXISTS agriculture_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_type TEXT NOT NULL,               -- 'market_price', 'wholesale', etc.
  product_name TEXT NOT NULL,            -- 農産物名
  market_name TEXT,                      -- 市場名
  date TEXT NOT NULL,                    -- 日付
  price REAL,                            -- 価格（円）
  volume REAL,                           -- 取引量（kg）
  unit TEXT,                             -- 単位
  pref_code TEXT,                        -- 都道府県コード
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(data_type, product_name, market_name, date)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_api_cache_source ON api_data_cache(api_source);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_data_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_resas_pref ON resas_data(pref_code);
CREATE INDEX IF NOT EXISTS idx_resas_city ON resas_data(city_code);
CREATE INDEX IF NOT EXISTS idx_resas_year ON resas_data(year);

CREATE INDEX IF NOT EXISTS idx_weather_area ON weather_data(area_code);
CREATE INDEX IF NOT EXISTS idx_weather_date ON weather_data(forecast_date);

CREATE INDEX IF NOT EXISTS idx_traffic_pref ON traffic_accident_data(pref_code);
CREATE INDEX IF NOT EXISTS idx_traffic_year ON traffic_accident_data(year);

CREATE INDEX IF NOT EXISTS idx_real_estate_pref ON real_estate_data(pref_code);
CREATE INDEX IF NOT EXISTS idx_real_estate_year ON real_estate_data(year);

CREATE INDEX IF NOT EXISTS idx_environment_station ON environment_data(station_code);
CREATE INDEX IF NOT EXISTS idx_environment_measured ON environment_data(measured_at);

CREATE INDEX IF NOT EXISTS idx_agriculture_type ON agriculture_data(data_type);
CREATE INDEX IF NOT EXISTS idx_agriculture_date ON agriculture_data(date);
```

---

## 実装ロードマップ

### Phase 1: 基礎構築（2週間）

**Week 1**:
- [ ] プロジェクト構造のセットアップ
  - ディレクトリ構造作成
  - 環境変数設定（RESAS_API_KEY）
- [ ] RESAS APIクライアント実装
  - ResasClient実装
  - 型定義作成
- [ ] 気象庁 天気予報クライアント実装
  - JmaWeatherClient実装
  - 型定義作成
- [ ] HTTPクライアントの共通化

**Week 2**:
- [ ] データベーススキーマの作成
  - マイグレーションファイル作成
  - テーブル作成
  - インデックス設定
- [ ] Next.js API Routes実装
  - /api/resas/* エンドポイント
  - /api/weather/* エンドポイント
- [ ] データフォーマッター実装
- [ ] キャッシュマネージャー実装

**成果物**:
- RESAS API統合
- 気象庁 天気予報統合
- データベーステーブル
- API Routesエンドポイント

---

### Phase 2: コアコンポーネント（2週間）

**Week 3**:
- [ ] `WeatherWidget`コンポーネント実装
- [ ] `ResasEconomyDashboard`コンポーネント実装
- [ ] カスタムフック実装（useSWR）
  - useResasPopulation
  - useResasIndustry
  - useWeatherForecast

**Week 4**:
- [ ] 天気予報ページ実装（/weather）
- [ ] 地域経済ページ実装（/economy）
- [ ] 既存カテゴリーページへのウィジェット統合
  - サイドバーに天気ウィジェット追加
  - 経済データサマリーカード追加

**成果物**:
- 主要UIコンポーネント
- 天気予報ページ
- 地域経済ページ

---

### Phase 3: 拡張機能（2週間）

**Week 5**:
- [ ] 不動産情報ライブラリAPI統合
  - MlitRealEstateClient実装
  - UIコンポーネント実装
- [ ] 警察庁 交通事故統計API統合
  - NpaTrafficClient実装
  - TrafficAccidentMapコンポーネント実装

**Week 6**:
- [ ] 農林水産省 オープンAPI統合
  - MaffAgricultureClient実装
  - 農業データコンポーネント実装
- [ ] 東京都オープンデータAPI統合
  - TokyoOpenDataClient実装
  - 自治体データコンポーネント実装

**成果物**:
- 複数APIの統合
- 不動産・交通事故・農業データページ
- 自治体データページ

---

### Phase 4: 高度な統合（2週間）

**Week 7**:
- [ ] 国土数値情報API統合（GISデータ）
  - Shapefileパーサー実装
  - GeoJSON変換
  - 地図コンポーネントの高度化
- [ ] 環境省 大気汚染データ統合
  - サードパーティAPI（aqicn.org）統合
  - 大気質ウィジェット実装

**Week 8**:
- [ ] データ統合ダッシュボード実装
  - 複数データソースの統合表示
  - クロス分析機能
  - データエクスポート機能（CSV/JSON）

**成果物**:
- GIS統合
- 環境データ統合
- 統合ダッシュボード

---

### Phase 5: テストと改善（2週間）

**Week 9**:
- [ ] ユニットテスト（Vitest）
- [ ] コンポーネントテスト
- [ ] E2Eテスト（Playwright）
- [ ] パフォーマンス最適化

**Week 10**:
- [ ] Storybookストーリー作成
- [ ] ドキュメント作成
- [ ] アクセシビリティ改善
- [ ] ステージングデプロイ

**成果物**:
- テストカバレッジ 80%以上
- 完全なドキュメント
- 本番環境準備完了

---

### 総工数見積もり

- **Phase 1**: 80時間（2週間）
- **Phase 2**: 80時間（2週間）
- **Phase 3**: 80時間（2週間）
- **Phase 4**: 80時間（2週間）
- **Phase 5**: 80時間（2週間）

**合計**: 約400時間（10週間）

**前提条件**:
- フルタイム1名の開発者
- 既存のe-Stat API統合経験を活用
- 既存のプロジェクト構造・デザインシステムを活用

---

## リスクと対策

### リスク1: 気象庁APIの仕様変更

**リスク内容**:
- 気象庁の天気予報JSONは「非公式API」のため、予告なく仕様変更される可能性

**対策**:
1. **抽象化レイヤー**:
   - APIクライアントを抽象化し、インターフェースを統一
   - 仕様変更時は実装のみ変更

2. **モニタリング**:
   - APIエラーの監視
   - 定期的なヘルスチェック
   - Slack/Email通知

3. **フォールバック**:
   - キャッシュデータの提供
   - サードパーティAPI（OpenWeatherMap）への切り替え準備

---

### リスク2: APIレート制限

**リスク内容**:
- 明示的なレート制限がないAPIも、過度なリクエストで制限される可能性

**対策**:
1. **キャッシング戦略**:
   - Cloudflare D1へのデータキャッシュ
   - ブラウザキャッシュ（Cache-Control ヘッダー）
   - SWRの重複排除機能

2. **リクエスト最適化**:
   - 必要最小限のデータのみ取得
   - バッチリクエストの実装
   - デバウンス・スロットリング

3. **フォールバック**:
   - キャッシュからのデータ提供
   - 段階的なデータ取得（Lazy Loading）

---

### リスク3: データ品質のバラつき

**リスク内容**:
- 各APIでデータ形式、精度、更新頻度が異なる

**対策**:
1. **データ正規化**:
   - 統一形式への変換
   - データバリデーション
   - 異常値の検出

2. **メタデータ管理**:
   - データソースの明示
   - 更新日時の表示
   - データ品質の注記

3. **ユーザー通知**:
   - データの出典表示
   - 最終更新日時の表示
   - データ品質に関する注意書き

---

### リスク4: GISデータの処理負荷

**リスク内容**:
- 国土数値情報のShapefile/GeoJSONは大容量で処理が重い

**対策**:
1. **データ簡略化**:
   - トポロジー簡略化（TopoJSON）
   - 不要な属性の削除
   - 解像度の調整

2. **遅延読み込み**:
   - 必要な範囲のみ読み込み
   - ズームレベルに応じた詳細度
   - タイル形式での提供

3. **プログレッシブエンハンスメント**:
   - 初回は簡易表示
   - ユーザーアクションに応じて詳細データ取得

---

### リスク5: 複数データソースの統合複雑性

**リスク内容**:
- 複数のAPIを統合することで、コードベースが複雑化する可能性

**対策**:
1. **アーキテクチャパターン**:
   - Adapter パターンで各APIを抽象化
   - Factory パターンでクライアント生成
   - Strategy パターンでデータフォーマット変換

2. **コード規約**:
   - 統一されたディレクトリ構造
   - 命名規則の徹底
   - コメント・ドキュメントの充実

3. **テスト**:
   - 各APIクライアントのユニットテスト
   - 統合テスト
   - E2Eテスト

---

## 結論

### 実行可能性: ✅ 高い

本調査により、以下の点から**e-Stat以外の日本統計APIの統合は十分に実行可能**と判断します：

1. **技術的実行可能性**:
   - 既存のe-Stat API統合経験を活用可能
   - ほとんどのAPIが無料でRESTful、認証不要または簡単
   - Next.js 15 + React 19 + TypeScript環境と完全に互換

2. **コスト面の実行可能性**:
   - すべてのAPIが完全無料（RESAS APIはAPIキー登録のみ）
   - 追加インフラコストは最小限（Cloudflare D1内で対応可能）

3. **データ品質**:
   - 信頼性の高い政府機関・公的機関が提供
   - 日本の統計データが完全に利用可能

4. **実装工数**:
   - 約400時間（10週間）で実装可能
   - 既存のアーキテクチャ・デザインシステムを最大限活用

---

### 推奨実装優先度

#### 最優先（Phase 1）:
1. **RESAS API** - 地域経済データ、最も実用的
2. **東京都オープンデータAPI** - 使いやすさ抜群
3. **気象庁 天気予報API** - ユーザー価値高い
4. **不動産情報ライブラリAPI** - 不動産・地価データ

#### 高優先（Phase 2-3）:
5. **国土交通省 国土数値情報API** - GIS統合
6. **警察庁 交通事故統計** - 安全性評価
7. **農林水産省 オープンAPI** - 農業統計

#### 中優先（Phase 4）:
8. **環境省 そらまめ君** - 環境データ
9. **厚生労働省 NDBオープンデータ** - 医療データ

---

### 期待される効果

1. **ユーザー価値の向上**:
   - 気象、経済、環境など多角的な統計を1つのプラットフォームで提供
   - リアルタイムデータによる即時性
   - 市区町村レベルの詳細データ

2. **プロジェクトの差別化**:
   - e-Stat（公式統計） + RESAS（地域経済） + 気象庁（天気）の統合
   - 独自の視点と深い洞察を提供
   - 教育・研究・ビジネス・日常生活に有用

3. **技術的成長**:
   - 複数API統合の経験
   - GISデータの扱い
   - スケーラブルなアーキテクチャ

---

### 次のステップ

1. **ステークホルダーレビュー**: この計画書をレビューし、承認を得る
2. **Phase 1開始**: RESAS API統合から着手
3. **プロトタイプ作成**: 2週間でMVP（最小実行可能製品）を作成
4. **フィードバック収集**: ユーザーテストを実施
5. **反復改善**: フィードバックに基づいて機能を拡張

---

## 参考リンク

### API公式ドキュメント

- [RESAS API](https://opendata.resas-portal.go.jp/)
- [気象庁データ高度利用ポータル](https://www.data.jma.go.jp/developer/index.html)
- [国土交通省 国土数値情報](https://nlftp.mlit.go.jp/ksj/)
- [警察庁 交通事故統計](https://www.npa.go.jp/publications/statistics/koutsuu/opendata/index_opendata.html)
- [厚生労働省 NDBオープンデータ](https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000177182.html)
- [環境省 そらまめ君](http://soramame.env.go.jp/)
- [農林水産省 オープンAPI](https://www.maff.go.jp/j/kanbo/smart/openapi.html)
- [東京都オープンデータ](https://portal.data.metro.tokyo.lg.jp/)
- [不動産情報ライブラリ](https://www.reinfolib.mlit.go.jp/)
- [e-Govデータポータル](https://data.e-gov.go.jp/)

### プロジェクト内部ドキュメント

- [プロジェクトREADME](../../README.md)
- [アーキテクチャ設計書](../../doc/architecture.md)
- [開発ガイド](../01_development_guide/README.md)
- [e-Stat統合ガイド](../../doc/estat-integration.md)
- [世界統計API統合計画](./world-statistics-api-integration-plan.md)

---

**最終更新日**: 2025年10月17日
**作成者**: Claude Code
**バージョン**: 1.0.0
