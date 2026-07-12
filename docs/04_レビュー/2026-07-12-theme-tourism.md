---
type: theme-catalog-review
date: 2026-07-12
status: ready-after-scope-and-series-audit
theme: tourism
tags: [theme-catalog, tourism, accommodation, inbound, occupancy, consumption]
---

# テーマレビュー: tourism（観光）

## 結論

主問は、**その都道府県にどの程度の宿泊需要があり、日本人・外国人の構成、宿泊供給の稼働、観光消費がどう推移しているか**とする。

読み順は次の4層に分ける。

1. **需要規模**: 延べ宿泊者数。実宿泊者数・観光入込客数とは区別
2. **需要構成**: 日本人/外国人、可能なら居住地・目的別
3. **需給**: 客室数、客室稼働率、施設タイプ
4. **地域への効果**: 観光消費額・消費単価。データ比較可能性を確認できる場合のみ

住民の旅行行動者率は「その県を訪れた観光客」ではなく「その県の住民が旅行した割合」であり、目的地側の観光力と分離する。航空・JR旅客も観光客だけではないため、アクセスのcontextまたは交通テーマへの関連導線とする。

## P0: 対象範囲・系列監査

実装前に次を確定する。

- `total-overnight-guests`が延べ宿泊者数（人泊）であり、実人数ではないこと
- 全体延べ宿泊者数が外国人を含むため、「日本人・外国人」の2系列として直接並べていないか
- 日本人延べ宿泊者数を表示する場合、公式系列か同一scopeの全体−外国人で算出できるか
- 旅館、ホテル、簡易宿所、会社・団体の宿泊所等の対象範囲
- 2010年第2四半期から従業者9人以下施設を対象へ追加した系列断層
- 2026年1月から層化基準が従業者数から客室数へ変わる断層
- 速報/第2次速報/確定値を混在させず、訂正反映と取得日を記録できるか
- 客室稼働率の分子・分母、施設タイプ、全体値、未回答施設の推計
- 宿泊施設数・客室数の出典が衛生行政報告例か宿泊旅行統計か。ホテル/旅館/簡易宿所の定義差
- 社会生活基本調査の旅行行動者率が居住地ベース、標本調査、2021年コロナ禍であること
- 航空/JR旅客に通勤、業務、帰省、乗継が含まれ、観光客数ではないこと
- 観光入込客統計の共通基準導入状況、未導入県、欠測、暦年/年度、実数/延べの比較可能性
- 観光消費額で日本人/外国人、宿泊/日帰り、目的地/居住地を区別できるか

## 公式根拠

### 観光庁「宿泊旅行統計調査」

- URL: https://www.mlit.go.jp/kankocho/tokei_hakusyo/shukuhakutokei.html
- 延べ・実宿泊者数、外国人宿泊者数、客室稼働率の中心出典
- 2010年第2四半期から従業者9人以下施設を対象に追加しており、切替前後の比較に注意する
- 速報・確定・訂正を区別し、最新確定値を優先する

### 観光庁「共通基準による観光入込客統計」

- URL: https://www.mlit.go.jp/kankocho/tokei_hakusyo/irikomikyaku.html
- 観光入込客数、消費額単価、観光消費額の都道府県比較候補
- 共通基準導入は46都道府県で、大阪府は未導入とされる
- 公表揃いが悪く、47都道府県同一年比較を満たさない場合はprimaryにしない

### 観光庁「旅行・観光消費動向調査」

- URL: https://www.mlit.go.jp/kankocho/tokei_hakusyo/shohidoko.html
- 日本国内居住者の旅行量・旅行消費の中心出典
- 居住者の旅行行動と訪問先の観光需要を区別する
- 都道府県別参考表の推計精度・対象年を確認してから採用する

### 総務省統計局「社会生活基本調査」

- URL: https://www.stat.go.jp/data/shakai/2021/kekka.htm
- 住民の旅行・行楽の行動者率の出典
- 目的地側の宿泊・入込ではなく居住地側の過去1年間の行動
- 5年周期の標本調査で、2021年はコロナ禍の影響を強く受ける

### 国土交通省・観光庁「住宅宿泊事業法の施行状況」

- URL: https://www.mlit.go.jp/kankocho/minpaku/business/host/construction_situation.html
- 届出住宅の宿泊実績を補足する場合の出典
- 旅館業法上の簡易宿所と住宅宿泊事業の届出住宅を同じ施設数として混ぜない

## テーマ境界

| テーマ | 責務 |
|---|---|
| `tourism` | 目的地側の宿泊需要、需要構成、宿泊供給、観光消費 |
| `railway` | 鉄道利用・駅アクセス。JR旅客を観光客としない |
| `ports` | 港湾・旅客船利用。上陸者を全て観光客としない |
| `roads` | 道路・道の駅・自動車交通。観光アクセスは関連導線 |
| `local-economy` | 観光を含む産業付加価値・地域経済効果 |
| `foreign-residents` | 居住外国人。訪日外国人宿泊者とは別母集団 |

## 現行指標の提案

| rankingKey | 現行 role | 提案 | 理由 |
|---|---|---|---|
| `total-overnight-guests` | primary | **primary keep** | 目的地側の宿泊需要の中心。延べ人泊と明記 |
| `total-overnight-guests-foreign` | secondary | **primaryへ変更** | インバウンド宿泊需要の中心。全体に内包されることを表示 |
| `room-utilization-rate` | secondary | **primaryへ変更** | 宿泊供給に対する利用状況。施設タイプ構成に注意 |
| `travel-participation-rate-domestic-tourism` | secondary | **resident travel sectionへcontext** | 居住者側の旅行行動で、当該県への来訪ではない |
| `travel-participation-rate-overseas` | context | **主要一覧から削除/住民行動へ** | 県の観光需要ではなく住民の海外旅行。2021年値は特殊 |
| `travel-participation-rate-overnight` | context | **resident travel sectionへcontext** | 同上。目的地は問わない |
| `travel-participation-rate-day-trip` | context | **resident travel sectionへcontext** | 同上。日帰り入込客数とは別 |
| `air-passenger-transport` | secondary | **交通アクセスcontextへ変更** | 観光客以外を含み、空港所在地・乗継の影響を受ける |
| `jr-passenger-transport` | context | **railwayへ移管/関連導線** | 観光目的を識別できない |
| `number-of-simple-lodging-facilities` | context | **供給sectionでcontext** | 旅館業法上の簡易宿所。民泊届出住宅と区別 |
| 日本人延べ宿泊者数 | なし | **secondary追加候補** | 外国人と排他的な需要構成を作る。公式系列を優先 |
| 外国人延べ宿泊者比率 | なし | **secondary追加候補** | 規模差を補う。ただし小規模県の変動に注意 |
| 客室数/宿泊施設タイプ | chartのみ | **secondary追加候補** | 稼働率の供給側分母と施設構成を説明 |
| 観光消費額・単価 | なし | **追加候補/47県比較監査** | 地域経済効果へ近いが、共通基準・欠測・未導入県を確認 |

## 現行チャートの提案

| componentKey | 提案 | 理由 / 実装 |
|---|---|---|
| `theme-tourism-stay-trend` | **系列修正** | 全体延べ宿泊者数と外国人は包含関係。「日本人・外国人」というタイトルは誤り。日本人系列を取得するか「全体・外国人」へ改名 |
| `theme-tourism-transport-trend` | **contextへ移動** | 航空旅客は観光客数ではない。宿泊需要との因果を断定しない |
| `theme-tourism-room-utilization-trend` | **keep / タイトル修正** | テーマページで全国平均だけなら地域主問に答えない。選択県と全国を明示 |
| `theme-tourism-hotel-supply-trend` | **small multiplesへ変更** | 施設数と客室数は単位・桁が異なり、同一Y軸lineに置かない |

### 追加チャート

1. **日本人・外国人延べ宿泊者数**: 排他的系列をstacked area/barで表示できる場合のみ。
2. **外国人宿泊比率**: totalとforeignが同scopeの年のみ算出。
3. **客室稼働率**: 当該県・全国、可能なら施設タイプ別。月次季節性も別表示候補。
4. **客室数と延べ宿泊者数**: 供給と需要を別panelで表示。
5. **観光消費額・単価**: 47県同年比較が成立する場合のみ。宿泊/日帰りを分ける。

## 推奨表示順

1. 延べ宿泊者数
2. 日本人・外国人の需要構成
3. 客室稼働率
4. 宿泊施設・客室供給
5. 観光消費額・単価（比較可能な場合）
6. 月次季節性
7. 航空・鉄道・道路・港湾アクセスへの関連導線
8. 居住者の旅行行動（補足）
9. 定義 / FAQ
10. 全指標

## 不採用・保留

| 候補 | 判定 | 理由 / 再検討条件 |
|---|---|---|
| 延べ宿泊者数=訪問者の実人数 | 不採用 | 同一人物の複数泊・複数施設を人泊として数える |
| 全体宿泊者数と外国人宿泊者数を日本人/外国人としてstack | 不採用 | 全体が外国人を内包し二重計上になる |
| 住民の旅行行動者率=県への観光人気 | 不採用 | 居住地側の行動で訪問先を表さない |
| 航空/JR旅客=観光客 | 不採用 | 通勤、業務、帰省、乗継等を含む |
| 客室稼働率が高い=観光収益が高い | 不採用 | 客室単価、施設タイプ、費用、季節性を含まない |
| 宿泊者数が多い=観光消費額が大きい | 不採用 | 日帰り、単価、目的、滞在内容を反映しない |
| 共通基準入込客統計を47県ランキング化 | 保留 | 未導入県・未公表県・年度不一致が解消した場合のみ |
| 2021年旅行行動を平常時の地域性と解釈 | 不採用 | コロナ禍の移動制限・行動変容の影響が大きい |
| 2010年の対象拡充を跨いだ無注記line | 不採用 | 小規模施設追加による系列断層がある |

## Claude Code実装指示

### PR-0: scope・系列監査

1. 現行10指標と4chartについて元表、所管、速報/確定、単位、対象施設、分子・分母を一覧化
2. total/foreign/Japaneseの包含関係と同一scopeをfixtureで確認
3. 2010年第2四半期の対象拡充、2026年1月の層化基準変更を時系列metadataへ記録
4. 客室稼働率の施設タイプ・全体集計、施設数/客室数の出典定義を確認
5. 社会生活基本調査4指標が居住地側かつ2021年値であることを確認
6. 航空/JR旅客の計上地点と観光目的非識別を確認
7. 観光消費の47県同年coverageを調査し、欠測があれば採用しない

### PR-1: ThemeCatalog再構成

編集SSOT: `packages/data-configs/src/theme-catalog/tourism.ts`

1. 宿泊需要・需要構成・需給・消費の4sectionへ整理
2. 外国人延べ宿泊と客室稼働率をprimaryへ昇格し、公式根拠付き`selection`を追加
3. 住民旅行行動を補足sectionへ、交通量を関連導線へ移す
4. stay trendの包含関係を是正し、日本人系列または正しい「全体・外国人」表示にする
5. 施設数と客室数を別panelへ分割
6. 全国平均だけでなく当該県との比較を表示
7. `sourceLink/rankingLink/relatedRankingKeys`を補完
8. section内`sortOrder`を一意化し、guidanceに人泊、対象施設、速報、系列断層を追加

### 禁止

- 延べ人泊を実人数と呼ばない
- 全体と外国人を排他的な日本人/外国人系列として扱わない
- 住民の旅行行動を目的地の観光需要と呼ばない
- 航空・JR旅客を観光客数と呼ばない
- 施設数と客室数を同一Y軸に載せない
- 速報値と確定値を無注記で混在させない
- 調査対象変更を跨いで線を無条件に接続しない
- 観光入込客統計の欠測を0として扱わない
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

- primary/secondary全指標で人泊/人、対象施設、速報/確定、年を確認できる
- total/foreign/Japaneseに二重計上がない
- 居住者側旅行行動と目的地側観光需要が分離される
- 施設数・客室数・稼働率の単位と分母を確認できる
- 2010年・2026年の調査変更を跨ぐ表示に注記または切断がある
- 対象テーマの`no-selection / dup-sortorder / primary-orphan`が0
- R2 push / deployを行っていない

## 採用決定

**PR-0のscope・系列監査後に実装可能。目的地側の宿泊需要を主責務とし、住民旅行行動と交通量を分離する。全体宿泊者数と外国人宿泊者数の包含関係を修正し、観光消費は47県比較可能な場合だけ追加する。**
