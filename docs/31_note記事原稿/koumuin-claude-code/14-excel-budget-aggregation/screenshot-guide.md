---
type: screenshot-guide
slug: excel-budget-aggregation
article_title: Excel 予算ファイルを Claude Code で集計 (pandas / DuckDB 経由)
total_shots: 1
created: 2026-05-18
status: draft
---

# Excel 予算ファイルを Claude Code で集計 — スクリーンショット撮影ガイド

## 撮影前準備

### macOS コマンド
- 全画面: `Cmd + Shift + 3`
- 範囲指定: `Cmd + Shift + 4`
- ウィンドウ単体: `Cmd + Shift + 4` → `Space`
- クリップボード保存: 上記に `Ctrl` 追加

### Excel / Claude Code 推奨
- Excel フォント: 游ゴシック / メイリオ 11pt 標準
- Excel ウィンドウ: 1400×900 程度
- Claude Code: ターミナル幅 120 桁以上推奨
- 2 ペイン表示 (Excel 左 / Claude Code 右) を 1 画面に収める

### マスキング原則 (架空データ提案)
- 課名 → `01_soumu.xlsx` (総務課) / `02_kikaku.xlsx` (企画課) — 一般名詞のみ
- 自治体名 → 含めない (タイトル「2026 年度 5 月補正予算」程度に留める)
- 事業名 → `〇〇推進事業` `△△維持管理費` 等の汎用化
- 担当者名・連絡先 → 削除 or `担当: user01` に伏字
- 金額 → 架空でよい (1,234 千円 等のキリの良い値)
- ファイルパス → `/Users/user/projects/budget-2026-may/`

### 保存先
- ディレクトリ: `docs/31_note記事原稿/koumuin-claude-code/14-excel-budget-aggregation/images/`
- 命名規則: `screenshot-N-<short>.png`
- 圧縮: 500KB 超は `pngquant --quality=70-90` で再圧縮

## 撮影リスト

### Shot 1: Excel 原本 + Claude Code が返す JSON シート構造 (2 ペイン)

- **本文位置**: 「### Step 2: Excel 構造を Claude Code に把握させる」末尾、プロンプト例 (`inputs/01_soumu.xlsx を読んで...`) の直後
- **撮影対象**: 横 2 ペイン分割で:
  - 左ペイン: `inputs/01_soumu.xlsx` を Excel で開いた状態。A1 セルに「単位: 千円」、3 行目までヘッダ、4 行目以降にデータ、結合セルが「款項目」列で確認できる典型的な公務員 Excel レイアウト
  - 右ペイン: Claude Code Chat 画面で、本文プロンプトを送信した応答として返ってきた JSON (シート一覧・skiprows・結合セル列・集計キー列など) が ```json コードブロックで整形表示されている
- **準備するもの**:
  1. 架空の `inputs/01_soumu.xlsx` を作成 (3 シート: 事業別 / 節別 / 款項目別、各 10-20 行のダミーデータ)
  2. A1 セルに「単位: 千円」と明記、ヘッダ 3 行構造
  3. Claude Code セッションを開き、本文記載のプロンプトを実行して JSON 応答を得る
  4. Excel と Terminal/iTerm2 を画面分割 (左右半々)
- **マスキング項目**:
  - Excel タイトルバーのフルパス: `/Users/user/projects/budget-2026-may/inputs/01_soumu.xlsx` 形式に
  - 事業名・担当者名 → 架空名で統一
  - Claude Code 応答内の `cwd` パス → 上記と同じ伏字
  - Excel リボンの個人名・アカウント名 (右上) があれば塗りつぶし
- **推奨ファイル名**: `screenshot-1-excel-structure-json.png`
- **撮影手順**:
  1. Excel で `01_soumu.xlsx` を開き、シート「事業別」を表示、ヘッダ + 5-10 行のデータが見える位置にスクロール
  2. Excel ウィンドウを画面左半分にリサイズ
  3. Claude Code ターミナルを右半分にリサイズ
  4. Claude Code で本文プロンプト (`inputs/01_soumu.xlsx を読んで...`) を実行
  5. JSON 応答 (シート構造一覧) が右ペインに表示完了したことを確認
  6. `Cmd + Shift + 3` で全画面 (両ペイン含む) を撮影
  7. プレビューで個人情報塗りつぶし + 不要な周辺領域を切り抜き

## 撮影後手順

1. PNG を `images/` ディレクトリに保存
2. 500KB 超なら `pngquant --quality=70-90` で圧縮
3. `draft.md` のマーカー行を `![Excel 原本と Claude Code が返すシート構造 JSON の対比](./images/screenshot-1-excel-structure-json.png)` に置換
4. 個人情報残存チェック:
   - Excel 上部 Office アカウント表示に実名が残っていないか
   - 事業名・課名・金額が実データのまま残っていないか
   - Claude Code 応答に実プロジェクト名が混入していないか
   - `pngcheck -t` でメタデータ (Author / Title) 削除確認
