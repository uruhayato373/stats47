# API Repository Tests

このディレクトリには、e-Stat APIからのデータ取得ロジック (`fetchFromApi`) に関するテストが含まれています。

## ファイル構成

- **`fetch-from-api.test.ts` (Unit Test)**
  - モックを使用した通常のユニットテストです。
  - CI/CDパイプラインや通常のテスト実行時に実行されます。
  - APIリクエストの構築、リトライロジック、レスポンスのバリデーションなどが正しく機能することを検証します。
  - **実際のAPIにはアクセスしません。**

- **`manual-download.test.ts` (Manual Test)**
  - 実際のe-Stat APIにアクセスし、データをダウンロードするためのマニュアルテストです。
  - 通常のテスト実行（`vitest run`）では、環境変数が設定されていない限りスキップされます。
  - 実データの構造確認や、API仕様の変更検知に使用します。

## マニュアルテストの実行方法

実際のデータをダウンロードするには、`NEXT_PUBLIC_ESTAT_APP_ID` 環境変数を設定してテストを実行します。

```bash
# stats47のルートディレクトリで実行
export NEXT_PUBLIC_ESTAT_APP_ID=あなたのAppID
npx vitest run packages/estat-api/src/stats-data/__tests__/repositories/api/manual-download.test.ts
```

### データの保存先

テストが成功すると、以下のディレクトリにJSONファイルが保存されます。
保存されたファイルはgit管理外（`.gitignore`対象）とすることを推奨します。

`packages/estat-api/src/stats-data/__manual_data__/stats-{STATS_DATA_ID}.json`
