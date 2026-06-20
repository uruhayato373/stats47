---
name: project_station_passengers
description: 駅別乗降客数機能 (S12) の構成と公開状況。PR #328 マージ済み + 47連結 YouTube 動画公開済み
metadata:
  node_type: memory
  type: project
  originSessionId: 267bf8cf-dffd-49d5-96ce-55a1e08ea683
---

国土数値情報「駅別乗降客数」(S12)・「鉄道」(N02) を使った駅バブルマップ機能。

## 状態 (2026-05-23 時点)

- PR #328 **マージ済み** (2026-05-22)、本番 https://stats47.jp/station-passengers/{NN} 稼働中
- 47県カウントアップ YouTube 通常動画 公開済み: https://www.youtube.com/watch?v=wjLQCiuEeNI (22:12、VOICEVOX 四国めたんナレーション付き、public)

## データ配置（粒度で 3 分割）

- 県別合計 → local D1 `metrics`+`stats_prefecture`（metric_key=`railway-passengers`、2019-2023年度）
- 駅別生データ・路線 → R2 `app/station-passengers/`（local + remote push 済み）
- raw JSON 正本 → `apps/remotion/public/station-passengers/`（videos の staticFile 兼用）

## 主要パス

- 共有コンポーネント: `packages/station-passengers/`
- ランキング登録: `packages/gis/src/station-passengers/register-ranking.ts`
- Web ページ: `apps/web/src/app/station-passengers/`
- Remotion: `apps/remotion/src/features/station-passengers/`
  - 動画 Composition: `StationPassengers-Reel` (landscape/portrait/square)
  - 47連結用 Composition: `StationPassengers-Intro` (16秒) / `StationPassengers-Telop` (4秒) / `StationPassengers-Thumbnail` (1280×720)
  - 47県集計データ: `pref-passengers-2023.ts` (昇順、最後が東京 / 36M 人/日)

## 47連結動画パイプライン

詳細はスキル化済み: [[reference_publish_youtube_47_summary]]

1. バッチレンダー: `tsx scripts/pipeline/render-station-passengers.ts landscape` (47本)
2. Intro/Telop/Thumb レンダー: `tsx scripts/pipeline/render-station-passengers-intro-telop.ts`
3. 台本: `tsx scripts/pipeline/generate-station-passengers-narration.ts` → `out/station-passengers/narration/script.json`
4. TTS: `tsx scripts/pipeline/lib/voicevox-tts.ts --theme station-passengers` (95 WAV、3-4 分)
5. mux + concat: `tsx scripts/pipeline/lib/mux-47-summary.ts --theme station-passengers --prefs ...` (5-6 分)
6. YouTube upload + DB INSERT (sns_posts)

最終出力: `apps/remotion/out/station-passengers-47-final-narrated.mp4` (~300MB / 22:12)

## ハマりどころ

- panel `y0: 0 / y1: 1080` だと TOP10 ランキング + Year + Title + Legend + Source で上下端ギリギリ → `y0: 40 / y1: 1040` の安全余白に変更済み
- VOICEVOX で「N位」と書くと「N くらい」に聞こえる → telop テキストは「N 番目」表記
- bash 経由で改行入り description を渡すと python JSON parse 失敗 → `upload.js` 後に `videos.update` API で別途メタ更新する必要あり (一度踏んだ)
- `apps/remotion/scripts/pipeline/render-*.ts` で `bundle()` 呼ぶ時は webpackOverride で `@` alias を src に向ける必要あり (Root.tsx の `@/shared` import 解決のため)
