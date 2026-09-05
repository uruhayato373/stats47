# GIS データ規約 (国土数値情報 KSJ / 完全DBレス)

国土交通省「国土数値情報 (KSJ)」GIS データの取り込み・管理・配信の**単一ソース (SSOT)**。
GIS を扱う agent (`gis-curator` / `gis-pipeline-runner` / `geo-analysis-curator`) / 人間はこれに従う。検証は型チェック +
`npm run geo:check-data-catalog`。

> 背景: 純メタが永続/ローカル D1 `gis_datasets` に寄せられ「新規は手動 INSERT」だった (旧 plan
> stateless-stargazing-teapot Phase 2)。これは完全DBレス doctrine と矛盾し SQLite を消すとメタが
> 失われた。2026-06-21 にメタを git TS (`datasets.ts`) に戻し DBレス化。正典: `docs/01_技術設計/02_データアーキテクチャ.md`。

## SSOT 構造 (どのデータがどこにあるか)

| データ | SSOT | 形 | 備考 |
|---|---|---|---|
| 登録データセットのメタ + ranking 定義 | **`packages/gis/src/mlit-ksj/datasets.ts`** (git TS) | `GIS_DATASETS: GisDatasetMeta[]` | name/category/geometryType/coverage/license/stats47Category/isRankingTarget/rankingConfig/latestVersion |
| pipeline 技術設定 | **`packages/gis/src/mlit-ksj/registry.ts`** (git TS) | `KSJ_CODE_CONFIG: Map` | downloadUrlPattern/geojsonDirInZip/propertyMap/simplifyOptions |
| 候補メタの superset (126 件) | `packages/database/seed/ksj-catalog.json` (git) | JSON snapshot | jpksj-api フォールバック。`seed-ksj-catalog.ts` が status='available' で投入 |
| 公開可能な GIS 原典 (TopoJSON 等) | **R2** `gis/mlit-ksj/{dataId}/{version}/` | gzip TopoJSON + manifest | `license-policy.ts`が`public-r2-eligible`と判定したものだけ。本番アプリ・Remotion が読む |
| 非商用・審査中の GIS 原典 | 公式配布元 + ローカル作業キャッシュ `.local/r2/gis/mlit-ksj/...` | zip / TopoJSON | **public R2へ置かない**。ローカルキャッシュはSSOTではなく再取得可能な作業物 |
| ランキング観測値 | **R2** `app/stats/<key>/values.json` | JSON | GIS ranking も他 metric と同じR2配信。公開構造化データgateを通す |
| Geo分析の途中artifact・lineage・集計 | **R2** `app/geo/<slug>/{pref/<NN>.json,manifest.json,item.json}` | JSON | 定義はgit TS。47県coverageと保存則を`geo-analysis-curator`が監査 |
| 取得カタログ | R2 `app/geo/data-catalog/items.json` | JSON | git TS + **実R2一覧**から生成。URL・alias・版・取得件数・公開条件を分離 |
| Geo販売・媒体展開の運用台帳 | `.local/geo-content-pipeline/items.json` | JSON | 公開ページのreaderなし。`app/geo/`へ置かず、商品生成・記事queueだけが読む |
| 互換用キャッシュ | `packages/database/.data/stats47.sqlite` の `gis_datasets` テーブル | SQLite | 旧一覧/集計script用。pipelineは読まず、**SSOTではない** |

**「D1 gis_datasets」= 上記ローカル使い捨て SQLite** であり Cloudflare 永続/リモート D1 ではない (廃止済)。
取得状態はSQLiteの `status='imported'` や単一オブジェクトの存在では判定しない。2026-08-30追加の
公開取得対象は `official-policy.ts` の公式アーカイブ数と、R2のscope別 `manifest.json` 数が一致した場合だけ
完了とする。既存pipelineデータはR2実体から導出する。

## データフロー

```
datasets.ts (メタ SSOT) + registry.ts (技術設定) + ksj-catalog.json (候補)
  │  run-pipeline.ts <dataId> / acquire-public-ksj.ts
  │  → 公式配布manifest選択 → zip download → TopoJSON + scope別provenance manifest
  ▼
.local/r2/gis/mlit-ksj/{dataId}/{version}/
  │  license-policy.ts → public-r2-eligibleだけr2-publisher exact push
  │  local-only/review-requiredはローカル処理で停止
  ▼
R2 gis/mlit-ksj/{dataId}/{version}/  →  build-data-catalog.tsが実査 → 本番アプリ / Remotion
  │  /build-geo-analysis → calculation-input / derived / context-only を分離
  ▼
R2 app/geo/<slug>/{pref/<NN>.json,manifest.json,item.json} → /geo/<slug>
```

## 新規データセット追加手順 (★手動 SQLite INSERT は禁止)

1. `datasets.ts` の `GIS_DATASETS` にエントリ追加 (メタ + ranking 定義)
2. `registry.ts` の `KSJ_CODE_CONFIG` に技術設定 (downloadUrlPattern 等) 追加。
   **属性に県が入っているデータセットは `prefectureSource` を宣言する** (下記 §県の帰属)
3. 公式詳細URL・`latestVersion`・候補側別ID (`candidateAliases`) を `datasets.ts` に記録
4. `run-pipeline.ts <dataId>` で download→変換。公式ページ探索型は `npm run acquire:public-ksj --workspace packages/gis -- --data-id <ID> --apply`
5. ranking 対象なら `generate-ksj-stats-values.ts` で観測値を作る (下記 §県別集計)
6. 公開条件gate後に `r2-publisher` が限定prefixをpushし、`build:data-catalog` → `check:data-catalog`

> ranking 定義 (`rankingConfig`) は datasets.ts に統合済 (旧 `seed-from-registry.ts` の RANKINGS 配列は廃止)。
> ranking 対象は `isRankingTarget: true` + `rankingConfig[]` を持たせる。年は 4 桁 (`yearCode`、estat-api.md 準拠)。

## 商用利用・公開ライセンス境界

判定のコードSSOTは`packages/gis/src/mlit-ksj/license-policy.ts`。公式の個別データページにある利用条件を
`datasets.ts`へ記録し、元データの公開と商用成果物を同じ「利用可」で済ませない。

| license | 元TopoJSONのpublic R2 | 広告・販売を伴う成果物 | 公開JSON/CSV |
|---|---|---|---|
| `cc-by-4.0` / `commercial-ok` | 可 | 出典・加工表示付きで可 | 可 |
| `cc-by-4.0-partial` | 不可（個別確認まで） | 個別条件を確認 | 書面/個別条件確認まで不可 |
| `non-commercial` | **不可。ローカル限定** | 非データベースのGIS空間演算結果だけ利用余地あり。出典・加工者表示必須 | **書面確認または商用可ソースへの置換まで不可** |

`non-commercial`の登録済み11件は`C02, C09, C23, P03, P12, P13, P17, P18, P35, W01, W05`。
2026-09-05の実R2監査で全11件のpublic mirrorを検出したため、`r2-retention.ts`のexact prefix
`license-remediation-ksj-*`で撤去対象に固定した。削除は必ずdry-run→ユーザー承認→R2 workflowの順とする。

このうち`W01/P03/P12/P35/C09`由来の既存ランキング10本は、画面上の図表まで直ちに利用不可と断定しないが、
`app/stats/.../values.json`が公開構造化データなので権利確認が必要。`generate-ksj-stats-values.ts`は再生成を停止し、
商用可の一次資料へ置換、権利者/事務局の書面許諾、または非データベース成果だけに縮退するまで公開更新しない。

生成時だけでなく汎用R2 publisher（diff-push、exact asset、wrangler）も
`ksj-publication-guard.ts`で全候補をPUT前に検査する。判定は`datasets.ts`と`license-policy.ts`から導出し、
未登録KSJ、公開不可の原典、同原典由来の観測値を拒否する。旧stagingや同期manifestの一致を許可根拠にしない。

公開時の出典は「データ名、国土交通省、個別ページURL、取得日、stats47が加工した事実」を最低限表示し、
個別データページの条件が一般規約より優先される。利用範囲が曖昧なら推測せず国土数値情報運営事務局へ確認する。

## 県の帰属 — 属性 → 空間結合 → 距離上限つき許容 (★2026-08-17 新設)

正典: `packages/gis/src/mlit-ksj/prefecture-assign.ts` (純関数・テスト 29 件)。
**この経路以外で県を決めてはならない。**

| 段 | 手段 | 備考 |
|---|---|---|
| 1 | 属性 (`registry.ts` の `prefectureSource`) | 住所 / 県名 / 2 桁県コード / 5 桁市区町村コードのいずれかを**明示宣言**する |
| 2 | 県ポリゴンへの空間結合 | 属性が無い / 欠測の feature だけ |
| 3 | 距離上限つき最近傍 (既定 5km・`method:"coastline"`) | 海岸線・埋立地のずれ専用。件数は必ず出力に出す |
| — | **どれでも決まらなければ `null`** | 推測で別の県へ計上しない |

**なぜここまで書くか (2026-08-17 の実害)**: 旧 `register-ksj-rankings.ts` の `findNearestPref` が
**最寄りの県庁所在地**で県を決めていた。距離は行政境界と無関係なので、原子炉の無い京都府に 8 基
(高浜 4 + 大飯 4)、八丈島 (東京都) の地熱が神奈川県、秋田・福島が 0 になっていた。同 script は削除済み。

宣言の落とし穴も実測で判明している:

- `C09_006` は県名に見えるが**政令市では市名が入る** (「北九州市」等)。2,931 件中 1,631 件が
  解決不能になったので `C09_003` (市区町村コード) を使う
- `P12_001` は資源 ID だが 5 桁。市区町村コードとして読むと**別の県に化ける**
- 住所判定は県名接頭 **かつ** 市/区/町/村/郡 を要求する (「北海道電力株式会社」を住所と読まないため)

## 県別集計 → `app/stats` (完全DBレス)

`packages/gis/src/mlit-ksj/scripts/generate-ksj-stats-values.ts` が
datasets.ts + R2 の KSJ topojson から `app/stats/<key>/values.json` を決定的に作る。
SQLite を経由しない。集計の純関数は `ksj-stats-core.ts` (テスト 10 件)。

```bash
npx tsx packages/gis/src/mlit-ksj/scripts/generate-ksj-stats-values.ts \
  --metric <keys> [--compare] [--coastline-km 5]
```

- **未解決が 1 件でもあれば書かずに終了する** (推測で別の県へ計上しない)
- 「1 レコード = 1 施設」でないデータセットは `datasets.ts` の `dedupeByProperties` で畳む。
  P03 は**号機ごと**に 1 レコードなので `unit:"か所"` と一致しない (原発 68 → 21 施設)。
  P12 は同じ資源を点/線/面の 3 系統で持つので資源 ID で畳む
- **畳むキーは名前だけにしない**。青森の東通原発は東北電力と東京電力の 2 か所が同名で別住所にあり、
  名前だけだと 1 か所に潰れる。属性が空の feature は畳まず 1 件として数える

## DBレス integrity (やってはいけないこと)

| NG | OK |
|---|---|
| ローカル SQLite に手動 INSERT して「真実源」にする | `datasets.ts` を編集して再 seed |
| 永続/リモート D1 を GIS の SSOT として復活させる | git TS (datasets.ts/registry.ts) + R2 |
| SQLiteのstatus/file_countや1ファイル存在を取得済み判定に使う | 公式アーカイブ数 = R2完了manifest数で判定 |
| 本番アプリから gis_datasets を query | R2 `gis/mlit-ksj/...` を fetch |
| 手編集の生成表を真実源にする | 登録一覧は `datasets.ts` (git TS) が真実源 (旧 doc 04/generate-docs は 2026-07-12 廃止) |
| **座標から最寄りの県庁所在地で県を決める** | `prefecture-assign.ts` の 3 段 (決まらなければ null) |
| **全プロパティを走査して「それらしい値」を県コードに使う** | `registry.ts` の `prefectureSource` で明示宣言 |
| **metric config も R2 データも無い ranking を datasets.ts に残す** | 実体が無ければ `isRankingTarget:false` か定義削除 (soft 404 になる) |
| **`non-commercial`を「加工したから自由」とみなしてpublic R2/JSONへ置く** | 元データはlocal-only。非DB空間演算結果以外は書面確認か商用可ソースへ置換 |

## 検証

```bash
# git TS・一次資料URL・alias・実R2完了条件
npm run geo:check-data-catalog
# 県帰属・県別集計の純関数 (39 件)
npx vitest run packages/gis/src/mlit-ksj/__tests__/
# 型
npx tsc --noEmit -p packages/gis/tsconfig.json
```

## 役割分担 (agent)

| agent | 責務 |
|---|---|
| `gis-curator` | datasets.ts / registry.ts の SSOT 管理、データセット lifecycle (register/deprecate)、メタ整合、本ルール・`packages/gis/src/mlit-ksj/README.md` (モジュール設計) の維持 |
| `gis-pipeline-runner` | run-pipeline (download→TopoJSON+provenance)、全県/全1次メッシュ取得、R2実体監査。R2 push は `r2-publisher` に委譲 |
| `geo-analysis-curator` | 複数GISレイヤーのrole、決定的空間演算stage、県別途中artifact、lineage、保存則、canonicalサイト接続 |

観測値投入 (e-Stat) は `data-ingester`、R2 push は `r2-publisher`、snapshot 派生は `snapshot-exporter` に委譲する。

## 関連

- 型: `packages/gis/src/mlit-ksj/types.ts` (`KsjCategory`/`KsjGeometryType`/`KsjCoverage`/`KsjLicense`/`PrefectureSource`)
- メタ SSOT: `packages/gis/src/mlit-ksj/datasets.ts`
- 技術設定: `packages/gis/src/mlit-ksj/registry.ts` (`prefectureSource` を含む)
- **県の帰属 (純関数)**: `packages/gis/src/mlit-ksj/prefecture-assign.ts`
- **県別集計 (純関数)**: `packages/gis/src/mlit-ksj/ksj-stats-core.ts`
- **観測値生成**: `packages/gis/src/mlit-ksj/scripts/generate-ksj-stats-values.ts`
- テスト: `packages/gis/src/mlit-ksj/__tests__/{prefecture-assign,ksj-stats-core}.test.ts` (39 件)
- 互換用seed: `packages/gis/src/mlit-ksj/scripts/{seed-from-registry,seed-ksj-catalog}.ts`
- pipeline/catalog: `packages/gis/src/mlit-ksj/scripts/{run-pipeline,build-data-catalog}.ts`
- スキル: `.claude/skills/db/fetch-mlit-ksj/SKILL.md`
- Geo分析標準/skill: `.claude/rules/geo-analysis-standards.md` / `.claude/skills/gis/build-geo-analysis/SKILL.md`
- SNS バズ地図での消費 (KSJ topojson → 点プロット/点→自治体カード): `.claude/rules/buzz-map-standards.md` §4 `ksj`/`mlit-dpf` レーン
- モジュール設計・使い方: `packages/gis/src/mlit-ksj/README.md` / 登録一覧の真実源: `datasets.ts`
- データ層: `docs/01_技術設計/02_データアーキテクチャ.md` / `.claude/rules/data-sqlite-ssot.md`
