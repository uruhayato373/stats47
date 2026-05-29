---
type: theme-chart-planning
date: 2026-05-26
theme_key: foreign-residents
status: drafted
research_sources:
  - https://www.moj.go.jp/isa/publications/press/13_00052.html
  - https://www.nippon.com/ja/japan-data/h02350/
  - https://www.e-stat.go.jp/stat-search/database?toukei=00250012&layout=dataset&statdisp_id=0003147229
  - https://www.e-stat.go.jp/stat-search/database?toukei=00250012&layout=dataset&statdisp_id=0003147704
  - https://www.yutonsmaile.com/entry/foreigners-japan-2024
  - https://braist.co.jp/analyzing-okinawa-prefectures-foreign-resident-trends/
tags: [theme-charts, foreign-residents]
---

# 外国人 (foreign-residents) — チャート構成設計

> Phase 3 で line/pie 用 exporter を作る際の入力仕様。

## 0. 結論サマリ

左コロプレスで「外国人比率 (人口10万人あたり外国人数, 2024年末)」を地図表示、右に **(A) 全国推移ライン (2010 約213万→2024 376万人、3年連続で過去最高更新)**、**(B) 国籍別パイ (中国23%/ベトナム17%/韓国11%/フィリピン9%/ブラジル…)**、**(C) 上下位 5 県バー (東京/大阪/愛知 vs 秋田/青森/鹿児島)** を縦に積む。「国籍別」タブに群馬・三重・静岡のブラジル偏在、沖縄の米国人比率を強調する追加チャートを置く。

## 1. 既存 metric 棚卸し

| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |
|---|---|---|---|---|---|---|
| `foreign-resident-count-per-100k` | 外国人比率 | primary | 総数 | choropleth + line + bar | prefecture / national | 在留外国人統計 (月次, 2012-2024) |
| `foreign-resident-count` | 外国人数 | secondary | 総数 | choropleth + line | prefecture / national | 同上 |
| `resident-foreigner-population` | 在留外国人 | context | 総数 | choropleth | prefecture | 同上 (別系列) |
| `foreign-resident-count-china-per-100k` | 中国(比率) | secondary | 国籍別 | choropleth + bar | prefecture | 在留外国人統計 04表 (国籍別) |
| `foreign-resident-count-china` | 中国(人数) | context | 国籍別 | choropleth | prefecture | 同上 |
| `foreign-resident-count-korea-per-100k` | 韓国(比率) | secondary | 国籍別 | choropleth + bar | prefecture | 同上 |
| `foreign-resident-count-korea` | 韓国(人数) | context | 国籍別 | choropleth | prefecture | 同上 |
| `foreign-resident-count-usa-per-100k` | 米国(比率) | context | 国籍別 | choropleth + bar | prefecture | 同上 (沖縄が突出) |
| `foreign-resident-count-usa` | 米国(人数) | context | 国籍別 | choropleth | prefecture | 同上 |
| `total-overnight-guests-foreign` | 外国人宿泊 | secondary | 観光 | choropleth + line | prefecture / national | 観光庁 宿泊旅行統計調査 |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `foreign-resident-count-per-100k` (外国人比率, 2024 年末)

- 最新年データは 2024 年末 (出入国在留管理庁 在留外国人統計, 2025-03 公表)
- 配色: 緑系の連続スケール (高いほど濃緑、全国平均 約 3.0% を中央)
- ホバー時: 県名 + 外国人比率 + 全国順位 + 実数

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 全国推移ライン

**何を見せるか**: 全国の在留外国人数推移 (2010-2024, 年次 15 ポイント)

- データ源: e-Stat 在留外国人統計の全国集計値
- curiosity gap: **「14 年で +160 万人、3 年連続で過去最高 (2024 年末 376 万人)」** をタイトルに
- 2020-2021 はコロナで一時減少、2022 以降 V 字回復
- 必要データ: `app/themes/foreign-residents/timeseries/foreign-resident-count.json`
  ```json
  { "metricKey": "foreign-resident-count", "scope": "national",
    "unit": "人", "series": [{ "year": 2010, "value": 2134151 }, ..., { "year": 2024, "value": 3768977 }] }
  ```

#### (B) 国籍別パイチャート

**何を見せるか**: 在留外国人 376 万人の **国籍内訳** (上位 5 + その他)

| 国籍 | 人数 (2024 末) | 割合 | 注目点 |
|---|---|---|---|
| 中国 | 約 87.3 万人 | 23% | 最多、東京に約 28 万人集中 |
| ベトナム | 約 63.4 万人 | 17% | 増加率最大、+6.9 万人/年 |
| 韓国 | 約 40.9 万人 | 11% | 大阪・兵庫・京都に偏在 |
| フィリピン | 約 32 万人 | 9% | 特定技能で増加 |
| ブラジル | 約 21 万人 | 6% | 静岡/愛知/群馬/三重に集中 |
| その他 (ネパール等) | 約 132 万人 | 35% | ネパールが上位 10 入り |

- データ源: e-Stat statsDataId `0003147229` (04 表 都道府県別 国籍・地域別)
- 必要データ: `app/themes/foreign-residents/breakdown/nationality.json`
  ```json
  { "metricKey": "foreign-resident-count", "breakdown_dimension": "国籍",
    "year": 2024, "scope": "national",
    "items": [{ "label": "中国", "value": 873286, "ratio": 0.232 }, ...] }
  ```
- 都道府県切替トグル付き (デフォルト全国、選択で県別国籍構成 — 沖縄選択時に米国 12% が突出表示)

#### (C) 上下位 5 県バーチャート

**何を見せるか**: 外国人比率 TOP 5 + BOTTOM 5

```
東京都    5.3% ▰▰▰▰▰▰▰▰▰▰▰  (738,946 人)
愛知県    4.5% ▰▰▰▰▰▰▰▰▰     (331,733 人)
群馬県    4.4% ▰▰▰▰▰▰▰▰▰     ( 83,430 人)
三重県    4.0% ▰▰▰▰▰▰▰▰      ( 68,804 人)
岐阜県    3.9% ▰▰▰▰▰▰▰▰      ( 74,750 人)
─ 全国平均 3.0% ─
鹿児島県  0.9% ▰▰
青森県    0.8% ▰▰
岩手県    0.8% ▰▰
秋田県    0.6% ▰
高知県    0.7% ▰
```

- `app/ranking/foreign-resident-count-per-100k/values.json` から派生、別途 export 不要

### 2-3. パネルタブ — 既存維持 + 補助チャート追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **総数** | foreign-resident-count-per-100k / foreign-resident-count / resident-foreigner-population | line: 全国在留外国人数推移 (2010→2024, +160万人)<br>line: 県別推移 (東京 vs 全国 vs 沖縄, 比較) |
| **国籍別** | china / korea / usa (per-100k & 人数) | pie: 全国国籍内訳 (中国23/ベトナム17/韓国11/フィリピン9/ブラジル6/他)<br>bar: ブラジル人比率 上位5県 (静岡/愛知/群馬/三重/岐阜)<br>bar: 米国人比率 上位5県 (沖縄が突出, 在日米軍関連) |
| **観光** | total-overnight-guests-foreign | line: 外国人宿泊者数の全国推移 (コロナで2020半減→2024過去最多) |
| **考察** | (空) | (現状通り、本文記事用) |

## 3. 参考にしたサイト (リサーチ結果)

- [出入国在留管理庁: 令和6年末現在における在留外国人数について](https://www.moj.go.jp/isa/publications/press/13_00052.html) — 公式プレスリリース。総数 376 万・都道府県別上位の一次情報
- [Nippon.com: 2024年末の在留外国人376万人 3年連続で過去最多を更新](https://www.nippon.com/ja/japan-data/h02350/) — curiosity gap 「3 年連続過去最高」「ベトナム +6.9 万」の表現例
- [e-Stat: 04 都道府県別 国籍・地域別 在留外国人](https://www.e-stat.go.jp/stat-search/database?toukei=00250012&layout=dataset&statdisp_id=0003147229) — 国籍別パイチャート/県別偏在分析の元データ
- [e-Stat: 05 都道府県別 在留資格別 在留外国人](https://www.e-stat.go.jp/stat-search/database?toukei=00250012&layout=dataset&statdisp_id=0003147704) — 技能実習・特定技能の県別分布 (Phase 3+ 候補)
- [となりのたしまさん: どの県にどの国籍の人が多い？都道府県別ランキング 2024](https://www.yutonsmaile.com/entry/foreigners-japan-2024) — 県×国籍クロスの可視化例 (ブラジル静岡 3.2 万、群馬 1.3 万 など)
- [BRAIST: 沖縄県の在留外国人](https://braist.co.jp/analyzing-okinawa-prefectures-foreign-resident-trends/) — 沖縄の米国 12%・ベトナム 15% など県内構成の参考

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (national) | `foreign-resident-count` | 2010-2024 (15 点) | `app/themes/foreign-residents/timeseries/foreign-resident-count.json` | 在留外国人統計 年末値 |
| timeseries (national) | `foreign-resident-count-per-100k` | 2010-2024 | `app/themes/foreign-residents/timeseries/foreign-resident-ratio.json` | 同上 / 国勢調査人口で除算 |
| timeseries (national) | `total-overnight-guests-foreign` | 2007-2024 (月次→年次集計) | `app/themes/foreign-residents/timeseries/foreign-overnight.json` | 観光庁 宿泊旅行統計調査 |
| timeseries (prefecture) | `foreign-resident-count` | 2010-2024 (主要県のみ: 東京/愛知/沖縄) | `app/themes/foreign-residents/timeseries/by-pref/{prefCode}.json` | 同上 |
| breakdown (pie) | `foreign-resident-count` | 2024 (国籍別) | `app/themes/foreign-residents/breakdown/nationality.json` | e-Stat statsDataId `0003147229` |
| breakdown (pie, 県別) | `foreign-resident-count` | 2024 (47県 × 国籍別) | `app/themes/foreign-residents/breakdown/nationality-by-pref/{prefCode}.json` | 同上 |

**統合 JSON 案** (1 fetch で複数 chart データを取れる構成):

```json
{
  "themeKey": "foreign-residents",
  "timeseries": {
    "foreign-resident-count": { "scope": "national", "unit": "人", "series": [...] },
    "total-overnight-guests-foreign": { ... }
  },
  "breakdown": {
    "nationality": { "label": "国籍", "year": 2024, "items": [...] }
  }
}
```

→ `app/themes/foreign-residents/charts.json` に統合する案を Phase 3 設計時に判断。県別 breakdown は別ファイル (重い)。

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `foreign-resident-count-vietnam-per-100k` | ベトナムは増加率最大 (+6.9 万/年)、愛知/福岡/茨城/群馬で集中。中国/韓国/米国だけだとブラジルもベトナムも見えず偏った構成になる | e-Stat statsDataId `0003147229` |
| `foreign-resident-count-brazil-per-100k` | 群馬・三重・静岡・岐阜の curiosity gap (日系ブラジル人歴史) を作る最強の metric。現行 TS に存在しない | 同上 |
| `foreign-resident-count-philippines-per-100k` | 上位 4 位 (32万人)、技能実習・特定技能で増加 | 同上 |
| `technical-intern-trainee-count-per-100k` | 技能実習生比率 — 地方部 (北関東・東海) に偏在し curiosity gap が強い | e-Stat statsDataId `0003147704` (05表 在留資格別) |
| `specified-skilled-worker-count-per-100k` | 特定技能比率 — 2019 創設の新制度。愛知/大阪/埼玉/千葉に集中 | 同上 |

ブラジル・ベトナム metric は **特に強い curiosity gap** (「日本のブラジルタウンはどこ?」「ベトナム人が一番多いのは愛知ではなく〇〇」) を作れるので最優先で追加候補。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実 (`.claude/rules/blog-quality-standards.md` 準拠):

1. **「在留外国人 376 万人で過去最高、3 年連続更新──東京は人口の 5.3%」** — 数値 + 換算
2. **「ブラジル人比率 1 位は静岡でも愛知でもなく群馬・三重?──日系ブラジル人の戦後史」** — 疑問形 + 意外性
3. **「沖縄の在留外国人の 12% が米国人、全国平均の 30 倍──米軍基地と切り離せない構造」** — 倍率 + 真因
4. **「中国人 87 万・ベトナム 63 万・韓国 41 万──14 年でベトナム 25 倍、韓国はほぼ横ばいの逆転劇」** — 比較 + 倍率

theme description (D1 themes.description) を以下に書き換え推奨:

> 「2024 年末で在留外国人 376 万人・3 年連続過去最高──東京 73.9 万人 (人口の 5.3%)、群馬・三重はブラジル人比率トップ、沖縄は米国人 12%。47 都道府県の外国人統計を地図とランキングで比較。」

## 7. 残課題 / 要検証

- [ ] `foreign-resident-count` の e-Stat statsDataId が時系列全件 (2010-2024) 取得できるか確認 (制度改正 2012 年で「外国人登録」→「在留外国人」に変更されたためカテゴリコード断絶あり)
- [ ] 「国籍別」内訳は statsDataId `0003147229` で `cdCat` 軸として取れるか `/inspect-estat-meta` で確認
- [ ] ブラジル人の県別データは `0003147704` (05表) に含まれるが、ベトナム/ネパール/フィリピンも別系列で取得経路を統一できるか確認
- [ ] 沖縄の米国人比率は在日米軍関係者 (SOFA 該当者) が在留外国人統計に含まれない可能性あり (確認要) → 含まれない場合 curiosity gap の根拠を改訂
- [ ] 上下位 5 県バーは独立 chart_type か、choropleth 補助 UI かは frontend 設計判断

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/foreign-residents.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-plan.md`
