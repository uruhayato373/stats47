---
type: backlog
category: automation
created: 2026-05-16
status: pending
---

# Automation バックログ

未実装の自動化アイデア集。優先度・実装期日は未定。

## #285 improvement-log の effect/pending 判定リマインダー自動化

## 背景

`.claude/skills/analytics/*-improvement/reference/improvement-log.md` には施策が `effect/pending` のまま放置されているエントリが多数ある。実証ベース判定ルール（`.claude/rules/evidence-based-judgment.md`）に従い、デプロイ後 N 日経過したら effect/full / partial / none / adverse のいずれかに判定すべきだが、人間が忘れがち。

## ゴール

「判定自体」は人間が実証ベースで行う必要があるため自動化しない。**「判定すべきエントリの検出」のみ自動化**する。

## 提案実装

1. 新規スクリプト `.claude/scripts/lib/scan-pending-improvements.mjs`
   - 各 improvement-log を走査
   - `effect/pending` かつ デプロイ日から 14 日以上経過しているエントリを抽出
2. 新規 workflow `.github/workflows/improvement-log-reminder-weekly.yml`
   - 毎週日曜 22:00 JST 実行
   - 上記スクリプトを実行、該当エントリがあれば `[Improvement Log Triage] YYYY-Www` Issue 起票（ラベル `improvement-log-triage`, `auto-generated`）
   - 本文に該当エントリ一覧 + 各 improvement-log への deep link

## 想定難度・工数

- S 〜 M（1-2h）
- スクリプト 100 行程度 + workflow

## 受入基準

- [ ] スクリプトがローカル dry-run で正しく pending エントリを抽出する
- [ ] workflow を手動実行して Issue が起票される
- [ ] 起票された Issue から各 pending エントリの場所が分かる
- [ ] 14 日未満は除外、auto-stub フラグ含むエントリも対象

## 関連

- `.claude/rules/evidence-based-judgment.md`
- `docs/01_技術設計/10_自動化インベントリ.md`「自動化検討中」セクション
- PR #284 で auto-stub 追記機能を実装済（このタスクは「stub の後始末」を自動化する）

---

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

## #288 /weekly-plan の前週残タスク自動転載

## 背景

`/weekly-plan` 実行時、前週の `[Weekly Review] YYYY-Www` Issue から残タスクを人間が手動転記している。Claude Routine `stats47 weekly PDCA` が動くタイミング（土曜 09:03）にこの転記まで一気にやれると人間判断が減る。

## ゴール

`stats47 weekly PDCA` Routine の中で、前週レビューの「未完了」「持ち越し」タスクを抽出して今週 plan に自動転載する。

## 提案実装

1. `.claude/skills/management/weekly-plan/SKILL.md` の Phase X として「前週残タスク取り込み」を追加
2. 抽出ロジック:
   - 前週 Weekly Review Issue を `gh issue view` で取得
   - チェックボックス `- [ ]` を全件抽出
   - チェックされていない（= 未完了）タスクを抽出
   - 同時に「持ち越し」「次週」キーワードを含むセクションを抽出
3. 今週 Weekly Plan Issue 本文の「前週からの持ち越し」セクションに自動転載
4. 既存 Claude Routine `trig_01QBPsFMqaxHdfaSqsjuzCDW` が呼ぶ skill 内で完結（新規 workflow 不要）

## 想定難度・工数

- M（1-2h）
- skill 修正中心、新規スクリプト不要

## 制約・前提

- skill 内で `gh issue view` + 正規表現でチェックボックス抽出
- AI による意味判断（「これは持ち越しか？」）は最小限に

## 受入基準

- [ ] 既存 Claude Routine 実行で前週残タスクが今週 plan に転載される
- [ ] 既存「持ち越し」セクションがあれば追記、なければ新規作成
- [ ] チェックボックス形式を維持

## 関連

- `.claude/state/triggers.json` の `stats47 weekly PDCA`
- `.claude/skills/management/weekly-plan/SKILL.md`
- `.claude/skills/management/weekly-review/SKILL.md`

---

## #289 Indexing API による問題 URL の自動再送信

## 背景

`[PSI Alert]` で 404 検出 + GSC URL Inspection で `crawlState != INDEXED` の URL を、現状は `/gsc-improvement` 実行時に人間が判断して Indexing API で再送信している。GSC が反映するまで時間がかかるため、検出から再送信までを自動化したい。

## ゴール

問題 URL の検出 → Indexing API 再送信 → 結果記録 を毎日自動化する。

## 提案実装

1. 既存 `.github/workflows/gsc-url-inspection-daily.yml` の末尾に「自動再送信」ステップ追加
2. 新規スクリプト `.claude/scripts/gsc/auto-resubmit.mjs`
   - 当日の URL Inspection 結果から `coverageState != SUBMITTED_AND_INDEXED` の URL を抽出
   - `.claude/state/metrics/gsc/resubmit-history.json` で「直近 7 日以内に再送信したか」確認
   - 再送信していなければ Indexing API (`URL_UPDATED` event) を実行
   - 結果を resubmit-history.json に追記
3. quota 制限: 200 URLs/day（公式上限）— `.claude/skills/analytics/gsc-improvement/reference/budgets.json` に閾値追加

## 想定難度・工数

- M（2-3h）
- 既存 url-inspection-daily.cjs の知見を流用、Indexing API クライアントが必要

## 制約・前提

- Indexing API は Google が「ジョブポスト・ライブ動画」用途を推奨。汎用ページは効果限定的（公式: `developers.google.com/search/apis/indexing-api`）
- 効果検証期間: 再送信から N 日後の re-inspect で coverageState が変化したかチェック
- quota 200/day を超過しないようキューイング

## 受入基準

- [ ] 当日の問題 URL 一覧を抽出
- [ ] quota チェック後に再送信
- [ ] resubmit-history.json に履歴記録
- [ ] N 日後の効果検証スクリプトを別途 cron 化（このタスクには含めない）
- [ ] 公式仕様のリスク（汎用ページは効果限定）を README で明記

## 関連

- `.claude/scripts/gsc/url-inspection-daily.cjs`
- `.claude/skills/analytics/gsc-improvement/SKILL.md`
- 親 issue: #115（GSC 未登録 1.6 万件打開）

---

## #290 /fetch-ga4-data snapshot に bot 除外クリーン値併記

## 背景

2026-05-16 の W20 監査で、GA4 snapshot に **bot / overseas / `(not set)/(not set)` の混入** を検出（W20 raw sessions 1,119 のうち 206 が overseas, 92 が完全情報欠落 = 合計 ~27% inflated）。週次レビューの絶対値（Sessions / Active Users / Bounce Rate）が水増しされており、前週比の信頼度が下がる。engagedSessions ベース判定は bot 影響軽微（overseas 206 中 engaged 25）だが、UI/レポートで両者を並べた方が判定ミスを減らせる。

詳細: `docs/03_週次運用/週次レビュー/2026-W20.md#ga4-bot-混入監査-2026-05-16`

## ゴール

`/fetch-ga4-data snapshot YYYY-Www` 実行時に **Japan-only クリーン値の CSV も自動併記** することで、レビュー時に raw / clean を両見できる。GA4 Admin 側の bot フィルタ設定とは独立の二重チェック。

## 提案実装

1. `.claude/skills/analytics/fetch-ga4-data/SKILL.md` snapshot モードスクリプトに以下を追加:
   - `overview-clean.csv` — `dimensionFilter: country=Japan` 適用
   - `channels-clean.csv` — 同上
   - `pollution-summary.csv` — overseas_sessions / notSet_sessions / direct_bounce100_landing_sessions の集計 1 行
2. observe モード（`/ga4-improvement observe`）が clean 値 と raw 値 両方を Issue コメントに記載
3. `/weekly-review` Phase 1 Agent C のドキュメント記述更新: 「Japan only クリーン値を併記して判定」

## 想定難度・工数

- S（30-60min）
- スクリプトに dimensionFilter 数行追加 + CSV 出力 + SKILL.md 文言調整

## 制約・前提

- `country=Japan` フィルタは「日本人実ユーザー」近似値。海外在住の日本人読者やモバイル VPN 利用者は除外される副作用あり（影響は小さいと想定）
- GA4 Admin の Internal Traffic / IAB Bot 除外設定が ON ならクリーン値とほぼ一致するはず → 二重チェックの意味で残す

## 受入基準

- [ ] snapshot 実行で overview-clean.csv / channels-clean.csv / pollution-summary.csv が生成される
- [ ] W20 で再実行し、本文記載の clean 値（W20 6d: sessions 911, engaged 513）と一致
- [ ] observe モードが raw / clean 両方を Issue コメントに記載
- [ ] レビュー本文テンプレに「クリーン値」表が追加される

## 関連

- `.claude/skills/analytics/fetch-ga4-data/SKILL.md`
- `.claude/skills/analytics/ga4-improvement/SKILL.md`
- `.claude/skills/management/weekly-review/SKILL.md` Phase 1 Agent C
- 検証スクリプト原型: `/tmp/ga4-pollution-check.cjs` / `/tmp/ga4-clean-compare.cjs`（W20 監査で使用）
- 監査詳細: `docs/03_週次運用/週次レビュー/2026-W20.md#ga4-bot-混入監査-2026-05-16`
