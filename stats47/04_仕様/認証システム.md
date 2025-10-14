# Stats47 認証システム実装ガイド

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [技術スタック](#技術スタック)
3. [OAuth実装可能性の調査結果](#oauth実装可能性の調査結果)
4. [アーキテクチャ設計](#アーキテクチャ設計)
5. [データベース設計](#データベース設計)
6. [認証フロー](#認証フロー)
7. [コンポーネント設計](#コンポーネント設計)
8. [API設計](#api設計)
9. [セキュリティ対策](#セキュリティ対策)
10. [実装手順](#実装手順)
11. [テスト戦略](#テスト戦略)

---

## プロジェクト概要

Stats47プロジェクトに包括的な認証システムを実装します。以下の機能を提供します：

### 主要機能

1. **通常ログイン機能**
   - メールアドレス/ユーザー名 + パスワードでのログイン
   - パスワードハッシュ化（bcryptjs）
   - セッション管理（JWT）

2. **OAuth連携ログイン**
   - Google アカウントでログイン
   - LINE アカウントでログイン
   - OAuth 2.0 / OpenID Connect

3. **新規登録機能**
   - メールアドレスベースの新規登録
   - メール認証（オプション）
   - パスワード強度チェック

4. **ユーザー管理機能（管理者専用）**
   - ユーザー一覧表示
   - ユーザー詳細情報
   - ユーザーの有効化/無効化
   - 役割（ロール）管理

5. **プロフィール編集機能**
   - ユーザー情報の編集
   - パスワード変更
   - アカウント連携管理

6. **役割ベースのアクセス制御（RBAC）**
   - 管理者（admin）：すべての機能にアクセス可能
   - 一般ユーザー（user）：閲覧のみ

---

## 技術スタック

### フロントエンド
- **Next.js 15.5.2** - App Router
- **React 19.1.0**
- **TypeScript 5.9.3**
- **Tailwind CSS 4**
- **lucide-react** - アイコン

### 認証ライブラリ
- **Auth.js (NextAuth.js v5)** - 認証フレームワーク
- **@auth/d1-adapter** - Cloudflare D1 データベースアダプター
- **bcryptjs** - パスワードハッシュ化
- **jose** - JWT署名・検証（既にインストール済み）

### データベース
- **Cloudflare D1 (SQLite)** - 本番環境
- **SQLite** - 開発環境

### デプロイ
- **Cloudflare Pages / Workers** - ホスティング
- **Wrangler** - デプロイツール

---

## OAuth実装可能性の調査結果

### 1. Auth.js (NextAuth.js v5) との互換性

#### ✅ **結論：完全に実装可能**

**根拠：**
- Auth.js は Next.js 15 に公式対応（2025年時点）
- Cloudflare D1 用の公式アダプター `@auth/d1-adapter` が提供されている
- Google OAuth と LINE Login の両方をサポート

**必要なパッケージ：**
```bash
npm install next-auth@beta @auth/d1-adapter
```

**注意点：**
- Next.js 15 では `next-auth@beta` をインストールする必要がある
- Cloudflare Workers/Pages 環境での動作確認が必要

---

### 2. Google OAuth 実装

#### ✅ **結論：実装可能**

**実装方法：**
Auth.js の Google Provider を使用

**必要な手順：**
1. Google Cloud Console でプロジェクト作成
2. OAuth 2.0 クライアント ID を作成
3. 承認済みリダイレクト URI を設定
   - 開発: `http://localhost:3000/api/auth/callback/google`
   - 本番: `https://yourdomain.com/api/auth/callback/google`
4. クライアント ID とシークレットを環境変数に設定

**設定例：**
```typescript
import Google from "next-auth/providers/google"

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
}
```

**取得できるユーザー情報：**
- ID
- 名前
- メールアドレス
- プロフィール画像URL
- メール認証済みフラグ

**コスト：**
- 無料（Google OAuth は無料で利用可能）

---

### 3. LINE Login 実装

#### ✅ **結論：実装可能（条件付き）**

**実装方法：**
Auth.js の LINE Provider を使用

**必要な手順：**
1. LINE Developers Console でプロバイダー作成
2. LINE Login チャネルを作成
3. コールバック URL を設定
4. Channel ID と Channel Secret を環境変数に設定
5. **重要：** メールアドレスを取得する場合は事前申請が必要

**設定例：**
```typescript
import Line from "next-auth/providers/line"

export const authConfig = {
  providers: [
    Line({
      clientId: process.env.LINE_CLIENT_ID,
      clientSecret: process.env.LINE_CLIENT_SECRET,
    }),
  ],
}
```

**取得できるユーザー情報：**
- LINE ユーザー ID
- 表示名
- プロフィール画像URL
- **メールアドレス（要申請）**

**メールアドレス取得の条件：**
1. LINE Developers Console で「Email address permission」を申請
2. 利用規約に同意
3. メールアドレス収集の説明画面のスクリーンショットをアップロード
4. 承認後に取得可能になる

**LINE Login バージョン：**
- **LINE Login v2.1** を使用（v2.0 は非推奨）
- OAuth 2.0 + OpenID Connect ベース

**コスト：**
- 無料（LINE Login は無料で利用可能）

**制限事項：**
- メールアドレスの取得には事前申請と承認が必要
- 申請が承認されるまでメールアドレスは取得できない

---

### 4. その他の OAuth プロバイダー

Auth.js は以下のプロバイダーもサポート：
- GitHub
- Facebook
- Twitter / X
- Apple
- Microsoft / Azure AD
- Discord
- Slack
- など 80+ のプロバイダー

必要に応じて追加可能です。

---

## アーキテクチャ設計

### システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  (Next.js 15 App Router + React 19)                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Login Page   │  │ Register     │  │ User Mgmt    │    │
│  │              │  │ Page         │  │ Page (Admin) │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ AuthContext (Global State)                           │ │
│  │ - User info, isAuthenticated, login, logout          │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Middleware                       │
│  - Route protection                                         │
│  - Session validation                                       │
│  - Role-based access control                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Auth.js / NextAuth                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Credentials  │  │ Google OAuth │  │ LINE OAuth   │    │
│  │ Provider     │  │ Provider     │  │ Provider     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ @auth/d1-adapter                                   │   │
│  │ - Session management                               │   │
│  │ - Account linking                                  │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare D1 Database (SQLite)                │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ users    │  │ accounts │  │ sessions │  │verification│  │
│  │          │  │          │  │          │  │_tokens    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │ ranking_items    │  │ subcategory_     │              │
│  │                  │  │ configs          │              │
│  └──────────────────┘  └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### 認証フロー概要

1. **通常ログイン（Credentials）**
   - ユーザーがメール + パスワードを入力
   - Auth.js Credentials Provider が検証
   - bcryptjs でパスワードをハッシュ化して比較
   - セッション作成（JWT）
   - httpOnly Cookie にトークンを保存

2. **OAuth ログイン（Google / LINE）**
   - ユーザーが「Googleでログイン」ボタンをクリック
   - OAuth プロバイダーの認証画面にリダイレクト
   - ユーザーが認証
   - コールバック URL に認証コードが返される
   - Auth.js がトークンを取得してユーザー情報を取得
   - accounts テーブルに OAuth アカウント情報を保存
   - users テーブルにユーザー情報を保存（初回のみ）
   - セッション作成

---

## データベース設計

### 既存テーブルとの統合戦略

Stats47 プロジェクトには既に `users` テーブルが存在するため、Auth.js のスキーマと統合する必要があります。

#### 戦略オプション

**オプション1: Auth.js のスキーマを採用し、既存の users テーブルを拡張（推奨）**
- Auth.js が自動作成する 4 つのテーブルを使用
- 既存の users テーブルのカラムを Auth.js の users テーブルに追加
- マイグレーションスクリプトでデータを移行

**オプション2: カスタムアダプターを作成**
- 既存のテーブル構造を維持
- Auth.js のアダプターインターフェースを実装
- より複雑だが、既存データをそのまま使える

**採用：オプション1（推奨）**

---

### Auth.js が作成するテーブル

Auth.js の D1 Adapter は以下の 4 つのテーブルを自動作成します：

#### 1. **users テーブル**

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                  -- UUID
  name TEXT,                            -- ユーザー名
  email TEXT UNIQUE,                    -- メールアドレス
  emailVerified DATETIME,               -- メール認証日時
  image TEXT,                           -- プロフィール画像URL
  -- 以下、既存テーブルから追加
  username TEXT UNIQUE,                 -- ユーザーネーム（ログイン用）
  password_hash TEXT,                   -- パスワードハッシュ
  role TEXT DEFAULT 'user',             -- 役割（user, admin）
  is_active BOOLEAN DEFAULT 1,          -- アクティブフラグ
  last_login DATETIME,                  -- 最終ログイン日時
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**変更点：**
- Auth.js の id は TEXT（UUID）だが、既存テーブルは INTEGER
- 既存のカラム（username, password_hash, role など）を追加

#### 2. **accounts テーブル**

OAuth アカウント情報を保存します。

```sql
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,                  -- UUID
  userId TEXT NOT NULL,                 -- users.id への外部キー
  type TEXT NOT NULL,                   -- 'oauth' または 'email'
  provider TEXT NOT NULL,               -- 'google', 'line', 'credentials'
  providerAccountId TEXT NOT NULL,      -- プロバイダー側のユーザーID
  refresh_token TEXT,                   -- リフレッシュトークン
  access_token TEXT,                    -- アクセストークン
  expires_at INTEGER,                   -- トークン有効期限
  token_type TEXT,                      -- トークンタイプ（'Bearer'など）
  scope TEXT,                           -- 権限スコープ
  id_token TEXT,                        -- ID トークン（OpenID Connect）
  session_state TEXT,                   -- セッション状態
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_provider
  ON accounts(provider, providerAccountId);
```

**用途：**
- Google アカウントや LINE アカウントの連携情報
- 1 ユーザーが複数のプロバイダーを連携可能
- リフレッシュトークンで長期的なアクセスを維持

#### 3. **sessions テーブル**

セッション情報を保存します。

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,                  -- UUID
  sessionToken TEXT UNIQUE NOT NULL,    -- セッショントークン
  userId TEXT NOT NULL,                 -- users.id への外部キー
  expires DATETIME NOT NULL,            -- 有効期限
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_sessionToken ON sessions(sessionToken);
```

**用途：**
- ユーザーのセッション管理
- JWT の代わりにデータベースセッションを使用する場合

#### 4. **verification_tokens テーブル**

メール認証トークンを保存します。

```sql
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,             -- メールアドレス
  token TEXT NOT NULL,                  -- 認証トークン
  expires DATETIME NOT NULL,            -- 有効期限
  PRIMARY KEY (identifier, token)
);
```

**用途：**
- メール認証リンクのトークン管理
- パスワードリセットトークン（カスタマイズ可能）

---

### データベースマイグレーション計画

#### マイグレーションステップ

**Step 1: 既存 users テーブルのバックアップ**

```sql
-- 既存データをバックアップ
CREATE TABLE users_backup AS SELECT * FROM users;
```

**Step 2: Auth.js テーブルの作成**

```sql
-- Auth.js が自動作成するテーブル
-- または、カスタマイズしたスキーマを手動で作成

-- users テーブル（Auth.js + カスタムカラム）
CREATE TABLE IF NOT EXISTS users_new (
  id TEXT PRIMARY KEY,                  -- UUID
  name TEXT,                            -- 表示名
  email TEXT UNIQUE NOT NULL,           -- メールアドレス
  emailVerified DATETIME,               -- メール認証日時
  image TEXT,                           -- プロフィール画像URL
  username TEXT UNIQUE,                 -- ユーザーネーム
  password_hash TEXT,                   -- パスワードハッシュ
  role TEXT DEFAULT 'user',             -- 役割
  is_active BOOLEAN DEFAULT 1,          -- アクティブフラグ
  last_login DATETIME,                  -- 最終ログイン
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- accounts テーブル
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- sessions テーブル
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  sessionToken TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL,
  expires DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- verification_tokens テーブル
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires DATETIME NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- インデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_provider
  ON accounts(provider, providerAccountId);
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_sessionToken ON sessions(sessionToken);
CREATE INDEX IF NOT EXISTS idx_users_username ON users_new(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users_new(email);
```

**Step 3: 既存データの移行**

```sql
-- 既存ユーザーデータを新しいテーブルに移行
INSERT INTO users_new (
  id,
  email,
  username,
  password_hash,
  role,
  is_active,
  last_login,
  created_at,
  updated_at
)
SELECT
  -- UUID を生成（SQLite には UUID関数がないため、アプリ側で生成）
  lower(hex(randomblob(16))),  -- 簡易UUID生成
  email,
  username,
  password_hash,
  COALESCE(role, 'user') as role,  -- role カラムがない場合のデフォルト
  is_active,
  last_login,
  created_at,
  updated_at
FROM users_backup;
```

**Step 4: テーブルのリネーム**

```sql
-- 既存テーブルを削除
DROP TABLE users;

-- 新しいテーブルをリネーム
ALTER TABLE users_new RENAME TO users;
```

**Step 5: 外部キー制約の確認**

```sql
-- estat_data_history テーブルの外部キー制約を確認
-- 必要に応じて、user_id カラムの型を INTEGER から TEXT に変更
```

---

### マイグレーションスクリプト

`database/migrations/001_auth_js_integration.sql`

```sql
-- Auth.js 統合マイグレーション
-- 実行日: YYYY-MM-DD

-- Step 1: バックアップ
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- Step 2: 新しい users テーブルの作成
CREATE TABLE IF NOT EXISTS users_new (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  emailVerified DATETIME,
  image TEXT,
  username TEXT UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Auth.js テーブルの作成
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  sessionToken TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL,
  expires DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires DATETIME NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Step 4: インデックスの作成
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_provider
  ON accounts(provider, providerAccountId);
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_sessionToken ON sessions(sessionToken);
CREATE INDEX IF NOT EXISTS idx_users_username ON users_new(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users_new(email);

-- Step 5: データ移行
-- 注意: 本番環境では、アプリケーション側でUUIDを生成して移行することを推奨
INSERT INTO users_new (
  id,
  name,
  email,
  username,
  password_hash,
  role,
  is_active,
  last_login,
  created_at,
  updated_at
)
SELECT
  lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))) as id,
  username as name,  -- name カラムに username を設定
  email,
  username,
  password_hash,
  'user' as role,    -- デフォルトでユーザー役割
  is_active,
  last_login,
  created_at,
  updated_at
FROM users_backup
WHERE email IS NOT NULL;  -- email が NULL のレコードは除外

-- Step 6: 管理者ユーザーの更新
UPDATE users_new SET role = 'admin' WHERE username = 'admin';

-- Step 7: テーブルの入れ替え
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Step 8: 完了確認
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as backup_count FROM users_backup;
```

**マイグレーション実行コマンド（Wrangler）：**

```bash
# ローカルD1データベースにマイグレーション実行
npx wrangler d1 execute stats47-db --local --file=./database/migrations/001_auth_js_integration.sql

# 本番D1データベースにマイグレーション実行（慎重に！）
npx wrangler d1 execute stats47-db --file=./database/migrations/001_auth_js_integration.sql
```

---

### サンプルデータの作成

開発用に管理者ユーザーと一般ユーザーを作成します。

`database/seeds/users_seed.sql`

```sql
-- 開発用サンプルユーザー
-- パスワード: admin123 (bcrypt hash)
INSERT OR IGNORE INTO users (
  id,
  name,
  email,
  username,
  password_hash,
  role,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Administrator',
  'admin@stats47.local',
  'admin',
  '$2a$10$rB7XqVV3Jl1Lqb7L/L0gWuYZYqXqXqXqXqXqXqXqXqXqXqXqXqXqX',  -- admin123
  'admin',
  1
);

-- 一般ユーザー
-- パスワード: user123 (bcrypt hash)
INSERT OR IGNORE INTO users (
  id,
  name,
  email,
  username,
  password_hash,
  role,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Test User',
  'user@stats47.local',
  'testuser',
  '$2a$10$rB7XqVV3Jl1Lqb7L/L0gWuYZYqXqXqXqXqXqXqXqXqXqXqXqXqXqY',  -- user123
  'user',
  1
);
```

**注意：** 実際のパスワードハッシュは bcryptjs で生成する必要があります。

**パスワードハッシュ生成スクリプト：**

`scripts/generate-password-hash.ts`

```typescript
import bcrypt from 'bcryptjs';

async function generateHash(password: string) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
}

// 実行例
generateHash('admin123');
generateHash('user123');
```

```bash
# 実行
npx tsx scripts/generate-password-hash.ts
```

---

## 認証フロー

### 1. 通常ログインフロー（Credentials）

```
┌────────┐                 ┌─────────────┐                 ┌──────────┐
│ Client │                 │  Auth.js    │                 │    D1    │
└────────┘                 └─────────────┘                 └──────────┘
     │                             │                             │
     │  1. POST /api/auth/signin   │                             │
     ├────────────────────────────>│                             │
     │  (email, password)           │                             │
     │                             │                             │
     │                             │  2. SELECT user by email    │
     │                             ├────────────────────────────>│
     │                             │                             │
     │                             │<────────────────────────────┤
     │                             │  user data                  │
     │                             │                             │
     │                             │  3. Compare password hash   │
     │                             │  (bcrypt.compare)           │
     │                             │                             │
     │                             │  4. INSERT session          │
     │                             ├────────────────────────────>│
     │                             │                             │
     │                             │<────────────────────────────┤
     │                             │  session created            │
     │                             │                             │
     │<────────────────────────────┤                             │
     │  Set-Cookie: session-token  │                             │
     │  (httpOnly, secure)         │                             │
     │                             │                             │
```

**詳細ステップ：**

1. ユーザーがログインフォームにメールアドレスとパスワードを入力
2. フロントエンドが `POST /api/auth/signin` にリクエスト
3. Auth.js の Credentials Provider が呼び出される
4. データベースから email でユーザーを検索
5. bcrypt でパスワードハッシュを比較
6. パスワードが一致すれば、セッションを作成
7. セッショントークンを httpOnly Cookie に保存
8. ユーザー情報を返す

---

### 2. Google OAuth フロー

```
┌────────┐         ┌─────────────┐        ┌──────────┐        ┌────────┐
│ Client │         │  Auth.js    │        │    D1    │        │ Google │
└────────┘         └─────────────┘        └──────────┘        └────────┘
     │                     │                     │                   │
     │  1. Click "Google"  │                     │                   │
     ├────────────────────>│                     │                   │
     │                     │                     │                   │
     │  2. Redirect to     │                     │                   │
     │     Google OAuth    │                     │                   │
     │<────────────────────┤                     │                   │
     │                     │                     │                   │
     ├──────────────────────────────────────────────────────────────>│
     │  3. User authenticates with Google                            │
     │<──────────────────────────────────────────────────────────────┤
     │  4. Redirect to callback with auth code                       │
     │                     │                     │                   │
     │  5. Callback        │                     │                   │
     ├────────────────────>│                     │                   │
     │  (code)             │                     │                   │
     │                     │  6. Exchange code   │                   │
     │                     ├──────────────────────────────────────────>│
     │                     │     for token       │                   │
     │                     │<──────────────────────────────────────────┤
     │                     │  access_token, id_token                 │
     │                     │                     │                   │
     │                     │  7. Get user info   │                   │
     │                     ├──────────────────────────────────────────>│
     │                     │<──────────────────────────────────────────┤
     │                     │  user profile       │                   │
     │                     │                     │                   │
     │                     │  8. INSERT/UPDATE   │                   │
     │                     │     user            │                   │
     │                     ├────────────────────>│                   │
     │                     │                     │                   │
     │                     │  9. INSERT account  │                   │
     │                     ├────────────────────>│                   │
     │                     │                     │                   │
     │                     │ 10. INSERT session  │                   │
     │                     ├────────────────────>│                   │
     │                     │                     │                   │
     │<────────────────────┤                     │                   │
     │  Set-Cookie: token  │                     │                   │
     │  Redirect to app    │                     │                   │
     │                     │                     │                   │
```

**詳細ステップ：**

1. ユーザーが「Google でログイン」ボタンをクリック
2. Auth.js が Google の OAuth 認証画面にリダイレクト
3. ユーザーが Google アカウントで認証
4. Google が認証コードを含むコールバック URL にリダイレクト
5. Auth.js がコールバックを受け取る
6. Auth.js が認証コードをアクセストークンと交換
7. Auth.js が Google API からユーザー情報を取得
8. データベースにユーザー情報を保存（初回のみ作成、既存なら更新）
9. accounts テーブルに Google アカウント情報を保存
10. セッションを作成
11. セッショントークンを httpOnly Cookie に保存
12. アプリケーションにリダイレクト

---

### 3. LINE Login フロー

Google OAuth と同様のフローですが、LINE API を使用します。

**主な違い：**
- LINE Developers Console で Channel ID と Channel Secret を取得
- LINE の OAuth 2.1 エンドポイントを使用
- メールアドレスを取得するには事前申請が必要

---

### 4. セッション検証フロー

```
┌────────┐                 ┌─────────────┐                 ┌──────────┐
│ Client │                 │  Middleware │                 │    D1    │
└────────┘                 └─────────────┘                 └──────────┘
     │                             │                             │
     │  1. Request to protected    │                             │
     │     route (with cookie)     │                             │
     ├────────────────────────────>│                             │
     │                             │                             │
     │                             │  2. Parse session token     │
     │                             │                             │
     │                             │  3. SELECT session          │
     │                             ├────────────────────────────>│
     │                             │                             │
     │                             │<────────────────────────────┤
     │                             │  session data               │
     │                             │                             │
     │                             │  4. Check expiry            │
     │                             │                             │
     │                             │  5. SELECT user             │
     │                             ├────────────────────────────>│
     │                             │                             │
     │                             │<────────────────────────────┤
     │                             │  user data                  │
     │                             │                             │
     │                             │  6. Attach user to request  │
     │                             │                             │
     │<────────────────────────────┤                             │
     │  Allow access               │                             │
     │                             │                             │
```

---

### 5. ログアウトフロー

```
┌────────┐                 ┌─────────────┐                 ┌──────────┐
│ Client │                 │  Auth.js    │                 │    D1    │
└────────┘                 └─────────────┘                 └──────────┘
     │                             │                             │
     │  1. POST /api/auth/signout  │                             │
     ├────────────────────────────>│                             │
     │                             │                             │
     │                             │  2. DELETE session          │
     │                             ├────────────────────────────>│
     │                             │                             │
     │                             │<────────────────────────────┤
     │                             │  session deleted            │
     │                             │                             │
     │<────────────────────────────┤                             │
     │  Clear cookie               │                             │
     │  Redirect to /login         │                             │
     │                             │                             │
```

---

## コンポーネント設計

### コンポーネント構造

```
src/
├── app/
│   ├── (auth)/                       # 認証関連のルートグループ
│   │   ├── login/
│   │   │   └── page.tsx              # ログインページ
│   │   ├── register/
│   │   │   └── page.tsx              # 新規登録ページ
│   │   └── verify-email/
│   │       └── page.tsx              # メール認証ページ
│   │
│   ├── (protected)/                  # 認証が必要なルートグループ
│   │   ├── profile/
│   │   │   ├── page.tsx              # プロフィール表示
│   │   │   └── edit/
│   │   │       └── page.tsx          # プロフィール編集
│   │   │
│   │   └── admin/                    # 管理者専用
│   │       └── users/
│   │           ├── page.tsx          # ユーザー一覧
│   │           └── [id]/
│   │               └── page.tsx      # ユーザー詳細
│   │
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts          # Auth.js API ルート
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx             # ログインフォーム
│   │   ├── RegisterForm.tsx          # 新規登録フォーム
│   │   ├── OAuthButtons.tsx          # OAuth ボタン（Google, LINE）
│   │   ├── PasswordInput.tsx         # パスワード入力（表示/非表示切替）
│   │   └── AuthGuard.tsx             # 認証チェック（HOC）
│   │
│   ├── user/
│   │   ├── UserCard.tsx              # ユーザーカード
│   │   ├── UserList.tsx              # ユーザーリスト
│   │   ├── UserDetailModal.tsx       # ユーザー詳細モーダル
│   │   └── UserEditForm.tsx          # ユーザー編集フォーム
│   │
│   └── layout/
│       ├── Header.tsx                # ヘッダー（ログイン状態表示）
│       └── UserMenu.tsx              # ユーザーメニュー（ドロップダウン）
│
├── contexts/
│   └── AuthContext.tsx               # 認証コンテキスト
│
├── lib/
│   ├── auth/
│   │   ├── auth.ts                   # Auth.js 設定
│   │   ├── auth.config.ts            # Auth.js config
│   │   └── session.ts                # セッション管理
│   │
│   └── utils/
│       ├── validation.ts             # バリデーション関数
│       └── password.ts               # パスワード強度チェック
│
└── middleware.ts                     # Next.js Middleware（認証チェック）
```

---

### 1. ログインページ

`src/app/(auth)/login/page.tsx`

```typescript
import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export const metadata: Metadata = {
  title: 'ログイン | Stats47',
  description: 'Stats47にログイン',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ロゴ */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Stats47
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            都道府県統計データプラットフォーム
          </p>
        </div>

        {/* ログインフォーム */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            ログイン
          </h2>

          {/* OAuth ボタン */}
          <OAuthButtons />

          {/* 区切り線 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                または
              </span>
            </div>
          </div>

          {/* メール/パスワードフォーム */}
          <LoginForm />

          {/* リンク */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              アカウントをお持ちでないですか？{' '}
              <a
                href="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                新規登録
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 2. ログインフォームコンポーネント

`src/components/auth/LoginForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PasswordInput } from './PasswordInput';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else {
        // ログイン成功
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('ログイン中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* メールアドレス */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          placeholder="email@example.com"
        />
      </div>

      {/* パスワード */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          パスワード
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {/* パスワードを忘れた */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
          >
            ログイン状態を保持
          </label>
        </div>

        <div className="text-sm">
          <a
            href="/forgot-password"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            パスワードを忘れた？
          </a>
        </div>
      </div>

      {/* ログインボタン */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'ログイン中...' : 'ログイン'}
      </button>
    </form>
  );
}
```

---

### 3. OAuth ボタンコンポーネント

`src/components/auth/OAuthButtons.tsx`

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export function OAuthButtons() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: 'google' | 'line') => {
    setIsLoading(provider);
    try {
      await signIn(provider, { callbackUrl: '/' });
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Google ログイン */}
      <button
        onClick={() => handleOAuthSignIn('google')}
        disabled={isLoading !== null}
        className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isLoading === 'google' ? 'ログイン中...' : 'Google でログイン'}
      </button>

      {/* LINE ログイン */}
      <button
        onClick={() => handleOAuthSignIn('line')}
        disabled={isLoading !== null}
        className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-white bg-[#00B900] hover:bg-[#00A000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00B900] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 5.896 2 10.667c0 4.771 4.477 8.666 10 8.666.552 0 1.1-.033 1.639-.098l3.028 2.431a.5.5 0 0 0 .833-.375v-3.857C20.033 16.063 22 13.55 22 10.667 22 5.896 17.523 2 12 2z" />
        </svg>
        {isLoading === 'line' ? 'ログイン中...' : 'LINE でログイン'}
      </button>
    </div>
  );
}
```

---

### 4. パスワード入力コンポーネント

`src/components/auth/PasswordInput.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean;
}

export function PasswordInput({ showStrength = false, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);

  const calculateStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return score;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (showStrength) {
      setStrength(calculateStrength(e.target.value));
    }
    props.onChange?.(e);
  };

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
  const strengthLabels = ['弱い', 'やや弱い', '普通', 'やや強い', '強い'];

  return (
    <div>
      <div className="relative">
        <input
          {...props}
          type={showPassword ? 'text' : 'password'}
          onChange={handleChange}
          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {showStrength && props.value && (
        <div className="mt-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded ${
                  i < strength ? strengthColors[strength - 1] : 'bg-gray-200 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            パスワード強度: {strength > 0 ? strengthLabels[strength - 1] : ''}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

### 5. 新規登録ページ

`src/app/(auth)/register/page.tsx`

```typescript
import { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export const metadata: Metadata = {
  title: '新規登録 | Stats47',
  description: 'Stats47の新規アカウント登録',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ロゴ */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Stats47
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            都道府県統計データプラットフォーム
          </p>
        </div>

        {/* 新規登録フォーム */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            新規登録
          </h2>

          {/* OAuth ボタン */}
          <OAuthButtons />

          {/* 区切り線 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                またはメールアドレスで登録
              </span>
            </div>
          </div>

          {/* メール登録フォーム */}
          <RegisterForm />

          {/* リンク */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              すでにアカウントをお持ちですか？{' '}
              <a
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                ログイン
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 6. 新規登録フォームコンポーネント

`src/components/auth/RegisterForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordInput } from './PasswordInput';

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (formData.password.length < 8) {
      setError('パスワードは8文字以上である必要があります');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '登録に失敗しました');
        return;
      }

      // 登録成功 -> ログインページにリダイレクト
      router.push('/login?registered=true');
    } catch (err) {
      setError('登録中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* ユーザーネーム */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          ユーザーネーム
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          placeholder="username"
        />
      </div>

      {/* メールアドレス */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          placeholder="email@example.com"
        />
      </div>

      {/* パスワード */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          パスワード
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          showStrength
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          placeholder="8文字以上"
        />
      </div>

      {/* パスワード確認 */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          パスワード（確認）
        </label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          placeholder="パスワードを再入力"
        />
      </div>

      {/* 利用規約 */}
      <div className="flex items-start">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          required
          className="h-4 w-4 mt-1 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label
          htmlFor="terms"
          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
        >
          <a
            href="/terms"
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            利用規約
          </a>
          と
          <a
            href="/privacy"
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            プライバシーポリシー
          </a>
          に同意します
        </label>
      </div>

      {/* 登録ボタン */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '登録中...' : '新規登録'}
      </button>
    </form>
  );
}
```

---

### 7. ユーザー管理ページ（管理者専用）

`src/app/(protected)/admin/users/page.tsx`

```typescript
import { Metadata } from 'next';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { UserList } from '@/components/user/UserList';

export const metadata: Metadata = {
  title: 'ユーザー管理 | Stats47',
  description: 'ユーザー管理画面',
};

export default async function UsersPage() {
  const session = await auth();

  // 認証チェック
  if (!session) {
    redirect('/login');
  }

  // 管理者権限チェック
  if (session.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ユーザー管理
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          システムに登録されているユーザーの管理
        </p>
      </div>

      <UserList />
    </div>
  );
}
```

---

### 8. ユーザーリストコンポーネント

`src/components/user/UserList.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { UserCard } from './UserCard';
import { Search } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, filter]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // 役割でフィルター
    if (filter !== 'all') {
      filtered = filtered.filter((user) => user.role === filter);
    }

    // 検索クエリでフィルター
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.username?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 検索とフィルター */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 検索ボックス */}
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="ユーザー名、メールアドレスで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* 役割フィルター */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            すべて ({users.length})
          </button>
          <button
            onClick={() => setFilter('admin')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'admin'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            管理者 ({users.filter((u) => u.role === 'admin').length})
          </button>
          <button
            onClick={() => setFilter('user')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            一般ユーザー ({users.filter((u) => u.role === 'user').length})
          </button>
        </div>
      </div>

      {/* ユーザーカードリスト */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            ユーザーが見つかりませんでした
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} onUpdate={fetchUsers} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 9. ユーザーカードコンポーネント

`src/components/user/UserCard.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Shield, User, Mail, Clock, MoreVertical } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

interface UserCardProps {
  user: User;
  onUpdate: () => void;
}

export function UserCard({ user, onUpdate }: UserCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'ログインなし';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const handleToggleActive = async () => {
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !user.is_active,
        }),
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
    setShowMenu(false);
  };

  const handleToggleRole = async () => {
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: user.role === 'admin' ? 'user' : 'admin',
        }),
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
    setShowMenu(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 relative">
      {/* メニューボタン */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <MoreVertical size={20} />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10">
            <button
              onClick={handleToggleActive}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              {user.is_active ? '無効化する' : '有効化する'}
            </button>
            <button
              onClick={handleToggleRole}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              {user.role === 'admin' ? 'ユーザーにする' : '管理者にする'}
            </button>
          </div>
        )}
      </div>

      {/* ユーザー情報 */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
            {user.role === 'admin' ? (
              <Shield className="text-white" size={24} />
            ) : (
              <User className="text-white" size={24} />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {user.name || user.username}
            </h3>
            {!user.is_active && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded">
                無効
              </span>
            )}
          </div>

          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Mail size={16} />
              <span className="truncate">{user.email}</span>
            </div>

            {user.username && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <User size={16} />
                <span>@{user.username}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock size={16} />
              <span>最終ログイン: {formatDate(user.last_login)}</span>
            </div>
          </div>

          {/* 役割バッジ */}
          <div className="mt-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.role === 'admin'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {user.role === 'admin' ? '管理者' : '一般ユーザー'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## API設計

### API エンドポイント一覧

#### 認証関連

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET/POST | `/api/auth/[...nextauth]` | Auth.js 認証エンドポイント | - |
| POST | `/api/auth/register` | 新規ユーザー登録 | - |
| POST | `/api/auth/verify-email` | メール認証 | - |
| POST | `/api/auth/forgot-password` | パスワードリセットリクエスト | - |
| POST | `/api/auth/reset-password` | パスワードリセット実行 | - |

#### ユーザー管理（管理者専用）

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/api/admin/users` | ユーザー一覧取得 | Admin |
| GET | `/api/admin/users/[id]` | ユーザー詳細取得 | Admin |
| PATCH | `/api/admin/users/[id]` | ユーザー情報更新 | Admin |
| DELETE | `/api/admin/users/[id]` | ユーザー削除 | Admin |

#### プロフィール管理

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/api/profile` | 自分のプロフィール取得 | User |
| PATCH | `/api/profile` | プロフィール更新 | User |
| POST | `/api/profile/change-password` | パスワード変更 | User |
| GET | `/api/profile/accounts` | 連携アカウント一覧 | User |
| DELETE | `/api/profile/accounts/[provider]` | アカウント連携解除 | User |

---

### 1. Auth.js 設定

`src/lib/auth/auth.ts`

```typescript
import NextAuth from 'next-auth';
import { D1Adapter } from '@auth/d1-adapter';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Line from 'next-auth/providers/line';
import bcrypt from 'bcryptjs';

// D1 データベースの型定義
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string;
      role: 'admin' | 'user';
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string;
    role: 'admin' | 'user';
  }
}

// Cloudflare Workers / Pages の環境変数から D1 を取得
function getD1Database() {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    // 開発環境では環境変数から取得
    return process.env.DB as unknown as D1Database;
  }

  // 本番環境では Cloudflare Workers の env から取得
  // @ts-ignore
  return globalThis.DB as D1Database;
}

export const authConfig: NextAuthConfig = {
  adapter: D1Adapter(getD1Database()),
  providers: [
    // Credentials Provider（メール + パスワード）
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const db = getD1Database();

        // ユーザーを検索
        const result = await db
          .prepare('SELECT * FROM users WHERE email = ?')
          .bind(credentials.email)
          .first();

        if (!result) {
          return null;
        }

        // パスワードを検証
        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          result.password_hash as string
        );

        if (!isValidPassword) {
          return null;
        }

        // アクティブユーザーのみ許可
        if (!result.is_active) {
          return null;
        }

        // 最終ログイン日時を更新
        await db
          .prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
          .bind(result.id)
          .run();

        return {
          id: result.id as string,
          name: result.name as string,
          email: result.email as string,
          username: result.username as string,
          role: result.role as 'admin' | 'user',
        };
      },
    }),

    // Google Provider
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // LINE Provider
    Line({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async session({ session, user }) {
      // セッションにユーザー情報を追加
      if (session.user) {
        session.user.id = user.id;
        session.user.username = user.username;
        session.user.role = user.role;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      // OAuth ログインの場合、ユーザー情報を更新
      if (account?.provider !== 'credentials') {
        const db = getD1Database();

        // 既存ユーザーがいればロールを維持、新規なら user ロールを設定
        const existingUser = await db
          .prepare('SELECT * FROM users WHERE email = ?')
          .bind(user.email)
          .first();

        if (existingUser) {
          // 既存ユーザーの最終ログインを更新
          await db
            .prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
            .bind(user.id)
            .run();
        } else {
          // 新規ユーザーにデフォルトロールを設定
          await db
            .prepare('UPDATE users SET role = ? WHERE id = ?')
            .bind('user', user.id)
            .run();
        }
      }

      return true;
    },
  },

  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
  },

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  debug: process.env.NODE_ENV === 'development',
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

---

### 2. 新規登録 API

`src/app/api/auth/register/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Cloudflare D1 データベースを取得
function getD1Database(): D1Database {
  // @ts-ignore
  return globalThis.DB as D1Database;
}

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    // バリデーション
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: '必須フィールドが入力されていません' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上である必要があります' },
        { status: 400 }
      );
    }

    const db = getD1Database();

    // メールアドレスの重複チェック
    const existingUser = await db
      .prepare('SELECT * FROM users WHERE email = ? OR username = ?')
      .bind(email, username)
      .first();

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスまたはユーザーネームは既に使用されています' },
        { status: 409 }
      );
    }

    // パスワードをハッシュ化
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // ユーザーを作成
    const userId = uuidv4();
    await db
      .prepare(`
        INSERT INTO users (
          id, name, email, username, password_hash, role, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(userId, username, email, username, password_hash, 'user', 1)
      .run();

    return NextResponse.json(
      {
        message: 'ユーザー登録が完了しました',
        user: {
          id: userId,
          username,
          email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '登録中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
```

---

### 3. ユーザー一覧取得 API（管理者専用）

`src/app/api/admin/users/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';

function getD1Database(): D1Database {
  // @ts-ignore
  return globalThis.DB as D1Database;
}

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者権限チェック
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const db = getD1Database();

    // ユーザー一覧を取得
    const result = await db
      .prepare(`
        SELECT
          id, name, email, username, role, is_active, last_login, created_at
        FROM users
        ORDER BY created_at DESC
      `)
      .all();

    return NextResponse.json({ users: result.results });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'ユーザー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
```

---

### 4. ユーザー更新 API（管理者専用）

`src/app/api/admin/users/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';

function getD1Database(): D1Database {
  // @ts-ignore
  return globalThis.DB as D1Database;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者権限チェック
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const { role, is_active } = await request.json();
    const db = getD1Database();

    // 更新するフィールドを構築
    const updates: string[] = [];
    const values: any[] = [];

    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: '更新するフィールドがありません' },
        { status: 400 }
      );
    }

    // updated_at を更新
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(params.id);

    // ユーザーを更新
    await db
      .prepare(`
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = ?
      `)
      .bind(...values)
      .run();

    return NextResponse.json({ message: 'ユーザーを更新しました' });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'ユーザーの更新に失敗しました' },
      { status: 500 }
    );
  }
}
```

---

## セキュリティ対策

### 1. パスワード管理

- **ハッシュ化**: bcryptjs を使用（salt rounds: 10）
- **強度チェック**: 8文字以上、大文字・小文字・数字・記号の組み合わせを推奨
- **パスワードリセット**: トークンベース、有効期限 1 時間

### 2. セッション管理

- **セッション保存先**: Cloudflare D1 データベース
- **セッションタイムアウト**: 30 日間
- **セッショントークン**: ランダム生成、httpOnly Cookie に保存

### 3. OAuth セキュリティ

- **CSRF 保護**: state パラメータを使用
- **トークン保存**: リフレッシュトークンは暗号化して保存
- **スコープ制限**: 必要最小限の権限のみ要求

### 4. API セキュリティ

- **認証**: すべての protected エンドポイントで認証チェック
- **認可**: 役割ベースのアクセス制御（RBAC）
- **レート制限**: DoS 攻撃対策（Cloudflare Workers KV で実装可能）
- **入力検証**: すべてのユーザー入力をバリデーション

### 5. Cookie セキュリティ

- **httpOnly**: JavaScript からアクセス不可
- **secure**: HTTPS のみ
- **sameSite**: CSRF 攻撃対策（lax または strict）

### 6. データベースセキュリティ

- **SQL インジェクション対策**: パラメータ化クエリを使用
- **パスワードハッシュ**: bcrypt で保存
- **機密情報**: トークンは暗号化して保存

---

## 実装手順

### フェーズ 1: 環境セットアップ（1日）

#### 1.1 必要なパッケージのインストール

```bash
npm install next-auth@beta @auth/d1-adapter bcryptjs uuid
npm install -D @types/bcryptjs @types/uuid
```

**確認：**
- `package.json` に依存関係が追加されていることを確認
- `bcryptjs` と `jose` が両方インストールされていることを確認

#### 1.2 環境変数の設定

`.env.local` を作成：

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here-minimum-32-characters

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# LINE OAuth
LINE_CLIENT_ID=your-line-channel-id
LINE_CLIENT_SECRET=your-line-channel-secret

# Cloudflare D1 (ローカル開発)
DB=stats47-db
```

**NEXTAUTH_SECRET の生成：**

```bash
openssl rand -base64 32
```

#### 1.3 Google OAuth 設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成
3. 「APIとサービス」→「認証情報」
4. 「OAuth 2.0 クライアント ID」を作成
5. 承認済みリダイレクト URI を設定：
   - 開発: `http://localhost:3000/api/auth/callback/google`
   - 本番: `https://yourdomain.com/api/auth/callback/google`
6. クライアント ID とシークレットを `.env.local` に設定

#### 1.4 LINE Login 設定

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. プロバイダーを作成
3. LINE Login チャネルを作成
4. コールバック URL を設定：
   - 開発: `http://localhost:3000/api/auth/callback/line`
   - 本番: `https://yourdomain.com/api/auth/callback/line`
5. Channel ID と Channel Secret を `.env.local` に設定
6. （オプション）メールアドレス取得権限を申請

---

### フェーズ 2: データベース移行（2日）

#### 2.1 マイグレーションスクリプトの作成

`database/migrations/001_auth_js_integration.sql` を作成（上記参照）

#### 2.2 パスワードハッシュ生成スクリプトの作成

`scripts/generate-password-hash.ts` を作成：

```typescript
import bcrypt from 'bcryptjs';

async function generateHash(password: string) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}\n`);
}

async function main() {
  console.log('Generating password hashes...\n');
  await generateHash('admin123');
  await generateHash('user123');
}

main();
```

実行：

```bash
npx tsx scripts/generate-password-hash.ts
```

#### 2.3 サンプルデータの準備

`database/seeds/users_seed.sql` を作成し、生成したハッシュを使用

#### 2.4 マイグレーション実行

```bash
# ローカルD1にマイグレーション実行
npx wrangler d1 execute stats47-db --local --file=./database/migrations/001_auth_js_integration.sql

# サンプルユーザーの作成
npx wrangler d1 execute stats47-db --local --file=./database/seeds/users_seed.sql

# マイグレーション確認
npx wrangler d1 execute stats47-db --local --command="SELECT * FROM users"
```

#### 2.5 本番環境へのマイグレーション

```bash
# 本番D1にマイグレーション実行（慎重に！）
npx wrangler d1 execute stats47-db --file=./database/migrations/001_auth_js_integration.sql

# サンプルユーザーの作成
npx wrangler d1 execute stats47-db --file=./database/seeds/users_seed.sql
```

---

### フェーズ 3: Auth.js 設定（2日）

#### 3.1 Auth.js 設定ファイルの作成

`src/lib/auth/auth.ts` を作成（上記参照）

#### 3.2 Auth.js API Route の作成

`src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from '@/lib/auth/auth';

export const { GET, POST } = handlers;

export const runtime = 'edge'; // Cloudflare Workers/Pages で動作させる
```

#### 3.3 Middleware の作成

`src/middleware.ts`

```typescript
import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 認証が必要なパス
  const protectedPaths = ['/profile', '/admin'];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // 管理者専用パス
  const adminPaths = ['/admin'];
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

  // 未認証ユーザーを保護されたパスから除外
  if (isProtectedPath && !req.auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 非管理者を管理者専用パスから除外
  if (isAdminPath && req.auth?.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
```

#### 3.4 Auth.js の動作確認

```bash
npm run dev
```

ブラウザで確認：
- `http://localhost:3000/api/auth/signin` にアクセス
- デフォルトのログイン画面が表示されることを確認

---

### フェーズ 4: フロントエンド実装（3〜4日）

#### 4.1 認証コンポーネントの作成

以下のコンポーネントを作成：
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/OAuthButtons.tsx`
- `src/components/auth/PasswordInput.tsx`

#### 4.2 認証ページの作成

以下のページを作成：
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`

#### 4.3 Auth Context の作成（オプション）

`src/contexts/AuthContext.tsx`

```typescript
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface AuthContextType {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: 'admin' | 'user';
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const value: AuthContextType = {
    user: session?.user || null,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

#### 4.4 ヘッダーコンポーネントの更新

`src/components/layout/Header.tsx`

```typescript
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { User, LogOut, Settings, Shield } from 'lucide-react';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ */}
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Stats47
          </Link>

          {/* ナビゲーション */}
          <nav className="flex items-center gap-6">
            {session ? (
              <>
                <span className="text-gray-700 dark:text-gray-300">
                  {session.user.name}
                </span>

                {session.user.role === 'admin' && (
                  <Link
                    href="/admin/users"
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600"
                  >
                    <Shield size={20} />
                    管理画面
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600"
                >
                  <User size={20} />
                  プロフィール
                </Link>

                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-red-600"
                >
                  <LogOut size={20} />
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600"
                >
                  ログイン
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  新規登録
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
```

#### 4.5 動作確認

```bash
npm run dev
```

以下を確認：
- ログインページが表示される
- 新規登録ページが表示される
- メール + パスワードでログインできる
- Google OAuth でログインできる
- LINE Login でログインできる（設定済みの場合）
- ヘッダーにユーザー情報が表示される
- ログアウトできる

---

### フェーズ 5: ユーザー管理機能実装（2〜3日）

#### 5.1 API の作成

以下の API を作成：
- `src/app/api/auth/register/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/route.ts`

#### 5.2 ユーザー管理コンポーネントの作成

以下のコンポーネントを作成：
- `src/components/user/UserList.tsx`
- `src/components/user/UserCard.tsx`

#### 5.3 ユーザー管理ページの作成

- `src/app/(protected)/admin/users/page.tsx`

#### 5.4 動作確認

```bash
npm run dev
```

以下を確認：
- 管理者でログインして `/admin/users` にアクセスできる
- ユーザー一覧が表示される
- ユーザーの有効化/無効化ができる
- ユーザーの役割を変更できる
- 一般ユーザーは管理画面にアクセスできない

---

### フェーズ 6: プロフィール編集機能実装（2日）

#### 6.1 プロフィールページの作成

`src/app/(protected)/profile/page.tsx`

```typescript
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プロフィール | Stats47',
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">プロフィール</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">名前</label>
            <p className="text-lg">{session.user.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">
              メールアドレス
            </label>
            <p className="text-lg">{session.user.email}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">役割</label>
            <p className="text-lg">
              {session.user.role === 'admin' ? '管理者' : '一般ユーザー'}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <a
            href="/profile/edit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            プロフィールを編集
          </a>
        </div>
      </div>
    </div>
  );
}
```

#### 6.2 プロフィール編集ページの作成

`src/app/(protected)/profile/edit/page.tsx`

**注意：** 実装の詳細は省略。フォームコンポーネントと更新 API を作成する。

---

### フェーズ 7: テストとデバッグ（2〜3日）

#### 7.1 手動テスト

- すべての認証フローをテスト
- エラーハンドリングをテスト
- レスポンシブデザインをテスト

#### 7.2 セキュリティチェック

- パスワードがハッシュ化されているか確認
- Cookie が httpOnly, secure に設定されているか確認
- SQL インジェクション対策が実装されているか確認

#### 7.3 パフォーマンステスト

- ページロード時間を測定
- データベースクエリを最適化

---

### フェーズ 8: デプロイ（1日）

#### 8.1 本番環境変数の設定

Cloudflare Pages/Workers のダッシュボードで環境変数を設定：

```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
LINE_CLIENT_ID=your-line-channel-id
LINE_CLIENT_SECRET=your-line-channel-secret
```

#### 8.2 本番データベースのマイグレーション

```bash
# 本番D1にマイグレーション実行
npx wrangler d1 execute stats47-db --file=./database/migrations/001_auth_js_integration.sql

# 管理者ユーザーの作成
npx wrangler d1 execute stats47-db --file=./database/seeds/users_seed.sql
```

#### 8.3 デプロイ

```bash
npm run build
npm run worker:deploy
```

#### 8.4 本番環境での動作確認

- ログイン機能
- 新規登録機能
- OAuth ログイン（Google, LINE）
- ユーザー管理機能
- プロフィール編集機能

---

## テスト戦略

### 単体テスト

- **パスワードハッシュ関数**: bcrypt の動作確認
- **バリデーション関数**: メール、パスワード強度チェック
- **JWT 署名/検証**: jose ライブラリの動作確認

### 統合テスト

- **認証フロー**: ログイン → セッション作成 → 保護されたページアクセス
- **OAuth フロー**: OAuth プロバイダー認証 → コールバック → ユーザー作成
- **ユーザー管理**: ユーザー作成 → 更新 → 無効化

### E2E テスト（オプション）

- Playwright を使用してブラウザテストを実装
- ログイン、新規登録、ユーザー管理の一連のフローをテスト

---

## トラブルシューティング

### よくある問題

#### 1. "Invalid Credentials" エラー

**原因：** パスワードハッシュが一致しない

**解決策：**
- `scripts/generate-password-hash.ts` でハッシュを再生成
- データベースのハッシュを確認

#### 2. OAuth ログインが失敗する

**原因：** コールバック URL が一致しない

**解決策：**
- Google Cloud Console / LINE Developers Console でコールバック URL を確認
- 完全一致している必要がある（末尾のスラッシュにも注意）

#### 3. セッションが保存されない

**原因：** D1 アダプターの設定ミス

**解決策：**
- `auth.ts` の `D1Adapter(getD1Database())` が正しく設定されているか確認
- データベースマイグレーションが実行されているか確認

#### 4. Middleware でリダイレクトループ

**原因：** ログインページも保護されている

**解決策：**
- `middleware.ts` の `matcher` で `/login` を除外

#### 5. Cloudflare Workers でエラー

**原因：** Node.js API が使用できない

**解決策：**
- `runtime = 'edge'` を設定
- Node.js 専用の API（`fs`, `crypto` など）は使用しない
- `jose` を使用（`jsonwebtoken` の代わり）

---

## まとめ

この実装ガイドに従うことで、Stats47 プロジェクトに包括的な認証システムを実装できます。

### 主な機能

✅ **通常ログイン**（メール + パスワード）
✅ **OAuth ログイン**（Google, LINE）
✅ **新規登録**
✅ **ユーザー管理**（管理者専用）
✅ **プロフィール編集**
✅ **役割ベースのアクセス制御**（RBAC）
✅ **セキュリティ対策**（bcrypt, httpOnly Cookie, CSRF 保護）

### 技術スタック

- Next.js 15 + App Router
- Auth.js (NextAuth.js v5)
- Cloudflare D1 (SQLite)
- bcryptjs + jose
- Google OAuth + LINE Login

### 実装期間

- **合計**: 約 2〜3 週間
  - フェーズ 1: 環境セットアップ（1日）
  - フェーズ 2: データベース移行（2日）
  - フェーズ 3: Auth.js 設定（2日）
  - フェーズ 4: フロントエンド実装（3〜4日）
  - フェーズ 5: ユーザー管理機能（2〜3日）
  - フェーズ 6: プロフィール編集機能（2日）
  - フェーズ 7: テストとデバッグ（2〜3日）
  - フェーズ 8: デプロイ（1日）

### 次のステップ

1. 環境セットアップを開始
2. Google OAuth と LINE Login の設定を完了
3. データベースマイグレーションを実行
4. Auth.js 設定を完了
5. フロントエンドコンポーネントを実装
6. テストとデバッグ
7. 本番環境にデプロイ

質問や問題が発生した場合は、このドキュメントのトラブルシューティングセクションを参照してください。
