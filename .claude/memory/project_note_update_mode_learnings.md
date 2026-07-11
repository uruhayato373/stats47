---
name: project_note_update_mode_learnings
description: note --update 実機の学び。do_update/paid_setline のバグ(eval-click要)・browser-use temp profile セッション管理・git-race並行(covers git show 取り出し)・WARN false negative。★2026-07-11 に editor-helpers.sh へ backport 済 (commit cbc0f1d2)・cover 生成器も develop merge 済 (c0b8f1f6)。実機 note 再テストは未
metadata: 
  node_type: memory
  type: project
  originSessionId: 2a59ffdd-aee8-4ef6-91da-c19b0fd0f31a
---

2026-07-10 に公務員 note 45本(実36本)を新カバー+本文で `/publish-note --update` 実機一括更新した際の学び。
`editor-helpers.sh` の既存関数に**未修正のバグが2件**あり、/tmp の使い捨てドライバで回避していた。
**→ 2026-07-11 に全て canonical へ backport 済 (commit `cbc0f1d2`): do_update の eval-click / paid_setline の
DOM fallback / WARN 緩和。edit 版アイキャッチ差替も editor-operations.md Phase 2-edit に追記。cover 生成器・
背景アセット・カバー PNG も develop へ cherry-pick 済 (`c0b8f1f6`)。** 下記スニペットは今後の参照/再発時用に保持。
**⚠️ 実機 (note ログイン) での再テストは未実施** — 次回 `/publish-note --update` で bug2 fallback を実証すること。

## editor-helpers.sh の backport 修正 (★2026-07-11 反映済)

1. **`do_update` の「更新する」クリックが a11y index では効かない**。ヘッダーの「更新する」「公開に進む」ボタンは browser-use の `state` で **[idx] が付かない**（プレーンテキストとして出る）。→ **Shadow-DOM 貫通 eval-click** が必要:
   ```js
   (function(){function deep(r,a){r.querySelectorAll('*').forEach(e=>{if(e.tagName==='BUTTON')a.push(e);if(e.shadowRoot)deep(e.shadowRoot,a);});return a;}var b=deep(document,[]).find(x=>(x.textContent||'').trim()==='更新する');if(b){b.click();return 'clicked';}return 'nf';})();
   ```
   今回 #01 で `do_update` が `[FAIL] no publish modal` になり発覚。上記で解決。

2. **`paid_setline` がリンク/インラインコード見出しで失敗**。有料境界見出しが `SKILL.md` 完全版 のように **inline link/code を含む**と、a11y state の単行テキスト照合が外れ「line button not found」。→ **DOM eval-click** で「有料セクション1」で始まる `H1-4` を探し、その直前の「ラインをこの場所に変更」ボタンを click:
   ```js
   // deep()で全要素配列 all を作り、有料セクション1で始まる H1-4 の hIdx を取り、
   // hIdx から後方最初の button(textContent==='ラインをこの場所に変更') を click
   ```
   今回 #06/#07 で失敗→この方式で解決。境界は必ず公開ページ curl で `grep -c "有料セクション 1"` == 0 (非露出) を確認。

3. **WARN false negative**: `更新する` クリック後に「記事が公開されました/シェアして」モーダル検出が timing で外れることがある(更新自体は成功)。→ 成功未確認は**エディタ再オープンでライブ確認**(#13/estat01/estat11 は実際は成功していた)。

## browser-use セッション管理 (★ハマり)

- `browser-use --headed --profile "Profile 5"` は**実 Chrome ではなく temp user-data-dir に Profile 5 を COPY** して起動する(`/T/browser-use-user-data-dir-*`)。
- セッション失効時、ユーザーが**実 Chrome でログインしても temp Chrome には効かない**。→ **browser-use が開いた headed 窓の中でログイン**してもらう。または daemon+temp Chrome を kill して再起動(実 Profile 5 のログイン済み cookie を新 temp copy が取り込む)。
- daemon が hang したら `pkill -KILL -f browser_use.skill_cli.daemon` + `browser-use-user-data-dir-*` の Chrome kill → 再 open。長い eval チェーンは 2min tool timeout に注意(単発に分ける)。

## git-race 並行の技 (★別セッションと共存)

別セッション(家計調査)が同一作業ツリーで何度もブランチ切替 → docs/31 のカバーが旧版に巻き戻る/バッチが killed。回避:
- **必要ファイル(カバー)を自分のブランチから `git show <branch>:<path> > /tmp/...` で取り出し**、ドライバの参照先を /tmp に向ける → **作業ツリーに一切触れず並行**できた。日本語パスは `git -c core.quotepath=false ls-tree` で取得。
- draft.md/本文画像/スクリプトは develop 由来で両ブランチ同一なので現ツリーから読んでOK(差分はカバーのみ)。

## 更新フローの要点

- `/publish-note --update <slug>` は **本文を全消去→再ペースト + アイキャッチ差替**を両方やる(cover-only モードは無い)。**本文長ゲート**(期待の55%未満は更新中止)で空記事公開を防ぐこと必須。
- **編集画面のアイキャッチ差替**(update): 既存カバーの `削除`(button の子 span aria-label=削除)を click → `画像を追加` → `画像をアップロード` → `input#note-editor-eyecatch-input` に upload → トリミング `保存`。editor-operations.md Phase2 は新規投稿用で edit 版は未整備。
- 無料記事: 公開に進む → 試し読みエリアを設定 → (ライン触らず)更新する。

## カバー SSOT

カバーは**派生物**。SSOT = frontmatter(title/is_paid/category) + 背景アセット(`.claude/scripts/note/assets/koumuin-cover-bg.png` / magazine 別背景) + 生成器 `generate-koumuin-covers.cjs`(`--magazine` 有)。全て **commit `32176c1b` / branch `feature/koumuin-note-cover-redesign`(develop 未マージ)**。Satori 汎用 note-cover から koumuin 2シリーズは除外済(二重SSOT回避、正典 `ogp-image-standards.md` §5)。関連 [[project_note_publish_flow_2026_06]] / [[feedback_note_publish_automation]] / [[feedback_shared_working_copy_git_race]]。
