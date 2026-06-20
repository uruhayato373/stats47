---
name: reference_publish_youtube_47_summary
description: "47県カウントアップ YouTube 通常動画 (~22分) を作るスキル `/publish-youtube-47-summary` の概要と前提"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 06b3ea99-97e3-4491-8bc4-d8db37376bd9
---

47 都道府県カウントアップ/ダウンまとめ動画 (Intro 16秒 + (Telop 4秒 + Reel 24秒) × 47 = 22:12) に
VOICEVOX ナレーションを付与して YouTube に投稿するスキル。

## 場所

`.claude/skills/sns/publish-youtube-47-summary/SKILL.md`

## 共通ライブラリ

- `apps/remotion/scripts/pipeline/lib/voicevox-tts.ts` (theme 引数で TTS バッチ)
- `apps/remotion/scripts/pipeline/lib/mux-47-summary.ts` (theme + prefs で個別 mux + 連結)

## テーマ別に必要なもの (汎用化していない部分)

- Composition: `<TitleCase>-{Reel,Intro,Telop,Thumbnail}` を Root.tsx に登録
- データ ts: `apps/remotion/src/features/<theme>/pref-*.ts` (code/name を含む 47件配列)
- 台本ジェネレータ: `apps/remotion/scripts/pipeline/generate-<theme>-narration.ts`
- バッチレンダー: `apps/remotion/scripts/pipeline/render-<theme>.ts` 等

## 過去事例

- migration-flow (2026-05-22 投稿): https://www.youtube.com/watch?v=XsXqyy9GGwk (スキル化前 ad-hoc)
- station-passengers (2026-05-23 投稿): https://www.youtube.com/watch?v=wjLQCiuEeNI (本スキル初版の参照実装)

詳細は [[project_station_passengers]] と [[reference_voicevox_setup]] を参照。
