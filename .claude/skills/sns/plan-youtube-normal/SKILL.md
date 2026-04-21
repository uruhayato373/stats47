---
name: plan-youtube-normal
description: YouTube 競合分析と自社データマッチングで通常動画の企画を自動生成する。Use when user says "YouTube企画", "動画企画". 再生数が伸びやすいテーマを優先度付きで提案.
disable-model-invocation: true
argument-hint: [件数（デフォルト5）]
---

YouTube の都道府県ランキング系動画の競合分析を行い、再生数が伸びやすいテーマと stats47 の DB データを照合して、次に制作すべき動画企画を優先度付きで提案する。

## 前提

- サービスアカウント鍵: `stats47-*.json`（リポジトリルート）
- `googleapis` パッケージがインストール済み
- ローカル D1 に `ranking_items` が存在すること

## 手順

### Phase 1: 競合バズ動画の取得

YouTube Data API で直近1ヶ月の「都道府県 ランキング」動画を再生数順に取得する。

```javascript
const { google } = require('googleapis');
const auth = new google.auth.GoogleAuth({
  keyFile: '<service-account-key>.json',
  scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
});
const youtube = google.youtube({ version: 'v3', auth });

// 通常動画（4-20分）を再生数順で取得
const search = await youtube.search.list({
  q: '都道府県 ランキング',
  part: 'snippet',
  order: 'viewCount',
  type: 'video',
  publishedAfter: '<1ヶ月前のISO8601>',
  maxResults: 30,
  videoDuration: 'medium',
});

// statistics を取得
const videoIds = search.data.items.map(v => v.id.videoId).join(',');
const videos = await youtube.videos.list({ id: videoIds, part: 'snippet,statistics,contentDetails' });
```

### Phase 2: テーマ分類

取得した動画を以下のカテゴリに分類する（タイトルのキーワードで判定）:

| カテゴリ | キーワード |
|---|---|
| 教育・学歴 | 大学, 高校, 偏差値, 学力, 進学 |
| 産業・ビジネス | 企業, 売上, 工場, 製造, 農業 |
| 食・消費 | ラーメン, 消費, 食, グルメ, 特産 |
| 人口・少子高齢化 | 人口, 出生, 高齢, 少子化, 過疎 |
| 住宅・不動産 | 持ち家, 空き家, 地価, 家賃 |
| 地理・自然・災害 | 地震, 気温, 花粉, 面積, 台風 |
| 犯罪・治安 | 犯罪, 治安, 窃盗, 検挙 |
| お金・経済 | 年収, 所得, 給料, 貯蓄, 物価 |
| 政治・行政 | 知事, 選挙, 投票, 議員 |
| 健康・医療 | 病院, 寿命, 自殺, がん, 医師 |
| スポーツ | 甲子園, 野球, サッカー |
| 交通 | 電車, 駅, 車, 通勤, 交通事故 |

カテゴリ別の平均再生数を算出する。

### Phase 3: 自社データとのマッチング

ローカル D1 の `ranking_items`（`area_type='prefecture'`）から、投稿済みキーを除外した候補を取得。

各カテゴリの ranking_items を Phase 2 の再生数ランキングと照合し、以下のスコアで優先度を付ける:

```
スコア = 競合カテゴリ平均再生数 × データの鮮度（最新年が近いほど高い） × 意外性係数
```

意外性係数の判定:
- 1位が東京/大阪/北海道以外 → 1.5倍
- 1位と47位の差が5倍以上 → 1.3倍
- 競合にまだ同テーマの動画がない → 1.5倍

### Phase 4: 企画提案

上位N件（デフォルト5件）の企画を以下の形式で出力:

```
## 企画1: [タイトル案]

| 項目 | 内容 |
|---|---|
| rankingKey | <key> |
| データ年 | <year> |
| 競合状況 | 同テーマ動画の有無・再生数 |
| 意外性ポイント | 1位が○○県、○倍の差 等 |
| hookText 案 | 15文字以内 |
| displayTitle 案 | 20文字以内 |
| 推定スコア | <score> |

### TOP3 データ
1位 ○○県 ○○
2位 ○○県 ○○
3位 ○○県 ○○
```

### Phase 5: ユーザー確認

企画をユーザーに提示し、制作するテーマを選択してもらう。
選択されたテーマは `/publish-youtube-normal` で制作・投稿する。

## 出力

企画提案はユーザーへのテキスト出力のみ。ファイルは作成しない。
承認されたテーマは `/publish-youtube-normal` に引き継ぐ。

## 参照

- 動画制作: `/publish-youtube-normal`
- 競合分析・YouTube 実験レポート: `gh issue list --label youtube-experiment --state all`
- YouTube データ取得: `/fetch-youtube-data`
