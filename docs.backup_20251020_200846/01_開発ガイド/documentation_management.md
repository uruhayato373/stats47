---
title: ドキュメント管理ルール
created: 2025-01-18
updated: 2025-01-18
tags:
  - development-guide
  - documentation
---

## Markdown スタイルガイド

### 見出しの直後の空行

- すべての見出し（#〜######）の直後に 1 行の空行を入れること。
- 例外は箇条書き直後の見出し遷移などでも認めない（自動整形に任せる）。
- 自動検出は markdownlint の MD022 で担保する。

#### 例

```markdown
### セクション名

本文をここに書く。
```

### 自動チェック（Lint）

- ルートの `.markdownlint.json` に以下設定を追加（MD022 を有効化）
- 可能であれば CI で markdownlint を実行

```json
{
  "MD022": { "lines_above": 1, "lines_below": 1 },
  "MD041": false
}
```

### 整形ツール

- Prettier は補助的に使用（Markdown の文章整形）
- 将来的に remark-lint を導入する場合は同等ルールを適用
