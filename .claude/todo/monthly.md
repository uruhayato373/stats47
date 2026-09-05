---
title: 今月の重点
type: monthly-plan
month: 2026-08
updated: 2026-08-30
status: active
focus_themes:
  - 課金無効Gemini APIの少量日次生成を品質ゲート付きで検証する
  - 公開中の誤値・欠測を解消する
---

# 2026年8月の重点

7月に検索流入は 4 週で +52% 伸びたが、収益は横ばいだった。伸びているのは露出であって収益密度ではない。
8月は新しい収益施策を足さず、**止まっているコンテンツ産出を機械で回復させる**ことと、
**その機械が読む値の誤りを消す**ことに絞る。この 2 つは独立ではなく、後者は前者の前提である。

## 予算前提（Pro 使用量）

- **新しい制約**: 8月から日次生成ループ（ai-content / blog）が対話セッションと**同じ Pro/Max 利用枠**を消費する。
  対話に使える枠は 7月より確実に少ない。
- 1 件あたりの実消費は**まだ 1 度も測っていない**。`.claude/state/metrics/claude-usage/history.csv` は
  2026-08-03 時点で空で、最初の実測は 8/4 の cron が最初。件数の追加引き上げは実測を見てから決める。
- 方針: 重点 2 テーマに集中する。下記「今月やらないこと」は 9 月以降へ送る。

## 前月の振り返り

| 前月の重点テーマ | ゴール | 結果 | 原因 / 申し送り |
|---|---|---|---|
| データ・計測・コストの正しさ | 誤値・欠測の処置確定 / R2 再増加の機械検知 / localhost 遷移の比較可能化 | **一部** | R2 は 25.53→15.75GB の削減が 6 日定着し GC を機械化できた。一方 `IND-DATA-CORRUPTION-01` と `PERF-LOCAL-NAV-01` は **2 週連続で commit 0 件**。どちらも「計測してから判断する」型で着手されにくい傾向が続いている |
| 収益・検索改善の計測ループ | affiliate impression の実測 / ASP の positive-only 追跡 / 検索週次出力 | **一部** | `AFF-IMPRESSION-RENAME-01` は達成（impressions 3,400・vertical 内訳あり・`unsetVerticalRatio 0`）。`ASP-CONTINUITY-01` は Phase 0/1 まで。`SEARCH-GROWTH-CYCLE-01` は候補 3 件が承認待ちで運用開始に至らず |

7月の最大の副作用は**コンテンツ産出の停止**だった。W31 のブログ新規公開 0 本・品質是正 0 本・
ai-content は 08-01 以降増加 0 件。PR 34 件の大半が品質ゲートと CI に向いた。

## 現状サマリー

| 指標 | 現在値 (2026-W31) | 4週前 (W27) | 変化 |
|---|---|---|---|
| GSC clicks (rolling 28d) | 3,424 | 2,244 | **+52.6%** |
| GSC impressions (rolling 28d) | 101,093 | 80,868 | +25.0% |
| GSC 平均順位 | 8.06 | 8.96 | 0.90 改善 |
| NSM engagedSessions (finalized 7d) | 1,700 | — | +0.5% (WoW) |
| AdSense earnings (7d) | ¥146 | ¥128 | +14.1%（W24 は ¥163・**実質横ばい**） |
| AdSense page views | 4,054 | 2,862 | +41.6% |
| **AdSense page RPM** | **¥36** | **¥45** | **-20.0%** |
| AdSense viewability | 54.3% | 60.9%（W24: 69.4%） | **-6.6pp（月頭比 -15.1pp）** |
| 公開ブログ記事 | 431 本 | — | W31 の新規は **0 本** |
| ranking ai-content done | 208 / 2,176 (9.6%) | — | 消化 3.0 件/日・残 1,968 |
| R2 storage | 15.75GB | 25.53GB (07-26) | -38%（無料枠 10GB 超過は継続） |
| 改善バックログ effect/pending | 20 件 | — | due が 8/24 に集中（8/2 の AdSense 5 件は 9/14 へ再配置） |

**今月最も重要な 1 行**: PV は 4 週で +41.6% 伸びたのに earnings は横ばいで、page RPM が -20%、
viewability が -15pp 落ちている。つまり**露出を増やしても収益に変換できていない**。
ただし原因の切り分けは 8月には行わない（理由は「今月やらないこと」）。

## GSC運用サイクル

GSCは重点テーマ数に含めない健康管理の床とし、検索施策を採用しない月でも計測→review→判断→effectを止めない。

| 項目 | 最新（2026-08-24監査） | 月内評価 | 次アクション |
|---|---|---|---|
| 計測→週次review | snapshot W34 / review W34 / plan W35 | **PASS** | 次回も finalized snapshot → review → plan の順で接続 |
| search-growth判断 | W35候補880件、approved 1件、WIP 1/5 | **PASS** | soft-404候補を9/7・9/21・10/19に再計測。週2件上限を維持 |
| effect判定 | W34 7件すべてpending | **WARN**（既知target欠落7件、新規0件） | 推測で補わず、終了または再計測を週次で判断 |
| index coverage | URL Inspection日次は稼働 / 週次coverage表示は旧世代 | **WARN** | URL Inspectionとremediation queueを週次レビューの正典にする |

機械監査は`.claude/state/metrics/gsc/operations-cycle-LATEST.{json,md}`、閾値は
`.claude/config/gsc-operations-cycle.json`をSSOTとする。月曜20:30のworkflowがFAIL時だけ固定Issueを更新する。

## 今月の重点テーマ

### 重点1: Claude 無人生成を廃止し、Gemini 無料枠の少量日次へ移行する

- **なぜ変えたか (2026-08-21)**: 無人の日次ループは対話セッションと同じ Pro/Max 利用枠を食う。
  月初は「定着させる」方針だったが、歩留まりが崩れて**枠だけ削って成果が出ない**構図になった
  (`.claude/state/metrics/claude-usage/history.csv`):

  | 日 | limit | items | cost |
  |---|---:|---:|---:|
  | 08-15〜08-18 | 5 | 5 / 5 / 5 / 5 | $79〜$90 |
  | **08-19** | 5 | **0** | $87.31 |
  | **08-20** | 5 | **1** | $21.33 |

  2 日で $108 を使って成果 1 件。`ai-content-generate-daily.yml` と `blog-generate-daily.yml` を
  削除し、**量と時期を人が決める**運用へ移した。公開経路 (`publish-ai-content.yml` /
  `blog-auto-publish.yml`) と機械ゲートはそのまま残る。

- **方針改定 (2026-08-30)**: Claude Code/OAuth の定期生成は復活させない。
  課金無効の専用 Google AI Studio project の `GEMINI_API_KEY` で、`gemini-2.5-flash-lite`
  を既定 3 件/日・並列 1 で回す。author と critic は別 API リクエスト、公開は
  決定的監査と critic PASS の両方を必須にする。無料 quota 実測前は件数を上げない。

- **今月の本数目標**:
  - **blog: 月 17-19 本**。既存の `.claude/state/blog/seo-strategy.json` の `typeMix.perMonth`
    (B5 / D2 4 / A 3-4 / F3 / G 1-2 / C_E 1-2) をそのまま SSOT として使う。**新しい数値を作らない。**
    月初からの実績を差し引いた残りを、残り週で割って weekly の Must に置く。
  - **ai-content**: Gemini 日次 3 件/日は 08-30 から鍵の課金枯渇で停止中 (是正はオーナー)。在庫 1,445 件は
    **ローカル headless Claude CLI バッチ** (`run-claude-batch.sh`・35 件/push・人が量と時期を決める) で消化する。
    実測 (09-05 batch3・35 件・concurrency 2): 通過率 71%、公開 1 件 ≈47K トークン・$0.81 API 換算、35 件 ≈50 分、
    レート制限なし。「Gemini 3 件/日、在庫は目標にしない」の前提だった 1 件 $17 (Agent tool 経路) は崩れた。
    **今月は 1 日 1〜2 バッチ (35〜70 件) から始め、`claude-error_*` が出た日はそこで止める**。09-05 に 54 件公開
    (done 718 → 772・残 1,394)。正典 `ranking-content-standards.md` §2026-09-05。

- **今月のゴール（月末に検証可能）**:
  1. Claude Code/OAuth の ai-content 日次 workflow は廃止のまま
  2. `ai-content-gemini-daily.yml` が日次実行し、対象ありで生成 0 件なら必ず失敗する
  3. 通過分が publish workflow の明示 dispatch で R2 まで届き、後続 run の成功を親 workflow が待つ
  4. outbox 滞留が 0 件
  5. 通過率・リクエスト数・トークンが metrics に残る

- **未達のときの扱い**: **翌週へ積み増さない。** Must が形骸化するため、足りなければ
  月次の目標側を下げてその根拠を書く。

- **構成タスク**:
  - 週次レビューで Gemini の通過率・quota 失敗・outbox 滞留を確認する [S]（毎週）
  - `AICONTENT-DBLESS-REBUILD`: needs-regen の内訳で優先度を切り、全件量産を前提にしない
    件数設計へ改める [M]
  - ブログ品質是正キュー（`/brushup-blog --target queue`）を週次の枠に載せるか判断する [M]

- **依存・ブロッカー**: 課金無効の専用 Gemini API key。無料 quota の実測が出るまで日次件数を増やさない。

- **真実源リンク**: `backlog.md#AICONTENT-DBLESS-REBUILD` / `.claude/state/blog/seo-strategy.json` /
  `.claude/state/metrics/ai-content/`

### 重点2: 公開中の誤値・欠測を解消する

- **なぜ今月これか**: `DATA-ESTAT-FETCH-01` / `DATA-MANUAL-RESTORE-01` の
  2件が未完了のまま due 8/24 を迎えた。さらに重点1 と結合している — コンテンツ生成は R2 の値を読むため、
  値が誤っていれば生成物は誤った値を忠実に記述し、**数値照合ゲートは「一致」として通してしまう**
  （`ranking-content-standards.md` が明記する既知の型）。産出を増やす前に値を直す必要がある。

- **今月のゴール（月末に検証可能）**:
  1. `DATA-ESTAT-FETCH-01` の 25 metric すべてに「config 修正 / 代替統計 / 一時非公開」の処置が決まっている
  2. `DATA-MANUAL-RESTORE-01` の 12 metric に provenance 付きの処置結果が付いている

- **構成タスク**:
  - `DATA-ESTAT-FETCH-01`: 25 metric を statsDataId / cdCat / 失敗種別で分類し処置を決める [L]（→ W35）
  - `DATA-MANUAL-RESTORE-01`: 12 metric の一次ファイル再取得と照合 [L]（→ W35）

- **依存・ブロッカー**: R2 write と本番反映はユーザー承認が要る。誤値の推測補正は禁止（計算補正だけで直さない）。

- **真実源リンク**: `improvements.md`（`DATA-ESTAT-FETCH-01` / `DATA-MANUAL-RESTORE-01`）

## 今月やらないこと（予算のため意図的に見送る）

- **AdSense の枠追加・配置変更・lazy-load 閾値の調整** — RPM -20% / viewability -15pp は観測できているが、
  7/3 に 4 施策を同時デプロイしたため 6 件の effect 判定がすべて交絡しており、**今 1 つ動かすと次も判定不能になる**。
  `ADSENSE-CYCLE-02`（due 9/14）の「公式 CPC・format・placement・bid type を 2 週取得」だけを回し、
  変更は 9 月以降。8 月に許すのは**計測だけ**。
- **`PERF-LOCAL-NAV-01`（localhost 遷移の高速化）** — 2 週連続未着手。ただし本番 PSI の詳細ページ LCP 遅延
  （/ranking/agricultural-output 32・LCP 6,956ms）とはスコープが別で、収益に効くのは本番側。
  localhost 側は 9 月へ送り、本番 LCP は重点1 の産出が安定してから起票する。
- **SNS の新規展開と滞留解消** — X 92 件 / YouTube 30 件が scheduled で滞留し、`posts.json` の
  メトリクスは 3 か月古い。ただし Organic Social は GA4 で 8 users（-60%）で、投入工数に対する
  リターンが最も小さい。**投稿台帳の SSOT drift 是正（IG 21 件が `posts.json` に無い）だけ**を小タスクで行う。
- **商品チャネル（ココナラ / Kindle）の新規展開** — 収益優先順位 4。無料需要の確認が先。
- **search-growth 候補の大量承認** — 上限 2 件/週。3 候補のうち `server-risk::/opengraph-image` は
  証拠が stale なので承認前に再実測が要る。
- **UI の見た目を伴う新規リデザイン**、**未検証 e-Stat 候補の一括投入**、**明示承認のない本番デプロイ・R2 write**。

## 週への配分（ガイド・週次計画が詳細化）

| 週 | 期間 | 主に進める重点 | マイルストーン |
|---|---|---|---|
| W35 | 08-24〜08-30 | 重点2 + 重点1 | 手動12 metricの再取得 / blog 2本 |
| W36 | 08-31 | 集約 | 月末判定と 9 月計画の入力づくり |

## 批判的レビュー

1. **重点は 2 つに収まっているか** — はい。3 つ目の候補（AdSense 収益密度）は「今月やらないこと」へ明示的に送った。
   交絡した状態で触ると 9 月も判定不能になるため、8 月は計測のみに限る判断。
2. **先月と同じテーマを置いて、また未達では** — 重点2 は 7 月重点1 の残りで、そのとおり再掲になる。
   ただし 7 月に倒せなかった原因は「粒度が大きすぎた」ではなく**着手されなかった**ことなので、
   今月は W32 の Must に**照合作業だけ**を置き（修正・反映は W33 に分ける）、
   2 週連続で commit 0 なら Must から外して owner を変えるという停止条件を付ける。
3. **予算内で終わるか** — L タスクが 2 つ（`DATA-ESTAT-FETCH-01` / `DATA-MANUAL-RESTORE-01`）あり、
   これだけで 1 テーマ分の重さがある。加えて日次ループが利用枠を未知量だけ食う。
   **重点1 の実作業の大半は「観測と判断」で実装が軽い**ため実装枠は重点2 に寄せられる想定だが、
   W33 のトークン実測で枠が想定より厳しいと分かった場合は、`DATA-MANUAL-RESTORE-01`（12 件）を
   9 月へ送って重点2 を 25 metric の分類までに縮める。
4. **産出量を増やすこと自体が目的化していないか** — なりやすいので、重点1 のゴールに「本数」だけでなく
   「型配分との整合」と「1 件あたりトークンの実測」を入れた。月 84 本を無検証で出すのは、
   7 月に起きた「ゲート整備がコンテンツを押し出す」の逆側の失敗になる。

## 関連ドキュメント

- 収益化戦略: [../00_プロジェクト管理/02_収益化戦略.md](../00_プロジェクト管理/02_収益化戦略.md)
- 今週: [週間計画](weekly.md)
- 改善: [改善バックログ](improvements.md)
- 機能: [バックログ](backlog.md)
- 指標: [指標カード (バックログ内)](backlog.md)
- 前週レビュー: `.claude/skills/management/weekly-review/reference/reviews/2026-W31.md`
