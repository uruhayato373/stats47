---
type: theme-catalog-review
date: 2026-07-11
status: proposal-ready
theme: healthcare
tags: [theme-catalog, healthcare, metrics, charts]
---

# テーマレビュー: healthcare（医療・健康）

## 結論

主問は、**その地域の医療需要に対し、医師・看護師・病床等の医療資源がどう配置され、健康結果にどのような地域差があるか**とする。

ページは次の4層に分ける。

1. **健康結果**: 健康寿命、主要死因、生活習慣病
2. **需要・利用**: 受療率、在院日数、病床利用率、1人当たり医療費
3. **供給資源**: 医師、看護師、病床、病院、薬局
4. **予防・アクセス**: 健診受診率、過疎地域の医療アクセスGIS

現行カタログは供給指標に偏り、健康寿命や全体の受療率がない。また、異なる単位・値域を同一Y軸で結ぶ折れ線が2件あり、死因別の「率」を内訳のように見せるdonutも不適切である。

## 公式根拠

### 厚生労働省「地域医療構想」

- URL: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000080850.html
- 調査日: 2026-07-11
- 中長期的な人口構造と地域の医療ニーズの質・量の変化を見据え、医療機関の機能分化・連携を進めることが目的
- 都道府県は病床機能報告等を用い、不足する医療機能と各機関の役割を明確化
- 病床数の単純な多寡ではなく、需要と機能の対応関係を読む必要がある

### 厚生労働省「健康日本21（第三次）」

- URL: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/kenkounippon21_00006.html
- 調査日: 2026-07-11
- 健康寿命の延伸、健診・検診受診、生活習慣病予防を主要な政策軸とする
- 予防指標は死亡率と直接の因果関係として表現せず、別層で読ませる

### 総務省統計局「社会・人口統計体系」

- URL: https://www.stat.go.jp/data/ssds/index.htm
- 調査日: 2026-07-11
- 現行の医師、看護師、病院、病床、医療費、死亡、健診の地域統計出典

## テーマ境界

| テーマ | 責務 |
|---|---|
| `aging-society` | 年齢構成と支え手の比率。後期高齢者医療費はhealthcareへ移す候補 |
| `healthcare` | 健康結果、受療、医療資源、予防、アクセス |
| 将来のmental-health専用テーマ | 精神科病院、気分障害受療率等。現在はhealthcareのcontextに留める |

## 現行指標の提案

| rankingKey | 現行 role | 提案 | 理由 |
|---|---|---|---|
| `physicians-in-medical-facilities-per-100k` | primary | **primary keep** | 医療供給の中心。人口10万人当たりを明示 |
| `nurses-in-medical-facilities-per-100k` | secondary | **primaryへ変更** | 医師だけでなく医療チームの供給を見る |
| `general-hospital-bed-count-per-100k` | context | **primaryへ変更** | 地域医療構想の中心。多い=充足とは限らない注記が必要 |
| `general-hospital-count-per-100k` | secondary | **secondary keep** | 施設密度。病床機能を示さない限界を明記 |
| `national-medical-expense-per-person` | secondary | **secondary keep** | 利用・費用の指標。現行2022年の単年値なので「推移」表現は要検証 |
| `general-hospital-avg-length-of-stay` | context | **secondaryへ変更** | 医療利用と供給体制の差を読む主要指標 |
| `general-hospital-bed-occupancy-rate` | context | **secondaryへ変更** | 病床数と実際の利用の対応を読む |
| `deaths-lifestyle-diseases-per-100k` | secondary | **secondary keep** | 健康結果。年齢調整値でない場合は高齢化の影響を注記 |
| `health-checkup-rate-lifestyle-diseases` | secondary | **secondary keep** | 予防の代表指標。死亡率と単純な因果で結ばない |
| `deaths-diabetes-per-100k` | context | **context keep** | 疾患別詳細。主要チャートからは外す |
| `pharmacy-count-per-100k` | context | **context keep** | 供給資源の詳細 |
| `psychiatric-hospital-count-per-100k` | context | **context keep** | 精神医療の詳細。全体供給と混ぜない |
| `treatment-rate-mood-disorder-outpatient` | context | **context keep** | 精神医療需要の一部。主要チャートからは外す |

### 追加指標候補

| rankingKey | 提案 | 注意 |
|---|---|---|
| `healthy-life-expectancy-male` | **primary追加候補** | 年、47都道府県、定義の一致を確認 |
| `healthy-life-expectancy-female` | **primary追加候補** | 男女を対で扱う。単一指標のみは不可 |
| `inpatient-rate-per-100k` または `inpatient-rate-by-bedtype` | **secondary追加候補** | 需要側の代表。調査年と病床定義を確認 |
| `late-elderly-medical-expense-per-insured` | **secondary移管候補** | aging-societyから移す場合、75歳以上対象であることを明示 |

## 現行チャートの提案

| componentKey | 提案 | 理由 / 実装 |
|---|---|---|
| `theme-health-supply-trend` | **replace** | 医師数と病院数はともに人口10万人当たりだが値域が大きく異なる。医師+看護師、病院+病床を別カードに分ける |
| `theme-health-expense-trend` | **revise/hold** | MetricConfigは2022年単年。実際に複数年取得できるか検証し、できなければKPI/ランキング導線へ |
| `theme-health-lifestyle-trend` | **split** | 死亡率（人口10万対）と受診率（%）を同一Y軸で結ばない。健康結果と予防に分ける |
| `theme-health-death-causes-donut` | **remove/replace** | 死因別の人口10万対率は「全体の内訳」ではない。主要死因の比較はbar chartが適切だがtheme rendererにないため別設計 |
| `theme-health-diabetes-trend` | **remove from main** | 糖尿病だけを主要ストーリーに置く根拠が弱い。contextランキングへ |
| markdown 3件 | **2件へ統合・再検証** | discussion/related-topicsが重複。医療費・赤字病院・人材需要の数値と年を公式資料で再確認 |

## 追加チャート案

1. **健康寿命（男女）**: 2系列 `line-chart`。年が複数ない場合はKPIにする。
2. **医師・看護師の供給推移**: 2系列。値域差が大きい場合は別カード。
3. **病床数・病床利用率**: 単位が異なるため `mixed-chart`。「多い/高い=良い」とは限らない。
4. **平均在院日数と1人当たり医療費**: 相関を問う散布図候補。現行theme rendererに一般散布図がないため別設計、因果と表現しない。
5. **主要死因比較**: bar chart候補。donutの代替としてrenderer拡張を別PRで判断。

## 推奨表示順

1. 健康寿命（データ検証後）
2. 医師数・看護師数
3. 病床数・病床利用率
4. 入院受療率・平均在院日数
5. 1人当たり医療費
6. 生活習慣病死亡
7. 健診受診率
8. 過疎×医療アクセスGIS
9. 解説 / FAQ
10. 全指標（精神医療等のcontext含む）

## 不採用・保留

| 候補 | 判定 | 再検討条件 |
|---|---|---|
| 死因別死亡率donut | 不採用 | 分母を共有する率は構成比ではない |
| 生活習慣病死亡率+健診受診率の同一軸 | 不採用 | 単位が異なり、因果の誤読を招く |
| 糖尿病死亡率の単独主要chart | 不採用 | 疾患別contextへ。糖尿病専用問いを持つ場合に再検討 |
| 医師数と高齢化率の単純比較 | 保留 | 需要を高齢化率だけで代表させない。受療率等を含むモデルが必要 |
| 一般散布図 / bar chart | 保留 | renderer、props型、catalog union、a11y、testの別PRが必要 |

## Claude Code実装指示

### PR-1: 現行データでできる焦点化

編集SSOT: `packages/data-configs/src/theme-catalog/healthcare.ts`

1. 現行13指標のroleを上表どおり変更
2. primary/secondaryすべてに公式根拠付き `selection`を追加
3. `theme-health-supply-trend`を供給職種と施設/病床に分割。値域を確認し、比較できなければ単独chartにする
4. `theme-health-lifestyle-trend`を死亡と健診に分割
5. 死因donutと糖尿病単独chartを削除
6. 医療費が単年値ならline chartを削除しKPI/ランキング導線に戻す
7. 残すchartの `relatedRankingKeys/sourceLink/rankingLink`を補完
8. `sortOrder`を一意化
9. markdownは数値・年・出典のコンテンツレビュー後に2件へ統合

### PR-2: データ追加・共通chart拡張（別承認）

1. 健康寿命男女と入院受療率の年・47都道府県・定義を検証
2. aging-societyから後期高齢者医療費を移すか決定
3. bar chart/散布図の必要性を別設計
4. 観測値・R2 snapshotを別PRで反映

### 禁止

- 生成物 `packages/types/src/indicator-sets/healthcare.ts`を手編集しない
- 生成物 `apps/web/scripts/data/page-components/theme/healthcare.json`を手編集しない
- 異なる単位を同一Y軸で比較しない
- 率をdonutの内訳として表現しない
- 医師数・病床数が多いことを単独で「医療が充実」と記述しない
- 地域相関から因果関係を断定しない
- R2 push / deployを行わない

## 検証と完了条件

```bash
npm run generate:catalog --workspace=@stats47/data-configs
npm run validate:catalog --workspace=@stats47/data-configs
npm run validate:years --workspace=@stats47/data-configs
npm run validate:config --workspace=@stats47/data-configs
npm run type-check --workspace=@stats47/data-configs
npm run type-check --workspace apps/web
npm run test:run --workspace apps/web
```

- `healthcare`の `no-selection / dup-sortorder / primary-orphan`が0
- 全体warnが実装前ベースラインから増えない
- 生成物がSSOTと一致
- 異単位の同一Y軸チャート0
- 率を構成比としたdonut 0
- 375 / 768 / 1024 / 1280 / 1700pxで軸、凡例、単位、年度、出典を確認
- empty/error stateが0値と区別できる
- 健康結果→需要・利用→供給資源→予防・アクセスの関係が読める

## 採用決定

**現状: ユーザー承認待ち。**

Claude Codeは承認前にcatalogを編集しない。承認後はまずPR-1のみを実装する。

