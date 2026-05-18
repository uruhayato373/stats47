---
type: screenshot-guide
slug: disaster-sns-multilang
article_title: 災害時の SNS 発信文を Claude Code で多言語化
total_shots: 1
created: 2026-05-18
status: draft
---

# スクリーンショット撮影ガイド

## 撮影前準備

### macOS スクリーンショットコマンド

- `Cmd + Shift + 3` — 画面全体を撮影
- `Cmd + Shift + 4` — 範囲選択して撮影（推奨）
- `Cmd + Shift + 4` → `Space` → クリック — ウィンドウ単位で撮影
- `Cmd + Shift + 5` — スクリーンショットアプリ起動（タイマー・録画も可）

撮影後は `~/Desktop/` に `スクリーンショット YYYY-MM-DD HH.MM.SS.png` で自動保存される。

### 推奨ターミナル設定

- フォントサイズ: 14pt（小さすぎると本文中で読めない）
- ウィンドウサイズ: 1200 × 800 px 前後
- カラースキーム: ダーク背景は note 記事のサムネと相性が良い
- プロンプト: シンプルに `$ ` だけ（ホスト名・パス省略でマスキング工数削減）

### マスキング原則

- **自治体名・部署名・職員名** → 「○○市」「広報係」「田中」など伏字 or 架空名
- **`/Users/<実名>/...`** → `/Users/user/...` に置換（事前にダミー HOME を作るのが楽）
- **メール・電話・住所** → 完全マスキング（黒塗り or ダミー値）
- **Slack/Teams 通知バッジ** → スクショ前にミュート
- **メニューバーの個人名 Apple ID** → ログアウト or トリミング

### 保存先と命名規則

- 保存先: `/Users/minamidaisuke/stats47/docs/31_note記事原稿/koumuin-claude-code/21-disaster-sns-multilang/images/`
- 命名: `screenshot-N-<short>.png`（N は通し番号、short は撮影対象を 2-3 単語で）
- 圧縮後の上限: 1 枚 200KB 以下を目安（pngquant 推奨）

## 撮影リスト

### Shot 1: 7 言語並列出力の Claude Code 画面

- **本文位置**: `### ステップ 2: 実行プロンプト (コピペで動く)` 直後、`### ステップ 3: 人間チェック 3 点(これだけ)` の前
- **撮影対象**: Claude Code を起動した状態で `/disaster-translate` スキルを実行し、7 言語（en / zh-Hans / zh-Hant / ko / vi / pt-BR / ja-easy）が縦に並んで出力されている画面。左サイドバーに `.claude/skills/disaster/translate-sns/` のファイルツリーが見えている状態。
- **準備するもの**:
  - `.claude/skills/disaster/translate-sns/SKILL.md`（記事中のコード例を貼り付け）
  - `.claude/skills/disaster/translate-sns/reference/glossary.md`（防災用語対訳表）
  - ダミー原稿: 「本日 14 時、市内全域に大雨警報が発令されました。土砂災害の危険があります...」（記事中の例をそのまま使用可）
  - 災害種別: `flood`、対象エリア: `市内全域`、配信時刻: `2026-07-12T14:05+09:00`
- **マスキング項目**:
  - 自治体名 → 「○○市」または「市内全域」のまま
  - サイドバーに他プロジェクトのファイル名が見えるなら、Claude Code を `.claude/skills/disaster/translate-sns/` を含むダミープロジェクトに移動して撮影
  - ターミナルタイトルバーのパス表示は `/Users/user/...` に偽装
  - ウィンドウ上部の git ブランチ名（プロジェクト名が出る場合）はトリミング
- **推奨ファイル名**: `screenshot-1-disaster-translate-7lang.png`
- **撮影手順**:
  1. ダミープロジェクトで `claude` を起動し、左サイドバーに `.claude/skills/disaster/translate-sns/SKILL.md` / `templates/` / `reference/glossary.md` が見える状態にする
  2. プロンプト欄に `/disaster-translate` と入力し、続けて記事中の【日本語原稿】【災害種別】【対象エリア】【配信時刻】ブロックを貼り付けて Enter
  3. 7 言語ブロックが全て出力された時点で `Cmd + Shift + 4` で範囲選択撮影（en の上端から ja-easy の末尾まで縦長に収める）

## 撮影後手順

### 1. PNG 保存

撮影した画像を `images/` ディレクトリに移動・リネームする。

```bash
mkdir -p /Users/minamidaisuke/stats47/docs/31_note記事原稿/koumuin-claude-code/21-disaster-sns-multilang/images
mv ~/Desktop/スクリーンショット*.png \
  /Users/minamidaisuke/stats47/docs/31_note記事原稿/koumuin-claude-code/21-disaster-sns-multilang/images/screenshot-1-disaster-translate-7lang.png
```

### 2. pngquant で圧縮

```bash
brew install pngquant  # 未インストールなら
cd /Users/minamidaisuke/stats47/docs/31_note記事原稿/koumuin-claude-code/21-disaster-sns-multilang/images
pngquant --quality=65-85 --ext=.png --force screenshot-1-disaster-translate-7lang.png
```

200KB を超える場合は `--quality=50-75` まで下げて再実行。

### 3. draft.md のマーカー置換

`> 📸 [スクリーンショット] ...` 行を以下に置換する。

```markdown
![Claude Code 上で /disaster-translate を実行し 7 言語が並列出力された画面](./images/screenshot-1-disaster-translate-7lang.png)
```

### 4. 個人情報残存チェック

- [ ] 自治体名・部署名・職員名が残っていないか拡大目視
- [ ] `/Users/<実名>/` が画面端に残っていないか
- [ ] Slack/Teams/メール通知バナーが入り込んでいないか
- [ ] 他プロジェクトのファイル名がサイドバーに見えていないか
- [ ] git ブランチ名にプロジェクト名が入っていないか
- [ ] Apple ID / iCloud アカウント名がメニューバーに残っていないか

問題があれば再撮影 or `Preview.app` で該当箇所を矩形塗りつぶし（マスキング後に再圧縮）。
