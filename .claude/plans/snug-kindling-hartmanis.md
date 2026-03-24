# admin ai-content 機能の削除 → skill 移行

## Context

`apps/admin/src/features/ai-content/` は note 記事メタデータ CRUD と CSV 生成の UI を提供するが、
実質的にはスキルで完結できる機能であり、オーバースペック。admin UI を削除し、skill に移行する。

**重要**: `packages/ai-content` パッケージは残す。
- Web アプリのランキングページが `findRankingAiContent` でFAQ・分析を表示（SEO用JSON-LD含む）
- `/generate-ai-content` スキルが `scripts/` 配下のCLIツール（list-pending, build-prompt, save-content）を使用

## 削除対象

| # | 対象 | 操作 |
|---|------|------|
| 1 | `apps/admin/src/features/ai-content/` | ディレクトリ全削除 |
| 2 | `apps/admin/src/app/ai-content/` | ディレクトリ全削除 |
| 3 | `apps/admin/src/constants/admin-pages.ts` | `/ai-content` エントリ削除（L83-90） |
| 4 | `apps/admin/package.json` | `@stats47/ai-content` 依存削除 |

## 残すもの

| 対象 | 理由 |
|------|------|
| `packages/ai-content/` | Web アプリ表示 + スキル CLI で使用中 |
| `apps/web/src/features/ai-content/` | ランキングページの FAQ・分析表示 |
| DB テーブル（`ranking_ai_content`, `note_articles`, `downloadable_assets`） | データ保持 |
| `/generate-ai-content` スキル | 変更不要（パッケージのスクリプトを引き続き使用） |

## skill 移行

### CSV 生成スキル（新規作成）

`.claude/skills/content/generate-csv/SKILL.md`

手順:
1. ローカル D1 から ranking_data を取得
2. CSV 生成（UTF-8 BOM）
3. `.local/r2/downloads/csv/{rankingKey}-{yearCode}.csv` に保存
4. ローカル D1 の `downloadable_assets` テーブルに UPSERT
5. `/push-r2` で R2 にアップロード

### `/write-note-article` スキル更新

手順 6「DB にメタデータ登録」を更新:
- 現在: admin 画面での手動操作を案内
- 変更後: ローカル D1 の `note_articles` テーブルに直接 INSERT/UPDATE する手順に変更

## CLAUDE.md 更新

- スキル一覧に `/generate-csv` を追加

## 検証

1. `npx tsc --noEmit -p apps/admin/tsconfig.json` — admin 型チェック通過
2. `npx tsc --noEmit -p apps/web/tsconfig.json` — web 型チェック通過（影響なし確認）
3. Web アプリのランキングページで AI コンテンツ（FAQ・分析）が表示されることを確認
