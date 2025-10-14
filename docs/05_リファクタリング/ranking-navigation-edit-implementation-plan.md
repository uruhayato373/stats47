# RankingNavigation データベース編集機能 実装方針

## 概要

RankingNavigation.tsxに、ランキング項目の編集・追加機能を実装します。
管理者がランキング項目を動的に管理できるようにします。

---

## 現在の構成

### データベーススキーマ

#### 1. subcategory_configs テーブル
```sql
CREATE TABLE IF NOT EXISTS subcategory_configs (
  id TEXT PRIMARY KEY,              -- 'land-area', 'land-use'
  category_id TEXT NOT NULL,        -- 'landweather'
  name TEXT NOT NULL,               -- '土地面積', '土地利用'
  description TEXT,
  default_ranking_key TEXT,         -- デフォルトの統計項目
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. ranking_items テーブル
```sql
CREATE TABLE IF NOT EXISTS ranking_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id TEXT NOT NULL,     -- 'land-area', 'land-use'
  ranking_key TEXT NOT NULL,        -- 'totalAreaExcluding'など
  label TEXT NOT NULL,              -- '総面積（除く）'
  stats_data_id TEXT NOT NULL,      -- '0000010102'
  cd_cat01 TEXT NOT NULL,           -- 'B1101'
  unit TEXT NOT NULL,               -- 'ha'
  name TEXT NOT NULL,               -- '総面積（北方地域及び竹島を除く）'
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subcategory_id, ranking_key)
);
```

### 既存のAPI

#### GET /api/ranking-items/[subcategoryId]
- **機能**: サブカテゴリのランキング項目を取得
- **レスポンス**:
  ```typescript
  {
    subcategory: SubcategoryConfig;
    rankingItems: RankingItem[];
  }
  ```

### データ型定義

```typescript
// src/lib/ranking/get-ranking-items.ts
interface RankingItem {
  rankingKey: string;
  label: string;
  statsDataId: string;
  cdCat01: string;
  unit: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

interface SubcategoryConfig {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  defaultRankingKey: string;
}
```

---

## 実装する機能

### 1. ランキング項目の編集機能
- 既存のランキング項目の情報を更新
- ラベル、表示順序、有効/無効の切り替え

### 2. 新規ランキング項目の追加機能
- 新しいランキング項目を作成
- 統計データID、カテゴリコード、単位、名前などを設定

### 3. ランキング項目の削除機能（ソフトデリート）
- is_activeをfalseに設定して非表示にする
- 物理削除はせず、論理削除

### 4. 表示順序の変更機能
- ドラッグ&ドロップで順序を入れ替え
- display_orderを更新

---

## API設計

### 1. 更新API: PUT /api/ranking-items/[id]

#### リクエスト
```typescript
PUT /api/ranking-items/123
Content-Type: application/json

{
  "label": "新しいラベル",
  "displayOrder": 5,
  "isActive": true
}
```

#### レスポンス
```typescript
{
  "success": true,
  "rankingItem": {
    "id": 123,
    "subcategoryId": "land-area",
    "rankingKey": "totalAreaExcluding",
    "label": "新しいラベル",
    "statsDataId": "0000010102",
    "cdCat01": "B1101",
    "unit": "ha",
    "name": "総面積（北方地域及び竹島を除く）",
    "displayOrder": 5,
    "isActive": true,
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

### 2. 作成API: POST /api/ranking-items

#### リクエスト
```typescript
POST /api/ranking-items
Content-Type: application/json

{
  "subcategoryId": "land-area",
  "rankingKey": "newRankingItem",
  "label": "新しい統計項目",
  "statsDataId": "0000010102",
  "cdCat01": "B1105",
  "unit": "ha",
  "name": "新しい統計項目の名前",
  "displayOrder": 10,
  "isActive": true
}
```

#### レスポンス
```typescript
{
  "success": true,
  "rankingItem": {
    "id": 124,
    "subcategoryId": "land-area",
    "rankingKey": "newRankingItem",
    "label": "新しい統計項目",
    "statsDataId": "0000010102",
    "cdCat01": "B1105",
    "unit": "ha",
    "name": "新しい統計項目の名前",
    "displayOrder": 10,
    "isActive": true,
    "createdAt": "2025-01-15T10:35:00Z",
    "updatedAt": "2025-01-15T10:35:00Z"
  }
}
```

### 3. 削除API: DELETE /api/ranking-items/[id]

#### リクエスト
```typescript
DELETE /api/ranking-items/123
```

#### レスポンス（ソフトデリート）
```typescript
{
  "success": true,
  "message": "ランキング項目を無効化しました",
  "rankingItem": {
    "id": 123,
    "isActive": false,
    "updatedAt": "2025-01-15T10:40:00Z"
  }
}
```

### 4. 並び替えAPI: PATCH /api/ranking-items/reorder

#### リクエスト
```typescript
PATCH /api/ranking-items/reorder
Content-Type: application/json

{
  "subcategoryId": "land-area",
  "reorderedItems": [
    { "id": 1, "displayOrder": 1 },
    { "id": 3, "displayOrder": 2 },
    { "id": 2, "displayOrder": 3 },
    { "id": 4, "displayOrder": 4 }
  ]
}
```

#### レスポンス
```typescript
{
  "success": true,
  "message": "表示順序を更新しました",
  "updatedCount": 4
}
```

---

## UI/UX設計

### 1. 編集モード切り替え

#### 通常モード（現在の実装）
- ランキング項目を一覧表示
- 項目をクリックでランキング詳細に遷移

#### 編集モード
- 「編集」ボタンをクリックで切り替え
- 各項目に編集・削除ボタンを表示
- ドラッグハンドルで並び替え可能
- 「新規追加」ボタンを表示

### 2. 編集モーダル

#### 編集時
```
┌─────────────────────────────────────┐
│  ランキング項目を編集               │
├─────────────────────────────────────┤
│                                     │
│  ラベル                             │
│  ┌───────────────────────────────┐  │
│  │ 総面積（除く）                │  │
│  └───────────────────────────────┘  │
│                                     │
│  統計データID                       │
│  ┌───────────────────────────────┐  │
│  │ 0000010102                    │  │
│  └───────────────────────────────┘  │
│                                     │
│  カテゴリコード                     │
│  ┌───────────────────────────────┐  │
│  │ B1101                         │  │
│  └───────────────────────────────┘  │
│                                     │
│  単位                               │
│  ┌───────────────────────────────┐  │
│  │ ha                            │  │
│  └───────────────────────────────┘  │
│                                     │
│  名前                               │
│  ┌───────────────────────────────┐  │
│  │ 総面積（北方地域及び竹島を除く）│  │
│  └───────────────────────────────┘  │
│                                     │
│  表示順序                           │
│  ┌───────────────────────────────┐  │
│  │ 1                             │  │
│  └───────────────────────────────┘  │
│                                     │
│  □ 有効                            │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ キャンセル│  │  保存    │        │
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘
```

#### 新規追加時
```
┌─────────────────────────────────────┐
│  新しいランキング項目を追加         │
├─────────────────────────────────────┤
│                                     │
│  ランキングキー *                   │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  └───────────────────────────────┘  │
│  ※英数字のみ、一意である必要あり   │
│                                     │
│  ラベル *                           │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  統計データID *                     │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  カテゴリコード *                   │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  単位 *                             │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  名前 *                             │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  表示順序                           │
│  ┌───────────────────────────────┐  │
│  │ 1                             │  │
│  └───────────────────────────────┘  │
│                                     │
│  ☑ 有効                            │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ キャンセル│  │  追加    │        │
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘
```

### 3. 編集モードのUI（RankingNavigation改修）

```tsx
{isEditMode ? (
  // 編集モード
  <div>
    <div className="flex justify-between items-center mb-4">
      <h3>統計項目（編集モード）</h3>
      <button onClick={() => setIsEditMode(false)}>完了</button>
    </div>

    <DraggableList items={tabOptions}>
      {(option, dragHandleProps) => (
        <div className="flex items-center gap-2">
          <div {...dragHandleProps}>☰</div>
          <div className="flex-1">{option.label}</div>
          <button onClick={() => handleEdit(option)}>編集</button>
          <button onClick={() => handleDelete(option)}>削除</button>
        </div>
      )}
    </DraggableList>

    <button onClick={handleAdd}>+ 新規追加</button>
  </div>
) : (
  // 通常モード（現在の実装）
  <div>
    <div className="flex justify-between items-center mb-4">
      <h3>統計項目</h3>
      <button onClick={() => setIsEditMode(true)}>編集</button>
    </div>

    {/* 現在のリスト表示 */}
  </div>
)}
```

---

## 実装手順

### フェーズ1: API実装

#### ステップ1: PUT /api/ranking-items/[id]/route.ts を作成

```typescript
// src/app/api/ranking-items/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { label, displayOrder, isActive } = body;

    // バリデーション
    if (!label || typeof displayOrder !== 'number') {
      return NextResponse.json(
        { error: "必須フィールドが不足しています" },
        { status: 400 }
      );
    }

    const db = await createD1Database();

    const query = `
      UPDATE ranking_items
      SET
        label = ?,
        display_order = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = await db
      .prepare(query)
      .bind(label, displayOrder, isActive ? 1 : 0, id)
      .run();

    if (!result.success) {
      throw new Error("更新に失敗しました");
    }

    // 更新後のデータを取得
    const updatedItem = await db
      .prepare("SELECT * FROM ranking_items WHERE id = ?")
      .bind(id)
      .first();

    return NextResponse.json({
      success: true,
      rankingItem: updatedItem,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await createD1Database();

    // ソフトデリート
    const query = `
      UPDATE ranking_items
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = await db.prepare(query).bind(id).run();

    if (!result.success) {
      throw new Error("削除に失敗しました");
    }

    return NextResponse.json({
      success: true,
      message: "ランキング項目を無効化しました",
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
```

#### ステップ2: POST /api/ranking-items/route.ts を作成

```typescript
// src/app/api/ranking-items/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      subcategoryId,
      rankingKey,
      label,
      statsDataId,
      cdCat01,
      unit,
      name,
      displayOrder = 0,
      isActive = true,
    } = body;

    // バリデーション
    if (!subcategoryId || !rankingKey || !label || !statsDataId || !cdCat01 || !unit || !name) {
      return NextResponse.json(
        { error: "必須フィールドが不足しています" },
        { status: 400 }
      );
    }

    // rankingKeyの形式チェック（英数字のみ）
    if (!/^[a-zA-Z0-9_-]+$/.test(rankingKey)) {
      return NextResponse.json(
        { error: "ランキングキーは英数字、ハイフン、アンダースコアのみ使用できます" },
        { status: 400 }
      );
    }

    const db = await createD1Database();

    const query = `
      INSERT INTO ranking_items (
        subcategory_id,
        ranking_key,
        label,
        stats_data_id,
        cd_cat01,
        unit,
        name,
        display_order,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db
      .prepare(query)
      .bind(
        subcategoryId,
        rankingKey,
        label,
        statsDataId,
        cdCat01,
        unit,
        name,
        displayOrder,
        isActive ? 1 : 0
      )
      .run();

    if (!result.success) {
      // 一意制約違反のチェック
      if (result.error?.includes("UNIQUE")) {
        return NextResponse.json(
          { error: "同じランキングキーが既に存在します" },
          { status: 409 }
        );
      }
      throw new Error("作成に失敗しました");
    }

    // 作成されたデータを取得
    const newItem = await db
      .prepare("SELECT * FROM ranking_items WHERE id = last_insert_rowid()")
      .first();

    return NextResponse.json(
      {
        success: true,
        rankingItem: newItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
```

#### ステップ3: PATCH /api/ranking-items/reorder/route.ts を作成

```typescript
// src/app/api/ranking-items/reorder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { subcategoryId, reorderedItems } = body;

    if (!subcategoryId || !Array.isArray(reorderedItems)) {
      return NextResponse.json(
        { error: "無効なリクエストデータです" },
        { status: 400 }
      );
    }

    const db = await createD1Database();

    // トランザクションで一括更新
    const updatePromises = reorderedItems.map((item) => {
      const query = `
        UPDATE ranking_items
        SET display_order = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND subcategory_id = ?
      `;
      return db.prepare(query).bind(item.displayOrder, item.id, subcategoryId).run();
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: "表示順序を更新しました",
      updatedCount: reorderedItems.length,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
```

### フェーズ2: フロントエンド実装

#### ステップ1: 編集用フックを作成

```typescript
// src/hooks/useRankingItemsEditor.ts
import { useState } from 'react';
import { RankingItem } from '@/lib/ranking/get-ranking-items';

export function useRankingItemsEditor(subcategoryId: string) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRankingItem = async (id: number, data: Partial<RankingItem>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ranking-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新に失敗しました');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createRankingItem = async (data: Omit<RankingItem, 'id'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ranking-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, subcategoryId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '作成に失敗しました');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : '作成に失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRankingItem = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ranking-items/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '削除に失敗しました');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reorderRankingItems = async (reorderedItems: Array<{ id: number; displayOrder: number }>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ranking-items/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subcategoryId, reorderedItems }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '並び替えに失敗しました');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : '並び替えに失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isEditMode,
    setIsEditMode,
    isLoading,
    error,
    updateRankingItem,
    createRankingItem,
    deleteRankingItem,
    reorderRankingItems,
  };
}
```

#### ステップ2: 編集フォームコンポーネントを作成

```tsx
// src/components/ranking/RankingClient/RankingItemForm.tsx
"use client";

import React, { useState } from "react";
import { RankingItem } from "@/lib/ranking/get-ranking-items";

interface RankingItemFormProps {
  item?: RankingItem; // undefined = 新規作成モード
  onSubmit: (data: Partial<RankingItem>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const RankingItemForm: React.FC<RankingItemFormProps> = ({
  item,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    rankingKey: item?.rankingKey || "",
    label: item?.label || "",
    statsDataId: item?.statsDataId || "",
    cdCat01: item?.cdCat01 || "",
    unit: item?.unit || "",
    name: item?.name || "",
    displayOrder: item?.displayOrder || 0,
    isActive: item?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.label) newErrors.label = "ラベルは必須です";
    if (!formData.statsDataId) newErrors.statsDataId = "統計データIDは必須です";
    if (!formData.cdCat01) newErrors.cdCat01 = "カテゴリコードは必須です";
    if (!formData.unit) newErrors.unit = "単位は必須です";
    if (!formData.name) newErrors.name = "名前は必須です";

    if (!item && !formData.rankingKey) {
      newErrors.rankingKey = "ランキングキーは必須です";
    }
    if (!item && formData.rankingKey && !/^[a-zA-Z0-9_-]+$/.test(formData.rankingKey)) {
      newErrors.rankingKey = "ランキングキーは英数字、ハイフン、アンダースコアのみ使用できます";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">
        {item ? "ランキング項目を編集" : "新しいランキング項目を追加"}
      </h3>

      {!item && (
        <div>
          <label className="block text-sm font-medium mb-1">
            ランキングキー <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.rankingKey}
            onChange={(e) => handleChange("rankingKey", e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="totalAreaExcluding"
          />
          {errors.rankingKey && (
            <p className="text-red-500 text-sm mt-1">{errors.rankingKey}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            英数字、ハイフン、アンダースコアのみ。一意である必要があります。
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          ラベル <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.label}
          onChange={(e) => handleChange("label", e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="総面積（除く）"
        />
        {errors.label && (
          <p className="text-red-500 text-sm mt-1">{errors.label}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          統計データID <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.statsDataId}
          onChange={(e) => handleChange("statsDataId", e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="0000010102"
        />
        {errors.statsDataId && (
          <p className="text-red-500 text-sm mt-1">{errors.statsDataId}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          カテゴリコード <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.cdCat01}
          onChange={(e) => handleChange("cdCat01", e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="B1101"
        />
        {errors.cdCat01 && (
          <p className="text-red-500 text-sm mt-1">{errors.cdCat01}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          単位 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.unit}
          onChange={(e) => handleChange("unit", e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="ha"
        />
        {errors.unit && (
          <p className="text-red-500 text-sm mt-1">{errors.unit}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          名前 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="総面積（北方地域及び竹島を除く）"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">表示順序</label>
        <input
          type="number"
          value={formData.displayOrder}
          onChange={(e) => handleChange("displayOrder", parseInt(e.target.value))}
          className="w-full px-3 py-2 border rounded-md"
          min="0"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => handleChange("isActive", e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="isActive" className="text-sm font-medium">
          有効
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
          disabled={isLoading}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? "処理中..." : item ? "保存" : "追加"}
        </button>
      </div>
    </form>
  );
};
```

#### ステップ3: モーダルコンポーネントを作成

```tsx
// src/components/common/Modal/Modal.tsx
"use client";

import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  size = "md",
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
```

#### ステップ4: RankingNavigationに編集機能を追加

```tsx
// src/components/ranking/RankingClient/RankingNavigationEditable.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RankingOption } from "./types";
import { RankingItem } from "@/lib/ranking/get-ranking-items";
import { useRankingItemsEditor } from "@/hooks/useRankingItemsEditor";
import { Modal } from "@/components/common/Modal/Modal";
import { RankingItemForm } from "./RankingItemForm";

export interface RankingNavigationEditableProps<T extends string> {
  categoryId: string;
  subcategoryId: string;
  activeRankingId: T;
  tabOptions: RankingOption<T>[];
  rankingItems: RankingItem[]; // 完全な項目情報
  title?: string;
  editable?: boolean; // 編集可能かどうか
  onUpdate?: () => void; // 更新後のコールバック
}

export const RankingNavigationEditable = React.memo(
  function RankingNavigationEditable<T extends string>({
    categoryId,
    subcategoryId,
    activeRankingId,
    tabOptions,
    rankingItems,
    title = "統計項目",
    editable = false,
    onUpdate,
  }: RankingNavigationEditableProps<T>) {
    const {
      isEditMode,
      setIsEditMode,
      isLoading,
      error,
      updateRankingItem,
      createRankingItem,
      deleteRankingItem,
    } = useRankingItemsEditor(subcategoryId);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RankingItem | undefined>();

    const handleEdit = (item: RankingItem) => {
      setEditingItem(item);
      setIsModalOpen(true);
    };

    const handleAdd = () => {
      setEditingItem(undefined);
      setIsModalOpen(true);
    };

    const handleFormSubmit = async (data: Partial<RankingItem>) => {
      try {
        if (editingItem) {
          await updateRankingItem(editingItem.id, data);
        } else {
          await createRankingItem(data as Omit<RankingItem, 'id'>);
        }
        setIsModalOpen(false);
        setEditingItem(undefined);
        onUpdate?.(); // 親コンポーネントに更新を通知
      } catch (error) {
        console.error("Submit error:", error);
      }
    };

    const handleDelete = async (item: RankingItem) => {
      if (!confirm(`「${item.label}」を削除しますか？`)) return;

      try {
        await deleteRankingItem(item.id);
        onUpdate?.();
      } catch (error) {
        console.error("Delete error:", error);
      }
    };

    return (
      <div className="lg:w-60 flex-shrink-0">
        <div className="lg:border-l border-gray-200 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-800 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
                {isEditMode && <span className="text-sm ml-2">(編集モード)</span>}
              </h3>
              {editable && (
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  {isEditMode ? "完了" : "編集"}
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <nav className="space-y-2" aria-label="統計項目">
              {isEditMode ? (
                // 編集モード
                <>
                  {rankingItems
                    .filter((item) => item.isActive)
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((item) => (
                      <div
                        key={item.rankingKey}
                        className="flex items-center gap-2 p-2 border rounded-md"
                      >
                        <div className="cursor-move">☰</div>
                        <div className="flex-1">{item.label}</div>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                          disabled={isLoading}
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-sm text-red-600 hover:text-red-700"
                          disabled={isLoading}
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  <button
                    onClick={handleAdd}
                    className="w-full p-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    + 新規追加
                  </button>
                </>
              ) : (
                // 通常モード
                <>
                  {tabOptions.map((option) => {
                    const href = `/${categoryId}/${subcategoryId}/ranking/${option.key}`;
                    const isActive = activeRankingId === option.key;

                    return (
                      <Link
                        key={option.key}
                        href={href}
                        className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                            : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {option.label}
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>
          </div>
        </div>

        {/* 編集/追加モーダル */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <RankingItemForm
            item={editingItem}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsModalOpen(false)}
            isLoading={isLoading}
          />
        </Modal>
      </div>
    );
  }
);
```

### フェーズ3: ドラッグ&ドロップ並び替え（オプション）

#### ステップ1: dnd-kitライブラリをインストール

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

#### ステップ2: ドラッグ可能なリストコンポーネントを作成

```tsx
// src/components/ranking/RankingClient/DraggableRankingList.tsx
"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RankingItem } from "@/lib/ranking/get-ranking-items";

interface DraggableItemProps {
  item: RankingItem;
  onEdit: (item: RankingItem) => void;
  onDelete: (item: RankingItem) => void;
  isLoading: boolean;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  item,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border rounded-md bg-white dark:bg-gray-700"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-move text-gray-400 hover:text-gray-600"
      >
        ☰
      </div>
      <div className="flex-1">{item.label}</div>
      <button
        onClick={() => onEdit(item)}
        className="text-sm text-blue-600 hover:text-blue-700"
        disabled={isLoading}
      >
        編集
      </button>
      <button
        onClick={() => onDelete(item)}
        className="text-sm text-red-600 hover:text-red-700"
        disabled={isLoading}
      >
        削除
      </button>
    </div>
  );
};

interface DraggableRankingListProps {
  items: RankingItem[];
  onReorder: (reorderedItems: RankingItem[]) => void;
  onEdit: (item: RankingItem) => void;
  onDelete: (item: RankingItem) => void;
  isLoading: boolean;
}

export const DraggableRankingList: React.FC<DraggableRankingListProps> = ({
  items,
  onReorder,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const reorderedItems = arrayMove(items, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          displayOrder: index + 1,
        })
      );

      onReorder(reorderedItems);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item) => (
            <DraggableItem
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              isLoading={isLoading}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
```

---

## セキュリティとバリデーション

### 1. 認証・認可
```typescript
// ミドルウェアで管理者権限をチェック
export async function authenticateAdmin(request: NextRequest) {
  // セッションやトークンから管理者権限を確認
  const session = await getSession(request);

  if (!session || !session.user?.isAdmin) {
    return NextResponse.json(
      { error: "管理者権限が必要です" },
      { status: 403 }
    );
  }

  return null; // 認証成功
}

// APIルートで使用
export async function POST(request: NextRequest) {
  const authError = await authenticateAdmin(request);
  if (authError) return authError;

  // 処理を続行
}
```

### 2. 入力バリデーション
- 必須フィールドのチェック
- データ型の検証
- 文字列長の制限
- 正規表現によるフォーマット検証
- SQLインジェクション対策（プリペアドステートメント使用）

### 3. CSRF対策
- Next.jsのAPI Routesは自動的にCSRF対策を提供
- 必要に応じてトークンベースの認証を実装

---

## テスト戦略

### 1. APIテスト
```typescript
// __tests__/api/ranking-items.test.ts
describe('Ranking Items API', () => {
  describe('POST /api/ranking-items', () => {
    it('新しいランキング項目を作成できる', async () => {
      const response = await fetch('/api/ranking-items', {
        method: 'POST',
        body: JSON.stringify({
          subcategoryId: 'land-area',
          rankingKey: 'testItem',
          label: 'テスト項目',
          // ...
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('重複するランキングキーでエラーになる', async () => {
      // ...
    });
  });

  describe('PUT /api/ranking-items/[id]', () => {
    it('ランキング項目を更新できる', async () => {
      // ...
    });
  });
});
```

### 2. コンポーネントテスト
```typescript
// __tests__/components/RankingItemForm.test.tsx
describe('RankingItemForm', () => {
  it('フォームが正しくレンダリングされる', () => {
    render(<RankingItemForm onSubmit={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByLabelText('ラベル')).toBeInTheDocument();
  });

  it('バリデーションエラーが表示される', async () => {
    // ...
  });

  it('フォーム送信が正しく動作する', async () => {
    // ...
  });
});
```

---

## デプロイとロールアウト

### フェーズ1: 開発環境
1. API実装とテスト
2. フロントエンド実装とテスト
3. 統合テスト

### フェーズ2: ステージング環境
1. 本番相当のデータでテスト
2. パフォーマンステスト
3. セキュリティ監査

### フェーズ3: 本番環境
1. 管理者のみアクセス可能な状態でリリース
2. モニタリングとログ確認
3. 段階的に権限を拡大

---

## パフォーマンス最適化

### 1. キャッシュ戦略
```typescript
// 読み取りAPIにキャッシュヘッダーを追加
return NextResponse.json(response, {
  headers: {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
  },
});

// 更新後にキャッシュを無効化
await revalidatePath(`/${categoryId}/${subcategoryId}/ranking`);
```

### 2. 楽観的UI更新
```typescript
// 楽観的にUIを更新し、バックグラウンドでAPIを呼ぶ
const optimisticUpdate = (newItem: RankingItem) => {
  setItems([...items, newItem]);

  createRankingItem(newItem).catch(() => {
    // エラー時は元に戻す
    setItems(items);
  });
};
```

### 3. デバウンス・スロットリング
```typescript
// 並び替え時にデバウンス
const debouncedReorder = useMemo(
  () => debounce(reorderRankingItems, 500),
  [reorderRankingItems]
);
```

---

## 追加機能の提案

### 1. インポート/エクスポート機能
- CSV/JSONでランキング項目を一括インポート
- 既存の設定をエクスポート

### 2. バージョン管理
- 変更履歴を記録
- ロールバック機能

### 3. プレビュー機能
- 変更前に結果をプレビュー
- A/Bテスト

### 4. 権限管理の強化
- ユーザーグループごとに編集権限を設定
- 変更承認ワークフロー

---

## まとめ

### 実装優先度

#### Phase 1: 必須機能（2-3週間）
1. ✅ API実装（POST, PUT, DELETE）
2. ✅ 基本的な編集UI（モーダル、フォーム）
3. ✅ バリデーション

#### Phase 2: 重要機能（1-2週間）
4. ✅ ドラッグ&ドロップ並び替え
5. ✅ 認証・認可
6. ✅ エラーハンドリング

#### Phase 3: 追加機能（オプション）
7. ⭕ インポート/エクスポート
8. ⭕ バージョン管理
9. ⭕ プレビュー機能

### 期待される効果
- ✅ 動的なランキング項目管理
- ✅ 管理者による柔軟な設定変更
- ✅ データベースとUIの完全な同期
- ✅ 保守性の向上
- ✅ ユーザーエクスペリエンスの向上

### リスクと対策
| リスク | 対策 |
|--------|------|
| データ整合性の問題 | トランザクション、バリデーション |
| 権限の誤用 | 認証・認可の厳格な実装 |
| パフォーマンス低下 | キャッシュ、楽観的UI更新 |
| 複雑性の増加 | 段階的な実装、テストの充実 |

---

## 参考資料

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [React Hook Form](https://react-hook-form.com/)
- [dnd-kit Documentation](https://docs.dndkit.com/)
- [Zod Validation](https://zod.dev/)

---
---
---

# 認証システム実装方針

## 概要

管理者権限を持つユーザーのみがランキング項目の編集機能にアクセスできるよう、ログイン機能と認証システムを実装します。

---

## 既存のデータベース構成

### usersテーブル（既存）

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**問題点**: 管理者権限を識別するカラムが存在しない

---

## データベーススキーマの更新

### 1. usersテーブルにroleカラムを追加

```sql
-- database/schemas/auth_migration.sql

-- roleカラムを追加
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';

-- 既存のusersにインデックスを追加
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- デフォルト管理者ユーザーを作成（開発用）
-- パスワード: admin123 (bcryptでハッシュ化)
INSERT OR IGNORE INTO users (username, email, password_hash, role, is_active)
VALUES (
  'admin',
  'admin@stats47.local',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- admin123
  'admin',
  1
);

-- 通常ユーザーサンプル（開発用）
INSERT OR IGNORE INTO users (username, email, password_hash, role, is_active)
VALUES (
  'user',
  'user@stats47.local',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- admin123
  'user',
  1
);
```

### 2. セッションテーブルを作成

```sql
-- セッション管理用テーブル
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY, -- セッションID（UUID）
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL, -- JWTトークン
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
```

---

## 認証フロー設計

### 1. ログインフロー

```
┌─────────┐
│ ユーザー │
└────┬────┘
     │
     │ 1. ユーザー名/パスワード送信
     ▼
┌──────────────────┐
│ POST /api/auth/  │
│      login       │
└────┬─────────────┘
     │
     │ 2. ユーザー検証
     ▼
┌──────────────────┐
│  D1 Database     │
│  (users table)   │
└────┬─────────────┘
     │
     │ 3. パスワード照合（bcrypt）
     ▼
┌──────────────────┐
│  認証成功？      │
└────┬─────────────┘
     │ Yes
     │ 4. JWTトークン生成
     ▼
┌──────────────────┐
│  httpOnly Cookie │
│  にトークン保存  │
└────┬─────────────┘
     │
     │ 5. セッション情報保存
     ▼
┌──────────────────┐
│  D1 Database     │
│(sessions table)  │
└────┬─────────────┘
     │
     │ 6. ユーザー情報返却
     ▼
┌─────────┐
│ ユーザー │
│ (ログイン成功)│
└─────────┘
```

### 2. 認証チェックフロー

```
┌─────────┐
│ ユーザー │
└────┬────┘
     │
     │ 1. 保護されたAPIにアクセス
     ▼
┌──────────────────┐
│  Middleware      │
│  (認証チェック)  │
└────┬─────────────┘
     │
     │ 2. Cookieからトークン取得
     ▼
┌──────────────────┐
│  JWTトークン検証 │
└────┬─────────────┘
     │
     │ 3. トークン有効？
     ▼
┌──────────────────┐
│  セッション確認  │
│  (D1 Database)   │
└────┬─────────────┘
     │
     │ 4. 管理者権限確認
     ▼
┌──────────────────┐
│  role === 'admin'│
│     ？           │
└────┬─────────────┘
     │ Yes
     │ 5. APIアクセス許可
     ▼
┌──────────────────┐
│  API処理実行     │
└──────────────────┘
```

---

## セッション管理（JWT）

### JWT構成

```typescript
// JWTペイロード
interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  sessionId: string;
  iat: number; // 発行時刻
  exp: number; // 有効期限
}
```

### トークン設定

```typescript
const TOKEN_CONFIG = {
  SECRET: process.env.JWT_SECRET!, // 環境変数から取得
  EXPIRES_IN: '7d', // 7日間有効
  COOKIE_NAME: 'auth_token',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7日間
    path: '/',
  },
};
```

---

## API実装

### 1. ログインAPI: POST /api/auth/login

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createD1Database } from '@/lib/d1-client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const TOKEN_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  EXPIRES_IN: '7d',
  COOKIE_NAME: 'auth_token',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // バリデーション
    if (!username || !password) {
      return NextResponse.json(
        { error: 'ユーザー名とパスワードは必須です' },
        { status: 400 }
      );
    }

    const db = await createD1Database();

    // ユーザー検索
    const user = await db
      .prepare('SELECT * FROM users WHERE username = ? AND is_active = 1')
      .bind(username)
      .first();

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // パスワード検証
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash as string
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // セッションID生成
    const sessionId = uuidv4();

    // JWTトークン生成
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        sessionId,
      },
      TOKEN_CONFIG.SECRET,
      { expiresIn: TOKEN_CONFIG.EXPIRES_IN }
    );

    // セッションをデータベースに保存
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7日後

    await db
      .prepare(
        'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
      )
      .bind(sessionId, user.id, token, expiresAt.toISOString())
      .run();

    // last_loginを更新
    await db
      .prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(user.id)
      .run();

    // レスポンスの作成
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
      },
    });

    // httpOnly Cookieにトークンを設定
    response.cookies.set(TOKEN_CONFIG.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7日間（秒）
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    );
  }
}
```

### 2. ログアウトAPI: POST /api/auth/logout

```typescript
// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createD1Database } from '@/lib/d1-client';
import { verifyToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (token) {
      // トークンを検証してセッションIDを取得
      const payload = await verifyToken(token);

      if (payload?.sessionId) {
        const db = await createD1Database();

        // セッションを削除
        await db
          .prepare('DELETE FROM sessions WHERE id = ?')
          .bind(payload.sessionId)
          .run();
      }
    }

    // Cookieを削除
    const response = NextResponse.json({
      success: true,
      message: 'ログアウトしました',
    });

    response.cookies.delete('auth_token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'ログアウトに失敗しました' },
      { status: 500 }
    );
  }
}
```

### 3. 現在のユーザー取得API: GET /api/auth/me

```typescript
// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { createD1Database } from '@/lib/d1-client';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      );
    }

    // トークン検証
    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'トークンが無効です' },
        { status: 401 }
      );
    }

    const db = await createD1Database();

    // セッションが有効か確認
    const session = await db
      .prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > CURRENT_TIMESTAMP')
      .bind(payload.sessionId)
      .first();

    if (!session) {
      return NextResponse.json(
        { error: 'セッションが無効です' },
        { status: 401 }
      );
    }

    // ユーザー情報を取得
    const user = await db
      .prepare('SELECT id, username, email, role, last_login FROM users WHERE id = ?')
      .bind(payload.userId)
      .first();

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        lastLogin: user.last_login,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
```

---

## JWT認証ユーティリティ

```typescript
// src/lib/auth/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  sessionId: string;
  iat?: number;
  exp?: number;
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}
```

---

## ミドルウェア実装

### 1. 認証ミドルウェア

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

// 保護されたルートのパスパターン
const PROTECTED_PATHS = [
  '/api/ranking-items',
  '/api/auth/me',
  '/admin',
];

// 管理者のみアクセス可能なパス
const ADMIN_ONLY_PATHS = [
  '/api/ranking-items',
  '/admin',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 保護されたパスかチェック
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (!isProtected) {
    return NextResponse.next();
  }

  // トークンを取得
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // ログインページにリダイレクト（APIの場合は401を返す）
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // トークン検証
  const payload = await verifyToken(token);

  if (!payload) {
    // トークンが無効
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'トークンが無効です' },
        { status: 401 }
      );
    }

    // Cookieを削除してログインページへ
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }

  // 管理者のみアクセス可能なパスの場合
  const isAdminOnly = ADMIN_ONLY_PATHS.some((path) => pathname.startsWith(path));

  if (isAdminOnly && payload.role !== 'admin') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // リクエストヘッダーにユーザー情報を追加
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId.toString());
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-username', payload.username);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/api/ranking-items/:path*',
    '/api/auth/me',
    '/admin/:path*',
  ],
};
```

### 2. API認証ヘルパー

```typescript
// src/lib/auth/api-auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './jwt';
import { createD1Database } from '@/lib/d1-client';

export async function requireAuth(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return {
      error: NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      ),
      user: null,
    };
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return {
      error: NextResponse.json(
        { error: 'トークンが無効です' },
        { status: 401 }
      ),
      user: null,
    };
  }

  return {
    error: null,
    user: payload,
  };
}

export async function requireAdmin(request: NextRequest) {
  const { error, user } = await requireAuth(request);

  if (error) {
    return { error, user: null };
  }

  if (user!.role !== 'admin') {
    return {
      error: NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      ),
      user: null,
    };
  }

  return { error: null, user };
}
```

### 3. API実装例（認証付き）

```typescript
// src/app/api/ranking-items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createD1Database } from '@/lib/d1-client';
import { requireAdmin } from '@/lib/auth/api-auth';

export async function POST(request: NextRequest) {
  // 管理者認証チェック
  const { error, user } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    // ... ランキング項目の作成処理

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
```

---

## フロントエンド実装

### 1. ログイン画面

```tsx
// src/app/login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ログインに失敗しました');
      }

      // ログイン成功 - トップページにリダイレクト
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
            ログイン
          </h2>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
            stats47 管理画面
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              ユーザー名
            </label>
            <input
              id="username"
              type="text"
              required
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="admin"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>開発用アカウント:</p>
          <p>ユーザー名: admin / パスワード: admin123</p>
        </div>
      </div>
    </div>
  );
}
```

### 2. 認証コンテキスト

```tsx
// src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'ログインに失敗しました');
    }

    const data = await response.json();
    setUser(data.user);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 3. RankingNavigationEditableの統合

```tsx
// src/components/ranking/RankingClient/RankingNavigationEditable.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { RankingOption } from './types';
import { RankingItem } from '@/lib/ranking/get-ranking-items';
import { useRankingItemsEditor } from '@/hooks/useRankingItemsEditor';
import { Modal } from '@/components/common/Modal/Modal';
import { RankingItemForm } from './RankingItemForm';

export interface RankingNavigationEditableProps<T extends string> {
  categoryId: string;
  subcategoryId: string;
  activeRankingId: T;
  tabOptions: RankingOption<T>[];
  rankingItems: RankingItem[];
  title?: string;
  onUpdate?: () => void;
}

export const RankingNavigationEditable = React.memo(
  function RankingNavigationEditable<T extends string>({
    categoryId,
    subcategoryId,
    activeRankingId,
    tabOptions,
    rankingItems,
    title = '統計項目',
    onUpdate,
  }: RankingNavigationEditableProps<T>) {
    const { isAdmin } = useAuth(); // 認証コンテキストから管理者権限を取得
    const {
      isEditMode,
      setIsEditMode,
      isLoading,
      error,
      updateRankingItem,
      createRankingItem,
      deleteRankingItem,
    } = useRankingItemsEditor(subcategoryId);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RankingItem | undefined>();

    // ... 以降のコードは同じ

    return (
      <div className="lg:w-60 flex-shrink-0">
        <div className="lg:border-l border-gray-200 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-800 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
                {isEditMode && <span className="text-sm ml-2">(編集モード)</span>}
              </h3>
              {isAdmin && ( {/* 管理者のみ表示 */}
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  {isEditMode ? '完了' : '編集'}
                </button>
              )}
            </div>

            {/* 以降のコードは同じ */}
          </div>
        </div>

        {/* モーダルは変更なし */}
      </div>
    );
  }
);
```

### 4. ヘッダーにログイン/ログアウトボタンを追加

```tsx
// src/components/layout/Header.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold">
            stats47
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.username}
                  {isAdmin && <span className="ml-2 text-indigo-600">(管理者)</span>}
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
              >
                ログイン
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
```

---

## 実装手順

### Phase 1: データベース準備（1日）

#### ステップ1: データベースマイグレーション

```bash
# マイグレーションファイルを作成
touch database/schemas/auth_migration.sql
```

```sql
-- database/schemas/auth_migration.sql

-- 1. roleカラムを追加
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';

-- 2. インデックスを追加
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. セッションテーブルを作成
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 4. デフォルト管理者ユーザーを作成
INSERT OR IGNORE INTO users (username, email, password_hash, role, is_active)
VALUES (
  'admin',
  'admin@stats47.local',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin',
  1
);
```

#### ステップ2: マイグレーション実行

```bash
# D1データベースにマイグレーションを実行
npx wrangler d1 execute stats47-db --file=database/schemas/auth_migration.sql --local
```

### Phase 2: バックエンド実装（2-3日）

#### ステップ1: 依存パッケージのインストール

```bash
npm install jsonwebtoken bcryptjs uuid
npm install --save-dev @types/jsonwebtoken @types/bcryptjs @types/uuid
```

#### ステップ2: 環境変数の設定

```.env
# .env.local
JWT_SECRET=your-super-secret-key-change-this-in-production-min-32-chars
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### ステップ3: 認証ユーティリティの実装

1. `src/lib/auth/jwt.ts` - JWT生成・検証
2. `src/lib/auth/api-auth.ts` - API認証ヘルパー

#### ステップ4: 認証API実装

1. `src/app/api/auth/login/route.ts` - ログインAPI
2. `src/app/api/auth/logout/route.ts` - ログアウトAPI
3. `src/app/api/auth/me/route.ts` - ユーザー情報取得API

#### ステップ5: ミドルウェア実装

1. `src/middleware.ts` - 認証チェックミドルウェア

#### ステップ6: 既存APIに認証を追加

各ランキング編集APIに `requireAdmin` を追加

### Phase 3: フロントエンド実装（2-3日）

#### ステップ1: 認証コンテキストの実装

1. `src/contexts/AuthContext.tsx` - 認証状態管理

#### ステップ2: ログイン画面の実装

1. `src/app/login/page.tsx` - ログインフォーム

#### ステップ3: ヘッダーコンポーネントの更新

1. `src/components/layout/Header.tsx` - ログイン/ログアウトボタン

#### ステップ4: RankingNavigationEditableの更新

1. 管理者のみ編集ボタンを表示

#### ステップ5: ルートレイアウトでAuthProviderを使用

```tsx
// src/app/layout.tsx
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Phase 4: テスト（1-2日）

#### テスト項目

1. **ログイン機能**
   - 正しい認証情報でログイン成功
   - 間違った認証情報でログイン失敗
   - トークンがCookieに正しく保存される

2. **ログアウト機能**
   - ログアウト後にトークンが削除される
   - セッションが削除される

3. **認証チェック**
   - 未認証でAPI保護されたルートにアクセスできない
   - 認証済みでアクセスできる

4. **権限チェック**
   - 管理者のみ編集機能が表示される
   - 一般ユーザーには編集機能が表示されない
   - 一般ユーザーが編集APIを呼ぶと403エラー

---

## セキュリティ考慮事項

### 1. パスワードのハッシュ化
- bcryptでハッシュ化（saltラウンド: 10）
- 平文パスワードは保存しない

### 2. JWTトークンの保護
- httpOnly Cookieで保存
- secure フラグ（本番環境のみ）
- sameSite: 'lax' でCSRF対策

### 3. トークンの有効期限
- デフォルト: 7日間
- セッションテーブルで管理

### 4. HTTPS必須
- 本番環境では必ずHTTPSを使用
- secure Cookieを有効化

### 5. レート制限
- ログインAPIにレート制限を実装（推奨）

---

## 環境変数

```.env
# JWT Secret（最低32文字）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-must-be-at-least-32-characters

# ベースURL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# D1データベース
# wranglerで管理
```

---

## 実装優先度まとめ

### Phase 1: 必須機能（1週間）
1. ✅ データベースマイグレーション（roleカラム追加、sessionsテーブル作成）
2. ✅ ログインAPI実装
3. ✅ 認証ミドルウェア実装
4. ✅ ログイン画面実装
5. ✅ AuthContextと管理者権限チェック

### Phase 2: 重要機能（3-4日）
6. ✅ ログアウト機能
7. ✅ ユーザー情報取得API
8. ✅ 既存APIへの認証追加
9. ✅ ヘッダーコンポーネント更新

### Phase 3: 追加機能（オプション）
10. ⭕ パスワードリセット機能
11. ⭕ ユーザー管理画面
12. ⭕ 2要素認証（2FA）
13. ⭕ セッション管理（複数デバイス）

---

## まとめ

### 期待される効果
- ✅ 管理者のみがランキング項目を編集可能
- ✅ セキュアな認証システム
- ✅ セッション管理による安全なログイン状態維持
- ✅ 不正アクセスの防止

### 実装後の動作フロー

1. ユーザーがログインページでユーザー名/パスワードを入力
2. 認証成功後、JWTトークンがhttpOnly Cookieに保存
3. トップページにリダイレクト
4. 管理者ユーザーのみ「編集」ボタンが表示される
5. 編集機能使用時、ミドルウェアで管理者権限をチェック
6. 権限がない場合は403エラー

### 参考資料

- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [JWT Documentation](https://jwt.io/)
- [bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
