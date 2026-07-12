---
name: project_gsc_coverage_remediation_loop
description: GSC カバレッジ是正ループの仕組みと「404=8378の大半は意図的＝是正対象外」という非自明な前提
metadata: 
  node_type: memory
  type: project
  originSessionId: d2a38335-b56d-47a7-bbcc-1ff5b5c95ffb
---

GSC「ページ」インデックスカバレッジ (404/soft404/5xx/crawled-not-indexed) を週次で順次是正する閉ループを 2026-06-16 構築。正典 `.claude/skills/analytics/gsc-coverage-remediation/SKILL.md` (2026-07-12 に旧 doc 12 を統合)、実行 `/gsc-coverage-remediation` skill、関連 [[project_ranking_publish_pipeline_gap]]。

**最重要の前提 (取り違え注意)**: GSC の未登録 ~17,900件 / 404=8,378 / redirect=1,277 / robots=2,651 / noindex=1,434 の**大半は意図的削除・旧URL・設計上のブロックで是正対象ではない**。GSC は 410 も「404」に束ね、Google の再クロールは週〜月単位。**0 件にはできないし目標でもない**。実際に直すべきは「サイトが参照しているのに 404/soft404/5xx = 生きてるのに誤登録された URL」だけ。2026-06-16 本番実測では actionable は **190件のみ** (resubmit 85=404/5xx→現在200 / content-check 97=soft404→現在200 / fix-5xx 1 / verify-intent 7=`/tmp/*.json`等の旧内部パスで404維持が正)。

**パイプライン** (どこからでも再現可):
1. ユーザー GSC UI export → ~/Downloads に cp932 zip
2. `python3 .claude/scripts/gsc/ingest-gsc-export.py` → `coverage-drilldown/<週>/<cat>-drilldown.csv` + `category-totals.json` + `coverage-trend.csv` (cp932 ファイル名は NFC 正規化 + zip内容で分類)
3. `node .claude/scripts/gsc/build-coverage-queue.mjs` → 本番 HTTP を Googlebot UA で実測し A/B 分類 → SSOT `.claude/state/gsc/coverage-remediation-queue.json` (状態 upsert 保持) + `LATEST.md` + `coverage-totals-history.csv` (経過観測) + curated `coverage-live-resubmit-urls.csv`
4. CLI: `--next N` / `--mark-done <url> --wave-id` / `--no-probe` (キャッシュ再利用)

**命名規約 (重要)**: `auto-resubmit.mjs` は `coverage-drilldown/**/*-urls.csv` を全て Indexing API 送信対象にする。死んだ404を送ると quota(200/日)浪費 → 生 drilldown は `-drilldown.csv` (拾われない)、build が live だけ curated `coverage-live-resubmit-urls.csv` に出す。content-check(soft404) は薄いまま再送信すると再フラグされるので resubmit 格上げまで送らない。

**判定**: effect は次週 export 後の件数差 + resubmit URL の coverageState 遷移を実測してから ([[feedback_evidence_based_judgment]] 準拠)。記録は improvement-log `[COVERAGE-LOOP-01]` + 改善バックログ `COVERAGE-LOOP-01`。同型は [[project_blog_remediation_loop]]。
