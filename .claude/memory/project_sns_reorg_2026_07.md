---
name: project_sns_reorg_2026_07
description: SNS/Remotion スキル・エージェント整理 + SSOT 化。sns-content-standards.md が正典、posts.json が投稿台帳。YouTube は2026-08-23から通常動画3本のmaster-first pilot、TikTok撤退恒久
metadata: 
  node_type: memory
  type: project
  originSessionId: f851285c-eaf7-4370-b327-49e3c052cdc8
---

2026-07-04 に SNS 投稿・Remotion 動画の煩雑化を整理した (feature/sns-remotion-ssot-reorg)。

## 正典 (SSOT)

- **`.claude/rules/sns-content-standards.md`** = SNS 実行規約の正典 (chart-component-standards 方式)。チャネル戦略・
  頻度リミット・投稿雛形カタログ・UTM 規則・禁止事項。docs/10_SNS戦略 は人間向け読み物 (rules が優先)。
- **投稿台帳 SSOT = `.claude/state/sns/posts.json`** (`sns-posts-store.cjs`)。旧 D1 `sns_posts` は完全DBレスで廃止。
  `data-storage.md` の記述も修正済 (git TS 行から sns_posts を外し posts.json に移記)。

## チャネル方針 (2026-07)

- IG=主力 (10K)・X=自動化 1-2K・**YouTube=月1本の慎重再開**・note=衛星・**TikTok 撤退恒久**。
- W19-W25 で 6 週投稿ゼロ → 週次運用ルーチン `/sns-weekly-plan` (strategy-advisor) を新設。

## チャネル方針 (2026-08-23 更新)

- 2026-07-27 の再撤退後、オーナー判断で**通常動画3本・6週間の限定 pilot (EXP-006)** として再開。
- YouTube の通常動画をマスターとし、Instagram Reels / X は派生。Remotion は図表素材に限り、Shorts/BCR/47県分割の量産は再開しない。
- 専任 `youtube-strategist`、OAuth、自動upload、API計測は復活させない。人間が Studio 投稿・計測し、成功判定後にだけ自動化を審査する。

## スキル統合 (23+2 → 15+2 + 新規3)

- archive (`.claude/skills/archive/sns/`): post-sns-captions / generate-all-sns / schedule-instagram-mbs (stale 5/28)。
- **post-x-6angles は keep** (7/3 編集の現役 + post-ig-6angles が reference/scout 共有。当初 archive 予定を変更)。
- **generate-utm-url は keep** (薄いエイリアス化 → rules §4。7+ スキルが参照するため)。
- BCR 3 スキル (generate/render/post-captions) → `/bar-chart-race --step generate|render|captions` に統合。
  旧 SKILL.md は `bar-chart-race/reference/{generate,render,captions}.md` に温存。
- post-compare-captions → `/generate-compare --step captions` に吸収 (reference/captions.md)。
- 新規: `/bar-chart-race` `/competitor-scan` (trend-scout) `/sns-weekly-plan` (strategy-advisor)。

## YouTube 月1復元 (撤退 commit 24b74ac6 から)

- 復元: upload.js / oauth-setup.js / diagnose-shadowban.js / check-youtube-duplicate.cjs。
- **DBレス移植**: upload.js `recordToD1`→`recordToLedger`、check-youtube-duplicate `checkD1`→`checkLedger` (posts.json 読み)。
- `check-youtube-post-budget.cjs` を週3→**月1上限**に変更 (MONTHLY_LIMIT=1)。
- `/post-youtube` は月1版で新設 (ガード3点: budget→duplicate→翌日 diagnose-shadowban)。初回 OAuth 再認証必須。
- youtube-strategist.md を月1ガード役に全面書き換え。旧削除スクリプト (sync-inventory 等) の参照を除去。

## 競合 (2026-07 実測)

@riskmap.jp が IG 約 20K・週次動画・framing を「統計・ランキング」に接近。詳細は [[project_competitor_riskmap_jp]]。

関連: [[feedback_no_deploy_per_iteration]] (デプロイ不要・アプリコード非変更) / [[project_sns_10k_roadmap]]
