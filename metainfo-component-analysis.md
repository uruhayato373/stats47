# estat/metainfoコンポーネント構成分析レポート

**作成日:** 2025-10-12
**対象:** `src/components/estat/metainfo`
**目的:** コンポーネント分離とフォルダ構成の適切性を評価

---

## エグゼクティブサマリー

### 総合評価: **B+ (75/100点)**

**良い点 ✅**
- 機能別にフォルダが分割されている
- Displayフォルダは`components/`で子コンポーネントを適切に分離
- `utils/`でヘルパー関数を分離
- テストとStorybookがある（Actionsのみ）

**改善が必要な点 ⚠️**
- 大きすぎるコンポーネントが存在（280行、218行、170行）
- 命名規則が不統一（Metainfo vs MetaInfo）
- 責務の分離が不十分（ビジネスロジックがUI層に混在）
- テストとStorybookが一部のみ
- フォルダ構造のパターンが不統一

---

## 現在の構造

```
src/components/estat/metainfo/
├── Actions/                    [31行 - Sサイズ] ✅
│   ├── Actions.tsx             (31行)
│   ├── Actions.test.tsx        (72行)
│   ├── Actions.stories.tsx     (36行)
│   ├── types.ts
│   └── index.ts
│
├── Display/                    [280行 - XLサイズ] ⚠️
│   ├── MetaInfoDisplay.tsx     (280行) ← 大きすぎる
│   ├── components/             ✅ 良い分離
│   │   ├── AreaTimeSelectors.tsx    (152行) ⚠️
│   │   ├── ClassificationTabs.tsx   (53行) ✅
│   │   ├── JsonDisplay.tsx          (71行) ✅
│   │   ├── MetaInfoHeader.tsx       (80行) ✅
│   │   ├── PaginatedTable.tsx       (149行) ⚠️
│   │   └── SaveButton.tsx           (51行) ✅
│   ├── utils/
│   │   └── helpers.ts          ✅ 良い分離
│   └── index.ts
│
├── Fetcher/                    [99行 - Mサイズ] ✅
│   ├── MetaInfoFetcher.tsx     (99行)
│   └── index.ts
│
├── Header/                     [54行 - Sサイズ] ✅
│   ├── PageHeader.tsx          (54行)
│   └── index.ts
│
├── SavedDisplay/               [170行 - Lサイズ] ⚠️
│   ├── SavedMetainfoDisplay.tsx (170行) ← 分割の余地あり
│   └── index.ts
│
├── Sidebar/                    [315行 - XXLサイズ] ❌
│   ├── MetainfoSidebar.tsx          (97行) ✅
│   ├── SavedMetainfoList.tsx        (218行) ← 大きすぎる
│   └── index.ts
│
└── index.ts
```

---

## 詳細分析

### 1. コンポーネントのサイズ分析

#### サイズ別分類

| サイズ | 行数 | 評価 | コンポーネント数 |
|--------|------|------|------------------|
| S（小） | ~80行 | ✅ 適切 | 6個 |
| M（中） | 81-120行 | ✅ 適切 | 2個 |
| L（大） | 121-200行 | ⚠️ 分割検討 | 3個 |
| XL（特大） | 201-300行 | ❌ 分割推奨 | 2個 |
| XXL（巨大） | 300行以上 | ❌ 分割必須 | 0個 |

#### 問題のあるコンポーネント

**1. `Display/MetaInfoDisplay.tsx` (280行) - XLサイズ**

**問題点:**
- 複数の責務を持っている
  - データの表示
  - 保存処理のロジック（37-108行）
  - ダウンロード処理（110-153行）
  - タブ切り替えのロジック
- ビジネスロジックがUI層に混在
- テスト困難

**推奨アクション:**
- ロジックをカスタムフックに分離
- 保存・ダウンロード機能を別コンポーネント化

---

**2. `Sidebar/SavedMetainfoList.tsx` (218行) - XLサイズ**

**問題点:**
- リストアイテムの表示とアクションが混在
- 状態管理が複雑（展開/折りたたみ、削除確認など）
- 再利用性が低い

**推奨アクション:**
- リストアイテムを別コンポーネント化
- アクション（削除、表示）を分離

---

**3. `SavedDisplay/SavedMetainfoDisplay.tsx` (170行) - Lサイズ**

**問題点:**
- データ取得とUI表示が混在
- 類似するDisplayと統合できる可能性

**推奨アクション:**
- データ取得をカスタムフックに分離
- DisplayとSavedDisplayを統合するか、共通部分を抽出

---

**4. `Display/components/AreaTimeSelectors.tsx` (152行) - Lサイズ**
**5. `Display/components/PaginatedTable.tsx` (149行) - Lサイズ**

**問題点:**
- 機能が多い（ページネーション、ソート、フィルタリング）

**推奨アクション:**
- ページネーションロジックをカスタムフック化
- 共通テーブルコンポーネントとして`src/components/common`に移動を検討

---

### 2. フォルダ構造のパターン分析

#### パターンA: シンプル構成（推奨されない）

```
Fetcher/
├── MetaInfoFetcher.tsx
└── index.ts
```

**特徴:**
- 1つのコンポーネントのみ
- テストやStorybookがない

**問題:**
- テスタビリティが低い
- スケールしにくい

---

#### パターンB: モジュール構成（推奨）

```
Actions/
├── Actions.tsx
├── Actions.test.tsx         ✅
├── Actions.stories.tsx      ✅
├── types.ts                 ✅
└── index.ts
```

**特徴:**
- テスト・Storybookが完備
- 型定義が分離
- エクスポートを管理

**評価:** ⭐⭐⭐⭐⭐ 模範的

---

#### パターンC: 階層構成（部分的に推奨）

```
Display/
├── MetaInfoDisplay.tsx      ⚠️ 大きすぎる
├── components/              ✅
│   ├── AreaTimeSelectors.tsx
│   ├── ClassificationTabs.tsx
│   └── ...
├── utils/                   ✅
│   └── helpers.ts
└── index.ts
```

**特徴:**
- 子コンポーネントを`components/`に分離
- ヘルパー関数を`utils/`に分離

**評価:** ⭐⭐⭐⭐ 良いが親コンポーネントが大きすぎる

---

### 3. 命名規則の不統一

#### 問題点

| ファイル名 | 命名 | 問題 |
|-----------|------|------|
| `MetaInfoDisplay.tsx` | MetaInfo（キャメルケース） | ✅ |
| `SavedMetainfoDisplay.tsx` | Metainfo（小文字） | ❌ 不統一 |
| `MetainfoSidebar.tsx` | Metainfo（小文字） | ❌ 不統一 |
| `EstatMetainfoActions` | Metainfo（小文字） | ❌ 不統一 |
| `SavedEstatMetainfoList` | Metainfo（小文字） | ❌ 不統一 |

**推奨:**
- すべて`MetaInfo`（キャメルケース）に統一
- または、すべて`Metainfo`に統一（非推奨）

---

### 4. 責務の分離

#### 現在の問題

**UI層にビジネスロジックが混在:**

`Display/MetaInfoDisplay.tsx` (37-108行目)
```typescript
const handleSave = async () => {
  if (!metaInfo) return;

  setSaving(true);
  setSaveResult(null);

  // タイムアウト設定
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const statsDataId = metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF?.["@id"];

    const response = await fetch("/api/estat/metainfo/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statsDataId }),
      signal: controller.signal,
    });

    // ... 長いロジック ...
  } catch (err) {
    // ... エラーハンドリング ...
  }
};
```

**問題:**
- API呼び出しがコンポーネントに直接記述
- エラーハンドリングが複雑
- テストが困難
- 再利用不可

---

### 5. テストカバレッジ

#### 現状

| フォルダ | テスト | Storybook | 評価 |
|---------|--------|-----------|------|
| Actions | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| Display | ❌ | ❌ | ⭐ |
| Fetcher | ❌ | ❌ | ⭐ |
| Header | ❌ | ❌ | ⭐ |
| SavedDisplay | ❌ | ❌ | ⭐ |
| Sidebar | ❌ | ❌ | ⭐ |

**問題:**
- Actionsのみテスト・Storybookがある
- 他のコンポーネントはテスト不足
- リグレッションのリスクが高い

---

### 6. 依存関係の分析

#### 外部依存

```typescript
// 共通
import { useStyles } from "@/hooks/useStyles";  // ✅ カスタムフック
import { lucide-react } from "lucide-react";    // ✅ アイコンライブラリ

// Display
import { EstatMetaInfoResponse } from "@/lib/estat/types";  // ✅ 型定義
import ClassificationTabs from "./components/ClassificationTabs";  // ✅ 子コンポーネント

// SavedDisplay
import EstatMetainfoActions from "../Actions";  // ⚠️ 兄弟コンポーネント依存
```

**問題:**
- `SavedDisplay`が`Actions`に依存している
- フォルダ間の依存関係が明確でない

---

## 改善提案

### 優先度1: 大きなコンポーネントの分割（必須）

#### 1-1. Display/MetaInfoDisplay.tsx の分割

**現在の構造（280行）:**
```typescript
export default function EstatMetaInfoDisplay({ metaInfo, loading, error }) {
  // 状態管理（30行）
  // 保存処理（70行）
  // ダウンロード処理（40行）
  // レンダリング（140行）
}
```

**提案: カスタムフックに分離**

**新しい構造:**
```
Display/
├── MetaInfoDisplay.tsx              (100行) ← UIのみ
├── components/
│   ├── ...existing components...
│   └── MetaInfoActions.tsx          (60行) ← 保存・DL機能
├── hooks/
│   ├── useMetaInfoSave.ts           (50行) ← 保存ロジック
│   ├── useMetaInfoDownload.ts       (40行) ← DLロジック
│   └── useMetaInfoTabs.ts           (30行) ← タブ管理
└── utils/
    └── helpers.ts
```

**実装例:**

**`hooks/useMetaInfoSave.ts`:**
```typescript
import { useState } from "react";
import { EstatMetaInfoResponse } from "@/lib/estat/types";

interface UseMetaInfoSaveOptions {
  timeout?: number;
}

export function useMetaInfoSave(options: UseMetaInfoSaveOptions = {}) {
  const { timeout = 120000 } = options;
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const save = async (metaInfo: EstatMetaInfoResponse) => {
    setSaving(true);
    setSaveResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const statsDataId =
        metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF?.["@id"];

      if (!statsDataId) {
        throw new Error("統計表IDが見つかりません");
      }

      const response = await fetch("/api/estat/metainfo/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statsDataId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      setSaveResult({
        success: true,
        message: result.message || "メタ情報を正常に保存しました",
      });

      return { success: true, message: result.message };
    } catch (err) {
      clearTimeout(timeoutId);

      let errorMessage = "保存に失敗しました";
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage = `保存処理がタイムアウトしました（${timeout / 1000}秒）`;
        } else {
          errorMessage = err.message;
        }
      }

      setSaveResult({
        success: false,
        message: errorMessage,
      });

      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setSaveResult(null);
  };

  return { save, saving, saveResult, reset };
}
```

**`Display/MetaInfoDisplay.tsx`（簡潔版）:**
```typescript
"use client";

import React, { useState } from "react";
import { Code, Database } from "lucide-react";
import { EstatMetaInfoResponse } from "@/lib/estat/types";
import { useMetaInfoSave } from "./hooks/useMetaInfoSave";
import { useMetaInfoDownload } from "./hooks/useMetaInfoDownload";
import ClassificationTabs from "./components/ClassificationTabs";
import JsonDisplay from "./components/JsonDisplay";
import MetaInfoHeader from "./components/MetaInfoHeader";

interface EstatMetaInfoDisplayProps {
  metaInfo: EstatMetaInfoResponse | null;
  loading?: boolean;
  error?: string | null;
}

export default function EstatMetaInfoDisplay({
  metaInfo,
  loading,
  error,
}: EstatMetaInfoDisplayProps) {
  const [activeTab, setActiveTab] = useState(0);
  const { save, saving, saveResult } = useMetaInfoSave();
  const { download } = useMetaInfoDownload();

  const handleSave = () => {
    if (metaInfo) {
      save(metaInfo);
    }
  };

  const handleDownload = () => {
    if (metaInfo) {
      download(metaInfo);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!metaInfo) {
    return null;
  }

  return (
    <div className="space-y-6">
      <MetaInfoHeader
        metaInfo={metaInfo}
        onSave={handleSave}
        saving={saving}
        saveResult={saveResult}
      />

      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      <TabContent
        activeTab={activeTab}
        metaInfo={metaInfo}
        onDownload={handleDownload}
      />
    </div>
  );
}
```

**メリット:**
- ✅ コンポーネントが100行に削減
- ✅ ビジネスロジックが分離
- ✅ テストが容易
- ✅ 再利用可能

---

#### 1-2. Sidebar/SavedMetainfoList.tsx の分割（218行）

**提案: リストアイテムを分離**

**新しい構造:**
```
Sidebar/
├── SavedMetainfoList.tsx              (80行) ← リストコンテナ
├── components/
│   ├── SavedMetainfoListItem.tsx      (100行) ← 1アイテム
│   └── SavedMetainfoListActions.tsx   (40行) ← アクション
└── index.ts
```

---

### 優先度2: 命名規則の統一（推奨）

**すべて`MetaInfo`（キャメルケース）に統一:**

```bash
# リネームスクリプト
mv SavedMetainfoDisplay.tsx SavedMetaInfoDisplay.tsx
mv MetainfoSidebar.tsx MetaInfoSidebar.tsx
# ... 他も同様
```

**または、一括置換:**
```bash
find src/components/estat/metainfo -type f -name "*.tsx" -exec sed -i '' 's/Metainfo/MetaInfo/g' {} +
```

---

### 優先度3: テストとStorybookの追加（推奨）

**各フォルダに追加:**

```
Display/
├── MetaInfoDisplay.tsx
├── MetaInfoDisplay.test.tsx       ← 追加
├── MetaInfoDisplay.stories.tsx    ← 追加
├── components/
│   ├── ClassificationTabs.tsx
│   ├── ClassificationTabs.test.tsx       ← 追加
│   └── ClassificationTabs.stories.tsx    ← 追加
└── ...
```

**テンプレート例（Vitest）:**

```typescript
// Display/MetaInfoDisplay.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EstatMetaInfoDisplay from "./MetaInfoDisplay";

describe("EstatMetaInfoDisplay", () => {
  it("should render loading state", () => {
    render(<EstatMetaInfoDisplay metaInfo={null} loading />);
    expect(screen.getByText(/読み込み中/i)).toBeInTheDocument();
  });

  it("should render error state", () => {
    render(<EstatMetaInfoDisplay metaInfo={null} error="エラー" />);
    expect(screen.getByText(/エラー/i)).toBeInTheDocument();
  });

  it("should call onSave when save button is clicked", async () => {
    const mockMetaInfo = { /* ... */ };
    render(<EstatMetaInfoDisplay metaInfo={mockMetaInfo} />);

    const saveButton = screen.getByRole("button", { name: /保存/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/estat/metainfo/save", /* ... */);
    });
  });
});
```

---

### 優先度4: フォルダ構造の統一（推奨）

**すべてのフォルダをパターンBに統一:**

```
Actions/          ✅ 模範（既存）
Display/          ⚠️ 改善が必要
Fetcher/          ⚠️ テスト追加
Header/           ⚠️ テスト追加
SavedDisplay/     ⚠️ 分割 + テスト
Sidebar/          ⚠️ 分割 + テスト
```

**目標構造（すべてのフォルダ）:**
```
ComponentName/
├── ComponentName.tsx
├── ComponentName.test.tsx         ← 必須
├── ComponentName.stories.tsx      ← 推奨
├── components/                    ← 必要に応じて
│   └── SubComponent.tsx
├── hooks/                         ← 必要に応じて
│   └── useComponentLogic.ts
├── types.ts                       ← 必要に応じて
└── index.ts
```

---

### 優先度5: 共通コンポーネントの抽出（オプション）

**PaginatedTable と AreaTimeSelectors:**

これらは汎用的なコンポーネントなので、`src/components/common`に移動を検討：

```
src/components/common/
├── Table/
│   ├── PaginatedTable.tsx
│   ├── PaginatedTable.test.tsx
│   └── PaginatedTable.stories.tsx
└── Selectors/
    ├── AreaTimeSelectors.tsx
    └── ...
```

**メリット:**
- 他のページでも再利用可能
- メンテナンス性向上

---

## 推奨される新しい構造

### 理想的な構造

```
src/components/estat/metainfo/
├── Actions/
│   ├── Actions.tsx                 (31行) ✅
│   ├── Actions.test.tsx
│   ├── Actions.stories.tsx
│   ├── types.ts
│   └── index.ts
│
├── Display/
│   ├── MetaInfoDisplay.tsx         (100行) ← 分割後
│   ├── MetaInfoDisplay.test.tsx    ← 追加
│   ├── MetaInfoDisplay.stories.tsx ← 追加
│   ├── components/
│   │   ├── ClassificationTabs/
│   │   │   ├── ClassificationTabs.tsx
│   │   │   ├── ClassificationTabs.test.tsx
│   │   │   └── index.ts
│   │   ├── JsonDisplay/
│   │   │   ├── JsonDisplay.tsx
│   │   │   ├── JsonDisplay.test.tsx
│   │   │   └── index.ts
│   │   ├── MetaInfoHeader/
│   │   │   └── ...
│   │   └── SaveButton/
│   │       └── ...
│   ├── hooks/                      ← 追加
│   │   ├── useMetaInfoSave.ts
│   │   ├── useMetaInfoSave.test.ts
│   │   ├── useMetaInfoDownload.ts
│   │   └── useMetaInfoTabs.ts
│   ├── utils/
│   │   └── helpers.ts
│   └── index.ts
│
├── Fetcher/
│   ├── MetaInfoFetcher.tsx
│   ├── MetaInfoFetcher.test.tsx    ← 追加
│   ├── MetaInfoFetcher.stories.tsx ← 追加
│   └── index.ts
│
├── Header/
│   ├── PageHeader.tsx
│   ├── PageHeader.test.tsx         ← 追加
│   ├── PageHeader.stories.tsx      ← 追加
│   └── index.ts
│
├── SavedDisplay/
│   ├── SavedMetaInfoDisplay.tsx    (80行) ← 分割後、命名統一
│   ├── SavedMetaInfoDisplay.test.tsx ← 追加
│   ├── hooks/                      ← 追加
│   │   └── useSavedMetaInfo.ts
│   └── index.ts
│
├── Sidebar/
│   ├── MetaInfoSidebar.tsx         (80行) ← 命名統一
│   ├── MetaInfoSidebar.test.tsx    ← 追加
│   ├── components/                 ← 追加
│   │   ├── SavedMetaInfoListItem.tsx
│   │   └── SavedMetaInfoListActions.tsx
│   └── index.ts
│
└── index.ts
```

---

## 実装ロードマップ

### フェーズ1: 命名規則の統一（1日）

**作業内容:**
- [ ] すべての`Metainfo`を`MetaInfo`に変更
- [ ] ファイル名を変更
- [ ] インポート文を更新
- [ ] エクスポート文を更新

**コマンド:**
```bash
# 一括置換
find src/components/estat/metainfo -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -exec sed -i '' 's/Metainfo/MetaInfo/g' {} +

# ファイル名変更
find src/components/estat/metainfo -name "*Metainfo*" -type f | while read file; do
  mv "$file" "$(echo $file | sed 's/Metainfo/MetaInfo/g')"
done
```

---

### フェーズ2: Display の分割（2-3日）

**作業内容:**
- [ ] `useMetaInfoSave.ts` フックを作成
- [ ] `useMetaInfoDownload.ts` フックを作成
- [ ] `useMetaInfoTabs.ts` フックを作成
- [ ] `MetaInfoDisplay.tsx` を簡潔化
- [ ] テストを追加

**優先順位:** **高**

---

### フェーズ3: Sidebar の分割（1-2日）

**作業内容:**
- [ ] `SavedMetaInfoListItem.tsx` を作成
- [ ] `SavedMetaInfoListActions.tsx` を作成
- [ ] `SavedMetaInfoList.tsx` を簡潔化
- [ ] テストを追加

**優先順位:** **高**

---

### フェーズ4: SavedDisplay の改善（1日）

**作業内容:**
- [ ] `useSavedMetaInfo.ts` フックを作成
- [ ] `SavedMetaInfoDisplay.tsx` を簡潔化
- [ ] テストを追加

**優先順位:** **中**

---

### フェーズ5: テストとStorybookの追加（3-5日）

**作業内容:**
- [ ] Fetcher のテスト・Storybookを追加
- [ ] Header のテスト・Storybookを追加
- [ ] Display子コンポーネントのテスト追加
- [ ] Sidebar のテスト・Storybookを追加

**優先順位:** **中**

---

### フェーズ6: 共通コンポーネントの抽出（オプション、1-2日）

**作業内容:**
- [ ] `PaginatedTable` を `src/components/common` に移動
- [ ] `AreaTimeSelectors` の汎用化を検討
- [ ] テストとStorybookを追加

**優先順位:** **低**

---

## ベストプラクティス

### DO（推奨）

✅ **1つのコンポーネントは100行以下を目指す**
```typescript
// 良い例: 小さくて焦点が明確
function SaveButton({ onSave, saving }: SaveButtonProps) {
  // 50行程度
}
```

✅ **ビジネスロジックはカスタムフックに分離**
```typescript
// hooks/useMetaInfoSave.ts
export function useMetaInfoSave() {
  // ロジックのみ
}
```

✅ **すべてのコンポーネントにテストを追加**
```typescript
// ComponentName.test.tsx
describe("ComponentName", () => {
  it("should render correctly", () => {
    // テストコード
  });
});
```

✅ **命名規則を統一**
```typescript
// すべて MetaInfo（キャメルケース）
MetaInfoDisplay.tsx
MetaInfoSidebar.tsx
SavedMetaInfoDisplay.tsx
```

✅ **フォルダ構造を統一**
```
ComponentName/
├── ComponentName.tsx
├── ComponentName.test.tsx
├── ComponentName.stories.tsx
└── index.ts
```

---

### DON'T（非推奨）

❌ **大きなコンポーネントを作らない（200行以上）**
```typescript
// 悪い例: 280行のコンポーネント
export default function EstatMetaInfoDisplay({ ... }) {
  // 280行...
}
```

❌ **UI層にビジネスロジックを書かない**
```typescript
// 悪い例: コンポーネント内でAPI呼び出し
const handleSave = async () => {
  const response = await fetch("/api/...");
  // 複雑なロジック...
};
```

❌ **命名規則を混在させない**
```typescript
// 悪い例
MetaInfoDisplay.tsx     // キャメルケース
SavedMetainfoDisplay.tsx // 小文字
```

❌ **テストなしでコンポーネントを作らない**
```typescript
// 悪い例: テストファイルがない
ComponentName.tsx  ← これだけ
```

---

## チェックリスト

### 実装前の確認

- [ ] 現在のコンポーネントサイズを測定
- [ ] 依存関係を把握
- [ ] バックアップを作成
- [ ] git ブランチを作成

### 実装中の確認

- [ ] コンポーネントは100行以下か
- [ ] ビジネスロジックが分離されているか
- [ ] 命名規則が統一されているか
- [ ] テストが追加されているか
- [ ] 型定義が適切か

### 実装後の確認

- [ ] すべてのテストが通るか
- [ ] Storybookが動作するか
- [ ] 既存機能が壊れていないか
- [ ] パフォーマンスが維持されているか
- [ ] ドキュメントが更新されているか

---

## まとめ

### 現状評価

**総合評価: B+ (75/100点)**

- ✅ 基本的な構造は良好
- ✅ 機能別にフォルダ分割されている
- ⚠️ 一部のコンポーネントが大きすぎる
- ⚠️ テストカバレッジが不十分
- ⚠️ 命名規則が不統一

### 主な改善点

1. **大きなコンポーネントの分割**（最優先）
   - Display/MetaInfoDisplay.tsx (280行) → 100行以下
   - Sidebar/SavedMetainfoList.tsx (218行) → 80行以下

2. **ビジネスロジックの分離**
   - カスタムフックに移動
   - テスタビリティ向上

3. **命名規則の統一**
   - すべて`MetaInfo`（キャメルケース）

4. **テストとStorybookの追加**
   - すべてのコンポーネントに追加
   - カバレッジ向上

### 期待される効果

- 🚀 **保守性の向上** - 小さなコンポーネントは理解しやすい
- 🧪 **テスタビリティ向上** - ロジックが分離されている
- 🔄 **再利用性向上** - フックやコンポーネントが独立
- 📚 **ドキュメント性向上** - Storybookで視覚的に確認
- 👥 **チーム開発向上** - 統一された構造

---

**作成日:** 2025-10-12
**バージョン:** 1.0
**次回レビュー:** リファクタリング完了後
