---
name: project_blog_remediation_loop
description: ブログ品質を計画的に順次是正する仕組み。次に直す記事の真実源は remediation-queue.json。週次 Must で消化
metadata: 
  node_type: memory
  type: project
  originSessionId: 3b4ff446-9fde-41ae-93aa-d891c10a0201
---

ブログ品質「是正ループ」(2026-06-06 構築)。公開252記事の「SVGはあるが薄い/callout定型」を週次で順次底上げする閉ループ。

**「次にどのブログを直すか」の真実源 = `.claude/state/blog/remediation-queue.json`** (状態付き・GSC流入×品質blockerの統合スコア・must-fixレーン最上位)。「ブログ品質を上げたい/記事を直したい」と言われたらまずこのキューを見る。

- 仕組みの正典: `docs/02_実装計画/blog-remediation-loop.md`
- 品質基準の正典: `.claude/rules/blog-quality-standards.md` (記事アーキタイプ A-E / 図あたりprose字数の床 350・550 / callout)
- builder: `node .claude/scripts/blog/build-remediation-queue.mjs` (build / `--next N` / `--mark-in-progress` / `--mark-done --wave-id`)
- 実行: `/brushup-blog --target queue --next N` (article-writer が archetype+図あたり字数で是正 → blog-critic PASS 必須 → publish)
- cadence: weekly-plan が毎週 top-N を「ブログ品質是正 N本」Must に転載、weekly-review が wave_id で効果判定

**状態機械の肝**: mark-done しても次の audit で blocker が残れば自動で再 pending (wave_id は履歴保持)。「直さず done」が構造的に不能。全自動にしない (auto-brushup は 13% FAIL、人手ゲート=critic PASS 必須 → [[project_blog_brushup_risk_2026_05_25]])。

初期状態: pending 121 (must-fix 101 / opportunity 20) / done 33。Phase 2 = measure-gsc-impact.mjs の wave_id 駆動化 (現状 BLOG-CTR-02 ハードコード)。

関連: 図あたり字数 gate は quality-gate.mjs + audit-published-blog.mjs に実装済 (良記事~600字/図 vs 薄い~280字/図)。[[feedback_improvement_log_as_source_of_truth]]
