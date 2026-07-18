---
type: competitive-analysis
date: 2026-07-18
status: active
platform: youtube
observed_at: 2026-07-18T16:06:53+09:00
tags: [youtube, competitor, sns, dataviz, content-pattern]
---

# YouTube競合・勝ちパターン初回分析

## 1. 結論

stats47がYouTubeで試す価値が高いのは、既存ランキング動画の本数増加ではなく、次の4型である。

1. **常識検証型**: 「日本は7割が森」を全47県で再計算し、最後に答えを出す。
2. **実感尺度変換型**: 人口減少数を「東北6県分」「1日2,325人」のように理解可能な尺度へ変換する。
3. **流動・勢力型**: 転入転出、交通、店舗網を「吸う/吸われる」「勢力図」「バトル」として動かす。
4. **自県探索型**: 視聴者が自県を探し、地元情報をコメントで補足できる余白を作る。

小規模チャンネルでも、独自集計・独自プログラム・全県可視化が通常動画の数十〜千倍規模へ外れる例が確認できた。
一方、表を4〜6秒だけ表示する超短尺ランキングは再生数に対してlike/commentが弱く、stats47の信頼性・送客・
継続視聴を主目的にする型としては優先しない。

このレビューは公開データによる初回探索であり、他者のimpression、CTR、retention、収益は取得していない。

## 2. 調査方法

### 2.1 検索条件

YouTube Data API v3 `search.list`で以下12語を検索した。

- 都道府県 ランキング
- 47都道府県 比較
- 日本地図 データ 可視化
- 市区町村 地図にしてみた
- 人口減少 都道府県
- 鉄道網 日本地図
- 県民性 統計
- 移住 都道府県 比較
- 年収 都道府県
- 空き家 市区町村
- 地図にしてみた 日本
- 都道府県ランキング shorts

共通条件:

- `regionCode=JP`
- `relevanceLanguage=ja`
- `publishedAfter=2024-01-01T00:00:00Z`
- queryごとにviewCount順10件
- URL重複排除後の上位50動画を分析
- 45チャンネルについてuploadsプレイリスト直近25件を取得

### 2.2 公開指標

`videos.list`からview、like、comment、duration、公開日時を取得した。チャンネル内の異常値は次で計算した。

```text
viewsPerDay = views / max(1, 公開後日数)
channelLift = 対象動画views / 同一channel・同尺bucketの直近動画median views
publicEngagementRate = (likes + comments) / views
```

尺bucketはAPIだけでShortsを完全判定できないため、`duration <= 180秒`を`short-form-proxy`とした。
縦横比、Shorts feed掲載、視聴維持率は未取得。`channelLift`は直近25件の同bucketが母数で、長期的通常値ではない。

### 2.3 目視

上位候補9件の公開サムネイル、title、descriptionを確認した。画像は`/tmp/yt-competitive-thumbs/`へ一時取得し、
git/R2へ保存していない。動画本体、第三者素材、本文全文は保存していない。

## 3. 注目動画

数値は2026-07-18 16:06 JST時点。

| 動画 | channel | 尺 | views | views/日 | channel lift | like | comment | 判定 |
|---|---|---:|---:|---:|---:|---:|---:|---|
| [「日本は7割が森」は本当か？](https://www.youtube.com/watch?v=eO2aC9VICxc) | Visual Physics / 視覚化の実験場 | 3:41 | 276,028 | 3,739 | 1,555.09 | 2,929 | 711 | 最重要。問い→全県集計→全国平均 |
| [各県の弱点は？](https://www.youtube.com/watch?v=sxYlJyCovLU) | ジオジオ地理教室 | 1:37 | 2,397,073 | 7,487 | 321.82 | 30,112 | 2,856 | 自県探索は強いが高sensitivity |
| [日本の人口減少が速すぎる](https://www.youtube.com/watch?v=PeteIfCEygs) | 日テレNEWS | 0:42 | 1,242,421 | 2,007 | 266.16 | 33,420 | 3,596 | 抽象数を1日/地域人口へ変換 |
| [都道府県平均世帯年収一覧](https://www.youtube.com/watch?v=iVMV-WnuYzY) | たくお金チャンネル | 0:04 | 696,170 | 1,393 | 265.71 | 577 | 12 | 高view・低反応。表貼付型 |
| [なぜ秋田県には若者が定着できないのか？](https://www.youtube.com/watch?v=KLRKUqgCCoU) | ゆるっと地球の秘密 | 0:55 | 299,017 | 456 | 54.06 | 5,308 | 1,397 | 問い・地元議論は強い。因果注意 |
| [人口争奪バトル](https://www.youtube.com/watch?v=pQym_n_NTkc) | データまにあっくす | 4:29 | 355,087 | 10,150 | 27.55 | 3,381 | 865 | 独自プログラム・流動可視化 |
| [各県最強ドラッグストア勢力図](https://www.youtube.com/watch?v=LDjXgHAzyuc) | ジオジオ地理教室 | 18:14 | 908,683 | 15,417 | 26.90 | 8,022 | 2,494 | 勢力図×固有ブランド×自県探索 |
| [都道府県別歴代最大震度](https://www.youtube.com/watch?v=iX6FkfAsqq8) | よしらぶ | 2:46 | 729,971 | 17,066 | 36.91 | 7,807 | 485 | 視覚力あり。推定・出典・安全性注意 |
| [人が少ない都道府県TOP10](https://www.youtube.com/watch?v=8gNMh309tko) | JP RANKING CENTER | 0:06 | 929,070 | 5,776 | 16.11 | 423 | 37 | 高view・極低反応。主力非推奨 |

### 3.1 反応率の対照

- 人口減少ニュース: `(33,420 + 3,596) / 1,242,421 = 2.98%`
- 秋田若者定着: `(5,308 + 1,397) / 299,017 = 2.24%`
- 人口流動可視化: `(3,381 + 865) / 355,087 = 1.20%`
- 平均世帯年収4秒表: `(577 + 12) / 696,170 = 0.085%`
- 人口TOP10 6秒: `(423 + 37) / 929,070 = 0.050%`

公開反応率だけで品質を断定できないが、超短尺表型は上位3例の約14分の1〜60分の1である。
stats47は再生開始数だけを追わず、comment、site遷移、視聴維持を含む実験にする必要がある。

## 4. サムネイル・表現分析

### 4.1 常識検証型

森林率動画は、暗い背景の日本地図、緑色の列島、`「日本は70%」`という既知命題、
`森林らしいので可視化した`という検証行為を1画面に置く。単なる森林率TOP47ではなく、視聴理由が
「本当に70%か確かめたい」になる。descriptionでも全都道府県集計と最後の全国平均を約束している。

stats47適応:

- 「日本の住宅は本当に余っている？」空き家率×総戸数。
- 「東京は本当に若者を吸い続けている？」転入超過の長期推移。
- 「地方はすべて人口減少？」増加自治体・例外の地図。
- 「日本人は本当に持ち家志向？」県別と年代別。

### 4.2 実感尺度変換型

人口減少動画は`1日2,325人`、`10年で大阪府または東北6県相当`へ変換している。大きな数を別の人口へ置き換えるため、
視聴者が規模を理解できる。サムネイルは人物群、明るいミント色、警告記号、巨大な`速すぎる`で構成される。

stats47適応:

- 人口減少を「毎年○市分」で表す。ただし一定速度の外挿は仮定を明記。
- 空き家数を「○県の全世帯分」と比較。
- 移動人口を「スタジアム○個分」等へ変換する場合、比較の恣意性を注記。

### 4.3 流動・勢力図型

人口流動動画は`人口を吸う県 / 吸われる県`という対立語、赤青の流線、日本地図を組み合わせる。
静的順位では表現できない方向・関係を主役にしている。動画内は上位だけ、全順位を説明欄側へ分ける構成も確認できる。

stats47適応:

- 転入元→転入先のOD flow。
- 高速道路・新幹線開業前後の人口移動。
- 昼夜間人口の吸引・流出。
- 進学・就職時の若年人口移動。

型F/flow rendererが必要な候補は既存buzz-map capabilityと接続し、未実装をダミーで補わない。

### 4.4 自県探索・地域アイデンティティ型

各県の弱点、ドラッグストア勢力図、秋田若者定着は、視聴者が自県の扱いを確認し、地元の実感をコメントできる。
ドラッグストア勢力図は黒背景、巨大な白文字、企業色・ロゴ付き県地図で一目で内容がわかる。

stats47適応:

- 「あなたの県の例外」を明示するchapter/segment。
- コメントpromptは「地元の体感と一致しますか？」にし、対立・蔑視を促さない。
- 固有ブランドのロゴを使う場合は権利確認。最初はテキスト・色・一次データだけで作る。

### 4.5 超短尺表型

年収一覧・人口TOP10は、表や縦長ランキングを4〜6秒表示する。再生開始・ループがviewsを押し上げる可能性があるが、
公開反応率は0.05〜0.085%と低い。2025-03-31以降、YouTube ShortsのviewCountは再生開始・再再生を数え、
最低視聴時間要件がないため、旧動画や通常動画とのview比較にも注意が必要である。

stats47適応判断:

- 認知用の小規模A/B候補にはできる。
- 主力、商品送客、信頼形成の型にはしない。
- 使う場合も出典、年、単位、landingを読める形で保持する。
- successをviewsだけにせず、engaged view相当、自社site click、commentで判定する。

## 5. 検索ノイズと競合分類

`都道府県ランキング`はゲームランキング、2chまとめ、偏見、あるある、旅行主観を大量に含んだ。
これはノイズである一方、注意競合としては有効である。

次回は検索laneを分ける。

| lane | 目的 | include | exclude候補 |
|---|---|---|---|
| data | 統計・可視化 | 統計、データ、可視化、国勢調査、e-Stat | ゲーム、2ch、偏見 |
| map | 地図表現 | 日本地図、勢力図、流動、メッシュ、GIS | Roblox、ゲームmap |
| identity | 自県探索 | 都道府県比較、県民、地元 | 誹謗・蔑視表現 |
| utility | 意思決定 | 移住、年収、生活費、住宅、交通 | 投資勧誘 |
| attention | 注意競合 | あるある、弱点、ワースト、驚き | 制作候補へは自動昇格しない |

既知channelだけでなく、Visual Physicsやデータまにあっくすのように、通常規模を大きく超えた単発動画を追う。

## 6. stats47向け優先pilot

### Pilot 1: 常識検証（最優先）

- 仮タイトル: `「地方は全部人口減少」は本当か？増えている街を全国集計`
- 形式: 3〜5分通常動画 + 45秒Short + 4:5静止画。
- 型: buzz-map A/B。例外自治体を段階表示。
- landing: 人口増加率または転入超過のranking/blog。
- primary: channel内通常動画baseline比のqualified views。
- secondary: comment、landing click、平均視聴時間。
- gate: 自治体年次、欠損、境界年、増加定義を説明できること。

### Pilot 2: 流動可視化

- 仮タイトル: `人口を吸う県、吸われる県――転入転出を動かすと見えたこと`
- 形式: 3〜5分通常動画。
- 型: flow。renderer未実装ならcatalog止まり。
- landing: migration flowの全データ。
- gate: OD/純移動の定義、年次、外国/国内移動の範囲。

### Pilot 3: 実感尺度

- 仮タイトル: `日本の人口は1年で「どの市」ひとつ分減った？`
- 形式: 30〜45秒Short。
- landing: 人口推移blog/ranking。
- gate: 単年実績と将来外挿を混ぜない。比較対象の人口年を揃える。

### 保留

- 県の弱点、治安、災害、医療: 高sensitivity。Opus/人間審査前は制作禁止。
- ドラッグストアロゴ勢力図: 商標・ロゴ・店舗データ条件確認待ち。
- 超短尺年収表: view以外の価値が弱く、優先度低。

## 7. 実装・継続調査への反映

`docs/02_実装計画/31_競合インテリジェンス・勝ちパターンカタログ仕様.md`のYouTube laneへ、
Phase 0以降に以下を実装する。

1. query catalogを`data/map/identity/utility/attention`へ分割。
2. search結果→video detail→channel uploads直近25件の取得。
3. duration bucket別medianとchannelLift。
4. ShortsのviewCount定義変更日をmetadataとして保持。
5. viewsだけでなくpublic engagementと自社公開後指標を分離。
6. 上位20件だけを目視queueへ送る。
7. thumbnailは内部一時参照。第三者assetを公開R2へ送らない。

今回の`/tmp/youtube-competitive-raw.json`は実験用一時データで、正式state/R2へ移行していない。
Phase 0のschema確定前にad-hoc JSONを新SSOTにしない。

## 8. 制約・未検証

- 競合のimpression、CTR、retention、平均視聴時間、流入元、収益は不明。
- サムネイルとmetadataを確認したが、9動画の全編frame-by-frame分析は未実施。
- Shorts/通常動画はduration proxyであり、縦横比・Shorts feed掲載を確定していない。
- channelLiftは直近25件・同尺bucket。古い代表作やseasonalityを含まない。
- 検索はviewCount順のため、新しく伸び始めた小規模動画を取りこぼす。次回はdate順laneも必要。
- 取得50件は市場全体ではなく、12query・2024年以降・日本語/日本regionの探索sample。

## 9. 公式根拠

2026-07-18確認:

- YouTube Data API videos/statistics: https://developers.google.com/youtube/v3/docs/videos
- YouTube Data API search.list: https://developers.google.com/youtube/v3/docs/search/list
- YouTube Data API videos.list: https://developers.google.com/youtube/v3/docs/videos/list

公式docsでは、2025-03-31以降のShorts `viewCount`は再生開始・再再生を数え、最低視聴時間要件がないと説明されている。
