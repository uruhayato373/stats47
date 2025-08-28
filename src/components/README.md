# Components Directory

このディレクトリには、アプリケーションで使用されるReactコンポーネントが含まれています。

## Co-location Structure

各コンポーネントは、関連するファイルと共に同じディレクトリに配置されています：

```
src/components/
├── Header/
│   ├── Header.tsx          # メインコンポーネント
│   ├── Header.story.tsx    # Storybookストーリー
│   ├── Header.test.tsx     # テストファイル（必要に応じて）
│   └── index.ts            # エクスポート（必要に応じて）
├── Footer/
│   ├── Footer.tsx
│   ├── Footer.story.tsx
│   └── ...
├── RegionSelector/
│   ├── RegionSelector.tsx
│   ├── RegionSelector.story.tsx
│   └── ...
├── EstatDataFetcher/
│   ├── EstatDataFetcher.tsx
│   ├── EstatDataFetcher.story.tsx
│   └── ...
└── StatisticsDisplay/
    ├── StatisticsDisplay.tsx
    ├── StatisticsDisplay.story.tsx
    └── ...
```

## Storybook Integration

各コンポーネントには、Storybookストーリーが含まれており、以下の方法でアクセスできます：

```bash
# Storybookを起動
npm run storybook

# ビルド版を作成
npm run build-storybook
```

## コンポーネント一覧

### Header
- **ファイル**: `Header.tsx`
- **ストーリー**: `Header.story.tsx`
- **説明**: アプリケーション全体のヘッダーナビゲーション

### Footer
- **ファイル**: `Footer.tsx`
- **ストーリー**: `Footer.story.tsx`
- **説明**: アプリケーション全体のフッター情報

### RegionSelector
- **ファイル**: `RegionSelector.tsx`
- **ストーリー**: `RegionSelector.story.tsx`
- **説明**: 地域（都道府県）選択コンポーネント

### EstatDataFetcher
- **ファイル**: `EstatDataFetcher.tsx`
- **ストーリー**: `EstatDataFetcher.story.tsx`
- **説明**: e-Stat APIからのデータ取得

### StatisticsDisplay
- **ファイル**: `StatisticsDisplay.tsx`
- **ストーリー**: `StatisticsDisplay.story.tsx`
- **説明**: 統計データの可視化

## 開発ガイドライン

1. **新しいコンポーネントを作成する際は**、必ずStorybookストーリーも作成してください
2. **コンポーネントの変更時は**、関連するストーリーも更新してください
3. **テストファイル**は必要に応じて追加してください
4. **index.ts**ファイルでエクスポートを管理してください（必要に応じて）

## Storybookの利点

- **コンポーネントの独立した開発・テスト**
- **様々な状態での表示確認**
- **レスポンシブデザインのテスト**
- **アクセシビリティの確認**
- **開発者間でのコンポーネント共有**
