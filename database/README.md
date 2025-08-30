# データベース管理

このディレクトリは、プロジェクトのデータベーススキーマとマイグレーションを管理します。

## 📁 ディレクトリ構造

```
database/
├── README.md                 # このファイル
├── RULES.md                  # データベース管理ルール
├── DEVELOPER_GUIDE.md        # 開発者向けガイドライン
├── manage.sh                 # データベース管理スクリプト
├── schemas/                  # スキーマ定義ファイル
│   ├── main.sql             # メインスキーマ（統合）
│   ├── auth.sql             # 認証関連スキーマ
│   └── estat-metadata.sql   # e-Statメタ情報スキーマ
├── migrations/               # マイグレーションファイル
│   └── 001_initial_schema.sql
├── seeds/                    # 初期データファイル（将来の拡張用）
└── backups/                  # バックアップファイル（自動生成）
```

## 📚 **ドキュメント一覧**

### **必須読了**

- **[RULES.md](./RULES.md)** - データベース管理のルールとガイドライン
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - 開発者向けの実践的なガイド

### **参考資料**

- **[README.md](./README.md)** - 基本的な使用方法とディレクトリ構造

## 🚀 使用方法

### データベース初期化

```bash
# 初回セットアップ
./database/manage.sh init

# または個別のスキーマを適用
wrangler d1 execute stats47-auth-db --file=./database/schemas/main.sql
```

### マイグレーション実行

```bash
# 最新のマイグレーションを適用
./database/manage.sh migrate
```

### データベース状態確認

```bash
# スキーマバージョンの状態を表示
./database/manage.sh status
```

### データベースリセット

```bash
# 注意: すべてのデータが削除されます
./database/manage.sh reset
```

### バックアップ作成

```bash
# データベースのバックアップを作成
./database/manage.sh backup
```

## 📋 スキーマ一覧

### 1. 認証関連 (`auth.sql`)

- `users` - ユーザー情報
- `sessions` - セッション管理

### 2. e-Stat 関連 (`estat-metadata.sql`)

- `estat_metadata` - e-Stat メタ情報（CSV 形式）

### 3. システム関連 (`main.sql`)

- `schema_versions` - スキーマバージョン管理

## 🔧 開発時の注意事項

### スキーマ変更時

1. 新しいマイグレーションファイルを作成
2. バックアップを作成
3. マイグレーションを適用
4. テストを実行

### ファイル命名規則

- スキーマ: `[機能名].sql`
- マイグレーション: `[連番]_[説明].sql`
- 例: `001_initial_schema.sql`, `002_add_user_profile.sql`

## 📊 パフォーマンス最適化

### インデックス戦略

- 検索頻度の高いカラムにインデックスを作成
- 複合インデックスで検索パフォーマンスを向上
- 不要なインデックスは定期的に確認・削除

### テーブル設計

- 適切なデータ型の選択
- NULL 値の最小化
- 外部キー制約の活用

## 🚨 トラブルシューティング

### よくある問題

1. **スキーマ適用エラー**: 既存テーブルとの競合
2. **インデックス作成エラー**: 重複インデックス
3. **外部キー制約エラー**: 参照整合性の問題

### 解決方法

1. バックアップから復元
2. スキーマの競合を確認
3. 段階的にマイグレーションを適用

## 📚 参考資料

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Database Design Best Practices](https://www.sqlite.org/foreignkeys.html)

## ⚠️ **重要: ルールの遵守**

データベース操作を行う前に、必ず **[RULES.md](./RULES.md)** を読んでください。
ルールを守らない操作は、データの損失やシステムの不具合を引き起こす可能性があります。

## 🆘 **緊急時の対応**

データベースに問題が発生した場合：

1. **即座に操作を停止**
2. **最新のバックアップを確認**
3. **チームリーダーに連絡**
4. **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) のトラブルシューティングを参照**
