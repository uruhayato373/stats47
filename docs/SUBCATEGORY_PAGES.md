## コンポーネントマッピングの設定

### 設定ベースのマッピング

`categories.json`でコンポーネントマッピングを管理することができます。各サブカテゴリに`component`と`areaComponent`を設定することで、ページコンポーネントとその都道府県ページを指定できます。

#### 基本的な設定

```json
{
  "id": "subcategory-id",
  "name": "サブカテゴリ名",
  "href": "/subcategory-path",
  "component": "SubcategoryPage"
}
```

#### 都道府県ページを持つ場合の設定

都道府県別のデータを表示するサブカテゴリには、`areaComponent`を追加します：

```json
{
  "id": "subcategory-id",
  "name": "サブカテゴリ名",
  "href": "/subcategory-path",
  "component": "SubcategoryPage",
  "areaComponent": "SubcategoryAreaPage" // 都道府県ページ用コンポーネント
}
```

#### 設定項目の説明

1. **基本設定**

   - `id`: サブカテゴリの一意の識別子
   - `name`: 表示名
   - `href`: ルーティングパス
   - `component`: メインページのコンポーネント名

2. **都道府県ページ設定**

   - `areaComponent`: 都道府県ページのコンポーネント名
   - 都道府県ページの URL は自動的に`/[category]/[subcategory]/[areacode]`の形式になります

3. **命名規則**
   - メインページ: `${Name}Page`（例：`BasicPopulationPage`）
   - 都道府県ページ: `${Name}AreaPage`（例：`BasicPopulationAreaPage`）

## チェックリスト

新しいサブカテゴリページを実装する際は、以下を確認してください：

- [ ] `SubcategoryPageProps` 型を使用している
- [ ] `SubcategoryLayout` でコンテンツをラップしている
- [ ] `statsDataId` と `cdCat01` をコンポーネント内で定義している
- [ ] `categories.json` にサブカテゴリを追加した（`component`フィールドを含む）
- [ ] 都道府県ページが必要な場合、`areaComponent`を追加した
- [ ] コンポーネントを適切にエクスポートした
- [ ] エリアコードの形式（5 桁）を確認した
- [ ] ブラウザで動作確認を行った
- [ ] BasicPopulationPage.tsx を参考にした

## 参考リンク

- [e-Stat API 仕様](https://www.e-stat.go.jp/api/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [D3.js カラースキーム](https://github.com/d3/d3-scale-chromatic)
- [参考実装: BasicPopulationPage](../src/components/subcategories/population/basic-population/BasicPopulationPage.tsx)
