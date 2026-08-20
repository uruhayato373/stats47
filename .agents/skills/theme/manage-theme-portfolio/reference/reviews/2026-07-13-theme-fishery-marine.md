---
type: theme-catalog-review
date: 2026-07-13
status: ready-after-scope-series-and-coverage-audit
theme: fishery-marine
tags: [theme-catalog, fishery, aquaculture, inland-fishery, fishery-census, fishing-ports]
---

# テーマレビュー: fishery-marine（漁業・水産業）

## 結論

主問は、**その都道府県の水産業が、海面漁業・海面養殖・内水面漁業・内水面養殖のどこで生産量と産出額を生み、担い手と生産基盤がどう変化しているか**とする。

読み順は次の4層に分ける。

1. **生産規模**: 漁獲量と養殖収獲量。海面・内水面を分離
2. **経済価値**: 漁業・養殖業産出額。量と価格の違いを明示
3. **生産構成**: 漁業/養殖、主要魚種、地域別の構成
4. **担い手・基盤**: 漁業経営体、漁業就業者、漁港。調査周期と対象範囲を明示

漁獲量の減少だけから資源量、漁業経営、地域経済の悪化を断定しない。漁獲量は資源状態だけでなく、漁獲可能量、操業、海況、魚価、対象魚種、調査範囲の影響を受ける。また「捕る漁業から育てる漁業へ移行した」という結論は、漁獲と養殖の構成比を同一scope・同一年で確認できた場合だけ用いる。

## P0: 対象範囲・系列監査

実装前に次を確定する。

- `fish-catch` が海面漁業漁獲量と内水面漁業漁獲量の合計か、各年・47県で加法整合するか
- `aquaculture-harvest` が海面養殖と内水面養殖の合計か、種苗養殖等の対象除外を含め加法整合するか
- 「漁獲量」は天然採捕、「収獲量」は養殖という公式用語をUIで維持すること
- 海面漁業の都道府県帰属が漁場所在地、経営体所在地、水揚港所在地のどれか
- 内陸県の海面漁業・海面養殖・海面産出額が対象外なのか真の0なのか
- 内水面漁業生産統計の調査河川・湖沼、対象魚種、推計方法の年次変更
- 2024年に内水面漁獲統計の調査範囲が142河川・21湖沼へ変更された系列断層
- 2024年に内水面養殖の調査対象魚種からうなぎが除外されたこと
- `marine-fishery-aquaculture-output-value`、`marine-fishery-output-value`、`fishery-output-value` の包含関係・系列変更・2016/2017接続可否
- 産出額が名目額であり、価格変動を含むこと。生産量の代理にしないこと
- `fishery-workers` の1975〜2003年年次値と2008年以降5年周期値の資料源・定義が連続するか
- 漁業就業者が海面漁業就業者か、内水面・養殖を含むか、年齢・就業日数等の定義
- 2023年漁業センサスと過去年の調査対象・定義変更、震災等による比較上の注意
- 魚種別12指標が2015年で止まり、現在値ではなく長期参考であること
- 魚種別データが海面漁業の漁獲のみで、養殖収獲を含まないこと
- 全国魚種構成chartが選択都道府県の構成と誤認されないこと
- `fishing-port-count` と `fishing-port-count-ksj` が同じ2006年C09を参照しながら集計値が異なる原因
- 水産庁の最新指定漁港数と2006年国土数値情報を同一の現在値として扱わないこと
- 欠測・対象外・秘匿を0としてランキング最下位にしないこと

## 公式根拠

### 農林水産省「海面漁業生産統計調査」

- URL: https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/
- 海面漁業の漁業種類別・魚種別漁獲量、海面養殖業の魚種別収獲量の中心出典
- 第1報と確報、訂正、推計、都道府県への計上方法を確認する

### 農林水産省「海面漁業生産統計調査の概要」

- URL: https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/gaiyou/index.html
- 調査対象、調査方法、集計・推計方法、用語、利用上の注意の根拠
- 水揚機関・漁業経営体・行政記録等を用いるため、単純な漁港水揚量とは限らない

### 農林水産省「内水面漁業生産統計調査」

- URL: https://www.maff.go.jp/j/tokei/kouhyou/naisui_gyosei/
- 内水面漁業・養殖業の魚種別漁獲・収獲量の中心出典
- URL: https://www.maff.go.jp/j/tokei/kouhyou/naisui_gyosei/gaiyou/index.html
- 2024年の調査河川・湖沼と養殖対象魚種の変更を時系列注記へ反映する

### 農林水産省「漁業センサス」

- URL: https://www.maff.go.jp/j/tokei/census/fc/about/index.html
- 海面漁業の生産・就業構造、漁村、流通・加工、内水面漁業を5年ごとに把握する中心出典
- URL: https://www.maff.go.jp/j/tokei/census/fc/2023fc/gaiyou.html
- 2023年調査の対象、単位、用語を過去センサスと突合する

### 農林水産省「漁業産出額」

- URL: https://www.maff.go.jp/j/tokei/kouhyou/gyogyou_seigaku/
- 海面漁業・養殖業等の産出額の中心出典
- 生産量と産地価格等から算出される名目額として扱い、数量系列と分離する

### 水産庁「漁港一覧」

- URL: https://www.jfa.maff.go.jp/j/gyoko_gyozyo/g_zyoho_bako/gyoko_itiran/sub81.html
- 漁港漁場整備法に基づく指定漁港の最新総括・都道府県別一覧の正本候補
- 2006年国土数値情報はGIS位置情報のsnapshotとして別管理する

### 水産庁「水産白書・都道府県別生産量及び産出額」

- URL: https://www.jfa.maff.go.jp/j/kikaku/wpaper/r06_h/sankou/sankou_2_5.html
- 海面漁業・海面養殖・内水面の生産量と産出額を都道府県別に俯瞰する公式資料
- 海面養殖業の生産量・産出額に種苗養殖が含まれない等のscopeを確認する

## テーマ境界

| テーマ | 責務 |
|---|---|
| `fishery-marine` | 漁業・養殖業の生産、産出額、担い手、生産基盤 |
| `ports` | 港湾法上の港湾、貨物・旅客・貿易。漁港と制度・用途を区別 |
| `local-economy` | 水産業を含む県内総生産・産業構造。漁業産出額との概念差を説明 |
| `labor-wages` | 全産業の雇用・賃金。漁業就業者の詳細は本テーマ |
| `climate` | 海水温・気候。漁獲変動との相関を因果と断定しない |
| `tourism` | 遊漁・海業・観光。商業漁業生産と分離 |

## 現行指標の提案

| rankingKey | 現行 role | 提案 | 理由 |
|---|---|---|---|
| `fish-catch` | primary | **primary keep / 定義明記** | 漁獲規模の中心。海面+内水面の合計整合を監査 |
| `marine-fishery-catch` | secondary | **primaryへ変更** | 水産生産の中心で、内水面とのscope差を明確化できる |
| `inland-fishery-catch` | secondary | **secondary keep / 別section** | 海面と対象・調査範囲が異なり、単純積上げに注意 |
| `fishing-port-count` | context | **最新水産庁系列へ置換候補** | 名称は水産庁だが実体は2006年国土数値情報で、重複指標と値が不一致 |
| `fishing-port-count-ksj` | context | **GIS contextへ限定** | 2006年位置情報snapshot。現在の指定漁港数として使わない |
| `aquaculture-harvest` | secondary | **primaryへ変更** | 「育てる漁業」の生産規模。海面+内水面の包含関係を確認 |
| `marine-aquaculture-harvest` | secondary | **secondary keep** | 海面養殖の中心。種苗養殖等の除外を明記 |
| `inland-aquaculture-harvest` | secondary | **secondary keep / 別section** | 対象魚種変更による断層を注記 |
| `marine-fishery-aquaculture-output-value` | primary | **primary keep** | 最新の海面漁業・養殖業の経済規模。沿岸県のみのcoverageを明記 |
| `marine-fishery-output-value` | secondary | **secondary keep** | 捕る漁業の産出額。養殖産出額と排他的に比較可能か監査 |
| `fishery-output-value` | context | **historical contextへ限定** | 2016年終了の旧系列。新系列へ無条件接続しない |
| `fishery-workers` | primary | **secondaryへ変更** | 担い手として重要だが5年周期・定義断層があり、生産KPIと同列の現在値には注意 |
| `fishery-species-catch-scallop` | secondary | **historical contextへ変更** | 2015年まで。現在の主要魚種として表示しない |
| `fishery-species-catch-japanese-squid` | secondary | **historical contextへ変更** | 同上 |
| `fishery-species-catch-tuna` | secondary | **historical contextへ変更** | 同上。水揚港・都道府県帰属の意味を確認 |
| `fishery-species-catch-bonito` | secondary | **historical contextへ変更** | 同上 |
| 残り魚種別8指標 | context | **historical context keep** | 長期参考として価値はあるが、2015年値で現在を代表しない |
| 海面養殖業産出額 | なし | **secondary追加候補** | 海面漁業産出額と分け、「捕る/育てる」の経済構成を示す |
| 漁業経営体数 | なし | **secondary追加候補** | 就業者数と合わせて生産構造を説明。5年周期を明記 |
| 漁業就業者の年齢構成 | なし | **追加候補** | 担い手問題を総数だけでなく高齢化・新規就業の観点から示す |

## 現行チャートの提案

| componentKey | 提案 | 理由 / 実装 |
|---|---|---|
| `theme-fishery-catch-trend` | **revise** | 合計とその内数の海面を並べるため、海面・内水面の排他的系列か、合計単独へ変更 |
| `theme-fishery-aquaculture-mix` | **2panelへ変更** | 海面と内水面は同じトンでも規模差が大きく、二軸mixedは構成を誤読しやすい |
| `theme-fishery-output-trend` | **remove / 系列分離** | 新系列の海面漁業+養殖と長期の海面漁業のみを同列接続すると包含範囲が異なる |
| `theme-fishery-half-century` | **2panel / index化検討** | トンと人を同一Y軸lineに置かない。原数2panelか基準年指数を使用 |
| `theme-fishery-species-share` | **replace / 最新化** | 2015年全国構成は都道府県テーマの現在値に答えない。最新年・選択県へ変更できる場合のみ採用 |
| `theme-fishery-species-trend` | **historical contextへ移動** | 1956〜2015年全国線で選択県ではない。4系列の可読性と調査区分を確認 |

### 追加チャート

1. **海面漁獲・海面養殖の推移**: 排他的な2系列を同一単位で比較し、内水面は別panelにする。
2. **生産量構成**: 海面漁獲、海面養殖、内水面漁獲、内水面養殖が同一年・同scopeで加法可能な場合のみ。
3. **海面漁業・海面養殖産出額**: 排他的系列が取得できる場合の構成と推移。
4. **漁業就業者・経営体数**: 5年ごとの点として表示し、年次補間しない。
5. **就業者年齢構成**: 最新センサスと前回比較。定義が揃う場合のみ。
6. **最新魚種構成**: 選択県の海面漁業漁獲量。養殖魚種を混ぜない。
7. **漁港**: 最新指定漁港数のKPIと、2006年GIS位置情報を別表示。

## 推奨表示順

1. 海面漁業漁獲量
2. 海面養殖業収獲量
3. 海面漁業・養殖業産出額
4. 漁獲/養殖の構成と推移
5. 内水面漁業・養殖業（別section）
6. 魚種別構成
7. 漁業就業者・経営体
8. 漁港・生産基盤
9. 長期参考系列
10. 定義 / FAQ
11. 全指標

## 不採用・保留

| 候補 | 判定 | 理由 / 再検討条件 |
|---|---|---|
| 漁獲量の減少=水産資源量の同率減少 | 不採用 | 操業、規制、海況、魚種構成等を含み資源量そのものではない |
| 漁獲+養殖をすべて「漁獲量」と呼ぶ | 不採用 | 公式統計は漁獲量と養殖収獲量を区別する |
| 合計と海面漁獲量を排他的2系列として積上げ | 不採用 | 合計が海面を内包する場合は二重計上になる |
| 海面と内水面の対象外を0として全国47県順位化 | 不採用 | 非該当と生産0を区別できない |
| 旧産出額系列と新系列を一本のlineで接続 | 不採用 | 海面漁業・養殖の包含範囲と系列定義が異なる |
| 漁獲量と就業者数を同一Y軸で表示 | 不採用 | 単位・桁が異なる |
| 2015年魚種構成を現在の構成として表示 | 不採用 | 鮮度不足で資源・漁獲構造の変化を反映しない |
| 全国魚種構成を選択県の構成として表示 | 不採用 | 地理scopeが異なる |
| 漁港数が多い=水産業が強い | 不採用 | 港の種類・規模・利用・生産量を反映しない |
| 2006年KSJ漁港数を最新指定漁港数と表示 | 不採用 | snapshotが古く、水産庁最新一覧と一致しない |
| 捕る漁業から育てる漁業へ一律移行 | 保留 | 同一scopeの構成比と長期変化を県別に確認できる場合のみ |

## Claude Code実装指示

### PR-0: scope・系列・coverage監査

1. 現行24指標と6chartの元表、調査、地理scope、対象、単位、年、速報/確報を一覧化
2. `fish-catch = marine + inland`、`aquaculture-harvest = marine + inland` を47県×全年で検証
3. 海面生産の都道府県帰属、内陸県の対象外表現、種苗養殖等の除外をmetadataへ記録
4. 旧・新産出額3系列の包含関係と2016/2017境界を公式表で確認
5. 漁業就業者の資料源・定義・年次から5年周期への切替を監査し、補間を禁止
6. 魚種別12指標のcoverage、2015年終了理由、海面漁業のみであることを確認
7. 2024年内水面調査の河川・湖沼・魚種変更をseries breakへ記録
8. 2つの2006年漁港指標が288/244等で不一致となる集計ロジックを追跡
9. 水産庁最新指定漁港一覧の47県集計を新規metric候補として指標バックログへ記録
10. 欠測・対象外・秘匿・0をfixtureで区別する

### PR-1: ThemeCatalog再構成

編集SSOT: `packages/data-configs/src/theme-catalog/fishery-marine.ts`

1. 海面漁業・海面養殖・内水面・産出額・魚種・担い手・漁港・長期参考へsectionを整理
2. 海面漁獲量、養殖収獲量、海面漁業・養殖業産出額をprimary候補とし、公式根拠付き`selection`を追加
3. 合計と内数を排他的系列として並べず、加法監査済み系列だけで構成chartを作る
4. 旧・新産出額を別chart・別sectionへ分離し、境界を注記
5. 漁獲量と就業者数を2panelへ分割し、5年周期の点を年次線へ補間しない
6. 2015年魚種指標をhistorical contextへ下げ、全国chartを選択県chartと明確に分離
7. 漁港重複指標を整理し、最新水産庁件数と2006年GISを別概念として表示
8. `sourceLink/rankingLink/relatedRankingKeys`を補完し、section内`sortOrder`を一意化
9. guidance/FAQへ漁獲/収獲、海面/内水面、量/産出額、対象外/0の違いを追加
10. 不採用候補を`rejectedCandidates`へ記録

### 禁止

- 漁獲量と養殖収獲量を同じ用語へ統合しない
- 合計と内数を積み上げて二重計上しない
- 海面・内水面・養殖の調査範囲を無注記で混ぜない
- 対象外・欠測・秘匿を0としてランキング化しない
- 旧産出額と新産出額を無条件に接続しない
- 数量と金額、数量と就業者数を同一Y軸に置かない
- 5年周期の漁業センサス値を年次補間しない
- 2015年全国魚種構成を現在の都道府県構成と呼ばない
- 2006年KSJ漁港数を最新値と呼ばない
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

- primary/secondary全指標で調査、地理scope、対象、単位、年を確認できる
- 合計と海面・内水面内訳の加法整合または非整合理由を確認できる
- 漁獲量と養殖収獲量、数量と産出額がUI上で区別される
- 旧・新産出額系列が接続されず、包含関係を確認できる
- 漁業就業者の5年周期値が補間されない
- 対象外・欠測・秘匿・0が区別される
- 漁港の最新行政件数と2006年GIS snapshotが区別される
- 対象テーマの`no-selection / dup-sortorder / primary-orphan`が0
- R2 push / deployを行っていない

## 採用決定

**PR-0のscope・系列・coverage監査後に実装可能。海面漁業、海面養殖、内水面を分離し、生産量・産出額・担い手・基盤の順に構成する。合計と内数、旧系列と新系列、対象外と0を厳密に区別し、2015年魚種データと2006年漁港GISは長期・空間contextへ限定する。**
