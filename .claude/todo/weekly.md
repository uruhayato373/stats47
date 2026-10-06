---
title: 今週の計画
type: weekly-plan
week: 2026-W41
date: 2026-10-05
updated: 2026-10-05
status: active
tags: []
---

# 2026-W41 今週の計画

期間: 2026-10-05（月）〜 2026-10-11（日）。10 月計画（W41〜W44）の Week 1/4。
W40 は 🔴 の上から 2 枚を Must に入れて Must 2/2 を達成し、W37〜W39 の連続未達が止まった。今週も同じ形を続け、
10 月の重点 2 領域 (管理・データ) から各 1 件だけを Must にする。Must の総量は増やさない。

## 週

- **ISO Week**: 2026-W41
- **期間**: 2026-10-05 〜 2026-10-11
- **Sprint**: 2026-10 月次計画（W41〜W44）の Week 1/4

## 前週の申し送り

W40 レビュー（`.claude/skills/management/weekly-review/reference/reviews/2026-W40.md`）の「来週への申し送り」から。

| W40申し送り | 振り分け | W41での扱い |
|---|---|---|
| 1. データ品質キューの第 2 週 5 指標 | `DATA-QUALITY-LOOP-01` | **Must 1** |
| 2. A8 成果ゲートの shortfall / month-missing | `A8-CROSSCHECK-EXCEED-01` | **Must 2** |
| 3. 無人 triage の失敗 | #1068 | **Should 1**（10-12 の週次 run 前に直す） |
| 4. `measurement-freshness` の施策 0 件 | `AUTH-CREDENTIAL-REGISTER-01` | オーナー作業（再認証）+ **Should 2**（施策起票） |
| 5. 計測 workflow の main マージ | `STATE-OVERLAY-MAIN-01` | オーナー作業（10-11 の週次 run 前） |
| 6. BLOG-WAVE 7 件の終端 | `EFFECT-TARGET-MARKERS-01` | **Should 3**（月次計画では W42 Must。今週は判断材料の整理まで） |
| 7. ブログ是正を 10 月計画から外す | `BLOG-REMEDIATION-PROOF-01` | 見送り（サイト領域は維持。11 月に再判断） |
| 8. CTR 分解の優先度を下げる | `GSC-CTR-DECOMPOSE-01` | 見送り（W40 確定7日で CTR 3.60% に回復。月次計画の W42 Should） |
| 9. search-growth 承認済み 1 件の終端 | 定常 | **Could 1** |
| 10. KDP S1 の販売数/KENP | `KDP-EXPANSION-01` | 見送り（KDP 再認証の後。今週はオーナー作業に含める） |
| 11. モデル使用量の effort 提案 4 件 | `MODEL-OPT-APPLY-01` | **Could 2** |
| 12. ページ UI の agent 指摘 11 件 | 見送り | 見送り（サイト維持。不具合だけ既存 UI-FIX カードで扱う） |
| 13. note カード表示監査 | `NOTE-CARD-REPAIR-01` | 見送り（商品領域は 10 月の重点外。Mac か CI で回すまで判定不能のまま） |

## 今月の重点（月次計画より）

- **重点テーマ**: 週次収益 (NSM) を内訳つきで数字で言える状態にする / 公開している指標の誤り・古さを週 5 指標ずつ処置し、処置の流れを 4 週続ける（→ `monthly.md`）
- **重点領域**: 管理 / データ
- **今週この重点で進めること**:
  - 管理: A8 成果ゲートの残りの blocked 理由を片付けて `A8-CROSSCHECK-EXCEED-01` を閉じる (Must 2)。無人 triage の失敗を直す (Should 1)
  - データ: データ品質キューの第 2 週 5 指標 (Must 1)

## 前週の振り返り（W40）

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| データ品質キューの処置を5指標回す | Must | 完了 | 3 指標の years 拡張と R2 反映、1 件誤検出、1 件を `DATA-WAGE-TABLE-YEARS-01` へ切り出し |
| A8 突合超過の原因を特定する | Must | 完了 | 明細が A8 に無いことを確認し、許容差をオーナー判断で導入。`a8-cross-check-exceeded` は解消 |
| T14d 窓の比較を記録する | Should | 完了 | 境界不成立と交絡で判定不能として保留 |
| 重点レーン「計測の鮮度」の施策を起票する | Should | 未達 | 施策 0 件のまま |
| ブログ是正1本 | Should | 未達 | `konbu-consumption-prefecture-gap` は pending。6 週 0 本 |
| GSC coverage first wave を5件分類する | Should | 未達 | 分類の記録なし |
| CTR 低下を page×query で分解する | Could | 未達 | W40 で CTR 3.60% に回復 |
| 承認済み search-growth 1件を終端する | Could | 未達 | 6 週 approved のまま |
| KDP S1 の販売数/KENP を記録する | Could | 未達 | KDP が `auth_required` |

**パターン分析**: Must は 🔴 の上から取ると達成できた。Should・Could に降格した項目は 1/7 しか動かず、降格が実質「今月やらない」になっている。
今週は Should を重点 2 領域に関係するものだけに絞り、重点外の降格項目は「見送り」と明示した。

## 現状サマリー

| 指標 | 現在値 | 比較・目標 |
|---|---:|---|
| GSC clicks（確定7日 09-25〜10-01） | 3,074 | 前週 2,610、+17.8% |
| GSC CTR（確定7日） | 3.60% | 前週 3.06% |
| GA4 engagedSessions（Japan-only 確定7日 09-27〜10-03） | 4,021 | 前週 2,924、+37.5% |
| 週次収益（NSM） | 判定不能 | ASP 4 源とココナラは ¥0、KDP・note が判定不能 |
| ★ 計測の鮮度 | 7/14 (degraded) | 月末 12/14 以上（月次ゴール） |
| ★ データ品質ゲート通過率 | 100.0%（2,423/2,423） | 維持 |
| データ品質キュー | 更新 1,079 / 調査終了候補 126 / noindex 候補 173 | 4 週続けて「処置 ≥ 新規検出」 |
| active 施策 / 上限 | 9 / 10 | `[target:]` なし 7 件 |
| バックログ 🔴 / 上限 | 10 / 10 | 30 日超の未着手 0 |
| GSC運用サイクル | WARN（FAIL 0、review 段） | 既知の target 欠落 7 件のみ |
| KDP公開ゲート | measure | 販売数/KENP 未計測。新規公開なし |

KPI は確定7日と重複しない前週だけで比べる。rolling 28日（clicks 11,023）は候補発見専用。

## トレンド機会

| トレンド | ソース | stats47 データ | アクション |
|---|---|---|---|
| 高額給与所得者の都道府県ランキング（国税庁統計年報） | Google News（10-05 取得） | 所得系ランキングあり（該当 key は未確認） | なし。サイト領域は維持で、今週は記事化しない |
| 都道府県別の物価水準 | Google News | 物価系ランキングあり（該当 key は未確認） | なし（同上） |
| 日照時間が長い都道府県 | Google News | `annual-sunshine-duration`（W40 に過去年を拡張済み） | なし。データ品質の処置済み指標なので、流入は既存ページで受ける |
| はてなブックマーク Hot Entry | はてな | 都道府県・統計の話題なし | なし |

## 前週からの持ち越し

- [x] **重点 KPI `measurement-freshness` の施策起票** — 元 W40 Should 2。Should 2 に再掲
- [ ] **ブログ是正1本** — 元 W40 Should 3。見送り（`BLOG-REMEDIATION-PROOF-01`、11 月に再判断）
- [ ] **GSC coverage first wave の分類** — 元 W40 Should 4。見送り（サイト維持。`GSC-COVERAGE-DEPLOY-01` のオーナー export 待ち）
- [ ] **CTR 分解** — 元 W40 Could 1。見送り（`GSC-CTR-DECOMPOSE-01`、W42 Should）
- [x] **search-growth 承認済み 1 件の終端** — 元 W40 Could 2。Could 1 に再掲
- [ ] **KDP S1 の販売数/KENP** — 元 W40 Could 3。見送り（KDP 再認証待ち）

## 改善ログ pending（今週着手対象）

| Tier | Metric | ID | Status | Due | Owner |
|---|---|---|---|---|---|
| 1 | affiliate | AFF-RESOLUTION-EFFECT-01 | pending | 2026-10-08 | claude（維持領域の効果判定。Should 4） |
| 2 | ga4/gsc/theme-quality | THEME-EXPANSION-EFFECT-01 | effect/pending | 2026-10-09 | theme-portfolio-manager（d28 暫定判定。定常） |
| 1 | performance | PERF-WORKER-P99-01 | pending | 2026-10-12 | uruhayato373（オーナー作業） |
| 1 | cloudflare-cost | R2-STORAGE-01 | pending | 2026-10-12 | uruhayato373（オーナー作業） |

## 今週のタスク

### Must（絶対達成、2件）

- [x] **データ品質キューの第 2 週 5 指標を処置する** [M] — `DATA-QUALITY-LOOP-01`（🔴 3 番目・データ領域・KPI `data-quality-pass-rate`）。
  `.claude/state/data/data-quality/LATEST.md` の「2 更新」で、W40 に処置した 5 指標を除いた GSC 表示の多い順から 5 指標を取る
  (`average-height-primary-school-fifth-grade-male` から)。各指標で公式の最新公表を一次資料で確かめてから基準 1〜4 のどれかに決める。
  5 指標すべてに処置と根拠が backlog カードに記録され、更新するものは config 変更と data-refresh の dryRun まで済んでいれば完了。
  R2 反映はオーナー承認で別に行う。使用: `/inspect-estat-meta`、data-ingester
- [x] **A8 成果ゲートの残りの blocked 理由を片付けて `A8-CROSSCHECK-EXCEED-01` を閉じる** [S] — `A8-CROSSCHECK-EXCEED-01`（🔴 2 番目・管理領域・不具合・KPI `measurement-freshness`）。
  10-05 の `node .claude/scripts/ads/check-a8-outcome-gate.mjs` は `a8-cross-check-exceeded` を出さなくなったが、`a8-cross-check-shortfall`
  (10 月のサイト別 57 クリックに対し案件別明細 0) と `a8-results-month-missing`（202610）で blocked。10 月の案件別明細が取り込まれた後に
  検証コマンドを再実行し、exceeded と shortfall が出なければ原因 (取得時刻のずれ・共用漏れの両仮説の棄却と許容差の導入) をカードに書いて
  backlog-loop の gate 経由で閉じる。明細が取り込まれない場合は、取り込みが止まっている段 (収集・正規化) を記録した時点で完了。使用: `/affiliate-improvement`

### Should（できればやる、4件）

- [x] **無人 triage の失敗の原因を確定して直す** [S] — #1068（管理領域）。run 37245377864 のログで、失敗が docs:check か push かを確定し、
  permission 拒否 5 件が原因に関わるかを確かめる。10-12 の週次 run 前に修正がコミットされていれば完了。直せない場合は原因と次の手を Issue に書く。
- [x] **重点 KPI `measurement-freshness` を動かす施策を 1 件起票する** [S] — `AUTHENTICATED-MEASUREMENT-ACTIVATION-01`（管理領域）。
  KDP・ココナラの `auth_required` 解消後に 14 源中の pass 数がいくつになるかを根拠に `[target:]` を書き、improvement-triage に起票させる。
  active は 9 件で上限 10 件の内側。根拠のある target が書けなければ書けない理由を記録して完了。
- [x] **BLOG-WAVE 7 件の終端の判断材料を整理する** [S] — `EFFECT-TARGET-MARKERS-01`（🔴 6 番目・管理領域）。7 件それぞれの before imp・
  経過日数・ガードを `verdicts-2026-W40.json` から表にし、「終了」と「事前 target つき再計測」の選択肢をオーナーに提示する。判断は W42 Must。
- [x] **`AFF-RESOLUTION-EFFECT-01` の 4 週判定** [S] — `AFF-RESOLUTION-EFFECT-01`（アフィリエイト領域・維持。効果判定は維持で許される）。
  Due 10-08。`node .claude/scripts/ads/fetch-affiliate-ga4.cjs 28` を vertical 別・position 別に読み、[target: furusato imp +20,000/28日、全体 CTR ≥ 0.10%] と比べる。
  `AFF-IMPRESSION-ROUTING-01` と窓が重なるので guard: confounded を記録し、条件が揃わなければ effect/pending の保留理由と次の判定日を書く。使用: `/affiliate-improvement`

### Could（余力があれば、2件）

- [x] **承認済み search-growth 1件を終端する** [S] — `soft-404-risk::/ranking/barber-beautician-annual-income`（定常の候補審査）。
  R2 の観測年数・データ点数・描画を実測し、補強 / noindex / dismiss を記録するか WIP から外す。W41 の search-growth 判断 (最低 1 件) をこれで満たす。使用: `/search-growth`
- [ ] **effort 提案 4 件の採否を決める** [S] — `MODEL-OPT-APPLY-01`（管理領域）。`.claude/state/metrics/model-usage/latest.json` の canary pass を確かめ、
  frontmatter の effort を変えるかを agent ごとに決める。変える場合は canary の結果ファイルを根拠に書く。

## オーナー作業

- **`STATE-OVERLAY-MAIN-01`**: 計測 workflow の修正を含む develop→main を、10-11（日）20:00 JST の週次 run より前にマージしてほしい。
- **`AUTH-CREDENTIAL-REGISTER-01`**: KDP とココナラの再認証（両方とも `auth_required` で再接続停止中）。
- **`AUTHENTICATED-MEASUREMENT-ACTIVATION-01`**: 再認証後に `npm run measurement:status -- --check` が通るか確認してほしい。
- **`PERF-WORKER-P99-01`**: Workers Observability で route 別 CPU の内訳を確認してほしい（Due 10-12）。
- **`R2-STORAGE-01`**: doboku-note-archive 8.98 GB の保持方針（許容か削減か）を決めてほしい（Due 10-12）。
- **`EXP-006`**: YouTube Studio のチャンネル所有確認。済むまで制作と計測日を進めない。

## KDP公開ゲート

- **判定**: `measure`（`.claude/state/products/kdp-weekly-publication.json`、2026-W40 で再生成）
- **候補**: なし
- **需要証拠**: 販売数/KENP は K-S1-01〜12 すべて未計測。0 需要ではない
- **停止条件**: KDP の再認証と販売数/KENP の記録が済むまで新規公開しない
- **承認境界**: この計画への記載は公開承認ではない。対象 ID の明示承認と `--commit` が別途必要

## NSM実験

- active は `EXP-006` 1 件（running・オーナー作業 2 件待ち）。measure しない。
- `/nsm-experiment propose` は今週は実行していない。10 月の月次計画が新規実験を重点外としているため、候補を出しても採用しない。

## 批判的レビュー

> **技術的に楽しいだけでは？** Must 2 件は、データ品質の処置と計測ゲートの閉鎖で、新しい機能は作らない。
> どちらも月次の重点 KPI (`data-quality-pass-rate`・`measurement-freshness`) にぶら下がる。effort 提案は Could に置いた。

> **先週と同じ失敗を繰り返していないか？** W40 の Must は両方完了したので、連続未達による再掲制限 (DG082) は当たらない。
> 一方で Should の降格項目は 1/7 しか動かなかった。今週は重点外の降格項目 (ブログ是正・coverage 分類・CTR 分解・KDP 記録) を
> 見送りと明示し、Should を重点 2 領域と期日付きの効果判定 1 件に絞った。

> **今週でなければ意味がないことは？** `STATE-OVERLAY-MAIN-01` のマージは 10-11 の週次 run より前でないと、戻した state が再び消える。
> #1068 の修正も 10-12 の無人 triage より前に要る。`AFF-RESOLUTION-EFFECT-01` は Due 10-08。

## 関連ドキュメント・施策

- 前週レビュー: `.claude/skills/management/weekly-review/reference/reviews/2026-W40.md`
- 週次snapshot: `.claude/skills/management/nsm-experiment/reference/weekly-snapshots/2026-W40.json`
- 月次計画: `.claude/todo/monthly.md`（2026-10）
- backlog: `DATA-QUALITY-LOOP-01` / `A8-CROSSCHECK-EXCEED-01` / `EFFECT-TARGET-MARKERS-01` / `AUTHENTICATED-MEASUREMENT-ACTIVATION-01` / `STATE-OVERLAY-MAIN-01` / `AUTH-CREDENTIAL-REGISTER-01` / `MODEL-OPT-APPLY-01`
- 改善施策: `AFF-RESOLUTION-EFFECT-01` / `THEME-EXPANSION-EFFECT-01` / `PERF-WORKER-P99-01` / `R2-STORAGE-01`
- データ品質キュー: `.claude/state/data/data-quality/LATEST.md`
- KDP state: `.claude/state/products/kdp-weekly-publication.json`

## 次週への申し送り候補

- データ品質の「更新」と決めた指標の R2 反映を 1 回の承認にまとめる
- `EFFECT-TARGET-MARKERS-01` のオーナー判断を W42 Must で反映する
- 再認証後の `measurement-freshness` の値を W41 の計測サイクルで確かめる
