---
name: feedback_generatestaticparams_r2_notfound_stuck
description: R2依存の動的routeに generateStaticParams を付けると ● SSG 化→build時R2不可で notFound が永久固着。撤去して ƒ オンデマンドISR化が正解
metadata: 
  node_type: memory
  type: feedback
  originSessionId: dd984b85-3da3-487f-8187-c5fbd2088407
---

R2 snapshot を読んで描画する動的 route に **`generateStaticParams` を付けてはならない**。付けると
`● SSG` 化され、**`next build` 時点では R2 を読めない**(Worker binding なし・build env に S3 creds /
公開URL 無し) ため、ページ描画の R2 read が `ok(null)` に落ちて **notFound として prerender** される。
この OpenNext 構成では **ISR 再生成が効かない**(`x-nextjs-stale-time: 4294967294`=実質無限) ため、
notFound prerender が再デプロイまで配信され続ける。

**Why**: 2026-06-22、本番で `/ranking/*` 全件「ランキングが見つかりません」・`/areas/[areaCode]`
「地域の特徴が見つかりません」・`/areas/*/cities/*`「市区町村が見つかりません」が永久配信される障害。
原因は3 route が `generateStaticParams`(KNOWN_RANKING_KEYS / 47県 / PHASE_1_SSG_CITIES) を返し ● SSG 化
していたこと。`readRankingItemFromR2` は build 時 `ok(null)` を返す設計で notFound prerender になる。
ランタイムの R2 binding 自体は正常(home/category/areas-[themeSlug] は稼働中)。

**How to apply**:
- R2 を読む動的 route は **generateStaticParams を付けず `revalidate` だけ** → `ƒ`(オンデマンドISR)。
  ランタイムに R2 を読んで初回描画→ISRキャッシュ。category / areas/[areaCode]/[themeSlug] と同方式(稼働実績)。
- 例外: blog/[slug]・survey/[surveyKey] は generateStaticParams 持ちだが build 時に R2 を読んで GOOD な
  内容を prerender できる(build ガード無し)ため ● SSG のままで正常。「build 時に実データを読めるか」で判定。
- 診断: レスポンスヘッダ `x-nextjs-prerender:1` + `x-nextjs-cache:STALE` + `x-nextjs-stale-time:4294967294`
  が notFound 固着のサイン。`curl -A Googlebot <url> | grep '<title>'` で「〜が見つかりません」を確認。
- 修正は本番デプロイが必須(build 産物の問題)。デプロイ後 stale-while-revalidate で 1-2 リクエストで自己回復。
- 検証時の注意: city ルートは政令指定都市のみ(`/areas/14000/cities/14130` 川崎市)。特別区(13101 千代田区,
  parent=13100)は対象外で notFound が正常。non-existent key の notFound も正常(R2 item.json が 404 か確認)。

正典: `.claude/rules/nextjs-ssg-preservation.md` §generateStaticParams 固着。修正 commit `52d2910a` (PR #504)。
関連: [[feedback_cloudflare_workers_env_r2_skip]] [[feedback_home_pure_ssg_r2_empty]] [[feedback_nextjs_ssg_cookies]]
