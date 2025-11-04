---
title: eStat API（統計表リスト）サブドメイン設計
created: 2025-10-14
updated: 2025-01-26
status: published
tags:
  - stats47
  - domain/estat-api
  - subdomain/stats-list
  - design
author: 開発チーム
version: 2.0.0
---

# eStat API（統計表リスト）サブドメイン設計

## 概要

統計表リストサブドメインは、eStat API ドメインの一部で、e-Stat API から利用可能な統計表の一覧を取得し、検索・フィルタリング機能を提供します。ユーザーが目的の統計表を見つけやすくするための検索機能と、統計表の基本情報を管理します。

### ビジネス価値

- **統計表の探索**: キーワードや条件から統計表を検索し、統計表 ID を取得
- **メタデータ管理**: 統計表の基本情報（タイトル、更新日、作成機関など）の管理
- **ユーザビリティ向上**: 効率的な検索機能により、目的の統計データへのアクセスを容易化

---

## 目次

1. [責務と主要概念](#責務と主要概念)
2. [ドメインモデル](#ドメインモデル)
3. [アーキテクチャ設計](#アーキテクチャ設計)
4. [データソースとストレージ](#データソースとストレージ)
5. [主要機能](#主要機能)
6. [制約と前提条件](#制約と前提条件)

---

## 責務と主要概念

### 責務

1. **統計表一覧の取得**

   - e-Stat API から統計表リストを取得
   - ページネーション対応
   - 基本情報の整形

2. **検索機能**

   - キーワード検索
   - 政府統計名での検索
   - 統計表題名での検索

3. **フィルタリング**

   - 政府統計名での絞り込み
   - 統計分野での絞り込み
   - 更新日での絞り込み

4. **ソート機能**

   - 更新日順ソート
   - 統計表名順ソート
   - 政府統計名順ソート

### 主要概念

#### StatsDataId（統計表 ID）

e-Stat の各統計表に付与される一意の識別子。

**具体例**: `0000010101`（人口推計）、`0003084821`（就業構造基本調査）

**制約**: 10 桁の数字、e-Stat で定義された ID のみ有効

**用途**: 統計データ取得時の識別子、統計表の一意識別

#### SearchWord（検索キーワード）

統計表を検索するためのキーワード。

**用途**: 統計表名、政府統計名、統計表題名からの検索

#### SearchKind（検索種別）

検索対象を指定する値。

- `"1"`: 政府統計名で検索
- `"2"`: 統計表題で検索
- `"3"`: 項目名で検索

#### StatsField（統計分野コード）

統計の分野を表すコード。

**具体例**: `"02"`（人口・世帯）、`"03"`（労働・賃金）

**用途**: 分野による統計表の絞り込み

---

## ドメインモデル

### 主要エンティティ

#### EstatStatsList（統計表リスト）

e-Stat API から取得した統計表リストを管理するエンティティ。

**属性**:

- `list`: 統計表項目の配列
- `totalCount`: 総件数
- `startPosition`: 開始位置
- `limit`: 取得件数

**型定義**:

```typescript
interface EstatStatsList {
  list: StatListItem[];
  totalCount: number;
  startPosition: number;
  limit: number;
}
```

#### StatListItem（統計表項目）

統計表の基本情報を管理するエンティティ。

**属性**:

- `id`: 統計表 ID
- `statName`: 政府統計名
- `title`: 統計表題名
- `govOrg`: 作成機関名
- `statisticsName`: 提供統計名
- `surveyDate`: 調査年月
- `updatedDate`: 更新日

**型定義**:

```typescript
interface StatListItem {
  id: string;
  statName: string;
  title: string;
  govOrg: string;
  statisticsName: string;
  surveyDate: string;
  updatedDate: string;
  description?: string;
}
```

### データ変換の段階

#### Raw Response（生 API レスポンス）

e-Stat API から返される生の JSON 形式のデータ。

#### Formatted Data（整形済みデータ）

アプリケーションで扱いやすいように変換されたデータ。

- 構造化された形式
- 統一されたプロパティ名
- 不要な情報の除去

---

## アーキテクチャ設計

### ディレクトリ構造

```
src/features/estat-api/stats-list/
├── actions.ts                  # Server Actions
├── services/
│   ├── fetcher.ts              # API通信（データ取得）
│   └── formatter.ts            # データ変換処理
├── types/
│   ├── index.ts
│   └── stats-list-response.ts  # 型定義
└── components/                 # UIコンポーネント
    ├── StatsListSearch/
    └── StatsListResults/
```

### レイヤー構造

```
┌─────────────────────────────────────┐
│   Presentation Layer                │
│   (StatsListSearch, StatsListResults)│
└───────────┬─────────────────────────┘
            │
┌───────────▼─────────────────────────┐
│   Service Layer                     │
│   - fetchStatsList()                │
│   - searchStatsListByKeyword()      │
│   - formatStatsList()               │
└───────────┬─────────────────────────┘
            │
┌───────────▼─────────────────────────┐
│   Core Layer (HTTP Client)          │
│   - executeHttpRequest              │
└───────────┬─────────────────────────┘
            │
┌───────────▼─────────────────────────┐
│   External Services                 │
│   - e-Stat API                      │
└─────────────────────────────────────┘
```

### データフロー

```
検索オプション
    │
    ▼
Server Action (searchStatsListAction)
    │
    ▼
searchStatsListByKeyword()
    │
    ├─► fetchStatsList()
    │       │
    │       ├─► executeHttpRequest()
    │       │       │
    │       │       ▼
    │       │   e-Stat API
    │       │       │
    │       │       ▼
    │       │   Raw Response
    │       │
    │       └─► formatStatsList()
    │               │
    │               ├─► formatTableList()
    │               └─► formatTableInf()
    │                       │
    │                       ▼
    │               Formatted Data
    │
    └─► Formatted Data
```

### 実装方針

**Server Action による実装**:

- **Server Action を使用**: すべてのデータ取得は Server Action で実装
- **Route Handler は使用しない**: API Route Handler（`/api/...`）は使用せず、Server Action のみを使用
- **useSWR は使用しない**: サーバーサイドでのデータ取得のため、クライアントサイドの useSWR は使用しない
- **純粋関数で実装**: クラスではなく純粋関数を使用し、テストと再利用性を向上
- **キャッシュ**: Next.js 15 の`use cache`ディレクティブを使用して関数レベルでのキャッシュを実装

**理由**:

- **型安全性**: TypeScript で完全に型付けされた API
- **パフォーマンス**: サーバーサイドでの実行により、クライアントへの負荷を軽減
- **Next.js 15 の推奨パターン**: Next.js 15 では Server Action が推奨される実装方法
- **関数の純粋性**: 副作用を最小化し、テストが容易で、再利用性が高い

### 設計パターン

#### 1. 純粋関数パターン

**目的**: データ取得と整形の責務を分離し、テストと再利用性を向上

- **取得関数**: HTTP 通信と生データ取得（`fetchStatsList()`, `searchStatsListByKeyword()`）
- **整形関数**: データの整形と変換（`formatStatsList()`, `formatTableList()`, `formatTableInf()`）
- **関数の純粋性**: 副作用を最小化し、同じ入力に対して同じ出力を返す

#### 2. Server Action による実装

**目的**: 型安全性とパフォーマンス向上

- サーバーサイドでのデータ取得
- Next.js 15 の`use cache`ディレクティブによるキャッシュ
- 型安全性の向上

---

## データソースとストレージ

### データソース

#### e-Stat API（外部サービス）

**エンドポイント**: `/getStatsList`

**用途**: 統計表一覧の取得

**認証**: アプリケーション ID（環境変数 `NEXT_PUBLIC_ESTAT_APP_ID`）

**レート制限**: 1 日あたり 1,000 回、1 時間あたり 100 回（推奨）

### キャッシュ戦略

**Next.js 15 の`use cache`ディレクティブ**:

- **関数レベルのキャッシュ**: Server Action 内で`use cache`ディレクティブを使用
- **入力パラメータに基づく自動キャッシュ**: 同じパラメータでの呼び出しはキャッシュから返却
- **複数リクエスト間で有効**: 単一リクエストだけでなく、異なるリクエスト間でもキャッシュが有効

**実装例**:

```typescript
// src/features/estat-api/stats-list/actions.ts
"use server";

import { searchStatsListByKeyword } from "./services/fetcher";

export async function searchStatsListAction(options: {
  searchWord?: string;
  limit?: number;
  startPosition?: number;
}) {
  // Edge Runtimeでは"use cache"が使用できないため削除
  // キャッシュが必要な場合は、リポジトリ層でfetchキャッシュまたはunstable_cacheを使用

  return await searchStatsListByKeyword(options.searchWord || "", {
    limit: options.limit,
    startPosition: options.startPosition,
  });
}
```

---

## 主要機能

### 1. 統計表リスト取得

**機能**: e-Stat API から統計表一覧を取得

**主要関数**:

- `fetchStatsList()`: 統計リスト取得
- `searchStatsListByKeyword()`: キーワード検索

**特徴**:

- ページネーション対応
- 検索条件の柔軟な指定
- Server Action による実装
- 純粋関数による実装

### 2. データ整形

**機能**: 生 API レスポンスを整形済みデータに変換

**主要関数**:

- `formatStatsList()`: リストの整形
- `formatTableList()`: 統計表リストの整形
- `formatTableInf()`: 統計表情報の整形

**特徴**:

- 統一されたデータ構造
- 不要な情報の除去
- NULL 値の適切な処理
- 純粋関数による実装（同じ入力に対して同じ出力を返す）

### 3. 検索・フィルタリング

**機能**: 統計表の検索と絞り込み

**対応する検索条件**:

- キーワード検索
- 政府統計名検索
- 統計分野での絞り込み
- 更新日での絞り込み

---

## 制約と前提条件

### 制約

1. **レート制限**: e-Stat API の制限を遵守する必要がある
2. **取得件数**: 1 回の取得で最大 10,000 件まで
3. **検索精度**: キーワード検索は部分一致

### 前提条件

1. **環境変数**: `NEXT_PUBLIC_ESTAT_APP_ID` が設定されている必要がある
2. **ネットワーク**: e-Stat API へのインターネットアクセスが必要
3. **データの可用性**: 統計表リストの可用性は e-Stat API に依存
