---
type: screenshot-guide
slug: hooks-personal-info-masking
article_title: Claude Code Hooks で個人情報マスキングを自動化する
total_shots: 1
created: 2026-05-18
status: draft
---

# Claude Code Hooks で個人情報マスキングを自動化する — スクリーンショット撮影ガイド

## 撮影前準備

### macOS コマンド
- 全画面: `Cmd + Shift + 3`
- 範囲指定: `Cmd + Shift + 4` (ドラッグ)
- ウィンドウ単体: `Cmd + Shift + 4` → `Space` → ウィンドウクリック
- クリップボード保存: 上記に `Ctrl` を追加 (`Cmd + Shift + Ctrl + 4`)

### ターミナル推奨設定
- フォント: SF Mono / JetBrains Mono / Hiragino Sans 14pt
- 背景色: ダーク `#1E1E1E` または ライト `#FAFAFA`
- ウィンドウサイズ: 1200×800 (16:10 推奨)
- プロンプト: `user@stats47 ~/projects/koumuin-demo %` 程度に短縮

### マスキング原則
- 自治体名・部署名・職員名 → `○○市` `総務課` `田中太郎` (架空)
- `/Users/<実名>/...` → `/Users/user/...` または `~/projects/...`
- メール: `taro@example.lg.jp` (`.lg.jp` で公的雰囲気)
- 電話: `03-1234-5678` (固定の架空番号で統一)
- ホスト名: `koumuin-mac` 等の汎用表記
- セッション ID・UUID: マスキング不要 (個人特定不可)

### 保存先
- ディレクトリ: `docs/31_note記事原稿/koumuin-claude-code/11-hooks-personal-info-masking/images/`
- 命名規則: `screenshot-N-<short>.png` (N は撮影リスト番号)
- 圧縮: 500KB 超は `pngquant --quality=70-90 file.png --output file.png`

## 撮影リスト

### Shot 1: マスキング Hook の動作デモ (Chat + ログファイル 2 ペイン)

- **本文位置**: 「### Step 2: マスキングスクリプト本体」の末尾 (`chmod +x` コマンドの直後)
- **撮影対象**: Claude Code Chat 画面に `田中太郎さんの電話 03-1234-5678 を整理して` と打って送信した直後の状態。
  - 左ペイン: Claude Code Chat の履歴 (ユーザー送信後 → Claude のレスポンス内に `[MASKED_TEL]` で置換された context が見える状態)
  - 右ペイン: ターミナルで `tail -f .claude/logs/masking/2026-05-18.jsonl` を実行、最新 1-2 行に `"hits_count":1,"types":["TEL"]` 等が記録されている JSONL
- **準備するもの**:
  1. 動作する `.claude/hooks/mask-pii.mjs` (本記事 Step 2 コードをコピペ + `chmod +x`)
  2. `.claude/settings.json` に hooks 登録済み
  3. 空の `.claude/logs/masking/` ディレクトリ (本番ログを誤って撮らないよう新規作成)
  4. iTerm2 / Terminal で 2 ペイン分割 (`Cmd + D`)
- **マスキング項目**:
  - JSONL 内の `cwd` フィールド: `/Users/user/projects/koumuin-demo` に伏字
  - ホスト名: `koumuin-mac` に伏字
  - 実在しそうな氏名・電話は記事本文と同じ架空値 (`田中太郎` / `03-1234-5678`) で統一
- **推奨ファイル名**: `screenshot-1-mask-pii-demo.png`
- **撮影手順**:
  1. ターミナルで `mkdir -p .claude/logs/masking` を実行しログをクリーン化
  2. 別ペインで `tail -f .claude/logs/masking/$(date +%F).jsonl` を起動 (まだファイル無くても OK、追って生成)
  3. Claude Code を起動し `田中太郎さんの電話 03-1234-5678 を整理して` を送信
  4. 送信完了後、左ペインで Claude 側 context に `[MASKED_TEL]` が反映されたターン、右ペインで JSONL 新規行が追記された瞬間を確認
  5. ウィンドウ全体を `Cmd + Shift + 4` → `Space` で撮影
  6. プレビューで開き、`/Users/<実名>/` 等の残存パスを矩形塗りつぶし

## 撮影後手順

1. PNG を `images/` ディレクトリに保存
2. 500KB 超なら `pngquant --quality=70-90` で圧縮
3. `draft.md` のマーカー行を `![自動マスキング Hook の動作デモ](./images/screenshot-1-mask-pii-demo.png)` に置換
4. 個人情報残存チェック:
   - `grep -r "/Users/$USER" images/` → 0 件
   - 自治体実名・職員実名が画像 OCR で拾えないか目視確認
   - `pngcheck -t` でメタデータに Author 等が残っていないか確認
