---
title: e-Statカタログ実装仕様
type: implementation-spec
status: active
updated: 2026-09-16
related_backlog: ESTAT-CATALOG-01
tags: [estat, r2, catalog, ci, data-discovery]
---

# e-Statカタログ実装仕様

## 0. 位置づけ

stats47には「e-Statにどんなデータがあるか (statsDataId / 分類コード / 年次 / エリア)」の統一カタログが
無く、theme-researcher / estat-researcher / survey-curator / `/search-estat` `/inspect-estat-meta` は
毎回e-Stat生APIを叩いて調べ直していた。部分カタログが4つ散在していた
(`.claude/state/estat/prefecture-candidates.json` 8,706表・statsDataId止まり・git 3.1MB /
`ssds-candidates.json` SSDS 35表のcdCat01 4,114件 / `estat-city-discovery.json` 市区町村3,361表・
7月版 / `meta/` 要約77件)。`packages/database/src/schema/estat_catalog.ts` はschema型だけ残り、
再生成の仕組みが無かった。

オーナー判断 (2026-09-16): R2は低コストなので、取得できる指標・年次・エリアのメタデータを
全部保有し、CIで月次更新する。ranking-expanderの「計測ゲート付き需要ファースト」(公開して
GSC実測で伸びたカテゴリだけ深掘りする方針、`.claude/agents/ranking-expander.md`) は**出口
(公開判断) のフィルタ**として不変。本仕様が扱う**入口 (カタログ) は絞らない**。

本書は完了後に削除せず、恒久契約は`.claude/rules/r2-storage-design.md`と本書に残す
(データ本体がR2にあり、レイアウト・失敗方針・消費者一覧を1箇所に持つ必要があるため)。

## 1. スコープ

- 一覧 (getStatsList) はcollectArea 1/2/3 (全国/都道府県/市区町村) すべて
- 次元台帳 (getMetaInfo) は都道府県+市区町村を全件 (≈12,000表)。全国 (推定20万表超) は
  初回runで実件数を見てから対象を決める (§6)
- 観測値は対象外。既存の`page-data-batch → app/stats/`経路のまま
- 索引はR2のみ。ローカルは`.local/estat-catalog/`へpullして検索。gitに大きいJSONを入れない

## 2. R2レイアウト (prefix `estat-catalog/`、ルート直下の非URLデータ、永久保持)

```
estat-catalog/
  manifest.json                    generatedAt / metaScope / collectArea別{tables,metaFetched,metaPending} /
                                    failed[{id,attempts,lastError,lastAttemptAt}] / quarantined[] /
                                    lastRun{startedAt,finishedAt,fetched,failed,timeBudgetHit}
  index/surveys.json               調査(statCode)の名簿: {statCode,statName,govOrg,tablesByCollectArea,metaFetched}
  index/tables/<statCode>.json     表行 (全collectArea混在): L1 {statsDataId,statCode,statName,title,govOrg,
                                    cycle,surveyDate,openDate,updatedDate,collectArea,mainCategory,subCategory}
                                    + meta要約 (取得済のみ) {sourceUpdatedDate,fetchedAt,dims,years,timeKind,
                                    prefDim,has47Pref,areaKind,areaCount} + removedAt (L1から消えた表)
  index/classes/<statCode>.json    分類行 (meta取得済の表のみ): {statsDataId,dim,code,name,unit,level,parentCode}
                                    — tab/cat01..catNのみ (area/timeは表行に要約)
  meta/<statsDataId>.json          getMetaInfo生レスポンス。封筒{fetchedAt,params,apiVersion,response}。TTL無し
```

### 設計判断

- **collectAreaを索引パスの軸にしない**。既存metric 159表のうち40表はcollectArea=2の一覧に無い
  (e-Stat側の分類がlossy)。shardは調査コード`statCode`のみ、collectAreaとmeta由来の`areaKind`はfield
- **47県判定は全dimを走査する**。都道府県が`area`でなく`cat01/cat02`に入る表があるため、
  01000〜47000 (または47件一致) を持つdimを`prefDim`として記録する
  (実装: `.claude/scripts/lib/estat-catalog/normalize.mjs` `summarizeMeta`)
- **timeはrangeに潰さない**。`extractYearCode`
  (`packages/estat-api/src/stats-data/utils/extract-year-code.ts`) で4桁年listを保持し、
  コードの`@name`から`timeKind` (calendar-year/fiscal-year/month/other) を付ける
- 封筒はcatalog独自v1。既存`estat-api/meta-info/<id>.json`はlive chart用TTL30日キャッシュで
  **別形式**。混ぜない、seedにもしない
- 版キーはL1の`updatedDate`。索引行`meta.sourceUpdatedDate`より新しければ再取得。
  L1から消えた表は`removedAt`を付けるだけ (meta objectは削除しない)
- `diff-push-r2.ts`はリモートを削除しない (local manifestのprune のみ)。CI runnerは毎回空
  manifestなので、staging に置いた差分ファイルだけがuploadされる
- **CIはmanifest/既存indexをS3 GetObjectで読む** (公開URLはCDN cache越しで前回pushが見えない)。
  公開URLはローカル`pull`専用
- shardの分割はv1では行わない。10MB超が観測されたらstatsDataId先頭桁で二次分割 (backlog)

## 3. スクリプト

`.claude/scripts/estat/catalog.mjs` — `node --import tsx`で実行 (TS utilをimportするため)。

| サブコマンド | 役割 |
|---|---|
| `run [--meta-scope 2,3] [--time-budget-min 150] [--max-meta N] [--dry-run]` | CI用一発。L1全collectArea取得→S3から差分plan→getMetaInfoを時間予算まで→`.local/r2/estat-catalog/`にstaging |
| `pull` | 公開URLからmanifest+索引を`.local/estat-catalog/`へ |
| `search <語...> [--id <statsDataId>] [--pref-only] [--year 2020] [--collect-area 2]` | pull済み索引をキーワード検索 |

lib (純粋関数・テスト対象): `.claude/scripts/lib/estat-catalog/{api,normalize,index,s3}.mjs`。
テスト: `npm run estat:catalog:test` (`node --import tsx --test .claude/scripts/lib/__tests__/estat-catalog.test.mjs`)。

失敗方針: 個別失敗はmanifest `failed[]`に記録して次回再試行 (5回でquarantine)。
**run内の失敗率 > 20%ならexit 1** (API障害時に取得済みを誤記録しない fail-closed)。
時間予算到達は正常終了 (pending残はmanifestに出る)。

## 4. CI workflow `.github/workflows/estat-catalog-monthly.yml`

- trigger: 月次cron (`0 18 2 * *` UTC = 3日03:00 JST。data-refresh 5日03:00 UTCと非重複) +
  `workflow_dispatch` (inputs: `meta_scope`既定`2,3` / `time_budget_min`既定150) +
  `push: branches: [estat-catalog-run]` (cloud環境代替、既存estat系と同じ)
- 1 job: checkout develop → `npm ci` → `catalog.mjs run` →
  `npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix estat-catalog`。timeout 180分
- **concurrency は `estat-catalog` (専用group)**。`r2-write`を使わない: このprefixは本workflow
  専有でapp配信に触れずpurge不要、かつ30〜150分のcrawl中にdata-refresh / sync-snapshotsを塞がない
- env/secrets: `vars.NEXT_PUBLIC_ESTAT_APP_ID`、`secrets.CLOUDFLARE_R2_ACCESS_KEY_ID` /
  `CLOUDFLARE_R2_SECRET_ACCESS_KEY`、`vars.CLOUDFLARE_ACCOUNT_ID` (`data-refresh.yml`と同じ変換)
- git commit-backはしない (状態はR2のmanifest.jsonのみ)
- 初回バックフィル: 県8,825+市区町村~3,400≈12,000 call、大表は1call 1〜5秒。時間予算150分で
  1run 3,000〜5,000件 → `estat-catalog-run`へのpushを3〜4回でpending=0。以後は月次cronで
  updatedDate差分のみ

## 5. 消費側の配線 (最小)

| 消費者 | 変更 |
|---|---|
| `.claude/skills/estat/search-estat/SKILL.md` | Phase 0を「`catalog.mjs pull` → `search`」に置換。生APIはcatalogに無いときだけ |
| `.claude/skills/estat/inspect-estat-meta/SKILL.md` | 既定を`catalog.mjs search --id <statsDataId>`に |
| `.claude/agents/{estat-researcher,theme-researcher,survey-curator}.md` | 手順に「まずcatalogを引く」1行 |
| `.claude/rules/estat-api.md` | 関連節にカタログの入口1行 |

`find-metrics` / `ranking-expander` (`ssds-candidates.json`) は今回触らない (§7)。

## 6. 全国 (collectArea=1) の判断基準

初回runのL1で実件数がmanifestの`collectAreas.1.tables`に出る。数万件以下なら`meta-scope`に
1を足す。数十万件なら調査コードallowlist案 (§7) を別途起票する。**この判断は実測後に行う
(推測で決めない)**。

## 7. スコープ外 (後続カード)

`.claude/todo/backlog.md`の`ESTAT-CATALOG-01`配下に起票。

1. `discover-prefecture-candidates.mjs` + `discover-estat-candidates.yml` + git内
   `prefecture-candidates.json` (3.1MB・LARGE_FILE例外) と `estat-fetch-meta.yml` /
   `estat-city-discovery.json`の退役 — catalogの`index/tables/`から導出できるようになる
   (2026-09-16 退役済み: `estat-fetch-meta.yml` + branch `estat-meta-run` + `proof-batch-statsids.json`、
   `discover-estat-candidates.yml` + branch `estat-discovery-run` + `discover-prefecture-candidates.mjs` + `prefecture-candidates.json`。
   collectArea 2,3 の getMetaInfo は catalog `meta/<statsDataId>.json`、候補列挙は `index/tables/` を読む。
   `estat-city-discovery.json` も同日退役: estimate-city-data-size.mjs は `lib/estat-catalog/pulled.mjs` (collectArea=3) を読み、
   estat-researcher は `catalog.mjs search --collect-area 3` を使う。§7-1 は完了)
2. `ssds-candidates.json`をcatalog派生に置換、find-metricsに未登録候補の索引を追加
3. 全国(collectArea=1)のmeta対象決定、shard二次分割、self-dispatch連鎖

## 8. 検証

- 単体: `npm run estat:catalog:test` (19 tests)。1件壊して赤になることを確認済み
- ローカル (APP_ID無し): `run --dry-run`はAPP_ID不在を明示エラーにする (実測済み)。
  `pull` / `search` はfixtureで動作確認済み (実e-Stat APP_IDはCI専任のためローカル実データ検証は未実施)
- CI初回run: workflowログのfetched件数 = manifest `lastRun.fetched`、failed率 < 20%、
  diff-pushのupload件数 = stagingファイル数
- R2実測: `curl https://storage.stats47.jp/estat-catalog/manifest.json`と`meta/0000010101.json`で
  封筒形を確認、`r2-du`でprefixサイズ
- 配線: `/search-estat`を1回走らせ、生APIを呼ばずにstatsDataIdが引けることを実測
- 月次: 2回目以降のrunで`lastRun.fetched`が差分のみ (数十〜数百) であることを確認

## 関連

- 恒久契約: `.claude/rules/r2-storage-design.md` (「ルート直下に置くもの」`estat-catalog/`行)
- 完全DBレス: `docs/01_技術設計/02_データアーキテクチャ.md`
- e-Stat API規約: `.claude/rules/estat-api.md`
- 既存の需要ファースト拡充ループ: `.claude/agents/ranking-expander.md` /
  `.claude/memory/project_estat_expansion_pipeline_2026_07.md`
