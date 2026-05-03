---
name: verify-component-data
description: page_components ↔ R2 snapshot ↔ ローカル D1 component_data の整合性を検証する。Use when user says "コンポーネントデータ検証", "verify-component-data", "データ鮮度チェック". チャートキー個別 or 全件対応.
argument-hint: "[chart-key] | --all"
disable-model-invocation: true
allowed-tools: Read, Bash
---

`page_components` テーブルで定義された composition-chart コンポーネントが、必要なデータを持っているかを検証する。

> **設計**: リモート D1 は Phase 10 (2026-04-29) で撤廃済み。検証はローカル D1 と R2 snapshot に対して行う。詳細: `docs/01_技術設計/11_データ基盤設計.md`

## 引数

`$ARGUMENTS` — 対象チャートキー（省略時は全件）

## Phase 1: ローカル D1 の component_data 確認

```bash
node -e "
const Database = require('better-sqlite3');
const DB_PATH = '/Users/minamidaisuke/stats47/.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite';
const db = new Database(DB_PATH, { readonly: true });
const arg = '$ARGUMENTS';
const where = (!arg || arg === '--all') ? '' : \"WHERE chart_key = '\" + arg + \"'\";
const rows = db.prepare(\`
  SELECT
    chart_key,
    COUNT(*) as total_rows,
    COUNT(DISTINCT area_code) as areas,
    COUNT(DISTINCT year_code) as years,
    COUNT(DISTINCT category_key) as categories,
    MAX(updated_at) as last_updated
  FROM component_data
  \${where}
  GROUP BY chart_key
  ORDER BY last_updated DESC
\`).all();
console.log(JSON.stringify(rows, null, 2));
db.close();
"
```

## Phase 2: page_components との対照

```bash
node -e "
const Database = require('better-sqlite3');
const DB_PATH = '/Users/minamidaisuke/stats47/.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite';
const db = new Database(DB_PATH, { readonly: true });
const arg = '$ARGUMENTS';
const filter = (!arg || arg === '--all') ? '' : \"AND chart_key = '\" + arg + \"'\";
const rows = db.prepare(\`
  SELECT chart_key, component_type, title
  FROM page_components
  WHERE is_active = 1
    AND component_type = 'composition-chart'
    \${filter}
  ORDER BY chart_key
\`).all();
console.log('対象 composition-chart コンポーネント:', rows.length, '件');
rows.forEach(r => console.log(' -', r.chart_key, '|', r.title));
db.close();
"
```

## Phase 3: R2 snapshot の存在確認

```bash
/r2-du snapshots/page-components/
```

`page-components/all.json` が存在し、最新であることを確認。古い場合は `/export-snapshots --only page-components` で再生成。

## Phase 4: 判定

| 状態 | 判定 | アクション |
|---|---|---|
| ローカル D1 にデータあり、`areas = 47` | ✅ 正常 | なし。`/export-snapshots` で R2 反映確認 |
| `last_updated >= 30日前` | ⚠️ 古い | `/populate-component-data <chart-key>` で再投入 |
| `areas < 47` | ⚠️ 欠損 | `/populate-component-data <chart-key>` で再投入 |
| ローカル D1 に存在しない chart_key | 🔴 未投入 | `/populate-component-data <chart-key>` で新規投入 |
| R2 snapshot が古い or 存在しない | ⚠️ R2 未反映 | `/export-snapshots --only page-components` → `/push-r2 --prefix snapshots/page-components/` |

## Phase 5: 結果レポート出力

```
=== component_data 検証レポート ===
チェック日時: <today>

ローカル D1:
✅ 正常:
  - cmp-mining-industry-mix: 47地域 × 4年 × 7カテゴリ = 1,316行（最終更新: <date>）

⚠️ 要再投入（30日超）:
  （該当なし）

🔴 未投入:
  （該当なし）

R2 snapshot:
✅ snapshots/page-components/all.json (最終更新 <date>)

推奨アクション:
  - すべて正常です
  - or /populate-component-data <key> → /export-snapshots --only page-components → /push-r2
```
