# 開発者ガイド

## 概要

このガイドは、地域統計ダッシュボードプロジェクトに参加する開発者向けの包括的なドキュメントです。開発環境のセットアップから、コーディング規約、デバッグ方法まで、開発に必要な情報を提供します。

## 目次

1. [開発環境のセットアップ](#開発環境のセットアップ)
2. [プロジェクト構造](#プロジェクト構造)
3. [e-Stat API 統合](#estat-api統合)
4. [データベース開発](#データベース開発)
5. [コーディング規約](#コーディング規約)
6. [開発ワークフロー](#開発ワークフロー)
7. [テスト・デバッグ](#テストデバッグ)
8. [パフォーマンス最適化](#パフォーマンス最適化)
9. [デプロイ](#デプロイ)
10. [トラブルシューティング](#トラブルシューティング)

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

### 概要

e-Stat API は、日本の政府統計データにアクセスするための公式 API です。このプロジェクトでは、型安全性と開発体験を向上させるために`@estat/`パッケージを使用しています。

### @estat/パッケージの概要

#### 利用可能なパッケージ

- **@estat/types**: e-Stat API の完全な型定義
- **@estat/client**: e-Stat API クライアントライブラリ
- **@estat/utils**: データ処理と変換ユーティリティ

#### インストール

```bash
npm install @estat/types @estat/client @estat/utils
```

### 環境変数の設定

#### 必要な環境変数

```env
# e-Stat API設定
NEXT_PUBLIC_ESTAT_APP_ID=your-estat-api-app-id
```

#### e-Stat API キーの取得

1. [e-Stat API](https://www.e-stat.go.jp/api/)にアクセス
2. アカウントを作成またはログイン
3. アプリケーション ID を申請
4. 承認後に API キーを取得

### 基本的な使用方法

#### 1. 型定義のインポート

```typescript
import {
  EstatResponse,
  EstatParameter,
  EstatCatalogResponse,
  EstatListResponse,
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

#### 4. カタログ情報の取得

```typescript
// 統計データのカタログ情報を取得
const fetchCatalogInfo = async (statsDataId: string) => {
  try {
    const response = await estatClient.getStatsDataCatalog({
      statsDataId,
      lang: "J",
    });

    return response;
  } catch (error) {
    console.error("カタログ情報取得エラー:", error);
    throw error;
  }
};
```

#### 5. メタデータの取得

```typescript
// 統計データのメタデータを取得
const fetchMetaData = async (statsDataId: string) => {
  try {
    const response = await estatClient.getStatsDataMeta({
      statsDataId,
      lang: "J",
    });

    return response;
  } catch (error) {
    console.error("メタデータ取得エラー:", error);
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

#### パラメータの型安全な設定

```typescript
import { EstatParameter } from "@estat/types";

const createEstatParameter = (): EstatParameter => ({
  appId: process.env.NEXT_PUBLIC_ESTAT_APP_ID || "",
  lang: "J",
  statsDataId: "0003109941",
  metaGetFlg: "Y",
  cntGetFlg: "N",
  startPosition: 1,
  limit: 100,
  searchWord: "",
  searchOption: 1,
  tabIndex: 1,
  categoryTabIndex: 1,
  dataType: 1,
  dataFormat: "json",
});
```

### データ変換ユーティリティ

#### データの変換と整形

```typescript
import {
  transformEstatData,
  formatEstatValue,
  parseEstatTime,
} from "@estat/utils";

// e-Statデータの変換
const processEstatData = (rawData: any[]) => {
  return rawData.map((item) => ({
    ...item,
    value: formatEstatValue(item.VALUE),
    time: parseEstatTime(item.TIME),
    area: transformEstatData(item.AREA),
  }));
};
```

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

// レスポンス処理関数
const processEstatResponse = (response: EstatResponse, regionCode: string) => {
  try {
    const statisticalData = response.GET_STATS_DATA.STATISTICAL_DATA;
    const dataInf = statisticalData.DATA_INF;

    if (!dataInf || !Array.isArray(dataInf)) {
      return null;
    }

    // 指定された地域のデータをフィルタリング
    const regionData = dataInf.filter(
      (item) => item.AREA && item.AREA.includes(regionCode)
    );

    return regionData.map((item) => ({
      value: item.VALUE,
      area: item.AREA,
      time: item.TIME,
      category: item.CAT01,
      unit: item.UNIT,
    }));
  } catch (error) {
    console.error("レスポンス処理エラー:", error);
    return null;
  }
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

### Storybook 設定

#### インポートパッケージ

このプロジェクトは Next.js with Vite を使用しているため、Storybook のインポートは以下のパッケージを使用してください：

```typescript
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
```

**注意**: 以下のパッケージは使用しないでください：

- `@storybook/react` - 直接的なレンダラーパッケージ
- `@storybook/nextjs` - 標準の Next.js 用（Vite 非対応）
- `@storybook/experimental-nextjs-vite` - 実験的パッケージ

#### Co-location 構造

各コンポーネントは、関連するファイルと共に同じディレクトリに配置されています：

```
src/components/common/
├── DataTable/
│   ├── index.ts              # エクスポート管理
│   ├── DataTable.tsx         # メインコンポーネント
│   └── DataTable.stories.tsx # Storybookストーリー
├── Message/
│   ├── index.ts
│   ├── Message.tsx
│   └── Message.stories.tsx
└── InputField/
    ├── index.ts
    ├── InputField.tsx
    └── InputField.stories.tsx
```

#### 使用方法

```bash
# Storybookを起動
npm run storybook

# ビルド版を作成
npm run build-storybook
```

#### ストーリー作成のベストプラクティス

1. **型安全性の確保**:

   ```typescript
   // サンプルデータの型定義
   interface SampleData {
     id: number;
     name: string;
     // ...
   }

   // カラム定義
   const columns: TableColumn<SampleData>[] = [
     // ...
   ];
   ```

2. **複数のストーリー作成**:

   - `Default`: 基本的な使用例
   - `Empty`: 空のデータ状態
   - `WithMaxRows`: 行数制限あり
   - `CustomRendering`: カスタムレンダリング例

3. **ドキュメント化**:
   ```typescript
   const meta: Meta<typeof Component> = {
     title: "Common/ComponentName",
     component: Component,
     parameters: {
       docs: {
         description: {
           component: "コンポーネントの説明",
         },
       },
     },
     tags: ["autodocs"],
   };
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

## ランキング設定管理

### 概要

ランキング設定は、データベース経由で動的に管理されます。コードの変更なしで統計項目の追加・変更が可能です。

### データベース設計

ランキング設定は以下のテーブルで管理されます：

- `subcategory_configs`: サブカテゴリの基本設定
- `ranking_items`: 各統計項目の詳細設定

詳細は [データベース設計ドキュメント](./database-design.md) を参照してください。

### ランキング項目の追加・変更方法

#### 1. データベースでの設定

新しいランキング項目を追加する場合：

```sql
-- サブカテゴリ設定を追加
INSERT INTO subcategory_configs (id, category_id, name, description, default_ranking_key)
VALUES ('new-subcategory', 'category-id', '新サブカテゴリ', '説明', 'default-key');

-- ランキング項目を追加
INSERT INTO ranking_items (subcategory_id, ranking_key, label, stats_data_id, cd_cat01, unit, name, display_order)
VALUES
  ('new-subcategory', 'item1', '項目1', 'stats-id', 'cat01', 'unit', '項目名', 1);
```

#### 2. 既存項目の変更

```sql
-- 表示順序の変更
UPDATE ranking_items
SET display_order = 5
WHERE subcategory_id = 'land-area' AND ranking_key = 'habitableArea';

-- アクティブ状態の変更
UPDATE ranking_items
SET is_active = 0
WHERE subcategory_id = 'land-area' AND ranking_key = 'majorLakeArea';
```

### データベース経由での設定管理

#### API エンドポイント

ランキング設定は以下の API エンドポイントで取得できます：

```
GET /api/ranking-items/[subcategoryId]
```

例：

```bash
curl http://localhost:3000/api/ranking-items/land-area
```

#### データ取得関数

サーバーコンポーネントからランキング設定を取得：

```typescript
import {
  getRankingConfig,
  convertToRankingData,
} from "@/lib/ranking/get-ranking-items";

// ランキング設定を取得
const config = await getRankingConfig("land-area");

// ランキングデータに変換
const rankings = convertToRankingData(config.rankingItems);
```

### フォールバック処理

データベース接続失敗時は、フォールバック設定が使用されます：

```typescript
import { FALLBACK_CONFIGS } from "@/lib/ranking/get-ranking-items";

// フォールバック設定を使用
const config =
  (await getRankingConfig("land-area")) || FALLBACK_CONFIGS["land-area"];
```

### 新しいサブカテゴリの追加手順

1. **データベースにサブカテゴリ設定を追加**
2. **ランキング項目を追加**
3. **フォールバック設定を更新** (`src/lib/ranking/get-ranking-items.ts`)
4. **ランキングコンポーネントを作成**
5. **ルーティングを設定**

#### 例：新しいサブカテゴリ 'population' の追加

```sql
-- 1. サブカテゴリ設定
INSERT INTO subcategory_configs (id, category_id, name, description, default_ranking_key)
VALUES ('population', 'demographics', '人口', '都道府県別人口統計', 'totalPopulation');

-- 2. ランキング項目
INSERT INTO ranking_items (subcategory_id, ranking_key, label, stats_data_id, cd_cat01, unit, name, display_order)
VALUES
  ('population', 'totalPopulation', '総人口', '0003448368', 'A110101', '人', '総人口', 1),
  ('population', 'malePopulation', '男性人口', '0003448368', 'A110102', '人', '男性人口', 2),
  ('population', 'femalePopulation', '女性人口', '0003448368', 'A110103', '人', '女性人口', 3);
```

### キャッシュ戦略

ランキング設定は以下のキャッシュ戦略を採用：

- **API レスポンス**: 5 分間キャッシュ
- **Stale-while-revalidate**: 6 分間
- **フォールバック**: データベース接続失敗時

### トラブルシューティング

#### よくある問題

1. **ランキング項目が表示されない**

   - データベース接続を確認
   - `is_active = 1` の項目のみ表示される
   - フォールバック設定を確認

2. **API エラーが発生する**

   - データベーススキーマが正しく作成されているか確認
   - シードデータが投入されているか確認

3. **表示順序が正しくない**
   - `display_order` カラムの値を確認
   - 数値が小さいほど上位に表示される

#### デバッグ方法

```sql
-- ランキング設定の確認
SELECT * FROM v_ranking_configs WHERE subcategory_id = 'land-area';

-- アクティブな項目のみ表示
SELECT * FROM ranking_items WHERE subcategory_id = 'land-area' AND is_active = 1;
```

### ベストプラクティス

1. **データの整合性**: 外部キー制約を適切に設定
2. **論理削除**: データ削除時は `is_active = 0` を使用
3. **バックアップ**: 重要な設定変更前にバックアップを取得
4. **テスト**: 本番環境での変更前にテスト環境で検証
5. **ドキュメント**: 設定変更時はドキュメントを更新

## 新しいダッシュボードコンポーネントの作成

### 概要

全67個のダッシュボードコンポーネントは、全国用と都道府県用に分離された新しいアーキテクチャを採用しています。このセクションでは、新しいサブカテゴリーのダッシュボードコンポーネントを作成する手順を説明します。

### 1. コンポーネントファイルの作成

新しいサブカテゴリー用に以下の2つのファイルを作成します：

```
src/components/subcategories/[category]/[subcategory]/
├── [Name]NationalDashboard.tsx      # 全国用ダッシュボード
├── [Name]PrefectureDashboard.tsx    # 都道府県用ダッシュボード
└── index.tsx                        # エクスポート
```

### 2. National Dashboard の実装

全国用ダッシュボードは以下の特徴を持ちます：

- 全国レベルの統計概要
- 全国的な政策動向
- 都道府県間の比較分析
- 全国レベルの詳細分析

#### 実装例

```tsx
// src/components/subcategories/population/basic-population/BasicPopulationNationalDashboard.tsx
"use client";

import React from "react";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const BasicPopulationNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010101";
  const cdCat01 = {
    totalPopulation: "A1101", // 総人口
    malePopulation: "A1102",  // 男性人口
    femalePopulation: "A1103", // 女性人口
  };

  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="dashboard"
      areaCode={areaCode}
    >
      {/* 全国専用の統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalPopulation,
            }}
            areaCode={areaCode}
            title="全国総人口"
            color="#3b82f6"
          />
          {/* 他の統計カード */}
        </div>
      </div>

      {/* 全国専用の分析セクション */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国人口動態分析
          </h2>
          {/* 全国レベルの詳細分析 */}
        </div>
      </div>

      {/* 全国政策動向セクション */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国政策動向
          </h2>
          {/* 全国的な政策動向の分析 */}
        </div>
      </div>
    </SubcategoryLayout>
  );
};
```

### 3. Prefecture Dashboard の実装

都道府県用ダッシュボードは以下の特徴を持ちます：

- 都道府県固有の詳細データ
- 全国平均との比較
- 周辺都道府県との比較
- 都道府県固有の分析

#### 実装例

```tsx
// src/components/subcategories/population/basic-population/BasicPopulationPrefectureDashboard.tsx
"use client";

import React from "react";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const BasicPopulationPrefectureDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010101";
  const cdCat01 = {
    totalPopulation: "A1101", // 総人口
    malePopulation: "A1102",  // 男性人口
    femalePopulation: "A1103", // 女性人口
  };

  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="dashboard"
      areaCode={areaCode}
    >
      {/* 都道府県専用の統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalPopulation,
            }}
            areaCode={areaCode}
            title="総人口"
            color="#3b82f6"
          />
          {/* 他の統計カード */}
        </div>
      </div>

      {/* 都道府県詳細セクション */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            都道府県詳細
          </h2>
          {/* 都道府県固有の詳細分析 */}
        </div>
      </div>

      {/* 全国との比較セクション */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国との比較
          </h2>
          {/* 全国平均との比較グラフ */}
        </div>
      </div>

      {/* 周辺都道府県との比較セクション */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            周辺都道府県との比較
          </h2>
          {/* 周辺地域との比較分析 */}
        </div>
      </div>
    </SubcategoryLayout>
  );
};
```

### 4. エクスポートの設定

#### 4.1 サブカテゴリーレベルのindex.tsx

```tsx
// src/components/subcategories/population/basic-population/index.tsx
export { BasicPopulationPage } from "./BasicPopulationPage";
export { BasicPopulationNationalDashboard } from "./BasicPopulationNationalDashboard";
export { BasicPopulationPrefectureDashboard } from "./BasicPopulationPrefectureDashboard";
```

#### 4.2 カテゴリーレベルのindex.tsx

```tsx
// src/components/subcategories/population/index.ts
export {
  BasicPopulationPage,
  BasicPopulationNationalDashboard,
  BasicPopulationPrefectureDashboard,
} from "./basic-population";
// 他のサブカテゴリーも同様に追加
```

#### 4.3 全体のindex.tsx

```tsx
// src/components/subcategories/index.tsx
export {
  BasicPopulationNationalDashboard,
  BasicPopulationPrefectureDashboard,
} from "./population";
// 他のカテゴリーも同様に追加
```

### 5. categories.jsonの更新

```json
{
  "id": "basic-population",
  "name": "基本人口",
  "href": "/basic-population",
  "dashboardComponent": "BasicPopulationNationalDashboard",
  "nationalDashboardComponent": "BasicPopulationNationalDashboard",
  "prefectureDashboardComponent": "BasicPopulationPrefectureDashboard",
  "displayOrder": 1
}
```

### 6. コンポーネント解決システム

`getDashboardComponentByArea`関数が自動的に適切なコンポーネントを選択します：

- `areaCode === "00000"` → NationalDashboard
- `areaCode !== "00000"` → PrefectureDashboard

### 7. チェックリスト

- [ ] NationalDashboard作成
- [ ] PrefectureDashboard作成
- [ ] index.tsx更新（3箇所）
- [ ] categories.json更新
- [ ] 全国表示テスト（/dashboard/00000）
- [ ] 都道府県表示テスト（/dashboard/13000）
- [ ] リンターエラーなし

### 8. 命名規則

- **NationalDashboard**: `[Name]NationalDashboard.tsx`
- **PrefectureDashboard**: `[Name]PrefectureDashboard.tsx`
- **コンポーネント名**: `[Name]NationalDashboard`, `[Name]PrefectureDashboard`

### 9. ベストプラクティス

#### 9.1 コンポーネント設計

- 単一責任の原則に従う
- 全国用と都道府県用で明確に分離
- 共通部分は`SubcategoryLayout`に委譲

#### 9.2 データ処理

- 統計データIDとカテゴリコードを適切に設定
- エラーハンドリングを実装
- ローディング状態を考慮

#### 9.3 スタイリング

- Tailwind CSSクラスを使用
- レスポンシブデザインを考慮
- ダークモード対応

## データベース開発

### データベース構造

このプロジェクトでは、Cloudflare D1（SQLite ベース）をデータベースとして使用しています。

### データベース管理

#### スキーマの適用

```bash
# ローカル環境にスキーマを適用
./database/manage.sh schema

# または、手動でスキーマを適用
npx wrangler d1 execute stats47 --local --file=./database/schemas/main.sql
```

#### データの挿入

```bash
# サンプルデータの挿入
npx wrangler d1 execute stats47 --local --file=./database/seeds/sample-data.sql
```

#### データベースのクエリ実行

```bash
# ローカルデータベースへのクエリ
npx wrangler d1 execute stats47 --local --command="SELECT * FROM users"

# 本番データベースへのクエリ
npx wrangler d1 execute stats47 --command="SELECT * FROM users"
```

### データベース設計のベストプラクティス

#### 1. スキーマ設計

- 適切な正規化を行う
- インデックスを適切に設定
- 外部キー制約を活用

```sql
CREATE TABLE regions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_regions_code ON regions(code);
```

#### 2. データ型の選択

- SQLite でサポートされる型を使用
- NULL 制約を適切に設定
- デフォルト値を定義

#### 3. トランザクション管理

```typescript
// トランザクションの実装例
const updateUserData = async (db: D1Database, userId: number, data: any) => {
  const stmt = db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
  await stmt.bind(data.name, data.email, userId).run();
};
```

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

## トラブルシューティング（e-Stat API 関連）

### よくある問題と解決方法

#### 1. 型定義が見つからない

```bash
# パッケージの再インストール
npm install @estat/types @estat/client @estat/utils

# TypeScriptの再起動
# VS Codeの場合: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

#### 2. API 呼び出しエラー

- API キーが正しく設定されているか確認
- ネットワーク接続を確認
- e-Stat API の利用制限を確認

#### 3. データが取得できない

- 統計データ ID が正しいか確認
- パラメータの設定を確認
- API レスポンスの構造を確認

#### 4. データ変換エラー

- レスポンスの構造を確認
- 型定義と実際のデータ構造が一致しているか確認
- エラーログを確認して原因を特定

## 参考資料

### 公式ドキュメント

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### e-Stat API 関連

- [e-Stat API 公式ドキュメント](https://www.e-stat.go.jp/api/)
- [@estat/パッケージドキュメント](https://github.com/estat-org/estat-packages)

### Cloudflare 関連

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

### プロジェクト内ドキュメント

- [アーキテクチャ設計](/doc/architecture.md)
- [API 設計](/doc/api-design.md)
- [コンポーネント設計](/doc/component-design.md)

## 更新履歴

- **2025-10-01**: estat-integration.md の内容を統合、データベース開発セクション追加、デプロイセクション追加
- **2024-01-XX**: @estat/パッケージ統合の追加
- **2024-01-XX**: e-Stat API 統合の追加
- **2024-01-XX**: 初版作成
