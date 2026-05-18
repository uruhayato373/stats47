---
type: screenshot-guide
slug: mcp-internal-system
article_title: MCP server を庁内システムにつなぐ実験 (架空 LGWAN 想定)
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
- `Cmd + Shift + 5` — スクリーンショットアプリ起動

撮影後は `~/Desktop/` に自動保存される。

### 推奨ターミナル設定

- フォントサイズ: 14pt
- ウィンドウサイズ: 1200 × 800 px 前後
- カラースキーム: ダーク背景推奨
- プロンプト: `$ ` のみ

### マスキング原則

- **自治体名・部署名・職員名・課コード** → 「○○市」「総務課」「0001」など伏字 or 架空コード
- **`/Users/<実名>/...`** → `/Users/user/...` に置換
- **業者名・振込先口座・請求書番号** → 完全マスキング（記事の核心が個人情報除去のため特に重要）
- **マイナンバー・電話番号・住所** → 架空値（`090-0000-0000` `[マイナンバー]` 等）
- **メニューバーの Apple ID** → ログアウト or トリミング

### 保存先と命名規則

- 保存先: `/Users/minamidaisuke/stats47/docs/31_note記事原稿/koumuin-claude-code/23-mcp-internal-system/images/`
- 命名: `screenshot-N-<short>.png`
- 圧縮後上限: 1 枚 200KB 以下（pngquant）

## 撮影リスト

### Shot 1: MCP tool 呼び出し → CSV 取得 → 執行率テーブル生成の対話画面

- **本文位置**: `### ステップ 3: 使用例(実プロンプト)` 直後、`### ステップ 4: セキュリティ設計の鉄則` の前
- **撮影対象**: Claude Code 内で `mcp__finance-adapter__get_budget_execution` ツールが呼び出され、ダミー CSV（架空課×科目の予算執行データ）が取得され、執行率 30% 未満の課を抽出した Markdown テーブルが生成されている対話画面。Tool 呼び出しの吹き出し（ツール名・引数 `year=2026, month=5`）と、後続の整形テーブルが連続して見える状態。
- **準備するもの**:
  - `.claude/mcp-servers/finance-adapter/server.js`（記事中のコード例をそのまま配置、ダミープロジェクトで OK）
  - `.claude/mcp-servers/finance-adapter/data/budget-2026-05.csv` のダミー（架空課コード `0001`〜`0010`、課名「○○課A」「○○課B」など完全架空、当初予算・執行額・備考列を埋める）
  - ダミー CSV 例（10 行程度）:
    ```csv
    課コード,課名,当初予算,執行額,執行率,残額
    0001,総務課,50000000,12000000,24%,38000000
    0002,企画課,30000000,8000000,27%,22000000
    0003,財政課,20000000,15000000,75%,5000000
    ...
    ```
  - `.claude/settings.json` の `mcpServers` セクションに `finance-adapter` を登録
- **マスキング項目**:
  - 課名は実在しない架空名（「総務課A」「企画推進室」など、もしくは「○○課」記号化）
  - 課コードは `0001`〜`0010` の連番ダミー
  - 業者名・取引先名は CSV に含めない（記事の安全設計の主張と整合）
  - サイドバーに本物の MCP server 名（実プロジェクトの mcp__github__ 等）が混在しないようダミープロジェクトで撮影
  - ターミナルパス `/Users/<実名>/` は `/Users/user/...` に偽装 or トリミング
- **推奨ファイル名**: `screenshot-1-mcp-finance-adapter.png`
- **撮影手順**:
  1. `/tmp/mcp-demo/` を作成し、`.claude/mcp-servers/finance-adapter/server.js` と `data/budget-2026-05.csv` をダミーで配置
  2. `.claude/settings.json` に `mcpServers.finance-adapter` を登録（記事中の例をそのままコピー）
  3. `cd /tmp/mcp-demo && claude` で起動
  4. 記事の「ステップ 3: 使用例」プロンプトをそのまま貼り付けて実行
  5. Claude が `mcp__finance-adapter__get_budget_execution` を呼び、CSV 取得 → テーブル整形 → 執行加速提案までの一連のやり取りが画面に並んだ状態で `Cmd + Shift + 4` 縦長範囲選択撮影（ツール呼び出しブロック + 結果テーブルが両方収まるように）

## 撮影後手順

### 1. PNG 保存

```bash
mkdir -p /Users/minamidaisuke/stats47/docs/31_note記事原稿/koumuin-claude-code/23-mcp-internal-system/images
mv ~/Desktop/スクリーンショット*.png \
  /Users/minamidaisuke/stats47/docs/31_note記事原稿/koumuin-claude-code/23-mcp-internal-system/images/screenshot-1-mcp-finance-adapter.png
```

### 2. pngquant で圧縮

```bash
cd /Users/minamidaisuke/stats47/docs/31_note記事原稿/koumuin-claude-code/23-mcp-internal-system/images
pngquant --quality=65-85 --ext=.png --force screenshot-1-mcp-finance-adapter.png
```

縦長で 200KB を超える場合は `--quality=50-75` まで下げる。

### 3. draft.md のマーカー置換

`> 📸 [スクリーンショット] ...` 行を以下に置換する。

```markdown
![Claude Code 内で MCP tool が呼び出されて CSV が取得され執行率テーブルが生成される対話画面](./images/screenshot-1-mcp-finance-adapter.png)
```

### 4. 個人情報残存チェック（記事の主題が情報セキュリティのため最重要）

- [ ] 自治体名・実在課名・職員名が残っていないか拡大目視
- [ ] 実在の業者名・取引先・振込先口座が CSV に残っていないか
- [ ] マイナンバー・電話番号・住所が露出していないか
- [ ] `/Users/<実名>/` がパス表示に残っていないか
- [ ] Slack/Teams/メール通知バナーが映り込んでいないか
- [ ] 他プロジェクトの MCP server 名（mcp__github__ 等）が混入していないか
- [ ] git ブランチ名にプロジェクト名・組織名が入っていないか
- [ ] Apple ID / iCloud アカウント名がメニューバーに残っていないか

問題があれば再撮影 or Preview.app で矩形塗りつぶし後に再圧縮。記事テーマ上、個人情報残存は致命的なので二重チェック推奨。
