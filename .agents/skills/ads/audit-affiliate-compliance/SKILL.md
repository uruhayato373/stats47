---
name: audit-affiliate-compliance
description: アフィリエイトの compliance を決定的に監査する。直接配置 (direct-attribute) の孤立・本文タグ不一致・PR 表記 (景表法) 漏れ・台帳未登録タグ、および自動配置の canonical サイズ違反を検出する。Use when user says "アフィリエイト監査", "PR 表記チェック", "景表法チェック", "直接配置の監査", "コンプライアンス監査".
primary_agent: affiliate-manager
co_agents: [improvement-triage]
---

アフィリエイト配置の **compliance (PR 表記 / 孤立配置 / リンク整合 / canonical サイズ) を決定的スクリプトで監査**する。
判定はすべてスクリプトが行い、結果の解釈と是正の段取りだけを agent が担う。

- **直接配置 SSOT**: `apps/web/scripts/affiliate-direct-placements-data.ts` (`AFFILIATE_DIRECT_PLACEMENTS[]`)
- **自動配置 SSOT**: `apps/web/scripts/affiliate-ads-data.ts` (サイズ規約は `audit-affiliate-inventory.ts --check-size` が担当)
- **判定コア**: `.Codex/scripts/ads/lib/affiliate-compliance-core.mjs` (純粋関数・`node --test` 対象)
- **state 出力**: `.Codex/state/ads/compliance-latest.json` (`--live` 時のみ更新)

## 実行

```bash
# 1. 構造検証のみ (ネットワーク不要・pre-commit と同等)
npx tsx .Codex/scripts/ads/audit-affiliate-compliance.ts --check

# 2. 本文突合 (R2 公開 URL から配置先記事を取得して双方向監査)
npx tsx .Codex/scripts/ads/audit-affiliate-compliance.ts --live

# 3. 公開全記事の走査 (台帳未登録の <affiliate-banner> タグ検出。週次 CI 相当)
npx tsx .Codex/scripts/ads/audit-affiliate-compliance.ts --live --scan-all-blog

# 4. 自動配置の canonical サイズ (既存ゲート)
npx tsx .Codex/scripts/ads/audit-affiliate-inventory.ts --json --check-size
```

## 検出項目と是正の振り分け

| 検出 | 意味 | 是正 |
|---|---|---|
| 構造 error (ID 重複 / URL scheme / サイズ型 / 配置形式) | SSOT の記載ミス | `affiliate-direct-placements-data.ts` を修正 (affiliate-manager) |
| 孤立 `article-not-found` | 配置先記事が R2 に無い (削除・改名) | 台帳から配置を外すか記事を復元 |
| 孤立 `tag-not-found-in-body` | 台帳にあるが本文にタグが無い | 記事にタグを再配置するか台帳から外す |
| PR 表記漏れ | 景表法 (2023-10) の表記が本文に無い。blog は冒頭宣言 + `※PR` の両方、note は `#PR`/`#広告` 等いずれか | **記事本文の修正** (blog-editor / article-writer に委譲。R2 公開が要るためユーザー確認) |
| 台帳未登録タグ | 本文に `<affiliate-banner>` があるが台帳に無い | 台帳へ登録 (`/register-affiliate-banner direct`) |
| 非 canonical サイズ (warn) | 直接配置の一点物サイズ | 再取得時に 300×250 へ寄せる (即時是正は不要) |

- **exit code**: `--check` 付きで blocker (構造 error / 孤立 / PR 表記漏れ / 未登録タグ) があれば 1。
  週次 CI は `--check` を付けず state に記録し、operations state の `recommendedActions` が是正を案内する。
- 監査は read-only。**記事本文・台帳の修正はこの skill では行わない** (是正は上表の担当へ)。

## 関連ファイル

| ファイル | 役割 |
|---|---|
| `.Codex/scripts/ads/audit-affiliate-compliance.ts` | 監査 CLI (決定的) |
| `.Codex/scripts/ads/lib/affiliate-compliance-core.mjs` | 判定コア (純粋関数) |
| `.Codex/scripts/ads/__tests__/affiliate-compliance-core.test.mjs` | fixture テスト (`node --test`) |
| `apps/web/scripts/affiliate-direct-placements-data.ts` | 直接配置 SSOT |
| `.Codex/state/ads/compliance-latest.json` | 最新監査 state (operations state の入力) |
| `.Codex/rules/affiliate-ads-standards.md` | 規約 (PR 表記・サイズの正典) |
