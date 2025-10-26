# e-Stat API Feature

## 構造

### core/

共通インフラ層。全機能で共有される基盤コード。

- `client/`: HTTP 通信、API クライアント
- `types/`: 型定義
- `config/`: 設定
- `constants/`: 定数
- `errors/`: エラー定義

### meta-info/

メタ情報取得機能

### stats-data/

統計データ取得機能

### stats-list/

統計表リスト検索機能

## 使い方

詳細は各サブディレクトリの README を参照してください。

## アーキテクチャ

この機能は Domain-Driven Design（DDD）の原則に従って設計されています：

- **core**: Shared Kernel（共通インフラ）
- **各機能**: Bounded Context（独立したドメイン）

詳細は `docs/04_技術設計/01_アーキテクチャ/e-Stat-API-アーキテクチャ.md` を参照してください。
