---
name: project_blog_mass_rewrite_lessons
description: ブログ大量リライトを Workflow 全自動で回した教訓 (2026-06-13)。である調 copula 機械置換は崩壊・173本一括で14M+session limit・title固定でNG_PATTERN詰まり
metadata: 
  node_type: memory
  type: project
  originSessionId: ab83ada2-1276-4434-b00d-bd36d9a2b9f7
---

2026-06-13、公開済みブログ 173 本 (blocker>0 pending) を Workflow (article-writer→blog-critic→revise→critic) で一括フルリライトした際の教訓。

**1. である調是正を「正規表現の copula 一括置換」でやってはならない (実証済)**
`である。/だ。/だった。/ではない。` 等 copula 文末だけを機械置換すると、動詞終止形・形容詞終止 (〜もたらす。/〜連なる。/〜多い。) が常体のまま残り「です。」と混在して**文体が崩壊**する。`quality-gate.mjs` は copula しか検出しないため **gate は通ってしまい崩壊に気づけない**。→ 必ず **article-writer agent で文単位に ですます完全化**する。正典に追記済: [[feedback_evidence_based_judgment]] 系の `.claude/rules/blog-quality-standards.md`「文体」§ + `audit-published-blog.mjs` の flagメッセージも修正済。**Why**: gate(機械floor)を品質と取り違えた典型。**How to apply**: 文体修正は agent タスクに回す。決定的スクリプトは「関連セクション削除」など文体無関係なものに限る。

**2. 173本を1 Workflow で writer→critic→revise→critic 全自動 = トークン爆発 + session limit**
実測: agent 678体・**14.3M tokens**・68分で **session limit 到達** (Asia/Tokyo の枠)。writer は110本完走したが critic 段が大量に失敗 (review.md 12本のみ生成)。resume してもトータル 25M 超見込み。**How to apply**: ブログ大量リライトは **1バッチ 20-30 本に分割**し、バッチ間で結果確認する。writer(article-writer)は quality-gate 反復+SVG生成+全文書き換えで 1本あたり ~10万tok と重い。critic は別段で追走するため writer 先行 → critic が枠を食い潰す構図になりやすい。[[project_blog_brushup_dbless_scaffold]] の直列dispatch教訓と同系。

**3. リライト時 frontmatter title/seoTitle を固定すると NG_PATTERN 記事が永久に詰まる**
`title`/`seoTitle` に「N位」(bare rank) や「X倍格差」連結があると `quality-gate.mjs` の NG_PATTERN blocker で公開が止まる。これを「frontmatter 変更禁止」と縛ると critic が永久に REVISE を返す。→ リライト時は **title/seoTitle を curiosity gap 基準で reframe 許可** (数値・県名・年・倍率の事実は保持、「N位」「X倍格差」を外し「なぜ/vs/真因」で引く)。brushup の CTR-reframe focus と整合。

**4. 記事の SSOT/公開経路** (再確認): 公開済み記事は **R2 のみ実体** (`storage.stats47.jp/app/blog/<slug>/article.md`)。`docs/21` は新規ドラフトのみ。リライトは R2取得 → `docs/21` 展開 → **develop に published:true で commit+push すれば `blog-auto-publish.yml` が push trigger で自動公開** (下記6)。単記事の即時公開のみ `publish-blog.yml` を `gh workflow run -f slug=<slug> -f dry_run=false --ref develop` で dispatch。`quality-gate.mjs` は review.md を**記事と同ディレクトリ**に探す (published:true は blog-critic review.md verdict:PASS 必須)。詳細 [[project_blog_publish_cloud_first]]。

**5. publish-blog の dispatch は必ず「前のCI完了を待ってから次」(2026-06-13 実証)**: `publish-blog.yml` は `concurrency: group: publish-blog, cancel-in-progress: false`。この設定は**直列実行ではない** — 同 group に複数 run を一気に dispatch すると、**最新1つの pending だけ残して古い pending を GitHub が cancel する**ため、107本一気 dispatch したら大半が `conclusion: cancelled` で公開されなかった (article.md は develop に commit 済みなのでデータロスは無し、再 dispatch で復旧可)。正しい直列化は **1本 dispatch → `gh run watch`/非completed が0になるのを待つ → 次**。これが memory `branch-workflow`「直列ディスパッチ必須」の真意。100本級は完了まで数時間かかるので background ループで回す。

**6. ★大量公開は publish-blog 手動 dispatch 不要・blog-auto-publish 自動に任せる (2026-06-14 最大の反省)**: `blog-auto-publish.yml` が **develop への `docs/21_*/article.md` push で自動発火** (Phase 2 の push trigger) し、published:true 差分を **MAX_PUBLISH=10件/run** ずつ自動公開する。**docs/21 に published:true を commit+push するだけで公開が自動で進む**。`publish-blog.yml` (workflow_dispatch のみ・concurrency cancel する) の手動 dispatch は**単記事の即時公開専用**。`branch-workflow.md` / `deploy` SKILL に既記載だったのに読み落とし、108本を手動 dispatch (大半 cancel で無駄、point 5) したのが反省。**新しい workflow を見たら必ず `on:` の push trigger と既存の自動公開経路を先に確認する**。大量公開フロー: docs/21 に published:true で push → blog-auto-publish が 10件/run ずつ自動消化 (差分が残る間は develop push or 当該 yml の再 dispatch で reconcile)。

**7. ★順次リライトは SSOT(remediation-queue) で進捗記録し再リライトを防ぐ (2026-06-21 確立)**: 112本一括 Workflow (`.claude/workflows/blog-mass-rewrite.js`) を回したら **24.3M tokens・98分で session limit 到達**、rewrite は 112/112 完走したが critic ~50本が失敗。実測 **1記事 ~217K tok**。→ **一括せず 1バッチ 15-20 本に分割**し、進捗を SSOT に記録しながら順次回す。**機構** (workflow は FS 書き込み不可なので queue 更新は外で行う): ① `build-remediation-queue.mjs --next N` で pending 上位 N slug → ② `Workflow(blog-mass-rewrite, args=[slug配列])` で rewrite→gate→critic → ③ **`.claude/scripts/blog/sync-rewrite-progress.mjs --wave-id <date>-N`** が docs/21 を走査し queue に upsert (review.md verdict:PASS=done+remediated_at / rewrite済未PASS=in-progress / article.md無=pending据置)。`--next` は pending しか返さないので **done/in-progress は再リライトされない**。queue は upsert で status 保持 (rebuild しても消えない)。**critic 失敗(session limit)分は rewrite 済=in-progress** なので、枠リセット後に critic のみ追走 (安価) すれば done に昇格。args は **slug 配列のみ**渡す (115エントリの blocker JSON を inline で渡すと転記ミス。各 agent が quality-gate で blocker 自己検出)。args は文字列で届くので workflow 側で JSON.parse フォールバック必須。正典: `docs/02_実装計画/06_ブログ品質是正ループ.md`。**critic 追走**: rewrite 完走・critic 失敗 (review.md 無し=in-progress) の記事は `.claude/workflows/blog-critic-followup.js` で **critic のみ** 15-18件ずつ走らせる (rewrite やり直さない・~120K tok/件)。PASS→sync で done 昇格→公開。公開は既 live 改稿なので `blog-auto-publish.yml -f slugs` を 10件/run 直列 dispatch (review.md を先に develop push)。2026-06-21 実績: 112 rewrite → critic 追走 50 件 (46 PASS/4 REVISE) → 計 102 件公開。
