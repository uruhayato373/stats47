---
name: insert-theme-components
description: 設計済みチャートの DB 投入 — 既存コンポーネント再利用（別ページへの割り当て）+ 新規作成
argument-hint: "<theme-key>"
disable-model-invocation: true
allowed-tools: Read, Bash
---

`/design-theme-charts` で設計したチャートを DB に投入する。

## 設計原則

- **1テーブル**: `page_components` のみ。`page_component_assignments` テーブルは廃止済み (PR #216)
- **再利用**: 他ページで使っている chart_key を同じテーマページにも載せたい場合、同じ chart_key + 同じ props で新しい行を INSERT
- **重複禁止**: 同じ `(page_type, page_key, chart_key)` は INSERT OR IGNORE
- **areas との共有**: テーマ用に作成したチャートは、関連する area-category にも INSERT することを検討

## 引数

`$ARGUMENTS` — テーマキー（例: `local-economy`）

## 前提

- `/design-theme-charts` の設計結果が直前の会話にあること
- ユーザーが設計を承認済みであること

## 手順

### Phase 1: 事前チェック

1. DB パスの存在確認
2. 同じ chart_key が別ページで既に使われているか確認（component_props を再利用できる）

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite', {readonly: true});
// 確認したい chart_key のリスト
const keys = ['<chart_key1>', '<chart_key2>'];
for (const key of keys) {
  const rows = db.prepare('SELECT page_type, page_key FROM page_components WHERE chart_key = ?').all(key);
  console.log(key, '→', rows.length === 0 ? '新規' : '既存: ' + rows.map(r => r.page_type + '/' + r.page_key).join(', '));
}
db.close();
"
```

### Phase 2: 既存チャートの別ページへの追加（再利用）

3. 他ページで既に使われている chart_key → 同じ props で新しい行を INSERT:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');

// 再利用元ページから props を取得して新ページに INSERT
const stmt = db.prepare(\`
  INSERT OR IGNORE INTO page_components
  (page_type, page_key, chart_key, section, sort_order,
   component_type, title, component_props, source_name, source_link,
   ranking_link, tags, grid_column_span, grid_column_span_tablet,
   grid_column_span_sm, data_source, source_id, is_active)
  SELECT 'theme', ?, chart_key, ?, ?,
         component_type, title, component_props, source_name, source_link,
         ranking_link, tags, grid_column_span, grid_column_span_tablet,
         grid_column_span_sm, data_source, source_id, is_active
  FROM page_components
  WHERE chart_key = ?
  LIMIT 1
\`);

const reuse = [
  // { chartKey, section, sortOrder }
];

const tx = db.transaction(() => {
  for (const r of reuse) {
    stmt.run('$ARGUMENTS', r.section, r.sortOrder, r.chartKey);
  }
});
tx();
console.log('再利用:', reuse.length, '件');
db.close();
"
```

### Phase 3: 新規コンポーネント作成

4. 新規 chart_key → `page_components` に 1 行 INSERT（page_type='theme', page_key='$ARGUMENTS'）:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');

const insert = db.prepare(\`
  INSERT OR IGNORE INTO page_components
  (page_type, page_key, chart_key, section, sort_order,
   component_type, title, component_props, source_name, source_link,
   grid_column_span, is_active)
  VALUES ('theme', ?, ?, ?, ?, ?, ?, ?, ?, ?, 12, 1)
\`);

const newComponents = [
  // { chartKey, section, sortOrder, componentType, title, componentProps, sourceName, sourceLink }
];

const tx = db.transaction(() => {
  for (const c of newComponents) {
    insert.run('$ARGUMENTS', c.chartKey, c.section, c.sortOrder,
      c.componentType, c.title, JSON.stringify(c.componentProps),
      c.sourceName ?? null, c.sourceLink ?? null);
  }
});
tx();
console.log('新規:', newComponents.length, '件');
db.close();
"
```

### Phase 4: KPI カード追加

5. テーマの panelTabs 用 KPI カードを追加（Phase 3 と同じ INSERT で `component_type='kpi-card'`）

### Phase 5: composition-chart データ投入

6. **新規作成した** `composition-chart` チャートのデータをリモート D1 に投入:

```
/populate-component-data <chart_key1> <chart_key2> ...
```

- 新規 `composition-chart` の `multipleStatsSources` または `statsDataId` が設定されていることを確認してから実行

### Phase 6: 検証

7. 投入結果を確認:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite', {readonly: true});
const rows = db.prepare(\`
  SELECT chart_key, title, component_type, section, sort_order
  FROM page_components
  WHERE page_type = 'theme' AND page_key = ?
  ORDER BY section, sort_order
\`).all('$ARGUMENTS');
rows.forEach(r => console.log('[' + r.section + ']', r.chart_key, '|', r.title, '|', r.component_type));
db.close();
"
```

8. ユーザーに次のステップを案内:

```
次のステップ:
1. npm run dev → http://localhost:3000/themes/{themeKey} で表示確認
2. /sync-snapshots で page-components スナップショットを更新・本番反映
```

## 注意

- INSERT OR IGNORE を使用（同一 page_type + page_key + chart_key は上書きしない）
- トランザクション内で実行
- DB パスは固定値を使用（CLAUDE.md 参照）
