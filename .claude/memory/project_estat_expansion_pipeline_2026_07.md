---
name: e-stat-2026-07-11
description: "e-Stat 全展開の実スコープ(8,688生テーブル≒17万metric=不可能)と、DBレス発見パイプライン。本命はSSDS cdCat01列挙。CI専任キーをpushトリガーで回す"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4e930294-1f1e-4a17-86f0-34e9d40808d2
---

「e-Stat で取れるデータを全展開」の判断 (2026-07-11) を受けて Phase 1 発見を CI 実行し、実スコープと拡大方針を確定した。

## 実スコープ (literal「全部」は不可能)
- e-Stat 都道府県テーブル (collectArea=2): **8,797 / 既存カバー 109 / 新規候補 8,688** (CI run 29151635188)
- 1テーブル≈20metric → literal 全部 = **約17万metric (現状2,142の80倍)**。config生成トークン・thin-content-at-scale で非現実的
- 12週GSC実測: 既存2,141本の**41%(877)が既にゼロ表示**・クリックは上位50本に49%集中 → 供給でなく需要+CTRが制約。だから需要ファースト

## 本命は SSDS (生クロス集計でなく)
- 既存内訳: **社会・人口統計体系(SSDS) 1,161** / 家計調査 695 / 社会生活基本72 / 賃金構造37 …
- **SSDS = 1 cdCat01 = 1 完成都道府県ランキング (クロス集計不要・機械的量産可)**。都道府県テーブル 0000010xxx 系 35種 (0000010101-112 / 0000010201-213)
- 生 survey クロス集計 (住宅・土地997等) は多次元 (建て方4×構造5×階数5…) で価値ある slice は 1テーブル ~1-2、キュレーション重 = 二次ソース
- **拡大の本命 = SSDS の未使用 cdCat01 列挙**。家計調査は品目展開で同様。needは住宅(vacant-housing脈)/医療受療率(患者・医療施設・地域保健≈1089候補)/年収(就業構造385)

## DBレス発見パイプライン (旧 D1 estat_metainfo 廃止・再構築済)
- `.claude/scripts/estat/discover-prefecture-candidates.mjs` — collectArea=2列挙+既存config突合→JSON
- `.claude/scripts/estat/fetch-estat-meta.mjs` — getMetaInfoで次元構造 (キュレーション素材)。sampleValues12件cap
- deprecated: `expand-indicators` skill / `ingest-indicator.mjs` (削除済 stats_prefecture 依存)。投入は `page-data-batch.ts` (R2直行) が現役
- **e-Stat APP_ID `NEXT_PUBLIC_ESTAT_APP_ID` は CI専任** (.env.localに無い・2026-05-29集約)。secrets.NEXT_PUBLIC_ESTAT_APP_ID
- **workflow_dispatch は default(main)ブランチ限定** → main デプロイ無しで回すため専用ブランチ push トリガーにした: `discover-estat-candidates.yml`(branch `estat-discovery-run`) / `estat-fetch-meta.yml`(branch `estat-meta-run`)。該当ブランチへ push=発火。結果は artifact + ログ
- 投入=`data-refresh.yml`(page-data-batch→R2)、公開=KNOWN/sitemap再生成→deploy→本番200実測

## 次
SSDS未使用cdCat01列挙 (fetch-estat-metaをSSDS 35テーブルに・全cat01ダンプ要拡張) → クリーン展開可能数確定 → 需要脈からconfig一括生成→CI投入→公開→GSC実測→次バッチ。ペースはconfig生成(キュレーション)のトークンで律速。関連: [[project_competitor_indicator_benchmark]] (供給でなく需要が制約) / docs/todo/03_指標バックログ.md
