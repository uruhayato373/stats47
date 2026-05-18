---
type: screenshot-guide
slug: faq-auto-generation
article_title: 住民問い合わせ FAQ を Claude Code で自動生成
total_shots: 1
created: 2026-05-18
status: draft
---

# 撮影ガイド: 住民問い合わせ FAQ を Claude Code で自動生成

## 撮影前準備

### macOS スクリーンショットコマンド

```bash
# 範囲選択 (推奨): Shift + Command + 4
# ウィンドウ単一: Shift + Command + 4 → Space → クリック
# 全画面: Shift + Command + 3
# クリップボード保存: 上記コマンドに Control を追加
```

### ターミナル / エディタ推奨設定

- ターミナル: iTerm2 または macOS Terminal、フォント `JetBrains Mono 14pt`、配色 `Solarized Dark`
- markdown テーブル 6 列分の幅を確保 (~1280px 推奨)
- Claude Code 出力のテーブル罫線が崩れないよう、フォントは等幅必須

### マスキング原則

- 自治体名・課名 → `〇〇市` / `△△課` 等の架空名
- 問い合わせ者名・電話番号・メールアドレス → 完全削除 (そもそも入力 CSV から除外)
- 質問本文 → **完全に架空のサンプル** に置換 (実問い合わせ記録は使用不可)
- 主管課名 → 架空または黒塗り
- ファイルパスの `/Users/<実名>/` → `/Users/user/`
- 根拠条文の自治体例規番号 → ダミー (例: `〇〇市税条例第N条`)

### 保存先

```bash
mkdir -p /Users/minamidaisuke/stats47/docs/31_note記事原稿/koumuin-claude-code/19-faq-auto-generation/images/screenshots
```

---

## 撮影リスト

### Shot 1: /faq-cluster 実行後のクラスタ表

- **本文位置**: Step 2 直後 (draft.md 95 行目)
- **撮影対象**: ターミナル上で `/faq-cluster` スキルを実行した結果。`クラスタID | 代表質問 | 件数 | サンプル質問 | 主管課 | 共通根拠条文` の 6 列 markdown テーブルと、末尾の「クラスタ総数」「FAQ化推奨件数」が見える状態
- **準備するもの**:
  - 架空の問い合わせ CSV を 50-100 件用意 (例: 納付書再発行 / 住民票取得 / 保育園入所 / 粗大ごみ / 転入届)
  - 同義語のバリエーション (「納付書失くした」「再発行してほしい」等) を意図的に混ぜる
  - `.claude/skills/faq-generator/SKILL.md` 雛形
  - 主管課は架空 (`税務課` / `市民課` / `保育課` 等の一般名でもよいが、固有自治体に紐づかないこと)
- **マスキング項目**:
  - 問い合わせ者の個人特定情報 (CSV 段階で必ず削除)
  - クラスタ表内のサンプル質問 → 架空文に書き換え
  - 主管課名 → 黒塗りまたは一般名
  - 根拠条文 → ダミー条例番号
  - ターミナルプロンプトの `user@host` の host が `<実名>.local` なら上書き
  - 入力 CSV ファイル名 `inquiries-{YYYY-MM}.csv` の YYYY-MM はサンプル年月 (例: `2026-04`) でよい
- **推奨ファイル名**: `shot-01-faq-cluster-table.png`
- **撮影手順**:
  1. 架空 CSV を `/tmp/faq-input/inquiries-2026-04.csv` に保存 (列: id, date, question, channel)
  2. ターミナル最大化 → クリア
  3. Claude Code で `/faq-cluster inquiries-2026-04` 等を実行
  4. 6 列テーブル全幅 + 末尾 2 行サマリが収まる位置で停止
  5. `Shift + Command + 4 → Space` でウィンドウ単体撮影
  6. プレビュー.app で課名・条文番号・ホスト名等の残存マスキング項目を黒塗り
  7. クラスタの代表質問が実問い合わせを匂わせる表現になっていないか最終確認

---

## 撮影後手順

1. **PNG 保存先**: `images/screenshots/shot-01-faq-cluster-table.png`
2. **pngquant 圧縮**:
   ```bash
   pngquant --quality=70-90 --ext=.png --force \
     images/screenshots/shot-01-faq-cluster-table.png
   ```
3. **draft.md マーカー置換** (95 行目):
   ```markdown
   ![/faq-cluster 実行後のクラスタ表](./images/screenshots/shot-01-faq-cluster-table.png)
   ```
4. **個人情報チェック**:
   - 問い合わせ者の氏名・連絡先・住所が CSV 段階から完全に除外されているか
   - クラスタ表のサンプル質問が架空文か (固有名詞・日付・金額が実態を示していないか)
   - 主管課名・条例番号が架空 or マスキング済みか
   - ターミナルプロンプトのホスト名 (`<実名>.local`) が出ていないか
   - macOS メニューバーのユーザー名・通知バナーが映り込んでいないか
