---
type: screenshot-guide
slug: audit-ready-settings
article_title: 監査に耐える AI 活用ログを残す .claude/settings.json
total_shots: 1
created: 2026-05-18
status: draft
---

# 監査に耐える AI 活用ログを残す .claude/settings.json — スクリーンショット撮影ガイド

## 撮影前準備

### macOS コマンド
- 全画面: `Cmd + Shift + 3`
- 範囲指定: `Cmd + Shift + 4`
- ウィンドウ単体: `Cmd + Shift + 4` → `Space`
- クリップボード保存: 上記に `Ctrl` 追加

### エディタ / ターミナル推奨
- VS Code フォント: SF Mono / JetBrains Mono 14pt
- VS Code テーマ: Dark+ (default) または GitHub Light (背景が真っ黒すぎないもの)
- ウィンドウサイズ: 1400×900 (2 ペインに耐える幅)
- ターミナル: フォント 14pt、背景 `#1E1E1E` or `#FAFAFA`、1200×800

### マスキング原則
- 自治体名・部署名・職員名 → `○○市` `総務課` `田中太郎` 等の架空
- `/Users/<実名>/...` → `/Users/user/...`
- ホスト名 → `koumuin-mac`
- session_id / prompt_hash / prev_hash → そのまま (個人特定不可)
- IP アドレス → `192.0.2.10` (RFC 5737 ドキュメント用)
- ユーザー名フィールド `"user":` → `"user":"user01"` 等の伏字

### 保存先
- ディレクトリ: `docs/31_note記事原稿/koumuin-claude-code/12-audit-ready-settings/images/`
- 命名規則: `screenshot-N-<short>.png`
- 圧縮: 500KB 超は `pngquant --quality=70-90` で再圧縮

## 撮影リスト

### Shot 1: settings.json (hooks ハイライト) + audit JSONL 縦並び比較

- **本文位置**: 「### Step 2: settings.json の hooks 定義」の `PostToolUse` JSON ブロック直後
- **撮影対象**: VS Code を縦 2 ペインに分割し:
  - 左ペイン: `.claude/settings.json` を開き、`hooks` セクション全体 (UserPromptSubmit / Stop / PostToolUse の 3 ブロック) を選択ハイライトした状態
  - 右ペイン: `.claude/logs/audit/2026-05-18.jsonl` を 5 行ほど表示 (prompt_submit / session_stop / file_change が混在)
- **準備するもの**:
  1. 本記事 Step 2 の `.claude/settings.json` をコピペで作成
  2. `.claude/hooks/log-prompt.mjs` `log-stop.mjs` `log-file-change.mjs` を Step 3 コード相当で作成し chmod +x
  3. Claude Code を 1 セッション実行し、JSONL を 5-10 行ほど自然に生成
  4. VS Code で両ファイルを開いておく
- **マスキング項目**:
  - JSONL 内 `"user":` フィールド → `"user":"user01"` に置換
  - `"host":` → `"host":"koumuin-mac"` に置換
  - `"cwd":` → `"cwd":"/Users/user/projects/koumuin-demo"` に置換
  - `prompt_hash` / `prev_hash` / `session_id` はそのままで OK
  - VS Code 左下のブランチ名・Git 情報に実在組織名があれば塗りつぶし
  - タブバーに他ファイルパスがあれば閉じる
- **推奨ファイル名**: `screenshot-1-settings-and-audit-log.png`
- **撮影手順**:
  1. VS Code を 1400×900 にリサイズ
  2. `Cmd + \` で縦 2 ペイン分割
  3. 左ペインで `.claude/settings.json` を開き、hooks セクション (約 40 行) を範囲選択 (`Shift + ↓` で複数行選択)
  4. 右ペインで `.claude/logs/audit/2026-05-18.jsonl` を開き、先頭 5 行が見えるようスクロール
  5. ステータスバー・サイドバーは表示維持 (リアル感)
  6. `Cmd + Shift + 4` → `Space` → VS Code ウィンドウクリックで撮影
  7. プレビューで個人情報フィールド (user/host/cwd) を矩形塗りつぶし + 上書きテキスト

## 撮影後手順

1. PNG を `images/` ディレクトリに保存
2. 500KB 超なら `pngquant --quality=70-90` で圧縮
3. `draft.md` のマーカー行を `![settings.json hooks 定義と監査ログ JSONL の対比](./images/screenshot-1-settings-and-audit-log.png)` に置換
4. 個人情報残存チェック:
   - JSONL 内に実ユーザー名・実ホスト名が残っていないか目視
   - VS Code タイトルバー・サイドバーに `/Users/<実名>/` が見えていないか
   - `pngcheck -t` でメタデータ確認
