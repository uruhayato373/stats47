---
type: migration-spec
date: 2026-05-29
status: active
parent: docs/02_実装計画/dbless-migration-plan-2026-05-29.md
canonical: docs/01_技術設計/19_完全DBレス設計.md
method: 実参照(rg/grep)検証済 — workflow dbless-verify-spec (64 item訂正 / INVESTIGATE 25解決)
tags: [architecture, dbless, migration, spec, verified]
---

# 完全DBレス 実行スペック (実参照検証済)

> 本スペックは棚卸し計画 `docs/02_実装計画/dbless-migration-plan-2026-05-29.md` の §2(DELETE)/§3(EDIT/MOVE)/§7(INVESTIGATE) を、`rg`/`grep` による実参照確認で検証・訂正した結果のみで構成する。推測値は含まない。SSOT = git TS(設定+運用エンティティ) + R2(観測値・配信)。Derived = エフェメラル計算(`:memory:` SQLite/DuckDB で R2 読み)→R2。永続/リモート D1 なし。schema 定義 `.ts` とエフェメラル計算の足場(adapter/client)は型ソースとして残置。

## 0. 検証で訂正された計画ミス

実参照確認の結果、計画の分類が誤っていた item を冒頭にまとめる。これらは計画文をそのまま実行すると CI 破壊・ランタイム失敗を招く。

| パス | 旧 verdict → 新 verdict | 訂正理由(実参照) |
|---|---|---|
| `packages/database/wrangler.toml` | DELETE → **KEEP** | `vitest.config.integration.ts:9` が `configPath: "./wrangler.toml"` で参照。integration test 基盤に必須。計画の「無効な test-db」は誤り(test-db binding 妥当性は別問題だが wrangler.toml 自体は削除不可)。**実参照確認済: configPath 1 件** |
| `.claude/skills/db/run-correlation-batch/SKILL.md` | DELETE(参照なし) → **DELETE(参照元 EDIT 必須)** | 計画の「参照なし」は誤り。`snapshot-exporter.md:15,25` が担当範囲/担当スキル表に明記、`recompute-correlations/SKILL.md:32` が旧 skill として言及。コード実参照は 0(docs のみ)だが、削除時は snapshot-exporter.md の改修を伴う |
| `.claude/agents/snapshot-exporter.md` | (未訂正) → **EDIT(Phase A で先行)** | 上記 run-correlation-batch 削除の参照元。`:15` 担当範囲行、`:25` 担当スキル表行の 2 箇所を recompute-correlations に置換する必要あり |
| `packages/area-profile/src/repositories/get-area-profile.ts` 他 area-profile repo 群 | DELETE → **KEEP(Phase C で exporter ごとエフェメラル化)** | 単純 DELETE 不可。exporter (`area-profile-snapshot.ts` 等) が getDrizzle 経由で参照。D1 read を `:memory:` 計算へ転換する責務分離が必要 |
| `packages/gis/src/mlit-ksj/scripts/register-ksj-rankings.ts` | INVESTIGATE → **EDIT(Phase E)** | D1 `gis_datasets` から `ranking_config` 読込後、metrics+stats を直書き。git TS migration 未実装。blast radius = GIS pipeline。計画は blast radius 明示不足 |
| `packages/estat-api/src/meta-info/repositories/d1/find-by-stats-id.ts` | INVESTIGATE → **EDIT(Phase D, 設計決定待ち)** | 実装が R2 移行途上。コメントと実装が矛盾(コメント「D1 は基本情報のみ」だが実装は D1 query)。R2 primary 化方針なら D1 query 削除可だが `estat_metainfo` table と連動確認必須 |
| `apps/web/scripts/export-affiliate-ads-snapshot.ts` / `export-themes-snapshot.ts` | EDIT(remote D1 対応 or DELETE) → **DELETE(Phase B 改訂待ち, 暫定 PENDING)** | 該当 6 エンティティが §3 で「リモート D1 SSOT」規定。Phase B(正典18改訂)未達なら git TS→R2→DBレス は不能。改訂確定まで EDIT(remote D1 対応)に倒れる |
| `.github/workflows/pr-quality-check.yml` (D1 Import Gate) | EDIT(gate 削除/限定) → **KEEP(変更不要)** | 現 gate 実装は既に正しい(`apps/web/src` に getDrizzle import 0 件を担保)。完全DBレス採用後のみ gate 削除可 |
| `package.json` (root) / `turbo.json` | (検証) → **KEEP(変更不要)** | root scripts に `db:` prefix なし(`db:studio` のみ drizzle-kit、他は `r2:`)。turbo.json に D1 task なし。**実参照確認済: D1 依存 0** |

**第3の発見(計画の過小評価)**: `packages/database/src/server.ts` 削除危険度。計画は「batch/exporter/test 依存のみ」と記載したが、実参照は **6 パッケージ(ai-content/area-profile/category/ranking/estat-api/database) 約 50 ファイル**が getDrizzle import 中。`apps/web/src` は 0 件(正)だが、全 exporter 層の D1 read が生きている。Phase C(exporter エフェメラル化)完全完了まで削除禁止。

## 1. INVESTIGATE の決着

実コードを読んで確定した結論。

| 問い | 結論(根拠) | 確定 verdict |
|---|---|---|
| **metrics SSOT は git TS registry か D1 か?** | `packages/data-configs/src/registry.ts`(AUTOGEN by `scripts/build-registry.ts`)+ `metric-meta.ts`(派生メタ)が SSOT。年範囲・entity list は全て TS enumeration(build-time)で確定。D1 `metrics` テーブルは read-only cache で置換不要。`findMetricByKeyAndAreaType` の **packages/ranking 外部呼び出し 0 件(実参照確認済)**。statistical values(observations)は R2(e-Stat→R2 direct)別系統。 | **metrics SSOT = git TS registry.ts。`find-metric-by-key-and-area-type.ts` は DELETE 確定(Phase D)** |
| **schema/migration(`drizzle/*.sql` 54 件)は schema `.ts` と一緒に削除か残置か?** | schema `.ts` を git 型ソースとして残す方針なら、drizzle.config.ts が schema から生成する migration は drizzle-kit coherence のため残置必須。integration test が migration 経由で schema 検証。blanket 削除は desync リスク。 | **CONDITIONAL_KEEP — §7 schema 残置決定に従う。schema `.ts` 残置なら migration も KEEP(Phase F で最終確定)** |
| **server.ts 削除は独立進行可か Phase D 完了が前提か?** | getDrizzle に約 50 の実 caller。Phase D/C が全 site の D1 依存を除去した後でなければ、削除はそれら module を runtime failure させる。 | **PHASE_DEPENDENCY 確定 — Phase C(exporter エフェメラル化)+ D 完了が server.ts 削除(Phase F)の前提** |
| **`apps/web/src` は本番実行時 D1 import が本当に 0 件か?** | `rg "getDrizzle\|@stats47/database/server" apps/web/src` = **0 件(実参照確認済)**。schema 型 import(ArticleRow 等)のみ。CI gate(pr-quality-check.yml)が担保。 | **CONFIRMED — apps/web/src 実行時 D1 import 0 件** |
| **e-Stat metadata(estat_metainfo)= API 再取得か D1 cache か?** | `find-by-stats-id.ts` の実装が R2 移行途上(コメントと実装が矛盾)。Reference meta は R2 primary 化推奨だが、当該ファイルの役割再定義必須。 | **e-Stat metadata = R2 primary。D1 cache は短期 KEEP→R2 完全移行後 DELETE。現状は find-by-stats-id を改修(R2 read 追加)、即削除見送り** |
| **GIS pipeline(ports/fishing_ports/gis_datasets)= SSOT か Reference か?** | `gis_datasets`(D1)= reference metadata(name/category/geometry_type/ranking_config)。`register-ksj-rankings.ts` が metrics+stats 直書き(廃止対象)。メタは git TS registry 化可能、観測値は R2。 | **GIS metadata = git TS registry 化予定(Phase E)。観測値は R2 直行** |
| **ports/fishing_ports snapshot(観測値 vs reference)?** | `export-port-statistics-snapshot.ts` が `stats`(entity_type=port)観測値を R2 化。ports/fishing_ports メタは Reference。script は package.json scripts 未記載(不活性化中)。`apps/ges/scripts/generate-port-projects.ts` が ports table(port_code/name/grade/lat/lng)を読む。 | **ports observation snapshot = MOVE_TO_EPHEMERAL(Phase C)。metadata table 保持。GES の ports SSOT 定義は別途確認(MLIT KSJ API が座標真実源か)** |
| **CI の db:pull/db:push は Phase C/D で削除可か?** | `data-refresh.yml:71,95` が「R2 から SQLite pull→e-Stat fetch→snapshot 再生成→push」のローカルビルド DB パイプラインに依存。R2+エフェメラルへ置換には全 Derived exporter のエフェメラル化が前提。 | **EDIT は Phase D 終了後(Phase E 手前)。現段階 KEEP** |
| **正典18改訂は全段階の前提か?** | 計画 §1 で「完全DBレス却下・6 エンティティはリモート D1 SSOT」明記。Phase E 関連全項目が contradictsCanonical=true。 | **CONFIRMED — Phase B(正典18改訂)がゲート。改訂なき場合 §1 該当項目は全て KEEP/EDIT(remote D1 対応)に倒れる** |

## 2. Phase別 実行スペック

DELETE は `confirmedDead=true`(実参照 0)のみ「即削除可」。参照ありの DELETE は「参照元改修を伴う EDIT」として分離する。

### Phase A — 死蔵除去

| パス | finalVerdict | confirmedDead | realReferences | 検証コマンド |
|---|---|---|---|---|
| `.claude/skills/db/run-correlation-batch/SKILL.md` | DELETE(参照元 EDIT 必須) | コード=true, docs=参照あり | `snapshot-exporter.md:15,25` / `recompute-correlations/SKILL.md:32` のみ(コード実参照 0) | `rg 'run-correlation-batch' --glob '!**/node_modules/**' -l` → 結果が docs のみ確認済 |
| `.claude/agents/snapshot-exporter.md` | EDIT(先行) | false | `:15`(担当範囲)`:25`(担当スキル表)。run-correlation-batch を recompute-correlations に置換 | `grep -n 'run-correlation-batch\|recompute-correlations' .claude/agents/snapshot-exporter.md` |
| `.claude/hooks/check-local-db.js` | DELETE(即削除可) | **true** | **実参照 0 件**(plan doc のみ。settings.json hookup 未登録) | `rg 'check-local-db' --glob '!**/node_modules/**'` → plan doc のみ確認済 |
| `.claude/agents/r2-publisher.md` | KEEP | false | devops-runner/snapshot-exporter/data-ingester/README/sync-snapshots run.sh。DBレス後も R2 I/O 必須 | `grep -c 'r2-publisher' .claude/agents/README.md` |

**Phase A 完了ゲート**: `rg 'run-correlation-batch\|check-local-db' --glob '!**/docs/**' --glob '!**/node_modules/**'` が 0 件。snapshot-exporter.md の担当スキル表に run-correlation-batch が残らないこと。

### Phase C — Derived エフェメラル化(`:memory:` SQLite/DuckDB で R2 読み→R2)

| パス | finalVerdict | confirmedDead | realReferences | 検証コマンド |
|---|---|---|---|---|
| `packages/area-profile/src/exporters/area-profile-snapshot.ts` | MOVE_TO_EPHEMERAL | false | `:28` getDrizzle 呼び出し。blast radius=snapshot build pipeline | `grep -n 'getDrizzle' packages/area-profile/src/exporters/area-profile-snapshot.ts` |
| `packages/area-profile/src/repositories/get-area-profile.ts`(+ list/replace 群) | KEEP→exporter ごと改修 | false | exporter から参照。fallback/batch 用途で単純 DELETE 不可 | `rg 'from.*@stats47/database/server' packages/area-profile/src -l` |
| `packages/ranking/src/services/calculate-ranking-values.ts` | MOVE_TO_EPHEMERAL | false | `server.ts` export, `fetch-ranking-values-on-demand.ts` で observation 参照 | `grep -n 'getDrizzle\|FROM observations\|FROM ranking_values' packages/ranking/src/services/calculate-ranking-values.ts` |
| `apps/web/scripts/export-blog-snapshot.ts` | MOVE_TO_EPHEMERAL | false | D1 articles(line 11 drizzle/better-sqlite3)→R2。md が真実源、再生成可 | `grep -n 'drizzle.*better-sqlite3' apps/web/scripts/export-blog-snapshot.ts` |
| `apps/web/scripts/export-ranking-page-cards-snapshot.ts` | MOVE_TO_EPHEMERAL | false | D1 ranking_items(line 13)→R2。metric registry + R2 ranking-value で計算可 | `grep -n 'const rows = await db' apps/web/scripts/export-ranking-page-cards-snapshot.ts` |
| `apps/web/scripts/generate-search-index.ts` | MOVE_TO_EPHEMERAL | false | D1 metrics/articles(line 13)→MiniSearch JSON。git TS registry + R2 article meta で再生成可 | `grep -n 'drizzle.*d1' apps/web/scripts/generate-search-index.ts` |
| `apps/web/scripts/export-port-statistics-snapshot.ts` | MOVE_TO_EPHEMERAL | false | ports table(line 21)+ stats entity_type=port(line 31)読み。呼び出し元なし(package.json 未記載) | `grep -r 'export-port-statistics' package.json` |
| `apps/remotion/scripts/exporters/_shared/d1-client.ts` | DELETE(4 exporter 改修後) | false | **4 exporter import 実参照確認済**: station-passengers/migration-flow/population-yoy-47/master | `rg 'd1-client\|openD1' apps/remotion/scripts/exporters -l` → 5 件(client 本体 + 4 importer) |
| `apps/remotion/scripts/exporters/station-passengers.ts` | MOVE_TO_EPHEMERAL | false | `openD1()` + `loadPrefectures(db)` + `readLocalStatsValues()` | `grep -n 'loadPrefectures.*db' apps/remotion/scripts/exporters/station-passengers.ts` |
| `apps/remotion/scripts/exporters/population-yoy-47.ts` | MOVE_TO_EPHEMERAL | false | `openD1()` + prefectures table + `readLocalStatsValues()` | `grep -n 'loadPrefectures' apps/remotion/scripts/exporters/population-yoy-47.ts` |
| `apps/remotion/scripts/exporters/migration-flow.ts` | MOVE_TO_EPHEMERAL | false | `openD1()` + `loadPrefectures(db)` + `readLocalMigrationFlow`/`readLocalStatsValues` | `grep -n 'openD1\|loadPrefectures' apps/remotion/scripts/exporters/migration-flow.ts` |
| `apps/remotion/scripts/exporters/master.ts` | MOVE_TO_EPHEMERAL | false | `openD1()` prefectures 直 SELECT。cities.json scope 外コメントは残置可 | `grep -n 'db.prepare.*prefectures' apps/remotion/scripts/exporters/master.ts` |
| `apps/ges/scripts/generate-port-projects.ts` | MOVE_TO_EPHEMERAL(要 INVESTIGATE) | false | `new Database`(line 130)+ DB_PATH(line 32-35)。ports SSOT 定義未確認 | `grep -n 'new Database' apps/ges/scripts/generate-port-projects.ts` |

**Phase C 完了ゲート**: `cd apps/remotion && npx tsc --noEmit` green。全 exporter が `:memory:`/R2 read 化され `rg 'getDrizzle\|openD1\|new Database' apps/*/scripts apps/remotion/scripts/exporters` がエフェメラルアダプタ経由のみ。各 exporter 出力 JSON の diff が改修前後で一致。

### Phase D — 観測値 metric の D1 除去(git TS registry 化)

| パス | finalVerdict | confirmedDead | realReferences | 検証コマンド |
|---|---|---|---|---|
| `packages/ranking/src/repositories/metric/find-metric-by-key-and-area-type.ts` | DELETE | **true** | `metric/index.ts:1` export 定義のみ。**packages/ranking 外部呼び出し 0 件(実参照確認済)** | `rg 'findMetricByKeyAndAreaType' --glob '!**/packages/ranking/**' --glob '!**/docs/**' --glob '!**/node_modules/**'` → 0 件確認済 |
| `packages/data-configs/src/metric-meta.ts` | KEEP | false | `data-configs/src/index.ts` export。getMetricMeta/listMetricKeysByEntity 複数呼び出し。metrics SSOT 基盤 | `grep -r 'getMetricMeta\|listMetricKeysByEntity' packages/ --include='*.ts'` |
| `.claude/skills/db/sync-metrics-cache/SKILL.md` + `packages/data-configs/scripts/sync-metrics-cache.ts` | DELETE(参照元 EDIT) | false | `data-ingester.md` §1/§3 担当スキル。impl は registry.ts walk→D1 upsert(SSOT が TS なら不要) | `grep -n 'populate-component-data\|sync-metrics-cache' .claude/agents/data-ingester.md` |
| `.claude/skills/db/generate-known-ranking-keys/SKILL.md` + `apps/web/scripts/generate-known-ranking-keys.ts` | EDIT | false | 出力 `apps/web/src/config/known-ranking-keys.ts` を `url-policy.ts`/`indexable-ranking-keys.ts` が参照(実参照確認済)。DELETE 不可 | `rg 'known-ranking-keys' apps/web/src -l` → url-policy.ts/config 2 ファイル確認済 |
| `.claude/scripts/db/verify-d1-integrity.mjs` | EDIT | false | `verify-d1-integrity/SKILL.md` から呼び出し。検証 tool 必要。better-sqlite3 直読→registry walk + R2 sampling へ | `grep -l 'verify-d1-integrity.mjs' .claude/skills/ --include='*.md'` |
| `packages/estat-api/src/meta-info/repositories/d1/find-by-stats-id.ts` | EDIT(設計決定待ち) | false | `estat_metainfo` table 連動。R2 移行途上。R2 read 追加で改修 | `rg 'findMetaInfoByStatsId\|FROM estat_metainfo' packages/ --glob '!**/docs/**'` |
| `.github/workflows/data-refresh.yml`(db:pull/push) | EDIT(Phase D 終了後) | false | `:71` db:pull, `:95` db:push。SQLite パイプライン依存。全 Derived エフェメラル化が前提 | `grep -n 'db:pull\|db:push' .github/workflows/data-refresh.yml` |

**Phase D 完了ゲート**: `find-metric-by-key-and-area-type.ts` 削除後 `npx tsc --noEmit -p apps/web/tsconfig.json` green。`generate-known-ranking-keys.ts` を registry walk 化後、出力 `known-ranking-keys.ts` の diff が 0。metrics 関連 D1 query が registry/R2 経由のみ。

### Phase E — 運用 6 エンティティの D1 除去(Phase B 正典18改訂が前提)

> 全項目 contradictsCanonical=true。Phase B(オーナー正典18改訂判断)が未達なら、これらは KEEP/EDIT(remote D1 対応)に倒れる。改訂確定後に DELETE+registry 化を実行。

| パス | finalVerdict | confirmedDead | realReferences | 検証コマンド |
|---|---|---|---|---|
| `apps/web/scripts/seed-theme-page-components.ts` | DELETE(Phase B 後) | false | 実参照 0(直 import/呼び出しなし)。内部で `./theme-page-component-additions.ts` 参照 | `rg 'seed-theme-page-components' apps/web --glob '*.ts'` |
| `apps/web/scripts/seed-local-finance-page-components.ts` | DELETE | **true** | 実参照 0。手動 seed 専用 | `grep -r 'seed-local-finance' . --glob '!node_modules' --glob '!dist'` |
| `apps/web/scripts/export-page-components-snapshot.ts` | DELETE(統合) | false | 直 import 0(手動起動 script)。git TS→R2 の sync-theme-additions-to-r2.ts に統合 | `rg 'export-page-components-snapshot' . --glob '*.{ts,tsx,md}'` |
| `apps/web/scripts/export-affiliate-ads-snapshot.ts` | DELETE(改訂後)/EDIT(改訂なし) | false | 直 import 0。`AFFILIATE_ADS_SNAPSHOT_KEY` を `affiliate-ad-snapshot.ts:19-20` が参照。affiliate_ads が §3 リモート D1 SSOT 規定 | `rg 'AFFILIATE_ADS_SNAPSHOT_KEY\|affiliateAds' apps/web/src -A 2` |
| `apps/web/scripts/export-themes-snapshot.ts` | DELETE(改訂後)/EDIT(改訂なし) | false | 直 import 0。themes/theme_metrics が §3 リモート D1 SSOT 規定 | `rg 'themeConfigKeyPath' apps/web/src` |
| `.claude/skills/db/populate-component-data/SKILL.md` | DELETE(参照元 EDIT) | false | `data-ingester.md` §1/§3 のみ。component_data table 廃止に連動 | `rg 'populate-component-data' apps/web packages/ .claude --include='*.ts' --include='*.md'` |
| `.claude/skills/db/verify-component-data/SKILL.md` | DELETE(参照元 EDIT) | false | `snapshot-exporter.md` §3 表のみ(primary_agent)。hard code dep なし | `rg 'verify-component-data' .claude/ apps/ packages/` |
| `.claude/agents/data-ingester.md` | EDIT | false | §1/§3 に populate-component-data・sync-metrics-cache。devops-runner/README/estat-researcher 参照 | `grep -n 'populate-component-data\|sync-metrics-cache' .claude/agents/data-ingester.md` |
| `packages/gis/src/mlit-ksj/scripts/register-ksj-rankings.ts` | EDIT | false | `:33-40` D1 から is_ranking_target=1 取得・ranking_config 展開後 metrics+stats 直書き | `grep -n 'getDrizzle\|INSERT INTO metrics\|INSERT INTO stats' packages/gis/src/mlit-ksj/scripts/register-ksj-rankings.ts` |

**Phase E 完了ゲート**: page_components/themes/theme_metrics/affiliate_ads/categories/component_data の **R2 運用基盤(新規実装)**が稼働し、各 page が R2 から component config を fetch して SSR 成功。`next build` で該当ダッシュボードページが正常生成。seed:* / export-*-snapshot 削除後も R2 snapshot が git TS→R2 直接反映で再生成可能。

### Phase F — schema/CI/docs 最終整理(完全DBレス確定後の最終段)

| パス | finalVerdict | confirmedDead | realReferences | 検証コマンド |
|---|---|---|---|---|
| `packages/database/src/server.ts` | DELETE(Phase C+D 完了後) | false | **約 50 ファイル × 6 パッケージ**で getDrizzle import(実参照確認済)。apps/web/src は 0 | `rg '@stats47/database/server\|getDrizzle' --glob '!**/node_modules/**' --glob '!**/.next/**' -l \| cut -d: -f1 \| sort -u` |
| `packages/database/src/index.ts` | EDIT | false | package.json `./server` export, server.ts re-export。schema export は残す | `grep -E 'export.*server\|export.*index' packages/database/src/index.ts packages/database/src/server.ts` |
| `packages/database/package.json` | EDIT | false | `./server` export, seed:* scripts, better-sqlite3/drizzle-kit devDeps。エフェメラル `:memory:` 設計確認後に判定 | `grep -A10 '"scripts"' packages/database/package.json \| grep seed` |
| `packages/database/drizzle/*.sql` (54 件) | CONDITIONAL_KEEP | false | drizzle.config.ts 生成、integration test が migration 経由 schema 検証。schema .ts 残置なら KEEP | `ls packages/database/drizzle/*.sql \| wc -l` |
| `packages/database/scripts/migrate-local.ts` | KEEP | false | package.json `db:migrate:local`。エフェメラル `:memory:` SQLite 使用時に必要 | `npm run db:migrate:local --workspace=packages/database` |
| `packages/database/seed/README.md` | KEEP(archives/ 移動可) | false | doc のみ、code import 0。canonical 確定後 archive | `find . -name '*.ts' \| xargs grep 'seed/README'` |
| `packages/database/wrangler.toml` | KEEP | false | `vitest.config.integration.ts:9` configPath(実参照確認済)。test 基盤 | `npm run test:integration --workspace=packages/database` |
| `apps/web/wrangler.toml` | KEEP | false | `:19` d1_databases(ローカル開発), `:73-78` 本番 binding 削除済コメント(実参照確認済)。バッチ実行に必要 | `grep -n 'd1_databases' apps/web/wrangler.toml` |
| `.github/workflows/pr-quality-check.yml`(D1 Import Gate) | KEEP→完全DBレス後 DELETE | false | `:39-65` apps/web/src D1 import 0 を担保。現実装は正しい | `grep -A20 'D1 Import Gate' .github/workflows/pr-quality-check.yml` |
| `.github/workflows/deploy-workers.yml` | KEEP→最終段で D1 権限除去 | false | `:84` D1 Edit 権限。本番 D1 削除済だが除去は最終段延期 | `grep -n 'D1' .github/workflows/deploy-workers.yml \| head -10` |
| `.claude/agents/db-schema-manager.md` | DELETE | false | devops-runner/README/blog-editor 参照。Phase F で担当 roles 全廃。参照元同時更新必須 | `rg 'db-schema-manager' .claude/agents/ .claude/commands/ --include='*.md'` |
| `.claude/rules/data-storage.md` | EDIT | false | `:3-6` 2026-05-29 ハイブリッド注記済(実参照確認済)。本体 D1 用語の読み替えが残る | `grep -n 'D1\|エフェメラル' .claude/rules/data-storage.md` |
| `.claude/rules/data-sqlite-ssot.md` / `local-environment.md` / `branch-workflow.md` | EDIT | false | data-storage.md/CLAUDE.md から参照。用語統一・エフェメラル読み替え | (各 grep) |
| `docs/01_技術設計/17_リモートD1ハイブリッド設計.md` | DELETE(archives/) | false | plan doc のみ参照(実参照確認済)。`18_データ層ハイブリッド設計.md` に統合済 | `rg '17_リモートD1' --glob '!**/node_modules/**'` |
| `docs/01_技術設計/14_Phase6_deprecation_log.md` | EDIT | false | plan doc のみ参照。Phase 7-10 残課題を本計画に置換 | `head -100 docs/01_技術設計/14_Phase6_deprecation_log.md` |

**Phase F 完了ゲート**: 全 workspace `npx tsc --noEmit`(apps/web/tsconfig.json + remotion + 各 package)green。`next build` で全 SSG ページ `○ Static` 維持(`.claude/rules/nextjs-ssg-preservation.md` 準拠)。`npm run test:integration --workspace=packages/database` green。`rg 'getDrizzle' --glob '!**/node_modules/**' -l` が schema/型ソース範囲のみ。

## 3. 実行順と依存

```
A (死蔵除去) ──▶ C (Derived エフェメラル化) ──▶ D (観測値 metric D1 除去) ──▶ [B: 正典18改訂判断] ──▶ E (運用6エンティティ D1 除去) ──▶ F (schema/CI/docs 最終整理)
```

- **A は独立先行可**: `check-local-db.js`(参照 0, 即削除可)、`run-correlation-batch`(コード参照 0, snapshot-exporter.md EDIT 同時)。リスク最小。
- **C が全体の律速**: server.ts に約 50 caller が getDrizzle import。C(全 exporter エフェメラル化)+ D を完了しないと F の server.ts 削除は runtime failure。remotion `d1-client.ts` 削除は 4 exporter 改修(prefectures→git TS, stats→R2 read)が前提で、順序は ① prefectures を `packages/area/src/data` or registry 化 → ② 各 exporter で git TS loader 置換 → ③ d1-client 削除。
- **D は metrics SSOT 確定済**(git TS registry.ts)で実行可能。`find-metric-by-key-and-area-type.ts` は外部呼び出し 0 で安全削除。CI の db:pull/push 改修は D 終了後(全 Derived エフェメラル化完了後)。
- **B(正典18改訂)が E のゲート**: E 全項目が contradictsCanonical=true。改訂なき場合、E 対象は全て KEEP/EDIT(remote D1 対応)に倒れる。
- **E は最大の新規実装を要する**: page_components/themes/theme_metrics/affiliate_ads/categories/component_data の **R2 での運用基盤(authoring→git TS→R2 配信、特に page_components のダッシュボード config 運用)**を新規構築する必要がある。単純な exporter 削除では完結しない。
- **F は最終段**: server.ts 削除・db-schema-manager agent 削除・docs 用語統一。schema `.ts` + migration + wrangler.toml(×2) + integration test 基盤は型ソース/テスト基盤として残置。

## 4. リスクと未確定

### confirmedDead=false の DELETE 候補(参照元改修が必須、即削除不可)

- `run-correlation-batch/SKILL.md` — snapshot-exporter.md:15,25 を先に EDIT。
- `seed-theme-page-components.ts` / `export-page-components-snapshot.ts` / `export-affiliate-ads-snapshot.ts` / `export-themes-snapshot.ts` — Phase B 改訂が前提、改訂なしは EDIT(remote D1 対応)に変更。
- `populate-component-data` / `verify-component-data` SKILL — data-ingester.md / snapshot-exporter.md の担当表から削除。
- `db-schema-manager.md` agent — devops-runner/README/blog-editor の参照を同時更新。
- `packages/database/src/server.ts` — **約 50 caller(6 パッケージ)**。Phase C+D 完了が絶対前提。最大の削除リスク。
- `apps/remotion/scripts/exporters/_shared/d1-client.ts` — 4 exporter のエフェメラル化完了が前提。

### 新規実装が要る項目

- **Phase C 全 exporter のエフェメラル計算基盤**: `:memory:` SQLite/DuckDB で R2 stats を読み込み JOIN→R2 出力。area-profile-snapshot(D1 JOIN)、calculate-ranking-values、blog/page-cards/search-index/port-statistics、remotion 4 exporter が対象。
- **Phase E の R2 運用基盤(最大)**: page_components のダッシュボード config を R2 で authoring/配信する仕組み。現在 D1 INSERT で管理されるチャート config を git TS→R2 直接反映へ転換する設計が未実装。
- **prefectures master の git TS 化**: remotion exporter が D1 prefectures を読むため、`packages/area/src/data` または registry への移行が必要。
- **register-ksj-rankings.ts の git TS migration**: GIS metadata(gis_datasets/ranking_config)の registry 化が未実装(Phase E)。

### Mac/Cloudflare 認証が要る項目(ローカル実行/検証で必要)

- `npm run test:integration --workspace=packages/database` — vitest pool-workers が miniflare temp DB を起動(wrangler.toml KEEP 検証)。
- `data-refresh.yml` の db:pull/push 改修検証 — R2 S3 認証(`.env.local`)。SSD 非接続時は cloud fallback。
- `/push-r2` による R2 snapshot 反映 — Cloudflare R2 token(プロキシ制約時は wrangler CLI fallback)。
- remotion exporter の出力 diff 検証 — ローカル D1(Mac 内蔵)+ R2(SSD or cloud)両方へのアクセス。

### 設計決定待ち(コードだけでは決着不能)

- e-Stat metadata(`estat_metainfo` / `find-by-stats-id.ts`)— R2 primary 化の最終判断(実装が移行途上で矛盾状態)。
- GES ports SSOT — `generate-port-projects.ts` の ports 座標真実源が MLIT KSJ API か D1 table か(`packages/gis/src/mlit-ksj` 確認要)。
- schema `.ts` + migration(54 件)の最終要否 — §7 の schema 残置決定に従う(残置なら migration も KEEP)。
- 正典18改訂(Phase B)— オーナー判断。これが E 全体のゲート。

---

## 5. セッション実行追記 (2026-05-29、実機検証)

実行時に判明した、spec 生成時点では未検出の事実。次セッションはこれを前提にすること。

### 実行済 (feature/dbless-migration)
- **Phase B**: doc19 を新正典化、doc18 を superseded、CLAUDE.md §4 更新 (commit `9306daac`)。
- **Phase A**: `run-correlation-batch` skill 削除 + `snapshot-exporter.md` 参照を `/recompute-correlations` に置換。
- **Phase D (partial)**: `packages/ranking/src/repositories/metric/`(find-metric-by-key-and-area-type + index)をディレクトリごと削除。外部参照0・型チェック PASS。

### ⚠️ 新発見: `generate-known-ranking-keys.ts` は既に壊れている
- 現行スクリプトは `SELECT ... FROM stats_prefecture` を実行するが、**`stats_prefecture` は Phase 6 で DROP 済**(local D1 の全テーブル確認で stats_* は存在しない)。つまりこのスクリプトは**今実行するとエラー**。コミット済 `apps/web/src/config/known-ranking-keys.ts` (1969 件) は 2026-05-22 の stale な生成物。
- **件数の乖離**: registry で `prefecture` を宣言する metric = **2169 件**、現行 known-keys = **1969 件**。差 200 = 「宣言あり・観測値未投入」。
- **DBレス版の正しい実装**: `listMetricKeysByEntity('prefecture')` ∩ `R2 app/stats/<key>/values.json` 実在、で観測値ありに絞る。単純な registry walk(2169件)に置換すると観測値なし 200 URL が 410 されず**空ページ/ソフト404 の SEO リスク**。
- **ブロッカー (重要・2026-05-29 実機確認)**: 検証に R2 stats データが要るが **R2 読み取りの両経路が断たれている**:
  - ローカル: **SSD 未接続**(`.local/r2` symlink が dangling、`app/stats` = 0 件)。
  - cloud: **S3 API が 401 Unauthorized**(`.env.local` の `R2_ACCESS_KEY_ID`(32桁)/`R2_SECRET_ACCESS_KEY`(64桁) は形式正常・endpoint も正常だが**トークン失効/無効**)。
  - → known-keys 再生成・Phase C の diff 検証・Phase E の検証は **R2 アクセス復旧まで実行不能**。復旧手段: (a) SSD 接続、または (b) Cloudflare で R2 S3 API トークン再発行 → `.env.local` 更新。
- **意味判断**: 旧クエリの `is_active=1` フィルタは registry に対応フィールドが無い。DBレスでは「R2 観測値の実在」を唯一の基準にする想定 (is_active は廃止)。

### Phase D の残り (このセッションでは未着手)
- `generate-known-ranking-keys.ts` の R2-existence 版への書換 + 再生成 (上記、R2 アクセス要)。
- `sync-metrics-cache` の扱いは Phase C と entangled (exporter が D1 metrics を読む間は維持)。即削除は不可。
- `data-refresh.yml` db:pull/push は全 Derived エフェメラル化 (Phase C) 後。