---
title: 地域ドメイン概要
created: 2025-01-16
updated: 2025-01-16
status: published
tags:
  - stats47
  - domain/area
  - type/overview
author: 開発チーム
version: 1.0.0
---

# 地域ドメイン概要

## ドメインの責任

地域（Area）ドメインは、日本の行政区画（国・都道府県・市区町村）の階層構造を統合管理します。

### 主な責任

1. **都道府県データの管理**: 47 都道府県の基本情報の提供
2. **市区町村データの管理**: 全国約 1,900 の市区町村情報の提供
3. **地域階層の管理**: 国 → 都道府県 → 市区町村の親子関係の管理
4. **地域コードの検証**: 地域コードの妥当性検証と正規化
5. **地域検索機能**: 名前・コードによる地域検索
6. **地域ブロック管理**: 北海道・東北、関東・中部などの地域区分管理

## アーキテクチャ

### サービスレイヤー構成

```
src/lib/area/
├── services/
│   ├── area-service.ts           # 階層管理サービス
│   ├── prefecture-service.ts     # 都道府県サービス
│   └── municipality-service.ts   # 市区町村サービス
├── utils/
│   └── code-converter.ts         # コード変換ユーティリティ
├── validators/
│   └── code-validator.ts         # コード検証
├── types/
│   └── index.ts                  # 型定義
└── index.ts                      # 統一エクスポート
```

### データソース

```
src/config/areas/
├── prefectures.json      # 都道府県マスターデータ (4KB)
└── municipalities.json   # 市区町村マスターデータ (258KB)
```

**特徴**:

- 静的 JSON ファイルとして管理
- ビルド時に最適化・圧縮
- オフライン対応可能
- 高速アクセス

## ドメインの価値

### ビジネス価値

1. **統計データの地域軸**: 全ての統計データは地域コードで分類される
2. **ユーザビリティ向上**: 地域名での検索・フィルタリングが可能
3. **データ整合性**: 単一データソースにより地域データの一貫性を保証

### 技術的価値

1. **データ統合**: 分散していた地域データを一元管理
2. **型安全性**: TypeScript による厳密な型定義
3. **再利用性**: 全ドメインから利用可能な共通基盤
4. **拡張性**: 新しい地域区分の追加が容易

## 関連ドメイン

### 依存するドメイン

なし（最も基盤的なドメイン）

### 依存されるドメイン

- **ranking**: 都道府県・市区町村別ランキングで使用
- **estat-api**: e-Stat API から取得したデータの地域コード解決
- **dashboard**: ダッシュボードの地域フィルタリング
- **visualization**: コロプレス地図での地域表示

### データフロー

```
┌─────────────────┐
│  prefectures.json │
│municipalities.json│
└────────┬──────────┘
         │
         ↓
    ┌─────────┐
    │AreaService│
    └────┬────┘
         │
    ┌────┴────┐
    │         │
    ↓         ↓
Prefecture  Municipality
 Service     Service
    │         │
    └────┬────┘
         │
         ↓
  ┌──────────────┐
  │ 他のドメイン  │
  │ (ranking,    │
  │  estat-api,  │
  │  dashboard)  │
  └──────────────┘
```

## 主要機能

### 1. 都道府県管理

- 全 47 都道府県の取得
- コード ⇔ 名前の相互変換
- 地域ブロック別の取得
- 都道府県検索

### 2. 市区町村管理

- 全市区町村の取得（約 1,900 件）
- 都道府県別の市区町村リスト取得
- 市区町村タイプ別の取得（市・区・町・村）
- 政令指定都市の区管理
- 市区町村検索

### 3. 階層管理

- 親地域・子地域の取得
- 階層パスの取得（国 → 都道府県 → 市区町村）
- 地域タイプの判定
- 地域の完全名称生成

### 4. コード検証

- 地域コードの妥当性検証
- コード形式の正規化
- 2 桁 ⇔5 桁コード変換

## 使用例

### 基本的な使い方

```typescript
import {
  PrefectureService,
  MunicipalityService,
  AreaService,
} from "@/lib/area";

// 都道府県を取得
const tokyo = PrefectureService.getPrefectureByCode("13");
console.log(tokyo?.prefName); // "東京都"

// 市区町村を取得
const chiyoda = MunicipalityService.getMunicipalityByCode("13101");
console.log(chiyoda?.name); // "千代田区"

// 階層パスを取得
const path = AreaService.getHierarchyPath("13101");
// [{ areaName: "日本" }, { areaName: "東京都" }, { areaName: "千代田区" }]
```

### 詳細な使用例

各サービスの詳細な使用例は以下を参照してください：

- [都道府県機能の使い方](./implementation/prefecture-usage.md)
- [市区町村機能の使い方](./implementation/municipality-usage.md)
- [基本的な使い方](./implementation/getting-started.md)

## データ仕様

### 地域コード体系

| レベル   | コード形式 | 例    | 説明     |
| -------- | ---------- | ----- | -------- |
| 国       | 00000      | 00000 | 日本全国 |
| 都道府県 | XX000      | 13000 | 東京都   |
| 市区町村 | XXXXX      | 13101 | 千代田区 |

### 市区町村タイプ

- **city**: 市（一般市、政令指定都市）
- **ward**: 区（政令指定都市の区、東京 23 区）
- **town**: 町
- **village**: 村

詳細は [データ構造](./specifications/data-structure.md) を参照してください。

## パフォーマンス

### メモリ使用量

- prefectures.json: 4KB
- municipalities.json: 258KB → 圧縮後 約 60KB
- **合計**: 約 64KB（圧縮後）

### 初回ロード時間

- Dynamic Import 使用: 必要時のみロード
- 初期化処理: < 10ms
- 検索処理: < 1ms

## テスト戦略

- ユニットテスト: 全サービスクラスの全メソッドをテスト
- データ整合性テスト: JSON データと型定義の一貫性を検証
- エッジケーステスト: 無効なコード、存在しない地域の処理

テスト詳細は [テスト戦略](./testing/test-strategy.md) を参照してください。

## 今後の拡張

### 短期（v1.1）

- 旧市区町村コードへの対応（廃置分合対応）
- 地域の英語名対応
- 地域の緯度経度情報追加

### 中期（v2.0）

- 地域ブロックの詳細化（北海道、東北を分離等）
- 地域の人口・面積などの基本統計追加
- 地域間の距離計算機能

### 長期（v3.0）

- 市町村合併履歴の管理
- 地域の行政情報（首長、議会など）の統合
- 地域のジオコーディング機能

## 参考資料

- [総務省統計局 市区町村コード一覧](https://www.soumu.go.jp/main_content/000000000.html)
- [e-Stat API ドキュメント](https://www.e-stat.go.jp/api/)
- [地域階層システム仕様](./specifications/hierarchy.md)
