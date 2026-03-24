# definitions-card ハイブリッド方式への移行

## 概要

`slide-presentation` と同じパターンで、`definitions-card` のコンテンツをファイルベースのレジストリで管理する。DB には `definitionSetKey` のみ保存し、実データは TypeScript ファイルに定義する。

後方互換性は不要。既存の `definition` フィールド等は削除し、`slide-presentation` と同じクリーンな設計にする。

## slide-presentation との対比

| 項目 | slide-presentation | definitions-card |
|------|-------------------|------------------|
| DB config | `{ slideSetKey: string }` | `{ definitionSetKey: string }` |
| データファイル | `data/slides/fiscal-indicators.tsx` | `data/definitions/revenue.ts` |
| レジストリ | `SLIDE_REGISTRY` → `getSlideSet()` | `DEFINITION_REGISTRY` → `getDefinitionSet()` |
| データ型 | `SlideData[]` | `DefinitionSetData` |

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `types/index.ts` | `DefinitionSetData` 型を追加。`definitions-card` config を `{ definitionSetKey: string }` のみに簡素化。旧フィールド (`definition`, `description`, `badge`, `groups`, `source`) を削除 |
| `data/definitions/revenue.ts` | **新規** — revenue 用の定義データ |
| `data/definitions/index.ts` | **新規** — レジストリ + `getDefinitionSet()` |
| `components/cards/DefinitionsCard.tsx` | レジストリからデータ取得。SimpleDefinitionsCard を削除し、StructuredDefinitionsCard のみに |
| `components/DashboardComponentRenderer.tsx` | skip-guard を `definitionSetKey` ベースに変更 |

## 型定義

```typescript
/** definitions-card のファイルベースデータ（レジストリに登録） */
export interface DefinitionSetData {
  /** ヘッダー説明文 */
  description?: string;
  /** バッジラベル */
  badge?: string;
  /** 構造化グループ */
  groups: DefinitionGroup[];
  /** データソース表示 */
  source?: string;
}

// DashboardConfigMap — slide-presentation と同じシンプルな構造
"definitions-card": {
  definitionSetKey: string;
};
```

## ファイル構成

```
apps/web/src/features/stat-charts/data/
├── slides/
│   ├── fiscal-indicators.tsx
│   ├── index.ts
│   └── README.md
└── definitions/          ← 新規ディレクトリ
    ├── revenue.ts        ← 歳入の定義データ
    ├── index.ts          ← レジストリ
    └── PLAN.md           ← この方針書
```

## revenue.ts のデータ

```typescript
import type { DefinitionSetData } from "../../types";

export const revenueDefinition: DefinitionSetData = {
  description: "地方公共団体の1会計年度におけるすべての収入のことです。",
  badge: "用語解説 & データ定義",
  groups: [
    {
      name: "自主財源",
      description: "自ら集められるお金（比率が高いほど財政が安定）",
      icon: "wallet",
      color: "emerald",
      items: [
        { name: "地方税", cat01: "C1111", rankingKey: "local-tax" },
        { name: "分担金及び負担金", cat01: "C1113", rankingKey: "shares-and-charges" },
        { name: "使用料及び手数料", cat01: "C1114", rankingKey: "fees-and-charges" },
        { name: "財産収入", cat01: "C1115", rankingKey: "property-income" },
        { name: "寄附金", cat01: "C1116", rankingKey: "donations" },
        { name: "繰入金", cat01: "C1117", rankingKey: "transfers-in" },
        { name: "繰越金", cat01: "C1118", rankingKey: "carried-forward" },
        { name: "諸収入", cat01: "C1119", rankingKey: "miscellaneous-revenue" },
      ],
    },
    {
      name: "依存財源",
      description: "国などから交付・借入するお金",
      icon: "building",
      color: "amber",
      items: [
        { name: "地方譲与税", cat01: "C1121", rankingKey: "local-transfer-tax" },
        { name: "地方交付税", cat01: "C1122", rankingKey: "local-allocation-tax" },
        { name: "交通安全対策特別交付金", cat01: "C1123" },
        { name: "国庫支出金", cat01: "C1125", rankingKey: "national-treasury-disbursements" },
        { name: "都道府県支出金", cat01: "C1126", rankingKey: "prefectural-disbursements" },
        { name: "地方債", cat01: "C1127", rankingKey: "local-bonds" },
        { name: "特別区財政調整交付金", cat01: "C1128" },
        { name: "地方特例交付金等", cat01: "C1130", rankingKey: "special-local-grants" },
      ],
    },
  ],
  source: "e-Stat 地方財政状況調査 市町村別決算状況調",
};
```

## DefinitionsCard コンポーネント

```typescript
export const DefinitionsCard: React.FC<DashboardItemProps<"definitions-card">> = ({
  common,
  config,
}) => {
  const data = getDefinitionSet(config.definitionSetKey);

  if (!data) {
    return null; // or fallback
  }

  // data (DefinitionSetData) を使ってリッチ表示
  // SimpleDefinitionsCard は削除、StructuredDefinitionsCard のみ
};
```

## DashboardComponentRenderer の skip-guard

```typescript
if (type === "definitions-card") {
  const defConfig = config as DashboardItemProps<"definitions-card">["config"];
  if (!getDefinitionSet(defConfig.definitionSetKey)) {
    return null;
  }
}
```
