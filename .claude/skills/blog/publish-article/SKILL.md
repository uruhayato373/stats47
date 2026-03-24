下書き記事（`docs/21_ブログ記事原稿/<slug>/`）を公開フォルダ（`.local/r2/blog/<slug>/`）にコピーし、公開用フロントマターを整える。

## 引数

```
$ARGUMENTS — 公開する記事のスラッグ（ディレクトリ名）
             （例: traffic-accident-deaths-ranking）
```

## 前提

- 事前に `/proofread-article` で校正チェックを済ませておくこと
- 作業ブランチが正しいか確認しておくこと

## 手順

### 1. スラッグを確認する

引数が空の場合は `docs/21_ブログ記事原稿/` 配下のディレクトリ一覧を表示してユーザーに選択を求める:

```bash
ls docs/21_ブログ記事原稿/
```

### 2. ソースの存在確認

```bash
ls "docs/21_ブログ記事原稿/<slug>/"
```

`article.md` が存在しない場合はエラーを出して終了する。

### 3. コピー先の状態を確認（dry-run）

コピー前に変更内容を確認する:

```bash
ls ".local/r2/blog/<slug>/" 2>/dev/null && echo "--- 既存ファイルあり（上書きします）" || echo "--- 新規作成"
```

ソースのファイル一覧を表示:

```bash
ls -la "docs/21_ブログ記事原稿/<slug>/"
```

ソースの article.md フロントマターを確認:

```bash
head -20 "docs/21_ブログ記事原稿/<slug>/article.md"
```

確認結果を表示してユーザーに続行の確認を求める。

### 4. ファイルをコピーする

```bash
mkdir -p ".local/r2/blog/<slug>"
cp -r "docs/21_ブログ記事原稿/<slug>/." ".local/r2/blog/<slug>/"
```

コピー結果を確認:

```bash
ls -la ".local/r2/blog/<slug>/"
```

### 5. フロントマターを整える

コピー先の `article.md` を読み込み、以下の修正を Apply する（Edit ツール使用）:

#### 5-1. `publishedAt` の更新

- `publishedAt: (未定)` → `publishedAt: YYYY-MM-DD`（今日の日付）
- すでに日付が入っている場合はそのまま

今日の日付を取得:

```bash
date +%Y-%m-%d
```

#### 5-2. 廃止フィールドの削除

以下のフィールドが残っている場合は行ごと削除する（`/proofread-article` で検出された場合の自動修正として）:

- `rankingKeys:` セクション（キーのリストを含む複数行）
- `seoKeywords:` セクション（キーワードのリストを含む複数行）

#### 5-3. `published` フィールドの確認

`published: false` または `published` フィールドがない場合: **そのまま放置**。
`/sync-articles` 実行時に `publishedAt` の日付に基づいて公開状態が制御されるため、明示的な変更は不要。

### 6. 下書きフォルダを削除する

公開が完了したため、下書きフォルダは不要になる。ユーザーに確認してから削除する:

```bash
rm -rf "docs/21_ブログ記事原稿/<slug>"
```

### 7. 完了メッセージ

```
✅ 公開フォルダへのコピーが完了しました

  コピー元: docs/21_ブログ記事原稿/<slug>/  （削除済み）
  コピー先: .local/r2/blog/<slug>/
  publishedAt: <設定した日付>

次のステップ:
  1. /sync-articles  →  DB を更新（ローカル確認）
  2. localhost:3000/blog/<slug> でプレビュー確認
  3. /push-r2        →  リモート R2 へアップロード
  4. /sync-remote-d1 →  リモート D1 へ反映（production）
```
