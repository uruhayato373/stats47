# ShareButtons

SNSシェアボタンとURLコピー機能を提供するコンポーネント。X (Twitter)、Facebook、LINE、はてなブックマークへのシェアと、クリップボードへのURLコピー機能を提供します。

## 使い方

```tsx
import { ShareButtons } from "@/components/molecules/ShareButtons";

// 基本的な使い方（現在のURLを使用）
<ShareButtons title="統計データのページ" />

// カスタムURLを指定
<ShareButtons 
  title="統計データのページ" 
  url="https://example.com/page" 
/>

// prominentバリアントを使用
<ShareButtons 
  title="統計データのページ" 
  variant="prominent" 
/>
```

## ディレクトリ構造

このコンポーネントは**コロケーション原則**に基づいて設計されています。関連するコードはすべて`ShareButtons/`ディレクトリ内に配置されています。

```
ShareButtons/
├── hooks/               # カスタムフック（内部のみ、非公開）
│   ├── use-clipboard.ts
│   └── use-share-url.ts
├── utils/               # ユーティリティ関数（内部のみ、非公開）
│   └── generate-share-links.ts
└── index.tsx            # メインコンポーネント（公開API）
```

## 公開API

`index.tsx`からエクスポートされるもののみが公開APIです。

### コンポーネント

- `ShareButtons` - メインのシェアボタンコンポーネント

### 型

- `ShareButtonsProps` - ShareButtonsのprops型

## 内部実装について

`hooks/`と`utils/`ディレクトリ内の実装は**外部に公開されていません**。これらは内部実装であり、直接インポートしないでください。

外部からは`index.tsx`経由で公開されているAPIのみを使用してください。

## 主な機能

- **SNSシェア**: X (Twitter)、Facebook、LINE、はてなブックマークへのシェアリンクを生成
- **URLコピー**: クリップボードにURLをコピーする機能（コピー成功時に視覚的フィードバックを表示）
- **バリアント**: `simple`と`prominent`の2つの表示スタイル
  - `simple`: 控えめなアイコンボタンスタイル（デフォルト）
  - `prominent`: 目立つ色付きボタンスタイル

## Props

- `title: string` - シェアするタイトル（必須）
  - 各SNSのシェアリンクに含まれるテキスト
- `url?: string` - シェアするURL（オプション）
  - 指定しない場合、現在のページのURL（`window.location.href`）が使用されます
- `variant?: "simple" | "prominent"` - 表示スタイル（デフォルト: `"simple"`）
  - `simple`: 小さなアイコンボタン、ホバー時に色が変わる
  - `prominent`: 大きな色付きボタン、各SNSのブランドカラーが適用される
