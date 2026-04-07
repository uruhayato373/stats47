---
name: sync-articles
description: .local/r2/blog/ の状態を DB articles テーブルに同期する。Use when user says "記事同期", "sync-articles", "ブログがDBに反映されない". 追加・更新・削除の3方向対応.
disable-model-invocation: true
---

`.local/r2/blog/` の状態を正として、DB の articles テーブルを完全に同期する（追加・更新・削除の3方向対応）。

記事を追加しても `localhost:3000/blog` に表示されない場合や、削除した記事が表示され続ける場合に実行する。

## 手順

1. dry-run で差分を確認（変更は実行しない）:
   ```bash
   npm run articles:sync-from-r2 --workspace=packages/database -- --dry-run
   ```

2. 問題なければ実行（DB を追加・更新・削除）:
   ```bash
   npm run articles:sync-from-r2 --workspace=packages/database
   ```

3. 必要に応じて R2 へ反映:
   ```
   /push-r2
   ```

## 判定ロジック

- `.local/r2/blog/{slug}/article.md` または `article.mdx` が存在するスラッグ → **有効**
- R2 にあって DB にない → **追加対象**（frontmatter をパースして INSERT）
- R2 にも DB にもある → **更新対象**（frontmatter を再読み込みして UPDATE）
- DB にあって R2 にない → **削除対象**（DB から DELETE）

## frontmatter → DB マッピング

| frontmatter | DB カラム | 補足 |
|---|---|---|
| `title` | `title` | なければ slug を代入 |
| `description` | `description` | |
| `tags` | `tags` | 配列 → カンマ区切り |
| `publishedAt` | `publishedAt` | 日付形式以外（"(未定)" 等）は null |
| `published` | `published` | デフォルト false |
| ファイル拡張子 | `format` | `.md` → "md", `.mdx` → "mdx" |
| `data/*.json` の有無 | `hasCharts` | data/ に JSON があれば true |

## 注意

- `published=true` の記事も削除対象になる。実行前に必ず dry-run で確認すること
- `ogImageType` と `createdAt` は更新時に保持される（上書きしない）
