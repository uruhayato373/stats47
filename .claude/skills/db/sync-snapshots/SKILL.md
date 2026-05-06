---
name: sync-snapshots
description: ローカル D1 から全 R2 snapshot を一括 export する。R2 キーパスは app/ 名前空間に統一。データ変更後に必ず実行。
argument-hint: [--only <category>] [--dry-run]
disable-model-invocation: true
---

ローカル D1 SQLite から R2 上の全 snapshot を一括 export するオーケストレーションスキル。

データ変更 (`/populate-all-rankings`, `/sync-articles`, AI コンテンツ生成 等) のたびに、対応する snapshot を更新しないと本番で古いデータが配信される。

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
| ai-content | `packages/ai-content/src/scripts/export-snapshot.ts` | `app/ranking/{key}/ai-content.json` | ~11MB (2,151 files) |
| correlation by-key | `packages/correlation/src/scripts/export-snapshot.ts` | `app/correlation/by-ranking-key/{key}.json` | ~5MB (1,830 files) |
| ranking-values | `packages/ranking/src/scripts/export-ranking-values-snapshots.ts` | `app/ranking/{key}/values.json` | ~30MB (2,151 files) |
| area-profile | `packages/area-profile/src/scripts/export-snapshot.ts` | `app/areas/{areaCode}/profile.json` | ~4MB (47 files) |
| blog | `apps/web/scripts/export-blog-snapshot.ts` | `app/blog/all.json` | ~150KB |
| page-components | `apps/web/scripts/export-page-components-snapshot.ts` | `app/page-components/all.json` | ~150KB |
| affiliate-ads | `apps/web/scripts/export-affiliate-ads-snapshot.ts` | `app/affiliate-ads/all.json` | ~15KB |
| ranking-page-cards | `apps/web/scripts/export-ranking-page-cards-snapshot.ts` | `app/ranking/{key}/page-cards.json` | ~16KB |
| fishing-ports | `apps/web/scripts/export-fishing-ports-snapshot.ts` | `app/fishing-ports/all.json` | ~620KB |
| ports + port-statistics | `apps/web/scripts/export-port-statistics-snapshot.ts` | `app/ports/...` | ~50MB (715 files) |

## 使い方

### 通常実行 (全 snapshot を順次更新)

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
| `/populate-all-rankings` 完了 | master + ai-content + ranking-values |
| `/register-ranking` 完了 | master + ranking-values |
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

- `/populate-all-rankings` — ローカル D1 にデータ投入（本スキルの前処理）
- `/push-r2` — R2 への手動アップロード（個別ファイル）
