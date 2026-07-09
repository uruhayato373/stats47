---
type: screenshot-guide
slug: proposal-doc-checklist-20
article_title: 起案文・決裁文の AI 査読チェックリスト 20 項目
total_shots: 1
created: 2026-05-18
status: draft
---

# 起案文・決裁文の AI 査読チェックリスト 20 項目 — スクリーンショット撮影ガイド

## 撮影前準備

### macOS 撮影コマンド

- 全画面: `Cmd + Shift + 3`
- 範囲: `Cmd + Shift + 4`
- ウィンドウ: `Cmd + Shift + 4` + Space

### ターミナル設定推奨

- フォント 14pt (SF Mono / JetBrains Mono)
- 背景 #1E1E1E (ダーク) or #FAFAFA (ライト)
- ウィンドウサイズ 1400×900px (5 列 × 20 行表が折り返さない幅)
- 横スクロールせずに 5 列 markdown 表が見える幅を確保

### マスキング原則

- 自治体名・部署名・職員名 → 伏字 or 架空名 (例: 「〇〇市」「企画課」「企画太郎」)
- 案件名 → 架空案件 (例: 「市民活動支援補助金交付要綱の制定について」)
- `/Users/<実名>/...` → `/Users/user/...`
- 想定指摘者 (上席 / 財政 / 法務 / 副市長 / 市長) はロール名のみで OK、実名 NG
- 金額・予算・補助対象団体名は架空値に差し替え

### 保存先

- `docs/31_note記事原稿/koumuin-claude-code/08-proposal-doc-checklist-20/images/` 配下
- 命名規則: `screenshot-N-<short>.png`

## 撮影リスト

### Shot 1: ステップ 2-3 査読結果の markdown 表出力例 (5 列 × 20 行)

- **本文位置**: L129 (「ステップ 3: 出力を起案前に修正」直後)
- **撮影対象**: Claude Code が出力した markdown 表。5 列 (# / 項目 / 判定 / 該当箇所 (引用 20 字) / 想定指摘者 / 想定指摘文) × 20 行 + 集計行 1 行
- **準備するもの**:
  - 架空起案文 (`draft.txt` 程度) を `~/work/proposal-sample/` に配置
  - 本文 L70 付近の 20 項目プロンプトをコピーして実行 (架空起案文に対して)
  - もしくは Claude Code 出力をテキストファイルに事前生成しておき、`cat result.md` で表示するだけでもよい
  - 表が崩れないよう `glow` (`brew install glow`) でレンダリングして撮るのもアリ
- **マスキング項目**:
  - 「該当箇所 (引用 20 字)」列に映る原文は架空案件の文 (補助金要綱の架空条文等) に差し替え
  - 「想定指摘者」列はロール名のみ (例: 「上席」「財政課長」)、実名 NG
  - ターミナル上部のタブタイトル `~/work/proposal-sample` などホームディレクトリ表記は中立化
- **推奨ファイル名**: `screenshot-1-checklist-markdown-table.png`
- **撮影手順**:
  1. 架空起案文サンプルを作成: `mkdir -p ~/work/proposal-sample && cat > ~/work/proposal-sample/draft.txt` で適当な要綱案を 20 行程度
  2. Claude Code で本文 L70 付近の 20 項目プロンプト (`@draft.txt の以下を 20 項目で査読してください...`) を実行
  3. 出力された markdown 表が画面に表示された状態を確認
  4. ターミナルを 1400×900 にリサイズ
  5. 集計行 (「OK: N 件、要確認: N 件、欠落: N 件。優先修正: # X, Y, Z」) まで含めて `Cmd+Shift+4` + Space でウィンドウキャプチャ
  6. 縦に長い場合は `Cmd+Shift+4` 範囲指定で必要部分のみ切り出し
  7. `images/` に保存

## 撮影後の手順

1. PNG を `docs/31_note記事原稿/koumuin-claude-code/08-proposal-doc-checklist-20/images/` に保存
2. 500KB 超なら `pngquant --quality=80-90 --output screenshot-N-<short>.png --force screenshot-N-<short>.png` で圧縮
3. draft.md の `> 📸 [スクリーンショット] ...` 行を以下に置換:
   - L129 → `![Claude Code 査読結果の markdown 表 (5 列 × 20 行 + 集計行)](./images/screenshot-1-checklist-markdown-table.png)`
4. note 投稿前に個人情報残存チェック:
   - 「該当箇所」列の引用文に実案件の固有名詞が残っていないか拡大確認
   - 「想定指摘者」列に実名が混入していないか確認
   - 金額・補助対象団体名が架空値か確認
