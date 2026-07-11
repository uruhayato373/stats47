---
type: implementation-plan
date: 2026-07-11
status: active
tags: [youtube, sns, shadowban, experiment]
---

# YouTube 量産実験 実装ドキュメント

> **TL;DR**: stats47 チャンネルを「BAN リスクの無い family アカウント」と位置づけ、月 1 上限を撤廃して
> 量産投稿を試す実験。**投稿経路は CI で確立済み**（ローカル creds 不要。Release アセット → リクエスト
> ファイル push → `youtube-upload.yml` が投稿）。**第 1 号 `3TWSWlKDPbs`（出生数 BCR）を 2026-07-11 に
> public 投稿済み**。診断 verdict `likely-shadowban` は 2 ヶ月投稿ゼロの自然減で汚染され判定不能なので、
> **この 1 本の 24-48h 初速**が量産可否の唯一の実証。
>
> 正典ルール = `.claude/rules/sns-content-standards.md` §1（頻度）/ §2-6（YouTube 雛形）。
> 方針の恒常記録 = memory `project_youtube_mass_experiment_2026_07`。本ドキュメントは実装の手順書。

---

## 0. このドキュメントの位置づけ

- **何**: YouTube 量産実験を「実際に投稿・自動化」するための実装計画・手順・判断ルール。
- **なぜ別立て**: `06_YouTube運用Playbook.md`（撤退期の運用）と `05_YouTube_50本ロードマップ.md` は
  2026-05-29 撤退前の前提。本ドキュメントは 2026-07-11 の**量産実験への方針転換後**の実装を扱う。
- **関連の正典**: 頻度・雛形の正典は rules（上記）。本ドキュメントはそれを前提にした実装ガイド。

---

## 1. 背景と方針転換の経緯

| 日付 | 出来事 |
|---|---|
| 2026-03 | Shorts を 68 本/月 量産 + 同タイトル再投稿 28 本 → duplicate-content spam 判定 |
| 2026-04-24 | シャドウバン発動（`diagnose` で確定、Issue #88） |
| 2026-05-26 | チャンネル整理（175→80 本）。最終投稿がこの頃 |
| 2026-05-29 | YouTube 完全撤退（`.env.local` から `GOOGLE_OAUTH_*` 削除、CI/skill 24 ファイル削除） |
| 2026-07-04 | 月 1 本で最小復元（`upload`/`duplicate` を posts.json 移植、budget 月 1 化） |
| **2026-07-11** | **stats47 を family アカウント（BAN リスク無し）と位置づけ、月 1 上限を撤廃して量産実験に転換** |

**シャドウバンの根本原因（2026-04）= 量産 + 重複コンテンツ**。この因果は有効なので、**重複防止だけは
実験中も維持**する（同一テーマ・同一タイトルの再投稿は禁止）。

### 重要な区別: BAN ≠ シャドウバン
- **BAN**（アカウント削除）: family アカウントなのでリスク無し（← 実験を許容する根拠）。
- **シャドウバン**（露出抑制）: BAN されなくても起きる。量産しても露出が死ねば動画は伸びず、
  失うのは**制作労力**。だから「量産していい」と「量産すれば伸びる」は別問題。

---

## 2. 現状（2026-07-11 深夜更新: 第 1 号投稿済み・ブロッカー解消）

### できること / ブロッカー
| 要素 | 状態 | ブロッカーか |
|---|---|---|
| 投稿ペースガード | **1日1本を機械強制**（dailyLimit=1 / monthlyLimit=31。今日 1 本消化済なら guard が翌日 JST まで停止） | ✅ 1日1本ペースで通る |
| 動画生成 | Remotion（`apps/remotion`）+ `bar-chart-race` skill あり。births BCR を 3.8 分で render 実証 | ✅ 実証済 |
| 投稿スクリプト | `.claude/scripts/youtube/upload.js`（予約投稿 `--publish-at` 対応） | ✅ ある |
| OAuth（ローカル） | `.env.local` に `GOOGLE_OAUTH_*` が **0/3**（値なし。secrets は複製不可） | ✅ CI 経路で不要に |
| **CI 投稿経路** | **構築済・実証済** — `youtube-upload.yml`（リクエストファイル駆動、§5.3A）で第 1 号 `3TWSWlKDPbs` を public 投稿成功 | ✅ **解消（主経路）** |
| OAuth（CI） | シークレット `GOOGLE_OAUTH_*` は**生存**（2026-07-11 診断+投稿成功で実証、refresh token 2026-05-10） | ✅ 流用中 |
| R2 creds（ローカル） | `.env.local` に R2 S3 creds 無し → mp4 の R2 push 不可 | ✅ GitHub Release アセットで代替 |

### 第 1 号（初速テスト・観測待ち）
- **`3TWSWlKDPbs`** — 「出生数はこの29年で4割減｜47都道府県ランキングの推移 1995→2023」（BCR 45.7s・public・
  2026-07-11 05:02 UTC 投稿）。https://www.youtube.com/watch?v=3TWSWlKDPbs
- **24-48h 後に初速測定**（§5.4 / §6）→ 量産可否を判定する。

### 投稿先チャンネル（★誤投稿事故防止）
- **stats47 = `UCdRiwDSX1aUd0dSd7Cs08Kg`**（= 診断対象と同一。これが family アカウント）。
- 個人 ch `UCb7Ro4vLygUFQDQRKXAvltw` に投稿しないこと（2026-05-03 誤投稿事故）。OAuth 認証時のチャンネル
  選択で必ず stats47 を選ぶ。

---

## 3. 実装済み（2026-07-11 このセッションで整備）

1. **投稿ペースガードを可逆的に緩和** — `.claude/scripts/lib/check-youtube-post-budget.cjs` が
   `.claude/state/youtube-experiment.json` の `monthlyLimit` / `dailyLimit` を読んで上書き（既定は月 1・日次制限なし）。
   現在 **`dailyLimit: 1` / `monthlyLimit: 31` = 「1日1本」ペースを JST 日/月単位で機械強制**
   （当初の日次3本+案から 2026-07-11 ユーザー指示で 1日1本に確定）。**ファイル削除で月 1 に復帰**。
2. **重複ガード・pause ガードは維持** — `check-youtube-duplicate.cjs`（5 層）と `youtube-pause.json` は実験中も有効。
3. **ルールに例外を明記** — `sns-content-standards.md` §1 に「YouTube 量産実験モード」注記。
4. **診断 workflow を新設** — `.github/workflows/youtube-shadowban-diagnose.yml`。CI シークレットで
   `diagnose-shadowban.js` を read-only 実行して verdict を取得（ローカル再認証不要）。
5. **メモリ記録** — `project_youtube_mass_experiment_2026_07`（+ 2026-04 メモリに相互参照・陳腐化注記）。
6. **CI 投稿 workflow を新設・実証** — `.github/workflows/youtube-upload.yml`。リクエストファイル
   `.claude/state/youtube-upload-request.json` の develop push で発火（`paths` gated）。動画は GitHub Release
   アセットから fetch → CI シークレットの OAuth で `upload.js` 実行 → posts.json commit-back。
   **本番デプロイ（develop→main）不要**で投稿できる。
7. **第 1 号を public 投稿** — `3TWSWlKDPbs`（出生数 BCR）。ガード（budget 実験モード + duplicate 5 層）通過、
   `@stats47jp` チャンネルを oEmbed 実測で確認。posts.json 記録済（id 580）。

---

## 4. 実装の残タスク（ロードマップ）

### Phase 1: 最初の 1 本で初速を測る（採用ルート = CI 経路。ローカル OAuth は不要だった）
- [x] テスト 1 本の企画（テーマ = births。当初案 taxable-income-per-capita は R2 404 で差し替え、§7）
- [x] 動画 render（`bar-chart-race`・§5.2。29 フレーム × 47 県、3.8 分）
- [x] CI 経路で public 投稿（§5.3A。`3TWSWlKDPbs`）
- [ ] **公開 24-48h 後に初速測定（§5.4）→ 判定（§6）** ← 今ここ
- ~~OAuth ローカル再認証~~（CI 経路の確立で不要になった。ローカル投稿したい場合のみ §5.1）

### Phase 2: 判定 → 量産の可否
- 初速が健全 → **1日1本ペースで量産継続**（dailyLimit=1 が機械強制。増枠したい場合は
  `youtube-experiment.json` の `dailyLimit` をユーザー判断で変更）。
- 初速が死んでいる → 量産しても埋もれるので、テーマ/フォーマット/投稿時間を変えて再テスト。

### Phase 3: 自動化（CI 投稿経路）
- [x] upload workflow 新設（`youtube-upload.yml`。CI シークレットの OAuth 流用、認証手間ゼロ）
- [x] 動画の受け渡し設計（ローカル render → **GitHub Release アセット** → CI fetch。R2 creds 不要）
- [ ] 日次 N 本のスケジューリング（量産 go 判定後: リクエストファイルの一括仕込み or cron 化）
- **注意**: 日次量産は必ず `check-youtube-duplicate.cjs` を通し、テーマ/タイトルを毎回変える
  （2026-04 の再発防止）。

---

## 5. 手順書

### 5.1 OAuth ローカル再認証（ユーザー操作・1 回だけ）
`upload.js` / `oauth-setup.js` / `diagnose-shadowban.js` はいずれも `.env.local` から OAuth を読む。

1. Google Cloud Console → 認証情報 → **OAuth 2.0 クライアント ID（デスクトップアプリ）**。既存クライアントが
   あれば再利用可。**OAuth 同意画面を "In production" にする**（Testing だと refresh token が 7 日で失効・Issue #184）。
2. `.env.local` に 2 行追記:
   ```
   GOOGLE_OAUTH_CLIENT_ID=（Console の値）
   GOOGLE_OAUTH_CLIENT_SECRET=（Console の値）
   ```
3. ブラウザ認証:
   ```
   node .claude/scripts/youtube/oauth-setup.js
   ```
   → チャンネル選択で **必ず stats47（`UCdRiwDSX1aUd0dSd7Cs08Kg`）**。`GOOGLE_OAUTH_REFRESH_TOKEN` が
   `.env.local` に自動保存される。

### 5.2 動画 render（Remotion / bar-chart-race）
- `apps/remotion` + `bar-chart-race` skill。時系列ランキングを BCR（アニメ）で描画。
- **データは R2 `app/stats/<metric>/values.json`（全年の観測値ストア）**。
  **★`app/ranking/<key>/values.json` は単年 snapshot なので BCR には使えない**（2026-07-11 実測。
  aging-index 等は 1 年分のみ。births=29 年 / japanese-population=45 年は可）。metric 選定時に
  年数を先に確認する。config 実在 ≠ R2 公開にも注意（taxable-income-per-capita は 404 だった）。
- 手順: skill の generate（`.local/r2/sns/bar-chart-race/<key>/{config,data}.json` 生成）→
  `cd apps/remotion && npx tsx scripts/pipeline/render-bar-chart-race.ts --key <key> --platform youtube-normal`
  （長尺 = `youtube-normal/video.mp4`。29 年 BCR で約 4 分）。

### 5.3A 投稿（CI 経路・★既定・実証済み）
ローカルに OAuth / R2 creds が無くても投稿できる（第 1 号 `3TWSWlKDPbs` で実証）:

1. mp4 を GitHub Release アセット化（R2 push の代替 transport）:
   ```bash
   gh release create yt-<slug> <video.mp4> --title "..." --notes "CI 投稿 transport" --prerelease
   gh release view yt-<slug> --json assets -q '.assets[].apiUrl'   # → video_url
   ```
2. `.claude/state/youtube-upload-request.json` を書いて **develop に push**（worktree 推奨）:
   ```jsonc
   { "video_url": "<アセット apiUrl>", "title": "...", "description": "...",
     "tags": "出生数,少子化,...", "privacy": "public", "publish_at": "",   // 予約は private + JST ISO
     "content_key": "<uniq>", "metric_keys": ["<key>"] }                  // ★JSON 配列必須
   ```
3. push で `.github/workflows/youtube-upload.yml` が発火（`paths` gated・本番デプロイ不要）。
   CI が Release から fetch → `upload.js`（ガード内蔵）→ posts.json commit-back。
4. `gh run watch` で監視 → 成功後 oEmbed で `@stats47jp` を実測確認。

### 5.3B 投稿（ローカル upload.js・OAuth 再認証済みの場合のみ）
```
node .claude/scripts/youtube/upload.js <video.mp4> \
  --title "…（50字以内・curiosity gap 1要素・過去と重複なし）" \
  --description "…" --tags "都道府県,ランキング,…" \
  --privacy private --publish-at "2026-07-12T20:00:00+09:00" \
  --thumbnail <thumb.png> --content-key "<uniq>" \
  --post-type long --domain ranking --template <composition> --metric-keys '["<key>"]'
```
- 投稿時に `check-youtube-post-budget.cjs`（実験モードで通る）と `check-youtube-duplicate.cjs`（5 層）が走る。
- 予約投稿は `--privacy private` + `--publish-at`（JST 明示）。**`--metric-keys` は JSON 配列文字列**。

### 5.4 初速測定（診断 workflow・CI）
`gh workflow run` は workflow が **main（default branch）に無いと 404**。当面は develop への push トリガーで発火:
- `.github/workflows/youtube-shadowban-diagnose.yml` を微修正して develop に push すると 1 回発火。
- 恒常運用にするなら workflow を main に昇格 → 以後 `gh workflow run youtube-shadowban-diagnose.yml -f days=60` で dispatch 可。
- 結果は run の artifact `youtube-diagnose` / step summary に verdict + JSON。

---

## 6. 判断ルール

### 診断 verdict の落とし穴（★重要）
`diagnose-shadowban.js` の verdict `likely-shadowban` 条件 = `suspectVideos>=2 && viewsDeltaPct<=-80`。
**この 2 条件は「量産をやめて放置」すれば投稿ゼロの自然減で自動成立する**（prior=量産期の Shorts 大量視聴 vs
recent=投稿停止期の比較）。**投稿停止期には verdict は無効**。→ シャドウバンが残るかは「新規 1 本の初速」でしか測れない。

### 初速の見方（新規 1 本・公開 24-48h）
- impressions / CTR、suggested-video（関連動画）に載るか、検索・ブラウジング露出。
- 健全に露出が付く → 抑制は残っていない → 段階的に量産へ。
- 露出が明らかに死んでいる → 抑制継続の可能性。テーマ/フォーマット/時間を変えて再テスト。

### ロールバック
- 実験終了・本命運用に戻す → `.claude/state/youtube-experiment.json` を**削除**（月 1 上限に復帰）。
- 問題発生時の緊急停止 → `.claude/state/youtube-pause.json` を作成（`until` を未来日時に）。

---

## 7. 落とし穴・注意点

- **重複は緩めない**: 量産でも同一テーマ・同一タイトルの再投稿禁止（2026-04 の真因）。切り口を毎回変える。
- **チャンネル選択**: OAuth 時に個人 ch を選ぶと誤投稿事故。必ず stats47。
- **陳腐化した記述**: 2026-04 メモリの `sns_posts` D1 記述は完全 DB レス化で古い。投稿台帳 SSOT は
  `.claude/state/sns/posts.json`。
- **workflow_dispatch は main 必須**: dispatch で回したいなら workflow を main に昇格させる。当面は
  develop push トリガー（リクエストファイル / 自ファイル paths）で発火させる。
- **OAuth 同意画面 Testing**: refresh token が 7 日で失効。必ず "In production"。
- **`--metric-keys` は JSON 配列**（`["births"]`）。素の文字列は upload.js のバリデーションで exit 1
  （第 1 号で 1 回踏んだ）。
- **BCR データは `app/stats`（全年）**。`app/ranking` の values.json は単年で不可（§5.2）。
  **config 実在 ≠ R2 公開**: youtube-strategist の企画段階で R2 の年数を実測してからタイトルを書く。
- **CI の台帳 commit-back は add→commit→rebase→push の順**（unstaged posts.json のまま
  `git pull --rebase` すると exit 128。修正済みだが workflow を書き換える時に再発させない）。

---

## 8. 関連ファイル

- ガード: `.claude/scripts/lib/check-youtube-post-budget.cjs` / `check-youtube-duplicate.cjs`
- 実験フラグ: `.claude/state/youtube-experiment.json`（dailyLimit=1 / monthlyLimit=31。削除で月 1 復帰）
- 認証: `.claude/scripts/youtube/oauth-setup.js`
- 投稿: `.claude/scripts/youtube/upload.js` / **CI 経路: `.github/workflows/youtube-upload.yml` +
  `.claude/state/youtube-upload-request.json`（リクエストファイル）**
- 診断: `.claude/scripts/youtube/diagnose-shadowban.js` / `.github/workflows/youtube-shadowban-diagnose.yml`
- 動画: `apps/remotion` / `bar-chart-race` skill
- 投稿台帳（SSOT）: `.claude/state/sns/posts.json`
- ルール正典: `.claude/rules/sns-content-standards.md` §1・§2-6
- メモリ: `project_youtube_mass_experiment_2026_07` / `project_youtube_shadowban_recovery_2026_04`
- 撤退前の運用（参考）: `06_YouTube運用Playbook.md` / `05_YouTube_50本ロードマップ.md`
