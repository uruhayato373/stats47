---
name: youtube-2026-07-11
description: family アカウント stats47 で月1上限を撤廃して量産実験する方針転換。2026-04 の「撤退・再開しない」を上書き。診断 verdict は投稿停止で汚染され判定不能→1本ずつ初速で判断。ガード緩和は youtube-experiment.json (削除で月1復帰)
metadata: 
  node_type: memory
  type: project
  originSessionId: bda6783f-b545-4e50-9bd2-82116e4553d9
---

2026-07-11 にオーナー判断で **stats47 チャンネル (`UCdRiwDSX1aUd0dSd7Cs08Kg`) を「BAN リスクの無い family アカウント」と位置づけ、月1上限を撤廃して量産実験する**方針に転換した。これは [[project_youtube_shadowban_recovery_2026_04]] の「2026-05-29 撤退・回復施策は再開しない」と [[project_sns_reorg_2026_07]] の「月1化」を上書きする最新方針。

## 決定内容
- 投稿先は **stats47 本命チャンネル**そのもの (= diagnose 対象と同一)。ユーザーは「family アカウントなので BAN されても構わない」と明言。選択肢A「いきなり量産して様子見」を採用。**ペースは当初の日次3本+案から「1日1本」に確定** (2026-07-11 同日中にユーザー指示で変更)。
- **BAN ≠ シャドウバン**の区別が論点だった。BAN (アカウント削除) リスクは無いが、シャドウバン (露出抑制) は起きうる → 量産しても伸びなければ失うのは「制作労力」。この費用対効果リスクをユーザーは許容した。

## ガード緩和 (可逆設計)
- `.claude/scripts/lib/check-youtube-post-budget.cjs` を改修: `.claude/state/youtube-experiment.json` があれば `monthlyLimit` / `dailyLimit` を上書き (既定は月1・日次制限なし = シャドウバン再発防止)。現在 **`dailyLimit: 1` / `monthlyLimit: 31` = 1日1本ペースを機械強制** (JST 日/月単位で posted+scheduled をカウント)。**このファイルを削除すれば既定の月1に戻る**。
- **維持するガード**: タイトル重複・再投稿の全面禁止 (`check-youtube-duplicate.cjs` 5層) と pause (`youtube-pause.json`) は実験中も有効。重複はシャドウバン真因なので緩めない。
- `sns-content-standards.md` §1 に「YouTube 量産実験モード」の例外注記を追記済。

## 診断は CI で回る (ローカル再認証不要)
- `.github/workflows/youtube-shadowban-diagnose.yml` を新設 (workflow_dispatch + このファイル自身への develop push トリガー)。**CI シークレット `GOOGLE_OAUTH_*` は生きている** (2026-07-11 実行成功で実証、refresh token 2026-05-10)。**ローカル `.env.local` には GOOGLE_OAUTH_* が無い** ([[project_env_local_ci_consolidation]] で撤退時削除)。
- workflow_dispatch は main に無いと `gh workflow run` が 404。今回は本番デプロイを避けて develop push トリガーで発火させた。恒常運用なら main 昇格で dispatch 可。

## 診断 verdict の落とし穴 (★重要)
2026-07-11 実測の verdict = `likely-shadowban` だが **投稿停止による自然減で汚染されており判定不能**。理由: (a) `viewsDeltaPct <= -80` は「量産期 prior (Shorts 2万視聴) vs 投稿停止期 recent (2ヶ月ゼロ)」の比較で当然マイナス、(b) suspect videos 3本は age 1095-1178h = 45-49日前の古い動画。**diagnose-shadowban.js は継続投稿前提のロジックで、投稿停止期には無効** (止めれば誰でも likely-shadowban になる)。→ シャドウバンが残るかは「1本出して 24-48h の初速 (impressions/CTR/suggested露出)」でしか実証できない。

## ★CI 投稿経路が完成・実証 (2026-07-11)
第1本を **public で投稿成功**: `3TWSWlKDPbs` (出生数BCR 1995-2023, https://www.youtube.com/watch?v=3TWSWlKDPbs, @stats47jp 確認)。**ローカルに R2 creds も OAuth も無い**環境で、以下の経路で投稿できた:
- **transport**: mp4 を **GitHub Release アセット**にして公開/API URL 化 (`gh release create`。ローカル R2 push は creds 無しで不可、Release で代替)。CI は `curl -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/octet-stream" <asset api url>` で fetch。
- **dispatch**: `.github/workflows/youtube-upload.yml` を **develop-push トリガー** (`paths: .claude/state/youtube-upload-request.json`) にした。**本番デプロイ (develop→main) 不要** = develop 先行の無関係コミットを本番に出さずに済む。`gh workflow run` は main 必須だが、リクエストファイルを push するだけで発火。
- **auth**: CI が `.env.local` を `GOOGLE_OAUTH_*` secrets から書き出す (secrets は読み出せないのでローカルにコピー不可 = CI が唯一 creds を持つ。ローカル投稿より CI が楽)。
- **リクエストファイル** `.claude/state/youtube-upload-request.json`: `{video_url(api asset url), title, description, tags, privacy, publish_at, content_key, metric_keys[], thumbnail_url?}`。worktree で編集→push で 1 本投稿。
- **ハマった 2 点 (修正済)**: (1) `--metric-keys` は **JSON 配列**必須 (`["births"]`。素の `births` は "not valid JSON" で落ちる)。(2) 台帳 commit-back が `git pull --rebase` 前の unstaged posts.json で exit 128 → **add→commit→rebase→push の順**に修正済 (今も upload は成功するが台帳 push が失敗していた)。

## BCR データの要点 (再発防止)
- BCR は **全年時系列**が要る → **`app/stats/<metric>/values.json`** (全年 rows) を読む。`app/ranking/<key>/values.json` は**単年 snapshot** で BCR 不可。
- 検証済み: `births` 29年(1995-2023, 全国-38.7%)・`japanese-population` 45年 = BCR 可。`aging-index`/初婚年齢/貯蓄率 = 単年で不可。youtube-strategist が当初出した `taxable-income-per-capita` は **R2 404 (未公開)** で使えなかった (isActive≠公開)。
- 生成→レンダ: `.claude/skills/sns/bar-chart-race` の generate (config.json/data.json) → `apps/remotion/scripts/pipeline/render-bar-chart-race.ts --key <k> --platform youtube-normal` (長尺・約4分/29年)。出力 `.local/r2/sns/bar-chart-race/<k>/youtube-normal/video.mp4`。

## 1ヶ月分の予約仕込み完了 (2026-07-11 深夜・ユーザー指示で初速判定を待たず先行)
- **BCR 30本を仕込み済み** (publish 2026-07-12〜08-10 毎日19:00 JST・1日1本ガード整合)。テーマは婚姻半減/離婚1.5倍/固定電話盛衰/大学倍増/家計消費ほか (死亡系除外・全キー公開ranking へ UTM リンク)。
- **経路**: 30本ローカル render (~2min/本) → Release `yt-bcr-2026-07` アセット → `.claude/state/youtube-upload-queue.json` (30 entries) → **`youtube-upload-queue.yml` (main・cron 17:30 JST) が pending を 5本/日** private+publish_at 予約アップロード (クォータ 1600units×5<10k/日)。初回5本は dispatch 済み (7/12,14,16,18,20 公開分)。失敗エントリは status=failed 隔離→pending に戻せば再試行。
- **★ガードのバグを踏んで修正済み**: check-youtube-post-budget の日付判定が文字列比較で、`+09:00` 形式 scheduled_at が UTC 範囲文字列と辞書順比較され1日ズレ (初回バッチ5成功/4失敗の交互パターン)。エポック比較に修正 (2026-07-11)。**posts.json のタイムスタンプ形式は混在する前提で、範囲判定は必ず Date.parse で行う**。
- 初速計測 (3TWSWlKDPbs の 24-48h) は事後観測に変更: 露出死亡が判明したら queue の pending 削除 + YouTube Studio で予約解除で即停止。

## How to apply (旧・参考)
- 実験終了・本命運用に戻すなら `youtube-experiment.json` を削除。
- 陳腐化注意: 2026-04 メモリの `sns_posts` D1 記述は完全DBレス化で古い。投稿台帳 SSOT は `.claude/state/sns/posts.json` ([[project_sns_reorg_2026_07]])。

関連: [[project_youtube_shadowban_recovery_2026_04]] / [[project_sns_reorg_2026_07]] / [[project_env_local_ci_consolidation]]
