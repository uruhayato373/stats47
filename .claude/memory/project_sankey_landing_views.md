---
name: project_sankey_landing_views
description: "Sankey 着地ビュー横展開の状態 — migration(#393)/finance(#396)が本番稼働、共通 HubSankey。通勤は Phase 2 (e-Stat statsDataId 0003454526)"
metadata: 
  node_type: memory
  type: project
  originSessionId: db2bdcc8-c659-4e43-bb54-7208a79f5edc
---

都道府県統計の Sankey 着地ビューをテーマページに横展開中 (2026-06-01)。

**本番稼働済み (Sankey 3点セット):**
- 人口移動フロー Sankey → `/themes/population-dynamics` (PR #393)。データ `apps/web/public/migration-flow/{NN}.json`
- 財政フロー Sankey → `/themes/local-finance` (PR #396)。財源→一般会計→目的別歳出。データ `apps/web/public/finance-flow/{NN}.json` を `apps/web/scripts/generate-finance-flow.ts` が R2 観測値から生成 (新規 e-Stat 取り込み不要)
- 通勤フロー Sankey → `/themes/population-dynamics` (移動の隣、PR #398 基盤 + #399)。昼夜間人口。データ `apps/web/public/commute-flow/{NN}.json`。CI 取り込み `commute-flow-ingest.yml` + `packages/data-configs/scripts/ingest-commute-flow.ts` (e-Stat 0003454526, CLASS_INF を名称から自動検出 → @area=常住地/@cat03=従業地/@cat02==11=通勤者/@cat01==0=総数, limit=100000)。workflow_dispatch は main 必須 → `--ref <branch>` でブランチのスクリプト実行可・反復に便利。artifact で JSON 持ち帰り別 PR でコミット

**共通実装パターン (再利用):**
- 汎用 hub Sankey: `apps/web/src/components/charts/HubSankey.tsx` (props: title/centerLabel/leftNodes/rightNodes/leftColor/rightColor/formatValue/labelGutter)
- per-pref 派生 JSON を `apps/web/public/<feature>-flow/{NN}.json` にコミット
- `ThemeXxxFlowSection` (client、共有 Select + `?pref=NN` deep-link は `window.location`+useEffect で SSG 保全) を `THEME_SECTION_REGISTRY` に登録 + theme config に `embeddedSections` 付与
- ESLint 注意: effect 内の同期 setState は `react-hooks/set-state-in-effect`、render scope 内の let 再代入は `react-hooks/immutability` で fail → モデル計算はモジュール関数へ、fetch reset は `.then` 内へ

**通勤の e-Stat 取り込み知見 (再ingest 時用):** statsDataId `0003454526` (国勢調査2020 従業地集計)。
APP_ID は CI 専任 (ローカル無し) → 取り込みは `commute-flow-ingest.yml` を `gh workflow run --ref <branch> -f dry_run=true/false`。
dry_run で CLASS_INF 検出ログを確認 → 本実行で artifact 出力。e-Stat limit 上限=100000 (超過すると「レコード行数の値が正しくありません」)。
旧 D1 取り込み `ingest-migration-flow.ts` は Phase 7 削除済 (移動データも今や静的コミット JSON)。

関連: [[feedback_shared_working_copy_git_race]] (worktree でコミットして race 回避)
