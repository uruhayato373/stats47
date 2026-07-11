---
type: theme-catalog-review
date: 2026-07-11
status: ready-after-definition-audit
theme: labor-wages
tags: [theme-catalog, labor, wages, employment]
---

# テーマレビュー: labor-wages（労働・賃金）

## 結論

主問は、**その地域の賃金水準と最低保障はいくらで、雇用属性による差がどの程度あるか**とする。

読み順は次の4層に分ける。

1. **最低保障**: 地域別最低賃金
2. **入職時の水準**: 大卒・高卒初任給
3. **属性・職種差**: 男女賃金差、一般/短時間、職種別賃金
4. **労働時間**: 月間労働時間。ただし賃金と同一母集団の場合のみ併読

求人倍率、失業率、就業率、離職率、テレワーク、副業は労働市場・働き方の指標であり、賃金テーマの主要指標から `labor-mobility` へ移す。

## P0: 定義・系列監査

実装前に次を確定する。

- `gender-wage-gap` が金額差、比率、女性/男性比のどれか
- 一般労働者と短時間労働者、男女、企業規模、産業、年齢階級の条件
- 初任給が学歴別新規学卒者の所定内給与額か、対象企業規模を含むか
- 看護師年収の算出式に賞与・超過労働給与を含むか
- 最低賃金は発効日ベースか年度ベースか。全国加重平均と都道府県値を混同していないか
- line chartが同一定義・同じ単位の時系列か

## 公式根拠

### 厚生労働省「賃金構造基本統計調査」

- URL: https://www.mhlw.go.jp/toukei/list/chinginkouzou.html
- 賃金、初任給、短時間労働者、職種別賃金等の中心出典
- 所定内給与額と現金給与額、月額と年収推計を区別する
- 都道府県比較では産業・企業規模・年齢・勤続年数の構成差が残る

### 厚生労働省「地域別最低賃金」

- URL: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/minimumichiran/index.html
- 都道府県ごとの時間額と発効年月日を表示する
- 最低賃金は平均賃金ではなく、適用除外・特定最低賃金にも注意する

### 総務省統計局「労働力調査」

- URL: https://www.stat.go.jp/data/roudou/index.html
- 就業率・完全失業率の定義確認に利用する
- 賃金指標とは調査、母集団、頻度が異なるため同一尺度として扱わない

## テーマ境界

| テーマ | 責務 |
|---|---|
| `labor-wages` | 最低賃金、初任給、属性別賃金、労働時間 |
| `labor-mobility` | 求人倍率、失業、就業、離職、働き方、労働移動 |
| `occupation-salary` | 職業別の詳細な給与比較 |
| `real-income` | 税・社会保険料と物価を考慮した可処分所得・購買力 |

## 現行指標の提案

| rankingKey | 現行 role | 提案 | 理由 |
|---|---|---|---|
| `minimum-wage-by-region` | primary | **primary keep** | 地域の最低保障。発効日を常時表示 |
| `starting-salary-university` | secondary | **primaryへ変更** | 入職時賃金の代表。ただし学歴・対象条件を明記 |
| `starting-salary-highschool` | context | **secondaryへ変更** | 大卒だけでは地域の新規学卒市場を代表しない |
| `gender-wage-gap` | secondary | **P0後primary** | 中心論点だが、比率の向きと母集団を先に確定 |
| `scheduled-salary-male` | context | **secondary / 対になる女性系列を追加** | 男性のみでは男女差の基準を検証できない |
| `male-part-time-hourly-wage` | context | **context keep** | 女性系列と対で表示し、単独順位を主要化しない |
| `female-part-time-hourly-wage` | context | **context keep** | 同上 |
| `nurse-salary` | secondary | **occupation-salaryへ主責務移管** | 単一職種だけを賃金テーマの代表にしない |
| `monthly-average-actual-working-hours-male` | context | **context / 対象監査** | 男性のみ。時間当たり賃金とは異なる |
| 求人・失業・就業・離職・テレワーク・副業 | secondary/context | **labor-mobilityへ移管** | 賃金水準ではなく労働市場・働き方の指標 |

## 現行チャートの提案

| componentKey | 提案 | 理由 / 実装 |
|---|---|---|
| `labor-wages-minimum-wage-trend` | **keep** | 発効年月日と時間額を表示。全国加重平均は別系列と明記 |
| `labor-wages-gender-gap` | **P0後keep/reframe** | 比率の向き、100の意味、対象労働者をタイトル・注記に出す |
| `labor-wages-job-ratio-vs-unemployment` | **labor-mobilityへ移管** | 倍率と%の二単位を同じline chartに置かない |
| `theme-lw-employment-rate-trend` | **labor-mobilityへ移管** | 賃金テーマの主問外 |
| `md-labor-wages-discussion` | **rewrite** | 賃金の定義・構成差中心へ短縮。時点依存数値を監査 |
| `md-labor-wages-related-topics` | **関連記事へ移動** | 政策目標・助成制度の長文は更新負荷が高い |
| `md-labor-wages-faq` | **rewrite** | 平均/中央値、所定内/総額、一般/短時間、名目/実質を中心にする |

### 追加チャート

1. **大卒・高卒初任給**: 同一年・同じ単位の2系列比較。
2. **男女賃金比率**: 100を格差なしの基準線とする。指標が女性/男性比の場合のみ。
3. **一般・短時間労働者の時給比較**: 時間単位へ揃えられる場合のみ。
4. **最低賃金と初任給**: 因果ではなく水準の関連として散布図候補。renderer拡張は別PR。

## 推奨表示順

1. 地域別最低賃金
2. 大卒・高卒初任給
3. 男女賃金差
4. 一般労働者・短時間労働者
5. 労働時間
6. 職業別給与・労働市場への関連導線
7. 解説 / FAQ
8. 全指標

## 不採用・保留

| 候補 | 判定 | 理由 / 再検討条件 |
|---|---|---|
| 最低賃金=地域の平均賃金 | 不採用 | 法定の最低額と観測された平均は別概念 |
| 男性所定内給与だけで地域賃金を代表 | 不採用 | 性別・雇用形態・産業構成を偏って表す |
| 男女の単純平均差を同一労働の賃金差と断定 | 不採用 | 職種、勤続、役職等を調整していない |
| 求人倍率と失業率を同一Y軸に表示 | 不採用 | 倍と%で単位が異なる |
| 名目賃金の高さ=購買力の高さ | 不採用 | 税・社会保険料・物価を考慮していない |
| 看護師1職種を地域賃金全体の代表にする | 不採用 | 職業固有の勤務形態・手当の影響が大きい |

## Claude Code実装指示

### PR-0: 指標定義監査

1. 全16指標について年、単位、母集団、雇用形態、性別、企業規模、出典表を一覧化
2. `gender-wage-gap` の式と比率方向をfixtureで確認
3. 初任給、看護師年収、パート時給の算出・対象条件を公式表と照合
4. chartの時系列が同一定義か検証し、結果を本文書へ追記
5. markdown内の全時点依存数値・制度記述を一次資料で監査

### PR-1: ThemeCatalog是正

編集SSOT: `packages/data-configs/src/theme-catalog/labor-wages.ts`

1. 賃金指標へ絞り、労働市場指標を `labor-mobility` へ移管
2. 上表に従いroleを整理し、primary/secondaryへ `selection` を追加
3. 男女比較では片側だけを主要表示しない
4. chartの単位・系列・タイトルを一致させる
5. `sourceLink/rankingLink/relatedRankingKeys`を補完
6. section内 `sortOrder`を一意化
7. guidanceを追加し、長文markdownを短縮

### 禁止

- 月額・時間額・年収を無変換で比較しない
- 一般労働者と短時間労働者を同一母集団として扱わない
- 平均値を中央値または典型的個人の賃金と呼ばない
- 異なる単位を同じY軸に載せない
- 時点依存の政策目標・制度説明を無期限に固定しない
- 生成物TS/JSONを手編集しない
- R2 push / deployを行わない

## 検証と完了条件

```bash
npm run generate:catalog --workspace=@stats47/data-configs
npm run validate:catalog --workspace=@stats47/data-configs
npm run validate:config --workspace=@stats47/data-configs
npm run type-check --workspace=@stats47/data-configs
npm run type-check --workspace apps/web
npm run test:run --workspace apps/web
```

- 全主要指標で年・単位・母集団・雇用形態を確認できる
- `gender-wage-gap` の100または0の意味と比率方向が明示される
- 倍率と%、月額と年収等の異単位混在chartがない
- `labor-wages` と `labor-mobility` の重複primaryがない
- `no-selection / dup-sortorder / primary-orphan` が0
- guidanceなしテーマの表示を壊さない
- R2 push / deployを行っていない

## 採用決定

**PR-0の定義監査後に実装可能。不要なのは指標そのものではなく、賃金テーマに置かれた労働市場指標と、更新負荷の高い政策長文である。**
