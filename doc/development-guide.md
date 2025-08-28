# 開発者ガイド

## 概要

このガイドは、地域統計ダッシュボードプロジェクトに参加する開発者向けの包括的なドキュメントです。開発環境のセットアップから、コーディング規約、デバッグ方法まで、開発に必要な情報を提供します。

## 目次

1. [開発環境のセットアップ](#開発環境のセットアップ)
2. [プロジェクト構造](#プロジェクト構造)
3. [コーディング規約](#コーディング規約)
4. [開発ワークフロー](#開発ワークフロー)
5. [テスト](#テスト)
6. [デバッグ](#デバッグ)
7. [パフォーマンス最適化](#パフォーマンス最適化)
8. [トラブルシューティング](#トラブルシューティング)

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

# e-Stat APIキーを設定（オプション）
echo "NEXT_PUBLIC_ESTAT_APP_ID=your-actual-app-id" >> .env.local
```

### 4. 開発サーバーの起動

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
│   ├── architecture.md
│   ├── api-design.md
│   ├── component-design.md
│   ├── development-guide.md
│   └── ...
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── layout.tsx     # ルートレイアウト
│   │   ├── page.tsx       # ホームページ
│   │   └── dashboard/     # ダッシュボードページ
│   │       └── page.tsx
│   ├── components/         # Reactコンポーネント
│   │   ├── EstatDataFetcher.tsx
│   │   ├── RegionSelector.tsx
│   │   └── StatisticsDisplay.tsx
│   ├── config/             # 設定ファイル
│   │   └── categories.json
│   ├── types/              # TypeScript型定義
│   ├── utils/              # ユーティリティ関数
│   └── styles/             # スタイルファイル
│       └── globals.css
├── public/                 # 静的ファイル
├── package.json            # 依存関係
├── tsconfig.json           # TypeScript設定
├── next.config.ts          # Next.js設定
├── tailwind.config.js      # Tailwind CSS設定
└── .gitignore              # Git除外設定
```

## コーディング規約

### TypeScript

#### 型定義

```typescript
// インターフェース名はPascalCase
interface UserData {
  id: string;
  name: string;
  email: string;
}

// 型エイリアス名もPascalCase
type ChartData = Array<{
  year: string;
  value: number;
}>;

// 列挙型名もPascalCase
enum RegionCode {
  Tokyo = "13",
  Osaka = "27",
  Aichi = "23",
}
```

#### 関数定義

```typescript
// 関数名はcamelCase
function calculateAverage(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// アロー関数もcamelCase
const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

// 非同期関数はasync/awaitを使用
async function fetchUserData(userId: string): Promise<UserData> {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}
```

#### コンポーネント

```typescript
// コンポーネント名はPascalCase
interface UserProfileProps {
  user: UserData;
  onEdit?: (user: UserData) => void;
}

export function UserProfile({ user, onEdit }: UserProfileProps) {
  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      {onEdit && <button onClick={() => onEdit(user)}>編集</button>}
    </div>
  );
}
```

### React

#### Hooks

```typescript
// useStateは適切な初期値と型を指定
const [user, setUser] = useState<UserData | null>(null);
const [loading, setLoading] = useState<boolean>(false);

// useEffectは依存配列を適切に設定
useEffect(() => {
  fetchUserData(userId).then(setUser);
}, [userId]); // 依存関係のみ

// useCallbackで関数をメモ化
const handleUserEdit = useCallback(
  (user: UserData) => {
    setUser(user);
    onEdit?.(user);
  },
  [onEdit]
);

// useMemoで計算結果をメモ化
const averageAge = useMemo(() => {
  return users.reduce((sum, user) => sum + user.age, 0) / users.length;
}, [users]);
```

#### イベントハンドリング

```typescript
// イベントハンドラー名はhandleで始める
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
  // 処理
};

const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = event.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};

// フォーム送信
const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  try {
    await submitForm(formData);
    setSuccess(true);
  } catch (error) {
    setError(error.message);
  }
};
```

### CSS/Tailwind

#### Tailwind CSS クラス

```typescript
// クラス名は論理的な順序で並べる
<div className="
  flex items-center justify-between
  p-4 m-2
  bg-white border border-gray-200 rounded-lg shadow-sm
  hover:shadow-md transition-shadow
">
  {/* コンテンツ */}
</div>

// 長いクラス名は複数行に分割
<button className="
  inline-flex items-center px-4 py-2
  border border-transparent text-sm font-medium rounded-md
  text-white bg-blue-600 hover:bg-blue-700
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors
">
  ボタン
</button>
```

#### カスタム CSS

```css
/* カスタムCSSは最小限に抑える */
.custom-chart {
  @apply relative w-full h-64;
}

.custom-chart .recharts-cartesian-grid-horizontal line {
  @apply stroke-gray-200;
}

.custom-chart .recharts-cartesian-grid-vertical line {
  @apply stroke-gray-200;
}
```

## 開発ワークフロー

### 1. ブランチ戦略

```bash
# メインブランチ
main          # 本番環境
develop       # 開発環境

# 機能ブランチ
feature/add-new-chart      # 新機能開発
bugfix/fix-api-error       # バグ修正
hotfix/critical-security   # 緊急修正
```

### 2. 開発フロー

```bash
# 1. 最新のdevelopブランチを取得
git checkout develop
git pull origin develop

# 2. 機能ブランチを作成
git checkout -b feature/add-new-chart

# 3. 開発・テスト
npm run dev
npm run test
npm run lint

# 4. コミット
git add .
git commit -m "feat: 新しいチャートタイプを追加

- 散布図コンポーネントを実装
- データフィルタリング機能を追加
- レスポンシブ対応を改善"

# 5. プッシュ
git push origin feature/add-new-chart

# 6. プルリクエスト作成
# GitHubでプルリクエストを作成し、レビューを依頼
```

### 3. コミットメッセージ規約

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `style`: コードスタイル修正
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: その他の変更

**例**

```
feat(dashboard): 地域比較機能を追加

- 複数地域の同時表示機能
- 比較チャートの実装
- 地域選択UIの改善

Closes #123
```

## テスト

### 1. テスト実行

```bash
# 全テスト実行
npm run test

# ウォッチモード
npm run test:watch

# カバレッジ付きテスト
npm run test:coverage

# 特定のテストファイル
npm test -- --testPathPattern=RegionSelector

# 特定のテスト
npm test -- --testNamePattern="should render region options"
```

### 2. テストファイル命名

```
src/
├── components/
│   ├── RegionSelector.tsx
│   └── __tests__/
│       └── RegionSelector.test.tsx
├── utils/
│   ├── dataProcessor.ts
│   └── __tests__/
│       └── dataProcessor.test.ts
```

### 3. テスト例

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { RegionSelector } from "../RegionSelector";

describe("RegionSelector", () => {
  const defaultProps = {
    regions: [
      { code: "13", name: "東京都" },
      { code: "27", name: "大阪府" },
    ],
    selectedRegion: "13",
    onRegionChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders all region options", () => {
    render(<RegionSelector {...defaultProps} />);

    expect(screen.getByText("東京都")).toBeInTheDocument();
    expect(screen.getByText("大阪府")).toBeInTheDocument();
  });

  test("calls onRegionChange when selection changes", () => {
    render(<RegionSelector {...defaultProps} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "27" } });

    expect(defaultProps.onRegionChange).toHaveBeenCalledWith("27");
  });

  test("displays selected region name", () => {
    render(<RegionSelector {...defaultProps} />);

    expect(screen.getByText("選択中: 東京都")).toBeInTheDocument();
  });
});
```

## デバッグ

### 1. ブラウザ開発者ツール

#### React Developer Tools

```bash
# Chrome拡張機能をインストール
# React Developer Tools
# Redux DevTools（状態管理使用時）
```

#### Console Logging

```typescript
// 開発時のみログ出力
if (process.env.NODE_ENV === "development") {
  console.log("User data:", userData);
  console.log("API response:", response);
}

// エラーログ
console.error("API call failed:", error);
console.warn("Deprecated feature used");
```

### 2. VS Code デバッグ

`.vscode/launch.json`を設定して、VS Code からデバッグ可能：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
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

### 3. エラーハンドリング

```typescript
// エラー境界の実装
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);

    // エラー監視サービスに送信
    if (process.env.NODE_ENV === "production") {
      logErrorToService(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>エラーが発生しました</h2>
          <p>ページを再読み込みしてください</p>
          <button onClick={() => window.location.reload()}>再読み込み</button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## パフォーマンス最適化

### 1. コード分割

```typescript
// 動的インポート
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <div>読み込み中...</div>,
  ssr: false,
});

// 条件付きインポート
const ChartComponent = dynamic(() => import("./ChartComponent"), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### 2. メモ化

```typescript
// React.memoでコンポーネントをメモ化
export const ExpensiveChart = React.memo(({ data }: ChartProps) => {
  // 重い計算処理
  return <Chart data={data} />;
});

// useMemoで計算結果をメモ化
const processedData = useMemo(() => {
  return data.map((item) => ({
    ...item,
    normalizedValue: item.value / maxValue,
  }));
}, [data, maxValue]);

// useCallbackで関数をメモ化
const handleDataUpdate = useCallback((newData: DataType) => {
  setData(newData);
}, []);
```

### 3. 画像最適化

```typescript
import Image from "next/image";

// Next.jsの画像最適化を使用
<Image
  src="/chart-icon.png"
  alt="チャートアイコン"
  width={64}
  height={64}
  priority={false}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>;
```

## トラブルシューティング

### 1. よくある問題

#### 依存関係の競合

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install

# 特定のパッケージのバージョン確認
npm ls react
npm ls next
```

#### TypeScript エラー

```bash
# TypeScriptの型チェック
npx tsc --noEmit

# 設定ファイルの確認
cat tsconfig.json

# 型定義の更新
npm install --save-dev @types/react @types/node
```

#### ビルドエラー

```bash
# キャッシュをクリア
rm -rf .next
npm run build

# 開発サーバーの再起動
npm run dev
```

### 2. パフォーマンス問題

#### バンドルサイズの確認

```bash
# バンドルアナライザー
npm run build
npx @next/bundle-analyzer .next/static/chunks

# 依存関係の確認
npm ls --depth=0
```

#### メモリリークの確認

```typescript
// useEffectのクリーンアップ
useEffect(() => {
  const controller = new AbortController();

  fetchData(controller.signal);

  return () => {
    controller.abort(); // リクエストをキャンセル
  };
}, []);
```

### 3. デバッグツール

#### React Profiler

```typescript
import { Profiler } from "react";

function onRenderCallback(id: string, phase: string, actualDuration: number) {
  console.log(`Component ${id} took ${actualDuration}ms to render`);
}

<Profiler id="Dashboard" onRender={onRenderCallback}>
  <Dashboard />
</Profiler>;
```

#### パフォーマンス測定

```typescript
// カスタムフックでパフォーマンス測定
const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    const start = performance.now();

    return () => {
      const end = performance.now();
      console.log(`${componentName} render time: ${end - start}ms`);
    };
  });
};
```

## 参考資料

### 公式ドキュメント

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### 開発ツール

- [VS Code](https://code.visualstudio.com/)
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)

### コミュニティ

- [Next.js GitHub](https://github.com/vercel/next.js)
- [React GitHub](https://github.com/facebook/react)
- [TypeScript GitHub](https://github.com/microsoft/TypeScript)

## サポート

開発中に問題が発生した場合：

1. **ドキュメント確認**: このガイドと関連ドキュメントを確認
2. **GitHub Issues**: 既存の Issue を検索
3. **チーム内相談**: チームメンバーに相談
4. **外部リソース**: Stack Overflow、GitHub Discussions 等を活用

プロジェクトの成功に向けて、積極的なコミュニケーションと継続的な改善を心がけましょう！
