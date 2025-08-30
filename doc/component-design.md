# コンポーネント設計

## 概要

地域統計ダッシュボードは、React 19 の最新機能を活用したコンポーネントベースのアーキテクチャを採用しています。各コンポーネントは単一責任の原則に従い、再利用可能で保守しやすい設計となっています。

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
