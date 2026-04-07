---
name: knowledge
description: 過去の失敗と学びを参照・追記する。バグ解決時や設計判断の教訓記録に使用. DB・デプロイ・API連携の作業開始時に関連エントリを確認する背景知識.
user-invocable: false
---

過去の失敗と学びを参照・追記する。

## 使い方

- **参照**: 以下のナレッジから、現在の作業に関連するパターンがないか確認する
- **追記**: バグ解決や設計判断の教訓があれば、このファイル末尾に以下の形式で追記する

```markdown
---

## タイトル（簡潔に）

**問題**: 何が起きたか
**原因**: なぜ起きたか
**対策**: どうすれば防げるか
```

---

## tsconfig パスエイリアス

**問題**: `paths` を設定しても `@/*` が解決されない。

**原因**: `baseUrl` が未設定。`paths` は `baseUrl` からの相対パスで解決される。

**対策**: `baseUrl: "."` と `paths: {"@/*": ["./src/*"]}` をセットで設定する。`apps/web/tsconfig.json` のパターンを参照。

---

## drizzle-kit generate のスナップショット衝突

**問題**: `drizzle-kit generate` で `prevId collision` エラー。

**原因**: 手動作成したスナップショットの `prevId` が自分自身を指していた（`0005_snapshot.json` の `prevId` が `0005` の `id` と同一）。

**対策**: `drizzle/meta/*_snapshot.json` の `prevId` が前のスナップショットの `id` を正しく指しているか確認する。

---

## drizzle-kit push / generate の対話プロンプト

**問題**: `drizzle-kit push` や `drizzle-kit generate` がカラム削除・リネーム時に対話プロンプトを出し、非対話環境（CI、Claude Code）で止まる。

**対策**: 手動でマイグレーション SQL を作成し、`better-sqlite3` で直接適用する。`packages/database/drizzle/0007_articles_refactor.sql` が実例。

---

## seed のローカルディレクトリ統一（解決済み）

**経緯**: ローカル `.local/r2/seed/` と R2 の `seeds/` で名称が不一致だった。`npm run r2:upload` でアップロードすると R2 に `seed/` キーで保存されてしまい混在した。

**解決**: ローカルディレクトリを `.local/r2/seeds/` に統一。`sync-download.ts` の DEFAULT_PREFIXES も `"seeds"` に変更。現在は `r2:upload` でも `seed:push` でもどちらも R2 の `seeds/` に正しくアップロードされる。

---

## 企業プロキシと R2 S3 API

**問題**: `@aws-sdk/client-s3` 経由の R2 アクセスが HTTP 407/503 で失敗する。

**対策**: `npx wrangler r2 object put/get` で個別操作する。`/push-r2` スキルがフォールバック手順を提供。タイミングによって S3 API が通ることもある。

---

## MDX frontmatter の YAML クォート不正

**問題**: ブログ記事の frontmatter で `title: "...「鉤括弧」..."` のように YAML 二重引用符内に別の二重引用符を含めると、YAML パーサーが途中で文字列終端と解釈して `Unexpected scalar at node end` エラーになる。

**原因**: YAML の二重引用符文字列内では `"` をエスケープ (`\"`) しないと構文エラーになる。`compileMDX({ parseFrontmatter: true })` が記事コンテンツの frontmatter を再パースする際に発生。

**対策**: frontmatter の値に `"` を含める場合は `\"` にエスケープするか、シングルクォート `'...'` で囲む。または値にコロン・引用符を含まない場合はクォートなしで記述する。`/write-blog-article` の品質チェックリストに追加済み。

---

## Bash で cd するとローカルデータのパスが解決できなくなる

**問題**: `cd packages/svg-builder` 等でサブディレクトリに移動した後、`.local/r2/blog/<slug>/data/` や `.local/d1/` への相対パスが解決できず「No such file or directory」になる。

**原因**: `.local/` はプロジェクトルート直下にあるため、サブディレクトリから相対パスで参照できない。Bash の作業ディレクトリは `cd` 後も維持される。

**対策**: Bash コマンドで `cd` を使わない。型チェック等は `npx tsc --noEmit -p apps/web/tsconfig.json` のようにプロジェクトルートから実行する。やむを得ず `cd` する場合は同一コマンド内で `cd /c/Users/m004195/stats47 &&` で戻す。

---

## マイグレーションファイルのジャーナル外管理による不整合

**問題**: `drizzle/` に手動で SQL ファイルを追加し、`meta/_journal.json` に登録せずに運用した結果、ジャーナルは 7 件（0000〜0006）だが実ファイルは 20 本（0000〜0020）に乖離。削除済みテーブルの CREATE/DROP も混在し、新環境構築時に適用順序が不明になった。

**原因**: `drizzle-kit generate` の対話プロンプト回避のため、手書き SQL を `drizzle/` に直接配置した。ジャーナルはスナップショット 0006 で止まったまま、実際の DB スキーマだけが進んだ。

**対策**: (1) `drizzle/` には `drizzle-kit generate` の生成物のみ配置する（手動 SQL は `better-sqlite3` で直接適用）。(2) マイグレーションが 10 本を超えたら `/reset-migrations` でリセットする。(3) 詳細は `packages/database/README.md` の「マイグレーション運用ルール」を参照。

---

## 定数→DB 移行時のデータ消失

**問題**: アフィリエイトバナーを定数（`AFFILIATE_BANNERS`）から DB 管理に移行した際、定数を削除したが DB への INSERT を行わず、7件のバナーデータが消失した。

**原因**: 移行コミットでスキーマ変更とコード変更のみ実施し、既存データの移行（INSERT 文やシードデータ生成）を忘れた。

**対策**: 定数→DB 移行時は以下を必ず実施する: (1) 既存の定数データを INSERT 文に変換してローカル D1 に投入 (2) `--dry-run` 等で行数を確認 (3) 定数の削除は INSERT 確認後に行う。

---

## pull-remote-d1 はスキーマ差分で大量失敗する

**問題**: `/pull-remote-d1` で全テーブル pull したところ、3 テーブルがスキーマ差分でエラー、1 テーブルがネットワーク中断で部分 INSERT のまま停止した。修復に手作業が多く発生し、同期作業全体に数時間を要した。

- `articles`: リモートに `seo_title` カラムが追加されていた → `has no column named seo_title`
- `comparison_components`: リモートの CHECK 制約に `composition-chart` が追加されていた → `CHECK constraint failed`
- `ranking_tags`: リモートでカラム名が `tag` → `tag_key` に変更、`tags` テーブルへの FK 追加 → `has no column named tag_key`
- `tags`, `article_tags`: リモートにのみ存在する新テーブル → `[SKIP]` で無視されたが、pull 後に ranking_tags の FK 先がなく問題に
- `correlation_analysis`: 58,511 行中 33,500 行で企業ネットワークのタイムアウト → 手動 `--offset` で再開
- `ranking_data`: 3,084,967 行中 1,005,000 行で同上

**原因**: `/diff-d1` がデータ差分のみ比較しスキーマ差分を検知しなかった。別 PC でスキーマ変更（マイグレーション適用）されていたが、ローカルにはその変更が反映されていなかった。

**対策**: (1) **pull 前にスキーマ比較を行う**（`/pull-remote-d1` SKILL.md に手順を追加済み）。リモートとローカルの `CREATE TABLE` 文を比較し、差分があれば `ALTER TABLE` やテーブル再作成で先に解消する。(2) `/diff-d1` SKILL.md にスキーマ差分は検知できない旨を明記済み。(3) 大量テーブルの中断時は `--offset` で再開できる。

---

## ranking_items の latest_year / available_years フォーマット不一致で本番 404

**問題**: 家計調査（kakei-chousa）系ランキング 675 件が本番で 404。`findRankingItem` の Zod パースエラーが `err()` を返し `notFound()` に到達。

**原因**: `latest_year` と `available_years` が e-Stat の生年コード形式 (`"2024000000"`, `["2024000000",...]`) で保存されていた。Zod スキーマは `{"yearCode":"...","yearName":"..."}` オブジェクト形式を期待する（`parseJsonColumn(z.object({yearCode: z.string(), yearName: z.string()}))`）。

**対策**: (1) ランキング登録時（`/register-ranking`, `/populate-all-rankings`）は `latest_year` / `available_years` を必ず `{"yearCode":"2024000000","yearName":"2024年"}` 形式で保存する。(2) 修正 SQL: `UPDATE ranking_items SET latest_year = '{"yearCode":"<code>","yearName":"<year>年"}', available_years = '[{"yearCode":"<code>","yearName":"<year>年"},...]' WHERE ...`。(3) ISR は 2026-03 に廃止済み（全ページ SSR）のため、キャッシュパージは不要。

---

## OpenNext R2 ISR キャッシュの正しいキー構造

**[廃止] ISR は 2026-03 に廃止済み（全ページ SSR 化）。このナレッジは歴史的記録として残す。**

**問題**: R2 の ISR キャッシュを手動パージする際、キー構造が不明だった。

**原因**: OpenNext の R2 キャッシュキーは `{prefix}/{buildId}/{sha256(pageKey)}.{cacheType}` 形式。

**対策**: ISR 廃止により不要。D1 は 0.1ms で応答するため SSR で十分な性能。ISR を使うとビルド時に D1 が利用できない CI 環境でエラー状態がキャッシュされる問題があった。

---

## 国土数値情報 C02 港湾座標の重複

**問題**: 国土数値情報 C02（港湾データ）由来の座標に6組12港の重複があり、地図上で異なる港が同じ位置に表示された。重複ペア: 宮古/大船渡、福井/敦賀、神戸/姫路、三隅/西郷、長浜/新居浜、中城湾/運天。

**原因**: 元データの品質問題。同一都道府県内の複数港に同じ座標が割り当てられていた。

**対策**: (1) MLIT サイバーポート（cyport）API のバース施設座標の平均値で修正。cyport に無い港は Web 調査で補完。修正スクリプト: `packages/database/scripts/import-cyport-ports.ts`。(2) 港湾データ投入・更新時は `SELECT ... FROM ports a JOIN ports b ON a.latitude = b.latitude AND a.longitude = b.longitude AND a.port_code < b.port_code` で重複座標チェックを行う。

---

## OGP 画像 URL と noindex 漏れによる「クロール済み - インデックス未登録」1,453 件

**問題**: GSC で「クロール済み - インデックス未登録」が 1,453 ページ繰り返し発生。主原因は (1) Next.js の opengraph-image.tsx が自動生成する `/areas/*/opengraph-image` URL が robots.txt で Disallow されておらず Google が全てクロール、(2) 市区町村ページ `cities/[cityCode]/page.tsx` に `robots: "noindex, follow"` が未設定（子ページには設定済み）。

**原因**: (1) robots.ts 作成時に Next.js File Convention の自動生成ルート（opengraph-image 等）を考慮しなかった。(2) 子ページの noindex を親ページに適用する確認を怠った。

**対策**: (1) robots.ts に `"/*/opengraph-image"` を全 userAgent の Disallow に追加。(2) 市区町村ページに `robots: "noindex, follow"` を追加。(3) 新規ページ作成時は `coding-standards.md` のインデックス制御チェックリストを実行。(4) `/seo-audit` に「2-7. インデックス制御チェック」を追加。
