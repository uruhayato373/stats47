---
type: theme-chart-planning
date: 2026-05-26
theme_key: fishery-marine
status: drafted
research_sources:
  - https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/
  - https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&lid=000001456355
  - https://www.jfa.maff.go.jp/j/kikaku/wpaper/R5/attach/pdf/240611_3-4.pdf
  - https://www.jfa.maff.go.jp/j/kikaku/wpaper/r05_h/sankou/sankou_2_1.html
  - https://eleminist.com/article/3941
  - https://www.nippon.com/en/japan-topics/g02520/kelp-under-threat-in-hokkaido-waters-the-impact-of-climate-change-on-japan%E2%80%99s-marine-prod.html
tags: [theme-charts, fishery-marine]
---

# 漁業（水産業） (fishery-marine) — チャート構成設計

## 0. 結論サマリ

左コロプレスで「漁獲量」(2023 年、北海道 87 万トンで全国の約 30%) を地図表示、右に **(A) 全国漁獲量推移ライン (1984 年ピーク 1,282 万トン → 2023 年 372 万トンでピーク比 1/3 以下)**、**(B) 部門内訳パイ (海面漁業 / 海面養殖 / 内水面)**、**(C) 上下位 5 県バー (北海道 870 千t vs 奈良 0t)** の 3 枚を縦に積む。養殖・経済・雇用・魚種別の各タブは「全国推移ライン」を追加し「捕る漁業から育てる漁業へ」のシフトと「就業者半世紀で 7 割減」を可視化する。

## 1. 既存 metric 棚卸し

| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |
|---|---|---|---|---|---|---|
| `fish-catch` | 漁獲量 | primary | 漁獲 / 推移 | choropleth + line + bar | prefecture / national | 海面漁業生産統計 (1975-2023, statsDataId C3121) |
| `marine-fishery-catch` | 海面漁獲量 | secondary | 漁獲 | choropleth + line | prefecture / national | 同上 C312101 |
| `inland-fishery-catch` | 内水面漁獲量 | secondary | 漁獲 | choropleth | prefecture | C312102 (年次, 滋賀/茨城が上位) |
| `fishing-port-count` | 漁港数 | context | 漁獲 | choropleth + bar | prefecture | 水産庁 漁港一覧 (北海道 282 港で最多) |
| `fishing-port-count-ksj` | 漁港数(KSJ) | context | 漁獲 | choropleth | prefecture | 国土数値情報 (Tier B 既登録) |
| `aquaculture-harvest` | 養殖収獲量 | secondary | 養殖 | choropleth + line | prefecture / national | C3122 (2000-2023) |
| `marine-aquaculture-harvest` | 海面養殖 | secondary | 養殖 | choropleth + line | prefecture / national | C312201 (青森ホタテ・広島カキ・愛媛マダイ等) |
| `inland-aquaculture-harvest` | 内水面養殖 | secondary | 養殖 | choropleth | prefecture | C312202 (鹿児島ウナギ・愛知ウナギが上位) |
| `marine-fishery-aquaculture-output-value` | 産出額(新) | primary | 経済 | choropleth + line | prefecture / national | C31201 (2017-, 北海道が突出) |
| `marine-fishery-output-value` | 海面漁業産出額 | secondary | 経済 | choropleth | prefecture | C31201 内訳 |
| `fishery-output-value` | 産出額(旧) | context | 経済 | line (national) | national | C3120 (〜2016 で系列終了) |
| `fishery-workers` | 漁業就業者 | primary | 雇用 / 推移 | choropleth + line + bar | prefecture / national | C3125 (1975-2023, ピーク比 7 割減) |
| `fishery-species-catch-scallop` | ホタテガイ | secondary | 魚種別 | choropleth + pie | prefecture | 0003238633 (1956-2015, 40 都道府県) |
| `fishery-species-catch-japanese-squid` | スルメイカ | secondary | 魚種別 | choropleth | prefecture | 同上 |
| `fishery-species-catch-tuna` / `bonito` / `mackerel` / `pacific-saury` / `yellowtail` / `sardine` / `pollock` / `kelp` / `snow-crab` / `sea-bream` | 各魚種 | secondary/context | 魚種別 | choropleth | prefecture | 同 statsDataId |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)

**コロプレス地図**: `fish-catch` (漁獲量, 2023 年)

- 配色: 青系の単調カラースケール (多いほど濃い青、海らしい配色)
- ホバー時: 県名 + 漁獲量 (トン) + 全国シェア + 順位
- **北海道だけ突出 (870千t = 全国 30%)** が一目で分かる「単一県支配型」の地図

### 2-2. サブパネル (右 40%) — 縦 3 段

#### (A) 全国漁獲量推移ライン

**何を見せるか**: 全国の漁業・養殖業 総生産量 推移 (1975-2023, 年次)

- データ源: 漁業・養殖業生産統計 全国集計 (海面漁業 + 海面養殖 + 内水面)
- curiosity gap: **「1984 年ピーク 1,282 万トン → 2023 年 372 万トンで 3 分の 1 以下」**
- 海面漁業のみ / 養殖含むの 2 系列を重ねて「捕る漁業の凋落・養殖の横ばい」を対比
- 必要データ: `app/themes/fishery-marine/timeseries/fish-catch.json`
  ```json
  { "metricKey": "fish-catch", "scope": "national", "unit": "千トン",
    "series": [{ "year": 1975, "value": 10545 }, ..., { "year": 2023, "value": 3720 }] }
  ```

#### (B) 部門内訳パイチャート

**何を見せるか**: 漁業・養殖業 生産量の **部門内訳** (2023 年, 4 区分)

| 区分 | 生産量 | 割合 |
|---|---|---|
| 海面漁業 | 約 273 万トン | 約 73% |
| 海面養殖業 | 約 91 万トン | 約 24% |
| 内水面漁業 | 約 2 万トン | 約 1% |
| 内水面養殖業 | 約 3 万トン | 約 1% |

- データ源: e-Stat 海面漁業生産統計 (statsDataId 0003238637 ベース)
- 必要データ: `app/themes/fishery-marine/breakdown/fish-catch-sector.json`
  ```json
  { "metricKey": "fish-catch", "breakdown_dimension": "部門",
    "year": 2023, "items": [{ "label": "海面漁業", "value": 2731000, "ratio": 0.73 }, ...] }
  ```
- 都道府県切替トグル付き (デフォルト全国、選択で県別: 北海道は海面漁業+養殖がほぼ拮抗、広島・愛媛は養殖比率が高い)

#### (C) 上下位 5 県バーチャート

**何を見せるか**: 漁獲量 TOP 5 + BOTTOM 5 (2023 年)

```
北海道  870,286 t ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰
茨城県  285,164 t ▰▰▰▰▰
長崎県  262,233 t ▰▰▰▰▰
宮城県  187,176 t ▰▰▰
静岡県  147,231 t ▰▰▰
─ 全国平均 79千t ─
山梨県    1,200 t ▏
滋賀県      900 t ▏
群馬県      400 t ▏
岡山県    2,555 t ▏
奈良県        0 t  (内陸県は海面漁業ゼロ)
```

- **北海道が 2 位 (茨城) の 3 倍** という curiosity gap を強調
- `app/ranking/fish-catch/values.json` から派生 (別途 export 不要)

### 2-3. パネルタブ — 既存維持 + 補助チャート追加

| タブ | metrics (既存) | 追加チャート提案 |
|---|---|---|
| **漁獲** | fish-catch / marine / inland / fishing-port-count(-ksj) | line: 海面漁獲量の全国推移 (1984 ピーク → 2023 で 70% 減) |
| **養殖** | aquaculture-harvest / marine-aquaculture / inland-aquaculture | line: 養殖収獲量の全国推移 (2000→2023、ほぼ横ばい 100 万t) + 「捕る漁業」との対比注釈 |
| **経済** | output-value 3 種 | line: 産出額 (新 C31201) の全国推移 + 「数量減でも単価上昇で金額は底堅い」curiosity gap |
| **雇用** | fishery-workers | line: 漁業就業者数の全国推移 (1975 年 約 57 万人 → 2023 年 約 12.3 万人で 78% 減)<br>bar: 上下位 5 県 (北海道 24,378 vs 内陸 0) |
| **推移** | fish-catch / fishery-workers | dual-axis line: 漁獲量と就業者数の連動 (1975-2023) |
| **魚種別** | scallop / squid / tuna / bonito 等 12 種 | pie: ホタテ県別シェア (北海道 60% + 青森 30% = **東北北海道で 95% 独占**)<br>pie: コンブ類 県別シェア (北海道がほぼ 100%) |
| **考察** | (空) | (現状通り、本文記事用) |

## 3. 参考にしたサイト (リサーチ結果)

- [農林水産省 海面漁業生産統計調査](https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/) — 公式統計トップ。年次の確報・概数公表スケジュールと統計表 PDF 一覧
- [e-Stat 令和5年漁業・養殖業生産統計 確報](https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&lid=000001456355) — 2023 年確報の statsDataId 一覧。都道府県別・魚種別・部門別を網羅
- [水産庁 令和5年度水産白書 概要](https://www.jfa.maff.go.jp/j/kikaku/wpaper/R5/attach/pdf/240611_3-4.pdf) — 漁業就業者数の長期推移グラフ (1975 年 約 57 万 → 2023 年 12 万人台) と「育てる漁業」シフトの公式図表
- [水産庁 部門別生産量及び生産額の推移](https://www.jfa.maff.go.jp/j/kikaku/wpaper/r05_h/sankou/sankou_2_1.html) — 海面漁業 / 養殖 / 内水面の 4 区分時系列。1984 年ピーク 1,282 万トンの根拠
- [Eleminist: 都道府県別漁獲量ランキング 2024](https://eleminist.com/article/3941) — 一般読者向けランキング記事の構成参考。北海道 870,286 t / 2 位茨城 285,164 t / 5 位静岡 147,231 t の数値出典
- [Nippon.com: Kelp Under Threat in Hokkaido Waters](https://www.nippon.com/en/japan-topics/g02520/kelp-under-threat-in-hokkaido-waters-the-impact-of-climate-change-on-japan%E2%80%99s-marine-prod.html) — 気候変動 × 北海道水産物の curiosity gap 表現の参考 (ホタテ・コンブの北海道依存と環境リスク)

## 4. 必要データ (Phase 3 で追加 export)

| データ種別 | 対象 metric_key | scope | 提案 R2 キー | 元データ |
|---|---|---|---|---|
| timeseries (national) | `fish-catch` | 1975-2023 (年次) | `app/themes/fishery-marine/timeseries/fish-catch.json` | 漁業・養殖業生産統計 全国 |
| timeseries (national) | `marine-fishery-catch` | 1975-2023 | `app/themes/fishery-marine/timeseries/marine-fishery-catch.json` | 同上 海面漁業 |
| timeseries (national) | `aquaculture-harvest` | 2000-2023 | `app/themes/fishery-marine/timeseries/aquaculture-harvest.json` | 同上 養殖計 |
| timeseries (national) | `marine-fishery-aquaculture-output-value` | 2017-2023 | `app/themes/fishery-marine/timeseries/output-value.json` | C31201 |
| timeseries (national) | `fishery-workers` | 1975-2023 (年次) | `app/themes/fishery-marine/timeseries/fishery-workers.json` | C3125 |
| breakdown (pie) | `fish-catch` 部門別 | 2023 | `app/themes/fishery-marine/breakdown/fish-catch-sector.json` | 部門別 (海面漁業/養殖/内水面) |
| breakdown (pie, 県別) | `fishery-species-catch-scallop` | 2015 | `app/themes/fishery-marine/breakdown/scallop-by-prefecture.json` | 0003238633 (北海道+青森で 95%) |
| breakdown (pie, 県別) | `fishery-species-catch-kelp` | 2015 | `app/themes/fishery-marine/breakdown/kelp-by-prefecture.json` | 同上 (北海道独占) |

**統合 JSON 案** (1 fetch で全 chart データ取得):

```json
{
  "themeKey": "fishery-marine",
  "timeseries": {
    "fish-catch": { "scope": "national", "unit": "千トン", "series": [...] },
    "fishery-workers": { "scope": "national", "unit": "人", "series": [...] }
  },
  "breakdown": {
    "fish-catch-sector": { "label": "部門", "items": [...] },
    "scallop-by-prefecture": { "label": "ホタテ県別", "items": [...] }
  }
}
```

→ `app/themes/fishery-marine/charts.json` 1 ファイル集約を Phase 3 設計時に判断。

## 5. 新規 metric 提案 (TS リスト外)

| 候補 metric | 理由 | データ源 |
|---|---|---|
| `fishery-export-value` (水産物輸出額) | ホタテ輸出が中国規制で 2024 年に急落 → 2025 年回復、という時事性。北海道集中の curiosity gap が強い | 財務省 貿易統計 (e-Stat) |
| `aquaculture-pearl-harvest` (真珠養殖収獲量) | 三重・愛媛・長崎の地域集中型。「ほぼ 3 県で 100%」のパイチャート訴求力 | C312201 真珠類 |
| `fishery-worker-aging-ratio` (漁業就業者 65 歳以上比率) | 高齢化率 40% 超で全産業最高水準。後継者問題の数値化 | 漁業センサス |

水産物輸出額は時事性 + 地域偏在の両方を持つため最優先で追加候補。

## 6. SEO / curiosity gap 観点

タイトル / description で打ち出すべき意外な事実 (`.claude/rules/blog-quality-standards.md` 準拠):

1. **「漁獲量1位は北海道87万トン、全国の30%──2位茨城の3倍」** — 単一県支配の倍率訴求
2. **「ホタテは北海道+青森で95%独占、なぜ東北沿岸だけ?」** — 疑問形 + 地域偏り (流氷由来プランクトン)
3. **「漁業就業者は半世紀で57万人→12万人、78%減──それでも金額は底堅い真因」** — 逆説 (数量減 vs 単価上昇)
4. **「漁獲量ピークは1984年1,282万トン、いまは3分の1以下に」** — 長期推移の衝撃

theme description (D1 themes.description) 既存案は良好。タイトルは以下推奨:

> 「漁獲量1位は北海道87万トンで全国30%独占｜ホタテ95%・コンブほぼ100%、なぜ東北北海道に集中? 漁業就業者は半世紀で78%減 (2023)」

## 7. 残課題 / 要検証

- [ ] `fish-catch` の全国集計 (1975-2023 年次) が単一 statsDataId で取れるか、`/inspect-estat-meta` で C3121 系列確認
- [ ] 部門内訳 pie のソース: 海面漁業/海面養殖/内水面漁業/内水面養殖の 4 区分が同一 statsDataId の `cdCat01` 等で取れるか
- [ ] 魚種別漁獲量 (0003238633) は 2015 年で終了 → 2016 年以降の代替 statsDataId (海面漁業生産統計 確報) を確認
- [ ] 北海道のシェア計算で 870千t / 全国 (海面漁業 273 万t? or 漁業+養殖 372 万t?) の分母定義を明示する必要あり
- [ ] 漁業就業者数 1975 年ピーク値 (約 57 万人) は水産白書 PDF 図表の transcribe 必須 (本文には未記載)
- [ ] 上下位 5 県 bar で内陸県 (奈良/群馬/栃木/長野/埼玉) を BOTTOM に含めるか、「海面漁業ゼロ」を別表記するか UX 判断

## 関連ファイル

- 親 INDEX: [`README.md`](./README.md)
- 見本: [`living-housing.md`](./living-housing.md)
- D1 schema: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/fishery-marine.ts`
- 親計画: `docs/02_実装計画/theme-dashboard-d1-migration.md`
