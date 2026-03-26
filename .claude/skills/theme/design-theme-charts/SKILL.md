---
name: design-theme-charts
description: テーマダッシュボードのチャート設計 — chart_key, componentType, componentProps JSON を生成
argument-hint: "<theme-key>"
allowed-tools: Read, Grep, Glob, Bash
---

テーマダッシュボードに追加するチャートを設計し、INSERT SQL のプレビューを出力する。

## 引数

`$ARGUMENTS` — テーマキー（例: `occupation-salary`）

## 前提

- `/audit-theme-components` の結果が直前の会話にあること
- panelTabs が IndicatorSet に定義済みであること

## 手順

### Phase 1: データ収集

1. IndicatorSet を読み込む（panelTabs, indicators）
2. 既存 page_components を DB から取得（重複回避）
3. panelTab 内の各 rankingKey の source_config を取得:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite', {readonly: true});
const keys = [/* 対象 rankingKeys */];
const rows = db.prepare(\`
  SELECT ranking_key, ranking_name, unit, source_config
  FROM ranking_items
  WHERE area_type = 'prefecture' AND is_active = 1
  AND ranking_key IN (\${keys.map(() => '?').join(',')})
\`).all(...keys);
rows.forEach(r => {
  const sc = r.source_config ? JSON.parse(r.source_config) : null;
  console.log(r.ranking_key, '|', r.unit, '|', JSON.stringify(sc));
});
db.close();
"
```

### Phase 2: チャートタイプ決定

4. 各 panelTab について、`${CLAUDE_SKILL_DIR}/reference/chart-patterns.md` の決定木を適用:

| 条件 | タイプ |
|---|---|
| 件数(実数) + 率(比率) の対比 | mixed-chart |
| 2〜3指標の時系列対比 | line-chart（複数 series） |
| 単一指標の推移 | line-chart（単一 series） |
| カテゴリ構成比 | composition-chart |
| 物価テーマ | cpi-profile / cpi-heatmap |

### Phase 3: componentProps JSON 生成

5. source_config から estatParams を取得し、componentProps を組み立てる。

**line-chart**:
```json
{
  "estatParams": [
    {"statsDataId": "source_configから", "cdCat01": "source_configから"}
  ],
  "labels": ["指標名"],
  "seriesColors": ["色規約に従う"]
}
```

**mixed-chart**:
```json
{
  "columnParams": [{"statsDataId": "...", "cdCat01": "..."}],
  "lineParams": [{"statsDataId": "...", "cdCat01": "..."}],
  "columnLabels": ["件数系ラベル"],
  "lineLabels": ["率系ラベル"],
  "leftUnit": "件",
  "rightUnit": "%",
  "columnColors": ["#f59e0b"],
  "lineColors": ["#22c55e"]
}
```

実例は `${CLAUDE_SKILL_DIR}/reference/component-props-examples.md` を参照。

**estatParams は source_config の値をそのまま使う。手入力禁止。**

source_config に cdCat02 等の追加パラメータがある場合はそれも含める。

### Phase 4: 色の決定

6. `${CLAUDE_SKILL_DIR}/reference/chart-patterns.md` の色規約に従う:
   - 予約色を最優先（男性/女性）
   - 推奨マッピング（危険=#ef4444, 件数=#f59e0b, 改善=#22c55e）
   - 同テーマ内で同じ色が重複しないよう配慮

### Phase 5: chart_key とメタデータ

7. 各チャートに以下を決定:
   - **chart_key**: `theme-{themeKey}-{section略}-{description}` kebab-case
   - **title**: 日本語（「XXとYYの推移」等）
   - **section**: panelTab.label と完全一致
   - **sort_order**: セクション内の表示順（0始まり、10刻み）
   - **source_name**: 出典名（例: `総務省「社会生活統計指標」`）
   - **source_link**: 出典 URL（e-Stat のページ等）
   - **grid_column_span**: 12（チャートは全幅）

### Phase 6: 設計レビュー出力

8. 以下の形式で出力:

```markdown
## チャート設計: {テーマ名} ({themeKey})

### 追加チャート一覧

| # | chart_key | type | title | section | sort |
|---|-----------|------|-------|---------|------|
| 1 | theme-occ-edu-trend | line-chart | 教育職の年収推移 | 教育 | 0 |

### 各チャートの詳細

#### 1. theme-occ-edu-trend
- componentType: line-chart
- section: 教育
- sort_order: 0
- componentProps:
```json
{ "estatParams": [...], "labels": [...], "seriesColors": [...] }
```
- 設計理由: 教育タブにチャートがないため、主要職種の年収推移を可視化

### INSERT SQL プレビュー

-- page_components
INSERT INTO page_components (chart_key, component_type, title, component_props, source_name, grid_column_span, is_active)
VALUES ('theme-occ-edu-trend', 'line-chart', '教育職の年収推移', '{"estatParams":...}', '厚生労働省「賃金構造基本統計調査」', 12, 1);

-- page_component_assignments
INSERT INTO page_component_assignments (page_type, page_key, chart_key, section, sort_order)
VALUES ('theme', 'occupation-salary', 'theme-occ-edu-trend', '教育', 0);
```

**この段階では DB に INSERT しない。ユーザー承認後に `/insert-theme-components` で実行する。**

## 注意

- DB は readonly で開くこと（設計スキルは読み取りのみ）
- 既存チャートと chart_key が重複しないか確認する
- ThemeDbChartRenderer 対応タイプのみ使用（line-chart, mixed-chart, donut-chart, cpi-profile, cpi-heatmap, pyramid-chart, composition-chart）
- 1セクション最大2チャート
