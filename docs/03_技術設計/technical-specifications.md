---
title: 技術仕様書
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/architecture
  - specifications
  - technical-architecture
---

# 技術仕様書


### 技術スタック

#### フロントエンド

- **フレームワーク**: Next.js 15 (App Router)
- **UI ライブラリ**: React 19
- **言語**: TypeScript 5.x
- **スタイリング**: Tailwind CSS 4
- **状態管理**: Jotai
- **データフェッチ**: SWR
- **可視化**: Recharts, D3.js
- **ビルドツール**: Turbopack

#### バックエンド

- **ランタイム**: Node.js 18.x
- **API**: Next.js API Routes
- **データベース**: Cloudflare D1 (SQLite)
- **オブジェクトストレージ**: Cloudflare R2
- **認証**: Auth.js (NextAuth.js)

#### インフラ

- **ホスティング**: Cloudflare Pages
- **CDN**: Cloudflare CDN
- **ドメイン**: Cloudflare DNS
- **監視**: Cloudflare Analytics

## ディレクトリ構造

### プロジェクトルート

```
stats47/
├── src/                    # ソースコード
├── docs/                   # ドキュメント
├── data/                   # データファイル
├── database/               # データベース関連
├── scripts/                # ユーティリティスクリプト
├── public/                 # 静的ファイル
└── config files           # 設定ファイル
```

### ソースコード構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API ルート
│   ├── (dashboard)/       # ダッシュボードページ
│   └── globals.css        # グローバルスタイル
├── components/            # React コンポーネント
│   ├── common/           # 共通コンポーネント
│   ├── layout/           # レイアウトコンポーネント
│   ├── ranking/          # ランキング関連
│   ├── estat-api/        # e-Stat API 関連
│   └── d3/               # D3.js コンポーネント
├── lib/                   # ユーティリティライブラリ
│   ├── database/         # データベース接続
│   ├── ranking/          # ランキングロジック
│   ├── estat/            # e-Stat API 連携
│   └── area/             # 地域データ管理
├── atoms/                 # Jotai 状態管理
├── hooks/                 # カスタムフック
├── types/                 # TypeScript 型定義
├── config/                # 設定ファイル
└── data/                  # データファイル
```

## 状態管理アーキテクチャ

### Jotai ベースの状態管理

#### 基本原則

1. **Atomic Design**: 状態を最小単位に分割
2. **単方向データフロー**: データの流れを明確化
3. **型安全性**: TypeScript による型チェック
4. **パフォーマンス**: 必要な部分のみ再レンダリング

#### 状態の分類

```typescript
// 1. プリミティブ状態
export const themeAtom = atomWithStorage<Theme>("theme", "light");
export const selectedCategoryAtom = atom<string | null>(null);

// 2. 派生状態
export const effectiveThemeAtom = atom((get) => {
  const theme = get(themeAtom);
  const mounted = get(mountedAtom);
  return mounted ? theme : "light";
});

// 3. 非同期状態
export const dataAtom = atom(async () => {
  const response = await fetch("/api/data");
  return response.json();
});

// 4. 書き込み専用状態（アクション）
export const toggleThemeAtom = atom(null, (get, set) => {
  const current = get(themeAtom);
  set(themeAtom, current === "light" ? "dark" : "light");
});
```

#### 状態の永続化

```typescript
// localStorage 連携
export const themeAtom = atomWithStorage<Theme>("theme", "light");

// カスタム永続化
export const customAtom = atomWithStorage("custom-key", defaultValue, {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
});
```

## API 設計

### RESTful API 原則


#### レスポンス形式

```typescript
// 成功レスポンス
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// エラーレスポンス
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// 統一レスポンス型
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
```

#### エラーハンドリング

```typescript
// HTTP ステータスコード
200: OK
201: Created
400: Bad Request
401: Unauthorized
403: Forbidden
404: Not Found
500: Internal Server Error

// エラーコード体系
const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  RATE_LIMITED: "RATE_LIMITED",
  EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR",
} as const;
```

## データベース設計

### Cloudflare D1 (SQLite) スキーマ


### Cloudflare R2 ストレージ


## セキュリティ設計

### 認証・認可

#### Auth.js 設定

```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 認証ロジック
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};
```

#### 認可レベル

```typescript
enum Permission {
  READ = "read",
  WRITE = "write",
  ADMIN = "admin",
}

interface User {
  id: string;
  email: string;
  permissions: Permission[];
}
```

### データ保護

#### 入力検証

```typescript
// Zod スキーマによる検証
const CreateRankingItemSchema = z.object({
  subcategoryId: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  visualizationType: z.enum(["bar", "line", "choropleth"]),
});

type CreateRankingItem = z.infer<typeof CreateRankingItemSchema>;
```

#### SQL インジェクション対策

```typescript
// プリペアドステートメントの使用
const stmt = db.prepare(`
  SELECT * FROM ranking_values 
  WHERE ranking_key = ? AND time_code = ?
`);
const result = stmt.all(rankingKey, timeCode);
```

## パフォーマンス設計


## 監視・ログ設計

### エラーハンドリング

```typescript
// グローバルエラーハンドラー
export function GlobalErrorHandler() {
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error("Global error:", error);
      // エラー報告サービスに送信
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  return null;
}
```

### パフォーマンス監視

```typescript
// Web Vitals 測定
export function reportWebVitals(metric: NextWebVitalsMetric) {
  console.log(metric);
  // 分析サービスに送信
}

// カスタムメトリクス
const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name}: ${end - start}ms`);
};
```

## 開発・デプロイ設計

### 環境管理

```typescript
// 環境別設定
const config = {
  development: {
    apiUrl: "http://localhost:3000/api",
    debug: true,
  },
  staging: {
    apiUrl: "https://staging.stats47.com/api",
    debug: true,
  },
  production: {
    apiUrl: "https://stats47.com/api",
    debug: false,
  },
}[process.env.NODE_ENV];
```

### CI/CD パイプライン

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: stats47
```

