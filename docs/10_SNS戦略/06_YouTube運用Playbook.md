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

## 重複コンテンツ防止ルール（2026-05-26 追加）

2026-03 の Shorts 量産期に同一タイトル/同サムネ再アップロードが 14 グループ・28 本発生し、YouTube が duplicate-content / reupload spam と判定したことが 2026-04-24 シャドウバンの最有力引き金（[[memory:project_youtube_shadowban_recovery_2026_04]] 参照）。再発防止のため D1 ベースの inventory 管理 + 多層ガードを強制する。

### D1 inventory による単一真実源（2026-05-26 schema 0050 / 0051）

`sns_posts` テーブルが YouTube 投稿の **真実源**。チャンネル状態と D1 が常に一致するように運用する。「どのデータを使い、どのテンプレで、どの画像を、いつ公開したか」を完全に追跡する。

| 列 | 用途 |
|---|---|
| `caption` | 動画タイトル（重複検出 L1） |
| `thumbnail_path` | サムネ画像のローカルパス、basename で重複検出 L2（**2026-05-26 追加 / 0050**） |
| `content_key` | rankingKey / 主要テーマ識別子（重複検出 L3） |
| `template` | Remotion composition ID 例: `RankingYouTube-ScrollGes`（重複検出 L5、**2026-05-26 追加 / 0051**） |
| `metric_keys` | 利用した metric_key の JSON 配列 例: `["average-life-expectancy"]`（重複検出 L5、**2026-05-26 追加 / 0051**） |
| `post_url` | YouTube URL（video_id 抽出用） |
| `media_path` | アップロードした動画ファイルのローカルパス |
| `post_type` | `short` / `normal` / `bar-chart-race` |
| `posted_at` / `scheduled_at` | 公開タイミング |
| `deleted_at` | YouTube 側で削除した場合のタイムスタンプ（**2026-05-26 追加 / 0050**、履歴は保持） |

### 投稿前ガード（5 層チェック）

`upload.js` が `check-youtube-duplicate.cjs` を自動呼び出し。直近 **60 日** で以下を順にチェック:

| 層 | データソース | 条件 | アクション |
|---|---|---|---|
| **L1** | D1 sns_posts (deleted_at IS NULL) | caption の正規化一致 | **exit 1** |
| **L2** | D1 sns_posts | thumbnail_path basename 一致 | **exit 1** |
| **L3** | D1 sns_posts | content_key 一致 | warning（通す） |
| **L4** | YouTube API playlist | タイトル正規化一致 (D1 漏れの保険) | **exit 1** |
| **L5** | D1 sns_posts | template + metric_keys 完全一致 | warning（通す） |

正規化: 小文字化 / ハッシュタグ削除 / 装飾記号削除 / 全角→半角 NFKC。metric_keys は sort 後 JSON.stringify で順序ゆらぎを吸収。緊急バイパス `--allow-duplicate` あり（warning 化、推奨しない）。

**L5 の意義**: タイトルやサムネを変えても「同じ metric を同じ Remotion テンプレで生成」すれば視覚的にほぼ同じ動画になる。これを WARN として可視化する。

### upload.js の引数

```bash
node .claude/scripts/youtube/upload.js <video-file> \
  --title       "動画タイトル" \
  --thumbnail   "/path/to/thumbnail.png" \
  --content-key "ranking-key-or-primary-theme"  \
  --post-type   "short"  \  # short / normal / bar-chart-race
  --domain      "ranking" \
  --template    "RankingYouTube-ScrollGes" \         # Remotion composition ID
  --metric-keys '["average-life-expectancy"]' \      # 利用 metric の JSON 配列
  --privacy     "public"  \
  [--schedule   "2026-05-29T11:00:00Z"]
```

D1 sns_posts 記録に必須（未指定でも upload は通るが、その後の重複検出が弱まる）:

| 引数 | 用途 |
|---|---|
| `--thumbnail` | L2 サムネ重複検出 |
| `--content-key` | L3 同テーマ警告 |
| `--template` | L5 同テンプレ警告 (Remotion composition ID。Root.tsx 参照) |
| `--metric-keys` | L5 同 metric 警告 (JSON 配列、複数 metric も指定可) |
| `--post-type` `--domain` | D1 集計用 |

### inventory 同期 (`/sync-youtube-inventory` 相当)

月 1 回 or 大量削除の直後に実行:

```bash
node .claude/scripts/youtube/sync-inventory.cjs --dry-run  # 計画確認
node .claude/scripts/youtube/sync-inventory.cjs            # 実行
```

動作:
- YouTube 全動画と D1 sns_posts を video_id でマッチング
- D1 に無い動画 → INSERT
- D1 にあるが channel に無い → `deleted_at` をマーク（行は残す）

### 運用ルール

| ルール | 詳細 |
|---|---|
| 同一タイトル再投稿禁止 | 既存動画を改善・差し替えしたい場合は、まず旧動画を削除してから再投稿する（旧 row の `deleted_at` も `sync-inventory` で自動マーク） |
| 同サムネ再利用禁止 | 同じサムネ PNG/JPG を別動画で再利用しない。47 県別なら 47 種類のサムネを用意 |
| 同テーマ別フォーマット再投稿は注意 | 「47都道府県カウントアップ」テンプレで同じメトリックの動画を月 2 本以上投稿しない |
| 同月内 同メトリック上限 | 「離婚率」「貯蓄率」など 1 つのメトリックで月 1 本まで（タイトル切り口を変えても再上げしない） |
| 量産モード時のレビュー | 週 3 本上限ガードは既存。さらに同月 10 本超え時は手動でテーマ重複の事前 review |

### duplicate-content の典型パターン（避けるべき例）

- 同日に同タイトルを 2 度 insert（API 一時エラーで再実行してしまった等）→ 削除 → 再投稿に統一
- 「○○ランキング 40年の変遷」を別日に再アップロード → タイトル差別化 or 既存削除
- 「47県カウントアップ」シリーズで「人口」「人口密度」「居住人口」のような近接メトリックを連投 → スキル側で metric 重複を事前 check
- **同じ thumbnail.png を別動画で再利用** → サムネ画像から duplicate-content 判定される懸念
- **同 metric を同 Remotion template で再生成** → タイトル/サムネを変えても視覚的に酷似 (L5 で警告)

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
- `.claude/scripts/lib/check-youtube-post-budget.cjs` — 投稿ガード 1（停止期間＋週 3 本）
- `.claude/scripts/lib/check-youtube-duplicate.cjs` — 投稿ガード 2（4 層チェック: タイトル/サムネ/content_key/API、2026-05-26 追加）
- `.claude/scripts/youtube/sync-inventory.cjs` — D1 inventory 同期（2026-05-26 追加）
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
| 2026-04-24 | #88 | 17 | 〜2026-05-08 | 2026-05-16 | OAuth 失効・個人 ch 誤投稿が一次対応だったが、2026-05-26 の調査で **2026-03 の量産（68 本/月）＋同タイトル再アップロード（14 グループ）** が真の引き金と判明。`check-youtube-duplicate.cjs` を導入して再発防止 |
| 2026-05-26 | (継続) | 4 | — | — | チャンネル整理 175→80 本（重複片側 + views<50 + views<200）。SUGGESTED_VIDEO 回復を 2026-05-29 / 2026-06-02 で計測 |

---

## 改訂履歴

| 日付 | 変更 | 理由 |
|---|---|---|
| 2026-04-24 | 初版作成 | 2026-04-24 のシャドウバン対応（#88）を受けて、運用ルールを単一 Issue (#91) に集約 |
| 2026-05-16 | Issue #91 → docs 移行 | Playbook は永続運用ドキュメントであり Issue lifecycle（作業→close）にそぐわないため、docs/10_SNS戦略/ に格納 |
| 2026-05-26 | 重複コンテンツ防止ルール追加 | 2026-03 の重複アップロードがシャドウバンの真の引き金と判明。`check-youtube-duplicate.cjs` 追加、upload.js が自動呼び出し |
| 2026-05-26 | D1 inventory 単一真実源化 | migration 0050 で `thumbnail_path` / `deleted_at` 列追加。`check-youtube-duplicate.cjs` を 4 層チェックに拡張（D1+API）。`sync-inventory.cjs` で channel と D1 を同期 |
| 2026-05-26 | template + metric_keys 追跡 | migration 0051 で `template` / `metric_keys` 列追加。duplicate-check L5 を追加 (同データを同テンプレで再生成すると WARN)。「データ→テンプレ→出力」の全段階を D1 で追跡 |
