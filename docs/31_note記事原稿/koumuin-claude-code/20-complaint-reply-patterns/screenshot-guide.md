---
type: screenshot-guide
slug: complaint-reply-patterns
article_title: 苦情メール返信案を 5 パターン出す prompt
total_shots: 1
created: 2026-05-18
status: draft
---

# 撮影ガイド: 苦情メール返信案を 5 パターン出す prompt

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
- 5 パターン × 300-400 字を 1 画面に収めるため、ウィンドウ高さは 1200px 以上推奨
- 折り返しを避けるためターミナル幅は ~1280px

### マスキング原則

- 苦情送信者の氏名・住所・連絡先 → CSV / 入力段階から完全除外
- 苦情本文 → **完全に架空のサンプル** (実苦情の写しは使用不可、SNS 拡散リスクに直結)
- 自治体名・部署名・首長名 → `〇〇市` / `△△課` / `市長` (固有名詞回避)
- 担当職員名 → 黒塗り
- ファイルパスの `/Users/<実名>/` → `/Users/user/`
- 例示する制度名・施設名が固有自治体に紐づく場合は架空化

### 保存先

```bash
mkdir -p /Users/minamidaisuke/stats47/docs/31_note記事原稿/koumuin-claude-code/20-complaint-reply-patterns/images/screenshots
```

---

## 撮影リスト

### Shot 1: 5 案を並べた出力例

- **本文位置**: Step 3 直後 (draft.md 171 行目)
- **撮影対象**: Claude Code で苦情返信生成 prompt を実行した結果。5 つのパターン (全面謝罪型 / 制度説明型 / 中庸型 / 部分受容型 / 毅然型) がそれぞれ 300-400 字で並び、各案末尾に「想定リスク」1 行が付いている状態
- **準備するもの**:
  - 架空の苦情メール 1 本 (例: ゴミ収集の時間に関する苦情、公園利用ルールへの不満 等、政治的に中立なテーマ)
  - `.claude/skills/complaint-reply/SKILL.md` + 5 パターン重み付けの reference 雛形
  - ターミナルは 5 案すべてが見切れない高さで撮影 (必要なら縦長スクリーンショット推奨)
- **マスキング項目**:
  - 苦情本文中の固有名詞 (施設名・路線名・店舗名等) → 架空化または `〇〇` 表記
  - 5 案中に出てくる自治体名・課名・首長名 → 架空名
  - 根拠条文や条例番号 → ダミー (例: `〇〇市公園条例第N条`)
  - ターミナルプロンプトの `user@host` の host が `<実名>.local` なら上書き
  - 案 5 (毅然型) が政治的・差別的表現になっていないか必ず事前確認
- **推奨ファイル名**: `shot-01-five-reply-patterns.png`
- **撮影手順**:
  1. 架空苦情を `/tmp/complaint-input/case-001.txt` に保存
  2. ターミナル最大化 (またはウィンドウ高さを 1400px 程度に拡大)
  3. Claude Code で `/complaint-reply case-001` 等を実行
  4. 5 パターン × 想定リスクが 1 画面に収まる位置で停止 (収まらなければ縦長キャプチャを優先)
  5. `Shift + Command + 4 → Space` でウィンドウ単体撮影
  6. プレビュー.app で自治体名・課名・条文・ホスト名等を黒塗り
  7. 出力された 5 案を再読し、特定自治体・特定事案を連想させる表現が残っていないか確認

---

## 撮影後手順

1. **PNG 保存先**: `images/screenshots/shot-01-five-reply-patterns.png`
2. **pngquant 圧縮**:
   ```bash
   pngquant --quality=70-90 --ext=.png --force \
     images/screenshots/shot-01-five-reply-patterns.png
   ```
3. **draft.md マーカー置換** (171 行目):
   ```markdown
   ![5 案を並べた苦情返信出力例](./images/screenshots/shot-01-five-reply-patterns.png)
   ```
4. **個人情報チェック**:
   - 苦情送信者の氏名・住所・連絡先・送信日時が一切残っていないか
   - 苦情本文が実事案を匂わせる固有名詞 (施設・路線・店舗・人名) を含まないか
   - 自治体名・部署名・首長名・職員名がすべて架空 or マスキング済みか
   - 5 案中に政治的に偏った表現・差別的表現が混入していないか
   - ターミナルプロンプトのホスト名 (`<実名>.local`) が出ていないか
   - macOS メニューバーのユーザー名・通知バナーが映り込んでいないか
