# EstatRankingサーバーコンポーネント化 - 実装手順書（修正版）

**作成日**: 2025-10-10
**最終更新**: 2025-10-10
**対象**: Next.js 15 App Router + Jotai テーマシステム

---

## ⚠️ 重要な注意事項

この実装ガイドは、以下の問題により**段階的なアプローチ**に変更されました：

### 判明した問題

1. **`SubcategoryLayout`がクライアントコンポーネント**
   - `"use client"`を使用しているため、内部でサーバーコンポーネントを直接レンダリングできない
   - React 18/19の制約により、クライアントコンポーネント内でサーバーコンポーネントを使用するには`children`として渡す必要がある

2. **アーキテクチャの複雑さ**
   - 65個以上のランキングコンポーネントが`SubcategoryLayout`を使用
   - 全てを一度にサーバーコンポーネント化するのはリスクが高い

### 推奨アプローチ

**Phase 0のみを実行することを強く推奨します。**

サーバーコンポーネント化（Phase 1-5）は、以下の準備作業が完了してから実施すべきです：

1. `SubcategoryLayout`のリファクタリング（サーバーコンポーネント化）
2. レイアウトとビジネスロジックの分離
3. 段階的な移行計画の策定

---

## 📋 目次

1. [Phase 0: テーマの修正（最優先・今すぐ実行）](#phase-0-テーマの修正最優先今すぐ実行)
2. [Phase 1-5について](#phase-1-5について)
3. [トラブルシューティング](#トラブルシューティング)

---

## Phase 0: テーマの修正（最優先・今すぐ実行）

### 🚨 なぜ最初にテーマを修正するのか？

**現象**:
- ThemeToggleButtonが永遠にローディングスピナーを表示
- `mounted`フラグが`false`のままで`true`にならない
- テーマの切り替えができない

**根本原因**:
1. ✅ ThemeInitializerの重複（`layout.tsx`の30行目）
2. ✅ `atomWithStorage`の`getOnInit: true`オプション（`theme.ts`の10行目）

---

### ステップ1: layout.tsxの修正

**ファイル**: `src/app/layout.tsx`

**問題の箇所**: 30行目

**変更前**:
```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="relative min-h-full">
      <body className="...">
        <JotaiProvider>
          <ThemeInitializer />  {/* ← 30行目: この行を削除 */}
          {children}
        </JotaiProvider>
      </body>
    </html>
  );
}
```

**変更後**:
```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="relative min-h-full">
      <body className="...">
        <JotaiProvider>
          {/* ThemeInitializerを削除 - JotaiProvider内部で管理 */}
          {children}
        </JotaiProvider>
      </body>
    </html>
  );
}
```

**実行手順**:
1. `src/app/layout.tsx`を開く
2. 30行目の`<ThemeInitializer />`を削除
3. コメントを追加（オプション）：`{/* ThemeInitializerを削除 - JotaiProvider内部で管理 */}`
4. ファイルを保存

---

### ステップ2: atomWithStorageの修正

**ファイル**: `src/atoms/theme.ts`

**問題の箇所**: 9-11行目

**変更前**:
```tsx
export const themeAtom = atomWithStorage<Theme>("theme", "light", undefined, {
  getOnInit: true,  // ← 10行目: このオプションが問題
});
```

**変更後**:
```tsx
export const themeAtom = atomWithStorage<Theme>("theme", "light");
```

**実行手順**:
1. `src/atoms/theme.ts`を開く
2. 9-11行目を上記のように1行に変更
3. ファイルを保存

---

### ステップ3: 動作確認

**作業**:
```bash
# 開発サーバーを再起動
npm run dev

# ブラウザで確認
# http://localhost:3000
```

**確認項目**:
- [ ] ThemeToggleButtonが正常に表示される（ローディングスピナーが表示されない）
- [ ] テーマの切り替えが機能する
- [ ] ページリロード後もテーマが保持される
- [ ] ブラウザコンソールにエラーがない

**期待される結果**:
- テーマトグルボタンが即座に表示される
- ダークモード/ライトモードの切り替えがスムーズに動作する
- ローディングスピナーが表示されない

---

## Phase 1-5について

### なぜPhase 1-5を実行すべきでないか

現在の実装では、以下の理由によりサーバーコンポーネント化は推奨されません：

#### 1. アーキテクチャ上の制約

```
現在の構造:
  ランキングPage（サーバー）
    └─ BasicPopulationRanking（クライアント）※ use client削除したい
        └─ SubcategoryLayout（クライアント）※ use client
            └─ EstatRankingServer（サーバー）← ❌ ここで問題が発生

問題: クライアントコンポーネント(SubcategoryLayout)の中で
     サーバーコンポーネント(EstatRankingServer)を直接レンダリングできない
```

#### 2. 正しい実装には大規模なリファクタリングが必要

以下の作業が必要になります：

**Option A: SubcategoryLayoutをサーバーコンポーネント化**
```typescript
// SubcategoryLayoutからuse clientを削除
// しかし、多くのインタラクティブ機能（ViewSwitchButtons, PrefectureSelector）が含まれる
// これらを別のクライアントコンポーネントに分離する必要がある
// 影響範囲: 65個以上のコンポーネント
```

**Option B: children patternを使用**
```typescript
// ランキングコンポーネントをサーバーコンポーネントに変更
// EstatRankingServerをchildrenとしてSubcategoryLayoutに渡す
// しかし、タブ切り替えなどの複雑なロジックとの整合性が問題
```

**Option C: 段階的な移行**
```typescript
// まずSubcategoryLayoutを2つのバージョンに分割
// 1. SubcategoryLayoutServer (新規作成)
// 2. SubcategoryLayoutClient (既存)
// 各ランキングコンポーネントを個別に移行
// 推定時間: 2-3週間
```

---

### 代替案: 現在のまま最適化する

サーバーコンポーネント化を諦めて、現在のクライアントコンポーネントを最適化する方法：

#### 1. データフェッチングの最適化

```typescript
// src/lib/estat/statsdata/client.ts (新規作成)
import useSWR from 'swr';

export function useEstatData(statsDataId: string, cdCat01: string, year: string) {
  return useSWR(
    ['estat-data', statsDataId, cdCat01, year],
    () => EstatStatsDataService.getPrefectureDataByYear(statsDataId, cdCat01, year),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1分間キャッシュ
    }
  );
}
```

#### 2. Route Handlersでキャッシング

```typescript
// src/app/api/estat/route.ts (新規作成)
import { NextResponse } from 'next/server';
import { EstatStatsDataService } from '@/lib/estat/statsdata/EstatStatsDataService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statsDataId = searchParams.get('statsDataId');
  const cdCat01 = searchParams.get('cdCat01');
  const year = searchParams.get('year');

  if (!statsDataId || !cdCat01 || !year) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const data = await EstatStatsDataService.getPrefectureDataByYear(
      statsDataId,
      cdCat01,
      year
    );

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

この方法の利点：
- ✅ 既存のコードをほとんど変更しない
- ✅ キャッシングによりパフォーマンスが向上
- ✅ リスクが低い
- ✅ 段階的に実装可能

---

## トラブルシューティング

### 問題1: テーマのローディングが永続する

**症状**:
- ThemeToggleButtonがローディングスピナーを表示し続ける
- `mounted`が`false`のまま

**解決策**:
1. `src/app/layout.tsx`の30行目を確認
   - `<ThemeInitializer />`が削除されているか確認
2. `src/atoms/theme.ts`の9-11行目を確認
   - `getOnInit: true`が削除されているか確認
3. ブラウザのキャッシュをクリア
4. 開発サーバーを再起動
   ```bash
   # Ctrl+C で停止してから
   npm run dev
   ```

**デバッグ**:
```javascript
// ブラウザコンソールで確認
localStorage.getItem("theme")

// JotaiProviderが正しく動作しているか確認
// src/providers/JotaiProvider.tsxを確認
```

---

### 問題2: Phase 1-5を実行してエラーが発生した

**症状**:
```
Error: You're importing a component that needs useState.
It only works in a Client Component but none of its parents are marked with "use client"
```

または

```
Error: Cannot read properties of undefined (reading 'searchParams')
```

**解決策**:
1. **Phase 1-5の実装を元に戻す**
   ```bash
   # git で元に戻す
   git checkout src/components/ranking/EstatRanking/
   git checkout src/lib/estat/statsdata/
   git checkout src/app/[category]/[subcategory]/ranking/page.tsx
   git checkout src/types/subcategory.ts
   git checkout src/components/subcategories/
   ```

2. **Phase 0のみが適用されていることを確認**
   - `layout.tsx`の30行目が削除されている
   - `theme.ts`の`getOnInit`が削除されている

3. **サーバーコンポーネント化は保留**
   - アーキテクチャの再設計が必要
   - 別途計画を立てる

---

### 問題3: ビルドエラー

**症状**:
```
Type error: Property 'searchParams' does not exist on type 'SubcategoryRankingPageProps'
```

**解決策**:
これはPhase 1-5を実行した結果のエラーです。上記の「問題2」の解決策に従って元に戻してください。

---

## まとめ

### 実行すべきこと

✅ **Phase 0のみを実行** - テーマの修正
- `src/app/layout.tsx` の30行目を削除
- `src/atoms/theme.ts` の10行目の`getOnInit: true`を削除
- 所要時間: 5分
- リスク: ほぼゼロ
- 効果: テーマ切り替えの問題が即座に解決

### 実行すべきでないこと

❌ **Phase 1-5 - サーバーコンポーネント化**
- アーキテクチャ上の制約により、現在の実装では不可能
- 大規模なリファクタリングが必要（2-3週間）
- リスクが高い

### 今後の方針

サーバーコンポーネント化を実施する場合は、以下の順序で進めることを推奨します：

1. **Phase 0を完了** ← 今すぐ実行
2. **アーキテクチャ設計**（1-2日）
   - `SubcategoryLayout`のリファクタリング計画
   - サーバー/クライアント境界の設計
   - 段階的移行計画の策定
3. **プロトタイプ実装**（3-5日）
   - 1つのランキングコンポーネントで検証
   - パフォーマンステスト
   - 問題点の洗い出し
4. **段階的移行**（2-3週間）
   - 10-15コンポーネントずつ移行
   - 各ステップでテスト
   - ロールバック可能な状態を維持

### Phase 0のチェックリスト

実行前:
- [ ] gitで現在の状態をcommit（念のため）
- [ ] 開発サーバーが起動している

実行中:
- [ ] `src/app/layout.tsx`の30行目を削除
- [ ] `src/atoms/theme.ts`の9-11行目を1行に変更
- [ ] ファイルを保存

実行後:
- [ ] 開発サーバーを再起動
- [ ] ブラウザでテーマトグルボタンを確認
- [ ] テーマ切り替えが機能することを確認
- [ ] ブラウザコンソールにエラーがないことを確認

**以上でPhase 0は完了です。** 🎉

---

## 参考: サーバーコンポーネント化の将来計画

将来的にサーバーコンポーネント化を実施する場合の参考資料として残しておきます。

### 理想的なアーキテクチャ

```
src/
├── components/
│   ├── ranking/
│   │   ├── EstatRanking/
│   │   │   ├── EstatRankingServer.tsx      # サーバーコンポーネント
│   │   │   ├── EstatRankingClient.tsx      # クライアントコンポーネント
│   │   │   └── index.ts
│   │   └── ...
│   ├── layout/
│   │   ├── SubcategoryLayoutServer.tsx     # 新規: サーバーコンポーネント版
│   │   ├── SubcategoryLayoutClient.tsx     # 既存: クライアントコンポーネント版
│   │   └── SubcategoryLayoutShell.tsx      # 共通のUI shell
│   └── ...
├── app/
│   └── [category]/
│       └── [subcategory]/
│           └── ranking/
│               └── page.tsx                 # サーバーコンポーネント
└── lib/
    └── estat/
        └── statsdata/
            ├── server.ts                    # サーバー専用関数
            └── client.ts                    # クライアント専用hooks
```

### 必要な変更の概要

1. **SubcategoryLayoutのリファクタリング**
   - `SubcategoryLayoutServer` を作成（Header, Sidebar, Static UI）
   - インタラクティブ部分を `ViewSwitchButtons`, `PrefectureSelector` に分離
   - 既存の `SubcategoryLayout` は `SubcategoryLayoutClient` に改名

2. **EstatRankingの分離**
   - `EstatRankingServer` を作成（データ取得）
   - `EstatRankingClient` を作成（UI）

3. **型定義の更新**
   - `SubcategoryRankingPageProps` に `searchParams` を追加

4. **段階的移行**
   - 簡単なコンポーネントから順に移行
   - 各ステップでテスト

この計画は、Phase 0完了後に別途実施することを推奨します。
