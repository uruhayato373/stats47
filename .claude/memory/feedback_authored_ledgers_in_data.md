---
name: feedback_authored_ledgers_in_data
description: 人と agent が判断して書く台帳は data/ か config/ に JSON+Schema で置き datasets.mjs に登録する。packages/ に置くと置き場検査と担当の視界から外れる (2026-10-13 教材の企画 376 件)
metadata:
  type: feedback
---

教材 (参考文献) の分析企画 376 件 (note 企画 162 件) が `packages/data-configs/src/evidence-inventory/` にあり、置き場の台帳 `config/datasets.mjs` に載らず、
note-manager も参照していなかった。展開カード `KAKEI-MARKETING-CONTENT-01` は 9/14 に完了記録なしで消え、企画は誰にも引き渡されないまま残った。
オーナーに「note 記事が 200 以上あったはず」と聞かれて、私は記事台帳と data/ だけを探して見つけられず、別の数え方でカードを起票した。

**Why:** packages/ は check-datasets の範囲外で、Schema も担当の手順書も付かない。台帳が 2 か所 (data/source-inventory の生成物と packages の正本) に分かれ、名前も違った。

**How to apply:**
- 人や agent が判断して書く台帳は `data/<取得元>/` か `config/` に JSON + JSON Schema で置き、`config/datasets.mjs` に行を足す。packages は読み込み・型・関数だけ (テーマのカタログ・記事台帳・教材の企画が前例)。
- 「〜がたくさんあったはず」と聞かれたら、記事台帳だけでなく `config/datasets.mjs` の全行と `packages/*/src` の JSON も探してから答える。
- 展開先を持つ企画は、展開先の台帳から ID で結ぶ (note は `data/note/articles.json` の `sourceAnalyses`)。進み具合は `npm run note:article -- sources`。

関連 [[project_note_article_ledger]] [[project_kakei_marketing_book_pipeline]]。
