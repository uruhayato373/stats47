# YouTube 運用 Playbook

> **このファイルは YouTube 運用ルールの単一ソース。** ルール変更は本ファイルを直接編集し、末尾「改訂履歴」に 1 行追記すること。週次の振り返り・event ログは `.claude/state/metrics/youtube/LATEST.md` と関連 Recovery Issue を参照。

---

## 監視ルール

- 日次計測: GitHub Actions `.github/workflows/youtube-audit-daily.yml`（JST 09:00 毎日）
- 計測本体: `.claude/scripts/youtube/youtube-daily-audit.mjs` → `.claude/scripts/youtube/diagnose-shadowban.js`
- Snapshot 置き場: `.claude/state/metrics/youtube/`
  - `youtube-batch-<ISO>.json`: 生データ
  - `history.csv`: 日次サマリの append-only 履歴
  - `LATEST.md`: 前日比つき人間向けレポート

### 判定閾値（`diagnose-shadowban.js` の verdict ロジック）

| verdict | 条件 |
|---|---|
| `likely-shadowban` | suspectVideos ≥ 5、または reasons が 2 つ以上、または (suspectVideos ≥ 2 かつ viewsDeltaPct ≤ -80%) |
| `watch` | reasons が 1 つ |
| `healthy` | それ以外 |

reasons の定義:
- suspectVideos ≥ 2（48h 経過で views < 50）
- viewsDeltaPct ≤ -50%（直近 14 日 vs その前 14 日）
- suggested-video traffic ≤ -80%
- 登録者 net 負（gained < lost）

閾値を変更したら「改訂履歴」に記録。

---

## 停止ルール（pause）

- **デフォルト停止期間: 2 週間**（アルゴリズム評価のリセット目安）
- State: `.claude/state/youtube-pause.json`
- 延長条件: 復帰テスト 48h で views < 50 → 7 日延長
- 停止中の投稿は `.claude/scripts/lib/check-youtube-post-budget.cjs` ガードが `publish-youtube-normal` / `post-youtube` / `upload.js` 全てを exit 1 で止める

---

## 復帰テスト手順

- 形式: **Bar Chart Race 1 本**（BCR が視聴維持率 60-68% で最優秀）
- 尺: **28 秒厳守**
- 公開時刻: **JST 20:00**
- テーマは「教育・学歴」「産業・ビジネス」「犯罪・治安」「人口・少子高齢化」「お金・経済」カテゴリから選定（`.claude/agents/youtube-strategist.md` 参照）

### 判定（投稿 48h 後）

- views ≥ 100 → **pause 解除**、週 2 本運用で再開
- views < 50 → pause を 7 日延長、別テーマで再テスト
- 50 ≤ views < 100 → 48h 追加延長（72h 再判定）

---

## Claude routine の配置

| routine | Cron | 用途 |
|---|---|---|
| `stats47 YouTube weekly review` | 月曜 JST 09:15 | 直近 7 日の history を読み、`.claude/state/metrics/youtube/LATEST.md` を更新（必要に応じて関連 Recovery Issue へコメント） |
| one-off（発生時のみ） | pause 期限前日 JST 09:00 | `[YouTube Pause Expiry Reminder]` — 翌日の解除を予告、復帰テスト BCR の準備確認 |
| one-off（発生時のみ） | 復帰テスト 48h 後 JST 09:00 | `[YouTube Recovery Judgment]` — 48h views を取得して判定 |

通常時は週 1 回のみ（budget 消費 1/15/週）。recovery cycle 中は最大 3/週。

---

## 関連スクリプト・スキル

- `/diagnose-youtube-shadowban` — 単発診断（手動でも呼べる）
- `/recover-youtube-shadowban` — 7 フェーズ回復パイプライン
- `.claude/scripts/youtube/diagnose-shadowban.js` — 診断ロジック本体
- `.claude/scripts/youtube/youtube-daily-audit.mjs` — 日次 workflow のエントリ
- `.claude/scripts/youtube/update-privacy.js` — 疑い動画の一括 private 化
- `.claude/scripts/lib/check-youtube-post-budget.cjs` — 投稿ガード（停止期間＋週 3 本）
- `.claude/agents/youtube-strategist.md` — チャンネル戦略（テーマ選定、維持率ベンチマーク）

---

## Issue 運用の分類

| タイプ | タイトル例 | ラベル | ライフサイクル |
|---|---|---|---|
| Recovery Issue | `[YouTube Recovery] YYYY-MM-DD` | `youtube-experiment` | 回復完了時に close |
| Alert Issue（自動起票） | `[YouTube Alert] likely-shadowban YYYY-MM-DD` | `youtube-experiment, auto-generated` | 対応開始時に Recovery Issue に合流して close |
| 実験 Issue | `[YouTube Exp] EXP-NNN` | `youtube-experiment` | 判定確定で close |

旧 `[Playbook] YouTube Monitoring & Recovery` Meta-Issue（#91、ラベル `youtube-playbook`）は本ファイルへ移行して 2026-05-16 に close 済み。`youtube-playbook` ラベルは廃止。

---

## 過去の recovery event

| 発生日 | Issue | 時点 suspect | 停止期間 | 解除日 | 学び |
|---|---|---|---|---|---|
| 2026-04-24 | #88 | 17 | 〜2026-05-08 | (記入予定) | (記入予定) |

---

## 改訂履歴

| 日付 | 変更 | 理由 |
|---|---|---|
| 2026-04-24 | 初版作成 | 2026-04-24 のシャドウバン対応（#88）を受けて、運用ルールを単一 Issue (#91) に集約 |
| 2026-05-16 | Issue #91 → docs 移行 | Playbook は永続運用ドキュメントであり Issue lifecycle（作業→close）にそぐわないため、docs/10_SNS戦略/ に格納 |
