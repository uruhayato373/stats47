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

1. **observe モードの raw / clean 併記** — `.claude/skills/analytics/ga4-improvement/SKILL.md` の observe フェーズで Issue コメントに両方表示するよう改修
2. **weekly-review 本文テンプレ更新** — `.claude/skills/management/weekly-review/SKILL.md` Phase 1 Agent C に「Japan-only クリーン値を併記して判定」を明記
3. **W22 動作検証** — 次週日曜 (2026-05-24) の自動 snapshot で 3 つの clean ファイルが生成されるか、想定値 (W20 6d: sessions 911, engaged 513) と整合するかを確認

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
