---
type: implementation-plan
date: 2026-05-26
status: active
target: theme-dashboard (/themes/[themeKey])
phase: 1A (foundation) done — 1B/1C/2/3 pending
branch: claude/brave-galileo-PVSaL
tags: [theme-dashboard, d1, r2, refactor, handoff]
---

# テーマダッシュボードの D1 + R2 統一移行

`/themes/[themeKey]` の構成 (どの metric を どのチャートで見せるか) を、**TS ハードコード → D1 + R2 snapshot** に統一する。

旧: `packages/types/src/indicator-sets/*.ts` (17 テーマ × ~10 metrics の TS 定義)
新: D1 `themes` / `theme_metrics` テーブル → R2 `app/themes/[key]/config.json` → web app fetch

## なぜやるのか

現状は **「定義は D1 / 公開は R2」** という統一原則が 2 箇所で崩れていた:

1. **テーマ構成が TS ハードコード** (`indicator-sets/*.ts`) — metric 定義は D1 にあるのに、テーマグルーピングだけ TS
2. **prefecture の値が e-Stat 直叩き** — city は R2 snapshot 経由なのに非対称 (本 PR では未着手、Phase 2 で対応)

これを統一すると:
- ビルド時に e-Stat が落ちていても影響しない
- city / prefecture が同じ経路 (`readRankingValuesFromR2`) で読める
- テーマ追加・編集が「D1 INSERT + `/sync-snapshots`」で完結 (TS 修正 → ビルド → デプロイ不要)
- ランディングダッシュボード (`page_components`) と運用が揃う
- ライン/pie 用データも snapshot 化すれば、テーマページ全体が R2 fetch だけで描画可能 (CF Pages のエッジと相性良)

## フェーズ分割

| Phase | 内容 | 状態 |
|---|---|---|
| **1A** | D1 schema (themes / theme_metrics) + migration + seed + R2 exporter | ✅ 完了 |
| **3a** | コロプレス選択 metric の **line + 上下位 bar** を表示する `MetricFocusCharts` 追加 | **✅ 本セッションで実装** |
| **planning** | 全 17 テーマのチャート設計 docs (line/pie/bar の指標選定) | ✅ 完了 (`docs/02_実装計画/theme-charts-planning/`) |
| 1C | `load-theme-data.ts` を「TS 直参照」から「R2 snapshot fetch」に書き換え | ⏳ |
| 2 | prefecture values の R2 snapshot 化 (e-Stat 直叩き廃止) | ⏳ |
| 3b | pie / breakdown 用 R2 exporter + cdCat-aware フェッチ (Phase 3a の続き) | ⏳ |
| 3c | `theme_metrics.chart_type='line'/'pie'` 行を seed (現在は全行 'choropleth') | ⏳ |
| 4 | TS `indicator-sets/*.ts` 削除 (D1 が完全に source of truth になってから) | ⏳ 最後 |

---

## Phase 1A で追加・変更したもの

| ファイル | 変更内容 |
|---|---|
| `packages/database/src/schema/themes.ts` | 新規。`themes` + `theme_metrics` スキーマ定義 (Drizzle) |
| `packages/database/src/schema/index.ts` | `themes` の export 追加 |
| `packages/database/drizzle/0052_themes_and_theme_metrics.sql` | 新規。テーブル + index 作成 SQL |
| `packages/database/scripts/seed-themes.ts` | 新規。`THEME_INDICATOR_SETS` + `COMPARE_INDICATOR_SETS` を D1 に投入 (冪等) |
| `packages/database/package.json` | `seed:themes` script 追加 |
| `apps/web/scripts/export-themes-snapshot.ts` | 新規。D1 → R2 `app/themes/[key]/config.json` exporter |
| `.claude/skills/db/sync-snapshots/run.sh` | `themes` タスクを TASKS 配列に追加 |

## Phase 3a (個別チャート表示) で追加・変更したもの

ユーザー要求: 「コロプレス地図で選択中の指標について、line/pie などの個別都道府県チャートを表示」を実装。

| ファイル | 変更内容 |
|---|---|
| `apps/web/src/features/theme-dashboard/actions/fetch-metric-timeseries.ts` | 新規 Server Action。`metricKey + areaCode` から全年度の `{ year, value }[]` を返す。e-Stat 全件取得 + メモリ集約 (areaCode='00000' は e-Stat 全国行 or 47 県平均) |
| `apps/web/src/features/theme-dashboard/actions/index.ts` | 上記 action を export |
| `apps/web/src/features/theme-dashboard/components/MetricFocusCharts.tsx` | 新規 Client Component。**選択中の metric + 選択都道府県** に対して (A) 時系列 line、(B) 上下位 5 県 bar を描画。pie/breakdown は Phase 3b で追加予定 |
| `apps/web/src/features/theme-dashboard/components/ThemeDashboardTabbed.tsx` | `MetricFocusCharts` をマップ直下 (desktop) / stats タブ内 (mobile) に挿入。タブ切替・都道府県クリックで自動再描画 |

### 動作

1. ユーザーがテーマページの **タブで metric を選択** → `selectedTabKey` が変わる
2. `MetricFocusCharts` が `selectedTabKey + selectedPrefectureCode` の変化を `useEffect` で検知
3. `fetchMetricTimeseriesAction` を呼び出し全年度データ取得
4. `LineChartClient` で時系列ラインを描画 + 上下位 5 県の bar を `currentValues` から派生
5. **地図で都道府県クリック** → `selectedPrefectureCode` 変化 → 同じく自動再フェッチ → 「全国」から「東京の推移」に切り替わる

### 既知の制限 (Phase 3b/3c で対応)

- **計算型 metric** (`calculation.isCalculated`) はラインチャート空。`fetchRankingValuesFromSource` ベースの timeseries fetch が必要
- **pie/breakdown** は未実装 (cdCat-aware な e-Stat フェッチが必要)
- **データソースは e-Stat 直叩き**: prefecture values が R2 snapshot 化されるまで (Phase 2)、ビルド時に e-Stat が落ちると line chart も空になる
- `theme_metrics.chart_type` は全行 'choropleth' のまま (Phase 3c で line/pie 行を追加)

## スキーマ概要

```sql
-- themes: テーマ自体のメタ
themes (
  theme_key TEXT PRIMARY KEY,         -- 'living-housing' (= URL の [themeKey])
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,                      -- 'lifestyle' 'demographics' 等
  usage TEXT DEFAULT 'theme',         -- 'theme' | 'compare' | 'both'
  keywords_json TEXT DEFAULT '[]',
  related_article_tag_keys_json TEXT DEFAULT '[]',
  display_order INTEGER,
  is_active INTEGER DEFAULT 1
)

-- theme_metrics: テーマ × metric × チャート種別 (3 列複合 PK)
theme_metrics (
  theme_key TEXT,
  metric_key TEXT,                    -- metrics.key への FK
  panel_label TEXT,                   -- '住宅' '世帯' (タブ名) — NULL で直下
  panel_order INTEGER,                -- 同タブ内の表示順
  role TEXT,                          -- 'primary' | 'secondary' | 'context'
  short_label TEXT,                   -- 凡例・タブ用ラベル
  chart_type TEXT DEFAULT 'choropleth', -- 'choropleth' | 'line' | 'pie' | 'bar' | 'ranking-table'
  chart_target TEXT,                  -- 'national' | 'prefecture' | NULL
  chart_config_json TEXT,             -- pie の breakdown cdCat 等
  PRIMARY KEY (theme_key, metric_key, chart_type)
)
```

**ポイント**: 同じ metric を同一テーマで「choropleth + line」のように複数チャートで使えるよう、`chart_type` を PK に含めた。Phase 3 で line / pie 行を足すときに既存 choropleth 行を壊さない。

## R2 出力形式

`app/themes/[themeKey]/config.json`:

```json
{
  "themeKey": "living-housing",
  "title": "暮らし・住まい",
  "description": "...",
  "category": "lifestyle",
  "usage": "theme",
  "keywords": ["空き家", "持ち家", ...],
  "relatedArticleTagKeys": [],
  "displayOrder": 2,
  "panels": [
    {
      "label": "住宅",
      "metrics": [
        { "metricKey": "vacant-housing-ratio", "shortLabel": "空き家率",
          "role": "primary", "chartType": "choropleth",
          "chartTarget": null, "chartConfig": null, "panelOrder": 0 }
      ]
    },
    { "label": "世帯", "metrics": [...] }
  ]
}
```

URL `/themes/[themeKey]` に対応するので `.claude/rules/r2-storage-design.md` のキーパス規約に沿う。

---

## 🛠️ ローカル Mac で実行すべきこと (ハンドオフ)

このセッション (Claude Code on the web) では `.local/d1/` を触れないので、以下はローカルで実行する必要がある。

### 0. ブランチ取得

```bash
cd ~/Documents/cw/stats47   # ローカルのプロジェクト
git fetch origin claude/brave-galileo-PVSaL
git switch claude/brave-galileo-PVSaL
git pull
```

### 1. Migration を D1 に適用

```bash
# wrangler 経由で 0052_themes_and_theme_metrics.sql を local D1 に流す
cd apps/web
npx wrangler d1 migrations apply STATS47_STATIC_DB --local
```

確認:

```bash
# テーブルが作られたか
node -e "
const db = require('better-sqlite3')('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');
console.log(db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('themes', 'theme_metrics')\").all());
"
```

期待: `[{name: 'themes'}, {name: 'theme_metrics'}]`

### 2. TS → D1 seed (17 + 6 = 23 テーマ投入)

```bash
# dry-run でまず確認
npm run seed:themes --workspace=packages/database -- --dry-run

# 本実行
npm run seed:themes --workspace=packages/database
```

期待出力:

```
📂 D1: .../baffe56c6b....sqlite
📦 投入対象: 23 テーマ (theme=17 compare=6)
✅ seed 完了: themes upsert=23, theme_metrics upsert=~230
```

確認:

```sql
SELECT COUNT(*) FROM themes;          -- 23
SELECT COUNT(*) FROM theme_metrics;   -- 200+ (テーマあたり平均 10)
SELECT theme_key, panel_label, COUNT(*) FROM theme_metrics
  WHERE theme_key='living-housing' GROUP BY panel_label;
-- → '住宅' 3, '世帯' 4, '人口・婚姻' 6 等
```

### 3. R2 snapshot に push

```bash
# themes のみ先に export して確認
bash .claude/skills/db/sync-snapshots/run.sh --only themes --dry-run
bash .claude/skills/db/sync-snapshots/run.sh --only themes
```

確認: `.local/r2/app/themes/living-housing/config.json` が生成されている

```bash
ls .local/r2/app/themes/
cat .local/r2/app/themes/living-housing/config.json | jq .panels
```

### 4. (Phase 1A はここまで) — Phase 1C 着手前の確認

この時点では **web app はまだ TS 経由で動作している** (loader は変えていない)。
従って `npm run dev` でテーマページを開いても今まで通り表示されるはず。

破壊的変更は無いので、安心して develop に merge して OK。

---

## ロールバック

- **schema 巻き戻し**: `DROP TABLE theme_metrics; DROP TABLE themes;` を別 migration で
- **R2 巻き戻し**: `app/themes/` 配下を r2 delete (web app は読んでいないので影響なし)
- **TS は触っていない** ので、もし問題があっても web app の挙動は変わらない (これが Phase 1A を最初に分けた理由)

## 次のフェーズ

### Phase 1C: loader 書き換え (次セッション)

- `apps/web/src/features/theme-dashboard/lib/load-theme-data.ts` を改修
- `ThemeConfig` の生成元を TS (`indicator-sets/*.ts`) から R2 (`app/themes/[key]/config.json`) に
- `apps/web/src/app/themes/[themeSlug]/page.tsx` の `generateStaticParams` も R2 から (D1 themes を export した何らかの index を経由)
- TS 経由のフォールバックは残さず、一気に置換 (CLAUDE.md branch-workflow より「feature flag 不要」方針)

### Phase 2: prefecture values の R2 snapshot 化

- `packages/ranking/src/exporters/ranking-values-snapshot.ts` を prefecture 対応 (今は city のみ)
- `load-theme-data.ts` の `fetchIndicatorValues` (e-Stat 直叩き経路) を削除
- ビルド時の e-Stat 依存をゼロに

### Phase 3: line / pie 用データと exporter

- ライン用: 全国時系列 (年度 × 値) または 47都道府県時系列を `app/themes/[key]/timeseries.json` に
- pie 用: 内訳 (e-Stat cdCat 単位の分解) を `app/themes/[key]/breakdown.json` に
- `theme_metrics.chart_type='line'/'pie'` の行を seed (テーマごとの指標選定はここで詰める)

### Phase 4: TS `indicator-sets/*.ts` 削除

- D1 が source of truth として安定稼働 (~2 週間) を確認してから
- 型 `IndicatorSet` 自体は `packages/types` に残し、データのみ削除
- `THEME_INDICATOR_SETS` / `COMPARE_INDICATOR_SETS` のエクスポートも削除

---

## 関連

- 元方針議論: 本ファイル作成セッション (2026-05-26)
- D1 vs R2 振り分け原則: `.claude/rules/data-storage.md`
- R2 キーパス規約: `.claude/rules/r2-storage-design.md`
- branch / deploy フロー: `.claude/rules/branch-workflow.md`
- ローカル D1 固定パス: CLAUDE.md「致命的オペレーション規約」
