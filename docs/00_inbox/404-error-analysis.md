# 404エラー詳細分析と解決手順

## エラー概要

**URL:** `http://localhost:3000/population/basic-population/ranking/didAreaRatio`
**エラー:** "This page could not be found." (404エラー)
**発生日時:** 2025-10-12

---

## 根本原因

404エラーは以下の**3つの主要な問題**が組み合わさって発生しています：

### 1. データベースにランキングデータが存在しない（最重要）

**問題:**
- `basic-population` サブカテゴリの設定がデータベースに存在しない
- `ranking_items` テーブルに `basic-population` のエントリが存在しない
- `subcategory_configs` テーブルにも `basic-population` の設定が存在しない

**確認コマンド:**
```bash
# ランキング項目の確認
npx wrangler d1 execute stats47 --local --command \
  "SELECT * FROM ranking_items WHERE subcategory_id = 'basic-population';"
# 結果: []（データなし）

# サブカテゴリ設定の確認
npx wrangler d1 execute stats47 --local --command \
  "SELECT * FROM subcategory_configs WHERE id = 'basic-population';"
# 結果: []（データなし）

# 現在登録されているサブカテゴリ
npx wrangler d1 execute stats47 --local --command \
  "SELECT DISTINCT subcategory_id FROM ranking_items;"
# 結果: land-area, land-use のみ
```

**影響範囲:**
- データベースクエリが失敗する
- APIエンドポイント `/api/ranking-items/subcategory/basic-population` が404またはエラーを返す
- `SubcategoryRankingPage` コンポーネントがランキング設定を取得できない

### 2. ルート構造の変更（未コミットファイル）

**変更内容:**
```
削除: src/app/[category]/[subcategory]/ranking/[rankingId]/page.tsx
追加: src/app/[category]/[subcategory]/ranking/[rankingKey]/page.tsx (未コミット)
```

**git status:**
```
Changes not staged for commit:
  deleted:    src/app/[category]/[subcategory]/ranking/[rankingId]/page.tsx

Untracked files:
  src/app/[category]/[subcategory]/ranking/[rankingKey]/
```

**問題点:**
- 新しい `[rankingKey]` ディレクトリがまだgitに追加されていない（untracked）
- Next.jsの開発サーバーが新しいルート構造を認識していない可能性がある

### 3. Next.jsの動的ルーティングの仕組み

**期待される動作:**

1. ユーザーが `/population/basic-population/ranking/didAreaRatio` にアクセス
2. Next.jsが `src/app/[category]/[subcategory]/ranking/[rankingKey]/page.tsx` にマッチング
3. ページコンポーネントが以下のパラメータを受け取る:
   ```typescript
   {
     category: "population",
     subcategory: "basic-population",
     rankingKey: "didAreaRatio"
   }
   ```
4. `fetchRankingItemsBySubcategory("basic-population")` を実行
5. データベースからランキング設定を取得
6. ランキングデータを表示

**実際の動作:**

1. ユーザーが URL にアクセス
2. Next.jsがルートファイルを見つける
3. データベースに `basic-population` のデータがないため、API が失敗
4. ページの処理が途中で失敗し、404エラーが表示される

---

## 影響を受けるファイル

### 変更されたファイル

1. **`src/app/[category]/[subcategory]/ranking/[rankingKey]/page.tsx`** (新規・未コミット)
   - 場所: `src/app/[category]/[subcategory]/ranking/[rankingKey]/page.tsx:1-75`
   - 役割: 個別ランキング項目表示ページ
   - パラメータ: `category`, `subcategory`, `rankingKey`

2. **`src/components/ranking/SubcategoryRankingPage.tsx`**
   - 場所: `src/components/ranking/SubcategoryRankingPage.tsx:1-65`
   - 変更点: `rankingKey` パラメータを受け取るように修正
   - 役割: サーバーサイドでランキング設定を取得

3. **`src/components/ranking/RankingClient/RankingClient.tsx`**
   - 場所: `src/components/ranking/RankingClient/RankingClient.tsx:1-144`
   - 変更点: `activeRankingKey` を使用するように修正
   - 役割: クライアントサイドのランキング表示

4. **`src/lib/ranking/ranking-items.ts`**
   - 場所: `src/lib/ranking/ranking-items.ts:38-79`
   - 役割: データベースからランキング設定を取得
   - APIエンドポイント: `/api/ranking-items/subcategory/${subcategoryId}`

5. **`src/app/api/ranking-items/subcategory/[subcategoryId]/route.ts`**
   - 場所: `src/app/api/ranking-items/subcategory/[subcategoryId]/route.ts:1-138`
   - 役割: ランキング項目取得API
   - データベーステーブル: `subcategory_configs`, `ranking_items`

---

## 解決手順

### ステップ1: データベースにランキングデータを追加

#### 1-1. サブカテゴリ設定を追加

```bash
npx wrangler d1 execute stats47 --local --command "
INSERT INTO subcategory_configs (
  id,
  category_id,
  name,
  description,
  default_ranking_key
) VALUES (
  'basic-population',
  'population',
  '基本人口',
  '都道府県別の基本的な人口統計データ',
  'didAreaRatio'
);"
```

#### 1-2. ランキング項目を追加

`didAreaRatio` (DID人口比率) のランキング項目を追加:

```bash
npx wrangler d1 execute stats47 --local --command "
INSERT INTO ranking_items (
  subcategory_id,
  ranking_key,
  label,
  stats_data_id,
  cd_cat01,
  unit,
  name,
  display_order,
  is_active
) VALUES (
  'basic-population',
  'didAreaRatio',
  'DID人口比率',
  '0000010101',
  '001',
  '%',
  'DID人口比率',
  1,
  1
);"
```

**注意:** `stats_data_id` と `cd_cat01` の値は、実際のe-Stat APIのデータIDに合わせて修正する必要があります。

#### 1-3. 追加のランキング項目（オプション）

基本人口のその他の項目も追加する場合:

```bash
# 総人口
npx wrangler d1 execute stats47 --local --command "
INSERT INTO ranking_items (
  subcategory_id, ranking_key, label, stats_data_id, cd_cat01,
  unit, name, display_order, is_active
) VALUES (
  'basic-population', 'totalPopulation', '総人口', '0000010101', '000',
  '人', '総人口', 0, 1
);"

# 人口密度
npx wrangler d1 execute stats47 --local --command "
INSERT INTO ranking_items (
  subcategory_id, ranking_key, label, stats_data_id, cd_cat01,
  unit, name, display_order, is_active
) VALUES (
  'basic-population', 'populationDensity', '人口密度', '0000010101', '002',
  '人/km²', '人口密度', 2, 1
);"
```

#### 1-4. データ追加の確認

```bash
# サブカテゴリ設定の確認
npx wrangler d1 execute stats47 --local --command \
  "SELECT * FROM subcategory_configs WHERE id = 'basic-population';"

# ランキング項目の確認
npx wrangler d1 execute stats47 --local --command \
  "SELECT * FROM ranking_items WHERE subcategory_id = 'basic-population';"
```

### ステップ2: 新しいルートファイルをgitに追加

```bash
# 新しいディレクトリをgitに追加
git add src/app/[category]/[subcategory]/ranking/[rankingKey]/

# 変更内容を確認
git status

# ステージングされたファイルを確認
git diff --cached src/app/[category]/[subcategory]/ranking/[rankingKey]/page.tsx
```

### ステップ3: Next.js開発サーバーを再起動

現在のサーバーが新しいルート構造を認識していない可能性があるため、再起動します。

```bash
# 開発サーバーを停止（Ctrl+C）

# .next キャッシュをクリア（オプション・推奨）
rm -rf .next

# 開発サーバーを再起動
npm run dev
```

### ステップ4: 動作確認

#### 4-1. APIエンドポイントの確認

ブラウザまたはcurlで以下のURLにアクセス:

```bash
curl http://localhost:3000/api/ranking-items/subcategory/basic-population
```

**期待される結果:**
```json
{
  "subcategory": {
    "id": "basic-population",
    "categoryId": "population",
    "name": "基本人口",
    "description": "都道府県別の基本的な人口統計データ",
    "defaultRankingKey": "didAreaRatio"
  },
  "rankingItems": [
    {
      "id": 1,
      "subcategoryId": "basic-population",
      "ranking_key": "didAreaRatio",
      "label": "DID人口比率",
      "statsDataId": "0000010101",
      "cdCat01": "001",
      "unit": "%",
      "name": "DID人口比率",
      "displayOrder": 1,
      "isActive": true
    }
  ]
}
```

#### 4-2. ページの確認

ブラウザで以下のURLにアクセス:

```
http://localhost:3000/population/basic-population/ranking/didAreaRatio
```

**期待される動作:**
- ページが正常に表示される
- DID人口比率のランキング地図とデータテーブルが表示される
- 404エラーが表示されない

#### 4-3. デフォルトリダイレクトの確認

```
http://localhost:3000/population/basic-population/ranking
```

このURLは自動的に以下にリダイレクトされるはず:

```
http://localhost:3000/population/basic-population/ranking/didAreaRatio
```

（`didAreaRatio` が `default_ranking_key` として設定されているため）

---

## トラブルシューティング

### 問題1: API が404を返す

**原因:** データベースにデータが追加されていない

**解決策:**
```bash
# データベースの内容を確認
npx wrangler d1 execute stats47 --local --command \
  "SELECT * FROM subcategory_configs WHERE id = 'basic-population';"

# データが空の場合、ステップ1を再実行
```

### 問題2: ページが依然として404を返す

**原因1:** Next.jsのキャッシュが残っている

**解決策:**
```bash
rm -rf .next
npm run dev
```

**原因2:** 新しいルートファイルがコミットされていない

**解決策:**
```bash
git status
git add src/app/[category]/[subcategory]/ranking/[rankingKey]/
```

### 問題3: データは取得できるが、地図が表示されない

**原因:** `stats_data_id` または `cd_cat01` が正しくない

**解決策:**
1. e-Stat APIで正しいデータIDとカテゴリコードを確認
2. データベースの値を更新:

```bash
npx wrangler d1 execute stats47 --local --command "
UPDATE ranking_items
SET stats_data_id = '正しいID', cd_cat01 = '正しいコード'
WHERE ranking_key = 'didAreaRatio' AND subcategory_id = 'basic-population';"
```

### 問題4: 「ランキングデータが見つかりません」と表示される

**原因:** `ranking_key` がデータベースに存在しない、または `is_active` が0

**解決策:**
```bash
# ranking_key を確認
npx wrangler d1 execute stats47 --local --command \
  "SELECT ranking_key, is_active FROM ranking_items WHERE subcategory_id = 'basic-population';"

# is_active を1に設定
npx wrangler d1 execute stats47 --local --command \
  "UPDATE ranking_items SET is_active = 1 WHERE ranking_key = 'didAreaRatio';"
```

---

## 予防策

### 1. データベーススキーマの文書化

`database/schema.sql` にテーブル定義とサンプルデータを追加:

```sql
-- サブカテゴリ設定のサンプル
INSERT INTO subcategory_configs (id, category_id, name, description, default_ranking_key)
VALUES
  ('basic-population', 'population', '基本人口', '都道府県別の基本的な人口統計データ', 'totalPopulation'),
  ('land-area', 'landweather', '土地面積', '都道府県別の土地面積データ', 'total-area-excluding');
```

### 2. シードデータスクリプトの作成

`database/seeds/ranking-items.sql` を作成:

```sql
-- basic-population のランキング項目
INSERT INTO ranking_items (...) VALUES (...);
```

### 3. データベースマイグレーションツールの導入

- Drizzle ORMなどのマイグレーションツールを導入
- スキーマ変更を追跡可能にする

### 4. エラーハンドリングの改善

`src/components/ranking/SubcategoryRankingPage.tsx` でより詳細なエラーメッセージを表示:

```typescript
if (!rankingConfig) {
  return (
    <SubcategoryLayout category={category} subcategory={subcategory} viewType="ranking">
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">
            ランキングデータを取得できませんでした
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            サブカテゴリID: {subcategory.id}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            データベース接続またはデータの登録を確認してください
          </p>
        </div>
      </div>
    </SubcategoryLayout>
  );
}
```

---

## 参考情報

### 関連ファイル

- ルート定義: `src/app/[category]/[subcategory]/ranking/[rankingKey]/page.tsx:1-75`
- API実装: `src/app/api/ranking-items/subcategory/[subcategoryId]/route.ts:1-138`
- データ取得: `src/lib/ranking/ranking-items.ts:38-79`
- クライアント: `src/components/ranking/RankingClient/RankingClient.tsx:1-144`
- サーバーコンポーネント: `src/components/ranking/SubcategoryRankingPage.tsx:1-65`

### データベーステーブル

1. **`subcategory_configs`**
   - `id` (PK): サブカテゴリID
   - `category_id`: カテゴリID
   - `name`: 表示名
   - `description`: 説明
   - `default_ranking_key`: デフォルトランキングキー

2. **`ranking_items`**
   - `id` (PK): ランキング項目ID
   - `subcategory_id` (FK): サブカテゴリID
   - `ranking_key`: ランキングキー（URLパラメータ）
   - `label`: タブ表示用ラベル
   - `stats_data_id`: e-Stat統計データID
   - `cd_cat01`: カテゴリコード
   - `unit`: 単位
   - `name`: ランキング名
   - `display_order`: 表示順序
   - `is_active`: アクティブフラグ

### URL構造

```
/{category}/{subcategory}/ranking → デフォルトランキングキーにリダイレクト
/{category}/{subcategory}/ranking/{rankingKey} → 個別ランキング表示
```

**例:**
- `/population/basic-population/ranking` → `/population/basic-population/ranking/didAreaRatio`
- `/population/basic-population/ranking/didAreaRatio` → DID人口比率ランキング表示
- `/population/basic-population/ranking/totalPopulation` → 総人口ランキング表示

---

## まとめ

404エラーの主な原因は、**データベースに `basic-population` サブカテゴリのランキングデータが存在しないこと**です。

解決には以下の3つのステップが必要です：

1. データベースにサブカテゴリ設定とランキング項目を追加
2. 新しいルートファイルをgitに追加
3. Next.js開発サーバーを再起動

これらの手順を実行することで、404エラーは解消され、ランキングページが正常に表示されるようになります。

**作成日:** 2025-10-12
**対象URL:** `http://localhost:3000/population/basic-population/ranking/didAreaRatio`
**ステータス:** 解決手順完成
