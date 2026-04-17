---
name: record-youtube-experiment
description: YouTube 実験の仮説・結果・学びを記録する。Use when user says "実験記録", "YouTube実験", "結果を記録", "学びを記録". 実験ログの追記・更新・横断分析.
argument-hint: "<new|update EXP-XXX|analyze>"
---

YouTube Shorts のフォーマット・テーマ・タイトルの A/B テストを構造化して記録する。

## 用途

- 新しい実験の仮説を記録したいとき
- 投稿後の計測データ（再生数・維持率等）を更新したいとき
- 過去の実験を横断分析して傾向・学びをまとめたいとき

## 引数

```
$ARGUMENTS — new | update EXP-XXX | analyze
  new          新しい実験エントリを追加
  update EXP-XXX  指定実験の計測データを更新
  analyze      全実験の横断分析
```

## 実験ログファイル

`docs/03_レビュー/youtube_experiments.md`

## 手順

### モード: `new`

1. 実験ログファイルを読む
2. 最新の実験 ID を確認し、次の ID を採番（EXP-001, EXP-002, ...）
3. ユーザーに以下を確認:
   - テーマ（ランキング指標）
   - フォーマット（6秒静止画 / BCR / カウントダウン / その他）
   - 仮説（なぜこのテーマ・フォーマットが効くと考えるか）
   - 成功基準（初動48h再生 > N 等）
4. テンプレートに従って新しいエントリを追記
5. 「仮説の詳細」セクションに根拠を記載

### モード: `update EXP-XXX`

1. 実験ログファイルを読む
2. 指定された EXP-XXX のエントリを見つける
3. `/fetch-youtube-data` で最新の再生数・いいね数を取得
4. YouTube Analytics API（`node .claude/scripts/youtube/analytics.js retention <videoId>`）で維持率を取得
5. 以下のフィールドを更新:
   - 初動48h再生
   - 7日再生
   - 維持率
   - いいね率（いいね / 再生数）
6. 「学び」を記入:
   - 仮説は正しかったか？
   - 予想外の結果はあったか？
   - 次に試すべきことは何か？
7. 「次のアクション」を記入

### モード: `analyze`

1. 実験ログファイルを読む
2. 全実験のデータを集計:
   - フォーマット別の平均再生数・維持率
   - テーマ別の平均再生数・維持率
   - タイトル・タグの傾向
3. 成功パターンと失敗パターンを抽出
4. youtube-strategist.md の戦略知見セクションに新しい学びを反映すべきか判断
5. 分析結果をログファイル末尾に「横断分析」セクションとして追記

## 関連スキル

| スキル | 関係 |
|---|---|
| `/fetch-youtube-data` | 再生数・いいね数の取得 |
| `/analyze-youtube` | 競合動画の内容分析 |
| `/post-youtube` | 投稿メタ（タイトル・説明・タグ）の生成 |
