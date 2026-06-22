---
type: screenshot-guide
slug: monthly-routine-skills
article_title: .claude/skills で「毎月の定型業務」を 1 コマンド化する
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
- `Cmd + Shift + 5` — スクリーンショットアプリ起動（タイマー・録画も可）

撮影後は `~/Desktop/` に自動保存される。

### 推奨ターミナル設定

- フォントサイズ: 14pt
- ウィンドウサイズ: 1200 × 800 px 前後
- カラースキーム: ダーク背景推奨
- プロンプト: `$ ` のみ（マスキング工数削減）

### マスキング原則

- **自治体名・部署名・職員名** → 「○○市」「△△課」「田中」など伏字 or 架空名
- **`/Users/<実名>/...`** → `/Users/user/...` に置換
- **メール・電話・住所** → 完全マスキング
- **Slack/Teams 通知** → スクショ前にミュート
- **メニューバーの Apple ID** → ログアウト or トリミング

### 保存先と命名規則

- 保存先: `/Users/minamidaisuke/stats47/docs/31_note記事原稿/koumuin-claude-code/22-monthly-routine-skills/images/`
- 命名: `screenshot-N-<short>.png`
- 圧縮後上限: 1 枚 200KB 以下（pngquant）

## 撮影リスト

### Shot 1: 4 つの Skills 一覧表示画面

- **本文位置**: `### パターン 4: 決裁簿の月次集計` 末尾、`### Skills 設計の鉄則 5 つ` の前
- **撮影対象**: Claude Code 内で `/skills` コマンドを実行し、`monthly-report` / `inquiry-aggregate` / `subsidy-consistency-check` / `kessai-bo-monthly` の 4 スキルが一覧表示されている画面。各スキルの description（短い説明）も見えている状態。
- **準備するもの**:
  - 以下 4 ファイルをダミープロジェクトに作成:
    - `.claude/skills/management/monthly-report/SKILL.md`
    - `.claude/skills/assembly/inquiry-aggregate/SKILL.md`
    - `.claude/skills/subsidy/subsidy-consistency-check/SKILL.md`
    - `.claude/skills/kessai/kessai-bo-monthly/SKILL.md`
  - 各 SKILL.md の frontmatter に `name:` と `description:` を必ず記述（記事中のサンプルからコピー可）
- **マスキング項目**:
  - サイドバーに他のスキル（実プロジェクトの skill 一覧）が混在しないよう、撮影用ダミープロジェクトを別ディレクトリに用意
  - ターミナルのカレントパスが `/Users/<実名>/...` を含む場合 → `cd /tmp/skill-demo` で実行
  - 4 スキル以外が一覧に出る場合はトリミング
- **推奨ファイル名**: `screenshot-1-four-skills-list.png`
- **撮影手順**:
  1. `/tmp/skill-demo/` を作成し、上記 4 つの SKILL.md をダミーで配置（各 10-20 行で十分）
  2. `cd /tmp/skill-demo && claude` で起動
  3. プロンプト欄に `/skills` と入力（または `/help` で skill 一覧が出るコマンドを実行）し、4 スキル名と description が並んで表示された画面で `Cmd + Shift + 4` 範囲選択撮影

## 撮影後手順

### 1. PNG 保存

```bash
mkdir -p /Users/minamidaisuke/stats47/docs/31_note記事原稿/koumuin-claude-code/22-monthly-routine-skills/images
mv ~/Desktop/スクリーンショット*.png \
  /Users/minamidaisuke/stats47/docs/31_note記事原稿/koumuin-claude-code/22-monthly-routine-skills/images/screenshot-1-four-skills-list.png
```

### 2. pngquant で圧縮

```bash
cd /Users/minamidaisuke/stats47/docs/31_note記事原稿/koumuin-claude-code/22-monthly-routine-skills/images
pngquant --quality=65-85 --ext=.png --force screenshot-1-four-skills-list.png
```

### 3. draft.md のマーカー置換

`> 📸 [スクリーンショット] ...` 行を以下に置換する。

```markdown
![4 つの Skills を一覧表示する Claude Code 画面 monthly-report / inquiry-aggregate / subsidy-consistency-check / kessai-bo-monthly](./images/screenshot-1-four-skills-list.png)
```

### 4. 個人情報残存チェック

- [ ] 自治体名・部署名・職員名が残っていないか拡大目視
- [ ] `/Users/<実名>/` がパス表示に残っていないか
- [ ] Slack/Teams/メール通知バナーが映り込んでいないか
- [ ] 他プロジェクトのスキル名が一覧に混入していないか
- [ ] git ブランチ名にプロジェクト名が入っていないか
- [ ] Apple ID / iCloud アカウント名がメニューバーに残っていないか

問題があれば再撮影 or Preview.app で矩形塗りつぶし後に再圧縮。
