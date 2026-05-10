---
name: monetize-article
description: 既存ブログ記事に <ad-slot> と <affiliate-banner> を適切な位置に挿入する。Use when user says "/monetize-article", "広告挿入", "記事に広告を入れて", "ad-slot配置". スラッグを引数として受け取る.
---

既存ブログ記事の markdown に `<ad-slot>` と `<affiliate-banner>` を適切な位置に挿入する。

## 引数

```
$ARGUMENTS — {slug}
             例: noodle-consumption-prefecture-character
             省略時はスラッグを対話で確認する
```

## 手順

### Phase 1: 記事を読む

1. スラッグを特定する（引数がなければユーザーに確認）
2. `.local/r2/app/blog/{slug}/article.md` を読む
3. H2 セクション一覧を把握する（行番号付き）:
   - 各 `## ` の行番号・見出しテキスト
   - 各セクションの最後の非空行（末尾位置）
4. 現在の `<ad-slot>` と `<affiliate-banner>` の位置を確認する

### Phase 2: `<ad-slot>` の配置を最適化

**配置ルール（H2セクション数による）:**

| H2 数 | ad-slot 数 | 推奨配置位置 |
|---|---|---|
| 3 以下 | 1 箇所 | セクション 2 の末尾 |
| 4〜5 | 2 箇所 | セクション 2・4 の末尾 |
| 6 以上 | 3 箇所 | セクション 2・4・6 の末尾 |

**「セクション末尾」の定義:**
- そのセクションの最後の非空行の直後、次の `## ` の直前
- `<data-source>` や `<source-link>` がある場合はその後に配置
- まとめ（`## まとめ`）・データ出典・関連記事セクションには置かない

**現在の配置を評価して修正:**
- H2直下にある場合 → セクション末尾へ移動
- 目標数より少ない場合 → 追加
- 同一セクション内に複数ある場合 → 1つ残して削除
- 目標数を超えている場合 → 優先度の低い位置から削除

### Phase 3: `<affiliate-banner>` の配置

1. 記事のタグを確認する（記事 frontmatter またはファイル名から推測）
2. `TAG_AFFILIATE_MAP`（`apps/web/src/features/ads/constants/affiliate-category.ts`）でカテゴリを特定:
   - タグが複数ある場合は最初にマッチしたカテゴリを使用
3. 記事本文・セクションタイトルを見て、カテゴリと最も関連するセクションを選択
4. そのセクション末尾に `<affiliate-banner category="{category}">` を挿入

**配置条件:**
- すでに `<affiliate-banner>` がある場合はスキップ（位置も確認して適切なら維持）
- `<ad-slot>` と同じセクション末尾を避ける
- まとめ・データ出典セクションには置かない
- 1 記事 1 箇所まで

**利用可能カテゴリ:**
`labor` / `housing` / `population` / `economy` / `health` / `energy` / `tourism` / `furusato`

### Phase 4: ファイルを更新する

1. 変更後の markdown を `.local/r2/app/blog/{slug}/article.md` に書き戻す
2. 変更点のサマリーを報告:
   - 移動した `<ad-slot>` の位置（before → after）
   - 追加した `<ad-slot>` の位置
   - 挿入した `<affiliate-banner>` のカテゴリと配置セクション
3. R2 への反映は `/push-r2 app/blog/{slug}` で別途実行するよう案内する

## 使用例

```
/monetize-article noodle-consumption-prefecture-character
/monetize-article household-savings-prefecture-ranking
/monetize-article          ← 引数なしの場合はスラッグを対話で確認
```

## 関連スキル

- `/md-syntax` — ad-slot・affiliate-banner の記法詳細
- `/push-r2` — 修正後の R2 反映
- `/plan-blog-affiliate` — アフィリエイト記事企画
