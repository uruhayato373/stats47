---
type: sns-frames
content_type: sns-frames
total_per_month: 180
created: 2026-05-16
updated: 2026-05-16
tags: [sns, frames, master]
---

# SNS マスター運用枠

5 プラットフォーム × 9 フォーマット × 16 カテゴリの月次運用枠定義。
個別投稿企画は別途生成。本ファイルは枠数のみを示す。

## 月次本数（カテゴリ × フォーマット）

| カテゴリ | YT Shorts | IG Reel | IG Carousel | X-Chart | X-Map | X-Compare | X-Correlation | TikTok | BCR | 合計/月 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| economy | 4 | 4 | 2 | 4 | 2 | 1 | 1 | 4 | 0.5 | 22.5 |
| population | 4 | 4 | 2 | 4 | 2 | 1 | 1 | 4 | 0.5 | 22.5 |
| ict | 2 | 2 | 1 | 2 | 1 | 0 | 0 | 2 | 0 | 10 |
| infrastructure | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 0 | 6 |
| energy | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 0 | 6 |
| tourism | 3 | 3 | 2 | 3 | 1 | 0 | 0 | 3 | 0 | 15 |
| agriculture | 2 | 2 | 1 | 2 | 1 | 0 | 0 | 2 | 0 | 10 |
| miningindustry | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 4 |
| safetyenvironment | 2 | 2 | 1 | 2 | 1 | 1 | 1 | 2 | 0 | 12 |
| educationsports | 3 | 3 | 2 | 3 | 1 | 1 | 0 | 3 | 0.5 | 16.5 |
| commercial | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 5 |
| landweather | 2 | 2 | 1 | 2 | 1 | 0 | 0 | 2 | 0 | 10 |
| administrativefinancial | 2 | 2 | 1 | 2 | 0 | 0 | 1 | 2 | 0.5 | 10.5 |
| laborwage | 3 | 3 | 2 | 3 | 1 | 1 | 1 | 3 | 0.5 | 17.5 |
| construction | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 4 |
| socialsecurity | 2 | 2 | 1 | 2 | 1 | 0 | 1 | 2 | 0 | 11 |
| **合計/月** | **34** | **34** | **19** | **34** | **13** | **5** | **5** | **34** | **2.5** | **180** |

BCR = Bar Chart Race（月2〜3本上限）。
X 投稿 4 種類 = RankingX-Chart, ChoroplethMap, CompareX-Post, CorrelationX-Scatter の合計。

## 投稿カレンダー（曜日固定）

| 曜日 | YT Shorts | IG Reel | IG Carousel | X | TikTok |
|---|---|---|---|---|---|
| 月 | 1本（朝8時） | — | 1本 | 1本 | 1本 |
| 火 | 1本（昼12時） | 1本 | — | 1本（correlation） | 1本 |
| 水 | 1本（夜20時） | — | 1本 | 1本 | 1本 |
| 木 | 1本 | 1本 | — | 1本（compare） | 1本 |
| 金 | 1本 | — | 1本 | 1本 | 1本 |
| 土 | 1本 | 1本 | — | 1本（ranking） | 1本 |
| 日 | — | — | 1本 | — | — |

週 **6 Shorts / 3 Reel / 4 Carousel / 6 X / 6 TikTok** = 月換算で枠合計と一致。

## テンプレート割当ルール（テーマ × 感情トリガー）

| 感情トリガー | 推奨カテゴリ | テンプレ型 | フォーマット |
|---|---|---|---|
| 財布・生活不安 | economy, laborwage, socialsecurity | 衝撃事実型, 逆説警告型 | X-Chart, IG Reel, YT Shorts |
| 地元愛・自虐 | tourism, agriculture, landweather | 対決型 | X-Compare, IG Carousel |
| 子育て・教育不安 | educationsports, population | 衝撃事実型, 問いかけ型 | IG Reel, YT Shorts |
| 格差への怒り | administrativefinancial, socialsecurity | 逆説警告型, 衝撃事実型 | X-Correlation, BCR |
| 意外性・裏切り | agriculture, tourism, landweather | 衝撃事実型, 問いかけ型 | YT Shorts, X-ChoroplethMap |

## フォーマット制作スキル対応

| フォーマット | 制作スキル | サイズ |
|---|---|---|
| RankingX-Chart | /render-sns-stills | 1200×630px |
| RankingX-ChoroplethMap | /render-sns-stills | 1080×1080px |
| RankingYouTube-Short A/B | /render-sns-stills | 9:16 |
| RankingInstagram-Carousel | /render-sns-stills | 1080×1350 |
| RankingInstagram-Reel | /render-sns-stills | 9:16 |
| BarChartRace | /generate-bar-chart-race + /render-bar-chart-race | 50年×36fps |
| CompareX-Post | /render-sns-stills | 1200×630px |
| CorrelationX-Scatter | /render-sns-stills | 1200×630px |

## 注意事項

- YT Shorts は 1 日 3 本上限（配信停止リスク）
- 投稿実体は `/post-sns-captions` で週次バッチ起動
- 個別投稿企画化はしない（テーマ × 既存ランキング × フォーマット枠で運用）

## 関連
- 個別 YouTube 通常動画企画: [INDEX.md](./INDEX.md)
- [マスターINDEX](../../00_プロジェクト管理/05_コンテンツ企画マスター.md)
