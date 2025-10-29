---
title: eStat API（メタ情報）サブドメイン設計
created: 2025-01-18
updated: 2025-01-26
status: published
tags:
  - stats47
  - domain/estat-api
  - subdomain/meta-info
  - design
author: 開発チーム
version: 2.0.0
---

# eStat API（メタ情報）サブドメイン設計

## 概要

メタ情報サブドメインは、eStat API ドメインの一部で、e-Stat API から取得した統計表のメタ情報（基本情報、分類情報、地域情報、時間軸情報など）を取得・変換・管理する責務を持ちます。統計データを取得する前に、利用可能な分類項目や地域コードを確認するために使用されます。

### ビジネス価値

- **データ構造の事前把握**: 統計データ取得前に、利用可能な分類項目や地域を確認
- **検証機能**: データ取得前にリクエストパラメータの妥当性を検証
- **UI 選択肢生成**: 検索・フィルタリング用の選択肢を自動生成
- **効率的なデータ取得**: メタ情報をキャッシュすることで API 呼び出しを削減

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

1. **メタ情報の取得**

   - e-Stat API から統計表のメタ情報を取得
   - R2 キャッシュからの優先取得
   - エラーハンドリングとリトライ

2. **データ変換**

   - 生 API レスポンスを構造化された形式に変換
   - テーブル情報、分類情報、地域情報、時間軸情報の抽出
   - アプリケーション用の形式への正規化

3. **検証機能**

   - データ取得前のパラメータ検証
   - 地域コード・分類コードの存在確認
   - 時間軸の妥当性確認

4. **キャッシュ管理**

   - R2 ストレージへのメタ情報保存
   - キャッシュヒット率の向上
   - バックグラウンドでのキャッシュ更新

### 主要概念

#### StatsDataId（統計表 ID）

e-Stat の各統計表に付与される一意の識別子。

**具体例**: `0003412313`（国勢調査）、`0000010101`（人口推計）

**制約**: 8-10 桁の数字、e-Stat で定義された ID のみ有効

**用途**: メタ情報取得時の識別子、統計表の一意識別

#### TableInfo（統計表情報）

統計表の基本情報を管理する値オブジェクト。

**属性**: ID、統計調査名、作成機関、統計表タイトル、調査年月、更新日など

**用途**: 統計表の基本情報表示、検索・フィルタリング

#### CategoryInfo（分類情報）

統計データの分類項目（男女別、年齢別など）を管理する値オブジェクト。

**属性**: 分類 ID（cat01〜cat15）、分類名、分類項目の配列

**用途**: UI 選択肢の生成、データ取得時のパラメータ検証

#### AreaInfo（地域情報）

統計データの地域情報（全国、都道府県、市区町村など）を管理する値オブジェクト。

**属性**: 地域コード、地域名、階層レベル、親コード

**用途**: 地域選択 UI の生成、地域コードの検証

#### TimeAxisInfo（時間軸情報）

統計データの時間軸（年次、月次など）を管理する値オブジェクト。

**属性**: 利用可能な年次の配列、最小年次、最大年次

**用途**: 年次選択 UI の生成、時間範囲の検証

---

## ドメインモデル

### 主要エンティティ

#### EstatMetaInfoResponse（生 API レスポンス）

e-Stat API から返される生のメタ情報レスポンス。

**型定義**: `src/features/estat-api/core/types` を参照

**構造**:

- `GET_META_INFO.RESULT`: リクエスト結果（STATUS, ERROR_MSG）
- `GET_META_INFO.METADATA_INF.TABLE_INF`: 統計表情報
- `GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ`: 分類情報

#### TableInfo（統計表情報）

統計表の基本情報を管理するエンティティ。

| 属性名         | 型       | 説明                       |
| -------------- | -------- | -------------------------- |
| `id`           | `string` | 統計表 ID                  |
| `statName`     | `string` | 統計調査名                 |
| `organization` | `string` | 作成機関                   |
| `title`        | `string` | 統計表タイトル             |
| `cycle`        | `string` | 周期（"5 年"、"年次"など） |
| `surveyDate`   | `string` | 調査年月                   |
| `totalRecords` | `number` | 総データ件数               |
| `updatedDate`  | `string` | 更新日                     |

型定義は`src/features/estat-api/meta-info/types/`を参照してください。

#### CategoryInfo（分類情報）

統計データの分類項目を管理するエンティティ。

| 属性名  | 型                                                          | 説明                                               |
| ------- | ----------------------------------------------------------- | -------------------------------------------------- |
| `id`    | `string`                                                    | 分類 ID（"cat01"〜"cat15"、"area"、"time"、"tab"） |
| `name`  | `string`                                                    | 分類名                                             |
| `items` | `Array<{ code: string; name: string; unit?: string; ... }>` | 分類項目の配列                                     |

型定義は`src/features/estat-api/meta-info/types/`を参照してください。

#### ParsedMetaInfo（解析済みメタ情報）

メタ情報を完全解析した結果を管理するエンティティ。

| 属性名                  | 型               | 説明           |
| ----------------------- | ---------------- | -------------- |
| `tableInfo`             | `TableInfo`      | 統計表基本情報 |
| `dimensions.categories` | `CategoryInfo[]` | 分類情報の配列 |
| `dimensions.areas`      | `AreaInfo[]`     | 地域情報の配列 |
| `dimensions.timeAxis`   | `TimeAxisInfo`   | 時間軸情報     |

型定義は`src/features/estat-api/meta-info/types/`を参照してください。

### データ変換の段階

#### Raw Response（生 API レスポンス）

e-Stat API から返される生の JSON 形式のデータ。

#### Formatted Data（整形済みデータ）

アプリケーションで扱いやすいように変換されたデータ。

- 構造化された形式
- 統一されたプロパティ名
- 不要な情報の除去
- NULL 値の適切な処理

---

## アーキテクチャ設計

### ディレクトリ構造

```
src/features/estat-api/meta-info/
├── actions.ts                  # Server Actions
├── services/
│   ├── fetcher.ts              # API通信（データ取得）
│   └── formatter.ts            # データ変換処理
├── types/
│   └── index.ts                # 型定義
└── components/                 # UIコンポーネント
    ├── EstatMetaInfoFetcher/
    ├── EstatMetaInfoDisplay/
    └── EstatMetaInfoSidebar/
```

### レイヤー構造

```
┌─────────────────────────────────────┐
│   Presentation Layer                │
│   (EstatMetaInfoFetcher, Display)   │
└───────────┬─────────────────────────┘
            │
┌───────────▼─────────────────────────┐
│   Service Layer                     │
│   - fetchMetaInfo()                 │
│   - fetchAndTransformMetaInfo()     │
│   - parseCompleteMetaInfo()         │
│   - extractTableInfo()              │
│   - extractCategories()             │
│   - extractTimeAxis()               │
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
│   - R2 Storage (Cache)              │
└─────────────────────────────────────┘
```

### データフロー

```
統計表ID
    │
    ▼
Server Action (fetchMetaInfoAction)
    │
    ├─► R2キャッシュ確認
    │       │
    │       ├─► ヒット → キャッシュ返却
    │       │
    │       └─► ミス → e-Stat API
    │                   │
    │                   ▼
    │               executeHttpRequest()
    │                       │
    │                       ▼
    │                   Raw Response
    │                       │
    │                       ▼
    │                   バックグラウンドR2保存
    │
    └─► parseCompleteMetaInfo()
            │
            ├─► extractTableInfo()
            ├─► extractCategories()
            ├─► extractTimeAxis()
            └─► extractAreaHierarchy()
                    │
                    ▼
            ParsedMetaInfo
```

### 実装方針

**Server Action による実装**:

- **Server Action を使用**: すべてのデータ取得は Server Action で実装
- **Route Handler は使用しない**: API Route Handler（`/api/...`）は使用せず、Server Action のみを使用
- **useSWR は使用しない**: サーバーサイドでのデータ取得のため、クライアントサイドの useSWR は使用しない
- **純粋関数で実装**: クラスではなく純粋関数を使用し、テストと再利用性を向上
- **キャッシュ**: Next.js 15 の`use cache`ディレクティブと R2 ストレージを併用

**理由**:

- **型安全性**: TypeScript で完全に型付けされた API
- **パフォーマンス**: サーバーサイドでの実行により、クライアントへの負荷を軽減
- **Next.js 15 の推奨パターン**: Next.js 15 では Server Action が推奨される実装方法
- **関数の純粋性**: 副作用を最小化し、テストが容易で、再利用性が高い
- **キャッシュの効率性**: R2 キャッシュにより API 呼び出しを削減

### 設計パターン

#### 1. 純粋関数パターン

**目的**: データ取得と整形の責務を分離し、テストと再利用性を向上

- **取得関数**: HTTP 通信と生データ取得（`fetchMetaInfo()`, `fetchAndTransformMetaInfo()`）
- **整形関数**: データの整形と変換（`parseCompleteMetaInfo()`, `extractTableInfo()`, `extractCategories()`, `extractTimeAxis()`）
- **関数の純粋性**: 副作用を最小化し、同じ入力に対して同じ出力を返す

#### 2. Server Action による実装

**目的**: 型安全性とパフォーマンス向上

- サーバーサイドでのデータ取得
- Next.js 15 の`use cache`ディレクティブによるキャッシュ
- 型安全性の向上

#### 3. R2 キャッシュパターン

**目的**: API 呼び出しの削減とパフォーマンス向上

- R2 キャッシュを優先的に確認
- キャッシュミス時のみ e-Stat API から取得
- バックグラウンドでの R2 保存（非同期）

---

## データソースとストレージ

### データソース

#### e-Stat API（外部サービス）

**エンドポイント**: `/getMetaInfo`

**用途**: 統計表のメタ情報取得

**認証**: アプリケーション ID（環境変数 `NEXT_PUBLIC_ESTAT_APP_ID`）

**レート制限**: 1 日あたり 1,000 回、1 時間あたり 100 回（推奨）

#### API パラメータ

**基本パラメータ**:

| パラメータ名  | 必須 | 説明                                           | 例            |
| ------------- | ---- | ---------------------------------------------- | ------------- |
| `appId`       | ○    | アプリケーション ID                            | `YOUR_APP_ID` |
| `lang`        | -    | 言語設定<br>J: 日本語（デフォルト）<br>E: 英語 | `J`           |
| `statsDataId` | △    | 統計表 ID（8-10 桁）                           | `0003412313`  |
| `dataSetId`   | △    | データセット ID                                | `DATASET001`  |

**重要**: `statsDataId`と`dataSetId`は**どちらか一方のみ**を指定。

**オプションパラメータ**:

| パラメータ名        | 説明         | デフォルト | 値                         |
| ------------------- | ------------ | ---------- | -------------------------- |
| `explanationGetFlg` | 解説情報取得 | `Y`        | `Y`: 取得、`N`: 取得しない |

#### API レスポンス構造

**基本構造**:

```json
{
  "GET_META_INFO": {
    "RESULT": {
      "STATUS": 0,
      "ERROR_MSG": "正常に終了しました。",
      "DATE": "2024-01-15T10:30:00.000+09:00"
    },
    "PARAMETER": {
      "LANG": "J",
      "STATS_DATA_ID": "0003412313",
      "DATA_FORMAT": "J"
    },
    "METADATA_INF": {
      "TABLE_INF": {
        // 統計表情報
      },
      "CLASS_INF": {
        // 分類情報
      }
    }
  }
}
```

**TABLE_INF（統計表情報）**:

統計表の基本情報を含みます。

| フィールド             | 説明               | 例                                       |
| ---------------------- | ------------------ | ---------------------------------------- |
| `@id`                  | 統計表 ID          | `"0003412313"`                           |
| `STAT_NAME`            | 統計調査名         | `{"@code": "00200522", "$": "国勢調査"}` |
| `GOV_ORG`              | 作成機関           | `{"@code": "00200", "$": "総務省"}`      |
| `STATISTICS_NAME`      | 統計名称           | `"令和2年国勢調査 人口等基本集計"`       |
| `TITLE`                | 統計表タイトル     | `"都道府県，男女別人口"`                 |
| `CYCLE`                | 周期               | `"5年"`、`"年次"`、`"-"`                 |
| `SURVEY_DATE`          | 調査年月           | `"202010"`                               |
| `OPEN_DATE`            | 公開日             | `"2021-11-30"`                           |
| `SMALL_AREA`           | 小地域データ有無   | `"0"`: なし、`"1"`: あり                 |
| `COLLECT_AREA`         | 集計地域区分       | `"全国"`、`"都道府県"`、`"市区町村"`     |
| `MAIN_CATEGORY`        | 主分類             | `{"@code": "02", "$": "人口・世帯"}`     |
| `SUB_CATEGORY`         | 副分類             | `{"@code": "01", "$": "人口"}`           |
| `OVERALL_TOTAL_NUMBER` | 総データ件数       | `"2350"`                                 |
| `UPDATED_DATE`         | 更新日時           | `"2023-12-01"`                           |
| `STATISTICS_NAME_SPEC` | 統計名称詳細       | 統計の階層情報                           |
| `TITLE_SPEC`           | 統計表タイトル詳細 | タイトルの階層情報                       |
| `EXPLANATION`          | 解説               | 統計の概要説明                           |

**CLASS_INF（分類情報）**:

統計データの各次元（軸）の詳細情報を提供します。

**CLASS_OBJ の種類**:

| @id              | 名称     | 説明                             |
| ---------------- | -------- | -------------------------------- |
| `tab`            | 表章項目 | 統計表の主題（人口、世帯数など） |
| `cat01`〜`cat15` | 分類事項 | 男女別、年齢別など（最大 15 個） |
| `area`           | 地域     | 全国、都道府県、市区町村         |
| `time`           | 時間軸   | 年次、月次、日次など             |

**CLASS の属性**:

| 属性          | 説明         | 例                              |
| ------------- | ------------ | ------------------------------- |
| `@code`       | 項目コード   | `"001"`, `"13000"`              |
| `@name`       | 項目名称     | `"総数"`, `"東京都"`            |
| `@unit`       | 単位         | `"人"`, `"%"`                   |
| `@level`      | 階層レベル   | `"1"`: 最上位、`"2"`: 第 2 階層 |
| `@parentCode` | 親項目コード | `"00000"` (全国)                |

### R2 ストレージ構造

R2 ストレージへのキャッシュは以下のディレクトリ構造で管理されます。詳細は [R2 ストレージ設計ドキュメント](../04_インフラ設計/02_R2ストレージ設計.md#estatapi-ドメイン) を参照してください。

```
estat-api/
└── meta-info/                   # メタ情報キャッシュ
    └── {statsDataId}.json       # 統計表IDベースのファイル名
```

**キー生成規則**:

- **メタ情報**: `estat-api/meta-info/{statsDataId}.json`

**パラメータ**:

- `statsDataId`: 統計表 ID（8-10 桁、例: `0003412313`）

**例**:

- `estat-api/meta-info/0003412313.json`（統計表 ID: `0003412313`）
- `estat-api/meta-info/0003000001.json`（統計表 ID: `0003000001`）

**キャッシュデータ形式**:

オリジナルの API レスポンス（`EstatMetaInfoResponse`）を JSON 形式でそのまま保存します。これにより、解析ロジックが変更されても同じオリジナルデータから再解析が可能です。

### キャッシュ戦略

#### 1. R2 ストレージ（永続キャッシュ）

**目的**: 複数リクエスト間でのキャッシュ共有、永続性の確保

**詳細**: R2 ストレージの設計詳細については、[R2 ストレージ設計](../04_インフラ設計/02_R2ストレージ設計.md)を参照してください。

**実装**:

- R2 バケットにメタ情報を JSON 形式で保存
- キー設計: `estat-api/meta-info/{statsDataId}.json`
- キャッシュヒット時は R2 から返却
- キャッシュミス時は e-Stat API から取得し、バックグラウンドで R2 に保存

**メリット**:

- サーバー再起動後もデータが保持される
- 複数の Worker インスタンス間でキャッシュを共有
- API 呼び出しを大幅に削減

#### 2. Next.js 15 の`use cache`ディレクティブ

**目的**: 関数レベルのキャッシュによる複数リクエスト間での効率化

**実装例**:

```typescript
// src/features/estat-api/meta-info/actions.ts
"use server";

import { fetchMetaInfo } from "./services/fetcher";

export async function fetchMetaInfoAction(statsDataId: string) {
  "use cache"; // Next.js 15でのキャッシュ（複数リクエスト間で有効）

  return await fetchMetaInfo(statsDataId);
}
```

**特徴**:

- 関数レベルのキャッシュ
- 入力パラメータに基づく自動キャッシュ
- 複数リクエスト間で有効

#### 3. ハイブリッドキャッシュ戦略

**推奨**: R2 キャッシュと`use cache`ディレクティブの組み合わせ

1. Server Action 内で`use cache`を有効化
2. `fetchMetaInfo()`関数内で R2 キャッシュを優先的に確認
3. R2 キャッシュミス時のみ e-Stat API から取得
4. 取得したデータをバックグラウンドで R2 に保存

---

## 主要機能

### 1. メタ情報取得

**機能**: e-Stat API から統計表のメタ情報を取得

**主要関数**:

- `fetchMetaInfo()`: メタ情報取得（R2 キャッシュ優先）
- `fetchAndTransformMetaInfo()`: 取得と変換を一括実行

**特徴**:

- R2 キャッシュによる高速化
- エラーハンドリングとリトライ
- Server Action による実装
- 純粋関数による実装

### 2. データ変換

**機能**: 生 API レスポンスを整形済みデータに変換

**主要関数**:

- `parseCompleteMetaInfo()`: メタ情報の完全解析
- `extractTableInfo()`: 統計表基本情報の抽出
- `extractCategories()`: 分類情報の抽出
- `extractTimeAxis()`: 時間軸情報の抽出
- `extractAreaHierarchy()`: 地域階層情報の抽出

**特徴**:

- 統一されたデータ構造
- 不要な情報の除去
- NULL 値の適切な処理
- 純粋関数による実装（同じ入力に対して同じ出力を返す）

### 3. 検証機能

**機能**: データ取得前のパラメータ検証

**対応する検証**:

- 地域コードの存在確認
- 分類コードの存在確認
- 時間軸の妥当性確認
- 統計表 ID の妥当性確認

### 4. R2 キャッシュ管理

**機能**: メタ情報の R2 ストレージへの保存と取得

**特徴**:

- キャッシュヒット率の向上
- バックグラウンドでのキャッシュ更新
- 複数リクエスト間でのキャッシュ共有

---

## 制約と前提条件

### 制約

1. **レート制限**: e-Stat API の制限を遵守する必要がある
2. **統計表 ID の妥当性**: e-Stat で定義された ID のみ有効
3. **データ構造**: e-Stat API のレスポンス構造に依存
4. **R2 設定**: 本番環境では R2 バケットの設定が必要

### 前提条件

1. **環境変数**: `NEXT_PUBLIC_ESTAT_APP_ID` が設定されている必要がある
2. **ネットワーク**: e-Stat API へのインターネットアクセスが必要
3. **データの可用性**: メタ情報の可用性は e-Stat API に依存
4. **R2 バケット**: 本番環境では R2 バケット（`METAINFO_BUCKET`）の設定が必要（開発環境ではフォールバック）
