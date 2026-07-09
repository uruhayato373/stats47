---
type: screenshot-guide
slug: ordinance-revision-review
article_title: 条例改正案を Claude Code でレビュー: 矛盾検出 + 文体統一
total_shots: 2
created: 2026-05-18
status: draft
---

# 条例改正案を Claude Code でレビュー: 矛盾検出 + 文体統一 — スクリーンショット撮影ガイド

## 撮影前準備

### macOS 撮影コマンド

- 全画面: `Cmd + Shift + 3`
- 範囲: `Cmd + Shift + 4`
- ウィンドウ: `Cmd + Shift + 4` + Space

### ターミナル設定推奨

- フォント 14pt (SF Mono / JetBrains Mono / Menlo)
- 背景 #1E1E1E (ダーク) or #FAFAFA (ライト)
- ウィンドウサイズ 1200×800px
- プロンプトは短く (`~/work/ordinance-2026-05$ ` 程度)

### マスキング原則

- 自治体名・部署名・職員名 → 伏字 or 架空名 (例: 「〇〇市」「政策法務課」「山田」)
- `/Users/<実名>/...` → `/Users/user/...` (ターミナル PS1 を `PS1='%~ $ '` に一時変更)
- 起案中の改正案ファイル名は架空ファイル名に置換 (例: `draft-revision-202605.txt` → `draft-revision-sample.txt`)
- 上位法・他自治体条例ファイル名はそのまま OK (公開情報)
- メール・電話・住所は完全マスキング

### 保存先

- `docs/31_note記事原稿/koumuin-claude-code/06-ordinance-revision-review/images/` 配下
- 命名規則: `screenshot-N-<short>.png`

## 撮影リスト

### Shot 1: ステップ 1 環境準備 (4 ディレクトリ構成の `tree` 出力)

- **本文位置**: L86 (ステップ 1「入力ファイルを揃える」直後)
- **撮影対象**: `tree ~/work/ordinance-2026-05/` の出力。`current/` `revision/` `reference/` `peers/` `output/` の 5 ディレクトリ配下に入力ファイルが配置されている状態
- **準備するもの**:
  - 架空作業ディレクトリ `~/work/ordinance-sample/`
  - `current/ordinance.txt` (条例本文を 1 つコピー、ダミーで OK)
  - `revision/ordinance.txt` (改正案ダミー)
  - `reference/local-autonomy-law.xml` (e-Gov から拾ったサンプル XML or 空ファイル)
  - `peers/yokohama.txt` `peers/osaka.txt` (公開条例コピーで OK)
  - `output/` (空ディレクトリ)
  - `tree` コマンド (`brew install tree`)
- **マスキング項目**:
  - ホームディレクトリパスを `/Users/user/work/ordinance-sample/` に変更
  - 起案中改正案を示唆するファイル名を中立化
- **推奨ファイル名**: `screenshot-1-tree-directory-layout.png`
- **撮影手順**:
  1. ダミーディレクトリを作成: `mkdir -p ~/work/ordinance-sample/{current,revision,reference,peers,output}` してダミーファイルを `touch` で作る
  2. プロンプトを短く設定: `PS1='%~ $ '` (zsh) or `PS1='\w \$ '` (bash)
  3. `cd ~/work/ordinance-sample && tree` を実行
  4. ウィンドウサイズを 1200×800 にして `Cmd+Shift+4` + Space でターミナルウィンドウキャプチャ
  5. `images/` に保存

### Shot 2: ステップ 4 レビュー結果を起案文に貼り付けた状態

- **本文位置**: L251 (「政策法務協議結果」欄に貼り付けるサンプル直後)
- **撮影対象**: 起案文書 (Word or テキストエディタ) の「政策法務協議結果」欄に、Claude Code 出力のレビュー結果表 (markdown 表) が貼り付けられた画面
- **準備するもの**:
  - 架空の起案文書テンプレート (件名「〇〇条例の一部改正について (案)」、起案者「政策法務課」、決裁ルート空欄)
  - Claude Code 出力のレビュー結果 markdown 表 (4-5 行のサンプルで OK)
  - Word, Pages, または VS Code どれでも可
- **マスキング項目**:
  - 起案者氏名 → 「政策法務 太郎」等の架空名
  - 自治体名 → 「〇〇市」
  - 決裁印欄に実名・印影が映らないようにする (空欄推奨)
  - 個別案件 (条例条文の具体的内容) は架空のものに差し替え
  - 日付は記事公開日近辺の架空日付 (例: 2026-05-18)
- **推奨ファイル名**: `screenshot-2-review-result-in-draft.png`
- **撮影手順**:
  1. 架空起案文テンプレートを Word or テキストエディタで開く
  2. 本文 L237-247 の「政策法務協議結果」テンプレートをコピペ
  3. `(レビュー結果表をここに貼り付け)` 部分に Claude Code 出力の markdown 表 (4-5 行) を実際に貼り付け
  4. 「※ 最終的な政策判断・上位法解釈は起案者が責任を持つ。」の注記を残す
  5. `Cmd+Shift+4` で該当欄を範囲キャプチャ (起案者氏名・決裁印欄は範囲外にする)
  6. `images/` に保存

## 撮影後の手順

1. PNG を `docs/31_note記事原稿/koumuin-claude-code/06-ordinance-revision-review/images/` に保存
2. 500KB 超なら `pngquant --quality=80-90 --output screenshot-N-<short>.png --force screenshot-N-<short>.png` で圧縮
3. draft.md の `> 📸 [スクリーンショット] ...` 行を以下に置換:
   - L86 → `![tree コマンド出力: 4 ディレクトリ + ファイル配置](./images/screenshot-1-tree-directory-layout.png)`
   - L251 → `![起案文「政策法務協議結果」欄に貼り付けたレビュー結果表](./images/screenshot-2-review-result-in-draft.png)`
4. note 投稿前に個人情報残存チェック:
   - `grep -E '(自治体名|実名|/Users/[a-zA-Z]+/)' images/*.txt` (OCR 結果が無ければ目視)
   - 起案中条例文の機密内容が映っていないか拡大確認
