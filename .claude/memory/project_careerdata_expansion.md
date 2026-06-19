---
name: CareerData.jp 展開プロジェクト
description: CareerData.jp 分析→stats47 展開の完了状況（新テーマ2つ・計算指標・職種拡充・ブログ6本・旧テーブルマージ）
type: project
---

2026-03-26 に CareerData.jp の全コンテンツを分析し、stats47 へ展開するプランを策定・実装した。

## 実装済み

**テーマダッシュボード:**
- `real-income`（実質収入・購買力）新設 — 11指標、panelTabs 3タブ、page_components 8件
- `labor-mobility`（人材流動性）新設 — 8指標、panelTabs 3タブ、page_components 6件
- `consumer-prices` 拡充 — 2→12指標（CPI品目別全対応）、DB標準ローダーに切替
- `labor-wages` 拡充 — +3指標（男女格差・パート時給）、panelTabs 4タブ、page_components 7件
- `occupation-salary` 拡充 — 39→47職種（8職種追加: ケアマネ・高校教員・幼稚園教員・保健師・訪問介護・看護助手・研究者・大学准教授）
- `compare-private-wage` 新設 — 民間賃金比較セット9指標

**計算基盤:**
- `subtraction` 計算タイプ追加（calculate-ranking-values.ts）
- `real-disposable-income`（可処分所得÷CPI×100）— 埼玉1位、東京2位
- `disposable-income-after-rent`（可処分所得−家賃）— 山形1位、東京16位

**旧テーブルマージ:**
- 主要10職種の年収データを 2010-2023 の14年間に拡張（statsDataId: 0003084962 + 0003445758）
- 2022年のtabコード差異を発見・解決（tab 08/12 vs 40/44）

**ブログ記事（下書き6本）:**
1. `tokyo-real-income-after-rent` — 東京の家賃控除後ランキング
2. `gender-wage-gap-ranking` — 男女賃金格差
3. `nurse-salary-ranking` — 看護師年収（14年推移付き）
4. `telework-income-correlation` — テレワーク率と所得
5. `truck-driver-salary-trend` — トラック運転手（14年推移）
6. `estimated-hourly-wage-ranking` — 推定時給

**X投稿データ:**
- `.local/r2/sns/x/` に3枚分の data.json + caption.md

## 未実施（次のセッション向け）

- Remotion PNGレンダリング → X実投稿
- ブログ記事6本の `/proofread-article` + `/publish-article`
- `/sync-remote-d1` でリモートDB反映
- 入職率（job-entry-rate）登録 — 0003376330 ÷ 0003376318 で都道府県別算出可能（2014-2021年）

**Why:** CareerData.jp が業界×職種軸で展開している「実質年収」「男女格差」「時給換算」「人材流動性」のコンテンツを、stats47 の都道府県比較軸に変換することでSEO・SNS両面の流入拡大を狙う。

**How to apply:** ブログ記事の公開優先度は記事1（東京）> 記事2（男女格差）。X投稿はタイルマップ画像から。
