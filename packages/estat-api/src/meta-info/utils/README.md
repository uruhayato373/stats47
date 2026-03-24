# utils

純粋関数とヘルパー関数を集約。

## 責務

- e-Stat API レスポンスからのデータ抽出・変換
- 静的定数データへのアクセス
- 副作用を持たない純粋な処理

## 原則

- 1ファイル1関数
- 副作用なし（I/O、ログ出力、例外スローを除く）
- 入力と出力が明確

## ファイル一覧

| ファイル | 関数 | 説明 |
|----------|------|------|
| `extract-categories.ts` | `extractCategories` | 分類項目の抽出 |
| `determine-area-type.ts` | `determineAreaType` | 地域タイプ判定 |

