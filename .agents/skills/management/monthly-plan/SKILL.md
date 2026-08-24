---
name: monthly-plan
description: 月次計画を生成する（週次レビューと各バックログを集約 → 今月の重点1-2テーマに絞る → 予算配分）。Use when user says "月次計画", "今月の計画", "今月どこに張る". Pro 使用量を制約軸に重点を1-2テーマへ絞る。週次の重い収集は再実行せず集約する軽量設計.
primary_agent: strategy-advisor
---

月の頭に「今月どこに張るか」を決める上位レイヤー。**Pro 使用量（予算）が限られる前提**で、無数にある TODO から **重点 1-2 テーマに絞り**、週次計画がそれを分割消化する起点を作る。

## 設計思想（なぜ軽量か）

- **週次の収集を再実行しない。** 5 並列の重いコンテキスト収集は `/weekly-plan` が毎週やっている。月次はその**成果物（週次レビュー 4 本 + 各バックログ）を集約**するだけ。トークン消費を抑え、月 1 回でも予算を圧迫しない。
- **重点は 1-2 テーマに絞る（必須制約）。** 予算が有限なので「全部やる」計画は禁止。今月確実に前進させる 1-2 テーマを選び、**それ以外は「今月やらない」と明示**する。
- **真実源は既存のまま。** 改善施策は `improvements.md`、機能・指標は `backlog.md` が SSOT。月次計画はそこから**今月分を抜き出した優先順位ビュー**であり、TODO の実体を二重管理しない。
- **月次 → 週次の接続。** `/weekly-plan` は「今月の重点テーマ」を読んで、毎週の Must をそのテーマの分割タスクから優先的に選ぶ（Phase 1 Agent D で参照）。

## 引数

```
/monthly-plan [YYYY-MM]
```

- 月（任意）: `2026-06` 形式。省略時は今月。

## 手順

### Phase 1: 集約（read-only・低コスト。並列の重いエージェントは起動しない）

以下を **Read / grep で直接読む**だけ。API 呼び出し・全文スキャンはしない。

1. **直近 4 週の週次レビュー**（今月＋先月末をカバー）
   ```bash
   ls -t .Codex/skills/management/weekly-review/reference/reviews/*.md 2>/dev/null | head -4
   ```
   → 各レビューの「成果」「未達」「来週への申し送り」「パターン分析」を抽出。**繰り返し未達のテーマ**（複数週で stall しているもの）を特定する。これが今月の重点候補の最有力。

2. **現在の週次計画**（今週の未消化を見る）
   ```bash
   grep -E "^- \[ \]" .Codex/todo/weekly.md 2>/dev/null || true
   ```

3. **3 つのバックログから今月着手すべき pending を抽出**（真実源・実体はここ）
   ```bash
   # 改善施策: Tier 1/2 の pending / in-progress / effect-pending（due が今月のもの優先）
   grep -E "pending|in-progress|effect/pending" .Codex/todo/improvements.md | head -30
   # 機能・自動化: P0-P2 の active 項目
   sed -n '/^## 🔴 /,/^## 🟣 /p' .Codex/todo/backlog.md | \
     grep -E "^## |^### |status.*(pending|in-progress|blocked)"
   # 指標拡充
   head -40 .Codex/todo/backlog.md
   ```

4. **実装計画上の現在地**
   ```bash
   head -80 docs/02_実装計画/00_INDEX.md
   head -160 docs/00_プロジェクト管理/02_収益化戦略.md
   ```

5. **NSM / 主要指標の現状**（既に集約済みの LATEST を読むだけ。API は叩かない）
   ```bash
   cat .Codex/state/metrics/gsc/LATEST.md 2>/dev/null | head -20
   cat .Codex/state/metrics/ga4/LATEST.md 2>/dev/null | head -20
   ls -t .Codex/skills/management/nsm-experiment/reference/weekly-snapshots/*.json | head -1
   node .Codex/scripts/gsc/audit-operations-cycle.mjs --stage review-input
   ```
   → GSCの数値だけでなく、計測週・review・候補判断・effect verdictの接続状態を月次入力にする。

6. **現在の月次計画**（月替わり時は上書き前に達成状況を読む）
   ```bash
   cat .Codex/todo/monthly.md 2>/dev/null
   ```

7. **TODO インボックスの triage**（セッション中に捕捉した未整理 TODO を振り分ける）
   ```bash
   cat .Codex/todo/backlog.md
   ```
   → 分類待ちカードへタグを付ける（改善施策だけ improvement-triage 経由で `improvements.md` へ / PR で閉じるバグ→Issues）。
   → 振り分けた行は受信箱から削除する。整理済み履歴を受信箱へ残さない。**今月の重点テーマ候補**にも受信箱由来の項目を含めて検討する。

### Phase 2: 重点テーマの選定（1-2 テーマに絞る・予算制約）

集約結果から、**今月確実に前進させるテーマを 1-2 個だけ**選ぶ。選定基準（優先度順）:

1. **収益・PV に直結するか**（`docs/00_プロジェクト管理/02_収益化戦略.md` の優先順位・意思決定ゲートと整合）
2. **複数週 stall しているか**（週次で何度も未達 = 週次の粒度では倒せない。月次で腰を据える対象）
3. **due が今月内に集中しているか**（effect 計測の due 等、待てないもの）
4. **1 テーマが Pro 予算でその月に完遂可能か**（L タスクが 3 つ以上連なるテーマは 1 ヶ月で 1 テーマ）

**重点に選ばなかったものは「今月やらないこと」として明示**する（来月以降の候補として残す）。これが予算を守る肝。

### Phase 3: 月次計画の組み立て

各重点テーマについて:
- **今月のゴール（成功基準）**: 月末に検証可能な形（数値・成果物）で 1 つ
- **構成タスク**: そのテーマを倒すための 3-6 個のサブタスク（週次で消化される単位）。各タスクに概算サイズ S/M/L
- **どの週に何を**: ざっくり W-by-W の配分（週次計画が詳細化する）
- **依存・ブロッカー**: ユーザー操作が必要なもの・前提条件

### Phase 4: セルフ批判（予算と焦点）

1. **「重点が 3 つ以上になっていないか？」** — なっていたら 1-2 に削る。削ったものは「今月やらない」へ。
2. **「先月と同じテーマを重点に置いて、また未達では？」** — 前月計画と照合。倒せなかった原因（粒度が大きすぎ / 依存待ち / 予算不足）を特定し、今月は分割するか前提を解消する。
3. **「これは予算内で本当に終わるか？」** — L タスクの数を数える。週次工数の現実（W25 レビューでは plan 外タスクが工数の 60%）を踏まえ、楽観を削る。

### Phase 5: 出力

Write tool で `.Codex/todo/monthly.md` を上書きする。frontmatter 必須。作成後にパスを報告する。

保存後に月次接続ゲートを実行する。

```bash
node .Codex/scripts/gsc/audit-operations-cycle.mjs --stage monthly --write --strict
```

FAILが残る場合は月次計画を「完了」と報告せず、欠落週review・候補判断・effect反映を週配分へ入れて再実行する。

## 出力フォーマット（ファイル本文）

```markdown
---
type: monthly-plan
month: YYYY-MM
date: YYYY-MM-DD
status: active
focus_themes: ["<テーマ1>", "<テーマ2>"]
tags: []
---

# Monthly Plan YYYY-MM

## 月
- **対象月**: YYYY-MM（YYYY-MM-01 〜 月末）
- **含む ISO 週**: YYYY-Wnn 〜 YYYY-Wmm
- **Sprint**: Sprint N（ロードマップ上の位置）

## 予算前提（Pro 使用量）
<!-- 今月どれくらい動けるかの体感。重点を絞る根拠。 -->
- 想定稼働: <週あたりの目安。例: 重い実装は週 1 テーマが限界>
- 方針: 重点 1-2 テーマに集中。下記「今月やらないこと」は来月以降へ。

## 前月の振り返り
<!-- 前月 monthly-plan の focus_themes が達成されたか。未達なら原因。 -->
| 前月の重点テーマ | ゴール | 結果 | 原因 / 申し送り |
|---|---|---|---|
| ... | ... | 達成/一部/未達 | ... |

## 現状サマリー
| 指標 | 現在値 | 先月比 | 備考 |
|---|---|---|---|
| GSC clicks（28日 rolling）| N | ±X% | |
| NSM engagedSessions | N | ±X% | |
| 公開記事数 | N | +N | |
| 改善ログ effect/pending | N | | due 集中時期 |

## GSC運用サイクル

| 項目 | 最新 | 月内評価 | 次アクション |
|---|---|---|---|
| 計測→週次review | YYYY-Www / PASS-WARN-FAIL | 直近4週 N/4 | 欠落週があれば `/weekly-review` |
| search-growth判断 | approve/dismiss N件 | 週次最低1件 | 最大3件を審査 |
| effect判定 | full/partial/none/adverse/pending | target欠落 N件 | `improvement-triage` またはtarget負債処置 |
| index coverage | URL Inspection取得日 / remediation週 | fresh/stale | stale sourceを回復 |

## 今月の重点テーマ（1-2 個）

### 重点1: <テーマ名>
- **なぜ今月これか**: <収益直結 / 複数週 stall / due 集中 のどれか>
- **今月のゴール（月末に検証可能）**: <数値・成果物>
- **構成タスク**:
  - <サブタスク> [S/M/L] — 成功基準 / 使用スキル `/xxx`（→ 週: W-nn）
  - ...
- **依存・ブロッカー**: <ユーザー操作待ち等>
- **真実源リンク**: `improvements.md#<id>` 等

### 重点2: <テーマ名>（任意）
（同上）

## 今月やらないこと（予算のため意図的に見送る）
<!-- 重点に選ばなかった候補。来月以降の重点候補として残す。 -->
- <テーマ/タスク> — 見送り理由 / 再検討時期

## 週への配分（ガイド・週次計画が詳細化）
| 週 | 主に進める重点 | マイルストーン |
|---|---|---|
| W-nn | 重点1 | ... |
| W-nn | 重点1/2 | ... |

## 批判的レビュー
<!-- Phase 4 の結果 -->

## 関連ドキュメント
- 収益化戦略: `../00_プロジェクト管理/02_収益化戦略.md`
- 改善バックログ: `improvements.md`
- バックログ (機能・自動化・指標): `backlog.md`
- 実装計画 INDEX: `../02_実装計画/00_INDEX.md`
```

## 運用ルール

- **毎月初（第 1 週の月曜など）に 1 回実行**する想定。`/monthly-plan` だけで完結。
- **GSC運用サイクルは重点テーマ数に数えない健康管理の床**。GSCを重点に選ばない月も固定節を省略しない。
- 月内の進捗は **週次計画 `/weekly-plan` が分割消化**する。週次は `.Codex/todo/monthly.md` の `focus_themes` を読む。
- **タスクの実体（status / due）は各バックログが真実源。** 月次計画は選定理由と配分だけを持ち、進捗は週次計画とバックログで扱う。
- 月末の振り返りは独立スキルを作らず、**翌月の `/monthly-plan` の Phase 1-2 + 「前月の振り返り」セクション**で吸収する（軽量維持のため。重い振り返りが必要なら `/weekly-review` の月末回で代替）。
- 月次計画は蓄積せず毎月上書きする。前月結果は週次レビューと git 履歴に残す。

## 保存先

- 本スキル出力: `.Codex/todo/monthly.md`（frontmatter `type: monthly-plan`, `month: YYYY-MM`, `focus_themes: [...]`）
- 週次が参照: `/weekly-plan` Phase 1 Agent D / Phase 2

## 参照

- `docs/00_プロジェクト管理/02_収益化戦略.md` — 収益レーン・意思決定ゲート（重点選定の最上位基準）
- `docs/02_実装計画/00_INDEX.md` — 実装計画の現在地
- `.Codex/todo/improvements.md` / `backlog.md` — TODO 真実源
- `.Codex/skills/management/weekly-plan/SKILL.md` — 月次を分割消化する週次レイヤー
- `.Codex/rules/docs-vs-issues.md` — docs/ 配下に置く根拠
