# metric config 標準 (ランキングデータの正典)

`packages/data-configs/src/metrics/<key>.ts` (`MetricConfig`) のフィールド役割と禁止事項の**単一ソース**。
新規 metric 量産・編集する agent / skill / 人間はこれに従う。検査は決定的 lint
`packages/data-configs/scripts/validate-metric-config.ts` (`npm run validate:config`) が担う
(pre-commit / CI `pr-quality-check.yml` に組込済)。

> 背景: subtitle に定義補足とデータ注釈(※)が混在し UI がタイトルに焼き込んでいた、
> `port`/`uncategorized`/`labor`/`local-economy` のような 17 軸外の無効 category が
> `category: string` 型で素通りしていた、等の「同じ間違い」を型 + lint で再発不能にする。

## フィールドの役割 (混ぜない)

| field | 役割 | 入れてよい | 入れてはいけない |
|---|---|---|---|
| `title` (必須) | 正準なランキング名 (h1) | 指標の名前 | **年** (2018年)・**注釈** (※/調査対象外)・subtitle の繰り返し |
| `subtitle?` | 同名指標を区別する短い定義補足 | 「乳用牛(めす)の飼養頭数合計」等の区別子 | title と同一/包含 (冗長)・注釈(※) |
| `note?` | データの注意書き / methodology | 「内陸県は漁港がなく調査対象外 (0で表示)」 | 定義・名前 |
| `description?` | 指標の定義・説明 (散文。「統計の定義」カード) | 出典・定義文 | 注釈(※)・SEO 文 |
| `category` (必須) | e-Stat 機械分類 (17 軸) | `CategoryKey` の 17 キーのいずれか | 17 軸外のキー (型 union でブロック) |
| `unit` (必須) | 単位 | 「人」「百万円」「％」 | 空文字・「‐」「-」(プレースホルダ) |
| `seoTitle?` / `seoDescription?` | SEO 専用 | 検索向け文 | フルタイムコード (2009100000) |

**年は `years` / `latestYear` が持つ。title に焼かない。** UI はデータ年度を別途表示する。

## category キー (17 軸固定)

`landweather` / `population` / `laborwage` / `agriculture` / `miningindustry` / `commercial` /
`economy` / `construction` / `energy` / `tourism` / `educationsports` / `administrativefinancial` /
`safetyenvironment` / `socialsecurity` / `international` / `infrastructure` / `ict`

- SSOT は `packages/data-configs/src/types.ts` の `CATEGORY_KEYS` (型 `CategoryKey`)。表示名/アイコンは
  `categories.ts` の `CATEGORY_DEFS`。
- **`category` は `CategoryKey` union 型なので無効キーはコンパイルエラー**になる。新規キーを増やさない。
- category は「e-Stat 機械分類の内部 backbone」であり、ユーザー向け主要ナビは theme
  (`/themes/*`)。役割分担: `docs/01_技術設計/16_タクソノミー役割分担.md`。

## UI 配置 (この型を前提にした描画)

- `title` → h1 (名前のみ)
- `subtitle` → h1 直下の控えめ 1 行 (`RankingHeroCard` titleDetail)
- `note` → チャート直下の小キャプション (`RankingKeyPageClient`)
- `description` → 「統計の定義」カード (`RankingDefinitionCard`)
- 一覧表 (`category`/`survey`) のタイトルは注釈(※)を連結しない (`isCaveatNote` で除外)

暫定: 専用 `note` フィールド移行が完了するまで、UI は `classifyRankingSubtitle` /
`isCaveatNote` (`apps/web/src/features/ranking/utils/classify-subtitle.ts`) で subtitle 文面から
注釈を判定して振り分ける。**データ側に `note` を分離したらこのヒューリスティックは不要になる。**

## lint の重大度 (validate-metric-config.ts)

| レベル | 対象 | 挙動 |
|---|---|---|
| **error** (CI/pre-commit をブロック) | 無効 category キー / title 年混入 (`title-year`) / title 注釈(※)混入 (`title-note`) / subtitle が注釈(※) (`subtitle-note`) / subtitle が title と冗長 (`subtitle-redundant`) / unit 空・「‐」(`unit`) / 重複 title に区別子なし (`dup-title`) | exit 1 |
| **warn** (表示のみ) | 現在は該当チェックなし (将来の段階的 cleanup 用に tier を温存) | exit 0 |

> **2026-06 昇格済**: 旧 warn だった 5 系統 (title-year/title-note・subtitle-note/redundant・unit・dup-title) は Phase 3 のデータ是正で warn=0 を達成 → **error に昇格**。量産時の再混入を CI/pre-commit でブロックする。新規 cleanup を warn から始めたい場合のみ warn tier を再利用する。

`--strict` で warn も exit 1 (現在 warn は 0 件のため実質 no-op、将来用)。

## 量産時の必須手順 (agent / skill)

新規 metric を作成・編集したら **必ず実行**:

```bash
npm run validate:years  --workspace=@stats47/data-configs   # 年の 4 桁正規化
npm run validate:config --workspace=@stats47/data-configs   # 構造規約 (category 等)
```

警告 (warn) を新たに増やさない。注釈は `note` に、年は `years` に、区別は `subtitle` に置く。

## isActive:true ≠ 本番公開（多段依存・★再発防止 2026-06-03）

`MetricConfig.isActive` を `true` にしただけでは ranking は **本番公開されない**。本番アプリは R2 snapshot と
派生リスト（`KNOWN_RANKING_KEYS` / `SITEMAP_RANKING_KEYS` / `INDEXABLE_RANKING_KEYS` / R2 `app/ranking-items/all.json`）
と整合して初めて 200 を返す。middleware は `isGone(key) || !isKnown(key)` で 410 を返すため、`GONE_RANKING_KEYS`
から外しても `KNOWN_RANKING_KEYS` に無ければ **410 のまま**になる。

公開には config(isActive) を起点に以下を整合再生成する（依存順・詳細手順は memory
`project_ranking_publish_pipeline_gap` / `docs/50_Issues/feature-backlog.md`「122 metric の本番公開」）:

1. R2 `app/ranking-items/all.json` + `app/ranking/<key>/item.json` 再生成（`packages/ranking/src/scripts/generate-ranking-items.ts`。※ 2026-06 時点で sync-snapshots 未配線）
2. `KNOWN_RANKING_KEYS` 再生成（`apps/web/scripts/generate-known-ranking-keys.ts`）
3. `SITEMAP_RANKING_KEYS` / `INDEXABLE_RANKING_KEYS` 再生成
4. 再デプロイ → CDN purge（410 は 7 日キャッシュ）
5. **本番 URL を Googlebot UA で実測**し 200 を確認（`/deploy` Step 7.5）

> 2026-06-03 事故: 122 metric を `isActive:true` 化 + `GONE_RANKING_KEYS` 除去だけ行い、上記 2-5 未反映で
> 全件 410 のまま公開未達だった。「isActive を変えた=公開した」と思い込まないこと。

## 関連

- 型: `packages/data-configs/src/types.ts` (`MetricConfig` / `CategoryKey` / `CATEGORY_KEYS`)
- lint: `packages/data-configs/scripts/validate-metric-config.ts`
- e-Stat 年の正規化: `.claude/rules/estat-api.md`
- タクソノミー役割分担: `docs/01_技術設計/16_タクソノミー役割分担.md`
- UI 振り分け util: `apps/web/src/features/ranking/utils/classify-subtitle.ts`
