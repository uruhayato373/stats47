---
name: project_blog_auto_publish_reconcile_limits
description: blog-auto-publish.yml の MAX_PUBLISH=10 上限と reconcile が既 live 記事を再 push しない仕様。複数記事公開・改稿反映時の手順
metadata: 
  node_type: memory
  type: project
  originSessionId: 6d9cb673-7acd-45e0-ae4f-01829bc3c580
---

`blog-auto-publish.yml`（develop への docs/21 article.md push で発火、完全DBレス公開ブリッジ）の非自明な2制約。2026-06-15 に docs/21 残り14記事一括公開で実証。

- **MAX_PUBLISH=10**: 1 回の run で公開するのは最大10件（爆発半径限定）。14件を1コミットで push すると detect が14件検出→先頭10件のみ公開、残り4件は繰り越される。残りは別 run で公開する。
- **reconcile（空 slugs dispatch / 変更検出0）は「live all.json に未掲載の published:true」だけを backfill する**。つまり **既に live にある記事の改稿版は reconcile では再 push されない**（`!live.has(slug)` 条件のため）。docs/21 ドラフトは公開後も残り live とドリフトしうる（「published 表記が false/なし だが all.json には居る」状態が多発）。
- **既 live 記事の改稿を反映するには明示 slug 指定**: `gh workflow run blog-auto-publish.yml --ref develop -f slugs="a b c"`。INPUT_SLUGS 経路は live チェックを通さず diff-push-r2 で article.md + data/*.svg を上書き push する。MAX_PUBLISH 内なら全件公開。
- **公開ゲート**: 各 slug に ci-factual-gate.mjs + quality-gate.mjs を再実行し、落ちた slug はスキップ（R2 に到達しない）。**quality-gate は review.md verdict:PASS を要求**（REVISE のままだと「critic レビュー未通過」blocker）。**quality-gate は参照 SVG ファイルの存在を検査しない**ため、`![](data/x.svg)` が未生成でも gate を通り画像が壊れたまま公開されうる（公開前に手動で SVG 存在を確認すること）。
- **チャート生成器の認識サフィックスは固定**: `generate-article-charts.mjs` は `*-prefecture-rankings.json`(bar) / `*-timeseries.json`(line) / `*-scatter.json`(scatter) / `*-tile-grid.json` のみ認識。旧ドラフトの `*-rankings.json` 等は type=unknown でスキップ→SVG 未生成。bar は `pref` フィールド必須（`areaName` のみだと県名が出ない）。全て node builtin で動くので **node_modules 無しの worktree でも生成可**。R2 観測値は公開 URL `https://storage.stats47.jp/app/stats/<key>/values.json`（rows[].yearCode は最新年抽出）から取得して散布図データを作れる。
- 作業隔離: dirty な別ブランチ作業中は `git worktree add /tmp/x -b <new> origin/develop` で隔離し、`git push origin HEAD:develop` で ff 公開すると本体 working copy を汚さない。quality-gate / chart 生成は builtin なので worktree で完結する。

## 2026-06-15 アーキ変更: R2ファースト「生成→公開→反復」(企画文書レス)

- **docs/21 は ephemeral outbox 化済**: blog-auto-publish.yml / publish-blog.yml が R2 公開成功後に公開済みドラフトを自動 `git rm` + `[skip ci]` commit-back (permissions:contents:write / pull --rebase で race 吸収)。→ docs/21 は常に空 (未公開のみ)。上記「公開後ドラフトが残る」前提は解消 (手動 git rm 不要に)。
- **docs/20_ブログ記事企画 (企画サブシステム) は全廃**: plan-blog-{articles,trends,from-gsc,affiliate} / update-blog-plan スキル・command、blog-planner agent、fetch-article-data.mjs(D1依存) / generate-gsc-driven-plan.mjs / generate-brushup-queue.cjs スクリプトを削除。
- **新フロー**: metric 選定 → `fetch-ranking-data-r2.mjs --slug <s> --keys <metricKey>` (R2 app/stats 直、--base 既定 docs/21) → article.md(docs/21) → generate-article-charts → factual+quality+critic → published:true で develop push → 自動公開+outbox自動削除 → ライブで /brushup-blog 反復。**新規記事は /draft-from-trend に一本化** (R2直に全面書換)。brushup キューは remediation-queue.json (brushup-queue.md 廃止)。
- なぜ完全R2のみ不可: R2書込は CI 専用 (_assert-ci-write)、クラウドは R2 認証なし+dispatch 403 → **git push が R2 への唯一の輸送路**。docs/21 を完全廃止するとクラウド投入経路が消えるため outbox として薄く残す。
- 正典: `.claude/rules/blog-data-schema.md` §0 記事ライフサイクル。

関連: [[project_blog_publish_cloud_first]] [[project_blog_brushup_dbless_scaffold]] [[feedback_shared_working_copy_git_race]]
