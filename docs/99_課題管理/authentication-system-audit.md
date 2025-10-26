---
title: Stats47 認証システム監査レポート
created: 2025-10-12
updated: 2025-10-16
tags:
  - domain/auth
  - refactoring
---

# Stats47 認証システム監査レポート

**調査日:** 2025-10-12
**対象:** 全認証関連システム
**目的:** 現状分析と改善提案

---

## エグゼクティブサマリー

### 重大な問題

1. **二重の認証システムが存在** - NextAuthと独自JWT実装が共存し、競合している
2. **データベーススキーマの不一致** - `sessions`テーブルのカラム名が異なる（`expires_at` vs `expires`）
3. **未使用のAPIエンドポイント** - `/api/auth/me`、`/api/auth/logout`がNextAuthと重複
4. **セッション管理の不在** - データベースにセッションが0件、認証が機能していない
5. **セキュリティリスク** - JWT_SECRETがハードコードされたデフォルト値を使用

### 推奨アクション

**優先度：高** - NextAuthに統一し、独自JWT実装を削除
**優先度：高** - データベーススキーマを修正
**優先度：中** - AuthContextをNextAuthのuseSessionに置き換え
**優先度：低** - セキュリティ設定の強化

---

## 現状分析

### 1. 認証アーキテクチャの概要

#### 使用されている認証方式

プロジェクトには**2つの認証システム**が並存しています：

**システムA: NextAuth (next-auth v5 beta)**
- ライブラリ: `next-auth@5.0.0-beta.29`
- 設定: `src/infrastructure/auth/auth.ts`
- ログイン: `LoginForm.tsx` → `signIn("credentials")`
- ミドルウェア: `src/middleware.ts` → `auth()`関数
- セッション管理: JWTベース（`strategy: "jwt"`）

**システムB: 独自JWT実装**
- ライブラリ: `jose`
- 実装: `src/infrastructure/auth/jwt.ts`
- コンテキスト: `src/contexts/AuthContext.tsx`
- APIエンドポイント: `/api/auth/me`, `/api/auth/logout`
- セッション管理: カスタムテーブル（独自実装）

#### 問題点

これらの2つのシステムは**互いに独立して動作**しており、以下の問題を引き起こしています：

1. **ログインフローの不一致**
   - ユーザーは`LoginForm`でNextAuthの`signIn()`を使用してログイン
   - しかし、`AuthContext`は`/api/auth/me`を呼び出して独自のJWTトークンを期待
   - NextAuthのセッションと独自のJWTセッションが同期されていない

2. **セッション情報の二重管理**
   - NextAuthはJWT内にセッション情報を保存
   - 独自実装はデータベースの`sessions`テーブルを使用
   - 両者が同期していないため、認証状態が不整合

3. **APIエンドポイントの重複**
   - NextAuth: `/api/auth/[...nextauth]` (GET/POSTハンドラー)
   - 独自実装: `/api/auth/me` (GET), `/api/auth/logout` (POST)

---

### 2. ファイル構成と依存関係

#### 認証関連ファイル

```
src/
├── lib/auth/
│   ├── auth.ts              ← NextAuth設定（正）
│   ├── jwt.ts               ← 独自JWT実装（削除推奨）
│   └── api-auth.ts          ← 独自認証ヘルパー（削除推奨）
├── contexts/
│   └── AuthContext.tsx      ← 独自コンテキスト（置き換え推奨）
├── app/
│   ├── api/auth/
│   │   ├── [...nextauth]/route.ts    ← NextAuth (正)
│   │   ├── me/route.ts                ← 独自API (削除推奨)
│   │   ├── logout/route.ts            ← 独自API (削除推奨)
│   │   └── register/route.ts          ← ユーザー登録API (保持)
│   ├── login/page.tsx                 ← ログインページ (正)
│   └── layout.tsx                     ← AuthProvider使用 (修正必要)
├── components/auth/
│   ├── LoginForm.tsx        ← NextAuth使用 (正)
│   └── RegisterForm.tsx     ← ユーザー登録フォーム (正)
└── middleware.ts            ← NextAuth使用 (正)
```

#### 依存関係の問題

```
LoginForm (next-auth/signIn)
    ↓
NextAuth [...nextauth]/route
    ↓
Database (sessions table - Auth.js schema)

↕️  [不整合]

AuthContext (/api/auth/me)
    ↓
Custom JWT (jose)
    ↓
Database (sessions table - カスタムスキーマ)
```

---

### 3. データベーススキーマの問題

#### 3-1. sessionsテーブルの不一致

**現在のスキーマ** (`database/migrations/001_auth_js_integration.sql:43-50`)
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  sessionToken TEXT UNIQUE NOT NULL,  ← Auth.js用
  userId TEXT NOT NULL,
  expires DATETIME NOT NULL,          ← カラム名: expires
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

**独自実装が期待するスキーマ** (`src/app/api/auth/me/route.ts:30-35`)
```typescript
const session = await db
  .prepare(
    "SELECT * FROM sessions WHERE id = ? AND expires_at > CURRENT_TIMESTAMP"
    //                                          ^^^^^^^^^ 存在しないカラム！
  )
  .bind(payload.sessionId)
  .first();
```

**問題:**
- Auth.jsのスキーマは`expires`カラムを使用
- 独自実装は`expires_at`カラムを参照
- **カラムが存在しないため、クエリが失敗する**

#### 3-2. セッションの実際の状態

```bash
npx wrangler d1 execute stats47 --local --command "SELECT COUNT(*) FROM sessions;"
# 結果: 0件
```

**原因:**
- NextAuthのログインは成功しているが、セッションがデータベースに保存されていない
- NextAuthはJWT戦略を使用しているため、データベースにセッションを保存しない
- 独自実装はデータベースセッションを期待しているが、セッションが存在しない

#### 3-3. usersテーブルのフィールド不一致

**Auth.jsのauthorize関数が期待** (`src/infrastructure/auth/auth.ts:37`)
```typescript
const isValidPassword = await bcrypt.compare(
  credentials.password as string,
  user.password_hash as string  ← フィールド名: password_hash
);
```

**AuthContextの/api/auth/meが返す** (`src/app/api/auth/me/route.ts:59-67`)
```typescript
return NextResponse.json({
  success: true,
  user: {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role || "user",
    lastLogin: user.last_login,  ← last_login (スネークケース)
  },
});
```

**問題:**
- データベースのカラム名は`password_hash`、`last_login`（スネークケース）
- TypeScript型定義が統一されていない

---

### 4. セキュリティ分析

#### 4-1. JWT_SECRETのハードコード

**問題のコード** (`src/infrastructure/auth/jwt.ts:34-38`)
```typescript
function getJwtSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    "your-super-secret-jwt-key-minimum-32-characters-long";  ← デフォルト値
  return new TextEncoder().encode(secret);
}
```

**リスク:**
- デフォルト値がソースコードに含まれている
- `JWT_SECRET`が環境変数で設定されていない場合、予測可能な値を使用
- **本番環境で深刻なセキュリティリスク**

**現在の.env.local設定:**
```bash
JWT_SECRET=your-secret-key-change-this-in-production-min-32-chars
```
→ デフォルト値のまま、変更されていない

#### 4-2. NEXTAUTH_SECRETの設定

```bash
NEXTAUTH_SECRET=NHfEH8z2VSzjN3D1zpyCU8DipZPVsbcbG6KERHrUoaA=
```
→ こちらは適切にランダム生成されている

#### 4-3. パスワードハッシュ化

**良い実装** (`src/app/api/auth/register/route.ts:44-45`)
```typescript
const saltRounds = 10;
const password_hash = await bcrypt.hash(password, saltRounds);
```

- bcryptjsを使用
- saltRounds = 10（適切）
- パスワードは安全にハッシュ化されている

#### 4-4. セッション有効期限

**NextAuth設定** (`src/infrastructure/auth/auth.ts:98-101`)
```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30日間
},
```

**独自JWT実装** (`src/infrastructure/auth/jwt.ts:63-64`)
```typescript
// 7日間の有効期限
const expirationTime = "7d";
```

**問題:**
- 2つの異なる有効期限設定が存在（30日 vs 7日）
- 統一されていない

---

### 5. AuthContextの問題

#### 5-1. 実装の分析

**ファイル:** `src/contexts/AuthContext.tsx`

```typescript
const fetchUser = async () => {
  try {
    const response = await fetch("/api/auth/me");  // ← 独自API呼び出し

    if (response.ok) {
      const data = (await response.json()) as { user: User };
      setUser(data.user);
    } else {
      setUser(null);
    }
  } catch (error) {
    console.error("Failed to fetch user:", error);
    setUser(null);
  } finally {
    setIsLoading(false);
  }
};
```

**問題点:**

1. **NextAuthのセッションを使用していない**
   - NextAuthには`useSession()`フックがあるが、使用されていない
   - 独自の`/api/auth/me`を呼び出している
   - NextAuthでログインしても、AuthContextは認識しない

2. **ログイン関数が未使用**
   ```typescript
   const login = async (username: string, password: string) => {
     const response = await fetch("/api/auth/login", {  // ← 存在しないAPI
       method: "POST",
       // ...
     });
   };
   ```
   - `/api/auth/login`エンドポイントは存在しない
   - `LoginForm`は`signIn("credentials")`を使用している
   - この関数は**呼ばれることがない**

3. **ログアウト関数の不一致**
   ```typescript
   const logout = async () => {
     await fetch("/api/auth/logout", { method: "POST" });  // ← 独自API
     setUser(null);
     router.push("/login");
     router.refresh();
   };
   ```
   - NextAuthの`signOut()`を使用すべき
   - 独自の`/api/auth/logout`を呼び出している

#### 5-2. RankingClientでの使用

**修正前** (`editable-navigation-not-showing-issue.md`参照)
```typescript
let isAdmin = false;
try {
  const auth = useAuth();
  isAdmin = auth.isAdmin;
} catch (error) {
  console.warn("AuthProvider not available, using default isAdmin=false");
}
```

**修正後** （ユーザーが既に修正済み）
```typescript
const auth = useAuth();
const isAdmin = auth.isAdmin;

if (auth.isLoading) {
  return <LoadingIndicator />;
}
```

**残る問題:**
- `useAuth()`は`/api/auth/me`を呼び出すが、このAPIは動作していない
- NextAuthでログインしても、`AuthContext`は認証状態を認識できない
- **結果として、管理者でも`isAdmin = false`になる**

---

### 6. ミドルウェアとアクセス制御

#### 6-1. middleware.tsの実装

**ファイル:** `src/middleware.ts`

```typescript
import { auth } from "@/infrastructure/auth/auth";  // NextAuthのauth関数
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 認証が必要なパス
  const protectedPaths = ["/profile", "/admin"];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // 管理者専用パス
  const adminPaths = ["/admin"];
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

  // 未認証ユーザーを保護されたパスから除外
  if (isProtectedPath && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 非管理者を管理者専用パスから除外
  if (isAdminPath && req.auth?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});
```

**評価:**
- ✅ NextAuthの`auth()`を正しく使用
- ✅ 保護されたパスとロールベースのアクセス制御
- ✅ 未認証ユーザーのリダイレクト

**問題:**
- ランキングページ（`/[category]/[subcategory]/ranking`）は保護されていない
- 誰でもアクセス可能だが、編集機能は管理者のみ
- ミドルウェアとクライアントコンポーネントで一貫性がある

---

### 7. 他のAPIエンドポイントでの認証使用

#### 7-1. NextAuthを使用しているAPI

```typescript
// src/app/api/admin/users/route.ts
const session = await auth();  // ✅ 正しい

// src/app/api/admin/users/[id]/route.ts
const session = await auth();  // ✅ 正しい

// src/app/api/profile/route.ts
const session = await auth();  // ✅ 正しい
```

#### 7-2. 独自実装を使用しているAPI

```typescript
// src/infrastructure/auth/api-auth.ts
export async function requireAuth(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;  // ❌ カスタムトークン
  // ...
}
```

**問題:**
- `api-auth.ts`のヘルパー関数は独自のJWTトークンを使用
- NextAuthとは異なるCookieキー（`auth_token` vs `authjs.session-token`）
- **このヘルパーは使用されていない可能性が高い**

---

## 問題のまとめ

### 重大度：高

1. **二重の認証システム**
   - NextAuthと独自JWT実装が競合
   - ログインフローと認証状態の確認が分離
   - AuthContextが機能していない

2. **データベーススキーマの不一致**
   - `sessions.expires_at`カラムが存在しない（`expires`が正しい）
   - `/api/auth/me`のクエリが失敗する

3. **セッション管理の不在**
   - データベースにセッションが0件
   - NextAuthはJWT戦略を使用（DB保存なし）
   - 独自実装はDB保存を期待（ミスマッチ）

### 重大度：中

4. **未使用・重複のコード**
   - `/api/auth/me`, `/api/auth/logout`が未使用
   - `jwt.ts`, `api-auth.ts`が未使用
   - `AuthContext.login()`関数が未使用

5. **セキュリティリスク**
   - JWT_SECRETがデフォルト値
   - ハードコードされたシークレット

### 重大度：低

6. **コードの一貫性**
   - データベースカラム名の命名規則（スネークケース vs キャメルケース）
   - セッション有効期限の不一致（30日 vs 7日）

---

## 改善提案

### フェーズ1: 認証システムの統一（優先度：高）

#### ステップ1-1: AuthContextをNextAuthに置き換える

**目的:** `AuthContext`を削除し、NextAuthの`useSession()`を使用する

**作業内容:**

1. **SessionProviderの確認**

`src/app/layout.tsx`を確認：
```typescript
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/contexts/AuthContext";  // ← 削除予定

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <JotaiProvider>
          <SessionProvider>  {/* ← これを保持 */}
            <AuthProvider>   {/* ← これを削除 */}
              <ThemeInitializer />
              <Header />
              {children}
            </AuthProvider>
          </SessionProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
```

**修正後:**
```typescript
import { SessionProvider } from "next-auth/react";
// AuthProviderのimportを削除

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <JotaiProvider>
          <SessionProvider>
            <ThemeInitializer />
            <Header />
            {children}
          </SessionProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
```

2. **RankingClientの修正**

`src/components/ranking/RankingClient/RankingClient.tsx`

**修正前:**
```typescript
import { useAuth } from "@/contexts/AuthContext";

export function RankingClient<T extends string>({ ... }) {
  const auth = useAuth();
  const isAdmin = auth.isAdmin;

  if (auth.isLoading) {
    return <LoadingIndicator />;
  }
  // ...
}
```

**修正後:**
```typescript
import { useSession } from "next-auth/react";

export function RankingClient<T extends string>({ ... }) {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const isAdmin = session?.user?.role === "admin";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">認証情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  // デバッグログ（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 RankingClient Auth:', {
      isAdmin,
      role: session?.user?.role,
      isAuthenticated,
      username: session?.user?.username,
    });
  }

  // ... 残りのコード
}
```

3. **他のコンポーネントの修正**

すべての`useAuth()`の使用箇所を`useSession()`に置き換え：

```bash
# 使用箇所を検索
grep -r "useAuth()" src/components --include="*.tsx" --include="*.ts"
```

各ファイルを以下のように修正：

```typescript
// 修正前
import { useAuth } from "@/contexts/AuthContext";
const { user, isAuthenticated, isAdmin } = useAuth();

// 修正後
import { useSession } from "next-auth/react";
const { data: session, status } = useSession();
const user = session?.user;
const isAuthenticated = status === "authenticated";
const isAdmin = session?.user?.role === "admin";
```

4. **AuthContext.tsxの削除**

```bash
# ファイルを削除
rm src/contexts/AuthContext.tsx

# git statusで確認
git status
```

#### ステップ1-2: 独自JWTの削除

1. **未使用ファイルの削除**

```bash
# 削除するファイル
rm src/infrastructure/auth/jwt.ts
rm src/infrastructure/auth/api-auth.ts
rm src/app/api/auth/me/route.ts
rm src/app/api/auth/logout/route.ts
```

2. **依存関係の確認**

```bash
# joseライブラリが他で使用されているか確認
grep -r "jose" src/ --include="*.ts" --include="*.tsx"

# 使用されていなければpackage.jsonから削除
npm uninstall jose
```

3. **git commit**

```bash
git add .
git commit -m "Remove custom JWT implementation and AuthContext

- Remove src/infrastructure/auth/jwt.ts
- Remove src/infrastructure/auth/api-auth.ts
- Remove src/contexts/AuthContext.tsx
- Remove /api/auth/me and /api/auth/logout endpoints
- Replace useAuth() with useSession() in all components
"
```

---

### フェーズ2: データベーススキーマの修正（優先度：高）

#### ステップ2-1: NextAuthのデータベースアダプター設定

**問題:** NextAuthはJWT戦略を使用しているため、セッションがDBに保存されない

**解決策:** `database`戦略に切り替えるか、JWT戦略を維持

**オプションA: JWT戦略を維持（推奨）**

JWT戦略の場合、データベースにセッションを保存する必要はありません。現在の設定を維持します。

**メリット:**
- データベースへの書き込みが不要（パフォーマンス向上）
- スケーラビリティが高い
- 設定がシンプル

**デメリット:**
- セッションの即時無効化が難しい
- ユーザー情報の更新がトークンに反映されるまでラグがある

**実装:** 変更なし（現在の設定を維持）

**オプションB: database戦略に切り替え**

セッションをデータベースで管理したい場合、Auth.jsのアダプターを設定します。

**メリット:**
- セッションの即時無効化が可能
- ユーザー情報の更新が即座に反映
- 監査ログが簡単

**デメリット:**
- データベース書き込みのオーバーヘッド
- 設定が複雑

**実装:**

`src/infrastructure/auth/auth.ts`を修正：

```typescript
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createD1Database } from "@/infrastructure/d1-client";

// カスタムアダプターの実装（D1用）
// 注意: Auth.jsの公式D1アダプターはまだ存在しないため、カスタム実装が必要
// 参考: https://authjs.dev/guides/creating-a-database-adapter

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      // ... 既存の設定
    }),
  ],

  callbacks: {
    async session({ session, user }) {
      // データベースからユーザー情報を取得
      const db = await createD1Database();
      const dbUser = await db
        .prepare("SELECT * FROM users WHERE id = ?")
        .bind(user.id)
        .first();

      if (dbUser) {
        session.user.id = dbUser.id as string;
        session.user.username = dbUser.username as string;
        session.user.role = dbUser.role as "admin" | "user";
      }

      return session;
    },
    // jwt callbackは削除（database戦略では不要）
  },

  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/login",
  },

  session: {
    strategy: "database",  // ← JWT → database に変更
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // アダプターの設定（カスタム実装が必要）
  // adapter: customD1Adapter(db),

  debug: process.env.NODE_ENV === "development",
};
```

**注意:** Auth.js公式のD1アダプターは存在しないため、カスタム実装が必要です。JWT戦略の維持を推奨します。

#### ステップ2-2: sessionsテーブルのクリーンアップ（JWT戦略の場合）

JWT戦略を使用する場合、`sessions`テーブルは不要です。

**オプション1: テーブルを保持（他の用途で使用する可能性）**

そのまま保持します。

**オプション2: テーブルを削除（推奨）**

```sql
-- マイグレーション: 002_cleanup_sessions.sql
DROP TABLE IF EXISTS sessions;
DROP INDEX IF EXISTS idx_sessions_userId;
DROP INDEX IF EXISTS idx_sessions_sessionToken;
```

実行:
```bash
npx wrangler d1 execute stats47 --local --file=database/migrations/002_cleanup_sessions.sql
```

---

### フェーズ3: セキュリティの強化（優先度：中）

#### ステップ3-1: JWT_SECRETの削除

JWT戦略を維持する場合、`JWT_SECRET`環境変数は不要です（NextAuthは`NEXTAUTH_SECRET`を使用）。

1. **.env.localから削除**

```bash
# .env.local
# JWT_SECRET=... ← この行を削除
```

2. **ソースコードから削除**

```bash
# jwt.tsを削除済みの場合、このステップは不要
```

#### ステップ3-2: NEXTAUTH_SECRETの確認

**開発環境:**
```bash
# .env.local
NEXTAUTH_SECRET=NHfEH8z2VSzjN3D1zpyCU8DipZPVsbcbG6KERHrUoaA=
```

**本番環境:**

Cloudflare Workersの環境変数に設定：

```bash
# 新しいシークレットを生成
openssl rand -base64 32

# Cloudflareに設定
npx wrangler secret put NEXTAUTH_SECRET
# プロンプトで生成したシークレットを入力
```

#### ステップ3-3: セッションのセキュリティ設定

`src/infrastructure/auth/auth.ts`にセキュリティ設定を追加：

```typescript
export const authConfig: NextAuthConfig = {
  // ... 既存の設定

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // 24時間ごとにトークンを更新
  },

  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // ... 残りの設定
};
```

---

### フェーズ4: コードの整理とリファクタリング（優先度：低）

#### ステップ4-1: データベースカラム名の統一

**問題:** スネークケース（`password_hash`）とキャメルケース（`passwordHash`）が混在

**推奨:** データベースはスネークケース、TypeScriptはキャメルケースで統一

**実装:**

1. **型定義の作成**

`src/types/database.ts`を作成：

```typescript
// データベースの生のレコード（スネークケース）
export interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  emailVerified: string | null;
  image: string | null;
  username: string | null;
  password_hash: string | null;
  role: string;
  is_active: number;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

// アプリケーション内で使用する型（キャメルケース）
export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  username: string | null;
  passwordHash: string | null;
  role: "admin" | "user";
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

2. **変換関数の作成**

```typescript
export function mapUserRecordToUser(record: UserRecord): User {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    emailVerified: record.emailVerified ? new Date(record.emailVerified) : null,
    image: record.image,
    username: record.username,
    passwordHash: record.password_hash,
    role: record.role as "admin" | "user",
    isActive: Boolean(record.is_active),
    lastLogin: record.last_login ? new Date(record.last_login) : null,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };
}
```

3. **使用例**

```typescript
const db = await createD1Database();
const record = await db
  .prepare("SELECT * FROM users WHERE email = ?")
  .bind(email)
  .first() as UserRecord;

const user = mapUserRecordToUser(record);
// user.passwordHash ← キャメルケース
```

#### ステップ4-2: 型定義の統一

**NextAuth型定義の拡張**

`src/types/next-auth.d.ts`を作成：

```typescript
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: "admin" | "user";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username: string;
    role: "admin" | "user";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    username: string;
    role: "admin" | "user";
  }
}
```

---

## 実装ロードマップ

### 第1週: 認証システムの統一

**目標:** NextAuthへの完全移行

- [ ] Day 1-2: AuthContextを`useSession()`に置き換え
  - RankingClient修正
  - 他のコンポーネント修正
  - テスト

- [ ] Day 3: 独自JWT実装の削除
  - jwt.ts削除
  - api-auth.ts削除
  - /api/auth/me、/api/auth/logout削除
  - 依存関係のクリーンアップ

- [ ] Day 4-5: 統合テストと調整
  - ログインフローのテスト
  - 管理者機能のテスト
  - ランキング編集機能のテスト
  - バグ修正

### 第2週: セキュリティとクリーンアップ

**目標:** セキュリティ強化とコード整理

- [ ] Day 1: データベーススキーマのクリーンアップ
  - sessionsテーブルの削除（JWT戦略の場合）
  - 未使用カラムの削除

- [ ] Day 2: セキュリティ設定
  - NEXTAUTH_SECRET確認
  - Cookieセキュリティ設定
  - 本番環境の環境変数設定

- [ ] Day 3-4: 型定義とリファクタリング
  - database.ts型定義作成
  - next-auth.d.ts拡張
  - マッピング関数実装

- [ ] Day 5: ドキュメント作成
  - 認証システムのREADME作成
  - APIドキュメント更新
  - 開発者向けガイド作成

---

## テスト計画

### 1. 手動テスト

#### ログインフロー
- [ ] ログインページにアクセス
- [ ] 正しい認証情報でログイン
- [ ] 間違った認証情報でログイン（エラー表示確認）
- [ ] ログイン後にホームページにリダイレクト
- [ ] セッションが保持されている（ページリロード後も認証状態維持）

#### 管理者機能
- [ ] 管理者アカウントでログイン
- [ ] ランキングページにアクセス
- [ ] 「管理者モード」バッジが表示される
- [ ] RankingNavigationEditableが表示される
- [ ] ランキング項目の編集・追加・削除が可能

#### 一般ユーザー
- [ ] 一般ユーザーアカウントでログイン
- [ ] ランキングページにアクセス
- [ ] 「管理者モード」バッジが表示されない
- [ ] RankingNavigationが表示される（編集不可）

#### ログアウト
- [ ] ログアウトボタンをクリック
- [ ] ログインページにリダイレクト
- [ ] セッションがクリアされている

#### 保護されたページ
- [ ] 未認証で/profileにアクセス → ログインページにリダイレクト
- [ ] 未認証で/adminにアクセス → ログインページにリダイレクト
- [ ] 一般ユーザーで/adminにアクセス → ホームページにリダイレクト

### 2. 自動テスト（将来実装）

```typescript
// 例: tests/auth.test.ts
describe("Authentication", () => {
  it("should login with valid credentials", async () => {
    const result = await signIn("credentials", {
      redirect: false,
      email: "admin@stats47.local",
      password: "admin123",
    });

    expect(result?.error).toBeUndefined();
  });

  it("should fail with invalid credentials", async () => {
    const result = await signIn("credentials", {
      redirect: false,
      email: "admin@stats47.local",
      password: "wrongpassword",
    });

    expect(result?.error).toBeDefined();
  });
});
```

---

## よくある質問（FAQ）

### Q1: なぜ二重の認証システムが存在するのか？

**A:** おそらく、プロジェクトの進化の過程で、最初に独自のJWT実装を作成し、後にNextAuthを導入したと思われます。古いコード（AuthContext）が削除されずに残っている状態です。

### Q2: NextAuthとカスタムJWT、どちらを選ぶべきか？

**A:** **NextAuthを強く推奨**します。理由：
- 業界標準のライブラリ
- セキュリティが強化されている
- 豊富なドキュメントとコミュニティサポート
- OAuth、2FAなどの拡張機能
- メンテナンス負担が少ない

### Q3: JWT戦略とdatabase戦略、どちらを選ぶべきか？

**A:** **JWT戦略を推奨**します（現在の設定を維持）。理由：
- Cloudflare Workersに最適（ステートレス）
- パフォーマンスが高い
- スケーラビリティが高い
- D1データベースへの書き込みコストを削減

ただし、以下の要件がある場合はdatabase戦略を検討：
- セッションの即時無効化が必要
- 詳細な監査ログが必要
- ユーザー情報の更新をリアルタイムで反映

### Q4: 既存のユーザーデータはどうなるか？

**A:** `users`テーブルのデータは影響を受けません。セッション管理の方法が変わるだけです。既存のユーザーは引き続きログイン可能です。

### Q5: 本番環境への影響は？

**A:**
- **影響あり:** 現在ログイン中のユーザーはログアウトされます
- **影響なし:** ユーザーデータ、パスワードは変更されません
- **推奨:** メンテナンス時間を設けて移行

### Q6: ロールバックは可能か？

**A:** はい、gitで変更をコミットしておけば、いつでもロールバック可能です。

```bash
# 変更前にブランチを作成
git checkout -b auth-migration

# 作業を行う

# 問題があればロールバック
git checkout main
```

---

## リソースとドキュメント

### 公式ドキュメント

- [NextAuth.js v5 (Auth.js)](https://authjs.dev/)
- [NextAuth.js Credentials Provider](https://authjs.dev/getting-started/providers/credentials)
- [NextAuth.js Database Adapters](https://authjs.dev/getting-started/adapters)
- [Cloudflare Workers + Auth.js](https://authjs.dev/getting-started/deployment/cloudflare)

### 参考実装

- [Next.js Auth Example](https://github.com/vercel/next.js/tree/canary/examples/auth)
- [Auth.js D1 Adapter Discussion](https://github.com/nextauthjs/next-auth/discussions)

---

## チェックリスト

### 移行前の準備

- [ ] 現在の認証システムの動作を確認
- [ ] データベースのバックアップを取得
- [ ] gitブランチを作成（`auth-migration`）
- [ ] ステージング環境で事前テスト

### フェーズ1: 認証システムの統一

- [ ] `useAuth()`を`useSession()`に置き換え
- [ ] AuthContext.tsxを削除
- [ ] jwt.ts、api-auth.tsを削除
- [ ] /api/auth/me、/api/auth/logoutを削除
- [ ] 全コンポーネントでテスト
- [ ] git commit

### フェーズ2: データベーススキーマ

- [ ] JWT戦略 vs database戦略を決定
- [ ] sessionsテーブルのクリーンアップ（JWT戦略の場合）
- [ ] マイグレーションスクリプトを実行
- [ ] git commit

### フェーズ3: セキュリティ強化

- [ ] JWT_SECRETを削除
- [ ] NEXTAUTH_SECRETを確認
- [ ] Cookieセキュリティ設定
- [ ] 本番環境の環境変数設定
- [ ] git commit

### フェーズ4: コード整理

- [ ] 型定義の作成（database.ts、next-auth.d.ts）
- [ ] マッピング関数の実装
- [ ] ドキュメントの作成
- [ ] git commit

### テストと本番デプロイ

- [ ] すべての手動テストを実行
- [ ] ステージング環境でテスト
- [ ] レビューとフィードバック
- [ ] 本番環境にデプロイ
- [ ] 本番環境でテスト

---

## まとめ

### 現状

プロジェクトには**2つの認証システム**（NextAuthとカスタムJWT）が並存しており、以下の問題があります：

1. 認証フローが分離している
2. AuthContextが機能していない
3. データベーススキーマの不一致
4. セキュリティリスク

### 推奨アクション

1. **NextAuthに統一**（最優先）
   - AuthContextを削除
   - カスタムJWT実装を削除
   - `useSession()`を使用

2. **JWT戦略を維持**（推奨）
   - データベース書き込み不要
   - Cloudflare Workersに最適
   - 現在の設定を維持

3. **セキュリティ強化**
   - NEXTAUTH_SECRETを確認
   - Cookie設定を強化

### 期待される効果

- ✅ 認証システムの一貫性
- ✅ コードの保守性向上
- ✅ セキュリティの強化
- ✅ バグの削減
- ✅ 管理者機能の正常動作

### 推定作業時間

- フェーズ1（認証統一）: 3-5日
- フェーズ2（スキーマ修正）: 1-2日
- フェーズ3（セキュリティ）: 1日
- フェーズ4（リファクタリング）: 2-3日
- **合計: 1-2週間**

---

**作成日:** 2025-10-12
**バージョン:** 1.0
**次回レビュー:** 移行完了後
