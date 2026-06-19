---
name: D1 Time Travel をロールバック基盤として利用
description: Cloudflare D1 は Time Travel（過去 30 日 PITR）が標準搭載されている。sync 前の R2 バックアップは不要で、ロールバックは Time Travel で賄う設計に切り替えた
type: project
originSessionId: 84bd0c00-fd80-4f0d-bda5-1a2c5b8b34ec
---
本プロジェクトのリモート D1 のロールバックは **Cloudflare D1 Time Travel** に一本化している。sync-remote-d1 の Step 0 は「ブックマーク取得」のみ（R2 への SQL ダンプは実施しない）。

**Why:**
- D1 Time Travel は過去 30 日を任意時点に復元可能（追加設定不要・無料）
- `backup-d1-to-r2.ts` のフルダンプは本番 6.1 GB に達していて R2 単一 PUT（2 GiB）を超え、アップロード不可
- Time Travel で賄える範囲で重複バックアップを組んでも冗長

**How to apply:**
- sync 前: `cd apps/web && npx wrangler d1 time-travel info stats47_static --env production` でブックマークを取得
- ロールバック: `npx wrangler d1 time-travel restore stats47_static --env production --bookmark <id>`
- `--remote` フラグは不要（Time Travel は常にリモート）
- 災害復旧（CF アカウント障害等）で R2 退避が必要な場合は sync と切り離して別運用で行う。その場合は `r2-utils.ts` の単一 PutObject を multipart 化する改修が必要
