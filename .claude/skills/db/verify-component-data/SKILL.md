---
name: verify-component-data
description: component_data テーブルのデータ鮮度・完全性チェック
argument-hint: "[chart-key] | --all"
disable-model-invocation: true
allowed-tools: Read, Bash
---

`component_data` テーブルのデータ鮮度と完全性を検証する。

## 引数

`$ARGUMENTS` — 対象チャートキー（省略時は全件）

## Phase 1: リモート D1 の現状確認

```bash
cd apps/web && npx wrangler d1 execute stats47_static --remote --env production -y \
  --command "
    SELECT
      chart_key,
      COUNT(*) as total_rows,
      COUNT(DISTINCT area_code) as areas,
      COUNT(DISTINCT year_code) as years,
      COUNT(DISTINCT category_key) as categories,
      MAX(updated_at) as last_updated,
      julianday('now') - julianday(MAX(updated_at)) as days_since_update
    FROM component_data
    GROUP BY chart_key
    ORDER BY last_updated DESC;
  " --json
```

## Phase 2: page_components との対照

```bash
node -e "
const Database = require('better-sqlite3');
const DB_PATH = '../../.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite';
const db = new Database(DB_PATH, { readonly: true });
const arg = '$ARGUMENTS';
const rows = db.prepare(\`
  SELECT chart_key, component_type, title
  FROM page_components
  WHERE is_active = 1
    AND component_type = 'composition-chart'
    AND (? = '' OR chart_key = ?)
  ORDER BY chart_key
\`).all(arg, arg);
console.log('対象 composition-chart コンポーネント:', rows.length, '件');
rows.forEach(r => console.log(' -', r.chart_key, '|', r.title));
db.close();
"
```

## Phase 3: 判定

| 状態 | 判定 | アクション |
|---|---|---|
| `days_since_update < 30` かつ `areas = 47` | ✅ 正常 | なし |
| `days_since_update >= 30` | ⚠️ 古い | `/populate-component-data <chart-key>` で再投入 |
| `areas < 47` | ⚠️ 欠損 | `/populate-component-data <chart-key>` で再投入 |
| `component_data` に存在しない chart_key | 🔴 未投入 | `/populate-component-data <chart-key>` で新規投入 |

## Phase 4: 結果レポート出力

```
=== component_data 検証レポート ===
チェック日時: 2026-03-31

✅ 正常:
  - cmp-mining-industry-mix: 47地域 × 4年 × 7カテゴリ = 1,316行（最終更新: 2026-03-28）

⚠️ 要再投入（30日超）:
  なし

🔴 未投入（D1 なし → R2/API フォールバック中）:
  なし

推奨アクション:
  すべて正常です。
```
