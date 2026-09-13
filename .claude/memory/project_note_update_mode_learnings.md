---
name: project_note_update_mode_learnings
description: note --update/new実機の学び。paid_setlineは同名本文でなくH1-H4完全一致と隣接gateが必須。do_update eval-click・browser-use temp profile・WARN false negativeも記録。
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
**2026-09-01 に新規有料Geo商品で実機再テスト済み。** H1-H4完全一致の境界設定、価格、ZIP添付、公開後の有料本文非露出と所有者ダウンロード表示を確認した。

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

4. **有料見出しと同じ語を無料本文で説明すると、stateの文字列検索は先の段落へ誤配置する**（2026-09-01、`商品ファイルのダウンロード`）。初回screenshotで無料説明段落の直前にラインが置かれたため公開を停止した。原因は`h1,h2,h3,h4,p,li`の最初の部分一致とa11y stateの先行一致。対策は次の3点を決定的gateにする。
   - deep DOMで**H1-H4だけ**を走査し、正規化後の見出しテキストが**完全一致**する要素を取る
   - その直前の`ラインをこの場所に変更`だけをclickする
   - viewport外を省略する`state`ではなく、deep DOM順で`id=paywall-line`が`pressed=true`、次の実コンテンツが対象H1-H4であることを検証し、screenshotで目視する。空の`P/BR`と境界UIだけは間に入る場合がある

   正典実装は`.claude/scripts/note/editor-helpers.sh`の`paid_setline_from_settings`。公開後は非ログインHTMLにZIP名が無いこと、所有者画面にZIP名・容量・ダウンロードボタンがあることまで確認する。

5. **update時の本文全消去だけでは旧添付が残る場合がある**（2026-09-01、Geo商品ZIP差し替え）。新ZIPを挿入して更新すると、所有者画面に新4.18KBと旧3.88KBの2件が表示された。対策は公開後に`[embedded-service=attachment]`の件数・ファイル名・容量を必ず検査し、重複時は編集画面で旧`figure[embedded-service=attachment]`だけをRange選択して削除→境界再設定→再更新する。非ログインHTMLの非露出だけでは重複を検出できない。

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

- 本文更新の`/publish-note --update <slug>`は全文を差し替える。カバーだけの変更には専用`update-note-covers.mjs`を使う（下記）。本文更新の**本文長ゲート**(期待の55%未満は更新中止)は引き続き必須。
- **編集画面のアイキャッチ差替**(update): 既存カバーの `削除`(button の子 span aria-label=削除)を click → `画像を追加` → `画像をアップロード` → `input#note-editor-eyecatch-input` に upload → トリミング `保存`。editor-operations.md Phase2 は新規投稿用で edit 版は未整備。
- 無料記事: 公開に進む → 試し読みエリアを設定 → (ライン触らず)更新する。

## カバー設定の判定は記事詳細 API で行う（2026-09-12 実測）

- **問題**: creator 一覧の `eyecatch` が非空ならカバー設定済みと判定し、未設定を13件と誤報した。
- **原因**: 一覧の `eyecatch` は本文先頭画像のURLを返すことがある。全286件の詳細を取得すると、一覧画像あり・詳細カバーなしが70件あり、全件で一覧URLが本文先頭画像と一致した。家計調査 `a-kakei-*` 47件もこの状態だった。
- **対策**: `npm run note:covers:audit`を使う。公開一覧・カタログの和集合を `GET https://note.com/api/v3/notes/{noteKey}` で取得し、`user.urlname`・公開状態・`eyecatch` フィールドの存在を確認して、詳細の `data.eyecatch` だけで設定有無を判定する。一覧サムネイル・本文画像・画像URLのHTTP 200はカバー設定の証拠にしない。最新結果は`.claude/state/metrics/note-cover-audit-latest.json`。不明・不完全はexit 2、未設定・集合差分はexit 1。
- **証拠**: `.claude/state/metrics/note-cover-audit-2026-09-12.json`。例: `nda72a0bed2c4` は詳細 `eyecatch:null`、一覧画像は本文の最初の図表。比較対象 `n455ec72c5d62` は詳細カバーあり・1280×670。

## 新dashboardの計測と欠測（2026-09-12）

- **問題**: 旧collectorの列位置・views・期間固定は、2026-09-08に変更されたnoteの新dashboardと一致しない。
- **原因**: 旧ビューと新インプレッション/PVは別指標。一覧の「もっとみる」はロード中に一時消失する。またカスタム期間によって公開記事の行が出ない実例がある。
- **対策**: `npm run note:metrics:fetch`でラベル・期間・時刻・全ページ・合計を検証する。再表示された「もっとみる」は続けて開く。カタログ欠落だけなら他の検証済み行を残し、欠落行はnull、全体はincomplete。新schemaVersion 2は`.claude/state/metrics/note/dashboard/`に保存する。PV/表示回数をCTRにしない。
- **証拠**: 同ディレクトリの2026-08-15〜09-11履歴は285記事、合計一致、`n99561600d4fe`だけ欠落。2021-05-01からの拡張期間では286記事すべて表示され、同記事も確認できた。短い期間の値を0と推測しない。
- **終了処理**: `browser-use sessions`が0でも検査用daemonとChromeがOS上に残った。新collectorは一意sessionのPID/子プロセス/複製profileを追跡して停止・削除する。他taskへglobal pkillしない。

## カバー SSOT

公開カバー改修（2026-09-12）: 画像トリミングの「保存」はその場で公開eyecatchへ反映される。
本文の「更新する」は不要。画像専用POSTの4項目・ヘッダー・前後保全gateの正典は
`.claude/scripts/note/catalog/README.md`「公開カバーの制作と差し替え」。UIで本文編集画面を開くと
自動保存で`has_draft`が立つため、カバーだけならエディタを開かず専用CLIを使う。
note配信PNGは減色される（初回API試験は画素平均絶対誤差0.66/255）ので、配信バイトSHAの完全一致は要求しない。

カバーは**派生物**。SSOT = frontmatter(title/is_paid/category) + 背景アセット(`.claude/scripts/note/assets/koumuin-cover-bg.png` / magazine 別背景) + 生成器 `generate-koumuin-covers.cjs`(`--magazine` 有)。全て **commit `32176c1b` / branch `feature/koumuin-note-cover-redesign`(develop 未マージ)**。Satori 汎用 note-cover から koumuin 2シリーズは除外済(二重SSOT回避、正典 `ogp-image-standards.md` §5)。関連 [[project_note_publish_flow_2026_06]] / [[feedback_note_publish_automation]] / [[feedback_shared_working_copy_git_race]]。
