---
type: screenshot-guide
slug: assembly-question-points
article_title: 議会一般質問の論点整理を 1 時間 → 10 分にする方法
total_shots: 2
created: 2026-05-18
status: draft
---

# 議会一般質問の論点整理を 1 時間 → 10 分にする方法 — スクリーンショット撮影ガイド

## 撮影前準備

### macOS 撮影コマンド

- 全画面: `Cmd + Shift + 3`
- 範囲: `Cmd + Shift + 4`
- ウィンドウ: `Cmd + Shift + 4` + Space

### ターミナル設定推奨

- フォント 14pt (SF Mono / JetBrains Mono)
- 背景 #1E1E1E (ダーク) or #FAFAFA (ライト)
- ウィンドウサイズ 1200×800px
- メール案撮影時は 1400×900px (件名・本文・添付の全体が入る幅)

### マスキング原則

- **議員名・会派名・自治体名は架空に置換**: 山田 → 「議員 A」「山田議員 (架空)」、自治体 → 「〇〇市」
- 通告書ファイル名: `tsuukoku-yamada-2026-06-15.pdf` → `tsuukoku-giin-a-sample.pdf` 等
- `/Users/<実名>/...` → `/Users/user/...`
- 関係課名 (環境政策課 等) はロール名で OK だが、自治体独自の課名はマスキング推奨
- 内線番号・議員連絡先・職員連絡先は完全マスキング
- 議会事務局担当者氏名 → 「議会事務局 田中 (架空)」

### 保存先

- `docs/31_note記事原稿/koumuin-claude-code/09-assembly-question-points/images/` 配下
- 命名規則: `screenshot-N-<short>.png`

## 撮影リスト

### Shot 1: ステップ 1 通告書ディレクトリの `tree` 出力

- **本文位置**: L72 (ステップ 1「環境準備」直後)
- **撮影対象**: `tree tsuukoku/` の出力。議員ごとに分割された通告書テキストファイル (`yamada.txt` `sato.txt` `suzuki.txt` 等) が並んでいる状態
- **準備するもの**:
  - 架空作業ディレクトリ `~/work/gikai-sample/tsuukoku/`
  - 架空議員名でダミーファイルを作成: `giin-a.txt` `giin-b.txt` `giin-c.txt` (実名 NG)
  - もしくは現実感を出すなら一般的な姓 (山田・佐藤・鈴木) を使い、本文中で「架空」と明記済みであることを利用
  - `tree` コマンド
- **マスキング項目**:
  - 議員名ファイル名を架空名 or 一般姓に統一 (実在の自治体議員と一致しないこと)
  - ホームディレクトリパスを `/Users/user/work/gikai-sample/` に変更
  - PDF 由来のファイル日付は架空 (例: 2026-06-15) でよい
- **推奨ファイル名**: `screenshot-1-tree-tsuukoku-files.png`
- **撮影手順**:
  1. ダミーディレクトリ作成: `mkdir -p ~/work/gikai-sample/tsuukoku && touch ~/work/gikai-sample/tsuukoku/{yamada,sato,suzuki}.txt`
  2. プロンプトを短く設定: `PS1='%~ $ '`
  3. `cd ~/work/gikai-sample && tree tsuukoku/` を実行
  4. ウィンドウサイズを 1000×500 にして `Cmd+Shift+4` + Space でターミナルウィンドウキャプチャ
  5. `images/` に保存

### Shot 2: ステップ 3 関係課振り分けメール案の出力例

- **本文位置**: L170 (メール案テンプレートの直後)
- **撮影対象**: Claude Code が出力した「関係課宛振り分けメール案」。件名・本文 (該当質問項目・第一/第二答弁関係課・締切・添付資料リスト・文体指定) が含まれた 1 通の完成形
- **準備するもの**:
  - 架空通告書 `~/work/gikai-sample/tsuukoku/giin-a.txt` を用意 (3-5 個の質問項目を含む)
  - 本文 L130 付近の振り分けメール案生成プロンプトを Claude Code で実行
  - 出力されたメール案がターミナル or VS Code エディタに表示された状態
- **マスキング項目**:
  - 関係課名 → 「環境政策課」「都市計画課」など一般的な課名 (自治体独自課名は NG)
  - 議員名・会派名 → 架空名 (Shot 1 と一致)
  - 内線番号 → `内線 0000` 等のダミー
  - 議会事務局担当者氏名 → 架空名
  - 締切日付 → 記事公開後の架空日付 (例: ○月○日 ○○時のテンプレート表記そのままで可)
  - 自治体名 → 「〇〇市」
- **推奨ファイル名**: `screenshot-2-mail-draft-output.png`
- **撮影手順**:
  1. 架空通告書を作成 (3-5 質問を含む短文)
  2. Claude Code で本文 L130 付近の振り分けメール案プロンプトを実行
  3. 出力されたメール案を `cat output/mail-draft.md` 等で表示 or VS Code で開く
  4. 件名・本文・添付資料リスト・文体指定まで 1 画面に収まるようウィンドウを 1400×900 に調整
  5. `Cmd+Shift+4` + Space でウィンドウキャプチャ
  6. 縦に長い場合は範囲キャプチャで必要部分のみ
  7. `images/` に保存

## 撮影後の手順

1. PNG を `docs/31_note記事原稿/koumuin-claude-code/09-assembly-question-points/images/` に保存
2. 500KB 超なら `pngquant --quality=80-90 --output screenshot-N-<short>.png --force screenshot-N-<short>.png` で圧縮
3. draft.md の `> 📸 [スクリーンショット] ...` 行を以下に置換:
   - L72 → `![tree tsuukoku/ 出力: 議員ごとのテキストファイル一覧](./images/screenshot-1-tree-tsuukoku-files.png)`
   - L170 → `![振り分けメール案の出力例 (関係課ごとに 1 通)](./images/screenshot-2-mail-draft-output.png)`
4. note 投稿前に個人情報残存チェック:
   - 議員名・会派名が実在のものと一致していないか確認
   - 自治体独自の課名・部署名が残っていないか確認
   - 内線番号・メールアドレス・電話番号が完全マスキングされているか
