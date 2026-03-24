# Scripts

`apps/web/scripts/` のユーティリティスクリプト集。

---

## 📋 スクリプト一覧

| スクリプト | コマンド | 説明 |
|-----------|---------|------|
| `generate-sitemap.ts` | `npm run generate:sitemap` | SEO用サイトマップXML生成 |
| `validate-env.ts` | `npm run validate:env` | 環境変数の検証 |
| `pre-commit-checks.sh` | Git pre-commit hook | コミット前チェック |

---

## generate-sitemap.ts

### 概要

ローカルD1データベースから全ページURLを取得し、SEO用サイトマップXML (`public/sitemap.xml`) を生成します。

### 使用方法

```bash
npm run generate:sitemap
```

### 出力ファイル

- **出力先**: `public/sitemap.xml`
- **フォーマット**: XML Sitemap形式 (sitemap.org準拠)

### 生成対象ページ

| ページタイプ | URL例 | priority | changefreq |
|-------------|-------|----------|-----------|
| トップページ | `/` | 1.0 | daily |
| ランキング一覧 | `/ranking` | 0.9 | daily |
| ランキング詳細 | `/ranking/{rankingKey}` | 0.9 | monthly |
| ダッシュボード | `/{categoryKey}/{subcategoryKey}/dashboard/{areaCode}` | 0.8 | weekly |
| エリアプロファイル | `/area-profile/{areaCode}` | 0.8 | weekly |
| ブログ記事 | `/blog/{category}/{slug}/{time}` | 0.9 | monthly |
| ブログカテゴリ | `/blog/{category}` | 0.8 | weekly |
| カテゴリ | `/{categoryKey}` | 0.5 | weekly |
| サブカテゴリ | `/{categoryKey}/{subcategoryKey}` | 0.4 | weekly |

### データソース

| テーブル | 用途 |
|---------|------|
| `categories`, `subcategories` | カテゴリページ |
| `ranking_items` | ランキング詳細（`is_active = 1`のみ） |
| `dashboard_configs` | ダッシュボード（`is_active = 1`のみ） |
| `articles` | ブログ記事（`published = 1`のみ） |

### トラブルシューティング

#### エラー: データベースファイルが見つからない

```
ローカルD1データベースファイルが見つかりません。
```

**解決方法**:
```bash
# 一度wrangler devを起動してローカルD1を初期化
npx wrangler dev
# Ctrl+Cで停止後、再度実行
npm run generate:sitemap
```

#### エラー: テーブルが存在しない

データベースマイグレーションが未適用の可能性があります。

```bash
# マイグレーション適用
npm run db:migrate:local
```

### 拡張方法

新しいページタイプを追加する場合:

```typescript
// generate-sitemap.ts 内に追加

async function generateNewPageUrls(baseUrl: string, db: D1Database): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];

  // データベースからデータ取得
  const items = await db
    .prepare("SELECT * FROM new_table WHERE is_active = 1")
    .all();

  // URL生成
  for (const item of items.results) {
    urls.push({
      loc: `${baseUrl}/new-page/${item.slug}`,
      lastmod: new Date().toISOString(),
      changefreq: "weekly",
      priority: 0.8,
    });
  }

  return urls;
}

// main関数内で呼び出し
try {
  console.log("新しいページを追加中...");
  const newPageUrls = await generateNewPageUrls(baseUrl, db);
  urls.push(...newPageUrls);
  console.log(`新しいページの追加を完了 (${newPageUrls.length}件)`);
} catch (error) {
  console.warn("新しいページの取得に失敗:", error);
}
```

---

## validate-env.ts

### 概要

必須の環境変数が設定されているか検証します。

### 使用方法

```bash
npm run validate:env
```

---

## pre-commit-checks.sh

### 概要

Gitコミット前に自動実行されるチェックスクリプト。

### チェック内容

- TypeScript型チェック
- ESLint
- 環境変数検証

### 設定

`.git/hooks/pre-commit` にシンボリックリンクまたはコピーして使用。

```bash
# シンボリックリンク作成
ln -s ../../apps/web/scripts/pre-commit-checks.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

---

## 関連ドキュメント

- **データベース**: [packages/database/README.md](../../../packages/database/README.md)
- **メタデータ配置ルール**: [apps/web/src/lib/metadata/README.md](../src/lib/metadata/README.md)
