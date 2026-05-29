# キーワード → ランキングマッチング リファレンス

ツイート内容から関連 ranking_key を素早く特定するための対応表。

## 検索クエリテンプレート

```
# 基本形
<キーワード> min_faves:1000 lang:ja -filter:replies

# 複数キーワード（OR）
少子化 OR 出生率 OR 人口減少 min_faves:1000 lang:ja -filter:replies

# 特定期間（直近1週間）
<キーワード> min_faves:500 lang:ja -filter:replies since:YYYY-MM-DD

# エンゲージメント閾値を下げる（候補が少ないとき）
<キーワード> min_faves:500 lang:ja -filter:replies
```

## テーマ別マッチング表

### 人口・少子化

| ツイート内キーワード | 推奨 ranking_key | 画像インパクト |
|---|---|---|
| 少子化, 出生率 | total-fertility-rate | ★★★ |
| 人口減少 | total-population, population-change-rate | ★★★ |
| 高齢化, 老人 | aging-rate, elderly-ratio-65-over | ★★★ |
| 婚姻率, 結婚 | marriage-rate | ★★☆ |
| 離婚 | divorce-rate | ★★☆ |
| 未婚, 独身 | single-person-household-ratio | ★★☆ |
| 外国人, 移民 | foreign-resident-count-per-100k | ★★☆ |
| 昼間人口, 通勤 | daytime-population-ratio | ★★☆ |

### 年収・賃金

| ツイート内キーワード | 推奨 ranking_key | 画像インパクト |
|---|---|---|
| 年収, 給料, 給与 | cash-salary-monthly-total | ★★★ |
| 最低賃金 | minimum-wage | ★★★ |
| 初任給 | starting-salary-university | ★★☆ |
| パート, 時給 | female-part-time-hourly-wage | ★★☆ |
| 男女格差, 賃金格差 | gender-wage-gap | ★★★ |
| テレワーク, リモートワーク | telework-rate | ★★★ |
| 副業 | side-job-rate | ★★☆ |
| 可処分所得, 手取り | disposable-income-worker-households | ★★★ |

### 物価・住宅

| ツイート内キーワード | 推奨 ranking_key | 画像インパクト |
|---|---|---|
| 物価 | consumer-price-difference-index-overall | ★★★ |
| 家賃 | private-rental-housing-rent | ★★★ |
| 地価, 不動産 | residential-land-price-change-rate | ★★☆ |
| 空き家 | vacant-housing-rate | ★★★ |
| 持ち家 | home-ownership-rate | ★★☆ |
| 太陽光, ソーラー | solar-panel-housing-rate | ★★☆ |

### 治安・安全

| ツイート内キーワード | 推奨 ranking_key | 画像インパクト |
|---|---|---|
| 治安, 犯罪 | criminal-offenses-per-1000 | ★★★ |
| 交通事故 | traffic-accident-fatalities-per-100k | ★★★ |
| 詐欺 | fraud-offenses-count | ★★☆ |

### 医療・健康

| ツイート内キーワード | 推奨 ranking_key | 画像インパクト |
|---|---|---|
| 医師不足, 医者 | physicians-per-100k | ★★★ |
| 病院, 病床 | general-hospital-count-per-100k | ★★☆ |
| 看護師 | nurses-per-100k-population | ★★☆ |
| 平均寿命, 長寿 | life-expectancy-male / life-expectancy-female | ★★★ |
| 医療費 | national-medical-expense-per-person | ★★☆ |

### 教育

| ツイート内キーワード | 推奨 ranking_key | 画像インパクト |
|---|---|---|
| 大学, 学歴 | final-education-university-graduate-school-ratio | ★★★ |
| 学力, テスト | — (学力テスト結果は未登録) | — |
| 動物園, 水族館 | zoo-count, aquarium-count | ★★☆ |
| 図書館 | library-count-per-million | ★★☆ |

### 経済・格差

| ツイート内キーワード | 推奨 ranking_key | 画像インパクト |
|---|---|---|
| 格差, ジニ係数 | gini-coefficient-disposable-income | ★★★ |
| 貧困, 生活保護 | livelihood-protection-rate | ★★★ |
| 貯蓄, 貯金 | savings-deposit-balance, securities-balance | ★★☆ |
| 県民所得 | per-capita-kenmin-shotoku-h27 | ★★★ |
| 年金 | national-pension-payment-rate | ★★★ |

### 家計・消費

| ツイート内キーワード | 推奨 ranking_key | 画像インパクト |
|---|---|---|
| ラーメン | ramen-consumption-expenditure | ★★★ |
| コーヒー | coffee-consumption-expenditure | ★★☆ |
| ビール, 酒 | beer-consumption-expenditure, sake-consumption-expenditure | ★★★ |
| 餃子 | gyoza-consumption-expenditure | ★★★ |
| コンビニ | convenience-store-sales | ★★☆ |

## 動画アセット対応（`--with-media` 時の添付素材）

`/find-quote-rt --with-media` で引用RTに動画を添付する場合の、話題キーワード → レンダ済み動画パスの対応。レンダリングは不要（既存ストックの消化）。合致しなければテキストのみにフォールバックする。

| アセット種別 | 話題キーワード | X 用動画パス | 遷移先 URL |
|---|---|---|---|
| station-passengers（駅乗降客数） | 駅, 鉄道, 通勤, 満員電車, 乗降, 路線, ラッシュ | `.local/r2/sns/station-passengers/landscape/<NN>.mp4`（東京は `pref-tokyo/x/stills/video.mp4` も可） | `https://stats47.jp/ranking/<station-passengers の ranking_key>` |
| migration-flow（人口移動） | 引っ越し, 転入, 転出, 転出超過, 転入超過, 移住, 上京, 人口流出, 流入 | `.local/r2/sns/migration-flow/<romaji>/x/stills/reel.mp4`（無ければ `landscape/<NN>.mp4`） | `https://stats47.jp/gis-cross/migration-flow?pref=<NN>` |

- **県の選び方**: ツイートが特定県に言及していればその県。県名が無い汎用ツイートなら話題インパクトの大きい県（駅 → 東京 `13`、人口移動 → 転出超過で話題の県）を選ぶ
- **migration-flow の遷移先は `/ranking/` ではなく `/gis-cross/migration-flow?pref=<NN>`**（`?pref=` は県コード）
- 添付はデフォルト OFF（テキストのみ）。`--with-media` 指定時のみ、上記合致時に **動画 1 本** を添付

### 都道府県コード ↔ ローマ字（`<NN>` / `<romaji>`）

| NN | romaji | 県 | NN | romaji | 県 | NN | romaji | 県 |
|----|--------|----|----|--------|----|----|--------|----|
| 01 | hokkaido | 北海道 | 17 | ishikawa | 石川 | 33 | okayama | 岡山 |
| 02 | aomori | 青森 | 18 | fukui | 福井 | 34 | hiroshima | 広島 |
| 03 | iwate | 岩手 | 19 | yamanashi | 山梨 | 35 | yamaguchi | 山口 |
| 04 | miyagi | 宮城 | 20 | nagano | 長野 | 36 | tokushima | 徳島 |
| 05 | akita | 秋田 | 21 | gifu | 岐阜 | 37 | kagawa | 香川 |
| 06 | yamagata | 山形 | 22 | shizuoka | 静岡 | 38 | ehime | 愛媛 |
| 07 | fukushima | 福島 | 23 | aichi | 愛知 | 39 | kochi | 高知 |
| 08 | ibaraki | 茨城 | 24 | mie | 三重 | 40 | fukuoka | 福岡 |
| 09 | tochigi | 栃木 | 25 | shiga | 滋賀 | 41 | saga | 佐賀 |
| 10 | gunma | 群馬 | 26 | kyoto | 京都 | 42 | nagasaki | 長崎 |
| 11 | saitama | 埼玉 | 27 | osaka | 大阪 | 43 | kumamoto | 熊本 |
| 12 | chiba | 千葉 | 28 | hyogo | 兵庫 | 44 | oita | 大分 |
| 13 | tokyo | 東京 | 29 | nara | 奈良 | 45 | miyazaki | 宮崎 |
| 14 | kanagawa | 神奈川 | 30 | wakayama | 和歌山 | 46 | kagoshima | 鹿児島 |
| 15 | niigata | 新潟 | 31 | tottori | 鳥取 | 47 | okinawa | 沖縄 |
| 16 | toyama | 富山 | 32 | shimane | 島根 | | | |

## 引用RTテキストのテンプレート

```
# パターン A: 事実提示
ちなみに都道府県別の{指標名}で見ると、1位は{県名}({値}{単位})、47位は{県名}({値}{単位})。
地域差はかなり大きいです。

# パターン B: 意外性
意外かもしれませんが、{指標名}の1位は{県名}で{値}{単位}。
東京は{順位}位の{値}{単位}です。

# パターン C: 補足データ
この話、データで見ると面白くて。
{指標名}のランキングだと{県名}が断トツ1位。

# パターン D: 時系列
{指標名}、{年}年からの推移を見ると{県名}は{変化の説明}。

# パターン E: URL 付き（3回に1回）
都道府県別の{指標名}ランキング、地図で見ると地域差が一目瞭然です。
https://stats47.jp/ranking/{ranking_key}
```
