# 開発用アカウントのセットアップ手順書

**作成日:** 2025-10-12
**目的:** ログインページから開発用アカウント情報の表示を削除し、新しい開発用アカウントをD1データベースに登録する

---

## 概要

### 実施内容

1. ログインページから開発用アカウント情報の表示を削除
2. 新しい開発用アカウントをD1データベースに登録
   - **メール:** uruhayato373@gmail.com
   - **パスワード:** daisuke1275
   - **ロール:** admin

### セキュリティ上の理由

ログインページに開発用アカウントの認証情報を表示することは、以下のセキュリティリスクがあります：

- ❌ 誰でもアクセスできるページに認証情報が露出
- ❌ 本番環境に誤ってデプロイされる可能性
- ❌ ソースコードに認証情報が含まれる

この手順書に従って、これらのリスクを排除します。

---

## 前提条件

以下のツールとアクセス権限が必要です：

- [x] Node.js と npm がインストールされている
- [x] Cloudflare Wrangler CLI がインストールされている
- [x] プロジェクトのローカル開発環境が動作している
- [x] D1データベースへのアクセス権限

---

## 手順

### ステップ1: ログインページから開発用アカウント表示を削除

#### 1-1. 現在のログインページを確認

**ファイル:** `src/app/login/page.tsx`

**現在のコード（32-35行目）:**
```tsx
<div className="text-center text-sm text-gray-600 dark:text-gray-400">
  <p>開発用アカウント:</p>
  <p>メール: admin@stats47.local / パスワード: admin123</p>
</div>
```

この部分を削除します。

#### 1-2. ファイルを編集

以下のコマンドでファイルを開きます：

```bash
# お好みのエディタで開く
code src/app/login/page.tsx
# または
vim src/app/login/page.tsx
```

#### 1-3. 32-35行目を削除

**修正前:**
```tsx
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
            ログイン
          </h2>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
            Stats47 管理画面
          </p>
        </div>

        <LoginForm />

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>アカウントをお持ちでないですか？</p>
          <Link
            href="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            新規登録
          </Link>
        </div>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>開発用アカウント:</p>
          <p>メール: admin@stats47.local / パスワード: admin123</p>
        </div>
      </div>
    </div>
  );
}
```

**修正後:**
```tsx
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
            ログイン
          </h2>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
            Stats47 管理画面
          </p>
        </div>

        <LoginForm />

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>アカウントをお持ちでないですか？</p>
          <Link
            href="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            新規登録
          </Link>
        </div>
      </div>
    </div>
  );
}
```

**変更点:**
- 32-35行目の開発用アカウント表示を削除
- それ以外はそのまま

#### 1-4. 変更を保存

ファイルを保存します（エディタによる）：
- VS Code: `Cmd+S` (Mac) / `Ctrl+S` (Windows)
- Vim: `:wq`

#### 1-5. 変更を確認

```bash
# git diff で変更内容を確認
git diff src/app/login/page.tsx
```

期待される出力：
```diff
-        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
-          <p>開発用アカウント:</p>
-          <p>メール: admin@stats47.local / パスワード: admin123</p>
-        </div>
```

#### 1-6. 開発サーバーで確認

```bash
# 開発サーバーが起動していない場合
npm run dev

# ブラウザで http://localhost:3000/login にアクセス
# 開発用アカウント情報が表示されないことを確認
```

**✅ 期待される結果:**
- ログインフォームが表示される
- 「アカウントをお持ちでないですか？」が表示される
- 「開発用アカウント:」の表示が**ない**

---

### ステップ2: パスワードのハッシュ化

新しいアカウントをデータベースに登録する前に、パスワードをbcryptでハッシュ化する必要があります。

#### 2-1. パスワードハッシュ化スクリプトの作成

**ファイル:** `scripts/hash-password.js` を作成

```bash
# scriptsディレクトリを作成（存在しない場合）
mkdir -p scripts

# スクリプトファイルを作成
touch scripts/hash-password.js
```

**ファイルの内容:**

```javascript
// scripts/hash-password.js
const bcrypt = require('bcryptjs');

// ハッシュ化するパスワード
const password = process.argv[2] || 'daisuke1275';

// saltRounds（セキュリティレベル）
const saltRounds = 10;

// パスワードをハッシュ化
bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }

  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nCopy this hash for the SQL INSERT command:');
  console.log(hash);
});
```

#### 2-2. スクリプトを実行

```bash
# パスワード "daisuke1275" をハッシュ化
node scripts/hash-password.js daisuke1275
```

**出力例:**
```
Password: daisuke1275
Hash: $2a$10$XvZ9Q2K5L8Y7P3N6M4R1S.O0W8T6U4V2X0Y8Z6A4B2C0D8E6F4G2H0

Copy this hash for the SQL INSERT command:
$2a$10$XvZ9Q2K5L8Y7P3N6M4R1S.O0W8T6U4V2X0Y8Z6A4B2C0D8E6F4G2H0
```

**⚠️ 重要:**
- 出力されたハッシュ値をコピーしてください
- ハッシュ値は実行するたびに異なります（これは正常な動作です）
- このハッシュ値を次のステップで使用します

#### 2-3. ハッシュ値の保存（オプション）

後で参照するために、ハッシュ値を安全な場所に保存しておくことを推奨します。

```bash
# 例: プライベートなメモアプリや1Passwordなどのパスワード管理ツール
# 以下の情報をセットで保存：
# - メール: uruhayato373@gmail.com
# - 平文パスワード: daisuke1275
# - ハッシュ: $2a$10$...
```

---

### ステップ3: D1データベースにアカウントを登録

#### 3-1. 現在のユーザーを確認

```bash
npx wrangler d1 execute stats47 --local --command \
  "SELECT id, email, username, role FROM users;"
```

**現在のユーザー:**
```
id: 00000000-0000-0000-0000-000000000001
email: admin@stats47.local
username: admin
role: admin

id: 00000000-0000-0000-0000-000000000002
email: user@stats47.local
username: testuser
role: user
```

#### 3-2. 新しいユーザーのUUIDを生成

新しいユーザーのIDを生成します。以下の方法のいずれかを使用：

**方法A: Node.jsで生成（推奨）**

```bash
node -e "console.log(require('crypto').randomUUID())"
```

**方法B: オンラインツールを使用**

https://www.uuidgenerator.net/ にアクセスしてUUIDを生成

**例: 生成されたUUID**
```
12345678-1234-5678-1234-567812345678
```

このUUIDをメモしておきます。

#### 3-3. ユーザー登録SQLの準備

以下のSQLコマンドを準備します。**プレースホルダー**を実際の値に置き換えてください。

**SQLテンプレート:**
```sql
INSERT INTO users (
  id,
  name,
  email,
  username,
  password_hash,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  '{YOUR_UUID}',                    -- ステップ3-2で生成したUUID
  'Daisuke Uruhayato',              -- 表示名（任意）
  'uruhayato373@gmail.com',         -- メールアドレス
  'uruhayato',                      -- ユーザー名（任意）
  '{YOUR_PASSWORD_HASH}',           -- ステップ2-2で生成したハッシュ
  'admin',                          -- ロール
  1,                                -- アクティブ
  CURRENT_TIMESTAMP,                -- 作成日時
  CURRENT_TIMESTAMP                 -- 更新日時
);
```

**実際のSQL例（値を置き換えてください）:**
```sql
INSERT INTO users (
  id,
  name,
  email,
  username,
  password_hash,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  '12345678-1234-5678-1234-567812345678',
  'Daisuke Uruhayato',
  'uruhayato373@gmail.com',
  'uruhayato',
  '$2a$10$XvZ9Q2K5L8Y7P3N6M4R1S.O0W8T6U4V2X0Y8Z6A4B2C0D8E6F4G2H0',
  'admin',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

#### 3-4. ローカルD1データベースにユーザーを登録

**⚠️ 重要:** SQLコマンドの改行を削除し、1行にまとめる必要があります。

```bash
npx wrangler d1 execute stats47 --local --command "INSERT INTO users (id, name, email, username, password_hash, role, is_active, created_at, updated_at) VALUES ('12345678-1234-5678-1234-567812345678', 'Daisuke Uruhayato', 'uruhayato373@gmail.com', 'uruhayato', '\$2a\$10\$XvZ9Q2K5L8Y7P3N6M4R1S.O0W8T6U4V2X0Y8Z6A4B2C0D8E6F4G2H0', 'admin', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"
```

**注意: `$`のエスケープ**
- Bashでは`$`は特殊文字なので、`\$`にエスケープする必要があります
- ハッシュ内の各`$`を`\$`に置き換えてください

**成功時の出力:**
```
🌀 Executing on local database stats47 (e6533698-d05a-475b-9f39-5558703feef7) from .wrangler/state/v3/d1:
🚣 1 command executed successfully.
```

#### 3-5. ユーザーが正しく登録されたか確認

```bash
npx wrangler d1 execute stats47 --local --command \
  "SELECT id, email, username, role, is_active FROM users WHERE email = 'uruhayato373@gmail.com';"
```

**期待される出力:**
```json
{
  "id": "12345678-1234-5678-1234-567812345678",
  "email": "uruhayato373@gmail.com",
  "username": "uruhayato",
  "role": "admin",
  "is_active": 1
}
```

**✅ 確認項目:**
- [x] IDが正しい
- [x] メールアドレスが `uruhayato373@gmail.com`
- [x] roleが `admin`
- [x] is_activeが `1`

---

### ステップ4: 本番（リモート）D1データベースへの登録（オプション）

ローカル環境でテストが完了したら、本番データベースにも同じユーザーを登録します。

#### 4-1. 本番データベースの現在のユーザーを確認

```bash
npx wrangler d1 execute stats47 --remote --command \
  "SELECT id, email, username, role FROM users;"
```

#### 4-2. 本番データベースにユーザーを登録

**⚠️ 注意:** ステップ3-4と同じSQLコマンドを使用しますが、`--local`を`--remote`に変更します。

```bash
npx wrangler d1 execute stats47 --remote --command "INSERT INTO users (id, name, email, username, password_hash, role, is_active, created_at, updated_at) VALUES ('12345678-1234-5678-1234-567812345678', 'Daisuke Uruhayato', 'uruhayato373@gmail.com', 'uruhayato', '\$2a\$10\$XvZ9Q2K5L8Y7P3N6M4R1S.O0W8T6U4V2X0Y8Z6A4B2C0D8E6F4G2H0', 'admin', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"
```

#### 4-3. 本番データベースで確認

```bash
npx wrangler d1 execute stats47 --remote --command \
  "SELECT id, email, username, role FROM users WHERE email = 'uruhayato373@gmail.com';"
```

---

### ステップ5: ログインテスト

#### 5-1. ローカル環境でログインテスト

1. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

2. **ログインページにアクセス**
   ```
   http://localhost:3000/login
   ```

3. **新しいアカウントでログイン**
   - メールアドレス: `uruhayato373@gmail.com`
   - パスワード: `daisuke1275`

4. **ログインボタンをクリック**

**✅ 期待される結果:**
- ログインに成功する
- ホームページ（`/`）にリダイレクトされる
- ブラウザの開発者ツール（F12）のConsoleに以下のログが表示される：
  ```
  🔐 Middleware: {
    pathname: '/',
    isLoggedIn: true,
    isAdmin: true,
    username: 'uruhayato',
    role: 'admin'
  }
  ```

#### 5-2. 管理者権限の確認

1. **ランキングページにアクセス**
   ```
   http://localhost:3000/landweather/land-area/ranking/total-area-excluding
   ```

2. **管理者モードバッジを確認**
   - 「管理者モード: ランキング項目の編集・追加・削除が可能です」というバッジが表示される

3. **編集可能なナビゲーションを確認**
   - 右側のナビゲーションに「編集」ボタンが表示される
   - 「編集」をクリックすると、ランキング項目の並び替え・編集・削除が可能になる

**✅ 期待される結果:**
- 管理者モードバッジが表示される
- RankingNavigationEditableが表示される
- ブラウザのConsoleに以下のログが表示される：
  ```
  🔍 RankingClient Auth: {
    isAdmin: true,
    role: 'admin',
    isAuthenticated: true,
    username: 'uruhayato'
  }
  ```

#### 5-3. ログアウトテスト

1. **ヘッダーのログアウトボタンをクリック**

2. **ログインページにリダイレクトされることを確認**

3. **再度ログイン**
   - 同じ認証情報でログインできることを確認

---

### ステップ6: 古い開発用アカウントの削除（オプション）

新しいアカウントが正常に動作することを確認したら、古い開発用アカウントを削除できます。

#### 6-1. 古いアカウントの確認

```bash
npx wrangler d1 execute stats47 --local --command \
  "SELECT id, email, username FROM users WHERE email = 'admin@stats47.local';"
```

#### 6-2. 古いアカウントの削除

**⚠️ 警告:** この操作は元に戻せません。必ず新しいアカウントでログインできることを確認してから実行してください。

```bash
npx wrangler d1 execute stats47 --local --command \
  "DELETE FROM users WHERE email = 'admin@stats47.local';"
```

#### 6-3. 削除の確認

```bash
npx wrangler d1 execute stats47 --local --command \
  "SELECT id, email, username FROM users;"
```

**期待される結果:**
- `admin@stats47.local` が存在しない
- `uruhayato373@gmail.com` が存在する
- `user@stats47.local` (testuser) が存在する（削除していない場合）

#### 6-4. 本番環境でも同様に削除（必要な場合）

```bash
npx wrangler d1 execute stats47 --remote --command \
  "DELETE FROM users WHERE email = 'admin@stats47.local';"
```

---

### ステップ7: 変更をコミット

#### 7-1. 変更内容を確認

```bash
# 変更されたファイルを確認
git status

# 変更内容を確認
git diff src/app/login/page.tsx
```

#### 7-2. 変更をステージング

```bash
# ログインページの変更をステージング
git add src/app/login/page.tsx

# スクリプトファイルもステージング（作成した場合）
git add scripts/hash-password.js
```

#### 7-3. コミット

```bash
git commit -m "Remove dev account display from login page

- Remove development account credentials from login UI
- Security improvement: prevent credential exposure
- New admin account registered in D1 database
"
```

#### 7-4. リモートにプッシュ（オプション）

```bash
git push origin feature/fetch
# または
git push
```

---

## トラブルシューティング

### 問題1: パスワードハッシュ化スクリプトが動作しない

**エラー:**
```
Error: Cannot find module 'bcryptjs'
```

**解決策:**
```bash
# bcryptjsをインストール
npm install bcryptjs
```

### 問題2: D1コマンドでエラーが発生

**エラー:**
```
Error: Couldn't find a D1 DB with the name or binding 'stats47'
```

**解決策:**
```bash
# wrangler.tomlでデータベース名を確認
cat wrangler.toml | grep database_name

# 正しいデータベース名を使用
npx wrangler d1 execute <正しいデータベース名> --local --command "..."
```

### 問題3: ログインできない

**症状:** 「メールアドレスまたはパスワードが正しくありません」エラー

**確認項目:**

1. **ユーザーが正しく登録されているか確認**
   ```bash
   npx wrangler d1 execute stats47 --local --command \
     "SELECT email, username, role, is_active FROM users WHERE email = 'uruhayato373@gmail.com';"
   ```

2. **is_activeが1であることを確認**

3. **パスワードハッシュが正しく保存されているか確認**
   ```bash
   npx wrangler d1 execute stats47 --local --command \
     "SELECT password_hash FROM users WHERE email = 'uruhayato373@gmail.com';"
   ```
   - ハッシュが`$2a$10$`で始まっていることを確認

4. **ログインフォームで正しいメールアドレスとパスワードを入力しているか確認**
   - メール: `uruhayato373@gmail.com`
   - パスワード: `daisuke1275`（ハッシュではなく平文）

5. **ブラウザのConsoleでエラーを確認**
   - F12を押して開発者ツールを開く
   - Consoleタブでエラーメッセージを確認

### 問題4: 管理者モードが表示されない

**症状:** ログインできるが、ランキングページで管理者モードが表示されない

**確認項目:**

1. **roleが"admin"であることを確認**
   ```bash
   npx wrangler d1 execute stats47 --local --command \
     "SELECT role FROM users WHERE email = 'uruhayato373@gmail.com';"
   ```

2. **ブラウザのConsoleでログを確認**
   ```javascript
   🔍 RankingClient Auth: {
     isAdmin: false,  // ← これがfalseの場合、roleが正しく設定されていない
     role: 'user',    // ← 'admin'であるべき
     ...
   }
   ```

3. **roleを修正**
   ```bash
   npx wrangler d1 execute stats47 --local --command \
     "UPDATE users SET role = 'admin' WHERE email = 'uruhayato373@gmail.com';"
   ```

4. **ログアウトして再ログイン**

### 問題5: `$`のエスケープエラー

**エラー:**
```
bash: $10: bad substitution
```

**原因:** ハッシュ内の`$`がBashで解釈されている

**解決策:**
- SQLコマンド全体をシングルクォート（`'`）で囲む
- または、各`$`を`\$`にエスケープする

```bash
# 良い例（シングルクォート）
npx wrangler d1 execute stats47 --local --command 'INSERT INTO users ... VALUES (..., "$2a$10$abc...", ...);'

# 良い例（エスケープ）
npx wrangler d1 execute stats47 --local --command "... '\$2a\$10\$abc...' ..."
```

---

## セキュリティチェックリスト

作業完了後、以下のセキュリティ項目を確認してください：

- [ ] ログインページに認証情報が表示されていない
- [ ] パスワードがハッシュ化されてデータベースに保存されている
- [ ] 平文パスワードがソースコードに含まれていない
- [ ] 平文パスワードがgit履歴に含まれていない
- [ ] `.env.local`にも認証情報が含まれていない（NHfEH8z2VSz... のようなシークレットキーのみ）
- [ ] 新しいアカウントでログインできる
- [ ] 管理者権限が正しく機能している
- [ ] 古い開発用アカウントが削除されている（オプション）

---

## 参考情報

### データベーススキーマ

**usersテーブル:**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- UUID
  name TEXT,                              -- 表示名
  email TEXT UNIQUE NOT NULL,             -- メールアドレス（ログインID）
  emailVerified DATETIME,                 -- メール認証日時
  image TEXT,                             -- プロフィール画像URL
  username TEXT UNIQUE,                   -- ユーザー名
  password_hash TEXT,                     -- ハッシュ化されたパスワード
  role TEXT DEFAULT 'user',               -- ロール（'admin' or 'user'）
  is_active BOOLEAN DEFAULT 1,            -- アクティブフラグ
  last_login DATETIME,                    -- 最終ログイン日時
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 作成日時
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- 更新日時
);
```

### bcryptについて

- **saltRounds:** 10（推奨値）
- **ハッシュ形式:** `$2a$10$...`
- **検証:** `bcrypt.compare(plainPassword, hash)`
- **セキュリティ:** saltRoundsが高いほど安全だが、処理時間も長くなる

### ロールと権限

| ロール | 権限 |
|--------|------|
| `admin` | すべての機能にアクセス可能<br>- ランキング項目の編集・追加・削除<br>- ユーザー管理<br>- システム設定 |
| `user` | 閲覧のみ<br>- ランキング表示<br>- プロフィール編集 |

---

## 完了確認

以下のすべての項目が完了していることを確認してください：

### ステップ1: UI修正
- [ ] ログインページから開発用アカウント表示を削除
- [ ] http://localhost:3000/login で表示が消えていることを確認

### ステップ2: パスワードハッシュ化
- [ ] パスワードハッシュ化スクリプトを作成
- [ ] パスワード `daisuke1275` をハッシュ化
- [ ] ハッシュ値をコピー

### ステップ3: データベース登録
- [ ] UUIDを生成
- [ ] ローカルD1にユーザーを登録
- [ ] 登録を確認（SELECTクエリ）

### ステップ4: 本番環境（オプション）
- [ ] 本番D1にユーザーを登録
- [ ] 登録を確認

### ステップ5: ログインテスト
- [ ] 新しいアカウントでログイン成功
- [ ] 管理者モードバッジが表示される
- [ ] RankingNavigationEditableが表示される
- [ ] ログアウト・再ログインが可能

### ステップ6: クリーンアップ（オプション）
- [ ] 古い開発用アカウントを削除
- [ ] 削除を確認

### ステップ7: コミット
- [ ] 変更をgit commit
- [ ] リモートにpush（オプション）

---

## まとめ

この手順書に従うことで、以下が達成されます：

✅ **セキュリティ向上**
- ログインページに認証情報が露出しない
- パスワードが安全にハッシュ化される

✅ **実用的な開発環境**
- 実際のメールアドレスで開発用アカウントを使用
- 管理者権限の完全な機能テストが可能

✅ **本番環境への準備**
- 本番環境でも同じ手順で安全にアカウントを管理できる

---

**作成日:** 2025-10-12
**バージョン:** 1.0
**次回レビュー:** 本番デプロイ前
