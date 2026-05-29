---
type: theme-charts-planning-index
date: 2026-05-26
status: active
target: /themes/[themeKey] チャート構成リッチ化
tags: [theme-charts, planning]
---

# テーマダッシュボード チャート構成設計 — INDEX

各テーマ (`/themes/[themeKey]`) に対して、コロプレス地図 + 補助チャート (line / pie / bar) の構成案をテーマごとに 1 ファイル設計する。

成果物は **Phase 3** (line/pie 用 R2 exporter + `theme_metrics` への chart_type='line'/'pie' 行 seed) の入力となる。

## 親計画

- `docs/02_実装計画/theme-dashboard-plan.md` — D1+R2 統一移行のマスタープラン (Phase 1A 完了)

## 進捗表

| テーマ | カテゴリ | metric 数 | status | リサーチ完了 | レビュー済 |
|---|---|---|---|---|---|
| [population-dynamics](./population-dynamics.md) | demographics | 11 | drafted | ✅ | - |
| [aging-society](./aging-society.md) | demographics | 10 | drafted | ✅ | - |
| [living-housing](./living-housing.md) | lifestyle | 13 | **drafted (見本)** | ✅ | - |
| [local-economy](./local-economy.md) | economy | 6 | drafted | ✅ | - |
| [labor-wages](./labor-wages.md) | economy | 16 | drafted | ✅ | - |
| [manufacturing](./manufacturing.md) | industry | 13 | drafted | ✅ | - |
| [healthcare](./healthcare.md) | welfare | 13 | drafted | ✅ | - |
| [safety](./safety.md) | safety | 25 | drafted | ✅ | - |
| [education-culture](./education-culture.md) | education | 5+ | drafted | ✅ | - |
| [tourism](./tourism.md) | tourism | 10 | drafted | ✅ | - |
| [consumer-prices](./consumer-prices.md) | economy | 12 | drafted | ✅ | - |
| [foreign-residents](./foreign-residents.md) | demographics | 10 | drafted | ✅ | - |
| [occupation-salary](./occupation-salary.md) | economy | 39 | drafted | ✅ | - |
| [real-income](./real-income.md) | economy | 11 | drafted | ✅ | - |
| [labor-mobility](./labor-mobility.md) | economy | 8 | drafted | ✅ | - |
| [local-finance](./local-finance.md) | economy | 18 | drafted | ✅ | - |
| [fishery-marine](./fishery-marine.md) | industry | 12 | drafted | ✅ | - |

**全 17 テーマ drafted 完了 (2026-05-26)**。次は人間レビュー → `reviewed` 昇格 → Phase 3 (R2 exporter + seed) 着手。

status: `drafted` (Agent によるリサーチ稿) → `reviewed` (人間確認済) → `seeded` (D1 投入完了)

## 共通テンプレ

各テーマファイルは下記構造に統一する。

```markdown
---
type: theme-chart-planning
date: YYYY-MM-DD
theme_key: <theme-key>
status: drafted | reviewed | seeded
research_sources: [list of URLs]
tags: [theme-charts]
---

# {タイトル} ({theme_key}) — チャート構成設計

## 0. 結論サマリ (3 文以内)
左右レイアウト + 主要チャート 3 種を一言で。

## 1. 既存 metric 棚卸し
| rankingKey | shortLabel | role | panelTab | 想定 chart_type | chart_target | データ可用性メモ |

## 2. 推奨レイアウト

### 2-1. メインビュー (左 60%)
コロプレス: primary metric (= ...)

### 2-2. サブパネル (右 40%)
3 つのチャートを縦積み:
- **(A) 全国推移 line**: 何の時系列を見せるか + curiosity gap (例「過去最高」「半減」)
- **(B) 内訳 pie / 構成比 bar**: 何の breakdown を見せるか
- **(C) 上下位 5 県 bar**: primary metric の極値強調

### 2-3. パネルタブ (既存維持 or 改変)
タブ A / タブ B / 考察... — 既存 panelTabs に補助チャート追加案

## 3. 参考にしたサイト (リサーチ結果)
箇条書きで 3-6 個。なぜそのサイトのレイアウトを参考にしたか 1 行コメント。

## 4. 必要データ (Phase 3 で追加 export)
| データ種別 | 対象 metric | scope | 提案 R2 キー |
|---|---|---|---|
| timeseries (national) | ... | 1968-2023 | app/themes/{key}/timeseries/{metric}.json |
| breakdown (pie) | ... | latest | app/themes/{key}/breakdown/{metric}.json |

## 5. 新規 metric 提案 (TS リスト外、無ければ「なし」)
- (metric_key 候補 + 理由 + データ源 e-Stat statsDataId)

## 6. SEO / curiosity gap 観点
タイトル/description で打ち出すべき「意外な事実」を 2-3 個列挙
(参考: .claude/rules/blog-quality-standards.md)

## 7. 残課題 / 要検証
- 「この metric は cdCat 内訳取得できるか?」など Phase 3 着手前に確認すべき事項
```

## リサーチ方針

- **既存 metric を活かす** ことを優先 (TS の 17 indicator-sets リストにあるものを基本)
- **新規 metric 提案は「明確な意外性 + データ源あり」** の場合のみ追加 (D1 にデータが無ければ意味がないため)
- **参照サイト** は最低 3 種類:
  - **e-Stat 統計ダッシュボード** (https://dashboard.e-stat.go.jp/) — 公式の代表チャート
  - **nippon.com** (https://www.nippon.com/ja/japan-data/) — 一般読者向け curiosity gap 表現
  - **業界白書 / 専門サイト** (厚労省、国交省、観光庁、経産省、警察庁、文科省など) — テーマ別深掘り
- 検索クエリは英語 + 日本語両方試す (英語の方が比較データが見つかりやすい場合あり)

## Phase 3 着手時の流れ

1. 全 17 ファイルが `status: reviewed` になったら、
2. 必要データ表 (#4) を統合して、新規 R2 exporter スクリプトを設計
3. `theme_metrics` への line/pie 行 seed スクリプトを書く
4. seed → R2 export → loader 拡張 (Phase 1C と統合) → 描画

## 関連

- 親計画: `docs/02_実装計画/theme-dashboard-plan.md`
- D1 スキーマ: `packages/database/src/schema/themes.ts`
- 既存 TS source: `packages/types/src/indicator-sets/*.ts`
- ブログ品質基準 (curiosity gap): `.claude/rules/blog-quality-standards.md`
