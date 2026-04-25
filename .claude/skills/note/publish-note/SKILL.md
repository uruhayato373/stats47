---
name: publish-note
description: browser-use CLI で note.com エディタを自動操作し記事を下書き保存または予約投稿する。Use when user says "note投稿", "note公開", "note予約投稿". テキスト・アイキャッチ・タグを自動設定.
disable-model-invocation: true
argument-hint: "<slug> <M/D> <HH:MM> [, <slug2> <M/D> <HH:MM> ...]"
---

browser-use CLI（Chrome プロファイル経由）で note.com エディタを自動操作し、記事を下書き保存または予約投稿する。**確認プロンプトなし**で全ステップを自動実行する。

## 用途

- `/write-note-section` → `/edit-note-draft` 完了後の記事を note.com に自動投稿
- `/post-note-ranking` で生成した A シリーズ記事を投稿
- 複数記事をバッチで一括予約投稿

## 引数（バッチ対応）

カンマ区切りで複数記事を指定可能:

```
/publish-note a-population-density 3/30 08:00, a-maximum-temperature 3/30 12:00, a-university-count 3/30 18:00
```

各エントリのフォーマット: `<slug> [<M/D> <HH:MM>]`

- **slug**: 記事ディレクトリ名（必須）
- **M/D HH:MM**: 予約投稿日時（任意）。省略時は下書き保存のみ。年は当年を使用

## 前提条件

1. browser-use CLI がインストール済み
2. 記事ファイルが存在する: `docs/31_note記事原稿/<slug>/note.md` または `.local/r2/note/<slug>/note.md`
3. Chrome Default プロファイルで note.com にログイン済み

## browser-use 共通設定

```bash
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
```

**全コマンド**: `browser-use --headed --profile Default <command>`

- `--session` 指定しない（デフォルトセッション）
- `$BU` 変数は使わない。毎回フルコマンドを書く
- バッチ実行中はブラウザを閉じない（最後に1回だけ `close`）

### ⚠️ 必須: 終了時クリーンアップ

`browser-use ... close` は page を閉じるが **daemon プロセス本体を停止しない**。さらに `--profile "Profile 1"` で起動した場合は **ユーザーの実 Chrome 内にタブを開く**ため、daemon を kill してもエディタタブが残ってしまう（2026-04-25 検証で daemon 6 個 + note エディタタブ 5 個残存を確認）。

**スキル完了時 / エラーで中断時に必ず以下 3 段すべてを実行**:

```bash
# 1. Chrome ページを閉じる（best effort）
browser-use --headed --profile Default close 2>/dev/null || true

# 2. daemon と紐付く chromium インスタンスを完全停止
pkill -TERM -f "browser_use.skill_cli.daemon" 2>/dev/null
sleep 2
pkill -KILL -f "browser_use.skill_cli.daemon" 2>/dev/null
pkill -KILL -f "user-data-dir=.*ms-playwright/mcp-chrome" 2>/dev/null

# 3. ユーザーの実 Chrome から残存 note エディタタブを閉じる（macOS 限定）
osascript -e 'tell application "Google Chrome"
  repeat with w in windows
    repeat with t in tabs of w
      if URL of t contains "editor.note.com" or URL of t contains "note.com/notes/" then
        close t
      end if
    end repeat
  end repeat
end tell' 2>/dev/null || true
```

エラー / 中断時の自動クリーンアップ確実化のため、Node.js orchestrator では `process.on('exit')` / `process.on('SIGINT')` 等で上記 3 段を必ず叩くこと。bash スクリプトでは `trap` で同じ。

## 実行フロー概要

```
引数パース → 記事ごとにループ:
  Phase 0: データ読み込み（Node.js）
  Phase 1: ブラウザ起動 & エディタ表示
  Phase 2: アイキャッチ画像（※必ず本文入力前に実行）
  Phase 3: タイトル入力
  Phase 4: 本文入力（一括 ClipboardEvent paste、URL は plain text）
  Phase 5: 挿絵の挿入（目次経由、画像が揃っている場合）
  Phase 6: 下書き保存
  Phase 7: 公開設定（タグ・予約投稿）
  Phase 8: 確認スクリーンショット
→ 全記事完了後にブラウザを閉じる + 必須クリーンアップ（pkill daemon）
```

### Phase 0-6, 8: エディタ操作

詳細手順は **[references/editor-operations.md](references/editor-operations.md)** を参照。

主なポイント:
- **Phase 0**: Node.js スクリプトで note.md を読み込み、セグメント分割（URL vs テキスト）して `/tmp/note-data-<slug>.json` に出力
- **Phase 2**: アイキャッチは**必ず本文入力前**に実行（本文入力後はスクロール位置がずれてボタン検出に失敗する）
- **Phase 4**: 最初のセグメントのみ ClipboardEvent でペースト。残りは全て `type` コマンドで入力（ClipboardEvent は最初の1回のみ確実に動作する制約あり）
- **Phase 5**: 目次からセクションにジャンプし、見出し直後にメニューから画像挿入

### Phase 7: 公開設定

詳細手順は **[references/scheduling.md](references/scheduling.md)** を参照。

主なポイント:
- 「公開に進む」→ ハッシュタグ入力 → 日時設定 → 予約投稿
- 予約日時が指定されていない場合は Phase 7 をスキップ（下書き保存のみ）

## 重要な注意事項

- **ClipboardEvent 制約**: 最初の1セグメントのみ ClipboardEvent でペースト可能。2回目以降は `type` コマンドを使う
- **URL カード変換待機**: URL 入力後は **4秒待機**必須。カード変換完了前に次の入力をするとレイアウトが壊れる
- **要素インデックスは毎回変わる**: state で都度確認。ハードコードしない
- **state 呼び出し最小化**: 1回の state で複数要素を検索する。`type`/`keys` の後は state 不要

## トラブルシューティング

要素検索ヘルパー（`find_idx` / `find_idx_retry`）、実証済みの要素パターン、state 最小化ガイドライン、エラーハンドリングの詳細は **[references/troubleshooting.md](references/troubleshooting.md)** を参照。

## 参照

- browser-use CLI: `browser-use --help`
- note 記事テンプレート: `/post-note-ranking` スキル
- note 記事執筆: `/write-note-section` スキル
- note 記事編集: `/edit-note-draft` スキル
- 自動化パターン: `.claude/agents/browser-publisher.md` の note.com セクション
