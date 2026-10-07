---
slug: cc-estat-20-publish
reviewer: blog-critic
mode: delta
verdict: PASS
date: 2026-10-07
---
## 評価サマリ
前回 (REVISE) の BLOCK 1 件・MAJOR 4 件・MINOR 8 件は、タグの 1 件 (依頼により対象外) を除いてすべて本文で解消されていました。最も重い og:image の誤りは、記事のコードを Next.js 15.5.27・OpenNext 1.20.9・wrangler 4.148.0・TypeScript 5.9.3 で組み直したビルドで、`https://example.com/charts/population-bar/opengraph-image?0dd78284c18974fe` になることを確かめました。導入手順と版、フォントの作り方、最初の `data.json` と `--remote` の書き込み、`deploy.yml` の `workflow_run` と `workflow_dispatch` も、本文のとおりに動かして、または公式ページと Part 18・Part 19 の公開本文と照らして一致しました。図の値・順位・年・倍率 (27.2 倍) は前回から変わらず `data/total-population-ranking.json` と一致します。手順解説として、読者が写して動かせる水準に達しています。残るのは、導入の前提 (Next.js の版)・Worker サイズの確認コマンド・フォントの置き場の 3 点で、いずれも MINOR です。

## 指摘
- [MINOR][型:code] Step 1 の `npm install @opennextjs/cloudflare@latest` は、すでにある Next.js が 15.5.27 より古いと止まります。`@opennextjs/cloudflare@1.20.9` の peerDependencies は next `>=15.5.27 <16 || >=16.3.8` で、`package.json` に `"next": "15.5.24"` を置いた作業用アプリで同じコマンドを実行したところ、`ERESOLVE unable to resolve dependency tree` で失敗しました (stats47 自身の `apps/web` は 15.5.24 です)。本文は peerDependencies の範囲を「動作確認した版」の箇条書きに書いていますが、古いときにどうするかは書いていません。Step 1 の導入コマンドの前に「Next.js が 15.5.27 より古いときは、先に `npm install next@15` で上げます」の一文を足してください。
- [MINOR][型:code] 「Worker のサイズ」の確認方法が実際の出力と合いません。本文は「Step 5 の `opennextjs-cloudflare build` を実行して確かめてください」と書いていますが、`opennextjs-cloudflare build` の出力にはサイズの行がありません (作業用アプリで確認)。サイズは wrangler が出すもので、`npx wrangler deploy --dry-run` を実行すると `Total Upload: 6480.56 KiB / gzip: 1618.45 KiB` と出ました (認証なしで実行できます)。OpenNext「Overview」が言う制限の対象は、この gzip 側の値です。「`opennextjs-cloudflare build` のあとに `npx wrangler deploy --dry-run` を実行し、`Total Upload` の行の gzip の値を無料プランなら 3 MiB、有料プランなら 10 MiB と比べます」と書き直してください。
- [MINOR][型:code] Step 3 のフォントの案内に 2 点、足りない記述があります。1 つ目は置き場です。元の約 4.6 MB のフォントは「リポジトリの外に置きます」と書いてある一方で、作ったサブセット `assets/NotoSansJP-Bold-subset.otf` (本文の測定で 111,308〜180,188 バイト) を git に入れることは書かれていません。ファイルが無いと `next build` が止まるので、GitHub Actions で `npm run deploy` を実行する前提では、サブセットをコミットする必要があります。「サブセットは小さいのでリポジトリに入れます」の一言を足してください。2 つ目は参照です。「作り方は次の節に書きました」とありますが、作り方は同じ Step 3 の直後の段落にあり、次の節 (Step 4) ではありません。「このあとの手順に書きました」に直してください。

## 判定理由
`node .claude/scripts/blog/quality-gate.mjs docs/21_ブログ記事原稿/cc-estat-20-publish/article.md` (この review.md を書く前に実行) の blocker は「critic レビュー未通過」の 1 件だけでした。表 0・である調 0・括弧内数値 0・統計表 ID の問題 0・壊れた内部リンク 0 (内部リンク 22 本、ユニーク 21 本)・callout 2 個で連続 0・SVG の欠落と系譜の欠落 0・warnings 0 で、機械の床は通っています。この review.md を PASS で書いたあとに同じコマンドを再実行すると、`pass: true`・blockers 0・warnings 0・criticReviewed true になりました。

前回の指摘 1 件ずつの確認結果です。
- BLOCK (og:image が localhost を指す): 解消。Step 3 に `metadataBase` の解説と `layout.tsx` のコードが入り、Step 6 の完成形にも同じ記述があります。記事の `layout.tsx` を使ったビルドで、`.next/server/app/charts/population-bar.html` の og:image が `https://example.com/...` になりました。初回デプロイ前の確認項目にも、同じ `grep` と「`localhost` が見えたら `metadataBase` が効いていません」が入っています。Next.js「generateMetadata」の「`metadataBase` is typically set in root `app/layout.js`」(2026-08-19 更新) も取得して一致しました。
- MAJOR (導入手順と動作確認版): 解消。Step 1 に導入コマンドと版が入り、`npm view` の結果 (next@15 の最新 15.5.27、@opennextjs/cloudflare 1.20.9 と peerDependencies、wrangler 4.148.0、TypeScript 5.x の最新 5.9.3) と本文の数値が一致しました。TypeScript 7.0.2 で `next build` が `Failed to load next.config.ts` (`Cannot read properties of undefined (reading 'fileExists')`) で止まることも、5.9.3 に戻すと通ることも再現しました。`remote = true` が使えるのが wrangler 4.36.0 以降という記述は、OpenNext「Bindings」の本文と一致しました。
- MAJOR (フォント): 解消。noto-cjk の `Sans/SubsetOTF/JP/NotoSansJP-Bold.otf` は 200 で取得でき (4,656,448 バイト)、`Sans/README.md` の SubsetOTF の案内と `Sans/LICENSE` の SIL Open Font License 1.1 も確認できました。本文の `og-font-chars.mjs` と `pyftsubset` のコマンドをそのまま実行して `assets/NotoSansJP-Bold-subset.otf` ができ、`next build` で 1200×630 の PNG が生成され、日本語が崩れず描かれました。漢字を入れない場合の 111,308 バイトは完全に一致しました。「漢字 300 字」の場合の 180,188 バイトは、本文の先頭から 300 字を取った私の測定では 180,508 バイトで、字の選び方による差であり、桁は合っています。
- MAJOR (`data.json` の形とキー): 解消。Step 2 が「Part 18 と Part 19 の本文には `charts` も `data.json` も出てきません」と明記し、`ChartData` の形を本記事で決めると書き、最初の `data.json` の例と `wrangler r2 object put ... --remote` を足しています。Part 18・Part 19 の公開本文 (2026-10-07 取得) に `charts/`・`data.json`・`chartType` が無いこと、Part 18 の `wrangler r2 object put` の例に `--remote` が無いこと、`binding = "R2"`・`bucket_name = "stats47-cache"`・`preview_bucket_name = "stats47-cache-preview"` が Part 18 にあることを確認しました。wrangler 4.148.0 で `--remote` なしの `put` は `Resource location: local` と出てローカルに書くこと、`get --local --pipe` で読めることも再現しました。`preview_bucket_name` を残すと、ローカルの擬似 R2 では `stats47-cache` のデータが読めずページが「見つかりません」(noindex) で焼かれることも、記事の設定で再現しました (Cloudflare Docs「Configuration」の記述も一致)。
- MAJOR (毎週の更新とデプロイのつながり): 解消。`deploy.yml` に `workflow_run` (`workflows: ["Weekly Refresh"]`) と `workflow_dispatch` が入り、更新が成功した週だけ動く `if` があります。YAML は構文として読み込めました。Part 19 の公開本文で `name: Weekly Refresh`・日曜 JST 20:00 (`cron: "0 11 * * 0"`)・`workflow_dispatch` の `stage` 入力・`gh workflow run weekly-refresh.yml -f stage=all`・`actions/checkout` に token 指定なしで `git push` することが、本文の説明と一致しました。GitHub Docs の「`GITHUB_TOKEN` が起こしたイベントは `workflow_dispatch` と `repository_dispatch` などの例外を除き新しい workflow run を作らない」「`workflow_run` はデフォルトブランチにファイルがあるときだけ起動する」「`conclusion` で条件分岐できる」も取得して一致しました。原則 5 とシリーズまとめにも反映されています。
- MINOR (弱点の「6〜8 分×2」): 解消。弱点は無料プランの上限と Worker のサイズの 2 つに差し替わり、Worker のサイズ (圧縮後で無料 3 MiB・有料 10 MiB) は OpenNext「Overview」の本文と一致しました。確認コマンドの誤りは、上の MINOR にしました。
- MINOR (tags の `CloudflarePages`): この依頼で指摘から外す指示があったため、判定に入れていません。連載全体の表記は `.claude/todo/backlog.md` の BLOG-CC-ESTAT-WORKERS-01 (373 行目) に起票済みであることを確認しました。
- MINOR (`archetype: D` と WARNING callout): 解消。frontmatter から `archetype` が消え、Step 3 の WARNING は箇条書き「注意点が 3 つあります」と「デプロイの前に確かめる 3 つ」に移りました。callout は NOTE と TIP の 2 個で、離れています。
- MINOR (Step 4 の見出し): 解消。「robots.ts と sitemap.ts によるインデックス制御」になりました。
- MINOR (`wrangler.toml` と `wrangler.jsonc` の混在): 解消。「本記事は `wrangler.toml` で書いていますが、公式の例は `wrangler.jsonc` です」と添えられました。
- MINOR (常体 1 箇所): 解消。「調べます」になりました。本文の地の文を文単位で走査して、ですます調でない文末が残っていないことも確認しました (チェックリストの「〜か。」の問いかけ形と、Google の定義の引用は対象外です)。
- MINOR (27.2 倍とクリックの根拠、「最大の利点」): 解消。GSC の記述は消え、「App Router の利点の一つ」に弱まりました。
- MINOR (SNS のクローラーと Disallow): 解消。公開後に SNS で確かめる項目に変わり、Meta の公式ページの「FacebookExternalHit は、セキュリティや整合性の確認のとき robots.txt を無視することがある」(2026-10-07 取得) が本文の引用と一致しました。X の公式ページは取得できなかったと本文に明記されています。

BLOCK と MAJOR は 0 件で、読者が手順を写して動かせるために直す必要のある点は残っていません。残る MINOR 3 件は、公開後でも直せる記述の補足です。そのため verdict は PASS とします。

確かめていないことは次のとおりです。`remote = true` でビルド中に本物の R2 を読む経路、GitHub Actions 上での `deploy.yml` と `workflow_run` の実行 (`actionlint` の実行も含む)、カスタムドメイン、API トークンに R2 の読み書き権限が含まれるかは、実行していません。いずれも本文が「確かめていない」と明記している範囲です。なお、この再審の作業中に、環境変数に Cloudflare の API トークンが設定されていることに気づかないまま、記事の手順にある `wrangler r2 object put ... --remote` を 1 回実行しました。結果は 403 (Authentication error) で、書き込みは行われていません (wrangler のログで確認)。以降の wrangler の実行では、このトークンの環境変数を外して行いました。
