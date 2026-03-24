# eStat-API メタ情報（meta-info）

## 概要

e-Stat API の `getMetaInfo` エンドポイントから取得した統計表のメタ情報（基本情報、分類、地域、時間軸）をパースし、アプリケーションで扱いやすい形式に変換・管理する責務を担います。

## 主要な責務

- **メタ情報の取得**: e-Stat API からのフェッチ、および R2 ストレージへのキャッシュ管理。
- **データ変換 (Parser)**: 生の API レスポンス（JSON）を `TableInfo`, `CategoryInfo`, `AreaInfo`, `TimeAxisInfo` などの正規化された構造体へ変換。
- **キャッシュ設計**: `estat-api/meta-info/{statsDataId}.json` のパスで R2 に保存し、API 呼び出し回数を抑制。

## 主要なデータ構造

### ParsedMetaInfo
パース後のメタ情報は以下の構造を持ちます。
- `tableInfo`: 統計表の基本情報（タイトル、調査年月、更新日等）。
- `dimensions.categories`: 分類項目（cat01〜cat15）の配列。
- `dimensions.areas`: 地域階層情報の配列。
- `dimensions.timeAxis`: 利用可能な年度情報のリスト。

## ディレクトリ構成

- `services/`: API フェッチャー、フォーマッター、パーサー。
- `types/`: API レスポンスおよびパース後の型定義。
- `utils/`: 単位抽出や名前解決などのユーティリティ。

## 実装上の注意

- **R2 キャッシュ優先**: データフェッチ時は常に R2 キャッシュを先に確認し、存在しない場合のみ e-Stat API を叩きます。
- **純粋関数**: パーサーは副作用を持たない純粋関数として実装されており、テストが容易です。
- **単位抽出**: e-Stat の複雑な `CLASS_OBJ` 構造から、階層を遡って適切な `unit` を特定するロジックを備えています。
