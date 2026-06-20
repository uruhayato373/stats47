---
name: Cloudflare API token は「stats47」1 個に集約済み
description: 全用途（ローカル開発 + CI sync-known-keys + /deploy）が単一トークンで動く
type: project
originSessionId: c8f7304c-235d-4e27-ad61-b3075b33f5a5
---
2026-04-26 整理: 散乱していた Cloudflare API token (mac×2, windows, 20251216, R2 Account Token×3, orange-sea-f334) を全削除し「stats47」1 個に集約した。

**stats47 トークン権限**:
- Account → D1 → Edit
- Account → Workers R2 Storage → Edit
- Account → Cloudflare Pages → Edit
- Account → Account Settings → Read

**含まれていない権限** (2026-05-17 確認):
- ❌ Zone → Cache Purge — `/purge-cdn` (`packages/r2-storage/src/scripts/purge-cache.ts`) を実行すると 401 Authentication error。CDN キャッシュパージは **Cloudflare ダッシュボード手動** (Caching > Configuration > Purge Cache > Custom Purge) で行う必要あり。CI/agent 自動パージを実現したい場合は token に Cache Purge 権限を追加する

**Why**: Phase 9 P2-A の sync-known-keys workflow が D1 Read を必要とするため、既存「D1 Write」のみだと 7403 で失敗。トークン管理を簡素化するため整理時に Edit に拡張。

**How to apply**:
- ローカル開発: `.env.local` の `CLOUDFLARE_API_TOKEN` がこのトークン
- CI: GitHub secret `CLOUDFLARE_API_TOKEN` も同じトークン
- 新たに Cloudflare 操作が必要になった場合、まず stats47 トークンの権限拡張を検討（新トークン作成より優先）
- セキュリティ強化が必要になったら、CI 専用に Read-only トークンを別途作る選択肢あり（current trade-off: 簡潔さ優先）

残っている他プロジェクト用トークン（削除しない）:
- doboku-note (Pages Write) — doboku-note プロジェクト
- R2 Account Token - kakkom — kakkom プロジェクト
