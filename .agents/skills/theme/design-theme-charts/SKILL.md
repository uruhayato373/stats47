---
name: design-theme-charts
description: テーマ用チャートを設計する（既存コンポーネント再利用 + e-Stat API 調査 + 指標ハブ・注釈契約）。Use when user says "テーマチャート設計", "チャート追加設計".
disable-model-invocation: true
argument-hint: '<theme-key>'
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
primary_agent: theme-component-builder
---

テーマダッシュボードに追加するチャートを設計する。既存コンポーネントの再利用を最優先し、不足分のみ新規設計する。

> **★ ThemeCatalog SSOT**: `THEME_CATALOGS` 登録テーマは
> `packages/data-configs/src/theme-catalog/<key>.ts` が SSOT、page-components JSON は生成物 (手編集禁止)。
> 正典 = `.claude/rules/theme-catalog-standards.md` (componentType 9 種・チャート選定文法)。
> **panelTabs は廃止済み**・**section は theme renderer 未使用** (配置は componentType + `sortOrder` + `gridColumnSpan`)。

## 設計原則

1. **1データ1コンポーネント**: 同じ指標は1つの chart_key を areas / theme で共有する
2. **既存コンポーネント再利用優先**: areas ページに既にあるチャートは既存 contract を再利用する
3. **e-Stat API 起点**: DB にデータがなくても e-Stat API から取得可能なら新規設計の対象
4. **共通コンポーネント使用**: LineChartClient, CompositionChartClient 等の共通 UI を使う
5. **都道府県/市区町村分離**: 都道府県用と市区町村用は別レコード（statsDataId が異なる）

## 引数

`$ARGUMENTS` — テーマキー（例: `local-economy`）

## 手順

### Phase 1: 現状把握

1. 対象 `ThemeCatalog` の `metrics[]` / `charts[]` を読み込む
2. 生成済み page-components（theme + area-category）を読み、共有候補を確認
3. `sortOrder`、指標カードとの重複、指標ハブ導線の有無を確認

### Phase 2: 既存コンポーネント再利用調査

4. area-category の全カテゴリから、テーマに関連するチャートを検索:

完全DBレス: `page_components` の SSOT は git TS JSON（`apps/web/scripts/data/page-components/<type>/<pageKey>.json`。旧 D1/miniflare は廃止）。全ページの JSON を読み、対象テーマに未割り当ての既存チャートを検索:

```bash
node -e "
const fs = require('fs'), path = require('path');
const ROOT = 'apps/web/scripts/data/page-components';
const THEME_KEY = 'THEME_KEY';
const byKey = new Map();
for (const type of fs.readdirSync(ROOT)) {
  const dir = path.join(ROOT, type);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const pageKey = file.replace(/\.json$/, '');
    for (const c of JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))) {
      if (c.componentType === 'kpi-card') continue;
      const e = byKey.get(c.componentKey) || { title: c.title, componentType: c.componentType, pages: new Set() };
      e.pages.add(type + '/' + pageKey);
      byKey.set(c.componentKey, e);
    }
  }
}
const onTheme = new Set([...byKey].filter(([, e]) => e.pages.has('theme/' + THEME_KEY)).map(([k]) => k));
for (const [key, e] of byKey) {
  if (onTheme.has(key)) continue;
  console.log(key, '|', e.title, '|', e.componentType, '|', [...e.pages].join(','));
}
"
```

再利用可能なチャートは、対象テーマの `ThemeCatalog.charts[]` に同じ契約を記述する。生成済み
`page-components/theme/<THEME_KEY>.json` は直接編集しない。

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
- 指標一般の定義・算出方法は `/ranking/[key]` に置き、`relatedRankingKeys` で接続する
- `annotation` は系列断絶・分母差・比較不能条件など、表示しないと誤読する固有条件だけにする
- 「線の傾きを確認できます」等の componentType 由来 description は設計しない

10. chart_key の命名:
    - areas でも使えるよう汎用的な名前にする（`theme-` プレフィックスではなく `cmp-` 等）
    - 市区町村版が必要な場合は `city-` プレフィックス

### Phase 6: 設計レビュー出力

11. 以下の形式で出力:

```markdown
## チャート設計: {テーマ名}

### 既存コンポーネント再利用

| componentKey | title              | type       | 元ページ              | relatedRankingKeys | annotation |
| ------------ | ------------------ | ---------- | --------------------- | ------------------ | ---------- |
| cmp-econ-gdp | 県内総生産額の推移 | line-chart | area-category/economy | prefectural-gdp    | —          |

### 新規チャート

| componentKey | title | type       | estatParams                  | relatedRankingKeys | annotation |
| ------------ | ----- | ---------- | ---------------------------- | ------------------ | ---------- |
| cmp-xxx      | ...   | line-chart | statsDataId:xxx, cdCat01:xxx | ...                | 必要時のみ |

### ThemeCatalog TS 差分プレビュー

...
```

**この段階では SSOT を変更しない。承認後に `/insert-theme-components` で ThemeCatalog TS へ反映する。**

## 注意

- 既存チャートと chart_key の重複を必ず確認
- e-Stat API のメタ情報で取得可能なデータを確認してから設計する
- 同じ事実を指標カードと chart で二重に強調しない

## 参照

- `/inspect-estat-meta` — e-Stat メタデータ調査
- `/search-estat` — e-Stat 統計表検索
- `/audit-theme-components` — テーマ監査
- `/insert-theme-components` — ThemeCatalog TS 反映
- `.claude/design-system/page-components.md` — 設計原則（1データ1コンポーネント）
- `${CLAUDE_SKILL_DIR}/reference/chart-patterns.md` — チャート決定木
