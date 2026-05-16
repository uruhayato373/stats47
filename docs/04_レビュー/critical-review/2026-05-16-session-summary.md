---
type: critical-review
date: 2026-05-16
status: active
tags: [session-summary, ga4, exp-004, exp-005, adsense, bot-detection, nsm]
related_review: docs/03_週次運用/週次レビュー/2026-W20.md
related_plan: docs/03_週次運用/週次計画/2026-W21.md
---

# セッションサマリ 2026-05-16

## 起点
週次レビュー W20 で GA4 snapshot に欠損（pages.csv / devices.csv）があるかを確認したいユーザー質問から始まり、5 つの独立した発見・改修が連鎖した。各々が次の作業の起点になっている。

## やったこと（実行順）

### 1. W20 GA4 snapshot 欠損補填
- **発見**: `.claude/skills/analytics/ga4-improvement/reference/snapshots/2026-W20/` に overview/channels/daily の 3 ファイルしかなく、pages/devices が欠損していた（W16-W19 は 5 ファイル揃っている）
- **対処**: snapshot スクリプトを再実行（per-report try/catch 付き）→ pages 940 行 / devices 3 行を取得
- **副次発見**: W20 レビュー本文の数値（Apr 12-May 9）は 5/10 取得時点、再取得値（Apr 18-May 15）と期間ズレ。snapshot に合わせて本文を全面更新

### 2. NSM 急落の最新判定（W20 レビュー課題1）
- **依頼**: W20 レビューで「NSM -39.9% 急落」が課題として未解決 → 仮説1（GW 季節変動）が支持できるか判定
- **検証**: GA4 channels で W19 (May 3-9 GW 含む) vs W20 (May 10-15) の engagedSessions を比較
- **結果**:
  - W19 engagedSessions/day: 39.4 → W20 89.7（**+128%**）
  - Organic Search engaged/day: 29.0 → 66.5（+129%）
  - engagement rate: 50.0% → 48.1%（平日のみ 53.7%）= 横ばい
- **判定**: 仮説1（GW 季節変動）完全支持・仮説2（engagement 率低下）棄却 → 急落は GW 一過性で完全回復
- **反映**: W20 レビュー課題1 解消マーク / W21 計画の追跡タスクを完了 close

### 3. GA4 bot 混入監査
- **発見**: NSM 判定の過程で W20 raw sessions に bot 混入を検出
  - overseas (country ≠ Japan): 206 sessions (engagement 12%、bot 推定)
  - (not set)/(not set): 92 sessions（W19 2 → **+4,500%** 激増、スキャナ疑い）
  - Direct で bounce 100% の `/areas/01000/*` 北海道網羅巡回 55、`/this-page-does-not-exist-at-all` 5
  - 空文字 landing page (Unassigned): 83
- **影響評価**:
  - engagedSessions ベース判定は妥当（bot 影響軽微 12%）
  - 絶対値 (Sessions / Active Users / Bounce Rate) は **W20 で約 18-27% inflated**
  - 副次発見: Bounce Rate raw 50.3% → clean 38.4% で大幅改善（bot が直帰を引き上げていた）

### 4. action plan 作成 + Tier 1 実行
- **保存**: `docs/04_レビュー/critical-review/2026-05-16-ga4-bot-pollution.md` に Tier 1/2/3 タスクと完了基準を整理
- **Tier 1 完了**（私が実行可）:
  - #A1 W20 レビュー本文に脚注 + Japan-only クリーン値表追加
  - #A2 `/fetch-ga4-data` snapshot 改修（`overview-clean.csv` / `channels-clean.csv` / `pollution-summary.csv` 追加、country=Japan フィルタ）
  - #A3 `/weekly-review` SKILL.md template を raw / clean / pollution の 3 表構成に更新
- **backlog #290** として automation-backlog に起票（同時実装で完了）

### 5. EXP-004 PSI LCP 判定 → close + EXP-005 立案
- **計測**: PSI API quota 超過で新規計測不可 → `.claude/state/metrics/psi/history.csv` から判定
  - baseline 8,251ms (4/25) → 5/15 実測 8,476ms（+2.7%）
  - 目標 <3,000ms に大幅未達 → **effect/none**
  - EXP-003 ADVERSE (16,426ms) からは -48% 回復（rollback としては成功）
- **判定**: experiments.json を `result=NONE` で close、measuring_observations / learnings / actions / history を更新
- **学び**: CookieConsent SSR 化は LCP 要素ではなかった。EXP-002/003/004 と 3 連続で「LCP 要素を特定せず hydration 仮説で改修」→ 全て failure
- **EXP-005 立案**（proposed 状態）: 改修せず **LCP 要素の実証ベース特定だけ** を行う Phase 1。Phase 2 (EXP-006/007) で要素タイプ別対策を別実験
- **反映**: `docs/05_改善ログ/psi.md` に T1-PSI-LCP-03 (EXP-004) と T1-PSI-LCP-04 (EXP-005) 追加 / W21 計画と W20 レビュー課題2 を更新

### 6. AdSense W20 取得（進行中）
- **失敗**: OAuth refresh_token が `invalid_grant`（約 3 週間未使用で失効、Google Testing OAuth の仕様）
- **対処**: `/tmp/get-adsense-token.cjs` を起動 → ブラウザ認可 URL 提示 → バックグラウンドで refresh_token 受信待ち
- **状態**: ユーザーの OAuth 同意操作待ち

## 成果物一覧

### 新規作成
| ファイル | 内容 |
|---|---|
| `docs/04_レビュー/critical-review/2026-05-16-ga4-bot-pollution.md` | bot 混入監査と Tier 1-3 action plan |
| `docs/04_レビュー/critical-review/2026-05-16-session-summary.md` | このファイル |

### 更新
| ファイル | 主要変更 |
|---|---|
| `.claude/skills/analytics/fetch-ga4-data/SKILL.md` | snapshot に Japan-only クリーン値 + pollution-summary 追加 |
| `.claude/skills/management/weekly-review/SKILL.md` | GA4 セクション template に raw/clean/pollution の 3 表構成 |
| `.claude/state/experiments.json` | EXP-004 close (NONE), EXP-005 追加 (proposed) |
| `docs/03_週次運用/週次レビュー/2026-W20.md` | GA4 数値・クリーン値表・bot 監査セクション・課題 1-2 close・申し送り更新 |
| `docs/03_週次運用/週次計画/2026-W21.md` | NSM 追跡 / EXP-004 を close、EXP-005 タスクに置換、GA4 bot 対応セクション追加 |
| `docs/05_改善ログ/psi.md` | T1-PSI-LCP-03 (EXP-004 effect/none) / T1-PSI-LCP-04 (EXP-005 proposed) を append |
| `docs/50_Issues/automation-backlog.md` | #290 fetch-ga4-data 改修案を起票（実装は同時完了） |
| `.claude/skills/analytics/ga4-improvement/reference/snapshots/2026-W20/` | 8 ファイル（raw 5 + clean 2 + pollution 1） |

## 次にやるべきこと

優先度順。各項目は本日セッションで作った artifact を参照して着手可能。

### 即時（人間操作必要、私の作業はブロック中）
1. **AdSense OAuth 認可** — ブラウザで提示済み URL を開いて Google アカウントで認可
   - URL 完了後: `/tmp/get-adsense-token.cjs` のバックグラウンド出力から refresh_token を `.env.local` に保存 → 私が W20 snapshot を取得 → W20 レビューに AdSense セクション追加
   - スクリプト出力先: `/private/tmp/claude-501/-Users-minamidaisuke-stats47/fd3a03b5-c54f-41f3-9c33-437f897fbeb6/tasks/bn3u0mfgg.output`

### 短期（W21 中、人間判断必要）
2. **GA4 Admin 設定確認** (#B1, action plan 参照)
   - Admin > Data Settings > Data Filters で「IAB/ABC Spiders & Bots」と Internal Traffic 除外が ON か確認
   - 確認結果を action plan ファイルに追記

3. **Cloudflare WAF Custom rule 追加** (#B2)
   - `(http.request.uri.path eq "/this-page-does-not-exist-at-all")` → Block
   - `/areas/[0-9]{5}/` への海外 IP アクセス → Managed Challenge
   - 1 週間後に notSet sessions が減少することを W21 末で確認

### 短期（私が着手可能、quota 待ち）
4. **EXP-005 Phase 1 着手** — PSI API quota リセット後（明日以降）
   - 主要 5 URL (homepage / ranking / blog / search / areas) × mobile/desktop × 3 回計測
   - `lighthouseResult.audits["largest-contentful-paint-element"].details` で要素特定
   - 要素タイプ別の Phase 2 施策候補（EXP-006/007）を立案 → experiments.json に proposed で追加

5. **令和7年賃金調査 SNS 投稿** (W21 計画 Must、タイミング限定)
   - X + Instagram に 3 件以上、平均年収・初任給ランキング
   - 既存データで対応可能。スキル: `/post-x`, `/post-instagram`

6. **ブログ記事 CTR 改善（30分・1本）** (W21 計画 Should)
   - brushup-queue 上位 `manufacturing-aichi-dominance`（344 imp、CTR 0%）のタイトル + meta description 改善
   - スキル: `/brushup-blog-article`

### 中期（後日 backlog 起票候補）
7. **#C1 pollution-history 自動追跡** (action plan Tier 3)
   - `/fetch-ga4-data` snapshot の pollution-summary.csv を `.claude/state/metrics/ga4/pollution-history.csv` に append
   - 週次レビューで前週比 +30% 超なら自動アラート
   - automation-backlog #291 として起票候補（未着手）

8. **fetch-ga4-data の per-report try/catch 標準化** (今日の経験から)
   - W20 で pages.csv / devices.csv が欠損した根本原因（1 つの API エラーで後続がスキップされる）
   - SKILL.md の snapshot スクリプトに try/catch を per-report で標準化済みだが、`/tmp/` の検証版のみ。SKILL.md 本体への反映は未

## このセッションでの判断ハイライト

| 判断 | 根拠 |
|---|---|
| W20 レビュー本文を全面更新（snapshot に合わせる） | ユーザー回答（4択中「snapshot に合わせて本文を全面更新（推奨）」を選択） |
| NSM 急落は GW 一過性で確定 | engagedSessions/day +128%、Organic +129%、engagement rate 横ばい = 3 指標が一致 |
| EXP-004 を 1 回計測のみで close | 履歴データ充分（4/24-5/15 で複数回計測）、ADVERSE rollback としては成功、目標達成率 0% で判定は強固 |
| EXP-005 を改修なしの調査 phase として設計 | EXP-002/003/004 連続失敗の根本原因＝「LCP 要素未特定」を絶ち切る必要 |
| GA4 bot 対応を Tier 1-3 で段階化 | 即時実行可能なもの (Tier 1) と人間操作必要 (Tier 2) を分離、責任所在を明確化 |

## 関連リンク

- 監査詳細: `docs/04_レビュー/critical-review/2026-05-16-ga4-bot-pollution.md`
- 該当週次レビュー: `docs/03_週次運用/週次レビュー/2026-W20.md`
- 当該週次計画: `docs/03_週次運用/週次計画/2026-W21.md`
- 実験記録: `.claude/state/experiments.json` EXP-004 / EXP-005
- 改善ログ: `docs/05_改善ログ/psi.md` T1-PSI-LCP-03 / T1-PSI-LCP-04
- 機能 backlog: `docs/50_Issues/automation-backlog.md` #290 / 将来 #291
- 評価ルール: `.claude/rules/evidence-based-judgment.md`
