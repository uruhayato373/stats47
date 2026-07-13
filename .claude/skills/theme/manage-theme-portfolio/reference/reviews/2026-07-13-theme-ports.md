---
type: theme-catalog-review
date: 2026-07-13
status: ready-after-table-dimension-scope-and-unit-audit
theme: ports
tags: [theme-catalog, ports, cargo, containers, vessels, passengers, ferry]
---

# テーマレビュー: ports（港湾）

## 結論

主問は、**その都道府県の港湾が、国際・国内物流と地域の海上旅客交通において、どの程度の取扱規模と機能を持つか**とする。

読み順は次の4層に分ける。

1. **貨物流動**: 海上出入貨物量を輸出・輸入・移出・移入へ分解
2. **コンテナ物流**: TEUとコンテナ貨物トン数を区別し、外貿・内貿、実入り・空を確認
3. **船舶利用**: 入港隻数と入港船舶総トン数。船の数と規模を別々に読む
4. **旅客・フェリー**: 乗込・上陸人員、フェリー車両。観光客だけでなく生活交通・業務・物流を含む

港湾数が多いことと港湾機能が大きいことは別である。また港湾統計の貨物量は、通関額、県内生産額、県内企業の輸出額ではない。貨物が港を経由する都道府県を示し、背後圏は県境を越えるため、「その県が輸出した量」と断定しない。

## P0: 対象範囲・系列監査

実装前に次を確定する。

- 港湾調査の甲種港湾・乙種港湾、年報の対象港、港湾統合・名称変更を年次別に確認
- `port-cargo-total` が輸出+輸入+移出+移入で加法整合するか
- `port-cargo-export` / `import` は外国貿易、移出/移入は国内港間であること
- 現行貨物chartが輸出・輸入だけで、総貨物や国内移出入を表していないこと
- 貨物トン数が港を経由した物量であり、貿易額・生産地・消費地を表さないこと
- `port-container-count` のTEU定義、20フィート換算、外貿/内貿、輸出入/移出入、実入り/空コンテナの範囲
- `port-container-tonnage` とTEUの対象scopeが一致するか。個数と貨物重量を同一視しないこと
- `port-inbound-ships` と `port-ships-tonnage` が同一statsDataId・`cdCat01=100`・`cdCat02=100`を参照しているが、値項目の選択次元が設定に保持されているか
- 入港隻数の対象船舶の総トン数下限、外航/内航、商船/自航・非自航等の範囲
- `port-passengers-total` が乗込人員+上陸人員か、同一人物の往復・乗継を含む延べ人数か
- `passenger-ship-transport` が港湾調査ではなく輸送統計由来の場合、事業者・航路・港湾所在地のどこへ帰属するか
- 港湾旅客に観光、通勤通学、帰省、業務、離島生活交通が含まれること
- フェリー車両の乗用車・バス・トラック・その他の分類と合計整合
- 内陸県が対象外であり、港湾活動0の県としてランキング最下位にしないこと
- 滋賀県等の湖港が港湾調査に含まれるか。現行説明の「内陸7県」と実データcoverageの整合
- `yearFormat: fiscal` が港湾統計の暦年年報と一致するか
- `conversionFactor: 0.0001` の指標でraw unit、表示単位、tooltip、SEO値が一貫するか
- 速報・月報・年報・訂正を混在させず、年報確定値を優先できるか
- 2020年以降の年報集計事項追加が時系列比較へ与える影響

## 公式根拠

### 国土交通省「港湾調査の概要」

- URL: https://www.mlit.go.jp/k-toukei/kouwan_01.html
- 港湾調査の目的、沿革、対象、調査経路、月報・年報の中心資料
- 2020年分から年報の集計事項が追加されており、対象項目の連続性を確認する

### e-Stat「港湾調査 港湾統計（年報）」

- URL: https://www.e-stat.go.jp/stat-search/files?kikan=00600&toukei=00600280&tstat=000001018967
- 入港船舶、海上出入貨物、コンテナ、船舶乗降人員等の正本
- 表ごとの分類次元、単位、港別・都道府県別、甲種・乙種の範囲を確認する

### 国土交通省「港湾統計（年報）データベース形式資料」

- URL: https://www.mlit.go.jp/k-toukei/kowannenpodb.html
- 再集計可能な年別Excelの公式配布元
- e-Stat API設定と都道府県集計のfixtureを照合する

### e-Gov「港湾調査規則」

- URL: https://laws.e-gov.go.jp/document?lawid=326M50000800013
- 甲種港湾は月報・年報、乙種港湾は年報を公表する制度上の根拠
- 年報の対象と月報速報の対象を混在させない

### 国土交通省「みなと一覧」

- URL: https://www.mlit.go.jp/kowan/kowan_tk3_000002.html
- 港湾法上の国際戦略港湾、国際拠点港湾、重要港湾、地方港湾、避難港等の確認資料
- 港湾数は分類別に示し、取扱量の代替にしない

### e-Gov「港湾法」

- URL: https://laws.e-gov.go.jp/law/325AC0000000218
- 国際戦略港湾、国際拠点港湾、重要港湾、地方港湾の法的定義
- 漁港漁場整備法上の漁港とは別制度であることを明示する

## テーマ境界

| テーマ | 責務 |
|---|---|
| `ports` | 港湾法上の港湾、港湾貨物、コンテナ、入港船舶、港湾旅客・フェリー |
| `fishery-marine` | 漁港、漁船、水産物生産。港湾法上の港湾と混ぜない |
| `tourism` | 宿泊・観光消費。港湾旅客を全て観光客としない |
| `local-economy` | 生産・所得・産業構造。港湾通過貨物を県内生産としない |
| `roads` | 道路貨物・自動車交通、港への陸上アクセス |
| `railway` | 鉄道貨物・旅客、港への鉄道アクセス |

## 現行指標の提案

| rankingKey | 現行 role | 提案 | 理由 |
|---|---|---|---|
| `port-cargo-total` | primary | **primary keep** | 港湾物流規模の中心。輸出入・移出入合計と明記 |
| `port-cargo-export` | secondary | **secondary keep** | 外国向け搬出貨物。県内企業の輸出量とは限らない |
| `port-cargo-import` | secondary | **secondary keep** | 外国からの搬入貨物。県内最終需要とは限らない |
| `port-container-count` | primary | **primary keep / scope明記** | コンテナ港機能の中心。TEUと対象コンテナ範囲を明記 |
| `maritime-import-export-cargo` | context | **重複監査後remove候補** | 港湾統計由来の最新単年集約と見られ、`port-cargo-total`との定義・値重複を確認 |
| `port-inbound-ships` | secondary | **secondary keep / source次元監査** | 港の利用頻度。ただし小型船多数と大型船少数を区別できない |
| `port-ships-tonnage` | secondary | **secondary keep / source次元監査** | 入港船の規模を補完。同一API設定に見えるため値項目監査がP0 |
| `port-passengers-total` | primary | **primary keep / 旅客section** | 地域の海上旅客交通を示す。延べ乗降人員で観光客数ではない |
| `passenger-ship-transport` | secondary | **contextへ変更 / 重複監査** | 港湾旅客と調査・帰属・単位が異なる可能性があり、同列比較しない |
| `port-cargo-coastal-out` | なし | **secondary追加候補** | 国内向け移出を含めないと総貨物の構造を説明できない |
| `port-cargo-coastal-in` | なし | **secondary追加候補** | 国内からの移入。輸入と区別する |
| `port-container-tonnage` | なし | **context追加候補** | TEUでは分からない貨物重量を補足。scope一致が条件 |
| `port-passengers-boarding` | なし | **context追加候補** | 乗込・上陸の内訳。合計との加法整合を確認 |
| `port-passengers-landing` | なし | **context追加候補** | 同上 |
| `port-vehicle-ferry-total` | なし | **secondary追加候補** | フェリーの物流・生活交通機能を旅客人数とは別に示す |
| `port-count` | なし | **context追加候補/SSOT監査** | 港湾分類別の基盤数。現行の`ports table`依存を完全DBレス正典へ合わせる必要あり |

## 現行チャートの提案

| componentKey | 提案 | 理由 / 実装 |
|---|---|---|
| `ports-cargo-trend` | **revise / 4系列へ** | タイトルは輸出入で正しいが、主指標の総貨物には移出入も含む。外貿と内貿を分けて全体構造を示す |
| `ports-container-trend` | **keep / 定義追加** | TEU、実入り/空、外貿/内貿の範囲を注記。重量chartとは分離 |
| `ports-passengers-trend` | **keep / 誤読防止** | 延べ乗降人員、観光目的非識別、2020年前後の特殊要因を明記 |

### 追加チャート

1. **海上出入貨物の構成**: 輸出・輸入・移出・移入が同一分母・同一年で合計する場合のcomposition chart。
2. **外貿/内貿貨物の推移**: 4系列が多すぎる場合は2panelに分ける。
3. **コンテナTEUと貨物トン数**: 単位の異なる別panel。換算関係を仮定しない。
4. **入港隻数と総トン数**: 別panelまたは適切な二軸chart。平均総トン/隻を出す場合は同一scopeをfixtureで確認。
5. **乗込・上陸旅客**: 合計との加法整合を確認し、延べ人数として表示。
6. **フェリー輸送車両**: 乗用車・バス・トラック等の構成。旅客数へ積み上げない。
7. **港湾分類**: 最新年の国際戦略・国際拠点・重要・地方港湾数をcontext表示。

## 推奨表示順

1. 海上出入貨物量
2. 輸出・輸入・移出・移入の構成
3. コンテナ取扱個数
4. コンテナ貨物重量
5. 入港船舶隻数・総トン数
6. 港湾旅客数
7. フェリー輸送車両
8. 港湾分類・港湾数
9. 道路・鉄道・地域経済への関連導線
10. 定義 / FAQ
11. 全指標

## 不採用・保留

| 候補 | 判定 | 理由 / 再検討条件 |
|---|---|---|
| 港湾貨物量=県内企業の輸出入量 | 不採用 | 港の背後圏は県境を越え、通過貨物を含む |
| 海上出入貨物総量=輸出+輸入 | 不採用 | 国内の移出・移入も含む |
| 貨物トン数=貿易額 | 不採用 | 重量と金額は別概念で品目構成の影響が大きい |
| TEU=コンテナ個数そのもの | 不採用 | 20フィートコンテナ換算単位である |
| TEUから貨物重量を一律換算 | 不採用 | 空コンテナと品目別重量を反映しない |
| 入港隻数が多い=物流量が多い | 不採用 | 船型・総トン数・貨物積載量が異なる |
| 港湾旅客数=観光客数 | 不採用 | 生活交通、通勤通学、業務、帰省等を含む延べ乗降人員 |
| 港湾数が多い=港湾競争力が高い | 不採用 | 港の分類、規模、航路、取扱量を反映しない |
| 漁港を港湾数へ合算 | 不採用 | 根拠法と機能分類が異なる |
| 内陸県を港湾活動0として順位化 | 不採用 | 調査対象外と0を区別する必要がある |
| 平均総トン/隻 | 保留 | 隻数と総トン数が完全に同一対象・同一分類なら追加可能 |

## Claude Code実装指示

### PR-0: 表次元・scope・単位監査

1. 現行9指標と3chartの統計表、分類次元、港湾範囲、地理集計、単位、年、速報/確報を一覧化
2. `port-cargo-total = export + import + coastal-out + coastal-in` を都道府県×全年で検証
3. コンテナTEUの外貿/内貿、実入り/空、輸出入/移出入のscopeをe-Stat metadataで確認
4. `port-inbound-ships` と `port-ships-tonnage` の同一APIパラメータから異なる値項目を取得する仕組みを追跡し、fixtureで値・単位を検証
5. 港湾旅客合計と乗込・上陸、フェリー車両合計と車種内訳の加法整合を確認
6. `passenger-ship-transport` と港湾旅客の調査、集計地点、単位、年次を比較
7. 港湾統計が暦年かを確認し、`yearFormat: fiscal`を全対象指標で監査
8. `conversionFactor: 0.0001` のraw値・表示値・unit・displayUnit・SEOをfixtureで検証
9. 内陸県・湖港・欠測・秘匿・真の0を区別する
10. 2020年年報集計追加、港湾統合、訂正をseries metadataへ記録

### PR-1: ThemeCatalog再構成

編集SSOT: `packages/data-configs/src/theme-catalog/ports.ts`

1. 貨物・コンテナ・船舶・旅客フェリー・港湾基盤のsectionへ整理
2. 総貨物、コンテナTEU、港湾旅客をprimary候補とし、公式根拠付き`selection`を追加
3. 貨物を輸出・輸入・移出・移入へ分解し、合計との包含関係を明示
4. TEUと貨物トン数、隻数と総トン数を単位別panelへ分離
5. 港湾旅客と旅客船輸送人員を定義監査後に別chart・別contextへ整理
6. フェリー車両を旅客人数とは別sectionで追加検討
7. 港湾数を追加する場合、git TS/R2の完全DBレスSSOTへ合わせ、分類別・基準日付きにする
8. 対象外・欠測を0にせず、湖港を含むcoverageを明示
9. `sourceLink/rankingLink/relatedRankingKeys`を補完し、section内`sortOrder`を一意化
10. guidance/FAQへ外貿/内貿、重量/金額、TEU、延べ旅客、港湾/漁港の違いを追加
11. 不採用候補を`rejectedCandidates`へ記録

### 禁止

- 港湾貨物を県内企業の生産・輸出入と呼ばない
- 総貨物を輸出+輸入だけで説明しない
- TEU、コンテナ個数、貨物トン数を同一視しない
- 隻数と総トン数を同一Y軸へ置かない
- 港湾旅客を観光客・実人数と呼ばない
- 乗込+上陸を重複のない人数と断定しない
- 港湾と漁港を合算しない
- 内陸県の対象外・欠測を0として順位化しない
- 暦年値を年度値と表示しない
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

- primary/secondary全指標で統計表、港湾範囲、地理集計、単位、暦年を確認できる
- 総貨物と輸出・輸入・移出・移入が加法整合するか差分理由を説明できる
- TEUと貨物重量、隻数と総トン数が別単位として表示される
- 同一statsDataId内の値項目を誤選択していない
- 港湾旅客と旅客船輸送人員の調査・帰属が区別される
- 対象外・欠測・0、港湾・漁港が区別される
- 対象テーマの`no-selection / dup-sortorder / primary-orphan`が0
- R2 push / deployを行っていない

## 採用決定

**PR-0の表次元・scope・単位監査後に実装可能。総貨物を輸出・輸入・移出・移入へ分解し、TEU/重量、隻数/総トン数、港湾旅客/旅客船輸送人員を別概念として表示する。港湾通過量を県内生産や貿易額とせず、港湾・漁港、対象外・0、暦年・年度を厳密に区別する。**
