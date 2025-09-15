# Choropleth機能のe-STAT Response統合計画

## 概要

現在、`/choropleth`と`/estat/response`の2つのページが存在し、どちらもe-STAT APIからデータを取得して表示する機能を提供しています。**choroplethページは削除し、その機能をestat/responseに完全統合することで、コードの重複を排除し、より効率的な管理を実現します。**

## 現状分析

### 共通点

#### 1. データフェッチ機能
- **両方とも**：`EstatDataFetcher`コンポーネントを使用
- **両方とも**：同じAPI (`/api/estat/data`) を呼び出し
- **両方とも**：`EstatDataFormatter`でデータ変換
- **両方とも**：タイムアウト処理とエラーハンドリング

#### 2. UI構造
- **両方とも**：Header + Sidebar + メインコンテンツ
- **両方とも**：データ取得フォーム + 結果表示
- **両方とも**：ローディング・エラー状態の管理

#### 3. 技術スタック
- **両方とも**：React + TypeScript
- **両方とも**：同じ状態管理パターン
- **両方とも**：同じAPI型定義

### 相違点

#### 1. データ表示方法
- **choropleth**: コロプレス地図での可視化
- **estat/response**: テーブル形式での詳細表示

#### 2. データ加工
- **choropleth**: 地図用データセット（統計サマリー付き）
- **estat/response**: 生データとフォーマットデータの両方

#### 3. 対象ユーザー
- **choropleth**: 視覚的な分析を求めるユーザー
- **estat/response**: 詳細なデータ分析を求めるユーザー

## 統合方針

### 採用方針: 表示モード切り替え方式 + choroplethページ削除

#### 概要
`/estat/response`ページを拡張し、表示モードの切り替え機能を追加。**choroplethページは完全に削除し、その機能はestat/responseに移行する。**

#### 実装案
```
/estat/response (統合後の単一ページ)
├── データ取得フォーム (共通)
├── 表示モード選択
│   ├── [テーブル表示] (既存)
│   └── [地図表示] (choroplethから移行)
└── 結果表示エリア
    ├── EstatDataDisplay (テーブルモード)
    └── ChoroplethDisplay (地図モード)

/choropleth (削除対象)
└── ※完全削除、estat/responseに統合
```

#### メリット
- **ページ数削減**: 維持するページが1つだけ
- **URL体系簡素化**: `/estat/response?mode=map`
- **コード重複完全排除**: 重複コードゼロ
- **保守コスト削減**: 単一ページのメンテナンスのみ
- **ユーザー体験統一**: 一貫したインターフェース

## 統合実装プラン

### Phase 1: estat/response拡張 (1-2日)
1. **表示モード型定義**
   ```typescript
   type DisplayMode = 'table' | 'map';
   ```

2. **モード選択UIの追加**
   ```typescript
   // タブまたはボタンベースの切り替えUI
   <ModeSelector currentMode={mode} onModeChange={setMode} />
   ```

3. **URLパラメータでのモード制御**
   ```typescript
   // ?mode=map でコロプレス地図表示
   const mode = searchParams.get('mode') || 'table';
   ```

### Phase 2: Choropleth機能移行 (1-2日)
1. **ChoroplethDisplayコンポーネントの移行**
   - `/components/choropleth/` → `/components/estat/visualization/`

2. **地図表示ロジックの統合**
   ```typescript
   // estat/responseページ内で条件分岐
   {mode === 'table' && <EstatDataDisplay data={data} />}
   {mode === 'map' && <ChoroplethDisplay dataset={mapDataset} />}
   ```

### Phase 3: choroplethページ削除 (1日)
1. **ディレクトリ完全削除**
   ```bash
   rm -rf /src/app/choropleth/
   rm -rf /src/components/choropleth/
   ```

2. **リダイレクト設定** (Next.js middleware)
   ```typescript
   // /choropleth → /estat/response?mode=map
   if (pathname === '/choropleth') {
     return NextResponse.redirect('/estat/response?mode=map');
   }
   ```

### Phase 4: 最終調整 (0.5日)
1. **ナビゲーション更新**
2. **ドキュメント更新**
3. **テスト実行**

## 技術的考慮事項

### 1. パフォーマンス
- **遅延ローディング**: 選択されたモードのみロード
- **メモ化**: データ変換結果のキャッシュ
- **仮想化**: 大量データの効率的表示

### 2. UX設計
- **デフォルトモード**: テーブル表示
- **モード切り替え時**: データを再利用
- **URL同期**: モード状態をURLで管理

### 3. 後方互換性
- **既存URL**: `/choropleth` → `/estat/response?mode=map` (自動リダイレクト)
- **ブックマーク**: middleware でシームレス移行
- **SEO**: 301リダイレクト設定

## ファイル構成案

### 統合後の構造
```
src/
├── app/
│   ├── estat/
│   │   └── response/
│   │       └── page.tsx (統合ページ)
│   └── choropleth/ (削除済み)
├── components/
│   ├── estat/
│   │   ├── data/
│   │   │   └── EstatModeSelector.tsx (新規)
│   │   └── visualization/
│   │       ├── EstatTableView.tsx (既存)
│   │       └── EstatMapView.tsx (choroplethから移行)
│   └── choropleth/ (削除済み)
└── middleware.ts (リダイレクト設定)
```

## 削除対象ファイル

### 完全削除リスト
```
/src/app/choropleth/
├── page.tsx
└── layout.tsx (もしあれば)

/src/components/choropleth/
├── index.ts
├── ChoroplethContainer/
├── ChoroplethDisplay/
└── ChoroplethInstructions/
```

## 移行スケジュール (短縮版)

### Day 1-2: 統合実装
- [ ] ModeSelector UI作成
- [ ] estat/responseにモード切り替え機能追加
- [ ] ChoroplethDisplayコンポーネント移行

### Day 3: 削除・リダイレクト
- [ ] choroplethページ・コンポーネント削除
- [ ] middleware でリダイレクト設定
- [ ] ナビゲーション更新

### Day 4: 検証・完了
- [ ] 動作確認・テスト
- [ ] ドキュメント最終更新
- [ ] 完了報告

## 期待効果

### 開発効率
- **コード重複完全削除**: 約50%のコード削減 (choroplethページ削除により)
- **メンテナンス性向上**: 単一ソースの真実
- **機能追加効率**: 新しい表示モード追加が容易
- **ビルド時間短縮**: ページ数削減による

### ユーザー体験
- **一貫性**: 統一されたインターフェース
- **発見性**: 1つのページで複数の表示方法
- **効率性**: データ取得の重複なし
- **URL簡素化**: `/estat/response?mode=map` でアクセス

### 技術負債解消
- **重複コードの完全削除**
- **統一されたエラーハンドリング**
- **一貫したデータフロー**
- **ディレクトリ構造の整理**

## 結論

**choroplethページを削除し、estat/responseに完全統合する方針**を採用します。これにより：

1. **保守コストを最小化** - 維持するページが1つのみ
2. **コード重複を完全排除** - DRY原則の徹底
3. **ユーザー体験を統一** - 一貫したインターフェース提供
4. **URL体系を簡素化** - `/estat/response?mode=map`

4日間の短期間で完了でき、リスクを最小化しながら効率的な統合を実現できます。