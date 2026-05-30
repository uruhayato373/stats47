# R2 ストレージ設計ルール

## 設計原則

**Web アプリのページデータはすべて `app/` 名前空間に格納する。**

- `app/` 以下: Web アプリが fetch するスナップショット・コンテンツ（URL に対応したパス構造）
- `app/` 以外（ルート直下）: URL に対応しないインフラデータのみ（`gis/`, `ges/` 等）
- URL に存在しないディレクトリ名を `app/` 以下に作らない（`ranking-items/` は旧来の誤った命名）
- `all.json` モノリスを禁止。各 URL に必要なデータだけを格納した JSON を持つ
- reader 関数に module-level メモリキャッシュを持たせない。各リクエストが対応する小さい JSON を直接 fetch する
- `compare/` は `category/` と同じデータを使う。R2 ファイルは `app/category/[key]/items.json` に統一し reader 側で両方から参照する

## URL → R2 キーパス 対応表

| URL パターン | R2 キー | データ内容 |
|---|---|---|
| `/` | `app/home/featured.json` | 注目ランキング一覧 (~20件) |
| `/ranking/[rankingKey]` | `app/ranking/[key]/item.json` | RankingItem メタデータ 1件 |
| `/ranking/[rankingKey]` | `app/ranking/[key]/values.json` | ランキング値 |
| `/ranking/[rankingKey]` | `app/ranking/[key]/ai-content.json` | AI コンテンツ |
| `/ranking/[rankingKey]` | `app/ranking/[key]/page-cards.json` | ページカード |
| `/category/[categoryKey]` | `app/category/[key]/items.json` | カテゴリ内 RankingItem 一覧 |
| `/compare/[categoryKey]` | `app/category/[key]/items.json` | 同上（compare と共用） |
| `/areas/[areaCode]` | `app/areas/[code]/profile.json` | 都道府県プロフィール |
| `/survey` | `app/survey/all.json` | 調査一覧 |
| `/survey/[surveyKey]` | `app/survey/[key]/items.json` | 調査別 RankingItem 一覧 |
| `/blog/[slug]` | `app/blog/[slug]/thumbnail-light.webp` 等 | ブログ資産 |
| `/fishing-ports` | `app/fishing-ports/all.json` | 漁港データ |
| `/ports` | `app/ports/all.json` | 港湾メタデータ |
| `/ports/[portCode]` | `app/port-statistics/by-port/[code].json` | 港湾別統計 |
| `/gis-cross/depopulation-medical` | `app/gis-cross/depopulation-medical/{summary.json,pref/[NN].json}` | 過疎×医療 掛け合わせ (サマリ + 県別詳細) |
| `/gis-cross/sunshine-map` | `app/gis-cross/sunshine-map/{raster.png,meta.json}` | 日照地図ラスター + メタ |
| 内部計算データ（URL なし） | `app/correlation/by-ranking-key/[key].json` | 相関データ（例外） |
| **観測値ストア** (Phase 6 で D1 から移行) | `app/stats/<metric>/values.json` (都道府県) | 47 県 × 全年 |
| 同上 | `app/stats/<metric>/cities.json` | 市区町村 × 全年 |
| 同上 | `app/stats/<metric>/ports.json` | 港湾 × 全年 |
| 同上 | `app/stats/<metric>/migration-flow-<year>.json` | ペア観測 (pref ↔ pref) |

## ルート直下に置くもの（非 URL データ）

| ディレクトリ | 内容 | 理由 |
|---|---|---|
| `gis/` | 生 GIS ファイル・タイルセット（mlit-ksj 等） | web app の snapshot fetch 経路とは別 |
| `ges/` | Google Earth Studio 動画出力 | URL なし、非 Web アプリデータ |
| `sns/` | SNS サムネイル / 投稿用素材 | Web アプリの fetch 対象外 |
| `video/` | YouTube/web 埋め込み用 master 動画 + メタ | `/archive-remotion-output` で集約 |

## 動画関連の特殊ルール

Remotion build 時に必要な統計データ JSON は **`apps/remotion/public/<feature>/`** に置く (R2 ではなく git tracked)。理由: Remotion の Webpack bundle が `staticFile()` で読み込むため。これらは **git TS / R2 を入力に再生成される派生物**（完全DBレス: 永続 D1 は SSOT ではない）。

動画 master / SNS 用 47 分割は R2 に保存:
- `video/<slug>/master.mp4` — YouTube アップロード後の master + メタ (description / thumbnail)
- `sns/<slug>/<region>.mp4` — 47 県分割 reel など、再投稿候補

## 既存キーの移行状態

| 旧キー | 新キー | 状態 |
|---|---|---|
| `ranking-items/all.json` | `app/home/featured.json` + `app/category/[key]/items.json` + `app/ranking/[key]/item.json` + `app/survey/[key]/items.json` に分割 | 移行待ち |
| `surveys/all.json` | `app/survey/all.json` | ✅ 完了 |
| `area-profile/[code].json` | `app/areas/[code]/profile.json` | ✅ 完了 |
| `ranking/[key]/values.json` | `app/ranking/[key]/values.json` | ✅ 完了 |
| `ranking/[key]/ai-content.json` | `app/ranking/[key]/ai-content.json` | ✅ 完了 |
| `ranking/[key]/page-cards.json` | `app/ranking/[key]/page-cards.json` | ✅ 完了 |
| `blog/[slug]/...` | `app/blog/[slug]/...` | ✅ 完了 |
| `correlation/by-ranking-key/[key].json` | `app/correlation/by-ranking-key/[key].json` | ✅ 完了 |

## JSON ファイル命名規則

| ページの性質 | ファイル名 |
|---|---|
| 1件のリソース詳細 | `item.json` / `profile.json` |
| 一覧・複数件 | `items.json` |
| URL なし内部データ（例外のみ） | `all.json` |

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
