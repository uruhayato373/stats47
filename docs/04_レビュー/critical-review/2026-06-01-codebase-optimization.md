---
type: critical-review
topic: codebase-optimization
date: 2026-06-01
status: active
related_docs:
  - docs/01_技術設計/19_完全DBレス設計.md
  - .claude/rules/estat-api.md
  - .claude/rules/r2-storage-design.md
  - .claude/rules/ui-components.md
tags: [refactoring, tech-debt, scalability, dedup]
---

# stats47 コードベース最適化レビュー — スケール前の負債抽出

## このレビューの目的

プロジェクト肥大化（~150K LOC / 3 apps + 22 packages）に伴い顕在化してきた
**重複・データ格納場所の乖離・都道府県コード(2桁/5桁)の不整合・スケール上のボトルネック**を、
多角的に棚卸しして「今のうちに直すべき負債」を優先度付きで抽出する。本ドキュメントは施策の真実源ではなく
**課題インベントリ**。着手するものは `docs/50_Issues/*-backlog.md` または個別 PR に切り出す。

## 調査方法

6 本の read-only 監査エージェントを並列実行し、結果を統合した。主要な高インパクト主張は
`file:line` で本体検証済（evidence-based-judgment ルール準拠）。検証結果は §「検証ログ」に記載。

| # | 監査軸 | 検出数 |
|---|---|---|
| 1 | UI / チャートコンポーネント重複 | 10 |
| 2 | 都道府県・地域コード正規化 (2桁/5桁) | 12 |
| 3 | データ格納 / DBレス整合 (SSOT) | 13 |
| 4 | パッケージ横断のロジック重複 | 12 |
| 5 | デッドコード / 未使用 (knip) | 257 files / 263 exports |
| 6 | data-configs スケーラビリティ + 型系 | 12 |

---

## エグゼクティブサマリ — 6 大テーマ（優先度順）

| テーマ | 深刻度 | 本質 | 主因 |
|---|---|---|---|
| T1. Snapshot reader の重複 + 禁止キャッシュ | **High** | R2 読み取りパターンが 6+ パッケージで再実装、7 reader が規約違反の module-level cache を保持 | 共有 reader factory が無い |
| T2. 都道府県コード(2桁/5桁)の SSOT 散逸 | **High** | prefecture データが 5+ 箇所に再定義（一部はバイト一致のコピー）、`.slice(0,2)` 変換が点在 | 正規化 util/SSOT 不在 |
| T3. 共有型の SSOT 散逸 | **High** | `MetricConfig`/`SourceConfig`/`RankingItem`/year util が複数パッケージに重複定義 | `@stats47/types` が一次源になっていない |
| T4. data-configs のスケール限界 | **High** | 2209 metric file・registry.ts 4439 行を個別 import、per-file ボイラープレート | factory/分割/遅延ロード未導入 |
| T5. UI/チャート実装の重複 | **Med** | ranking table ×3・Sankey ×4・blog chart の Server/Client ラッパ対・raw HTML 要素 | 共通化レイヤ薄い |
| T6. DBレス移行の取り残し + デッドコード | **Med** | `better-sqlite3`/`@stats47/database` が apps/web に残存、D1 時代 script・~114 未使用 file | 移行後のクリーンアップ未実施 |

> **横断的な根本原因**: 「**共有レイヤ（util / 型 / reader / UI primitive）への集約が、機能追加スピードに追いついていない**」。
> 各 feature/package が自前で再実装し、規約（DBレス・5桁統一・components 優先）が*文書としては*存在するが
> *コードとして強制されていない*。最も効くのは「規約を lint / 共有 API で機械的に強制」する方向。

---

## テーマ別詳細

### T1. Snapshot reader の重複 + 禁止された module-level cache — **High**

`r2-storage-design.md` は「reader 関数に module-level メモリキャッシュを持たせない。各リクエストが対応する
小さい JSON を直接 fetch する」と明記。にもかかわらず:

**(a) 規約違反の `let cached`（本体検証済）**

| reader | 該当 |
|---|---|
| `packages/category/src/repositories/read-categories-snapshot.ts:15` | `let cached` |
| `packages/ranking/src/repositories/survey/read-surveys-snapshot.ts:15` | `let cached` |
| `apps/web/src/features/blog/repositories/blog-snapshot-reader.ts:17` | `let cached` |
| `apps/web/src/features/ads/repositories/affiliate-ad-snapshot.ts:19` | `let cached` |
| `apps/web/src/features/fishing-ports/lib/load-fishing-port-data.ts:27` | `let cached` |
| `apps/web/src/features/port-statistics/lib/load-port-data.ts:42-43` | `let cachedPorts` / `cachedYears` |

**(b) reader パターン自体の重複**: `warnIfStale` + load + 型付き fetch が
`ranking-value` / `category` / `area-profile` / `correlation` / `blog` / `RankingPageCards` で個別実装。

**推奨**: `@stats47/r2-storage/server` に `createSnapshotReader<T>(key, opts)` factory を新設し、
(1) 型付き fetch を 1 箇所に集約、(2) **module cache を持たない**（キャッシュは Next.js / CDN 層に委譲）、
(3) stale 警告を共通化。全 reader を移行。これで T1(a)(b) を同時に解消。

### T2. 都道府県・地域コード(2桁/5桁)の SSOT 散逸 — **High**

`estat-api.md` は「地域コードは5桁(01000〜47000)に統一。2桁→5桁の正規化は不要な設計」と規定。実態は逆:

- **prefecture データが 5+ 箇所に再定義**（本体検証済）:
  `packages/area/src/data/prefectures.json`(5桁) / `apps/web/src/features/station-passengers/lib/prefectures.ts`(2桁) /
  `apps/web/src/features/migration-flow/lib/prefectures.ts`(2桁) / `apps/ges/data/prefectures.ts`(2桁) /
  `apps/web/src/features/blog/utils/extract-prefectures.ts`(5桁)。
  **`station-passengers` と `migration-flow` の `prefectures.ts` はバイト一致(1922B)の純粋コピー**。
- **`.slice(0,2)` 変換が点在**（正規化 util 無し）:
  `packages/ranking/src/utils/filter-to-prefectures.ts:13`,
  `packages/visualization/src/server/generate-mini-tile-svg.ts:50`,
  `packages/migration-flow/src/lib/regions.ts:33`,
  `apps/web/src/features/depopulation-medical/.../DepopulationMedicalMapClient.tsx:79` 他。
- 一部 util は 5桁前提・一部は 2桁前提で、引数名から判別不能（mismatch リスク）。

**推奨**: `@stats47/area` を prefecture の**唯一の SSOT**にし、
`to5DigitPrefCode()` / `to2DigitPrefCode()` / `prefName(code)` を export。全コピーを削除して import に統一。
2桁/5桁を受ける関数は引数名を `prefCode5` 等に統一 + JSDoc で契約明示。

### T3. 共有型(MetricConfig / RankingItem / year util)の SSOT 散逸 — **High**

- `MetricConfig` / `YearSpec` / `SourceConfig` が `packages/data-configs/src/types.ts` に閉じ、
  `@stats47/types` から参照できない → 各所で再定義リスク。
- `SourceConfig` が `packages/ranking/src/types/ranking-item.ts` に**別定義**で存在（どちらが正か不明）。
- `RankingItem`(ranking) と `RankingDisplayEntry`(types) が分裂。
- year util の散逸: `packages/types/src/year-format.ts`(`formatYearName`) /
  `packages/estat-api/src/stats-data/utils/generate-year-name.ts`(`extractYearName`) /
  `extractYearCode` の canonical util がある一方で `slice(0,4)` のインライン計算が複数箇所に残存
  （`estat-api/.../formatter.ts`, `ranking-value/read-ranking-values-from-r2.ts`,
  `apps/web/.../actions/fetch-ranking-values.ts`）。

**推奨**: `@stats47/types` を共有ドメイン型の一次源にし、data-configs/ranking はそこから import。
year 系 util を 1 パッケージ（types か utils）に集約、インライン `slice(0,4)` を `extractYearCode` へ置換。

### T4. data-configs のスケーラビリティ — **High**（※ git TS が SSOT である正典は維持）

- **2209 metric file**（~144K 行）、`registry.ts` が **4439 行**で全 metric を個別 import（本体検証済）。
  1 metric の型エラーが registry 全体のコンパイルを止める。
- per-file ボイラープレートが多い（source.kind / category / unit / entities の繰り返し）。
- metric の shape が不揃い（`calculation`/`visualization`/`display` を持つものと持たないもの）→ runtime undefined リスク。
- SEO/UI メタ(`seoTitle` 等)が config に同居し ~40% の肥大。
- **`validate:years` は CI(`pr-quality-check.yml:72`)で実行されている**（※監査エージェントの「CI 未組込」は誤り。
  ただし **pre-commit(.husky) には未組込**なのでローカル早期検知は効かない）。

**推奨（DBレス正典は壊さず、git TS のまま最適化）**:
(1) `createMetric({...})` factory/builder で共通既定値を集約しボイラープレート削減、
(2) registry をカテゴリ別サブ registry に分割 or glob 遅延ロードで tsc コストを抑制、
(3) `MetricConfig` を discriminated union で厳密化 + 任意/必須フィールドを型で明示、
(4) `validate:years` を pre-commit にも追加、
(5) SEO/UI メタを別テーブル(`metric-seo.ts`)へ分離。

### T5. UI / チャートコンポーネントの重複 — **Med**

- **ranking table ×3**: `features/ranking/.../RankingDataTable`, `blog/.../BlogRankingTable`,
  `blog/.../MarkdownRankingTable`（+ remotion `RankingTable`）— 列定義とデータ変換が重複。
- **Sankey ×4**: `HubSankey` / `CommuteSankey` / `FinanceSankey` / `MigrationSankey` — レンダリングほぼ同型。
- **blog chart の Server/Client ラッパ対**が 8 種（`BlogBarChart`+`BlogBarChartClient` …）— dynamic import 定型の重複。
- **scatter ×3** / **diverging legend ×2** / **BarChartRace が remotion と visualization に二重実装**。
- **raw HTML 要素**で `@stats47/components` をバイパス（`ui-components.md` 違反）:
  `stat-charts/.../StatsTableClient.tsx`(raw `<select>`), `theme-dashboard/MetricYoyChoroplethSection.tsx`(raw input/button),
  `port-statistics/PortMapClient.tsx`(raw `<table>`)。
- `formatValue`/`formatNumber` がコンポーネント内インライン定義（`@stats47/utils` 不使用）。

**推奨**: パラメタ化した `GenericSankey`、ranking table の列定義/変換 hook 抽出、`ChartWrapper`（Server/Client 定型の共通化）、
raw 要素を components パッケージへ置換、フォーマッタは `@stats47/utils` に統一。

### T6. DBレス移行の取り残し + デッドコード — **Med**（低リスク・即効）

- **apps/web に DB 依存が残存（本体検証済）**: `package.json` に `@stats47/database`, `better-sqlite3`,
  `@types/better-sqlite3`。完全DBレスでは runtime 不要 → import グラフ確認の上で除去候補。
- **D1 時代の legacy script**: `packages/database/scripts/{seed-to-d1-sql,dump-tables-to-seed,extract-articles-seed-from-r2}.ts`,
  `scripts/dev/local-r2-mode.sh`, `r2-storage` の `db:pull`/`db:push`（doc 17 superseded）。
- **build-time exporter に残る D1 query**: `apps/web/scripts/export-fishing-ports-snapshot.ts:30-32`（`db.select().from(fishingPorts)`）→ git TS 化検討。
- **R2 write script の CI ガード漏れ**: 一部 `export-*.ts` が `assertR2WriteAllowed()` 未呼び出し（要確認）。
- **knip**: 未使用 ~114 source file（`blog/charts/Blog{Bar,Line,Scatter}ChartClient.tsx`, `atoms/{CountUp,ScrollReveal}.tsx` 等）、
  263 未使用 export、35 未使用 dep、15 `@deprecated` マーカー。

**推奨**: knip 駆動のクリーンアップ PR（unused file/export/dep 削除）+ legacy D1 script 削除 +
DB 依存除去（要 import 確認）。低リスクなので最初の quick win に最適。

---

## 優先度ロードマップ

### フェーズ 1: Quick wins（低リスク・高効果。1〜2 PR）

1. **T6 クリーンアップ**: knip の unused file/export/dep 削除、legacy D1 script 削除、apps/web の DB 依存除去。
2. **T2 prefecture コピー削除**: 純粋コピーの `prefectures.ts`(station-passengers/migration-flow) を `@stats47/area` import に置換。
3. **T4-(4)**: `validate:years` を pre-commit に追加。

### フェーズ 2: 構造リファクタ（中リスク・基盤改善）

4. **T1 reader factory**: `createSnapshotReader<T>()` を新設、全 reader 移行 + module cache 撤去（規約準拠）。
5. **T3 型集約**: `@stats47/types` を一次源化、`MetricConfig`/`SourceConfig`/`RankingItem`/year util を統合。
6. **T2 コード util**: `@stats47/area` に 2桁/5桁変換 util を集約、`.slice(0,2)` を全置換。
7. **T5 UI 共通化**: `GenericSankey` / ranking table hook / `ChartWrapper` / raw 要素置換。

### フェーズ 3: スケール対応（中〜大リスク・将来投資）

8. **T4 data-configs**: metric factory 導入 → registry 分割/遅延ロード → discriminated union 厳密化 → SEO メタ分離。

---

## 検証ログ（evidence-based）

| 主張 | 検証コマンド/箇所 | 結果 |
|---|---|---|
| reader の `let cached` 実在 | `grep -n "let cached" <readers>` | 7 箇所で確認 ✅ |
| prefecture コピーがバイト一致 | `ls -la .../prefectures.ts` | station-passengers/migration-flow とも 1922B ✅ |
| apps/web に DB 依存残存 | `apps/web/package.json` | `@stats47/database`/`better-sqlite3` 確認 ✅ |
| registry.ts 規模 | `wc -l registry.ts` / metric file count | 4439 行 / 2209 file ✅ |
| validate:years の CI 組込 | `grep -rn validate:years .github/` | **CI 済(`pr-quality-check.yml:72`)・pre-commit 未** → 監査の「CI 未組込」を訂正 |

> 未検証で agent 報告に依存する項目（UI 重複の各 file、knip の個別カウント、build-time D1 query 等）は
> 着手時に該当 PR 内で再確認すること。

## 次アクション

- 本レビューを基に `docs/50_Issues/feature-backlog.md` / `automation-backlog.md` へ T1〜T6 の着手項目を起票。
- フェーズ 1（quick wins）は本ブランチ系列で順次着手可能。フェーズ 2/3 は影響範囲が広いので個別 PR + `next build` の SSG 区分確認（`nextjs-ssg-preservation.md`）を伴う。
