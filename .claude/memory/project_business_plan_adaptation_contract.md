---
name: project_business_plan_adaptation_contract
description: 外部事業計画は既存SSOTへの採用差分として型付けし、管理画面・CI・計測stateを同じcatalogへ接続する
type: project
---

**問題**: `stats47_2_business_plan_2026.docx` は35ページの事業案を持つ一方、常設D1/PostGIS、初期SaaS、AIチャット、市区町村ページ量産など、stats47のDBレス正典・需要ファースト運用と衝突する案も含んでいた。文章をそのまま正典化すると、設計と実装、owner、計測が分離する。

**原因**: 外部原案は戦略仮説であり、現行コード・データアーキテクチャ・運用ゲートを前提にしていない。採用可否と適合理由を構造化しない限り、後続agentが原案の章を現行仕様と誤認する。

**対策**: `packages/data-configs/src/business-plan/` に25章の `adopted/adapted/deferred/rejected`、100企画、owner/skill、KPI、開始ゲートを型付きSSOTとして置く。`npm run business-plan:check` で参照とDBレス逆行を拒否し、derived stateを週次生成する。管理画面 `/strategy`、strategy-advisor、weekly-plan/review、PR/週次CIは同じcatalogを読む。売上・アクセス目標は仮説、未計測は0でないと表示する。

**証拠**: commit `4674d21cbe842d79b1f21fb0a8216194813dfa15` / `.claude/state/business-plan/history/2026-08-28.json` / 2026-08-28
