---
name: project_r2_s3_token_expired_2026_05_29
description: R2 の S3 API トークン (.env.local) が 2026-05-29 に 401 Unauthorized。cloud R2 読み書きがブロック (現在は R2 書込 CI 専任化で解消済)
metadata: 
  node_type: memory
  type: project
  originSessionId: 64bc205d-d555-4622-b350-019af90ba54b
---

2026-05-29 実機確認: `.env.local` の `R2_ACCESS_KEY_ID`(32桁) / `R2_SECRET_ACCESS_KEY`(64桁) / `R2_S3_ENDPOINT`(`https://<account>.r2.cloudflarestorage.com`、形式は正常) で S3 API を叩くと **HTTP 401 Unauthorized**。形式は正しいので **トークン失効/無効化** が原因。

**影響**: cloud 経由の R2 read/write が不能。公開 URL 経由 (`R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`) の読み取りは影響なし。

**復旧手段**: **Cloudflare で R2 S3 API トークン再発行** → `.env.local` の `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` 更新。ただし R2 書込は CI 専任化済のため、ローカル直叩きは通常不要。

**ブロックされる作業**: 完全DBレス移行 (Phase C エフェメラル化の diff 検証 / Phase D known-ranking-keys 再生成 / Phase E 検証)、`/push-r2` `/pull-r2` の cloud 経路。詳細は [[project_dbless_migration_2026_05_29]] / `docs/01_技術設計/02_データアーキテクチャ.md`（旧移行仕様は Git 履歴）。

**2026-05-29 続報**: 失効した `R2_*` 3 つは `.env.local` から削除した (ポインタコメント残置 [[project_env_local_ci_consolidation]])。有効値は GitHub Secrets `CLOUDFLARE_R2_ACCESS_KEY_ID` / `CLOUDFLARE_R2_SECRET_ACCESS_KEY` (05-29 更新) にあり、cloud/CI はそちらを使う。ローカルで直接 R2 を叩く必要が出たら Cloudflare で S3 トークン再発行 → `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_S3_ENDPOINT` を復活。

cf. Cloudflare **API** token (D1/R2/Pages 管理用) は別系統 [[project_cloudflare_token_consolidated]]。S3 互換トークンはそれとは別に R2 ダッシュボードで発行する。AdSense も同様の失効事例あり [[project_adsense_local_oauth_expired]]。

## 2026-05-30 追記: Cloudflare **API** token (GitHub Secret `CLOUDFLARE_API_TOKEN`) も失効 → 本番デプロイ停止中
- `wrangler whoami` が **Invalid access token [code: 9109]**。GitHub Secret は 2026-05-08 設定のまま無効化。
- 影響: `deploy-workers.yml` の「Verify Cloudflare authentication」step で fail し **本番デプロイ不能** (本日 11:03 の deploy も失敗=マージ前から壊れていた)。`💸 Cloudflare Usage (daily)` も同トークンで失敗。
- **本番サイトは無事** (デプロイは認証段階で停止しビルド前に落ちるため、直前の成功版を配信継続)。
- PR #378 (develop→main, 33 commits: 完全DBレス Phase C/D + env cloud-first + docs/02整理 + YT撤退) は **merge 済 (main 409586d5)** だが **未デプロイ**。
- **復旧**: Cloudflare Dashboard → My Profile → API Tokens で再発行 (Workers Scripts:Edit + Account Read) → `gh secret set CLOUDFLARE_API_TOKEN` → `gh run rerun 26661551159` でデプロイ再実行。R2 S3 トークンと一緒に再発行すると deploy/R2/usage 監視が一括復旧。
- **✅ 解決済 (2026-05-30)**: 新トークン登録 (`CLOUDFLARE_API_TOKEN` 21:06 更新) だけでは「whoami は通るが deploy で `/workers/services` 10000」。原因は **`Workers Scripts: Edit` 権限の欠落** (旧トークンは D1/Pages/R2/Account-Settings 中心で Workers が無かった。本番は Pages でなく **Workers デプロイ** = `wrangler deploy`)。権限追加 (値は不変=Secret 再設定不要) → rerun で **デプロイ成功 (run 26661551159, 6m11s)**、本番 200 確認。**教訓: stats47 トークンには `Workers Scripts: Edit` が必須**。
- 未確認: Zone Cache Purge 権限 (purge-cdn 用) / R2 S3 トークンの有効性 (deploy は API token のみ使用のため未検証)。日次 usage 監視は Account Analytics:Read 次第。

## 2026-06-01 追記: R2 書き込みは CI/クラウド専用に確定 → ローカル S3 トークン再発行は原則不要
オーナー判断で「R2 はローカルから使わない (書込は CI/クラウドのみ)」に方針確定。よって本メモリ冒頭の
「復旧手段=ローカル S3 トークン再発行」は **もはや推奨経路ではない**。R2 反映は GitHub Actions で行う。
詳細・運用は [[project_r2_writes_ci_only]] 参照。ローカルからの push/削除は `_assert-ci-write` ガードで停止する。

## 2026-06-20 追記: ローカル書き込み解禁 → R2 S3 トークン再発行が再び必要
方針転換 (2026-06-20): ローカルから remote R2 へ書き込み可に変更。`_assert-ci-write` のブロックを廃止。
ローカルで R2 書き込みを行うには R2 S3 トークン再発行が再び必要 (Cloudflare Dashboard → R2 → API tokens で発行 → `.env.local` に `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_S3_ENDPOINT` を設定)。詳細 [[project_r2_writes_ci_only]]。
