---
type: theme-chart-planning
date: 2026-05-26
theme_key: labor-mobility
status: drafted
research_sources:
  - https://www.mhlw.go.jp/toukei/list/9-23-1b.html
  - https://www.jil.go.jp/kokunai/blt/backnumber/2024/11/c_01.html
  - https://www.jil.go.jp/kokunai/statistics/shuyo/0210.html
  - https://www.stat.go.jp/data/shugyou/2022/index.html
  - https://www.nippon.com/ja/japan-data/h01021/
  - https://workstyle.medefull.com/remote-japan-regions-2025/
tags: [theme-charts, labor-mobility]
---

# 人材流動性・雇用環境 (labor-mobility) — チャート構成設計

## 0. 結論サマリ

左コロプレスで「離職率」(2024 年最新) を地図表示、右に **(A) 有効求人倍率の全国推移ライン (2008→2024 で 0.47→1.25 倍に V 字回復→2024 で頭打ち)**、**(B) 雇用形態別構成パイ (正規 63% / 非正規 37%、うち非正規はパート 49% / 契約 13% / 派遣 8%)**、**(C) テレワーク実施率 上下位 5 県バー (東京 54% vs 鳥取・青森 10% 未満で 5 倍超格差)** の 3 枚を縦に積む。

## 1. 既存 metric 棚卸し

| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |
|---|---|---|---|---|---|---|
| `turnover-rate` | 離職率 | primary | 流動性 | choropleth + line + bar | prefecture / national | 雇用動向調査 (年次) 2024 年: 全国 14.2% |
| `job-change-rate` | 転職率 | secondary | 流動性 | choropleth + line | prefecture / national | 就業構造基本調査 (5 年ごと、最新 2022) |
| `active-job-opening-ratio` | 有効求人倍率 | secondary | 雇用環境 | choropleth + line | prefecture / national | 一般職業紹介状況 (月次→年平均) 2024 年: 全国 1.25 倍、福井 1.91 倍が最高 |
| `unemployment-rate` | 失業率 | secondary | 雇用環境 | choropleth + line | prefecture / national | 労働力調査 (年次) |
| `employment-rate` | 就業率 | context | 雇用環境 | choropleth + line | prefecture / national | 就業構造基本調査 (2022 全国 60.9%、東京 66.6% トップ) |
| `telework-rate` | テレワーク率 | secondary | 働き方 | choropleth + bar | prefecture | 通信利用動向調査 (企業編) 東京 54.4% vs 地方 10% 未満 |
| `side-job-rate` | 副業率 | context | 働き方 | choropleth + line | prefecture / national | 就業構造基本調査 2022: 全国 305 万人 (5 年で +60 万) |
| `monthly-average-actual-working-hours-male` | 月間労働時間(男) | context | 働き方 | choropleth + line | prefecture / national | 毎月勤労統計 (地方調査) |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `turnover-rate` (離職率, 2024 年)

- 最新年データは 2024 (令和 6 年雇用動向調査、e-Stat 公表 2025-08-26)
- 配色: 赤系の発散カラースケール (高いほど赤、全国平均 14.2% を白)
- ホバー時: 県名 + 離職率 + 全国順位 + 入職率併記

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 全国推移ライン

**何を見せるか**: 有効求人倍率の全国推移 (2008-2024, 年次 17 ポイント)

- データ源: JILPT 主要労働統計指標 / 一般職業紹介状況の年平均
- curiosity gap: **「リーマン後 0.47 → コロナ前 1.62 で 3 倍に V 字回復、2024 は 1.25 で頭打ち」** をタイトルで打ち出す
- 必要データ: `app/themes/labor-mobility/timeseries/active-job-opening-ratio.json`
  ```json
  { "metricKey": "active-job-opening-ratio", "scope": "national",
    "unit": "倍", "series": [{ "year": 2008, "value": 0.88 }, { "year": 2009, "value": 0.47 }, ..., { "year": 2024, "value": 1.25 }] }
  ```
- 補助線: 離職率 (右軸、2024 = 14.2%) を 2 軸で重ねるとさらに「人手不足の構造化」が見える

#### (B) 雇用形態別構成パイチャート

**何を見せるか**: 全雇用者の **雇用形態内訳** (2022 就業構造基本調査)

| 区分 | 構成比 | 注目度 |
|---|---|---|
| 正規雇用 | 約 63% | - |
| パート | 約 18% | 非正規最多 |
| アルバイト | 約 8% | - |
| 契約社員 | 約 5% | - |
| 派遣社員 | 約 3% | - |
| その他 (嘱託など) | 約 3% | - |

- データ源: e-Stat 就業構造基本調査 (statsDataId 候補: 0003090170 系、雇用形態別)
- 必要データ: `app/themes/labor-mobility/breakdown/employment-types.json`
  ```json
  { "metricKey": "turnover-rate", "breakdown_dimension": "雇用形態",
    "year": 2022, "items": [{ "label": "正規", "value": 35880000, "ratio": 0.63 }, ...] }
  ```
- 都道府県切替トグル付き (東京は派遣 5%、地方は正規率高めの構造差を可視化)

#### (C) 上下位 5 県バーチャート

**何を見せるか**: テレワーク実施率 TOP 5 + BOTTOM 5 (2023 通信利用動向調査)

```
東京都   54.4% ▰▰▰▰▰▰▰▰▰▰▰▰▰
神奈川県 44.0% ▰▰▰▰▰▰▰▰▰▰▰
埼玉県   42.0% ▰▰▰▰▰▰▰▰▰▰
千葉県   40.0% ▰▰▰▰▰▰▰▰▰▰
大阪府   35.0% ▰▰▰▰▰▰▰▰▰
─ 全国平均 24% ─
高知県   12.0% ▰▰▰
宮崎県   11.0% ▰▰▰
鳥取県    9.5% ▰▰
秋田県    9.0% ▰▰
青森県    8.5% ▰▰
```

- 出典: 総務省「通信利用動向調査」企業編 (令和 5 年度)
- `app/ranking/telework-rate/values.json` (prefecture, Phase 2 で snapshot 化) から派生
- 別途 export 不要

### 2-3. パネルタブ — 既存維持 + 補助チャート追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **流動性** | turnover-rate / job-change-rate | line: 全国離職率の推移 (2004→2024、コロナで離職超過→2021 入職超過に逆転)<br>bar: 産業別離職率 (生活関連サービス 20.8% / 宿泊飲食 26% / 製造 9% など) |
| **雇用環境** | active-job-opening-ratio / unemployment-rate / employment-rate | line: 失業率の全国推移 (バブル後 5.4% → 2024 年 2.5% に半減)<br>bar: 県別有効求人倍率 (福井 1.91 vs 福岡 1.06、最大 1.8 倍格差) |
| **働き方** | telework-rate / side-job-rate / monthly-average-actual-working-hours-male | line: 副業者数の全国推移 (2017 245 万 → 2022 305 万、5 年で +25%)<br>pie: 副業の動機別構成 (収入補填 / スキル / 趣味延長) |
| **考察** | (空) | (現状通り、本文記事用) |

## 3. 参考にしたサイト (リサーチ結果)

- [厚生労働省: 雇用動向調査 結果一覧](https://www.mhlw.go.jp/toukei/list/9-23-1b.html) — 公式の入職率/離職率の県別・産業別集計表。チャート構成 (年次推移 line + 地域別 bar) の典型例
- [JILPT: 入職率・離職率トレンド分析 2024-11](https://www.jil.go.jp/kokunai/blt/backnumber/2024/11/c_01.html) — 「2020 離職超過 → 2021 入職超過に転換」の curiosity gap を打ち出している。本記事のサムネ案に流用可
- [JILPT: 都道府県別有効求人倍率 指標解説](https://www.jil.go.jp/kokunai/statistics/shuyo/0210.html) — 月次→年平均の集計手法。時系列データの加工方法を参考
- [総務省: 令和 4 年就業構造基本調査](https://www.stat.go.jp/data/shugyou/2022/index.html) — 副業者 305 万人、有業率 60.9% (東京 66.6% トップ) の公式数値出典。5 年ごと調査
- [Nippon.com: テレワーク、東京以外はほとんどやってない?](https://www.nippon.com/ja/japan-data/h01021/) — 「東京 vs 地方」の極端な格差を curiosity gap として打ち出す典型例。タイトルパターン参考
- [MEDEFULL WORKSTYLE: 日本のリモートワーク 都道府県別普及率 2025](https://workstyle.medefull.com/remote-japan-regions-2025/) — 通信利用動向調査ベースで県別 % 数値が網羅されている。バーチャート (C) のデータ源

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (national) | `active-job-opening-ratio` | 2008-2024 (年次 17 点) | `app/themes/labor-mobility/timeseries/active-job-opening-ratio.json` | 一般職業紹介状況 年平均 |
| timeseries (national) | `turnover-rate` | 2004-2024 (年次 21 点) | `app/themes/labor-mobility/timeseries/turnover-rate.json` | 雇用動向調査 全国集計 |
| timeseries (national) | `unemployment-rate` | 2000-2024 (年次) | `app/themes/labor-mobility/timeseries/unemployment-rate.json` | 労働力調査 |
| timeseries (national) | `side-job-rate` | 2002-2022 (5 年ごと 5 点) | `app/themes/labor-mobility/timeseries/side-job-rate.json` | 就業構造基本調査 |
| breakdown (pie) | `turnover-rate` | 2022 | `app/themes/labor-mobility/breakdown/employment-types.json` | 就業構造基本調査 雇用形態別 |
| breakdown (bar) | `turnover-rate` | 2024 | `app/themes/labor-mobility/breakdown/turnover-by-industry.json` | 雇用動向調査 産業別 (生活関連 20.8% / 宿泊飲食 26% など) |

**統合 JSON 案** (1 fetch で複数 chart データを取れる構成):

```json
{
  "themeKey": "labor-mobility",
  "timeseries": {
    "active-job-opening-ratio": { "scope": "national", "unit": "倍", "series": [...] },
    "turnover-rate": { ... },
    "side-job-rate": { ... }
  },
  "breakdown": {
    "employment-types": { "label": "雇用形態", "items": [...] },
    "turnover-by-industry": { "label": "産業別離職率", "items": [...] }
  }
}
```

→ `app/themes/labor-mobility/charts.json` 1 ファイルにまとめる方が fetch 回数が減って fast。Phase 3 設計時に判断。

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `non-regular-employment-ratio` (非正規雇用率) | 全国 37% だが沖縄 44% / 山形 32% など県差大。テレワーク率と負相関の可能性 | 就業構造基本調査 (statsDataId: 0003090170 系) |
| `turnover-rate-hospitality` (宿泊飲食業 離職率) | 産業別で最高水準 (パート 36.9%)。観光地県 (沖縄/京都) でとくに高い構造を可視化 | 雇用動向調査 産業別 |
| `young-worker-job-change-rate` (若年層転職率, 25-34 歳) | 全年齢平均より高い (推定 10% 超)。Z 世代の流動性として SEO 強い | 就業構造基本調査 年齢別 |

非正規雇用率は **既存 metric の鏡像で curiosity gap を作れる** ため最優先で追加候補。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実 (`.claude/rules/blog-quality-standards.md` 準拠):

1. **「テレワーク率は東京 54% vs 青森 9% で 6 倍格差、なぜ?」** — 数値 + 疑問形
2. **「有効求人倍率はリーマン後 0.47 → 2019 年 1.62 で 3 倍に V 字回復、コロナで頓挫」** — 時系列ドラマ
3. **「離職率トップは宿泊飲食業 26%、製造業の 3 倍──観光県ほど不安定」** — 構造比較
4. **「副業者は 5 年で +60 万人、305 万に──"1 つの会社"が崩れた」** — 増加率 + 社会変化
5. **「福井の有効求人倍率 1.91 vs 福岡 1.06、なぜ北陸が人手不足?」** — 地域逆説

theme description (D1 themes.description) を以下に書き換え推奨:

> 「2024 年の有効求人倍率は 1.25 倍で頭打ち、離職率は 14.2%。テレワーク率は東京 54% vs 地方 10% 未満で 6 倍格差、副業者は 5 年で 305 万人へ +25%。47 都道府県の雇用流動性と働き方の構造を地図とランキングで比較。」

## 7. 残課題 / 要検証

- [ ] `turnover-rate` の e-Stat statsDataId が時系列全件 (2004-2024) 取得できるか確認 (雇用動向調査は年次で表構成が変わるため `/inspect-estat-meta` で確認)
- [ ] 産業別離職率は `cdCat01` 等のカテゴリ次元で取れるか、それとも別 statsDataId か (雇用動向調査の cdCat 構造を要確認)
- [ ] テレワーク率の都道府県別データは通信利用動向調査の企業編にあるが、e-Stat に SDMX で載っているか、PDF 表のみか確認 (PDF のみなら手動 CSV 化スクリプト必要)
- [ ] 副業率の県別データは就業構造基本調査の地域編 (statsDataId: 0003090170) で取得可能だが、5 年に 1 回しか更新されない点を UI 上明示する必要あり
- [ ] 有効求人倍率は「受理地別」と「就業地別」の 2 系列があるため、本ダッシュボードでどちらを採用するか統一基準が必要 (推奨: 就業地別、福井 1.91 倍の数値はこれ)

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/labor-mobility.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-plan.md`
