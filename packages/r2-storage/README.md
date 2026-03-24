# @stats47/r2-storage

Cloudflare R2ストレージとの連携を提供するパッケージ。ファイルのアップロード、取得、削除、一覧表示などの操作を簡単に実行できます。

## 概要

このパッケージは、Cloudflare R2（S3互換オブジェクトストレージ）へのアクセスを簡素化します。通常のR2バケットとブログ専用バケットの両方をサポートしています。

## 主な機能

### 1. ファイル操作

- **保存**: JSON、文字列、バッファをR2に保存
- **取得**: JSON、文字列、バイナリデータとして取得
- **削除**: 単一または複数ファイルの削除
- **一覧取得**: プレフィックスを指定してファイル一覧を取得

### 2. 環境検出
- **Production**: Cloudflare R2バケットを使用
- **Development**: ローカルの `.wrangler/state/v3/r2/` を使用

## インストール

このパッケージはモノレポ内で使用されます。

## 使い方

### ファイルの保存

```typescript
import { saveToR2 } from "@stats47/r2-storage/server";

// JSONオブジェクトを保存
await saveToR2({
  key: "ranking/prefecture/annual-sales/metadata.json",
  body: { title: "年間売上", unit: "億円" },
  contentType: "application/json"
});

// 文字列を保存
await saveToR2({
  key: "data/report.txt",
  body: "レポート内容",
  contentType: "text/plain"
});
```

### ファイルの取得

```typescript
import { fetchFromR2AsJson, fetchFromR2AsString } from "@stats47/r2-storage/server";

// JSONとして取得
const metadata = await fetchFromR2AsJson<RankingMetadata>(
  "ranking/prefecture/annual-sales/metadata.json"
);

// 文字列として取得
const content = await fetchFromR2AsString("data/report.txt");
```

### ファイルの削除

```typescript
import { deleteFromR2, deleteMultipleFromR2 } from "@stats47/r2-storage/server";

// 単一ファイル削除
await deleteFromR2("ranking/old-data.json");

// 複数ファイル削除
await deleteMultipleFromR2([
  "ranking/2020/stats.json",
  "ranking/2019/stats.json"
]);

// ディレクトリ（プレフィックス）単位での一括削除
// 指定したプレフィックスに一致するすべてのオブジェクトを削除します
await deletePrefixFromR2("ranking/old-folder/");
```

### ファイル一覧の取得

```typescript
import { listFromR2WithSize } from "@stats47/r2-storage/server";

// プレフィックスを指定して一覧取得
const files = await listFromR2WithSize({ prefix: "ranking/prefecture/" });

files.forEach(file => {
  console.log(`${file.Key} - ${file.Size} bytes`);
});
```


## アーキテクチャ

### ディレクトリ構成

```
packages/r2-storage/
├── src/
│   ├── lib/
│   │   ├── clients/          # S3クライアント生成
│   │   ├── operations/       # CRUD操作（CRUD、一覧表示、一括削除など）
│   │   ├── utils/            # ユーティリティ関数
│   │   └── errors/           # エラーハンドリング
│   ├── services/             # バケット使用量、同期など
│   ├── types.ts              # 型定義
│   ├── index.ts              # クライアント向けエクスポート
│   └── server.ts             # サーバー向けエクスポート
└── README.md
```

### 環境検出

パッケージは自動的に実行環境を検出します:

- **Production**: Cloudflare R2バケットを使用
- **Development**: ローカルの `.wrangler/state/v3/r2/` を使用

### エラーハンドリング

すべての操作は統一されたエラーハンドリングを提供:

```typescript
import { handleR2Error } from "@stats47/r2-storage/server";

try {
  await saveToR2({ key: "test.json", body: data });
} catch (error) {
  handleR2Error(error, "test.json", "saveToR2");
}
```

## API リファレンス

### 通常バケット操作

| 関数 | 説明 | 戻り値 |
|:-----|:-----|:-------|
| `saveToR2(options)` | ファイルを保存 | `Promise<void>` |
| `fetchFromR2(key)` | バイナリデータとして取得 | `Promise<ArrayBuffer \| null>` |
| `fetchFromR2AsJson<T>(key)` | JSONとして取得 | `Promise<T \| null>` |
| `fetchFromR2AsString(key)` | 文字列として取得 | `Promise<string \| null>` |
| `deleteFromR2(key)` | ファイルを削除 | `Promise<void>` |
| `deleteMultipleFromR2(keys)` | 複数ファイルを削除 | `Promise<void>` |
| `deletePrefixFromR2(prefix)` | プレフィックス指定で一括削除 | `Promise<void>` |
| `listFromR2(options)` | ファイル一覧を取得 | `Promise<string[]>` |
| `listFromR2WithSize(options)` | サイズ付きで一覧取得 | `Promise<Array>` |


### サービス

| 関数 | 説明 |
|:-----|:-----|
| `getR2BucketUsage()` | バケット使用量の統計を取得 |
| `syncR2Buckets(options)` | ローカルとR2を同期 |

## ローカル開発データ

ローカル環境では `.local/r2/` をR2の同期先として使用します（`.gitignore` 対象）。

```
.local/
├── d1/        # D1データ（wrangler persist先）
└── r2/        # R2同期データ
    ├── ranking/prefecture/   # ランキング画像
    ├── seeds/                # シードデータ（*.json）
    └── ...
```

同期スクリプトの詳細は [src/scripts/README.md](./src/scripts/README.md) を参照してください。

## 環境変数

```env
# Cloudflare R2 設定
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=stats47
R2_BUCKET_NAME_BLOG=stats47-blog
```

## テスト

```bash
# 単体テスト
npm test

# テストカバレッジ
npm run test:coverage
```

## 関連ドキュメント

- [R2ストレージ移行計画](/docs/01_技術設計/08_R2ストレージ移行計画.md)
- [Cloudflare R2 公式ドキュメント](https://developers.cloudflare.com/r2/)

## ライセンス

このパッケージはプロジェクト内部で使用されます。
