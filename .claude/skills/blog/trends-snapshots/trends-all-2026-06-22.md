---
date: 2026-06-22
source: all (google-trends / gsc / hatena / google-news / yahoo / note)
generated_at: 2026-06-22T10:00:00+09:00
total_collected: 68
total_filtered: 13
candidates: 6
cross_source_hits: 2
---

# トレンドスナップショット 2026-06-22

## Phase 1: 収集サマリー

| ソース | 収集数 | 主要キーワード |
|---|---|---|
| google-trends | 10 | 台風7号(10000+), 日産スタジアムPV(5000+), 福岡天気(1000+), 炎上(500+), 京成線(200+), ドーハの悲劇(200+), 大津祐樹(200+) |
| hatena | 14 | 日立裁量労働制(250bm), 1日の歩数地域差(193bm), Claude Code(243bm), 高市内閣支持(177bm), 鶴の恩返し(207bm), 預金相続首都圏集中(86bm), コンビニより多い歯科医が減少(23bm) |
| google-news | 15 | 台風7号, 梅雨前線, 女性皇族, 食品消費税世論調査, 円安/物価高/日銀利上げ, AI研究者転職 |
| yahoo | 12 | 米イラン, 内閣支持率最低, 6月猛暑日地点, 年金支給額増も生活苦, スキマバイト, 独身偽装, 大谷, W杯 |
| note | 7 | 持続可能性スコア47都道府県, 転入者数ランキング, 財政力と借金ギャップ, 合計特殊出生率, 健康寿命, 学級規模 |
| gsc | 3 | マヨネーズ消費量都道府県(急上昇+786%表示増), 生活費ランキング都道府県(新規3clicks), カツオ漁獲量(表示急増+1567%) |

## Phase 2: フィルタリング

### 除外 (55件)

- **スポーツイベント**: W杯・大谷翔平・ドーハの悲劇・日産スタジアムPV
- **芸能人個人**: 大津祐樹・梶裕貴・鶴の恩返し（個人エッセイ）
- **事件・事故速報**: 温泉5歳不明・神戸遺体・旭川事件
- **海外ニュース**: 米イラン・ロシア/ウクライナ・スターマー退任・中国新法・G7
- **テック製品リリース**: iOS27/macOS27
- **気象速報（統計化困難）**: 台風7号進路（現在進行中）
- **個人エッセイ・技術記事**: Claude Code記事・LaTeX記事・将棋定跡生成
- **エンタメ・ゲーム**: ゲームと時間
- **言語不明**: 날씨（韓国語）
- **重複 (既存記事あり)**: カツオ漁獲量（2本）・出生率（3本）・猛暑日（temperature-extremes-map）・労働時間（working-hours-overtime-gap）・生活費ランキング（consumer-price-regional-gap）・降水量（2本）

### 採用 (13件)

歯科医院数減少、歩数地域差、預金首都圏集中、年金支給額格差、物価高（食料費特化）、マヨネーズ消費量(quantity)、財政力格差、健康寿命、最低賃金、スキマバイト、女性皇族身分（社会インパクト大）、食品消費税世論、障害福祉不正受給

## Phase 3: クロスソースヒット（3ソース以上）

| キーワード | ソース | 共通点 |
|---|---|---|
| **物価高・円安・生活費上昇** | google-news + yahoo-business + hatena-economics | 3ソース：日銀利上げ観測・食品値上がり・円安が同時進行 |
| **台風・梅雨・大雨** | google-trends + google-news + yahoo-domestic | 3ソース：気象速報は除外、年間降水量記事2本あり → 除外 |

## Phase 4: 重複チェック結果

| 候補テーマ | 既存記事スラッグ | 判定 |
|---|---|---|
| カツオ漁獲量 | `bonito-catch-prefecture`, `bonito-catch-zero-prefectures-gap` | ❌ 重複2本 → 除外 |
| 生活費・物価ランキング | `consumer-price-regional-gap`, `cpi-change-regional-pattern` | ⚠️ 差別化要：費目特化なら可 |
| 猛暑日・気温 | `temperature-extremes-map` | ❌ 重複 → 除外 |
| 出生率 | `fertility-fiscal-nexus`, `total-fertility-rate`, `fertility-rate-prefecture-gap` | ❌ 過飽和(3本) → 除外 |
| 降水量 | `annual-precipitation-rainy-season-gap`, `precipitation-snow-regional-gap` | ❌ 重複2本 → 除外 |
| 労働時間 | `working-hours-overtime-gap` | ⚠️ 差別化要：裁量労働制×職種角度 |
| マヨネーズ | `mayonnaise-consumption-expenditure` | ⚠️ 差別化要：量(quantity)は未記事 |
| スポーツ参加率 | `sports-participation-map`, `sports-urban-paradox`, `sports-facility-regional-divide` | ⚠️ ウォーキング特化なら可 |
| 預金残高 | `bank-deposit-balance-shikoku-anomaly` | ⚠️ 差別化可：相続×首都圏集中角度 |
| 歯科医院数 | `dentist-income-prefecture-gap`, `dental-hygienist-income-prefecture-gap` | ✅ 院数はなし（所得記事のみ） |
| 年金受給格差 | なし | ✅ 未記事 |
| 歩数地域差 | なし（スポーツ全般3本） | ✅ ウォーキング特化は未記事 |

---

## Phase 5: 候補一覧

---

### 🔴 候補 1: 歯科医院数の都道府県格差（最優先）

**ソース**: hatena-social (23bm)「コンビニより多い歯科医が減少」 + nikkei記事  
**クロスソースヒット**: なし（はてブのみ、ただしニュース発信元は日経）  
**カテゴリ**: `socialsecurity`  
**マッチ度**: ★★★  
**対応 metric**: `dental-clinic-count-per-100k` (10万人あたり歯科診療所数)  
**重複チェック**: なし（歯科系既存2本は「所得」系）

**タイトル案**:
1. 「コンビニより多いと言われた歯科医院が減少中｜10万人あたり最多・最少はどの県？」（curiosity gap: 「減少している」のに知らない人が多い）
2. 「歯科医院数ランキング｜東京が多くて地方が少ない？意外な逆転に隠れた訪問歯科の現実」
3. 「人口10万人あたり歯科医院数が最も多い県・最も少ない県｜格差3倍の構造とは」

**チャート推奨**:
- 上位5 + 下位5 横棒（カード型columns）
- タイルグリッドマップ（地理的分布）

**次のアクション**:
```
/draft-from-trend --metric dental-clinic-count-per-100k
```

**メモ**: 「コンビニより多い歯科医が減少」というはてな記事の文脈で、「では都道府県でどれだけ格差があるか」への答えになる。所得の記事2本とは完全に差別化。

---

### 🔴 候補 2: 年金受給額の都道府県格差（最優先）

**ソース**: yahoo-business「年金支給額増も生活苦 受給者から嘆き」  
**クロスソースヒット**: なし  
**カテゴリ**: `socialsecurity`  
**マッチ度**: ★★★  
**対応 metric**: `pension-benefit-total`（老齢年金受給権者数・給付総額）、`national-pension-payment-rate`（国民年金保険料納付率）  
**重複チェック**: なし（年金系の既存記事ゼロ）

**タイトル案**:
1. 「年金支給額が増えても生活苦が続く理由｜都道府県別受給額ランキングで見る格差」
2. 「国民年金の未納率が高い県・低い県｜老後資産格差の真因は保険料収納率にあった」
3. 「老後の年金はどの県が多い？受給総額と1人あたりで順位が変わる47都道府県」

**チャート推奨**:
- 上位5 + 下位5 横棒（カード型columns）
- 散布図: 年金受給額 × 物価差（生活苦の構造）

**次のアクション**:
```
/draft-from-trend --metric pension-benefit-total
```

**メモ**: Yahoo経済のニュースタイトルが「支給額増も生活苦」というcuriosity gapそのもの。記事の冒頭セットアップに使える。国民年金納付率（`national-pension-payment-rate`）と組み合わせると深みが出る。

---

### 🟠 候補 3: 預金の首都圏集中（相続で地方資金が流出）

**ソース**: hatena-social (86bm)「預金相続首都圏集中」  
**クロスソースヒット**: なし（はてブのみ）  
**カテゴリ**: `economy`  
**マッチ度**: ★★★  
**対応 metric**: `bank-deposit-balance-per-person`（銀行預金残高/人口）、`bank-personal-deposit`（個人預金残高）  
**重複チェック**: 既存 `bank-deposit-balance-shikoku-anomaly`（四国の異常高値・謎解き角度） → **差別化可能**

**差別化角度**: 既存記事は「なぜ徳島が東京を抜くのか（四国の謎）」という角度。今回は「首都圏への一極集中・相続による地方からの資金流出」という逆の問いかけ。

**タイトル案**:
1. 「相続のたびに地方の預金が首都圏へ流れる──都道府県別一人あたり預金残高ランキングで見る資産の東京一極集中」
2. 「地方は預金が少ない？首都圏が多い？意外にも徳島・長野が上位に入る預金残高マップ」
3. 「預金残高ランキング｜なぜ都市部が高くて地方が低いのか──相続と人口移動が生む格差の構造」

**チャート推奨**:
- 上位5 + 下位5 横棒（カード型columns）
- タイルグリッドマップ

**次のアクション**:
```
/draft-from-trend --metric bank-deposit-balance-per-person
```

**注意**: `bank-deposit-balance-shikoku-anomaly`との重複を避けるため、「四国の異常値」については触れるが主テーマは「首都圏集中・相続フロー」に置く。

---

### 🟠 候補 4: ウォーキング行動者率の都道府県格差

**ソース**: hatena (193bm)「1日の歩数に2倍近い地域差──150万人スマホデータ解析（東大など）」  
**クロスソースヒット**: なし（はてブのみ、ただし高bm）  
**カテゴリ**: `educationsports`  
**マッチ度**: ★★☆（スマホ歩数データはe-Stat外。ウォーキング参加率は代替指標）  
**対応 metric**: `sports-participation-rate-walking`（ウォーキング・軽い体操の行動者率）  
**重複チェック**: 既存 `sports-participation-map`, `sports-urban-paradox`, `sports-facility-regional-divide` → **スポーツ全般。ウォーキング特化は未記事**

**差別化角度**: NHKのスマホデータ分析（県別歩数2倍差）をフックに、e-Stat「ウォーキング行動者率」で同様の格差を実証する。「スマホが言ったことを統計で確認する」という検証記事の形。

**タイトル案**:
1. 「1日の歩数に2倍近い地域差──e-Stat「ウォーキング行動者率」でも確認できた都道府県格差の正体」
2. 「ウォーキングを続けている人が多い県・少ない県｜行動者率ランキングで見る運動格差」
3. 「なぜ地方の人ほど歩く？都市vs地方のウォーキング行動者率格差とその構造」

**チャート推奨**:
- 上位5 + 下位5 横棒（カード型columns）
- タイルグリッドマップ

**次のアクション**:
```
/draft-from-trend --metric sports-participation-rate-walking
```

**注意**: スポーツ系の既存3本と重複しないよう、タイトル・description でウォーキング特化・健康行動に絞る。

---

### 🟡 候補 5: 物価高・食料費の都道府県格差（食料費特化・差別化）

**ソース**: クロスソースヒット（google-news + yahoo-business + hatena-economics 3ソース）  
**クロスソースヒット**: **あり（3ソース一致）**  
**カテゴリ**: `economy`  
**マッチ度**: ★★★  
**対応 metric**: `consumer-price-difference-index-food`（消費者物価地域差指数・食料）、`consumer-price-difference-index-housing`（住居）、`consumer-price-difference-index-overall`（総合）  
**重複チェック**: 既存 `consumer-price-regional-gap`（総合・全費目）、`cpi-change-regional-pattern`（変化率） → **費目特化なら差別化可能**

**差別化角度**: 既存記事は「総合的な物価格差」。今回は「物価高・円安局面で最も打撃を受けている費目はどれか」「食料費・光熱費に絞った格差」という現時点の経済ニュースに直結する切り口。

**タイトル案**:
1. 「物価高の痛みは県によって違う──食料費が最も高い県・安い県、光熱費格差の構造」
2. 「食料費ランキング｜物価高で苦しい県はどこ？消費者物価地域差指数が示す47都道府県の実態」
3. 「円安で食料品が値上がり──都道府県別の食料費格差は最大1.X倍、なぜ大都市ほど高くない？」

**チャート推奨**:
- 上位5 + 下位5 横棒（食料費）
- 散布図: 食料費 × 住居費（費目間の相関）

**次のアクション**:
```
/draft-from-trend --metric consumer-price-difference-index-food
```

**注意**: 既存2記事と必ず差別化する（description・タイトルに「食料費特化」を明記し `consumer-price-regional-gap` への内部リンクを本文中に配置）。

---

### 🟡 候補 6: マヨネーズ消費量ランキング（数量版・GSC急上昇）

**ソース**: GSC急上昇（「マヨネーズ消費量 都道府県」clicks:5, +786%表示急増）  
**クロスソースヒット**: なし（GSCのみ）  
**カテゴリ**: `economy`（家計調査）  
**マッチ度**: ★★★（`mayonnaise-consumption-quantity` データあり）  
**重複チェック**: 既存 `mayonnaise-consumption-expenditure`（支出額ベース）→ **消費量（量/kg）は未記事**

**差別化角度**: 既存記事は「家計あたりの支出額」。`mayonnaise-consumption-quantity` は「購入量（g・ml等）」。支出と量では価格差が絡むため県別順位が変わる。「同じマヨネーズでも、安く大量に買う県と少量を高く買う県」という新しい切り口。

**タイトル案**:
1. 「マヨネーズの消費量トップはなぜ東北・地方が多い？──家計あたり購入量ランキングで見る地域差」
2. 「マヨネーズをいちばん食べる県・食べない県──消費量ランキングで見える日本の食文化格差」
3. 「マヨラー1位の県は？購入量ランキング｜支出額と量で順位が変わる意外な結果」

**チャート推奨**:
- 上位5 + 下位5 横棒（カード型columns）

**次のアクション**:
```
/draft-from-trend --metric mayonnaise-consumption-quantity
```

**注意**: 既存 `mayonnaise-consumption-expenditure` へ内部リンクを入れ、「支出額ランキングと比較すると…」という導線を作る。GSCの急上昇は実需要の直接証拠なので、完成後は /ranking/mayonnaise-consumption-quantity へのブログ誘導を強化。

---

## Phase 6: サマリー

### 今日の上位トレンド（採用候補）

| 優先度 | テーマ | データkey | 推奨アクション |
|---|---|---|---|
| 🔴 最優先 | 歯科医院数の都道府県格差 | `dental-clinic-count-per-100k` | 即執筆可 |
| 🔴 最優先 | 年金受給額の都道府県格差 | `pension-benefit-total` | 即執筆可 |
| 🟠 高優先 | 預金の首都圏集中（相続×流出） | `bank-deposit-balance-per-person` | 既存記事との差別化を確認 |
| 🟠 高優先 | ウォーキング行動者率格差 | `sports-participation-rate-walking` | スポーツ3本との差別化を確認 |
| 🟡 中優先 | 物価高・食料費格差（費目特化） | `consumer-price-difference-index-food` | 既存2本との差別化必須 |
| 🟡 中優先 | マヨネーズ消費量ランキング（量） | `mayonnaise-consumption-quantity` | GSC急上昇・既存expenditure記事との差別化 |

### クロスソースヒット

- **物価高・円安・生活費** (google-news + yahoo + hatena): 3ソース → 「食料費特化」角度で書けば差別化可能
- **台風・梅雨・大雨** (3ソース): 降水量記事2本あり → 今回は除外

### 除外したトピック（記録用）

- **カツオ漁獲量**: GSC表示急増だが記事2本あり → 既存記事SEO強化を推奨
- **出生率**: 3本あり（過飽和）
- **労働時間・残業**: `working-hours-overtime-gap` あり
- **猛暑日**: `temperature-extremes-map` あり  
- **降水量**: 2本あり
- **生活費ランキング（総合）**: `consumer-price-regional-gap` あり

### GSC コンテンツギャップ（即対応推奨）

- 「カツオ漁獲量 ランキング」: +1567%表示急増 → 既存2本をGSCで強化（タイトルBrushup候補）
- 「マヨネーズ消費量 都道府県」: +786%表示急増, clicks:5 → **消費量(quantity)記事新規作成が最効率**
- 「生活費ランキング 都道府県」: 新規3clicks → 既存`consumer-price-regional-gap`へのSEO流入（Brushup候補）

### 推奨実行順序（今週）

1. `/draft-from-trend --metric dental-clinic-count-per-100k` （歯科医院数）
2. `/draft-from-trend --metric pension-benefit-total` （年金受給額）
3. `/draft-from-trend --metric mayonnaise-consumption-quantity` （マヨネーズ消費量・GSC急上昇で即効性高）
