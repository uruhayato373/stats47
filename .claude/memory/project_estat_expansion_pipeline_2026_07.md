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

## SSDS 列挙の実数 (2026-07-11 確定・enumerate-ssds-indicators.mjs)
- SSDS 都道府県26テーブルの全cat01列挙 = **5,356指標 / 既存使用2,021 / 未使用クリーン候補4,181** (CI run 29152223600)
- #系(市区町村のすがた計算・重複)除外→4,114 / **既存とタイトル非重複=追加可能3,981** / 男女別・構成比・ニッチ除外の**実用分=~2,705**
- ★但し**高需要指標(高齢化率・県民所得・持ち家率・婚姻率等)は既に別ソースで存在→dup-title で弾かれる**。残り~2,705は世帯細分・件数系中心=1本あたり需要は中〜低。数は増やせるが流入は前半(既存)に偏る

## config 生成器と key 生成の壁 (重要)
- `.claude/scripts/estat/gen-ssds-configs.mjs` — spec(statsDataId/cdCat01/key/title/unit/category/decimals/norm)→config .ts生成。**dup-title自動スキップ**+既存key衝突スキップ。years:"all"(page-data-batch が全年取得)。seoTitleは投入後に生成。build:registry で登録
- **★key生成が最大の壁**: keyは英語kebab必須(SEO)。日本語指標名→英語keyは (a)LLM翻訳=2,698本で膨大トークン (b)**辞書方式=歩留まり1%で失敗**(SSDS語彙が専門的すぎ・診療科目/純付加価値額等。ssds-key-dict.mjs は削除) (c)コードkey(ssds-a840101)=URL汚くSEO損。→ **「全2,705を良key」は非現実的。高価値~300-500を厳選しLLM翻訳が推奨**
- GONE衝突注意: 新keyが `gone-ranking-keys.ts` に既存だと ranking-key-consistency.test が GONE∩isActive≠∅ で fail (2026-07-03障害の再発防止テスト)。key変更で回避 (例 nuclear-family-households→nuclear-family-household-count)

## 公開パイプライン = 1サイクル2デプロイ (毎回デプロイは非効率)
- config→main(投入可能化)+ item/KNOWN/sitemap反映、で**構造上2デプロイ/サイクル**。7本ごとに回すのは無駄
- 効率化: **投入+KNOWN再生成をdevelop上で先に済ませ、最後にdevelop→main 1マージ=1デプロイ**で全LIVE化。data-refreshはmain checkout(要ref対応 or push-trigger化)
- 第1バッチ7本(外国人人口/単独世帯/核家族/高齢者世帯/高齢単身/流出人口/食料自給率)は**config main反映済(PR#565)だが投入未実行=soft404のまま**。次サイクルで投入・公開

## ★subtitle 分離で addable pool 回復 (2026-07-12 重要)
- lint dup-title の normalizeTitle は**括弧内を全除去**(県内総生産額（農業）→県内総生産額)。同名グループで **subtitle 無しのものだけ error**。既存変種は subtitle で区別済
- → **変種指標(GDP業種別/保険種別/財政費目/世帯類型別)は subtitle を付ければ追加可能**。gen-ssds-configs.mjs を改良: 末尾括弧を subtitle 自動分離(title=基底/subtitle=区別子・redundant回避)+ normExist で真の重複のみskip。「~2,705過大」は subtitle 無し前提の誤り、実際はもっと追加可
- 注意: 私の追加が既存の subtitle 無し config(消費支出/県民総所得 等)に衝突相手を与えると**既存側が error**。既存を触らず自分の衝突分をskipで回避

## 進捗: curated 高価値 ~46本 生成完了 (2026-07-12) — 公開待ち
- **真に新規 ~46本** 生成・validate error 0: batch-1 7本(外国人人口/世帯系/流出人口/食料自給率)は**main反映済(PR#565)だが投入未実行=soft404**、chunk-1 27本(GDP業種別/財政費目/保険種別/費目別支出/税)+chunk-2 12本(教育: 教員数/学級数/長期欠席、農業: 従事者/6次産業)は**develop**(commit 1d791d15/0162b568/7f5269ee)
- 生成器: `.claude/scripts/estat/gen-ssds-configs.mjs`(spec JSON→config、subtitle自動分離・dup/GONE/norm-dup skip)。spec は scratchpad ssds-c1/c2.json
- ★chunk-1教訓: hand-pick「高価値」31本中19本が既存の正規化重複だった(認知指標は既存済)。真に新規は財政費目/教育の細分に寄る

## ★拡充ループ構築済 (2026-07-12) — 継続運用の型
ブログ是正ループと同型の4点セット。**計測ゲート付き需要ファースト**(闇雲に増やさず公開→GSC実測→流入カテゴリのみ深掘り=thin-content回避):
- 状態SSOT `.claude/state/estat/expansion-queue.json`(`build-expansion-queue.mjs`。candidate/generated/published/measured + categoryTraffic。現状 generated46/pending2,462)。候補プール `.claude/state/estat/ssds-candidates.json`(4,114)
- スキル `/expand-rankings`(`.claude/skills/management/expand-rankings/`。旧expand-indicators再構築)
- エージェント `ranking-expander`(`.claude/agents/`。キュレーション判断オーナー。投入=data-ingester/公開=ranking-publisher/計測=gsc-analyst委譲)
- 計測 `measure-expansion-impact.mjs`(公開4週後GSC流入→キュー反映→build再実行でcategoryTraffic更新)

## 次: 公開サイクル (最後に1デプロイ)
develop の ~39本 + main の 7本を **一括投入(e-Stat→R2 values.json)→ generate-ranking-items(item.json)→ KNOWN/SITEMAP再生成 → 最後に1デプロイ → 本番200実測**。ingestは data-refresh(main checkout・--metric単一)なので、1デプロイ実現には develop読みの push-trigger投入workflow が要る(未実装)。GSC実測は公開4週後。関連: [[project_competitor_indicator_benchmark]] / .claude/todo/backlog.md
