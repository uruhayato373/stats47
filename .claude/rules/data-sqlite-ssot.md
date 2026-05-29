# データ管理アーキテクチャ (Phase 6 後)

stats47 の data layer は **3 つの役割分担** で構成される。それぞれの真実源 (SSOT) と用途が異なる。

> ## 用語: 「ローカルビルド DB (SQLite)」≠ Cloudflare D1
>
> 本ドキュメント (および各 skill / agent) で歴史的に **「D1」** と呼んでいるものは、現在は **Cloudflare D1 サービスではない**:
> - 本番 D1 binding は Phase 8 で削除済み。リモート D1 は 2026-04-29 に解約済み (残数 0)。本番 Web app は **R2 snapshot のみ**読む (D1 を一切 query しない)。
> - 残っているのは **ローカルの SQLite ファイル 1 個** = 「ローカルビルド DB」。SSOT (TS-config / R2 / e-Stat) から **再生成可能なビルド時派生キャッシュ**であり、同時に `area_profiles` / `theme_metrics` / correlations / `estat_catalog` 検索の **集計・計算エンジン**でもある。
> - 以降の表で **「D1」列は「ローカルビルド DB (SQLite)」を指す** と読み替えること。

## 役割分担

| Layer | 配置 | 内容 | 真実源? |
|---|---|---|---|
| **TS-config** | `packages/data-configs/src/metrics/<key>.ts` | metric メタ (title / source / entities / years 等) | **✅ SSOT** |
| **R2** | `app/stats/<metric>/<entity>.json` | 観測値 (47 県 / 市区町村 / 港 / pair) | **✅ 値の SSOT** |
| **ローカルビルド DB (SQLite)** | `metrics`, `prefectures`, `cities`, `articles`, `area_profiles` 等 | クエリ高速化 cache + 運用エンティティ + 集計エンジン | ❌ 派生 (cache) |

ローカルビルド DB は **「観測値のストレージ」ではなく「メタ + 運用エンティティの index」** である。観測値そのものは R2 にあり、ローカルビルド DB にはない。

## なぜこの設計か

Phase 1-4 で「D1 を SSOT として全データを集約」する方向で実装したが、5.5M 行の観測値が積まれて D1 が 15GB に肥大化 (Cloudflare D1 上限 10GB 超え)。観測値への query は事実上すべて `WHERE metric=? AND area=? AND year=?` の key-value lookup で、SQL JOIN の利益ゼロ。

Phase 6 (2026-05-27) で観測値を R2 JSON に全面移行し、D1 を 336MB まで縮小した。詳細: `~/.claude/plans/synthetic-zooming-yeti.md`

## D1 に置くもの (メタ + 運用エンティティ)

| テーブル | 役割 |
|---|---|
| `metrics` (2,207 rows) | metric メタの cache。TS-config から `/sync-metrics-cache` で再構築 |
| `sources` (155) | データ出所 |
| `prefectures` (47), `cities` (2,701) | エリアマスタ |
| `area_profiles` (23,366) | 県別 strength/weakness 集計 |
| `categories` (17), `themes` (24), `theme_metrics` (284) | 分類 / ダッシュボード config |
| `page_components` (411) | チャート config |
| `articles` (196), `affiliate_ads` (24), `sns_posts` (549) | コンテンツ・運用 |
| `estat_metainfo` (8,900), `estat_catalog` (196,027) | e-Stat カタログ |
| `gis_datasets` (127), `ports` (699), `fishing_ports` (2,896) | 静的マスタ |

## R2 に置くもの (観測値 + 派生 snapshot)

| R2 key | 内容 |
|---|---|
| `app/stats/<metric>/values.json` | 都道府県観測値 (全年) |
| `app/stats/<metric>/cities.json` | 市区町村観測値 (全年) |
| `app/stats/<metric>/ports.json` | 港湾観測値 |
| `app/stats/<metric>/migration-flow-<year>.json` | ペア観測 (pref ↔ pref) |
| `app/ranking/<key>/values.json` 等 | Web page 別 snapshot (D1 派生) |
| `app/areas/<code>/profile.json` | area profile snapshot |
| `app/correlation/top-pairs.json` | 計算済相関 top |

## 禁止事項

| NG | OK |
|---|---|
| `packages/data-configs/src/metrics/` を bypass して D1 に直接 INSERT | TS file を編集 → `/sync-metrics-cache --apply` |
| `app/stats/<metric>/*.json` を手で編集 | `/page-data-batch --metric <key>` で再生成 |
| D1 に `stats_*` テーブルを再追加 | R2 で per-metric file を追加 |
| Remotion render 時に e-Stat を直接叩く | build 前に `/page-data-batch` で R2 更新 |
| Web app から本番 D1 を読む | R2 snapshot 経由 (`fetchFromR2AsJson`) |

## データ取り込みフロー (新規 metric 追加)

```
1. packages/data-configs/src/metrics/<new-key>.ts 新規作成
2. /sync-metrics-cache --apply        # D1 metrics に index 追加
3. /page-data-batch --metric <new-key># e-Stat → R2 直行
4. /push-r2 --prefix app/stats        # 本番 R2 反映
5. /sync-snapshots                    # 派生 snapshot (area-profile 等) 更新
```

## D1 に書き込み可能な経路 (許可リスト)

| skill | 書込対象 |
|---|---|
| `/sync-metrics-cache` | `metrics` |
| `/sync-articles` | `articles`, `taggings` |
| `/populate-component-data` | `page_components` |
| `/register-affiliate-banner` | `affiliate_ads` |
| 各 area-profile / theme batch | `area_profiles`, `theme_metrics` |

上記以外で D1 に直接 INSERT する skill / script は禁止 (PR レビューで reject)。

## 例外: 計算 intermediate

correlations は計算時に stats_* JOIN が必要だが、結果は R2 snapshot 配信のみ。`/recompute-correlations` (新 skill) が:
1. R2 から stats を読み込み → D1 に temp テーブル化
2. JOIN で Pearson r 計算 → R2 snapshot 書き出し
3. temp テーブル DROP + VACUUM

普段 D1 に correlation 値は持たない。

## 関連

- 親 plan: `~/.claude/plans/synthetic-zooming-yeti.md` (Phase 1-6 設計)
- Phase 6.7 整理 plan: `~/.claude/plans/drifting-cuddling-blossom.md`
- **Phase 6 deprecation log**: `docs/01_技術設計/14_Phase6_deprecation_log.md` (2026-05-28 削除した skill / agent 一覧 + Phase 7 残課題)
- TS-config 詳細: `packages/data-configs/src/types.ts`
- R2 stats 型: `packages/stats-r2/src/types.ts`
- 関連 skill: `/page-data-batch`, `/sync-metrics-cache`, `/recompute-correlations` (stub, Phase 7 実装)
