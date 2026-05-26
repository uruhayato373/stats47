---
type: handoff-next-session
date: 2026-05-26
status: active
branch: claude/brave-galileo-PVSaL
related:
  - theme-dashboard-d1-migration.md
  - theme-charts-planning/README.md
tags: [handoff, theme-dashboard, next-session]
---

# テーマダッシュボード改修 — 次セッションへのハンドオフ

> ブランチ `claude/brave-galileo-PVSaL` を pull した後、次に何をやるかが分かるための短いドキュメント。
> 詳細設計は `theme-dashboard-d1-migration.md` / `theme-charts-planning/` を参照。

## 30 秒サマリ

テーマページを **「複数指標の組み合わせ分析 + 1 県深掘り」** に再設計。/ranking/{key} および /areas/{pref}/{categoryKey} との役割重複を解消し、テーマページ独自価値を radar + scatter + 県サマリ KPI に集約。

本セッションで:

1. ✅ **Phase 1A**: D1 schema (themes/theme_metrics) + migration + seed + R2 exporter
2. ✅ **Planning**: 全 17 テーマのチャート設計 docs
3. ✅ **Phase 3a**: 選択 metric の line + 上下位 bar (`MetricFocusCharts`) — **県選択時のみ可視、未選択時は折りたたみ**
4. ✅ **Phase 3a' (組み合わせ分析)**: `ThemeCombinationAnalysis` (radar + scatter) を右カラム主役に
5. ✅ **Phase 3a'' (areas 統合)**: `ThemePrefectureSummary` (県選択時の主要 KPI + 順位 + 平均比) を最上部に。`/areas/{pref}/administrativefinancial` → 301 → `/themes/local-finance?pref={pref}` リダイレクト追加

**pie / breakdown は Phase 3b で次回**。

## 🛠️ pull 後にまずやること (順番厳守、15 分)

### Step 1. ブランチ取得

```bash
cd ~/Documents/cw/stats47  # ローカルのプロジェクトパスに調整
git fetch origin claude/brave-galileo-PVSaL
git switch claude/brave-galileo-PVSaL
git pull
```

### Step 2. Phase 1A の DB 反映 (順番厳守)

```bash
# 2-1. migration を local D1 に流す
cd apps/web
npx wrangler d1 migrations apply STATS47_STATIC_DB --local

# 確認: themes / theme_metrics テーブルができたか
node -e "
const db = require('better-sqlite3')('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');
console.log(db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('themes', 'theme_metrics')\").all());
"
# → [{ name: 'themes' }, { name: 'theme_metrics' }] が出れば OK

# 2-2. TS → D1 seed (dry-run → 本実行)
cd ../..
npm run seed:themes --workspace=packages/database -- --dry-run
npm run seed:themes --workspace=packages/database
# 期待: themes upsert=23, theme_metrics upsert=200+

# 2-3. R2 snapshot に push (themes のみ先に)
bash .claude/skills/db/sync-snapshots/run.sh --only themes
# 確認:
ls .local/r2/app/themes/
cat .local/r2/app/themes/living-housing/config.json | jq .panels
```

### Step 3. Phase 3a + 3a' の動作確認 (npm run dev)

```bash
cd apps/web
npm run dev
# → http://localhost:3000/themes/living-housing
```

確認項目 (**右カラムが組み合わせ分析に変わったか**が今回の主役):

- [ ] ページ全体が落ちずに描画される (既存機能の regression なし)
- [ ] **右カラム上部**に「テーマ全体プロフィール (radar)」カードが出る
  - 県未選択時はプレースホルダ「地図で都道府県を選択するとここにレーダーが出ます」
  - 地図で県クリック → レーダーチャートが描画される (8 軸まで)
- [ ] **右カラム中部**に「指標どうしの相関 (scatter)」カードが出て、47 県プロットが見える
  - 県クリック → 選択県が赤くハイライト
- [ ] **右カラム下部**: 既存の KPI カード (`PrefectureStatsPanel`) は残ったまま
- [ ] **左カラム** map 下: 「選択指標の単独詳細を表示」が **`<details>` 折りたたみ** になっている (Phase 3a で作った line + bar はここに格下げ)
- [ ] **モバイル**: 「統計」タブ先頭が組み合わせ分析、次に KPI、最後に折りたたみで単独詳細
- [ ] population-dynamics の `PopulationScatterSection` (独自 scatter) は従来通り表示される

問題があったら → 次セッションで「**この挙動がおかしい**」と伝えてもらえれば直す。

## 既知の制限・要検証 (動作確認時に気にする点)

1. **計算型 metric** (`calculation.isCalculated=true`) の line chart が空になる
   - 例: 比率系の一部 (空き家率は per_household 計算の場合)
   - `fetch-metric-timeseries.ts` の冒頭で `return []` している
   - これが意外と多ければ Phase 3b で対応必要

2. **e-Stat に依存** している
   - prefecture values を R2 snapshot 化していないため、line chart は build time の e-Stat 取得経路を経由
   - 既存の `fetchEstatData` キャッシュに乗るので大抵速い

3. **`fetchMetricTimeseriesAction` の `00000` フォールバック**
   - e-Stat に「全国」行があれば採用、無ければ 47 県の単純平均
   - 「per 100k」「率」系の指標で平均が意味的に正しいかは要レビュー

## 残フェーズ (次セッションに着手)

優先度順:

### Phase 3b (高): pie / 構成比 breakdown 実装

組み合わせ分析の **3 つ目の柱** として ThemeCombinationAnalysis に組み込む。

- 17 テーマの planning doc (`theme-charts-planning/{key}.md` の #4 章) に必要 breakdown データを記載済
- 例:
  - local-finance: 歳入の地方税/交付税/国庫支出金/その他 (構成比 pie or stacked bar)
  - living-housing: 空き家種類別 (賃貸用/二次的/売却用/その他)
  - aging-society: 年齢 3 区分 (年少/生産年齢/老年)
- 実装ステップ:
  1. metric ごとに e-Stat cdCat 構造を `/inspect-estat-meta` で確認
  2. `actions/fetch-metric-breakdown.ts` Server Action 作成 (cdCat 指定で内訳取得)
  3. `ThemeCompositionPie.tsx` 新規 (既存 `DonutChart` 流用) — 県切替対応
  4. `ThemeCombinationAnalysis.tsx` に組み込み (radar / scatter の下に並べる)
  5. テーマ別に「どの metric の breakdown を見せるか」を D1 `theme_metrics.chart_config_json` に記録 (Phase 3c)

### Phase 3b' (高): 計算型 metric の timeseries 対応

`fetchRankingValuesFromSource` を年度ループする実装を `fetch-metric-timeseries.ts` に追加。

### Phase 1C (中): `load-theme-data.ts` を R2 fetch 化

現状 TS 直参照 → `app/themes/{key}/config.json` fetch に書き換え。Phase 1A の R2 snapshot が動作確認できた後に。

### Phase 2 (中): prefecture values の R2 snapshot 化

- `packages/ranking/src/exporters/ranking-values-snapshot.ts` を prefecture 対応 (現状 city のみ)
- `load-theme-data.ts` の e-Stat 直叩き経路を削除
- `fetch-metric-timeseries.ts` も R2 fetch ベースに切替

### Phase 3c (低): `theme_metrics.chart_type='line'/'pie'` 行を seed

planning docs から自動生成する seed script を追加。Phase 3a/3b の表示は `chart_type` を見ていないので、これは「メタ管理として正規化する」フェーズ。

### Phase 4 (最後): TS `indicator-sets/*.ts` 削除

D1 が 2 週間程度安定稼働してから。

## 重要ファイル位置 (次セッション開幕時に Read 推奨)

| 目的 | ファイル |
|---|---|
| マスタープラン | `docs/02_実装計画/theme-dashboard-d1-migration.md` |
| **このハンドオフ** | `docs/02_実装計画/theme-dashboard-NEXT-SESSION.md` |
| 17 テーマ Planning INDEX | `docs/02_実装計画/theme-charts-planning/README.md` |
| Phase 3a 実装 (Server Action) | `apps/web/src/features/theme-dashboard/actions/fetch-metric-timeseries.ts` |
| Phase 3a 実装 (UI) | `apps/web/src/features/theme-dashboard/components/MetricFocusCharts.tsx` |
| Phase 3a 統合先 | `apps/web/src/features/theme-dashboard/components/ThemeDashboardTabbed.tsx` |
| D1 schema | `packages/database/src/schema/themes.ts` |
| Migration SQL | `packages/database/drizzle/0052_themes_and_theme_metrics.sql` |
| Seed (TS → D1) | `packages/database/scripts/seed-themes.ts` |
| R2 exporter | `apps/web/scripts/export-themes-snapshot.ts` |

## コミット履歴 (このブランチで本セッションが追加したもの)

```
c0dba8d feat(theme-dashboard): 選択 metric の line + 上下位 bar チャートを追加 (Phase 3a)
9a1eaf8 docs(theme-charts): 全 17 テーマのチャート設計案 drafted 完了
85dcc0d (16 並列 agent からの自動 commit があれば、ここに 17 個のテーマファイル群)
c16a2df feat(themes): D1 化フェーズ 1A — themes/theme_metrics スキーマ + seed + R2 exporter
```

(`git log claude/brave-galileo-PVSaL --not main --oneline` で確認可)

## 次セッションを開く時のおすすめ最初のプロンプト

```
docs/02_実装計画/theme-dashboard-NEXT-SESSION.md を読んで、
Phase 3a の動作確認は完了済 / 未完を共有する。
次は Phase {3b / 3b' / 1C / 2} に進めて。
```

(動作確認結果を最初に共有してもらえれば、次フェーズに合わせた実装に集中できる)

## 関連

- 親計画: `docs/02_実装計画/theme-dashboard-d1-migration.md`
- 17 テーマ Planning: `docs/02_実装計画/theme-charts-planning/`
- ブランチ運用規約: `.claude/rules/branch-workflow.md`
- D1 / R2 振り分け原則: `.claude/rules/data-storage.md`
