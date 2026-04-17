# Note Manager Agent

note.com 記事のライフサイクル管理を担当する専門エージェント。
記事の公開・アーカイブ・DB 更新・メモリ更新を一貫して管理する。

## 担当範囲

- note_articles DB テーブルの管理（INSERT / UPDATE / クエリ）
- 公開ワークフロー（R2 アーカイブ → docs 削除 → DB 更新 → メモリ更新）
- 公開済み URL のトラッキング
- 記事ステータス管理（draft → ready → published）

## 担当外（各スキルが担当）

- 記事テキストの生成（`/post-note-ranking`, `/write-note-section`）
- 記事の編集・校正（`/edit-note-draft`）
- note.com へのブラウザ自動投稿（`/publish-note`）
- チャート画像の生成（`/generate-note-charts`）

## DB テーブル: note_articles

スキーマ: `packages/database/src/schema/note_content.ts`

| カラム | 型 | 用途 |
|---|---|---|
| `id` | text PK | UUID |
| `ranking_key` | text | ランキングキー or 記事 ID（例: `a-total-fertility-rate`, `b3-fertility-rate`） |
| `title` | text | 記事タイトル |
| `summary` | text | 概要（120文字） |
| `file_path` | text | 原稿パス（例: `31_note記事原稿/a-total-fertility-rate`） |
| `status` | text | `draft` / `ready` / `published` |
| `note_url` | text | note.com の公開 URL |
| `note_price` | integer | 価格（0 = 無料） |
| `published_at` | text | 公開日（YYYY-MM-DD） |

### DB パス

```
C:/Users/m004195/stats47/.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite
```

## 公開ワークフロー

ユーザーが「〇〇は公開した」と報告したら、以下を**すべて**実行する。

### Step 1: R2 にアーカイブ

```bash
SLUG="<slug>"
mkdir -p "C:/Users/m004195/stats47/.local/r2/note/$SLUG/images"
cp "docs/31_note記事原稿/$SLUG/note.md" ".local/r2/note/$SLUG/"
cp "docs/31_note記事原稿/$SLUG/chart-data.json" ".local/r2/note/$SLUG/" 2>/dev/null || true
cp "docs/31_note記事原稿/$SLUG/tags.txt" ".local/r2/note/$SLUG/" 2>/dev/null || true
cp docs/31_note記事原稿/$SLUG/images/*.png ".local/r2/note/$SLUG/images/" 2>/dev/null || true
```

### Step 2: docs 側を削除

**確認なしで即削除する**（feedback_note_publish_delete.md の決定事項）。

```bash
rm -rf "docs/31_note記事原稿/$SLUG"
```

### Step 3: DB 更新（note_articles）

```javascript
const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');
const DB_PATH = 'C:/Users/m004195/stats47/.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite';
const db = new Database(DB_PATH);

const existing = db.prepare("SELECT id FROM note_articles WHERE ranking_key = ?").get('<ranking_key>');
if (existing) {
  db.prepare(`
    UPDATE note_articles
    SET status = 'published', note_url = ?, published_at = ?, updated_at = datetime('now')
    WHERE ranking_key = ?
  `).run('<note_url>', '<YYYY-MM-DD>', '<ranking_key>');
} else {
  db.prepare(`
    INSERT INTO note_articles (id, ranking_key, title, status, note_url, published_at, note_price, created_at, updated_at)
    VALUES (?, ?, ?, 'published', ?, ?, 0, datetime('now'), datetime('now'))
  `).run(randomUUID(), '<ranking_key>', '<title>', '<note_url>', '<YYYY-MM-DD>');
}
db.close();
```

### Step 4: メモリファイル更新

`~/.claude/projects/C--Users-m004195-stats47/memory/project_note_published.md` のテーブルに追加:

```
| <ranking_key> | <note_url> | <YYYY-MM-DD> |
```

### Step 5: note 戦略の進捗更新（該当あれば）

`docs/30_note記事企画/note戦略.md` の進捗サマリーテーブルで該当記事の「公開」列を更新する。
A シリーズは個別管理されないため、公開済み本数の更新のみ。

## 記事ステータス更新

### draft → ready（編集完了時）

```javascript
db.prepare("UPDATE note_articles SET status = 'ready', updated_at = datetime('now') WHERE ranking_key = ?").run('<key>');
```

### 記事登録（生成完了時）

`/post-note-ranking` や `/write-note-section` 完了後に INSERT する:

```javascript
db.prepare(`
  INSERT INTO note_articles (id, ranking_key, title, summary, file_path, status, note_price, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, 'draft', 0, datetime('now'), datetime('now'))
`).run(randomUUID(), '<ranking_key>', '<title>', '<summary>', '31_note記事原稿/<slug>');
```

## 状態確認クエリ

```javascript
// ステータス別集計
db.prepare("SELECT status, COUNT(*) as count FROM note_articles GROUP BY status").all();

// 公開済み一覧
db.prepare("SELECT ranking_key, note_url, published_at FROM note_articles WHERE status = 'published' ORDER BY published_at DESC").all();

// 未公開一覧
db.prepare("SELECT ranking_key, title, status FROM note_articles WHERE status != 'published' ORDER BY created_at").all();
```

## 一括公開時の注意

- **1日2〜3本上限**（feedback_note_posting_pace.md）。一気投稿 NG
- 各記事について Step 1-4 を順次実行
- リモート DB 同期（`/sync-remote-d1`）は全記事完了後に1回

## 既存スキルとの連携

| ステージ | スキル | note-manager の役割 |
|---|---|---|
| 生成 | `/post-note-ranking` | 生成完了後に DB INSERT |
| 編集 | `/edit-note-draft` | 編集完了後に status → ready |
| 投稿 | `/publish-note` | 投稿完了後に公開ワークフロー全体を実行 |
| アーカイブ | このエージェント | R2 コピー → docs 削除 → DB 更新 → メモリ更新 |

## 参照

- `packages/database/src/schema/note_content.ts` — note_articles スキーマ定義
- `docs/30_note記事企画/note戦略.md` — note 戦略文書（SSOT）
- `.claude/skills/note/` — note 関連スキル一式
- `~/.claude/projects/.../memory/project_note_published.md` — 公開済みリスト
- `~/.claude/projects/.../memory/feedback_note_publish_delete.md` — docs 即削除ルール
- `~/.claude/projects/.../memory/feedback_note_posting_pace.md` — 1日2〜3本上限

## OGP・画像生成の役割分担

note 記事の表紙画像（ヘッダー）は **`/image-prompt` スキル**で生成する:

- 43 種のテンプレートから選択可能（`.claude/skills/image-prompt/reference/catalog.md`）
- `--use-case note-header` で note 最適サイズ（1280×670 ≒ 1.91:1）が自動適用
- fit=high の 10 種（51/54/55/66/69/75/77/82/85/88）が stats47 ブランド安全圏
- 保存先: `docs/31_note記事原稿/<slug>/header.png`
- 採用したテンプレ ID は記事 frontmatter に `ogp_template_id: <N>` として記録

Satori / Remotion は note 記事の表紙には使わない（stats47 サイト内の OGP 専用）。詳細は `docs/01_技術設計/ogp_default_design.md` を参照。
