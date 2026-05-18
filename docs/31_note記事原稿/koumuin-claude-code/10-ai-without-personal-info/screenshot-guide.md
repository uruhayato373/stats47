---
type: screenshot-guide
slug: ai-without-personal-info
article_title: 個人情報を Claude に送らずに AI 活用する 3 つの設定
total_shots: 2
created: 2026-05-18
status: draft
---

# 個人情報を Claude に送らずに AI 活用する 3 つの設定 — スクリーンショット撮影ガイド

## 撮影前準備

### macOS 撮影コマンド

- 全画面: `Cmd + Shift + 3`
- 範囲: `Cmd + Shift + 4`
- ウィンドウ: `Cmd + Shift + 4` + Space

### ターミナル設定推奨

- フォント 14pt (SF Mono / JetBrains Mono)
- 背景 #1E1E1E (ダーク。BLOCKED メッセージの赤字が映える)
- ウィンドウサイズ 1200×800px
- Claude Code 起動状態 (`claude` コマンド実行後の対話画面)

### マスキング原則

- **絶対に本物の個人情報を映さない**: テストデータはすべて架空 (氏名「テスト 太郎」「サンプル花子」、マイナンバー「123456789012」等の明らかにダミーな値)
- 自治体名・部署名 → 伏字 or 架空名
- `/Users/<実名>/...` → `/Users/user/...` (PS1 を `PS1='%~ $ '` に一時変更)
- 検出パターンの正規表現はそのまま OK (公開情報)
- メール・電話・住所サンプルも完全架空 (`090-0000-0000`, `test@example.com`)

### 保存先

- `docs/31_note記事原稿/koumuin-claude-code/10-ai-without-personal-info/images/` 配下
- 命名規則: `screenshot-N-<short>.png`

## 撮影リスト

### Shot 1: 設定 1 hook で個人情報がブロックされた瞬間の Claude Code 画面

- **本文位置**: L149 (PreToolUse hook 設定直後)
- **撮影対象**: Claude Code 対話画面で `Read personal-test.txt` を実行し、hook が個人情報パターンを検出してブロックしたメッセージ (`BLOCKED: 個人情報パターン検出` 等) と検出パターン表示 (例: 「マイナンバー: 12桁の数字」)
- **準備するもの**:
  - `.claude/hooks/pre-tool-use-pii-check.sh` を本文 L100-135 付近のスクリプトで配置 (実行権限 `chmod +x` 必須)
  - `.claude/settings.json` に hook 登録 (本文 L120-145)
  - 架空テストファイル `personal-test.txt` に明らかにダミーの 12 桁数字 (`123456789012`) を記載
  - Claude Code を起動 (`claude` コマンド)
- **マスキング項目**:
  - テストファイル内のダミー値が「明らかに架空」とわかる値 (連番 123456789012 等)
  - ホームディレクトリパスを `/Users/user/...` に置換
  - hook ログに自治体名・実名が残らないよう事前確認
- **推奨ファイル名**: `screenshot-1-hook-block-message.png`
- **撮影手順**:
  1. ダミー作業ディレクトリ `~/work/pii-test/` 作成
  2. 本文の hook スクリプトを `.claude/hooks/pre-tool-use-pii-check.sh` に配置・`chmod +x`
  3. `.claude/settings.json` を本文 L120-145 の通り設定
  4. `echo "山田太郎 123456789012" > personal-test.txt` (架空)
  5. `claude` 起動 → `> Read personal-test.txt`
  6. BLOCKED メッセージと検出パターンが表示された画面を `Cmd+Shift+4` + Space でウィンドウキャプチャ
  7. `images/` に保存

### Shot 2: 3 つの設定のテスト実行結果 (hook ブロック / permissions deny / Memory 警告)

- **本文位置**: L310 (設定 1/2/3 のテストコマンド説明の直後)
- **撮影対象**: Claude Code 対話画面で 3 つの設定それぞれのテストを順番に実行した結果が画面に積み重なった状態。
  - パターン A: hook ブロック (`BLOCKED: 個人情報パターン検出 ... 対応: 個人情報を別ファイル (personal-data/ 等) に隔離してください`)
  - パターン B: permissions deny (`Permission denied: Read tool is not allowed for ./personal-data/**`)
  - パターン C: Memory 警告 (Claude の応答として「個人情報を含むファイルを読まないように設定されています」等の自主的な警告メッセージ)
- **準備するもの**:
  - Shot 1 の準備に加えて `.claude/settings.json` の permissions deny 設定 (本文 L154-200 付近)
  - `.claude/CLAUDE.md` or memory に「個人情報含有ファイルを読まない」方針 (本文 L210-260 付近)
  - 架空テストファイル `personal-data/secret.txt` (`echo "test" > personal-data/secret.txt`)
  - 3 つのテストコマンドを順番に実行できる状態
- **マスキング項目**:
  - テストファイル内容はすべて `test` 等の中立な文字列
  - ホームディレクトリパスを `/Users/user/...` に置換
  - エラーメッセージ内のパスに実名が含まれていないか確認
- **推奨ファイル名**: `screenshot-2-three-settings-test-results.png`
- **撮影手順**:
  1. Shot 1 の準備に加えて permissions deny + Memory 設定を完了させる
  2. `claude` 起動
  3. `> Read personal-test.txt` (hook ブロック → パターン A 出力)
  4. `> Read personal-data/secret.txt` (permissions deny → パターン B 出力)
  5. `> 個人情報を含むファイルがあるか確認して` のような質問 (Memory に基づく警告 → パターン C 出力)
  6. 3 パターンの出力が 1 画面に収まるようターミナルをスクロールして調整
  7. `Cmd+Shift+4` + Space でウィンドウキャプチャ
  8. 1 画面に収まらない場合は範囲キャプチャで 3 パターンを縦に並べる
  9. `images/` に保存

## 撮影後の手順

1. PNG を `docs/31_note記事原稿/koumuin-claude-code/10-ai-without-personal-info/images/` に保存
2. 500KB 超なら `pngquant --quality=80-90 --output screenshot-N-<short>.png --force screenshot-N-<short>.png` で圧縮
3. draft.md の `> 📸 [スクリーンショット] ...` 行を以下に置換:
   - L149 → `![PreToolUse hook が個人情報を検出してブロックした画面](./images/screenshot-1-hook-block-message.png)`
   - L310 → `![3 つの設定のテスト結果 (hook ブロック / permissions deny / Memory 警告)](./images/screenshot-2-three-settings-test-results.png)`
4. note 投稿前に個人情報残存チェック:
   - テストデータがすべて明らかに架空 (連番・test 等) であることを確認
   - エラーメッセージ内パスに実名が含まれていないか拡大確認
   - hook ログ・detected pattern 表示に実値が混入していないか確認
