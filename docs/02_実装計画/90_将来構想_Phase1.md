---
type: plan
date: 2026-05-29
updated: 2026-06-13
status: future
tags: [実装計画, phase-1]
---

# Phase 1 計画 (W29-W44)

> 2026-05-29 統合: cities-revival / metrics-expansion / migration-flow-sns-automation を集約


---

<!-- 元ファイル: cities-revival-plan.md -->


## 市区町村ページ復活戦略 (100x Phase 1 主軸)

> P0-CITIES-DIAG の成果物。100倍 PV 戦略 Phase 1 (W29 〜 W44) の中核投資判断材料。

### Executive Summary

- **資産**: 2,701 市区町村 × 162 metrics の統計データが R2 (`app/stats/<metric>/cities.json`) にある
- **着手済**: 政令市 20 + α = **約 360 市**を Phase 1 S1 として SSG 化 + profile.json 生成 + sitemap 追加済 (前倒し実装、`PHASE_1_SSG_CITIES`)。`area_profiles` の city profile は **22,487 件**生成済 (W21 時点 0)
- **残課題**: 残り ~2,341 市は**薄いプレースホルダー** (h1 + ナビのみ)・SSG 化前・sitemap 除外。これらを段階的に SSG 化し、Phase 1 倍率 ×4 (38K → 150K PV/月) の主要寄与施策にする
- 残展開は indexed 率 (P1 ゲート、目安 W38) を検証してから次バッチを開く

---

### 1. 着手実績と残課題

W21 診断時点では city pages が空のプレースホルダー (`generateStaticParams() returns []`)・GSC indexed 21/25,785 (0.08%)・area_profiles の city rows 0 件だった。そこから前倒しで以下を実装済:

| 項目 | 実績 | 残 |
|---|---|---|
| `area_profiles` city profile (strengths/weaknesses) | **22,487 件**生成済 (R2 観測値から計算 → R2 snapshot) | — |
| `app/areas/{prefCode}/cities/{cityCode}/profile.json` | 約 360 市分を生成・配信済 | 残 ~2,341 市未生成 |
| city page.tsx の profile レンダリング + SSG | 実装済 (`PHASE_1_SSG_CITIES` 定数リストで SSG 化) | — |
| sitemap への city URL 追加 | `PHASE_1_SSG_CITIES` のみ追加済 | 残市は sitemap 除外のまま |
| city-category subpage (`.../[categoryKey]`) | 既存実装あり (`AreaDashboardSection` でチャート表示) | — |

**残課題の真因 (W21 と同じ)**: profile.json を持たない市は content quality が薄く、Google が「インデックスする価値なし」と判定する。残展開は profile.json 生成 + SSG + sitemap を市バッチ単位で進める。

---

### 2. 残展開戦略

#### 2.1 基本方針

> **「データ表示 + SSG 化 + sitemap 段階追加」を市バッチ単位で順次拡大する**

全市を一斉公開せず**段階導入**する (リスク管理: 低品質ページの大量公開で site-wide ranking を下げないため)。1 バッチで indexed 率が出るまで次バッチは本格着手しない。

#### 2.2 段階導入計画 (Phase 1 内)

| Stage | 状態 | 対象都市 | sitemap | 検証指標 | GO/NO-GO |
|---|---|---|---|---|---|
| **S1: パイロット** | ✅ 実装済 (前倒し) | 政令指定都市 20 + α = **約 360 都市** (`PHASE_1_SSG_CITIES`) | 追加済 | 4 週後 indexed 率 | indexed ≥ 60% で S2 GO |
| **S2/S3: 残展開** | TODO (P1 ゲート、目安 W38) | 残り **~2,341 都市** | バッチ追加 | indexed 1,200+ (全 2,701 中 60%) | S1 の indexed 率で再ゲート |

S1 の indexed 率を **P1 ゲート (目安 W38)** で検証してから残展開を開く。60% 未達なら品質テンプレを再設計し残展開を遅延する。

#### 2.3 品質テンプレート (各 city page の必須要素)

city profile ページ (`/areas/{prefCode}/cities/{cityCode}`) に以下を順に配置:

```
1. Hero
   - h1: "{市町村名}の統計データ｜{県名}｜{TOP指標} 全国{N}位"
   - サブタイトル: 県名 + 人口 + 面積
   - 推定 SEO ボリューム: city name + "ランキング" or "統計"

2. 強み (この市の上位指標 5 件)
   - 各 metric の bar chart (この市 vs 県平均 vs 全国平均)
   - クリックで /ranking/{key} へ

3. 弱み (この市の下位指標 5 件)
   - 同上

4. 統計カテゴリナビ
   - 既存の CategoryNavGrid を再利用 (人口・経済・教育など 17 カテゴリ)

5. 同県内の類似都市 (人口規模が近い上位 5 件)
   - 内部リンク強化

6. 親県へのリンク
   - "{県名}の統計データ全体を見る" → /areas/{prefCode}

7. 出典・更新日
```

**最低品質基準** (Stage GO の前提):
- 1 ページ最低 1,500 文字相当 (構造化データ含む)
- 6 チャート以上
- 内部リンク ≥ 10 (parent / siblings / categories / rankings)
- structured data: `BreadcrumbList`, `Place`, `Dataset`

#### 2.4 R2 キーパス設計

| データ | R2 キー | 生成ソース |
|---|---|---|
| city profile (strengths/weaknesses) | `app/areas/{prefCode}/cities/{cityCode}/profile.json` | R2 `app/stats/<metric>/cities.json` をエフェメラル計算 → R2 直接 export (実装済) |
| city ↔ city 比較データ (類似都市) | `app/areas/{prefCode}/cities/{cityCode}/similar.json` | 同県内 + 人口近似で算出 (TODO) |
| 既存 (city-category) | `app/areas/{prefCode}/cities/{cityCode}/{categoryKey}/...` | 既存維持 |

#### 2.5 batch / R2 export (実装済)

city profile は **R2 観測値からエフェメラル計算し R2 へ直接 export** する方式で実装済 (永続 D1 INSERT は不採用)。

- `packages/area-profile/src/utils/build-city-profile-rows.ts` — `app/stats/<metric>/cities.json` を集約し `extractStrengthsAndWeaknesses` で strengths/weaknesses 抽出 (rank>=1 フィルタ済)
- `packages/area-profile/src/exporters/city-profile-snapshot.ts` + `scripts/export-city-snapshot.ts` — 各 `app/areas/{prefCode}/cities/{cityCode}/profile.json` を R2 へ書き出し
- R2 push は CI (`sync-snapshots.yml`) 経由

#### 2.6 page.tsx / sitemap.ts 改修 (実装済)

`apps/web/src/app/areas/[areaCode]/cities/[cityCode]/page.tsx` と `sitemap.ts` は **`PHASE_1_SSG_CITIES` 定数リスト方式**で実装済 (環境変数 stage 制御ではない)。

- SSG 対象: `generateStaticParams()` が `PHASE_1_SSG_CITIES` (`@/features/area-profile/constants/stage-1-cities`) を返す。リスト外の市は dynamic (SSR) のまま indexed 対象外
- profile.json を R2 から読み込み strengths/weaknesses をレンダリング (`AreaProfilePageClient` が prefecture/city 両対応)
- sitemap は profile.json + SSG を持つ `PHASE_1_SSG_CITIES` のみ追加
- **残展開**: 残市を S2/S3 として開く際は `stage-1-cities.ts` の `PHASE_1_SSG_CITIES` に追記する (page.tsx / sitemap.ts は同一定数を参照するので両方が自動連動)

#### 2.7 内部リンク強化

- **parent 都道府県ページ**: `/areas/{prefCode}` に「主要都市の統計」セクション追加 (5-10 都市へリンク)
- **city-level ranking ページ**: `/ranking/{cityRankingKey}` (例: cpi-regional-difference-index-food-51cities100) のテーブルから city pages へリンク (実装済)
- **prefecture ranking ページ**: prefecture-level ranking では city link は不要 (既存仕様維持)

---

### 3. 想定効果 (Phase 1 ×4 の主要寄与)

#### 3.1 ベース仮説

- **[仮説]** Stage S3 (全 2,701 都市) 完了で indexed 1,200-1,500 件 (60% 達成)
- **[仮説]** 1 indexed URL あたり月 5-10 PV (city × statistic ニッチクエリ流入)
- → **月 +6,000 〜 +15,000 PV** 追加

#### 3.2 Phase 1 全体への寄与

| 寄与源 | 月 PV 追加 |
|---|---|
| Stage S3 city pages (indexed 1,200) | +6,000 〜 +15,000 |
| city-category subpages (既存、SSG 化で indexed 増) | +3,000 〜 +6,000 |
| 内部リンク経由の prefecture / ranking 強化 (halo effect) | +2,000 〜 +5,000 |
| **Phase 1 全体での city 関連寄与** | **+11,000 〜 +26,000** |

Phase 1 目標 38K → 150K (+112K) の **10-25% をこの施策で確保**。

#### 3.3 根拠データ

- /blog インデックス率 78% を上限と仮定 → 2,701 × 0.6 = 1,620 程度が現実的上限
- 「東京都 渋谷区 統計」「札幌市 人口」など city + 統計クエリは検索ボリュームが堅実
- todo-ran や uub には city 個別ページがなく、競合不在の領域

---

### 4. リスクと対処

| リスク | 影響 | 対処 |
|---|---|---|
| 低品質ページ大量公開で site-wide ranking ダウン | -30% PV (致命的) | 段階導入 (S1=80 で 4 週検証してから拡大)。品質テンプレ厳守 |
| Cloudflare Pages build 時間が長大化 | デプロイ遅延 | SSG 対象を段階導入。Stage 別の generateStaticParams で制御。最終 2,701 ページなら ~6-8 分追加見込み |
| R2 ストレージ増加 (2,701 ファイル × 約 5KB = ~13MB) | 軽微 | 無視可能 |
| city が動的 rendering のまま (SSG されない) | indexed されない | generateStaticParams + R2 snapshot 必須化 |
| データ更新時の R2 同期遅延 | データ古い | 既存 `/sync-snapshots` フローに統合 |
| Stage 内の URL に低品質ページが混入 | -20% PV | Stage 移行前に「全 city page が品質テンプレ準拠か」を automated check |

---

### 5. 完了判定基準 (Phase 1 全体での Cities revival)

S1 (約 360 都市) は SSG 化 + profile.json + sitemap 追加済。残りは effect 計測待ち:

- [x] S1: 政令市 20 + α (約 360 都市) が SSG 化 + profile.json + sitemap 追加
- [ ] S1 の indexed 率を P1 ゲート (目安 W38) で検証 (≥ 60% で残展開 GO)
- [ ] 残展開: ~2,341 都市が SSG 化 + indexed 1,200+ (全 2,701 中 60%)
- [ ] 月間 PV: city 関連で +10K 以上 (4 週連続観測)
- [ ] site-wide CTR / position が悪化していない (副作用検証)

---

### 6. 残作業ロードマップ

S1 (batch / exporter / page.tsx / sitemap.ts / 内部リンク) は実装済。残作業:

| 時期 | 作業 | 成果物 |
|---|---|---|
| P1 ゲート (目安 W38) | S1 の indexed 率を GSC snapshot で検証 | 残展開 GO/NO-GO 判定 |
| 残展開 (GO 後) | 残 ~2,341 市の profile.json 生成 + `PHASE_1_SSG_CITIES` 追記 + deploy | バッチ単位で SSG 化 |
| 残展開後 | indexed 観測 + 内部リンク追加調整 | Phase 1 完了判定 |

---

### 関連ドキュメント

- 親計画: `docs/02_実装計画/01_収益化マスタープラン.md` (収益判断 SSOT。長期 PV 構想の概念)
- 既存 prefecture profile 実装: `packages/area-profile/`
- R2 設計ルール: `.claude/rules/r2-storage-design.md`
- 実証ベース判定: `.claude/rules/evidence-based-judgment.md` (Stage GO/NO-GO 判定時に必読)
- Next.js SSG 保全: `.claude/rules/nextjs-ssg-preservation.md` (generateStaticParams 変更時に必読)


---

<!-- 元ファイル: metrics-expansion-roadmap.md -->


## 指標拡張ロードマップ (Phase 1 着手前準備)

> 100x Phase 1 (W29-W44) 着手前の必須準備事項。収益判断 SSOT: `docs/02_実装計画/01_収益化マスタープラン.md`。
>
> 5,000 metrics を目標に分野別に分解し、e-Stat 未登録の主要調査リストを作る。

### Context

2026-W21 snapshot 時点の現状 (baseline。2026-06-13 時点は ~2,209 metrics):

```
total active metrics: 1,994 (W21 snapshot)
└─ 家計調査（品目別）          : 675 (33.9%)
└─ 社会・人口統計体系 A-L      : ~600 (30.1%)
└─ 賃金構造基本統計調査         : 45
└─ 各種 e-Stat 主要調査         : 計 ~674
```

**カテゴリ別 (W21 snapshot の偏り)**:

| カテゴリ | metrics 数 | 偏在 |
|---|---|---|
| economy | 759 | 過剰 (家計調査品目別 675 が支配的) |
| educationsports | 234 | 健全 |
| socialsecurity | 232 | 健全 |
| population | 118 | やや少 |
| administrativefinancial | 107 | 健全 |
| safetyenvironment | 99 | 健全 |
| laborwage | 78 | やや少 |
| construction | 73 | 健全 |
| commercial | 57 | 不足 |
| agriculture | 53 | 不足 |
| infrastructure | 47 | 不足 |
| tourism | 39 | **顕著に不足** |
| landweather | 37 | **顕著に不足** |
| energy | 19 | **顕著に不足** |
| ict | 14 | **顕著に不足** |
| miningindustry | 10 | **顕著に不足** |
| international | 8 | **顕著に不足** |

**結論**: economy が支配的、energy/ict/miningindustry/international などの新興・専門領域が薄い。Phase 1 では **薄いカテゴリを補強** + **新しい主要調査** の追加に集中する。

---

### 目標分布 (W21 baseline 1,994 → 5,000)

カテゴリ別の expansion target (現状 = W21 snapshot):

| カテゴリ | 現状 | 目標 | 追加 | 主な追加源 |
|---|---|---|---|---|
| economy | 759 | 900 | +141 | 法人企業統計、経済構造実態調査の追加項目 |
| educationsports | 234 | 450 | +216 | 学校保健・学校基本詳細、社会教育、文化財 |
| socialsecurity | 232 | 450 | +218 | 患者調査、介護給付、国民健康栄養、医療施設詳細 |
| population | 118 | 350 | +232 | 国勢調査世帯詳細、人口動態、外国人住民、住民基本台帳移動 |
| administrativefinancial | 107 | 250 | +143 | 地方財政詳細、行政事業レビュー、公共施設マネジメント |
| safetyenvironment | 99 | 300 | +201 | 警察・検察・司法、環境統計、廃棄物、災害 |
| laborwage | 78 | 250 | +172 | 雇用動向、職業安定、賃金統計詳細、最低賃金推移 |
| construction | 73 | 200 | +127 | 住宅・土地統計詳細、建築物概要、空き家詳細 |
| commercial | 57 | 200 | +143 | 経済センサス商業、サービス産業動向、卸売 |
| agriculture | 53 | 200 | +147 | 農林業センサス詳細、漁業センサス、農地利用、林業 |
| infrastructure | 47 | 200 | +153 | 道路・港湾・空港・鉄道詳細、上下水道、ライフライン |
| tourism | 39 | 250 | **+211** | インバウンド、地域観光、宿泊、観光業詳細、観光予報 |
| landweather | 37 | 200 | **+163** | 気象統計詳細、地震・火山、土地利用、海岸 |
| energy | 19 | 200 | **+181** | 電力・ガス・石油、再エネ、エネルギー消費、温室効果ガス |
| ict | 14 | 200 | **+186** | 通信動向、テレワーク、e-government、DX、AI 関連 |
| miningindustry | 10 | 250 | **+240** | 鉱工業生産指数 (業種別)、製造品出荷額 (業種別) |
| international | 8 | 150 | **+142** | 在留外国人 (国籍別)、貿易、姉妹都市、ODA、海外日本人 |
| **合計** | **1,994** | **5,000** | **+3,006** | |

---

### Phase 1 内の Stage 分け (W29-W44, 16 週間)

各 Stage で 750 metrics 追加、4 Stage で 3,000 達成。

| Stage | 期間 | 対象カテゴリ | 追加 metrics | 注力源 |
|---|---|---|---|---|
| **S1: 不足カテゴリ補強** | W29-W32 | miningindustry, international, ict, energy, landweather, tourism | ~960 | 鉱工業生産指数、エネルギー統計、観光統計、通信動向、気象、貿易 |
| **S2: 中堅カテゴリ拡張** | W33-W36 | agriculture, infrastructure, commercial, construction | ~570 | 農林業/漁業センサス、道路・港湾、商業・サービス |
| **S3: 主要カテゴリ深掘り** | W37-W40 | population, socialsecurity, educationsports, laborwage | ~838 | 国勢調査詳細、患者調査、学校統計、賃金構造詳細 |
| **S4: バランス調整 + economy 細分化** | W41-W44 | economy (補強)、administrativefinancial、safetyenvironment | ~641 | 法人企業統計、地方財政詳細、警察・司法統計 |
| **合計** | 16 週 | 17 カテゴリ全カバー | **3,009** | |

各 Stage 完了時に以下を実施 (完全DBレス: git TS が SSOT → R2 反映):
- TS-config (`packages/data-configs/src/metrics/<key>.ts`) 追加 → `npm run build:registry --workspace=packages/data-configs`
- 構造 lint (`npm run validate:years` + `npm run validate:config --workspace=@stats47/data-configs`)
- e-Stat → R2 観測値投入 (`/page-data-batch --metric <key>` or 全量 `/page-data-batch`)
- 本番公開には `KNOWN_RANKING_KEYS` / `SITEMAP_RANKING_KEYS` / `INDEXABLE_RANKING_KEYS` / R2 `app/ranking-items/all.json` の整合再生成が必須 (`isActive:true` だけでは middleware が 410。手順: memory `project_ranking_publish_pipeline_gap`)
- R2 snapshot 再生成 (`/sync-snapshots`、push は CI)
- 4 週後の GSC indexed/impressions 変化を計測 (Stage 別 effect 判定)

---

### 主要 e-Stat 調査リスト (未登録 / 部分登録)

#### 高優先 (Phase 1 S1 で着手)

| 調査ID/URL | 調査名 | 想定 metrics 数 | 担当カテゴリ |
|---|---|---|---|
| 00550100 | 鉱工業生産指数 | 80 | miningindustry |
| 00550130 | 製造工業生産能力・稼働率指数 | 30 | miningindustry |
| 00200521 | 在留外国人統計 | 60 | international |
| 00200600 | 出入国管理統計 | 40 | international |
| 00200560 | 国際協力動向 (ODA、JICA) | 30 | international |
| 00550610 | 情報通信白書 (インフラ・利用率) | 80 | ict |
| 00200702 | 通信動向調査 (個人・企業) | 50 | ict |
| 00600302 | 電気事業統計 | 60 | energy |
| 00600412 | エネルギー消費統計調査 | 60 | energy |
| 00600391 | 石油等消費構造統計 | 40 | energy |
| 00200502 | 気象観測統計 (詳細) | 50 | landweather |
| 00200504 | 海洋気象 / 海象 | 30 | landweather |
| 00601020 | 観光統計 (インバウンド国別) | 80 | tourism |
| 00601100 | 宿泊旅行統計調査 (詳細) | 60 | tourism |

#### 中優先 (S2-S3)

| 調査ID/URL | 調査名 | 想定 metrics 数 | 担当カテゴリ |
|---|---|---|---|
| 00500200 | 農林業センサス (詳細) | 80 | agriculture |
| 00500210 | 漁業センサス (詳細) | 60 | agriculture |
| 00200532 | 経済センサス -活動調査 (商業) | 80 | commercial |
| 00450020 | 患者調査 | 50 | socialsecurity |
| 00450091 | 受療行動調査 | 30 | socialsecurity |
| 00400003 | 賃金構造基本統計調査 (職種別) | 60 | laborwage |
| 00400001 | 雇用動向調査 | 50 | laborwage |
| 00200524 | 国民生活基礎調査 (詳細) | 60 | population |
| 00500502 | 住宅・土地統計調査 (詳細) | 80 | construction |

#### 低優先 (S4)

| 調査ID/URL | 調査名 | 想定 metrics 数 | 担当カテゴリ |
|---|---|---|---|
| 00350410 | 法人企業統計調査 | 80 | economy |
| 00200502 | 地方財政状況調査 (詳細) | 60 | administrativefinancial |
| 00250003 | 警察統計 (犯罪認知) | 50 | safetyenvironment |
| 00250010 | 司法統計年報 | 30 | safetyenvironment |
| 00200575 | 環境統計 / 廃棄物 | 40 | safetyenvironment |

---

### 実装フロー (各 Stage 共通)

#### 1. e-Stat 調査 ID の特定

```bash
# 既存スキル使用
/search-estat "鉱工業生産指数 都道府県"
/inspect-estat-meta <stats_data_id>
```

#### 2. metrics 候補リスト作成

`05_指標バックログ.md` に Stage 別の候補リスト (調査 ID, metric_key 候補名, 期待単位, ranking direction) を追記。

#### 3. metrics 登録 (完全DBレス: git TS が SSOT)

```bash
# 1 metric ずつ
# (1) packages/data-configs/src/metrics/<key>.ts を作成 (japanese-population.ts をテンプレに)
# (2) registry 再生成
npm run build:registry --workspace=packages/data-configs
# (3) 構造 lint
npm run validate:years  --workspace=@stats47/data-configs
npm run validate:config --workspace=@stats47/data-configs
```

batch 登録: TS-config を Stage 単位 (例 S1 で 30 ファイル) 一括追加 + 上記 (2)(3) 1 回。

#### 4. ranking values 取得 + R2 反映

```bash
/page-data-batch                       # 全 metrics の R2 観測値投入 (TS-config registry walk)
# または個別: /page-data-batch --metric <key>
/sync-snapshots                        # 派生 snapshot 全更新
```

#### 5. 効果計測 (Stage 完了 4 週後)

```bash
# 追加 metrics の GSC impressions/clicks 変化を抽出
node .claude/scripts/gsc/measure-new-metrics-impact.mjs --stage S1 --week-before 2026-W28 --week-after 2026-W32
```

---

### 想定効果 (Phase 1 全体の倍率 ×4 への寄与)

Phase 1 の主軸 3 本柱のうち、本施策の寄与:

| 寄与 | 月 PV 追加 |
|---|---|
| 新規 +3,000 metrics の ranking pages (indexed 60% 達成想定) | +30,000 〜 +60,000 |
| カテゴリ network effect (内部リンク密度向上) | +10,000 〜 +20,000 |
| 多領域カバー → 検索クエリ集合の拡大 | +20,000 〜 +30,000 |
| **小計** | **+60,000 〜 +110,000** |

Phase 1 全体目標 38K → 150K (+112K) のうち **50-100% を本施策で確保**。

**[仮説]** 1 metric あたり月 10-20 PV を想定。3,000 metrics × 10-20 = 30,000-60,000 PV (新規 metrics 単独)。これに既存ページの関連リンク強化効果を加算。

**根拠**:
- 既存 1,994 metrics で月 25,000 PV → 1 metric あたり ~12.5 PV/月
- 新規 metrics の indexed 率は既存より低い想定 (60% 程度)、effective rate は 7-8 PV/月
- ただし「ニッチ × 競合不在」の新領域 (ict / energy / international) は 1 metric あたり月 20-30 PV ポテンシャル

---

### リスクと対処

| リスク | 影響 | 対処 |
|---|---|---|
| 大量 metrics 追加で薄いページが増え site quality 判定が下がる | -20% PV | 各 Stage 4 週観測で indexed 率 60% 未満なら次 Stage 遅延 |
| `/page-data-batch` 実行時間が長大化 | デプロイ遅延 | metrics 増加に応じて batch script の `--concurrency` 増加 |
| 一部 e-Stat 調査が県別データを持たない | データ欠損で metric 無効化 | inspect-estat-meta で県別データ存在を事前確認 |
| 重複 / 似た metric を追加してしまう | duplicate content 判定 | metric_key の uniqueness + title similarity check |
| 古い (5+ 年前) データしかない調査 | 更新性で SEO 不利 | latest year が 5 年以内のものに限定、古いものはスキップ |

---

### 完了判定基準 (Phase 1 終了時)

- [ ] 全 17 カテゴリで目標 metrics 数を達成
- [ ] 合計 metrics 5,000 超え
- [ ] 新規 metrics の 60% 以上が GSC indexed
- [ ] /ranking 全体 impressions が baseline 比 +200% 以上
- [ ] site-wide CTR / position が悪化していない (副作用検証)

---

### Phase 0 で実施する準備 (未着手・W25-W28 予定)

1. **inspect-estat-meta スキルの拡張**: 「未登録の主要調査リスト」を出力する機能追加
2. **batch-register-metrics スクリプト**: 1 stage = 1 コマンドで一括登録
3. **measure-new-metrics-impact スクリプト**: Stage 別 effect 計測の自動化

これらは Phase 0 終盤 (W25-W28) に実装し、Phase 1 開始時 (W29) に即使える状態にする。

---

### 関連ドキュメント

- 収益判断 SSOT: `docs/02_実装計画/01_収益化マスタープラン.md`
- 兄弟計画: 本ファイル冒頭の「市区町村ページ復活戦略」(Phase 1 のもう 1 つの主軸)
- e-Stat 利用ルール: `.claude/rules/estat-api.md`
- metrics registration (完全DBレス): `.claude/skills/db/page-data-batch/SKILL.md` + TS-config (`packages/data-configs/src/metrics/`) + `.claude/rules/metric-config-standards.md`
- e-Stat 検索: `.claude/skills/estat/search-estat/SKILL.md`
- 実証ベース判定: `.claude/rules/evidence-based-judgment.md`


---

<!-- 元ファイル: migration-flow-sns-automation.md -->


## Migration-flow SNS 自動化 (A+B+C 3 階層)

47 都道府県 migration-flow 動画を Instagram + X に継続投稿するための自動化設計。

### 3 階層の役割

| Tier | 周期 | 内容 | 投稿件数/回 | algo 影響 |
|---|---|---|---|---|
| **A. 年次 Full Refresh** | 1月20日 | 新データ (1月発表) で 47 県全 render + 全投稿 | 47×2 = 94 件 (2-3日に分散) | 大きなブースト |
| **B. 月次 ハイライト** | 毎月 1日 | TOP 5 / BOTTOM 5 変動県 1 件 (carousel or reel) | 1-3 件/月 | 中、データ鮮度維持 |
| **C. 週次 深掘り** | 毎週月曜 | 1 県の詳細ストーリー (近接県・地方ブロック分析) | 1 件/週 | 小、安定エンゲージ |

合計: **年間 ~150 件** = 月 12-15 件 = X/IG 両方とも安全な投稿頻度。

### A. 年次 Full Refresh

#### Trigger
- `cron: "0 2 20 1 *"` → 毎年 1/20 11:00 JST
- e-Stat の住基台帳人口移動報告は毎年 1月後半公開、発表後 1 週間程度で反映

#### Pipeline
1. e-Stat API から最新年データ取得 (`apps/remotion/scripts/fetch-migration-flow.ts` 拡張)
2. `apps/remotion/public/migration-flow/pref-net-2025.json` を新年度版に上書き
3. Remotion で portrait (IG) + landscape (X) を 47 県分 render
4. caption 47×2 種類生成 (IG / X)
5. R2 push (`sns/migration-flow/`)
6. IG: 25/日 × 2 日で 47 件投稿 (Day 1 / Day 2)
7. X: 47 件 1-2 日で投稿
8. 投稿ログ (`.claude/state/metrics/sns/`) 自動更新 (完全DBレス。sns_posts は git TS 定義 → R2)

#### 冪等性
- 投稿ログで既投稿 slug 自動スキップ
- 同年内に複数回 fire しても無害 (年 1 回でも data 同じ)

### B. 月次 ハイライト (TOP 5 変動県)

#### Trigger
- `cron: "0 3 1 * *"` → 毎月 1日 12:00 JST

#### コンテンツ案
1. **「先月の純移動 TOP 5 / BOTTOM 5」carousel**
   - 月次データの場合: e-Stat の月次値を使用
   - 月次データなしの場合: 年累計の変化率を使用
2. **「今月の話題: 〇〇県の流出が止まった理由」reel**
   - 1 県をピック (e.g., 福島が改善傾向)
3. **「東京一極集中、〇〇月の度合いは?」**
   - 東京の inflow を時系列で

#### Pipeline (skeleton)
1. データ取得 + ハイライト判定 (script: `pick-monthly-highlight.ts`)
2. Remotion で highlight composition render
3. caption 生成 (テンプレ + データ差し込み)
4. IG / X 投稿

### C. 週次 深掘り (1県/週)

#### Trigger
- `cron: "0 3 * * 1"` → 毎週月曜 12:00 JST

#### ローテーション
- 52 週 × 1 県 / 週で **年間 47 県を全カバー (+ 余分の 5 週)**
- カバー順序: 当週 W番号 % 47 で順番に
- 既投稿週は skip、未カバーを優先

#### コンテンツ
- 1 県の migration-flow 動画 (既存 mf-portrait/{NN}.mp4 流用)
- caption は「今週の県: 〇〇県」フォーマット
- 既存 portrait 動画を使う or 新規 cut

#### Pipeline
1. 今週カバーする県を決定 (週次ローテーション state)
2. caption 生成
3. IG + X 投稿

### 既存資産

| 資産 | 用途 |
|---|---|
| `MigrationReelVertical` (Remotion) | portrait render |
| `MigrationFlowReel` (Remotion) | landscape render |
| `apps/remotion/public/migration-flow/pref-net-2025.json` | 県別純移動データ (年次更新対象) |
| `apps/remotion/scripts/fetch-migration-flow.ts` | e-Stat データ取得 |
| `.claude/skills/sns/post-x/publish-x.ts` | X 投稿 (Playwright) |
| `.claude/skills/sns/post-instagram/post-instagram.ts` | IG 投稿 (Graph API) |
| `instagram-mf-day2.yml` | 1-shot cron パターン |

### Phase

| Phase | 内容 | 状態 |
|---|---|---|
| **Phase 1** | A の skeleton + 3 workflow yaml (annual/monthly/weekly) | ✅ 完了 (3 yaml 実在、weekly は IG+X 投稿まで実装) |
| Phase 2 | A の actual implementation (e-Stat fetch + render + post の run ステップ有効化) | TODO |
| Phase 3 | B の TOP 5 carousel 実装 | TODO |
| Phase 4 | C の週次ローテーション state + 投稿 | TODO |
| Phase 5 | 効果計測 (engagement rate / follower growth) | TODO |

### 関連

- 既存投稿実績: `.claude/state/metrics/sns/instagram-publish-log.csv`
- 競合分析: `project_competitor_riskmap_jp.md` (1-2件/日 がベスト pace)
- SNS 戦略: `project_sns_10k_roadmap.md`
