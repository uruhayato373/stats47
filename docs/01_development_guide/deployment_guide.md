---
title: 開発者ガイド
created: 2025-08-28
updated: 2025-10-16
tags:
  - 開発環境
  - 環境変数
---

# 開発者ガイド

## 概要

このガイドは、地域統計ダッシュボードプロジェクトに参加する開発者向けの包括的なドキュメントです。開発環境のセットアップから、コーディング規約、デバッグ方法まで、開発に必要な情報を提供します。

## 目次

1. [開発環境のセットアップ](#開発環境のセットアップ)
2. [プロジェクト構造](#プロジェクト構造)
3. [コーディング規約](#コーディング規約)
4. [開発ワークフロー](#開発ワークフロー)
5. [データベース開発](#データベース開発)
6. [テスト・デバッグ](#テストデバッグ)
7. [パフォーマンス最適化](#パフォーマンス最適化)
8. [デプロイ](#デプロイ)
9. [トラブルシューティング](#トラブルシューティング)
10. [関連ドキュメント](#関連ドキュメント)

## 開発環境のセットアップ

### 前提条件

- **Node.js**: 18.x 以上
- **npm**: 9.x 以上
- **Git**: 最新版
- **エディタ**: VS Code 推奨（設定ファイル付き）

### 1. リポジトリのクローン

```bash
git clone https://github.com/uruhayato373/stats47.git
cd stats47
```

### 2. 依存関係のインストール

```bash
npm install

```

### 3. 環境変数の設定

```bash
# .env.localファイルを作成
cp .env.example .env.local

# 必要な環境変数を設定
echo "NEXT_PUBLIC_ESTAT_APP_ID=your-actual-app-id" >> .env.local
echo "JWT_SECRET=your-super-secret-jwt-key-here" >> .env.local
```

### 4. データベースのセットアップ

```bash
# データベース管理スクリプトに実行権限を付与
chmod +x database/manage.sh

# ローカル環境にスキーマを適用
./database/manage.sh schema

# または、手動でスキーマを適用
npx wrangler d1 execute stats47 --local --file=./database/schemas/main.sql
```

### 5. 開発サーバーの起動

```bash
# API接続ありの開発環境
npm run dev:api

# または、モックデータを使用した開発環境
npm run dev:mock
```

ブラウザで `http://localhost:3000` にアクセスして動作確認。

### 6. VS Code 設定（推奨）

プロジェクトには`.vscode/settings.json`が含まれており、以下の設定が自動で適用されます：

- TypeScript の自動インポート
- Prettier の自動フォーマット
- ESLint の自動修正
- Tailwind CSS の IntelliSense

## プロジェクト構造

```
stats47/
├── doc/                    # ドキュメント
│   ├── README.md
│   ├── architecture.md     # システムアーキテクチャ
│   ├── api-design.md       # API設計仕様
│   ├── component-design.md # コンポーネント設計
│   ├── development-guide.md # 開発者ガイド
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/         # Reactコンポーネント
│   ├── types/              # TypeScript型定義
│   ├── lib/                # ユーティリティ関数
│   └── contexts/           # React Context
├── data/                   # データファイル
└── public/                 # 静的ファイル
```

## コーディング規約

### TypeScript

#### 型定義

- 明示的な型注釈を使用
- インターフェースは`I`プレフィックスなし
- 型エイリアスは適切に使用

```typescript
// 良い例
interface User {
  id: number;
  name: string;
  email: string;
}

type UserStatus = "active" | "inactive" | "pending";

// 悪い例
interface IUser {
  id: any;
  name: string;
  email: string;
}
```

#### 関数定義

- アロー関数を使用
- 戻り値の型を明示
- パラメータの型を明示

```typescript
// 良い例
const getUserById = async (id: number): Promise<User | null> => {
  try {
    const response = await fetch(`/api/users/${id}`);
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error("ユーザー取得エラー:", error);
    return null;
  }
};

// 悪い例
function getUserById(id) {
  return fetch(`/api/users/${id}`)
    .then((response) => response.json())
    .catch((error) => console.error(error));
}
```

### React

#### コンポーネント定義

- 関数コンポーネントを使用
- Props の型を明示
- 適切なメモ化を使用

```typescript
// 良い例
interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
}

export const UserCard: React.FC<UserCardProps> = React.memo(
  ({ user, onEdit, onDelete }) => {
    const handleEdit = useCallback(() => {
      onEdit(user);
    }, [user, onEdit]);

    const handleDelete = useCallback(() => {
      onDelete(user.id);
    }, [user.id, onDelete]);

    return (
      <div className="user-card">
        <h3>{user.name}</h3>
        <p>{user.email}</p>
        <div className="actions">
          <button onClick={handleEdit}>編集</button>
          <button onClick={handleDelete}>削除</button>
        </div>
      </div>
    );
  }
);

UserCard.displayName = "UserCard";
```

#### Hooks

- カスタムフックを作成してロジックを分離
- 依存配列を適切に設定
- 無限ループを防ぐ

```typescript
// 良い例
const useUser = (userId: number) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await getUserById(userId);
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "不明なエラー");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  return { user, loading, error };
};

// 悪い例
const useUser = (userId: number) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserById(userId).then(setUser);
    setLoading(false);
  }); // 依存配列なし → 無限ループ

  return { user, loading };
};
```

### CSS/Tailwind

#### クラス名の管理

- 意味のあるクラス名を使用
- カスタムクラスは適切に定義
- レスポンシブ対応を考慮

```typescript
// 良い例
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
    タイトル
  </h2>
  <p className="text-gray-600 dark:text-gray-300">
    コンテンツ
  </p>
</div>

// 悪い例
<div className="bg-white rounded p-6 shadow border">
  <h2 className="text-xl font-semibold mb-4">タイトル</h2>
  <p>コンテンツ</p>
</div>
```

#### カスタム CSS

- グローバルスタイルは最小限に
- コンポーネント固有のスタイルは適切に分離
- CSS 変数を活用

```css
/* globals.css */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --success-color: #10b981;
  --error-color: #ef4444;
}

/* コンポーネント固有のスタイル */
.user-card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm;
  @apply border border-gray-200 dark:border-gray-700;
  @apply p-6 hover:shadow-md transition-shadow duration-200;
}
```

## 開発ワークフロー

### 1. 機能開発

#### ブランチ戦略

```bash
# 開発ブランチの作成
git checkout -b feature/new-feature

# 開発・テスト
npm run dev
npm run test

# コミット
git add .
git commit -m "feat: 新機能の追加"

# プッシュ
git push origin feature/new-feature
```

#### コミットメッセージ

- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメント更新
- **style**: コードスタイル修正
- **refactor**: リファクタリング
- **test**: テスト追加・修正
- **chore**: その他の変更

### 2. コードレビュー

#### レビューポイント

- 型安全性の確保
- パフォーマンスの考慮
- セキュリティの確認
- テストカバレッジ
- ドキュメントの更新

#### レビュープロセス

1. プルリクエストの作成
2. 自動テストの実行
3. コードレビューの実施
4. 修正・改善の実施
5. 承認・マージ

## 関連ドキュメント

- [ランキング設定管理ガイド](../02_domain/ranking/implementation/ranking-configuration-guide.md)
- [ダッシュボード作成ガイド](../02_domain/dashboard/implementation/creating-dashboard.md)
- [Next.js 最適化ガイド](./nextjs-optimization-guide.md)
- [データベース開発環境セットアップガイド](../02_domain/database/implementation/development-setup.md)

## テスト・デバッグ

### テスト

#### テストの種類

- **Unit Tests**: 個別コンポーネント・関数のテスト
- **Integration Tests**: コンポーネント間の連携テスト
- **E2E Tests**: エンドツーエンドの動作テスト

#### テスト実行

```bash
# 全テストの実行
npm test

# 特定のテストファイルの実行
npm test -- --testPathPattern=UserCard

# カバレッジレポートの生成
npm run test:coverage

# ウォッチモードでの実行
npm test -- --watch
```

### デバッグ

### 1. ブラウザ開発者ツール

#### Console

```typescript
// デバッグ情報の出力
console.log("ユーザーデータ:", user);
console.table(users);

// エラーの詳細表示
console.error("API呼び出しエラー:", error);
console.trace("スタックトレース");

// パフォーマンス測定
console.time("データ取得");
const data = await fetchData();
console.timeEnd("データ取得");
```

#### Network

- API 呼び出しの確認
- レスポンスの内容確認
- エラーステータスの確認

#### React DevTools

- コンポーネントの状態確認
- Props の値確認
- レンダリングの最適化

### 2. VS Code デバッグ

#### 設定

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/next/dist/bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

#### 使用方法

1. ブレークポイントの設定
2. デバッグの開始
3. ステップ実行
4. 変数の値確認

### 3. ログ出力

#### 構造化ログ

```typescript
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },
};

// 使用例
logger.info("ユーザーログイン", { userId: 123, timestamp: new Date() });
logger.error("API呼び出し失敗", error);
```

## デプロイ

### Cloudflare Pages へのデプロイ

このプロジェクトは Cloudflare Pages にデプロイされます。

#### 自動デプロイ

```bash
# mainブランチへのプッシュで自動デプロイ
git push origin main
```

#### 手動デプロイ

```bash
# ビルドの実行
npm run build

# Cloudflare Pagesにデプロイ
npx wrangler pages deploy .next
```

### デプロイ前のチェックリスト

#### 1. 環境変数の確認

```bash
# 本番環境の環境変数を設定
# Cloudflare Pages ダッシュボードで設定
NEXT_PUBLIC_ESTAT_APP_ID=your-production-api-key
```

#### 2. ビルドの動作確認

```bash
# ローカルでビルドを実行
npm run build

# ビルド結果を確認
npm run start
```

#### 3. テストの実行

```bash
# 全テストの実行
npm test

# カバレッジの確認
npm run test:coverage
```

#### 4. 型チェック

```bash
# TypeScriptの型チェック
npx tsc --noEmit
```

### デプロイ後の確認

#### 1. 動作確認

- 本番環境での動作確認
- API 呼び出しの動作確認
- データ表示の確認

#### 2. パフォーマンスチェック

- ページロード速度の確認
- Lighthouse スコアの確認
- Core Web Vitals の確認

#### 3. エラーモニタリング

- エラーログの確認
- API エラーの監視
- ユーザーフィードバックの確認

### ロールバック手順

問題が発生した場合のロールバック：

```bash
# 前のバージョンにロールバック
git revert HEAD
git push origin main

# または、特定のコミットに戻す
git reset --hard <commit-hash>
git push --force origin main
```

## パフォーマンス最適化

### 1. React 最適化

#### メモ化

```typescript
// コンポーネントのメモ化
export const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
  // 重い処理
  const processedData = useMemo(() => {
    return processLargeDataset(data);
  }, [data]);

  const handleUpdate = useCallback(
    (newData) => {
      onUpdate(newData);
    },
    [onUpdate]
  );

  return <div>{/* コンポーネントの内容 */}</div>;
});

// 値のメモ化
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// 関数のメモ化
const handleClick = useCallback(() => {
  performAction(data);
}, [data]);
```

#### 遅延読み込み

```typescript
// 動的インポート
const LazyComponent = lazy(() => import("./LazyComponent"));

// 使用例
function App() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

### 2. データ取得最適化

#### キャッシュ戦略

```typescript
const useCachedData = (key: string, fetcher: () => Promise<any>) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem(key);
    if (cached) {
      setData(JSON.parse(cached));
      setLoading(false);
      return;
    }

    fetcher().then((result) => {
      setData(result);
      sessionStorage.setItem(key, JSON.stringify(result));
      setLoading(false);
    });
  }, [key, fetcher]);

  return { data, loading };
};
```

#### 並行処理

```typescript
const fetchAllData = async () => {
  const [users, posts, comments] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchComments(),
  ]);

  return { users, posts, comments };
};
```

### 3. 画像最適化

#### Next.js Image

```typescript
import Image from "next/image";

export const OptimizedImage = ({ src, alt, width, height }) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxAAPwCdABmX/9k="
    />
  );
};
```

## トラブルシューティング

### 1. よくある問題

#### TypeScript エラー

```bash
# 型定義の更新
npm install @types/node@latest

# TypeScriptの再起動
# VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

#### ビルドエラー

```bash
# 依存関係のクリーンアップ
rm -rf node_modules package-lock.json
npm install

# キャッシュのクリア
npm run build -- --no-cache
```

#### 開発サーバーの問題

```bash
# ポートの確認
lsof -i :3000

# プロセスの強制終了
kill -9 <PID>

# 開発サーバーの再起動
npm run dev
```

### 2. パフォーマンス問題

#### メモリリーク

```typescript
// クリーンアップ関数の実装
useEffect(() => {
  const subscription = subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

#### 無限ループ

```typescript
// 依存配列の適切な設定
useEffect(() => {
  fetchData();
}, [dataId]); // 必要な依存関係のみ

// 関数のメモ化
const fetchData = useCallback(() => {
  // データ取得処理
}, [dataId]);
```

### 3. ネットワーク問題

#### API 呼び出しエラー

```typescript
// リトライ機能の実装
const fetchWithRetry = async (url: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## 参考資料

### 公式ドキュメント

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Cloudflare 関連

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

### プロジェクト内ドキュメント

- [アーキテクチャ設計](/doc/architecture.md)
- [API 設計](/doc/api-design.md)
- [コンポーネント設計](/doc/component-design.md)

## 更新履歴

- **2025-10-17**: 古い e-Stat 関連の記述を削除、現在のプロジェクト構造に合わせて更新
- **2025-10-01**: データベース開発セクション追加、デプロイセクション追加
- **2024-01-XX**: 初版作成
