---
type: screenshot-guide
slug: official-doc-skills
article_title: 公文書ライティングを校正させる .claude/skills 完全版
total_shots: 1
created: 2026-05-18
status: draft
---

# 公文書ライティングを校正させる .claude/skills 完全版 — スクリーンショット撮影ガイド

## 撮影前準備

### macOS 撮影コマンド

- 全画面: `Cmd + Shift + 3`
- 範囲: `Cmd + Shift + 4`
- ウィンドウ: `Cmd + Shift + 4` + Space

### ターミナル設定推奨

- フォント 14pt (SF Mono / JetBrains Mono)
- 背景 #1E1E1E (ダーク) or #FAFAFA (ライト)
- ウィンドウサイズ 1200×800px
- ディレクトリツリーが折り返さない幅を確保

### マスキング原則

- 自治体名・部署名・職員名 → 伏字 or 架空名 (例: 「〇〇市」「文書法制課」)
- `/Users/<実名>/...` → `/Users/user/...` (PS1 を一時変更)
- 自治体独自規程ファイル (例: `kouyoubun-localrule.md`) はそのまま OK (ファイル名のみ、中身は映さない)
- メール・電話・住所は完全マスキング

### 保存先

- `docs/31_note記事原稿/koumuin-claude-code/07-official-doc-skills/images/` 配下
- 命名規則: `screenshot-N-<short>.png`

## 撮影リスト

### Shot 1: ステップ 2 reference/ 配下のファイル構成 (`tree` 出力)

- **本文位置**: L106 (reference/ 配下のヒアドキュメント作成直後)
- **撮影対象**: `tree .claude/skills/official-doc-review/` の出力。`SKILL.md` と `reference/` ディレクトリ配下に `kouyoubun-base.md` `kouyoubun-localrule.md` などのファイルが並んでいる状態
- **準備するもの**:
  - 架空作業プロジェクト `~/work/skill-sample/`
  - 以下のディレクトリ構造をダミーで作成:
    ```
    .claude/skills/official-doc-review/
    ├── SKILL.md
    └── reference/
        ├── kouyoubun-base.md
        ├── kouyoubun-localrule.md
        └── examples/
            ├── good-tsuuchi.txt
            └── bad-tsuuchi.txt
    ```
  - `tree` コマンド (`brew install tree`)
- **マスキング項目**:
  - ホームディレクトリパスを `/Users/user/work/skill-sample/` に変更
  - reference/examples/ の good/bad サンプルファイル名は中立 (架空通知文)
- **推奨ファイル名**: `screenshot-1-tree-skill-directory.png`
- **撮影手順**:
  1. ダミー構造を作成: `mkdir -p .claude/skills/official-doc-review/reference/examples && touch .claude/skills/official-doc-review/{SKILL.md,reference/{kouyoubun-base.md,kouyoubun-localrule.md,examples/{good-tsuuchi.txt,bad-tsuuchi.txt}}}`
  2. プロンプトを短く設定: `PS1='%~ $ '`
  3. `cd ~/work/skill-sample && tree .claude/skills/official-doc-review/` を実行
  4. ウィンドウサイズを 1000×600 にして `Cmd+Shift+4` + Space でターミナルウィンドウキャプチャ
  5. `images/` に保存

## 撮影後の手順

1. PNG を `docs/31_note記事原稿/koumuin-claude-code/07-official-doc-skills/images/` に保存
2. 500KB 超なら `pngquant --quality=80-90 --output screenshot-N-<short>.png --force screenshot-N-<short>.png` で圧縮
3. draft.md の `> 📸 [スクリーンショット] ...` 行を以下に置換:
   - L106 → `![tree 出力: SKILL.md と reference/ 配下のファイル一覧](./images/screenshot-1-tree-skill-directory.png)`
4. note 投稿前に個人情報残存チェック:
   - パス `/Users/` の後ろが `user` になっているか確認
   - 自治体独自規程の中身が映り込んでいないか目視確認
