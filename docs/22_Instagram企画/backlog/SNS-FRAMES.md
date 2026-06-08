---
type: sns-frames
content_type: sns-frames
total_per_month: 130
created: 2026-05-16
updated: 2026-06-07
tags: [sns, frames, master]
---

# Instagram/SNS マスター運用枠

Instagram/X/TikTok の月次運用枠定義。個別投稿企画は別途 `/post-ig-6angles` で生成。

## 月次本数（カテゴリ × フォーマット）

| カテゴリ | IG Reel | IG Carousel | X-Chart | X-Map | X-Compare | X-Correlation | TikTok | 合計/月 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| economy | 4 | 2 | 4 | 2 | 1 | 1 | 4 | 18 |
| population | 4 | 2 | 4 | 2 | 1 | 1 | 4 | 18 |
| ict | 2 | 1 | 2 | 1 | 0 | 0 | 2 | 8 |
| infrastructure | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 5 |
| energy | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 5 |
| tourism | 3 | 2 | 3 | 1 | 0 | 0 | 3 | 12 |
| agriculture | 2 | 1 | 2 | 1 | 0 | 0 | 2 | 8 |
| miningindustry | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 3 |
| safetyenvironment | 2 | 1 | 2 | 1 | 1 | 1 | 2 | 10 |
| educationsports | 3 | 2 | 3 | 1 | 1 | 0 | 3 | 13 |
| commercial | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 4 |
| landweather | 2 | 1 | 2 | 1 | 0 | 0 | 2 | 8 |
| administrativefinancial | 2 | 1 | 2 | 0 | 0 | 1 | 2 | 8 |
| laborwage | 3 | 2 | 3 | 1 | 1 | 1 | 3 | 14 |
| construction | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 3 |
| socialsecurity | 2 | 1 | 2 | 1 | 0 | 1 | 2 | 9 |
| **合計/月** | **34** | **19** | **34** | **13** | **5** | **5** | **34** | **146** |

X 投稿 4 種類 = RankingX-Chart, ChoroplethMap, CompareX-Post, CorrelationX-Scatter の合計。

## 投稿カレンダー（曜日固定）

| 曜日 | IG Reel | IG Carousel | X | TikTok |
|---|---|---|---|---|
| 月 | — | 1本 | 1本 | 1本 |
| 火 | 1本 | — | 1本（correlation） | 1本 |
| 水 | — | 1本 | 1本 | 1本 |
| 木 | 1本 | — | 1本（compare） | 1本 |
| 金 | — | 1本 | 1本 | 1本 |
| 土 | 1本 | — | 1本（ranking） | 1本 |
| 日 | — | 1本 | — | — |

週 **3 Reel / 4 Carousel / 6 X / 6 TikTok** = 月換算で枠合計と一致。

## テンプレート割当ルール（テーマ × 感情トリガー）

| 感情トリガー | 推奨カテゴリ | テンプレ型 | フォーマット |
|---|---|---|---|
| 財布・生活不安 | economy, laborwage, socialsecurity | 衝撃事実型, 逆説警告型 | X-Chart, IG Reel |
| 地元愛・自虐 | tourism, agriculture, landweather | 対決型 | X-Compare, IG Carousel |
| 子育て・教育不安 | educationsports, population | 衝撃事実型, 問いかけ型 | IG Reel |
| 格差への怒り | administrativefinancial, socialsecurity | 逆説警告型, 衝撃事実型 | X-Correlation |
| 意外性・裏切り | agriculture, tourism, landweather | 衝撃事実型, 問いかけ型 | X-ChoroplethMap |

## フォーマット制作スキル対応

| フォーマット | 制作スキル | サイズ |
|---|---|---|
| RankingX-Chart | /render-sns-stills | 1200×630px |
| RankingX-ChoroplethMap | /render-sns-stills | 1080×1080px |
| RankingInstagram-Carousel | /render-sns-stills | 1080×1350 |
| RankingInstagram-Reel | /render-sns-stills | 9:16 |
| CompareX-Post | /render-sns-stills | 1200×630px |
| CorrelationX-Scatter | /render-sns-stills | 1200×630px |

## 注意事項

- 投稿実体は `/post-sns-captions` で週次バッチ起動
- 個別投稿企画化はしない（テーマ × 既存ランキング × フォーマット枠で運用）

## 関連
- 個別 Instagram 企画: [INDEX.md](./INDEX.md)
- [マスターINDEX](../../00_プロジェクト管理/05_コンテンツ企画マスター.md)
