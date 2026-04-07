---
name: update-blog-plan
description: ブログ記事の企画管理ファイルを最新状態に更新する。Use when user says "企画更新", "ブログ計画更新", "記事一覧更新". 公開記事数・企画進捗を反映.
---

ブログ記事の企画管理ファイル `docs/20_ブログ記事企画/01_ブログ記事一括企画.md` を最新状態に更新する。

## 用途

- 記事の公開・企画生成後に進捗を反映したいとき
- 次に着手すべき企画アプローチを判断したいとき
- ブログ運用の全体像を把握したいとき

## 手順

### Step 1: 公開済み記事のカテゴリ別集計

`.local/r2/blog/` 配下の全記事から frontmatter の `category` を読み取り、カテゴリ別の記事数をカウントする:

```bash
# 全記事の category を抽出
for dir in .local/r2/blog/*/; do
  slug=$(basename "$dir")
  file="$dir/article.md"
  [ ! -f "$file" ] && file="$dir/article.mdx"
  [ ! -f "$file" ] && continue
  category=$(grep -m1 '^category:' "$file" | sed 's/category: *//')
  echo "$category $slug"
done | sort
```

### Step 2: 企画ファイルの状態確認（3アプローチ分）

`docs/20_ブログ記事企画/` 配下の企画ファイルを種類別にスキャンする:

```bash
for f in docs/20_ブログ記事企画/*.md; do
  name=$(basename "$f" .md)
  [ "$name" = "01_ブログ記事一括企画" ] && continue
  echo "$name"
done
```

ファイル名パターンで分類:
- `trends-*.md` → トレンド起点の企画
- `affiliate-*.md` → アフィリエイト起点の企画
- それ以外 → カテゴリ起点の企画（`{categoryKey}.md`）

各企画ファイル内の `## 記事企画` の出現数で未消化の企画数をカウント。

### Step 3: 管理ファイルの更新

`docs/20_ブログ記事企画/01_ブログ記事一括企画.md` を以下の情報で更新する:

#### 3-1. 現状サマリー
- 公開済み記事の総数
- 更新日

#### 3-2. 公開済み記事（カテゴリ別）
- Step 1 の結果で記事数を更新

#### 3-3. 企画アプローチ別の状況

**カテゴリ起点（/plan-blog-articles）:**
- 生成済みカテゴリ: `{categoryKey}.md` が存在するカテゴリをリスト
- 未着手カテゴリ数
- 次回推奨: バッチ順で次の未着手カテゴリ

**トレンド起点（/plan-blog-trends）:**
- 最終実行日: `trends-*.md` の最新ファイル名から日付を取得
- 未執筆の企画数: ファイル内の `## 記事企画` をカウント
- 次回推奨: 最終実行から3日以上経過なら再実行を推奨

**アフィリエイト起点（/plan-blog-affiliate）:**
- 生成済み: `affiliate-*.md` のカテゴリ名を抽出
- 未着手: 8カテゴリ（labor / housing / population / economy / health / energy / tourism / furusato）から生成済みを除外
- 次回推奨: 未着手カテゴリの最初

#### 3-4. バッチ1〜3 の進捗テーブル
各カテゴリの状態を以下のいずれかに設定:
- `未着手`: 企画ファイルなし・公開記事なし
- `企画生成済み`: `docs/20_ブログ記事企画/{categoryKey}.md` が存在
- `執筆中`: 企画ファイルあり＋一部記事が公開済み
- `追加企画で対応`: 企画なしだが公開記事が多数ある（economy, population 等）

### Step 4: 結果報告

更新内容のサマリーをユーザーに報告:

- 前回からの変化（新規公開記事、新規企画など）
- 各アプローチの推奨アクション:
  - カテゴリ: 「次は `/plan-blog-articles ict` を実行」
  - トレンド: 「最終実行から N 日経過。`/plan-blog-trends` を推奨」
  - アフィリエイト: 「未着手 N カテゴリ。`/plan-blog-affiliate` を推奨」

## カテゴリキーのマッピング

記事 frontmatter の `category` と管理ファイルの `category_key` の対応:

| frontmatter category | category_key | 分野名 |
|---|---|---|
| landweather | landweather | 国土・気象 |
| population | population | 人口・世帯 |
| labor, laborwage | laborwage | 労働・賃金 |
| agriculture | agriculture | 農林水産業 |
| miningindustry | miningindustry | 鉱工業 |
| commercial | commercial | 商業・サービス業 |
| economy | economy | 企業・家計・経済 |
| housing, construction | construction | 住宅・土地・建設 |
| energy | energy | エネルギー・水 |
| tourism | tourism | 運輸・観光 |
| ict | ict | 情報通信・科学技術 |
| educationsports | educationsports | 教育・文化・スポーツ |
| administrativefinancial | administrativefinancial | 行財政 |
| safety, safetyenvironment | safetyenvironment | 司法・安全・環境 |
| socialsecurity | socialsecurity | 社会保障・衛生 |
| international | international | 国際 |

## 企画ファイルのパターン

| アプローチ | ファイルパターン | 例 |
|---|---|---|
| カテゴリ起点 | `{categoryKey}.md` | `ict.md`, `energy.md` |
| トレンド起点 | `trends-{YYYY-MM-DD}.md` | `trends-2026-03-06.md` |
| アフィリエイト起点 | `affiliate-{category}.md` | `affiliate-labor.md`, `affiliate-all.md` |

## 注意

- 管理ファイル `01_ブログ記事一括企画.md` のフォーマット（セクション構造）を維持すること
- カテゴリキーの揺れ（labor/laborwage, housing/construction, safety/safetyenvironment）は正規化して集計
- 企画ファイルが存在し、かつ全企画が公開済みの場合はライフサイクルルールに従い削除を提案
