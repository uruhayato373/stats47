---
name: project-note-image-assets-contract
description: note画像契約。カバーはdata/noteのJSON+Schema・private R2のSHA版で統一。記事本文と画像は2026-10-13からR2だけ(docs/31はgitに置かない)。ランキング画像はchart-data+render-specから再生成
metadata:
  type: project
---

2026-09-29 に `docs/31_note記事原稿/` の画像・データ管理を整理した。正典は `.claude/rules/note-image-assets.md`、検査は `npm run note:images:audit`(pre-commit・PR・quality-gates `note-image-assets`・週次レビューの `weekly:audits` (note-circulation)、週次は `--verify-r2` 付き)。

**2026-10-02: カバーの正本と画像台帳を統一。**

- **問題**: 管理画面の県別家計カバーが新候補を表示せず、別PCで候補を再取得できなかった。
- **原因**: 制作manifestは無視された `.local/`、管理画面は公開監査JSON、画像一覧は旧public R2の固定パスを別々に読み、候補・採用・公開の対応が共有されていなかった。9/28-v4の実体が無いままレビュー記録だけが残っていた。
- **対策**: オーナー指示で `data/note/cover-assets.json` + JSON Schema をカバー運用の正本とする例外を明文化。実体はprivate R2 `stats47-private/note/covers/<key>/revisions/<sha>.png`、ローカルは一時生成/アップロード入力だけ。生成・採用・公開・監査・両管理画面を同じ台帳へ接続し、汎用OGP writerは書込前に停止。未回収を新生成・承認・公開と混同せず、正確な候補SHAだけを採用する。
- **証拠**: `npm run note:assets:test` (17件)、`note:covers:test` (16件)、管理画面の画像表示/取得失敗案内、`data/note/cover-operations-latest.json`。公開286+新家計47+旧家計47の380版をremote読み戻しで照合。

WindowsのSVG復元は `path.basename()` を使う。`split('/')` はWindows区切りを処理せず、派生PNGの存在確認と復元に失敗する (`note:images:test` 20件で検証)。会社PCのTLSはWindowsの公開ルート証明書を読み、`rejectUnauthorized: true` を維持する。証明書providerに依存せず.NET X509Storeから取得する (`cover-storage.mjs`)。

**認証の期限切れ**: 保存済みOAuth tokenを読むだけでは、時間が経つとprivate画像が502になることを実測した。`cover-storage.mjs`は期限前に非対話のWrangler更新を行い、同時画像取得は1回の更新を共有し、更新後のtokenを毎回読み直す。子プロセスもTLS検証を有効にし、Windowsの公開CAファイルは更新後に削除する。失効などで更新不能なら停止して接続案内を出す。並行12読取・token変更・更新失敗をfixtureで検査し、実際の期限切れからの再取得も確認済み。

- (2026-10-13 以降は docs/31 を git に置かないので、PNG の追跡・予算の話は過去の経緯。記事の画像は R2 に保存される → [[project_note_article_ledger]]) 当時の整理: 追跡PNG 682枚→104枚(product-salesのみ)。SVG由来(家計・koumuin)は `npm run note:images:regen -- --slug <dir>`、ランキング記事(a-<key> 15本)は `node .claude/scripts/note/render-ranking-images.mjs <key>` で作り直す。後者は `chart-data.json`(unit追加済み)+`render-spec.json`(SHA・テンプレート版)が根拠。テンプレートを変えたら `note-render-spec.mjs` の `NOTE_RENDER_TEMPLATE_VERSION` を上げる。
- ランキング画像は note専用テンプレート(`apps/remotion/src/features/ranking-note/`)。色は値でなく順位で決める(外れ値1県で他が同色になるため)。ranking-x共有部品は変えず、RankingBoxplotにopt-in propだけ足した。
- 「画像はGoogle Drive」は採らなかった。重さの主因が再生成可能PNGで、R2 outbox(sync-note-r2)とDBレス方針もあるため。

**Why:** git pack 527MBの主因が再生成可能な派生PNGだったため。**How to apply:** 記事の画像は作業コピーで作り直して `note:article save` で R2 に保存する。git には置かない。

**罠1:** 旧カタログの `r2Body` 既定は true で、登録しただけで「R2にあり」になった (a-* 65本が実際は R2 に無かった)。2026-10-13 の台帳では `body.manifest` を保存・読み戻しできたときだけ書くので、申告と実体がずれない。
**罠2:** `git stash` は index の削除(`git rm --cached`)を pop で元に戻さない。stash pop 後に PNG 580枚が追跡に戻った。追跡解除中の作業では stash を使わない(使ったら audit で再確認)。

関連 [[project_note_update_mode_learnings]]。

**問型ランキングのカバー (2026-10-02)**

- **問題**: 旧描画検査はテキストが0件でも通過し、記事固定データのないカバーは最新ランキングへ依存しかねなかった。
- **原因**: Satoriのlayout callbackは文字列を`textContent`へ渡すため、`props.children`を読む検査では文字を数えられない。公開90本のうち記事側chart-data.jsonは22本だけで、8本にはunitが無かった。タイトルに同率1位の一部しか書かれていない3本も実測した。
- **対策**: `question-cover-data.mjs`で記事タイトルの年・47県一意・値・単位・全同率1位を照合し、制作入力をprivate R2 `note/covers/<key>/inputs/<sha>.json`へ固定。カバーは凡例なし・値の線形YlOrRd、本文の順位配色とは別契約。描画検査は`textContent`を使い、0件・範囲外・重なりを停止する。取得済み入力を再利用する場合はsource inventoryのURL・SHA・観測時刻・200/404を照合し、407など通信失敗を欠損扱いしない。
- **証拠**: `npm run note:assets:test`の固定年/47県/同率/単位修復/入力SHAテストと、`data/note/ranking-question-cover-latest.json`の90本生成・remote読戻し記録。公開前比較元は`note:assets prepare --source ledger`で保全済み画像を使用でき、公開観測時刻は更新しない。

**2026-09-30 追記:** 生成AI画像は「作り直せない入力」なので二層保管(Drive 候補 / R2 承認版 / git は SHA・モデル・指示文)。note は `ingest-note-background.mjs`、Kindle は `stash-cover-candidate.mts`。画像の生成口は1つ: note 4枚は `render-ranking-images.mjs` だけ(pipeline:sns の note 出力は廃止)。公開入口は `ensure-note-images.mjs` が PNG を揃え、カバー無し公開を止める。SVG は git に置く(正本・約1.5MB・koumuin 268枚は手作り)。Kindle 元画像12冊は Drive `Kindle表紙/<id>/candidates/` に移設済み。レンダーは bit 単位で決定的(同一 SHA を実測)。

**2026-11-04 管理画面の「未公開」99本は誤表示だった**: 新規公開は `update-note-covers` を通らず公開ポインタが採用版へ結ばれないため、公開済みでも未公開と出た。公開画像の実物は全件採用版と一致していた。`note:assets archive` が画素照合のうえ採用版へ結ぶよう直し、減色で落ちた4本は目視のうえ `--reviewed-match` で結んだ。既存の画素判定は同型カバー (`b-ref-prc-a48`/`a50`) の取り違えを通すので、これだけを別画像の否定に使わない ([[project_note_update_mode_learnings]])。

**2026-11-04 旧形式126本を現行のimagegen方式へ差し替え完了**: 公開428本すべて `note-imagegen-cover-v1`。制作内容は管理画面の PATCH で保存すると採用が解除される (公開画像は変わらない)。ディスク枯渇で admin の保存が500になった実例あり。wrangler の OAuth は1時間で切れ、更新の境目で import が `session expired` になる (失敗した記事の候補は旧版のまま残るので、登録の成否を台帳で確かめてから採用する)。

**台帳の題名を公開題名に揃えるとき**: `data/note/articles.json` だけ変えるとカバーの plan が stale になるので `production.titleCorrection` を同時に入れる。常駐中の admin dev サーバーは台帳を読み直さず、題名とのずれで全画面500になるので再起動する (2026-11-04 実測)。公開題名の確認は台帳でなく note API の `name` で行う。

**2026-11-14: 台帳を 2 層に分けた (`5e0a1fe90`)。** `data/note/cover-assets.json` は 1 MiB の上限に近づいたので、正本には記事ごとの現在の版だけを残し、版の履歴と制作内容 (production) は記事ごとの `data/note/cover-records/<key>.json` へ移した。台帳を読み書きするときは `coverLedgerFiles` を通す。旧形式 (1 ファイル) の `cover-assets.json` を別ブランチから持ち込むと、読み込みが「cover ledger schema」で止まる。
