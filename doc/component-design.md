# コンポーネント設計書

## 概要

このドキュメントでは、stats47 プロジェクトのコンポーネント設計について説明します。

## コンポーネント一覧

### e-Stat コンポーネント構造

e-Stat 関連のコンポーネントは、機能別に以下の 3 つのディレクトリに整理されています：

```
src/components/estat/
├── metadata/                    # メタデータ関連コンポーネント
│   ├── EstatMetadataPageHeader.tsx
│   ├── EstatMetadataTabNavigation.tsx
│   ├── EstatMetadataTabContent.tsx
│   ├── EstatMetadataDisplay.tsx
│   ├── SavedMetadataDisplay.tsx
│   ├── MetadataSaver.tsx
│   ├── MetadataActions.tsx
│   ├── MetaInfoCard.tsx
│   ├── MetaInfoFetcher.tsx
│   └── index.ts
├── data/                       # データ表示関連コンポーネント
│   ├── EstatDataDisplay/
│   ├── EstatDataFetcher/
│   ├── EstatDataTable.tsx
│   └── index.ts
├── visualization/              # 可視化関連コンポーネント
│   ├── ChoroplethMap.tsx
│   ├── YearSelector.tsx
│   └── index.ts
└── index.ts                    # 全体のエクスポート管理
```

### EstatMetadataPage コンポーネント群

e-Stat メタ情報管理ページのコンポーネント群。元の単一ファイル（183 行）を以下の 4 つのコンポーネントに分割して、保守性と再利用性を向上させました。

#### 1. EstatMetadataPageHeader

ページヘッダー部分を担当するコンポーネント。

**責任**:

- ページタイトルの表示
- アクションボタン（更新、e-STAT API リンク）の表示
- ローディング状態の管理

**Props**:

```typescript
interface EstatMetadataPageHeaderProps {
  loading: boolean;
  currentStatsId: string;
  onRefresh: () => void;
}
```

#### 2. EstatMetadataTabNavigation

タブナビゲーション部分を担当するコンポーネント。

**責任**:

- タブの定義と表示
- アクティブタブの管理
- タブ切り替えの処理

**Props**:

```typescript
interface EstatMetadataTabNavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}
```

**タブ定義**:

- `fetch`: メタ情報取得
- `save`: メタ情報保存
- `saved`: 保存済データ確認

#### 3. EstatMetadataTabContent

タブコンテンツのレンダリング部分を担当するコンポーネント。

**責任**:

- 各タブのコンテンツレンダリング
- タブ別のロジック管理

**Props**:

```typescript
interface EstatMetadataTabContentProps {
  activeTab: TabId;
  metaInfo: EstatMetaInfoResponse | null;
  loading: boolean;
  error: string | null;
  onFetchMetaInfo: (statsDataId: string) => void;
}
```

#### 4. EstatMetadataPage（リファクタリング後）

メインページコンポーネント。分割されたコンポーネントを統合。

**責任**:

- 状態管理（metaInfo, loading, error, currentStatsId, activeTab）
- イベントハンドリング（handleFetchMetaInfo, handleRefresh, handleTabChange）
- 分割されたコンポーネントの統合

**メリット**:

- **単一責任の原則**: 各コンポーネントが明確な責任を持つ
- **再利用性**: 各コンポーネントを他のページでも使用可能
- **保守性**: 変更時の影響範囲が限定的
- **テスタビリティ**: 各コンポーネントを個別にテスト可能
- **可読性**: コードの意図が明確

### SavedMetadataDisplay

保存された e-STAT メタデータを表示するコンポーネント。

#### 設計方針

- **サーバーコンポーネント**: 基本表示部分はサーバーサイドでレンダリング
- **クライアントコンポーネント分離**: インタラクティブ部分（更新ボタン、エラー時の再試行）は別コンポーネントとして分離
- **ハイブリッド構成**: サーバーコンポーネント内にクライアントコンポーネントを配置

#### コンポーネント構成

1. **SavedMetadataDisplay** (サーバーコンポーネント)

   - データの取得と表示
   - エラーハンドリング
   - 基本的なレイアウト

2. **MetadataActions** (クライアントコンポーネント)
   - 更新ボタン
   - エラー時の再試行ボタン
   - インタラクティブな機能

#### メリット

- **パフォーマンス向上**: サーバーサイドレンダリングによる初期表示速度の向上
- **SEO 改善**: サーバーサイドで HTML が生成される
- **バンドルサイズ削減**: クライアントサイドのコードが減少
- **保守性向上**: 関心の分離によるコードの可読性向上

#### 使用方法

```tsx
// サーバーコンポーネントとして使用
<SavedMetadataDisplay />

// 初期データを渡す場合
<SavedMetadataDisplay
  initialMetadata={metadata}
  initialError={error}
/>
```

#### 技術的詳細

- Next.js 15 App Router 対応
- サーバーサイドでの D1 データベースアクセス
- クライアントサイドでのインタラクション処理
- ダークモード対応のスタイリング

## スタイル管理

### アプローチ

プロジェクトでは、**カスタムフック `useStyles`** を使用したスタイル管理を採用しています。これにより、以下の利点を実現しています：

- **型安全性**: TypeScript でのスタイル管理
- **一貫性**: プロジェクト全体での統一されたデザイン
- **保守性**: スタイルの変更が一箇所で可能
- **再利用性**: 共通のスタイルパターンを簡単に適用

### 使用方法

#### 1. 基本的な使用方法

```typescript
import { useStyles } from "@/hooks/useStyles";

export default function MyComponent() {
  const styles = useStyles();

  return (
    <div className={styles.card.base}>
      <h2 className={styles.heading.lg}>タイトル</h2>
      <p className={styles.text.body}>コンテンツ</p>
      <button className={styles.button.primary}>ボタン</button>
    </div>
  );
}
```

#### 2. 利用可能なスタイル

```typescript
const styles = useStyles();

// レイアウト
styles.layout.section; // space-y-6
styles.layout.row; // space-y-4
styles.layout.grid; // grid grid-cols-1 md:grid-cols-2 gap-4
styles.layout.flex; // flex items-center gap-2

// カード
styles.card.base; // 基本カード（padding: 6）
styles.card.compact; // コンパクトカード（padding: 4）

// ボタン
styles.button.primary; // プライマリボタン（インディゴ）
styles.button.secondary; // セカンダリボタン（グレー）
styles.button.small; // 小さいボタン

// 入力フィールド
styles.input.base; // 基本入力フィールド
styles.input.disabled; // 無効状態

// メッセージ - 一般的なcalloutスタイルに準拠
styles.message.success; // 成功メッセージ（緑系）
styles.message.error; // エラーメッセージ（赤系）
styles.message.info; // 情報メッセージ（青系）
styles.message.warning; // 警告メッセージ（琥珀系）

// メッセージテキスト色 - 一般的なcalloutスタイルに準拠
styles.messageText.success; // 成功メッセージテキスト（緑系）
styles.messageText.error; // エラーメッセージテキスト（赤系）
styles.messageText.info; // 情報メッセージテキスト（青系）
styles.messageText.warning; // 警告メッセージテキスト（琥珀系）

// ヘッダー
styles.header.primary; // プライマリヘッダー（インディゴ）
styles.header.secondary; // セカンダリヘッダー（グレー）

// ラベル
styles.label.base; // 基本ラベル
styles.label.required; // 必須ラベル（*付き）

// 見出し
styles.heading.lg; // 大見出し（text-lg）
styles.heading.md; // 中見出し（text-base）
styles.heading.sm; // 小見出し（text-sm）

// テキスト
styles.text.primary; // プライマリテキスト（インディゴ）
styles.text.secondary; // セカンダリテキスト
styles.text.body; // 本文テキスト
styles.text.muted; // 無効テキスト
```

#### 3. スタイルの拡張

新しいスタイルを追加する場合は、`src/hooks/useStyles.ts`を編集します：

```typescript
export const useStyles = () => {
  const styles = {
    // 既存のスタイル...

    // 新しいスタイル
    newComponent: {
      base: "bg-blue-100 border border-blue-300 rounded-lg p-4",
      variant: "bg-blue-200 border-blue-400",
    },
  };

  return styles;
};
```

### 4. 配色システム

#### メッセージタイプ別の配色

- **Success（成功）**: 緑系（`bg-green-50`, `text-green-800`）
- **Error（エラー）**: 赤系（`bg-red-50`, `text-red-800`）
- **Info（情報）**: 青系（`bg-blue-50`, `text-blue-800`）
- **Warning（警告）**: 琥珀系（`bg-amber-50`, `text-amber-800`）

#### ダークモード対応

すべてのスタイルはダークモードに対応しており、`dark:`プレフィックスを使用して適切な色を設定しています。

## 共通コンポーネント

### Message コンポーネント

#### 概要

メッセージ表示用の共通コンポーネントで、成功、エラー、情報、警告の 4 種類のメッセージタイプに対応しています。

#### 特徴

- **4 種類のメッセージタイプ**: success, error, info, warning
- **一般的な callout スタイル**: 標準的な UI パターンに準拠
- **ダークモード対応**: ライト/ダーク両方のテーマで最適化
- **カスタマイズ可能**: 追加の CSS クラス名を指定可能

#### 使用方法

```tsx
import Message from "@/components/common/Message";

// 成功メッセージ
<Message type="success" message="保存が完了しました" />

// エラーメッセージ
<Message type="error" message="エラーが発生しました" />

// カスタムクラス付き
<Message type="info" message="情報メッセージ" className="mt-4 shadow-lg" />
```

#### 実装場所

- **コンポーネント**: `src/components/common/Message.tsx`
- **ストーリー**: `src/components/common/Message.stories.tsx`
- **スタイル**: `src/hooks/useStyles.ts`の`message`と`messageText`セクション

## コンポーネント開発環境

### Storybook 統合

#### 概要

コンポーネントの開発・テスト・ドキュメント化のために Storybook 9.1.3 を統合しています。

#### 設定

- **メイン設定**: `.storybook/main.ts`
- **プレビュー設定**: `.storybook/preview.tsx`
- **スタイル**: `.storybook/storybook.css`
- **Tailwind CSS 対応**: プロジェクトのスタイルが正しく適用

#### 使用方法

```bash
# Storybook起動
npm run storybook

# ブラウザで http://localhost:6006 にアクセス
```

#### 利用可能なアドオン

- **@storybook/addon-a11y**: アクセシビリティチェック
- **@storybook/addon-vitest**: テスト実行
- **@storybook/addon-docs**: 自動ドキュメント生成

### EstatDataDisplay コンポーネント群

#### 概要

e-Stat API のレスポンスデータを表示するためのコンポーネント群です。各コンポーネントは個別のディレクトリに分離され、Storybook とテストファイルが含まれています。

#### コンポーネント構成

```
src/components/estat/EstatDataDisplay/
├── EstatDataDisplay.tsx        # メインコンポーネント
├── EstatDataDisplay.stories.tsx
├── EstatDataDisplay.test.tsx
├── index.ts                    # エクスポート管理
└── components/                 # サブコンポーネント群
    ├── EstatOverview/          # 概要表示
    │   ├── EstatOverview.tsx
    │   ├── EstatOverview.stories.tsx
    │   ├── EstatOverview.test.tsx
    │   └── index.ts
    ├── EstatCategoriesTable/   # カテゴリテーブル
    │   ├── EstatCategoriesTable.tsx
    │   ├── EstatCategoriesTable.stories.tsx
    │   ├── EstatCategoriesTable.test.tsx
    │   └── index.ts
    ├── EstatAreasTable/        # 地域テーブル
    │   ├── EstatAreasTable.tsx
    │   ├── EstatAreasTable.stories.tsx
    │   ├── EstatAreasTable.test.tsx
    │   └── index.ts
    ├── EstatYearsTable/        # 年度テーブル
    │   ├── EstatYearsTable.tsx
    │   ├── EstatYearsTable.stories.tsx
    │   ├── EstatYearsTable.test.tsx
    │   └── index.ts
    ├── EstatValuesTable/       # 値テーブル
    │   ├── EstatValuesTable.tsx
    │   ├── EstatValuesTable.stories.tsx
    │   ├── EstatValuesTable.test.tsx
    │   └── index.ts
    └── EstatRawData/           # Raw JSON表示
        ├── EstatRawData.tsx
        ├── EstatRawData.stories.tsx
        ├── EstatRawData.test.tsx
        └── index.ts
```

#### 各コンポーネントの役割

1. **EstatDataDisplay**: メインコンポーネント

   - タブ形式で各データ表示コンポーネントを統合
   - ローディング、エラー、データなし状態の処理
   - JSON ダウンロード機能

2. **EstatOverview**: 概要表示

   - 基本情報とデータ詳細を折りたたみ可能なセクションで表示
   - ステータス、統計表 ID、統計表名、表題の表示
   - データ件数、分類項目数、更新日時の表示

3. **EstatCategoriesTable**: カテゴリテーブル

   - カテゴリ 01 から 05 までの分類コードを表形式で表示
   - DataTable コンポーネントを使用

4. **EstatAreasTable**: 地域テーブル

   - 地域コードと地域名を表形式で表示
   - DataTable コンポーネントを使用

5. **EstatYearsTable**: 年度テーブル

   - 年度コードと説明を表形式で表示
   - DataTable コンポーネントを使用

6. **EstatValuesTable**: 値テーブル

   - カテゴリ、地域、年度、値、単位を表形式で表示
   - カスタムレンダリング機能付き
   - DataTable コンポーネントを使用

7. **EstatRawData**: Raw JSON 表示
   - JSON データを整形して表示
   - コピーボタンでクリップボードにコピー可能

#### 開発・テスト

各コンポーネントには以下のファイルが含まれています：

- **コンポーネントファイル**: メインの実装
- **Storybook ファイル**: コンポーネントの開発・テスト用ストーリー
- **テストファイル**: ユニットテスト
- **index.ts**: エクスポート管理

#### 使用方法

```tsx
import { EstatDataDisplay } from "@/components/estat/EstatDataDisplay";

// メインコンポーネントの使用
<EstatDataDisplay data={apiResponse} loading={loading} error={error} />;

// 個別コンポーネントの使用
import { EstatOverview } from "@/components/estat/EstatDataDisplay";

<EstatOverview data={apiResponse} />;
```

## D1 統合

### データ保存戦略

#### 開発環境

- **保存先**: Cloudflare D1（本番環境と同じ）
- **利点**:
  - 本番環境との一貫性
  - ローカル PC の負荷軽減
  - 実際の API 制限の確認
- **処理方式**: チャンク分割処理（50 件ずつ）
- **待機時間**: チャンク間で 200ms（API 制限対策）

#### 本番環境

- **保存先**: Cloudflare D1
- **利点**:
  - スケーラビリティ
  - グローバル配信
  - 高可用性
- **処理方式**: チャンク分割処理（50 件ずつ）
- **待機時間**: チャンク間で 200ms（API 制限対策）

### チャンク処理の詳細

```typescript
// チャンクサイズ: 50件（Cloudflare D1の制限に最適化）
const CHUNK_SIZE = 50;

// チャンク分割
const chunks = [];
for (let i = 0; i < data.length; i += CHUNK_SIZE) {
  chunks.push(data.slice(i, i + CHUNK_SIZE));
}

// チャンクごとの処理
for (const [chunkIndex, chunk] of chunks.entries()) {
  // チャンク内で並列処理
  const chunkPromises = chunk.map(async (item) => {
    // 個別データの処理
  });

  // チャンク内の処理完了を待機
  const chunkResults = await Promise.all(chunkPromises);

  // 次のチャンクまで待機（API制限対策）
  if (chunkIndex < chunks.length - 1) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}
```

## データ統合

### e-Stat API 統合

#### 概要

e-Stat API からメタデータを取得し、Cloudflare D1 データベースに保存する機能を実装しています。

#### データフロー

1. **ユーザー入力** → 統計表 ID を入力
2. **API 呼び出し** → `/api/estat/metadata/save`に POST
3. **データ取得** → e-Stat API からメタデータを取得
4. **データ変換** → CSV 形式に変換
5. **D1 保存** → Cloudflare D1 に保存
6. **結果表示** → Message コンポーネントで成功/エラー表示

#### 実装場所

- **API ルート**: `src/app/api/estat/metadata/save/route.ts`
- **フロントエンド**: `src/components/estat/MetadataSaver.tsx`
- **データ変換**: `src/lib/estat/data-transformer.ts`
- **データベース操作**: `src/lib/estat/metadata-database.ts`

### Cloudflare D1 統合

#### データベース設定

- **データベース名**: `estat-db`
- **バインディング**: `ESTAT_DB`
- **スキーマ**: `database/schemas/main.sql`

#### セットアップ

```bash
# D1データベースの作成
npx wrangler d1 create estat-db

# ローカル開発用のD1インスタンスを起動
npx wrangler d1 execute estat-db --local --file=./database/schemas/main.sql
```

## ベストプラクティス

### スタイル管理

1. **useStyles フックの使用**: インラインスタイルは避ける
2. **一貫性の維持**: 既存のスタイルパターンを再利用
3. **ダークモード対応**: すべてのスタイルでダークモードを考慮
4. **レスポンシブデザイン**: モバイルファーストのアプローチ

### コンポーネント設計

1. **単一責任の原則**: 各コンポーネントは一つの責任を持つ
2. **再利用性**: 共通の UI パターンは共通コンポーネントとして実装
3. **型安全性**: TypeScript の型定義を活用
4. **エラーハンドリング**: 適切なエラー状態とユーザーフィードバック

### テスト・開発

1. **Storybook での開発**: コンポーネントの独立した開発・テスト
2. **アクセシビリティ**: a11y アドオンを使用したチェック
3. **パフォーマンス**: 不要な再レンダリングを避ける
4. **ドキュメント**: コンポーネントの使用方法を明確化

## トラブルシューティング

### よくある問題

1. **スタイルが適用されない**

   - `useStyles`フックが正しくインポートされているか確認
   - Tailwind CSS の設定を確認

2. **Storybook でスタイルが表示されない**

   - `.storybook/storybook.css`の設定を確認
   - `tailwind.config.ts`に Storybook パスが含まれているか確認

3. **D1 データベース接続エラー**

   - `wrangler.toml`の設定を確認
   - ローカル D1 インスタンスが起動しているか確認

4. **e-Stat API エラー**
   - API キーが正しく設定されているか確認
   - 統計表 ID が正しいか確認

### デバッグ方法

1. **ブラウザの開発者ツール**: CSS と JavaScript のエラーを確認
2. **Storybook のコンソール**: コンポーネントのエラーを確認
3. **API レスポンス**: ネットワークタブで API 呼び出しを確認
4. **D1 ログ**: ローカル D1 インスタンスのログを確認
