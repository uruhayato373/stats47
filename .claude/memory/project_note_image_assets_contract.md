---
name: project-note-image-assets-contract
description: note原稿(docs/31)の画像資産契約。画像はgit非追跡でSVGまたはchart-data.json+render-spec.jsonから再生成、catalogのr2Body既定trueは実在を保証しない
metadata:
  type: project
---

2026-09-29 に `docs/31_note記事原稿/` の画像・データ管理を整理した。正典は `.claude/rules/note-image-assets.md`、検査は `npm run note:images:audit`(pre-commit・PR・quality-gates `note-image-assets`・週次 `note-circulation-audit-weekly`、週次は `--verify-r2` 付き)。

- 追跡PNG 682枚→104枚(product-salesのみ)。SVG由来(家計・koumuin)は `npm run note:images:regen -- --slug <dir>`、ランキング記事(a-<key> 15本)は `node .claude/scripts/note/render-ranking-images.mjs <key>` で作り直す。後者は `chart-data.json`(unit追加済み)+`render-spec.json`(SHA・テンプレート版)が根拠。テンプレートを変えたら `note-render-spec.mjs` の `NOTE_RENDER_TEMPLATE_VERSION` を上げる。
- ランキング画像は note専用テンプレート(`apps/remotion/src/features/ranking-note/`)。色は値でなく順位で決める(外れ値1県で他が同色になるため)。ranking-x共有部品は変えず、RankingBoxplotにopt-in propだけ足した。
- 「画像はGoogle Drive」は採らなかった。重さの主因が再生成可能PNGで、R2 outbox(sync-note-r2)とDBレス方針もあるため。

**Why:** git pack 527MBの主因が再生成可能な派生PNGだったため。**How to apply:** docs/31 に画像を足すときはSVGか render-spec を再生成元にし、PNGを追跡しない。

**罠1:** catalogの `r2Body` 既定は true で、登録しただけで「R2にあり」になる。a-* 65本が実際は R2 に無かった(2026-08-29登録分)。`r2Body:false` に直し index 再生成済み。develop push で `sync-note-r2` が走り docs/31 から git rm される(backlog `NOTE-R2-SYNC-VERIFY-01`)。
**罠2:** `git stash` は index の削除(`git rm --cached`)を pop で元に戻さない。stash pop 後に PNG 580枚が追跡に戻った。追跡解除中の作業では stash を使わない(使ったら audit で再確認)。

関連 [[project_note_update_mode_learnings]]。

**2026-09-30 追記:** 生成AI画像は「作り直せない入力」なので二層保管(Drive 候補 / R2 承認版 / git は SHA・モデル・指示文)。note は `ingest-note-background.mjs`、Kindle は `stash-cover-candidate.mts`。画像の生成口は1つ: note 4枚は `render-ranking-images.mjs` だけ(pipeline:sns の note 出力は廃止)。公開入口は `ensure-note-images.mjs` が PNG を揃え、カバー無し公開を止める。SVG は git に置く(正本・約1.5MB・koumuin 268枚は手作り)。Kindle 元画像12冊は Drive `Kindle表紙/<id>/candidates/` に移設済み。レンダーは bit 単位で決定的(同一 SHA を実測)。

