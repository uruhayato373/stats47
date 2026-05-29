---
type: session-handoff
date: 2026-05-29
status: completed
branch: claude/sweet-keller-FqkeB
tags: [blog-brushup, blog-planning, blog-mass-production, ogp-generation, cloud-session, isr-cache, db-less-workaround, published-flag-bug]
---

# セッションハンドオフ 2026-05-29｜ブログ 一括リライト + 企画30本 + 新規5本量産公開 + OGP生成

cloud (リモート) セッションでの一連のブログ運用作業。**結論: 全タスク完了・本番反映済。**
PR #372 / #373 / #374 すべて CI green でマージ済。新規5本は本番で 5/5 正常表示確認済。
残課題は「SNS og:image の site-wide 500（既存バグ）」と「残り25本の執筆」のみ。

## このセッションの環境制約（次の cloud agent は必読）

このリモート環境には **フル DB が無い**（R2 に `database/stats47.sqlite` が未 seed のため `db:pull` 不可、`db:migrate:local` で空スキーマのみ）。
そのため以下の「DB 非依存の回避策」を確立した。次回も同様に使うこと。

| 課題 | 回避策 |
|---|---|
| metric メタ (DB 空) | git の `packages/data-configs/src/metrics/*.ts`（2,209件）を真実源に使う |
| 観測値 (DB 空) | R2 `app/stats/<metric>/values.json` を直読（`rows: [{areaCode,areaName,value,rank,...}]`） |
| 新規記事 data/*.json 生成 | **新 helper `.claude/scripts/blog/build-article-data-from-r2.mjs`**（R2 stats → factual-check 互換 data。標準 fetch-article-data は DB/Phase6廃止テーブル依存で動かない） |
| all.json 再生成で tags 消失 | **全再生成しない**。本番 all.json を fetch → 該当エントリのみ外科パッチ（tags は taggings テーブル管理で DB 空だと失われるため）。新規追加時は frontmatter から tags を直読 |
| Cloudflare purge | **CLOUDFLARE_API_TOKEN / CLOUDFLARE_ZONE_ID が env に登録済**（Cache:Purge 権限）。`POST /zones/{zone}/purge_cache` 直叩き可。ただし user-scope の `/user/tokens/verify` は Invalid を返す（zone 限定トークンの仕様、purge 自体は成功する） |

R2 認証 (`R2_S3_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`) は env にあり、`@aws-sdk/client-s3` 直叩きで read/write 可（スクリプトは node_modules 解決のため project 配下で実行すること。/tmp 不可）。

## 実施タスクと成果

### 1. ブログ一括リライト（PR #372 マージ済）
GSC 改善余地上位 4 記事を curiosity gap で自律リライト（article-writer 並列、全 quality-gate exit 0）。
- manufacturing-aichi-dominance / manufacturing-shipment-prefecture-ranking / agriculture-hokkaido-dominance / sewerage-water-supply-gap
- manufacturing-shipment では実データ誤りも修正（静岡17→19.8兆、3.4→2.9倍、大阪3位欠落、太平洋ベルト歪曲削除）
- 改善ログ: `docs/05_改善ログ/gsc.md` の `BLOG-WAVE-2026-05-29-auto`（4週後 2026-06-26 に CTR 実測予定）

### 2. ブログ企画 30本（PR #373 マージ済）
- `docs/20_ブログ記事企画/backlog/cloud-plan-2026-05-29.md`（GSC需要12 / 収益10 / トレンド8）
- 全 metric key 実在検証済、slug + 指標トピックの両方で既存記事と dedup（初版で競合した12本を非競合指標へ差し替え）

### 3. 新規記事 5本 量産・公開（PR #373/#374 マージ済、本番 5/5 正常表示確認済）
企画の GSC需要 上位 5本を執筆。全 quality-gate exit 0、data ground-truth で数値検証。
- inpatient-rate-aging-burden / public-phone-prefecture-vanishing / middle-school-height-east-west-puzzle / general-bed-utilization-pressure-map / natto-consumption-east-west-divide
- public-phone は企画仮説「北海道突出」が実データ（東京#1・北海道#6）と矛盾 → article-writer が data 優先で reframe

### 4. OGP 画像 5本 生成・公開（R2 push 済、git 差分なし）
`apps/web/scripts/generate-blog-thumbnails.ts`（Satori + sharp + ローカル Noto Sans JP ttf、GPU/外部フォント不要）で cloud 生成。
- 各 `ogp/ogp.png`(1200×630) + `thumbnail-light/dark.webp` を R2 push、`storage.stats47.jp/.../ogp.png` が HTTP 200
- 入力は `ogp/ogp.json`（title/subtitle）。public-phone は agent が ogp.json を作り忘れていたため手動補完

## ハマった点と教訓（再発防止）

1. **published フラグ漏れ**: public-phone の frontmatter に `published: true` が無く → all.json published:false → 本番 not-found。
   → **新規記事 frontmatter に `published: true` は必須**。article-writer の必須チェック項目に追加すべき（未対応）。
2. **ISR incremental cache は edge purge で消えない**: published:false 時にアクセスされた not-found が OpenNext の ISR cache に残り、Cloudflare Cache Purge API（edge）では消えなかった。**再デプロイ（main マージ）で ISR cache リセット**して解消。
3. **worker の all.json は build-time SSG 由来**: 新規記事は dynamicParams でオンデマンド描画されるが、一度 not-found がキャッシュされると edge purge では戻らない。確実な反映は再デプロイ。
4. **sync-articles-from-r2 が list 形式 tags を取りこぼす**: 新規記事 frontmatter の `tags:\n  - X` を DB に反映できず（DB tags=[]）。今回は all.json に frontmatter から直接 tags を入れて回避。根本修正は別途（`packages/database/scripts/sync-articles-from-r2.ts`）。

## 残課題（follow-up）

| 優先 | 課題 | 備考 |
|---|---|---|
| 中 | **SNS og:image が site-wide で HTTP 500** | og:image は動的ルート `/blog/[slug]/opengraph-image`（Satori 実行時 Google Fonts fetch）を指すが全記事で 500。既存記事含む既存バグ。修正案: `generate-blog-metadata.ts`/`page.tsx` の `openGraph.images` を R2 `ogp.png` に切替（既存記事も ogp.png 保有のため site-wide 解消）。今回は未着手 |
| 中 | 企画 backlog 残り 25本の執筆 | 同パイプライン（build-article-data-from-r2 → article-writer → quality-gate → R2 push + all.json 追加）で量産可。OGP も generate-blog-thumbnails で同時生成 |
| 低 | article-writer に `published: true` 必須チェック追加 | 上記教訓1 |
| 低 | sync-articles-from-r2 の list-tags 取りこぼし修正 | 上記教訓4 |
| 低 | リライト4本 + 新規5本の効果計測 | 2026-06-26 頃 GSC snapshot で CTR/掲載確認 |

## 検証コマンド（本番確認）

```bash
# 新規5本のレンダリング
for s in inpatient-rate-aging-burden public-phone-prefecture-vanishing middle-school-height-east-west-puzzle general-bed-utilization-pressure-map natto-consumption-east-west-divide; do
  curl -s -A "Mozilla/5.0" "https://stats47.jp/blog/$s" | grep -oE "<title>[^<]*</title>"; done

# OGP 静的画像 (R2)
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "https://storage.stats47.jp/app/blog/natto-consumption-east-west-divide/ogp/ogp.png"

# Cloudflare purge (env に token あり)
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
  --data '{"files":["https://stats47.jp/blog/<slug>"]}'
```
