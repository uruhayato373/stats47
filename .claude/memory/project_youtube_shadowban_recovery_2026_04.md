---
name: YouTube シャドウバン回復 (2026-04-24 → 2026-05-26)
description: 【2026-05-29 自動運用撤退で打ち切り・履歴アーカイブ】Issue #88 回復努力の記録。2026-08-23 の通常動画 pilot でも旧回復自動化は再開しない。経緯は [[project_env_local_ci_consolidation]]
type: project
originSessionId: c9531999-b179-475d-b95d-acf0a75b0d37
---

> ⚠️ **2026-05-29: YouTube 自動運用から撤退**（shadowban 継続で SUGGESTED_VIDEO=0 + 低 ROI: 32 subs/~7 views/日 + 戦略上 IG 集中）。関連 skill/script/CI（24 ファイル）は `feature/youtube-withdrawal` で削除済。本 memory は**回復努力の履歴アーカイブ**。2026-08-23 からは EXP-006 として通常動画3本を手動制作・手動投稿するが、旧 Shorts 量産・OAuth・回復自動化は再開しない。経緯: [[project_env_local_ci_consolidation]]

2026-04-24 に `/diagnose-youtube-shadowban` でシャドウバン疑い確定（17 本が views < 50）→ Issue #88 集約 → 2026-05-16 CLOSED。Recovery 完了とされたが daily audit の verdict は `likely-shadowban` 継続。2026-05-26 に根本原因調査でチャンネル整理を実施。

## 真の根本原因（2026-05-26 判明）

OAuth 失効・個人 ch 誤投稿に加え、**2026-03 の Shorts 量産＋重複コンテンツ** がシャドウバンの最有力引き金。

- 2026-03 に 68 本/月の Shorts 投稿（前月比 23 倍）
- うち 35% が重複（同タイトル再投稿、テンプレ違いの同テーマ）
- 完全重複の例: 「離婚率ランキング 沖縄が断トツ1位」を同日に 2 本同タイトルで投稿（2249v × 2）
- 再アップロード: 「大阪vs愛知 シリーズ」3 本を 2026-03-19 と 2026-03-28 に同タイトルで再投稿
- YouTube は duplicate content / reupload spam と判定 → 2026-04-24 シャドウバン発動

## 2026-05-26 のチャンネル整理

| ラウンド | 削除内容 | 数 |
|---|---|---:|
| 1 | 縦長 Shorts (views<50) + 横長通常動画 (views<50) | 76 |
| 2 | 重複片側 (14 グループ) + テスト動画 + 単独 views<200 | 19 |
| **累計** | | **95** |

結果: チャンネル動画数 175 → 80 本（縦長 Shorts 76 + 横長 4）。残存 Shorts は全て views ≥ 200。

## 投稿の Why / How to apply（次に動かす時）

**Why**: 量産モード（68 本/月）に入った 2026-03 に重複アップロードが頻発し、YouTube のアルゴが duplicate-content spam と判定。SUGGESTED_VIDEO が 0 に固定された。再発させない設計が必要。

**How to apply（2026-08-23 pilot）**:
- master は6〜12分の通常動画3本に限定し、同一テーマ・同一素材の再アップロードを禁止する
- Shorts 単独量産は再開せず、Instagram / X の派生素材は master と同じ `content_key` と `parent_post_id` で追跡する
- 投稿前に人が既存タイトル・サムネイル・動画内容の重複を確認する。撤去済みの `check-youtube-duplicate.cjs` / upload script を前提にしない
- OAuth・自動投稿・監視 CI は復活させず、YouTube Studio で手動投稿・手動計測する
- 2本連続で14日100 views未満かつ30秒時点維持率30%未満なら停止し、旧回復施策へ戻さない

## 現状メトリクス (2026-05-26)

- verdict: watch（最新日）／ weekly verdict 内訳は likely-shadowban 6 日 + watch 1 日
- recent views (14d): 112（5/10 以降 1→45→74→98→112 と回復傾向）
- subs: 31 / total views: ~78,500 / videos: **80（整理前 175）**
- SUGGESTED_VIDEO: 0 のまま継続（検証中）

## 検証期日

- **2026-05-29 (3 日後)**: SUGGESTED_VIDEO 初期計測。0 のままなら別根本原因（topic 分散 / 警告履歴）へ
- **2026-06-02 (1 週間後)**: weekly verdict が `watch` または `healthy` に推移したか判定
- 上記 2 期日で SUGGESTED_VIDEO ≥ weekly 3 なら本仮説（duplicate content）を effect/full 確定

## D1 inventory 単一真実源 (2026-05-26 完備)

`sns_posts` テーブルが YouTube 投稿の真実源。`upload.js` が成功時に自動 INSERT、`sync-inventory.cjs` で channel と一致を保つ。「データ→テンプレ→出力→公開時刻」の全段階を追跡。

- migration 0050: `thumbnail_path` / `deleted_at` 列追加
- migration 0051: `template` / `metric_keys` 列追加 (どの Remotion composition / どの metric で生成したか)
- **5 層 duplicate check**:
  - L1 タイトル (D1) — ERROR
  - L2 サムネ basename (D1) — ERROR
  - L3 content_key (D1) — WARN
  - L4 API タイトル (D1 漏れ保険) — ERROR
  - L5 template + metric_keys 完全一致 (D1) — WARN (視覚的酷似)
- `upload.js` の新引数: `--thumbnail` `--content-key` `--post-type` `--domain` `--template` `--metric-keys`
- `sync-inventory.cjs`: channel ↔ D1 同期、削除分は `deleted_at` マークで履歴保持

## 関連ファイル

- 診断: `.claude/scripts/youtube/diagnose-shadowban.js` / `.claude/scripts/youtube/youtube-daily-audit.mjs`
- 非公開化: `.claude/scripts/youtube/update-privacy.js`
- **重複防止 (2026-05-26 新規、4 層化)**: `.claude/scripts/lib/check-youtube-duplicate.cjs`
- **inventory 同期 (2026-05-26 新規)**: `.claude/scripts/youtube/sync-inventory.cjs`
- **schema (2026-05-26 拡張)**: `packages/database/drizzle/0050_sns_posts_youtube_tracking.sql` / `packages/database/src/schema/sns_posts.ts`
- ガード: `.claude/scripts/lib/check-youtube-post-budget.cjs`
- 診断スキル: `.claude/skills/analytics/diagnose-youtube-shadowban/SKILL.md`
- 回復スキル: `.claude/skills/sns/recover-youtube-shadowban/SKILL.md`
- 戦略追記: `.claude/agents/youtube-strategist.md` §シャドウバン発生時の復帰手順 / §D1 inventory の事前確認
- 現行方針: `.claude/rules/sns-content-standards.md`（YouTube 撤退済み。旧 Playbook は Git 履歴）
- daily monitor 出力: `.claude/state/metrics/youtube/LATEST.md` / `youtube-batch-YYYY-MM-DD*.json`

## 個人 ch 誤投稿の残骸（手動削除 TODO）

`P1Llv6u9Crw`（救急出動・5/6）と `YL6MRuZmadM`（IG リール・4/28）は個人チャンネル `UCb7Ro4vLygUFQDQRKXAvltw` に誤投稿された残骸。YouTube Studio (uruhayato373 アカウント) で手動削除が必要。自動削除スクリプトでは触れない（stats47 認証では別 channel）。

## YouTube Analytics API の制限（既知）

- `videos.update` に必要なスコープは `youtube.upload` ではなく `youtube.force-ssl`（または `youtube`）
- Analytics v2 は impressions / CTR を返さない。CTR 0% 判定は views/likes/comments から推定
- OAuth 再認証時はチャンネル選択画面で stats47 (`UCdRiwDSX1aUd0dSd7Cs08Kg`) を必ず選ぶ（個人ch 誤選択で 5/3 事故）

関連: [[feedback_browser_use_cleanup]]
