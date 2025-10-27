# e-Stat API アーキテクチャ

## 概要

e-Stat API 機能は`src/features/estat-api`に統合され、
core サブドメインと機能ドメインに分離されています。

## 構造

### core（共通インフラ層）

- **client/**: API クライアント（HTTP 通信）
- **types/**: 型定義（全機能で共有）
- **config/**: 設定（API URL、タイムアウト等）
- **constants/**: 定数
- **errors/**: エラー定義

### 機能ドメイン

- **meta-info/**: メタ情報取得・整形
- **stats-data/**: 統計データ取得・変換
- **stats-list/**: 統計表リスト検索

## 依存関係

- 機能ドメイン → core（一方向）
- 機能間の相互依存は禁止

## 使用方法

### 1. core から直接インポート

```typescript
import { estatAPI } from "@/features/estat-api/core/client";
import { EstatMetaInfoResponse } from "@/features/estat-api/core/types";
```

### 2. 統合 index から（推奨）

```typescript
import { estatAPI, EstatMetaInfoResponse } from "@/features/estat-api";
```

### 3. 機能固有のサービス

```typescript
import { EstatMetaInfoFetcher } from "@/features/estat-api/meta-info";
```

## アーキテクチャの利点

### 1. 責務の明確化

- `core` = 共通インフラ（再利用可能な基盤）
- 各機能 = ビジネスロジック（`core`を利用）

### 2. 依存関係の可視化

- 各機能は`core`に依存
- 機能間の相互依存を防止

### 3. 拡張性の向上

- 新機能追加時は`core`を利用するだけ
- core の変更は全機能に影響（意図的）

### 4. テスト戦略の明確化

- `core`: 単体テスト（インフラ層）
- 各機能: 統合テスト（ビジネスロジック）

### 5. DDD 原則の完全適用

- Shared Kernel（`core`）と各 Bounded Context（機能）の明確な分離

### 6. import 文の一貫性

- 全て`@/features/estat-api`配下
- `core`か特定機能かが明確

## 依存関係の図

```
┌─────────────────────────────────────┐
│   src/features/estat-api/           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  core/  (Shared Kernel)     │   │
│  │  - client                   │   │
│  │  - types                    │   │
│  │  - config                   │   │
│  │  - errors                   │   │
│  │  - constants                │   │
│  └─────────────────────────────┘   │
│         ↑        ↑        ↑         │
│         │        │        │         │
│    ┌────┘   ┌────┘   ┌────┘        │
│    │        │        │              │
│  ┌─┴──┐  ┌─┴──┐  ┌─┴──┐          │
│  │meta│  │data│  │list│           │
│  │info│  │    │  │    │           │
│  └────┘  └────┘  └────┘           │
└─────────────────────────────────────┘
```

## 注意点

- `core`は他の機能に依存してはいけない（一方向依存）
- 各機能間の相互依存も禁止（`core`経由のみ）
- `core`の変更は影響範囲が大きいため慎重に
- 約 77 ファイルの import 更新が必要
