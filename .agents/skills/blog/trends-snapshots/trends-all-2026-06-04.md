---
type: trend-discovery
date: 2026-06-04
source: all
sources_ok: [google-trends, google-news, yahoo, hatena, gsc, note]
cross_source_hits: 7
top_candidates: 4
tags: [discover-trends, blog-planning]
---

# トレンド × stats47 マッチング結果（source: all）

> 調査日時: 2026-06-04 07:30 JST
> ソース: all（6 ソース統合）
> 取得結果: RSS 485 件（trends 10 / news 275 / yahoo 40 / hatena 160） + GSC 急上昇 3 件 + note テーマ 10 件
> フェッチ状況: ✅ trends / news / yahoo(5/6, life.xml 500) / hatena / gsc / note(WebSearch)
> 白書エンリッチ: 未実行（`--whitepaper` 未指定）。`--deep` データ補完ループも未実行
> クロスソースヒット（カテゴリ分類済・2 ソース以上）: 7 件
> 採用候補: ★★☆ 以上 4 件 + brushup 推奨 2 件

---

## 最優先候補（🎯 = 新規ギャップ × 鮮度高）

### 候補 1: 転入超過数ランキング 2025（マッチ度: ★★★ / ソース: note + google-news + yahoo / 🎯 新規ギャップ）

- **トレンド概要**: 2026 年 2 月に「住民基本台帳人口移動報告（2025 年結果）」が公表され、note では `data_analyst_jp`（未来予測ラボ）・`gauchi_marketing` などが「全国 47 都道府県 転入超過数 完全ランキング」を連発（"選ばれる地域" フレーム）。stats47 競合が最も力を入れているテーマの一つ。
- **注目度**: note で複数の人気ランキング記事 / 国内ニュースでも「転入超過」継続報道
- **分類カテゴリ**: population（人口・世帯）
- **タイミング**: 2025 年人口移動の最新確報が出た直後。「東京一極集中は止まったのか」が毎年の定番議論

#### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 転入超過率 | git TS（既存） | `moving-in-excess-rate` / `moving-in-excess-rate-japanese` | 最新 2024（2025 は未取り込み） |
| 都道府県間人口移動（転入・転出） | git TS（既存） | `population-migration-inter-prefecture` | years: all。Sankey 着地ビュー本番稼働（PR #393） |
| 転入者数 | git TS（既存） | `movers-in` / `japanese-movers-in` | |

#### 記事の切り口（案）

1. **選ばれる県 vs 流出する県**: 転入超過 上位5県（東京圏中心）vs 流出 下位5県を 1 枚の SVG に。「同じ"地方"でも福岡・滋賀は集めて、秋田・長崎は流す」対比
2. **一極集中は本当に止まったか**: 2020（コロナで東京転出）→ 2024 の転入超過率の振れを時系列で。「コロナ移住ブームは続かなかった」逆説
3. **競合との差別化**: note 競合は「ランキング羅列」型。stats47 は Sankey で「どこからどこへ」フローを見せられる（O-D データ保有）のが武器

#### 推奨チャート

- 横棒（上位5+下位5）: 転入超過率ランキング
- Sankey: 上位流入県への転入元フロー（既存 `population-migration-inter-prefecture` 着地ビュー流用）

#### 重複チェック

- 既存 `population-migration-tokyo-concentration`（首都圏3県が昼間人口最下位）は **昼夜人口の角度**。純粋な転入超過数ランキングは未カバー → **ギャップあり**

#### 次のアクション

- [ ] （任意）`/fetch-estat-data` で 2025 年転入超過データを追加取得（最新性を上げるなら）。無くても 2024 + ニュースを hook に執筆可
- [ ] `/fetch-article-data` で転入超過率・移動フロー取得
- [ ] `/generate-article-charts` で上位下位横棒 + Sankey

---

### 候補 2: 対米追加関税12.5% × 製造業集中県（マッチ度: ★★☆ / ソース: google-news + hatena + yahoo / 🎯 既存7記事に無い角度）

- **トレンド概要**: トランプ政権が日本・中国などに最大 12.5% の追加関税案（「強制労働対策が不十分」）。農業機械は 15%。クロスソース最上位（関税: 5 件、米: 24 件）。
- **注目度**: google-news / hatena / yahoo すべてで速報・継続報道（最ホット）
- **分類カテゴリ**: miningindustry（鉱工業）/ economy
- **タイミング**: 関税案が今まさに各国対象に提示され、日本の製造業への影響が議論されている

#### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 製造品出荷額等（総額） | git TS（既存） | `manufacturing-shipment-amount` | 2023、愛知 58 兆円 |
| 製造品出荷額等（従業員/事業所当たり） | git TS（既存） | `manufacturing-shipment-amount-per-employee` 他 | 効率の対比に |
| 輸出貨物量（港湾統計） | git TS（既存） | `port-cargo-export` | 2023、愛知 1 位 |
| 海上出入貨物 | git TS（既存） | `maritime-import-export-cargo` | |

#### 記事の切り口（案）

1. **関税の直撃を受けるのはどの県か**: 製造業出荷額 × 輸出貨物量で「外需依存度が高い県」を可視化。「愛知・静岡・三重の自動車ベルトが最前線」
2. **農業機械15%の意外な余波**: 農業機械の主産地（井関・クボタ等の集積）と関税の関係

#### 推奨チャート

- 横棒（上位5+下位5）: 製造品出荷額等ランキング
- 散布図: 製造業出荷額 × 輸出貨物量（外需エクスポージャー）

#### 重複チェック

- 製造業ランキング系は 7 記事あり（`manufacturing-aichi-dominance` 等）が、いずれも **生産性 / 効率の角度**。**関税・対米輸出リスク**の角度は未カバー → 差別化可
- **制約**: 「対米輸出額（県別）」の直接データは無い。製造業集中度・輸出貨物量で代理する旨を本文で明示（factual gate 注意）

#### 次のアクション

- [ ] `/fetch-article-data` で `manufacturing-shipment-amount` + `port-cargo-export`
- [ ] `/generate-article-charts`

---

## 注目候補

### 候補 3: 出生数67万人「過去最少」× 東京だけ逆転（マッチ度: ★★★ データ / ソース: hatena + yahoo + google-news + google-trends / クロスソース4）

- **トレンド概要**: 2025 年出生数 67 万人で 10 年連続過去最少（NHK / Yahoo）。一方、小池都知事が「10 年ぶりの出生数増」と政策成果を強調（産経）。「全国減・東京増」のコントラスト。
- **注目度**: クロスソース 4（出生）。少子化は継続的な国民的関心
- **分類カテゴリ**: population
- **タイミング**: 2025 年確定値の公表直後 + 都知事会見で話題

#### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 出生数 | git TS（既存） | `births` | 2023（2025 は未取り込み） |
| 合計特殊出生率 | git TS（既存） | `total-fertility-rate` | 長期時系列 |
| 粗出生率 | git TS（既存） | `crude-birth-rate` | |

#### 記事の切り口（案）

1. **「率」ではなく「数」で見る**: 既存記事は全て出生"率"の地域差。本候補は出生"数"（絶対数）の時系列 + 東京の逆転に絞る差別化
2. **東京の逆説**: 出生率は全国最下位なのに出生数は増える「分母（若年人口流入）が大きい都市」の構造

#### 重複チェック ⚠️

- 出生/少子化テーマは **6 記事と過密**（`fertility-rate-prefecture-gap` `fertility-fiscal-nexus` `birth-death-gap-decline` `aging-rate-akita-vs-okinawa` 等）
- 新規執筆より、**鮮度ニュースを既存記事に追記する brushup** の方が費用対効果が高い可能性。新規にするなら「出生数の絶対値 × 東京逆転」に角度を厳密に絞ること

#### 次のアクション

- [ ] まず `/brushup-blog --target article fertility-rate-prefecture-gap` で 2025 ニュースを反映する案を検討
- [ ] 新規にするなら 2025 出生数の `/fetch-estat-data` 追加 → 執筆

---

### 候補 4: コメ備蓄義務化（食糧法改正）× 水稲収穫量（マッチ度: ★★★ データ / ソース: google-news / 単一ソース）

- **トレンド概要**: 「コメ『需要に応じ』食糧法改正案 衆院通過、一定量保管義務付け」（共同通信）。2024-25 の「令和の米騒動」を受けた政策。
- **分類カテゴリ**: agriculture
- **タイミング**: 法改正案が衆院通過した直後

#### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 水稲収穫量 | git TS（既存） | `rice-harvest-volume` | 2019、新潟 1 位 |
| 水稲作付面積 | git TS（既存） | `rice-cultivated-area` | 2019 |
| 水稲10a当たり収量 | git TS（既存） | `rice-yield-per-10a` | 2019、山形 1 位（単収トップ） |

#### 記事の切り口（案）

1. **日本のコメはどこが作っているか**: 収穫量（量の集中）vs 単収（10a 当たり=効率）で 1 位が入れ替わる逆説（新潟 vs 山形）
2. **備蓄義務化のインパクト**: 生産集中県（新潟・北海道・秋田）に保管義務がどう効くか

#### 重複チェック

- コメ生産の純ランキング記事は既存に見当たらず → 新規余地あり（ただしデータが 2019 とやや古い点に注意）

#### 次のアクション

- [ ] データ年次が古い（2019）。`/search-estat` で新しい水稲統計を確認してから執筆判断

---

## brushup 推奨（新規より既存改修が有利）

### ガソリン補助金縮小 → 既存 `gasoline-car-society-map` を timely 改修

- **ニュース**: 高市首相「ガソリン補助金の見直し、単価含め柔軟に検討」（補正予算3兆円審議入り）。クロスソース3（trends/news/yahoo/hatena）
- **既存記事**: `gasoline-car-society-map`（ガソリン消費量で見る車社会度）がすでに公開済
- **推奨**: 新規ではなく `/brushup-blog --target article gasoline-car-society-map` で「補助金縮小 → 車社会の地方が打撃」の冒頭フックを追加。データ（`gasoline-consumption-quantity` 2024）は最新

### 物価高対策予備費 → 既存 `price-index-high-low-prefecture` 等を確認

- **ニュース**: 物価高対策予備費の編成根拠を国会で質疑。物価高は継続論点
- **既存記事**: 物価地域差は 4 記事（`consumer-price-regional-gap` `price-index-high-low-prefecture` `purchasing-power-adjusted` `household-spending-before-after-inflation`）と充実
- **推奨**: 新規不要。鮮度が落ちている記事があれば軽い brushup のみ

---

## 候補一覧（サマリー）

| # | トレンド | ソース | マッチ度 | カテゴリ | 既存重複 | 記事の切り口 | 必要アクション |
|---|---|---|---|---|---|---|---|
| 1 | 転入超過数 2025 🎯 | note,news,yahoo | ★★★ | population | ギャップ有 | 選ばれる県vs流出県+Sankey | すぐ執筆可（2024データ）/任意で2025取得 |
| 2 | 対米関税12.5% 🎯 | news,hatena,yahoo | ★★☆ | miningindustry | 角度未カバー | 製造業集中=関税最前線 | データ既存・代理指標に注意 |
| 3 | 出生数67万人×東京逆転 | hatena,yahoo,news,trends | ★★★ | population | ⚠過密(6記事) | 率でなく数+東京逆説 | brushup 優先検討 |
| 4 | コメ備蓄義務化 | news | ★★★ | agriculture | 余地有 | 収穫量vs単収の逆転 | データ2019=要鮮度確認 |

## クロスソースヒット（3 ソース以上で出現・カテゴリ分類済）

| # | キーワード | ヒット数 | ソース | カテゴリ | マッチ度 | 記事化 |
|---|---|---|---|---|---|---|
| 1 | 出生 | 4 | trends,news,yahoo,hatena | population | ★★★ | 候補3 |
| 2 | 消費 | 3 | news,yahoo,hatena | economy | ★★★ | 物価系で既存充実 |
| 3 | ガソリン | 3 | news,yahoo,hatena | energy | ★★★ | brushup推奨 |
| 4 | 企業 | 3 | trends,news,hatena | economy | ★★★ | 粒度粗・個別判断 |
| 5 | 工場 | 3 | news,yahoo,hatena | miningindustry | ★★★ | 候補2に統合 |
| 6 | 米/コメ | 3 | news,yahoo,hatena | (関税=候補2 / 米騒動=候補4) | ★★★ | 候補2・4 |
| 7 | 台風 | 3 | trends,news,yahoo | landweather | ★☆☆ | 個別速報・除外 |

## 除外トレンド（主なもの）

| トレンド | 除外理由 |
|---|---|
| キオクシア / 半導体株 / マーベル / エヌビディア | 個別企業・株価。県別データ無し |
| AI / IT 株 | ★☆☆ 県別データ無し |
| トランプ / リチャード・ギア / コロンビア大統領選 | 海外・政治家個人 |
| 山添議員 / 高浜町議 / 八代市議 汚職 | 政治家個人スキャンダル |
| 歯科医師わいせつ / 性交時頭痛 医師コラム | 個別事件・医療コラム |
| 台風6号 速報（道路冠水・ダイヤ乱れ） | 個別速報（統計化困難） |
| 韓国統一地方選 | 海外 |
| ナフサ供給不安（高市首相認識） | 政治コメディ寄り・県別化学出荷額データ弱い（★☆☆） |

## GSC（自サイト需要）特記

- 急上昇 3 件すべて「中国地方5県のうち乳用牛の飼育頭数がもっとも多いのは？」系のクイズ調クエリ（合計 ~600 imp）。流入先 `/ranking/dairy-cattle-count` と `/blog/dairy-cattle-hokkaido-monopoly` が**既に存在** → 新規不要。クイズ需要を取りこぼさないよう既存ページの該当見出し最適化のみ検討余地

## 推奨アクション

1. **最優先 = 候補1（転入超過数 2025）**: 新規ギャップ × 競合検証済 × データ保有（Sankey 武器）。`/fetch-article-data` → `/generate-article-charts` → 執筆。タイトルは curiosity gap で「東京一極集中は止まったか／選ばれる県の条件」型に
2. **次点 = 候補2（対米関税12.5%）**: 最ホットの時事ネタ。製造業データは保有。ただし「対米輸出額（県別）」直接データが無いため代理指標である旨を明示し factual gate 注意
3. **候補3（出生数）は brushup を先に検討**: 6 記事と過密。新規より既存 `fertility-rate-prefecture-gap` 等への 2025 ニュース反映が費用対効果高
4. **ガソリン・物価は brushup のみ**: 既存記事あり、新規不要
