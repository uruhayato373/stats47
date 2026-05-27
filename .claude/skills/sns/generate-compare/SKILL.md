---
name: generate-compare
description: D1 から 2 地域比較の data.json を生成しローカル R2 に保存する。Use when user says "比較データ生成", "compare 生成", "2地域比較". テーマプリセット対応.
disable-model-invocation: true
primary_agent: sns-renderer
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

Phase 6 (2026-05-27) で観測値ストアを R2 に移行済。データ取得は R2 `app/stats/<rankingKey>/values.json` から行う。

### Step 1: 地域名を取得 (D1 prefectures master)

```sql
SELECT code AS area_code, name AS area_name
FROM prefectures
WHERE code = '<areaCode>';
```

### Step 2: 各指標のデータを取得 (R2 から JS で)

各 rankingKey について、R2 から payload を読んで最新年度データを抽出する:

```javascript
const fs = require('fs');
const path = '.local/r2/app/stats/<rankingKey>/values.json';
const payload = JSON.parse(fs.readFileSync(path, 'utf-8'));

// 47 県のみ (全国・地域コード除外)
const prefRows = payload.rows.filter(r => /^\d{2}000$/.test(r.areaCode) && Number(r.areaCode.slice(0,2)) <= 47 && r.value != null);

// 最新年度抽出
const latestYear = [...new Set(prefRows.map(r => r.yearCode))].sort((a, b) => b.localeCompare(a))[0];
const latestRows = prefRows.filter(r => r.yearCode === latestYear).sort((a, b) => Number(b.value) - Number(a.value));

// title/unit は D1 metrics から別途取得 (上記 Step 1 と同じパターン)
```

取得した全都道府県データから:
- `valueA` / `valueB` = 対象地域の値
- `rankA` / `rankB` = 値の降順での順位（1〜47）
- `indicator` = metrics.title (D1 cache, TS-config 由来)
- `unit` = metrics.unit (D1 cache, TS-config 由来)

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
- Remotion プレビュー: `/preview-remotion --type comparison`
- UTM ルール: `/generate-utm-url`
