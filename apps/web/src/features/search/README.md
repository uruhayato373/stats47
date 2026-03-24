# search

MiniSearch + `Intl.Segmenter` によるクライアントサイド全文検索。

## アーキテクチャ

```
/search-index.json（静的ファイル）
  └─► getSearchInstance() でロード・シングルトン化
      └─► searchDocuments(query, options) で検索
```

インデックスはビルド時に別途生成して `public/search-index.json` として配置する。
カテゴリフィルタ用メタ情報は `public/search-index-meta.json`。

## 検索対象

| type | 対象 |
|---|---|
| `ranking` | ランキング項目（title, description） |
| `blog` | ブログ記事 |

## 主要ファイル

| ファイル | 役割 |
|---|---|
| `lib/search-client.ts` | MiniSearch のロードと `searchDocuments()` 関数 |
| `lib/tokenize.ts` | `Intl.Segmenter` による日本語分かち書き |
| `types/search.types.ts` | `SearchDocument`, `SearchResult`, `SearchOptions` 等の型定義 |
| `context/SearchContext.tsx` | 検索状態・実行を管理する React Context |
| `components/` | `SearchInput`, `SearchFilters`, `SearchResults` |
| `HeroSearch.tsx` | トップページ用の検索バー |

## インデックス構造（SearchDocument）

```typescript
interface SearchDocument {
  id: string;
  title: string;
  description: string;
  type: "ranking" | "blog";
  url: string;
  category?: string;
  subcategory?: string;
  categoryKey?: string;
  subcategoryKey?: string;
  publishedAt?: string;
  updatedAt?: string;
}
```

## 検索設定

- `boost: { title: 3 }` — タイトル一致を優先
- `fuzzy: 0.2` — 編集距離によるtypo許容
- `prefix: true` — 前方一致（「人口」→「人口密度」）
