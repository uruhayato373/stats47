---
name: feedback_home_pure_ssg_r2_empty
description: トップ / は純SSGでビルド時R2読めず<FeaturedRankings>が空焼き込み→「注目のランキング」消失。修正は force-dynamic (revalidate は本OpenNext構成で無効=prerendered は再デプロイまで配信され時間ISR再生成しない)。build env に R2_PUBLIC_FETCH_URL は足さない(generateStaticParams ~1800件爆発)
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 96d67153-2c60-4061-8ae4-415efdbdfaab
---

2026-06-14、本番トップ https://stats47.jp/ から「注目のランキング」セクションが消え、トップ上の
「ランキング」導線が `/themes` だけになる回帰が発生。原因と対策:

**根本原因**: トップ `apps/web/src/app/page.tsx` は **純 SSG**(`revalidate`/`dynamic` 無し →
`x-nextjs-stale-time` 実質無限)で、ビルド時の描画が永続的に焼き込まれる。その `<FeaturedRankings>`
(注目のランキング)と `listLatestArticles`(最新記事)は R2 `app/home/featured.json` 等を読むが、
**本番ビルド環境では R2 が一切読めない**:
- `detectEnvironment()` (`packages/r2-storage/src/lib/utils/detect-environment.ts`) は
  `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_S3_ENDPOINT` を要求するが、`deploy-workers.yml` の
  Build step は **`CLOUDFLARE_R2_*` という別名**で渡し、かつ `R2_PUBLIC_FETCH_URL` 未設定 →
  `hasS3Credentials:false` → `fetchFromR2` が throw。
- ビルドログ実測: `home/featured.json が R2 に存在しません` / `{"hasS3Credentials":false,"isCloudflareWorkers":false}`。
  `app/blog/all.json` と `generate-search-index.ts` の ranking item 読みも同じ理由で全 fail している。
- 結果 `FeaturedRankings` が `items.length===0 → return null` で空セクションを静的 HTML に焼き込み。

**なぜ /ranking/[key] や /category は無事か**: `/ranking/[key]` は `revalidate=86400` の ISR、
`/category` は dynamic。ランタイム(Cloudflare Workers)では R2 **バインディング**が効くので実データで描画される。
トップだけが「純 SSG で R2 を読む」唯一のページだったため恒久的に空になった。

**Why**: ビルド時 R2 read 不能 + 純 SSG の組合せは、データ依存セクションを恒久的に空焼きする。
SSR が 200 を返すためブラウザでのみ「消えた」ように見え、気づきにくい。

**How to apply (★実機で確定した結論)**:
- R2 を読む top-level ページを純 SSG にしない。だが **`revalidate` では直らなかった** (#477 失敗): 本
  OpenNext/Cloudflare 構成では **prerendered ページ (`○ /`) は再デプロイまで配信され続け、時間ベース ISR
  再生成が効かない** (`x-nextjs-stale-time` が無限・配信 HTML が空のまま byte 一致を実機確認)。`/ranking/[key]`
  が runtime で実データを出すのは `revalidate` のおかげではなく **`generateStaticParams` が `[]` で prerender
  されず on-demand 描画される**から。
- **正解は `export const dynamic = "force-dynamic"`** (2026-06-14 hotfix #478 = commit `830b14de`、PR
  `hotfix/home-force-dynamic`)。ビルド prerender を止め、毎リクエスト Workers ランタイムで描画 → R2 バインディングで
  featured.json / values / 記事を取得 → 8 カード + tile map で復活 (bare URL + Googlebot 実機確認済)。
  コスト: トップが毎回 Worker 描画になるが当サイト規模では些少 (R2 read は cheap)。`cache-control: s-maxage=86400`
  は付くため Cloudflare edge では 24h キャッシュされる。
- **build env に `R2_PUBLIC_FETCH_URL` をグローバルに足してビルド時 R2 read を直す案は不採用**:
  `/ranking/[key]` の `generateStaticParams`(`readActiveRankingKeysFromR2` → `app/ranking-items/all.json` は
  公開URLで 200)が ~1,800 件返し、ビルドが全 ranking 事前生成で激重化する。ランタイム ISR で局所解決する。
- 別の latent issue: 上記 env 名不一致で search-index / blog/all.json のビルド時生成も壊れている。
  直すなら detectEnvironment の参照名修正 or `R2_PUBLIC_FETCH_URL` を**該当スクリプト限定**で渡す等、
  generateStaticParams を巻き込まない形で。機能バックログ候補。

関連: [[feedback_nextjs_ssg_cookies]] (SSG を壊す別経路=cookies/headers) / [[project_r2_writes_ci_only]] /
[[project_ranking_publish_pipeline_gap]] / [[feedback_shared_working_copy_git_race]] (本対応中 develop が別 worktree 専有で sync 保留)。

## 2026-08-27 追記: search index は script 限定 R2 read + aggregate snapshot

上記 latent issue の search index は解消済み。`generate-search-index.ts` がランキングごとの
`app/ranking/<key>/item.json` を約2,164回取得していたため、CIで公開R2読込を有効にしても15分制限へ
近づいていた。次の2点を正典とする。

- CIでS3資格情報が無い場合だけ、**search-index prebuild の子processに限定して**
  `R2_PUBLIC_FETCH_URL=https://storage.stats47.jp` を渡す。親process / Next buildへは漏らさず、
  `generateStaticParams` のランキング全件事前生成を再発させない。ローカル実行のfallbackも増やさない。
- ランキングはper-key HTTPではなく、1回の `app/ranking-items/all.json` 読込からactive prefecture itemを
  決定的に抽出する。snapshotの`count !== items.length`はfail-closedにする。

本番deploy run `33009537590` で、ランキング2,167件・ブログ434件・合計2,601件を約7秒で生成し、
`search-index.json` / `search-index-meta.json`のupload、本番16ルート、sitemap 11 shardがgreenになった。
