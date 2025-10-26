# デバッグ出力ファイル

このディレクトリには、`EstatMetaInfoFormatter`のデバッグ実行結果が出力されます。

## ファイル一覧

### フォーマッター関連

- **`formatter-full.json`** - フォーマッターの完全な変換結果
  - 実行時刻、処理時間、入力データ情報
  - 完全な`ParsedMetaInfo`オブジェクト
  - ファイルサイズが大きいため、詳細確認用

### 個別JSONファイル（ParsedMetaInfoの各プロパティ）

- **`tableInfo.json`** - 統計表情報
  - ID、タイトル、政府統計名、作成機関
  - 統計コード、機関コード
  - 日付情報、データ特性、分類情報

- **`categories.json`** - カテゴリ情報配列
  - カテゴリID、カテゴリ名
  - レベル、単位、親カテゴリ

- **`areas.json`** - 地域情報
  - 都道府県情報配列
  - 地域階層情報

- **`timeAxis.json`** - 時間軸情報配列
  - 時間コード、時間名
  - レベル、時間範囲

## 使用方法

### デバッグスクリプトの実行

```bash
# フォーマッターのデバッグ実行
npm run debug:meta-info
```

### ファイルの確認

```bash
# 出力ファイル一覧
ls -la src/infrastructure/estat-api/meta-info/__debug__/output/

# 統計表情報の確認（軽量）
cat src/infrastructure/estat-api/meta-info/__debug__/output/tableInfo.json | jq

# カテゴリ情報の確認
cat src/infrastructure/estat-api/meta-info/__debug__/output/categories.json | jq '.[0:5]'

# 地域情報の確認
cat src/infrastructure/estat-api/meta-info/__debug__/output/areas.json | jq '.prefectures[0:5]'
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

- `formatter-full.json`は完全なデータを含むため、ファイルサイズが大きくなります
- 軽量な確認には`tableInfo.json`や`categories.json`を使用してください
- 不要なファイルは定期的に削除してください
