---
name: adsense-local-oauth-env-local-2026-05-17
description: AdSense OAuth 失効問題は 2026-06-06 完全解決。GHA 経由取得復旧 (W21-W23)・local .env.local は CI 専任化で廃止・OAuth 同意画面は In production publish 済。残アクションなし
metadata: 
  node_type: memory
  type: project
  originSessionId: 69ea2f2c-4744-4552-b09e-e35323e5abc5
---

2026-05-17 に `/fetch-adsense-data snapshot` が `invalid_grant` で失敗。`.env.local` の `GOOGLE_ADSENSE_REFRESH_TOKEN` (2026-04-24 設定) が失効していた。

**2026-05-20 追記 — GHA secret も失効を確認**: `fetch-metrics-weekly.yml` の run 25989490636 (2026-05-17) のログで `❌ AdSense OAuth refresh token が無効です` / `AdSense snapshot failed: invalid_grant` を確認。当初「GHA は別系統で有効」と記録したが**誤り**。GHA secret `GOOGLE_ADSENSE_REFRESH_TOKEN` も失効済み。結果、`.claude/state/metrics/adsense/history.csv` は **2026-W17 で更新停止**（GSC/GA4 は W20 まで取得継続）。`fetch-adsense-snapshot` ステップは `continue-on-error: true` のため失敗が silent になっていた。

**Why**: AdSense client (`1044264339032-rfo463bt3j000eee8d2uolqeguod2v95`) の OAuth consent screen が Testing mode のままで、Google 仕様により refresh token が短期失効する。local も GHA も同じ client・同じ失効パターン。

**How to apply**:
- AdSense メトリクス（local / GHA 両方）は現在取得不能 → 再認証必須。これが済むまで RPM・impressions の効果判定は不可能（1 データ点しかない）
- 再認証手順:
  1. AdSense 用 oauth-setup で loopback OAuth により refresh token を再取得
  2. `.env.local` の `GOOGLE_ADSENSE_REFRESH_TOKEN=` を更新
  3. **GHA secret も更新**: `gh secret set GOOGLE_ADSENSE_REFRESH_TOKEN`
- **根本対策（必須）**: Google Cloud Console で AdSense OAuth client を Production publish (Testing → In production)。これをしないと再認証しても数週間で再失効する
- 手順詳細: `.claude/skills/analytics/fetch-adsense-data/SKILL.md`

**2026-06-06 更新 (状況変化・要注意)**: この memory の「local も GHA も停止」は 2026-05-20 までの point-in-time。現在の実態は異なる:
- GHA secret `GOOGLE_ADSENSE_REFRESH_TOKEN` は **2026-05-20 更新で有効**、AdSense は GHA `fetch-metrics-weekly.yml` で **取得復旧済** (`history.csv` に W21 ¥47 / W22 ¥100)。`.claude/state/metrics/adsense/history.csv` の停止は W17→W21 で解消。
- `.env.local` は **2026-05-29 の CI 専任化で削除** ([[project_env_local_ci_consolidation]])。よって「local 再認証」(改善ログ ADSENSE-OAUTH-01) は**陳腐化 = superseded**。`oauth-setup.js` は `.env.local` 必須なので今実行すると crash する。
- **根本対策は実施済み (2026-06-06 owner 確認)**: OAuth 同意画面は既に **In production** publish 済。Testing mode の約7日 auto-expire は該当せず、失効リスク消滅。実測裏付け: token は 2026-05-20 設定で 17 日後 (06-06) も有効 (run 27046929360 で W23 取得成功)。→ **AdSense OAuth 問題は完全解決・残アクションなし**。
- 失効再発時の手順: 一時 `.env.local` に CLIENT_ID/SECRET を置く → `node .claude/scripts/adsense/oauth-setup.js` → `gh secret set GOOGLE_ADSENSE_REFRESH_TOKEN` → `rm .env.local`。

**関連**: [[project_youtube_shadowban_recovery_2026_04]] (YouTube OAuth は同じ Testing mode 問題を Production publish で対策済 — AdSense client も同じ対策が必要) / [[project_env_local_ci_consolidation]]
