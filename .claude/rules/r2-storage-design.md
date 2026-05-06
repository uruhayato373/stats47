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
| 内部計算データ（URL なし） | `app/correlation/by-ranking-key/[key].json` | 相関データ（例外） |

## ルート直下に置くもの（非 URL データ）

| ディレクトリ | 内容 | 理由 |
|---|---|---|
| `gis/` | 生 GIS ファイル・タイルセット・カタログ | web app の snapshot fetch 経路とは別 |
| `ges/` | Google Earth Studio 動画出力 | URL なし、非 Web アプリデータ |
| `sns/` | SNS サムネイル | Web アプリの fetch 対象外 |

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

// ✅ app/ プレフィックス付き URL 対応パス
saveToR2("app/category/medical/items.json", ...);
saveToR2("app/survey/all.json", ...);
saveToR2("app/areas/47000/profile.json", ...);
saveToR2("app/ranking/key/values.json", ...);

// ✅ キャッシュなし・直接 fetch
async function readCategoryItemsFromR2(categoryKey: string) {
  return fetchFromR2AsJson(`app/category/${categoryKey}/items.json`);
}
```

## 関連ファイル

- `packages/r2-storage/src/scripts/README.md` — R2 操作全般
- `.claude/skills/db/sync-snapshots/SKILL.md` — スナップショット一括更新スキル
- `.claude/agents/db-manager.md` — DB・R2 管理エージェント
