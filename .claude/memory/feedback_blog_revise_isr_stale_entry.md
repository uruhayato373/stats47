---
name: feedback_blog_revise_isr_stale_entry
description: 既存ブログの改稿版を公開しても、公開前に開かれたページは ISR の古い描画が次の本番デプロイまで残る。公開前の本番ページを検証で取得しない (2026-11-13)
metadata:
  type: feedback
---

**事象 (2026-11-13)**: 家計調査の改稿 96 本を `blog-auto-publish.yml` で公開した。R2 の本文は全件が新しい版になったが、
本番ページは 2 種類に分かれた。

- 直近の本番デプロイ (同日 12:24Z) 以降にまだ誰も開いていないページ: 公開後の最初のアクセスで R2 から描画され、新しい版が出る (`x-nextjs-cache: MISS`)。
- 公開より前に一度でも開かれたページ: その時点の古い描画が ISR キャッシュに残り、`x-nextjs-cache: STALE` のまま旧版を返し続ける。
  5 分以上あけて取り直しても、`?check=N` でエッジを迂回しても変わらなかった。`apps/web/open-next.config.ts` に再生成の queue が無い。

38 本を公開した時点で 7 本が後者だった。さらに、切り分けの途中で**未公開のページを `curl` で取得したため、5 本に古い描画のエントリを自分で作った**
(1 回目 `MISS`、2 回目 `STALE`)。

**Why**: ISR のエントリは最初のアクセスで作られ、この構成では作り直されない。消す道具 `packages/r2-storage/src/scripts/purge-isr-routes.ts` は
R2 への書き込みが要り (CI 専任)、どの workflow にも配線されていない。反映の手段は次の本番デプロイ (オーナーの判断) になる。

**How to apply**:
- 改稿版を公開する前に、対象の本番ページ (`https://stats47.jp/blog/<slug>`) を `curl`・ブラウザ・検証スクリプトで取得しない。クエリを付けても同じエントリができる。
- 公開後の確認は R2 の本文 (`storage.stats47.jp/app/blog/<slug>/article.md`) の一致を正とし、本番ページは「HTTP 200」「h1 と本文の断片が新版か」を分けて報告する。
  旧版のままのページは `x-nextjs-cache: STALE` を証拠に「次のデプロイで反映」と書く。「公開した = 本番に出た」と言わない。
- 公開の検出は先頭コミット 1 つの差分 (`git diff HEAD~1 HEAD`) で、空のときだけ送り箱の総ざらいになる。複数コミットをまとめて push するときは
  先頭を merge コミットにすると総ざらいになり、取りこぼさない。

関連: [[feedback_bulk_blog_publish_isr_404]] [[project_blog_auto_publish_reconcile_limits]] [[project_blog_mass_rewrite_lessons]]
