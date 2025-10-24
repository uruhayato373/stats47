# 認証モックデータ

このディレクトリには認証機能のテスト用モックデータが含まれています。

## ファイル構成

### users.json

ユーザー情報のモックデータ

- **管理者ユーザー**: admin@example.com (role: admin)
- **一般ユーザー**: user1@example.com, test@example.com (role: user)
- **無効ユーザー**: disabled@example.com (is_active: false)

### sessions.json

セッション情報のモックデータ

- アクティブなセッション情報
- トークンと有効期限

## 使用方法

```typescript
// ユーザーデータの読み込み
import usersData from "@/data/mock/auth/users.json";

// セッションデータの読み込み
import sessionsData from "@/data/mock/auth/sessions.json";
```

## 注意事項

- このデータは開発・テスト環境でのみ使用
- 本番環境では実際のデータベースを使用
- パスワードハッシュは含まれていない（認証テスト用）
