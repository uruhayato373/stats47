# トレンド × stats47 マッチング結果（source: all）

> 調査日時: 2026-05-28 (JST 朝)
> ソース: trends / hatena (5cat) / google-news (5topic) / yahoo (5cat, life は HTTP500 でスキップ) / note (WebSearch fallback)
> GSC: サービスアカウント鍵は存在するが本実行ではライブ取得をスキップ (note: stats47-f6b5dae19196.json は present)。検索需要面は次回 GSC 連携時に補完予定
> トレンド総数: 約 95 件 / 採用: 18 件 / 除外: 約 77 件 (芸能・スポーツ・個別事件・海外・商品 PR を除外)
> クロスソースヒット (>=2 ソース同テーマ): 7 件

## クロスソースヒット (優先)

| キーワード | ヒット数 | 出典 | カテゴリ | マッチ度 |
|---|---|---|---|---|
| 猛暑・真夏日・梅雨入り | 5 | google-trends (梅雨入り2026 / 新潟市天気 / 広島天気), google-news weather, yahoo science (蚊・欧州猛暑), hatena knowledge (エルニーニョ) | landweather | ★★★ |
| 副首都・東京一極集中 | 3 | google-news NATION (副首都担当相), yahoo domestic (副首都), google-news top (副首都) | population | ★★★ |
| ナフサ不足・原油・ガソリン | 4 | hatena social/economics x2, google-news business x2, note (家計物価) | economy/energy | ★★★ |
| 大手賃上げ1万9964円 (過去最高) | 2 | yahoo business, note (賃金・物価) | laborwage | ★★★ |
| 給付付き控除・所得税4段階支援 | 2 | google-news NATION, google-news business | administrativefinancial | ★★☆ |
| 少子化 下げ止まり議論 | 2 | hatena social (84B), note (5月家計) | population | ★★★ |
| はしか過去10年最多ペース | 2 | google-news health, yahoo science 連 (ADHD治療薬不足含む医薬枠) | socialsecurity | ★★☆ |

## 最優先候補 (ranking_key / statsDataId 直結)

| # | 候補 | ranking_key / statsDataId | マッチ度 | 重複? |
|---|---|---|---|---|
| 1 | 梅雨入り×降水・降水日数で47県を4タイプ分類 (今期梅雨入りタイミングの差) | annual-precipitation / annual-precipitation-days | ★★★ | 既存 precipitation-snow-regional-gap あり → 「2026年版アップデート + 梅雨入り日付の年差」で差別化 |
| 2 | 副首都担当相新設 → 一極集中/昼夜人口比/将来人口で47県の「分散候補」を可視化 | population-density-urbanization / future-population-tokyo-paradox / population-migration-tokyo-concentration | ★★★ | 既存 6 本あり → 「副首都法案の対象指標」切り口で新規可 |
| 3 | ナフサ不足×原油高→電気代・ガソリン消費 県別ダメージ試算 | gasoline-consumption-expenditure / gasoline-sales-volume / city-gas-consumption-expenditure | ★★★ | 既存 gasoline-car-society-map / energy-consumption-structure-shift と差別化要 (2026 価格ショック視点) |
| 4 | 大手賃上げ過去最高(+19,964円)の裏で県別 最低賃金/初任給格差 | minimum-wage-gap-regional-economy / highschool-starting-salary-gap | ★★★ | 既存 5 本 → 「2026 春闘結果との連動」で時宜性追加 |
| 5 | はしか感染症: 都道府県別 麻疹報告/ワクチン接種率 (estat candidate) | estat 0003411705 / 0003412007 (感染症死亡数) + vaccination-recipients-disease | ★★☆ | 既存記事なし → 新規余地大、要 /fetch-estat-data |

## 次アクション推奨

1. 最優先は #1 (梅雨入り 47 県タイプ分類 2026 版アップデート) — 既存記事を curiosity gap タイトルで brushup、データは `annual-precipitation` で即着手可
2. #5 (はしか県別動向) は新規領域。`/fetch-estat-data 0003411705` で感染症分類別死亡数を取得し、ワクチン接種率と重ねた構造分析記事化を検討
3. #2 副首都担当相法案は政治タイムリー性が高いため、`/draft-from-trend` で 1 週間以内に draft 化を推奨 (法案提出 6/3 予定との報道あり)

---

## 候補詳細

### ★★★ 候補1: 梅雨入り 2026 × 降水パターン

- **トレンド概要**: Google Trends で「梅雨入り 2026」「新潟市天気」「広島天気」が同時急上昇。google-news で「週間天気予報 真夏日予想 来週前半は台風6号」、yahoo science で「蚊が猛威『大雨の後の晴れ』注意」「欧州で記録的暑さ 英80年ぶり更新」。hatena knowledge で「エルニーニョ現象とグローバル気象異変」も。
- **注目度**: trends 200+ × 3 キーワード、ニュース複数連携
- **カテゴリ**: landweather
- **タイミング**: 西日本梅雨入り直前 + 既に真夏日報告開始、生活実感と一致

#### 使えるデータ
| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 年間降水量 | DB既存 | annual-precipitation | ｍｍ |
| 年間降水日数 | DB既存 | annual-precipitation-days | 日 |
| 最深積雪 | DB既存 | maximum-snow-depth | ｃｍ |
| 最高気温 | DB既存 | maximum-temperature | ℃ |

#### 切り口案
1. 梅雨入り日と年間降水量・降水日数の整合性 (梅雨が短い県と降水量上位は一致しない)
2. 梅雨明けから真夏日までのギャップで「猛暑被害が早い県」予測
3. 既存 precipitation-snow-regional-gap の 2026 年データ重ね描き

#### 推奨チャート
- 47県を「降水量 × 降水日数」の散布図で 4 象限分類
- 線グラフ: 過去 10 年の梅雨入り日推移 (気象庁過去データ要追加取得)

---

### ★★★ 候補2: 副首都担当相新設法案 × 47県の分散候補

- **トレンド概要**: google-news NATION/top で「副首都『担当相』新設で推進 法案判明、人口・経済を多極分散」、yahoo domestic でも報道。法案 6/3 提出予定。
- **注目度**: トップニュース級
- **カテゴリ**: population / administrativefinancial
- **タイミング**: 法案提出前で記事性が最大、提出後は対象都市議論が過熱

#### 使えるデータ
| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 昼夜人口比 | DB既存 | (population-migration-tokyo-concentration 既存記事) | 既存ストーリー流用 |
| 将来人口推計 | DB既存 | (future-population-tokyo-paradox 既存) | |
| 県内総生産 / 1人あたり | estat | 0000010101 系 registered | カテゴリページ存在 |

#### 切り口案
1. 「副首都候補リスト」を 47県の経済規模 × 人口集中 × 災害リスクで採点
2. 既存記事 population-density-urbanization の続報 (法案視点)

#### 推奨チャート
- 47県スコアレーダー: 副首都適性指標 (人口/GDP/インフラ/災害リスク)

---

### ★★★ 候補3: ナフサ不足・原油高 × 県別エネルギー支出

- **トレンド概要**: hatena/google-news で「ナフサ不足」「原油 反落 米イラン交渉」「三菱重工 ナフサ波及」「ガソリン価格高騰対策 与党」、note でも「2026 夏 物価・電気代・ガス代・ガソリン代どこまで上がるか」。
- **注目度**: hatena economics 195/314 ブクマ
- **カテゴリ**: economy / energy
- **タイミング**: 夏前のエネルギー価格不安期

#### 使えるデータ
| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| ガソリン消費支出額 | DB既存 | gasoline-consumption-expenditure | 円 |
| ガソリン消費量 | DB既存 | gasoline-consumption-quantity | ｌ |
| 都市ガス消費支出 | DB既存 | city-gas-consumption-expenditure | 円 |
| 炊事用電気器具消費支出 | DB既存 | cooking-appliance-consumption-expenditure | 円 |

#### 切り口案
1. 「車社会度 × ガソリン高」で県別年間追加負担額シミュレーション
2. 既存 energy-consumption-structure-shift と接続: ナフサ不足の波及で県別製造業出荷額への影響仮説

---

### ★★★ 候補4: 大手賃上げ 19,964円 (過去最高) × 県別最低賃金

- **トレンド概要**: yahoo business「大手賃上げ1万9964円 過去最高に」、note 連帯 (賃上げと消費)。
- **注目度**: yahoo top-of-business
- **カテゴリ**: laborwage
- **タイミング**: 春闘集計確定タイミング

#### 使えるデータ
| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 最低賃金関連 | DB既存 | minimum-wage-gap-regional-economy 等 | 既存複数 |
| 高卒初任給 | DB既存 | highschool-starting-salary-gap | 既存 |
| 県別職種別年収 (公認会計士 / 介護 / 自動車整備 / 美容師 など) | DB既存 | *-annual-income 多数 | 27職種以上 |

#### 切り口案
1. 「大企業 +19,964円」と「県別介護職年収」のギャップ可視化
2. 既存 minimum-wage-1000yen-breakthrough を 2026 春闘結果で更新

---

### ★★☆ 候補5: はしか・麻疹県別動向 (新規領域)

- **トレンド概要**: google-news health「はしか患者 過去10年で最多ペース 累計498人」+ yahoo science 隣接 (ADHD治療薬不足、感染症意識上昇)。
- **注目度**: health top
- **カテゴリ**: socialsecurity
- **タイミング**: ワクチン接種率議論時期

#### 使えるデータ
| データ | ソース | statsDataId | 備考 |
|---|---|---|---|
| 感染症による死亡数 県別 | estat candidate | 0003411705 / 0003412007 | 要 /fetch-estat-data |
| HPV ワクチン接種者数 | DB既存 | vaccination-recipients-disease | 別ワクチンだが類例 |

#### 切り口案
1. 都道府県別 麻疹発生件数・死亡数 + MR ワクチン接種率の重ね描き
2. 「ワクチン接種率が低い県ほど発生が多いか」の検証 (要 e-Stat 追加取得)

#### 次アクション
- [ ] `/fetch-estat-data 0003411705` で感染症死亡数取得
- [ ] 厚労省 感染症発生動向調査の県別データ別途取得検討

---

## ★☆☆ 簡易候補リスト

| キーワード | カテゴリ | 関連 metric | 一言 |
|---|---|---|---|
| 給付付き控除 (所得4段階支援) | administrativefinancial | actual-income-worker-households-per-month / annual-income-per-household | 「県別世帯所得分布で4段階配分の県差」 |
| ADHD治療薬不足 厚労省呼びかけ | socialsecurity | 既存医療系 metric | 県別精神科医療体制と接続可 |
| iPS細胞 山中教授 20周年 | socialsecurity/ict | 医療系 metric 多数 | 京都府特集 + 県別研究費 |
| 大学年内入試 面接義務化 | educationsports | university-advancement-capacity 等既存 | 県内進学率と接続 |
| ストーカーGPS義務 自民提言 | safetyenvironment | 犯罪・警察系 metric | 県別ストーカー認知件数 (要 estat) |
| 出版「ダ・ヴィンチ」休刊 | educationsports | library-* 既存 | 書店・図書館の県格差既存記事と接続 |
| 紙の値上げまとめ | economy | (該当 metric 薄) | 直接 metric なし、★☆☆止まり |
| クマ被害 (宮城岩沼住宅街) | landweather/safetyenvironment | metrics 該当なし | estat 鳥獣害データ取得が前提、優先度低 |
| 富士通×Anthropic/OpenAI 提携 | ict | (該当 metric 薄) | 県別 IT 投資との関連可だが弱い |
| エボラ コンゴ1000人超 | international | (該当 metric 薄) | 海外事象、47県データへの直接接続困難 |

---

## 除外トレンド (抜粋)

| トレンド | 除外理由 |
|---|---|
| クリストファー・サンチェス (MLB) | スポーツ選手個人 |
| 岸明日香 / 見取り図リリー結婚 / モナキ デビュー | 芸能個人 |
| ドラゴンクエスト関連 (DQ4新作・モンスターズ4) | ゲーム新作 |
| 旭川17歳殺害 / たつの母娘殺害 / 阪急電車ガソリン臭 / 抗がん剤死亡 等 | 個別事件・事故速報 |
| 阿部監督辞任 / Crystal Palace ECL初優勝 / Bushiroad 新日プロ譲渡 | スポーツ・芸能ビジネス |
| 副大統領グリーンランド訪問 / ホルムズ海峡韓国船攻撃 / イスラエル仏選挙干渉 / 大統領イラン交渉 | 海外政治・外交 (47県に接続できない) |
| iOS 26.5.1 / AMDプロセッサ脆弱性 / NotebookLM / LG QNED / Aurora Linux | 製品リリース・技術速報 |
| 「はやぶさ2」太陽系外惑星検出 / 早大 富岳 ニュートリノ / 金星あかつき | 学術論文 (県別接続困難) |
| 超巨大ブラックホール早大 / 宇宙誕生12億年後銀河 | 同上 |
| TDR公式ブログ終了 / リンメル日本撤退 / セブン&アイ報酬 / JAL CA飲酒 | 単発企業 PR / 不祥事 |
| 那覇市ごみ袋デザイン変更 | 単発自治体話題 |
| 紙の値上げ (hatena) | metric 接続弱 (★☆☆ 簡易のみ) |
| 子と会えず自殺 / 児相15歳わいせつ / 裸で食事も施設処分 | 個別事件 |
| 注目記事系 (cheese rolling / 北京旅 / モンベル等) hatena life | 個人体験談、統計化困難 |

---

## メモ

- yahoo `life.xml` は実行時 HTTP 500 で取得不能、1 回 retry も 500 のため当該ソースのみスキップ
- note.com の `/topic/society` 等は JS 描画のため WebFetch で本文取得不可。WebSearch で代替し society/economy/lifestyle 文脈は note の経済・物価系記事を参考にした
- GSC live 取得は本実行では skip (鍵 stats47-f6b5dae19196.json は存在)。次回連携時に「自サイト需要面でクロスソース突合」を追加検討
- 実証ベース判定ルール準拠: マッチ度判定は metrics / estat_metainfo のクエリヒット数を根拠とし、推測表現 (「のはず」「だろう」「浸透待ち」等) は使用していない
