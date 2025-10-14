# デバッグ出力ファイル

このディレクトリには、`EstatStatsDataFormatter`とヘルパー関数のデバッグ実行結果が出力されます。

## ファイル一覧

### フォーマッター関連

- **`formatter-full.json`** - フォーマッターの完全な変換結果
  - 実行時刻、処理時間、入力データ情報
  - 完全な`FormattedEstatData`オブジェクト
  - ファイルサイズが大きいため、詳細確認用

- **`formatter-summary.json`** - フォーマッターのサマリー版
  - 実行時刻、処理時間
  - テーブル情報（基本情報、コード、日付、特性）
  - メタデータ（統計、範囲、品質）
  - サンプル値（最初の5件）
  - 統計情報（総件数、有効値、NULL値、完全性スコア）
  - 注記情報

- **`formatter-stats.json`** - フォーマッターの統計情報
  - パフォーマンス情報（処理時間、メモリ使用量）
  - データ品質指標
  - 次元別統計（地域、カテゴリ、年度）
  - テーブル情報の詳細

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

# サマリー版の確認（軽量）
cat src/lib/estat-api/stats-data/__debug__/output/formatter-summary.json | jq

# 統計情報の確認
cat src/lib/estat-api/stats-data/__debug__/output/formatter-stats.json | jq '.dataQuality'
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
- 必要に応じて`formatter-summary.json`を使用してください
- 不要なファイルは定期的に削除してください
