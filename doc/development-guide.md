# 開発者ガイド

## 概要

このガイドは、地域統計ダッシュボードプロジェクトに参加する開発者向けの包括的なドキュメントです。開発環境のセットアップから、コーディング規約、デバッグ方法まで、開発に必要な情報を提供します。

## 目次

1. [開発環境のセットアップ](#開発環境のセットアップ)
2. [プロジェクト構造](#プロジェクト構造)
3. [e-Stat API 統合](#estat-api統合)
4. [コーディング規約](#コーディング規約)
5. [開発ワークフロー](#開発ワークフロー)
6. [テスト](#テスト)
7. [デバッグ](#デバッグ)
8. [パフォーマンス最適化](#パフォーマンス最適化)
9. [トラブルシューティング](#トラブルシューティング)

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

# e-Stat関連パッケージのインストール
npm install @estat/types @estat/client @estat/utils
```

### 3. 環境変数の設定

```bash
# .env.localファイルを作成
cp .env.example .env.local

# e-Stat APIキーを設定
echo "NEXT_PUBLIC_ESTAT_APP_ID=your-actual-app-id" >> .env.local

# 認証関連の環境変数（オプション）
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
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスして動作確認。

### 5. VS Code 設定（推奨）

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
│   └── estat-integration.md # e-Stat統合ガイド
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/         # Reactコンポーネント
│   ├── types/              # TypeScript型定義
│   │   └── estat/         # e-Stat API型定義
│   ├── lib/                # ユーティリティ関数
│   │   └── estat/         # e-Stat関連ユーティリティ
│   └── contexts/           # React Context
├── data/                   # データファイル
└── public/                 # 静的ファイル
```

## e-Stat API 統合

### @estat/パッケージの概要

このプロジェクトでは、e-Stat API の型安全性と開発体験を向上させるために`@estat/`パッケージを使用しています。

#### 利用可能なパッケージ

- **@estat/types**: e-Stat API の完全な型定義
- **@estat/client**: e-Stat API クライアントライブラリ
- **@estat/utils**: データ処理と変換ユーティリティ

### 基本的な使用方法

#### 1. 型定義のインポート

```typescript
import {
  EstatResponse,
  EstatParameter,
  EstatCatalogResponse,
} from "@estat/types";
```

#### 2. API クライアントの初期化

```typescript
import { EstatClient } from "@estat/client";

const estatClient = new EstatClient({
  appId: process.env.NEXT_PUBLIC_ESTAT_APP_ID || "",
});
```

#### 3. 統計データの取得

```typescript
const fetchStatisticalData = async (statsDataId: string) => {
  try {
    const response = await estatClient.getStatsData({
      statsDataId,
      metaGetFlg: "Y",
      cntGetFlg: "N",
    });

    return response;
  } catch (error) {
    console.error("e-Stat API呼び出しエラー:", error);
    throw error;
  }
};
```

### 型安全なデータ処理

#### レスポンス処理の例

```typescript
import { EstatResponse } from "@estat/types";

const processEstatResponse = (response: EstatResponse) => {
  try {
    // 型安全なデータアクセス
    const statisticalData = response.GET_STATS_DATA.STATISTICAL_DATA;
    const dataInf = statisticalData.DATA_INF;

    if (dataInf && Array.isArray(dataInf)) {
      return dataInf.map((item) => ({
        value: item.VALUE,
        area: item.AREA,
        time: item.TIME,
        category: item.CAT01,
      }));
    }

    return [];
  } catch (error) {
    console.error("e-Statレスポンス処理エラー:", error);
    return [];
  }
};
```

### エラーハンドリング

#### 型安全なエラー処理

```typescript
import { EstatError, EstatErrorCode } from "@estat/types";

const handleEstatError = (error: unknown) => {
  if (error instanceof EstatError) {
    switch (error.code) {
      case EstatErrorCode.INVALID_APP_ID:
        return "アプリケーションIDが無効です";
      case EstatErrorCode.INVALID_STATS_DATA_ID:
        return "統計データIDが無効です";
      case EstatErrorCode.API_LIMIT_EXCEEDED:
        return "API利用制限に達しました";
      default:
        return `e-Stat APIエラー: ${error.message}`;
    }
  }

  return "予期しないエラーが発生しました";
};
```

### データ変換ユーティリティ

#### 地域コードの変換

```typescript
import { convertAreaCode, getAreaName } from "@estat/utils";

const getRegionInfo = (areaCode: string) => {
  const areaName = getAreaName(areaCode);
  const convertedCode = convertAreaCode(areaCode);

  return {
    code: convertedCode,
    name: areaName,
    originalCode: areaCode,
  };
};
```

### 実装例

#### EstatDataFetcher コンポーネント

```typescript
import React, { useEffect, useState } from "react";
import { EstatClient } from "@estat/client";
import { EstatResponse, EstatParameter } from "@estat/types";

interface EstatDataFetcherProps {
  regionCode: string;
  onDataUpdate: (data: any) => void;
  onLoadingChange: (loading: boolean) => void;
  children: (
    data: any,
    loading: boolean,
    error: string | null
  ) => React.ReactNode;
}

export const EstatDataFetcher: React.FC<EstatDataFetcherProps> = ({
  regionCode,
  onDataUpdate,
  onLoadingChange,
  children,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!regionCode) return;

      setLoading(true);
      setError(null);
      onLoadingChange(true);

      try {
        const estatClient = new EstatClient({
          appId: process.env.NEXT_PUBLIC_ESTAT_APP_ID || "",
        });

        const parameter: EstatParameter = {
          appId: process.env.NEXT_PUBLIC_ESTAT_APP_ID || "",
          lang: "J",
          statsDataId: "0003109941", // 人口統計の例
          metaGetFlg: "Y",
          cntGetFlg: "N",
          startPosition: 1,
          limit: 100,
        };

        const response: EstatResponse = await estatClient.getStatsData(
          parameter
        );

        // 型安全なデータ処理
        const processedData = processEstatResponse(response, regionCode);

        setData(processedData);
        onDataUpdate(processedData);
      } catch (err) {
        const errorMessage = handleEstatError(err);
        setError(errorMessage);
        console.error("e-Statデータ取得エラー:", err);
      } finally {
        setLoading(false);
        onLoadingChange(false);
      }
    };

    fetchData();
  }, [regionCode, onDataUpdate, onLoadingChange]);

  return <>{children(data, loading, error)}</>;
};
```

### ベストプラクティス

#### 1. 型安全性の確保

- 常に`@estat/types`から型をインポート
- 型ガードを使用してランタイムエラーを防止
- 適切なエラーハンドリングを実装

#### 2. パフォーマンスの最適化

- 必要最小限のデータのみを取得
- キャッシュ戦略の実装
- 非同期処理の適切な管理

#### 3. エラーハンドリング

- ユーザーフレンドリーなエラーメッセージ
- ログ出力によるデバッグ支援
- フォールバックデータの提供

#### 4. セキュリティ

- API キーの適切な管理
- 環境変数での機密情報保護
- 入力値の検証とサニタイゼーション

### トラブルシューティング

#### よくある問題と解決方法

##### 1. 型定義が見つからない

```bash
# パッケージの再インストール
npm install @estat/types @estat/client @estat/utils

# TypeScriptの再起動
# VS Codeの場合: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

##### 2. API 呼び出しエラー

- API キーが正しく設定されているか確認
- ネットワーク接続を確認
- e-Stat API の利用制限を確認

##### 3. データが取得できない

- 統計データ ID が正しいか確認
- パラメータの設定を確認
- API レスポンスの構造を確認

### Storybook 設定

#### Co-location 構造

各コンポーネントは、関連するファイルと共に同じディレクトリに配置されています：

```
src/components/
├── Header.tsx              # メインコンポーネント
├── Header.story.tsx        # Storybookストーリー
├── Footer.tsx
├── Footer.story.tsx
└── ...
```

#### 使用方法

```bash
# Storybookを起動
npm run storybook

# ビルド版を作成
npm run build-storybook
```

#### 設定ファイル

- `.storybook/main.ts` - メイン設定
- `.storybook/preview.ts` - プレビュー設定
- `src/components/README.md` - コンポーネント構造の説明

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

### 3. テスト

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

#### データ変換ロジックのテスト

e-Stat API のデータ変換ロジックをテストする場合：

```bash
# データ変換ロジックのテスト実行
npm test -- src/lib/estat/__tests__/data-transformer.test.ts

# 特定のテストケースの実行
npm test -- src/lib/estat/__tests__/data-transformer.test.ts --testNamePattern="item_nameからcat01の文字列を正しく除外する"
```

##### テストの内容

データ変換ロジックのテストでは、以下の項目を検証します：

1. **基本情報の行の生成**: 統計表の基本情報が正しく設定される
2. **item_name の抽出**: `cat01`コードが`item_name`から正しく除外される
3. **データ形式の検証**: 変換後のデータが期待される形式である
4. **件数の確認**: 基本情報行 + データ行の合計件数が正しい

##### テストデータの構造

```typescript
// テスト用のサンプルデータ
const createSampleMetadata = (): EstatMetaInfoResponse => ({
  GET_META_INFO: {
    // ... メタデータの構造
    CLASS_INF: {
      CLASS_OBJ: [
        {
          "@id": "cat01",
          "@name": "分類1",
          CLASS: [
            {
              "@code": "A1101",
              "@name": "A1101_総人口", // 変換前
              "@unit": "人",
            },
          ],
        },
      ],
    },
  },
});

// 期待される変換結果
expect(dataRows[0].item_name).toBe("総人口"); // 変換後
```

##### テストの実行結果

```bash
✓ EstatDataTransformer > transformToCSVFormat > 基本情報の行が正しく設定される
✓ EstatDataTransformer > transformToCSVFormat > item_nameからcat01の文字列を正しく除外する
✓ EstatDataTransformer > transformToCSVFormat > cat01の値が正しく設定される
✓ EstatDataTransformer > transformToCSVFormat > 基本情報が正しく設定される
✓ EstatDataTransformer > transformToCSVFormat > 単位が正しく設定される
✓ EstatDataTransformer > transformToCSVFormat > データの件数が正しい
✓ EstatDataTransformer > extractItemName (private method test) > 基本的なパターンを正しく処理する
```

## デバッグ

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

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [e-Stat API Documentation](https://www.e-stat.go.jp/api/)
- [@estat/パッケージドキュメント](https://github.com/estat-org/estat-packages)

## 更新履歴

- **2024-01-XX**: 初版作成
- **2024-01-XX**: e-Stat API 統合の追加
- **2024-01-XX**: @estat/パッケージ統合の追加
- **2024-01-XX**: 開発者ガイドの拡充
