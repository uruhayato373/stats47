---
name: insert-theme-components
description: 設計済みチャートの page_components + page_component_assignments への INSERT 実行
argument-hint: "<theme-key>"
disable-model-invocation: true
allowed-tools: Read, Bash
---

`/design-theme-charts` で設計したチャートを DB に投入する。

## 引数

`$ARGUMENTS` — テーマキー（例: `occupation-salary`）

## 前提

- `/design-theme-charts` の設計結果が直前の会話にあること
- ユーザーが設計を承認済みであること

## 手順

### Phase 1: 事前チェック

1. DB パスの存在確認:

```bash
ls -la .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite
```

2. chart_key の重複チェック:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite', {readonly: true});
const keys = [/* 設計した chart_keys */];
const existing = db.prepare(
  'SELECT chart_key FROM page_components WHERE chart_key IN (' + keys.map(() => '?').join(',') + ')'
).all(...keys);
if (existing.length > 0) {
  console.log('⚠️ 重複あり:', existing.map(r => r.chart_key));
  console.log('INSERT OR REPLACE で上書きされます');
}
db.close();
"
```

### Phase 2: INSERT 実行

3. better-sqlite3 でトランザクション内で一括 INSERT:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');

const insertComponent = db.prepare(\`
  INSERT OR REPLACE INTO page_components
  (chart_key, component_type, title, component_props, source_name, source_link, ranking_link, tags, grid_column_span, grid_column_span_tablet, grid_column_span_sm, data_source, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
\`);

const insertAssignment = db.prepare(\`
  INSERT OR REPLACE INTO page_component_assignments
  (page_type, page_key, chart_key, section, sort_order)
  VALUES ('theme', ?, ?, ?, ?)
\`);

const components = [
  // /design-theme-charts の出力からコンポーネント配列を組み立てる
  // { chartKey, componentType, title, componentProps, sourceName, sourceLink, rankingLink, tags, gridColumnSpan, gridColumnSpanTablet, gridColumnSpanSm, dataSource, section, sortOrder }
];

const insertAll = db.transaction((items) => {
  for (const c of items) {
    insertComponent.run(
      c.chartKey, c.componentType, c.title,
      JSON.stringify(c.componentProps),
      c.sourceName || null, c.sourceLink || null, c.rankingLink || null,
      c.tags ? JSON.stringify(c.tags) : null,
      c.gridColumnSpan || 12, c.gridColumnSpanTablet || null, c.gridColumnSpanSm || null,
      c.dataSource || 'ranking'
    );
    insertAssignment.run('$ARGUMENTS', c.chartKey, c.section || null, c.sortOrder || 0);
  }
});

insertAll(components);
console.log('✅ ' + components.length + ' 件投入完了');
db.close();
"
```

### Phase 3: 検証

4. 投入結果を確認:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite', {readonly: true});
const total = db.prepare(
  \"SELECT COUNT(*) as cnt FROM page_component_assignments WHERE page_type='theme' AND page_key=?\"
).get('$ARGUMENTS');
const sections = db.prepare(
  \"SELECT section, COUNT(*) as cnt FROM page_component_assignments WHERE page_type='theme' AND page_key=? GROUP BY section ORDER BY section\"
).all('$ARGUMENTS');
console.log('合計:', total.cnt, '件');
console.log('セクション別:');
sections.forEach(s => console.log('  ' + (s.section || '(トップレベル)') + ':', s.cnt, '件'));
db.close();
"
```

5. ユーザーに次のステップを案内:

```
✅ page_components: {N} 件追加
✅ page_component_assignments: {N} 件追加

セクション別:
  医療・福祉: 1 件
  教育: 1 件
  ...

次のステップ:
1. npm run dev → http://localhost:3000/themes/{themeKey} で表示確認
2. (任意) /ui-panel-review http://localhost:3000/themes/{themeKey}
3. (任意) /sync-remote-d1 --table page_components --table page_component_assignments
```

## ロールバック

問題がある場合、投入したチャートを削除:

```sql
DELETE FROM page_component_assignments
WHERE page_type = 'theme' AND page_key = '{themeKey}'
AND chart_key IN ('chart_key_1', 'chart_key_2', ...);

DELETE FROM page_components
WHERE chart_key IN ('chart_key_1', 'chart_key_2', ...);
```

## 注意

- INSERT OR REPLACE を使用（同じ chart_key は上書き）
- トランザクション内で実行（途中エラーは全件ロールバック）
- DB パスは固定値を使用（CLAUDE.md 参照）
- `/tmp/` に一時スクリプトを作成した場合は最後に削除する
