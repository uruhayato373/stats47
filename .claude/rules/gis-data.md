# GIS データ規約 (国土数値情報 KSJ / 完全DBレス)

国土交通省「国土数値情報 (KSJ)」GIS データの取り込み・管理・配信の**単一ソース (SSOT)**。
GIS を扱う agent (`gis-curator` / `gis-pipeline-runner`) / 人間はこれに従う。検証は型チェック +
`seed-from-registry.ts --dry-run`。

> 背景: 純メタが永続/ローカル D1 `gis_datasets` に寄せられ「新規は手動 INSERT」だった (旧 plan
> stateless-stargazing-teapot Phase 2)。これは完全DBレス doctrine と矛盾し SQLite を消すとメタが
> 失われた。2026-06-21 にメタを git TS (`datasets.ts`) に戻し DBレス化。正典: `docs/01_技術設計/12_完全DBレス設計.md`。

## SSOT 構造 (どのデータがどこにあるか)

| データ | SSOT | 形 | 備考 |
|---|---|---|---|
| 登録データセットのメタ + ranking 定義 | **`packages/gis/src/mlit-ksj/datasets.ts`** (git TS) | `GIS_DATASETS: GisDatasetMeta[]` | name/category/geometryType/coverage/license/stats47Category/isRankingTarget/rankingConfig/latestVersion |
| pipeline 技術設定 | **`packages/gis/src/mlit-ksj/registry.ts`** (git TS) | `KSJ_CODE_CONFIG: Map` | downloadUrlPattern/geojsonDirInZip/propertyMap/simplifyOptions |
| 候補メタの superset (126 件) | `packages/database/seed/ksj-catalog.json` (git) | JSON snapshot | jpksj-api フォールバック。`seed-ksj-catalog.ts` が status='available' で投入 |
| 配信 GIS データ (TopoJSON 等) | **R2** `gis/mlit-ksj/{dataId}/{version}/` | topojson/png | 本番アプリ・Remotion が読む |
| ランキング観測値 | **R2** `app/ranking/<key>/values.json` | JSON | GIS ranking も他 metric と同じ R2 配信 |
| 使い捨てビルドキャッシュ | `packages/database/.data/stats47.sqlite` の `gis_datasets` テーブル | SQLite | **SSOT ではない**。git TS から再生成可能。git 管理外 |

**「D1 gis_datasets」= 上記ローカル使い捨て SQLite** であり Cloudflare 永続/リモート D1 ではない (廃止済)。
build state (r2_version / file_count / converted_at / last_imported_at / status='imported') は pipeline
実行時に SQLite へ書かれる ephemeral で、SSOT には持たない。`name_en` は KSJ API 非提供のため空 (display 専用)。

## データフロー

```
datasets.ts (メタ SSOT) + registry.ts (技術設定) + ksj-catalog.json (候補)
  │  seed-ksj-catalog.ts        → SQLite に候補 126 件を status='available' で INSERT
  │  seed-from-registry.ts      → SQLite に登録 42 件を UPSERT (available→registered 昇格・ranking 設定)
  ▼
使い捨て SQLite gis_datasets (再生成可能なビルドキャッシュ)
  │  run-pipeline.ts <dataId>   → KSJ zip download → TopoJSON 変換 → R2 へ保存 + build state を SQLite に UPDATE
  ▼
R2 gis/mlit-ksj/{dataId}/{version}/  →  本番アプリ / Remotion が fetch (DB query しない)
```

## 新規データセット追加手順 (★手動 SQLite INSERT は禁止)

1. `datasets.ts` の `GIS_DATASETS` にエントリ追加 (メタ + ranking 定義)
2. `registry.ts` の `KSJ_CODE_CONFIG` に技術設定 (downloadUrlPattern 等) 追加
3. `npx tsx packages/gis/src/mlit-ksj/scripts/seed-from-registry.ts` で SQLite を git TS から再 seed
4. `npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts <dataId>` で download→変換→R2
5. R2 push が要る場合は `r2-publisher` に委譲

> ranking 定義 (`rankingConfig`) は datasets.ts に統合済 (旧 `seed-from-registry.ts` の RANKINGS 配列は廃止)。
> ranking 対象は `isRankingTarget: true` + `rankingConfig[]` を持たせる。年は 4 桁 (`yearCode`、estat-api.md 準拠)。

## DBレス integrity (やってはいけないこと)

| NG | OK |
|---|---|
| ローカル SQLite に手動 INSERT して「真実源」にする | `datasets.ts` を編集して再 seed |
| 永続/リモート D1 を GIS の SSOT として復活させる | git TS (datasets.ts/registry.ts) + R2 |
| build state (r2_version 等) を git TS に焼き込む | pipeline 実行で SQLite に再生成 |
| 本番アプリから gis_datasets を query | R2 `gis/mlit-ksj/...` を fetch |
| 手編集の生成表を真実源にする | 登録一覧は `datasets.ts` (git TS) が真実源 (旧 doc 04/generate-docs は 2026-07-12 廃止) |

## 検証

```bash
# datasets.ts の構造 + 件数 (SQLite 不要)
npx tsx packages/gis/src/mlit-ksj/scripts/seed-from-registry.ts --dry-run
# 型
npx tsc --noEmit -p packages/gis/tsconfig.json
```

## 役割分担 (agent)

| agent | 責務 |
|---|---|
| `gis-curator` | datasets.ts / registry.ts の SSOT 管理、データセット lifecycle (register/deprecate)、メタ整合、本ルール・`packages/gis/src/mlit-ksj/README.md` (モジュール設計) の維持 |
| `gis-pipeline-runner` | seed + run-pipeline (download→TopoJSON→R2)、build state、KSJ fetch。R2 push は `r2-publisher` に委譲 |

観測値投入 (e-Stat) は `data-ingester`、R2 push は `r2-publisher`、snapshot 派生は `snapshot-exporter` に委譲する。

## 関連

- 型: `packages/gis/src/mlit-ksj/types.ts` (`KsjCategory`/`KsjGeometryType`/`KsjCoverage`/`KsjLicense`)
- メタ SSOT: `packages/gis/src/mlit-ksj/datasets.ts`
- 技術設定: `packages/gis/src/mlit-ksj/registry.ts`
- seed: `packages/gis/src/mlit-ksj/scripts/{seed-from-registry,seed-ksj-catalog}.ts`
- pipeline: `packages/gis/src/mlit-ksj/scripts/run-pipeline.ts`
- スキル: `.claude/skills/db/fetch-mlit-ksj/SKILL.md`
- SNS バズ地図での消費 (KSJ topojson → 点プロット/点→自治体カード): `.claude/rules/buzz-map-standards.md` §4 `ksj`/`mlit-dpf` レーン
- モジュール設計・使い方: `packages/gis/src/mlit-ksj/README.md` / 登録一覧の真実源: `datasets.ts`
- データ層: `docs/01_技術設計/12_完全DBレス設計.md` / `.claude/rules/data-sqlite-ssot.md`
