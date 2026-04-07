---
name: preview-remotion-blog
description: 実データで Remotion Studio ブログ OGP プレビューを上書きする。Use when user says "ブログOGPプレビュー", "blog OGP プレビュー". slug または title/subtitle 指定.
disable-model-invocation: true
---

実データで Remotion Studio のブログ OGP プレビュー用データを上書きする。
Studio が HMR で自動反映するため、リアルタイムにプレビューを確認できる。

## 引数

ユーザーから以下のいずれかを指定:
- **slug**: ブログ記事のスラッグ（`.local/r2/blog/` 配下のディレクトリ名）
- または **title** / **subtitle** を直接指定

## 手順

### Step 1: データ取得

slug が指定された場合、以下の優先順位でデータを取得する:

1. `.local/r2/blog/<slug>/ogp/ogp.json` が存在すればそのまま使用
2. なければ `.local/r2/blog/<slug>/article.md` のフロントマターから生成

フロントマターからの分割ルール:
- `──` がある場合: 長い方を `title`、短い方を `subtitle`
- `｜` がある場合: 前半を `title`、後半を `subtitle`
- どちらもない場合: 全体を `title`（subtitle なし）

### Step 2: preview-data-blog.ts を上書き

`apps/remotion/src/utils/preview-data-blog.ts` を以下の形式で上書きする。

```typescript
export interface BlogPreviewData {
  title: string;
  subtitle?: string;
}

export const previewDataBlog: BlogPreviewData = {
  title: "<タイトル>",
  subtitle: "<サブタイトル>",
};
```

注意:
- `subtitle` が不要な場合はフィールドを省略する

### Step 3: 確認

上書き後、ユーザーに以下を報告する:
- 対象のスラッグ（slug 指定の場合）
- title / subtitle の内容

## ogp.json の管理

各ブログ記事ディレクトリに OGP 設定を保持する:

```
.local/r2/blog/<slug>/ogp/
├── ogp.json     ← 入力（タイトル・サブタイトル）
└── ogp.png      ← 出力（Remotion でレンダリング、ライトのみ）
```

### ogp.json の形式

```json
{
  "title": "成人1人あたりアルコール飲料消費量ランキング",
  "subtitle": "東京107.8L vs 滋賀58.0L"
}
```

### ogp.json の一括生成

全記事の `ogp.json` を article.md のフロントマターから一括生成する場合:

```javascript
const fs = require('fs');
const path = require('path');
const blogDir = '.local/r2/blog';
const dirs = fs.readdirSync(blogDir).filter(d =>
  fs.statSync(path.join(blogDir, d)).isDirectory()
);

for (const slug of dirs) {
  const mdPath = path.join(blogDir, slug, 'article.md');
  if (fs.existsSync(mdPath) === false) continue;
  const content = fs.readFileSync(mdPath, 'utf8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch === null) continue;
  const titleMatch = fmMatch[1].match(/^title:\s*(.+)$/m);
  const rawTitle = titleMatch ? titleMatch[1].trim().replace(/^"|"$/g, '') : '';

  let title, subtitle;
  if (rawTitle.includes('──')) {
    const parts = rawTitle.split('──');
    if (parts[0].length > parts[1].length) {
      title = parts[0].trim();
      subtitle = parts[1].trim();
    } else {
      title = parts[1].trim();
      subtitle = parts[0].trim();
    }
  } else if (rawTitle.includes('｜')) {
    const parts = rawTitle.split('｜');
    title = parts[0].trim();
    subtitle = parts[1].trim();
  } else {
    title = rawTitle;
    subtitle = undefined;
  }

  const ogpDir = path.join(blogDir, slug, 'ogp');
  if (fs.existsSync(ogpDir) === false) {
    fs.mkdirSync(ogpDir, { recursive: true });
  }
  const json = subtitle ? { title, subtitle } : { title };
  fs.writeFileSync(
    path.join(ogpDir, 'ogp.json'),
    JSON.stringify(json, null, 2) + '\n'
  );
}
```

## 対象コンポジション

この preview-data を参照するコンポジション:
- `BlogOgp`（OGP 画像 1200x630）

## 参照

- `apps/remotion/src/utils/preview-data-blog.ts` — 上書き対象ファイル
- `apps/remotion/src/features/ogp/BlogOgp.tsx` — コンポーネント
- `.local/r2/blog/<slug>/ogp/ogp.json` — 記事別 OGP 設定
