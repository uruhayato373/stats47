---
week: "2026-W16"
type: review
generatedAt: "2026-04-17"
sprint: "Sprint 2（配信定着 + 効果検証）Week 4/6"
---

# 週次レビュー 2026-W16

## サマリー

- 計画タスク達成率: Must 2/3（67%）、Should 0/3、Could 0/2。合計 2/8（25%）
- 主な成果: GSC/GA4 継続改善サイクル Phase 1-3 完結、DB 同期フローを単一 PC 運用向けに再設計、GSC 恒久対策を本番デプロイ

## 計画 vs 実績

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| X 3 件投稿 | Must | **完了** | ranking domain で 3 件 posted（6 週連続未達を脱出） |
| `/update-sns-metrics` 実行 | Must | **未達** | `metrics_updated_at` は 2026-04-03 のまま、14 日停滞 |
| develop → main デプロイ | Must | **完了** | 今日 `9282e9c3` まで main に同期。週内 17 コミット分反映 |
| 公開記事 -39 本の影響調査 | Should | **未達** | 削除記事のリダイレクト/410 確認未実施 |
| CTR 改善: あと一押しクエリ 3 件 | Should | **未達** | 外来受療率・乳牛・下水道普及率の改善なし |
| YouTube 1 件投稿 | Should | **未達** | scheduled 12 件あるが未投稿 |
| 職種別年収ブログ下書き | Could | **未達** | トレンド起点の下書きなし |
| 相関分析データ最終判断 | Could | **完了** | ロードマップで「❄️ 凍結」と明記済（W15 以前）、今週追加対応なし |

計画外作業（上位 5 件）:
- GSC/GA4 継続改善サイクル Phase 1-3 完結（metrics-reader 導入、weekly-review/plan 統合、RemoteTrigger 週次自動化）
- DB 同期フロー再設計（単一 PC 運用へ移行、ロールバックを D1 Time Travel に切替）
- GSC 恒久対策 Phase 1+2 実装（404/410/soft404/5xx・クロール予算）
- GSC Tier 0 URL 空間整理と施策効果追跡基盤
- 計測記録の保存先統一（D1 → ファイル、sns_metrics 含む）

## 成果ハイライト

1. **GSC/GA4 継続改善サイクルの自動化完了**: Phase 1（metrics-reader + `/nsm-experiment`）→ Phase 2（`/weekly-review/plan` 統合）→ Phase 3（RemoteTrigger 週次自動実行）を 1 週間で連続着地。次週以降は週次 PDCA が自動回る
2. **X 投稿 6 週連続未達を脱出**: ranking domain で 3 件投稿。意志力ベースの「月曜の最初のタスク」指定でも一応動いた実例
3. **DB 運用の負債整理**: 複数 PC 前提の pull/push 双方向フローを単一 PC 前提の一方向 push に簡素化。ロールバックは D1 Time Travel（30 日 PITR）で賄う方式に切替え、R2 バックアップのサイズ爆発問題（6.1 GB > 2 GiB PUT 上限）から脱却
4. **GSC 根本問題の発見**: 登録済み 1,860 vs 未登録 16,628（比率 9.1:1）。sitemap が 620–870 URL しか出していないので **約 17,000 URL が過去の残骸**という新しい仮説を得た → Tier 0 施策群が追加された

## 開発活動

- コミット数: 15 件（develop に集約）
- 変更規模: +655 / -497 行、14 ファイル修正
- 新規作成ファイル傾向: `.claude/skills/`（13 個）、`scripts/scheduled/`（4 個）、snapshot CSV（11 個）
- 未コミット変更: なし（クリーン）
- develop → main: 今日までに同期済（`0 commits ahead`）

## コンテンツ実績

| 種別 | 今週 | 先週 | 増減 |
|---|---|---|---|
| 公開記事 | 0 | 0 | ±0 |
| SNS 投稿 (X) | 3 | 0 | +3 |
| SNS 投稿 (Instagram) | 0 | 0 | ±0 |
| SNS 投稿 (TikTok) | 0 | 0 | ±0 |
| SNS 投稿 (YouTube) | 0 | 0 | ±0 |
| 投稿待ちストック | draft 82 / scheduled 85（計 167） | 167 | ±0 |

## NSM 実験進捗

Phase 0 snapshot: `.claude/skills/management/nsm-experiment/reference/weekly-snapshots/2026-W16.json`

### active な実験

| id | title | status | 経過 | baseline → 今週 | 次アクション |
|---|---|---|---|---|---|
| EXP-001 | GSC 問題の恒久対策 Phase 1+2 | running | 3 日 | engaged_sessions 13 → 13（±0%） | pending_user_actions 消化 |

### measure 候補

- なし（EXP-001 は経過 3 日、10 日基準に未達）

### 継続作業が必要な実験

- EXP-001 pending_user_actions:
  1. GSC UI で sitemap.xml を再送信
  2. GSC カバレッジレポートの 404 / 5xx / soft404 カテゴリで「修正をリクエスト」

### 次確認日が近い実験

- EXP-001: next_check_date = 2026-04-28（FINAL 観測日、デプロイ +14 日）

## パフォーマンス

詳細データは snapshot CSV と improvement-log.md を参照。

### GA4（過去 28 日） — snapshot: `.claude/skills/analytics/ga4-improvement/reference/snapshots/2026-W16/`

| 指標 | 今週（28d） | 備考 |
|---|---|---|
| PV | 2,163 | baseline 初記録（前週比は次回から） |
| active users | 689 | 新規率 99%（681 / 689） |
| sessions | 759 | — |
| bounce rate | 42.4% | — |
| 平均滞在 | 136.66 秒 | — |

主要な動き:
- Organic Search 115 sessions (15%)、Direct 456 (60%) が最大。Referral 113 (15%)
- 上位ページ: `/`（472 PV）、`/themes/population-dynamics`（141 PV、滞在 4,169 秒は bot 疑い）、`/search`（86 PV）

### GSC（過去 28 日） — snapshot: `.claude/skills/analytics/gsc-improvement/reference/snapshots/2026-W16/`

| 指標 | 今週（28d） | 7d 比較（直近 7d vs 前 7d） |
|---|---|---|
| 合計クリック | 52 | 145 vs 99（**+46.5%**） |
| 合計表示 | 3,069 | 3,851 vs 2,522（**+52.7%**） |
| 平均 CTR | 1.69% | — |
| 平均順位 | 27.1 | 9.67 → 9.34（改善） |

順位 11-20 位「あと一押し」クエリ:
- 健康寿命ランキング 都道府県 2023（102 imp, CTR 0%, pos 12.0）
- 県内総生産 ランキング（12 imp, pos 12.0）
- 新潟 世帯数（9 imp, pos 19.9）

CTR < 2% で表示多い改善候補:
- 健康寿命ランキング 都道府県 2023（102 imp, CTR 0%）
- 高卒初任給 ランキング（36 imp, CTR 0%, pos 7.3）
- 県民所得 ランキング（28 imp, CTR 0%, pos 30.6）

### インデックスカバレッジ（2026-04-10 → 2026-04-17）

| カテゴリ | 04-10 | 04-17 | Δ |
|---|---|---|---|
| 404 | 5,661 | 5,727 | +66 |
| 5xx | 2,047 | 2,044 | −3 |
| ソフト 404 | 506 | 500 | −6 |
| クロール済み未登録 | 2,339 | 2,415 | +76 |
| 検出未登録 | 1,536 | 1,394 | **−142** |
| 登録済み | 1,808 | 1,860 | **+52** |

**GSC Alert**: 非発火（登録済み ≤ −10% / 404 ≥ +5% / 5xx ≥ +20% 全て未達）。

**施策効果サマリ**（`/gsc-improvement observe` より）:

| 施策 ID | Tier | 経過 | ターゲット | 判定 |
|---|---|---|---|---|
| T1-MW-01 | T1 | 3d | 404, リダイレクト | PENDING |
| T1-SRC-01 | T1 | 3d | ソフト 404, 5xx | PENDING |
| T1-CRAWL-01 | T1 | 3d | クロール未登録, 検出未登録, 登録済み | PENDING |
| T1-CF-01 | T1 | 3d | 404, 5xx | PENDING |

T1-* 全施策は経過 3 日で PENDING。FINAL 観測は **2026-04-28**（デプロイ +14 日）。

### YouTube

| 項目 | 値 | 04-11 比 |
|---|---|---|
| 登録者 | 31 | +1 |
| 総再生回数 | 78,316 | +134 |
| 動画数 | 147 | ±0（channel API 基準） |

再生数 Top 5:
1. 自動車の保有台数ランキング 2014 — 2,245
2. 合計特殊出生率ランキング 43 年の変遷 — 2,127
3. 脳血管疾患による死亡者数ランキング 2022 — 2,027
4. 小学 5 年生女子の平均体重ランキング 2022 — 2,009
5. 老年化指数ランキング 2022 — 2,004

### SNS パフォーマンス

**最終取得日**: 2026-04-03（**14 日未更新、`/update-sns-metrics` 要実行**）

| プラットフォーム | 計測投稿数 | impressions / views | いいね | コメント | リポスト |
|---|---|---|---|---|---|
| X | 70 | 3,051 | 8 | 1 | 2 |
| YouTube | 57 | 8,339 | 13 | 1 | — |
| Instagram | 58 | 0 | 1 | 0 | — |
| TikTok | 57 | 124 | 0 | 0 | — |
| note | 31 | 0 | 0 | 0 | — |

X impressions Top 5:
1. traffic-accident-count-per-population — 240
2. avg-salary-admin-prefecture — 186
3. social-increase-rate — 168
4. high-school-advancement-rate — 167
5. total-population — 145

### NSM snapshot ハイライト（weekly-snapshots/2026-W16.json）

| 指標 | 今週 | 前週 | Δ |
|---|---|---|---|
| engagedSessions | 13 | 23 | **−43.5%** |
| users | 13 | 26 | −50% |
| sessions | 19 | 34 | −44% |
| GSC clicks（7d） | 135 | 98 | **+37.8%** |
| GSC impressions（7d） | 3,411 | 2,632 | +29.6% |
| GSC CTR | 3.96% | 3.72% | +0.24pt |
| GSC position | 9.18 | 9.96 | 改善 |

母数が小さくノイズ範囲だが、NSM の engagedSessions −43.5% と GSC clicks +37.8% の乖離が気になる。Direct 流入が GA4/GSC で分離している可能性（要来週追調査）。PSI は `PSI_API_KEY` 未設定でスキップ。

## 課題・ブロッカー

1. **SNS メトリクス 2 週連続未更新**: `/update-sns-metrics` が 2026-04-03 以降停止。計測ループが回らず、施策効果判定の土台が欠落
   - 対策: 来週 Must に再度入れ、既存の RemoteTrigger（週次自動化 Phase 3）で自動実行できないか検討
2. **記事整理の残タスク（-39 本影響調査）が 2 週連続繰り越し**: リダイレクト/410 確認をしないと GSC「クロール済み未登録」を恒常的に増やす
   - 対策: 来週 Must 昇格。W16 は技術整備で時間を使い切ったので、構造的に優先順位を上げる
3. **PSI 未計測**: `PSI_API_KEY` 未設定で performance-improvement が動かない
   - 対策: API キー取得 → `.env.local` に追加するだけの作業。来週 Must-small で消化

### 繰り返しパターン

- 「技術タスク優先パターン」は W10〜W15 の 6 週連続 → **W16 は X 3 件完了で断ち切れた**が、`/update-sns-metrics` 未達と SNS 関連 Should 全滅で完全脱却には至らず
- 計測系 Must（update-sns-metrics）は W15 完了 → W16 未達、安定していない
- デプロイは **W16 で完了**（W15 は未達）、回復

## 学び・ナレッジ

- **D1 Time Travel は 30 日 PITR を標準搭載**。R2 手動バックアップは災害復旧以外では不要。`/knowledge` 記録推奨: **いいえ**（memory `project_d1_time_travel.md` に記録済）
- **R2 単一 PUT は 2 GiB 上限**。ある程度のサイズを超える単発バックアップは multipart 化が必須。`/knowledge` 記録推奨: **はい**（次に R2 に大きなアーティファクトを置くときに忘れないように）
- **単一 PC 運用へ縮退する際は、「テーブルオーナーシップ表」のような運用負荷を一気に削れる**。複雑性は前提条件とセットで発生する。`/knowledge` 記録推奨: **はい**

## 来週への申し送り

- **Must 最優先**: `/update-sns-metrics` の実行と、計測自動化の検討（RemoteTrigger で組めるか）
- **Must 昇格**: 公開記事 -39 本の影響調査（リダイレクト/410 確認）。2 週繰り越し
- **EXP-001 の pending_user_actions を GSC UI で消化**（手動操作 2 件）
- `/themes/population-dynamics` の異常滞在（4,169 秒）の原因調査 — bot 疑いか genuine engagement か
- Sprint 2 は W16 で Week 4/6。残り 2 週。X 週 3 投稿継続基準（累計 22 件 / 現在 70 件）は既に満たされているが、「4 週間連続 3 件」は W16 の 3 件で 1 週目スタート。W17-W18 も継続できれば Sprint 2 完了条件の一部が満たせる
- PSI 計測を動かす（`PSI_API_KEY` 取得して `.env.local` 追加）
