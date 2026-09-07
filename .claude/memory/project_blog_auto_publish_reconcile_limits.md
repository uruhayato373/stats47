---
name: project_blog_auto_publish_reconcile_limits
description: blog-auto-publish の背景未生成skip境界とoutbox staging順序。旧MAX_PUBLISHやreconcile制約は歴史情報
metadata: 
  node_type: memory
  type: project
  originSessionId: 6d9cb673-7acd-45e0-ae4f-01829bc3c580
---

## 現行契約（2026-09-07）

- **問題**: 背景未生成1件で後続の公開可能記事も止まる。
- **原因**: factual/qualityはper-slug skipだが、thumbnail生成は無条件に`set -e`でrun全体を終了する。
- **対策**: `generate-blog-thumbnails.ts`の背景未生成専用exit 20のみskipし、通信・SHA不一致・生成失敗は停止する。
  画像生成は`BLOG_DIR=docs/21_ブログ記事原稿`を入力に**本文staging前**に行う。先に本文を置くと末尾の
  `diff-push-r2 --prefix app/blog`がskipした本文まで公開するため、この順序が安全境界。
- **証拠**: `.claude/scripts/lib/__tests__/workflow-commit-back.test.cjs`は実workflow shellに
  背景不足→公開可能のfixtureを渡し、後続公開・skip理由・保留本文のstaging非存在・未知エラー時停止を検証する。
  [実run 34113401278](https://github.com/uruhayato373/stats47/actions/runs/34113401278)も成功。
  airport-count-vs-general-project-investment-agricultureを背景不足で保留し、後続4記事を公開・索引更新・outbox整理した。
  公開監査はrankings 2157 / blogs 534 / assets 1426でfindings 0、本文4件のR2一致を確認。
  一方、run 34113017143はnatto-consumption-expenditureの古いpromptで停止しており、未知・不正背景の停止契約も維持している。
- 現行reconcileは未公開と改稿差分の両方を拾う。件数上限は2026-08-31に撤廃済み。
  以下のMAX_PUBLISH=10 / 既live除外は**2026-06当時の経緯であり、現行仕様ではない**。
- **outboxの残数だけで未公開と判定しない**（2026-09-08）: 今回対象外の既公開19記事は本文等250ファイルが
  R2とSHA一致する一方、`article.prompt.txt` 19ファイルはローカルにしか無かった。
  prunerはこの未退避ファイルを検出して保持する。公開差分0と削除可能は別判定であり、
  残ったコピーを未公開と数えたり、クリーン化のために一括削除したりしない。

## 2026-09-08 画像不変の再公開がfresh CIで停止する問題

- **問題**: source lineageだけを変更した発電2記事の再公開は `34150800541` の2試行とも画像planのENOENTで停止した。
- **原因**: 画像の変更0件ではrenderを通らず、fresh checkoutの `.local` が存在しないまま空planを `writeFileSync` していた。既存 `.local` があるローカルでは再現しない。読み取りや一過性のR2障害ではない。
- **対策**: 空planを書き込む直前に親ディレクトリを作成する。ネットワーク・画像生成なしの実CLIをfresh fixtureで実行する3回帰テスト（親不在、旧plan置換と無関係ファイル保持、audit時の新規出力なし）を `test:image-pipeline` に組み込む。背景をforce再生成したり、exact plan検証を省略したりしない。

## 2026-09-08 背景待ち73記事の公開完了

- 対象は未公開72記事と改稿1記事。[公開run 34139507934](https://github.com/uruhayato373/stats47/actions/runs/34139507934)
  と[PR #945](https://github.com/uruhayato373/stats47/pull/945)のデプロイ後、全73URLをGooglebotで実測し、
  HTTP 200・H1・self canonical・indexable・当該記事OGPを確認した。本文/図/元データ792ファイル、
  画像292枚、manifest 73件もR2から読み戻して一致。公開差分0・outbox guard PASSでカードを回収した。
- slug単位の実測証跡は `.claude/state/metrics/content-release-2026-09-08.json`。
  対象外の既公開19コピーの未退避promptと未公開draft 7件は保持し、今回の公開残数へ混ぜない。

## 2026-06 当時の制約

`blog-auto-publish.yml`（develop への docs/21 article.md push で発火、完全DBレス公開ブリッジ）の旧2制約。

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
