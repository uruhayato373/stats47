---
name: audit-theme-components
description: テーマダッシュボードの現状監査を実行する（コンポーネント共有状況・ギャップ・重複分析）。Use when user says "テーマ監査", "コンポーネント監査". page_components vs IndicatorSet ギャップ検出.
disable-model-invocation: true
argument-hint: '<theme-key> | --all'
allowed-tools: Read, Grep, Glob, Bash
primary_agent: theme-component-builder
---

テーマダッシュボードの page_components を監査し、設計原則との整合性を確認する。

> `THEME_CATALOGS` 登録テーマは `packages/data-configs/src/theme-catalog/<key>.ts` が SSOT。
> 正典 = `.claude/rules/theme-catalog-standards.md`。**panelTabs は廃止済み**・**section は theme renderer 未使用**。
> 整合検証は `npm run validate:catalog` / `generate:catalog --check` を使う。

## 設計原則（監査基準）

1. **1データ1コンポーネント**: 同じ estatParams のコンポーネントが複数存在してはならない
2. **areas との共有**: テーマ専用コンポーネント（`theme-` prefix）は、areas に同等品がない場合のみ許容
3. **共通 UI コンポーネント使用**: ThemeDbChartRenderer 経由で LineChartClient, CompositionChartClient 等を使う
4. **本スキルは page_components（チャート JSON）の監査に限定**。ダッシュボード本体の KPI・トレンドは
   `ThemeMetricsDashboard` が **R2 `app/ranking/<key>/values.json`** から自動生成する**チャート付き stats-card**で、
   page*components とは別経路（2026-06-20 統一）。本体 UI の整合は **theme-ui-manager** が管理（`docs/02*実装計画/10`）。
`kpiDataByArea`（e-Stat estatParams プリフェッチ）は page_components の `kpi-card` 専用で本体 KPI とは無関係。

## 引数

`$ARGUMENTS` — テーマキー（例: `local-economy`）または `--all`（全テーマ一括）

## 手順

### Phase 1: テーマ定義の読み込み

1. `packages/data-configs/src/theme-catalog/{themeKey}.ts` を読み込む

### Phase 2: 既存コンポーネント取得

2. ThemeCatalog と生成済み `page-components/theme/<key>.json` を取得し、drift を検査

### Phase 3: 重複チェック

3. テーマ内で同じ estatParams を持つコンポーネントが複数ないか確認
4. areas ページと同じ estatParams で chart_key が異なるコンポーネントがないか確認:

```bash
node -e "
const fs = require('fs'), path = require('path');
const ROOT = 'apps/web/scripts/data/page-components';
// 完全DBレス: 各 JSON の componentProps.estatParams を突合し、テーマと areas で同じ
// estatParams だが異なる componentKey を検出する（旧 D1/miniflare は廃止）
..."
```

### Phase 4: 共有状況チェック

5. テーマのチャートのうち、areas ページでも使われているもの（共有済み）と、テーマ専用のものを分類:

完全DBレス: `page_components` の SSOT は git TS JSON（旧 D1/miniflare は廃止）。

```bash
node -e "
const fs = require('fs'), path = require('path');
const ROOT = 'apps/web/scripts/data/page-components';
const THEME_KEY = '$ARGUMENTS';
// テーマのコンポーネント（section, sortOrder 順）
const themeComps = JSON.parse(fs.readFileSync(path.join(ROOT, 'theme', THEME_KEY + '.json'), 'utf8'))
  .sort((a, b) => (a.section || '').localeCompare(b.section || '') || (a.sortOrder || 0) - (b.sortOrder || 0));
// 非テーマページの全 componentKey 集合（共有判定用）
const nonTheme = new Set();
for (const type of fs.readdirSync(ROOT)) {
  if (type === 'theme') continue;
  const dir = path.join(ROOT, type);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json')))
    for (const c of JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))) nonTheme.add(c.componentKey);
}
themeComps.forEach(c => console.log(nonTheme.has(c.componentKey) ? '[共有]' : '[専用]', '[' + c.section + ']', c.componentKey, '|', c.componentType));
"
```

### Phase 5: ギャップ分析

6. 表示順・重複・編集契約を確認:
   - 旧定型 `description` の残存数（0 が正）
   - `markdown-section` 以外の `relatedRankingKeys` coverage（100% 未満は FAIL）
   - `annotation` が空・汎用説明・指標定義の複製になっていないか
   - 指標カードと page-components chart が同じ事実を二重強調していないか
   - areas にあるがテーマに割り当てられていない関連チャート

### Phase 6: レポート出力

```markdown
## テーマ監査: {テーマ名}

### 概要

- page_components: XX 件（KPI XX + チャート XX）
- areas と共有: XX 件
- テーマ専用: XX 件
- 指標ハブ導線: XX / XX 件（必須 XX / XX）
- 旧定型 description: XX 件（0 が正）

### 重複

- ⚠ {chart_key_a} と {chart_key_b} が同じ estatParams

### 編集契約

| componentKey | hub | annotation | description | 状態 |
| ------------ | --- | ---------- | ----------- | ---- |

### 再利用候補（areas に存在、テーマ未割り当て）

| chart_key | title | 元ページ |
| --------- | ----- | -------- |

### 推奨アクション

1. ...
```

## 注意

- `.claude/design-system/page-components.md` の設計原則を参照
- `validate:catalog` の error は修正必須、coverage warn は根拠を調査してから対応し推測で紐付けない
