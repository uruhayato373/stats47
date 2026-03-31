---
name: insert-theme-components
description: 設計済みチャートの DB 投入 — 既存コンポーネント再利用（assignments のみ）+ 新規作成
argument-hint: "<theme-key>"
disable-model-invocation: true
allowed-tools: Read, Bash
---

`/design-theme-charts` で設計したチャートを DB に投入する。

## 設計原則

- **既存コンポーネント再利用**: chart_key が既に `page_components` にある場合、`page_component_assignments` のみ追加
- **新規コンポーネント**: chart_key が存在しない場合のみ `page_components` に INSERT
- **重複禁止**: 同じ page_type + page_key + chart_key の assignment は INSERT OR IGNORE
- **areas との共有**: テーマ用に作成したチャートは、関連する area-category にも割り当てることを検討

## 引数

`$ARGUMENTS` — テーマキー（例: `local-economy`）

## 前提

- `/design-theme-charts` の設計結果が直前の会話にあること
- ユーザーが設計を承認済みであること

## 手順

### Phase 1: 事前チェック

1. DB パスの存在確認
2. 設計された chart_key が既に page_components に存在するか確認（再利用 vs 新規を判定）

### Phase 2: 既存コンポーネント再利用（assignments のみ）

3. 既に `page_components` にある chart_key → `page_component_assignments` のみ INSERT:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');

const insertAssignment = db.prepare(\`
  INSERT OR IGNORE INTO page_component_assignments
  (page_type, page_key, chart_key, section, sort_order)
  VALUES ('theme', ?, ?, ?, ?)
\`);

const reuse = [
  // { chartKey, section, sortOrder }
];

const tx = db.transaction(() => {
  for (const r of reuse) {
    insertAssignment.run('$ARGUMENTS', r.chartKey, r.section, r.sortOrder);
  }
});
tx();
console.log('再利用:', reuse.length, '件');
"
```

### Phase 3: 新規コンポーネント作成

4. `page_components` にない chart_key → INSERT + assignments:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');

const insertComponent = db.prepare(\`
  INSERT OR IGNORE INTO page_components
  (chart_key, component_type, title, component_props, source_name, source_link, grid_column_span, is_active)
  VALUES (?, ?, ?, ?, ?, ?, 12, 1)
\`);

const insertAssignment = db.prepare(\`
  INSERT OR IGNORE INTO page_component_assignments
  (page_type, page_key, chart_key, section, sort_order)
  VALUES ('theme', ?, ?, ?, ?)
\`);

const newComponents = [
  // { chartKey, componentType, title, componentProps, sourceName, sourceLink, section, sortOrder }
];

const tx = db.transaction(() => {
  for (const c of newComponents) {
    insertComponent.run(c.chartKey, c.componentType, c.title, JSON.stringify(c.componentProps), c.sourceName, c.sourceLink);
    insertAssignment.run('$ARGUMENTS', c.chartKey, c.section, c.sortOrder);
  }
});
tx();
console.log('新規:', newComponents.length, '件');
"
```

### Phase 4: KPI カード追加

5. テーマの panelTabs 用 KPI カードを追加。既存の KPI カードがあれば再利用:

### Phase 5: component_data への事前投入

6. **新規作成した** `composition-chart` チャートのデータをリモート D1 に投入:

```
/populate-component-data <chart_key1> <chart_key2> ...
```

- 既存チャートへの `assignment` のみ追加した場合はスキップ可
- 新規 `composition-chart` の `multipleStatsSources` または `statsDataId` が設定されていることを確認してから実行



- `kpiDataByArea` でプリフェッチされるため、`estatParams` が必須
- 他テーマ・areas と同じ指標なら同じ chart_key を共有

### Phase 5: 検証

6. 投入結果を確認:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('...', {readonly: true});
const rows = db.prepare(\`
  SELECT pc.chart_key, pc.title, pc.component_type, pca.section
  FROM page_component_assignments pca
  JOIN page_components pc ON pc.chart_key = pca.chart_key
  WHERE pca.page_type = 'theme' AND pca.page_key = ?
  ORDER BY pca.section, pca.sort_order
\`).all('$ARGUMENTS');
rows.forEach(r => console.log('[' + r.section + ']', r.chart_key, '|', r.title, '|', r.component_type));
"
```

7. ユーザーに次のステップを案内:

```
次のステップ:
1. npm run dev → http://localhost:3000/themes/{themeKey} で表示確認
2. (任意) /sync-remote-d1 --key page_components
3. (任意) /sync-remote-d1 --key page_component_assignments
```

## 注意

- INSERT OR IGNORE を使用（既存は上書きしない）
- トランザクション内で実行
- DB パスは固定値を使用（CLAUDE.md 参照）
