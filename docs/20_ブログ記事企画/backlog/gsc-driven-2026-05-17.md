# GSC 起点ブログ記事企画 (2026-W21 抽出)

> 生成日: 2026-05-17
> 起点データ: `.claude/skills/analytics/gsc-improvement/reference/snapshots/2026-W17..W21/queries.csv` (5週分集計)
> 抽出条件: 順位 11-30 / 表示 ≥ 10 → 103 クエリ → 70 テーマに集約
> 想定本数: 上位 30+ 本

---

## 凡例

- **NEW**: 既存記事に該当なし。新規記事を書く
- **REWRITE**: 既存記事あり。リライト・補強または姉妹記事を追加
- **NO-METRIC**: 該当 `metrics` レコード無し。新規 metric 登録から必要 (`/fetch-estat-data` 経由)
- `+metric:<key>` — 使用する metric (既存ランキングデータ)

---

## 1. 健康寿命 [NEW] - 想定 imp=458

- **データソース**: `+metric:healthy-life-expectancy-male` (健康寿命（男性）, category=socialsecurity)
- **GSC クエリ (8 件)**:
  - imp=14 / pos=26.6 / ck=0 | `健康寿命 ランキング`
  - imp=11 / pos=14.7 / ck=2 | `健康寿命 ランキング 都道府県`
  - imp=10 / pos=16.5 / ck=0 | `健康寿命 都 道府県 ランキング 2025`
  - imp=144 / pos=11.7 / ck=0 | `健康寿命 都 道府県 ランキング 最新`
  - imp=30 / pos=12.7 / ck=0 | `健康寿命 都道府県 ランキング 最新`
  - …他 3 件

## 2. 平均身長 [NEW] - 想定 imp=137

- **データソース**: `+metric:average-height-primary-school-fifth-grade-male` (平均身長, category=educationsports)
- **GSC クエリ (5 件)**:
  - imp=31 / pos=10.3 / ck=4 | `新潟 平均身長`
  - imp=52 / pos=11.1 / ck=0 | `都 道府県 平均身長 ランキング 2024`
  - imp=23 / pos=13.1 / ck=0 | `都道府県別 平均身長ランキング`
  - imp=16 / pos=11.7 / ck=0 | `平均身長 都道府県 ランキング`
  - imp=15 / pos=10.2 / ck=0 | `平均身長が高い県`

## 3. その他 [NEW (NO-METRIC)] - 想定 imp=125

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (4 件)**:
  - imp=27 / pos=11.6 / ck=0 | `道の駅 数 ランキング`
  - imp=56 / pos=11.4 / ck=0 | `道の駅 数 全国 ランキング`
  - imp=16 / pos=10.9 / ck=0 | `道の駅 都 道府県 数 ランキング`
  - imp=26 / pos=11.0 / ck=0 | `道の駅数ランキング`

## 4. 物価 [REWRITE] - 想定 imp=113

- **データソース**: `+metric:cpi-change-rate-total` (消費者物価指数変化率, category=economy)
- **既存記事: [`consumer-price-regional-gap`] 住居は46pt差、食料は11pt差──費目で変わる物価**
- **GSC クエリ (3 件)**:
  - imp=46 / pos=16.7 / ck=0 | `物価が安い県`
  - imp=54 / pos=11.7 / ck=1 | `都 道府県 別 物価 ランキング`
  - imp=13 / pos=13.1 / ck=0 | `都道府県 物価 ランキング`

## 5. 物価高 [REWRITE] - 想定 imp=113

- **データソース**: ★ metric 未登録 — 新規取得検討
- **既存記事: [`household-spending-before-after-inflation`] 物価高の前と後──2019年と2024年で家計はどう変わった？**
- **GSC クエリ (2 件)**:
  - imp=54 / pos=11.1 / ck=0 | `物価高い県 ランキング`
  - imp=59 / pos=11.1 / ck=0 | `物価 高い 県 ランキング`

## 6. カツオ漁獲量 [REWRITE] - 想定 imp=109

- **データソース**: `+metric:fishery-species-catch-bonito` (カツオ漁獲量, category=agriculture)
- **既存記事: [`bonito-catch-prefecture`] カツオ漁獲量ランキング｜静岡・宮城の二強構造**
- **GSC クエリ (2 件)**:
  - imp=95 / pos=11.4 / ck=0 | `カツオ 漁獲量 ランキング`
  - imp=14 / pos=11.0 / ck=0 | `カツオ漁獲量 ランキング`

## 7. 猛暑日日 [REWRITE] - 想定 imp=104

- **データソース**: ★ metric 未登録 — 新規取得検討
- **既存記事: [`extreme-heat-days-prefecture`] 猛暑日日数ランキング｜熊本・山口の異常高温と日本列島7.8℃差**
- **GSC クエリ (2 件)**:
  - imp=35 / pos=11.0 / ck=3 | `猛暑日日数 都 道府県`
  - imp=69 / pos=11.5 / ck=0 | `猛暑日 日数 ランキング 都 道府県`

## 8. マグロ消費量 [NEW (NO-METRIC)] - 想定 imp=90

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (2 件)**:
  - imp=28 / pos=11.5 / ck=2 | `マグロ 消費量 ランキング`
  - imp=62 / pos=11.2 / ck=2 | `マグロ消費量 ランキング`

## 9. 砂糖消費量 [NEW] - 想定 imp=82

- **データソース**: `+metric:sugar-consumption-quantity` (砂糖消費量, category=economy)
- **GSC クエリ (1 件)**:
  - imp=82 / pos=10.8 / ck=0 | `砂糖消費量 都道府県`

## 10. 物価安 [NEW (NO-METRIC)] - 想定 imp=80

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (3 件)**:
  - imp=21 / pos=10.5 / ck=1 | `物価 安い 都 道府県 ランキング`
  - imp=38 / pos=10.9 / ck=1 | `物価 安い県 ランキング`
  - imp=21 / pos=14.4 / ck=0 | `物価安い県`

## 11. 地方債 [NEW] - 想定 imp=73

- **データソース**: `+metric:local-debt-current-ratio` (地方債現在高の割合, category=administrativefinancial)
- **GSC クエリ (2 件)**:
  - imp=58 / pos=10.2 / ck=0 | `地方債 ランキング`
  - imp=15 / pos=11.0 / ck=0 | `地方債ランキング`

## 12. 下水道普及率 [REWRITE] - 想定 imp=65

- **データソース**: ★ metric 未登録 — 新規取得検討
- **既存記事: [`sewerage-water-supply-gap`] 上下水道普及率は東京99% vs 徳島22%**
- **GSC クエリ (2 件)**:
  - imp=33 / pos=10.6 / ck=0 | `下水道 普及率 都 道府県 ランキング`
  - imp=32 / pos=11.4 / ck=0 | `徳島 下水道普及率`

## 13. 消費量 [REWRITE] - 想定 imp=54

- **データソース**: `+metric:white-bread-consumption-quantity` (食パン消費量, category=economy)
- **既存記事: [`gasoline-car-society-map`] ガソリン消費量で見る車社会度**
- **GSC クエリ (2 件)**:
  - imp=31 / pos=11.7 / ck=0 | `うなぎ 消費量 ランキング`
  - imp=23 / pos=12.2 / ck=0 | `うなぎ消費量 ランキング`

## 14. 精神疾患 [NEW (NO-METRIC)] - 想定 imp=52

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (2 件)**:
  - imp=37 / pos=11.9 / ck=0 | `精神疾患 都 道府県 ランキング`
  - imp=15 / pos=12.0 / ck=0 | `精神疾患 都道府県 ランキング`

## 15. 市美容所統計 [NEW (NO-METRIC)] - 想定 imp=49

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (2 件)**:
  - imp=11 / pos=10.9 / ck=0 | `和歌山市 美容所 数 統計`
  - imp=38 / pos=11.3 / ck=0 | `和歌山市 美容所数 統計`

## 16. 合計特殊出生率 [NEW] - 想定 imp=46

- **データソース**: `+metric:total-fertility-rate` (合計特殊出生率, category=population)
- **GSC クエリ (3 件)**:
  - imp=20 / pos=25.4 / ck=0 | `合計特殊出生率 都道府県別 ランキング`
  - imp=12 / pos=12.1 / ck=0 | `都 道府県 別 合計特殊 出生率 ランキング`
  - imp=14 / pos=28.6 / ck=0 | `合計特殊出生率 都道府県 ランキング 要因`

## 17. カップラーメン消費量 [NEW (NO-METRIC)] - 想定 imp=44

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (2 件)**:
  - imp=33 / pos=11.5 / ck=0 | `カップラーメン 消費量 ランキング`
  - imp=11 / pos=10.8 / ck=0 | `カップラーメン消費量ランキング`

## 18. 借金 [REWRITE] - 想定 imp=43

- **データソース**: `+metric:net-decrease-rate-land-house-loans-worker-households` (土地家屋借金純減率, category=economy)
- **既存記事: [`local-government-debt-burden`] 歳入の2倍の借金を抱える県**
- **GSC クエリ (2 件)**:
  - imp=33 / pos=11.5 / ck=0 | `都道府県 借金 ランキング`
  - imp=10 / pos=10.4 / ck=0 | `都 道府県 借金 ランキング`

## 19. 中絶率 [NEW (NO-METRIC)] - 想定 imp=43

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (1 件)**:
  - imp=43 / pos=11.4 / ck=0 | `中絶率 都 道府県 ランキング`

## 20. 県美容所施設統計 [NEW (NO-METRIC)] - 想定 imp=43

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (1 件)**:
  - imp=43 / pos=10.0 / ck=0 | `和歌山県 美容所 施設数 統計`

## 21. 自主財源比率 [NEW (NO-METRIC)] - 想定 imp=39

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (1 件)**:
  - imp=39 / pos=10.4 / ck=1 | `自主財源比率 ランキング`

## 22. 焼酎消費量 [NEW] - 想定 imp=38

- **データソース**: `+metric:shochu-consumption-quantity` (焼酎消費量, category=economy)
- **GSC クエリ (1 件)**:
  - imp=38 / pos=10.2 / ck=0 | `焼酎 消費量 ランキング`

## 23. 地方交付税交付金 [NEW (NO-METRIC)] - 想定 imp=32

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (1 件)**:
  - imp=32 / pos=28.5 / ck=0 | `地方交付税交付金 ランキング`

## 24. 納豆消費量 [NEW (NO-METRIC)] - 想定 imp=32

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (1 件)**:
  - imp=32 / pos=10.7 / ck=0 | `納豆消費量 ランキング 最新`

## 25. 理学療法士年収 [NEW (NO-METRIC)] - 想定 imp=29

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (1 件)**:
  - imp=29 / pos=25.4 / ck=0 | `理学療法士 年収ランキング`

## 26. 鶏肉消費量 [NEW] - 想定 imp=29

- **データソース**: `+metric:chicken-consumption-quantity` (鶏肉消費量, category=economy)
- **GSC クエリ (2 件)**:
  - imp=13 / pos=12.1 / ck=0 | `鶏肉 消費量`
  - imp=16 / pos=11.7 / ck=0 | `鶏肉消費量`

## 27. アルコール消費量 [REWRITE] - 想定 imp=27

- **データソース**: ★ metric 未登録 — 新規取得検討
- **既存記事: [`alcohol-prefecture-map`] 酒を最も飲む県、飲まない県──アルコール消費量の地域差1.9倍**
- **GSC クエリ (1 件)**:
  - imp=27 / pos=11.1 / ck=0 | `アルコール消費量 都道府県`

## 28. 工業付加価値額 [NEW (NO-METRIC)] - 想定 imp=27

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (1 件)**:
  - imp=27 / pos=10.7 / ck=0 | `工業付加価値額 ランキング`

## 29. ウイスキー消費量 [NEW] - 想定 imp=25

- **データソース**: `+metric:whisky-consumption-quantity` (ウイスキー消費量, category=economy)
- **GSC クエリ (1 件)**:
  - imp=25 / pos=10.0 / ck=0 | `ウイスキー 消費量`

## 30. 県下水道普及率 [NEW (NO-METRIC)] - 想定 imp=25

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (1 件)**:
  - imp=25 / pos=12.4 / ck=0 | `徳島県 下水道普及率`

## 31. 犯罪 [REWRITE] - 想定 imp=25

- **データソース**: ★ metric 未登録 — 新規取得検討
- **既存記事: [`cc-estat-15-crime-small-multiple`] 犯罪発生率の Small Multiple｜47枚を一括生成 Claude Code**
- **GSC クエリ (2 件)**:
  - imp=12 / pos=10.3 / ck=0 | `犯罪が少ない県`
  - imp=13 / pos=11.6 / ck=0 | `犯罪の少ない県`

## 32. 交通通信費 [NEW (NO-METRIC)] - 想定 imp=24

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (1 件)**:
  - imp=24 / pos=11.1 / ck=0 | `交通通信費`

## 33. 図書館蔵書 [NEW] - 想定 imp=23

- **データソース**: `+metric:library-books` (図書館蔵書数, category=educationsports)
- **GSC クエリ (1 件)**:
  - imp=23 / pos=13.8 / ck=0 | `図書館 蔵書数 ランキング`

## 34. 最低賃金 [REWRITE] - 想定 imp=22

- **データソース**: `+metric:minimum-wage-by-region` (地域別最低賃金, category=laborwage)
- **既存記事: [`minimum-wage-gap-regional-economy`] 最低賃金212円差の地域経済**
- **GSC クエリ (1 件)**:
  - imp=22 / pos=12.1 / ck=0 | `秋田 最低賃金ランキング`

## 35. デザイナー年収 [NEW (NO-METRIC)] - 想定 imp=21

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (1 件)**:
  - imp=21 / pos=22.1 / ck=0 | `デザイナー 年収ランキング`

## 36. 失業率 [REWRITE] - 想定 imp=20

- **データソース**: `+metric:unemployment-rate` (完全失業率, category=laborwage)
- **既存記事: [`unemployment-structure`] 失業率が高い県、低い県の構造**
- **GSC クエリ (1 件)**:
  - imp=20 / pos=11.4 / ck=0 | `失業率 都 道府県 別 ランキング`

## 37. 出生率 [REWRITE] - 想定 imp=19

- **データソース**: `+metric:low-birthweight-rate-per-1000-births` (2,500g未満の出生率, category=population)
- **既存記事: [`fertility-fiscal-nexus`] 出生率0.99──東京「1割れ」の衝撃**
- **GSC クエリ (1 件)**:
  - imp=19 / pos=14.1 / ck=0 | `出生率 ランキング 都 道府県`

## 38. 東北身長高 [NEW (NO-METRIC)] - 想定 imp=19

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (1 件)**:
  - imp=19 / pos=10.5 / ck=0 | `東北 身長 高い`

## 39. 美容所施設県統計 [NEW (NO-METRIC)] - 想定 imp=19

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (1 件)**:
  - imp=19 / pos=10.9 / ck=0 | `美容所 施設数 和歌山県 統計`

## 40. 生活習慣病死亡率 [NEW (NO-METRIC)] - 想定 imp=19

- **データソース**: ★ metric 未登録 — 新規取得検討
- **GSC クエリ (1 件)**:
  - imp=19 / pos=10.3 / ck=0 | `生活習慣病 死亡率 ランキング`


---

## 注記

- 上位 40 テーマを出力。実際の量産対象は 30-35 本を推奨（テーマ重複の整理後）。
- `NO-METRIC` テーマは記事化前に `/fetch-estat-data` で metric 登録が必要。
- `REWRITE` は既存記事の H2 追加 / 内部リンク強化 / 別軸の姉妹記事を検討。
