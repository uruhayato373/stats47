---
type: theme-catalog-review
date: 2026-07-11
status: proposal-ready
theme: living-housing
tags: [theme-catalog, housing, living, metrics, charts]
---

# テーマレビュー: living-housing（暮らし・住まい）

## 結論

主問は、**その地域では、どのような住宅をどの程度の負担で確保でき、住宅ストックの空き家・老朽化・耐震性にどのような課題があるか**とする。

ページは次の4層に分ける。

1. **住宅ストック**: 空き家率、持ち家/借家の割合
2. **質・広さ・安全**: 延べ面積、耐震改修、住宅の更新
3. **費用・負担**: 家賃、住居費割合、家賃控除後可処分所得への導線
4. **世帯と立地**: 単独世帯、高齢世帯、人口密度・DIDは背景として後段

現行カタログは「住まい」と「婚姻・家族形成」が混在している。未婚率、婚姻件数、離婚件数は除外し、現在欠けている家賃と耐震改修を追加する。

## 重要な定義上の注意

`vacant-housing-ratio`は空き家全体の比率である。賃貸用・売却用・二次的住宅も含み得るため、その値をそのまま「放置空き家」や「管理不全空家」の割合と説明してはいけない。

政策上の問題を表すには、住宅・土地統計調査の「賃貸・売却用及び二次的住宅を除く空き家」等の細分指標が別途必要である。

## 公式根拠

### 総務省統計局「令和5年住宅・土地統計調査」

- URL: https://www.stat.go.jp/data/jyutaku/2023/tyousake.html
- 調査日: 2026-07-11
- 住宅数、空き家、所有関係、床面積、家賃、居住状況を扱う一次統計
- 空き家は用途別の内訳を分けて読む必要がある
- 都道府県の住宅比較の中心出典とする

### 国土交通省「空家等対策の推進に関する特別措置法関連情報」

- URL: https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_tk3_000035.html
- 調査日: 2026-07-11
- 2023年12月に改正法施行
- 管理不全空家等と特定空家等の措置、所有者情報、活用・除却支援を扱う
- 統計上の空き家と法上の管理不全/特定空家を同一視しない

### 国土交通省「立地適正化計画」

- URL: https://www.mlit.go.jp/toshi/city_plan/toshi_city_plan_tk_000054.html
- 調査日: 2026-07-11
- 人口減少下の居住誘導、都市機能と交通の関係を扱う
- 人口密度は住宅の質ではなく、立地・都市構造の背景指標とする

## テーマ境界

| テーマ | 責務 |
|---|---|
| `living-housing` | 住宅ストック、広さ・安全、家賃、世帯と立地 |
| `real-income` | 家賃を差し引いた生活余力。住宅ページから `disposable-income-after-rent`へ導線を置く |
| `consumer-prices` | 住居を含む地域物価。家賃の名目水準と物価全体を混ぜない |
| 将来の婚姻・家族形成テーマ | 未婚率、婚姻、離婚、家族形成。living-housingから除外 |

## 現行指標の提案

| rankingKey | 現行 role | 提案 | 理由 |
|---|---|---|---|
| `vacant-housing-ratio` | primary | **primary keep** | 住宅ストックの中心。空き家の用途内訳の注記必須 |
| `owner-occupied-housing-ratio` | secondary | **primaryへ変更** | 所有/賃貸構造の中心。高い=暮らしやすいとは限らない |
| `housing-floor-area` | secondary | **primaryへ変更** | 住宅の広さ。持ち家/借家別の差を補足 |
| `households` | context | **context keep** | 住宅ストックの需要母数 |
| `nuclear-family-households-ratio` | context | **secondaryへ変更** | 住宅ニーズを左右する世帯構造 |
| `elderly-couple-only-household-ratio` | secondary | **secondary keep** | 住宅管理・セーフティネット需要に関係 |
| `single-person-household-old-population-ratio` | context | **secondaryへ変更** | 高齢単身世帯の住宅需要と将来の空き家リスクを考える背景 |
| `population-density-per-km2-inhabitable-area` | secondary | **contextへ変更** | 住宅の質ではなく立地の背景 |
| `habitable-area-ratio` | context | **context keep** | 人口密度の地理的分母の背景 |
| `densely-inhabited-district-population-density` | context | **context keep** | 都市集積の背景 |
| `ratio-never-married-15-plus` | secondary | **remove/rejected** | 住宅の質・負担を直接表さない |
| `marriages` | context | **remove/rejected** | 婚姻・家族形成の別責務 |
| `divorces` | context | **remove/rejected** | 婚姻・家族形成の別責務 |

### 追加指標候補

| rankingKey/候補 | 提案 | 注意 |
|---|---|---|
| `private-rental-housing-rent-per-3-3m2` | **primary追加** | 住居負担の入口。3.3m²当たりを明示 |
| `housing-expenditure-ratio-multi-person-households` | **secondary追加候補** | 都道府県庁所在市・二人以上世帯の制約を明示。全世帯代表としない |
| `earthquake-renovation-rate` | **secondary追加** | 住宅安全の主要指標。2023年・持ち家が対象 |
| `disposable-income-after-rent` | **contextリンク** | real-incomeの正典指標。本テーマのprimaryに重複登録しない |
| 賃貸・売却用等を除く空き家率 | **指標バックログへ** | 政策的に問題となる空き家に近い。都道府県表と定義を調査 |

## 現行チャートの提案

| componentKey | 提案 | 理由 / 実装 |
|---|---|---|
| `vacancy-ownership-rate-trend` | **split候補** | ともに%だが、空き家と所有は直接の内訳/因果ではない。ストックと所有構造の別chartが読みやすい |
| `unmarried-elderly-couple-trend` | **remove** | 未婚率と高齢夫婦世帯率は異なる母集団で、直接の比較意義がない |
| `lh-dwelling-floor-area-trend` | **keep・上位化** | 持ち家/借家の広さを比較。単位と対象住宅を明記 |
| `lh-marriage-divorce-trend` | **remove** | 住宅テーマの責務外。件数は人口規模にも強く左右される |
| `lh-pop-density-trend` | **contextへ降格** | 立地背景。住宅ストック・負担の後に置く |
| `lh-household-structure-trend` | **keep** | 単独世帯と核家族世帯の構造変化。metricsに単独世帯割合を追加するか、relatedRankingKeysと整合 |
| markdown 3件 | **2件へ統合・再検証** | discussion/related-topicsの重複を解消。価格、市町村数、予算、将来世帯の数値と年を公式資料で再確認 |

## 追加チャート案

1. **民営賃貸住宅家賃の推移**: `line-chart`。面積当たり家賃とし、可処分所得と同一Y軸にしない。
2. **家賃と家賃控除後可処分所得**: 関係を見る散布図候補。real-incomeと責務調整し、因果と表現しない。
3. **耐震改修実施率**: 単年ならKPI/ランキング導線。時系列がある場合のみline chart。
4. **空き家用途別構成**: セグメントが同一総数の内訳と確認できれば `composition-chart`。

## 推奨表示順

1. 空き家率（用途定義の注記付き）
2. 持ち家率 / 賃貸住宅構造
3. 持ち家・借家の延べ床面積
4. 民営賃貸住宅の家賃
5. 耐震改修実施率
6. 単独世帯・核家族世帯の構造
7. 高齢単身・高齢夫婦世帯
8. 人口密度・DID（立地背景）
9. 解説 / FAQ
10. 家賃控除後可処分所得等の関連テーマ導線

## 不採用・保留

| 候補 | 判定 | 理由 / 再検討条件 |
|---|---|---|
| 未婚率、婚姻件数、離婚件数 | 不採用 | 婚姻・家族形成テーマの問いを設ける場合に再検討 |
| 未婚率と高齢夫婦世帯率の比較 | 不採用 | 母集団・年齢範囲・意味が異なる |
| 地価の主要チャート | 保留 | 都道府県平均地価の定義と住宅取得負担を直接表すかを別調査 |
| 家賃と地価の同一Y軸 | 不採用 | 単位・対象・市場が異なる |
| 空き家率が高い=放置空き家が多い | 不採用 | 用途別内訳なしには判断できない |
| 住宅が広い/持ち家率が高い=暮らしやすい | 不採用 | 費用、立地、安全、維持負担を含まない単純評価は不可 |

## Claude Code実装指示

### PR-1: 現行データでの焦点化

編集SSOT: `packages/data-configs/src/theme-catalog/living-housing.ts`

1. 現行13指標のrole変更と婚姻系3指標の削除を上表どおり反映
2. `private-rental-housing-rent-per-3-3m2`をprimary、`earthquake-renovation-rate`をsecondaryに追加
3. `housing-expenditure-ratio-multi-person-households`は対象母集を確認し、明記できる場合のみsecondary追加
4. primary/secondaryすべてに公式根拠付き `selection`を追加
5. 未婚+高齢夫婦chartと婚姻+離婚chartを削除
6. 床面積、家賃、世帯構造、人口密度の順に並べ替え
7. 残すchartの `relatedRankingKeys/sourceLink/rankingLink`を補完
8. `sortOrder`を一意化
9. `rejectedCandidates`に婚姻系3指標と不採用理由を記録
10. 空き家率の用途定義に関する注記をselection/chart出典で保持

### PR-2: 細分空き家・住居負担・新chart（別承認）

1. 賃貸・売却用等を除く空き家の都道府県データを調査
2. MetricConfigとR2観測値を別PRで作成
3. 空き家用途別compositionの分母整合を検証
4. 家賃と可処分所得の散布図が必要ならrenderer拡張を別設計

### 禁止

- 生成物 `packages/types/src/indicator-sets/living-housing.ts`を手編集しない
- 生成物 `apps/web/scripts/data/page-components/theme/living-housing.json`を手編集しない
- 空き家全体と放置/管理不全空家を同一視しない
- 家賃と地価、所得を同一Y軸で比較しない
- 持ち家率や床面積の大きさだけで暮らしやすさを断定しない
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

- `living-housing`の `no-selection / dup-sortorder / primary-orphan`が0
- 全体warnが実装前ベースラインから増えない
- 生成物がSSOTと一致
- 婚姻・離婚・未婚指標とchartが主要テーマから除外される
- 空き家率の用途定義を表示または出典で確認できる
- 375 / 768 / 1024 / 1280 / 1700pxで軸、凡例、単位、年度、出典を確認
- empty/error stateが0値と区別できる
- ストック→質・安全→費用→世帯・立地の順に読める

## 採用決定

**現状: ユーザー承認待ち。**

Claude Codeは承認前にcatalogを編集しない。承認後はまずPR-1のみを実装する。

