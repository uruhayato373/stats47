# Server Actions 実装ガイド

## 概要

Next.js 15 の Server Actions を活用したサーバーコンポーネント化の実装ガイドです。管理画面のリファクタリングを通じて、パフォーマンスとセキュリティを向上させる手法を説明します。

## Server Actions とは

Server Actions は、サーバーサイドで実行される関数で、クライアントから直接呼び出すことができます。API エンドポイントを作成することなく、サーバーサイドのロジックを実行できます。

### 特徴

- ✅ **型安全** - TypeScript で完全に型付け
- ✅ **自動 CSRF 保護** - セキュリティが自動で適用
- ✅ **プログレッシブエンハンス** - JavaScript 無効でも動作
- ✅ **キャッシュ制御** - `revalidatePath`でキャッシュ管理
- ✅ **エラーハンドリング** - サーバーサイドでエラー処理

## 実装パターン

### 1. 基本的な Server Action

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infrastructure/auth/auth";

export async function updateUserAction(userId: string, formData: FormData) {
  // 認証チェック
  const session = await auth();
  if (!session?.user) {
    throw new Error("認証が必要です");
  }

  try {
    // データベース更新
    const db = await getDataProvider();
    await db
      .prepare("UPDATE users SET name = ? WHERE id = ?")
      .bind(formData.get("name"), userId)
      .run();

    // キャッシュ無効化
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("更新エラー:", error);
    return {
      success: false,
      error: "更新に失敗しました",
    };
  }
}
```

### 2. クライアントコンポーネントでの使用

```typescript
"use client";

import { useTransition } from "react";
import { updateUserAction } from "./actions";

export function UserForm({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateUserAction(userId, formData);

      if (result.success) {
        // 成功時の処理
        console.log("更新完了");
      } else {
        // エラー時の処理
        console.error(result.error);
      }
    });
  };

  return (
    <form action={handleSubmit}>
      <input name="name" placeholder="ユーザー名" />
      <button type="submit" disabled={isPending}>
        {isPending ? "更新中..." : "更新"}
      </button>
    </form>
  );
}
```

### 3. サーバーコンポーネントでの使用

```typescript
import { updateUserAction } from "./actions";

export function UserEditForm({ userId }: { userId: string }) {
  return (
    <form action={updateUserAction.bind(null, userId)}>
      <input name="name" placeholder="ユーザー名" />
      <button type="submit">更新</button>
    </form>
  );
}
```

## ベストプラクティス

### 1. 認証チェック

すべての Server Action で認証チェックを実装：

```typescript
"use server";

export async function protectedAction() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("認証が必要です");
  }

  if (session.user.role !== "admin") {
    throw new Error("管理者権限が必要です");
  }

  // 実際の処理
}
```

### 2. エラーハンドリング

適切なエラーハンドリングを実装：

```typescript
"use server";

export async function safeAction() {
  try {
    // 処理
    return { success: true, data: result };
  } catch (error) {
    console.error("Server Action エラー:", error);

    // ユーザーに分かりやすいエラーメッセージ
    return {
      success: false,
      error: "処理に失敗しました。しばらくしてから再試行してください。",
    };
  }
}
```

### 3. キャッシュ管理

適切なキャッシュ無効化を実装：

```typescript
"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function updateDataAction() {
  // データ更新
  await updateDatabase();

  // 特定のパスのキャッシュを無効化
  revalidatePath("/admin");

  // 特定のタグのキャッシュを無効化
  revalidateTag("users");
}
```

### 4. 型安全性

TypeScript の型を活用：

```typescript
"use server";

interface ActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export async function typedAction(input: {
  id: string;
  name: string;
}): Promise<ActionResult> {
  try {
    // 処理
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "不明なエラー",
    };
  }
}
```

## パフォーマンス最適化

### 1. useTransition の活用

クライアントサイドで楽観的更新を実装：

```typescript
"use client";

import { useTransition } from "react";

export function OptimisticButton() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      // Server Action実行
      await updateDataAction();
    });
  };

  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? "処理中..." : "更新"}
    </button>
  );
}
```

### 2. 並列処理

複数の Server Action を並列実行：

```typescript
"use client";

export function ParallelActions() {
  const handleMultipleUpdates = async () => {
    // 並列実行
    const [result1, result2, result3] = await Promise.all([
      updateUserAction(userId1, data1),
      updateUserAction(userId2, data2),
      updateUserAction(userId3, data3),
    ]);

    // 結果処理
    console.log({ result1, result2, result3 });
  };

  return <button onClick={handleMultipleUpdates}>一括更新</button>;
}
```

## セキュリティ考慮事項

### 1. 入力検証

```typescript
"use server";

import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export async function createUserAction(input: unknown) {
  // 入力検証
  const validatedInput = userSchema.parse(input);

  // 処理続行
}
```

### 2. レート制限

```typescript
"use server";

const rateLimit = new Map();

export async function rateLimitedAction() {
  const clientId = getClientId(); // IPアドレスなど
  const now = Date.now();
  const windowMs = 60 * 1000; // 1分
  const maxRequests = 10;

  const requests = rateLimit.get(clientId) || [];
  const recentRequests = requests.filter(
    (time: number) => now - time < windowMs
  );

  if (recentRequests.length >= maxRequests) {
    throw new Error("レート制限に達しました");
  }

  recentRequests.push(now);
  rateLimit.set(clientId, recentRequests);

  // 実際の処理
}
```

## デバッグとテスト

### 1. ログ出力

```typescript
"use server";

export async function debugAction(input: any) {
  console.log("Server Action 開始:", input);

  try {
    const result = await processData(input);
    console.log("Server Action 成功:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error("Server Action エラー:", error);
    return { success: false, error: error.message };
  }
}
```

### 2. テスト

```typescript
// __tests__/actions.test.ts
import { createUserAction } from "../actions";

describe("createUserAction", () => {
  it("ユーザーを作成できる", async () => {
    const result = await createUserAction({
      name: "テストユーザー",
      email: "test@example.com",
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("無効な入力でエラーを返す", async () => {
    const result = await createUserAction({
      name: "",
      email: "invalid-email",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

## 実装例：管理画面

### 完全な実装例

```typescript
// src/features/auth/actions/index.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../lib/auth";
import { getDataProvider } from "@/infrastructure/database";

export async function toggleUserStatusAction(
  userId: string,
  currentStatus: boolean
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    throw new Error("権限がありません");
  }

  try {
    const db = await getDataProvider();
    await db
      .prepare("UPDATE users SET is_active = ? WHERE id = ?")
      .bind(!currentStatus, userId)
      .run();

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("ユーザー状態更新エラー:", error);
    return {
      success: false,
      error: "ユーザー状態の更新に失敗しました",
    };
  }
}
```

```typescript
// src/features/auth/components/UserToggleButton.tsx
"use client";

import { useTransition } from "react";
import { toggleUserStatusAction } from "../actions";

export function UserToggleButton({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleUserStatusAction(userId, isActive);

      if (!result.success) {
        console.error("エラー:", result.error);
      }
    });
  };

  return (
    <button onClick={handleToggle} disabled={isPending}>
      {isPending ? "処理中..." : isActive ? "無効化" : "有効化"}
    </button>
  );
}
```

## まとめ

Server Actions を活用することで：

- **パフォーマンス向上** - サーバーサイドレンダリング
- **セキュリティ向上** - サーバーサイド認証・検証
- **開発効率向上** - API エンドポイント不要
- **型安全性** - TypeScript 完全対応
- **ユーザー体験向上** - 楽観的更新

適切な実装により、モダンな Web アプリケーションの要件を満たすことができます。
