---
type: improvement-log
metric: ga4
created: 2026-05-18
updated: 2026-05-18
---

# GA4 改善ログ

GA4 計測の bot 混入対策・NSM (engagedSessions) 改善・bounce rate 対策など GA4 メトリクス関連施策。施策ベースで append-only。新しい施策は最新を上に追加。判定が変わったら section 末尾に追記。

このログに記録する対象:
- GA4 計測精度 (bot 除外、海外フィルタ、(not set) 削減)
- NSM (engagedSessions) 改善
- Bounce Rate / Session Duration 改善
- カスタムイベント追加・修正

このログに記録しない対象:
- AdSense 収益 → `adsense.md`
- 流入経路 (organic 増加) → `gsc.md`
- ページ単位の UX 改善 → `psi.md`

## [GA4-CLEAN-01] /fetch-ga4-data snapshot に Japan-only クリーン値併記 (Phase 1)

- **status**: in-progress
- **tier**: 1
- **target_metric**: ga4-measurement-accuracy
- **owner**: claude
- **deployed_at**: 2026-05-04
- **due**: 2026-06-07
- **related_plan**: `/Users/minamidaisuke/.claude/plans/docs-gsc-ga4-seo-todo-g-rosy-hamming.md` Phase 1
- **verification_command**: `/fetch-ga4-data last7d snapshot 2026-W22 && ls .claude/skills/analytics/ga4-improvement/reference/snapshots/2026-W22/*-clean.csv`

### 現状 (2026-05-18 時点)

`.claude/skills/analytics/fetch-ga4-data/SKILL.md` の snapshot モードに以下が既に実装済 (line 313-430):

- `overview-clean.csv` (country=Japan only, engagedSessions / engagementRate 含む)
- `channels-clean.csv` (country=Japan only)
- `pollution-summary.csv` (overseas_sessions / overseas_engagedSessions / notSet_sessions の集計 1 行)

### 残作業

1. ✅ **observe モードの raw / clean 併記** — `.claude/skills/analytics/ga4-improvement/SKILL.md` の Step 2 に inflation% 計算式と表形式併記の指示を追加済 (2026-05-18)
2. ✅ **weekly-review 本文テンプレ** — `.claude/skills/management/weekly-review/SKILL.md` line 107 に「raw と clean の両方を併記」既に明記済 (確認のみ)
3. ⏸ **W22 動作検証** — 次週日曜 (2026-05-24) の自動 snapshot で 3 つの clean ファイルが生成されるか、想定値 (W20 6d: sessions 911, engaged 513) と整合するかを確認

### 背景

2026-05-16 の W20 監査で、GA4 snapshot に bot / overseas / `(not set)/(not set)` の混入を検出 (W20 raw sessions 1,119 のうち 206 が overseas, 92 が完全情報欠落 = 合計 ~27% inflated)。週次レビューの絶対値 (Sessions / Active Users / Bounce Rate) が水増しされ、前週比の信頼度が下がっていた。

engagedSessions ベース判定は bot 影響軽微 (overseas 206 中 engaged 25) だが、UI/レポートで両者を並べた方が判定ミスを減らせる。

automation-backlog #290 (`docs/50_Issues/automation-backlog.md` から移行)。

### 施策

1. `.claude/skills/analytics/fetch-ga4-data/SKILL.md` snapshot モードに以下を追加:
   - `overview-clean.csv` — `dimensionFilter: country=Japan` 適用
   - `channels-clean.csv` — 同上
   - `pollution-summary.csv` — overseas_sessions / notSet_sessions / direct_bounce100_landing_sessions の集計 1 行
2. observe モード (`/ga4-improvement observe`) が clean 値 と raw 値 両方を Issue コメントに記載
3. `/weekly-review` Phase 1 Agent C のドキュメント記述更新: 「Japan only クリーン値を併記して判定」

### 想定効果

- 想定: 週次レビュー判定時の Sessions/Active Users の信頼度が +30% (raw 値の 27% inflation を可視化)
- 根拠: W20 監査で overseas 206/1,119 = 18.4% 混入を実測 (`/tmp/ga4-pollution-check.cjs` 結果)

### 検証

- **検証コマンド**:
  ```
  /fetch-ga4-data last7d snapshot 2026-W22
  ls -la .claude/skills/analytics/ga4-improvement/reference/snapshots/2026-W22/
  # → overview-clean.csv / channels-clean.csv / pollution-summary.csv が存在
  ```
- **検証期日**: 2026-06-07 (W23)
- **期日後の判定**:
  - 3 ファイル生成 ＋ W22 でクリーン値が raw 値より 15-30% 低い → effect/full
  - 3 ファイル生成 のみ → effect/partial (実測値の差異が想定外)
  - ファイル生成失敗 → effect/none (実装ミス)

### 移行元

`docs/50_Issues/automation-backlog.md` #290 (本施策へ移行・元 section 削除)。

## [GA4-BOT-01] GA4 Admin の bot/internal traffic 除外設定確認

- **status**: pending
- **tier**: 2
- **target_metric**: ga4-measurement-accuracy
- **owner**: uruhayato373
- **due**: 2026-06-07
- **related_review**: 2026-05-16-ga4-bot-pollution.md (削除済、critical-review カバレッジ整理から移行)

### 背景

W20 監査で notSet sessions が W19 比 +4,500% (2→92)、Direct × bounce 100% の bot 巡回パターンを多数検出。GA4 Admin 側の bot/internal filter が有効か未確認 (デフォルト ON のはずだが手動確認必要)。

### 施策

GA4 Admin > Data Settings > Data Filters で以下を確認:

1. 「Exclude all hits from known bots and spiders」(IAB/ABC Spiders & Bots List) が ON
2. Internal Traffic フィルタが定義され Active か (自宅 / オフィス IP)
3. Developer Traffic フィルタの状態

### 検証

- **検証コマンド**: 手動確認 (GA4 Admin UI スクリーンショット)
- **期日後の判定**: 確認結果を本 section に追記して `status: effect/full` (フィルタ ON + active)

## [GA4-BOT-02] Cloudflare WAF rule で bot スキャナをブロック

- **status**: pending
- **tier**: 2
- **target_metric**: ga4-measurement-accuracy + cloudflare-cost
- **owner**: uruhayato373
- **due**: 2026-06-14
- **related_review**: 2026-05-16-ga4-bot-pollution.md (削除済、critical-review カバレッジ整理から移行)

### 背景

W20 で `/this-page-does-not-exist-at-all` 5 sessions、`/areas/01000/economy` 等への海外連続アクセス検出。これらは GA4 計測の noise だけでなく Cloudflare Workers 実行 / R2 fetch も消費している。

### 施策

Cloudflare Dashboard > Security > WAF > Custom rules に以下を追加:

1. `(http.request.uri.path eq "/this-page-does-not-exist-at-all")` → Block
2. `(http.request.uri.path matches "^/areas/[0-9]{5}/" and ip.geoip.country ne "JP" and not cf.client.bot)` → Managed Challenge

### 検証

- **検証コマンド**: 1 週間運用後、`/fetch-ga4-data last7d snapshot` で pollution-summary.csv の notSet_sessions が W20 (92) より減少を確認
- **検証期日**: 2026-06-21 (W25)
- **期日後の判定**:
  - notSet < 30 → effect/full
  - notSet 30-60 → effect/partial
  - notSet ≥ 60 → effect/none (rule 調整必要)

## [GA4-PIPELINE-02] history.csv の pageviews を「カレンダー週バケット + Japan-only」に統一

- **status**: pending
- **tier**: 2
- **target_metric**: ga4-data-pipeline + ga4-measurement-accuracy
- **owner**: claude
- **due**: 2026-06-21
- **related_review**: 2026-05-21-monetization.md (削除済、critical-review カバレッジ整理から移行)
- **related_memory**: `feedback_ga4_history_unreliable_wow.md`

### 背景

2026-05-21 監査で `.claude/state/metrics/ga4/history.csv` の `pageviews` 列は週次ラベルが付くが実態は **last28d ローリング値 or bot 混入値** が混在し、週次ラベルと中身が一致しないことが判明。W20=9,028 はカレンダー週実測 2,039 と 4.4 倍乖離。

これにより:
- `LATEST.md` の前週比が誤算出 (W21 PV 「-68.7%」は計測アーティファクト)
- `weekly-review` / `weekly-plan` が GA4 PV の WoW で誤判定する
- 暫定対処として WoW 監視は GSC clicks に逃がしているが恒久対処が必要

### 施策

1. `.claude/skills/analytics/ga4-improvement/reference/` の history 生成スクリプトを以下に変更:
   - 週バケット: ISO 週 (月-日) で集計
   - country=Japan フィルタを必須化 (overview-clean と同じ取り扱い)
2. 既存 history.csv は backup → 過去 6 週分を再生成 (API quota 範囲内なら)
3. LATEST.md の前週比計算を新 history に基づき再計算

### 想定効果

- 想定: weekly-review の GA4 PV WoW 判定が信頼可能に戻る
- 根拠: 2026-05-21 監査の実証 (実カレンダー週 W20=2,039 vs history.csv W20=9,028)

### 検証

- **検証コマンド**: `awk -F',' '$1=="2026-W21"' .claude/state/metrics/ga4/history.csv` で pageviews が GA4 API 直接照会値 (~2,836) と ±5% 以内
- **検証期日**: 2026-06-21 (W25)
- **期日後の判定**:
  - history.csv の各週値が API 直接照会と ±5% 以内 → effect/full
  - 直近 1 週のみ整合 → effect/partial (バックフィル失敗)

## [GA4-PIPELINE-01] fetch-ga4-data snapshot に per-report try/catch を標準化

- **status**: pending
- **tier**: 2
- **target_metric**: ga4-data-pipeline
- **owner**: claude
- **due**: 2026-06-14
- **related_review**: 2026-05-16-session-summary.md (削除済、critical-review カバレッジ整理から移行)

### 背景

2026-05-16 の W20 snapshot で `pages.csv` / `devices.csv` が欠損していた。`/tmp/` の検証版スクリプトには per-report try/catch を入れたが、`/fetch-ga4-data` SKILL.md 本体の snapshot スクリプトには未反映。1 つの GA4 API エラーで後続レポートがスキップされる脆弱性が残っている。

### 施策

`.claude/skills/analytics/fetch-ga4-data/SKILL.md` の snapshot スクリプトを各 report (overview / channels / daily / pages / devices) ごとに `try { fetch } catch (e) { console.warn; continue }` の形に変更し、1 レポート失敗が他に波及しないようにする。

### 検証

- **検証コマンド**: `/fetch-ga4-data lastWeek snapshot 2026-Wnn` 実行後、5 ファイル (overview/channels/daily/pages/devices) すべて生成される
- **検証期日**: 2026-06-14
- **期日後の判定**: 5 ファイル揃う → effect/full、欠損残る → effect/partial

## [GA4-TEMPLATE] 新規施策テンプレ

新しい施策を追加するとき以下をコピーして埋める。

```markdown
## [GA4-XXX] タイトル (期間)

- **status**: pending | in-progress | effect/full | effect/partial | effect/none | effect/adverse | blocked
- **tier**: 1 | 2 | 3
- **target_metric**: ga4-* (engaged-sessions / bounce-rate / session-duration / measurement-accuracy)
- **owner**: claude | uruhayato373
- **deployed_at**: YYYY-MM-DD
- **due**: YYYY-MM-DD
- **related_pr**: #N

### 背景

### 施策

### 想定効果

### 検証

- **検証コマンド**:
- **検証期日**:
- **期日後の判定**:
```
