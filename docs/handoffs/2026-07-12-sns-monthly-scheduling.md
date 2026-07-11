---
type: handoff
date: 2026-07-12
topic: SNS 3チャネル 1ヶ月分予約 (X90/IG90/YT30) の初回配信チェック
---

# 引き継ぎ: SNS 1ヶ月分予約 (2026-07-12〜08-10) の観測ポイント

2026-07-11 に X/Instagram/YouTube の 1 ヶ月分 (計 210 本) を予約済み。**すべて自走する**が、
初回だけ動作確認する。消化したらこのファイルは削除。

## 観測ポイント (次セッションで確認)

1. **IG 初回**: 7/12 08:03 JST cron (リール public-bath-count)。成功すると Issue #127 に自動コメント。
   1日3本化 (cron×3 + time 枠) の初日なので 12:03 / 19:03 の画像投稿も確認。
2. **YouTube queue cron 初回**: 7/12 17:30 JST (`youtube-upload-queue.yml`)。前夜に budget ガードの
   日付バグ (文字列比較→エポック比較) を修正済みで、pending 25 本のうち 5 本
   (7/13,15,17,19,21 公開分) が消化されるはず。run の Step Summary で uploaded=5 / failed=0 を確認。
3. **YouTube 初公開**: 7/12 19:00 JST (`japanese-population` BCR)。公開後 24-48h の初速
   (impressions / suggested 露出) が量産実験の実証データ。悪ければ queue の pending 削除 +
   YouTube Studio で予約解除で即停止。
4. **X**: ネイティブ予約なので確認不要 (7/12 08:00 から毎日 3 本)。

## 状態ファイル (真実源)

- X: `.claude/state/sns/posts.json` (scheduled 90)
- IG: `.claude/state/instagram-w29-schedule.json` (90 枠) + `ig-posted-log.jsonl`
- YT: `.claude/state/youtube-upload-queue.json` (uploaded 5 / pending 25) + Release `yt-bcr-2026-07`

## 停止方法 (悪化時)

- IG: w29 の残エントリ削除 (main 反映)
- YT: queue の pending 削除 + Studio で予約解除
- X: X の予約済みポスト画面から削除
