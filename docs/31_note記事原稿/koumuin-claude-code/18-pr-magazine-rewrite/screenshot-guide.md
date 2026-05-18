---
type: screenshot-guide
slug: pr-magazine-rewrite
article_title: 広報誌の原稿を Claude Code でリライト: 読みやすさスコア化
total_shots: 1
created: 2026-05-18
status: draft
---

# 撮影ガイド: 広報誌の原稿を Claude Code でリライト

## 撮影前準備

### macOS スクリーンショットコマンド

```bash
# 範囲選択 (推奨): Shift + Command + 4
# ウィンドウ単一: Shift + Command + 4 → Space → クリック
# 全画面: Shift + Command + 3
# クリップボード保存: 上記コマンドに Control を追加
```

### ターミナル / エディタ推奨設定

- ターミナル: iTerm2 または macOS Terminal、フォント `JetBrains Mono 14pt`、配色 `Solarized Dark`
- Claude Code セッションを撮る場合: ウィンドウ幅 1280 程度、フォントサイズ 14、行間広め
- 出力テーブルが折り返さない幅を確保する (列が縦に潰れると読みづらい)

### マスキング原則

- 自治体名・課名 → `〇〇市` / `△△課` / `□□係` 等の架空名
- 職員名・キャラクター名 → ダミー名
- 広報誌掲載イベントの会場名・日付 → 架空値
- ファイルパスの `/Users/<実名>/` → `/Users/user/`
- 原稿本文は **完全に架空** のサンプルを使う (実原稿は使用不可)

### 保存先

```bash
mkdir -p /Users/minamidaisuke/stats47/docs/31_note記事原稿/koumuin-claude-code/18-pr-magazine-rewrite/images/screenshots
```

---

## 撮影リスト

### Shot 1: /koho-score 実行後の出力

- **本文位置**: Step 2 直後 (draft.md 127 行目)
- **撮影対象**: ターミナル上で `/koho-score` スキルを実行した結果。`指標 | 計測値 | 判定 | 該当箇所` の markdown テーブル出力と、末尾の「総合判定」「最優先改善指標」が見える状態
- **準備するもの**:
  - 架空の広報誌原稿 1 本 (例: 防災訓練の告知、または健康診断案内)
  - 役所文体の典型例を意図的に盛り込む (専門用語・受動態・長文を各 2-3 箇所)
  - `.claude/skills/koho-rewrite/SKILL.md` + `reference/scoring.yml` 雛形
  - ターミナル幅は markdown テーブルが折り返さない幅 (~1200px)
- **マスキング項目**:
  - 原稿サンプル内の自治体名 → `〇〇市`
  - 原稿サンプル内の課名・施設名 → 架空名
  - ターミナルプロンプト先頭の `user@host` → `user@mac` 等汎用化
  - 入力ファイルパス `/tmp/koho-input/genkou-{id}.txt` の id は `001` 等架空番号
  - 表示エリアにメニューバーや通知が映り込まないよう撮影前に Do Not Disturb をオン
- **推奨ファイル名**: `shot-01-koho-score-output.png`
- **撮影手順**:
  1. 架空原稿を `/tmp/koho-input/genkou-001.txt` に保存
  2. ターミナルを最大化 → クリア (`Cmd + K`)
  3. Claude Code で `/koho-score genkou-001` 等を実行 (実行コマンドは SKILL.md に合わせる)
  4. テーブル + Summary 2 行が画面内に収まる位置で停止
  5. `Shift + Command + 4 → Space` でターミナルウィンドウ単体撮影
  6. プレビュー.app で原稿名・課名等の残存マスキング項目を黒塗り
  7. プロンプト先頭のホスト名が `<実名>.local` 等なら矩形ツールで上書き

---

## 撮影後手順

1. **PNG 保存先**: `images/screenshots/shot-01-koho-score-output.png`
2. **pngquant 圧縮**:
   ```bash
   pngquant --quality=70-90 --ext=.png --force \
     images/screenshots/shot-01-koho-score-output.png
   ```
3. **draft.md マーカー置換** (127 行目):
   ```markdown
   ![/koho-score 実行後の出力例](./images/screenshots/shot-01-koho-score-output.png)
   ```
4. **個人情報チェック**:
   - ターミナルプロンプトのホスト名 (`<実名>.local`) が出ていないか
   - 原稿サンプル内に実在自治体名・施設名・職員名が残っていないか
   - パスの `/Users/<実名>/` → `/Users/user/` 置換済みか
   - メニューバーのユーザー名・通知バナー・Dock の個人特定アイコンが映り込んでいないか
