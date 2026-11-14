---
type: theme-catalog-review
date: 2026-07-12
status: ready-after-denominator-and-provenance-audit
theme: safety
tags: [theme-catalog, crime, traffic, fire, emergency, disaster]
---

# テーマレビュー: safety（安全）

## 結論

主問は、**その都道府県で日常生活上のどのリスクがどの程度観測され、犯罪・交通・火災の各分野でどう推移しているか**とする。

「安全」を1つの順位や総合点にしない。次の独立した4領域として読む。

1. **治安**: 刑法犯認知件数・人口当たり認知件数・罪種別構成
2. **交通安全**: 交通事故死者、負傷者、発生件数
3. **火災**: 建物火災、火災死者・負傷者
4. **対応需要**: 救急出動。ただし安全度や消防能力の成果指標とは呼ばない

自然災害被害額は単年の災害発生地点に支配され、平時の安全度を表さない。自殺は公衆衛生・社会課題として慎重に扱い、一般的な「治安・安全ランキング」の主要指標から外す。

## P0: 分母・provenance・定義監査

実装前に次を確定する。

- 犯罪指標が認知件数、検挙件数、検挙人員のどれか。犯罪発生、警察活動、被疑者人数を混同しない
- 刑法犯認知件数の対象罪種、人口分母、暦年、都道府県の計上基準
- 検挙率の分子・分母、前年以前に認知した事件の検挙を含むか。100%超が起こり得る定義か
- 「凶悪犯」「粗暴犯」「知能犯」等の罪種定義と分類改定
- 少年指標が検挙人員であり、少年による犯罪発生率ではないこと
- 薬物指標が検挙人員/件数であり、使用者数や有病率ではないこと
- 交通事故の「死者」の24時間死者/30日死者の別、発生件数、負傷者、死傷者の定義
- 人口当たり交通事故率が道路走行量・自動車保有台数・昼間人口を調整しないこと
- 高齢者事故が実数か人口当たりか。実数ならprimary/secondaryで県間比較しない
- 建物火災、全火災、火災死者、放火自殺者等を含む範囲
- 救急出動件数が需要量であり、現場到着時間・搬送時間・救命率とは異なること
- 自殺率が人口動態統計か警察庁自殺統計か。住所地/発見地、外国人、確定時期の違い
- 災害被害額の対象災害、資産範囲、価格、欠測とゼロの区別

## 公式根拠

### 警察庁「犯罪統計」

- URL: https://www.npa.go.jp/toukei/soubunkan/R06/R06hanzaitoukei.htm
- 都道府県別の刑法犯認知・検挙、罪種別統計の中心出典
- 認知件数は被害実態の完全把握ではなく、警察が認知した事件数である
- 検挙率を単独で治安や警察能力の順位にしない

### 警察庁「令和7年警察白書 統計資料」

- URL: https://www.npa.go.jp/hakusyo/r07/data.html
- 都道府県別刑法犯認知・検挙、人口当たり主要罪種の定義確認に使う
- 犯罪分類・集計年をcatalogと照合する

### 警察庁「交通事故統計」

- URL: https://www.npa.go.jp/bureau/traffic/bunseki/nenkan/070227R06nenkan.pdf
- 交通事故発生件数、死者、重傷者、負傷者の中心出典
- 24時間死者と30日以内死者を区別する
- 人口当たり値だけでなく、年齢構成・交通量・道路環境の差を注記する

### 総務省消防庁「消防統計（火災統計）」

- URL: https://www.fdma.go.jp/pressrelease/statistics/
- 火災件数、火災死者、損害等の確定値の中心出典
- 暫定値/確定値、全火災/建物火災、放火自殺者等の扱いを確認する

### 総務省消防庁「消防白書」

- URL: https://www.fdma.go.jp/publication/hakusho/r6/chapter1/section1/para1/67983.html
- 火災の長期推移と都道府県別出火率・死者率の定義確認に使う
- 出火件数、出火率、死者数を別の尺度として表示する

### 総務省消防庁「救急救助の現況」

- URL: https://www.fdma.go.jp/publication/rescue/post-7.html
- 救急出動、搬送人員、現場到着・病院収容時間等の中心出典
- 出動件数の多さを対応能力の高さ/低さと評価しない

### 厚生労働省「人口動態統計」

- URL: https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/suii00/index.html
- 自殺・不慮の事故による死亡数、死亡率の定義確認に使う
- 警察庁自殺統計と集計原理が異なるため混在させない

### 内閣府「災害関係データ」

- URL: https://www.bousai.go.jp/shiryou/data.html
- 自然災害被害の資料入口
- 単年被害額は曝露、災害発生、資産価値、把握範囲に左右され、恒常的安全度には使わない

## テーマ境界

| テーマ | 責務 |
|---|---|
| `safety` | 犯罪認知、交通事故、火災と日常的な対応需要 |
| `healthcare` | 自殺、公衆衛生、救急医療提供体制。救急出動との接続は関連導線 |
| `aging-society` | 高齢人口構成。高齢者事故は年齢調整・人口当たり指標の場合のみ接続 |
| `roads` | 道路整備・交通量。事故件数を道路延長だけで説明しない |
| `climate` / 防災領域 | 自然災害の曝露・被害。単年被害額は日常安全と分離 |
| `local-finance` | 警察・消防・災害復旧費。支出額を安全成果としない |

## 現行指標の提案

| rankingKey | 現行 role | 提案 | 理由 |
|---|---|---|---|
| `penal-code-offenses-recognized-per-1000` | primary | **primary keep** | 治安領域の代表。ただし「犯罪率」ではなく人口当たり認知件数と表示 |
| `serious-crime-per-100k` | primary | **secondaryへ変更** | 重要だが少数件で年次変動が大きい。複数年平均も検討 |
| `criminal-recognition-count` | secondary | **contextへ変更** | 人口規模に強く依存。全国総数・当該県推移には使える |
| `violent-crime-per-100k` | secondary | **secondary keep** | 罪種別リスク。ただし分類と小標本を注記 |
| `criminal-arrest-rate` | secondary | **contextへ変更** | 認知年と検挙年のずれ、捜査・報告の影響があり安全度ではない |
| 罪種別認知率 | context | **context keep** | 内訳として有用。重複・包含関係を監査 |
| `juvenile-criminal-arrest-person-per-population` | secondary | **contextへ変更・改名** | 少年の検挙人員であり「少年犯罪率」ではない |
| `drug-enforcement-arrest-count-per-population` | context | **context keep** | 薬物使用率ではなく取締り・検挙の観測値 |
| `traffic-accident-deaths-per-100k` | primary | **primary keep** | 交通安全の重篤アウトカム。24時間/30日定義を表示 |
| `traffic-accident-count-per-population` | secondary | **secondary keep** | 県間比較向け。ただし交通曝露を調整しない |
| `traffic-accident-count` | context | **context keep** | 県内負荷の把握。県間安全順位には使わない |
| `traffic-accident-deaths-per-100-accidents` | context | **secondary候補** | 事故の重篤度。ただし少数死者で変動するため複数年平均を検討 |
| `traffic-accident-injuries-per-100k` | context | **secondary keep** | 死者だけでは見えない被害。定義を事故件数と揃える |
| `traffic-accident-casualties-elderly-65plus` | secondary | **context / 人口当たりへ置換** | 高齢人口の多い県ほど実数が増える |
| `building-fire-count-per-100-thousand-people` | secondary | **primaryへ変更** | 火災領域の代表。全火災との違いを表示 |
| `fire-deaths-per-100k` | secondary | **primaryへ変更** | 重篤アウトカム。少数件のため複数年平均を検討 |
| `fire-damage-casualties-per-population` | context | **secondary keep** | 死者・負傷者の範囲を明記 |
| `annual-emergency-dispatches-per-1000` | secondary | **contextへ変更** | 救急需要であり安全成果・消防能力ではない |
| `disaster-damage-amount-per-person` | context | **主要一覧から削除/防災へ移管** | 単年イベントと資産価値に支配される |
| `suicide-rate-per-100k` | secondary | **healthcareへ移管** | 公衆衛生・自殺対策として扱い、治安と同列にしない |
| `suicides-per-100k` | context | **重複整理後healthcareへ移管** | 前項と定義・出典が異なる可能性を監査 |
| `accidental-deaths-per-100k` | secondary | **healthcare/contextへ移管** | 人口動態上の死因で、犯罪・交通・消防の合成安全度ではない |
| `police-officer-count-per-population` | context | **対応資源sectionでcontext** | 投入量であり治安成果ではない |

## 現行チャートの提案

| componentKey | 提案 | 理由 / 実装 |
|---|---|---|
| `crime-count-arrest-rate-trend` | **keep / 注記強化** | 件/千人と%の二軸はmixed-chartで分離。検挙率を安全成果と断定しない |
| `traffic-accident-deaths-trend` | **タイトル修正 / keep** | componentKeyは死者だが表示は発生件数と負傷者。key/title/propsを一致させる |
| `fire-emergency-trend` | **分割** | 火災リスクと救急需要は分母も意味も違い、同一line chartに置かない |
| `suicide-accident-death-trend` | **healthcareへ移管/削除** | 敏感な公衆衛生指標を一般安全テーマの流れに混ぜない |
| `safety-crime-types-donut` | **構成監査後keep** | 罪種が排他的か、合計に「その他」が含まれるかを確認。固定2023年を動的年度へ |
| `safety-fire-casualties-donut` | **棒グラフへ変更候補** | 死亡と負傷は重大度が異なり、構成比だけでは死者の意味が薄れる |

### 追加チャート

1. **人口当たり刑法犯認知件数**: line。全国値と当該県を同一定義で比較。
2. **交通事故死者・負傷者**: 単位別small multiples。死者は可能なら複数年平均も併記。
3. **建物火災出火率・火災死者率**: 別panel。出火と重篤化を分ける。
4. **救急出動と搬送時間**: データが揃う場合のみ需要と応答を別panelで表示。
5. **罪種別構成**: 排他的分類と「その他」を保証できる場合のみdonut/stacked bar。

## 推奨表示順

1. このページは総合安全ランキングではない旨の説明
2. 治安: 人口当たり刑法犯認知件数
3. 治安: 罪種別認知と検挙率（参考）
4. 交通: 死者率、負傷者率、事故発生率
5. 火災: 建物火災出火率、火災死者率
6. 救急出動（需要指標）
7. 警察・消防資源、自然災害、公衆衛生への関連導線
8. 定義 / FAQ
9. 全指標

## 不採用・保留

| 候補 | 判定 | 理由 / 再検討条件 |
|---|---|---|
| 25指標を合成した安全総合点 | 不採用 | 異なるリスク・分母・価値判断を恣意的な重みで合成する |
| 認知件数=実際に起きた犯罪総数 | 不採用 | 未届・未認知を含まず、届出・警察活動の影響を受ける |
| 検挙率が高い=安全 | 不採用 | 犯罪発生リスクと捜査結果は別で、認知年とのずれもある |
| 検挙人員=犯罪件数 | 不採用 | 1事件複数人、1人複数事件があり単位が異なる |
| 救急出動が多い=消防体制が良い/悪い | 不採用 | 高齢化、疾病、観光・昼間人口、利用行動等で需要が変わる |
| 単年災害被害額が少ない=災害に安全 | 不採用 | その年に大災害が発生したかと資産曝露に支配される |
| 自殺率を治安ランキングに含める | 不採用 | 公衆衛生・社会的要因を伴う敏感な指標で責務が異なる |
| 高齢者事故実数で県間順位 | 不採用 | 高齢人口規模を調整していない |

## Claude Code実装指示

### PR-0: 定義・分母・provenance監査

1. 25指標について元表、所管、暦年、単位、分子、分母、計上基準を一覧化
2. 犯罪認知/検挙件数/検挙人員、24時間/30日交通死者、全火災/建物火災をfixtureで区別
3. `suicide-rate-per-100k`と`suicides-per-100k`の出典・住所地/発見地・対象人口の違いを確認
4. 高齢者交通事故指標と災害被害額の0/欠測・分母を監査
5. donutカテゴリが排他的かつ全体を構成するか確認
6. chart title/componentKey/props/unitsの不一致を列挙し本文書へ追記

### PR-1: ThemeCatalog再構成

編集SSOT: `packages/data-configs/src/theme-catalog/safety.ts`

1. 治安・交通・火災・対応需要の4sectionへ整理し、総合安全評価を作らない
2. 上表に従いroleを変更し、primary/secondaryへ公式根拠付き`selection`を追加
3. 自殺・不慮の事故をhealthcare関連導線へ、災害被害額を防災関連導線へ移す
4. 火災と救急のline chartを分割
5. traffic chartのcomponentKey/title/系列を一致させる
6. 固定年を除去し、データ年度を表示値から解決する
7. `sourceLink/rankingLink/relatedRankingKeys`を補完
8. section内`sortOrder`を一意化し、guidanceに分母・少数件・認知統計の注意を追加

### 禁止

- 異分野指標を合成した総合安全ランキングを作らない
- 認知件数を実被害総数、検挙率を安全度と呼ばない
- 検挙人員を犯罪発生件数と呼ばない
- 人口当たり値と実数を同じ尺度で順位化しない
- 24時間死者と30日死者を混在させない
- 火災件数と救急出動を同一Y軸に載せない
- 自殺を刺激的な見出しや一般的な治安比較に使わない
- 災害被害の欠測を0として扱わない
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

- primary/secondary全指標で分子、分母、所管、計上年を確認できる
- 認知/検挙/検挙人員、24時間/30日死者、火災/救急が混同されていない
- 異なる単位を通常line chartの同一Y軸へ載せていない
- 固定年タイトルと実データ年度が乖離しない
- 自殺・災害被害が総合安全評価に使われていない
- 対象テーマの`no-selection / dup-sortorder / primary-orphan`が0
- R2 push / deployを行っていない

## 採用決定

**PR-0の分母・provenance監査後に実装可能。「安全」を単一順位にせず、治安・交通・火災・対応需要を独立表示する。自殺と単年災害被害額は主要指標から分離する。**
