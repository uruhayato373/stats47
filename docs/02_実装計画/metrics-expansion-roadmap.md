---
type: implementation-plan
status: phase-1-prep
created: 2026-05-23
updated: 2026-05-23
target_period: 2026-W29 〜 W44 (Phase 1 内、4 ヶ月)
related_files:
  - docs/02_実装計画/100x-pv-strategy.md
  - docs/02_実装計画/cities-revival-plan.md
  - .claude/skills/estat/search-estat/SKILL.md
  - .claude/skills/db/register-ranking/SKILL.md
baseline:
  total_metrics_active: 1994
  measured_at: 2026-W21
goal:
  total_metrics: 5000
  expansion_count: 3006
  expansion_pct: 1.51
---

# 指標拡張ロードマップ (Phase 1 着手前準備)

> 100x Phase 1 (W29-W44) 着手前の必須準備事項。`100x-pv-strategy.md` §「Phase 1 着手前に決めること」の第 3 項目。
>
> 1,994 → 5,000 metrics (+3,006) を分野別に分解し、e-Stat 未登録の主要調査リストを作る。

## Context

2026-W21 時点の現状:

```
total active metrics: 1,994
└─ 家計調査（品目別）          : 675 (33.9%)
└─ 社会・人口統計体系 A-L      : ~600 (30.1%)
└─ 賃金構造基本統計調査         : 45
└─ 各種 e-Stat 主要調査         : 計 ~674
```

**カテゴリ別 (現状の偏り)**:

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

## 目標分布 (1,994 → 5,000)

カテゴリ別の expansion target:

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

## Phase 1 内の Stage 分け (W29-W44, 16 週間)

各 Stage で 750 metrics 追加、4 Stage で 3,000 達成。

| Stage | 期間 | 対象カテゴリ | 追加 metrics | 注力源 |
|---|---|---|---|---|
| **S1: 不足カテゴリ補強** | W29-W32 | miningindustry, international, ict, energy, landweather, tourism | ~960 | 鉱工業生産指数、エネルギー統計、観光統計、通信動向、気象、貿易 |
| **S2: 中堅カテゴリ拡張** | W33-W36 | agriculture, infrastructure, commercial, construction | ~570 | 農林業/漁業センサス、道路・港湾、商業・サービス |
| **S3: 主要カテゴリ深掘り** | W37-W40 | population, socialsecurity, educationsports, laborwage | ~838 | 国勢調査詳細、患者調査、学校統計、賃金構造詳細 |
| **S4: バランス調整 + economy 細分化** | W41-W44 | economy (補強)、administrativefinancial、safetyenvironment | ~641 | 法人企業統計、地方財政詳細、警察・司法統計 |
| **合計** | 16 週 | 17 カテゴリ全カバー | **3,009** | |

各 Stage 完了時に以下を実施:
- 追加 metrics の `is_active=1` 確認
- ranking values batch 実行 (`/populate-all-rankings`)
- R2 snapshot 再生成 (`/sync-snapshots`)
- 4 週後の GSC indexed/impressions 変化を計測 (Stage 別 effect 判定)

---

## 主要 e-Stat 調査リスト (未登録 / 部分登録)

### 高優先 (Phase 1 S1 で着手)

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

### 中優先 (S2-S3)

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

### 低優先 (S4)

| 調査ID/URL | 調査名 | 想定 metrics 数 | 担当カテゴリ |
|---|---|---|---|
| 00350410 | 法人企業統計調査 | 80 | economy |
| 00200502 | 地方財政状況調査 (詳細) | 60 | administrativefinancial |
| 00250003 | 警察統計 (犯罪認知) | 50 | safetyenvironment |
| 00250010 | 司法統計年報 | 30 | safetyenvironment |
| 00200575 | 環境統計 / 廃棄物 | 40 | safetyenvironment |

---

## 実装フロー (各 Stage 共通)

### 1. e-Stat 調査 ID の特定

```bash
# 既存スキル使用
/search-estat "鉱工業生産指数 都道府県"
/inspect-estat-meta <stats_data_id>
```

### 2. metrics 候補リスト作成

`docs/02_実装計画/stages/S1-candidates.md` 等に Stage 別の候補リスト (調査 ID, metric_key 候補名, 期待単位, ranking direction) を文書化。

### 3. metrics 登録

```bash
# 1 metric ずつ
/register-ranking <調査ID> <metric_key> <その他オプション>
```

または batch 登録 (Stage 内一括):

```bash
# batch script は今後実装 (Phase 1 内)
node .claude/scripts/db/batch-register-metrics.mjs --stage S1
```

### 4. ranking values 取得 + R2 反映

```bash
/populate-all-rankings  # 全 metrics × 47県 のランキング計算
/sync-snapshots         # D1 → R2 snapshot 全更新
```

### 5. 効果計測 (Stage 完了 4 週後)

```bash
# 追加 metrics の GSC impressions/clicks 変化を抽出
node .claude/scripts/gsc/measure-new-metrics-impact.mjs --stage S1 --week-before 2026-W28 --week-after 2026-W32
```

---

## 想定効果 (Phase 1 全体の倍率 ×4 への寄与)

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

## リスクと対処

| リスク | 影響 | 対処 |
|---|---|---|
| 大量 metrics 追加で薄いページが増え site quality 判定が下がる | -20% PV | 各 Stage 4 週観測で indexed 率 60% 未満なら次 Stage 遅延 |
| /populate-all-rankings 実行時間が長大化 | デプロイ遅延 | metrics 増加に応じて batch script の並列化 |
| 一部 e-Stat 調査が県別データを持たない | データ欠損で metric 無効化 | inspect-estat-meta で県別データ存在を事前確認 |
| 重複 / 似た metric を追加してしまう | duplicate content 判定 | metric_key の uniqueness + title similarity check |
| 古い (5+ 年前) データしかない調査 | 更新性で SEO 不利 | latest year が 5 年以内のものに限定、古いものはスキップ |

---

## 完了判定基準 (Phase 1 終了時)

- [ ] 全 17 カテゴリで目標 metrics 数を達成
- [ ] 合計 metrics 5,000 超え
- [ ] 新規 metrics の 60% 以上が GSC indexed
- [ ] /ranking 全体 impressions が baseline 比 +200% 以上
- [ ] site-wide CTR / position が悪化していない (副作用検証)

---

## Phase 0 で実施する準備 (本ドキュメント以外に必要なもの)

1. **inspect-estat-meta スキルの拡張**: 「未登録の主要調査リスト」を出力する機能追加
2. **batch-register-metrics スクリプト**: 1 stage = 1 コマンドで一括登録
3. **measure-new-metrics-impact スクリプト**: Stage 別 effect 計測の自動化

これらは Phase 0 終盤 (W25-W28) に実装し、Phase 1 開始時 (W29) に即使える状態にする。

---

## 関連ドキュメント

- 親計画: `docs/02_実装計画/100x-pv-strategy.md` Phase 1
- 兄弟計画: `docs/02_実装計画/cities-revival-plan.md` (Phase 1 のもう 1 つの主軸)
- e-Stat 利用ルール: `.claude/rules/estat-api.md`
- 既存 metrics registration スキル: `.claude/skills/db/register-ranking/SKILL.md`
- e-Stat 検索: `.claude/skills/estat/search-estat/SKILL.md`
- 実証ベース判定: `.claude/rules/evidence-based-judgment.md`
