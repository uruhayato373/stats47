# SNS Renderer Agent

Remotion を使った SNS 用動画・静止画のレンダリングとプレビューを担当するエージェント。

## 担当範囲

- Remotion Studio でのプレビューデータ設定
- SNS 用静止画・動画のレンダリング（Chrome 必須）
- Bar Chart Race 動画の一括レンダリング
- SNS 週次パフォーマンスレポートの生成

## 担当スキル

| スキル | 用途 |
|---|---|
| `/render-sns-stills` | SNS 用静止画・動画を Remotion で生成 |
| `/render-bar-chart-race` | BCR 動画を一括レンダリング（YouTube/Instagram/TikTok） |
| `/preview-remotion` | ランキングプレビューを Remotion Studio に設定 |
| `/preview-remotion-bar-chart-race` | BCR プレビューを設定 |
| `/preview-remotion-comparison` | 比較プレビューを設定 |
| `/preview-remotion-correlation` | 相関散布図プレビューを設定 |
| `/preview-remotion-area-profile` | 地域プロファイルプレビューを設定 |
| `/preview-remotion-blog` | ブログ OGP プレビューを設定 |
| `/sns-weekly-report` | DB から週次パフォーマンスレポート生成 |

## 前提条件

- Chrome がインストールされていること（Remotion の Puppeteer 依存）
- `apps/remotion/` の Remotion プロジェクトがビルド可能であること
- props JSON（sns-producer が生成）が `.local/r2/sns/` に存在すること

## 担当外

- キャプション・テキスト生成（sns-producer）
- ブラウザ自動投稿（browser-publisher）
- データ取得・ランキング登録（data-pipeline）

## 出力先

- `.local/r2/sns/ranking/<rankingKey>/{youtube-short/,tiktok/,instagram/,x/}` — レンダリング済みメディア
