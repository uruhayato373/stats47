---
name: design-theme-charts
description: テーマダッシュボードのチャート設計 — 既存コンポーネント再利用 + e-Stat API 調査 + 新規設計
argument-hint: "<theme-key>"
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch, Agent
---

テーマダッシュボードに追加するチャートを設計する。既存コンポーネントの再利用を最優先し、不足分のみ新規設計する。

## 設計原則

1. **1データ1コンポーネント**: 同じ指標は1つの chart_key を areas / theme で共有する
2. **既存コンポーネント再利用優先**: areas ページに既にあるチャートは `page_component_assignments` で割り当てるだけ
3. **e-Stat API 起点**: DB にデータがなくても e-Stat API から取得可能なら新規設計の対象
4. **共通コンポーネント使用**: LineChartClient, CompositionChartClient 等の共通 UI を使う
5. **都道府県/市区町村分離**: 都道府県用と市区町村用は別レコード（statsDataId が異なる）

## 引数

`$ARGUMENTS` — テーマキー（例: `local-economy`）

## 手順

### Phase 1: 現状把握

1. IndicatorSet を読み込む（panelTabs, indicators）
2. 既存の page_component_assignments（theme + area-category）を DB から取得
3. panelTab 別のチャート有無を確認

### Phase 2: 既存コンポーネント再利用調査

4. area-category の全カテゴリから、テーマに関連するチャートを検索:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite', {readonly: true});
// テーマに未割り当ての既存チャートを検索
const existing = db.prepare(\`
  SELECT pc.chart_key, pc.title, pc.component_type, pc.component_props,
         GROUP_CONCAT(DISTINCT pca.page_type || '/' || pca.page_key) as current_pages
  FROM page_components pc
  JOIN page_component_assignments pca ON pc.chart_key = pca.chart_key
  WHERE pc.is_active = 1 AND pc.component_type != 'kpi-card'
    AND pc.chart_key NOT IN (
      SELECT chart_key FROM page_component_assignments WHERE page_type = 'theme' AND page_key = ?
    )
  GROUP BY pc.chart_key
\`).all('THEME_KEY');
// キーワードでフィルタ
existing.forEach(r => console.log(r.chart_key, '|', r.title, '|', r.component_type, '|', r.current_pages));
"
```

再利用可能なチャートは `page_component_assignments` の INSERT のみで追加する。

### Phase 3: e-Stat API データ調査

5. 不足している指標について、e-Stat API のメタデータを調査:

- `/inspect-estat-meta` で statsDataId のカテゴリ構造を確認
- `/search-estat` で関連する統計テーブルを検索
- 競合ダッシュボード（e-Stat Dashboard, RESAS, Japan Dashboard）にあって stats47 にない指標を特定

6. 取得可能なデータを確認:

```bash
# メタデータ調査スクリプト
node /tmp/temp-inspect-meta.mjs <statsDataId>
```

### Phase 4: 競合・トレンド調査

7. WebSearch で競合サイトのテーマ関連ページを調査:

```
WebSearch: "{テーマキーワード} 都道府県 ダッシュボード"
WebSearch: "{テーマキーワード} 都道府県 ランキング site:todo-ran.com"
WebSearch: "{テーマキーワード} site:resas.go.jp"
```

8. 調査ポイント:
   - 競合が提供しているチャートタイプと指標
   - 競合にあって stats47 にない切り口
   - Google Trends / GSC で検索需要のある指標

### Phase 5: チャート設計

9. 新規チャートの componentProps を組み立てる:

- **estatParams は e-Stat API のメタ情報から取得**。ranking_items の source_config に依存しない
- chart-patterns.md の決定木でチャートタイプを決定
- 色規約に従う（男女色 #3b82f6/#ec4899 は予約）
- `showLatestValues: true` でチャート下リスト表示を検討

10. chart_key の命名:
    - areas でも使えるよう汎用的な名前にする（`theme-` プレフィックスではなく `cmp-` 等）
    - 市区町村版が必要な場合は `city-` プレフィックス

### Phase 6: 設計レビュー出力

11. 以下の形式で出力:

```markdown
## チャート設計: {テーマ名}

### 既存コンポーネント再利用（assignments のみ）

| chart_key | title | type | 元ページ | 追加先 section |
|-----------|-------|------|---------|---------------|
| cmp-econ-gdp | 県内総生産額の推移 | line-chart | area-category/economy | GDP・所得 |

### 新規チャート

| chart_key | title | type | section | estatParams |
|-----------|-------|------|---------|-------------|
| cmp-xxx | ... | line-chart | ... | statsDataId:xxx, cdCat01:xxx |

### INSERT SQL プレビュー
...
```

**この段階では DB に INSERT しない。ユーザー承認後に `/insert-theme-components` で実行する。**

## 注意

- DB は readonly で開くこと
- 既存チャートと chart_key の重複を必ず確認
- e-Stat API のメタ情報で取得可能なデータを確認してから設計する
- 1セクション最大3チャート（KPI 除く）

## 参照

- `/inspect-estat-meta` — e-Stat メタデータ調査
- `/search-estat` — e-Stat 統計表検索
- `/audit-theme-components` — テーマ監査
- `/insert-theme-components` — DB 投入
- `.claude/design-system/page-components.md` — 設計原則（1データ1コンポーネント）
- `${CLAUDE_SKILL_DIR}/reference/chart-patterns.md` — チャート決定木
