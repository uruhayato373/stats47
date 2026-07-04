---
name: generate-csv
description: ランキングデータの CSV を生成しローカル R2 に保存する。Use when user says "CSV生成", "ランキングCSV", "データダウンロード用CSV". UTF-8 BOM + downloadable_assets 登録.
disable-model-invocation: true
primary_agent: snapshot-exporter
---

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

完全DBレス: R2 公開 URL から取得する（旧 D1 indicators/observations は廃止）:

```bash
cd /Users/minamidaisuke/stats47 && node -e "
const R2 = process.env.R2_PUBLIC_FETCH_URL || 'https://storage.stats47.jp';
(async () => {
  // ランキングメタ (title/unit/latest_year)
  const { item } = await (await fetch(R2 + '/app/ranking/<rankingKey>/item.json')).json();
  console.log('meta:', JSON.stringify({ ranking_key: item.rankingKey, title: item.title, unit: item.unit, latest_year: item.latestYear }));

  // ランキングデータ（年度指定・rank 昇順）
  const payload = await (await fetch(R2 + '/app/stats/<rankingKey>/values.json')).json();
  const rows = payload.rows
    .filter(r => String(r.yearCode) === '<yearCode>' && r.value != null)
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
    .map(r => ({ area_code: r.areaCode, area_name: r.areaName, value: r.value, unit: r.unit, year_code: r.yearCode, rank: r.rank }));
  console.log(JSON.stringify(rows, null, 2));
})();
"
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
