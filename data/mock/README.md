# モックデータディレクトリ

## 概要

このディレクトリには、開発・テスト用のモックデータが格納されます。

## 注意事項

⚠️ **このディレクトリの JSON ファイルは Git 管理対象です**

- 複数端末での共有のため、Git 管理対象としています
- ただし、Cloudflare へのデプロイ時は除外されます

## ディレクトリ構造

```
data/mock/
├── metainfo/                    # メタ情報モックデータ
│   ├── prefecture/              # 都道府県メタ情報
│   └── municipality/            # 市区町村メタ情報
├── statsdata/                   # 統計データモックデータ
│   ├── prefecture/              # 都道府県統計データ
│   └── municipality/            # 市区町村統計データ
├── statslist/                   # 統計表リストモックデータ
├── fixtures/                    # テスト用フィクスチャ
│   ├── minimal/                 # 最小データ
│   ├── small/                   # 小データ
│   └── medium/                  # 中データ
└── catalog.json                 # データカタログ
```

## データの取得方法

### 方法 1: CLI コマンドでダウンロード

```bash
# 単一のデータセットをダウンロード
npm run mock:download -- 0000010101 prefecture

# 複数のデータセットをダウンロード
npm run mock:download -- 0000010101 0000010102 prefecture

# 市区町村データをダウンロード
npm run mock:download -- 0000010101 municipality
```

### 方法 2: 手動ダウンロード

1. e-Stat API から直接データを取得
2. 適切なディレクトリに JSON ファイルを保存
3. フォーマットスクリプトを実行

```bash
npm run mock:format -- 0000010101
```

## データの更新

```bash
# 特定のデータセットを更新
npm run mock:update -- 0000010101 prefecture

# すべてのデータセットを更新
npm run mock:update-all
```

## デプロイ除外設定

このディレクトリの JSON ファイルは、Cloudflare Pages へのデプロイ時は除外されます。

- `wrangler.toml`で`exclude`設定
- `next.config.ts`で webpack 設定
- 環境変数で制御

詳細は`docs/02_開発/04_テストガイド.md`を参照してください。
