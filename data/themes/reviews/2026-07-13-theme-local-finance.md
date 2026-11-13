---
type: theme-catalog-review
date: 2026-07-13
status: ready-after-scope-composition-and-threshold-audit
theme: local-finance
tags: [theme-catalog, local-finance, revenue, expenditure, fiscal-health, local-debt]
---

# テーマレビュー: local-finance（地方財政）

## 結論

主問は、**その都道府県の行政サービスを支える財源はどこから来て、何に使われ、経常的な支出や債務に対してどの程度の余力があるか**とする。

読み順は次の4層に分ける。

1. **財政規模**: 歳入・歳出決算額、人口1人当たり額。総額と規模調整値を分離
2. **歳入構造**: 地方税、地方交付税、国庫支出金、地方債等。自主財源/依存財源は重複分類に注意
3. **歳出構造**: 目的別と性質別を別々に表示。構成比と人口1人当たり額を使い分ける
4. **財政構造・健全化判断**: 財政力指数、経常収支比率、実質公債費比率、将来負担比率等を定義別に読む

「財政力指数が高い」「経常収支比率が低い」「健全化判断比率が低い」は同じ意味ではない。財政力指数は地方交付税算定に用いる基準財政収入額と基準財政需要額の関係、経常収支比率は財政構造の弾力性、実質公債費比率・将来負担比率は法定の健全化判断比率である。これらを一つの無根拠な「財政健全度スコア」に統合しない。

## P0: 対象範囲・系列監査

実装前に次を確定する。

- 各指標が都道府県単独、普通会計、一般会計等、都道府県・市町村合計のどのscopeか
- `per-capita-total-expenditure-pref-municipal` と `per-capita-inhabitant-tax-pref-municipal` が都道府県・市町村合計で、他の都道府県財政指標とscopeが異なること
- 財政力指数が基準財政収入額÷基準財政需要額の過去3か年平均であること
- 経常収支比率の分子・分母と、臨時財政対策債等を含む公式定義
- 実質公債費比率が元利償還金等の負担を標準財政規模等と比較した3か年平均であること
- 将来負担比率が一般会計等だけでなく公営企業・地方公社・出資法人等に係る実質的負債を含むこと
- 実質収支比率の実質収支・標準財政規模の定義。高いほど無条件に優良とは扱わないこと
- 早期健全化基準・財政再生基準の対象指標、都道府県に適用される閾値、年度ごとの制度定義
- 歳入構成chartの地方税・地方交付税・国庫支出金が歳入総額の全項目ではなく、地方債・繰入金等を除くこと
- 現行の歳出構成chartが性質別の人件費と目的別の民生費・教育費・土木費を混在させていること
- 性質別chartの `#D0140201` が本当に投資的経費割合か。コード・名称・分母をe-Stat metadataで確認すること
- 各構成比の分母が歳入/歳出決算総額で統一され、合計と「その他」が整合すること
- 普通会計決算と一般会計等、地方財政状況調査と健全化判断比率の年度・会計範囲を混ぜていないこと
- 災害、感染症対応、国の臨時交付金、大規模事業など単年度要因を平常時の構造と断定しないこと
- 欠測、「-」、算定なし、比率なし、負値を0へ変換していないこと
- ラスパイレス指数の基準、国家公務員給与改定、時点、手動取得・訂正反映を確認すること

## 公式根拠

### 総務省「地方財政状況調査関係資料」

- URL: https://www.soumu.go.jp/iken/jokyo_chousa_shiryo.html
- 都道府県・市町村の歳入歳出決算、主要財政指標、財政状況資料集の中心出典
- 都道府県分と市町村分、普通会計と公営企業会計等のscopeを表単位で確認する

### e-Stat「社会・人口統計体系 D 行政基盤」

- URL: https://www.e-stat.go.jp/stat-search/database?bunya_l=99&layout=dataset&statdisp_id=0000010204&toukei=00200502
- 現行ThemeCatalogが参照する歳入・歳出構成比等の直接的なデータ出典
- 指標コード、基礎データ、計算式、単位、年次を実装時にmetadataと突合する

### e-Stat「社会生活統計指標 D 行政基盤・項目定義」

- URL: https://www.e-stat.go.jp/koumoku/koumoku_teigi/D
- 財政力指数、経常収支比率、実質公債費比率、将来負担比率等の公式定義
- 指標間で分子・分母・対象債務・平均期間が異なることをguidanceへ反映する

### デジタル庁「地方財政に関するダッシュボードで扱う財政項目の説明」

- URL: https://www.digital.go.jp/resources/japandashboard/local-finance-introduction
- 歳入、目的別・性質別歳出、資産・財政指標の分類と定義を確認する補助的な公式資料
- stats47の分類と国のダッシュボードの分類が一致するか監査する

### e-Gov「地方公共団体の財政の健全化に関する法律」

- URL: https://laws.e-gov.go.jp/law/419AC0000000094
- 実質赤字比率、連結実質赤字比率、実質公債費比率、将来負担比率を健全化判断比率とする法的根拠
- 「財政力指数」「経常収支比率」を法定の健全化判断比率と呼ばない

### 総務省「地方財政白書」

- URL: https://www.soumu.go.jp/menu_seisaku/hakusyo/chihou/rindex.html
- 地方財政全体の決算、歳入・歳出、地方債、基金、財政構造を説明する公式資料
- 全国集計の説明を個別都道府県の評価へそのまま転用しない

## テーマ境界

| テーマ | 責務 |
|---|---|
| `local-finance` | 都道府県財政の規模、歳入・歳出構造、財政構造、健全化判断比率 |
| `local-finance-city` | 市区町村財政。都道府県単独ランキングと混ぜない |
| `local-economy` | 地域の生産・所得・雇用。財政力指数は関連導線に限定 |
| `labor-wages` | 民間を含む賃金・雇用。ラスパイレス指数は地方公務員給与のcontext |
| `education-culture` | 教育サービス・成果。教育費割合だけでサービス水準を評価しない |
| `healthcare` | 医療・介護資源と成果。民生費割合を福祉成果と同一視しない |

## 現行指標の提案

| rankingKey | 現行 role | 提案 | 理由 |
|---|---|---|---|
| `fiscal-strength-index-prefecture` | primary | **primary keep** | 財源余力・交付税算定との関係を示す中心指標。ただし3か年平均であり法定健全化判断比率ではない |
| `current-balance-ratio` | secondary | **primaryへ変更** | 経常的な一般財源の拘束度を示し、財政運営の弾力性という主問に直結 |
| `real-public-debt-service-ratio` | secondary | **primaryへ変更** | 公債費等の実質負担を示す法定健全化判断比率。3か年平均と閾値を明記 |
| `future-burden-ratio` | secondary | **secondary keep** | 将来負担を広く捉えるが、算定なし・負値・公営企業等の範囲に注意 |
| `real-balance-ratio` | secondary | **contextへ変更** | 黒字幅の大小を単純な優劣にできず、主要な比較軸として説明が難しい |
| `local-tax-ratio-pref-finance` | secondary | **secondary keep** | 歳入構造の中心。税収力そのものではなく歳入総額に占める割合 |
| `local-allocation-tax-ratio-pref-finance` | secondary | **secondary keep** | 財源調整との関係を示す。高いことを単純な「依存・悪化」と表現しない |
| `national-treasury-disbursement-ratio-pref-finance` | secondary | **contextへ変更** | 補助事業・災害・臨時施策で変動し、単独評価には向かない |
| `self-financing-ratio` | secondary | **secondary keep / 定義監査** | 歳入の自律性を補足。ただし地方税割合と重複せず、何を自主財源に含むか明記 |
| `per-capita-total-expenditure-pref-municipal` | secondary | **別scope sectionへ変更** | 都道府県・市町村合計で、都道府県単独指標と直接比較できない |
| `personnel-expenditure-ratio-pref-finance` | secondary | **secondary keep** | 性質別歳出の中心。目的別費目と同じ構成chartに入れない |
| `welfare-expenditure-ratio-pref-finance` | secondary | **secondary keep** | 目的別歳出の一部。高低をサービス水準や効率性と同一視しない |
| `education-expenditure-ratio-pref-finance` | secondary | **secondary keep** | 目的別歳出の一部。人口構成・自治体間分担の影響を注記 |
| `public-works-expenditure-ratio-pref-finance` | secondary | **secondary keep** | 目的別歳出の一部。災害復旧・大型事業による年次変動に注意 |
| `per-capita-inhabitant-tax-pref-municipal` | secondary | **税収context / 別scopeへ変更** | 都道府県・市町村合計で、住民負担・所得・税制を反映するが都道府県財政単独ではない |
| `per-taxpayer-taxable-income` | secondary | **local-economyへ移管/context** | 納税義務者1人当たり所得であり、財政運営より地域所得の指標 |
| `taxpayer-ratio-per-pref-resident` | secondary | **local-economyへ移管/context** | 人口・就業・所得構造の影響が中心で、自治体財政の成果指標ではない |
| `laspeyres-index-prefecture` | secondary | **contextへ変更** | 地方公務員給与の比較指標。財政全体の健全性を示さず、取得経路も別 |
| `total-revenue-prefecture` | なし | **context追加候補** | 財政規模の基礎。総額は人口規模に強く依存するため主ランキングにはしない |
| `total-expenditure-prefecture` | なし | **context追加候補** | 同上。人口1人当たり都道府県単独額とセットで使う |
| `local-debt-current` | なし | **secondary追加候補** | 債務規模の基礎。ただし残高総額だけで健全性を判断しない |
| 基金残高 | なし | **追加候補/新規metric監査** | 将来負担と財政余力を補完。財政調整基金・減債基金・特定目的基金を区別 |

## 現行チャートの提案

| componentKey | 提案 | 理由 / 実装 |
|---|---|---|
| `kpi-lf-fiscal-strength` | **keep / 説明追加** | 3か年平均、1.0の意味、交付税不交付との関係を注記 |
| `kpi-lf-current-balance` | **keep / 名称修正** | 「財政健全度」ではなく「財政構造の弾力性」。高いほど経常一般財源の余地が小さい傾向 |
| `kpi-lf-debt-service` | **keep / 閾値追加** | 法定健全化判断比率。3か年平均と都道府県の基準を年度監査後に表示 |
| `kpi-lf-future-burden` | **keep / 欠測表現修正** | 算定なし・負値・0を区別し、法定基準を公式年度に合わせる |
| `theme-lf-fiscal-ratios-trend` | **2chartへ分割** | 財政力指数（指数）と経常収支比率（%）を同一Y軸lineに置かない |
| `theme-lf-revenue-composition` | **revise** | 3項目だけで全体構成と呼ばず、地方債・繰入金等と「その他」を含め合計100%を検証 |
| `theme-lf-expense-composition` | **remove / 再構成** | 性質別の人件費と目的別の民生・教育・土木を混在。目的別chartとして同分類だけに統一 |
| `theme-lf-income-tax-trend` | **remove / 2chartへ分離** | 住民1人当たり税額と納税義務者1人当たり所得は分母・桁・問いが異なる |
| `theme-lf-debt-trend` | **keep / 2panel推奨** | 両方%だが意味・レンジ・閾値が異なる。共通Y軸で変化を潰さない |
| `theme-lf-revenue-trend` | **keep / 構成整合** | 同一分母の比率であることと、表示3項目が全体の一部であることを明記 |
| `theme-lf-per-capita-expense-trend` | **別scopeへ移動** | 都道府県・市町村合計。都道府県単独財政のchart群から視覚的に分離 |
| `theme-lf-taxpayer-ratio-trend` | **remove / local-economyへ導線** | 財政運営より人口・就業・所得構造を表す |
| `theme-lf-expense-nature-trend` | **revise / section設定** | 性質別歳出として有用だが、投資的経費コードを再確認し、扶助費・人件費等の合計とその他を監査 |

### 追加チャート

1. **財政力指数の推移**: 単独line。3か年平均であることを常時表示する。
2. **経常収支比率の推移**: 単独line。全国・類似団体比較はscopeが揃う場合のみ。
3. **歳入構成**: 地方税、地方交付税、国庫支出金、地方債、繰入金、その他。合計100%をfixtureで確認。
4. **目的別歳出構成**: 民生、衛生、農林水産、商工、土木、警察、教育、公債、その他等から主要項目を選ぶ。
5. **性質別歳出構成**: 人件費、扶助費、公債費、普通建設事業費等。同一分類だけで構成する。
6. **実質公債費比率・将来負担比率**: 別panelで公式基準線を表示。基準線の年度と自治体区分を固定する。
7. **地方債・基金残高**: 人口1人当たりまたは標準財政規模比で別panel。総額だけの優劣にしない。

## 推奨表示順

1. 財政力指数
2. 経常収支比率
3. 実質公債費比率
4. 将来負担比率
5. 歳入規模・歳入構成
6. 目的別歳出構成
7. 性質別歳出構成
8. 地方債・基金
9. 都道府県・市町村合計（別scopeの補足）
10. 税収・所得・公務員給与への関連導線
11. 定義 / FAQ
12. 全指標

## 不採用・保留

| 候補 | 判定 | 理由 / 再検討条件 |
|---|---|---|
| 主要4指標を合算した財政健全度スコア | 不採用 | 定義、方向、単位、法的位置付けが異なり、公式な合成根拠がない |
| 財政力指数が1未満=財政破綻 | 不採用 | 交付税算定上の財源力を表し、法定健全化判断比率ではない |
| 経常収支比率100%超=直ちに財政再生 | 不採用 | 弾力性の指標であり、健全化法の財政再生基準そのものではない |
| 実質収支比率は高いほど良い | 不採用 | 過大な黒字は行政サービス・投資との関係を含め評価が必要 |
| 地方交付税割合が高い=自治体努力不足 | 不採用 | 財源保障・財源調整、税源偏在、行政需要を反映し単純評価できない |
| 3費目だけを歳入全体の構成として表示 | 不採用 | 地方債、繰入金、譲与税等が欠け、合計100%にならない |
| 人件費と民生費・教育費・土木費を同じ構成比に積上げ | 不採用 | 性質別と目的別という異なる分類軸で重複し得る |
| 都道府県単独と都道府県・市町村合計を同一scopeで比較 | 不採用 | 行政主体・会計範囲が異なる |
| 1人当たり歳出が多い=行政サービスが良い | 不採用 | 固定費、人口密度、災害、事業区分、物価等の影響を受ける |
| 将来負担比率の欠測・算定なしを0表示 | 不採用 | 0と算定対象なし・負値は意味が異なる |
| 基金残高の追加 | 保留 | 都道府県47件、基金区分、年度、標準財政規模比の取得可能性を確認後 |

## Claude Code実装指示

### PR-0: scope・構成・閾値監査

1. 現行18指標と13chartの元表、会計範囲、自治体範囲、分子・分母、単位、年度を一覧化
2. 都道府県単独と都道府県・市町村合計をfixtureで分類し、異なるscopeを同sectionに置かない
3. 財政力指数・実質公債費比率の3か年平均、経常収支比率・将来負担比率の公式定義をmetadataへ記録
4. 健全化判断比率の都道府県向け早期健全化・財政再生基準を対象年度の公式資料で確認
5. 歳入構成の全費目と合計、現在の3費目の残差、「その他」の算出を47県×全年で検証
6. 目的別・性質別歳出のコード体系を分離し、現行混在chartをfixtureで失敗させる
7. `#D0140201` を含む全chartのcdCat01とラベルをe-Stat metadataで照合
8. 欠測、`-`、算定なし、負値、0のraw representationとUI変換を監査
9. 単年度の特殊要因、制度変更、臨時財政対策債の定義変更を時系列noteへ記録
10. ラスパイレス指数の手動取得元、訂正、最新年、再現手順を確認

### PR-1: ThemeCatalog再構成

編集SSOT: `packages/data-configs/src/theme-catalog/local-finance.ts`

1. 財政規模・歳入構造・目的別歳出・性質別歳出・財政構造・健全化判断・別scope補足へsectionを整理
2. 財政力指数、経常収支比率、実質公債費比率をprimaryとし、公式根拠付き`selection`を追加
3. 法定健全化判断比率とその他の財政指標を見出し・説明で分離
4. 財政力指数と経常収支比率を別chartへ分割
5. 歳入構成へ全費目または明示的な「その他」を追加し、合計100%を保証
6. 混在する歳出構成chartを削除し、目的別・性質別の2chartへ置換
7. 都道府県・市町村合計指標を補足sectionへ移し、scope labelを常時表示
8. 税収・所得chartを分離し、課税所得・納税義務者割合は関連テーマへの導線を優先
9. 欠測・算定なし・負値を0にせず、tooltipとempty stateで区別
10. `sourceLink/rankingLink/relatedRankingKeys`を補完し、section内`sortOrder`を一意化
11. guidance/FAQへ各指標の方向、3か年平均、会計範囲、基準、単年度要因を追加
12. 不採用候補を`rejectedCandidates`へ記録

### 禁止

- 主要指標を根拠なく合成して財政健全度スコアを作らない
- 財政力指数・経常収支比率を法定健全化判断比率と呼ばない
- 指標の高低を一律に「良い・悪い」へ変換しない
- 財政力指数・実質公債費比率を単年度値と説明しない
- 目的別歳出と性質別歳出を同じ構成に積み上げない
- 構成比の合計不足を無注記で100%として描画しない
- 都道府県単独と都道府県・市町村合計を同じscopeとして比較しない
- 欠測・算定なし・負値を0へ丸めない
- 一時的な臨時財源・災害歳出を恒常構造と断定しない
- 生成物TS/JSONを手編集しない
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

- primary/secondary全指標で自治体範囲、会計範囲、分子・分母、年度、単位を確認できる
- 財政力指数・実質公債費比率が3か年平均と表示される
- 法定健全化判断比率とその他の財政指標がUI上で区別される
- 歳入構成の合計が丸め誤差を除き100%となり、残差の定義を確認できる
- 目的別・性質別歳出が別chartで、分類コードの混在がない
- 都道府県・市町村合計指標が都道府県単独sectionへ混入しない
- 欠測・算定なし・負値・0が区別される
- 対象テーマの`no-selection / dup-sortorder / primary-orphan`が0
- R2 push / deployを行っていない

## 採用決定

**PR-0のscope・構成・閾値監査後に実装可能。財政力、弾力性、債務負担を別概念として示し、目的別・性質別歳出を完全に分離する。都道府県単独を主scopeとし、都道府県・市町村合計は補足へ隔離する。法定健全化判断比率とその他の財政指標を混同せず、欠測・算定なし・負値を保持する。**
