ランキングデータの CSV を生成し、ローカル R2 に保存する。

## 概要

ローカル D1 からランキングデータを取得し、都道府県別 CSV（UTF-8 BOM）を `.local/r2/downloads/csv/` に保存する。
`downloadable_assets` テーブルにメタデータを登録する。

## 引数

ユーザーから以下を確認すること:
- **rankingKey**: ランキングキー（必須）
- **yearCode**: 年度コード（省略時は最新年度を使用）

## 手順

### 1. データ取得

ローカル D1（SQLite）から対象データを取得する:

```sql
-- ランキングアイテムの確認
SELECT ranking_key, title, unit, latest_year
FROM ranking_items
WHERE ranking_key = '<rankingKey>' AND is_active = 1;

-- ランキングデータ取得（年度指定）
SELECT rd.area_code, rd.area_name, rd.value, rd.unit, rd.year_code, rd.rank
FROM ranking_data rd
WHERE rd.ranking_key = '<rankingKey>'
  AND rd.year_code = '<yearCode>'
  AND rd.area_type = 'prefecture'
ORDER BY rd.rank ASC;
```

### 2. CSV 生成

以下のカラムで CSV を生成する（UTF-8 BOM 付き）:

| カラム名 | 内容 |
|---------|------|
| 都道府県コード | areaCode |
| 都道府県名 | areaName |
| 値 | value |
| 単位 | unit |
| 年度 | yearCode |
| 全国順位 | rank |
| 地方区分 | 7 地方区分名 |

地方区分の定義:
- 北海道・東北: 01000-07000
- 関東: 08000-14000
- 中部: 15000-23000
- 近畿: 24000-30000
- 中国: 31000-35000
- 四国: 36000-39000
- 九州・沖縄: 40000-47000

### 3. ファイル保存

```
.local/r2/downloads/csv/<rankingKey>-<yearCode>.csv
```

### 4. DB にメタデータ登録

ローカル D1 の `downloadable_assets` テーブルに UPSERT する:

```sql
INSERT OR REPLACE INTO downloadable_assets (
  id, ranking_key, asset_type, label, description,
  r2_key, public_url, file_size_bytes, row_count, column_names,
  is_active, created_at, updated_at
) VALUES (
  '<uuid>', '<rankingKey>', 'csv',
  '<タイトル> (<yearCode>年)',
  '都道府県別ランキングデータ CSV（47件）',
  'downloads/csv/<rankingKey>-<yearCode>.csv',
  'https://storage.stats47.jp/downloads/csv/<rankingKey>-<yearCode>.csv',
  <fileSize>, 47,
  '["都道府県コード","都道府県名","値","単位","年度","全国順位","地方区分"]',
  1, datetime('now'), datetime('now')
);
```

### 5. R2 にアップロード

```
/push-r2 --prefix downloads
```

## 一括生成

複数のランキングキーを指定して一括生成する場合は、手順 1-4 をループで実行し、最後にまとめて `/push-r2` する。
