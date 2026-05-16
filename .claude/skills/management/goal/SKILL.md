---
name: goal
description: >
  特定の課題(goal)について「実装 → 計測 → 評価・改善」のサイクルを反復して、終了条件を満たすまで漏れなく追跡するメタスキル。
  既存の improvement 系スキル(performance-improvement / gsc-improvement / ga4-improvement / adsense-improvement / sns-metrics-improvement / cloudflare-cost-improvement)を統括する。
  define(定義) → cycle(サイクル実行) → status(進捗確認) → close(完了 or 撤退) の流れで、サイクルごとに人間確認を挟みつつ goal 達成まで運用する。
  記録は docs/04_レビュー/goals/<slug>-YYYY-MM-DD.md に 1 goal 1 ファイルで append-only。
  Use when user asks to [/goal, 課題達成, 目標達成, サイクル運用, やり切る, 終了条件まで反復, PSI 改善のループ管理, goal 進捗].
---

**実行環境**: Node.js / macOS / Cloudflare 環境。既存 improvement 系スキルが整備済であることが前提。

## なぜこのスキルがあるのか

stats47 には改善ループスキル(performance-improvement / gsc-improvement / ga4-improvement / adsense-improvement / sns-metrics-improvement / cloudflare-cost-improvement)があり、施策単位の改善ログ(`improvement-log.md`)を蓄積する仕組みは整っている。しかし「特定の課題が達成されるまで反復追跡する仕組み」は不在だった。

過去の PSI 改善で EXP-002 ADVERSE → 1 度の失敗で計測サイクルが止まったり、EXP-003 が一時 effect/full → 他施策で revert したり、サイクル全体の管理が抜け落ちる事象が複数発生した。

本スキル `/goal` は **メタスキル**として、課題達成までのサイクルを統括する:

```
[define] → 課題・終了条件・撤退条件・仮説プールを構造化
   ↓
[cycle] → 1 PR + 1 計測 + 1 判定 = 1 cycle、人間確認を挟む
   ↓ ↑
[status] → 進捗確認(複数 goal 横断)
   ↓
[close] → 完了 or 撤退、学習資産を /knowledge に移管
```

施策実体・計測コマンド・improvement-log は各 improvement スキルに**委譲**する(車輪の再発明禁止)。本スキルはサイクル全体の制御・記録に集中する。

詳細設計は `docs/02_実装計画/archive/goal-skill-design.md` を参照。

---

## 引数

```
/goal                              # 引数なしは status の alias(進行中 goal 一覧)
/goal define <slug>                # 新 goal を対話的に定義
/goal cycle <slug>                 # 次サイクル開始 or 進行中サイクルの計測・判定
/goal status [slug]                # 進捗確認(slug 省略時は進行中一覧)
/goal close <slug> [reason]        # 完了 or 撤退、教訓を /knowledge に移管
/goal list                         # 全 goal 一覧(進行中 / 完了 / 撤退)
```

引数なし `/goal` は `/goal status` と同義(エントリポイント簡略化)。

---

## ファイル構造

| パス | 役割 |
|---|---|
| `.claude/skills/management/goal/SKILL.md` | 本ファイル(メイン定義) |
| `.claude/skills/management/goal/reference/goal-template.md` | 新規 goal 用 md テンプレ |
| `.claude/skills/management/goal/reference/metric-adapters.md` | metric × improvement skill 紐付け表 |
| `.claude/skills/management/goal/reference/cycle-decision-tree.md` | effect 判定からの分岐フロー |
| `.claude/skills/management/goal/scripts/create-goal.cjs` | define 時のテンプレ展開・slug 重複チェック |
| `.claude/skills/management/goal/scripts/update-cycle.cjs` | cycle の md / meta.json 更新 |
| `.claude/skills/management/goal/scripts/status-report.cjs` | status のテーブル生成 |
| `docs/04_レビュー/goals/<slug>-YYYY-MM-DD.md` | **goal 記録ファイル**(append-only、人間向け) |
| `.claude/state/goals/<slug>/meta.json` | ステータス・cycle 数等の機械可読版 |

---

## 状態遷移

```
ACTIVE → CLOSED-SUCCESS  (終了条件達成)
       → CLOSED-ABANDONED (人為的中止)
       → CLOSED-TIMEOUT  (max_cycles 超過 or 撤退条件発動)
```

cycle 状態(各 cycle 内):
```
proposed → deployed → measured → judged
   ↓          ↓           ↓          ↓
abandoned  abandoned   abandoned   next_cycle | success | revert
```

---

## サブコマンドの実行手順

### `define <slug>` — 新 goal 定義

**目的**: 新規 goal を構造化して登録、md 記録ファイルと meta.json を初期化する。

**手順**:

1. **slug 重複チェック**: `.claude/state/goals/<slug>/` が既存なら拒否(別 slug を提案)
2. **AskUserQuestion で対話的に収集**(以下 6 項目):
   - タイトル(短文)
   - 連携 metric(psi / gsc / ga4 / adsense / sns / cost / custom)
   - 終了条件(定量・必須)
   - 撤退条件
   - max_cycles(デフォルト 6)
   - 仮説プール(リスト、後で追加可)
3. `reference/metric-adapters.md` を Read して、選ばれた metric に対応する計測コマンド・improvement-log パス・budget ファイルを取得
4. **ベースライン計測の確認**:
   - 既存の最新計測データが `.claude/state/metrics/<metric>/` にあれば使う
   - なければ「ベースライン計測を先に実行してください」と促す
5. `node .claude/skills/management/goal/scripts/create-goal.cjs --slug <slug> --metric <metric> --title "<title>" --success-criteria "<criteria>" --abort-criteria "<criteria>" --max-cycles <N>` を実行
6. 生成された md(`docs/04_レビュー/goals/<slug>-YYYY-MM-DD.md`)を表示
7. ユーザーに「次サイクルを開始しますか?(`/goal cycle <slug>`)」と問う

**出力**:
```
✅ Goal 登録完了: <slug>
   md: docs/04_レビュー/goals/<slug>-YYYY-MM-DD.md
   meta: .claude/state/goals/<slug>/meta.json
   ベースライン: <値>
次: /goal cycle <slug>
```

---

### `cycle <slug>` — サイクル実行

**目的**: 進行中 goal の 1 サイクルを進める。状態に応じて次アクションを提示し、人間確認を挟みつつ md を更新する。

**手順**:

1. `.claude/state/goals/<slug>/meta.json` を Read してステータスを確認
2. **未着手 cycle**なら:
   - 仮説プールから次の仮説候補を 3 件まで提示
   - AskUserQuestion で採用する仮説を選ばせる(複数選択可)
   - 想定効果・コスト・リスクを `improvement-log.md` および改善策カタログから引用して提示
   - 確定したら meta.json の `current_cycle` に `{number: N+1, hypothesis_ids: [...], status: "proposed"}` を追加
3. **proposed 状態**なら:
   - 「PR を作成してデプロイしてください」と促す
   - 作成された PR 番号・コミット hash をユーザーから取得
   - meta.json の `current_cycle.status = "deployed"`、`pr`, `commit_hash`, `deployed_at` を記録
4. **deployed 状態**なら:
   - **デプロイから 4 日以上経過**しているか確認(短期施策は 2 日でも可、後述)
   - `metric-adapters.md` の計測コマンドを表示し「実行しますか?」と確認
   - 計測実行 → 結果 JSON のパスを meta.json に記録
   - `current_cycle.status = "measured"`、`measurement_path`, `measured_at` を記録
5. **measured 状態**なら:
   - **evidence-based-judgment ルール準拠の判定**を実施:
     - 検証コマンドを実行したか
     - 比較対象(before / after / baseline)が明確か
     - NG ワードを使っていないか
   - `reference/cycle-decision-tree.md` を Read して effect 4 値の判定基準を提示
   - AskUserQuestion で effect 判定を確定(full / partial / none / adverse / pending)
   - 判定 = adverse の場合: 「revert PR を作成してください」と促す
   - md(`docs/04_レビュー/goals/<slug>-YYYY-MM-DD.md`)の cycle セクションに append:
     - 仮説 / 想定効果 / 施策(PR) / デプロイ日 / 計測(取得コマンド・ソース) / 判定 / 次サイクル
   - `node .claude/skills/management/goal/scripts/update-cycle.cjs --slug <slug> --cycle N --status judged --effect <effect>` で meta.json 更新
6. **判定完了後の自動判定**:
   - effect/full かつ終了条件達成 → 「`/goal close <slug>` で完了処理しますか?」
   - cycle 数 ≥ max_cycles → 「撤退判定が必要です。`/goal close <slug> timeout`」
   - effect/adverse → 「revert と次サイクル仮説を提案します」(自動で次 cycle proposed 状態作成)
   - その他 → 「次サイクルを開始しますか?(`/goal cycle <slug>`)」

**短期施策の例外(計測待機 4 日のオーバーライド)**:
- PSI のような lab data は **即時計測可**(デプロイ翌日 PSI 自動計測あり)
- GSC のような Google 反映待ち系は **7-14 日待機**が必要
- metric-adapters.md の `min_wait_days` を参照

**出力**(各 step):
- 必ず markdown table で短く(prose は最小限)
- 人間確認は AskUserQuestion で(自動進行禁止、cycle 進行は明示的同意でのみ)

---

### `status [slug]` — 進捗確認

**目的**: goal の進捗を即時把握。

**手順**:

1. `node .claude/skills/management/goal/scripts/status-report.cjs [--slug <slug>]` を実行
2. 出力(markdown table)をそのまま返す

**slug 指定時の出力**:
```markdown
# Goal: <タイトル> (<slug>)

| 項目 | 値 |
|---|---|
| Status | ACTIVE / CLOSED-... |
| Cycle | N / max_cycles |
| 最終 effect | effect/* |
| ベースライン値 | ... |
| 現在値 | ... |
| 改善率 | ±X% |
| 終了条件達成 | Yes / No |
| 残仮説 | N 件 |

## サイクル履歴
| # | 仮説 ID | デプロイ | 計測 | effect |
|---|---|---|---|---|
| 1 | A1+B1 | 2026-05-20 | 2026-05-22 | effect/partial |
```

**slug 省略時**: 進行中 goal 全一覧(table 1 個)

---

### `close <slug> [reason]` — 完了 or 撤退

**目的**: goal をクローズし、学習資産を抽出して /knowledge に移管。

**手順**:

1. meta.json を Read して終了条件達成状況を確認
2. AskUserQuestion で close 種別を確認:
   - `success`(終了条件達成)
   - `abandoned`(人為的中止、理由を input)
   - `timeout`(max_cycles 超過 or 撤退条件発動)
3. md の最後に **「## X. 学習資産」セクション**を append(まだ無ければ):
   - 効いた施策(effect/full or effect/partial の cycle から抽出)
   - 効かなかった施策(effect/none or effect/adverse の cycle から抽出)
   - 教訓(自然言語、3-5 行)
   - 共通原則として残す内容
4. 教訓を `/knowledge` (`.claude/skills/management/knowledge/SKILL.md`) に追記:
   ```markdown
   ---
   ## <goal タイトル> (goal: <slug>)
   **問題**: ...
   **原因**: ...
   **対策**: ...
   ```
5. md のヘッダー `ステータス` を `CLOSED-<種別>` に更新
6. meta.json を `closed`, `closed_at`, `close_reason` で更新

**出力**:
```
✅ Goal クローズ完了: <slug> → CLOSED-<種別>
   学習資産を /knowledge に移管しました。
   md: docs/04_レビュー/goals/<slug>-YYYY-MM-DD.md
```

---

### `list` — 全 goal 一覧

**目的**: 全 goal(進行中 + 完了 + 撤退)を一覧。

**手順**:

1. `.claude/state/goals/*/meta.json` を全 Read
2. status・最終更新日でソートして table 出力:

```markdown
| Slug | Status | Cycle | 最終更新 | タイトル |
|---|---|---|---|---|
| psi-mobile-lcp-2500 | ACTIVE | 2/6 | 2026-05-22 | 全 URL Mobile LCP < 2,500ms |
| gsc-coverage-cleanup | CLOSED-SUCCESS | 3/6 | 2026-04-10 | GSC 未登録 URL 削減 |
```

3. **4 週(28 日)無更新の ACTIVE goal を警告**:
   ```
   ⚠️ 4 週無更新の goal: <slug> (最終: YYYY-MM-DD)
   → `/goal cycle <slug>` で再開 or `/goal close <slug> abandoned` で撤退判定を
   ```

---

## evidence-based-judgment ルールへの準拠

`.claude/rules/evidence-based-judgment.md` に従い、各 cycle の効果判定で以下を必須化:

- [ ] 検証コマンドを実行したか(metric-adapter から)
- [ ] 公式ドキュメント URL を引用したか(仕様主張がある場合)
- [ ] 比較対象(before / after / baseline)が明確か
- [ ] NG ワードを使っていないか(「のはず」「兆候」「浸透待ち」「だろう」「と考えられる」等)
- [ ] 効果が想定の 80% 未満なら、なぜ未達かの仮説と次の検証コマンドを書いたか

このチェック未満なら **effect/full / effect/partial を付けない**。effect/pending のまま保留。

---

## 既存スキル群との役割分担

| スキル | 役割 | /goal との関係 |
|---|---|---|
| `performance-improvement` / 他 improvement 系 | **施策単位**の改善ループ(improvement-log 蓄積) | /goal が呼び出し、施策結果を判定材料に |
| `nsm-experiment` | **NSM 実験**の管理(EXP-NNN 単位) | /goal の cycle と EXP は対応関係あり(将来連携) |
| `weekly-plan` / `weekly-review` | **時系列**の週次運用 | /goal は **課題単位**で独立。週次運用と直交 |
| `knowledge` | **教訓の蓄積** | /goal close 時に教訓を移管 |
| `pre-mortem` | **失敗予測**(事前) | /goal define 時に pre-mortem 実行を提案(任意) |
| `critical-review` | **批判的レビュー** | /goal cycle 中の判定で活用可能 |
| `/loop` | **時間軸ループ実行** | /goal の自動化レベルを上げたいとき将来連携 |

`/goal` は **メタスキル**として既存スキル群を**指揮**するが、計測・施策の実体は既存スキルに委譲する。

---

## 出力契約(Agent 連携時)

`/goal cycle` が内部で Agent ツールを呼ぶときは、prompt の **冒頭**で OUTPUT FORMAT を必ず固定する(`.claude/rules/agent-output-contract.md` 準拠):

```
OUTPUT FORMAT: 1 markdown table or short bullet list (≤ 200 words total).
No prose before/after. No section headers.
If verdict needs justification, add a Reason column with ≤ 8 words.
```

---

## 注意事項

- **過剰自動化禁止**: サイクル進行は必ず人間確認を経る(誤デプロイ・誤判定の回避)
- **二重記録回避**: 施策詳細は improvement-log.md に、サイクル全体は goal md に。両者は施策 ID で参照
- **md は append-only**: 過去 cycle を改変しない(時系列の保全)
- **slug は kebab-case**: `psi-mobile-lcp-2500` のような形式。ファイル名にそのまま入る
- **同時 ACTIVE goal は最大 3 個まで**: 4 個以上の登録時は警告(focus を保つ)
- **4 週(28 日)無更新の ACTIVE goal は warning**: `/goal list` で表示

---

## 参照

- `.claude/rules/evidence-based-judgment.md` — 実証ベース判定ルール
- `.claude/rules/agent-output-contract.md` — Agent 出力契約
- `.claude/skills/management/knowledge/SKILL.md` — 教訓の蓄積
- `.claude/skills/analytics/performance-improvement/reference/improvement-log.md` — PSI 改善履歴(連携例)
- `docs/02_実装計画/archive/goal-skill-design.md` — 本スキルの設計プラン(承認済)
