---
name: notebooklm-research
description: >
  NotebookLM CLI (notebooklm Python v0.3.4) を使って既存ブログ記事を深掘り調査し、
  e-Stat 白書・政府統計・過去ブログ記事などを横断クエリした引用根拠をもとに
  内容を補強する Orchestrator スキル。.claude/scripts/notebooklm-cross-query.mjs
  ラッパーで根拠収集 → 記事に反映する。Use when user says
  "NotebookLM で調べて", "深掘り調査", "引用根拠で記事補強", "白書で補強",
  "/notebooklm-research".
---

# /notebooklm-research — NotebookLM 起点のブログ記事内容補強

`.claude/scripts/notebooklm-cross-query.mjs` でノートブックを横断クエリし、根拠付きで stats47 のブログ記事 (`.local/r2/app/blog/<slug>/article.md`) を補強する。

**構造・書式の修正** (frontmatter / chart placeholder / 出典) は `/proofread-article` で別途対応。本スキルは **白書・政府統計由来の概念・背景・事例を内容として追加すること** だけに集中する。

> **本スキルは aggregator orchestrator。** Claude が NotebookLM の回答を解釈して記事に反映する。AI 生成感を避けるため、テキストをそのまま転記せず再構成すること。

## 前提条件

### notebooklm CLI

stats47 / doboku-note 共通の `~/bin/notebooklm` (Python venv ラッパー、v0.3.4)。

```bash
notebooklm --version   # 0.3.4 以上を確認
notebooklm login       # 認証期限切れ時はユーザーが手動実行 (インタラクティブ OAuth)
notebooklm list --json | jq '.[] | {title, id}'  # 利用可能ノートブック確認
```

**初回 setup (CLI 未 install の環境)**:
```bash
# doboku-note 側で行った install を stats47 環境でも実施
# 2026-05-18 時点で Mac 環境では未 install のため、最初に下記を実行
python3 -m venv ~/.notebooklm-venv
~/.notebooklm-venv/bin/pip install notebooklm
mkdir -p ~/bin
cat > ~/bin/notebooklm << 'EOF'
#!/bin/bash
source ~/.notebooklm-venv/bin/activate
exec notebooklm "$@"
EOF
chmod +x ~/bin/notebooklm
~/bin/notebooklm --version  # 0.3.4 以上を確認
~/bin/notebooklm login      # 初回 OAuth 認証
```

setup 後、`PATH` に `~/bin` が含まれていれば `notebooklm` コマンドが直接使える。

`nlm cross query` 相当のサブコマンドが現行 CLI にないため、本プロジェクトでは決定論的ラッパー `.claude/scripts/notebooklm-cross-query.mjs` を経由する。実態は `notebooklm list --json` で ID 解決 + `notebooklm ask -n <id> --json "..."` を逐次実行する形。

### stats47 用ノートブック (要事前作成)

stats47 ではまだ専用ノートブックが未作成。**初回利用時にユーザーが NotebookLM UI から作成する必要あり**。推奨ノートブック構成:

| ノートブック名 | 推奨ソース |
|---|---|
| **stats47 e-Stat 白書** | 国民生活白書 / 厚生労働白書 / 環境白書 / 防災白書 / 交通安全白書 / 観光白書 等 (e-Stat や政府刊行 PDF) |
| **stats47 過去ブログ記事** | `.local/r2/app/blog/*/article.md` の主要記事 50-100 本 |
| **stats47 都道府県基礎データ** | 政府統計年鑑 / 都道府県統計協議会データ / RESAS 出力 PDF |
| **stats47 競合分析** | todo-ran / uub / city.j-towns 等の参考ページ (PDF 化して登録) |

ノートブック作成後、`notebooklm list --json` で取得した ID を本 SKILL.md の「利用可能ノートブック」表に追記する。

### 利用可能ノートブック (作成済み次第追記)

| ノートブック名 | ID | 用途 |
|---|---|---|
| (未作成) | — | — |

> 初回 ID 登録時は `.claude/scripts/notebooklm-notebook-builder.mjs` でも自動構築可能。

## 引数

```
/notebooklm-research <slug> [--notebooks "名前1,名前2"] [--auto]
```

| 引数 | 説明 |
|---|---|
| `<slug>` | ブログ記事 slug (例: `manufacturing-aichi-dominance`) |
| `--notebooks` | クエリするノートブック名 (省略時は「stats47 e-Stat 白書」想定、未作成時はユーザー確認) |
| `--auto` | 確認ステップをスキップして一気に進む |

## 実行フロー

### Step 1: 記事読み込みとクエリ設計

1. `.local/r2/app/blog/<slug>/article.md` を Read (公開済記事の場合)
   または `docs/21_ブログ記事原稿/<slug>/article.md` (下書き段階の場合)
2. `title` / `description` / 現在の H2 構成から「何が不足しているか」を判断
3. 補強の観点を以下から選ぶ:

| 観点 | クエリ方針 |
|---|---|
| **背景・社会的文脈** | なぜこの指標が話題になるか、白書での扱い、政策的背景 |
| **数字の解釈** | 上位/下位都道府県の社会的特徴、歴史的変化、地域経済との関連 |
| **事例** | 具体的な自治体施策、企業事例、地域プロジェクト |
| **国際比較** | OECD・WHO 等のデータと日本の位置づけ |
| **関連指標** | 同じテーマを別角度から見る指標 (相関しうる他統計) |

### Step 2: notebooklm-cross-query を実行

エージェントの Bash ツールから決定論的ラッパーを呼ぶ:

```bash
node .claude/scripts/notebooklm-cross-query.mjs \
  --notebooks "stats47 e-Stat 白書" \
  "「{title}」に関連して、{補強したい観点} を白書の記述から教えてください。"
```

複数ノートブック横断:
```bash
node .claude/scripts/notebooklm-cross-query.mjs \
  --notebooks "stats47 e-Stat 白書,stats47 過去ブログ記事" \
  "「製造品出荷額の都道府県格差」について、歴史的背景・上位県の産業集積・過去記事での扱いをまとめてください。"
```

`--json` を付けると構造化出力 (answer + references) を返す:
```bash
node .claude/scripts/notebooklm-cross-query.mjs --json \
  --notebooks "stats47 e-Stat 白書" "..."
```

**認証エラー時**: ラッパーが exit 2 + `notebooklm login` の指示を返す。ユーザーが手動で `notebooklm login` を実行 → 再試行。

クエリ結果を構造化して保持:
```
=== findings: {slug} ===
[背景・社会的文脈] ...
[数字の解釈] ...
[事例] ...
[国際比較] ...
[関連指標] ...
```

### Step 3: 記事へ反映

Edit ツールで article.md を直接修正する。

**補強の原則**:
- NotebookLM の文言をそのまま転記しない (要約・再構成する)
- 各 H2 の散文導入を充実させる
- 新しい概念は既存の構成に自然に組み込む (H2 を安易に追加しない)
- `<data-source>` で白書出典を明記、`<source-link>` で URL 化 (md-syntax 準拠)
- frontmatter の `updatedAt` を今日の日付に更新

**反映先の目安** (stats47 ブログ記事の典型 H2 構成):

| findings の種類 | 反映先 |
|---|---|
| 背景・社会的文脈 | 「〜とは何か」「なぜ注目されるか」の散文導入 |
| 数字の解釈 | 「1 位 / 47 位の背景」「格差の要因」 H2 |
| 事例 | 「自治体の取り組み」「先進事例」 H2 |
| 国際比較 | 「世界との比較」 H2 (もし含める場合) |
| 関連指標 | 「関連ランキング」 H2 (リンク追加) |
| 出典 | 「データの出典」 H2 (`<data-source>` 形式) |

### Step 4: 完了レポートとコミット

```
=== /notebooklm-research: {slug} 完了 ===
クエリ数: N 件
利用ノートブック: {名前 list}
補強した内容:
  - {補強内容 1} ({ノートブック名})
  - {補強内容 2} ({ノートブック名})
反映先: {H2 section list}
```

コミットメッセージ (例):
```
content(blog): {slug} を NotebookLM で内容補強

白書・政府統計から {観点} の根拠を追加し、{H2 section} の散文導入を充実化。
```

## 規約

- **本スキルは aggregator orchestrator**: 新規 API 呼び出しロジックは追加しない、既存ラッパー (`notebooklm-cross-query.mjs`) と Edit の組合せで完結
- **NotebookLM の文言を転記しない**: 必ず要約・再構成して記事の文体に揃える (AI 生成感の回避)
- **出典明記必須**: `<data-source>` `<source-link>` で根拠を URL 化、md-syntax 準拠
- **frontmatter `updatedAt` 更新**: 内容変更があった日付に更新 (lastModified 系の SEO シグナル)
- **構造変更しない**: H2 セクションの追加は最小限、既存構成に組み込むことを優先

## 既知の制約

- ノートブック作成は NotebookLM UI 経由 (CLI でのフル自動化は未対応)
- ノートブックのソース更新 (新規 PDF 追加) もユーザー手動
- クエリ結果の品質は登録 PDF の質に依存 (高品質白書ほど精度高)
- 1 クエリあたり ~30 秒 (notebooklm CLI の API 待ち)、複数ノートブック横断は逐次なので時間がかかる

## 関連

- `/draft-from-trend` (新規記事 orchestrator、本スキルは公開済記事の補強用)
- `/brushup-blog-article` (GSC ベース brushup、本スキルは内容深化用、目的が異なる)
- `/proofread-article` (構造・出典・リンク検証、本スキルと組合せ推奨)
- `/md-syntax` (`<data-source>` `<source-link>` 記法)
- 参考: `/Users/minamidaisuke/doboku-note/.claude/skills/authoring/notebooklm-research/SKILL.md` (原型)
- ラッパー: `.claude/scripts/notebooklm-cross-query.mjs`
- ノートブック構築 (高度): `.claude/scripts/notebooklm-notebook-builder.mjs`

## 完了条件

- [ ] 対象 article.md に補強内容が反映済み
- [ ] 出典 (`<data-source>` / `<source-link>`) 明記
- [ ] frontmatter `updatedAt` 更新
- [ ] H2 構成は維持 (新規追加は最小限)
