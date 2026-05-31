---
name: sync-snapshots
description: ローカル D1 から全 R2 snapshot を一括 export する。R2 キーパスは app/ 名前空間に統一。データ変更後に必ず実行。
argument-hint: [--only <category>] [--dry-run]
disable-model-invocation: true
primary_agent: snapshot-exporter
co_agents: [article-writer, theme-designer, note-manager]
---

ローカル D1 SQLite から R2 上の全 snapshot を一括 export するオーケストレーションスキル。

データ変更 (`/page-data-batch`, `/sync-articles`, AI コンテンツ生成 等) のたびに、対応する snapshot を更新しないと本番で古いデータが配信される。

本スキルは **全 snapshot を順次 export** する。各 export はべき等なので何度実行しても安全。

## R2 キーパス構造

全 Web アプリデータは `app/` 名前空間に統一されている。詳細は `.claude/rules/r2-storage-design.md` を参照。

| データ | R2 キー |
|---|---|
| 値データ | `app/ranking/{key}/values.json` |
| AI コンテンツ | `app/ranking/{key}/ai-content.json` |
| ページカード | `app/ranking/{key}/page-cards.json` |
| ホーム注目 | `app/home/featured.json` |
| カテゴリ一覧 | `app/category/{key}/items.json` |
| 調査一覧 | `app/survey/all.json` |

## 実行する snapshot 一覧

URL → R2 パス対応は `.claude/rules/r2-storage-design.md` を参照。

| Snapshot | スクリプト | R2 キーパス | サイズ目安 |
|---|---|---|---|
| master (per-URL + surveys + categories) | `packages/ranking/src/scripts/export-master-snapshots.ts` | `app/home/featured.json` / `app/category/{key}/items.json` / `app/ranking/{key}/item.json` / `app/survey/{id}/items.json` / `app/survey/all.json` | ~13MB |
| ranking-download | `packages/ranking/src/scripts/export-ranking-download-snapshots.ts` | `app/ranking/{key}/downloads/values*.{csv,sjis.csv,json}` (basis 別 + all-bases) | — |
| remotion-static | `apps/remotion/scripts/export-d1-to-remotion-static.ts --feature all` | `apps/remotion/public/<feature>/*.json` (R2 push 対象外) | — |
| area-profile | `packages/area-profile/src/scripts/export-snapshot.ts` | `app/areas/{areaCode}/profile.json` | ~4MB (47 files) |
| city-profile | `packages/area-profile/src/scripts/export-city-snapshot.ts` | `app/areas/{cityCode}/profile.json` | — |
| blog | `apps/web/scripts/export-blog-snapshot.ts` (article.md) | `app/blog/all.json` | ~150KB |
| page-components | `apps/web/scripts/export-page-components-snapshot.ts` (git TS `data/page-components/`) | `app/page-components/{pageType}/{key}.json` (per-page, 98 files) | ~150KB |
| affiliate-ads | `apps/web/scripts/export-affiliate-ads-snapshot.ts` (git TS `affiliate-ads-data.ts`) | `app/affiliate-ads/all.json` | ~15KB |
| ranking-page-cards | `apps/web/scripts/export-ranking-page-cards-snapshot.ts` | `app/ranking/{key}/page-cards.json` | ~16KB |
| fishing-ports | `apps/web/scripts/export-fishing-ports-snapshot.ts` | `app/fishing-ports/all.json` | ~620KB |
| ports + port-statistics | `apps/web/scripts/export-port-statistics-snapshot.ts` | `app/ports/...` | ~50MB (715 files) |
| station-passengers | `apps/web/scripts/export-station-passengers-snapshot.ts` | `app/station-passengers/{NN}/{stations,lines}.json` ・ `app/station-passengers/index.json` | ~10MB (95 files) |

## R2 push は CI / クラウド専用 (★重要)

**R2 書き込みはローカルから行わない。** 本 run.sh をローカルで実行すると snapshot は
`.local/r2` に生成されるが、末尾の R2 push は自動でスキップされる (`CI` 外 + `ALLOW_LOCAL_R2_WRITE`
未設定のため。`diff-push-r2.ts` 側も `_assert-ci-write` ガードで停止する)。R2 反映は **GitHub Actions
で実行**する:

```bash
# CI で snapshot 再生成 + R2 push (推奨)。only で 1 task に絞れる
gh workflow run sync-snapshots.yml -f only=page-components          # 1 task
gh workflow run sync-snapshots.yml                                  # 全 task
gh workflow run sync-snapshots.yml -f dry_run=true                  # 生成のみ (確認)
gh run watch                                                        # 進捗確認
```

ローカルは公開 URL 経由の **読み取り専用** (`R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`)。
どうしてもローカルから push する場合のみ `ALLOW_LOCAL_R2_WRITE=1` を付与 (非推奨)。
方針: `.claude/rules/local-environment.md` / `.claude/rules/r2-storage-design.md`。

## 使い方 (ローカル = 生成のみ / push は CI)

### 通常実行 (全 snapshot を順次生成。push は CI 環境でのみ自動実行)

```bash
bash .claude/skills/db/sync-snapshots/run.sh
```

ranking-values は旧 30K files から 2,116 files に削減済み。`SKIP_VALUES` は不要。

### 単独カテゴリのみ

```bash
bash .claude/skills/db/sync-snapshots/run.sh --only blog
bash .claude/skills/db/sync-snapshots/run.sh --only ranking-values
bash .claude/skills/db/sync-snapshots/run.sh --only port-statistics
```

### dry-run (実行しない、走るスクリプトをリスト表示)

```bash
bash .claude/skills/db/sync-snapshots/run.sh --dry-run
```

## いつ実行するか

| トリガー | 必要 snapshot |
|---|---|
| `/page-data-batch` 完了 | master + ai-content + ranking-values |
| `/sync-metrics-cache` 完了 (新規 metric 追加後) | master + ranking-values |
| `/sync-articles` 完了 | blog |
| AI コンテンツ生成完了 | ai-content |
| ダッシュボード設定変更 | page-components |
| area_profile バッチ完了 | area-profile |
| 港湾統計データ更新 | port-statistics |
| 全部入れ替え (大規模リカバリ) | 全部 |

## 注意

- **R2 キーパスは `app/` 名前空間に統一すること**: 新規 snapshot 追加時は `.claude/rules/r2-storage-design.md` の URL → R2 対応表に従う。`app/` プレフィックスなし・`all.json` モノリスは禁止。
- **ローカル D1 が編集済みであること**: snapshot は ローカル SQLite を読むため、まず DB を更新してから本スキルを実行する。
- **CF REST API rate limit (429/504)**: export スクリプトは CF REST API で PUT する。大量ファイルを初回一括登録する場合は `aws s3 sync .local/r2/app/<dir> s3://stats47/app/<dir> --endpoint-url $R2_S3_ENDPOINT` の S3-compatible API を使うと rate limit を回避できる。
- **NEXT_PHASE skip パターン**: 本番 worker build 時は各 reader が空配列/null を返し ISR で初回 fetch する。snapshot 更新後の最初のリクエストで反映される (24h ISR 後にキャッシュ満了)。

## 関連スキル

- `/page-data-batch` — e-Stat → R2 へ観測値投入（本スキルの前処理。Phase 6 で旧 `/populate-all-rankings` を置換）
- `/push-r2` — R2 への手動アップロード（個別ファイル）
