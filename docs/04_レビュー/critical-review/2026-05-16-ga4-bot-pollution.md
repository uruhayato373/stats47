---
type: critical-review
date: 2026-05-16
status: active
tags: [ga4, analytics, bot-detection, data-quality]
related_review: docs/03_週次運用/週次レビュー/2026-W20.md
related_backlog: docs/50_Issues/automation-backlog.md#290
---

# GA4 bot 混入監査・対処方針 (2026-05-16)

## 経緯

2026-05-16 の W20 週次レビュー作業で GA4 snapshot を再取得した際、Direct チャネル sessions が前週比で急増（443→715, +61%）し、bounce rate も上振れ。dimension 多方向で混入チェックを実施したところ、複数の bot/spam 流入と計測エラーを検出した。

調査スクリプト:
- `/tmp/ga4-pollution-check.cjs` — hostname / source / country / landingPage / browser×OS の dimension dump
- `/tmp/ga4-clean-compare.cjs` — Japan-only クリーン値で W19/W20 同期間長 (6d) 比較

## 監査結果サマリ

### 検出された混入（5/10-15 期間）

| 種別 | W20 (6d) | W19 (6d) | 性質 |
|---|---|---|---|
| overseas sessions（country ≠ Japan） | 206（engagement 12%） | 135 | 大半が US 185、bot 推定 |
| `(not set)/(not set)` 完全情報欠落 | 92（engagement 0%） | 2 | **+4,500% 激増**、スキャナ疑い |
| Direct × bounce 100% の index/area page | `/areas/01000/*` 55, `/areas` 16, `/ranking` 15, `/blog` 9, `/this-page-does-not-exist-at-all` 5 | (要再調査) | 典型的 bot 巡回 |
| 空文字 landing page (Unassigned) | 83（engagement 0%） | — | 計測エラー or bot |

### Japan-only クリーン値 vs Raw（同期間長 6d 比較）

| 指標 | W19 (5/4-9) | W20 (5/10-15) | Raw 変化 | Clean 変化 |
|---|---|---|---|---|
| sessions | 488→352 | 1,119→911 | +129% | **+159%** |
| engagedSessions | 237→233 | 538→513 | +127% | **+120%** |
| activeUsers | 457→323 | 991→786 | +117% | **+143%** |

→ NSM 急落回復は raw でも clean でも +120% 以上で支持される。

## 影響評価

| 観点 | 評価 |
|---|---|
| NSM 急落判定 (engagedSessions ベース) | ✅ 妥当。bot 影響軽微（overseas 206 中 engaged 25 = 12%） |
| 絶対値 (Sessions / Active Users / Bounce Rate) | ⚠️ W20 で約 18-27% inflated。レビュー時は注意 |
| 前週比トレンド分析 | ⚠️ bot 流入が両週で同程度なら相殺、片週で急増（notSet 2→92）すると歪む |
| Cloudflare コスト | ⚠️ bot リクエストが Workers 実行・R2 fetch を消費。月次コストへの影響は別途調査 |
| SEO 影響 | ❌ なし（bot は GSC では検出されない） |

## アクションプラン

### Tier 1（即時・私が実行可）

- [x] **#A1** W20 レビュー本文に bot 混入の脚注と Japan-only クリーン値表を追記  
  → `docs/03_週次運用/週次レビュー/2026-W20.md` 反映済み（5/16）

- [x] **#A2** `/fetch-ga4-data` snapshot モード改修（backlog #290）✅ 2026-05-16 完了  
  - 追加出力: `overview-clean.csv` / `channels-clean.csv` / `pollution-summary.csv`  
  - `dimensionFilter: country=Japan` 適用  
  - 受入: W20 で再実行 → overview-clean sessions 2,080 / engagedSessions 1,281 / engagementRate 61.6%、pollution-summary overseas=586 notSet=99 で生成確認  
  - 副次発見: Bounce Rate も raw 50.3% → clean 38.4% で大きく改善 = bot が直帰率を引き上げていた  
  - 改修箇所: `.claude/skills/analytics/fetch-ga4-data/SKILL.md` snapshot スクリプト

- [x] **#A3** `/weekly-review` Phase 1 Agent C のドキュメント記述を「Japan-only クリーン値併記」前提に更新 ✅ 2026-05-16 完了  
  - `.claude/skills/management/weekly-review/SKILL.md` の GA4 セクション template に raw / clean / pollution の 3 表構成を追加  
  - W21 以降のレビューから自動的に併記される

### Tier 2（ユーザー操作必要）

- [ ] **#B1** GA4 Admin の bot/internal traffic 除外設定確認  
  - 手順: GA4 > Admin > Data Settings > Data Filters  
  - 確認項目:  
    - 「Exclude all hits from known bots and spiders」（IAB/ABC Spiders & Bots List）が ON か  
    - Internal Traffic フィルタが定義され Active か（ユーザーの自宅 / オフィス IP）  
    - Developer Traffic フィルタの状態  
  - 完了条件: スクリーンショット or 設定状況を action plan に追記  
  - 担当: uruhayato373

- [ ] **#B2** Cloudflare WAF rule で明確な bot スキャナをブロック  
  - 対象パターン:  
    - `/this-page-does-not-exist-at-all` および類似の存在しない URL への直接アクセス  
    - `/areas/01000/economy` `/areas/01000/population` への country != Japan からの連続アクセス  
  - 推奨方法: Cloudflare Dashboard > Security > WAF > Custom rules  
    - 例 rule 1: `(http.request.uri.path eq "/this-page-does-not-exist-at-all")` → Block  
    - 例 rule 2: `(http.request.uri.path matches "^/areas/[0-9]{5}/" and ip.geoip.country ne "JP" and not cf.client.bot)` → Managed Challenge  
  - 完了条件: rule 作成 → 1 週間運用後の GA4 で notSet sessions が減少することを確認  
  - 担当: uruhayato373（私からは Cloudflare API 経由でも可、要許可）

### Tier 3（中期・監視体制）

- [ ] **#C1** notSet / overseas sessions の週次トラッキング  
  - `/fetch-ga4-data` snapshot で pollution-summary.csv を出力したら、それを `.claude/state/metrics/ga4/pollution-history.csv` に append  
  - 週次レビューで「pollution が前週比で X% 増えた」アラート  
  - 想定工数: M（1-2h）、#A2 完了後に着手  
  - 担当: 未定（automation-backlog に新規 issue #291 として起票候補）

## 完了基準（このアクションプラン全体）

- [ ] Tier 1 全タスク完了
- [ ] Tier 2 確認結果が追記済み
- [ ] W21 週次レビュー時点で notSet sessions が W20 (92) より減少 or 増加要因が特定済み
- [ ] action plan の status を `completed` に更新

## 関連

- 監査詳細: `docs/03_週次運用/週次レビュー/2026-W20.md#ga4-bot-混入監査-2026-05-16`
- 機能改善 backlog: `docs/50_Issues/automation-backlog.md#290`
- 週次計画: `docs/03_週次運用/週次計画/2026-W21.md`
- 評価ルール: `.claude/rules/evidence-based-judgment.md`

## 進捗ログ

- 2026-05-16: action plan 作成、#A1 完了、#A2 完了（fetch-ga4-data 改修 + W20 で動作確認）、#A3 完了（weekly-review SKILL.md template 更新）
- 2026-05-16: 残タスク = Tier 2 (#B1 GA4 Admin 設定確認 / #B2 Cloudflare WAF rule) と Tier 3 (#C1 pollution-history 自動追跡) は人間操作 or 別 issue で対応
