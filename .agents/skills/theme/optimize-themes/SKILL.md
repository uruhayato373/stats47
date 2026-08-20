---
name: optimize-themes
description: テーマダッシュボードを継続最適化する（GSC/GA4 + 競合調査 + ギャップ分析 → 優先度付きアクション）。Use when user says "テーマ最適化", "ダッシュボード改善". 4軸分析で改善アクション出力.
disable-model-invocation: true
argument-hint: "[theme-key] | --all"
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
primary_agent: theme-component-builder
---

テーマダッシュボードをアクセスデータ・競合調査・トレンド調査・e-Stat データ調査の4軸で分析し、優先度付き改善アクションを出力する。

## 設計原則

- **1データ1コンポーネント**: 同じ指標は1つの chart_key を areas / theme で共有
- **既存コンポーネント再利用優先**: areas にあるチャートは page_components に同じ chart_key を別行 INSERT するだけ
- **e-Stat API 起点（指標の発見・選定）**: DB にデータがなくても e-Stat API から取得可能なら追加候補（これは「どの指標を追加するか」のオーサリング判断であり、runtime のデータ取得ではない）
- **ダッシュボード本体の指標値は R2 から読む（2026-06-20 統一）**: `loadThemeData` が `app/ranking/<key>/values.json`（全年）を読み、`ThemeMetricsDashboard` が指標 1 件 = 1 枚の `ChartCard`（値 + 全国トレンド + ランキングリンク）を
  グリッド描画する（**上位県バー `RankingBarList`・データのみ KPI カード・大トレンドは出さない**）。**e-Stat ライブ取得はしない**（Workers ランタイムで失敗するため。正典: `apps/web/src/features/theme-dashboard/README.md`）。`kpiDataByArea`（e-Stat estatParams プリフェッチ）は page_components の `kpi-card` コンポーネント専用で、ダッシュボード本体の KPI とは別経路。

## 引数

`$ARGUMENTS` — テーマキー（例: `local-economy`）または `--all`（全テーマ一括）

## 手順

### Phase 1: アクセスデータ収集

1. **GSC データ取得**:

```
/fetch-gsc-data last3m page,query page=/themes/
```

- テーマページ別の Clicks / Impressions / CTR / 平均順位
- CTR < 3% かつ表示回数多い → タイトル・description 改善候補
- 順位 5〜20 位のクエリ → チャート追加で順位アップ可能性

2. **GA4 データ取得**:

```
/fetch-ga4-data last3m pages page=/themes/
```

- テーマページ別の PV / 平均滞在時間
- 滞在 < 30秒 → コンテンツ不足

### Phase 2: 競合調査

3. 主要競合サイトの同テーマページを調査:

**調査対象**:
- e-Stat ダッシュボード (dashboard.e-stat.go.jp)
- RESAS (resas.go.jp)
- Japan Dashboard (cao.go.jp)
- とどラン (todo-ran.com)
- 都道府県データランキング (uub.jp)

```
WebSearch: "{テーマキーワード} 都道府県 ランキング"
WebSearch: "{テーマキーワード} site:resas.go.jp"
WebFetch: 競合ページの指標・チャート構成を確認
```

**抽出項目**:
- 競合が提供しているチャートタイプと指標
- 競合にあって stats47 にない切り口
- 競合の情報構造（タブ分け・セクション構成）

### Phase 3: トレンド調査

4. Google Trends / ニュースからテーマ関連の需要を調査:

```
WebSearch: "{テーマキーワード} 統計 2025 2026"
WebSearch: "site:news.google.com {テーマキーワード} 都道府県"
```

- 直近で話題になっている指標（例: 物価高→消費者物価、人手不足→有効求人倍率）
- 季節性のある指標（例: 観光→宿泊者数は夏に需要増）
- 政策・制度変更に関連する指標（例: 最低賃金引き上げ）

### Phase 4: e-Stat データ可用性調査

5. 競合・トレンドから特定した不足指標について、e-Stat API で取得可能か確認:

```
/search-estat {指標名}
/inspect-estat-meta {statsDataId}
```

- statsDataId と cdCat01 が特定できるか
- 都道府県レベルのデータがあるか（area に 01000〜47000 が含まれるか）
- 時系列データがあるか（推移チャートに使えるか）

### Phase 5: 既存コンポーネント再利用調査

6. areas ページに既にあるが、テーマに未割り当てのチャートを検索:

完全DBレス: `page_components` の SSOT は git TS JSON（`apps/web/scripts/data/page-components/<type>/<pageKey>.json`。旧 D1/miniflare は廃止）。

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
      const e = byKey.get(c.componentKey) || { title: c.title, componentType: c.componentType, pages: new Set() };
      e.pages.add(type + '/' + pageKey);
      byKey.set(c.componentKey, e);
    }
  }
}
const onTheme = new Set([...byKey].filter(([, e]) => e.pages.has('theme/' + THEME_KEY)).map(([k]) => k));
// テーマ未割り当ての既存チャート（テーマ関連キーワードでさらに絞り込む）
for (const [key, e] of byKey) {
  if (onTheme.has(key)) continue;
  console.log(key, '|', e.title, '|', e.componentType, '|', [...e.pages].join(','));
}
"
```

### Phase 6: 統合分析・優先度付け

7. Phase 1〜5 の結果を統合し、各アクションをスコアリング:

| 指標 | 重み | 算出方法 |
|---|---|---|
| 検索需要 | 高 | GSC Impressions + トレンド需要 |
| 競合差分 | 高 | 競合にあって stats47 にない指標 |
| 改善余地 | 中 | 滞在時間短い × チャート数少ない |
| 実装コスト | 低→優先 | 既存再利用 < e-Stat 新規 < 未登録指標 |

### Phase 7: 改善アクション出力

8. 以下の形式でレポートを出力:

```markdown
## テーマ最適化レポート: {テーマ名}

### アクセス状況
- PV: XX / 滞在: XX秒 / GSC 表示: XX / CTR: XX%

### 競合との差分
| 指標 | e-Stat | RESAS | とどラン | stats47 |
|------|--------|-------|---------|---------|
| 県内総生産 | ✓ | ✓ | ✓ | ✓ (cmp-econ-gdp) |
| 労働生産性 | ✓ | ✓ | ✗ | ✗ → 追加候補 |

### トレンド需要
- 「最低賃金 2026」: Google Trends 急上昇中

### 推奨アクション（優先度順）

#### 1. 🔴 高優先: 既存コンポーネント再利用
| chart_key | title | 元ページ | 追加先 section |
|-----------|-------|---------|---------------|
| cmp-econ-gdp | 県内総生産額の推移 | area/economy | GDP・所得 |

#### 2. 🟡 中優先: e-Stat API から新規チャート
| 指標 | statsDataId | cdCat01 | チャートタイプ |
|------|-------------|---------|-------------|
| 労働生産性 | 0000010103 | C3404 | line-chart |

→ `/design-theme-charts {theme-key}` で設計

#### 3. 🟢 低優先: 未登録指標（要 data-ingester）
| 指標 | 理由 |
|------|------|
| 開業率 | RESAS にあるが e-Stat 基本テーブルにない |
```

## --all 指定時

全テーマを Phase 1〜2 で一括分析し、スコアリングサマリーと上位5テーマの詳細を出力。

## 注意

- GSC/GA4 データは2〜3日遅延があるため、最新日を含めないこと
- 競合調査は WebSearch を使い、対象テーマを絞ること（`--all` 時は上位5テーマまで）
- DB は readonly で開くこと
- このスキルは**分析と提案のみ**。実装は `/design-theme-charts` → `/insert-theme-components`

## 参照

- `/fetch-gsc-data` — GSC データ取得
- `/fetch-ga4-data` — GA4 データ取得
- `/audit-theme-components` — テーマ監査
- `/design-theme-charts` — チャート設計
- `/inspect-estat-meta` — e-Stat メタデータ調査
- `/search-estat` — e-Stat 統計表検索
- `.Codex/design-system/page-components.md` — 設計原則
