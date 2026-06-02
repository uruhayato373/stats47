---
type: implementation-plan
date: 2026-06-02
status: active
target: survey-provenance
tags: [survey, ssds, estat, provenance, data-model]
---

# survey 出典モデルの是正 — 2 階層プロビナンス (SSDS 対応)

## 背景 / 問題

`survey`(調査) は「この統計がどの政府統計調査由来か」という**出典 (データプロビナンス)** の分類軸。
だが現状の実装は壊れている。実測で確認した事実:

1. **survey が間違ったレイヤーに付いている**
   - 出典はすべての可視化 (ranking / 時系列 / 円グラフ) の源である **metric** の性質のはず。
   - ところが `surveyId` は **ranking item だけ**に旧 D1 由来の非正規化カラム
     (`schemas.ts:206 surveyId: data.survey_id`) として焼き込まれている。
   - `metric.source` (`EstatSource`) は `statsDataId` を持つが **survey フィールドが無い** (全 2,209 metric で 0 件)。
   - 結果、時系列・円グラフは同じ調査由来でも出典を辿れない。survey は「ranking の出典タグ」に矮小化。

2. **SSDS (社会・人口統計体系) は statsDataId 単位では出典を表せない**
   - SSDS は複数の原統計を加工編成した**二次統計**。`displayName` が全件「社会・人口統計体系」で塗りつぶされる。
   - ranking の `ssds` バケットは 200 件・最大で、書籍販売額・評価地積・事業税・事故死… と**無関係ドメインが混在**。
   - **SSDS は全 metric の 52.8% (1,167/2,209)** を占める。コーナーケースではなく主問題。

3. **真の原典は cdCat01 (SSDS 指標コード) 単位で決まる**
   - SSDS metric の cdCat01 内訳: 基礎データ項目 (`#`なし) 461 / 社会生活統計指標 (`#`あり) 706。
   - 1 指標が比率 (分子/分母が別調査) のため **1 指標 ↔ 複数原典** になり得る。

## 出典取得経路の調査結論 (2026-06-02 実測)

| 経路 | 可否 | 根拠 |
|---|---|---|
| e-Stat JSON API (getMetaInfo / getStatsData) | ❌ | 「資料源(原典)」フィールドが存在しない。返るのは編成統計名と cat01 コード/名/単位のみ |
| 公式 Excel `kiso_ken.xlsx` (基礎データ項目一覧) | ✅ | **資料源**列に原典統計名。4,586 末端項目。`A1101 → 「国勢調査報告」「人口推計」` |
| 公式 Excel `shihyou_ken.xlsx` (社会生活統計指標一覧) | ✅ | **指標計算式**列に基礎項目への分解式。`#A01202 → A1101/B1103` |

→ **API では取れないが、公式 Excel 2 本で完全に機械取得・自動化できる。**

### 自動化チェーン

```
metric.source.cdCat01
 ├ #なし(基礎)  → kiso_ken.xlsx の資料源を直引き
 └ #あり(指標)  → shihyou_ken.xlsx の指標計算式から基礎項目コードを正規表現抽出
                 → 各基礎項目を kiso_ken.xlsx で引いて資料源を union
→ cdCat01 → originalSurveys[] の静的マップを生成 (git TS、年次更新)
```

### 実証カバレッジ (Phase 1 実装で確認済)

- cdCat01 provenance エントリ: **5,359** (基礎 4,586 + 指標 773)
- SSDS metric 原典解決: **1,145 / 1,167 = 98.1%**
  - うち正規化辞書ヒット: 865 (74.1%) → 既存 survey id へ
  - うち auto-slug fallback: 280 (24.0%) → `ssds-src:<原典名>` で必ず原典 1 つ以上を保証
  - 未解決: 22 (1.9%) — 財政比率・健康寿命など Excel に無い cdCat01。辞書個別追記で対応
- 解決後の原典分布 top: 国勢調査報告 314 / 人口推計 224 / 地方財政統計年報 124 / 都道府県決算状況調 122 …
  いずれも既存 survey バケットに実在する一次統計 → `ssds` の 200 件は本来の調査へ再分配できる

## 2 階層プロビナンスモデル

metric の出典を 2 階層で持つ:

| 階層 | 意味 | 解決元 |
|---|---|---|
| **compilation** (編成統計) | 社会・人口統計体系 / または一次統計そのもの | `metric.source.displayName` |
| **originalSurveys[]** (原典調査) | 真の原典 (0..N 件) | SSDS なら cdCat01→Excel、非SSDS なら statsDataId→survey |

解決ロジックは `kind` で分岐:
- `kind:"estat"` かつ displayName=社会・人口統計体系 → cdCat01 → `ssds-provenance` マップ
- それ以外の `kind:"estat"` (国勢調査など一次統計) → statsDataId/displayName → survey (1:1)
- `kind:"calculated"` (分子/分母) → 参照先 metric の原典を集合継承
- `kind:"mlit"` / `kind:"external"` → 個別

## 実装フェーズ

### Phase 1 — 出典マッピング基盤 (本コミットで完了) ✅

成果物 (`packages/data-configs/`):
- `scripts/ssds/extract-ssds-sources.py` — 公式 Excel 2 本 → `cdcat01-sources.generated.json` 抽出器 (要 openpyxl、年次再生成)
- `src/ssds/cdcat01-sources.generated.json` — cdCat01 → {kind, sources[](原典名), formula?} (5,359 件)
- `src/ssds/source-names.generated.json` — 原典名ユニーク (179 種、辞書素材)
- `src/ssds/source-name-to-survey.ts` — 原典名 → survey id 正規化辞書 (head を既存 id へ / 高頻度未登録は PROPOSED_NEW)
- `scripts/ssds/build-ssds-provenance.ts` — 辞書を当てて `ssds-provenance.generated.json` (cdCat01 → originalSurveys[]) 生成 + カバレッジ報告
- `src/ssds/ssds-provenance.generated.json` — アプリ/exporter が読む最終形

検証: `cd packages/data-configs && npx tsx scripts/ssds/build-ssds-provenance.ts` → 98.1% 解決を再現。

### Phase 2 — survey マスタ拡張 + 辞書カバレッジ向上 (完了) ✅

成果:
- `PROPOSED_NEW_SURVEYS` を 14 → 40 件に拡張 (高頻度 auto-slug を昇格: 道路統計年報・行政投資実績・
  漁業養殖業生産・日本の将来推計人口・日本銀行統計 等)。`scripts/ssds/sync-survey-master.ts` で
  `surveys.json` へ冪等同期 (41 → 81 件)。
- `CDCAT01_SOURCE_OVERRIDE` で Excel に資料源が無い 22 件 (財政比率 D22xx・銀行預金 C360xxx・
  健康寿命 I160x・人口割合 #A03506 等) を原典へ手当て。
- **結果: SSDS metric 原典解決 98.1% → 100% (1167/1167)、辞書ヒット率 74.1% → 90.4%。**
  未解決 0、auto-slug fallback 9.6% (112 件、低頻度テールで段階的に昇格可)。

検証: `cd packages/data-configs && npx tsx scripts/ssds/build-ssds-provenance.ts` → 100% を再現。

### Phase 3 — metric への出典付与 (時系列・円グラフへ波及)

- `metric.source` から `originalSurveys[]` を解決するユーティリティを `packages/data-configs` に追加
  (statsDataId/cdCat01/calculated を分岐)。
- 時系列 (theme-dashboard) / 円グラフ (CompositionChart) に「出典: ◯◯調査」表示を追加。
- ranking item の焼き込み `survey_id` も同マッピング由来へ統一 (drift 解消)。

### Phase 4 — survey ページの是正 + 再分配

- `/survey` 一覧の N+1 列挙 (`page.tsx:40-54`: 全 ranking を 1 件ずつ fetch) を撤廃し、
  per-survey items.json ベースの件数集計へ。
- `ssds` バケット 200 件を originalSurveys ベースで本来の調査へ再分配。
- exporter (`ranking-items-per-url-snapshot.ts`) を originalSurveys 駆動に。
- all.json と items.json の整合性チェック (現状 41 survey 中 4 件が items.json 404) を生成器に追加。

## 関連

- データ層正典: `docs/01_技術設計/19_完全DBレス設計.md` (出典マップは Reference = 外部Excelから再生成)
- タクソノミー: `docs/01_技術設計/16_タクソノミー役割分担.md` (survey を category/theme/tag と並ぶ軸として要追記)
- 出典 Excel: https://www.stat.go.jp/data/ssds/2.html (アクセス日 2026-06-02)
