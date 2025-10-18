# デバッグ出力ファイル

このディレクトリには、`EstatStatsDataFormatter`とヘルパー関数のデバッグ実行結果が出力されます。

## ファイル一覧

### フォーマッター関連

- **`formatter-full.json`** - フォーマッターの完全な変換結果
  - 実行時刻、処理時間、入力データ情報
  - 完全な`FormattedEstatData`オブジェクト
  - ファイルサイズが大きいため、詳細確認用

### 個別JSONファイル（FormattedEstatDataの各プロパティ）

- **`tableInfo.json`** - 統計表情報
  - ID、タイトル、政府統計名、作成機関
  - 統計コード、機関コード
  - 日付情報、データ特性、分類情報

- **`areas.json`** - 地域情報配列
  - 地域コード、地域名、レベル
  - 親地域コード、単位

- **`categories.json`** - カテゴリ情報配列
  - カテゴリコード、カテゴリ名
  - 表示名、単位

- **`years.json`** - 年度情報配列
  - 年度コード、年度名

- **`values.json`** - 統計値配列（大容量）
  - 全2,400件の統計値データ
  - 値、単位、全次元情報（area, time, tab, cat01-15）

- **`metadata.json`** - メタデータ
  - 処理時刻、データソース
  - 統計情報（総レコード数、有効値、NULL値）
  - 範囲情報（年度、地域、カテゴリ）
  - 品質情報（完全性スコア）

- **`notes.json`** - 注記情報
  - 特殊文字とその説明

### ヘルパー関数関連

- **`helpers-debug.json`** - ヘルパー関数の実行結果
  - フィルタリング関数（`filterByArea`, `filterByTime`, `filterByDimension`）
  - 抽出関数（`getPrefectures`, `getValidValues`, `getSpecialValues`, `getByAreaLevel`）
  - グループ化関数（`groupByArea`, `groupByTime`, `groupByDimension`）
  - ソート関数（`sortByValueDesc`, `sortByValueAsc`）
  - 組み合わせテスト（ランキング生成）

## 使用方法

### デバッグスクリプトの実行

```bash
# フォーマッターのデバッグ実行
npm run debug:formatter

# ヘルパー関数のデバッグ実行
npm run debug:helpers
```

### ファイルの確認

```bash
# 出力ファイル一覧
ls -la src/lib/estat-api/stats-data/__debug__/output/

# 統計表情報の確認（軽量）
cat src/lib/estat-api/stats-data/__debug__/output/tableInfo.json | jq

# メタデータの確認
cat src/lib/estat-api/stats-data/__debug__/output/metadata.json | jq '.dataQuality'

# 特定の統計値の確認（最初の5件）
cat src/lib/estat-api/stats-data/__debug__/output/values.json | jq '.[0:5]'
```

## 注意事項

- このディレクトリ内の`.json`ファイルは`.gitignore`で除外されています
- ファイルは実行のたびに上書きされます
- 大きなファイル（`formatter-full.json`）は必要に応じて削除してください
- デバッグスクリプト自体（`*.ts`ファイル）はGit管理対象です

## トラブルシューティング

### ファイルが出力されない場合

1. 出力ディレクトリの権限を確認
2. モックデータファイルの存在を確認
3. TypeScriptのコンパイルエラーを確認

### ファイルサイズが大きい場合

- `formatter-full.json`と`values.json`は完全なデータを含むため、ファイルサイズが大きくなります
- 軽量な確認には`tableInfo.json`や`metadata.json`を使用してください
- 不要なファイルは定期的に削除してください
