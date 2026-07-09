---
type: screenshot-guide
slug: claude-code-setup-complete
article_title: 自治体職員のための Claude Code 環境構築 完全版 (Windows / Mac / WSL 別)
total_shots: 5
created: 2026-05-18
status: draft
---

# 自治体職員のための Claude Code 環境構築 完全版 — スクリーンショット撮影ガイド

## 撮影前準備

### macOS 撮影コマンド
- 全画面: `Cmd + Shift + 3` → デスクトップに保存
- 範囲指定: `Cmd + Shift + 4` → 範囲ドラッグ → デスクトップに保存
- ウィンドウ単位: `Cmd + Shift + 4` → Space キー → ウィンドウクリック
- 動画録画: `Cmd + Shift + 5` (本記事は静止画のみ)

### ターミナル設定 (推奨)
- フォントサイズ: 14pt (記事内で読める最小)
- 背景: #1E1E1E (ダーク) または #FAFAFA (ライト)、記事内 SVG とトーン合わせる
- ウィンドウサイズ: 1200 × 800 px 程度
- プロンプト短縮: `PS1='%n@local %~ %# '` 程度で `\h` や絶対パスを隠す

### マスキング原則
- 自治体名・組織名・部署名・職員名は **すべて伏字** または **架空名 (〇〇市・△△課) に置換**
- ホームディレクトリパス `/Users/<実名>/...` → `/Users/user/...` に置換 (Terminal の PROMPT を short にする)
- メールアドレス・電話番号・住所は完全マスキング
- API キー (`sk-ant-...`) は **必ず先頭 8 文字 + `...`** に手動マスキング (画像編集ツールで黒塗り)

### 保存先
- `docs/31_note記事原稿/koumuin-claude-code/01-claude-code-setup-complete/images/` 配下
- ファイル名: `screenshot-N-<short-desc>.png` (N は本文の登場順)

## 撮影リスト

### Shot 1: Anthropic コンソールのサインアップ画面

- **本文位置**: 94 行目 (手順 1-1「個人用 Anthropic アカウントを作る」直後)
- **撮影対象**: `https://console.anthropic.com` のサインアップ画面、または初回ログイン後の API Keys 発行欄
- **準備するもの**: ブラウザ (Safari / Chrome)、シークレットモード推奨 (既存セッションを避ける)
- **マスキング項目**: 個人メールアドレスは仮名 (`example@gmail.com`) に画像編集で置換、API キー文字列は黒塗り
- **推奨ファイル名**: `screenshot-1-anthropic-console.png`
- **撮影手順**:
  1. シークレットウィンドウで `https://console.anthropic.com` を開く
  2. サインアップフォームに架空 Gmail を入力した状態をキャプチャ、または `Settings → API Keys` の新規発行ダイアログを表示
  3. `Cmd + Shift + 4` でブラウザの該当領域を範囲指定キャプチャ
  4. Preview.app で個人メール・API キーを黒塗り

### Shot 2: `node -v` で v20 系が表示されるターミナル画面

- **本文位置**: 147 行目 (手順 2-1 Mac 用 Node.js インストール後)
- **撮影対象**: `node -v` と `npm -v` を続けて実行、`v20.x.x` のバージョン番号が見える状態
- **準備するもの**: Homebrew で `node@20` をインストール済みの Mac、ターミナル
- **マスキング項目**: ターミナルのプロンプト (ホスト名・ユーザー名) を短縮プロンプトに切替
- **推奨ファイル名**: `screenshot-2-node-version.png`
- **撮影手順**:
  1. ターミナルを開き、プロンプトを短縮 (`PS1='> '` を一時設定)
  2. `clear` で画面をクリア
  3. `node -v` `npm -v` を順次実行
  4. `Cmd + Shift + 4 → Space` でターミナルウィンドウのみ撮影

### Shot 3: PowerShell `wsl --install` と Ubuntu 初回起動

- **本文位置**: 246 行目 (手順 3-1 WSL2 の有効化)
- **撮影対象**: (a) PowerShell 管理者で `wsl --install -d Ubuntu-22.04` を実行している画面、(b) 再起動後の Ubuntu 初回起動でユーザー名入力プロンプト
- **準備するもの**: Windows 11 私物 PC、管理者権限の PowerShell
- **マスキング項目**: Windows ユーザー名 (パス `C:\Users\<name>` 部分)、ホスト名は架空名 (`HOME-PC`) に
- **推奨ファイル名**: `screenshot-3-wsl-install.png` (2 枚連結 or 1 枚に集約)
- **撮影手順**:
  1. PowerShell を管理者で起動、`wsl --install -d Ubuntu-22.04` 実行中の画面を `Win + Shift + S` でキャプチャ (※Windows 側操作)
  2. 再起動後、Ubuntu 初回起動の `Enter new UNIX username:` プロンプトを同様にキャプチャ
  3. Mac に転送後、Preview.app で 2 枚を上下に連結
  4. ユーザー名・ホスト名箇所を画像編集で `user` `HOME-PC` に塗り替え

### Shot 4: VS Code WSL 接続 + Claude Code 起動

- **本文位置**: 295 行目 (手順 3-4 VS Code との連携)
- **撮影対象**: VS Code 左下に **緑色のインジケータ + 「WSL: Ubuntu-22.04」** が表示され、統合ターミナルで `claude` コマンドが起動して対話プロンプトが出ている画面
- **準備するもの**: Windows + WSL2 + VS Code (Remote-WSL 拡張)、Claude Code インストール済み
- **マスキング項目**: ワークスペース名 (画面左上のタイトルバー)、ファイルツリーに業務ファイル名がないこと
- **推奨ファイル名**: `screenshot-4-vscode-wsl-claude.png`
- **撮影手順**:
  1. WSL ターミナルで `mkdir ~/work/demo && cd ~/work/demo && code .`
  2. VS Code が開いたら、統合ターミナルで `claude` を起動
  3. 対話プロンプトの待機画面 (空のプロジェクト)
  4. VS Code ウィンドウ全体を `Win + Shift + S` でキャプチャ
  5. 不要なファイルツリーは事前に消しておく

### Shot 5: よくあるエラー画面 (407 / Authentication failed)

- **本文位置**: 388 行目 (よくあるつまずきポイントの表直下)
- **撮影対象**: ターミナルに (a) `npm install` 実行時の HTTP 407 エラー出力、(b) `claude` 起動時の `Authentication failed` エラーが並んでいる画面
- **準備するもの**: プロキシ未設定状態 or 不正な API キーを設定したターミナル (デモ用に意図的に再現)
- **マスキング項目**: プロキシ URL (組織名が入っている可能性) は `proxy.example.local:8080` に置換、API キーは黒塗り
- **推奨ファイル名**: `screenshot-5-common-errors.png`
- **撮影手順**:
  1. デモ用にダミー API キーをセット: `export ANTHROPIC_API_KEY=sk-ant-invalid`
  2. `claude` 起動 → `Authentication failed` を出す
  3. 別途、`HTTP_PROXY=http://invalid:8080 npm install -g @anthropic-ai/claude-code` で 407 を再現
  4. 両出力が同じ画面に並んだ状態でターミナルキャプチャ
  5. プロキシ URL を Preview.app で塗り替え

## 撮影後の手順

1. 全 PNG を `01-claude-code-setup-complete/images/` に保存
2. ファイルサイズが 500KB 超なら `pngquant --quality=80-90 images/*.png --ext .png --force` で圧縮
3. draft.md 内の各 `> 📸 [スクリーンショット] ...` マーカーを以下に置換:
   ```markdown
   ![<alt>](./images/screenshot-N-<short>.png)
   ```
4. note 投稿前に最終確認: 個人メール・API キー・自治体名・実ホスト名が残っていないか目視チェック
