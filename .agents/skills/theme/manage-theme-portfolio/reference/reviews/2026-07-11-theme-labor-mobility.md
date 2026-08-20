---
type: theme-catalog-review
date: 2026-07-11
status: ready-after-definition-audit
theme: labor-mobility
tags: [theme-catalog, labor-market, mobility, employment]
---

# テーマレビュー: labor-mobility（労働移動・雇用市場）

## 結論

主問は、**その地域で仕事を得やすいか、人がどの程度入職・離職・転職しているか、働き方の選択肢がどの程度あるか**とする。

読み順は次の3層に分ける。

1. **雇用需給**: 有効求人倍率、完全失業率、就業率
2. **人材移動**: 入職・離職・転職・就業異動
3. **働き方**: テレワーク、副業

`labor-wages` に重複している雇用需給・移動・働き方指標は本テーマへ集約する。ただし月間労働時間は賃金・労働条件側へ残す。

## P0: 定義・地域粒度監査

実装前に次を確定する。

- 有効求人倍率が就業地別か受理地別か、季節調整値か原数値か
- 完全失業率の都道府県値がモデル推計か直接推計か、四半期・年平均のどちらか
- 就業率と有業率の調査、対象年齢、分母、調査頻度の違い
- 離職率・転職率・就業異動率の分子、分母、対象期間、対象者
- テレワーク率と副業率の対象が有業者か雇用者か
- line chartの系列が同じ地域粒度・定義で比較可能か

## 公式根拠

### 厚生労働省「一般職業紹介状況」

- URL: https://www.mhlw.go.jp/toukei/list/114-1.html
- 有効求人倍率は有効求人数を有効求職者数で割った指標
- 就業地別と受理地別、季節調整値と原数値を区別する
- 倍率が高くても、職種・雇用形態のミスマッチがないことを意味しない

### 総務省統計局「労働力調査」

- URL: https://www.stat.go.jp/data/roudou/index.html
- 完全失業率・就業率の定義確認に使用する
- 都道府県別結果は全国値より標本誤差が大きく、短期変動の順位解釈に注意する

### 総務省統計局「就業構造基本調査」

- URL: https://www.stat.go.jp/data/shugyou/2022/index2.html
- 有業率、転職、副業、テレワーク等の定義確認に使用する
- 5年周期の構造統計であり、月次の景気指標として扱わない

## テーマ境界

| テーマ | 責務 |
|---|---|
| `labor-mobility` | 雇用需給、人材移動、テレワーク・副業 |
| `labor-wages` | 最低賃金、初任給、属性別賃金、労働時間 |
| `occupation-salary` | 職業別の給与・雇用条件 |
| `population-dynamics` | 都道府県間の人口移動。就業理由の移動は関連導線のみ |

## 現行指標の提案

| rankingKey | 現行 role | 提案 | 理由 |
|---|---|---|---|
| `active-job-opening-ratio` | secondary | **primaryへ変更** | 雇用需給の中心。定義種別を明記 |
| `unemployment-rate` | secondary | **primaryへ変更** | 求職側の結果。ただし地域推計誤差を注記 |
| `turnover-rate` | primary | **secondaryへ変更** | 高低だけで良否を決められず、産業構成の影響が大きい |
| `job-change-rate` | secondary | **secondary keep** | 離職率とは別概念。対で読む |
| `employment-rate` | context | **secondaryへ変更** | 労働参加の結果を補う |
| `employed-people-ratio` | labor-wagesのみ | **contextとして追加** | 有業率と就業率の定義差を説明する用途 |
| `telework-rate` | secondary | **contextへ変更** | 産業・職種構成の代理になりやすい |
| `side-job-rate` | context | **context keep** | 収入補完とキャリア形成を区別できない |
| `monthly-average-actual-working-hours-male` | context | **削除/移管しない** | 人材流動性ではなく労働条件。男性のみでもある |

## 現行チャートの提案

| componentKey | 提案 | 理由 / 実装 |
|---|---|---|
| `labor-mobility-turnover-vs-jobchange` | **P0後keep** | 両系列の分母・期間が一致する場合のみ。離職=転職ではない注記を付ける |
| `theme-lm-active-job-opening-trend` | **keep / 最優先** | 就業地別/受理地別、季節調整の別を表示 |
| `theme-lm-employment-mobility-trend` | **rename/audit** | 「就業異動率」の定義が読者に伝わらないため、分子・分母に即した名称へ |
| `labor-wages-job-ratio-vs-unemployment` | **分割して移管** | 倍率と%を別chartにするか二軸を避けてsmall multiples化 |
| `theme-lw-employment-rate-trend` | **移管** | employment-rateを本テーマへ集約 |
| markdown 3件 | **rewrite / 一部関連記事化** | 時点依存数値・政策説明を短縮し、定義とミスマッチ中心にする |

### 追加・改善チャート

1. **求人倍率と失業率のsmall multiples**: 同じX軸で別Y軸・別panelにする。
2. **離職率と転職率**: 同一定義年・対象なら2系列。差分を「非就業化」と断定しない。
3. **就業率と有業率**: 同一chartへ重ねず、定義カード付きの比較表を優先。
4. **テレワーク・副業**: 単年の働き方プロファイル。時系列でない場合は「推移」と呼ばない。

## 推奨表示順

1. 有効求人倍率
2. 完全失業率
3. 就業率
4. 離職率・転職率
5. 就業異動
6. テレワーク・副業
7. 賃金・人口移動への関連導線
8. 解説 / FAQ
9. 全指標

## 不採用・保留

| 候補 | 判定 | 理由 / 再検討条件 |
|---|---|---|
| 求人倍率が高い=働きやすい | 不採用 | 人手不足や職種ミスマッチでも上昇する |
| 失業率が低い=良質な雇用が多い | 不採用 | 賃金、雇用形態、労働参加を示さない |
| 離職率が高い=悪い | 不採用 | 成長産業への移動と不本意離職を区別できない |
| テレワーク率が低い=デジタル化の遅れ | 不採用 | 産業・職種構成の影響が大きい |
| 求人倍率（倍）と失業率（%）の共通Y軸 | 不採用 | 単位と尺度が異なる |
| 月間労働時間を人材流動性の主要指標にする | 不採用 | 労働条件の指標でありテーマ主問外 |

## Claude Code実装指示

### PR-0: 定義・地域粒度監査

1. 全指標の出典表、年、頻度、地域粒度、分子、分母、対象年齢・就業状態を一覧化
2. 有効求人倍率の就業地/受理地、季節調整/原数値を確定
3. 完全失業率の都道府県推計方法と表示精度を確認
4. 離職率・転職率・就業異動率の相互関係をfixtureと公式定義で確認
5. markdownの時点依存数値・相関・因果表現を一次資料で監査し、結果を本文書へ追記

### PR-1: ThemeCatalog統合

編集SSOT: `packages/data-configs/src/theme-catalog/labor-mobility.ts`

1. `labor-wages`から雇用需給・移動・働き方の指標とchartを移管
2. 月間労働時間を本テーマから削除
3. 上表に従いroleを整理し、primary/secondaryへ `selection`を追加
4. 倍率と%の混在chartをsmall multiplesまたは別chartへ分割
5. `sourceLink/rankingLink/relatedRankingKeys`を補完
6. sectionと `sortOrder`を一意化
7. guidanceを追加し、長文markdownを短縮

### 禁止

- 就業率と有業率を同義語として扱わない
- 離職率と転職率を同義語として扱わない
- 全国月次値と都道府県年平均値を同列比較しない
- 異なる単位を共通Y軸に載せない
- 観測相関を地域移動の因果と断定しない
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

- 有効求人倍率の種別、失業率の推計方法、各率の分母をUIで確認できる
- `labor-wages`との重複primaryと重複chartがない
- 異単位の共通Y軸chartがない
- `no-selection / dup-sortorder / primary-orphan`が0
- guidanceなしテーマの表示を壊さない
- R2 push / deployを行っていない

## 採用決定

**PR-0の定義・地域粒度監査後に実装可能。`labor-wages`からの移管先として採用し、月間労働時間だけは受け入れない。**
