---
type: implementation-audit
date: 2026-07-29
status: completed
related_backlog: ASP-CONTINUITY-01
related_spec: docs/02_実装計画/42_アフィリエイトPlaywright継続運用・安全化実装仕様.md
tags: [affiliate, playwright, phase0, audit]
---

# アフィリエイト Playwright 継続運用 Phase 0 監査 (doc 42)

read-only 監査。外部ブラウザ・ASP・R2 へはアクセスしていない。判定: **ready** (Phase 1 着手可)。

## 1. 作業ツリーとテストのベースライン

- `git status --short` = クリーン (未コミット変更なし。直前コミット `3bb2d1612`)。保護対象なし。
- `node --test .claude/scripts/ads/__tests__/` = **tests 120 / pass 120 / fail 0** (2026-07-29 実測)。

## 2. doc 42 §2 前提の突合 (2026-07-29 時点)

| doc 42 の前提 | 現行の実測 | 判定 |
|---|---|---|
| A8 の scout/apply は `APPLY_NEW=0` | `scripts/scheduled/scout-asp-weekly.sh:23` で確認 | ✅ 維持 |
| もしも/afb は apply 後の承認追跡・harvest 未実装 | `.claude/skills/ads/affiliate-operate/SKILL.md` §未実装 表で確認。**ただし 2026-07-28〜29 に大量申請済** (もしも applying 85 / afb applying 97 = 台帳 `affiliate-catalog.json` 実測) — 承認追跡の緊急度が上がった | ✅ (状況は変化) |
| GA4 operations state が旧データでも `ready` | `affiliate-operations-latest.json` (2026-07-26) = schemaVersion 1・gate **ready**・imp 13,115 = 旧 `ad_impression` (AdSense 汚染) 由来。snapshot `ga4-affiliate-2026-07-26.json` に schemaVersion / measurementEpoch / quality なし | ✅ 偽陽性を確認 |
| PR 表記不足 2 件 | `compliance-latest.json` (2026-07-28): `moshimo-ai-onikanri-93995` (head-pr-declaration) / `a8-strategy-career-koumuin-ai-tenshoku-260601701360` (head-pr-declaration + inline-pr-prefix) | ✅ |
| A8 `check-approval` は先頭ページのみ | `a8-browser.ts` `cmdCheckApproval` (L608-) — `partneredListUrl` を 1 回 goto、pagination ループなし | ✅ (Phase 4 対象) |
| cron は失敗を握り潰す | `scout-asp-weekly.sh` — 全 step が `\|\| echo "!! ... (継続)"`。集約 exit なし・health なし | ✅ |
| append の復元が `git checkout --` | `append-affiliate-ads.ts:71-74` `restoreSsot()` | ✅ |
| 広告 pure core テスト 120 件 | 上記ベースライン | ✅ |
| active 広告 260 件・gap なし | `inventory-latest.json`。加えて**未 push の SSOT 追記 46 件**が develop に commit 済 (`0fec8f813` 等 7 コミット・publish 待ち) | ✅ (増加方向) |

**doc 42 執筆後 (2026-07-28〜29) の差分** — 前提を壊さないが Phase 1 実装時に前提にする:

- `affiliate-apply.mjs` は改修済み: verifyApplied が申請中+提携中の両一覧照合 / 台帳 1 件ごと即時保存 / afb 専用フロー (`applyAfbOne`: pm_search 検索 → 行ボタン → 確認ブロック site assert → `same_site_app[]` (doboku-note 984453) 全解除 → `input[name=app_reg]` submit → 再検索 DOM 実測)。plan/journal/lock は**未実装** (Phase 1 の対象のまま)。
- `weeklyApplyMax` は 10 → **100** (オーナー判断 2026-07-28、config `affiliate-asp.json`)。
- moshimo 一覧 URL に `limit=100` 付与 (既定 10 件では applying 34 件を読み切れなかった)。

## 3. 契約ドリフト (Phase 1 step 8 の対象)

`rg "全件自動申請|週次全自動|full は週次 cron"` 相当の突合で確認:

| 場所 | 記述 | 現行 safe mode との矛盾 |
|---|---|---|
| `.claude/agents/asp-scout.md` 大原則 | 「提携申請は**全件自動申請** (ユーザー決定)」 | cron は `APPLY_NEW=0`・apply は `--id` 明示 + オーナー承認の実行回のみ (rules §10) |
| `.claude/agents/asp-scout.md` 担当スキル表 | 「full は**週次 cron の実体**」 | SKILL.md は「週次 cron は full を呼ばない (2026-07-27 改訂)」 |
| `.claude/skills/ads/affiliate-operate/SKILL.md` §3 | 「週上限 … **既定 10**」 | config は 100 (2026-07-28 オーナー判断) |
| `docs/01_技術設計/playwright-auth-profiles.md` | 変動するログイン状態の記載 (doc 42 §12) | 固定仕様と再ログイン手順だけ残す |

## 4. state writer の列挙 (`.claude/scripts/ads` + a8-browser)

`writeFileSync` 保有 (2026-07-29 grep 実測): `affiliate-apply.mjs` (affiliate-catalog) / `affiliate-status.mjs` (affiliate-catalog) / `a8-browser.ts` (a8-catalog) / `select-for-register.mjs` (a8-catalog) / `append-affiliate-ads.ts` (SSOT + a8-catalog) / `build-affiliate-operations-state.ts` (operations-latest) / `fetch-affiliate-ga4.cjs` (ga4-affiliate-*) / `audit-affiliate-inventory.ts` (inventory-latest) / `audit-affiliate-compliance.ts` (compliance-latest) / `build-placement-map.mjs` (placement-map-latest)。読み取り専用: `check-{a8,asp}-apply-budget.cjs`。

## 5. file boundary (Phase 1)

**追加** (doc 42 §5 配置規約準拠):

- `.claude/scripts/ads/lib/asp-operation-core.mjs` — plan/hash/journal/lock/cron-result の純粋コア (§6.3-6.5, §11.2)。doc 42 想定の 3 新規のうち reconciliation/eligibility は Phase 2/4 のため作らない (ファイルを増やさない)
- `.claude/scripts/ads/__tests__/asp-operation-core.test.mjs` — §16.1 の pure unit
- `.claude/scripts/ads/affiliate-ops.mjs` — lock/health の薄い CLI (cron shell 配線用・I/O のみ)

**変更**:

- `.claude/scripts/ads/fetch-affiliate-ga4.cjs` — snapshot schema v2 (measurementEpoch / eventNames / quality)
- `.claude/scripts/ads/lib/affiliate-operations-core.mjs` — measurement gate v2 + operations schema v2 + compliance publish gate
- `.claude/scripts/ads/__tests__/affiliate-operations-core.test.mjs` — v2 条件のテスト
- `.claude/scripts/ads/build-affiliate-operations-state.ts` — v2 配線
- `.claude/scripts/ads/append-affiliate-ads.ts` — dirty preflight + byte-preserving rollback (git checkout 廃止)
- `.claude/scripts/ads/lib/asp-browser-base.mjs` — mask 拡張 / 0700・0600 / 7 日 retention / raw HTML 非保存
- `scripts/scheduled/scout-asp-weekly.sh` — step 集約 exit + health (.local/affiliate-ops/health.json) + profile lock
- `.claude/agents/asp-scout.md` / `.claude/skills/ads/affiliate-operate/SKILL.md` / `.claude/rules/affiliate-ads-standards.md` — §3 の矛盾解消のみ
- `docs/01_技術設計/playwright-auth-profiles.md` — 変動ログイン状態の削除
- `docs/21_ブログ記事原稿/{koumuin-claude-code-estat-automation,prefecture-salary-gap-career}/article.md` — PR 表記是正のローカル準備 (公開は別承認)
- `docs/todo/02_機能バックログ.md` — ASP-CONTINUITY-01 へ実測進捗の追記

**触らない** (Phase 2 以降 / 明示 scope 外): `apps/web/src/features/ads/**` (resolver/repository = Phase 2)、`a8-browser.ts` の pagination・dumpPage (Phase 4 / §8.1)、`affiliate-apply.mjs` への plan 必須配線 (Phase 3-4。Phase 1 は pure core + テストまで)、`afb-scan.mjs` / `moshimo-scan.mjs`、両 catalog の статус機械、`_common.sh` (log_run 契約は維持し内側で集約)。

## 6. 判定

**ready**。根拠: (1) 作業ツリー クリーン、(2) テスト 120 全 pass、(3) Phase 1 の全項目が外部アクセス不要でローカル可逆、(4) 対象ファイルに未コミットの併存変更なし。

制約: PR 表記是正 2 件は「ローカル準備」まで — 記事の SSOT は R2 のため、実際の是正反映は blog publish (CI・オーナー承認) が必要。compliance-latest.json は live 突合 (`--live`) が R2 を読むため、Phase 1 中は値が変わらない。
