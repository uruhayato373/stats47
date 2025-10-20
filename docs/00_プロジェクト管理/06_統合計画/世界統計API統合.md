# 世界統計・ランキング機能 API統合計画

## 📋 目次

1. [概要](#概要)
2. [調査したAPIサービス](#調査したapiサービス)
3. [API比較表](#api比較表)
4. [実行可能性評価](#実行可能性評価)
5. [推奨API](#推奨api)
6. [実装方針](#実装方針)
7. [アーキテクチャ設計](#アーキテクチャ設計)
8. [実装例](#実装例)
9. [データベース設計](#データベース設計)
10. [UIコンポーネント設計](#uiコンポーネント設計)
11. [実装ロードマップ](#実装ロードマップ)
12. [リスクと対策](#リスクと対策)
13. [結論](#結論)

---

## 概要

### 目的

このプロジェクト（stats47）に、以下の機能を付加する可能性を調査・検討する：

1. **世界の統計データ表示**: グローバルな統計データの可視化
2. **日本の世界における位置付け**: 世界各国との比較における日本の順位・位置
3. **世界ランキング機能**: 各種指標における国別ランキング表示

### 現状のプロジェクト

- **プロジェクト名**: stats47 - 日本の地域統計データ可視化システム
- **主要技術**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **データソース**: e-Stat API（日本の統計）
- **データベース**: Cloudflare D1 (SQLite)
- **主要機能**:
  - コロプレス地図表示（都道府県別）
  - 16の統計カテゴリー
  - ダッシュボード・ランキング機能
  - ダークモード対応

### 期待される効果

- グローバルな視点での日本の統計理解
- 国際比較による深い洞察
- ユーザーエンゲージメントの向上
- データの多様性と豊富さ

---

## 調査したAPIサービス

### 1. World Bank Open Data API

**概要**: 世界銀行が提供する世界最大級のオープンデータAPI

**公式サイト**:
- API: https://api.worldbank.org/v2/
- ドキュメント: https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information
- 日本データ: https://data.worldbank.org/country/JP

**主要機能**:
- 約16,000の時系列指標
- 国別・地域別データ
- 経済、社会、環境指標
- 1960年代からの歴史データ

**データ形式**: JSON, XML

**認証**: 不要（APIキー不要）

**レート制限**: ドキュメント上明記なし（実質的には寛容）

**日本対応**: ✅ 完全対応（国コード: JP, JPN）

**データ例**:
- GDP
- 人口統計
- 貧困率
- 教育指標
- 健康指標
- インフラ統計

---

### 2. OECD Data API

**概要**: OECD（経済協力開発機構）加盟38カ国の統計データ

**公式サイト**:
- API: https://data.oecd.org/api/
- データエクスプローラー: https://data.oecd.org/
- 日本データ: https://data.oecd.org/japan.htm

**主要機能**:
- OECD加盟国の経済・社会統計
- SDMX標準ベースのRESTful API
- 高品質な比較可能データ

**データ形式**: JSON, XML, SDMX

**認証**: 不要

**レート制限**: 明記なし（利用規約内で使用可能、OECDは使用権を留保）

**日本対応**: ✅ 完全対応（日本は1964年加盟、アジア太平洋地域初）

**データ例**:
- GDP成長率
- 失業率
- 教育水準
- 健康統計
- 環境指標
- 貿易統計

---

### 3. UN Data API

**概要**: 国連の統計データポータル

**公式サイト**:
- ポータル: https://data.un.org/
- 日本データ: http://data.un.org/Search.aspx?q=japan

**主要機能**:
- UN統計データベースへの統合アクセス
- グローバル開発指標
- 人間開発指数（HDI）

**データ形式**: 複数形式対応

**認証**: 不要

**レート制限**: 明記なし

**日本対応**: ✅ 対応
- 人口ランキング: 世界12位
- HDI: 0.925（高度に発展した経済）
- 平均年収: 36,030 USD（高所得国）

**注意事項**: API仕様の詳細ドキュメントは限定的

---

### 4. IMF Data API

**概要**: 国際通貨基金（IMF）の経済データ

**公式サイト**:
- 新ポータル: https://data.imf.org/
- WEOデータベース: https://www.imf.org/external/datamapper/datasets/WEO

**主要機能**:
- 世界経済見通し（WEO）データベース
- 国民経済計算
- インフレ率、失業率
- 国際収支
- 財政指標
- 貿易統計

**データ形式**: JSON, XML

**データ期間**: 1980年～現在 + 2年先の予測

**認証**: 不要

**レート制限**: 明記なし

**日本対応**: ✅ 完全対応（G7メンバー）
- 2025年インフレ率予測: 2.4%
- 2026年インフレ率予測: 1.7%

**重要**:
- レガシーポータル（legacydata.imf.org）は2025年8月31日終了
- 新ポータル（data.imf.org）へ移行完了

---

### 5. Eurostat API

**概要**: 欧州連合（EU）の統計局が提供するAPI

**公式サイト**:
- API: https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-introduction
- データベース: https://ec.europa.eu/eurostat/data/database

**主要機能**:
- EU加盟国の統計データ
- 候補国およびEFTA諸国のデータ
- 主要貿易相手国（米国、カナダ、日本、ロシアなど）の比較データ

**データ形式**: SDMX-ML, SDMX-CSV, JSON-stat

**更新頻度**: 1日2回（11:00 CET、23:00 CET）

**認証**: 不要

**レート制限**: 明記なし

**日本対応**: ✅ 部分的対応
- 国際貿易統計に日本データあり
- 2023年輸出額: €663億（世界4位、シェア3.7%）
- GDP成長率などの主要指標に日本データあり
  - 2025年Q2: 前期比+0.5%、前年比+1.7%

---

### 6. WHO Global Health Observatory (GHO) API

**概要**: 世界保健機関（WHO）の健康統計データ

**公式サイト**:
- GHO: https://www.who.int/data/gho
- API: https://www.who.int/data/gho/info/gho-odata-api
- 日本データ: https://www.who.int/data/gho/data/countries/country-details/GHO/japan

**主要機能**:
- WHO加盟194カ国の健康関連統計
- 2,301の指標（2023年3月時点）
- 数十年にわたる歴史データ

**データ形式**: OData (Open Data Protocol)

**認証**: 不要

**レート制限**: 明記なし

**日本対応**: ✅ 完全対応

**重要**:
⚠️ **現在のOData APIは2025年末に非推奨化予定**
- 新しいOData実装への移行予定
- 最新情報はWHO GHOウェブサイトで確認必要

---

### 7. REST Countries API

**概要**: 国の基本情報を提供するシンプルなRESTful API

**公式サイト**: https://restcountries.com/

**主要機能**:
- 国名、人口、面積
- 通貨、言語
- 地域情報
- 国旗データ

**データ形式**: JSON

**認証**: 不要

**レート制限**: 明記なし

**日本対応**: ✅ 完全対応

**特徴**:
- 非常にシンプルで使いやすい
- 認証不要
- 基本的な国情報に特化

**使用例**: 国の基本プロフィール表示、地図のツールチップ情報など

---

### 8. Our World in Data API

**概要**: 研究に基づく高品質な世界統計データ

**公式サイト**:
- ウェブサイト: https://ourworldindata.org/
- API: https://docs.owid.io/projects/etl/api/
- 日本データ: https://ourworldindata.org/country/japan

**主要機能**:
- チャートデータAPI
- Pythonライブラリ（owid-catalog）
- CSV/JSON形式のダウンロード
- 幅広いトピックのキュレーションされたデータ

**データ形式**: CSV, JSON

**認証**: 不要

**レート制限**: 明記なし

**日本対応**: ✅ 完全対応
- 人口、GDP、平均寿命
- 出生率、その他主要指標

**特徴**:
- 高品質で比較可能なデータ
- 各データセットに詳細なメタデータとコンテキスト
- Pandasデータフレーム形式でアクセス可能
- 適切なクレジット表記が必要

---

## API比較表

| API | 無料アクセス | 認証 | 日本データ | データ品質 | 使いやすさ | 更新頻度 | 備考 |
|-----|----------|------|----------|---------|----------|---------|------|
| **World Bank** | ✅ 完全無料 | 不要 | ✅ 完全対応 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 定期 | 最大規模、16,000指標 |
| **OECD** | ✅ 完全無料 | 不要 | ✅ 完全対応 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 定期 | 高品質、OECD諸国中心 |
| **UN Data** | ✅ 完全無料 | 不要 | ✅ 対応 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 定期 | APIドキュメント限定的 |
| **IMF** | ✅ 完全無料 | 不要 | ✅ 完全対応 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 年2回 | 経済予測あり |
| **Eurostat** | ✅ 完全無料 | 不要 | ⚠️ 部分的 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 1日2回 | EU中心、日本は比較データのみ |
| **WHO GHO** | ✅ 完全無料 | 不要 | ✅ 完全対応 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 定期 | ⚠️ 2025年末API変更 |
| **REST Countries** | ✅ 完全無料 | 不要 | ✅ 完全対応 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 不定期 | 基本情報のみ |
| **Our World in Data** | ✅ 完全無料 | 不要 | ✅ 完全対応 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 定期 | 研究品質、要クレジット |

### 評価基準

- **データ品質**: 信頼性、正確性、完全性
- **使いやすさ**: APIの分かりやすさ、ドキュメントの充実度
- **更新頻度**: データの鮮度

---

## 実行可能性評価

### ✅ 実行可能と判断する理由

#### 1. 技術的実行可能性

**既存インフラとの親和性**:
- 現在のプロジェクトはe-Stat APIを統合済み
- API統合のノウハウとパターンが確立
- TypeScript型定義、エラーハンドリング、データフォーマッターが整備済み

**技術スタックの互換性**:
- すべてのAPIがJSON形式をサポート
- RESTful APIで既存のHTTPクライアントを再利用可能
- 認証不要で実装がシンプル

#### 2. コスト面の実行可能性

- すべてのAPIが**完全無料**
- APIキー不要（World Bank、OECD、Our World in Dataなど）
- レート制限が明示的でない = 寛容な利用条件
- 追加のインフラコスト不要（Cloudflare D1で対応可能）

#### 3. データ品質の実行可能性

- すべてのAPIが**信頼性の高い国際機関**が提供
- データの標準化と比較可能性が保証
- 日本データが完全に利用可能
- 歴史データ + 最新データ + 予測データ（IMF）

#### 4. 法的・ライセンスの実行可能性

- すべてオープンデータ
- 商用利用可能
- 再配布可能（適切なクレジット表記が必要）
- ライセンス上の制約が最小限

---

### 推奨される実装優先度

#### 🥇 Phase 1: 最優先（Core）

1. **World Bank API**
   - 理由: 最大規模、包括的、使いやすい
   - データカバレッジが最も広い
   - 認証不要でシンプル

2. **REST Countries API**
   - 理由: 実装が最も簡単
   - 国の基本情報とメタデータに特化
   - UI/UXの基礎データとして有用

#### 🥈 Phase 2: 高優先（Enhanced）

3. **OECD API**
   - 理由: 高品質、先進国比較に最適
   - 日本がOECD創設メンバー
   - 経済指標の詳細データ

4. **Our World in Data API**
   - 理由: 研究品質、視覚化に最適
   - キュレーションされたデータ
   - コンテキスト情報が豊富

#### 🥉 Phase 3: 追加機能（Specialized）

5. **IMF API**
   - 理由: 経済予測データが有用
   - マクロ経済に特化
   - WEOデータベースの信頼性

6. **WHO GHO API**
   - 理由: 健康統計に特化
   - ⚠️ 2025年末API変更に注意
   - 健康カテゴリーがある場合に有用

#### ❌ Phase X: 保留（Optional）

7. **UN Data API**
   - 理由: APIドキュメントが限定的
   - 他のAPIでカバー可能
   - 必要に応じて将来検討

8. **Eurostat API**
   - 理由: 日本データが部分的
   - EU中心のため優先度低い
   - 国際貿易データのみ有用

---

## 推奨API

### 最優先: World Bank API

**選定理由**:

1. **データの包括性**: 約16,000の指標で世界最大級
2. **使いやすさ**: 認証不要、シンプルなURL構造
3. **日本対応**: 完全対応、豊富なデータ
4. **信頼性**: 世界銀行という確立された機関
5. **ドキュメント**: 充実したドキュメントとサンプル
6. **無料**: 完全無料、レート制限が寛容

**基本的なAPI呼び出し構造**:

```
https://api.worldbank.org/v2/country/{country}/indicator/{indicator}?format=json
```

**例**:
```
# 日本のGDP（最新）
https://api.worldbank.org/v2/country/JP/indicator/NY.GDP.MKTP.CD?format=json

# 日本の人口（過去10年）
https://api.worldbank.org/v2/country/JP/indicator/SP.POP.TOTL?format=json&date=2014:2024

# 全国のGDP（比較用）
https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2024
```

---

## 実装方針

### 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                     フロントエンド                        │
│  (Next.js 15 + React 19 + TypeScript + Tailwind CSS 4)  │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │          新規UIコンポーネント                      │   │
│  │  - WorldStatsDashboard                          │   │
│  │  - CountryComparison                            │   │
│  │  - GlobalRanking                                │   │
│  │  - WorldChoroplethMap                          │   │
│  │  - JapanPositionCard                           │   │
│  └─────────────────────────────────────────────────┘   │
│                          ↓                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │           データフェッチ層（useSWR）                │   │
│  │  - useWorldBankData()                          │   │
│  │  - useOECDData()                               │   │
│  │  - useCountryData()                            │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      Next.js API Routes                 │
│  /api/world-bank/*                                      │
│  /api/oecd/*                                            │
│  /api/countries/*                                       │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │        World Stats API クライアント                │   │
│  │  - WorldBankClient                              │   │
│  │  - OECDClient                                   │   │
│  │  - RESTCountriesClient                          │   │
│  └─────────────────────────────────────────────────┘   │
│                          ↓                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │           データフォーマッター                       │   │
│  │  - WorldBankFormatter                           │   │
│  │  - OECDFormatter                                │   │
│  │  - DataNormalizer                               │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Cloudflare D1 Database                │
│                                                           │
│  テーブル:                                                │
│  - world_indicators (世界指標マスター)                   │
│  - world_data_cache (APIレスポンスキャッシュ)            │
│  - country_rankings (ランキングデータ)                   │
│  - japan_comparisons (日本比較データ)                    │
│                                                           │
└───────────────────────────┬─────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                     外部API                              │
│                                                           │
│  - World Bank API                                        │
│  - OECD API                                              │
│  - REST Countries API                                    │
│  - Our World in Data API                                 │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

### 実装ステップ

#### Phase 1: 基礎構築（Week 1-2）

1. **APIクライアントの実装**
   - `src/lib/world-stats-api/` ディレクトリ作成
   - World Bank API クライアント実装
   - REST Countries API クライアント実装
   - 型定義（TypeScript）

2. **データベーススキーマの拡張**
   - マイグレーションファイル作成
   - 世界統計用テーブル追加
   - インデックス設定

3. **Next.js API Routes**
   - `/api/world-bank/[...path]` 実装
   - `/api/countries/[code]` 実装
   - エラーハンドリング

#### Phase 2: コアコンポーネント（Week 3-4）

4. **UIコンポーネント実装**
   - `WorldStatsDashboard` コンポーネント
   - `CountryComparison` コンポーネント
   - `GlobalRanking` コンポーネント

5. **データ可視化**
   - 世界地図コロプレス（D3.js + TopoJSON）
   - ランキングチャート（Recharts）
   - 比較グラフ

6. **ページ追加**
   - `/world` - 世界統計トップページ
   - `/world/[indicator]` - 指標別ページ
   - `/world/rankings` - ランキングページ
   - `/world/japan-position` - 日本の位置付けページ

#### Phase 3: 拡張機能（Week 5-6）

7. **追加APIの統合**
   - OECD API クライアント
   - Our World in Data API クライアント

8. **高度な機能**
   - カスタムランキング作成
   - 時系列比較
   - 複数指標の相関分析
   - データエクスポート（CSV/JSON）

9. **最適化**
   - キャッシング戦略
   - パフォーマンス最適化
   - レスポンシブデザインの調整

#### Phase 4: テストと改善（Week 7-8）

10. **テスト**
    - ユニットテスト（Vitest）
    - コンポーネントテスト
    - E2Eテスト（Playwright）

11. **ドキュメント**
    - APIドキュメント
    - コンポーネントガイド
    - Storybookストーリー

12. **デプロイ**
    - ステージング環境デプロイ
    - 本番環境デプロイ

---

## アーキテクチャ設計

### ディレクトリ構造

```
stats47/
├── src/
│   ├── app/
│   │   ├── world/                    # 世界統計ページ
│   │   │   ├── page.tsx              # トップページ
│   │   │   ├── rankings/
│   │   │   │   └── page.tsx          # ランキングページ
│   │   │   ├── japan-position/
│   │   │   │   └── page.tsx          # 日本の位置付け
│   │   │   └── [indicator]/
│   │   │       └── page.tsx          # 指標別ページ
│   │   └── api/
│   │       ├── world-bank/
│   │       │   ├── indicators/
│   │       │   │   └── route.ts      # 指標一覧
│   │       │   ├── countries/
│   │       │   │   └── [code]/
│   │       │   │       └── route.ts  # 国別データ
│   │       │   └── data/
│   │       │       └── route.ts      # データ取得
│   │       ├── oecd/
│   │       │   └── [...path]/
│   │       │       └── route.ts
│   │       └── countries/
│   │           └── [code]/
│   │               └── route.ts
│   │
│   ├── lib/
│   │   └── world-stats-api/          # 世界統計API統合
│   │       ├── client/
│   │       │   ├── world-bank-client.ts
│   │       │   ├── oecd-client.ts
│   │       │   ├── rest-countries-client.ts
│   │       │   ├── owid-client.ts
│   │       │   └── http-client.ts
│   │       ├── formatter/
│   │       │   ├── world-bank-formatter.ts
│   │       │   ├── oecd-formatter.ts
│   │       │   └── data-normalizer.ts
│   │       ├── cache/
│   │       │   └── cache-manager.ts
│   │       ├── types/
│   │       │   ├── world-bank.ts
│   │       │   ├── oecd.ts
│   │       │   ├── countries.ts
│   │       │   └── common.ts
│   │       └── constants.ts
│   │
│   ├── components/
│   │   └── world-stats/              # 世界統計コンポーネント
│   │       ├── WorldStatsDashboard.tsx
│   │       ├── CountryComparison.tsx
│   │       ├── GlobalRanking.tsx
│   │       ├── WorldChoroplethMap.tsx
│   │       ├── JapanPositionCard.tsx
│   │       ├── IndicatorSelector.tsx
│   │       ├── CountrySelector.tsx
│   │       └── charts/
│   │           ├── RankingBarChart.tsx
│   │           ├── TimeSeriesChart.tsx
│   │           └── ComparisonChart.tsx
│   │
│   ├── hooks/
│   │   └── world-stats/
│   │       ├── useWorldBankData.ts
│   │       ├── useOECDData.ts
│   │       ├── useCountryData.ts
│   │       └── useGlobalRanking.ts
│   │
│   └── types/
│       └── world-stats.ts
│
├── database/
│   ├── schemas/
│   │   └── world-stats.sql           # 世界統計用スキーマ
│   └── migrations/
│       └── 2025XXXX_add_world_stats_tables.sql
│
└── docs/
    └── 00_project_overview/
        └── world-statistics-api-integration-plan.md  # このドキュメント
```

---

## 実装例

### 1. World Bank API クライアント

```typescript
// src/lib/world-stats-api/client/world-bank-client.ts

import { httpClient } from './http-client';
import type {
  WorldBankIndicator,
  WorldBankCountryData,
  WorldBankApiResponse
} from '../types/world-bank';

const BASE_URL = 'https://api.worldbank.org/v2';

export class WorldBankClient {
  /**
   * 指標一覧を取得
   */
  async getIndicators(): Promise<WorldBankIndicator[]> {
    const url = `${BASE_URL}/indicator?format=json&per_page=1000`;
    const response = await httpClient.get<WorldBankApiResponse>(url);
    return response[1]; // World Bankは [metadata, data] の配列形式
  }

  /**
   * 国別の指標データを取得
   * @param countryCode - 国コード（例: JP, US, CN）
   * @param indicatorCode - 指標コード（例: NY.GDP.MKTP.CD）
   * @param startYear - 開始年（オプション）
   * @param endYear - 終了年（オプション）
   */
  async getCountryData(
    countryCode: string,
    indicatorCode: string,
    startYear?: number,
    endYear?: number
  ): Promise<WorldBankCountryData[]> {
    const dateParam = startYear && endYear
      ? `&date=${startYear}:${endYear}`
      : '';

    const url = `${BASE_URL}/country/${countryCode}/indicator/${indicatorCode}?format=json&per_page=1000${dateParam}`;

    const response = await httpClient.get<WorldBankApiResponse>(url);
    return response[1] || [];
  }

  /**
   * 全国の指標データを取得（ランキング用）
   * @param indicatorCode - 指標コード
   * @param year - 年（デフォルトは最新）
   */
  async getAllCountriesData(
    indicatorCode: string,
    year?: number
  ): Promise<WorldBankCountryData[]> {
    const dateParam = year ? `&date=${year}` : '';
    const url = `${BASE_URL}/country/all/indicator/${indicatorCode}?format=json&per_page=300${dateParam}`;

    const response = await httpClient.get<WorldBankApiResponse>(url);
    return response[1] || [];
  }

  /**
   * 日本のデータを取得
   * @param indicatorCode - 指標コード
   */
  async getJapanData(indicatorCode: string): Promise<WorldBankCountryData[]> {
    return this.getCountryData('JP', indicatorCode);
  }
}

// シングルトンインスタンス
export const worldBankClient = new WorldBankClient();
```

---

### 2. 型定義

```typescript
// src/lib/world-stats-api/types/world-bank.ts

/**
 * World Bank API レスポンス型
 */
export type WorldBankApiResponse = [
  metadata: {
    page: number;
    pages: number;
    per_page: number;
    total: number;
  },
  data: any[]
];

/**
 * 指標情報
 */
export interface WorldBankIndicator {
  id: string;                // 指標コード (例: NY.GDP.MKTP.CD)
  name: string;              // 指標名
  unit: string;              // 単位
  source: {
    id: string;
    value: string;
  };
  sourceNote: string;        // 説明
  sourceOrganization: string;
  topics: Array<{
    id: string;
    value: string;
  }>;
}

/**
 * 国別データ
 */
export interface WorldBankCountryData {
  indicator: {
    id: string;
    value: string;
  };
  country: {
    id: string;
    value: string;
  };
  countryiso3code: string;   // ISO 3文字コード (例: JPN)
  date: string;              // 年
  value: number | null;      // データ値
  unit: string;
  obs_status: string;
  decimal: number;
}

/**
 * ランキングエントリ
 */
export interface RankingEntry {
  rank: number;
  country: string;
  countryCode: string;
  value: number;
  year: string;
}

/**
 * 日本の位置付けデータ
 */
export interface JapanPosition {
  indicator: string;
  indicatorName: string;
  japanValue: number;
  japanRank: number;
  totalCountries: number;
  year: string;
  worldAverage: number;
  percentile: number;        // パーセンタイル
}
```

---

### 3. データフォーマッター

```typescript
// src/lib/world-stats-api/formatter/world-bank-formatter.ts

import type {
  WorldBankCountryData,
  RankingEntry,
  JapanPosition
} from '../types/world-bank';

/**
 * ランキングデータにフォーマット
 */
export function formatToRanking(
  data: WorldBankCountryData[]
): RankingEntry[] {
  // null値を除外してソート
  const validData = data
    .filter(item => item.value !== null && item.value !== undefined)
    .sort((a, b) => (b.value as number) - (a.value as number));

  // ランクを付与
  return validData.map((item, index) => ({
    rank: index + 1,
    country: item.country.value,
    countryCode: item.countryiso3code,
    value: item.value as number,
    year: item.date,
  }));
}

/**
 * 日本の位置付けを計算
 */
export function calculateJapanPosition(
  allData: WorldBankCountryData[],
  indicatorName: string
): JapanPosition | null {
  const ranking = formatToRanking(allData);
  const japanData = ranking.find(entry => entry.countryCode === 'JPN');

  if (!japanData) return null;

  const totalCountries = ranking.length;
  const worldAverage = ranking.reduce((sum, entry) => sum + entry.value, 0) / totalCountries;
  const percentile = ((totalCountries - japanData.rank + 1) / totalCountries) * 100;

  return {
    indicator: allData[0]?.indicator.id || '',
    indicatorName,
    japanValue: japanData.value,
    japanRank: japanData.rank,
    totalCountries,
    year: japanData.year,
    worldAverage,
    percentile: Math.round(percentile * 10) / 10,
  };
}

/**
 * 時系列データを整形
 */
export function formatTimeSeriesData(data: WorldBankCountryData[]) {
  return data
    .filter(item => item.value !== null)
    .sort((a, b) => parseInt(a.date) - parseInt(b.date))
    .map(item => ({
      year: item.date,
      value: item.value,
      country: item.country.value,
    }));
}
```

---

### 4. カスタムフック

```typescript
// src/hooks/world-stats/useWorldBankData.ts

import useSWR from 'swr';
import type { WorldBankCountryData, RankingEntry } from '@/types/world-stats';

interface UseWorldBankDataOptions {
  countryCode?: string;
  indicatorCode: string;
  startYear?: number;
  endYear?: number;
  enabled?: boolean;
}

/**
 * World Bankデータ取得フック
 */
export function useWorldBankData({
  countryCode = 'JP',
  indicatorCode,
  startYear,
  endYear,
  enabled = true,
}: UseWorldBankDataOptions) {
  const params = new URLSearchParams({
    country: countryCode,
    indicator: indicatorCode,
    ...(startYear && { startYear: startYear.toString() }),
    ...(endYear && { endYear: endYear.toString() }),
  });

  const { data, error, isLoading, mutate } = useSWR<WorldBankCountryData[]>(
    enabled ? `/api/world-bank/data?${params}` : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      return response.json();
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1分間は重複リクエストを防ぐ
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

/**
 * ランキングデータ取得フック
 */
export function useGlobalRanking(indicatorCode: string, year?: number) {
  const params = new URLSearchParams({
    indicator: indicatorCode,
    ...(year && { year: year.toString() }),
  });

  const { data, error, isLoading } = useSWR<RankingEntry[]>(
    `/api/world-bank/rankings?${params}`,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch ranking');
      }
      return response.json();
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5分間キャッシュ
    }
  );

  return {
    ranking: data,
    error,
    isLoading,
  };
}
```

---

### 5. UIコンポーネント例

```typescript
// src/components/world-stats/GlobalRanking.tsx

'use client';

import { useGlobalRanking } from '@/hooks/world-stats/useWorldBankData';
import { useStyles } from '@/hooks/useStyles';

interface GlobalRankingProps {
  indicatorCode: string;
  indicatorName: string;
  year?: number;
  topN?: number;
}

export function GlobalRanking({
  indicatorCode,
  indicatorName,
  year,
  topN = 20,
}: GlobalRankingProps) {
  const { ranking, isLoading, error } = useGlobalRanking(indicatorCode, year);
  const styles = useStyles();

  if (isLoading) {
    return <div className={styles.message.info}>読み込み中...</div>;
  }

  if (error) {
    return <div className={styles.message.error}>データの取得に失敗しました</div>;
  }

  if (!ranking || ranking.length === 0) {
    return <div className={styles.message.warning}>データがありません</div>;
  }

  const topRanking = ranking.slice(0, topN);
  const japanEntry = ranking.find(entry => entry.countryCode === 'JPN');

  return (
    <div className={styles.card.base}>
      <h2 className={styles.heading.lg}>{indicatorName} - 世界ランキング</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {year || '最新'} 年 | 対象国: {ranking.length}カ国
      </p>

      {/* 日本の順位（ハイライト） */}
      {japanEntry && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                #{japanEntry.rank}
              </span>
              <span className="ml-2 text-gray-700 dark:text-gray-300">日本</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {japanEntry.value.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                上位 {Math.round((japanEntry.rank / ranking.length) * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ランキングテーブル */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-2 text-left text-sm font-semibold">順位</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">国名</th>
              <th className="px-4 py-2 text-right text-sm font-semibold">値</th>
            </tr>
          </thead>
          <tbody>
            {topRanking.map((entry) => (
              <tr
                key={entry.countryCode}
                className={`
                  border-b border-gray-100 dark:border-gray-800
                  hover:bg-gray-50 dark:hover:bg-gray-800/50
                  ${entry.countryCode === 'JPN' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
              >
                <td className="px-4 py-3 text-sm font-medium">{entry.rank}</td>
                <td className="px-4 py-3 text-sm">
                  {entry.country}
                  {entry.countryCode === 'JPN' && (
                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                      日本
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono">
                  {entry.value.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ranking.length > topN && (
        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          全{ranking.length}カ国中 上位{topN}カ国を表示
        </div>
      )}
    </div>
  );
}
```

---

### 6. Next.js API Route

```typescript
// src/app/api/world-bank/rankings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { worldBankClient } from '@/lib/world-stats-api/client/world-bank-client';
import { formatToRanking } from '@/lib/world-stats-api/formatter/world-bank-formatter';

export const runtime = 'edge'; // Cloudflare Workers互換

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const indicatorCode = searchParams.get('indicator');
    const year = searchParams.get('year');

    if (!indicatorCode) {
      return NextResponse.json(
        { error: 'indicator parameter is required' },
        { status: 400 }
      );
    }

    // World Bank APIからデータ取得
    const data = await worldBankClient.getAllCountriesData(
      indicatorCode,
      year ? parseInt(year) : undefined
    );

    // ランキング形式にフォーマット
    const ranking = formatToRanking(data);

    return NextResponse.json(ranking, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching ranking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ranking data' },
      { status: 500 }
    );
  }
}
```

---

## データベース設計

### マイグレーションSQL

```sql
-- database/migrations/2025XXXX_add_world_stats_tables.sql

-- 世界指標マスターテーブル
CREATE TABLE IF NOT EXISTS world_indicators (
  id TEXT PRIMARY KEY,                    -- 指標コード (例: NY.GDP.MKTP.CD)
  name TEXT NOT NULL,                     -- 指標名
  description TEXT,                       -- 説明
  unit TEXT,                              -- 単位
  source TEXT,                            -- データソース (world_bank, oecd, etc.)
  category TEXT,                          -- カテゴリー
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 世界データキャッシュテーブル
CREATE TABLE IF NOT EXISTS world_data_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  indicator_id TEXT NOT NULL,             -- 指標コード
  country_code TEXT NOT NULL,             -- ISO 3文字コード
  year TEXT NOT NULL,                     -- 年
  value REAL,                             -- データ値
  source TEXT NOT NULL,                   -- データソース
  cached_at INTEGER NOT NULL,             -- キャッシュ日時
  expires_at INTEGER NOT NULL,            -- 有効期限
  FOREIGN KEY (indicator_id) REFERENCES world_indicators(id),
  UNIQUE(indicator_id, country_code, year, source)
);

-- 国別ランキングテーブル
CREATE TABLE IF NOT EXISTS country_rankings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  indicator_id TEXT NOT NULL,             -- 指標コード
  country_code TEXT NOT NULL,             -- ISO 3文字コード
  country_name TEXT NOT NULL,             -- 国名
  year TEXT NOT NULL,                     -- 年
  rank INTEGER NOT NULL,                  -- 順位
  value REAL NOT NULL,                    -- データ値
  total_countries INTEGER NOT NULL,       -- 対象国数
  percentile REAL,                        -- パーセンタイル
  created_at INTEGER NOT NULL,
  FOREIGN KEY (indicator_id) REFERENCES world_indicators(id),
  UNIQUE(indicator_id, country_code, year)
);

-- 日本比較データテーブル
CREATE TABLE IF NOT EXISTS japan_comparisons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  indicator_id TEXT NOT NULL,             -- 指標コード
  year TEXT NOT NULL,                     -- 年
  japan_value REAL NOT NULL,              -- 日本の値
  japan_rank INTEGER NOT NULL,            -- 日本の順位
  world_average REAL,                     -- 世界平均
  oecd_average REAL,                      -- OECD平均
  asia_average REAL,                      -- アジア平均
  total_countries INTEGER NOT NULL,       -- 対象国数
  created_at INTEGER NOT NULL,
  FOREIGN KEY (indicator_id) REFERENCES world_indicators(id),
  UNIQUE(indicator_id, year)
);

-- 国情報テーブル
CREATE TABLE IF NOT EXISTS countries (
  code TEXT PRIMARY KEY,                  -- ISO 3文字コード
  code2 TEXT UNIQUE,                      -- ISO 2文字コード
  name TEXT NOT NULL,                     -- 国名（英語）
  name_ja TEXT,                           -- 国名（日本語）
  region TEXT,                            -- 地域
  income_level TEXT,                      -- 所得レベル
  capital TEXT,                           -- 首都
  currency TEXT,                          -- 通貨
  population INTEGER,                     -- 人口
  area REAL,                              -- 面積
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_world_data_cache_indicator ON world_data_cache(indicator_id);
CREATE INDEX IF NOT EXISTS idx_world_data_cache_country ON world_data_cache(country_code);
CREATE INDEX IF NOT EXISTS idx_world_data_cache_year ON world_data_cache(year);
CREATE INDEX IF NOT EXISTS idx_world_data_cache_expires ON world_data_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_country_rankings_indicator ON country_rankings(indicator_id);
CREATE INDEX IF NOT EXISTS idx_country_rankings_country ON country_rankings(country_code);
CREATE INDEX IF NOT EXISTS idx_country_rankings_year ON country_rankings(year);
CREATE INDEX IF NOT EXISTS idx_country_rankings_rank ON country_rankings(rank);

CREATE INDEX IF NOT EXISTS idx_japan_comparisons_indicator ON japan_comparisons(indicator_id);
CREATE INDEX IF NOT EXISTS idx_japan_comparisons_year ON japan_comparisons(year);

CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region);
```

---

## UIコンポーネント設計

### コンポーネント一覧

#### 1. WorldStatsDashboard
- **目的**: 世界統計のメインダッシュボード
- **機能**:
  - 主要指標のサマリーカード
  - 世界地図（コロプレス）
  - トップ10ランキング
  - 日本のハイライト

#### 2. CountryComparison
- **目的**: 国同士の比較
- **機能**:
  - 複数国選択
  - 複数指標の比較グラフ
  - 時系列比較

#### 3. GlobalRanking
- **目的**: 世界ランキング表示
- **機能**:
  - ランキングテーブル
  - 日本の順位ハイライト
  - フィルタリング・ソート

#### 4. WorldChoroplethMap
- **目的**: 世界地図での可視化
- **機能**:
  - D3.js + TopoJSON
  - 色分け（指標値に応じて）
  - ツールチップ
  - ズーム・パン

#### 5. JapanPositionCard
- **目的**: 日本の位置付け表示
- **機能**:
  - 順位表示
  - パーセンタイル
  - 世界平均との比較
  - トレンド矢印

#### 6. IndicatorSelector
- **目的**: 指標選択UI
- **機能**:
  - カテゴリー別フィルター
  - 検索機能
  - 人気指標のクイック選択

#### 7. CountrySelector
- **目的**: 国選択UI
- **機能**:
  - 地域別フィルター
  - 検索機能
  - 複数選択

---

### デザインシステムの活用

既存の`useStyles`フックを活用：

```typescript
const styles = useStyles();

// カードスタイル
<div className={styles.card.base}>

// メッセージスタイル
<div className={styles.message.info}>
<div className={styles.message.error}>

// ボタンスタイル
<button className={styles.button.primary}>
<button className={styles.button.secondary}>

// 見出しスタイル
<h2 className={styles.heading.lg}>
<h3 className={styles.heading.md}>
```

---

## 実装ロードマップ

### Phase 1: 基礎構築（2週間）

**Week 1**:
- [ ] プロジェクト構造のセットアップ
- [ ] World Bank APIクライアント実装
- [ ] REST Countries APIクライアント実装
- [ ] 型定義の作成
- [ ] HTTPクライアントの実装

**Week 2**:
- [ ] データベーススキーマの作成
- [ ] マイグレーション実行
- [ ] Next.js API Routes実装
- [ ] データフォーマッター実装
- [ ] キャッシュマネージャー実装

**成果物**:
- 基本的なAPI統合
- データベーステーブル
- API Routesエンドポイント

---

### Phase 2: コアコンポーネント（2週間）

**Week 3**:
- [ ] `GlobalRanking`コンポーネント実装
- [ ] `JapanPositionCard`コンポーネント実装
- [ ] `IndicatorSelector`コンポーネント実装
- [ ] カスタムフック実装（useSWR）

**Week 4**:
- [ ] `WorldStatsDashboard`コンポーネント実装
- [ ] `WorldChoroplethMap`コンポーネント実装（D3.js）
- [ ] ランキングページ実装
- [ ] 日本の位置付けページ実装

**成果物**:
- 主要UIコンポーネント
- 世界統計ページ（/world）
- ランキングページ（/world/rankings）

---

### Phase 3: 拡張機能（2週間）

**Week 5**:
- [ ] OECD APIクライアント実装
- [ ] Our World in Data APIクライアント実装
- [ ] `CountryComparison`コンポーネント実装
- [ ] 時系列グラフコンポーネント実装

**Week 6**:
- [ ] カスタムランキング作成機能
- [ ] データエクスポート機能（CSV/JSON）
- [ ] 高度なフィルタリング・検索
- [ ] レスポンシブデザインの最適化

**成果物**:
- 複数APIの統合
- 高度な比較機能
- データエクスポート機能

---

### Phase 4: テストと改善（2週間）

**Week 7**:
- [ ] ユニットテスト（Vitest）
- [ ] コンポーネントテスト
- [ ] E2Eテスト（Playwright）
- [ ] パフォーマンス最適化

**Week 8**:
- [ ] Storybookストーリー作成
- [ ] ドキュメント作成
- [ ] アクセシビリティ改善
- [ ] ステージングデプロイ

**成果物**:
- テストカバレッジ 80%以上
- 完全なドキュメント
- 本番環境準備完了

---

### 総工数見積もり

- **Phase 1**: 80時間（2週間）
- **Phase 2**: 80時間（2週間）
- **Phase 3**: 80時間（2週間）
- **Phase 4**: 80時間（2週間）

**合計**: 約320時間（8週間）

**前提条件**:
- フルタイム1名の開発者
- 既存のプロジェクト構造・デザインシステムを活用
- e-Stat API統合の経験を活用

---

## リスクと対策

### リスク1: APIレート制限

**リスク内容**:
- 無料APIのレート制限により、大量リクエスト時にエラーが発生する可能性

**対策**:
1. **キャッシング戦略**:
   - Cloudflare D1へのデータキャッシュ（有効期限: 24時間）
   - ブラウザキャッシュ（Cache-Control ヘッダー）
   - SWRの重複排除機能

2. **リクエスト最適化**:
   - バッチリクエストの実装
   - 必要最小限のデータのみ取得
   - ページネーション

3. **フォールバック**:
   - キャッシュからのデータ提供
   - エラー時のフレンドリーなメッセージ

---

### リスク2: API仕様変更

**リスク内容**:
- 外部APIの仕様変更により、データ取得が失敗する可能性
- 特にWHO GHO APIは2025年末に変更予定

**対策**:
1. **抽象化レイヤー**:
   - APIクライアントを抽象化
   - データフォーマッターで統一形式に変換
   - APIバージョンごとの実装を分離

2. **モニタリング**:
   - APIエラーの監視
   - 定期的なヘルスチェック
   - アラート機能

3. **ドキュメント監視**:
   - API公式ドキュメントの定期確認
   - 変更通知の購読

---

### リスク3: データ品質のバラつき

**リスク内容**:
- 各APIでデータ形式、精度、更新頻度が異なる

**対策**:
1. **データ正規化**:
   - 統一形式への変換
   - データバリデーション
   - 異常値の検出

2. **メタデータ管理**:
   - データソースの明示
   - 更新日時の表示
   - データ品質の注記

3. **ユーザー通知**:
   - データの出典表示
   - 最終更新日時の表示
   - データ品質に関する注意書き

---

### リスク4: パフォーマンス問題

**リスク内容**:
- 大量データの取得・描画により、パフォーマンスが低下する可能性

**対策**:
1. **遅延読み込み**:
   - ページネーション
   - 仮想スクロール
   - 動的インポート

2. **最適化**:
   - メモ化（React.memo、useMemo）
   - デバウンス・スロットリング
   - Web Worker活用（大量データ処理）

3. **プログレッシブエンハンスメント**:
   - 初回は最小限のデータ表示
   - ユーザーアクションに応じて追加データ取得

---

### リスク5: コスト増加

**リスク内容**:
- データベースサイズの増加により、Cloudflare D1のコストが増加する可能性

**対策**:
1. **キャッシュ戦略**:
   - 古いキャッシュの自動削除
   - アクセス頻度に基づくキャッシュ優先度
   - 圧縮されたデータ保存

2. **データ選別**:
   - 人気のある指標のみキャッシュ
   - 日本関連データの優先保存
   - 不要データの定期クリーンアップ

3. **モニタリング**:
   - データベースサイズの監視
   - クエリパフォーマンスの監視
   - コスト予測

---

## 結論

### 実行可能性: ✅ 高い

本調査により、以下の点から**世界統計・ランキング機能の実装は十分に実行可能**と判断します：

1. **技術的実行可能性**:
   - 既存のe-Stat API統合経験を活用可能
   - すべてのAPIが無料でRESTful、認証不要
   - Next.js 15 + React 19 + TypeScript環境と完全に互換

2. **コスト面の実行可能性**:
   - すべてのAPIが完全無料
   - 追加インフラコストは最小限（Cloudflare D1内で対応可能）

3. **データ品質**:
   - 信頼性の高い国際機関（世界銀行、OECD、IMF、UNなど）が提供
   - 日本データが完全に利用可能

4. **実装工数**:
   - 約320時間（8週間）で実装可能
   - 既存のアーキテクチャ・デザインシステムを最大限活用

---

### 推奨実装優先度

#### 最優先（Phase 1）:
1. **World Bank API** - 最大規模、包括的
2. **REST Countries API** - 実装が最も簡単

#### 高優先（Phase 2）:
3. **OECD API** - 高品質、先進国比較
4. **Our World in Data API** - 研究品質

#### 追加機能（Phase 3）:
5. **IMF API** - 経済予測データ
6. **WHO GHO API** - 健康統計（⚠️ 2025年末API変更に注意）

---

### 期待される効果

1. **ユーザー価値の向上**:
   - 日本の統計をグローバルな視点で理解
   - 国際比較による深い洞察
   - データの多様性と豊富さ

2. **プロジェクトの差別化**:
   - e-Stat（日本） + World Bank（世界）の統合
   - 独自の視点を提供
   - 教育・研究・ビジネスに有用

3. **技術的成長**:
   - 複数API統合の経験
   - グローバルデータの扱い
   - スケーラブルなアーキテクチャ

---

### 次のステップ

1. **ステークホルダーレビュー**: この計画書をレビューし、承認を得る
2. **Phase 1開始**: World Bank API統合から着手
3. **プロトタイプ作成**: 2週間でMVP（最小実行可能製品）を作成
4. **フィードバック収集**: ユーザーテストを実施
5. **反復改善**: フィードバックに基づいて機能を拡張

---

## 参考リンク

### API公式ドキュメント

- [World Bank API](https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information)
- [OECD API](https://data.oecd.org/api/)
- [UN Data](https://data.un.org/)
- [IMF Data](https://data.imf.org/)
- [Eurostat API](https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-introduction)
- [WHO GHO API](https://www.who.int/data/gho/info/gho-odata-api)
- [REST Countries](https://restcountries.com/)
- [Our World in Data API](https://docs.owid.io/projects/etl/api/)

### プロジェクト内部ドキュメント

- [プロジェクトREADME](../../README.md)
- [アーキテクチャ設計書](../../doc/architecture.md)
- [開発ガイド](../02_開発/README.md)
- [e-Stat統合ガイド](../../doc/estat-integration.md)

---

**最終更新日**: 2025年10月17日
**作成者**: Claude Code
**バージョン**: 1.0.0
