---
name: nsm-experiment
description: >
  NSM（週間エンゲージドセッション数）改善の実験ライフサイクルを管理する。
  propose（候補提案）→ start（実行開始）→ measure（前後比較）→ close（学び記録）の
  PDCA ループを回す。セッション間で継続作業を持越す場合は pending/resume で復帰可能。
  .claude/state/experiments.json を状態保存先に使い、playbook + rubric で意思決定を支援する。
  Use when user asks to [NSM 実験, 仮説検証, /nsm-experiment, 実験提案, 効果測定,
  PDCA サイクル, 作業継続, 残作業確認, pending 作業, GSC インデックスリクエスト].
---

**実行環境**: macOS / Windows 両対応。GA4 + GSC の計測基盤（`metrics-reader.mjs` で構築済み）が前提。

## なぜこのスキルがあるのか

stats47 では GSC/GA4 スナップショットと `improvement-log.md` で施策の記録はできるが、「どの仮説を検証中か」「baseline から何日経過したか」「前後比較の結果はどうか」を仕組み化できていない。`improvement-log.md` は append-only のフリーテキスト、ログ性は高いが PDCA ループを閉じる機能はない。

本スキルは Anthropic "Building Skills for Claude" ガイド **Pattern 3: Iterative refinement** を NSM 改善に適用し、以下のサイクルを仕組み化する:

```
Plan       : propose 候補を playbook + rubric で評価 → start
Do         : ユーザーが実験を実行（コンテンツ編集・デプロイ）
Check      : measure で前後比較
Act        : close で learnings 記録 → 次施策へフィードバック
```

詳細は `references/definition.md` を参照。

## 引数

```
/nsm-experiment                          # 引数なしは pending の alias
/nsm-experiment pending                  # 継続作業が必要な実験を surface（セッション継続時の第 1 候補）
/nsm-experiment resume <id>              # 特定実験の残作業を step-by-step で guide
/nsm-experiment propose                  # 現状メトリクスから候補 3-5 件を提案
/nsm-experiment list [--status <s>]      # 実験一覧（status フィルタ可）
/nsm-experiment start <id>               # 実行開始（proposed → running）
/nsm-experiment measure <id>             # 前後比較（running → measuring）
/nsm-experiment close <id>               # 学び記録（measuring → done）
/nsm-experiment abandon <id>             # 中止（→ abandoned）
/nsm-experiment show <id>                # 1 件の詳細表示
```

## 状態遷移

```
proposed → running → measuring → done
    ↓         ↓          ↓
abandoned  abandoned  running (re-measure)
```

- **proposed**: 候補として作成済み、まだ実行していない
- **running**: 実行中（started_at 記録）
- **measuring**: 計測中（baseline と比較可能）
- **done**: 学びを記録して完了
- **abandoned**: 中止（理由を history に記録）

## サブモードの実行手順

### pending: 継続作業の surface

**目的**: 新セッション or 作業再開時に、中断中の実験と残作業を即座に把握する。

1. `node .claude/scripts/lib/experiments-state.mjs pending` を実行
2. 何も出力がなければ「継続作業なし。`/nsm-experiment propose` で次の候補を見ますか？」と返す
3. 出力がある場合は以下のフォーマットで markdown 出力:

```
=== 継続作業が必要な実験 (N 件) ===

🔴 EXP-001  統合ハウスキーピング (running, 経過 X 日)
   次確認日: 2026-04-24 (期限超過 or 今日 or あと N 日)
   ────────────────────────────────────────
   【保留中アクション】
   - GSC 手動 indexing リクエスト (残 3 件)
   - sitemap 再送信確認
```

**絵文字の意味**:
- 🔴 期限超過 or 今日が next_check_date
- 🟡 3 日以内
- 🟢 未来（継続作業はあるが急ぎではない）

4. ユーザーに「どの action から進めるか」を問う。

### resume: 特定実験の継続作業を guide

1. `node .claude/scripts/lib/experiments-state.mjs get <id>` で取得
2. `pending_user_actions` が空 or 未定義なら「継続作業なし」と返す
3. 各 `pending_user_actions[]` について順に:
   a. action 名と参照ファイル（`reference`）を表示
   b. 残 URL / sub-items を 1 つずつ surface
   c. ユーザーに完了確認を取る（「完了」「スキップ」「中止」）
   d. 完了した項目を pending から削除（Edit tool で `experiments.json` を更新、history にも `manual_action_completed` エントリを追記）
4. 残作業がなくなれば「pending 作業はすべて完了。次は `/nsm-experiment measure` で効果計測に移れます」と誘導

### propose: 候補提案

1. `node .claude/scripts/lib/metrics-reader.mjs --json` で現状取得（今週 vs 前週、チャネル別、トップクエリ）
2. `references/playbook.md` を Read してパターンカタログを読み込む
3. `references/rubric.md` を Read して評価軸を読み込む
4. 現状メトリクスと playbook を突き合わせ、適用可能な実験を洗い出す
5. 各候補を rubric で採点（インパクト 40% / 工数 30% / 学習価値 20% / 確実性 10%）
6. 加重合計降順で上位 3-5 件を表示
7. ユーザーに「どれを experiments.json に追加するか」尋ねる
8. 採用する候補を Write/Edit で `.claude/state/experiments.json` に追加。id は `EXP-NNN` 形式で連番（`experiments-state.mjs` の `addExperiment` を使うか、JSON を直接編集）

**出力例**:
```
=== NSM 実験候補 (propose) ===
現状: 週 engagedSessions 13、GSC clicks 135（前週 98, +37.8%）、top query の平均 position 9.2

1. [EXP-??? 加重 2.4] 「神奈川県の統計」「千葉県の統計」など 県名 × 統計 クエリの meta description 強化
   hypothesis: position 9 → 5 以内で CTR 2x 見込み
   rubric: impact 3 / effort 3 / learning 2 / certainty 2 → 2.4
   actions: 該当ページの description を 100-160 字に書き換え → デプロイ → 10 日待機

2. ...

どの候補を experiments.json に追加しますか？ (例: "1,3")
```

### start: 実行開始

1. `getExperiment(id)` で取得、存在確認
2. status が `proposed` であることを確認
3. **baseline を確定**: この時点のメトリクスを取得して experiment.baseline に保存（`metrics-reader.mjs --json` の出力の該当部分）
4. `transitionStatus(id, 'running')` で遷移（= `.claude/state/experiments.json` を更新）
5. 実行アクションリスト（experiment.actions）を表示
6. ユーザーに「実際の編集作業」を促す

### measure: 前後比較

1. `getExperiment(id)` で取得
2. status が `running` または `measuring` であることを確認
3. **ガード: started_at から 10 日未満なら警告**（GSC 3 日遅延 + 初期データのブレを考慮）
4. 現在のメトリクスを `metrics-reader.mjs --json` で取得
5. baseline と比較し、target_metric の delta を計算
6. 効果サマリを表示（改善/悪化/変わらず）
7. `transitionStatus(id, 'measuring')` で遷移（既に measuring なら再計測）

### close: 学び記録

1. `getExperiment(id)` で取得
2. status が `measuring` であることを確認
3. 効果判定をユーザーに問う: `success` / `partial` / `no-effect` / `negative`
4. learnings をユーザーに記述してもらう
5. `updateExperiment(id, { result, learnings })` 相当の更新
6. `transitionStatus(id, 'done')`
7. **playbook フィードバック提案**: 成功パターンなら `references/playbook.md` の「履歴（学んだこと）」セクションへの追記を提案

### abandon: 中止

1. `getExperiment(id)` で取得
2. 中止理由をユーザーから聞く
3. `transitionStatus(id, 'abandoned', { reason })`

### list / show

- `list`: `node .claude/scripts/lib/experiments-state.mjs list [--status S]` で表形式
- `show <id>`: `node .claude/scripts/lib/experiments-state.mjs get <id>` で詳細表示

## 制約事項

- **同時 active 実験 ≤ 2 件**（rubric 原則）: `listActive()` が 2 件以上返す場合、新規 start 時に警告
- **started_at + 10 日未満の measure は警告**: GSC 3 日遅延 + 短期ノイズを除外
- **実行（実ファイル編集）は担当外**: 本スキルは lifecycle 管理専任。実コンテンツ編集は既存の blog-editor 系・theme-enhancer 系スキルに委譲
- **自己評価の禁止**: 「この learning で playbook を直接書き換える」ような Generator 行為はしない。提案までが責務

## 担当外

- **NSM 定義の変更**: `[Critical Review] North Star Metric` Issue（`critical-review` ラベル）の更新は `/north-star-metric` スキルの担当
- **コンテンツそのものの編集**: blog-editor / theme-enhancer 配下のスキルが担当
- **週次レポート生成**: `/weekly-review` の担当（本スキルは experiments-state を提供するのみ）

## 連携スキル・コンポーネント

| 連携先 | 役割 |
|---|---|
| **`.claude/scripts/lib/experiments-state.mjs`** | state I/O 本体 |
| **`.claude/scripts/lib/metrics-reader.mjs`** | baseline と current の計測 |
| **`.claude/scripts/snapshot-weekly-metrics.mjs`** | 週次スナップショット（propose 時の背景データ） |
| **`.claude/skills/management/weekly-plan/SKILL.md`** | Phase で実験提案を自動化 |
| **`.claude/skills/management/weekly-review/SKILL.md`** | 実験進捗セクションで running を自動表示 |
| **`references/playbook.md`** | 実験パターンカタログ |
| **`references/rubric.md`** | 優先順位評価軸 |
| **`references/definition.md`** | NSM 定義（詳細は `[Critical Review] North Star Metric` Issue を参照） |

## 使い方の例

```bash
# 初回: 現状把握から候補提案
/nsm-experiment propose

# 採用した 1-2 件を開始
/nsm-experiment start EXP-001
# ← baseline が固定され、実行アクション一覧が表示される

# ユーザーが実際のコンテンツ編集・デプロイを実施（skill 対象外）

# 10 日経過後
/nsm-experiment measure EXP-001
# ← 前後比較サマリ表示

# 効果を判定して close
/nsm-experiment close EXP-001
# ← 効果判定と learnings を対話入力 → done へ遷移

# 次週の /weekly-plan で自動的に次の候補提案へループ
```

## 実証チェックリスト（measure / close で effect を判定する前に必須）

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] 検証コマンドを実行したか（実験のメトリクス取得元 API を直接叩く）:
  - 該当する `/fetch-{gsc,ga4,adsense}-data` でメトリクスを取得
  - `.claude/scripts/lib/metrics-reader.mjs` で statefile から取得
  - 比較期間（before / experiment 中 / after）を明確に CSV に
- [ ] 想定効果値の根拠（過去類似実験 / 計算式 / 参照論文）を `propose` 段階で書いたか
- [ ] NG ワード（「のはず」「と思われる」「兆候」「浸透待ち」）を使っていないか
- [ ] 効果が想定の 80% 未満なら、`[仮説] 〜 / 検証コマンド: 〜 / 検証期日: YYYY-MM-DD / 期日後の判定: 〜` の 4 点セットを書いたか
- [ ] **「10 日経過」の閾値の根拠**（`references/playbook.md` or `references/rubric.md`）を引用したか。閾値が根拠なしなら 14 → 21 日に保守化
- [ ] 同時並行で動いている他施策の影響を切り分けたか（A/B 比較が無理なら少なくとも「他施策デプロイ日と被っていないか」を記録）

このチェック未満なら effect/full / effect/partial を付けて close しない。状態を running のままにすること。

## 参照

- `references/definition.md` — NSM 定義と目標値のサマリ
- `references/playbook.md` — 実験パターンカタログ
- `references/rubric.md` — 優先順位評価軸
- `[Critical Review] North Star Metric` Issue（`critical-review` ラベル） — NSM の完全な定義。`gh issue list --label critical-review --search "North Star Metric"` で検索
- `.claude/scripts/lib/experiments-state.mjs` — state 実装
- `.claude/scripts/lib/metrics-reader.mjs` — 計測実装
