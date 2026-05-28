---
name: brushup-blog
description: ブログ記事の brushup (改善優先度キュー生成 or 1 記事の部分補強)。--target priority で GSC × D1 から brushup-queue.md 生成、--target article <slug> で nlm cross query + D1 統計で部分補強。Use when user says "ブログ改善優先度", "どの記事を直す", "ブログをブラッシュアップ", "記事を補強", "brushup".
argument-hint: --target priority | --target article <slug> [--focus エキスパート視点追加|最新データ更新|CTA強化]
primary_agent: article-writer
---

# /brushup-blog — ブログ記事 brushup (優先度キュー生成 + 1 記事補強)

旧 `/brushup-blog-priority` (キュー生成) と `/brushup-blog-article` (1 記事補強) を統合した skill。 `--target` で 2 モードを切り替える。 自動 batch は `/auto-brushup-batch` で別管理。

## 引数

```
/brushup-blog --target <priority|article> [<slug>] [--focus <観点>]
```

| 引数 | 必須 | 説明 |
|---|---|---|
| `--target` | Yes | `priority` (キュー生成) または `article` (1 記事補強) |
| `<slug>` | `--target article` 時のみ Yes | 記事スラグ (例: `household-income-tokyo-okinawa`) |
| `--focus` | `--target article` の時 Optional | 補強観点 (省略時は自動判断): `エキスパート視点追加` / `最新データ更新` / `CTA強化` |

---

## --target priority: ブログ改善優先度キュー生成

GSC の impressions × CTR と D1 の article メタデータを掛け合わせて、改善効果が最も高い記事を特定し `brushup-queue.md` に出力する。

### データソース

| データ | 場所 |
|---|---|
| GSC ページ別週次 | `.claude/skills/analytics/gsc-improvement/reference/snapshots/<最新週>/pages.csv` |
| D1 articles テーブル | sqlite MCP (`.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe5...sqlite`) |

### 実行フロー (priority)

#### Step 1: 最新 GSC ページデータ読み込み

```bash
# 最新週を特定
ls .claude/skills/analytics/gsc-improvement/reference/snapshots/ | sort | tail -1
```

`.claude/skills/analytics/gsc-improvement/reference/snapshots/<最新週>/pages.csv` を Read する。
`/blog/` を含む行のみを抽出し、 slug を `https://stats47.jp/blog/` 以降の文字列として取得する。

#### Step 2: D1 から記事メタデータ取得

sqlite MCP で以下をクエリ:

```sql
SELECT slug, title, published_at, updated_at
FROM articles
WHERE slug IS NOT NULL
ORDER BY updated_at ASC;
```

#### Step 3: スコアリング

| 指標 | 計算式 | 意味 |
|---|---|---|
| CTR ギャップ | `全記事平均 CTR - ページ CTR` | 大きいほど「見つかっているが読まれない」 |
| インプレッション | `impressions` 数値そのまま | 大きいほど改善効果が広い |
| スコア | `CTR ギャップ × log10(impressions + 1)` | 両指標の積 (log スケール) |

スコア降順でソートし上位 20 本を選定する。
GSC データは実測値。 D1 の `articles` テーブルの `updated_at` が古い記事はボーナス +0.2 を加算。

#### Step 4: brushup-queue.md 出力

`docs/20_ブログ記事企画/brushup-queue.md` に以下の形式で書き出す:

```markdown
# ブログ改善優先度キュー

生成日: YYYY-MM-DD / GSC 参照週: YYYY-Www

| 優先度 | slug | タイトル | impressions | CTR | 平均比 | スコア |
|---|---|---|---|---|---|---|
| 1 | household-income-tokyo-okinawa | ... | 1,177 | 4.4% | -1.8% | 2.31 |
...
```

### Step 5: 次のアクション案内

キュー上位を `/brushup-blog --target article <slug>` で実際に改善するよう案内。

---

## --target article: 1 記事の部分補強

`nlm cross query` (白書ノートブック) と D1 統計データを使い、 ブログ記事を **1-2 セクション単位** で部分補強する。 全文書き直しは禁止。

### 絶対遵守 (2026-05-25 追加)

**rule**: 補強で追加する数値 / rank はすべて data ファイルから copy-paste。 memory や類推で書かない。

補強完了後、 必ず factual cross-check を通す:

```bash
node .claude/scripts/lib/article-factual-check.mjs \
  ".local/r2/app/blog/<slug>/article.md" \
  ".local/r2/app/blog/<slug>/data"
```

exit 1 なら修正 → 再 check して pass するまで繰り返す。 詳細: `.claude/skills/blog/SHARED-failure-cases.md`

### 前提条件 (article モード)

```bash
nlm --version  # 0.6.5 以上 (/Users/minamidaisuke/.local/bin/nlm)
```

### ノートブック × テーマ マッピング

記事スラグのキーワードから適切なノートブックを自動選択する:

| キーワード例 | 使用ノートブック |
|---|---|
| income, wage, salary, tax, fiscal, gdp | 経済財政白書 |
| medical, hospital, nurse, care, nursing, birth, fertility, child, suicide | 厚生労働白書 |
| road, infrastructure, port, housing, construction, traffic | 国土交通白書 |
| energy, electricity, solar, renewable, carbon | エネルギー白書,第６次エネルギー基本計画 |
| environment, recycling, waste, pollution, climate | 環境白書 |
| ict, telework, digital, smartphone, internet | 情報通信白書 |
| traffic-accident, transport, logistics, travel | 交通政策白書 |
| manufacturing, industry, productivity, factory | ものづくり白書 |
| small-business, entrepreneur, startup | 中小企業白書 |
| child, education, school, kindergarten, childcare, fertility | こども白書 |
| population, aging, migration, solo-living | 経済財政白書,厚生労働白書 |

複数ノートブックを `--notebooks "白書A,白書B"` でカンマ結合して渡す。

### 実行フロー (article)

#### Step 1: 記事読み込みと改善点特定

1. `.local/r2/app/blog/<slug>/article.md` を Read
2. 現在の記事を見て「何が不足しているか」を判断:
   - **エキスパート視点なし** → 白書引用・政策的背景が薄い
   - **最新データなし** → `publishedAt` が 12 ヶ月以上前、 最新年度データに更新余地あり
   - **CTA 弱い** → 記事末尾の関連リンク・ランキングページへの誘導が貧弱
3. スラグからノートブック候補を選択 (マッピング表参照)

#### Step 2: D1 から統計データ抽出 (sqlite MCP)

記事テーマに関連する指標を D1 から抽出:

```sql
SELECT i.name, i.slug AS indicator_slug, o.area_code, o.year_code, o.value
FROM indicators i
JOIN observations o ON o.indicator_id = i.id
WHERE i.name LIKE '%<テーマキーワード>%'
ORDER BY o.year_code DESC, o.value DESC
LIMIT 50;
```

最新年度・都道府県別ランキングの上位/下位 5 件を整理する。

#### Step 3: nlm cross query で白書調査

```bash
nlm cross query --notebooks "<ノートブック名>" \
  "「<記事テーマ>」について、 背景・政策的意義・最新トレンド・都道府県間格差の要因を教えてください。 引用根拠付きで回答してください。"
```

クエリ結果を以下の形式で整理:

```
=== nlm findings: <slug> ===
[背景・政策]  ...
[最新データ] ...
[専門的観点] ...
[引用元]     <ノートブック名> より
```

#### Step 4: 差分のみ article.md に反映

**原則: 全文書き直し禁止。 編集は 1-2 セクションのみ。**

| focus | 反映先 | 内容 |
|---|---|---|
| エキスパート視点追加 | 各 H2 の散文導入 or 考察セクション | 白書引用・政策背景・専門的解説を 2-3 文追加 |
| 最新データ更新 | データ説明部分 | D1 から取得した最新年度値に差し替え |
| 関連ランキング誘導 | **対応する図・データを扱う H2 セクション内** (SVG 図の直下等) | そのセクションが言及するランキングへ `<source-link href="/ranking/...">` を**インライン配置**。**記事末尾に集約しない** (回遊性・文脈性を損なう)。ナビ目的の `/category/` `/themes/` への `<source-link>` は末尾の関連セクションで可。検査: `node .claude/scripts/blog/audit-article-structure.mjs` |

Edit ツールで最小限の変更を適用する。

#### Step 5: bold+括弧レンダリングバグ検出・修正 (必須)

```bash
node .claude/scripts/blog/lint-article.cjs <slug>
```

exit 1 (問題あり) の場合は、 検出行を Edit ツールで修正する。

修正パターン:
- `**text（内側）**` → `**text**（内側）` (括弧をボールドの外へ移動)
- `**text（内側）**:` → `**text**（内側）:` (コロン前も同様)

修正後に再度 lint を実行して exit 0 を確認してから次へ進む。

#### Step 6: 完了レポート

```
=== /brushup-blog --target article: <slug> 完了 ===
参照ノートブック: <名前>
D1 クエリ結果: <件数> 件
補強したセクション: <H2 名>
変更内容: <1-2 行で要約>
bold lint: ✅ exit 0
```

---

## 参照

- 優先度キュー: `docs/20_ブログ記事企画/brushup-queue.md` (`--target priority` で生成)
- 品質確認: `/blog-review --mode proofread` で最終チェック
- 自動 batch: `/auto-brushup-batch` (複数記事の一括 brushup)
- nlm ヘルプ: `nlm cross --help`

## 移行ステータス

本 skill は旧 `/brushup-blog-priority` (`.claude/skills/blog/brushup-blog-priority/`) と旧 `/brushup-blog-article` (`.claude/skills/blog/brushup-blog-article/`) を統合したもの。 旧 skill は削除済み。 `/auto-brushup-batch` は別系統 (自動化スクリプト) なので維持。
