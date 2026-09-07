---
title: 今週の計画
type: weekly-plan
week: 2026-W37
updated: 2026-09-07
status: active
---

# 2026-W37 今週の計画

期間: 2026-09-07（月）〜 2026-09-13（日）。WIP 上限は 5 件。
status と期限は各バックログを正典とし、ここには週内に検証できる成果だけを置く。

## 今月の重点（月次計画より）

- **重点1**: 溜まった未デプロイを本番へ届けて、止まっている実測を再開する
- **重点2**: 公開しているものが正しいかを確定させる

月次の週配分では、W37 は「W36 の週次レビュー作成 / GA4 アフィリエイト cron の stale 解消 /
91 記事の背景生成着手 / 25 metric の分類」を担当する。今週の Must 3 件はこの 4 つのうち
私が完了まで持てる 3 つで、背景生成はオーナー作業のため Should に置いた。

## 前週の振り返り（W36 レビュー作成済み）

W36 固有の週次計画は無かったが、**2026-W36 の週次レビューは `b0d6d01f8` で作成済み**。
実績の正典は `.claude/skills/management/weekly-review/reference/reviews/2026-W36.md`。
以下の持ち越し表は W35 起点であり、W36 実績（ai-content done 371→861、新規ブログ18本）と
9月7日・W37 の全件生成完了を混同しない。

W35 レビューが確定させた事実（達成率 1/6）:

| W35 のタスク | 分類 | 状態 | W37 での扱い |
|---|---|---|---|
| `DATA-MANUAL-RESTORE-01` 12 metric | Must | 未達 | 月次配分どおり **W38** へ。今週は積まない |
| ブログ 2 本の手動生成 | Must | 超過達成（規律違反・85 本公開） | 今月は新規公開を止める。今週も 0 本 |
| `DATA-ESTAT-FETCH-01` 25 metric | Should | 未達 | **今週 Must へ昇格**（3 週連続の未着手） |
| ブログ品質是正 1 本の実証 | Should | 未達 | Could（月次で「今月これ 1 本だけ」と決めた分） |
| `RANKING-KEYS-SYNC-01` の実走確認 | Should | 一部（W36 の 8/31 run で確認） | 完了として扱い再掲しない |
| GA4 Unassigned の閾値監視 | Could | 未達 | 今週は積まない（収束済み・再発閾値待ち） |

**パターン分析**: W34・W35 とも「Must の一方だけが計画外の形で達成され、残りは着手されない」
という同じ形である。W35 レビューはこれを「並行セッションが `weekly.md` を参照せずに走れる構造」と
特定した。今週も調査タスク 4 件が別セッションで走っているので、**この計画では重複して積まず、
Must は私が単独で完了まで持てる粒度だけにする**。

## 現状サマリー

| 指標 | 現在値 | 前週 | 判断 |
|---|---:|---:|---|
| GSC clicks（確定7日 W36） | 1,998 | 1,473 | +35.6%。3 週連続で上昇 |
| GSC impressions（確定7日 W36） | 61,829 | 42,756 | +44.6% |
| GSC 平均順位（確定7日 W36） | 7.45 | 7.64 | 改善 |
| GSC clicks（ローリング28日 W36） | 6,053 | 4,921 | 機会発見用。WoW 判定には使わない |
| ranking ai-content done | 2,154 / 2,154（100%） | — | 在庫消化は完了。品質確定は重点2 のゴール2 |
| ブログ是正キュー | pending 270 / must-fix 33 / done 21 | pending 270 | 母数が 8 月の 85 本公開で増えたまま |
| 公開待ちブログ | **96 本**（背景あり 23 / なし 73） | 91 本 | 背景あり 23 本は今週公開できる |
| GA4 アフィリエイト snapshot | 2026-08-28（10 日 stale） | 同左 | Must 2 で解消する |
| 改善バックログ active | 31 行（Tier1 11 / Tier2 16 / Tier3 4） | 42 行 | 09-07 の整理で Due 超過 0 件 |
| search-growth | 候補 1,060 / approved 1 / dismissed 1 | 同左 | 週 1〜2 件の採択が未開始 |
| GSC 運用サイクル | WARN | WARN | 既知の過去欠落 7 件のみ。必須工程は PASS |

**今週最も重要な 1 行**: 検索は確定 7 日でも +35.6% で伸び続けているのに、収益への変換
（未デプロイ 4 束）と計測（GA4 10 日 stale）の両方が閉じたままである。今週はこの 2 つの
うち**計測側を私が閉じ**、デプロイ側は可否の判断まで進める。

## 今週の新しい発見（本日 2026-09-07 の実測）

1. **`affiliate-ga4-weekly.yml` は失敗していない。** 直近 run 34044001551（2026-09-06・
   success・2m35s）まで毎週成功している。にもかかわらず `.claude/state/ads/ga4-affiliate-*.json`
   が 08-28 で止まっているのは、workflow が state を `actions/upload-artifact`（retention 30 日）
   へ上げるだけで **commit-back していない**ためである（`.github/workflows/affiliate-ga4-weekly.yml`
   の 97-106 行）。つまり 09-06 のデータは artifact として存在する。cron 障害ではなく
   受け取り口の欠落なので、今週中に閉じられる。

2. **公開待ち 96 本のうち 23 本は既に背景画像がある。** `published: true` の記事 96 件に対し
   `apps/web/scripts/lib/assets/blog-article-backgrounds/<slug>.jpg` が存在するのは 23 件。
   `blog-auto-publish.yml` は背景の無い 1 件で run 全体が止まる（`BLOG-PUBLISH-THUMBNAIL-GUARD-01`）
   ため、73 件の背景を待たずとも **guard を直すか `-f slugs=` で明示すれば 23 本は今週出せる**。

3. **`data-refresh.yml` が 2026-09-06 に失敗している**（run 34017315294・「十大費目11指標の
   R2 反映を data-refresh へ依頼」）。重点2 の隣接領域なので Should に置いた。

## Must（3 件）

- [x] **2026-W36 の週次レビューを作成する**（重点1・重点2 の入力・S）
  - 対象期間 2026-08-31〜2026-09-06。**W36 は計画が存在しなかった**ので、計画 vs 実績の表は
    作らず「計画なしの週に何が実行されたか」を git log と state から再構成する。
  - `b0d6d01f8` で作成済み。9月7日の生成は W37 の実績で、決定的 backfill は残863件。
    全量差分をすべてテンプレート生成と扱わない。詳細は月次計画と ai-content memory を参照する。
  - **成功基準**: `reference/reviews/2026-W36.md` が存在し、W37（今週）の実績を来週判定できる
    baseline が書かれている。GSC 運用サイクルの「計測 → 週次 review」WARN が解消する。
  - 使用スキル: `/weekly-review 2026-W36`

- [ ] **アフィリエイト GA4 の 10 日 stale を解消する**（重点1 ゴール2・S）
  - 原因は本日特定済み（上記「新しい発見」1）。cron は成功しており、state が commit-back
    されていないだけである。**「cron が失敗している」という前提で再調査しない。**
  - 手順: ① run 34044001551 の artifact `affiliate-portfolio-state` を取得して
    `.claude/state/ads/` へ展開する。② 09-06 時点の vertical 別 imp / click が読めることを
    確認する。③ workflow に commit-back を足すか、取得を週次運用の手順として明文化するかを
    決めて記録する（どちらでもよいが、決めずに終わらせない）。
  - **成功基準**: `.claude/state/ads/ga4-affiliate-*.json` の最新が 7 日以内になり、
    `AFF-BLOG-TEXTLINK-01` / `AFF-A8-REGISTER-01` の「実測が取れない」というブロッカーが
    解消する（判定そのものは今週やらない。**デプロイ前の baseline として記録するに留める**）。
  - **停止条件**: artifact が期限切れ（retention 30 日）で取れない場合は、
    `fetch-affiliate-ga4.cjs` の手動実行に切り替えず、workflow を再実行して取り直す。

- [ ] **`DATA-ESTAT-FETCH-01` の 25 metric に処置区分を付ける**（重点2 ゴール1・L）
  - 3 週連続で Must に載りながら着手 0 件。月次はこれを受けて**ゴールを「処置区分の決定」まで
    縮めた**。修正の実行と R2 反映は 10 月へ送る。今週は判定だけを終える。
  - 手順: ① 25 metric を statsDataId / cdCat / 失敗メッセージで分類し、同じ入力の再実行を止める。
    ② 各 metric を `config修正 / 代替統計へ置換 / 一時非公開 / blocker` のいずれかに決める。
    ③ 判断できないものは推測で埋めず `blocker` と理由を残す。
  - **成功基準**: 25 件すべてに処置区分と根拠が付いている。**R2 write と公開は行わない。**
  - **停止条件**: 月次のとおり、今週も処置決定が 0 件で終わったら Must から外して owner を
    変える（2 週連続 0 件が停止条件。今週が 1 週目）。着手できない理由が粒度なのか
    別のものなのかを、W37 レビューで必ず言語化する。

## Should（4 件）

- [ ] **デプロイ可否を判断して記録する**（重点1 の前提・M）
  - 本番には確認済みの回帰が 2 件ある（`RSC-CACHE-BYPASS-01` / `PERF-RANKING-LCP-03`）。
    どちらも別セッションが調査中なので**調査そのものは重複して行わない**。
  - 今週やるのは判断だけ: 調査結果が戻ったら「4 束を出す / 出さない」を決めて記録する。
    戻らなければ「戻らなかった」と記録し、月次の重点1 ゴールを
    「デプロイ完了」から「デプロイ可否の判断と前提の解消」へ書き換える提案を月次へ差し戻す
    （月次の批判的レビュー 4 がこの分岐をあらかじめ指示している）。
  - **どちらの分岐も週内で終端する**ので、結果に関わらず今週完了できる。
  - **成功基準**: 判断とその根拠が本ファイルまたは `backlog.md` の該当カードに残っている。
  - **停止条件**: デプロイの実行はオーナーの明示承認まで行わない（`branch-workflow.md`）。

- [ ] **`BLOG-PUBLISH-THUMBNAIL-GUARD-01`（per-slug skip）を直す**（重点1 ゴール4・S）
  - 背景の無い 1 件で run 全体が止まる構造を、該当 slug だけ SKIPPED に積んで次へ進む形にする。
    ci-factual-gate と quality-gate は既にこの形なので、thumbnail 生成以降を揃えるだけである。
  - **成功基準**: 背景の無い slug を 1 件混ぜた run で、他の slug が公開されることを実測する
    （全 PASS は「何も見ていない」と区別が付かないので、混ぜずに緑になっただけでは完了としない）。
    Step Summary に skip 理由が残ることまでを条件に含める。
  - これが通れば背景済み 23 本が 73 本を待たずに公開できる。**公開の実行は別途承認を得る。**

- [ ] **公開待ち 73 記事の背景画像を生成する**（重点1 ゴール4・L・**owner: uruhayato373**）
  - Codex MCP はクラウドセッションで `ENOENT` になるため、ローカル Mac の
    Codex built-in imagegen が必須。私が代行できない。
  - 公開前の記事なので `--article <article.md>` を必ず付ける（省くと R2 404）。
    ```bash
    npm run blog-images:codex -- request-article --slug <slug> \
      --article "docs/21_ブログ記事原稿/<slug>/article.md"
    ```
  - **成功基準**: 今週中に 73 件のうち一定数が git tracked の
    `blog-article-backgrounds/<slug>.jpg` として存在する。月次の判断点は W38 時点で
    残り 30 件を切っているかで、切っていなければ 96 本を分割公開へ切り替える。

- [ ] **`data-refresh.yml` の失敗 run を切り分ける**（重点2 の隣接・S）
  - run 34017315294（2026-09-06・「十大費目11指標の R2 反映を data-refresh へ依頼」）が
    3m35s で failure。11 指標の R2 反映が止まっている。
  - **成功基準**: 失敗が入力（request の指標指定）側か e-Stat 取得側かが判明し、
    `DATA-ESTAT-FETCH-01` の 25 件と同じ原因かどうかが言える。**再実行を先に試さない**
    （同じ入力の無意味な再実行を止めるのが `DATA-ESTAT-FETCH-01` の手順1 でもある）。

## Could（2 件）

- [ ] **ブログ品質是正を 1 本だけ通す**（S/M）
  - 月次で「今月やるのはこの 1 本だけ」と決めた分。must-fix は 33 件あるが数は積まない。
  - `/brushup-blog --target queue --next 1` → quality-gate → blog-critic PASS → mark-done。
  - **成功基準**: queue の done が 21 → 22 になり、その 1 本が critic PASS を得ている。
    3 週連続で未達なので、**今週も通らなければ原因を W37 レビューに書く**。

- [ ] **search-growth の採択を 1 件だけ開始する**（S）
  - `SEARCH-GROWTH-CYCLE-01`。候補 1,060 件に対し approved 1 / dismissed 1 で、
    週 1〜2 件の採択サイクルがまだ始まっていない。ゴールは消化速度ではなく**開始**である。
  - `npm run search-growth:triage` の 3 件から、証拠を確認できた 1 件だけを承認する。
  - **停止条件**: 一括 title 書き換えはしない。上限は週 2 件のまま変えない。

## GSC 運用サイクル

`node .claude/scripts/gsc/audit-operations-cycle.mjs --stage review-input`（2026-09-07 実行）

- 全体 **WARN**。必須工程（snapshot-period / snapshot-freshness / effect-verdict /
  effect-backlog-reconciliation / search-growth-freshness / search-growth-sources /
  url-inspection-freshness）は **すべて PASS**。
- 唯一の WARN は `effect-target-ratchet` の**既知の過去欠落 7 件（新規欠落 0）**。
  想定効果値を推測で補わない。終了させるか再計測するかはオーナーが決める（W35 レビューの
  申し送り 4 と同じ項目で、3 週持ち越している）。
- 承認済み候補 `soft-404-risk::/ranking/barber-beautician-annual-income` の判定日:
  14 日 = 2026-09-07（**今週到来**）/ 28 日 = 09-21 / 56 日 = 10-19。今週は追加改修をしない。

## 今週やらないこと

- **ブログの新規記事生成・大量公開** — 月次で「公開待ちを出したらそれ以上作らない」と決めた。
  8 月に W35 だけで 85 本公開して是正キューの母数が 227 → 270 に増えた分を、まず止める。
- **`DATA-MANUAL-RESTORE-01` の 12 metric** — 月次配分どおり W38。今週は 25 metric に集中する。
- **AdSense の再開判断・枠追加・配置変更** — 停止 28 日の before/after が揃うまで動かさない。
- **並行実行中の 4 調査**（PSI dom_size collector / LCP 回帰の topology-fetch 交絡 /
  壊れた内部リンク 6 件 / RSC キャッシュ）— すでに人手が動いている。重複して積まない。
- **本番デプロイ・R2 write・CDN purge・外部投稿** — 必要になった時点でオーナー承認を得る。
- **KDP・ココナラ・商品チャネルの新規展開**、**SNS の新規展開**、**R2 容量削減の実作業**、
  **search-growth 候補の大量承認** — いずれも月次の「今月やらないこと」に従う。

## 批判的レビュー

1. **技術的に楽しいだけの Must が入っていないか** — Must 3 件はいずれも収益か公開品質に
   直結する。Must 2（GA4 stale）は一見すると計測の内輪作業だが、これが閉じないと
   `AFF-RESOLUTION-EFFECT-01` を含む 3 件の効果判定が永久に開かないので、
   「収益がいくらか言えない」状態そのものを解く。

2. **先週と同じ失敗を繰り返していないか** — 繰り返しかけている。`DATA-ESTAT-FETCH-01` は
   3 度目の掲載である。月次の指示どおり①ゴールを処置決定まで縮め、②停止条件を明記した。
   加えて今週は **Must を私が単独で完了まで持てるものだけにした**（背景生成はオーナー作業
   なので Should へ、デプロイは判断だけを Should へ）。W34・W35 で倒れた Must はどちらも
   「他者の作業か承認に依存するもの」だった。

3. **今週やらないと機会損失になるものは** — GA4 artifact の retention が 30 日なので、
   09-06 の run 34044001551 は **10 月上旬に消える**。Must 2 を先送りすると
   デプロイ前 baseline を失い、`AFF-RESOLUTION-EFFECT-01` の before/after が組めなくなる。

4. **W36 の計画欠落をどう扱うか** — レビューは事後作成済み。W36 は新規ブログ18本、
   ai-content done +490。9月7日の全件生成完了は W37 の実績へ分離する。
   計画外で仕事が進む構造は W35 レビューが特定した課題であり、計画作成済みとは扱わない。

5. **Must 3 件・Should 4 件は多すぎないか** — Should のうち 1 件はオーナー作業（背景生成）、
   1 件は判断のみ（デプロイ可否）なので、私の実作業は Must 3 + Should 2 である。
   ただし Must 3 が L なので、**Must 3 が動かない週になったら Should には手を付けない**。

6. **Due 9/21 に 22 件が集中している件** — 09-07 の一括整理の副作用で、その日に 22 件を
   判定できるという意味ではない。今週は触らず、W39 の週次計画で実態に合わせて再配置する
   （月次の批判的レビュー 5 のとおり）。

## 完了条件

- チェックは**成果物・実測値・再現コマンドが揃った場合だけ**付ける。
- WIP は Must 3 件 + 着手中 Should 最大 2 件まで。新規着手時は 1 件閉じる。
- 未達を翌週へ自動加算しない。足りなければ月次の目標側を根拠付きで下げる。
- **作業ツリーを並行セッションと共有している。** 同日 13:42 に `backlog.md` の編集が
  別セッションのコミットで上書きされる事故が起きている。同じファイルを長時間開いたままにせず、
  まとまった単位で書き切る。

## 参照

- 今月: [月間計画](monthly.md)
- 改善: [改善バックログ](improvements.md)（`DATA-ESTAT-FETCH-01` / `AFF-IMPRESSION-ROUTING-01` /
  `ADSENSE-PAUSE-01` / `AFF-RESOLUTION-EFFECT-01` / `AFF-BLOG-TEXTLINK-01` / `AFF-A8-REGISTER-01` /
  `SEARCH-GROWTH-CYCLE-01` / `COVERAGE-LOOP-01`）
- 機能: [バックログ](backlog.md)（`AFF-DEPLOY-RESOLUTION-01` / `GSC-COVERAGE-DEPLOY-01` /
  `BLOG-BACKGROUND-BATCH-01` / `BLOG-PUBLISH-THUMBNAIL-GUARD-01` / `RSC-CACHE-BYPASS-01` /
  `PERF-RANKING-LCP-03`）
- 前週レビュー: `.claude/skills/management/weekly-review/reference/reviews/2026-W36.md`（作成済み）
- GSC cycle audit: `.claude/state/metrics/gsc/operations-cycle-LATEST.md`
- search-growth: `.claude/state/search-growth/{health,candidates}.json`
- ブログ是正キュー: `.claude/state/blog/remediation-queue.json`（2026-09-06 生成）
- ai-content の現況: `.claude/state/ai-content/LATEST.md`（2026-09-06 生成）
