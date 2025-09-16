# EstatDataPage のサーバーコンポーネント化について

## 現状分析

現在の `src/app/estat/response/page.tsx` は `"use client"` ディレクティブが付いたクライアントコンポーネントです。

## サーバーコンポーネント化の検討

### 現在のクライアント側機能

以下の機能によりクライアントコンポーネントが必要：

1. **React Hooks の使用**
   - `useState` - API レスポンス、ローディング、エラー状態の管理
   - `useEffect` - URL パラメータからモードを読み取り
   - `useSearchParams`, `useRouter` - URL 操作

2. **インタラクティブ機能**
   - データ取得フォームの送信
   - 表示モードの切り替え
   - 更新ボタンのクリック
   - API レスポンスの動的表示

### サーバーコンポーネント化の課題

#### 不可能な理由
- **状態管理**: `useState` でのリアルタイム状態管理
- **イベントハンドラー**: ボタンクリック、フォーム送信
- **クライアント側 API 呼び出し**: ブラウザから e-STAT API への動的リクエスト
- **URL 操作**: `useRouter` での動的ルーティング

## 代替アプローチ

### 1. ハイブリッド構成（推奨）

```typescript
// app/estat/response/page.tsx (サーバーコンポーネント)
export default function EstatDataPage({ searchParams }) {
  const mode = searchParams.mode || 'table';

  return (
    <>
      <Header />
      <Sidebar />
      <main className="lg:ps-60...">
        <EstatDataClient initialMode={mode} />
      </main>
    </>
  );
}

// components/estat/EstatDataClient.tsx (クライアントコンポーネント)
'use client';
export function EstatDataClient({ initialMode }) {
  // 現在のロジックをここに移動
}
```

**メリット:**
- ページレベルでサーバーコンポーネントの恩恵
- SEO 最適化
- 初期レンダリング高速化
- クライアント側の JavaScript バンドルサイズ削減

### 2. Server Actions 活用

```typescript
// app/estat/response/actions.ts
'use server';
export async function fetchEstatData(params: GetStatsDataParams) {
  // サーバー側での API 呼び出し
  const response = await fetch(`${process.env.ESTAT_API_URL}/...`);
  return response.json();
}
```

**制限事項:**
- リアルタイムな状態更新が困難
- e-STAT API の CORS 制限により、プロキシ API が必要

## 結論

**現在の実装はクライアントコンポーネントが最適**

理由：
1. **インタラクティブな UI**: リアルタイムデータ取得・表示
2. **状態管理の複雑さ**: 複数の状態を動的に管理
3. **ユーザー体験**: スムーズなモード切り替え
4. **API 制約**: クライアント側での API 呼び出しが必要

### 改善提案

現状を維持しつつ、以下で最適化可能：

1. **コンポーネント分割**: 静的部分をサーバーコンポーネント化
2. **lazy loading**: 重いコンポーネントの遅延読み込み
3. **React.memo**: 不要な再レンダリング防止
4. **Suspense boundary**: ローディング状態の改善

```typescript
// 改善例
export default function EstatDataPage() {
  return (
    <>
      {/* サーバーコンポーネント */}
      <Header />
      <Sidebar />

      <main className="...">
        <Suspense fallback={<EstatDataSkeleton />}>
          {/* クライアントコンポーネント */}
          <EstatDataContent />
        </Suspense>
      </main>
    </>
  );
}
```

この方式により、パフォーマンスを維持しながら必要な機能を提供できます。