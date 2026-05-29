---
type: blog-plan
date: 2026-05-29
updated: 2026-05-29
count: 30
axes: [gsc, affiliate, trend]
status: draft
note: トピック dedup 済
---

# クラウド環境ブログ企画 30 本 (2026-05-29)

環境制約により DB query 不可。指標は `packages/data-configs/src/metrics/*.ts` (実在 key を検証済)、
需要は GSC 2026-W21 queries.csv、トレンドははてブ hotentry RSS、affiliate は `plan-blog-affiliate` の
8 カテゴリマッピングを入力に企画。全 target metric key は file 実在を確認済、全 slug は既存 198 記事と非重複。

curiosity-gap パターン (`.claude/rules/blog-quality-standards.md`): なぜ / 意外 / 唯一 / 真因 / vs / ? / → を使用。
「X倍格差」単独 sensationalism は禁止のため使わない。

---

## A. GSC 需要起点 (12 本)

GSC で impressions があるが専用記事が薄い / 無いクエリに対応。impressions・position は 2026-W21 queries.csv 実測。

### A1. public-phone-prefecture-vanishing
- title: なぜ北海道だけ公衆電話が突出して多いのか？消えゆくインフラの県別地図
- target metric: `public-phone-count` (ict)
- category: ict
- description 骨子: 「スマホ時代に公衆電話の数を気にする人がいる」──GSC で最大 imp を集める意外な検索需要から、災害インフラとしての残存数を読み解く
- GSC 根拠: 「北海道にある公衆電話の数」237 imp / pos 4.97、関連 query 群合計 600+ imp。専用 blog 記事なし (ranking のみ)
- 内部リンク: /ranking/public-phone-count, /areas/01000, /blog/post-office-last-window, /category/ict

### A2. curry-roux-consumption-east-west-divide
- title: カレールウを最も使う県はどこ？国民食に潜む意外な地域の味覚差
- target metric: `curry-roux-consumption-quantity` (economy)
- category: economy
- description 骨子: 「同じ国民食でも家庭のカレー頻度が県で違う」──カレールウ消費量から食卓の地域性と味覚の境界を描く
- GSC 根拠: 「カレー 消費量 都道府県」「カレールウ ランキング」系で imp あり、専用 blog 記事なし (ranking のみ)
- 内部リンク: /ranking/curry-roux-consumption-quantity, /blog/food-culture-prefecture-map, /blog/food-consumption-prefecture-battle, /category/economy

### A3. chicken-pork-meat-preference-divide
- title: 鶏肉 vs 豚肉、あなたの県はどっち派？意外な肉食文化の境界線
- target metric: `chicken-consumption-expenditure` (economy), `pork-consumption-quantity` (economy)
- category: economy
- description 骨子: 「鍋に入れる肉が県で変わる」──鶏と豚の消費量対比で食卓の地域性を可視化
- GSC 根拠: 「鶏肉消費量 ランキング」53 imp、「鶏肉 消費量 都道府県」28 imp、「豚肉 消費量 都道府県」17 imp
- 内部リンク: /ranking/chicken-consumption-expenditure, /blog/chicken-consumption-prefecture-gap, /blog/food-culture-prefecture-map, /category/economy

### A4. natto-consumption-east-west-divide
- title: 納豆を食べる県・食べない県の境界はどこ？真因は江戸期の食習慣
- target metric: `natto-consumption-expenditure` (economy)
- category: economy
- description 骨子: 「納豆が苦手な県が西日本に固まる」──消費量データで食文化の歴史的境界を探る
- GSC 根拠: 「納豆 消費量 都道府県」51 imp、「納豆消費量 ランキング」29 imp、「納豆消費量 ランキング 最新」27 imp
- 内部リンク: /ranking/natto-consumption-expenditure, /blog/food-trio-prefecture-map, /blog/food-consumption-prefecture-battle, /category/economy

### A5. squid-octopus-coastal-diet-map
- title: イカとタコ、どちらをよく食べる県？海産物消費に潜む east-west の境界
- target metric: `squid-consumption-expenditure` (economy), `octopus-consumption-expenditure` (economy)
- category: economy
- description 骨子: 「同じ海の幸でもイカ派・タコ派が県で分かれる」──イカとタコの消費支出対比で食文化の地域差を可視化
- GSC 根拠: 「イカ 消費量 都道府県」「たこ 消費量 ランキング」系で imp あり、専用 blog 記事なし (ranking のみ)
- 内部リンク: /ranking/squid-consumption-expenditure, /blog/food-culture-prefecture-map, /blog/fishery-species-prefecture-specialty, /category/economy

### A6. onion-potato-vegetable-staple-map
- title: たまねぎとじゃがいも、最も使う県はどこ？常備野菜に映る食卓の地域性
- target metric: `onion-consumption-quantity` (economy), `potato-consumption-quantity` (economy)
- category: economy
- description 骨子: 「どの家庭にもある常備野菜でも消費量は県で大きく違う」──たまねぎ・じゃがいも消費から日常食の地域差を読む
- GSC 根拠: 「たまねぎ 消費量 都道府県」「じゃがいも 消費量 ランキング」系で imp あり、専用 blog 記事なし (ranking のみ)
- 内部リンク: /ranking/onion-consumption-quantity, /blog/food-consumption-prefecture-battle, /blog/food-culture-prefecture-map, /category/economy

### A7. tofu-soba-udon-staple-divide
- title: 豆腐とそば・うどん、主食級食材の消費で分かる県の食卓
- target metric: `tofu-consumption-quantity` (economy), `fresh-udon-soba-consumption-quantity` (economy)
- category: economy
- description 骨子: 「うどん県・そば県の境界に豆腐消費が重なる意外」──主食級食材の消費構造を可視化
- GSC 根拠: 「豆腐消費量 都道府県」18 imp / pos 6.78、「そば消費量 都道府県 ランキング」20 imp、「うどん消費量ランキング」164 imp
- 内部リンク: /ranking/tofu-consumption-quantity, /blog/fresh-udon-soba-consumption-prefecture-gap, /blog/noodle-consumption-prefecture-character, /category/economy

### A8. general-bed-utilization-pressure-map
- title: 一般病床の利用率が最も高い県は？医療逼迫の地域差を可視化
- target metric: `bed-utilization-rate` (socialsecurity)
- category: socialsecurity
- description 骨子: 「同じ病気でも入院しやすい県・しにくい県がある」──病床利用率から医療アクセスの構造を読む
- GSC 根拠: 「一般病床の病床利用率が最も高い都道府県」62 imp / pos 3.63、関連 query 群 200+ imp で専用 blog なし
- 内部リンク: /ranking/bed-utilization-rate, /blog/hospital-bed-utilization-map, /blog/medical-access-regional-gap, /category/socialsecurity

### A9. inpatient-rate-aging-burden
- title: 入院受療率1位の県はどこ？高齢化と医療需要の真因を探る
- target metric: `inpatient-rate-per-100k` (socialsecurity)
- category: socialsecurity
- description 骨子: 「人口あたり入院者数が西日本で高い」──受療率データから医療需要の地域構造を解く
- GSC 根拠: 「入院 受療率 1位」20 imp / pos 5.0、「受療率 ランキング」19 imp / pos 5.32
- 内部リンク: /ranking/inpatient-rate-per-100k, /blog/inpatient-rate-prefecture-gap, /blog/medical-access-regional-gap, /category/socialsecurity

### A10. schizophrenia-treatment-access-gap
- title: 統合失調症の受療率が高い県はなぜ偏る？精神科医療の地域差
- target metric: `treatment-rate-schizophrenia-outpatient` (socialsecurity)
- category: socialsecurity
- description 骨子: 「精神科の通院率に大きな地域差がある」──統合失調症受療率から精神医療アクセスを読む
- GSC 根拠: 「統合失調症 都道府県 ランキング」29 imp / pos 5.52 (専用記事なし)
- 内部リンク: /ranking/treatment-rate-schizophrenia-outpatient, /blog/suicide-rate-aging-nexus, /blog/medical-access-regional-gap, /category/socialsecurity

### A11. dementia-death-rate-aging-context
- title: 認知症の死亡率が高い県はなぜ偏る？高齢化の先にある地域差
- target metric: `dementia-death-rate` (population)
- category: population
- description 骨子: 「同じ高齢化でも認知症死亡率には明確な地域差がある」──医療体制・年齢構成・診断率と重ねて構造的に読む
- GSC 根拠: 「認知症 死亡率 都道府県」系で imp あり / pos 中位、専用 blog 記事なし (順位向上余地大)
- 内部リンク: /ranking/dementia-death-rate, /blog/aging-rate-akita-vs-okinawa, /blog/suicide-rate-aging-nexus, /category/population

### A12. middle-school-height-east-west-puzzle
- title: 日本で一番背が高い県はどこ？中学生の身長に潜む東北優位の謎
- target metric: `average-height-middle-school-second-grade-male` (educationsports)
- category: educationsports
- description 骨子: 「同じ年齢でも県で身長が数cm違う」──中学生身長データから栄養・遺伝・気候の影響を探る
- GSC 根拠: 「日本で1番身長が高い県はどこですか」52 imp / pos 6.4、「全国平均身長 ランキング」22 imp
- 内部リンク: /ranking/average-height-middle-school-second-grade-male, /blog/child-height-regional-gap, /blog/prefectural-height-male-female-gap, /category/educationsports

---

## B. 収益起点 (10 本)

affiliate 8 カテゴリ (labor=転職 / housing=引越 / population=マッチング / economy=証券 / health=フィットネス /
energy=ウォーターサーバー / tourism=車査定 / furusato=ふるさと納税) に結びつく指標を結合。収益tie-in=有。

### B1. doctor-dentist-pay-regional-gap
- title: 医師・歯科医師の年収は県でどれだけ違う？地方ほど高い意外な逆転
- target metric: `doctor-annual-income` (socialsecurity), `dentist-annual-income` (socialsecurity)
- category: socialsecurity
- description 骨子: 「同じ資格でも住む県で年収が変わる」──医師・歯科医師の賃金差から都市と地方の医療人材市場を読み、転職判断の材料を提示
- affiliate: labor (転職エージェント)。資格職の県間賃金差 → 転職・地方勤務検討の自然な導線
- 内部リンク: /ranking/doctor-annual-income, /blog/medical-access-regional-gap, /blog/occupation-income-gap-pilot-vs-careworker, /category/socialsecurity

### B2. manager-income-career-ceiling
- title: 管理職の年収が最も高い県はどこ？昇進しても報われる地域の条件
- target metric: `manager-annual-income` (laborwage)
- category: laborwage
- description 骨子: 「管理職まで上り詰めても県で年収が大きく変わる」──管理的職業従事者の賃金から昇進の費用対効果とキャリア選択の地域要因を読む
- affiliate: labor (転職エージェント)。賃金天井への関心 → キャリア再考・転職の導線
- 内部リンク: /ranking/manager-annual-income, /blog/job-salary-39-comparison, /blog/wage-vs-living-cost, /category/laborwage

### B3. worker-household-disposable-income-gap
- title: 勤労者世帯の手取りが最も多い県は？可処分所得で見る家計の体力
- target metric: `disposable-income-worker-households` (economy)
- category: economy
- description 骨子: 「年収ではなく実際に使える手取り=可処分所得で県を比べると順位が入れ替わる」──勤労者世帯の可処分所得から家計の余力と資産形成の地域差を読む
- affiliate: economy (証券口座)。手取りの余力への関心 → 資産運用の導線
- 内部リンク: /ranking/disposable-income-worker-households, /blog/savings-rate-gap, /blog/wage-vs-living-cost, /category/economy

### B4. savings-financial-asset-buildup-gap
- title: 貯蓄が貯まる県・貯まらない県の真因は？金融資産の地域差
- target metric: `avg-savings-rate-worker-households` (economy), `financial-assets-balance-multi-person-households` (economy)
- category: economy
- description 骨子: 「所得は同じでも貯蓄に差がつく」──貯蓄率と金融資産から資産形成の地域構造を読む
- affiliate: economy (証券口座)。貯蓄の伸び悩み → 資産運用の導線
- 内部リンク: /ranking/avg-savings-rate-worker-households, /blog/savings-balance-gap, /blog/savings-rate-gap, /category/economy

### B5. owner-dwelling-floor-area-spaciousness
- title: 持ち家が最も広い県はどこ？延べ面積で見る「ゆとりある住まい」の地図
- target metric: `floor-area-per-dwelling-owner` (construction)
- category: construction
- description 骨子: 「同じ持ち家でも県で広さが大きく違う」──持ち家の延べ面積から都市の狭小住宅と地方の広い家の対比を可視化し、住み替え判断の材料を提示
- affiliate: housing (引越し見積もり)。広い家への住み替え検討 → 引越し見積もりの導線
- 内部リンク: /ranking/floor-area-per-dwelling-owner, /blog/housing-cost-livability-trend, /blog/habitable-area-land-use, /category/construction

### B6. elderly-couple-household-old-age-map
- title: 高齢夫婦のみ世帯が最も多い県は？老後の住まいを左右する世帯構造
- target metric: `elderly-couple-only-household-ratio` (population)
- category: population
- description 骨子: 「子と同居しない高齢夫婦世帯が地方で急増」──高齢夫婦のみ世帯の割合から老後の暮らしと住み替えニーズの地域差を読む
- affiliate: housing (引越し見積もり)。老後の住み替え・コンパクト化への関心 → 引越し見積もりの導線
- 内部リンク: /ranking/elderly-couple-only-household-ratio, /blog/aging-solo-living-crisis, /blog/household-structure-transformation, /category/population

### B7. crude-birth-rate-regional-vitality
- title: 粗出生率が最も高い県はどこ？人口の「勢い」を分ける真因
- target metric: `crude-birth-rate` (population)
- category: population
- description 骨子: 「合計特殊出生率とは別物の粗出生率で見ると順位が変わる」──人口千人あたりの出生数から地域の人口活力と出会い・結婚環境を読む
- affiliate: population (マッチングアプリ)。出生・婚姻動向への関心 → 出会い探しの導線
- 内部リンク: /ranking/crude-birth-rate, /blog/fertility-rate-prefecture-gap, /blog/birth-death-gap-decline, /category/population

### B8. household-size-shrink-living-shift
- title: 1世帯あたりの人数が最も少ない県は？単身化が変える住まいの最適解
- target metric: `average-persons-per-general-household` (population)
- category: population
- description 骨子: 「世帯人員は全国的に縮小、しかし県で大きな差がある」──一般世帯の平均人員から単身・核家族化と住まい選びの地域差を読む
- affiliate: housing (引越し見積もり)。世帯縮小に伴う住み替え・単身向け住居検討 → 引越し見積もりの導線
- 内部リンク: /ranking/average-persons-per-general-household, /blog/household-structure-transformation, /blog/household-solo-vs-dualincome, /category/population

### B9. propane-gas-consumption-energy-cost
- title: プロパンガスを最も使う県はどこ？都市ガス空白地帯の見えない光熱費
- target metric: `propane-gas-consumption-quantity` (economy)
- category: economy
- description 骨子: 「都市ガスが届かない地域ほどプロパン依存=光熱費が割高になりやすい」──プロパンガス消費量から地方のエネルギーコスト構造と水まわり・設備の関心を喚起
- affiliate: energy (ウォーターサーバー)。光熱費・水まわりへの関心 → 設備導線
- 内部リンク: /ranking/propane-gas-consumption-quantity, /blog/energy-infrastructure-gas-electricity, /blog/electricity-bill-hike-impact, /category/economy

### B10. water-supply-coverage-rural-frontier
- title: 水道が通っていない地域はまだある？普及率の地方フロンティア
- target metric: `water-supply-population-ratio-2012on` (population)
- category: population
- description 骨子: 「水道普及率100%は当たり前ではない」──未普及地域の存在から地方インフラと水の関心を喚起
- affiliate: energy (ウォーターサーバー)。水質・水道への関心 → ウォーターサーバー導線
- 内部リンク: /ranking/water-supply-population-ratio-2012on, /blog/water-infrastructure-crisis, /blog/sewerage-water-supply-gap, /category/population

---

## C. トレンド起点 (8 本)

はてブ hotentry RSS (2026-05-29 取得) の時事話題 × 指標マッチング。元ネタ RSS タイトルを根拠に記載。

### C1. beer-sake-drinking-culture-map
- title: ノンアル論争の裏で、酒を飲む県・飲まない県はどう変わった？
- target metric: `beer-consumption-expenditure` (economy), `sake-consumption-quantity` (economy)
- category: economy
- description 骨子: 「居酒屋のノンアル客論争が話題」──飲酒文化の地域差をビール・日本酒消費量で可視化
- トレンド根拠: はてブ「居酒屋経営者です。正直『ノンアル客』より…」
- 収益tie-in: 無
- 内部リンク: /ranking/beer-consumption-expenditure, /blog/sake-consumption-prefecture-gap, /blog/alcohol-prefecture-map, /category/economy

### C2. walking-habit-health-longevity-link
- title: 1日1万歩を続ける県は健康寿命も長い？歩く習慣の地域差
- target metric: `sports-participation-rate-walking` (educationsports), `healthy-life-expectancy-male` (—)
- category: educationsports
- description 骨子: 「ウォーキング論争が話題」──歩く習慣の参加率と健康寿命を重ねて運動と長寿の関係を読む
- トレンド根拠: はてブ「ダイエットでウォーキングを勧めている人がいるけど1日1万歩以上を…」
- 収益tie-in: 有 (health=フィットネス chocoZAP。運動習慣への関心 → フィットネス導線)
- 内部リンク: /ranking/sports-participation-rate-walking, /blog/health-life-expectancy-structure, /blog/sports-participation-map, /category/educationsports

### C3. power-strip-home-electronics-density
- title: 電源タップ交換の呼びかけ、家電が多い県はどこ？保有率の地図
- target metric: `smartphone-ownership-multi-person-households-per-1000` (economy), `car-ownership-multi-person-households-per-1000` (ict)
- category: ict
- description 骨子: 「パナソニックが電源タップ交換を呼びかけ話題」──家電保有率から家庭の電化と安全リスクを読む
- トレンド根拠: はてブ「電源タップは3〜5年で交換を、パナソニック公式アカウントで呼びかけ」
- 収益tie-in: 無
- 内部リンク: /ranking/smartphone-ownership-multi-person-households-per-1000, /blog/mobile-contracts-over-population, /blog/ict-digital-divide-composite-analysis, /category/ict

### C4. electricity-demand-summer-peak-shift
- title: 猛暑で電力需要が伸びる県は？夏のピークが変えた電力地図
- target metric: `electricity-demand` (energy)
- category: energy
- description 骨子: 「家電安全・電力の話題が増える夏前」──電力需要の地域差から猛暑とエネルギー消費の構造を読む
- トレンド根拠: はてブ「電源タップ交換」「家電安全に関する製品交換時期のガイダンス」(電力・家電関心の高まり)
- 収益tie-in: 有 (energy=ウォーターサーバー。電気代・水まわり関心 → 設備導線)
- 内部リンク: /ranking/electricity-demand, /blog/electricity-demand-gap, /blog/electricity-bill-hike-impact, /category/energy

### C5. social-increase-rate-winner-loser
- title: 人が増える県・減る県、勝者と敗者を分ける真因は？
- target metric: `social-increase-rate` (population), `inflow-population-ratio` (population)
- category: population
- description 骨子: 「AI・働き方の変化が地方移住論を後押し」──社会増減率から人口移動の勝者敗者を読む
- トレンド根拠: はてブ「生成AIが本当に変えるのは『検索』ではなく『設計知』だ」(働き方・地方分散の文脈)
- 収益tie-in: 有 (housing=引越し見積もり。移住検討 → 引越し導線)
- 内部リンク: /ranking/social-increase-rate, /blog/population-migration-tokyo-concentration, /blog/inflow-population-ratio-prefecture-gap, /category/population

### C6. fish-catch-collapse-tuna-shift
- title: 漁獲量はなぜ激減した？マグロ・主要魚種の県別漁獲シフト
- target metric: `fish-catch` (agriculture), `fishery-species-catch-tuna` (agriculture)
- category: agriculture
- description 骨子: 「食と資源の持続性が議論される今」──漁獲量の長期減少と魚種シフトから水産業の構造変化を読む
- トレンド根拠: はてブ「健康と運動に関する栄養学的考察」(食・栄養への関心) + GSC「カツオ 漁獲量 ランキング」49 imp が需要を裏付け
- 収益tie-in: 無
- 内部リンク: /ranking/fish-catch, /blog/fishery-catch-aquaculture-shift, /blog/bonito-catch-prefecture, /category/agriculture

### C7. smartphone-car-ownership-lifestyle-split
- title: 車を持たない県・スマホ依存の県、ライフスタイルの分岐点は？
- target metric: `car-ownership-multi-person-households-per-1000` (ict), `smartphone-ownership-multi-person-households-per-1000` (economy)
- category: ict
- description 骨子: 「AIツール比較が話題=デジタル生活の関心高」──車とスマホ保有率からデジタル/車社会の二極化を読む
- トレンド根拠: はてブ「Claude CodeとCodexを2ヶ月使い比べて分かった選び方」(デジタル生活の関心)
- 収益tie-in: 有 (tourism=車査定カーセンサー。車保有率 → 買い替え・査定導線)
- 内部リンク: /ranking/car-ownership-multi-person-households-per-1000, /blog/gasoline-car-society-map, /blog/mobile-contracts-over-population, /category/ict

### C8. disposable-income-after-rent-trap
- title: 家賃を引くと手取りはいくら残る？物価高で見直す住む県の選び方
- target metric: `disposable-income-after-rent` (economy)
- category: economy
- description 骨子: 「物価高・生活防衛が継続テーマ」──家賃控除後の可処分所得で実質的に豊かな県を再評価
- トレンド根拠: はてブ「クレジットカードのオーソリと請求金額のお話」「金融商品の利用規約」(家計・金融の関心) + GSC「生活費 ランキング 都道府県」30 imp
- 収益tie-in: 有 (economy=証券。家計見直し → 資産運用導線)
- 内部リンク: /ranking/disposable-income-after-rent, /blog/tokyo-real-income-after-rent, /blog/wage-vs-living-cost, /category/economy

---

## 検証ログ

- 全 target metric key を `packages/data-configs/src/metrics/<key>.ts` で実在確認済 (架空 key なし)
- 全 30 slug を `.local/r2/app/blog/` 既存 198 slug と照合 → 衝突 0
- GSC 値は `gsc-improvement/reference/snapshots/2026-W21/queries.csv` 実測 (impressions / position)
- トレンド元ネタは b.hatena.ne.jp/hotentry/all.rss (2026-05-29 取得) 実タイトル
- category 値は各 metric file の `"category"` フィールドから取得
- **2026-05-29 トピック dedup**: 既存記事と指標トピックが競合する 12 本 (A2 小麦粉 / A5 昆布マグロ / A6 砂糖野菜 / A11 中絶率 / B1 看護介護 / B2 男女賃金 / B3 県民所得 / B5 空き家 / B6 35歳未婚 / B7 婚姻離婚 / B8 初婚年齢 / B9 太陽光) を非競合の新指標へ差し替え。差し替え後の主要語 (カレー/イカ/タコ/たまねぎ/じゃがいも/認知症/医師歯科/管理職/勤労者可処分所得/持ち家延べ面積/高齢夫婦世帯/粗出生率/世帯人員/プロパンガス) を既存 198 slug と grep 照合 → 重複 0。軸別本数 GSC 12 / affiliate 10 / trend 8 = 30 維持
