# /goal スキル設計プラン (2026-05-16)

> ステータス: **レビュー待ち**
> スキル本体: 未作成(本ドキュメント承認後に `.claude/skills/management/goal/SKILL.md` を新規作成)
> 関連規約: `.claude/rules/evidence-based-judgment.md` / `CLAUDE.md` (行動原則・記録先の統一原則)

---

## 1. 課題と目的

### 課題
- 既存の `improvement` 系スキル(performance-improvement / gsc-improvement / ga4-improvement / adsense-improvement / sns-metrics-improvement / cloudflare-cost-improvement)は **施策単位の改善ループ**は持つが、「**特定の課題(goal)が達成されるまで反復追跡する仕組み**」が不在
- 過去 PSI 改善で **EXP-002 ADVERSE → 1 度の失敗で計測サイクルが止まった** ことが課題(他施策が走らないまま放置)
- ユーザーが「PSI 全 URL 閾値クリア」のような goal を立てたとき、複数サイクル(仮説 → 施策 → 計測 → 判定 → 次サイクル)を漏れなく回す**メタ運用枠**が必要

### 目的
- **PSI 改善を駆動ケースに**、課題達成サイクルを統括するメタスキル `/goal` を作る
- **PSI 以外の improvement 系(GSC 改善 / 収益化 / 機能開発の効果検証)にも拡張可能**な抽象を持たせる
- **サイクルごとに人間確認**(誤デプロイ回避)、ただし計測・判定・次提案は自動

---

## 2. ライフサイクル

```
[define] ── goal を構造化して登録
    │
    ▼
[cycle] ── 1 サイクル実行(仮説 → 施策 → デプロイ → 計測 → 判定)
    │
    ├─ effect/full → [close: success]
    ├─ effect/partial → サイクル N+1 へ(同方向の追加施策)
    ├─ effect/none → サイクル N+1 へ(別仮説に転換)
    ├─ effect/adverse → revert + サイクル N+1(根本原因再調査)
    └─ N ≥ max_cycles → [close: timeout]
    │
    ▼
[close] ── 完了 or 撤退、学習資産を /knowledge に移管
```

各サイクルは **1 PR + 1 計測 + 1 判定 = 1 cycle**。人間が「次に進む」「revert」「中断」を判断する。

---

## 3. 引数仕様

```
/goal define <slug>            # 新 goal 定義(対話的)
/goal cycle <slug>             # 次サイクル開始 or 進行中サイクルの計測・判定
/goal status [slug]            # 進捗確認(slug 省略時は進行中 goal 一覧)
/goal close <slug> [reason]    # 終了(完了 or 撤退)
/goal list                     # 全 goal 一覧(進行中 / 完了 / 撤退)
```

引数なしの `/goal` は `status` と同じ動作。

### サブコマンド詳細

#### `define <slug>`
新規 goal を構造化して登録する。以下を AskUserQuestion で対話的に収集:
1. **タイトル**(短文)
2. **連携 metric**(psi / gsc / ga4 / adsense / sns / cost / custom)
3. **終了条件**(必須・定量)— 例: 「Mobile LCP < 2,500ms を全 URL で達成」
4. **撤退条件**— 例: 「6 サイクル経過 or 累計工数 40h で未達なら撤退」
5. **max_cycles**(デフォルト 6)
6. **ベースライン計測コマンド**— 連携 metric から自動補完可

→ `docs/04_レビュー/goals/<slug>-YYYY-MM-DD.md` を作成(初期テンプレ書き込み)。

#### `cycle <slug>`
1. 進行中 goal の最新 cycle を確認
2. **未着手**なら次サイクルの仮説・施策候補を提示(連携スキルの improvement-log を参照)
3. **PR 作成済**ならデプロイ後の計測コマンドを提示(`fetch-psi-audit` 等)
4. **計測済**なら判定(effect/*)を確定し、md に追記
5. **判定が effect/full かつ終了条件達成**→ close を提案

cycle は **人間確認ステップ**を必ず挟む:
- 「次の仮説で進めますか?」(define された候補から or 新規提案)
- 「PR を作成しますか?」
- 「計測結果を確定しますか?」

#### `status [slug]`
goal の進捗をテーブルで表示:
- 現在 cycle 数 / max_cycles
- 直近 effect 判定
- ベースラインからの改善率
- 残課題(ブロッカー / 仮説プール)

slug 省略時は進行中 goal 全一覧。

#### `close <slug> [reason]`
1. 最終ステータスを確定(success / abandoned / timeout)
2. **学習資産抽出**: md から「効いた施策・効かなかった施策・教訓」を抽出
3. `/knowledge` に教訓を追記(成功・失敗いずれも)
4. md に CLOSED ステータスを追記、archive ディレクトリへ移動しない(履歴として残す)

#### `list`
進行中 goal 一覧(直近 cycle、effect 履歴付き) + 完了 goal 一覧。

---

## 4. ファイル構造

### 4.1 スキル本体
```
.claude/skills/management/goal/
├── SKILL.md                              # メイン定義
├── reference/
│   ├── goal-template.md                  # 新規 goal 用テンプレ
│   ├── metric-adapters.md                # 各 metric(psi/gsc/...)の計測コマンド・improvement skill 紐付け表
│   └── cycle-decision-tree.md            # サイクル判定フローチャート
└── scripts/
    ├── create-goal.cjs                   # define 時のテンプレ展開
    ├── update-cycle.cjs                  # cycle の md 更新
    └── status-report.cjs                 # status のテーブル生成
```

### 4.2 Goal 記録ファイル
```
docs/04_レビュー/goals/
├── psi-mobile-lcp-2500-2026-05-16.md      # ← 駆動ケース
├── gsc-coverage-cleanup-YYYY-MM-DD.md     # 将来例
└── ...
```

1 goal = 1 md ファイル(append-only)。ファイル名は `<slug>-<開始日>.md`。

### 4.3 中間データ
```
.claude/state/goals/<slug>/
├── meta.json                              # ステータス・cycle 数等の機械可読版
└── cycle-N-measurement.json               # 計測 raw データ(連携スキルが生成)
```

`docs/04_レビュー/goals/*.md` は人間向け、`.claude/state/goals/*` はスクリプト読み込み用。

### 4.4 既存ファイルとの関係
- **improvement-log.md(各 improvement skill)**: 施策単位の詳細ログを継続。`/goal` から **施策 ID で参照**(二重記録回避)
- **`/knowledge`**: goal close 時に教訓を移管
- **`.claude/state/experiments.json`**: NSM 実験との連携(将来検討。Phase 1 では使わない)

---

## 5. Goal 記録ファイルのテンプレ

```markdown
# Goal: <タイトル> (<開始日>)

> **Slug**: `<slug>`
> **連携 metric**: psi
> **連携 improvement skill**: performance-improvement
> **ステータス**: ACTIVE | CLOSED-SUCCESS | CLOSED-ABANDONED | CLOSED-TIMEOUT
> **開始日 / 最終更新**: YYYY-MM-DD / YYYY-MM-DD

## 1. 定義

### 終了条件(定量・必須)
- 例: 全 19 URL の Mobile LCP < 2,500ms かつ Performance ≥ 80

### 撤退条件
- 例: 6 サイクル経過 or 累計工数 40h で未達

### Max Cycles
6

### ベースライン
- 計測日: 2026-05-09
- 数値: Mobile LCP 平均 10,500ms / Performance 平均 49
- ソース: `.claude/state/metrics/psi/psi-batch-2026-05-09T17-40-53.json`

### 関連 PR / Issue / ドキュメント
- 改善策カタログ: `docs/04_レビュー/performance-report/psi-improvement-strategy-2026-05-16.md`
- improvement-log: `.claude/skills/analytics/performance-improvement/reference/improvement-log.md`

## 2. 仮説プール(define 時に候補列挙、サイクルで pop)

- [ ] A1: Cookie banner SSR 化 [カタログ §3.A.A1]
- [ ] B1: AdSense JS chunk 分離 [カタログ §3.B.B1]
- [ ] B5: AdSense 広告密度削減 [カタログ §3.B.B5]
- [ ] C1: FeaturedRankings を LCP に [カタログ §3.C.C1]
- [ ] E1: Cloudflare Image Resizing 有効化 [カタログ §3.E.E1]
- (定義時に必要な分だけ追加)

## 3. サイクル履歴

### Cycle 1 (YYYY-MM-DD 〜 YYYY-MM-DD)

- **仮説**: A1 + B1 + B5(Cookie banner SSR 化 + AdSense chunk 分離 + 密度削減)
- **想定効果**: 主要 8 URL の Mobile LCP 16,000ms → 4,000ms 以下 [根拠: §3.A.A1 試み 3 で一時 785ms 達成実績]
- **施策**:
  - PR #XXX: Cookie banner SSR 化(コミット <hash>)
  - PR #XXX: AdSense chunk 分離 + 密度削減(コミット <hash>)
- **デプロイ日**: YYYY-MM-DD
- **計測**:
  - 計測日: YYYY-MM-DD
  - 取得コマンド: `node .claude/scripts/psi/fetch-psi-audit.mjs --urls ... --strategy mobile`
  - 結果: Mobile LCP 平均 X,XXXms / Performance 平均 XX
  - ソース: `.claude/state/metrics/psi/psi-batch-YYYY-MM-DDTHH-MM-SS.json`
- **判定**: effect/{full,partial,none,adverse} [根拠: 実測 / 想定 = X%、経過 N 日]
- **次サイクル**: <仮説 ID or 完了 or 撤退>

### Cycle 2 (...)
...

## 4. ステータス
- 進行中 cycle: <番号 or 完了>
- ベースラインからの改善率: -XX%
- 終了条件達成: Yes / No
- 残仮説プール: <未着手の仮説>

## 5. 学習資産(close 時に確定)
- 効いた施策: ...
- 効かなかった施策: ...
- 教訓: ... → `/knowledge` に移管
- 共通原則として残す内容: ...

## 6. ステータスログ
- YYYY-MM-DD: ACTIVE 開始
- YYYY-MM-DD: Cycle 1 開始
- YYYY-MM-DD: Cycle 1 effect/partial 判定、Cycle 2 へ
- YYYY-MM-DD: CLOSED-SUCCESS
```

---

## 6. metric-adapters の構造(拡張性のキモ)

`reference/metric-adapters.md` に各 metric の紐付けを表で持つ:

| metric | 連携 improvement skill | 計測コマンド | improvement-log パス | budget ファイル |
|---|---|---|---|---|
| psi | performance-improvement | `node .claude/scripts/psi/fetch-psi-audit.mjs --urls ... --strategy mobile` | `.claude/skills/analytics/performance-improvement/reference/improvement-log.md` | `.claude/skills/analytics/performance-improvement/budgets.json` |
| gsc | gsc-improvement | `/fetch-gsc-data last28d page snapshot YYYY-Www` | `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md` | (TBD) |
| ga4 | ga4-improvement | `/fetch-ga4-data last28d eventName,pagePath` | `.claude/skills/analytics/ga4-improvement/reference/improvement-log.md` | (TBD) |
| adsense | adsense-improvement | (既存スクリプト) | `.claude/skills/analytics/adsense-improvement/reference/improvement-log.md` | (TBD) |
| sns | sns-metrics-improvement | (既存スクリプト) | `.claude/skills/analytics/sns-metrics-improvement/reference/improvement-log.md` | (TBD) |
| cost | cloudflare-cost-improvement | (既存スクリプト) | `.claude/skills/analytics/cloudflare-cost-improvement/reference/improvement-log.md` | `.claude/skills/analytics/cloudflare-cost-improvement/reference/budgets-daily.json` |
| custom | (任意) | 引数で指定 | 任意 | 任意 |

新 metric の追加は **この表に 1 行追加するだけ**。スキル本体のロジックは変更しない。

---

## 7. evidence-based-judgment ルールへの準拠

`.claude/rules/evidence-based-judgment.md` に従い、各サイクルで以下を必須化:

- [ ] 検証コマンドを実行したか(metric-adapter から)
- [ ] 公式ドキュメント URL を引用したか(仕様主張がある場合)
- [ ] 比較対象(before / after / baseline)が明確か
- [ ] NG ワードを使っていないか(「のはず」「兆候」「浸透待ち」「だろう」等)
- [ ] 効果が想定の 80% 未満なら、なぜ未達かの仮説と次の検証コマンドを書いたか

このチェック未満なら effect/full / effect/partial を付けない(effect/pending のまま保留)。

---

## 8. 出力契約(agent 連携時)

`/goal cycle` が内部でサブエージェント呼び出しを行うとき、agent prompt の冒頭に以下を強制:

```
OUTPUT FORMAT: 1 markdown table or short bullet list (≤ 200 words total).
No prose before/after. No section headers.
If verdict needs justification, add a Reason column with ≤ 8 words.
```

これにより `/goal status` 出力が常に短く、人間が即把握できる粒度になる。

---

## 9. 既存スキル群との役割分担

| スキル | 役割 | /goal との関係 |
|---|---|---|
| `performance-improvement` / 他 improvement 系 | **施策単位**の改善ループ(improvement-log 蓄積) | /goal が呼び出し、施策結果を判定材料に |
| `nsm-experiment` | **NSM(北極星指標)実験**の管理(EXP-NNN 単位) | /goal の cycle と EXP は **1 cycle = 1 EXP** で対応(将来検討) |
| `weekly-plan` / `weekly-review` | **時系列**の週次運用 | /goal は **課題単位**で独立。週次運用と直交 |
| `knowledge` | **教訓の蓄積** | /goal close 時に教訓を移管 |
| `pre-mortem` | **失敗予測**(事前) | /goal define 時に pre-mortem を実行する選択肢を提供(任意) |
| `critical-review` | **批判的レビュー** | /goal cycle 中の判定で活用可能 |
| `/loop` | **時間軸ループ実行** | /goal の自動化レベルを上げたいとき将来連携(Phase 2 以降) |

`/goal` は **メタスキル**として既存スキル群を**指揮**するが、計測・施策の実体は既存スキルに委譲する(車輪の再発明禁止)。

---

## 10. 駆動ケース: PSI Mobile LCP 改善 Goal

本スキル完成後、最初に走らせる goal:

```
slug: psi-mobile-lcp-2500
title: 全 URL Mobile LCP < 2,500ms 達成
metric: psi
連携 skill: performance-improvement
終了条件: 全 19 URL で Mobile LCP < 2,500ms かつ Performance ≥ 80
撤退条件: 6 cycles or 累計 40h
max_cycles: 6
ベースライン: Mobile LCP 平均 10,500ms / Performance 平均 49 (2026-05-09)
仮説プール: docs/04_レビュー/performance-report/psi-improvement-strategy-2026-05-16.md の Phase 1-3 を順次投入
```

→ 本スキルが完成したら、即 `/goal define psi-mobile-lcp-2500` で起動する。

---

## 11. 実装手順(本プラン承認後)

1. **`.claude/skills/management/goal/SKILL.md` 作成**(メイン定義)
   - 5 サブコマンド(define / cycle / status / close / list)の手順を記述
   - 各サブコマンドが何を Read/Write するか明示
   - evidence-based-judgment ルールへの参照を必須化

2. **`.claude/skills/management/goal/reference/` 作成**
   - `goal-template.md`(新規 goal 用テンプレ。本プラン §5 の内容)
   - `metric-adapters.md`(本プラン §6 の表)
   - `cycle-decision-tree.md`(effect 判定からの分岐)

3. **`.claude/skills/management/goal/scripts/` 作成**(必要最小限)
   - `create-goal.cjs`: define 時のテンプレ展開・slug 重複チェック
   - `update-cycle.cjs`: cycle の md 更新(append-only)
   - `status-report.cjs`: status のテーブル生成

4. **`docs/04_レビュー/goals/` ディレクトリ作成**(初回 goal 作成時)

5. **`CLAUDE.md` の「ドキュメント参照ガイド」に 1 行追記**
   - `| 課題達成サイクル(/goal) | docs/04_レビュー/goals/<slug>-YYYY-MM-DD.md |`

6. **動作確認**
   - `/goal define psi-mobile-lcp-2500` で駆動ケースを登録
   - `/goal status` で進捗確認
   - `/goal cycle psi-mobile-lcp-2500` でサイクル 1 を提案させる(実装・PR 作成までは別タスク)

---

## 12. リスクと回避策

| リスク | 影響 | 回避策 |
|---|---|---|
| 既存 improvement-log との二重記録 | 情報乖離 | goal md は **施策 ID で improvement-log を参照**、詳細は重複させない |
| サブコマンドの認知負荷 | 使われなくなる | `/goal` 引数なしを `status` 動作にしてエントリポイント簡略化 |
| metric-adapter の保守 | 各 improvement skill 改修で broken | metric-adapter を改善 skill 内 reference にもコピー、両方読む |
| 自動化レベル上げの誤デプロイ | 本番障害 | Phase 1 はサイクルごと人間確認、`/loop` 連携は Phase 2 以降 |
| 完了せず放置される goal | 残骸 | `/goal list` で **N 日無更新の goal を警告表示**、4 週無更新で auto-timeout |

---

## 13. レビューポイント(ユーザー確認事項)

以下を確認したい:

1. **ファイル構造**: `docs/04_レビュー/goals/` で OK か(別の場所が好みなら変更)
2. **サブコマンド構成**: 5 個(define / cycle / status / close / list)で OK か。簡略化 / 拡張の希望
3. **metric の網羅**: psi / gsc / ga4 / adsense / sns / cost / custom の 7 種で OK か
4. **テンプレ詳細度**: §5 の goal 記録ファイルテンプレの粒度(項目数・記入負荷)が適切か
5. **自動化レベル**: 「サイクルごとに人間確認」で OK(再確認)。将来 `/loop` 連携の方針
6. **スキル本体の置き場所**: `.claude/skills/management/goal/` で OK か(`/management/` 配下)
7. **スクリプト不要論**: scripts/ 3 個は必要か、SKILL.md 内で完結させたいか
8. **駆動ケース**: PSI 改善 goal を最初に走らせる方針で OK か(本プラン承認直後)

---

## 14. 次のステップ

本プラン承認後:
1. レビューフィードバック反映
2. SKILL.md 本体 + reference/ + scripts/ 作成
3. CLAUDE.md 更新
4. 動作確認(PSI goal 登録 → status 確認)
5. PSI 改善 Phase 1(A1 + B1 + B5)を Cycle 1 として実 PR 作成へ
