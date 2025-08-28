# Components Directory

このディレクトリには、アプリケーションで使用されるReactコンポーネントが含まれています。

## アトミックデザイン構造

アトミックデザインの5つの階層に基づいて、コンポーネントが整理されています：

```
src/components/
├── atoms/                  # 最小単位のコンポーネント
│   ├── RegionSelector.tsx
│   ├── RegionSelector.story.tsx
│   └── README.md
├── molecules/              # atomsを組み合わせたコンポーネント
│   ├── StatisticsDisplay.tsx
│   ├── StatisticsDisplay.story.tsx
│   └── README.md
├── organisms/              # moleculesを組み合わせた大きなコンポーネント
│   ├── EstatDataFetcher.tsx
│   ├── EstatDataFetcher.story.tsx
│   └── README.md
├── templates/              # ページレイアウトのテンプレート
│   └── README.md
├── pages/                  # 特定のページ用のコンポーネント
│   └── README.md
├── layout/                 # グローバルレイアウト
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ...
├── charts/                 # チャート関連コンポーネント
├── maps/                   # マップ関連コンポーネント
├── ui/                     # UI関連コンポーネント
└── README.md               # このファイル
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

### Atoms（原子）
- **RegionSelector**: 地域（都道府県）選択コンポーネント
  - **ファイル**: `atoms/RegionSelector.tsx`
  - **ストーリー**: `atoms/RegionSelector.story.tsx`

### Molecules（分子）
- **StatisticsDisplay**: 統計データの可視化コンポーネント
  - **ファイル**: `molecules/StatisticsDisplay.tsx`
  - **ストーリー**: `molecules/StatisticsDisplay.story.tsx`

### Organisms（有機体）
- **EstatDataFetcher**: e-Stat APIからのデータ取得コンポーネント
  - **ファイル**: `organisms/EstatDataFetcher.tsx`
  - **ストーリー**: `organisms/EstatDataFetcher.story.tsx`

### Layout（レイアウト）
- **Header**: アプリケーション全体のヘッダーナビゲーション
  - **ファイル**: `layout/Header.tsx`
- **Footer**: アプリケーション全体のフッター情報
  - **ファイル**: `layout/Footer.tsx`

## 開発ガイドライン

### アトミックデザインの原則
1. **Atoms**: 最小単位の再利用可能なコンポーネント
2. **Molecules**: Atomsを組み合わせた機能的なコンポーネント
3. **Organisms**: Moleculesを組み合わせた複雑なコンポーネント
4. **Templates**: ページレイアウトのテンプレート
5. **Pages**: 特定のページ用のコンポーネント

### 実装ルール
1. **新しいコンポーネントを作成する際は**、適切な階層に配置し、Storybookストーリーも作成してください
2. **コンポーネントの変更時は**、関連するストーリーも更新してください
3. **テストファイル**は必要に応じて追加してください
4. **index.ts**ファイルでエクスポートを管理してください（必要に応じて）
5. **依存関係**は上位階層のコンポーネントのみをインポートしてください

## Storybookの利点

- **コンポーネントの独立した開発・テスト**
- **様々な状態での表示確認**
- **レスポンシブデザインのテスト**
- **アクセシビリティの確認**
- **開発者間でのコンポーネント共有**
