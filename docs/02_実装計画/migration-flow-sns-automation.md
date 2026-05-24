---
type: implementation-plan
date: 2026-05-24
status: phase-1-skeleton
related_files:
  - .github/workflows/migration-flow-annual.yml
  - .github/workflows/migration-flow-monthly.yml
  - .github/workflows/migration-flow-weekly.yml
  - .claude/scripts/sns/migration-flow/
  - packages/migration-flow/
---

# Migration-flow SNS 自動化 (A+B+C 3 階層)

47 都道府県 migration-flow 動画を Instagram + X に継続投稿するための自動化設計。

## 3 階層の役割

| Tier | 周期 | 内容 | 投稿件数/回 | algo 影響 |
|---|---|---|---|---|
| **A. 年次 Full Refresh** | 1月20日 | 新データ (1月発表) で 47 県全 render + 全投稿 | 47×2 = 94 件 (2-3日に分散) | 大きなブースト |
| **B. 月次 ハイライト** | 毎月 1日 | TOP 5 / BOTTOM 5 変動県 1 件 (carousel or reel) | 1-3 件/月 | 中、データ鮮度維持 |
| **C. 週次 深掘り** | 毎週月曜 | 1 県の詳細ストーリー (近接県・地方ブロック分析) | 1 件/週 | 小、安定エンゲージ |

合計: **年間 ~150 件** = 月 12-15 件 = X/IG 両方とも安全な投稿頻度。

## A. 年次 Full Refresh

### Trigger
- `cron: "0 2 20 1 *"` → 毎年 1/20 11:00 JST
- e-Stat の住基台帳人口移動報告は毎年 1月後半公開、発表後 1 週間程度で反映

### Pipeline
1. e-Stat API から最新年データ取得 (`scripts/fetch-migration-flow.ts` 拡張)
2. `pref-net-2025.ts` を新年度版に上書き
3. Remotion で portrait (IG) + landscape (X) を 47 県分 render
4. caption 47×2 種類生成 (IG / X)
5. R2 push (`sns/migration-flow/`)
6. IG: 25/日 × 2 日で 47 件投稿 (Day 1 / Day 2)
7. X: 47 件 1-2 日で投稿
8. D1 `sns_posts` + publish log 自動更新

### 冪等性
- 投稿ログで既投稿 slug 自動スキップ
- 同年内に複数回 fire しても無害 (年 1 回でも data 同じ)

## B. 月次 ハイライト (TOP 5 変動県)

### Trigger
- `cron: "0 3 1 * *"` → 毎月 1日 12:00 JST

### コンテンツ案
1. **「先月の純移動 TOP 5 / BOTTOM 5」carousel**
   - 月次データの場合: e-Stat の月次値を使用
   - 月次データなしの場合: 年累計の変化率を使用
2. **「今月の話題: 〇〇県の流出が止まった理由」reel**
   - 1 県をピック (e.g., 福島が改善傾向)
3. **「東京一極集中、〇〇月の度合いは?」**
   - 東京の inflow を時系列で

### Pipeline (skeleton)
1. データ取得 + ハイライト判定 (script: `pick-monthly-highlight.ts`)
2. Remotion で highlight composition render
3. caption 生成 (テンプレ + データ差し込み)
4. IG / X 投稿

## C. 週次 深掘り (1県/週)

### Trigger
- `cron: "0 3 * * 1"` → 毎週月曜 12:00 JST

### ローテーション
- 52 週 × 1 県 / 週で **年間 47 県を全カバー (+ 余分の 5 週)**
- カバー順序: 当週 W番号 % 47 で順番に
- 既投稿週は skip、未カバーを優先

### コンテンツ
- 1 県の migration-flow 動画 (既存 mf-portrait/{NN}.mp4 流用)
- caption は「今週の県: 〇〇県」フォーマット
- 既存 portrait 動画を使う or 新規 cut

### Pipeline
1. 今週カバーする県を決定 (週次ローテーション state)
2. caption 生成
3. IG + X 投稿

## 既存資産

| 資産 | 用途 |
|---|---|
| `MigrationReelVertical` (Remotion) | portrait render |
| `MigrationFlowReel` (Remotion) | landscape render |
| `pref-net-2025.ts` | 県別純移動データ (年次更新対象) |
| `apps/remotion/scripts/fetch-migration-flow.ts` | e-Stat データ取得 |
| `publish-x.ts` | X 投稿 (Playwright) |
| `post-instagram.ts` | IG 投稿 (Graph API) |
| `instagram-mf-day2.yml` | 1-shot cron パターン |

## Phase

| Phase | 内容 | 状態 |
|---|---|---|
| **Phase 1 (今回)** | A の skeleton + 3 workflow yaml | 進行中 |
| Phase 2 | A の actual implementation (e-Stat fetch + render + post) | TODO |
| Phase 3 | B の TOP 5 carousel 実装 | TODO |
| Phase 4 | C の週次ローテーション state + 投稿 | TODO |
| Phase 5 | 効果計測 (engagement rate / follower growth) | TODO |

## 関連

- 既存投稿実績: `.claude/state/metrics/sns/instagram-publish-log.csv`
- 競合分析: `project_competitor_riskmap_jp.md` (1-2件/日 がベスト pace)
- SNS 戦略: `project_sns_10k_roadmap.md`
