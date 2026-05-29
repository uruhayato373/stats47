---
type: migration-plan
date: 2026-05-29
status: draft
target: 完全DBレス移行 + 不要DB結合コード削除
related:
  - docs/01_技術設計/18_データ層ハイブリッド設計.md
  - docs/01_技術設計/17_リモートD1ハイブリッド設計.md
  - docs/01_技術設計/14_Phase6_deprecation_log.md
method: read-only 5領域並列棚卸し (workflow dbless-inventory-plan)
stats: 200 items / KEEP 102・EDIT 32・DELETE 30・MOVE_TO_EPHEMERAL 14・INVESTIGATE 19・MOVE_TO_GIT_TS 3 / 正典18矛盾 12
tags: [architecture, dbless, d1, r2, migration, inventory]
---

# 完全DBレス移行・削除計画 (read-only棚卸し結果)

## 0. 結論サマリ

- **完全DBレスは「技術的には9割方可能、ただし正典18と正面衝突する」**。本番app実行時はすでにR2 readerのみで永続D1を読んでおらず（Phase 8でD1 binding削除済み、CI gateで再発防止）、配信層は変更不要。残る永続D1依存は「オーサリング・運用エンティティ（page_components/themes/theme_metrics/sns_posts/affiliate_ads/categories）」「Derived集計（area_profiles/correlations）」「seed/exporterパイプライン」の3塊。
- **消す**: 観測値D1書き込み系（`upsert-ranking-values`等stats書込）、相関D1バッチ（実装は既に廃止）、リモートD1seed runbook、無効な`packages/database/wrangler.toml`（解約済`test-db`を指す）、ローカルseed投入スクリプト群。
- **直す**: Derivedをエフェメラル計算化（area_profile/correlation/ranking-value/normalization/search-index/remotion 4 exporter）、metricsをgit TS registry直読みに、exporter群のD1 readを剥がす。
- **残す**: R2 reader（@stats47/stats-r2, correlation reader, ranking-value-from-r2等）、git TS定義（data-configs registry, theme-page-component-additions.ts）、R2 I/O skill（push/pull/r2-du/page-data-batch）、Drizzle schema定義（git版管理の型ソースとして）。
- **最大の障壁 = 正典18**: 2026-05-29採択の正典18が**完全DBレス化を明示的に却下**し、上記6エンティティを「リモートD1がSSOT」と規定。これを覆さない限り、該当エンティティのD1経路削除は規約違反になる。**先にオーナーが正典18を改訂するか否かを決めることが、全DELETE/MOVEの前提条件**。

## 1. 正典18との矛盾 (オーナー判断が必要)

棚卸しJSONで `contradictsCanonical=true` が立った全項目。これらは正典18を改訂しない限り実行できない。

| パス | verdict | 正典18は何と言うか | 完全DBレスでどうなるか | 判断ポイント |
|---|---|---|---|---|
| `docs/01_技術設計/18_データ層ハイブリッド設計.md` | EDIT | 自身が「完全DBレス却下」「6エンティティはリモートD1 SSOT」(§3決定表) を規定 | 全面改訂が必要。リモートD1の位置づけを削除しgit TS+R2+エフェメラルに置換 | **これを改訂するか否かが全ての起点**。改訂しないなら以下のtrue項目は全てKEEP/EDIT(remote D1対応)に倒れる |
| `CLAUDE.md` | EDIT | §4「データ層はハイブリッド…リモートD1がSSOT」「D1セットアップ・CRUDはローカル(Mac)」 | 「リモートD1不要」「クラウド/ローカル共にgit TS+R2直接で完結」に書換 | プロジェクト憲法の変更。全agent/skill/開発者の行動に波及 |
| `apps/web/scripts/seed-theme-page-components.ts` | DELETE | §5標準フロー②「seed→D1(ローカルで冪等投入)」 | seedパイプライン廃止。git TS→R2直接反映(`sync-theme-additions-to-r2.ts`)に一本化 | page_componentsの「関係・横断クエリ」をR2 JSONで運用できるか |
| `apps/web/scripts/seed-local-finance-page-components.ts` | DELETE | 同上(page_components seed) | 同上 | 同上 |
| `apps/web/scripts/export-page-components-snapshot.ts` | DELETE | §5標準フロー③「D1→R2 export」 | D1 exporter廃止。git TS→R2直接反映へ統一 | page_componentsの再現可能性を「D1冪等seed」ではなく「git TS」だけで担保できるか |
| `apps/web/scripts/export-affiliate-ads-snapshot.ts` | EDIT | §3「affiliate_ads = リモートD1 SSOT」 | DELETE(完全DBレス) or remote D1 exporter化(ハイブリッド維持) | affiliate_adsの位置/ターゲティングCRUDをどこで行うか(git TS昇格 or R2直接オーサリングUI) |
| `apps/web/scripts/export-themes-snapshot.ts` | EDIT | §3「themes/theme_metrics = リモートD1 SSOT」 | DELETE or remote D1 exporter化 | テーマ設定オーサリングの代替経路 |
| `.claude/skills/db/populate-component-data/SKILL.md` | DELETE | §3 component系=リモートD1。component_dataは「Tier B=リモートのみ」(SKILL.md確認済、schema未定義) | component_data自体を廃止し、component_propsをgit TS定義 or R2 cache JSON化 | composition-chartのデータ源をどこにするか |
| `.claude/skills/db/verify-component-data/SKILL.md` | DELETE | 同上(component_data前提) | git TS schema↔R2値の整合チェックに置換 | 同上 |
| `wrangler.toml D1 bindings (apps/web ローカルbinding)` | EDIT | §4「ローカルbindingはバッチ実行に必要」 | リモートD1廃止時は削除、正典18維持時は保留 | 本番bindingは削除済み。ローカルbinding削除は開発自由度低下 |

**注**: 棚卸しJSONには同一subsystemで `packages/database/src/schema/page_components.ts` 等を「KEEP / contradictsCanonical=false」(schemaはgit版管理ソース)とした項目と、「EDIT / contradictsCanonical=true」とした項目が混在する。**schema定義ファイル自体の保持は矛盾しない**(型・version control用)。矛盾するのは「D1経路(seed/exporter/CRUD)の削除」のみ。両者を混同しないこと。

## 2. 削除対象 (DELETE)

正典18を改訂する前提で完全DBレス化する場合のファイル単位リスト。`contradictsCanonical=true` のものは§1の判断後にのみ実行可。

| パス | 役割 | 削除理由 | blast radius |
|---|---|---|---|
| `packages/ai-content/src/repositories/upsert-ranking-ai-content.ts` | AI content D1 write | DBレスではgit TS or R2直接write | 呼び出し元をgit TS/R2 writeに移行要 |
| `packages/area-profile/src/repositories/get-area-profile-count.ts` | area profile D1 query | R2 snapshot cardinalityで代替 | profile count参照箇所 |
| `packages/area-profile/src/repositories/get-area-profile.ts` | area profile D1 query | R2 snapshot読みのみに | 個別profile取得 |
| `packages/area-profile/src/repositories/list-area-profile-rankings.ts` | D1 query | R2 reader代替 | ranking一覧 |
| `packages/area-profile/src/repositories/list-area-profile-summaries.ts` | D1集計query | precomputed R2 snapshot使用 | summary endpoint |
| `packages/area-profile/src/repositories/replace-area-profile-rankings.ts` | D1 write | Derivedはエフェメラル/batch計算 | admin/batch更新 |
| `packages/area-profile/src/repositories/replace-city-profile-rankings.ts` | D1 write | 同上 | city profile更新 |
| `packages/ranking/src/repositories/metric/find-metric-by-key-and-area-type.ts` | metric D1 query | git TS registry/R2で代替 | metric lookup |
| `packages/ranking/src/repositories/ranking-item/find-ranking-item.ts` | D1 query | R2 snapshot reader代替 | 個別ranking item |
| `packages/ranking/src/repositories/ranking-value/list-ranking-values.ts` | stats D1 query | observationsはR2のみ | ranking value一覧 |
| `packages/ranking/src/repositories/ranking-value/upsert-ranking-values.ts` | stats D1 write | **正典18 §8「観測値は二度と永続DBに入れない」**。R2書込のみ | 全stats書込経路 |
| `packages/stats-r2/src/scripts/export-stats-to-r2.ts` | D1→R2 stats exporter | observationsはR2-native化(e-Stat→R2直行)後は一回限り移行ツール | stats export(代替=page-data-batch) |
| `.claude/skills/db/populate-component-data/SKILL.md` | リモートD1 component投入 | §1 (contradicts) | composition-chart data |
| `.claude/skills/db/verify-component-data/SKILL.md` | component_data検証 | §1 (contradicts) | freshness監視 |
| `.claude/skills/db/sync-metrics-cache/SKILL.md` | TS→D1 metrics cache同期 | git TS registryがSSOTで十分、cache不要 | metric discovery高速化(cache層喪失) |
| `.claude/agents/db-schema-manager.md` | Drizzle schema↔D1管理 | D1スキーマ運用自体が廃止 | migration pipeline, local dev DB setup |
| `.claude/hooks/check-local-db.js` | ローカルSQLite存在チェックhook | DBレスでローカルSQLite不要(エフェメラル時のみ一時) | session起動メッセージ(開発UX) |
| `apps/remotion/scripts/exporters/_shared/d1-client.ts` | remotion D1接続util | remotion exporterのエフェメラル化に伴い不要 | remotion全exporterが依存→同時改修 |
| `apps/web/scripts/seed-theme-page-components.ts` | page_components seed | §1 (contradicts) | テーマ投入フロー |
| `apps/web/scripts/seed-local-finance-page-components.ts` | page_components seed | §1 (contradicts) | local-finance投入 |
| `apps/web/scripts/export-page-components-snapshot.ts` | page_components D1→R2 | §1 (contradicts) | page_components配信経路 |
| `docs/01_技術設計/17_リモートD1ハイブリッド設計.md` | 旧正典(superseded) | 正典18に統合済で廃止。セットアップ手順は要なら`archives/`へ | リンク参照のみ |
| `packages/database/seed/README.md` | リモートD1 seed runbook | リモートD1解約済(2026-04-29)。誤セットアップリスク削減 | 開発者runbook(要なら`archives/`) |
| `packages/database/wrangler.toml` | DB scripts用binding(`test-db`) | 解約済の存在しない`test-db`を指す(確認済)。無用 | packages/database CI/test実行方法 |
| `packages/database/drizzle/*.sql` (migrations 52本) | D1 migration履歴 | 永続D1廃止で全廃 | D1管理pipeline全廃 ※schema定義保持時は要再検討(下記注) |
| `.claude/skills/db/run-correlation-batch/SKILL.md` | 相関batch(D1) | Phase 7で実装削除済・correlationsテーブルDROP済(歴史記録のみ残存) | なし(既に廃止) |

**DELETE時の注意（棚卸しの矛盾点を明示）**: `packages/database/drizzle/*.sql` を「DELETE」とした項目がある一方、別subsystemは同migration群を「KEEP(schema再現性に必須)」としている。**schema定義(`src/schema/*.ts`)をgit型ソースとして残す方針なら、migrationもdrizzle-kitの整合性維持のため残すべき**。完全に消すのは「D1永続を一切建てない(local SQLiteも使わない)」を確定した後。§7で再確認。

## 3. 改修対象 (EDIT / MOVE_TO_GIT_TS / MOVE_TO_EPHEMERAL)

| パス | verdict | 何をどう変えるか | blast radius |
|---|---|---|---|
| `packages/area-profile/src/exporters/area-profile-snapshot.ts` | MOVE_TO_EPHEMERAL | D1 JOINを`:memory:` SQLite/DuckDBでR2観測値読み込み計算→R2書出に | area profile snapshot生成 |
| `packages/area-profile/src/exporters/city-profile-snapshot.ts` | MOVE_TO_EPHEMERAL | 同上(city rankings) | city profile pipeline |
| `packages/ranking/src/services/calculate-ranking-values.ts` | MOVE_TO_EPHEMERAL | ranking value計算をエフェメラルSQL(R2読み)→R2に | ranking value計算 |
| `packages/ranking/src/services/compute-normalization.ts` | MOVE_TO_EPHEMERAL | normalization計算をエフェメラル化 | normalization pipeline |
| `apps/web/scripts/export-blog-snapshot.ts` | MOVE_TO_EPHEMERAL | articles(Reference, md再生成可)をエフェメラル計算化 | blog snapshot生成 |
| `apps/web/scripts/export-ranking-page-cards-snapshot.ts` | MOVE_TO_EPHEMERAL | ranking_items(Reference)をエフェメラル化 | ranking card snapshot |
| `apps/web/scripts/generate-search-index.ts` | MOVE_TO_EPHEMERAL | static bundle生成をエフェメラルSQL/registry読みに | 検索インデックス生成 |
| `apps/remotion/scripts/exporters/migration-flow.ts` | MOVE_TO_EPHEMERAL | observationsからR2+in-memory計算 | remotion migration動画 |
| `apps/remotion/scripts/exporters/station-passengers.ts` | MOVE_TO_EPHEMERAL | observationsから計算 | remotion station動画 |
| `apps/remotion/scripts/exporters/population-yoy-47.ts` | MOVE_TO_EPHEMERAL | observationsから計算 | remotion population動画 |
| `apps/remotion/scripts/exporters/master.ts` | MOVE_TO_EPHEMERAL | master registry(git TS)から計算 | remotion master |
| `apps/ges/scripts/generate-port-projects.ts` | MOVE_TO_EPHEMERAL | ports(Reference)をR2+in-memory化 | GESプロジェクト生成 |
| `apps/web/scripts/generate-known-ranking-keys.ts` | MOVE_TO_GIT_TS | D1 SELECT→metrics registry walkで生成 | middleware Fix 6(410 guard), routing |
| `apps/web/scripts/generate-known-tag-keys.ts` | MOVE_TO_GIT_TS | D1 SELECT→categories registryで生成 | tag key SSOT |
| `.claude/skills/db/generate-known-ranking-keys/SKILL.md` | EDIT | git TS registry walkerに改修(CI環境でもgit TS利用可) | middleware Fix 6, dynamic routing |
| `packages/database/seed/*.json` | MOVE_TO_GIT_TS | articlesはmdがSSOT。seed不要化 | seed pipeline廃止 |
| `apps/remotion/scripts/export-d1-to-remotion-static.ts` | EDIT | 各exporterのエフェメラル化に伴い入出力シグネチャ変更 | remotion全pipelineインターフェース |
| `.claude/skills/db/export-d1-to-remotion-static/SKILL.md` | EDIT | prefectures/cities masterをgit TS/R2 JSON化、エフェメラルD1 rebuildで動作 | remotion動画レンダリング |
| `.claude/skills/db/sync-snapshots/SKILL.md` | EDIT | 各exporterのD1 read廃止(git TS+R2値直読)。orchestrationは残す | 全snapshot更新, ISR refresh |
| `.claude/skills/db/sync-articles/SKILL.md` | EDIT | D1 articlesテーブル廃止、R2 frontmatterのみで運用 | blog routing, article metadata |
| `.claude/skills/db/verify-d1-integrity/SKILL.md` | EDIT | D1メタ層検証廃止→git TS registry↔R2観測値検証に(Phase 7計画済) | pre-snapshot validation, weekly audit |
| `.claude/scripts/db/verify-d1-integrity.mjs` | EDIT | better-sqlite3直読→git TS walker+R2 samplerに | CI pre-snapshot checks |
| `.claude/agents/data-ingester.md` | EDIT | metrics cache役割廃止。責務を「R2値投入+verification」に集約 | metric indexing/discovery(cache喪失) |
| `.claude/agents/snapshot-exporter.md` | EDIT | 各exporterのD1 read廃止→git TS+R2値直読。orchestration層はR2 validatorに | snapshot build pipeline |
| `packages/ai-content/src/exporters/ranking-ai-content-snapshot.ts` | EDIT | D1 JOIN→git TS/R2読みに | snapshot生成pipeline |
| `packages/ai-content/src/repositories/find-ranking-ai-content.ts` | EDIT | D1 query→R2 reader pattern | client fallback |
| `packages/category/src/exporters/categories-snapshot.ts` | EDIT | git TS seed fallback対応(またはremote D1維持) | categories snapshot |
| `packages/ranking/src/exporters/surveys-snapshot.ts` | EDIT | sources/surveys。git TS seed維持 or git TS直読 | surveys snapshot |
| `packages/ranking/src/exporters/ranking-items-snapshot.ts` | EDIT | metrics(git TS SSOT想定)→registry読みでD1依存除去 | ranking items snapshot |
| `packages/ranking/src/exporters/ranking-items-per-url-snapshot.ts` | EDIT | metrics registry読みに | per-URL snapshot |
| `packages/database/src/server.ts` | DELETE/EDIT | apps/web import 0件(CI gate確認済)。batch/exporter/test依存のみ。完全DBレスでgetDrizzle不要化 | `@stats47/database/server` import先(依存グラフ確認必須) |
| `packages/database/src/index.ts` | EDIT | schema exportsは残置、server.ts削除に伴うexport削除 | package exports全体 |
| `packages/database/package.json` | EDIT | seed:*スクリプト削除。better-sqlite3/drizzle-kit/miniflareはlocal/型生成で要否判定 | install size, build時schema access |
| `packages/database/scripts/* (seed-*/dump/extract/sync)` | MOVE_TO_EPHEMERAL/DELETE | seed投入系削除、migrate-local(schema初期化)は残置可、dump-tables不要化、extract/sync-articlesはR2直接なら残置 | 開発者手動ワークフロー |
| `apps/web/wrangler.toml (ローカルbinding)` | EDIT(§1判断後) | リモートD1廃止確定後にローカルbinding削除可 | ローカルbatch/SSR |
| CI: `.github/workflows/pr-quality-check.yml (D1 Import Gate)` | EDIT | gate削除 or 検索対象をgit-committed Drizzle schemaに限定 | CI gate, Phase 10完了条件 |
| CI: `.github/workflows/data-refresh.yml` | EDIT | `db:pull`/`db:push`削除、e-Stat→R2直行+Derivedエフェメラル→R2に。metric cache行は廃止 | 月次データ更新の中核 |
| CI: `.github/workflows/deploy-workers.yml` | EDIT | 行84のD1権限言及・遺産コメント除去(本番binding削除済) | デプロイCIノイズ除去 |
| docs: `data-storage.md` / `data-sqlite-ssot.md` / `local-environment.md` / `branch-workflow.md` | EDIT | 「ローカルビルドDB」「リモートD1→exporter→R2」前提を git TS+R2+エフェメラルに読み替え | 新規skill設計ガイド, デプロイ手順 |
| `docs/01_技術設計/14_Phase6_deprecation_log.md` | EDIT | Phase 7残課題(A-D)が完全DBレスのメインタスクに。新Phase定義で組み直し | 記録ドキュメント |

## 4. 維持 (KEEP) の要点

DBレス後も中核として残るものをカテゴリ単位で。

- **R2 reader（配信の心臓）**: `packages/stats-r2/src/readers/`, `packages/correlation/src/repositories/read-correlation-{snapshot,by-key}.ts`, `packages/ranking/src/repositories/ranking-value/read-ranking-values-from-r2.ts`, `packages/ranking/src/repositories/survey/read-surveys-snapshot.ts`。すべてD1結合なし、既にDBレス。
- **app実行時コード**: `apps/web/src/features/*/server.ts` はR2 readerのみでD1 query 0件（確認済）。**変更不要**。
- **git TS定義（SSOT）**: `packages/data-configs/src/{metric-meta.ts,registry.ts}`, `apps/web/scripts/theme-page-component-additions.ts`（定義は永続化不要）, `apps/web/scripts/sync-theme-additions-to-r2.ts`（git TS→R2直接反映＝DBレス時の主経路）。
- **R2 I/O skill / agent**: `/page-data-batch`（e-Stat→R2直行）, `/pull-r2`, `/push-r2`, `/r2-du`, `/fetch-mlit-ksj`, `r2-publisher` agent, `packages/r2-storage/src/index.ts`。すべてS3 APIのみ。
- **Drizzle schema定義（型/version control用）**: `packages/database/src/schema/*.ts` は「git TSの一種」として保持（配信R2に影響しない）。エフェメラル計算でtemp tableを建てる際の型ソースにもなる。
- **エフェメラル計算の足場**: `local-adapter.ts`/`noop-adapter.ts`/`client.ts`/`d1-context.ts`/`drizzle.ts` は、Derivedのエフェメラル(`:memory:`)計算に再利用可能。完全に消すと使い捨てDB計算の足場を失うため、**MOVE_TO_EPHEMERALの受け皿として残す**判断が妥当（棚卸しでも全てKEEP）。

## 5. 段階的移行プラン (Phase順)

build/型チェックでgateし「壊さない順」に並べる。各Phaseは独立PR=ロールバック単位。

### Phase A — 死蔵・無効物の除去（最小リスク、矛盾なし）
- **目的**: 既に廃止済/無効な資産を消し、混乱源を断つ。
- **対象**: `packages/database/wrangler.toml`(無効`test-db`), `packages/database/seed/README.md`(解約済runbook→`archives/`), `docs/01_技術設計/17_*.md`(superseded→`archives/`), `.claude/skills/db/run-correlation-batch/`(実装削除済), Phase 7-D orphan scripts(`ingest-migration-flow.ts`/`populate-port-statistics.ts`/`seed-city-ranking-items.ts`)。
- **検証**: `npx tsc --noEmit -p apps/web/tsconfig.json` / `cd apps/remotion && npx tsc --noEmit` / `npm run build`(web)。grepで削除ファイルへの参照0件確認。
- **ロールバック**: ファイル単位revert。
- **リスク**: 低（active呼び出し元なし）。

### Phase B — オーナー判断ゲート（正典18）
- **目的**: §1のtrue項目を進められるか確定。**ここを通過しない限りPhase D以降の該当項目は着手不可**。
- **対象**: `docs/01_技術設計/18_*.md` を改訂（完全DBレス採用）or 据置（ハイブリッド継続）の意思決定。決定をCLAUDE.md §4に反映。
- **検証**: ドキュメントレビューのみ（コード変更なし）。
- **ロールバック**: ドキュメントrevert。
- **リスク**: 設計判断。誤ると後続全Phaseの方向が変わる。

### Phase C — Derivedのエフェメラル計算化（矛盾なし、正典18 §6が許容）
- **目的**: area_profile/correlation/ranking-value/normalizationを`:memory:` SQLite or DuckDB（R2観測値読み）→R2に。観測値書込は一切しない（§8遵守）。
- **対象**: §3のMOVE_TO_EPHEMERAL全件（area-profile/city-profile exporter, calculate-ranking-values, compute-normalization, blog/ranking-page-cards/search-index, remotion 4 exporter, ges port）+ `/recompute-correlations`実装。
- **検証**: 各exporterを単体実行しR2出力をdiff（旧D1 JOIN出力と一致確認）。`npm run build`。Remotionは`preview-remotion`でレンダリング確認。
- **ロールバック**: exporter単位（旧D1版を温存し並走→切替）。
- **リスク**: エフェメラル計算結果がD1 JOIN結果と乖離する可能性→**新旧出力のdiff検証を必須gate**にする。

### Phase D — 観測値・metric D1経路の除去（矛盾なし）
- **目的**: stats書込/metric queryのD1依存を剥がす。
- **対象**: §2の `upsert-ranking-values`/`list-ranking-values`/`find-metric-by-key-and-area-type`/`find-ranking-item`/area-profile repositories、`export-stats-to-r2.ts`（移行完了後）、`/sync-metrics-cache`、`generate-known-ranking-keys`/`generate-known-tag-keys`のregistry化。
- **検証**: CI `pr-quality-check.yml` のD1 Import Gateで`apps/web/src`のD1 import 0件維持。`npx tsc --noEmit`全workspace。
- **ロールバック**: repository単位（reader fallback確認後に削除）。
- **リスク**: 削除前にR2 reader代替が全呼び出し元で動くこと確認（呼び出し元未移行で削除するとruntime失敗）。

### Phase E — Authored/運用エンティティのD1経路除去【Phase B=完全DBレス採用時のみ】
- **目的**: page_components/themes/affiliate_ads/categories/component_dataのseed/exporter/CRUDを廃し、git TS→R2直接反映に一本化。
- **対象**: §1のtrue項目（seed-theme-page-components, seed-local-finance, export-page-components/themes/affiliate-ads snapshot, populate-component-data, verify-component-data, 関連skill/CRUD repos）。
- **検証**: `sync-theme-additions-to-r2.ts`経路でR2反映→該当ページのISR確認（`curl`でHTTP 200 + 内容確認）。`npm run build`。
- **ロールバック**: エンティティ単位。**Phase B据置(ハイブリッド維持)ならこのPhaseは丸ごとスキップ**し、該当exporterをremote D1対応に改修(EDIT)するのみ。
- **リスク**: page_componentsの「関係・横断クエリ」をR2 JSONで運用する新規実装の負担（正典18が懸念した点）。

### Phase F — schema/migration/CI/docsの最終クリーンアップ
- **目的**: 永続D1を完全に建てない確定後、残骸を除去。
- **対象**: `packages/database/src/server.ts`削除（依存グラフ確認後）、`index.ts`/`package.json`調整、`db-schema-manager` agent / `check-local-db.js` hook削除、CI(data-refresh `db:pull/push`削除、D1 Import Gate撤去、deploy-workers遺産除去)、docs(data-storage/data-sqlite-ssot/local-environment/branch-workflow/14_Phase6_log)改訂。schema定義・migrationの最終要否は§7で確定。
- **検証**: フルCI green（`pr-quality-check.yml`）。`npm run build`全workspace。Cloudflare Pagesデプロイ。
- **ロールバック**: develop→main PR単位（CI gateで最終確認）。
- **リスク**: `@stats47/database/server` importの取りこぼし→**削除前に依存グラフ全走査必須**。

## 6. ローカル(Mac)/Cloudflare認証が必要な作業

クラウド完結できず、ローカルMac（wrangler認証/Cloudflare account）が必要な項目（正典18 §4の作業分担に基づく）:

- **D1インスタンスの解約**（Phase 10）: Time Travel 30日窓経過後、Cloudflareダッシュボード or `wrangler`でD1 database削除。クラウドagent不可。
- **本番デプロイ後のCDNパージ**: `/purge-cdn`（Cloudflare API）。CI/手動。
- **エフェメラル計算をローカルで走らせる場合**: 正典18 §4表で「集計のJOINはローカル」。ただしエフェメラル(`:memory:`/DuckDB+R2読み)化すれば「△クラウド可」になる（Phase Cのゴール）。S3 creds(`.env.local`)があればクラウドでも計算可能に。
- **`packages/database/scripts/migrate-local.ts`等**: ローカルSQLite/エフェメラルDB初期化（残置する場合）。
- **wrangler.toml binding削除後のデプロイ検証**: ローカル`next build`で`○ Static`維持確認（`.claude/rules/nextjs-ssg-preservation.md`）。

**クラウドで完結できるもの**（参考）: git TS編集、R2 push/pull（S3直接）、R2 snapshot生成、`sync-theme-additions-to-r2.ts`（git TS→R2直接）。

## 7. 残る未決定事項

`INVESTIGATE` 項目とオーナー確認事項:

- **【最重要】正典18の方針**: 完全DBレス化を採用して正典18を改訂するか、ハイブリッド維持か。これが§1全項目とPhase E実行可否を決める。**他の全判断の前提**。
- **schema定義・migrationの最終要否**: `src/schema/*.ts` を「git型ソース」として残すなら `drizzle/*.sql` migrationも整合性のため残すべき（棚卸しで KEEP/DELETE が割れている）。「永続D1もlocal SQLiteも一切建てない」を確定してから消す。
- **`@stats47/database/server` の依存グラフ**: `getDrizzle`等の実import元（batch/exporter/test）を全走査してからserver.ts削除（apps/webは0件確認済だが他workspace未確認）。
- **e-Stat metadata の分類**: `packages/estat-api/src/meta-info/repositories/d1/{find-by-stats-id,save}.ts`, `warm-cache.ts` — コメントは「R2が真実源」だがコードはD1 query。Reference(API再取得)かD1 cacheか不明。`estat_metainfo`/`estat_catalog`の位置づけ確定要。
- **GIS pipeline**: `packages/gis/src/mlit-ksj/{pipeline.ts,scripts/register-ksj-rankings.ts}` — D1にmetrics+stats書込。git TS metric定義+R2 stats直書きに変えるか要設計。
- **港湾/漁港データ**: `apps/web/scripts/export-{port-statistics,fishing-ports}-snapshot.ts`, `ports`/`fishing_ports`テーブル — SSOT vs Reference の役割未確定。
- **ranking metrics設計の曖昧さ**: metricsが「git TS SSOT」か「D1 SSOT」かが正典18内でも揺れる(§3はReference=TS registryと記載)。git TS確定なら多数のranking repository/exporterがDELETE可、D1維持ならEDIT止まり。
- **ai-content生成スクリプト**: `generate-parallel.ts`/`list-pending.ts`, `ranking-tag/sync-ranking-tags.ts`, `auto-attach-normalization.ts`, `export-master-snapshots.ts`, `sync-ranking-export.ts` — git TS化 or エフェメラル化のどちらに倒すか、上のmetrics設計確定後に判断。
- **`data-configs/scripts/{export-from-d1,sync-metrics-cache}.ts`**: metricsがTS-first確定なら旧D1→TS移行ツールとして役割終了→削除可。