---
type: theme-catalog-review
date: 2026-07-13
status: ready-after-definition-and-source-audit
theme: foreign-residents
tags: [theme-catalog, foreign-residents, nationality, residence-status, foreign-workers, international-students]
---

# テーマレビュー: foreign-residents（外国人住民）

## 結論

主問は、**その都道府県にどの程度の外国人が生活し、国籍・地域と在留資格の構成がどう異なり、地域社会・雇用・教育との接点がどう変化しているか**とする。

読み順は次の4層に分ける。

1. **居住規模**: 在留外国人数、総人口に占める比率、増減
2. **居住構成**: 国籍・地域別、在留資格別。人数と構成比を併記
3. **地域との接点**: 外国人労働者、外国人留学生。居住者総数とは別母集団として補足
4. **生活・共生**: 言語、行政サービス、生活上の困難。47都道府県比較が成立する指標のみ

訪日外国人宿泊者は旅行者であり、外国人住民ではない。現行の観光系列は `tourism` へ移管する。また、国勢調査の「常住している外国人」と出入国在留管理庁の「在留外国人」は、基準日・対象・制度が異なる。2020年国勢調査から2024年末在留外国人統計へ線を直結して「増加」と読ませない。

## P0: 対象範囲・系列監査

実装前に次を確定する。

- `foreign-resident-count` / 国籍別3系列が国勢調査の常住外国人で、5年周期・10月1日現在か
- `resident-foreigner-population` が在留外国人統計の中長期在留者と特別永住者の合計、年末現在か
- 中長期在留者から3月以下、短期滞在、外交、公用等が除外されること
- 国勢調査は日本に常住する人を調査し、国籍不詳・未回答の扱いが在留外国人統計と異なること
- `foreign-resident-count-per-100k` の分子・分母・基準日が一致するか。「比率」の表示単位を `%` または人口千人当たりへ統一すべきか
- `resident-foreigner-population` の `yearFormat: fiscal` が元統計の「2024年末」と整合するか
- 2024年系列 `resident-foreigner-*` と2020年系列 `foreign-resident-count-*` の国籍・地域区分が一致するか
- 中国に台湾・香港等を含むか、韓国と朝鮮を合算するかなど各系列の表章範囲
- 国籍・地域別人数の合計が総数と一致するか。無国籍、その他、不詳の扱い
- 在留資格別の区分変更、制度改正、技能実習から育成就労への移行等を跨ぐ比較可能性
- 外国人労働者数が事業主の届出で、特別永住者・外交・公用を除き、居住地ではなく事業所所在地側の集計か
- 外国人留学生数の基準日、学校種、日本語教育機関を含む範囲と、在留資格「留学」の人数との差
- 半期値と年末値、速報・確定・訂正値を混在させていないか
- 欠測、秘匿、該当なしを0として扱っていないか

## 公式根拠

### 出入国在留管理庁「在留外国人統計」

- URL: https://www.moj.go.jp/isa/policies/statistics/toukei_ichiran_touroku.html
- 在留外国人数、国籍・地域、在留資格、年齢、性別、都道府県の中心出典
- 2021年以降は半期ごとの組合せ表が提供されるため、比較基準日は年末に固定する
- 旧登録外国人統計からの制度・定義変更を確認し、長期線を無条件に接続しない

### 出入国在留管理庁「令和6年末現在における在留外国人数」

- URL: https://www.moj.go.jp/isa/publications/press/13_00052.html
- 中長期在留者と特別永住者を合わせた在留外国人数の定義、都道府県・国籍・在留資格別表の根拠
- 短期滞在者は在留外国人数に含まれず、訪日客との混同を避ける

### 総務省統計局「日本に住んでいる外国人の人口」

- URL: https://www.stat.go.jp/library/faq/faq02/faq02a03.html
- 国勢調査が5年ごとの10月1日現在で、日本に常住している外国人人口を国籍・男女別に把握することの根拠
- 在留カード等の行政記録に基づく在留外国人統計とは別系列として扱う

### 厚生労働省「外国人雇用状況の届出状況」

- URL: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/gaikokujin/gaikokujin-koyou/06.html
- 外国人労働者数、外国人を雇用する事業所数、国籍・在留資格・産業別構成の候補出典
- 事業主に雇用される外国人の届出件数で、特別永住者、外交、公用を除く。居住外国人総数の代替にしない

### 文部科学省・日本学生支援機構「外国人留学生在籍状況調査」

- URL: https://www.mext.go.jp/a_menu/koutou/ryugaku/1412692_00003.htm
- 大学等、専修学校、日本語教育機関に在籍する外国人留学生の候補出典
- 学校所在地側の在籍者であり、在留資格「留学」の都道府県別在留者と対象・基準日が一致するとは限らない

### 出入国在留管理庁「在留外国人に対する基礎調査」

- URL: https://www.moj.go.jp/isa/policies/coexistence/04_00017.html
- 職業生活、日常生活、社会生活上の問題を補足する公式調査
- 標本調査であり、47都道府県ランキングに必要な標本数・精度が確認できない場合は全国contextに限定する

## テーマ境界

| テーマ | 責務 |
|---|---|
| `foreign-residents` | 在留・常住する外国人の規模、国籍・地域、在留資格、地域との接点 |
| `tourism` | 訪日外国人を含む宿泊・観光需要。短期滞在者を住民としない |
| `labor-wages` | 外国人を含む雇用・賃金。外国人労働者は関連導線または補足section |
| `education-culture` | 外国人留学生を含む教育機会・学校供給。居住者テーマでは構成の補足 |
| `population-dynamics` | 総人口、自然・社会増減。外国人の入出国・国内移動を一括で同一視しない |
| `safety` | 犯罪・事故等。外国人人口から治安を推論せず、属性によるスティグマを作らない |

## 現行指標の提案

| rankingKey | 現行 role | 提案 | 理由 |
|---|---|---|---|
| `foreign-resident-count-per-100k` | primary | **contextへ変更または置換** | 2020年国勢調査系列。名称は「比率」だが単位は人/10万人で、最新の在留外国人比率ではない |
| `foreign-resident-count` | secondary | **historical contextへ変更** | 国勢調査の常住外国人。長期比較には有用だが2024年在留外国人数と同一系列ではない |
| `resident-foreigner-population` | context | **primaryへ変更** | 最新の居住規模の中心。年末値と定義を明記 |
| `foreign-resident-count-china-per-100k` | secondary | **historical contextへ変更** | 2020年国勢調査。最新の国籍構成には2024年在留外国人系列を使う |
| `foreign-resident-count-china` | context | **2024年系列へ置換** | `resident-foreigner-china` が存在。定義監査後に置換 |
| `foreign-resident-count-korea-per-100k` | secondary | **historical contextへ変更** | 韓国・朝鮮の表章範囲を確認し、現行の最新値として見せない |
| `foreign-resident-count-korea` | context | **2024年系列へ置換候補** | `resident-foreigner-korea` の対象範囲監査後に置換 |
| `foreign-resident-count-usa-per-100k` | context | **主要一覧から削除** | 特定3国だけを固定表示する選定根拠が弱く、現在の主要国構成を反映しない |
| `foreign-resident-count-usa` | context | **主要一覧から削除** | 同上。国籍構成chartの「その他」に含めるか全指標へ |
| `total-overnight-guests-foreign` | secondary | **remove / tourismへ移管** | 外国人宿泊者は住民ではなく、延べ人泊。テーマ境界に反する |
| 在留外国人比率 | なし | **primary追加候補** | 2024年末在留外国人数÷同時点に近い総人口。分母時点の監査が必須 |
| 在留外国人数の前年差・増減率 | なし | **secondary追加候補** | 現在の変化を説明。ただし小さい母数の率を単独で強調しない |
| 国籍・地域別構成 | 一部あり | **secondary再構成** | 最新年の主要国とその他を公式表から動的に選定。人数と構成比を併記 |
| 在留資格別構成 | なし | **secondary追加候補** | 居住の目的・定着性を国籍とは別軸で説明できる |
| 外国人労働者数 | なし | **context追加候補** | 地域の雇用との接点。事業所所在地ベースで住民総数と分離 |
| 外国人留学生数 | なし | **context追加候補** | 教育との接点。学校所在地・学校種・基準日を明記 |

## 現行チャートの提案

| componentKey | 提案 | 理由 / 実装 |
|---|---|---|
| `theme-foreign-total-trend` | **remove / 2chartへ分割** | 人口10万人当たりと人数は単位が異なるうえ、2020年国勢調査系列。最新の在留外国人年末推移と国勢調査5年推移を別chartにする |
| `theme-foreign-nationality-trend` | **replace** | 中国・韓国だけの固定2系列は現在の多様な国籍構成を表さない。最新年構成と主要国の年末推移を分ける |
| `theme-foreign-tourism-trend` | **remove / tourismへ移管** | 外国人宿泊者は居住者ではなく、延べ人泊。住民テーマの読者の問いに答えない |

### 追加チャート

1. **在留外国人数と比率の推移**: 単位を分離した2panelまたは適切なmixed chart。年末値に統一する。
2. **国籍・地域別構成**: 最新年の上位国・地域とその他。カテゴリ数を抑え、人数と構成比を併記する。
3. **在留資格別構成**: 永住者、技能実習、技術・人文知識・国際業務、留学、家族滞在等。公式区分変更を注記する。
4. **主要国籍・地域の推移**: 各年の上位国を動的に変えるのではなく、選定基準を固定し、その他を含める。
5. **外国人労働者・留学生**: 住民総数と同一chartに積み上げず、別section・別panelで表示する。
6. **国勢調査の常住外国人長期推移**: 5年ごとのhistorical context。行政記録系列との接続点を作らない。

## 推奨表示順

1. 在留外国人数
2. 総人口に占める在留外国人比率
3. 前年からの増減
4. 国籍・地域別構成
5. 在留資格別構成
6. 外国人労働者（補足）
7. 外国人留学生（補足）
8. 国勢調査による長期推移（別系列）
9. 共生・生活上の課題（比較可能な場合）
10. 定義 / FAQ
11. 全指標

## 不採用・保留

| 候補 | 判定 | 理由 / 再検討条件 |
|---|---|---|
| 外国人宿泊者数を外国人住民指標として表示 | 不採用 | 旅行者の延べ人泊で母集団が異なる |
| 国勢調査2020と在留外国人統計2024を同じlineで接続 | 不採用 | 対象、基準日、収集方法が異なる |
| 人口10万人当たりを単に「外国人比率」と表示 | 不採用 | 単位が%ではなく、分母・基準日も読者に伝わらない |
| 中国・韓国・米国だけを主要3国として固定 | 不採用 | 現在の構成を表す根拠がなく、他の主要国を不可視化する |
| 国籍から在留目的・職業を推定 | 不採用 | 国籍と在留資格・就業状態は別軸 |
| 外国人労働者数÷在留外国人数を就業率と呼ぶ | 不採用 | 対象除外と集計地点が異なり、同一母集団・地域ではない |
| 留学生数と在留資格「留学」を同一視 | 不採用 | 学校種、学校所在地、基準日、対象範囲が一致するとは限らない |
| 外国人比率から治安・地域負担を推論 | 不採用 | 因果根拠がなく、属性へのスティグマを生む |
| 共生状況の都道府県ランキング | 保留 | 47県の標本精度と統一定義が確認できる場合のみ |
| 旧登録外国人統計を制度変更無注記で長期接続 | 不採用 | 2012年の在留管理制度変更等による断層を監査する必要がある |

## Claude Code実装指示

### PR-0: 定義・出典・重複監査

1. 現行10指標と3chartの元表、調査、基準日、対象、単位、利用可能年を一覧化
2. `foreign-resident-count*` が国勢調査、`resident-foreigner-*` が在留外国人統計由来であることをfixtureとprovenanceで確認
3. A1700 / #A01601 / A3200 および国籍別cdCat01の正式名称・分母・国籍範囲をe-Stat metadataで保存
4. `resident-foreigner-population` の `yearFormat: fiscal` を監査し、年末値に合う表示へ修正候補を切り出す
5. 2024年 `resident-foreigner-*` 全指標のcoverage、合計整合、国籍・地域区分、欠測を確認
6. 在留外国人比率の分母候補と基準日差を確認し、近似の場合はnoteへ明記
7. 在留資格別の都道府県データが47県・複数年で取得可能か確認し、新規metricは指標バックログへ記録
8. 外国人労働者・留学生について集計地点、対象除外、基準日、47県coverageを確認し、居住者との比率を算出しない
9. 2012年制度変更、半期/年末、速報/確定、訂正の系列metadataを整理

### PR-1: ThemeCatalog再構成

編集SSOT: `packages/data-configs/src/theme-catalog/foreign-residents.ts`

1. 居住規模・国籍構成・在留資格・地域との接点・長期参考のsectionへ整理
2. `resident-foreigner-population` をprimaryへ昇格し、公式根拠付き`selection`を追加
3. 2020年国勢調査系列をhistorical contextへ移し、2024年在留外国人系列と接続しない
4. 中国・韓国・米国固定の選定を廃止し、監査済み最新系列で国籍構成を再構成
5. `total-overnight-guests-foreign` と観光chartを削除し、`tourism` への関連導線を設定
6. 人数と比率は単位の異なる同一Y軸lineにせず、2panelまたは対応rendererへ分離
7. 外国人労働者・留学生を採用する場合、別section・別chart・明示的caveatを付ける
8. `sourceLink/rankingLink/relatedRankingKeys`を補完し、section内`sortOrder`を一意化
9. guidance/FAQに統計定義、基準日、国籍と在留資格の違い、旅行者との違いを追加
10. 不採用候補を`rejectedCandidates`へ記録する

### 禁止

- 訪日客・外国人宿泊者を外国人住民と呼ばない
- 国勢調査と在留外国人統計を同一系列として接続しない
- 在留外国人数に短期滞在者が含まれると説明しない
- 人口10万人当たりを無注記で%の「比率」と呼ばない
- 国籍と在留資格、職業、留学状態を同一視しない
- 居住地ベースと事業所・学校所在地ベースを混ぜて率を算出しない
- 国籍別カテゴリの欠測・その他を0として扱わない
- 属性から治安、負担、貢献を因果推論しない
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

- primary/secondary全指標で調査名、基準日、対象、単位、年を確認できる
- 国勢調査と在留外国人統計が別系列・別sectionとして表示される
- 在留外国人比率の分子・分母・基準日差を確認できる
- 国籍・地域別合計と総数の差を「その他・無国籍・欠測」を含め説明できる
- 外国人労働者・留学生を居住者総数へ積み上げていない
- 外国人宿泊者がテーマから除外され、`tourism` への導線だけ残る
- 対象テーマの`no-selection / dup-sortorder / primary-orphan`が0
- R2 push / deployを行っていない

## 採用決定

**PR-0の定義・出典監査後に実装可能。在留外国人統計の年末値を現在の主系列とし、国勢調査は長期参考へ分離する。国籍・地域と在留資格を二つの独立した構成軸として示し、外国人労働者・留学生は集計地点の異なる補足、外国人宿泊者は観光テーマへ移管する。**
