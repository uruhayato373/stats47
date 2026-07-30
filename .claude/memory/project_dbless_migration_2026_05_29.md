---
name: project_dbless_migration_2026_05_29
description: 完全DBレス移行 (正典=doc19) **全Phase A-F 完了 + 本番デプロイ済** (2026-05-30, origin/main 1cbe1f83, PR #380 merge)。Phase E=page_components/themes/affiliate_ads/categories を git TS SSOT 化 (data/page-components/, byte一致検証済) + sns_posts は .claude/state/sns/posts.json + sns-posts-store.cjs に移行 (運用ログのため git TS でなく state)。公開R2 URL storage.stats47.jp が認証不要読みの鍵
metadata: 
  node_type: memory
  type: project
  originSessionId: 64bc205d-d555-4622-b350-019af90ba54b
---

オーナー判断で **完全DBレス** 採用 (永続/リモートD1 を SSOT に持たない。SSOT = git TS + R2、Derived = R2 から直接計算 → R2)。

## Phase E 完了 (2026-05-30, develop b90ae144、5コミット)
運用エンティティを git TS SSOT 化。**全て cloud baseline と byte 一致検証済 (推測でなく実証)**:
- **page_components** (本丸): cloud R2 が唯一コピーだった 117 件を reverse-extract → `apps/web/scripts/data/page-components/<pageType>/<key>.json` (git tracked) を **新 SSOT** 化。area47/area-category17/city-category14/theme20/ranking-page-cards19。generator `export-page-components-snapshot.ts` / `export-ranking-page-cards-snapshot.ts` を git JSON verbatim 書戻しに DBレス化、`verify-page-components-snapshot.ts` で 117/117 一致。**今後 page_components 編集は JSON 直編集 + generator** (`/insert-theme-components` skill 更新済)。抽出は一回限り `extract-page-components-from-r2.ts`。
- **themes/theme_metrics**: 配信は既に git TS (`packages/types/src/indicator-sets/*.ts` を app が直読)。R2 `app/themes/*/config.json` は vestigial。`export-themes-snapshot.ts` 削除。
- **affiliate_ads**: `apps/web/scripts/affiliate-ads-data.ts` (git TS 24件) + `export-affiliate-ads-snapshot.ts` DBレス化 + verify。
- **categories**: 既存 (基盤2 `packages/data-configs/src/categories.ts`)。
- 削除: seed-theme-page-components / seed-local-finance-page-components / theme-page-component-additions / sync-theme-additions-to-r2 (scripts) + skills/db/{populate-component-data,verify-component-data} (内容は data/page-components/ に captured)。
- doc19 §5 標準フロー = 実装に更新。adversarial verify workflow で run.sh の ai-content phantom task 等も修正。

**sns_posts 完了 (2026-05-30)**: 書込専用ログ (publish-x が投稿毎 append、配信 reader 無し) のため git TS でなく `.claude/state/sns/posts.json` (549件移行) + 共有ストア `.claude/scripts/lib/sns-posts-store.cjs` (loadAll/query/insert/updateById, 原子的書込) に移行。SNS スクリプト9本を SQLite/sqlite3 CLI/旧 miniflare → ストア経由に置換 (store==SQLite 等価検証済)。**副次効果: CI(GitHub Actions, DB 不在)でも SNS スクリプトが動くようになった** (git-tracked JSON を読むため)。別 scope の残 D1 依存: `export-fishing-ports-snapshot.ts` 等 master data exporter。

**多セッション衝突の教訓 (2026-05-30)**: 別セッション (claude/confident-cray) が同じ page_components git SSOT 移行を**別実装 (大きな TS 定義ファイル) + 新規22チャート**で並行実施。**だが衝突は実質ゼロだった**: confident-cray が cloud R2 に push 済み → 本セッションが cloud から reverse-extract したため、私の `data/page-components/` に既に彼らの内容が入っていた (materialize で byte 一致確認)。**教訓: R2 配信エンティティを2セッションが独立に git SSOT 化しても、一方が R2 push・他方が cloud 抽出なら内容は既に統一されている可能性。競合と決めつけず byte 等価を先に確認せよ。** SSOT 形式 (TS vs JSON) と app-src 改善のみ統合判断が要る。[[feedback_shared_working_copy_git_race]]

**正典 / 計画**:
- `docs/01_技術設計/02_データアーキテクチャ.md` (正典, doc18 superseded)
- `docs/01_技術設計/02_データアーキテクチャ.md`（完全 DB レス設計の現行正典。旧 Phase C 進捗表は Git 履歴）
- `~/.claude/plans/quiet-forging-flurry.md` (SSD非依存化 3本柱プラン)

**SSD非依存の鍵 (実測済)**: 公開 R2 URL **https://storage.stats47.jp** (committed `apps/web/.env.development` の `NEXT_PUBLIC_R2_PUBLIC_URL`) が全オブジェクトを認証/SSD なしで HTTPS GET 可能。**ただし list は不可** (404)。S3 鍵は cloud-first 化で .env.local から削除済。

**完了 (全て develop push 済)**:
- 基盤1 `listRankingItemsWithTagsFromR2` (R2 item.json 走査, Result 返す) / 基盤2 categories git TS。
- 2.1 calculate-ranking-values (D1除去) / 2.3 export-blog / 2.6 render-sns-all / 2.4 generate-search-index (ranking 0件の壊れ検索を1992件に復旧) / 2.2 area-profile 都道府県 (47000 byte一致)。
- **SSD非依存化 (柱1-3)**:
  - 柱1 (c738f4fc): `packages/r2-storage/.../fetch.ts` に公開URL fetch tier (localFS→binding→S3→公開URL)。`R2_PUBLIC_FETCH_URL` 設定で binding 試行を skip (Node の getCloudflareContext 失敗ノイズ回避)。Worker は本変数未設定&binding 段優先で不変。listFromR2 には付けない。
  - 柱2 (7a3fd844): known-ranking-keys を `packages/ranking/src/config/` へ移設 (`@stats47/ranking/config`, apps/web は re-export)。基盤1 と export-blog に「list 不可なら committed key (known-keys / articles.json seed) から列挙」フォールバック追加。
  - 2.2b city (141e656c): 削除済 run-batch-city を R2 から再構築。rankPref=prefectureCode group→全国rank昇順連番。6 spot city が cloud baseline 完全一致。
  - 2.5 port (f02e358a): port master git TS化 `packages/area/src/data/ports.json` (699, administrator込み) + R2 stats。baseline 完全一致。
  - 2.1 recompute (b2324f2e): `packages/ranking/scripts/verify-calculated-rankings.ts`。計算可能な全計算型 ranking で rank 完全一致確認 (ratio の ×100 は snapshot display スケール=既存, non-regular は config 欠落=別件)。
  - 柱3 (5ca45fed): `push-r2-wrangler.ts` (wrangler CLI で S3鍵不要 push, dry-run既定)。SSD非接続書込は既存 `local-r2-mode.sh cloud` + 柱1 で対応済。

**重要 (build スクリプトで R2 を読むとき)**:
- `R2_PUBLIC_FETCH_URL=https://storage.stats47.jp NODE_OPTIONS='--conditions react-server'` (公開URL・認証不要)。
- `*/` をコメント内に書かない (`port-*/` が早期にブロックコメントを閉じ esbuild syntax error。scripts/ は apps/web tsconfig 外で tsc が見逃す → esbuild/実行で検出)。

**export-blog published バグ修正 (149a1596, 2026-05-30)**: 旧 `published===true` ルールは古い記事 (publishedAt のみでライブ・published 無し) を draft 誤判定し本番 190→118公開の重大 regression だった (push 直前に cloud 突合で阻止)。**sticky 方式**に修正: frontmatter の published boolean 最優先→配信 all.json 状態保持→初回のみ publishedAt 推定。全記事集合=配信∪ローカル (欠落5記事を公開URL article.md で補完)。検証: 201/190 が cloud と完全一致・regression 0・title は frontmatter で refresh。**運用注意: prior は配信(cloud)の all.json が真。SSD接続時ローカルが古いと sticky 源がずれる→再生成前に cloud 同期 or R2_PUBLIC_FETCH_URL で cloud 読ませる**。

**PR #378 (develop→main, 完全DBレス+SSD非依存)**: 2026-05-30 **マージ済** (main 反映)。
**PR #379 (develop→main, Phase F: D1コード全削除)**: 2026-05-30 **マージ→本番デプロイ実行** (head=134c9888, CI Code Quality/Security/CodeQL/validate 全 green, merge commit → main 14bfd19e)。並行 commit `134c9888 feat(blog): cloud-first ブログ公開 CI (publish-blog.yml)` も同梱。Cloudflare Workers 自動デプロイ起動。

**Phase F ✅完了 (2026-05-30, grep getDrizzle( = 0 達成)**: A=master-snapshot生成器DBレス化(categories/surveys/per-url + dead monolith削除, cloud baseline一致) / B=vestigial getDrizzle除去 / C=型relocate(Source→ranking types, ArticleRow→blog types, AffiliateAd→ads types) / D=全消費者D1 query削除(area-profile/ranking 29f/category/ai-content/estat-api + compute-normalization/fetch-ranking-data-calculated/get-category-data を R2 swap) / E=getDrizzle(drizzle.ts)撤廃 + area-master を git TS area data fs読みに + 消費者の未使用 @stats47/database/drizzle-orm dep除去。**残置(canonical許容・app非使用)**: packages/database の schema(型ソース)+ core/client(CF Workers D1接続層, 外部未使用)+ seed/migration scripts(sync-metrics-cache/articles seed 等, better-sqlite3 でローカルbuild cache操作)。estat-api warm-cache の better-sqlite3 も独自cache用で残置。これら core/client+seed の更なる削除は別scope(build/seed pipeline 全体の見直し要)。
旧記録↓:
**Phase F (D1コード全削除, 承認プラン=`~/.claude/plans/quiet-forging-flurry.md`)**: 「フル: 生成器DBレス化→全D1削除」をオーナー選択。調査結果: 本番runtimeは getDrizzle()実呼び出し0(型importのみ)。**49ファイルが真のD1 query**、8ファイルはR2-native(getDrizzleは未使用_db?型のみ=vestigial)。**master-snapshot生成器(export-master-snapshots→ranking-items/per-url/surveys/categories/ai-content)がitem.json/home/category/survey/ai-contentの唯一の生成元でDBレス代替なし**→削除前に再実装必須。tags/demographicAttr/normalizationBasis/surveyId/areaTypeはgit TSに無い(D1由来)→item.jsonからpreserve。schema型(ArticleRow/AffiliateAd)はruntimeが型import→relocate要。
- **Part B 完了 (2f487f49)**: ranking-value 7ファイルのvestigial getDrizzle除去 + obsolete D1テスト3件削除。
- **Part A 進行中 (生成器を1本ずつ DBレス化 + cloud baseline 突合)**:
  - ✅ categories (9a7c8344): 基盤2 categories.ts に lucide icon 追加し完全 SSOT 化。17件 cloud 一致。
  - ✅ surveys (0aab6086): 41件を `packages/ranking/src/data/surveys.json` に git TS 化。cloud 一致。Source 型は type import 維持。
  - ✅ ranking-items per-url (67168f54): item.json/home/category/survey-items を基盤1(item.json)から passthrough+regroup でDBレス化(field写像なし=cloud exact一致: home8/cat population118/item aging-index title・areaType・tags・viz一致)。**SSD list 要**(基盤1 fallbackはprefectureのみ)。dead monolith ranking-items-snapshot 削除。→ **export-master-snapshots は D1-free**。
  - **Part A 実質完了**。follow-up(別scope): config→item.json field refresh / 新規metric(item.json未存在)の生成。
  - ai-content (faq/regionalAnalysis/insights): 別系統(R2 app/ai-content/<key>.json 既存が runtime source、生成は別 AI パイプライン)。Part D で D1 exporter/CRUD/generation 削除 + 既存R2凍結 note(再生成は将来DBレス化)。
- **Part D 進行中 (パッケージ別に削除 + tsc gate + commit)**:
  - ✅ ranking service の findRankingItemByKey→readRankingItemByKeyFromR2 (0d08fcf6): compute-normalization(runtime使用)+ fetch-ranking-data-calculated の潜在 runtime D1 依存除去。
  - ✅ area-profile 全 D1 削除 (f8f07963): D1 repo 7 + run-batch service + run-batch CLI = 9ファイル削除、server/index 整理。runtime は R2 profile.json のみ。
  - ⬜ 残パッケージ (同パターン: 未使用確認→削除→index/server整理→tsc): **ranking** 20 D1 files (find/list/upsert/delete/sync-ranking-export/auto-attach 等。CategoryRankingItem 型を per-url が使う→relocate要) / **ai-content** D1 pipeline (find/upsert/snapshot exporter/generate-parallel/list-pending。R2既存凍結) / **category** D1 repo(find/list/create/update/delete/convert-from-db) / **estat-api/d1/** 6。
- **Part C 未着手**: schema 型 relocate (ArticleRow→blog types / AffiliateAd→ads types / Source→? / Category→?)。Part E の前提。
- **Part E 未着手**: getDrizzle/drizzle.ts/d1-core/schema + better-sqlite3/drizzle-orm 撤廃 → grep getDrizzle(=0。
- **削除の順序教訓**: staying な runtime service(compute-normalization 等)の D1 呼び出しを先に R2 化 → D1-using-but-dead(ai-content/area-profile run-batch/sync-ranking-export)削除 → D1 repo は caller 消滅後に削除 + index/server clean。全 commit tsc-green + push 維持。

**残作業**:
- **★ PR #380 マージ = 本番デプロイ (別セッションで実施、2026-05-30 区切り)**: develop→main PR "ブログサムネイル自動化 (SSD非依存生成+CI gate) + blog公開CI改善"。中身=thumbnail tooling (cloud生成器 + render lib) + Blog Thumbnail Gate + 公開フロー組込 (68a51e74) + 並行セッションの blog pilot/公開CI。**マージ前手順**: ①並行セッションの publish batch が収束したか確認 (`gh run list --workflow publish-blog.yml`) ②最終 backfill `npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --apply` で cloud 0件にする ③PR #380 の CI (特に Blog Thumbnail Gate) green 確認 → ④`gh pr merge 380 --merge`。**注意**: gate は live cloud を見るので、batch 進行中だと新規公開記事の欠落で fail する (移行期。68a51e74 反映後に dispatch される publish は自動で thumbnail 付与されるので収束する)。セッション終了時点 cloud=0件 backfill 済。
- **cloud R2 push (任意)**: 再生成 snapshot を cloud へ。blog all.json は修正後 cloud と published一致+title 4件 refresh で**安全に push 可**。ports/area/city は cloud と一致済 (push 不要)。`/push-r2`(S3要トークン=失効中) か `push-r2-wrangler.ts`(wrangler)。
- **Phase E** (本 scope 外): page_components 等6エンティティを git TS→R2 運用 (最大の新規実装)。
- 既存データ品質の別件: orphan categoryKey "port"/"labor" (17-master外), non-regular の calculation config 欠落。
- **blog thumbnail 欠落 → 解消済 (2026-05-30, dc5b71e6)**: cloud all.json 列挙で **欠落 4件** 判明 (`assembly-answer-chatgpt-5steps` / `estat-7-techniques-from-unusable-to-usable` / `highway-japan-58years` / `telework-rate-tokyo-gap`。一覧190中3 + 非掲載1)。生成+push 済、再監査 0件・全200 image/webp。原因=これら記事が ogp.json 未作成 (article-writer Phase 5.5 を経ない経路で公開) → 旧 generate-blog-thumbnails.ts が ogp.json 必須でスキップ。Post-Deploy Smoke Test の「ブログ一覧 thumbnail」失敗の根本原因 (Phase F 無関係。次回デプロイで green になるはず)。
  - **SSD非依存の正経路 (新規)**: `apps/web/scripts/generate-blog-thumbnails-cloud.ts` = 公開R2読み + wrangler push で監査(`--audit`)/生成/push(`--apply`)。frontmatter title の ｜ 分割で subtitle 補完。render は `apps/web/scripts/lib/blog-thumbnail-render.ts` に切り出し旧SSD版と共有 (satori/sharp は生成時のみ動的 import → `--audit` は fetch だけで native binding 非依存)。**旧 `generate-blog-thumbnails.ts` は .local/r2(SSD) 依存なので使わない** (node は macOS TCC で /Volumes/SSD を read/write 不可、shell write も sandbox 不可。SSD は触らないのが正)。
  - **CI gate (d927a2ed)**: `.github/workflows/pr-quality-check.yml` に「Blog Thumbnail Gate」追加 (Metric Years Gate の後)。develop→main PR で `--audit` を実行し thumbnail 欠落があれば fail (Post-Deploy Smoke の前倒し検出)。pull_request はマージ ref でワークフロー実行されるため次PRから有効。修正はコード変更不要で `--apply` 実行のみ。
  - **公開フローに生成組込 = 根本解決 (68a51e74, オーナー判断)**: `publish-blog.yml` は記事公開時に thumbnail を生成せず公開記事が必ず欠落で生まれていた。記事 push 前に `generate-blog-thumbnails.ts --slug` を実行し `.local/r2` staged dir に生成 → 既存 `diff-push-r2` が記事と一緒に push。`generate-blog-thumbnails.ts` は **ogp.json 無しでも article.md frontmatter から導出** (｜分割で subtitle 補完)、`BLOG_DIR` env で出力先上書き可。**今後 publish される記事は thumbnail 自動付与** (gate が落ちなくなる)。
- code 上の残置 (canonical許容): packages/database の schema(型ソース)/core/client(CF Workers D1接続層, app未使用)/seed・migration scripts(better-sqlite3 ローカルbuild cache)。完全撤廃は build/seed pipeline 全体の見直しが前提で別 scope。

**注意**: 並行作業が origin/develop に push する共有 working copy。破壊的操作前に `git fetch` + FF 確認 + `git add` は自分のファイルのみ明示。[[feedback_shared_working_copy_git_race]] [[project_r2_s3_token_expired_2026_05_29]]
