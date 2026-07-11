---
type: theme-catalog-review
date: 2026-07-11
status: blocked-by-derived-metric-audit
theme: real-income
tags: [theme-catalog, income, purchasing-power, calculated-metrics]
---

# テーマレビュー: real-income（実質収入・購買力）

## 結論

主問は、**その地域では、収入から税・社会保険料を引き、物価と家賃を考慮した後に、どの程度の生活余力が残るか**とする。

読み順は次の4層に分ける。

1. **額面**: 実収入、可処分所得
2. **物価補正**: 消費者物価地域差指数、実質可処分所得
3. **住居費負担**: 家賃、家賃控除後手残り
4. **別概念の背景**: 1人当たり県民所得、年間世帯収入

ただし、現行の派生指標2件に計算上の重大な疑義がある。**ThemeCatalogの表示改修より先に、派生値の式・単位・年・観測値を監査する必要がある。**

## P0: 派生指標のブロッカー

### 1. `real-disposable-income`のスケール不整合

MetricConfigの説明:

```text
可処分所得 ÷ 消費者物価地域差指数 × 100
```

現行実装:

- `calculation.type = "ratio"`
- `numeratorKey = disposable-income-worker-households`
- `denominatorKey = consumer-price-difference-index-overall`
- `computeCalculatedValues` の `scaleFactor` 既定値は1
- `fetch-ranking-data-calculated.ts` は `scaleFactor` を渡していない

したがって、汎用計算経路では `可処分所得 ÷ 指数`となり、説明の `×100` と整合しない。SEOに記録された値は×100後に見えるため、R2値とruntime計算値が同一かも確認が必要である。

### 2. `disposable-income-after-rent`の期間・母集団不整合

現行式:

```text
disposable-income-worker-households - private-rent-consumption-expenditure
```

- 可処分所得: 二人以上の勤労者世帯の月額と解釈される指標
- 民営家賃消費支出額: タイトル・subtitle上は都道府県庁所在市の二人以上世帯の**年間**支出額
- 単純な引き算は月額と年額を混在させる
- 勤労者世帯と二人以上世帯が完全に同じ母集団かも要確認
- 家賃を支払っていない持ち家世帯を含む平均支出は「賃貸世帯の家賃負担」と同じではない

この値を「家賃を払った後の手残り」として公開継続するには、年/月変換、母集団、家賃非負担世帯の扱いを確定しなければならない。

### P0完了条件

- 計算式と `scaleFactor`をMetricConfigから決定的に渡せる
- 入力2指標の年、月/年、単位、母集団が一致
- 47都道府県の手計算fixtureと出力が一致
- R2済み値、runtime再計算値、SEO記載値が一致
- 不整合を解決できない場合、対象2指標をテーマとランキングから非公開化

## 公式根拠

### 総務省統計局「家計調査」

- URL: https://www.stat.go.jp/data/kakei/index.html
- 調査日: 2026-07-11
- 実収入、非消費支出、可処分所得、家賃支出等の出典
- 総世帯/二人以上/勤労者世帯の区分、月額/年額、都道府県庁所在市データの区別が必要

### 総務省統計局「消費者物価地域差指数」

- URL: https://www.stat.go.jp/data/kouri/kouzou/index.html
- 調査日: 2026-07-11
- 全国平均=100として地域間の物価水準を比較
- 物価の時系列上昇率と、同一年の地域間水準差を混同しない

### 内閣府「県民経済計算」

- URL: https://www.esri.cao.go.jp/jp/sna/sonota/kenmin/kenmin_top.html
- 調査日: 2026-07-11
- 1人当たり県民所得の出典
- 県民所得は家計の可処分所得や給与と同じ概念ではない
- 現行テーマのH27年基準・2020年値は旧く、公式ページは2022年47都道府県値を公表済み。更新可否を調査する

## テーマ境界

| テーマ | 責務 |
|---|---|
| `labor-wages` | 給与、賃金、労働時間、職業・雇用属性 |
| `real-income` | 税・社会保険料後の可処分所得と、物価・住居費補正後の購買力 |
| `consumer-prices` | 品目別の物価水準差。real-incomeでは補正に必要な指数のみ |
| `living-housing` | 家賃水準・住居負担の住宅側。real-incomeでは手残りへの影響 |

## 現行指標の提案

| rankingKey | 現行 role | 提案 | 理由 |
|---|---|---|---|
| `disposable-income-worker-households` | primary | **primary keep** | 非消費支出後の基礎。二人以上勤労者世帯限定を明記 |
| `real-disposable-income` | primary | **P0解決後primary** | 主問の中心だが、×100の計算整合性を確定するまで保留 |
| `disposable-income-after-rent` | secondary | **P0解決後primary** | 住居費後の余力だが、月/年・母集団不整合を先に解決 |
| `actual-income-worker-households-per-month` | secondary | **secondary keep** | 額面収入と可処分所得の違いを読む |
| `per-capita-prefectural-income-h27` | secondary | **contextへ変更/更新** | 家計所得と別概念。H27基準・2020年は鮮度不足 |
| `annual-income-per-household` | context | **context keep** | 2019年で古い。世帯年収と月額可処分所得を直接比較しない |
| `consumer-price-difference-index-overall` | context | **secondaryへ変更** | 実質化の分母を説明する必須指標 |
| `consumer-price-difference-index-overall-excl-rent` | context | **context keep** | 家賃補正との二重計上を考える詳細 |
| `consumer-price-difference-index-housing` | context | **context keep** | 住居物価の詳細。consumer-pricesに主責務 |
| `private-rental-housing-rent-per-3-3m2` | context | **context keep** | 家賃水準。living-housingへ主導線 |
| `private-rent-consumption-expenditure` | context | **P0監査用context** | 派生値の入力。対象世帯と年/月を明記 |

## 現行チャートの提案

| componentKey | 提案 | 理由 / 実装 |
|---|---|---|
| `real-income-nominal-income` | **keep、ただし名称是正** | componentKeyのnominal incomeとタイトルの可処分所得を整合。世帯対象をタイトル/説明に出す |
| `real-income-cpi-breakdown` | **keep/reframe** | 地域差指数の総合・住居・食料比較。「時系列の物価上昇率」と誤解させない |
| `theme-real-income-per-capita-prefectural` | **hold/update** | 2020年のH27基準のまま「推移」の主要chartにしない。現行基準の47都道府県値更新後にcontext表示 |
| `theme-real-income-actual-vs-disposable` | **renameまたは2系列化** | keyはactual-vs-disposableだが現状は実収入1系列のみ。共通年・単位が合うなら実収入+可処分所得、合わなければkeyを改名 |

### 追加チャート

1. **名目可処分所得と実質可処分所得**: P0解決後の2系列line chart。同単位・同年であることをtestで保証。
2. **可処分所得と家賃控除後手残り**: P0解決後の2系列。家賃支払世帯の実際負担を示すとは限らない注記が必要。
3. **物価と可処分所得の散布図**: 地域相関のみ。renderer拡張と因果誤読防止を別PRで設計。

## 推奨表示順

1. 可処分所得
2. 実質可処分所得（P0解決後）
3. 家賃控除後可処分所得（P0解決後）
4. 実収入と可処分所得
5. 消費者物価地域差指数
6. 家賃・住居物価の関連導線
7. 1人当たり県民所得（別概念と明記）
8. 解説 / FAQ
9. 全指標

## 不採用・保留

| 候補 | 判定 | 理由 / 再検討条件 |
|---|---|---|
| 現行式の実質可処分所得 | 保留 | ×100の計算とR2/runtime/SEO値の一致後 |
| 現行式の家賃控除後可処分所得 | 保留 | 月/年、母集団、家賃非負担世帯の扱いを確定後 |
| 県民所得=世帯の手取り | 不採用 | 経済計算上の別概念 |
| 物価地域差指数=インフレ率 | 不採用 | 同一年の地域間水準差と時系列変化率は異なる |
| 単身世帯を含む全住民の購買力として解釈 | 不採用 | 二人以上勤労者世帯等の調査対象制約がある |

## Claude Code実装指示

### PR-0: 派生指標監査（最優先）

1. `real-disposable-income` の説明式とruntime計算をfixtureで比較
2. `scaleFactor` がMetricConfig→RankingItem→calculation serviceへ伝播する型と実装を確認
3. `disposable-income-after-rent` の入力指標の月/年、単位、世帯区分、地域粒度を公式表で確認
4. 47都道府県の手計算とR2値を監査
5. 修正または非公開化を決定

PR-0が完了するまで、派生2指標のrole・chart・SEO値を正しい前提として使わない。

### PR-1: ThemeCatalog是正

編集SSOT: `packages/data-configs/src/theme-catalog/real-income.ts`

1. PR-0の結果に基づき派生2指標の採用/非公開を反映
2. 上表のroleを反映
3. primary/secondaryすべてに公式根拠付き `selection`を追加
4. chartのcomponentKey/title/系列数を実体と一致させる
5. 古い県民所得chartは更新できるまでcontextへ
6. `relatedRankingKeys/sourceLink/rankingLink`を補完
7. `sortOrder`を一意化

### 禁止

- 派生値の式を確認せず表示だけ改修しない
- 月額と年額をそのまま加減算しない
- 異なる世帯区分・地域粒度の値を説明なしに派生計算しない
- 県民所得を世帯の可処分所得と呼ばない
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

- 派生2指標に手計算fixtureがある
- 入力指標の年・期間・単位・母集団の一致をtestする
- R2/runtime/SEO値が一致、または不正指標が非公開
- `real-income`の `no-selection / dup-sortorder / primary-orphan`が0
- 生成物がSSOTと一致
- 対象世帯、地域粒度、年、月/年をUIで確認できる

## 採用決定

**現状: PR-0の派生指標監査が完了するまでカタログ実装をブロック。**

Claude CodeはまずPR-0のみを実行し、結果を本文書へ追記する。PR-1はその結果の承認後に実装する。

