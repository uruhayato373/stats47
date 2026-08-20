# トレンド × stats47 マッチング結果（source: all）

> 調査日時: 2026-06-11 (今日)
> ソース: all (google-trends / gsc / hatena / google-news / yahoo / note)
> トレンド総数: 54件 / 採用: 14件 / 除外: 40件
> クロスソースヒット: 3件（3ソース以上: 1件、2ソース: 2件）
> GSC: サービスアカウント鍵あり、実データ取得済

---

## クロスソースヒット (2ソース以上で出現)

| # | キーワード | ヒット数 | ソース | カテゴリ | マッチ度 |
|---|---|---|---|---|---|
| 1 | 利上げ・住宅ローン金利 | 3 | yahoo, google-news, hatena | construction / economy | ★★★ |
| 2 | 信越化学・レアアース工場 | 2 | google-news, yahoo | miningindustry | ★★☆ |
| 3 | 日銀総裁入院・金融政策 | 3 | hatena, yahoo, google-news | economy | ★★☆ |

---

## 候補一覧

| # | トレンド | ソース | マッチ度 | カテゴリ | 記事の切り口 | 必要アクション |
|---|---|---|---|---|---|---|
| 1 | 豚肉支出・家計調査 | gsc (新規, 14clicks) | ★★★ | economy | 「豚肉支出が多い県は意外にも九州・東北」 | すぐ執筆可 |
| 2 | スーパー消滅・コンビニ化 | hatena (93ブクマ) | ★★★ | commercial | 「スーパーが消えた県に何が起きるか」 | すぐ執筆可 |
| 3 | 利上げ・住宅ローン金利 | yahoo+news+hatena | ★★★ | construction | 「住宅コストが高い県で利上げ影響が最大」 | すぐ執筆可 |
| 4 | G7エネルギー安保 × 再エネ | yahoo | ★★★ | energy | 「県によって再エネ依存度に5倍差」 | すぐ執筆可（差別化） |
| 5 | 過疎化・消滅リスク | note (複数記事) | ★★★ | population | brushup推奨（既存記事あり） | brushup |
| 6 | 役員報酬21億 × 年収格差 | google-news | ★★☆ | laborwage | 「トヨタ21億 vs 都道府県平均年収格差の構造」 | すぐ執筆可 |
| 7 | 信越化学・レアアース | google-news+yahoo | ★★☆ | miningindustry | 「レアアース工場が来る県の製造業集積格差」 | データ確認要 |
| 8 | 日本の課題先送り・財政 | hatena (557ブクマ) | ★★☆ | administrativefinancial | 「財政力指数で見る"先送り体質"の地域差」 | すぐ執筆可（差別化） |
| 9 | うどん消費量急上昇 | gsc (500%成長) | ★★★ | agriculture | brushup推奨（既存記事あり） | brushup |
| 10 | 転入超過・人口移動 | note (複数記事) | ★★★ | population | brushup推奨（既存記事あり） | brushup |

---

## 候補詳細

---

## 候補1: 豚肉支出・家計調査（マッチ度: ★★★ / ソース: gsc / コンテンツギャップ）

- **トレンド概要**: 「家計調査、豚肉の支出額1位の県は？」が今週新規クエリとして9クリック。stats47へ検索流入あり
- **注目度**: GSC 新規クエリ 14クリック・112インプレッション（複数バリエーション合計）
- **分類カテゴリ**: economy（家計）
- **タイミング**: G7 サミット開催週・食品価格への関心が高まる時期

### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 豚肉消費支出額（世帯） | DB既存 | pork-consumption-expenditure | 家計調査ベース |
| 豚肉消費量（世帯） | DB既存 | pork-consumption-quantity | 数量ベース |
| ハム消費支出 | DB既存 | ham-consumption-expenditure | 関連指標 |
| ソーセージ消費支出 | DB既存 | sausage-consumption-expenditure | 関連指標 |
| 食料費支出割合 | DB既存 | food-expenditure-ratio-multi-person-households | 文脈補足 |

### 記事の切り口（案）

1. **curiosity gap**: 「豚肉消費1位は九州・東北どちら？──宮崎・鹿児島が1位常連の意外な理由」
2. **地域差×生活文化**: 「豚カツの街 vs 豚汁の街──家計調査で見る豚肉支出の南北格差」
3. **物価高文脈**: 「豚肉価格が上がる中で支出が多い県はどこか──インフレで変わる食費構造」

### 推奨チャート

- 上位5+下位5 横棒 SVG（豚肉支出額）
- 消費量 vs 支出額の散布図（品質意識の差）

### 次のアクション

- [x] データ確認（`pork-consumption-expenditure.ts` 既存）
- [ ] `/fetch-article-data pork-consumption-expenditure` でデータ取得
- [ ] `/generate-article-charts` でチャート生成
- [ ] 記事執筆（archetype A: 単一指標深掘り）

---

## 候補2: スーパー消滅・コンビニ化（マッチ度: ★★★ / ソース: hatena / 93ブクマ）

- **トレンド概要**: 「とうとう"近所のスーパー"が消えてしまう…まいばすの成功を背景に競争激化"スーパー戦国時代"の勝敗」（president.jp）が93ブクマ。スーパー業態消滅への社会的関心が高まっている
- **注目度**: はてブ 93ブクマ（政治と経済カテゴリ）
- **分類カテゴリ**: commercial（商業・サービス）
- **タイミング**: 少子高齢化・人口減少による地方のスーパー閉鎖問題と連動

### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 大型スーパー数（人口10万人あたり） | DB既存 | department-supermarket-count-per-100k | 主力指標 |
| コンビニ数（人口10万人あたり） | DB既存 | convenience-store-count-per-100k | 対比指標 |
| 大型スーパー売上高 | DB既存 | department-supermarket-sales | 売上視点 |
| コンビニ売上高 | DB既存 | convenience-store-sales | 対比 |
| 食料品小売業者数（人口千人あたり） | DB既存 | food-retail-store-count-per-1000 | 総合食料品アクセス |

### 記事の切り口（案）

1. **curiosity gap**: 「スーパーが消えた県でコンビニが急増──食料品アクセス格差の真相」
2. **逆説**: 「コンビニ密度1位は東京ではない──スーパーとコンビニが入れ替わる県の法則」
3. **生活含意**: 「スーパー vs コンビニ選択比率が高い県ほど食費が高い──家計への影響」

### 推奨チャート

- スーパー数（人口10万人あたり）上位5+下位5
- コンビニ数 vs スーパー数の散布図（業態構造地図）

### 次のアクション

- [x] データ確認（既存metrics多数）
- [ ] `/fetch-article-data department-supermarket-count-per-100k` でデータ取得
- [ ] 既存記事 `convenience-store-density-map` との差別化を明示
- [ ] 記事執筆（archetype D: 生活含意・対比）

---

## 候補3: 利上げ・住宅ローン金利 × 住宅コスト格差（マッチ度: ★★★ / ソース: yahoo+google-news+hatena / クロスソースヒット）

- **トレンド概要**: 「利上げ公算 住宅ローンの金利は?」(Yahoo)、「日銀の植田総裁が入院」(hatena 121ブクマ)が複数ソースで同時出現。米CPI4.2%上昇（google-news）も加わり、インフレ→利上げ→住宅ローンの連鎖への関心が急増
- **注目度**: 3ソース（yahoo・google-news・hatena）クロスソースヒット
- **分類カテゴリ**: construction（住宅）
- **タイミング**: 日銀の利上げ観測が高まる局面。「住宅ローン変動金利」保有世帯の不安が社会課題に

### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 住宅費 地域差指数 | DB既存 | consumer-price-difference-index-housing | 住宅コスト地域差 |
| 住宅費 変化率 | DB既存 | cpi-change-rate-housing | 時系列変化 |
| 住宅費（世帯支出） | DB既存 | housing-charges-consumption-expenditure | 実額 |
| 住宅費支出割合 | DB既存 | housing-expenditure-ratio-multi-person-households | 家計に占める比率 |
| 地価（不動産関連、要確認） | DB確認要 | gross-prefectural-product-real-estate-h27 | 代替指標 |

### 記事の切り口（案）

1. **利上げ文脈での差別化**: 「住宅ローン変動金利が上がると、都道府県によって影響がこれだけ違う──地域別住宅コスト格差」
2. **既存記事との差別化**: consumer-price-regional-gapが「全体」なら、本記事は「住宅特化」

### 推奨チャート

- 住宅費地域差指数 上位5+下位5（東京が高く、地方が安い構造の可視化）
- 住宅費支出割合 × 平均年収の散布図（「高コスト地域の生活圧迫」）

### 次のアクション

- [x] データ確認（`consumer-price-difference-index-housing` 既存）
- [ ] `/fetch-article-data consumer-price-difference-index-housing` でデータ取得
- [ ] 記事執筆（archetype C: 時系列変化 + archetype D: 生活含意）

---

## 候補4: G7エネルギー安保 × 都道府県再生可能エネルギー格差（マッチ度: ★★★ / ソース: yahoo）

- **トレンド概要**: 「首相 G7でエネ安保3原則を提唱へ」(Yahoo)。G7サミットでエネルギー安全保障が議題。国内の再エネ格差が「地方のエネルギー自立」という文脈で注目を集める
- **注目度**: Yahoo トップ picks
- **分類カテゴリ**: energy
- **タイミング**: G7サミット期間中（2026-06）

### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 太陽光発電設備数（住宅） | DB既存 | solar-power-housing | 再エネ普及度 |
| 太陽光パネル設置率 | DB既存 | solar-panel-housing-rate | 住宅の再エネ率 |
| 風力発電容量 | DB既存 | wind-power-capacity | 風力資源 |
| 最終エネルギー消費量（人口比） | DB既存 | final-energy-consumption-per-capita | エネルギー需要 |
| 発電設備容量 | DB既存 | electricity-generation-capacity | 供給力 |

### 差別化（既存記事との違い）

- 既存: `renewable-energy-regional-gap`（再エネ格差の可視化）
- 本記事: 「G7エネルギー安保」文脈→「エネルギー自給できる県・できない県」角度
- 差別化ポイント: 太陽光+風力+水力を合算した「総再エネ供給力」 vs 「エネルギー消費量」で「自給率」を計算する

### 記事の切り口（案）

1. **curiosity gap**: 「G7でエネルギー安保を語る日本──自給できる県はわずかN県、残りは依存」
2. **逆説**: 「太陽光1位は九州だが、エネルギー自給率で見ると意外な県が上位」

### 推奨チャート

- 太陽光設置率 + 風力発電容量 上位5+下位5
- 発電容量/最終エネルギー消費比率（自給率代替指標）散布図

### 次のアクション

- [ ] `/fetch-article-data solar-panel-housing-rate` でデータ取得
- [ ] `renewable-energy-regional-gap` を参照して差別化確認
- [ ] 記事執筆（archetype B: 相関・真因解明）

---

## 候補5: 役員報酬21億 × 都道府県別平均年収格差（マッチ度: ★★☆ / ソース: google-news）

- **トレンド概要**: 「トヨタ自動車 豊田章男会長の昨年度の役員報酬は21億円」(google-news)。富裕層資産運用強化ニュースも重なり、上位層と平均層の格差への社会的関心が高まっている
- **注目度**: Google News ビジネス（複数記事）
- **分類カテゴリ**: laborwage（労働・賃金）
- **タイミング**: 大企業の有価証券報告書開示シーズン（6月）

### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 都道府県平均給与（全産業） | DB既存 | avg-salary-all-prefecture | 主力指標 |
| 勤労者世帯実収入 | DB既存 | actual-income-worker-households-per-month | 実態 |
| 世帯年収 | DB既存 | annual-income-per-household | 世帯ベース |
| 製造業平均給与（確認要） | DB確認要 | - | トヨタ文脈で製造業特化 |

### 記事の切り口（案）

1. **格差の可視化**: 「役員報酬21億円の会社がある県で、平均年収は何円か──愛知の格差構造」
2. **curiosity gap**: 「平均年収が最も高い県は東京ではない？──製造業集積県の逆転」

### 推奨チャート

- 都道府県平均給与 上位5+下位5
- 製造業集積 vs 平均給与の散布図

### 次のアクション

- [ ] `/fetch-article-data avg-salary-all-prefecture` でデータ取得
- [ ] 既存記事の重複確認（wage/salary系の記事）
- [ ] 記事執筆（archetype A: 単一指標深掘り）

---

## 候補6: 信越化学・レアアース福井工場 × 製造業集積格差（マッチ度: ★★☆ / ソース: google-news+yahoo / 2ソース）

- **トレンド概要**: 「信越化学が福井県にレアアースの新工場　中国依存減らし国内の供給体制を強化」(google-news/yahoo)。脱中国依存・国内製造回帰が政策課題となる中、製造業地方展開への注目が高まっている
- **注目度**: 2ソース（google-news + yahoo）
- **分類カテゴリ**: miningindustry / economy
- **タイミング**: G7サミット × 経済安全保障の議論が重なる局面

### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 県内総生産（鉱業） | DB既存 | gross-prefectural-product-mining-h27 | 鉱業GDP |
| 鉱業・採石・砂利採取業事業所数 | DB既存 | number-of-establishments-mining-quarrying-gravel-extraction | 事業所数 |
| 製造品出荷額（要確認） | DB確認要 | manufacturing-shipment-amount | 製造業全体 |

### 記事の切り口（案）

1. **curiosity gap**: 「レアアース工場が来るのはなぜ福井か──製造業立地データで見える選ばれる県の条件」
2. **タイムリー**: 「中国依存脱却×地方製造業回帰──都道府県別製造業基盤格差が示す可能性」

### 推奨チャート

- 製造品出荷額 上位5+下位5
- 鉱業 vs 製造業の複合チャート

### 次のアクション

- [ ] `gross-prefectural-product-mining-h27` でデータ確認（H27=2015年と古い）
- [ ] より新しい製造業指標を検索（`manufacturing-shipment` 等）
- [ ] 記事執筆（archetype A）

---

## 候補7: 日本の課題先送り × 都道府県財政力指数格差（マッチ度: ★★☆ / ソース: hatena / 557ブクマ）

- **トレンド概要**: 「日本が先送りせず解くべき課題」(fladdict.github.io)がはてブ557ブクマで週間最多クラス。少子化・財政・社会保障の「先送り」への社会的関心が非常に高い
- **注目度**: はてブ 557ブクマ（週間最多クラス）
- **分類カテゴリ**: administrativefinancial
- **タイミング**: G7・参院選前（2026年）

### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 財政力指数（都道府県） | DB既存（確認要） | fiscal-capacity-index（要確認） | 財政自立度 |
| 地方税収（確認要） | DB確認要 | - | 財源格差 |
| 普通交付税（確認要） | DB確認要 | - | 地方への補助 |

### 差別化（既存記事との違い）

- 既存: `財政健全化法の4指標で見る都道府県ランキング`（特定法指標）
- 本記事: 「先送り体質」という話題性文脈。「財政依存度が高い県 = 先送りしやすい構造がある」の可視化

### 記事の切り口（案）

1. **curiosity gap**: 「"先送り大国"日本──財政自立度ゼロの県と1を超える県が示す構造的問題」
2. **逆説**: 「交付税に頼る県ほど人口が減るのはなぜか──財政格差と消滅リスクの相関」

### 次のアクション

- [ ] 財政力指数メトリクスを確認（`ls packages/data-configs/src/metrics/ | grep fiscal`）
- [ ] `/fetch-article-data fiscal-capacity-index` でデータ取得

---

## brushup 推奨候補（既存記事あり・GSCトレンド対応）

### GSC brushup: うどん消費量ランキング（★★★, GSC 500%成長）

- **現状**: 既存記事 `fresh-udon-soba-consumption-prefecture-gap`, `udon-soba-food-culture-prefecture-map` あり
- **GSCトレンド**: 「うどん消費量ランキング」が前週比500%急上昇（1→6クリック）
- **推奨**: 既存記事のタイトル curiosity gap 改修（brushup）
- **理由**: データはある。記事もある。CTR が低いなら brushup で対応

### note brushup: 過疎化・消滅リスク（★★★, note複数記事が話題）

- **現状**: 既存記事 `future-population-disappearing-prefectures`, `depopulation-area-medical-facilities` あり
- **noteトレンド**: 「2050年に人口が半減する県」「持続可能性スコア」系記事が多数スキ獲得
- **推奨**: 既存記事のタイトル改修または関連記事追加（2026年データ更新版）

---

## 除外トレンド

| トレンド | 除外理由 |
|---|---|
| fns歌謡祭 | TV番組放送情報 |
| ワールドカップ 2026 | スポーツ試合 |
| アライグマ（中学校出没） | 個別事件 |
| 横山典弘 | 競馬・個人 |
| シンガポール | 海外ニュース（外交） |
| クリスティアーノ・ロナウド | スポーツ個人 |
| 又吉直樹 | 芸能人個人 |
| 河野洋平死去 | 政治家個人訃報 |
| 新名神6人死亡事故 | 個別事故（統計化困難） |
| イスラエル乳児射殺 | 海外ニュース |
| トランプ・イラン攻撃 | 海外ニュース |
| G7（外交・国際関係） | 海外ニュース（エネルギー文脈のみ採用） |
| 米CPI4.2% | 海外経済指標（国内統計なし） |
| 米スターバックス日本売却 | 単発M&A（統計化困難） |
| Claude Fable 5 | IT製品発表 |
| 天橋立クマ出没 | 個別事件 |
| 糖質カット炊飯器 | 消費者製品・訴訟 |
| 黒人俳優・ジェームズボンド | 芸能 |
| 詐欺疑い・山崎武司氏 | 個人芸能 |
| 梅雨・週間天気予報 | 一般天気（統計連携弱） |

---

## 推奨アクション（優先順）

1. **【最優先】豚肉消費支出ランキング** — GSCで実際に「家計調査・豚肉支出1位は？」が新規9クリック流入。データ完備でコンテンツギャップ候補。`/fetch-article-data pork-consumption-expenditure` → 執筆へ
2. **【高優先】スーパー消滅 × コンビニ化格差** — はてブ話題 × 既存記事との差別化明確（スーパーvs コンビニの逆転現象）。`/fetch-article-data department-supermarket-count-per-100k` → 執筆へ
3. **【タイムリー】住宅ローン利上げ × 住宅コスト格差** — クロスソースヒット。利上げ議論が盛んな今が執筆最適タイミング。`/fetch-article-data consumer-price-difference-index-housing` → 執筆へ
4. **【brushup】うどん消費量ランキング** — GSC 500%成長。既存記事を brushup して CTR 改善 → `/brushup-blog --target article udon-soba-food-culture-prefecture-map`
5. **【差別化】G7エネルギー安保 × 再エネ自給率** — G7開催中の今がタイムリー。`renewable-energy-regional-gap` との差別化はエネルギー自給率視点で可能
