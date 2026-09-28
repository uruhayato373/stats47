---
title: 今週の計画
type: weekly-plan
week: 2026-W40
date: 2026-09-28
updated: 2026-09-28
status: active
tags: []
---

# 2026-W40 今週の計画

期間: 2026-09-28（月）〜 2026-10-04（日）。9月計画（W37〜W40）の最終週で、月次の配分は「集約」。
W39 まで Must は3週連続で未達だった。今週はバックログ 🔴 の上から2枚だけを Must に入れる。前週に残った Must は分割するか Should へ降格する。

## 週

- **ISO Week**: 2026-W40
- **期間**: 2026-09-28 〜 2026-10-04
- **Sprint**: 2026-09月次計画（W37〜W40）の Week 4/4。10-01 以降は 10 月計画を作る

## 前週の申し送り

W39 レビュー（`.claude/skills/management/weekly-review/reference/reviews/2026-W39.md`）の「来週への申し送り」から。

| W39申し送り | W40での扱い |
|---|---|
| 1. 計測ゲートの failure（A8 突合超過） | **Must 2**（`A8-CROSSCHECK-EXCEED-01`、🔴 2番目） |
| 2. `AFF-IMPRESSION-ROUTING-01` の T14d 比較 | **Should 1 [分割]**。比較の記録だけに絞る（収益導線レーンで重点外のため Must にしない） |
| 3. `COVERAGE-LOOP-01` first wave | **Should 4 [分割]**。20件を5件へ縮め、Must から外す |
| 4. ブログ是正キュー | **Should 3**。月次計画どおり1本だけ |
| 5. search-growth approved 1件 | **Could 2** |
| 6. CTR 低下の page×query 分解 | **Could 1** |
| 7. 重点レーン「計測の鮮度」に施策が0件 | **Should 2** |
| 8. note カード監査の Windows 起動失敗 | **起動は修正済み**（09-28、node 直起動へ）。この Windows PC では記事の取得が 286/286 件失敗し（プロキシ経由でも同じ）、全量再監査は Mac か CI で行う（`NOTE-CARD-REPAIR-01`） |
| 9. KDP の販売数/KENP 記録 | **Could 3** |
| 10. `EXP-006` | オーナー作業のまま |
| 11. SNS 予約補充と「再予約しない」の整合 | オーナー作業（10 月計画で決める） |

## 今月の重点（月次計画より）

- **重点テーマ**: 溜まった未デプロイを本番へ届けて止まっている実測を再開する / 公開しているものが正しいかを確定させる（→ `monthly.md`）
- **重点レーン**: 計測 / データ品質
- **今週この重点で進めること**:
  - 計測: アフィリエイト計測ゲートを塞ぐ A8 突合超過の原因を特定する（Must 2）。T14d 窓の比較を記録する（Should 1、重点外）
  - データ品質: データ品質キューの処置を週5指標で回し始める（Must 1）

## 前週の振り返り（W39）

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| アフィリエイト計測経路を本番実走で閉じる | Must | 未達 | 取得・R2・履歴は success。計測ゲートが `a8-cross-check-exceeded` で failure（Issue #1007） |
| GSC coverage first wave 20件の分類 | Must | 未達 | 分類記録 1 件のみ。pending 1,106 → 1,251 |
| ブログ品質是正3本 | Must | 未達 | 3本とも pending、W39 の是正 0 件 |
| 承認済み search-growth 1件の終端 | Should | 未達 | approved のまま |
| target 欠落7件の終了・再計測 | Should | 未達 | 7件とも `effect/pending` |
| X 期限超過 scheduled の分類 | Should | 一部 | 毎晩照合の仕組みを追加。27 → 14 件 |
| KDP S1 置換の read-back | Could | 完了 | S1 12/12 live |
| 住民基本台帳データの適合性調査 | Could | 未達 | 着手なし |

**パターン分析**: 計画外の commit は 431 件あったが、Must は3週連続で0件。🔴 上位と Must が重ならず、
Must 1 の完了を塞いでいた `A8-CROSSCHECK-EXCEED-01` が Must に入っていなかった。今週は 🔴 の上から取る。

## 現状サマリー

| 指標 | W39確定値 | 比較・目標 |
|---|---:|---|
| GA4 engagedSessions（Japan-only確定7日） | 2,931 | 前週 3,347、-12.4% |
| GSC clicks（確定7日） | 2,610 | 前週 2,958、-11.8% |
| GSC impressions（確定7日） | 85,159 | 前週 77,443、+10.0% |
| GSC CTR | 3.06% | 前週 3.82%、-0.76pp |
| 週次収益（NSM） | ASP 発生・確定 0 件 | 商品売上は判定不能 |
| ブログ是正 | done 18 / pending 358 | must-fix 50 |
| データ品質ゲート通過率 | 99.5%（2,408/2,420） | 処置待ち: 更新 1,072 / 調査終了候補 126 / noindex 候補 189 |
| 計測の鮮度 | 12/13 | note が report_incomplete |
| SNS W39 投稿 | X 7 / Instagram 4 / Threads 8 | — |
| GSC運用サイクル | **WARN（FAIL 0）** | 既知の target 欠落7件のみ |
| KDP公開ゲート | **measure** | S1 live 12/12、販売数/KENP 未記録 |

KPI は W39 snapshot の `finalized7d` と重複しない `previous7d` だけで比べる。rolling 28日は候補発見専用。

## トレンド機会

| トレンド | ソース | stats47 データ | アクション |
|---|---|---|---|
| はてなブックマーク Hot Entry（09-28 取得） | はてな | 都道府県・統計・地域の話題なし | なし |
| Google News「都道府県 統計」 | Google News RSS | 取得 0 件 | なし。必要なら `/discover-trends --source all` |

月次計画は新規記事の大量公開を止めているので、今週はトレンド連動の記事を作らない。

## 前週からの持ち越し

- [ ] **`AFF-MEASURE-RECOVER-01` の計測ゲート** — 元 W39 Must 1。Must 2 の完了で閉じる
- [ ] **`AFF-IMPRESSION-ROUTING-01` T14d** — 元 W39 Must 1 の一部。Should 1 [分割]
- [ ] **GSC coverage first wave の分類** — 元 W39 Must 2。Should 4 [分割]
- [ ] **ブログ是正** — 元 W39 Must 3。Should 3（1本）
- [ ] **search-growth `soft-404-risk::/ranking/barber-beautician-annual-income` の終端** — 元 W39 Should 1。Could 2
- [ ] **target 欠落7件** — 元 W39 Should 2。オーナー判断待ち（下記）
- [ ] **X 期限超過 scheduled 14件** — 元 W39 Should 3。毎晩照合の結果を待つ（今週は計画に入れない）

## 改善ログ pending（今週着手対象）

| Tier | Metric | ID | Status | Due | Owner |
|---|---|---|---|---|---|
| 1 | affiliate | AFF-IMPRESSION-ROUTING-01 | in-progress | 2026-09-27 | claude |
| 1 | data-quality | DATA-ESTAT-FETCH-01 | pending | 2026-10-05 | claude（`DATA-QUALITY-LOOP-01` へ引き継ぎ） |
| 1 | data-quality | DATA-MANUAL-RESTORE-01 | pending | 2026-10-05 | claude（同上） |
| 2 | gsc | SEARCH-GROWTH-CYCLE-01 | pending | 2026-09-21超過 | gsc-analyst |

## 今週のタスク

### Must（絶対達成、2件）

- [ ] **データ品質キューの処置を5指標回す** [M] — `DATA-QUALITY-LOOP-01`（🔴 1番目・データ品質レーン・KPI `data-quality-gate`）。
  `.claude/state/data/data-quality/LATEST.md` の「2 更新」から GSC 表示の多い順に5指標を取り、各指標で公式の最新公表を一次資料で確かめてから、
  判断基準 1〜4 のどれかに決める（2〜4 は配信年からの推定なので、確認前に処置しない）。5指標すべてに処置と根拠が記録され、
  更新するものは config 変更まで済んでいれば完了。R2 反映はオーナー承認で別に行う。使用: `/inspect-estat-meta`、data-ingester
- [ ] **A8 突合超過の原因を特定する** [S] — `A8-CROSSCHECK-EXCEED-01`（🔴 2番目・計測レーン・不具合）。
  A8 の「サイト別 × プログラム別」明細で stats47 サイト行の案件別クリックを取り、専用 157 のうちサイト別 155 に入っていない案件を特定する。
  検証コマンドが `a8-cross-check-exceeded` を出さなくなるか、差 2 クリック（1.3%）の原因が取れない理由を記録して許容差の判断をオーナーへ渡した時点で完了。
  共用案件の振り分けは推測で決めない。これで Issue #1007 と `AFF-MEASURE-RECOVER-01` の計測ゲートが閉じられる状態になる。使用: `/affiliate-improvement`

### Should（できればやる、4件）

- [ ] **[分割] T14d 窓の比較を記録する** [S] — `AFF-IMPRESSION-ROUTING-01`（収益導線レーン・KPI `affiliate-yield`。今月の重点レーン外のため Should）。
  W39 の Must から分割して降格し、比較の記録だけに絞る。09-13 14:02 JST のデプロイ境界に対し、重複しない確定7日（before / after）を
  期間・cohort・placement を明示して並べ、imp/PV・CTR を記録する。条件（標本・交絡）が揃わなければ保留理由と次の判定日を書いて完了とする。
  効果ありとは書かない（`evidence-based-judgment.md`）。使用: `/affiliate-improvement`
- [ ] **重点レーン「計測の鮮度」の施策を起票する** [S] — `AUTHENTICATED-MEASUREMENT-ACTIVATION-01` の残り1源（note の report_incomplete）を
  直す施策を、`[kpi: measurement-freshness]` と根拠のある `[target:]` 付きで improvement-triage に起票させる。active 施策は 25 件で上限 10 件を超えているため（DG080）、期日超過の施策を1件以上判定・backlog 降格して純増させない。
  重点レーンの KPI に施策が 0 件の状態が解消されれば完了。根拠のある target が書けなければ、書けない理由を記録する。
- [ ] **ブログ是正1本** [M] — 是正キューの次の1本 `konbu-consumption-prefecture-gap`（must-fix、GSC 1,101 imp / 99 click、
  blocker 2 件: 内部リンク不足・である調の文末）。月次計画どおり1本だけ。決定的 audit・factual check・blog-critic PASS・公開 read-back で done。
  使用: `/brushup-blog --target queue --next 1`
- [ ] **[分割] GSC coverage first wave を5件分類する** [S] — `COVERAGE-LOOP-01`。W39 の20件を5件に縮める。
  sitemap 掲載・内部リンク・canonical・現在の HTTP を確かめ、観測を続ける URL と実装修正が要る URL を理由付きで記録する。使用: `/gsc-coverage-remediation`

### Could（余力があれば、3件）

- [ ] **CTR 低下を page×query で分解する** [S] — `SEARCH-GROWTH-CYCLE-01`。確定7日で表示 +10.0%・クリック -11.8% だった。
  前週と重ならない確定7日の page×query を比べ、表示が増えて CTR が低い上位を特定する。title の一括変更はしない。owner は gsc-analyst。
- [ ] **承認済み search-growth 1件を終端する** [S] — `soft-404-risk::/ranking/barber-beautician-annual-income`。3週続けて approved のまま。
  R2 観測年数・データ点数・描画を実測し、補強 / noindex / dismiss を記録するか、WIP から外す。使用: `/search-growth`
- [ ] **KDP S1 の販売数/KENP を記録する** [S] — `.claude/state/products/kdp-weekly-publication.json` の nextAction。
  認証付き計測の kdp は pass なので、KDP レポートを `products:sales` へ証拠付きで記録し、4週窓の開始日を置く。新規パイロットは公開しない。使用: `/kdp-publish`

## オーナー作業

- **`AUTHENTICATED-MEASUREMENT-ACTIVATION-01`**: note ダッシュボードの取得が report_incomplete。再ログインか取得範囲の判断をしてほしい。
- **`GSC-COVERAGE-DEPLOY-01`**: カバレッジ是正と入力鮮度ガードの本番反映の承認。
- **`CF-CPU-SURGE-01`**: 次の手順として、route 別 CPU 時間を Cloudflare Dashboard の Workers Observability で確認してほしい。
- **`EXP-006`**: YouTube Studio のチャンネル所有確認と、動画の手動公開の可否。
- **target 欠落7件（BLOG-WAVE）**: 「終了」か「事前 target を定義して新規計測」かを選んでほしい。推測では補わない。
- **SNS 予約**: 10-31 まで補充された予約と、9 月計画の「再予約しない」のどちらを 10 月計画で採るか。

## KDP公開ゲート

- **判定**: `measure`（`.claude/state/products/kdp-weekly-publication.json`、2026-W39 で再生成）
- **候補**: なし
- **需要証拠**: 販売数/KENP は未記録（K-S1-01〜12）。0 需要ではない
- **停止条件**: 販売数/KENP が `products:sales` に記録され、4週窓が閉じるまで新規公開しない
- **承認境界**: この計画への記載は公開承認ではない。対象 ID の明示承認と `--commit` が別途必要

## NSM実験

- active は `EXP-006` 1件。動画 0 本・owner action 2件のため measure しない。
- 新規実験は提案・開始しない。計測ゲートが閉じ、EXP-006 の owner action が決まるまで active を増やさない。

## 批判的レビュー

> **技術的に楽しいだけでは？** Must 2件は、データ品質の処置と計測ゲートの原因特定で、新しい機能は作らない。
> どちらも重点レーン（データ品質・計測）の KPI にぶら下がる。重点外の T14d 記録は Should に置いた。

> **先週と同じ失敗を繰り返していないか？** W39 の Must 3件は同じ形で再掲しない。T14d は比較の記録だけに分割して Should へ降格し、
> coverage とブログ是正は Should へ降格して件数を縮めた。🔴 上位を Must に入れ、Must 1 の完了を塞いでいた A8 突合超過を直接扱う。

> **今週でなければ意味がないことは？** A8 突合超過は `A8-CROSSCHECK-EXCEED-01` の期日が 10-05。T14d 窓は 09-27 で閉じたので、
> 記録が遅れるほど比較期間が別施策と重なる。9 月の最終週なので、10 月計画の入力もこの週に作る。

## 関連ドキュメント・施策

- 前週レビュー: `.claude/skills/management/weekly-review/reference/reviews/2026-W39.md`
- 週次snapshot: `.claude/skills/management/nsm-experiment/reference/weekly-snapshots/2026-W39.json`
- 月次計画: `.claude/todo/monthly.md`
- backlog: `DATA-QUALITY-LOOP-01` / `A8-CROSSCHECK-EXCEED-01` / `CF-CPU-SURGE-01` / `AUTHENTICATED-MEASUREMENT-ACTIVATION-01` / `GSC-COVERAGE-DEPLOY-01`
- 改善施策: `AFF-IMPRESSION-ROUTING-01` / `AFF-MEASURE-RECOVER-01` / `SEARCH-GROWTH-CYCLE-01`
- データ品質キュー: `.claude/state/data/data-quality/LATEST.md`
- KDP state: `.claude/state/products/kdp-weekly-publication.json`

## 次週への申し送り候補

- A8 突合超過が許容差の判断に回った場合、オーナーの判断結果で計測ゲートの閾値を決める
- データ品質の処置で「更新」と決めた指標の R2 反映をまとめて1回で承認してもらう
- 10 月計画で、Must を 🔴 の上から取る運用が1週で機能したかを確かめる
- 10-01 以降の `/monthly-plan` の入力として、9 月の重点ゴール（`monthly.md` 重点1・2）の達成・未達を証拠付きで並べる
