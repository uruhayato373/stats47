---
type: screenshot-guide
slug: meeting-minutes-30min-to-5min
article_title: 議事録 30 分 → 5 分にした手順 (録音 mp3 → Claude Code 要約)
total_shots: 3
created: 2026-05-18
status: draft
---

# 議事録 30 分 → 5 分にした手順 — スクリーンショット撮影ガイド

## 撮影前準備

### macOS 撮影コマンド
- 全画面: `Cmd + Shift + 3`
- 範囲指定: `Cmd + Shift + 4`
- ウィンドウ単位: `Cmd + Shift + 4` → Space キー → ウィンドウクリック
- iPhone 画面: iPhone を Mac に Lightning / USB-C で接続 → QuickTime Player → ファイル → 新規ムービー収録 → カメラ選択で iPhone → 静止画は `Cmd + Shift + 4` で QuickTime プレビューを範囲指定

### ターミナル設定 (推奨)
- フォントサイズ: 14pt
- 背景: #1E1E1E
- ウィンドウサイズ: 1200 × 800 px

### マスキング原則
- 録音中の画面: **実際の会議名は使わない**。架空の勉強会名 (例: 「公務員 Claude Code 勉強会」「DX 推進ワークショップ」) に変更
- transcript.json 内のテキストに固有名詞 (発言者名・自治体名) が含まれる場合は、撮影前に sed で架空名に置換した別ファイルを表示
- ファイルパス `/Users/<実名>/...` → 短縮プロンプトで `~/work/minutes/` に
- Claude Code 出力に business 情報があれば、別の架空 transcript で再実行してから撮影

### 架空 transcript サンプル (撮影用ダミーデータ)

```json
{
  "text": "本日は公務員 Claude Code 勉強会にお集まりいただきありがとうございます。今日のテーマは議事録自動化です。まず現状の課題から共有しますと、月に約 20 時間を議事録作成に費やしています...",
  "segments": [
    {"start": 0.0, "end": 5.2, "text": "本日は公務員 Claude Code 勉強会にお集まりいただきありがとうございます。"},
    {"start": 5.2, "end": 9.8, "text": "今日のテーマは議事録自動化です。"},
    {"start": 9.8, "end": 18.4, "text": "まず現状の課題から共有しますと、月に約 20 時間を議事録作成に費やしています。"}
  ]
}
```

### 保存先
- `docs/31_note記事原稿/koumuin-claude-code/04-meeting-minutes-30min-to-5min/images/` 配下
- ファイル名: `screenshot-N-<short-desc>.png`

## 撮影リスト

### Shot 1: iPhone ボイスメモアプリの録音中画面

- **本文位置**: 106 行目 (手順 1 録音同意の取り方の直後)
- **撮影対象**: iPhone のボイスメモアプリで録音中、画面に **架空の勉強会名 + 録音時間カウンター + 音声波形** が表示されている状態
- **準備するもの**: iPhone (ボイスメモアプリ)、Mac (QuickTime Player で iPhone 画面ミラーリング)
- **マスキング項目**:
  - 録音タイトル: 「公務員 Claude Code 勉強会 2026-05-18」など架空名に変更
  - 上部ステータスバー: 通信キャリア名・時刻はそのままで OK (個人特定にならない範囲)
  - 連絡先の通知が来ないよう、撮影中は機内モード ON
- **推奨ファイル名**: `screenshot-1-voice-memo-recording.png`
- **撮影手順**:
  1. iPhone でボイスメモアプリを開き、録音タイトルを「公務員 Claude Code 勉強会 2026-05-18」に変更
  2. 録音開始、波形が動く状態にする (10 秒程度経過すると見栄え良い)
  3. iPhone を Mac に USB 接続 → QuickTime Player → 新規ムービー収録 → カメラを iPhone に切替
  4. iPhone 画面が Mac にミラーリングされた状態で `Cmd + Shift + 4` で範囲指定撮影
  5. 録音は撮影後にすぐ停止 (本物の業務会話を録音してしまわないよう注意)

### Shot 2: curl 実行後の transcript.json

- **本文位置**: 141 行目 (手順 2-1 Whisper API の curl 例の直後)
- **撮影対象**: ターミナルで `cat transcript.json | jq .` を実行し、`text` フィールド・`segments` 配列・各 segment の `start` / `end` / `text` タイムスタンプが見える状態
- **準備するもの**: 架空 transcript.json (上記サンプル使用)、`jq` インストール済み
- **マスキング項目**: 上記サンプルテキストを使えば自動的にマスキング済み。実 transcript は絶対に使わない
- **推奨ファイル名**: `screenshot-2-transcript-json.png`
- **撮影手順**:
  1. 架空 transcript.json を `/tmp/transcript.json` に保存 (上記サンプル使用)
  2. ターミナルでプロンプトを短縮 (`PS1='> '`)
  3. `clear` 後、`cat /tmp/transcript.json | jq . | head -30` 実行
  4. text フィールド + segments 配列の冒頭が画面に収まる範囲をキャプチャ
  5. `Cmd + Shift + 4 → Space` でターミナルウィンドウのみ撮影

### Shot 3: Claude Code で `/format-minutes` 実行直後

- **本文位置**: 319 行目 (手順 3-4 実行直後)
- **撮影対象**: Claude Code 対話画面で `/format-minutes` 実行後、`✓ Read transcript.json` `✓ Read meta.yaml` `✓ Generated drafts/...` のステップ実行ログが順に表示されている状態
- **準備するもの**:
  - `.claude/skills/format-minutes/` 配置済みのデモプロジェクト
  - `transcript.json` (Shot 2 と同じ架空ファイル)
  - `meta.yaml` (架空の勉強会メタ情報)
- **マスキング項目**:
  - 出力ファイル名 `drafts/2026-05-18-study-group.md` のように汎用名に
  - 文字数 (1,847 chars) などのメタ情報は実値で OK (個人特定にならない)
  - プロジェクトディレクトリ名は `~/work/minutes-demo/` のように汎用名
- **推奨ファイル名**: `screenshot-3-format-minutes-run.png`
- **撮影手順**:
  1. デモプロジェクト `~/work/minutes-demo/` で `claude` 起動
  2. `> /format-minutes` を入力して Enter
  3. ステップログ (`Read → Generate → Write`) がすべて表示されたところで一時停止
  4. ターミナルウィンドウを `Cmd + Shift + 4 → Space` で撮影
  5. プロンプト・出力に短縮済みパスのみが見えていることを確認

## 撮影後の手順

1. 全 PNG を `04-meeting-minutes-30min-to-5min/images/` に保存
2. ファイルサイズが 500KB 超なら `pngquant --quality=80-90 images/*.png --ext .png --force` で圧縮
3. draft.md 内の各 `> 📸 [スクリーンショット] ...` マーカーを以下に置換:
   ```markdown
   ![<alt>](./images/screenshot-N-<short>.png)
   ```
4. note 投稿前に最終確認: 実会議名・実発言者名・実 transcript が画面内に残っていないか目視
