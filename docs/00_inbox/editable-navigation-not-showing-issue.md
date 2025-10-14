# 編集可能なナビゲーションが表示されない問題の調査と解決策

## 問題概要

**症状:** 開発用アカウントでログイン中にもかかわらず、`RankingClient` コンポーネントで編集可能なナビゲーション（`RankingNavigationEditable`）が表示されず、通常のナビゲーション（`RankingNavigation`）が表示される。

**影響範囲:** ランキングページでランキング項目の編集・追加・削除・並び替えができない。

**対象ファイル:** `src/components/ranking/RankingClient/RankingClient.tsx`

---

## 根本原因の分析

### 1. RankingClientの認証ロジック

`src/components/ranking/RankingClient/RankingClient.tsx:28-35`

```typescript
// 認証情報を安全に取得（AuthProviderが利用できない場合はデフォルト値を使用）
let isAdmin = false;
try {
  const auth = useAuth();
  isAdmin = auth.isAdmin;
} catch (error) {
  console.warn("AuthProvider not available, using default isAdmin=false");
}
```

**問題点:**
- try-catchブロックでエラーをキャッチして、`isAdmin = false` をデフォルト値として使用
- エラーが発生した場合、ユーザーに通知せずに静かに失敗する
- 実際にエラーが発生しているかどうかをユーザーが確認できない

### 2. 条件分岐ロジック

`src/components/ranking/RankingClient/RankingClient.tsx:125-141`

```typescript
{/* ナビゲーション */}
{isAdmin && rankingItems ? (
  <RankingNavigationEditable
    categoryId={categoryId}
    subcategoryId={subcategoryId}
    activeRankingId={activeRankingKey}
    tabOptions={tabOptions}
    rankingItems={rankingItems}
    editable={true}
  />
) : (
  <RankingNavigation
    categoryId={categoryId}
    subcategoryId={subcategoryId}
    activeRankingId={activeRankingKey}
    tabOptions={tabOptions}
  />
)}
```

**条件:** `isAdmin && rankingItems` が両方とも `true` の場合のみ、編集可能なナビゲーションが表示される。

### 3. AuthContextの実装

`src/contexts/AuthContext.tsx:97-103`

```typescript
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

- `context` が `undefined` の場合、エラーをthrowする
- RankingClientのtry-catchブロックがこのエラーをキャッチする可能性がある

### 4. isAdminの判定ロジック

`src/contexts/AuthContext.tsx:80-90`

```typescript
<AuthContext.Provider
  value={{
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",  // ← ここが重要
    login,
    logout,
    refreshUser,
  }}
>
```

**条件:** `user.role === "admin"` の場合のみ `isAdmin = true`

### 5. ユーザー情報の取得

`src/app/api/auth/me/route.ts:59-68`

```typescript
return NextResponse.json({
  success: true,
  user: {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role || "user",  // ← デフォルト値は "user"
    lastLogin: user.last_login,
  },
});
```

**注意:** `role` フィールドがデータベースに存在しない場合、デフォルト値として `"user"` が使用される。

### 6. データベースのユーザー情報

```bash
npx wrangler d1 execute stats47 --local --command \
  "SELECT id, username, role FROM users;"
```

**結果:**
```json
[
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "username": "admin",
    "role": "admin"
  },
  {
    "id": "00000000-0000-0000-0000-000000000002",
    "username": "testuser",
    "role": "user"
  }
]
```

---

## 問題の原因（推定）

以下の**3つの原因**のいずれか、または複数が組み合わさっている可能性があります：

### 原因1: 間違ったアカウントでログインしている

**可能性:** `testuser` でログインしている場合、`role = "user"` のため `isAdmin = false`

**確認方法:**
1. ブラウザの開発者ツールを開く（F12）
2. Consoleタブを開く
3. 以下のコードを実行：
```javascript
fetch('/api/auth/me').then(r => r.json()).then(console.log)
```

**期待される結果:**
```json
{
  "success": true,
  "user": {
    "id": "00000000-0000-0000-0000-000000000001",
    "username": "admin",
    "role": "admin"
  }
}
```

**もし `role: "user"` の場合:** 正しいアカウント（`admin`）でログインし直す必要がある。

### 原因2: ログインAPIエンドポイントが存在しない

**問題:** `AuthContext.tsx` は `/api/auth/login` エンドポイントを使用しているが、このエンドポイントが存在しない。

**確認した結果:**
```bash
ls -la src/app/api/auth/login/
# 結果: No login directory
```

**影響:**
- ログイン機能が動作していない可能性
- 別の認証方法（next-auth）を使用している可能性
- セッションが正しく確立されていない可能性

### 原因3: AuthProviderのコンテキストエラー

**問題:** `useAuth()` がエラーをthrowし、RankingClientのtry-catchブロックがキャッチしている。

**確認方法:**
1. ブラウザの開発者ツールを開く（F12）
2. Consoleタブを確認
3. 以下のメッセージが表示されているか確認：
```
AuthProvider not available, using default isAdmin=false
```

**もしこのメッセージが表示されている場合:** AuthProviderが正しく機能していない。

---

## 解決手順

### 手順1: 現在のログイン状態を確認

#### 1-1. ブラウザで確認

1. ランキングページを開く（例: `http://localhost:3000/landweather/land-area/ranking/total-area-excluding`）
2. ブラウザの開発者ツールを開く（F12）
3. **Consoleタブ**を開く
4. 以下のコマンドを実行：

```javascript
// 現在のユーザー情報を取得
fetch('/api/auth/me')
  .then(r => r.json())
  .then(data => {
    console.log('User:', data);
    console.log('Role:', data.user?.role);
    console.log('isAdmin:', data.user?.role === 'admin');
  });
```

5. Consoleで警告メッセージを確認：
```
AuthProvider not available, using default isAdmin=false
```

#### 1-2. 結果の判断

**ケースA: `role: "admin"` が返ってくる場合**
- ログインは成功している
- 問題は AuthContext または RankingClient の実装にある
- → **手順2** へ進む

**ケースB: `role: "user"` が返ってくる場合**
- 間違ったアカウントでログインしている
- → **手順3** へ進む

**ケースC: 401エラーが返ってくる場合**
- ログインしていない、またはセッションが切れている
- → **手順4** へ進む

---

### 手順2: RankingClientのデバッグログを追加

#### 2-1. RankingClient.tsx を修正

`src/components/ranking/RankingClient/RankingClient.tsx:28-35` を以下のように修正：

```typescript
// 認証情報を安全に取得（AuthProviderが利用できない場合はデフォルト値を使用）
let isAdmin = false;
let authDebugInfo = { error: null, user: null, isLoading: false };

try {
  const auth = useAuth();
  isAdmin = auth.isAdmin;
  authDebugInfo = {
    error: null,
    user: auth.user,
    isLoading: auth.isLoading,
  };

  // デバッグログ
  console.log('🔍 RankingClient Auth Debug:', {
    isAdmin: auth.isAdmin,
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    isLoading: auth.isLoading,
    role: auth.user?.role,
  });
} catch (error) {
  console.error('❌ AuthProvider Error:', error);
  console.warn("AuthProvider not available, using default isAdmin=false");
  authDebugInfo.error = error;
}

// 追加のデバッグログ
console.log('🎯 Final isAdmin value:', isAdmin);
console.log('📦 rankingItems:', rankingItems);
console.log('✅ Will show editable?', isAdmin && rankingItems);
```

#### 2-2. 開発サーバーを再起動

```bash
# 開発サーバーを停止（Ctrl+C）
# 再起動
npm run dev
```

#### 2-3. ページをリロードして確認

1. ランキングページをリロード
2. ブラウザの開発者ツールのConsoleタブを確認
3. 以下のログを確認：
   - `🔍 RankingClient Auth Debug:` - 認証情報
   - `🎯 Final isAdmin value:` - 最終的なisAdmin値
   - `📦 rankingItems:` - ランキング項目データ
   - `✅ Will show editable?` - 編集可能かどうか

#### 2-4. 結果の判断

**ログが表示されない場合:**
- RankingClientがレンダリングされていない
- → SubcategoryRankingPageの実装を確認

**`isAdmin: false` の場合:**
- ユーザーのroleが"admin"ではない
- → **手順3** へ進む

**`isAdmin: true` だが編集ナビゲーションが表示されない場合:**
- `rankingItems` が空、またはundefined
- → **手順5** へ進む

---

### 手順3: 正しいアカウントでログインし直す

#### 3-1. 現在のセッションをログアウト

1. ブラウザで `/logout` にアクセス
2. またはブラウザの開発者ツールのConsoleで以下を実行：

```javascript
fetch('/api/auth/logout', { method: 'POST' })
  .then(() => location.reload());
```

#### 3-2. 管理者アカウントでログイン

1. `/login` ページにアクセス
2. 以下の認証情報でログイン：
   - **Username:** `admin`
   - **Password:** （データベースに登録されているパスワード）

**パスワードが不明な場合:**

データベースで確認：
```bash
npx wrangler d1 execute stats47 --local --command \
  "SELECT username, password FROM users WHERE username = 'admin';"
```

**パスワードをリセットする必要がある場合:**

```bash
# 新しいパスワードハッシュを生成（例: "admin123"）
# この作業は別途パスワードハッシュ化ツールが必要

# データベースを更新
npx wrangler d1 execute stats47 --local --command \
  "UPDATE users SET password = '新しいハッシュ' WHERE username = 'admin';"
```

#### 3-3. ログイン確認

```javascript
fetch('/api/auth/me')
  .then(r => r.json())
  .then(console.log);
```

**期待される結果:**
```json
{
  "success": true,
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

---

### 手順4: ログインAPIエンドポイントを実装（オプション）

**注意:** この手順は、ログイン機能が完全に動作していない場合のみ必要です。

#### 4-1. ログインAPIを作成

`src/app/api/auth/login/route.ts` を作成：

```typescript
import { NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";
import { signToken } from "@/lib/auth/jwt";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "ユーザー名とパスワードが必要です" },
        { status: 400 }
      );
    }

    const db = await createD1Database();

    // ユーザー検索
    const user = await db
      .prepare("SELECT * FROM users WHERE username = ?")
      .bind(username)
      .first();

    if (!user) {
      return NextResponse.json(
        { error: "ユーザー名またはパスワードが正しくありません" },
        { status: 401 }
      );
    }

    // パスワード検証
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "ユーザー名またはパスワードが正しくありません" },
        { status: 401 }
      );
    }

    // セッション作成
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7日間

    await db
      .prepare(
        "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)"
      )
      .bind(sessionId, user.id, expiresAt.toISOString())
      .run();

    // JWT トークン生成
    const token = await signToken({
      userId: user.id,
      sessionId: sessionId,
    });

    // レスポンスにクッキーを設定
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || "user",
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7日間
      path: "/",
    });

    // 最終ログイン時刻を更新
    await db
      .prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(user.id)
      .run();

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "ログインに失敗しました" },
      { status: 500 }
    );
  }
}
```

#### 4-2. 必要な依存関係を確認

```bash
# bcryptjsがインストールされているか確認
npm list bcryptjs

# インストールされていない場合
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

---

### 手順5: rankingItemsの確認

#### 5-1. データベースにランキング項目が存在するか確認

```bash
npx wrangler d1 execute stats47 --local --command \
  "SELECT * FROM ranking_items WHERE subcategory_id = 'land-area';"
```

**結果が空の場合:** データベースにデータを追加する必要がある（[404-error-analysis.md](./404-error-analysis.md)参照）

#### 5-2. APIエンドポイントの確認

```bash
curl http://localhost:3000/api/ranking-items/subcategory/land-area
```

**期待される結果:** ランキング項目のリストが返ってくる

---

## クイック修正: try-catchブロックを削除

**最も簡単な解決策:** try-catchブロックを削除して、エラーが発生した場合は明確に表示する。

### 修正前

`src/components/ranking/RankingClient/RankingClient.tsx:28-35`

```typescript
let isAdmin = false;
try {
  const auth = useAuth();
  isAdmin = auth.isAdmin;
} catch (error) {
  console.warn("AuthProvider not available, using default isAdmin=false");
}
```

### 修正後

```typescript
const auth = useAuth();
const isAdmin = auth.isAdmin;

// デバッグログ（開発時のみ）
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 RankingClient Auth:', {
    isAdmin: auth.isAdmin,
    role: auth.user?.role,
    isAuthenticated: auth.isAuthenticated,
  });
}
```

**メリット:**
- エラーが発生した場合、明確にエラーメッセージが表示される
- AuthProviderが正しく設定されていない場合、すぐに気づける
- デバッグが容易

**デメリット:**
- AuthProviderが利用できない環境では、コンポーネントがエラーで動作しなくなる

---

## 推奨される修正（長期的解決策）

### 修正案1: isLoadingを考慮したレンダリング

```typescript
export function RankingClient<T extends string>({
  subcategory,
  activeRankingKey,
  rankingItems,
}: RankingClientProps<T>) {
  const params = useParams();
  const auth = useAuth();

  // ローディング中は何も表示しない
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  const isAdmin = auth.isAdmin;
  const categoryId = params.category as string;
  const subcategoryId = params.subcategory as string;

  // デバッグログ（開発時のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 RankingClient Auth:', {
      isAdmin,
      role: auth.user?.role,
      isAuthenticated: auth.isAuthenticated,
    });
  }

  // ... 残りのコード
}
```

### 修正案2: 管理者専用バッジを追加（視覚的フィードバック）

```typescript
return (
  <div className="flex flex-col lg:flex-row gap-6">
    {/* メインコンテンツ */}
    <div className="flex-1">
      {/* 管理者の場合はバッジを表示 */}
      {isAdmin && (
        <div className="mb-4 p-2 bg-indigo-50 border border-indigo-200 rounded-md">
          <span className="text-sm text-indigo-700">
            🔧 管理者モード: ランキング項目を編集できます
          </span>
        </div>
      )}

      <EstatRankingClient ... />
    </div>

    {/* ナビゲーション */}
    {isAdmin && rankingItems ? (
      <RankingNavigationEditable ... />
    ) : (
      <RankingNavigation ... />
    )}
  </div>
);
```

---

## トラブルシューティング

### 問題: 「useAuth must be used within an AuthProvider」エラー

**原因:** `AuthProvider` が正しく設定されていない

**解決策:**

1. `src/app/layout.tsx` を確認：

```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <JotaiProvider>
          <SessionProvider>
            <AuthProvider>  {/* ← これが必要 */}
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

2. AuthProviderが正しくimportされているか確認：

```typescript
import { AuthProvider } from "@/contexts/AuthContext";
```

### 問題: 管理者でログインしているのにisAdmin = false

**原因1:** データベースのroleフィールドが正しく設定されていない

**確認:**
```bash
npx wrangler d1 execute stats47 --local --command \
  "SELECT id, username, role FROM users WHERE username = 'admin';"
```

**修正:**
```bash
npx wrangler d1 execute stats47 --local --command \
  "UPDATE users SET role = 'admin' WHERE username = 'admin';"
```

**原因2:** セッションが古い

**解決策:** ログアウトして再ログイン

```javascript
fetch('/api/auth/logout', { method: 'POST' })
  .then(() => location.href = '/login');
```

### 問題: ブラウザのコンソールに何も表示されない

**原因:** デバッグログが追加されていない、またはコンポーネントがレンダリングされていない

**解決策:**

1. `RankingClient.tsx` にデバッグログを追加（手順2参照）
2. React DevToolsでコンポーネントツリーを確認
3. `SubcategoryRankingPage` が正しくレンダリングされているか確認

---

## まとめ

編集可能なナビゲーションが表示されない主な原因は以下の3つです：

1. **間違ったアカウントでログインしている** - `role: "user"` の場合
2. **AuthProviderのエラー** - try-catchブロックがエラーをキャッチしている
3. **ログイン機能の問題** - `/api/auth/login` エンドポイントが存在しない

**最優先で確認すべきこと:**

1. ブラウザのConsoleで現在のユーザー情報を確認
   ```javascript
   fetch('/api/auth/me').then(r => r.json()).then(console.log)
   ```

2. 結果が `role: "admin"` であることを確認

3. もし `role: "user"` の場合、`admin` アカウントで再ログイン

4. それでも表示されない場合、try-catchブロックを削除してエラーメッセージを確認

**推奨される恒久的な修正:**

1. try-catchブロックを削除してエラーを明示的に表示
2. isLoadingを考慮したレンダリング
3. デバッグログを追加（開発環境のみ）
4. 管理者モードの視覚的フィードバックを追加

---

**作成日:** 2025-10-12
**対象コンポーネント:** `src/components/ranking/RankingClient/RankingClient.tsx`
**関連ファイル:**
- `src/contexts/AuthContext.tsx:1-104`
- `src/app/api/auth/me/route.ts:1-77`
- `src/components/ranking/RankingClient/RankingNavigationEditable.tsx:1-197`
- `src/app/layout.tsx:1-44`
