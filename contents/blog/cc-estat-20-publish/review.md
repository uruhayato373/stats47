---
slug: cc-estat-20-publish
reviewer: blog-critic
mode: delta
verdict: PASS
articleSha256: 05882ef119fb71a402e098360ccd8e734ff91648e8ca7c8f00445b2172b2dfb2
date: 2026-11-14
---
## 評価サマリ

前回 (2026-11-14、verdict: REVISE) の BLOCK 1 件と MAJOR 1 件が、どちらも本文で解消されていることを確かめました。再審査は delta モードで、前回の指摘の検証と、変更箇所に限った回帰の確認だけを行っています。

Part 19 の現在の本文は、本番ページ (`https://stats47.jp/blog/cc-estat-19-skill-pipeline`) を取得して確かめました。Part 19 の `CLOUDFLARE_API_TOKEN` は Cache Purge と Workers R2 Storage の編集だけを持つトークンで、同じ箇所に「最終回の Part 20 ではデプロイ用に別のトークンを作るので、用途ごとに分けます」とあります。Part 20 の deploy.yml は `CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_DEPLOY_TOKEN }}` と別名の secret を渡す形になり、第 620 行が別名で保存する理由 (同名で上書きすると Part 19 の毎週の更新が権限不足で止まる) と、wrangler が環境変数名 `CLOUDFLARE_API_TOKEN` を読むため環境変数側は変えないことを説明しています。連載どおりに進めても Part 19 のパイプラインは壊れません。

## 指摘

前回の指摘の検証結果です。
- [解消][型:code] BLOCK (secret 名の衝突)。deploy.yml の env と第 620 行の説明が Part 19 の本文と整合しました。第 337 行の `wrangler r2 object put` の認証も「Part 19 で作った R2 用のもの」と書き直されています。
- [解消][型:code] MAJOR (`ChartRenderer` の省略)。第 217〜240 行に `chartType: "bar"` だけを描く最小版が載り、他のチャートは `chartType` の分岐として足すと第 242 行に書かれています。`data.json` の `values` (`areaName` と `value`) と `ChartData` の型が噛み合い、第 632 行の完了条件に本文だけで到達できます。tsc の型検査まででビルドには含めていないことも明記されており、検証範囲の誇張はありません。
- [解消][型:source] 確認日と更新日。第 49・57 行の Next.js ガイド (2026-11-05 更新)・OpenNext adapter (2026-10-12 更新)・確認日 2026-11-14 は、Cloudflare Docs の現在の表示 (Nov 5, 2026 / Oct 12, 2026) と一致しました。vinext の「ベータ版」も Next.js ガイドの「vinext is in beta」で裏付けを確認しました。
- [解消][型:source] `@cloudflare/next-on-pages` の名指しは削除され (第 450 行)、第 451 行のフォント形式と 500KB に ImageResponse の出典が付きました。
- [解消][型:definition] OpenNext の版は、第 122 行の動作確認 1.20.9 と、第 253 行付近の「執筆時点 (2026-10) で使っていた 1.20.2」で別物と分かります。
- [解消][型:code] `npm run preview` は第 126 行で確認範囲外と明記されました。
- [解消][型:related-link] 連載一覧の表示名 (Part 9「東京と京都のレーダーチャート」・Part 19 の表記) は現在の題に合いました。なお、前回「7 ステップの根拠を確認できない」とした `ai-claude-code-pref-analysis` は、本番の seoTitle・description・見出しに「7 ステップ」があり、前回の指摘が誤りでした。取り下げます。

残る指摘は PASS を妨げない MINOR です。
- [MINOR][型:source] 第 739 行の「1 回の list は最大 1000 件」、第 681 行の `gtag('consent', 'default', ...)` を `config` より前に置く方法、第 452 行の `opengraph-image` の Version History (v16.0.0) には、出典 URL と確認日がありません。前の 2 つは補足的な記述、最後は第 361 行で同じ Next.js ページを引用しているため、読者が追える範囲ですが、各行に URL と確認日を付けると本記事の他の箇所と揃います。
- [MINOR][型:structure] 第 242 行の「この最小版は今回の改稿で足したもので」は、公開後の読者には何の改稿か分かりません。改稿の経緯の部分を削り、「この最小版は、TypeScript の型検査までは確かめましたが、上の `opennextjs-cloudflare build` の確認には含めていません」と検証範囲だけを書く形が自然です。

## 判定理由

前回の BLOCK と MAJOR が解消され、変更箇所が新たな BLOCK を生んだ形跡もありません (Part 19 との secret 名・トークン権限の整合、`ChartRenderer` と `ChartData` の型の整合を確認)。未対応だった出典の MINOR (R2 の 1000 件・gtag consent・Version History) は、断定の根拠を損なうものではなく、料金や上限の誤認につながる記述でもないため、PASS を妨げません。決定的な床 (markdown 表・である調・図あたり字数・factual など) は `quality-gate.mjs` が公開前にフル実行するので、この delta では再読していません。
