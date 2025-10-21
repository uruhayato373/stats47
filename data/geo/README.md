# 地理データ

## 概要

このディレクトリには、stats47 プロジェクトで使用する地理データが格納されています。

## データソース

### 歴史的行政区域データセット β 版（CODH）

**コロプレス地図の行政区域データとして使用**

- **提供元**: 国立情報学研究所 人文学オープンデータ共同利用センター（CODH）
- **プロジェクト**: GeoNLP プロジェクト
- **ウェブサイト**: https://geoshape.ex.nii.ac.jp/city/
- **ライセンス**: CC BY 4.0
- **出典表記**: 「歴史的行政区域データセット β 版（CODH 作成）」

**特徴**:

- 1889 年（市制・町村制施行）〜現在までの市区町村境界を提供
- TopoJSON/GeoJSON 形式で直接利用可能
- 行政区域件数: 16,856 件
- 行政区域境界データ: 577,857 件
- e-Stat 地域コードとの対応あり

**利用データ**:

- 都道府県境界データ（Phase 2）
- 市区町村境界データ（Phase 3）
- 時系列アニメーション用データ（Phase 3）

### 国土数値情報（国土交通省）

**施設情報、災害リスク情報等として使用（Phase 3 以降）**

- **提供元**: 国土交通省 国土政策局 国土情報課
- **ウェブサイト**: https://nlftp.mlit.go.jp/ksj/
- **ライセンス**: CC BY 4.0（データにより異なる）
- **出典表記**: 「国土数値情報（国土交通省）」

**利用予定データ**:

- 施設情報（医療機関、教育機関、公共施設）
- 災害リスク情報（浸水想定区域、土砂災害警戒区域）
- 交通情報（駅、道路）
- 土地利用データ

## ディレクトリ構造

```
data/geo/
├── topojson/
│   ├── geoshape/                        # 歴史的行政区域データセット
│   │   ├── japan_prefectures_2023.json  # 都道府県境界（Phase 2）
│   │   ├── japan_municipalities_2023.json # 市区町村境界（Phase 3）
│   │   └── metadata.json                # メタデータ
│   └── ksj/                             # 国土数値情報（Phase 3以降）
│       ├── facilities.json              # 施設情報
│       ├── disaster_risk.json           # 災害リスク
│       └── transportation.json          # 交通情報
├── mapping/
│   └── area_code_mapping.json           # 市区町村IDと標準地域コードの対応表
└── README.md
```

## データ取得手順

### Phase 2: 歴史的行政区域データセット（都道府県）

```bash
# 最新年度の都道府県境界データを取得
npm run fetch:geoshape -- --year 2023 --level prefecture --output data/geo/topojson/geoshape/

# 市区町村IDと標準地域コードの対応表を生成
npm run generate:mapping
```

### Phase 3 以降: 市区町村データと国土数値情報

```bash
# 市区町村境界データを取得
npm run fetch:geoshape -- --year 2023 --level municipality --output data/geo/topojson/geoshape/

# 国土数値情報から施設・災害データを取得・変換
npm run fetch:ksj -- --type facilities
npm run fetch:ksj -- --type disaster_risk
```

## ライセンス遵守

### 歴史的行政区域データセット

1. **出典明記**: 地図表示画面に「歴史的行政区域データセット β 版（CODH 作成）」を表示
2. **商用利用**: CC BY 4.0 により許可
3. **データ配布**: 本プロジェクトのリポジトリに TopoJSON ファイルを含める

### 国土数値情報

1. **出典明記**: 該当機能の画面に「国土数値情報（国土交通省）」を表示
2. **改変**: 必要に応じて TopoJSON 変換・簡略化
3. **商用利用**: CC BY 4.0 により許可（データにより制限あり）

## 更新手順

### 年次更新（歴史的行政区域データセット）

1. GeoNLP プロジェクトで最新データを確認
2. データ取得スクリプトを実行
3. 検証テストを実行
4. メタデータを更新
5. コミット・デプロイ

### 不定期更新（国土数値情報、Phase 3 以降）

1. 国土数値情報サイトで更新を確認
2. 必要なデータをダウンロード
3. 変換スクリプトを実行
4. 検証テストを実行
5. コミット・デプロイ

## 技術的詳細

### 市区町村 ID と標準地域コードの対応

歴史的行政区域データセットの市区町村 ID と e-Stat の標準地域コードは対応関係があります。

```json
{
  "01100": {
    "municipalityId": "01100A2010",
    "standardAreaCode": "01100",
    "name": "札幌市",
    "prefectureName": "北海道"
  }
}
```

### TopoJSON の構造

歴史的行政区域データセットの TopoJSON には以下の情報が含まれます:

- `objects`: 行政区域のポリゴンデータ
- `properties`: 市区町村 ID、名称、都道府県名
- `arcs`: トポロジー情報（共有境界）

## 関連リンク

- [歴史的行政区域データセット β 版](https://geoshape.ex.nii.ac.jp/city/)
- [GeoNLP プロジェクト](https://geonlp.ex.nii.ac.jp/)
- [国土数値情報ダウンロードサイト](https://nlftp.mlit.go.jp/ksj/)
- [機能要件 2.10 地図可視化機能](../../docs/00_プロジェクト管理/02_要件定義/02_機能要件.md)
- [Phase 2 実装計画](../../docs/00_プロジェクト管理/03_実装計画/02_フェーズ2_コア機能.md)
