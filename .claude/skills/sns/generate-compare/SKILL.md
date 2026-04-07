---
name: generate-compare
description: D1 から 2 地域比較の data.json を生成しローカル R2 に保存する。Use when user says "比較データ生成", "compare 生成", "2地域比較". テーマプリセット対応.
disable-model-invocation: true
---

D1 から 2 地域の比較データを取得し、`.local/r2/sns/compare/<areaA>-vs-<areaB>/` に data.json を保存する。

## ディレクトリ構造

```
.local/r2/sns/compare/<areaCodeA>-vs-<areaCodeB>/
  data.json    ← 比較指標データ（D1 から生成）
```

## 引数

ユーザーから以下を確認すること:

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **areaA** | Yes | - | 地域A のエリアコード（例: `13000`） |
| **areaB** | Yes | - | 地域B のエリアコード（例: `27000`） |
| **rankingKeys** | Yes | - | 比較する指標のランキングキー配列（5〜7個推奨） |

### テーマプリセット

`rankingKeys` の代わりにテーマ名を指定できる。テーマ定義は `docs/10_SNS戦略/04_地方財政テーマSNS展開.md` の Compare セクションを参照。

| テーマ | rankingKeys |
|---|---|
| `fiscal` | fiscal-strength-index-prefecture, current-balance-ratio, real-public-debt-service-ratio, future-burden-ratio, local-tax-ratio-pref-finance |
| `salary` | avg-salary-admin-prefecture, bonus-admin-prefecture, retirement-allowance-admin-prefecture, laspeyres-index-prefecture, overtime-pay-admin-prefecture |
| `spending` | per-capita-education-expenditure-pref-municipal, per-capita-welfare-expenditure-pref-municipal, personnel-expenditure-ratio-pref-finance, welfare-expenditure-ratio-pref-finance, fiscal-strength-index-prefecture |
| `governor` | governor-salary-prefecture, avg-salary-police-prefecture, avg-salary-admin-prefecture, bonus-admin-prefecture, retirement-allowance-admin-prefecture |
| `debt` | future-burden-ratio, real-public-debt-service-ratio, current-balance-ratio, welfare-expenditure-ratio-pref-finance, fiscal-strength-index-prefecture |

## 手順

### Step 1: 地域名を取得

ローカル D1 から地域名を取得する:

```sql
SELECT area_name FROM ranking_data
WHERE area_code = '<areaCode>' AND area_type = 'prefecture'
LIMIT 1;
```

### Step 2: 各指標のデータを取得

各 rankingKey について、両地域の最新年度データと順位を取得する:

```sql
-- 最新年度のデータを取得
SELECT area_code, area_name, value, year_code, year_name,
       category_name, unit
FROM ranking_data
WHERE category_code = '<rankingKey>'
  AND area_type = 'prefecture'
  AND area_code <> '00000'
  AND year_code = (
    SELECT MAX(year_code) FROM ranking_data
    WHERE category_code = '<rankingKey>'
      AND area_type = 'prefecture'
      AND area_code <> '00000'
  )
ORDER BY value DESC;
```

取得した全都道府県データから:
- `valueA` / `valueB` = 対象地域の値
- `rankA` / `rankB` = 値の降順での順位（1〜47）
- `indicator` = ranking_items.title ?? category_name
- `unit` = ranking_items.unit ?? ranking_data.unit

### Step 3: data.json を生成・保存

```json
{
  "areaA": { "areaCode": "13000", "areaName": "東京都" },
  "areaB": { "areaCode": "27000", "areaName": "大阪府" },
  "indicators": [
    {
      "rankingKey": "fiscal-strength-index-prefecture",
      "indicator": "財政力指数",
      "unit": "",
      "valueA": 1.1,
      "rankA": 1,
      "valueB": 0.7,
      "rankB": 5,
      "yearName": "2022年度"
    }
  ]
}
```

注意:
- `indicators` の順序は `rankingKeys` の指定順を維持する
- 指定された rankingKey にデータがない場合はスキップし、ユーザーに報告する
- 値が null の場合もスキップする

### Step 4: 確認

保存後、ユーザーに以下を報告する:
- 保存先パス
- 比較対象の地域名
- 各指標の値・順位の一覧テーブル
- 勝敗カウント（rankA < rankB の数 vs rankB < rankA の数）

## 参照

- 比較テーマ定義: `docs/10_SNS戦略/04_地方財政テーマSNS展開.md`
- キャプション生成: `/post-sns-captions --domain compare`
- Remotion プレビュー: `/preview-remotion-comparison`
- UTM ルール: `/generate-utm-url`
