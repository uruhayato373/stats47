---
name: project_env_local_ci_consolidation
description: .env.local の秘匿値を CI 専任に寄せて削減 (2026-05-29)。IG トークンは CI 自動更新へ移行中、最終削除は PR
metadata: 
  node_type: memory
  type: project
  originSessionId: 5bf3159d-935d-444d-991d-c99ef203491f
---

2026-05-29、`.env.local` から「CI で実行している/秘匿不要」な値を削除し、ローカル平文を最小化した。

## 削除済み (`.env.local` から)
- AdSense 4: `GOOGLE_ADSENSE_{CLIENT_ID,CLIENT_SECRET,ACCOUNT_ID,REFRESH_TOKEN}` — CI(fetch-metrics-weekly)が取得。正本=GitHub Secrets
- PSI 1: `PSI_API_KEY` — CI(psi-audit-daily)。正本=GitHub Secrets
- META 3: `META_APP_ID/APP_SECRET/PAGE_ACCESS_TOKEN` — 投稿経路で未使用(break-glass削除ユーティリティ専用)。Metaダッシュボードで再取得可
- GA 1: `NEXT_PUBLIC_GA_MEASUREMENT_ID` — 公開ID(秘匿不要)。本番はCloudflare PagesがGitHub Secretから取得。ローカルはGA無効化でPV混入も防げる

各削除箇所には値なしのポインタコメント(正本・再取得方法)を残置。

## GSC/GA4 は元々 `.env.local` 不使用
サービスアカウントで認証: ローカル=リポジトリroot `stats47-f6b5dae19196.json` / CI=Secret `GOOGLE_SERVICE_ACCOUNT_KEY_JSON`。GA4 property ID はコードにハードコード(463218070)。

## YouTube 自動運用は完全撤退 (2026-05-29) → GOOGLE_OAUTH_* 削除
shadowban (SUGGESTED_VIDEO=0) + 低 ROI (32 subs / 81本 / ~7 views/日) + 戦略上 IG 集中のため YouTube から完全撤退を決定。
- `.env.local` から `GOOGLE_OAUTH_{CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN}` 削除
- 撤去 (**PR #376 → develop マージ済 2026-05-29**, 64 ファイル削除): CI 3 (`youtube-audit-daily` / `youtube-weekly-review` / `oauth-token-health-check`) + `.claude/scripts/youtube/*` (12) + `check-youtube-duplicate.cjs` + skills 8 (post-youtube / publish-youtube-normal / plan-youtube-normal / fetch-youtube-data / analyze-youtube / diagnose-youtube-shadowban / record-youtube-experiment / recover-youtube-shadowban)

> **2026-08-23 update**: チャネル方針は通常動画3本・6週間の限定 pilot (EXP-006) へ変更したが、
> OAuth / upload script / CI は復活させない。pilot は YouTube Studio の手動投稿・手動計測で行う。
- `sns-metrics-weekly.yml` は IG のみに外科的縮小 (YT step + Compose .env.local step 削除)
- 動画制作 (Remotion / bar-chart-race / render-sns-stills) は維持 → IG/TikTok/note 配信は継続可
- ※ AdSense は別クライアント `GOOGLE_ADSENSE_*` で本件と無関係 (.env.local の "共通" コメントは古かった)

## Instagram トークンを CI 自動更新へ移行 (進行中)
- IGAA長期トークン(約60日失効)の更新は従来「ローカル refresh-token.cjs → 手動 gh secret set」だった
- 新設: `.github/workflows/instagram-token-refresh.yml` + `.claude/scripts/instagram/refresh-token-ci.cjs` (毎週水03:00 JST、ig_refresh_token で延長 → `gh secret set INSTAGRAM_ACCESS_TOKEN`)
- 必要な `GH_SECRETS_PAT` (fine-grained PAT, Secrets:Read&Write, repo=stats47) は 2026-05-29 登録済
- **commit 97b012f7 は develop に push 済、release PR #375 (develop→main) に含まれる**

## PENDING — YouTube 撤退 (2026-05-29)
- **Phase 2 (Secrets)**: YT 撤去が main に反映された後、GitHub Secrets の `GOOGLE_OAUTH_{CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN}` を削除 (先に消すと main 残存 workflow が誤アラート起票するため順序厳守)
- **Phase 3 (手動・ユーザーのみ)**: YouTube チャンネル削除/放棄 (YouTube Studio, **不可逆**) + 任意で Google Cloud OAuth クライアント無効化
- YouTube の運用資料は削除済み。撤退方針の現行正典は `.claude/rules/sns-content-standards.md`、当時の資料は Git 履歴で参照する

## R2 S3 を `.env.local` から削除済 (2026-05-29)
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_S3_ENDPOINT` を削除 → ポインタコメント残置。
- 旧ローカル値は 401 失効済で元々機能していなかった ([[project_r2_s3_token_expired_2026_05_29]])。
- 正本(有効値)は GitHub Secrets `CLOUDFLARE_R2_ACCESS_KEY_ID` / `CLOUDFLARE_R2_SECRET_ACCESS_KEY` (05-29 更新)。cloud/CI はこれを使う。
- R2 書込は CI 専任化済のため、ローカルから直接 R2 を叩く必要は通常ない (必要時は Cloudflare で S3 トークン再発行)。

## Instagram も `.env.local` から削除済 (2026-05-29) — 完了
- `GH_SECRETS_PAT` の Secrets 書込権限が当初不足し `instagram-token-refresh.yml` の「Update GitHub Secret」step が **HTTP 403** で失敗していた (run 26635484087)。ユーザーが PAT に repo `stats47` の **Secrets = Read and write** を付与して解消。
- 再 run 26635785165 で全 step 成功 + `INSTAGRAM_ACCESS_TOKEN` secret 更新時刻が 2026-05-24 → **2026-05-29T11:54:50Z** に変化 = CI 自動更新が end-to-end で稼働確認済。
- `INSTAGRAM_ACCESS_TOKEN` / `INSTAGRAM_BUSINESS_ACCOUNT_ID` を `.env.local` から削除 (ポインタコメント残置)。IG の取得・予約投稿はすべて CI 一本化。
- これで `.env.local` の秘匿削減は一巡 (META/AdSense/PSI/GA/YouTube/R2/Instagram 完了)。残る秘匿値は CLOUDFLARE_API_TOKEN/ACCOUNT_ID/ZONE_ID + RAKUTEN_APP_ID + e-Stat ID で、いずれもローカル dev/build/wrangler/purge-cdn に必要。

## cloud-first 再設計 (2026-05-29) — .env.local を秘匿のみに縮小
ユーザー指摘「D1 は廃止では? 公開値は本当に必要か?」を受けて再設計。**本番は wrangler.toml [env.production.vars] が公開値 SSOT で .env.local に非依存**と判明 (BASE_URL/ESTAT_APP_ID/R2_PUBLIC_URL/ADSENSE 等が toml にある)。欠けていたのは「ローカル dev 用のコミット済みデフォルト」だけだった。
- **新設 `apps/web/.env.development` (コミット, git tracked)**: 公開 NEXT_PUBLIC 5値 (BASE_URL=localhost / ESTAT_APP_ID / R2_PUBLIC_URL / RAKUTEN_AFFILIATE_ID / ADSENSE_CLIENT_ID)。Next が **dev 時のみ**自動ロード、本番 `next build` は NODE_ENV=production で読まない → prod リスクゼロ。これで `.env.local` 無しの cloud/新規 checkout でも `npm run dev` が動く。
- `.gitignore`: `.env*` に `!apps/web/.env.development` の negation 追加 (検証済: tracked 可能 / .env.local は ignore 継続)。
- `apps/web/scripts/validate-env.ts`: `.env.local` に加え `.env.development` も load (非CI時)。CI 挙動は不変 (両方スキップ→Secrets 依存)。ローカル実行で検証成功。
- `.env.local` から削除: 公開5値 + ADSENSE_ENABLED(冗長) + CLOUDFLARE_ZONE_ID + RAKUTEN_APP_ID。
- **最終的に CLOUDFLARE_API_TOKEN / ACCOUNT_ID / R2_BUCKET_NAME の3つも削除し、`.env.local` ファイル自体を削除 (存在しない)**。dotenv は path 不在で silent no-op なので問題なし。これでローカルは「`.env.local` 無しの cloud checkout」と完全一致 (validate-env は `.env.development` だけで通過、確認済)。根拠 (実測): アプリ実行時 (apps/web/src) はこの3つを0箇所しか読まない。`CLOUDFLARE_R2_BUCKET_NAME` はコードに `|| "stats47"` default (fetch/list/delete.ts)。残る消費者は全て CI 化済 (purge-cdn / cloudflare-usage-daily / warm-cache=deploy-workers post-deploy) / D1廃止で死 (drizzle.config) / dbレス移行中 (sync-known-keys) / 任意で graceful (Remotion Workers AI `ai-image.ts`、未設定ガードあり)。`validate-env` は `.env.development` だけで通過 = cloud と同条件。ローカルで Cloudflare API スクリプトを直接叩く時だけ API_TOKEN/ACCOUNT_ID を一時的に戻す (正本=GitHub Secrets)。
- **CDN purge を CI 化**: 新設 `.github/workflows/purge-cdn.yml` (`gh workflow run purge-cdn.yml [-f prefix=...]`)。`CLOUDFLARE_ZONE_ID` を GitHub Secrets に登録。purge-cache.ts をそのまま呼ぶ。
- `RAKUTEN_APP_ID` を GitHub Secrets に登録 (本番 runtime は wrangler secret、toml には無い)。
- env.local.example 冒頭に新モデル注記。
- **未コミット**: 上記 committed ファイル変更 (`.env.development` / `.gitignore` / `validate-env.ts` / `purge-cdn.yml` / `env.local.example`) は feature ブランチ → develop → PR → main 経由でコミット要 (cloud で効くのは merge 後)。`.env.local` は git 管理外。

## 残リスク (次セッションへの引き継ぎ)
- `GH_SECRETS_PAT` 自体に期限あり=切れると `instagram-token-refresh.yml` が停止 → IG トークン (約60日) が失効。PAT 期限前のリマインダー検討 (期限日は要確認)。これが切れると IG が完全停止する単一障害点。
- **cloud 開発で未カバー**: `RAKUTEN_APP_ID` / `CLOUDFLARE_ZONE_ID` は GitHub Secrets に無い。cloud agent で affiliate API / `/purge-cdn` を回すなら `gh secret set` で追加が必要 (やる予定が無ければ放置可)。

関連: [[project_instagram_graph_api_setup]] / [[feedback_note_publish_automation]]
