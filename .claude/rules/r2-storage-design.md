# R2 ストレージ設計ルール

## 設計原則

**Web アプリのページデータはすべて `app/` 名前空間に格納する。**

- `app/` 以下: Web アプリが fetch するスナップショット・コンテンツ（URL に対応したパス構造）
- `app/` 以外（ルート直下）: URL に対応しないインフラデータのみ（`gis/`, `ges/` 等）
- URL に存在しないディレクトリ名を `app/` 以下に作らない（`ranking-items/` は旧来の誤った命名）
- `all.json` モノリスを禁止。各 URL に必要なデータだけを格納した JSON を持つ
- reader 関数に module-level メモリキャッシュを持たせない。各リクエストが対応する小さい JSON を直接 fetch する
- `compare/` は `category/` と同じデータを使う。R2 ファイルは `app/category/[key]/items.json` に統一し reader 側で両方から参照する

## R2 読み書き — ローカル / CI 両方から remote が唯一の真実源 ★

- **読み取り**はローカル可 (公開 URL `https://storage.stats47.jp`、認証不要)。
- **書き込み**はローカル / CI 両方から remote R2 へ直接可能。常駐するローカル R2 ミラーは廃止済み
  (`.local/r2`はsnapshot/articleの一時stagingに限る)。
- ローカル書き込みには R2 S3 creds (`.env.local`: `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_S3_ENDPOINT`) または `wrangler login` 認証が必要。`_assert-ci-write.ts` はデフォルト許可（ローカル実行時は `console.warn` を出すだけ）。
- 対象スクリプト: `diff-push-r2.ts` / `push-generated-image-set.ts` / `push-r2-wrangler.ts` /
  `db-r2-sync.ts push` / `delete-r2-prefix.ts` / `r2-cleanup-orphans.ts`。
- 新規に R2 書き込みスクリプトを追加する場合は **先頭で `assertR2WriteAllowed()` を呼ぶ**こと（通知のため）。
- 詳細: `.claude/rules/local-environment.md` の「R2 読み書き」。

## URL → R2 キーパス 対応表

| URL パターン                              | R2 キー                                                                         | データ内容                                                                                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                       | `app/home/featured.json`                                                        | 注目ランキング一覧 (~20件)                                                                                                                                                                                      |
| `/ranking/[rankingKey]`                   | `app/ranking/[key]/item.json`                                                   | RankingItem メタデータ 1件                                                                                                                                                                                      |
| `/ranking/[rankingKey]`                   | `app/ranking/[key]/values.json`                                                 | ランキング値。生成元は `packages/ranking/src/scripts/generate-ranking-values.ts` (正典 `app/stats/<metric>/values.json` から配信用に決定的変換、CI: `sync-snapshots.yml` の `ranking-values` task。**必ず `ranking-items` task の後**に実行する)                                                                                                                                                                                                    |
| `/municipalities/ranking/[rankingKey]`    | `app/municipalities/ranking/[key]/{item,values}.json`                           | 市区町村専用ランキング。`app/stats/<metric>/cities.json` を municipality entity/value policy で決定的変換し、CI `municipality-ranking` task で専用 prefix のみ公開・検証する |
| `/ranking/[rankingKey]?norm=per_population` | `app/ranking/[key]/values-per-population.json`                                 | 人口10万人あたり正規化値 (全年 partition)。生成元は `generate-ranking-normalized-values.ts` (CI: `ranking-normalized-values` task) |
| `/ranking/[rankingKey]?norm=per_area`     | `app/ranking/[key]/values-per-area.json`                                       | 面積100km²あたり正規化値 (全年 partition)。**分母 (総面積) は 100km² 単位で格納されているため km² へ換算してから除算する** — 換算漏れで 100 倍過大になった事故 (2026-07-29) の再発防止に fixture 値域ゲートあり |
| `/ranking/[rankingKey]` (全国時系列カード) | `app/ranking/[key]/national-trend.json`                                       | 基準別 (original / per_population / per_area) の全国平均推移。average は 47 県の単純算術平均 (areaCode "00000" と null を除外) |
| `/ranking/[rankingKey]`                   | `app/ranking/[key]/ai-content.json`                                             | AI コンテンツ                                                                                                                                                                                                   |
| `/ranking/[rankingKey]`                   | `app/ranking/[key]/page-cards.json`                                             | ページカード                                                                                                                                                                                                    |
| `/ranking/[rankingKey]`                   | `app/ranking/[key]/thumbnail-{light,dark}.webp` + `thumbnail.json`              | 再利用可能なランキングサムネイル + 生成manifest                                                                                                                                                                 |
| `/category/[categoryKey]`                 | `app/category/[key]/items.json`                                                 | カテゴリ内 RankingItem 一覧                                                                                                                                                                                     |
| `/compare/[categoryKey]`                  | `app/category/[key]/items.json`                                                 | 同上（compare と共用）                                                                                                                                                                                          |
| `/areas/[areaCode]`                       | `app/areas/[code]/profile.json`                                                 | 都道府県プロフィール                                                                                                                                                                                            |
| `/survey`                                 | `app/survey/all.json`                                                           | 調査一覧                                                                                                                                                                                                        |
| `/survey/[surveyKey]`                     | `app/survey/[key]/items.json`                                                   | 調査別 RankingItem 一覧                                                                                                                                                                                         |
| `/blog/[slug]`                            | `app/blog/[slug]/thumbnail-{light,dark}.webp` + `ogp/{ogp.png,generation.json}` | ブログ画像bundle + 共通生成manifest                                                                                                                                                                             |
| `/fishing-ports` (廃止)                   | `app/fishing-ports/all.json`                                                    | 漁港データ。**2026-05-28 にルート廃止 → `/themes/fishery-marine` へ 301 統合**（middleware）。**reader/exporter とも commit 22092e9 (2026-06-13) で削除済み・`/themes` は参照しない**。R2 key は削除対象 (`r2-retention.ts` `retired-fishing-ports`) |
| `/ports` (廃止)                           | `app/ports/all.json`                                                            | 港湾メタデータ。**2026-05-28 にルート廃止 → `/themes/ports` へ 301 統合**（middleware）。**reader/exporter とも削除済み・`/themes/ports` は `app/ranking/<key>` のみ読む**。R2 key は削除対象 (`retired-ports`)          |
| `/ports/[portCode]` (廃止)                | `app/port-statistics/by-port/[code].json`                                       | 港湾別統計。`/ports` 廃止に伴い同様に旧ルート・削除対象 (`retired-port-statistics`)。port 統計は `/themes/ports` 側で扱う                                                                                        |
| `/gis-cross/depopulation-medical`         | `app/gis-cross/depopulation-medical/{summary.json,pref/[NN].json}`              | 過疎×医療 掛け合わせ (サマリ + 県別詳細)                                                                                                                                                                        |
| `/gis-cross/sunshine-map`                 | `app/gis-cross/sunshine-map/{raster.png,meta.json}`                             | 日照地図ラスター + メタ                                                                                                                                                                                         |
| `/geo/[analysisSlug]`                     | `app/geo/[slug]/item.json`                                                      | Geo分析の最終集計（47都道府県等）                                                                                                                                                                               |
| `/geo/[analysisSlug]/[NN]/[stage]` または `?pref=[NN]&stage=*` | `app/geo/[slug]/{manifest.json,pref/[NN].json}`                | 入力→空間演算→検算のlineageと県別途中artifact。県単位で遅延読込                                                                                                                                                 |
| 内部計算データ（URL なし）                | `app/correlation/by-ranking-key/[key].json`                                     | 相関データ（例外）                                                                                                                                                                                              |
| **観測値ストア** (Phase 6 で D1 から移行) | `app/stats/<metric>/values.json` (都道府県)                                     | 47 県 × 全年                                                                                                                                                                                                    |
| 同上                                      | `app/stats/<metric>/cities.json`                                                | 市区町村 × 全年                                                                                                                                                                                                 |
| 同上                                      | `app/stats/<metric>/ports.json`                                                 | 港湾 × 全年                                                                                                                                                                                                     |
| 同上                                      | `app/stats/<metric>/migration-flow-<year>.json`                                 | ペア観測 (pref ↔ pref)                                                                                                                                                                                          |

## ルート直下に置くもの（非 URL データ）

| ディレクトリ | 内容                                         | 理由                                 |
| ------------ | -------------------------------------------- | ------------------------------------ |
| `estat-api/` | e-Stat API レスポンスキャッシュ（`stats-data/{statsDataId}/{filters}.json` / `meta-info/{statsDataId}.json`）| **配信 snapshot ではなく再取得可能な API キャッシュ**。テーマ/area のライブチャートが読む。§「e-Stat API キャッシュ」参照 |
| `gis/`       | 生 GIS ファイル・タイルセット（mlit-ksj 等） | web app の snapshot fetch 経路とは別 |
| `ges/`       | Google Earth Studio 動画出力                 | URL なし、非 Web アプリデータ        |
| `sns/`       | SNS サムネイル / 投稿用素材                  | Web アプリの fetch 対象外            |
| `video/`     | web 埋め込み用 master 動画 + メタ    | `/archive-remotion-output` で集約    |
| `archive/kindle-encrypted/` | KDPへ送信したEPUB・表紙・metadata・reviewの版別AES-256-GCM暗号化bundle | 配信用URLに対応しない別PC復元・rollback用。平文禁止、Git台帳=`.claude/state/products/kindle-archives.json` |

## 生成画像の差分反映契約

登録済み生成画像は通常snapshotと異なり複数assetで1 bundleを構成するため、
mtimeベースの`diff-push-r2.ts --prefix`を使わない。
正典は`.claude/rules/ogp-image-standards.md` §5.0。

1. generator registryにrenderer/font/topology/background/dependencyを列挙して`rendererHash`を作る
2. semantic render inputと全output契約からentity単位の`fingerprint`を作る
3. R2 manifest + 全assetのSHA metadataが一致するbundleだけskipする
4. 変更bundleだけ`.local/image-staging/<type>`へ生成し、exact publish planを出す
5. planに最終asset/manifest SHAと観測時remote manifest SHAを固定する
6. `push-generated-image-set.ts`がR2 lock下で変更bytesだけをPUT/HEADし、manifestを最後にETag CASする
7. SVG等のmanifest非対象資産は`push-exact-r2-assets.ts`でSHA一致をskipし、明示keyだけ反映する

R2資格情報があるCI/ローカルではS3 APIを正典としてSHAまで監査する。公開URLは資格情報のない
read-only監査のfallbackだけ。404以外のread失敗をmissing扱いして全件生成してはならない。
stable画像keyはmutableなので長期immutable cacheを禁止し、再検証必須のCache-Controlを使う。

共通manifestを持たないblog SVG / buzz-map等は例外として
`push-exact-r2-assets.ts`を使う。`.local/r2`配下の明示key、またはidea等の十分狭い
prefix + extensionだけを許可し、local SHA-256/size/MIMEとR2 HEAD metadataが完全一致する
objectはPUTしない。mtime・ローカルcache・`app/blog`等の広域prefixは使わない。

禁止:

- 画像automationの`--force`全件実行
- 画像stagingへのprefix push
- generatorからwrangler等への直接apply
- asset失敗を`continue-on-error` / `|| true`で隠す
- 画像R2 writerで共通`concurrency: r2-write`を使わない

## e-Stat API キャッシュ (`estat-api/`) — 復元可能・出典再現可能が要件 (★2026-08-04)

テーマページ・area ページの**ライブチャート**が読む e-Stat レスポンスのキャッシュ。
配信 snapshot (`app/`) ではなく、失っても e-Stat から再取得できる派生物。

| 項目 | 仕様 |
|---|---|
| キー | `estat-api/stats-data/{statsDataId}/{filters}.json`（フィルタ無しは `default.json`）/ `estat-api/meta-info/{statsDataId}.json` |
| 封筒 (v2) | `{ cachedAt, params, apiVersion, response }` — 正典 `packages/estat-api/src/stats-data/repositories/cache/envelope.ts` |
| **復元性** | `params` に取得リクエスト全体を保存する。**キー文字列は一部パラメータしか反映しない**ので、これが無いと「どの条件で得たデータか」を後から確定できず再取得できない |
| **出典** | `response` は e-Stat 生レスポンス丸ごと。`TABLE_INF` に統計表名・政府機関・調査年が自己記述されているため、この 1 ファイルから出典を再現できる（整形後だけを保存しない理由） |
| 鮮度 | `CACHE_TTL_DAYS = 30`。超過・`cachedAt` 欠落は read 時に miss 扱い → 再取得・上書き。**統計表は年次更新されるので無期限キャッシュにしない** |
| 保持 | TTL で自己更新するため GC 不要（`r2-retention.ts` の削除対象にしない） |
| 書き込み経路 | `fetch-stats-data.ts`（await して保存、失敗は warn ログ）/ `warm-cache.ts`（`--refresh` で既存上書き） |

**禁止**: 整形後 (`StatsSchema[]`) だけを保存する / `params` を省く / TTL 無しで書き込む /
`app/` 配下にキャッシュを置く（配信 snapshot と混ざる）。

## R2 保持・削除ポリシー (★2026-07-27 新設)

無料枠は 10 GB (アカウント合算)。R2 は「配信データを増やし続けるが自動で減らない」ため、
放置すると必ず無料枠を超過する。削除可否と削除の唯一の入口を以下に固定する。

### 保持するもの (削除しない)

| prefix | 理由 |
|---|---|
| `app/**` | 本番配信データ (SSOT / snapshot)。§「URL → R2 キーパス対応表」参照 |
| `gis/` / `ges/` / `video/` / `note/` | 正規保持 (§「ルート直下に置くもの」) |
| `staging/image-cache/` | AI 背景の再課金防止 cache (`ogp-image-standards.md` §5)。無期限 |
| `archive/kindle-encrypted/` | KDP送信版の復元・rollback証跡。manifest署名とplain/cipher SHAが一致するrevisionを保持 |
| `sns/` (投稿済み動画を除く) | 投稿予定・draft の素材 |

### 削除ポリシー (削除してよいもの)

| 対象 | 保持ルール | 実行手段 |
|---|---|---|
| `incremental-cache/<buildId>/` (ISR キャッシュ) | **最新 3 世代のみ保持**。旧世代は二度と読まれない | デプロイ完了後に自動 GC (`.github/workflows/r2-isr-gc.yml`、`workflow_run` トリガー + 日曜 03:30 JST の取りこぼし回収) + 手動 `r2-maintenance.yml` (`mode: isr-generations`) |
| `sns/**/*.mp4` (投稿済み) | 投稿後 30 日で削除 | `.github/workflows/cleanup-r2-sns-videos.yml` (週次。正典 `sns-content-standards.md` §5.5) |
| 移行済み旧 prefix (下記「既存キーの移行状態」) | `packages/r2-storage/src/scripts/r2-retention.ts` の `RETENTION_TARGETS` (コード内 allowlist) のみ | 手動 `r2-maintenance.yml` (`mode: retention-prefixes`) |

**削除の唯一の入口は `.github/workflows/r2-maintenance.yml`** (`mode: du` / `retention-prefixes` /
`isr-generations`、既定 `dry_run: true`)。任意 prefix を削除できる `delete-r2-prefix.ts` は緊急時のみで、
通常運用では使わない。実行主体は `r2-publisher` agent。両ワークフローとも
`RETENTION_TARGETS` / `PROTECTED_PREFIXES` (コード側 allowlist) 外の prefix は削除できない設計
(誤入力で配信データを消せない)。

再増加は日次Cloudflare usageで二段階に検知する。アカウント合計は18GB超、stats47 bucketは
12.5GB超でalertし、原因判定では必ずbucket別にsiteScopeを分離する。ISR cacheは容量閾値とは別に
`r2-isr-gc.yml`の`--assert-max 4`で世代数をfail-closedに検査する。閾値のSSOTは
`.claude/skills/analytics/cloudflare-cost-improvement/reference/budgets-daily.json`。

### 2026-07-27 の実績 (根本原因と是正)

**根本原因**: OpenNext は ISR キャッシュを `incremental-cache/<buildId>/` に書き、デプロイのたびに
buildId が変わって新世代ができる。旧世代は二度と読まれないが、`audit-incremental-cache.ts` はどの
workflow にも配線されておらず、R2 ライフサイクルルールも無く、日次アラート閾値 (50 GB) も緩すぎたため
検知されなかった。

| 項目 | 値 |
|---|---|
| 削減前 (2026-07-27 01:47 実測) | 20.04 GB / 72,663 オブジェクト |
| 削除内容 | `incremental-cache/` 67 世代中 64 世代 (最新 3 世代を保持) = 30,153 オブジェクト / 8.85 GB。蓄積期間 2026-06-20〜2026-07-27 (約 5 週間) |
| 削減後 (2026-07-27 01:56 実測) | 11.2 GB / 42,664 オブジェクト |
| 検証 | 削除後に本番 5 ページ (`/`, `/ranking/annual-sunshine-duration`, `/areas/13000`, `/blog/real-disposable-income-reversal`, `/category/landweather`) を Googlebot UA で 200 実測確認 |

削減後もアカウント合計は無料枠 10 GB を超過している (残課題は `.claude/todo/improvements.md`
`[R2-STORAGE-01]` を参照)。今後の再発防止は `r2-isr-gc.yml` の自動 GC (デプロイ連動) が担う。

## 動画関連の特殊ルール

Remotion build 時に必要な統計データ JSON は **`apps/remotion/public/<feature>/`** に置く (R2 ではなく git tracked)。理由: Remotion の Webpack bundle が `staticFile()` で読み込むため。これらは **git TS / R2 を入力に再生成される派生物**（完全DBレス: 永続 D1 は SSOT ではない）。

動画 master / SNS 用 47 分割は R2 に保存:

- `video/<slug>/master.mp4` — master 動画 + メタ (description / thumbnail)
- `sns/<slug>/<region>.mp4` — 47 県分割 reel など、再投稿候補

## 既存キーの移行状態

| 旧キー                                  | 新キー                                                                                                                            | 状態     |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `ranking-items/all.json`                | `app/home/featured.json` + `app/category/[key]/items.json` + `app/ranking/[key]/item.json` + `app/survey/[key]/items.json` に分割 | 移行待ち |
| `surveys/all.json`                      | `app/survey/all.json`                                                                                                             | ✅ 完了  |
| `area-profile/[code].json`              | `app/areas/[code]/profile.json`                                                                                                   | ✅ 完了  |
| `ranking/[key]/values.json`             | `app/ranking/[key]/values.json`                                                                                                   | ✅ 完了  |
| `ranking/[key]/ai-content.json`         | `app/ranking/[key]/ai-content.json`                                                                                               | ✅ 完了  |
| `ranking/[key]/page-cards.json`         | `app/ranking/[key]/page-cards.json`                                                                                               | ✅ 完了  |
| `blog/[slug]/...`                       | `app/blog/[slug]/...`                                                                                                             | ✅ 完了  |
| `correlation/by-ranking-key/[key].json` | `app/correlation/by-ranking-key/[key].json`                                                                                       | ✅ 完了  |
| `app/area-profile/[code].json`          | `app/areas/[code]/profile.json`                                                                                                   | 🗑️ 削除対象 (`migrated-area-profile`) |
| `app/fishing-ports/all.json`            | (後継なし・ルート廃止)                                                                                                            | 🗑️ 削除対象 (`r2-retention.ts` `retired-fishing-ports`) |
| `app/ports/all.json`                    | (後継なし・ルート廃止)                                                                                                            | 🗑️ 削除対象 (`retired-ports`) |
| `app/port-statistics/by-port/[code].json` | (後継なし・ルート廃止)                                                                                                          | 🗑️ 削除対象 (`retired-port-statistics`) |

## JSON ファイル命名規則

| ページの性質                   | ファイル名                   |
| ------------------------------ | ---------------------------- |
| 1件のリソース詳細              | `item.json` / `profile.json` |
| 一覧・複数件                   | `items.json`                 |
| URL なし内部データ（例外のみ） | `all.json`                   |

## 新規スナップショット追加時のチェックリスト

新しい snapshot を追加するときは以下の順に確認する。

1. **URL を確認する**: 対応する Next.js ページの `app/` 以下のパスを確認
2. **R2 キーパスを導出する**: URL `/foo/[bar]` → `app/foo/[bar]/xxx.json`
3. **exporter を追加する**: `packages/*/src/exporters/` または `apps/web/scripts/`
4. **sync-snapshots に追記する**: `run.sh` の TASKS 配列と `SKILL.md` のスナップショット一覧
5. **reader を実装する**: module-level キャッシュを持たせない（`let cached` 禁止）
6. **旧キーを廃止する**: 移行後は旧 R2 オブジェクトと古い reader/exporter を削除する

## 禁止パターン

```typescript
// ❌ app/ プレフィックスなし（旧形式）
saveToR2("ranking-items/all.json", ...);
saveToR2("surveys/all.json", ...);
saveToR2("area-profile/47000.json", ...);
saveToR2("ranking/key/values.json", ...);

// ❌ module-level メモリキャッシュ
let cached: RankingItem[] | null = null;
async function loadAll() {
  if (cached) return cached;
  cached = await fetchFromR2AsJson("...");
  return cached;
}

// ❌ Phase 6 以降は D1 stats_* SELECT 禁止 (テーブル DROP 済)
const rows = await db.select().from(statsPrefecture).where(...);

// ❌ stats 観測値を独自スキーマで R2 化 (app/stats namespace を使う)
saveToR2("metrics/japanese-population/data.json", ...);
saveToR2("observations/<metric>.json", ...);

// ✅ app/ プレフィックス付き URL 対応パス
saveToR2("app/category/medical/items.json", ...);
saveToR2("app/survey/all.json", ...);
saveToR2("app/areas/47000/profile.json", ...);
saveToR2("app/ranking/key/values.json", ...);

// ✅ キャッシュなし・直接 fetch
async function readCategoryItemsFromR2(categoryKey: string) {
  return fetchFromR2AsJson(`app/category/${categoryKey}/items.json`);
}

// ✅ Phase 6 以降の stats 観測値: app/stats namespace + @stats47/stats-r2 reader 経由
import { readStatsValues, readMigrationFlow } from "@stats47/stats-r2/readers";
const payload = await readStatsValues("japanese-population", "prefecture");
const flow    = await readMigrationFlow("population-migration-inter-prefecture", 2025);
```

## 関連ファイル

- `packages/r2-storage/src/scripts/README.md` — R2 操作全般
- `.claude/skills/db/sync-snapshots/SKILL.md` — スナップショット一括更新スキル
- `.claude/agents/data-ingester.md` — TS-config / e-Stat → R2 投入
- `.claude/agents/snapshot-exporter.md` — git TS / R2 観測値 → R2 snapshot 生成 (エフェメラル計算)
- `.claude/agents/r2-publisher.md` — R2 push / pull / du 専任
- `packages/r2-storage/src/scripts/{r2-du,r2-retention,audit-incremental-cache}.ts` — 容量計測 / 移行済み旧 prefix 削除 / ISR 世代 GC
- `.github/workflows/{r2-maintenance,r2-isr-gc}.yml` — 削除の唯一の実行窓口 (前者は手動 dispatch、後者はデプロイ連動 + 週次)
