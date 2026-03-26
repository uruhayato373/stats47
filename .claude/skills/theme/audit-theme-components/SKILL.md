---
name: audit-theme-components
description: テーマダッシュボードの現状監査 — page_components と IndicatorSet のギャップを分析
argument-hint: "<theme-key> | --all"
allowed-tools: Read, Grep, Glob, Bash
---

テーマダッシュボードの page_components を IndicatorSet と突き合わせ、ギャップレポートを出力する。

## 引数

`$ARGUMENTS` — テーマキー（例: `occupation-salary`）または `--all`（全テーマ一括サマリー）

## 手順

### Phase 1: テーマ定義の読み込み

1. IndicatorSet を読み込む:

```
packages/types/src/indicator-sets/{themeKey}.ts
```

抽出する情報:
- `indicators[]` — rankingKey, shortLabel, role
- `panelTabs[]` — label, rankingKeys

panelTabs が未定義のテーマは「panelTabs 設計が先に必要（theme-designer に委譲）」と報告して終了。

### Phase 2: 既存 page_components の取得

2. ローカル DB を **readonly** で開き、テーマの page_components を取得:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite', {readonly: true});
const rows = db.prepare(\`
  SELECT pc.chart_key, pc.component_type, pc.title, pca.section, pca.sort_order
  FROM page_component_assignments pca
  JOIN page_components pc ON pca.chart_key = pc.chart_key
  WHERE pca.page_type = 'theme' AND pca.page_key = ?
  ORDER BY pca.section, pca.sort_order
\`).all('$ARGUMENTS');
console.log(JSON.stringify(rows, null, 2));
db.close();
"
```

### Phase 3: ranking_items の確認

3. IndicatorSet の各 rankingKey が ranking_items に登録済みか確認:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite', {readonly: true});
const keys = [/* IndicatorSet から抽出した rankingKeys */];
const placeholders = keys.map(() => '?').join(',');
const rows = db.prepare(\`
  SELECT ranking_key, ranking_name, source_config, latest_year
  FROM ranking_items
  WHERE area_type = 'prefecture' AND is_active = 1
  AND ranking_key IN (\${placeholders})
\`).all(...keys);
console.log(JSON.stringify(rows, null, 2));
db.close();
"
```

4. source_config が null の指標を「e-Stat パラメータ未設定」として報告。

### Phase 4: ギャップ分析

5. 以下の観点で分析:

| チェック項目 | 内容 |
|---|---|
| panelTab カバレッジ | 各 panelTab.label に対応する section のチャートが存在するか |
| チャートタイプの妥当性 | ThemeDbChartRenderer 対応タイプか（line-chart, mixed-chart, donut-chart, cpi-profile, cpi-heatmap, pyramid-chart, composition-chart） |
| section 名の一致 | assignments.section が panelTabs.label と完全一致しているか |
| 未登録指標 | ranking_items に存在しない rankingKey |
| source_config 未設定 | ranking_items にあるが source_config が null |

### Phase 5: レポート出力

6. 以下の形式で出力:

```markdown
## テーマ監査: {テーマ名} ({themeKey})

### 概要
- IndicatorSet 指標数: XX
- panelTabs: XX タブ
- 既存 page_components: XX 件（チャート XX + その他 XX）
- チャートカバレッジ: X/X タブ

### panelTab 別状況

| タブ | 指標数 | チャート | タイプ | 状態 |
|------|--------|---------|--------|------|
| 医療・福祉 | 7 | 1 | line-chart | 追加余地あり |
| 教育 | 5 | 0 | — | ❌ 空 |

### 問題点
- {chart_key}: component_type が `ranking-chart`（ThemeDbChartRenderer 非対応）
- {rankingKey}: ranking_items 未登録
- {rankingKey}: source_config が null

### 推奨アクション
1. {tabLabel} タブにチャートを追加
2. 非対応タイプ {chart_key} を line-chart に作り直す
3. 未登録指標 {X} を data-pipeline で登録
```

## --all 指定時

全テーマの概要を1テーブルで出力:

```markdown
| テーマ | 指標数 | panelTabs | チャート数 | カバレッジ | 状態 |
|--------|--------|-----------|-----------|-----------|------|
| safety | 25 | 5 | 25 | 5/5 | ✅ |
| occupation-salary | 31 | 5 | 3 | 3/5 | 🔶 |
| labor-wages | 12 | 4 | 0 | 0/4 | ❌ |
```

## 注意

- DB は **readonly** で開くこと（監査は読み取りのみ）
- DB パスは固定値を使用（CLAUDE.md 参照）
- panelTabs 未定義テーマの個別詳細は出さない（theme-designer に先に委譲）
