---
name: audit-theme-components
description: テーマダッシュボードの現状監査 — コンポーネント共有状況・ギャップ・重複を分析
argument-hint: "<theme-key> | --all"
allowed-tools: Read, Grep, Glob, Bash
---

テーマダッシュボードの page_components を監査し、設計原則との整合性を確認する。

## 設計原則（監査基準）

1. **1データ1コンポーネント**: 同じ estatParams のコンポーネントが複数存在してはならない
2. **areas との共有**: テーマ専用コンポーネント（`theme-` prefix）は、areas に同等品がない場合のみ許容
3. **共通 UI コンポーネント使用**: ThemeDbChartRenderer 経由で LineChartClient, CompositionChartClient 等を使う
4. **KPI は e-Stat API ベース**: ranking_data ベースの KPI は廃止済み。kpiDataByArea で e-Stat データをプリフェッチ

## 引数

`$ARGUMENTS` — テーマキー（例: `local-economy`）または `--all`（全テーマ一括）

## 手順

### Phase 1: テーマ定義の読み込み

1. IndicatorSet を読み込む: `packages/types/src/indicator-sets/{themeKey}.ts`

### Phase 2: 既存コンポーネント取得

2. テーマの page_components + assignments を DB から取得（readonly）

### Phase 3: 重複チェック

3. テーマ内で同じ estatParams を持つコンポーネントが複数ないか確認
4. areas ページと同じ estatParams で chart_key が異なるコンポーネントがないか確認:

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite', {readonly: true});
// テーマと areas で同じ estatParams だが異なる chart_key を検出
..."
```

### Phase 4: 共有状況チェック

5. テーマのチャートのうち、areas ページでも使われているもの（共有済み）と、テーマ専用のものを分類

### Phase 5: ギャップ分析

6. panelTab 別のチャート・KPI の充実度を確認:
   - チャートがないタブ
   - KPI カードがないタブ（kpiDataByArea 用の kpi-card page_components）
   - areas にあるがテーマに割り当てられていない関連チャート

### Phase 6: レポート出力

```markdown
## テーマ監査: {テーマ名}

### 概要
- panelTabs: XX タブ
- page_components: XX 件（KPI XX + チャート XX）
- areas と共有: XX 件
- テーマ専用: XX 件

### 重複
- ⚠ {chart_key_a} と {chart_key_b} が同じ estatParams

### タブ別状況
| タブ | KPI | チャート | 状態 |
|------|-----|---------|------|
| GDP・所得 | 2 | 3 | ✅ |
| 雇用 | 0 | 2 | 🔶 KPI なし |

### 再利用候補（areas に存在、テーマ未割り当て）
| chart_key | title | 元ページ |
|-----------|-------|---------|

### 推奨アクション
1. ...
```

## 注意

- DB は readonly で開くこと
- `.claude/design-system/page-components.md` の設計原則を参照
