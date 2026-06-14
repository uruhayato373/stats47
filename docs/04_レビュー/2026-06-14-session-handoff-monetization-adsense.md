---
type: session-handoff
topic: monetization
date: 2026-06-14
status: active
related_strategy: docs/02_実装計画/01_収益化マスタープラン.md
related_backlog: docs/02_実装計画/03_改善バックログ.md
tags: [session-handoff, 収益化, monetization, adsense, affiliate, GA4]
---

# セッションハンドオフ 2026-06-14 — 収益化 (AdSense 配置 + アフィ計測)

収益化マスタープラン (SSOT: `docs/02_実装計画/01_収益化マスタープラン.md`) の P1「収益密度」を 1 手進めたセッション。
本書は **次にやるべきこと** の引き継ぎ。TODO の真実源は改善バックログ、戦略の真実源はマスタープラン。

---

## ★ やるべきこと (優先順位順)

### 🔴 1. GA4 カスタムディメンション 2 つを登録 (人間・約10分・最優先)

**これが収益化の真のボトルネック。** アフィ収益 ¥0 の構造的原因は「クリック内訳が分解できない」こと。
コード側のイベント発火は検証済み (下記) なので、GA4 画面で登録すれば即計測が始まる。

- 手順: GA4 → 管理 → プロパティ列「カスタム定義」→「カスタムディメンションを作成」→ **スコープ=イベント**
- 登録する 2 つ (★イベントパラメータは完全一致必須):

  | ディメンション名 (任意) | イベントパラメータ | 必須度 |
  |---|---|---|
  | Affiliate Category | `affiliate_category` | 必須 |
  | Link Position | `link_position` | 必須 |

- (任意) `experiment_id` / `variant_id` / `creative_size` も同様に追加可 (A/B 用)
- (任意) GA4 → イベント → `affiliate_click` を「キーイベント」化でコンバージョン扱い
- ⚠️ **遡及しない** — 登録後のクリックから貯まる。早いほど良い
- **発火コード検証済み (2026-06-14)**: `affiliate_category`/`link_position` は完全一致のキー名で送信されている
  - `apps/web/src/lib/analytics/events.ts:44-45` (`trackAffiliateClick`)
  - `apps/web/src/features/ads/components/AdImpressionTracker.tsx:49-50`
- **登録後の検証 (Claude が引き取れる)**:
  ```bash
  gh workflow run affiliate-ga4-weekly.yml
  # 確認: .claude/state/ads/ga4-affiliate-*.json の "hasCategoryBreakdown": true / rows に内訳
  ```
- 注意: マスタープランが言う「OAuth」は **AdSense 側 (refresh token 失効) の別系統**。アフィ計測に OAuth は不要 (サービスアカウントで稼働済み)。

### 🟡 2. 「Deploy 2026-06-14」develop→main PR を出すか判断 (人間)

- develop に未デプロイ 25 コミット (ブログ108本フルリライト + data-layer 最適化 等) が待機。CI 実行中の develop→main PR あり。
- 大型デプロイなのでオーナー判断。本セッションの A 変更は既に main + develop 両方に整合済みのため、この PR をマージしてもコンフリクトしない。

### 🟡 3. ASP 提携申請 (人間・高単価カテゴリ)

- 引越し比較 (引越し侍 / ズバット引越し比較 等) と転職系の A8.net 提携リンク取得。
- ブロックしているもの: `AFF-AREAS-MOVING-01` (areas 文脈アフィ) / P2 高単価アフィ記事。
- リンク取得後は Claude が `apps/web/scripts/affiliate-ads-data.ts` に 30 分で登録可 (categoryKey:"construction"/locationCode:"area-sidebar")。

### 🟢 4. Claude に振れる (依頼があれば即着手)

| やること | 解禁条件 |
|---|---|
| **A の効果判定** (`ADSENSE-MOBILE-INCONTENT-01`) | 2026-07-12 (4週後)・device=mobile セグメント。既存の週次レビュー cron が処理 |
| **footer 枠整理** (`ADSENSE-FOOTER-02`) | A の mobile 計測完了後 (逐次。同時変更すると効果分離不能) |
| **右サイドバー viewability 整理** | `ADSENSE-RPM-01` の効果判定 (2026-07-04) 後。計測中は触らない |
| **引越しアフィ実装** | 人間が ASP リンクを渡したら |

---

## 完了したこと (本セッション・2026-06-14)

- **A (デプロイ済み)**: ranking モバイル本文中広告 (`RANKING_INCONTENT_MOBILE`) を「相関分析の後」→「考察(insights)直下」へ上方移設。旧位置は折りたたみ 3 セクション下で到達率が低かった。考察直下=全モバイル読者が到達する高 viewability 位置。
  - PR #479 (feature→main 単独デプロイ)・CI 全 green・main マージ済・本番 200 確認済
  - デスクトップ右サイドバー (`ADSENSE-RPM-01` 計測中) とは別デバイスセグメントのため計測非干渉
  - `npx tsc --noEmit -p apps/web/tsconfig.json` exit 0
- **main→develop 同期済** (worktree マージで安全に。分岐解消: main ahead 0)
- **バックログ登録**: `ADSENSE-MOBILE-INCONTENT-01` (effect/pending, 2026-07-12) / `ADSENSE-FOOTER-02` (逐次 blocked) / `AFF-AREAS-MOVING-01` (二重ブロックの仕込み spec)
- **PSI mobile error**: マスタープラン診断 (06-12) の population-dynamics 40点は、その後の 06-13 デプロイ (`PERF-D3-BUNDLE-01`/`PERF-RANKING-CLS-02`, 共に effect/full) で概ね解消済み。残りは `PERF-AUDIT-DEFER`。

## 判断の背景 (なぜ A だけ単独で出したか)

- 標準フロー (develop→main) だと develop の 25 コミット (108ブログリライト等) も同時に本番化される。小さな広告移設のついでに大型変更を出すのはブラスト半径が大きいため、A のみ feature→main で単独デプロイした (オーナー承認済み)。
- マスタープランの検証規律 (WIP≤5・検証中の施策を汚染しない) に従い、footer/右サイドバーは計測完了まで逐次化した。

## 注意点

- ローカル `main` は origin より behind。作業再開時に `git pull` で fast-forward (note ドラフトの未ステージ変更は保全されている)。
- 収益の現状 (マスタープラン 2026-06-12 実測): AdSense 月 ~¥500 / アフィ ¥0 / GSC 1,349 clicks/週 (成長中)。レバーはトラフィックでなく変換効率。
