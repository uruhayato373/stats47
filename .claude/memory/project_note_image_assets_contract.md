---
name: project-note-image-assets-contract
description: note原稿(docs/31)の画像資産契約。画像はgit非追跡でSVGまたはchart-data.json+render-spec.jsonから再生成、catalogのr2Body既定trueは実在を保証しない
metadata:
  type: project
---

2026-09-29 に `docs/31_note記事原稿/` の画像・データ管理を整理した。正典は `.claude/rules/note-image-assets.md`、検査は `npm run note:images:audit`(pre-commit・PR・quality-gates `note-image-assets`・週次 `note-circulation-audit-weekly`、週次は `--verify-r2` 付き)。

**2026-10-02: カバーの正本と画像台帳を統一。**

- **問題**: 管理画面の県別家計カバーが新候補を表示せず、別PCで候補を再取得できなかった。
- **原因**: 制作manifestは無視された `.local/`、管理画面は公開監査JSON、画像一覧は旧public R2の固定パスを別々に読み、候補・採用・公開の対応が共有されていなかった。9/28-v4の実体が無いままレビュー記録だけが残っていた。
- **対策**: オーナー指示で `data/note/cover-assets.json` + JSON Schema をカバー運用の正本とする例外を明文化。実体はprivate R2 `stats47-private/note/covers/<key>/revisions/<sha>.png`、ローカルは一時生成/アップロード入力だけ。生成・採用・公開・監査・両管理画面を同じ台帳へ接続し、汎用OGP writerは書込前に停止。未回収を新生成・承認・公開と混同せず、正確な候補SHAだけを採用する。
- **証拠**: `npm run note:assets:test` (17件)、`note:covers:test` (16件)、管理画面の画像表示/取得失敗案内、`.claude/state/metrics/note/cover-operations-latest.json`。公開286+新家計47+旧家計47の380版をremote読み戻しで照合。

WindowsのSVG復元は `path.basename()` を使う。`split('/')` はWindows区切りを処理せず、派生PNGの存在確認と復元に失敗する (`note:images:test` 20件で検証)。会社PCのTLSはWindowsの公開ルート証明書を読み、`rejectUnauthorized: true` を維持する。証明書providerに依存せず.NET X509Storeから取得する (`cover-storage.mjs`)。

**認証の期限切れ**: 保存済みOAuth tokenを読むだけでは、時間が経つとprivate画像が502になることを実測した。`cover-storage.mjs`は期限前に非対話のWrangler更新を行い、同時画像取得は1回の更新を共有し、更新後のtokenを毎回読み直す。子プロセスもTLS検証を有効にし、Windowsの公開CAファイルは更新後に削除する。失効などで更新不能なら停止して接続案内を出す。並行12読取・token変更・更新失敗をfixtureで検査し、実際の期限切れからの再取得も確認済み。

- 追跡PNG 682枚→104枚(product-salesのみ)。SVG由来(家計・koumuin)は `npm run note:images:regen -- --slug <dir>`、ランキング記事(a-<key> 15本)は `node .claude/scripts/note/render-ranking-images.mjs <key>` で作り直す。後者は `chart-data.json`(unit追加済み)+`render-spec.json`(SHA・テンプレート版)が根拠。テンプレートを変えたら `note-render-spec.mjs` の `NOTE_RENDER_TEMPLATE_VERSION` を上げる。
- ランキング画像は note専用テンプレート(`apps/remotion/src/features/ranking-note/`)。色は値でなく順位で決める(外れ値1県で他が同色になるため)。ranking-x共有部品は変えず、RankingBoxplotにopt-in propだけ足した。
- 「画像はGoogle Drive」は採らなかった。重さの主因が再生成可能PNGで、R2 outbox(sync-note-r2)とDBレス方針もあるため。

**Why:** git pack 527MBの主因が再生成可能な派生PNGだったため。**How to apply:** docs/31 に画像を足すときはSVGか render-spec を再生成元にし、PNGを追跡しない。

**罠1:** catalogの `r2Body` 既定は true で、登録しただけで「R2にあり」になる。a-* 65本が実際は R2 に無かった(2026-08-29登録分)。`r2Body:false` に直し index 再生成済み。develop push で `sync-note-r2` が走り docs/31 から git rm される(backlog `NOTE-R2-SYNC-VERIFY-01`)。
**罠2:** `git stash` は index の削除(`git rm --cached`)を pop で元に戻さない。stash pop 後に PNG 580枚が追跡に戻った。追跡解除中の作業では stash を使わない(使ったら audit で再確認)。

関連 [[project_note_update_mode_learnings]]。

**2026-09-30 追記:** 生成AI画像は「作り直せない入力」なので二層保管(Drive 候補 / R2 承認版 / git は SHA・モデル・指示文)。note は `ingest-note-background.mjs`、Kindle は `stash-cover-candidate.mts`。画像の生成口は1つ: note 4枚は `render-ranking-images.mjs` だけ(pipeline:sns の note 出力は廃止)。公開入口は `ensure-note-images.mjs` が PNG を揃え、カバー無し公開を止める。SVG は git に置く(正本・約1.5MB・koumuin 268枚は手作り)。Kindle 元画像12冊は Drive `Kindle表紙/<id>/candidates/` に移設済み。レンダーは bit 単位で決定的(同一 SHA を実測)。
