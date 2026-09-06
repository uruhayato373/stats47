---
name: feedback_shared_working_copy_git_race
description: 2 つの Claude セッションが同一 working copy/git dir を共有すると HEAD/branch/index を奪い合い git レースになる。回避策あり
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 5bf3159d-935d-444d-991d-c99ef203491f
  modified: 2026-07-29T02:50:53.081Z
---

2026-05-29、YouTube 撤退作業中に、別セッション(dbless)と**同一 working copy / .git を共有**していたため git レースが発生した。

**症状:**
- 自分の commit に相手の staged 削除(`apps/remotion/.../d1-client.ts` 等)が混入した (index 共有のため)
- `feature/youtube-withdrawal` の先端が相手の dbless commit に置き換わった (branch ref 共有)
- コマンドの合間に HEAD が動き、`git rebase` が "unstaged changes" で失敗、`git stash` の pathspec が消えるなど挙動が不安定

**Why:** Claude セッションごとに別プロセスでも、cwd が同じなら `.git`(HEAD/refs/index/working tree) は 1 つ。両者の `git add/commit/checkout/reset` が互いを上書きする。

**How to apply (回避策):**
1. **同時に git 操作する 2 セッションを同じフォルダで動かさない。** 並行作業は `git worktree add ../stats47-<topic> <branch>` か別 clone で working copy を分離する
2. やむを得ず共有している時に自分の commit を安全に反映するには、**ローカル working copy を触らない経路**を使う:
   - クリーンな commit を SHA 直接 push で退避: `git push origin <sha>:refs/heads/<backup>`
   - そこから `gh pr create` + `gh pr merge`(**server-side マージ**) で develop/main へ。ローカル HEAD/index に触れないのでレースしない (この日 PR #376 でこの方法が有効だった)
3. commit 前に `git diff --cached --name-only` で**相手の staged 変更が混ざっていないか必ず確認**する (混入したら `git reset --soft` + `git restore --staged <相手のファイル>` で外す)

**2026-05-30 再発 (article-writer 改善作業):** worktree で作業していたが、(a) `git branch --show-current` で develop を確認した直後に相手が main copy の HEAD を `feature/dbless-code-cleanup` に切替 → 自分の `git merge --no-ff` が**相手のブランチに着地**(stray merge commit が残った)。(b) worktree のベースが実は古い develop (`b25e591e`) で、相手が後から `3c2e3318` を develop に積んでいたため、自分の commit は **1-behind/1-ahead** で fast-forward push が拒否された。

**確立した race-free レシピ (今回成功):**
- 自分の commit が develop の祖先ベースの場合、**新しい isolated worktree を origin/develop tip で作り直し** → `git cherry-pick <自分のsha>` で現 develop の上に載せ替え → `git push origin <new-sha>:develop` で **FF ref push**。main working copy の HEAD/index に一切触れない。
- cherry-pick 前に `git show --stat <develop tip commit>` で**衝突ファイルの有無を確認**(無ければクリーン)。
- **相手が checked out しているブランチ (`feature/dbless-code-cleanup` 等) の ref は動かさない**(reset すると相手の未コミット作業を破壊しうる)。stray merge commit は content 同一なら後で develop に来ても no-op、放置でよい。
- `git branch --show-current` の値を**キャッシュして merge 先を決め打ちしない**。共有 copy では一瞬で変わる。

**2026-06-14 再確認 (ブログ下書き60本一括公開):** セッション開始時 develop だった main copy を、別セッションが作業中に `hotfix/home-featured-isr`→`main` へ切替 (ブランチ奪取)。`git worktree add /Users/minamidaisuke/stats47-blog-publish develop` で **develop を隔離 worktree に確保**し、そこで 60 本の article.md 編集 + commit + `git push origin develop` を 4 回実施 → 全て FF push 成功、相手の hotfix/main 作業と一切衝突せず。develop は worktree が握るので相手は develop を checkout できない=排他取得になり安全。完了後 `git worktree remove` で解放。**worktree 側は node_modules 不在**だが、quality-gate.mjs 等のスクリプトは main copy の絶対パス (`/Users/minamidaisuke/stats47/.claude/scripts/...`) で実行しファイルパスだけ worktree を渡せば動く。blog-auto-publish.yml は develop への article.md push で発火し、published:true flip を 1 run で R2 反映 (60本でも MAX_PUBLISH=10 で取りこぼさず all.json reconcile が補完、本番 HTTP 200 を Googlebot UA で実測確認)。

**2026-06-21 再発 (ranking agent 整備セッション):** 別セッションが blog 作業中に **同一 working copy で `apps/web/src/app/ranking/[rankingKey]/page.tsx` を `loadRankingPageModel` へ refactor** → 自分の D1 コメント除去 + 考察/地域別 UI 統合(X) と**同一ファイルで混在**。git race の典型。対処: **汚染は page.tsx 1 ファイルのみ**と特定し (`grep loadRankingPageModel`= 他人, `grep insightsSection/footer`= 自分が共存)、**clean-mine だけを明示パス add で 2 コミットに分離** (D1 除去 `git add -u packages/ranking/src apps/web/.../server.ts` / agent+gate `git add <明示9>`)。`git diff --cached --name-only | grep -iE "blog|trends|restore-"` で**毎回混入チェック**してから commit。**page.tsx と一体の X は保留**し backlog `[RANKING-AICONTENT-UI-UNIFY-HELD]` に記録 (チャットだけに残さない=セッション断でも survive)。教訓: 共有 copy では「ファイル単位で汚染を切り分け→明示 add→混入 grep→コミット不能分は SSOT 記録」。`git add -A`/`commit -a` は厳禁。

**機構ガード追加 (2026-06-21・①の穴埋め):** 従来この memory は「警告するだけで防止しない」状態だった。`.claude/hooks/session-guard.js` を新設し `.claude/settings.json` の SessionStart + Stop に配線。各セッションが `.claude/state/session-locks/<sessionId>.json` に last_seen を記録し、**SessionStart で同一 working copy (CLAUDE_PROJECT_DIR realpath) の fresh(45分以内)な他セッションを検知して警告**する。Stop で last_seen を refresh (稼働証跡)。worktree/別clone は path が異なるため警告対象外 = 安全な分離は邪魔しない。lock は gitignore 済 (マシン固有ランタイム状態)。これで「2 セッション同一 copy」を**気づく**機構ができた (依然 commit は明示パス+混入 grep が必須)。

**指示 SSOT の共有 (2026-06-21・Codex 規約逸脱の根治):** Codex (OpenAI VSCode 拡張) は `AGENTS.md` を読むが**存在しなかった**ため、プロジェクト規約 (データ保存・デプロイ規律・blog/metric 規約) を一切知らずに作業していた。→ **`AGENTS.md` を `CLAUDE.md` への相対 symlink** にして指示 SSOT を一本化 (Codex も Claude と同じ `CLAUDE.md` + `.claude/rules/` に従う・symlink ゆえ drift しない)。git 共有なので複数 PC でも有効。CLAUDE.md に「並行エージェント (Codex) と SSOT 共有」節を追記 (memory SSOT = `.claude/memory/MEMORY.md` を読む旨 + git 競合注意)。

**Codex WIP を取り込む時の CI 落とし穴 (2026-06-21):** Codex の WIP を `git add -A` で一括コミット→デプロイしたら CI が 2 回 fail。①`npm ci` が `package.json`↔`package-lock.json` 不整合 (Codex が zod 等を package.json に足したが lock 未更新) → **`npm install --package-lock-only` で同期**してコミット。②monorepo 横断 type-check が ranking schema (zod transform の `|null` vs `RankingItem` の `|undefined`) で fail。**自分のローカル `tsc -p apps/web` 単体では出ず、`npm run type-check` (turbo 全パッケージ) で初めて発覚**。教訓: Codex の WIP をデプロイ前に検証するなら **apps/web 単体 tsc では不十分。`npm run type-check` (全パッケージ) + `npm ci --dry-run` (lock 整合) を回す**か、CI に委ねて fail を順次潰す。

**広い `git add` が CI 掃除済みファイルを出戻りさせる (2026-06-21):** 大量ブログ公開後、`blog-auto-publish.yml` の cleanup ステップ (`git rm` + commit-back `[skip ci]`) が `docs/21` の公開済みドラフトを ~100 件削除していた。その直後に「全セッション/Codex 変更の統合コミット」を広い `git add` で作ったら、**まだローカル作業ツリーに残っていた 24 件の公開済みドラフトを git に出戻り**させ、ephemeral outbox 不変条件 (公開済みは置かない) を壊した (R2 が正典・全件本番200・git 履歴も残るので無害だが outbox が散らかる)。**How to apply**: ① `docs/21` は ephemeral outbox = CI が握る領域。**統合コミットの `git add` 対象から `docs/21` を外す** (公開済みドラフトの掃除は CI に任せる)。② 出戻り検知: `find docs/21 -name article.md | xargs grep -l '^published: true'` が空でなければ掃除漏れ → published:true & 本番200 を確認して `git rm`、published:false の作業中ドラフトのみ残す。③ 掃除コミットは CI 同様 `[skip ci]` を付けると blog-auto-publish の no-op 発火を避けられる (今回は付け忘れたが deletion なので detect 空 → reconcile 無し = 無害な空振り)。`git add -A`/`commit -a` 厳禁は CI 管理領域の出戻り防止でもある。**機構化済 (2026-06-21)**: 手動掃除に依存せず、`blog-remediation-daily.yml` (日次 JST 08:00) に `.claude/scripts/blog/prune-published-outbox.mjs --apply` を配線。「published:true かつ **R2 の article.md と内容完全一致**」のドラフトを自動 `git rm` するので**出戻りしても翌日消える** (published:false は保持)。手動掃除は `node .claude/scripts/blog/prune-published-outbox.mjs`(dry-run)→`--apply` で即時実行も可。**★内容一致を要求するのは安全装置**: brushup (既 live 記事の改稿) は docs/21 に published:true のまま新版を置き R2 には旧版が live なので、「存在」だけで消すと改稿中を誤削除する (2026-06-21 整合性監査で検出した統合バグ。publish は cp -R verbatim なので完全一致=取り残しと確定でき、差分=改稿中は保持)。正典: [[project_blog_publish_cloud_first]] / blog-data-schema.md §0。

**★worktree 分離でも「相手の未コミット source」は漏れてくる (2026-07-29・per-area 100倍バグ修正時):** worktree は `.git`/HEAD/index を分離するが、**npm workspace の symlink は本体 checkout の絶対パスを指したまま**なので、`@stats47/*` の import は**本体側の作業ツリー**に解決される。実際 worktree で `npm run type-check --workspace apps/web` が `home-portal` の型エラーで落ち、原因は**別セッションが本体で `packages/data-configs/src/{index,home-portal}.ts` を編集中**だったこと (私の変更とは無関係)。`ls -l /Users/minamidaisuke/stats47/node_modules/@stats47/data-configs` → `../../packages/data-configs` = **本体側**。**How to apply**: worktree で検証が謎の失敗をしたら、まず `git -C /Users/minamidaisuke/stats47 status --porcelain -- packages/` で相手の WIP を疑う。隔離するには worktree 内に `node_modules/@stats47/<pkg> → <worktree>/packages/<pkg>` の symlink を張る (自分のツリーを検証できる)。**もう 1 点**: worktree の `node_modules` は実質空 (`.vite` のみ) で、依存は上位ディレクトリ探索で解決されるが、**`typeRoots: ["../../node_modules/@types"]` のような相対パス指定とアセット実ファイルパスは解決できない** (pre-commit の型チェック・image-pipeline テストが `ENOENT` で落ちる)。本体 `node_modules` の全エントリを worktree に symlink すれば pre-commit 全項目が通る (`@stats47` だけは自分向きを維持)。gitignore 配下なのでリポジトリには影響しない。

**★自分が起動した subagent も「相手」になる (2026-08-05・Due 超過解消時):** これまでの記録は全て
「別の Claude セッション / Codex」との競合だったが、**Agent tool で自分が並列起動した subagent**でも同じことが起きる。
背景で `theme-portfolio-manager` が `packages/data-configs/src/theme-catalog/manufacturing.ts` を編集している最中に、
私が無関係な docs 変更を `git add -A && git commit` → **agent の未完成 WIP が「blog SEO 2件のDue再設定」という
無関係なコミットメッセージで develop に push された** (commit `b0cf9c2be`)。agent 自身は commit/push を一切していない。
内容は結果的に正しかった (`entities:["city"]` = 県値が構造的に無い 3 metric のカタログ除外・validate:catalog error 0・
R2 404 を実測確認) が、**レビュー前の他者の成果物を公開した**という点で process 違反。
**How to apply:** ① background agent を 1 体でも走らせている間は `git add -A` / `git add .` / `commit -a` を使わない
(既存ルールの適用範囲を subagent にも広げる)。② commit 前に `git status --short` で**自分が触っていないパスが無いか**確認する
— 特に agent に渡した scope のファイル (今回なら `packages/data-configs/src/theme-catalog/`)。
③ 混入したら push 前なら `git reset --soft HEAD~1` + 明示パス add で分離。**push 済みなら共有ブランチの履歴を書き換えない**
(オーナーが同じ develop に push していた) — 内容を検証し、事実を報告して次の commit で記録を正す。
④ そもそも「agent の成果物は agent 完了後にレビューしてから自分で commit する」を既定にする。

**Stop フックが繰り返し止まる (2026-09-06 実測)**: 作業ツリーを共有していると、
`check-consistency-on-stop` が**他セッションの未コミット差分まで数える**
(`git status --porcelain` ベース。表示は「この会話で」だが実態は作業ツリー全体)。
`--mark-audited` は差分集合の指紋を記録するので、相手が 1 ファイル触るたびに指紋が変わり再発火する。
1 セッションで 18 → 26 → 34 件と増えながら 3 回止まった (自分の変更は 2 件だけ)。
**How to apply:** ① 並行セッションは worktree を分ける (これが恒久対処。同じツリーを共有しない)。
② 共有せざるを得ないときは、フックが止まっても自分の変更範囲だけを意味レビューし、
他セッション分は「確認していない」と報告に明記する (監査済み記録は全体に付くため)。
③ ゲート本体 (`check-agent-skill-consistency.cjs` / `docs:check`) が緑なのに止まる場合、
落ちているのはゲートではなく**指紋の一致**なので、ゲートを疑って調べ直さない。

**merge の後に rebase しない (2026-09-06 に共有ブランチを壊した)**:
`git merge origin/main` の後 `git rebase origin/develop` すると merge が平坦化され、
main の commit を replay して途中で停止する。その detached な中途状態を push すると
**develop が「main を含まない部分適用状態」**になる。復旧は rebase --abort → merge commit へ戻し、
現 develop を merge し直して push。追随は常に `git merge` / `git pull --no-rebase`。
正典: `.claude/rules/branch-workflow.md`。

関連: [[project_env_local_ci_consolidation]] [[project_dbless_migration_2026_05_29]] [[project_blog_publish_cloud_first]] [[project_blog_mass_rewrite_lessons]] [[feedback_sync_snapshots_checks_out_main]]
