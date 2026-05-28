---
name: draft-from-trend
description: トレンド snapshot から記事下書きを自動生成 (discover-trends → plan-blog-trends → fetch-article-data → article.md 雛形 → generate-article-charts の orchestrator)。Use when user says "下書き生成", "ドラフト", "draft-from-trend".
primary_agent: article-writer
---

トレンド snapshot を入力に取り、既存スキルを順番に呼んで `article.md` 雛形 + チャート画像までを一気通貫で生成する **orchestrator スキル**。

**本スキルは実コードを書かない。** 既存スキルを正しい順序で呼び出し、各 phase の入出力を仲介するだけ。新しいスクリプト・ヘルパーは追加しないこと。

## 用途

- `.claude/skills/blog/trends-snapshots/trends-{source}-YYYY-MM-DD.md` から 1 本記事を立ち上げたいとき
- すでに企画 MD が `docs/20_ブログ記事企画/backlog/` にある slug を雛形まで進めたいとき
- 1 回の実行で **1 記事** を作る（バッチ化禁止、品質ゲートが効かなくなるため）

## 引数

```
/draft-from-trend [trend-snapshot-path | slug]
```

- `trend-snapshot-path`: `.claude/skills/blog/trends-snapshots/trends-{source}-YYYY-MM-DD.md`
- `slug`: 既に企画 MD が `docs/20_ブログ記事企画/backlog/` にあるなら slug を直接指定 → Step 1-2 をスキップして Step 3 から開始

## 手順 (6 ステップ)

### Step 1: トレンド採用候補の抽出

1. snapshot を Read し、`マッチ度 ★★★` 以上 / `urgency=high` の候補のみ抽出
2. クロスソースヒット（複数ソースで重複）を最優先、ない場合は単一ソースの最上位 1 件
3. 採用候補がゼロなら **ここで終了** し、`failed: 採用候補なし` を返す（無理に下書きを作らない）

### Step 2: 企画化

`/plan-blog-trends` を実行する。

- 入力: Step 1 で選んだ候補 1 件
- 出力: `docs/20_ブログ記事企画/backlog/trends-YYYY-MM-DD.md` に企画 MD を追記
- frontmatter から **slug を確定**（以降のステップで使用）

### Step 3: データ取得

`/fetch-article-data <slug>` を実行する。

- 出力: `docs/21_ブログ記事原稿/<slug>/data/*.json`
- 内容: ranking（47 都道府県）+ timeseries（複数年）
- e-Stat API 利用は `.claude/rules/estat-api.md` 準拠（年度範囲・地域範囲の指定禁止、全件取得→メモリフィルタ）

### Step 4: article.md 雛形生成

`docs/21_ブログ記事原稿/<slug>/article.md` を新規作成。

- **frontmatter**: `.local/r2/app/blog/ai-claude-code-pref-analysis/article.md` を参考に
  - `title` / `description` / `category` / `tags` / `publishedAt` / `updatedAt` / `author` / `thumbnail` 等
  - `quality_score:` は `lint-article.cjs` があれば実行して書き込み、なければ省略
- **H2 構成 (8-12 セクション)**:
  1. リード文（問題提起・なぜ今このテーマか）
  2. ランキング全体像（チャート 1）
  3. 上位都道府県の特徴
  4. 下位都道府県の特徴
  5. 上位下位比較（チャート 2）
  6. 時系列推移（チャート 3）
  7. 地域・気候・産業など外的要因の考察
  8. データ出典
  9. 関連ランキング・参考記事
- **チャート placeholder**: `<!-- chart:bar-prefecture-rankings -->` 形式（md-syntax 準拠）
- **データ参照記法**: `<data-source>` / `<source-link>` は `.claude/skills/blog/md-syntax/SKILL.md` を参照

### Step 5: チャート生成

`/generate-article-charts <slug>` を実行する。

- 入力: Step 3 の `data/*.json` と Step 4 のプレースホルダー
- 出力: `data/*.svg` 生成 + `article.md` 内のプレースホルダーを SVG 画像参照に置換
- タイルマップ系チャートは `packages/visualization/src/d3/constants/tile-grid-layout.ts` の `TILE_GRID_LAYOUT` を必ず import 経由で参照（重複定義禁止）

### Step 6: Factual cross-check ★必須 (2026-05-25 追加)

雛形生成後、本文の rank/数値 claim と data の整合性を必ず検証する。AI 生成 article で 13% が rank 不整合 / 数値捏造で FAIL する実測値があり、形式 check では検出不能のため。

```bash
node .claude/scripts/lib/article-factual-check.mjs \
  "docs/21_ブログ記事原稿/<slug>/article.md" \
  "docs/21_ブログ記事原稿/<slug>/data"
```

- **exit 0**: factual error なし → 次の step へ
- **exit 1**: `RANK_MISMATCH` / `INVERSE_RANK_MISMATCH` blocker あり
  - 出力された blocker を確認、data の正しい値で本文を Edit して再実行
  - 修正できない場合 (framing 自体が data と矛盾) は draft を破棄して trend snapshot に戻る

**rule**: blocker がある状態で次の step に進まない。後段の `/publish-article` でも cross-check が走るが、draft 段階で潰すのが効率的。

参照: `.claude/scripts/lib/article-factual-check.mjs` / `.claude/skills/blog/SHARED-failure-cases.md`

### Step 7: 品質チェック（任意）

`/proofread-article <slug>` を実行する。

- frontmatter / 本文 / チャート / 出典 / リンクを検証
- 問題があれば修正案を提示（自動適用はせず人間レビュー前提）

## 規約

- **コードを直接書かない**: 本スキルは orchestrator。新しい `.mjs` / `.cjs` を `.claude/scripts/` 配下に追加しないこと
- **md-syntax 準拠**: `<data-source>` `<source-link>` `<!-- chart:xxx -->` は `.claude/skills/blog/md-syntax/SKILL.md` の記法のみ使用
- **TILE_GRID_LAYOUT**: タイルマップを使うチャートは `packages/visualization/src/d3/constants/tile-grid-layout.ts` から必ず import
- **完成記事の参考**: `.local/r2/app/blog/ai-claude-code-pref-analysis/article.md`（frontmatter・H2 構成・チャート参照記法のリファレンス）
- **1 回 1 記事**: バッチ化禁止。複数記事を作りたければ複数回呼ぶ

## 参照スキル

- **記事品質の正典: `.claude/rules/blog-quality-standards.md`** (curiosity gap タイトル / callout / 内部リンク / source-link 配置の単一ソース)
- `.claude/skills/blog/discover-trends/SKILL.md`
- `.claude/skills/blog/plan-blog-trends/SKILL.md`
- `.claude/skills/blog/fetch-article-data/SKILL.md`
- `.claude/skills/blog/generate-article-charts/SKILL.md`
- `.claude/skills/blog/md-syntax/SKILL.md` (markdown 記法の機械的詳細)
- `.claude/skills/blog/proofread-article/SKILL.md`

## 完了条件

- `docs/20_ブログ記事企画/backlog/trends-YYYY-MM-DD.md` に企画追記済み
- `docs/21_ブログ記事原稿/<slug>/article.md` が雛形として存在（frontmatter + H2 8-12 + チャート参照）
- `docs/21_ブログ記事原稿/<slug>/data/*.json` および `data/*.svg` が揃っている
- 本文に未置換の `<!-- chart:xxx -->` が残っていない
