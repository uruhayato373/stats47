---
type: backlog
category: automation
created: 2026-05-16
status: pending
---

# Automation バックログ

未実装の自動化アイデア集。優先度・実装期日は未定。

## #286 Cloudflare 請求書 PDF 自動取得 + 精算 Issue 起票

## 背景

Cloudflare の請求書は毎月メールで PDF 配信される。現状は到着時に手動で `/cloudflare-cost-improvement invoice` を実行して `.claude/skills/analytics/cloudflare-cost-improvement/reference/monthly-snapshots/` の予測値と突合。請求書が届いたことを覚えていないと精算が遅れる。

## ゴール

請求書到着時に自動で予測との差分を検知し、Issue 起票して人間にレビューを促す。

## 提案実装

1. Gmail MCP で `noreply@cloudflare.com` from の請求関連メールを 1 日 1 回確認
2. 添付 PDF をダウンロードして `.claude/scripts/cloudflare/parse-invoice.mjs` で金額抽出
3. 既存 `monthly-snapshots/YYYY-MM.json` の予測値と突合
4. 差分が ±10% を超えたら `[Cloudflare Invoice Reconciliation] YYYY-MM` Issue 起票

## 想定難度・工数

- L（半日以上）
- Gmail MCP セットアップ + PDF parser 選定（pdf-parse / pdfjs-dist）+ 既存 snapshot との突合ロジック

## 制約・前提

- Gmail MCP の認証スコープ確認
- 請求書 PDF のレイアウト変更に脆い（テスト用 fixture を残す）
- PR #284 の `cloudflare-monthly-snapshot.yml` が前段で動いていることが前提

## 受入基準

- [ ] Gmail から Cloudflare 請求メール検出
- [ ] PDF から金額・期間・項目を抽出
- [ ] 既存 monthly snapshot との突合で差分検出
- [ ] 差分 > 10% で Issue 起票、それ以下なら snapshot に actual_cost を追記して終了

## 関連

- PR #284 で月次予測 snapshot は自動化済（このタスクは「予測 vs 実績」の検証を自動化する）
- `.claude/skills/analytics/cloudflare-cost-improvement/SKILL.md`

---

## #287 auto-generated alert Issue の月初自動 close

## 背景

`[PSI Alert]` `[Cloudflare Alert]` `[YouTube Alert]` 等の auto-generated Issue は日次起票されるが close 操作が手動。2026-05-16 時点で 10 件溜まっていた（PR #284 で一括 close）。今後も放置すれば再蓄積する。

## ゴール

stale な auto-generated alert を月初に自動 close する。ただし「閾値超過状態が継続中」のものまで close しないよう慎重に。

## 提案実装

1. 新規 workflow `.github/workflows/triage-stale-alerts-monthly.yml`
   - 毎月 1 日 JST 10:00 実行
2. スクリプト `.claude/scripts/triage/close-stale-alerts.mjs`
   - 対象ラベル: `psi-snapshot,auto-generated` / `cost-snapshot,auto-generated` / `youtube-experiment,auto-generated`
   - 条件: open かつ updated_at が 14 日以上前
   - 例外: 同種の新しい alert（同じラベル）が直近 3 日以内に立っていれば「閾値継続超過」と判断、close せず該当 alert にコメントを残して引き継ぎ
3. 月初実行サマリを `[Auto Alert Triage] YYYY-MM` Issue で記録

## 想定難度・工数

- S（30 min - 1h）
- gh API 叩くだけ

## 制約・前提

- close 判定ロジックを慎重に（誤 close で重要 alert を見逃すリスク）
- dry-run モードで先に動作確認

## 受入基準

- [ ] dry-run で対象 Issue 一覧を出力
- [ ] 閾値継続中の alert は除外される
- [ ] 月次サマリ Issue が立ち、close した件数 + 残置した件数を記載

## 関連

- PR #284 で 10 件 stale alert を手動 close（再発防止のためこの自動化が必要）
- `docs/01_技術設計/10_自動化インベントリ.md`

---

## #289 [moved] Indexing API による問題 URL の自動再送信

> **2026-05-18 移行**: 本タスクは `docs/05_改善ログ/indexing.md` の `[INDEXING-AUTO-01]` に移行。Phase 2 (W23-W24) で実装予定。

---

## #291 Claude Code 利用品質改善 (Hooks / MCP D1 / safe-* スキル)

## 背景

2026-05-15 に 90 セッション・177 時間分の Claude Code 利用ログを分析した結果、以下の頻発課題を確認:

- 誤診断ループ (修正失敗の繰り返し)
- 環境起因の中断 (Cloudflare token 期限切れ / Cache Purge 権限不足 / DB スキーマドリフト)
- Git 操作ミス (feature ブランチ経由せず develop に直 commit / 大量アセット誤 stage)
- UI 修正の反復失敗 (仮説なき試行)
- Issue 完了アウトカム記録漏れ

## 提案実装 (4 件未着手)

1. **Hooks ブランチチェック** — `.claude/settings.json` `PreToolUse` で Bash 時に現在ブランチ確認、`feature/*` 以外なら停止
2. **MCP D1 サーバー追加** — `claude mcp add d1 -- npx -y @cloudflare/mcp-server-d1` で DB クエリ前にスキーマ自動インスペクト
3. **`safe-commit` スキル** — `.claude/skills/dev/safe-commit/SKILL.md` でブランチチェック + `git status` 表示 + アセット除外確認 + commit & push
4. **`safe-deploy` スキル** — ビルド + 型チェック + デプロイ + 本番 URL スモークテスト (5 URL × HTTP 200) + 失敗時自動診断

CLAUDE.md への運用ルール追記 (Git ワークフロー / DB 操作 / Issue 追跡 / デプロイ前チェックリスト / UI 修正ルール) は別途 Edit で実施。

## 想定難度・工数

- 各 S 〜 M (合計 4-6h)

## 関連

- 元分析 (削除済み 2026-05-17): `docs/insights-action-plan.md` (git log で参照可)
- `.claude/rules/evidence-based-judgment.md` — 効果検証ルール

---

## #292 e-Stat 以外データソース統合 (世界 / 国内追加)

## 背景

2026 年早期に「日本以外の統計データ」「気象庁・RESAS 等の国内追加データソース」統合計画を立てたが未着手。当面 stats47 のコア (e-Stat 47 都道府県) に注力するため、要件発生時に再評価する。

## 提案実装

要件発生時に以下を検討:

- **世界統計**: World Bank Open Data API / OECD API / WHO データ — 日本の世界における位置付け・国別ランキング
- **国内追加**: 気象庁 (天気予報 + 過去気象データ)、RESAS (地域経済分析システム)、国土交通省データプラットフォーム — 都道府県別の補完指標

## 想定難度・工数

- L 〜 XL (新規データソースごとに数日〜数週間)

## 関連

- 元計画 (削除済み 2026-05-17): `docs/80_参考資料/日本の統計.md` `docs/80_参考資料/世界の統計.md` (git log で参照可)
- 既存: `docs/01_技術設計/09_国土交通データプラットフォーム.md`

---

## 完了履歴 (2026-05-18 削除)

W21 SEO TODO 一元化 sprint (PR #308 / #310 / #311) で deployed 済のため backlog から削除。詳細は git log および各 PR 本文を参照。

| 元 ID | タスク | deploy 場所 |
|---|---|---|
| #285 | improvement-log triage 週次自動化 | PR #308: `.github/workflows/improvement-log-reminder-weekly.yml` + `.claude/scripts/lib/scan-pending-improvements.mjs` |
| #288 | /weekly-plan 前週残タスク自動転載 | PR #308: `.claude/skills/management/weekly-plan/SKILL.md` Phase 1 Agent D |
| #289 | Indexing API による問題 URL の自動再送信 | PR #310: `.claude/skills/analytics/auto-resubmit-url/SKILL.md` + `.claude/scripts/gsc/auto-resubmit.mjs` (改善ログ `docs/05_改善ログ/indexing.md` [INDEXING-AUTO-01] に移行) |
| #290 | /fetch-ga4-data snapshot に bot 除外クリーン値併記 | PR #308 / #310: `.claude/skills/analytics/fetch-ga4-data/SKILL.md` snapshot モード + `.claude/skills/analytics/ga4-improvement/SKILL.md` observe |

以後は `docs/05_改善ログ/<metric>.md` を真実源とする (CLAUDE.md「改善施策の TODO 真実源」)。
