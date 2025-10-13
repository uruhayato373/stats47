# 未使用・一時ファイル分析レポート

調査日時: 2025-10-13
プロジェクト: stats47

## 概要

このレポートは、stats47プロジェクト内の未使用ファイルや削除候補となる一時ファイルの調査結果をまとめたものです。

---

## 1. バックアップファイル（即座に削除可能）

### SQLバックアップファイル

| ファイル名 | サイズ | 作成日 | パス |
|------------|--------|--------|------|
| `backup-prod-20251013.sql` | 3.3MB | 2025-10-13 14:40 | `/Users/minamidaisuke/stats47/` |
| `backup-local-20251013.sql` | 311KB | 2025-10-13 14:38 | `/Users/minamidaisuke/stats47/` |

**推奨アクション**: これらのバックアップファイルは、リポジトリのルートディレクトリに置かれており、Gitで管理すべきではありません。内容を確認した上で削除し、`.gitignore`に`*.sql`を追加することを推奨します。

**削除コマンド例**:
```bash
rm /Users/minamidaisuke/stats47/backup-prod-20251013.sql
rm /Users/minamidaisuke/stats47/backup-local-20251013.sql
```

---

## 2. システム一時ファイル

### macOS システムファイル

| ファイル名 | サイズ | パス |
|------------|--------|------|
| `.DS_Store` | 6.0KB | `/Users/minamidaisuke/stats47/` |

**推奨アクション**: `.DS_Store`ファイルは、macOSが自動生成するディレクトリ設定ファイルです。`.gitignore`に追加して、リポジトリから除外することを推奨します。

**削除コマンド例**:
```bash
find /Users/minamidaisuke/stats47 -name ".DS_Store" -delete
```

**.gitignore追加例**:
```gitignore
# macOS
.DS_Store
.AppleDouble
.LSOverride

# SQL dumps
*.sql
!database/migrations/*.sql
!database/schemas/*.sql
```

---

## 3. 重複ファイル（要確認）

### TopoJSONファイルの重複

| ファイル名 | サイズ | パス | MD5ハッシュ |
|------------|--------|------|-------------|
| `jp_pref.l.topojson` | 3.4MB | `/Users/minamidaisuke/stats47/public/data/` | `c21c3175fee36b21ed3767a40471cd41` |
| `jp_pref.l.topojson` | 3.4MB | `/Users/minamidaisuke/stats47/src/data/` | `c21c3175fee36b21ed3767a40471cd41` |

**分析結果**:
- 両ファイルのMD5ハッシュが完全に一致しており、内容は同一です
- 合計で6.8MBのストレージを使用しています
- アプリケーションがどちらのファイルを参照しているか確認が必要です

**推奨アクション**:
1. アプリケーションコード内で、どちらのファイルパスが参照されているか調査
2. 使用されていない方のファイルを削除
3. 通常、Next.jsでは`public/data/`が推奨されます（静的ファイルとして提供される）

**調査コマンド例**:
```bash
# どちらのファイルが参照されているか確認
grep -r "jp_pref.l.topojson" /Users/minamidaisuke/stats47/src --include="*.ts" --include="*.tsx"
```

---

## 4. キャッシュディレクトリ

### Wranglerキャッシュ

| ディレクトリ | サイズ | パス |
|--------------|--------|------|
| `.wrangler/` | 1.1MB | `/Users/minamidaisuke/stats47/.wrangler/` |

**推奨アクション**: Wranglerのキャッシュディレクトリです。`.gitignore`に追加されていることを確認してください（通常は自動的に含まれています）。削除しても`wrangler dev`実行時に再生成されます。

---

## 5. 大きなファイル（参考情報）

### 500KB以上のファイル

| ファイル名 | サイズ | パス | 備考 |
|------------|--------|------|------|
| `backup-prod-20251013.sql` | 3.3MB | `/Users/minamidaisuke/stats47/` | バックアップファイル（削除推奨） |
| `jp_pref.l.topojson` | 3.4MB | `/Users/minamidaisuke/stats47/public/data/` | 地図データ（必要） |
| `jp_pref.l.topojson` | 3.4MB | `/Users/minamidaisuke/stats47/src/data/` | 地図データ（重複の可能性） |
| `mapping.csv` | 569KB | `/Users/minamidaisuke/stats47/src/data/` | マッピングデータ（必要） |

---

## 6. ドキュメントファイル（参考情報）

### doc/ディレクトリの状況

- **総ファイル数**: 22個
- **総サイズ**: 780KB
- **総行数**: 25,436行

### 大きなドキュメントファイル（上位10件）

| ファイル名 | 行数 | 推測サイズ |
|------------|------|------------|
| `authentication-system-implementation-guide.md` | 3,112行 | ~124KB |
| `ranking-navigation-edit-implementation-plan.md` | 2,903行 | ~116KB |
| `typescript-types-management-strategy.md` | 2,693行 | ~108KB |
| `authentication-analysis-and-improvement.md` | 1,912行 | ~76KB |
| `development-guide.md` | 1,848行 | ~74KB |
| `component-guide.md` | 1,696行 | ~68KB |
| `database-refactoring-plan.md` | 1,621行 | ~65KB |
| `authentication-system-audit.md` | 1,240行 | ~50KB |
| `database-documentation.md` | 1,075行 | ~43KB |
| `ranking-components-refactoring.md` | 1,029行 | ~41KB |

**推奨アクション**: ドキュメントファイルは開発に必要な情報を含んでいるため、削除は推奨しませんが、以下の整理を検討してください：
- 古くなった実装計画ファイル（`*-plan.md`）の内容を確認
- 実装済みの機能に関する計画書は、アーカイブディレクトリ（`doc/archive/`）に移動
- 同一トピックに関する重複ドキュメントを統合

---

## 7. その他の発見

### 一時ファイルの検索結果

以下のパターンのファイルは見つかりませんでした（良好）：
- `*.tmp` - 一時ファイル
- `*.log` - ログファイル
- `*.cache` - キャッシュファイル
- `*~` - エディタバックアップファイル

---

## まとめと推奨アクション

### 即座に削除可能なファイル（合計: 約3.6MB）

1. ✅ `backup-prod-20251013.sql` (3.3MB)
2. ✅ `backup-local-20251013.sql` (311KB)
3. ✅ `.DS_Store` (6KB)

### 調査後に削除を検討すべきファイル（合計: 3.4MB）

1. ⚠️ `src/data/jp_pref.l.topojson` または `public/data/jp_pref.l.topojson`
   - どちらか一方を削除（重複のため）

### .gitignoreへの追加推奨

```gitignore
# Backups
*.sql
!database/migrations/*.sql
!database/schemas/*.sql
!database/scripts/*.sql

# macOS
.DS_Store
.AppleDouble
.LSOverride

# IDEs
*.swp
*.swo
*~

# Wrangler
.wrangler/
```

### 削除スクリプト例

```bash
#!/bin/bash
# 未使用ファイルの削除スクリプト

# バックアップファイルの削除
rm -f /Users/minamidaisuke/stats47/backup-prod-20251013.sql
rm -f /Users/minamidaisuke/stats47/backup-local-20251013.sql

# .DS_Storeファイルの削除
find /Users/minamidaisuke/stats47 -name ".DS_Store" -delete

# 重複TopoJSONファイルの削除（要確認後に実行）
# どちらを削除するかはアプリケーションの実装を確認してから決定
# rm -f /Users/minamidaisuke/stats47/src/data/jp_pref.l.topojson

echo "クリーンアップ完了"
```

---

## 調査方法

このレポートは以下のコマンドを使用して作成されました：

```bash
# バックアップファイルの検索
find . -type f -name "backup-*" -o -name "*.sql"

# システムファイルの検索
find . -name ".DS_Store"

# 大きなファイルの検索
find . -type f -size +500k -not -path "*/node_modules/*" -not -path "*/.next/*"

# 重複ファイルのハッシュ確認
md5 src/data/jp_pref.l.topojson public/data/jp_pref.l.topojson

# ドキュメント行数カウント
wc -l doc/*.md
```

---

**注意**: ファイルを削除する前に、必ずバックアップを取るか、内容を確認してください。
