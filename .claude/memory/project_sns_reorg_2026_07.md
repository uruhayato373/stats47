---
name: project_sns_reorg_2026_07
description: SNS/Remotion スキル・エージェント整理 + SSOT 化 (2026-07-04)。sns-content-standards.md が実行規約の正典、投稿台帳 SSOT は posts.json、YouTube 月1再開、TikTok 撤退恒久、週次運用は /sns-weekly-plan
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
