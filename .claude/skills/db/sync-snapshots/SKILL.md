---
name: sync-snapshots
description: ローカル D1 から全 R2 snapshot を一括 export する。Phase 0-6 で R2 化した 13 種類の snapshot を 1 コマンドで更新。データ変更後に必ず実行。
argument-hint: [--only <category>] [--dry-run]
disable-model-invocation: true
---

ローカル D1 SQLite から R2 上の全 snapshot を一括 export するオーケストレーションスキル。

D1→R2 マスタープラン Phase 0-6 で 13 種類の snapshot に依存するようになった。データ変更 (`/populate-all-rankings`, `/sync-articles`, AI コンテンツ生成 等) のたびに、対応する snapshot を更新しないと本番で古いデータが配信される。

本スキルは **全 snapshot を順次 export** する。各 export はべき等なので何度実行しても安全。

## 実行する snapshot 一覧

| Snapshot | スクリプト | サイズ目安 |
|---|---|---|
| ranking-items / surveys / categories | `packages/ranking/src/scripts/export-master-snapshots.ts` | < 1MB |
| ai-content | `packages/ai-content/src/scripts/export-snapshot.ts` | ~11MB |
| correlation by-key | `packages/correlation/src/scripts/export-snapshot.ts` | ~5MB (1,830 files) |
| ranking-values partition | `packages/ranking/src/scripts/export-ranking-values-snapshots.ts` | ~800MB (29K files、`SKIP_VALUES=1` で skip) |
| area-profile | `packages/area-profile/src/scripts/export-snapshot.ts` | ~3MB |
| blog | `apps/web/scripts/export-blog-snapshot.ts` | ~150KB |
| page-components | `apps/web/scripts/export-page-components-snapshot.ts` | ~150KB |
| affiliate-ads | `apps/web/scripts/export-affiliate-ads-snapshot.ts` | ~15KB |
| ranking-page-cards | `apps/web/scripts/export-ranking-page-cards-snapshot.ts` | ~16KB |
| fishing-ports | `apps/web/scripts/export-fishing-ports-snapshot.ts` | ~620KB |
| ports + port-statistics | `apps/web/scripts/export-port-statistics-snapshot.ts` | ~50MB (715 files) |

## 使い方

### 通常実行 (全 snapshot を順次更新、ranking-values は skip)

```bash
SKIP_VALUES=1 bash .claude/skills/db/sync-snapshots/run.sh
```

ranking-values (~30K files) は CF REST API rate limit で 30-60 分かかるため、デフォルトで skip。
更新が必要な場合のみ環境変数を外す:

```bash
bash .claude/skills/db/sync-snapshots/run.sh
```

### 単独カテゴリのみ

```bash
bash .claude/skills/db/sync-snapshots/run.sh --only blog
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
| 全部入れ替え (大規模リカバリ) | 全部 (`SKIP_VALUES` を外す) |

## 注意

- **ローカル D1 が編集済みであること**: snapshot は ローカル SQLite を読むため、まず DB を更新してから本スキルを実行する。リモート D1 とローカル D1 の整合は `/sync-remote-d1` を別途実行。
- **CF REST API rate limit (429/504)**: 大量 snapshot (ranking-values, port-statistics by-port) は retry + parallelism=1 で守られているが、複数 export を同時に走らせると衝突する。本スキルは順次実行する。
- **NEXT_PHASE skip パターン**: 本番 worker build 時は各 reader が空配列/null を返し ISR で初回 fetch する。snapshot 更新後の最初のリクエストで反映される (24h ISR 後にキャッシュ満了)。

## 関連スキル

- `/pull-remote-d1` — リモート D1 → ローカル D1 (新規 PC 等)
- `/sync-remote-d1` — ローカル D1 → リモート D1 (本スキルとは目的が違う; D1 ↔ R2 整合用)
- `/diff-d1` — ローカル / リモート D1 差分検知
